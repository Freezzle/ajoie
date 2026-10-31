# Vue « Calendrier » de la liste des tâches

> Brief pour l'agent IA du projet (Copilot).
> Écran concerné : `src/main/webapp/app/admin/task/` (route `task-focus-list`).
> Maquette interactive validée (ordinateur et téléphone) : `vue-calendrier-taches.html`, livré avec ce fichier.
> Ce brief **complète** `TASK_LIST_REDESIGN.md`. Il réutilise ce qui y est défini : `task-urgency.utils.ts`, `subtask-status-icon`, `subtask-status-panel`, `responsible-avatar`, `due-label`, le socle `entity-list` et les variables `--app-*`.
> Langue de l'interface : français. Toutes les chaînes passent par `ngx-translate` (`i18n/fr/task.json`).

---

## 1. Objectif

Ajouter une **troisième option** à la bascule de vue existante :

| Vue | Statut |
|---|---|
| Tâches | existante, inchangée |
| Sous-tâches | existante, inchangée |
| **Calendrier** | **nouvelle** |

La vue **Calendrier** place les **sous-tâches** du salon sur une grille de jours, du lundi de la semaine en cours jusqu'à **N semaines** plus tard. L'utilisateur choisit N.

Principes :

- **Mêmes données, mêmes filtres** que les autres vues : la recherche et les puces (Statut, Signaux) de la barre `entity-list` s'appliquent aussi au calendrier.
- **Même pastille de statut et même panneau radio** que dans la liste des sous-tâches. **Pas de case à cocher** (`p-checkbox`) dans le calendrier.
- **Même règle de date** : chaque sous-tâche se place à son **échéance effective** (`effectiveDue`, § 4.2 du brief précédent).
- Aucun nouvel endpoint : tout passe par `taskInstanceService.updateSubtaskStatus` et `taskInstanceService.patchSubtask`, déjà utilisés par le panneau.

---

## 2. Fichiers

### À modifier

| Fichier | Action |
|---|---|
| `admin/task/list/task-focus-list.component.{ts,html}` | Ajouter `'calendar'` au type de vue (`view = 'tasks' \| 'subtasks' \| 'calendar'`), au query param `?view=` et à la bascule. Ajouter le query param `?weeks=`. Afficher `<jhi-task-calendar>` quand `view === 'calendar'`. |
| `i18n/fr/task.json` | Ajouter les clés du § 11. |

### À créer

| Fichier | Rôle |
|---|---|
| `admin/task/calendar/task-calendar.component.{ts,html,scss}` | La vue : en-tête (choix des semaines, période, compteurs), bandes « En retard » et « Sans date », grille, agenda mobile. |
| `admin/task/calendar/calendar-day.component.{ts,html,scss}` | Une case de jour : en-tête, sous-tâches, « +N autres » / « Réduire », ajout rapide, cible du glisser-déposer. |
| `admin/task/calendar/calendar-item.component.{ts,html,scss}` | Une sous-tâche compacte : pastille, titre, tâche parente, avatar. Source du glisser-déposer. |
| `admin/task/calendar/task-calendar.utils.ts` | Fonctions pures du § 4 (période, jours, regroupement par jour, tri dans un jour), avec tests unitaires. |

Adapter le préfixe des sélecteurs (`jhi-`, `app-`…) et l'organisation des dossiers à ce qui existe dans le projet. Composants **standalone** avec signaux si c'est la convention du projet.

---

## 3. Intégration dans la liste existante

- **Bascule** : ajouter un 3ᵉ bouton « Calendrier » avec une icône calendrier (`pi pi-calendar`), **sans compteur**. Les deux autres boutons gardent leurs compteurs.
- **URL** : `?view=calendar&weeks=2`. Au chargement, lire `weeks`. S'il manque, prendre la dernière valeur choisie (préférence locale `localStorage` clé `task.calendar.weeks`), sinon **2**.
- **Barre d'outils `entity-list-toolbar`** en vue Calendrier : recherche **et** puces visibles, bouton « Grouper et trier » **masqué** (`showGroupSort = false`, comme pour la vue Tâches).
- **Filtres** : le calendrier reçoit la liste déjà filtrée (`applyChipFilters` + `matchesSearch`) depuis `task-focus-list`. Il ne refiltre pas lui-même. Puce **« Terminées »** décochée par défaut = les terminées restent visibles mais barrées (comme la maquette) ; si l'utilisateur coche des statuts, seuls ceux-là s'affichent.
- **Données** : réutiliser la liste de sous-tâches déjà chargée par l'écran (avec la tâche parente). Après chaque action, mettre à jour l'élément localement (optimiste), puis recharger ou fusionner la réponse du serveur, comme le fait déjà la vue Sous-tâches.

---

## 4. Règles (dans `task-calendar.utils.ts`, testées)

Toutes les dates sont des `LocalDate` (`'YYYY-MM-DD'`), calculées avec `dayjs().startOf('day')`. Semaine **du lundi au dimanche** (locale `fr-CH`).

### 4.1 Période affichée

```ts
WEEK_OPTIONS = [1, 2, 3, 4, 6, 8]            // défaut 2
start = lundi de la semaine d'aujourd'hui
end   = start + weeks * 7 − 1 jours           // un dimanche
days  = [start … end]                          // weeks × 7 cases
```

Les jours **passés** de la semaine en cours restent affichés (case grisée, pointillée), pour garder une grille régulière.

### 4.2 Où va chaque sous-tâche

| Sous-tâche | Emplacement |
|---|---|
| active, `effectiveDue` entre aujourd'hui et `end` | case du jour `effectiveDue` |
| active, `effectiveDue < aujourd'hui` (en retard) | bande **« En retard »** au-dessus de la grille, jamais dans une case passée |
| active, sans date | bande **« Sans date »** (affichée seulement s'il y en a) |
| terminée (`DONE`), `effectiveDue` dans la période | case de son jour, barrée et atténuée (y compris dans une case passée) |
| `effectiveDue > end` | non affichée (le compteur ne la compte pas) |
| `CANCELLED` | jamais affichée |

### 4.3 Ordre dans un jour

1. actives avant terminées ;
2. puis statut : `BLOCKED`, `IN_PROGRESS`, `PENDING` ;
3. puis `sortOrder`, puis `id`.

Bande « En retard » : `effectiveDue` croissante (le plus ancien retard d'abord).

### 4.4 Jour chargé : « +N autres »

- Constante `MAX_PER_DAY = 4`.
- Si un jour contient **plus de 4** sous-tâches (après filtres), afficher les 4 premières puis un bouton texte **« +N autres »** (`task.calendar.more`).
- Clic : la case se **déplie sur place** (elle s'agrandit, la ligne de la grille aussi) et le bouton devient **« Réduire »**.
- L'état déplié est **par jour**, gardé tant qu'on reste sur la vue. Changer le nombre de semaines replie tout.
- Le compteur de l'en-tête du jour (nombre de sous-tâches **actives**) passe en orange (`--app-warn` sur `--app-warn-soft`) au-delà de 4.
- `aria-expanded` sur le bouton.

### 4.5 Compteurs de l'en-tête de la vue

- « {{n}} à faire » : actives dont `effectiveDue` est dans [aujourd'hui, `end`].
- « {{n}} aujourd'hui » : actives dont `effectiveDue` = aujourd'hui (masqué si 0).
- « {{n}} en retard » : actives en retard (masqué si 0).

### 4.6 Jours du salon

- `salon.startingDate` … `salon.endingDate` : filet `--app-amber` en haut de la case.
- Premier jour : pastille **« Jour J »** (`--app-amber`, texte blanc). Jours suivants : pastille « Salon » (`--app-warn-soft` / `--app-warn`).
- Aujourd'hui : fond `--app-primary-soft`, bordure `--app-primary`, pastille « Aujourd'hui ».
- Samedi et dimanche : fond légèrement plus foncé que `--app-surface-muted`. Déclarer l'alias `--cal-weekend` dans le `:host`, dérivé d'une variable existante. Ne pas inventer une couleur hors du `:host`.
- Premier jour affiché et chaque 1ᵉʳ du mois : ajouter le mois abrégé à côté du numéro (« 26 oct. », « 1 nov. »).

---

## 5. Élément de sous-tâche (`calendar-item`)

```
[pastille 24px] [Titre (2 lignes max)      ] [avatar 20px]
                [Tâche parente (ellipsis) ]
```

- **Pastille** : `subtask-status-icon` dans un bouton (mêmes `aria-label` / `title` que dans la liste). Clic → **`subtask-status-panel`** (§ 6).
- **Titre** : `-webkit-line-clamp: 2`, `overflow-wrap: anywhere`. `title` = titre complet. **Clic sur le titre ou la tâche = ouvre aussi le panneau** (cible plus grande que la pastille).
- **Tâche parente** : petite, `--app-text-muted`, une ligne en ellipsis, **sans puce de couleur**.
- Dans la bande « En retard » uniquement, préfixer la ligne grise par le délai (`3 j de retard · Plan des stands`).
- **Avatar** : `responsible-avatar` tout à droite (plein = responsable propre, contour = via la tâche, pointillé « ? » = personne).
- **Repoussée** : pas d'icône. `title` sur l'élément : « Limite repoussée : dim. 1 nov. → mar. 3 nov. ».
- **Terminée** : titre barré, `--app-text-muted`, opacité 0,7.
- **Pas** de `p-checkbox`, **pas** de `p-tag`, **pas** de menu ⋯.
- Style : fond `--app-surface`, `border-radius: 7px`, ombre très légère. Au survol, ombre un peu plus marquée. Après une action, courte mise en évidence `box-shadow: 0 0 0 2px var(--app-primary)` (≈ 1,3 s).

---

## 6. Panneau radio (réutiliser `subtask-status-panel`)

Le composant existe déjà (brief précédent, § 8). **Ne pas le dupliquer.** Ajouter seulement :

1. Un **champ date** (`p-datepicker` ou `<input type="date">`) dans la section ÉCHÉANCE, à côté de « +1 j · +3 j · +7 j ». Il sert à reporter à une date précise. C'est aussi le seul moyen de replanifier sur téléphone, où le glisser-déposer n'existe pas.
2. Pour une sous-tâche **sans date** : « Pas de limite » + ce champ date, qui fixe `dueDate`.

Rappel du contenu : en-tête (titre + tâche parente) · STATUT (4 radios avec pastille, courant coché) · ÉCHÉANCE (limite, limite d'origine si repoussée, repousser, « Revenir au … ») · ATTRIBUER À (pilules + « Personne ») · « Modifier… » (`dialog-box` + `app-subtask-instance-form`).

- Chaque choix ferme le panneau et affiche le toast existant avec **Annuler**.
- Ordinateur : `p-popover` ancré sur la pastille, `appendTo="body"`, 264 px. Il s'ouvre au-dessus si la place manque en bas.
- Téléphone (≤ 600 px de fenêtre) : **feuille en bas d'écran** (pleine largeur, coins hauts arrondis, fond assombri derrière, `env(safe-area-inset-bottom)`), cibles d'au moins 40 px.

---

## 7. Glisser-déposer (ordinateur uniquement)

Utiliser `@angular/cdk/drag-drop` (`cdkDrag` sur `calendar-item`, `cdkDropList` sur chaque `calendar-day`, listes connectées). On peut aussi utiliser le drag & drop HTML5 natif si le CDK n'est pas dans le projet. **Ne pas ajouter de nouvelle dépendance.**

| Déposé sur… | Effet |
|---|---|
| un jour futur ou aujourd'hui, sous-tâche **datée** | `snoozedUntil = jour` via `patchSubtask(id, { snoozeUntilType: 'FIXED', snoozedUntil: jour, snoozeOffset: null })`. Si `jour === dueDate` : on revient à l'origine (`snoozeUntilType: null, snoozedUntil: null, snoozeOffset: null`). |
| un jour, sous-tâche **sans date** | `patchSubtask(id, { dueDate: jour })` |
| un jour passé | refusé (pas de zone de dépôt) |
| le même jour | rien |

- Toast : « Limite repoussée : dans 5 j (5 nov.) » + **Annuler** (rétablit `dueDate` / `snoozedUntil` d'avant).
- Survol d'une case pendant le glissement : bordure pointillée `--app-primary`.
- Les éléments de la bande « En retard » et « Sans date » sont aussi déplaçables.
- **Désactiver** le glisser-déposer quand la largeur est ≤ 600 px (`cdkDragDisabled`).
- ⚠️ Même vérification que dans le brief précédent (§ 4.5) : `PATCH /subtasks/{id}` doit accepter ces champs sans recalculer `snoozedUntil` depuis `snoozeOffset` quand `snoozeUntilType = 'FIXED'`. Vérifier aussi qu'il accepte `dueDate` pour une sous-tâche sans date. Signaler avant d'aller plus loin si ce n'est pas le cas.

---

## 8. Ajout rapide dans un jour

- Bouton « + » (20 px) dans l'en-tête de chaque case **non passée**. Il apparaît au survol de la case ou au focus clavier, et reste toujours visible sur écran tactile.
- Clic → champ inline en haut de la case : titre (Entrée = valider, Échap = annuler) + liste déroulante **Tâche parente** (obligatoire, toutes les tâches du salon).
- Création : `POST /task-instances/{taskId}/subtasks` (endpoint existant) avec `title`, `dueDate = jour`, `status = PENDING`. Puis mise en évidence de l'élément créé et toast avec **Annuler** (suppression).

---

## 9. Téléphone et petites largeurs : mode agenda

Quand **le conteneur** fait ≤ 600 px (container query `el`, déjà déclarée sur `.el-list`), la grille de 7 colonnes devient illisible. Dans ce cas, afficher un **agenda**. La bascule se fait côté template : utiliser un `ResizeObserver` sur l'hôte, ou le `BreakpointObserver` du CDK si le projet raisonne en largeur de fenêtre.

- **Nombre de semaines** : le segmenté devient une liste déroulante (`p-select`) « 1 semaine … 8 semaines ».
- **Bandes** « En retard » et « Sans date » : blocs repliables (`<details>` ou `p-panel` toggleable), **fermés** par défaut, titre + compteur.
- **Bascule** « Par jour » / « Liste » (segmenté).
    - **Par jour** : ruban horizontal défilant des jours, d'aujourd'hui à `end`. Chaque pastille de jour montre le jour abrégé, le numéro et le nombre de sous-tâches actives (orange au-delà de 4). Le jour du salon a un filet `--app-amber`. Toucher un jour affiche sa liste en dessous. Le ruban garde sa position de défilement après une action.
    - **Liste** : tous les jours qui ont des sous-tâches, l'un sous l'autre, avec un titre « Lundi 2 novembre · 6 ».
- La règle **« +N autres » au-delà de 4** s'applique aussi à chaque jour de l'agenda.
- Éléments plus grands : texte 13,5 px, pastille dans un bouton de 32 px, titre sur 3 lignes maximum.
- En bas de la liste du jour : bouton pleine largeur « + Ajouter une sous-tâche » (même ajout rapide qu'au § 8).
- Pas de glisser-déposer : on replanifie via le panneau (repousser ou champ date).

---

## 10. Couleurs

**Aucune nouvelle couleur.** Mêmes correspondances que le brief précédent (§ 9), plus :

| Usage | Variable |
|---|---|
| Fond d'une case | `--app-surface-muted` |
| Week-end | alias `--cal-weekend` déclaré dans le `:host` |
| Case passée | fond transparent, bordure pointillée `--app-line` |
| Aujourd'hui | fond `--app-primary-soft`, bordure `--app-primary` |
| Jours du salon | `--app-amber` (filet, pastille « Jour J ») ; « Salon » `--app-warn-soft` / `--app-warn` |
| Jour chargé (> 4) | `--app-warn` sur `--app-warn-soft` |
| Bande « En retard » | fond doux dérivé de `--app-status-refused` (alias `:host`), titre `--app-status-refused` |
| Bande « Sans date » | `--app-surface-muted`, bordure `--app-line` |
| Survol de dépôt | bordure pointillée `--app-primary` |

```scss
:host {
  --cal-weekend: color-mix(in srgb, var(--app-surface-muted) 85%, var(--app-text) 4%);
  --cal-late-bg: color-mix(in srgb, var(--app-status-refused) 7%, var(--app-surface));
  --cal-late-line: color-mix(in srgb, var(--app-status-refused) 22%, var(--app-surface));
}
```

(Si `color-mix` n'est pas accepté par la cible navigateur du projet, utiliser la variable « soft » existante la plus proche.)

Le CSS spécifique va dans le `.scss` de chaque composant, jamais dans `content/scss/`.

---

## 11. Traductions (`i18n/fr/task.json`)

```json
"list": {
  "viewCalendar": "Calendrier"
},
"calendar": {
  "show": "Afficher",
  "weeks": "{{count}} semaine(s)",
  "weekUnit": "semaines",
  "range": "du {{from}} au {{to}}",
  "toDo": "{{count}} à faire",
  "today": "{{count}} aujourd'hui",
  "late": "{{count}} en retard",
  "todayTag": "Aujourd'hui",
  "dDay": "Jour J",
  "salonDay": "Salon",
  "lateTray": "En retard",
  "lateTrayHint": "glissez sur un jour pour replanifier",
  "noDateTray": "Sans date",
  "noDateTrayHint": "glissez sur un jour pour dater",
  "more": "+{{count}} autre(s)",
  "less": "Réduire",
  "add": "Ajouter une sous-tâche",
  "addAria": "Ajouter une sous-tâche le {{date}}",
  "addPlaceholder": "Nouvelle sous-tâche… (Entrée)",
  "parentTask": "Tâche parente",
  "added": "Sous-tâche ajoutée le {{date}}",
  "dated": "Datée au {{date}}",
  "byDay": "Par jour",
  "list": "Liste",
  "emptyDay": "Rien de prévu ce jour",
  "emptyRange": "Aucune sous-tâche sur la période",
  "movedTitle": "Limite repoussée : {{from}} → {{to}}",
  "legendPanel": "Pastille = statut, échéance, attribution",
  "legendDrag": "Glisser-déposer = repousser la limite",
  "legendAdd": "« + » au survol d'un jour = ajout rapide",
  "legendSalon": "jours du salon"
},
"panel": {
  "noLimit": "Pas de limite",
  "pickDate": "Choisir une date"
}
```

---

## 12. Accessibilité et clavier

- Chaque case : `role="group"` + `aria-label` « lundi 2 novembre, 6 sous-tâches ».
- Pastille : bouton focusable, Entrée ouvre le panneau, focus sur le radio coché, flèches pour changer, Échap ferme et rend le focus à la pastille.
- « +N autres » / « Réduire » : vrais boutons avec `aria-expanded`.
- Le glisser-déposer n'est jamais le seul moyen : tout se fait aussi via le panneau.
- Contrastes : utiliser les variables du projet, ne pas descendre sous `--app-text-muted` pour du texte.

---

## 13. Critères d'acceptation

- [ ] La bascule a 3 options : Tâches, Sous-tâches, **Calendrier** ; la vue est conservée dans l'URL (`?view=calendar`).
- [ ] Le choix **1 · 2 · 3 · 4 · 6 · 8 semaines** fonctionne, est conservé dans l'URL (`?weeks=`) et en préférence locale ; défaut 2.
- [ ] La grille commence au lundi de la semaine en cours, 7 colonnes, `weeks` lignes.
- [ ] Les sous-tâches sont placées à leur **échéance effective** ; une sous-tâche repoussée apparaît à sa nouvelle date.
- [ ] Les retards sont dans la bande « En retard », jamais dans une case passée ; les sans-date dans la bande « Sans date ».
- [ ] **Au-delà de 4** sous-tâches dans un jour : « +N autres » déplie la case, « Réduire » la replie (ordinateur **et** agenda mobile).
- [ ] **Aucune case à cocher** : chaque sous-tâche a la pastille de statut ; clic sur la pastille ou le titre → panneau radio (statut, repousser +1/+3/+7, date précise, revenir à l'origine, attribuer, modifier).
- [ ] Toute action affiche un toast avec **Annuler** qui rétablit l'état précédent.
- [ ] Glisser-déposer sur ordinateur = repousser la limite (ou dater une sous-tâche sans date) ; refusé sur les jours passés ; désactivé ≤ 600 px.
- [ ] Ajout rapide « + » dans un jour avec choix de la tâche parente.
- [ ] Recherche et puces Statut / Signaux filtrent aussi le calendrier.
- [ ] Jours du salon et aujourd'hui sont mis en évidence ; week-ends légèrement teintés.
- [ ] À 390 px : agenda (ruban de jours + liste ou liste complète), feuille de panneau en bas d'écran, **aucun défilement horizontal de la page**.
- [ ] Aucune couleur en dur hors des alias `:host` ; uniquement des `--app-*`.
- [ ] Tests unitaires de `task-calendar.utils.ts` : période (lundi → dimanche, 1 à 8 semaines, changement de mois), répartition par jour (retard, sans date, terminée, hors période, repoussée), ordre dans un jour, seuil de 4.

---

## 14. Ordre de travail conseillé

1. `task-calendar.utils.ts` + tests.
2. `calendar-item` (réutilise `subtask-status-icon`, `responsible-avatar`, `subtask-status-panel`).
3. Ajout du champ date dans `subtask-status-panel`.
4. `calendar-day` (en-tête, « +N autres », ajout rapide).
5. `task-calendar` (en-tête de vue, bandes, grille), puis le glisser-déposer.
6. Mode agenda ≤ 600 px.
7. Branchement dans `task-focus-list` (bascule, `?view=`, `?weeks=`, filtres), traductions, vérification à 390 px et au clavier.