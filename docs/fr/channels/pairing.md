---
read_when:
    - Configurer le contrôle d’accès aux DM
    - Appairer un nouveau nœud iOS/Android
    - Examiner la posture de sécurité d’OpenClaw
summary: 'Vue d’ensemble de l’appairage : approuver qui peut vous envoyer des DM et quels nœuds peuvent rejoindre'
title: Appairage
x-i18n:
    generated_at: "2026-04-05T12:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Appairage

L’« appairage » est l’étape explicite **d’approbation du propriétaire** d’OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage DM** (qui est autorisé à parler au bot)
2. **Appairage de nœud** (quels appareils/nœuds sont autorisés à rejoindre le réseau gateway)

Contexte de sécurité : [Sécurité](/gateway/security)

## 1) Appairage DM (accès entrant au chat)

Lorsqu’un canal est configuré avec la politique DM `pairing`, les expéditeurs inconnus reçoivent un code court et leur message **n’est pas traité** tant que vous ne l’avez pas approuvé.

Les politiques DM par défaut sont documentées dans : [Sécurité](/gateway/security)

Codes d’appairage :

- 8 caractères, en majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message d’appairage que lorsqu’une nouvelle demande est créée (environ une fois par heure et par expéditeur).
- Les demandes d’appairage DM en attente sont limitées à **3 par canal** par défaut ; les demandes supplémentaires sont ignorées jusqu’à ce que l’une expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canaux pris en charge : `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Où l’état est stocké

Stocké sous `~/.openclaw/credentials/` :

- Demandes en attente : `<channel>-pairing.json`
- Stockage de liste d’autorisation approuvée :
  - Compte par défaut : `<channel>-allowFrom.json`
  - Compte non par défaut : `<channel>-<accountId>-allowFrom.json`

Comportement de portée par compte :

- Les comptes non par défaut lisent/écrivent uniquement leur fichier de liste d’autorisation à portée définie.
- Le compte par défaut utilise le fichier de liste d’autorisation sans portée, à portée du canal.

Traitez ces fichiers comme sensibles (ils contrôlent l’accès à votre assistant).

Important : ce stockage concerne l’accès DM. L’autorisation de groupe est distincte.
L’approbation d’un code d’appairage DM n’autorise pas automatiquement cet expéditeur à exécuter des commandes de groupe ou à contrôler le bot dans des groupes. Pour l’accès de groupe, configurez les listes d’autorisation de groupe explicites du canal (par exemple `groupAllowFrom`, `groups`, ou des remplacements par groupe/par sujet selon le canal).

## 2) Appairage d’appareil de nœud (nœuds iOS/Android/macOS/headless)

Les nœuds se connectent à Gateway en tant qu’**appareils** avec `role: node`. Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairer via Telegram (recommandé pour iOS)

Si vous utilisez le plugin `device-pair`, vous pouvez effectuer le premier appairage d’appareil entièrement depuis Telegram :

1. Dans Telegram, envoyez au bot : `/pair`
2. Le bot répond avec deux messages : un message d’instructions et un message distinct de **code de configuration** (facile à copier/coller dans Telegram).
3. Sur votre téléphone, ouvrez l’application iOS OpenClaw → Paramètres → Gateway.
4. Collez le code de configuration et connectez-vous.
5. De retour dans Telegram : `/pair pending` (examinez les ID de demande, le rôle et les portées), puis approuvez.

Le code de configuration est une charge utile JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket de Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken` : un jeton bootstrap mono-appareil de courte durée utilisé pour la poignée de main d’appairage initiale

Ce jeton bootstrap transporte le profil bootstrap d’appairage intégré :

- le jeton `node` principal transmis reste `scopes: []`
- tout jeton `operator` transmis reste limité à la liste d’autorisation bootstrap :
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- les vérifications de portée bootstrap sont préfixées par rôle, et non regroupées dans un seul ensemble plat :
  les entrées de portée operator ne satisfont que les demandes operator, et les rôles non-operator
  doivent toujours demander des portées sous leur propre préfixe de rôle

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

### Approuver un appareil de nœud

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si le même appareil réessaie avec des détails d’authentification différents (par exemple un autre
rôle/des portées différentes/une autre clé publique), la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

### Stockage de l’état d’appairage de nœud

Stocké sous `~/.openclaw/devices/` :

- `pending.json` (de courte durée ; les demandes en attente expirent)
- `paired.json` (appareils appairés + jetons)

### Notes

- L’API héritée `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|rename`) est un
  stockage d’appairage distinct, géré par gateway. Les nœuds WS exigent toujours l’appairage d’appareil.
- L’enregistrement d’appairage est la source de vérité durable pour les rôles approuvés. Les jetons d’appareil actifs
  restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Documents associés

- Modèle de sécurité + injection de prompt : [Sécurité](/gateway/security)
- Mettre à jour en toute sécurité (exécuter doctor) : [Mise à jour](/install/updating)
- Configurations de canaux :
  - Telegram : [Telegram](/channels/telegram)
  - WhatsApp : [WhatsApp](/channels/whatsapp)
  - Signal : [Signal](/channels/signal)
  - BlueBubbles (iMessage) : [BlueBubbles](/channels/bluebubbles)
  - iMessage (hérité) : [iMessage](/channels/imessage)
  - Discord : [Discord](/channels/discord)
  - Slack : [Slack](/channels/slack)
