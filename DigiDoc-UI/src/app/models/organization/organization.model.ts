export interface Organization {
  id: string;
  name: string;
  establishedAt?: Date | null;
  activityDescription?: string;
  adminOrgUserId?: string | null;
  adminOrgUsername?: string;
  adminUsersCount?: number;
  workersCount?: number;
  totalUsersCount?: number;
}
