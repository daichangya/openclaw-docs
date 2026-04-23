---
read_when:
    - การแก้ไขข้อบกพร่องของการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, คีย์ API, การนำ Claude CLI มาใช้ซ้ำ และโทเค็นการตั้งค่า Anthropic'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-04-23T14:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# การยืนยันตัวตน (ผู้ให้บริการโมเดล)

<Note>
หน้านี้ครอบคลุมการยืนยันตัวตนของ **ผู้ให้บริการโมเดล** (คีย์ API, OAuth, การนำ Claude CLI มาใช้ซ้ำ และโทเค็นการตั้งค่า Anthropic) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ Gateway** (โทเค็น, รหัสผ่าน, trusted-proxy) โปรดดู [Configuration](/th/gateway/configuration) และ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับ OAuth และคีย์ API สำหรับผู้ให้บริการโมเดล สำหรับโฮสต์ Gateway ที่ทำงานตลอดเวลา คีย์ API มักเป็นตัวเลือกที่คาดการณ์ได้มากที่สุด นอกจากนี้ยังรองรับโฟลว์การสมัครใช้งาน/OAuth เมื่อสอดคล้องกับรูปแบบบัญชีของผู้ให้บริการของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth ฉบับเต็มและโครงสร้างการจัดเก็บ
สำหรับการยืนยันตัวตนแบบ SecretRef (`env`/`file`/`exec` providers) โปรดดู [Secrets Management](/th/gateway/secrets)
สำหรับกฎด้านสิทธิ์ของข้อมูลรับรอง/รหัสเหตุผลที่ใช้โดย `models status --probe` โปรดดู
[Auth Credential Semantics](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (คีย์ API, ผู้ให้บริการใดก็ได้)

หากคุณกำลังใช้งาน Gateway แบบระยะยาว ให้เริ่มด้วยคีย์ API สำหรับผู้ให้บริการที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วยคีย์ API ยังคงเป็นการตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด แต่ OpenClaw ก็รองรับการนำการล็อกอิน Claude CLI ในเครื่องมาใช้ซ้ำด้วยเช่นกัน

1. สร้างคีย์ API ในคอนโซลของผู้ให้บริการ
2. ใส่คีย์นั้นไว้บน **โฮสต์ Gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway ทำงานภายใต้ systemd/launchd ให้ใส่คีย์ไว้ใน
   `~/.openclaw/.env` เพื่อให้เดมอนสามารถอ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ทเดมอน (หรือรีสตาร์ทโปรเซส Gateway ของคุณ) แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการตัวแปร env ด้วยตัวเอง การเริ่มต้นใช้งานสามารถจัดเก็บ
คีย์ API สำหรับการใช้งานของเดมอนได้: `openclaw onboard`

ดู [Help](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: ความเข้ากันได้ของ Claude CLI และโทเค็น

การยืนยันตัวตนด้วยโทเค็นการตั้งค่า Anthropic ยังคงมีอยู่ใน OpenClaw ในฐานะ
เส้นทางโทเค็นที่รองรับ ต่อมาเจ้าหน้าที่ของ Anthropic ได้แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI มาใช้ซ้ำและการใช้งาน `claude -p`
เป็นแนวทางที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อ
การนำ Claude CLI มาใช้ซ้ำพร้อมใช้งานบนโฮสต์ เส้นทางนี้จึงเป็นตัวเลือกที่แนะนำในตอนนี้

สำหรับโฮสต์ Gateway แบบระยะยาว คีย์ API ของ Anthropic ยังคงเป็นการตั้งค่าที่คาดการณ์ได้มากที่สุด
หากคุณต้องการนำการล็อกอิน Claude ที่มีอยู่แล้วบนโฮสต์เดียวกันมาใช้ซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ใน onboarding/configure

การตั้งค่าโฮสต์ที่แนะนำสำหรับการนำ Claude CLI มาใช้ซ้ำ:

```bash
# รันบนโฮสต์ Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่เป็นการตั้งค่าแบบสองขั้นตอน:

1. ล็อกอิน Claude Code เข้ากับ Anthropic บนโฮสต์ Gateway
2. บอกให้ OpenClaw สลับการเลือกโมเดล Anthropic ไปใช้แบ็กเอนด์ `claude-cli`
   ภายในเครื่อง และจัดเก็บโปรไฟล์การยืนยันตัวตน OpenClaw ที่ตรงกัน

หาก `claude` ไม่อยู่ใน `PATH` ให้ติดตั้ง Claude Code ก่อน หรือกำหนด
`agents.defaults.cliBackends.claude-cli.command` ไปยังพาธจริงของไบนารี

การป้อนโทเค็นด้วยตนเอง (ผู้ให้บริการใดก็ได้; เขียน `auth-profiles.json` + อัปเดต config):

```bash
openclaw models auth paste-token --provider openrouter
```

นอกจากนี้ยังรองรับการอ้างอิงโปรไฟล์การยืนยันตัวตนสำหรับข้อมูลรับรองแบบคงที่ด้วย:

- ข้อมูลรับรอง `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลรับรอง `token` สามารถใช้ `tokenRef: { source, provider, id }`
- โปรไฟล์โหมด OAuth ไม่รองรับข้อมูลรับรองแบบ SecretRef; หากตั้งค่า `auth.profiles.<id>.mode` เป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่ใช้ SecretRef สำหรับโปรไฟล์นั้นจะถูกปฏิเสธ

การตรวจสอบที่เหมาะกับงานอัตโนมัติ (exit `1` เมื่อหมดอายุ/ไม่มี, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบสด:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถว probe สามารถมาจากโปรไฟล์การยืนยันตัวตน ข้อมูลรับรอง env หรือ `models.json`
- หาก `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้งาน
- หากมีการยืนยันตัวตนอยู่ แต่ OpenClaw ไม่สามารถ resolve ผู้สมัครโมเดลที่ probe ได้สำหรับ
  ผู้ให้บริการนั้น probe จะรายงาน `status: no_model`
- ระยะคูลดาวน์จากการจำกัดอัตราอาจผูกกับระดับโมเดลได้ โปรไฟล์ที่อยู่ในช่วงคูลดาวน์สำหรับ
  โมเดลหนึ่งยังคงอาจใช้ได้กับโมเดลที่เกี่ยวข้องอีกรายการหนึ่งในผู้ให้บริการเดียวกัน

สคริปต์ ops แบบเลือกใช้ (systemd/Termux) มีเอกสารอยู่ที่นี่:
[Auth monitoring scripts](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุเกี่ยวกับ Anthropic

ขณะนี้แบ็กเอนด์ Anthropic `claude-cli` ได้รับการรองรับอีกครั้ง

- เจ้าหน้าที่ของ Anthropic แจ้งกับเราว่าเส้นทางการผสานรวม OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI มาใช้ซ้ำและการใช้งาน `claude -p` เป็นแนวทางที่ได้รับอนุญาต
  สำหรับการรันที่ขับเคลื่อนด้วย Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- คีย์ API ของ Anthropic ยังคงเป็นตัวเลือกที่คาดการณ์ได้มากที่สุดสำหรับโฮสต์ Gateway
  แบบระยะยาวและการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุนเวียนคีย์ API (gateway)

ผู้ให้บริการบางรายรองรับการลองส่งคำขอใหม่ด้วยคีย์ทางเลือกเมื่อการเรียก API
ชนกับการจำกัดอัตราของผู้ให้บริการ

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการคีย์เดียวกันจะถูกลบรายการซ้ำก่อนใช้งาน
- OpenClaw จะลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อเป็นข้อผิดพลาดจากการจำกัดอัตราเท่านั้น (ตัวอย่างเช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่การจำกัดอัตราจะไม่ถูกลองใหม่ด้วยคีย์ทางเลือก
- หากคีย์ทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งล่าสุด

## การควบคุมว่าจะใช้ข้อมูลรับรองใด

### ต่อเซสชัน (คำสั่งแชต)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อ pin ข้อมูลรับรองของผู้ให้บริการที่ต้องการสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile id: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบย่อ; ใช้ `/model status` สำหรับมุมมองแบบเต็ม (ผู้สมัคร + โปรไฟล์การยืนยันตัวตนถัดไป รวมถึงรายละเอียด endpoint ของผู้ให้บริการเมื่อมีการกำหนดค่าไว้)

### ต่อเอเจนต์ (CLI override)

กำหนด override ลำดับโปรไฟล์การยืนยันตัวตนอย่างชัดเจนสำหรับเอเจนต์หนึ่งตัว (จัดเก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายเอเจนต์เฉพาะ; ละเว้นตัวเลือกนี้เพื่อใช้เอเจนต์เริ่มต้นที่กำหนดค่าไว้
เมื่อคุณแก้ปัญหาเรื่องลำดับ `openclaw models status --probe` จะแสดงโปรไฟล์ที่จัดเก็บไว้ซึ่งถูกละเว้น
เป็น `excluded_by_auth_order` แทนที่จะข้ามแบบเงียบ ๆ
เมื่อคุณแก้ปัญหาเรื่องคูลดาวน์ โปรดจำไว้ว่าระยะคูลดาวน์จากการจำกัดอัตราอาจผูกอยู่กับ
model id หนึ่งรายการ ไม่ใช่ทั้งโปรไฟล์ของผู้ให้บริการ

## การแก้ไขปัญหา

### "ไม่พบข้อมูลรับรอง"

หากไม่มีโปรไฟล์ Anthropic ให้กำหนดค่าคีย์ API ของ Anthropic บน
**โฮสต์ Gateway** หรือตั้งค่าเส้นทางโทเค็นการตั้งค่า Anthropic จากนั้นตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### โทเค็นใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่าโปรไฟล์ใดกำลังจะหมดอายุ หากไม่มี
โปรไฟล์โทเค็น Anthropic หรือหมดอายุแล้ว ให้รีเฟรชการตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้คีย์ API ของ Anthropic
