# Refonte de la liste des tâches d'un salon

> Brief pour l'agent de développement (GitHub Copilot).
> Écran concerné : `src/main/webapp/app/admin/task/` (route `task-focus-list`).
> Maquette interactive validée (ordinateur et téléphone) : le lien artifact partagé avec ce fichier.
> Langue de l'interface : français. Toutes les chaînes passent par `ngx-translate` (`i18n/fr/task.json`).

---

## 1. Objectif

Remplacer la liste actuelle (cartes `task-card` + vue à plat `subtask-flat-row` + 7 pilules de filtre + `p-toggleswitch`) par un écran construit sur le **socle `entity-list`** déjà utilisé par la liste des stands (`admin/stand/list`) et des participations (`admin/participation/list`).

L'écran a **deux vues**, avec une bascule à libellés :

| Vue | Contenu | Tri | Groupes |
|---|---|---|---|
| **Tâches** | une carte repliable par tâche | **toujours par urgence** | **aucun** |
| **Sous-tâches** | toutes les sous-tâches à plat | **toujours par échéance** | Échéance (défaut), Responsable, Statut |

Contraintes transverses :

- **Réutiliser au maximum** les composants, classes `el-*` et variables CSS `--app-*` existantes.
- Le CSS spécifique va **dans le `.scss` du composant**, jamais dans `content/scss/` sauf s'il est réutilisable par d'autres listes.
- Aucun changement backend requis (vérifier seulement le point 4.5 sur `snoozedUntil`).

---

## 2. Fichiers

### À modifier / remplacer

| Fichier | Action |
|---|---|
| `admin/task/list/task-focus-list.component.{ts,html,scss}` | Réécrire : socle `entity-list`, deux vues, plus de `TaskFilter`, plus de pilules maison, plus de `p-toggleswitch`. |
| `admin/task/detail/task-card.component.{ts,html,scss}` | Réécrire (voir § 6). Supprimer les `p-tag` « En cours » / « Bloqué » du titre, la logique `activeFilter`, `accentClass`, l'édition inline du responsable. |
| `admin/task/detail/subtask-row.component.*` | **Remplacer** par `subtask-line` (§ 7). |
| `admin/task/detail/subtask-flat-row.component.*` | **Supprimer** (fusionné dans `subtask-line`). |
| `i18n/fr/task.json` | Ajouter les clés du § 10. Supprimer les clés `task.filter.*` devenues inutiles. |

### À créer

| Fichier | Rôle |
|---|---|
| `admin/task/shared/subtask-status-icon.component.ts` | Pastille SVG de statut (§ 5). |
| `admin/task/shared/subtask-status-panel.component.{ts,html,scss}` | Panneau ouvert au clic sur la pastille : radios de statut + échéance + attribution (§ 8). |
| `admin/task/detail/subtask-line.component.{ts,html,scss}` | Ligne de sous-tâche, utilisée dans la vue à plat **et** dans les cartes (§ 7). |
| `admin/task/shared/due-label.component.ts` | Libellé de délai en jours, avec la variante « repoussée » (§ 4.4). |
| `admin/task/shared/task-urgency.utils.ts` | Fonctions pures : date effective, urgence, tri, groupes (§ 4). Avec tests unitaires. |
| `admin/task/shared/responsible-avatar.component.ts` | Pastille d'initiales du responsable (§ 7.3). |

---

## 3. Socle `entity-list` à réutiliser

Import depuis `app/shared/components/entity-list` (barrel `index.ts`).

| Élément existant | Usage ici |
|---|---|
| `EntityListState` | Un état pour la vue Sous-tâches : `defaultGroupBy: 'urgency'`, `defaultSort: 'due'`, `sortOptions: []` (pas de choix de tri), `collapsedByDefault: g => g === 'urgency' ? ['DONE'] : g === 'status' ? ['DONE'] : []`. Pour la vue Tâches, seuls `query` et `activeChips` servent. Appeler `connectQueryParams(route, router)` comme dans `stand.component.ts` et ajouter un query param `view=tasks|subtasks`. |
| `entity-list-toolbar` | Recherche + bouton « Grouper » + puces. **Vue Tâches** : le bouton « Grouper et trier » ne doit pas apparaître. Aujourd'hui `entity-list-toolbar` affiche toujours `entity-group-sort-menu` : ajouter un input `showGroupSort = input(true)` au toolbar et un `@if (showGroupSort())` autour du menu (rétrocompatible pour stands/participations). **Vue Sous-tâches** : `groupOptions` = Échéance, Responsable, Statut ; `sortOptions=[]`. |
| `FilterChipGroup` / `applyChipFilters` | Groupe **Statut** (`mode: 'or'`) : À faire, En cours, Bloquées, Terminées (avec la pastille SVG en icône, cf. § 5). Groupe **Signaux** (`mode: 'and'`) : En retard, Sans responsable. **Pas** de puce « repoussée », **pas** de puce « fournisseur ». `buildStatusChipGroup` est typé sur l'enum `Status` des stands : construire le groupe à la main avec `TaskStatus`. |
| `entity-list-group` | En-têtes de groupe de la vue Sous-tâches (collant, chevron, point de couleur, compteur, résumé, barre). Le slot `[groupSummary]` affiche « ◐ 2 en cours · ⊖ 1 bloquée » (+ « 3/7 » quand le groupe est Responsable). |
| `groupByKey(items, order, keyFn, labelFn, colorFn)` | Construire les groupes (§ 4.6). |
| `matchesSearch` / `entity-highlight` | Recherche sur titre de sous-tâche, titre de tâche, responsable. Surligner dans les titres. |
| `entity-actions-menu` + `EntityAction` | **Rouage d'actions de la tâche** (§ 6.3), classe `.el-gear` déjà stylée dans `_entity-list.scss`. |
| `.el-empty`, `button-box translateKey="entityList.clearFilters"` | États vides, comme dans `stand.component.html`. |

Garder dans `appMenuBarEnd` le `menu-box` existant (Nouvelle tâche, Rafraîchir, actions métier serveur dont « Recalculer les dates »).

---

## 4. Règles métier (dans `task-urgency.utils.ts`, testées)

Toutes les dates sont des `LocalDate` (`'YYYY-MM-DD'`). Utiliser `dayjs().startOf('day')` comme dans `days-relative.pipe.ts`.

### 4.1 Sous-tâche active

`active = status !== 'DONE' && status !== 'CANCELLED'`. `CANCELLED` se comporte comme `DONE` (non active) mais n'est jamais proposé dans le panneau de statut.

### 4.2 Échéance effective (« repoussée »)

```ts
isMoved(s)  = active(s) && !!s.snoozedUntil && !!s.dueDate && s.snoozedUntil !== s.dueDate
effectiveDue(s) = isMoved(s) ? s.snoozedUntil : s.dueDate
```

**« Repoussée » n'est pas un statut.** Une sous-tâche peut être Bloquée *et* repoussée. Elle se range partout selon `effectiveDue`.

### 4.3 Jours restants

`n = effectiveDue − aujourd'hui` en jours.

| n | Libellé (`task.due.*`) |
|---|---|
| `null` | sans date |
| `< -1` | `{{n}} j de retard` |
| `-1` | hier |
| `0` | aujourd'hui |
| `1` | demain |
| `> 1` | dans `{{n}} j` |
| sous-tâche terminée | `fait {{timeSince}}` (pipe `timeSince` existant) |

### 4.4 Libellé d'une échéance repoussée (`due-label`)

Une seule ligne, **sans icône**, le mot « dans » **une seule fois**, **seuls les jours sont barrés** :

| Ancien (dueDate) | Nouveau (snoozedUntil) | Rendu HTML |
|---|---|---|
| dans 7 j | dans 9 j | `dans <s>7 j</s> 9 j` |
| 7 j de retard | 3 j de retard | `<s>7 j</s> 3 j de retard` |
| autres cas (retard → futur, etc.) | | `<s>3 j de retard</s> dans 3 j` |

- `title` (survol) : « Limite repoussée de 6 j : mer. 21 oct. → mar. 27 oct. »
- Pas de date sous le délai. Date exacte uniquement au survol (`title`), format `fr-CH` (`EEE d MMM`).
- Couleur du texte = urgence de la **nouvelle** date (§ 9). Le `<s>` est en `--app-text-muted`, poids normal.
- Envelopper chaque morceau dans `white-space: nowrap` pour que, sur téléphone, la coupure tombe entre l'ancien et le nouveau délai.

### 4.5 Repousser / revenir

- « +1 j / +3 j / +7 j » : `nouvelleDate = max(effectiveDue, aujourd'hui) + N`, puis
  `taskInstanceService.patchSubtask(id, { snoozeUntilType: 'FIXED', snoozedUntil: nouvelleDate, snoozeOffset: null })`.
- « Revenir au {{date}} » (visible seulement si `isMoved`) :
  `patchSubtask(id, { snoozeUntilType: null, snoozedUntil: null, snoozeOffset: null })`.
- ⚠️ Vérifier que `PATCH /subtasks/{id}` accepte ces champs et ne recalcule pas `snoozedUntil` depuis `snoozeOffset` quand `snoozeUntilType = 'FIXED'`. Sinon, signaler avant d'aller plus loin.

### 4.6 Urgence (clé de groupe et de tri)

```ts
type Urgency = 'LATE' | 'TODAY' | 'WEEK' | 'LATER' | 'NODATE' | 'DONE'; // UrgencyGroup existe déjà, l'étendre
urgency(s): !active(s) → 'DONE'; n==null → 'NODATE'; n<0 → 'LATE'; n==0 → 'TODAY'; n<=7 → 'WEEK'; sinon 'LATER'
```

Ordre des groupes : `LATE, TODAY, WEEK, LATER, NODATE, DONE`. Libellés : En retard, Aujourd'hui, Dans les 7 jours, Plus tard, Sans date, Terminées. `DONE` replié par défaut.

**Groupe Responsable** : `owner(s) = s.responsible ?? task.responsible ?? null`. Ordre : « Sans responsable » en premier, puis alphabétique (`compareAlpha`).
**Groupe Statut** : ordre `BLOCKED, IN_PROGRESS, PENDING, DONE` (libellés Bloquées, En cours, À faire, Terminées). `DONE` replié.

### 4.7 Tri

- **Sous-tâches** : toujours `effectiveDue` croissante, `null` en dernier, puis `sortOrder`. Pas d'option de tri.
- **Tâches** : toujours par **score d'urgence** décroissant, puis `effectiveDue` de la prochaine sous-tâche active :
  ```
  score = late*100 + blocked*50 + today*30 − (toutes terminées ? 1000 : 0)
  ```
  Pas de groupe, pas d'option de tri, pas de tri par titre.

### 4.8 Prochaine sous-tâche d'une tâche

Première sous-tâche active triée par `effectiveDue` (l'interface `INextSubtask` existe déjà).

---

## 5. Pastille de statut (`subtask-status-icon`)

Remplace `p-checkbox` **et** tout libellé de statut dans la ligne. **Un seul indicateur de statut par ligne** : pas de `p-tag`, pas de texte « En cours » / « Bloquée », pas de titre coloré.

SVG 20×20, la **forme** porte l'information (lisible sans couleur) :

| Clé | Forme | Couleur |
|---|---|---|
| `PENDING` | cercle vide (trait 2 px) | `--app-text-muted` |
| `LATE` (= PENDING en retard) | cercle vide + point central | `--app-status-refused` |
| `IN_PROGRESS` | cercle vide + demi-disque droit plein | `--app-primary` |
| `BLOCKED` | disque plein + barre horizontale blanche | `--app-offer` |
| `DONE` | disque plein + coche blanche | `--app-status-validated` |

```html
<!-- extrait : IN_PROGRESS -->
<svg viewBox="0 0 20 20" aria-hidden="true">
  <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M10 4.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/>
</svg>
```

Formes complètes (copier telles quelles) :

```ts
PENDING:     '<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/>'
LATE:        PENDING + '<circle cx="10" cy="10" r="2.6" fill="currentColor"/>'
IN_PROGRESS: PENDING + '<path d="M10 4.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/>'
BLOCKED:     '<circle cx="10" cy="10" r="8.5" fill="currentColor"/><rect x="5.5" y="8.8" width="9" height="2.4" rx="1" fill="var(--app-surface)"/>'
DONE:        '<circle cx="10" cy="10" r="8.5" fill="currentColor"/><path d="M6.3 10.3l2.5 2.5 4.9-5.2" fill="none" stroke="var(--app-surface)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
```

- Rendue dans un `<button>` 24×24, `border-radius: 50%`, fond `--app-surface-muted` au survol.
- `aria-label` : « Statut : En cours. Changer le statut » ; `title` : « En cours » (+ « · en retard »).
- Réutilisée dans : la ligne, les puces de filtre Statut, le résumé des en-têtes de groupe, le panneau.

---

## 6. Vue Tâches : carte `task-card`

### 6.1 Structure

```
┌──────────────────────────────────────────────────────────┐
│ Titre de la tâche                                2/5  ▾  │  ← en-tête cliquable (role=button, aria-expanded)
│ Prochaine : Confirmer les menus   demain                 │  ← seulement si repliée
│ ▬▬▬▬ ▬▬▬▬ ▬▬▬▬ ▬▬▬▬ ▬▬▬▬                            ⚙  │  ← barre segmentée + rouage d'actions
├──────────────────────────────────────────────────────────┤
│ Description (si présente)                                │  ← seulement si dépliée
│ Resp. Marc · 2 comm. · Voir dans la liste →              │
│ ◐ Relancer les contrats non signés     4 j de retard  MA │  ← subtask-line (sans nom de tâche)
│ ◐ Attribuer les emplacements                dans 7 j  MA │
│ ▸ 2 terminées                                            │  ← terminées repliées
│ [ Ajouter une sous-tâche…                ] [Ajouter]     │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Règles

- **Pas de pastilles/badges à côté du titre** (pas de « 2 en retard », « 1 bloquée », « En cours »). La barre segmentée suffit.
- **Repliée par défaut, sauf la première carte** (la plus urgente après tri). Pendant une recherche (`state.isFiltering`), toutes les cartes qui ont un résultat s'ouvrent. Un clic sur l'en-tête bascule ; l'état choisi par l'utilisateur est conservé (`Map<taskId, boolean>` dans le composant liste).
- Bordure de carte `color-mix(in srgb, var(--app-danger) 45%, var(--app-border))` si au moins une sous-tâche en retard.
- **Barre segmentée** : un segment par sous-tâche (triées par `effectiveDue`), hauteur 5 px, `gap: 3px`, `border-radius: 2px`. Couleur : DONE `--app-status-validated`, IN_PROGRESS `--app-primary`, BLOCKED `--app-offer`, PENDING en retard `--app-danger`, PENDING aujourd'hui `--app-warning`, sinon `--app-border`. `title` = « titre · statut ».
- « Voir dans la liste → » : passe en vue Sous-tâches avec une puce de contexte Tâche : X (filtre sur `taskInstanceId`).
- Ajout rapide : `taskInstanceService.addSubtask(task.id, { title })`, Entrée pour valider, champ garde le focus.

### 6.3 Rouage d'actions

- Tout **en bas à droite de l'en-tête**, sur la même ligne que la barre segmentée (`display:flex; gap:10px`, barre en `flex:1`).
- Utiliser **`<entity-actions-menu [actions]="actions()">`** (rendu `.el-gear` + `pi pi-cog`, identique aux stands et participations). Le clic ne doit pas plier/déplier la carte (`$event.stopPropagation()` déjà géré par `openMenu`).
- Construire les `EntityAction[]` **une fois par jeu de données** (`computed` + `Map`), comme `participation.component.ts > rowActions`, pour éviter le double clic.
- Actions (reprendre les clés existantes `task.menu.*`) :
  1. Modifier la tâche — `pi pi-pencil` → ouvre le `dialog-box` + `app-task-instance-form` existant.
  2. *(séparateur)* Ajouter une sous-tâche — `pi pi-plus` → déplie la carte et focus le champ d'ajout rapide (ou dialog existant).
  3. Ajouter un commentaire — `pi pi-comment` → dialog commentaire existant.
  4. Commentaires (n) — `pi pi-inbox`, `disabled` si 0 → affiche la section commentaires repliable existante.
  5. *(séparateur)* Supprimer la tâche — `pi pi-trash`, `danger: true` → **`ConfirmDialogService.confirmAction(target, 'task.menu.deleteConfirm')`** (remplace le `confirm()` natif actuel).
- Si des actions serveur existent pour la tâche (`ActionsService.getAvailableActions('task', id, …)`), les ajouter après un séparateur avec `MenuItemBuilderService`, comme pour le menu de la page.

---

## 7. Ligne de sous-tâche `subtask-line`

### 7.1 Grille

```
[pastille 24px] [titre ……… tâche parente…] [délai auto] [avatar 20px]
```

```scss
:host { display: block; }
.st-line {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto 20px;
  gap: 10px;
  align-items: center;
  min-height: 40px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background-color: var(--app-surface);
  &:hover { background: var(--app-surface-muted); }
  & + & { box-shadow: 0 -1px 0 var(--app-line); }  // filet entre lignes, pas de cadre
}
.st-main { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
.st-title {                       // PRIORITAIRE : ne rétrécit pas avant 75 %
  flex: 0 0 auto; max-width: 75%;
  font-size: var(--app-fs-md); font-weight: 500; color: var(--app-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.st-task {                        // SECONDAIRE : rétrécit en premier, ellipsis
  flex: 0 1 auto; min-width: 0; margin-left: auto; text-align: right;
  font-size: var(--app-fs-sm); color: var(--app-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background: none; border: 0; padding: 0; cursor: pointer;
  &:hover { color: var(--app-text); text-decoration: underline; }
}
.st-due { min-width: 92px; text-align: right; }

@container el (max-width: 600px) {   // .el-list déclare déjà container-name: el
  .st-line { align-items: start; gap: 4px 8px; padding: 6px 4px; }
  .st-main { flex-direction: column; align-items: stretch; gap: 1px; }
  .st-title { max-width: none; white-space: normal; overflow-wrap: anywhere; line-height: 1.3; }
  .st-task { margin-left: 0; text-align: left; }
  .st-due { min-width: 0; max-width: 110px; white-space: normal; }
}
.is-done .st-title { text-decoration: line-through; color: var(--app-text-muted); }
```

### 7.2 Contenu

- **Pastille** (§ 5) → ouvre le panneau (§ 8).
- **Titre** : `entity-highlight` sur la recherche, `title` = titre complet.
- **Tâche parente** (`@if (showTask)`) : texte seul, **sans puce de couleur**, ellipsis, `title` = « {{titre}} · ouvrir la carte ». Clic → vue Tâches, carte dépliée et défilée (`scrollIntoView` + courte animation `box-shadow` `--app-primary`). Masquée quand la ligne est dans une carte, ou quand la vue Sous-tâches est groupée par Tâche (non proposé pour l'instant).
- **Délai** : `due-label` (§ 4.3, 4.4).
- **Avatar responsable** tout à droite (§ 7.3). Masqué (cellule vide, colonne conservée) quand la vue est groupée par Responsable.
- **Pas** de menu ⋯ (tout passe par le panneau), **pas** de fournisseur, **pas** de `p-tag`.

### 7.3 Avatar `responsible-avatar`

- 20×20, rond, initiales (2 premières lettres, majuscules), `font-size: 10px; font-weight: 700`.
- `s.responsible` défini : fond plein, texte `--app-surface`.
- Seulement `task.responsible` : **contour** 1,5 px de la même couleur, fond transparent (« via la tâche » dans le `title`).
- Personne : contour **pointillé** `--app-warning`, texte « ? », `title` « Sans responsable ».
- Couleur stable par personne : index du nom dans la liste triée des responsables, modulo la palette existante :
  `[--app-primary, --app-accent, --app-offer, --app-amber, --app-share, --app-exit]`.

---

## 8. Panneau de statut `subtask-status-panel`

`p-popover` ancré sur la pastille (`appendTo="body"`), largeur 260 px. Sections séparées par `<hr>` :

1. **STATUT** — `role="radiogroup"`, 4 options en `p-radiobutton` (ou `<input type="radio">` stylé) : À faire, En cours, Bloquée, Terminée, chacune précédée de sa pastille. Statut courant coché + fond `--app-surface-muted` + `font-weight: 700`.
   Changement → `taskInstanceService.updateSubtaskStatus(id, status)`, fermeture du panneau, toast avec **Annuler** (rétablit l'ancien statut).
2. **ÉCHÉANCE** (si active) — « Limite : **mar. 27 oct.** · dans 3 j », + « Limite d'origine : mer. 21 oct. » si repoussée. Boutons pilule « Repousser +1 j · +3 j · +7 j » et lien « Revenir au 21 oct. » (§ 4.5).
3. **ATTRIBUER À** — pilules des responsables connus (union des `responsible` de toutes les tâches/sous-tâches du salon) + « Personne » si déjà attribuée. → `patchSubtask(id, { responsible })`.
4. « Modifier… » → `dialog-box` + `app-subtask-instance-form` existant.

Clavier : Tab jusqu'à la pastille, Entrée ouvre, focus sur le radio coché, flèches pour changer, Échap ferme.

Styles des titres de section : reprendre `.el-radio-label` (`--app-fs-xs`, `700`, `uppercase`, `letter-spacing: .06em`, `--app-text-muted`).

---

## 9. Couleurs : correspondance avec les variables du projet

**Ne pas créer de nouvelles couleurs.** Utiliser ces variables de `content/scss/_variables.scss` :

| Usage | Variable |
|---|---|
| Fond carte / ligne | `--app-surface` |
| Survol ligne, fond actif | `--app-surface-muted` |
| Bordures | `--app-border` ; filets fins `--app-line` |
| Texte / texte secondaire | `--app-text` / `--app-text-muted` |
| **En retard** (texte délai, pastille LATE) | `--app-status-refused` ; segment de barre `--app-danger` |
| **Aujourd'hui** | `--app-warn` (texte) ; segment `--app-warning` |
| **Dans les 7 jours** | `--app-primary` |
| Plus tard / sans date | `--app-text-muted` |
| **En cours** | `--app-primary` (fond doux : `--app-primary-soft`) |
| **Bloquée** | `--app-offer` |
| **Terminée** | `--app-status-validated` |
| Sans responsable | `--app-warning` (pointillé) |
| Sélection / focus | `--app-primary`, `--app-primary-soft`, `--app-primary-line` |
| Tailles de texte | `--app-fs-xs`, `--app-fs-sm`, `--app-fs-md` |

Si un composant a besoin d'un alias, le déclarer **dans son `:host`** :

```scss
:host {
  --st-late: var(--app-status-refused);
  --st-progress: var(--app-primary);
  --st-blocked: var(--app-offer);
  --st-done: var(--app-status-validated);
}
```

Couleurs des groupes (`colorFn` de `groupByKey`) : LATE `--app-danger`, TODAY `--app-warning`, WEEK `--app-primary`, LATER/NODATE `--app-text-muted`, DONE `--app-status-validated` ; Statut : mêmes que ci-dessus ; Responsable : couleur de l'avatar, « Sans responsable » `--app-warning`.

---

## 10. En-tête de page

- Titre `task.focusView.title` dans `appMenuBarStart` (inchangé), menu actions + retour dans `appMenuBarEnd` (inchangé).
- Bandeau compact (`--app-surface-muted`, `border-radius: 10px`) qui **remplace** les deux bandeaux actuels :
  - « **21 j** avant le salon · sam. 14 nov. » (jours entre aujourd'hui et `salon.startingDate`).
  - Barre empilée de progression : terminées `--app-status-validated`, en cours `--app-primary`, bloquées `--app-offer`, en retard `--app-danger`, et « 5/24 ».
  - Légende avec seulement les compteurs non nuls.
  - Si `isDatesDesynchronized` : pilule `--app-warn-soft` / `--app-warn` « 3 dates à recalculer » + bouton « Recalculer » qui déclenche l'action métier `salon-recalculate-task-dates` existante.

---

## 11. Traductions à ajouter (`i18n/fr/task.json`, sous `task`)

```json
"list": {
  "viewTasks": "Tâches",
  "viewSubtasks": "Sous-tâches",
  "searchPlaceholder": "Rechercher une sous-tâche, une tâche, une personne…",
  "daysBeforeSalon": "avant le salon",
  "next": "Prochaine :",
  "seeInList": "Voir dans la liste",
  "taskContext": "Tâche : {{title}}",
  "doneCount": "{{count}} terminée(s)",
  "addSubtaskPlaceholder": "Ajouter une sous-tâche…",
  "add": "Ajouter",
  "openTask": "Ouvrir la carte de la tâche",
  "datesToRecalculate": "{{count}} dates à recalculer",
  "recalculate": "Recalculer"
},
"group": {
  "urgency": "Échéance",
  "responsible": "Responsable",
  "status": "Statut",
  "noResponsible": "Sans responsable",
  "urgencyKey": { "LATE": "En retard", "TODAY": "Aujourd'hui", "WEEK": "Dans les 7 jours", "LATER": "Plus tard", "NODATE": "Sans date", "DONE": "Terminées" },
  "statusKey": { "BLOCKED": "Bloquées", "IN_PROGRESS": "En cours", "PENDING": "À faire", "DONE": "Terminées" },
  "inProgress": "{{count}} en cours",
  "blocked": "{{count}} bloquée(s)"
},
"chip": {
  "late": "En retard",
  "noResponsible": "Sans responsable"
},
"due": {
  "none": "sans date",
  "today": "aujourd'hui",
  "tomorrow": "demain",
  "yesterday": "hier",
  "in": "dans {{n}} j",
  "late": "{{n}} j de retard",
  "lateSuffix": "de retard",
  "inPrefix": "dans",
  "days": "{{n}} j",
  "done": "fait {{since}}",
  "movedTitle": "Limite repoussée de {{n}} j : {{from}} → {{to}}"
},
"panel": {
  "status": "Statut",
  "deadline": "Échéance",
  "limit": "Limite :",
  "originalLimit": "Limite d'origine :",
  "push": "Repousser",
  "pushDays": "+{{n}} j",
  "backTo": "Revenir au {{date}}",
  "assignTo": "Attribuer à",
  "nobody": "Personne",
  "edit": "Modifier…",
  "changeStatus": "Statut : {{status}}. Changer le statut",
  "statusChanged": "Statut : {{status}}",
  "pushed": "Limite repoussée : {{label}}",
  "restored": "Limite d'origine rétablie",
  "undo": "Annuler"
}
```

Et corriger `task.status.PENDING` en « À faire », `BLOCKED` en « Bloquée », `DONE` en « Terminée » (accord avec « sous-tâche »).

---

## 12. À supprimer

- `TaskFilter`, `activeFilter`, les 7 compteurs `countXxx` et `applySubtaskFilter` de `task-focus-list.component.ts` (remplacés par les puces).
- `p-toggleswitch` et `flatViewBool`.
- Les deux bandeaux (date de référence, progression) remplacés par le bandeau du § 10.
- `subtask-flat-row.component.*`.
- Dans `task-card` : `p-tag` de statut du titre, chips responsable/fournisseur cliquables, édition inline du responsable, `accentClass` / `tc--late…`, `menu-box` ⋮ (remplacé par `entity-actions-menu`).
- Dans les lignes : `p-checkbox`, `p-tag` de statut, popover de date, `menu-box` ⋮, chips fournisseur.
- Groupes « Semaine » et « Tâche », groupe/filtre « Fournisseur », groupe/filtre « Reportées / repoussées », tout tri par titre.

---

## 13. Critères d'acceptation

- [ ] Bascule Tâches / Sous-tâches à libellés et compteurs ; conservée dans l'URL (`?view=`).
- [ ] Vue Tâches : cartes triées par urgence, **sans groupe**, **sans** bouton grouper/trier, **sans** badges près du titre.
- [ ] Seule la première carte est dépliée au chargement ; plier/déplier par clic sur l'en-tête.
- [ ] Rouage `.el-gear` en bas à droite de chaque carte, à côté de la barre segmentée, avec les 5 actions ; « Supprimer » passe par `ConfirmDialogService`.
- [ ] Vue Sous-tâches : triée par échéance effective ; groupes Échéance (défaut) / Responsable / Statut ; Terminées repliées.
- [ ] Ligne de sous-tâche ≤ 40 px sur ordinateur, une seule ligne ; sur téléphone, titre puis tâche en dessous.
- [ ] Le **titre de la sous-tâche n'est jamais coupé avant la tâche parente** ; la tâche parente est en ellipsis, sans puce de couleur.
- [ ] Responsable (initiales) tout à droite, juste après le délai, aligné en colonne.
- [ ] Un seul indicateur de statut par ligne : la pastille SVG. Clic → panneau radio.
- [ ] Délai en jours relatifs à aujourd'hui ; repoussée = `dans <s>7 j</s> 9 j` (un seul « dans », jours barrés, pas d'icône, pas de date en dessous).
- [ ] Repousser +1/+3/+7 et « Revenir au … » fonctionnent et la ligne change de groupe selon la nouvelle date.
- [ ] Puces : Statut (4) et Signaux (En retard, Sans responsable) uniquement.
- [ ] Recherche surlignée ; état vide filtré avec « Tout effacer ».
- [ ] Aucune couleur en dur hors `:host` d'alias ; uniquement des `--app-*`.
- [ ] Rendu correct à 390 px de large (container query `el`), sans défilement horizontal.
- [ ] Tests unitaires de `task-urgency.utils.ts` : `effectiveDue`, `isMoved`, `urgency`, libellés du § 4.3/4.4 (cas : futur→futur, retard→retard, retard→futur, aujourd'hui, sans date, terminée), score de tri des tâches.

---

## 14. Ordre de travail conseillé

1. `task-urgency.utils.ts` + tests.
2. `subtask-status-icon`, `responsible-avatar`, `due-label`.
3. `subtask-line` + `subtask-status-panel`.
4. `task-card` réécrite + `entity-actions-menu`.
5. `task-focus-list` sur le socle `entity-list` (état, barre d'outils, puces, groupes, bascule de vue, bandeau).
6. Traductions, suppression du code mort, vérification à 390 px et en clavier.