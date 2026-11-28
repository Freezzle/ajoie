# Refonte de `app-status-timeline` et nouveau composant `help-button-box`

Maquette de référence : variante **« 1 · Boutons pleins »** de la planche
https://claude.ai/artifact/9gz91MKof2V23tBeKfkkeL

## 1. Objectif

1. Les boutons d'**action d'état** (Accepter, Refuser, Valider, Clôturer, Rouvrir…) quittent la colonne de droite et se placent **sur le trait de la frise, entre l'étape actuelle et l'étape suivante**.
2. Chaque bouton embarque **son aide** (texte d'aide et conditions) dans un **segment collé à droite**, qui fait partie du bouton visuellement mais reste une **cible de clic séparée**.
3. Ce bouton devient un **composant partagé**, `help-button-box`, réutilisable ailleurs que dans la frise (dialogues, en-têtes de détail, barres d'actions…).
4. La popover d'aide affiche **exactement la même structure** que celle du menu d'actions (`action-menu`) quand on clique sur son icône d'aide.

## 2. Comportement attendu (règles fermes)

- **Pas d'ouverture au survol.** Ni le bouton ni le segment d'aide n'ouvrent la popover au `hover`/`mouseenter`. La popover s'ouvre **uniquement au clic (ou appui) sur le segment d'aide**, et se referme au second clic, au clic extérieur ou avec `Échap` (comportement natif de `p-popover`).
- **Cliquer sur l'aide ne déclenche jamais l'action**, sur desktop comme sur mobile. Les deux zones sont deux `<button>` **frères**, jamais imbriqués (un bouton dans un bouton est du HTML invalide et casse le tactile).
- **Action désactivée, aide active.** Quand l'action est désactivée (une condition n'est pas remplie), seule la partie action est grisée. Le segment d'aide garde ses clics, son survol, son focus clavier, et passe en **jaune**.
- **Pas de couleur d'alerte quand l'action est possible.** Même pour une action de suppression ou de refus, le segment d'aide n'est jamais rouge par lui-même : il reprend la **couleur du bouton en un peu plus pâle**.

## 3. Nouveau composant `help-button-box`

### 3.1 Emplacement et nom

```
app/shared/components/help-button-box/
  help-button-box.component.ts
  help-button-box.component.html
  help-button-box.component.scss
  index.ts
```

Le suffixe `-box` suit la convention des composants partagés (`button-box`, `split-menu-box`…). Le sélecteur proposé est `help-button-box`.

### 3.2 API

Les entrées reprennent celles de `button-box`, pour qu'on puisse passer de l'un à l'autre, en ajoutant celles de l'aide. On utilise les signal inputs, comme `status-timeline` :

| Entrée | Type | Défaut | Rôle |
|---|---|---|---|
| `translateKey` | `string` | requis | Libellé (clé i18n) |
| `primeIcon` | `string \| undefined` | `undefined` | Icône du bouton, ex. `pi-check` |
| `type` | `SEVERITY` | `'primary'` | `primary`, `secondary`, `danger`, `warning`, `success` |
| `isDisabled` | `boolean` | `false` | Désactive **la partie action seulement** |
| `loading` | `boolean` | `false` | Spinner sur la partie action |
| `helpText` | `string \| undefined` | `undefined` | Texte d'aide **déjà traduit** (comme `EntityAction.helpText`) |
| `conditionalKeys` | `ConditionalKey[]` | `[]` | Conditions OK/NOK listées dans la popover |
| `fullWidth` | `boolean` | `false` | Le bouton prend toute la largeur disponible (utile sur mobile) |

| Sortie | Type | Rôle |
|---|---|---|
| `clickedEvent` | `HTMLElement` | Clic sur la partie action. L'élément est passé pour ancrer une confirmation, comme dans `button-box` |

Sans `helpText` ni `conditionalKeys`, le composant **ne rend pas de segment d'aide** et se comporte comme un `button-box` classique.

### 3.3 Structure HTML

```html
<span class="hb"
      [class.hb--primary]="type() === 'primary'"
      [class.hb--secondary]="type() === 'secondary'"
      [class.hb--danger]="type() === 'danger'"
      [class.hb--success]="type() === 'success'"
      [class.hb--warning]="type() === 'warning'"
      [class.hb--blocked]="isDisabled()"
      [class.hb--full]="fullWidth()">

    <button #actionBtn
            (click)="onAction($event)"
            [disabled]="isDisabled() || loading()"
            [attr.title]="translateKey() | translate"
            class="hb-action"
            type="button">
        @if (loading()) {
            <i class="pi pi-spin pi-spinner"></i>
        } @else if (primeIcon()) {
            <i [class]="'pi ' + primeIcon()"></i>
        }
        <span>{{ translateKey() | translate }}</span>
    </button>

    @if (hasHelp()) {
        <button (click)="toggleHelp($event)"
                [attr.aria-label]="helpAriaLabel()"
                [attr.aria-expanded]="helpOpen()"
                [title]="helpLabel()"
                aria-haspopup="dialog"
                class="hb-help"
                type="button">
            <i class="pi"
               [class.pi-exclamation-circle]="isDisabled()"
               [class.pi-question-circle]="!isDisabled()"></i>
        </button>
    }
</span>

<action-help-popover #help [helpText]="helpText()" [conditionalKeys]="conditionalKeys()"/>
```

- Pour les icônes, on garde la même convention que le menu d'actions : `pi-question-circle` quand l'action est possible, `pi-exclamation-circle` quand elle est bloquée.
- `aria-label` de l'aide : `« Aide : » + libellé`, construit à partir de `entityList.help`, ce qui donne par exemple « Aide : Clôturer ».

### 3.4 Logique (extrait)

```ts
readonly hasHelp = computed(() => !!this.helpText() || this.conditionalKeys().length > 0);

onAction(event: MouseEvent): void {
    this.clickedEvent.emit(event.currentTarget as HTMLElement);
}

toggleHelp(event: Event): void {
    event.stopPropagation();            // n'atteint jamais la partie action ni un parent cliquable
    this.help().toggle(event);
}
```

**Interdit :** aucun `(mouseenter)`, `(mouseover)`, `(focus)` ni `pTooltip` qui ouvrirait l'aide.

### 3.5 Couleurs

Le segment d'aide n'a pas de filet de séparation : c'est la différence de teinte qui sépare les deux zones. On définit les teintes avec `color-mix` à partir des variables du thème, pour qu'elles suivent les changements de couleur de l'application.

| Type | Partie action (fond / texte) | Segment d'aide, action possible (fond / icône) | Segment d'aide, action bloquée (fond / icône) |
|---|---|---|---|
| `primary` | `--app-primary` / blanc | `color-mix(in srgb, var(--app-primary) 75%, #fff)` / **blanc** | `--app-warning` / **noir** |
| `danger` (plein) | `--app-danger` / blanc | `color-mix(in srgb, var(--app-danger) 75%, #fff)` / **blanc ou noir selon le contraste** (voir note) | `--app-warning` / **noir** |
| `secondary` (contour) | blanc, bordure `--app-primary-soft` / `--app-primary` | `--app-primary-soft` / **noir** | `--app-warning` / **noir** |
| `success`, `warning` | couleur pleine / blanc | même couleur à 75 % / blanc | `--app-warning` / **noir** |

Partie action quand l'action est bloquée : fond neutre (`#eef1f4`), texte grisé, `cursor: not-allowed`. Le segment d'aide garde `cursor: pointer`, son survol et son focus.

> **Note contraste.** Dans la maquette, le rouge vaut `#b42318`, et un « i » blanc sur sa teinte claire passe bien. Le thème réel utilise `--app-danger: #fd7658`, plus clair : sa teinte à 75 % devient trop pâle pour une icône blanche. On passe donc l'icône en **noir** (`--app-text` ou `#1d2833`), ou on baisse le mélange à environ 85 %. Il faut vérifier un contraste d'au moins 3:1 pour l'icône. Le plus simple est de piloter cette couleur par une variable `--hb-help-fg`.

> **Noir ou blanc** dépend toujours du fond : blanc sur une teinte foncée, noir sur une teinte claire ou sur le jaune.

### 3.6 SCSS (base)

```scss
:host { display: inline-flex; }
:host(.full), .hb--full { width: 100%; }

.hb {
  --hb-bg: var(--app-primary);
  --hb-fg: #fff;
  --hb-help-bg: color-mix(in srgb, var(--hb-bg) 75%, #fff);
  --hb-help-fg: #fff;

  display: inline-flex;
  align-items: stretch;
  height: 2rem;                       /* aligné sur p-button size="small" */
  border-radius: var(--p-button-border-radius, 4px);
  overflow: hidden;
  font-weight: 600;
}

.hb-action, .hb-help { border: 0; margin: 0; font: inherit; cursor: pointer; }

.hb-action {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: 0 .75rem;
  background: var(--hb-bg); color: var(--hb-fg);
  &:hover:not(:disabled) { filter: brightness(.92); }
  &:disabled { background: #eef1f4; color: #9aa5b1; cursor: not-allowed; }
}

.hb-help {
  width: 2rem;
  display: grid; place-items: center;
  background: var(--hb-help-bg); color: var(--hb-help-fg);
  &:hover { filter: brightness(.94); }
}

.hb-action:focus-visible, .hb-help:focus-visible {
  outline: 2px solid var(--app-primary); outline-offset: 2px; position: relative; z-index: 1;
}

.hb--danger    { --hb-bg: var(--app-danger); --hb-help-fg: var(--app-text, #1d2833); }
.hb--secondary { --hb-bg: #fff; --hb-fg: var(--app-primary); --hb-help-bg: var(--app-primary-soft); --hb-help-fg: #1d2833;
                 box-shadow: inset 0 0 0 1px var(--app-primary-soft); }
.hb--blocked   { --hb-help-bg: var(--app-warning); --hb-help-fg: #1d2833; }

/* Mobile : cibles tactiles confortables et séparées */
@media (max-width: 760px) {
  .hb { height: 2.875rem; }           /* ~46 px */
  .hb-help { width: 3.25rem; }        /* ~52 px */
}
```

## 4. Popover d'aide : même structure que le menu d'actions

La popover de `help-button-box` doit afficher **la même chose, dans la même structure** que celle de `action-menu` (`action-menu.component.html`) quand on clique sur l'icône d'aide d'un item :

```html
<p-popover #helpPopover [baseZIndex]="9999" appendTo="body">
    <div class="am-help-content">
        @if (helpText) {
            <div class="am-help-text">{{ helpText }}</div>
        }
        @if (conditionalKeys.length > 0) {
            <ul class="am-conditions">
                @for (condition of conditionalKeys; track condition.key) {
                    <li [class.is-ok]="condition.state === 'OK'"
                        [class.is-ko]="condition.state === 'NOK'">
                        <i class="pi"
                           [class.pi-check]="condition.state === 'OK'"
                           [class.pi-times]="condition.state === 'NOK'"></i>
                        <span>{{ translateCondition(condition.key) }}</span>
                    </li>
                }
            </ul>
        }
    </div>
</p-popover>
```

- On réutilise les **mêmes classes** (`am-help-content`, `am-help-text`, `am-conditions`, `is-ok`, `is-ko`), dont les styles sont déjà globaux dans `content/scss/_action-menu.scss`.
- Il n'y a **pas de bouton d'action** dans la popover : elle ne fait qu'expliquer.

**Recommandé :** extraire ce bloc dans un petit composant partagé, `action-help-popover` (entrées `helpText`, `conditionalKeys`, méthode `toggle(event)`), utilisé par **`action-menu`, `help-button-box` et `status-timeline`**. Ce bloc est aujourd'hui recopié à l'identique dans `action-menu` et dans `status-timeline`. Avec un composant unique, la structure ne peut plus diverger.

## 5. Refonte de `app-status-timeline`

### 5.1 Ce qui change

| Aujourd'hui | Après |
|---|---|
| Boutons primaires dans `aside.app-statusbar-acts`, à droite | Boutons dans un emplacement **sur la frise**, entre l'étape actuelle et la suivante |
| `button-box` et icône `?` séparée (`am-help`) | `help-button-box`, avec l'aide intégrée au bouton |
| Popover d'aide propre au composant | Supprimée, désormais portée par `help-button-box` (ou `action-help-popover`) |
| L'aside contient les boutons et le rouage | L'aside ne contient plus que le **rouage** `entity-actions-menu` (inchangé) |
| Étape hors cycle (Refusé, Annulé) ajoutée **en fin** de frise | Étape hors cycle placée **juste après la dernière étape faite**, pour que « Rouvrir » tombe entre les deux |
| Mobile : frise horizontale avec défilement | Mobile (≤ 760 px) : **frise verticale**, boutons en pleine largeur entre les deux étapes |
| `actionSeverity` : `primary` ou `danger` | Ajouter `secondary` pour « Rouvrir » (bouton en contour) |

### 5.2 Où placer l'emplacement d'action

```ts
/** Index de l'étape après laquelle s'insèrent les boutons ; -1 si aucun. */
readonly actionSlotIndex = computed(() => {
    const steps = this.steps();
    if (this.primaryAvailableActions().length === 0) return -1;

    if (this.isOffCycle()) {
        // dernière étape faite : l'étape hors cycle est insérée juste après
        return steps.findIndex(s => s.state === 'error') - 1;
    }
    const current = steps.findIndex(s => s.state === 'current');
    return current >= 0 && current < steps.length - 1 ? current : -1;
});
```

Dans `steps()`, pour le cas hors cycle, on insère l'étape `error` après la dernière étape `done` au lieu de faire un `push` en fin de tableau.

### 5.3 Template (principe)

```html
<ol class="app-sline">
    @for (step of steps(); track step.key; let i = $index) {
        <li class="app-sline-s" [class.is-done]="..." [class.is-cur]="..." [class.is-x]="..."
            [class.has-slot-after]="i === actionSlotIndex()"
            [class.has-slot-before]="i === actionSlotIndex() + 1">
            <!-- rond, libellé, sous-libellé : inchangés -->
        </li>

        @if (i === actionSlotIndex()) {
            <li class="app-sline-a" [class.is-back]="isOffCycle()" aria-label="Actions d'état">
                @for (action of primaryAvailableActions(); track action.contextCode) {
                    <help-button-box [translateKey]="action.labelKey"
                                     [primeIcon]="primaryIcon(action)"
                                     [type]="actionSeverity(action)"
                                     [isDisabled]="action.disabled"
                                     [helpText]="action.helpKey ? (action.helpKey | translate) : undefined"
                                     [conditionalKeys]="action.conditionalKeys ?? []"
                                     (clickedEvent)="runPrimaryAction(action, $event)"/>
                }
            </li>
        }
    }
</ol>
```

- Quand il y a plusieurs actions (par exemple Accepter et Refuser), elles **s'empilent verticalement** dans l'emplacement, l'action principale en premier.
- La confirmation (`ConfirmDialogService`) et `actionRequested` restent tels qu'aujourd'hui : `runPrimaryAction` ne change pas.

### 5.4 Traits de liaison

Le trait actuel, `.app-sline-s::before { left: -50%; right: 50% }`, suppose que toutes les étapes ont la même largeur. Il casse dès qu'on insère un emplacement de largeur variable. On le remplace par **deux demi-traits par étape**, plus un trait plein dans l'emplacement :

```scss
.app-sline-s::before, .app-sline-s::after {
  content: ''; position: absolute; top: 10px; height: 2px; background: #d9dee4;
}
.app-sline-s::before { left: 0; right: 50%; }
.app-sline-s::after  { left: 50%; right: 0; }
.app-sline-s:first-child::before, .app-sline-s:last-child::after { display: none; }

/* parcours fait : bleu plein */
.app-sline-s.is-done::after, .app-sline-s.is-done + .app-sline-s::before { background: var(--app-primary); }

/* vers l'étape suivante : pointillé */
.app-sline-s.has-slot-after::after,
.app-sline-s.has-slot-before::before,
.app-sline-a::before {
  background: repeating-linear-gradient(90deg, #a8bfd6 0 5px, transparent 5px 9px);
}
.app-sline-a.is-back::before { /* idem en rouge clair pour « Rouvrir » */ }

.app-sline-a {
  flex: none; position: relative; padding: 0 .5rem;
  display: flex; flex-direction: column; gap: .5rem;
  &::before { content: ''; position: absolute; left: 0; right: 0; top: 10px; height: 2px; }
  help-button-box { position: relative; z-index: 1; margin-top: -5px; }  /* centré sur le trait */
}
```

### 5.5 Mobile (≤ 760 px)

- `.app-statusbar` passe en colonne. L'aside (le rouage) descend en bas, en pleine largeur, avec le libellé « Autres actions ».
- `.app-sline` passe en colonne. Chaque étape devient une ligne : rond, libellé, puis la date alignée à droite.
- Les demi-traits deviennent verticaux (`left: 10px; width: 2px; top/bottom`).
- `.app-sline-a` : `padding-left: 34px`, et `help-button-box` en `fullWidth`.

## 6. Critères d'acceptation

**Trois états à vérifier, sur desktop et sur mobile :**
1. **En vérification :** « Accepter » (primary) et « Refuser » (danger) sont empilés entre « En vérification » et « Accepté ». Les deux segments d'aide sont dans une teinte plus claire de leur bouton, sans rouge d'alerte.
2. **Validé avec une condition manquante :** la partie « Clôturer » est grisée et non cliquable. Le segment d'aide est **jaune avec une icône noire**, reste cliquable, et la popover liste les conditions (✓ / ✗).
3. **Refusé :** « Refusé » suit directement « En vérification ». « Rouvrir » (secondary) est placé entre les deux, sur un trait pointillé rouge clair.

**Comportement :**
- Survoler un bouton ou son aide **n'ouvre rien**.
- Cliquer ou toucher l'aide ouvre la popover **sans déclencher l'action**, y compris quand l'action est désactivée.
- La popover a la même structure et le même rendu que celle du menu d'actions.
- On atteint l'aide au clavier (Tab), on l'ouvre avec Entrée ou Espace, et on la ferme avec Échap.
- Sur mobile, le segment d'aide mesure au moins 48 × 44 px.
- La roue dentée et `gearActions()` sont inchangés.

**Écrans concernés** (ils utilisent `app-status-timeline`) : participation, stand, conférence, atelier (`*-update.component.html`).

## 7. Fichiers touchés

- `shared/components/help-button-box/*` : **nouveau**
- `shared/components/action-help-popover/*` : **nouveau**, recommandé
- `shared/components/action-menu/action-menu.component.html` : utilise `action-help-popover`
- `shared/components/status-timeline/status-timeline.component.{ts,html,scss}` : refonte
- `content/scss/_action-menu.scss` : inchangé, styles `am-help-*` réutilisés