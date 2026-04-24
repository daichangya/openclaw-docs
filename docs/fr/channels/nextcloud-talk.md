---
read_when:
    - Travailler sur les fonctionnalités du canal Nextcloud Talk
summary: Statut de la prise en charge de Nextcloud Talk, capacités et configuration
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T07:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Statut : Plugin groupé (bot Webhook). Les messages privés, salles, réactions et messages Markdown sont pris en charge.

## Plugin groupé

Nextcloud Talk est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw, donc
les builds empaquetés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Nextcloud Talk,
installez-le manuellement :

Installer via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Nextcloud Talk est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’incluent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Sur votre serveur Nextcloud, créez un bot :

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Activez le bot dans les paramètres de la salle cible.
4. Configurez OpenClaw :
   - Configuration : `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variable d’environnement : `NEXTCLOUD_TALK_BOT_SECRET` (compte par défaut uniquement)

   Configuration CLI :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Champs explicites équivalents :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Secret basé sur un fichier :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Redémarrez le Gateway (ou terminez la configuration).

Configuration minimale :

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Remarques

- Les bots ne peuvent pas initier de messages privés. L’utilisateur doit d’abord envoyer un message au bot.
- L’URL Webhook doit être accessible par le Gateway ; définissez `webhookPublicUrl` si vous êtes derrière un proxy.
- Les envois de médias ne sont pas pris en charge par l’API bot ; les médias sont envoyés sous forme d’URL.
- La charge utile Webhook ne distingue pas les messages privés des salles ; définissez `apiUser` + `apiPassword` pour activer les recherches de type de salle (sinon les messages privés sont traités comme des salles).

## Contrôle d’accès (messages privés)

- Par défaut : `channels.nextcloud-talk.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage.
- Approuver via :
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messages privés publics : `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` correspond uniquement aux identifiants utilisateur Nextcloud ; les noms d’affichage sont ignorés.

## Salles (groupes)

- Par défaut : `channels.nextcloud-talk.groupPolicy = "allowlist"` (filtré par mention).
- Autorisez des salles avec `channels.nextcloud-talk.rooms` :

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Pour n’autoriser aucune salle, laissez la liste d’autorisation vide ou définissez `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacités

| Fonctionnalité  | Statut        |
| --------------- | ------------- |
| Messages privés | Pris en charge |
| Salles          | Pris en charge |
| Fils            | Non pris en charge |
| Médias          | URL uniquement |
| Réactions       | Pris en charge |
| Commandes natives | Non prises en charge |

## Référence de configuration (Nextcloud Talk)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.nextcloud-talk.enabled` : activer/désactiver le démarrage du canal.
- `channels.nextcloud-talk.baseUrl` : URL de l’instance Nextcloud.
- `channels.nextcloud-talk.botSecret` : secret partagé du bot.
- `channels.nextcloud-talk.botSecretFile` : chemin du secret dans un fichier régulier. Les liens symboliques sont rejetés.
- `channels.nextcloud-talk.apiUser` : utilisateur API pour les recherches de salles (détection des messages privés).
- `channels.nextcloud-talk.apiPassword` : mot de passe API/app pour les recherches de salles.
- `channels.nextcloud-talk.apiPasswordFile` : chemin du fichier du mot de passe API.
- `channels.nextcloud-talk.webhookPort` : port de l’écouteur Webhook (par défaut : 8788).
- `channels.nextcloud-talk.webhookHost` : hôte Webhook (par défaut : 0.0.0.0).
- `channels.nextcloud-talk.webhookPath` : chemin Webhook (par défaut : /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl` : URL Webhook accessible depuis l’extérieur.
- `channels.nextcloud-talk.dmPolicy` : `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom` : liste d’autorisation des messages privés (identifiants utilisateur). `open` exige `"*"`.
- `channels.nextcloud-talk.groupPolicy` : `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom` : liste d’autorisation de groupe (identifiants utilisateur).
- `channels.nextcloud-talk.rooms` : paramètres par salle et liste d’autorisation.
- `channels.nextcloud-talk.historyLimit` : limite d’historique des groupes (0 désactive).
- `channels.nextcloud-talk.dmHistoryLimit` : limite d’historique des messages privés (0 désactive).
- `channels.nextcloud-talk.dms` : remplacements par message privé (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit` : taille de segmentation du texte sortant (caractères).
- `channels.nextcloud-talk.chunkMode` : `length` (par défaut) ou `newline` pour scinder sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.nextcloud-talk.blockStreaming` : désactiver le streaming par blocs pour ce canal.
- `channels.nextcloud-talk.blockStreamingCoalesce` : réglage de fusion du streaming par blocs.
- `channels.nextcloud-talk.mediaMaxMb` : limite des médias entrants (MB).

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des chats de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
