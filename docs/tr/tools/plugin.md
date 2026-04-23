---
read_when:
    - Plugin kurma veya yapılandırma
    - Plugin keşif ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw Plugin'lerini kurun, yapılandırın ve yönetin
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-23T09:11:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin'ler

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model provider'ları,
araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses,
medya anlama, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **çekirdektir** (OpenClaw ile gelir), diğerleri
ise **haricidir** (topluluk tarafından npm'de yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir Plugin kurun">
    ```bash
    # npm'den
    openclaw plugins install @openclaw/voice-call

    # Yerel bir dizinden veya arşivden
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>
</Steps>

Sohbete özgü denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Kurulum yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya yalın paket belirtimi (önce ClawHub, sonra npm geri dönüşü).

Yapılandırma geçersizse, kurulum normalde kapalı kalacak şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şuraya katılan Plugin'ler için dar bir paketli-Plugin
yeniden kurulum yoludur:
`openclaw.install.allowInvalidConfigRecovery`.

Paketlenmiş OpenClaw kurulumları her paketli Plugin'in
çalışma zamanı bağımlılık ağacını istekli biçimde kurmaz. Paketli ve OpenClaw'a ait bir Plugin,
Plugin yapılandırmasından, eski kanal yapılandırmasından veya varsayılan etkin manifest'ten etkin olduğunda,
başlatma onu içe aktarmadan önce yalnızca o Plugin'in bildirilen çalışma zamanı bağımlılıklarını onarır.
Harici Plugin'ler ve özel yükleme yolları yine de
`openclaw plugins install` üzerinden kurulmalıdır.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                   | Örnekler                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için bkz. [Plugin Bundles](/tr/plugins/bundles).

Bir native Plugin yazıyorsanız [Plugin Geliştirme](/tr/plugins/building-plugins)
ve [Plugin SDK'ye Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Resmi Plugin'ler

### Kurulabilir (npm)

| Plugin          | Paket                 | Belgeler                              |
| --------------- | --------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/tr/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/tr/channels/msteams)  |
| Nostr           | `@openclaw/nostr`      | [Nostr](/tr/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/tr/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`       | [Zalo](/tr/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/tr/plugins/zalouser)    |

### Çekirdek (OpenClaw ile gelir)

<AccordionGroup>
  <Accordion title="Model provider'ları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek Plugin'leri">
    - `memory-core` — paketli bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı kurulan uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)
  </Accordion>

  <Accordion title="Konuşma provider'ları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — browser aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, browser çalışma zamanı ve varsayılan browser denetim hizmeti için paketli browser Plugin'i (varsayılan olarak etkindir; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? Bkz. [Topluluk Plugin'leri](/tr/plugins/community).

## Yapılandırma

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Alan            | Açıklama                                               |
| ---------------- | ------------------------------------------------------ |
| `enabled`        | Ana anahtar (varsayılan: `true`)                      |
| `allow`          | Plugin allowlist'i (isteğe bağlı)                     |
| `deny`           | Plugin denylist'i (isteğe bağlı; deny kazanır)        |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                         |
| `slots`          | Ayrıcalıklı slot seçicileri (örn. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma              |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı gerçekleştikten kısa süre sonra otomatik yapılır.

<Accordion title="Plugin durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: Plugin vardır ama etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ama yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw Plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı Plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketli Plugin'ler">
    OpenClaw ile gelir. Birçoğu varsayılan olarak etkindir (model provider'ları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır
- `plugins.deny` her zaman `allow` üzerinde kazanır
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı Plugin'ler varsayılan olarak **devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketli Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümesini izler
- Ayrıcalıklı slot'lar o slot için seçilen Plugin'i zorla etkinleştirebilir

## Plugin slot'ları (ayrıcalıklı kategoriler)

Bazı kategoriler ayrıcalıklıdır (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // veya devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir plugin id
    },
  },
}
```

| Slot            | Neyi denetler         | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Etkin bellek Plugin'i | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru   | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklenen Plugin'ler
openclaw plugins list --verbose            # Plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # tüm filo tablosu
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılamalar

openclaw plugins install <package>         # kurulum (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan kur
openclaw plugins install <spec> --force    # mevcut kurulumu üzerine yaz
openclaw plugins install <path>            # yerel yoldan kur
openclaw plugins install -l <path>         # geliştirme için bağla (kopya yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm belirtimini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # tek bir Plugin'i güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # hepsini güncelle
openclaw plugins uninstall <id>          # yapılandırma/kurulum kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketli Plugin'ler OpenClaw ile gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketli model provider'ları, paketli konuşma provider'ları ve paketli browser
Plugin'i). Diğer paketli Plugin'ler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut kurulu Plugin'i veya hook paketini yerinde üzerine yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın. Kaynak yolu yönetilen kurulum hedefi üzerine
kopyalamak yerine yeniden kullandığından `--link` ile desteklenmez.

`openclaw plugins update <id-or-npm-spec>`, izlenen kurulumlar için geçerlidir. Bir
dist-tag veya tam sürüm içeren npm paket belirtimi vermek, paket adını
izlenen Plugin kaydına geri çözer ve gelecekteki güncellemeler için yeni belirtimi kaydeder.
Sürüm olmadan paket adı geçirmek, tam sabitlenmiş bir kurulumu
kayıt defterinin varsayılan sürüm hattına geri taşır. Kurulu npm Plugin'i zaten
çözümlenen sürüm ve kaydedilen artifact kimliğiyle eşleşiyorsa, OpenClaw güncellemeyi
indirmeden, yeniden kurmadan veya yapılandırmayı yeniden yazmadan atlar.

`--pin` yalnızca npm içindir. Marketplace kurulumları npm belirtimi yerine
marketplace kaynak meta verilerini kalıcılaştırdığı için `--marketplace` ile
desteklenmez.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış
pozitif sonuçlar için cam kırma geçersiz kılmasıdır. Plugin kurulumlarının
ve Plugin güncellemelerinin yerleşik `critical` bulgularını geçerek devam etmesine izin verir, ancak yine de Plugin `before_install` ilke engellerini veya tarama başarısızlığı engellemelerini atlamaz.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli Skill
bağımlılığı kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall`
istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
Skill indirme/kurulum akışı olarak kalır.

Uyumlu bundle'lar da aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Geçerli çalışma zamanı desteği bundle Skills, Claude komut-Skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest'te bildirilen
`lspServers` varsayılanları, Cursor komut-Skills ve uyumlu Codex kanca
dizinlerini içerir.

`openclaw plugins inspect <id>`, bundle destekli Plugin'ler için algılanan
bundle yeteneklerini ve desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini de bildirir.

Marketplace kaynakları
`~/.claude/plugins/known_marketplaces.json` içindeki bir Claude bilinen-marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo
URL'si veya bir git URL'si olabilir. Uzak marketplace'ler için Plugin girdileri
klonlanan marketplace deposu içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için bkz. [`openclaw plugins` CLI başvurusu](/tr/cli/plugins).

## Plugin API'ye genel bakış

Native Plugin'ler `register(api)` sunan bir giriş nesnesi dışa aktarır. Eski
Plugin'ler hâlâ eski takma ad olarak `activate(api)` kullanabilir, ancak yeni Plugin'ler
`register` kullanmalıdır.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw giriş nesnesini yükler ve Plugin
etkinleştirmesi sırasında `register(api)` çağrısını yapar. Yükleyici eski Plugin'ler için hâlâ `activate(api)` çağrısına geri döner,
ancak paketli Plugin'ler ve yeni harici Plugin'ler `register` çağrısını herkese açık sözleşme olarak görmelidir.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Ne kaydeder                 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model provider'ı (LLM)      |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Agent aracı                 |
| `registerHook` / `on(...)`              | Yaşam döngüsü kancaları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                  |
| `registerRealtimeVoiceProvider`         | Duplex gerçek zamanlı ses   |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi         |
| `registerImageGenerationProvider`       | Görüntü oluşturma           |
| `registerMusicGenerationProvider`       | Müzik oluşturma             |
| `registerVideoGenerationProvider`       | Video oluşturma             |
| `registerWebFetchProvider`              | Web getirme / scrape provider'ı |
| `registerWebSearchProvider`             | Web arama                   |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Typed yaşam döngüsü kancaları için kanca guard davranışı:

- `before_tool_call`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` no-op'tur ve daha önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` no-op'tur ve daha önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` no-op'tur ve daha önceki bir iptali temizlemez.

Tam typed kanca davranışı için bkz. [SDK'ye Genel Bakış](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin Geliştirme](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin Bundles](/tr/plugins/bundles) — Codex/Claude/Cursor bundle uyumluluğu
- [Plugin Manifest'i](/tr/plugins/manifest) — manifest şeması
- [Araç Kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin'e agent araçları ekleyin
- [Plugin İç Yapıları](/tr/plugins/architecture) — yetenek modeli ve yükleme işlem hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeler
