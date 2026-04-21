---
read_when:
    - Plugin'leri kurma veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw plugin'lerini kurun, yapılandırın ve yönetin
title: Plugins
x-i18n:
    generated_at: "2026-04-21T09:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins, OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses,
medya anlama, görsel üretimi, video üretimi, web fetch, web
search ve daha fazlası. Bazı plugin'ler **çekirdek**tir (OpenClaw ile birlikte gelir), diğerleri
ise **harici**dir (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir plugin kurun">
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

    Ardından config dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>
</Steps>

Sohbete yerel denetim tercih ediyorsanız, `commands.plugins: true` değerini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Kurulum yolu, CLI ile aynı çözümleyiciyi kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya çıplak paket belirtimi (önce ClawHub, sonra npm fallback).

Config geçersizse, kurulum normalde güvenli şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası,
`openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan plugin'ler için dar bir paketle gelen plugin
yeniden kurulum yoludur.

Paketlenmiş OpenClaw kurulumları, paketle gelen her plugin'in
çalışma zamanı bağımlılık ağacını açgözlü şekilde kurmaz. Paketle gelen OpenClaw'a ait bir plugin,
plugin config, eski kanal config'i veya varsayılan etkin manifest üzerinden etkinken,
başlangıç yalnızca içe aktarmadan önce o plugin'in bildirdiği çalışma zamanı bağımlılıklarını onarır.
Harici plugin'ler ve özel yükleme yolları yine de `openclaw plugins install`
üzerinden kurulmalıdır.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                   | Örnekler                                              |
| ---------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmî plugin'ler, topluluk npm paketleri             |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw yeteneklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Bundle ayrıntıları için [Plugin Bundles](/tr/plugins/bundles) bölümüne bakın.

Bir native plugin yazıyorsanız, [Building Plugins](/tr/plugins/building-plugins)
ve [Plugin SDK Overview](/tr/plugins/sdk-overview) ile başlayın.

## Resmî plugin'ler

### Kurulabilir (npm)

| Plugin          | Paket                 | Belgeler                             |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/tr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/tr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/tr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/tr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/tr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/tr/plugins/zalouser)   |

### Çekirdek (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek plugin'leri">
    - `memory-core` — paketle gelen bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı kurulum uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — browser aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, browser çalışma zamanı ve varsayılan browser denetim hizmeti için paketle gelen browser plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf plugin'ler mi arıyorsunuz? [Community Plugins](/tr/plugins/community) bölümüne bakın.

## Yapılandırma

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Alan            | Açıklama                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                          |
| `allow`          | Plugin allowlist'i (isteğe bağlı)                         |
| `deny`           | Plugin denylist'i (isteğe bağlı; deny her zaman kazanır)  |
| `load.paths`     | Ek plugin dosyaları/dizinleri                             |
| `slots`          | Ayrıcalıklı slot seçicileri (ör. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına anahtarlar + config                         |

Config değişiklikleri **gateway yeniden başlatması gerektirir**. Gateway config
izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle config yazımı tamamlandıktan kısa bir süre sonra otomatik olarak yapılır.

<Accordion title="Plugin durumları: disabled ve missing ve invalid">
  - **Disabled**: plugin mevcut ama etkinleştirme kuralları onu kapattı. Config korunur.
  - **Missing**: config bir plugin kimliğine başvuruyor ama keşif bunu bulamadı.
  - **Invalid**: plugin mevcut ama config'i bildirilen şemayla eşleşmiyor.
</Accordion>

## Keşif ve öncelik

OpenClaw plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Config yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı extension'ları">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel extension'lar">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketle gelen plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm plugin'leri devre dışı bırakır
- `plugins.deny`, allow'a her zaman üstün gelir
- `plugins.entries.\<id\>.enabled: false` o plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketle gelen plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan açık kümesini izler
- Ayrıcalıklı slot'lar, o slot için seçilen plugin'i zorla etkinleştirebilir

## Plugin slot'ları (ayrıcalıklı kategoriler)

Bazı kategoriler ayrıcalıklıdır (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // veya devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir plugin kimliği
    },
  },
}
```

| Slot            | Neyi denetler          | Varsayılan          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Etkin bellek plugin'i  | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru    | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklü plugin'ler
openclaw plugins list --verbose            # plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # filo genelinde tablo
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılama

openclaw plugins install <package>         # kurulum (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan kurulum
openclaw plugins install <spec> --force    # mevcut kurulumu üzerine yaz
openclaw plugins install <path>            # yerel yoldan kurulum
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm belirtimini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # bir plugin'i güncelle
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # hepsini güncelle
openclaw plugins uninstall <id>          # config/kurulum kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketle gelen plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketle gelen model sağlayıcıları, paketle gelen konuşma sağlayıcıları ve paketle gelen browser
plugin'i). Diğer paketle gelen plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut kurulu bir plugin'i veya hook paketini yerinde üzerine yazar.
Kaynak yolu yönetilen kurulum hedefine kopyalamak yerine yeniden kullanan
`--link` ile desteklenmez.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verisini kalıcı hâle getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının
yanlış pozitifleri için kır-cam geçersiz kılmasıdır. Plugin kurulumları
ve plugin güncellemelerinin yerleşik `critical` bulgularını aşarak devam etmesini sağlar, ancak yine de
plugin `before_install` ilke bloklarını veya tarama-başarısızlığı engellemelerini atlamaz.

Bu CLI bayrağı yalnızca plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli Skill
bağımlılık kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub Skill indirme/kurulum akışı olarak kalır.

Uyumlu bundle'lar da aynı plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Geçerli çalışma zamanı desteği; bundle Skills, Claude command-Skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest ile bildirilen
`lspServers` varsayılanları, Cursor command-Skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>`, bundle destekli plugin'ler için algılanan bundle yeteneklerini ve desteklenen veya desteklenmeyen MCP ve LSP sunucusu girdilerini de bildirir.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json`
içindeki bir Claude bilinen-marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi bir GitHub kısa biçimi, bir GitHub repo
URL'si veya bir git URL'si olabilir. Uzak marketplace'ler için plugin girdileri
klonlanan marketplace repo'su içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/cli/plugins) bölümüne bakın.

## Plugin API genel bakış

Native plugin'ler `register(api)` açığa çıkaran bir giriş nesnesi dışa aktarır. Eski
plugin'ler hâlâ eski takma ad olarak `activate(api)` kullanabilir, ancak yeni plugin'ler
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

OpenClaw giriş nesnesini yükler ve plugin etkinleştirme sırasında `register(api)` çağırır. Yükleyici eski plugin'ler için hâlâ `activate(api)` değerine fallback yapar, ancak paketle gelen plugin'ler ve yeni harici plugin'ler `register` değerini herkese açık sözleşme olarak değerlendirmelidir.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)     |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Ajan aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                  |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi          |
| `registerImageGenerationProvider`       | Görsel üretimi              |
| `registerMusicGenerationProvider`       | Müzik üretimi               |
| `registerVideoGenerationProvider`       | Video üretimi               |
| `registerWebFetchProvider`              | Web fetch / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Türlendirilmiş yaşam döngüsü hook'ları için hook guard davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` işlemsizdir ve daha önceki bir block'u temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` işlemsizdir ve daha önceki bir block'u temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` işlemsizdir ve daha önceki bir cancel'ı temizlemez.

Tam türlendirilmiş hook davranışı için [SDK Overview](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Building Plugins](/tr/plugins/building-plugins) — kendi plugin'inizi oluşturun
- [Plugin Bundles](/tr/plugins/bundles) — Codex/Claude/Cursor bundle uyumluluğu
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması
- [Registering Tools](/tr/plugins/building-plugins#registering-agent-tools) — bir plugin içinde ajan araçları ekleyin
- [Plugin Internals](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Community Plugins](/tr/plugins/community) — üçüncü taraf listeleri
