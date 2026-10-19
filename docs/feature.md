# Planning des bénévoles — refonte « Vue liée »

> Document de spécification destiné à GitHub Copilot.
> Objectif : **remplacer l'écran actuel** `src/main/webapp/app/admin/volunteer-planning` par la « Vue liée » (planning par bénévole + équipes par zone sur le même axe horaire), **sans perdre aucune fonctionnalité existante**.
> Maquette de référence : `planning-benevoles-vue-benevoles-zones.html`, proposition **B · Vue liée** (à ouvrir dans un navigateur et à joindre au contexte Copilot). La maquette contient un bandeau de périodes (Ouverture, Midi…) : **il ne doit pas être implémenté**.

---

## 1. Contexte technique

- Front : Angular (composants **standalone**, **signals**, `ChangeDetectionStrategy.OnPush`), PrimeNG (`p-tabs`, `p-table`, `p-confirmpopup`…), `@ngx-translate`, PrimeIcons.
- Composants partagés du projet à réutiliser : `app-content-page`, `app-card`, `button-box`, `menu-box`, `dialog-box`, `app-alert-error`, `DialogDraftService`, `ActionsService`, `MenuItemBuilderService`.
- Back : Spring Boot (JHipster), entité `PlanningVolunteerSalon` avec `configuration` et `volunteers` stockés en **jsonb**. Endpoints existants :
  - `GET  api/admin/salons/{idSalon}/planning-volunteers`
  - `PUT  api/admin/salons/{idSalon}/planning-volunteers`
- Vocabulaire : dans l'UI, une **catégorie** (`Category`) est appelée **zone** (Buvette, Lavage, Cuisine…). Dans le code on garde le nom `Category`.

Fichiers actuels concernés :

```
src/main/webapp/app/admin/volunteer-planning/
├── volunteer-planning.routes.ts
├── volunteer-planning.service.ts
└── components/
    ├── volunteer-planning.component.{ts,html,scss}   ← à réécrire
    ├── volunteer-planning-model.ts                    ← à étendre
    ├── volunteer-planning-slices.ts                   ← inchangé
    ├── category-manager/                              ← inchangé (dialog)
    ├── volunteer-manager/                             ← inchangé (dialog)
    ├── selected-day-editor/                           ← inchangé (dialog)
    └── selected-day-assignments/                      ← inchangé (dialog)
src/main/java/ch/salon/domain/VolunteerPlanningDay.java  ← ajout du champ needs
src/main/webapp/i18n/fr/planningVolunteers.json          ← nouvelles clés
```

---

## 2. Fonctionnalités existantes à conserver (checklist obligatoire)

Toutes ces fonctionnalités de `volunteer-planning.component` doivent exister à l'identique dans la nouvelle version.

### En-tête (`appMenuBarStart` / `appMenuBarEnd`)
- [ ] Titre `salon.volunteersPlanning`.
- [ ] Bouton **Retour** (`pi-arrow-left`) → `window.history.back()`.
- [ ] **Mode lecture par défaut** (`isReadOnly = true`).
- [ ] En lecture : bouton **Modifier** (`pi-pencil`) → mode édition.
- [ ] En lecture : menu **Actions** (`pi-cog`, `menu-box`), alimenté par `actionsService.getAvailableActions('salon', idSalon, 'volunteer-planning')` et `menuItemBuilderService.buildMenuItemsFromActions(...)`. Il n'est affiché que s'il contient des éléments.
- [ ] Action de type `DOWNLOAD` : appel de `actionsService.downloadAction(action.contextCode, idSalon)`. Le nom du fichier vient de l'en-tête `content-disposition`, avec `planning-benevoles.pdf` par défaut. Le téléchargement passe par `URL.createObjectURL`.
- [ ] En édition : bouton **Annuler** (`pi-ban`) qui recharge les données serveur et revient en lecture, et bouton **Enregistrer** (`pi-save`) qui fait le `PUT` puis revient en lecture.
- [ ] Tous les boutons sont désactivés pendant `isLoading`.
- [ ] `<app-alert-error>` et `<p-confirmpopup>` restent présents.

### Gestion (mode édition uniquement)
- [ ] Bouton **Bénévoles** → dialog `volunteer-manager`. À la confirmation, `applyVolunteers()` retire les ids supprimés de `assignedVolunteerIds`, `cells`, `unavailableCells` **et** `needs` (nouveau champ, voir §4) de tous les jours.
- [ ] Bouton **Catégories** → dialog `category-manager`. À la confirmation, `applyCategories()` retire les `cells` **et** les `needs` qui pointent vers une catégorie supprimée.

### Jours
- [ ] Onglets de jours (`p-tabs` scrollable). Le jour sélectionné est conservé dans `selectedDayId`.
- [ ] En édition, l'onglet actif a un menu (`menu-box`, `pi-list`) avec trois entrées :
  - **Configuration** → dialog `selected-day-editor`. À la confirmation, `applyDaySlice()` supprime les `cells`, `unavailableCells` **et** `needs` dont `slotIndex >= nombre de créneaux`.
  - **Assignement des bénévoles** → dialog `selected-day-assignments`. À la confirmation, `applyAssignmentsSlice()` supprime les `cells` et `unavailableCells` des bénévoles retirés.
  - **Supprimer le jour** → dialog de confirmation (`planningVolunteers.removeDay`), puis `confirmDeleteSelectedDay()`.
- [ ] Onglet **+ Créer** (édition) → `addNewDay()` : nouvel id (`crypto.randomUUID`), 08:00–18:00, 60 min, dialog en mode création, puis sélection du nouveau jour.
- [ ] Seuls les bénévoles de `day.assignedVolunteerIds` sont affichés pour le jour.

### Outils de saisie (sémantique à garder exactement)
- [ ] `CATEGORY` : affecte la catégorie, **sauf** sur une cellule indisponible.
- [ ] `ERASER` : retire l'affectation, **sauf** sur une cellule indisponible.
- [ ] `UNAVAILABLE` : marque la cellule indisponible **et** retire sa catégorie.
- [ ] `CLEAR_UNAVAILABLE` : retire uniquement l'indisponibilité.
- [ ] Totaux par catégorie et par créneau, affichés sous forme « affectés / minimum » (§5.4).
- [ ] Aucune saisie possible en lecture seule.

### Données
- [ ] Mapping `fromPlanningVolunteersDto` / `toPlanningConfigurationDto` conservé : dates en ISO, repli de `intervalMinutes` sur `configuration.intervalMinutes`, puis sur 60.

---

## 3. Expérience cible

### 3.1 Desktop (≥ 992 px)

Un **sélecteur de vue à 3 positions** sous les onglets de jours :
`[ Les deux ] [ Bénévoles ] [ Zones ]`, avec `Les deux` par défaut.

```
┌───────────────────────────────────────────────────────────────┬──────────────────────┐
│ Palette : [Buvette 1][Lavage 2][Cuisine 3][Logist. 4] |       │  PANNEAU LATÉRAL     │
│           [Gomme E][Indispo X][Dispo D]          (édition)    │                      │
├────────────────┬──────────────────────────────────────────────┤  • sans sélection :  │
│ Bénévole       │ 08:00  09:00  10:00  11:00  12:00 …          │    liste bénévoles   │  ← en-tête collant (sticky top)
├────────────────┼──────────────────────────────────────────────┤    + heures + mini   │
│ (Ch) Charlène 2h│      [Logistique 09–10]                     │    frise             │
│ (Da) Davy     6h│[■ Buvette 08:00–14:00 ■■■■■■■■■]            │                      │  ← VUE BÉNÉVOLES
│ (Dy) Dylan    6h│            [■ Buvette 12:00–17:00 ■■■■]     │  • avec sélection de │    (timeline, scroll vertical)
│ …               │      [///// Indispo /////]                  │    plage de zone :   │
├────────────────┴──────────────────────────────────────────────┤    panneau           │
│ ÉQUIPES PAR ZONE · glissez sur une ligne pour sélectionner     │    d'affectation     │
│ Buvette  19h/20h │[Da][Da][Da●][Da Mi][Da Dy][…]               │    (§5.5)            │  ← VUE ZONES
│ Lavage    7h/7h  │[  ][  ][  ][  ][Pa][Pa][Pa]                 │                      │    ancrée en bas
│ Cuisine  11h/9h  │[  ][  ][Ke Le][Ke Le][…]                    │                      │    (sticky bottom),
│ Libres           │  6   6   6   5   3   3   6                  │                      │    alignée sur les colonnes
└────────────────────────────────────────────────────────────────┴──────────────────────┘
```

- **Les deux** : la timeline des bénévoles défile et les zones restent ancrées en bas (`position: sticky; bottom: 0`) dans **le même conteneur scrollable**. Les deux parties partagent ainsi le défilement horizontal et sont alignées pixel par pixel.
- **Bénévoles** : timeline seule, suivie des lignes de couverture « affectés / minimum » avec le bouton « Modifier les minimums » (§5.4).
- **Zones** : uniquement les lignes de zones et la ligne « Libres ».
- Le panneau latéral (320 px) est présent dans les 3 modes.

### 3.2 Mobile (< 992 px)

En haut de l'écran, sous le titre, un segment `[ Par bénévole ] [ Par zone ]`, puis les jours en chips défilants, puis une ligne d'indicateurs.

**Par bénévole** : une grille compacte.
- Colonne collante avec l'avatar et les heures du bénévole, puis des colonnes de créneaux de 38 px.
- Les cellules consécutives d'une même catégorie sont fusionnées visuellement.
- Pied de grille : totaux « a/min » par zone.
- Barre du bas : interrupteur **Défiler / Peindre**, bouton **Minimums**, palette.
  - Défiler : un tap colorie une seule case, le scroll reste libre.
  - Peindre : on glisse le doigt (`touch-action: none`).
- Un tap sur l'avatar ouvre la **fiche planning** du bénévole dans un *bottom sheet* :
  - ses créneaux (heure début–fin, durée, zone) et ses plages libres ou indisponibles ;
  - son total d'heures ;
  - un bouton **Voir ses équipes par zone**, qui passe en vue zones avec ce bénévole surligné et la zone de son premier créneau sélectionnée.

**Par zone** :
- Chips de zones en haut, avec une pastille rouge qui donne le nombre de places manquantes.
- Liste verticale des créneaux de la zone choisie. Chaque ligne montre l'heure, les avatars affectés, des ronds pointillés pour les places minimum non pourvues, une pastille « a/min » et le nombre de libres.
- Un tap sur un créneau le sélectionne. Un tap sur un second créneau étend la sélection à la plage. La barre du bas affiche alors **Affecter**, qui ouvre le panneau d'affectation en *bottom sheet*.
- Quand un bénévole est suivi, la barre du bas affiche « Présences de X surlignées », un bouton **Son planning** qui ouvre sa fiche, et un bouton pour effacer le suivi.
- **Pas d'en-têtes de périodes** : la liste est continue.

Le mode lecture seule s'applique aussi sur mobile : pas de palette, et le panneau d'affectation est consultable sans boutons d'action.

---

## 4. Modèle de données

### 4.1 Nouveau : places minimum par zone et par créneau (`needs`)

Format **creux**, sur le même principe que `cells` : seuls les minimums supérieurs à 0 sont stockés.

**Front — `volunteer-planning-model.ts`**
```ts
export type NeedCell = {
    categoryId: string;
    slotIndex: number;
    min: number;          // >= 1 (0 = entrée supprimée)
};

export type Day = {
    // … champs existants inchangés
    needs: NeedCell[];    // NOUVEAU
};
```

**Front — `volunteer-planning.service.ts`**
```ts
export interface VolunteerPlanningNeedDto { categoryId: string; slotIndex: number; min: number; }
export interface VolunteerPlanningDayDto {
    // … existant
    needs?: VolunteerPlanningNeedDto[];   // optionnel : rétro-compatible
}
```
Mapping : dans `fromPlanningVolunteersDto`, `needs: d.needs ?? []`. Dans `toPlanningConfigurationDto`, `needs: d.needs.filter(n => n.min > 0)`.

**Back — `ch.salon.domain`**
```java
@Data
public class VolunteerPlanningNeed {
    private String categoryId;
    private int slotIndex;
    private int min;
}
```
```java
// VolunteerPlanningDay.java
private List<VolunteerPlanningNeed> needs = new ArrayList<>();
```
- Aucune migration Liquibase : `configuration` est un jsonb, et les anciens enregistrements sans `needs` se désérialisent en liste vide.
- Vérifier que `ActionDuplicateSalonHandler` copie bien `needs` lors de la duplication d'un salon. C'est le cas si la configuration est copiée en entier.
- Optionnel : afficher « a/min » dans `templates/document/volunteer-planning.html` (PDF).

### 4.2 Règles de nettoyage (à ajouter aux méthodes existantes)

| Méthode | Ajout |
|---|---|
| `applyCategories` | `needs = needs.filter(n => kept.has(n.categoryId))` |
| `applyDaySlice` | `needs = needs.filter(n => n.slotIndex < validSlotCount)` |
| `addNewDay` / jour vide | `needs: []` |
| `getEmptyPlanning` / fallbacks | `needs: []` partout où un `Day` est construit |

Les **périodes** (Ouverture, Midi…) de la maquette **ne sont pas implémentées** : aucun champ `periods`.

---

## 5. Comportements détaillés

### 5.1 Fonctions pures (nouveau fichier `volunteer-planning-utils.ts`)

Toute la logique métier est regroupée en fonctions pures, testables, sans dépendance Angular.

```ts
export const cellKey = (vId: string, slot: number) => `${vId}::${slot}`;

/** Suites consécutives d'un bénévole : une affectation ou une indisponibilité = un bloc. */
export type Run = { volunteerId: string; kind: 'CATEGORY' | 'UNAVAILABLE'; categoryId?: string; start: number; end: number }; // end exclusif
export function computeRuns(day: Day, volunteerId: string, slotCount: number): Run[];

export function countAssigned(day: Day, categoryId: string, slot: number): number;   // nb de bénévoles affectés
export function getNeed(day: Day, categoryId: string, slot: number): number;          // 0 si absent
export function setNeed(day: Day, categoryId: string, slot: number, min: number): Day; // min<=0 ⇒ supprime l'entrée
export type CoverageState = 'none' | 'under' | 'ok' | 'over';                          // none = 0/0
export function coverage(assigned: number, min: number): CoverageState;
export function freeVolunteers(day: Day, slot: number): string[];                     // assignés au jour, sans cellule ni indispo
export function volunteerHours(day: Day, volunteerId: string): number;                // nb cellules × interval / 60

/** Applique un outil sur une plage [start, end[ pour un bénévole (même sémantique que applyTool existant). */
export function applyToolRange(day: Day, volunteerId: string, start: number, end: number, tool: Tool): Day;
/** Déplace / redimensionne / réaffecte un bloc. Les cellules indisponibles de la cible sont ignorées. */
export function moveRun(day: Day, run: Run, targetVolunteerId: string, newStart: number, newEnd: number): Day;
export function deleteRun(day: Day, run: Run): Day;
export function changeRunCategory(day: Day, run: Run, categoryId: string): Day;

/** Panneau d'affectation : statut d'un bénévole sur une plage d'une zone. */
export type RangeStatus = { here: number; free: number; unavailable: number; busy: Record<string, number>; length: number };
export function rangeStatus(day: Day, volunteerId: string, categoryId: string, start: number, endInclusive: number): RangeStatus;
export function assignOnRange(day: Day, volunteerId: string, categoryId: string, start: number, endInclusive: number, mode: 'free-only' | 'force'): Day;
export function unassignOnRange(day: Day, volunteerId: string, categoryId: string, start: number, endInclusive: number): Day;

/** Indicateurs du jour. */
export function dayStats(day: Day, categories: Category[]): { coveragePct: number; missingPlaces: number; plannedHours: number };
```

Règles :
- Toutes les fonctions retournent un **nouveau** `Day` (immutabilité, compatible avec les signals et OnPush). Reprendre l'approche « copie minimale » de `setCellCategory` et `setUnavailableCell` pour les performances.
- Un bénévole a **au plus une catégorie par créneau**, puisque `cells` est indexé par (bénévole, créneau).
- `assignOnRange(..., 'free-only')` n'écrit que sur les créneaux sans cellule et non indisponibles. `'force'` écrase les autres catégories, mais jamais une indisponibilité.

### 5.2 État de l'écran (store local au composant)

Créer `volunteer-planning.store.ts`, un `@Injectable()` fourni dans `providers` du composant page, qui regroupe l'état aujourd'hui dispersé dans le composant :

```ts
planning        = signal<Planning>(empty);
selectedDayId   = signal<string>('');
isReadOnly      = signal(true);
isLoading       = signal(false);
viewMode        = signal<'both' | 'person' | 'zone'>('both');   // desktop
mobileView      = signal<'person' | 'zone'>('person');          // mobile
tool            = signal<Tool>({ kind: 'CATEGORY', categoryId: … });
focusVolunteerId= signal<string | null>(null);                  // bénévole suivi dans les deux vues
zoneSelection   = signal<{ categoryId: string; start: number; end: number; anchor: number } | null>(null);
blockSelection  = signal<Run | null>(null);
editMinimums    = signal(false);
history         = signal<Day[]>([]);                             // pile d'annulation (jour courant)
// computed : selectedDay, timeSlots, visibleVolunteers, runsByVolunteer, coverageMatrix, dayStats…
updateDay(fn: (d: Day) => Day, recordHistory = true): void;     // point d'entrée unique des mutations
undo(): void;
```
- `history` est vidée à l'enregistrement, à l'annulation et au changement de jour.
- `zoneSelection` et `blockSelection` sont remises à `null` au changement de jour ou de mode lecture/édition.

### 5.3 Vue Bénévoles (timeline) — composant `planning-timeline`

**Géométrie**
- Largeur d'un créneau selon `intervalMinutes` : `{60: 68, 30: 40, 15: 28, 5: 14}` px. Colonne des noms : 170 px, collante (`position: sticky; left: 0`).
- Ligne de 46 px. Fond quadrillé : `repeating-linear-gradient(to right, var(--app-border) 0 1px, transparent 1px var(--slot-w))`.
- En-tête collant en haut avec les heures, en réutilisant `computeTimeSlots().displayLabel`. **Pas de bandeau de périodes.**
- Bloc : `left = start * W + 2`, `width = (end - start) * W - 4`, coins arrondis à 8 px.
  - Contenu : icône, libellé, puis « HH:MM–HH:MM ». Le libellé et l'heure sont masqués si la largeur est inférieure à 96 px (icône seule).
  - Bloc d'indisponibilité : fond hachuré gris, libellé « Indispo ».
- Colonne des noms : avatar rond coloré (initiales, teinte dérivée de l'id), nom, total d'heures à droite. Le total passe en orange s'il dépasse 6 h.

**Interactions (édition uniquement, Pointer Events)**

| Geste | Effet |
|---|---|
| Glisser dans le vide d'une ligne | Fantôme pointillé, puis au relâchement `applyToolRange(start, end, tool)`. Les **4 outils** fonctionnent ainsi : catégorie, gomme, indispo, dispo. |
| Clic sur un bloc | Sélection, plus un popover sous le bloc : pastilles de catégories (changer de zone) et corbeille. |
| Glisser un bloc (> 5 px) | Déplacement horizontal, et vertical vers la ligne d'un autre bénévole (réaffectation) → `moveRun`. Toast « Buvette réaffecté·e à Davy ». |
| Glisser une poignée gauche ou droite (9 px) | Redimensionnement → `moveRun` sur le même bénévole. |
| Clic sur un nom | Suit ce bénévole (`focusVolunteerId`) : les blocs des autres lignes passent à 28 % d'opacité, sa ligne est surlignée et ses avatars sont mis en évidence côté zones. |
| `Suppr` / `Retour arrière` | Supprime le bloc sélectionné. |
| `Échap` | Désélectionne tout. |

- Pendant un glisser, utiliser `document.elementFromPoint` pour trouver la ligne cible et le throttle `requestAnimationFrame` déjà présent (`queuePaint`).
- Écouter `pointerup`, `pointercancel` et `blur` sur `window` pour terminer le geste (comme le `@HostListener` actuel).
- En lecture seule : aucun fantôme, aucun popover, aucune poignée, curseur par défaut. Le clic sur un nom (suivi) reste actif.

**Lien avec les zones** : si `zoneSelection` existe, dessiner une **bande** translucide (accent à 9 %, bordures pointillées) sur les colonnes `[start, end]`. Les blocs de cette catégorie qui chevauchent la plage reçoivent un contour accent de 2 px et ne sont pas atténués par le suivi.

### 5.4 Couverture et places minimum

- Chaque créneau de zone affiche **« affectés / minimum »**, coloré selon `coverage()` :
  - `under` : rose, places manquantes ;
  - `ok` : vert ;
  - `over` : orange, sureffectif ;
  - `none` : rien, ou « – ».
- En mode **Bénévoles seul**, ces lignes s'affichent sous la timeline, avec le bouton **Modifier les minimums** (édition uniquement). Le bouton bascule `editMinimums`, et chaque case devient alors un mini-stepper vertical `+ / a/min / −` qui appelle `setNeed`.
- Sur mobile, le bouton **Minimums** ouvre un *bottom sheet* avec le même tableau éditable (zones × créneaux).
- Indicateurs du jour, à droite des onglets : **Minimums couverts** (%), **Places à pourvoir**, **Heures planifiées** (`dayStats`).

### 5.5 Vue Zones (alignée) — composant `planning-zones`

- Une ligne par catégorie, dans le même conteneur et avec la même largeur de créneau que la timeline.
  - Colonne collante avec la pastille de zone (couleur et icône), le libellé et « heures affectées / heures minimum ».
  - Une case par créneau : `left = i * W + 2`, `width = W - 4`. Le fond suit l'état de couverture.
  - La case contient les avatars (20 px) des affectés, puis un rond pointillé rose par place minimum non pourvue.
  - La hauteur de ligne s'adapte au nombre maximal d'avatars : `max(40, ceil(max / perLine) * 22 + 10)`.
- Dernière ligne **Libres** : nombre de bénévoles du jour sans affectation et disponibles, par créneau.
- **Sélection de plage** : appui sur une case puis glisser horizontalement sur la même ligne → `zoneSelection` (contour accent de 2 px). La sélection est possible aussi en lecture seule, pour consulter qui est présent.
- Si un bénévole est suivi, les avatars des autres passent à 18 % d'opacité et le sien grossit avec un anneau.

**Panneau latéral (composant `zone-assign-panel`)**
- **Sans sélection** : liste des bénévoles du jour avec avatar, nom, total d'heures et une mini-frise colorée de leur journée. Un clic suit le bénévole.
- **Avec sélection** :
  - En-tête : zone et « HH:MM → HH:MM · n créneaux ».
  - Ligne **Min / créneau** avec `−` et `+`, qui appliquent `setNeed` à toute la plage. Si les minimums diffèrent dans la plage, afficher « 1–2 ». Pastille « affectés/min » à côté.
  - Bénévoles groupés et triés selon `rangeStatus` :
    1. **Dans cette zone** → boutons `Retirer` (et `Compléter` s'il reste des créneaux libres dans la plage).
    2. **Libres sur toute la plage** → bouton principal `Ajouter` (`assignOnRange 'free-only'`).
    3. **Partiellement libres** (« Libre 2/3 · Buvette 1 ») → `Ajouter`, qui ne remplit que les créneaux libres.
    4. **Dans une autre zone** (« En Cuisine 3 ») → `Déplacer ici` (`assignOnRange 'force'`).
    5. **Indisponibles** → grisés, sans action.
  - En lecture seule : mêmes listes, sans les boutons ni les steppers.
  - Fermeture avec × ou `Échap`.

### 5.6 Raccourcis clavier (desktop, édition)

| Touche | Action |
|---|---|
| `1`…`9` | Sélectionne la catégorie n de la palette |
| `E` | Gomme |
| `X` | Indisponible |
| `D` | Disponible (`CLEAR_UNAVAILABLE`) |
| `Ctrl/Cmd + Z` | Annuler la dernière modification (`store.undo()`) |
| `Suppr` | Supprimer le bloc sélectionné |
| `Échap` | Fermer la sélection, le popover ou le suivi |

Ignorer les raccourcis quand le focus est dans un `input`, un `textarea` ou un dialog ouvert.

---

## 6. Découpage des composants

```
components/
├── volunteer-planning.component.{ts,html,scss}     # PAGE : en-tête/actions, onglets jours, sélecteur de vue,
│                                                   # indicateurs, dialogs existants, load/save, responsive
├── volunteer-planning.store.ts                     # §5.2
├── volunteer-planning-utils.ts                     # §5.1 (+ volunteer-planning-utils.spec.ts)
├── volunteer-planning-model.ts                     # + NeedCell, Day.needs
├── linked-view/
│   ├── planning-timeline.component.*              # §5.3 (lignes bénévoles, blocs, popover)
│   ├── planning-zones.component.*                 # §5.5 (lignes zones + Libres)
│   ├── coverage-rows.component.*                  # §5.4 (a/min + édition des minimums)
│   ├── zone-assign-panel.component.*              # panneau latéral
│   └── volunteer-avatar.component.ts              # avatar initiales + teinte
├── mobile/
│   ├── mobile-person-grid.component.*             # grille compacte + palette + Défiler/Peindre
│   ├── mobile-zone-list.component.*               # liste par zone
│   ├── person-planning-sheet.component.*          # fiche planning d'un bénévole
│   └── bottom-sheet.component.*                   # conteneur générique (backdrop + panneau animé)
└── (dialogs existants inchangés)
```

- **Responsive** : un signal `isMobile` alimenté par `BreakpointObserver` (`(max-width: 991.98px)`) ou par `matchMedia`. Le template de la page affiche soit `linked-view`, soit `mobile`.
- La timeline et les zones de la vue liée sont rendues **dans le même élément scrollable** (`.linked-scroller { overflow: auto; max-height: 76vh }`). Les zones sont dans un bloc `.zones-dock { position: sticky; bottom: 0; z-index: 11 }` quand le mode est `both`.
- Le sélecteur de vue et le suivi de bénévole vivent dans le store : en changeant de vue, on garde le jour, la sélection de plage et le bénévole suivi.

---

## 7. Styles

Réutiliser les variables CSS existantes du projet (`--app-surface`, `--app-surface-muted`, `--app-border`, `--app-text`, `--app-text-muted`, `--app-fs-xs`, `--app-fs-sm`…). Ajouter uniquement des variables locales au composant :

```scss
:host {
  --vp-accent: var(--p-primary-color);
  --vp-ok: #2b8a3e;     --vp-ok-bg: #e7f5ea;
  --vp-under: #d6336c;  --vp-under-bg: #fdeaf0;
  --vp-over: #d9480f;   --vp-over-bg: #fff1e6;
  --vp-unav: #a3a8b1;
}
.block.unavailable {
  background: repeating-linear-gradient(135deg, var(--vp-unav) 0 4px,
              color-mix(in srgb, var(--vp-unav) 60%, transparent) 4px 9px);
  color: #fff;
}
.zone-cell .seat { border: 1.5px dashed var(--vp-under); border-radius: 50%; }
```
- Couleur de texte sur les blocs et pastilles de catégorie : `#1c2230`, car les couleurs de catégories sont pastel.
- Avatar : `background: hsl(<hash(id) % 360> 55% 52%)`, texte blanc, 2 lettres.
- Toutes les zones de glisser ont `user-select: none` et `touch-action: none`. Exception : les cases de la grille mobile en mode Défiler, en `touch-action: pan-x pan-y`.

---

## 8. i18n (`planningVolunteers.json`, fr)

Ajouter (et l'équivalent dans les autres langues présentes) :

```json
{
  "planningVolunteers": {
    "view": { "both": "Les deux", "persons": "Bénévoles", "zones": "Zones", "byPerson": "Par bénévole", "byZone": "Par zone" },
    "kpi": { "coverage": "Minimums couverts", "missing": "Places à pourvoir", "hours": "Heures planifiées" },
    "zones": { "title": "Équipes par zone", "hint": "Glissez sur une ligne pour sélectionner une plage", "free": "Libres" },
    "coverage": { "title": "Couverture · affectés / minimum", "editMin": "Modifier les minimums", "done": "Terminer", "minPerSlot": "Min / créneau" },
    "panel": {
      "volunteersOfDay": "Bénévoles du jour",
      "inZone": "Dans cette zone", "freeAll": "Libres sur toute la plage", "freePartial": "Partiellement libres",
      "otherZone": "Dans une autre zone", "unavailable": "Indisponibles",
      "add": "Ajouter", "complete": "Compléter", "remove": "Retirer", "moveHere": "Déplacer ici"
    },
    "focus": { "following": "Présences de {{name}} surlignées", "clear": "Effacer" },
    "person": { "title": "Planning de {{name}}", "seeZones": "Voir ses équipes par zone", "free": "Libre", "noSlot": "Aucun créneau ce jour" },
    "mobile": { "scroll": "Défiler", "paint": "Peindre", "minimums": "Minimums", "assign": "Affecter", "hisPlanning": "Son planning" },
    "toast": { "reassigned": "{{zone}} réaffecté·e à {{name}}", "undone": "Action annulée" }
  }
}
```
Les clés existantes (`manageCategories`, `manageVolunteers`, `removeDay`, `palette.*`, `interval.*`) restent utilisées.

---

## 9. Plan d'implémentation (à suivre dans l'ordre)

1. **Back** : créer `VolunteerPlanningNeed` et ajouter `needs` à `VolunteerPlanningDay`. Vérifier la duplication de salon.
2. **Modèle et DTO front** : `NeedCell`, `Day.needs`, mappings in/out, `needs: []` dans tous les constructeurs de `Day`, règles de nettoyage (§4.2).
3. **`volunteer-planning-utils.ts` et ses tests unitaires** : couvrir au minimum `computeRuns`, `applyToolRange` (4 outils, indispo protégée), `moveRun` (changement de ligne, cible indisponible), `rangeStatus`, `assignOnRange` (free-only / force), `setNeed`, `dayStats`.
4. **Store** (§5.2) : y déplacer l'état et la logique load/save/download du composant actuel, sans changer leur comportement.
5. **Page** : réécrire le template en gardant tel quel le bloc en-tête et actions, la gestion des jours et les dialogs. Remplacer le `p-table` et la palette verticale par le sélecteur de vue, les indicateurs et `linked-view` / `mobile`.
6. **`planning-timeline`** : rendu, puis interactions (créer, sélectionner, popover, déplacer, redimensionner, suivi).
7. **`planning-zones`, `coverage-rows`, `zone-assign-panel`** et l'ancrage sticky en mode `both`.
8. **Mobile** : `bottom-sheet`, `mobile-person-grid` (Défiler/Peindre), `mobile-zone-list`, `person-planning-sheet` et les liens croisés.
9. **Undo et raccourcis clavier.**
10. **i18n** et nettoyage du SCSS de l'ancien écran.

---

## 10. Critères d'acceptation

- [ ] Toute la checklist du §2 est vérifiée manuellement.
- [ ] Un planning existant, enregistré sans `needs`, se charge sans erreur, avec des minimums à 0 partout.
- [ ] Enregistrer, puis recharger, restitue à l'identique `cells`, `unavailableCells`, `assignedVolunteerIds` et `needs`.
- [ ] Glisser un bloc sur un autre bénévole déplace les cellules. Les créneaux indisponibles de la cible ne sont jamais écrasés.
- [ ] En mode `both`, une affectation faite depuis le panneau des zones apparaît immédiatement dans la timeline, et inversement.
- [ ] La sélection d'une plage de zone se voit dans la timeline (bande et blocs encadrés). Le bénévole suivi se voit dans les deux vues.
- [ ] Changer de vue (Les deux / Bénévoles / Zones, ou Par bénévole / Par zone sur mobile) conserve le jour, la sélection et le suivi.
- [ ] En lecture seule : aucune modification possible, que ce soit à la souris, au tactile ou au clavier. Le menu **Actions** et le téléchargement PDF fonctionnent.
- [ ] Supprimer une catégorie supprime aussi ses `cells` et ses `needs`. Raccourcir un jour supprime les `cells`, `unavailableCells` et `needs` hors limites.
- [ ] Mobile (390 px) : aucun scroll horizontal de page. La grille défile dans son conteneur. Le mode Défiler n'empêche pas le scroll. Le mode Peindre peint au doigt.
- [ ] Fluidité : pas de saccade avec 30 bénévoles × 132 créneaux (jour de 11 h à 5 min). Utiliser `track` dans les `@for`, des `computed` mémoïsés par jour, et le rAF pendant les glisser.