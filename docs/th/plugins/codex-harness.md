---
read_when:
    - คุณต้องการใช้ app-server harness ของ Codex ที่มาพร้อมระบบ
    - คุณต้องการ model refs และตัวอย่าง config ของ Codex
    - คุณต้องการปิด PI fallback สำหรับการติดตั้งที่ใช้ Codex อย่างเดียว
summary: รันเทิร์นของเอเจนต์แบบฝังตัวใน OpenClaw ผ่าน app-server harness ของ Codex ที่มาพร้อมระบบ
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T05:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Plugin `codex` ที่มาพร้อมระบบช่วยให้ OpenClaw สามารถรันเทิร์นของเอเจนต์แบบฝังตัวผ่าน
Codex app-server แทนที่จะใช้ PI harness ที่มีอยู่ในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหาโมเดล,
การ resume thread แบบเนทีฟ, Compaction แบบเนทีฟ และการรันผ่าน app-server
OpenClaw ยังคงเป็นเจ้าของ chat channels, ไฟล์เซสชัน, การเลือกโมเดล, เครื่องมือ,
approvals, การส่งสื่อ และ transcript mirror ที่ผู้ใช้มองเห็น

เทิร์น Codex แบบเนทีฟยังเคารพ plugin hooks แบบใช้ร่วมกัน `before_prompt_build`,
`before_compaction` และ `after_compaction` ดังนั้น prompt shims และ
ระบบอัตโนมัติที่รับรู้ Compaction จึงยังคงสอดคล้องกับ PI harness
เทิร์น Codex แบบเนทีฟยังเคารพ plugin hooks แบบใช้ร่วมกัน `before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` และ
`agent_end` ดังนั้น prompt shims, ระบบอัตโนมัติที่รับรู้ Compaction และ
lifecycle observers จึงยังคงสอดคล้องกับ PI harness

harness นี้ถูกปิดไว้ตามค่าเริ่มต้น จะถูกเลือกใช้เฉพาะเมื่อ Plugin `codex`
ถูกเปิดใช้งานและโมเดลที่ resolve แล้วเป็นโมเดล `codex/*` หรือเมื่อคุณบังคับ
`embeddedHarness.runtime: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` อย่างชัดเจน
หากคุณไม่เคยกำหนดค่า `codex/*`, การรันแบบ PI, OpenAI, Anthropic, Gemini, local
และ custom-provider ที่มีอยู่จะยังคงพฤติกรรมเดิม

## เลือก model prefix ให้ถูกต้อง

OpenClaw มีเส้นทางแยกกันสำหรับการเข้าถึงแบบ OpenAI และแบบ Codex:

| Model ref              | เส้นทางรันไทม์                                 | ใช้เมื่อ                                                                  |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | ผู้ให้บริการ OpenAI ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงด้วย `OPENAI_API_KEY`         |
| `openai-codex/gpt-5.4` | ผู้ให้บริการ OpenAI Codex OAuth ผ่าน PI         | คุณต้องการ ChatGPT/Codex OAuth โดยไม่ใช้ Codex app-server harness         |
| `codex/gpt-5.4`        | ผู้ให้บริการ Codex แบบ bundled พร้อม Codex harness | คุณต้องการการรัน embedded agent turn แบบเนทีฟผ่าน Codex app-server      |

Codex harness จะรับผิดชอบเฉพาะ model refs แบบ `codex/*` เท่านั้น ส่วน `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local และ custom provider refs ที่มีอยู่
จะยังคงใช้เส้นทางปกติของพวกมัน

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบ bundled พร้อมใช้งาน
- Codex app-server `0.118.0` หรือใหม่กว่า
- มี Codex auth ให้กับ process ของ app-server

Plugin จะบล็อก handshakes ของ app-server ที่เก่าหรือไม่มีเวอร์ชัน
สิ่งนี้ทำให้ OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับ live และ Docker smoke tests โดยทั่วไป auth จะมาจาก `OPENAI_API_KEY` พร้อม
ไฟล์ Codex CLI แบบเลือกได้ เช่น `~/.codex/auth.json` และ
`~/.codex/config.toml` ให้ใช้ข้อมูล auth เดียวกับที่ app-server ของ Codex ในเครื่องคุณใช้

## config ขั้นต่ำ

ใช้ `codex/gpt-5.4`, เปิด bundled plugin และบังคับให้ใช้ harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

หาก config ของคุณใช้ `plugins.allow` ให้ใส่ `codex` ไว้ที่นั่นด้วย:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

การตั้ง `agents.defaults.model` หรือโมเดลของเอเจนต์ให้เป็น `codex/<model>` ก็จะ
auto-enable bundled plugin `codex` ด้วย การมี plugin entry แบบ explicit ยังคง
มีประโยชน์ใน shared configs เพราะทำให้เจตนาของการปรับใช้ชัดเจน

## เพิ่ม Codex โดยไม่แทนที่โมเดลอื่น

คง `runtime: "auto"` ไว้เมื่อคุณต้องการให้ Codex ใช้กับโมเดล `codex/*` และให้ PI ใช้กับ
ทุกอย่างอื่น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

ด้วยรูปแบบนี้:

- `/model codex` หรือ `/model codex/gpt-5.4` จะใช้ Codex app-server harness
- `/model gpt` หรือ `/model openai/gpt-5.4` จะใช้เส้นทางผู้ให้บริการ OpenAI
- `/model opus` จะใช้เส้นทางผู้ให้บริการ Anthropic
- หากเลือกโมเดลที่ไม่ใช่ Codex, PI จะยังคงเป็น compatibility harness

## การติดตั้งแบบ Codex-only

ปิด PI fallback เมื่อต้องการพิสูจน์ว่าเทิร์นของเอเจนต์แบบฝังตัวทุกครั้งใช้
Codex harness:

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

override ผ่าน environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้น หาก Codex plugin ถูกปิด,
โมเดลที่ร้องขอไม่ใช่ ref แบบ `codex/*`, app-server เก่าเกินไป หรือ
app-server เริ่มต้นไม่ได้

## Codex แบบรายเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งเป็น Codex-only ในขณะที่เอเจนต์ค่าเริ่มต้นยังคง
ใช้การเลือกอัตโนมัติแบบปกติ:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันปกติเพื่อสลับเอเจนต์และโมเดล `/new` จะสร้าง
เซสชัน OpenClaw ใหม่ และ Codex harness จะสร้างหรือ resume sidecar app-server
thread ตามต้องการ `/reset` จะล้างการ bind ของเซสชัน OpenClaw สำหรับ thread นั้น

## การค้นหาโมเดล

ตามค่าเริ่มต้น Codex plugin จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้ หาก
การค้นหาล้มเหลวหรือหมดเวลา มันจะใช้ fallback catalog แบบ bundled:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

คุณสามารถปรับแต่งการค้นหาได้ภายใต้ `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

ปิด discovery หากคุณต้องการให้ startup หลีกเลี่ยงการ probe Codex และยึด fallback catalog:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## การเชื่อมต่อ app-server และนโยบาย

ตามค่าเริ่มต้น plugin จะเริ่ม Codex ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

ตามค่าเริ่มต้น OpenClaw จะเริ่ม local Codex harness sessions ในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าที trusted local operator ที่ใช้
สำหรับ Heartbeat แบบอัตโนมัติ: Codex สามารถใช้เครื่องมือ shell และ network ได้โดยไม่หยุดรอ native approval prompts ที่ไม่มีใครอยู่มาตอบ

หากต้องการเลือกใช้ approvals แบบ guardian-reviewed ของ Codex ให้ตั้ง `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

โหมด Guardian จะขยายเป็น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian คือ native approval reviewer ของ Codex เมื่อ Codex ขอออกจาก
sandbox, เขียนนอก workspace หรือเพิ่มสิทธิ์อย่าง network access,
Codex จะส่งคำขออนุมัตินั้นไปยัง reviewer subagent แทน human
prompt ตัว reviewer จะรวบรวมบริบทและใช้กรอบความเสี่ยงของ Codex จากนั้น
อนุมัติหรือปฏิเสธคำขอเฉพาะนั้น Guardian มีประโยชน์เมื่อคุณต้องการราวกันตก
มากกว่าโหมด YOLO แต่ยังต้องการให้เอเจนต์และ Heartbeat แบบ unattended
เดินหน้าต่อได้

Docker live harness จะมี Guardian probe เมื่อ
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` มันจะเริ่ม Codex harness ใน
โหมด Guardian, ตรวจสอบว่าคำสั่ง shell แบบ escalated ที่ไม่เป็นอันตรายได้รับการอนุมัติ และ
ตรวจสอบว่าการอัปโหลด secret ปลอมไปยังปลายทางภายนอกที่ไม่เชื่อถือได้ถูกปฏิเสธ
เพื่อให้เอเจนต์ต้องย้อนกลับมาขอการอนุมัติอย่างชัดเจน

ฟิลด์นโยบายรายตัวจะยังคงมีผลเหนือ `mode` ดังนั้นการปรับใช้ขั้นสูงสามารถ
ผสม preset กับตัวเลือกแบบ explicit ได้

สำหรับ app-server ที่รันอยู่แล้ว ให้ใช้ WebSocket transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                                | ความหมาย                                                                                                   |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                  | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อไปยัง `url`                                           |
| `command`           | `"codex"`                                  | executable สำหรับ stdio transport                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]`   | อาร์กิวเมนต์สำหรับ stdio transport                                                                        |
| `url`               | ไม่ตั้งค่า                                  | URL ของ WebSocket app-server                                                                              |
| `authToken`         | ไม่ตั้งค่า                                  | Bearer token สำหรับ WebSocket transport                                                                   |
| `headers`           | `{}`                                       | WebSocket headers เพิ่มเติม                                                                                |
| `requestTimeoutMs`  | `60000`                                    | timeout สำหรับ app-server control-plane calls                                                             |
| `mode`              | `"yolo"`                                   | preset สำหรับการทำงานแบบ YOLO หรือแบบ guardian-reviewed                                                   |
| `approvalPolicy`    | `"never"`                                  | นโยบายการอนุมัติแบบเนทีฟของ Codex ที่ส่งไปยัง thread start/resume/turn                                   |
| `sandbox`           | `"danger-full-access"`                     | โหมด sandbox แบบเนทีฟของ Codex ที่ส่งไปยัง thread start/resume                                           |
| `approvalsReviewer` | `"user"`                                   | ใช้ `"guardian_subagent"` เพื่อให้ Codex Guardian ตรวจทาน prompts                                         |
| `serviceTier`       | ไม่ตั้งค่า                                  | service tier แบบเลือกได้ของ Codex app-server: `"fast"`, `"flex"` หรือ `null` ค่าแบบเก่าที่ไม่ถูกต้องจะถูกละเลย |

environment variables แบบเก่าก็ยังใช้เป็น fallback ได้สำหรับการทดสอบในเครื่อง เมื่อ
ฟิลด์ config ที่ตรงกันยังไม่ได้ตั้งค่า:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

ได้ถอด `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว config
เป็นวิธีที่แนะนำสำหรับการปรับใช้แบบทำซ้ำได้ เพราะทำให้พฤติกรรมของ plugin อยู่ใน
ไฟล์ที่ผ่านการทบทวนเดียวกันกับส่วนที่เหลือของการตั้งค่า Codex harness

## สูตรที่ใช้บ่อย

Codex ในเครื่องด้วย stdio transport แบบค่าเริ่มต้น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

การตรวจสอบ Codex-only harness โดยปิด PI fallback:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex approvals แบบ guardian-reviewed:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server ระยะไกลพร้อม headers แบบ explicit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw ถูกเชื่อมกับ
Codex thread ที่มีอยู่แล้ว เทิร์นถัดไปจะส่งโมเดล `codex/*`, provider,
approval policy, sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `codex/gpt-5.4` ไปยัง `codex/gpt-5.2` จะคง
การ bind ของ thread ไว้ แต่จะขอให้ Codex ทำงานต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

bundled plugin ลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต มันเป็นคำสั่ง
ทั่วไปและทำงานได้บนทุก channel ที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, โมเดล, บัญชี, rate limits, MCP servers และ Skills
- `/codex models` แสดงรายการโมเดลแบบสดของ Codex app-server
- `/codex threads [filter]` แสดงรายการ Codex threads ล่าสุด
- `/codex resume <thread-id>` เชื่อมเซสชัน OpenClaw ปัจจุบันเข้ากับ Codex thread ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ Compaction ให้กับ thread ที่เชื่อมอยู่
- `/codex review` เริ่ม Codex native review สำหรับ thread ที่เชื่อมอยู่
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดง Skills ของ Codex app-server

`/codex resume` จะเขียน sidecar binding file แบบเดียวกับที่ harness ใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะ resume Codex thread นั้น ส่ง
โมเดล `codex/*` ที่เลือกอยู่ใน OpenClaw เข้าไปยัง app-server และคง
extended history ไว้

พื้นผิวคำสั่งนี้ต้องใช้ Codex app-server `0.118.0` หรือใหม่กว่า methods
ควบคุมแต่ละรายการจะถูกรายงานเป็น `unsupported by this Codex app-server` หาก
app-server ในอนาคตหรือแบบกำหนดเองไม่เปิดเผย JSON-RPC method นั้น

## เครื่องมือ สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะตัวรัน embedded agent ระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบไดนามิกจาก
harness ข้อความ, รูปภาพ, วิดีโอ, เพลง, TTS, approvals และเอาต์พุตจาก messaging-tool
ยังคงวิ่งผ่านเส้นทางการส่งปกติของ OpenClaw

Codex MCP tool approval elicitations จะถูกจัดเส้นทางผ่าน plugin
approval flow ของ OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"`; คำขอ elicitation อื่นๆ และคำขออินพุตแบบ free-form จะยังคง fail
closed

เมื่อโมเดลที่เลือกใช้ Codex harness การทำ Compaction ของ thread แบบเนทีฟจะถูก
มอบหมายให้ Codex app-server OpenClaw จะคง transcript mirror ไว้สำหรับประวัติของ channel,
การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต mirror นี้
รวมถึง user prompt, ข้อความ assistant สุดท้าย และ reasoning หรือ plan records แบบ lightweight ของ Codex เมื่อ app-server ส่งออกมา
ปัจจุบัน OpenClaw บันทึกเพียงสัญญาณเริ่มต้นและเสร็จสิ้นของ Compaction แบบเนทีฟเท่านั้น มันยังไม่เปิดเผย
สรุป Compaction แบบอ่านได้โดยมนุษย์ หรือรายการที่ตรวจสอบได้ว่า Codex
เก็บ entries ใดไว้หลัง Compaction

การสร้างสื่อไม่จำเป็นต้องใช้ PI การสร้างภาพ, วิดีโอ, เพลง, PDF, TTS และ media
understanding ยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ปัญหา

**Codex ไม่ปรากฏใน `/model`:** เปิด `plugins.entries.codex.enabled`,
ตั้ง model ref แบบ `codex/*` หรือตรวจสอบว่า `plugins.allow` ไม่ได้ตัด `codex` ออก

**OpenClaw ใช้ PI แทน Codex:** หากไม่มี Codex harness ตัวใดรับผิดชอบการรันนั้น
OpenClaw อาจใช้ PI เป็น compatibility backend ให้ตั้ง
`embeddedHarness.runtime: "codex"` เพื่อบังคับการเลือก Codex ระหว่างทดสอบ หรือ
`embeddedHarness.fallback: "none"` เพื่อให้ล้มเหลวเมื่อไม่มี plugin harness ตัวใดตรงกัน เมื่อเลือก Codex app-server แล้ว ความล้มเหลวของมันจะถูกแสดงโดยตรงโดยไม่ต้องมีการตั้งค่า fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex ให้ app-server handshake
รายงานเวอร์ชัน `0.118.0` หรือใหม่กว่า

**การค้นหาโมเดลช้า:** ลด `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิด discovery

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และว่า remote app-server พูดโปรโตคอล Codex app-server เวอร์ชันเดียวกันหรือไม่

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นั่นเป็นพฤติกรรมที่คาดไว้ Codex harness จะรับผิดชอบเฉพาะ
model refs แบบ `codex/*`

## ที่เกี่ยวข้อง

- [Agent Harness Plugins](/th/plugins/sdk-agent-harness)
- [Model Providers](/th/concepts/model-providers)
- [Configuration Reference](/th/gateway/configuration-reference)
- [Testing](/th/help/testing#live-codex-app-server-harness-smoke)
