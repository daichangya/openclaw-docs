---
read_when:
    - การติดตั้งหรือกำหนดค่า acpx harness สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้สะพาน MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่า acpx harness, การตั้งค่า Plugin, สิทธิ์การเข้าถึง'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-04-24T09:34:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

สำหรับภาพรวม คู่มือการปฏิบัติงานของโอเปอเรเตอร์ และแนวคิดต่างๆ โปรดดู [ACP agents](/th/tools/acp-agents)
หน้านี้ครอบคลุมการกำหนดค่า acpx harness การตั้งค่า Plugin สำหรับสะพาน MCP และ
การกำหนดค่าสิทธิ์การเข้าถึง

## การรองรับ acpx harness (ปัจจุบัน)

alias ของ harness แบบ built-in ใน acpx ปัจจุบัน:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้ใช้ค่าเหล่านี้สำหรับ `agentId` เป็นหลัก เว้นแต่ config acpx ของคุณจะกำหนด alias เอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงแสดง ACP เป็น `agent acp` ให้ override คำสั่งเอเจนต์ `cursor` ใน config acpx ของคุณแทนการเปลี่ยนค่าเริ่มต้นแบบ built-in

การใช้งาน acpx CLI โดยตรงยังสามารถกำหนดอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางหลีกเลี่ยงแบบดิบนี้เป็นความสามารถของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

## config ที่จำเป็น

ค่าพื้นฐาน ACP หลัก:

```json5
{
  acp: {
    enabled: true,
    // เป็นทางเลือก ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุดการส่ง ACP ชั่วคราวโดยยังคงเก็บตัวควบคุม /acp ไว้
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

config การผูกกับเธรดขึ้นอยู่กับ channel-adapter แต่ละตัว ตัวอย่างสำหรับ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

หากการ spawn ACP แบบผูกกับเธรดไม่ทำงาน ให้ตรวจสอบ feature flag ของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

การผูกกับบทสนทนาปัจจุบันไม่จำเป็นต้องสร้าง child-thread โดยต้องมีบริบทการสนทนาที่ใช้งานอยู่และ channel adapter ที่รองรับ ACP conversation bindings

ดู [Configuration Reference](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งใหม่จะเปิดใช้ runtime Plugin `acpx` ที่มากับระบบโดยค่าเริ่มต้น ดังนั้น ACP
จึงมักใช้งานได้โดยไม่ต้องติดตั้ง Plugin ด้วยตนเอง

เริ่มจาก:

```text
/acp doctor
```

หากคุณปิด `acpx`, ปฏิเสธมันผ่าน `plugins.allow` / `plugins.deny`, หรือต้องการ
สลับไปใช้ checkout สำหรับการพัฒนาในเครื่อง ให้ใช้เส้นทาง Plugin แบบชัดเจน:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้งจาก workspace ในเครื่องระหว่างพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสถานะแบ็กเอนด์:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

โดยค่าเริ่มต้น Plugin `acpx` ที่มากับระบบจะใช้ไบนารีที่ปักหมุดไว้ภายใน Plugin (`node_modules/.bin/acpx` ภายในแพ็กเกจ Plugin) ระหว่างเริ่มต้น ระบบจะลงทะเบียนแบ็กเอนด์เป็น not-ready และงานเบื้องหลังจะตรวจสอบ `acpx --version`; หากไบนารีไม่มีหรือเวอร์ชันไม่ตรงกัน ระบบจะรัน `npm install --omit=dev --no-save acpx@<pinned>` แล้วตรวจสอบอีกครั้ง Gateway จะยังไม่บล็อกตลอดกระบวนการนี้

override คำสั่งหรือเวอร์ชันได้ใน config ของ Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` รับพาธแบบ absolute, พาธแบบ relative (อ้างอิงจาก workspace ของ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` จะปิดการตรวจสอบเวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดการติดตั้งอัตโนมัติภายใน Plugin

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw` dependency ของ runtime acpx
(ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติ
ผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว gateway จะยังเริ่มทำงานได้
ตามปกติ และรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### สะพาน MCP ของ plugin tools

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ไปยัง
ACP harness

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือของ OpenClaw Plugin ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิดใช้สะพานเฉพาะนี้:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- inject MCP server แบบ built-in ชื่อ `openclaw-plugin-tools` เข้าไปใน bootstrap
  ของเซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugins OpenClaw
  ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้ต้องเปิดใช้อย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความไว้วางใจ:

- การตั้งค่านี้จะขยายพื้นผิวเครื่องมือของ ACP harness
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่เปิดใช้งานอยู่แล้วใน gateway
- ให้ถือว่านี่เป็นขอบเขตความไว้วางใจเดียวกันกับการอนุญาตให้ Plugins เหล่านั้นทำงานใน
  OpenClaw เอง
- ตรวจสอบ Plugins ที่ติดตั้งไว้ก่อนเปิดใช้

`mcpServers` แบบกำหนดเองยังทำงานได้เหมือนเดิม สะพาน plugin-tools แบบ built-in เป็น
ความสะดวกเพิ่มเติมที่ต้องเลือกเปิดใช้ ไม่ได้มาแทนที่ config MCP server ทั่วไป

### สะพาน MCP ของ OpenClaw tools

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือ built-in ของ OpenClaw ผ่าน
MCP เช่นกัน เปิดใช้สะพาน core-tools แยกต่างหากเมื่อเอเจนต์ ACP ต้องการใช้
เครื่องมือ built-in บางตัว เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- inject MCP server แบบ built-in ชื่อ `openclaw-tools` เข้าไปใน bootstrap
  ของเซสชัน ACPX
- เปิดเผยเครื่องมือ built-in ที่คัดเลือกแล้วของ OpenClaw โดย server เริ่มต้นจะเปิดเผย `cron`
- ทำให้การเปิดเผย core-tool ต้องทำอย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่า timeout ของรันไทม์

Plugin `acpx` ที่มากับระบบจะกำหนด timeout ของเทิร์นรันไทม์แบบฝังไว้เป็น 120 วินาที
ค่าเริ่มต้นนี้ให้เวลาเพียงพอกับ harness ที่ช้ากว่า เช่น Gemini CLI ในการทำ ACP startup และการเริ่มต้นระบบให้เสร็จ
override ได้หากโฮสต์ของคุณต้องการขีดจำกัดรันไทม์ที่ต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่าเอเจนต์สำหรับ health probe

Plugin `acpx` ที่มากับระบบจะ probe เอเจนต์ของ harness หนึ่งตัวขณะตัดสินว่า
แบ็กเอนด์รันไทม์แบบฝังพร้อมใช้งานหรือไม่ โดยค่าเริ่มต้นคือ `codex` หาก deployment ของคุณใช้ ACP agent ค่าเริ่มต้นตัวอื่น ให้ตั้งค่า probe agent เป็น id เดียวกัน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์การเข้าถึง

เซสชัน ACP ทำงานแบบไม่โต้ตอบ — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมป์สิทธิ์ในการเขียนไฟล์และเรียกใช้ shell Plugin acpx มีคีย์ config สองตัวที่ใช้ควบคุมการจัดการสิทธิ์:

สิทธิ์ของ ACPX harness เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็ก bypass ของ vendor ในแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ค่า ACPX `approve-all` คือสวิตช์ break-glass ระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าการดำเนินการใดที่ harness agent สามารถทำได้โดยไม่ต้องมีพรอมป์

| ค่า | พฤติกรรม |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ |
| `approve-reads` | อนุมัติการอ่านโดยอัตโนมัติเท่านั้น; การเขียนและ exec ต้องมีพรอมป์ |
| `deny-all`      | ปฏิเสธพรอมป์สิทธิ์ทั้งหมด |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อมีการแสดงพรอมป์สิทธิ์ แต่ไม่มี TTY แบบโต้ตอบให้ใช้งาน (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า | พฤติกรรม |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)** |
| `deny` | ปฏิเสธสิทธิ์นั้นอย่างเงียบๆ และทำงานต่อไป (ลดระดับอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่าน config ของ Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่าเหล่านี้

> **สำคัญ:** ปัจจุบัน OpenClaw ใช้ค่าเริ่มต้น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใดๆ ที่ทำให้เกิดพรอมป์สิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`
>
> หากคุณต้องการจำกัดสิทธิ์ ให้ตั้ง `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างนุ่มนวลแทนที่จะล่ม

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents) — ภาพรวม คู่มือการปฏิบัติงานของโอเปอเรเตอร์ แนวคิด
- [Sub-agents](/th/tools/subagents)
- [Multi-agent routing](/th/concepts/multi-agent)
