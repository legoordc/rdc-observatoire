// ReliefWeb (OCHA) — agrège les rapports publiés par les agences onusiennes
// et les ONG actives en RDC. API publique, aucune clé requise.
// Documentation : https://apidoc.rwlabs.org/
// Complète HDX (métadonnées de jeux de données) par de vrais rapports de
// terrain, mis à jour en continu par les organisations elles-mêmes.

export async function getReliefwebReports(limit = 6) {
  const url =
    "https://api.reliefweb.int/v1/reports" +
    "?appname=rdc-observatoire" +
    "&filter[field]=primary_country" +
    "&filter[value]=Democratic%20Republic%20of%20the%20Congo" +
    "&sort[]=date:desc" +
    `&limit=${limit}` +
    "&fields[include][]=title" +
    "&fields[include][]=date" +
    "&fields[include][]=source" +
    "&fields[include][]=url_alias";

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.data || [];
    return items
      .map((item) => ({
        title: item.fields?.title || null,
        date: item.fields?.date?.original?.slice(0, 10) || null,
        source: item.fields?.source?.[0]?.name || null,
        url: item.fields?.url_alias || null,
      }))
      .filter((r) => r.title && r.url);
  } catch (err) {
    return [];
  }
}
