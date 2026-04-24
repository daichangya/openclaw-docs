---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous avez besoin de configurer le Webhook LINE et les identifiants
    - Vous souhaitez des options de messagerie spécifiques à LINE
summary: Configuration, paramétrage et utilisation du plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T07:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE se connecte à OpenClaw via la LINE Messaging API. Le plugin s’exécute comme
récepteur de Webhook sur le gateway et utilise votre jeton d’accès au canal ainsi que votre secret de canal pour
l’authentification.

Statut : plugin inclus. Les messages directs, les discussions de groupe, les médias, les emplacements, les messages Flex,
les messages de modèle et les réponses rapides sont pris en charge. Les réactions et les fils de discussion
ne sont pas pris en charge.

## Plugin inclus

LINE est fourni comme plugin inclus dans les versions actuelles d’OpenClaw, donc les builds packagés
normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut LINE, installez-le
manuellement :

```bash
openclaw plugins install @openclaw/line
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration initiale

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un fournisseur et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de la Messaging API.
5. Définissez l’URL du Webhook sur votre point de terminaison gateway (HTTPS requis) :

```text
https://gateway-host/line/webhook
```

Le gateway répond à la vérification du Webhook de LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Remarque de sécurité :

- La vérification de signature LINE dépend du corps de requête (HMAC sur le corps brut), donc OpenClaw applique des limites strictes de taille de corps avant authentification ainsi qu’un délai d’expiration avant vérification.
- OpenClaw traite les événements Webhook à partir des octets bruts de la requête vérifiée. Les valeurs `req.body` transformées par un middleware en amont sont ignorées pour préserver l’intégrité de la signature.

## Configurer

Configuration minimale :

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

Variables d’environnement (compte par défaut uniquement) :

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Fichiers de jeton/secret :

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

Comptes multiples :

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

## Contrôle d’accès

Les messages directs utilisent par défaut l’appairage. Les expéditeurs inconnus reçoivent un code d’appairage et leurs
messages sont ignorés jusqu’à leur approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled`
- `channels.line.allowFrom` : identifiants utilisateur LINE autorisés pour les messages directs
- `channels.line.groupPolicy` : `allowlist | open | disabled`
- `channels.line.groupAllowFrom` : identifiants utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Remarque d’exécution : si `channels.line` est complètement absent, l’exécution utilise `groupPolicy="allowlist"` comme repli pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les identifiants LINE sont sensibles à la casse. Les identifiants valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salle : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en morceaux de 5000 caractères.
- Le formatage Markdown est supprimé ; les blocs de code et les tableaux sont convertis en cartes Flex lorsque cela est possible.
- Les réponses en streaming sont mises en tampon ; LINE reçoit des blocs complets avec une animation de chargement pendant que l’agent travaille.
- Les téléchargements de médias sont plafonnés par `channels.line.mediaMaxMb` (10 par défaut).

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages de modèle.

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

Le plugin LINE fournit également une commande `/card` pour les préréglages de messages Flex :

```text
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge d’ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Voir [Agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de message de l’agent. Les médias sont envoyés via le chemin de livraison spécifique à LINE avec une gestion appropriée de l’aperçu et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL des médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d’hôte cible avant de transmettre l’URL à LINE et rejette les cibles de type loopback, link-local et réseaux privés.

Les envois de médias génériques reviennent au chemin existant réservé aux images lorsqu’un chemin spécifique à LINE n’est pas disponible.

## Dépannage

- **La vérification du Webhook échoue :** assurez-vous que l’URL du Webhook est en HTTPS et que `channelSecret` correspond à celui de la console LINE.
- **Aucun événement entrant :** confirmez que le chemin du Webhook correspond à `channels.line.webhookPath` et que le gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la limite par défaut.

## Lié

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et flux d’appairage
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
