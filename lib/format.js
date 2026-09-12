// Utilitaires de filtrage — objectif : ne jamais afficher de "—" ou de ligne
// vide dans l'UI. Si une source ne renvoie rien pour un indicateur, il est
// retiré du rendu plutôt qu'affiché comme absent.

export function hasValue(entry) {
  return !!entry && entry.value !== null && entry.value !== undefined && !Number.isNaN(entry.value);
}

/** Filtre un objet { clé: entry } et ne garde que les entrées exploitables. */
export function withValues(obj = {}) {
  return Object.values(obj || {}).filter(hasValue);
}

/** Filtre une liste (HDX, ReliefWeb...) : ne garde que les éléments avec titre + lien. */
export function withLinks(list = []) {
  return (list || []).filter((item) => item && item.title && item.url);
}
