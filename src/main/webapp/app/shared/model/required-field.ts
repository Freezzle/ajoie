export enum FieldType {
    TEXT = 'TEXT',
    DATE = 'DATE',
    NUMBER = 'NUMBER'
}

export interface RequiredField {
    name: string;
    type: FieldType;
    labelKey: string;
}
