package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.SupportType;

/**
 * Représente le résultat enrichi de la méthode supports() d'un ActionHandler.
 * Encapsule le type de support et des métadonnées contextuelles (aide, raison de désactivation).
 */
public class ActionSupport {

    private final SupportType type;
    private final String helpKey;
    private final String disabledReasonKey;

    private ActionSupport(SupportType type, String helpKey, String disabledReasonKey) {
        this.type = type;
        this.helpKey = helpKey;
        this.disabledReasonKey = disabledReasonKey;
    }

    /**
     * Crée un ActionSupport pour une action autorisée avec un texte d'aide.
     *
     * @param helpKey Clé de traduction pour le texte d'aide
     * @return ActionSupport avec type ALLOWED
     */
    public static ActionSupport allowed(String helpKey) {
        return new ActionSupport(SupportType.ALLOWED, helpKey, null);
    }

    /**
     * Crée un ActionSupport pour une action autorisée sans aide.
     *
     * @return ActionSupport avec type ALLOWED
     */
    public static ActionSupport allowed() {
        return new ActionSupport(SupportType.ALLOWED, null, null);
    }

    /**
     * Crée un ActionSupport pour une action désactivée.
     *
     * @param disabledReasonKey Clé de traduction expliquant pourquoi l'action est désactivée
     * @return ActionSupport avec type DISABLED
     */
    public static ActionSupport disabled(String disabledReasonKey) {
        return new ActionSupport(SupportType.DISABLED, null, disabledReasonKey);
    }

    /**
     * Crée un ActionSupport pour une action rejetée (non applicable).
     *
     * @return ActionSupport avec type REJECTED
     */
    public static ActionSupport rejected() {
        return new ActionSupport(SupportType.REJECTED, null, null);
    }

    public SupportType getType() {
        return type;
    }

    public String getHelpKey() {
        return helpKey;
    }

    public String getDisabledReasonKey() {
        return disabledReasonKey;
    }

    /**
     * Vérifie si l'action est autorisée.
     */
    public boolean isAllowed() {
        return type == SupportType.ALLOWED;
    }

    /**
     * Vérifie si l'action est désactivée.
     */
    public boolean isDisabled() {
        return type == SupportType.DISABLED;
    }

    /**
     * Vérifie si l'action est rejetée.
     */
    public boolean isRejected() {
        return type == SupportType.REJECTED;
    }
}
