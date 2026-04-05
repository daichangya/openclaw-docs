---
read_when:
    - Vous voulez connecter OpenClaw à QQ
    - Vous avez besoin de configurer les identifiants QQ Bot
    - Vous voulez la prise en charge des groupes ou des conversations privées QQ Bot
summary: Configuration, paramètres et utilisation de QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T12:35:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot se connecte à OpenClaw via l’API officielle QQ Bot (passerelle WebSocket). Le plugin prend en charge les conversations privées C2C, les @messages de groupe et les messages de canal de guilde avec des médias enrichis (images, voix, vidéo, fichiers).

Statut : plugin intégré. Les messages directs, les discussions de groupe, les canaux de guilde et les médias sont pris en charge. Les réactions et les fils ne sont pas pris en charge.

## Plugin intégré

Les versions actuelles d’OpenClaw incluent QQ Bot, donc les builds empaquetés normaux n’ont pas besoin d’une étape séparée `openclaw plugins install`.

## Configuration

1. Accédez à la [QQ Open Platform](https://q.qq.com/) et scannez le code QR avec votre QQ sur téléphone pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot et copiez-les.

> AppSecret n’est pas stocké en clair — si vous quittez la page sans l’enregistrer,
> vous devrez en régénérer un nouveau.

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez la Gateway.

Chemins de configuration interactive :

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurer

Configuration minimale :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variables d’environnement du compte par défaut :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret basé sur un fichier :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Remarques :

- Le repli via variables d’environnement s’applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit uniquement l’AppSecret ; l’AppID doit déjà être défini dans la configuration ou dans `QQBOT_APP_ID`.
- `clientSecret` accepte aussi une entrée SecretRef, pas seulement une chaîne en clair.

### Configuration multi-comptes

Exécutez plusieurs bots QQ sous une seule instance OpenClaw :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Chaque compte lance sa propre connexion WebSocket et maintient un cache de jetons indépendant (isolé par `appId`).

Ajoutez un second bot via la CLI :

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voix (STT / TTS)

La prise en charge STT et TTS utilise une configuration à deux niveaux avec repli prioritaire :

| Setting | Spécifique au plugin   | Repli du framework            |
| ------- | ---------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`   | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`   | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Définissez `enabled: false` sur l’un ou l’autre pour le désactiver.

Le comportement d’envoi/transcodage audio sortant peut aussi être ajusté avec `channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description             |
| -------------------------- | ----------------------- |
| `qqbot:c2c:OPENID`         | Conversation privée (C2C) |
| `qqbot:group:GROUP_OPENID` | Discussion de groupe    |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde         |

> Chaque bot possède son propre ensemble d’OpenIDs utilisateur. Un OpenID reçu par le Bot A **ne peut pas** être utilisé pour envoyer des messages via le Bot B.

## Commandes slash

Commandes intégrées interceptées avant la file d’attente IA :

| Commande       | Description                               |
| -------------- | ----------------------------------------- |
| `/bot-ping`    | Test de latence                           |
| `/bot-version` | Afficher la version du framework OpenClaw |
| `/bot-help`    | Lister toutes les commandes               |
| `/bot-upgrade` | Afficher le lien du guide de mise à niveau QQBot |
| `/bot-logs`    | Exporter les journaux récents de la gateway dans un fichier |

Ajoutez `?` à n’importe quelle commande pour obtenir l’aide d’utilisation (par exemple `/bot-upgrade ?`).

## Dépannage

- **Le bot répond "gone to Mars" :** les identifiants ne sont pas configurés ou la Gateway n’est pas démarrée.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects, et que le bot est activé sur la QQ Open Platform.
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement l’AppSecret. Vous avez encore besoin de `appId` dans la configuration ou de `QQBOT_APP_ID`.
- **Les messages proactifs n’arrivent pas :** QQ peut intercepter les messages initiés par le bot si l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que le STT est configuré et que le fournisseur est joignable.
