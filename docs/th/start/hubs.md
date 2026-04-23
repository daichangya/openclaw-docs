---
read_when:
    - คุณต้องการแผนที่เอกสารแบบครบถ้วน to=final
summary: ฮับที่ลิงก์ไปยังเอกสารทุกหน้าของ OpenClaw
title: ฮับเอกสาร to=final
x-i18n:
    generated_at: "2026-04-23T05:57:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4998710e3dc8018a50abc41285caac83df4b3bf8aec2e4a7525a0563649eb06c
    source_path: start/hubs.md
    workflow: 15
---

# ฮับเอกสาร

<Note>
หากคุณเพิ่งเริ่มใช้ OpenClaw ให้เริ่มที่ [Getting Started](/th/start/getting-started)
</Note>

ใช้ฮับเหล่านี้เพื่อค้นหาทุกหน้า รวมถึงเนื้อหาเจาะลึกและเอกสารอ้างอิงที่ไม่ปรากฏในแถบนำทางด้านซ้าย

## เริ่มที่นี่

- [ดัชนี](/th)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [Onboarding](/th/start/onboarding)
- [Onboarding (CLI)](/th/start/wizard)
- [Setup](/th/start/setup)
- [แดชบอร์ด (local Gateway)](http://127.0.0.1:18789/)
- [Help](/th/help)
- [สารบบเอกสาร](/th/start/docs-directory)
- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [ผู้ช่วย OpenClaw](/th/start/openclaw)
- [Showcase](/th/start/showcase)
- [Lore](/th/start/lore)

## การติดตั้ง + การอัปเดต

- [Docker](/th/install/docker)
- [Nix](/th/install/nix)
- [การอัปเดต / การย้อนกลับ](/th/install/updating)
- [เวิร์กโฟลว์ Bun (ทดลอง)](/th/install/bun)

## แนวคิดหลัก

- [สถาปัตยกรรม](/th/concepts/architecture)
- [ฟีเจอร์](/th/concepts/features)
- [ฮับเครือข่าย](/th/network)
- [รันไทม์ของเอเจนต์](/th/concepts/agent)
- [Agent Workspace](/th/concepts/agent-workspace)
- [Memory](/th/concepts/memory)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [Streaming + chunking](/th/concepts/streaming)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [Compaction](/th/concepts/compaction)
- [Sessions](/th/concepts/session)
- [Session pruning](/th/concepts/session-pruning)
- [Session tools](/th/concepts/session-tool)
- [Queue](/th/concepts/queue)
- [คำสั่ง Slash](/th/tools/slash-commands)
- [RPC adapters](/th/reference/rpc)
- [TypeBox schemas](/th/concepts/typebox)
- [การจัดการเขตเวลา](/th/concepts/timezone)
- [Presence](/th/concepts/presence)
- [Discovery + transports](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [Groups](/th/channels/groups)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [Model failover](/th/concepts/model-failover)
- [OAuth](/th/concepts/oauth)

## ผู้ให้บริการ + ingress

- [ฮับช่องแชต](/th/channels)
- [ฮับผู้ให้บริการโมเดล](/th/providers/models)
- [WhatsApp](/th/channels/whatsapp)
- [Telegram](/th/channels/telegram)
- [Slack](/th/channels/slack)
- [Discord](/th/channels/discord)
- [Mattermost](/th/channels/mattermost)
- [Signal](/th/channels/signal)
- [BlueBubbles (iMessage)](/th/channels/bluebubbles)
- [QQ Bot](/th/channels/qqbot)
- [iMessage (legacy)](/th/channels/imessage)
- [การแยกวิเคราะห์ตำแหน่ง](/th/channels/location)
- [WebChat](/web/webchat)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + การปฏิบัติการ

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [โมเดลเครือข่าย](/th/gateway/network-model)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [Gateway lock](/th/gateway/gateway-lock)
- [โปรเซสเบื้องหลัง](/th/gateway/background-process)
- [Health](/th/gateway/health)
- [Heartbeat](/th/gateway/heartbeat)
- [Doctor](/th/gateway/doctor)
- [Logging](/th/gateway/logging)
- [Sandboxing](/th/gateway/sandboxing)
- [แดชบอร์ด](/web/dashboard)
- [Control UI](/web/control-ui)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [README ของ remote gateway](/th/gateway/remote-gateway-readme)
- [Tailscale](/th/gateway/tailscale)
- [ความปลอดภัย](/th/gateway/security)
- [การแก้ไขปัญหา](/th/gateway/troubleshooting)

## Tools + ระบบอัตโนมัติ

- [พื้นผิวของ Tools](/th/tools)
- [OpenProse](/th/prose)
- [เอกสารอ้างอิง CLI](/cli)
- [Exec tool](/th/tools/exec)
- [PDF tool](/th/tools/pdf)
- [Elevated mode](/th/tools/elevated)
- [งาน Cron](/th/automation/cron-jobs)
- [Automation & Tasks](/th/automation)
- [Thinking + verbose](/th/tools/thinking)
- [Models](/th/concepts/models)
- [Sub-agents](/th/tools/subagents)
- [Agent send CLI](/th/tools/agent-send)
- [Terminal UI](/web/tui)
- [การควบคุมเบราว์เซอร์](/th/tools/browser)
- [เบราว์เซอร์ (การแก้ไขปัญหาบน Linux)](/th/tools/browser-linux-troubleshooting)
- [Polls](/cli/message)

## Nodes, สื่อ, เสียง

- [ภาพรวม Nodes](/th/nodes)
- [Camera](/th/nodes/camera)
- [Images](/th/nodes/images)
- [Audio](/th/nodes/audio)
- [คำสั่งตำแหน่ง](/th/nodes/location-command)
- [Voice wake](/th/nodes/voicewake)
- [Talk mode](/th/nodes/talk)

## แพลตฟอร์ม

- [ภาพรวมแพลตฟอร์ม](/th/platforms)
- [macOS](/th/platforms/macos)
- [iOS](/th/platforms/ios)
- [Android](/th/platforms/android)
- [Windows (WSL2)](/th/platforms/windows)
- [Linux](/th/platforms/linux)
- [พื้นผิวเว็บ](/web)

## แอปคู่หู macOS (ขั้นสูง)

- [การตั้งค่า dev บน macOS](/th/platforms/mac/dev-setup)
- [แถบเมนู macOS](/th/platforms/mac/menu-bar)
- [voice wake บน macOS](/th/platforms/mac/voicewake)
- [voice overlay บน macOS](/th/platforms/mac/voice-overlay)
- [WebChat บน macOS](/th/platforms/mac/webchat)
- [Canvas บน macOS](/th/platforms/mac/canvas)
- [child process บน macOS](/th/platforms/mac/child-process)
- [health บน macOS](/th/platforms/mac/health)
- [icon บน macOS](/th/platforms/mac/icon)
- [logging บน macOS](/th/platforms/mac/logging)
- [permissions บน macOS](/th/platforms/mac/permissions)
- [remote บน macOS](/th/platforms/mac/remote)
- [การเซ็นบน macOS](/th/platforms/mac/signing)
- [gateway บน macOS (launchd)](/th/platforms/mac/bundled-gateway)
- [XPC บน macOS](/th/platforms/mac/xpc)
- [Skills บน macOS](/th/platforms/mac/skills)
- [Peekaboo บน macOS](/th/platforms/mac/peekaboo)

## Extensions + Plugins

- [ภาพรวม Plugins](/th/tools/plugin)
- [การสร้าง Plugins](/th/plugins/building-plugins)
- [Plugin manifest](/th/plugins/manifest)
- [Agent tools](/th/plugins/building-plugins#registering-agent-tools)
- [Plugin bundles](/th/plugins/bundles)
- [Community plugins](/th/plugins/community)
- [Capability cookbook](/th/plugins/architecture)
- [Voice call plugin](/th/plugins/voice-call)
- [Zalo user plugin](/th/plugins/zalouser)

## Workspace + เทมเพลต

- [Skills](/th/tools/skills)
- [ClawHub](/th/tools/clawhub)
- [Skills config](/th/tools/skills-config)
- [AGENTS เริ่มต้น](/th/reference/AGENTS.default)
- [เทมเพลต: AGENTS](/th/reference/templates/AGENTS)
- [เทมเพลต: BOOTSTRAP](/th/reference/templates/BOOTSTRAP)
- [เทมเพลต: HEARTBEAT](/th/reference/templates/HEARTBEAT)
- [เทมเพลต: IDENTITY](/th/reference/templates/IDENTITY)
- [เทมเพลต: SOUL](/th/reference/templates/SOUL)
- [เทมเพลต: TOOLS](/th/reference/templates/TOOLS)
- [เทมเพลต: USER](/th/reference/templates/USER)

## โปรเจกต์

- [Credits](/th/reference/credits)

## การทดสอบ + การออกรีลีส

- [Testing](/th/reference/test)
- [นโยบายการออกรีลีส](/th/reference/RELEASING)
- [โมเดลอุปกรณ์](/th/reference/device-models)
