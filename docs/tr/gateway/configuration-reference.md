---
read_when:
    - Tam alan düzeyinde yapılandırma anlamlarına veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Temel OpenClaw anahtarları, varsayılanlar ve özel alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma Başvurusu
x-i18n:
    generated_at: "2026-04-23T09:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Yapılandırma Başvurusu

`~/.openclaw/openclaw.json` için temel yapılandırma başvurusu. Görev odaklı genel bakış için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

Bu sayfa, ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendi daha derin başvurusu olduğunda bağlantı verir. Bir sayfada her kanal/plugin'e ait komut kataloğunu veya her derin bellek/QMD düğmesini satır içine almaya **çalışmaz**.

Kod doğruluğu:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema'yı yazdırır; mevcut olduğunda paketlenmiş/plugin/kanal meta verileri birleştirilir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, yapılandırma belgesi temel çizgisi hash'ini geçerli şema yüzeyine karşı doğrular

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırması başvurusu](/tr/reference/memory-config)
- Geçerli yerleşik + paketlenmiş komut kataloğu için [Slash Komutları](/tr/tools/slash-commands)
- Kanala/plugin'e ait komut yüzeyleri için ilgili kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**'tir (yorumlara + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — OpenClaw, atlandıklarında güvenli varsayılanlar kullanır.

---

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` değilse).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                         |
| ------------------- | ---------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen göndericiler tek kullanımlık bir eşleştirme kodu alır; sahibi onaylamalıdır |
| `allowlist`         | Yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM'lere izin verir (`allowFrom: ["*"]` gerektirir)    |
| `disabled`          | Tüm gelen DM'leri yok sayar                                      |

| Grup ilkesi           | Davranış                                              |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar |
| `open`                | Grup izin listelerini atlar (bahsetme geçidi yine uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engeller                     |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlı olmadığında varsayılanı belirler.
Eşleştirme kodları 1 saat sonra sona erer. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla birlikte `allowlist`'e geri döner (kapalı başarısızlık).
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumun zaten model geçersiz kılması olmadığında uygulanır (örneğin `/model` ile ayarlanmışsa).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Kanal varsayılanları ve Heartbeat

Sağlayıcılar arasında paylaşılan grup ilkesi ve Heartbeat davranışı için `channels.defaults` kullanın:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlı olmadığında kullanılacak yedek grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlük modu. Değerler: `all` (varsayılan, tüm alıntı/iş parçacığı/geçmiş bağlamını içer), `allowlist` (yalnızca izin verilen göndericilerden gelen bağlamı içer), `allowlist_quote` (allowlist ile aynı, ancak açık alıntı/yanıt bağlamını korur). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil eder.
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hatalı durumları Heartbeat çıktısına dahil eder.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluşturur.

### WhatsApp

WhatsApp, Gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcutsa otomatik olarak başlar.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // mavi tikler (self-chat modunda false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="Çok hesaplı WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Giden komutlar, mevcutsa varsayılan olarak `default` hesabını kullanır; aksi halde ilk yapılandırılmış hesap kimliğini (sıralı) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu yedek varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys auth dizini, `openclaw doctor` tarafından `whatsapp/default` içine taşınır.
- Hesap başına geçersiz kılmalar: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Yanıtları kısa tutun.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Konudan sapmayın.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Bir görsel oluştur" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (varsayılan: off; önizleme-düzenleme hız sınırlarından kaçınmak için açıkça etkinleştirin)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için yedek olarak `TELEGRAM_BOT_TOKEN`.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), yedek yönlendirmeyi önlemek için açık bir varsayılan ayarlayın (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`); `openclaw doctor`, bu değer eksikse veya geçersizse uyarır.
- `configWrites: false`, Telegram kaynaklı yapılandırma yazımlarını engeller (supergroup ID geçişleri, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum başlıkları için kalıcı ACP bağlamaları yapılandırır (`match.peer.id` içinde kurallı `chatId:topic:topicId` kullanın). Alan anlamları [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) ile ortaktır.
- Telegram akış önizlemeleri `sendMessage` + `editMessageText` kullanır (doğrudan ve grup sohbetlerinde çalışır).
- Yeniden deneme ilkesi: bkz. [Yeniden deneme ilkesi](/tr/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Yalnızca kısa yanıtlar verin.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress, Discord'da partial ile eşlenir)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) için isteğe bağlı etkinleştirme
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, varsayılan hesap için yedek olarak `DISCORD_BOT_TOKEN` ile birlikte.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için o token'ı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; çıplak sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug'lanmış adı kullanır (`#` yok). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılmış mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahseden ama bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).
- `maxLinesPerMessage` (varsayılan 17), mesajlar 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi kontrol eder:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: saat cinsinden etkin olmama nedeniyle otomatik odak kaldırma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` otomatik iş parçacığı oluşturma/bağlama için isteğe bağlı etkinleştirme anahtarı
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamaları yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliğini kullanın). Alan anlamları [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) ile ortaktır.
- `channels.discord.ui.components.accentColor`, Discord components v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord sesli kanal konuşmalarını ve isteğe bağlı otomatik katılım + TTS geçersiz kılmalarını etkinleştirir.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine olduğu gibi aktarılır (varsayılan olarak `true` ve `24`).
- OpenClaw ayrıca tekrarlanan çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması da dener.
- `channels.discord.streaming`, kurallı akış modu anahtarıdır. Eski `streamMode` ve boolean `streaming` değerleri otomatik olarak taşınır.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (healthy => online, degraded => idle, exhausted => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü yerel exec onay teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenmiş onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirim modları:** `off` (yok), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (`guilds.<id>.users` içinden tüm mesajlarda).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Service account JSON: satır içi (`serviceAccount`) veya dosya tabanlı (`serviceAccountFile`).
- Service account SecretRef de desteklenir (`serviceAccountRef`).
- Env yedekleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslim hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değiştirilebilir e-posta principal eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Yalnızca kısa yanıtlar verin.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial olduğunda Slack yerel akış API'sini kullan
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode**, hem `botToken` hem de `appToken` gerektirir (varsayılan hesap env yedeği için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP mode**, `botToken` ile birlikte `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizeleri veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, şu gibi kimlik bilgisi başına kaynak/durum alanlarını gösterir:
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus`. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak geçerli komut/çalışma zamanı yolunun
  gizli değeri çözemediği anlamına gelir.
- `configWrites: false`, Slack kaynaklı yapılandırma yazımlarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kurallı Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış taşımasını kontrol eder. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri otomatik olarak taşınır.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturum yalıtımı:** `thread.historyScope`, iş parçacığı başına (varsayılan) veya kanal genelinde paylaşımlıdır. `thread.inheritParent`, üst kanal dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack asistan tarzı "yazıyor..." iş parçacığı durumu, yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler varsayılan olarak iş parçacığı dışıdır; bu yüzden iş parçacığı tarzı önizleme yerine `typingReaction` veya normal teslim kullanırlar.
- `typingReaction`, yanıt çalışırken gelen Slack mesajına geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack'e özgü yerel exec onay teslimi ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                     |
| ----------- | ---------- | -------------------------- |
| reactions   | etkin      | Tepki ver + tepkileri listele |
| messages    | etkin      | Oku/gönder/düzenle/sil     |
| pins        | etkin      | Sabitle/sabitlemeyi kaldır/listele |
| memberInfo  | etkin      | Üye bilgisi                |
| emojiList   | etkin      | Özel emoji listesi         |

### Mattermost

Mattermost bir plugin olarak gelir: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // isteğe bağlı etkinleştirme
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Reverse proxy/herkese açık dağıtımlar için isteğe bağlı açık URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Sohbet modları: `oncall` (@-mention ile yanıt ver, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici önekle başlayan mesajlar).

Mattermost yerel komutları etkin olduğunda:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözülmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel slash callback'leri, slash komutu kaydı sırasında Mattermost tarafından döndürülen
  komut başına token'larla kimlik doğrulanır. Kayıt başarısız olursa veya
  hiçbir komut etkinleştirilmezse OpenClaw callback'leri
  `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili callback ana makineleri için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` içine callback ana makinesinin/alan adının eklenmesini isteyebilir.
  Tam URL değil, ana makine/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost kaynaklı yapılandırma yazımlarına izin ver veya reddet.
- `channels.mattermost.requireMention`: kanallarda yanıt vermeden önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme geçidi geçersiz kılması (varsayılan için `"*"`).
- İsteğe bağlı `channels.mattermost.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // isteğe bağlı hesap bağlaması
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitler.
- `channels.signal.configWrites`: Signal kaynaklı yapılandırma yazımlarına izin verir veya reddeder.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### BlueBubbles

BlueBubbles önerilen iMessage yoludur (plugin destekli, `channels.bluebubbles` altında yapılandırılır).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls ve gelişmiş actions:
      // bkz. /channels/bluebubbles
    },
  },
}
```

- Burada kapsanan temel anahtar yolları: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- İsteğe bağlı `channels.bluebubbles.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri BlueBubbles konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde bir BlueBubbles handle veya hedef dizesi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan anlamları: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).
- Tam BlueBubbles kanal yapılandırması [BlueBubbles](/tr/channels/bluebubbles) bölümünde belgelenmiştir.

### iMessage

OpenClaw `imsg rpc`'yi başlatır (stdio üzerinden JSON-RPC). Daemon veya port gerekmez.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- İsteğe bağlı `channels.imessage.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

- Messages DB için Full Disk Access gerekir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath`, bir SSH wrapper'ına işaret edebilir; SCP eklerini getirmek için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı ana makine anahtarı denetimi kullanır; bu nedenle relay ana makine anahtarının zaten `~/.ssh/known_hosts` içinde bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage kaynaklı yapılandırma yazımlarına izin verir veya reddeder.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalize edilmiş bir handle veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan anlamları: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH wrapper örneği">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix plugin desteklidir ve `channels.matrix` altında yapılandırılır.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token kimlik doğrulaması `accessToken` kullanır; parola kimlik doğrulaması `userId` + `password` kullanır.
- `channels.matrix.proxy`, Matrix HTTP trafiğini açık bir HTTP(S) proxy üzerinden yönlendirir. Adlandırılmış hesaplar bunu `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver'lara izin verir. `proxy` ve bu ağ izin seçeneği birbirinden bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` olduğundan, `autoJoin: "allowlist"` ile birlikte `autoJoinAllowlist` veya `autoJoin: "always"` ayarlayana kadar davet edilen odalar ve yeni DM tarzı davetler yok sayılır.
- `channels.matrix.execApprovals`: Matrix'e özgü yerel exec onay teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlara nasıl gruplanacağını kontrol eder: `per-user` (varsayılan) yönlendirilen eş düzeyine göre paylaşır, `per-room` ise her DM odasını yalıtır.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) bölümünde belgelenmiştir.

### Microsoft Teams

Microsoft Teams plugin desteklidir ve `channels.msteams` altında yapılandırılır.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // bkz. /channels/msteams
    },
  },
}
```

- Burada kapsanan temel anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, webhook, DM/grup ilkesi, takım/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) bölümünde belgelenmiştir.

### IRC

IRC plugin desteklidir ve `channels.irc` altında yapılandırılır.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Burada kapsanan temel anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Tam IRC kanal yapılandırması (host/port/TLS/channels/allowlists/mention gating) [IRC](/tr/channels/irc) bölümünde belgelenmiştir.

### Çok hesaplı (tüm kanallar)

Kanal başına birden fazla hesap çalıştırın (her biri kendi `accountId` değerine sahip):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Birincil bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Uyarı botu",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId` atlandığında `default` kullanılır (CLI + yönlendirme).
- Env token'ları yalnızca **varsayılan** hesap için geçerlidir.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir aracıya yönlendirmek için `bindings[].match.accountId` kullanın.
- `openclaw channels add` (veya kanal ilk kurulumu) ile varsayılan olmayan bir hesap eklediğinizde hâlâ tek hesaplı üst düzey kanal yapılandırmasındaysanız, OpenClaw önce hesaba kapsamlı üst düzey tek hesaplı değerleri kanal hesap haritasına yükseltir; böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal kapsamlı bağlamalar (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix` de karışık şekilleri, o kanal için seçilen yükseltilmiş hesaba hesaba kapsamlı üst düzey tek hesaplı değerleri taşıyarak onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer plugin kanalları

Birçok plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi özel kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme geçidi

Grup mesajları varsayılan olarak **bahsetme gerektirir** (meta veri bahsetmesi veya güvenli regex desenleri). Bu, WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

**Bahsetme türleri:**

- **Meta veri bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp self-chat modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Bahsetme geçidi yalnızca algılama mümkün olduğunda zorlanır (yerel bahsetmeler veya en az bir desen).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` (veya hesap başına) ile geçersiz kılabilir. Devre dışı bırakmak için `0` ayarlayın.

#### DM geçmiş sınırları

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Çözümleme sırası: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü saklanır).

Desteklenenler: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chat modu

Self-chat modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmelerini yok sayar, yalnızca metin desenlerine yanıt verir):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Komutlar (sohbet komutu işleme)

```json5
{
  commands: {
    native: "auto", // desteklendiğinde yerel komutları kaydet
    nativeSkills: "auto", // desteklendiğinde yerel Skills komutlarını kaydet
    text: true, // sohbet mesajlarında /commands ayrıştır
    bash: false, // ! kullanımına izin ver (takma ad: /bash)
    bashForegroundMs: 2000,
    config: false, // /config kullanımına izin ver
    mcp: false, // /mcp kullanımına izin ver
    plugins: false, // /plugins kullanımına izin ver
    debug: false, // /debug kullanımına izin ver
    restart: true, // /restart + gateway restart aracına izin ver
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Komut ayrıntıları">

- Bu blok komut yüzeylerini yapılandırır. Geçerli yerleşik + paketlenmiş komut kataloğu için [Slash Komutları](/tr/tools/slash-commands) bölümüne bakın.
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı başvurusu**dur. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, bellek `/dreaming`, phone-control `/phone` ve Talk `/voice` gibi kanal/plugin'e ait komutlar kendi kanal/plugin sayfalarında ve [Slash Komutları](/tr/tools/slash-commands) bölümünde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"`, Discord/Telegram için yerel komutları açar, Slack'i kapalı bırakır.
- `nativeSkills: "auto"`, Discord/Telegram için yerel Skills komutlarını açar, Slack'i kapalı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). `false`, önceden kaydedilmiş komutları temizler.
- Kanal başına yerel skill kaydını `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands`, ek Telegram bot menü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` kullanımını etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olması gerekir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazımları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operatör istemcilerine açık kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` komutunu etkinleştirir.
- `plugins: true`, plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini denetler (varsayılan: true).
- Çok hesaplı kanallarda `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazımları da denetler (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve gateway restart aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahibe açık komutlar/araçlar için açık sahip izin listesidir. `allowFrom`'dan ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash'ler. Hash'lemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağı budur (kanal izin listeleri/eşleştirme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlı değilse komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut belge eşlemesi:
  - yerleşik + paketlenmiş katalog: [Slash Komutları](/tr/tools/slash-commands)
  - kanala özel komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleştirme komutları: [Eşleştirme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## Aracı varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlı değilse OpenClaw bunu çalışma alanından yukarı doğru yürüyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` ayarlamayan aracılar için isteğe bağlı varsayılan Skills izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

- Varsayılan olarak sınırsız Skills için `agents.defaults.skills` değerini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
- Hiç skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o aracı için son kümedir; varsayılanlarla birleşmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı bootstrap dosyalarının otomatik oluşturulmasını devre dışı bırakır (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Çalışma alanı bootstrap dosyalarının sistem istemine ne zaman enjekte edileceğini kontrol eder. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam dönüşleri (tamamlanmış bir asistan yanıtından sonra) çalışma alanı bootstrap yeniden enjeksiyonunu atlar ve istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı bootstrap dosyası başına azami karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları arasında enjekte edilen toplam azami karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kesildiğinde aracıya görünür uyarı metnini kontrol eder.
Varsayılan: `"once"`.

- `"off"`: sistem istemine hiçbir zaman uyarı metni enjekte etmez.
- `"once"`: benzersiz her kesme imzası için bir kez uyarı enjekte eder (önerilir).
- `"always"`: kesme varsa her çalıştırmada uyarı enjekte eder.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar
tek bir genel düğmeden akmak yerine alt sistemlere göre bilinçli olarak
ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil, tek seferlik `/new` ve `/reset`
  başlangıç önsözü.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt Skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve çalışma zamanına ait enjekte edilen bloklar.
- `memory.qmd.limits.*`:
  indekslenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir aracının farklı bir bütçeye ihtiyacı olduğunda eşleşen aracı başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Çıplak `/new` ve `/reset` çalıştırmalarına enjekte edilen ilk dönüş başlangıç önsözünü kontrol eder.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Sınırlı çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı üst sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarması için kullanılan canlı araç sonucu üst sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı üst sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için aracı başına geçersiz kılma. Atlanan alanlar
`agents.defaults.contextLimits` içinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt Skills listesi için genel üst sınır. Bu,
istek üzerine `SKILL.md` dosyalarının okunmasını etkilemez.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills istem bütçesi için aracı başına geçersiz kılma.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce döküm/araç görsel bloklarında en uzun görsel kenarı için azami piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda vision-token kullanımını ve istek yük boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları için değil). Ana makine saat dilimine geri döner.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki saat biçimi. Varsayılan: `auto` (işletim sistemi tercihi).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // genel varsayılan sağlayıcı parametreleri
      embeddedHarness: {
        runtime: "auto", // auto | pi | kayıtlı harness kimliği, ör. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi birincil modeli ve sıralı yedek devralma modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolunda vision-model yapılandırması olarak kullanılır.
  - Seçili/varsayılan model görsel girdisini kabul edemediğinde yedek yönlendirme olarak da kullanılır.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görsel üretim yeteneği ve görsel üreten gelecekteki tüm araç/plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görsel üretimi için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev` veya OpenAI Images için `openai/gpt-image-2`.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY`, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kalan kayıtlı görsel üretim sağlayıcılarını dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik üretim yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.5+`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kalan kayıtlı müzik üretim sağlayıcılarını dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video üretim yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kalan kayıtlı video üretim sağlayıcılarını dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketlenmiş Qwen video üretim sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görseli, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı önce `imageModel`, sonra çözümlenmiş oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı anında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyut sınırı.
- `pdfMaxPages`: `pdf` aracında çıkarım yedek modunda dikkate alınan varsayılan azami sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntılılık düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. `openai/gpt-5.4`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra tam o model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (eski uyumluluk davranışı, bu yüzden açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış bir sağlayıcı varsayılanını yüzeye çıkarmak yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özgü, örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`) içerebilir.
  - Güvenli düzenlemeler: girdi eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girdilerini kaldıracak değişimleri reddeder.
  - Sağlayıcı kapsamlı configure/ilk kurulum akışları seçili sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır, ardından `agents.list[].params` (eşleşen aracı kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için [Prompt Caching](/tr/reference/prompt-caching) bölümüne bakın.
- `embeddedHarness`: varsayılan düşük düzey gömülü aracı çalışma zamanı ilkesi. Kayıtlı plugin harness'lerin desteklenen modelleri talep etmesine izin vermek için `runtime: "auto"`, yerleşik PI harness'ini zorlamak için `runtime: "pi"` veya `runtime: "codex"` gibi kayıtlı bir harness kimliği kullanın. Otomatik PI yedeğini devre dışı bırakmak için `fallback: "none"` ayarlayın.
- Bu alanları değiştiren yapılandırma yazarları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kurallı nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar arasında azami paralel aracı çalıştırması (her oturum yine seri hale getirilir). Varsayılan: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`, gömülü aracı dönüşlerini hangi düşük düzey yürütücünün çalıştıracağını kontrol eder.
Çoğu dağıtım varsayılan `{ runtime: "auto", fallback: "pi" }` ayarını korumalıdır.
Paketlenmiş
Codex uygulama sunucusu harness'i gibi güvenilen bir plugin yerel bir harness sağladığında bunu kullanın.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` veya kayıtlı bir plugin harness kimliği. Paketlenmiş Codex plugin'i `codex` kaydeder.
- `fallback`: `"pi"` veya `"none"`. `"pi"`, plugin harness seçilmediğinde yerleşik PI harness'ini uyumluluk yedeği olarak tutar. `"none"`, eksik veya desteklenmeyen plugin harness seçiminin PI'yi sessizce kullanmak yerine başarısız olmasını sağlar. Seçili plugin harness hataları her zaman doğrudan yüzeye çıkar.
- Ortam geçersiz kılmaları: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`, `runtime` değerini geçersiz kılar; `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, o süreç için PI yedeğini devre dışı bırakır.
- Yalnızca Codex dağıtımları için `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` ve `embeddedHarness.fallback: "none"` ayarlayın.
- Bu yalnızca gömülü sohbet harness'ini kontrol eder. Medya üretimi, vision, PDF, müzik, video ve TTS yine kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısayolları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Takma ad            | Model                                 |
| ------------------- | ------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`           |
| `sonnet`            | `anthropic/claude-sonnet-4-6`         |
| `gpt`               | `openai/gpt-5.4`                      |
| `gpt-mini`          | `openai/gpt-5.4-mini`                 |
| `gpt-nano`          | `openai/gpt-5.4-nano`                 |
| `gemini`            | `google/gemini-3.1-pro-preview`       |
| `gemini-flash`      | `google/gemini-3-flash-preview`       |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`|

Yapılandırdığınız takma adlar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` etkinleştirir. Bunu devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlı olmadığında varsayılan olarak `adaptive` düşünme kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin yedek çalıştırmaları için isteğe bağlı CLI backend'leri (araç çağrısı yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend'leri metin önceliklidir; araçlar her zaman devre dışıdır.
- `sessionArg` ayarlıysa oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görsel geçişi desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından oluşturulan tüm sistem istemini sabit bir dize ile değiştirir. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya aracı başına (`agents.list[].systemPromptOverride`) ayarlayın. Aracı başına değerler önceliklidir; boş veya yalnızca boşluk içeren bir değer yok sayılır. Kontrollü istem deneyleri için kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "Yardımsever bir asistansınız.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Model ailesine göre uygulanan sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri sağlayıcılar arasında paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostça etkileşim tarzı katmanını kontrol eder.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (varsayılan) ve `"on"`, dostça etkileşim tarzı katmanını etkinleştirir.
- `"off"`, yalnızca dostça katmanı devre dışı bırakır; etiketli GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar ayarlı değilse yine okunur.

### `agents.defaults.heartbeat`

Dönemsel Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m devre dışı bırakır
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // varsayılan: true; false, Heartbeat bölümünü sistem isteminden çıkarır
        lightContext: false, // varsayılan: false; true, çalışma alanı bootstrap dosyalarından yalnızca HEARTBEAT.md'yi tutar
        isolatedSession: false, // varsayılan: false; true, her Heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (varsayılan) | block
        target: "none", // varsayılan: none | seçenekler: last | whatsapp | telegram | discord | ...
        prompt: "Varsa HEARTBEAT.md dosyasını okuyun...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı kimlik doğrulaması) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` ayarlayın.
- `includeSystemPromptSection`: false olduğunda Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` enjeksiyonunu bootstrap bağlamına atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda Heartbeat çalıştırmaları sırasında araç hata uyarısı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat aracı dönüşü iptal edilmeden önce izin verilen azami saniye. Ayarsız bırakılırsa `agents.defaults.timeoutSeconds` kullanılır.
- `directPolicy`: doğrudan/DM teslim ilkesi. `allow` (varsayılan), doğrudan hedefe teslimata izin verir. `block`, doğrudan hedefe teslimatı bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda her Heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım deseni. Heartbeat başına token maliyetini yaklaşık ~100K'den ~2-5K tokene düşürür.
- Aracı başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir aracı `heartbeat` tanımladığında, Heartbeat'i **yalnızca o aracılar** çalıştırır.
- Heartbeat'ler tam aracı dönüşleri çalıştırır — daha kısa aralıklar daha fazla token yakar.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // kayıtlı bir Compaction sağlayıcı plugin'inin kimliği (isteğe bağlı)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Dağıtım kimliklerini, talep kimliklerini ve host:port çiftlerini aynen koruyun.", // identifierPolicy=custom olduğunda kullanılır
        postCompactionSections: ["Session Startup", "Red Lines"], // [] yeniden enjeksiyonu devre dışı bırakır
        model: "openrouter/anthropic/claude-sonnet-4-6", // yalnızca Compaction için isteğe bağlı model geçersiz kılması
        notifyUser: true, // Compaction başladığında ve tamamlandığında kısa bildirimler gönderir (varsayılan: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Oturum Compaction sınırına yaklaşıyor. Kalıcı anıları şimdi saklayın.",
          prompt: "Kalıcı notları memory/YYYY-MM-DD.md dosyasına yazın; saklanacak bir şey yoksa tam sessiz token NO_REPLY ile yanıt verin.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalı özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir Compaction sağlayıcı plugin'inin kimliği. Ayarlandığında yerleşik LLM özetleme yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlıkta yerleşiğe geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` değerini zorlar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw iptal etmeden önce tek bir Compaction işlemi için izin verilen azami saniye. Varsayılan: `900`.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetleme sırasında yerleşik opak tanımlayıcı koruma yönlendirmesini öne ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarsızsa veya açıkça bu varsayılan çift ayarlanmışsa eski `Every Session`/`Safety` başlıkları da eski uyumluluk için yedek olarak kabul edilir.
- `model`: yalnızca Compaction özetleme için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturum bir modeli korurken Compaction özetlerinin başka bir modelde çalışmasını istediğinizde bunu kullanın; ayarlanmadığında Compaction oturumun birincil modelini kullanır.
- `notifyUser`: `true` olduğunda Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları saklamak için otomatik Compaction öncesi sessiz aracı dönüşü. Çalışma alanı salt okunursa atlanır.

### `agents.defaults.contextPruning`

LLM'ye göndermeden önce bellek içi bağlamdan **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // süre (ms/s/m/h), varsayılan birim: dakika
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Eski araç sonucu içeriği temizlendi]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modu davranışı">

- `mode: "cache-ttl"`, budama geçişlerini etkinleştirir.
- `ttl`, budamanın yeniden ne kadar sıklıkla çalışabileceğini kontrol eder (son önbellek dokunuşundan sonra).
- Budama, gerekirse önce büyük araç sonuçlarını yumuşak biçimde budar, ardından daha eski araç sonuçlarını sert biçimde temizler.

**Yumuşak budama**, başı + sonu korur ve ortasına `...` ekler.

**Sert temizleme**, tüm araç sonucunu yer tutucuyla değiştirir.

Notlar:

- Görsel bloklar hiçbir zaman budanmaz/temizlenmez.
- Oranlar tam token sayısı değil, karakter temellidir (yaklaşık).
- `keepLastAssistants` değerinden daha az sayıda asistan mesajı varsa budama atlanır.

</Accordion>

Davranış ayrıntıları için [Oturum Budama](/tr/concepts/session-pruning) bölümüne bakın.

### Blok akışı

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs kullanın)
    },
  },
}
```

- Telegram dışı kanallar blok yanıtlarını etkinleştirmek için açık `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantları). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800–2500ms. Aracı başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için [Akış](/tr/concepts/streaming) bölümüne bakın.

### Yazıyor göstergeleri

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Varsayılanlar: doğrudan sohbetler/bahsetmeler için `instant`, bahsetilmeyen grup sohbetleri için `message`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Yazıyor Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü aracı için isteğe bağlı sandboxing. Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / satır içi içerikler de desteklenir:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox ayrıntıları">

**Backend:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` altına taşınır.

**SSH backend yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'e geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: çalışma zamanında OpenClaw'ın geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` üzerinde önceliklidir
- `certificateData`, `certificateFile` üzerinde önceliklidir
- `knownHostsData`, `knownHostsFile` üzerinde önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin secrets çalışma zamanı anlık görüntüsünden çözülür

**SSH backend davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kurallı durumda tutar
- `exec`, dosya araçlarını ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak ana makineye geri eşzamanlamaz
- sandbox tarayıcı kapsayıcılarını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` altında sandbox çalışma alanı, `/agent` altında aracı çalışma alanı salt okunur bağlanır
- `rw`: aracı çalışma alanı `/workspace` altında okuma/yazma olarak bağlanır

**Kapsam:**

- `session`: oturum başına kapsayıcı + çalışma alanı
- `agent`: aracı başına bir kapsayıcı + çalışma alanı (varsayılan)
- `shared`: paylaşımlı kapsayıcı ve çalışma alanı (oturumlar arası yalıtım yok)

**OpenShell plugin yapılandırması:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // isteğe bağlı
          gatewayEndpoint: "https://lab.example", // isteğe bağlı
          policy: "strict", // isteğe bağlı OpenShell ilke kimliği
          providers: ["openai"], // isteğe bağlı
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: çalıştırmadan önce uzağı yerelden tohumla, çalıştırmadan sonra geri eşzamanla; yerel çalışma alanı kurallı kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez tohumla, sonra uzak çalışma alanını kurallı tut

`remote` modunda, OpenClaw dışında ana makinede yerel olarak yapılan düzenlemeler tohumlama adımından sonra sandbox içine otomatik eşzamanlanmaz.
Taşıma SSH ile OpenShell sandbox içine yapılır, ancak plugin sandbox yaşam döngüsüne ve isteğe bağlı mirror eşzamanlamasına sahiptir.

**`setupCommand`**, kapsayıcı oluşturulduktan sonra bir kez çalışır (`sh -lc` ile). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Kapsayıcılar varsayılan olarak `network: "none"` ile gelir** — aracı giden erişime ihtiyaç duyuyorsa bunu `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"` varsayılan olarak engellenir; bunu yalnızca
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` açıkça ayarlarsanız kullanabilirsiniz (acil durum).

**Gelen ekler**, etkin çalışma alanındaki `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek ana makine dizinlerini bağlar; genel ve aracı başına bind'ler birleştirilir.

**Sandboxed browser** (`sandbox.browser.enabled`): bir kapsayıcı içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw paylaşılan URL'de parolayı göstermek yerine kısa ömürlü bir token URL'si üretir.

- `allowHostControl: false` (varsayılan), sandbox oturumlarının ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (özel bridge ağı). Genel bridge bağlantısını açıkça istediğinizde yalnızca `bridge` ayarlayın.
- `cdpSourceRange`, CDP girişini kapsayıcı sınırında isteğe bağlı olarak bir CIDR aralığıyla sınırlayabilir (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca sandbox tarayıcı kapsayıcısına bağlar. Ayarlandığında (`[]` dahil) tarayıcı kapsayıcısı için `docker.binds` yerine geçer.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanmıştır ve kapsayıcı ana makineleri için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (varsayılan olarak etkin)
  - `--disable-3d-apis`, `--disable-software-rasterizer` ve `--disable-gpu`
    varsayılan olarak etkindir ve WebGL/3D kullanımı bunu gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - İş akışınız bunlara bağlıysa `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`,
    uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - artı `noSandbox` etkin olduğunda `--no-sandbox` ve `--disable-setuid-sandbox`.
  - Varsayılanlar kapsayıcı imajı temel çizgisidir; kapsayıcı varsayılanlarını değiştirmek için özel
    bir entrypoint'e sahip özel tarayıcı imajı kullanın.

</Accordion>

Tarayıcı sandboxing ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin:

```bash
scripts/sandbox-setup.sh           # ana sandbox imajı
scripts/sandbox-browser-setup.sh   # isteğe bağlı tarayıcı imajı
```

### `agents.list` (aracı başına geçersiz kılmalar)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Ana Aracı",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // veya { primary, fallbacks }
        thinkingDefault: "high", // aracı başına düşünme düzeyi geçersiz kılması
        reasoningDefault: "on", // aracı başına akıl yürütme görünürlüğü geçersiz kılması
        fastModeDefault: false, // aracı başına hızlı mod geçersiz kılması
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // eşleşen defaults.models params değerlerini anahtar bazında geçersiz kılar
        skills: ["docs-search"], // ayarlandığında agents.defaults.skills yerine geçer
        identity: {
          name: "Samantha",
          theme: "yardımsever tembel hayvan",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: kararlı aracı kimliği (gerekli).
- `default`: birden fazla ayarlandığında ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa listedeki ilk girdi varsayılandır.
- `model`: dize biçimi yalnızca `primary` değerini geçersiz kılar; nesne biçimi `{ primary, fallbacks }` her ikisini de geçersiz kılar (`[]`, genel yedekleri devre dışı bırakır). Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan yedekleri devralmaya devam eder.
- `params`: `agents.defaults.models` içindeki seçili model girdisi üzerine birleştirilen aracı başına akış parametreleri. Tüm model kataloğunu kopyalamadan `cacheRetention`, `temperature` veya `maxTokens` gibi aracıya özgü geçersiz kılmalar için bunu kullanın.
- `skills`: isteğe bağlı aracı başına Skills izin listesi. Atlanırsa aracı, ayarlıysa `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleşmek yerine onların yerine geçer ve `[]` hiç skill olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı aracı başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum geçersiz kılması ayarlı değilse bu aracı için `agents.defaults.thinkingDefault` değerini geçersiz kılar.
- `reasoningDefault`: isteğe bağlı aracı başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj başına veya oturum akıl yürütme geçersiz kılması ayarlı değilse uygulanır.
- `fastModeDefault`: hızlı mod için isteğe bağlı aracı başına varsayılan (`true | false`). Mesaj başına veya oturum hızlı mod geçersiz kılması ayarlı değilse uygulanır.
- `embeddedHarness`: isteğe bağlı aracı başına düşük düzey harness ilkesi geçersiz kılması. Bir aracıyı yalnızca Codex yaparken diğer aracılar varsayılan PI yedeğini korusun istiyorsanız `{ runtime: "codex", fallback: "none" }` kullanın.
- `runtime`: isteğe bağlı aracı başına çalışma zamanı tanımlayıcısı. Aracının varsayılan olarak ACP harness oturumlarını kullanmasını istediğinizde `type: "acp"` ile `runtime.acp` varsayılanlarını (`agent`, `backend`, `mode`, `cwd`) kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI.
- `identity`, varsayılanları türetir: `ackReaction`, `emoji` içinden; `mentionPatterns`, `name`/`emoji` içinden.
- `subagents.allowAgents`: `sessions_spawn` için aracı kimliği izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı aracı).
- Sandbox devralma koruması: isteyen oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar; varsayılan: false).

---

## Çok aracı yönlendirmesi

Tek bir Gateway içinde birden fazla yalıtılmış aracı çalıştırın. Bkz. [Çok Aracılı](/tr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Bağlama eşleşme alanları

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik `type`, varsayılan olarak route kabul edilir), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (gerekli)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan aracı

Her katmanda, eşleşen ilk `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katman sırasını kullanmaz.

### Aracı başına erişim profilleri

<Accordion title="Tam erişim (sandbox yok)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Salt okunur araçlar + çalışma alanı">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Dosya sistemi erişimi yok (yalnızca mesajlaşma)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Öncelik ayrıntıları için [Çok Aracı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

---

## Oturum

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // bunun üzerindeki token sayısında üst iş parçacığı çatalını atla (0 devre dışı bırakır)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı katı bütçe
      highWaterBytes: "400mb", // isteğe bağlı temizleme hedefi
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // varsayılan etkin olmama nedeniyle otomatik odak kaldırma, saat cinsinden (`0` devre dışı bırakır)
      maxAgeHours: 0, // varsayılan katı azami yaş, saat cinsinden (`0` devre dışı bırakır)
    },
    mainKey: "main", // eski alan (çalışma zamanı her zaman "main" kullanır)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): her gönderici, bir kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplanacağını belirler.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderici kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderici başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderici başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı önekli eş düzeyleriyle eşler.
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` anında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırılmışsa önce süresi dolan kazanır.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`parentForkMaxTokens`**: çatallanmış iş parçacığı oturumu oluştururken izin verilen azami üst oturum `totalTokens` değeri (varsayılan `100000`).
  - Üst `totalTokens` bu değerin üzerindeyse OpenClaw üst döküm geçmişini devralmak yerine yeni bir iş parçacığı oturumu başlatır.
  - Bu korumayı devre dışı bırakmak ve üst çatallamaya her zaman izin vermek için `0` ayarlayın.
- **`mainKey`**: eski alan. Çalışma zamanı ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: aracıdan aracıya değişimlerde aracılar arasında izin verilen azami geri-yanıt dönüşü (tamsayı, aralık: `0`–`5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleşir. İlk red kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı üretir; `enforce` temizliği uygular.
  - `pruneAfter`: bayat girdiler için yaş sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki azami girdi sayısı (varsayılan `500`).
  - `rotateBytes`: `sessions.json` bu boyutu aştığında döndürür (varsayılan `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi. Varsayılanı `pruneAfter`; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturum dizini disk bütçesi. `warn` modunda uyarı günlüğü yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonraki isteğe bağlı hedef. Varsayılanı `maxDiskBytes` değerinin `%80`'idir.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: etkin olmama nedeniyle otomatik odak kaldırma için varsayılan saat değeri (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: katı azami yaş için varsayılan saat değeri (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // veya "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 devre dışı bırakır
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Yanıt öneki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve zinciri durdurur. `"auto"`, `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken         | Açıklama                | Örnek                       |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Kısa model adı          | `claude-opus-4-6`           |
| `{modelFull}`    | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`     | Sağlayıcı adı           | `anthropic`                 |
| `{thinkingLevel}`| Geçerli düşünme düzeyi  | `high`, `low`, `off`        |
| `{identity.name}`| Aracı kimlik adı        | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarlı değildir. `{think}`, `{thinkingLevel}` için bir takma addır.

### Ack tepkisi

- Varsayılan olarak etkin aracının `identity.emoji` değeri kullanılır, aksi halde `"👀"`. Devre dışı bırakmak için `""` ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord ve Telegram'da yanıttan sonra ack'i kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram'da yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord'da ayarsız bırakmak, ack tepkileri etkinse durum tepkilerini etkin tutar.
  Telegram'da yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı göndericiden hızla gelen yalnızca metin mesajlarını tek bir aracı dönüşünde toplar. Medya/ekler hemen boşaltılır. Denetim komutları debounce'u atlar.

### TTS (metinden sese)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto`, varsayılan otomatik TTS modunu kontrol eder: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` olur (isteğe bağlı etkinleştirme).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- `openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, sonra `OPENAI_TTS_BASE_URL`, sonra `https://api.openai.com/v1` şeklindedir.
- `openai.baseUrl` OpenAI dışı bir uç noktaya işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu (macOS/iOS/Android) için varsayılanlar.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider`, birden fazla Talk sağlayıcısı yapılandırıldığında `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine taşınır.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine geri döner.
- `providers.*.apiKey`, düz metin dizeleri veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca hiçbir Talk API anahtarı yapılandırılmamışsa uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin dostça adlar kullanmasına izin verir.
- `silenceTimeoutMs`, Talk modunun dökümü göndermeden önce kullanıcı sessizliğinden sonra ne kadar bekleyeceğini kontrol eder. Ayarsız bırakıldığında platform varsayılan duraklama penceresi korunur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).

---

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde bir temel izin listesi ayarlar:

Yerel ilk kurulum, ayarsız olduğunda yeni yerel yapılandırmaları varsayılan olarak `tools.profile: "coding"` ile başlatır (mevcut açık profiller korunur).

| Profil      | İçerir                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | yalnızca `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Kısıtlama yok (ayarsız ile aynı)                                                                                                |

### Araç grupları

| Grup               | Araçlar                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için bir takma ad olarak kabul edilir)                            |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı plugin'leri hariç)                                                                     |

### `tools.allow` / `tools.deny`

Genel araç izin/verme veya engelleme ilkesi (engelleme kazanır). Büyük/küçük harfe duyarlı değildir, `*` joker karakterlerini destekler. Docker sandbox kapalı olduğunda bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da sınırlar. Sıra: temel profil → sağlayıcı profili → izin/verme veya engelleme.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Sandbox dışındaki yükseltilmiş exec erişimini kontrol eder:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Aracı başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlayabilir.
- `/elevated on|off|ask|full`, durumu oturum başına saklar; satır içi yönergeler tek mesaja uygulanır.
- Yükseltilmiş `exec`, sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (`gateway` varsayılanıdır veya exec hedefi `node` olduğunda `node` kullanılır).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri varsayılan olarak **devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın.
Ayarlar genel olarak `tools.loopDetection` içinde tanımlanabilir ve aracı başına `agents.list[].tools.loopDetection` altında geçersiz kılınabilir.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: döngü analizi için saklanan azami araç çağrısı geçmişi.
- `warningThreshold`: uyarılar için tekrarlayan ilerleme yok deseni eşiği.
- `criticalThreshold`: kritik döngüleri engellemek için daha yüksek tekrar eşiği.
- `globalCircuitBreakerThreshold`: ilerleme olmayan herhangi bir çalıştırma için katı durdurma eşiği.
- `detectors.genericRepeat`: aynı araç/aynı argüman çağrılarının tekrarı konusunda uyarır.
- `detectors.knownPollNoProgress`: bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) ilerleme olmaması durumunda uyarır/engeller.
- `detectors.pingPong`: dönüşümlü ilerlemesiz çift desenlerinde uyarır/engeller.
- `warningThreshold >= criticalThreshold` veya `criticalThreshold >= globalCircuitBreakerThreshold` ise doğrulama başarısız olur.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // veya BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Gelen medya anlama yeteneğini yapılandırır (görsel/ses/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // isteğe bağlı: tamamlanan eşzamansız müziği/videoyu doğrudan kanala gönder
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Medya model girdisi alanları">

**Sağlayıcı girdisi** (`type: "provider"` veya atlanmış):

- `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
- `model`: model kimliği geçersiz kılması
- `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

**CLI girdisi** (`type: "cli"`):

- `command`: çalıştırılacak yürütülebilir dosya
- `args`: şablonlu argümanlar (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. destekler)

**Ortak alanlar:**

- `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
- Hatalar bir sonraki girdiye geri döner.

Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → env değişkenleri → `models.providers.*.apiKey`.

**Eşzamansız tamamlama alanları:**

- `asyncCompletion.directSend`: `true` olduğunda, tamamlanan eşzamansız `music_generate`
  ve `video_generate` görevleri önce doğrudan kanal teslimini dener. Varsayılan: `false`
  (eski istemci oturumu uyandırma/model teslim yolu).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Oturum araçlarının (`sessions_list`, `sessions_history`, `sessions_send`) hangi oturumları hedefleyebileceğini kontrol eder.

Varsayılan: `tree` (geçerli oturum + onun oluşturduğu oturumlar, örneğin alt aracılar).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Notlar:

- `self`: yalnızca geçerli oturum anahtarı.
- `tree`: geçerli oturum + geçerli oturumun oluşturduğu oturumlar (alt aracılar).
- `agent`: geçerli aracı kimliğine ait herhangi bir oturum (aynı aracı kimliği altında gönderici başına oturumlar çalıştırıyorsanız diğer kullanıcıları da içerebilir).
- `all`: herhangi bir oturum. Kanallar arası hedefleme yine de `tools.agentToAgent` gerektirir.
- Sandbox sıkıştırması: geçerli oturum sandbox içindeyse ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük `tree` olarak zorlanır.

### `tools.sessions_spawn`

`sessions_spawn` için satır içi ek desteğini kontrol eder.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // isteğe bağlı etkinleştirme: satır içi dosya eklerine izin vermek için true yapın
        maxTotalBytes: 5242880, // tüm dosyalar için toplam 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // dosya başına 1 MB
        retainOnSessionKeep: false, // cleanup="keep" olduğunda ekleri koru
      },
    },
  },
}
```

Notlar:

- Ekler yalnızca `runtime: "subagent"` için desteklenir. ACP çalışma zamanı bunları reddeder.
- Dosyalar çocuk çalışma alanında `.openclaw/attachments/<uuid>/` içine `.manifest.json` ile birlikte somutlaştırılır.
- Ek içeriği döküm kalıcılığından otomatik olarak redakte edilir.
- Base64 girdileri katı alfabe/dolgu denetimleri ve çözümleme öncesi boyut koruması ile doğrulanır.
- Dosya izinleri dizinler için `0700`, dosyalar için `0600` olur.
- Temizleme `cleanup` ilkesini izler: `delete` her zaman ekleri kaldırır; `keep`, bunları yalnızca `retainOnSessionKeep: true` olduğunda korur.

<a id="toolsexperimental"></a>

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Katı-aracı GPT-5 otomatik etkinleştirme kuralı uygulanmadığı sürece varsayılan olarak kapalıdır.

```json5
{
  tools: {
    experimental: {
      planTool: true, // deneysel update_plan aracını etkinleştir
    },
  },
}
```

Notlar:

- `planTool`: önemsiz olmayan çok adımlı iş takibi için yapılandırılmış `update_plan` aracını etkinleştirir.
- Varsayılan: `false`; ancak `agents.defaults.embeddedPi.executionContract` (veya aracı başına bir geçersiz kılma) bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırmasında `"strict-agentic"` olarak ayarlanmışsa farklıdır. Aracı bu kapsam dışında zorla açmak için `true`, katı-aracı GPT-5 çalıştırmalarında bile kapalı tutmak için `false` ayarlayın.
- Etkin olduğunda sistem istemi de kullanım yönlendirmesi ekler; böylece model bunu yalnızca önemli işlerde kullanır ve aynı anda en fazla bir adımı `in_progress` tutar.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: oluşturulan alt aracılar için varsayılan model. Atlanırsa alt aracılar çağıranın modelini devralır.
- `allowAgents`: isteyen aracı kendi `subagents.allowAgents` değerini ayarlamadığında `sessions_spawn` için hedef aracı kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı aracı).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı yok demektir.
- Alt aracı başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL'ler

OpenClaw yerleşik model kataloğunu kullanır. Yapılandırmada veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde `models.providers` aracılığıyla özel sağlayıcılar ekleyin.

```json5
{
  models: {
    mode: "merge", // merge (varsayılan) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Özel kimlik doğrulama ihtiyaçları için `authHeader: true` + `headers` kullanın.
- Aracı yapılandırma kökünü `OPENCLAW_AGENT_DIR` ile geçersiz kılın (veya eski ortam değişkeni takma adı olan `PI_CODING_AGENT_DIR` ile).
- Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
  - Boş olmayan aracı `models.json` `baseUrl` değerleri kazanır.
  - Boş olmayan aracı `apiKey` değerleri yalnızca o sağlayıcı geçerli config/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
  - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizlileri kalıcılaştırmak yerine kaynak işaretleyicilerinden (`env` ref'leri için `ENV_VAR_NAME`, file/exec ref'leri için `secretref-managed`) yenilenir.
  - SecretRef tarafından yönetilen sağlayıcı başlık değerleri kaynak işaretleyicilerinden yenilenir (`env` ref'leri için `secretref-env:ENV_VAR_NAME`, file/exec ref'leri için `secretref-managed`).
  - Boş veya eksik aracı `apiKey`/`baseUrl` değerleri config içindeki `models.providers` değerlerine geri döner.
  - Eşleşen model `contextWindow`/`maxTokens`, açık config ile örtük katalog değerleri arasından daha yüksek olanı kullanır.
  - Eşleşen model `contextTokens`, varsa açık çalışma zamanı üst sınırını korur; yerel model meta verisini değiştirmeden etkin bağlamı sınırlamak için bunu kullanın.
  - Config'in `models.json` dosyasını tamamen yeniden yazmasını istiyorsanız `models.mode: "replace"` kullanın.
  - İşaretleyici kalıcılığı kaynak açısından yetkilidir: işaretleyiciler çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak config anlık görüntüsünden (çözümleme öncesi) yazılır.

### Sağlayıcı alanı ayrıntıları

- `models.mode`: sağlayıcı katalog davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliği ile anahtarlanan özel sağlayıcı haritası.
  - Güvenli düzenlemeler: eklemeli güncellemeler için `openclaw config set models.providers.<id> '<json>' --strict-json --merge` veya `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece yıkıcı değiştirmeleri reddeder.
- `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.).
- `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/env substitution tercih edin).
- `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` enjekte eder (varsayılan: `true`).
- `models.providers.*.authHeader`: gerektiğinde kimlik bilgisini `Authorization` başlığında taşımayı zorlar.
- `models.providers.*.baseUrl`: üst akış API temel URL'si.
- `models.providers.*.headers`: proxy/tenant yönlendirmesi için ek statik başlıklar.
- `models.providers.*.request`: model-sağlayıcı HTTP istekleri için taşıma geçersiz kılmaları.
  - `request.headers`: ek başlıklar (sağlayıcı varsayılanları ile birleştirilir). Değerler SecretRef kabul eder.
  - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
  - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` env değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı bir `tls` alt nesnesi kabul eder.
  - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (hepsi SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: `true` olduğunda, DNS özel, CGNAT veya benzeri aralıklara çözüldüğünde sağlayıcı HTTP fetch koruması aracılığıyla `baseUrl` için HTTPS kullanımına izin verir (güvenilen self-hosted OpenAI uyumlu uç noktalar için operatör isteğe bağlı etkinleştirme). WebSocket aynı `request` nesnesini başlıklar/TLS için kullanır ancak bu fetch SSRF geçidini kullanmaz. Varsayılan `false`.
- `models.providers.*.models`: açık sağlayıcı model katalog girdileri.
- `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verisi.
- `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam üst sınırı. Modelin yerel `contextWindow` değerinden daha küçük etkin bağlam bütçesi istediğinizde bunu kullanın.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. `api: "openai-completions"` ve boş olmayan yerel olmayan bir `baseUrl` için (`api.openai.com` olmayan host), OpenClaw çalışma zamanında bunu `false` olmaya zorlar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
- `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kabul eden OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw isteği göndermeden önce yalnızca metin içeren `messages[].content` dizilerini düz dizelere indirger.
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi açar/kapatır.
- `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenilemesi için yoklama aralığı.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için yedek bağlam penceresi.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için yedek azami çıktı token'ı.

### Sağlayıcı örnekleri

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras için `cerebras/zai-glm-4.7`; doğrudan Z.AI için `zai/glm-4.7` kullanın.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...` referanslarını veya Go kataloğu için `opencode-go/...` referanslarını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` ayarlayın. `z.ai/*` ve `z-ai/*`, kabul edilen takma adlardır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

- Genel uç nokta: `https://api.z.ai/api/paas/v4`
- Coding uç noktası (varsayılan): `https://api.z.ai/api/coding/paas/v4`
- Genel uç nokta için temel URL geçersiz kılmasıyla özel bir sağlayıcı tanımlayın.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Çin uç noktası için: `baseUrl: "https://api.moonshot.cn/v1"` veya `openclaw onboard --auth-choice moonshot-api-key-cn`.

Yerel Moonshot uç noktaları, paylaşılan
`openai-completions` taşımasında akış kullanımı uyumluluğu bildirir ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliğine değil
uç nokta yeteneklerine göre anahtarlar.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic uyumlu, yerleşik sağlayıcı. Kısayol: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic uyumlu)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Temel URL `/v1` içermemelidir (Anthropic istemcisi bunu ekler). Kısayol: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (doğrudan)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` ayarlayın. Kısayollar:
`openclaw onboard --auth-choice minimax-global-api` veya
`openclaw onboard --auth-choice minimax-cn-api`.
Model kataloğu varsayılan olarak yalnızca M2.7 kullanır.
Anthropic uyumlu akış yolunda OpenClaw, siz açıkça `thinking` ayarlamadığınız sürece MiniMax düşünmesini
varsayılan olarak devre dışı bırakır. `/fast on` veya
`params.fastMode: true`, `MiniMax-M2.7` değerini
`MiniMax-M2.7-highspeed` olarak yeniden yazar.

</Accordion>

<Accordion title="Yerel modeller (LM Studio)">

Bkz. [Yerel Modeller](/tr/gateway/local-models). Kısaca: ciddi donanımda LM Studio Responses API ile büyük bir yerel model çalıştırın; yedek için barındırılan modelleri birleştirilmiş tutun.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca paketlenmiş Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşımlı skill kökleri (en düşük öncelik).
- `install.preferBrew`: `true` olduğunda ve `brew` kullanılabilir olduğunda
  diğer yükleyici türlerine geri dönmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install`
  özellikleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, skill paketlenmiş/kurulu olsa bile onu devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil env değişkeni tanımlayan Skills için kolaylık alanı (düz metin dize veya SecretRef nesnesi).

---

## Plugin'ler

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` içinden yüklenir.
- Keşif, yerel OpenClaw plugin'lerini ve uyumlu Codex paketlerini ve Claude paketlerini kabul eder; buna manifest içermeyen Claude varsayılan düzen paketleri de dahildir.
- **Yapılandırma değişiklikleri bir Gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen plugin'ler yüklenir). `deny` kazanır.
- `plugins.entries.<id>.apiKey`: plugin düzeyinde API anahtarı kolaylık alanı (plugin destekliyorsa).
- `plugins.entries.<id>.env`: plugin kapsamlı env değişkeni haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build` geçidini engeller ve eski `before_agent_start` içinden gelen istem değiştirici alanları yok sayar; eski `modelOverride` ve `providerOverride` korunur. Bu, yerel plugin hook'larına ve desteklenen paket tabanlı hook dizinlerine uygulanır.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu plugin'e arka plan alt aracı çalıştırmaları için çalışma başına `provider` ve `model` geçersiz kılmaları isteme konusunda açık güven verir.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt aracı geçersiz kılmaları için isteğe bağlı kurallı `provider/model` hedef izin listesi. Herhangi bir modele kasıtlı olarak izin vermek istediğinizde yalnızca `"*"` kullanın.
- `plugins.entries.<id>.config`: plugin tarafından tanımlanan yapılandırma nesnesi (varsa yerel OpenClaw plugin şemasıyla doğrulanır).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` env değişkenine geri döner.
  - `baseUrl`: Firecrawl API temel URL'si (varsayılan: `https://api.firecrawl.dev`).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkarır (varsayılan: `true`).
  - `maxAgeMs`: milisaniye cinsinden azami önbellek yaşı (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: saniye cinsinden kazıma istek zaman aşımı (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web arama) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştirir.
  - `model`: arama için kullanılacak Grok modeli (ör. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: bellek dreaming ayarları. Aşamalar ve eşikler için [Dreaming](/tr/concepts/dreaming) bölümüne bakın.
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için Cron sıklığı (varsayılan `"0 3 * * *"`).
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya açık yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırması başvurusu](/tr/reference/memory-config) bölümünde bulunur:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude paket plugin'leri ayrıca `settings.json` içinden gömülü Pi varsayılanları da sağlayabilir; OpenClaw bunları ham OpenClaw config yamaları olarak değil, temizlenmiş aracı ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçer veya bellek plugin'lerini devre dışı bırakmak için `"none"` seçer.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçer; başka bir motor yükleyip seçmediğiniz sürece varsayılan `"legacy"` olur.
- `plugins.installs`: `openclaw plugins update` tarafından kullanılan CLI yönetimli kurulum meta verileri.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt` alanlarını içerir.
  - `plugins.installs.*` değerlerini yönetilen durum olarak değerlendirin; elle düzenlemeler yerine CLI komutlarını tercih edin.

Bkz. [Plugins](/tr/tools/plugin).

---

## Tarayıcı

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için isteğe bağlı etkinleştirme
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` komutlarını devre dışı bırakır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`, ayarsız olduğunda devre dışıdır; bu yüzden tarayıcı gezinmesi varsayılan olarak katı kalır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarını yalnızca özel ağ tarayıcı gezinmesine bilinçli olarak güvendiğinizde yapın.
- Katı modda uzak CDP profil uç noktaları (`profiles.*.cdpUrl`) erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.
- Katı modda açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca bağlanma modundadır (başlat/durdur/sıfırla devre dışı).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  OpenClaw'ın `/json/version` keşfetmesini istiyorsanız HTTP(S) kullanın; doğrudan
  DevTools WebSocket URL'si veren sağlayıcılarda WS(S) kullanın.
- `existing-session` profilleri CDP yerine Chrome MCP kullanır ve
  seçilen ana makinede veya bağlı bir tarayıcı Node'u üzerinden bağlanabilir.
- `existing-session` profilleri, Brave veya Edge gibi belirli
  Chromium tabanlı tarayıcı profillerini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri mevcut Chrome MCP yol sınırlarını korur:
  CSS seçici hedefleme yerine anlık görüntü/ref tabanlı eylemler, tek dosya yükleme
  hook'ları, iletişim kutusu zaman aşımı geçersiz kılmalarının olmaması, `wait --load networkidle` olmaması ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler olmaması.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; yalnızca
  uzak CDP için `cdpUrl` değerini açıkça ayarlayın.
- Otomatik algılama sırası: varsayılan tarayıcı Chromium tabanlıysa → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control service: yalnızca loopback (port `gateway.port` değerinden türetilir, varsayılan `18791`).
- `extraArgs`, yerel Chromium başlatmasına ek başlatma bayrakları ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, kısa metin, görsel URL'si veya data URI
    },
  },
}
```

- `seamColor`: yerel uygulama UI chrome'u için vurgu rengi (Talk Mode baloncuk tonu vb.).
- `assistant`: Control UI kimlik geçersiz kılması. Etkin aracı kimliğine geri döner.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // veya OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy için; bkz. /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // tehlikeli: mutlak harici http(s) embed URL'lerine izin ver
      // allowedOrigins: ["https://control.example.com"], // loopback olmayan Control UI için gereklidir
      // dangerouslyAllowHostHeaderOriginFallback: false, // tehlikeli Host-header origin fallback modu
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // İsteğe bağlı. Varsayılan false.
    allowRealIpFallback: false,
    tools: {
      // Ek /tools/invoke HTTP engellemeleri
      deny: ["browser"],
      // Varsayılan HTTP engelleme listesinden araçları kaldır
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway alanı ayrıntıları">

- `mode`: `local` (Gateway'i çalıştır) veya `remote` (uzak Gateway'e bağlan). Gateway, `local` değilse başlamayı reddeder.
- `port`: WS + HTTP için tek çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde ana makine takma adları (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind, kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker bridge ağı ile (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden Gateway erişilemez olur. `--network host` kullanın veya tüm arayüzlerde dinlemek için `bind: "lan"` (veya `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Auth**: varsayılan olarak gereklidir. Loopback olmayan bind'ler Gateway auth gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir reverse proxy anlamına gelir. İlk kurulum sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmışken mod ayarsızsa başlangıç ve servis kurulum/onarım akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık no-auth modu. Bunu yalnızca güvenilen yerel loopback kurulumları için kullanın; bu, ilk kurulum istemlerinde bilerek sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: kimlik doğrulamayı kimlik farkında bir reverse proxy'ye devreder ve `gateway.trustedProxies` içinden gelen kimlik başlıklarına güvenir (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod **loopback olmayan** bir proxy kaynağı bekler; aynı ana makinedeki loopback reverse proxy'ler trusted-proxy auth için yeterli değildir.
- `gateway.auth.allowTailscale`: `true` olduğunda Tailscale Serve kimlik başlıkları Control UI/WebSocket auth gereksinimini karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık auth yöntemini **kullanmaz**; bunun yerine Gateway'in normal HTTP auth modunu izler. Bu token'sız akış, Gateway ana makinesinin güvenildiğini varsayar. `tailscale.mode = "serve"` olduğunda varsayılan `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız auth sınırlayıcısı. İstemci IP'si ve auth kapsamı başına uygulanır (paylaşımlı gizli ve cihaz token'ı ayrı ayrı izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler başarısızlık yazımı öncesinde serileştirilir. Bu nedenle aynı istemciden gelen eşzamanlı kötü denemeler, ikisinin de düz uyumsuzluk olarak yarışması yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true`; localhost trafiğini de hız sınırına tabi tutmak istiyorsanız (test kurulumları veya katı proxy dağıtımları için) `false` ayarlayın.
- Tarayıcı kökenli WS auth denemeleri, loopback muafiyeti devre dışı olacak şekilde her zaman sınırlanır (tarayıcı tabanlı localhost brute force saldırılarına karşı savunma derinliği).
- Loopback üzerinde bu tarayıcı kökenli kilitlemeler normalize edilmiş `Origin`
  değeri başına yalıtılır; bu yüzden bir localhost kökeninden gelen tekrar eden hatalar
  farklı bir kökeni otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (herkese açık, auth gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı kökeni izin listesi. Tarayıcı istemcileri loopback dışı kökenlerden beklendiğinde gereklidir.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ilkesine kasıtlı olarak dayanan dağıtımlar için Host-header origin fallback'i etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: güvenilen özel ağ IP'lerine düz metin `ws://` erişimine izin veren istemci tarafı acil durum geçersiz kılması; varsayılan hâlâ düz metin için yalnızca loopback'tir.
- `gateway.remote.token` / `.password`, uzak istemci kimlik bilgisi alanlarıdır. Bunlar kendi başına Gateway auth yapılandırmaz.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway'e yayımladıktan sonra kullanılan harici APNs relay için temel HTTPS URL'si. Bu URL, iOS derlemesine gömülmüş relay URL'siyle eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway'den relay'e gönderim zaman aşımı, milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşleştirilmiş iOS uygulaması `gateway.identity.get` çağırır, bu kimliği relay kaydına ekler ve kayıt kapsamlı gönderim iznini Gateway'e iletir. Başka bir Gateway bu saklanan kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici env geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL'leri için yalnızca geliştirme amaçlı kaçış kapısı. Üretim relay URL'leri HTTPS üzerinde kalmalıdır.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleme aralığı, dakika cinsinden. Sağlık izleme yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: bayat soket eşiği, dakika cinsinden. Bunu `gateway.channelHealthCheckMinutes` değerinden büyük veya eşit tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına azami sağlık izleme yeniden başlatması sayısı. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleme yeniden başlatmalarını kanal başına devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyindeki geçersiz kılmadan önceliklidir.
- Yerel Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef ile yapılandırılmışsa ve çözümlenmemişse çözümleme kapalı şekilde başarısız olur (uzak yedeğin bunu maskelemesine izin verilmez).
- `trustedProxies`: TLS sonlandıran veya yönlendirilmiş istemci başlıkları enjekte eden reverse proxy IP'leri. Yalnızca kontrol ettiğiniz proxy'leri listeleyin. Loopback girdileri aynı ana makine proxy/yerel algılama kurulumları için hâlâ geçerlidir (örneğin Tailscale Serve veya yerel reverse proxy), ancak bunlar loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale getirmez.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` kabul eder. Kapalı başarısız davranış için varsayılan `false`.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için engellenen ek araç adları (varsayılan engelleme listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP engelleme listesinden çıkarır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışı. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdisi sağlamlaştırması:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarsız kabul edilir; URL getirmeyi devre dışı bırakmak için
    `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt sağlamlaştırma başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (bunu yalnızca kontrol ettiğiniz HTTPS kökenleri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çoklu örnek yalıtımı

Tek ana makinede benzersiz portlar ve durum dizinleriyle birden fazla Gateway çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + port `19001` kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Birden Fazla Gateway](/tr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: Gateway dinleyicisinde TLS sonlandırmasını etkinleştirir (HTTPS/WSS) (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel imzalı sertifika/anahtar çiftini otomatik üretir; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinleri kısıtlı tutun.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA paketi yolu.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını kontrol eder.
  - `"off"`: canlı düzenlemeleri yok sayar; değişiklikler açık yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değişikliğinde her zaman Gateway sürecini yeniden başlatır.
  - `"hot"`: değişiklikleri yeniden başlatmadan süreç içinde uygular.
  - `"hybrid"` (varsayılan): önce hot reload dener; gerekirse yeniden başlatmaya geri döner.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önceki debounce penceresi, ms cinsinden (negatif olmayan tamsayı).
- `deferralTimeoutMs`: devam eden işlemlerin bitmesini beklemek için zorunlu yeniden başlatma öncesi azami süre, ms cinsinden (varsayılan: `300000` = 5 dakika).

---

## Hook'lar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Kimden: {{messages[0].from}}\nKonu: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` veya `x-openclaw-token: <token>`.
Sorgu dizesi hook token'ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` değerinden **farklı** olmalıdır; Gateway token'ını yeniden kullanmak reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini sınırlandırın (örneğin `["hook:"]`).
- Bir eşleme veya preset şablonlu `sessionKey` kullanıyorsa `hooks.allowedSessionKeyPrefixes` ve `hooks.allowRequestSessionKey=true` ayarlayın. Statik eşleme anahtarları bu isteğe bağlı etkinleştirmeyi gerektirmez.

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` olduğunda kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` aracılığıyla çözülür
  - Şablonla oluşturulan eşleme `sessionKey` değerleri haricen sağlanmış kabul edilir ve yine `hooks.allowRequestSessionKey=true` gerektirir.

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (ör. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar yükten okur.
- `transform`, bir hook eylemi döndüren bir JS/TS modülünü işaret edebilir.
  - `transform.module`, göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalmalıdır (mutlak yollar ve dizin geçişi reddedilir).
- `agentId`, belirli bir aracıya yönlendirir; bilinmeyen kimlikler varsayılan aracıya geri döner.
- `allowedAgentIds`: açık yönlendirmeyi sınırlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan hook aracı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranların ve şablon güdümlü eşleme oturum anahtarlarının `sessionKey` ayarlamasına izin verir (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri (istek + eşleme) için isteğe bağlı önek izin listesi; ör. `["hook:"]`. Herhangi bir eşleme veya preset şablonlu `sessionKey` kullandığında gerekli hale gelir.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel`, varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM'yi geçersiz kılar (model kataloğu ayarlıysa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

- Yerleşik Gmail preset'i `sessionKey: "hook:gmail:{{messages[0].id}}"` kullanır.
- Bu mesaj başına yönlendirmeyi korursanız `hooks.allowRequestSessionKey: true` ayarlayın ve `hooks.allowedSessionKeyPrefixes` değerini Gmail ad alanıyla eşleşecek şekilde sınırlayın; örneğin `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false` kullanmanız gerekiyorsa preset'i şablonlu varsayılan yerine statik bir `sessionKey` ile geçersiz kılın.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Yapılandırıldığında Gateway açılışta `gog gmail watch serve` komutunu otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
- Gateway ile birlikte ayrı bir `gog gmail watch serve` çalıştırmayın.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // veya OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Aracı tarafından düzenlenebilir HTML/CSS/JS ve A2UI içeriklerini Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- Loopback olmayan bind'lerde: canvas yolları, diğer Gateway HTTP yüzeyleri gibi Gateway auth gerektirir (token/password/trusted-proxy).
- Node WebView'lar genellikle auth başlıkları göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı capability URL'leri duyurur.
- Capability URL'leri etkin node WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı yedek kullanılmaz.
- Sunulan HTML içine live-reload istemcisini enjekte eder.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- Ayrıca A2UI'yi `/__openclaw__/a2ui/` adresinde sunar.
- Değişiklikler Gateway yeniden başlatması gerektirir.
- Büyük dizinlerde veya `EMFILE` hatalarında live reload'u devre dışı bırakın.

---

## Keşif

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` değerlerini çıkarır.
- `full`: `cliPath` + `sshPort` içerir.
- Ana makine adı varsayılan olarak `openclaw` kullanır. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir unicast DNS-SD bölgesi yazar. Ağlar arası keşif için bunu bir DNS sunucusu (CoreDNS önerilir) + Tailscale split DNS ile eşleştirin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi env değişkenleri)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Satır içi env değişkenleri yalnızca süreç env içinde anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: eksik beklenen anahtarları oturum açma kabuğu profilinizden içe aktarır.
- Tam öncelik için [Ortam](/tr/help/environment) bölümüne bakın.

### Env değişkeni yer değiştirme

Herhangi bir yapılandırma dizesinde env değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca şu desenle eşleşen büyük harf adları kullanılır: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yükleme sırasında hata üretir.
- Gerçek `${VAR}` için `$${VAR}` ile escape edin.
- `$include` ile çalışır.

---

## Gizliler

Secret ref'ler eklemelidir: düz metin değerler yine çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` kimlikleri `.` veya `..` içeren slash ile ayrılmış yol bölümleri barındırmamalıdır (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Kurallı matris: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` ref'leri çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Gizli sağlayıcı yapılandırması

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // isteğe bağlı açık env sağlayıcısı
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notlar:

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`id`, singleValue modunda `"value"` olmalıdır).
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinde protokol yükleri kullanır.
- Varsayılan olarak sembolik bağlantı komut yolları reddedilir. Sembolik bağlantı yollarına izin verirken çözümlenmiş hedef yolu doğrulamak için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa güvenilen dizin denetimi çözümlenmiş hedef yola uygulanır.
- `exec` alt süreç ortamı varsayılan olarak en aza indirilmiştir; gerekli değişkenleri `passEnv` ile açıkça geçin.
- Secret ref'ler etkinleştirme zamanında bellek içi bir anlık görüntüye çözülür, ardından istek yolları yalnızca bu anlık görüntüyü okur.
- Etkin yüzey filtrelemesi etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş ref'ler başlangıçta/yeniden yüklemede başarısız olur, etkin olmayan yüzeyler ise tanılama ile atlanır.

---

## Kimlik doğrulama depolama

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Aracı başına profiller `<agentDir>/auth-profiles.json` altında saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde ref'leri destekler (`api_key` için `keyRef`, `token` için `tokenRef`).
- OAuth modundaki profiller (`auth.profiles.<id>.mode = "oauth"`) SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözümlenmiş anlık görüntülerden gelir; eski statik `auth.json` girdileri bulunduğunda temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` dosyasından yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Gizli Yönetimi](/tr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bir profil gerçek
  faturalama/yetersiz kredi hataları nedeniyle başarısız olduğunda saat cinsinden temel geri çekilme süresi
  (varsayılan: `5`). Açık faturalama metni
  `401`/`403` yanıtlarında bile yine buraya düşebilir, ancak sağlayıcıya özgü metin
  eşleştiricileri bunlara sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  organization/workspace harcama sınırı iletileri bunun yerine
  `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalama geri çekilme süresi için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalama geri çekilme üstel büyümesi için saat cinsinden üst sınır (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için dakika cinsinden temel geri çekilme süresi (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` geri çekilme büyümesi için dakika cinsinden üst sınır (varsayılan: `60`).
- `failureWindowHours`: geri çekilme sayaçları için kullanılan kayan pencere, saat cinsinden (varsayılan: `24`).
- `overloadedProfileRotations`: model yedeğine geçmeden önce aşırı yük hataları için aynı sağlayıcı auth-profile döndürmelerinin azami sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı-meşgul biçimleri buraya düşer.
- `overloadedBackoffMs`: aşırı yüklenmiş bir sağlayıcı/profil döndürmesini yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model yedeğine geçmeden önce hız sınırı hataları için aynı sağlayıcı auth-profile döndürmelerinin azami sayısı (varsayılan: `1`). Bu hız sınırı kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlükleme

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Varsayılan günlük dosyası: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Kararlı bir yol için `logging.file` ayarlayın.
- `consoleLevel`, `--verbose` kullanıldığında `debug` olur.
- `maxFileBytes`: yazılar bastırılmadan önce günlük dosyası için azami boyut, bayt cinsinden (pozitif tamsayı; varsayılan: `524288000` = 500 MB). Üretim dağıtımları için harici günlük döndürme kullanın.

---

## Tanılama

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: araçsal çıktı için ana anahtar (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: bir oturum işlem durumunda kalırken takılı oturum uyarılarının üretilmesi için yaş eşiği, ms cinsinden.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`).
- `otel.endpoint`: OTel dışa aktarma için collector URL'si.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarmayı etkinleştirir.
- `otel.sampleRate`: `0`–`1` aralığında iz örnekleme oranı.
- `otel.flushIntervalMs`: periyodik telemetri boşaltma aralığı, ms cinsinden.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek iz anlık görüntülerini günlüğe yazar (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek iz JSONL çıktısı yolu (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek iz çıktısına nelerin dahil edileceğini kontrol eder (hepsi varsayılan olarak `true`).

---

## Güncelleme

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git kurulumları için sürüm kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetler (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştirir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal otomatik uygulaması öncesindeki saat cinsinden asgari gecikme (varsayılan: `6`; azami: `168`).
- `auto.stableJitterHours`: kararlı kanal yayılım dağılım penceresi için ek saat cinsinden süre (varsayılan: `12`; azami: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin çalışma sıklığı, saat cinsinden (varsayılan: `1`; azami: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: genel ACP özellik geçidi (varsayılan: `false`).
- `dispatch.enabled`: ACP oturum dönüşü dispatch için bağımsız geçit (varsayılan: `true`). Yürütmeyi engellerken ACP komutlarını kullanılabilir tutmak için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı backend kimliği (kayıtlı ACP çalışma zamanı plugin'i ile eşleşmelidir).
- `defaultAgent`: spawn işlemleri açık hedef belirtmediğinde yedek ACP hedef aracı kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen aracı kimlikleri izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: aynı anda etkin ACP oturumlarının azami sayısı.
- `stream.coalesceIdleMs`: akışlı metin için boşta kalma boşaltma penceresi, ms cinsinden.
- `stream.maxChunkChars`: akışlı blok projeksiyonunu bölmeden önce azami parça boyutu.
- `stream.repeatSuppression`: dönüş başına tekrarlanan durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` terminal dönüş olaylarına kadar tamponlar.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önce kullanılan ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP dönüşü başına projekte edilen azami asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: projekte edilen ACP durum/güncelleme satırları için azami karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarından boolean görünürlük geçersiz kılmalarına kayıt.
- `runtime.ttlMinutes`: ACP oturum çalışanları için temizliğe uygun hale gelmeden önceki boşta kalma TTL süresi, dakika cinsinden.
- `runtime.installCommand`: ACP çalışma zamanı ortamını bootstrap ederken çalıştırılacak isteğe bağlı kurulum komutu.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`, banner slogan stilini kontrol eder:
  - `"random"` (varsayılan): dönen eğlenceli/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yoktur (banner başlığı/sürümü yine gösterilir).
- Tüm banner'ı gizlemek için (yalnızca sloganları değil), env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

---

## Wizard

CLI yönlendirmeli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan meta veri:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Kimlik

[Aracı varsayılanları](#agent-defaults) altında `agents.list` kimlik alanlarına bakın.

---

## Bridge (eski, kaldırıldı)

Geçerli derlemeler artık TCP bridge içermez. Node'lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları temizleyebilir).

<Accordion title="Eski bridge yapılandırması (tarihsel başvuru)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // saklanmış notify:true işler için eski yedek
    webhookToken: "replace-with-dedicated-token", // giden webhook auth için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanan yalıtılmış Cron çalıştırma oturumlarının `sessions.json` dosyasından budanmadan önce ne kadar süre saklanacağı. Silinen arşivlenmiş Cron dökümlerinin temizliğini de kontrol eder. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: çalıştırma günlük dosyası başına azami boyut (`cron/runs/<jobId>.jsonl`) budama öncesi. Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde saklanan en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: Cron webhook `POST` teslimi için kullanılan bearer token (`delivery.mode = "webhook"`); atlanırsa auth başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` olan saklanmış işler için kullanılan eski, kullanımdan kaldırılmış yedek webhook URL'si (http/https).

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: geçici hatalarda tek seferlik işler için azami yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden geri çekilme gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 giriş).
- `retryOn`: yeniden denemeyi tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türleri yeniden denemek için atlayın.

Yalnızca tek seferlik Cron işleri için geçerlidir. Yinelenen işler ayrı hata işleme kullanır.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: uyarı tetiklenmeden önce ardışık hata sayısı (pozitif tamsayı, min: `1`).
- `cooldownMs`: aynı iş için tekrar eden uyarılar arasındaki asgari milisaniye (negatif olmayan tamsayı).
- `mode`: teslim modu — `"announce"` kanal mesajı ile gönderir; `"webhook"` yapılandırılmış webhook'a POST eder.
- `accountId`: uyarı teslimini kapsamlamak için isteğe bağlı hesap veya kanal kimliği.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tüm işler genelinde Cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi varsa varsayılan `"announce"` olur.
- `channel`: announce teslimi için kanal geçersiz kılması. `"last"` bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya webhook URL'si. Webhook modu için gereklidir.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Ne genel ne de iş başına hata hedefi ayarlıysa, zaten `announce` üzerinden teslim yapan işler hata durumunda o birincil announce hedefine geri döner.
- `delivery.failureDestination`, yalnızca işin birincil `delivery.mode` değeri `"webhook"` değilse `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron İşleri](/tr/automation/cron-jobs). Yalıtılmış Cron yürütmeleri [arka plan görevleri](/tr/automation/tasks) olarak izlenir.

---

## Medya model şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken          | Açıklama                                  |
| ----------------- | ----------------------------------------- |
| `{{Body}}`        | Tam gelen mesaj gövdesi                   |
| `{{RawBody}}`     | Ham gövde (geçmiş/gönderici sarmalayıcıları olmadan) |
| `{{BodyStripped}}`| Grup bahsetmeleri çıkarılmış gövde        |
| `{{From}}`        | Gönderen tanımlayıcısı                    |
| `{{To}}`          | Hedef tanımlayıcısı                       |
| `{{MessageSid}}`  | Kanal mesaj kimliği                       |
| `{{SessionId}}`   | Geçerli oturum UUID'si                    |
| `{{IsNewSession}}`| Yeni oturum oluşturulduysa `"true"`       |
| `{{MediaUrl}}`    | Gelen medya pseudo-URL'si                 |
| `{{MediaPath}}`   | Yerel medya yolu                          |
| `{{MediaType}}`   | Medya türü (image/audio/document/…)       |
| `{{Transcript}}`  | Ses dökümü                                |
| `{{Prompt}}`      | CLI girdileri için çözümlenmiş medya istemi |
| `{{MaxChars}}`    | CLI girdileri için çözümlenmiş azami çıktı karakteri |
| `{{ChatType}}`    | `"direct"` veya `"group"`                 |
| `{{GroupSubject}}`| Grup konusu (en iyi çaba)                 |
| `{{GroupMembers}}`| Grup üyeleri önizlemesi (en iyi çaba)     |
| `{{SenderName}}`  | Gönderen görünen adı (en iyi çaba)        |
| `{{SenderE164}}`  | Gönderen telefon numarası (en iyi çaba)   |
| `{{Provider}}`    | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

---

## Yapılandırma içermeleri (`$include`)

Yapılandırmayı birden fazla dosyaya bölün:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Birleştirme davranışı:**

- Tek dosya: kapsayan nesnenin yerine geçer.
- Dosya dizisi: sırayla derin birleştirilir (sonraki, öncekini geçersiz kılar).
- Kardeş anahtarlar: içermelerden sonra birleştirilir (içerilen değerleri geçersiz kılar).
- İç içe içermeler: en fazla 10 seviye derinliğe kadar.
- Yollar: içeren dosyaya göre çözümlenir, ancak üst düzey yapılandırma dizini sınırları içinde kalmalıdır (`openclaw.json` dosyasının `dirname` değeri). Mutlak/`../` biçimlerine yalnızca yine bu sınır içinde çözülüyorlarsa izin verilir.
- Yalnızca tek bir dosya içermesiyle desteklenen tek bir üst düzey bölümü değiştiren OpenClaw'a ait yazımlar, o içerilen dosyaya yazılır. Örneğin `plugins install`, `plugins: { $include: "./plugins.json5" }` ifadesini `plugins.json5` içinde günceller ve `openclaw.json` dosyasını olduğu gibi bırakır.
- Kök içermeler, include dizileri ve kardeş geçersiz kılmaları olan içermeler, OpenClaw'a ait yazımlar için salt okunurdur; bu yazımlar yapılandırmayı düzleştirmek yerine kapalı şekilde başarısız olur.
- Hatalar: eksik dosyalar, ayrıştırma hataları ve döngüsel içermeler için açık iletiler.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_
