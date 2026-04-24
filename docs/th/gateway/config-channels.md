---
read_when:
    - การกำหนดค่า Plugin แชนแนล (auth, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์ config แยกตามแชนแนล
    - การตรวจสอบนโยบาย DM, group policy หรือการควบคุมด้วย mention
summary: 'การกำหนดค่าแชนแนล: การควบคุมการเข้าถึง การจับคู่ และคีย์แยกตามแชนแนลสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่น ๆ'
title: การกำหนดค่า — แชนแนล
x-i18n:
    generated_at: "2026-04-24T09:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

คีย์การกำหนดค่าแยกตามแชนแนลภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม
การตั้งค่าแบบหลายบัญชี การควบคุมด้วย mention และคีย์แยกตามแชนแนลสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugins แชนแนลแบบ bundled อื่น ๆ

สำหรับ agents, tools, Gateway runtime และคีย์ระดับบนสุดอื่น ๆ ดู
[Configuration reference](/th/gateway/configuration-reference)

## แชนแนล

แต่ละแชนแนลจะเริ่มทำงานอัตโนมัติเมื่อมีส่วน config ของมันอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกแชนแนลรองรับนโยบาย DM และ group policies:

| นโยบาย DM          | พฤติกรรม                                                      |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่แบบครั้งเดียว; owner ต้องอนุมัติ |
| `allowlist`         | อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)     |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)          |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                   |

| นโยบายกลุ่ม            | พฤติกรรม                                              |
| ---------------------- | ----------------------------------------------------- |
| `allowlist` (ค่าเริ่มต้น) | อนุญาตเฉพาะกลุ่มที่ตรงกับ allowlist ที่กำหนดไว้       |
| `open`                 | ข้าม group allowlists (แต่การควบคุมด้วย mention ยังมีผล) |
| `disabled`             | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ใช้กำหนดค่าเริ่มต้นเมื่อ `groupPolicy` ของ provider ไม่ได้ตั้งค่าไว้
รหัสการจับคู่จะหมดอายุภายใน 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อแชนแนล**
หากไม่มีบล็อกของ provider เลย (`channels.<provider>` ไม่มีอยู่) group policy ขณะรันจะ fallback เป็น `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มระบบ
</Note>

### การแทนที่โมเดลตามแชนแนล

ใช้ `channels.modelByChannel` เพื่อตรึง channel IDs เฉพาะให้ใช้โมเดลที่กำหนด ค่าเหล่านี้ยอมรับ `provider/model` หรือ model aliases ที่กำหนดค่าไว้ การแมปแชนแนลจะมีผลเมื่อเซสชันนั้นยังไม่มี model override อยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### ค่าเริ่มต้นของแชนแนลและ Heartbeat

ใช้ `channels.defaults` สำหรับพฤติกรรม group-policy และ heartbeat ที่ใช้ร่วมกันข้าม providers:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: group policy แบบ fallback เมื่อไม่ได้ตั้งค่า `groupPolicy` ระดับ provider
- `channels.defaults.contextVisibility`: โหมดการมองเห็น supplemental context เริ่มต้นสำหรับทุกแชนแนล ค่าได้แก่ `all` (ค่าเริ่มต้น, รวมบริบททั้งหมดจาก quote/thread/history), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply แบบ explicit ไว้) การแทนที่แยกตามแชนแนล: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะแชนแนลที่ healthy ในเอาต์พุต heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะ degraded/error ในเอาต์พุต heartbeat
- `channels.defaults.heartbeat.useIndicator`: เรนเดอร์เอาต์พุต heartbeat แบบกะทัดรัดในสไตล์ indicator

### WhatsApp

WhatsApp ทำงานผ่าน web channel ของ gateway (Baileys Web) จะเริ่มอัตโนมัติเมื่อมี linked session อยู่

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false ในโหมด self-chat)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp แบบหลายบัญชี">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี; มิฉะนั้นจะใช้ account id ตัวแรกที่กำหนดไว้ (หลังเรียงลำดับ)
- `channels.whatsapp.defaultAccount` แบบไม่บังคับ สามารถใช้แทน fallback default account selection นี้ได้ เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- ไดเรกทอรี auth แบบ single-account ของ Baileys รุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่แยกตามบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (ค่าเริ่มต้น: off; ต้องเปิดใช้อย่างชัดเจนเพื่อหลีกเลี่ยง preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (รองรับเฉพาะไฟล์ปกติ; ปฏิเสธ symlinks) โดยมี `TELEGRAM_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- `channels.telegram.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- ในการตั้งค่าแบบหลายบัญชี (2+ account ids) ให้ตั้งค่า default แบบ explicit (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยง fallback routing; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย supergroup ID, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับ forum topics (ใช้ canonical `chatId:topic:topicId` ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- Telegram stream previews ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งใน direct และ group chats)
- นโยบายการลองใหม่: ดู [Retry policy](/th/concepts/retry)

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress ถูกแมปเป็น partial บน Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // ต้องเปิดเองสำหรับ sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกขาออกแบบตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้ token นั้นสำหรับการเรียกครั้งนั้น; ส่วนการตั้งค่า retry/policy ของบัญชียังคงมาจากบัญชีที่เลือกใน active runtime snapshot
- `channels.discord.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (guild channel) สำหรับ delivery targets; bare numeric IDs จะถูกปฏิเสธ
- guild slugs เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ของแชนแนลใช้ชื่อแบบ slugged (ไม่มี `#`) แนะนำให้ใช้ guild IDs
- ข้อความที่เขียนโดยบอตจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` จะเปิดให้รับ; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น (ข้อความของบอตเองยังถูกกรองอยู่)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (รวมถึงการแทนที่ระดับแชนแนล) จะทิ้งข้อความที่ mention ผู้ใช้หรือ role อื่นแต่ไม่ได้ mention บอต (ไม่นับ @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งข้อความที่มีหลายบรรทัดแม้จะยังไม่ถึง 2000 ตัวอักษร
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ฝั่ง Discord สำหรับความสามารถ session แบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` รวมถึงการส่ง/การกำหนดเส้นทางแบบผูก)
  - `idleHours`: การแทนที่ฝั่ง Discord สำหรับการยกเลิกการโฟกัสอัตโนมัติจากการไม่ใช้งานเป็นชั่วโมง (`0` คือปิด)
  - `maxAgeHours`: การแทนที่ฝั่ง Discord สำหรับอายุสูงสุดแบบตายตัวเป็นชั่วโมง (`0` คือปิด)
  - `spawnSubagentSessions`: สวิตช์แบบ opt-in สำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับแชนแนลและเธรด (ใช้ channel/thread id ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` กำหนดสี accent สำหรับ Discord components v2 containers
- `channels.discord.voice` เปิดใช้บทสนทนาใน Discord voice channels และการเข้าร่วมอัตโนมัติ + การแทนที่ TTS แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` จะถูกส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- OpenClaw ยังพยายามกู้คืนการรับเสียงเพิ่มเติมด้วยการออกจาก/เข้าร่วม voice session ใหม่หลังพบ decrypt failures ซ้ำหลายครั้ง
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน ค่า `streamMode` แบบเดิมและค่า `streaming` แบบ boolean จะถูกย้ายให้อัตโนมัติ
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของ runtime กับสถานะ presence ของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะได้ตามตัวเลือก
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass)
- `channels.discord.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Discord และการกำหนดสิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้เมื่อสามารถ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Discord user IDs ที่อนุญาตให้อนุมัติคำขอ exec หากละไว้จะ fallback ไปที่ `commands.ownerAllowFrom`
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับทุก agents
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: จะส่งข้อความขออนุมัติไปที่ใด `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังแชนแนลต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะกับผู้อนุมัติที่ resolve ได้
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM ขออนุมัติหลังอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` บนทุกข้อความ)

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Service account JSON: แบบ inline (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`)
- รองรับ Service account SecretRef เช่นกัน (`serviceAccountRef`)
- Env fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับ delivery targets
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass)

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // ใช้ Slack native streaming API เมื่อ mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น)
- **HTTP mode** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ระดับรากหรือระดับบัญชี)
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งข้อความ plaintext
  และอ็อบเจ็กต์ SecretRef
- snapshots ของบัญชี Slack จะแสดงฟิลด์ source/status แยกตามข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และใน HTTP mode
  คือ `signingSecretStatus` ค่า `configured_unavailable` หมายความว่าบัญชีนั้น
  ถูกกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/runtime ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack `channels.slack.streaming.nativeTransport` ควบคุม native streaming transport ของ Slack ค่า `streamMode`, `streaming` แบบ boolean และ `nativeStreaming` แบบเดิมจะถูกย้ายให้อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับ delivery targets

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันตามเธรด:** `thread.historyScope` เป็นแบบต่อเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งแชนแนล `thread.inheritParent` จะคัดลอก transcript ของ parent channel ไปยังเธรดใหม่

- การสตรีมแบบเนทีฟของ Slack รวมถึงสถานะเธรดแบบ "is typing..." สไตล์ Slack assistant ต้องมีเป้าหมายเป็น reply thread DMs ระดับบนสุดจะไม่อยู่ในเธรดโดยค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งแบบปกติแทนตัวอย่างแบบเธรด
- `typingReaction` จะเพิ่ม reaction ชั่วคราวให้ข้อความ Slack ขาเข้าขณะกำลังรันคำตอบ จากนั้นลบออกเมื่อเสร็จสิ้น ใช้ Slack emoji shortcode เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Slack และการกำหนดสิทธิ์ผู้อนุมัติ สคีมาเหมือนกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                 |
| -------------- | ----------- | ------------------------ |
| reactions      | เปิดใช้งาน  | react + แสดงรายการ reactions |
| messages       | เปิดใช้งาน  | อ่าน/ส่ง/แก้ไข/ลบ        |
| pins           | เปิดใช้งาน  | ปักหมุด/เลิกปักหมุด/แสดงรายการ |
| memberInfo     | เปิดใช้งาน  | ข้อมูลสมาชิก             |
| emojiList      | เปิดใช้งาน  | รายการ custom emoji      |

### Mattermost

Mattermost มาเป็น Plugin: `openclaw plugins install @openclaw/mattermost`

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL แบบระบุชัดเจนตามตัวเลือกสำหรับ reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

โหมดแชต: `oncall` (ตอบเมื่อถูก @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย trigger prefix)

เมื่อเปิดใช้ Mattermost native commands:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง OpenClaw gateway endpoint และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- native slash callbacks จะยืนยันตัวตนด้วย per-command tokens ที่ Mattermost ส่งกลับ
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  commands ใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callbacks ด้วย
  `Unauthorized: invalid command token.`
- สำหรับ callback hosts แบบ private/tailnet/internal Mattermost อาจต้องการ
  `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวมโฮสต์/โดเมนของ callback ด้วย
  ให้ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบในแชนแนล
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ mention-gating แยกตามแชนแนล (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกบัญชีแบบไม่บังคับ
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มต้นแชนแนลให้ใช้ Signal account identity ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles คือเส้นทาง iMessage ที่แนะนำ (ขับเคลื่อนด้วย Plugin กำหนดค่าภายใต้ `channels.bluebubbles`)

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, การควบคุมกลุ่ม และ advanced actions:
      // ดู /channels/bluebubbles
    },
  },
}
```

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา BlueBubbles เข้ากับ persistent ACP sessions ได้ ใช้ BlueBubbles handle หรือ target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์แบบใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- เอกสารการกำหนดค่าแชนแนล BlueBubbles แบบเต็มอยู่ที่ [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw จะ spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้

- ต้องมี Full Disk Access สำหรับฐานข้อมูล Messages
- แนะนำให้ใช้ targets แบบ `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อดูรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` ใช้จำกัดพาธของไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้ strict host-key checking ดังนั้นตรวจสอบให้แน่ใจว่า relay host key มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา iMessage เข้ากับ persistent ACP sessions ได้ ใช้ handle ที่ normalize แล้วหรือ explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์แบบใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ขับเคลื่อนด้วย Plugin และกำหนดค่าภายใต้ `channels.matrix`

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- การยืนยันตัวตนด้วย token ใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่าน HTTP(S) proxy แบบระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeservers แบบ private/internal ค่า `proxy` และ network opt-in นี้เป็นตัวควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` ใช้เลือกบัญชีที่ต้องการในชุดแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและ DM-style invites ใหม่จะถูกละเว้นจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix และการกำหนดสิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้เมื่อสามารถ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Matrix user IDs (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับทุก agents
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: จะส่งข้อความขออนุมัติไปที่ใด `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่แยกตามบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix ถูกจัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม routed peer ขณะที่ `per-room` แยกแต่ละห้อง DM
- การ probe สถานะของ Matrix และ live directory lookups ใช้นโยบาย proxy เดียวกับทราฟฟิก runtime
- เอกสารการกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่าอยู่ที่ [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams ขับเคลื่อนด้วย Plugin และกำหนดค่าภายใต้ `channels.msteams`

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // ดู /channels/msteams
    },
  },
}
```

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`
- config ของ Teams แบบเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/group, การแทนที่แยกตามทีม/แชนแนล) มีเอกสารอยู่ที่ [Microsoft Teams](/th/channels/msteams)

### IRC

IRC ขับเคลื่อนด้วย Plugin และกำหนดค่าภายใต้ `channels.irc`

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับ ใช้แทน default account selection ได้เมื่อมันตรงกับ account id ที่กำหนดค่าไว้
- เอกสารการกำหนดค่าแชนแนล IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) อยู่ที่ [IRC](/th/channels/irc)

### หลายบัญชี (ทุกแชนแนล)

รันหลายบัญชีต่อหนึ่งแชนแนล (แต่ละบัญชีมี `accountId` ของตัวเอง):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` จะถูกใช้เมื่อไม่ระบุ `accountId` (CLI + routing)
- Env tokens ใช้ได้เฉพาะกับบัญชี **default** เท่านั้น
- การตั้งค่าแชนแนลพื้นฐานจะมีผลกับทุกบัญชี เว้นแต่จะถูกแทนที่เป็นรายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์ต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ default ผ่าน `openclaw channels add` (หรือการ onboarding ของแชนแนล) ขณะที่ยังใช้ config แชนแนลระดับบนสุดแบบ single-account อยู่ OpenClaw จะย้ายค่า single-account ระดับบนสุดที่มีขอบเขตระดับบัญชีไปยังแผนที่บัญชีของแชนแนลก่อน เพื่อให้บัญชีดั้งเดิมยังทำงานต่อได้ แชนแนลส่วนใหญ่จะย้ายค่าเหล่านี้ไปยัง `channels.<channel>.accounts.default`; Matrix อาจคง target แบบ named/default ที่ตรงกันและมีอยู่ไว้แทน
- channel-only bindings เดิม (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชี default; account-scoped bindings ยังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` จะซ่อมโครงสร้างที่ปะปนกันด้วย โดยย้ายค่า single-account ระดับบนสุดที่มีขอบเขตระดับบัญชีไปยัง promoted account ที่เลือกสำหรับแชนแนลนั้น แชนแนลส่วนใหญ่ใช้ `accounts.default`; Matrix อาจคง target แบบ named/default ที่ตรงกันและมีอยู่ไว้แทน

### แชนแนล Plugin อื่น ๆ

หลายแชนแนลแบบ Plugin ถูกกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าแชนแนลเฉพาะของตนเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีแชนแนลทั้งหมดได้ที่: [Channels](/th/channels)

### การควบคุมด้วย mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

**ประเภทของ mention:**

- **Metadata mentions**: @-mentions แบบเนทีฟของแพลตฟอร์ม จะถูกละเว้นในโหมด WhatsApp self-chat
- **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุมด้วย mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (native mentions หรือมีอย่างน้อยหนึ่ง pattern)

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ใช้ตั้งค่าเริ่มต้นแบบโกลบอล แชนแนลสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือแยกตามบัญชี) ตั้งเป็น `0` เพื่อปิดใช้งาน

#### ขีดจำกัดประวัติ DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

ลำดับการ resolve: การแทนที่ราย DM → ค่าเริ่มต้นของ provider → ไม่มีขีดจำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมด self-chat

ใส่หมายเลขของคุณเองลงใน `allowFrom` เพื่อเปิดใช้โหมด self-chat (ละเว้น native @-mentions ตอบสนองเฉพาะ text patterns):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands (การจัดการคำสั่งในแชต)

```json5
{
  commands: {
    native: "auto", // ลงทะเบียนคำสั่งแบบเนทีฟเมื่อรองรับ
    nativeSkills: "auto", // ลงทะเบียนคำสั่ง skill แบบเนทีฟเมื่อรองรับ
    text: true, // parse /commands ในข้อความแชต
    bash: false, // อนุญาต ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // อนุญาต /config
    mcp: false, // อนุญาต /mcp
    plugins: false, // อนุญาต /plugins
    debug: false, // อนุญาต /debug
    restart: true, // อนุญาต /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="รายละเอียดคำสั่ง">

- บล็อกนี้ใช้กำหนดค่า surfaces ของคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน ดู [Slash Commands](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์ config** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่เป็นของแชนแนล/Plugin เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าแชนแนล/Plugin ของตัวเอง รวมถึง [Slash Commands](/th/tools/slash-commands)
- Text commands ต้องเป็นข้อความแบบ **เดี่ยวทั้งข้อความ** และขึ้นต้นด้วย `/`
- `native: "auto"` จะเปิดใช้คำสั่งแบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- `nativeSkills: "auto"` จะเปิดใช้คำสั่ง skill แบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- แทนที่แยกตามแชนแนลได้ด้วย `channels.discord.commands.native` (bool หรือ `"auto"`) ค่า `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้า
- แทนที่การลงทะเบียน native skill แยกตามแชนแนลด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับ host shell ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับ clients แบบ gateway `chat.send`, การเขียน `/config set|unset` แบบถาวรยังต้องใช้ `operator.admin` ด้วย; ส่วน `/config show` แบบอ่านอย่างเดียว ยังใช้ได้สำหรับ operator clients ทั่วไปที่มีขอบเขต write
- `mcp: true` เปิดใช้ `/mcp` สำหรับ config ของ MCP server ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา Plugin การติดตั้ง และการควบคุมการเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ใช้ควบคุมการแก้ไข config แยกตามแชนแนล (ค่าเริ่มต้น: true)
- สำหรับแชนแนลแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังใช้ควบคุมการเขียนที่กำหนดเป้าหมายบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการกระทำของ gateway restart tool ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ owner allowlist แบบ explicit สำหรับคำสั่ง/เครื่องมือที่จำกัดเฉพาะ owner แยกจาก `allowFrom`
- `ownerDisplay: "hash"` จะ hash owner ids ใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการ hash
- `allowFrom` เป็นแบบแยกตาม provider เมื่อมีการตั้งค่า มันจะเป็นแหล่งการยืนยันสิทธิ์ **เพียงแหล่งเดียว** (chanel allowlists/pairing และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group ได้เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารของคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [Slash Commands](/th/tools/slash-commands)
  - surfaces ของคำสั่งเฉพาะแชนแนล: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [Pairing](/th/channels/pairing)
  - คำสั่งการ์ดของ LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [Configuration — agents](/th/gateway/config-agents)
- [Channels overview](/th/channels)
