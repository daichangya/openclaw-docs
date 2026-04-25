---
read_when:
    - Plugin yükleme veya yapılandırma
    - Plugin keşfi ve yükleme kurallarını anlama
    - Codex/Claude uyumlu plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw pluginlerini yükleyin, yapılandırın ve yönetin
title: Pluginler
x-i18n:
    generated_at: "2026-04-25T13:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

OpenClaw pluginleri yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
aracı koşumları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
ses, medya anlama, görüntü üretimi, video üretimi, web getirme, web
arama ve daha fazlası. Bazı pluginler **çekirdek**tir (OpenClaw ile birlikte gelir), diğerleri
**harici**dir (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Neyin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir plugin yükleyin">
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

Sohbet yerel denetimi tercih ediyorsanız `commands.plugins: true` etkinleştirin ve şunu kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Yükleme yolu CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya yalın paket belirtimi (önce ClawHub, sonra npm geri dönüşü).

Yapılandırma geçersizse, yükleme normalde kapalı şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şu özelliğe katılan pluginler için dar kapsamlı bir paketlenmiş plugin
yeniden yükleme yoludur:
`openclaw.install.allowInvalidConfigRecovery`.

Paketlenmiş OpenClaw kurulumları, her paketlenmiş pluginin
çalışma zamanı bağımlılık ağacını hevesli biçimde yüklemez. Paketlenmiş bir OpenClaw sahipli plugin,
plugin yapılandırması, eski kanal yapılandırması veya varsayılan etkin manifestten etkinse,
başlangıç yalnızca bu pluginin bildirilen çalışma zamanı bağımlılıklarını içe aktarmadan önce onarır.
Açık devre dışı bırakma yine de önceliklidir: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` ve `channels.<id>.enabled: false`
bu plugin/kanal için otomatik paketlenmiş çalışma zamanı bağımlılığı onarımını önler.
Harici pluginler ve özel yükleme yolları yine de
`openclaw plugins install` üzerinden yüklenmelidir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                    | Örnekler                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Yerel**  | `openclaw.plugin.json` + çalışma zamanı modülü; süreç içinde yürütülür | Resmî pluginler, topluluk npm paketleri                |
| **Paket**  | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için bkz. [Plugin Paketleri](/tr/plugins/bundles).

Yerel bir plugin yazıyorsanız, [Plugin Oluşturma](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakışı](/tr/plugins/sdk-overview) ile başlayın.

## Resmî pluginler

### Yüklenebilir (npm)

| Plugin          | Paket                 | Dokümanlar                           |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/tr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/tr/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/tr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/tr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/tr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/tr/plugins/zalouser)   |

### Çekirdek (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek pluginleri">
    - `memory-core` — paketlenmiş bellek araması (varsayılan olarak `plugins.slots.memory` üzerinden)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı yüklenen uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` olarak ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — browser aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, browser çalışma zamanı ve varsayılan browser denetim hizmeti için paketlenmiş browser plugini (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf plugin mi arıyorsunuz? Bkz. [Topluluk Pluginleri](/tr/plugins/community).

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

| Alan             | Açıklama                                                |
| ---------------- | ------------------------------------------------------- |
| `enabled`        | Ana açma/kapama anahtarı (varsayılan: `true`)           |
| `allow`          | Plugin allowlist'i (isteğe bağlı)                       |
| `deny`           | Plugin denylist'i (isteğe bağlı; deny kazanır)          |
| `load.paths`     | Ek plugin dosyaları/dizinleri                           |
| `slots`          | Özel slot seçicileri (ör. `memory`, `contextEngine`)    |
| `entries.\<id\>` | Plugin başına açma/kapama + yapılandırma                |

Yapılandırma değişiklikleri **gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + süreç içi yeniden başlatma etkin olarak çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı gerçekleştikten kısa süre sonra otomatik olarak yapılır.
Yerel plugin çalışma zamanı kodu veya yaşam döngüsü
kancaları için desteklenen bir hot-reload yolu yoktur; güncellenmiş `register(api)` kodunun, `api.on(...)` kancalarının, araçların, hizmetlerin veya
sağlayıcı/çalışma zamanı kancalarının çalışmasını beklemeden önce canlı kanalı sunan Gateway sürecini
yeniden başlatın.

`openclaw plugins list`, yerel bir CLI/yapılandırma anlık görüntüsüdür. Orada bir pluginin `loaded`
olması, o CLI çağrısının gördüğü yapılandırma/dosyalardan pluginin keşfedilebilir ve yüklenebilir olduğu anlamına gelir.
Bu, zaten çalışan uzak bir Gateway alt sürecinin
aynı plugin koduyla yeniden başladığını kanıtlamaz. Sarmalayıcı süreçli
VPS/kapsayıcı kurulumlarında yeniden başlatmaları gerçek `openclaw gateway run` sürecine gönderin veya
çalışan Gateway'e karşı `openclaw gateway restart` kullanın.

<Accordion title="Plugin durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: plugin vardır ama etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir plugin kimliğine başvurur.
  - **Geçersiz**: plugin vardır ama yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw pluginleri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı pluginleri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel pluginler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş pluginler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm pluginleri devre dışı bırakır
- `plugins.deny`, allow üzerinde her zaman kazanır
- `plugins.entries.\<id\>.enabled: false` o plugini devre dışı bırakır
- Çalışma alanı kaynaklı pluginler varsayılan olarak **devre dışıdır** (açıkça etkinleştirilmeleri gerekir)
- Paketlenmiş pluginler, geçersiz kılınmadıkça yerleşik varsayılan-açık kümesini izler
- Özel slotlar, o slot için seçilen plugini zorla etkinleştirebilir
- Bazı paketlenmiş isteğe bağlı pluginler, yapılandırma plugin sahipli bir
  yüzeyi adlandırdığında otomatik olarak etkinleştirilir; örneğin sağlayıcı model başvurusu, kanal yapılandırması veya koşum
  çalışma zamanı
- OpenAI ailesi Codex yolları ayrı plugin sınırlarını korur:
  `openai-codex/*` OpenAI pluginine aittir, paketlenmiş Codex
  uygulama sunucusu plugini ise `embeddedHarness.runtime: "codex"` veya eski
  `codex/*` model başvuruları ile seçilir

## Çalışma zamanı kancalarında sorun giderme

Bir plugin `plugins list` içinde görünmesine rağmen `register(api)` yan etkileri veya kancaları
canlı sohbet trafiğinde çalışmıyorsa önce şunları kontrol edin:

- `openclaw gateway status --deep --require-rpc` çalıştırın ve etkin
  Gateway URL'si, profil, yapılandırma yolu ve sürecin düzenlediğiniz olanlar olduğunu doğrulayın.
- Plugin yükleme/yapılandırma/kod değişikliklerinden sonra canlı Gateway'i yeniden başlatın. Sarmalayıcı
  kapsayıcılarda PID 1 yalnızca bir denetleyici olabilir; alt
  `openclaw gateway run` sürecini yeniden başlatın veya sinyal gönderin.
- Kanca kayıtlarını ve
  tanılamayı doğrulamak için `openclaw plugins inspect <id> --json` kullanın. `llm_input`,
  `llm_output` ve `agent_end` gibi paketlenmemiş konuşma kancaları için
  `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.
- Model değiştirme için `before_model_resolve` tercih edin. Aracı turları için model
  çözümlemeden önce çalışır; `llm_output` ise yalnızca bir model denemesi
  asistan çıktısı ürettikten sonra çalışır.
- Etkin oturum modelinin kanıtı için `openclaw sessions` veya
  Gateway oturum/durum yüzeylerini kullanın ve sağlayıcı yüklerinde hata ayıklarken
  Gateway'i `--raw-stream --raw-stream-path <path>` ile başlatın.

## Plugin slotları (özel kategoriler)

Bazı kategoriler özeldir (aynı anda yalnızca biri etkin olabilir):

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

| Slot            | Denetlediği şey      | Varsayılan          |
| --------------- | -------------------- | ------------------- |
| `memory`        | Active Memory plugini  | `memory-core`     |
| `contextEngine` | Etkin bağlam motoru  | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklü pluginler
openclaw plugins list --verbose            # plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # filo genelinde tablo
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılama

openclaw plugins install <package>         # yükle (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan yükle
openclaw plugins install <spec> --force    # mevcut yüklemenin üzerine yaz
openclaw plugins install <path>            # yerel yoldan yükle
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm belirtimini kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # bir plugini güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # hepsini güncelle
openclaw plugins uninstall <id>          # yapılandırma/yükleme kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş pluginler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş browser
plugini). Diğer paketlenmiş pluginler ise yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut yüklü bir pluginin veya kanca paketinin üzerine yerinde yazar. İzlenen npm
pluginlerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Bu seçenek `--link` ile desteklenmez; `--link`, yönetilen bir yükleme hedefine
kopyalamak yerine kaynak yolu yeniden kullanır.

`plugins.allow` zaten ayarlıysa `openclaw plugins install`,
yüklü plugin kimliğini etkinleştirmeden önce bu allowlist'e ekler; böylece kurulumlar
yeniden başlatmadan sonra hemen yüklenebilir hale gelir.

`openclaw plugins update <id-or-npm-spec>`, izlenen yüklemelere uygulanır.
Bir dist-tag veya tam sürüm içeren npm paket belirtimi geçirilmesi, paket adını
izlenen plugin kaydına geri çözümler ve gelecekteki güncellemeler için yeni belirtimi kaydeder.
Sürüm içermeyen paket adı geçirilmesi, tam sabitlenmiş bir yüklemeyi yeniden
kayıt defterinin varsayılan yayın hattına taşır. Yüklü npm plugini zaten
çözümlenmiş sürüm ve kaydedilmiş yapıt kimliğiyle eşleşiyorsa OpenClaw, indirme,
yeniden yükleme veya yapılandırma yeniden yazımı yapmadan güncellemeyi atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
marketplace yüklemeleri bir npm belirtimi yerine marketplace kaynak meta verisini kalıcı hale getirir.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısından gelen
yanlış pozitifler için son çare geçersiz kılmasıdır. Yerleşik `critical` bulgularına rağmen plugin yükleme
ve plugin güncellemelerinin devam etmesine izin verir, ancak yine de plugin `before_install` ilke engellerini
veya tarama-hatası engellemesini aşmaz.

Bu CLI bayrağı yalnızca plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill
bağımlılık yüklemeleri bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
skill indirme/yükleme akışı olarak kalır.

Uyumlu paketler aynı plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Mevcut çalışma zamanı desteği şunları içerir: paket Skills, Claude komut-Skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifestte bildirilen
`lspServers` varsayılanları, Cursor komut-Skills ve uyumlu Codex kanca
dizinleri.

`openclaw plugins inspect <id>`, ayrıca tespit edilen paket yeteneklerini ve
paket destekli pluginler için desteklenen veya desteklenmeyen MCP ve LSP sunucu girdilerini raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json`
içinden Claude tarafından bilinen bir marketplace adı, yerel bir marketplace kökü veya
`marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo
URL'si veya bir git URL'si olabilir. Uzak marketplace'ler için plugin girdileri
klonlanan marketplace deposu içinde kalmalı ve yalnızca göreli yol kaynakları kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/tr/cli/plugins) sayfasına bakın.

## Plugin API genel bakışı

Yerel pluginler `register(api)` sunan bir giriş nesnesi dışa aktarır. Daha eski
pluginler hâlâ eski takma ad olarak `activate(api)` kullanabilir, ancak yeni pluginler
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

OpenClaw giriş nesnesini yükler ve plugin
etkinleştirme sırasında `register(api)` çağırır. Yükleyici eski pluginler için hâlâ `activate(api)` değerine geri düşer,
ancak paketlenmiş pluginler ve yeni harici pluginler `register` yöntemini
genel sözleşme olarak ele almalıdır.

`api.registrationMode`, bir plugine girişinin neden yüklendiğini söyler:

| Mod             | Anlamı                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Çalışma zamanı etkinleştirmesi. Araçları, kancaları, hizmetleri, komutları, rotaları ve diğer canlı yan etkileri kaydedin.     |
| `discovery`     | Salt okunur yetenek keşfi. Sağlayıcıları ve meta verileri kaydedin; güvenilen plugin giriş kodu yüklenebilir, ancak canlı yan etkileri atlayın. |
| `setup-only`    | Hafif bir setup entry üzerinden kanal kurulum meta verisi yükleme.                                                              |
| `setup-runtime` | Çalışma zamanı girişine de ihtiyaç duyan kanal kurulum yüklemesi.                                                                |
| `cli-metadata`  | Yalnızca CLI komut meta verisi toplama.                                                                                          |

Soketler, veritabanları, arka plan çalışanları veya uzun ömürlü
istemciler açan plugin girişleri bu yan etkileri
`api.registrationMode === "full"` ile korumalıdır.
Keşif yüklemeleri, etkinleştirme yüklemelerinden ayrı önbelleğe alınır ve çalışan Gateway kayıt defterinin yerini almaz.
Keşif, etkinleştirmeyen bir işlemdir; içe aktarmasız değildir:
OpenClaw anlık görüntüyü oluşturmak için güvenilen plugin girişini veya kanal plugin modülünü değerlendirebilir.
Modül üst düzeylerini hafif ve yan etkisiz tutun; ağ
istemcilerini, alt süreçleri, dinleyicileri, kimlik bilgisi okumalarını ve hizmet başlatmayı
tam çalışma zamanı yollarının arkasına taşıyın.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Kaydettiği şey              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)     |
| `registerChannel`                       | Sohbet kanalı               |
| `registerTool`                          | Aracı aracı                 |
| `registerHook` / `on(...)`              | Yaşam döngüsü kancaları     |
| `registerSpeechProvider`                | Metinden konuşmaya / STT    |
| `registerRealtimeTranscriptionProvider` | Akış STT                    |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi         |
| `registerImageGenerationProvider`       | Görüntü üretimi             |
| `registerMusicGenerationProvider`       | Müzik üretimi               |
| `registerVideoGenerationProvider`       | Video üretimi               |
| `registerWebFetchProvider`              | Web getirme / scrape sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                   |
| `registerHttpRoute`                     | HTTP uç noktası             |
| `registerCommand` / `registerCli`       | CLI komutları               |
| `registerContextEngine`                 | Bağlam motoru               |
| `registerService`                       | Arka plan hizmeti           |

Türlendirilmiş yaşam döngüsü kancaları için kanca koruma davranışı:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali temizlemez.

Yerel Codex uygulama sunucusu, köprü Codex-yerel araç olaylarını bu
kanca yüzeyine geri çalıştırır. Pluginler yerel Codex araçlarını `before_tool_call` ile engelleyebilir,
sonuçları `after_tool_call` ile gözlemleyebilir ve Codex
`PermissionRequest` onaylarına katılabilir. Köprü, Codex-yerel araç
argümanlarını henüz yeniden yazmaz. Tam Codex çalışma zamanı destek sınırı
[Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde bulunur.

Tam türlendirilmiş kanca davranışı için bkz. [SDK genel bakışı](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins) — kendi plugininizi oluşturun
- [Plugin paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin manifesti](/tr/plugins/manifest) — manifest şeması
- [Araç kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir plugine aracı araçları ekleyin
- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli ve yükleme işlem hattı
- [Topluluk pluginleri](/tr/plugins/community) — üçüncü taraf listeler
