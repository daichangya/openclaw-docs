---
read_when:
    - Akıl yürütme sızıntısını incelemek için ham model çıktısını denetlemeniz gerekiyor
    - Yinelerken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısının izlenmesi'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-04-23T09:03:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Hata ayıklama

Bu sayfa, özellikle bir
sağlayıcı akıl yürütmeyi normal metinle karıştırdığında, akış çıktısı için hata ayıklama yardımcılarını kapsar.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

Sadece çalışma zamanı için yapılandırma geçersiz kılmaları ayarlamak üzere sohbette `/debug` kullanın (disk değil, bellek).
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları değiştirmeniz gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`, tüm geçersiz kılmaları temizler ve disk üzerindeki yapılandırmaya geri döner.

## Oturum iz çıktısı

Tam ayrıntılı modu açmadan
tek bir oturumda Plugin'e ait iz/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için
`/debug` kullanmaya devam edin.

## Geçici CLI hata ayıklama zamanlaması

OpenClaw, yerel
inceleme için küçük bir yardımcı olarak `src/cli/debug-timing.ts` dosyasını tutar. Bu araç kasıtlı olarak varsayılan olarak CLI başlatma, komut yönlendirme
veya herhangi bir komuta bağlanmamıştır. Yalnızca yavaş bir komutta hata ayıklarken kullanın, ardından davranış değişikliğini göndermeden önce
import'u ve span'leri kaldırın.

Bunu, bir komut yavaş olduğunda ve
CPU profiler kullanmaya mı yoksa belirli bir alt sistemi düzeltmeye mi karar vermeden önce hızlı bir aşama dökümüne ihtiyaç duyduğunuzda kullanın.

### Geçici span'ler ekleyin

Yardımcıyı incelediğiniz kodun yakınına ekleyin. Örneğin,
`openclaw models list` komutunda hata ayıklarken,
`src/commands/models/list.list-command.ts` içindeki geçici bir yama şöyle görünebilir:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Kurallar:

- Geçici aşama adlarını `debug:` ile başlatın.
- Yalnızca yavaş olduğundan şüphelenilen bölümlerin çevresine birkaç span ekleyin.
- Yardımcı
  adları yerine `registry`, `auth_store` veya `rows` gibi geniş aşamaları tercih edin.
- Eşzamanlı işler için `time()`, promise'ler için `timeAsync()` kullanın.
- stdout'u temiz tutun. Yardımcı stderr'e yazar, bu nedenle komut JSON çıktısı ayrıştırılabilir kalır.
- Son düzeltme PR'ını açmadan önce geçici import'ları ve span'leri kaldırın.
- Optimizasyonu açıklayan issue veya PR'a zamanlama çıktısını ya da kısa bir özetini ekleyin.

### Okunabilir çıktıyla çalıştırın

Canlı hata ayıklama için okunabilir mod en iyisidir:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Geçici bir `models list` incelemesinden örnek çıktı:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Bu çıktının bulguları:

| Aşama                                    |      Süre | Ne anlama gelir                                                                                         |
| ---------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |     20.3s | Auth profili deposunun yüklenmesi en büyük maliyettir ve önce araştırılmalıdır.                        |
| `debug:models:list:ensure_models_json`   |      5.0s | `models.json` eşitlemesi, önbellekleme veya atlama koşulları açısından incelenecek kadar pahalıdır.    |
| `debug:models:list:load_model_registry`  |      5.9s | Kayıt defteri oluşturma ve sağlayıcı kullanılabilirliği işi de anlamlı maliyetlerdir.                  |
| `debug:models:list:read_registry_models` |      2.4s | Tüm kayıt defteri modellerini okumak ücretsiz değildir ve `--all` için önemli olabilir.                |
| satır ekleme aşamaları                   | toplam 3.2s | Görüntülenen beş satırın oluşturulması bile birkaç saniye sürer; bu yüzden filtreleme yolu daha yakından incelenmelidir. |
| `debug:models:list:print_model_table`    |       0ms | Darboğaz render etme değildir.                                                                          |

Bu bulgular, zamanlama kodunu üretim yollarında tutmadan bir sonraki yamayı yönlendirmek için yeterlidir.

### JSON çıktısıyla çalıştırın

Zamanlama verilerini kaydetmek veya karşılaştırmak istediğinizde JSON modunu kullanın:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Her stderr satırı bir JSON nesnesidir:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Göndermeden önce temizleyin

Son PR'ı açmadan önce:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR açıkça kalıcı bir tanılama yüzeyi eklemiyorsa, komut geçici araçlandırma çağrı noktaları döndürmemelidir.
Normal performans
düzeltmeleri için yalnızca davranış değişikliğini, testleri ve zamanlama
kanıtıyla ilgili kısa bir notu tutun.

Daha derin CPU sıcak noktaları için daha fazla zamanlama sarmalayıcısı eklemek yerine
Node profiling (`--cpu-prof`) veya harici bir
profiler kullanın.

## Gateway izleme modu

Hızlı yineleme için gateway'i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Bu şu komuta eşlenir:

```bash
node scripts/watch-node.mjs gateway --force
```

İzleyici; `src/` altındaki build ile ilgili dosyalarda, eklenti kaynak dosyalarında,
eklenti `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`,
`package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatır. Eklenti meta veri değişiklikleri
bir `tsdown` yeniden build'ini zorlamadan gateway'i yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise yine önce
`dist` için build alır.

`gateway:watch` sonrasına herhangi bir gateway CLI bayrağı ekleyin; bunlar her
yeniden başlatmada aktarılır. Aynı repo/bayrak kümesi için aynı izleme komutunu yeniden çalıştırmak artık
eski izleyiciyi değiştirdiğinden, geride yinelenen izleyici üst süreçleri kalmaz.

## Geliştirme profili + geliştirme gateway'i (`--dev`)

Hata ayıklama için durumu yalıtmak ve güvenli, atılabilir bir kurulum başlatmak amacıyla geliştirme profilini kullanın. İki adet `--dev` bayrağı vardır:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar da buna göre kayar).
- **`gateway --dev`:** Gateway'e eksik olduğunda varsayılan bir yapılandırma +
  çalışma alanı oluşturmasını söyler (ve `BOOTSTRAP.md` dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme önyüklemesi):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz genel kurulumunuz yoksa, CLI'ı `pnpm openclaw ...` ile çalıştırın.

Bunun yaptıkları:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas buna göre kayar)

2. **Geliştirme önyüklemesi** (`gateway --dev`)
   - Eksikse asgari bir yapılandırma yazar (`gateway.mode=local`, loopback'e bağlanır).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (`BOOTSTRAP.md` yok).
   - Eksikse çalışma alanı dosyalarını doldurur:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

Not: `--dev` genel bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir.
Açıkça belirtmeniz gerekirse ortam değişkeni biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`; yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını
(`rm` değil, `trash` kullanarak) siler, ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

İpucu: geliştirici olmayan bir gateway zaten çalışıyorsa (launchd/systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

## Ham akış günlüğü (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirmeden önce **ham yardımcı akışını** günlüğe kaydedebilir.
Bu, akıl yürütmenin düz metin deltaları olarak mı
(yoksa ayrı thinking blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılması:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer ortam değişkenleri:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-stream.jsonl`

## Ham parça günlüğü (pi-mono)

Bloklara ayrıştırılmadan önce **ham OpenAI uyumlu parçaları**
yakalamak için pi-mono ayrı bir günlükleyici sunar:

```bash
PI_RAW_STREAM=1
```

İsteğe bağlı yol:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Varsayılan dosya:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Not: bu yalnızca pi-mono'nun
> `openai-completions` sağlayıcısını kullanan süreçler tarafından yayılır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerelde tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli anahtarları ve PII'yi temizleyin.
