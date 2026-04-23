---
read_when:
    - กำลังเรียนรู้วิธีกำหนดค่า OpenClaw
    - กำลังมองหาตัวอย่างการกำหนดค่า
    - กำลังตั้งค่า OpenClaw เป็นครั้งแรก
summary: ตัวอย่างการกำหนดค่าที่ตรงตามสคีมาสำหรับการตั้งค่า OpenClaw ที่พบบ่อย
title: ตัวอย่างการกำหนดค่า
x-i18n:
    generated_at: "2026-04-23T05:32:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c85643b02285cefa2aaa9dd7c1e3abebb505bc8b415b5153b5899efc3ade0f7
    source_path: gateway/configuration-examples.md
    workflow: 15
---

# ตัวอย่างการกำหนดค่า

ตัวอย่างด้านล่างสอดคล้องกับสคีมาคอนฟิกปัจจุบัน สำหรับเอกสารอ้างอิงแบบครบถ้วนและหมายเหตุรายฟิลด์ ดู [Configuration](/th/gateway/configuration)

## เริ่มต้นอย่างรวดเร็ว

### ขั้นต่ำที่สุด

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

บันทึกไว้ที่ `~/.openclaw/openclaw.json` แล้วคุณจะสามารถส่ง DM ถึงบอตจากหมายเลขนั้นได้

### ตัวเริ่มต้นที่แนะนำ

```json5
{
  identity: {
    name: "Clawd",
    theme: "ผู้ช่วยที่เป็นประโยชน์",
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

## ตัวอย่างแบบขยาย (ตัวเลือกหลัก)

> JSON5 ช่วยให้คุณใช้คอมเมนต์และ comma ต่อท้ายได้ JSON ปกติก็ใช้ได้เช่นกัน

```json5
{
  // สภาพแวดล้อม + shell
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

  // เมทาดาทาของ auth profile (ความลับอยู่ใน auth-profiles.json)
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

  // ตัวตน
  identity: {
    name: "Samantha",
    theme: "สล็อตที่เป็นประโยชน์",
    emoji: "🦥",
  },

  // Logging
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // การจัดรูปแบบข้อความ
  messages: {
    messagePrefix: "[openclaw]",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
  },

  // การกำหนดเส้นทาง + คิว
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

  // เครื่องมือ
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          // fallback ของ CLI แบบไม่บังคับ (ไบนารี Whisper):
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

  // พฤติกรรมของ session
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // แนะนำสำหรับ inbox ที่มีหลายผู้ใช้
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
      resetArchiveRetention: "30d", // ระยะเวลาหรือ false
      maxDiskBytes: "500mb", // ไม่บังคับ
      highWaterBytes: "400mb", // ไม่บังคับ (ค่าเริ่มต้นคือ 80% ของ maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Channels
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

  // รันไทม์ของเอเจนต์
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
      skills: ["github", "weather"], // สืบทอดโดยเอเจนต์ที่ละ list[].skills ไว้
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
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
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
        scope: "session", // ควรใช้แทน perSession: true แบบเดิม
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
        // สืบทอด defaults.skills -> github, weather
        thinkingDefault: "high", // การแทนที่การคิดแบบรายเอเจนต์
        reasoningDefault: "on", // การมองเห็น reasoning แบบรายเอเจนต์
        fastModeDefault: false, // fast mode แบบรายเอเจนต์
      },
      {
        id: "quick",
        skills: [], // ไม่มี Skills สำหรับเอเจนต์นี้
        fastModeDefault: true, // เอเจนต์นี้ทำงานแบบเร็วเสมอ
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

  // ผู้ให้บริการโมเดลแบบกำหนดเอง
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

  // งาน Cron
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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}",
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

  // Gateway + เครือข่าย
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

## รูปแบบที่พบบ่อย

### baseline ของ Skills แบบใช้ร่วมกันพร้อมการแทนที่หนึ่งรายการ

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

- `agents.defaults.skills` คือ baseline ที่ใช้ร่วมกัน
- `agents.list[].skills` จะแทนที่ baseline นั้นสำหรับเอเจนต์หนึ่งตัว
- ใช้ `skills: []` เมื่อเอเจนต์ไม่ควรมองเห็น Skills ใดเลย

### การตั้งค่าหลายแพลตฟอร์ม

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

### โหมด DM แบบปลอดภัย (inbox ที่ใช้ร่วมกัน / DM หลายผู้ใช้)

หากมีมากกว่าหนึ่งคนที่สามารถส่ง DM ถึงบอตของคุณได้ (มีหลายรายการใน `allowFrom`, มีการอนุมัติ pairing สำหรับหลายคน หรือใช้ `dmPolicy: "open"`), ให้เปิด **โหมด DM แบบปลอดภัย** เพื่อไม่ให้ DM จากผู้ส่งต่างคนใช้ context ร่วมกันโดยค่าเริ่มต้น:

```json5
{
  // โหมด DM แบบปลอดภัย (แนะนำสำหรับเอเจนต์ DM หลายผู้ใช้หรือเอเจนต์ DM ที่มีความอ่อนไหว)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // ตัวอย่าง: inbox แบบหลายผู้ใช้บน WhatsApp
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // ตัวอย่าง: inbox แบบหลายผู้ใช้บน Discord
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

สำหรับ Discord/Slack/Google Chat/Microsoft Teams/Mattermost/IRC การอนุญาตผู้ส่งจะใช้ ID-first โดยค่าเริ่มต้น
ให้เปิดการจับคู่โดยตรงด้วยชื่อ/อีเมล/nick ที่เปลี่ยนแปลงได้ผ่าน `dangerouslyAllowNameMatching: true` ของแต่ละช่องทางก็ต่อเมื่อคุณยอมรับความเสี่ยงนั้นอย่างชัดเจนเท่านั้น

### Anthropic API key + fallback ไปยัง MiniMax

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

### บอตสำหรับงาน (การเข้าถึงแบบจำกัด)

```json5
{
  identity: {
    name: "WorkBot",
    theme: "ผู้ช่วยแบบมืออาชีพ",
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

### ใช้เฉพาะโมเดล local

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
            name: "Local Model",
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

## เคล็ดลับ

- หากคุณตั้ง `dmPolicy: "open"` รายการ `allowFrom` ที่ตรงกันต้องมี `"*"` รวมอยู่ด้วย
- ID ของผู้ให้บริการแตกต่างกันไป (หมายเลขโทรศัพท์, user IDs, channel IDs) ใช้เอกสารของผู้ให้บริการเพื่อยืนยันรูปแบบให้ถูกต้อง
- ส่วนที่เป็นตัวเลือกและค่อยเพิ่มทีหลังได้: `web`, `browser`, `ui`, `discovery`, `canvasHost`, `talk`, `signal`, `imessage`
- ดู [Providers](/th/providers) และ [Troubleshooting](/th/gateway/troubleshooting) สำหรับหมายเหตุการตั้งค่าที่ละเอียดขึ้น
