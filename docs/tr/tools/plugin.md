---
read_when:
    - Plugin'leri yükleme veya yapılandırma
    - Plugin keşfini ve yükleme kurallarını anlama
    - Codex/Claude uyumlu plugin paketleriyle çalışma
sidebarTitle: Install and Configure
summary: OpenClaw plugin'lerini yükleyin, yapılandırın ve yönetin
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-23T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin'ler

Plugin'ler, OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses,
medya anlama, görsel oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı plugin'ler **çekirdek**tir (OpenClaw ile birlikte gelir), bazıları ise
**harici**dir (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
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

Sohbet tabanlı kontrolü tercih ediyorsanız, `commands.plugins: true` ayarını etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Yükleme yolu, CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya çıplak paket tanımı (önce ClawHub, sonra npm yedeği).

Yapılandırma geçersizse, yükleme normalde güvenli şekilde başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, eklentiye açıkça katılan plugin'ler için
dar kapsamlı bir paketlenmiş plugin yeniden yükleme yoludur:
`openclaw.install.allowInvalidConfigRecovery`.

Paketlenmiş OpenClaw kurulumları, birlikte gelen her plugin'in
çalışma zamanı bağımlılık ağacını önceden yüklemez. Birlikte gelen, OpenClaw'a ait bir plugin
plugin yapılandırması, eski kanal yapılandırması veya varsayılan olarak etkin bir manifest üzerinden etkin olduğunda,
başlangıç yalnızca o plugin'in bildirilen çalışma zamanı bağımlılıklarını
içe aktarmadan önce onarır. Harici plugin'ler ve özel yükleme yolları yine de
`openclaw plugins install` ile yüklenmelidir.

## Plugin türleri

OpenClaw iki plugin biçimini tanır:

| Biçim      | Nasıl çalışır                                                     | Örnekler                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + çalışma zamanı modülü; işlem içinde çalışır | Resmi plugin'ler, topluluk npm paketleri               |
| **Bundle** | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir  | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için bkz. [Plugin Paketleri](/tr/plugins/bundles).

Bir Native plugin yazıyorsanız, [Plugin Geliştirme](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Resmi plugin'ler

### Yüklenebilir (npm)

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

  <Accordion title="Bellek plugin'leri">
    - `memory-core` — paketlenmiş bellek araması (`plugins.slots.memory` aracılığıyla varsayılan)
    - `memory-lancedb` — istek üzerine yüklenen uzun süreli bellek, otomatik geri çağırma/yakalama ile (`plugins.slots.memory = "memory-lancedb"` ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` Gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı kontrol hizmeti için paketlenmiş tarayıcı plugin'i (varsayılan olarak etkin; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf plugin'ler mi arıyorsunuz? Bkz. [Topluluk Plugin'leri](/tr/plugins/community).

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

| Alan             | Açıklama                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                          |
| `allow`          | Plugin izin listesi (isteğe bağlı)                        |
| `deny`           | Plugin engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`     | Ek plugin dosyaları/dizinleri                             |
| `slots`          | Ayrıcalıklı slot seçicileri (örn. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin başına açma/kapama + yapılandırma                  |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + işlem içi yeniden başlatma etkin şekilde çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı tamamlandıktan kısa süre sonra otomatik olarak gerçekleştirilir.

<Accordion title="Plugin durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: plugin vardır ama etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşif sırasında bulunmayan bir plugin kimliğine başvurur.
  - **Geçersiz**: plugin vardır ama yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw plugin'leri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı plugin'leri">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel plugin'ler">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş plugin'ler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm plugin'leri devre dışı bırakır
- `plugins.deny` her zaman `allow`'a üstün gelir
- `plugins.entries.\<id\>.enabled: false` o plugin'i devre dışı bırakır
- Çalışma alanı kaynaklı plugin'ler **varsayılan olarak devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketlenmiş plugin'ler, üzerine yazılmadıkça yerleşik varsayılan açık kümesini izler
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

| Slot            | Ne kontrol eder       | Varsayılan          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin'i  | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru   | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklü plugin'ler
openclaw plugins list --verbose            # plugin başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # ayrıntılı inceleme
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
openclaw plugins install <spec> --pin      # tam çözümlenmiş npm tanımını kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # bir plugin'i güncelle
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tümünü güncelle
openclaw plugins uninstall <id>          # yapılandırma/yükleme kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş plugin'ler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş browser
plugin'i). Diğer paketlenmiş plugin'ler için yine de `openclaw plugins enable <id>` gerekir.

`--force`, mevcut yüklü bir plugin'in veya hook paketinin üzerine yerinde yazar. İzlenen npm
plugin'lerinin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` kullanın.
Kaynak yolu yönetilen yükleme hedefine kopyalamak yerine yeniden kullanan `--link` ile
desteklenmez.

`plugins.allow` zaten ayarlıysa, `openclaw plugins install`
yüklü plugin kimliğini etkinleştirmeden önce o izin listesine ekler; böylece yüklemeler
yeniden başlatmadan sonra hemen yüklenebilir olur.

`openclaw plugins update <id-or-npm-spec>`, izlenen yüklemeler için geçerlidir. Dist-tag veya tam sürüm içeren
bir npm paket tanımı geçirmek, paket adını yeniden izlenen plugin kaydına çözümler ve
gelecekteki güncellemeler için yeni tanımı kaydeder.
Sürüm belirtilmeden paket adını geçirmek, tam sabitlenmiş bir yüklemeyi yeniden
kayıt defterinin varsayılan sürüm hattına taşır. Yüklü npm plugin'i zaten çözümlenen sürümle
ve kaydedilmiş yapıt kimliğiyle eşleşiyorsa, OpenClaw güncellemeyi
indirmeden, yeniden yüklemeden veya yapılandırmayı yeniden yazmadan atlar.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez; çünkü
marketplace yüklemeleri npm tanımı yerine marketplace kaynak meta verisini saklar.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısının yanlış
pozitifleri için kullanılan acil durum geçersiz kılma seçeneğidir. Plugin yüklemelerinin
ve plugin güncellemelerinin yerleşik `critical` bulgularını aşarak devam etmesine izin verir, ancak yine de
plugin `before_install` ilke engellerini veya tarama başarısızlığı kaynaklı engellemeyi atlamaz.

Bu CLI bayrağı yalnızca plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill
bağımlılığı yüklemeleri bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
skill indirme/yükleme akışı olarak kalır.

Uyumlu paketler de aynı plugin listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Geçerli çalışma zamanı desteği; paket Skills, Claude command-skills,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifestte bildirilen
`lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>`, paket destekli plugin'ler için algılanan paket yeteneklerini ve
desteklenen veya desteklenmeyen MCP ve LSP sunucu girişlerini de raporlar.

Marketplace kaynakları, `~/.claude/plugins/known_marketplaces.json` içindeki bir Claude bilinen-marketplace adı,
yerel bir marketplace kökü veya `marketplace.json` yolu,
`owner/repo` gibi bir GitHub kısa gösterimi, bir GitHub depo
URL'si ya da bir git URL'si olabilir. Uzak marketplace'lerde plugin girdileri,
klonlanan marketplace deposunun içinde kalmalı ve yalnızca göreli yol kaynaklarını kullanmalıdır.

Tüm ayrıntılar için [`openclaw plugins` CLI başvurusuna](/tr/cli/plugins) bakın.

## Plugin API genel bakışı

Native plugin'ler, `register(api)` sunan bir giriş nesnesi dışa aktarır. Daha eski
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

OpenClaw giriş nesnesini yükler ve plugin
etkinleştirmesi sırasında `register(api)` çağırır. Yükleyici eski plugin'ler için hâlâ `activate(api)` yöntemine geri döner,
ancak birlikte gelen plugin'ler ve yeni harici plugin'ler
`register`'ı genel sözleşme olarak ele almalıdır.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Ne kaydeder                |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)    |
| `registerChannel`                       | Sohbet kanalı              |
| `registerTool`                          | Aracı aracı                |
| `registerHook` / `on(...)`              | Yaşam döngüsü kancaları    |
| `registerSpeechProvider`                | Metinden konuşmaya / STT   |
| `registerRealtimeTranscriptionProvider` | Akışlı STT                 |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görsel/ses analizi         |
| `registerImageGenerationProvider`       | Görsel oluşturma           |
| `registerMusicGenerationProvider`       | Müzik oluşturma            |
| `registerVideoGenerationProvider`       | Video oluşturma            |
| `registerWebFetchProvider`              | Web getirme / kazıma sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                  |
| `registerHttpRoute`                     | HTTP uç noktası            |
| `registerCommand` / `registerCli`       | CLI komutları              |
| `registerContextEngine`                 | Bağlam motoru              |
| `registerService`                       | Arka plan hizmeti          |

Türlendirilmiş yaşam döngüsü kancaları için kanca koruma davranışı:

- `before_tool_call`: `{ block: true }` kesindir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` kesindir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` kesindir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali temizlemez.

Türlendirilmiş kanca davranışının tamamı için bkz. [SDK Genel Bakış](/tr/plugins/sdk-overview#hook-decision-semantics).

## İlgili

- [Plugin Geliştirme](/tr/plugins/building-plugins) — kendi plugin'inizi oluşturun
- [Plugin Paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Plugin Manifesti](/tr/plugins/manifest) — manifest şeması
- [Araç Kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir plugin içinde aracı araçları ekleyin
- [Plugin İç Yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Plugin'leri](/tr/plugins/community) — üçüncü taraf listeleri
