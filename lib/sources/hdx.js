// Humanitarian Data Exchange (HDX / OCHA) — API CKAN publique, aucune clé requise.
// Documentation : https://data.humdata.org/faqs/devs
// Note : cette fonction récupère des MÉTADONNÉES de jeux de données (titre, date, lien).
// Le parsing détaillé des ressources CSV/HXL de chaque dataset varie d'un organisme
// à l'autre et se fait au cas par cas — non couvert par cette version.

export async function searchHdxDatasets(query, limit = 6) {
  const q = encodeURIComponent(`${query} AND groups:cod`);
  const url = `https://data.humdata.org/api/3/action/package_search?q=${q}&rows=${limit}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const results = json?.result?.results || [];
    return results.map((d) => ({
      title: d.title,
      org: d.organization?.title || null,
      updated: d.metadata_modified,
      url: `https://data.humdata.org/dataset/${d.name}`,
    }));
  } catch (err) {
    return [];
  }
}
