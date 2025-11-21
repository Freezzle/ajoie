export enum Category {
    THERAPIST = 'THERAPIST',
    ARTISANAT = 'ARTISANAT',
    MEDIUMNITY = 'MEDIUMNITY',
    ENERGETIC = 'ENERGETIC',
    MISCELLANEOUS = 'MISCELLANEOUS',
    NONE = 'NONE',
}

export function formatterCategory(category: Category | null): string {
    return 'stand.category.list.' + (category ?? 'null');
}
