// UNHCR (Haut-Commissariat des Nations Unies pour les réfugiés) — API
// publique, aucune clé requise. Documentation : https://api.unhcr.org/docs/
// COD = code UNHCR/ISO3 pour la RD Congo.

const COUNTRY = "COD";

async function fetchPopulation(params) {
  const url = `https://api.unhcr.org/population/v1/population/?${new URLSearchParams({
    limit: "5",
    ...params,
  }).toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const items = (json?.items || json?.data || []).sort((a, b) => b.year - a.year);
    return items[0] || null;
  } catch (err) {
    return null;
  }
}

export async function getUnhcrIndicators() {
  const [origine, asile] = await Promise.all([
    fetchPopulation({ coo: COUNTRY }), // Congolais réfugiés à l'étranger
    fetchPopulation({ coa: COUNTRY }), // personnes déplacées/réfugiées en RDC
  ]);

  return {
    refugiesCongolaisEtranger: {
      label: "Réfugiés congolais à l'étranger",
      value: origine?.refugees ?? null,
      year: origine?.year ?? null,
    },
    deplacesInternes: {
      label: "Déplacés internes en RDC (IDPs)",
      value: asile?.idps ?? null,
      year: asile?.year ?? null,
    },
    refugiesAccueillis: {
      label: "Réfugiés accueillis en RDC",
      value: asile?.refugees ?? null,
      year: asile?.year ?? null,
    },
  };
}
