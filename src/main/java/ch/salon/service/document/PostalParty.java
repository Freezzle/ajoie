package ch.salon.service.document;

import org.apache.commons.lang3.StringUtils;

/**
 * Partie postale d'un document : l'expéditeur (le salon) ou le destinataire (l'exposant).
 *
 * L'adresse reste structurée, exactement comme en base, pour qu'un QR-facture puisse être
 * rempli champ par champ sans jamais concaténer puis redécouper une ligne d'adresse.
 */
public interface PostalParty {

    /** Raison sociale, si la partie en a une. */
    String getEnterpriseName();

    /** Nom de la personne de contact. */
    String getFullName();

    /** Case postale, affichée au-dessus de la rue. */
    String getPostalCase();

    /** Mention complémentaire (c/o, étage…), affichée sous la localité. */
    String getExtraLine();

    String getStreet();

    String getHouseNumber();

    String getPostalCode();

    String getCity();

    /** Code pays ISO à deux lettres. */
    String getCountry();

    /**
     * Nom porté par le QR-facture, limité à 70 caractères par la norme : la raison sociale
     * quand elle existe, sinon le nom de contact.
     */
    default String getQrName() {
        String name = StringUtils.defaultIfBlank(getEnterpriseName(), getFullName());

        return StringUtils.abbreviate(StringUtils.trimToEmpty(name), 70);
    }

    /** « Rue 12 », pour l'affichage dans un document. */
    default String getStreetLine() {
        return StringUtils.trimToEmpty(
                StringUtils.trimToEmpty(getStreet()) + " " + StringUtils.trimToEmpty(getHouseNumber()));
    }

    /** « 2944 Bonfol », pour l'affichage dans un document. */
    default String getCityLine() {
        return StringUtils.trimToEmpty(
                StringUtils.trimToEmpty(getPostalCode()) + " " + StringUtils.trimToEmpty(getCity()));
    }
}
