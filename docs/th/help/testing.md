---
read_when:
    - การรันทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบป้องกันข้อผิดพลาดซ้ำสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T14:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# การทดสอบ

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุดตัวรัน Docker ขนาดเล็ก

เอกสารนี้เป็นคู่มือ “เราทดสอบกันอย่างไร”:

- แต่ละชุดทดสอบครอบคลุมอะไรบ้าง (และจงใจ _ไม่_ ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่มการทดสอบป้องกันข้อผิดพลาดซ้ำสำหรับปัญหาโมเดล/ผู้ให้บริการที่เกิดขึ้นจริง

## เริ่มต้นอย่างรวดเร็ว

โดยส่วนใหญ่ในแต่ละวัน:

- เกณฑ์ตรวจสอบแบบเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มแบบเร็วขึ้นในเครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- ลูปดูการเปลี่ยนแปลง Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์เป้าหมายโดยตรงตอนนี้รองรับเส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- หากคุณกำลังวนแก้ปัญหาความล้มเหลวเพียงรายการเดียว ให้เริ่มจากการรันแบบเจาะจงก่อน
- เว็บไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- เลน QA ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้องการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกณฑ์ตรวจสอบ coverage: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุดทดสอบ live (โพรบโมเดล + โพรบเครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การกวาดทดสอบโมเดล live บน Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้จะรันทั้งข้อความหนึ่งเทิร์นและโพรบขนาดเล็กแบบอ่านไฟล์
    โมเดลที่ข้อมูลเมทาดาทาประกาศว่ารองรับอินพุต `image` จะรันเทิร์นรูปภาพขนาดเล็กด้วย
    ปิดโพรบเพิ่มเติมเหล่านี้ได้ด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกปัญหาของผู้ให้บริการ
  - coverage ใน CI: งานประจำวัน `OpenClaw Scheduled Live And E2E Checks` และงานแบบสั่งเอง
    `OpenClaw Release Checks` ต่างก็เรียกใช้เวิร์กโฟลว์ live/E2E แบบใช้ซ้ำได้โดยกำหนด
    `include_live_suites: true` ซึ่งรวมงานเมทริกซ์ Docker live model แยกตามผู้ให้บริการ
  - สำหรับการรันซ้ำใน CI แบบเจาะจง ให้สั่ง `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่มีสัญญาณสูงรายการใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกใช้งาน
    แบบ scheduled/release ของมัน
- Moonshot/Kimi cost smoke: เมื่อกำหนด `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกเดี่ยวกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  บันทึก transcript ของ assistant เก็บ `usage.cost` ที่ถูกทำให้เป็นรูปแบบมาตรฐานแล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงเคสที่ล้มเหลวรายการเดียว ให้จำกัดการทดสอบ live ผ่านตัวแปร env แบบ allowlist ที่อธิบายด้านล่าง

## ตัวรันเฉพาะสำหรับ QA

คำสั่งเหล่านี้อยู่เคียงข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ `Parity gate` จะรันกับ PR ที่ตรงเงื่อนไขและ
จากการสั่งรันเองโดยใช้ผู้ให้บริการจำลอง `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจากการสั่งรันเองพร้อม mock parity gate, เลน Matrix แบบ live และเลน Telegram แบบ live ที่จัดการด้วย Convex เป็นงานขนาน `OpenClaw Release Checks`
จะรันเลนเดียวกันก่อนอนุมัติ release

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อ้างอิงจาก repo โดยตรงบนโฮสต์
  - โดยค่าเริ่มต้นจะรันหลายสถานการณ์ที่เลือกแบบขนานพร้อม worker ของ Gateway ที่แยกกัน
    `qa-channel` ใช้ค่า concurrency เริ่มต้นเป็น 4 (จำกัดตามจำนวนสถานการณ์ที่เลือก)
    ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` สำหรับเลนแบบอนุกรมเดิม
  - ออกจากโปรแกรมด้วยค่าไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อต้องการเก็บ artifact โดยไม่ให้ exit code ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` จะเริ่มเซิร์ฟเวอร์ผู้ให้บริการที่ใช้ AIMock ในเครื่องสำหรับ coverage เชิงทดลองด้านฟิกซ์เจอร์และโปรโตคอลจำลอง โดยไม่แทนที่เลน `mock-openai` ที่อิงสถานการณ์
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบชั่วคราว
  - ใช้พฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้แฟลกเลือกผู้ให้บริการ/โมเดลแบบเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ guest:
    คีย์ผู้ให้บริการแบบ env, พาธ config ผู้ให้บริการ live ของ QA และ `CODEX_HOME` หากมี
  - ไดเรกทอรีเอาต์พุตต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน workspace ที่เมานต์ไว้ได้
  - เขียนรายงาน QA + สรุปตามปกติ รวมถึงล็อกของ Multipass ลงใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มเว็บไซต์ QA ที่ใช้ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน Docker ทำ onboarding แบบไม่โต้ตอบด้วย OpenAI API key ตั้งค่า Telegram เป็นค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้งาน plugin จะติดตั้ง dependency รันไทม์ตามต้องการ รัน doctor และรันหนึ่งเทิร์นของเอเจนต์ในเครื่องกับ endpoint OpenAI แบบจำลอง
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลนติดตั้งแบบแพ็กเกจเดียวกันกับ Discord
- `pnpm test:docker:bundled-channel-deps`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม Gateway โดยตั้งค่า OpenAI แล้ว จากนั้นเปิดใช้งาน channel/plugin ที่มากับระบบผ่านการแก้ไข config
  - ตรวจสอบว่าการค้นหาการตั้งค่าไม่ทำให้มี dependency รันไทม์ของ plugin ที่ยังไม่ตั้งค่าอยู่ จากนั้นการรัน Gateway หรือ doctor ครั้งแรกหลังตั้งค่าจะติดตั้ง dependency รันไทม์ของแต่ละ bundled plugin ตามต้องการ และการรีสตาร์ตครั้งที่สองจะไม่ติดตั้ง dependency ซ้ำสำหรับรายการที่เปิดใช้งานไปแล้ว
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบแน่ชัด เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate ซ่อมแซม dependency รันไทม์ของ bundled channel ได้โดยไม่ต้องใช้การซ่อมแซม postinstall จากฝั่ง harness
- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ในเครื่องสำหรับ smoke test โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน Matrix QA แบบ live กับ Tuwunel homeserver แบบชั่วคราวที่ใช้ Docker
  - โฮสต์ QA นี้เป็นแบบ repo/dev-only ในปัจจุบัน การติดตั้ง OpenClaw แบบแพ็กเกจไม่มีการแจกจ่าย
    `qa-lab` จึงไม่เปิดให้ใช้ `openclaw qa`
  - checkout ของ repo จะโหลด bundled runner โดยตรง ไม่ต้องมีขั้นตอนติดตั้ง plugin แยก
  - จัดเตรียมผู้ใช้ Matrix ชั่วคราวสามราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง แล้วเริ่ม child ของ QA gateway โดยใช้ Matrix plugin จริงเป็นทรานสปอร์ตของ SUT
  - ใช้อิมเมจ Tuwunel เวอร์ชันเสถียรที่ปักหมุดไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` เป็นค่าเริ่มต้น ใช้ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อต้องการทดสอบอิมเมจอื่น
  - Matrix ไม่เปิดเผยแฟลกแหล่งข้อมูลรับรองแบบใช้ร่วมกัน เพราะเลนนี้จัดเตรียมผู้ใช้ชั่วคราวในเครื่องเอง
  - เขียนรายงาน Matrix QA, สรุป, artifact ของเหตุการณ์ที่สังเกตได้ และล็อกเอาต์พุต stdout/stderr แบบรวมลงใต้ `.artifacts/qa-e2e/...`
- `pnpm openclaw qa telegram`
  - รันเลน Telegram QA แบบ live กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอต driver และ SUT จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบใช้ร่วมกันที่รวมศูนย์ ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบรวมศูนย์
  - ออกจากโปรแกรมด้วยค่าไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อต้องการเก็บ artifact โดยไม่ให้ exit code ล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผย Telegram username
  - เพื่อให้การสังเกต bot-to-bot มีเสถียรภาพ ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบว่าบอต driver สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียนรายงาน Telegram QA, สรุป และ artifact ของข้อความที่สังเกตได้ลงใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT จากคำขอส่งของ driver ไปจนถึงการตอบกลับของ SUT ที่สังเกตได้

เลนทรานสปอร์ตแบบ live ใช้สัญญาร่วมมาตรฐานหนึ่งเดียวเพื่อไม่ให้ทรานสปอร์ตใหม่เบี่ยงเบนไป:

`qa-channel` ยังคงเป็นชุด QA แบบสังเคราะห์ที่ครอบคลุมกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ coverage ของทรานสปอร์ตแบบ live

| เลน     | Canary | Mention gating | บล็อก allowlist | การตอบกลับระดับบนสุด | กลับมาทำงานต่อหลังรีสตาร์ต | การติดตามในเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่ง help |
| -------- | ------ | -------------- | --------------- | --------------------- | --------------------------- | ---------------- | ----------- | ------------------- | ----------- |
| Matrix   | x      | x              | x               | x                     | x                           | x                | x           | x                   |             |
| Telegram | x      |                |                 |                       |                             |                  |             |                     | x           |

### ข้อมูลรับรอง Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` QA lab จะรับ lease แบบเอกสิทธิ์จากพูลที่ขับเคลื่อนด้วย Convex ส่ง Heartbeat
ให้ lease นั้นขณะเลนกำลังทำงาน และปล่อย lease เมื่อปิดระบบ

โครงสร้างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- หนึ่ง secret สำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, และ `maintainer` ในกรณีอื่น)

ตัวแปร env แบบเลือกได้:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบเลือกได้)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาตให้ใช้ URL Convex แบบ `http://` บน loopback สำหรับการพัฒนาในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งดูแลระบบสำหรับ maintainer (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

สัญญา endpoint ค่าเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - พูลหมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` แบบว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` แบบว่าง)
- `POST /admin/add` (สำหรับ maintainer secret เท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (สำหรับ maintainer secret เท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ยังใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (สำหรับ maintainer secret เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ไม่ถูกต้อง

### การเพิ่ม channel ลงใน QA

การเพิ่ม channel ลงในระบบ QA แบบ markdown ต้องมีอยู่เพียงสองอย่างเท่านั้น:

1. ตัวปรับแต่ง transport adapter สำหรับ channel
2. scenario pack ที่ทดสอบสัญญาของ channel

อย่าเพิ่ม command root ระดับบนสุดใหม่สำหรับ QA หากโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถ
เป็นเจ้าของโฟลว์นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- command root `openclaw qa`
- การเริ่มและปิด suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การรันสถานการณ์
- compatibility alias สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Runner plugins เป็นเจ้าของสัญญา transport:

- วิธีเมานต์ `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธี inject เหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcript และสถานะ transport ที่ทำให้เป็นมาตรฐานแล้ว
- วิธีรัน action ที่อิง transport
- วิธีจัดการ reset หรือ cleanup ที่เฉพาะกับ transport

เกณฑ์ขั้นต่ำสำหรับการรองรับ channel ใหม่คือ:

1. ให้ `qa-lab` ยังคงเป็นเจ้าของ root `qa` ที่ใช้ร่วมกัน
2. ติดตั้ง transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. ให้กลไกที่เฉพาะกับ transport อยู่ภายใน runner plugin หรือ channel harness
4. เมานต์ runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน
   Runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   ให้ `runtime-api.ts` มีขนาดเบา; การรัน CLI และ runner แบบ lazy ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ markdown ใต้ไดเรกทอรีตามธีมใน `qa/scenarios/`
6. ใช้ตัวช่วยสถานการณ์แบบ generic สำหรับสถานการณ์ใหม่
7. ให้ compatibility alias ที่มีอยู่ยังทำงานต่อไปได้ เว้นแต่ repo กำลังทำ migration อย่างตั้งใจ

กฎการตัดสินใจมีความเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้เพียงครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นอยู่กับ transport ของ channel เดียว ให้เก็บไว้ใน runner plugin หรือ plugin harness นั้น
- หากสถานการณ์ต้องใช้ capability ใหม่ที่มากกว่าหนึ่ง channel ใช้ได้ ให้เพิ่มตัวช่วยแบบ generic แทน branch เฉพาะ channel ใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้ทำให้สถานการณ์นั้นเฉพาะ transport และระบุให้ชัดเจนในสัญญาของสถานการณ์

ชื่อตัวช่วยแบบ generic ที่แนะนำสำหรับสถานการณ์ใหม่คือ:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

compatibility alias ยังคงพร้อมใช้สำหรับสถานการณ์ที่มีอยู่ รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งาน channel ใหม่ควรใช้ชื่อตัวช่วยแบบ generic
compatibility alias มีไว้เพื่อหลีกเลี่ยงการ migration แบบ flag day ไม่ใช่เป็นต้นแบบสำหรับ
การเขียนสถานการณ์ใหม่

## ชุดทดสอบ (อะไรถูกรันที่ไหน)

ให้มองชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ระบุเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย multi-project shards เป็น config แยกรายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: คลัง unit ของ core ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ node ใน `ui` ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบ unit แบบล้วน
  - การทดสอบ integration ภายในโปรเซส (gateway auth, routing, tooling, parsing, config)
  - การทดสอบป้องกันข้อผิดพลาดซ้ำแบบกำหนดผลได้แน่นอนสำหรับบั๊กที่ทราบแล้ว
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
- หมายเหตุเรื่อง Projects:
  - `pnpm test` ที่ไม่ระบุเป้าหมายตอนนี้รัน shard config ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนการใช้โปรเซส root-project แบบ native ขนาดใหญ่เพียงชุดเดียว วิธีนี้ลด peak RSS บนเครื่องที่มีโหลด และหลีกเลี่ยงไม่ให้งาน auto-reply/extension ไปแย่งทรัพยากรจากชุดอื่นที่ไม่เกี่ยวข้อง
  - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root `vitest.config.ts` แบบ native เพราะลูป watch แบบ multi-shard ไม่เหมาะสมในทางปฏิบัติ
  - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit ผ่าน scoped lanes ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะไม่ต้องเสียต้นทุนเริ่มต้นของ root project ทั้งชุด
  - `pnpm test:changed` จะขยายเส้นทาง git ที่เปลี่ยนเป็น scoped lanes เดียวกันเมื่อ diff แตะเฉพาะไฟล์ source/test ที่ route ได้สะอาด; การแก้ไข config/setup จะยัง fallback ไปยังการ rerun root-project แบบกว้าง
  - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานแคบ มันจะจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata และ tooling จากนั้นรัน lane typecheck/lint/test ที่ตรงกัน การเปลี่ยนแปลง public Plugin SDK และ plugin-contract จะรวมการตรวจสอบ extensions ด้วย เพราะ extensions พึ่งพาสัญญา core เหล่านั้น การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบ version/config/root-dependency แบบเจาะจง แทนการรันชุดเต็ม พร้อมตัวป้องกันที่ปฏิเสธการเปลี่ยนแปลง package นอกเหนือจากฟิลด์เวอร์ชันระดับบนสุด
  - การทดสอบ unit ที่ import เบาจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ utility ล้วนอื่นที่คล้ายกัน จะถูก route ผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือรันไทม์หนักจะยังอยู่ใน lane เดิม
  - ไฟล์ source helper บางรายการของ `plugin-sdk` และ `commands` ก็จับคู่การรันในโหมด changed ไปยังการทดสอบ sibling แบบ explicit ใน light lanes เดียวกันด้วย เพื่อให้การแก้ helper ไม่ต้อง rerun ชุดหนักทั้งชุดของไดเรกทอรีนั้น
  - ตอนนี้ `auto-reply` มีบัคเก็ตเฉพาะสามชุด: ตัวช่วย core ระดับบนสุด, การทดสอบ integration ของ `reply.*` ระดับบนสุด และ subtree `src/auto-reply/reply/**` วิธีนี้ทำให้งาน reply harness ที่หนักที่สุดไม่ไปอยู่รวมกับการทดสอบสถานะ/chunk/token ราคาถูก
- หมายเหตุเรื่อง Embedded runner:
  - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือบริบทรันไทม์ของ Compaction
    ให้รักษา coverage ทั้งสองระดับไว้
  - เพิ่มการทดสอบป้องกันข้อผิดพลาดซ้ำของ helper แบบเจาะจงสำหรับขอบเขต pure routing/normalization
  - และให้ integration suites ของ embedded runner ยังมีสภาพดีด้วย:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, และ
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
  - ชุดเหล่านั้นตรวจสอบว่า scoped id และพฤติกรรม Compaction ยังไหลผ่าน
    เส้นทาง `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะ helper อย่างเดียว
    ไม่เพียงพอที่จะใช้แทนเส้นทาง integration เหล่านั้น
- หมายเหตุเรื่อง Pool:
  - ตอนนี้ config พื้นฐานของ Vitest ใช้ค่าเริ่มต้นเป็น `threads`
  - shared Vitest config ยังกำหนด `isolate: false` แบบตายตัวและใช้ non-isolated runner ครอบคลุม root projects, e2e และ live configs
  - lane UI ระดับ root ยังคงการตั้งค่า `jsdom` และ optimizer ของตัวเอง แต่ตอนนี้รันบน shared non-isolated runner เช่นกัน
  - shard แต่ละชุดของ `pnpm test` รับค่าเริ่มต้น `threads` + `isolate: false` เดียวกันจาก shared Vitest config
  - ตอนนี้ตัว launcher `scripts/run-vitest.mjs` ที่ใช้ร่วมกันยังเพิ่ม `--no-maglev` ให้กับโปรเซส Node ลูกของ Vitest โดยค่าเริ่มต้นเพื่อลด V8 compile churn ระหว่างการรันขนาดใหญ่ในเครื่อง กำหนด `OPENCLAW_VITEST_ENABLE_MAGLEV=1` หากคุณต้องการเปรียบเทียบกับพฤติกรรม V8 ปกติ
- หมายเหตุเรื่องการวนทำงานแบบเร็วในเครื่อง:
  - `pnpm changed:lanes` แสดงว่า diff หนึ่งชุดกระตุ้น architectural lanes ใดบ้าง
  - pre-commit hook จะรัน `pnpm check:changed --staged` หลังจาก format/lint ไฟล์ staged แล้ว ดังนั้น commit ที่แตะเฉพาะ core จะไม่ต้องเสียต้นทุน extension tests เว้นแต่แตะสัญญาสาธารณะฝั่ง extension เวอร์ชัน commit ที่เป็น release metadata เท่านั้นจะอยู่ใน lane version/config/root-dependency แบบเจาะจง
  - หากชุดการเปลี่ยนแปลงแบบ staged เดิมถูกตรวจสอบแล้วด้วย gate ที่เทียบเท่าหรือเข้มกว่า ให้ใช้ `scripts/committer --fast "<message>" <files...>` เพื่อข้ามเฉพาะการ rerun changed-scope hook เท่านั้น staged format/lint จะยังรันอยู่ ระบุ gates ที่ทำเสร็จแล้วไว้ใน handoff ด้วย วิธีนี้ยอมรับได้เช่นกันหลัง rerun hook ที่ล้มเหลวแบบ flaky และผ่านแล้วพร้อมหลักฐานแบบเจาะจง
  - `pnpm test:changed` จะ route ผ่าน scoped lanes เมื่อเส้นทางที่เปลี่ยนจับคู่กับชุดที่เล็กกว่าได้อย่างชัดเจน
  - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการ route แบบเดิม เพียงแต่ใช้เพดาน worker ที่สูงกว่า
  - ตอนนี้การปรับขนาด worker อัตโนมัติในเครื่องตั้งใจให้ระมัดระวังมากขึ้น และยังถอยลงเมื่อค่าโหลดเฉลี่ยของโฮสต์สูงอยู่แล้ว เพื่อให้การรัน Vitest หลายชุดพร้อมกันสร้างผลเสียได้น้อยลงโดยค่าเริ่มต้น
  - config พื้นฐานของ Vitest ทำเครื่องหมายไฟล์ projects/config เป็น `forceRerunTriggers` เพื่อให้การ rerun โหมด changed ยังคงถูกต้องเมื่อ wiring ของการทดสอบเปลี่ยน
  - config ยังคงเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` บนโฮสต์ที่รองรับ; กำหนด `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการตำแหน่งแคชแบบ explicit เดียวสำหรับการทำ profiling โดยตรง
- หมายเหตุเรื่อง Perf-debug:
  - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อมเอาต์พุตการแยกรายละเอียด import
  - `pnpm test:perf:imports:changed` จำกัดมุมมองการทำ profiling แบบเดียวกันไปยังไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ `test:changed` ที่ถูก route แล้วกับเส้นทาง native root-project สำหรับ diff ที่ commit ไว้นั้น และพิมพ์ทั้ง wall time กับ macOS max RSS
- `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark กับ tree ปัจจุบันที่ยังไม่สะอาด โดย route รายการไฟล์ที่เปลี่ยนผ่าน `scripts/test-projects.mjs` และ root Vitest config
  - `pnpm test:perf:profile:main` จะเขียน main-thread CPU profile สำหรับ overhead ของการเริ่มต้น Vitest/Vite และการ transform
  - `pnpm test:perf:profile:runner` จะเขียนโปรไฟล์ CPU+heap ของ runner สำหรับชุด unit โดยปิด file parallelism

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริง โดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับ churn สังเคราะห์ของข้อความ gateway, memory และ payload ขนาดใหญ่ผ่านเส้นทางเหตุการณ์วินิจฉัย
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ stability bundle สำหรับ diagnostics
  - ยืนยันว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS แบบสังเคราะห์ยังต่ำกว่างบประมาณแรงกดดัน และความลึกคิวต่อเซสชันลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แคบสำหรับติดตาม stability regression ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ bundled-plugin E2E tests ใต้ `extensions/`
- ค่าเริ่มต้นของรันไทม์:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, ในเครื่อง: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบโดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุด 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway แบบหลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, การจับคู่ Node และ networking ที่หนักขึ้น
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกสภาพแวดล้อมบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบ OpenShell backend ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เปิดใช้เมื่อเลือกเท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี `openshell` CLI ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกสภาพแวดล้อม จากนั้นทำลาย test gateway และ sandbox
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าแบบแมนนวล
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ bundled-plugin live tests ใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?”
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ, ความแปลกของการเรียกใช้เครื่องมือ, ปัญหาการยืนยันตัวตน และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยตั้งใจแล้วไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, โควตา, การล่ม)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันแบบจำกัดขอบเขตแทนการรัน “ทั้งหมด”
- การรัน live จะโหลด `~/.profile` เพื่อดึง API key ที่ขาดหายไป
- โดยค่าเริ่มต้น การรัน live ยังคงแยก `HOME` และคัดลอกวัสดุ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture ของ unit ไปเปลี่ยน `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าโดยค่าเริ่มต้น: จะยังคงแสดงเอาต์พุตความคืบหน้า `[live] ...` แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และปิดเสียงล็อก bootstrap ของ gateway/Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการล็อกการเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override เฉพาะ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับการตอบกลับแบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ live suites จะส่งบรรทัดความคืบหน้าไปที่ stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้ Vitest console capture จะเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/gateway สตรีมออกทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดทดสอบใด?

ใช้ตารางการตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณแก้ไขจำนวนมาก)
- แตะ networking ของ gateway / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## Live: การกวาด capability ของ Android Node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ปัจจุบันถูกประกาศไว้** โดย Android Node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - การตั้งค่าเบื้องต้น/แมนนวล (ชุดนี้จะไม่ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ gateway ทีละคำสั่งสำหรับ Android Node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - ให้แอปอยู่ใน foreground
  - มอบสิทธิ์/ความยินยอมในการจับภาพสำหรับ capability ที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบเลือกได้:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## Live: model smoke (profile keys)

การทดสอบ live ถูกแบ่งเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้หรือไม่ด้วยคีย์ที่ให้มา
- “Gateway smoke” บอกเราว่าไปป์ไลน์ gateway+agent แบบเต็มทำงานสำหรับโมเดลนั้นหรือไม่ (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - ไล่ดูโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กต่อหนึ่งโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้งค่า `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, alias ของ modern) เพื่อรันชุดนี้จริง มิฉะนั้นจะข้ามเพื่อให้ `pnpm test:live` เน้นที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ modern allowlist
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist คั่นด้วย comma)
  - โดยค่าเริ่มต้น การกวาด modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้; ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาด modern แบบครบทั้งหมด หรือใช้เลขบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist คั่นด้วย comma)
- แหล่งที่มาของคีย์:
  - ค่าเริ่มต้น: profile store และ env fallbacks
  - ตั้งค่า `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ **profile store** เท่านั้น
- เหตุผลที่มีชุดนี้:
  - แยก “provider API พัง / คีย์ไม่ถูกต้อง” ออกจาก “ไปป์ไลน์ gateway agent พัง”
  - เก็บ regression ขนาดเล็กแบบแยกอิสระ (ตัวอย่าง: โฟลว์ reasoning replay + tool-call ของ OpenAI Responses/Codex Responses)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - หมุน gateway ภายในโปรเซสขึ้นมา
  - สร้าง/แพตช์ session `agent:dev:*` (override โมเดลต่อการรัน)
  - วนตาม models-with-keys และยืนยันว่า:
    - มีการตอบกลับที่ “มีความหมาย” (ไม่มี tools)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (read probe)
    - โพรบเครื่องมือเพิ่มเติมแบบเลือกได้ทำงานได้ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียดของโพรบ (เพื่อให้คุณอธิบายความล้มเหลวได้อย่างรวดเร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ใน workspace แล้วสั่งให้ agent `read` ไฟล์นั้นและสะท้อน nonce กลับมา
  - `exec+read` probe: การทดสอบจะสั่งให้ agent ใช้ `exec` เขียน nonce ลงไฟล์ชั่วคราว จากนั้น `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้นมา (แมว + โค้ดสุ่ม) และคาดหวังให้โมเดลตอบ `cat <CODE>`
  - อ้างอิงการติดตั้งใช้งาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ modern allowlist
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วย comma) เพื่อจำกัดขอบเขต
  - โดยค่าเริ่มต้น การกวาด gateway แบบ modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้; ตั้งค่า `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาด modern แบบครบทั้งหมด หรือใช้เลขบวกสำหรับเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter everything”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist คั่นด้วย comma)
- โพรบเครื่องมือ + รูปภาพเปิดใช้งานตลอดในการทดสอบ live นี้:
  - `read` probe + `exec+read` probe (stress เครื่องมือ)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับอินพุตรูปภาพ
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แปลง attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่งต่อข้อความผู้ใช้แบบหลายสื่อไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + โค้ดนั้น (ทนต่อ OCR: อนุญาตให้ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าคุณทดสอบอะไรได้บนเครื่องของคุณบ้าง (และ id แบบ `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLI ในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบไปป์ไลน์ Gateway + agent โดยใช้ CLI backend ในเครื่อง โดยไม่แตะ config ค่าเริ่มต้นของคุณ
- ค่าเริ่มต้น smoke เฉพาะ backend อยู่ใน `cli-backend.ts` ของ extension ที่เป็นเจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ plugin CLI backend ที่เป็นเจ้าของ
- การ override (เลือกได้):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (จะ inject path ลงในพรอมป์ต์)
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่ง path ไฟล์รูปภาพเป็น CLI args แทนการ inject ลงพรอมป์ต์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` เพื่อปิดโพรบความต่อเนื่องของเซสชันเดียวกันแบบ Claude Sonnet -> Opus ที่เปิดตามค่าเริ่มต้น (ตั้งเป็น `1` เพื่อบังคับเปิดเมื่อโมเดลที่เลือกมีเป้าหมายการสลับที่รองรับ)

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายในอิมเมจ Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension ที่เป็นเจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่านอย่างใดอย่างหนึ่งระหว่าง `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นมันจะพิสูจน์ว่า `claude -p` โดยตรงใน Docker ใช้งานได้ จากนั้นจึงรัน Gateway CLI-backend สองเทิร์นโดยไม่เก็บ env var ของ Anthropic API key ชุด subscription นี้ปิด Claude MCP/tool และ image probes โดยค่าเริ่มต้น เพราะตอนนี้ Claude route การใช้งานแอป third-party ผ่าน extra-usage billing แทนขีดจำกัดปกติของแผน subscription
- ตอนนี้ live CLI-backend smoke ทดสอบโฟลว์ end-to-end แบบเดียวกันสำหรับ Claude, Codex และ Gemini: เทิร์นข้อความ, เทิร์นจัดประเภทรูปภาพ และการเรียกใช้เครื่องมือ MCP `cron` ที่ตรวจสอบผ่าน gateway CLI
- smoke ค่าเริ่มต้นของ Claude ยังแพตช์ session จาก Sonnet ไป Opus และตรวจสอบว่า session ที่ resume แล้วยังจำโน้ตก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ bind การสนทนา ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนาช่องข้อความแบบสังเคราะห์เข้าที่เดิม
  - ส่งข้อความติดตามผลปกติบนการสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามผลไปถึง transcript ของเซสชัน ACP ที่ bind ไว้
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - channel แบบสังเคราะห์: บริบทการสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- การ override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- หมายเหตุ:
  - เลนนี้ใช้พื้นผิว `chat.send` ของ gateway ร่วมกับฟิลด์ originating-route แบบสังเคราะห์ที่ใช้ได้เฉพาะผู้ดูแล เพื่อให้การทดสอบแนบบริบท message-channel ได้โดยไม่ต้องแกล้งส่งออกจริง
  - เมื่อไม่ได้ตั้งค่า `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรีเอเจนต์ในตัวของ Plugin `acpx` แบบ embedded สำหรับ ACP harness agent ที่เลือก

ตัวอย่าง:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

สูตร Docker:

```bash
pnpm test:docker:live-acp-bind
```

สูตร Docker แบบเอเจนต์เดี่ยว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agents ที่รองรับทั้งหมดตามลำดับ: `claude`, `codex`, จากนั้น `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` เพื่อจำกัดเมทริกซ์
- มันจะโหลด `~/.profile`, จัดเตรียมวัสดุ auth ของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์, ติดตั้ง `acpx` ลงใน npm prefix ที่เขียนได้ จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) หากยังไม่มี
- ภายใน Docker ตัวรันจะตั้งค่า `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` เพื่อให้ acpx ยังเข้าถึง env var ของผู้ให้บริการจาก profile ที่โหลดไว้สำหรับ child harness CLI ได้

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่เป็นเจ้าของโดย plugin ผ่านเมธอด `agent` ของ gateway ตามปกติ:
  - โหลด Plugin `codex` ที่มากับระบบ
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `codex/gpt-5.4`
  - ส่ง turn ที่สองไปยัง OpenClaw session เดิมและตรวจสอบว่าเธรด app-server สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway เดียวกัน
  - เลือกรัน shell probes แบบยกระดับที่ผ่านการตรวจสอบโดย Guardian สองรายการ: คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรได้รับอนุมัติ และการอัปโหลด secret ปลอมหนึ่งรายการซึ่งควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `codex/gpt-5.4`
- image probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบเลือกได้: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ดังนั้น Codex
  harness ที่พังจะไม่สามารถผ่านได้ด้วยการ fallback ไปยัง Pi แบบเงียบ ๆ
- Auth: `OPENAI_API_KEY` จาก shell/profile พร้อมด้วย
  `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบเลือกได้

สูตรในเครื่อง:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตร Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มันจะโหลด `~/.profile` ที่ถูกเมานต์ไว้, ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI เมื่อมี, ติดตั้ง `@openai/codex` ลงใน npm prefix แบบเมานต์ที่เขียนได้, จัดเตรียม source tree จากนั้นรันเฉพาะการทดสอบ live ของ Codex-harness เท่านั้น
- Docker เปิด image, MCP/tool และ Guardian probes โดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการการรันดีบักที่แคบกว่า
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ให้ตรงกับ config ของ live
  test ดังนั้น fallback ไปยัง `openai-codex/*` หรือ Pi จะไม่สามารถซ่อน regression
  ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlist ที่แคบและ explicit เร็วที่สุดและ flaky น้อยที่สุด:

- โมเดลเดี่ยว, direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดี่ยว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือข้ามหลายผู้ให้บริการ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้สะพาน OAuth ของ Antigravity (endpoint ของเอเจนต์สไตล์ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (auth แยกต่างหาก + ความแปลกของ tooling)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่โฮสต์โดย Google ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw เรียกไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างออกไป (streaming/tool support/version skew)

## Live: model matrix (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลของ CI” แบบตายตัว (live เป็นแบบ opt-in) แต่ต่อไปนี้คือโมเดลที่ **แนะนำ**
ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มีคีย์

### ชุด smoke แบบ modern (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดหวังให้ยังทำงานได้:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.4` (เลือกได้: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### พื้นฐาน: การเรียกใช้เครื่องมือ (Read + Exec แบบเลือกได้)

เลือกอย่างน้อยหนึ่งรายการต่อ family ของผู้ให้บริการ:

- OpenAI: `openai/gpt-5.4` (หรือ `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

coverage เพิ่มเติมแบบเลือกได้ (มีก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “tools” สักตัวที่คุณเปิดใช้งานไว้)
- Cerebras: `cerebras/`… (หากคุณเข้าถึงได้)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียกใช้เครื่องมือขึ้นอยู่กับโหมด API)

### Vision: การส่งรูปภาพ (ไฟล์แนบ → ข้อความหลายสื่อ)

ใส่โมเดลที่รองรับรูปภาพอย่างน้อยหนึ่งรายการใน `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/ตัวแปร OpenAI ที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### ตัวรวม / gateway ทางเลือก

หากคุณเปิดใช้คีย์ไว้ เรารองรับการทดสอบผ่านสิ่งต่อไปนี้ด้วย:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถใส่ใน live matrix ได้ (หากมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (custom endpoints): `minimax` (cloud/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM ฯลฯ)

เคล็ดลับ: อย่าพยายามฮาร์ดโค้ด “ทุกโมเดล” ไว้ในเอกสาร รายการที่เป็นแหล่งอ้างอิงจริงคือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณ + คีย์ที่มีอยู่

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบ live ค้นหาข้อมูลรับรองแบบเดียวกับที่ CLI ทำ ผลในทางปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบ live ก็ควรหาคีย์เดียวกันได้
- หากการทดสอบ live บอกว่า “no creds” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth ต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ในการทดสอบ live)
- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะแบบ legacy: `~/.openclaw/credentials/` (ถูกคัดลอกเข้า staged live home เมื่อมี แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- โดยค่าเริ่มต้น การรัน live ในเครื่องจะคัดลอก config ที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` แบบ legacy และไดเรกทอรี auth ของ CLI ภายนอกที่รองรับไปยัง test home ชั่วคราว; staged live homes จะข้าม `workspace/` และ `sandboxes/` และลบการ override path ของ `agents.*.workspace` / `agentDir` เพื่อให้โพรบไม่แตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (สามารถเมานต์ `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียงเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- การ override โมเดลแบบเลือกได้: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง comfy image, video และ `music_generate` ที่มากับระบบ
  - ข้าม capability แต่ละรายการ เว้นแต่จะมีการตั้งค่า `models.providers.comfy.<capability>`
  - มีประโยชน์หลังจากเปลี่ยนการส่ง workflow ของ comfy, การ polling, การดาวน์โหลด หรือการลงทะเบียน Plugin

## Image generation live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ดู Plugin ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ทุกตัว
  - โหลด env var ของผู้ให้บริการที่ขาดหายจาก login shell ของคุณ (`~/.profile`) ก่อนทำโพรบ
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังค่า credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันตัวแปร image-generation มาตรฐานผ่าน capability รันไทม์ที่ใช้ร่วมกัน:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- ผู้ให้บริการแบบ bundled ที่ครอบคลุมในปัจจุบัน:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบเลือกได้:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- พฤติกรรม auth แบบเลือกได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และเพิกเฉยต่อ override ที่มาจาก env เท่านั้น

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env var ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำโพรบ
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังค่า credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันทั้งสองโหมดรันไทม์ที่ประกาศไว้เมื่อมี:
    - `generate` ด้วยอินพุตแบบ prompt-only
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - coverage ของ shared-lane ในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยกต่างหาก ไม่ใช่การกวาดร่วมนี้
- การจำกัดขอบเขตแบบเลือกได้:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- พฤติกรรม auth แบบเลือกได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และเพิกเฉยต่อ override ที่มาจาก env เท่านั้น

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบ bundled ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นใช้เส้นทาง smoke ที่ปลอดภัยสำหรับ release: ผู้ให้บริการที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งครั้งต่อผู้ให้บริการ, prompt ล็อบสเตอร์หนึ่งวินาที และเพดานเวลาต่อการดำเนินการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (ค่าเริ่มต้น `180000`)
  - ข้าม FAL โดยค่าเริ่มต้น เพราะเวลาแฝงจากคิวฝั่งผู้ให้บริการอาจครอบงำเวลาของ release; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันแบบ explicit
  - โหลด env var ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำโพรบ
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น ดังนั้นคีย์ทดสอบเก่าใน `auth-profiles.json` จะไม่บดบังค่า credentials จริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform mode ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพในเครื่องแบบ buffer-backed ในการกวาดร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องแบบ buffer-backed ในการกวาดร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ปัจจุบันประกาศไว้แต่ถูกข้ามในการกวาดร่วม:
    - `vydra` เพราะ `veo3` ที่มากับระบบรองรับเฉพาะข้อความ และ `kling` ที่มากับระบบต้องใช้ URL รูปภาพระยะไกล
  - coverage เฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน `veo3` แบบ text-to-video พร้อมเลน `kling` ที่ใช้ฟิกซ์เจอร์ URL รูปภาพระยะไกลโดยค่าเริ่มต้น
  - coverage `videoToVideo` แบบ live ในปัจจุบัน:
    - `runway` เท่านั้นเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ปัจจุบันประกาศไว้แต่ถูกข้ามในการกวาดร่วม:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ URL อ้างอิง `http(s)` / MP4 ระยะไกล
    - `google` เพราะเลน Gemini/Veo ร่วมปัจจุบันใช้อินพุตในเครื่องแบบ buffer-backed และเส้นทางนั้นไม่ถูกรับใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันยังไม่มีการรับประกันการเข้าถึง video inpaint/remix เฉพาะองค์กร
- การจำกัดขอบเขตแบบเลือกได้:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาต่อการดำเนินการของแต่ละผู้ให้บริการสำหรับ smoke run แบบเข้มข้น
- พฤติกรรม auth แบบเลือกได้:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และเพิกเฉยต่อ override ที่มาจาก env เท่านั้น

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รันชุด live ของ image, music และ video ที่ใช้ร่วมกันผ่าน entrypoint แบบเนทีฟของ repo เพียงจุดเดียว
  - โหลด env var ของผู้ให้บริการที่ขาดหายจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดแต่ละชุดไปยังผู้ให้บริการที่ปัจจุบันมี auth ที่ใช้ได้โดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และโหมดเงียบจึงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ตัวรัน Docker (ตัวเลือกสำหรับการตรวจสอบแบบ "ใช้งานได้บน Linux")

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ใช้ profile-key ซึ่งตรงกันภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ local config dir และ workspace ของคุณ (และโหลด `~/.profile` หากมีการเมานต์) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker live ใช้เพดาน smoke ที่เล็กลงโดยค่าเริ่มต้น เพื่อให้การกวาด Docker เต็มยังใช้งานได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override env var เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่าอย่างชัดเจน
- `test:docker:all` จะสร้างอิมเมจ Docker สำหรับ live หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นนำกลับมาใช้ซ้ำสำหรับเลน Docker live ทั้งสอง นอกจากนี้ยังสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันหนึ่งชุดผ่าน `test:docker:e2e-build` และนำกลับมาใช้ซ้ำสำหรับตัวรัน smoke ในคอนเทนเนอร์ E2E ที่ทดสอบแอปที่ build แล้ว
- ตัวรัน smoke ในคอนเทนเนอร์: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงหนึ่งหรือหลายตัว และตรวจสอบเส้นทาง integration ระดับสูงกว่า

ตัวรัน Docker สำหรับ live-model ยัง bind-mount เฉพาะ home auth ของ CLI ที่จำเป็นด้วย (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้า home ในคอนเทนเนอร์ก่อนรัน เพื่อให้ OAuth ของ CLI ภายนอกสามารถรีเฟรชโทเค็นได้โดยไม่แก้ไข auth store บนโฮสต์:

- Direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, scaffolding แบบเต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker ตั้งค่า OpenAI ผ่าน onboarding แบบอ้างอิง env พร้อม Telegram เป็นค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้งาน Plugin จะติดตั้ง runtime deps ตามต้องการ รัน doctor และรัน agent turn แบบ mocked OpenAI หนึ่งครั้ง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` regression แบบ minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) จะรันเซิร์ฟเวอร์ OpenAI แบบ mocked ผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของผู้ให้บริการปฏิเสธ และตรวจสอบว่ารายละเอียดดิบปรากฏในล็อกของ Gateway
- MCP channel bridge (Gateway ที่ seed แล้ว + stdio bridge + smoke ของ Claude notification-frame แบบดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (เซิร์ฟเวอร์ stdio MCP จริง + smoke allow/deny ของโปรไฟล์ Pi แบบ embedded): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การ cleanup MCP ของ Cron/subagent (Gateway จริง + การปิด child ของ stdio MCP หลังการรัน Cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke การติดตั้ง + alias `/plugin` + semantics การรีสตาร์ตของ Claude bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- smoke การอัปเดต Plugin ที่ไม่มีการเปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- smoke ของ metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- runtime deps ของ bundled plugin: `pnpm test:docker:bundled-channel-deps` จะสร้างอิมเมจตัวรัน Docker ขนาดเล็กโดยค่าเริ่มต้น build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้นเมานต์ tarball นั้นเข้าไปในแต่ละสถานการณ์การติดตั้งบน Linux ใช้อิมเมจเดิมซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ build บนโฮสต์หลังจาก build ในเครื่องใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่แล้วด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
- จำกัดขอบเขตการทดสอบ runtime deps ของ bundled plugin ระหว่างการวนแก้ไขได้โดยปิดสถานการณ์ที่ไม่เกี่ยวข้อง ตัวอย่างเช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ build และใช้อิมเมจ built-app ที่ใช้ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การ override อิมเมจเฉพาะชุด เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังมีผลเหนือกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจแบบแชร์บนรีโมต สคริปต์จะดึงอิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และตัวติดตั้งยังคงใช้ Dockerfile ของตัวเอง เพราะทดสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่รันไทม์ built-app ที่ใช้ร่วมกัน

ตัวรัน Docker สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบ read-only และ
จัดเตรียมลงใน workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจรันไทม์
มีขนาดเล็ก ขณะเดียวกันก็ยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอนจัดเตรียมจะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและเอาต์พุตการ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` หรือ
Gradle ที่เป็น local ของแอป เพื่อให้การรัน Docker live ไม่ต้องเสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
พวกมันยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้โพรบ live ของ gateway ไม่เริ่ม
worker ของ channel จริงอย่าง Telegram/Discord/etc. ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดขอบเขตหรือยกเว้น coverage ของ gateway
live จาก Docker lane นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ gateway ของ OpenClaw โดยเปิดใช้งาน OpenAI-compatible HTTP endpoints,
เริ่มคอนเทนเนอร์ Open WebUI ที่ปักหมุดเวอร์ชันไว้ให้ชี้ไปที่ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้องดึง
อิมเมจ Open WebUI และ Open WebUI เองอาจต้องทำ cold-start setup ให้เสร็จ
เลนนี้คาดหวังคีย์โมเดล live ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(ค่าเริ่มต้น `~/.profile`) คือวิธีหลักในการส่งมอบคีย์นั้นในการรันแบบ Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็กประมาณ `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้กำหนดผลได้แน่นอนโดยตั้งใจ และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway
ที่มี seed แล้ว เริ่มคอนเทนเนอร์ที่สองซึ่งสั่ง `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นหาการสนทนาแบบ routed, การอ่าน transcript, metadata ของไฟล์แนบ,
พฤติกรรมของคิวเหตุการณ์แบบ live, การกำหนดเส้นทางการส่งขาออก และการแจ้งเตือนแบบ channel +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจสอบการแจ้งเตือน
จะตรวจสอบเฟรม stdio MCP ดิบโดยตรง ดังนั้น smoke นี้จึงตรวจสอบสิ่งที่ bridge ส่งออกจริง
ไม่ใช่เพียงสิ่งที่ client SDK ตัวใดตัวหนึ่งบังเอิญแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` กำหนดผลได้แน่นอนและไม่ต้องใช้
คีย์โมเดล live มันสร้างอิมเมจ Docker ของ repo เริ่มเซิร์ฟเวอร์โพรบ stdio MCP จริง
ภายในคอนเทนเนอร์ ทำให้เซิร์ฟเวอร์นั้นใช้งานได้ผ่านรันไทม์ MCP ของ Pi bundle แบบ embedded
รัน tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงมี tools ของ
`bundle-mcp` ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` จะกรอง tools เหล่านั้นออก
`test:docker:cron-mcp-cleanup` กำหนดผลได้แน่นอนและไม่ต้องใช้คีย์โมเดล live
มันเริ่ม Gateway ที่มี seed แล้วพร้อมเซิร์ฟเวอร์โพรบ stdio MCP จริง รัน
Cron turn แบบแยก และ child turn แบบ one-shot ของ `/subagents spawn` จากนั้นตรวจสอบว่า
child process ของ MCP ปิดตัวหลังจบการรันแต่ละครั้ง

smoke ของเธรด ACP แบบ plain-language แบบแมนนวล (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจต้องใช้มันอีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบมัน

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) เมานต์ไปที่ `/home/node/.profile` และโหลดก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่โหลดจาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มีการเมานต์ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) เมานต์ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบมีแคชภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์แบบ read-only ใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันแบบจำกัดผู้ให้บริการจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override เองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่ซ้ำสำหรับการรันซ้ำที่ไม่ต้อง build ใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลรับรองมาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override พรอมป์ต์ตรวจ nonce ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override tag ของอิมเมจ Open WebUI ที่ปักหมุดไว้

## ความสมเหตุสมผลของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบออฟไลน์ (ปลอดภัยสำหรับ CI)

ต่อไปนี้คือ regression ของ “ไปป์ไลน์จริง” โดยไม่ใช้ผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือของ Gateway (mock OpenAI, gateway + agent loop จริง): `src/gateway/gateway.test.ts` (เคส: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, บังคับการเขียน config + auth): `src/gateway/gateway.test.ts` (เคส: "runs wizard over ws and writes auth token config")

## การประเมินความเชื่อถือได้ของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำหน้าที่คล้าย “การประเมินความเชื่อถือได้ของเอเจนต์”:

- การเรียกใช้เครื่องมือแบบ mock ผ่าน gateway + agent loop จริง (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบการเชื่อมต่อ session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการแสดง Skills ในพรอมป์ต์ เอเจนต์เลือก Skill ที่ถูกต้อง (หรือหลีกเลี่ยง Skill ที่ไม่เกี่ยวข้อง) หรือไม่
- **การปฏิบัติตาม:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่
- **สัญญาของเวิร์กโฟลว์:** สถานการณ์หลายเทิร์นที่ยืนยันลำดับเครื่องมือ การคงประวัติเซสชัน และขอบเขต sandbox

การประเมินในอนาคตควรยึดความกำหนดผลได้แน่นอนก่อน:

- scenario runner ที่ใช้ผู้ให้บริการจำลองเพื่อยืนยันการเรียกใช้เครื่องมือ + ลำดับ การอ่านไฟล์ Skill และการเชื่อมต่อ session
- ชุดสถานการณ์ขนาดเล็กที่โฟกัสเรื่อง Skill (ใช้หรือหลีกเลี่ยง, gating, prompt injection)
- การประเมินแบบ live (opt-in, ควบคุมด้วย env) เป็นทางเลือกเพิ่มเติมหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ plugin และ channel)

Contract tests ตรวจสอบว่า plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
interface contract ของตน พวกมันจะวนผ่าน plugin ที่ค้นพบทั้งหมดและรันชุดการยืนยัน
ด้านรูปร่างและพฤติกรรม เลน unit ของ `pnpm test` แบบค่าเริ่มต้นจงใจ
ข้ามไฟล์ seam และ smoke ที่ใช้ร่วมกันเหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิว channel หรือผู้ให้บริการที่ใช้ร่วมกัน

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ที่ `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ plugin (id, name, capabilities)
- **setup** - สัญญาของ setup wizard
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของ channel
- **threading** - การจัดการ thread ID
- **directory** - API ของ directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`

- **status** - โพรบสถานะของ channel
- **registry** - รูปร่างของรีจิสทรี Plugin

### Provider contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาของโฟลว์ auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API ของแค็ตตาล็อกโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - รันไทม์ของผู้ให้บริการ
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - setup wizard

### เมื่อใดควรรัน

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ปัญหาผู้ให้บริการ/โมเดลที่พบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub ผู้ให้บริการ หรือจับการแปลงรูปร่างคำขอที่แน่นอน)
- หากเป็นปัญหาที่เป็น live-only โดยเนื้อแท้ (rate limits, นโยบาย auth) ให้คงการทดสอบ live ไว้แบบแคบและ opt-in ผ่าน env vars
- ควรเล็งไปที่ชั้นที่เล็กที่สุดซึ่งจับบั๊กนั้นได้:
  - บั๊กการแปลง/replay คำขอของผู้ให้บริการ → direct models test
  - บั๊กไปป์ไลน์ session/history/tool ของ gateway → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- ราวป้องกันการไล่ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` สร้าง target ที่สุ่มตัวอย่างหนึ่งรายการต่อ SecretRef class จาก metadata ของรีจิสทรี (`listSecretTargetRegistryEntries()`), จากนั้นยืนยันว่า exec id ของ traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูลเป้าหมาย SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้ปรับปรุง `classifyTargetClass` ในการทดสอบนั้น การทดสอบถูกออกแบบให้ล้มเหลวโดยตั้งใจเมื่อพบ target id ที่ยังไม่ได้จัดหมวดหมู่ เพื่อไม่ให้คลาสใหม่ถูกข้ามไปอย่างเงียบ ๆ
