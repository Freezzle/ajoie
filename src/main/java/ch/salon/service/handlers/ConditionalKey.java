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
     * Factory method pour créer une condition basée sur un booléen.
     * Si la condition est true, crée un OK, sinon un NOK.
     * Évite la duplication de code avec if/else.
     *
     * @param condition Le résultat de la condition (true = OK, false = NOK)
     * @param key Clé de traduction
     * @return ConditionalKey avec état OK si condition=true, NOK sinon
     */
    public static ConditionalKey of(boolean condition, String key) {
        return new ConditionalKey(key, condition ? ConditionalState.OK : ConditionalState.NOK);
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
