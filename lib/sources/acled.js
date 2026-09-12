// ACLED — nécessite un compte gratuit : https://acleddata.com/register/
// Renseignez ACLED_EMAIL et ACLED_KEY (voir .env.example) pour activer ce module.
// Sans ces valeurs, le dashboard fonctionne quand même : ce module renvoie
// "configured: false" et l'interface l'indique clairement.
// Respectez les conditions d'utilisation d'ACLED : https://acleddata.com/terms-of-use/

export async function getAcledEvents(limit = 10) {
  const email = process.env.ACLED_EMAIL;
  const key = process.env.ACLED_KEY;

  if (!email || !key) {
    return { configured: false, events: [] };
  }

  const params = new URLSearchParams({
    key,
    email,
    country: "Democratic Republic of Congo",
    limit: String(limit),
    order_by: "event_date",
    order_dir: "desc",
  });

  try {
    const res = await fetch(`https://api.acleddata.com/acled/read?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { configured: true, events: [], error: true };
    const json = await res.json();
    const events = (json?.data || []).map((e) => ({
      date: e.event_date,
      province: e.admin1,
      type: e.event_type,
      fatalities: e.fatalities,
      notes: e.notes,
    }));
    return { configured: true, events };
  } catch (err) {
    return { configured: true, events: [], error: true };
  }
}

/**
 * Nombre d'événements des 7 derniers jours au niveau national.
 * Métrique unique et régulière — sert à construire une courbe de
 * tendance dans le temps (contrairement à la liste d'événements bruts).
 */
export async function getAcledWeeklyCount() {
  const email = process.env.ACLED_EMAIL;
  const key = process.env.ACLED_KEY;
  if (!email || !key) return null;

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    key,
    email,
    country: "Democratic Republic of Congo",
    event_date: since,
    event_date_where: "AFTER",
    limit: "500",
  });

  try {
    const res = await fetch(`https://api.acleddata.com/acled/read?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data.length : null;
  } catch (err) {
    return null;
  }
}
