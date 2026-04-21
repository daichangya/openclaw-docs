---
read_when:
    - Configuration de Synology Chat avec OpenClaw
    - Débogage du routage des Webhooks Synology Chat
summary: Configuration du Webhook Synology Chat et configuration d’OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Statut : plugin groupé de canal de messages directs utilisant les Webhooks Synology Chat.
Le plugin accepte les messages entrants depuis les Webhooks sortants de Synology Chat et envoie les réponses
via un Webhook entrant Synology Chat.

## Plugin groupé

Synology Chat est livré comme plugin groupé dans les versions actuelles d’OpenClaw, donc les
builds empaquetés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Synology Chat,
installez-le manuellement :

Installer depuis une extraction locale :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Assurez-vous que le plugin Synology Chat est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement depuis une extraction du code source avec la commande ci-dessus.
   - `openclaw onboard` affiche désormais Synology Chat dans la même liste de configuration des canaux que `openclaw channels add`.
   - Configuration non interactive : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Dans les intégrations Synology Chat :
   - Créez un Webhook entrant et copiez son URL.
   - Créez un Webhook sortant avec votre jeton secret.
3. Pointez l’URL du Webhook sortant vers votre Gateway OpenClaw :
   - `https://gateway-host/webhook/synology` par défaut.
   - Ou votre `channels.synology-chat.webhookPath` personnalisé.
4. Terminez la configuration dans OpenClaw.
   - Guidé : `openclaw onboard`
   - Direct : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Redémarrez la Gateway et envoyez un DM au bot Synology Chat.

Détails de l’authentification du Webhook :

- OpenClaw accepte le jeton du Webhook sortant depuis `body.token`, puis
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

## Politique de DM et contrôle d’accès

- `dmPolicy: "allowlist"` est la valeur par défaut recommandée.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’identifiants utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est traitée comme une erreur de configuration et la route du Webhook ne démarrera pas (utilisez `dmPolicy: "open"` pour tout autoriser).
- `dmPolicy: "open"` autorise n’importe quel expéditeur.
- `dmPolicy: "disabled"` bloque les DM.
- La liaison du destinataire des réponses reste basée par défaut sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité de dernier recours qui réactive la recherche par nom d’utilisateur/surnom mutable pour la livraison des réponses.
- Les approbations d’appairage fonctionnent avec :
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Livraison sortante

Utilisez des identifiants utilisateur Synology Chat numériques comme cibles.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Les envois de médias sont pris en charge par la livraison de fichiers basée sur URL.
Les URL de fichiers sortants doivent utiliser `http` ou `https`, et les cibles réseau privées ou autrement bloquées sont rejetées avant qu’OpenClaw ne transmette l’URL au Webhook NAS.

## Multi-comptes

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut remplacer le jeton, l’URL entrante, le chemin du Webhook, la politique de DM et les limites.
Les sessions de messages directs sont isolées par compte et par utilisateur, donc le même `user_id` numérique
sur deux comptes Synology différents ne partage pas l’état de transcription.
Donnez à chaque compte activé un `webhookPath` distinct. OpenClaw rejette désormais les chemins exacts dupliqués
et refuse de démarrer les comptes nommés qui n’héritent que d’un chemin de Webhook partagé dans les configurations multi-comptes.
Si vous avez intentionnellement besoin d’un héritage historique pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou sur `channels.synology-chat`,
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
- Les requêtes entrantes de Webhook sont vérifiées par jeton et limitées en débit par expéditeur.
- Les vérifications de jeton invalide utilisent une comparaison de secret en temps constant et échouent en mode fermé.
- Préférez `dmPolicy: "allowlist"` en production.
- Gardez `dangerouslyAllowNameMatching` désactivé sauf si vous avez explicitement besoin d’une livraison de réponse historique basée sur le nom d’utilisateur.
- Gardez `dangerouslyAllowInheritedWebhookPath` désactivé sauf si vous acceptez explicitement le risque de routage à chemin partagé dans une configuration multi-comptes.

## Dépannage

- `Missing required fields (token, user_id, text)` :
  - la charge utile du Webhook sortant ne contient pas l’un des champs requis
  - si Synology envoie le jeton dans les en-têtes, assurez-vous que la Gateway/le proxy préserve ces en-têtes
- `Invalid token` :
  - le secret du Webhook sortant ne correspond pas à `channels.synology-chat.token`
  - la requête atteint le mauvais compte/chemin de Webhook
  - un proxy inverse a supprimé l’en-tête du jeton avant que la requête n’atteigne OpenClaw
- `Rate limit exceeded` :
  - trop de tentatives de jeton invalide depuis la même source peuvent temporairement bloquer cette source
  - les expéditeurs authentifiés ont aussi une limite de débit distincte par utilisateur pour les messages
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.` :
  - `dmPolicy="allowlist"` est activé mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur n’est pas dans `allowedUserIds`

## Liens associés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — flux d’authentification DM et d’appairage
- [Groupes](/fr/channels/groups) — comportement du chat de groupe et contrôle des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
