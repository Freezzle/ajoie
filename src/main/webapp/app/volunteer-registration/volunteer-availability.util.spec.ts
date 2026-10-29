import {
    buildFriseSlots,
    presetsFor,
    rangesToIndexes,
    runsToRanges,
    toggleRange,
    toRuns,
    totalHours
} from './volunteer-availability.util';

describe('volunteer-availability.util', () => {
    describe('buildFriseSlots', () => {
        it('génère des cases d\'une heure sur une plage pile', () => {
            const slots = buildFriseSlots('12:00', '18:00');
            expect(slots).toHaveLength(6);
            expect(slots[0]).toEqual({index: 0, start: '12:00', end: '13:00', label: '12h'});
            expect(slots[5]).toEqual({index: 5, start: '17:00', end: '18:00', label: '17h'});
        });

        it('gère un début non pile sur l\'heure (12:30)', () => {
            const slots = buildFriseSlots('12:30', '18:00');
            expect(slots[0]).toEqual({index: 0, start: '12:30', end: '13:30', label: '12h30'});
            // dernière case plus courte : 17:30 -> 18:00
            const last = slots[slots.length - 1];
            expect(last.start).toBe('17:30');
            expect(last.end).toBe('18:00');
        });

        it('rend une dernière case partielle quand la durée n\'est pas un multiple de 60', () => {
            const slots = buildFriseSlots('12:00', '18:30');
            expect(slots).toHaveLength(7);
            expect(slots[6]).toEqual({index: 6, start: '18:00', end: '18:30', label: '18h'});
        });
    });

    describe('toRuns', () => {
        it('regroupe les indexes consécutifs', () => {
            expect(toRuns([0, 1, 2, 4])).toEqual([[0, 3], [4, 5]]);
        });

        it('trie et déduplique', () => {
            expect(toRuns([4, 0, 1, 1])).toEqual([[0, 2], [4, 5]]);
        });
    });

    describe('aller-retour ranges -> indexes -> ranges', () => {
        it('est stable', () => {
            const slots = buildFriseSlots('12:00', '18:00');
            const ranges = [{start: '13:00', end: '17:00'}];
            const indexes = rangesToIndexes(slots, ranges);
            expect(indexes).toEqual([1, 2, 3, 4]);
            expect(runsToRanges(slots, indexes)).toEqual(ranges);
        });

        it('n\'inclut une case que si entièrement couverte', () => {
            const slots = buildFriseSlots('12:00', '18:00');
            // couvre 13:30-15:00 : la case 13:00-14:00 n'est pas entièrement couverte
            const indexes = rangesToIndexes(slots, [{start: '13:30', end: '15:00'}]);
            expect(indexes).toEqual([2]);
        });
    });

    describe('toggleRange', () => {
        it('ajoute tout si incomplet', () => {
            expect(toggleRange([0], 0, 2)).toEqual([0, 1, 2]);
        });

        it('retire tout si déjà complet', () => {
            expect(toggleRange([0, 1, 2], 0, 2)).toEqual([]);
        });
    });

    describe('totalHours', () => {
        it('compte les heures choisies', () => {
            const slots = buildFriseSlots('12:00', '18:00');
            expect(totalHours(slots, [1, 2, 3, 4])).toBe(4);
        });

        it('tient compte d\'une dernière case plus courte', () => {
            const slots = buildFriseSlots('12:00', '18:30');
            // index 6 = 18:00-18:30 = 0.5h
            expect(totalHours(slots, [6])).toBe(0.5);
        });
    });

    describe('presetsFor', () => {
        it('masque matin/après-midi quand identiques à la journée', () => {
            // uniquement l'après-midi : morning vide, afternoon == all -> seul "all"
            const slots = buildFriseSlots('13:00', '18:00');
            expect(presetsFor(slots).map(p => p.key)).toEqual(['all']);
        });

        it('fournit matin et après-midi quand la journée les contient', () => {
            const slots = buildFriseSlots('10:00', '16:00');
            const keys = presetsFor(slots).map(p => p.key);
            expect(keys).toContain('all');
            expect(keys).toContain('morning');
            expect(keys).toContain('afternoon');
        });
    });
});
