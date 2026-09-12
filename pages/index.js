import { getWorldBankIndicators } from "../lib/sources/worldbank";
import { getWhoIndicators } from "../lib/sources/who";
import { searchHdxDatasets } from "../lib/sources/hdx";
import { getAcledEvents, getAcledWeeklyCount } from "../lib/sources/acled";
import { getBccIndicators } from "../lib/sources/bcc";
import { getReliefwebReports } from "../lib/sources/reliefweb";
import { getImfIndicators } from "../lib/sources/imf";
import { getUnhcrIndicators } from "../lib/sources/unhcr";
import { getInsIndicators } from "../lib/sources/ins";
import {
  saveSnapshot,
  getHistory,
  isHistoryConfigured,
  getLastAlertTime,
  recordAlertSent,
} from "../lib/db";
import { evaluateAlerts } from "../lib/alerts";
import { notifySlack } from "../lib/notify";
import { withValues, withLinks } from "../lib/format";
import Sparkline from "../components/Sparkline";

// ISR : la page est régénérée au maximum une fois par heure (3600s).
// À chaque régénération, si Supabase est configuré, on enregistre aussi un
// instantané horodaté — c'est ce qui permet de construire les courbes de
// tendance et d'évaluer les alertes.
export async function getStaticProps() {
  const [
    worldbank,
    who,
    hdxDeplacement,
    hdxSante,
    acled,
    acledWeeklyCount,
    bcc,
    reliefweb,
    imf,
    unhcr,
    ins,
  ] = await Promise.all([
    getWorldBankIndicators(),
    getWhoIndicators(),
    searchHdxDatasets("displacement"),
    searchHdxDatasets("health"),
    getAcledEvents(),
    getAcledWeeklyCount(),
    getBccIndicators(),
    getReliefwebReports(),
    getImfIndicators(),
    getUnhcrIndicators(),
    getInsIndicators(),
  ]);

  const snapshotRecords = [
    ...Object.entries(worldbank).map(([key, v]) => ({ source: "banque_mondiale", indicateur: key, valeur: v.value })),
    ...Object.entries(who).map(([key, v]) => ({ source: "oms", indicateur: key, valeur: v.value })),
    ...Object.entries(bcc.indicators || {}).map(([key, v]) => ({ source: "bcc", indicateur: key, valeur: v.value })),
    ...Object.entries(imf).map(([key, v]) => ({ source: "fmi", indicateur: key, valeur: v.value })),
    ...Object.entries(unhcr).map(([key, v]) => ({ source: "unhcr", indicateur: key, valeur: v.value })),
    ...Object.entries(ins.indicators || {}).map(([key, v]) => ({ source: "ins", indicateur: key, valeur: v.value })),
  ];
  if (acledWeeklyCount !== null) {
    snapshotRecords.push({ source: "acled", indicateur: "acled_events_7j", valeur: acledWeeklyCount });
  }

  await saveSnapshot(snapshotRecords);

  const historyConfigured = isHistoryConfigured();
  const [histAcled, histInflation, histPopulation] = historyConfigured
    ? await Promise.all([getHistory("acled_events_7j"), getHistory("inflation"), getHistory("population")])
    : [[], [], []];

  const alerts = evaluateAlerts({ worldbank, acledWeeklyCount, histAcled });

  if (historyConfigured) {
    for (const alert of alerts) {
      const lastSent = await getLastAlertTime(alert.cle);
      const dejaEnvoyeeRecemment = lastSent && Date.now() - lastSent.getTime() < 24 * 3600 * 1000;
      if (!dejaEnvoyeeRecemment) {
        await notifySlack(alert);
        await recordAlertSent(alert.cle, alert.niveau, alert.message);
      }
    }
  }

  return {
    props: {
      worldbank,
      who,
      hdxDeplacement,
      hdxSante,
      acled,
      acledWeeklyCount,
      bcc,
      reliefweb,
      imf,
      unhcr,
      ins,
      historyConfigured,
      histAcled,
      histInflation,
      histPopulation,
      alerts,
      generatedAt: new Date().toISOString(),
    },
    revalidate: 3600,
  };
}

function formatValue(entry) {
  const rounded = Math.round(entry.value * 100) / 100;
  return `${rounded}${entry.year ? ` (${entry.year})` : ""}`;
}

function KpiGrid({ items }) {
  return (
    <section className="kpis">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <div className="lbl">{k.label}</div>
          <div className="val">{formatValue(k)}</div>
        </div>
      ))}
    </section>
  );
}

function DatasetList({ items }) {
  return (
    <ul className="dataset-list">
      {items.map((d) => (
        <li key={d.url}>
          <a href={d.url} target="_blank" rel="noreferrer">{d.title}</a>
          <span className="dataset-meta">
            {(d.org || d.source) ?? ""} {(d.org || d.source) && "· "}
            {(d.updated || d.date || "").slice(0, 10)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Home({
  worldbank,
  who,
  hdxDeplacement,
  hdxSante,
  acled,
  acledWeeklyCount,
  bcc,
  reliefweb,
  imf,
  unhcr,
  ins,
  historyConfigured,
  histAcled,
  histInflation,
  histPopulation,
  alerts,
  generatedAt,
}) {
  const lastUpdate = new Date(generatedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  const worldbankKpis = withValues(worldbank);
  const whoRows = withValues(who);
  const bccKpis = withValues(bcc.indicators);
  const imfKpis = withValues(imf);
  const insKpis = withValues(ins.indicators);
  const unhcrKpis = withValues(unhcr);
  const hdxDeplacementRows = withLinks(hdxDeplacement);
  const hdxSanteRows = withLinks(hdxSante);
  const reliefwebRows = withLinks(reliefweb);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand-eyebrow">Observatoire national</div>
          <h1>RDC — Tableau de bord</h1>
          <p className="hero-sub">Sécurité, économie, santé et humanitaire — agrégés automatiquement.</p>
        </div>
        <div className="meta">
          <span><span className="live-dot" /> Actualisé automatiquement</span>
          <span>Dernière génération : {lastUpdate}</span>
        </div>
      </header>

      <div className="panel alerts-panel">
        <div className="panel-head">
          <div className="panel-title">Alertes actives</div>
          <div className="panel-sub">Seuils configurables — SEUIL_INFLATION / SEUIL_HAUSSE_ACLED</div>
        </div>
        {alerts.length > 0 ? (
          <div className="alert-list">
            {alerts.map((a) => (
              <div className="alert-item" key={a.cle}>
                <div className="alert-title">{a.title}</div>
                <div className="alert-message">{a.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Aucune alerte active pour le moment.</p>
        )}
      </div>

      {(worldbankKpis.length > 0 || acledWeeklyCount !== null) && (
        <section className="kpis">
          {worldbankKpis.map((k) => (
            <div className="kpi" key={k.label}><div className="lbl">{k.label}</div><div className="val">{formatValue(k)}</div></div>
          ))}
          {acledWeeklyCount !== null && (
            <div className="kpi"><div className="lbl">Événements ACLED (7 jours)</div><div className="val">{acledWeeklyCount}</div></div>
          )}
        </section>
      )}

      {bccKpis.length > 0 && (
        <div className="panel panel--bcc">
          <div className="panel-head">
            <div className="panel-title">Banque Centrale du Congo <span className="badge">bcc.cd</span></div>
            <div className="panel-sub">Cours de change datés et taux — page statistiques officielle de la BCC</div>
          </div>
          <KpiGrid items={bccKpis} />
        </div>
      )}

      {imfKpis.length > 0 && (
        <div className="panel panel--economie">
          <div className="panel-head">
            <div className="panel-title">Indicateurs macroéconomiques <span className="badge">FMI</span></div>
            <div className="panel-sub">Complémentaires à ceux de la Banque mondiale</div>
          </div>
          <KpiGrid items={imfKpis} />
        </div>
      )}

      {insKpis.length > 0 && (
        <div className="panel panel--economie">
          <div className="panel-head">
            <div className="panel-title">Statistiques nationales <span className="badge">INS RDC</span></div>
            <div className="panel-sub">Institut National de la Statistique — ins.gouv.cd</div>
          </div>
          <KpiGrid items={insKpis} />
        </div>
      )}

      {historyConfigured && (
        <div className="panel panel--economie">
          <div className="panel-head">
            <div className="panel-title">Tendances</div>
            <div className="panel-sub">Basées sur les instantanés enregistrés depuis le déploiement</div>
          </div>
          <div className="trend-grid">
            {histAcled.length > 1 && (
              <div><div className="trend-label">Événements ACLED / 7 jours</div><Sparkline points={histAcled} /></div>
            )}
            {histInflation.length > 1 && (
              <div><div className="trend-label">Inflation (Banque mondiale)</div><Sparkline points={histInflation} color="#5d90b0" /></div>
            )}
            {histPopulation.length > 1 && (
              <div><div className="trend-label">Population</div><Sparkline points={histPopulation} color="#4f9a72" /></div>
            )}
          </div>
        </div>
      )}

      {acled.configured && acled.events.length > 0 && (
        <div className="panel panel--securite">
          <div className="panel-head">
            <div className="panel-title">Sécurité — événements récents <span className="badge">ACLED</span></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Province</th><th>Type</th><th>Victimes</th></tr></thead>
            <tbody>
              {acled.events.map((e, i) => (
                <tr key={i}><td>{e.date}</td><td>{e.province}</td><td>{e.type}</td><td>{e.fatalities}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {whoRows.length > 0 && (
        <div className="panel panel--sante">
          <div className="panel-head"><div className="panel-title">Santé <span className="badge">OMS</span></div></div>
          <table><tbody>
            {whoRows.map((k) => (<tr key={k.label}><td>{k.label}</td><td>{formatValue(k)}</td></tr>))}
          </tbody></table>
        </div>
      )}

      {unhcrKpis.length > 0 && (
        <div className="panel panel--humanitaire">
          <div className="panel-head">
            <div className="panel-title">Déplacement forcé <span className="badge">UNHCR</span></div>
            <div className="panel-sub">Réfugiés et déplacés internes</div>
          </div>
          <KpiGrid items={unhcrKpis} />
        </div>
      )}

      {reliefwebRows.length > 0 && (
        <div className="panel panel--humanitaire">
          <div className="panel-head">
            <div className="panel-title">Rapports humanitaires <span className="badge">ONG / OCHA — ReliefWeb</span></div>
          </div>
          <DatasetList items={reliefwebRows} />
        </div>
      )}

      {hdxDeplacementRows.length > 0 && (
        <div className="panel panel--humanitaire">
          <div className="panel-head"><div className="panel-title">Déplacement — jeux de données <span className="badge">HDX</span></div></div>
          <DatasetList items={hdxDeplacementRows} />
        </div>
      )}

      {hdxSanteRows.length > 0 && (
        <div className="panel panel--sante">
          <div className="panel-head"><div className="panel-title">Santé — jeux de données <span className="badge">HDX</span></div></div>
          <DatasetList items={hdxSanteRows} />
        </div>
      )}

      <footer>
        Sources : Banque mondiale, FMI, OMS, BCC, INS RDC, UNHCR, HDX/OCHA, ReliefWeb, ACLED. Rafraîchissement automatique toutes les heures.
      </footer>
    </div>
  );
}
