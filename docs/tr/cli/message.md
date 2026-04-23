---
read_when:
    - message CLI eylemlerini ekleme veya değiştirme
    - Giden kanal davranışını değiştirme
summary: '`openclaw message` için CLI başvurusu (gönderim + kanal eylemleri)'
title: message
x-i18n:
    generated_at: "2026-04-23T09:00:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Mesajlar ve kanal eylemleri göndermek için tek giden komut
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Kullanım

```
openclaw message <subcommand> [flags]
```

Kanal seçimi:

- Birden fazla kanal yapılandırılmışsa `--channel` gereklidir.
- Tam olarak bir kanal yapılandırılmışsa, varsayılan olur.
- Değerler: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost için Plugin gerekir)

Hedef biçimleri (`--target`):

- WhatsApp: E.164 veya grup JID
- Telegram: sohbet kimliği veya `@username`
- Discord: `channel:<id>` veya `user:<id>` (veya `<@id>` bahsetmesi; ham sayısal kimlikler kanal olarak değerlendirilir)
- Google Chat: `spaces/<spaceId>` veya `users/<userId>`
- Slack: `channel:<id>` veya `user:<id>` (ham kanal kimliği kabul edilir)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` veya `@username` (çıplak kimlikler kanal olarak değerlendirilir)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` veya `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` veya `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` veya `#alias:server`
- Microsoft Teams: konuşma kimliği (`19:...@thread.tacv2`) veya `conversation:<id>` veya `user:<aad-object-id>`

Ad arama:

- Desteklenen sağlayıcılarda (Discord/Slack/vb.), `Help` veya `#help` gibi kanal adları dizin önbelleği üzerinden çözülür.
- Önbellek kaçırıldığında, sağlayıcı destekliyorsa OpenClaw canlı dizin araması dener.

## Yaygın bayraklar

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (gönderim/anket/okuma/vb. için hedef kanal veya kullanıcı)
- `--targets <name>` (tekrarlanır; yalnızca yayın)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef davranışı

- `openclaw message`, seçilen eylemi çalıştırmadan önce desteklenen kanal SecretRef'lerini çözümler.
- Çözümleme mümkün olduğunda etkin eylem hedefine göre kapsamlandırılır:
  - `--channel` ayarlandığında kanal kapsamlı (veya `discord:...` gibi önekli hedeflerden çıkarıldığında)
  - `--account` ayarlandığında hesap kapsamlı (kanal genelleri + seçili hesap yüzeyleri)
  - `--account` verilmediğinde OpenClaw, `default` hesap SecretRef kapsamını zorlamaz
- İlgisiz kanallardaki çözümlenmemiş SecretRef'ler hedefli bir message eylemini engellemez.
- Seçilen kanal/hesap SecretRef'i çözümlenmemişse, komut bu eylem için fail-closed davranır.

## Eylemler

### Çekirdek

- `send`
  - Kanallar: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Gerekli: `--target`, ayrıca `--message`, `--media` veya `--presentation`
  - İsteğe bağlı: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Paylaşılan sunum payload'ları: `--presentation`, çekirdeğin seçilen kanalın bildirilen yetenekleri üzerinden işlediği anlamsal bloklar (`text`, `context`, `divider`, `buttons`, `select`) gönderir. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).
  - Genel teslimat tercihleri: `--delivery`, `{ "pin": true }` gibi teslimat ipuçlarını kabul eder; `--pin`, kanal desteklediğinde sabitlenmiş teslimat için kısayoldur.
  - Yalnızca Telegram: `--force-document` (Telegram sıkıştırmasını önlemek için görselleri ve GIF'leri belge olarak gönderir)
  - Yalnızca Telegram: `--thread-id` (forum konu kimliği)
  - Yalnızca Slack: `--thread-id` (iş parçacığı zaman damgası; `--reply-to` aynı alanı kullanır)
  - Telegram + Discord: `--silent`
  - Yalnızca WhatsApp: `--gif-playback`

- `poll`
  - Kanallar: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Gerekli: `--target`, `--poll-question`, `--poll-option` (tekrarlanır)
  - İsteğe bağlı: `--poll-multi`
  - Yalnızca Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Yalnızca Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanallar: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Not: `--remove`, `--emoji` gerektirir (`--emoji` verilmezse desteklenen yerlerde kendi tepkilerinizi temizler; bkz. /tools/reactions)
  - Yalnızca WhatsApp: `--participant`, `--from-me`
  - Signal grup tepkileri: `--target-author` veya `--target-author-uuid` gereklidir

- `reactions`
  - Kanallar: Discord/Google Chat/Slack/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--limit`

- `read`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--target`
  - İsteğe bağlı: `--limit`, `--before`, `--after`
  - Yalnızca Discord: `--around`

- `edit`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--message-id`, `--message`, `--target`

- `delete`
  - Kanallar: Discord/Slack/Telegram/Matrix
  - Gerekli: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--message-id`, `--target`

- `pins` (liste)
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--target`

- `permissions`
  - Kanallar: Discord/Matrix
  - Gerekli: `--target`
  - Yalnızca Matrix: Matrix şifrelemesi etkin olduğunda ve doğrulama eylemlerine izin verildiğinde kullanılabilir

- `search`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--query`
  - İsteğe bağlı: `--channel-id`, `--channel-ids` (tekrarlanır), `--author-id`, `--author-ids` (tekrarlanır), `--limit`

### İş parçacıkları

- `thread create`
  - Kanallar: Discord
  - Gerekli: `--thread-name`, `--target` (kanal kimliği)
  - İsteğe bağlı: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanallar: Discord
  - Gerekli: `--guild-id`
  - İsteğe bağlı: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanallar: Discord
  - Gerekli: `--target` (iş parçacığı kimliği), `--message`
  - İsteğe bağlı: `--media`, `--reply-to`

### Emojiler

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ek bayrak yok

- `emoji upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--emoji-name`, `--media`
  - İsteğe bağlı: `--role-ids` (tekrarlanır)

### Çıkartmalar

- `sticker send`
  - Kanallar: Discord
  - Gerekli: `--target`, `--sticker-id` (tekrarlanır)
  - İsteğe bağlı: `--message`

- `sticker upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roller / Kanallar / Üyeler / Ses

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ Discord için `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Etkinlikler

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - İsteğe bağlı: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasyon (Discord)

- `timeout`: `--guild-id`, `--user-id` (isteğe bağlı `--duration-min` veya `--until`; ikisi de verilmezse timeout temizlenir)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout`, ayrıca `--reason` destekler

### Yayın

- `broadcast`
  - Kanallar: yapılandırılmış herhangi bir kanal; tüm sağlayıcıları hedeflemek için `--channel all` kullanın
  - Gerekli: `--targets <target...>`
  - İsteğe bağlı: `--message`, `--media`, `--dry-run`

## Örnekler

Discord yanıtı gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Anlamsal düğmelerle mesaj gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Çekirdek, aynı `presentation` payload'unu kanal yeteneğine bağlı olarak Discord bileşenleri, Slack blokları, Telegram satır içi düğmeleri, Mattermost props veya Teams/Feishu kartları olarak işler. Tam sözleşme ve geri dönüş kuralları için [Mesaj Sunumu](/tr/plugins/message-presentation) bölümüne bakın.

Daha zengin bir sunum payload'u gönderin:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord anketi oluşturun:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram anketi oluşturun (2 dakika içinde otomatik kapanır):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams proaktif mesajı gönderin:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams anketi oluşturun:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack'te tepki verin:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Bir Signal grubunda tepki verin:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Genel sunum üzerinden Telegram satır içi düğmeleri gönderin:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Genel sunum üzerinden bir Teams kartı gönderin:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Sıkıştırmayı önlemek için bir Telegram görselini belge olarak gönderin:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
