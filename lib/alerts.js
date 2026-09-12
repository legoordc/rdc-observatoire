// Règles d'alerte simples, basées sur des seuils configurables.
// Ajustez SEUIL_INFLATION et SEUIL_HAUSSE_ACLED dans les variables
// d'environnement si les valeurs par défaut ne conviennent pas à votre usage.

const SEUIL_INFLATION = Number(process.env.SEUIL_INFLATION || 15); // en %
const SEUIL_HAUSSE_ACLED = Number(process.env.SEUIL_HAUSSE_ACLED || 1.2); // ×1.2 = +20%

/**
 * Évalue les alertes actives à partir des dernières données et de l'historique.
 * Retourne un tableau d'alertes : [{ cle, niveau, title, message }]
 */
export function evaluateAlerts({ worldbank, acledWeeklyCount, histAcled = [] }) {
  const alerts = [];

  const inflation = worldbank?.inflation?.value;
  if (typeof inflation === "number" && inflation > SEUIL_INFLATION) {
    alerts.push({
      cle: "inflation_haute",
      niveau: "alerte",
      title: "Inflation élevée",
      message: `Inflation annuelle rapportée par la Banque mondiale : ${inflation.toFixed(
        1
      )}% (seuil configuré : ${SEUIL_INFLATION}%).`,
    });
  }

  if (typeof acledWeeklyCount === "number" && histAcled.length >= 3) {
    const precedents = histAcled.slice(0, -1).map((p) => Number(p.valeur));
    const moyenne = precedents.reduce((a, b) => a + b, 0) / precedents.length;
    if (moyenne > 0 && acledWeeklyCount > moyenne * SEUIL_HAUSSE_ACLED) {
      const hausse = Math.round(((acledWeeklyCount - moyenne) / moyenne) * 100);
      alerts.push({
        cle: "acled_hausse",
        niveau: "alerte",
        title: "Hausse des événements de violence signalés",
        message: `${acledWeeklyCount} événements cette semaine, soit +${hausse}% par rapport à la moyenne des semaines précédentes (${moyenne.toFixed(
          1
        )}).`,
      });
    }
  }

  return alerts;
}
