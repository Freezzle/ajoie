# Planning des conférences — refonte « Grille + panneau d'affectation »

> Document de spécification destiné à GitHub Copilot.
> Objectif : **remplacer l'écran actuel** `src/main/webapp/app/admin/talks-planning` (et le composant partagé `tp`) par la nouvelle version validée sur maquette, **sans perdre aucune fonctionnalité existante**.
> Maquette de référence : `planning-conferences-maquette.html` (à ouvrir dans un navigateur et à joindre au contexte Copilot). Son JavaScript contient une implémentation de référence des règles métier (fonctions `check`, `freeStarts`, `firstStart`, `occA`, `occB`, `slotLists`, `previewBox`).
>
> **À ne pas implémenter** depuis la maquette :
> - le sélecteur flottant « Aperçu Desktop / Mobile » en bas à gauche (outil de démo) ;
> - les données d'exemple (`SEED`) ;
> - l'entrée de menu « Voir les données enregistrées » (outil de démo) : le menu Actions reste alimenté par `ActionsService`.

---

## 1. Contexte technique

- Front : Angular 21 (composants **standalone**, **signals**, `ChangeDetectionStrategy.OnPush`), PrimeNG 21, `@angular/cdk`, `@ngx-translate`, PrimeIcons.
- Composants partagés à réutiliser : `app-content-page`, `app-card`, `button-box`, `menu-box`, `dialog-box`, `app-alert-error`, `ActionsService`, `MenuItemBuilderService`.
- À réutiliser depuis la refonte du planning bénévoles : `admin/volunteer-planning/components/mobile/bottom-sheet.component.ts` (à déplacer dans `shared/components/bottom-sheet/` et à importer depuis les deux écrans), le principe du store (`volunteer-planning.store.ts`) et la détection mobile `BreakpointObserver.observe('(max-width: 991.98px)')`.
- Back : Spring Boot (JHipster). Entité `PlanningTalksSalon` avec `configuration` (`TimelineData`) et `talks` (`List<TalkPlanning>`) stockés en **jsonb**. Endpoints existants, inchangés :
  - `GET  api/admin/salons/{idSalon}/planning-talks`
  - `PUT  api/admin/salons/{idSalon}/planning-talks`
- Vocabulaire UI : « intervention » = conférence ou atelier. « Pas de la salle » = pas d'affichage de la grille. « Pas de placement » = pas des heures de début possibles. « Préparation » = battement avant, « Rangement » = battement après.

Fichiers concernés :

```
src/main/webapp/app/
├── admin/talks-planning/update/
│   ├── talks-planning.component.{ts,html}        ← page : à réécrire (garder en-tête/actions/chargement/sauvegarde)
│   └── (nouveaux fichiers, voir §8)
├── shared/components/talks-planning/             ← composant `tp` : remplacé par les nouveaux composants
│   ├── model/*.ts                                ← à étendre (voir §3)
│   ├── tp-config-rooms/, tp-config-day/          ← remplacés par la popin « Salles et horaires » (§6)
├── shared/components/talk-slot/talk-slot.component.ts  ← interface Talk à étendre
├── admin/salon/service/salon.service.ts          ← DTO à étendre
src/main/java/ch/salon/
├── domain/TimelineData.java                      ← + placementIntervalMinutes, talkTypes
├── domain/TalkPlanning.java                      ← + startingHour, preparationMinutes, cleanupMinutes
├── domain/TalkTypeConfig.java                    ← nouveau
├── service/SalonService.java                     ← duplication de salon (copyTalksPlanning) : copier les nouveaux champs
├── service/handlers/impl/talks/DownloadTalksPlanningHandler.java ← heure de début et durée
src/main/webapp/i18n/fr/planningTalks.json        ← nouvelles clés
```

---

## 2. Fonctionnalités existantes à conserver (checklist obligatoire)

### En-tête (`appMenuBarStart` / `appMenuBarEnd`)
- [ ] Titre `salon.talksPlanning`.
- [ ] Bouton **Retour** (`pi-arrow-left`) → `window.history.back()`.
- [ ] **Mode lecture par défaut** (`isReadOnly = true`).
- [ ] En lecture : bouton **Modifier** (`pi-pencil`) et menu **Actions** (`menu-box`) alimenté par `actionsService.getAvailableActions('salon', idSalon, 'talks-planning')` ; l'action `DOWNLOAD` télécharge le PDF (code actuel `clickAction` / `getFilenameFromContentDisposition` à garder tel quel).
- [ ] En édition : **Annuler** (`pi-ban`, recharge les données comme `activateReadOnlyMode()`) et **Enregistrer** (`pi-save`, `salonService.savePlanningTalks`, puis retour en lecture).
- [ ] Nouveau en édition : bouton **Annuler la dernière action** (`pi-undo`, aussi `Ctrl/Cmd + Z`) et bouton **Salles et horaires** (`pi-sliders-h`) qui ouvre la popin §6.
- [ ] Tous les boutons désactivés pendant `isLoading()`.

### Chargement
- [ ] `forkJoin` actuel : planning + conférences + ateliers du salon, en excluant les statuts `REFUSED` et `CANCELED`.
- [ ] Fusion des placements sauvegardés par clé `` `${type}:${id}` ``.
- [ ] Sans configuration enregistrée : configuration vide. En lecture : message « Veuillez activer le mode édition pour démarrer un nouveau planning. ». En édition : état vide avec un bouton qui ouvre la popin Salles et horaires.

### Planning
- [ ] Onglets de jours, ajout / configuration / suppression d'un jour (désormais dans la popin §6, avec confirmation avant de supprimer un jour qui contient des interventions placées).
- [ ] Gestion des salles (ajout, renommage, suppression), désormais dans la popin §6.
- [ ] Glisser-déposer d'une intervention non placée vers la grille, déplacement d'une intervention placée, dépôt hors grille = retrait du planning.
- [ ] Nettoyage automatique (`sanitizeTalkAssignments`) : une intervention dont le jour ou la salle n'existe plus, ou dont la salle est fermée ce jour-là, revient dans « À planifier ».
- [ ] Clic sur une intervention en lecture → détail (titre, type, intervenant·e, exposant, durée d'animation, durée totale, statut, informations supplémentaires, description).

### Comportements volontairement modifiés
- **Plus de décalage automatique** (`resolveRoomCollisions`) : on peut placer une intervention sur un créneau en conflit. Elle est alors signalée (bordure rouge + icône `pi-exclamation-triangle`) et un toast indique la raison. Rien n'est déplacé sans action de l'utilisateur.
- **Plus de retrait automatique hors horaires** (`unassignTalksOutsideBounds`) : après une modification des horaires ou des battements, les interventions qui débordent restent placées et passent en conflit (toast « Configuration appliquée · N interventions en conflit à revoir »). Seules la suppression d'un jour ou d'une salle, ou la fermeture d'une salle ce jour-là, renvoient dans « À planifier ».
- Le mode « Prévisualiser » (`showGrid` / `p-timeline`) est supprimé : la vue en lecture est la grille elle-même.

---

## 3. Modèle de données

### 3.1 Configuration (`TimelineData`)

```ts
export type DisplayIntervalMinutes = 15 | 30 | 60;          // « Pas de la salle »
export type PlacementIntervalMinutes = 5 | 10 | 15 | 30;    // « Pas de placement »
export type TalkType = 'CONFERENCE' | 'WORKSHOP';

export interface TalkTypeConfig {
    durationTalkMinutes: number;   // durée de l'intervention (affichée au public)
    preparationMinutes: number;    // battement avant
    cleanupMinutes: number;        // battement après
}

export interface TimelineData {
    eventId: string;
    intervalMinutes: DisplayIntervalMinutes;            // existant = pas de la salle (affichage)
    placementIntervalMinutes: PlacementIntervalMinutes; // nouveau
    talkTypes: Record<TalkType, TalkTypeConfig>;        // nouveau
    days: TimelineDay[];
    rooms: TimelineRoom[];
}
```

Valeurs par défaut :

| Cas | `intervalMinutes` | `placementIntervalMinutes` | CONFERENCE (prép. / durée / rang.) | WORKSHOP (prép. / durée / rang.) |
|---|---|---|---|---|
| Nouvelle configuration | 30 | 15 | 0 / 45 / 15 | 15 / 60 / 15 |
| Configuration existante sans ces champs | inchangé (si 5 → 15) | 15 | 0 / 45 / 15 | **0** / 60 / 15 |

> La deuxième ligne reproduit exactement les durées actuelles (60 et 75 min) pour ne créer aucun conflit sur les plannings déjà enregistrés.

Supprimer `IntervalMinutes` (`5 | 15 | 30 | 60`) au profit des deux types ci-dessus.

### 3.2 Intervention

Les durées ne sont plus codées en dur dans `toTalk(con, 'CONFERENCE', 60, 45)` / `toTalk(work, 'WORKSHOP', 75, 60)`. Elles viennent de `configuration.talkTypes` et sont recalculées à chaque changement de configuration.

Interface `Talk` (front, `talk-slot.component.ts` ou nouveau fichier modèle) :

```ts
export interface Talk {
    id: string;
    type: TalkType;
    title: string;
    description: string;
    status: Status;
    extraInformation: string | null;
    participation: { therapistName: string; fullName: string | null };
    // placement
    dayId: string | null;
    roomId: string | null;
    startMinute: number | null;   // minutes depuis minuit, heure locale du salon (ex. 11:45 → 705)
    // durées dérivées de configuration.talkTypes[type]
    durationTalkMinutes: number;
    preparationMinutes: number;
    cleanupMinutes: number;
    durationTotalMinutes: number; // prép. + durée + rang.
}
```

`client` n'est plus utilisé ; il peut être supprimé.

### 3.3 Sauvegarde (`TalkPlanningSaveDto` / `TalkPlanning`)

`startSlot` est **remplacé** par une heure absolue, pour deux raisons :
1. un index dépend du pas : changer le pas de placement décalerait tout le planning ;
2. il est aujourd'hui interprété différemment par l'écran (depuis la première ouverture de salle du jour) et par le PDF (depuis l'ouverture de la salle), ce qui donne des heures fausses dans le PDF quand les salles n'ouvrent pas à la même heure.

```ts
export interface TalkPlanningSaveDto {
    id: string;
    type: TalkType;
    dayId: string | null;
    roomId: string | null;
    startingHour: string | null;      // ISO, même convention que TimelineRoomData.startingHour
    durationTalkMinutes: number;      // aujourd'hui jamais envoyé : le PDF affiche « 0 minutes »
    preparationMinutes: number;
    cleanupMinutes: number;
    durationTotalMinutes: number;
}
```

`startingHour` = date du jour (prise sur le `startingHour` de la salle ce jour-là) + `startMinute`.

**Reprise des données existantes** (au chargement, dans le mapping `fromDto`) : si `startingHour` est absent et `startSlot` présent, calculer
`début = min(startingHour des salles du jour) + startSlot × intervalMinutes` (convention de l'écran actuel, c'est ce que l'utilisateur voyait). La prochaine sauvegarde écrit `startingHour`.

### 3.4 Back (Java)

```java
@Data
public class TalkTypeConfig {
    private int durationTalkMinutes;
    private int preparationMinutes;
    private int cleanupMinutes;
}

// TimelineData
private Integer placementIntervalMinutes;
private Map<TalkPlanning.TalkType, TalkTypeConfig> talkTypes = new EnumMap<>(TalkPlanning.TalkType.class);

// TalkPlanning
private Instant startingHour;
private int preparationMinutes;
private int cleanupMinutes;
@Deprecated private Integer startSlot;   // lu pour la reprise, plus écrit par le front
```

- Pas de migration Liquibase (colonnes jsonb).
- `SalonService` (duplication d'un salon, bloc `if (copyTalksPlanning)`) : copier `placementIntervalMinutes` et `talkTypes`.
- `DownloadTalksPlanningHandler` :
  - heure de début = `talk.getStartingHour()` ; si absente, ancien calcul avec `startSlot` (même formule que §3.3) ;
  - tri des interventions d'une salle par heure de début ;
  - durée affichée = `durationTalkMinutes` (n'imprime pas les battements).

---

## 4. Règles métier (fonctions pures, à tester)

Toutes les heures sont en **minutes depuis minuit**. `room` = plage d'ouverture `{start, end}` de la salle ce jour-là.

```ts
occupiedStart(t, start) = start - t.preparationMinutes
occupiedEnd(t, start)   = start + t.durationTalkMinutes + t.cleanupMinutes
```

### 4.1 Heures de début possibles
- Grille des débuts : `room.start + k × placementIntervalMinutes`.
- Premier début : `room.start + ceil(prep / pas) × pas` (la préparation doit tenir après l'ouverture).
- Dernier début : tel que `occupiedEnd ≤ room.end`.
- `snapStart(rawMinute, room, step)` : arrondi au plus proche (glisser-déposer) ; `floorStart` : arrondi inférieur (clic et survol).
- Glisser-déposer : la position verticale du **haut** du bloc déplacé correspond au début de la préparation ; l'heure de début = position du haut + préparation, puis `snapStart`.

### 4.2 Conflits (`checkPlacement(t, dayId, roomId, start): { ok, reasons[] }`)
1. Salle fermée ce jour → « La salle est fermée ce jour-là ».
2. `occupiedStart < room.start` ou `occupiedEnd > room.end` → « Hors des horaires de la salle (10:00–18:00), battements compris ».
3. Même salle, même jour : chevauchement des **plages occupées** (battements compris) → « Chevauche « Titre » (11:30), battements compris ».
4. Même intervenant·e (`participation.therapistName`), même jour, autre salle : chevauchement des **heures d'intervention seulement** (sans battements) → « Claire Monnin intervient déjà en Salle des Rangiers à 10:30 ».
5. Les autres jours sont ignorés.

`issuesOf(t)` = `checkPlacement` sur sa position actuelle (vide si non placée).
`freeStarts(t, dayId, roomId)` = débuts possibles (§4.1) sans conflit.

### 4.3 Placement
- `place(talkKey, dayId, roomId, start)` : refuse seulement si la salle est fermée ce jour-là. Sinon place, et si `issuesOf` n'est pas vide affiche le toast « Placé avec un conflit : <1ʳᵉ raison> ».
- `unplace(talkKey)` : `dayId = roomId = startMinute = null`.
- Chaque modification passe par le store et alimente l'historique d'annulation (60 étapes max).

### 4.4 Créneau choisi (`slotCandidates(dayId, roomId, start)`)
Retourne quatre listes, utilisées par le panneau de droite (desktop) et le tiroir (mobile) :
- `here` : interventions dont la plage occupée contient `start` ;
- `free` : non placées, `checkPlacement(...).ok` ;
- `move` : placées ailleurs, `checkPlacement(...).ok` ;
- `off` : les autres, avec la première raison.

### 4.5 Indicateurs
- Nombre à planifier = interventions non placées.
- Conflits = interventions placées avec `issuesOf` non vide (total et par jour).

### 4.6 Tests unitaires minimum (`talks-planning-utils.spec.ts`)
- Atelier 11:00, durée 60, rangement 15 → une conférence sans préparation peut commencer à **12:15** avec un pas de placement de 15 min, pas à 12:00.
- Atelier 12:30, préparation 15 → un bloc qui finit à 12:15 (rangement compris) est accepté, à 12:20 il est refusé.
- Salle ouverte à 10:30, atelier avec 15 min de préparation → premier début possible 10:45.
- Pas de placement 5 → débuts proposés toutes les 5 min.
- Même intervenant·e : rangement en salle A et intervention en salle B qui se touchent → pas de conflit ; heures d'intervention qui se chevauchent → conflit.
- Reprise : `startSlot = 3`, `intervalMinutes = 30`, première salle du jour à 10:00 → `startMinute = 690`.
- `toDto` : `startingHour` cohérent avec la date du jour, durées envoyées.

---

## 5. Interface desktop (≥ 992 px)

Mise en page : en-tête → barre des jours → bandeaux contextuels → `grille (1fr)` + `panneau (340 px, sticky)`.

### 5.1 Barre des jours
- Onglets segmentés, un par jour (libellé seul). Point rouge sur un jour qui contient au moins un conflit.
- À droite, une ligne de statut : « **6** à planifier · 2 conflits ». « 2 conflits » est un lien : il déplie au-dessus de la grille la liste des interventions en conflit (titre, jour + heure, raison) ; un clic ouvre le détail.
- Pas de cartes d'indicateurs, pas d'avatars, pas de légende, pas de pourcentage d'occupation (allègement validé).

### 5.2 Grille
- Colonne d'heures à gauche : heures pleines en gras, lignes intermédiaires selon le **pas de la salle**.
- Une colonne par salle : en-tête = nom + horaires du jour (« 10:00–18:00 » ou « Fermée ce jour »).
- Plages fermées hachurées.
- Bloc d'intervention, de haut en bas :
  - bande hachurée **Préparation** (hauteur = préparation ; libellé si la bande fait ≥ 14 px) ;
  - corps : `11:00 – 12:00`, titre (2 lignes max), intervenant·e ;
  - bande hachurée **Rangement**.
- Couleur par type : filet gauche et fond léger (conférence violet, atelier turquoise). En conflit : bordure rouge + icône avec la raison en infobulle.
- Clic sur un bloc → panneau de détail (§5.5).
- En édition, clic sur une case vide → le panneau de droite affiche le créneau (§5.4) et la case est entourée.

### 5.3 Panneau de droite : « À planifier »
- Bouton pour replier le panneau (il devient une colonne étroite avec « À planifier N » vertical). Il se déplie seul quand un créneau ou une intervention est sélectionné.
- Filtres segmentés avec compteurs : Toutes / Conférences / Ateliers.
- Recherche sur titre et intervenant·e.
- Carte : filet de couleur du type, titre, puis « Intervenant·e · conférence 45 min » (+ « · à confirmer » en orange si le statut est `IN_VERIFICATION`). Pas d'avatar, pas de badge de type.
- Glisser une carte sur la grille la place ; déposer un bloc sur ce panneau le retire du planning.

### 5.4 Panneau de droite : créneau choisi
En-tête « Samedi 14 novembre — Salle Jura · 15:00 — Ce qui peut commencer ici à 15:00 », bouton fermer. Sections (masquées si vides) :
- **Déjà sur ce créneau** → bouton « Retirer » ;
- **À planifier** → bouton principal « Placer » ;
- **Déjà placées ailleurs** (avec leur position actuelle) → « Déplacer ici » ;
- **Ne tiennent pas ici** : repliée par défaut (`<details>`), chaque ligne avec sa raison, sans action.
  Après « Placer » : toast « « Titre » placée à 15:00 » avec action « Annuler ».

### 5.5 Intervention « en main » (placement au clic)
- Clic sur une carte (ou « Choisir sur le planning » depuis le détail) → l'intervention est en main :
  - bandeau : « Survolez la grille puis cliquez pour placer **Titre** (prép. 15 · 60 min · rang. 15) » + `Échap` + lien « Annuler » ;
  - une étiquette suit le curseur (titre, intervenant·e, durées, « Clic pour placer · Échap pour annuler ») ;
  - au survol d'une colonne : **même aperçu que pendant un glisser-déposer**, cadre vert « Libre · cliquez pour placer » ou rouge avec la raison, bandes de préparation et de rangement incluses ;
  - clic → `place(...)` ; `Échap` ou « Annuler » → abandon.
- Pendant un glisser-déposer : même cadre d'aperçu, calculé selon §4.1.

### 5.6 Détail d'une intervention (panneau latéral)
- Type, statut, titre, intervenant·e (bouton « Voir ses interventions » : surligne ses blocs et estompe les autres, bandeau « Interventions de X surlignées · Effacer »), exposant, placement, durée (« 15 min de préparation · 60 min · 15 min de rangement » + petite barre proportionnelle), description, informations supplémentaires.
- Conflits listés en rouge, sinon « Aucun conflit sur ce créneau ».
- En édition : listes Jour / Salle / Début (débuts au pas de placement, suffixe « · occupé » si conflit), boutons « Choisir sur le planning » et « Retirer du planning ».
- Fermeture : ×, clic sur le fond, `Échap`.

### 5.7 Raccourcis (édition)

| Touche | Action |
|---|---|
| `Ctrl/Cmd + Z` | Annuler la dernière modification |
| `Échap` | Lâcher l'intervention en main, fermer le détail, la popin ou le créneau |

Ignorer les raccourcis quand le focus est dans un `input`, un `select` ou une popin.

---

## 6. Popin « Salles et horaires »

`dialog-box`, largeur ~760 px, pied collant « Annuler » / « Appliquer ». Elle travaille sur un **brouillon** : rien n'est appliqué avant « Appliquer ».

1. **Pas de la salle** : 15 / 30 / 60 min. Aide : « Lignes affichées dans la grille. »
2. **Pas de placement** : 5 / 10 / 15 / 30 min. Aide : « Heures de début possibles : avec 15 min, on peut commencer à 11:45. »
3. **Durées et battements** : tableau, une ligne par type.

   | Type | Préparation | Durée | Rangement | Salle occupée |
      |---|---|---|---|---|
   | Conférence | `[0] min` | `[45] min` | `[15] min` | 60 min (calculé en direct) |
   | Atelier | `[15] min` | `[60] min` | `[15] min` | 90 min |

   Champs numériques, pas de 5, préparation et rangement ≥ 0, durée ≥ 5. Aide : « La préparation se place avant l'heure de début, le rangement après la fin. Deux interventions d'une même salle ne peuvent pas se chevaucher, battements compris. »
4. **Salles** : liste éditable (renommer, supprimer, « Ajouter une salle »).
5. **Jours** : pour chaque jour, libellé, date, suppression ; tableau des salles avec case « Ouverte », heures « De » / « À ». « Ajouter un jour » crée le lendemain du dernier jour, toutes salles ouvertes 10:00–18:00.

Validation à l'application : fin > début pour chaque salle ouverte, durée ≥ 5. Erreur affichée en toast, la popin reste ouverte.

Application :
- remplace la configuration ;
- recalcule les durées de toutes les interventions (`syncTalkDurations`) ;
- renvoie dans « À planifier » les interventions dont le jour ou la salle n'existe plus, ou dont la salle est fermée ce jour-là ;
- toast « Configuration appliquée » ou « Configuration appliquée · N interventions en conflit à revoir » ;
- l'opération est annulable (`Ctrl + Z`).

---

## 7. Interface mobile (< 992 px)

- En-tête compact : titre, mode, boutons secondaires en icône seule (Retour, Actions ; en édition : Annuler la dernière action, Salles et horaires, Abandonner).
- Barre des jours et ligne de statut identiques au desktop, défilement horizontal si besoin.
- **Une salle à la fois** : rangée de pastilles de salles au-dessus de la grille. Quand une intervention est en main, chaque pastille affiche « dès 14:00 » ou « complet » ; si la salle affichée n'a plus de place, la vue bascule sur la première salle qui en a.
- Grille d'une seule colonne pleine largeur (mêmes blocs qu'en desktop).
- **Barre fixe en bas** (`safe-area-inset-bottom` compris) :
  - normal : « À planifier `N` » (ouvre le tiroir) + bouton principal « Modifier » (lecture) ou « Enregistrer » (édition) ;
  - intervention en main : carte compacte (filet de couleur, titre, « prép. 15 · 60 min · rang. 15 · touchez la grille pour placer ») + bouton « Annuler ».
- Le panneau de droite n'existe pas ; il est remplacé par des tiroirs bas (`bottom-sheet`) :
  - **À planifier** : même contenu que §5.3. Choisir une carte la met en main et ferme le tiroir.
  - **Toucher une case vide** : ouvre le tiroir À planifier avec l'en-tête « Ce qui commence à **15:00** en Salle Jura » ; choisir une carte la place directement à cette heure.
  - **Détail d'une intervention** : le panneau §5.6 s'affiche en tiroir bas.
- Toucher la grille avec une intervention en main la place. Au pointeur (tablette avec souris, aperçu desktop réduit), le survol affiche le même aperçu que sur desktop.
- Glisser-déposer : conservé (pointer events, `touch-action: none` sur les blocs en édition).

---

## 8. Découpage des composants

```
admin/talks-planning/update/
├── talks-planning.component.{ts,html,scss}   # PAGE : en-tête/actions, chargement, sauvegarde, desktop/mobile
├── talks-planning.store.ts                   # état (signals), historique, sélection, intervention en main
├── talks-planning-utils.ts                   # §4 : fonctions pures (+ talks-planning-utils.spec.ts)
├── talks-planning-model.ts                   # §3 : types front + mappings DTO <-> modèle + reprise startSlot
├── desktop/
│   ├── planning-day-bar.component.*          # onglets de jours + statut + liste des conflits
│   ├── planning-grid.component.*             # grille d'un jour (n salles) ; réutilisée en mobile avec une salle
│   ├── planning-talk-block.component.*       # bloc préparation / corps / rangement
│   ├── planning-side-panel.component.*       # repliable : À planifier (§5.3) ou créneau (§5.4)
│   ├── talk-tray.component.*                 # filtres, recherche, cartes ; utilisé aussi dans le tiroir mobile
│   ├── slot-candidates.component.*           # §5.4 ; utilisé aussi dans le tiroir mobile
│   └── talk-in-hand.directive.ts             # étiquette qui suit le curseur, aperçu au survol, Échap
├── mobile/
│   ├── planning-mobile.component.*           # pastilles de salles, grille 1 colonne, barre basse, tiroirs
│   └── (bottom-sheet réutilisé depuis shared)
├── talk-detail-panel.component.*             # §5.6 (panneau latéral en desktop, tiroir en mobile)
└── talks-config-dialog.component.*           # §6
```

- `planning-grid` reçoit `day`, `rooms` (toutes en desktop, une seule en mobile), `pxPerMinute` (1.7 par défaut) et émet `slotClick({dayId, roomId, startMinute})` et `talkClick(key)`.
- Glisser-déposer : `@angular/cdk/drag-drop` peut être conservé, mais le calcul de position doit suivre §4.1 (haut du bloc + préparation, `snapStart`). Le dépôt sur le panneau À planifier = retrait.
- Le store expose au minimum : `config`, `talks`, `isEditing`, `selectedDayId`, `mobileRoomId`, `talkInHand`, `selectedSlot`, `focusTherapist`, `panelFolded`, `canUndo`, `unplacedCount`, `conflicts`, `conflictsByDay` ; actions `place`, `unplace`, `applyConfig`, `undo`, `takeInHand`, `dropInHand`, `selectSlot`.
- En changeant de jour ou de vue (desktop ↔ mobile), garder l'intervention en main et le filtre du bac.
- Supprimer `shared/components/talks-planning/` (et `talk-slot` s'il n'est plus utilisé ailleurs) une fois la nouvelle page en place.

---

## 9. i18n (`planningTalks.json`, fr)

Garder les clés `details.*` existantes et ajouter :

```json
{
  "planningTalks": {
    "status": { "toPlan": "{{count}} à planifier", "allPlaced": "Tout est placé", "conflicts": "{{count}} conflit(s)" },
    "tray": { "title": "À planifier", "all": "Toutes", "conferences": "Conférences", "workshops": "Ateliers", "search": "Titre ou intervenant·e", "pending": "à confirmer", "empty": "Toutes les interventions sont placées.", "noResult": "Aucun résultat pour ce filtre." },
    "block": { "preparation": "Préparation", "cleanup": "Rangement", "closed": "Fermée ce jour" },
    "slot": { "subtitle": "Ce qui peut commencer ici à {{time}}", "here": "Déjà sur ce créneau", "free": "À planifier", "move": "Déjà placées ailleurs", "off": "Ne tiennent pas ici", "place": "Placer", "moveHere": "Déplacer ici", "remove": "Retirer", "none": "Aucune intervention ne tient à {{time}} dans cette salle." },
    "inHand": { "banner": "Survolez la grille puis cliquez pour placer <b>{{title}}</b> ({{durations}})", "ghost": "Clic pour placer · Échap pour annuler", "mobile": "touchez la grille pour placer", "free": "Libre · cliquez pour placer", "from": "dès {{time}}", "full": "complet" },
    "conflict": { "closedRoom": "La salle est fermée ce jour-là", "outOfHours": "Hors des horaires de la salle ({{start}}–{{end}}), battements compris", "overlap": "Chevauche « {{title}} » ({{time}}), battements compris", "therapist": "{{name}} intervient déjà en {{room}} à {{time}}", "placedWithConflict": "Placé avec un conflit : {{reason}}" },
    "durations": { "short": "prép. {{prep}} · {{dur}} min · rang. {{clean}}", "long": "{{prep}} min de préparation · {{dur}} min · {{clean}} min de rangement" },
    "focus": { "banner": "Interventions de {{name}} surlignées", "clear": "Effacer", "see": "Voir ses interventions" },
    "config": {
      "title": "Salles et horaires",
      "displayStep": "Pas de la salle", "displayStepHelp": "Lignes affichées dans la grille.",
      "placementStep": "Pas de placement", "placementStepHelp": "Heures de début possibles : avec 15 min, on peut commencer à 11:45.",
      "types": "Durées et battements", "preparation": "Préparation", "duration": "Durée", "cleanup": "Rangement", "occupied": "Salle occupée",
      "typesHelp": "La préparation se place avant l’heure de début, le rangement après la fin. Deux interventions d’une même salle ne peuvent pas se chevaucher, battements compris.",
      "rooms": "Salles", "addRoom": "Ajouter une salle", "days": "Jours", "addDay": "Ajouter un jour", "open": "Ouverte", "from": "De", "to": "À",
      "apply": "Appliquer", "applied": "Configuration appliquée", "appliedWithConflicts": "Configuration appliquée · {{count}} intervention(s) en conflit à revoir",
      "errorHours": "{{day}} : l’heure de fin doit suivre l’heure de début", "errorDuration": "{{type}} : la durée doit faire au moins 5 minutes"
    },
    "placed": "« {{title}} » placée à {{time}}",
    "undo": "Annuler la dernière action",
    "emptyEdit": "Ajoutez les jours et les salles du salon pour démarrer le planning."
  }
}
```

Ajouter l'équivalent dans les autres langues présentes. Les clés `modeGrid`, `modeTimeline`, `manageRooms` deviennent inutiles.

---

## 10. Plan d'implémentation (à suivre dans l'ordre)

1. **Back** : `TalkTypeConfig`, nouveaux champs de `TimelineData` et `TalkPlanning`, duplication de salon, `DownloadTalksPlanningHandler` (heure absolue, repli `startSlot`, durée réelle). Vérifier le PDF sur un planning existant.
2. **Modèle front** (`talks-planning-model.ts`) : types §3, valeurs par défaut, mapping `fromDto` avec reprise de `startSlot`, `toDto` avec `startingHour` et durées.
3. **`talks-planning-utils.ts` + tests** (§4.6) avant toute UI.
4. **Store** : y déplacer l'état et la logique load/save/download de `talks-planning.component.ts` sans changer leur comportement ; ajouter historique, intervention en main, créneau choisi.
5. **Popin Salles et horaires** (§6), pour pouvoir créer une configuration de test.
6. **Desktop** : barre des jours → grille + blocs → panneau À planifier → glisser-déposer → créneau choisi → intervention en main (survol, Échap) → détail → raccourcis.
7. **Mobile** : pastilles de salles, barre basse, tiroirs (déplacer `bottom-sheet` dans `shared`).
8. **i18n**, suppression de l'ancien composant `tp`, nettoyage.
9. Vérification avec la checklist §2 et les critères §11.

---

## 11. Critères d'acceptation

- [ ] Toutes les cases de la checklist §2 sont cochées.
- [ ] Pas de placement 15 min, atelier 11:00–12:00 avec 15 min de rangement : une conférence sans préparation se place à **12:15** dans la même salle, sans conflit, par glisser-déposer, par clic après sélection et depuis le créneau choisi.
- [ ] Passer le pas de placement à 5 min propose des débuts toutes les 5 min dans le détail et dans l'aperçu ; les interventions déjà placées ne bougent pas.
- [ ] Passer la préparation des conférences à 10 min : les blocs grandissent vers le haut, une conférence placée à l'ouverture de la salle passe en conflit « Hors des horaires… », le toast l'annonce, `Ctrl + Z` revient en arrière.
- [ ] Le PDF affiche les bonnes heures, y compris pour une salle qui n'ouvre pas à la même heure que les autres, et la durée réelle de chaque intervention.
- [ ] Un planning enregistré avec l'ancienne version s'ouvre aux mêmes heures qu'avant et sans nouveau conflit.
- [ ] Mobile (390 px) : aucune barre de défilement horizontale de page ; on peut placer une intervention en trois touchers (À planifier → carte → case) ou (case → carte).
- [ ] Mode sombre lisible (couleurs via les variables du thème PrimeNG / du projet).
- [ ] Heures affichées et heures du PDF identiques (le PDF formate en `Europe/Paris`, même fuseau que la Suisse).