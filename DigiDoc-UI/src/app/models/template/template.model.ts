import {TemplateField} from './template-field.model';

export interface Template {
  id?: number;
  name: string;
  description: string;
  htmlContent: string;
  xmlTemplate?: string;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  createdByUserId?: string | null;
  fields: TemplateField[];
  createdAt?: Date;
}
