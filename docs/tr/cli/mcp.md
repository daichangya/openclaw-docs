---
read_when:
    - Codex, Claude Code veya başka bir MCP istemcisini OpenClaw destekli kanallara bağlama
    - '`openclaw mcp serve` çalıştırma'
    - OpenClaw tarafından kaydedilen MCP sunucu tanımlarını yönetme
summary: OpenClaw kanal konuşmalarını MCP üzerinden kullanıma açın ve kaydedilmiş MCP sunucu tanımlarını yönetin
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` iki iş yapar:

- `openclaw mcp serve` ile OpenClaw'u bir MCP sunucusu olarak çalıştırmak
- `list`, `show`,
  `set` ve `unset` ile OpenClaw'a ait giden MCP sunucu tanımlarını yönetmek

Başka bir deyişle:

- `serve`, OpenClaw'un bir MCP sunucusu olarak davranmasıdır
- `list` / `show` / `set` / `unset`, OpenClaw'un daha sonra çalışma zamanlarının tüketebileceği diğer MCP sunucuları için istemci tarafı bir MCP kayıt defteri olarak davranmasıdır

OpenClaw'un bir kodlama harness
oturumunu kendisinin barındırması ve bu çalışma zamanını ACP üzerinden yönlendirmesi gerektiğinde [`openclaw acp`](/tr/cli/acp) kullanın.

## OpenClaw'u bir MCP sunucusu olarak kullanma

Bu, `openclaw mcp serve` yoludur.

## `serve` ne zaman kullanılmalı

Şu durumlarda `openclaw mcp serve` kullanın:

- Codex, Claude Code veya başka bir MCP istemcisi doğrudan
  OpenClaw destekli kanal konuşmalarıyla konuşacaksa
- yönlendirilmiş oturumlara sahip yerel veya uzak bir OpenClaw Gateway'niz zaten varsa
- kanal başına ayrı bridge'ler çalıştırmak yerine OpenClaw'un kanal backend'leri genelinde çalışan tek bir MCP sunucusu istiyorsanız

Bunun yerine, OpenClaw kodlama
çalışma zamanını kendisi barındıracaksa ve ajan oturumunu OpenClaw içinde tutacaksa [`openclaw acp`](/tr/cli/acp) kullanın.

## Nasıl çalışır

`openclaw mcp serve` bir stdio MCP sunucusu başlatır. MCP istemcisi bu
sürecin sahibidir. İstemci stdio oturumunu açık tuttuğu sürece, bridge yerel veya uzak bir OpenClaw Gateway'ye WebSocket üzerinden bağlanır ve yönlendirilmiş kanal
konuşmalarını MCP üzerinden kullanıma açar.

Yaşam döngüsü:

1. MCP istemcisi `openclaw mcp serve` sürecini başlatır
2. bridge Gateway'ye bağlanır
3. yönlendirilmiş oturumlar MCP konuşmaları ve transcript/geçmiş araçları haline gelir
4. canlı olaylar, bridge bağlı kaldığı sürece bellekte kuyruğa alınır
5. Claude kanal modu etkinse, aynı oturum ayrıca
   Claude'a özgü push bildirimleri de alabilir

Önemli davranışlar:

- canlı kuyruk durumu bridge bağlandığında başlar
- daha eski transcript geçmişi `messages_read` ile okunur
- Claude push bildirimleri yalnızca MCP oturumu canlıyken vardır
- istemci bağlantıyı kestiğinde, bridge çıkar ve canlı kuyruk kaybolur
- `openclaw agent` ve
  `openclaw infer model run` gibi tek seferlik ajan giriş noktaları, yanıt tamamlandığında açtıkları tüm paketlenmiş MCP çalışma zamanlarını sonlandırır; böylece tekrarlanan betikli çalıştırmalar stdio MCP alt süreçlerini biriktirmez
- OpenClaw tarafından başlatılan stdio MCP sunucuları (paketlenmiş veya kullanıcı yapılandırmalı), kapanışta bir süreç ağacı olarak sonlandırılır; böylece sunucunun başlattığı alt süreçler üst stdio istemcisi çıktıktan sonra yaşamaya devam etmez
- bir oturumu silmek veya sıfırlamak, o oturumun MCP istemcilerini paylaşılan çalışma zamanı temizleme yolu üzerinden elden çıkarır; böylece kaldırılmış bir oturuma bağlı kalmış stdio bağlantıları olmaz

## Bir istemci modu seçin

Aynı bridge'i iki farklı şekilde kullanın:

- Genel MCP istemcileri: yalnızca standart MCP araçları. `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` ve
  onay araçlarını kullanın.
- Claude Code: standart MCP araçlarına ek olarak Claude'a özgü kanal bağdaştırıcısı.
  `--claude-channel-mode on` seçeneğini etkinleştirin veya varsayılan `auto` değerini bırakın.

Bugün `auto`, `on` ile aynı şekilde davranır. Henüz istemci yetenek algılaması yoktur.

## `serve` neyi kullanıma açar

Bridge, kanal destekli konuşmaları kullanıma açmak için mevcut Gateway oturum yönlendirme meta verilerini kullanır. Bir konuşma, OpenClaw zaten aşağıdaki gibi bilinen bir rotaya sahip oturum durumuna sahipse görünür:

- `channel`
- alıcı veya hedef meta verisi
- isteğe bağlı `accountId`
- isteğe bağlı `threadId`

Bu, MCP istemcilerine şunlar için tek bir yer sunar:

- son yönlendirilmiş konuşmaları listelemek
- son transcript geçmişini okumak
- yeni gelen olayları beklemek
- aynı rota üzerinden bir yanıt geri göndermek
- bridge bağlıyken gelen onay isteklerini görmek

## Kullanım

```bash
# Yerel Gateway
openclaw mcp serve

# Uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Parola kimlik doğrulamalı uzak Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ayrıntılı bridge günlüklerini etkinleştir
openclaw mcp serve --verbose

# Claude'a özgü push bildirimlerini devre dışı bırak
openclaw mcp serve --claude-channel-mode off
```

## Bridge araçları

Geçerli bridge şu MCP araçlarını kullanıma açar:

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

Gateway oturum durumunda zaten rota meta verisine sahip son oturum destekli konuşmaları listeler.

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
transcript içeriği üzerinde bir meta veri görünümüdür; bağımsız, dayanıklı bir ek blob deposu değildir.

### `events_poll`

Sayısal bir imleçten beri kuyruğa alınmış canlı olayları okur.

### `events_wait`

Sonraki eşleşen kuyruğa alınmış olay gelene veya zaman aşımı dolana kadar long-poll yapar.

Bunu, genel bir MCP istemcisinin Claude'a özgü bir push protokolü olmadan
neredeyse gerçek zamanlı teslimata ihtiyaç duyduğu durumlarda kullanın.

### `messages_send`

Metni, oturumda zaten kaydedilmiş aynı rota üzerinden geri gönderir.

Geçerli davranış:

- mevcut bir konuşma rotası gerektirir
- oturumun kanalını, alıcısını, hesap kimliğini ve thread kimliğini kullanır
- yalnızca metin gönderir

### `permissions_list_open`

Bridge'nin Gateway'ye bağlandığından beri gözlemlediği bekleyen exec/plugin onay isteklerini listeler.

### `permissions_respond`

Bekleyen bir exec/plugin onay isteğini şu seçeneklerden biriyle çözümler:

- `allow-once`
- `allow-always`
- `deny`

## Olay modeli

Bridge, bağlı kaldığı sürece bellekte bir olay kuyruğu tutar.

Geçerli olay türleri:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Önemli sınırlar:

- kuyruk yalnızca canlıdır; MCP bridge başladığında başlar
- `events_poll` ve `events_wait`, eski Gateway geçmişini
  kendiliğinden yeniden oynatmaz
- dayanıklı backlog, `messages_read` ile okunmalıdır

## Claude kanal bildirimleri

Bridge ayrıca Claude'a özgü kanal bildirimlerini de kullanıma açabilir. Bu,
OpenClaw'un Claude Code kanal bağdaştırıcısı eşdeğeridir: standart MCP araçları kullanılabilir kalır, ancak canlı gelen mesajlar ayrıca Claude'a özgü MCP bildirimleri olarak da gelebilir.

Bayraklar:

- `--claude-channel-mode off`: yalnızca standart MCP araçları
- `--claude-channel-mode on`: Claude kanal bildirimlerini etkinleştirir
- `--claude-channel-mode auto`: mevcut varsayılan; `on` ile aynı bridge davranışı

Claude kanal modu etkin olduğunda, sunucu Claude deneysel
yeteneklerini ilan eder ve şunları yayabilir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Geçerli bridge davranışı:

- gelen `user` transcript mesajları
  `notifications/claude/channel` olarak iletilir
- MCP üzerinden alınan Claude izin istekleri bellekte izlenir
- bağlı konuşma daha sonra `yes abcde` veya `no abcde` gönderirse, bridge
  bunu `notifications/claude/channel/permission` öğesine dönüştürür
- bu bildirimler yalnızca canlı oturum içindir; MCP istemcisi bağlantıyı keserse,
  push hedefi kalmaz

Bu kasıtlı olarak istemciye özeldir. Genel MCP istemcileri standart polling araçlarına güvenmelidir.

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
Claude modunu yok sayın. Claude modunu yalnızca gerçekten
Claude'a özgü bildirim yöntemlerini anlayan istemciler için açın.

## Seçenekler

`openclaw mcp serve` şunları destekler:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--token-file <path>`: belirteci dosyadan oku
- `--password <password>`: Gateway parolası
- `--password-file <path>`: parolayı dosyadan oku
- `--claude-channel-mode <auto|on|off>`: Claude bildirim modu
- `-v`, `--verbose`: stderr üzerinde ayrıntılı günlükler

Mümkün olduğunda satır içi gizli anahtarlar yerine `--token-file` veya `--password-file` tercih edin.

## Güvenlik ve güven sınırı

Bridge yönlendirme icat etmez. Yalnızca Gateway'nin zaten
nasıl yönlendireceğini bildiği konuşmaları kullanıma açar.

Bu şu anlama gelir:

- gönderen izin listeleri, eşleştirme ve kanal düzeyi güven yine
  alttaki OpenClaw kanal yapılandırmasına aittir
- `messages_send` yalnızca mevcut bir kayıtlı rota üzerinden yanıt verebilir
- onay durumu, yalnızca geçerli bridge oturumu için canlı/bellek içidir
- bridge kimlik doğrulaması, diğer tüm uzak Gateway istemcileri için güveneceğiniz aynı Gateway belirteci veya parola denetimlerini kullanmalıdır

Bir konuşma `conversations_list` içinde görünmüyorsa, olağan neden MCP yapılandırması değildir. Bunun yerine, alttaki
Gateway oturumunda rota meta verisinin eksik veya eksik olmasıdır.

## Test

OpenClaw bu bridge için deterministik bir Docker smoke testiyle birlikte gelir:

```bash
pnpm test:docker:mcp-channels
```

Bu smoke testi:

- seed edilmiş bir Gateway container'ı başlatır
- `openclaw mcp serve` sürecini başlatan ikinci bir container başlatır
- konuşma keşfini, transcript okumalarını, ek meta verisi okumalarını,
  canlı olay kuyruğu davranışını ve giden gönderim yönlendirmesini doğrular
- gerçek stdio MCP bridge üzerinden Claude tarzı kanal ve izin bildirimlerini doğrular

Bu, test çalıştırmasına gerçek bir
Telegram, Discord veya iMessage hesabı bağlamadan bridge'in çalıştığını kanıtlamanın en hızlı yoludur.

Daha geniş test bağlamı için bkz. [Testing](/tr/help/testing).

## Sorun giderme

### Hiç konuşma dönmüyor

Genellikle Gateway oturumunun zaten yönlendirilebilir olmadığı anlamına gelir. Alttaki
oturumun kayıtlı kanal/sağlayıcı, alıcı ve isteğe bağlı
hesap/thread rota meta verisine sahip olduğunu doğrulayın.

### `events_poll` veya `events_wait` eski mesajları kaçırıyor

Beklenen davranış. Canlı kuyruk bridge bağlandığında başlar. Daha eski transcript
geçmişini `messages_read` ile okuyun.

### Claude bildirimleri görünmüyor

Bunların hepsini kontrol edin:

- istemci stdio MCP oturumunu açık tuttu
- `--claude-channel-mode` `on` veya `auto`
- istemci gerçekten Claude'a özgü bildirim yöntemlerini anlıyor
- gelen mesaj bridge bağlandıktan sonra gerçekleşti

### Onaylar eksik

`permissions_list_open`, yalnızca bridge bağlıyken
gözlemlenen onay isteklerini gösterir. Dayanıklı bir onay geçmişi API'si değildir.

## OpenClaw'u bir MCP istemci kayıt defteri olarak kullanma

Bu, `openclaw mcp list`, `show`, `set` ve `unset` yoludur.

Bu komutlar OpenClaw'u MCP üzerinden kullanıma açmaz. Bunlar, OpenClaw yapılandırmasındaki `mcp.servers` altında OpenClaw'a ait MCP
sunucu tanımlarını yönetir.

Bu kaydedilmiş tanımlar, OpenClaw'un daha sonra başlattığı veya yapılandırdığı
gömülü Pi ve diğer çalışma zamanı bağdaştırıcıları gibi çalışma zamanları içindir. OpenClaw tanımları merkezi olarak saklar, böylece bu çalışma zamanlarının kendi yinelenen
MCP sunucu listelerini tutması gerekmez.

Önemli davranışlar:

- bu komutlar yalnızca OpenClaw yapılandırmasını okur veya yazar
- hedef MCP sunucusuna bağlanmazlar
- komutun, URL'nin veya uzak taşımanın
  şu anda erişilebilir olup olmadığını doğrulamazlar
- çalışma zamanı bağdaştırıcıları, yürütme zamanında gerçekte hangi taşıma şekillerini desteklediklerine karar verir
- gömülü Pi, yapılandırılmış MCP araçlarını normal `coding` ve `messaging`
  araç profillerinde kullanıma açar; `minimal` bunları yine gizler ve `tools.deny: ["bundle-mcp"]`
  bunları açıkça devre dışı bırakır
- oturum kapsamlı paketlenmiş MCP çalışma zamanları, boşta kalma süresinin `mcp.sessionIdleTtlMs`
  milisaniye sonrasında (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın) temizlenir ve
  tek seferlik gömülü çalıştırmalar, çalıştırma sonunda bunları temizler

## Kaydedilmiş MCP sunucu tanımları

OpenClaw ayrıca OpenClaw tarafından yönetilen MCP tanımları isteyen yüzeyler için
yapılandırmada hafif bir MCP sunucu kayıt defteri de saklar.

Komutlar:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notlar:

- `list`, sunucu adlarını sıralar.
- `show`, ad verilmeden kullanılırsa yapılandırılmış MCP sunucu nesnesinin tamamını yazdırır.
- `set`, komut satırında tek bir JSON nesne değeri bekler.
- `unset`, adlandırılmış sunucu yoksa başarısız olur.

Örnekler:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Örnek yapılandırma şekli:

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

| Alan                       | Açıklama                          |
| -------------------------- | --------------------------------- |
| `command`                  | Başlatılacak yürütülebilir dosya (gerekli) |
| `args`                     | Komut satırı argümanları dizisi   |
| `env`                      | Ek ortam değişkenleri             |
| `cwd` / `workingDirectory` | Sürecin çalışma dizini            |

#### Stdio env güvenlik filtresi

OpenClaw, stdio MCP sunucusunun ilk RPC'den önce nasıl başlatıldığını değiştirebilen yorumlayıcı başlangıç env anahtarlarını, bir sunucunun `env` bloğunda görünseler bile reddeder. Engellenen anahtarlar arasında `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` ve benzeri çalışma zamanı denetim değişkenleri bulunur. Başlangıç, bunları bir yapılandırma hatasıyla reddeder; böylece örtük bir başlangıç bölümü ekleyemez, yorumlayıcıyı değiştiremez veya stdio sürecine karşı hata ayıklayıcı etkinleştiremezler. Sıradan kimlik bilgisi, proxy ve sunucuya özgü env değişkenleri (`GITHUB_TOKEN`, `HTTP_PROXY`, özel `*_API_KEY` vb.) etkilenmez.

MCP sunucunuz gerçekten engellenen değişkenlerden birine ihtiyaç duyuyorsa, bunu stdio sunucusunun `env` alanı altında değil, gateway host sürecinde ayarlayın.

### SSE / HTTP taşıması

HTTP Server-Sent Events üzerinden uzak bir MCP sunucusuna bağlanır.

| Alan                  | Açıklama                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                  |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)  |

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

`streamable-http`, `sse` ve `stdio` seçeneklerine ek bir taşıma seçeneğidir. Uzak MCP sunucularıyla çift yönlü iletişim için HTTP akışını kullanır.

| Alan                  | Açıklama                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | Uzak sunucunun HTTP veya HTTPS URL'si (gerekli)                                          |
| `transport`           | Bu taşımayı seçmek için `"streamable-http"` olarak ayarlayın; atlanırsa OpenClaw `sse` kullanır |
| `headers`             | İsteğe bağlı HTTP başlıkları anahtar-değer eşlemesi (örneğin kimlik doğrulama belirteçleri) |
| `connectionTimeoutMs` | Sunucu başına bağlantı zaman aşımı, ms cinsinden (isteğe bağlı)                          |

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

Bu komutlar yalnızca kaydedilmiş yapılandırmayı yönetir. Kanal bridge'ini başlatmaz, canlı bir MCP istemci oturumu açmaz veya hedef sunucunun erişilebilir olduğunu kanıtlamaz.

## Geçerli sınırlar

Bu sayfa, bridge'i bugün gönderildiği haliyle belgeler.

Geçerli sınırlar:

- konuşma keşfi mevcut Gateway oturum rota meta verisine bağlıdır
- Claude'a özgü bağdaştırıcı dışında genel bir push protokolü yoktur
- henüz mesaj düzenleme veya tepki araçları yok
- HTTP/SSE/streamable-http taşıması tek bir uzak sunucuya bağlanır; henüz çoklanmış bir upstream yok
- `permissions_list_open`, yalnızca bridge bağlıyken gözlemlenen onayları içerir

## İlgili

- [CLI reference](/tr/cli)
- [Plugins](/tr/cli/plugins)
