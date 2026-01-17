# Système Dialog-Box + Draft Homogène

## Overview

Ce document explique le système homogène et robuste de gestion des drafts dans les boîtes de dialogue Angular. Le système permet à un composant enfant (contenu projeté) de transférer automatiquement son état modifié au parent quand l'utilisateur clique "Valider", sans appel manuel de méthode `confirm()`.

## Architecture

### 1. Composants impliqués

- **DialogBoxComponent** (`dialog-box.component.ts`) : boîte de dialogue générique avec boutons Valider/Annuler.
- **DialogDraftService** (`dialog-draft.service.ts`) : service singleton qui gère l'enregistrement du draft courant.
- **Composants enfants** (ex. `VolunteerManagerComponent`, `SelectedDayEditorComponent`) : éditeurs projetés dans le contenu du dialog.
- **Composant parent** (ex. `VolunteerPlanningComponent`) : qui affiche les dialogs et traite les données confirmées.

### 2. Flux de données

```
┌─────────────────────────────────────────────┐
│ Composant Parent                            │
│ (volunteer-planning.component.ts)          │
│                                             │
│ <dialog-box (confirm)="applyX($event)">   │
│   <child-editor [data]="initialData" />   │
│ </dialog-box>                              │
└─────────────────────────────────────────────┘
                  ▲
                  │ (confirm)="$event" = draft cloné
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────┴──────────┐   ┌────┴───────────┐
│ DialogBoxComp    │   │ DialogDraftSvc │
│                  │───┤ getDraft()     │
│ (confirm click)  │   │                │
└──────────────────┘   └────┬───────────┘
                             │ (lit le draft enregistré)
                             │
                       ┌─────┴───────────┐
                       │ Child Editor    │
                       │ (ngOnInit) ->   │
                       │ registerDraft() │
                       │                 │
                       │ _draft = signal │
                       └─────────────────┘
```

## Utilisation

### Côté composant enfant (éditeur)

#### 1. Importer le service
```typescript
import { DialogDraftService } from '../../shared/services/dialog-draft.service';
```

#### 2. Injecter et implémenter les lifecycle hooks
```typescript
export class VolunteerManagerComponent implements OnInit, OnDestroy {
  _draft = signal<Volunteer[] | null>(null);

  constructor(private draftService: DialogDraftService) {}

  @Input({ required: true })
  set data(value: Volunteer[]) {
    this._draft.set(structuredClone(value));
  }

  ngOnInit() {
    // Enregistrer une fonction getter qui retourne le draft courant
    this.draftService.registerDraft(() => {
      const d = this._draft();
      return d ? structuredClone(d) : null;
    });
  }

  ngOnDestroy() {
    // Toujours nettoyer l'enregistrement
    this.draftService.unregisterDraft();
  }

  // Les modifications du draft se font via des mutateurs
  addVolunteer() {
    this.commit(next => next.push({id: newId('v'), label: 'Nouveau'}));
  }

  private commit(mutator: (next: Volunteer[]) => void) {
    const current = this._draft();
    if (!current) return;
    const next = structuredClone(current);
    mutator(next);
    this._draft.set(next);
  }
}
```

### Côté dialog-box

Le `DialogBoxComponent` utilise automatiquement le service pour récupérer le draft enregistré lors du clic "Valider" :

```typescript
export class DialogBoxComponent implements OnDestroy {
  confirm = output<any>();

  constructor(private draftService: DialogDraftService) {}

  onConfirmClick() {
    // Récupère le draft du composant enfant enregistré dans le service
    const draft = this.draftService.getDraft();
    this.confirm.emit(draft);

    if (!this.confirmLoading()) {
      this.requestClose();
    }
  }

  ngOnDestroy() {
    this.draftService.unregisterDraft();
  }
}
```

### Côté composant parent

Le parent se connecte simplement au `(confirm)` du dialog et reçoit le draft via `$event` :

```typescript
export class VolunteerPlanningComponent {
  applyVolunteers(draft: Volunteer[]) {
    if (!draft) return; // Au cas où aucun draft n'aurait été capturé
    // Traiter le draft confirmé
    this.planning.set({...this.planning(), volunteers: draft});
  }
}
```

Dans le template :

```html
<dialog-box (confirm)="applyVolunteers($event)">
  <volunteer-manager [data]="planning().volunteers" />
</dialog-box>
```

## Avantages du système

1. **Homogène** : tous les éditeurs suivent le même pattern (enregistrement/désenregistrement dans les lifecycle hooks).
2. **Robuste** : pas de dépendances sur les références de template (`#ref`) ou les appels manuels de méthodes.
3. **Facile à étendre** : pour ajouter un nouvel éditeur, il suffit :
   - D'implémenter `OnInit, OnDestroy`.
   - De créer `registerDraft()` / `unregisterDraft()` dans les hooks.
   - D'utiliser `(confirm)="applyX($event)"` dans le parent.
4. **Testable** : le service peut être mocké/testé indépendamment.
5. **Sans breaking change** : les composants conservent leurs `@Output() confirmDraft` pour compatibilité (par exemple, pour une utilisation directe sans dialog-box).

## Considérations

### Cas limites

- **Pas de draft enregistré** : si le composant enfant ne s'enregistre pas correctement, `getDraft()` retournera `null`. Le parent doit gérer ce cas.
- **Transitions rapides** : si l'utilisateur ouvre et ferme plusieurs dialogs rapidement, le service nettoie l'enregistrement dans `ngOnDestroy()` (ou lors de `unregisterDraft()` du dialog-box).
- **Ordre des lifehooks** : `ngOnInit` du composant enfant s'exécute *avant* celui du dialog-box, donc l'enregistrement est fait à temps.

### Sécurité des données

- Le service utilise `structuredClone()` pour éviter les références directes — les modifications du draft enfant ne pollueront pas l'original.
- Le parent reçoit un clone du draft, donc les modifications du parent ne pollueront pas le composant enfant si le dialog est réutilisé.

## Exemple complet : VolunteerManagerComponent

```typescript
import { OnInit, OnDestroy } from '@angular/core';
import { DialogDraftService } from '../../../../shared/services/dialog-draft.service';

export class VolunteerManagerComponent implements OnInit, OnDestroy {
  _draft = signal<Volunteer[] | null>(null);
  @Output() confirmDraft = new EventEmitter<Volunteer[]>();

  constructor(private draftService: DialogDraftService) {}

  @Input({ required: true })
  set data(value: Volunteer[]) {
    this._draft.set(structuredClone(value));
  }

  ngOnInit() {
    this.draftService.registerDraft(() => {
      const d = this._draft();
      return d ? structuredClone(d) : null;
    });
  }

  ngOnDestroy() {
    this.draftService.unregisterDraft();
  }

  addVolunteer() {
    this.commit(next => next.push({id: newId('v'), label: 'Nouveau'}));
  }

  confirm() {
    const d = this._draft();
    if (!d) return;
    // Optionnel : garder pour compatibilité (utilisation directe sans dialog)
    this.confirmDraft.emit(structuredClone(d));
  }

  private commit(mutator: (next: Volunteer[]) => void) {
    const current = this._draft();
    if (!current) return;
    const next = structuredClone(current);
    mutator(next);
    this._draft.set(next);
  }
}
```

Template parent :

```html
<dialog-box (confirm)="applyVolunteers($event)">
  <volunteer-manager [data]="planning().volunteers" />
</dialog-box>
```

Parent TypeScript :

```typescript
applyVolunteers(draft: Volunteer[]) {
  if (!draft) return;
  this.planning.set({...this.planning(), volunteers: draft});
}
```

## Évolutions futures

- **Validation centralisée** : ajouter un hook `validate()` au service pour valider le draft avant d'émettre.
- **Historique des drafts** : utiliser le service pour implémenter un système Undo/Redo.
- **Types génériques** : typer le service `DialogDraftService<T>` pour plus de type-safety.

## Références

- `DialogDraftService` : `app/shared/services/dialog-draft.service.ts`
- `DialogBoxComponent` : `app/shared/components/dialog-box/dialog-box.component.ts`
- Exemples d'utilisation : `app/admin/volunteer-planning/components/*/`
