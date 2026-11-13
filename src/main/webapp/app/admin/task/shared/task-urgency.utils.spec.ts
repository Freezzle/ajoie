import {formatSalonOffset, offsetFromSalon, parseSalonOffset} from './task-urgency.utils';

describe('task-urgency.utils — échéance relative au salon', () => {
    describe('parseSalonOffset', () => {
        it('lit les formes « J±N »', () => {
            expect(parseSalonOffset('J-14')).toBe(-14);
            expect(parseSalonOffset('j +3')).toBe(3);
            expect(parseSalonOffset('J - 7')).toBe(-7);
        });

        it('lit le jour J sous ses différentes écritures', () => {
            expect(parseSalonOffset('J')).toBe(0);
            expect(parseSalonOffset('J0')).toBe(0);
            expect(parseSalonOffset('Jour J')).toBe(0);
        });

        it('accepte un nombre seul', () => {
            expect(parseSalonOffset('-14')).toBe(-14);
            expect(parseSalonOffset('3')).toBe(3);
        });

        it('refuse ce qui n\'est pas un décalage', () => {
            expect(parseSalonOffset('')).toBeNull();
            expect(parseSalonOffset('demain')).toBeNull();
            expect(parseSalonOffset('J-1234')).toBeNull();
            expect(parseSalonOffset(null)).toBeNull();
        });
    });

    describe('formatSalonOffset', () => {
        it('formate les trois cas', () => {
            expect(formatSalonOffset(-14)).toBe('J-14');
            expect(formatSalonOffset(2)).toBe('J+2');
            expect(formatSalonOffset(0)).toBe('Jour J');
        });

        it('renvoie une chaîne vide sans décalage', () => {
            expect(formatSalonOffset(null)).toBe('');
            expect(formatSalonOffset(undefined)).toBe('');
        });

        it('se relit lui-même', () => {
            [-14, -1, 0, 3].forEach(offset => {
                expect(parseSalonOffset(formatSalonOffset(offset))).toBe(offset);
            });
        });
    });

    describe('offsetFromSalon', () => {
        it('compte les jours avant et après le début du salon', () => {
            expect(offsetFromSalon('2026-11-13', '2026-11-27')).toBe(-14);
            expect(offsetFromSalon('2026-11-27', '2026-11-27')).toBe(0);
            expect(offsetFromSalon('2026-11-30', '2026-11-27')).toBe(3);
        });

        it('traverse un changement d\'année', () => {
            expect(offsetFromSalon('2027-01-02', '2026-12-31')).toBe(2);
        });
    });
});
