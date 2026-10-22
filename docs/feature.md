# Listes d'administration : un modèle commun (participations, stands, conférences, ateliers, salons)

Spécification à destination de GitHub Copilot pour réécrire **cinq écrans de liste** sur un **modèle unique** :

| Liste | Dossier actuel |
|---|---|
| Participations | `src/main/webapp/app/admin/participation/list/` |
| Stands | `src/main/webapp/app/admin/stand/list/` |
| Conférences | `src/main/webapp/app/admin/conference/list/` |
| Ateliers | `src/main/webapp/app/admin/workshop/list/` |
| Salons | `src/main/webapp/app/admin/salon/list/` |

La référence visuelle et fonctionnelle est la maquette **`docs/listes.maquette.html`**.
- Ouvre-la dans un navigateur.
- Les quatre onglets du haut correspondent aux thématiques. Le sélecteur **Liste** (onglet 3) bascule entre conférences et ateliers.
- Le sélecteur **Aperçu** bascule entre **Ordinateur** et **Mobile**. Les deux affichages sont à reproduire.
- Le pli « Ce qui est commun et ce qui change », sous chaque onglet, résume la thématique.
- Les noms, montants, numéros et dates de la maquette sont fictifs.

> **Copilot, lis d'abord le projet.** Ce document ne connaît pas le dépôt en détail. Avant d'écrire du code, parcours :
> - les cinq composants de liste actuels ;
> - les modèles `participation.interface.ts`, `exhibitor.interface.ts`, `stand.interface.ts`, `conference.interface.ts`, `workshop.interface.ts`, `salon.interface.ts`, `price-stand-salon.interface.ts`, `category.model.ts`, `status.model.ts` ;
> - les services correspondants et les fichiers de routes (`*.routes.ts`) ;
> - côté back : `AdminSalonResource`, le `ParticipationService` Java (`getInfoInvoicesForSalon`, `buildInfoInvoice`), `SalonService.findAll`, les repositories `Stand`, `Conference`, `Workshop`, `InvoicingPlan`, `Participation` ;
> - les composants partagés (`src/main/webapp/app/shared/`), `content/scss/_variables.scss` et les fichiers `i18n/fr/*.json`.
>
> Partout où ce document décrit un bouton, un menu, une icône ou une couleur, **reprends ce qui existe déjà**. Ne crée quelque chose de nouveau que s'il n'y a vraiment pas d'équivalent.

---

## 1. Règles d'implémentation

1. **Un seul modèle, des composants partagés.** Les cinq listes doivent se ressembler au maximum : même en-tête, même structure de ligne, même pied, même menu d'actions. Le socle commun vit dans `src/main/webapp/app/shared/components/entity-list/` (section 3). Chaque écran ne fournit que son contenu, ses filtres, ses options de groupement et de tri, et ses actions.
2. **Pas de détail déplié dans la liste.** Un clic sur une ligne ouvre **la fiche qui existe déjà** (`./:id/view`). La liste ne duplique pas cette fiche.
3. **Réutiliser l'existant.**
    - Page : `app-content-page` (zones `appMenuBarStart` / `appMenuBarEnd`), `app-alert-error`, `p-confirmpopup`.
    - Boutons : `button-box`. Menus (⋯ de la page, rouage de la ligne) : `menu-box` ou `p-menu` en mode `popup`, comme ce qui existe déjà.
    - Menu « Grouper et trier » : `p-popover` (ou l'équivalent déjà utilisé) contenant des `p-radiobutton`.
    - Recherche : `p-iconfield` + `pInputText`.
    - Icônes : FontAwesome (`fa-icon`) dans le contenu, PrimeIcons dans les boutons. Reprends les icônes déjà utilisées pour les mêmes informations (`heart`, `star`, `note-sticky`, `handshake-simple`, `gift`, `flag`, `triangle-exclamation`…). Grouper et trier : `pi-sliders-h`. Rouage : `pi-cog`.
    - Statuts : libellés `*.status.list.*` et couleurs `--app-status-*`. Catégories : `--app-category-*` et `stand.category.list.*`.
    - Suppression : `ConfirmDialogService.delete(...)`, comme aujourd'hui. Presse-papiers : `copyToClipboard`.
    - Couleurs : uniquement les variables du thème, **aucune couleur en dur**. Ajoute une variable dans `_variables.scss` si une teinte manque.
    - Traductions : `jhiTranslate` / pipe `translate`, avec les clés dans `i18n/fr/` (section 9).
4. **Style de code de l'existant.**
    - Composants standalone, `ChangeDetectionStrategy.OnPush`.
    - `signal` / `computed` / `input` / `output` / `model`, `inject()`.
    - `@if` / `@for` avec `track` sur l'identifiant.
5. **Pas de nouvelle dépendance npm.**
6. **On remplace `p-table`** et son paginateur par des listes `<ul>/<li>` construites à la main. Au-delà de 150 lignes, ajoute un bouton « Afficher plus ».
7. **Logique pure testée.** Filtres, tris, regroupements et éléments de pied sont des fonctions pures dans un fichier `*.list.utils.ts` par écran (plus `entity-list.utils.ts` pour le commun), avec leurs tests.
8. **Ne rien perdre** : chaque fonctionnalité actuelle listée en section 5 doit rester disponible.

---

## 2. Le modèle commun (ce que montre la maquette)

### 2.1 En-tête

- **Gauche** : le titre de l'écran. Dessous, en petit et en gris, une ligne de contexte (le salon courant pour les listes d'un salon, un total pour les salons).
- **Droite** :
    - le bouton **Retour** actuel ;
    - un bouton icône **⋯** qui ouvre le menu d'actions de la liste ;
    - le bouton principal **Créer** (`pi-plus`), qui n'affiche que l'icône sur mobile.

### 2.2 Barre d'outils

**Ligne 1** : la recherche prend toute la place. Juste à sa droite, un **bouton icône carré « Grouper et trier »** (`pi-sliders-h`, même hauteur que le champ, info-bulle et `aria-label` « Grouper et trier »). Sur mobile, les deux restent sur la même ligne.

Un clic sur le bouton ouvre un **menu ancré sous le bouton, aligné à droite**, avec deux sections à **boutons radio** :

- **Grouper par** : les options de l'écran (section 2.3).
- Un séparateur.
- **Trier par** : les options de l'écran. Chaque option a une aide en petit et en gris sous le libellé, qui dit sur quoi porte le tri (« date d'inscription », « nom du thérapeute », « titre », « date de début », « nom du salon »).
- L'option cochée est en graisse 700.
- Si une seule option de tri reste disponible, la section « Trier par » et son séparateur sont masqués.

**Comportement du menu** :
- Un choix s'applique **immédiatement**, et le menu **reste ouvert** pour pouvoir régler l'autre section.
- Il se ferme au clic à l'extérieur ou avec Échap.
- Quand le groupement ou le tri n'est **pas celui par défaut**, le bouton est mis en évidence : bord et icône couleur primaire, fond primaire léger, et un petit point primaire dans son coin haut droit.

**Ligne 2** : une rangée de **puces** qui défile horizontalement. Elles sont organisées en groupes, chacun précédé d'un petit libellé en capitales grises, avec un séparateur vertical entre les groupes.
- Chaque puce affiche son **effectif**, calculé sur toute la liste.
- Les puces de signaux à 0 sont masquées. Les puces de statut et de période restent toujours affichées.
- **Logique** : les puces du groupe « Statut » (ou « Période ») se combinent en **OU** ; celles du groupe « Signaux » en **ET** ; les groupes entre eux en **ET** avec la recherche.
- Puce active : bord et texte couleur primaire, fond primaire léger, `aria-pressed="true"`.

**Recherche et état** :
- La recherche ignore les accents et la casse.
- La recherche, le groupement, le tri et les filtres sont synchronisés avec les **query params** (`?q=…&group=…&sort=…&f=…`).

### 2.3 Grouper et trier (règles communes)

| Écran | Grouper par (défaut en premier) | Trier par (défaut en premier) |
|---|---|---|
| Participations | Statut · Alphabet | Date d'inscription · Alphabet |
| Stands | Catégorie · Statut · Alphabet | Date d'inscription · Alphabet |
| Conférences / ateliers | Statut · Alphabet | Date d'inscription · Alphabet · Titre |
| Salons | Statut (état calculé) · Alphabet | Date de début · Titre |

- **Alphabet**, en groupement comme en tri, porte sur le **nom du thérapeute** (`therapistName` ou `participation.therapistName`). Pour les salons, il porte sur le **nom du salon** (`place`).
- **Grouper par Alphabet** :
    - un groupe par initiale (sans accent, en majuscule ; « # » pour un nom vide ou qui ne commence pas par une lettre) ;
    - groupes triés de A à Z, aucun groupe replié par défaut ;
    - le point du groupe est en couleur primaire.
- **Tri** :
    - **Date** est décroissant ;
    - **Alphabet** et **Titre** sont croissants, sans accent, avec la date décroissante en cas d'égalité ;
    - le tri s'applique à l'intérieur de chaque groupe.
- **Option redondante masquée** : quand on groupe par Alphabet, l'option de tri sur la même clé disparaît (Alphabet, et Titre pour les salons). Si c'était le tri actif, on repasse sur **Date**.
- **Changer de groupement** réinitialise les groupes repliés aux valeurs par défaut de ce groupement.

### 2.4 Groupes

- **En-tête de groupe** : un bouton pleine largeur, **collant** en haut de la zone de liste. Il contient :
    - un chevron (−90° quand le groupe est replié) ;
    - un point de couleur ;
    - le libellé ;
    - l'effectif dans une pastille ;
    - à droite, un résumé propre à l'écran ;
    - dessous, une barre de 4 px dont la largeur vaut la part du groupe dans le total.
- Certains groupes sont repliés par défaut. **Tous s'ouvrent** dès qu'une recherche ou un filtre est actif.

### 2.5 Ligne

Une carte : fond `--app-surface`, bord 1 px, rayon 10 px, 6 px d'écart entre les cartes. **Aucun badge et aucune bordure de couleur** sur les deux premiers niveaux. Au survol, le bord fonce et une ombre légère apparaît. Le curseur est une main sur toute la carte.

```
ordinateur et mobile :  "titre    statut"
                        "méta     droite"
                        "pied …………………………… ⚙"
```

- **Titre** : 15 px, graisse 600, coupé avec « … ». Surligne la partie qui correspond à la recherche.
- **Statut** : calé à droite, point de 8 px + libellé, 13,5 px, graisse 700, couleur du statut. Les éléments annulés sont barrés.
- **Méta** et **droite** : 12,5 px, gris.
- **Pied** : une 3e ligne séparée par un trait **pointillé**, 11,5 px, **toujours présente** (elle porte le rouage).
    - À gauche, les informations secondaires : éléments « icône + libellé (+ précision en gris) » séparés par un « · ». Les tags sont de petites étiquettes arrondies.
    - **On n'affiche que ce qui existe.** Un compteur à 0, un booléen faux, un texte vide ou une liste vide ne produisent rien : ni « 0 conférence », ni « Inscriptions fermées », ni « Aucune dimension ».
    - **Tout en bas à droite**, le **rouage** (`pi-cog`) : un bouton icône de 30 px, gris, sans bord. Au survol ou quand son menu est ouvert, il prend un fond léger et un bord, et l'icône tourne de 45°.

**Clic sur la ligne** : ouvre la fiche existante de l'élément (route de la section 6).
- Implémente-le de façon accessible : le titre est un vrai lien `<a [routerLink]>` dont le pseudo-élément `::after` couvre toute la carte (« lien étendu »).
- Le rouage est placé au-dessus (`position: relative; z-index: 1`) pour rester cliquable sans déclencher la navigation.
- Entrée sur la carte ouvre la fiche. Le clic molette ou Ctrl+clic ouvre un nouvel onglet, ce qui est automatique avec un vrai lien.

**Menu du rouage** :
- Un menu contextuel ancré au rouage, aligné à droite, qui s'ouvre **vers le haut** s'il n'y a pas la place en dessous.
- Il contient les actions de l'écran (section 6), chacune avec son icône. **Supprimer** vient en dernier, après un séparateur, en rouge.
- Un seul menu est ouvert à la fois. Il se ferme au clic à l'extérieur, avec Échap, au défilement de la liste, ou après le choix d'une action.
- Ouvrir le menu ne déclenche pas la navigation.

### 2.6 Responsive

- La bascule se fait sur la **largeur du composant**, pas de la fenêtre : `container-type: inline-size` sur l'hôte de la liste, puis `@container (max-width: 720px)`.
- Sur mobile :
    - marges réduites à 12 px ;
    - la recherche et le bouton « Grouper et trier » restent sur une ligne ;
    - les puces défilent ;
    - les alertes de la ligne n'affichent que leur icône.
- **Aucun défilement horizontal de la page à 390 px.**

---

## 3. Composants partagés (`shared/components/entity-list/`)

| Composant | Rôle | Entrées / sorties principales |
|---|---|---|
| `entity-list-toolbar` | Recherche + bouton « Grouper et trier » + rangée de puces groupées | `query` (model), `groupBy` (model), `groupOptions: {key, labelKey}[]`, `defaultGroupBy`, `sort` (model), `sortOptions: {key, labelKey, hintKey}[]` (déjà filtrées selon `groupBy`), `defaultSort`, `chipGroups: {key, labelKey, chips: {key, labelKey, icon?, dotColor?, count}[]}[]`, `activeChips` (model) |
| `entity-group-sort-menu` | Bouton icône et menu à boutons radio (utilisé par la barre d'outils) | `groupBy` (model), `groupOptions`, `sort` (model), `sortOptions`, `isDefault` |
| `entity-list-group` | En-tête de groupe collant et repliable, avec projection des lignes | `label`, `color`, `count`, `ratio`, `collapsed` (model), slot `[groupSummary]` |
| `entity-row` | Carte : deux niveaux + pied + rouage, lien étendu vers la fiche | `link` (commands du `routerLink`), `linkLabel` (pour `aria-label`), `actions: MenuItem[]` ; slots `[rowTitle]`, `[rowStatus]`, `[rowMeta]`, `[rowSide]`, `[rowFoot]` |
| `entity-status` | Point + libellé coloré | `status`, `i18nPrefix` (`participation.status.list`, `stand.status.list`…), `masculine?` |
| `entity-foot-item` | Élément du pied : icône + libellé + précision | `icon`, `labelKey` ou `label`, `detail?`, `color?` |
| `entity-count` | Compteur du pied (« 2 stands »), qui ne s'affiche pas s'il vaut 0 | `icon`, `count`, `singularKey`, `pluralKey` |

`entity-list.utils.ts` contient les fonctions communes, avec leurs tests :
- `groupByAlphabet(items, keyFn)` ;
- `compareAlpha` ;
- `compareDateDesc` ;
- `availableSorts(groupBy, sorts, sameKeyAsAlpha)` ;
- `matchesSearch(item, fields, query)`.

Chaque écran garde son composant conteneur (`participation.component`, `stand.component`…), qui :
- charge les données ;
- tient l'état dans des signals : `query`, `groupBy`, `sort`, `activeChips`, `collapsedGroups` ;
- calcule `filtered` et `groups` avec `computed` ;
- construit, pour chaque ligne, la liste d'actions du rouage (`MenuItem[]`), avec la suppression branchée sur sa méthode `delete` actuelle ;
- assemble les composants partagés dans son template.

**Ordre de réalisation** : construis d'abord ces composants et la liste des **conférences** (la plus simple), puis les autres écrans.

---

## 4. Back-end

### 4.1 Résumé des participations d'un salon

Le pied des participations a besoin d'informations absentes de `IParticipation` : les nombres de stands (dont partagés), de conférences et d'ateliers. On ajoute **un endpoint de résumé par salon**, sur le modèle de `info-invoices`, qui reprend aussi les compteurs de factures :

```
GET /api/admin/salons/{idSalon}/participations/summaries  →  Map<UUID, ParticipationSummary>
```

```java
@Data
public class ParticipationSummary implements Serializable {
    long nbDraft = 0L; long nbIssued = 0L; long nbPaid = 0L; long nbExpired = 0L;          // via buildInfoInvoice
    long nbStands = 0L; long nbSharedStands = 0L; long nbConferences = 0L; long nbWorkshops = 0L; // REFUSED et CANCELED exclus
}
```

- Charge **une requête par type** et regroupe par participation : `findByParticipation_Salon_Id` pour les plans de facturation, `findByParticipationSalonIdOrderByRegistrationDateDesc` pour les stands, conférences et ateliers. Pas de N+1.
- Garde l'endpoint `info-invoices` tant que tu n'as pas vérifié qu'il n'est plus utilisé ailleurs.
- Côté front : `IParticipationSummary extends IInfoInvoice` et `ParticipationService.getSummariesForSalon(idSalon)`, chargé en parallèle de `query(idSalon)`. Une participation absente du résultat est traitée comme « rien ».

### 4.2 Résumé des salons

Le pied des salons a besoin du nombre de participations, de conférences et d'ateliers par salon.
- Ajoute `GET /api/admin/salons/summaries` → `Map<UUID, SalonSummary>`, avec `{ nbParticipations, nbConferences, nbWorkshops }`.
- Les statuts REFUSED et CANCELED sont exclus des trois compteurs.
- Utilise des requêtes `count … group by salon`. Ne charge pas les entités.
- Le nombre de dimensions vient de `priceStandSalons`, déjà présent dans `SalonDTO`.

### 4.3 Données déjà disponibles

- **Stands, conférences, ateliers** : chaque élément arrive avec sa `participation` (`therapistName`, `exhibitor`).
- **Conférences et ateliers** : `registrationDate` existe côté entité (les repositories trient dessus). Ajoute-le aux interfaces TS s'il manque.
- **Stand** : `shared` est un simple booléen. **Il n'y a pas de nom de co-exposant** : on affiche « Partagé (co-exposant) », sans nom.

---

## 5. Fonctionnalités actuelles à conserver (checklist)

- [ ] **Toutes les listes** :
    - titre, bouton Retour, Créer (`./new`), Rafraîchir ;
    - suppression avec confirmation puis rechargement (désormais depuis le rouage) ;
    - état vide (`*.notFound`) ;
    - état de chargement ;
    - accès à la fiche `./:id/view` (désormais par clic sur la ligne).
- [ ] **Participations** :
    - « Copier les e-mails des exposants actifs » ;
    - chargement par `idSalon`, en ignorant les réponses obsolètes ;
    - carte **« Ligne de temps des inscriptions »** (`timeline-dot`), conservée sous la liste.
- [ ] **Stands** :
    - la vue « presse-papiers » (`standardView = false`, tri par catégorie puis thérapeute, clic sur une cellule = copie) **reste accessible depuis le menu ⋯**, inchangée ;
    - le lien vers la participation est conservé (dans le rouage).
- [ ] **Stands, conférences, ateliers** : les listes servent aussi **sous une participation** (`idParticipation` dans la route). Elles gardent le même rendu, avec le contexte « Participation de {thérapeute} » sous le titre.
- [ ] **Salons** : l'accès aux participations du salon, aux statistiques et aux autres sous-écrans reste disponible (rouage ou fiche du salon).

---

## 6. Écran par écran

### 6.1 Participations

**Contexte sous le titre** : nom du salon (`place`) · dates · **J-x** avant l'ouverture (depuis `navigationStateService.salon()`).
**Menu ⋯** : Rafraîchir, Copier les e-mails des exposants actifs.

**Grouper par** : Statut (défaut) · Alphabet (`therapistName`).
**Trier par** : Date (`registrationDate`, défaut) · Alphabet (`therapistName`).

**Puces** :

| Groupe | Puce | Condition |
|---|---|---|
| Statut | À vérifier · Acceptées · Validées · Clôturées · Écartées | `status` ; Écartées = `REFUSED` ou `CANCELED` |
| Signaux | Alertes | `exhibitor.redFlag` ou `exhibitor.duplicateDetected` |
| | Facture échue | `nbExpired > 0` |
| | À facturer | `ACCEPTED`/`VALIDATED` et aucune facture |
| | Coup de cœur | `crushOfHeart` |
| | Invité d'honneur | `guestOfHonor` |
| | Arrangement | `needArrangement` |
| | Offre cadeau | `hasOffer` |
| | Commentaire | `extraInformation` non vide |

**Groupes par statut** : ordre `IN_VERIFICATION, ACCEPTED, VALIDATED, CLOSED, REFUSED, CANCELED`, avec `REFUSED` et `CANCELED` repliés par défaut.
**Résumé à droite de chaque groupe** (statut ou lettre) : « x échues · p/t payées », ou « pas de facture ».

**Ligne** :

| Zone | Contenu |
|---|---|
| Titre | `therapistName` |
| Statut | statut de la participation (féminin) |
| Méta | nom complet de l'exposant, suivi de « ⚑ Red flag » et/ou « Doublon » en texte coloré (icônes seules sur mobile) |
| Droite | « inscrit le 15 avr. » (seulement la date sur mobile) |

Le pied contient, dans cet ordre, **uniquement les éléments présents** :
1. **Info facture** :
    - s'il y a des factures : mini-jauge de 48 px (payé / en attente / brouillon / échu) + « **p/t** payée(s) », ou « **x échue(s)** » en rouge ;
    - si rien n'est facturé : « À facturer » (bleu) pour une participation acceptée ou validée, et rien sinon.
2. **Prestations** : seulement les compteurs non nuls, par exemple « 1 stand · 2 ateliers ». On écrit « (partagé) » ou « (dont partagé) » si `nbSharedStands > 0`.
3. Invité d'honneur (`star`, or).
4. Coup de cœur (`heart`, rouge).
5. Arrangement (`handshake-simple`, bleu).
6. **Offre** (`gift`, violet) + texte `offer` en gris, coupé.
7. **Note** (`note-sticky`) + `extraInformation` en gris, coupé.

**Clic sur la ligne** : `./:id/view`.
**Rouage** :
- Fiche exposant (`/admin/exhibitors/:exhibitorId/view`) ;
- Facturation (`./:id/billing`) ;
- Supprimer.

### 6.2 Stands

**Contexte sous le titre** : salon · dates · « N stands » (ou la participation, si la liste est sous une participation).
**Menu ⋯** : Rafraîchir, **Vue presse-papiers** (vue technique actuelle).

**Grouper par** : Catégorie (défaut) · Statut · Alphabet (`participation.therapistName`).
**Trier par** : Date (`registrationDate`, défaut) · Alphabet (`participation.therapistName`).

**Puces** :

| Groupe | Puce | Condition |
|---|---|---|
| Statut | À vérifier · Acceptés · Validés · Clôturés · Écartés | libellés **au masculin** |
| Signaux | Partagé | `shared` |
| | Électricité | `needElectricity` |
| | Commentaire | `extraInformation` |

Il n'y a **pas de filtre par dimension**.

**Groupes** :
- par **catégorie** : ordre de l'enum `Category`, point de couleur `--app-category-*`, aucun groupe replié ;
- par **statut** : libellés au masculin, `REFUSED` et `CANCELED` repliés.

**Résumé à droite de chaque groupe** : « n actifs · m écartés ».

**Ligne** :

| Zone | Contenu |
|---|---|
| Titre | `description` |
| Statut | statut du stand (masculin) |
| Méta | `participation.therapistName` |
| Droite | catégorie : petit carré de couleur + libellé |

Le pied contient, **uniquement si présents** :
- les **3 premiers tags** (`subCategories`) en petites étiquettes, plus « +n » s'il y en a d'autres ;
- la **dimension** (`dimension.dimension`, icône règle) ;
- « **Partagé (co-exposant)** » si `shared` ;
- **Note** + `extraInformation`.

**Clic sur la ligne** : `./:id/view`.
**Rouage** :
- Participation (`/admin/salons/:idSalon/participations/:idParticipation/view`) ;
- Supprimer.

### 6.3 Conférences et ateliers (un seul rendu pour deux écrans)

Les deux modèles sont identiques (`title`, `description`, `status`, `extraInformation`, `participation`).
- Crée un composant de présentation commun : `shared/components/entity-list/talk-list` ou `admin/common/talk-list`.
- `conference.component` et `workshop.component` l'alimentent avec leur service et leurs clés de traduction (`conference.*` / `workshop.*`).

**Contexte sous le titre** : salon · dates · « N conférences » (ou « N ateliers »).
**Menu ⋯** : Rafraîchir.

**Grouper par** : Statut (défaut) · Alphabet (`participation.therapistName`).
**Trier par** : Date (`registrationDate`, défaut) · Alphabet (`participation.therapistName`) · Titre (`title`).

**Puces** :
- Statut (au féminin pour les conférences, au masculin pour les ateliers : « Acceptés », « Validés »…) ;
- Signaux : **Avec commentaire**.

**Groupes par statut** : `REFUSED` et `CANCELED` repliés. Pas de résumé à droite, quel que soit le groupement.

**Ligne** :
- titre : `title` ;
- statut ;
- méta : `participation.therapistName` ;
- droite : vide ;
- pied : **Note** + `extraInformation` s'il existe, sinon seulement le rouage.

**Clic sur la ligne** : `./:id/view`.
**Rouage** : Participation, Supprimer.

### 6.4 Salons

**Contexte sous le titre** : « N salons · M actifs » (non archivés).
**Menu ⋯** : Rafraîchir, et les actions du menu actuel (importer des inscriptions, si elle s'y trouve).

**Grouper par** : Statut (état calculé, défaut) · Alphabet (`place`).
**Trier par** : Date (`startingDate` décroissante, défaut) · Titre (`place`).
- Quand on groupe par Alphabet, le tri Titre est masqué, et avec lui la section « Trier par » du menu (il ne reste que Date).

**État calculé** (affiché comme un statut) :

| État | Condition | Couleur | Libellé |
|---|---|---|---|
| Archivé | `archived` | `--app-status-canceled` | « Archivé » |
| Terminé | `endingDate` < aujourd'hui | `--app-status-closed` | « Terminé » |
| En cours | `startingDate` ≤ aujourd'hui | `--app-status-validated` | « En cours » |
| À venir | sinon | `--app-status-accepted` | « À venir », suivi de « · J-x » en gris si l'ouverture est dans 60 jours ou moins |

**Puces** : seulement le groupe **Période** (En cours, À venir, Terminés, Archivés). Pas de filtre « Inscriptions ouvertes » ni « Sans dimension ».

**Groupes par statut** : dans l'ordre En cours, À venir, Terminés, Archivés, avec les **Archivés repliés** par défaut.
**Résumé à droite de chaque groupe** : « n participations ».

**Ligne** :

| Zone | Contenu |
|---|---|
| Titre | `place` (libellé « Nom du salon ») |
| Statut | état calculé (ci-dessus) |
| Méta | « Réf. » + `referenceNumber` |
| Droite | période en graisse 600 : « 13–15 nov. 2026 », ou « 30 oct. – 2 nov. 2026 » si les mois diffèrent |

Le pied contient, **uniquement si présents** :
- « Inscriptions en ligne ouvertes » (vert, icône globe) si `registrationEnabled` ;
- « n dimensions » s'il y en a au moins une ;
- les compteurs non nuls parmi « n participations · n conférences · n ateliers ».

**Clic sur la ligne** : `./:id/view`.
**Rouage** :
- Participations (`./:id/participations`) ;
- Statistiques (`./:id/stats`) ;
- Supprimer.

---

## 7. Styles

Les noms de la maquette correspondent aux variables du projet comme suit. Vérifie chaque correspondance dans `_variables.scss`.

| Maquette | Projet |
|---|---|
| `--fg` / `--muted` | `--app-text` / `--app-text-muted` |
| `--line` / `--line-strong` | `--app-border` / `--app-line` |
| `--surface` / `--surface-2` / `--bg` | `--app-surface` / `--app-surface-2` / `--app-surface-muted` |
| `--accent` / `--accent-soft` | `--app-primary` (ou `--app-accent`) / `--app-accent-soft` |
| `--danger` / `--warn` / `--gold` | `--app-danger` / `--app-warn` / `--app-status-gold` |
| `--st-ver` … `--st-can` | `--app-status-verification` / `-accepted` / `-validated` / `-closed` / `-refused` / `-canceled` |
| `--cat-therapist` … `--cat-none` | `--app-category-therapist` / `-artisanat` / `-mediumnity` / `-energetic` / `-miscellaneous` / `-none` |
| `--gift` (violet de l'offre) | à ajouter (`--app-offer`) si absent |

Le mode sombre n'est pas activé dans l'application (`darkModeSelector: false`) : rien de spécifique à prévoir. Les chiffres sont en `font-variant-numeric: tabular-nums`.

---

## 8. Ce qui n'est pas à reproduire

- Les sélecteurs de démonstration de la maquette (Aperçu, Liste).
- Les données inventées de la maquette.
- Les toasts de la maquette (« Ouverture de… », actions) : ce sont des navigations ou les méthodes existantes.
- Toute sélection multiple ou action de masse.
- Tout détail déplié dans la liste.

---

## 9. Traductions

- **Clés communes** dans `i18n/fr/global.json` ou `common.json`, selon la convention du projet :
    - `entityList.search`, `entityList.groupSort` (« Grouper et trier ») ;
    - `entityList.groupBy` (« Grouper par »), `entityList.sortBy` (« Trier par ») ;
    - `entityList.group.{status|category|alpha}`, `entityList.sort.{date|alpha|title}` et leurs aides ;
    - `entityList.filterGroup.{status|period|signals}` ;
    - `entityList.actions` (« Actions »), `entityList.internalComment` ;
    - `entityList.empty.filtered`, `entityList.clearFilters`.
- **Clés par écran**, dans un bloc `list` de chaque fichier (`participation.json`, `stand.json`, `conference.json`, `workshop.json`, `salon.json`) :
    - libellés des puces, des groupes, des éléments du pied et des actions du rouage ;
    - aides de tri propres à l'écran ;
    - libellé d'accessibilité de la ligne (« Ouvrir la fiche de la participation »…).
- Reprends les libellés de la maquette mot pour mot.
- Pour les pluriels, suis la méthode déjà utilisée dans le projet.

---

## 10. Ordre de travail

1. **Socle partagé** (section 3) : barre d'outils et menu « Grouper et trier », groupes, ligne à lien étendu et rouage, fonctions de la section 2.3. Valide-le sur les **conférences**, puis sur les **ateliers** (rendu commun).
2. **Stands** : trois groupements, vue presse-papiers conservée.
3. **Back-end** : `ParticipationSummary` et `SalonSummary`, avec leurs tests d'intégration.
4. **Participations** : chargement des résumés, ligne et pied complets, rouage.
5. **Salons** : état calculé, résumés, rouage.
6. **Fonctionnalités conservées** (section 5), dont l'usage des listes sous une participation.
7. **Traductions**, puis relecture côte à côte avec la maquette, à 1 200 px et à 390 px.

## 11. Critères d'acceptation

- [ ] Les cinq listes partagent les mêmes composants (en-tête, menu « Grouper et trier », puces, groupes, ligne, pied, rouage), et un écran ne réécrit aucun de ces éléments.
- [ ] Le groupement et le tri ne prennent qu'un bouton icône à droite de la recherche. Son menu propose des boutons radio « Grouper par » et « Trier par », reste ouvert après un choix, et le bouton est mis en évidence quand un réglage n'est pas celui par défaut.
- [ ] Chaque liste peut être groupée par Statut ou par Alphabet, et les stands aussi par Catégorie. Grouper par Alphabet masque le tri redondant.
- [ ] Le tri par Date suit la date d'inscription (la date de début pour les salons). Alphabet trie sur le nom du thérapeute. Titre est proposé pour les conférences, les ateliers et les salons.
- [ ] Il n'y a plus de détail déplié ni de bouton « Voir ».
    - Un clic n'importe où sur la ligne ouvre la fiche existante. Ctrl+clic ouvre un nouvel onglet.
    - Entrée sur la ligne focalisée ouvre la fiche.
- [ ] Chaque ligne a un rouage en bas à droite de son pied. Son menu liste les actions de l'écran, avec Supprimer en dernier, en rouge, et l'ouvrir ne déclenche pas la navigation.
- [ ] Sur chaque liste, la ligne tient sur deux niveaux, statut en haut à droite, sans badge ni bordure de couleur.
- [ ] Aucun pied n'affiche de compteur à 0 ni d'information absente.
- [ ] Participations : le pied montre, quand ils existent, la facture, les stands, conférences et ateliers non nuls, coup de cœur, invité d'honneur, arrangement, offre et commentaire. Le rouage propose Fiche exposant, Facturation et Supprimer.
- [ ] Stands : le pied montre les 3 premiers tags, la dimension, « Partagé (co-exposant) » et le commentaire. Le rouage propose Participation et Supprimer.
- [ ] Conférences et ateliers : un seul composant de rendu, pied limité au commentaire. Le rouage propose Participation et Supprimer.
- [ ] Salons :
    - la ligne montre le nom, la référence et la période ;
    - le pied montre, quand elles existent, les inscriptions en ligne ouvertes, les dimensions, les participations, les conférences et les ateliers ;
    - le rouage propose Participations, Statistiques et Supprimer ;
    - les archivés sont repliés.
- [ ] Les statuts d'un même groupe de puces se combinent en OU, les signaux en ET, et les effectifs des puces sont justes.
- [ ] À 390 px de large : pas de défilement horizontal, la recherche et le bouton « Grouper et trier » restent sur une ligne, et les puces défilent.
- [ ] Toutes les fonctionnalités de la section 5 fonctionnent encore.