package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ConditionalState;

/**
 * Représente une condition nécessaire pour l'exécution d'une action.
 * Chaque condition a une clé de traduction et un état (OK/NOK).
 */
public class ConditionalKey {
    private final String key;
    private final ConditionalState state;

    public ConditionalKey(String key, ConditionalState state) {
        this.key = key;
        this.state = state;
    }

    public String getKey() {
        return key;
    }

    public ConditionalState getState() {
        return state;
    }

    /**
     * Factory method pour créer une condition remplie (OK)
     */
    public static ConditionalKey ok(String key) {
        return new ConditionalKey(key, ConditionalState.OK);
    }

    /**
     * Factory method pour créer une condition non remplie (NOK)
     */
    public static ConditionalKey nok(String key) {
        return new ConditionalKey(key, ConditionalState.NOK);
    }
}
