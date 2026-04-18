import { Injectable, signal } from '@angular/core';

/**
 * Service permettant à un composant enfant de s'enregistrer auprès d'une dialog-box
 * et d'exposer son draft courant. Quand la dialog-box clique "Valider", elle peut
 * récupérer le draft du composant enfant via ce service.
 *
 * Usage dans un composant enfant :
 *   constructor(private draftService: DialogDraftService) {}
 *   ngOnInit() {
 *     this.draftService.registerDraft(() => structuredClone(this._draft()));
 *   }
 *   ngOnDestroy() {
 *     this.draftService.unregisterDraft();
 *   }
 *
 * Usage dans dialog-box :
 *   onConfirmClick() {
 *     const draft = this.draftService.getDraft();
 *     this.confirm.emit(draft);
 *   }
 */
@Injectable({ providedIn: 'root' })
export class DialogDraftService {
  private draftGetter = signal<(() => any) | null>(null);
  private validateFn = signal<(() => boolean) | null>(null);

  registerDraft(getter: () => any): void {
    this.draftGetter.set(getter);
  }

  /**
   * Enregistre une fonction de validation côté enfant.
   * Elle doit déclencher les erreurs visuelles et retourner true si valide.
   */
  registerValidate(fn: () => boolean): void {
    this.validateFn.set(fn);
  }

  unregisterDraft(): void {
    this.draftGetter.set(null);
    this.validateFn.set(null);
  }

  /**
   * Appelle la fonction de validation enregistrée. Retourne true si aucune n'est enregistrée.
   */
  validate(): boolean {
    const fn = this.validateFn();
    return fn ? fn() : true;
  }

  getDraft(): any {
    const getter = this.draftGetter();
    return getter ? getter() : null;
  }
}
