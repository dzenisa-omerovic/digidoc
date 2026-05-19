export interface UserRegister {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  dateOfBirth: Date;
  name: string;
  surname: string;
  isFemale: boolean;
  organizationId?: string | null;
  createOrganizationRequest?: boolean;
  organizationName?: string | null;
}
