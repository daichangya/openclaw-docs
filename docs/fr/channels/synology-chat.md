---
read_when:
    - Configurer Synology Chat avec OpenClaw
    - Débogage du routage du Webhook Synology Chat
summary: Configuration du Webhook Synology Chat et de OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Statut : plugin groupé de canal de messages directs utilisant des Webhooks Synology Chat.
Le plugin accepte les messages entrants depuis les Webhooks sortants de Synology Chat et envoie les réponses
via un Webhook entrant Synology Chat.

## Plugin groupé

Synology Chat est livré comme plugin groupé dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Synology Chat,
installez-le manuellement :

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Assurez-vous que le plugin Synology Chat est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement depuis un checkout du code source avec la commande ci-dessus.
   - `openclaw onboard` affiche désormais Synology Chat dans la même liste de configuration de canal que `openclaw channels add`.
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
5. Redémarrez la Gateway et envoyez un message direct au bot Synology Chat.

Détails de l’authentification du Webhook :

- OpenClaw accepte le jeton du Webhook sortant depuis `body.token`, puis
  `?token=...`, puis les en-têtes.
- Formes d’en-tête acceptées :
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Les jetons vides ou absents échouent en mode fermé.

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

`SYNOLOGY_CHAT_INCOMING_URL` ne peut pas être défini depuis un `.env` d’espace de travail ; voir [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Politique de message direct et contrôle d’accès

- `dmPolicy: "allowlist"` est la valeur par défaut recommandée.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’ID utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est traitée comme une mauvaise configuration et la route du Webhook ne démarrera pas (utilisez `dmPolicy: "open"` pour tout autoriser).
- `dmPolicy: "open"` autorise n’importe quel expéditeur.
- `dmPolicy: "disabled"` bloque les messages directs.
- La liaison du destinataire des réponses reste basée par défaut sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité de secours qui réactive la recherche par nom d’utilisateur/surnom mutable pour la livraison des réponses.
- Les approbations d’appairage fonctionnent avec :
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Livraison sortante

Utilisez des ID utilisateur Synology Chat numériques comme cibles.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Les envois de médias sont pris en charge via la livraison de fichiers basée sur URL.
Les URL de fichiers sortants doivent utiliser `http` ou `https`, et les cibles réseau privées ou autrement bloquées sont rejetées avant qu’OpenClaw ne transmette l’URL au Webhook du NAS.

## Multi-compte

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut remplacer le jeton, l’URL entrante, le chemin du Webhook, la politique de message direct et les limites.
Les sessions de messages directs sont isolées par compte et par utilisateur, donc le même `user_id` numérique
sur deux comptes Synology différents ne partage pas l’état de transcription.
Donnez à chaque compte activé un `webhookPath` distinct. OpenClaw rejette désormais les chemins exacts en double
et refuse de démarrer les comptes nommés qui héritent seulement d’un chemin de Webhook partagé dans des configurations multi-comptes.
Si vous avez intentionnellement besoin de l’héritage ancien pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou dans `channels.synology-chat`,
mais les chemins exacts en double sont toujours rejetés en mode fermé. Préférez des chemins explicites par compte.

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

- Gardez `token` secret et faites-le tourner s’il est divulgué.
- Conservez `allowInsecureSsl: false` sauf si vous faites explicitement confiance à un certificat NAS local auto-signé.
- Les requêtes entrantes du Webhook sont vérifiées par jeton et limitées en débit par expéditeur.
- Les vérifications de jeton invalide utilisent une comparaison de secret en temps constant et échouent en mode fermé.
- Préférez `dmPolicy: "allowlist"` en production.
- Laissez `dangerouslyAllowNameMatching` désactivé sauf si vous avez explicitement besoin de l’ancien mode de livraison des réponses basé sur le nom d’utilisateur.
- Laissez `dangerouslyAllowInheritedWebhookPath` désactivé sauf si vous acceptez explicitement le risque de routage à chemin partagé dans une configuration multi-comptes.

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
  - les expéditeurs authentifiés ont aussi une limite de débit séparée par utilisateur pour les messages
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.` :
  - `dmPolicy="allowlist"` est activé mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur n’est pas dans `allowedUserIds`

## Associé

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement du chat de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
