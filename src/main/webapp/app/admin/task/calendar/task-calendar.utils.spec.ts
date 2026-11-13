import {IFlatSubtask, ISubtaskInstance, ITaskInstance, TaskStatus} from '../model/task-instance.interface';
import {
    activeCount,
    addDays,
    calendarCounts,
    calendarRange,
    compareInDay,
    groupByDay,
    isFirstOfMonth,
    isInMonth,
    isoWeekNumber,
    isSalonDay,
    isWeekend,
    lateSubtasks,
    mondayOf,
    normalizeView,
    shiftAnchor,
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
    describe('normalizeView', () => {
        it('garde une vue connue', () => {
            expect(normalizeView('week')).toBe('week');
            expect(normalizeView('month')).toBe('month');
        });

        it('replie une valeur inconnue sur le mois', () => {
            expect(normalizeView('quarter')).toBe('month');
            expect(normalizeView(null)).toBe('month');
            expect(normalizeView(undefined)).toBe('month');
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
        it('en semaine, va du lundi au dimanche', () => {
            const range = calendarRange('week', TODAY);
            expect(range.start).toBe('2026-10-26');
            expect(range.end).toBe('2026-11-01');
            expect(range.days).toHaveLength(7);
            expect(range.month).toBeNull();
            expect(range.weekNumber).toBe(44);
        });

        it('en mois, complète les semaines autour de décembre 2026', () => {
            const range = calendarRange('month', '2026-12-10');
            expect(range.start).toBe('2026-11-30');
            expect(range.end).toBe('2027-01-03');
            expect(range.days).toHaveLength(35);
            expect(range.month).toBe(11);
            expect(range.monthDate).toBe('2026-12-01');
        });

        it('traverse un changement de mois', () => {
            const range = calendarRange('week', TODAY);
            expect(range.days).toContain('2026-10-31');
            expect(range.days).toContain('2026-11-01');
        });
    });

    describe('isoWeekNumber', () => {
        it('numérote la semaine 53 de 2026', () => {
            expect(isoWeekNumber('2026-12-28')).toBe(53);
        });

        it('repart à 1 en janvier 2027', () => {
            expect(isoWeekNumber('2027-01-04')).toBe(1);
        });
    });

    describe('shiftAnchor', () => {
        it('décale d\'une semaine en repartant du lundi', () => {
            expect(shiftAnchor('week', '2026-10-31', 1)).toBe('2026-11-02');
            expect(shiftAnchor('week', '2026-10-31', -1)).toBe('2026-10-19');
        });

        it('décale d\'un mois sans déborder sur février', () => {
            expect(shiftAnchor('month', '2027-01-31', 1)).toBe('2027-02-01');
        });
    });

    describe('isInMonth / isFirstOfMonth', () => {
        it('distingue les jours du mois affiché', () => {
            const range = calendarRange('month', '2026-12-10');
            expect(isInMonth('2026-12-01', range)).toBe(true);
            expect(isInMonth('2026-11-30', range)).toBe(false);
            expect(isInMonth('2027-01-01', range)).toBe(false);
        });

        it('repère le 1er du mois', () => {
            expect(isFirstOfMonth('2026-12-01')).toBe(true);
            expect(isFirstOfMonth('2026-12-02')).toBe(false);
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
            expect(subtasksForDay(items, '2026-11-02').map(s => s.id)).toEqual(['1']);
        });

        it('place une repoussée à sa nouvelle date, pas à l\'origine', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: '2026-11-01', snoozedUntil: '2026-11-03'})];
            expect(subtasksForDay(items, '2026-11-01')).toHaveLength(0);
            expect(subtasksForDay(items, '2026-11-03').map(s => s.id)).toEqual(['1']);
        });

        it('garde une active en retard dans sa case passée', () => {
            const items = [sub({id: '1', status: 'PENDING', dueDate: '2026-10-28'})];
            expect(subtasksForDay(items, '2026-10-28').map(s => s.id)).toEqual(['1']);
        });

        it('garde une terminée dans une case passée', () => {
            const items = [sub({id: '1', status: 'DONE', dueDate: '2026-10-28'})];
            expect(subtasksForDay(items, '2026-10-28').map(s => s.id)).toEqual(['1']);
        });

        it('ignore les CANCELLED', () => {
            const items = [sub({id: '1', status: 'CANCELLED', dueDate: '2026-11-02'})];
            expect(subtasksForDay(items, '2026-11-02')).toHaveLength(0);
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
            const range = calendarRange('week', TODAY);
            const items = [
                sub({id: 'in', status: 'PENDING', dueDate: '2026-11-01'}),
                sub({id: 'out', status: 'PENDING', dueDate: '2026-11-20'})
            ];
            const map = groupByDay(items, range);
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
            const range = calendarRange('month', TODAY);
            const items = [
                sub({id: 'today', status: 'PENDING', dueDate: TODAY}),
                sub({id: 'soon', status: 'PENDING', dueDate: '2026-11-01'}),
                sub({id: 'late', status: 'PENDING', dueDate: '2026-10-28'}),
                sub({id: 'out', status: 'PENDING', dueDate: '2026-12-15'}),
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
});
