---
read_when:
    - '`openclaw onboard` için ayrıntılı davranışa ihtiyacınız var'
    - Onboarding sonuçlarında hata ayıklıyorsunuz veya onboarding istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve iç bileşenler için tam başvuru
title: CLI kurulum başvurusu
x-i18n:
    generated_at: "2026-04-25T13:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Bu sayfa `openclaw onboard` için tam başvurudur.
Kısa kılavuz için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Sihirbazın yaptığı işler

Yerel mod (varsayılan) sizi şu konularda yönlendirir:

- Model ve kimlik doğrulama kurulumu (OpenAI Code abonelik OAuth, Anthropic Claude CLI veya API anahtarı; ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve bootstrap dosyaları
- Gateway ayarları (port, bind, auth, Tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles ve diğer paketlenmiş kanal plugin'leri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup klasörü geri dönüşüyle yerel Windows Scheduled Task)
- Sağlık kontrolü
- Skills kurulumu

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.
Uzak host üzerinde hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırmanın algılanması">
    - `~/.openclaw/openclaw.json` varsa Keep, Modify veya Reset seçin.
    - Sihirbazı yeniden çalıştırmak, açıkça Reset seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset`, varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Reset, `trash` kullanır ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)
  </Step>
  <Step title="Model ve kimlik doğrulama">
    - Tam seçenek matrisi [Kimlik doğrulama ve model seçenekleri](#auth-and-model-options) bölümündedir.
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - İlk çalıştırma bootstrap ritüeli için gereken çalışma alanı dosyalarını yerleştirir.
    - Çalışma alanı düzeni: [Agent workspace](/tr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu ve Tailscale görünürlüğü için istemde bulunur.
    - Önerilen: yerel WS istemcilerinin kimlik doğrulaması yapmasını zorunlu kılmak için loopback için bile token kimlik doğrulamasını etkin bırakın.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Parola modunda etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding işlem ortamında boş olmayan bir ortam değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Kimlik doğrulamayı yalnızca tüm yerel süreçlere tamamen güveniyorsanız devre dışı bırakın.
    - Loopback dışı bind'ler yine de kimlik doğrulama gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR oturum açma
    - [Telegram](/tr/channels/telegram): bot token'ı
    - [Discord](/tr/channels/discord): bot token'ı
    - [Google Chat](/tr/channels/googlechat): hizmet hesabı JSON'u + Webhook audience
    - [Mattermost](/tr/channels/mattermost): bot token'ı + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için önerilir; sunucu URL'si + parola + Webhook
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi
    - DM güvenliği: varsayılan pairing'dir. İlk DM bir kod gönderir; bunu
      `openclaw pairing approve <channel> <code>` ile onaylayın veya allowlist kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açılmış kullanıcı oturumu gerektirir; headless kullanım için özel bir LaunchDaemon kullanın (paketlenmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, gateway'in oturum kapatıldıktan sonra da çalışması için `loginctl enable-linger <user>` denemesi yapar.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Task oluşturma reddedilirse OpenClaw, kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır.
      - Scheduled Task'lar daha iyi supervisor durumu sundukları için tercih edilmeye devam eder.
    - Runtime seçimi: Node (önerilir; WhatsApp ve Telegram için gereklidir). Bun önerilmez.
  </Step>
  <Step title="Sağlık kontrolü">
    - Gateway'i başlatır (gerekiyorsa) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal probları dahil canlı gateway sağlık probunu durum çıktısına ekler.
  </Step>
  <Step title="Skills">
    - Kullanılabilir Skills'leri okur ve gereksinimleri kontrol eder.
    - Node yöneticisini seçmenizi sağlar: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.
  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz tarayıcı açmak yerine Control UI için SSH port yönlendirme talimatlarını yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeyi dener; geri dönüş `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak mod ayrıntıları

Uzak mod, bu makineyi başka bir yerdeki bir gateway'e bağlanacak şekilde yapılandırır.

<Info>
Uzak mod, uzak host üzerinde hiçbir şey kurmaz veya değiştirmez.
</Info>

Ayarladığınız şeyler:

- Uzak gateway URL'si (`ws://...`)
- Uzak gateway kimlik doğrulaması gerekiyorsa token (önerilir)

<Note>
- Gateway yalnızca loopback ise SSH tünelleme veya bir tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, ardından daemon kullanımına uygun şekilde kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarlı değilse veya zaten OpenAI ailesindense `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleme)">
    Kısa ömürlü bir cihaz koduyla tarayıcı eşleme akışı.

    Model ayarlı değilse veya zaten OpenAI ailesindense `agents.defaults.model` değerini `openai-codex/gpt-5.5` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından kimlik bilgisini auth profillerinde saklar.

    Model ayarlı değilse, `openai/*` ise veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI'ı bir model sağlayıcısı olarak yapılandırır.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenizi sağlar.
    Kurulum URL'si: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API anahtarı (genel)">
    Anahtarı sizin için saklar.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Hesap kimliği, gateway kimliği ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Yapılandırma otomatik yazılır. Host edilen varsayılan `MiniMax-M2.7`'dir; API anahtarı kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya küresel uç noktalardaki standart StepFun ya da Step Plan için otomatik yazılır.
    Standard şu anda `step-3.5-flash`, Step Plan ise ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic uyumlu)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud ve yerel açık modeller)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` ister.
    `Cloud only`, `https://ollama.com` ile `OLLAMA_API_KEY` kullanır.
    Host destekli modlar temel URL ister (varsayılan `http://127.0.0.1:11434`), kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, ayrıca o Ollama host'unun cloud erişimi için oturum açıp açmadığını da kontrol eder.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli onboarding, diğer sağlayıcı API anahtarı akışlarıyla aynı API anahtarı depolama seçeneklerini destekler:
    - **API anahtarını şimdi yapıştır** (düz metin)
    - **Gizli başvuru kullan** (ortam başvurusu veya yapılandırılmış sağlayıcı başvurusu; ön kontrol doğrulamasıyla)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırmadan bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Onboarding bir sağlayıcı kimlik doğrulama seçeneğiyle başladığında model seçici otomatik olarak o sağlayıcıyı tercih eder. Volcengine ve BytePlus için aynı tercih, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş kalacaksa seçici, hiç model göstermemek yerine tam kataloğa geri döner.
- Sihirbaz bir model kontrolü çalıştırır ve yapılandırılmış model bilinmiyorsa veya kimlik doğrulaması eksikse uyarı verir.

Kimlik bilgisi ve profil yolları:

- Auth profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama modu:

- Varsayılan onboarding davranışı, API anahtarlarını auth profillerinde düz metin değerler olarak kalıcı hale getirir.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine başvuru modunu etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni başvurusu (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - sağlayıcı takma adı + kimliğiyle yapılandırılmış sağlayıcı başvurusu (`file` veya `exec`)
- Etkileşimli başvuru modu, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Ortam başvuruları: değişken adını + geçerli onboarding ortamındaki boş olmayan değeri doğrular.
  - Sağlayıcı başvuruları: sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözümler.
  - Ön kontrol başarısız olursa onboarding hatayı gösterir ve yeniden denemenizi sağlar.
- Etkileşimsiz modda `--secret-input-mode ref` yalnızca ortam desteklidir.
  - Sağlayıcı ortam değişkenini onboarding işlem ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) o ortam değişkeninin ayarlanmış olmasını gerektirir; aksi halde onboarding hızlıca başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` modu, `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak saklar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` ayarlı değilse hızlıca başarısız olur.
- Gateway auth kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token modu: **Düz metin token oluştur/sakla** (varsayılan) veya **SecretRef kullan**.
  - Parola modu: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Headless ve sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, ardından
o agent'ın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) gateway host'una kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve iç bileşenler

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `--skip-bootstrap` geçirildiğinde `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlanmamışsa bunu varsayılan olarak `"coding"` yapar; mevcut açık değerler korunur)
- `gateway.*` (mod, bind, auth, Tailscale)
- `session.dmScope` (yerel onboarding, ayarlanmamışsa bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında isteğe bağlı olarak etkinleştirdiğinizde kanal allowlist'leri (Slack, Discord, Matrix, Microsoft Teams) mümkün olduğunda adlar kimliklere çözülür
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırma daha sonra yine de `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

<Note>
Bazı kanallar plugin olarak sunulur. Kurulum sırasında seçildiğinde sihirbaz,
kanal yapılandırmasından önce plugin'in kurulmasını ister (npm veya yerel yol).
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), onboarding mantığını yeniden uygulamadan adımları render edebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altına kaydeder
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM yapıları Java 21 gerektirir
- Kullanılabildiğinde yerel yapılar kullanılır
- Windows, WSL2 kullanır ve WSL içindeki Linux signal-cli akışını izler

## İlgili belgeler

- Onboarding merkezi: [Onboarding (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Automation](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
