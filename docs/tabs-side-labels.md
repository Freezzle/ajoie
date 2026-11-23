# Composants `app-tabs` et `app-side-labels` — consignes pour l'IA du projet

> Maquette de référence : `onglets-etiquettes.html` (sélecteur de fiche + bascule Desktop / Tablette / Mobile).
> Projet : `src/main/webapp/app/shared/components/` (Angular standalone, signals, OnPush, ngx-translate, PrimeIcons).
> Modèle à suivre pour l'écriture : `shared/components/card/` (`card.component.ts/.html/.scss`).

---

## 0. Règles générales

1. **Styles : réutiliser d'abord ceux du projet.** Avant d'écrire une couleur, une taille ou un rayon, chercher la variable existante dans `content/scss/_variables.scss`, `_global.scss` et `card.component.scss`. Les valeurs de ce document ne servent que **de secours** quand aucune variable ne convient.
2. **Ne pas recopier les valeurs propres à l'app-card.** `#d9dee4`, `#fafbfc` et `#3e4c59` sont aujourd'hui des valeurs en dur dans `card.component.scss`. Les sortir en variables partagées (voir §1), puis faire lire ces variables à `app-card`, `app-tabs` et `app-side-labels`.
3. **Même écriture que `CardComponent`** : `standalone: true`, `ChangeDetectionStrategy.OnPush`, `input()` / `model()` / `output()` / `computed()` / `contentChildren()`, libellés via `labelKey` + `TranslatePipe`, icônes PrimeIcons (`pi pi-…`).
4. **Réactif à la largeur de la box, pas de l'écran.** Utiliser `container-type: inline-size` sur l'hôte et `@container` dans le SCSS. Le même composant doit s'adapter en pleine page comme dans une colonne étroite. Seuil étroit : **640 px**.
5. **Aucun déplacement de logique métier.** Ces composants ne gèrent que l'affichage. Les cartes injectées restent des `app-card` existantes.

---

## 1. Jetons de design

### 1.1 Existants dans le projet (à utiliser)

| Variable | Valeur | Usage |
|---|---|---|
| `--app-surface` | `#fff` | fond des onglets actifs, du contenu, du panneau |
| `--app-text` / `--app-text-muted` | `#575757` / `#8a8a8a` | texte / libellés secondaires, icônes inactives |
| `--app-primary` | `#325d88` | liseré de l'onglet actif, pastille ouverte, liens |
| `--app-primary-soft` / `--app-primary-line` | `#e8eef5` / `#a8bfd6` | survol de menu, compteur sur onglet actif |
| `--app-warning` / `--app-danger` | `#e89d0e` / `#fd7658` | badges alerte / erreur |
| `--app-warn` / `--app-warn-soft` | `#8a5d00` / `#fbefd0` | bandeau de motif d'alerte |
| `--app-danger-soft` | `#f9dedc` | bandeau de motif d'erreur |
| `--app-fs-xs` / `--app-fs-sm` / `--app-fs-md` | `.72rem` / `.82rem` / `.875rem` | méta / libellés d'onglets / texte |
| `--app-gap-*`, `--app-radius-*` | — | espacements et rayons si une valeur correspond |

### 1.2 À créer (sortis de `card.component.scss`)

À ajouter dans le mixin `tokens()` de `_variables.scss`, puis à utiliser dans `card.component.scss` à la place des valeurs en dur :

```scss
--app-card-border: #d9dee4;        // bordure carte / onglets / pastilles
--app-card-hd-bg: #fafbfc;         // bande d'en-tête carte / onglets inactifs / pastilles
--app-card-title: #3e4c59;         // titre carte / libellé onglet
--app-card-line: #e9edf1;          // séparateurs internes (pied de carte, lignes)
--app-card-action-border: #d1d5db; // bouton d'action 26 px
--app-card-hover: #f7f8fa;         // survol bouton d'action / onglet / pastille
--app-card-radius: 4px;
```

### 1.3 Valeurs de secours utilisées dans la maquette

À n'utiliser que si rien n'existe :
- ombre du panneau : `-8px 10px 30px rgba(16,24,40,.16)` ;
- ombre du menu « Plus » : `0 8px 24px rgba(16,24,40,.14)` ;
- info-bulle : fond `#1f2933`, texte `#fff`, sous-texte `#cbd2d9`.

---

## 2. Badge de notification partagé (`app-notif-badge`)

Utilisé par les onglets, le bouton « Plus » et les pastilles. À créer en premier.

```ts
export type NotifType = 'count' | 'info' | 'warning' | 'danger';
export interface Notif {
  type: NotifType;
  value?: number | string; // 3, 12, '!' … (absent = point)
  dot?: boolean;           // force l'affichage en point
}
```

**Rendu :**
- **`count`** : style `app-card-tag`.
    - Rectangle de 18 px, rayon 3 px, bordure `--app-card-border`, fond blanc, texte `--app-text-muted`, graisse 400.
    - Sur l'onglet actif : fond `--app-primary-soft`, bordure `--app-primary-line`, texte `--app-primary`.
- **`info` / `warning` / `danger`** : pastille ronde de 17 px, texte blanc en 700, taille 10.5 px.
    - Fond : `--app-primary` pour info, `--app-warning` pour warning, `--app-danger` pour danger.
    - **Point** : 9 × 9 px, sans texte.
- **Animation (sur les pastilles uniquement)** : `warning` et `danger` battent doucement (halo qui s'élargit, 2,4 s / 1,8 s). L'animation est désactivée sous `prefers-reduced-motion`.

**Accessibilité :** le badge est décoratif (`aria-hidden="true"`). Le sens est porté par le libellé accessible du bouton, par exemple « Inscription, 1 alerte ».

---

## 3. `app-tabs` — onglets responsives avec regroupement « Plus » et cadre de contenu

### 3.1 Rôle

- Affiche une rangée d'**intercalaires espacés**, chacun avec une icône, un libellé et un badge facultatif.
- Les onglets qui ne tiennent pas en largeur sont **regroupés dans un menu « Plus »**.
- Fournit le **cadre** (bordure) dans lequel l'appelant injecte le contenu de l'onglet actif : en général des `app-card`.

### 3.2 API

```ts
export interface AppTab {
  key: string;
  labelKey: string;       // clé i18n
  icon?: string;          // 'pi pi-star'
  badge?: Notif | null;
  disabled?: boolean;
  hidden?: boolean;       // retiré du rendu (droits, etc.)
}

@Component({ selector: 'app-tabs', standalone: true, changeDetection: OnPush, … })
export class TabsComponent {
  readonly tabs = input.required<AppTab[]>();
  readonly active = model<string>();          // [(active)]="tab"
  readonly ariaLabelKey = input<string>('global.sections');
  readonly showNotifs = input<boolean>(true); // les compteurs restent visibles
}

/** Contenu d'un onglet, rendu uniquement quand l'onglet est actif. */
@Directive({ selector: 'ng-template[appTabPanel]', standalone: true })
export class TabPanelDirective {
  readonly key = input.required<string>({ alias: 'appTabPanel' });
  constructor(public readonly tpl: TemplateRef<unknown>) {}
}
```

**Utilisation :**

```html
<app-tabs [tabs]="tabs" [(active)]="tab">
  <ng-template appTabPanel="ess">
    <app-card titleKey="…" [actions]="…"> … </app-card>
    <app-card titleKey="…"> … </app-card>
  </ng-template>
  <ng-template appTabPanel="ins"> … </ng-template>
</app-tabs>
```

L'onglet actif peut aussi être synchronisé avec l'URL (`?tab=ins`) par l'appelant ; le composant n'en a pas besoin.

### 3.3 Structure du template

```html
<div class="app-tabs" #root>
  <div class="app-tabs-list" role="tablist" [attr.aria-label]="ariaLabelKey() | translate" #list>
    @for (t of visibleTabs(); track t.key) {
      <button type="button" role="tab" class="app-tab"
              [id]="'tab-' + t.key" [attr.aria-controls]="'tp-' + t.key"
              [attr.aria-selected]="t.key === active()" [tabIndex]="t.key === active() ? 0 : -1"
              [disabled]="t.disabled" [hidden]="overflowKeys().has(t.key)"
              (click)="select(t)" (keydown)="onKey($event)">
        @if (t.icon) { <i [class]="t.icon" aria-hidden="true"></i> }
        <span>{{ t.labelKey | translate }}</span>
        @if (t.badge) { <app-notif-badge [notif]="t.badge" /> }
      </button>
    }
    <div class="app-tabs-more" [hidden]="!overflowKeys().size">
      <button type="button" aria-haspopup="menu" [attr.aria-expanded]="menuOpen()" (click)="toggleMenu()">
        <i class="pi pi-ellipsis-h" aria-hidden="true"></i><span>{{ 'global.more' | translate }}</span>
        <app-notif-badge [notif]="moreBadge()" />
      </button>
      @if (menuOpen()) {
        <div class="app-tabs-menu" role="menu"> <!-- un bouton par onglet caché : icône + libellé + badge --> </div>
      }
    </div>
  </div>

  <div class="app-tabs-panel" role="tabpanel" [id]="'tp-' + active()" [attr.aria-labelledby]="'tab-' + active()" tabindex="0">
    <ng-container [ngTemplateOutlet]="activePanel()?.tpl" />
  </div>
</div>
```

### 3.4 Regroupement « Plus » (algorithme, *priority+*)

À recalculer avec un `ResizeObserver` sur la liste (et après chaque changement d'onglet actif ou de badge). Le calcul se fait sur le **DOM réel**, jamais sur des largeurs estimées.

1. Tout afficher et masquer « Plus ». Si `list.scrollWidth <= list.clientWidth`, c'est terminé.
2. Afficher « Plus » **avec son badge final**. Ne jamais mesurer « Plus » sans badge puis en ajouter un ensuite : c'était la cause du débordement.
3. Masquer les onglets **depuis la fin**, un par un, **sans jamais masquer l'onglet actif**. Mettre à jour le badge de « Plus » à chaque étape, et s'arrêter dès que tout tient.
4. **Seconde passe** : réafficher, dans l'ordre, les onglets masqués tant qu'ils tiennent. S'arrêter au premier qui ne tient pas, pour que l'ordre visible reste continu.
5. **Badge de « Plus »** : un point `warning` si un onglet caché porte une alerte (`warning` ou `danger`), sinon un `count` avec le nombre d'onglets cachés.
6. **Garantie** : à la fin, `scrollWidth <= clientWidth + 1`. Rien ne dépasse jamais du cadre.

```ts
private fit(): void {
  const list = this.list().nativeElement;
  const fits = () => list.scrollWidth <= list.clientWidth + 1;
  const hidden = new Set<string>();
  this.overflowKeys.set(hidden); // tout visible
  // … appliquer de façon synchrone (renderer) puis mesurer, voir étapes 2 à 6
}
```

Le recalcul se fait hors de la zone Angular (`afterNextRender` + `ResizeObserver`, ou `NgZone.runOutsideAngular`). Seul le `Set` final est publié dans un signal.

### 3.5 Styles (variante retenue : « intercalaires espacés »)

- **Liste** : `display:flex; align-items:flex-end; gap:4px; min-width:0;`. Le premier onglet est collé au bord gauche du cadre, et « Plus » au bord droit (`margin-left:auto`).
- **Onglet inactif** :
    - hauteur 38 px, padding `0 14px` ;
    - fond `--app-card-hd-bg`, bordure `--app-card-border` sans bordure basse, rayon `4px 4px 0 0`, avec `box-shadow: inset 0 -1px 0 var(--app-card-border)` ;
    - libellé en `--app-fs-sm`, 700, **capitales**, `letter-spacing:.04em`, couleur `--app-card-title` (même langage que le titre d'`app-card`) ;
    - icône en `--app-text-muted`.
- **Survol** : fond `--app-card-hover`, icône `--app-primary`.
- **Onglet actif** :
    - fond `--app-surface`, texte et icône `--app-primary`, hauteur 41 px ;
    - liseré haut de 2 px `--app-primary` (`::before`, qui se déploie en `scaleX`) ;
    - un `::after` blanc de 2 px recouvre la bordure haute du cadre, pour que l'onglet **se soude au contenu**.
- **Onglet désactivé** : `opacity:.45; cursor:not-allowed`.
- **Bouton « Plus »** : même aspect qu'un onglet inactif. Son menu fait au moins 220 px, avec une bordure `--app-card-border`, un rayon de 4 px et une ombre. Ses entrées sont en `--app-fs-md` 400 et passent en `--app-primary-soft` au survol.
- **Cadre du contenu (`.app-tabs-panel`)** :
    - bordure `--app-card-border` ;
    - **coins du haut droits, coins du bas à 4 px** (`border-radius:0 0 4px 4px`) ;
    - padding `14px 16px` (celui de `.app-card-bd`) ;
    - les `app-card` injectées gardent leur `margin-bottom:14px`, la dernière à 0.

### 3.6 Box étroite (`@container (max-width: 640px)`)

- Onglets : padding `0 9px`, `gap:5px`, `letter-spacing:.02em`.
- L'icône n'est gardée **que sur l'onglet actif**.
- Les badges `count` sont masqués ; les alertes deviennent des **points** de 8 px.
- « Plus » devient l'icône ⋯ suivie du compteur (le libellé est masqué).
- Le cadre du contenu passe à un padding de 12 px.

Résultat attendu à 390 px : 2 onglets visibles, puis « ⋯ 5 ».

### 3.7 Accessibilité

- Motif WAI-ARIA *tabs* : `tablist`, `tab`, `tabpanel`, avec `aria-selected`, `aria-controls` et `aria-labelledby`.
- Clavier : ← → passent d'un onglet à l'autre en boucle, et Début / Fin vont au premier ou au dernier. Les onglets désactivés sont sautés. Si l'onglet atteint est dans « Plus », il est rendu visible (l'algorithme garde l'onglet actif) et reçoit le focus.
- Le menu « Plus » se ferme avec Échap et sur un clic extérieur, et le focus revient sur « Plus ».

---

## 4. `app-side-labels` — pastilles latérales et panneau attaché

### 4.1 Rôle

- Une colonne de **pastilles** posée **en position absolue sur le bord droit de la box hôte**, et non de la page. Chaque pastille a une icône, un libellé (en info-bulle) et une notification facultative.
- Au clic, un **panneau** s'ouvre, attaché à la colonne. Ce panneau est lui-même un `app-card`, et il n'affiche **que le contenu de la pastille cliquée** : pas de bascule vers les autres pastilles dans le panneau.
- Usage métier : Exposant, Participation, Suivi interne, Activité… selon l'entité.

### 4.2 API

```ts
@Component({ selector: 'app-side-labels', standalone: true, changeDetection: OnPush, … })
export class SideLabelsComponent {
  readonly open = model<string | null>(null);          // [(open)]="side"
  readonly anchor = input<HTMLElement | null>(null);   // élément sur lequel aligner le haut (ex. le cadre d'app-tabs)
  readonly labels = contentChildren(SideLabelComponent);
}

@Component({ selector: 'app-side-label', standalone: true, template: '<ng-template #content><ng-content /></ng-template>' })
export class SideLabelComponent {
  readonly key = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly icon = input.required<string>();            // 'pi pi-user'
  readonly badge = input<Notif | null>(null);
  readonly hintKey = input<string | null>(null);       // motif d'alerte (info-bulle + bandeau du panneau)
  readonly hintType = input<'warning' | 'danger' | 'info'>('warning');
  readonly summary = input<string | null>(null);       // sous-texte de l'info-bulle quand il n'y a pas d'alerte
  @ViewChild('content', { static: true }) content!: TemplateRef<unknown>;
}

/** Sur la box : position relative, conteneur de requêtes, colonne réservée à droite. */
@Directive({ selector: '[appSideLabelHost]', standalone: true, host: { class: 'app-side-host' } })
export class SideLabelHostDirective {}
```

**Utilisation :**

```html
<div class="box" appSideLabelHost>
  <app-tabs [tabs]="tabs" [(active)]="tab" #tabs> … </app-tabs>

  <app-side-labels [(open)]="side" [anchor]="tabs.panelElement">
    <app-side-label key="exp" icon="pi pi-user" labelKey="….exhibitor"
                    [badge]="{ type: 'warning', value: '!' }" hintKey="….duplicate">
      <app-card titleKey="…"> … </app-card>
    </app-side-label>
    <app-side-label key="suivi" icon="pi pi-comment" labelKey="….internal"
                    [badge]="note ? { type: 'info', dot: true } : null" hintKey="….noteFilled" hintType="info">
      <app-card titleKey="…"> … </app-card>
    </app-side-label>
  </app-side-labels>
</div>
```

### 4.3 Hôte (`.app-side-host`)

```scss
.app-side-host {
  position: relative;
  container-type: inline-size;
  --side-rail: 48px;                 // 44px en étroit
  padding-right: var(--side-rail);   // colonne réservée : les onglets et le contenu ne passent jamais dessous
}
```

- Les onglets et le cadre de contenu **s'arrêtent avant la colonne** : ils ne dépassent jamais du contenu qu'ils pilotent.
- Le haut de la colonne est **aligné sur le haut du cadre de contenu** (`anchor`), et non sur les onglets. Il est calculé en JS (`anchor.top - host.top`), exposé en `--side-top`, et recalculé avec un `ResizeObserver`.

### 4.4 Pastille

- Colonne `position:absolute; right:0; top:var(--side-top); width:36px; display:flex; flex-direction:column; gap:8px; z-index` au-dessus du contenu.
- Bouton de 36 × 36 : fond `--app-card-hd-bg`, bordure `--app-card-border`, rayon 4 px, icône de 15 px en `--app-card-title`.
- **Survol** : fond `--app-card-hover`, bordure `--app-primary-line`, icône `--app-primary`, ombre légère.
- **Badge** : en position absolue `top:-7px; right:-7px`, avec un anneau blanc de 2 px. Il est **entièrement visible** : pas d'`overflow:hidden` sur la pastille.
- **Info-bulle au survol et au focus clavier** :
    - placée à gauche, sans décaler la mise en page ;
    - fond `#1f2933` (secours), libellé en capitales 700 `--app-fs-sm`, puis sous-texte en `--app-fs-xs` : le motif d'alerte (`hintKey`) s'il y en a un, sinon `summary` ;
    - apparition après 80 ms ;
    - masquée en box étroite et quand la pastille est ouverte.
- **Pastille ouverte** :
    - elle se **raccorde au panneau** : fond blanc, bord gauche invisible, rayon `0 4px 4px 0`, largeur 44 px, `translateX(-8px)` ;
    - un liseré de 2 px `--app-primary` court sur son bord droit ;
    - `aria-expanded="true"`.

### 4.5 Panneau (= un `app-card`)

- Rendu **dans l'hôte**, en `position:absolute` :
    - `top:var(--side-top)` et `right:calc(var(--side-rail) - 4px)` ;
    - `width:min(400px, calc(100% - var(--side-rail) - 24px))` ;
    - `max-height` limitée à la fenêtre visible, avec `overflow:auto`.
- Bordure `--app-card-border`, rayon 4 px, ombre du panneau, apparition par un glissement de 10 px vers la gauche en 200 ms.
- **En-tête** :
    - bande `--app-card-hd-bg` collante (`sticky`) ;
    - icône de la pastille en `--app-primary`, puis `h6.app-card-title` avec le libellé de la pastille ;
    - à droite, un bouton de fermeture au format `app-card-action` (`pi pi-times`).
- **Bandeau de motif** (si la pastille porte une alerte et un `hintKey`) :
    - liseré gauche de 3 px, rayon 3 px, `--app-fs-sm` ;
    - `warning` : `--app-warn-soft` / `--app-warn` ; `danger` : `--app-danger-soft` ; `info` : `--app-primary-soft` / `--app-primary`.
- **Corps** : padding de `.app-card-bd`, puis le contenu projeté de la pastille, c'est-à-dire ses `app-card`.
- **Voile** : posé sur le contenu de la box seulement (pas sur la colonne des pastilles), `rgba(255,255,255,.6)`. Un clic sur le voile ferme le panneau.
- **Un seul panneau ouvert à la fois.** Cliquer sur la pastille ouverte le referme, et cliquer sur une autre pastille remplace le contenu.

### 4.6 Box étroite (`@container (max-width: 640px)`)

- `--side-rail: 44px` et pastilles de 34 px.
- Pastille ouverte : largeur 40 px, `translateX(-6px)`.
- Le panneau occupe toute la largeur du contenu : `left:0; right:calc(var(--side-rail) - 2px); width:auto`.
- Les en-têtes des cartes passent à un padding de 12 px (`.app-card-hd` / `.app-card-bd`).

### 4.7 Accessibilité

- Une pastille est un `button` avec `aria-label` (libellé, plus « 1 alerte » si besoin), `aria-expanded` et `aria-controls`.
- Panneau : `role="dialog"`, `aria-labelledby` vers son titre. À l'ouverture, le focus va sur le bouton Fermer.
- Échap ferme le panneau et **rend le focus à la pastille**.

---

## 5. Contenu par entité (référence maquette)

| Fiche | Onglets (`app-tabs`) | Pastilles (`app-side-labels`) |
|---|---|---|
| Salon | L'essentiel · Inscription exposants · Inscription bénévoles · Tarifs · Dimensions · Données de facturation | Suivi interne |
| Participation | L'essentiel (prestations, factures) · Inscription | Exposant · Suivi interne |
| Stand | L'essentiel (stand, co-exposant, logistique) · Présentation · Tarif | Exposant · Participation · Suivi interne |
| Conférence | L'essentiel · Présentation · Technique | Exposant · Participation · Suivi interne |
| Atelier | L'essentiel · Présentation · Participants | Exposant · Participation · Suivi interne |
| Facture | L'essentiel (solde, lignes) · Paiements · Rappels · Conditions | Exposant · Participation |
| Client | L'essentiel · Adresse et banque · Participations · Factures | Suivi interne |

Les cartes déplacées dans une pastille (suivi interne, exposant) **ne figurent plus** dans les onglets.

---

## 6. Plan de réalisation

1. **Jetons** : créer les variables `--app-card-*` (§1.2) et les faire utiliser par `card.component.scss`, sans aucun changement visuel.
2. **`app-notif-badge`** et le type `Notif`.
3. **`app-tabs`** : template, styles, algorithme « Plus », clavier, mode étroit. Le brancher d'abord sur **une seule fiche** (Participation).
4. **`app-side-labels`**, `app-side-label` et `appSideLabelHost` : pastilles, info-bulle, panneau `app-card`, voile, focus. Les brancher sur la même fiche.
5. Étendre aux autres fiches selon le §5, une fiche par PR.

**Questions à me poser avant de coder :**
- Une variable existe-t-elle déjà pour l'une des valeurs de secours (§1.3) ?
- L'onglet actif doit-il être reflété dans l'URL (`?tab=`) ?
- Où placer les clés i18n (`global.more`, `global.sections`, libellés des pastilles) ?
- Faut-il garder la frise de statut au-dessus de la box sur les fiches concernées ?

---

## 7. Définition de « terminé »

- [ ] À **toutes** les largeurs (1440, 1100, 1000, 900, 768, 390 px) et avec n'importe quel onglet actif, la liste d'onglets ne dépasse jamais (`scrollWidth <= clientWidth + 1`).
- [ ] L'onglet actif est toujours visible. « Plus » montre un point d'alerte si un onglet caché en porte une, sinon le nombre d'onglets cachés.
- [ ] Le cadre du contenu a ses coins du haut droits et ses coins du bas à 4 px, et l'onglet actif s'y soude sans trait visible.
- [ ] Les pastilles sont dans la box (et non fixées dans la page), alignées sur le haut du contenu. Leurs badges sont entièrement visibles.
- [ ] Le panneau est un `app-card`, n'affiche que la pastille cliquée, se ferme par ✕, par le voile ou par Échap, et le focus revient sur la pastille.
- [ ] En box étroite : 2 onglets visibles et « ⋯ n » à 390 px ; le panneau occupe toute la largeur du contenu.
- [ ] Aucune couleur ni taille en dur quand une variable du projet existe.
- [ ] Clavier : ← → Début Fin dans les onglets, Échap pour le menu et le panneau.
- [ ] Les animations sont coupées sous `prefers-reduced-motion`.