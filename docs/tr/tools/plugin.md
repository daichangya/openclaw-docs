---
read_when:
    - Plugin'leri kurma veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu Plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw plugin'lerini kurun, yapılandırın ve yönetin
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-24T15:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Plugin'ler OpenClaw'u yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
ajan koşumları, araçlar, beceriler, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görsel oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı Plugin'ler **çekirdektir** (OpenClaw ile birlikte gelir), diğerleri
ise **haricidir** (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Neyin yüklü olduğunu görün">
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

Sohbet yerel denetimi tercih ediyorsanız, `commands.plugins: true` etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Kurulum yolu, CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` ya da yalın paket belirtimi (önce ClawHub, sonra npm yedeği).

Yapılandırma geçersizse, kurulum normalde kapalı şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şunu seçen Plugin'ler için
dar kapsamlı bir paketlenmiş Plugin yeniden kurulum yoludur:
`openclaw.install.allowInvalidConfigRecovery`.

Paketlenmiş OpenClaw kurulumları, birlikte gelen her Plugin'in
çalışma zamanı bağımlılık ağacını önceden kurmaz. Paketlenmiş ve OpenClaw'a ait bir Plugin
Plugin yapılandırması, eski kanal yapılandırması veya varsayılan etkin bir manifestodan etkin olduğunda,
başlangıç yalnızca o Plugin'in bildirilen çalışma zamanı bağımlılıklarını
içe aktarmadan önce onarır. Harici Plugin'ler ve özel yükleme yolları yine de
`openclaw plugins install` üzerinden kurulmalıdır.

## Plugin türleri

OpenClaw iki Plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                     | Örnekler                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde çalışır | Resmi Plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir  | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Plugin Paketleri](/tr/plugins/bundles) bölümüne bakın.

Bir native Plugin yazıyorsanız, [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Resmi Plugin'ler

### Kurulabilir (npm)

| Plugin          | Paket                  | Belgeler                             |
| --------------- | ---------------------- | ------------------------------------ |
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

  <Accordion title="Bellek Plugin'leri">
    - `memory-core` — paketlenmiş bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı kurulan uzun vadeli bellek (`plugins.slots.memory = "memory-lancedb"` olarak ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI'si, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketlenmiş tarayıcı Plugin'i (varsayılan olarak etkindir; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf Plugin'ler mi arıyorsunuz? [Topluluk Plugin'leri](/tr/plugins/community) bölümüne bakın.

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

| Alan            | Açıklama                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                          |
| `allow`          | Plugin izin listesi (isteğe bağlı)                        |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme önceliklidir) |
| `load.paths`     | Ek Plugin dosyaları/dizinleri                             |
| `slots`          | Özel yuva seçicileri (örn. `memory`, `contextEngine`)     |
| `entries.\<id\>` | Plugin başına anahtarlar + yapılandırma                   |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı tamamlandıktan kısa bir süre sonra otomatik olarak gerçekleştirilir.
Native Plugin çalışma zamanı kodu veya yaşam döngüsü kancaları için desteklenen bir sıcak yeniden yükleme yolu yoktur;
güncellenmiş `register(api)` kodunun, `api.on(...)` kancalarının, araçların, hizmetlerin veya
sağlayıcı/çalışma zamanı kancalarının çalışmasını beklemeden önce canlı kanala hizmet veren
Gateway sürecini yeniden başlatın.

`openclaw plugins list`, yerel bir CLI/yapılandırma anlık görüntüsüdür. Orada bir Plugin'in `loaded` olması,
Plugin'in o CLI çağrısının gördüğü yapılandırma/dosyalardan keşfedilebilir ve yüklenebilir olduğu
anlamına gelir. Bu, hâlihazırda çalışan uzak bir Gateway alt sürecinin
aynı Plugin koduyla yeniden başlatıldığını kanıtlamaz. Sarmalayıcı süreçlere sahip VPS/container kurulumlarında,
yeniden başlatma sinyallerini gerçek `openclaw gateway run` sürecine gönderin veya
çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: Plugin vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir Plugin kimliğine başvurur.
  - **Geçersiz**: Plugin vardır ancak yapılandırması bildirilen şemayla eşleşmez.
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

  <Step title="Genel Plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş Plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm Plugin'leri devre dışı bırakır
- `plugins.deny` her zaman `allow` üzerinde önceliklidir
- `plugins.entries.\<id\>.enabled: false` o Plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı Plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketlenmiş Plugin'ler, geçersiz kılınmadıkça yerleşik varsayılan etkin kümesini izler
- Özel yuvalar, o yuva için seçilen Plugin'i zorla etkinleştirebilir
- Bazı paketlenmiş isteğe bağlı Plugin'ler, yapılandırma bir
  Plugin'e ait yüzeyi adlandırdığında otomatik olarak etkinleştirilir; örneğin bir sağlayıcı model başvurusu, kanal yapılandırması veya harness
  çalışma zamanı
- OpenAI ailesi Codex yolları ayrı Plugin sınırlarını korur:
  `openai-codex/*` OpenAI Plugin'ine aittir; paketlenmiş Codex
  app-server Plugin'i ise `embeddedHarness.runtime: "codex"` veya eski
  `codex/*` model başvuruları ile seçilir

## Çalışma Zamanı Kancalarında Sorun Giderme

Bir Plugin `plugins list` içinde görünüyorsa ancak `register(api)` yan etkileri veya kancaları
canlı sohbet trafiğinde çalışmıyorsa, önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` komutunu çalıştırın ve etkin
  Gateway URL'si, profil, yapılandırma yolu ve sürecin düzenlediğinizle aynı olduğunu doğrulayın.
- Plugin kurulum/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  container'larda, PID 1 yalnızca bir gözetmen olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya ona sinyal gönderin.
- Kanca kayıtlarını ve tanılamayı doğrulamak için `openclaw plugins inspect <id> --json` kullanın.
  `llm_input`,
  `llm_output` ve `agent_end` gibi paketlenmemiş konuşma kancaları için
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.
- Model değiştirme için `before_model_resolve` tercih edin. Bu kanca, ajan dönüşleri için model
  çözümlemesinden önce çalışır; `llm_output` ise yalnızca bir model denemesi
  asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modeli kanıtı için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerini hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

## Plugin yuvaları (özel kategoriler)

Bazı kategoriler özeldir (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // veya devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir Plugin kimliği
    },
  },
}
```

| Yuva            | Ne denetler            | Varsayılan          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Active Memory Plugin'i | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru    | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklenmiş Plugin'ler
openclaw plugins list --verbose            # Plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # tüm filoya ait tablo
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılama

openclaw plugins install <package>         # kur (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan kur
openclaw plugins install <spec> --force    # mevcut kurulumu üzerine yaz
openclaw plugins install <path>            # yerel yoldan kur
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm belirtimini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # tek bir Plugin'i güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tümünü güncelle
openclaw plugins uninstall <id>          # yapılandırma/kurulum kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş browser
Plugin'i). Diğer paketlenmiş Plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut kurulu bir Plugin'i veya hook paketini yerinde üzerine yazar. İzlenen npm
Plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Kaynak yolu, yönetilen kurulum hedefinin üzerine kopyalamak yerine yeniden kullandığı için
bu seçenek `--link` ile desteklenmez.

`plugins.allow` zaten ayarlıysa, `openclaw plugins install`
kurulan Plugin kimliğini etkinleştirmeden önce bu izin listesine ekler; böylece kurulumlar
yeniden başlatmanın ardından hemen yüklenebilir olur.

`openclaw plugins update <id-or-npm-spec>` izlenen kurulumlara uygulanır. Bir
dist-tag veya tam sürüm içeren npm paket belirtimi geçirilirse, paket adı yeniden
izlenen Plugin kaydına çözümlenir ve yeni belirtim gelecekteki güncellemeler için kaydedilir.
Sürüm olmadan paket adı geçirilirse, tam olarak sabitlenmiş bir kurulum yeniden
kayıt defterinin varsayılan yayın hattına taşınır. Kurulu npm Plugin'i zaten
çözümlenen sürümle ve kaydedilmiş yapıt kimliğiyle eşleşiyorsa, OpenClaw
indirme, yeniden kurma veya yapılandırmayı yeniden yazma yapmadan güncellemeyi atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez çünkü
marketplace kurulumları, npm belirtimi yerine marketplace kaynak meta verisini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen yanlış
pozitifler için acil durum geçersiz kılma seçeneğidir. Yerleşik `critical` bulgularına rağmen
Plugin kurulumlarının ve Plugin güncellemelerinin devam etmesine izin verir, ancak yine de
Plugin `before_install` ilke engellerini veya tarama başarısızlığı engellemesini aşmaz.

Bu CLI bayrağı yalnızca Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli Skill
bağımlılığı kurulumları bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
Skill indirme/kurulum akışı olarak kalır.

Uyumlu paketler aynı Plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Mevcut çalışma zamanı desteği; paket Skill'leri, Claude command-skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifestte bildirilen
`lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>`, paket destekli Plugin'ler için algılanan paket yeteneklerini
ve desteklenen ya da desteklenmeyen MCP ve LSP sunucu girdilerini de bildirir.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json`
dosyasındaki Claude bilinen-marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi GitHub kısa gösterimi, bir GitHub depo
URL'si ya da bir git URL'si olabilir. Uzak marketplace'lerde, Plugin girdileri
klonlanan marketplace deposunun içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) bölümüne bakın.

## Plugin API genel bakışı

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

OpenClaw giriş nesnesini yükler ve Plugin etkinleştirmesi sırasında
`register(api)` çağrısını yapar. Yükleyici eski Plugin'ler için hâlâ `activate(api)` kullanımına geri döner,
ancak paketlenmiş Plugin'ler ve yeni harici Plugin'ler `register` yöntemini
genel sözleşme olarak görmelidir.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Ne kaydeder                 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)     |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Ajan aracı                  |
| `registerHook` / `on(...)`              | Yaşam döngüsü kancaları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Akışkan STT                 |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi          |
| `registerImageGenerationProvider`       | Görsel oluşturma            |
| `registerMusicGenerationProvider`       | Müzik oluşturma             |
| `registerVideoGenerationProvider`       | Video oluşturma             |
| `registerWebFetchProvider`              | Web getirme / kazıma sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                   |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Türlendirilmiş yaşam döngüsü kancaları için kanca koruma davranışı:

- `before_tool_call`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve daha önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` etkisizdir ve daha önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve daha önceki bir iptali temizlemez.

Tam türlendirilmiş kanca davranışı için [SDK Genel Bakış](/tr/plugins/sdk-overview#hook-decision-semantics) bölümüne bakın.

## İlgili

- [Plugin Oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin Paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin Manifesti](/tr/plugins/manifest) — manifest şeması
- [Araç Kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir Plugin'e ajan araçları ekleyin
- [Plugin İç Yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeleri
