import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

import type { ContactEventInput } from '@/lib/db';
import { getAllContacts, getNotificationState, replaceContactEventsForContact, setNotificationState } from '@/lib/db';

const LAST_EVENT_SYNC_LOCAL_DATE_KEY = 'last_event_sync_local_date';

function toLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMonthOneBased(value: number) {
  const month = value + 1;
  return Math.max(1, Math.min(12, month));
}

function toEventType(label: string | null | undefined): ContactEventInput['eventType'] {
  const normalized = String(label ?? '').toLowerCase();
  if (normalized.includes('anniversary')) return 'anniversary';
  return 'custom';
}

function buildFallbackEventId(date: Contacts.Date, index: number) {
  return `date-${date.label ?? 'event'}-${date.month}-${date.day}-${date.year ?? 'none'}-${index}`;
}

function mapSystemEvents(contact: Contacts.Contact): ContactEventInput[] {
  const events: ContactEventInput[] = [];
  if (contact.birthday?.day && typeof contact.birthday.month === 'number') {
    events.push({
      sourceEventId: 'birthday',
      eventType: 'birthday',
      label: 'Birthday',
      month: toMonthOneBased(contact.birthday.month),
      day: contact.birthday.day,
      year: contact.birthday.year ?? null,
      isActive: true,
    });
  }

  const dates = contact.dates ?? [];
  dates.forEach((date, index) => {
    if (!date.day || typeof date.month !== 'number') return;
    events.push({
      sourceEventId: date.id ?? buildFallbackEventId(date, index),
      eventType: toEventType(date.label),
      label: date.label ?? 'Event',
      month: toMonthOneBased(date.month),
      day: date.day,
      year: date.year ?? null,
      isActive: true,
    });
  });

  return events;
}

async function hasContactsPermission(allowPermissionPrompt: boolean) {
  const current = await Contacts.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!allowPermissionPrompt) return false;
  const requested = await Contacts.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function syncDeviceContactEvents({
  force = false,
  allowPermissionPrompt = true,
}: {
  force?: boolean;
  allowPermissionPrompt?: boolean;
} = {}) {
  if (Platform.OS === 'web') return;

  const granted = await hasContactsPermission(allowPermissionPrompt);
  if (!granted) return;

  const trackedContacts = await getAllContacts();
  for (const trackedContact of trackedContacts) {
    try {
      const systemContact = await Contacts.getContactByIdAsync(trackedContact.systemId, [
        Contacts.Fields.Birthday,
        Contacts.Fields.Dates,
      ]);
      const events = systemContact ? mapSystemEvents(systemContact) : [];
      await replaceContactEventsForContact(trackedContact.systemId, events);
    } catch {
      // Ignore per-contact failures and continue syncing remaining contacts.
    }
  }

  if (force) {
    await setNotificationState(LAST_EVENT_SYNC_LOCAL_DATE_KEY, toLocalDateKey());
  }
}

export async function syncDeviceContactEventsOncePerDay({
  allowPermissionPrompt = true,
}: {
  allowPermissionPrompt?: boolean;
} = {}) {
  const today = toLocalDateKey();
  const lastRun = await getNotificationState(LAST_EVENT_SYNC_LOCAL_DATE_KEY);
  if (lastRun?.valueText === today) return false;
  await syncDeviceContactEvents({ force: true, allowPermissionPrompt });
  return true;
}

export { LAST_EVENT_SYNC_LOCAL_DATE_KEY };
