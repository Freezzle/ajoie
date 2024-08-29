import { Square } from './planning.model';

export interface Line {
  label: string;
  squares: Square[];
  unusableHours: number[];
}
