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

  /**
   * Enregistre une fonction qui retourne le draft courant du composant enfant.
   * Cette fonction sera appelée quand le dialog-box clique "Valider".
   */
  registerDraft(getter: () => any): void {
    this.draftGetter.set(getter);
  }

  /**
   * Désenregistre le draft (appeler dans ngOnDestroy du composant enfant).
   */
  unregisterDraft(): void {
    this.draftGetter.set(null);
  }

  /**
   * Récupère le draft courant enregistré, ou null si aucun n'est enregistré.
   */
  getDraft(): any {
    const getter = this.draftGetter();
    return getter ? getter() : null;
  }
}
