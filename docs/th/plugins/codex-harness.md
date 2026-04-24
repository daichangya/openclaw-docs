---
read_when:
    - คุณต้องการใช้ Codex app-server harness ที่มาพร้อมกัน
    - คุณต้องการ model refs ของ Codex และตัวอย่าง config
    - คุณต้องการปิด PI fallback สำหรับการติดตั้งแบบ Codex-only
summary: รันเทิร์นของเอเจนต์แบบฝังใน OpenClaw ผ่าน Codex app-server harness ที่มาพร้อมกัน
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T09:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Plugin `codex` ที่มาพร้อมกันช่วยให้ OpenClaw รันเทิร์นของเอเจนต์แบบฝังผ่าน
Codex app-server แทน PI harness ที่มีมาในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: model
discovery, native thread resume, native compaction และการรันผ่าน app-server
ขณะที่ OpenClaw ยังคงเป็นเจ้าของ chat channels, session files, model selection, tools,
approvals, media delivery และ visible transcript mirror

native Codex turns ยังคงใช้ OpenClaw plugin hooks เป็นชั้นความเข้ากันได้สาธารณะ
hook เหล่านี้เป็น OpenClaw hooks ภายในโปรเซส ไม่ใช่ command hooks ของ Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` สำหรับ mirrored transcript records
- `agent_end`

bundled plugins ยังสามารถลงทะเบียน Codex app-server extension factory เพื่อเพิ่ม async `tool_result` middleware ได้ โดย
middleware นี้จะทำงานสำหรับ OpenClaw dynamic tools หลังจาก OpenClaw รัน tool แล้ว และก่อนส่งผลลัพธ์กลับไปยัง Codex มันแยกจาก public `tool_result_persist` plugin hook ซึ่งใช้แปลง OpenClaw-owned transcript tool-result writes

harness นี้ปิดอยู่โดยค่าเริ่มต้น configs ใหม่ควรคง OpenAI model refs
ในรูปแบบมาตรฐาน `openai/gpt-*` และบังคับอย่างชัดเจนด้วย
`embeddedHarness.runtime: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อ
ต้องการ native app-server execution ส่วน legacy `codex/*` model refs ยังคงเลือก harness นี้อัตโนมัติเพื่อความเข้ากันได้

## เลือก model prefix ให้ถูกต้อง

เส้นทางในตระกูล OpenAI แยกกันตาม prefix ให้ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อคุณต้องการ direct OpenAI API access หรือ
เมื่อคุณกำลังบังคับ native Codex app-server harness:

| Model ref                                             | Runtime path                                 | ใช้เมื่อ                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenAI provider ผ่านโครงสร้าง OpenClaw/PI   | คุณต้องการ direct OpenAI Platform API access ปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth ผ่าน OpenClaw/PI          | คุณต้องการ auth แบบ ChatGPT/Codex subscription ด้วย PI runner ค่าเริ่มต้น |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | คุณต้องการ native Codex app-server execution สำหรับเทิร์นเอเจนต์แบบฝัง    |

ขณะนี้ GPT-5.5 ใน OpenClaw รองรับเฉพาะแบบ subscription/OAuth เท่านั้น ให้ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือ `openai/gpt-5.5` ร่วมกับ Codex
app-server harness ส่วน direct API-key access สำหรับ `openai/gpt-5.5` จะรองรับ
เมื่อ OpenAI เปิดใช้ GPT-5.5 บน public API

legacy `codex/gpt-*` refs ยังคงได้รับการยอมรับเป็น compatibility aliases สำหรับ
configs ใหม่ที่ใช้ PI Codex OAuth ควรใช้ `openai-codex/gpt-*`; ส่วน configs ใหม่ที่ใช้ native app-server
harness ควรใช้ `openai/gpt-*` ร่วมกับ `embeddedHarness.runtime:
"codex"`

`agents.defaults.imageModel` ใช้การแยกตาม prefix แบบเดียวกัน ให้ใช้
`openai-codex/gpt-*` เมื่อ image understanding ควรรันผ่านเส้นทาง OpenAI
Codex OAuth provider ใช้ `codex/gpt-*` เมื่อ image understanding ควรรัน
ผ่าน bounded Codex app-server turn โมเดล Codex app-server ต้อง
ประกาศว่ารองรับ image input; โมเดล Codex แบบข้อความล้วนจะล้มเหลวก่อน media turn
เริ่ม

ใช้ `/status` เพื่อยืนยัน harness ที่มีผลจริงสำหรับเซสชันปัจจุบัน หากการเลือกนั้นดูผิดคาด ให้เปิด debug logging สำหรับ subsystem `agents/harness` แล้วตรวจสอบ structured `agent harness selected` record ของ gateway มันจะมี harness id ที่ถูกเลือก เหตุผลของการเลือก runtime/fallback policy และ
ในโหมด `auto` จะรวมผลการรองรับของแต่ละ plugin candidate

การเลือก harness ไม่ใช่ตัวควบคุมเซสชันแบบสด เมื่อเทิร์นแบบฝังทำงาน
OpenClaw จะบันทึก harness id ที่ถูกเลือกไว้บนเซสชันนั้น และใช้ต่อไปสำหรับเทิร์นถัดไปใน session id เดียวกัน เปลี่ยน config `embeddedHarness` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น;
ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับบทสนทนาที่มีอยู่ระหว่าง PI และ Codex วิธีนี้หลีกเลี่ยงการ replay transcript เดียวกันผ่าน native session systems สองแบบที่เข้ากันไม่ได้

legacy sessions ที่สร้างก่อนมี harness pins จะถูกมองว่า pin กับ PI เมื่อมันมี transcript history แล้ว ใช้ `/new` หรือ `/reset` เพื่อเปลี่ยนบทสนทนานั้นไปใช้ Codex หลังจากเปลี่ยน config

`/status` จะแสดง non-PI harness ที่มีผลจริงข้าง `Fast` เช่น
`Fast · codex` ส่วน PI harness ค่าเริ่มต้นยังคงแสดงเป็น `Runner: pi (embedded)` และจะไม่เพิ่ม badge ของ harness แยกต่างหาก

## ข้อกำหนด

- OpenClaw ที่มี bundled `codex` plugin พร้อมใช้งาน
- Codex app-server `0.118.0` หรือใหม่กว่า
- มี Codex auth ให้กับโปรเซส app-server

Plugin จะบล็อก handshakes ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน ซึ่งช่วยให้
OpenClaw อยู่บนพื้นผิว protocol ที่มันถูกทดสอบมาแล้ว

สำหรับ live และ Docker smoke tests โดยทั่วไป auth จะมาจาก `OPENAI_API_KEY` พร้อมไฟล์ Codex CLI แบบไม่บังคับ เช่น `~/.codex/auth.json` และ
`~/.codex/config.toml` ให้ใช้ auth material ชุดเดียวกับที่ local Codex app-server ของคุณใช้

## Config ขั้นต่ำ

ใช้ `openai/gpt-5.5`, เปิด bundled plugin และบังคับ `codex` harness:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

หาก config ของคุณใช้ `plugins.allow`, ให้รวม `codex` ไว้ด้วย:

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

legacy configs ที่ตั้ง `agents.defaults.model` หรือ model ของเอเจนต์เป็น
`codex/<model>` จะยังคงเปิด bundled `codex` plugin อัตโนมัติ configs ใหม่ควร
เลือกใช้ `openai/<model>` ร่วมกับ `embeddedHarness` แบบชัดเจนด้านบน

## เพิ่ม Codex โดยไม่แทนที่โมเดลอื่น

คง `runtime: "auto"` ไว้เมื่อคุณต้องการให้ legacy `codex/*` refs เลือก Codex และ
ให้ PI สำหรับอย่างอื่นทั้งหมด สำหรับ configs ใหม่ ควรใช้ `runtime: "codex"` แบบชัดเจนบนเอเจนต์ที่ควรใช้ harness นี้

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

ด้วยรูปแบบนี้:

- `/model gpt` หรือ `/model openai/gpt-5.5` จะใช้ Codex app-server harness สำหรับ config นี้
- `/model opus` จะใช้เส้นทาง Anthropic provider
- หากเลือกโมเดลที่ไม่ใช่ Codex, PI จะยังคงเป็น compatibility harness

## การติดตั้งแบบ Codex-only

ปิด PI fallback เมื่อคุณต้องการพิสูจน์ว่าเทิร์นเอเจนต์แบบฝังทุกเทิร์นใช้
Codex harness:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Environment override:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback, OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Codex plugin ถูกปิดอยู่,
app-server เก่าเกินไป หรือ app-server เริ่มต้นไม่สำเร็จ

## Codex รายเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์ค่าเริ่มต้นยังคงใช้
auto-selection ปกติ:

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันตามปกติเพื่อสลับเอเจนต์และโมเดล `/new` จะสร้าง
OpenClaw session ใหม่ และ Codex harness จะสร้างหรือ resume sidecar app-server
thread ของมันตามต้องการ `/reset` จะล้าง OpenClaw session binding สำหรับ thread นั้น
และปล่อยให้เทิร์นถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## Model discovery

โดยค่าเริ่มต้น Codex plugin จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้งาน หาก
discovery ล้มเหลวหรือ timeout มันจะใช้ fallback catalog ที่มาพร้อมกันสำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับ discovery ใต้ `plugins.entries.codex.config.discovery`:

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

ปิด discovery เมื่อต้องการให้ startup ไม่ probe Codex และยึด fallback catalog:

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

## การเชื่อมต่อ App-server และนโยบาย

โดยค่าเริ่มต้น Plugin จะเริ่ม Codex ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

โดยค่าเริ่มต้น OpenClaw จะเริ่ม local Codex harness sessions ในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือ trusted local operator posture ที่ใช้
สำหรับ Heartbeat แบบอัตโนมัติ: Codex สามารถใช้ shell และ network tools ได้โดยไม่ต้องหยุดที่ native approval prompts ที่ไม่มีใครอยู่ตอบ

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

Guardian คือ native Codex approval reviewer เมื่อ Codex ขอออกนอก sandbox เขียนนอก workspace หรือเพิ่ม permissions เช่น network access, Codex จะส่งคำขอ approval นั้นไปยัง reviewer subagent แทนที่จะถามมนุษย์ reviewer จะใช้งาน risk framework ของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการ guardrails มากกว่าโหมด YOLO แต่ยังต้องการให้เอเจนต์แบบ unattended ทำงานคืบหน้าได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` และ `sandbox: "workspace-write"` โดยฟิลด์นโยบายแต่ละตัวจะยังคงใช้แทน `mode` ได้ ดังนั้นระบบติดตั้งขั้นสูงจึงสามารถผสม preset นี้กับตัวเลือกแบบชัดเจนได้

สำหรับ app-server ที่กำลังทำงานอยู่แล้ว ให้ใช้ WebSocket transport:

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

| Field               | ค่าเริ่มต้น                              | ความหมาย                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อไปยัง `url`                                           |
| `command`           | `"codex"`                                | ไฟล์ปฏิบัติการสำหรับ stdio transport                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ stdio transport                                                                       |
| `url`               | unset                                    | URL ของ WebSocket app-server                                                                              |
| `authToken`         | unset                                    | Bearer token สำหรับ WebSocket transport                                                                   |
| `headers`           | `{}`                                     | WebSocket headers เพิ่มเติม                                                                               |
| `requestTimeoutMs`  | `60000`                                  | timeout สำหรับ app-server control-plane calls                                                             |
| `mode`              | `"yolo"`                                 | preset สำหรับการรันแบบ YOLO หรือแบบ guardian-reviewed                                                   |
| `approvalPolicy`    | `"never"`                                | นโยบาย approval แบบเนทีฟของ Codex ที่ส่งไปตอน thread start/resume/turn                                  |
| `sandbox`           | `"danger-full-access"`                   | โหมด sandbox แบบเนทีฟของ Codex ที่ส่งไปตอน thread start/resume                                          |
| `approvalsReviewer` | `"user"`                                 | ใช้ `"guardian_subagent"` เพื่อให้ Codex Guardian ตรวจสอบ prompts                                        |
| `serviceTier`       | unset                                    | service tier ของ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่าแบบ legacy ที่ไม่ถูกต้องจะถูกเพิกเฉย |

ตัวแปรสภาพแวดล้อมรุ่นเก่ายังคงใช้เป็น fallback สำหรับการทดสอบในเครื่องได้ เมื่อ
ฟิลด์ config ที่ตรงกันยังไม่ได้ตั้งค่า:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งคราว
ควรใช้ config สำหรับการติดตั้งที่ทำซ้ำได้ เพราะช่วยให้พฤติกรรมของ Plugin อยู่ใน
ไฟล์ที่ผ่านการตรวจสอบชุดเดียวกับการตั้งค่า Codex harness ส่วนที่เหลือ

## สูตรที่ใช้บ่อย

Codex ในเครื่องพร้อม stdio transport เริ่มต้น:

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

app-server ระยะไกลพร้อม headers แบบชัดเจน:

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

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อ OpenClaw session ถูก attach
เข้ากับ Codex thread ที่มีอยู่ เทิร์นถัดไปจะส่ง
OpenAI model, provider, approval policy, sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` ไปเป็น `openai/gpt-5.2` จะคง
thread binding เดิมไว้ แต่จะขอให้ Codex ทำงานต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin ที่มาพร้อมกันจะลงทะเบียน `/codex` เป็น authorized slash command โดย
เป็นคำสั่งแบบทั่วไปและใช้ได้กับทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดง app-server connectivity, models, account, rate limits, MCP servers และ skills แบบสด
- `/codex models` แสดงรายการโมเดลของ Codex app-server แบบสด
- `/codex threads [filter]` แสดง Codex threads ล่าสุด
- `/codex resume <thread-id>` ผูก OpenClaw session ปัจจุบันเข้ากับ Codex thread ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ compaction ให้กับ thread ที่ผูกไว้
- `/codex review` เริ่ม Codex native review สำหรับ thread ที่ผูกไว้
- `/codex account` แสดงสถานะ account และ rate-limit
- `/codex mcp` แสดงสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดง skills ของ Codex app-server

`/codex resume` จะเขียน sidecar binding file เดียวกันกับที่ harness ใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะ resume Codex thread นั้น ส่ง
โมเดล OpenClaw ที่เลือกอยู่ในปัจจุบันเข้า app-server และคง extended history
ไว้

พื้นผิวคำสั่งนี้ต้องใช้ Codex app-server `0.118.0` หรือใหม่กว่า เมธอดควบคุมแต่ละตัว
จะรายงานเป็น `unsupported by this Codex app-server` หาก
app-server รุ่นใหม่ในอนาคตหรือแบบกำหนดเองไม่เปิดเผย JSON-RPC method นั้น

## ขอบเขตของ Hook

Codex harness มี hook อยู่ 3 ชั้น:

| Layer                                 | Owner                    | Purpose                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | ความเข้ากันได้ของ product/plugin ข้าม PI และ Codex harnesses      |
| Codex app-server extension middleware | OpenClaw bundled plugins | พฤติกรรม adapter รายเทิร์นรอบ OpenClaw dynamic tools              |
| Codex native hooks                    | Codex                    | วงจรชีวิตระดับล่างของ Codex และ native tool policy จาก Codex config |

OpenClaw ไม่ใช้ไฟล์ Codex `hooks.json` ระดับโปรเจกต์หรือระดับ global เพื่อกำหนดเส้นทาง
พฤติกรรมของ OpenClaw plugin โดย Codex native hooks มีประโยชน์สำหรับการทำงาน
ที่ Codex เป็นเจ้าของ เช่น shell policy, การทบทวนผลลัพธ์ของ native tool, การจัดการการหยุด และ native compaction/model lifecycle แต่ไม่ใช่ OpenClaw plugin API

สำหรับ OpenClaw dynamic tools, OpenClaw จะรัน tool หลังจาก Codex ร้องขอ
การเรียก ดังนั้น OpenClaw จึงเรียกพฤติกรรม plugin และ middleware ที่มันเป็นเจ้าของใน
harness adapter สำหรับ Codex-native tools, Codex เป็นเจ้าของ canonical tool record
OpenClaw สามารถ mirror เหตุการณ์บางรายการได้ แต่ไม่สามารถเขียน native Codex
thread ใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ native hook
callbacks

เมื่อ Codex app-server builds รุ่นใหม่กว่าเปิดเผย native compaction และ model lifecycle
hook events, OpenClaw ควร version-gate การรองรับ protocol นั้น และแมป
events เหล่านั้นเข้าสู่สัญญา hook ของ OpenClaw ที่มีอยู่ในจุดที่ความหมายยังซื่อตรง
จนกว่าจะถึงตอนนั้น events `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw ยังคงเป็นการสังเกตการณ์ระดับ adapter ไม่ใช่การจับข้อมูลแบบ byte-for-byte
ของคำขอภายในหรือ compaction payloads ของ Codex

การแจ้งเตือน app-server แบบ native `hook/started` และ `hook/completed` ของ Codex
จะถูกฉายเป็น `codex_app_server.hook` agent events สำหรับ trajectory และการดีบัก
แต่จะไม่เรียก OpenClaw plugin hooks

## Tools, media และ compaction

Codex harness เปลี่ยนเฉพาะตัวรันเอเจนต์แบบฝังระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการ tools และรับผลลัพธ์ dynamic tool จาก
harness ข้อความ ภาพ วิดีโอ เพลง TTS approvals และผลลัพธ์จาก messaging-tool
ยังคงไหลผ่านเส้นทางการส่งมอบปกติของ OpenClaw

Codex MCP tool approval elicitations จะถูกกำหนดเส้นทางผ่านโฟลว์การอนุมัติของ Plugin ใน OpenClaw เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` ส่วน prompts ของ Codex `request_user_input` จะถูกส่งกลับไปยังแชตต้นทาง และข้อความติดตามผลรายการถัดไปในคิวจะตอบคำขอ native
server นั้น แทนที่จะถูกบังคับให้เป็นบริบทเพิ่มเติม ส่วน MCP elicitation requests ชนิดอื่นจะยัง fail closed

เมื่อโมเดลที่เลือกใช้ Codex harness, native thread compaction จะถูกมอบหมายให้
Codex app-server ขณะที่ OpenClaw ยังคงเก็บ transcript mirror สำหรับประวัติช่องทาง
การค้นหา `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต โดย
mirror นี้รวม user prompt, ข้อความ assistant สุดท้าย และ lightweight Codex
reasoning หรือ plan records เมื่อ app-server ส่งออกมา ขณะนี้ OpenClaw บันทึกเพียง
สัญญาณเริ่มต้นและเสร็จสิ้นของ native compaction เท่านั้น มันยังไม่เปิดเผย
compaction summary ที่มนุษย์อ่านได้ หรือรายการที่ตรวจสอบย้อนหลังได้ว่า Codex
เก็บ entries ใดไว้หลัง compaction

เนื่องจาก Codex เป็นเจ้าของ canonical native thread, `tool_result_persist` จึงยังไม่
เขียน Codex-native tool result records ใหม่ในขณะนี้ มันมีผลเฉพาะเมื่อ
OpenClaw กำลังเขียน session transcript tool result ที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่จำเป็นต้องใช้ PI การสร้างภาพ วิดีโอ เพลง PDF TTS และ media
understanding ยังคงใช้การตั้งค่า provider/model ที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏใน `/model`:** เปิด `plugins.entries.codex.enabled`,
เลือกโมเดล `openai/gpt-*` พร้อม `embeddedHarness.runtime: "codex"` (หรือ
legacy `codex/*` ref) แล้วตรวจสอบว่า `plugins.allow` ไม่ได้ตัด `codex` ออก

**OpenClaw ใช้ PI แทน Codex:** หากไม่มี Codex harness ตัวใดอ้างสิทธิ์การรัน
OpenClaw อาจใช้ PI เป็น compatibility backend ให้ตั้ง
`embeddedHarness.runtime: "codex"` เพื่อบังคับเลือก Codex ระหว่างการทดสอบ หรือ
`embeddedHarness.fallback: "none"` เพื่อล้มเหลวเมื่อไม่มี plugin harness ใดตรงเงื่อนไข เมื่อ
Codex app-server ถูกเลือกแล้ว ความล้มเหลวของมันจะแสดงตรงออกมาโดยไม่ต้องมี
fallback config เพิ่ม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ app-server handshake
รายงานเวอร์ชัน `0.118.0` หรือใหม่กว่า

**model discovery ช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิด discovery

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และให้แน่ใจว่า remote app-server ใช้ Codex app-server protocol version เดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นั่นเป็นพฤติกรรมที่คาดไว้ เว้นแต่คุณจะบังคับ
`embeddedHarness.runtime: "codex"` (หรือเลือก legacy `codex/*` ref) โดย refs แบบธรรมดา
`openai/gpt-*` และ provider refs อื่น ๆ จะยังคงใช้เส้นทาง provider ปกติของพวกมัน

## ที่เกี่ยวข้อง

- [Agent Harness Plugins](/th/plugins/sdk-agent-harness)
- [Model Providers](/th/concepts/model-providers)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
