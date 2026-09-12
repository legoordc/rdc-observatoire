# RDC — Observatoire (v0.4)

Dashboard national qui agrège automatiquement des données publiques sur la RDC
(sécurité, économie, santé, déplacement), se rafraîchit tout seul, garde un
historique pour tracer des tendances, et déclenche des alertes sur seuils.

## ⚠️ À propos du "temps réel"

Aucune des sources publiques utilisées ici n'est réellement en flux continu — la
Banque mondiale, le FMI, l'OMS et HDX publient des mises à jour quotidiennes à
mensuelles ; ACLED publie en général chaque semaine ; la BCC met à jour ses
cours de change quotidiennement. Ce projet consulte ces sources **toutes les
heures** (le maximum raisonnable et gratuit), ce qui donne un dashboard "quasi
temps réel" : toujours à jour par rapport à ce que les sources elles-mêmes
publient, sans attente manuelle de votre part.

## Ce que fait cette version

- **Banque mondiale** (inflation, croissance, population, pauvreté) — fonctionne sans clé.
- **FMI** (PIB/habitant, dette publique, compte courant, chômage) — fonctionne sans clé, complémentaire à la Banque mondiale.
- **OMS** (vaccination, paludisme, espérance de vie) — fonctionne sans clé.
- **Banque Centrale du Congo (BCC)** (cours de change, taux directeur, inflation) — extrait du site officiel bcc.cd, pas d'API publique documentée à ce jour donc fragile par nature, mais dégrade proprement (aucune valeur affichée si la lecture échoue).
- **INS RDC** (inflation, croissance, pauvreté) — portail national encore en construction ; les valeurs "0,00 %" par défaut du site sont filtrées pour éviter d'afficher une statistique factice.
- **UNHCR** (réfugiés congolais à l'étranger, déplacés internes, réfugiés accueillis) — fonctionne sans clé.
- **HDX/OCHA** — liste les jeux de données récents sur le déplacement et la santé (métadonnées + lien) — fonctionne sans clé.
- **ReliefWeb (OCHA/ONG)** — rapports humanitaires récents sur la RDC — fonctionne sans clé.
- **ACLED** (violence politique + compteur hebdomadaire) — fonctionne une fois vos identifiants gratuits ajoutés.
- **Historique et tendances** — à chaque régénération horaire, un instantané est enregistré dans Supabase ; le dashboard affiche des courbes de tendance construites automatiquement au fil du temps.
- **Alertes sur seuils** — inflation au-dessus de `SEUIL_INFLATION` (15% par défaut), hausse des événements ACLED de plus de `SEUIL_HAUSSE_ACLED` (×1.2 par défaut) par rapport à la moyenne des semaines précédentes. Affichées dans l'app, et envoyables sur Slack.
- **Données vides supprimées** — toute source qui ne renvoie rien pour un indicateur donné (au lieu d'un "—") fait disparaître la ligne/carte correspondante ; un panneau entier disparaît s'il n'a aucune donnée exploitable.

## Déploiement sur GitHub puis Netlify ou Vercel (gratuit)

1. **Créer le dépôt GitHub** :
   - Sur github.com, cliquez **New repository**, nommez-le (ex. `rdc-observatoire`), ne cochez pas "Add a README".
   - Dans ce dossier décompressé, ouvrez un terminal :
     ```
     git init
     git add .
     git commit -m "Premier commit"
     git branch -M main
     git remote add origin https://github.com/VOTRE-COMPTE/rdc-observatoire.git
     git push -u origin main
     ```
2. **Créer le projet Supabase** (pour l'historique et les alertes) :
   - Sur supabase.com, créez un nouveau projet gratuit.
   - `SQL Editor → New query`, collez le contenu de `supabase/schema.sql`, cliquez **Run**.
   - `Project Settings → API` : notez l'**URL du projet** et la clé **service_role**.
3. **Connecter le dépôt à Netlify ou Vercel** :
   - Netlify : `Add new site → Import an existing project` → choisissez le dépôt GitHub.
   - Vercel : `Add New → Project` → choisissez le dépôt GitHub.
   - Les deux détectent Next.js automatiquement.
4. **Avant le premier déploiement**, ajoutez les variables d'environnement (Site/Project settings → Environment variables) :
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (obligatoires pour l'historique et les alertes)
   - `ACLED_EMAIL`, `ACLED_KEY` *(optionnel — acleddata.com/register)*
   - `SLACK_WEBHOOK_URL` *(optionnel — api.slack.com/messaging/webhooks)*
   - `SEUIL_INFLATION`, `SEUIL_HAUSSE_ACLED` *(optionnel, sinon valeurs par défaut 15 et 1.2)*
   - Aucune clé requise pour Banque mondiale, FMI, OMS, BCC, INS, UNHCR, HDX, ReliefWeb.
5. Déployez. L'URL publique est générée automatiquement, et chaque futur
   `git push` redéploie le site tout seul.

## Pourquoi les courbes de tendance sont vides au début

L'historique se construit **après le déploiement** : chaque régénération
horaire ajoute un point. Après quelques jours en ligne, les courbes
deviennent lisibles. Rien à faire de votre côté, c'est automatique.

## Développement local

```
npm install
cp .env.example .env.local   # puis remplissez vos clés
npm run dev
```
Puis ouvrez http://localhost:3000

Pour lancer les tests unitaires :
```
npm test
```

## Prochaines étapes possibles

- Parsing détaillé des CSV/HXL d'HDX au lieu de simples liens vers les jeux de données.
- Découpage par province plutôt que national uniquement.
- Niveaux d'alerte différenciés (attention / critique) une fois l'usage réel connu.
- Suivre la publication d'une vraie API/SDMX par l'INS RDC (mentionnée sur leur portail comme "à venir") pour remplacer l'extraction actuelle par un appel structuré.

Dites-moi laquelle vous intéresse en premier et on la construit.
