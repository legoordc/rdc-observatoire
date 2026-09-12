import { createClient } from "@supabase/supabase-js";

// Historique optionnel : si SUPABASE_URL / SUPABASE_SERVICE_KEY ne sont pas
// définies, ces fonctions se comportent silencieusement comme si
// l'historique était vide — le reste du dashboard continue de fonctionner
// normalement (instantané seulement, pas de tendance).

let client = null;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function isHistoryConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

/**
 * Enregistre un instantané de mesures.
 * records: [{ source, indicateur, valeur, unite? }]
 */
export async function saveSnapshot(records) {
  const supabase = getClient();
  if (!supabase || !records?.length) return;

  const rows = records
    .filter((r) => r.valeur !== null && r.valeur !== undefined && !Number.isNaN(r.valeur))
    .map((r) => ({
      source: r.source,
      indicateur: r.indicateur,
      valeur: r.valeur,
      unite: r.unite || null,
    }));

  if (!rows.length) return;

  const { error } = await supabase.from("mesures").insert(rows);
  if (error) {
    // On ne bloque jamais le rendu du dashboard si l'écriture d'historique échoue.
    console.error("Supabase insert error:", error.message);
  }
}

/**
 * Renvoie les points [{ valeur, capture_le }] d'un indicateur, du plus
 * ancien au plus récent, sur les `days` derniers jours.
 */
export async function getHistory(indicateur, days = 365) {
  const supabase = getClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("mesures")
    .select("valeur, capture_le")
    .eq("indicateur", indicateur)
    .gte("capture_le", since)
    .order("capture_le", { ascending: true });

  if (error) {
    console.error("Supabase read error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Date de la dernière notification envoyée pour une alerte donnée (par clé),
 * ou null si aucune n'a encore été envoyée. Sert à éviter de renvoyer la
 * même alerte à chaque régénération horaire tant qu'elle reste active.
 */
export async function getLastAlertTime(cle) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("alertes")
    .select("envoye_le")
    .eq("cle", cle)
    .order("envoye_le", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return new Date(data[0].envoye_le);
}

export async function recordAlertSent(cle, niveau, message) {
  const supabase = getClient();
  if (!supabase) return;

  const { error } = await supabase.from("alertes").insert([{ cle, niveau, message }]);
  if (error) {
    console.error("Supabase alert insert error:", error.message);
  }
}
