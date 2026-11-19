# Refonte des fiches Stand, Conférence, Atelier et Participation

> **À l'attention de l'IA (Copilot).** Ce document décrit une refonte UI/UX des écrans d'administration
> `stand`, `conference`, `workshop` et `participation`. La cible visuelle et fonctionnelle est la maquette
> interactive **`salon-fiches-cible.html`** (à ouvrir dans un navigateur ; le bouton « Voir les composants »
> entoure chaque futur composant avec son nom).
>
> **Avant d'écrire du code :**
> 1. Lis ce document en entier, puis les fichiers listés dans « Inventaire de l'existant ».
> 2. Produis un **plan détaillé** pour l'étape en cours (fichiers créés / modifiés, signatures, migrations).
> 3. Pose **toutes les questions** de la section « Questions à poser » qui concernent l'étape, plus celles
     >    que ta lecture du code fait apparaître. **Attends les réponses avant d'implémenter.**
> 4. Travaille **une étape à la fois**, dans l'ordre. À la fin de chaque étape, fais valider avant de passer à la suivante.

---

## 1. Objectif

Passer d'écrans « formulaire unique avec champs désactivés » à des **fiches de consultation** :

1. **En-tête de page** : titre (+ badge de statut, sous-titre) et action **Retour**.
2. **Frise de statut** (nouveau composant) : progression des statuts à gauche, **actions** de statut à droite.
   *Absente en création.*
3. **Enchaînement de cartes `app-card`** (refactorisées), réparties sur deux colonnes (principale + latérale ;
   une seule colonne sur mobile). Chaque carte s'affiche en lecture (paires clé / valeur) et propose,
   si le contexte le permet, **Modifier** : la carte passe en saisie et son **Enregistrer** ne sauve
   **que les champs de cette carte**.

En création, la page affiche toutes les cartes directement en saisie, sans frise de statut, avec un seul
bouton Enregistrer global.

> **Périmètre de cette refonte :** on **déplace les champs existants** dans les cartes décrites ci-dessous.
> On ne crée pas de nouveau champ métier, on ne change pas les validations existantes (sauf les deux
> contraintes explicitement demandées : statut et référence de l'exposant).

---

## 2. Inventaire de l'existant (à lire en premier)

| Sujet | Fichiers | Remarque |
|---|---|---|
| Carte actuelle | `src/main/webapp/app/shared/components/card/card.component.{ts,html,scss}` | `p-card` avec slots `[appCardHeader]` et `[appCardBody]`, input `showHeader`. **À refactoriser.** |
| Frise à réutiliser | `src/main/webapp/app/admin/invoicing-plan/detail/invoicing-plan-detail.component.{ts,html}` | Bande d'actions `el-ip-band` (`mainActions()` = **2 actions max**, + `entity-actions-menu`) et frise `el-ip-timeline` (`timeline()`, `TimelineStep`, segments `seg-ok/run/bad/fut`). **C'est le « stepper de la facture » à extraire.** |
| Rouage d'actions | `shared/components/entity-list/entity-actions-menu.component.*`, `shared/components/action-menu/*`, `EntityAction` dans `shared/components/entity-list/entity-list.model.ts` | Bouton `pi-cog` + menu popup. **À réutiliser tel quel** pour tous les « gear ». |
| Actions serveur | `admin/common/actions.service.ts` (`api/actions/{domain}/{id}/available`, `businessAction`), `shared/model/available-action.ts` (`AvailableAction`, `confirmationKey`, `conditionalKeys`) ; Java : `service/actions/*` | Mécanisme existant d'actions métier côté serveur. |
| Stepper d'inscription | `shared/components/step-progress/*` | **Ne pas confondre** : c'est le stepper du tunnel d'inscription, pas celui de la facture. |
| Écrans visés | `admin/{stand,conference,workshop,participation}/update/*-update.component.{ts,html}` | Formulaires actuels (un seul formulaire, mode lecture/édition global). |
| Formulaires | `admin/*/service/*-form.service.ts` | Validators existants (`Validators.required`, etc.) : **les conserver**. |
| Services HTTP | `admin/*/service/*.service.ts` (`create`, `update` en PUT) | |
| Backend | `web/rest/Admin{Stand,Conference,Workshop,Participation}Resource.java` (POST/PUT), `service/{Stand,Conference,Workshop,Participation}Service.java` | `StandService.update` journalise les changements de dimension, de partage et de statut : **ce comportement doit être conservé** avec l'enregistrement partiel. |
| Champs sensibles | `participation-update` : `hideSensibleInformation` | Comportement existant à conserver (voir étape 4). |
| Traductions | `src/main/webapp/i18n/*/{stand,conference,workshop,participation}.json` | Toute nouvelle clé dans **toutes** les langues présentes. |

---

## 3. Étape 1 : composants réutilisables

Crée et teste ces composants **avant** de toucher aux écrans. Chaque composant : standalone, `ChangeDetectionStrategy.OnPush`,
inputs en signaux (`input()`), styles dans son `.scss`, aucune logique métier.

### 3.1 `app-card` (refactorisation)

**En-tête** :
- **titre** (obligatoire) : `titleKey` (clé de traduction) ou titre déjà traduit, à préciser selon tes conventions ;
- **icône cadenas** optionnelle avant le titre (cartes « sensibles ») ;
- **zone droite** :
    - un **tag** optionnel (slot `[appCardTag]` ou input), par exemple « Défini à la création », « Stand partagé » ou « Complète » ;
    - les **actions**, sous la forme `actions = input<EntityAction[]>([])`. Avec **0** action, rien n'est affiché ;
      avec **1** action, un bouton secondaire `sm` (icône + libellé, par exemple « Modifier ») ; avec **plus d'une**,
      uniquement le rouage (`entity-actions-menu`) contenant toutes les actions.

**Corps** : **entièrement injecté par l'appelant** (`<ng-content select="[appCardBody]">`).

**Pied** optionnel : slot `[appCardFooter]`, utilisé en mode saisie pour « Annuler / Enregistrer ».

**États visuels** :
- `editing` : bordure et en-tête en couleur primaire ;
- `dimmed` : opacité réduite et actions masquées pendant qu'une **autre** carte est en cours de modification.

**Compatibilité** : `app-card` est déjà utilisé ailleurs. Liste **tous** les usages actuels et propose soit une
migration complète, soit une compatibilité temporaire (`showHeader` + ancien slot `[appCardHeader]`). → *Question 1.*

### 3.2 Ligne clé / valeur : `app-field-row` (+ conteneur `app-field-list`)

- **Deux injections** : `<ng-content select="[fieldLabel]">` (gauche) et `<ng-content select="[fieldValue]">` (droite).
- **Mise en page** : prend toute la largeur. Grille **40 % / 60 %**, séparateur fin entre les lignes, aucun séparateur après la dernière.
- **Mobile** (point de rupture à confirmer, ~640 px) : la clé passe **au-dessus** de la valeur (deux lignes, une seule colonne).
- **Clé** : couleur atténuée. **Valeur** : retour à la ligne autorisé sur les mots longs (`overflow-wrap:anywhere`).
- **Valeur vide** : afficher un tiret atténué, via un petit pipe ou helper partagé.
- **Accessibilité** : proposer `dl/dt/dd` (conteneur `dl`, ligne = `div` contenant `dt` + `dd`).

### 3.3 Frise réutilisable + `app-status-timeline`

1. **Extraire** la frise de `invoicing-plan-detail` dans un composant générique (nom proposé : `app-step-timeline`) :
   entrée `steps: { key; label; sublabel?; state: 'done' | 'current' | 'todo' | 'error' }[]`.
   Puis **remplacer** l'implémentation dans `invoicing-plan-detail` par ce composant, sans régression visuelle (dates, marqueur
   « aujourd'hui », segments colorés : ces spécificités facture restent des options du composant ou restent dans la facture,
   → *Question 3*).
2. **Créer** `app-status-timeline` (wrapper) :
    - à gauche : `app-step-timeline` avec le cycle `IN_VERIFICATION → ACCEPTED → VALIDATED → CLOSED`,
      plus un dernier point « hors cycle » rouge si le statut est `REFUSED` ou `CANCELED` ;
    - à droite : **1 à 2 boutons principaux** selon le statut, plus le **rouage** (`entity-actions-menu`) pour toutes les autres actions,
      y compris les actions non liées au statut (envoyer un e-mail, supprimer, …) si l'écran en a déjà ;
    - un texte d'aide court sous les boutons (optionnel) ;
    - les actions dangereuses (refuser, annuler) **demandent une confirmation** (réutiliser le mécanisme existant :
      `confirmationKey` d'`AvailableAction` / `p-confirmpopup`) ;
    - sur mobile, les actions passent sous la frise.
    - **Les points de la frise ne sont pas cliquables.** Le statut ne change **que** par les actions.

Actions proposées dans la maquette (à **valider** : → *Question 4*) :

| Statut courant | Boutons principaux | Dans le rouage |
|---|---|---|
| `IN_VERIFICATION` | **Accepter**, Refuser* | Annuler le dossier* |
| `ACCEPTED` | **Valider** | Remettre en vérification, Refuser*, Annuler le dossier* |
| `VALIDATED` | **Clôturer** | Revenir à l'étape précédente, Annuler le dossier* |
| `CLOSED` | – | Réouvrir |
| `REFUSED` / `CANCELED` | **Réouvrir** | – |

\* avec confirmation.

### 3.4 Page de détail (structure)

Un composant de mise en page (ou réutilisation de `shared/components/content-page` : → *Question 5*) avec trois zones :

1. **En-tête** : titre, badge de statut, sous-titre, bouton Retour (et actions d'en-tête existantes, par exemple
   « Masquer les infos sensibles » sur la participation).
2. **`app-status-timeline`**, uniquement si l'objet existe (pas en création), suivi des alertes calculées éventuelles.
3. **Grille de cartes** : colonne principale + colonne latérale (~320 px), une seule colonne en dessous de ~980 px.

### 3.5 Édition par carte et enregistrement partiel

- Une seule carte en saisie à la fois. Les autres cartes sont atténuées et ne proposent plus d'action.
- Chaque carte déclare la **liste des champs** (form controls) qu'elle édite. Proposer une abstraction, par exemple :
  `SectionDefinition { key; titleKey; controls: string[]; sensitive?: boolean }` et un service/contrôleur
  `SectionEditController` (début d'édition, annulation qui restaure les valeurs, enregistrement).
- **Enregistrer** n'envoie **que** ces champs (plus l'`id`). Côté backend, proposer **un** mécanisme commun aux 4 entités
  (→ *Question 6*) :
    - **option A** : `PATCH /api/admin/{entity}/{id}` avec un DTO partiel (merge-patch, champs absents ignorés) ;
    - **option B** : garder le `PUT`, fusionner côté client les champs de la carte dans le modèle courant et envoyer le modèle complet.
- Validation : seuls les validateurs des champs de la carte bloquent l'enregistrement de cette carte.
- Après succès : mise à jour du modèle affiché, sortie du mode saisie et toast de confirmation.
- Les journaux d'événements de `StandService.update` (dimension, partage, statut) doivent continuer à se déclencher.

### 3.6 Tag de complétude (création et carte en saisie)

Dans l'en-tête de chaque carte en saisie, un tag à droite :
- **Complète** (vert) : tous les champs requis de la carte sont valides ;
- **Incomplète** (orange) : au moins un champ renseigné, mais des requis manquent ;
- **À remplir** (gris) : rien n'est renseigné ;
- **À corriger** (rouge) : une tentative d'enregistrement a échoué sur cette carte.

Calculé à partir des `FormControl` déclarés par la section (helper pur, testable). En création, la barre du bas résume
la progression, par exemple « 3 / 5 sections complètes · 1 champ à corriger ».

### 3.7 Livrables de l'étape 1
- Composants et helpers, avec tests unitaires (rendu 0/1/n actions, mise en page 40/60, états de complétude, actions par statut).
- `invoicing-plan-detail` migré sur la frise extraite, sans régression.
- Aucun écran métier modifié à ce stade, hormis la facture.

---

## 4. Règles transverses (étapes 2 à 4)

### 4.1 Statut
- **Création** : aucun champ statut. L'objet est **toujours créé en `IN_VERIFICATION`**. Le frontend n'envoie pas de statut et
  le **backend force** `IN_VERIFICATION` à la création, même si un statut est envoyé.
- **Modification** : le champ statut **disparaît des formulaires**. Il ne change que via les actions de `app-status-timeline`
  (réutiliser ou créer des actions métier serveur : → *Question 4*).

### 4.2 Référence de l'exposant non modifiable après création
| Entité | Champ verrouillé |
|---|---|
| Stand, Conférence, Atelier | `participation` |
| Participation | `exhibitor` |

- **Création** : champ sélectionnable et obligatoire (première carte du formulaire).
- **Modification, côté frontend** : jamais éditable. Il est affiché dans la carte latérale **« Exposant » / « Intervenant »**, en lecture seule,
  avec le tag « Défini à la création » et **sans action**.
- **Modification, côté backend** : dans `update` (et dans le `PATCH` éventuel), si la référence reçue diffère de l'existante, **refuser**
  avec une `BadRequestAlertException` dédiée (par exemple `participationimmutable` / `exhibitorimmutable`), ou l'ignorer. → *Question 7*.
  Ajouter les tests d'intégration correspondants.

### 4.3 Affichage : champs fusionnés par sens
En lecture, on affiche une **valeur métier lisible**, pas forcément un champ brut. Exemples à appliquer :

| Libellé affiché | Composition |
|---|---|
| Dimension | libellé de la dimension + « · » + prix (`3 × 2 m · 220 CHF`) |
| Mobilier | `nbTable` table(s), `nbChair` chaise(s) |
| Nom (co-exposant) | `sharedFirstName` + `sharedLastName` |
| Exposant | nom de l'exposant + « · » + entreprise, avec un lien vers sa fiche |
| Participation (statut) | badge du statut de la participation liée |
| Repas | grille Samedi midi / Samedi soir / Dimanche midi / **Total** |
| Documents | tags « ✓ Charte acceptée » / « ! Contrat accepté » (orange si non accepté) |
| Évaluations | étoiles + « 4 / 5 » ou « Non évalué » |
| Booléens | « Oui » (vert) / « Non » (atténué) |
| Valeur vide | tiret atténué |

Tags d'en-tête de carte en lecture : par exemple « Publication acceptée / Non publié », « Stand partagé / Non partagé »,
« Offre proposée », « N repas ».

### 4.4 Cases à cocher qui pilotent une carte
Une case à cocher qui conditionne des champs se place **en tête de la carte concernée** ; les champs dépendants s'affichent en dessous,
en retrait, seulement si elle est cochée (même principe que « Publication sur les supports marketing »).

---

## 5. Étape 2 : Conférence et Atelier (pilote)

Mêmes cartes pour les deux entités (champs : `title`, `description`, `participation`, `status`, `extraInformation`).

**Affichage**

| Zone | Carte | Contenu (lecture) | Actions |
|---|---|---|---|
| Principale | **Présentation** | Titre (en gras), Description, compteur « n / 500 caractères » | Modifier → `title`, `description` |
| Latérale | **Intervenant** (tag « Défini à la création ») | Exposant (lien), Nom de thérapeute, E-mail, statut de la participation | aucune |
| Latérale | **Suivi interne** | Commentaire (`extraInformation`) | Modifier → `extraInformation` |

Alerte possible sous la frise : « Participation de l'intervenant : *en vérification* », si la participation liée n'est pas acceptée ou validée.

**Création** (pas de frise) : 1. **Intervenant** (`participation`, select + rappel nom / e-mail / statut de la participation),
2. **Présentation**, 3. **Suivi interne**.

**Livrables** : les deux écrans migrés, le statut retiré des formulaires, le verrou `participation` (front + back), les tests.

---

## 6. Étape 3 : Stand

**Affichage**

| Zone | Carte | Champs (formControlName) | Lecture fusionnée / tag |
|---|---|---|---|
| Principale | **Stand** | `description`, `category`, `subCategories` | Mots-clés en tags |
| Principale | **Surface et équipement** | `dimension`, `nbTable`, `nbChair`, `needElectricity` | Dimension · prix, Mobilier |
| Principale | **Canaux de communication** | `publishedOnWebsite` (case en tête), `website`, `instagram`, `facebook`, `pictureUpload` | tag Publication acceptée / Non publié ; « Image : Manquante » en orange |
| Principale | **Co-exposant** | `shared` (**case en tête**, déplacée depuis l'ancien bloc « infos de base »), `sharedLastName`, `sharedFirstName`, `sharedTherapistName`, `sharedEmail`, `sharedDescription`, `sharedCategory`, `sharedSubCategories`, `sharedPublishedOnWebsite`, `sharedWebsite`, `sharedInstagram`, `sharedFacebook`, `sharedPictureUpload` | tag Stand partagé / Non partagé ; Nom = prénom + nom |
| Latérale | **Exposant** (tag « Défini à la création ») | `participation` en lecture seule | Exposant · entreprise (lien), Nom de thérapeute, E-mail, statut de la participation |
| Latérale | **Commentaire interne** | `extraInformation` | |

**Création** : 1. Participation, 2. Stand, 3. Surface et équipement, 4. Canaux de communication, 5. Co-exposant, 6. Commentaire interne.

Points d'attention :
- Les validations conditionnelles existantes (image requise si publication, champs du co-exposant si `shared`) s'appliquent **par carte**.
- Upload d'images (`pictureUpload`, `sharedPictureUpload`) dans un enregistrement partiel : vérifier le flux actuel (`StandPictureService`). → *Question 8*.
- Alertes calculées sous la frise : image manquante alors que la publication est activée, publication sans aucun canal, co-exposant sans e-mail.

---

## 7. Étape 4 : Participation (découpage « Compact »)

**Affichage**

| Zone | Carte | Champs (formControlName) | Lecture / actions |
|---|---|---|---|
| Principale | **Inscription** | `therapistName`, `registrationDate`, `acceptedChart`, `acceptedContract` | Documents en tags. Modifier |
| Principale | **Repas et facturation** | `nbMeal1`, `nbMeal2`, `nbMeal3`, `modePaymentMeals`, `invoiceSendingMethod`, `needArrangement` | Grille repas + total ; tag « N repas ». **2 actions → rouage** : Modifier, Voir les facturations (bouton facturation existant) |
| Principale | **Offre et message** | `hasOffer` (case en tête), `offer`, `additionnalInformation` | tag « Offre proposée ». Modifier |
| Principale | **Prestations souscrites** | lecture seule | Onglets Stands / Conférences / Ateliers (compteurs), lignes avec statut + « Ouvrir », bouton « + Nouveau … » qui ouvre la création avec la participation présélectionnée. Aucune action d'en-tête |
| Latérale | **Exposant** (tag « Défini à la création ») | `exhibitor` en lecture seule | Exposant (lien), Entreprise, E-mail, Téléphone |
| Latérale | 🔒 **Appréciation interne** (sensible) | `crushOfHeart`, `guestOfHonor`, `ratingFriendliness`, `ratingPaymentSpeed`, `ratingServiceQuality`, `extraInformation` | Distinctions en tags, notes en étoiles, commentaire. Modifier |

**Création** : 1. Exposant (`exhibitor`), 2. Inscription, 3. Repas et facturation, 4. Offre et message, 5. Appréciation interne.

Points d'attention :
- « Masquer les infos sensibles » (`hideSensibleInformation`) masque les cartes marquées sensibles. Aujourd'hui, la date d'inscription et les
  documents sont aussi masqués ; dans la cible, ils sont dans « Inscription », non sensible. → *Question 9*.
- `needArrangement` est rangé dans « Repas et facturation » (supposé : arrangement de paiement). → *Question 10*.
- Alertes calculées : charte ou contrat non accepté, offre cochée sans description, aucune prestation souscrite.

---

## 8. Questions à poser avant d'implémenter

**Étape 1**
1. `app-card` : migrer **tous** les usages actuels maintenant, ou garder une compatibilité temporaire (`showHeader`, `[appCardHeader]`) ?
2. Titres de carte : clé de traduction (`titleKey`) ou texte déjà traduit ? Convention du projet pour le tag (input ou slot) ?
3. Frise extraite : quelles spécificités de la facture (dates, marqueur « aujourd'hui », segments `seg-*`) deviennent des options génériques ?
4. Transitions de statut : la table du §3.3 est-elle juste ? Faut-il des **actions métier serveur** (`AvailableAction`, `api/actions/business/...`)
   pour stand, conférence, atelier et participation (règles, droits, effets de bord comme la facturation ou les e-mails), ou un simple endpoint de changement de statut ?
5. Mise en page : réutiliser `app-content-page` ou créer un composant de page de détail ?
6. Enregistrement partiel : option A (`PATCH` + DTO partiel) ou option B (`PUT` avec le modèle complet fusionné) ? Gestion de la concurrence (version, `lastModified`) ?

**Étapes 2 à 4**

7. Référence d'exposant modifiée en update : **rejeter** (400) ou **ignorer** silencieusement ?
8. Images du stand : comment s'insère l'upload dans un enregistrement par carte ?
9. Participation : la date d'inscription et les documents doivent-ils rester masqués par « Masquer les infos sensibles » ?
10. Sens exact de `needArrangement` et de sa place ?
11. Libellés des sous-titres d'étapes de la frise (maquette : « Place confirmée », « Dossier et paiement OK »…) : à définir, ou aucun sous-titre ?
12. Routes : la fiche de consultation remplace-t-elle la route `…/edit` actuelle, ou faut-il une nouvelle route `…/view` ?
13. Droits : certains rôles ne doivent-ils pas voir le bouton « Modifier » ou certaines actions de statut ?

---

## 9. Définition de « terminé » pour chaque étape
- Plan validé, questions répondues.
- Build, lint et tests (front + back) au vert. Nouveaux tests pour les composants, le verrou de l'exposant et le statut forcé à la création.
- Traductions ajoutées dans toutes les langues.
- Aucun champ existant perdu : vérifier, entité par entité, que **chaque `formControlName` du formulaire actuel** apparaît dans une carte.
- Rendu vérifié en desktop et mobile, comparé à `salon-fiches-cible.html`.