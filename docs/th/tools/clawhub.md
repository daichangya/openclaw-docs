---
read_when:
    - การแนะนำ ClawHub ให้ผู้ใช้ใหม่
    - การติดตั้ง ค้นหา หรือเผยแพร่ Skills หรือ Plugin
    - การอธิบายแฟล็กของ ClawHub CLI และพฤติกรรมการซิงค์
summary: 'คู่มือ ClawHub: รีจิสทรีสาธารณะ, โฟลว์การติดตั้ง OpenClaw แบบเนทีฟ และเวิร์กโฟลว์ ClawHub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T09:35:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub คือรีจิสทรีสาธารณะสำหรับ **Skills และ Plugin ของ OpenClaw**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา/ติดตั้ง/อัปเดต Skills และติดตั้ง
  Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากเมื่อคุณต้องการการยืนยันตัวตนกับรีจิสทรี, การเผยแพร่, การลบ,
  การกู้คืน, หรือเวิร์กโฟลว์การซิงค์

เว็บไซต์: [clawhub.ai](https://clawhub.ai)

## โฟลว์ OpenClaw แบบเนทีฟ

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

สเปก Plugin แบบ bare npm-safe จะถูกลองค้นหากับ ClawHub ก่อน npm ด้วย:

```bash
openclaw plugins install openclaw-codex-app-server
```

คำสั่ง `openclaw` แบบเนทีฟจะติดตั้งลงใน workspace ที่ใช้งานอยู่ และบันทึก metadata
ของแหล่งที่มาไว้ เพื่อให้การเรียก `update` ภายหลังยังคงอยู่บน ClawHub ได้

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนรันการติดตั้ง archive ดังนั้น host ที่ไม่เข้ากันจะถูกปิดกั้นตั้งแต่ต้น
แทนที่จะติดตั้งแพ็กเกจเพียงบางส่วน

`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin ที่ติดตั้งได้เท่านั้น
หากแพ็กเกจ ClawHub เป็น Skill จริง OpenClaw จะหยุดและแนะนำให้คุณใช้
`openclaw skills install <slug>` แทน

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw
- ที่เก็บ bundle ของ Skill และ metadata แบบมีเวอร์ชัน
- พื้นที่สำหรับการค้นพบผ่านการค้นหา แท็ก และสัญญาณการใช้งาน

## วิธีการทำงาน

1. ผู้ใช้เผยแพร่ bundle ของ Skill (ไฟล์ + metadata)
2. ClawHub จัดเก็บ bundle แยกวิเคราะห์ metadata และกำหนดเวอร์ชัน
3. รีจิสทรีทำดัชนี Skill สำหรับการค้นหาและการค้นพบ
4. ผู้ใช้เรียกดู ดาวน์โหลด และติดตั้ง Skills ใน OpenClaw

## สิ่งที่คุณทำได้

- เผยแพร่ Skills ใหม่และเวอร์ชันใหม่ของ Skills ที่มีอยู่
- ค้นพบ Skills ตามชื่อ แท็ก หรือการค้นหา
- ดาวน์โหลด bundle ของ Skill และตรวจสอบไฟล์ภายใน
- รายงาน Skills ที่ไม่เหมาะสมหรือไม่ปลอดภัย
- หากคุณเป็นผู้ดูแล คุณสามารถซ่อน เลิกซ่อน ลบ หรือแบนได้

## เหมาะสำหรับใคร (เป็นมิตรกับผู้เริ่มต้น)

หากคุณต้องการเพิ่มความสามารถใหม่ให้กับเอเจนต์ OpenClaw ของคุณ ClawHub คือวิธีที่ง่ายที่สุดในการค้นหาและติดตั้ง Skills คุณไม่จำเป็นต้องรู้ว่า backend ทำงานอย่างไร คุณสามารถ:

- ค้นหา Skills ด้วยภาษาปกติ
- ติดตั้ง Skill ลงใน workspace ของคุณ
- อัปเดต Skills ภายหลังได้ด้วยคำสั่งเดียว
- สำรอง Skills ของคุณเองด้วยการเผยแพร่

## เริ่มต้นอย่างรวดเร็ว (ไม่เชิงเทคนิค)

1. ค้นหาสิ่งที่คุณต้องการ:
   - `openclaw skills search "calendar"`
2. ติดตั้ง Skill:
   - `openclaw skills install <skill-slug>`
3. เริ่มเซสชัน OpenClaw ใหม่เพื่อให้ระบบรับ Skill ใหม่
4. หากคุณต้องการเผยแพร่หรือจัดการการยืนยันตัวตนกับรีจิสทรี ให้ติดตั้ง
   CLI `clawhub` แยกต่างหากด้วย

## ติดตั้ง ClawHub CLI

คุณต้องใช้สิ่งนี้เฉพาะสำหรับเวิร์กโฟลว์ที่ต้องยืนยันตัวตนกับรีจิสทรี เช่น publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## วิธีที่มันเชื่อมเข้ากับ OpenClaw

`openclaw skills install` แบบเนทีฟจะติดตั้งลงในไดเรกทอรี `skills/`
ของ workspace ที่ใช้งานอยู่ `openclaw plugins install clawhub:...` จะบันทึก
การติดตั้ง Plugin แบบ managed ปกติพร้อม metadata แหล่งที่มาของ ClawHub สำหรับการอัปเดต

การติดตั้ง Plugin จาก ClawHub แบบไม่ระบุตัวตนจะปิดกั้นสำหรับแพ็กเกจ private ด้วย
ช่องทางชุมชนหรือช่องทางที่ไม่ใช่ทางการอื่นยังคงติดตั้งได้ แต่ OpenClaw จะเตือน
เพื่อให้ผู้ดูแลตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน

CLI `clawhub` แยกต่างหากจะติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากมีการกำหนดค่า workspace ของ OpenClaw ไว้ `clawhub`
จะ fallback ไปยัง workspace นั้น เว้นแต่คุณจะ override ด้วย `--workdir` (หรือ
`CLAWHUB_WORKDIR`) OpenClaw โหลด workspace skills จาก `<workspace>/skills`
และจะรับมาใช้ในเซสชัน**ถัดไป** หากคุณใช้งาน
`~/.openclaw/skills` หรือ bundled skills อยู่แล้ว workspace skills จะมีลำดับความสำคัญสูงกว่า

สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีที่ Skills ถูกโหลด ใช้ร่วมกัน และกำกับไว้ โปรดดู
[Skills](/th/tools/skills)

## ภาพรวมระบบ Skill

Skill คือ bundle ของไฟล์แบบมีเวอร์ชันที่สอน OpenClaw ให้ทำงาน
เฉพาะอย่างหนึ่ง แต่ละครั้งที่เผยแพร่จะสร้างเวอร์ชันใหม่ และรีจิสทรีจะเก็บ
ประวัติเวอร์ชันไว้เพื่อให้ผู้ใช้ตรวจสอบการเปลี่ยนแปลงได้

Skill โดยทั่วไปประกอบด้วย:

- ไฟล์ `SKILL.md` พร้อมคำอธิบายหลักและวิธีใช้งาน
- config, script หรือไฟล์สนับสนุนเพิ่มเติมที่ Skill ใช้
- metadata เช่น แท็ก สรุป และข้อกำหนดการติดตั้ง

ClawHub ใช้ metadata เพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ Skill อย่างปลอดภัย
รีจิสทรียังติดตามสัญญาณการใช้งาน (เช่น ดาวและจำนวนดาวน์โหลด) เพื่อปรับปรุง
การจัดอันดับและการมองเห็น

## บริการนี้มีอะไรให้บ้าง (ฟีเจอร์)

- **การเรียกดูสาธารณะ** ของ Skills และเนื้อหา `SKILL.md`
- **การค้นหา** ที่ขับเคลื่อนด้วย embeddings (การค้นหาแบบเวกเตอร์) ไม่ใช่แค่คีย์เวิร์ด
- **การกำหนดเวอร์ชัน** ด้วย semver, changelog และแท็ก (รวมถึง `latest`)
- **การดาวน์โหลด** เป็น zip แยกตามแต่ละเวอร์ชัน
- **ดาวและความคิดเห็น** สำหรับข้อเสนอแนะจากชุมชน
- **Hooks สำหรับการกลั่นกรอง** เพื่อการอนุมัติและ audit
- **API ที่เป็นมิตรกับ CLI** สำหรับระบบอัตโนมัติและสคริปต์

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดใช้งานโดยค่าเริ่มต้น ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub ต้อง
มีอายุอย่างน้อยหนึ่งสัปดาห์จึงจะเผยแพร่ได้ ซึ่งช่วยชะลอการใช้งานในทางที่ผิดโดยไม่ขัดขวาง
ผู้มีส่วนร่วมที่ถูกต้องตามปกติ

การรายงานและการกลั่นกรอง:

- ผู้ใช้ที่ลงชื่อเข้าใช้แล้วทุกคนสามารถรายงาน Skill ได้
- ต้องระบุเหตุผลของการรายงานและมีการบันทึกไว้
- ผู้ใช้แต่ละคนสามารถมีรายงานที่ยังใช้งานอยู่ได้สูงสุด 20 รายการในเวลาเดียวกัน
- Skills ที่มีรายงานไม่ซ้ำกันมากกว่า 3 รายการจะถูกซ่อนโดยอัตโนมัติตามค่าเริ่มต้น
- ผู้ดูแลสามารถดู Skills ที่ถูกซ่อน เลิกซ่อน ลบ หรือแบนผู้ใช้ได้
- การใช้ฟีเจอร์รายงานในทางที่ผิดอาจส่งผลให้บัญชีถูกแบน

สนใจเป็นผู้ดูแลหรือไม่? ถามได้ใน OpenClaw Discord และติดต่อ
ผู้ดูแลหรือผู้ดูแลระบบหลัก

## คำสั่ง CLI และพารามิเตอร์

ตัวเลือกส่วนกลาง (ใช้กับทุกคำสั่ง):

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: dir ปัจจุบัน; fallback ไปยัง OpenClaw workspace)
- `--dir <dir>`: ไดเรกทอรี Skills โดยอิงจาก workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานของเว็บไซต์ (เข้าสู่ระบบผ่านเบราว์เซอร์)
- `--registry <url>`: URL ฐานของ API รีจิสทรี
- `--no-input`: ปิด prompts (ไม่โต้ตอบ)
- `-V, --cli-version`: พิมพ์เวอร์ชัน CLI

Auth:

- `clawhub login` (โฟลว์เบราว์เซอร์) หรือ `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

ตัวเลือก:

- `--token <token>`: วาง API token
- `--label <label>`: ป้ายกำกับที่จัดเก็บสำหรับ token การล็อกอินผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `CLI token`)
- `--no-browser`: ไม่เปิดเบราว์เซอร์ (ต้องใช้ร่วมกับ `--token`)

ค้นหา:

- `clawhub search "query"`
- `--limit <n>`: จำนวนผลลัพธ์สูงสุด

ติดตั้ง:

- `clawhub install <slug>`
- `--version <version>`: ติดตั้งเวอร์ชันที่ระบุ
- `--force`: เขียนทับหากโฟลเดอร์มีอยู่แล้ว

อัปเดต:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: อัปเดตเป็นเวอร์ชันที่ระบุ (ใช้ได้กับ slug เดียวเท่านั้น)
- `--force`: เขียนทับเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใดๆ

รายการ:

- `clawhub list` (อ่าน `.clawhub/lock.json`)

เผยแพร่ Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug ของ Skill
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความ changelog (สามารถเว้นว่างได้)
- `--tags <tags>`: แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)

เผยแพร่ Plugins:

- `clawhub package publish <source>`
- `<source>` สามารถเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref`, หรือ GitHub URL
- `--dry-run`: สร้างแผนการเผยแพร่จริงโดยไม่อัปโหลดอะไร
- `--json`: แสดงผลลัพธ์แบบ machine-readable สำหรับ CI
- `--source-repo`, `--source-commit`, `--source-ref`: ใช้ override แบบเลือกได้เมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

ลบ/กู้คืน (เฉพาะ owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

ซิงค์ (สแกน Skills ในเครื่อง + เผยแพร่รายการใหม่/ที่อัปเดต):

- `clawhub sync`
- `--root <dir...>`: root เพิ่มเติมสำหรับสแกน
- `--all`: อัปโหลดทุกอย่างโดยไม่มี prompt
- `--dry-run`: แสดงสิ่งที่จะถูกอัปโหลด
- `--bump <type>`: `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
- `--changelog <text>`: changelog สำหรับการอัปเดตแบบไม่โต้ตอบ
- `--tags <tags>`: แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)
- `--concurrency <n>`: การตรวจสอบรีจิสทรี (ค่าเริ่มต้น: 4)

## เวิร์กโฟลว์ทั่วไปสำหรับเอเจนต์

### ค้นหา Skills

```bash
clawhub search "postgres backups"
```

### ดาวน์โหลด Skills ใหม่

```bash
clawhub install my-skill-pack
```

### อัปเดต Skills ที่ติดตั้งไว้

```bash
clawhub update --all
```

### สำรอง Skills ของคุณ (เผยแพร่หรือซิงค์)

สำหรับโฟลเดอร์ Skill เดียว:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

เพื่อสแกนและสำรอง Skills จำนวนมากพร้อมกัน:

```bash
clawhub sync --all
```

### เผยแพร่ Plugin จาก GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Code Plugin ต้องมี metadata ของ OpenClaw ที่จำเป็นใน `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

แพ็กเกจที่เผยแพร่ควรส่งมอบ JavaScript ที่ build แล้วและชี้ `runtimeExtensions`
ไปยังผลลัพธ์นั้น การติดตั้งจาก Git checkout ยังสามารถ fallback ไปยังซอร์ส TypeScript
ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่ entry ของ runtime ที่ build แล้วจะช่วยหลีกเลี่ยง
การคอมไพล์ TypeScript ระหว่างรันในขั้นตอนการเริ่มต้น doctor และการโหลด Plugin

## รายละเอียดขั้นสูง (เชิงเทคนิค)

### การกำหนดเวอร์ชันและแท็ก

- การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` แบบ **semver** ใหม่
- แท็ก (เช่น `latest`) ชี้ไปยังเวอร์ชันหนึ่ง การย้ายแท็กช่วยให้คุณ rollback ได้
- changelog จะแนบตามแต่ละเวอร์ชัน และสามารถเว้นว่างได้เมื่อซิงค์หรือเผยแพร่การอัปเดต

### การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันในรีจิสทรี

การอัปเดตจะเปรียบเทียบเนื้อหา Skill ในเครื่องกับเวอร์ชันในรีจิสทรีโดยใช้ content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใดๆ CLI จะถามก่อนเขียนทับ (หรือกำหนดให้ใช้ `--force` ในการรันแบบไม่โต้ตอบ)

### การสแกนซิงค์และ root สำรอง

`clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills ระบบจะ fallback ไปยังตำแหน่ง legacy ที่รู้จัก (เช่น `~/openclaw/skills` และ `~/.openclaw/skills`) ซึ่งออกแบบมาเพื่อค้นหาการติดตั้ง Skill รุ่นเก่าโดยไม่ต้องใช้แฟล็กเพิ่มเติม

### ที่เก็บข้อมูลและ lockfile

- Skills ที่ติดตั้งแล้วจะถูกบันทึกไว้ใน `.clawhub/lock.json` ภายใต้ workdir ของคุณ
- Auth token จะถูกเก็บไว้ในไฟล์ config ของ ClawHub CLI (override ได้ผ่าน `CLAWHUB_CONFIG_PATH`)

### Telemetry (จำนวนการติดตั้ง)

เมื่อคุณรัน `clawhub sync` ขณะล็อกอินอยู่ CLI จะส่ง snapshot ขั้นต่ำเพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดใช้งานสิ่งนี้ทั้งหมดได้:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## ตัวแปรสภาพแวดล้อม

- `CLAWHUB_SITE`: override URL ของเว็บไซต์
- `CLAWHUB_REGISTRY`: override URL ของ API รีจิสทรี
- `CLAWHUB_CONFIG_PATH`: override ตำแหน่งที่ CLI เก็บ token/config
- `CLAWHUB_WORKDIR`: override workdir เริ่มต้น
- `CLAWHUB_DISABLE_TELEMETRY=1`: ปิด telemetry บน `sync`

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin)
- [Skills](/th/tools/skills)
- [Community plugins](/th/plugins/community)
