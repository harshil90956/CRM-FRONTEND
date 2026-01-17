import { httpClient } from '../httpClient';

export type ReminderStatus = 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED';

export type AgentReminderDb = {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  note?: string | null;
  type: string;
  targetType: string;
  targetId: string;
  targetName?: string | null;
  remindAt: string;
  status: ReminderStatus;
  createdBy?: string | null;
  createdAt: string;
};

export type CreateAgentReminderInput = {
  targetType: 'LEAD';
  targetId: string;
  remindAt: string;
  note?: string;
};

export type UpdateAgentReminderInput = {
  remindAt?: string;
  note?: string;
};

export const remindersService = {
  createReminder: async (data: CreateAgentReminderInput) => {
    try {
      return await httpClient.post<AgentReminderDb>('/agent/reminders', data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create reminder';
      return { success: false, message } as any;
    }
  },

  getMyReminders: async () => {
    try {
      return await httpClient.get<AgentReminderDb[]>('/agent/reminders');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load reminders';
      return { success: false, message, data: [] } as any;
    }
  },

  updateReminder: async (id: string, data: UpdateAgentReminderInput) => {
    try {
      return await httpClient.patch<AgentReminderDb>(`/agent/reminders/${id}`, data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update reminder';
      return { success: false, message } as any;
    }
  },

  cancelReminder: async (id: string) => {
    try {
      return await httpClient.del<AgentReminderDb>(`/agent/reminders/${id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to cancel reminder';
      return { success: false, message } as any;
    }
  },
};
