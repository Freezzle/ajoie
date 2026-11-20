# Gestion des doublons d'exposants — instructions pour l'implémentation

> À lire en entier avant de coder. Le prototype interactif validé se trouve dans
> `docs/prototype-doublon-exposant.html` (à ouvrir dans un navigateur) : il fait foi pour l'écran,
> les textes et le comportement.

## 1. Objectif

Quand un exposant s'inscrit et qu'on détecte qu'il ressemble à un exposant déjà en base, sa fiche
est marquée `duplicateDetected = true`. Aujourd'hui, rien ne permet de traiter ce cas proprement.

On veut :

1. **Retenir, dès la détection, l'id de l'exposant existant le plus probable** (le « candidat »),
   pour ouvrir directement la bonne comparaison.
2. **Un écran de comparaison en lecture seule** entre le nouvel exposant (marqué doublon) et le
   candidat. On peut changer de candidat avec une liste déroulante qui permet de chercher.
3. **Trois décisions**, toujours confirmées dans une fenêtre de validation :
    - **Fusionner dans l'existant** : l'existant est mis à jour avec la situation actuelle du nouveau,
      il garde tout son historique, puis le nouveau est supprimé.
    - **Pas un doublon** : on retire seulement l'alerte.
    - **Doublon, mais garder séparé** : on retire seulement l'alerte, les deux fiches restent.
4. Tout se déclenche **depuis le détail de la participation**, par **un nouvel ActionHandler**.

## 2. Ce qui existe déjà et qu'il faut réutiliser

| Sujet | Où |
|---|---|
| Détection à l'inscription publique | `service/registration/PublicRegistrationService.java` → `upsertExhibitor()` et `hasPotentialDuplicate()` |
| Détection à l'import CSV | `service/Importation2026Service.java` → `detectAndFlagDuplicates()` |
| Flag sur l'exposant | `domain/Exhibitor.java` → `duplicateDetected` (et DTO `ExhibitorDTO`, `ExhibitorLightDTO`) |
| Blocage existant | `handlers/impl/participation/ActionAcceptHandler.java` refuse d'accepter si `exhibitor.isDuplicateDetected()` |
| Contrat des actions | `handlers/BusinessActionHandler`, `ActionSupport`, `ConditionalKey`, `ActionMetadataProvider`, `enums/ContextActionType` |
| Exemple de handler | `handlers/impl/participation/ActionValidateHandler.java` |
| Exécution et disponibilité des actions | `web/AvailabilityActionController.java` (`/api/actions/...`), `service/actions/PermissionActionService.java` |
| Historique | `EventLogService` + `domain/EventLog` (`entityType` = `EXHIBITOR` / `PARTICIPATION`, `referenceId`) |
| Front, appel des actions | `webapp/app/admin/common/actions.service.ts` (`getAvailableActions`, `businessAction`) |
| Front, détail participation | `webapp/app/admin/participation/update/participation-update.component.*` |
| Front, confirmation | `shared/delete-dialog/confirm-dialog.service.ts` ; modales via `NgbModal` (voir `invoicing-plan-actions.service.ts`) |
| Libellés d'actions | `webapp/i18n/{fr,de,...}/action.json` (clés `action.<code>`, `.help`, `.condition.*`) |

Respecter les conventions du projet : multi-tenant (`TenantOwned`), Liquibase pour le schéma,
DTO + mapper MapStruct, `EventLogService.eventFromSystem(...)` pour tracer, Lombok
`@RequiredArgsConstructor`.

## 3. Retenir le candidat dès la détection

### 3.1 Modèle

Ajouter sur `Exhibitor` :

```java
@Column(name = "duplicate_of_id")
private UUID duplicateOfId; // exposant existant le plus probable, null si aucun
```

- Changeset Liquibase dans le dossier de la version en cours (`changelog/0.0.2/...`), colonne
  `duplicate_of_id` de type `${uuidType}`, nullable, avec un index.
- **Pas de clé étrangère** (ou `ON DELETE SET NULL`) : le candidat peut être supprimé ou fusionné
  entre-temps, ce n'est qu'une suggestion.
- Exposer `duplicateOfId` dans `ExhibitorDTO` (lecture seule côté admin).
- Garder `duplicateDetected` tel quel : `ActionAcceptHandler` et le reste de l'application
  l'utilisent déjà.

### 3.2 Détection

Remplacer `hasPotentialDuplicate(...)` (qui renvoie un `boolean`) par une méthode qui renvoie
**le meilleur candidat**, par exemple `Optional<Exhibitor> findBestDuplicateCandidate(phone, firstName, lastName)` :

- garder les mêmes critères qu'aujourd'hui (6 derniers chiffres du téléphone, puis prénom + nom) ;
- s'il y a plusieurs résultats, les classer : téléphone identique > prénom et nom identiques >
  nom proche ; à égalité, celui qui a le plus de participations, puis le plus récent ;
- exclure l'exposant lui-même et ne chercher que dans le tenant courant.

Dans `upsertExhibitor()` :

```java
Optional<Exhibitor> candidate = findBestDuplicateCandidate(...);
exhibitor.setDuplicateDetected(candidate.isPresent());
exhibitor.setDuplicateOfId(candidate.map(Exhibitor::getId).orElse(null));
```

Le commentaire existant reste valable : l'endpoint public ne modifie **jamais** les fiches existantes.

Faire de même dans `Importation2026Service.detectAndFlagDuplicates()` (renseigner `duplicateOfId`
sur la fiche importée). Factoriser la recherche du candidat dans un service commun, par exemple
`ExhibitorDuplicateService`, pour ne pas avoir deux logiques différentes.

## 4. Données pour l'écran

Endpoints admin, dans `AdminExhibitorResource` ou une nouvelle ressource dédiée :

- `GET /api/admin/exhibitors/{id}/duplicate-candidates` : renvoie le candidat retenu
  (`duplicateOfId`) en premier, puis les autres candidats trouvés avec la même logique. Pour chacun,
  renvoyer l'exposant (DTO léger), son nombre de participations, sa date de création et la liste des
  critères qui correspondent (`SAME_EMAIL`, `SAME_PHONE`, `SAME_NAME`, `SIMILAR_NAME`,
  `SAME_ADDRESS`, `SAME_STREET`). Le front affiche ces critères en petites pastilles.
- `GET /api/admin/exhibitors/search?q=...` : recherche pour la liste déroulante (nom, prénom,
  e-mail, téléphone en comparant les chiffres, NPA, localité, rue), sans tenir compte des accents ni
  de la casse, paginée et limitée à environ 20 résultats. Réutiliser un endpoint de liste existant
  s'il le permet déjà.
- `GET /api/admin/exhibitors/{id}` existe déjà pour charger le détail complet des deux fiches.

Si le candidat retenu n'existe plus, le front ouvre l'écran sans candidat présélectionné : la
liste déroulante est ouverte et propose les autres candidats.

## 5. Le nouvel ActionHandler (détail de la participation)

### 5.1 Déclaration

- Ajouter dans `ContextActionType` :
  `PARTICIPATION_RESOLVE_DUPLICATE("participation", "participation-resolve-duplicate")`.
- Créer `handlers/impl/participation/ActionResolveDuplicateHandler.java`, qui implémente
  `BusinessActionHandler<Participation>` et `ActionMetadataProvider`.
- Prévoir la permission dans `PermissionActionService`, comme pour les autres actions de participation.
- Ajouter les libellés i18n (`action.participation-resolve-duplicate`, `.help`, conditions) dans
  **toutes** les langues de `webapp/i18n/`.

### 5.2 `supports()`

- `rejected()` si la participation ou son exposant est `null`, ou si
  `!payload.getExhibitor().isDuplicateDetected()`.
- Sinon `allowed("action.participation-resolve-duplicate.help")`. Pas d'autre condition : on doit
  pouvoir traiter un doublon quel que soit le statut de la participation.

### 5.3 Données reçues dans `execute()` (le `context`, c'est-à-dire le corps de la requête)

```json
{ "decision": "MERGE | NOT_DUPLICATE | KEEP_SEPARATE", "targetExhibitorId": "<uuid du candidat choisi>" }
```

- Créer une enum `DuplicateDecision`.
- Valider : `decision` est obligatoire ; `targetExhibitorId` est obligatoire pour `MERGE` et
  `KEEP_SEPARATE`, et doit être différent de l'exposant de la participation et du même tenant.
  Sinon, lever une `BadRequestAlertException` avec une clé i18n.
- `execute()` délègue à `ExhibitorDuplicateService`, sans logique métier dans le handler.

### 5.4 Côté front

Cette action ne peut pas utiliser le formulaire générique (`ActionFormDialogComponent`). Dans
`participation-update.component.ts`, quand on lance l'action `participation-resolve-duplicate`,
ouvrir le **composant de comparaison** (section 7) dans une `NgbModal` en grand format, ou sur une
route dédiée. C'est ce composant qui appelle ensuite
`actionsService.businessAction('participation-resolve-duplicate', participationId, payload)`.

Il est conseillé d'afficher aussi un bandeau « Doublon détecté — Comparer » en haut du détail de la
participation tant que l'alerte est active, qui ouvre la même modale.

## 6. Fusion : trouver la meilleure solution

Mettre la logique dans `ExhibitorDuplicateService`, dans une seule méthode `@Transactional`.
Exemple : `merge(Exhibitor duplicate, Exhibitor target)`, où `duplicate` est le nouvel exposant
(celui de la participation) et `target` l'existant.

### 6.1 Règle métier (validée)

**Fusionner, c'est mettre à jour l'existant avec la situation actuelle du nouveau,** comme si on
modifiait l'ancienne fiche avec les nouvelles informations, **en gardant tout son historique**.

- **Données de base : toutes celles du nouveau remplacent celles de l'existant, même vides.**
  Cela concerne prénom, nom, e-mail, téléphone, langue, adresse du domicile (champ par champ),
  `differentBillingAddress`, adresse de facturation, newsletter, ainsi que `redFlag` et
  `extraInformation` (voir le point à valider en 9).
- **Ce qui ne change pas sur l'existant :** id (n° client), `registrationDate`, `tenantId`, et tout
  ce qui est rattaché à l'existant (participations, factures et plans de facturation via ses
  participations, événements, historique).
- **Ce qui est déplacé du nouveau vers l'existant :** **toutes** les participations du nouveau,
  avec tout ce qui en dépend (stands, conférences, ateliers, plans de facturation, factures,
  paiements), qui suivent puisqu'ils sont rattachés à la participation. Déplacer aussi l'historique
  `EventLog` du nouveau (`entityType = EXHIBITOR`, `referenceId = duplicate.id`) vers l'existant.
- **Après la fusion :** `target.duplicateDetected = false`, `target.duplicateOfId = null`, le nouveau
  est supprimé, et tout autre exposant dont `duplicateOfId` pointait sur le nouveau est redirigé vers
  l'existant.

### 6.2 Points d'attention techniques

1. **Rechercher toutes les références à un exposant** avant de coder. Aujourd'hui, seul
   `Participation.exhibitor` porte une clé étrangère (`fk_participation__exhibitor_id`). Vérifier
   aussi les entités qui pourraient référencer un exposant sans clé étrangère : `EventLog.referenceId`,
   chat (`ChatConversation`), tâches, waitlist (`WaitlistEntry`), tokens et liens signés d'édition de
   l'inscription. Tout doit pointer vers l'existant après la fusion, ou être explicitement abandonné.
2. **Adresses** (`homeAddress`, `billingAddress` sont des `@ManyToOne(cascade = ALL)`) : **copier les
   valeurs** dans les objets `Address` de l'existant, ou en créer un s'il n'y en a pas. Ne pas
   réaffecter l'objet `Address` du nouveau à l'existant : le nouveau serait supprimé avec son adresse
   par la cascade. Si `differentBillingAddress` devient `false`, mettre `billingAddress` à `null`,
   comme le fait `applyExhibitor()`.
3. **E-mail** : l'inscription retrouve un exposant par `findByEmail`. Si une contrainte d'unicité
   existe (ou est ajoutée), copier l'e-mail du nouveau sur l'existant **après** avoir supprimé le
   nouveau et appelé `flush()`. Sinon, la contrainte saute.
4. `BankAccount` : il ne fait pas partie de l'écran. Garder celui de l'existant, sauf s'il n'en a pas
   et que le nouveau en a un.
5. Déplacer les participations par des requêtes de masse dans les repositories (`@Modifying`
   `update ... set exhibitor = :target where exhibitor = :duplicate`), puis vider le contexte de
   persistance, plutôt que de charger les collections une par une.
6. **Tracer** avec `eventLogService.eventFromSystem(...)` :
    - sur l'existant (`EXHIBITOR`) : « Fusion du doublon #… », avec dans le payload l'id du nouveau,
      la liste des champs modifiés avec ancienne et nouvelle valeur, et les ids des participations
      déplacées ;
    - sur la participation (`PARTICIPATION`) : « Exposant fusionné dans #… ».
7. Tout se fait dans **une seule transaction** : si une étape échoue, rien ne change.

### 6.3 Les deux autres décisions

- `NOT_DUPLICATE` : `duplicate.duplicateDetected = false`, `duplicateOfId = null`, et un EventLog
  « Marqué comme pas un doublon » (avec le candidat comparé).
- `KEEP_SEPARATE` : même chose, avec l'EventLog « Doublon connu, fiches gardées séparées » (avec
  `targetExhibitorId`). Si le projet a besoin plus tard de retrouver ce lien, prévoir une colonne
  `knownDuplicateOfId`. Ce n'est pas demandé pour l'instant : ne pas l'ajouter sans validation.

Après chaque décision, l'action « Accepter » de la participation n'est plus bloquée par la
condition `exhibitor-not-duplicated`.

## 7. Écran de comparaison (front)

Créer un composant standalone, par exemple
`admin/participation/duplicate/exhibitor-duplicate-compare.component.ts`, en suivant
**exactement** le prototype :

- **En-tête « Doublon détecté »**, avec deux cartes :
    - à gauche, **Existant · candidat** : liste déroulante avec recherche (frappe → liste filtrée ;
      candidats proposés d'abord, puis autres clients ; termes recherchés surlignés ; pastilles de
      ressemblance ; ↑ ↓, Entrée, Échap), plus e-mail, téléphone, localité, date de création et nombre
      de participations ;
    - à droite, **Nouveau · doublon détecté** : fixe.
    - Au changement de candidat, toute la comparaison se met à jour.
- **Tableau en lecture seule**, une ligne par champ, groupé comme l'écran exposant (Informations de
  base, Adresse du domicile, Adresse de facturation, Préférences, Informations internes). Colonnes :
  Champ | Existant | Nouveau | Après fusion (« Mis à jour » ou « Vidé (vide chez le nouveau) »).
  Les différences sont mises en avant en orange ambré (`#E8900C`, fond `#FFF8EC`, texte `#8A5300`).
  Les lignes identiques sont grisées, avec une case « N'afficher que les différences ».
- **Bloc « En cas de fusion, l'existant garde son historique »** : n° client, date de création,
  participations, événements et liens, plus les participations du nouveau.
- **Trois boutons de décision** (barre fixée en bas) → **fenêtre de validation** qui liste les
  conséquences. Pour la fusion, le bouton de validation est rouge et la fenêtre précise que la
  suppression est définitive. Le focus est mis sur « Annuler » ; Échap et un clic sur le fond
  ferment la fenêtre.
- **Le calcul de « Après fusion » doit venir du back** (par exemple
  `GET .../duplicate-preview?target=...`), qui renvoie la liste des champs avec valeur actuelle,
  nouvelle valeur et effet. Ainsi, l'aperçu et la fusion réelle utilisent la même règle.
- Responsive : sur mobile, les cartes s'empilent, chaque ligne affiche le libellé puis
  Existant / Nouveau, et la fenêtre s'ouvre depuis le bas.
- Accessibilité : vrai `role="combobox"` / `listbox` / `option` avec `aria-activedescendant`, et une
  fenêtre `role="dialog" aria-modal="true"`.
- Après une décision réussie : fermer la modale et recharger la participation (`refreshScope` `ENTITY`).
- Tous les textes passent par `ngx-translate`.

## 8. Tests à écrire

- **Détection** : choix du meilleur candidat (priorité téléphone, puis nom ; départage à égalité),
  aucun candidat, isolation entre tenants, aucune modification des fiches existantes par l'endpoint
  public.
- **Handler** : `supports()` (rejeté sans doublon, autorisé avec doublon), validation du payload.
- **Fusion** (test d'intégration) :
    - données de base copiées, champs vides compris ;
    - id, date de création et participations de l'existant conservés ;
    - participations du nouveau déplacées, avec leurs stands, factures, etc. ;
    - EventLogs déplacés et créés ;
    - adresses copiées et non partagées ;
    - nouveau supprimé ;
    - `duplicateOfId` redirigé ;
    - retour arrière complet si une étape échoue.
- **Pas un doublon / garder séparé** : flag retiré, aucune autre donnée modifiée.
- **Front** : changement de candidat, fenêtre de validation, payload envoyé.

## 9. Points à valider avec moi avant de finir

1. **`redFlag` et `extraInformation`** sont des notes internes. Dans le prototype, la fusion les
   remplace par celles du nouveau. Proposer une meilleure règle si tu en vois une, par exemple garder
   le red flag s'il est sur l'une des deux fiches et concaténer les notes, puis me demander avant de
   l'appliquer.
2. Liste complète des entités qui référencent un exposant (point 6.2.1) : me la montrer avant
   d'écrire la fusion.
3. Faut-il ajouter une contrainte d'unicité sur l'e-mail (par tenant) ?