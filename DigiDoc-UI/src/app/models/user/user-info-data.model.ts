export interface UserInfoData {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  name: string;
  surname: string;
  isFemale: boolean;
  jmbg: string;
  jobTitle: string;
  city: string;
  address: string;
  company: string;
  organizationId: string | null;
  organizationName: string;
  isApproved: boolean;
  isOrganizationApproved: boolean;
  isOrganizationCreationRequest: boolean;
  isOrgAdmin: boolean;
  role: string;
}
