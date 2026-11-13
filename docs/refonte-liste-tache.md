# Plan de migration : page Tâches → « calendrier d'abord »

> **Maquette de référence** : artefact « Tâches opérationnelles – Maquette finale » (HTML interactif).
> **Périmètre** : `src/main/webapp/app/admin/task/**` + clés i18n `i18n/fr/task.json`.
> **Backend** : aucune modification obligatoire (voir §7 pour les options).

---

## 1. Objectif

La page `TaskFocusListComponent` garde ses trois vues (Tâches / Sous-tâches / Calendrier). Le
calendrier devient la vue principale. Il doit permettre :

1. **d'ajouter une sous-tâche en un clic** sur un jour, avec une popin courte (plus de dialogue
   lourd ni de calcul « J± » à la main) ;
2. **de créer une tâche depuis cette popin** ;
3. **de naviguer par Semaine ou par Mois** (les flèches avancent d'une semaine ou d'un mois) ;
4. **de lire la grille d'un coup d'œil** : jours passés, à venir, hors du mois, salon, aujourd'hui.

## 2. Ce qui existe aujourd'hui (vérifié dans le code)

| Élément | Fichier | Comportement actuel |
|---|---|---|
| Page | `list/task-focus-list.component.*` | 3 vues, `entity-list-toolbar` (recherche + puces), `?view=` et `?weeks=` dans l'URL |
| Calendrier | `calendar/task-calendar.component.*` | Grille de N semaines à partir **du lundi de la semaine en cours** (`WEEK_OPTIONS = [1,2,3,4,6,8]`), **aucune navigation dans le temps** |
| Case jour | `calendar/calendar-day.component.*` | `cdkDropList`, classes `cd-past`, `cd-today`, `cd-salon`, `cd-weekend`, « +N autres » |
| Élément | `calendar/calendar-item.component.*` | `subtask-status-panel` + titre + `responsible-avatar` |
| Logique | `calendar/task-calendar.utils.ts` (+ `.spec.ts`) | `calendarRange(weeks)`, `subtasksForDay`, `lateSubtasks`, `mondayOf`, `addDays`, `isWeekend` |
| Création sous-tâche | `dialog/subtask-instance-form.component.*` dans `dialog-box` | Ouvert **uniquement depuis une carte de tâche**. Échéance = `p-select-button` (J±N / Date fixe) + `number-box` + `select-box` Avant/Après |
| Création tâche | `dialog/task-instance-form.component.*` dans `dialog-box` | Menu « Actions » de la page |
| Glisser-déposer | `TaskCalendarComponent.onDrop` | **Ne change pas `dueDate`** : pose un *snooze* (`snoozeUntilType: 'FIXED'`, `snoozedUntil`), toast « Annuler » |
| Responsable | `ISubtaskInstance.responsible: string` | Texte libre, couleurs via `knownResponsibles()` + `responsibleColor()` |
| Dates J± | Backend `TaskInstanceService.patchSubtask` / création | `dueDateType: 'OFFSET'` + `dueDateOffset` ⇒ le serveur calcule `dueDate` (`resolveOffset`). Si la date du salon change, action métier `salon-recalculate-task-dates` |

## 3. Écarts entre la cible et l'existant

| Cible (maquette) | Existant | Travail |
|---|---|---|
| Vue **Semaine / Mois** + flèches ‹ › + « Aujourd'hui » + « Aller au salon » | N semaines fixes à partir d'aujourd'hui | Remplacer `weeks` par `view` + `anchor` (§5.1) |
| Titre seul : « Janvier 2027 » / « Semaine 53 » | `rangeLabel` « du … au … » + compteurs | Simplifier l'en-tête (§5.2) |
| En-têtes Lundi…Dimanche en toutes lettres, plus visibles | `weekdayHeaders` courts | Libellés longs + style (§5.2) |
| Fonds : blanc = à venir (week-end compris), gris = passé, hachuré = hors du mois, orange = salon, bordure = aujourd'hui | `cd-past`, `cd-weekend` peu contrastés | Nouvelles classes + SCSS (§5.2) |
| « 1er décembre » écrit en entier sur le 1er du mois | — | Petit libellé dans `calendar-day` |
| Bouton palette 🎨 → popover « Signification des couleurs » | `cal-foot` (texte de légende en bas) | Remplacer par `p-popover` (§5.2) |
| **Clic sur un jour → popin d'ajout** | Rien au clic sur un jour | Nouveau `calendar-quick-add` (§5.3) |
| Popin : **tâche d'abord** (liste avec recherche + « ＋ Créer la tâche ») | Parent imposé par la carte | `p-select` filtrable + pied de liste (§5.3) |
| Échéance : **J±** et **Date** reliés ; décoché « Liée au salon » ⇒ J± vide et grisé | 2 modes exclusifs, 3 champs | Nouveau `due-date-field`, réutilisé dans la popin et dans le formulaire d'édition (§5.4) |
| Responsable : liste **ou** nom libre | `text-box` | `p-autocomplete` (suggestions = `known()`, valeur libre acceptée) (§5.5) |
| Recherche + puces **Responsable** | Statut + Signaux | Ajouter un groupe de puces (§5.6) |
| Mobile : bandeau 7 jours + liste du jour + bouton ＋ + panneau du bas | Agenda « Par jour / Liste » | Ajouter le bouton ＋ et `bottom-sheet` (§5.7) |
| Glisser une sous-tâche sur ‹ › pour changer de période | — | Optionnel (§5.8) |

## 4. Composants existants réutilisés

| Besoin | Composant existant | Adaptation |
|---|---|---|
| Barre de recherche + puces | `entity-list-toolbar` + `EntityListState` + `FilterChipGroup` | Aucune : on ajoute seulement un groupe de puces |
| Popin ancrée au jour | `p-popover` (déjà utilisé par `subtask-status-panel`) | `popover.show(event, cellElement)` |
| Popin sur mobile | `shared/components/bottom-sheet` | Contenu identique à la popin |
| Liste de tâches avec recherche | `select-box` (`p-select`, `enableFilter`, `filterFields`) | Il faut un **pied de liste** « ＋ Créer la tâche ». Soit ajouter un `@ContentChild('footer')` / `input footerTemplate` à `select-box`, soit utiliser `p-select` directement dans la popin (recommandé : plus simple, pas d'impact ailleurs) |
| Date | `date-box` (`p-datepicker`) | Utilisée telle quelle dans `due-date-field` |
| Case « Liée au salon » | `checkbox-box` | Telle quelle |
| Titre, infos fournisseur, description | `text-box`, `textarea-box` | Tels quels (section « Plus d'options » repliée) |
| Récurrente | `checkbox-box` | Telle quelle |
| Avatar responsable | `responsible-avatar` + `responsibleColor()` | Affiché dans les suggestions de l'autocomplete |
| Statut sur un élément | `subtask-status-panel` | Inchangé |
| Glisser-déposer | `cdkDropList` / `cdkDrag` dans `calendar-day` | Inchangé (§7, décision 1) |
| Toast « Annuler » | `UNDO_TOAST_KEY` + `MessageService` | Réutilisé après chaque ajout |
| Calcul de dates | `dayjs`, `mondayOf`, `addDays`, `isWeekend`, `toLocalDate`, `formatShortDate` | On étend `task-calendar.utils.ts` |
| Édition complète | `dialog-box` + `subtask-instance-form` | Gardés ; seuls les blocs Échéance et Responsable changent |

## 5. Étapes de mise en œuvre

> Chaque étape peut être livrée seule, dans l'ordre ci-dessous. Les étapes 1 et 2 ne changent que
> l'affichage du calendrier.

### 5.1 Navigation Semaine / Mois

**`calendar/task-calendar.utils.ts`** : remplacer le modèle « N semaines » :

```ts
export type CalendarView = 'week' | 'month';
export const VIEW_STORAGE_KEY = 'task.calendar.view';

export interface CalendarRange {
    start: string;          // lundi affiché en premier
    end: string;            // dimanche affiché en dernier
    days: string[];
    month: number | null;   // mois de référence (vue Mois), null en vue Semaine
    title: string;          // « Janvier 2027 » ou « Semaine 53 »
}

export function startOfMonth(date: string): string { return dayjs(date).startOf('month').format('YYYY-MM-DD'); }
export function endOfMonth(date: string): string { return dayjs(date).endOf('month').format('YYYY-MM-DD'); }

export function calendarRange(view: CalendarView, anchor: string): CalendarRange {
    const start = view === 'week' ? mondayOf(anchor) : mondayOf(startOfMonth(anchor));
    const end = view === 'week' ? addDays(start, 6) : addDays(mondayOf(endOfMonth(anchor)), 6);
    const count = dayjs(end).diff(dayjs(start), 'day') + 1;
    const days = Array.from({length: count}, (_, i) => addDays(start, i));
    const month = view === 'month' ? dayjs(anchor).month() : null;
    const title = view === 'week'
        ? `Semaine ${isoWeek(start)}`                                    // via la clé i18n task.calendar.weekTitle
        : capitalize(dayjs(anchor).format('MMMM YYYY'));
    return {start, end, days, month, title};
}

/** ‹ / › : ±1 semaine ou ±1 mois (on revient au 1er du mois pour éviter les 31 → 28). */
export function shiftAnchor(view: CalendarView, anchor: string, dir: -1 | 1): string {
    return view === 'week'
        ? addDays(mondayOf(anchor), 7 * dir)
        : dayjs(startOfMonth(anchor)).add(dir, 'month').format('YYYY-MM-DD');
}
```

`isoWeek` : ajouter le plugin `dayjs/esm/plugin/isoWeek` dans `app/config/dayjs.ts`, ou recopier
la fonction de la maquette.

**`TaskFocusListComponent`** :
- remplacer `weeks` / `setWeeks` / `WEEKS_STORAGE_KEY` par `calendarView = signal<CalendarView>('month')`
  et `calendarAnchor = signal<string>(today())` ;
- URL : `?view=calendar&cal=month&date=2026-12-01` à la place de `?weeks=`. Pour ne pas casser
  les liens existants, un ancien `?weeks=` est simplement ignoré ;
- `localStorage` : on mémorise seulement `view` (Semaine/Mois), jamais la date.

**`TaskCalendarComponent`** :
- inputs `view`, `anchor` ; outputs `viewChange`, `anchorChange` (à la place de `weeks` / `weeksChange`) ;
- boutons `‹` `›` (`shiftAnchor`), « Aujourd'hui » (`anchor = today()`), « 🎪 Aller au salon »
  (`anchor = salonStart()`) ;
- touches ← → (`@HostListener('document:keydown')`, ignorées pendant la saisie) ;
- un `segmented-choice-box` « Semaine | Mois » remplace `cal-wseg` et `cal-wsel`.

**Tests** (`task-calendar.utils.spec.ts`) : vue Mois de déc. 2026 = 30 nov. → 3 janv. (35 jours) ;
semaine 53 = 28 déc. 2026 ; `shiftAnchor('month', '2027-01-31', 1)` = `2027-02-01`.

### 5.2 Lisibilité de la grille

**`calendar-day.component`** :
- nouveaux inputs : `inMonth` (vrai si `range.month === null || month(day) === range.month`) ;
- classes `cd-out` (hors du mois, **vue Mois seulement**), `cd-past`, `cd-salon`, `cd-dday`,
  `cd-today` ; **ne plus appliquer de fond à `cd-weekend`** (le week-end reste blanc) ;
- en-tête : sur le 1er du mois, `1<sup>er</sup> décembre` en couleur primaire ; pour un jour hors du
  mois, le numéro suivi du mois abrégé en gris (« 30 nov. »).

**`task-calendar.component.scss`** (toujours avec les variables du thème, sans couleur en dur,
comme le reste du fichier) :

```scss
.cd            { background: var(--app-surface); }                               // à venir
.cd-past       { background: color-mix(in srgb, var(--app-text) 12%, var(--app-surface)); }
.cd-past .cd-n { color: var(--app-text-muted); }
.cd-out        { background: repeating-linear-gradient(-45deg,
                   var(--app-surface-muted) 0 6px,
                   color-mix(in srgb, var(--app-text) 7%, var(--app-surface)) 6px 12px); }
.cd-out app-calendar-item { opacity: .55; }
.cd-salon      { background: color-mix(in srgb, var(--app-amber) 14%, var(--app-surface)); }
.cd-today      { outline: 2px solid var(--app-primary); outline-offset: -2px; }
```

Choisir des valeurs `color-mix` qui donnent à l'écran à peu près **#dcdfe5** pour le passé
(contraste net avec le blanc).

**En-têtes des jours** : `weekdayHeaders` en libellés longs (`dayjs().format('dddd')`, première
lettre en majuscule), 13 px, gras, sur une barre (`background: var(--app-surface)`, bordure, rayon
9 px). En vue Semaine, ajouter la date en dessous (« 28 déc. »).

**Titre** : remplacer `rangeLabel` et les pastilles de compteurs par `range().title` seul.
Les compteurs de la bannière de la page restent.

**Légende** : supprimer `cal-foot`. Ajouter à côté du titre un bouton icône (`pi pi-palette`) qui
ouvre un `p-popover` (même façon que `subtask-status-panel`) :
- couleurs : À venir, Passé, Hors du mois, Salon, Aujourd'hui ;
- repères : sous-tâche en retard, statut, J-14, 📌 date fixe.

### 5.3 Popin d'ajout au clic sur un jour

**Nouveau composant** : `calendar/calendar-quick-add.component.ts|html|scss` (standalone, OnPush).

- **Déclenchement** : `calendar-day` émet `addRequested({day, element})` au clic sur la zone
  vide d'une case, ou sur le bouton « + ajouter » qui apparaît au survol. Un clic sur un élément
  garde son comportement actuel (panneau de statut / édition).
- **Affichage** : sur ordinateur, `p-popover` ancré sur l'élément de la case ; sur mobile
  (`narrow()`), `bottom-sheet`.
- **Champs**, dans cet ordre :
    1. **Tâche** : `p-select` avec `[filter]="true"` et `filterBy="title,responsible"`. Les 3–4
       dernières tâches utilisées viennent en tête (groupe « Récentes », mémorisé en mémoire ou
       dans `sessionStorage`), puis toutes les tâches de A à Z. Le libellé de chaque option affiche
       « n ouverte(s) / total · responsable ». Le **`#footer`** contient « ＋ Créer la tâche « {{filtre}} » ».
       Ce bouton ouvre un **bloc « Nouvelle tâche »** dans la popin : titre, responsable (§5.5),
       infos fournisseur.
    2. **Titre de la sous-tâche** (`text-box`, focus automatique, Entrée = Ajouter).
    3. **Échéance** : `due-date-field` (§5.4), préremplie avec le jour cliqué, liée au salon par défaut.
    4. **Responsable** : autocomplete (§5.5) ; vide = « Celui de la tâche (X) ».
    5. **« Plus d'options »** repliée : description (`textarea-box`), infos fournisseur, récurrente
       (`checkbox-box`, cochée par défaut).
- **Enregistrement** :
    - tâche existante → `taskInstanceService.addSubtask(taskId, draft)` ;
    - nouvelle tâche → `create(salonId, task)` puis `addSubtask(created.id, draft)`, enchaînés avec
      `switchMap`. En cas d'échec du 2ᵉ appel, la tâche reste créée : on affiche un toast d'erreur
      et la popin reste ouverte avec la tâche sélectionnée ;
    - le `draft` est construit par `SubtaskInstanceFormService.getSubtaskInstance(form)`, donc le
      même format qu'aujourd'hui ;
    - après l'ajout, la popin **reste ouverte** : le titre est vidé, une liste « ✓ ajoutées » est
      affichée, et on peut enchaîner. Toast « Ajoutée » avec « Annuler » (`deleteSubtask`). La page
      est rechargée (`changed` → `load()`).
- **« ＋ Nouvelle tâche »** dans la barre d'outils ouvre la même popin, bloc « Nouvelle tâche »
  déjà ouvert, date = aujourd'hui. L'entrée du menu « Actions » peut rester.

**Formulaire** : réutiliser `SubtaskInstanceFormService.createFormGroup(null)`. Pour la tâche,
un petit `FormGroup` local (`title`, `responsible`, `supplierInfo`) suffit, ou bien
`TaskInstanceFormService`.

### 5.4 Nouveau champ d'échéance `due-date-field`

**Nouveau composant** : `shared/due-date-field.component.ts` (dans `admin/task/shared/`), branché
sur le `FormGroup` existant (`dueDateType`, `dueDateFixed`, `dueDateOffset`).

```
┌ J± (salon) ─────┐ ┌ Date ─────────────┐
│ J-14            │ │ 01/01/2027   📅   │   ← date-box
└─────────────────┘ └───────────────────┘
☑ Liée à la date du salon — décoché : date fixe, le J± n'est plus utilisé
```

Règles :

| Action | Effet |
|---|---|
| Saisie « J-14 », « J+2 », « Jour J », « J0 » | `dueDateOffset = ±N`, le champ Date est mis à jour (`salonStart + N`) |
| Choix d'une date (case cochée) | `dueDateOffset = diff(salonStart, date)`, le champ J± est mis à jour |
| Décocher « Liée au salon » | `dueDateType = 'FIXED'`, `dueDateFixed = date affichée`, **J± vidé et `disabled`** (fond grisé) |
| Cocher | `dueDateType = 'OFFSET'`, `dueDateOffset` recalculé depuis la date |
| Saisie J± invalide | Bordure rouge seulement (aucun texte sous les champs) |

Utilitaire à ajouter dans `task-urgency.utils.ts` :

```ts
/** « J-14 » → -14, « J+2 » → 2, « Jour J » / « J0 » → 0, sinon null. */
export function parseSalonOffset(value: string): number | null {
    const v = value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (['j', 'j0', 'jj', 'jour j'].includes(v)) return 0;
    const m = v.match(/^j\s*([+-])\s*(\d{1,3})$/);
    return m ? (m[1] === '-' ? -1 : 1) * Number(m[2]) : null;
}
export function formatSalonOffset(offset: number): string {
    return offset === 0 ? 'Jour J' : offset < 0 ? `J${offset}` : `J+${offset}`;
}
```

Dans `subtask-instance-form.component.html`, ce composant **remplace** le bloc « Date
d'échéance » (`p-select-button` + `number-box` + `select-box` Avant/Après + texte « Date
d'échéance : … »). Les contrôles `dueDateOffsetAbs` / `dueDateOffsetDir` et leur synchronisation
dans `SubtaskInstanceFormService.registerSyncSubscriptions` deviennent inutiles et sont supprimés.
Le bloc *Snooze* est conservé tel quel dans le dialogue d'édition (il n'est pas dans la popin).

### 5.5 Responsable : liste ou nom libre

Le modèle stocke déjà un `string` libre : **aucun changement backend**.

- **Nouveau composant** `shared/responsible-field.component.ts`, branché sur un `FormControl<string | null>` :
  `p-autocomplete` avec `[dropdown]="true"`, `[forceSelection]="false"`, suggestions =
  `known()` filtré par la saisie (sans tenir compte des accents), avatar `responsible-avatar` dans
  le modèle d'option, et une dernière option « ＋ Ajouter « Bastien » » quand la saisie ne
  correspond à personne ;
- placeholder : « Celui de la tâche (Luc) » quand le champ est vide (valeur `null` = responsable hérité) ;
- utilisé dans la popin (sous-tâche et nouvelle tâche), dans `subtask-instance-form` et dans
  `task-instance-form` (à la place des `text-box` « Responsable ») ;
- un nouveau nom apparaît dans `known()` dès le rechargement, donc aussi dans les puces et les couleurs.

### 5.6 Puces « Responsable »

Dans `TaskFocusListComponent.chipGroups`, ajouter :

```ts
groups.push({
    key: 'responsible',
    labelKey: 'task.list.filterResponsible',
    mode: 'or',
    chips: this.known().map(name => ({
        key: `resp_${name}`,
        labelKey: name,
        rawLabel: true,
        dotColor: responsibleColor(name, this.known()),
        count: items.filter(predicates[`resp_${name}`]).length
    }))
});
```

et dans `predicates` : `resp_${name}: s => ownerOf(s, s.parentTask) === name`.
La puce « Sans responsable » existe déjà.

*Optionnel* : en vue Calendrier, quand la recherche est remplie, afficher sous la barre « n
résultats » et deux boutons « ‹ précédent / suivant › » qui positionnent `anchor` sur la date du
résultat et font clignoter l'élément (`flashedId`). Ce comportement existe déjà pour les cartes.

### 5.7 Mobile (≤ 600 px, `narrow()` existant)

- Garder l'agenda actuel (bandeau de jours + liste du jour). Le bandeau suit `anchor` : ‹ › = ±7 jours.
- Ajouter un bouton flottant **＋** et un bouton « ＋ Ajouter une sous-tâche le … » sous la liste du
  jour. Les deux ouvrent `calendar-quick-add` dans `bottom-sheet`.
- Puces : déjà gérées par `.el-chips` (`overflow-x: auto`).
- Champs de la popin en 16 px pour éviter le zoom automatique d'iOS.

### 5.8 Optionnel : glisser sur ‹ › pour changer de période

Rendre les boutons ‹ › `cdkDropList` (avec `cdkDropListEnterPredicate`). Pendant que l'élément
glissé est au-dessus (`cdkDropListEntered`), un `setTimeout` de 600 ms appelle `shiftAnchor`. On
l'annule sur `cdkDropListExited`. Le dépôt se fait ensuite sur la case visible.

## 6. Clés i18n à ajouter (`i18n/fr/task.json`)

```json
"calendar": {
  "viewWeek": "Semaine", "viewMonth": "Mois", "weekTitle": "Semaine {{n}}",
  "previousWeek": "Semaine précédente", "nextWeek": "Semaine suivante",
  "previousMonth": "Mois précédent", "nextMonth": "Mois suivant",
  "goToday": "Aujourd'hui", "goSalon": "Aller au salon",
  "firstOfMonth": "1<sup>er</sup> {{month}}",
  "legend": { "title": "Signification des couleurs", "future": "À venir", "past": "Passé",
              "out": "Hors du mois", "salon": "Salon", "today": "Aujourd'hui",
              "late": "Sous-tâche en retard", "offset": "Décalage par rapport au salon", "fixed": "Date fixe" },
  "addHere": "+ ajouter", "addOn": "Ajouter une sous-tâche le {{date}}"
},
"quickAdd": {
  "title": "Nouvelle sous-tâche", "task": "Tâche", "recent": "Récentes", "all": "Toutes les tâches ({{count}})",
  "createTask": "＋ Créer la tâche « {{title}} »", "newTask": "Nouvelle tâche", "taskTitle": "Titre de la tâche",
  "subtaskTitle": "Titre de la sous-tâche… puis Entrée", "dueOffset": "J± (salon)", "dueDate": "Date",
  "linked": "Liée à la date du salon", "linkedHint": "décoché : date fixe, le J± n'est plus utilisé",
  "responsibleInherited": "Celui de la tâche ({{name}})", "responsibleNone": "Aucun",
  "addResponsible": "＋ Ajouter « {{name}} »", "moreOptions": "Plus d'options",
  "add": "Ajouter", "addWithTask": "Créer la tâche + la sous-tâche", "enterHint": "Entrée ajoute et continue",
  "added": "Ajoutée : « {{title}} »"
},
"list": { "filterResponsible": "Responsable" }
```

Clés à supprimer après migration : `task.calendar.weeks`, `weekUnit`, `range`, `legendPanel`,
`legendDrag`, `legendSalon`, `task.dialog.dueDateJN`, `offsetBefore`, `offsetAfter`,
`estimatedDueDatePrefix` (vérifier qu'elles ne sont pas utilisées ailleurs).

## 7. Décisions à prendre

1. **Glisser-déposer = report (*snooze*) ou nouvelle échéance ?** Aujourd'hui, déplacer une
   sous-tâche pose un *snooze* et garde l'échéance d'origine (« Revenir au … »). Dans la
   maquette, l'échéance elle-même change. **Recommandation : garder le snooze**, pour conserver
   l'historique et l'échéance de référence des sous-tâches récurrentes. Pour changer
   l'échéance, on passe par le formulaire.
2. **Sous-tâches en retard dans les cases passées** : `subtasksForDay` les retire des jours passés
   (elles ne sont que dans la bande « En retard »). Dans la maquette, elles apparaissent aux deux
   endroits. **Recommandation : garder la règle actuelle** ; les jours passés n'affichent que les
   sous-tâches terminées.
3. **Dépôt sur un jour passé** : aujourd'hui interdit (`never`). À garder.
4. **« Liée au salon » et changement de date du salon** : la date d'une sous-tâche `OFFSET` est
   calculée par le serveur au moment de l'enregistrement. Si le salon est déplacé, il faut
   toujours lancer l'action `salon-recalculate-task-dates` (avertissement déjà présent dans la
   bannière). La date du salon reste **en lecture seule** sur cette page, comme dans la maquette.
5. **Création tâche + sous-tâche en un appel** : faisable en front avec 2 appels (§5.3). Si l'on
   veut que ce soit atomique, il faut un endpoint
   `POST /api/admin/salons/{id}/tasks` qui accepte `subtasks[]` (`TaskInstanceService.create`).
   C'est optionnel.

## 8. Ordre de livraison conseillé

| # | Livraison | Fichiers principaux | Risque |
|---|---|---|---|
| 1 | Semaine/Mois + navigation | `task-calendar.utils.ts` (+spec), `task-calendar.component.*`, `task-focus-list.component.*` | Faible |
| 2 | Lisibilité (fonds, en-têtes, titre, légende) | `calendar-day.component.*`, `task-calendar.component.scss` | Faible |
| 3 | `due-date-field` + `responsible-field` dans les dialogues existants | `admin/task/shared/*`, `subtask-instance-form.*`, `subtask-instance-form.service.ts`, `task-instance-form.*` | Moyen (validation du formulaire) |
| 4 | Popin `calendar-quick-add` (ordinateur) | `calendar/calendar-quick-add.*`, `calendar-day.component.*` | Moyen |
| 5 | Création de tâche depuis la popin + bouton « ＋ Nouvelle tâche » | `calendar-quick-add.*`, `task-focus-list.component.*` | Moyen |
| 6 | Puces Responsable (+ navigation dans les résultats) | `task-focus-list.component.ts` | Faible |
| 7 | Mobile : bouton ＋ + `bottom-sheet` | `task-calendar.component.html` | Faible |
| 8 | Optionnel : glisser sur ‹ › | `task-calendar.component.*` | Faible |

## 9. Recette (à vérifier à la main)

- [ ] Mois de décembre 2026 : du 30 nov. au 3 janv. ; le 30 nov. et les 1–3 janv. sont hachurés ;
  le 1er décembre est écrit « 1er décembre ».
- [ ] « Semaine » sur le 28 déc. 2026 → titre « Semaine 53 » ; › → « Semaine 1 » (4 janv. 2027).
- [ ] ‹ › avancent d'un mois en vue Mois et d'une semaine en vue Semaine ; ← → au clavier font de même.
- [ ] Jours passés gris, jours à venir (week-end compris) blancs, salon orange, aujourd'hui encadré.
- [ ] Clic sur un jour vide → popin, focus sur le titre, tâche récente déjà choisie, J± = J du jour cliqué.
- [ ] Taper « J-30 » → la date change ; choisir une date → le J± change ; décocher → J± vide et grisé.
- [ ] Nouveau responsable « Bastien » → enregistré, visible dans les puces après rechargement.
- [ ] « ＋ Créer la tâche « Décoration » » → tâche et sous-tâche créées, popin toujours ouverte.
- [ ] Entrée enchaîne deux sous-tâches ; « Annuler » du toast supprime la dernière.
- [ ] Mobile (390 px) : bouton ＋ → panneau du bas, pas de zoom à la saisie.
- [ ] Le glisser-déposer garde son comportement (snooze + « Annuler ») ; pas de dépôt sur un jour passé.
- [ ] `npm test` : `task-calendar.utils.spec.ts` est vert, avec les nouveaux cas Mois/Semaine/`parseSalonOffset`.