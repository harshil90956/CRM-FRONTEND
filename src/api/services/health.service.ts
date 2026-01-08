import { httpClient } from '../httpClient';

type HealthResponse = { status: 'ok' };

export const healthService = {
  getHealth: async () => {
    const res = await httpClient.get<HealthResponse>('/health');
    return res;
  },
};
