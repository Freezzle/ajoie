package ch.salon.service.handlers.enums;

/**
 * État d'une condition pour l'exécution d'une action.
 * OK : la condition est remplie
 * NOK : la condition n'est pas remplie (bloque l'action)
 */
public enum ConditionalState {
    OK, NOK
}
