---
read_when:
    - Ajout ou modification d’actions CLI de message
    - Modification du comportement sortant des canaux
summary: Référence CLI pour `openclaw message` (send + actions de canal)
title: message
x-i18n:
    generated_at: "2026-04-05T12:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Commande sortante unique pour envoyer des messages et des actions de canal
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilisation

```
openclaw message <subcommand> [flags]
```

Sélection du canal :

- `--channel` est requis si plus d’un canal est configuré.
- Si exactement un canal est configuré, il devient le canal par défaut.
- Valeurs : `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost nécessite le plugin)

Formats de cible (`--target`) :

- WhatsApp : E.164 ou JID de groupe
- Telegram : identifiant de chat ou `@username`
- Discord : `channel:<id>` ou `user:<id>` (ou mention `<@id>` ; les identifiants numériques bruts sont traités comme des canaux)
- Google Chat : `spaces/<spaceId>` ou `users/<userId>`
- Slack : `channel:<id>` ou `user:<id>` (l’identifiant brut du canal est accepté)
- Mattermost (plugin) : `channel:<id>`, `user:<id>`, ou `@username` (les identifiants nus sont traités comme des canaux)
- Signal : `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, ou `username:<name>`/`u:<name>`
- iMessage : handle, `chat_id:<id>`, `chat_guid:<guid>`, ou `chat_identifier:<id>`
- Matrix : `@user:server`, `!room:server`, ou `#alias:server`
- Microsoft Teams : identifiant de conversation (`19:...@thread.tacv2`) ou `conversation:<id>` ou `user:<aad-object-id>`

Recherche par nom :

- Pour les fournisseurs pris en charge (Discord/Slack/etc.), les noms de canaux comme `Help` ou `#help` sont résolus via le cache d’annuaire.
- En cas d’absence dans le cache, OpenClaw tentera une recherche en direct dans l’annuaire lorsque le fournisseur la prend en charge.

## Indicateurs communs

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal cible ou utilisateur pour send/poll/read/etc)
- `--targets <name>` (répétable ; diffusion uniquement)
- `--json`
- `--dry-run`
- `--verbose`

## Comportement de SecretRef

- `openclaw message` résout les SecretRef de canal pris en charge avant d’exécuter l’action sélectionnée.
- La résolution est limitée à la cible active de l’action lorsque c’est possible :
  - à portée de canal lorsque `--channel` est défini (ou déduit à partir de cibles préfixées comme `discord:...`)
  - à portée de compte lorsque `--account` est défini (surfaces globales du canal + surfaces du compte sélectionné)
  - lorsque `--account` est omis, OpenClaw n’impose pas de portée SecretRef de compte `default`
- Les SecretRef non résolus sur des canaux non liés ne bloquent pas une action de message ciblée.
- Si le SecretRef du canal/compte sélectionné n’est pas résolu, la commande échoue de manière fermée pour cette action.

## Actions

### Cœur

- `send`
  - Canaux : WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Requis : `--target`, plus `--message` ou `--media`
  - Facultatif : `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Charges utiles interactives partagées : `--interactive` envoie une charge utile JSON interactive native au canal lorsqu’elle est prise en charge
  - Telegram uniquement : `--buttons` (nécessite `channels.telegram.capabilities.inlineButtons` pour l’autoriser)
  - Telegram uniquement : `--force-document` (envoyer les images et GIF comme documents pour éviter la compression Telegram)
  - Telegram uniquement : `--thread-id` (identifiant de sujet de forum)
  - Slack uniquement : `--thread-id` (horodatage du fil ; `--reply-to` utilise le même champ)
  - Discord uniquement : charge utile JSON `--components`
  - Canaux avec cartes adaptatives : charge utile JSON `--card` lorsqu’elle est prise en charge
  - Telegram + Discord : `--silent`
  - WhatsApp uniquement : `--gif-playback`

- `poll`
  - Canaux : WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Requis : `--target`, `--poll-question`, `--poll-option` (répétable)
  - Facultatif : `--poll-multi`
  - Discord uniquement : `--poll-duration-hours`, `--silent`, `--message`
  - Telegram uniquement : `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canaux : Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Requis : `--message-id`, `--target`
  - Facultatif : `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Remarque : `--remove` nécessite `--emoji` (omettez `--emoji` pour effacer vos propres réactions lorsque c’est pris en charge ; voir /tools/reactions)
  - WhatsApp uniquement : `--participant`, `--from-me`
  - Réactions de groupe Signal : `--target-author` ou `--target-author-uuid` requis

- `reactions`
  - Canaux : Discord/Google Chat/Slack/Matrix
  - Requis : `--message-id`, `--target`
  - Facultatif : `--limit`

- `read`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--target`
  - Facultatif : `--limit`, `--before`, `--after`
  - Discord uniquement : `--around`

- `edit`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--message-id`, `--message`, `--target`

- `delete`
  - Canaux : Discord/Slack/Telegram/Matrix
  - Requis : `--message-id`, `--target`

- `pin` / `unpin`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--message-id`, `--target`

- `pins` (liste)
  - Canaux : Discord/Slack/Matrix
  - Requis : `--target`

- `permissions`
  - Canaux : Discord/Matrix
  - Requis : `--target`
  - Matrix uniquement : disponible lorsque le chiffrement Matrix est activé et que les actions de vérification sont autorisées

- `search`
  - Canaux : Discord
  - Requis : `--guild-id`, `--query`
  - Facultatif : `--channel-id`, `--channel-ids` (répétable), `--author-id`, `--author-ids` (répétable), `--limit`

### Fils

- `thread create`
  - Canaux : Discord
  - Requis : `--thread-name`, `--target` (identifiant du canal)
  - Facultatif : `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canaux : Discord
  - Requis : `--guild-id`
  - Facultatif : `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canaux : Discord
  - Requis : `--target` (identifiant du fil), `--message`
  - Facultatif : `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord : `--guild-id`
  - Slack : aucun indicateur supplémentaire

- `emoji upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--emoji-name`, `--media`
  - Facultatif : `--role-ids` (répétable)

### Autocollants

- `sticker send`
  - Canaux : Discord
  - Requis : `--target`, `--sticker-id` (répétable)
  - Facultatif : `--message`

- `sticker upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rôles / Canaux / Membres / Voix

- `role info` (Discord) : `--guild-id`
- `role add` / `role remove` (Discord) : `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord) : `--target`
- `channel list` (Discord) : `--guild-id`
- `member info` (Discord/Slack) : `--user-id` (+ `--guild-id` pour Discord)
- `voice status` (Discord) : `--guild-id`, `--user-id`

### Événements

- `event list` (Discord) : `--guild-id`
- `event create` (Discord) : `--guild-id`, `--event-name`, `--start-time`
  - Facultatif : `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Modération (Discord)

- `timeout` : `--guild-id`, `--user-id` (facultatif `--duration-min` ou `--until` ; omettez les deux pour effacer le délai d’expiration)
- `kick` : `--guild-id`, `--user-id` (+ `--reason`)
- `ban` : `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` prend aussi en charge `--reason`

### Diffusion

- `broadcast`
  - Canaux : tout canal configuré ; utilisez `--channel all` pour cibler tous les fournisseurs
  - Requis : `--targets <target...>`
  - Facultatif : `--message`, `--media`, `--dry-run`

## Exemples

Envoyer une réponse Discord :

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Envoyer un message Discord avec des composants :

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Voir [Composants Discord](/channels/discord#interactive-components) pour le schéma complet.

Envoyer une charge utile interactive partagée :

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Créer un sondage Discord :

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Créer un sondage Telegram (fermeture automatique en 2 minutes) :

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Envoyer un message proactif Teams :

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Créer un sondage Teams :

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Réagir dans Slack :

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Réagir dans un groupe Signal :

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Envoyer des boutons en ligne Telegram :

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Envoyer une carte adaptative Teams :

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Envoyer une image Telegram comme document pour éviter la compression :

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
