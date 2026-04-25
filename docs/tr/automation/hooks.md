---
read_when:
    - '`/new`, `/reset`, `/stop` ve aracı yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz'
    - Kancalar oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay güdümlü otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-04-25T13:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

Kancalar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, yalnızca kancaları etkinleştirdikten veya en az bir kanca girdisi, hook pack, eski işleyici ya da ek kanca dizini yapılandırdıktan sonra dahili kancaları yükler.

OpenClaw içinde iki tür kanca vardır:

- **Dahili kancalar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi aracı olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw içinde iş tetiklemesine olanak tanıyan harici HTTP uç noktalarıdır. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Kancalar ayrıca Plugin'lerin içinde paketlenmiş olarak da gelebilir. `openclaw hooks list`, hem bağımsız kancaları hem de Plugin tarafından yönetilen kancaları gösterir.

## Hızlı başlangıç

```bash
# Kullanılabilir kancaları listele
openclaw hooks list

# Bir kancayı etkinleştir
openclaw hooks enable session-memory

# Kanca durumunu kontrol et
openclaw hooks check

# Ayrıntılı bilgi al
openclaw hooks info session-memory
```

## Olay türleri

| Olay                     | Ne zaman tetiklenir                              |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new` komutu verildiğinde                       |
| `command:reset`          | `/reset` komutu verildiğinde                     |
| `command:stop`           | `/stop` komutu verildiğinde                      |
| `command`                | Herhangi bir komut olayı (genel dinleyici)       |
| `session:compact:before` | Compaction geçmişi özetlemeden önce              |
| `session:compact:after`  | Compaction tamamlandıktan sonra                  |
| `session:patch`          | Oturum özellikleri değiştirildiğinde             |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları eklenmeden önce |
| `gateway:startup`        | Kanallar başladıktan ve kancalar yüklendikten sonra |
| `message:received`       | Herhangi bir kanaldan gelen mesaj                |
| `message:transcribed`    | Ses yazıya dökme tamamlandıktan sonra            |
| `message:preprocessed`   | Tüm medya ve bağlantı anlama işlemleri tamamlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                   |

## Kanca yazma

### Kanca yapısı

Her kanca, iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Meta veriler + belgeler
└── handler.ts       # İşleyici uygulaması
```

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Bu kancanın ne yaptığının kısa açıklaması"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Ayrıntılı belgeler buraya gelir.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                            |
| ---------- | --------------------------------------------------- |
| `emoji`    | CLI için görüntü emojisi                            |
| `events`   | Dinlenecek olayların dizisi                         |
| `export`   | Kullanılacak adlı dışa aktarım (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)    |
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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veriler). Aracı ve araç Plugin kanca bağlamları ayrıca, Plugin'lerin OTEL korelasyonu için yapılandırılmış günlüklerde aktarabileceği, salt okunur W3C uyumlu tanılama izleme bağlamı olan `trace` öğesini de içerebilir.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` ( `senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (nihai zenginleştirilmiş içerik), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yalnızca ayrıcalıklı istemciler yama olaylarını tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after` buna ek olarak `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

## Kanca keşfi

Kancalar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş kancalar**: OpenClaw ile birlikte gelir
2. **Plugin kancaları**: yüklü Plugin'lerin içine paketlenmiş kancalar
3. **Yönetilen kancalar**: `~/.openclaw/hooks/` (kullanıcı tarafından yüklenen, çalışma alanıkları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı kancaları**: `<workspace>/hooks/` (aracı başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı kancaları yeni kanca adları ekleyebilir ancak aynı ada sahip paketlenmiş, yönetilen veya Plugin tarafından sağlanan kancaları geçersiz kılamaz.

Gateway, dahili kancalar yapılandırılana kadar başlangıçta dahili kanca keşfini atlar. `openclaw hooks enable <name>` ile paketlenmiş ya da yönetilen bir kancayı etkinleştirin, bir hook pack yükleyin veya katılmak için `hooks.internal.enabled=true` ayarlayın. Adlandırılmış tek bir kancayı etkinleştirdiğinizde, Gateway yalnızca o kancanın işleyicisini yükler; `hooks.internal.enabled=true`, ek kanca dizinleri ve eski işleyiciler ise geniş kapsamlı keşfe katılmayı sağlar.

### Hook pack'ler

Hook pack'ler, `package.json` içinde `openclaw.hooks` aracılığıyla kancaları dışa aktaran npm paketleridir. Şununla yükleyin:

```bash
openclaw plugins install <path-or-spec>
```

Npm özellikleri yalnızca registry içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/file özellikleri ve semver aralıkları reddedilir.

## Paketlenmiş kancalar

| Kanca                 | Olaylar                        | Ne yapar                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob kalıplarından ek bootstrap dosyaları ekler       |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır             |

Herhangi bir paketlenmiş kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı slug'ı üretir ve `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözülür. Yalnızca tanınan bootstrap temel dosya adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` dosyasına kaydeder.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanındaki `BOOT.md` dosyasını çalıştırır.

## Plugin kancaları

Plugin'ler, daha derin entegrasyon için Plugin SDK aracılığıyla türlenmiş kancalar kaydedebilir:
araç çağrılarını kesme, prompt'ları değiştirme, mesaj akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`,
`before_install` veya işlem içi diğer yaşam döngüsü kancalarına ihtiyacınız olduğunda Plugin kancalarını kullanın.

Plugin kancalarının tam başvuru kaynağı için bkz. [Plugin hooks](/tr/plugins/hooks).

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

Kanca başına ortam değişkenleri:

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

Ek kanca dizinleri:

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
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenmektedir, ancak yeni kancalar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI başvurusu

```bash
# Tüm kancaları listele (--eligible, --verbose veya --json ekleyin)
openclaw hooks list

# Bir kanca hakkında ayrıntılı bilgi göster
openclaw hooks info <hook-name>

# Uygunluk özetini göster
openclaw hooks check

# Etkinleştir/devre dışı bırak
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## En iyi uygulamalar

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile arka planda tetikleyip bırakın.
- **Hataları zarif biçimde ele alın.** Riskli işlemleri try/catch içine alın; diğer işleyicilerin çalışabilmesi için hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Kanca keşfedilmedi

```bash
# Dizin yapısını doğrulayın
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermelidir: HOOK.md, handler.ts

# Keşfedilen tüm kancaları listeleyin
openclaw hooks list
```

### Kanca uygun değil

```bash
openclaw hooks info my-hook
```

Eksik binary'leri (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Kanca çalışmıyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için Gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Reference: hooks](/tr/cli/hooks)
- [Webhooks](/tr/automation/cron-jobs#webhooks)
- [Plugin hooks](/tr/plugins/hooks) — işlem içi Plugin yaşam döngüsü kancaları
- [Configuration](/tr/gateway/configuration-reference#hooks)
