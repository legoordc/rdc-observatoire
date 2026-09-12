// Notification Slack optionnelle. Créez un webhook entrant gratuit sur
// https://api.slack.com/messaging/webhooks puis renseignez SLACK_WEBHOOK_URL
// (voir .env.example). Sans cette variable, les alertes restent visibles
// dans le dashboard mais ne sont envoyées nulle part ailleurs.

export async function notifySlack(alert) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `*[RDC Observatoire] ${alert.title}*\n${alert.message}`,
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}
