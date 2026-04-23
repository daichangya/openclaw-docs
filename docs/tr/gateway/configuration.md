---
read_when:
    - OpenClaw'ı ilk kez kurma
    - Yaygın yapılandırma kalıplarını arama
    - Belirli config bölümlerine gitme
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-23T09:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Yapılandırma

OpenClaw isteğe bağlı bir <Tooltip tip="JSON5 comments ve trailing comma destekler">**JSON5**</Tooltip> config dosyasını `~/.openclaw/openclaw.json` konumundan okur.
Etkin config yolu normal bir dosya olmalıdır. Symlink verilmiş `openclaw.json`
düzenleri OpenClaw'ın sahip olduğu yazımlar için desteklenmez; atomik bir yazım
symlink'i korumak yerine yolu değiştirebilir. Config'i varsayılan
durum dizininin dışında tutuyorsanız `OPENCLAW_CONFIG_PATH` değişkenini doğrudan gerçek dosyaya yöneltin.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Config eklemenin yaygın nedenleri:

- Kanalları bağlamak ve bot'a kimin mesaj gönderebileceğini denetlemek
- Modelleri, tools'ları, sandboxing'i veya otomasyonu ayarlamak (Cron, hooks)
- Oturumları, medyayı, ağı veya UI'ı ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırmaya yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya tam kopyala-yapıştır config'ler için [Configuration Examples](/tr/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## En düşük config

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Config düzenleme

<Tabs>
  <Tab title="Etkileşimli sihirbaz">
    ```bash
    openclaw onboard       # tam ilk kurulum akışı
    openclaw configure     # config sihirbazı
    ```
  </Tab>
  <Tab title="CLI (tek satırlıklar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, canlı config şemasından, alan
    `title` / `description` belge meta verisi ile Plugin ve kanal şemaları dahil,
    kullanılabildiğinde bir form üretir; kaçış yolu olarak da bir **Raw JSON** düzenleyicisi vardır. Ayrıntılı
    UI'lar ve diğer araçlar için gateway ayrıca
    tek bir yol kapsamlı şema düğümünü ve hemen alt özetlerini almak üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik uygular (bkz. [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, bozuk türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Tek kök düzey istisna `$schema`'dır (string), böylece editörler JSON Schema meta verisi ekleyebilir.
</Warning>

`openclaw config schema`, Control UI
ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır. `config.schema.lookup`, ayrıntılı araçlar için tek bir yol kapsamlı düğümü ve
alt özetlerini getirir. Alan `title`/`description` belge meta verisi
iç içe nesneler, joker karakter (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca korunur. Çalışma zamanı Plugin ve kanal şemaları
manifest kayıt defteri yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir bir son-bilinen-iyi kopya tutar.
`openclaw.json` daha sonra doğrulamayı geçemezse (veya `gateway.mode` değerini düşürürse, keskin biçimde
küçülürse ya da başına başıboş bir günlük satırı eklenirse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son-bilinen-iyi kopyayı geri yükler ve kurtarma
nedenini günlüğe yazar. Sonraki agent turu da bir sistem olayı uyarısı alır; böylece ana
agent geri yüklenen config'i körlemesine yeniden yazmaz. Son-bilinen-iyiye terfi,
bir aday `***` gibi gizlenmiş gizli yer tutucular içerdiğinde atlanır.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurma (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi config bölümü vardır. Kurulum adımları için ilgili kanal sayfasına bakın:

    - [WhatsApp](/tr/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/tr/channels/telegram) — `channels.telegram`
    - [Discord](/tr/channels/discord) — `channels.discord`
    - [Feishu](/tr/channels/feishu) — `channels.feishu`
    - [Google Chat](/tr/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/tr/channels/msteams) — `channels.msteams`
    - [Slack](/tr/channels/slack) — `channels.slack`
    - [Signal](/tr/channels/signal) — `channels.signal`
    - [iMessage](/tr/channels/imessage) — `channels.imessage`
    - [Mattermost](/tr/channels/mattermost) — `channels.mattermost`

    Tüm kanallar aynı DM ilkesi kalıbını paylaşır:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // yalnızca allowlist/open için
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelleri seçme ve yapılandırma">
    Birincil modeli ve isteğe bağlı fallback'leri ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için allowlist işlevi görür.
    - Mevcut modelleri kaldırmadan allowlist girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değişimler, `--replace` geçmedikçe reddedilir.
    - Model başvuruları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/tool görsel küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genelde ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını azaltır.
    - Sohbette model değiştirme için [Models CLI](/tr/concepts/models), auth döndürme ve fallback davranışı için [Model Failover](/tr/concepts/model-failover) sayfalarına bakın.
    - Özel/kendi kendine barındırılan sağlayıcılar için başvurudaki [Custom providers](/tr/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Bot'a kimin mesaj gönderebileceğini denetleme">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen göndericiler onaylanacak tek kullanımlık eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü allowlist'leri kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçitlemesini kurma">
    Grup mesajları varsayılan olarak **mention gerektirir**. Kalıpları agent başına yapılandırın:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadata mention'ları**: yerel @-mention'lar (WhatsApp dokun-bahset, Telegram @bot vb.)
    - **Metin kalıpları**: `mentionPatterns` içindeki güvenli regex kalıpları
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/configuration-reference#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Agent başına Skills kısıtlama">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, sonra belirli
    agent'ları `agents.list[].skills` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanları değiştirir
          { id: "locked-down", skills: [] }, // skill yok
        ],
      },
    }
    ```

    - Varsayılan olarak kısıtsız Skills için `agents.defaults.skills` alanını atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
    - Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Configuration Reference](/tr/gateway/configuration-reference#agents-defaults-skills) sayfalarına bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ince ayarlama">
    Bayat görünen kanalları gateway'in ne kadar agresif biçimde yeniden başlatacağını denetleyin:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Sağlık izleme yeniden başlatmalarını genel olarak devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya eşit olmalıdır.
    - Genel izleyiciyi kapatmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları kapatmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - İşlemsel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırma">
    Oturumlar konuşma sürekliliğini ve yalıtımı denetler:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // çok kullanıcılı için önerilir
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (paylaşılan) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: thread'e bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderme ilkesi için [Session Management](/tr/concepts/session) sayfasına bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing etkinleştirme">
    Agent oturumlarını yalıtılmış sandbox çalışma zamanlarında çalıştırın:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Önce imajı oluşturun: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmi iOS derlemeleri için relay destekli push etkinleştirme">
    Relay destekli push `openclaw.json` içinde yapılandırılır.

    Bunu gateway config'inde ayarlayın:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // İsteğe bağlı. Varsayılan: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Eşdeğer CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı:

    - Gateway'in dış relay üzerinden `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları göndermesini sağlar.
    - Eşleştirilmiş iOS uygulaması tarafından iletilen kayıt kapsamlı bir gönderme izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway saklanan kaydı yeniden kullanamaz.
    - Yerel/elle derlenmiş iOS yapılarını doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kayıt olmuş resmi dağıtılmış derlemeler için geçerlidir.
    - Resmi/TestFlight iOS derlemesine gömülü relay temel URL'si ile eşleşmelidir; böylece kayıt ve gönderim trafiği aynı relay dağıtımına ulaşır.

    Uçtan uca akış:

    1. Aynı relay temel URL'si ile derlenmiş resmi/TestFlight iOS derlemesini kurun.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
    3. iOS uygulamasını gateway ile eşleştirin ve hem Node hem de operator oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini alır, App Attest ile uygulama makbuzunu kullanarak relay'e kaydolur, ardından relay destekli `push.apns.register` payload'unu eşleştirilmiş gateway'e yayınlar.
    5. Gateway relay tanıtıcısını ve gönderme iznini saklar, sonra bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    İşletim notları:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamayı yeniden bağlayın ki o gateway'e bağlı yeni bir relay kaydı yayımlayabilsin.
    - Farklı bir relay dağıtımını işaret eden yeni bir iOS derlemesi yayınlarsanız uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` hâlâ geçici env geçersiz kılmaları olarak çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` yalnızca local loopback için geliştirme amaçlı bir kaçış yoludur; HTTP relay URL'lerini config içinde kalıcılaştırmayın.

    Uçtan uca akış için [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow) sayfalarına bakın.

  </Accordion>

  <Accordion title="Heartbeat kurma (periyodik check-in'ler)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: süre dizesi (`30m`, `2h`). Devre dışı bırakmak için `0m` ayarlayın.
    - `target`: `last` | `none` | `<channel-id>` (örneğin `discord`, `matrix`, `telegram` veya `whatsapp`)
    - `directPolicy`: DM tarzı heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) sayfasına bakın.

  </Accordion>

  <Accordion title="Cron işleri yapılandırma">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: tamamlanan yalıtılmış çalıştırma oturumlarını `sessions.json` dosyasından budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyut ve tutulan satırlara göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron jobs](/tr/automation/cron-jobs) sayfasına bakın.

  </Accordion>

  <Accordion title="Webhook'ları kurma (hooks)">
    Gateway üzerinde HTTP Webhook uç noktalarını etkinleştirin:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Güvenlik notu:
    - Tüm hook/Webhook payload içeriğini güvenilmez girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook auth yalnızca başlıktandır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrılmış bir alt yolda tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik atlatma bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış tutun.
    - `hooks.allowRequestSessionKey` etkinleştirirseniz çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook tarafından sürülen agent'lar için güçlü modern model katmanlarını ve sıkı tool ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma artı sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok agent'lı yönlendirmeyi yapılandırma">
    Ayrı çalışma alanları ve oturumlarla birden çok yalıtılmış agent çalıştırın:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Bağlama kuralları ve agent başına erişim profilleri için [Multi-Agent](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/configuration-reference#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Config'i birden çok dosyaya bölme ($include)">
    Büyük config'leri düzenlemek için `$include` kullanın:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Tek dosya**: kapsayan nesnenin yerini alır
    - **Dosya dizisi**: sırayla derin birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: 10 düzey derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **OpenClaw sahipli yazımlar**: bir yazım yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include ile desteklenen üst düzey bir bölümü değiştirirse,
      OpenClaw o include edilen dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen write-through**: kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar
      config'i düzleştirmek yerine OpenClaw sahipli yazımlarda güvenli şekilde başarısız olur
    - **Hata işleme**: eksik dosyalar, parse hataları ve döngüsel include'lar için açık hatalar

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik uygular — çoğu ayar için elle yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmez kabul edilir. İzleyici,
editör geçici yazma/yeniden adlandırma hareketlerinin sakinleşmesini bekler, son dosyayı okur ve
son-bilinen-iyi config'i geri yükleyerek geçersiz dış düzenlemeleri reddeder. OpenClaw sahipli
config yazımları da yazmadan önce aynı şema kapısını kullanır; `gateway.mode` değerini düşürmek veya dosyayı yarıdan fazla küçültmek gibi yıkıcı bozulmalar reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki eşleşen
`.clobbered.*` dosyasını inceleyin, reddedilen payload'u düzeltin, sonra
`openclaw config validate` çalıştırın. Kurtarma denetim listesi için [Gateway troubleshooting](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config)
sayfasına bakın.

### Yeniden yükleme modları

| Mod                   | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot-apply eder. Kritik olanlar için otomatik yeniden başlatır.           |
| **`hot`**              | Yalnızca güvenli değişiklikleri hot-apply eder. Yeniden başlatma gerektiğinde uyarı günlüğü yazar — bunu siz ele alırsınız. |
| **`restart`**          | Güvenli olsun olmasın her config değişikliğinde Gateway'i yeniden başlatır.                                 |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler sonraki elle yeniden başlatmada etkili olur.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler hot-apply olur, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan hot-apply olur. `hybrid` modunda yeniden başlatma gerektiren değişiklikler otomatik işlenir.

| Kategori            | Alanlar                                                            | Yeniden başlatma gerekir mi? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanallar            | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanalları | Hayır              |
| Agent ve modeller      | `agent`, `agents`, `models`, `routing`                            | Hayır              |
| Otomasyon          | `hooks`, `cron`, `agent.heartbeat`                                | Hayır              |
| Oturumlar ve mesajlar | `session`, `messages`                                             | Hayır              |
| Tools ve medya       | `tools`, `browser`, `skills`, `audio`, `talk`                     | Hayır              |
| UI ve çeşitli           | `ui`, `logging`, `identity`, `bindings`                           | Hayır              |
| Gateway sunucusu      | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Evet**         |
| Altyapı      | `discovery`, `canvasHost`, `plugins`                              | **Evet**         |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek **yeniden başlatma** tetiklemez.
</Note>

### Yeniden yükleme planlama

`$include` aracılığıyla başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış düzenden planlar.
Bu, `plugins: { $include: "./plugins.json5" }` gibi
tek bir üst düzey bölüm kendi include dosyasında yaşasa bile hot-reload kararlarını (hot-apply veya restart) öngörülebilir tutar. Kaynak düzeni belirsizse yeniden yükleme planlaması güvenli şekilde başarısız olur.

## Config RPC (programatik güncellemeler)

Gateway API üzerinden config yazan araçlar için şu akışı tercih edin:

- bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt
  özetler)
- geçerli snapshot ve `hash` almak için `config.get`
- kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleşir, `null`
  siler, diziler değişir)
- yalnızca tüm config'i değiştirmek niyetindeyseniz `config.apply`
- açık self-update + restart için `update.run`

<Note>
Control-plane yazımları (`config.apply`, `config.patch`, `update.run`)
`deviceId+clientIp` başına 60 saniyede 3 istek ile hız sınırına tabidir. Restart
istekleri birleştirilir ve ardından restart döngüleri arasında 30 saniyelik bekleme süresi uygulanır.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash değerini yakalayın
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem `config.patch`, `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Zaten bir
config varsa her iki yöntem için de `baseHash` gereklidir.

## Ortam değişkenleri

OpenClaw env değişkenlerini üst süreçten ve ayrıca şuralardan okur:

- geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel fallback)

Hiçbiri mevcut env değişkenlerini geçersiz kılmaz. Config içinde satır içi env değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk env içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlanmamışsa OpenClaw giriş kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Config değerlerinde env değişkeni yerine koyma">
  `${VAR_NAME}` ile herhangi bir config string değerinde env değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca şu kalıba uyan büyük harfli adlar eşleşir: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata verir
- Düz çıktı için `$${VAR}` ile kaçırın
- `$include` dosyalarında çalışır
- Satır içi yerine koyma: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef'ler (env, file, exec)">
  SecretRef nesnelerini destekleyen alanlar için şunları kullanabilirsiniz:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Secrets Management](/tr/gateway/secrets) içinde yer alır.
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) içinde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için [Environment](/tr/help/environment) sayfasına bakın.

## Tam başvuru

Alan alan tam başvuru için **[Configuration Reference](/tr/gateway/configuration-reference)** sayfasına bakın.

---

_İlgili: [Configuration Examples](/tr/gateway/configuration-examples) · [Configuration Reference](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_
