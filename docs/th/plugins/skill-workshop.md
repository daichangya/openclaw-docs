---
read_when:
    - คุณต้องการให้เอเจนต์เปลี่ยนคำแก้ไขหรือขั้นตอนที่นำกลับมาใช้ซ้ำได้ให้เป็น Skills ของ workspace
    - คุณกำลังตั้งค่าหน่วยความจำ Skills เชิงกระบวนการ
    - คุณกำลังดีบักพฤติกรรมของ tool `skill_workshop`
    - คุณกำลังตัดสินใจว่าจะเปิดใช้การสร้าง Skills อัตโนมัติหรือไม่
summary: การบันทึกขั้นตอนที่นำกลับมาใช้ซ้ำได้ในฐานะ Skills ของ workspace แบบ experimental พร้อมการทบทวน การอนุมัติ การกักกัน และการรีเฟรช Skill แบบ hot
title: Skill Workshop Plugin
x-i18n:
    generated_at: "2026-04-23T05:49:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop Plugin

Skill Workshop เป็นฟีเจอร์ **experimental** โดยปิดอยู่ตามค่าเริ่มต้น heuristic สำหรับการจับข้อมูล
และ prompt ของ reviewer อาจเปลี่ยนแปลงได้ระหว่างรีลีส และการเขียนอัตโนมัติ
ควรใช้เฉพาะใน workspace ที่เชื่อถือได้ หลังจากตรวจสอบผลลัพธ์ในโหมด pending ก่อนเท่านั้น

Skill Workshop คือหน่วยความจำเชิงกระบวนการสำหรับ Skills ของ workspace มันช่วยให้เอเจนต์เปลี่ยน
workflow ที่นำกลับมาใช้ซ้ำได้, คำแก้ไขจากผู้ใช้, วิธีแก้ที่ได้มายาก และข้อผิดพลาดที่เกิดซ้ำ
ให้เป็นไฟล์ `SKILL.md` ภายใต้:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

สิ่งนี้ต่างจากหน่วยความจำระยะยาว:

- **Memory** เก็บข้อเท็จจริง ความชอบ เอนทิตี และบริบทในอดีต
- **Skills** เก็บกระบวนการที่นำกลับมาใช้ซ้ำได้ซึ่งเอเจนต์ควรทำตามในงานครั้งถัดไป
- **Skill Workshop** เป็นสะพานจาก turn ที่มีประโยชน์ไปสู่ Skill ของ workspace ที่คงทน
  พร้อมการตรวจสอบด้านความปลอดภัยและการอนุมัติแบบไม่บังคับ

Skill Workshop มีประโยชน์เมื่อเอเจนต์เรียนรู้กระบวนการ เช่น:

- วิธีตรวจสอบไฟล์ animated GIF ที่มาจากแหล่งภายนอก
- วิธีแทนที่ไฟล์ screenshot และตรวจสอบมิติ
- วิธีรันสถานการณ์ QA เฉพาะของรีโป
- วิธีดีบักความล้มเหลวของผู้ให้บริการที่เกิดซ้ำ
- วิธีซ่อมโน้ต workflow ภายในเครื่องที่ล้าสมัย

มันไม่ได้มีไว้สำหรับ:

- ข้อเท็จจริงอย่าง “ผู้ใช้ชอบสีฟ้า”
- หน่วยความจำเชิงอัตชีวประวัติแบบกว้าง
- การเก็บ transcript ดิบ
- secret, credentials หรือข้อความ prompt ที่ซ่อนอยู่
- คำสั่งแบบครั้งเดียวที่ไม่น่าจะเกิดซ้ำ

## สถานะเริ่มต้น

bundled plugin นี้เป็น **experimental** และ **ปิดอยู่โดยค่าเริ่มต้น** เว้นแต่จะ
เปิดใช้งานอย่างชัดเจนใน `plugins.entries.skill-workshop`

manifest ของ Plugin ไม่ได้ตั้ง `enabledByDefault: true` ค่าเริ่มต้น `enabled: true`
ภายใน config schema ของ Plugin จะมีผลก็ต่อเมื่อมีการเลือกและโหลด entry ของ Plugin แล้วเท่านั้น

experimental หมายความว่า:

- Plugin นี้รองรับมากพอสำหรับการทดสอบแบบเลือกเปิดและการใช้งานภายใน
- รูปแบบการจัดเก็บ proposal, threshold ของ reviewer และ heuristic การจับข้อมูลสามารถเปลี่ยนแปลงได้
- การอนุมัติแบบ pending คือโหมดเริ่มต้นที่แนะนำ
- auto apply เหมาะสำหรับชุดติดตั้งส่วนตัว/ของ workspace ที่เชื่อถือได้ ไม่ใช่สำหรับสภาพแวดล้อมที่ใช้ร่วมกันหรือมีอินพุตจากแหล่งที่ไม่น่าเชื่อถือจำนวนมาก

## เปิดใช้งาน

คอนฟิกขั้นต่ำที่ปลอดภัย:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

เมื่อใช้คอนฟิกนี้:

- tool `skill_workshop` จะพร้อมใช้งาน
- คำแก้ไขที่นำกลับมาใช้ซ้ำได้แบบ explicit จะถูกเข้าคิวเป็น proposal ที่รอดำเนินการ
- reviewer แบบอิง threshold สามารถเสนอการอัปเดต Skill ได้
- จะยังไม่มีการเขียนไฟล์ Skill ใด ๆ จนกว่าจะมีการ apply proposal ที่รอดำเนินการ

ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้เท่านั้น:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` ยังคงใช้ scanner และเส้นทาง quarantine เดิม มัน
จะไม่ apply proposal ที่มี findings ระดับวิกฤต

## การตั้งค่า

| คีย์                 | ค่าเริ่มต้น | ช่วง / ค่า                                  | ความหมาย                                                            |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | เปิดใช้งาน Plugin หลังจากโหลด entry ของ Plugin แล้ว                 |
| `autoCapture`        | `true`      | boolean                                     | เปิดใช้การจับข้อมูล/ทบทวนหลัง turn สำหรับ turn ของเอเจนต์ที่สำเร็จ |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | เข้าคิว proposal หรือเขียน proposal ที่ปลอดภัยโดยอัตโนมัติ          |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | เลือกการจับคำแก้ไขแบบ explicit, reviewer แบบ LLM, ทั้งสองแบบ หรือไม่ใช้เลย |
| `reviewInterval`     | `15`        | `1..200`                                    | รัน reviewer หลังจาก successful turn จำนวนนี้                        |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | รัน reviewer หลังจากสังเกตเห็น tool call จำนวนนี้                  |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | timeout สำหรับการรัน reviewer แบบฝังตัว                            |
| `maxPending`         | `50`        | `1..200`                                    | จำนวน proposal แบบ pending/quarantined สูงสุดที่เก็บต่อ workspace   |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | ขนาดสูงสุดของไฟล์ skill/support ที่สร้างขึ้น                        |

โปรไฟล์ที่แนะนำ:

```json5
// Conservative: ใช้เฉพาะ tool แบบ explicit ไม่มีการจับข้อมูลอัตโนมัติ
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: จับข้อมูลอัตโนมัติ แต่ต้องได้รับการอนุมัติก่อน
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: เขียน proposal ที่ปลอดภัยทันที
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: ไม่มี reviewer แบบ LLM ใช้เฉพาะวลีแก้ไขแบบ explicit
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## เส้นทางการจับข้อมูล

Skill Workshop มีเส้นทางการจับข้อมูล 3 แบบ

### Tool Suggestions

โมเดลสามารถเรียก `skill_workshop` ได้โดยตรงเมื่อมันเห็นกระบวนการที่นำกลับมาใช้ซ้ำได้
หรือเมื่อผู้ใช้ขอให้บันทึก/อัปเดต Skill

นี่คือเส้นทางที่ explicit ที่สุด และทำงานได้แม้ตั้ง `autoCapture: false`

### Heuristic Capture

เมื่อเปิด `autoCapture` และ `reviewMode` เป็น `heuristic` หรือ `hybrid`,
Plugin จะสแกน turn ที่สำเร็จเพื่อหาวลีแก้ไขจากผู้ใช้อย่างชัดเจน:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

heuristic จะสร้าง proposal จากคำสั่งของผู้ใช้ล่าสุดที่ตรงกัน และ
ใช้ topic hint เพื่อเลือกชื่อ Skill สำหรับ workflow ที่พบบ่อย:

- งาน animated GIF -> `animated-gif-workflow`
- งาน screenshot หรือ asset -> `screenshot-asset-workflow`
- งาน QA หรือ scenario -> `qa-scenario-workflow`
- งาน GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

heuristic capture ถูกออกแบบให้แคบโดยตั้งใจ มันมีไว้สำหรับคำแก้ไขที่ชัดเจนและโน้ตกระบวนการที่ทำซ้ำได้ ไม่ใช่การสรุป transcript ทั่วไป

### LLM Reviewer

เมื่อเปิด `autoCapture` และ `reviewMode` เป็น `llm` หรือ `hybrid`, Plugin
จะรัน reviewer แบบฝังตัวขนาดกะทัดรัดเมื่อถึง threshold ที่กำหนด

reviewer จะได้รับ:

- ข้อความ transcript ล่าสุด โดยจำกัดไว้ที่ 12,000 อักขระสุดท้าย
- สูงสุด 12 Skills ที่มีอยู่ใน workspace
- สูงสุด 2,000 อักขระจากแต่ละ Skill ที่มีอยู่
- คำสั่งแบบ JSON-only

reviewer ไม่มี tool:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

มันสามารถส่งกลับได้ว่า:

```json
{ "action": "none" }
```

หรือ proposal ของ Skill หนึ่งรายการ:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

มันยังสามารถ append เข้ากับ Skill ที่มีอยู่แล้ว:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

หรือแทนที่ข้อความแบบตรงตัวใน Skill ที่มีอยู่:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

ให้เลือก `append` หรือ `replace` เมื่่อมี Skill ที่เกี่ยวข้องอยู่แล้ว ใช้ `create`
เฉพาะเมื่อไม่มี Skill ที่มีอยู่แล้วตัวใดเหมาะสม

## วงจรชีวิตของ proposal

ทุกการอัปเดตที่ถูกสร้างขึ้นจะกลายเป็น proposal ที่มี:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` แบบไม่บังคับ
- `sessionId` แบบไม่บังคับ
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` หรือ `reviewer`
- `status`
- `change`
- `scanFindings` แบบไม่บังคับ
- `quarantineReason` แบบไม่บังคับ

สถานะของ proposal:

- `pending` - รอการอนุมัติ
- `applied` - เขียนลง `<workspace>/skills` แล้ว
- `rejected` - ถูกปฏิเสธโดยผู้ปฏิบัติงาน/โมเดล
- `quarantined` - ถูกบล็อกเพราะ scanner พบประเด็นวิกฤต

state จะถูกเก็บแยกตาม workspace ภายใต้ไดเรกทอรี state ของ Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

proposal แบบ pending และ quarantined จะถูก dedupe ตามชื่อ Skill และ
payload ของการเปลี่ยนแปลง store จะเก็บ proposal แบบ pending/quarantined ที่ใหม่ที่สุดไว้
สูงสุดตาม `maxPending`

## เอกสารอ้างอิงของ tool

Plugin นี้ลงทะเบียน agent tool หนึ่งตัว:

```text
skill_workshop
```

### `status`

นับ proposal แยกตามสถานะสำหรับ workspace ที่ active อยู่

```json
{ "action": "status" }
```

รูปแบบผลลัพธ์:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

แสดงรายการ proposal ที่รอดำเนินการ

```json
{ "action": "list_pending" }
```

หากต้องการแสดงรายการสถานะอื่น:

```json
{ "action": "list_pending", "status": "applied" }
```

ค่า `status` ที่ใช้ได้:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

แสดงรายการ proposal ที่ถูกกักกัน

```json
{ "action": "list_quarantine" }
```

ใช้สิ่งนี้เมื่อดูเหมือนว่าการจับข้อมูลอัตโนมัติไม่ทำอะไร และ logs ระบุ
`skill-workshop: quarantined <skill>`

### `inspect`

ดึง proposal ตาม id

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

สร้าง proposal เมื่อใช้ `approvalPolicy: "pending"` มันจะเข้าคิวตามค่าเริ่มต้น

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

บังคับให้เขียนแบบปลอดภัย:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

บังคับให้เป็น pending แม้อยู่ใน `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

append เข้าส่วนหนึ่ง:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

แทนที่ข้อความแบบตรงตัว:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

apply proposal ที่รอดำเนินการ

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` จะปฏิเสธ proposal ที่ถูกกักกัน:

```text
quarantined proposal cannot be applied
```

### `reject`

ทำเครื่องหมาย proposal ว่าถูกปฏิเสธ

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

เขียนไฟล์สนับสนุนภายในไดเรกทอรีของ Skill ที่มีอยู่แล้วหรือที่ถูกเสนอไว้

ไดเรกทอรีสนับสนุนระดับบนสุดที่อนุญาต:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

ตัวอย่าง:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

ไฟล์สนับสนุนมีขอบเขตตาม workspace, มีการตรวจสอบพาธ, จำกัดขนาดไบต์ด้วย
`maxSkillBytes`, ถูกสแกน และถูกเขียนแบบ atomic

## การเขียน Skill

Skill Workshop จะเขียนเฉพาะภายใต้:

```text
<workspace>/skills/<normalized-skill-name>/
```

ชื่อ Skill จะถูก normalize ดังนี้:

- แปลงเป็นตัวพิมพ์เล็ก
- กลุ่มอักขระที่ไม่ใช่ `[a-z0-9_-]` จะถูกแทนเป็น `-`
- อักขระที่ไม่ใช่ตัวอักษรหรือตัวเลขที่อยู่ต้น/ท้ายจะถูกลบออก
- ความยาวสูงสุดคือ 80 อักขระ
- ชื่อสุดท้ายต้องตรงกับ `[a-z0-9][a-z0-9_-]{1,79}`

สำหรับ `create`:

- หากยังไม่มี Skill, Skill Workshop จะเขียน `SKILL.md` ใหม่
- หากมีอยู่แล้ว Skill Workshop จะ append เนื้อหาเข้าไปที่ `## Workflow`

สำหรับ `append`:

- หากมี Skill อยู่แล้ว Skill Workshop จะ append เข้าไปยังส่วนที่ร้องขอ
- หากยังไม่มีอยู่ Skill Workshop จะสร้าง Skill ขั้นต่ำก่อน แล้วจึง append

สำหรับ `replace`:

- Skill นั้นต้องมีอยู่แล้ว
- `oldText` ต้องมีอยู่ตรงกันแบบ exact
- จะมีการแทนที่เฉพาะการตรงกันแบบ exact ครั้งแรกเท่านั้น

การเขียนทั้งหมดเป็นแบบ atomic และรีเฟรชสแนปชอต Skills ใน memory ทันที ดังนั้น
Skill ใหม่หรือ Skill ที่อัปเดตแล้วจึงมองเห็นได้โดยไม่ต้องรีสตาร์ต Gateway

## โมเดลด้านความปลอดภัย

Skill Workshop มี scanner ด้านความปลอดภัยสำหรับเนื้อหา `SKILL.md` ที่สร้างขึ้นและ
ไฟล์สนับสนุน

finding ระดับวิกฤตจะกัก proposal ไว้:

| Rule id                                | บล็อกเนื้อหาที่...                                                  |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | บอกเอเจนต์ให้เพิกเฉยต่อคำสั่งก่อนหน้า/คำสั่งที่มีลำดับสูงกว่า      |
| `prompt-injection-system`              | อ้างอิง system prompt, developer message หรือคำสั่งที่ซ่อนอยู่       |
| `prompt-injection-tool`                | สนับสนุนให้ข้ามสิทธิ์/การอนุมัติของ tool                           |
| `shell-pipe-to-shell`                  | มี `curl`/`wget` ที่ pipe เข้า `sh`, `bash` หรือ `zsh`               |
| `secret-exfiltration`                  | ดูเหมือนส่งข้อมูล env/process env ออกผ่านเครือข่าย                 |

finding ระดับเตือนจะถูกเก็บไว้ แต่ไม่บล็อกด้วยตัวเอง:

| Rule id              | เตือนเมื่อ...                         |
| -------------------- | ------------------------------------ |
| `destructive-delete` | มีคำสั่งลักษณะ `rm -rf` แบบกว้าง     |
| `unsafe-permissions` | มีการใช้สิทธิ์ลักษณะ `chmod 777`     |

proposal ที่ถูกกักกัน:

- จะเก็บ `scanFindings`
- จะเก็บ `quarantineReason`
- จะปรากฏใน `list_quarantine`
- ไม่สามารถ apply ผ่าน `apply` ได้

หากต้องการกู้คืนจาก proposal ที่ถูกกักกัน ให้สร้าง proposal ใหม่ที่ปลอดภัยโดยลบ
เนื้อหาที่ไม่ปลอดภัยออก อย่าแก้ไข store JSON ด้วยมือ

## แนวทางของ prompt

เมื่อเปิดใช้งาน Skill Workshop จะ inject ส่วน prompt สั้น ๆ ที่บอกเอเจนต์
ให้ใช้ `skill_workshop` สำหรับหน่วยความจำเชิงกระบวนการที่คงทน

แนวทางนี้เน้น:

- กระบวนการ ไม่ใช่ข้อเท็จจริง/ความชอบ
- คำแก้ไขจากผู้ใช้
- กระบวนการที่สำเร็จและไม่ชัดเจนในตัวเอง
- ข้อผิดพลาดที่เกิดซ้ำ
- การซ่อม Skill ที่ล้าสมัย/บางเกินไป/ผิด ด้วย append/replace
- การบันทึกกระบวนการที่นำกลับมาใช้ซ้ำได้หลังจากลูปของ tool ที่ยาวหรือการแก้ไขที่ยาก
- ข้อความของ Skill ที่สั้นและเป็นคำสั่ง
- ไม่ใช่ transcript dump

ข้อความของโหมดการเขียนจะเปลี่ยนตาม `approvalPolicy`:

- โหมด pending: เข้าคิวข้อเสนอ; apply ได้ก็ต่อเมื่อมีการอนุมัติแบบ explicit
- โหมด auto: apply การอัปเดต Skill ของ workspace ที่ปลอดภัยเมื่อเห็นว่านำกลับมาใช้ซ้ำได้อย่างชัดเจน

## ต้นทุนและพฤติกรรมรันไทม์

heuristic capture ไม่เรียกใช้โมเดล

การทบทวนด้วย LLM ใช้การรันแบบฝังตัวบนโมเดลของเอเจนต์ที่ active/default มัน
อิงตาม threshold จึงไม่รันทุก turn ตามค่าเริ่มต้น

reviewer:

- ใช้บริบทของผู้ให้บริการ/โมเดลที่ตั้งค่าไว้แบบเดียวกันเมื่อมี
- fallback ไปยังค่าเริ่มต้นของเอเจนต์ในรันไทม์
- มี `reviewTimeoutMs`
- ใช้บริบท bootstrap แบบเบา
- ไม่มี tool
- ไม่เขียนอะไรโดยตรง
- ส่งออกได้เพียง proposal ที่จะผ่าน scanner ปกติและ
  เส้นทาง approval/quarantine

หาก reviewer ล้มเหลว หมดเวลา หรือส่งคืน JSON ที่ไม่ถูกต้อง Plugin จะบันทึก
ข้อความ warning/debug และข้ามรอบทบทวนนั้นไป

## รูปแบบการใช้งาน

ใช้ Skill Workshop เมื่อผู้ใช้พูดว่า:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

ข้อความ Skill ที่ดี:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

ข้อความ Skill ที่ไม่ดี:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

เหตุผลที่เวอร์ชันที่ไม่ดีไม่ควรถูกบันทึก:

- มีลักษณะเหมือน transcript
- ไม่เป็นเชิงคำสั่ง
- มีรายละเอียดแบบครั้งเดียวที่รบกวน
- ไม่ได้บอกเอเจนต์ตัวถัดไปว่าควรทำอะไร

## การดีบัก

ตรวจสอบว่า Plugin ถูกโหลดหรือไม่:

```bash
openclaw plugins list --enabled
```

ตรวจสอบจำนวน proposal จากบริบทของเอเจนต์/tool:

```json
{ "action": "status" }
```

ตรวจสอบ proposal ที่รอดำเนินการ:

```json
{ "action": "list_pending" }
```

ตรวจสอบ proposal ที่ถูกกักกัน:

```json
{ "action": "list_quarantine" }
```

อาการที่พบบ่อย:

| อาการ                                 | สาเหตุที่เป็นไปได้                                                                 | สิ่งที่ควรตรวจสอบ                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool ใช้งานไม่ได้                     | ไม่ได้เปิดใช้ entry ของ Plugin                                                     | `plugins.entries.skill-workshop.enabled` และ `openclaw plugins list` |
| ไม่มี proposal อัตโนมัติปรากฏ        | `autoCapture: false`, `reviewMode: "off"` หรือยังไม่ถึง threshold                  | คอนฟิก สถานะ proposal และ Gateway logs                              |
| heuristic ไม่จับข้อมูล                | ข้อความของผู้ใช้ไม่ตรงกับรูปแบบคำแก้ไข                                             | ใช้ `skill_workshop.suggest` แบบ explicit หรือเปิด reviewer แบบ LLM |
| reviewer ไม่สร้าง proposal            | reviewer ส่งกลับ `none`, JSON ไม่ถูกต้อง หรือหมดเวลา                               | Gateway logs, `reviewTimeoutMs`, threshold                           |
| proposal ไม่ถูก apply                 | `approvalPolicy: "pending"`                                                         | `list_pending` แล้วตามด้วย `apply`                                  |
| proposal หายจาก pending               | มีการใช้ proposal ซ้ำจาก dedupe, ถูก prune ตาม max pending หรือถูก apply/reject/quarantine | `status`, `list_pending` พร้อมตัวกรองสถานะ, `list_quarantine` |
| มีไฟล์ Skill อยู่แต่โมเดลมองไม่เห็น   | ไม่ได้รีเฟรชสแนปชอต Skill หรือมี gating ของ Skill ที่กันไว้                        | `openclaw skills` status และสิทธิ์การใช้งานของ Skill ใน workspace   |

log ที่เกี่ยวข้อง:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## สถานการณ์ QA

สถานการณ์ QA ที่อิงกับรีโป:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

รันความครอบคลุมแบบ deterministic:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

รันความครอบคลุมของ reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

สถานการณ์ reviewer ถูกแยกไว้โดยตั้งใจ เพราะมันเปิดใช้
`reviewMode: "llm"` และทดสอบรอบของ reviewer แบบฝังตัว

## เมื่อใดไม่ควรเปิด Auto Apply

ควรหลีกเลี่ยง `approvalPolicy: "auto"` เมื่อ:

- workspace มีขั้นตอนที่ละเอียดอ่อน
- เอเจนต์กำลังทำงานกับอินพุตที่ไม่น่าเชื่อถือ
- Skills ถูกแชร์ในทีมขนาดกว้าง
- คุณยังคงปรับจูน prompt หรือกฎของ scanner อยู่
- โมเดลต้องจัดการเนื้อหาเว็บ/อีเมลที่เป็นปรปักษ์บ่อยครั้ง

ให้ใช้โหมด pending ก่อน แล้วค่อยสลับไปใช้โหมด auto ก็ต่อเมื่อคุณได้ตรวจสอบแล้วว่า
ประเภทของ Skills ที่เอเจนต์เสนอใน workspace นั้นเหมาะสม

## เอกสารที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [Plugins](/th/tools/plugin)
- [Testing](/th/reference/test)
