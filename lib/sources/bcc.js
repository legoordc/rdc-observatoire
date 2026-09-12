// Banque Centrale du Congo (BCC) — aucune API publique documentée à ce
// jour. Le site (bcc.cd, refondu en août 2026) publie ses cotations sur
// une page statistiques dédiée avec date de publication explicite et
// variation par rapport à la veille — on la lit en plus de la page
// d'accueil, pour des valeurs plus complètes et datées.
// Toute erreur retombe sur une valeur absente, sans jamais casser le
// dashboard. Respectez les mentions légales : https://www.bcc.cd/mentions-legales

const HOMEPAGE_URL = "https://www.bcc.cd";
const COURS_CHANGE_URL = "https://www.bcc.cd/statistiques/secteur-exterieur/cours-de-change";
const HEADERS = { "User-Agent": "rdc-observatoire (projet public, contact via dépôt GitHub)" };

function parseNombreFr(str) {
  if (!str) return null;
  const normalise = str.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  const valeur = parseFloat(normalise);
  return Number.isNaN(valeur) ? null : valeur;
}

/** Retire balises et scripts pour retrouver le texte tel que lu par un lecteur d'écran. */
function texteBrut(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ");
}

async function fetchTexte(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, headers: HEADERS });
    if (!res.ok) return null;
    return texteBrut(await res.text());
  } catch (err) {
    return null;
  }
}

function extraireApresLibelle(texte, libelle) {
  const motif = new RegExp(`${libelle}[^\\d-]{0,30}(-?[\\d\\s\\u00a0\\u202f]+,\\d+)`, "i");
  const match = texte.match(motif);
  return match ? parseNombreFr(match[1]) : null;
}

/** Cotation datée et vérifiée d'une devise (page "Cours de change"), avec variation vs. veille. */
function extraireCoursDevise(texte, code) {
  const ancre = texte.indexOf("Constats vérifiés"); // ancré au bloc audité, pas au bandeau du haut
  const zone = ancre >= 0 ? texte.slice(ancre) : texte;
  const motif = new RegExp(
    `${code}\\/CDF([\\d\\s\\u00a0\\u202f]+,\\d+)\\s*CDF(\\d{4}-\\d{2}-\\d{2})([+-][\\d\\s\\u00a0\\u202f]+,\\d+)%`,
    "i"
  );
  const match = zone.match(motif);
  if (!match) return null;
  return { value: parseNombreFr(match[1]), date: match[2], variationVeille: parseNombreFr(match[3]) };
}

export async function getBccIndicators() {
  const [accueil, coursChange] = await Promise.all([
    fetchTexte(HOMEPAGE_URL),
    fetchTexte(COURS_CHANGE_URL),
  ]);

  if (!accueil && !coursChange) return { available: false, indicators: {} };

  const dateInflation = accueil?.match(/(\d{2}\/\d{2}\/\d{4})\s*·\s*INS/i)?.[1] || null;
  const periodeTauxDirecteur = accueil?.match(/Période\s*:\s*([A-Za-zéûôàèç]+\s+\d{4})/i)?.[1] || null;

  const indicators = {
    tauxDirecteur: {
      label: "Taux directeur BCC (%)",
      value: accueil ? extraireApresLibelle(accueil, "Taux directeur") : null,
      year: periodeTauxDirecteur,
    },
    inflationBcc: {
      label: "Inflation glissement annuel — BCC/INS (%)",
      value: accueil ? extraireApresLibelle(accueil, "Glissement annuel") : null,
      year: dateInflation,
    },
  };

  // Cours de change datés et vérifiés — bien plus frais que la page d'accueil.
  for (const [key, code] of [["usdCdf", "USD"], ["eurCdf", "EUR"], ["gbpCdf", "GBP"], ["cnyCdf", "CNY"]]) {
    const cours = coursChange ? extraireCoursDevise(coursChange, code) : null;
    if (cours) {
      const signe = cours.variationVeille >= 0 ? "+" : "";
      indicators[key] = {
        label: `${code} / CDF (veille ${signe}${cours.variationVeille}%)`,
        value: cours.value,
        year: cours.date,
      };
    }
  }
  // Repli sur la page d'accueil si la page de cotations est indisponible.
  if (!indicators.usdCdf && accueil) {
    const usd = extraireApresLibelle(accueil, "1 USD =");
    if (usd !== null) indicators.usdCdf = { label: "USD / CDF (cours indicatif, page d'accueil)", value: usd, year: null };
  }

  return { available: true, indicators, sourceUrl: HOMEPAGE_URL };
}
