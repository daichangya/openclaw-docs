---
read_when:
    - การดีบักการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บ credentials
summary: 'การยืนยันตัวตนของโมเดล: OAuth, API key, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-04-23T05:32:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db0ad9eccd7e3e3ca328adaad260bc4288a8ccdbe2dc0c24d9fd049b7ab9231
    source_path: gateway/authentication.md
    workflow: 15
---

# การยืนยันตัวตน (ผู้ให้บริการโมเดล)

<Note>
หน้านี้ครอบคลุมการยืนยันตัวตนของ**ผู้ให้บริการโมเดล** (API key, OAuth, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic) สำหรับการยืนยันตัวตนของ**การเชื่อมต่อ Gateway** (token, password, trusted-proxy) ให้ดู [Configuration](/th/gateway/configuration) และ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับทั้ง OAuth และ API key สำหรับผู้ให้บริการโมเดล สำหรับ Gateway
host ที่ทำงานตลอดเวลา API key มักเป็นตัวเลือกที่คาดเดาได้มากที่สุด นอกจากนี้
ก็รองรับโฟลว์แบบ subscription/OAuth ด้วยเมื่อสอดคล้องกับรูปแบบบัญชีของผู้ให้บริการของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth แบบเต็มและ
โครงสร้างการจัดเก็บ
สำหรับการยืนยันตัวตนแบบ SecretRef (`env`/`file`/`exec` providers) ดู [Secrets Management](/th/gateway/secrets)
สำหรับกฎด้านสิทธิ์ของ credentials/รหัสเหตุผลที่ใช้โดย `models status --probe` ดู
[Auth Credential Semantics](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (API key, ทุกผู้ให้บริการ)

หากคุณกำลังรัน Gateway ที่มีอายุยาวนาน ให้เริ่มด้วย API key สำหรับ
ผู้ให้บริการที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วย API key ยังคงเป็นการตั้งค่าเซิร์ฟเวอร์
ที่คาดเดาได้มากที่สุด แต่ OpenClaw ก็รองรับการใช้การล็อกอิน Claude CLI ในเครื่องซ้ำด้วย

1. สร้าง API key ในคอนโซลของผู้ให้บริการ
2. ใส่มันไว้บน **Gateway host** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway รันภายใต้ systemd/launchd แนะนำให้ใส่ key ไว้ใน
   `~/.openclaw/.env` เพื่อให้ daemon อ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ต daemon (หรือรีสตาร์ตโปรเซส Gateway ของคุณ) แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการ env var ด้วยตนเอง onboarding สามารถจัดเก็บ
API key สำหรับการใช้งานของ daemon ได้: `openclaw onboard`

ดู [Help](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: Claude CLI และความเข้ากันได้ของ token

การยืนยันตัวตนด้วย setup-token ของ Anthropic ยังคงมีอยู่ใน OpenClaw ในฐานะ
เส้นทาง token ที่รองรับ ภายหลังเจ้าหน้าที่ของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบสไตล์ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน
`claude -p` เป็นแนวทางที่ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อมีการใช้ Claude CLI ซ้ำได้บนโฮสต์ เส้นทางนี้จะเป็นตัวเลือกที่แนะนำมากกว่าในตอนนี้

สำหรับ Gateway host ที่ทำงานยาวนาน Anthropic API key ยังคงเป็นการตั้งค่า
ที่คาดเดาได้มากที่สุด หากคุณต้องการใช้การล็อกอิน Claude ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ ให้ใช้เส้นทาง Anthropic Claude CLI ใน onboarding/configure

การป้อน token ด้วยตนเอง (ทุกผู้ให้บริการ; เขียนลง `auth-profiles.json` + อัปเดตคอนฟิก):

```bash
openclaw models auth paste-token --provider openrouter
```

รองรับการอ้างอิง auth profile สำหรับ credentials แบบคงที่ด้วย:

- credentials แบบ `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- credentials แบบ `token` สามารถใช้ `tokenRef: { source, provider, id }`
- profile ที่อยู่ในโหมด OAuth ไม่รองรับ credentials แบบ SecretRef; หากตั้ง `auth.profiles.<id>.mode` เป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่มี SecretRef รองรับสำหรับ profile นั้นจะถูกปฏิเสธ

การตรวจสอบที่เหมาะกับระบบอัตโนมัติ (คืนค่าออก `1` เมื่อหมดอายุ/ไม่มี, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบสด:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถวของ probe อาจมาจาก auth profile, credentials ใน env หรือ `models.json`
- หาก `auth.order.<provider>` แบบ explicit ไม่รวม profile ที่เก็บไว้ โปรบจะรายงาน
  `excluded_by_auth_order` สำหรับ profile นั้นแทนการลองใช้งาน
- หากมีการยืนยันตัวตนอยู่ แต่ OpenClaw ไม่สามารถ resolve model candidate ที่ probe ได้
  สำหรับผู้ให้บริการนั้น โปรบจะรายงาน `status: no_model`
- ช่วง cooldown ของ rate limit อาจผูกกับโมเดลได้ profile ที่อยู่ในช่วง cooldown สำหรับ
  โมเดลหนึ่งอาจยังใช้ได้กับโมเดลข้างเคียงบนผู้ให้บริการเดียวกัน

สคริปต์ ops เพิ่มเติม (systemd/Termux) มีเอกสารไว้ที่:
[สคริปต์ตรวจสอบการยืนยันตัวตน](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุเกี่ยวกับ Anthropic

แบ็กเอนด์ `claude-cli` ของ Anthropic กลับมารองรับอีกครั้งแล้ว

- เจ้าหน้าที่ของ Anthropic แจ้งเราว่าเส้นทาง integration ของ OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
  เป็นแนวทางที่ได้รับอนุญาตสำหรับการรันที่ใช้ Anthropic เว้นแต่ Anthropic จะประกาศนโยบายใหม่
- Anthropic API key ยังคงเป็นตัวเลือกที่คาดเดาได้มากที่สุดสำหรับ Gateway
  host ที่ทำงานยาวนาน และสำหรับการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์แบบ explicit

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุน API key (Gateway)

ผู้ให้บริการบางรายรองรับการลองคำขออีกครั้งด้วย key สำรอง เมื่อการเรียก API
ชนกับ rate limit ของผู้ให้บริการ

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ผู้ให้บริการของ Google จะรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการ key เดียวกันจะถูกลบค่าซ้ำก่อนใช้งาน
- OpenClaw จะลอง key ถัดไปอีกครั้งเฉพาะเมื่อเป็นข้อผิดพลาดจาก rate limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่ rate limit จะไม่ถูกลองใหม่ด้วย key อื่น
- หากทุก key ล้มเหลว ระบบจะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## การควบคุมว่าจะใช้ credential ใด

### แยกตามเซสชัน (คำสั่งแชต)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อปัก credential ของผู้ให้บริการที่เฉพาะเจาะจงสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile id: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบย่อ; ใช้ `/model status` สำหรับมุมมองแบบเต็ม (candidate + auth profile ถัดไป รวมถึงรายละเอียด endpoint ของผู้ให้บริการเมื่อมีการตั้งค่า)

### แยกตามเอเจนต์ (CLI override)

ตั้งค่า override ลำดับ auth profile แบบ explicit สำหรับเอเจนต์หนึ่งตัว (จะเก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายเป็นเอเจนต์เฉพาะ; หากไม่ใส่ จะใช้เอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้
เมื่อดีบักปัญหาเรื่องลำดับ `openclaw models status --probe` จะแสดง profile ที่เก็บไว้แต่ถูกละไว้
เป็น `excluded_by_auth_order` แทนที่จะข้ามไปเงียบ ๆ
เมื่อดีบักปัญหาเรื่อง cooldown ให้จำไว้ว่าช่วง cooldown ของ rate limit อาจผูกกับ
model id เดียว ไม่ใช่ทั้ง provider profile

## การแก้ไขปัญหา

### "No credentials found"

หากไม่มี profile ของ Anthropic ให้ตั้งค่า Anthropic API key บน
**Gateway host** หรือกำหนดเส้นทาง setup-token ของ Anthropic แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### Token ใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่า profile ใดกำลังใกล้หมดอายุ หาก
profile token ของ Anthropic ไม่มีหรือหมดอายุ ให้รีเฟรชการตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้ Anthropic API key
