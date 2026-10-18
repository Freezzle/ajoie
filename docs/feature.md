# Remplacer la page d'accueil publique

> Brief pour GitHub Copilot (mode agent).
> Objectif : remplacer la page d'accueil publique actuelle par la nouvelle page décrite ci-dessous.
> Le fichier HTML de référence fourni avec ce brief est la **source de vérité visuelle**. En cas de doute, reproduire ce qu'il montre.

---

## 0. Réglages à choisir avant de lancer

```
VARIANTE_HERO   = A          # A = centré | B = plan de salle | C = mosaïque des modules
NOM_PRODUIT     = salon-en-ligne    # nom provisoire, doit être modifiable à un seul endroit
FICHIER_REF     = docs/landing/esalon-sauge-a-centre.html
```

Fichiers de référence (à placer dans `docs/landing/`) :

| Variante | Fichier |
| --- | --- |
| A | `esalon-sauge-a-centre.html` |
| B | `esalon-sauge-b-plan.html` |
| C | `esalon-sauge-c-modules.html` |

Seul le haut de page (hero) diffère entre les variantes. Toutes les autres sections sont identiques.

---

## 1. Ce que tu dois faire

1. **Analyser le projet existant** avant de modifier quoi que ce soit :
  - trouver le composant de la page d'accueil publique actuelle et la route qui l'affiche (souvent `''` dans le routing) ;
  - identifier la stack réellement utilisée (version d'Angular, de PrimeNG, présence de Tailwind ou non, thème PrimeNG, composants standalone ou modules) ;
  - repérer les liens existants vers la connexion ou l'espace connecté, qui ne doivent pas disparaître.
2. **Créer un nouveau composant** de page d'accueil (par exemple `features/landing/landing-page`) en respectant les conventions du projet : standalone ou non, structure de dossiers, nommage, SCSS ou Tailwind.
3. **Brancher la route** de la page d'accueil sur ce nouveau composant.
4. **Supprimer l'ancien composant d'accueil** seulement s'il n'est plus utilisé ailleurs. Sinon, le laisser et le signaler.
5. **Ne rien casser** : les autres routes, l'authentification, les guards et la mise en page de l'espace connecté restent inchangés. La nouvelle page ne doit pas hériter du menu ou de la barre latérale de l'application connectée.
6. Vérifier que le projet **compile sans erreur ni warning nouveau** (`ng build`) et que les tests existants passent.

### Règles techniques

- Utiliser **les composants PrimeNG déjà présents dans le projet** quand ils correspondent :
  - `p-button` pour les boutons ;
  - `p-tag` pour les pastilles « Prêt » / « Bientôt » ;
  - `pInputText` et `p-select` (ou `p-dropdown` selon la version) pour le formulaire ;
  - `p-message` ou un simple texte pour le message de confirmation.
- Les cartes de modules peuvent être de simples `div` stylées. `p-card` n'est pas obligatoire si son padding gêne le rendu.
- Les couleurs passent par des **variables CSS locales au composant** (section 3). Ne pas modifier le thème global de l'application.
- Les icônes peuvent être des **SVG inline** copiés depuis le fichier de référence, ou des PrimeIcons équivalentes (table en section 6).
- Les textes de la page doivent être regroupés dans **une constante ou un fichier** pour faciliter les modifications (nom du produit, liste des modules, liste « Pour qui ? »).
- La page doit être **accessible** : vrais boutons, `label` reliés aux champs, `aria-label` sur les illustrations, contrastes suffisants, navigation au clavier.
- Les fichiers HTML de référence ne doivent **pas** être servis par l'application : ils restent dans `docs/`.

---

## 2. Structure de la page

Dans l'ordre, de haut en bas :

1. Bandeau d'information « en construction »
2. En-tête (logo, navigation, bouton)
3. Hero (selon `VARIANTE_HERO`)
4. Section « Tout ce qu'il faut pour gérer un salon » (les 9 modules)
5. Section « Pour qui ? »
6. Section « La plateforme ouvre bientôt » (formulaire)
7. Pied de page

Largeur de contenu maximale de **1100 px**, centrée, avec une marge latérale de **20 px**. Les sections sont espacées de **64 px** verticalement. La police est **Inter** (400, 500, 600, 700), ou la police déjà utilisée par l'application si elle est proche.

---

## 3. Couleurs (variables locales au composant)

```css
--bg:      #f7f6f1;  /* fond de page, crème */
--surface: #ffffff;  /* cartes, en-tête */
--line:    #e4e2d9;  /* bordures */
--txt:     #2d3a2e;  /* texte principal */
--mut:     #6b7468;  /* texte secondaire */
--pri:     #5b7f5e;  /* vert sauge, couleur principale */
--pri-d:   #46664a;  /* vert sauge foncé (survol) */
--pri-l:   #e8efe5;  /* vert sauge très clair (fonds d'icônes, pastilles) */
--warm:    #c98b5b;  /* accent chaud (« Bientôt », « En construction ») */
--warm-l:  #f6ebe1;  /* accent chaud très clair */
```

Si le thème PrimeNG du projet a une couleur primaire proche, il est possible de mapper `--pri` dessus. Sinon, garder ces valeurs.

Arrondis : 8 px pour les boutons et les champs, 12 px pour les cartes, 14 px pour le bloc du formulaire, 99 px pour les pastilles.

---

## 4. Contenu et comportement, section par section

### 4.1 Bandeau « en construction »

- Pleine largeur, fond `--warm-l`, texte brun foncé, 14 px, centré.
- Texte : « 🌱 La plateforme est en cours de construction. » suivi d'un lien souligné **« Être prévenu de l'ouverture »** qui fait défiler jusqu'à la section du formulaire.

### 4.2 En-tête

- Fond blanc, bordure basse fine, hauteur de 66 px.
- **À gauche** : le logo, une pousse verte dans un cercle vert clair (SVG du fichier de référence). À côté, `NOM_PRODUIT` en gras et en dessous, en petit et atténué, « Gestion de salons et d'exposants ». Ce sous-titre est masqué sous 480 px.
- **Au centre** : les liens « Fonctionnalités », « Pour qui ? » et « Ouverture », qui font défiler jusqu'aux sections. Ils sont masqués sous 860 px.
- **À droite** : un bouton plein vert « Être prévenu » qui fait défiler jusqu'au formulaire, sans retour à la ligne.
- S'il existe aujourd'hui un lien **« Connexion »** vers l'espace connecté, le conserver dans l'en-tête comme bouton secondaire (contour vert).

### 4.3 Hero (commun aux 3 variantes)

- Pastille vert clair : « Pour les organisateurs de salons ».
- Titre H1 (32 à 50 px selon l'écran, gras) : **« Gérez votre salon et vos exposants, simplement. »**
- Paragraphe (18 px, atténué, 560 px de large maximum) : « Inscriptions, emplacements, conférences, tâches, factures et emails : une seule plateforme pour organiser chaque édition de votre salon, sans tableurs ni échanges dispersés. »
- Deux boutons :
  - **« Être prévenu de l'ouverture »**, plein vert, qui défile jusqu'au formulaire ;
  - **« Découvrir les modules »**, contour vert, qui défile jusqu'à la section des modules.

#### Variante A : centré

- Tout le hero est centré, sur une seule colonne. Pas d'illustration.
- Sous les boutons, après un trait fin horizontal, quatre repères alignés sur une ligne (qui passent à la ligne sur mobile), chacun précédé d'une coche verte :
  « 8 modules déjà prêts », « Toutes vos éditions au même endroit », « Factures en CHF », « Espace exposant à venir ».
- Le nombre « 8 » est calculé à partir de la liste des modules (modules prêts).

#### Variante B : plan de salle

- Deux colonnes : le texte à gauche, une illustration à droite (une seule colonne sous 860 px, l'illustration passe en dessous).
- L'illustration est une **carte blanche** contenant un **plan de salle en SVG**, purement illustratif, sans chiffre ni nom de salon :
  - le contour de la salle ;
  - une rangée haute de 8 stands et deux rangées de 7 stands, séparées par l'inscription « ALLÉE CENTRALE » ;
  - des stands « attribués » (fond vert clair, bordure verte) et quelques stands « libres » (fond blanc, bordure verte en pointillés) ;
  - en bas, un « Espace conférences » (teinte chaude) et une « Buvette » (gris clair), plus une petite barre verte « Entrée ».
- Sous le plan : une légende (« Attribué », « Libre ») à gauche et, à droite, le texte « Survolez un stand ».
- **Interaction** : au survol (ou au clic sur mobile), le stand se remplit en vert et le texte de droite devient « Stand A4 · attribué » ou « Stand B2 · libre ».
- Reprendre le SVG du fichier de référence tel quel, en le passant en template Angular.

#### Variante C : mosaïque des modules

- Deux colonnes : le texte à gauche, une mosaïque à droite (une seule colonne sous 860 px).
- La mosaïque est une grille de **3 × 3 tuiles** (2 colonnes sous 560 px), une par module, dans l'ordre de la section 4.4. Chaque tuile est blanche, avec une bordure fine, l'icône du module dans un carré arrondi vert clair et le nom du module en gras.
- La tuile « Profil exposant » a une bordure en pointillés, un fond d'icône chaud et la mention « Bientôt » en petit.
- **Interaction** : au clic sur une tuile, la page défile en douceur jusqu'à la carte du même module dans la section 4.4, qui est mise en évidence (bordure verte et halo vert clair) pendant environ 1,5 seconde.

### 4.4 Section « Tout ce qu'il faut pour gérer un salon » (ancre `#fonctions`)

- Titre H2 : « Tout ce qu'il faut pour gérer un salon ».
- Sous-titre : « 8 modules déjà prêts, reliés entre eux : une information saisie une fois est réutilisée partout. » Le nombre est calculé.
- **Filtres** : trois pastilles-boutons « Tous (9) », « Prêts (8) » et « Bientôt (1) ». Celle qui est active est pleine verte, les autres blanches avec une bordure. Un clic filtre les cartes affichées. Les nombres sont calculés.
- **Grille de cartes** : 3 colonnes, 2 sous 860 px et 1 sous 560 px. Chaque carte est blanche, avec une bordure fine et une bordure verte au survol. Elle contient l'icône dans un carré arrondi vert clair, le titre suivi de sa pastille, puis la description en texte atténué.
- Une carte « Bientôt » a une bordure en pointillés, un fond d'icône chaud (`--warm-l`) et une pastille chaude.

Liste des modules, dans cet ordre :

| # | Titre | Statut | Icône (PrimeIcons) | Description |
| --- | --- | --- | --- | --- |
| 1 | Inscriptions | Prêt | `pi-check-square` | Formulaire en ligne personnalisable, validation des dossiers et nombre maximum d'exposants par activité. |
| 2 | Exposants et participation | Prêt | `pi-users` | La participation de chaque exposant par édition : stand, co-exposants, prestations et statut du dossier. |
| 3 | Emplacements de stands | Prêt | `pi-th-large` | Attribuez les emplacements et les surfaces, et voyez d'un coup d'œil les stands libres et réservés. |
| 4 | Conférences et ateliers | Prêt | `pi-calendar` | Planifiez les créneaux, les salles et les intervenants, sans chevauchement. |
| 5 | Tâches opérationnelles | Prêt | `pi-list-check` (ou `pi-list`) | Commandes, logistique, impressions : chaque tâche avec son responsable, son échéance et ses sous-tâches. |
| 6 | Emails | Prêt | `pi-envelope` | Modèles, envois groupés ciblés et messages automatiques selon l'étape de chaque exposant. |
| 7 | Annuaire clients | Prêt | `pi-address-book` (ou `pi-book`) | Exposants, partenaires et fournisseurs réunis, avec leur historique d'une édition à l'autre. |
| 8 | Factures | Prêt | `pi-file` | Factures et acomptes générés depuis les prestations, suivi des paiements et relances. |
| 9 | Profil exposant | Bientôt | `pi-user` | Chaque exposant met à jour son profil et ses documents, et suit sa participation depuis son propre accès. |

### 4.5 Section « Pour qui ? » (ancre `#pourqui`)

- Titre H2 : « Pour qui ? ».
- Sous-titre : « Pour toutes celles et ceux qui organisent des salons, petits ou grands. »
- Trois blocs côte à côte (2 puis 1 colonne sur petit écran), fond vert clair, sans bordure, coins arrondis :

| Titre | Texte |
| --- | --- |
| Associations et comités | Des bénévoles qui organisent un salon chaque année et veulent gagner du temps sur l'administratif. |
| Organisateurs indépendants | Plusieurs salons, foires ou marchés à gérer avec la même rigueur, édition après édition. |
| Communes et lieux d'accueil | Une vue claire sur les exposants, les emplacements, les prestations et les paiements. |

### 4.6 Section « La plateforme ouvre bientôt » (ancre `#bientot`)

- Un grand bloc blanc avec une bordure fine et des coins arrondis, sur deux colonnes (une seule sous 860 px).
- **À gauche** :
  - une pastille chaude « En construction » ;
  - le titre H2 « La plateforme ouvre bientôt » ;
  - le texte « Nous finalisons les derniers détails. Laissez votre adresse : nous vous écrirons dès l'ouverture, avec un accès anticipé pour les premiers organisateurs inscrits. »
- **À droite**, un formulaire réactif (Reactive Forms) :
  - le champ « Adresse email », obligatoire, avec validation email et le placeholder `vous@exemple.ch` ;
  - la liste « Taille de votre salon » avec les options « Moins de 50 exposants », « 50 à 150 exposants », « Plus de 150 exposants » et « Plusieurs salons par an » ;
  - le bouton plein vert « Me prévenir », sur toute la largeur.
- **Comportement** :
  - si l'email est invalide, afficher sous le bouton, en rouge doux : « Merci d'indiquer une adresse email valide. » ;
  - si tout est valide, afficher en vert : « Merci ! Nous vous écrirons à {email} dès l'ouverture. », puis vider le formulaire.
- **Envoi des données** : chercher dans le projet un endpoint ou un service existant pour enregistrer un contact ou une inscription à une liste d'attente.
  - S'il en existe un, l'utiliser.
  - Sinon, **ne pas inventer de backend**. Créer un service `WaitlistService` avec une méthode `subscribe(email, size)` qui ne fait encore rien de réel, marquée d'un commentaire `// TODO: brancher sur l'API (liste d'attente)`, et le signaler dans le résumé final.

### 4.7 Pied de page

- Bordure haute fine, texte de 14 px atténué, sur une ligne : « © {année courante} {NOM_PRODUIT} · Plateforme de gestion de salons » à gauche et « Site en construction » à droite.

---

## 5. Responsive (points de rupture)

| Largeur | Changements |
| --- | --- |
| ≤ 860 px | Navigation de l'en-tête masquée. Hero, bloc formulaire et cartes passent respectivement à 1, 1 et 2 colonnes. « Pour qui ? » passe à 2 colonnes. |
| ≤ 560 px | Cartes des modules et « Pour qui ? » sur 1 colonne. Mosaïque (variante C) sur 2 colonnes. |
| ≤ 480 px | Sous-titre du logo masqué. |

Aucun défilement horizontal ne doit apparaître à 360 px de large.

---

## 6. Critères d'acceptation

- [ ] La route d'accueil affiche la nouvelle page, conforme visuellement au fichier `FICHIER_REF`.
- [ ] Seule la variante de hero choisie (`VARIANTE_HERO`) est implémentée.
- [ ] Les 9 modules apparaissent dans l'ordre, avec le bon statut. Les filtres Tous, Prêts et Bientôt fonctionnent et leurs nombres sont calculés.
- [ ] Tous les liens d'ancre (bandeau, en-tête, boutons du hero) défilent vers la bonne section.
- [ ] Le formulaire valide l'email, affiche les bons messages et passe par un service, réel ou marqué TODO.
- [ ] Le nom du produit et les textes sont modifiables à un seul endroit.
- [ ] Le lien vers la connexion ou l'espace connecté, s'il existait, est toujours accessible.
- [ ] Aucune autre page de l'application n'est modifiée visuellement. Le thème global est inchangé.
- [ ] Aucun défilement horizontal entre 360 px et 1440 px.
- [ ] `ng build` passe, ainsi que les tests existants.

---

## 7. Résumé attendu à la fin

Termine par un court résumé qui contient :
- les fichiers créés, modifiés et supprimés ;
- la route modifiée ;
- ce qui reste à faire (endpoint de la liste d'attente, nom définitif du produit…) ;
- tout écart volontaire par rapport au fichier de référence, et sa raison.