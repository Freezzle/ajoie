# Tableau de bord du salon (remplace l'écran « Statistiques »)

Ce document est une spécification pour GitHub Copilot. Il décrit comment remplacer l'écran actuel des statistiques d'un salon par un **tableau de bord** et un **catalogue de métriques**.

| | |
|---|---|
| Écran remplacé | `src/main/webapp/app/admin/salon/stats/` (`SalonStatsComponent`) |
| Route (inchangée) | `admin/salons/:idSalon/stats` |
| Accès (inchangé) | action « Statistiques » du menu d'un salon (`salon.component.ts`) |

La référence visuelle est la maquette **`docs/dashboard-salon.maquette.html`**, à ouvrir dans un navigateur :
- les deux onglets du haut correspondent aux deux vues (tableau de bord et `?view=catalogue`) ;
- le sélecteur **Aperçu** bascule entre **Ordinateur** et **Mobile** : les deux affichages sont à reproduire ;
- le sélecteur **Montants** simule le mode « masquer les informations sensibles » ;
- un clic sur un lien affiche en bas de l'écran la destination prévue (liste, filtre) au lieu de naviguer ;
- les chiffres sont fictifs.

La maquette suit ce document. **En cas de différence, ce document fait foi**, en particulier pour les couleurs : la maquette utilise sa propre palette, l'application doit utiliser les variables `--app-*` (section 1).

> **Copilot, lis d'abord le projet.** Avant d'écrire du code, parcours :
> - **Côté front :**
>   - l'écran actuel `admin/salon/stats/*`, `salon.service.ts` (`stats`, `getPlanningTalks`), `salon-stats.interface.ts` ;
>   - `participation.service.ts` (`query`) et `participation/list/participation.component.ts` (prédicats des puces) ;
>   - `shared/components/entity-list/` (`entity-list-state.ts` : paramètres `?f=` / `?group=` / `?sort=`, `entity-list.status.ts` : clés `st_*`) ;
>   - `task/list/task-focus-list.component.ts`, `task/shared/task-urgency.utils.ts` (`isLate`, `daysLeft`, `isActive`, `countSubtasks`) ;
>   - `volunteer-planning/` (`dayStats`, le store et sa conversion du DTO) ;
>   - `talks-planning/update/talks-planning-model.ts` ;
>   - `floor-plan/floor-plan.model.ts`, `floor-plan/service/floor-plan.service.ts` ;
>   - `layouts/navbar/navigation-state.service.ts` (`hideSensibleInformation`) ;
>   - `shared/components/menu-box`, `content-page`, `card`, `button-box` ;
>   - `content/scss/_variables.scss` et `i18n/fr/*.json`.
> - **Côté back :**
>   - `AdminSalonResource` (`/{idSalon}/stats`) et `SalonService.getStatistiques` ;
>   - les entités `Participation`, `Exhibitor`, `InvoicingPlan`, `Invoice`, `Payment`, `Stand`, `Conference`, `Workshop`, `EventLog` ;
>   - les handlers de `service/handlers/impl/participation/`.
>
> Partout où ce document décrit un bouton, un menu, une couleur ou un libellé, **reprends ce qui existe déjà**. Ne crée quelque chose que s'il n'y a vraiment pas d'équivalent.

---

## 0. Périmètre strict

### 0.1 À faire, et rien d'autre

1. **Chronologie** des inscriptions et des montants payés (section 3).
2. **À traiter** : cinq compteurs qui ouvrent la bonne liste avec le bon filtre (section 4).
3. **Mes indicateurs** : des cartes de métriques que l'on peut ajouter et retirer, regroupées en zones par thème (section 5).
4. **Catalogue de métriques** : toutes les métriques disponibles, à afficher ou masquer dans « Mes indicateurs » (section 6).
5. **Bascule** entre le tableau de bord et le catalogue, par une action du menu d'actions de la page (section 2.2).
6. **Les 17 métriques** de la section 7, et seulement celles-là.

### 0.2 À ne pas faire

- Pas de « par semaine en moyenne » dans la chronologie.
- Pas de ligne « aujourd'hui » ni de marqueurs de date (clôture, salon) dans les graphiques.
- Pas de carte « État actuel », « Catégories » ou « Dimensions » hors de « Mes indicateurs ». Ce sont des métriques comme les autres (section 7).
- Pas de « Statuts par type », pas de « Parcours ».
- Dans le catalogue :
  - pas de badge « nouveau » ;
  - pas de badge « Données existantes » / « À calculer côté back ».
- Aucune autre métrique que celles de la section 7 :
  - pas de motifs de refus, de moyens de paiement ou de provenance ;
  - pas d'occupation des salles, de tâches par responsable ou de fiches complètes.
- Pas d'action « Rafraîchir » ni « Exporter en PDF » dans le menu.
- Pas de nouvelle dépendance npm, pas de librairie de graphiques. Les graphiques sont en SVG écrit à la main.
- Pas de changement aux autres écrans, sauf les ajouts de puces de filtre décrits en section 4.2.

### 0.3 Ce qui reste comme aujourd'hui

- La carte **« Importation d'un Google Forms »** (`p-fileupload`, `importFile`) reste en bas du tableau de bord, telle quelle. Après un import, recharge les données du tableau de bord.
- Le bouton **Retour** (`previousState`) et le titre `salon.statistiques`.
- Le mode **« masquer les informations sensibles »** (`navigationService.hideSensibleInformation()`) :
  - tout montant en CHF est remplacé par `•••` ;
  - le graphique des montants payés est remplacé par un encart « Montants masqués ».

---

## 1. Règles d'implémentation

1. **Style du code existant :**
  - composants standalone, `ChangeDetectionStrategy.OnPush` ;
  - `signal` / `computed` / `input`, `inject()` ;
  - `@if` / `@for` avec `track`.
2. **Logique pure dans des fichiers à part, avec leurs tests :**
  - `salon-dashboard.utils.ts` : calcul des séries de la chronologie, des compteurs « à traiter » et de chaque métrique ;
  - `salon-dashboard.metrics.ts` : le catalogue (définitions des métriques).

   Les composants ne font qu'afficher.
3. **Couleurs :** uniquement les variables du thème (`--app-*`), aucune couleur en dur. Les statuts utilisent `--app-status-*`.
4. **Traductions :** `jhiTranslate` / pipe `translate`.
  - Les nouvelles clés vont sous `salon.dashboard.*` dans `i18n/fr/salon.json`.
  - Pour les statuts, réutilise les libellés existants `participation|stand|conference|workshop.list.statusGroup.*`. Ils ont déjà le bon genre et le pluriel.
5. **Montants :** pipe `currency : 'CHF'` comme aujourd'hui.
6. **Pas de nouvelle requête inutile.** Réutilise les services existants (section 8). Un seul endpoint back est ajouté (section 9).

---

## 2. Structure de l'écran

### 2.1 Vues

Le même composant affiche deux vues, conservées dans l'URL avec `?view=`, comme `task-focus-list` le fait déjà :

| `?view=` | Vue |
|---|---|
| absent | Tableau de bord |
| `catalogue` | Catalogue de métriques |

### 2.2 En-tête (`app-content-page`)

- **`appMenuBarStart` :**
  - le titre actuel `salon.statistiques` ;
  - dessous, en petit et en gris : `{lieu du salon} · {dates du salon}`.
- **`appMenuBarEnd`, de gauche à droite :**
  1. le bouton **Retour** actuel ;
  2. **tout à droite**, un `menu-box` identique à celui de `task-focus-list.component.html` (`buttonIcon="pi-list"`, `buttonTranslateKey="common.actions"`).

     Il contient **une seule action**, qui change selon la vue :

| Vue affichée | Libellé | Icône | Effet |
|---|---|---|---|
| Tableau de bord | « Aller sur le catalogue » | `pi pi-th-large` | `?view=catalogue` |
| Catalogue | « Aller sur le tableau de bord » | `pi pi-chart-bar` | retire `view` |

Les liens « Ajouter ou retirer » et « + Ajouter » de « Mes indicateurs » (section 5) mènent aussi au catalogue.

### 2.3 Tableau de bord, mise en page

Grille de 12 colonnes, écart 14 px.

| Rangée | Contenu | Ordinateur | Mobile (≤ 720 px) |
|---|---|---|---|
| 1 | Chronologie | 8 colonnes | 12 |
| 1 | À traiter | 4 colonnes | 12, sous la chronologie |
| 2 | Mes indicateurs (titre + zones) | 12 | 12 |
| 3 | Importation d'un Google Forms (existant) | 12 | 12 |

---

## 3. Chronologie

Une carte, titre **« Chronologie »**. Sous-titre en gris : « du {première date} au {dernière date} · de la première à la dernière inscription ou paiement ».

### 3.1 Période

La période **ne dépend pas de la date du jour** :
- **Début :** la plus ancienne date parmi les dates d'inscription des participations et les dates des paiements.
- **Fin :** la plus récente de ces mêmes dates.
- Les données sont regroupées **par semaine**, du lundi au dimanche, de la semaine de début à la semaine de fin.
- S'il n'y a aucune date, la carte affiche « Pas encore d'inscription ni de paiement ».

### 3.2 Deux graphiques empilés, même axe horizontal

1. **Inscriptions** :
  - en-tête « Inscriptions », puis en gris « {n} au total » ;
  - courbe **cumulée** du nombre d'inscriptions par semaine ;
  - **toutes** les participations du salon qui ont une `registrationDate`, quel que soit leur statut ;
  - pas de libellés de mois sous ce graphique.
2. **Montants payés** :
  - en-tête « Montants payés », puis en gris « {payé} sur {attendu} · {%} » ;
  - courbe **cumulée** des paiements par semaine ;
  - **ligne horizontale en pointillés** au niveau du montant attendu, libellée « attendu {montant} » ;
  - libellés de mois sous l'axe ;
  - masqué en mode discret (section 0.3).

### 3.3 Tracé (identique à la maquette)

- **SVG** avec `viewBox`, largeur 100 %. Hauteur 150 px pour les inscriptions et 170 px pour les paiements, ou 190 px pour chacun sur mobile.
- **Grille horizontale** légère. Graduations de l'axe Y : pas de 5 ou 10 pour les inscriptions, de 1 000 ou 2 500 pour les montants (affichés « 2,5 k »).
- **Ligne :** épaisseur 2,25. Aire dessous remplie à 11 % de la couleur de la ligne.
  - Inscriptions : `--app-accent`.
  - Paiements : `--app-status-validated`.
- **Dernier point :** un rond, avec sa valeur juste au-dessus à gauche.
- **Survol synchronisé** des deux graphiques. Une ligne verticale et un point suivent la souris sur chacun. Une seule info-bulle :
  > **Semaine du {date}**
  > Inscriptions cumulées : **{n}**
  > Montants payés cumulés : **{CHF}**

### 3.4 Chiffres sous les graphiques

Trois chiffres, séparés des graphiques par un trait :

| Chiffre | Source | Mode discret |
|---|---|---|
| **{n}** inscriptions | toutes les participations datées | affiché |
| **{payé}** payés | `facturation.paid` des participations confirmées (`stats` existant, statuts `ACCEPTED`, `VALIDATED`, `CLOSED`) | `•••` |
| **{restant}** restant à payer | `facturation.remaining`, même source | `•••` |

---

## 4. À traiter

Une carte, titre **« À traiter »**, sous-titre « chaque ligne ouvre la liste filtrée ».

### 4.1 Les cinq lignes

Chaque ligne est un bouton qui contient :
- à gauche, le **nombre**, gros et dans la couleur indiquée ;
- au milieu, le **libellé** et, dessous en petit, le **détail** ;
- à droite, un chevron.

Quand le nombre vaut 0, il s'affiche en gris (`--app-text-muted`). Les lignes « critiques » ont une bordure teintée de `--app-danger` quand le nombre est supérieur à 0.

| # | Libellé | Ce qui est compté | Détail | Couleur | Critique | Ouvre |
|---|---|---|---|---|---|---|
| 1 | Participations à vérifier | participations au statut `IN_VERIFICATION` | « statut à vérifier » | `--app-status-verification` | non | `admin/salons/:idSalon/participations?f=st_IN_VERIFICATION` |
| 2 | Participations à facturer | participations avec **au moins un brouillon** (`nbDraft > 0`) | « {n} brouillons au total » (somme des `nbDraft`) | `--app-status-accepted` | non | `…/participations?f=hasDraft` |
| 3 | Participations à surveiller | participations dont l'exposant est **bloqué** (`exhibitor.redFlag`) **ou** en **double** (`exhibitor.duplicateDetected`) **ou** qui ont une **facture en retard** (`nbExpired > 0`) | « {a} bloquées · {b} en double · {c} factures en retard » (n'affiche que les parties non nulles) | `--app-danger` | oui | `…/participations?f=toWatch` |
| 4 | Tâches en retard | sous-tâches actives en retard (`isLate`) | titres des sous-tâches concernées, séparés par « · », tronqués à 2 lignes | `--app-danger` | oui | `admin/salons/:idSalon/tasks?view=subtasks&f=late` |
| 5 | Prochaines tâches | sous-tâches actives (`isActive`) dont l'échéance effective tombe **aujourd'hui ou dans les 14 prochains jours** (`0 ≤ daysLeft ≤ 14`) | « dans les 2 semaines · {responsables} » (dédoublonnés, `ownerOf`) | `--app-status-accepted` | non | `…/tasks?view=subtasks&f=next14` |

Navigation : `routerLink` relatif (`['..', 'participations']`, `['..', 'tasks']`) avec `queryParams`. Les listes lisent déjà `?f=` grâce à `EntityListState.connectQueryParams`.

### 4.2 Puces de filtre à vérifier ou à ajouter

Vérifie d'abord ce qui existe. Les clés `st_IN_VERIFICATION` (participations) et `late` (tâches) existent déjà. Les trois suivantes ne correspondent à aucune puce existante.

> Attention : la puce existante `toInvoice` (« À facturer ») compte les participations actives **sans aucune facture**. Ce n'est pas la même chose que « au moins un brouillon ». Ne la modifie pas.

Ajoute uniquement les trois puces suivantes, dans le groupe `signals` de chaque liste.

**Participations :**
- `hasDraft`
  - prédicat : `p => p.nbDraft > 0` ;
  - libellé : `entityList.signal.hasDraft` = « Facture en brouillon » ;
  - icône `file-invoice`, couleur `var(--app-status-verification)`.
- `toWatch`
  - prédicat : `p => !!p.exhibitor?.redFlag || !!p.exhibitor?.duplicateDetected || p.nbExpired > 0` ;
  - libellé : `entityList.signal.toWatch` = « À surveiller » ;
  - icône `triangle-exclamation`, couleur `var(--app-danger)`.

**Tâches :**
- `next14`
  - prédicat : `s => isActive(s) && daysLeft(s) !== null && daysLeft(s)! >= 0 && daysLeft(s)! <= 14` ;
  - libellé : `task.chip.next14` = « 2 prochaines semaines ».

**Les prédicats sont écrits une seule fois**, dans une fonction exportée, et utilisés à la fois par la liste et par le tableau de bord. Les compteurs du tableau de bord et ceux des listes ne doivent jamais différer.

---

## 5. Mes indicateurs (zones par thème)

### 5.1 Titre de section

En dehors des cartes, sur une ligne :
- **« Mes indicateurs »** (police d'affichage, 18 px) ;
- en gris : « {n} choisis, regroupés par thème » ;
- tout à droite, le lien « Ajouter ou retirer → », qui ouvre le catalogue.

### 5.2 Zones

Les métriques choisies sont **regroupées par thème**, dans cet ordre :

| Thème | Clé (`?theme=`) | Icône (FontAwesome) |
|---|---|---|
| Participations | `participations` | `users` |
| Facturation | `billing` | `file-invoice` |
| Stands | `stands` | `store` |
| Programme et logistique | `logistics` | `calendar-days` |

Chaque zone est un bloc :
- fond `--app-surface-muted`, bordure `--app-line`, rayon 16 px, marge intérieure 12 px ;
- **en-tête** :
  - une pastille carrée de 26 px (fond blanc, bordure, icône `--app-accent`) ;
  - le nom du thème en gras ;
  - « {n} indicateur(s) » en gris ;
  - tout à droite, le lien **« + Ajouter »**, qui ouvre le catalogue **filtré sur ce thème** (`?view=catalogue&theme={clé}`) ;
- **dessous** : les cartes des métriques, sur une grille interne.

Une zone sans métrique choisie **n'est pas affichée**.

**Largeur des zones :**

| Métriques dans la zone | Largeur de la zone | Colonnes internes |
|---|---|---|
| 1 | 6 / 12 | 1 |
| 2 | 6 / 12 | 2 |
| 3 | 12 / 12 | 3 |
| 4 ou plus | 12 / 12 | 4 (retour à la ligne au-delà) |

La grille de la page utilise `grid-auto-flow: row dense`. Deux petites zones peuvent ainsi se placer côte à côte, même si une grande zone se trouve entre elles dans l'ordre des thèmes.

Si **aucune** métrique n'est choisie, une seule carte en pointillés pleine largeur s'affiche : « + Ajouter un indicateur · {n} disponibles ». Elle ouvre le catalogue.

### 5.3 Carte de métrique dans une zone

- Pas de libellé de thème : la zone le donne déjà.
- **Titre** (14 px, gras). Un bouton **×** est placé en haut à droite, en position absolue, avec `aria-label` « Retirer {titre} ». Le titre garde 26 px de marge à droite pour ne pas passer sous le ×.
- **Valeur principale** (police d'affichage, ~28 px, gras). Elle est en `--app-warn` quand la métrique est « en alerte » (section 7).
- **Sous-titre** gris (12.5 px).
- **Visualisation**, selon la métrique :
  - **barre 100 %** : deux ou trois segments, avec une légende « libellé **valeur** » ;
  - **barres horizontales** : une ligne par élément (libellé, barre, valeur) ;
  - **barres de statut** : voir État actuel, section 7.1.
- Clic sur × : la métrique est retirée immédiatement. Si la zone devient vide, elle disparaît.

### 5.4 Mémorisation du choix

- La liste des identifiants choisis est enregistrée dans `localStorage` sous la clé `salon-dashboard.metrics`. Elle est commune à tous les salons.
- Lecture et écriture sont entourées de `try/catch`. Les identifiants inconnus sont ignorés.
- **Choix par défaut**, si rien n'est enregistré ou si la lecture échoue : `status`, `categories`, `dimensions`, `billingProgress`.

### 5.5 CSS de référence

À placer dans `salon-stats.component.scss`. Adapte les noms de variables à `_variables.scss` si une variable n'existe pas sous ce nom.

```scss
.dash-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; grid-auto-flow: row dense; }
.c4 { grid-column: span 4; } .c6 { grid-column: span 6; } .c8 { grid-column: span 8; } .c12 { grid-column: span 12; }

.section-head { grid-column: span 12; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-top: 6px;
  h3 { margin: 0; font-size: 18px; }
  .link { margin-left: auto; font-size: 12.5px; font-weight: 700; color: var(--app-accent); }
}

/* Zone d'un thème */
.zone { background: var(--app-surface-muted); border: 1px solid var(--app-line); border-radius: 16px;
        padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.zone-head { display: flex; align-items: center; gap: 8px; padding: 0 4px;
  h4 { margin: 0; font-size: 14.5px; font-weight: 700; }
  .count { color: var(--app-text-muted); font-size: 13px; }
  .link { margin-left: auto; font-size: 12.5px; font-weight: 700; color: var(--app-accent); background: none; border: 0; padding: 0; }
}
.zone-icon { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center;
             background: var(--app-surface); border: 1px solid var(--app-line); color: var(--app-accent); font-size: 13px; }
.zone-grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 10px; flex: 1; }

/* Carte de métrique */
.metric { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 14px 16px;
          background: var(--app-surface); border: 1px solid var(--app-line); border-radius: 12px; }
.metric h4 { margin: 0; padding-right: 26px; font-size: 14px; font-weight: 700; }
.metric .value { font-size: 28px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric .value.warn { color: var(--app-warn); }
.metric .sub { font-size: 12.5px; color: var(--app-text-muted); }
.metric .remove { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border: 0;
                  background: none; color: var(--app-text-muted); border-radius: 6px; }
.metric .remove:hover { background: var(--app-surface-muted); color: var(--app-text); }

/* Barre 100 % */
.stack { display: flex; gap: 2px; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 4px; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--app-text-muted);
  i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; margin-right: 6px; }
  b { color: var(--app-text); }
}

/* Barres horizontales */
.bars { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; }
.bar  { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 10px; align-items: center;
  .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track i { display: block; height: 8px; border-radius: 0 4px 4px 0; background: var(--app-accent); }
  .val { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
  .val small { font-weight: 500; color: var(--app-text-muted); margin-left: 3px; }
}

/* Carte « + Ajouter un indicateur » (aucune métrique choisie) */
.add-metric { grid-column: span 12; min-height: 120px; border: 1.5px dashed var(--app-border); border-radius: 12px;
              background: none; color: var(--app-text-muted); display: flex; flex-direction: column;
              align-items: center; justify-content: center; gap: 2px; }
.add-metric:hover { border-color: var(--app-accent); color: var(--app-accent); }

@media (max-width: 720px) {
  .c4, .c6, .c8 { grid-column: span 12; }
  .zone-grid { grid-template-columns: minmax(0, 1fr); }
}
```

---

## 6. Catalogue de métriques (`?view=catalogue`)

- **En-tête de la vue :**
  - titre « Catalogue de métriques » ;
  - sous-titre « Choisissez celles qui s'affichent dans « Mes indicateurs ». {n} sur 17 affichées. » ;
  - à droite, un sélecteur segmenté : **Toutes · Participations · Facturation · Stands · Programme et logistique**. Il est initialisé par `?theme=` quand on arrive par un « + Ajouter ».
- **Une section par thème**, dans l'ordre de la section 5.2 : libellé du thème en petites capitales grises, puis une grille de cartes (4 colonnes sur ordinateur, 2 sur tablette, 1 sur mobile).
- **Chaque carte** reprend la carte de la section 5.3, avec ces différences :
  - le **thème** est rappelé en haut, en petites capitales grises ;
  - **pas de ×** ;
  - un **pied** sous un trait pointillé, avec à droite un bouton bascule :
    - « + Ajouter » (secondaire) si la métrique n'est pas affichée ;
    - « ✓ Affiché » (primaire, fond `--app-accent`) si elle l'est ;
  - quand elle est affichée, la carte a une bordure `--app-accent`.
- Le bouton met à jour le même choix que « Mes indicateurs » (section 5.4).
- Les cartes montrent les **vraies valeurs** du salon.

---

## 7. Les 17 métriques

Libellés : clés `salon.dashboard.metric.{id}.title` et `.sub`.

**Statuts confirmés = `ACCEPTED`, `VALIDATED`, `CLOSED`**, comme le `stats` actuel. Le « payé » demandé correspond aux participations validées : il n'existe pas de statut « payé ».

### Thème Participations

#### 7.1 `status` : État actuel

- **Sélecteur segmenté** sous le titre, sur toute la largeur de la carte : **Particip. · Stands · Conf. · Ateliers**. Le libellé complet est dans `title`. Choix par défaut : participations.
- **Six lignes**, une par statut : `IN_VERIFICATION`, `ACCEPTED`, `VALIDATED`, `CLOSED`, `REFUSED`, `CANCELED`.
- **Chaque ligne contient :**
  - une pastille de couleur et le libellé du statut (`{type}.list.statusGroup.{STATUT}`, accordé selon le type) ;
  - une barre dont la longueur est proportionnelle au plus grand nombre ;
  - le nombre, puis le pourcentage en petit et en gris.
- **Couleurs :** `--app-status-verification | accepted | validated | closed | refused | canceled`.
  - La barre et la pastille « Annulé » sont **hachurées** (`repeating-linear-gradient(135deg, …)`), pour les distinguer de « Clôturé », dont le gris est proche.
- **Ligne à 0 :** opacité 0.5.
- **Ligne cliquable :** elle ouvre la liste du type, filtrée :
  - `?f=st_{STATUT}` pour les quatre premiers statuts ;
  - `?f=st_OUT` pour Refusé et Annulé, qui sont regroupés dans les listes.
  - Destinations : `participations`, `stands`, `conferences`, `workshops`.
- **Sous les lignes :** « Actives **{n}** · Écartées **{n}** » (au masculin pour stands et ateliers).
- **Valeur principale :** pas de grosse valeur ; le sous-titre est « {total} {type} ».
- **Données :**
  - participations : `participationService.query` ;
  - stands, conférences, ateliers : `statusCounts` de l'endpoint de la section 9.

#### 7.2 `loyalty` : Nouveaux et fidèles

- **Valeur :** « {n} fidèles ».
- **Sous-titre :** « {m} nouveaux exposants cette année ».
- **Visualisation :** barre 100 % « Déjà venus / Nouveaux ».
- **Calcul :** sur les participations **actives** (ni refusées ni annulées).
  - Un exposant est **fidèle** s'il a au moins une participation confirmée dans un **autre salon dont la date de début est antérieure**.
  - Sinon, il est **nouveau**.
- **Source :** back, section 9.

#### 7.3 `channel` : Canal d'inscription

- **Valeur :** « {n} en ligne ».
- **Sous-titre :** « {m} par l'admin ».
- **Visualisation :** barre 100 % « En ligne / Par l'admin ».
- **Calcul :** toutes les participations du salon. `publicRegistration === true` compte « en ligne », sinon « par l'admin ».
- **Source :** `participationService.query`.

#### 7.4 `verificationDelay` : Délai de vérification (nouvelle)

- **Valeur :** « {médiane} j ».
- **Sous-titre :** « médiane entre l'inscription et l'acceptation ou le refus ».
- **Visualisation :** barres horizontales « < 1 sem. · 1–2 sem. · 2–4 sem. · > 4 sem. » (nombre de participations).
- **Calcul :** pour chaque participation sortie de `IN_VERIFICATION`, le nombre de jours entre `registrationDate` et la **première décision**.
  - La première décision est le premier `EventLog` de la participation (`EntityType.PARTICIPATION`, `EventType.ACTION`) dont le libellé est « Participation acceptée » (`ActionAcceptHandler`), « Participation annulée » (`ActionCancelHandler`) ou « Participation refusée ».
  - Les participations sans date d'inscription ou sans décision trouvée sont ignorées.
- **Le passage au statut `REFUSED` n'écrit aucun `EventLog` aujourd'hui** :
  - repère l'endroit où ce statut est appliqué ;
  - ajoute au même endroit `eventLogService.eventFromSystem("Participation refusée", EventType.ACTION, EntityType.PARTICIPATION, id, Map.of("old_status", …))`, comme les autres handlers ;
  - c'est la seule modification de comportement côté back en dehors du nouvel endpoint.
- **Source :** back, section 9. Calcule-le comme le délai de paiement (même découpage, même médiane).

### Thème Facturation

Toutes les métriques de ce thème portent sur les **plans de facturation non annulés** (`State != CANCELLED`). Leurs montants suivent le mode discret.

#### 7.5 `revenueByService` : Recettes par prestation

- **Valeur :** le total en CHF.
- **Sous-titre :** « participations acceptées, validées et clôturées ».
- **Visualisation :** barres horizontales par type de ligne. Les types (`Type`) sont regroupés ainsi :
  - Stands : `STAND` ;
  - Partages : `SHARED` ;
  - Conférences : `CONFERENCE` ;
  - Ateliers : `WORKSHOP` ;
  - Repas : `MEAL1` + `MEAL2` + `MEAL3` ;
  - Électricité : `ELECTRICITY` ;
  - Frais de port : `POSTAL_FEE` ;
  - Autres : `OTHERS`.

  Les types à 0 sont masqués et les lignes sont triées par montant décroissant.
- **Calcul :** somme des lignes `InvoiceNature.SERVICE` des participations confirmées.
- **Source :** back.

#### 7.6 `discounts` : Réductions accordées

- **Valeur :** le montant en CHF.
- **Sous-titre :** « {x} % du total des prestations ».
- **Visualisation :** aucune.
- **Calcul :** `facturation.discount / facturation.total` du `stats` existant (participations confirmées). Le mode discret masque valeur et pourcentage.

#### 7.7 `paymentDelay` : Délai de paiement

- **Valeur :** « {médiane} j ».
- **Sous-titre :** « médiane entre l'émission et le paiement ».
- **Visualisation :** barres horizontales « < 10 j · 10–30 j · > 30 j » (nombre de plans).
- **Calcul :** pour chaque plan `PAID`, le nombre de jours entre `issuedDate` et la date (`billingDate`) du **dernier** paiement.
- **Source :** back.

#### 7.8 `mealPayment` : Paiement des repas

- **Valeur :** « {n} avec la facture ».
- **Sous-titre :** « {m} directement sur place ».
- **Visualisation :** barre 100 %. Libellés `participation.modePaymentMeals.MIXED` et `.SEPARATE`.
- **Calcul :** participations actives qui ont au moins un repas (`nbMeal1 + nbMeal2 + nbMeal3 > 0`), comptées selon `modePaymentMeals`.
- **Source :** `participationService.query`.

#### 7.9 `billingProgress` : Avancement de la facturation

- **Valeur :** « {payés} / {total} ».
- **Sous-titre :** « factures payées ».
- **Visualisation :** barres horizontales :
  - **Brouillon** : `DRAFT`, `ISOLATED` ;
  - **Émise** : `IS_ISSUING`, ou `ISSUED` sans aucun paiement ;
  - **Payée en partie** : `ISSUED` avec `0 < paymentTotal < invoicesTotal` ;
  - **Payée** : `PAID`.
- **Source :** back.

#### 7.10 `receivablesAging` : Restant à encaisser par ancienneté

- **Valeur :** le total restant en CHF.
- **Sous-titre :** « dont {montant} échus ».
- **Alerte :** valeur en couleur d'alerte si un montant est échu.
- **Visualisation :** barres horizontales en CHF :
  - « Pas encore échu » : pas d'`expirationDate`, ou `expirationDate` à aujourd'hui ou plus tard ;
  - « Échu < 30 j » ;
  - « Échu > 30 j ».
- **Calcul :** pour chaque plan émis et pas encore payé, `invoicesTotal − paymentTotal`, classé selon `expirationDate` par rapport à aujourd'hui.
- **Source :** back.

### Thème Stands

#### 7.11 `categories` : Catégories

- **Sous-titre :** « stands confirmés ».
- **Lien :** « Voir → » vers la liste des stands.
- **Visualisation :** barres horizontales.
  - Libellés : `stand.category.list.{CLE}`. Couleur de barre : `--app-status-validated`.
  - **Valeur de chaque ligne :** nombre de stands confirmés, suivi en petit et en gris de « +{n} » pour les stands en vérification (seulement si n > 0).
  - Les catégories sans aucun stand (confirmé ou en vérification) sont masquées.
  - **Légende :** « Confirmés **{n}** · « +n » = en vérification, non comptés (**{n}**) ».
- **Source :** le `stats` existant (`categoriesStands` des groupes confirmés et en vérification). C'est le même calcul que `packStatsByKey` aujourd'hui.

#### 7.12 `dimensions` : Dimensions

- **Lien :** « Voir → » vers le plan de salle (`floor-plan`).
- **Données :** `dimensionStands` du `stats` existant.
- Le reste est identique à 7.11.

#### 7.13 `freeStands` : Stands libres (nouvelle)

- **Valeur :** le nombre de stands confirmés **qui ne sont placés sur aucun plan de salle**.
- **Alerte :** valeur en couleur d'alerte si elle est supérieure à 0.
- **Sous-titre :** « sur {n} stands confirmés ».
- **Visualisation :** barre 100 % « Placés / Non placés ».
- **Lien :** « Voir → » vers `floor-plan`.
- **Calcul :** un stand est placé si son id apparaît dans au moins un `IFloorLocation.stand.id` d'au moins un des plans renvoyés par `FloorPlanService` pour le salon.
- **Sources :** les plans de salle (front) et `confirmedStandIds` (back, section 9).

### Thème Programme et logistique

#### 7.14 `talksPlanned` : Programme planifié

- **Valeur :** « {planifiés} / {total} ».
- **Sous-titre :** « conférences et ateliers confirmés avec un créneau ».
- **Visualisation :** barre 100 % « Planifiés / Sans créneau ».
- **Calcul :** parmi les conférences et ateliers confirmés (`confirmedTalkIds`, back), sont planifiés ceux dont l'id a, dans `salonService.getPlanningTalks(idSalon).talks`, un `dayId`, un `roomId` et un `startingHour` non nuls.

#### 7.15 `meals` : Repas exposants

- **Valeur :** le total des repas.
- **Sous-titre :** « pour les participations confirmées ».
- **Visualisation :** barres horizontales, libellés `salon.stats.meal1|meal2|meal3`.
- **Source :** `nbMeal1..3` du `stats` existant, groupe confirmé.

#### 7.16 `volunteers` : Créneaux bénévoles couverts

- **Valeur :** « {x} % ».
- **Sous-titre :** « {n} places encore à pourvoir ».
- **Alerte :** valeur en couleur d'alerte si n > 0.
- **Visualisation :** barres horizontales, une par jour (libellé du jour), valeur « {%} ».
- **Calcul :**
  - pour chaque jour du planning des bénévoles, `dayStats(day, categories)` existant ;
  - pourcentage global : moyenne des `coveragePct` des jours, pondérée par le nombre de places demandées ;
  - places à pourvoir : somme des `missingPlaces`.
- **Source :** `VolunteerPlanningService.getPlanningVolunteers(idSalon)`. Si la conversion du DTO vers les jours est privée dans le store, extrais-la dans `volunteer-planning-utils.ts` sans changer son comportement.

#### 7.17 `tasks` : Avancement des tâches

- **Valeur :** « {terminées} / {total} ».
- **Sous-titre :** « sous-tâches terminées ».
- **Visualisation :** barre 100 % « Terminées / À faire / En retard » :
  - « À faire » = actives non en retard ;
  - « En retard » = `isLate`.
- **Calcul :** sous-tâches de toutes les tâches du salon, sans les `CANCELLED`, avec `countSubtasks`.
- **Source :** `TaskInstanceService.findAllBySalon(idSalon)`.

---

## 8. Chargement des données (front)

Toutes ces requêtes partent **en parallèle** au chargement. Chaque carte affiche son contenu dès que **ses** données sont arrivées.

| Donnée | Service existant | Utilisée par |
|---|---|---|
| Participations du salon (`IParticipationList[]`) | `participationService.query(idSalon)` | chronologie (inscriptions), à traiter 1–3, `status` (participations), `channel`, `mealPayment` |
| Statistiques en vérification / confirmées / écartées | `salonService.stats(...)` ×3, comme aujourd'hui | chiffres de la chronologie, `discounts`, `categories`, `dimensions`, `meals` |
| Tâches | `TaskInstanceService.findAllBySalon` | à traiter 4–5, `tasks` |
| Planning des bénévoles | `VolunteerPlanningService.getPlanningVolunteers` | `volunteers` |
| Planning des conférences | `salonService.getPlanningTalks` | `talksPlanned` |
| Plans de salle | `FloorPlanService` | `freeStands` |
| Tableau de bord (nouveau) | `salonService.dashboard(idSalon)` | voir section 9 |

Ne charge que les sources des métriques **choisies** (et celles de la chronologie et de « À traiter »). Dans le catalogue, charge tout.

---

## 9. Back-end : un nouvel endpoint

`GET /api/admin/salons/{idSalon}/dashboard` dans `AdminSalonResource`, avec les mêmes droits que `/stats`. Le calcul est fait dans `SalonService.getDashboard(idSalon)`.

```java
public class SalonDashboard implements Serializable {
    List<DatedAmount> payments;                // date (billingDate) + amount, plans non annulés du salon
    Map<String, Map<Status, Long>> statusCounts; // "STAND", "CONFERENCE", "WORKSHOP" → nombre par statut (les 6)
    long loyalReturning;  long loyalNew;        // 7.2
    Map<String, Double> revenueByService;       // 7.5, clés : STAND, SHARED, CONFERENCE, WORKSHOP, MEALS, ELECTRICITY, POSTAL_FEE, OTHERS
    DelayStats paymentDelay;                    // 7.7 : medianDays + buckets (<10, 10–30, >30)
    DelayStats verificationDelay;               // 7.4 : medianDays + buckets (<7, 7–14, 14–28, >28)
    Map<String, Long> billingProgress;          // 7.9, clés : DRAFT, ISSUED, PARTIAL, PAID
    Aging receivables;                          // 7.10 : notDue, overdueUnder30, overdueOver30 (CHF)
    List<UUID> confirmedStandIds;               // 7.13
    List<UUID> confirmedTalkIds;                // 7.14, conférences + ateliers confirmés
}
```

- **Côté front :** ajoute `ISalonDashboard` dans `admin/salon/model/` et `dashboard(idSalon)` dans `salon.service.ts`.
- **Réutilise** les repositories et les méthodes de calcul déjà utilisés par `getStatistiques` :
  - `getInvoicesDefaultTotal`, `getReductionsTotal`, `getInvoicesTotal`, `getPaymentTotal` ;
  - `findByStatusInAndParticipation_SalonId`.
- **Ajoute** les tests du service : un test par bloc.

---

## 10. Traductions à ajouter (`i18n/fr/salon.json`, sous `salon.dashboard`)

| Clé | Texte |
|---|---|
| `goCatalogue` | Aller sur le catalogue |
| `goDashboard` | Aller sur le tableau de bord |
| `timeline.title` | Chronologie |
| `timeline.registrations` | Inscriptions |
| `timeline.payments` | Montants payés |
| `timeline.expected` | attendu {{amount}} |
| `timeline.empty` | Pas encore d'inscription ni de paiement |
| `todo.title` | À traiter |
| `todo.toVerify` | Participations à vérifier |
| `todo.toInvoice` | Participations à facturer |
| `todo.toWatch` | Participations à surveiller |
| `todo.lateTasks` | Tâches en retard |
| `todo.nextTasks` | Prochaines tâches |
| `metrics.title` | Mes indicateurs |
| `metrics.addOrRemove` | Ajouter ou retirer |
| `metrics.add` | + Ajouter |
| `metrics.shown` | ✓ Affiché |
| `metrics.remove` | Retirer {{title}} |
| `theme.participations` | Participations |
| `theme.billing` | Facturation |
| `theme.stands` | Stands |
| `theme.logistics` | Programme et logistique |
| `catalogue.title` | Catalogue de métriques |
| `catalogue.all` | Toutes |
| `metric.{id}.title` / `.sub` | les titres et sous-titres de la section 7 |

À ajouter aussi :
- `common.json` : `entityList.signal.hasDraft` = « Facture en brouillon » et `entityList.signal.toWatch` = « À surveiller » ;
- `task.json` : `task.chip.next14` = « 2 prochaines semaines ».

---

## 11. Ordre de travail

1. Back : endpoint `dashboard`, `EventLog` du refus, tests.
2. Front, prédicats partagés et puces : `hasDraft`, `toWatch`, `next14`.
3. Front, fonctions pures de `salon-dashboard.utils.ts` et catalogue `salon-dashboard.metrics.ts`, avec leurs tests.
4. En-tête, menu d'actions et bascule `?view=`.
5. Chronologie.
6. À traiter.
7. Mes indicateurs : zones, cartes, mémorisation.
8. Catalogue.
9. Les 17 métriques, une par une.
10. Retrait de l'ancien contenu (les quatre tableaux, la ligne de temps `timeline-dot`), en gardant l'import Google Forms.

## 12. Critères d'acceptation

- [ ] L'écran `admin/salons/:idSalon/stats` affiche la chronologie, « À traiter », « Mes indicateurs » et l'import Google Forms, rien d'autre.
- [ ] Le menu d'actions, tout à droite, contient « Aller sur le catalogue » ou « Aller sur le tableau de bord » selon la vue, et l'URL garde la vue (`?view=catalogue`).
- [ ] La période de la chronologie va de la plus ancienne à la plus récente date (inscriptions et paiements). Rien ne dépend de la date du jour.
- [ ] Le survol de la chronologie montre les deux valeurs de la même semaine dans une seule info-bulle.
- [ ] Les cinq lignes « À traiter » ouvrent la bonne liste, et la liste affiche **le même nombre** d'éléments que le compteur.
- [ ] « Mes indicateurs » regroupe les métriques par thème, masque les thèmes vides, place côte à côte les zones de 1 ou 2 métriques et passe en une colonne sur mobile.
- [ ] × retire une métrique, « + Ajouter » / « ✓ Affiché » la bascule dans le catalogue, et le choix survit à un rechargement de la page.
- [ ] Le catalogue contient exactement les 17 métriques de la section 7, filtrables par thème.
- [ ] Un clic sur un statut de « État actuel » ouvre la liste du type, filtrée sur ce statut.
- [ ] En mode « masquer les informations sensibles », aucun montant en CHF n'est visible.
- [ ] Aucune couleur en dur, aucune nouvelle dépendance, tous les textes traduits.
- [ ] Les tests des fonctions pures et du service back passent.