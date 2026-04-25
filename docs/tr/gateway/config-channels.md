---
read_when:
    - Bir kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal başına config anahtarlarında sorun giderme
    - DM ilkesi, grup ilkesi veya bahsetme geçitlemesini denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme ve kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-04-25T13:46:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

`channels.*` altındaki kanal başına yapılandırma anahtarları. DM ve grup erişimini,
çoklu hesap kurulumlarını, bahsetme geçitlemesini ve Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve paketle birlikte gelen diğer kanal Plugin'leri için kanal başına anahtarları kapsar.

Aracılar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, config bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                      |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen göndericiler tek kullanımlık bir eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM'lere izin ver (gerektirir: `allowFrom: ["*"]`)   |
| `disabled`          | Tüm gelen DM'leri yok say                                     |

| Grup ilkesi           | Davranış                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar |
| `open`                | Grup izin listelerini baypas et (bahsetme geçitlemesi yine uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                     |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` ayarı yapılmadığında varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıçta bir uyarıyla `allowlist` (başarısız-kapalı) olarak geri döner.
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten model geçersiz kılma yoksa uygulanır (örneğin `/model` ile ayarlanmışsa).

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlanmadığında geri dönüş grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlük modu. Değerler: `all` (varsayılan, alıntılanan/thread/geçmiş bağlamının tümünü dahil et), `allowlist` (yalnızca izin verilen göndericilerden gelen bağlamı dahil et), `allowlist_quote` (allowlist ile aynı ama açık alıntı/yanıt bağlamını koru). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat çıktısına sağlıklı kanal durumlarını dahil et.
- `channels.defaults.heartbeat.showAlerts`: Heartbeat çıktısına bozulmuş/hata durumlarını dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, Gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum olduğunda otomatik olarak başlar.

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

<Accordion title="Çoklu hesap WhatsApp">

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

- Giden komutlar, varsa varsayılan olarak `default` hesabını; aksi halde yapılandırılmış ilk hesap kimliğini (sıralı) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys kimlik doğrulama dizini, `openclaw doctor` tarafından `whatsapp/default` içine taşınır.
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
          systemPrompt: "Yanıtları kısa tut.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Konudan sapma.",
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
      streaming: "partial", // off | partial | block | progress (varsayılan: off; önizleme düzenleme hız sınırlarından kaçınmak için açıkça etkinleştirin)
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

- Bot belirteci: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN` ile.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çoklu hesap kurulumlarında (2+ hesap kimliği), geri dönüş yönlendirmesinden kaçınmak için açık bir varsayılan ayarlayın (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`); bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram kaynaklı config yazımlarını engeller (supergroup kimliği geçişleri, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan semantiği [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) içinde paylaşılır.
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
              systemPrompt: "Yalnızca kısa yanıtlar.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress, Discord'da partial olarak eşlenir)
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

- Belirteç: `channels.discord.token`, varsayılan hesap için geri dönüş olarak `DISCORD_BOT_TOKEN` ile.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, bu çağrı için o belirteci kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` (guild kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Guild slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug'lanmış adı kullanır (`#` olmadan). Guild kimliklerini tercih edin.
- Bot tarafından yazılmış mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahseden ama bottan bahsetmeyen mesajları bırakır (`@everyone`/`@here` hariç).
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.threadBindings`, Discord thread'e bağlı yönlendirmeyi denetler:
  - `enabled`: thread'e bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslimat/yönlendirme)
  - `idleHours`: etkinliksizlik nedeniyle saat cinsinden otomatik odak kaldırma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı en yüksek yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` otomatik thread oluşturma/bağlama için isteğe bağlı etkinleştirme anahtarı
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve thread'ler için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanal/thread kimliği kullanın). Alan semantiği [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord components v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine doğrudan aktarılır (varsayılan olarak `true` ve `24`).
- OpenClaw ayrıca, art arda çözümsüz şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarmasını dener.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Eski `streamMode` ve boolean `streaming` değerleri otomatik olarak taşınır.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (sağlıklı => online, bozulmuş => idle, tükenmiş => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü exec onay teslimatı ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlanırsa `commands.ownerAllowFrom` değerine fallback yapar.
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek istiyorsanız atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` her ikisine gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenmiş onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımı sonrası onay DM'lerini siler.

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

- Hizmet hesabı JSON'u: satır içi (`serviceAccount`) veya dosya tabanlı (`serviceAccountFile`).
- Hizmet hesabı SecretRef de desteklenir (`serviceAccountRef`).
- Ortam değişkeni geri dönüşleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslimat hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
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
          systemPrompt: "Yalnızca kısa yanıtlar.",
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

- **Socket modu** hem `botToken` hem de `appToken` gerektirir (varsayılan hesap env geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu** `botToken` artı `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizeleri veya SecretRef nesneleri kabul eder.
- Slack hesap anlık görüntüleri, `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda `signingSecretStatus` gibi
  kimlik bilgisi başına kaynak/durum alanlarını gösterir.
  `configured_unavailable`, hesabın SecretRef üzerinden yapılandırıldığı ancak
  geçerli komut/çalışma zamanı yolunun gizli anahtar değerini çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan config yazımlarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış taşımasını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri otomatik olarak taşınır.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**Thread oturum yalıtımı:** `thread.historyScope` thread başına (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal transkriptini yeni thread'lere kopyalar.

- Slack yerel akışı ve Slack assistant tarzı “is typing...” thread durumu bir yanıt thread hedefi gerektirir. Üst düzey DM'ler varsayılan olarak thread dışı kalır, bu yüzden thread tarzı önizleme yerine `typingReaction` veya normal teslimat kullanırlar.
- `typingReaction`, bir yanıt çalışırken gelen Slack mesajına geçici bir tepki ekler, ardından tamamlanınca kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack'e özgü exec onay teslimatı ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                     |
| ----------- | ---------- | -------------------------- |
| reactions   | etkin      | Tepki ver + tepkileri listele |
| messages    | etkin      | Oku/gönder/düzenle/sil     |
| pins        | etkin      | Sabitle/sabiti kaldır/listele |
| memberInfo  | etkin      | Üye bilgisi                |
| emojiList   | etkin      | Özel emoji listesi         |

### Mattermost

Mattermost bir Plugin olarak gelir: `openclaw plugins install @openclaw/mattermost`.

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
        // Reverse proxy/genel dağıtımlar için isteğe bağlı açık URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Sohbet modları: `oncall` (@-mention olduğunda yanıt ver, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici önekle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath`, tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözülmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel slash callback'leri, Mattermost tarafından slash komut kaydı sırasında döndürülen komut başına belirteçlerle doğrulanır. Kayıt başarısız olursa veya hiçbir komut etkinleştirilmezse, OpenClaw callback'leri
  `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/iç callback host'ları için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` içinde callback host/domain değerinin yer almasını isteyebilir.
  Tam URL değil, host/domain değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan config yazımlarına izin ver veya engelle.
- `channels.mattermost.requireMention`: kanallarda yanıt vermeden önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme geçitlemesi geçersiz kılması (varsayılan için `"*"`).
- İsteğe bağlı `channels.mattermost.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // isteğe bağlı hesap bağlama
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

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitle.
- `channels.signal.configWrites`: Signal tarafından başlatılan config yazımlarına izin ver veya engelle.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### BlueBubbles

BlueBubbles, önerilen iMessage yoludur (Plugin desteklidir, `channels.bluebubbles` altında yapılandırılır).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls ve gelişmiş eylemler:
      // bkz. /channels/bluebubbles
    },
  },
}
```

- Burada kapsanan temel anahtar yolları: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- İsteğe bağlı `channels.bluebubbles.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, BlueBubbles konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde bir BlueBubbles handle'ı veya hedef dizeyi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).
- Tam BlueBubbles kanal yapılandırması [BlueBubbles](/tr/channels/bluebubbles) içinde belgelenmiştir.

### iMessage

OpenClaw, `imsg rpc` başlatır (stdio üzerinden JSON-RPC). Daemon veya port gerekmez.

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

- Messages veritabanı için Full Disk Access gerekir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath`, bir SSH sarmalayıcısını işaret edebilir; SCP eklerini almak için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı host anahtarı denetimi kullanır, bu yüzden relay host anahtarının zaten `~/.ssh/known_hosts` içinde bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan config yazımlarına izin ver veya engelle.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalize edilmiş bir handle veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH sarmalayıcı örneği">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix, Plugin desteklidir ve `channels.matrix` altında yapılandırılır.

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

- Belirteç kimlik doğrulaması `accessToken` kullanır; parola kimlik doğrulaması `userId` + `password` kullanır.
- `channels.matrix.proxy`, Matrix HTTP trafiğini açık bir HTTP(S) proxy üzerinden yönlendirir. Adlandırılmış hesaplar bunu `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/iç homeserver'lara izin verir. `proxy` ve bu ağ isteğe bağlı etkinleştirmesi birbirinden bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çoklu hesap kurulumlarında tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir, bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoin: "allowlist"` ile `autoJoinAllowlist` ayarlanmadıkça veya `autoJoin: "always"` yapılmadıkça yok sayılır.
- `channels.matrix.execApprovals`: Matrix'e özgü exec onay teslimatı ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek istiyorsanız atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlar içinde nasıl gruplanacağını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşır, `per-room` ise her DM odasını yalıtır.
- Matrix durum probe'ları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) içinde belgelenmiştir.

### Microsoft Teams

Microsoft Teams, Plugin desteklidir ve `channels.msteams` altında yapılandırılır.

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
- Tam Teams config'i (kimlik bilgileri, Webhook, DM/grup ilkesi, takım/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

### IRC

IRC, Plugin desteklidir ve `channels.irc` altında yapılandırılır.

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
- Tam IRC kanal yapılandırması (host/port/TLS/kanallar/izin listeleri/bahsetme geçitlemesi) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çoklu hesap (tüm kanallar)

Kanal başına birden fazla hesap çalıştırın (her biri kendi `accountId` değeriyle):

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

- `default`, `accountId` atlandığında kullanılır (CLI + yönlendirme).
- Ortam değişkeni belirteçleri yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir aracıya yönlendirmek için `bindings[].match.accountId` kullanın.
- Tek hesaplı üst düzey kanal config'i hâlâ yerindeyken `openclaw channels add` (veya kanal onboarding) ile varsayılan olmayan bir hesap eklerseniz, OpenClaw önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap eşlemesine yükseltir; böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix ise mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal kapsamlı bağlamalar (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix` de karışık şekilleri onarır; hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşır. Çoğu kanal `accounts.default` kullanır; Matrix ise mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme geçitlemesi

Grup mesajları varsayılan olarak **bahsetme gerektirir** (meta veri bahsetmesi veya güvenli regex desenleri). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

**Bahsetme türleri:**

- **Meta veri bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp self-chat modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Bahsetme geçitlemesi yalnızca algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya en az bir desen).

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

`messages.groupChat.historyLimit`, genel varsayılanı ayarlar. Kanallar bunu `channels.<channel>.historyLimit` ile geçersiz kılabilir (veya hesap başına). Devre dışı bırakmak için `0` ayarlayın.

#### DM geçmişi sınırları

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

Çözümleme: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü tutulur).

Desteklenenler: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chat modu

Self-chat modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin desenlerine yanıt verir):

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
    nativeSkills: "auto", // desteklendiğinde yerel Skill komutlarını kaydet
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

- Bu blok komut yüzeylerini yapılandırır. Geçerli yerleşik + paketle gelen komut kataloğu için bkz. [Slash Commands](/tr/tools/slash-commands).
- Bu sayfa bir **config anahtarı başvurusu**dur, tam komut kataloğu değildir. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar, kanal/Plugin sayfalarında ve [Slash Commands](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"`, Discord/Telegram için yerel komutları açar, Slack'i kapalı bırakır.
- `nativeSkills: "auto"`, Discord/Telegram için yerel Skills komutlarını açar, Slack'i kapalı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). `false`, daha önce kaydedilmiş komutları temizler.
- Yerel Skill kaydını kanal başına `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands`, Telegram bot menüsüne ek girdiler ekler.
- `bash: true`, host kabuğu için `! <cmd>` kullanımını etkinleştirir. `tools.elevated.enabled` gerekir ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olması gerekir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazımları ayrıca `operator.admin` gerektirir; salt okunur `/config show` ise normal write kapsamlı operator istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu config'i için `/mcp` komutunu etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına config mutasyonlarını geçitler (varsayılan: true).
- Çoklu hesap kanalları için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazımları da geçitler (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahip erişimli komutlar/araçlar için açık sahip izin listesidir. `allowFrom` değerinden ayrıdır.
- `ownerDisplay: "hash"`, sahip kimliklerini sistem prompt'unda hash'ler. Hash'lemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmamışsa komutların erişim grubu ilkelerini baypas etmesine izin verir.
- Komut belgeleri eşlemesi:
  - yerleşik + paketle gelen katalog: [Slash Commands](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleştirme komutları: [Eşleştirme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - memory Dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
