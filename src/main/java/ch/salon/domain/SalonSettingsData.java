package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Contenu JSON des réglages d'un salon partagés par tous les administrateurs.
 * Pour l'instant, la seule donnée est la liste des métriques affichées dans le
 * tableau de bord (« Mes indicateurs »).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SalonSettingsData implements Serializable {

    /** Identifiants des métriques affichées dans « Mes indicateurs », dans l'ordre. */
    private List<String> dashboardMetrics = new ArrayList<>();

    public static SalonSettingsData defaults() {
        SalonSettingsData data = new SalonSettingsData();
        data.setDashboardMetrics(new ArrayList<>(List.of("status", "categories", "dimensions", "billingProgress")));
        return data;
    }
}
