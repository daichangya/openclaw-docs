---
read_when:
    - Belirli bir onboarding adımını veya bayrağını arıyorsunuz
    - Etkileşimsiz modla onboarding otomasyonu gerçekleştiriyorsunuz
    - Onboarding davranışında hata ayıklıyorsunuz
sidebarTitle: Onboarding Reference
summary: 'CLI onboarding için tam başvuru: her adım, bayrak ve yapılandırma alanı'
title: Onboarding Başvurusu
x-i18n:
    generated_at: "2026-04-23T09:10:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding Başvurusu

Bu, `openclaw onboard` için tam başvurudur.
Yüksek düzey genel bakış için bkz. [Onboarding (CLI)](/tr/start/wizard).

## Akış ayrıntıları (yerel mod)

<Steps>
  <Step title="Mevcut yapılandırma algılama">
    - `~/.openclaw/openclaw.json` mevcutsa **Keep / Modify / Reset** seçin.
    - Onboarding'i yeniden çalıştırmak, açıkça **Reset** seçmediğiniz sürece
      (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
    - CLI `--reset` varsayılan olarak `config+creds+sessions` kullanır; çalışma alanını da kaldırmak için
      `--reset-scope full` kullanın.
    - Yapılandırma geçersizse veya eski anahtarlar içeriyorsa sihirbaz durur ve
      devam etmeden önce `openclaw doctor` çalıştırmanızı ister.
    - Sıfırlama, `trash` kullanır (`rm` asla kullanılmaz) ve şu kapsamları sunar:
      - Yalnızca yapılandırma
      - Yapılandırma + kimlik bilgileri + oturumlar
      - Tam sıfırlama (çalışma alanını da kaldırır)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API anahtarı**: varsa `ANTHROPIC_API_KEY` kullanır veya bir anahtar ister, sonra daemon kullanımı için kaydeder.
    - **Anthropic API anahtarı**: onboarding/configure içinde tercih edilen Anthropic yardımcı seçeneği.
    - **Anthropic setup-token**: OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını tercih etse de onboarding/configure içinde hâlâ mevcuttur.
    - **OpenAI Code (Codex) aboneliği (OAuth)**: tarayıcı akışı; `code#state` değerini yapıştırın.
      - Model ayarlanmamışsa veya `openai/*` ise `agents.defaults.model` değerini `openai-codex/gpt-5.4` olarak ayarlar.
    - **OpenAI Code (Codex) aboneliği (cihaz eşleştirme)**: kısa ömürlü cihaz koduyla tarayıcı eşleştirme akışı.
      - Model ayarlanmamışsa veya `openai/*` ise `agents.defaults.model` değerini `openai-codex/gpt-5.4` olarak ayarlar.
    - **OpenAI API anahtarı**: varsa `OPENAI_API_KEY` kullanır veya bir anahtar ister, ardından bunu auth profile'larında saklar.
      - Model ayarlanmamışsa, `openai/*` veya `openai-codex/*` ise `agents.defaults.model` değerini `openai/gpt-5.4` olarak ayarlar.
    - **xAI (Grok) API anahtarı**: `XAI_API_KEY` ister ve xAI'yi model sağlayıcısı olarak yapılandırır.
    - **OpenCode**: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`, şu adresten alın: https://opencode.ai/auth) ister ve Zen veya Go kataloğunu seçmenize izin verir.
    - **Ollama**: önce **Cloud + Local**, **Cloud only** veya **Local only** sunar. `Cloud only`, `OLLAMA_API_KEY` ister ve `https://ollama.com` kullanır; host destekli modlar Ollama temel URL'sini ister, mevcut modelleri keşfeder ve gerektiğinde seçilen yerel modeli otomatik çeker; `Cloud + Local` ayrıca o Ollama host'unun bulut erişimi için oturum açmış olup olmadığını kontrol eder.
    - Daha fazla ayrıntı: [Ollama](/tr/providers/ollama)
    - **API anahtarı**: anahtarı sizin için saklar.
    - **Vercel AI Gateway (çok modelli proxy)**: `AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID ve `CLOUDFLARE_AI_GATEWAY_API_KEY` ister.
    - Daha fazla ayrıntı: [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
    - **MiniMax**: yapılandırma otomatik yazılır; hosted varsayılanı `MiniMax-M2.7`'dir.
      API anahtarı kurulumu `minimax/...`, OAuth kurulumu ise
      `minimax-portal/...` kullanır.
    - Daha fazla ayrıntı: [MiniMax](/tr/providers/minimax)
    - **StepFun**: yapılandırma, Çin veya global uç noktalardaki StepFun standard veya Step Plan için otomatik yazılır.
    - Standard şu anda `step-3.5-flash`, Step Plan ise ayrıca `step-3.5-flash-2603` içerir.
    - Daha fazla ayrıntı: [StepFun](/tr/providers/stepfun)
    - **Synthetic (Anthropic uyumlu)**: `SYNTHETIC_API_KEY` ister.
    - Daha fazla ayrıntı: [Synthetic](/tr/providers/synthetic)
    - **Moonshot (Kimi K2)**: yapılandırma otomatik yazılır.
    - **Kimi Coding**: yapılandırma otomatik yazılır.
    - Daha fazla ayrıntı: [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
    - **Skip**: henüz auth yapılandırılmaz.
    - Algılanan seçeneklerden bir varsayılan model seçin (veya sağlayıcı/modeli manuel girin). En iyi kalite ve daha düşük prompt injection riski için sağlayıcı yığınınızda mevcut olan en güçlü yeni nesil modeli seçin.
    - Onboarding bir model kontrolü çalıştırır ve yapılandırılan model bilinmiyorsa veya auth eksikse uyarır.
    - API anahtarı depolama modu varsayılan olarak düz metin auth-profile değerleridir. Bunun yerine env destekli ref'ler saklamak için `--secret-input-mode ref` kullanın (örneğin `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profile'ları `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar (API anahtarları + OAuth). `~/.openclaw/credentials/oauth.json` eski yalnızca-içe-aktarma kaynağıdır.
    - Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)
    <Note>
    Headless/sunucu ipucu: OAuth'u tarayıcısı olan bir makinede tamamlayın, sonra
    o agent'ın `auth-profiles.json` dosyasını (örneğin
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` veya eşleşen
    `$OPENCLAW_STATE_DIR/...` yolu) Gateway host'una kopyalayın. `credentials/oauth.json`
    yalnızca eski bir içe aktarma kaynağıdır.
    </Note>
  </Step>
  <Step title="Çalışma alanı">
    - Varsayılan `~/.openclaw/workspace` (yapılandırılabilir).
    - Agent bootstrap ritüeli için gereken çalışma alanı dosyalarını başlatır.
    - Tam çalışma alanı yerleşimi + yedekleme kılavuzu: [Agent workspace](/tr/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, auth modu, Tailscale maruziyeti.
    - Auth önerisi: yerel WS istemcilerinin kimlik doğrulaması yapmasını sağlamak için loopback'te bile **Token** kullanın.
    - Token modunda etkileşimli kurulum şunları sunar:
      - **Düz metin token üret/sakla** (varsayılan)
      - **SecretRef kullan** (isteğe bağlı)
      - Hızlı başlangıç, onboarding probe/dashboard bootstrap için `env`, `file` ve `exec` sağlayıcıları arasında mevcut `gateway.auth.token` SecretRef'lerini yeniden kullanır.
      - Bu SecretRef yapılandırılmış ancak çözümlenemiyorsa onboarding, çalışma zamanı auth'unu sessizce zayıflatmak yerine açık bir düzeltme mesajıyla erken başarısız olur.
    - Parola modunda etkileşimli kurulum da düz metin veya SecretRef depolamayı destekler.
    - Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
      - Onboarding süreç ortamında boş olmayan bir env değişkeni gerektirir.
      - `--gateway-token` ile birlikte kullanılamaz.
    - Yalnızca her yerel sürece tamamen güveniyorsanız auth'u devre dışı bırakın.
    - Loopback dışı bind'ler yine de auth gerektirir.
  </Step>
  <Step title="Kanallar">
    - [WhatsApp](/tr/channels/whatsapp): isteğe bağlı QR girişi.
    - [Telegram](/tr/channels/telegram): bot token'ı.
    - [Discord](/tr/channels/discord): bot token'ı.
    - [Google Chat](/tr/channels/googlechat): service account JSON + Webhook audience.
    - [Mattermost](/tr/channels/mattermost) (plugin): bot token'ı + temel URL.
    - [Signal](/tr/channels/signal): isteğe bağlı `signal-cli` kurulumu + hesap yapılandırması.
    - [BlueBubbles](/tr/channels/bluebubbles): **iMessage için önerilir**; sunucu URL'si + parola + Webhook.
    - [iMessage](/tr/channels/imessage): eski `imsg` CLI yolu + DB erişimi.
    - DM güvenliği: varsayılan pairing'dir. İlk DM bir kod gönderir; `openclaw pairing approve <channel> <code>` ile onaylayın veya izin listeleri kullanın.
  </Step>
  <Step title="Web arama">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG veya Tavily gibi desteklenen bir sağlayıcı seçin (veya atlayın).
    - API destekli sağlayıcılar hızlı kurulum için env değişkenlerini veya mevcut yapılandırmayı kullanabilir; anahtarsız sağlayıcılar ise sağlayıcıya özgü önkoşulları kullanır.
    - `--skip-search` ile atlayın.
    - Daha sonra yapılandırın: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon kurulumu">
    - macOS: LaunchAgent
      - Oturum açmış bir kullanıcı oturumu gerektirir; headless kullanım için özel bir LaunchDaemon gerekir (gönderilmez).
    - Linux (ve Windows üzerinde WSL2): systemd kullanıcı birimi
      - Onboarding, Gateway'in çıkış yaptıktan sonra da ayakta kalması için `loginctl enable-linger <user>` etkinleştirmeyi dener.
      - sudo isteyebilir (`/var/lib/systemd/linger` yazar); önce sudo olmadan dener.
    - **Çalışma zamanı seçimi:** Node (önerilir; WhatsApp/Telegram için gereklidir). Bun **önerilmez**.
    - Token auth token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenmiş düz metin token değerlerini supervisor hizmet ortamı meta verisine kalıcılaştırmaz.
    - Token auth token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, daemon kurulumu eyleme geçirilebilir yönergelerle engellenir.
    - Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
  </Step>
  <Step title="Sağlık kontrolü">
    - Gateway'i başlatır (gerekirse) ve `openclaw health` çalıştırır.
    - İpucu: `openclaw status --deep`, desteklendiğinde kanal probe'ları dahil canlı Gateway sağlık probe'unu durum çıktısına ekler (ulaşılabilir bir Gateway gerektirir).
  </Step>
  <Step title="Skills (önerilir)">
    - Mevcut Skills'i okur ve gereksinimleri kontrol eder.
    - Bir node manager seçmenize izin verir: **npm / pnpm** (bun önerilmez).
    - İsteğe bağlı bağımlılıkları kurar (bazıları macOS'ta Homebrew kullanır).
  </Step>
  <Step title="Bitir">
    - Ek özellikler için iOS/Android/macOS uygulamaları dahil özet + sonraki adımlar.
  </Step>
</Steps>

<Note>
GUI algılanmazsa onboarding, bir tarayıcı açmak yerine Control UI için SSH port yönlendirme yönergeleri yazdırır.
Control UI varlıkları eksikse onboarding bunları build etmeyi dener; fallback `pnpm ui:build` komutudur (UI bağımlılıklarını otomatik kurar).
</Note>

## Etkileşimsiz mod

Onboarding'i otomatikleştirmek veya betiklemek için `--non-interactive` kullanın:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Makine tarafından okunabilir özet için `--json` ekleyin.

Etkileşimsiz modda Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.

<Note>
`--json`, etkileşimsiz modu **ima etmez**. Betikler için `--non-interactive` (ve `--workspace`) kullanın.
</Note>

Sağlayıcıya özgü komut örnekleri [CLI Automation](/tr/start/wizard-cli-automation#provider-specific-examples) bölümünde bulunur.
Bayrak semantiği ve adım sırası için bu başvuru sayfasını kullanın.

### Agent ekleme (etkileşimsiz)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway sihirbaz RPC

Gateway, onboarding akışını RPC üzerinden açığa çıkarır (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
İstemciler (macOS uygulaması, Control UI) onboarding mantığını yeniden uygulamadan adımları render edebilir.

## Signal kurulumu (`signal-cli`)

Onboarding, GitHub sürümlerinden `signal-cli` kurabilir:

- Uygun sürüm varlığını indirir.
- Bunu `~/.openclaw/tools/signal-cli/<version>/` altında saklar.
- `channels.signal.cliPath` değerini yapılandırmanıza yazar.

Notlar:

- JVM build'leri **Java 21** gerektirir.
- Mümkün olduğunda yerel build'ler kullanılır.
- Windows WSL2 kullanır; `signal-cli` kurulumu WSL içindeki Linux akışını izler.

## Sihirbazın yazdıkları

`~/.openclaw/openclaw.json` içindeki tipik alanlar:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax seçildiyse)
- `tools.profile` (yerel onboarding, ayarlanmamışsa varsayılan olarak `"coding"` kullanır; mevcut açık değerler korunur)
- `gateway.*` (mod, bind, auth, Tailscale)
- `session.dmScope` (davranış ayrıntıları: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- İstemler sırasında katıldığınızda kanal izin listeleri (Slack/Discord/Matrix/Microsoft Teams) (adlar mümkün olduğunda ID'lere çözülür).
- `skills.install.nodeManager`
  - `setup --node-manager`, `npm`, `pnpm` veya `bun` kabul eder.
  - Manuel yapılandırma, `skills.install.nodeManager` değerini doğrudan ayarlayarak hâlâ `yarn` kullanabilir.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`, `agents.list[]` ve isteğe bağlı `bindings` yazar.

WhatsApp kimlik bilgileri `~/.openclaw/credentials/whatsapp/<accountId>/` altında tutulur.
Oturumlar `~/.openclaw/agents/<agentId>/sessions/` altında saklanır.

Bazı kanallar plugin olarak teslim edilir. Kurulum sırasında bunlardan birini seçtiğinizde onboarding,
yapılandırılabilmeden önce onu yüklemenizi ister (npm veya yerel bir yol üzerinden).

## İlgili dokümanlar

- Onboarding genel bakışı: [Onboarding (CLI)](/tr/start/wizard)
- macOS uygulaması onboarding'i: [Onboarding](/tr/start/onboarding)
- Yapılandırma başvurusu: [Gateway configuration](/tr/gateway/configuration)
- Sağlayıcılar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord), [Google Chat](/tr/channels/googlechat), [Signal](/tr/channels/signal), [BlueBubbles](/tr/channels/bluebubbles) (iMessage), [iMessage](/tr/channels/imessage) (eski)
- Skills: [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config)
