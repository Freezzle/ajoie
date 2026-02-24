package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ConditionalState;
import ch.salon.service.handlers.enums.SupportType;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Représente le résultat enrichi de la méthode supports() d'un ActionHandler.
 * Encapsule le type de support et des métadonnées contextuelles (aide, conditions d'exécution).
 */
public class ActionSupport {

    private final SupportType type;
    private final String helpKey;
    private final List<ConditionalKey> conditionalKeys;

    private ActionSupport(SupportType type, String helpKey, List<ConditionalKey> conditionalKeys) {
        this.type = type;
        this.helpKey = helpKey;
        this.conditionalKeys = conditionalKeys != null ? new ArrayList<>(conditionalKeys) : new ArrayList<>();
    }

    /**
     * Crée un ActionSupport pour une action autorisée avec un texte d'aide et des conditions.
     *
     * @param helpKey Clé de traduction pour le texte d'aide
     * @param conditionalKeys Conditions (toutes à OK) qui permettent l'action
     * @return ActionSupport avec type ALLOWED
     */
    public static ActionSupport allowed(String helpKey, ConditionalKey... conditionalKeys) {
        return new ActionSupport(SupportType.ALLOWED, helpKey, Arrays.asList(conditionalKeys));
    }

    /**
     * Crée un ActionSupport pour une action autorisée sans aide (backward compatibility).
     *
     * @return ActionSupport avec type ALLOWED
     */
    public static ActionSupport allowed() {
        return new ActionSupport(SupportType.ALLOWED, null, Collections.emptyList());
    }

    /**
     * Crée un ActionSupport pour une action désactivée avec une ou plusieurs conditions non remplies.
     *
     * @param helpKey Clé de traduction pour le texte d'aide de l'action
     * @param conditionalKeys Conditions (au moins une à NOK) qui bloquent l'action
     * @return ActionSupport avec type DISABLED
     */
    public static ActionSupport disabled(String helpKey, ConditionalKey... conditionalKeys) {
        return new ActionSupport(SupportType.DISABLED, helpKey, Arrays.asList(conditionalKeys));
    }

    /**
     * Crée un ActionSupport pour une action rejetée (non applicable).
     *
     * @return ActionSupport avec type REJECTED
     */
    public static ActionSupport rejected() {
        return new ActionSupport(SupportType.REJECTED, null, Collections.emptyList());
    }

    public SupportType getType() {
        return type;
    }

    public String getHelpKey() {
        return helpKey;
    }

    public List<ConditionalKey> getConditionalKeys() {
        return Collections.unmodifiableList(conditionalKeys);
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
