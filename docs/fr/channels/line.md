---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous avez besoin de configurer le webhook et les identifiants LINE
    - Vous souhaitez utiliser des options de message spécifiques à LINE
summary: Configuration, paramètres et utilisation du plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-05T12:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE se connecte à OpenClaw via la LINE Messaging API. Le plugin s'exécute comme récepteur
de webhook sur la gateway et utilise votre jeton d'accès de canal ainsi que le secret de canal pour
l'authentification.

Statut : plugin intégré. Les messages privés, discussions de groupe, médias, localisations, messages Flex,
messages de modèle et réponses rapides sont pris en charge. Les réactions et les fils de discussion
ne sont pas pris en charge.

## Plugin intégré

LINE est livré comme plugin intégré dans les versions actuelles d'OpenClaw, donc les builds
packagés normaux ne nécessitent pas d'installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut LINE, installez-le
manuellement :

```bash
openclaw plugins install @openclaw/line
```

Extraction locale (lors de l'exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un fournisseur et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de la Messaging API.
5. Définissez l'URL du webhook sur le point de terminaison de votre gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

La gateway répond à la vérification du webhook LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d'un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l'URL à jour en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps (HMAC sur le corps brut), donc OpenClaw applique des limites strictes de corps avant authentification et un délai d'expiration avant la vérification.
- OpenClaw traite les événements de webhook à partir des octets bruts de la requête vérifiée. Les valeurs `req.body` transformées par le middleware en amont sont ignorées pour préserver l'intégrité de la signature.

## Configurer

Configuration minimale :

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variables d'environnement (compte par défaut uniquement) :

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Fichiers de jeton/secret :

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` et `secretFile` doivent pointer vers des fichiers ordinaires. Les liens symboliques sont rejetés.

Comptes multiples :

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Contrôle d'accès

Les messages privés utilisent par défaut le jumelage. Les expéditeurs inconnus reçoivent un code de jumelage et leurs
messages sont ignorés jusqu'à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d'autorisation et politiques :

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs utilisateur LINE autorisés pour les messages privés
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Note d'exécution : si `channels.line` est complètement absent, l'exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les IDs LINE sont sensibles à la casse. Les IDs valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en segments de 5000 caractères.
- Le formatage Markdown est supprimé ; les blocs de code et tableaux sont convertis en cartes Flex
  lorsque cela est possible.
- Les réponses en streaming sont mises en tampon ; LINE reçoit des segments complets avec une animation
  de chargement pendant que l'agent travaille.
- Les téléchargements de médias sont limités par `channels.line.mediaMaxMb` (10 par défaut).

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, localisations, cartes Flex ou messages
de modèle.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Le plugin LINE inclut aussi une commande `/card` pour les préréglages de messages Flex :

```
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Voir [Agents ACP](/tools/acp-agents) pour plus de détails.

## Médias sortants

Le plugin LINE prend en charge l'envoi d'images, de vidéos et de fichiers audio via l'outil de message de l'agent. Les médias sont envoyés via le chemin de livraison spécifique à LINE avec une gestion appropriée de l'aperçu et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d'aperçu.
- **Vidéos** : envoyées avec une gestion explicite de l'aperçu et du type de contenu.
- **Audio** : envoyés comme messages audio LINE.

Les envois de médias génériques reviennent au chemin existant limité aux images lorsqu'un chemin spécifique à LINE n'est pas disponible.

## Dépannage

- **La vérification du webhook échoue :** assurez-vous que l'URL du webhook utilise HTTPS et que `channelSecret` correspond à celui de la console LINE.
- **Aucun événement entrant :** confirmez que le chemin du webhook correspond à `channels.line.webhookPath`
  et que la gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la
  limite par défaut.

## Lié

- [Vue d'ensemble des canaux](/channels) — tous les canaux pris en charge
- [Jumelage](/channels/pairing) — authentification en message privé et flux de jumelage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/gateway/security) — modèle d'accès et durcissement
