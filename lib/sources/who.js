// OMS — Global Health Observatory OData API, aucune clé requise.
// Catalogue des indicateurs : https://www.who.int/data/gho/info/gho-odata-api
// COD = code pays ISO3 de la RD Congo dans cette API.

const INDICATORS = {
  measlesImmunization: { code: "WHS4_100", label: "Couverture vaccinale rougeole (%)" },
  malariaIncidence: { code: "MALARIA_EST_INCIDENCE", label: "Incidence du paludisme (pour 1000)" },
  lifeExpectancy: { code: "WHOSIS_000001", label: "Espérance de vie à la naissance" },
};

async function fetchIndicator(code) {
  const url = `https://ghoapi.azureedge.net/api/${code}?$filter=SpatialDim eq 'COD'&$orderby=TimeDim desc&$top=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.value?.[0];
    if (!entry) return null;
    return { value: entry.NumericValue, year: entry.TimeDim };
  } catch (err) {
    return null;
  }
}

export async function getWhoIndicators() {
  const entries = await Promise.all(
    Object.entries(INDICATORS).map(async ([key, meta]) => {
      const result = await fetchIndicator(meta.code);
      return [key, { ...meta, ...result }];
    })
  );
  return Object.fromEntries(entries);
}
