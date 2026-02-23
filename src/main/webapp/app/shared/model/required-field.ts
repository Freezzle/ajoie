export enum FieldType {
    TEXT = 'TEXT',
    DATE = 'DATE',
    NUMBER = 'NUMBER',
    PICKLIST = 'PICKLIST'
}

export interface RequiredField {
    name: string;
    type: FieldType;
    labelKey: string;
    options?: {id: string, label: string}[];
}
