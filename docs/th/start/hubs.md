---
read_when:
    - คุณต้องการแผนผังเอกสารทั้งหมดแบบครบถ้วน
summary: ฮับที่ลิงก์ไปยังเอกสารทุกหน้าของ OpenClaw
title: ฮับเอกสาร
x-i18n:
    generated_at: "2026-04-24T09:33:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 711d23631ca29b122054b1a048058ec5bd787043e7ffc8c3108b17cf275c2c8e
    source_path: start/hubs.md
    workflow: 15
---

<Note>
หากคุณเพิ่งเริ่มใช้ OpenClaw ให้เริ่มที่ [Getting Started](/th/start/getting-started)
</Note>

ใช้ฮับเหล่านี้เพื่อค้นหาทุกหน้า รวมถึงเอกสารเจาะลึกและเอกสารอ้างอิงที่ไม่ปรากฏในแถบนำทางด้านซ้าย

## เริ่มที่นี่

- [ดัชนี](/th)
- [Getting Started](/th/start/getting-started)
- [Onboarding](/th/start/onboarding)
- [Onboarding (CLI)](/th/start/wizard)
- [การตั้งค่า](/th/start/setup)
- [แดชบอร์ด (Gateway ในเครื่อง)](http://127.0.0.1:18789/)
- [ความช่วยเหลือ](/th/help)
- [ไดเรกทอรีเอกสาร](/th/start/docs-directory)
- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [ผู้ช่วย OpenClaw](/th/start/openclaw)
- [ตัวอย่างการใช้งาน](/th/start/showcase)
- [Lore](/th/start/lore)

## การติดตั้ง + การอัปเดต

- [Docker](/th/install/docker)
- [Nix](/th/install/nix)
- [การอัปเดต / ย้อนกลับ](/th/install/updating)
- [เวิร์กโฟลว์ Bun (ทดลอง)](/th/install/bun)

## แนวคิดหลัก

- [สถาปัตยกรรม](/th/concepts/architecture)
- [ฟีเจอร์](/th/concepts/features)
- [ฮับเครือข่าย](/th/network)
- [runtime ของเอเจนต์](/th/concepts/agent)
- [workspace ของเอเจนต์](/th/concepts/agent-workspace)
- [Memory](/th/concepts/memory)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [การสตรีม + chunking](/th/concepts/streaming)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [Compaction](/th/concepts/compaction)
- [เซสชัน](/th/concepts/session)
- [Session pruning](/th/concepts/session-pruning)
- [เครื่องมือเซสชัน](/th/concepts/session-tool)
- [คิว](/th/concepts/queue)
- [คำสั่ง slash](/th/tools/slash-commands)
- [RPC adapters](/th/reference/rpc)
- [สคีมา TypeBox](/th/concepts/typebox)
- [การจัดการเขตเวลา](/th/concepts/timezone)
- [สถานะออนไลน์](/th/concepts/presence)
- [การค้นพบ + ทรานสปอร์ต](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
- [การกำหนดเส้นทางช่องทางส่งข้อความ](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [failover ของโมเดล](/th/concepts/model-failover)
- [OAuth](/th/concepts/oauth)

## ผู้ให้บริการ + ingress

- [ฮับช่องทางแชต](/th/channels)
- [ฮับผู้ให้บริการโมเดล](/th/providers/models)
- [WhatsApp](/th/channels/whatsapp)
- [Telegram](/th/channels/telegram)
- [Slack](/th/channels/slack)
- [Discord](/th/channels/discord)
- [Mattermost](/th/channels/mattermost)
- [Signal](/th/channels/signal)
- [BlueBubbles (iMessage)](/th/channels/bluebubbles)
- [QQ Bot](/th/channels/qqbot)
- [iMessage (รุ่นเก่า)](/th/channels/imessage)
- [การแยกวิเคราะห์ตำแหน่ง](/th/channels/location)
- [WebChat](/th/web/webchat)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + การปฏิบัติการ

- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
- [โมเดลเครือข่าย](/th/gateway/network-model)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [ล็อก Gateway](/th/gateway/gateway-lock)
- [โปรเซสเบื้องหลัง](/th/gateway/background-process)
- [สุขภาพระบบ](/th/gateway/health)
- [Heartbeat](/th/gateway/heartbeat)
- [Doctor](/th/gateway/doctor)
- [การบันทึก log](/th/gateway/logging)
- [Sandboxing](/th/gateway/sandboxing)
- [แดชบอร์ด](/th/web/dashboard)
- [Control UI](/th/web/control-ui)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [README ของ remote gateway](/th/gateway/remote-gateway-readme)
- [Tailscale](/th/gateway/tailscale)
- [ความปลอดภัย](/th/gateway/security)
- [การแก้ปัญหา](/th/gateway/troubleshooting)

## เครื่องมือ + ระบบอัตโนมัติ

- [พื้นผิวเครื่องมือ](/th/tools)
- [OpenProse](/th/prose)
- [เอกสารอ้างอิง CLI](/th/cli)
- [Exec tool](/th/tools/exec)
- [PDF tool](/th/tools/pdf)
- [โหมดยกระดับสิทธิ์](/th/tools/elevated)
- [Cron jobs](/th/automation/cron-jobs)
- [ระบบอัตโนมัติและงาน](/th/automation)
- [การคิด + verbose](/th/tools/thinking)
- [โมเดล](/th/concepts/models)
- [เอเจนต์ย่อย](/th/tools/subagents)
- [CLI สำหรับส่งถึงเอเจนต์](/th/tools/agent-send)
- [Terminal UI](/th/web/tui)
- [การควบคุมเบราว์เซอร์](/th/tools/browser)
- [เบราว์เซอร์ (การแก้ปัญหาบน Linux)](/th/tools/browser-linux-troubleshooting)
- [โพลล์](/th/cli/message)

## Nodes, สื่อ, เสียง

- [ภาพรวม Nodes](/th/nodes)
- [กล้อง](/th/nodes/camera)
- [รูปภาพ](/th/nodes/images)
- [เสียง](/th/nodes/audio)
- [คำสั่งตำแหน่ง](/th/nodes/location-command)
- [ปลุกด้วยเสียง](/th/nodes/voicewake)
- [โหมด Talk](/th/nodes/talk)

## แพลตฟอร์ม

- [ภาพรวมแพลตฟอร์ม](/th/platforms)
- [macOS](/th/platforms/macos)
- [iOS](/th/platforms/ios)
- [Android](/th/platforms/android)
- [Windows (WSL2)](/th/platforms/windows)
- [Linux](/th/platforms/linux)
- [พื้นผิวเว็บ](/th/web)

## แอป macOS companion (ขั้นสูง)

- [การตั้งค่าสำหรับพัฒนาบน macOS](/th/platforms/mac/dev-setup)
- [แถบเมนู macOS](/th/platforms/mac/menu-bar)
- [การปลุกด้วยเสียงบน macOS](/th/platforms/mac/voicewake)
- [โอเวอร์เลย์เสียงบน macOS](/th/platforms/mac/voice-overlay)
- [WebChat บน macOS](/th/platforms/mac/webchat)
- [Canvas บน macOS](/th/platforms/mac/canvas)
- [child process บน macOS](/th/platforms/mac/child-process)
- [สุขภาพระบบบน macOS](/th/platforms/mac/health)
- [ไอคอน macOS](/th/platforms/mac/icon)
- [การบันทึก log บน macOS](/th/platforms/mac/logging)
- [สิทธิ์บน macOS](/th/platforms/mac/permissions)
- [การเชื่อมต่อระยะไกลบน macOS](/th/platforms/mac/remote)
- [การเซ็นบน macOS](/th/platforms/mac/signing)
- [Gateway บน macOS (launchd)](/th/platforms/mac/bundled-gateway)
- [XPC บน macOS](/th/platforms/mac/xpc)
- [Skills บน macOS](/th/platforms/mac/skills)
- [Peekaboo บน macOS](/th/platforms/mac/peekaboo)

## ปลั๊กอิน

- [ภาพรวมปลั๊กอิน](/th/tools/plugin)
- [การสร้างปลั๊กอิน](/th/plugins/building-plugins)
- [manifest ของปลั๊กอิน](/th/plugins/manifest)
- [เครื่องมือเอเจนต์](/th/plugins/building-plugins#registering-agent-tools)
- [ปลั๊กอิน bundles](/th/plugins/bundles)
- [ปลั๊กอินชุมชน](/th/plugins/community)
- [คู่มือสูตรความสามารถ](/th/plugins/architecture)
- [ปลั๊กอิน voice call](/th/plugins/voice-call)
- [ปลั๊กอินผู้ใช้ Zalo](/th/plugins/zalouser)

## Workspace + แม่แบบ

- [Skills](/th/tools/skills)
- [ClawHub](/th/tools/clawhub)
- [config ของ Skills](/th/tools/skills-config)
- [AGENTS เริ่มต้น](/th/reference/AGENTS.default)
- [แม่แบบ: AGENTS](/th/reference/templates/AGENTS)
- [แม่แบบ: BOOTSTRAP](/th/reference/templates/BOOTSTRAP)
- [แม่แบบ: HEARTBEAT](/th/reference/templates/HEARTBEAT)
- [แม่แบบ: IDENTITY](/th/reference/templates/IDENTITY)
- [แม่แบบ: SOUL](/th/reference/templates/SOUL)
- [แม่แบบ: TOOLS](/th/reference/templates/TOOLS)
- [แม่แบบ: USER](/th/reference/templates/USER)

## โปรเจกต์

- [เครดิต](/th/reference/credits)

## การทดสอบ + รีลีส

- [การทดสอบ](/th/reference/test)
- [นโยบายการรีลีส](/th/reference/RELEASING)
- [รุ่นอุปกรณ์](/th/reference/device-models)

## ที่เกี่ยวข้อง

- [Getting started](/th/start/getting-started)
