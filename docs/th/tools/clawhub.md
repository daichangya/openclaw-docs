---
read_when:
    - การแนะนำ ClawHub ให้ผู้ใช้ใหม่
    - การติดตั้ง ค้นหา หรือเผยแพร่ Skills หรือ Plugins
    - การอธิบายแฟล็กของ ClawHub CLI และพฤติกรรมการซิงก์
summary: 'คู่มือ ClawHub: registry สาธารณะ โฟลว์ติดตั้งแบบ native ของ OpenClaw และเวิร์กโฟลว์ของ ClawHub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-23T05:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub คือ registry สาธารณะสำหรับ **Skills และ Plugins ของ OpenClaw**

- ใช้คำสั่ง `openclaw` แบบ native เพื่อค้นหา/ติดตั้ง/อัปเดต Skills และติดตั้ง
  Plugins จาก ClawHub
- ใช้ CLI แยกชื่อ `clawhub` เมื่อต้องการ workflow ด้านการยืนยันตัวตนกับ registry, การเผยแพร่, ลบ,
  กู้คืน หรือซิงก์

เว็บไซต์: [clawhub.ai](https://clawhub.ai)

## โฟลว์แบบ native ของ OpenClaw

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

package spec ของ Plugin ที่ปลอดภัยตามรูปแบบ npm แบบไม่ระบุคำนำหน้าก็จะถูกลองกับ ClawHub ก่อน npm ด้วย:

```bash
openclaw plugins install openclaw-codex-app-server
```

คำสั่ง `openclaw` แบบ native จะติดตั้งลงใน workspace ที่ active อยู่ และเก็บเมทาดาทาแหล่งที่มาไว้
เพื่อให้การเรียก `update` ภายหลังยังคงอยู่บน ClawHub ได้

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนเริ่มการติดตั้ง archive ดังนั้นโฮสต์ที่ไม่เข้ากันจะ fail closed ตั้งแต่เนิ่น ๆ
แทนที่จะติดตั้งได้เพียงบางส่วน

`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin ที่ติดตั้งได้เท่านั้น
หาก package ใน ClawHub เป็น Skill จริง OpenClaw จะหยุดและชี้คุณไปที่
`openclaw skills install <slug>` แทน

## ClawHub คืออะไร

- registry สาธารณะสำหรับ Skills และ Plugins ของ OpenClaw
- ที่เก็บแบบมีเวอร์ชันของชุด Skill และเมทาดาทา
- พื้นผิวสำหรับการค้นพบผ่านการค้นหา tag และสัญญาณการใช้งาน

## วิธีการทำงาน

1. ผู้ใช้เผยแพร่ชุด Skill (ไฟล์ + เมทาดาทา)
2. ClawHub เก็บชุดนั้นไว้ parse เมทาดาทา และกำหนดเวอร์ชัน
3. registry ทำดัชนี Skill เพื่อการค้นหาและการค้นพบ
4. ผู้ใช้ browse ดาวน์โหลด และติดตั้ง Skills ใน OpenClaw

## สิ่งที่คุณทำได้

- เผยแพร่ Skills ใหม่และเวอร์ชันใหม่ของ Skills ที่มีอยู่
- ค้นพบ Skills ตามชื่อ tag หรือการค้นหา
- ดาวน์โหลดชุด Skill และตรวจสอบไฟล์ภายใน
- รายงาน Skills ที่ไม่เหมาะสมหรือไม่ปลอดภัย
- หากคุณเป็นผู้ดูแล สามารถซ่อน เลิกซ่อน ลบ หรือแบนได้

## เหมาะกับใคร (เป็นมิตรกับผู้เริ่มต้น)

หากคุณต้องการเพิ่มความสามารถใหม่ให้กับเอเจนต์ OpenClaw ของคุณ ClawHub คือวิธีที่ง่ายที่สุดในการค้นหาและติดตั้ง Skills คุณไม่จำเป็นต้องรู้ว่าแบ็กเอนด์ทำงานอย่างไร คุณสามารถ:

- ค้นหา Skills ด้วยภาษาทั่วไป
- ติดตั้ง Skill ลงใน workspace ของคุณ
- อัปเดต Skills ภายหลังด้วยคำสั่งเดียว
- สำรอง Skills ของคุณเองโดยการเผยแพร่

## เริ่มต้นอย่างรวดเร็ว (ไม่เชิงเทคนิค)

1. ค้นหาสิ่งที่คุณต้องการ:
   - `openclaw skills search "calendar"`
2. ติดตั้ง Skill:
   - `openclaw skills install <skill-slug>`
3. เริ่มเซสชัน OpenClaw ใหม่เพื่อให้มันเห็น Skill ใหม่
4. หากคุณต้องการเผยแพร่หรือจัดการ auth ของ registry ให้ติดตั้ง
   CLI `clawhub` แยกต่างหากด้วย

## ติดตั้ง ClawHub CLI

คุณต้องใช้สิ่งนี้เฉพาะสำหรับ workflow ที่ยืนยันตัวตนกับ registry เช่น publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## มันเข้ากับ OpenClaw อย่างไร

`openclaw skills install` แบบ native จะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่ active อยู่ ส่วน `openclaw plugins install clawhub:...` จะบันทึกการติดตั้ง Plugin แบบจัดการตามปกติ พร้อมเมทาดาทาแหล่งที่มาของ ClawHub สำหรับการอัปเดต

การติดตั้ง Plugin จาก ClawHub แบบไม่ระบุตัวตนก็จะ fail closed สำหรับ package ส่วนตัวด้วย
ส่วน community channel หรือช่องทางที่ไม่เป็นทางการอื่นยังติดตั้งได้ แต่ OpenClaw จะเตือน
เพื่อให้ผู้ปฏิบัติงานตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน

CLI `clawhub` แบบแยกยังติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบันของคุณ หากมีการตั้งค่า OpenClaw workspace ไว้ `clawhub`
จะ fallback ไปยัง workspace นั้น เว้นแต่คุณจะ override ด้วย `--workdir` (หรือ
`CLAWHUB_WORKDIR`) OpenClaw จะโหลด workspace skills จาก `<workspace>/skills`
และจะเห็นมันในเซสชัน**ถัดไป** หากคุณใช้งาน
`~/.openclaw/skills` หรือ bundled skills อยู่แล้ว workspace skills จะมีลำดับความสำคัญก่อน

สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด แชร์ และควบคุมการใช้งาน Skills ดู
[Skills](/th/tools/skills)

## ภาพรวมของระบบ Skill

Skill คือชุดไฟล์แบบมีเวอร์ชันที่สอน OpenClaw วิธีทำงานเฉพาะอย่าง
แต่ละครั้งที่เผยแพร่จะสร้างเวอร์ชันใหม่ และ registry จะเก็บประวัติเวอร์ชันไว้
เพื่อให้ผู้ใช้ตรวจสอบการเปลี่ยนแปลงได้

Skill ทั่วไปมักประกอบด้วย:

- ไฟล์ `SKILL.md` พร้อมคำอธิบายหลักและวิธีใช้
- คอนฟิก สคริปต์ หรือไฟล์สนับสนุนแบบไม่บังคับที่ Skill ใช้
- เมทาดาทา เช่น tag สรุป และข้อกำหนดในการติดตั้ง

ClawHub ใช้เมทาดาทาเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ Skill อย่างปลอดภัย
registry ยังติดตามสัญญาณการใช้งาน (เช่น ดาวและจำนวนดาวน์โหลด) เพื่อปรับปรุง
การจัดอันดับและการมองเห็น

## สิ่งที่บริการนี้มีให้ (ฟีเจอร์)

- **การ browse สาธารณะ** ของ Skills และเนื้อหา `SKILL.md`
- **การค้นหา** ที่ขับเคลื่อนด้วย embeddings (vector search) ไม่ใช่แค่คีย์เวิร์ด
- **การทำเวอร์ชัน** ด้วย semver, changelog และ tag (รวมถึง `latest`)
- **การดาวน์โหลด** เป็น zip ต่อเวอร์ชัน
- **ดาวและคอมเมนต์** สำหรับความคิดเห็นจากชุมชน
- **hook สำหรับ moderation** สำหรับ approvals และ audits
- **API ที่เป็นมิตรกับ CLI** สำหรับระบบอัตโนมัติและการเขียนสคริปต์

## ความปลอดภัยและ moderation

ClawHub เปิดกว้างเป็นค่าเริ่มต้น ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub ต้อง
มีอายุอย่างน้อยหนึ่งสัปดาห์จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอการใช้งานในทางที่ผิดโดยไม่ปิดกั้น
ผู้มีส่วนร่วมที่ชอบด้วยกฎหมาย

การรายงานและ moderation:

- ผู้ใช้ที่ลงชื่อเข้าใช้ทุกคนสามารถรายงาน Skill ได้
- ต้องระบุเหตุผลของการรายงานและมีการบันทึกไว้
- ผู้ใช้แต่ละคนสามารถมีรายงานที่ active ได้พร้อมกันสูงสุด 20 รายการ
- Skills ที่มีรายงานจากผู้ใช้ไม่ซ้ำกันมากกว่า 3 ราย จะถูกซ่อนอัตโนมัติตามค่าเริ่มต้น
- ผู้ดูแลสามารถดู Skills ที่ถูกซ่อน เลิกซ่อน ลบ หรือแบนผู้ใช้ได้
- การใช้ฟีเจอร์รายงานในทางที่ผิดอาจนำไปสู่การถูกแบนบัญชี

สนใจเป็นผู้ดูแลหรือไม่? ถามใน Discord ของ OpenClaw และติดต่อผู้ดูแลหรือผู้ดูแลโครงการ

## คำสั่ง CLI และพารามิเตอร์

ตัวเลือก global (ใช้ได้กับทุกคำสั่ง):

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: ไดเรกทอรีปัจจุบัน; fallback ไปยัง OpenClaw workspace)
- `--dir <dir>`: ไดเรกทอรี Skills แบบสัมพัทธ์จาก workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: base URL ของไซต์ (สำหรับ browser login)
- `--registry <url>`: base URL ของ registry API
- `--no-input`: ปิด prompt (non-interactive)
- `-V, --cli-version`: พิมพ์เวอร์ชันของ CLI

Auth:

- `clawhub login` (โฟลว์ผ่านเบราว์เซอร์) หรือ `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

ตัวเลือก:

- `--token <token>`: วาง API token
- `--label <label>`: label ที่เก็บไว้สำหรับ token จาก browser login (ค่าเริ่มต้น: `CLI token`)
- `--no-browser`: ไม่เปิดเบราว์เซอร์ (ต้องใช้ร่วมกับ `--token`)

ค้นหา:

- `clawhub search "query"`
- `--limit <n>`: จำนวนผลลัพธ์สูงสุด

ติดตั้ง:

- `clawhub install <slug>`
- `--version <version>`: ติดตั้งเวอร์ชันที่เฉพาะเจาะจง
- `--force`: เขียนทับหากมีโฟลเดอร์อยู่แล้ว

อัปเดต:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: อัปเดตเป็นเวอร์ชันที่เฉพาะเจาะจง (ใช้ได้กับ slug เดียวเท่านั้น)
- `--force`: เขียนทับเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ

รายการ:

- `clawhub list` (อ่านจาก `.clawhub/lock.json`)

เผยแพร่ Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug ของ Skill
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความ changelog (เว้นว่างได้)
- `--tags <tags>`: tag คั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)

เผยแพร่ Plugins:

- `clawhub package publish <source>`
- `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ GitHub URL
- `--dry-run`: build แผนการเผยแพร่แบบตรงตัวโดยไม่อัปโหลดอะไร
- `--json`: ส่งออกแบบ machine-readable สำหรับ CI
- `--source-repo`, `--source-commit`, `--source-ref`: override แบบไม่บังคับเมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

ลบ/กู้คืน (เฉพาะ owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

ซิงก์ (สแกน Skills ในเครื่อง + เผยแพร่ตัวใหม่/ตัวที่อัปเดต):

- `clawhub sync`
- `--root <dir...>`: root สำหรับการสแกนเพิ่มเติม
- `--all`: อัปโหลดทุกอย่างโดยไม่ถาม
- `--dry-run`: แสดงว่าจะอัปโหลดอะไรบ้าง
- `--bump <type>`: `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
- `--changelog <text>`: changelog สำหรับการอัปเดตแบบ non-interactive
- `--tags <tags>`: tag คั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)
- `--concurrency <n>`: จำนวนการตรวจสอบ registry พร้อมกัน (ค่าเริ่มต้น: 4)

## เวิร์กโฟลว์ทั่วไปสำหรับเอเจนต์

### ค้นหา Skills

```bash
clawhub search "postgres backups"
```

### ดาวน์โหลด Skills ใหม่

```bash
clawhub install my-skill-pack
```

### อัปเดต Skills ที่ติดตั้งแล้ว

```bash
clawhub update --all
```

### สำรอง Skills ของคุณ (publish หรือ sync)

สำหรับโฟลเดอร์ Skill เดียว:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

เพื่อสแกนและสำรอง Skills หลายตัวพร้อมกัน:

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

Plugin แบบโค้ดต้องมีเมทาดาทา OpenClaw ที่จำเป็นใน `package.json`:

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

package ที่เผยแพร่ควรส่งมาพร้อม JavaScript ที่ build แล้ว และชี้ `runtimeExtensions`
ไปยังเอาต์พุตนั้น การติดตั้งแบบ git checkout ยัง fallback ไปยัง source TypeScript ได้
เมื่อไม่มีไฟล์ที่ build แล้ว แต่ runtime entry แบบ build แล้วช่วยหลีกเลี่ยงการคอมไพล์ TypeScript ตอน runtime ในเส้นทาง startup, doctor และการโหลด Plugin

## รายละเอียดขั้นสูง (เชิงเทคนิค)

### การทำเวอร์ชันและ tag

- แต่ละครั้งที่เผยแพร่จะสร้าง `SkillVersion` แบบ **semver** ใหม่
- tag (เช่น `latest`) จะชี้ไปยังเวอร์ชันหนึ่ง; การย้าย tag ช่วยให้คุณ rollback ได้
- changelog ถูกแนบแยกตามเวอร์ชัน และสามารถเว้นว่างได้เมื่อ sync หรือเผยแพร่การอัปเดต

### การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันใน registry

การอัปเดตจะเปรียบเทียบเนื้อหา Skill ในเครื่องกับเวอร์ชันใน registry โดยใช้ content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ CLI จะถามก่อนเขียนทับ (หรือบังคับให้ใช้ `--force` ในโหมด non-interactive)

### การสแกน sync และ fallback root

`clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills จะ fallback ไปยังตำแหน่งแบบ legacy ที่รู้จัก (เช่น `~/openclaw/skills` และ `~/.openclaw/skills`) สิ่งนี้ออกแบบมาเพื่อค้นหา Skill ที่ติดตั้งไว้แบบเก่าโดยไม่ต้องใส่แฟล็กเพิ่มเติม

### การจัดเก็บและ lockfile

- Skills ที่ติดตั้งแล้วจะถูกบันทึกไว้ใน `.clawhub/lock.json` ภายใต้ workdir ของคุณ
- auth token จะถูกเก็บไว้ในไฟล์คอนฟิกของ ClawHub CLI (override ได้ผ่าน `CLAWHUB_CONFIG_PATH`)

### Telemetry (จำนวนการติดตั้ง)

เมื่อคุณรัน `clawhub sync` ขณะล็อกอินอยู่ CLI จะส่งสแนปชอตแบบน้อยที่สุดเพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดสิ่งนี้ได้ทั้งหมด:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## ตัวแปรสภาพแวดล้อม

- `CLAWHUB_SITE`: override URL ของไซต์
- `CLAWHUB_REGISTRY`: override URL ของ registry API
- `CLAWHUB_CONFIG_PATH`: override ตำแหน่งที่ CLI เก็บ token/config
- `CLAWHUB_WORKDIR`: override workdir ค่าเริ่มต้น
- `CLAWHUB_DISABLE_TELEMETRY=1`: ปิด telemetry บน `sync`
