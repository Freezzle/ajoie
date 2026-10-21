# Plan du salon : nouvelle version (placement libre en mètres)

Spécification à destination de GitHub Copilot pour réécrire l'écran **Plan de la salle** (`src/main/webapp/app/admin/floor-plan/detail/`).

La référence visuelle et fonctionnelle est la maquette HTML **« Plan du salon · Bandeau » (F1)**. Ouvre-la dans un navigateur et compare-la à ton résultat à chaque étape. Le bouton « Données » de la maquette affiche le JSON cible.

> **Copilot, lis d'abord le projet.** Ce document ne connaît pas le dépôt en détail. Avant d'écrire du code, parcours le composant actuel (`floor-plan-detail.component.*`, `floor-plan-dimension-tile`, `floor-plan.model.ts`, les services `FloorPlanService`, `StandService`, `SalonService`), les composants partagés (`src/main/webapp/app/shared/`) et les fichiers de thème et de traduction. Partout où ce document décrit un champ, un bouton, une popin, une icône ou une couleur, **reprends ce qui existe déjà dans le projet** et ne crée quelque chose de nouveau que s'il n'y a vraiment pas d'équivalent.

---

## 1. Règles d'implémentation

1. **Réutiliser l'existant, toujours.**
  - Page et cartes : `app-content-page` (zones `appMenuBarStart` / `appMenuBarEnd`), `app-card`.
  - Boutons : `button-box` (avec `primeIcon`, `translateKey`, `type`, `showText`, `isDisabled`) et `menu-box` pour le menu Actions.
  - Popins : `dialog-box` (avec `[(visible)]`, `mode="edit"`, `(confirm)` / `(cancel)`).
  - Champs : `text-box`, `number-box` (dont `modeDecimal`), `select-box` (avec filtre), et les `FormControl` réactifs comme aujourd'hui.
  - Composants PrimeNG déjà importés : `p-tabs`, `p-tag`, `p-contextMenu`, `p-confirmpopup`, `p-divider`, `p-iftalabel` / `pTextarea`.
  - Icônes : les mêmes familles que l'écran actuel, PrimeIcons (`pi-*`) dans les boutons et FontAwesome (`fa-icon`) dans le contenu. Garde les pipes `colorStatus` et `status` pour le statut de participation.
  - Couleurs : les variables CSS du thème (`--app-surface-muted`, `--app-danger`, etc.) et `getColorStand()` pour les catégories. **Aucune couleur en dur** dans le nouveau code. Si une teinte manque (ambre pour l'électricité, par exemple), ajoute une variable dans le fichier de thème, avec ses valeurs claire et sombre.
  - Traductions : `jhiTranslate` / pipe `translate`. Ajoute les clés en français, puis dans les autres langues présentes.
2. **Même style de code que l'existant** : composant standalone, `ChangeDetectionStrategy.OnPush`, `signal` / `computed` / `effect`, `takeUntilDestroyed`, services injectés avec `inject()`.
3. **Pas de nouvelle dépendance npm.** Le plan est dessiné en SVG à la main. Le glisser-déposer libre se fait avec les Pointer Events (CDK Drag & Drop reste possible pour la palette, mais le placement sur le plan est en coordonnées libres).
4. **Découper** : un composant conteneur (page), un composant `floor-plan-canvas` (SVG et interactions), un `floor-plan-palette`, un `floor-plan-inspector`, un `floor-plan-settings-dialog`, et des fonctions pures pour la géométrie (`floor-plan.geometry.ts`), testées unitairement.
5. **Ne rien perdre** : chaque point de la section 2 doit rester disponible après la refonte.

---

## 2. Fonctionnalités actuelles à conserver (checklist)

- [ ] Titre `salon.floorPlan`, bouton **Retour**.
- [ ] **Mode lecture par défaut**. En lecture : bouton **Modifier** et menu **Actions** (`actionsService.getAvailableActions('salon', id, 'floor-plan')`, téléchargement PDF via `clickAction` / `getFilenameFromContentDisposition`, à garder tel quel).
- [ ] En édition : **Annuler** (recharge depuis le serveur) et **Enregistrer** (`floorPlanService.batchSave(salonId, plans, idsToDelete)`, puis retour en lecture).
- [ ] Chargement combiné : stands du salon, plans et dimensions vendues (`salonService.getDimensionStands`). Les stands `CANCELED` et `REFUSED` sont exclus de la palette.
- [ ] Plusieurs plans en onglets (`p-tabs`), avec création, renommage, réordonnancement et suppression. Ces actions passent désormais par la popin **Réglages** (section 7), et un « + » dans les onglets ouvre la popin sur un nouveau plan.
- [ ] Palette des **stands non attribués** (à la dimension du stand) et des **dimensions disponibles** (emplacements vides).
- [ ] **Recherche d'un stand attribué** (sélecteur filtrable, aujourd'hui dans une `dialog-box`) : bascule sur le bon plan, centre et met en évidence le stand.
- [ ] Bascules d'affichage existantes, rebranchées sur le nouveau rendu :
  - `displayTechnical` devient le sélecteur **Exposant / Technique** ;
  - `displayFullname` devient le bouton **nom du stand / nom de la personne** ;
  - `displayHeader` peut masquer le bandeau des stands si tu veux garder ce réglage.
- [ ] Masquage des informations sensibles (`navigationService.hideSensibleInformation()`, `idDisplaySensibleInformation`) : même logique sur le nom et le statut.
- [ ] **Mode attribution des numéros** (`isNumberAttribution`, `nextPosition`, `automaticallyIncrementNumber`) : un clic sur un stand lui donne le numéro suivant. À garder, par exemple comme bouton « Numéroter » dans la barre d'outils.
- [ ] **Pré-réservation** avec note (popin existante) sur un emplacement vide.
- [ ] **Détail d'un stand** en lecture (thérapeute, nom, statut, catégorie, tags, dimension du plan, dimension demandée, pré-réservation, commentaire), avec les liens vers la participation et la facturation.
- [ ] Menu contextuel (clic droit) sur un stand, avec les mêmes actions qu'aujourd'hui.
- [ ] Désactivation des boutons pendant `isLoading()`.

---

## 3. Nouveau modèle de données

On abandonne la grille de cellules (`cells[][]`, `firstCell`, `unusable`). **Tout est stocké en mètres.** Chaque objet est un rectangle défini par son centre, sa largeur, sa profondeur et un angle.

### 3.1 Front (`floor-plan.model.ts`)

```ts
export interface IFloorPlan {
  id: string | null;
  position: number;            // ordre des onglets
  name: string;
  widthMeter: number;
  heightMeter: number;         // profondeur de la salle
  locations: IFloorLocation[]; // emplacements de stand
  elements: IFloorElement[];   // murs, allées, escaliers…
}

export interface IFloorLocation {
  id: string;                  // uuid (v4, comme aujourd'hui)
  idDimension: string;         // IPriceStandSalon.id
  centerX: number; centerY: number;
  widthMeter: number; depthMeter: number;
  rotationDeg: number;         // 0–360, sens horaire, autour du centre
  position: number | null;     // numéro du stand
  stand: Pick<IStand, 'id'> | null;
  prereserved: { note: string } | null;
}

export type FloorElementType = 'WALL' | 'PILLAR' | 'AISLE' | 'DOOR' | 'EXIT' | 'STAIRS' | 'ELEVATOR'
  | 'STAGE' | 'BAR' | 'WC' | 'TECH' | 'POWER' | 'MARK';

export interface IFloorElement {
  id: string;
  type: FloorElementType;
  label: string | null;        // libellé affiché, sinon libellé du type
  centerX: number; centerY: number;
  widthMeter: number; depthMeter: number;
  rotationDeg: number;
  blockingOverride: boolean | null; // null = valeur par défaut du type
}

export interface IFloorPlanSettings {     // une seule par salon
  gridMeter: number;          // 0.25 | 0.5 | 1, grille affichée
  moveStepMeter: number;      // 0.05 | 0.1 | 0.25 | 0.5 | 1, pas de déplacement
  rotationStepDeg: number;    // 1 | 5 | 15 | 45
  magnet: boolean;
  elementTypes: Record<FloorElementType, { widthMeter: number; depthMeter: number; blocking: boolean }>;
}
```

En interne, le canvas peut travailler avec `x, y` (coin haut-gauche avant rotation), `w`, `h`, `rot`. On convertit au chargement et à l'enregistrement : `x = centerX - w/2`.

### 3.2 Valeurs par défaut des types d'éléments

| Type | Libellé | Largeur × profondeur | Bloquant |
|---|---|---|---|
| AISLE | Allée | 10 × 2 | oui |
| DOOR | Entrée | 5 × 2,5 | oui |
| EXIT | Sortie de secours | 1,5 × 2,5 | oui |
| STAIRS | Escalier | 1,4 × 3,2 | oui |
| ELEVATOR | Ascenseur | 1,8 × 1,8 | oui |
| STAGE | Scène | 6 × 4 | oui |
| BAR | Buvette | 5 × 4 | oui |
| WC | Toilettes | 2,5 × 1,6 | oui |
| TECH | Local technique | 2 × 2 | oui |
| POWER | Borne électrique | 0,4 × 0,4 | non |
| MARK | Repère (annotation) | 3 × 2 | non |
| WALL | Mur | 4 × 0,2 | oui |
| PILLAR | Pilier | 0,5 × 0,5 | oui |

### 3.3 Back-end et migration

- Adapter l'entité, le DTO et le `batchSave` pour stocker `locations`, `elements`, les dimensions du plan et les réglages. **Regarde comment le plan est stocké aujourd'hui** (probablement le JSON des cellules) et reste dans le même mode de stockage. Ajoute un changelog Liquibase si le schéma change.
- **Migrer les plans existants** (au chargement côté back, ou par un script). Pour chaque cellule `firstCell` qui porte une `dimension`, avec `s = spacingMeter`, `row` / `col` la position de la cellule et `rows` / `cols` la taille de la dimension en cellules :
  - `widthMeter = cols * s`, `depthMeter = rows * s` ;
  - `centerX = col * s + widthMeter / 2`, `centerY = row * s + depthMeter / 2` ;
  - `rotationDeg = 0` ;
  - `position`, `stand`, `prereserved` sont repris tels quels.

  `widthMeter` et `heightMeter` du plan sont conservés. `spacingMeter` devient la `gridMeter` par défaut. Attention : `convertAvailableDimensionCell` croise largeur et profondeur (`cols = heightMeter * 2`). Vérifie l'orientation sur un vrai plan avant de migrer.

---

## 4. Géométrie (fonctions pures, à tester)

Tout se calcule en mètres. Le SVG est en mètres lui aussi (`viewBox` en mètres) et le zoom ne fait que changer la taille du `<svg>`.

- **Coins** d'un rectangle tourné : centre `c`, demi-largeur `hw`, demi-profondeur `hh`, angle `a` → coins `c + R(a)·(±hw, ±hh)`.
- **Chevauchement** : test des axes séparateurs (SAT) sur les 4 axes (angle de A, A + 90°, angle de B, B + 90°), avec une tolérance `EPS = 0.01` pour que deux stands bord à bord ne soient pas en conflit. Si les deux angles valent 0, un simple test de boîtes alignées suffit.
- **Point dans un objet** : on ramène le point dans le repère de l'objet (rotation inverse), puis `|u| ≤ w/2 && |v| ≤ h/2`.
- **Dépasse du plan** : la boîte englobante des coins sort de `[0, widthMeter] × [0, heightMeter]`.
- **Calage au pas** : `snap(v) = round(v / moveStep) * moveStep` (5 cm si le calage est désactivé). Un objet droit cale son coin haut-gauche, un objet en biais cale son centre.
- **Aimant** (si activé, seuil 35 cm) : dans le repère de l'objet, il colle ses bords aux bords des objets **de même angle** proches, et aux murs du plan pour les objets droits.
- **Rotation** : angle ramené dans `[0, 360[`. Avec la poignée, l'angle est arrondi au `rotationStepDeg` et attiré vers 0 / 90 / 180 / 270° à moins de 4°. Maj + poignée tourne degré par degré.

## 5. Règles de conflit

| Cas | Résultat |
|---|---|
| Stand × stand qui se chevauchent | Conflit sur les deux |
| Stand × élément bloquant | Conflit sur les deux |
| Stand × élément non bloquant | Rien |
| Élément × élément | Jamais de conflit |
| Stand qui dépasse du plan | Conflit « dépasse du plan » |
| Exposant dans un emplacement d'une autre dimension | **Avertissement** (orange), pas un conflit |

- Un élément est bloquant si `blockingOverride ?? settings.elementTypes[type].blocking`.
- **On n'empêche jamais un placement** : l'objet est posé et signalé, rien n'est déplacé automatiquement. C'est voulu, pour ne pas bloquer l'organisatrice.
- Les conflits sont recalculés à chaque rendu dans un `computed` (une seule fois par rendu, pas une fois par stand).
- La liste des conflits est cliquable : un clic sélectionne le stand, bascule sur le bon plan et le centre. Le compteur rouge de la barre d'état passe au conflit suivant.

---

## 6. Rendu du plan (SVG)

### 6.1 Fond et calques

1. Sol du plan : rectangle `--surface`, bord épais.
2. Grille : un `pattern` au pas `gridMeter` (trait fin) et un trait plus marqué tous les 5 m.
3. Règles graduées en mètres en haut et à gauche (chiffre tous les 5 m), et en bas à droite « 30 × 15 m · grille 0,5 m · pas 0,25 m ».
4. Éléments de surface (allées, entrée, scène…), puis stands, puis repères, puis murs, piliers et bornes, puis l'objet sélectionné **toujours au-dessus**.

### 6.2 Tailles de texte « à l'écran »

Les textes et pictos visent une taille en pixels écran, bornée par la place disponible en mètres. Ils restent lisibles en vue d'ensemble et ne deviennent pas énormes quand on zoome.

```ts
const px = (n: number) => n / pixelsPerMeter;                        // n pixels écran → mètres
const fitS = (target: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, target));
```

### 6.3 Cadre de lecture

Le texte d'un objet tourné est contre-tourné par multiples de 90° pour rester au plus près de l'horizontale. Pour un objet étroit (largeur < 0,8 × profondeur et < 2,2 m), le texte suit la grande longueur.

### 6.4 Stand (le cœur de la maquette)

- **Fond** : couleur de catégorie via `getColorStand(stand)`. Emplacement vide : fond `--surface`, bord pointillé. Pré-réservé : hachures fines couleur accent.
- **Bandeau en tête** (dans le cadre de lecture), de hauteur `hh = min(fitS(px(20), 0.24, 0.62), H * 0.38)` :
  - fond `--ink` à 7,5 % d'opacité et filet en bas ;
  - à gauche, le **numéro** (`position`), en police condensée medium, taille `hh * 0.58` ;
  - à droite, de droite à gauche :
    1. **pastille de statut** : rond plein de la couleur du statut (`colorStatus`) avec l'icône du statut (`status`) en blanc ;
    2. **chevauchement** (icône deux carrés, rouge `--app-danger`) ;
    3. **dimension différente** (double flèche, orange) ;
    4. **pré-réservé** (étiquette, accent) ;
    5. **stand partagé** (deux personnes, gris).

    Les pictos qui ne tiennent pas sont retirés en partant de la fin de cette liste.
  - Pour une icône FontAwesome dans le SVG, prends le `IconDefinition` (`icon[0]` largeur, `icon[1]` hauteur, `icon[4]` chemin) et dessine un `<svg viewBox>` imbriqué. C'est la même icône que le pipe `status` sait déjà choisir.
- **Corps, mode Exposant** :
  - nom du stand (ou nom de la personne selon la bascule), centré, une ou deux lignes avec « … », graisse **regular**, taille `fitS(px(12.5), m*0.11, min(0.42, bodyH*0.3))` ;
  - en dessous, en plus petit et gris, l'autre nom s'il reste de la place.
- **Corps, mode Technique** : petites étiquettes arrondies centrées qui passent à la ligne si besoin :
  - ⚡ électricité, sur fond ambre si demandée, en pointillés gris sinon ;
  - chaise + nombre ;
  - table + nombre.

  Hauteur `min(fitS(px(18), 0.2, 0.46), bodyH*0.4)`. Les données viennent des champs que la tuile actuelle affiche déjà en mode technique (électricité, chaises, tables, stand partagé).
- **Emplacement vide** : bandeau avec le numéro (plus l'étiquette s'il est pré-réservé), et au centre « 3 × 2 » puis « libre » ou « pré-réservé ».
- **États** :
  - conflit : bord rouge et hachures rouges ;
  - dimension différente : bord orange ;
  - sélection : contour pointillé accent, plus une **poignée de rotation** (rond au bout d'une tige, au-dessus de l'objet) ;
  - cible d'un dépôt : bord accent épais et fond accent clair.
- **Info-bulle** (`<title>`) : « Stand 12 · 3 × 2 m », nom et personne, statut, puis les alertes, une par ligne.
- **Il n'y a pas de marqueur de façade** sur les stands : pas de trait épais ni de triangle. Seul l'angle compte.

### 6.5 Éléments

| Type | Dessin |
|---|---|
| Mur, pilier | Plein `--ink`, sans texte |
| Allée | Hachures diagonales légères, bord pointillé, libellé en capitales espacées |
| Entrée | Fond accent clair, bord pointillé accent |
| Sortie de secours | Fond vert clair, bord vert |
| **Escalier** | Fond `--surface`, bord `--ink`, **une ligne par marche tous les 28 cm**, perpendiculaire à la grande longueur. **Pas de flèche.** Libellé seulement s'il est renseigné, sur une petite plaque |
| Ascenseur | Cadre intérieur, deux diagonales en croix, trait de porte en bas |
| Toilettes | « WC » en capitales espacées |
| Borne électrique | Rond ambre avec un éclair |
| Repère | Contour pointillé, sans fond |
| Scène, buvette, local technique | Fond `--surface-2`, libellé centré |

Un élément **non bloquant** est dessiné à 45 % d'opacité avec un bord pointillé, ce qui se voit d'un coup d'œil.

---

## 7. Popin « Réglages »

Ouverte par le bouton **Réglages** (`pi-sliders-h`) de la barre d'outils, par le « + » des onglets (avec un nouveau plan pré-rempli et son nom en focus) et par la pastille « Grille 0,5 m · pas 0,25 m · 15° » de la barre d'état.

Utilise `dialog-box` en grand format (environ 880 px, plein écran sur mobile), avec un en-tête, une barre d'ancres « Grille et pas · Plans · Éléments » et un pied fixe **Annuler / Appliquer**. **La popin travaille sur un brouillon** : rien ne change avant « Appliquer ».

1. **Grille et pas**
  - Aperçu SVG d'une bande de 8 m : traits de grille, points aux positions possibles, un stand de 3 m posé vers 1,3 m (« x = 1,25 m ») et un rectangle tourné du pas de rotation.
  - **Grille affichée** : sélecteur segmenté 0,25 / 0,5 / 1 m. Aide : « Lignes fines du plan, un trait plus marqué chaque mètre et tous les 5 m. »
  - **Pas de déplacement** : 0,05 / 0,1 / 0,25 / 0,5 / 1 m. Aide : « Les objets se calent sur ce pas en glissant et avec les flèches. Alt + flèche : 5 cm. »
  - **Pas de rotation** : 1 / 5 / 15 / 45°.
  - **Aimanter aux bords voisins** : interrupteur.

   Pour le sélecteur segmenté, regarde si un composant existe (`p-selectbutton` ou équivalent du projet), sinon un groupe de `button-box`.
2. **Plans** : une ligne par plan avec ↑ ↓ pour l'ordre, le nom (`text-box`), la largeur et la profondeur (`number-box` décimal, suffixe m), le nombre d'objets, et une corbeille.
  - Supprimer un plan qui contient des objets demande une confirmation dans la ligne : « 3 exposants à replacer · Supprimer / Garder ».
  - « Ajouter un plan » ajoute une ligne de 20 × 10 m.
  - Aide : « Réduire un plan ne supprime rien : les stands qui dépassent passent en conflit. »
3. **Éléments** : une ligne par type avec un mini-aperçu, le libellé et l'aide, la largeur et la profondeur par défaut, et un interrupteur **Bloquant**.

**Validation** : plans entre 2 et 400 m, éléments d'au moins 10 cm. En cas d'erreur, un message rouge apparaît dans le pied et la popin défile jusqu'à la section concernée.

**Application** :
- les réglages et les plans (ordre, noms, tailles, suppressions) sont remplacés ;
- les ids des plans supprimés vont dans `floorPlansToRemove` ;
- un toast « Réglages appliqués » s'affiche, complété au besoin par « · N conflits à revoir » et « · N exposants à replacer » ;
- l'opération est **annulable** avec Ctrl+Z.

---

## 8. Interactions

| Action | Souris / clavier | Tactile |
|---|---|---|
| Poser un exposant | Glisser sa carte : sur un emplacement **libre**, l'exposant y est attribué ; ailleurs, un stand à sa dimension est créé | Toucher la carte (elle s'« arme »), puis toucher le plan |
| Poser un emplacement vide ou un élément | Glisser depuis la palette, ou cliquer pour l'armer et poser plusieurs fois de suite | Pareil, au toucher |
| Déplacer | Glisser l'objet (calage au pas, aimant) ; flèches = 1 pas, Alt + flèches = 5 cm | Glisser avec un doigt |
| Tourner | Poignée ; Q / E = ∓ pas de rotation ; R = quart de tour | Poignée |
| Redimensionner un élément | Poignée ronde au coin bas-droit (un mur ne change que de longueur) | Pareil |
| Dupliquer | Ctrl+D : copie collée dans la direction de la grande longueur, nouveau numéro | Barre flottante |
| Supprimer | Suppr | Barre flottante |
| Annuler / Rétablir | Ctrl+Z / Ctrl+Y (historique de 100 états, réglages compris) | Boutons de la barre |
| Zoom | Ctrl + molette (centré sur la souris), boutons − / +, « Tout voir » | Pincer à deux doigts |
| Afficher Exposant / Technique | T | Sélecteur |
| Tout désélectionner, désarmer | Échap | Toucher le fond |

- **Barre flottante** au-dessus de l'objet sélectionné : −pas, champ angle (°), +pas, 90°, dupliquer, supprimer. Sur mobile, elle est centrée en bas du plan.
- Pendant une rotation, un **rapporteur** s'affiche autour du centre avec l'angle en cours.
- Les raccourcis sont ignorés quand le focus est dans un champ ou une popin.

---

## 9. Panneaux

### 9.1 Palette (gauche)

Trois onglets :
- **Exposants** (avec le nombre à placer) : champ de filtre, cartes groupées par catégorie avec la pastille de couleur, le nom, la personne, un point de statut et la dimension demandée.
- **Vides** : une carte par dimension vendue, avec un mini-rectangle à l'échelle, « n posés · n demandés », une barre de remplissage et une pastille « −2 » s'il manque des emplacements.
- **Éléments** : grille de cartes avec un mini-aperçu dessiné comme sur le plan, le libellé, l'aide et un badge « Bloquant » ou « Non bloquant ».

Commun aux onglets : « **Angle des prochains posés** », avec des boutons ↓ ← ↑ → ↘ (0 / 90 / 180 / 270 / 315°).

### 9.2 Inspecteur (droite)

**Stand sélectionné** :
- En-tête : « Stand attribué · Halle principale », puis « Stand 12 » et une puce « 3 × 2 m ».
- Alerte rouge pour chaque conflit et alerte orange pour une dimension différente.
- Encadré exposant (couleur de catégorie, nom, personne, catégorie), statut en `p-tag` coloré, puce « Dimension conforme ».
- **Fiche technique** en 4 tuiles (icône dans un carré arrondi, valeur, libellé) : Électricité (oui/non, ambre si oui), Chaises, Tables, Stand partagé. Une valeur absente s'affiche en tuile pointillée grise.
- Bouton « Libérer l'emplacement » : retire l'exposant et garde l'emplacement.
- Emplacement vide : `select-box` « Attribuer à un exposant », avec d'abord le groupe « Même dimension (n) » puis « Autres dimensions », et la note de pré-réservation.
- Numéro (`number-box`), Dimension (`select-box`), **Orientation** (boussole de 8 directions avec l'angle au centre, plus un champ « Angle précis »).
- Actions : Pivoter, Dupliquer, Supprimer.

**Élément sélectionné** :
- Type (`select-box`), libellé, largeur et profondeur, orientation.
- Bloc **Bloquant** avec un interrupteur et une phrase d'explication. Si la valeur diffère du défaut du type, afficher « Réglage propre à cet objet… » et un lien **Revenir au défaut**, qui remet `blockingOverride` à `null`.

**Rien de sélectionné**, vue d'ensemble :
- 3 indicateurs : exposants placés sur le total, emplacements libres, conflits.
- Liste « À corriger » cliquable, puis « Dimensions différentes ».
- Légende des catégories.
- **Statuts des stands placés** en barres (une par statut, couleur du statut, nombre).
- **Logistique du plan** : nombre de prises, de chaises et de tables.

### 9.3 Barre du haut et barre d'état

- **Barre du haut** : onglets des plans (avec un compteur rouge de conflits), sélecteur Exposant / Technique, bouton nom du stand / personne, recherche, Annuler / Rétablir, calage au pas (on/off), aimant (on/off), zoom − / valeur / + / Tout voir, Réglages.
- **Barre d'état** : coordonnées du curseur en mètres, « 29 emplacements · 21 attribués · 8 libres », pastille des conflits (passe au suivant) ou « Aucun conflit », pastille Grille / pas.

---

## 10. Mobile (< 900 px)

- En-tête compact : titre et onglets des plans sur une ligne, puis une ligne d'outils qui défile horizontalement, avec des boutons en icône seule.
- Le plan occupe tout l'écran restant. Le zoom initial cadre la hauteur, avec au moins 24 px/m pour que les étiquettes restent lisibles, et on fait défiler le plan sur le côté.
- **Tiroir en bas** à la place des deux panneaux :
  - fermé, il n'affiche que la barre d'onglets (Exposants / Vides / Éléments / **Bilan**) ;
  - avec une sélection, il affiche « Stand 12 · Nom », un compteur de conflits, une flèche pour l'ouvrir et une croix pour désélectionner ;
  - toucher un onglet ou la poignée ouvre le tiroir (environ 64 % de la hauteur) ;
  - **armer** un élément le referme pour libérer le plan.
- La barre flottante de rotation est centrée en bas du plan, et les toasts s'affichent au-dessus du tiroir.
- La popin Réglages passe en plein écran, et ses lignes de tableau passent sur deux lignes.
- Un doigt sur le fond fait défiler le plan, un doigt sur un objet le déplace (`touch-action: none` sur les objets), deux doigts zooment.
- **Aucun défilement horizontal de la page.**

---

## 11. Clés de traduction à ajouter (fr)

Range-les sous `floorPlan.*` en suivant la structure existante. Principales clés :

```json
{
  "floorPlan": {
    "view": { "exhibitor": "Exposant", "technical": "Technique", "personName": "Afficher le nom de la personne", "standName": "Afficher le nom du stand" },
    "palette": { "exhibitors": "Exposants", "empty": "Vides", "elements": "Éléments", "summary": "Bilan", "filter": "Filtrer les exposants à placer", "nextAngle": "Angle des prochains posés", "placed": "{{n}} posés · {{need}} demandés", "blocking": "Bloquant", "nonBlocking": "Non bloquant" },
    "stand": { "free": "libre", "prereserved": "pré-réservé", "overlap": "Chevauchement", "sizeMismatch": "Demandé {{asked}}, emplacement {{slot}}", "shared": "Stand partagé", "outOfPlan": "dépasse du plan", "release": "Libérer l'emplacement", "sameDimension": "Même dimension ({{n}})", "otherDimension": "Autres dimensions", "conform": "Dimension conforme" },
    "tech": { "title": "Fiche technique", "electricity": "Électricité", "chairs": "Chaises", "tables": "Tables", "shared": "Stand partagé", "yes": "Oui", "no": "Non" },
    "element": { "blocking": "Bloquant", "nonBlocking": "Non bloquant", "blockingHelp": "Un stand posé dessus passe en conflit.", "nonBlockingHelp": "Les stands peuvent le recouvrir sans conflit.", "custom": "Réglage propre à cet objet", "reset": "Revenir au défaut", "types": { "AISLE": "Allée", "DOOR": "Entrée", "EXIT": "Sortie de secours", "STAIRS": "Escalier", "ELEVATOR": "Ascenseur", "STAGE": "Scène", "BAR": "Buvette", "WC": "Toilettes", "TECH": "Local technique", "POWER": "Borne électrique", "MARK": "Repère", "WALL": "Mur", "PILLAR": "Pilier" } },
    "orientation": { "title": "Orientation", "precise": "Angle précis" },
    "summary": { "title": "Vue d'ensemble", "placed": "exposants placés", "free": "emplacements libres", "conflicts": "conflits", "toFix": "À corriger", "statuses": "Statuts · stands placés", "logistics": "Logistique · {{plan}}", "outlets": "prises" },
    "settings": {
      "title": "Réglages du plan", "gridAndSteps": "Grille et pas", "plans": "Plans", "elements": "Éléments",
      "grid": "Grille affichée", "gridHelp": "Lignes fines du plan, un trait plus marqué chaque mètre et tous les 5 m.",
      "move": "Pas de déplacement", "moveHelp": "Les objets se calent sur ce pas en glissant et avec les flèches. Alt + flèche : 5 cm.",
      "rotation": "Pas de rotation", "rotationHelp": "Poignée de rotation et touches Q / E. Maj + poignée : degré par degré.",
      "magnet": "Aimanter aux bords voisins", "magnetHelp": "Colle un objet contre le mur ou le stand d'à côté quand il en est à moins de 35 cm.",
      "addPlan": "Ajouter un plan", "shrinkHelp": "Réduire un plan ne supprime rien : les stands qui dépassent passent en conflit.",
      "deleteConfirm": "{{n}} exposant(s) à replacer", "keep": "Garder",
      "elementsHelp": "Taille à la pose et comportement par défaut. Chaque objet posé peut ensuite avoir son propre réglage.",
      "apply": "Appliquer", "applied": "Réglages appliqués", "moreConflicts": "{{n}} conflit(s) à revoir", "toReplace": "{{n}} exposant(s) à replacer",
      "errorPlanSize": "« {{name}} » : largeur et profondeur entre 2 et 400 m.", "errorElementSize": "{{type}} : taille d'au moins 10 cm."
    }
  }
}
```

---

## 12. Plan d'implémentation (dans l'ordre)

1. **Modèle et géométrie** : `floor-plan.model.ts` (section 3), puis `floor-plan.geometry.ts` (section 4) avec ses tests unitaires (chevauchement droit et tourné, bord à bord sans conflit, point dans un objet tourné, calage, normalisation d'angle).
2. **Back-end** : DTO, stockage, `batchSave`, migration des anciens plans, réglages du salon.
3. **Canvas en lecture seule** : SVG, grille, règles, éléments, stands avec bandeau et corps, bascules Exposant / Technique et nom, info-bulles, zoom et « Tout voir ». Vérifier sur un vrai salon migré.
4. **Conflits** : `computed`, styles des états, liste cliquable, compteur dans les onglets.
5. **Édition** : sélection, déplacement avec calage et aimant, rotation (poignée, rapporteur, Q / E / R), redimensionnement des éléments, barre flottante, historique Annuler / Rétablir, raccourcis.
6. **Palette** : exposants, vides, éléments, angle des prochains posés, glisser-déposer et mode « armé ».
7. **Inspecteur** : stand, élément (interrupteur Bloquant et retour au défaut), vue d'ensemble, fiche technique.
8. **Popin Réglages** (section 7), branchée sur les onglets et la barre d'état.
9. **Fonctionnalités conservées** (section 2) : mode lecture, menu Actions, recherche, numérotation, pré-réservation, détail en lecture, menu contextuel, informations sensibles.
10. **Mobile** (section 10).
11. **Traductions** dans toutes les langues présentes, puis relecture visuelle en thème clair et sombre.

## 13. Critères d'acceptation

- [ ] Un stand peut être posé n'importe où au pas choisi, tourné à n'importe quel angle, et ses conflits sont justes, y compris en biais.
- [ ] Deux stands bord à bord ne sont pas en conflit.
- [ ] Un pilier passé en « non bloquant » supprime le conflit du stand qui le recouvre, et Ctrl+Z le rétablit.
- [ ] Changer le pas de déplacement à 0,5 m dans Réglages fait caler les stands sur 0,5 m.
- [ ] Supprimer un plan avec des exposants demande confirmation, puis les exposants reviennent dans « Exposants à placer ».
- [ ] L'escalier affiche ses marches sans flèche, et les stands n'ont aucun trait ni triangle de façade.
- [ ] Sur un téléphone de 390 px de large, la page ne défile pas horizontalement, le tiroir s'ouvre et se ferme, et on peut poser, déplacer, tourner et zoomer au doigt.
- [ ] Toutes les fonctionnalités de la section 2 fonctionnent encore.
- [ ] Aucune couleur en dur ni nouveau composant de formulaire quand un composant partagé existe.