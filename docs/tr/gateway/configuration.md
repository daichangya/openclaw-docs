---
read_when:
    - OpenClaw'ı ilk kez kurma
    - Yaygın yapılandırma kalıplarını arama
    - Belirli yapılandırma bölümlerine gitme
summary: 'Yapılandırma genel bakışı: yaygın görevler, hızlı kurulum ve tam başvuruya bağlantılar'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-21T08:58:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Yapılandırma

OpenClaw, `~/.openclaw/openclaw.json` konumundan isteğe bağlı bir <Tooltip tip="JSON5 yorumları ve sondaki virgülleri destekler">**JSON5**</Tooltip> yapılandırması okur.

Dosya yoksa OpenClaw güvenli varsayılanları kullanır. Yapılandırma eklemek için yaygın nedenler:

- Kanalları bağlamak ve botla kimin mesajlaşabileceğini denetlemek
- Modelleri, araçları, sandboxing'i veya otomasyonu (Cron, Hook'lar) ayarlamak
- Oturumları, medyayı, ağ yapılandırmasını veya kullanıcı arayüzünü ince ayarlamak

Kullanılabilir tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference) bakın.

<Tip>
**Yapılandırmada yeni misiniz?** Etkileşimli kurulum için `openclaw onboard` ile başlayın veya eksiksiz kopyala-yapıştır yapılandırmalar için [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) kılavuzuna göz atın.
</Tip>

## Asgari yapılandırma

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
    openclaw onboard       # tam ilk kurulum akışı
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
    Control UI, canlı yapılandırma şemasından bir form oluşturur; buna alan
    `title` / `description` belge meta verileri ile mevcut olduğunda plugin ve kanal şemaları da dahildir
    ve kaçış kapağı olarak bir **Raw JSON** düzenleyicisi sunar. Ayrıntılı inceleme
    kullanıcı arayüzleri ve diğer araçlar için gateway ayrıca `config.schema.lookup` da sunar;
    bu, bir yol kapsamlı şema düğümünü ve anlık alt özetleri getirir.
  </Tab>
  <Tab title="Doğrudan düzenleme">
    `~/.openclaw/openclaw.json` dosyasını doğrudan düzenleyin. Gateway dosyayı izler ve değişiklikleri otomatik olarak uygular (bkz. [sıcak yeniden yükleme](#config-hot-reload)).
  </Tab>
</Tabs>

## Sıkı doğrulama

<Warning>
OpenClaw yalnızca şemayla tamamen eşleşen yapılandırmaları kabul eder. Bilinmeyen anahtarlar, hatalı türler veya geçersiz değerler Gateway'in **başlamayı reddetmesine** neden olur. Kök düzeyindeki tek istisna `$schema` (string) alanıdır; böylece editörler JSON Schema meta verisini ekleyebilir.
</Warning>

Şema aracı notları:

- `openclaw config schema`, Control UI ve yapılandırma doğrulamasında kullanılan JSON Schema ailesinin aynısını yazdırır.
- Bu şema çıktısını `openclaw.json` için standart makine tarafından okunabilir sözleşme olarak değerlendirin; bu genel bakış ve yapılandırma başvurusu bunu özetler.
- Alan `title` ve `description` değerleri editör ve form araçları için şema çıktısına taşınır.
- İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) girdileri, eşleşen alan belgeleri mevcut olduğunda aynı belge meta verisini devralır.
- `anyOf` / `oneOf` / `allOf` bileşim dalları da aynı belge meta verisini devralır; böylece union/intersection varyantları aynı alan yardımını korur.
- `config.schema.lookup`, bir normalleştirilmiş yapılandırma yolunu; sığ bir şema düğümünü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar ve benzer doğrulama alanları), eşleşen kullanıcı arayüzü ipucu meta verisini ve ayrıntılı inceleme araçları için anlık alt özetleri döndürür.
- Çalışma zamanı plugin/kanal şemaları, gateway geçerli manifest kayıt defterini yükleyebildiğinde birleştirilir.
- `pnpm config:docs:check`, belgelere yönelik yapılandırma temel çıktıları ile geçerli şema yüzeyi arasındaki kaymayı saptar.

Doğrulama başarısız olduğunda:

- Gateway açılmaz
- Yalnızca tanılama komutları çalışır (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Tam sorunları görmek için `openclaw doctor` çalıştırın
- Onarımları uygulamak için `openclaw doctor --fix` (veya `--yes`) çalıştırın

Gateway ayrıca başarılı bir başlangıçtan sonra güvenilir bir son-bilinen-iyi kopya da tutar. Eğer
`openclaw.json` daha sonra OpenClaw dışında değiştirilir ve artık doğrulanmazsa, başlangıç
ve sıcak yeniden yükleme bozuk dosyayı zaman damgalı bir `.clobbered.*` anlık görüntüsü olarak korur,
son-bilinen-iyi kopyayı geri yükler ve kurtarma nedeni ile belirgin bir uyarı günlüğe kaydeder.
Sonraki ana ajan dönüşü de yapılandırmanın geri yüklendiğini ve
körü körüne yeniden yazılmaması gerektiğini bildiren bir sistem olayı uyarısı alır. Son-bilinen-iyi yükseltmesi,
doğrulanmış başlangıçtan sonra ve kabul edilmiş sıcak yeniden yüklemelerden sonra güncellenir; buna
kalıcı dosya hash'i kabul edilen yazımla hâlâ eşleşen OpenClaw sahipliğindeki yapılandırma yazımları da dahildir.
Aday, `***` veya kısaltılmış token değerleri gibi redakte edilmiş gizli
yer tutucular içerdiğinde yükseltme atlanır.

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

    - `agents.defaults.models`, model kataloğunu tanımlar ve `/model` için izin listesi görevi görür.
    - Model ref'leri `provider/model` biçimini kullanır (ör. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`, transkript/araç görüntüsü küçültmeyi denetler (varsayılan `1200`); daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını azaltır.
    - Sohbette model değiştirmek için [Models CLI](/tr/concepts/models), kimlik doğrulama döndürme ve fallback davranışı için [Model Failover](/tr/concepts/model-failover) bölümüne bakın.
    - Özel/self-hosted sağlayıcılar için başvurudaki [Custom providers](/tr/gateway/configuration-reference#custom-providers-and-base-urls) bölümüne bakın.

  </Accordion>

  <Accordion title="Botla kimin mesajlaşabileceğini denetleyin">
    DM erişimi kanal başına `dmPolicy` ile denetlenir:

    - `"pairing"` (varsayılan): bilinmeyen gönderenler onay için tek kullanımlık bir eşleştirme kodu alır
    - `"allowlist"`: yalnızca `allowFrom` içinde olan gönderenler (veya eşleştirilmiş izin deposu)
    - `"open"`: tüm gelen DM'lere izin ver ( `allowFrom: ["*"]` gerektirir)
    - `"disabled"`: tüm DM'leri yok say

    Gruplar için `groupPolicy` + `groupAllowFrom` veya kanala özgü izin listelerini kullanın.

    Kanal başına ayrıntılar için [tam başvuruya](/tr/gateway/configuration-reference#dm-and-group-access) bakın.

  </Accordion>

  <Accordion title="Grup sohbeti mention geçitlemesini kurun">
    Grup mesajları varsayılan olarak **mention gerektirir**. Desenleri ajan başına yapılandırın:

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

    - **Meta veri mention'ları**: yerel @-mention'lar (WhatsApp dokunarak mention, Telegram @bot vb.)
    - **Metin desenleri**: `mentionPatterns` içindeki güvenli regex desenleri
    - Kanal başına geçersiz kılmalar ve self-chat modu için [tam başvuruya](/tr/gateway/configuration-reference#group-chat-mention-gating) bakın.

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
          { id: "writer" }, // github, weather devralır
          { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
          { id: "locked-down", skills: [] }, // Skills yok
        ],
      },
    }
    ```

    - Varsayılan olarak sınırsız Skills için `agents.defaults.skills` alanını belirtmeyin.
    - Varsayılanları devralmak için `agents.list[].skills` alanını belirtmeyin.
    - Hiç Skills olmaması için `agents.list[].skills: []` ayarlayın.
    - [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve
      [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agents-defaults-skills) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gateway kanal sağlık izlemesini ince ayarlayın">
    Gateway'in bayat görünen kanalları ne kadar agresif yeniden başlatacağını denetleyin:

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

    - Genel olarak sağlık izleme yeniden başlatmalarını devre dışı bırakmak için `gateway.channelHealthCheckMinutes: 0` ayarlayın.
    - `channelStaleEventThresholdMinutes`, denetim aralığından büyük veya ona eşit olmalıdır.
    - Genel izleyiciyi devre dışı bırakmadan tek bir kanal veya hesap için otomatik yeniden başlatmayı devre dışı bırakmak üzere `channels.<provider>.healthMonitor.enabled` veya `channels.<provider>.accounts.<id>.healthMonitor.enabled` kullanın.
    - İşletimsel hata ayıklama için [Health Checks](/tr/gateway/health), tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#gateway) bakın.

  </Accordion>

  <Accordion title="Oturumları ve sıfırlamaları yapılandırın">
    Oturumlar konuşma sürekliliğini ve yalıtımını denetler:

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
    - Kapsamlama, kimlik bağlantıları ve gönderme ilkesi için [Oturum Yönetimi](/tr/concepts/session) bölümüne bakın.
    - Tüm alanlar için [tam başvuruya](/tr/gateway/configuration-reference#session) bakın.

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

    Önce imajı oluşturun: `scripts/sandbox-setup.sh`

    Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing), tüm seçenekler için [tam başvuruya](/tr/gateway/configuration-reference#agentsdefaultssandbox) bakın.

  </Accordion>

  <Accordion title="Resmî iOS derlemeleri için relay destekli push'u etkinleştirin">
    Relay destekli push, `openclaw.json` içinde yapılandırılır.

    Bunu gateway yapılandırmasında ayarlayın:

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
    - Eşleştirilmiş iOS uygulaması tarafından iletilen, kayıt kapsamlı bir gönderim yetkisi kullanır. Gateway'in dağıtım genelinde bir relay token'ına ihtiyacı yoktur.
    - Her relay destekli kaydı, iOS uygulamasının eşleştirildiği gateway kimliğine bağlar; böylece başka bir gateway depolanan kaydı yeniden kullanamaz.
    - Yerel/el ile oluşturulmuş iOS derlemelerini doğrudan APNs üzerinde tutar. Relay destekli gönderimler yalnızca relay üzerinden kaydolan resmî dağıtılmış derlemelere uygulanır.
    - Kayıt ve gönderim trafiğinin aynı relay dağıtımına ulaşması için resmî/TestFlight iOS derlemesine gömülü relay temel URL'siyle eşleşmelidir.

    Uçtan uca akış:

    1. Aynı relay temel URL'si ile derlenmiş bir resmî/TestFlight iOS derlemesi yükleyin.
    2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini yapılandırın.
    3. iOS uygulamasını gateway ile eşleştirin ve hem node hem de operatör oturumlarının bağlanmasına izin verin.
    4. iOS uygulaması gateway kimliğini alır, App Attest ve uygulama makbuzu kullanarak relay'e kaydolur ve ardından relay destekli `push.apns.register` yükünü eşleştirilmiş gateway'e yayımlar.
    5. Gateway relay handle'ını ve gönderim yetkisini depolar, ardından bunları `push.test`, uyandırma dürtmeleri ve yeniden bağlanma uyandırmaları için kullanır.

    İşletimsel notlar:

    - iOS uygulamasını farklı bir gateway'e geçirirseniz, uygulamayı yeniden bağlayın ki bu gateway'e bağlı yeni bir relay kaydı yayımlayabilsin.
    - Farklı bir relay dağıtımına işaret eden yeni bir iOS derlemesi yayımlarsanız, uygulama eski relay origin'ini yeniden kullanmak yerine önbelleğe alınmış relay kaydını yeniler.

    Uyumluluk notu:

    - `OPENCLAW_APNS_RELAY_BASE_URL` ve `OPENCLAW_APNS_RELAY_TIMEOUT_MS` geçici ortam değişkeni geçersiz kılmaları olarak hâlâ çalışır.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`, yalnızca loopback için bir geliştirme kaçış kapağı olarak kalır; HTTP relay URL'lerini yapılandırmada kalıcı hâle getirmeyin.

    Uçtan uca akış için [iOS App](/tr/platforms/ios#relay-backed-push-for-official-builds), relay güvenlik modeli için [Authentication and trust flow](/tr/platforms/ios#authentication-and-trust-flow) bölümüne bakın.

  </Accordion>

  <Accordion title="Heartbeat'ı kurun (periyodik check-in'ler)">
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

    - `sessionRetention`: tamamlanan yalıtılmış çalıştırma oturumlarını `sessions.json` içinden budar (varsayılan `24h`; devre dışı bırakmak için `false` ayarlayın).
    - `runLog`: `cron/runs/<jobId>.jsonl` dosyasını boyuta ve saklanan satır sayısına göre budar.
    - Özellik genel bakışı ve CLI örnekleri için [Cron işleri](/tr/automation/cron-jobs) bölümüne bakın.

  </Accordion>

  <Accordion title="Webhook'ları kurun (Hook'lar)">
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
    - Tüm hook/Webhook yük içeriklerini güvenilmeyen girdi olarak değerlendirin.
    - Ayrı bir `hooks.token` kullanın; paylaşılan Gateway token'ını yeniden kullanmayın.
    - Hook kimlik doğrulaması yalnızca üst bilgi tabanlıdır (`Authorization: Bearer ...` veya `x-openclaw-token`); sorgu dizesi token'ları reddedilir.
    - `hooks.path`, `/` olamaz; Webhook girişini `/hooks` gibi ayrı bir alt yolda tutun.
    - Güvenli olmayan içerik atlama bayraklarını (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sıkı kapsamlı hata ayıklama yapmıyorsanız devre dışı bırakılmış tutun.
    - `hooks.allowRequestSessionKey` özelliğini etkinleştirirseniz, çağıranın seçtiği oturum anahtarlarını sınırlamak için `hooks.allowedSessionKeyPrefixes` de ayarlayın.
    - Hook güdümlü ajanlar için güçlü modern model katmanlarını ve sıkı araç ilkesini tercih edin (örneğin mümkün olduğunda yalnızca mesajlaşma artı sandboxing).

    Tüm eşleme seçenekleri ve Gmail entegrasyonu için [tam başvuruya](/tr/gateway/configuration-reference#hooks) bakın.

  </Accordion>

  <Accordion title="Çoklu ajan yönlendirmesini yapılandırın">
    Ayrı çalışma alanları ve oturumlarla birden çok yalıtılmış ajan çalıştırın:

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

    Bağlama kuralları ve ajan başına erişim profilleri için [Çoklu Ajan](/tr/concepts/multi-agent) ve [tam başvuruya](/tr/gateway/configuration-reference#multi-agent-routing) bakın.

  </Accordion>

  <Accordion title="Yapılandırmayı birden çok dosyaya bölün (`$include`)">
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

    - **Tek dosya**: içeren nesnenin yerini alır
    - **Dosya dizisi**: sırayla derinlemesine birleştirilir (sonraki kazanır)
    - **Kardeş anahtarlar**: include'lardan sonra birleştirilir (include edilen değerleri geçersiz kılar)
    - **İç içe include'lar**: en fazla 10 düzey derinliğe kadar desteklenir
    - **Göreli yollar**: include eden dosyaya göre çözülür
    - **Hata işleme**: eksik dosyalar, ayrıştırma hataları ve döngüsel include'lar için net hatalar

  </Accordion>
</AccordionGroup>

## Yapılandırma sıcak yeniden yükleme

Gateway, `~/.openclaw/openclaw.json` dosyasını izler ve değişiklikleri otomatik olarak uygular — çoğu ayar için el ile yeniden başlatma gerekmez.

Doğrudan dosya düzenlemeleri doğrulanana kadar güvenilmeyen kabul edilir. İzleyici,
editör geçici yazma/yeniden adlandırma dalgalanmasının yatışmasını bekler, son dosyayı okur ve
son-bilinen-iyi yapılandırmayı geri yükleyerek geçersiz harici düzenlemeleri reddeder. OpenClaw sahipliğindeki
yapılandırma yazımları da yazmadan önce aynı şema kapısını kullanır; `gateway.mode` alanını
kaldırmak veya dosyayı yarıdan fazla küçültmek gibi yıkıcı clobber'lar reddedilir
ve inceleme için `.rejected.*` olarak kaydedilir.

Günlüklerde `Config auto-restored from last-known-good` veya
`config reload restored last-known-good config` görürseniz, `openclaw.json` yanındaki ilgili
`.clobbered.*` dosyasını inceleyin, reddedilen yükü düzeltin, sonra
`openclaw config validate` çalıştırın. Kurtarma kontrol listesi için [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config)
bölümüne bakın.

### Yeniden yükleme modları

| Mod                    | Davranış                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (varsayılan) | Güvenli değişiklikleri anında sıcak uygular. Kritik olanlar için otomatik olarak yeniden başlatır. |
| **`hot`**              | Yalnızca güvenli değişiklikleri sıcak uygular. Yeniden başlatma gerektiğinde bir uyarı günlüğe kaydeder — bunu siz yönetirsiniz. |
| **`restart`**          | Güvenli olsun olmasın her yapılandırma değişikliğinde Gateway'i yeniden başlatır.       |
| **`off`**              | Dosya izlemeyi devre dışı bırakır. Değişiklikler bir sonraki el ile yeniden başlatmada etkili olur. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Neler sıcak uygulanır, neler yeniden başlatma gerektirir

Çoğu alan kesinti olmadan sıcak uygulanır. `hybrid` modunda, yeniden başlatma gerektiren değişiklikler otomatik olarak ele alınır.

| Kategori             | Alanlar                                                              | Yeniden başlatma gerekir mi? |
| -------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Kanallar             | `channels.*`, `web` (WhatsApp) — tüm yerleşik ve extension kanalları | Hayır                        |
| Ajan ve modeller     | `agent`, `agents`, `models`, `routing`                               | Hayır                        |
| Otomasyon            | `hooks`, `cron`, `agent.heartbeat`                                   | Hayır                        |
| Oturumlar ve mesajlar| `session`, `messages`                                                | Hayır                        |
| Araçlar ve medya     | `tools`, `browser`, `skills`, `audio`, `talk`                        | Hayır                        |
| UI ve çeşitli        | `ui`, `logging`, `identity`, `bindings`                              | Hayır                        |
| Gateway sunucusu     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Evet**                     |
| Altyapı              | `discovery`, `canvasHost`, `plugins`                                 | **Evet**                     |

<Note>
`gateway.reload` ve `gateway.remote` istisnadır — bunların değiştirilmesi yeniden başlatmayı tetiklemez.
</Note>

## Yapılandırma RPC'si (programatik güncellemeler)

<Note>
Control plane yazma RPC'leri (`config.apply`, `config.patch`, `update.run`) her `deviceId+clientIp` için **60 saniyede 3 istek** ile oran sınırlıdır. Sınıra ulaşıldığında RPC, `retryAfterMs` ile `UNAVAILABLE` döndürür.
</Note>

Güvenli/varsayılan akış:

- `config.schema.lookup`: sığ bir
  şema düğümü, eşleşen ipucu meta verisi ve anlık alt özetlerle bir yol kapsamlı yapılandırma alt ağacını inceleyin
- `config.get`: geçerli anlık görüntüyü + hash'i alın
- `config.patch`: tercih edilen kısmi güncelleme yolu
- `config.apply`: yalnızca tam yapılandırma değiştirme
- `update.run`: açık öz güncelleme + yeniden başlatma

Tüm yapılandırmayı değiştirmiyorsanız `config.schema.lookup`
ardından `config.patch` tercih edin.

<AccordionGroup>
  <Accordion title="config.apply (tam değiştirme)">
    Tam yapılandırmayı doğrular + yazar ve Gateway'i tek adımda yeniden başlatır.

    <Warning>
    `config.apply`, **tüm yapılandırmanın** yerini alır. Kısmi güncellemeler için `config.patch`, tek anahtarlar için `openclaw config set` kullanın.
    </Warning>

    Parametreler:

    - `raw` (string) — tüm yapılandırma için JSON5 yükü
    - `baseHash` (isteğe bağlı) — `config.get` içinden gelen yapılandırma hash'i (yapılandırma varsa gereklidir)
    - `sessionKey` (isteğe bağlı) — yeniden başlatma sonrası uyandırma ping'i için oturum anahtarı
    - `note` (isteğe bağlı) — yeniden başlatma sentinel'i için not
    - `restartDelayMs` (isteğe bağlı) — yeniden başlatma öncesi gecikme (varsayılan 2000)

    Bir tanesi zaten beklemede/uçuş hâlindeyken yeniden başlatma istekleri birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bir bekleme süresi uygulanır.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash değerini alın
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (kısmi güncelleme)">
    Kısmi bir güncellemeyi mevcut yapılandırmayla birleştirir (JSON merge patch semantiği):

    - Nesneler özyinelemeli olarak birleştirilir
    - `null` bir anahtarı siler
    - Diziler yer değiştirir

    Parametreler:

    - `raw` (string) — yalnızca değişecek anahtarları içeren JSON5
    - `baseHash` (gerekli) — `config.get` içinden gelen yapılandırma hash'i
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply` ile aynı

    Yeniden başlatma davranışı `config.apply` ile eşleşir: bekleyen yeniden başlatmalar birleştirilir ve yeniden başlatma döngüleri arasında 30 saniyelik bir bekleme süresi uygulanır.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

OpenClaw, üst süreçten gelen ortam değişkenlerini ve ayrıca şunları okur:

- Geçerli çalışma dizinindeki `.env` (varsa)
- `~/.openclaw/.env` (genel fallback)

Bu dosyaların hiçbiri mevcut ortam değişkenlerini geçersiz kılmaz. Yapılandırmada satır içi ortam değişkenleri de ayarlayabilirsiniz:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Kabuk ortamı içe aktarma (isteğe bağlı)">
  Etkinleştirilirse ve beklenen anahtarlar ayarlı değilse, OpenClaw giriş kabuğunuzu çalıştırır ve yalnızca eksik anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Ortam değişkeni eşdeğeri: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Yapılandırma değerlerinde ortam değişkeni ikamesi">
  Herhangi bir yapılandırma string değerinde `${VAR_NAME}` ile ortam değişkenlerine başvurun:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Kurallar:

- Yalnızca eşleşen büyük harfli adlar: `[A-Z_][A-Z0-9_]*`
- Eksik/boş değişkenler yükleme zamanında hata verir
- Gerçek çıktı için `$${VAR}` ile kaçış yapın
- `$include` dosyalarının içinde de çalışır
- Satır içi ikame: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Tam öncelik sırası ve kaynaklar için [Environment](/tr/help/environment) bölümüne bakın.

## Tam başvuru

Tam alan alan başvuru için bkz. **[Yapılandırma Başvurusu](/tr/gateway/configuration-reference)**.

---

_İlgili: [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) · [Doctor](/tr/gateway/doctor)_
