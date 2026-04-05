---
read_when:
    - Configurer Synology Chat avec OpenClaw
    - Déboguer le routage des webhooks Synology Chat
summary: Configuration du webhook Synology Chat et d’OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T12:36:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Statut : plugin intégré de canal de message direct utilisant les webhooks Synology Chat.
Le plugin accepte les messages entrants des webhooks sortants Synology Chat et envoie les réponses
via un webhook entrant Synology Chat.

## Plugin intégré

Synology Chat est fourni comme plugin intégré dans les versions actuelles d’OpenClaw, donc les builds
empaquetés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Synology Chat,
installez-le manuellement :

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/tools/plugin)

## Configuration rapide

1. Assurez-vous que le plugin Synology Chat est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement depuis un checkout source avec la commande ci-dessus.
   - `openclaw onboard` affiche désormais Synology Chat dans la même liste de configuration des canaux que `openclaw channels add`.
   - Configuration non interactive : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Dans les intégrations Synology Chat :
   - Créez un webhook entrant et copiez son URL.
   - Créez un webhook sortant avec votre jeton secret.
3. Pointez l’URL du webhook sortant vers votre gateway OpenClaw :
   - `https://gateway-host/webhook/synology` par défaut.
   - Ou votre `channels.synology-chat.webhookPath` personnalisé.
4. Terminez la configuration dans OpenClaw.
   - Guidé : `openclaw onboard`
   - Direct : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Redémarrez la gateway et envoyez un message direct au bot Synology Chat.

Détails d’authentification du webhook :

- OpenClaw accepte le jeton du webhook sortant depuis `body.token`, puis
  `?token=...`, puis les en-têtes.
- Formes d’en-tête acceptées :
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Les jetons vides ou manquants échouent en mode fermé.

Configuration minimale :

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variables d’environnement

Pour le compte par défaut, vous pouvez utiliser des variables d’environnement :

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (séparés par des virgules)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Les valeurs de configuration remplacent les variables d’environnement.

## Politique DM et contrôle d’accès

- `dmPolicy: "allowlist"` est la valeur par défaut recommandée.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’identifiants utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est traitée comme une mauvaise configuration et la route webhook ne démarrera pas (utilisez `dmPolicy: "open"` pour tout autoriser).
- `dmPolicy: "open"` autorise n’importe quel expéditeur.
- `dmPolicy: "disabled"` bloque les messages directs.
- La liaison du destinataire des réponses reste basée par défaut sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité de secours qui réactive la recherche basée sur un nom d’utilisateur/surnom mutable pour la remise des réponses.
- Les approbations d’appairage fonctionnent avec :
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Remise sortante

Utilisez des identifiants utilisateur Synology Chat numériques comme cibles.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Les envois de médias sont pris en charge via la remise de fichiers basée sur URL.

## Multi-comptes

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut surcharger le jeton, l’URL entrante, le chemin webhook, la politique DM et les limites.
Les sessions de message direct sont isolées par compte et par utilisateur ; ainsi, le même `user_id` numérique
sur deux comptes Synology différents ne partage pas l’état de transcription.
Attribuez à chaque compte activé un `webhookPath` distinct. OpenClaw rejette désormais les chemins exacts dupliqués
et refuse de démarrer les comptes nommés qui héritent uniquement d’un chemin webhook partagé dans les configurations multi-comptes.
Si vous avez intentionnellement besoin de l’héritage historique pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou dans `channels.synology-chat`,
mais les chemins exacts dupliqués sont toujours rejetés en mode fermé. Préférez des chemins explicites par compte.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Notes de sécurité

- Gardez `token` secret et faites-le tourner en cas de fuite.
- Gardez `allowInsecureSsl: false` sauf si vous faites explicitement confiance à un certificat NAS local auto-signé.
- Les requêtes webhook entrantes sont vérifiées par jeton et limitées en débit par expéditeur.
- Les vérifications de jeton invalide utilisent une comparaison de secret en temps constant et échouent en mode fermé.
- Préférez `dmPolicy: "allowlist"` en production.
- Laissez `dangerouslyAllowNameMatching` désactivé sauf si vous avez explicitement besoin de la remise des réponses historique basée sur le nom d’utilisateur.
- Laissez `dangerouslyAllowInheritedWebhookPath` désactivé sauf si vous acceptez explicitement le risque de routage à chemin partagé dans une configuration multi-comptes.

## Dépannage

- `Missing required fields (token, user_id, text)` :
  - la charge utile du webhook sortant ne contient pas l’un des champs requis
  - si Synology envoie le jeton dans les en-têtes, assurez-vous que la gateway/le proxy conserve ces en-têtes
- `Invalid token` :
  - le secret du webhook sortant ne correspond pas à `channels.synology-chat.token`
  - la requête atteint le mauvais compte/chemin webhook
  - un proxy inverse a supprimé l’en-tête du jeton avant que la requête n’atteigne OpenClaw
- `Rate limit exceeded` :
  - trop de tentatives de jeton invalide depuis la même source peuvent temporairement bloquer cette source
  - les expéditeurs authentifiés ont aussi une limite de débit de messages distincte par utilisateur
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.` :
  - `dmPolicy="allowlist"` est activé mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur n’est pas dans `allowedUserIds`

## Voir aussi

- [Channels Overview](/channels) — tous les canaux pris en charge
- [Pairing](/channels/pairing) — authentification DM et flux d’appairage
- [Groups](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Channel Routing](/channels/channel-routing) — routage de session pour les messages
- [Security](/gateway/security) — modèle d’accès et renforcement
