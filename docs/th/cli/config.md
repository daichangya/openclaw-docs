---
read_when:
    - คุณต้องการอ่านหรือแก้ไข config แบบไม่โต้ตอบ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw config` (get/set/unset/file/schema/validate)
title: Config
x-i18n:
    generated_at: "2026-04-24T09:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

ตัวช่วย Config สำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/unset/file/schema/validate
ค่าตาม path และพิมพ์ไฟล์ config ที่กำลังใช้งานอยู่ หากรันโดยไม่มี subcommand จะเป็นการ
เปิดตัวช่วยตั้งค่า (เหมือนกับ `openclaw configure`)

ตัวเลือกระดับราก:

- `--section <section>`: ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ใช้ซ้ำได้ เมื่อคุณรัน `openclaw config` โดยไม่มี subcommand

ส่วนของการตั้งค่าแบบมีคำแนะนำที่รองรับ:

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
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

- root config schema ปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือใน editor
- ข้อมูลเมตาเอกสาร `title` และ `description` ของฟิลด์ที่ Control UI ใช้
- โหนด object, wildcard (`*`) และ array-item (`[]`) แบบซ้อนกัน จะสืบทอดข้อมูลเมตา `title` / `description` เดียวกัน เมื่อมีเอกสารของฟิลด์ที่ตรงกันอยู่
- กิ่ง `anyOf` / `oneOf` / `allOf` จะสืบทอดข้อมูลเมตาเอกสารเดียวกันด้วย เมื่อมีเอกสารของฟิลด์ที่ตรงกันอยู่
- ข้อมูลเมตา schema ของ Plugin + ช่องทางแบบ live ตามความพยายามที่ดีที่สุด เมื่อสามารถโหลด runtime manifests ได้
- fallback schema ที่สะอาด แม้ config ปัจจุบันจะไม่ถูกต้อง

runtime RPC ที่เกี่ยวข้อง:

- `config.schema.lookup` จะคืนค่า normalized config path หนึ่งรายการพร้อม
  schema node แบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป),
  ข้อมูลเมตา UI hint ที่ตรงกัน และสรุปลูกโดยตรง ใช้สำหรับ
  การเจาะลึกแบบกำหนดขอบเขต path ใน Control UI หรือไคลเอนต์แบบกำหนดเอง

```bash
openclaw config schema
```

ส่งต่อไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### Paths

Paths ใช้ dot notation หรือ bracket notation:

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

ค่าจะถูก parse เป็น JSON5 เมื่อเป็นไปได้ มิฉะนั้นจะถูกมองเป็นสตริง
ใช้ `--strict-json` เพื่อบังคับให้ parse เป็น JSON5 `--json` ยังคงรองรับเป็น alias แบบเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` จะพิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

การกำหนดค่า object จะเขียนทับ path เป้าหมายเป็นค่าเริ่มต้น path ของ map/list ที่ได้รับการป้องกัน
ซึ่งมักเก็บ entries ที่ผู้ใช้เพิ่มเอง เช่น `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` และ
`auth.profiles` จะปฏิเสธการเขียนทับที่ทำให้ entries เดิมหายไป เว้นแต่
คุณจะส่ง `--replace`

ใช้ `--merge` เมื่อต้องการเพิ่ม entries เข้าไปใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ให้มา
กลายเป็นค่าทั้งหมดของเป้าหมายจริง ๆ

## โหมดของ `config set`

`openclaw config set` รองรับการกำหนดค่า 4 รูปแบบ:

1. โหมดค่า: `openclaw config set <path> <value>`
2. โหมดตัวสร้าง SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. โหมดตัวสร้าง provider (ใช้ได้เฉพาะ path `secrets.providers.<alias>`):

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

- การกำหนดค่า SecretRef จะถูกปฏิเสธบนพื้นผิวที่ runtime เปลี่ยนแปลงได้ซึ่งไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น webhook สำหรับ Discord thread-binding และ WhatsApp creds JSON) ดู [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

การ parse แบบแบตช์จะใช้ payload ของแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ
`--strict-json` / `--json` จะไม่เปลี่ยนพฤติกรรมการ parse แบบแบตช์

โหมด JSON path/value ยังคงรองรับทั้ง SecretRefs และ providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กของตัวสร้าง Provider

เป้าหมายของตัวสร้าง provider ต้องใช้ `secrets.providers.<alias>` เป็น path

แฟล็กทั่วไป:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ใช้ซ้ำได้)

File provider (`--provider-source file`):

- `--provider-path <path>` (จำเป็น)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

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

ตัวอย่าง exec provider แบบ hardened:

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

- โหมดตัวสร้าง: รันการตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ refs/providers ที่เปลี่ยนแปลง
- โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): รันการตรวจสอบ schema พร้อมการตรวจสอบความสามารถในการ resolve ของ SecretRef
- การตรวจสอบนโยบายจะรันด้วยสำหรับพื้นผิวเป้าหมาย SecretRef ที่ไม่รองรับซึ่งรู้จักอยู่
- การตรวจสอบนโยบายจะประเมิน config เต็มหลังการเปลี่ยนแปลง ดังนั้นการเขียน object ระดับ parent (เช่นตั้งค่า `hooks` เป็น object) จะไม่สามารถหลบเลี่ยงการตรวจสอบพื้นผิวที่ไม่รองรับได้
- โดยค่าเริ่มต้น การตรวจสอบ SecretRef แบบ exec จะถูกข้ามระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
- ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกเปิดการตรวจสอบ SecretRef แบบ exec (อาจมีการรันคำสั่งของ provider)
- `--allow-exec` ใช้ได้เฉพาะ dry-run เท่านั้น และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

`--dry-run --json` จะพิมพ์รายงานที่เครื่องอ่านได้:

- `ok`: dry-run ผ่านหรือไม่
- `operations`: จำนวนการกำหนดค่าที่ประเมิน
- `checks`: มีการรันการตรวจสอบ schema/resolvability หรือไม่
- `checks.resolvabilityComplete`: การตรวจสอบ resolvability รันจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อข้าม exec refs)
- `refsChecked`: จำนวน refs ที่ถูก resolve จริงระหว่าง dry-run
- `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้ง `--allow-exec`
- `errors`: ความล้มเหลวของ schema/resolvability แบบมีโครงสร้างเมื่อ `ok=false`

### รูปแบบผลลัพธ์ JSON

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
      ref?: string, // มีอยู่สำหรับข้อผิดพลาดด้าน resolvability
    },
  ],
}
```

ตัวอย่างเมื่อสำเร็จ:

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

ตัวอย่างเมื่อไม่สำเร็จ:

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

- `config schema validation failed`: รูปร่าง config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง; แก้ไข path/value หรือรูปร่าง object ของ provider/ref
- `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลรับรองนั้นกลับไปเป็นอินพุต plaintext/string และเก็บ SecretRefs ไว้เฉพาะบนพื้นผิวที่รองรับเท่านั้น
- `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ในขณะนี้ไม่สามารถ resolve ได้ (ตัวแปร env หายไป, ตัวชี้ไฟล์ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs; รันอีกครั้งพร้อม `--allow-exec` หากคุณต้องการตรวจสอบ resolvability ของ exec
- สำหรับโหมดแบตช์ ให้แก้ไข entries ที่ล้มเหลวแล้วรัน `--dry-run` ใหม่ก่อนเขียนจริง

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่น ๆ ที่ OpenClaw เป็นเจ้าของ จะตรวจสอบ config เต็ม
หลังการเปลี่ยนแปลงก่อน commit ลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema
หรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล config ที่ใช้งานอยู่จะไม่ถูกแตะต้อง
และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ เป็น `openclaw.json.rejected.*`
path ของ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` แบบ symlink
ไม่รองรับสำหรับการเขียน; ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรง
ไปยังไฟล์จริงแทน

ควรใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็กน้อย:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้ไขรูปร่าง config ทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

การเขียนแก้ไขผ่าน editor โดยตรงยังคงทำได้ แต่ Gateway ที่กำลังทำงานจะถือว่า
การแก้ไขเหล่านั้นไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขโดยตรงที่ไม่ถูกต้องสามารถกู้คืนจาก
ข้อมูลสำรอง last-known-good ระหว่างการเริ่มต้นระบบหรือ hot reload ได้ ดู
[การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)

## คำสั่งย่อย

- `config file`: พิมพ์ path ของไฟล์ config ที่ใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือจากตำแหน่งเริ่มต้น) path นี้ควรชี้ไปยังไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ต gateway หลังจากแก้ไข

## ตรวจสอบความถูกต้อง

ตรวจสอบ config ปัจจุบันกับ schema ที่กำลังใช้งานอยู่โดยไม่ต้องเริ่มต้น
gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้
เอเจนต์ที่ฝังอยู่เปรียบเทียบ config ที่ใช้งานอยู่กับเอกสาร ขณะที่คุณตรวจสอบ
การเปลี่ยนแปลงแต่ละรายการจากเทอร์มินัลเดียวกัน:

หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ
`openclaw doctor --fix` `openclaw chat` ไม่ได้ข้ามตัวป้องกัน
config ที่ไม่ถูกต้อง

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

ลูปการซ่อมแซมโดยทั่วไป:

- ขอให้เอเจนต์เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำวิธีแก้ที่เล็กที่สุด
- ใช้ `openclaw config set` หรือ `openclaw configure` เพื่อแก้ไขแบบเจาะจง
- รัน `openclaw config validate` ใหม่หลังการเปลี่ยนแปลงแต่ละครั้ง
- หากการตรวจสอบผ่านแล้วแต่รันไทม์ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือด้าน migration และการซ่อมแซม

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Configuration](/th/gateway/configuration)
