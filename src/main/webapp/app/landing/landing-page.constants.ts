/**
 * Contenu de la page d'accueil publique « e-salon ».
 * Regrouper ici le nom du produit et les textes qui dépendent de données (listes, nombres calculés)
 * afin de n'avoir qu'un seul endroit à modifier.
 */

/** Nom du produit affiché dans l'en-tête, le hero et le pied de page. Provisoire. */
export const NOM_PRODUIT = 'salon-en-ligne';

export type ModuleStatus = 'ready' | 'soon';

export interface LandingModule {
    /** Identifiant stable utilisé pour l'ancre et la mise en évidence au clic. */
    id: string;
    titleKey: string;
    descriptionKey: string;
    status: ModuleStatus;
    /** Nom d'icône PrimeIcons, sans le préfixe `pi `. */
    icon: string;
}

/**
 * Les 9 modules de la section « Tout ce qu'il faut pour gérer un salon », dans l'ordre d'affichage.
 * Le nombre de modules « Prêts » / « Bientôt » affiché dans les filtres et le sous-titre est calculé
 * à partir de cette liste (voir `LandingPageComponent`).
 */
export const LANDING_MODULES: LandingModule[] = [
    {
        id: 'inscriptions',
        titleKey: 'landing.modules.inscriptions.title',
        descriptionKey: 'landing.modules.inscriptions.description',
        status: 'ready',
        icon: 'pi-check-square'
    },
    {
        id: 'exhibitors',
        titleKey: 'landing.modules.exhibitors.title',
        descriptionKey: 'landing.modules.exhibitors.description',
        status: 'ready',
        icon: 'pi-users'
    },
    {
        id: 'stands',
        titleKey: 'landing.modules.stands.title',
        descriptionKey: 'landing.modules.stands.description',
        status: 'ready',
        icon: 'pi-th-large'
    },
    {
        id: 'conferences',
        titleKey: 'landing.modules.conferences.title',
        descriptionKey: 'landing.modules.conferences.description',
        status: 'ready',
        icon: 'pi-calendar'
    },
    {
        id: 'tasks',
        titleKey: 'landing.modules.tasks.title',
        descriptionKey: 'landing.modules.tasks.description',
        status: 'ready',
        icon: 'pi-list-check'
    },
    {
        id: 'emails',
        titleKey: 'landing.modules.emails.title',
        descriptionKey: 'landing.modules.emails.description',
        status: 'ready',
        icon: 'pi-envelope'
    },
    {
        id: 'directory',
        titleKey: 'landing.modules.directory.title',
        descriptionKey: 'landing.modules.directory.description',
        status: 'ready',
        icon: 'pi-address-book'
    },
    {
        id: 'invoices',
        titleKey: 'landing.modules.invoices.title',
        descriptionKey: 'landing.modules.invoices.description',
        status: 'ready',
        icon: 'pi-file'
    },
    {
        id: 'exhibitor-profile',
        titleKey: 'landing.modules.exhibitorProfile.title',
        descriptionKey: 'landing.modules.exhibitorProfile.description',
        status: 'soon',
        icon: 'pi-user'
    }
];

export interface LandingAudience {
    titleKey: string;
    textKey: string;
}

/** Section « Pour qui ? », trois blocs dans l'ordre d'affichage. */
export const LANDING_AUDIENCES: LandingAudience[] = [
    {titleKey: 'landing.audiences.associations.title', textKey: 'landing.audiences.associations.text'},
    {titleKey: 'landing.audiences.independents.title', textKey: 'landing.audiences.independents.text'},
    {titleKey: 'landing.audiences.venues.title', textKey: 'landing.audiences.venues.text'}
];

