import {TemplateField} from './template-field.model';

export interface Template {
  id?: number;
  name: string;
  description: string;
  htmlContent: string;
  xmlTemplate?: string;
  fields: TemplateField[];
  createdAt?: Date;
}
