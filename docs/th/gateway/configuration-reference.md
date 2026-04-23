---
read_when:
    - คุณต้องการเซแมนติกหรือค่าเริ่มต้นของ config ในระดับฟิลด์แบบตรงตามจริง】【：】【“】【analysis
    - คุณกำลังตรวจสอบบล็อก config ของช่องทาง, โมเดล, Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการตั้งค่า Gateway สำหรับคีย์หลักของ OpenClaw, ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของแต่ละซับซิสเต็ม
title: เอกสารอ้างอิงการตั้งค่า
x-i18n:
    generated_at: "2026-04-23T05:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabe366a2dcbf1989890016b20d63e4799a952ec57cea99cdc00f8ca26711e2d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# เอกสารอ้างอิงการตั้งค่า

เอกสารอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` หากต้องการภาพรวมที่อิงตามงาน โปรดดู [Configuration](/th/gateway/configuration)

หน้านี้ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อซับซิสเต็มใดมีเอกสารอ้างอิงเชิงลึกของตัวเอง หน้านี้ **ไม่ได้** พยายามใส่แค็ตตาล็อกคำสั่งทั้งหมดที่เป็นของช่องทาง/Plugin หรือปุ่มปรับแต่งเชิงลึกของ memory/QMD ทุกตัวไว้ในหน้าเดียว

แหล่งความจริงในโค้ด:

- `openclaw config schema` จะแสดง JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบและ Control UI โดยมี metadata ของ bundled/plugin/channel รวมเข้ามาด้วยเมื่อมี
- `config.schema.lookup` จะคืน schema node สำหรับพาธเดียวเพื่อใช้กับเครื่องมือแบบเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ใช้ตรวจสอบแฮช baseline ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

เอกสารอ้างอิงเชิงลึกเฉพาะทาง:

- [เอกสารอ้างอิงการตั้งค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin ของผู้ดูแลสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบ config คือ **JSON5** (รองรับคอมเมนต์ + เครื่องหมายจุลภาคต่อท้าย) ทุกฟิลด์เป็นแบบไม่บังคับ — OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## Channels

แต่ละช่องทางจะเริ่มทำงานอัตโนมัติเมื่อมีส่วน config ของมันอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM            | พฤติกรรม                                                      |
| -------------------- | ------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`          | อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)       |
| `open`               | อนุญาต DMs ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)            |
| `disabled`           | เพิกเฉยต่อ DMs ขาเข้าทั้งหมด                                   |

| นโยบายกลุ่ม            | พฤติกรรม                                               |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | อนุญาตเฉพาะกลุ่มที่ตรงกับ allowlist ที่ตั้งค่าไว้          |
| `open`                 | ข้าม group allowlists (แต่ยังคงใช้การจำกัดด้วยการ mention) |
| `disabled`             | บล็อกข้อความ group/room ทั้งหมด                         |

<Note>
`channels.defaults.groupPolicy` ใช้ตั้งค่าเริ่มต้นเมื่อ `groupPolicy` ของ provider ไม่ได้ถูกตั้งไว้
pairing codes จะหมดอายุภายใน 1 ชั่วโมง คำขอ DM pairing ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มีบล็อกของ provider เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มของรันไทม์จะ fallback เป็น `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การ override โมเดลตามช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด channel IDs เฉพาะให้ใช้โมเดลหนึ่งๆ ค่าต่างๆ รับทั้ง `provider/model` หรือ model aliases ที่ตั้งค่าไว้ การแมปของช่องทางจะถูกใช้เมื่อ session ยังไม่มี model override อยู่แล้ว (เช่น ถูกตั้งผ่าน `/model`)

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

### ค่าเริ่มต้นของช่องทางและ heartbeat

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

- `channels.defaults.groupPolicy`: นโยบายกลุ่มแบบ fallback เมื่อ `groupPolicy` ระดับ provider ไม่ได้ถูกตั้งค่า
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมแบบค่าเริ่มต้นสำหรับทุกช่องทาง ค่าได้แก่ `all` (ค่าเริ่มต้น, รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply แบบชัดเจนไว้) การ override รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในผลลัพธ์ heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะช่องทางที่เสื่อมคุณภาพ/เกิดข้อผิดพลาดในผลลัพธ์ heartbeat
- `channels.defaults.heartbeat.useIndicator`: เรนเดอร์ผลลัพธ์ heartbeat แบบย่อในสไตล์ตัวบ่งชี้

### WhatsApp

WhatsApp ทำงานผ่าน web channel ของ Gateway (Baileys Web) มันจะเริ่มอัตโนมัติเมื่อมี linked session อยู่

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
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

<Accordion title="WhatsApp หลายบัญชี">

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นถ้ามี; มิฉะนั้นจะใช้ account id ตัวแรกที่ตั้งค่าไว้ (หลังการเรียงลำดับ)
- `channels.whatsapp.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นแบบ fallback เมื่อมันตรงกับ configured account id
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวในระบบเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การ override รายบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Bot token: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ปฏิเสธ symlinks) โดยมี `TELEGRAM_BOT_TOKEN` เป็น fallback สำหรับบัญชี default
- `channels.telegram.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id
- ในการตั้งค่าแบบหลายบัญชี (2+ account ids) ให้ตั้งค่า default อย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยง fallback routing; `openclaw doctor` จะเตือนเมื่อสิ่งนี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย supergroup ID, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด ACP bindings แบบถาวรสำหรับ forum topics (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) เซแมนติกของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- Telegram stream previews ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งในแชตตรงและแชตกลุ่ม)
- นโยบาย retry: ดู [Retry policy](/th/concepts/retry)

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชี default
- การเรียกขาออกโดยตรงที่ระบุ `token` ของ Discord อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น; ส่วนการตั้งค่า retry/policy ของบัญชียังคงมาจากบัญชีที่ถูกเลือกใน snapshot ของรันไทม์ที่กำลังใช้งาน
- `channels.discord.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (guild channel) เป็น delivery targets; bare numeric IDs จะถูกปฏิเสธ
- slug ของ guild เป็นตัวพิมพ์เล็กโดยแทนที่ช่องว่างด้วย `-`; คีย์ของ channel ใช้ชื่อแบบ slug (ไม่มี `#`) ควรใช้ guild IDs
- ข้อความที่เขียนโดยบอตจะถูกเพิกเฉยเป็นค่าเริ่มต้น `allowBots: true` จะเปิดรับข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตนี้ (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และ overrides ระดับ channel) จะตัดข้อความที่ mention ผู้ใช้หรือ role อื่นแต่ไม่ได้ mention บอตออก (ไม่รวม @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งข้อความแนวตั้งยาว แม้ว่าจะยังไม่เกิน 2000 ตัวอักษรก็ตาม
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: override ของ Discord สำหรับฟีเจอร์ session แบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางแบบ bound)
  - `idleHours`: override ของ Discord สำหรับการ auto-unfocus เมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` คือปิดใช้)
  - `maxAgeHours`: override ของ Discord สำหรับอายุสูงสุดแบบตายตัวเป็นชั่วโมง (`0` คือปิดใช้)
  - `spawnSubagentSessions`: สวิตช์แบบ opt-in สำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด ACP bindings แบบถาวรสำหรับ channels และ threads (ใช้ channel/thread id ใน `match.peer.id`) เซแมนติกของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ใช้ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ components v2 ของ Discord
- `channels.discord.voice` เปิดใช้การสนทนาใน voice channel ของ Discord และการ override สำหรับ auto-join + TTS แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` จะส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงด้วยการออกจาก/เข้าร่วม session เสียงใหม่หลังจากเกิดการถอดรหัสล้มเหลวซ้ำๆ
- `channels.discord.streaming` คือคีย์โหมดสตรีมแบบ canonical โดยค่าเดิม `streamMode` และค่า `streaming` แบบบูลีนจะถูกย้ายให้อัตโนมัติ
- `channels.discord.autoPresence` จะแมปความพร้อมใช้งานของรันไทม์ไปยังสถานะ presence ของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้ override ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` จะเปิดการจับคู่ชื่อ/tag ที่เปลี่ยนแปลงได้อีกครั้ง (โหมด compatibility แบบ break-glass)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบ native ของ Discord และการกำหนดสิทธิ์ approver
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดทำงานเมื่อสามารถ resolve approvers จาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: Discord user IDs ที่ได้รับอนุญาตให้อนุมัติคำขอ exec หากไม่ระบุจะ fallback ไปใช้ `commands.ownerAllowFrom`
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ หากไม่ระบุจะส่งต่อการอนุมัติสำหรับทุกเอเจนต์
  - `sessionFilter`: แพตเทิร์นของ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์ต์อนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปที่ DM ของ approver, `"channel"` ส่งไปยังช่องทางต้นทาง, `"both"` ส่งทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะโดย approvers ที่ resolve ได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ approval DMs หลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบอ้างอิงไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef สำหรับ service account ด้วย (`serviceAccountRef`)
- Env fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` เป็น delivery targets
- `channels.googlechat.dangerouslyAllowNameMatching` จะเปิดการจับคู่ email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมด compatibility แบบ break-glass)

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
        nativeTransport: true, // use Slack native streaming API when mode=partial
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

- **Socket mode** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชี default)
- **HTTP mode** ต้องมี `botToken` พร้อม `signingSecret` (ที่ root หรือแยกตามบัญชี)
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้ง
  สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- snapshots ของบัญชี Slack จะแสดงฟิลด์ต้นทาง/สถานะแยกตาม credentials เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และใน HTTP mode
  คือ `signingSecretStatus` โดย `configured_unavailable` หมายความว่า
  บัญชีนั้นถูกตั้งค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าความลับนั้นได้
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมแบบ canonical ของ Slack ส่วน `channels.slack.streaming.nativeTransport` ควบคุม native streaming transport ของ Slack ค่าเดิม `streamMode`, `streaming` แบบบูลีน และ `nativeStreaming` จะถูกย้ายให้อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` เป็น delivery targets

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยก session ของเธรด:** `thread.historyScope` แยกรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้ง channel ส่วน `thread.inheritParent` จะคัดลอกทรานสคริปต์ของ channel แม่ไปยังเธรดใหม่

- การสตรีมแบบ native ของ Slack ร่วมกับสถานะเธรดสไตล์ Slack assistant ว่า "is typing..." ต้องมีเป้าหมายเป็นเธรดตอบกลับ DMs ระดับบนสุดจะยังคงไม่เป็นเธรดโดยค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งแบบปกติแทน preview แบบเธรด
- `typingReaction` จะเพิ่ม reaction ชั่วคราวให้ข้อความ Slack ขาเข้าขณะที่กำลังรันการตอบกลับ จากนั้นจะลบออกเมื่อเสร็จ ใช้ Slack emoji shortcode เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบ native ของ Slack และการกำหนดสิทธิ์ approver ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                 |
| ------------ | ----------- | ------------------------ |
| reactions    | เปิดใช้งาน   | React + แสดงรายการ reactions |
| messages     | เปิดใช้งาน   | อ่าน/ส่ง/แก้ไข/ลบ         |
| pins         | เปิดใช้งาน   | ปักหมุด/ยกเลิก/แสดงรายการ  |
| memberInfo   | เปิดใช้งาน   | ข้อมูลสมาชิก              |
| emojiList    | เปิดใช้งาน   | รายการ emoji แบบกำหนดเอง  |

### Mattermost

Mattermost มาพร้อมเป็น Plugin: `openclaw plugins install @openclaw/mattermost`

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
        // URL แบบชัดเจนสำหรับการติดตั้งที่ใช้ reverse-proxy/สาธารณะ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

โหมดแชต: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย trigger prefix)

เมื่อเปิดใช้คำสั่ง native ของ Mattermost:

- `commands.callbackPath` ต้องเป็น path (ตัวอย่างเช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- native slash callbacks จะยืนยันตัวตนด้วย token รายคำสั่งที่
  Mattermost ส่งกลับระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callbacks ด้วย
  `Unauthorized: invalid command token.`
- สำหรับ callback hosts แบบ private/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวม host/domain ของ callback ด้วย
  โดยให้ใช้ค่าแบบ host/domain ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนจึงจะตอบใน channels
- `channels.mattermost.groups.<channelId>.requireMention`: override การจำกัดด้วยการ mention ราย channel (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกกับบัญชีแบบไม่บังคับ
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

- `channels.signal.account`: ปักหมุดการเริ่มทำงานของช่องทางไว้กับบัญชี Signal identity ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id

### BlueBubbles

BlueBubbles เป็นเส้นทาง iMessage ที่แนะนำ (ขับเคลื่อนด้วย Plugin ตั้งค่าภายใต้ `channels.bluebubbles`)

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls และ actions ขั้นสูง:
      // ดู /channels/bluebubbles
    },
  },
}
```

- คีย์หลักที่ครอบคลุมในที่นี้: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles เข้ากับ ACP sessions แบบถาวรได้ ใช้ handle ของ BlueBubbles หรือ target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` เซแมนติกของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- เอกสารการตั้งค่า BlueBubbles แบบเต็มอยู่ที่ [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw จะ spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องมี daemon หรือ port

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

- `channels.imessage.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id

- ต้องมี Full Disk Access สำหรับ Messages DB
- ควรใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` ใช้จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้ strict host-key checking ดังนั้นให้แน่ใจว่า relay host key มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับ ACP sessions แบบถาวรได้ ใช้ handle ที่ normalize แล้วหรือ explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` เซแมนติกของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.matrix`

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` ใช้กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่าน HTTP(S) proxy ที่ระบุอย่างชัดเจน บัญชีแบบมีชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeservers แบบ private/internal โดย `proxy` และ network opt-in นี้เป็นตัวควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในกรณีตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ถูกเชิญและคำเชิญแบบ DM ใหม่จะถูกเพิกเฉยจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำขออนุมัติ exec แบบ native ของ Matrix และการกำหนดสิทธิ์ approver
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดทำงานเมื่อสามารถ resolve approvers จาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: Matrix user IDs (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ หากไม่ระบุจะส่งต่อการอนุมัติสำหรับทุกเอเจนต์
  - `sessionFilter`: แพตเทิร์นของ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์ต์อนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การ override รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมว่า DMs ของ Matrix จะถูกรวมเป็น sessions อย่างไร: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม routed peer ส่วน `per-room` จะแยกแต่ละห้อง DM
- การ probe สถานะของ Matrix และ live directory lookups ใช้นโยบาย proxy เดียวกับทราฟฟิกรันไทม์
- เอกสารการตั้งค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่า อยู่ที่ [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.msteams`

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

- คีย์หลักที่ครอบคลุมในที่นี้: `channels.msteams`, `channels.msteams.configWrites`
- เอกสาร config ของ Teams แบบเต็ม (credentials, webhook, นโยบาย DM/group, overrides รายทีม/รายช่องทาง) อยู่ที่ [Microsoft Teams](/th/channels/msteams)

### IRC

IRC ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.irc`

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

- คีย์หลักที่ครอบคลุมในที่นี้: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับ ใช้ override การเลือกบัญชีค่าเริ่มต้นเมื่อมันตรงกับ configured account id
- เอกสารการตั้งค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) อยู่ที่ [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่องทาง)

รันหลายบัญชีต่อช่องทาง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (ทั้ง CLI + routing)
- โทเค็นจาก env ใช้ได้กับบัญชี **default** เท่านั้น
- การตั้งค่าพื้นฐานของช่องทางจะใช้กับทุกบัญชี เว้นแต่จะมีการ override แยกตามบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ default ผ่าน `openclaw channels add` (หรือ channel onboarding) ขณะที่ยังใช้ config ช่องทางแบบบัญชีเดียวที่ระดับบนสุด OpenClaw จะเลื่อนค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีไปไว้ในแผนที่บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ โดยส่วนใหญ่ช่องทางจะย้ายค่าเหล่านี้ไปไว้ที่ `channels.<channel>.accounts.default`; ส่วน Matrix สามารถคงเป้าหมาย named/default ที่มีอยู่และตรงกันไว้ได้แทน
- bindings ของช่องทางแบบเดิมที่ไม่มี `accountId` จะยังคงจับคู่กับบัญชี default; bindings แบบผูกกับบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` จะซ่อมรูปร่างแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีไปยังบัญชีที่ถูกเลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น โดยส่วนใหญ่ช่องทางจะใช้ `accounts.default`; ส่วน Matrix สามารถคงเป้าหมาย named/default ที่มีอยู่และตรงกันไว้ได้แทน

### ช่องทางจาก Plugin อื่นๆ

หลายช่องทางจาก Plugin ถูกตั้งค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมดได้ที่: [Channels](/th/channels)

### การจำกัดด้วยการ mention ในแชตกลุ่ม

โดยค่าเริ่มต้น ข้อความกลุ่มจะ **ต้องมีการ mention** (metadata mention หรือ safe regex patterns) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

**ประเภทของการ mention:**

- **Metadata mentions**: การ @-mention แบบ native ของแพลตฟอร์ม จะถูกเพิกเฉยในโหมด self-chat ของ WhatsApp
- **Text patterns**: safe regex patterns ใน `agents.list[].groupChat.mentionPatterns` แพตเทิร์นที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกเพิกเฉย
- การจำกัดด้วยการ mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (มี native mentions หรือมีอย่างน้อยหนึ่ง pattern)

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

`messages.groupChat.historyLimit` ใช้ตั้งค่าเริ่มต้นระดับโกลบอล ส่วนช่องทางสามารถ override ได้ด้วย `channels.<channel>.historyLimit` (หรือแยกตามบัญชี) ตั้งค่า `0` เพื่อปิดใช้งาน

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

ลำดับการ resolve: override ราย DM → ค่าเริ่มต้นของ provider → ไม่จำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมด self-chat

เพิ่มหมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมด self-chat (เพิกเฉยต่อ native @-mentions และตอบเฉพาะ text patterns):

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

### Commands (การจัดการคำสั่งแชต)

```json5
{
  commands: {
    native: "auto", // ลงทะเบียนคำสั่ง native เมื่อรองรับ
    nativeSkills: "auto", // ลงทะเบียนคำสั่ง skill แบบ native เมื่อรองรับ
    text: true, // แยกวิเคราะห์ /commands ในข้อความแชต
    bash: false, // อนุญาต ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // อนุญาต /config
    mcp: false, // อนุญาต /mcp
    plugins: false, // อนุญาต /plugins
    debug: false, // อนุญาต /debug
    restart: true, // อนุญาต /restart + เครื่องมือ gateway restart
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

<Accordion title="รายละเอียดของคำสั่ง">

- บล็อกนี้ใช้ตั้งค่าพื้นผิวของคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน โปรดดู [Slash Commands](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์ config** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่เป็นของ channel/plugin เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าของ channel/plugin นั้นๆ ร่วมกับ [Slash Commands](/th/tools/slash-commands)
- คำสั่งแบบข้อความต้องเป็นข้อความ **แบบเดี่ยวล้วน** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` จะเปิดใช้คำสั่ง native สำหรับ Discord/Telegram และปล่อย Slack ไว้เป็นปิด
- `nativeSkills: "auto"` จะเปิดใช้คำสั่ง skill แบบ native สำหรับ Discord/Telegram และปล่อย Slack ไว้เป็นปิด
- override รายช่องทางได้ด้วย `channels.discord.commands.native` (บูลีนหรือ `"auto"`) โดย `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้า
- override การลงทะเบียน native skill รายช่องทางได้ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` ใช้เพิ่มรายการเมนูบอต Telegram แบบพิเศษ
- `bash: true` เปิดใช้ `! <cmd>` สำหรับ shell ของ host ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียนแบบถาวรด้วย `/config set|unset` ยังต้องใช้ `operator.admin` ด้วย ส่วน `/config show` แบบอ่านอย่างเดียวยังใช้ได้กับไคลเอนต์ operator ทั่วไปที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับ config เซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา Plugin, ติดตั้ง และควบคุมการเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ใช้กำหนดเกตการแก้ไข config รายช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังใช้กำหนดเกตการเขียนที่พุ่งไปยังบัญชีนั้นด้วย (ตัวอย่างเช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการกระทำของเครื่องมือ gateway restart ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ owner allowlist แบบชัดเจนสำหรับคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ โดยแยกจาก `allowFrom`
- `ownerDisplay: "hash"` จะ hash owner ids ใน system prompt ตั้ง `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นราย provider เมื่อมีการตั้งค่าไว้ มันจะเป็น **แหล่งการอนุญาตเพียงแหล่งเดียว** (channel allowlists/pairing และ `useAccessGroups` จะถูกเพิกเฉย)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group ได้เมื่อไม่ได้ตั้ง `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [Slash Commands](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่ง pairing: [Pairing](/th/channels/pairing)
  - คำสั่ง card ของ LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

ราก repository แบบไม่บังคับที่จะแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นด้านบนจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist ของ Skills แบบค่าเริ่มต้นสำหรับเอเจนต์ที่ไม่ได้ตั้ง
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ละ `agents.defaults.skills` ไว้เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` ไว้เพื่อสืบทอดค่าเริ่มต้น
- ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างจะเป็นชุดสุดท้ายสำหรับเอเจนต์นั้น
  โดยจะไม่ merge กับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมว่าไฟล์ bootstrap ของ workspace จะถูก inject เข้าไปใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์น continuation ที่ปลอดภัย (หลัง assistant ตอบเสร็จสมบูรณ์แล้ว) จะข้ามการ inject bootstrap ของ workspace ซ้ำ ช่วยลดขนาดพรอมป์ต์ ส่วนการรัน Heartbeat และการ retry หลัง Compaction จะยังคงสร้างบริบทใหม่

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนถูกตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ inject ข้ามทุกไฟล์ bootstrap ของ workspace ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นได้เมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ inject ข้อความเตือนเข้าไปใน system prompt เลย
- `"once"`: inject คำเตือนหนึ่งครั้งต่อ truncation signature ที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: inject คำเตือนทุกการรันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของของงบประมาณบริบท

OpenClaw มีงบประมาณของ prompt/context ที่มีปริมาณสูงหลายจุด และมันถูกแยกตามซับซิสเต็มโดยตั้งใจ แทนที่จะไหลผ่านปุ่มควบคุมทั่วไปตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การ inject bootstrap ปกติของ workspace
- `agents.defaults.startupContext.*`:
  prelude ตอนเริ่มต้นแบบครั้งเดียวสำหรับ `/new` และ `/reset` รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด
- `skills.limits.*`:
  รายการ Skills แบบกะทัดรัดที่ถูก inject เข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  excerpts ของรันไทม์แบบมีขอบเขตและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูก inject
- `memory.qmd.limits.*`:
  ขนาดของ snippet จากการค้นหา memory แบบมีดัชนีและการ inject

ใช้การ override รายเอเจนต์ที่สอดคล้องกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ของเทิร์นแรกที่ถูก inject ในการรัน `/new` และ `/reset` แบบเปล่า

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทของรันไทม์แบบมีขอบเขต

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: ขีดจำกัด excerpt เริ่มต้นของ `memory_get` ก่อนจะเพิ่ม
  metadata การตัดทอนและ continuation notice
- `memoryGetDefaultLines`: หน้าต่างจำนวนบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ `lines`
- `toolResultMaxChars`: ขีดจำกัดผลลัพธ์ของเครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่เก็บถาวรและ
  การกู้คืนเมื่อมี overflow
- `postCompactionMaxChars`: ขีดจำกัด excerpt ของ AGENTS.md ที่ใช้ระหว่างการ inject สำหรับ refresh หลัง Compaction

#### `agents.list[].contextLimits`

การ override รายเอเจนต์สำหรับปุ่ม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
จาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

ขีดจำกัดระดับโกลบอลสำหรับรายการ Skills แบบกะทัดรัดที่ถูก inject เข้าไปใน system prompt สิ่งนี้
ไม่ส่งผลต่อการอ่านไฟล์ `SKILL.md` ตามต้องการ

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

การ override รายเอเจนต์สำหรับงบประมาณพรอมป์ต์ของ Skills

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียก provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำลงมักช่วยลดการใช้ vision tokens และขนาด payload ของคำขอสำหรับการรันที่มี screenshots จำนวนมาก
ค่าที่สูงขึ้นจะคงรายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

timezone สำหรับบริบทของ system prompt (ไม่ใช่ timestamps ของข้อความ) หากไม่มีจะ fallback ไปใช้ timezone ของ host

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ค่าที่ระบบปฏิบัติการต้องการ)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // ค่าเริ่มต้นของ provider params แบบโกลบอล
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งเฉพาะโมเดล primary
  - รูปแบบออบเจ็กต์จะตั้งทั้ง primary และโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางของเครื่องมือ `image` เป็น config ของ vision model
  - ใช้เป็นเส้นทาง fallback ด้วย เมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
- `imageGenerationModel`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างภาพ
  - ค่าที่พบบ่อย: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างภาพแบบ native ของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal หรือ `openai/gpt-image-2` สำหรับ OpenAI Images
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่า auth/API key ของ provider ที่ตรงกันด้วย (ตัวอย่างเช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` สำหรับ `openai/*`, `FAL_KEY` สำหรับ `fal/*`)
  - หากไม่ได้ตั้งไว้ `image_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับ auth ได้ มันจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง providers สำหรับการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงแบบใช้ร่วมกัน และเครื่องมือ `music_generate` ที่มีมาในตัว
  - ค่าที่พบบ่อย: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.5+`
  - หากไม่ได้ตั้งไว้ `music_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับ auth ได้ มันจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง providers สำหรับการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่า auth/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอแบบใช้ร่วมกัน และเครื่องมือ `video_generate` ที่มีมาในตัว
  - ค่าที่พบบ่อย: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากไม่ได้ตั้งไว้ `video_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับ auth ได้ มันจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง providers สำหรับการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่า auth/API key ของ provider ที่ตรงกันด้วย
  - provider สำหรับการสร้างวิดีโอ Qwen ที่ bundled มารองรับวิดีโอขาออกได้สูงสุด 1 รายการ, รูปภาพขาเข้า 1 รูป, วิดีโอขาเข้า 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากไม่ได้ตั้งไว้ เครื่องมือ PDF จะ fallback ไปใช้ `imageModel` จากนั้นจึงใช้โมเดลของ session/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF แบบค่าเริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้งาน
- `pdfMaxPages`: จำนวนหน้าสูงสุดแบบค่าเริ่มต้นที่โหมด extraction fallback ของเครื่องมือ `pdf` จะนำมาพิจารณา
- `verboseDefault`: ระดับ verbose แบบค่าเริ่มต้นสำหรับเอเจนต์ ค่าได้แก่ `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `elevatedDefault`: ระดับ elevated-output แบบค่าเริ่มต้นสำหรับเอเจนต์ ค่าได้แก่ `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.4`) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองการจับคู่ exact model id กับ configured-provider ที่ไม่กำกวม และสุดท้ายจึง fallback ไปใช้ provider ค่าเริ่มต้นที่ตั้งค่าไว้ (เป็นพฤติกรรม compatibility แบบ deprecated ดังนั้นควรระบุ `provider/model` ให้ชัดเจน) หาก provider นั้นไม่ได้เปิดเผยโมเดลค่าเริ่มต้นที่ตั้งค่าไว้อีกต่อไป OpenClaw จะ fallback ไปใช้ provider/model ตัวแรกที่ตั้งค่าไว้ แทนการแสดงค่าเริ่มต้นของ provider ที่ stale และถูกถอดออกแล้ว
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่ตั้งค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ชื่อย่อ) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist เดิม เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์การ configure/onboarding แบบผูกกับ provider จะ merge โมเดลของ provider ที่เลือกเข้าไปในแผนที่นี้ และคง providers อื่นที่ตั้งค่าไว้แล้วและไม่เกี่ยวข้องไว้
- `params`: provider parameters ค่าเริ่มต้นระดับโกลบอลที่นำไปใช้กับทุกโมเดล ตั้งที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญของการ merge `params` (config): `agents.defaults.params` (ฐานระดับโกลบอล) จะถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override รายคีย์ ดู [Prompt Caching](/th/reference/prompt-caching) สำหรับรายละเอียด
- `embeddedHarness`: นโยบายรันไทม์ของ embedded agent ระดับล่างแบบค่าเริ่มต้น ใช้ `runtime: "auto"` เพื่อให้ registered plugin harnesses รับช่วงสำหรับโมเดลที่รองรับ, `runtime: "pi"` เพื่อบังคับใช้ PI harness ที่มีมาในตัว หรือใช้ registered harness id เช่น `runtime: "codex"` ตั้ง `fallback: "none"` เพื่อปิดการ fallback ไปยัง PI โดยอัตโนมัติ
- ตัวเขียน config ที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกในรูปแบบออบเจ็กต์ canonical และคงรายการ fallback เดิมไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้าม sessions (แต่ละ session ยังถูก serialize อยู่) ค่าเริ่มต้น: 4

### `agents.defaults.embeddedHarness`

`embeddedHarness` ควบคุมว่า executor ระดับล่างตัวใดจะรันเทิร์นของ embedded agent
ระบบส่วนใหญ่ควรคงค่าเริ่มต้น `{ runtime: "auto", fallback: "pi" }`
ใช้เมื่อต้องการให้ Plugin ที่เชื่อถือได้จัดเตรียม native harness เช่น bundled
Codex app-server harness

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` หรือ registered plugin harness id โดย bundled Codex Plugin จะลงทะเบียน `codex`
- `fallback`: `"pi"` หรือ `"none"` โดย `"pi"` จะคง PI harness ที่มีมาในตัวไว้เป็น compatibility fallback เมื่อไม่มีการเลือก plugin harness ส่วน `"none"` จะทำให้การเลือก plugin harness ที่หายไปหรือไม่รองรับล้มเหลว แทนที่จะเงียบๆ แล้วไปใช้ PI ความล้มเหลวของ plugin harness ที่ถูกเลือกจะถูกแสดงออกมาโดยตรงเสมอ
- การ override ผ่าน environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` ใช้ override `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ปิด PI fallback สำหรับโปรเซสนั้น
- สำหรับการติดตั้งแบบ Codex-only ให้ตั้ง `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` และ `embeddedHarness.fallback: "none"`
- สิ่งนี้ควบคุมเฉพาะ embedded chat harness เท่านั้น ส่วนการสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของมันเอง

**ชื่อย่อ alias ที่มีมาในตัว** (ใช้ได้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| Alias               | โมเดล                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

aliases ที่คุณตั้งค่าไว้เองจะมีความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดโหมด thinking โดยอัตโนมัติ เว้นแต่คุณจะตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI จะเปิด `tool_stream` โดยค่าเริ่มต้นสำหรับการสตรีม tool call ตั้ง `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 จะใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่มีการตั้งระดับ thinking อย่างชัดเจน

### `agents.defaults.cliBackends`

CLI backends แบบไม่บังคับสำหรับการรัน fallback แบบข้อความล้วน (ไม่มี tool calls) มีประโยชน์เป็นตัวสำรองเมื่อ API providers ล้มเหลว

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backends เป็นแบบข้อความก่อนเสมอ; เครื่องมือจะถูกปิดใช้งานตลอด
- รองรับ sessions เมื่อมีการตั้ง `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับ file paths

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่หนึ่งค่า ตั้งได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือแยกตามเอเจนต์ (`agents.list[].systemPromptOverride`) ค่ารายเอเจนต์จะมีความสำคัญกว่า; ค่าว่างหรือมีแต่ช่องว่างจะถูกเพิกเฉย มีประโยชน์สำหรับการทดลองกับพรอมป์ต์แบบควบคุมได้

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

prompt overlays ที่ไม่ผูกกับ provider และนำไปใช้ตามตระกูลโมเดล โดย model ids ในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้าม providers; `personality` ควบคุมเฉพาะชั้น interaction-style แบบเป็นมิตร

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` จะเปิดชั้น interaction-style แบบเป็นมิตร
- `"off"` จะปิดเฉพาะชั้นที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 แบบแท็กยังคงเปิดใช้งานอยู่
- ค่าเดิม `plugins.entries.openai.config.personality` จะยังถูกอ่านเมื่อยังไม่ได้ตั้งค่าร่วมนี้

### `agents.defaults.heartbeat`

การรัน Heartbeat แบบเป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (auth แบบ API key) หรือ `1h` (auth แบบ OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละ section Heartbeat ออกจาก system prompt และข้ามการ inject `HEARTBEAT.md` เข้าไปใน bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะกดการแสดง payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตให้เทิร์นเอเจนต์ของ Heartbeat ใช้ได้ก่อนถูก abort หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบ direct/DM โดย `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายแบบ direct ส่วน `block` จะกดการส่งแบบ direct-target และปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบเบา และคงไว้เฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันใน session ใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกแบบเดียวกับ Cron `sessionTarget: "isolated"` ช่วยลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ ~100K เหลือ ~2-5K tokens
- รายเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat` ไว้ **จะมีเฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่รัน Heartbeat
- Heartbeats รันเทิร์นเอเจนต์แบบเต็ม — ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id ของ registered compaction provider Plugin (ไม่บังคับ)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // ใช้เมื่อ identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] ปิดการ reinject
        model: "openrouter/anthropic/claude-sonnet-4-6", // model override สำหรับ compaction เท่านั้น แบบไม่บังคับ
        notifyUser: true, // ส่งข้อความสั้นๆ ให้ผู้ใช้เมื่อ compaction เริ่มและเสร็จ (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (สรุปผลแบบแบ่งชิ้นสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ registered compaction provider Plugin เมื่อมีการตั้งค่านี้ ระบบจะเรียก `summarize()` ของ provider แทนการสรุปด้วย LLM ที่มีมาในตัว และจะ fallback กลับไปยังแบบมีมาในตัวเมื่อเกิดความล้มเหลว การตั้ง provider จะบังคับให้ใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการทำ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะ abort ค่าเริ่มต้น: `900`
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` โดย `strict` จะ prepend คำแนะนำที่มีมาในตัวเกี่ยวกับการรักษา opaque identifiers ระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการรักษา identifiers ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `postCompactionSections`: ชื่อ section แบบ H2/H3 ใน AGENTS.md แบบไม่บังคับที่จะถูก reinject หลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้ง `[]` เพื่อปิดการ reinject เมื่อไม่ได้ตั้งค่าหรือตั้งไว้เป็นคู่ค่าเริ่มต้นนี้ หัวข้อเดิม `Every Session`/`Safety` ก็ยังยอมรับได้เป็น legacy fallback
- `model`: `provider/model-id` override แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อ session หลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง; หากไม่ตั้งค่า Compaction จะใช้โมเดล primary ของ session
- `notifyUser`: เมื่อเป็น `true` จะส่งข้อความสั้นๆ ถึงผู้ใช้เมื่อ Compaction เริ่มและเสร็จสิ้น (เช่น `"Compacting context..."` และ `"Compaction complete"`) ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นแบบ agentic ที่เงียบก่อน auto-Compaction เพื่อเก็บ durable memories โดยจะถูกข้ามเมื่อ workspace เป็นแบบ read-only

### `agents.defaults.contextPruning`

ตัดแต่ง **ผลลัพธ์ของเครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติ session บนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="พฤติกรรมของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้รอบการตัดแต่ง
- `ttl` ควบคุมว่าระบบจะสามารถรันการตัดแต่งอีกครั้งได้บ่อยเพียงใด (หลังจากการแตะ cache ครั้งล่าสุด)
- การตัดแต่งจะเริ่มจาก soft-trim ผลลัพธ์ของเครื่องมือที่ใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์ของเครื่องมือที่เก่ากว่า หากยังจำเป็น

**Soft-trim** จะเก็บส่วนต้น + ส่วนท้ายไว้ แล้วแทรก `...` ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์ของเครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนคำนวณตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นแบบเป๊ะ
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัดแต่ง

</Accordion>

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้ block replies
- การ override รายช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรแยกตามบัญชี) โดย Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหน่วงเวลาแบบสุ่มระหว่าง block replies โดย `natural` = 800–2500ms การ override รายเอเจนต์: `agents.list[].humanDelay`

ดู [Streaming](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่งชิ้น

### ตัวบ่งชี้การพิมพ์

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- ค่าเริ่มต้น: `instant` สำหรับแชตตรง/การ mention, `message` สำหรับแชตกลุ่มที่ไม่มีการ mention
- การ override ราย session: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandboxing แบบไม่บังคับสำหรับ embedded agent ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // รองรับ SecretRefs / inline contents ด้วย:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="รายละเอียดของ Sandbox">

**Backend:**

- `docker`: รันไทม์ Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ขับเคลื่อนด้วย SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปอยู่ที่
`plugins.entries.openshell.config`

**การตั้งค่า SSH backend:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งของไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รากแบบ absolute บนรีโมตที่ใช้สำหรับ workspaces แยกตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่และถูกส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRefs ที่ OpenClaw จะ materialize เป็นไฟล์ชั่วคราวตอนรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มควบคุมนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของ SSH auth:**

- `identityData` มีความสำคัญเหนือ `identityFile`
- `certificateData` มีความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่ขับเคลื่อนด้วย SecretRef จะถูก resolve จาก active secrets runtime snapshot ก่อนที่ sandbox session จะเริ่ม

**พฤติกรรมของ SSH backend:**

- seed remote workspace หนึ่งครั้งหลัง create หรือ recreate
- จากนั้นคงให้ remote SSH workspace เป็น canonical
- กำหนดเส้นทาง `exec`, file tools และ media paths ผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงจากรีโมตกลับไปยัง host โดยอัตโนมัติ
- ไม่รองรับ sandbox browser containers

**การเข้าถึง Workspace:**

- `none`: sandbox workspace แยกตาม scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: sandbox workspace อยู่ที่ `/workspace`, ส่วน agent workspace ถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: agent workspace ถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: container + workspace แยกราย session
- `agent`: container + workspace หนึ่งชุดต่อ agent (ค่าเริ่มต้น)
- `shared`: container และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้าม session)

**OpenShell Plugin config:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // ไม่บังคับ
          gatewayEndpoint: "https://lab.example", // ไม่บังคับ
          policy: "strict", // OpenShell policy id แบบไม่บังคับ
          providers: ["openai"], // ไม่บังคับ
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: seed รีโมตจากในเครื่องก่อน exec, ซิงก์กลับหลัง exec; workspace ในเครื่องยังคงเป็น canonical
- `remote`: seed รีโมตครั้งเดียวเมื่อสร้าง sandbox จากนั้นให้รีโมต workspace เป็น canonical

ในโหมด `remote` การแก้ไขบนเครื่อง host ที่ทำจากภายนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งใช้ SSH เข้าไปยัง OpenShell sandbox แต่ Plugin เป็นผู้ดูแลวงจรชีวิตของ sandbox และการ mirror sync แบบไม่บังคับ

**`setupCommand`** จะรันหนึ่งครั้งหลังสร้าง container (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้ และผู้ใช้ root

**โดยค่าเริ่มต้น containers ใช้ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือ custom bridge network) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` จะถูกบล็อก `"container:<id>"` จะถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (โหมด break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ชั่วคราวใน `media/inbound/*` ภายใน workspace ที่กำลังใช้งาน

**`docker.binds`** ใช้เมานต์ไดเรกทอรี host เพิ่มเติม; binds แบบโกลบอลและรายเอเจนต์จะถูก merge กัน

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP ใน container โดย noVNC URL จะถูก inject เข้าไปใน system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC แบบผู้สังเกตการณ์ใช้ VNC auth เป็นค่าเริ่มต้น และ OpenClaw จะปล่อย token URL แบบอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) จะบล็อก sessions ที่ sandboxed ไม่ให้ชี้ไปยัง browser ของ host
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (bridge network เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ global bridge อย่างชัดเจน
- `cdpSourceRange` ใช้จำกัด CDP ingress ที่ขอบ container ให้เหลือเพียงช่วง CIDR แบบไม่บังคับ (ตัวอย่างเช่น `172.21.0.1/32`)
- `sandbox.browser.binds` ใช้เมานต์ไดเรกทอรี host เพิ่มเติมเข้าไปเฉพาะใน sandbox browser container เมื่อมีการตั้งค่า (รวมถึง `[]`) มันจะแทนที่ `docker.binds` สำหรับ browser container
- ค่าการเปิดใช้งานเริ่มต้นถูกกำหนดใน `scripts/sandbox-browser-entrypoint.sh` และปรับให้เหมาะกับ container hosts:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (เปิดใช้โดยค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` จะ
    เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` จะเปิด extensions กลับมา หากเวิร์กโฟลว์ของคุณ
    พึ่งพาสิ่งเหล่านี้
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้
    ขีดจำกัด process เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` และ `--disable-setuid-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นเหล่านี้เป็น baseline ของ container image; ใช้ browser image แบบกำหนดเองพร้อม custom
    entrypoint หากต้องการเปลี่ยนค่าเริ่มต้นของ container

</Accordion>

Browser sandboxing และ `sandbox.docker.binds` ใช้ได้เฉพาะกับ Docker เท่านั้น

สร้าง images:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (overrides รายเอเจนต์)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        thinkingDefault: "high", // override ระดับการคิดรายเอเจนต์
        reasoningDefault: "on", // override การแสดง reasoning รายเอเจนต์
        fastModeDefault: false, // override fast mode รายเอเจนต์
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // override คีย์ของ defaults.models params ที่ตรงกัน
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อมีการตั้งค่า
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: agent id แบบคงที่ (จำเป็น)
- `default`: เมื่อมีหลายตัวถูกตั้งไว้ ตัวแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่มีตัวใดถูกตั้ง ตัวแรกในรายการจะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะ override เฉพาะ `primary`; รูปแบบออบเจ็กต์ `{ primary, fallbacks }` จะ override ทั้งคู่ (`[]` ปิด global fallbacks) งาน Cron ที่ override แค่ `primary` จะยังคงสืบทอด default fallbacks เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params รายเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำทั้ง model catalog
- `skills`: allowlist ของ Skills รายเอเจนต์แบบไม่บังคับ หากไม่ระบุ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; รายการที่ระบุอย่างชัดเจนจะมาแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดค่าเริ่มต้นรายเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) ใช้ override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้ เมื่อไม่มีการ override รายข้อความหรือราย session
- `reasoningDefault`: ค่าเริ่มต้นของการมองเห็น reasoning รายเอเจนต์แบบไม่บังคับ (`on | off | stream`) ใช้เมื่อไม่มีการ override reasoning รายข้อความหรือราย session
- `fastModeDefault`: ค่าเริ่มต้นรายเอเจนต์แบบไม่บังคับสำหรับ fast mode (`true | false`) ใช้เมื่อไม่มีการ override fast-mode รายข้อความหรือราย session
- `embeddedHarness`: override นโยบาย low-level harness รายเอเจนต์แบบไม่บังคับ ใช้ `{ runtime: "codex", fallback: "none" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์อื่นยังใช้ PI fallback แบบค่าเริ่มต้น
- `runtime`: ตัวบอกลักษณะรันไทม์รายเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้นของ `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้ ACP harness sessions เป็นค่าเริ่มต้น
- `identity.avatar`: พาธสัมพัทธ์กับ workspace, URL แบบ `http(s)` หรือ `data:` URI
- `identity` จะอนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent ids สำหรับ `sessions_spawn` (`["*"]` = ตัวใดก็ได้; ค่าเริ่มต้น: ใช้เอเจนต์เดิมเท่านั้น)
- เกตการสืบทอด sandbox: หาก session ที่ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่ทำให้รันโดยไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` ไว้ (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันหลายเอเจนต์ที่แยกขาดจากกันภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

### ฟิลด์สำหรับจับคู่ binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่ระบุ type จะถือเป็น route), `acp` สำหรับ persistent ACP conversation bindings
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = ทุกบัญชี; หากไม่ระบุ = บัญชีค่าเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะบางช่องทาง)
- `acp` (ไม่บังคับ; ใช้เฉพาะ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้งช่องทาง)
6. เอเจนต์ค่าเริ่มต้น

ภายในแต่ละชั้น รายการ `bindings` ตัวแรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วยอัตลักษณ์การสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับชั้นของ route binding ด้านบน

### โปรไฟล์การเข้าถึงรายเอเจนต์

<Accordion title="เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="เครื่องมือ + workspace แบบอ่านอย่างเดียว">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ไม่มีการเข้าถึงไฟล์ระบบ (ส่งข้อความเท่านั้น)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดเรื่องลำดับความสำคัญ

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ข้ามการ fork เธรดจาก parent หากเกินจำนวนโทเค็นนี้ (0 ปิดใช้งาน)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // ระยะเวลาหรือ false
      maxDiskBytes: "500mb", // hard budget แบบไม่บังคับ
      highWaterBytes: "400mb", // เป้าหมายการ cleanup แบบไม่บังคับ
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // ค่าเริ่มต้นของการ auto-unfocus เมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้งาน)
      maxAgeHours: 0, // ค่าเริ่มต้นของอายุสูงสุดแบบตายตัวเป็นชั่วโมง (`0` ปิดใช้งาน)
    },
    mainKey: "main", // แบบเดิม (รันไทม์ใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดของฟิลด์ session">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่ม session ในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้ session แยกอิสระภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางเดียวกันใช้ session เดียวร่วมกัน (ใช้เฉพาะเมื่อเจตนาคือต้องการบริบทร่วม)
- **`dmScope`**: วิธีจัดกลุ่ม DMs
  - `main`: DMs ทั้งหมดใช้ session main ร่วมกัน
  - `per-peer`: แยกตาม sender id ข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับ inbox แบบหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป canonical ids ไปยัง peers ที่มี provider prefix เพื่อใช้แชร์ session ข้ามช่องทาง
- **`reset`**: นโยบาย reset หลัก โดย `daily` จะรีเซ็ตที่ `atHour` ตามเวลาท้องถิ่น; `idle` จะรีเซ็ตหลัง `idleMinutes` เมื่อมีการตั้งค่าทั้งสองอย่าง ระบบจะใช้ตัวที่หมดอายุก่อน
- **`resetByType`**: overrides แยกตามประเภท (`direct`, `group`, `thread`) โดยแบบเดิม `dm` ยังยอมรับเป็น alias ของ `direct`
- **`parentForkMaxTokens`**: จำนวน `totalTokens` สูงสุดของ parent-session ที่อนุญาตเมื่อสร้าง forked thread session (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่ม thread session ใหม่ แทนการสืบทอดประวัติทรานสคริปต์ของ parent
  - ตั้งค่า `0` เพื่อปิดเกตนี้และอนุญาตการ fork จาก parent เสมอ
- **`mainKey`**: ฟิลด์แบบเดิม รันไทม์จะใช้ `"main"` เสมอสำหรับบัคเก็ต direct-chat หลัก
- **`agentToAgent.maxPingPongTurns`**: จำนวนเทิร์นตอบกลับไปมาระหว่างเอเจนต์สูงสุดในการแลกเปลี่ยนแบบ agent-to-agent (จำนวนเต็ม ช่วง: `0`–`5`) โดย `0` จะปิดการ chain แบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดยยอมรับ alias แบบเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` โดยกฎ deny ตัวแรกที่ตรงกันจะชนะ
- **`maintenance`**: การ cleanup + retention ของ session-store
  - `mode`: `warn` จะปล่อยเพียงคำเตือน; `enforce` จะลงมือ cleanup จริง
  - `pruneAfter`: จุดตัดอายุกำจัดรายการที่ stale (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`)
  - `rotateBytes`: หมุน `sessions.json` เมื่อเกินขนาดนี้ (ค่าเริ่มต้น `10mb`)
  - `resetArchiveRetention`: ระยะเวลา retention สำหรับคลังทรานสคริปต์ `*.reset.<timestamp>` ค่าเริ่มต้นเท่ากับ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบดิสก์สำหรับไดเรกทอรี sessions แบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifacts/sessions ที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายหลัง cleanup ให้กลับมาอยู่ในงบประมาณ โดยค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นระดับโกลบอลสำหรับฟีเจอร์ session แบบผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (providers สามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการ auto-unfocus เมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้งาน; providers สามารถ override ได้)
  - `maxAgeHours`: ค่าเริ่มต้นของอายุสูงสุดแบบตายตัวเป็นชั่วโมง (`0` ปิดใช้งาน; providers สามารถ override ได้)

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // หรือ "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 ปิดใช้งาน
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าการตอบกลับ

override รายช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การ resolve (ตัวที่เฉพาะที่สุดชนะ): account → channel → global โดย `""` จะปิดใช้งานและหยุดการไล่ต่อ ส่วน `"auto"` จะอนุมานเป็น `[{identity.name}]`

**ตัวแปรในเทมเพลต:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อ provider         | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)       |

ตัวแปรไม่สนตัวพิมพ์เล็ก-ใหญ่ โดย `{think}` เป็น alias ของ `{thinkingLevel}`

### Ack reaction

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่กำลังใช้งาน มิฉะนั้นใช้ `"👀"` ตั้ง `""` เพื่อปิดใช้งาน
- override รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: account → channel → `messages.ackReaction` → identity fallback
- Scope: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบน Slack, Discord และ Telegram
- `messages.statusReactions.enabled`: เปิดใช้ lifecycle status reactions บน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่าไว้ ระบบจะคง status reactions ไว้เมื่อ ack reactions ถูกเปิดใช้งาน
  บน Telegram ต้องตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้ lifecycle status reactions

### Inbound debounce

รวมข้อความแบบ text-only ที่ส่งมาติดๆ กันจากผู้ส่งคนเดียวให้กลายเป็นเทิร์นเอเจนต์เดียว โดย media/attachments จะ flush ทันที ส่วน control commands จะข้ามการ debounce

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` ควบคุมโหมด auto-TTS ค่าเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถ override ค่ากำหนดในเครื่องได้ และ `/tts status` จะแสดงสถานะที่มีผลจริง
- `summaryModel` ใช้ override `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้อง opt-in)
- API keys จะ fallback ไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- `openai.baseUrl` ใช้ override endpoint ของ OpenAI TTS โดยลำดับการ resolve คือ config, จากนั้น `OPENAI_TTS_BASE_URL`, จากนั้น `https://api.openai.com/v1`
- เมื่อ `openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI OpenClaw จะถือว่ามันเป็นเซิร์ฟเวอร์ TTS แบบ OpenAI-compatible และผ่อนปรนการตรวจสอบ model/voice

---

## Talk

ค่าเริ่มต้นสำหรับโหมด Talk (macOS/iOS/Android)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` ต้องตรงกับคีย์หนึ่งใน `talk.providers` เมื่อมีการตั้งค่า Talk providers หลายตัว
- คีย์ Talk แบบ flat ในระบบเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อ compatibility เท่านั้น และจะถูกย้ายให้อัตโนมัติไปยัง `talk.providers.<provider>`
- Voice IDs จะ fallback ไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับทั้งสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- `ELEVENLABS_API_KEY` fallback จะใช้เฉพาะเมื่อยังไม่ได้ตั้งค่า Talk API key
- `providers.*.voiceAliases` ทำให้คำสั่ง Talk ใช้ชื่อที่เป็นมิตรได้
- `silenceTimeoutMs` ควบคุมว่าโหมด Talk จะรอนานเท่าใดหลังจากผู้ใช้เงียบ ก่อนส่งทรานสคริปต์ หากไม่ตั้งค่าไว้ จะใช้หน้าต่างหยุดพักตามค่าเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## Tools

### โปรไฟล์เครื่องมือ

`tools.profile` ใช้ตั้ง base allowlist ก่อน `tools.allow`/`tools.deny`

การ onboarding ในเครื่องจะตั้งค่าคอนฟิกใหม่เป็น `tools.profile: "coding"` เมื่อยังไม่ได้ตั้งค่า (คงค่าของโปรไฟล์ที่ระบุไว้อย่างชัดเจนเดิมไว้)

| โปรไฟล์     | รวม                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` เท่านั้น                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่จำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น alias ของ `exec`)                                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | เครื่องมือ built-in ทั้งหมด (ไม่รวม provider plugins)                                                                    |

### `tools.allow` / `tools.deny`

นโยบาย allow/deny ของเครื่องมือแบบโกลบอล (deny ชนะ) ไม่สนตัวพิมพ์เล็ก-ใหญ่ และรองรับ wildcards แบบ `*` โดยจะถูกนำไปใช้แม้ว่า Docker sandbox จะปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับ providers หรือโมเดลเฉพาะ ลำดับคือ: base profile → provider profile → allow/deny

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

ควบคุมการเข้าถึง exec แบบ elevated นอก sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- การ override รายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดให้เข้มขึ้นได้เท่านั้น
- `/elevated on|off|ask|full` จะเก็บสถานะแยกตาม session; ส่วน inline directives จะมีผลกับข้อความเดียว
- `exec` แบบ elevated จะข้าม sandboxing และใช้ escape path ที่ตั้งค่าไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมายของ exec คือ `node`)

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

การตรวจสอบความปลอดภัยจาก tool-loop จะ **ปิดอยู่เป็นค่าเริ่มต้น** ตั้ง `enabled: true` เพื่อเปิดการตรวจจับ
สามารถกำหนดค่าระดับโกลบอลได้ใน `tools.loopDetection` และ override รายเอเจนต์ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ประวัติการเรียกเครื่องมือสูงสุดที่เก็บไว้เพื่อวิเคราะห์ลูป
- `warningThreshold`: เกณฑ์ของรูปแบบซ้ำแบบไม่มีความคืบหน้าสำหรับคำเตือน
- `criticalThreshold`: เกณฑ์ซ้ำที่สูงกว่าสำหรับบล็อกลูปวิกฤต
- `globalCircuitBreakerThreshold`: เกณฑ์หยุดแบบตายตัวสำหรับการรันใดๆ ที่ไม่มีความคืบหน้า
- `detectors.genericRepeat`: เตือนเมื่อมีการเรียกเครื่องมือเดิมด้วยอาร์กิวเมนต์เดิมซ้ำๆ
- `detectors.knownPollNoProgress`: เตือน/บล็อกกับเครื่องมือ poll ที่รู้จักว่าไม่มีความคืบหน้า (`process.poll`, `command_status` ฯลฯ)
- `detectors.pingPong`: เตือน/บล็อกกับรูปแบบคู่สลับไปมาที่ไม่มีความคืบหน้า
- หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบจะล้มเหลว

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // หรือ env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อ auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

ตั้งค่าความเข้าใจสื่อขาเข้า (ภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: ส่งเพลง/วิดีโอ async ที่เสร็จแล้วตรงไปยังช่องทาง
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="ฟิลด์ของรายการ media model">

**รายการแบบ Provider** (`type: "provider"` หรือไม่ระบุ):

- `provider`: API provider id (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
- `model`: override ของ model id
- `profile` / `preferredProfile`: การเลือก profile จาก `auth-profiles.json`

**รายการแบบ CLI** (`type: "cli"`):

- `command`: executable ที่จะรัน
- `args`: args แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ)

**ฟิลด์ที่ใช้ร่วมกัน:**

- `capabilities`: รายการแบบไม่บังคับ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overrides รายรายการ
- หากล้มเหลว ระบบจะ fallback ไปยังรายการถัดไป

ลำดับ auth ของ provider เป็นไปตามมาตรฐาน: `auth-profiles.json` → ตัวแปร env → `models.providers.*.apiKey`

**ฟิลด์สำหรับ async completion:**

- `asyncCompletion.directSend`: เมื่อเป็น `true` งาน `music_generate`
  และ `video_generate` แบบ async ที่เสร็จแล้วจะพยายามส่งตรงไปยังช่องทางก่อน ค่าเริ่มต้น: `false`
  (เส้นทางเดิมแบบ requester-session wake/model-delivery)

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

ควบคุมว่า session ใดสามารถถูกกำหนดเป็นเป้าหมายได้โดย session tools (`sessions_list`, `sessions_history`, `sessions_send`)

ค่าเริ่มต้น: `tree` (session ปัจจุบัน + sessions ที่ถูก spawn จากมัน เช่น subagents)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

หมายเหตุ:

- `self`: เฉพาะ session key ปัจจุบันเท่านั้น
- `tree`: session ปัจจุบัน + sessions ที่ถูก spawn จาก session ปัจจุบัน (subagents)
- `agent`: ทุก session ที่เป็นของ agent id ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรัน per-sender sessions ภายใต้ agent id เดียวกัน)
- `all`: ทุก session โดยการกำหนดเป้าหมายข้ามเอเจนต์ยังต้องใช้ `tools.agentToAgent`
- Sandbox clamp: เมื่อ session ปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ค่า visibility จะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

### `tools.sessions_spawn`

ควบคุมการรองรับ inline attachments สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ตั้งเป็น true เพื่ออนุญาต inline file attachments
        maxTotalBytes: 5242880, // รวมทั้งหมด 5 MB สำหรับทุกไฟล์
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บ attachments ไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

หมายเหตุ:

- attachments รองรับเฉพาะ `runtime: "subagent"` ส่วน ACP runtime จะปฏิเสธ
- ไฟล์จะถูก materialize เข้า child workspace ที่ `.openclaw/attachments/<uuid>/` พร้อมไฟล์ `.manifest.json`
- เนื้อหาของ attachment จะถูก redact ออกจากการเก็บทรานสคริปต์โดยอัตโนมัติ
- อินพุตแบบ Base64 จะถูกตรวจสอบด้วยกฎ alphabet/padding แบบเข้มงวด และมี pre-decode size guard
- สิทธิ์ของไฟล์เป็น `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
- การ cleanup จะเป็นไปตามนโยบาย `cleanup`: `delete` จะลบ attachments เสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

### `tools.experimental`

แฟล็กของเครื่องมือ built-in แบบ experimental ปิดอยู่เป็นค่าเริ่มต้น เว้นแต่กฎ auto-enable สำหรับ strict-agentic GPT-5 จะมีผล

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบ experimental
    },
  },
}
```

หมายเหตุ:

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับการติดตามงานหลายขั้นตอนที่ไม่ใช่งานง่าย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือ override รายเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรัน OpenAI หรือ OpenAI Codex ตระกูล GPT-5 ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนี้นอกขอบเขตดังกล่าว หรือตั้งเป็น `false` เพื่อปิดไว้แม้สำหรับการรัน strict-agentic GPT-5
- เมื่อเปิดใช้งาน system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และคงไว้ไม่เกินหนึ่งขั้นตอนที่เป็น `in_progress`

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลค่าเริ่มต้นสำหรับ sub-agents ที่ถูก spawn หากไม่ระบุ sub-agents จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist ค่าเริ่มต้นของ target agent ids สำหรับ `sessions_spawn` เมื่อ requester agent ไม่ได้ตั้ง `subagents.allowAgents` ของตัวเอง (`["*"]` = ตัวใดก็ได้; ค่าเริ่มต้น: ใช้เอเจนต์เดิมเท่านั้น)
- `runTimeoutSeconds`: timeout ค่าเริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือไม่ได้ระบุ `runTimeoutSeconds` โดย `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือราย subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## Providers แบบกำหนดเองและ base URLs

OpenClaw ใช้แค็ตตาล็อกโมเดลที่มีมาในตัว เพิ่ม providers แบบกำหนดเองได้ผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

```json5
{
  models: {
    mode: "merge", // merge (ค่าเริ่มต้น) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- ใช้ `authHeader: true` ร่วมกับ `headers` สำหรับความต้องการด้าน auth แบบกำหนดเอง
- override ราก config ของเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของตัวแปรแวดล้อมแบบเดิม)
- ลำดับความสำคัญของการ merge สำหรับ provider IDs ที่ตรงกัน:
  - ค่า `baseUrl` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะชนะ
  - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างจะชนะเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการแบบ SecretRef ในบริบท config/auth-profile ปัจจุบัน
  - ค่า `apiKey` ของ provider ที่ถูกจัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการเก็บถาวรความลับที่ resolve แล้ว
  - ค่า header ของ provider ที่ถูกจัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
  - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีค่า จะ fallback ไปยัง `models.providers` ใน config
  - ค่า `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่าง config แบบชัดเจนกับค่าจากแค็ตตาล็อกโดยนัย
  - `contextTokens` ของโมเดลที่ตรงกันจะคง runtime cap แบบชัดเจนไว้เมื่อมีอยู่; ใช้มันเพื่อจำกัด effective context โดยไม่ต้องเปลี่ยน metadata ดั้งเดิมของโมเดล
  - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
  - การเก็บถาวร marker เป็นแบบ source-authoritative: markers จะถูกเขียนจาก active source config snapshot (ก่อน resolve) ไม่ใช่จากค่าความลับของรันไทม์ที่ resolve แล้ว

### รายละเอียดฟิลด์ของ Provider

- `models.mode`: พฤติกรรมของแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: แผนที่ของ providers แบบกำหนดเองที่คีย์ด้วย provider id
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเข้าไป `config set` จะปฏิเสธการแทนที่แบบทำลาย เว้นแต่คุณจะส่ง `--replace`
- `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น)
- `models.providers.*.apiKey`: credential ของ provider (ควรใช้ SecretRef/env substitution)
- `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
- `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
- `models.providers.*.authHeader`: บังคับการส่ง credential ใน header `Authorization` เมื่อจำเป็น
- `models.providers.*.baseUrl`: base URL ของ API ปลายทาง
- `models.providers.*.headers`: headers แบบ static เพิ่มเติมสำหรับการกำหนดเส้นทาง proxy/tenant
- `models.providers.*.request`: overrides การขนส่งสำหรับคำขอ HTTP ของ model-provider
  - `request.headers`: headers เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) โดยค่ารองรับ SecretRef
  - `request.auth`: override กลยุทธ์ auth โหมดมีดังนี้: `"provider-default"` (ใช้ auth ที่มีมาในตัวของ provider), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบไม่บังคับ)
  - `request.proxy`: override HTTP proxy โหมดมีดังนี้: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดรองรับ sub-object `tls` แบบไม่บังคับ
  - `request.tls`: override TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์ได้แก่ `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
  - `request.allowPrivateNetwork`: เมื่อเป็น `true` จะอนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยังช่วง private, CGNAT หรือช่วงคล้ายกัน ผ่านเกต HTTP fetch ของ provider (operator opt-in สำหรับ endpoints แบบ OpenAI-compatible ที่ self-hosted และเชื่อถือได้) ส่วน WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`
- `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของ provider แบบ explicit
- `models.providers.*.models.*.contextWindow`: metadata ของ native model context window
- `models.providers.*.models.*.contextTokens`: runtime context cap แบบไม่บังคับ ใช้สิ่งนี้เมื่อคุณต้องการ effective context budget ที่เล็กกว่า `contextWindow` ดั้งเดิมของโมเดล
- `models.providers.*.models.*.compat.supportsDeveloperRole`: คำใบ้ด้าน compatibility แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ว่างและไม่ใช่ native (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับให้เป็น `false` ตอนรันไทม์ หาก `baseUrl` ว่าง/ไม่ระบุ จะคงพฤติกรรม OpenAI ปกติไว้
- `models.providers.*.models.*.compat.requiresStringContent`: คำใบ้ด้าน compatibility แบบไม่บังคับสำหรับ endpoints แชต OpenAI-compatible ที่รองรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะ flatten `messages[].content` arrays ที่เป็นข้อความล้วนให้กลายเป็นสตริงธรรมดาก่อนส่งคำขอ
- `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่า auto-discovery ของ Bedrock
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS region สำหรับ discovery
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับ targeted discovery
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาสำหรับ polling refresh ของ discovery
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback สำหรับโมเดลที่ค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: max output tokens fallback สำหรับโมเดลที่ค้นพบ

### ตัวอย่าง Provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras; ใช้ `zai/glm-4.7` สำหรับ Z.AI แบบ direct

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับ Zen catalog หรือ refs แบบ `opencode-go/...` สำหรับ Go catalog ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

ตั้งค่า `ZAI_API_KEY` โดยยอมรับ `z.ai/*` และ `z-ai/*` เป็น aliases ด้วย ทางลัด: `openclaw onboard --auth-choice zai-api-key`

- endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
- endpoint สำหรับ coding (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
- สำหรับ endpoint ทั่วไป ให้กำหนด provider แบบกำหนดเองพร้อม base URL override

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

สำหรับ China endpoint: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

native endpoints ของ Moonshot โฆษณาความเข้ากันได้ของ streaming usage บน transport แบบ `openai-completions` ร่วมกัน และ OpenClaw จะอิงจากความสามารถของ endpoint
แทนที่จะอิงเพียง built-in provider id อย่างเดียว

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic-compatible, built-in provider ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL ควรละ `/v1` ไว้ (ไคลเอนต์ของ Anthropic จะเติมให้อัตโนมัติ) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ตั้งค่า `MINIMAX_API_KEY` ทางลัด:
`openclaw onboard --auth-choice minimax-global-api` หรือ
`openclaw onboard --auth-choice minimax-cn-api`
แค็ตตาล็อกโมเดลจะใช้ค่าเริ่มต้นเป็น M2.7 เท่านั้น
บนเส้นทางการสตรีมแบบ Anthropic-compatible OpenClaw จะปิด MiniMax thinking
เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน `/fast on` หรือ
`params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น
`MiniMax-M2.7-highspeed`

</Accordion>

<Accordion title="โมเดลในเครื่อง (LM Studio)">

ดู [Local Models](/th/gateway/local-models) สรุปสั้นๆ: รันโมเดลในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง; และคง hosted models แบบ merge ไว้สำหรับ fallback

</Accordion>

---

## Skills

```json5
{
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริงข้อความธรรมดา
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ bundled Skills เท่านั้น (managed/workspace Skills ไม่ได้รับผล)
- `load.extraDirs`: รากของ skill แบบใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้งผ่าน Homebrew ก่อนเมื่อมี `brew`
  แล้วค่อย fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่าที่ต้องการสำหรับ node installer ใน `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดการใช้ skill แม้ว่าจะ bundled/ติดตั้งไว้แล้ว
- `entries.<skillKey>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ skills ที่ประกาศ primary env var (เป็นสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` รวมถึง `plugins.load.paths`
- การค้นพบรองรับทั้ง OpenClaw plugins แบบ native รวมถึง bundles ที่เข้ากันได้ของ Codex และ Claude รวมถึง Claude default-layout bundles ที่ไม่มี manifest
- **การเปลี่ยน config ต้องรีสตาร์ต Gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ plugins ที่อยู่ในรายการ) โดย `deny` ชนะ
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin นั้นรองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var ที่อยู่ในขอบเขตของ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และเพิกเฉยต่อฟิลด์ที่กลายพันธุ์พรอมป์ต์จาก `before_agent_start` แบบเดิม ขณะเดียวกันยังคงเก็บ `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับทั้ง native plugin hooks และไดเรกทอรี hook ที่มากับ bundle ที่รองรับ
- `plugins.entries.<id>.subagent.allowModelOverride`: ไว้ใจ Plugin นี้อย่างชัดเจนให้ร้องขอ `provider` และ `model` overrides รายการรันสำหรับ background subagent runs
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของ canonical targets แบบ `provider/model` สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจจะอนุญาตทุกโมเดล
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่นิยามโดย Plugin (ตรวจสอบด้วย schema ของ native OpenClaw plugin เมื่อมี)
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider สำหรับ Firecrawl web-fetch
  - `apiKey`: Firecrawl API key (รองรับ SecretRef) โดย fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักของหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ X Search provider
  - `model`: โมเดล Grok ที่ใช้ค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า Dreaming ของ memory ดู [Dreaming](/th/concepts/dreaming) สำหรับ phases และ thresholds
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ Cron สำหรับแต่ละรอบ Dreaming เต็มรูปแบบ (ค่าเริ่มต้น `"0 3 * * *"`)
  - นโยบาย phase และ thresholds เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์ config ที่ผู้ใช้ใช้โดยตรง)
- การตั้งค่า memory แบบเต็มอยู่ที่ [เอกสารอ้างอิงการตั้งค่า memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้งานแล้วสามารถเพิ่ม embedded Pi defaults จาก `settings.json` ได้ด้วย โดย OpenClaw จะนำไปใช้เป็นการตั้งค่าเอเจนต์แบบ sanitize แล้ว ไม่ใช่เป็น raw OpenClaw config patches
- `plugins.slots.memory`: เลือก memory plugin id ที่กำลังใช้งาน หรือ `"none"` เพื่อปิด memory plugins
- `plugins.slots.contextEngine`: เลือก context engine plugin id ที่กำลังใช้งาน; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น
- `plugins.installs`: ข้อมูล metadata การติดตั้งที่ CLI จัดการ ซึ่งใช้โดย `openclaw plugins update`
  - รวม `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`
  - ให้ถือว่า `plugins.installs.*` เป็น managed state; ควรใช้คำสั่ง CLI มากกว่าการแก้ไขด้วยมือ

ดู [Plugins](/th/tools/plugin)

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // เปิดใช้เมื่อคุณตั้งใจไว้และเชื่อถือการเข้าถึง private-network เท่านั้น
      // allowPrivateNetwork: true, // alias แบบเดิม
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` จะปิดใช้งาน `act:evaluate` และ `wait --fn`
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะปิดอยู่เมื่อไม่ตั้งค่า ดังนั้น browser navigation จะยังคงเข้มงวดเป็นค่าเริ่มต้น
- ตั้ง `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้อย่างชัดเจนและเชื่อถือการนำทาง browser บน private-network
- ในโหมด strict endpoints ของ remote CDP profile (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อก private-network แบบเดียวกันระหว่างการตรวจสอบ reachability/discovery
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบเดิม
- ในโหมด strict ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบ explicit
- Remote profiles เป็นแบบ attach-only (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ DevTools WebSocket URL มาโดยตรง
- profiles แบบ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach บน
  host ที่เลือก หรือผ่าน browser node ที่เชื่อมต่ออยู่
- profiles แบบ `existing-session` สามารถตั้ง `userDataDir` เพื่อชี้ไปยัง
  browser profile เฉพาะของ Chromium-based browser เช่น Brave หรือ Edge
- profiles แบบ `existing-session` ยังคงใช้ข้อจำกัดของเส้นทาง Chrome MCP ในปัจจุบัน:
  การกระทำแบบ snapshot/ref-driven แทนการกำหนดเป้าหมายด้วย CSS-selector, hooks สำหรับอัปโหลดไฟล์ทีละหนึ่งไฟล์, ไม่มีการ override dialog timeout, ไม่มี `wait --load networkidle`, และไม่มี `responsebody`, การ export PDF, download interception หรือ batch actions
- profiles `openclaw` แบบ local managed จะกำหนด `cdpPort` และ `cdpUrl` ให้อัตโนมัติ; ควรตั้ง `cdpUrl` เองเฉพาะสำหรับ remote CDP
- ลำดับการ auto-detect: default browser หากเป็น Chromium-based → Chrome → Brave → Edge → Chromium → Chrome Canary
- บริการควบคุม: loopback เท่านั้น (port อนุมานจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ใช้เพิ่ม launch flags สำหรับการเริ่ม Chromium แบบ local (ตัวอย่างเช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ debug flags)

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, ข้อความสั้น, image URL หรือ data URI
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับ UI chrome ของแอปแบบ native (สีของฟองใน Talk Mode เป็นต้น)
- `assistant`: override identity ของ Control UI โดย fallback ไปใช้ identity ของเอเจนต์ที่กำลังใช้งาน

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // หรือ OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // สำหรับ mode=trusted-proxy; ดู /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // อันตราย: อนุญาต external embed URLs แบบ http(s) แบบ absolute
      // allowedOrigins: ["https://control.example.com"], // จำเป็นสำหรับ Control UI ที่ไม่ใช่ loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // โหมด Host-header origin fallback ที่อันตราย
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // ไม่บังคับ ค่าเริ่มต้น false
    allowRealIpFallback: false,
    tools: {
      // การปฏิเสธเพิ่มเติมสำหรับ HTTP /tools/invoke
      deny: ["browser"],
      // นำเครื่องมือออกจากรายการ deny เริ่มต้นของ HTTP
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของ Gateway">

- `mode`: `local` (รัน gateway) หรือ `remote` (เชื่อมต่อกับ remote gateway) โดย Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะเป็น `local`
- `port`: พอร์ตเดียวแบบ multiplexed สำหรับทั้ง WS + HTTP ลำดับความสำคัญคือ `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`
- **Legacy bind aliases**: ให้ใช้ค่าของ bind mode ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ host aliases (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุสำหรับ Docker**: ค่า bind เริ่มต้นแบบ `loopback` จะฟังบน `127.0.0.1` ภายใน container เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ทำให้ไม่สามารถเข้าถึง gateway ได้ ให้ใช้ `--network host` หรือกำหนด `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อให้ฟังบนทุก interface
- **Auth**: ต้องใช้เป็นค่าเริ่มต้น การ bind แบบ non-loopback ต้องใช้ gateway auth ในทางปฏิบัติหมายถึง shared token/password หรือ reverse proxy แบบ identity-aware ที่ใช้ `gateway.auth.mode: "trusted-proxy"` โดย wizard การตั้งค่าจะสร้าง token ให้เป็นค่าเริ่มต้น
- หากมีการตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โดยขั้นตอน startup และ service install/repair จะล้มเหลวเมื่อทั้งสองถูกตั้งค่าไว้แต่ mode ไม่ได้ตั้ง
- `gateway.auth.mode: "none"`: โหมดไม่ใช้ auth แบบชัดเจน ใช้เฉพาะกับ local loopback setups ที่เชื่อถือได้เท่านั้น; ตัวเลือกนี้จะไม่ถูกเสนอใน prompts ของการ onboarding โดยตั้งใจ
- `gateway.auth.mode: "trusted-proxy"`: มอบหมาย auth ให้ reverse proxy แบบ identity-aware และเชื่อถือ identity headers จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวัง **แหล่ง proxy แบบ non-loopback**; reverse proxies แบบ loopback บน host เดียวกันไม่เข้าเงื่อนไขของ trusted-proxy auth
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` identity headers จาก Tailscale Serve สามารถใช้ผ่าน auth ของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ส่วน HTTP API endpoints **ไม่** ใช้ auth จาก Tailscale header นี้; พวกมันจะทำตามโหมด HTTP auth ปกติของ gateway แทน โฟลว์แบบไม่มี token นี้สมมติว่า host ของ gateway เชื่อถือได้ โดยมีค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดความพยายาม auth ที่ล้มเหลวแบบไม่บังคับ ใช้แยกตาม client IP และ per auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืน `429` + `Retry-After`
  - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนการเขียนความล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจาก client เดียวกันอาจไปชนตัวจำกัดที่คำขอที่สอง แทนที่จะให้ทั้งสองคำขอรอดไปในฐานะความไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจจะให้ทราฟฟิก localhost ถูก rate-limit ด้วย (สำหรับชุดทดสอบหรือการติดตั้ง proxy แบบเข้มงวด)
- ความพยายาม auth ของ WS ที่มาจาก browser-origin จะถูก throttle เสมอโดยปิด loopback exemption (defense-in-depth ต่อการ brute force localhost ผ่าน browser)
- บน loopback การ lockout จาก browser-origin เหล่านั้นจะถูกแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำๆ จาก localhost origin หนึ่งจะไม่ทำให้
  origin อื่นถูก lock out โดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้ auth)
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบ explicit สำหรับการเชื่อม WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมี browser clients มาจาก origins ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับการติดตั้งที่ตั้งใจพึ่งพานโยบาย origin แบบ Host-header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การ override ฝั่งไคลเอนต์แบบ break-glass ที่อนุญาต plaintext `ws://` ไปยัง private-network IPs ที่เชื่อถือได้; โดยค่าเริ่มต้น plaintext จะยังคงจำกัดอยู่ที่ loopback เท่านั้น
- `gateway.remote.token` / `.password` เป็นฟิลด์ credentials ของ remote-client โดยตัวมันเองไม่ได้ใช้ตั้งค่า gateway auth
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL สำหรับ external APNs relay ที่ใช้โดย iOS builds แบบ official/TestFlight หลังจากพวกมันเผยแพร่ relay-backed registrations ไปยัง gateway แล้ว URL นี้ต้องตรงกับ relay URL ที่ถูกคอมไพล์ไว้ใน iOS build
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้น `10000`
- relay-backed registrations จะถูกมอบหมายให้กับ gateway identity เฉพาะ โดยแอป iOS ที่จับคู่ไว้จะดึง `gateway.identity.get`, ใส่ identity นั้นเข้าไปใน relay registration และส่งต่อ send grant ที่อยู่ในขอบเขต registration ไปยัง gateway ส่วน gateway ตัวอื่นจะไม่สามารถใช้ registration ที่เก็บไว้นั้นซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env overrides ชั่วคราวสำหรับการตั้งค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหนีเฉพาะเพื่อการพัฒนา สำหรับ loopback HTTP relay URLs โดย relay URLs สำหรับ production ควรคงเป็น HTTPS
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสุขภาพช่องทางเป็นนาที ตั้งเป็น `0` เพื่อปิดการรีสตาร์ตโดย health-monitor แบบโกลบอล ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ socket stale เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนรีสตาร์ตสูงสุดโดย health-monitor ต่อช่องทาง/บัญชี ภายในช่วงหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: opt-out รายช่องทางสำหรับ health-monitor restarts โดยยังคงตัวตรวจสุขภาพระดับโกลบอลไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override รายบัญชีสำหรับช่องทางแบบหลายบัญชี เมื่อมีการตั้งค่าไว้ จะมีความสำคัญเหนือ override ระดับช่องทาง
- เส้นทางเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*` ยังไม่ได้ตั้งค่า
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกตั้งไว้อย่างชัดเจนผ่าน SecretRef แต่ resolve ไม่ได้ ระบบจะล้มเหลวแบบ fail-closed (ไม่มี remote fallback มาบดบัง)
- `trustedProxies`: IPs ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ให้ใส่เฉพาะ proxies ที่คุณควบคุมได้ รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าแบบ same-host proxy/local-detection (เช่น Tailscale Serve หรือ local reverse proxy) แต่สิ่งเหล่านี้ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรม fail-closed
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่จะถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายจาก default deny list)
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจาก default HTTP deny list

</Accordion>

### Endpoints แบบ OpenAI-compatible

- Chat Completions: ปิดอยู่เป็นค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การทำให้ URL-input ของ Responses แข็งแกร่งขึ้น:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlists ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- header แบบไม่บังคับสำหรับการทำให้ response แข็งแกร่งขึ้น:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รันหลาย gateways บน host เดียวด้วย ports และ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Multiple Gateways](/th/gateway/multiple-gateways)

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้ TLS termination ที่ตัว listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้าง cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้ตั้งค่าไฟล์แบบ explicit; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: พาธไฟล์ระบบของ TLS certificate
- `keyPath`: พาธไฟล์ระบบของ TLS private key; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธของ CA bundle แบบไม่บังคับ สำหรับการตรวจสอบไคลเอนต์หรือ custom trust chains

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ในรันไทม์
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบสด; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตโปรเซส gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในโปรเซสเดิมโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไปรีสตาร์ตหากจำเป็น
- `debounceMs`: หน้าต่าง debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มที่ไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดเป็นมิลลิวินาทีที่จะรอให้การดำเนินการที่กำลังทำอยู่เสร็จก่อนบังคับรีสตาร์ต (ค่าเริ่มต้น: `300000` = 5 นาที)

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
ระบบจะปฏิเสธ hook tokens ใน query-string

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; ระบบจะปฏิเสธการใช้ token ของ Gateway ซ้ำ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบมีเทมเพลต ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` โดยคีย์แบบ static mapping ไม่ต้องใช้ opt-in นี้

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก request payload จะยอมรับได้เฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์จากเทมเพลตจะถือว่าได้รับมาจากภายนอกเช่นกัน และต้องใช้ `hooks.allowRequestSessionKey=true`

<Accordion title="รายละเอียดของ Mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ใน payload สำหรับ paths แบบ generic
- เทมเพลตอย่าง `{{messages[0].subject}}` จะอ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และต้องอยู่ภายใน `hooks.transformsDir` (พาธแบบ absolute และการไต่ traversal จะถูกปฏิเสธ)
- `agentId` ใช้กำหนดเส้นทางไปยังเอเจนต์เฉพาะ; IDs ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบ explicit (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: session key แบบคงที่ไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบ explicit
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และ session keys ของ mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: prefix allowlist แบบไม่บังคับสำหรับค่า `sessionKey` แบบ explicit (ทั้ง request + mapping) เช่น `["hook:"]` โดยจะกลายเป็นค่าจำเป็นเมื่อมี mapping หรือ preset ใดใช้ `sessionKey` แบบมีเทมเพลต
- `deliver: true` จะส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` ใช้ override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากมีการตั้ง model catalog)

</Accordion>

### การเชื่อมต่อ Gmail

- Gmail preset ที่มีมาในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางแยกตามข้อความแบบนี้ไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบ static แทนค่าเริ่มต้นที่เป็นเทมเพลต

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูต หากมีการตั้งค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากไปพร้อมกับ Gateway

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // หรือ OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS และ A2UI ที่เอเจนต์แก้ไขได้ผ่าน HTTP ภายใต้พอร์ตของ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ใช้ในเครื่องเท่านั้น: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind แบบ non-loopback: เส้นทาง canvas ต้องใช้ Gateway auth (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง auth headers; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ capability URLs แบบผูกกับ node สำหรับการเข้าถึง canvas/A2UI
- capability URLs จะถูกผูกกับ active node WS session และหมดอายุอย่างรวดเร็ว โดยจะไม่ใช้ IP-based fallback
- inject ไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วยเช่นกัน
- การเปลี่ยนแปลงต้องรีสตาร์ต gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าเริ่มต้น): ละ `cliPath` + `sshPort` ออกจาก TXT records
- `full`: รวม `cliPath` + `sshPort`
- hostname มีค่าเริ่มต้นเป็น `openclaw` ใช้ `OPENCLAW_MDNS_HOSTNAME` เพื่อ override

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ภายใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## Environment

### `env` (inline env vars)

```json5
{
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
}
```

- inline env vars จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: ใช้ทั้ง `.env` ของ CWD + `~/.openclaw/.env` (ทั้งสองอย่างไม่ override ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดว่าจะมีแต่หายไปจากโปรไฟล์ login shell ของคุณ
- ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญแบบเต็ม

### การแทนค่าด้วย env var

อ้างอิง env vars ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- escape ด้วย `$${VAR}` เพื่อให้ได้ `${VAR}` แบบตัวอักษรจริง
- ใช้งานได้ร่วมกับ `$include`

---

## Secrets

Secret refs เป็นแบบเพิ่มเข้าไป: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์แบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบ:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id สำหรับ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: JSON pointer แบบ absolute (ตัวอย่างเช่น `"/providers/openai/apiKey"`)
- รูปแบบ id สำหรับ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids ของ `source: "exec"` ต้องไม่มี segments ของพาธแบบ `.` หรือ `..` ที่คั่นด้วย slash (ตัวอย่างเช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิว credential ที่รองรับ

- เมทริกซ์มาตรฐาน: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- `secrets apply` ใช้กับพาธ credential ที่รองรับใน `openclaw.json`
- refs ใน `auth-profiles.json` ถูกรวมอยู่ในการ resolve ของรันไทม์และการตรวจสอบแบบ audit ด้วย

### การตั้งค่า secret providers

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider แบบ env ที่ระบุอย่างชัดเจนได้แบบไม่บังคับ
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- provider แบบ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- provider แบบ `exec` ต้องใช้ `command` แบบ absolute path และใช้ protocol payloads บน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- หากมีการตั้งค่า `trustedDirs` การตรวจสอบ trusted-dir จะถูกนำไปใช้กับพาธเป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child สำหรับ `exec` จะมีน้อยที่สุดเป็นค่าเริ่มต้น; ให้ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- secret refs จะถูก resolve ตอน activation ให้เป็น in-memory snapshot จากนั้นเส้นทางคำขอจะอ่านจาก snapshot นี้เท่านั้น
- การกรองเฉพาะพื้นผิวที่ active จะถูกนำไปใช้ระหว่าง activation: refs ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics

---

## Auth storage

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- profiles รายเอเจนต์จะถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมด credential แบบ static
- profiles ที่ใช้โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับ credentials ของ auth-profile ที่ขับเคลื่อนด้วย SecretRef
- static runtime credentials มาจาก snapshots ในหน่วยความจำที่ resolve แล้ว; รายการ `auth.json` แบบ static แบบเดิมจะถูก scrub เมื่อพบ
- การนำเข้า OAuth แบบเดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมของ secrets runtime และเครื่องมือ `audit/configure/apply`: [Secrets Management](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff เริ่มต้นเป็นชั่วโมงเมื่อ profile ล้มเหลวเพราะ
  ข้อผิดพลาดด้าน billing/เครดิตไม่พอที่เป็นจริง (ค่าเริ่มต้น: `5`) ข้อความ billing แบบ explicit อาจยังตกมาที่นี่ได้แม้จะเป็นการตอบกลับแบบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะ provider
  จะยังคงจำกัดอยู่กับ provider เจ้าของมัน (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` แบบ retry ได้ที่มาจาก usage-window หรือ
  spend-limit ของ organization/workspace จะอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: overrides ราย provider แบบไม่บังคับสำหรับ billing backoff เป็นชั่วโมง
- `billingMaxHours`: ค่าสูงสุดเป็นชั่วโมงของการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff เริ่มต้นเป็นนาทีสำหรับความล้มเหลวแบบ `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: ค่าสูงสุดเป็นนาทีสำหรับการเติบโตของ `auth_permanent` backoff (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างเวลาแบบ rolling เป็นชั่วโมงที่ใช้กับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนการหมุนเวียน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาดแบบ overloaded ก่อนจะสลับไป model fallback (ค่าเริ่มต้น: `1`) ลักษณะ provider-busy เช่น `ModelNotReadyException` จะมาที่นี่
- `overloadedBackoffMs`: การหน่วงเวลาคงที่ก่อน retry การหมุนเวียน provider/profile ที่ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนการหมุนเวียน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนจะสลับไป model fallback (ค่าเริ่มต้น: `1`) โดยบัคเก็ต rate-limit นี้รวมข้อความลักษณะ provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์ล็อกค่าเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้ง `logging.file` เพื่อใช้พาธคงที่
- `consoleLevel` จะยกระดับเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกสูงสุดเป็นไบต์ก่อนที่ระบบจะหยุดเขียน (จำนวนเต็มบวก; ค่าเริ่มต้น: `524288000` = 500 MB) สำหรับการติดตั้ง production ให้ใช้ external log rotation

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับผลลัพธ์ของ instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้ผลลัพธ์ล็อกแบบเจาะจง (รองรับ wildcards เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุเป็นมิลลิวินาทีสำหรับการปล่อยคำเตือน stuck-session ขณะที่ session ยังคงอยู่ในสถานะ processing
- `otel.enabled`: เปิดใช้ OpenTelemetry export pipeline (ค่าเริ่มต้น: `false`)
- `otel.endpoint`: collector URL สำหรับ OTel export
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: HTTP/gRPC metadata headers เพิ่มเติมที่ส่งไปพร้อมคำขอ OTel export
- `otel.serviceName`: ชื่อ service สำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การ export trace, metrics หรือ logs
- `otel.sampleRate`: อัตรา sampling ของ trace ระหว่าง `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry แบบเป็นรอบเป็นมิลลิวินาที
- `cacheTrace.enabled`: บันทึก snapshots ของ cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธผลลัพธ์สำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะรวมอยู่ในผลลัพธ์ cache trace (ทั้งหมดมีค่าเริ่มต้นเป็น `true`)

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: release channel สำหรับการติดตั้งแบบ npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบ npm updates เมื่อ gateway เริ่มต้น (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ background auto-update สำหรับการติดตั้งแบบ package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อน auto-apply ใน stable channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายเวลา rollout เพิ่มเติมของ stable channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่ beta-channel checks จะรัน เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: เกตฟีเจอร์ ACP แบบโกลบอล (ค่าเริ่มต้น: `false`)
- `dispatch.enabled`: เกตอิสระสำหรับการ dispatch เทิร์นของ ACP session (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังคงใช้ได้ แต่บล็อกการทำงานจริง
- `backend`: id ของ ACP runtime backend ค่าเริ่มต้น (ต้องตรงกับ ACP runtime plugin ที่ลงทะเบียนไว้)
- `defaultAgent`: ACP target agent id แบบ fallback เมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ agent ids ที่ได้รับอนุญาตสำหรับ ACP runtime sessions; ถ้าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน ACP sessions ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก block projection ที่สตรีม
- `stream.repeatSuppression`: กดบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบค่อยเป็นค่อยไป; `"final_only"` บัฟเฟอร์ไว้จนถึง terminal events ของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง hidden tool events (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระผลลัพธ์ของ assistant สูงสุดที่ฉายต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดตของ ACP ที่ฉายออกมา
- `stream.tagVisibility`: บันทึกที่แมปชื่อ tag ไปยังค่า boolean visibility overrides สำหรับ streamed events
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ ACP session workers ก่อนมีสิทธิ์ถูก cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap สภาพแวดล้อมของ ACP runtime

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline แบบขำๆ/ตามฤดูกาลที่หมุนเวียน
  - `"default"`: tagline แบบคงที่และเป็นกลาง (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังคงแสดงชื่อ/เวอร์ชันบนแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ taglines) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

metadata ที่ถูกเขียนโดยโฟลว์ guided setup ของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

ดูฟิลด์ identity ใน `agents.list` ภายใต้ [Agent defaults](#agent-defaults)

---

## Bridge (legacy, ถูกถอดออกแล้ว)

build ปัจจุบันไม่รวม TCP bridge แล้ว ตอนนี้ nodes เชื่อมต่อผ่าน Gateway WebSocket โดยคีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การตั้งค่า bridge แบบเดิม (อ้างอิงทางประวัติศาสตร์)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback แบบ deprecated สำหรับ stored jobs ที่มี notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token แบบไม่บังคับสำหรับ outbound webhook auth
    sessionRetention: "24h", // สตริงระยะเวลาหรือ false
    runLog: {
      maxBytes: "2mb", // ค่าเริ่มต้น 2_000_000 bytes
      keepLines: 2000, // ค่าเริ่มต้น 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บ sessions ของ isolated cron run ที่เสร็จแล้วก่อน prune ออกจาก `sessions.json` และยังควบคุมการ cleanup ของ archived deleted cron transcripts ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อน prune ค่าเริ่มต้น: `2_000_000` bytes
- `runLog.keepLines`: จำนวนบรรทัดล่าสุดที่จะเก็บไว้เมื่อมีการ prune run-log ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง Cron webhook POST (`delivery.mode = "webhook"`); หากไม่ระบุจะไม่มีการส่ง auth header
- `webhook`: fallback webhook URL แบบ legacy ที่ deprecated (`http/https`) ใช้เฉพาะกับ stored jobs ที่ยังคงมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวน retry สูงสุดสำหรับ one-shot jobs เมื่อเกิดข้อผิดพลาดแบบ transient (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของ backoff delays เป็นมิลลิวินาทีสำหรับแต่ละ retry attempt (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่กระตุ้น retries — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` หากไม่ระบุจะ retry ทุกประเภท transient

ใช้กับ one-shot cron jobs เท่านั้น ส่วน recurring jobs ใช้การจัดการความล้มเหลวอีกแบบหนึ่ง

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับ cron jobs (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนจะยิงการแจ้งเตือน (จำนวนเต็มบวก ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับ job เดียวกัน (จำนวนเต็มไม่ติดลบ)
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความในช่องทาง; `"webhook"` โพสต์ไปยัง webhook ที่ตั้งค่าไว้
- `accountId`: account หรือ channel id แบบไม่บังคับเพื่อกำหนดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางค่าเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ cron ข้ามทุก jobs
- `mode`: `"announce"` หรือ `"webhook"`; จะมีค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: override ช่องทางสำหรับการส่งแบบ announce โดย `"last"` จะใช้ช่องทางการส่งล่าสุดที่รู้จักอยู่
- `to`: เป้าหมาย announce แบบ explicit หรือ webhook URL จำเป็นสำหรับโหมด webhook
- `accountId`: account override แบบไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ราย job จะ override ค่าเริ่มต้นระดับโกลบอลนี้
- เมื่อไม่ได้ตั้งทั้ง global และ per-job failure destination jobs ที่ส่งผ่าน `announce` อยู่แล้วจะ fallback ไปยัง primary announce target นั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะ jobs แบบ `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของ job จะเป็น `"webhook"`

ดู [Cron Jobs](/th/automation/cron-jobs) ส่วนการรัน Cron แบบ isolated จะถูกติดตามเป็น [background tasks](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของ media model

placeholders ของเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                      |
| ------------------ | --------------------------------------------- |
| `{{Body}}`         | เนื้อความขาเข้าแบบเต็ม                        |
| `{{RawBody}}`      | เนื้อความดิบ (ไม่มี wrappers ของประวัติ/ผู้ส่ง) |
| `{{BodyStripped}}` | เนื้อความที่ลบ group mentions ออกแล้ว         |
| `{{From}}`         | ตัวระบุผู้ส่ง                                  |
| `{{To}}`           | ตัวระบุปลายทาง                                 |
| `{{MessageSid}}`   | id ของข้อความในช่องทาง                         |
| `{{SessionId}}`    | UUID ของ session ปัจจุบัน                      |
| `{{IsNewSession}}` | `"true"` เมื่อมีการสร้าง session ใหม่          |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                       |
| `{{MediaPath}}`    | พาธของสื่อในเครื่อง                             |
| `{{MediaType}}`    | ประเภทของสื่อ (image/audio/document/…)        |
| `{{Transcript}}`   | ทรานสคริปต์ของเสียง                            |
| `{{Prompt}}`       | media prompt ที่ resolve แล้วสำหรับ CLI entries |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับ CLI entries |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                      |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (best effort)                      |
| `{{GroupMembers}}` | พรีวิวสมาชิกกลุ่ม (best effort)                |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (best effort)            |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (best effort)         |
| `{{Provider}}`     | คำใบ้ของ provider (whatsapp, telegram, discord ฯลฯ) |

---

## Config includes (`$include`)

แยก config ออกเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการ merge:**

- ไฟล์เดี่ยว: แทนที่ออบเจ็กต์ที่ครอบอยู่ทั้งหมด
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ตัวหลัง override ตัวก่อน)
- คีย์ระดับพี่น้อง: merge หลัง includes (override ค่าจากไฟล์ที่ include มา)
- nested includes: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบสัมพัทธ์กับไฟล์ที่ทำ include แต่ต้องยังอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตได้เฉพาะเมื่อหลัง resolve แล้ว ยังอยู่ภายในขอบเขตนั้น
- การเขียนโดย OpenClaw เองที่เปลี่ยนเพียงส่วนระดับบนสุดหนึ่งส่วนซึ่ง backed โดย single-file include จะเขียนทะลุไปยังไฟล์ที่ include นั้นได้ เช่น `plugins install` จะอัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้ตามเดิม
- root includes, include arrays และ includes ที่มี sibling overrides เป็นแบบอ่านอย่างเดียวสำหรับการเขียนโดย OpenClaw; การเขียนเหล่านั้นจะล้มเหลวแบบ fail-closed แทนการ flatten config
- ข้อผิดพลาด: มีข้อความที่ชัดเจนสำหรับไฟล์หาย, parse errors และ circular includes

---

_ที่เกี่ยวข้อง: [Configuration](/th/gateway/configuration) · [Configuration Examples](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_
