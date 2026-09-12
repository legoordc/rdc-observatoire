// Banque mondiale — API publique, aucune clé requise.
// Documentation : https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

const COUNTRY = "CD"; // Code Banque mondiale pour la RD Congo

const INDICATORS = {
  inflation: { code: "FP.CPI.TOTL.ZG", label: "Inflation (var. annuelle, %)" },
  gdpGrowth: { code: "NY.GDP.MKTP.KD.ZG", label: "Croissance du PIB (%)" },
  population: { code: "SP.POP.TOTL", label: "Population totale" },
  povertyRate: { code: "SI.POV.NAHC", label: "Taux de pauvreté national (%)" },
};

async function fetchIndicator(code) {
  const url = `https://api.worldbank.org/v2/country/${COUNTRY}/indicator/${code}?format=json&per_page=5&mrnev=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.[1]?.[0];
    if (!entry || entry.value === null) return null;
    return { value: entry.value, year: entry.date };
  } catch (err) {
    return null;
  }
}

export async function getWorldBankIndicators() {
  const entries = await Promise.all(
    Object.entries(INDICATORS).map(async ([key, meta]) => {
      const result = await fetchIndicator(meta.code);
      return [key, { ...meta, ...result }];
    })
  );
  return Object.fromEntries(entries);
}
