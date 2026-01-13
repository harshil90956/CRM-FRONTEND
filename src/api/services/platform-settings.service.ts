import { httpClient } from '../httpClient';

export type PlatformSettingsDb = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;

  emailNotifications: boolean;
  newTenantAlerts: boolean;
  paymentAlerts: boolean;

  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  sessionDurationMinutes: number;
};

export type PublicPlatformSettingsDb = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
};

export type UpdatePlatformSettingsInput = Partial<PlatformSettingsDb>;

export const platformSettingsService = {
  getPublic: async () => {
    return httpClient.get<PublicPlatformSettingsDb>('/public/settings');
  },

  get: async () => {
    return httpClient.get<PlatformSettingsDb>('/super-admin/settings');
  },

  update: async (input: UpdatePlatformSettingsInput) => {
    return httpClient.patch<PlatformSettingsDb>('/super-admin/settings', input);
  },
};
