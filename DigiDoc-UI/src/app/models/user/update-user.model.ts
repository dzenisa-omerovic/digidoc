export interface UpdateUser {
  name: string;
  surname: string;
  email: string;
  dateOfBirth: Date;
  isFemale: boolean;
  currentPassword: string;
  newPassword: string;
}
