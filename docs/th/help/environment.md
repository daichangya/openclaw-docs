---
read_when:
    - คุณต้องทราบว่ามีการโหลดตัวแปรสภาพแวดล้อมใดบ้าง และโหลดตามลำดับใด
    - คุณกำลังดีบัก API keys ที่หายไปใน Gateway
    - คุณกำลังจัดทำเอกสารการยืนยันตัวตนของผู้ให้บริการหรือสภาพแวดล้อมการ deploy
summary: ตำแหน่งที่ OpenClaw โหลดตัวแปรสภาพแวดล้อมและลำดับความสำคัญ
title: ตัวแปรสภาพแวดล้อม
x-i18n:
    generated_at: "2026-04-23T05:36:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# ตัวแปรสภาพแวดล้อม

OpenClaw ดึงตัวแปรสภาพแวดล้อมจากหลายแหล่ง กฎคือ **ห้ามเขียนทับค่าที่มีอยู่แล้ว**

## ลำดับความสำคัญ (สูงสุด → ต่ำสุด)

1. **สภาพแวดล้อมของโปรเซส** (สิ่งที่โปรเซส Gateway มีอยู่แล้วจาก parent shell/daemon)
2. **`.env` ใน current working directory** (ค่าเริ่มต้นของ dotenv; ไม่เขียนทับ)
3. **Global `.env`** ที่ `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`; ไม่เขียนทับ)
4. **บล็อก `env` ในคอนฟิก** ที่ `~/.openclaw/openclaw.json` (ใช้เฉพาะเมื่อยังไม่มีค่า)
5. **การนำเข้าจาก login-shell แบบไม่บังคับ** (`env.shellEnv.enabled` หรือ `OPENCLAW_LOAD_SHELL_ENV=1`) ใช้เฉพาะกับคีย์ที่คาดหวังซึ่งยังไม่มีค่า

บน Ubuntu ที่เพิ่งติดตั้งใหม่และใช้ state dir เริ่มต้น OpenClaw จะถือว่า `~/.config/openclaw/gateway.env` เป็น compatibility fallback หลัง global `.env` ด้วย หากทั้งสองไฟล์มีอยู่และค่าไม่ตรงกัน OpenClaw จะคงค่า `~/.openclaw/.env` และพิมพ์คำเตือน

หากไม่มีไฟล์คอนฟิกเลย ขั้นตอนที่ 4 จะถูกข้าม; การนำเข้าจาก shell จะยังรันได้หากเปิดใช้งานไว้

## บล็อก `env` ในคอนฟิก

มีสองวิธีที่เทียบเท่ากันในการตั้ง inline env vars (ทั้งคู่ไม่เขียนทับค่าเดิม):

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

## การนำเข้า env จาก Shell

`env.shellEnv` จะรัน login shell ของคุณ และนำเข้าเฉพาะคีย์ที่คาดหวังและ**ยังไม่มีค่า**:

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

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ตัวแปร env ที่ inject ตอน runtime

OpenClaw ยัง inject ตัวบ่งชี้บริบทลงใน child processes ที่ถูก spawn:

- `OPENCLAW_SHELL=exec`: ตั้งค่าสำหรับคำสั่งที่รันผ่านเครื่องมือ `exec`
- `OPENCLAW_SHELL=acp`: ตั้งค่าสำหรับการ spawn โปรเซสของ ACP runtime backend (เช่น `acpx`)
- `OPENCLAW_SHELL=acp-client`: ตั้งค่าสำหรับ `openclaw acp client` เมื่อมัน spawn โปรเซส ACP bridge
- `OPENCLAW_SHELL=tui-local`: ตั้งค่าสำหรับคำสั่ง shell `!` ของ TUI แบบ local

สิ่งเหล่านี้เป็นตัวบ่งชี้ตอน runtime (ไม่ใช่คอนฟิกที่ผู้ใช้ต้องตั้งเอง) สามารถใช้ในตรรกะของ shell/profile
เพื่อใช้กฎที่เฉพาะกับบริบทได้

## ตัวแปร env ของ UI

- `OPENCLAW_THEME=light`: บังคับใช้พาเลต TUI แบบสว่างเมื่อเทอร์มินัลของคุณมีพื้นหลังสว่าง
- `OPENCLAW_THEME=dark`: บังคับใช้พาเลต TUI แบบมืด
- `COLORFGBG`: หากเทอร์มินัลของคุณ export ค่านี้ OpenClaw จะใช้ hint สีพื้นหลังเพื่อเลือกพาเลต TUI อัตโนมัติ

## การแทนค่าด้วย env var ในคอนฟิก

คุณสามารถอ้างอิง env vars โดยตรงในค่าสตริงของคอนฟิก โดยใช้รูปแบบ `${VAR_NAME}`:

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

ดู [Configuration: Env var substitution](/th/gateway/configuration-reference#env-var-substitution) สำหรับรายละเอียดทั้งหมด

## Secret refs เทียบกับสตริง `${ENV}`

OpenClaw รองรับสองรูปแบบที่ขับเคลื่อนด้วย env:

- การแทนที่สตริง `${VAR}` ในค่าคอนฟิก
- ออบเจ็กต์ SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) สำหรับฟิลด์ที่รองรับ secrets references

ทั้งสองแบบจะ resolve จาก process env ตอน activation ดูรายละเอียด SecretRef ได้ใน [Secrets Management](/th/gateway/secrets)

## ตัวแปร env ที่เกี่ยวข้องกับพาธ

| ตัวแปร               | วัตถุประสงค์                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | แทนที่ home directory ที่ใช้สำหรับการ resolve พาธภายในทั้งหมด (`~/.openclaw/`, agent dirs, sessions, credentials) มีประโยชน์เมื่อรัน OpenClaw เป็น service user โดยเฉพาะ |
| `OPENCLAW_STATE_DIR`   | แทนที่ state directory (ค่าเริ่มต้น `~/.openclaw`)                                                                                                                            |
| `OPENCLAW_CONFIG_PATH` | แทนที่พาธไฟล์คอนฟิก (ค่าเริ่มต้น `~/.openclaw/openclaw.json`)                                                                                                             |

## Logging

| ตัวแปร             | วัตถุประสงค์                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | แทนที่ระดับ log สำหรับทั้งไฟล์และคอนโซล (เช่น `debug`, `trace`) มีความสำคัญเหนือ `logging.level` และ `logging.consoleLevel` ในคอนฟิก ค่าที่ไม่ถูกต้องจะถูกละเลยพร้อมคำเตือน |

### `OPENCLAW_HOME`

เมื่อมีการตั้งค่า `OPENCLAW_HOME` จะเข้ามาแทนที่ home directory ของระบบ (`$HOME` / `os.homedir()`) สำหรับการ resolve พาธภายในทั้งหมด สิ่งนี้ช่วยให้แยก filesystem ได้อย่างสมบูรณ์สำหรับบัญชีบริการแบบ headless

**ลำดับความสำคัญ:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**ตัวอย่าง** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` ยังสามารถตั้งเป็นพาธที่ใช้เครื่องหมาย tilde ได้ (เช่น `~/svc`) ซึ่งจะถูกขยายด้วย `$HOME` ก่อนใช้งาน

## ผู้ใช้ nvm: ปัญหา TLS ของ web_fetch

หากติดตั้ง Node.js ผ่าน **nvm** (ไม่ใช่ package manager ของระบบ) `fetch()` ที่มีมาในตัวจะใช้
CA store ที่มากับ nvm ซึ่งอาจไม่มี modern root CAs (ISRG Root X1/X2 ของ Let's Encrypt,
DigiCert Global Root G2 ฯลฯ) ส่งผลให้ `web_fetch` ล้มเหลวด้วย `"fetch failed"` กับเว็บไซต์ HTTPS ส่วนใหญ่

บน Linux OpenClaw จะตรวจจับ nvm โดยอัตโนมัติและใช้วิธีแก้ไขในสภาพแวดล้อมเริ่มต้นจริง:

- `openclaw gateway install` จะเขียน `NODE_EXTRA_CA_CERTS` ลงในสภาพแวดล้อมของบริการ systemd
- entrypoint ของ CLI `openclaw` จะ re-exec ตัวเองโดยตั้ง `NODE_EXTRA_CA_CERTS` ก่อนเริ่ม Node

**วิธีแก้แบบ manual (สำหรับรุ่นเก่าหรือการเปิดผ่าน `node ...` โดยตรง):**

export ตัวแปรนี้ก่อนเริ่ม OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

อย่าพึ่งพาการเขียนตัวแปรนี้เพียงลงใน `~/.openclaw/.env`; Node จะอ่าน
`NODE_EXTRA_CA_CERTS` ตอนเริ่มโปรเซส

## ที่เกี่ยวข้อง

- [Gateway configuration](/th/gateway/configuration)
- [FAQ: env vars and .env loading](/th/help/faq#env-vars-and-env-loading)
- [ภาพรวม Models](/th/concepts/models)
