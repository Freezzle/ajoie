# Stepper d'inscription exposant — instructions pour GitHub Copilot

> **À toi, Copilot :** ce document décrit un composant à créer dans ce dépôt (`Freezzle/ajoie`).
> La maquette de référence est `docs/maquettes/stepper-inscription-exposant-final.html` (ouvre-la dans un navigateur, c'est la source de vérité pour l'UX).
> **Ne copie pas son HTML/CSS/JS tel quel** : reproduis le comportement avec les conventions, composants et styles **déjà présents dans le projet**. Quand ce document et le code du projet divergent sur une convention, **le projet a raison** ; quand ils divergent sur le comportement attendu, **ce document a raison**.

---

## 1. Objectif

Créer un formulaire public d'inscription en 4 étapes permettant à un exposant de s'inscrire à une édition du salon :

1. **Vos informations** — l'exposant (personne de contact)
2. **Prestations** — stand, conférence(s), atelier(s), chacun optionnel
3. **Participation** — repas, paiement des repas, envoi de facture, offre, remarques
4. **Récapitulatif** — relecture, acceptation charte + conditions, envoi

Résultat de l'envoi : création (ou rattachement) d'un `Exhibitor`, d'une `Participation` pour l'édition courante, et des `Stand` / `Conference` / `Workshop` liés, tous en statut initial de vérification.

---

## 2. Avant d'écrire du code : inspecte le projet

Vérifie et réutilise ce qui existe. Ce que j'ai observé dans les formulaires d'administration :

| Élément | Où regarder | À réutiliser pour |
|---|---|---|
| Composants de champ maison : `text-box`, `textarea-box` (`maxLength`, `rows`, `showCounter`), `select-box` (`options`, `formatterFunction`, `needTranslation`, `enableFilter`), `number-box`, `checkbox-box`, `chips-box`, `date-box` | `src/main/webapp/app/shared/**` (cherche les sélecteurs) | Tous les champs du stepper |
| `app-address-form` (`[required]`, `[showFormalFields]`, `formControlName`) | utilisé dans `admin/exhibitor/update/exhibitor-update.component.html` | Adresse principale (`showFormalFields=false`) et adresse de facturation (`showFormalFields=true`) |
| `button-box`, `app-card`, `app-alert-error` | idem | Boutons, cartes, erreurs serveur |
| Traductions `ngx-translate` (`translateKey="…"`, pipe `translate`) | `src/main/webapp/i18n/<lang>/*.json` | **Réutilise les clés existantes** (`exhibitor.*`, `participation.*`, `stand.*`, `conference.*`, `workshop.*`), ajoute uniquement les nouvelles clés sous un namespace `registration.*`, dans **toutes** les langues présentes |
| Enums front (`ModePaymentMeals`, `InvoiceSendingMethod`, `Category`, `Language`, statuts) | `app/entities/enumerations/**` ou équivalent | Options des selects/radios |
| Formulaires typés (`editForm.controls.x`) et services de form (`*-form.service.ts`) | `admin/*/update/*.ts` | Construction des `FormGroup` |
| Syntaxe de templates (`@if`, `@for`, standalone components), PrimeNG, grille Bootstrap (`row`, `col-lg-*`, `mt-4`) | partout | Garder le même style de code |
| Liste des dimensions de stand (`dimensionsOptions`, objet avec `.dimension`) | `admin/stand/update/stand-update.component.ts` | Select « Dimension », via un endpoint **public** |

Si un composant de champ ne supporte pas un besoin (ex. compteur +/-, boutons Oui/Non), **étends-le ou crée un petit composant partagé** dans le même dossier et avec la même API (`ControlValueAccessor`, `fieldName`, `translateKey`) plutôt que d'écrire du HTML brut dans le stepper.

---

## 3. Règle absolue : aucun champ interne

Le stepper est **public**. Ne jamais afficher, envoyer depuis le client ni accepter côté serveur depuis cet endpoint :

- `status` (participation, stand, conférence, atelier) → fixé côté serveur à `IN_VERIFICATION`
- `registrationDate` → fixée côté serveur
- `extraInformation` (commentaires internes) sur toutes les entités
- `redFlag`, `duplicateDetected` (exposant)
- `crushOfHeart`, `guestOfHonor`, `needArrangement`
- `ratingFriendliness`, `ratingPaymentSpeed`, `ratingServiceQuality`
- tout ce qui touche à la **facturation** (billing, factures, paiements, montants, prix)
- les liens entre entités (`participation`, `exhibitor`) : c'est le serveur qui les crée

Exception volontaire : `acceptedChart` et `acceptedContract` sont dans le bloc interne de l'admin, mais ils sont **saisis par l'exposant** au récapitulatif (cases obligatoires).

---

## 4. Champs par étape

`*` = obligatoire. Les libellés existants sont indiqués par leur clé i18n.

### Étape 1 — Vos informations
| Champ | Entité.propriété | Composant | Règle |
|---|---|---|---|
| Prénom* | `Exhibitor.firstName` | text-box | requis |
| Nom de famille* | `Exhibitor.lastName` | text-box | requis |
| Nom de thérapeute / d'exposant | `Participation.therapistName` (clé `exhibitor.therapistName`) | text-box | facultatif, aide : « nom affiché pendant le salon » |
| E-mail* | `Exhibitor.email` | text-box `type=email` | requis + format |
| Téléphone | `Exhibitor.phoneNumber` | text-box `type=tel` | facultatif |
| Adresse* | `Exhibitor.homeAddress` | app-address-form `[required]=true [showFormalFields]=false` | requis |
| Adresse de facturation différente | `Exhibitor.differentBillingAddress` | interrupteur | si coché → afficher `billingAddress` (app-address-form `[showFormalFields]=true`, requis) |
| Langue de correspondance | `Exhibitor.language` | select (fr/de/en) | défaut = langue courante de l'UI |
| Newsletter | `Exhibitor.newsletter` | interrupteur | défaut `true` |

### Étape 2 — Prestations
Trois **cartes-questions**, chacune avec boutons **Oui / Non** (aucune réponse par défaut) :

- « Souhaitez-vous un stand ? » → si Oui, la carte **se déplie** avec le formulaire Stand
- « Donnerez-vous une conférence ? » → si Oui, liste de conférences (≥ 1, bouton « + Ajouter une autre conférence », « Retirer » si > 1)
- « Animerez-vous un atelier ? » → idem pour les ateliers

Repasser à Non replie la carte ; les données saisies peuvent être conservées en mémoire mais **ne sont pas envoyées**.

**Stand** (si Oui)
| Champ | Propriété | Composant | Règle |
|---|---|---|---|
| Description* | `description` | textarea-box `maxLength=500 showCounter` | requis |
| Dimension* | `dimension` | select-box (options depuis l'API, filtrées sur l'édition) | requis |
| Catégorie* | `category` | select-box, enum `Category` **sans `NONE`** | requis |
| Tags | `subCategories` | chips-box (Entrée ou virgule pour ajouter, Retour arrière pour retirer) | facultatif |
| Nombre de tables / chaises | `nbTable`, `nbChair` | compteur −/+ (min 0, défauts 1 et 2) | |
| Avec électricité | `needElectricity` | interrupteur | |
| Stand partagé | `shared` | interrupteur | |
| Site, Instagram, Facebook, URL image | `website`, `instagram`, `facebook`, `urlPicture` | text-box | facultatifs, section « Réseaux sociaux » |

**Conférence / Atelier** (chaque élément) : `title`* (text-box), `description`* (textarea-box `maxLength=500`).

Validation de l'étape : les 3 questions doivent avoir une réponse **et** au moins une doit être Oui (message : « Choisissez au moins une prestation »).

### Étape 3 — Participation
| Champ | Propriété | Composant | Règle |
|---|---|---|---|
| Repas samedi midi / samedi soir / dimanche midi | `nbMeal1`, `nbMeal2`, `nbMeal3` | compteur −/+ (min 0) | |
| Paiement des repas | `modePaymentMeals` | boutons radio (`MIXED`, `SEPARATE`) | **requis seulement si** total repas > 0 ; envoyé `null` sinon |
| Envoi de la facture* | `invoiceSendingMethod` | boutons radio (`EMAIL`, `POSTAL`) | requis, défaut `EMAIL` |
| Offre spéciale | `hasOffer` | interrupteur | si coché → `offer`* (text-box) |
| Remarques | `additionnalInformation` | textarea-box | facultatif |

### Étape 4 — Récapitulatif
- Une carte par section (Vos informations, Stand, Conférence(s), Atelier(s), Participation) avec un bouton **Modifier** qui ramène à l'étape (et fait défiler jusqu'à la bonne carte pour stand/conférence/atelier).
- N'afficher que les valeurs renseignées ; booléens en Oui/Non ; enums traduits.
- Deux cases obligatoires : `acceptedChart` (« J'ai lu et j'accepte la charte des exposants », lien vers le document) et `acceptedContract` (« J'accepte les conditions de participation »).
- Bouton principal : « Envoyer mon inscription ».

### Écran de confirmation
Icône de validation, « Merci {prénom} ! », texte indiquant qu'une confirmation sera envoyée à {email} après vérification. Pas de bouton « recommencer » en production (c'était pour la démo).

---

## 5. Navigation : barre segmentée cliquable (le cœur du composant)

En-tête **collant** (`position: sticky; top: 0`) contenant 4 segments en grille : `Vous · Prestations · Participation · Récap`.

Chaque segment = un **bouton** avec : libellé court, rail de progression, texte d'état (bureau uniquement).

**États** (calculés, pas stockés) :
| État | Condition | Rendu |
|---|---|---|
| `cur` | étape affichée | libellé + texte couleur d'accent, rail rempli à `progress%` de l'étape courante (champs requis remplis / requis, min 8 %) |
| `done` | étape déjà atteinte (`index ≤ maxReached`) **et** valide | rail plein, coche ✓ devant le libellé, « Complété » |
| `warn` | étape déjà atteinte mais devenue invalide | rail plein hachuré (accent clair), « À compléter » |
| `todo` | jamais atteinte, ou étape Récap hors fin de parcours | rail vide, « À venir » |

**Clic sur un segment `j`** :
- `j ≤ courant` → y aller directement.
- `j > courant` → valider successivement chaque étape de `courant` à `j-1` ; s'arrêter sur la **première invalide** (l'afficher, marquer ses erreurs, scroller au premier champ en erreur) ; sinon aller à `j`. Mettre à jour `maxReached`.

**Boutons bas** : « ← Précédent » (masqué à l'étape 1) et « Continuer » / « Envoyer ma demande ». Continuer = valider l'étape courante puis avancer.

**Titre** : chaque étape affiche directement son `h2` (ex. « Que souhaitez-vous proposer ? ») et une phrase d'introduction. **Pas de sur-titre « 02 — Prestations » au-dessus du h2** : l'information est déjà dans la barre collante.

Après chaque changement d'étape : remonter en haut du formulaire et donner le focus au `h2` (accessibilité).

---

## 6. Comportement mobile (obligatoire)

Point de rupture : ~700 px de large (utilise les breakpoints / mixins SCSS du projet si ils existent ; une container query est acceptable).

- Barre segmentée toujours visible en haut : libellés réduits (11 px), textes d'état masqués, et une ligne sous la barre : `Étape 2 sur 4` à gauche, nom de l'étape en gras à droite.
- **Barre d'action collée en bas** (`position: sticky; bottom: 0`, fond blanc semi-opaque + flou, `padding-bottom: env(safe-area-inset-bottom)`) : bouton Précédent réduit à une flèche (≈ 50 px), bouton Continuer en pleine largeur.
- Toutes les colonnes passent en pleine largeur, sauf NPA (1/3) + Localité (2/3).
- Cartes Oui/Non : icône + question sur une ligne, boutons Oui / Non dessous, chacun 50 % de la largeur.
- Compteurs de repas : libellé à gauche, compteur à droite, une ligne par repas.
- Récap : libellé au-dessus de la valeur (plus de grille 2 colonnes).
- `font-size ≥ 16px` sur tous les inputs (évite le zoom auto iOS), cibles tactiles ≥ 44 px.
- Touche Entrée dans un input : focus au champ suivant ; sur le dernier champ, déclenche Continuer. (Pas dans les textarea ni dans le champ de tags.)

---

## 7. Validation et erreurs

- Validation **à la demande** (au clic sur Continuer, sur un segment, ou sur Envoyer), pas à chaque frappe ; l'erreur d'un champ disparaît dès qu'on le modifie.
- Messages : « Champ obligatoire », « Adresse e-mail invalide », « Merci de répondre » (questions Oui/Non), « Choisissez au moins une prestation », « Choisissez comment régler vos repas », « Requis pour envoyer votre inscription » (cases du récap).
- Un toast / message bref : « N champs à compléter ».
- Utilise les validateurs Angular (`Validators.required`, `Validators.email`, `Validators.maxLength(500)`) et active/désactive dynamiquement les validateurs des champs conditionnels (`billingAddress`, `offer`, `modePaymentMeals`, sous-formulaires des prestations) ; un groupe désactivé (`disable()`) est exclu de la validation et de `getRawValue` filtrée.

---

## 8. Architecture Angular proposée

Adapte les noms/dossiers aux conventions du dépôt (vérifie s'il existe déjà une zone publique hors `admin/`).

```
app/registration/                         (ou app/public/registration/)
├── registration.routes.ts                route publique, sans guard d'auth, param :eventId (ou édition courante)
├── registration.component.ts|html|scss   conteneur : état du stepper, navigation, envoi
├── registration-form.service.ts          construit le FormGroup typé (1 sous-groupe par étape)
├── registration.service.ts               appels HTTP (dimensions publiques, POST inscription)
├── step-progress/                        barre segmentée (inputs: steps, statuses, current, progress ; output: stepClick)
├── steps/
│   ├── exhibitor-step/
│   ├── services-step/                    les 3 cartes Oui/Non + sous-formulaires
│   │   └── service-question-card/        carte réutilisable (icône, question, Oui/Non, contenu projeté via <ng-content>)
│   ├── participation-step/
│   └── summary-step/
└── registration-done/
```

- État avec **signals** (`currentStep`, `maxReached`, `submitted`) si le projet utilise déjà les signals, sinon propriétés simples.
- `FormGroup` racine : `{ exhibitor, services: { wantStand, wantConference, wantWorkshop, stand, conferences: FormArray, workshops: FormArray }, participation, consents }`.
- `stepStatus(i)` et `stepProgress()` sont des `computed` / getters purs, testables unitairement.
- Payload construit dans une fonction pure `toRegistrationRequest(formValue)` qui **omet** les prestations à Non et met `offer`/`modePaymentMeals` à `null` si non pertinents.

Payload attendu (adapte aux DTO existants) :

```json
{
  "exhibitor": { "firstName": "", "lastName": "", "email": "", "phoneNumber": "", "language": "fr",
                 "homeAddress": { }, "differentBillingAddress": false, "billingAddress": null, "newsletter": true },
  "participation": { "therapistName": "", "nbMeal1": 0, "nbMeal2": 0, "nbMeal3": 0,
                     "modePaymentMeals": null, "invoiceSendingMethod": "EMAIL",
                     "hasOffer": false, "offer": null, "additionnalInformation": "",
                     "acceptedChart": true, "acceptedContract": true },
  "stands": [ { "description": "", "dimension": { "id": "…" }, "category": "THERAPIST", "subCategories": [],
                "nbTable": 1, "nbChair": 2, "needElectricity": false, "shared": false,
                "website": "", "instagram": "", "facebook": "", "urlPicture": "" } ],
  "conferences": [ { "title": "", "description": "" } ],
  "workshops": []
}
```

---

## 9. Backend (Spring Boot / JHipster)

Vérifie d'abord s'il existe un endpoint public d'inscription. Sinon :

- `POST /api/public/events/{eventId}/registrations` (accès anonyme dans la config de sécurité, protection anti-abus : rate limiting ou captcha si déjà présent dans le projet).
- `GET /api/public/events/{eventId}/dimensions` pour le select Dimension.
- DTO d'entrée dédié (`RegistrationRequestDTO`) qui **ne contient aucun des champs de la section 3** ; ne jamais réutiliser les DTO admin (ils exposent `status`, `extraInformation`, etc.).
- Dans un service transactionnel :
    - Retrouver l'exposant par e-mail (insensible à la casse). S'il existe, ne pas écraser silencieusement ses données (selon la règle métier existante ; à défaut, créer et laisser `duplicateDetected` être géré par la logique déjà présente).
    - Créer `Participation` avec `status = IN_VERIFICATION`, `registrationDate = now`, lien vers l'édition et l'exposant.
    - Créer stands / conférences / ateliers avec `status = IN_VERIFICATION`, liés à la participation.
    - Refuser une deuxième participation du même exposant sur la même édition (ou suivre la règle existante).
- Validation Bean (`@NotBlank`, `@Email`, `@Size(max=500)`, `@AssertTrue` sur les consentements, règles conditionnelles dans le service).
- Si un mécanisme d'e-mail existe, envoyer l'accusé de réception dans la langue choisie.

---

## 10. Style

- **Utilise le thème du projet** (variables SCSS / design tokens PrimeNG / Bootstrap) pour couleurs, rayons, typographies. La maquette utilise un accent terre cuite `#b4532a` uniquement pour illustrer ; remplace-le par la couleur primaire du projet.
- Garder l'esprit de la maquette : colonne centrée (~660 px), titre d'étape en grand (serif si le projet en a une, sinon la police titre du projet), beaucoup d'air, champs hauts (~48 px), coins arrondis, cartes Oui/Non avec bordure d'accent et halo léger quand Oui.
- Animations courtes (≤ 300 ms) à l'ouverture des cartes ; respecter `prefers-reduced-motion`.

Repères de la maquette (à mapper sur les tokens du projet) :

| Usage | Valeur maquette |
|---|---|
| Accent / accent clair / fond accent | `#b4532a` / `#e3a383` / `#f8e7de` |
| Texte / texte secondaire / bordures / fond champ | `#1f1d1a` / `#6b655d` / `#e7e0d6` / `#fbfaf7` |
| Rayon carte / champ / bouton | 20 px / 11 px / 12 px |
| Rail de progression | 7 px de haut, arrondi complet |

---

## 11. Accessibilité

- Barre de progression : `<nav aria-label="Étapes de l'inscription">`, chaque segment est un `<button>` avec `aria-current="step"` sur l'étape courante et un libellé complet (« Étape 2 sur 4 : Prestations, en cours »).
- Oui/Non : `role="radiogroup"` avec `aria-labelledby` pointant la question ; vrais `input type="radio"`.
- Erreurs liées aux champs via `aria-describedby` ; focus sur le premier champ en erreur.
- Contraste AA sur tous les textes d'état.

---

## 12. Plan de mise en œuvre (une PR par point si possible)

1. Endpoint(s) public(s) + DTO + service + tests d'intégration backend.
2. Route publique + conteneur + `registration-form.service` + barre segmentée (avec tests unitaires de `stepStatus`, `jump`, `stepProgress`).
3. Étape 1 (réutilise `app-address-form`).
4. Étape 2 (carte question réutilisable, FormArray conférences/ateliers, chips).
5. Étape 3 (compteurs, validateurs conditionnels).
6. Récap + consentements + envoi + écran de confirmation + gestion d'erreur serveur (`app-alert-error`).
7. Passe mobile + accessibilité + clés i18n dans toutes les langues.

---

## 13. Critères d'acceptation

- [ ] Aucun champ de la section 3 n'apparaît dans le DOM ni dans le payload ; le serveur ignore/refuse ces champs s'ils sont envoyés.
- [ ] Les 4 segments sont cliquables ; sauter en avant s'arrête sur la première étape invalide avec ses erreurs visibles.
- [ ] Un segment déjà validé puis rendu invalide passe à l'état « À compléter ».
- [ ] Aucun sur-titre au-dessus du `h2` de l'étape (bureau et mobile).
- [ ] Répondre Oui déplie immédiatement le formulaire de la prestation ; Non le replie et l'exclut du payload.
- [ ] On peut ajouter/retirer plusieurs conférences et ateliers.
- [ ] `modePaymentMeals` n'est exigé que si au moins un repas ; `offer` que si `hasOffer` ; `billingAddress` que si `differentBillingAddress`.
- [ ] Les consentements sont obligatoires pour envoyer.
- [ ] À 375 px : barre en haut et boutons en bas restent visibles au scroll, pas de scroll horizontal, pas de zoom iOS au focus.
- [ ] Toutes les nouvelles chaînes sont traduites dans chaque langue de `i18n/`.
- [ ] Tests : unitaires (navigation, statuts, payload), intégration backend (création + statuts serveur), e2e du parcours complet si le projet a Cypress/Playwright.

## 14. À ne pas faire

- Copier le CSS ou le JS vanilla de la maquette dans le projet.
- Réutiliser les composants `admin/*-update` ou leurs DTO pour le public.
- Afficher des prix, montants ou tout élément de facturation.
- Ajouter une étape par prestation (les prestations restent dans l'étape 2, en cartes dépliables).