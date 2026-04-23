---
read_when:
    - คุณต้องการอ่านหรือแก้ไข config แบบไม่โต้ตอบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T06:17:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

ตัวช่วยสำหรับ config เพื่อแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/unset/file/schema/validate
ค่าตามพาธ และพิมพ์ไฟล์ config ที่กำลังใช้งานอยู่ เรียกใช้โดยไม่ระบุคำสั่งย่อยเพื่อ
เปิดวิซาร์ดการตั้งค่า (เช่นเดียวกับ `openclaw configure`)

ตัวเลือกระดับราก:

- `--section <section>`: ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ใช้ซ้ำได้ เมื่อคุณเรียก `openclaw config` โดยไม่ระบุคำสั่งย่อย

ส่วนที่รองรับในการตั้งค่าแบบมีคำแนะนำ:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## ตัวอย่าง

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout ในรูปแบบ JSON

สิ่งที่รวมอยู่:

- root config schema ปัจจุบัน พร้อมฟิลด์สตริง root `$schema` สำหรับเครื่องมือของตัวแก้ไข
- เมทาดาต้าเอกสารของฟิลด์ `title` และ `description` ที่ใช้โดย Control UI
- โหนดอ็อบเจ็กต์ที่ซ้อนกัน, wildcard (`*`) และรายการอาร์เรย์ (`[]`) จะสืบทอดเมทาดาต้า `title` / `description` เดียวกันเมื่อมีเอกสารของฟิลด์ที่ตรงกันอยู่
- กิ่ง `anyOf` / `oneOf` / `allOf` ก็จะสืบทอดเมทาดาต้าเอกสารเดียวกันเช่นกันเมื่อมีเอกสารของฟิลด์ที่ตรงกันอยู่
- เมทาดาต้า schema ของ Plugin + channel แบบสดตามความสามารถ เมื่อสามารถโหลด runtime manifest ได้
- schema สำรองที่สะอาด แม้ว่า config ปัจจุบันจะไม่ถูกต้อง

runtime RPC ที่เกี่ยวข้อง:

- `config.schema.lookup` ส่งคืนหนึ่งพาธ config ที่ทำให้เป็นมาตรฐานแล้ว พร้อม
  โหนด schema แบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป),
  เมทาดาต้า UI hint ที่จับคู่แล้ว และสรุปลูกโดยตรง ใช้สิ่งนี้สำหรับ
  การเจาะลึกแบบจำกัดตามพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง

```bash
openclaw config schema
```

ส่งต่อไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้รูปแบบ dot หรือ bracket:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีของรายการ agent เพื่อกำหนดเป้าหมาย agent ที่ต้องการ:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถือว่าเป็นสตริง
ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์เป็น JSON5 `--json` ยังคงรองรับเป็นนามแฝงแบบเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` จะพิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

การกำหนดค่าให้กับอ็อบเจ็กต์จะเขียนทับพาธเป้าหมายโดยค่าเริ่มต้น พาธ map/list ที่ได้รับการปกป้อง
ซึ่งมักเก็บรายการที่ผู้ใช้เพิ่มเข้าไป เช่น `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` และ
`auth.profiles` จะปฏิเสธการแทนที่ที่อาจลบรายการเดิม เว้นแต่
คุณจะส่ง `--replace`

ใช้ `--merge` เมื่อเพิ่มรายการลงใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุมากลายเป็น
ค่าเป้าหมายทั้งหมดเท่านั้น

## โหมดของ `config set`

`openclaw config set` รองรับรูปแบบการกำหนดค่า 4 แบบ:

1. โหมดค่า: `openclaw config set <path> <value>`
2. โหมดตัวสร้าง SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. โหมดตัวสร้าง provider (เฉพาะพาธ `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. โหมดแบตช์ (`--batch-json` หรือ `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

หมายเหตุนโยบาย:

- การกำหนดค่า SecretRef จะถูกปฏิเสธบนพื้นผิวที่ runtime เปลี่ยนค่าได้ซึ่งไม่รองรับ (ตัวอย่างเช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook สำหรับการ bind thread ของ Discord และ WhatsApp creds JSON) ดู [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

การแยกวิเคราะห์แบบแบตช์จะใช้เพย์โหลดแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ
`--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

โหมดพาธ/ค่าแบบ JSON ยังคงรองรับทั้งสำหรับ SecretRef และ provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กตัวสร้าง Provider

เป้าหมายของตัวสร้าง provider ต้องใช้ `secrets.providers.<alias>` เป็นพาธ

แฟล็กทั่วไป:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ใช้ซ้ำได้)

File provider (`--provider-source file`):

- `--provider-path <path>` (จำเป็น)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec provider (`--provider-source exec`):

- `--provider-command <path>` (จำเป็น)
- `--provider-arg <arg>` (ใช้ซ้ำได้)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (ใช้ซ้ำได้)
- `--provider-pass-env <ENV_VAR>` (ใช้ซ้ำได้)
- `--provider-trusted-dir <path>` (ใช้ซ้ำได้)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

ตัวอย่าง exec provider แบบเสริมความปลอดภัย:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

ใช้ `--dry-run` เพื่อตรวจสอบความถูกต้องของการเปลี่ยนแปลงโดยไม่เขียน `openclaw.json`

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

พฤติกรรมของ dry-run:

- โหมดตัวสร้าง: รันการตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ ref/provider ที่เปลี่ยนแปลง
- โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): รันการตรวจสอบ schema พร้อมการตรวจสอบความสามารถในการ resolve ของ SecretRef
- การตรวจสอบนโยบายจะทำงานด้วยสำหรับพื้นผิวเป้าหมาย SecretRef ที่ไม่รองรับซึ่งรู้จักอยู่แล้ว
- การตรวจสอบนโยบายจะประเมิน config ทั้งหมดหลังการเปลี่ยนแปลง ดังนั้นการเขียน parent-object (เช่น การตั้งค่า `hooks` เป็นอ็อบเจ็กต์) จึงไม่สามารถข้ามการตรวจสอบพื้นผิวที่ไม่รองรับได้
- การตรวจสอบ SecretRef แบบ exec จะถูกข้ามโดยค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
- ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกเปิดใช้การตรวจสอบ SecretRef แบบ exec (การทำเช่นนี้อาจรันคำสั่งของ provider)
- `--allow-exec` ใช้ได้เฉพาะกับ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

`--dry-run --json` จะพิมพ์รายงานที่เครื่องอ่านได้:

- `ok`: dry-run ผ่านหรือไม่
- `operations`: จำนวนการกำหนดค่าที่ถูกประเมิน
- `checks`: การตรวจสอบ schema/ความสามารถในการ resolve ได้รันหรือไม่
- `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการ resolve รันจนเสร็จสมบูรณ์หรือไม่ (`false` เมื่อมีการข้าม exec refs)
- `refsChecked`: จำนวน ref ที่ถูก resolve จริงระหว่าง dry-run
- `skippedExecRefs`: จำนวน exec ref ที่ถูกข้ามเพราะไม่ได้ตั้ง `--allow-exec`
- `errors`: ความล้มเหลวของ schema/ความสามารถในการ resolve แบบมีโครงสร้างเมื่อ `ok=false`

### รูปร่างเอาต์พุต JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // มีอยู่สำหรับข้อผิดพลาดด้านความสามารถในการ resolve
    },
  ],
}
```

ตัวอย่างความสำเร็จ:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

ตัวอย่างความล้มเหลว:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

หาก dry-run ล้มเหลว:

- `config schema validation failed`: รูปร่าง config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง; แก้ไขพาธ/ค่าหรือรูปร่างของอ็อบเจ็กต์ provider/ref
- `Config policy validation failed: unsupported SecretRef usage`: ย้าย credential นั้นกลับไปใช้ข้อมูลนำเข้าแบบ plaintext/string และเก็บ SecretRef ไว้เฉพาะบนพื้นผิวที่รองรับเท่านั้น
- `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ไม่สามารถ resolve ได้ในขณะนี้ (ไม่มีตัวแปร env, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec ref; เรียกใหม่ด้วย `--allow-exec` หากคุณต้องการตรวจสอบความสามารถในการ resolve ของ exec
- สำหรับโหมดแบตช์ ให้แก้ไขรายการที่ล้มเหลวแล้วรัน `--dry-run` ใหม่ก่อนเขียน

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่นที่ OpenClaw เป็นเจ้าของ จะตรวจสอบ config ทั้งหมด
หลังการเปลี่ยนแปลงก่อนยืนยันเขียนลงดิสก์ หากเพย์โหลดใหม่ไม่ผ่านการตรวจสอบ schema
หรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล config ที่ใช้งานอยู่จะคงเดิม
และเพย์โหลดที่ถูกปฏิเสธจะถูกบันทึกไว้ข้างกันเป็น `openclaw.json.rejected.*`
พาธ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
แบบ symlink ไม่รองรับสำหรับการเขียน; ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรง
ไปยังไฟล์จริงแทน

ควรใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็กน้อย:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบเพย์โหลดที่บันทึกไว้และแก้ไขรูปร่าง config ทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

การเขียนโดยตรงผ่านตัวแก้ไขยังคงทำได้ แต่ Gateway ที่กำลังรันอยู่จะถือว่า
การเปลี่ยนแปลงเหล่านั้นไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขโดยตรงที่ไม่ถูกต้องสามารถกู้คืนได้จาก
ข้อมูลสำรองสถานะล่าสุดที่ถูกต้องระหว่างการเริ่มต้นหรือ hot reload ดู
[การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)

## คำสั่งย่อย

- `config file`: พิมพ์พาธไฟล์ config ที่กำลังใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งค่าเริ่มต้น) พาธควรระบุเป็นไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ต gateway หลังจากแก้ไข

## ตรวจสอบความถูกต้อง

ตรวจสอบ config ปัจจุบันกับ schema ที่กำลังใช้งานอยู่โดยไม่ต้องเริ่ม
gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ในเครื่องเพื่อให้
agent แบบฝังตัวเปรียบเทียบ config ที่กำลังใช้งานอยู่กับเอกสาร ขณะที่คุณตรวจสอบ
แต่ละการเปลี่ยนแปลงจากเทอร์มินัลเดียวกันได้:

หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ
`openclaw doctor --fix` `openclaw chat` ไม่ได้ข้าม
ตัวป้องกัน config ที่ไม่ถูกต้อง

```bash
openclaw chat
```

จากนั้นภายใน TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

ลูปการซ่อมแซมทั่วไป:

- ขอให้ agent เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำวิธีแก้ไขที่เล็กที่สุด
- ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
- เรียก `openclaw config validate` ใหม่หลังการเปลี่ยนแปลงแต่ละครั้ง
- หากการตรวจสอบผ่านแล้วแต่ runtime ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือด้านการย้ายและการซ่อมแซม
