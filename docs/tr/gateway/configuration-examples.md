---
read_when:
    - OpenClaw'ın nasıl yapılandırılacağını öğrenme
    - Yapılandırma örnekleri arama
    - OpenClaw'ı ilk kez kurma
summary: Yaygın OpenClaw kurulumları için şemaya uygun yapılandırma örnekleri
title: Yapılandırma örnekleri
x-i18n:
    generated_at: "2026-04-25T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f31f70459d6232d2aefe668440312bb1800f18de0ef3c2783befa1de05f25f6
    source_path: gateway/configuration-examples.md
    workflow: 15
---

Aşağıdaki örnekler, geçerli config şemasıyla uyumludur. Kapsamlı başvuru ve alan bazlı notlar için bkz. [Configuration](/tr/gateway/configuration).

## Hızlı başlangıç

### Mutlak minimum

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Bunu `~/.openclaw/openclaw.json` içine kaydedin; bu numaradan bota DM gönderebilirsiniz.

### Önerilen başlangıç yapılandırması

```json5
{
  identity: {
    name: "Clawd",
    theme: "yardımsever asistan",
    emoji: "🦞",
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "anthropic/claude-sonnet-4-6" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Genişletilmiş örnek (başlıca seçenekler)

> JSON5, yorumlar ve sondaki virgülleri kullanmanıza izin verir. Normal JSON da çalışır.

```json5
{
  // Ortam + kabuk
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },

  // Kimlik doğrulama profili meta verileri (secret'lar auth-profiles.json içinde yaşar)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:default"],
      "openai-codex": ["openai-codex:personal"],
    },
  },

  // Kimlik
  identity: {
    name: "Samantha",
    theme: "yardımsever tembel hayvan",
    emoji: "🦥",
  },

  // Günlükleme
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Mesaj biçimlendirme
  messages: {
    messagePrefix: "[openclaw]",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
  },

  // Yönlendirme + kuyruk
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
      historyLimit: 50,
    },
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        slack: "collect",
        signal: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },

  // Araçlar
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          // İsteğe bağlı CLI geri dönüşü (Whisper binary):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // Oturum davranışı
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // çok kullanıcılı gelen kutuları için önerilir
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/default/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı
      highWaterBytes: "400mb", // isteğe bağlı (varsayılan olarak maxDiskBytes değerinin %80'i)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kanallar
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { allow: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // Aracı çalışma zamanı
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // list[].skills değerini atlayan aracılar tarafından devralınır
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // allow (varsayılan) | block
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // eski perSession: true yerine tercih edilir
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    list: [
      {
        id: "main",
        default: true,
        // defaults.skills değerini devralır -> github, weather
        thinkingDefault: "high", // aracı başına düşünme geçersiz kılması
        reasoningDefault: "on", // aracı başına akıl yürütme görünürlüğü
        fastModeDefault: false, // aracı başına hızlı mod
      },
      {
        id: "quick",
        skills: [], // bu aracı için Skills yok
        fastModeDefault: true, // bu aracı her zaman hızlı çalışır
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // Özel model sağlayıcıları
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // Cron işleri
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/cron.json",
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },

  // Webhooks
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Kimden: {{messages[0].from}}\nKonu: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + ağ
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway.tailnet:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

## Yaygın desenler

### Tek geçersiz kılmalı paylaşılan Skills temeli

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills`, paylaşılan temel kümedir.
- `agents.list[].skills`, bu temel kümeyi tek bir aracı için değiştirir.
- Bir aracının hiç Skills görmemesi gerekiyorsa `skills: []` kullanın.

### Çok platformlu kurulum

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### Güvenilir Node ağı otomatik onayı

Ağ yolunu denetlemiyorsanız cihaz eşlemesini manuel bırakın. Ayrılmış bir
laboratuvar veya tailnet alt ağı için, tam CIDR'ler veya IP'lerle ilk kez Node cihazı
otomatik onayına katılabilirsiniz:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

Bu, ayarlanmadığında kapalı kalır. Yalnızca yeni `role: node` eşlemesine,
istenen kapsam olmadığında uygulanır. Operatör/tarayıcı istemcileri ile rol, kapsam, meta veri
veya açık anahtar yükseltmeleri yine manuel onay gerektirir.

### Güvenli DM modu (paylaşılan gelen kutusu / çok kullanıcılı DM'ler)

Birden fazla kişi botunuza DM gönderebiliyorsa (`allowFrom` içinde birden çok giriş, birden fazla kişi için eşleme onayları veya `dmPolicy: "open"`), farklı gönderenlerden gelen DM'lerin varsayılan olarak tek bağlamı paylaşmaması için **güvenli DM modu**nu etkinleştirin:

```json5
{
  // Güvenli DM modu (çok kullanıcılı veya hassas DM aracılar için önerilir)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Örnek: WhatsApp çok kullanıcılı gelen kutusu
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Örnek: Discord çok kullanıcılı gelen kutusu
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Discord/Slack/Google Chat/Microsoft Teams/Mattermost/IRC için, gönderen yetkilendirmesi varsayılan olarak önce kimlik üzerinden yapılır.
Doğrudan değiştirilebilir ad/e-posta/takma ad eşleştirmesini yalnızca bu riski açıkça kabul ediyorsanız her kanalın `dangerouslyAllowNameMatching: true` ayarıyla etkinleştirin.

### Anthropic API anahtarı + MiniMax geri dönüşü

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: {
      primary: "anthropic/claude-opus-4-6",
      fallbacks: ["minimax/MiniMax-M2.7"],
    },
  },
}
```

### İş botu (kısıtlı erişim)

```json5
{
  identity: {
    name: "WorkBot",
    theme: "profesyonel asistan",
  },
  agent: {
    workspace: "~/work-openclaw",
    elevated: { enabled: false },
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { allow: true, requireMention: true },
        "#general": { allow: true, requireMention: true },
      },
    },
  },
}
```

### Yalnızca yerel modeller

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "lmstudio/my-local-model" },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Yerel Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## İpuçları

- `dmPolicy: "open"` ayarlarsanız, eşleşen `allowFrom` listesi `"*"` içermelidir.
- Sağlayıcı kimlikleri farklılık gösterir (telefon numaraları, kullanıcı kimlikleri, kanal kimlikleri). Biçimi doğrulamak için sağlayıcı belgelerine bakın.
- Daha sonra eklenebilecek isteğe bağlı bölümler: `web`, `browser`, `ui`, `discovery`, `canvasHost`, `talk`, `signal`, `imessage`.
- Daha ayrıntılı kurulum notları için bkz. [Providers](/tr/providers) ve [Troubleshooting](/tr/gateway/troubleshooting).

## İlgili

- [Configuration reference](/tr/gateway/configuration-reference)
- [Configuration](/tr/gateway/configuration)
