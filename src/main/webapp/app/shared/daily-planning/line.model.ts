import { Planning } from './planning.model';

export interface Line {
  label: string;
  plannings: Planning[];
}
