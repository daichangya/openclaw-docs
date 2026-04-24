---
read_when:
    - คุณต้องการทราบว่ามีการโหลด env vars ใดบ้าง และโหลดตามลำดับใด
    - คุณกำลังดีบักปัญหา API keys หายไปใน Gateway
    - คุณกำลังจัดทำเอกสารเกี่ยวกับ provider auth หรือสภาพแวดล้อมการ deploy
summary: ตำแหน่งที่ OpenClaw โหลดตัวแปรสภาพแวดล้อมและลำดับความสำคัญ
title: ตัวแปรสภาพแวดล้อม
x-i18n:
    generated_at: "2026-04-24T09:13:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw ดึงตัวแปรสภาพแวดล้อมจากหลายแหล่ง กฎคือ **ห้าม override ค่าที่มีอยู่แล้ว**

## ลำดับความสำคัญ (สูงสุด → ต่ำสุด)

1. **สภาพแวดล้อมของโปรเซส** (สิ่งที่โปรเซส Gateway มีอยู่แล้วจาก parent shell/daemon)
2. **`.env` ใน current working directory** (ค่าเริ่มต้นของ dotenv; ไม่ override)
3. **Global `.env`** ที่ `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`; ไม่ override)
4. **บล็อก `env` ใน config** ที่ `~/.openclaw/openclaw.json` (ใช้เฉพาะเมื่อค่ายังไม่มี)
5. **การนำเข้าจาก login-shell แบบไม่บังคับ** (`env.shellEnv.enabled` หรือ `OPENCLAW_LOAD_SHELL_ENV=1`) ใช้เฉพาะกับคีย์ที่คาดหวังและยังขาดอยู่

สำหรับการติดตั้ง Ubuntu ใหม่ที่ใช้ state dir เริ่มต้น OpenClaw จะถือว่า `~/.config/openclaw/gateway.env` เป็น compatibility fallback หลัง global `.env` ด้วย หากทั้งสองไฟล์มีอยู่และค่าขัดแย้งกัน OpenClaw จะคง `~/.openclaw/.env` ไว้และพิมพ์คำเตือน

หากไม่มีไฟล์ config เลย ขั้นตอนที่ 4 จะถูกข้าม; การนำเข้าจาก shell จะยังคงทำงานหากเปิดใช้งานไว้

## บล็อก `env` ใน config

มีสองวิธีที่เทียบเท่ากันในการตั้งค่า inline env vars (ทั้งคู่ไม่ override):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## การนำเข้าจาก Shell env

`env.shellEnv` จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดหวังและ **ยังขาดอยู่** เท่านั้น:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

ค่า env var ที่เทียบเท่า:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## env vars ที่ถูกฉีดขณะรันไทม์

OpenClaw ยังฉีด context markers เข้าไปใน child processes ที่ถูกสร้างขึ้นด้วย:

- `OPENCLAW_SHELL=exec`: ตั้งค่าสำหรับคำสั่งที่รันผ่านเครื่องมือ `exec`
- `OPENCLAW_SHELL=acp`: ตั้งค่าสำหรับการสร้าง process ของ ACP runtime backend (เช่น `acpx`)
- `OPENCLAW_SHELL=acp-client`: ตั้งค่าสำหรับ `openclaw acp client` เมื่อมีการสร้าง ACP bridge process
- `OPENCLAW_SHELL=tui-local`: ตั้งค่าสำหรับคำสั่ง shell `!` แบบโลคัลของ TUI

ค่านี้เป็น runtime markers (ไม่ใช่ user config ที่จำเป็น) สามารถใช้ในตรรกะของ shell/profile
เพื่อกำหนดกฎตาม context เฉพาะได้

## UI env vars

- `OPENCLAW_THEME=light`: บังคับใช้พาเลต TUI แบบสว่างเมื่อเทอร์มินัลของคุณมีพื้นหลังสว่าง
- `OPENCLAW_THEME=dark`: บังคับใช้พาเลต TUI แบบมืด
- `COLORFGBG`: หากเทอร์มินัลของคุณส่งค่านี้ออกมา OpenClaw จะใช้คำใบ้สีพื้นหลังเพื่อเลือกพาเลต TUI อัตโนมัติ

## การแทนที่ env var ใน config

คุณสามารถอ้างอิง env vars ได้โดยตรงในค่าชนิดสตริงของ config โดยใช้ไวยากรณ์ `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

ดู [การกำหนดค่า: การแทนที่ env var](/th/gateway/configuration-reference#env-var-substitution) สำหรับรายละเอียดทั้งหมด

## Secret refs เทียบกับสตริง `${ENV}`

OpenClaw รองรับรูปแบบที่ขับเคลื่อนด้วย env อยู่ 2 แบบ:

- การแทนที่สตริง `${VAR}` ในค่า config
- ออบเจ็กต์ SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) สำหรับฟิลด์ที่รองรับการอ้างอิงความลับ

ทั้งสองแบบ resolve จาก process env ตอน activation รายละเอียดของ SecretRef มีเอกสารอยู่ใน [การจัดการ Secrets](/th/gateway/secrets)

## env vars ที่เกี่ยวข้องกับ path

| ตัวแปร | จุดประสงค์ |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME` | override โฮมไดเรกทอรีที่ใช้สำหรับการ resolve paths ภายในทั้งหมด (`~/.openclaw/`, ไดเรกทอรีของเอเจนต์, sessions, credentials) มีประโยชน์เมื่อรัน OpenClaw ในฐานะผู้ใช้บริการเฉพาะ |
| `OPENCLAW_STATE_DIR` | override state directory (ค่าเริ่มต้น `~/.openclaw`) |
| `OPENCLAW_CONFIG_PATH` | override path ของไฟล์ config (ค่าเริ่มต้น `~/.openclaw/openclaw.json`) |

## การบันทึก log

| ตัวแปร | จุดประสงค์ |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | override ระดับ log ทั้งของไฟล์และคอนโซล (เช่น `debug`, `trace`) มีลำดับความสำคัญสูงกว่า `logging.level` และ `logging.consoleLevel` ใน config ค่าที่ไม่ถูกต้องจะถูกเพิกเฉยพร้อมคำเตือน |

### `OPENCLAW_HOME`

เมื่อมีการตั้งค่า `OPENCLAW_HOME` ค่านี้จะมาแทนที่โฮมไดเรกทอรีของระบบ (`$HOME` / `os.homedir()`) สำหรับการ resolve paths ภายในทั้งหมด สิ่งนี้ทำให้สามารถแยกระบบไฟล์ได้อย่างสมบูรณ์สำหรับบัญชีบริการแบบ headless

**ลำดับความสำคัญ:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**ตัวอย่าง** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` ยังสามารถตั้งเป็น path แบบ tilde ได้ (เช่น `~/svc`) ซึ่งจะถูกขยายโดยใช้ `$HOME` ก่อนนำไปใช้

## ผู้ใช้ nvm: ปัญหา TLS ล้มเหลวใน web_fetch

หากติดตั้ง Node.js ผ่าน **nvm** (ไม่ใช่ผ่าน system package manager), `fetch()` ที่มีมาในตัวจะใช้
CA store ที่มากับ nvm ซึ่งอาจขาด modern root CAs (ISRG Root X1/X2 ของ Let's Encrypt,
DigiCert Global Root G2 เป็นต้น) ทำให้ `web_fetch` ล้มเหลวพร้อม `"fetch failed"` บนเว็บไซต์ HTTPS ส่วนใหญ่

บน Linux, OpenClaw จะตรวจพบ nvm โดยอัตโนมัติและใช้การแก้ไขนี้ในสภาพแวดล้อมเริ่มต้นจริง:

- `openclaw gateway install` จะเขียน `NODE_EXTRA_CA_CERTS` ลงใน systemd service environment
- entrypoint ของ CLI `openclaw` จะ re-exec ตัวเองพร้อมตั้ง `NODE_EXTRA_CA_CERTS` ก่อนเริ่ม Node

**วิธีแก้แบบแมนนวล (สำหรับเวอร์ชันเก่าหรือการรัน `node ...` โดยตรง):**

ส่งออกตัวแปรนี้ก่อนเริ่ม OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

อย่าพึ่งการเขียนตัวแปรนี้ลงใน `~/.openclaw/.env` เพียงอย่างเดียว; Node จะอ่าน
`NODE_EXTRA_CA_CERTS` ตอนเริ่มโปรเซส

## ที่เกี่ยวข้อง

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [FAQ: env vars และการโหลด .env](/th/help/faq#env-vars-and-env-loading)
- [ภาพรวมของโมเดล](/th/concepts/models)
