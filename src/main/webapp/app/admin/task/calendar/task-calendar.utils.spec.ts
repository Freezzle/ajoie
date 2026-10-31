import {IFlatSubtask, ISubtaskInstance, ITaskInstance, TaskStatus} from '../model/task-instance.interface';
import {
    activeCount,
    addDays,
    calendarCounts,
    calendarRange,
    compareInDay,
    groupByDay,
    isSalonDay,
    isWeekend,
    lateSubtasks,
    mondayOf,
    normalizeWeeks,
    showsMonth,
    subtasksForDay
} from './task-calendar.utils';

const TODAY = '2026-10-31'; // un samedi

function task(id: string, title = `Tâche ${id}`): ITaskInstance {
    return {
        id,
        salonId: 's1',
        title,
        description: null,
        dueDate: null,
        responsible: null,
        supplierInfo: null,
        sortOrder: 0,
        subtasks: [],
        comments: []
    };
}

function sub(partial: Partial<IFlatSubtask> & {id: string; status: TaskStatus}): IFlatSubtask {
    const base: ISubtaskInstance = {
        id: partial.id,
        taskInstanceId: 't1',
        title: partial.title ?? `Sous-tâche ${partial.id}`,
        status: partial.status,
        dueDate: partial.dueDate ?? null,
        completedAt: null,
        sortOrder: partial.sortOrder ?? 0,
        description: null,
        snoozedUntil: partial.snoozedUntil ?? null,
        dueDateType: 'FIXED',
        dueDateOffset: null,
        snoozeUntilType: partial.snoozedUntil ? 'FIXED' : null,
        snoozeOffset: null,
        responsible: partial.responsible ?? null,
        supplierInfo: null,
        recurring: true
    };

    return {...base, parentTask: partial.parentTask ?? task('t1')};
}

describe('task-calendar.utils', () => {
    describe('normalizeWeeks', () => {
        it('garde une valeur autorisée', () => {
            expect(normalizeWeeks(4)).toBe(4);
        });

        it('replie une valeur inconnue sur le défaut 2', () => {
            expect(normalizeWeeks(5)).toBe(2);
            expect(normalizeWeeks(null)).toBe(2);
            expect(normalizeWeeks(undefined)).toBe(2);
        });
    });

    describe('mondayOf', () => {
        it('renvoie le lundi d\'un samedi', () => {
            expect(mondayOf('2026-10-31')).toBe('2026-10-26');
        });

        it('renvoie le lundi lui-même', () => {
            expect(mondayOf('2026-10-26')).toBe('2026-10-26');
        });

        it('renvoie le lundi d\'un dimanche', () => {
            expect(mondayOf('2026-11-01')).toBe('2026-10-26');
        });
    });

    describe('calendarRange', () => {
        it('commence au lundi et finit au dimanche sur 2 semaines', () => {
            const range = calendarRange(2, TODAY);
            expect(range.start).toBe('2026-10-26');
            expect(range.end).toBe('2026-11-08');
            expect(range.days).toHaveLength(14);
            expect(range.days[0]).toBe('2026-10-26');
            expect(range.days[13]).toBe('2026-11-08');
        });

        it('produit weeks × 7 jours pour chaque option', () => {
            [1, 2, 3, 4, 6, 8].forEach(weeks => {
                expect(calendarRange(weeks, TODAY).days).toHaveLength(weeks * 7);
            });
        });

        it('traverse un changement de mois', () => {
            const range = calendarRange(1, TODAY);
            expect(range.days).toContain('2026-10-31');
            expect(range.days).toContain('2026-11-01');
        });

        it('replie un nombre de semaines invalide', () => {
            expect(calendarRange(5, TODAY).days).toHaveLength(2 * 7);
        });
    });

    describe('isWeekend', () => {
        it('détecte samedi et dimanche', () => {
            expect(isWeekend('2026-10-31')).toBe(true); // samedi
            expect(isWeekend('2026-11-01')).toBe(true); // dimanche
            expect(isWeekend('2026-10-26')).toBe(false); // lundi
        });
    });

    describe('addDays', () => {
        it('décale correctement au-delà d\'un mois', () => {
            expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
            expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
        });
    });

    describe('subtasksForDay', () => {
        it('place une active à son échéance effective', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: '2026-11-02'})];
            expect(subtasksForDay(items, '2026-11-02', TODAY).map(s => s.id)).toEqual(['1']);
        });

        it('place une repoussée à sa nouvelle date, pas à l\'origine', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: '2026-11-01', snoozedUntil: '2026-11-03'})];
            expect(subtasksForDay(items, '2026-11-01', TODAY)).toHaveLength(0);
            expect(subtasksForDay(items, '2026-11-03', TODAY).map(s => s.id)).toEqual(['1']);
        });

        it('exclut une active d\'une case passée (elle ira en retard)', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: '2026-10-28'})];
            expect(subtasksForDay(items, '2026-10-28', TODAY)).toHaveLength(0);
        });

        it('garde une terminée dans une case passée', () => {
            const items = [sub({id: '1', status: 'DONE', dueDate: '2026-10-28'})];
            expect(subtasksForDay(items, '2026-10-28', TODAY).map(s => s.id)).toEqual(['1']);
        });

        it('ignore les CANCELLED', () => {
            const items = [sub({id: '1', status: 'CANCELLED', dueDate: '2026-11-02'})];
            expect(subtasksForDay(items, '2026-11-02', TODAY)).toHaveLength(0);
        });
    });

    describe('compareInDay / tri dans un jour', () => {
        it('met les actives avant les terminées, puis l\'ordre de statut', () => {
            const items = [
                sub({id: 'done', status: 'DONE', dueDate: '2026-11-02'}),
                sub({id: 'pending', status: 'PENDING', dueDate: '2026-11-02'}),
                sub({id: 'blocked', status: 'BLOCKED', dueDate: '2026-11-02'}),
                sub({id: 'progress', status: 'IN_PROGRESS', dueDate: '2026-11-02'})
            ];
            const ordered = [...items].sort(compareInDay).map(s => s.id);
            expect(ordered).toEqual(['blocked', 'progress', 'pending', 'done']);
        });

        it('départage par sortOrder puis id', () => {
            const items = [
                sub({id: 'b', status: 'PENDING', dueDate: '2026-11-02', sortOrder: 2}),
                sub({id: 'a', status: 'PENDING', dueDate: '2026-11-02', sortOrder: 1})
            ];
            expect([...items].sort(compareInDay).map(s => s.id)).toEqual(['a', 'b']);
        });
    });

    describe('lateSubtasks', () => {
        it('ne garde que les actives en retard, triées par échéance croissante', () => {
            const items = [
                sub({id: 'recent', status: 'PENDING', dueDate: '2026-10-30'}),
                sub({id: 'old', status: 'PENDING', dueDate: '2026-10-27'}),
                sub({id: 'done', status: 'DONE', dueDate: '2026-10-20'}),
                sub({id: 'future', status: 'PENDING', dueDate: '2026-11-02'})
            ];
            expect(lateSubtasks(items, TODAY).map(s => s.id)).toEqual(['old', 'recent']);
        });

        it('exclut les sous-tâches sans date', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: null})];
            expect(lateSubtasks(items, TODAY)).toHaveLength(0);
        });
    });

    describe('groupByDay', () => {
        it('indexe les jours de la période et exclut le hors-période', () => {
            const range = calendarRange(1, TODAY);
            const items = [
                sub({id: 'in', status: 'PENDING', dueDate: '2026-11-01'}),
                sub({id: 'out', status: 'PENDING', dueDate: '2026-11-20'})
            ];
            const map = groupByDay(items, range, TODAY);
            expect(map['2026-11-01'].map(s => s.id)).toEqual(['in']);
            expect(Object.values(map).flat().map(s => s.id)).not.toContain('out');
        });
    });

    describe('activeCount', () => {
        it('compte les actives seulement', () => {
            const items = [
                sub({id: '1', status: 'PENDING', dueDate: '2026-11-02'}),
                sub({id: '2', status: 'DONE', dueDate: '2026-11-02'})
            ];
            expect(activeCount(items)).toBe(1);
        });
    });

    describe('calendarCounts', () => {
        it('compte à faire / aujourd\'hui / en retard', () => {
            const range = calendarRange(2, TODAY);
            const items = [
                sub({id: 'today', status: 'PENDING', dueDate: TODAY}),
                sub({id: 'soon', status: 'PENDING', dueDate: '2026-11-02'}),
                sub({id: 'late', status: 'PENDING', dueDate: '2026-10-28'}),
                sub({id: 'out', status: 'PENDING', dueDate: '2026-12-01'}),
                sub({id: 'done', status: 'DONE', dueDate: TODAY})
            ];
            expect(calendarCounts(items, range, TODAY)).toEqual({toDo: 2, today: 1, late: 1});
        });
    });

    describe('isSalonDay', () => {
        it('détecte les bornes incluses', () => {
            expect(isSalonDay('2026-11-27', '2026-11-27', '2026-11-29')).toBe(true);
            expect(isSalonDay('2026-11-29', '2026-11-27', '2026-11-29')).toBe(true);
            expect(isSalonDay('2026-11-30', '2026-11-27', '2026-11-29')).toBe(false);
        });

        it('est faux sans dates de salon', () => {
            expect(isSalonDay('2026-11-27', null, null)).toBe(false);
        });
    });

    describe('showsMonth', () => {
        it('est vrai le 1er du mois et au premier jour affiché', () => {
            const range = calendarRange(2, TODAY);
            expect(showsMonth('2026-11-01', range)).toBe(true);
            expect(showsMonth(range.start, range)).toBe(true);
            expect(showsMonth('2026-11-05', range)).toBe(false);
        });
    });
});
