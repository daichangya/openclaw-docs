---
read_when:
    - Travailler sur les fonctionnalités du canal Nextcloud Talk
summary: Statut de prise en charge, capacités et configuration de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T12:35:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Statut : plugin intégré (bot webhook). Les messages privés, salons, réactions et messages en markdown sont pris en charge.

## Plugin intégré

Nextcloud Talk est livré comme plugin intégré dans les versions actuelles d'OpenClaw, donc
les builds packagés normaux ne nécessitent pas d'installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Nextcloud Talk,
installez-le manuellement :

Installer via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Extraction locale (lors de l'exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Détails : [Plugins](/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Nextcloud Talk est disponible.
   - Les versions packagées actuelles d'OpenClaw l'intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l'ajouter manuellement avec les commandes ci-dessus.
2. Sur votre serveur Nextcloud, créez un bot :

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Activez le bot dans les paramètres du salon cible.
4. Configurez OpenClaw :
   - Configuration : `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variable d'environnement : `NEXTCLOUD_TALK_BOT_SECRET` (compte par défaut uniquement)
5. Redémarrez la gateway (ou terminez la configuration).

Configuration minimale :

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

## Notes

- Les bots ne peuvent pas initier de messages privés. L'utilisateur doit d'abord envoyer un message au bot.
- L'URL du webhook doit être accessible par la gateway ; définissez `webhookPublicUrl` si vous êtes derrière un proxy.
- Les téléversements de médias ne sont pas pris en charge par l'API bot ; les médias sont envoyés sous forme d'URL.
- La charge utile du webhook ne distingue pas les messages privés des salons ; définissez `apiUser` + `apiPassword` pour activer les recherches de type de salon (sinon les messages privés sont traités comme des salons).

## Contrôle d'accès (messages privés)

- Par défaut : `channels.nextcloud-talk.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code de jumelage.
- Approuver via :
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messages privés publics : `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` correspond uniquement aux identifiants utilisateur Nextcloud ; les noms d'affichage sont ignorés.

## Salons (groupes)

- Par défaut : `channels.nextcloud-talk.groupPolicy = "allowlist"` (filtrage par mention).
- Ajoutez des salons à la liste d'autorisation avec `channels.nextcloud-talk.rooms` :

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

- Pour n'autoriser aucun salon, laissez la liste d'autorisation vide ou définissez `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacités

| Fonctionnalité | Statut            |
| -------------- | ----------------- |
| Messages privés | Pris en charge    |
| Salons         | Pris en charge    |
| Fils de discussion | Non pris en charge |
| Médias         | URL uniquement    |
| Réactions      | Pris en charge    |
| Commandes natives | Non prises en charge |

## Référence de configuration (Nextcloud Talk)

Configuration complète : [Configuration](/gateway/configuration)

Options du fournisseur :

- `channels.nextcloud-talk.enabled` : activer/désactiver le démarrage du canal.
- `channels.nextcloud-talk.baseUrl` : URL de l'instance Nextcloud.
- `channels.nextcloud-talk.botSecret` : secret partagé du bot.
- `channels.nextcloud-talk.botSecretFile` : chemin du secret dans un fichier ordinaire. Les liens symboliques sont rejetés.
- `channels.nextcloud-talk.apiUser` : utilisateur API pour les recherches de salon (détection des messages privés).
- `channels.nextcloud-talk.apiPassword` : mot de passe API/app pour les recherches de salon.
- `channels.nextcloud-talk.apiPasswordFile` : chemin du fichier de mot de passe API.
- `channels.nextcloud-talk.webhookPort` : port d'écoute du webhook (par défaut : 8788).
- `channels.nextcloud-talk.webhookHost` : hôte du webhook (par défaut : 0.0.0.0).
- `channels.nextcloud-talk.webhookPath` : chemin du webhook (par défaut : /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl` : URL de webhook accessible de l'extérieur.
- `channels.nextcloud-talk.dmPolicy` : `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom` : liste d'autorisation pour les messages privés (identifiants utilisateur). `open` nécessite `"*"`.
- `channels.nextcloud-talk.groupPolicy` : `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom` : liste d'autorisation de groupe (identifiants utilisateur).
- `channels.nextcloud-talk.rooms` : paramètres par salon et liste d'autorisation.
- `channels.nextcloud-talk.historyLimit` : limite d'historique de groupe (0 désactive).
- `channels.nextcloud-talk.dmHistoryLimit` : limite d'historique des messages privés (0 désactive).
- `channels.nextcloud-talk.dms` : remplacements par message privé (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit` : taille des segments de texte sortant (caractères).
- `channels.nextcloud-talk.chunkMode` : `length` (par défaut) ou `newline` pour découper sur des lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.nextcloud-talk.blockStreaming` : désactiver le streaming par blocs pour ce canal.
- `channels.nextcloud-talk.blockStreamingCoalesce` : réglage de fusion du streaming par blocs.
- `channels.nextcloud-talk.mediaMaxMb` : limite des médias entrants (Mo).

## Lié

- [Vue d'ensemble des canaux](/channels) — tous les canaux pris en charge
- [Jumelage](/channels/pairing) — authentification en message privé et flux de jumelage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/gateway/security) — modèle d'accès et durcissement
