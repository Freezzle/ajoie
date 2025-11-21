import {Injectable} from "@angular/core";

export interface Country {
    name: string;
    isoCode: string;
}

@Injectable({providedIn: 'root'})
export class CountryService {
    private readonly countries: string[] = [
        'AL',
        'DE',
        'AD',
        'AT',
        'BE',
        'BY',
        'BA',
        'BG',
        'CY',
        'HR',
        'DK',
        'ES',
        'EE',
        'FI',
        'FR',
        'GR',
        'HU',
        'IE',
        'IS',
        'IT',
        'XK',
        'LV',
        'LI',
        'LT',
        'LU',
        'MT',
        'MD',
        'MC',
        'ME',
        'NO',
        'NL',
        'PL',
        'PT',
        'CZ',
        'RO',
        'GB',
        'RU',
        'SM',
        'RS',
        'SK',
        'SI',
        'SE',
        'CH',
        'UA',
        'VA',
        'MK',
    ];

    getAll(): string[] {
        return [...this.countries];
    }

    getByIsoCode(isoCode: string | null): string | null {
        if (!isoCode)
            {return null;}

        const normalized = isoCode.trim().toUpperCase();
        return this.countries.find(country => country === normalized) ?? null;
    }
}

export function formatterCountry(isoCode: string | null) {
    return 'common.country.' + isoCode;
}