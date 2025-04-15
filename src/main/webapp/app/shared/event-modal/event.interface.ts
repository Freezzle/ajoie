export interface EventLog {
  id: string,
  referenceDate: string,
  type: string,
  label: string,
  extraAttributes: { key: string, value: string }[];
}
