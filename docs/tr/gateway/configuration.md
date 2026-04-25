---
read_when:
    - OpenClaw'ı ilk kez ayarlama
    - Yaygın yapılandırma desenlerini arama
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırmaya genel bakış: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-25T13:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw, `~/.openclaw/openclaw.json` içinden isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json`
düzenleri, OpenClaw sahipli yazımlar için desteklenmez; atomik bir yazma işlemi
sembolik bağlantıyı korumak yerine yolun kendisini değiştirebilir. Yapılandırmayı
varsayılan durum dizini dışında tutuyorsanız, `OPENCLAW_CONFIG_PATH` değerini doğrudan gerçek dosyaya yönlendirin.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve botla kimin mesajlaşabileceğini kontrol etmek
- Modelleri, araçları, sandboxing'i veya otomasyonu ayarlamak (Cron, hook'lar)
- Oturumları, medyayı, ağ ayarlarını veya UI'yi ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırmada yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya tam kopyala-yapıştır yapılandırmalar için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## En düşük yapılandırma

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Yapılandırmayı düzenleme

<Tabs>
  <Tab title="Etkileşimli sihirbaz">
    ```bash
    openclaw onboard       # tam onboarding akışı
    openclaw configure     # yapılandırma sihirbazı
    ```
  </Tab>
  <Tab title="CLI (tek satırlık komutlar)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) adresini açın ve **Config** sekmesini kullanın.
    Control UI, kullanılabildiğinde alan
    `title` / `description` belge meta verileri ile birlikte Plugin ve kanal şemalarını da içeren canlı yapılandırma şemasından bir form oluşturur; ayrıca kaçış kapağı olarak bir **Raw JSON** düzenleyicisi sunar. Ayrıntılı inceleme
    UI'leri ve diğer araçlar için Gateway ayrıca,
    tek bir yol kapsamlı şema düğümünü ve anlık alt öğe özetlerini getirmek üzere `config.schema.lookup` sunar.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik uygular (bkz. [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, bozuk türler veya geçersiz değerler Gateway'in **başlatılmayı reddetmesine** neden olur. Tek kök düzey istisna `$schema` (string) alanıdır; böylece düzenleyiciler JSON Schema meta verisini iliştirebilir.
</Warning>

`openclaw config schema`, Control UI
ve doğrulama tarafından kullanılan kanonik JSON Schema'yı yazdırır. `config.schema.lookup`, ayrıntılı inceleme araçları için tek bir yol kapsamlı düğümü ve
alt öğe özetlerini getirir. Alan `title`/`description` belge meta verileri,
iç içe nesneler, joker (`*`), dizi öğesi (`[]`) ve `anyOf`/
`oneOf`/`allOf` dalları boyunca taşınır. Çalışma zamanı Plugin ve kanal şemaları,
manifest kayıt defteri yüklendiğinde birleştirilir.

Doğrulama başarısız olduğunda:

- Gateway başlatılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway, her başarılı başlatmadan sonra güvenilir son bilinen iyi bir kopya saklar.
Daha sonra `openclaw.json` doğrulamadan geçmezse (veya `gateway.mode` alanını kaybederse, belirgin şekilde küçülürse
ya da başına yanlışlıkla bir log satırı eklenirse), OpenClaw bozuk dosyayı
`.clobbered.*` olarak korur, son bilinen iyi kopyayı geri yükler ve kurtarma
nedenini günlüğe kaydeder. Sonraki ajan dönüşü de bir sistem olayı uyarısı alır; böylece ana
ajan geri yüklenen yapılandırmayı körü körüne yeniden yazmaz. Aday yapılandırma `***` gibi sansürlenmiş gizli yer tutucular içeriyorsa, son bilinen iyiye yükseltme atlanır.
Tüm doğrulama sorunları `plugins.entries.<id>...` kapsamıyla sınırlı olduğunda, OpenClaw
tüm dosya kurtarması yapmaz. Mevcut yapılandırmayı etkin tutar ve
bir Plugin şeması veya host sürümü uyumsuzluğu, ilgisiz kullanıcı ayarlarını geri alamayacak şekilde Plugin'e özgü hatayı gösterir.

## Yaygın görevler

<AccordionGroup>
  <Accordion title="Bir kanal kurun (WhatsApp, Telegram, Discord vb.)">
    Her kanalın `channels.<provider>` altında kendi yapılandırma bölümü vardır. Kurulum adımları için ilgili kanal sayfasına bakın:

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

    Tüm kanallar aynı DM ilkesi desenini paylaşır:

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

  <Accordion title="Modelleri seçin ve yapılandırın">
    Birincil modeli ve isteğe bağlı yedekleri ayarlayın:

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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi olarak işlev görür.
    - Mevcut modelleri kaldırmadan izin listesi girdileri eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. Girdileri kaldıracak düz değiştirmeler, siz `--replace` geçmedikçe reddedilir.
    - Model referansları `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transcript/araç görsel küçültmesini kontrol eder (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirmek için [Models CLI](/tr/concepts/models), kimlik doğrulama rotasyonu ve yedek davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/self-hosted sağlayıcılar için başvurudaki [Custom providers](/tr/gateway/config-tools#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Botla kimin mesajlaşabileceğini kontrol edin">
    DM erişimi kanal başına `dmPolicy` ile kontrol edilir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık bir eşleme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içindeki gönderenler (veya eşlenmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin verir (`allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok sayar

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listeleri kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/config-channels#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti bahsetme kapılamasını ayarlayın">
    Grup mesajları varsayılan olarak **bahsetme gerektirir**. Desenleri ajan başına yapılandırın:

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

    - **Meta veri bahsetmeleri**: yerel @-bahsetmeler (WhatsApp dokunarak bahsetme, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içindeki güvenli regex desenleri
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/config-channels#group-chat-mention-gating) bakın.

  </Accordion>

  <Accordion title="Skills'i ajan başına kısıtlayın">
    Paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından belirli
    ajanları `agents.list[].skills` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather'ı devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // Skill yok
        ],
      },
    }
    ```

    - Varsayılan olarak sınırsız Skills için `agents.defaults.skills` alanını atlayın.
    - Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
    - Hiç Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ince ayarlayın">
    Bayat görünen kanalları Gateway'in ne kadar agresif yeniden başlatacağını kontrol edin:

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

    - Genel olarak sağlık izleme yeniden başlatmalarını kapatmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi kapatmadan tek bir kanal veya hesap için otomatik yeniden başlatmaları kapatmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - Operasyonel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
    Oturumlar, konuşma sürekliliğini ve yalıtımı kontrol eder:

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
    - `threadBindings`: iş parçacığına bağlı oturum yönlendirmesi için genel varsayılanlar (Discord `/focus`, `/unfocus`, `/agents`, `/session idle` ve `/session max-age` destekler).
    - Kapsamlama, kimlik bağlantıları ve gönderim ilkesi için [Session Management](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/config-agents#session) bakın.

  </Accordion>

  <Accordion title="Sandboxing'i etkinleştirin">
    Ajan oturumlarını yalıtılmış sandbox çalışma zamanlarında çalıştırın:

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

    Önce görseli oluşturun: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/config-agents#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmî iOS derlemeleri için relay destekli push'ı etkinleştirin">
    Relay destekli push, `openclaw.json` içinde yapılandırılır.

    Gateway yapılandırmasında şunu ayarlayın:

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

    CLI eşdeğeri:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Bunun yaptığı:

    - Gateway'in `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmalarını harici relay üzerinden göndermesini sağlar.
    - Eşlenmiş iOS uygulaması tarafından iletilen kayıt kapsamlı bir gönderim izni kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Relay destekli her kaydı, iOS uygulamasının eşlendiği Gateway kimliğine bağlar; böylece başka bir Gateway kayıtlı veriyi yeniden kullanamaz.
    - Yerel/manuel iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolmuş resmî dağıtılmış derlemelere uygulanır.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için, resmî/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'siyle derlenmiş resmî/TestFlight iOS derlemesini yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` yapılandırmasını yapın.
    3. iOS uygulamasını Gateway ile eşleyin ve hem Node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması Gateway kimliğini alır, App Attest ile uygulama makbuzunu kullanarak relay'e kaydolur ve ardından relay destekli `push.apns.register` payload'unu eşlenmiş Gateway'e yayımlar.
    5. Gateway, relay tanıtıcısını ve gönderim iznini saklar; sonra bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    Operasyon notları:

    - iOS uygulamasını farklı bir Gateway'e geçirirseniz, uygulamanın o Gateway'e bağlanmış yeni bir relay kaydı yayımlayabilmesi için yeniden bağlayın.
    - Farklı bir relay dağıtımını hedefleyen yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay kaynağını yeniden kullanmak yerine önbelleğe aldığı relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici env geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback için geliştirme amaçlı bir kaçış kapağı olarak kalır; HTTP relay URL'lerini config içinde kalıcılaştırmayın.

    Uçtan uca akış için [iOS Uygulaması](/tr/platforms/ios#relay-backed-push-for-official-builds) ve relay güvenlik modeli için [Kimlik doğrulama ve güven akışı](/tr/platforms/ios#authentication-and-trust-flow) bölümlerine bakın.

  </Accordion>

  <Accordion title="Heartbeat kurun (düzenli yoklamalar)">
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
    - `directPolicy`: DM tarzı Heartbeat hedefleri için `allow` (varsayılan) veya `block`
    - Tam kılavuz için [Heartbeat](/tr/gateway/heartbeat) bölümüne bakın.

  </Accordion>

  <Accordion title="Cron işlerini yapılandırın">
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

    - `sessionRetention`: tamamlanmış yalıtılmış çalışma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve saklanan satır sayısına göre budar.
    - Özellik genel görünümü ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhooks'u (hook'lar) kurun">
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
    - Tüm hook/Webhook payload içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca üst bilgi temellidir (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrılmış bir alt yol üzerinde tutun.
    - Sıkı kapsamlı hata ayıklama yapmıyorsanız güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) devre dışı bırakılmış halde tutun.
    - `hooks.allowRequestSessionKey` etkinse, çağıran tarafından seçilen oturum anahtarlarını sınırlandırmak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook güdümlü ajanlar için, güçlü modern model katmanlarını ve sıkı araç politikasını tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma + sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çok ajanlı yönlendirmeyi yapılandırın">
    Ayrı çalışma alanları ve oturumlarla birden fazla yalıtılmış ajan çalıştırın:

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

    Bağlama kuralları ve ajan başına erişim profilleri için [Çok Ajan](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/config-agents#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden çok dosyaya bölün ($include)">
    Büyük yapılandırmaları düzenlemek için `$include` kullanın:

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
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lerden sonra birleştirilir (include edilen değerlerin üzerine yazar)
    - **İç içe include'ler**: 10 seviye derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **OpenClaw sahipli yazımlar**: yazma işlemi yalnızca
      `plugins: { $include: "./plugins.json5" }` gibi tek dosyalı bir include tarafından desteklenen üst düzey bir bölümü değiştirirse,
      OpenClaw bu include edilmiş dosyayı günceller ve `openclaw.json` dosyasını olduğu gibi bırakır
    - **Desteklenmeyen yazma aktarımı**: kök include'ler, include dizileri ve
      kardeş geçersiz kılmaları olan include'ler, config'i düzleştirmek yerine
      OpenClaw sahipli yazımlar için kapalı başarısız olur
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'ler için net hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma hot reload

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik uygular — çoğu ayar için elle yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri, doğrulanana kadar güvenilmez kabul edilir. İzleyici,
düzenleyici geçici yazma/yeniden adlandırma hareketlerinin durulmasını bekler, son dosyayı okur ve
geçersiz harici düzenlemeleri son bilinen iyi yapılandırmayı geri yükleyerek reddeder. OpenClaw sahipli
config yazımları da yazmadan önce aynı şema kapısını kullanır; `gateway.mode` alanını kaldırma veya dosyayı yarıdan fazla küçültme gibi
yıkıcı ezmeler reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Plugin'e özgü doğrulama başarısızlıkları istisnadır: tüm sorunlar
`plugins.entries.<id>...` altındaysa, yeniden yükleme `.last-good` geri yüklemek yerine mevcut config'i korur ve Plugin
sorununu bildirir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` dosyasının yanındaki eşleşen
`.clobbered.*` dosyasını inceleyin, reddedilen payload'u düzeltin, ardından
`openclaw config validate` çalıştırın. Kurtarma denetim listesi için
[Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config) bölümüne bakın.

### Yeniden yükleme kipleri

| Kip                     | Davranış                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında hot-apply eder. Kritik olanlar için otomatik yeniden başlatır. |
| **`hot`**               | Yalnızca güvenli değişiklikleri hot-apply eder. Yeniden başlatma gerektiğinde uyarı günlüğü yazar — bunu siz ele alırsınız. |
| **`restart`**           | Güvenli olsun olmasın her config değişikliğinde Gateway'i yeniden başlatır.          |
| **`off`**               | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki elle yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler hot-apply edilir, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan hot-apply edilir. `hybrid` kipinde, yeniden başlatma gerektiren değişiklikler otomatik ele alınır.

| Kategori             | Alanlar                                                           | Yeniden başlatma gerekli mi? |
| -------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Kanallar             | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve Plugin kanallar  | Hayır                        |
| Ajan ve modeller     | `agent`, `agents`, `models`, `routing`                            | Hayır                        |
| Otomasyon            | `hooks`, `cron`, `agent.heartbeat`                                | Hayır                        |
| Oturumlar ve mesajlar| `session`, `messages`                                             | Hayır                        |
| Araçlar ve medya     | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Hayır                        |
| UI ve çeşitli        | `ui`, `logging`, `identity`, `bindings`                           | Hayır                        |
| Gateway sunucusu     | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Evet**                     |
| Altyapı              | `discovery`, `canvasHost`, `plugins`                              | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunları değiştirmek yeniden başlatma tetiklemez.
</Note>

### Yeniden yükleme planlaması

`$include` ile başvurulan bir kaynak dosyayı düzenlediğinizde OpenClaw,
yeniden yüklemeyi düzleştirilmiş bellek içi görünümden değil, kaynakta yazılmış düzenden planlar.
Bu sayede hot reload kararları (hot-apply vs restart), örneğin
`plugins: { $include: "./plugins.json5" }` gibi tek bir üst düzey bölüm kendi include edilmiş dosyasında yaşasa bile öngörülebilir kalır. Kaynak düzeni belirsizse yeniden yükleme planlaması kapalı başarısız olur.

## Config RPC (programlı güncellemeler)

Gateway API üzerinden config yazan araçlar için şu akışı tercih edin:

- tek bir alt ağacı incelemek için `config.schema.lookup` (sığ şema düğümü + alt öğe
  özetleri)
- geçerli anlık görüntüyü ve `hash` değerini almak için `config.get`
- kısmi güncellemeler için `config.patch` (JSON merge patch: nesneler birleşir, `null`
  siler, diziler yer değiştirir)
- yalnızca tüm config'i değiştirmeyi amaçladığınızda `config.apply`
- açık self-update + yeniden başlatma için `update.run`

<Note>
Kontrol düzlemi yazımları (`config.apply`, `config.patch`, `update.run`),
`deviceId+clientIp` başına 60 saniyede 3 istekle sınırlandırılır. Yeniden başlatma
istekleri birleştirilir ve ardından yeniden başlatma döngüleri arasında 30 saniyelik bekleme süresi uygulanır.
</Note>

Örnek kısmi yama:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash değerini alın
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Hem `config.apply` hem de `config.patch`, `raw`, `baseHash`, `sessionKey`,
`note` ve `restartDelayMs` kabul eder. Zaten bir config mevcutsa her iki yöntem için de
`baseHash` gereklidir.

## Ortam değişkenleri

OpenClaw, üst süreçten gelen env değişkenlerini ve ayrıca şunları okur:

- geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel yedek)

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
  Etkinse ve beklenen anahtarlar ayarlanmamışsa, OpenClaw oturum açma kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

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
  Herhangi bir config string değerinde env değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca eşleşen büyük harf adları: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme sırasında hata oluşturur
- Harfi harfine çıktı için `$${VAR}` ile kaçırın
- `$include` dosyalarının içinde de çalışır
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

SecretRef ayrıntıları (`env`/`file`/`exec` için `secrets.providers` dahil) [Secrets Management](/tr/gateway/secrets) bölümündedir.
Desteklenen kimlik bilgisi yolları [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) bölümünde listelenmiştir.
</Accordion>

Tam öncelik ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Alan alan eksiksiz başvuru için **[Yapılandırma Başvurusu](/tr/gateway/configuration-reference)** bölümüne bakın.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
- [Gateway runbook](/tr/gateway)
