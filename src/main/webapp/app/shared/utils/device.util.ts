/**
 * Utilitaire pour détecter si l'utilisateur est sur un appareil mobile
 */

/**
 * Détermine si l'utilisateur est sur un appareil mobile basé sur la largeur de la fenêtre
 * @returns true si la largeur de la fenêtre est <= 768px, false sinon
 */
export function isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
}
