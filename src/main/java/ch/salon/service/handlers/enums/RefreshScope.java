package ch.salon.service.handlers.enums;

/**
 * Ce que l'écran doit relire après une action.
 * <p>
 * La portée est portée par l'action elle-même : c'est le serveur qui sait si une action
 * modifie une seule entité, en crée ou en supprime, ou ne change rien du tout.
 */
public enum RefreshScope {
    /** Seule l'entité visée a changé : relire cette entité. */
    ENTITY,
    /** Le nombre d'entités a changé : recharger la liste. */
    LIST,
    /** Rien à relire, par exemple un téléchargement. */
    NONE
}
