---
read_when:
    - การแก้ปัญหาการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, API key, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-04-24T09:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# การยืนยันตัวตน (Model Providers)

<Note>
หน้านี้ครอบคลุมการยืนยันตัวตนของ **model provider** (API key, OAuth, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ gateway** (token, password, trusted-proxy) โปรดดู [Configuration](/th/gateway/configuration) และ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับ OAuth และ API key สำหรับ model provider สำหรับโฮสต์ gateway
ที่เปิดทำงานตลอดเวลา API key มักเป็นตัวเลือกที่คาดการณ์ได้มากที่สุด โดยรองรับ
subscription/OAuth flow เช่นกันเมื่อสอดคล้องกับรูปแบบบัญชีของ provider ของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับ flow ของ OAuth แบบเต็มและเลย์เอาต์
การจัดเก็บ
สำหรับ auth แบบ SecretRef (`env`/`file`/`exec` providers) โปรดดู [Secrets Management](/th/gateway/secrets)
สำหรับกฎ credential eligibility/reason-code ที่ `models status --probe` ใช้ โปรดดู
[Auth Credential Semantics](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (API key, ใช้ได้กับทุก provider)

หากคุณกำลังรัน gateway ที่มีอายุยาวนาน ให้เริ่มด้วย API key สำหรับ
provider ที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วย API key ยังคงเป็นการตั้งค่าฝั่งเซิร์ฟเวอร์
ที่คาดการณ์ได้มากที่สุด แต่ OpenClaw ก็รองรับการใช้การล็อกอิน Claude CLI ในเครื่องซ้ำด้วย

1. สร้าง API key ในคอนโซลของ provider ของคุณ
2. ใส่คีย์นั้นไว้บน **โฮสต์ gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway รันภายใต้ systemd/launchd ให้ใส่คีย์ไว้ใน
   `~/.openclaw/.env` เพื่อให้ daemon อ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ต daemon (หรือรีสตาร์ตโพรเซส Gateway ของคุณ) แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการ env var ด้วยตัวเอง onboarding สามารถจัดเก็บ
API key เพื่อให้ daemon ใช้งานได้: `openclaw onboard`

ดู [Help](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: ความเข้ากันได้ของ Claude CLI และโทเค็น

auth แบบ setup-token ของ Anthropic ยังคงมีอยู่ใน OpenClaw ในฐานะเส้นทางโทเค็นที่รองรับ
ต่อมาเจ้าหน้าที่ของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง
ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็น
เส้นทางที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
เมื่อสามารถใช้ Claude CLI ซ้ำได้บนโฮสต์ นี่คือเส้นทางที่แนะนำในปัจจุบัน

สำหรับโฮสต์ gateway ที่มีอายุยาวนาน Anthropic API key ยังคงเป็นการตั้งค่าที่คาดการณ์ได้
มากที่สุด หากคุณต้องการใช้การล็อกอิน Claude ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ใน onboarding/configure

การตั้งค่าโฮสต์ที่แนะนำสำหรับการใช้ Claude CLI ซ้ำ:

```bash
# รันบนโฮสต์ gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่คือการตั้งค่าแบบสองขั้นตอน:

1. ล็อกอิน Claude Code เข้ากับ Anthropic บนโฮสต์ gateway ก่อน
2. บอก OpenClaw ให้สลับการเลือกโมเดลของ Anthropic ไปใช้แบ็กเอนด์ `claude-cli`
   ในเครื่อง และจัดเก็บ OpenClaw auth profile ที่ตรงกัน

หาก `claude` ไม่อยู่ใน `PATH` ให้ติดตั้ง Claude Code ก่อนหรือกำหนด
`agents.defaults.cliBackends.claude-cli.command` เป็นพาธจริงของไบนารี

การป้อนโทเค็นด้วยตนเอง (ใช้ได้กับทุก provider; เขียน `auth-profiles.json` + อัปเดต config):

```bash
openclaw models auth paste-token --provider openrouter
```

รองรับ auth profile ref สำหรับข้อมูลรับรองแบบคงที่ด้วย:

- ข้อมูลรับรอง `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลรับรอง `token` สามารถใช้ `tokenRef: { source, provider, id }`
- profile แบบ OAuth ไม่รองรับข้อมูลรับรองแบบ SecretRef; หากตั้ง `auth.profiles.<id>.mode` เป็น `"oauth"` ระบบจะปฏิเสธอินพุต `keyRef`/`tokenRef` ที่รองรับด้วย SecretRef สำหรับ profile นั้น

การตรวจสอบที่เหมาะกับระบบอัตโนมัติ (exit `1` เมื่อหมดอายุ/ไม่มี, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

auth probe แบบ live:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถวของ probe อาจมาจาก auth profile, ข้อมูลรับรองใน env หรือ `models.json`
- หาก `auth.order.<provider>` แบบ explicit ไม่ได้รวม stored profile ไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับ profile นั้นแทนการลองใช้
- หากมี auth อยู่แต่ OpenClaw ไม่สามารถ resolve candidate โมเดลที่ probe ได้สำหรับ
  provider นั้น probe จะรายงาน `status: no_model`
- cooldown จาก rate limit อาจผูกกับระดับโมเดลได้ profile ที่กำลัง cooldown สำหรับ
  โมเดลหนึ่งอาจยังใช้งานได้สำหรับโมเดลพี่น้องบน provider เดียวกัน

สคริปต์ ops แบบไม่บังคับ (systemd/Termux) มีเอกสารอยู่ที่:
[สคริปต์ตรวจสอบ auth](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุเกี่ยวกับ Anthropic

ตอนนี้รองรับแบ็กเอนด์ `claude-cli` ของ Anthropic อีกครั้งแล้ว

- เจ้าหน้าที่ของ Anthropic แจ้งเราว่าเส้นทางการเชื่อมต่อแบบ OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นเส้นทางที่ได้รับอนุญาต
  สำหรับการรันที่รองรับด้วย Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic API key ยังคงเป็นตัวเลือกที่คาดการณ์ได้มากที่สุดสำหรับโฮสต์ gateway
  ที่มีอายุยาวนานและต้องการควบคุมการคิดค่าบริการฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุน API key (gateway)

บาง provider รองรับการลองคำขอใหม่ด้วยคีย์ทางเลือกเมื่อ API call
เจอ rate limit ของ provider

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- provider ของ Google จะรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการคีย์ชุดเดียวกันจะถูกลบค่าซ้ำก่อนใช้งาน
- OpenClaw จะลองใหม่ด้วยคีย์ถัดไปเฉพาะสำหรับข้อผิดพลาดแบบ rate limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่ rate limit จะไม่ถูกลองใหม่ด้วยคีย์สำรอง
- หากทุกคีย์ล้มเหลว ระบบจะคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## การควบคุมว่าจะใช้ข้อมูลรับรองใด

### รายเซสชัน (คำสั่งแชต)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อปักหมุดข้อมูลรับรอง provider เฉพาะสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile id: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบย่อ; ใช้ `/model status` สำหรับมุมมองเต็ม (candidate + auth profile ถัดไป พร้อมรายละเอียด endpoint ของ provider เมื่อมีการกำหนดค่า)

### รายเอเจนต์ (CLI override)

ตั้งค่า override ลำดับ auth profile แบบ explicit สำหรับเอเจนต์หนึ่งตัว (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายไปยังเอเจนต์เฉพาะ; หากไม่ระบุจะใช้เอเจนต์เริ่มต้นที่กำหนดค่าไว้
เมื่อคุณแก้ปัญหาเรื่องลำดับ `openclaw models status --probe` จะแสดง
stored profile ที่ถูกละไว้เป็น `excluded_by_auth_order` แทนการข้ามแบบเงียบ ๆ
เมื่อคุณแก้ปัญหาเรื่อง cooldown โปรดจำไว้ว่าค่า cooldown จาก rate limit อาจผูก
กับ model id เดียว ไม่ใช่ทั้ง provider profile

## การแก้ปัญหา

### "No credentials found"

หากไม่มี Anthropic profile ให้กำหนดค่า Anthropic API key บน
**โฮสต์ gateway** หรือกำหนดเส้นทาง Anthropic setup-token แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### โทเค็นใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่า profile ใดกำลังใกล้หมดอายุ หาก
ไม่มี Anthropic token profile หรือหมดอายุแล้ว ให้รีเฟรชการตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้ Anthropic API key

## ที่เกี่ยวข้อง

- [การจัดการ Secrets](/th/gateway/secrets)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [ที่เก็บ auth](/th/concepts/oauth)
