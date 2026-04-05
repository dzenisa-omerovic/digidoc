export interface TemplateField {
  id?: number;
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
  isAutoDiscovered?: boolean;
}
