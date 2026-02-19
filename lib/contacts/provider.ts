import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as Contacts from 'expo-contacts';

export type ImportContact = {
  systemId: string;
  fullName: string;
  nickName: string | null;
  imageUri: string | null;
};

const MOCK_CONTACTS: ImportContact[] = [
  { systemId: 'web-sarah', fullName: 'Sarah Miller', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-01.jpg')) },
  { systemId: 'web-dad', fullName: 'Dad', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-02.jpg')) },
  { systemId: 'web-maya', fullName: 'Maya Torres', nickName: 'Maya', imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-03.jpg')) },
  { systemId: 'web-alex', fullName: 'Alex Kim', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-04.jpg')) },
  { systemId: 'web-jordan', fullName: 'Jordan Patel', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-05.jpg')) },
  { systemId: 'web-rachel', fullName: 'Rachel Adams', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-06.jpg')) },
  { systemId: 'web-mom', fullName: 'Mom', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-07.jpg')) },
  { systemId: 'web-ben', fullName: 'Ben Wyatt', nickName: null, imageUri: imageUriFromModule(require('../../assets/stitch/seedling/images/seedling-img-01.jpg')) },
];

function imageUriFromModule(moduleId: number) {
  return Asset.fromModule(moduleId).uri;
}

function isWebMockEnabled() {
  return Platform.OS === 'web' && process.env.EXPO_PUBLIC_MOCK_CONTACTS_ON_WEB === 'true';
}

function filterByQuery(contacts: ImportContact[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;
  return contacts.filter((contact) => contact.fullName.toLowerCase().includes(q));
}

async function getSystemContacts(): Promise<ImportContact[]> {
  const permission = await Contacts.requestPermissionsAsync();
  if (permission.status !== 'granted') return [];

  const response = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Image],
  });
  return response.data
    .map((contact) => ({
      systemId: String(contact.id),
      fullName: String(contact.name ?? '').trim(),
      nickName: (contact as any).nickname ?? null,
      imageUri: (contact as any).image?.uri ?? (contact as any).imageUri ?? null,
    }))
    .filter((contact) => contact.systemId && contact.fullName);
}

export async function listImportContacts(query: string): Promise<ImportContact[]> {
  if (isWebMockEnabled()) {
    return filterByQuery(MOCK_CONTACTS, query);
  }

  if (Platform.OS === 'web') {
    return [];
  }

  const contacts = await getSystemContacts();
  return filterByQuery(contacts, query);
}

export function canImportContactsOnCurrentPlatform() {
  if (Platform.OS === 'web') {
    return isWebMockEnabled();
  }
  return true;
}
