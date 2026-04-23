---
read_when:
    - Bir Feishu/Lark botu bağlamak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu botuna genel bakış, özellikler ve yapılandırma
title: Feishu
x-i18n:
    generated_at: "2026-04-23T08:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11bf136cecb26dc939c5e78e020c0e6aa3312d9f143af0cab7568743c728cf13
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark, ekiplerin sohbet ettiği, belge paylaştığı, takvimleri yönettiği ve birlikte iş yaptığı hepsi bir arada bir iş birliği platformudur.

**Durum:** bot DM'leri ve grup sohbetleri için üretime hazır. Varsayılan mod WebSocket'tir; webhook modu isteğe bağlıdır.

---

## Hızlı başlangıç

> **OpenClaw 2026.4.10 veya üzerini gerektirir.** Kontrol etmek için `openclaw --version` çalıştırın. `openclaw update` ile yükseltin.

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Otomatik olarak bir Feishu/Lark botu oluşturmak için QR kodunu Feishu/Lark mobil uygulamanızla tarayın.
  </Step>
  
  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için Gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Erişim denetimi

### Doğrudan mesajlar

Bot'a kimlerin DM gönderebileceğini denetlemek için `dmPolicy` yapılandırın:

- `"pairing"` — bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` — yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir (varsayılan: yalnızca bot sahibi)
- `"open"` — tüm kullanıcılara izin ver
- `"disabled"` — tüm DM'leri devre dışı bırak

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Grup sohbetleri

**Grup ilkesi** (`channels.feishu.groupPolicy`):

| Value         | Davranış                                 |
| ------------- | ---------------------------------------- |
| `"open"`      | Gruplardaki tüm mesajlara yanıt ver      |
| `"allowlist"` | Yalnızca `groupAllowFrom` içindeki gruplara yanıt ver |
| `"disabled"`  | Tüm grup mesajlarını devre dışı bırak    |

Varsayılan: `allowlist`

**Bahsetme gereksinimi** (`channels.feishu.requireMention`):

- `true` — @bahsetme gerekli (varsayılan)
- `false` — @bahsetme olmadan yanıt ver
- Grup başına geçersiz kılma: `channels.feishu.groups.<chat_id>.requireMention`

---

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @bahsetme gerekmesin

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Tüm gruplara izin ver, yine de @bahsetme gerekli olsun

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Yalnızca belirli gruplara izin ver

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Grup kimlikleri şu şekilde görünür: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Bir grup içindeki gönderenleri kısıtla

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Kullanıcı open_id değerleri şu şekilde görünür: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Grup/kullanıcı kimliklerini alın

### Grup kimlikleri (`chat_id`, biçim: `oc_xxx`)

Grubu Feishu/Lark içinde açın, sağ üst köşedeki menü simgesine tıklayın ve **Settings** bölümüne gidin. Grup kimliği (`chat_id`) ayarlar sayfasında listelenir.

![Grup Kimliğini Al](/images/feishu-get-group-id.png)

### Kullanıcı kimlikleri (`open_id`, biçim: `ou_xxx`)

Gateway'i başlatın, bota bir DM gönderin, ardından günlükleri kontrol edin:

```bash
openclaw logs --follow
```

Günlük çıktısında `open_id` ifadesini arayın. Bekleyen eşleştirme isteklerini de kontrol edebilirsiniz:

```bash
openclaw pairing list feishu
```

---

## Yaygın komutlar

| Command   | Açıklama                    |
| --------- | --------------------------- |
| `/status` | Bot durumunu göster         |
| `/reset`  | Geçerli oturumu sıfırla     |
| `/model`  | AI modelini göster veya değiştir |

> Feishu/Lark yerel slash komut menülerini desteklemez, bu yüzden bunları düz metin mesajları olarak gönderin.

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Botu @etiketlediğinizden emin olun (varsayılan olarak gereklidir)
3. `groupPolicy` değerinin `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Botun Feishu Open Platform / Lark Developer içinde yayımlandığından ve onaylandığından emin olun
2. Etkinlik aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **persistent connection** (WebSocket) seçili olduğundan emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### App Secret sızdırıldı

1. App Secret değerini Feishu Open Platform / Lark Developer içinde sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

---

## Gelişmiş yapılandırma

### Birden çok hesap

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Birincil bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Yedek bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`, giden API'ler bir `accountId` belirtmediğinde hangi hesabın kullanılacağını denetler.

### Mesaj sınırları

- `textChunkLimit` — giden metin parça boyutu (varsayılan: `2000` karakter)
- `mediaMaxMb` — medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar aracılığıyla akış yanıtlarını destekler. Etkinleştirildiğinde bot, metin üretirken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // akış kartı çıktısını etkinleştir (varsayılan: true)
      blockStreaming: true, // blok düzeyinde akışı etkinleştir (varsayılan: true)
    },
  },
}
```

Tam yanıtı tek bir mesajda göndermek için `streaming: false` ayarlayın.

### Kota optimizasyonu

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderen profil sorgularını atlamak için `false` ayarlayın

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP oturumları

Feishu/Lark, DM'ler ve grup ileti dizisi mesajları için ACP'yi destekler. Feishu/Lark ACP, metin komutlarıyla çalışır — yerel slash komut menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşmada kullanın.

#### Kalıcı ACP bağlama

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Sohbetten ACP başlatma

Bir Feishu/Lark DM'sinde veya ileti dizisinde:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark ileti dizisi mesajları için çalışır. Bağlı konuşmadaki devam mesajları doğrudan o ACP oturumuna yönlendirilir.

### Çoklu agent yönlendirme

Feishu/Lark DM'lerini veya gruplarını farklı agent'lara yönlendirmek için `bindings` kullanın.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Yönlendirme alanları:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) veya `"group"` (grup sohbeti)
- `match.peer.id`: kullanıcı Open ID'si (`ou_xxx`) veya grup kimliği (`oc_xxx`)

Arama ipuçları için [Grup/kullanıcı kimliklerini alın](#get-groupuser-ids) bölümüne bakın.

---

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Setting                                           | Açıklama                                  | Varsayılan       |
| ------------------------------------------------- | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanalı etkinleştir/devre dışı bırak       | `true`           |
| `channels.feishu.domain`                          | API alanı (`feishu` veya `lark`)          | `feishu`         |
| `channels.feishu.connectionMode`                  | Olay taşıma yöntemi (`websocket` veya `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Giden yönlendirme için varsayılan hesap   | `default`        |
| `channels.feishu.verificationToken`               | Webhook modu için gereklidir              | —                |
| `channels.feishu.encryptKey`                      | Webhook modu için gereklidir              | —                |
| `channels.feishu.webhookPath`                     | Webhook rota yolu                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bağlama ana makinesi              | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bağlama portu                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | Hesap başına alan geçersiz kılma          | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM ilkesi                                 | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM izin listesi (`open_id` listesi)       | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Grup ilkesi                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Grup izin listesi                         | —                |
| `channels.feishu.requireMention`                  | Gruplarda @etiketlemeyi gerektir          | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Grup başına @etiketleme geçersiz kılma    | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Belirli bir grubu etkinleştir/devre dışı bırak | `true`      |
| `channels.feishu.textChunkLimit`                  | Mesaj parça boyutu                        | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Medya boyutu sınırı                       | `30`             |
| `channels.feishu.streaming`                       | Akış kartı çıktısı                        | `true`           |
| `channels.feishu.blockStreaming`                  | Blok düzeyinde akış                       | `true`           |
| `channels.feishu.typingIndicator`                 | Yazıyor tepkileri gönder                  | `true`           |
| `channels.feishu.resolveSenderNames`              | Gönderen görünen adlarını çözümle         | `true`           |

---

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (post)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Çıkartmalar

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dahil)
- ⚠️ Zengin metin (post tarzı biçimlendirme; Feishu/Lark'ın tüm yazım özelliklerini desteklemez)

### İleti dizileri ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ İleti dizisi yanıtları
- ✅ Medya yanıtları, bir ileti dizisi mesajına yanıt verirken ileti dizisi farkındalığını korur

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
