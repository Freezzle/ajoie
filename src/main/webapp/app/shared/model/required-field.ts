export enum FieldType {
    TEXT = 'TEXT',
    DATE = 'DATE',
    NUMBER = 'NUMBER',
    PICKLIST = 'PICKLIST',
    CHECKBOX = 'CHECKBOX'
}

export interface RequiredField {
    name: string;
    type: FieldType;
    labelKey: string;
    options?: {id: string, label: string}[];
}
