---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırma'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
summary: OpenClaw kanal konuşmalarını MCP üzerinden sunun ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-04-23T09:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` iki iş yapar:

- `openclaw mcp serve` ile OpenClaw'u bir MCP sunucusu olarak çalıştırmak
- `list`, `show`,
  `set` ve `unset` ile OpenClaw'un sahip olduğu giden MCP sunucu tanımlarını yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'un bir MCP sunucusu olarak davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'un daha sonra çalışma zamanlarının tüketebileceği diğer MCP sunucuları için
  istemci tarafı bir kayıt defteri olarak davranmasıdır

OpenClaw'un bir coding harness
oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde
[`openclaw acp`](/tr/cli/acp) kullanın.

## OpenClaw'un MCP sunucusu olarak çalışması

Bu, `openclaw mcp serve` yoludur.

## `serve` ne zaman kullanılır

Şu durumlarda `openclaw mcp serve` kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi
  OpenClaw destekli kanal konuşmalarıyla doğrudan konuşacaksa
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'iniz zaten varsa
- kanal başına ayrı köprüler çalıştırmak yerine OpenClaw'un kanal arka uçları arasında çalışan
  tek bir MCP sunucusu istiyorsanız

OpenClaw'un coding
çalışma zamanını kendisinin barındırması ve agent oturumunu OpenClaw içinde tutması gerektiğinde bunun yerine [`openclaw acp`](/tr/cli/acp) kullanın.

## Nasıl çalışır

`openclaw mcp serve`, stdio MCP sunucusu başlatır. MCP istemcisi bu
sürecin sahibidir. İstemci stdio oturumunu açık tuttuğu sürece köprü, yerel veya uzak bir OpenClaw Gateway'e
WebSocket üzerinden bağlanır ve yönlendirilmiş kanal
konuşmalarını MCP üzerinden sunar.

Yaşam döngüsü:

1. MCP istemcisi `openclaw mcp serve` sürecini başlatır
2. köprü Gateway'e bağlanır
3. yönlendirilmiş oturumlar MCP konuşmaları ve transcript/geçmiş araçları haline gelir
4. köprü bağlıyken canlı olaylar bellekte kuyruğa alınır
5. Claude kanal modu etkinse aynı oturum
   Claude'a özgü anlık bildirimleri de alabilir

Önemli davranışlar:

- canlı kuyruk durumu köprü bağlandığında başlar
- daha eski transcript geçmişi `messages_read` ile okunur
- Claude anlık bildirimleri yalnızca MCP oturumu canlıyken vardır
- istemci bağlantıyı kestiğinde köprü çıkar ve canlı kuyruk kaybolur
- OpenClaw tarafından başlatılan stdio MCP sunucuları (paketli veya kullanıcı yapılandırmalı),
  kapatma sırasında bir süreç ağacı olarak kapatılır; böylece
  sunucu tarafından başlatılan alt süreçler, üst stdio istemcisi çıktıktan sonra yaşamaz
- bir oturumu silmek veya sıfırlamak, o oturumun MCP istemcilerini
  paylaşılan çalışma zamanı temizleme yolu üzerinden sonlandırır; böylece
  kaldırılmış bir oturuma bağlı kalan stdio bağlantıları olmaz

## Bir istemci modu seçin

Aynı köprüyü iki farklı şekilde kullanın:

- Genel MCP istemcileri: yalnızca standart MCP araçları. `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` ve
  onay araçlarını kullanın.
- Claude Code: standart MCP araçları artı Claude'a özgü kanal bağdaştırıcısı.
  `--claude-channel-mode on` etkinleştirin veya varsayılan `auto` değerini bırakın.

Bugün `auto`, `on` ile aynı davranır. Henüz istemci yetenek algılama yoktur.

## `serve` neleri sunar

Köprü, kanal destekli
konuşmaları sunmak için mevcut Gateway oturum yönlendirme meta verilerini kullanır. Bir konuşma, OpenClaw zaten aşağıdakiler gibi bilinen bir rotaya sahip oturum durumuna sahip olduğunda görünür:

- `channel`
- alıcı veya hedef meta verileri
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sağlar:

- son yönlendirilmiş konuşmaları listeleme
- son transcript geçmişini okuma
- yeni gelen olayları bekleme
- aynı rota üzerinden yanıt gönderme
- köprü bağlıyken gelen onay isteklerini görme

## Kullanım

```bash
# Yerel Gateway
openclaw mcp serve

# Uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Parola kimlik doğrulamalı uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ayrıntılı köprü günlüklerini etkinleştir
openclaw mcp serve --verbose

# Claude'a özgü anlık bildirimleri devre dışı bırak
openclaw mcp serve --claude-channel-mode off
```

## Köprü araçları

Mevcut köprü şu MCP araçlarını sunar:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gateway oturum durumunda zaten rota meta verilerine sahip
oturum destekli son konuşmaları listeler.

Yararlı filtreler:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Bir konuşmayı `session_key` ile döndürür.

### `messages_read`

Bir oturum destekli konuşma için son transcript mesajlarını okur.

### `attachments_fetch`

Bir transcript mesajından metin dışı mesaj içerik bloklarını çıkarır. Bu,
bağımsız dayanıklı bir ek blob deposu değil, transcript içeriği üzerinde bir
meta veri görünümüdür.

### `events_poll`

Sayısal bir imleçten itibaren kuyruğa alınmış canlı olayları okur.

### `events_wait`

Bir sonraki eşleşen kuyruğa alınmış olay gelene veya zaman aşımı dolana kadar
uzun yoklama yapar.

Genel bir MCP istemcisi Claude'a özgü bir anlık bildirim protokolü olmadan
gerçek zamana yakın teslimat gerektirdiğinde bunu kullanın.

### `messages_send`

Metni, oturumda zaten kaydedilmiş aynı rota üzerinden geri gönderir.

Geçerli davranış:

- mevcut bir konuşma rotası gerektirir
- oturumun kanalını, alıcısını, hesap kimliğini ve thread kimliğini kullanır
- yalnızca metin gönderir

### `permissions_list_open`

Gateway'e bağlandığından beri köprünün gözlemlediği bekleyen exec/plugin onay
isteklerini listeler.

### `permissions_respond`

Bekleyen bir exec/plugin onay isteğini şu seçeneklerden biriyle çözer:

- `allow-once`
- `allow-always`
- `deny`

## Olay modeli

Köprü, bağlı olduğu sürece bellekte bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Önemli sınırlamalar:

- kuyruk yalnızca canlıdır; MCP köprüsü başladığında başlar
- `events_poll` ve `events_wait`, daha eski Gateway geçmişini
  kendiliğinden yeniden oynatmaz
- dayanıklı geçmiş `messages_read` ile okunmalıdır

## Claude kanal bildirimleri

Köprü, Claude'a özgü kanal bildirimlerini de sunabilir. Bu,
Claude Code kanal bağdaştırıcısının OpenClaw eşdeğeridir: standart MCP araçları kullanılabilir olmaya devam eder, ancak canlı gelen mesajlar Claude'a özgü MCP bildirimleri olarak da gelebilir.

Bayraklar:

- `--claude-channel-mode off`: yalnızca standart MCP araçları
- `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştirir
- `--claude-channel-mode auto`: mevcut varsayılan; `on` ile aynı köprü davranışı

Claude kanal modu etkin olduğunda sunucu, Claude deneysel
yeteneklerini duyurur ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli köprü davranışı:

- gelen `user` transcript mesajları
  `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse, köprü
  bunu `notifications/claude/channel/permission` biçimine dönüştürür
- bu bildirimler yalnızca canlı oturum içindir; MCP istemcisi bağlantıyı keserse
  anlık bildirim hedefi kalmaz

Bu bilerek istemciye özeldir. Genel MCP istemcileri standart yoklama araçlarına güvenmelidir.

## MCP istemci yapılandırması

Örnek stdio istemci yapılandırması:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Çoğu genel MCP istemcisi için standart araç yüzeyiyle başlayın ve
Claude modunu yok sayın. Claude modunu yalnızca Claude'a özgü bildirim
yöntemlerini gerçekten anlayan istemciler için açın.

## Seçenekler

`openclaw mcp serve` şunları destekler:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway token'ı
- `--token-file <path>`: token'ı dosyadan okur
- `--password <password>`: Gateway parolası
- `--password-file <path>`: parolayı dosyadan okur
- `--claude-channel-mode <auto|on|off>`: Claude bildirim modu
- `-v`, `--verbose`: stderr üzerinde ayrıntılı günlükler

Mümkün olduğunda satır içi sırlar yerine `--token-file` veya `--password-file` tercih edin.

## Güvenlik ve güven sınırı

Köprü, yönlendirme icat etmez. Yalnızca Gateway'in
zaten nasıl yönlendireceğini bildiği konuşmaları sunar.

Bu şu anlama gelir:

- gönderici allowlist'leri, eşleştirme ve kanal düzeyi güven hâlâ
  alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut kayıtlı bir rota üzerinden yanıt verebilir
- onay durumu yalnızca geçerli köprü oturumu için canlı/bellek içindedir
- köprü kimlik doğrulaması, diğer herhangi bir uzak Gateway istemcisi için
  güveneceğiniz aynı Gateway token veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde eksikse, olağan neden MCP yapılandırması değildir.
Sorun, alttaki Gateway oturumunda eksik veya tamamlanmamış rota meta verileridir.

## Test

OpenClaw bu köprü için deterministik bir Docker smoke testiyle gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi şunları yapar:

- tohumlanmış bir Gateway container'ı başlatır
- `openclaw mcp serve` başlatan ikinci bir container başlatır
- konuşma keşfini, transcript okumalarını, ek meta veri okumalarını,
  canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, test çalıştırmasına gerçek bir
Telegram, Discord veya iMessage hesabı bağlamadan köprünün çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Testing](/tr/help/testing).

## Sorun giderme

### Hiç konuşma döndürülmüyor

Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki
oturumun kayıtlı kanal/provider, alıcı ve isteğe bağlı
hesap/thread rota meta verilerine sahip olduğunu doğrulayın.

### `events_poll` veya `events_wait` eski mesajları kaçırıyor

Beklenen durum. Canlı kuyruk köprü bağlandığında başlar. Daha eski transcript
geçmişini `messages_read` ile okuyun.

### Claude bildirimleri görünmüyor

Şunların hepsini kontrol edin:

- istemci stdio MCP oturumunu açık tuttu
- `--claude-channel-mode`, `on` veya `auto`
- istemci gerçekten Claude'a özgü bildirim yöntemlerini anlıyor
- gelen mesaj köprü bağlandıktan sonra gerçekleşti

### Onaylar eksik

`permissions_list_open`, yalnızca köprü
bağlıyken gözlemlenen onay isteklerini gösterir. Dayanıklı bir onay geçmişi API'si değildir.

## OpenClaw'un MCP istemci kayıt defteri olarak çalışması

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'u MCP üzerinden sunmaz. OpenClaw
yapılandırmasındaki `mcp.servers` altında OpenClaw'un sahip olduğu MCP sunucu
tanımlarını yönetir.

Bu kayıtlı tanımlar, OpenClaw'un daha sonra başlattığı veya yapılandırdığı
gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi çalışma zamanları içindir. OpenClaw tanımları merkezi olarak saklar; böylece bu çalışma zamanlarının kendi yinelenen
MCP sunucu listelerini tutması gerekmez.

Önemli davranışlar:

- bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
- hedef MCP sunucusuna bağlanmazlar
- komutun, URL'nin veya uzak taşımanın
  şu anda erişilebilir olup olmadığını doğrulamazlar
- çalışma zamanı bağdaştırıcıları, yürütme zamanında hangi taşıma biçimlerini gerçekten desteklediklerine
  karar verir
- gömülü Pi, yapılandırılmış MCP araçlarını normal `coding` ve `messaging`
  araç profillerinde sunar; `minimal` bunları yine gizler ve `tools.deny: ["bundle-mcp"]`
  bunları açıkça devre dışı bırakır

## Kayıtlı MCP sunucu tanımları

OpenClaw ayrıca OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için
yapılandırmada hafif bir MCP sunucu kayıt defteri saklar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- `show`, ad olmadan tam yapılandırılmış MCP sunucu nesnesini yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `unset`, adlı sunucu yoksa başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Örnek yapılandırma biçimi:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio taşıması

Yerel bir alt süreç başlatır ve stdin/stdout üzerinden iletişim kurar.

| Alan                       | Açıklama                           |
| -------------------------- | ---------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı bağımsız değişkenleri dizisi |
| `env`                      | Ek ortam değişkenleri              |
| `cwd` / `workingDirectory` | Süreç için çalışma dizini          |

#### Stdio env güvenlik filtresi

OpenClaw, bir stdio MCP sunucusunun ilk RPC'den önce nasıl başlatıldığını değiştirebilen yorumlayıcı başlangıç env anahtarlarını, bir sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` ve benzeri çalışma zamanı denetim değişkenleri bulunur. Başlatma bu anahtarları yapılandırma hatasıyla reddeder; böylece örtük bir ön hazırlık enjekte edemez, yorumlayıcıyı değiştiremez veya stdio sürecine karşı hata ayıklayıcı etkinleştiremezler. Normal kimlik bilgisi, proxy ve sunucuya özgü env değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuzun gerçekten engellenen değişkenlerden birine ihtiyacı varsa, bunu stdio sunucusunun `env` alanı altında değil, Gateway host sürecinde ayarlayın.

### SSE / HTTP taşıması

Uzak bir MCP sunucusuna HTTP Server-Sent Events üzerinden bağlanır.

| Alan                  | Açıklama                                                        |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                 |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama token'ları) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı) |

Örnek:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` içindeki hassas değerler (userinfo) ve `headers`, günlüklerde ve
durum çıktısında sansürlenir.

### Streamable HTTP taşıması

`streamable-http`, `sse` ve `stdio` yanında ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                  | Açıklama                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                           |
| `transport`           | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlayın; atlandığında OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP üstbilgileri anahtar-değer eşlemi (örneğin kimlik doğrulama token'ları) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                           |

Örnek:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Bu komutlar yalnızca kayıtlı yapılandırmayı yönetir. Kanal köprüsünü başlatmaz,
canlı bir MCP istemci oturumu açmaz veya hedef sunucunun erişilebilir olduğunu kanıtlamaz.

## Geçerli sınırlamalar

Bu sayfa köprüyü bugün sunulduğu haliyle belgeler.

Geçerli sınırlamalar:

- konuşma keşfi, mevcut Gateway oturum rota meta verilerine bağlıdır
- Claude'a özgü bağdaştırıcının ötesinde genel bir push protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yoktur
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoklanmış upstream yoktur
- `permissions_list_open`, yalnızca köprü bağlıyken gözlemlenen onayları içerir
