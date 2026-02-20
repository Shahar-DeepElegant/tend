export type CircleId = 'inner' | 'mid' | 'outer';

export type ContactRecord = {
  systemId: string;
  fullName: string;
  nickName: string | null;
  imageUri: string | null;
  description: string | null;
  circleId: CircleId;
  customReminderDays: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = {
  systemId: string;
  fullName: string;
  nickName?: string | null;
  imageUri?: string | null;
  description?: string | null;
  circleId: CircleId;
  customReminderDays?: number | null;
};

export type ContactUpdatePatch = {
  description?: string | null;
  circleId?: CircleId;
  customReminderDays?: number | null;
};

export type ContactLogRecord = {
  id: number;
  contactSystemId: string;
  createdAt: string;
  summary: string;
  wasOverdue: boolean;
};

export type ContactExportRow = {
  systemId: string;
  fullName: string;
  nickName: string | null;
  imageUri: string | null;
  description: string | null;
  circleId: CircleId;
  customReminderDays: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactLogExportRow = {
  id: number;
  contactSystemId: string;
  contactFullName: string;
  createdAt: string;
  summary: string;
  wasOverdue: boolean;
};

export type AppConfig = {
  defaultCadenceInnerDays: number;
  defaultCadenceMidDays: number;
  defaultCadenceOuterDays: number;
  fuzzyRemindersEnabled: boolean;
  shouldKeepRemindersPersistent: boolean;
  reminderNotificationTime: string;
  contactEventsReminderDays: number;
  automaticLogging: boolean;
};

export type AppConfigUpdate = Partial<AppConfig>;

export type ContactEventType = 'birthday' | 'anniversary' | 'custom';

export type ContactEventRecord = {
  id: number;
  contactSystemId: string;
  sourceEventId: string;
  label: string | null;
  eventType: ContactEventType;
  month: number;
  day: number;
  year: number | null;
  nextOccurrenceAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactEventInput = {
  sourceEventId: string;
  label?: string | null;
  eventType: ContactEventType;
  month: number;
  day: number;
  year?: number | null;
  isActive?: boolean;
};

export type NotificationStateRecord = {
  key: string;
  valueText: string | null;
  updatedAt: string;
};

export type GardenContactRow = {
  systemId: string;
  fullName: string;
  nickName: string | null;
  imageUri: string | null;
  description: string | null;
  circleId: CircleId;
  customReminderDays: number | null;
  lastSpokeAt: string | null;
  dueAt: string | null;
  overdueSeconds: number;
  isOverdue: boolean;
};

export type UpNextContactRow = GardenContactRow;

export type LeafProfileData = {
  contact: ContactRecord;
  lastSpokeAt: string | null;
  effectiveCadenceDays: number;
  dueAt: string | null;
  streakCount: number;
  logs: ContactLogRecord[];
};
