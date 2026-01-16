import { getFromSoftCache, httpClient, setToSoftCache } from '../httpClient';

export type UnitStatus = 'AVAILABLE' | 'BOOKED' | 'SOLD' | 'ON_HOLD';
export type UnitType = 'RESIDENTIAL' | 'COMMERCIAL';

export type ManagerUnit = {
  id: string;
  unitNumber: string;
  status: UnitStatus;
  price: number;
  sizeSqFt: number;
  bhk?: number;
  floor?: number;
  tower?: string;
  type: UnitType;
  project: {
    id: string;
    name: string;
  };
};

// Backward/legacy response shape support (current backend may return unitNo + project as string)
type UnitApiAny = any;

export const unitsService = {
  list: async () => {
    const key = `frontend:units:list:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<UnitApiAny[]>('/units');
    setToSoftCache(key, res, 30000);
    return res;
  },

  listManagerUnits: async (): Promise<ManagerUnit[]> => {
    const res = await unitsService.list();
    const units = res.success ? (res.data || []) : [];

    return units.map((u: UnitApiAny): ManagerUnit => {
      const projectObj = u?.project && typeof u.project === 'object' ? u.project : null;
      const projectId = String(projectObj?.id ?? u?.projectId ?? '');
      const projectName = String(projectObj?.name ?? u?.project ?? '');

      const rawStatus = String(u?.status ?? '').toUpperCase();
      const status: UnitStatus = (rawStatus === 'HOLD' ? 'ON_HOLD' : rawStatus) as UnitStatus;

      const rawType = String(u?.type ?? u?.mainType ?? '').toUpperCase();
      const type: UnitType = (rawType === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL') as UnitType;

      return {
        id: String(u?.id ?? ''),
        unitNumber: String(u?.unitNumber ?? u?.unitNo ?? u?.unit_number ?? ''),
        status,
        price: Number(u?.price ?? 0),
        sizeSqFt: Number(u?.sizeSqFt ?? u?.size_sq_ft ?? u?.carpetArea ?? 0),
        bhk: u?.bhk !== undefined ? Number(u.bhk) : u?.bedrooms !== undefined ? Number(u.bedrooms) : undefined,
        floor: u?.floor !== undefined ? Number(u.floor) : u?.floorNumber !== undefined ? Number(u.floorNumber) : undefined,
        tower: u?.tower !== undefined ? String(u.tower) : u?.towerName !== undefined ? String(u.towerName) : undefined,
        type,
        project: {
          id: projectId,
          name: projectName,
        },
      };
    });
  },
};
