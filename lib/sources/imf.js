// Fonds Monétaire International (FMI) — API DataMapper, publique, aucune
// clé requise. Documentation : https://www.imf.org/external/datamapper/api/help
// COD = code ISO3 utilisé par le FMI pour la RD Congo.
// Indicateurs distincts de ceux de la Banque mondiale (pas de doublon).

const COUNTRY = "COD";

const INDICATORS = {
  pibParHabitant: { code: "NGDPDPC", label: "PIB par habitant — FMI ($ courants)" },
  detterPublique: { code: "GGXWDG_NGDP", label: "Dette publique — FMI (% du PIB)" },
  compteCourant: { code: "BCA_NGDPD", label: "Compte courant — FMI (% du PIB)" },
  chomage: { code: "LUR", label: "Taux de chômage — FMI (%)" },
};

async function fetchIndicator(code) {
  const url = `https://www.imf.org/external/datamapper/api/v1/${code}/${COUNTRY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const series = json?.values?.[code]?.[COUNTRY];
    if (!series) return null;

    // Prend la donnée la plus récente disponible (le FMI publie parfois
    // des estimations manquantes sur les dernières années).
    const annees = Object.keys(series).sort((a, b) => Number(b) - Number(a));
    for (const annee of annees) {
      if (series[annee] !== null && series[annee] !== undefined) {
        return { value: series[annee], year: annee };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function getImfIndicators() {
  const entries = await Promise.all(
    Object.entries(INDICATORS).map(async ([key, meta]) => {
      const result = await fetchIndicator(meta.code);
      return [key, { ...meta, ...result }];
    })
  );
  return Object.fromEntries(entries);
}
