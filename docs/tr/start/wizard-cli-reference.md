---
read_when:
    - '`openclaw onboard` için ayrıntılı davranışa ihtiyacınız var'
    - Onboarding sonuçlarını ayıklıyor veya onboarding istemcilerini entegre ediyorsunuz
sidebarTitle: CLI reference
summary: CLI kurulum akışı, kimlik doğrulama/model kurulumu, çıktılar ve dahili yapı için tam başvuru
title: CLI Kurulum Başvurusu
x-i18n:
    generated_at: "2026-04-23T09:11:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI Kurulum Başvurusu

Bu sayfa `openclaw onboard` için tam başvurudur.
Kısa rehber için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Sihirbaz ne yapar

Yerel kip (varsayılan) sizi şu konularda yönlendirir:

- Model ve kimlik doğrulama kurulumu (OpenAI Code aboneliği OAuth, Anthropic Claude CLI veya API anahtarı, ayrıca MiniMax, GLM, Ollama, Moonshot, StepFun ve AI Gateway seçenekleri)
- Çalışma alanı konumu ve bootstrap dosyaları
- Gateway ayarları (port, bind, kimlik doğrulama, tailscale)
- Kanallar ve sağlayıcılar (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles ve diğer bundled kanal Plugin'leri)
- Daemon kurulumu (LaunchAgent, systemd kullanıcı birimi veya Startup-folder geri dönüşlü yerel Windows Scheduled Task)
- Sağlık denetimi
- Skills kurulumu

Uzak kip, bu makineyi başka yerdeki bir Gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Yerel akış ayrıntıları

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` varsa Keep, Modify veya Reset seçin.
    - Sihirbazı yeniden çalıştırmak, siz açıkça Reset seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
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
    - İlk çalıştırma bootstrap ritüeli için gereken çalışma alanı dosyalarını tohumlar.
    - Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Port, bind, auth mode ve tailscale açığa çıkarma için sorular sorar.
    - Önerilen: yerel WS istemcilerinin de kimlik doğrulaması yapması için loopback'te bile token kimlik doğrulamasını etkin tutun.
    - Token kipinde, etkileşimli kurulum şunları sunar:
      - **Düz metin token oluştur/depol a** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
    - Password kipinde, etkileşimli kurulum düz metin veya SecretRef depolamayı da destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding süreç ortamında boş olmayan bir env değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Yalnızca her yerel sürece tamamen güveniyorsanız kimlik doğrulamayı devre dışı bırakın.
    - Loopback olmayan bind'ler yine de kimlik doğrulama gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi
    - [Telegram](/tr/channels/telegram): bot token'ı
    - [Discord](/tr/channels/discord): bot token'ı
    - [Google Chat](/tr/channels/googlechat): service account JSON + Webhook audience
    - [Mattermost](/tr/channels/mattermost): bot token'ı + temel URL
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması
    - [BlueBubbles](/tr/channels/bluebubbles): iMessage için önerilir; sunucu URL'si + parola + Webhook
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi
    - DM güvenliği: varsayılan eşleştirmedir. İlk DM bir kod gönderir; bunu
      `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listeleri kullanın.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış kullanıcı oturumu gerektirir; başsız kullanım için özel bir LaunchDaemon kullanın (gönderilmez).
    - Linux ve WSL2 üzerinden Windows: systemd kullanıcı birimi
      - Sihirbaz, Gateway'in oturum kapatıldıktan sonra da açık kalması için `loginctl enable-linger <user>` çalıştırmayı dener.
      - Sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - Yerel Windows: önce Scheduled Task
      - Görev oluşturma reddedilirse OpenClaw kullanıcı başına Startup-folder giriş öğesine geri döner ve Gateway'i hemen başlatır.
      - Scheduled Task'lar daha iyi supervisor durumu sağladıkları için tercih edilmeye devam eder.
    - Çalışma zamanı seçimi: Node (önerilir; WhatsApp ve Telegram için gereklidir). Bun önerilmez.
  </Step>
  <Step title="Sağlık denetimi">
    - Gateway'i başlatır (gerekiyorsa) ve `openclaw health` çalıştırır.
    - `openclaw status --deep`, desteklendiğinde kanal yoklamaları dahil canlı Gateway sağlık yoklamasını durum çıktısına ekler.
  </Step>
  <Step title="Skills">
    - Kullanılabilir Skills'i okur ve gereksinimleri denetler.
    - Düğüm yöneticisini seçmenize izin verir: npm, pnpm veya bun.
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS üzerinde Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - iOS, Android ve macOS uygulama seçenekleri dahil özet ve sonraki adımlar.
  </Step>
</Steps>

<Note>
GUI algılanmazsa sihirbaz tarayıcı açmak yerine Control UI için SSH port yönlendirme talimatları yazdırır.
Control UI varlıkları eksikse sihirbaz bunları derlemeyi dener; geri dönüş `pnpm ui:build` olur (UI bağımlılıklarını otomatik kurar).
</Note>

## Uzak kip ayrıntıları

Uzak kip, bu makineyi başka yerdeki bir Gateway'e bağlanacak şekilde yapılandırır.

<Info>
Uzak kip, uzak ana makinede hiçbir şey kurmaz veya değiştirmez.
</Info>

Ayarladıklarınız:

- Uzak Gateway URL'si (`ws://...`)
- Uzak Gateway kimlik doğrulaması gerekiyorsa token (önerilir)

<Note>
- Gateway yalnızca loopback ise SSH tünelleme veya bir tailnet kullanın.
- Keşif ipuçları:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Kimlik doğrulama ve model seçenekleri

<AccordionGroup>
  <Accordion title="Anthropic API anahtarı">
    Varsa `ANTHROPIC_API_KEY` kullanır veya anahtar ister, ardından daemon kullanımı için kaydeder.
  </Accordion>
  <Accordion title="OpenAI Code aboneliği (OAuth)">
    Tarayıcı akışı; `code#state` yapıştırın.

    Model ayarsızsa veya `openai/*` ise `agents.defaults.model` değerini `openai-codex/gpt-5.4` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI Code aboneliği (cihaz eşleştirme)">
    Kısa ömürlü cihaz kodu ile tarayıcı eşleştirme akışı.

    Model ayarsızsa veya `openai/*` ise `agents.defaults.model` değerini `openai-codex/gpt-5.4` olarak ayarlar.

  </Accordion>
  <Accordion title="OpenAI API anahtarı">
    Varsa `OPENAI_API_KEY` kullanır veya anahtar ister, ardından kimlik bilgisini auth profillerinde depolar.

    Model ayarsızsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` olarak ayarlar.

  </Accordion>
  <Accordion title="xAI (Grok) API anahtarı">
    `XAI_API_KEY` ister ve xAI'ı model sağlayıcısı olarak yapılandırır.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ister ve Zen veya Go kataloğunu seçmenizi sağlar.
    Kurulum URL'si: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API anahtarı (genel)">
    Anahtarı sizin için depolar.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Hesap kimliği, Gateway kimliği ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Yapılandırma otomatik yazılır. Barındırılan varsayılan `MiniMax-M2.7`'dir; API anahtarı kurulumu
    `minimax/...`, OAuth kurulumu ise `minimax-portal/...` kullanır.
    Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Yapılandırma, Çin veya küresel uç noktalarda standart StepFun veya Step Plan için otomatik yazılır.
    Standart şu anda `step-3.5-flash` içerir ve Step Plan ayrıca `step-3.5-flash-2603` içerir.
    Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-uyumlu)">
    `SYNTHETIC_API_KEY` ister.
    Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud ve yerel açık modeller)">
    Önce `Cloud + Local`, `Cloud only` veya `Local only` sorar.
    `Cloud only`, `https://ollama.com` ile `OLLAMA_API_KEY` kullanır.
    Ana makine destekli kipler temel URL'yi sorar (varsayılan `http://127.0.0.1:11434`), kullanılabilir modelleri keşfeder ve varsayılanlar önerir.
    `Cloud + Local`, ayrıca bu Ollama ana makinesinin bulut erişimi için oturum açıp açmadığını da denetler.
    Daha fazla ayrıntı: [Ollama](/tr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot ve Kimi Coding">
    Moonshot (Kimi K2) ve Kimi Coding yapılandırmaları otomatik yazılır.
    Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot).
  </Accordion>
  <Accordion title="Özel sağlayıcı">
    OpenAI uyumlu ve Anthropic uyumlu uç noktalarla çalışır.

    Etkileşimli onboarding, diğer sağlayıcı API anahtarı akışlarıyla aynı API anahtarı depolama seçeneklerini destekler:
    - **Şimdi API anahtarını yapıştır** (düz metin)
    - **Gizli başvuru kullan** (ön kontrol doğrulamasıyla env başvurusu veya yapılandırılmış sağlayıcı başvurusu)

    Etkileşimsiz bayraklar:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (isteğe bağlı; `CUSTOM_API_KEY` değerine geri döner)
    - `--custom-provider-id` (isteğe bağlı)
    - `--custom-compatibility <openai|anthropic>` (isteğe bağlı; varsayılan `openai`)

  </Accordion>
  <Accordion title="Atla">
    Kimlik doğrulamayı yapılandırılmamış bırakır.
  </Accordion>
</AccordionGroup>

Model davranışı:

- Algılanan seçeneklerden varsayılan modeli seçin veya sağlayıcı ve modeli elle girin.
- Onboarding bir sağlayıcı kimlik doğrulama seçeneğinden başladığında model seçici
  o sağlayıcıyı otomatik olarak tercih eder. Volcengine ve BytePlus için aynı tercih
  onların coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Bu tercih edilen sağlayıcı filtresi boş olursa seçici, hiç model göstermemek yerine tam kataloğa geri döner.
- Sihirbaz bir model denetimi çalıştırır ve yapılandırılmış model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

Kimlik bilgisi ve profil yolları:

- Auth profilleri (API anahtarları + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski OAuth içe aktarma: `~/.openclaw/credentials/oauth.json`

Kimlik bilgisi depolama kipi:

- Varsayılan onboarding davranışı, API anahtarlarını auth profillerinde düz metin değerler olarak kalıcılaştırır.
- `--secret-input-mode ref`, düz metin anahtar depolama yerine başvuru kipini etkinleştirir.
  Etkileşimli kurulumda şunlardan birini seçebilirsiniz:
  - ortam değişkeni başvurusu (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - yapılandırılmış sağlayıcı başvurusu (`file` veya `exec`) sağlayıcı takma adı + kimlik ile
- Etkileşimli başvuru kipi, kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır.
  - Env başvuruları: değişken adını + geçerli onboarding ortamındaki boş olmayan değeri doğrular.
  - Sağlayıcı başvuruları: sağlayıcı yapılandırmasını doğrular ve istenen kimliği çözümler.
  - Ön kontrol başarısız olursa onboarding hatayı gösterir ve yeniden denemenize izin verir.
- Etkileşimsiz kipte `--secret-input-mode ref` yalnızca env desteklidir.
  - Sağlayıcı env değişkenini onboarding süreç ortamında ayarlayın.
  - Satır içi anahtar bayrakları (örneğin `--openai-api-key`) bu env değişkeninin ayarlanmış olmasını gerektirir; aksi halde onboarding hızlıca başarısız olur.
  - Özel sağlayıcılar için etkileşimsiz `ref` kipi `models.providers.<id>.apiKey` değerini `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` olarak depolar.
  - Bu özel sağlayıcı durumunda `--custom-api-key`, `CUSTOM_API_KEY` ayarlı değilse hızlıca başarısız olur.
- Gateway kimlik doğrulama kimlik bilgileri, etkileşimli kurulumda düz metin ve SecretRef seçeneklerini destekler:
  - Token kipi: **Düz metin token oluştur/depol a** (varsayılan) veya **SecretRef kullan**.
  - Password kipi: düz metin veya SecretRef.
- Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
- Mevcut düz metin kurulumları değişmeden çalışmaya devam eder.

<Note>
Başsız ve sunucu ipucu: OAuth işlemini tarayıcısı olan bir makinede tamamlayın, ardından
o ajanın `auth-profiles.json` dosyasını (örneğin
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
`$OPENCLAW_STATE_DIR/...` yolu) Gateway ana makinesine kopyalayın. `credentials/oauth.json`
yalnızca eski bir içe aktarma kaynağıdır.
</Note>

## Çıktılar ve dahili yapı

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarsızsa bunu varsayılan olarak `"coding"` yapar; mevcut açık değerler korunur)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (yerel onboarding, ayarsızsa bunu varsayılan olarak `per-channel-peer` yapar; mevcut açık değerler korunur)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katılırsanız kanal izin listeleri (Slack, Discord, Matrix, Microsoft Teams) (mümkün olduğunda adlar kimliklere çözümlenir)
- `skills.install.nodeManager`
  - `setup --node-manager` bayrağı `npm`, `pnpm` veya `bun` kabul eder.
  - Elle yapılandırma daha sonra yine `skills.install.nodeManager: "yarn"` ayarlayabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altına gider.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında depolanır.

<Note>
Bazı kanallar Plugin olarak sunulur. Kurulum sırasında seçildiklerinde sihirbaz,
kanal yapılandırmasından önce Plugin'i kurmanızı ister (npm veya yerel yol).
</Note>

Gateway sihirbazı RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

İstemciler (macOS uygulaması ve Control UI), onboarding mantığını yeniden uygulamadan adımları işleyebilir.

Signal kurulum davranışı:

- Uygun sürüm varlığını indirir
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında depolar
- Yapılandırmaya `channels.signal.cliPath` yazar
- JVM derlemeleri Java 21 gerektirir
- Mevcut olduğunda yerel derlemeler kullanılır
- Windows, WSL2 kullanır ve Linux signal-cli akışını WSL içinde izler

## İlgili belgeler

- Onboarding merkezi: [Onboarding (CLI)](/tr/start/wizard)
- Otomasyon ve betikler: [CLI Automation](/tr/start/wizard-cli-automation)
- Komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
