// Institut National de la Statistique (INS RDC, ins.gouv.cd) — portail
// officiel encore en construction, pas d'API publique documentée à ce jour.
// Les "chiffres clés" de la page d'accueil sont extraits par regex.
// Important : le portail affiche encore "0,00 %" comme valeur par défaut
// non renseignée pour certains indicateurs — on les traite comme absents
// pour ne jamais afficher une statistique nationale factice.

const SOURCE_URL = "https://www.ins.gouv.cd/";

function parseNombreFr(str) {
  if (!str) return null;
  const normalise = str.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  const valeur = parseFloat(normalise);
  return Number.isNaN(valeur) ? null : valeur;
}

function extraireApresLibelle(html, libelle) {
  const motif = new RegExp(`${libelle}\\s*(-?[\\d\\s\\u00a0\\u202f]+,\\d+)\\s*%`, "i");
  const match = html.match(motif);
  const valeur = match ? parseNombreFr(match[1]) : null;
  return valeur === 0 ? null : valeur; // "0,00 %" = placeholder du portail, pas une vraie donnée
}

export async function getInsIndicators() {
  try {
    const res = await fetch(SOURCE_URL, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "rdc-observatoire (projet public, contact via dépôt GitHub)" },
    });
    if (!res.ok) return { available: false, indicators: {} };

    const html = await res.text();

    const indicators = {
      inflationMensuelle: { label: "Inflation mensuelle — INS (%)", value: extraireApresLibelle(html, "Inflation mensuelle") },
      croissanceEconomique: { label: "Croissance économique — INS (%)", value: extraireApresLibelle(html, "Croissance économique") },
      pauvreteNationale: { label: "Pauvreté nationale — INS (%)", value: extraireApresLibelle(html, "Pauvreté nationale") },
    };

    return { available: true, indicators, sourceUrl: SOURCE_URL };
  } catch (err) {
    return { available: false, indicators: {} };
  }
}
