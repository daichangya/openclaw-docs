---
read_when:
    - '`/new`, `/reset`, `/stop` ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz'
    - Hook'ları oluşturmak, kurmak veya hata ayıklamak istiyorsunuz
summary: 'Hook''lar: komutlar ve yaşam döngüsü olayları için olay güdümlü otomasyon'
title: Hook'lar
x-i18n:
    generated_at: "2026-04-21T08:56:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hook'lar

Hook'lar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, yalnızca hook'ları etkinleştirdikten veya en az bir hook girdisi, hook paketi, eski işleyici ya da ek hook dizini yapılandırdıktan sonra dahili hook'ları yükler.

OpenClaw'da iki tür hook vardır:

- **Dahili hook'lar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi ajan olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhook'lar**: diğer sistemlerin OpenClaw içinde iş tetiklemesine olanak tanıyan harici HTTP uç noktalarıdır. Bkz. [Webhook'lar](/tr/automation/cron-jobs#webhooks).

Hook'lar plugin'lerin içine de paketlenebilir. `openclaw hooks list`, hem bağımsız hook'ları hem de plugin tarafından yönetilen hook'ları gösterir.

## Hızlı başlangıç

```bash
# Kullanılabilir hook'ları listele
openclaw hooks list

# Bir hook'u etkinleştir
openclaw hooks enable session-memory

# Hook durumunu kontrol et
openclaw hooks check

# Ayrıntılı bilgi al
openclaw hooks info session-memory
```

## Olay türleri

| Olay                     | Ne zaman tetiklenir                             |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                      |
| `command:reset`          | `/reset` komutu verildiğinde                    |
| `command:stop`           | `/stop` komutu verildiğinde                     |
| `command`                | Herhangi bir komut olayı (genel dinleyici)      |
| `session:compact:before` | Compaction geçmişi özetlemeden önce             |
| `session:compact:after`  | Compaction tamamlandıktan sonra                 |
| `session:patch`          | Oturum özellikleri değiştirildiğinde            |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları eklenmeden önce |
| `gateway:startup`        | Kanallar başladıktan ve hook'lar yüklendikten sonra |
| `message:received`       | Herhangi bir kanaldan gelen mesaj               |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra        |
| `message:preprocessed`   | Tüm medya ve bağlantı anlama işlemleri tamamlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                  |

## Hook yazma

### Hook yapısı

Her hook, iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Meta veriler + dokümantasyon
└── handler.ts       # İşleyici uygulaması
```

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Bu hook'un ne yaptığının kısa açıklaması"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Hook'um

Ayrıntılı dokümantasyon buraya gelir.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                            |
| ---------- | --------------------------------------------------- |
| `emoji`    | CLI için görüntülenecek emoji                       |
| `events`   | Dinlenecek olayların dizisi                         |
| `export`   | Kullanılacak adlandırılmış export (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (ör. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atla (boolean)               |
| `install`  | Kurulum yöntemleri                                  |

### İşleyici uygulaması

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Mantığınız burada

  // İsteğe bağlı olarak kullanıcıya mesaj gönder
  event.messages.push("Hook executed!");
};

export default handler;
```

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veriler).

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` ( `senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yalnızca ayrıcalıklı istemciler yama olaylarını tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after` buna ek olarak `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` içerir.

## Hook keşfi

Hook'lar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş hook'lar**: OpenClaw ile birlikte gelir
2. **Plugin hook'ları**: kurulu plugin'lerin içinde paketlenmiş hook'lar
3. **Yönetilen hook'lar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulan, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı hook'ları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı hook'ları yeni hook adları ekleyebilir, ancak aynı ada sahip paketlenmiş, yönetilen veya plugin tarafından sağlanan hook'ları geçersiz kılamaz.

Gateway, dahili hook'lar yapılandırılana kadar başlangıçta dahili hook keşfini atlar. Paketlenmiş veya yönetilen bir hook'u `openclaw hooks enable <name>` ile etkinleştirin, bir hook paketi kurun veya dahil olmayı seçmek için `hooks.internal.enabled=true` ayarlayın. Adlandırılmış tek bir hook'u etkinleştirdiğinizde Gateway yalnızca o hook'un işleyicisini yükler; `hooks.internal.enabled=true`, ek hook dizinleri ve eski işleyiciler geniş kapsamlı keşfi etkinleştirir.

### Hook paketleri

Hook paketleri, `package.json` içinde `openclaw.hooks` aracılığıyla hook export eden npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm spec'leri yalnızca registry içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya spec'leri ve semver aralıkları reddedilir.

## Paketlenmiş hook'lar

| Hook                  | Olaylar                        | Ne yapar                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob desenlerinden ek bootstrap dosyaları ekler       |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır             |

Herhangi bir paketlenmiş hook'u etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı slug'ı oluşturur ve `<workspace>/memory/YYYY-MM-DD-slug.md` konumuna kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files yapılandırması

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Yollar çalışma alanına göre çözülür. Yalnızca tanınan bootstrap temel adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` dosyasına kaydeder.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanındaki `BOOT.md` dosyasını çalıştırır.

## Plugin hook'ları

Plugin'ler, daha derin entegrasyon için Plugin SDK üzerinden hook kaydedebilir: araç çağrılarını yakalama, prompt'ları değiştirme, mesaj akışını kontrol etme ve daha fazlası. Plugin SDK; model çözümleme, ajan yaşam döngüsü, mesaj akışı, araç yürütme, alt ajan koordinasyonu ve gateway yaşam döngüsünü kapsayan 28 hook sunar.

`before_tool_call`, `before_agent_reply`, `before_install` ve diğer tüm plugin hook'ları dahil tam plugin hook başvurusu için bkz. [Plugin Mimarisi](/tr/plugins/architecture#provider-runtime-hooks).

## Yapılandırma

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Hook başına ortam değişkenleri:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Ek hook dizinleri:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenmektedir, ancak yeni hook'lar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI başvurusu

```bash
# Tüm hook'ları listele (`--eligible`, `--verbose` veya `--json` ekleyin)
openclaw hooks list

# Bir hook hakkında ayrıntılı bilgi göster
openclaw hooks info <hook-name>

# Uygunluk özetini göster
openclaw hooks check

# Etkinleştir/devre dışı bırak
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## En iyi uygulamalar

- **İşleyicileri hızlı tutun.** Hook'lar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile fire-and-forget olarak başlatın.
- **Hataları zarif şekilde ele alın.** Riskli işlemleri try/catch ile sarın; diğer işleyiciler çalışabilsin diye hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylem ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Hook keşfedilmiyor

```bash
# Dizin yapısını doğrulayın
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermelidir: HOOK.md, handler.ts

# Keşfedilen tüm hook'ları listeleyin
openclaw hooks list
```

### Hook uygun değil

```bash
openclaw hooks info my-hook
```

Eksik binary'leri (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Hook yürütülmüyor

1. Hook'un etkin olduğunu doğrulayın: `openclaw hooks list`
2. Hook'ların yeniden yüklenmesi için gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Başvurusu: hooks](/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin Mimarisi](/tr/plugins/architecture#provider-runtime-hooks) — tam plugin hook başvurusu
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
