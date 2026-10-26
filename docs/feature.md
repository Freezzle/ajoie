# Refonte de la liste des factures (plans de facturation)

Ce document décrit le remplacement de l'écran `admin/invoicing-plan/list` par une liste bâtie sur le socle `shared/components/entity-list`, le même que celui des participations et des stands. Il est écrit pour être suivi pas à pas par un assistant de code.

Maquette de référence : artifact « Factures exposants, relevé du plan », proposition **1 · Trois cartes** (ouvrir dans un navigateur, basculer Ordinateur / Téléphone).

---

## 0. Règles à respecter

1. **Réutiliser le socle `entity-list`** : `entity-list-toolbar`, `entity-list-group`, `entity-row`, `entity-status`, `entity-count`, `entity-foot-item`, `entity-highlight`, `EntityListState` et les utilitaires de `entity-list.utils.ts`. Ne pas recréer de barre de recherche, de puces ni de groupes.
2. **Ne créer aucune nouvelle couleur.** Utiliser uniquement les variables `--app-*` de `content/scss/_variables.scss` (voir la table de la section 7). Aucun code hexadécimal dans les composants.
3. **Ne pas créer de nouvelle police.** Les montants utilisent la police du projet avec `font-variant-numeric: tabular-nums`.
4. **Styles globaux préfixés `el-`** dans `content/scss/_entity-list.scss`, comme le reste du socle (le contenu des lignes est projeté, l'encapsulation Angular ne le couvrirait pas). Les styles propres au détail d'un plan vont dans un nouveau bloc préfixé `el-ip-` (invoicing plan) du même fichier.
5. **Responsive par container query** `@container el (max-width: 720px)` et `(max-width: 560px)`, comme le socle. Pas de media query sur la largeur de la fenêtre.
6. **Textes en i18n** (`i18n/fr/invoicingPlan.json` et `common.json`, clé `entityList`). Aucun texte en dur dans les templates.
7. **Ne pas dupliquer la logique d'actions** de `billing.component.ts` : l'extraire dans un service partagé (section 5.4). L'écran `billing` est supprimé, la liste des factures le remplace.

---

## 1. Vue d'ensemble de l'écran

```
┌ Les factures                                   [←] [⋯]
│ Participation de Julien Theurillat ·            (sous-titre, si filtré)
├────────────────────────────────────────────────────────
│ [🔍 Exposant, n° de facture, stand…      ] [≡ Grouper et trier]
│ STATUT (À envoyer 5) (Envoyées 6) (Échues 4) (Payées 5) (Annulées 2) │ SIGNAUX (Postale) (Arrangement) (Relancée) (Prix modifié)
│
│ ▼ ■ Julien Theurillat  3        facturé 444.00 · payé 300.00 · reste 144.00 · brouillon 244.00
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (barre : part payée)
│ ┌───────────────────────────────────────────────────────┐
│ │ Facture 0127-1                               ● Échue  │
│ │ 🕑 échéance 12.10                       reste 144.00  │
│ │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ │ ≡ 3 lignes · ✉ · 🔔 1 rappel · 🏷                   ⚙ │
│ ├───────────────────────────────────────────────────────┤  ← clic sur la ligne = déplier
│ │ À relancer          [🔔 Envoyer un rappel] [+ Paiement]│  ← bande d'actions
│ ├───────────────────────────────────────────────────────┤
│ │  Générée   Envoyée   Échéance   Rappel  ●   Payée     │  ← frise, point doré = aujourd'hui
│ │    ●─────────●──────────●─────────●─────·┄┄┄┄○        │
│ │  01.09     12.09      12.10      16.10       —        │
│ │ ┌ LIGNES DE FACTURE 3 ─────────────────────── [+ Ligne]┐
│ │ │ Libellé                    Qté    Prix     Montant  │
│ │ │ Stand 3×2 m ⓘ               1   340.00     340.00   │
│ │ │ …                                                   │
│ │ │ Total                                      444.00   │
│ │ └─────────────────────────────────────────────────────┘
│ │ ┌ PAIEMENTS 1 ────────────────────────────────────────┐
│ │ │ Date        Mode       Commentaire        Montant   │
│ │ │ 30.09.2026  Virement   Acompte             300.00   │
│ │ │ Payé                                       300.00   │
│ │ └─────────────────────────────────────────────────────┘
│ │ ┌─────────────────────────────────────────────────────┐
│ │ │ Solde dû · échue depuis 13 j          CHF 144.00    │  ← ligne de solde
│ │ └─────────────────────────────────────────────────────┘
│ └───────────────────────────────────────────────────────┘
```

Aucune bordure colorée sur la carte d'un plan, ouverte ou non : la carte garde `--app-border`. Seuls le statut, la date clé et le solde portent la couleur.

---

## 2. Back-end : enrichir le DTO de liste

Fichiers : `service/dto/InvoicingPlanListDTO.java`, `service/mapper/InvoicingPlanMapper.java`, `service/InvoicingPlanService.java` (`findAllBySalonId`).

Ajouter à `InvoicingPlanListDTO` :

| Champ | Type | Source |
|---|---|---|
| `generationDate` | `Instant` | `InvoicingPlan.generationDate` |
| `issuedDate` | `Instant` | `InvoicingPlan.issuedDate` |
| `invoiceSendingMethod` | `InvoiceSendingMethod` | `InvoicingPlan.invoiceSendingMethod` |
| `needArrangement` | `Boolean` | `InvoicingPlan.needArrangement` |
| `hasCustomPrice` | `Boolean` | vrai si au moins une ligne a `customAmount != defaultAmount` |
| `reminderDates` | `List<Instant>` | table dédiée `invoicing_plan_reminder` (voir ci-dessous) |
| `lastPaymentDate` | `Instant` | date du paiement le plus récent, ou `null` |
| `cancelledDate` | `Instant` | facultatif ; sinon la frise affiche « Annulée » sans date |

Les champs directs se mappent par MapStruct (même nom). `hasCustomPrice` et `lastPaymentDate` passent par `@Mapping(expression = …)`, comme `nbInvoiceLines`.

**Dates de rappel.** Elles sont stockées dans une table dédiée `invoicing_plan_reminder` (`id`, `tenant_id`, `invoicing_plan_id`, `sent_date`), alimentée par `EmailInvoiceReminderHandler` à chaque envoi réussi. Dans `findAllBySalonId`, charger en **une seule requête** les rappels des plans du salon (`findByInvoicingPlanIdInOrderBySentDateAsc`) puis les grouper par plan. Pas de requête par plan.

> L'historique antérieur n'est pas repris : les plans existants affichent 0 rappel. Les `EventLog` de rappel restent écrits, mais ne servent plus de source de vérité.

Côté front, mettre à jour `IInvoicingPlanList` dans `admin/participation/model/invoicing-plan.interface.ts` avec les mêmes champs (`dayjs.Dayjs` pour les dates, conversion comme les autres services).

---

## 3. Routes : filtrer sur une participation

Suivre le modèle de `StandComponent` :

- `participation.routes.ts` : ajouter `{ path: ':idParticipation/invoicing-plans', children: invoicingPlanRoutes }` et rediriger `:idParticipation/billing` vers cette route (l'écran `BillingComponent` est supprimé).
- Le composant lit `idSalon` **et** `idParticipation` dans `paramMap`. Avec `idParticipation`, il filtre la liste du salon sur `participation.id` (côté client, pas de nouvel endpoint).
- Sous-titre de page : `entityList.context.participation` (« Participation de {{name}} »), comme les stands.
- Dans `participation.component.ts`, l'action de ligne « Facturation » (et le pied « factures ») pointe vers cette route.
- Dans la liste des factures, l'action du rouage « Voir uniquement cette participation » navigue vers la même route.

---

## 4. Liste : `InvoicingPlanListComponent`

Réécrire le composant sur le modèle de `participation.component.ts` (signaux, `computed`, `EntityListState`, `connectQueryParams`).

### 4.1 État

```ts
readonly state = new EntityListState({
  defaultGroupBy: GROUP_PARTICIPATION_KEY,   // 'participation'
  defaultSort: SORT_URGENCY_KEY,             // 'urgency'
  sortOptions: [
    {key: 'urgency', labelKey: 'invoicingPlan.list.sort.urgency', hintKey: 'invoicingPlan.list.sort.hint.urgency'},
    {key: SORT_DATE_KEY, labelKey: 'invoicingPlan.list.sort.number'},
    {key: SORT_ALPHA_KEY, labelKey: 'entityList.sort.alpha', hintKey: 'invoicingPlan.list.sort.hint.exhibitor'},
    {key: 'balance', labelKey: 'invoicingPlan.list.sort.balance'}
  ],
  collapsedByDefault: groupBy => groupBy === GROUP_STATUS_KEY ? ['PAID', 'CANCELLED'] : []
});
readonly groupOptions = [
  {key: 'participation', labelKey: 'invoicingPlan.list.group.participation'},
  {key: GROUP_STATUS_KEY, labelKey: 'entityList.group.status'},
  {key: 'due', labelKey: 'invoicingPlan.list.group.due'}
];
```

### 4.2 Règles métier (fonctions pures dans `invoicing-plan-helper.service.ts`)

- `isDraft(plan)` : `DRAFT` ou `ISOLATED`.
- `isExpired(plan)` : existe déjà (état `ISSUED` et échéance passée).
- `bucket(plan)` : `todo` (brouillons et `IS_ISSUING`), `late` (envoyée et échue), `wait` (envoyée), `PAID`, `CANCELLED`.
- `urgency(plan)` : nombre de jours avant l'échéance pour `ISSUED` (négatif si échue), 500 pour `todo`, 900 sinon. Le tri « Urgence » est croissant.
- `stateColor(plan)` : voir la table de la section 7. Remplace `getStateBadgeClass` pour cet écran.

### 4.3 Puces de filtre

Groupe « Statut » (mode `or`) : `todo` À envoyer, `wait` Envoyées, `late` Échues, `PAID` Payées, `CANCELLED` Annulées, chacune avec son point `stateColor`.

Groupe « Signaux » (mode `and`, masquées si effectif nul) :

| Clé | Libellé | Icône FA | Prédicat |
|---|---|---|---|
| `postal` | Postale | `envelope` | `invoiceSendingMethod === POSTAL` |
| `arrangement` | `entityList.signal.arrangement` | `handshake-simple` | `needArrangement` |
| `reminded` | Relancée | `bell` | `state === ISSUED && reminderDates.length > 0` |
| `customPrice` | Prix modifié | `tag` | `hasCustomPrice` |

Pas de puce « partiellement payée ».

Recherche (`matchesSearch`) sur : `billingNumber`, nom de l'exposant (`getExhibitorFullName`), `participation.therapistName`.

### 4.4 Groupes

- **Participation** (défaut) : un groupe par participation, construit à la main (pas `groupByKey`, l'ordre dépend des montants).
    - `label` = nom affiché de l'exposant ou du thérapeute, `rawLabel: true`.
    - Ordre : plus petite urgence des plans du groupe d'abord (les participations en retard en premier) ; tri alpha si le tri choisi est « Alphabet ».
    - `color` : `--app-status-refused` si un plan est échu, `--app-status-accepted` s'il reste un solde, `--app-text-muted` s'il n'y a que des brouillons, `--app-status-validated` sinon.
    - `ratio` = payé ÷ (facturé + brouillons), pour que la barre du groupe montre la part payée.
    - Résumé projeté `[groupSummary]` : `facturé 444.00 · payé 300.00 · reste 144.00 · brouillon 244.00` (le reste en `--app-danger` si échu, le brouillon seulement s'il existe).
    - Facturé = somme des plans hors brouillons et hors annulés ; payé = somme des `paidAmount` hors annulés ; reste = somme des soldes positifs des plans `ISSUED`.
- **Statut** : `groupByKey` avec l'ordre `late, todo, wait, PAID, CANCELLED`. Résumé : « reste x » (échues, en attente), « à facturer x » (brouillons), « encaissé x » (payées).
- **Échéance** : `late` Échues, `week` Échéance dans 7 jours, `later` Plus tard, `nodate` Pas encore envoyées, `closed` Soldées ou annulées.

Quand la liste est filtrée sur une participation (`idParticipation`), forcer l'affichage sans groupe participation (un seul groupe, ou le groupement par statut).

---

## 5. Ligne d'un plan

### 5.1 Faire évoluer `entity-row` (rétro-compatible)

Aujourd'hui `entity-row` exige un `link` et tout clic navigue. Ajouter un mode dépliable sans casser les autres écrans :

```ts
readonly link = input<unknown[] | null>(null);       // n'est plus required
readonly expandable = input<boolean>(false);
readonly expanded = model<boolean>(false);
```

- Si `expandable()` : le titre devient un `<button type="button" class="el-row-link">` avec `aria-expanded`, et un clic bascule `expanded`. Le pseudo-élément `::after` couvre toujours la carte.
- Nouveau slot `<ng-content select="[rowDetail]">`, rendu **après** le pied, seulement si `expanded()`, dans `<div class="el-row-detail">`. Ce conteneur a `position: relative; z-index: 1` pour passer au-dessus du lien étendu, et occupe `grid-column: 1 / -1`.
- Sinon, comportement actuel inchangé (`routerLink`).
- Ajouter le style `.el-row-detail` dans `_entity-list.scss` : marges négatives pour toucher les bords de la carte, fond `--app-surface-muted`, `border-top: 1px solid var(--app-border)`, coins bas arrondis.

Vérifier que la liste des participations, des stands, des salons et des tâches s'affiche toujours à l'identique.

### 5.2 Contenu de la ligne

```html
<entity-row [actions]="actionsFor(plan)" [expandable]="true" [(expanded)]="…">
  <span rowTitle>
    @if (groupedByParticipation()) { Facture <b>{{ plan.billingNumber }}</b> }
    @else { <span class="el-ip-num">{{ plan.billingNumber }}</span> <entity-highlight [text]="exhibitorName(plan)" [query]="state.query()"/> }
  </span>
  <entity-status rowStatus [color]="stateColor(plan)" [labelKey]="'invoicingPlan.state.' + plan.state"
                 [strikethrough]="plan.state === 'CANCELLED'"/>
  <ng-container rowMeta> <!-- une seule date, voir 5.3 --> </ng-container>
  <span rowSide> <!-- solde, voir 5.3 --> </span>
  <ng-container rowFoot> <!-- infos, voir 5.3 --> </ng-container>
  <invoicing-plan-detail rowDetail [planId]="plan.id" [participationId]="plan.participation.id"/>
</entity-row>
```

Pour un plan échu, le statut affiche « Échue » (`invoicingPlan.state.EXPIRED`, à ajouter) en `--app-status-refused`, au lieu de « Envoyée ».

### 5.3 En-tête et pied : le minimum

**Méta (sous le titre) : une seule date courte**, icône `clock`, sans phrase :

| État | Texte | Couleur |
|---|---|---|
| Brouillon | `créée 21.10` | `--app-text-muted` |
| En cours d'envoi | `envoi en cours` | `--app-status-accepted` |
| Envoyée | `échéance 05.11` | `--app-text` ; `--app-warn` si ≤ 7 jours |
| Échue | `échéance 12.10` | `--app-danger`, gras |
| Payée | `payée 24.09` | `--app-status-validated` |
| Annulée | `annulée 08.09` | `--app-text-muted` |

Ne pas écrire « échue depuis 13 j » dans l'en-tête. Format de date : `dd.MM`, l'année est implicite.

**Côté droit : le solde seul.** Brouillon : `à facturer 244.00`. Envoyée : `reste 144.00` (rouge si échue, vert `0.00` si soldée). Payée : `payée 444.00` en vert (ou `trop-perçu x` en `--app-warn`). Annulée : montant barré en `--app-text-muted`. Pas de total ni de payé dans l'en-tête.

**Pied : des icônes, du texte seulement pour les quantités.**

| Info | Rendu | Composant |
|---|---|---|
| Nombre de lignes | icône `list` + « 3 lignes » | `entity-count` |
| Envoi email / postal | icône `at` (email) / `envelope` (postal, comme dans billing) seule, `title` en tooltip | `entity-foot-item` sans `showLabel` |
| Arrangement | icône `handshake-simple` seule, couleur `--app-primary` | `entity-foot-item` |
| Rappels (si `ISSUED`) | icône `bell` + « 1 rappel », couleur `--app-warn` | `entity-count` |
| Prix modifié | icône `tag` seule, couleur `--app-warn` | `entity-foot-item` |

Rien pour un paiement partiel. Le rouage reste à droite.

Icônes : toutes sont déjà enregistrées dans `config/font-awesome-icons.ts` (`list`, `envelope`, `handshake-simple`, `bell`, `tag`, `clock`, `circle-info`) sauf `at` : ajouter `faAt` (import et `library.addIcons`).

### 5.4 Actions : extraire un service partagé

Créer `admin/invoicing-plan/service/invoicing-plan-actions.service.ts` en y déplaçant depuis `billing.component.ts` : `clickAction`, `openEmailPopup`, `handleBusinessAction`, `executeBusinessAction` et le téléchargement (`getFilenameFromContentDisposition`). Le service renvoie un `Observable<void>` qui se termine quand l'action est faite, pour que l'appelant recharge. `billing.component.ts` est ensuite supprimé.

**Rouage de la ligne (`actionsFor`)** : les `availableActions` du plan, **chargées à la demande** (première ouverture du rouage ou premier dépliage, mises en cache par plan ; un item « Chargement… » désactivé patiente), plus « Voir uniquement cette participation », « Fiche participation », « Fiche client » et « Historique » (`getEventLogs`). Calcul mis en cache dans un `computed`, comme `participation.component.ts`, pour éviter le double clic.

---

## 6. Détail d'un plan : `InvoicingPlanDetailComponent`

Nouveau composant standalone dans `admin/invoicing-plan/detail/`, `OnPush`, à base de signaux. Il est créé seulement quand la ligne est dépliée.

### 6.1 Données

- `participationService.getInvoicingPlans(participationId)` renvoie les `IInvoicingPlan` complets (lignes, paiements). Mettre la réponse en cache par participation dans le composant de liste, pour qu'ouvrir un deuxième plan de la même participation ne relance pas d'appel. Choisir le plan par `planId`.
- `actionsService.getAvailableActions('billing', planId)`.
- Après toute action ou modification : vider le cache de la participation, recharger la liste (montants et statut de la ligne) et le détail.

### 6.2 Structure (de haut en bas)

1. **Bande d'actions** `el-ip-band` : fond `--app-surface`, `border-bottom: 1px solid var(--app-border)`, collée aux bords du détail. À gauche, la prochaine étape en gras : « À envoyer », « À poster », « À relancer » (`--app-danger`), « Attendre le paiement », « À clôturer », « Réglée » (`--app-status-validated`). À droite, les actions principales (6.3) avec `button-box`. En dessous de 520 px, les boutons passent en pleine largeur.
2. **Frise** `el-ip-timeline` (6.4), sur toute la largeur.
3. **Carte « Lignes de facture »**.
4. **Carte « Paiements »**.
5. **Carte « Solde »** : une seule ligne.

Les trois cartes utilisent le même style : fond `--app-surface`, bordure `--app-border`, rayon 12 px, en-tête en petites capitales `--app-text-muted` avec un compteur, `thead` sur fond `--app-surface-muted`, pied de tableau sur fond `--app-surface-muted` en gras.

### 6.3 Actions principales par état

N'afficher une action que si elle figure dans `availableActions` et n'est pas `disabled`. Codes = `ContextActionType.code()`.

| État | Action 1 (bouton `primary`) | Action 2 |
|---|---|---|
| Brouillon, envoi email | `invoice-send` | `invoice-download` |
| Brouillon, envoi postal | `invoice-marked-as-issued` | `invoice-download` |
| En cours d'envoi | aucune | — |
| Envoyée, solde ≤ 0 | `invoice-marked-as-paid` | — |
| Échue | `invoice-reminder` (bouton `danger`) | Ajouter un paiement |
| Envoyée, dans les délais | Ajouter un paiement | `invoice-pay-all-cash` |
| Payée | `receipt-send` | `receipt-download` |
| Annulée | aucune | — |

« Ajouter un paiement » n'est pas une `AvailableAction` : il ouvre le `dialog-box` avec `app-payment-form` (comme `billing.component.ts` → `addPayment`), visible si l'état est `ISSUED` et que le plan n'est pas bloqué (`canMutatePlan`).

Toutes les autres actions restent dans le rouage de la ligne.

### 6.4 Frise des dates

Étapes, dans cet ordre puis triées par date (les étapes sans date restent à la fin) :

1. **Générée** : `generationDate`, toujours passée (`ok`).
2. **Envoyée** : `issuedDate` ; sans date, elle est l'étape en cours (`now`) pour un brouillon et affiche « — ».
3. **Rappel** : une étape par date de `reminderDates`, style `warn`.
4. **Échéance** : `expirationDate` ; `ok` si payée, `bad` si échue, `now` si envoyée ; « envoi + 30 j » pour un brouillon. Omise si annulée.
5. **Payée** (`lastPaymentDate`, `ok`), ou **Annulée** (`bad`).

Rendu : une grille de `N` colonnes égales (`minmax(58px, 1fr)`, défilement horizontal si trop étroit). Dans chaque colonne, **le nom de l'étape au-dessus du jalon, la date en dessous** (`dd.MM`). Les jalons sont des cercles de 14 px reliés par un trait de 2 px :

- trait vert `--app-status-validated` entre deux étapes passées ;
- trait rouge `--app-danger` après l'échéance quand le plan est échu ;
- trait pointillé `--app-border` vers une étape future.

Couleurs des jalons : `ok` plein `--app-status-validated` ; `now` cerclé `--app-status-accepted` avec un halo `--app-primary-soft` ; `bad` plein `--app-danger` (libellé et date en rouge) ; `warn` (rappel) plein `--app-warn` ; futur cerclé `--app-border`, texte `--app-text-muted`.

Sous 520 px : libellés en 11 px, colonnes de 54 px.

**Point « aujourd'hui »** (seulement pour brouillon, en cours d'envoi, envoyée) :

- Point de 12 px, couleur `--app-status-gold`, halo `--app-warn-soft`, **sans libellé** (`title` et `aria-label` « Aujourd'hui 25.10 »).
- Position : prendre `a` = dernière étape datée ≤ aujourd'hui, `b` = l'étape suivante. Centre d'une colonne `i` : `(i + 0.5) / N × 100 %`.
    - Si `b` est datée dans le futur : `f = (aujourd'hui − a) / (b − a)`, borné entre 0,22 et 0,78.
    - Sinon (aucune date connue après) : `f = 0,35`, c'est-à-dire juste après le dernier jalon, ce qui montre que le délai est dépassé.
    - `left = centre(a) + f × (centre(b) − centre(a))`.
- Un trait de progression part du centre de `a` jusqu'au point : `--app-danger` si échue, `--app-status-accepted` si envoyée dans les délais, `--app-text-muted` pour un brouillon.

### 6.5 Carte « Lignes de facture »

- En-tête : « Lignes de facture », compteur, et à droite « + Ligne » seulement si `showCreateInvoice` (brouillon, plan non bloqué).
- Colonnes : **Libellé**, **Qté**, **Prix**, **Montant**. Pas de colonne Type.
- Libellé : texte et, en petit `--app-text-muted`, le commentaire (`extraInformation`). Icône `circle-info` en `--app-warn` si `customAmount ≠ defaultAmount`, avec le tooltip existant `invoicingPlan.amount.different`.
- Montant = `quantity × customAmount`, en gras ; négatif en `--app-danger`.
- Pied : « Total » et la somme.
- Si `showInvoiceActions` : toute la ligne est cliquable (et activable au clavier avec Entrée) et ouvre le dialogue d'édition existant (`app-invoice-form`). La suppression (lignes `OTHERS` seulement) se fait depuis ce dialogue.
- Sous 560 px : Qté et Prix sont masqués et affichés sous le libellé (`2 × 22.00`).

### 6.6 Carte « Paiements »

- En-tête : « Paiements » et compteur. **Pas de bouton d'ajout** ici (l'ajout se fait depuis la bande d'actions).
- Colonnes : **Date** (`dd.MM.yyyy`), **Mode** (`payment.type.list.*`), **Commentaire**, **Montant** en `--app-status-validated`.
- Pied : « Payé » et la somme.
- Lignes cliquables si `showPaymentActions` : dialogue d'édition existant, avec la suppression.
- Brouillon : texte « Les paiements s'ajoutent une fois la facture envoyée. » ; envoyée sans paiement : « Aucun paiement reçu. »
- Sous 560 px : Mode et Commentaire passent sous la date.

### 6.7 Carte « Solde »

Une ligne de tableau, même style que les pieds de tableau mais un peu plus haute :

| Cas | Gauche (gras) + sous-texte | Droite | Fond |
|---|---|---|---|
| Brouillon | « À facturer » · « envoi par email » / « envoi par la poste » | `CHF 244.00` | `--app-surface-muted` |
| Envoyée | « Solde dû » · « échéance le 05.11.2026 » | `CHF 144.00` | `--app-surface-muted` |
| Échue | « Solde dû » · « échue depuis 13 j » | `CHF 144.00` en `--app-danger` | `--app-danger-soft` |
| Soldée / payée | « Soldé » · « payée le 24.09.2026 » | `0.00` en `--app-status-validated` | `--app-exit-soft` |
| Trop-perçu | « Trop-perçu » · « à rembourser » | montant en `--app-warn` | `--app-warn-soft` |
| Annulée | « Plan annulé » · « annulé le … » | « — » | `--app-surface-muted` |

---

## 7. Couleurs : uniquement les variables du projet

| Usage | Variable |
|---|---|
| Fond des cartes, de la bande d'actions | `--app-surface` |
| Fond du détail déplié, en-têtes et pieds de tableau | `--app-surface-muted` |
| Bordures, traits, jalons futurs | `--app-border` |
| Texte principal / secondaire | `--app-text` / `--app-text-muted` |
| Statut Brouillon, Brouillon isolé | `--app-text-muted` |
| Statut En cours d'envoi, Envoyée ; jalon « en cours » | `--app-status-accepted` (halo `--app-primary-soft`) |
| Statut Échue, retard, montant échu | `--app-danger` (texte) ; `--app-status-refused` (point de statut) ; fond `--app-danger-soft` |
| Statut Payée, paiements, jalons passés | `--app-status-validated` ; fond `--app-exit-soft` |
| Statut Annulée | `--app-status-canceled` (libellé barré) |
| Échéance ≤ 7 jours, rappels, prix modifié, trop-perçu | `--app-warn` ; fond `--app-warn-soft` |
| Arrangement | `--app-primary` |
| Point « aujourd'hui » | `--app-status-gold` |
| Bouton principal | `button-box` type `primary` ; « Envoyer un rappel » en type `danger` |
| Surlignage de recherche | `.el-mark` existant (`--app-warn-soft`) |
| Tailles de texte | `--app-fs-xs`, `--app-fs-sm`, `--app-fs-md` |

Si une teinte manque vraiment, la signaler en commentaire plutôt que d'en inventer une.

---

## 8. Traductions à ajouter (`i18n/fr/invoicingPlan.json`)

```json
"state": { "EXPIRED": "Échue" },
"list": {
  "searchPlaceholder": "Exposant, n° de facture, stand…",
  "group": { "participation": "Participation", "due": "Échéance" },
  "sort": { "urgency": "Urgence", "number": "N° de facture", "balance": "Solde",
            "hint": { "urgency": "échues puis échéances proches", "exhibitor": "nom de l'exposant" } },
  "statusGroup": { "late": "Échues", "todo": "À envoyer", "wait": "En attente de paiement", "PAID": "Payées", "CANCELLED": "Annulées" },
  "dueGroup": { "late": "Échues", "week": "Échéance dans 7 jours", "later": "Échéance plus tard", "nodate": "Pas encore envoyées", "closed": "Soldées ou annulées" },
  "chip": { "todo": "À envoyer", "wait": "Envoyées", "late": "Échues", "PAID": "Payées", "CANCELLED": "Annulées",
            "postal": "Postale", "reminded": "Relancée", "customPrice": "Prix modifié" },
  "summary": { "billed": "facturé", "paid": "payé", "left": "reste", "draft": "brouillon", "toInvoice": "à facturer", "cashed": "encaissé" },
  "meta": { "created": "créée {{date}}", "issuing": "envoi en cours", "due": "échéance {{date}}", "paid": "payée {{date}}", "cancelled": "annulée {{date}}" },
  "side": { "toInvoice": "à facturer", "left": "reste", "paid": "payée", "overpaid": "trop-perçu" },
  "foot": { "lineSingular": "ligne", "linePlural": "lignes", "reminderSingular": "rappel", "reminderPlural": "rappels",
            "email": "Envoi par email", "postal": "Envoi postal", "arrangement": "Plan avec arrangement", "customPrice": "Un prix diffère du prix par défaut" },
  "action": { "onlyThisParticipation": "Voir uniquement cette participation", "addPayment": "Ajouter un paiement" }
},
"detail": {
  "next": { "send": "À envoyer", "post": "À poster", "issuing": "Envoi en cours", "remind": "À relancer", "wait": "Attendre le paiement", "close": "À clôturer", "done": "Réglée", "none": "Rien à faire" },
  "timeline": { "generated": "Générée", "issued": "Envoyée", "reminder": "Rappel", "due": "Échéance", "paid": "Payée", "cancelled": "Annulée", "today": "Aujourd'hui {{date}}", "afterIssue": "envoi + 30 j" },
  "balance": { "toInvoice": "À facturer", "due": "Solde dû", "settled": "Soldé", "overpaid": "Trop-perçu", "cancelled": "Plan annulé",
               "byEmail": "envoi par email", "byPost": "envoi par la poste", "dueOn": "échéance le {{date}}",
               "lateSince": "échue depuis {{days}} j", "paidOn": "payée le {{date}}", "refund": "à rembourser", "cancelledOn": "annulé le {{date}}" },
  "payments": { "empty": "Aucun paiement reçu.", "notYet": "Les paiements s'ajoutent une fois la facture envoyée." },
  "columns": { "label": "Libellé", "qty": "Quantité", "price": "Prix", "amount": "Montant", "date": "Date", "mode": "Mode", "comment": "Commentaire" }
}
```

Réutiliser les clés existantes quand elles conviennent : `invoicingPlan.state.*`, `invoicingPlan.invoices.label`, `invoicingPlan.payments.label`, `invoicingPlan.header.*`, `invoicingPlan.amount.different`, `payment.type.list.*`, `entityList.*`.

---

## 9. Fichiers concernés

| Fichier | Changement |
|---|---|
| `java/.../service/dto/InvoicingPlanListDTO.java` | nouveaux champs (section 2) |
| `java/.../service/mapper/InvoicingPlanMapper.java` | mappings `hasCustomPrice`, `lastPaymentDate` |
| `java/.../service/InvoicingPlanService.java` | `reminderDates` en une requête, `findOne` |
| `java/.../domain/InvoicingPlanReminder.java` | **nouveau**, table dédiée des rappels |
| `java/.../repository/InvoicingPlanReminderRepository.java` | **nouveau** |
| `webapp/app/admin/invoicing-plan/model/invoicing-plan.interface.ts` | `IInvoicingPlanList` enrichi (déplacé) |
| `webapp/app/admin/invoicing-plan/service/invoicing-plan-helper.service.ts` | `bucket`, `urgency`, `stateColor`, `isDraft` (déplacé) |
| `webapp/app/admin/invoicing-plan/service/invoicing-plan-actions.service.ts` | **nouveau**, logique extraite de billing |
| `webapp/app/admin/participation/billing/billing.component.ts` | **supprimé** |
| `webapp/app/admin/participation/participation.routes.ts` | route `:idParticipation/invoicing-plans` |
| `webapp/app/admin/invoicing-plan/list/invoicing-plan-list.component.{ts,html}` | réécrits (section 4 et 5) |
| `webapp/app/admin/invoicing-plan/detail/invoicing-plan-detail.component.{ts,html}` | **nouveau** (section 6) |
| `webapp/app/shared/components/entity-list/entity-row.component.{ts,html}` | mode dépliable (5.1) |
| `webapp/content/scss/_entity-list.scss` | `.el-row-detail` et bloc `el-ip-*` |
| `webapp/i18n/fr/invoicingPlan.json` | clés (section 8) |

---

## 10. Critères d'acceptation

- [ ] La liste s'ouvre groupée par participation, triée par urgence ; les participations en retard sont en premier.
- [ ] Recherche, puces, « Grouper et trier » et groupes repliables fonctionnent comme dans la liste des participations, et l'état se retrouve dans l'URL (`?q=&group=&sort=&f=`).
- [ ] `…/participations/:id/invoicing-plans` affiche seulement les plans de cette participation, avec le sous-titre « Participation de … ».
- [ ] En-tête d'un plan : n° (et exposant si non groupé), statut en haut à droite, **une** date courte, le solde. Pied : icônes seules, sauf « n lignes » et « n rappels ». Rien pour un paiement partiel.
- [ ] Aucune bordure colorée sur la carte d'un plan, ouverte ou fermée.
- [ ] Le clic sur la ligne la déplie ; le rouage ouvre toujours le menu sans déplier.
- [ ] Dans le détail : bande d'actions séparée, frise (noms au-dessus, dates dessous, point doré sans libellé bien placé), trois cartes Lignes, Paiements, Solde.
- [ ] Les actions principales suivent la table 6.3 et n'apparaissent que si le serveur les autorise.
- [ ] Après une action, la ligne (statut, date, solde, pied) et le détail se mettent à jour.
- [ ] Lisible à 360 px de large : aucun défilement horizontal de la page (seule la frise peut défiler si nécessaire).
- [ ] Aucune couleur en dur : `grep -nE "#[0-9a-fA-F]{3,6}"` sur les nouveaux fichiers ne renvoie rien.
- [ ] L'écran de facturation de la participation n'existe plus : son URL redirige vers la liste filtrée.
- [ ] Les listes participations, stands, salons et tâches s'affichent comme avant (`entity-row` rétro-compatible).