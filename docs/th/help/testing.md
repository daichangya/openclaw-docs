---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบป้องกันการถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker, และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T06:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e4eabad0d4b899569336aa3d895c7be178455c9ad93927cb627c66d0f3df21d
    source_path: help/testing.md
    workflow: 15
---

# การทดสอบ

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และมีตัวรัน Docker ขนาดเล็กอีกชุดหนึ่ง

เอกสารนี้เป็นคู่มือ “เราใช้วิธีทดสอบอย่างไร”:

- แต่ละชุดครอบคลุมอะไรบ้าง (และมีสิ่งใดที่ตั้งใจ _ไม่_ ครอบคลุม)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบแบบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่มการทดสอบป้องกันการถดถอยสำหรับปัญหาโมเดล/ผู้ให้บริการที่เกิดขึ้นจริง

## เริ่มต้นอย่างรวดเร็ว

ในวันที่ใช้งานทั่วไป:

- ด่านตรวจสอบเต็มรูปแบบ (คาดหวังให้รันก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันทั้งชุดที่เร็วขึ้นในเครื่องบนเครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- วนรอบ watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์เป้าหมายโดยตรงตอนนี้รองรับเส้นทาง extension/channel แล้วด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังทำซ้ำกับความล้มเหลวเพียงรายการเดียว
- ไซต์ QA ที่ทำงานผ่าน Docker: `pnpm qa:lab:up`
- เลน QA ที่ทำงานผ่าน Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้องการทดสอบหรือต้องการความมั่นใจเพิ่มเติม:

- ด่าน coverage: `pnpm test:coverage`
- ชุด e2e: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (โมเดล + การตรวจสอบเครื่องมือ/ภาพของ Gateway): `pnpm test:live`
- เจาะจงไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การทดสอบ smoke เรื่องต้นทุนของ Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกเดี่ยวกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  ทรานสคริปต์ของผู้ช่วยเก็บ `usage.cost` ที่ถูกทำให้เป็นมาตรฐานแล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวกรณีเดียว ให้จำกัดขอบเขตการทดสอบ live ด้วยตัวแปร env allowlist ที่อธิบายไว้ด้านล่าง

## ตัวรันเฉพาะสำหรับ QA

คำสั่งเหล่านี้อยู่คู่กับชุดทดสอบหลักเมื่อคุณต้องการความสมจริงในระดับ QA-lab:

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ `Parity gate` จะรันกับ PR ที่ตรงเงื่อนไขและ
จาก manual dispatch โดยใช้ผู้ให้บริการจำลอง `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, เลน live Matrix และ
เลน live Telegram ที่จัดการโดย Convex เป็นงานแบบขนาน `OpenClaw Release Checks`
รันเลนเดียวกันนี้ก่อนอนุมัติรีลีส

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิงกับรีโปโดยตรงบนโฮสต์
  - โดยปกติจะรันหลายสถานการณ์ที่เลือกแบบขนานด้วย worker ของ Gateway ที่แยกออกจากกัน `qa-channel` มีค่าเริ่มต้นของ concurrency เป็น 4 (ถูกจำกัดโดยจำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` สำหรับเลนแบบลำดับเดิม
  - ออกจากโปรแกรมด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` จะเริ่มเซิร์ฟเวอร์ผู้ให้บริการที่ทำงานด้วย AIMock ในเครื่องสำหรับการครอบคลุมแบบ experimental ของฟิกซ์เจอร์และ protocol-mock โดยไม่แทนที่เลน `mock-openai` ที่รับรู้สถานการณ์
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้แฟลกการเลือกผู้ให้บริการ/โมเดลแบบเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่ออินพุตการยืนยันตัวตนของ QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ guest:
    คีย์ผู้ให้บริการแบบอิง env, พาธคอนฟิกผู้ให้บริการ live ของ QA และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรีเอาต์พุตต้องอยู่ภายใต้รากรีโปเพื่อให้ guest เขียนกลับผ่าน
    เวิร์กสเปซที่ถูก mount ได้
  - เขียนรายงาน QA + สรุปผลตามปกติ รวมถึงล็อกของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่ทำงานผ่าน Docker สำหรับงาน QA ในลักษณะผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker ทำ onboarding แบบไม่โต้ตอบด้วย OpenAI API key ตั้งค่า Telegram
    เป็นค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้งาน plugin จะติดตั้ง runtime dependencies ตามต้องการ เรียก doctor และรันหนึ่งเทิร์นของเอเจนต์ในเครื่องกับ OpenAI endpoint แบบจำลอง
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลนการติดตั้งแบบแพ็กเกจเดียวกัน
    กับ Discord
- `pnpm test:docker:bundled-channel-deps`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม
    Gateway โดยตั้งค่า OpenAI แล้ว จากนั้นเปิดใช้งาน channel/plugin ที่ bundle มาโดยแก้ไขคอนฟิก
  - ตรวจสอบว่าการค้นพบการตั้งค่าไม่ทำให้ runtime dependencies ของ plugin ที่ยังไม่ตั้งค่าปรากฏอยู่ และเมื่อรัน Gateway หรือ doctor ครั้งแรกหลังตั้งค่าแล้ว จะติดตั้ง runtime dependencies ของ plugin ที่ bundle มาแต่ละตัวตามต้องการ และการรีสตาร์ตครั้งที่สองจะไม่ติดตั้ง dependencies ซ้ำที่ถูกเปิดใช้งานไปแล้ว
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบค่า เปิดใช้งาน Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ซ่อมแซม runtime dependencies ของ channel ที่ bundle มาโดยไม่ต้องมีการซ่อม postinstall จากฝั่ง harness
- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ในเครื่องสำหรับการทดสอบ smoke ของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA แบบ live ของ Matrix กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่ทำงานผ่าน Docker
  - โฮสต์ QA นี้ปัจจุบันใช้สำหรับรีโป/การพัฒนาเท่านั้น การติดตั้ง OpenClaw แบบแพ็กเกจไม่ได้รวม `qa-lab` มาด้วย ดังนั้นจึงไม่เปิดให้ใช้ `openclaw qa`
  - checkout ของรีโปจะโหลด bundled runner โดยตรง ไม่ต้องมีขั้นตอนติดตั้ง Plugin แยก
  - จัดเตรียมผู้ใช้ Matrix ชั่วคราวสามราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง จากนั้นเริ่ม child ของ QA gateway ที่ใช้ Matrix plugin จริงเป็นการขนส่งของ SUT
  - โดยค่าเริ่มต้นจะใช้ image Tuwunel รุ่นเสถียรที่ตรึงไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` แทนที่ได้ด้วย `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อต้องการทดสอบ image อื่น
  - Matrix ไม่เปิดเผยแฟลกแหล่งข้อมูลรับรองแบบใช้ร่วมกัน เพราะเลนนี้จัดเตรียมผู้ใช้แบบใช้แล้วทิ้งในเครื่อง
  - เขียนรายงาน Matrix QA, สรุปผล, observed-events artifact และล็อกเอาต์พุต stdout/stderr แบบรวมไว้ใต้ `.artifacts/qa-e2e/...`
- `pnpm openclaw qa telegram`
  - รันเลน QA แบบ live ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้โทเค็นบอตของ driver และ SUT จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น chat id แบบตัวเลขของ Telegram
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบพูลที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้การเช่าแบบพูล
  - ออกจากโปรแกรมด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อให้การสังเกตระหว่างบอตมีเสถียรภาพ ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบให้แน่ใจว่าบอต driver สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียนรายงาน Telegram QA, สรุปผล และ observed-messages artifact ไว้ใต้ `.artifacts/qa-e2e/...`

เลนการขนส่งแบบ live ใช้สัญญามาตรฐานร่วมกันหนึ่งชุด เพื่อให้การขนส่งใหม่ไม่เบี่ยงเบน:

`qa-channel` ยังคงเป็นชุด QA เชิงสังเคราะห์แบบกว้าง และไม่ใช่ส่วนหนึ่งของเมทริกซ์การครอบคลุมการขนส่งแบบ live

| เลน | Canary | Mention gating | บล็อก Allowlist | การตอบกลับระดับบนสุด | การกลับมาทำงานต่อหลังรีสตาร์ต | การติดตามต่อในเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่งช่วยเหลือ |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### ข้อมูลรับรอง Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` QA lab จะขอเช่าแบบ exclusive จากพูลที่ทำงานด้วย Convex, ส่ง Heartbeat
ให้ lease นั้นขณะเลนกำลังรันอยู่ และปล่อย lease เมื่อปิดระบบ

สเกฟโฟลด์โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- ซีเคร็ตหนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นผ่าน env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, และเป็น `maintainer` ในกรณีอื่น)

ตัวแปร env แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ `http://` บน loopback สำหรับการพัฒนาในเครื่องเท่านั้น

โดยปกติ `OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://`

คำสั่งผู้ดูแลระบบสำหรับ maintainer (เพิ่ม/ลบ/แสดงรายการในพูล) จำเป็นต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `--json` เพื่อให้ได้เอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตีของ CI

สัญญา endpoint ค่าเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - หมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` แบบว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` แบบว่าง)
- `POST /admin/add` (ใช้ได้เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ใช้ได้เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - การป้องกัน lease ที่ยังใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ใช้ได้เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง chat id แบบตัวเลขของ Telegram
- `admin/add` จะตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ไม่ถูกต้อง

### การเพิ่ม channel ลงใน QA

การเพิ่ม channel ลงในระบบ QA แบบ markdown ต้องมีเพียงสองอย่างเท่านั้น:

1. transport adapter สำหรับ channel
2. scenario pack ที่ทดสอบสัญญาของ channel

อย่าเพิ่มรากคำสั่ง QA ระดับบนสุดใหม่ เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถ
เป็นเจ้าของโฟลว์นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- รากคำสั่ง `openclaw qa`
- การเริ่มต้นและปิดชุดทดสอบ
- concurrency ของ worker
- การเขียน artifacts
- การสร้างรายงาน
- การรันสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` แบบเก่า

Runner plugins เป็นเจ้าของสัญญาการขนส่ง:

- วิธีที่ `openclaw qa <runner>` ถูกเมานต์ไว้ภายใต้ราก `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า Gateway สำหรับการขนส่งนั้น
- วิธีตรวจสอบความพร้อม
- วิธีฉีดเหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผยทรานสคริปต์และสถานะการขนส่งที่ทำให้เป็นมาตรฐานแล้ว
- วิธีรันการดำเนินการที่มีการขนส่งรองรับ
- วิธีจัดการการรีเซ็ตหรือการล้างข้อมูลเฉพาะของการขนส่ง

เกณฑ์ขั้นต่ำสำหรับการรองรับ channel ใหม่คือ:

1. ให้ `qa-lab` ยังคงเป็นเจ้าของราก `qa` ที่ใช้ร่วมกัน
2. ติดตั้ง transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะการขนส่งไว้ภายใน runner plugin หรือ channel harness
4. เมานต์ runner เป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่งรากที่แข่งขันกัน
   Runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   ให้ `runtime-api.ts` มีขนาดเบา; การทำ CLI และการรัน runner แบบ lazy ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์แบบ markdown ภายใต้ไดเรกทอรีตามธีม `qa/scenarios/`
6. ใช้ตัวช่วยสถานการณ์แบบ generic สำหรับสถานการณ์ใหม่
7. รักษา compatibility alias ที่มีอยู่ให้ยังทำงานได้ เว้นแต่รีโปกำลังทำ migration แบบตั้งใจ

กฎการตัดสินใจมีความเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้เพียงครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับการขนส่งของ channel ใด channel หนึ่ง ให้เก็บไว้ใน runner plugin หรือ plugin harness นั้น
- หากสถานการณ์ต้องการ capability ใหม่ที่มากกว่าหนึ่ง channel สามารถใช้ได้ ให้เพิ่มตัวช่วยแบบ generic แทนการเพิ่ม branch เฉพาะ channel ใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับการขนส่งเดียว ให้เก็บสถานการณ์นั้นให้เฉพาะการขนส่ง และระบุให้ชัดเจนใน scenario contract

ชื่อตัวช่วยแบบ generic ที่ควรใช้สำหรับสถานการณ์ใหม่คือ:

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

Compatibility alias ยังคงพร้อมใช้งานสำหรับสถานการณ์เดิม รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งาน channel ใหม่ควรใช้ชื่อตัวช่วยแบบ generic
Compatibility alias มีไว้เพื่อหลีกเลี่ยงการย้ายแบบ flag day ไม่ใช่เป็นต้นแบบสำหรับ
การเขียนสถานการณ์ใหม่

## ชุดทดสอบ (สิ่งที่รันที่ไหน)

ให้มองชุดทดสอบเหล่านี้ว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (และเพิ่มความเปราะบาง/ต้นทุน):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- คอนฟิก: การรัน shard แบบลำดับต่อเนื่องสิบชุด (`vitest.full-*.config.ts`) บน Vitest projects แบบแบ่งขอบเขตที่มีอยู่
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ `ui` ฝั่ง node ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบ unit แบบล้วน
  - การทดสอบ integration ภายในโปรเซส (การยืนยันตัวตนของ gateway, routing, tooling, parsing, config)
  - การทดสอบป้องกันการถดถอยแบบ deterministic สำหรับบั๊กที่ทราบแล้ว
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
- หมายเหตุเรื่อง Projects:
  - `pnpm test` แบบไม่เจาะจงตอนนี้รัน shard config ขนาดเล็กสิบเอ็ดชุด (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนโปรเซส root-project ดั้งเดิมขนาดใหญ่เพียงตัวเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และหลีกเลี่ยงไม่ให้งาน auto-reply/extension ไปแย่งทรัพยากรจากชุดที่ไม่เกี่ยวข้อง
  - `pnpm test --watch` ยังคงใช้กราฟ project ของ root `vitest.config.ts` แบบดั้งเดิม เพราะลูป watch แบบหลาย shard ใช้งานจริงได้ไม่สะดวก
  - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่ง file/directory target แบบ explicit ผ่าน scoped lane ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องเสียภาษี startup ของ root project เต็มชุด
  - `pnpm test:changed` จะขยายเส้นทาง git ที่เปลี่ยนแปลงไปยัง scoped lane เดียวกัน เมื่อ diff แตะเฉพาะไฟล์ source/test ที่ route ได้อย่างชัดเจน; การแก้ config/setup จะยัง fallback ไปยังการ rerun แบบ broad root-project
  - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานที่มีขอบเขตแคบ โดยจะจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, metadata ของ release และ tooling จากนั้นรัน typecheck/lint/test lane ที่ตรงกัน การเปลี่ยนแปลงใน public Plugin SDK และ plugin-contract จะรวมการตรวจสอบ extensions ด้วย เพราะ extensions พึ่งพา core contracts เหล่านั้น การ bump version ที่มีเฉพาะ release metadata จะรัน targeted version/config/root-dependency checks แทน full suite พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลงแพ็กเกจนอกเหนือจาก top-level version field
  - การทดสอบ unit ที่ import น้อยจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ utility แบบล้วนที่คล้ายกัน จะถูกส่งผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy จะยังอยู่ใน lane เดิม
  - source file ตัวช่วยบางส่วนของ `plugin-sdk` และ `commands` ยังแมปการรันใน changed-mode ไปยัง sibling tests แบบ explicit ใน light lane เหล่านั้นด้วย ดังนั้นการแก้ helper จึงไม่ต้อง rerun ชุดหนักเต็มรูปแบบของไดเรกทอรีนั้น
  - ตอนนี้ `auto-reply` มี bucket เฉพาะสามชุด: top-level core helpers, การทดสอบ integration `reply.*` ระดับบนสุด และ subtree `src/auto-reply/reply/**` วิธีนี้ช่วยให้งาน harness ของ reply ที่หนักที่สุดไม่ไปรบกวนการทดสอบ status/chunk/token ราคาถูก
- หมายเหตุเรื่อง Embedded runner:
  - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือ runtime context ของ Compaction
    ให้คงการครอบคลุมทั้งสองระดับไว้
  - เพิ่มการทดสอบป้องกันการถดถอยของ helper แบบเจาะจงสำหรับ boundary การ routing/normalization แบบล้วน
  - และต้องรักษาชุด integration ของ embedded runner ให้สมบูรณ์ด้วย:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
  - ชุดเหล่านี้ตรวจสอบว่า scoped id และพฤติกรรมของ Compaction ยังคงไหลผ่าน
    เส้นทาง `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะ helper อย่างเดียว
    ไม่เพียงพอที่จะทดแทนเส้นทาง integration เหล่านี้
- หมายเหตุเรื่อง Pool:
  - ตอนนี้คอนฟิก Vitest พื้นฐานมีค่าเริ่มต้นเป็น `threads`
  - คอนฟิก Vitest ที่ใช้ร่วมกันยังตรึง `isolate: false` และใช้ runner แบบไม่แยก isolation กับ root projects, e2e และ live configs
  - root UI lane ยังคงใช้การตั้งค่าและ optimizer ของ `jsdom` แต่ตอนนี้ก็รันบน runner แบบไม่แยก isolation ที่ใช้ร่วมกันด้วย
  - shard แต่ละชุดของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false` เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
  - ตอนนี้ตัว launcher `scripts/run-vitest.mjs` ที่ใช้ร่วมกันยังเพิ่ม `--no-maglev` สำหรับโปรเซส Node ลูกของ Vitest โดยค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่ ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` หากต้องการเปรียบเทียบกับพฤติกรรม V8 มาตรฐาน
- หมายเหตุเรื่องการวนซ้ำในเครื่องแบบเร็ว:
  - `pnpm changed:lanes` จะแสดงว่า diff หนึ่งกระตุ้น architectural lane ใดบ้าง
  - pre-commit hook จะรัน `pnpm check:changed --staged` หลังการจัดรูปแบบ/lint ของ staged files ดังนั้น commit ที่แตะเฉพาะ core จะไม่ต้องเสียต้นทุนการทดสอบ extension เว้นแต่จะแตะ public contract ที่ extension ใช้งาน Release metadata-only commit จะยังอยู่ใน targeted version/config/root-dependency lane
  - หากชุดการเปลี่ยนแปลง staged เดียวกันนั้นถูกตรวจสอบแล้วด้วย gate ที่เทียบเท่าหรือเข้มกว่า ให้ใช้ `scripts/committer --fast "<message>" <files...>` เพื่อข้ามเฉพาะการ rerun ของ changed-scope hook เท่านั้น staged format/lint ยังรันอยู่ ระบุ gate ที่ทำเสร็จแล้วใน handoff ของคุณด้วย วิธีนี้ยอมรับได้เช่นกันหลัง rerun isolated flaky hook failure แล้วผ่านพร้อมหลักฐานแบบมีขอบเขต
  - `pnpm test:changed` จะ route ผ่าน scoped lane เมื่อเส้นทางที่เปลี่ยนแปลงแมปได้สะอาดกับชุดทดสอบที่เล็กกว่า
  - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing เดียวกัน เพียงแต่มีเพดาน worker สูงกว่า
  - ตอนนี้การปรับขนาด worker อัตโนมัติในเครื่องมีแนวทางที่อนุรักษ์นิยมโดยตั้งใจ และยังลดลงเมื่อ host load average สูงอยู่แล้วด้วย ดังนั้นการรัน Vitest หลายชุดพร้อมกันจะส่งผลเสียลดลงโดยค่าเริ่มต้น
  - คอนฟิก Vitest พื้นฐานทำเครื่องหมายไฟล์ projects/config เป็น `forceRerunTriggers` เพื่อให้ rerun ใน changed-mode ยังถูกต้องเมื่อ wiring ของการทดสอบเปลี่ยนไป
  - คอนฟิกจะเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บนโฮสต์ที่รองรับ; ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการตำแหน่งแคชแบบ explicit เพียงจุดเดียวสำหรับการทำ profiling โดยตรง
- หมายเหตุเรื่องการดีบักประสิทธิภาพ:
  - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อมเอาต์พุต import-breakdown
  - `pnpm test:perf:imports:changed` จำกัดมุมมองการ profiling เดียวกันไปยังไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ `test:changed` แบบ routed กับเส้นทาง root-project ดั้งเดิมสำหรับ diff ที่ commit นั้น และพิมพ์ทั้ง wall time และ macOS max RSS
- `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark กับ dirty tree ปัจจุบันโดย route รายการไฟล์ที่เปลี่ยนผ่าน `scripts/test-projects.mjs` และ root Vitest config
  - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ overhead ของการเริ่มต้นและ transform ของ Vitest/Vite
  - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับชุด unit โดยปิด file parallelism

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ local loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ป้อน message, memory และ churn ของ large-payload แบบสังเคราะห์ผ่านเส้นทางเหตุการณ์ diagnostic ของ gateway
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper สำหรับการคงอยู่ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS แบบสังเคราะห์ยังต่ำกว่างบประมาณแรงกดดัน และความลึกของ queue ต่อ session ลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แบบแคบสำหรับติดตาม regression ด้านเสถียรภาพ ไม่ใช่ตัวแทนของ Gateway suite เต็มรูปแบบ

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` กับ `isolate: false` เหมือนกับส่วนอื่นของรีโป
  - ใช้ worker แบบปรับได้อัตโนมัติ (CI: สูงสุด 2, ในเครื่อง: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบเป็นค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรมแบบ end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, การจับคู่ Node และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนประกอบเคลื่อนไหวมากกว่าการทดสอบ unit (จึงอาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `test/openshell-sandbox.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกขาดบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบ OpenShell backend ของ OpenClaw ผ่าน `sandbox ssh-config` + การรัน SSH จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้องเลือกใช้เองเท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ทำงานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกขาด แล้วจึงทำลาย test gateway และ sandbox
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดการทดสอบนี้เมื่อรัน e2e suite ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ยังใช้งานได้จริง _ในวันนี้_ พร้อมข้อมูลรับรองจริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ, ความแปลกของการเรียกใช้เครื่องมือ, ปัญหาการยืนยันตัวตน และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยออกแบบมาแล้วไม่เสถียรใน CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, quota, การล่ม)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเป็นชุดย่อยที่จำกัดขอบเขต แทนที่จะรัน “ทั้งหมด”
- การรันแบบ live จะ source `~/.profile` เพื่อดึง API key ที่ขาดหายไป
- โดยค่าเริ่มต้น การรันแบบ live ยังคงแยก `HOME` และคัดลอก material ของ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ฟิกซ์เจอร์ unit ไปแก้ไข `~/.openclaw` จริงของคุณ
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้โฮมไดเรกทอรีจริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: ยังเก็บเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และปิดเสียงล็อก bootstrap ของ gateway/Bonjour ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการเปิดล็อกเริ่มต้นทั้งหมดกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อเจอการตอบกลับแบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ live suites จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้ Vitest จะจับ console แบบเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าจากผู้ให้บริการ/gateway ถูกสตรีมทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ได้ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ได้ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดไหน?

ใช้ตารางการตัดสินใจนี้:

- แก้ไขตรรกะ/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณแก้ไขไปมาก)
- แตะเรื่องเครือข่ายของ gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## Live: การกวาดตรวจ capability ของ Android Node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดย Android Node ที่เชื่อมต่ออยู่ และตรวจสอบพฤติกรรมตาม command contract
- ขอบเขต:
  - การตั้งค่าล่วงหน้า/ด้วยตนเอง (suite นี้ไม่ได้ติดตั้ง/รัน/จับคู่แอป)
  - การตรวจสอบ `node.invoke` ของ gateway แบบทีละคำสั่งสำหรับ Android Node ที่เลือก
- การเตรียมที่จำเป็นล่วงหน้า:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - ให้แอปอยู่เบื้องหน้า
  - อนุญาต permissions/consent สำหรับการจับภาพใน capability ที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [Android App](/th/platforms/android)

## Live: model smoke (profile keys)

การทดสอบ live ถูกแยกเป็นสองชั้นเพื่อให้เราแยกความล้มเหลวได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้เลยหรือไม่ด้วยคีย์ที่ให้มา
- “Gateway smoke” บอกเราว่า pipeline เต็มของ gateway+agent ใช้งานได้กับโมเดลนั้นหรือไม่ (sessions, history, tools, sandbox policy ฯลฯ)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แจกแจงโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กหนึ่งครั้งต่อโมเดล (และ regressions แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all` ซึ่งเป็น alias ของ modern) เพื่อให้รัน suite นี้จริง; ไม่เช่นนั้นจะข้ามเพื่อให้ `pnpm test:live` โฟกัสกับ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ modern allowlist
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist แบบคั่นด้วย comma)
  - โดยค่าเริ่มต้น การกวาดแบบ modern/all จะมีเพดานคัดสรรที่มีสัญญาณสูง; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` เพื่อกวาด modern แบบครบถ้วน หรือใช้เลขบวกเพื่อลดเพดานให้เล็กลง
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist แบบคั่นด้วย comma)
- แหล่งที่มาของคีย์:
  - โดยค่าเริ่มต้น: profile store และ env fallback
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ **profile store** เท่านั้น
- เหตุผลที่มีชุดนี้:
  - แยก “API ของผู้ให้บริการพัง / คีย์ไม่ถูกต้อง” ออกจาก “pipeline ของ gateway agent พัง”
  - รวม regressions ขนาดเล็กแบบแยกขาด (ตัวอย่าง: การ replay reasoning ของ OpenAI Responses/Codex Responses + โฟลว์การเรียกใช้เครื่องมือ)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - หมุน gateway แบบ in-process ขึ้นมา
  - สร้าง/แพตช์ session `agent:dev:*` (override โมเดลต่อหนึ่งการรัน)
  - วนผ่าน models-with-keys และตรวจสอบว่า:
    - ตอบกลับได้ “มีความหมาย” (ไม่มี tools)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (read probe)
    - tool probe เพิ่มเติมแบบไม่บังคับ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ใน workspace แล้วขอให้เอเจนต์ `read` ไฟล์นั้นและสะท้อน nonce กลับ
  - `exec+read` probe: การทดสอบจะขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงในไฟล์ชั่วคราว จากนั้น `read` กลับมา
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะตอบ `cat <CODE>`
  - เอกสารอ้างอิงการติดตั้ง: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ modern allowlist
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วย comma) เพื่อจำกัดขอบเขต
  - โดยค่าเริ่มต้น การกวาด gateway แบบ modern/all จะมีเพดานคัดสรรที่มีสัญญาณสูง; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` เพื่อกวาด modern แบบครบถ้วน หรือใช้เลขบวกเพื่อลดเพดานให้เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทั้งหมด”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist แบบคั่นด้วย comma)
- tool + image probe เปิดตลอดใน live test นี้:
  - `read` probe + `exec+read` probe (tool stress)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กพร้อม “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แปลง attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - เอเจนต์แบบ embedded ส่งต่อข้อความผู้ใช้แบบหลายสื่อไปยังโมเดล
    - ข้อกำหนดการตรวจสอบ: คำตอบมี `cat` + โค้ดดังกล่าว (รองรับ OCR ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าคุณทดสอบอะไรได้บ้างบนเครื่องของคุณ (และ id แบบ `provider/model` ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLI ในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้ CLI backend ในเครื่อง โดยไม่แตะคอนฟิกค่าเริ่มต้นของคุณ
- ค่าเริ่มต้น smoke เฉพาะ backend จะอยู่ในนิยาม `cli-backend.ts` ของ extension เจ้าของ
- การเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - ผู้ให้บริการ/โมเดลค่าเริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรมของ command/args/image มาจาก metadata ของ CLI backend plugin เจ้าของ
- การ override (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (พาธจะถูกฉีดเข้าไปในพรอมป์ต์)
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์ภาพเป็นอาร์กิวเมนต์ของ CLI แทนการฉีดลงในพรอมป์ต์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อกำหนด `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบ resume flow
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` เพื่อปิด probe ความต่อเนื่องของ session เดียวกันแบบ Claude Sonnet -> Opus ที่เปิดเป็นค่าเริ่มต้น (ตั้งเป็น `1` เพื่อบังคับเปิดเมื่อโมเดลที่เลือกรองรับเป้าหมายการสลับ)

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

สูตร Docker แบบผู้ให้บริการเดี่ยว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายในอิมเมจ Docker ของรีโปในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension เจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ Claude Code subscription OAuth แบบพกพาผ่าน `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` ก่อนอื่นมันจะพิสูจน์ว่า `claude -p` ตรงใน Docker ใช้งานได้ จากนั้นจึงรัน Gateway CLI-backend สองเทิร์นโดยไม่เก็บ env API key ของ Anthropic เอาไว้ เลน subscription นี้จะปิด Claude MCP/tool และ image probe เป็นค่าเริ่มต้น เพราะปัจจุบัน Claude route การใช้งานแอปของบุคคลที่สามผ่านการคิดค่าบริการการใช้งานเพิ่มเติม แทนข้อจำกัดของแผน subscription ปกติ
- ตอนนี้ live CLI-backend smoke ทดสอบโฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: เทิร์นข้อความ, เทิร์นจำแนกรูปภาพ แล้วตามด้วยการเรียกเครื่องมือ MCP `cron` ที่ตรวจสอบผ่าน gateway CLI
- smoke ค่าเริ่มต้นของ Claude ยังแพตช์ session จาก Sonnet เป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังจำโน้ตก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์ conversation-bind ของ ACP จริงกับเอเจนต์ ACP แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind การสนทนาแบบ synthetic message-channel ไว้ในตำแหน่งเดิม
  - ส่งข้อความติดตามผลปกติในบทสนทนาเดียวกันนั้น
  - ตรวจสอบว่าข้อความติดตามผลไปถึงทรานสคริปต์ของ ACP session ที่ bind ไว้
- การเปิดใช้งาน:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - เอเจนต์ ACP ใน Docker: `claude,codex,gemini`
  - เอเจนต์ ACP สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - channel แบบ synthetic: บริบทการสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- การ override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- หมายเหตุ:
  - เลนนี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route แบบ synthetic ที่ใช้ได้เฉพาะแอดมิน เพื่อให้การทดสอบแนบบริบท message-channel ได้โดยไม่ต้องแกล้งทำเป็นส่งจากภายนอกจริง
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
- โดยค่าเริ่มต้น มันจะรัน ACP bind smoke กับเอเจนต์ CLI แบบ live ที่รองรับทั้งหมดตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` เพื่อจำกัดเมทริกซ์ให้แคบลง
- มันจะ source `~/.profile`, เตรียม material การยืนยันตัวตนของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์, ติดตั้ง `acpx` ลงใน npm prefix ที่เขียนได้ จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) หากยังไม่มี
- ภายใน Docker ตัวรันจะตั้งค่า `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` เพื่อให้ acpx คง env vars ของผู้ให้บริการจาก profile ที่ source แล้วไว้ให้กับ harness CLI ลูก

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่เป็นเจ้าของโดย plugin ผ่านเมธอด
  `agent` ของ gateway ปกติ:
  - โหลด Plugin `codex` ที่ bundle มา
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `codex/gpt-5.4`
  - ส่งเทิร์นที่สองไปยัง OpenClaw session เดียวกัน และตรวจสอบว่า app-server
    thread สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway เดียวกัน
  - ทางเลือก: รัน shell probe แบบยกระดับสองรายการที่ผ่านการตรวจทานโดย Guardian: คำสั่งที่ไม่เป็นอันตรายหนึ่งรายการซึ่งควรถูกอนุมัติ และการอัปโหลดซีเคร็ตปลอมหนึ่งรายการซึ่งควรถูกปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลค่าเริ่มต้น: `codex/gpt-5.4`
- image probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้งค่า `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อไม่ให้ Codex
  harness ที่พังผ่านไปได้ด้วยการ fallback กลับไปยัง PI แบบเงียบ ๆ
- การยืนยันตัวตน: `OPENAI_API_KEY` จาก shell/profile พร้อมทั้ง
  `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบไม่บังคับ

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
- มันจะ source `~/.profile` ที่เมานต์เข้ามา ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์
  auth ของ Codex CLI เมื่อมีอยู่, ติดตั้ง `@openai/codex` ลงใน npm prefix
  ที่เขียนได้และถูกเมานต์ไว้, เตรียม source tree แล้วรันเฉพาะการทดสอบ live ของ Codex-harness เท่านั้น
- Docker จะเปิด image, MCP/tool และ Guardian probe เป็นค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการการดีบักที่แคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ซึ่งตรงกับคอนฟิกของ live
  test เพื่อไม่ให้ fallback ไปยัง `openai-codex/*` หรือ PI มาบดบัง regression ของ Codex harness

### สูตร live ที่แนะนำ

allowlist แบบแคบและชัดเจนจะเร็วและเปราะบางน้อยที่สุด:

- โมเดลเดี่ยว, direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดี่ยว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือข้ามผู้ให้บริการหลายราย:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัสที่ Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้สะพาน OAuth ของ Antigravity (agent endpoint แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มีลักษณะเฉพาะด้าน auth + tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่โฮสต์โดย Google ผ่าน HTTP (auth แบบ API key / profile); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างออกไป (streaming/tool support/version skew)

## Live: model matrix (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลของ CI” แบบตายตัว (live เป็นแบบเลือกใช้เอง) แต่นี่คือโมเดลที่ **แนะนำ**
ให้ครอบคลุมเป็นประจำบนเครื่องพัฒนาที่มีคีย์

### ชุด smoke สมัยใหม่ (การเรียกใช้เครื่องมือ + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะต้องใช้งานได้ต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.4` (ทางเลือก: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยงโมเดล Gemini 2.x ที่เก่ากว่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: การเรียกใช้เครื่องมือ (Read + Exec แบบไม่บังคับ)

เลือกอย่างน้อยหนึ่งโมเดลต่อหนึ่งตระกูลผู้ให้บริการ:

- OpenAI: `openai/gpt-5.4` (หรือ `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

การครอบคลุมเพิ่มเติมแบบไม่บังคับ (มีไว้ก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกหนึ่งโมเดลที่รองรับ `tools` และคุณเปิดใช้งานไว้)
- Cerebras: `cerebras/`… (หากคุณมีสิทธิ์ใช้งาน)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียกใช้เครื่องมือขึ้นกับโหมด API)

### Vision: การส่ง image (ไฟล์แนบ → ข้อความหลายสื่อ)

ใส่โมเดลที่รองรับ image อย่างน้อยหนึ่งตัวใน `OPENCLAW_LIVE_GATEWAY_MODELS` (เช่น Claude/Gemini/OpenAI รุ่นที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / alternate gateways

หากคุณเปิดใช้คีย์ไว้ เราก็รองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (ยืนยันตัวตนผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณสามารถใส่ใน live matrix ได้ (หากคุณมี creds/config):

- ในตัว: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (custom endpoints): `minimax` (cloud/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ทุกชนิด (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายาม hardcode “ทุกโมเดล” ลงในเอกสาร รายการที่เป็นแหล่งอ้างอิงจริงคือสิ่งที่ `discoverModels(...)` ส่งกลับมาบนเครื่องของคุณ + คีย์ที่มีอยู่

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบ live ค้นหาข้อมูลรับรองด้วยวิธีเดียวกับที่ CLI ใช้ ผลเชิงปฏิบัติคือ:

- หาก CLI ใช้งานได้ การทดสอบ live ก็ควรพบคีย์ชุดเดียวกัน
- หากการทดสอบ live บอกว่า “ไม่มี creds” ให้ดีบักด้วยวิธีเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth ต่อเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ในการทดสอบ live)
- คอนฟิก: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรี state แบบเก่า: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้า staged live home เมื่อมีอยู่ แต่ไม่ใช่ที่เก็บ profile-key หลัก)
- การรัน local แบบ live จะคัดลอก active config, ไฟล์ `auth-profiles.json` ต่อเอเจนต์, `credentials/` แบบเก่า และไดเรกทอรี auth ของ external CLI ที่รองรับ ไปยัง temp test home โดยค่าเริ่มต้น; staged live homes จะข้าม `workspace/` และ `sandboxes/` และจะลบ path override ของ `agents.*.workspace` / `agentDir` เพื่อให้ probe ไม่ไปแตะ workspace จริงบนโฮสต์ของคุณ

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (พวกมันสามารถเมานต์ `~/.profile` เข้าคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียงเสียงพูด)

- การทดสอบ: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- การเปิดใช้งาน: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `src/agents/byteplus.live.test.ts`
- การเปิดใช้งาน: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- การ override โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง image, video และ `music_generate` ของ comfy ที่ bundle มา
  - ข้ามแต่ละ capability เว้นแต่จะตั้งค่า `models.providers.comfy.<capability>` ไว้
  - มีประโยชน์หลังจากเปลี่ยน workflow submission, polling, downloads หรือการลงทะเบียน Plugin ของ comfy

## Image generation live

- การทดสอบ: `src/image-generation/runtime.live.test.ts`
- คำสั่ง: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แจกแจง Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ทุกตัว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายไปจาก login shell ของคุณ (`~/.profile`) ก่อนทำ probe
  - ใช้ API keys แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันตัวแปร image-generation มาตรฐานผ่าน capability runtime ที่ใช้ร่วมกัน:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- ผู้ให้บริการแบบ bundle ปัจจุบันที่ครอบคลุม:
  - `openai`
  - `google`
  - `xai`
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่สนใจ override ที่มีเฉพาะ env

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบ bundle ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำ probe
  - ใช้ API keys แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันทั้งสองโหมด runtime ที่ประกาศไว้เมื่อมี:
    - `generate` ด้วยอินพุตที่มีเฉพาะพรอมป์ต์
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - การครอบคลุม current shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยก ไม่ใช่การกวาดร่วมนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่สนใจ override ที่มีเฉพาะ env

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- การเปิดใช้งาน: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบ bundle ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นใช้เส้นทาง smoke ที่ปลอดภัยสำหรับรีลีส: ผู้ให้บริการที่ไม่ใช่ FAL, หนึ่งคำขอ text-to-video ต่อผู้ให้บริการ, พรอมป์ต์กุ้งล็อบสเตอร์ความยาวหนึ่งวินาที และเพดานเวลาต่อการปฏิบัติการต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)
  - ข้าม FAL โดยค่าเริ่มต้น เพราะ latency ของคิวฝั่งผู้ให้บริการอาจกินเวลาของรีลีสเป็นหลัก; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันแบบ explicit
  - โหลด env vars ของผู้ให้บริการจาก login shell ของคุณ (`~/.profile`) ก่อนทำ probe
  - ใช้ API keys แบบ live/env ก่อน auth profile ที่จัดเก็บไว้โดยค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้ามผู้ให้บริการที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันเฉพาะ `generate` โดยค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด transform ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตรูปภาพในเครื่องแบบ buffer-backed ในการกวาดร่วม
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลที่เลือกยอมรับอินพุตวิดีโอในเครื่องแบบ buffer-backed ในการกวาดร่วม
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `vydra` เพราะ `veo3` ที่ bundle มาเป็นแบบ text-only และ `kling` ที่ bundle มาต้องใช้ remote image URL
  - การครอบคลุม Vydra แบบเฉพาะผู้ให้บริการ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นรัน `veo3` text-to-video พร้อมทั้งเลน `kling` ที่ใช้ฟิกซ์เจอร์ remote image URL โดยค่าเริ่มต้น
  - การครอบคลุม `videoToVideo` แบบ live ปัจจุบัน:
    - `runway` เท่านั้น เมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นตอนนี้ต้องใช้ reference URL แบบ `http(s)` / MP4 จากระยะไกล
    - `google` เพราะเลน Gemini/Veo ที่ใช้ร่วมกันในปัจจุบันใช้อินพุตในเครื่องแบบ buffer-backed และเส้นทางนั้นไม่ถูกรับในการกวาดร่วม
    - `openai` เพราะเลนที่ใช้ร่วมกันในปัจจุบันยังไม่มีหลักประกันการเข้าถึง video inpaint/remix เฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมผู้ให้บริการทุกตัวในการกวาดค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาการปฏิบัติการของแต่ละผู้ให้บริการสำหรับการรัน smoke แบบเข้มข้น
- พฤติกรรมการยืนยันตัวตนแบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และไม่สนใจ override ที่มีเฉพาะ env

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- จุดประสงค์:
  - รันชุด live ของภาพ เพลง และวิดีโอที่ใช้ร่วมกันผ่าน entrypoint แบบ native ของรีโปเพียงจุดเดียว
  - โหลด env vars ของผู้ให้บริการที่ขาดหายไปจาก `~/.profile` โดยอัตโนมัติ
  - จำกัดขอบเขตแต่ละ suite ไปยังผู้ให้บริการที่มี auth ใช้งานได้ในปัจจุบันโดยอัตโนมัติเป็นค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ ดังนั้นพฤติกรรม Heartbeat และ quiet-mode จึงคงสอดคล้องกัน
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ตัวรัน Docker (ทางเลือกสำหรับการตรวจสอบ “ใช้ได้บน Linux”)

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live แบบ profile-key ที่ตรงกันภายในอิมเมจ Docker ของรีโป (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรี config และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากมีการเมานต์) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker แบบ live มีค่าเริ่มต้นเป็นเพดาน smoke ที่เล็กกว่า เพื่อให้การกวาด Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12`, และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override env vars เหล่านั้นเมื่อคุณ
  ตั้งใจจะใช้การสแกนแบบ exhaustive ที่ใหญ่กว่าโดยเฉพาะ
- `test:docker:all` จะสร้างอิมเมจ live Docker หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นนำกลับมาใช้ซ้ำสำหรับสองเลน live Docker นั้น นอกจากนี้ยังสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันหนึ่งชุดผ่าน `test:docker:e2e-build` และนำกลับมาใช้ซ้ำสำหรับตัวรัน E2E container smoke ที่ทดสอบแอปที่ build แล้ว

ตัวรัน Docker แบบ live-model จะ bind-mount เฉพาะ home ของ CLI auth ที่จำเป็นด้วยเช่นกัน (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้จำกัดขอบเขต) จากนั้นคัดลอกเข้า home ของคอนเทนเนอร์ก่อนการรัน เพื่อให้ OAuth ของ external-CLI รีเฟรชโทเค็นได้โดยไม่แก้ไขที่เก็บ auth บนโฮสต์:

- Direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, โครงร่างเต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker, ตั้งค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram เป็นค่าเริ่มต้น, ตรวจสอบว่าการเปิดใช้งาน Plugin ติดตั้ง runtime deps ตามต้องการ, รัน doctor และรัน agent turn ของ OpenAI แบบจำลองหนึ่งครั้ง ใช้ tarball ที่สร้างไว้แล้วซ้ำด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยน channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` regression แบบ minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ฝั่งผู้ให้บริการปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏในล็อกของ Gateway
- MCP channel bridge (Gateway ที่ seed ไว้ + stdio bridge + Claude notification-frame smoke แบบดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (เซิร์ฟเวอร์ stdio MCP จริง + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (Gateway จริง + การปิด child ของ stdio MCP หลังรัน cron แบบแยกขาดและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + semantics การรีสตาร์ตของ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- runtime deps ของ Plugin ที่ bundle มา: `pnpm test:docker:bundled-channel-deps` จะสร้างอิมเมจตัวรัน Docker ขนาดเล็กโดยค่าเริ่มต้น build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้นเมานต์ tarball นั้นเข้าแต่ละสถานการณ์ติดตั้งบน Linux ใช้อิมเมจซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ rebuild บนโฮสต์หลังจาก build ในเครื่องใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่ด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
- จำกัดขอบเขต runtime deps ของ Plugin ที่ bundle มาให้แคบลงระหว่างการวนแก้ไข โดยปิดสถานการณ์ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ build ล่วงหน้าและใช้อิมเมจ built-app ที่ใช้ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การ override อิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจที่ใช้ร่วมกันจากระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และตัวติดตั้งยังคงใช้ Dockerfile ของตนเอง เพราะพวกมันตรวจสอบพฤติกรรมของแพ็กเกจ/การติดตั้ง แทน runtime ของ built-app ที่ใช้ร่วมกัน

ตัวรัน Docker แบบ live-model จะ bind-mount checkout ปัจจุบันแบบ read-only ด้วย และ
เตรียมมันเข้าไปใน workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจ runtime
มีขนาดเล็ก ขณะเดียวกันก็ยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอนการ staging จะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและผลลัพธ์จากการ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีผลลัพธ์ `.build` หรือ
Gradle ของแอปในเครื่อง เพื่อไม่ให้การรัน Docker แบบ live ใช้เวลาหลายนาทีในการคัดลอก
artifacts ที่ผูกกับเครื่องเฉพาะ
พวกมันยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probes เริ่ม
worker ของ channel จริง เช่น Telegram/Discord ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดขอบเขตหรือยกเว้นการครอบคลุม gateway
live จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ gateway ของ OpenClaw โดยเปิด endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ตรึงเวอร์ชันไว้ให้ชี้ไปยัง gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วจึงส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
อิมเมจ Open WebUI และ Open WebUI เองอาจต้องทำ cold-start setup ของตนให้เสร็จ
lane นี้คาดว่าจะมีคีย์ของ live model ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(ค่าเริ่มต้นคือ `~/.profile`) คือวิธีหลักในการส่งคีย์ดังกล่าวให้การรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic โดยตั้งใจ และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันจะบูตคอนเทนเนอร์ Gateway
ที่ seed ไว้ เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve` แล้ว
ตรวจสอบ routed conversation discovery, การอ่านทรานสคริปต์, metadata ของไฟล์แนบ,
พฤติกรรมของคิวเหตุการณ์แบบ live, การ route การส่งขาออก และการแจ้งเตือนแบบ channel +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจสอบการแจ้งเตือน
จะตรวจสอบ stdio MCP frame ดิบโดยตรง ดังนั้น smoke นี้จึงตรวจสอบสิ่งที่ bridge ปล่อยออกมาจริง
ไม่ใช่เพียงสิ่งที่ SDK ของ client ตัวใดตัวหนึ่งบังเอิญเปิดเผย
`test:docker:pi-bundle-mcp-tools` เป็นแบบ deterministic และไม่ต้องใช้คีย์ของ live
model มันจะ build อิมเมจ Docker ของรีโป, เริ่มเซิร์ฟเวอร์ probe stdio MCP จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime ของ embedded Pi bundle
MCP, รันเครื่องมือดังกล่าว จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
เครื่องมือ `bundle-mcp` ไว้ ในขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็นแบบ deterministic และไม่ต้องใช้คีย์ของ live model
มันจะเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์ probe stdio MCP จริง, รัน
cron turn แบบแยกขาดและ child turn แบบ one-shot ของ `/subagents spawn` จากนั้นตรวจสอบ
ว่าโปรเซสลูกของ MCP ออกจากระบบหลังจบแต่ละการรัน

การทดสอบ smoke ของเธรด ACP แบบ plain-language ด้วยตนเอง (ไม่อยู่ใน CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นห้ามลบ

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) เมานต์ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อให้ตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มีการเมานต์ auth ของ external CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) เมานต์ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบแคชใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ external CLI ภายใต้ `$HOME` จะถูกเมานต์แบบ read-only ภายใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันแบบจำกัดผู้ให้บริการจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองได้ผ่าน `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway จะเปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override พรอมป์ต์ตรวจสอบ nonce ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override tag ของอิมเมจ Open WebUI ที่ตรึงไว้

## ความสมเหตุสมผลของเอกสาร

รันการตรวจสอบ docs หลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อต้องการตรวจสอบ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## การทดสอบป้องกันการถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

นี่คือ regressions ของ “pipeline จริง” โดยไม่ใช้ผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือของ Gateway (OpenAI แบบจำลอง, gateway + agent loop จริง): `src/gateway/gateway.test.ts` (กรณี: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + auth แบบบังคับใช้): `src/gateway/gateway.test.ts` (กรณี: "runs wizard over ws and writes auth token config")

## การประเมินความเชื่อถือได้ของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วจำนวนหนึ่งซึ่งมีลักษณะเหมือน “การประเมินความเชื่อถือได้ของเอเจนต์”:

- การเรียกใช้เครื่องมือแบบจำลองผ่าน gateway + agent loop จริง (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบ wiring ของ session และผลกระทบของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการแสดงรายการ Skills อยู่ในพรอมป์ต์ เอเจนต์เลือก Skill ที่ถูกต้อง (หรือหลีกเลี่ยง Skill ที่ไม่เกี่ยวข้อง) ได้หรือไม่
- **การปฏิบัติตาม:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่
- **Workflow contracts:** สถานการณ์หลายเทิร์นที่ตรวจสอบลำดับเครื่องมือ การคงอยู่ของประวัติเซสชัน และขอบเขต sandbox

การประเมินในอนาคตควรคงความ deterministic ก่อน:

- ตัวรันสถานการณ์ที่ใช้ผู้ให้บริการแบบจำลองเพื่อตรวจสอบการเรียกใช้เครื่องมือ + ลำดับ การอ่านไฟล์ Skill และ wiring ของ session
- ชุดสถานการณ์ขนาดเล็กที่เน้น Skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- การประเมินแบบ live ที่เป็นทางเลือก (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ plugin และ channel)

Contract tests ตรวจสอบว่า plugin และ channel ที่ลงทะเบียนไว้ทุกตัวเป็นไปตาม
interface contract ของตน โดยจะวนผ่าน plugin ที่ค้นพบทั้งหมดและรันชุดการตรวจสอบด้าน
รูปร่างและพฤติกรรม default unit lane ของ `pnpm test` ตั้งใจข้ามไฟล์ seam และ smoke
ที่ใช้ร่วมกันเหล่านี้; ให้รันคำสั่ง contract โดยตรงเมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- Contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ที่ `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรมการผูกเซสชัน
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของ channel
- **threading** - การจัดการ thread ID
- **directory** - API ของ directory/roster
- **group-policy** - การบังคับใช้นโยบายของกลุ่ม

### Provider status contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`

- **status** - การตรวจสอบสถานะของ channel
- **registry** - รูปร่างของรีจิสทรี Plugin

### Provider contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของโฟลว์ auth
- **auth-choice** - การเลือก/การคัดเลือก auth
- **catalog** - API ของ model catalog
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของผู้ให้บริการ
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - setup wizard

### เมื่อใดควรรัน

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียน Plugin หรือการค้นพบ

Contract tests รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหาผู้ให้บริการ/โมเดลที่ค้นพบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (ผู้ให้บริการแบบ mock/stub หรือจับ transformation ของรูปร่างคำขอที่แน่นอน)
- หากโดยธรรมชาติเป็นแบบ live-only (rate limits, นโยบาย auth) ให้ทำให้ live test แคบและเป็น opt-in ผ่าน env vars
- ควรเล็งไปที่ชั้นที่เล็กที่สุดที่ยังจับบั๊กได้:
  - บั๊กการแปลง/การ replay คำขอของผู้ให้บริการ → direct models test
  - บั๊กใน pipeline ของ gateway session/history/tool → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- Guardrail ของการท่อง SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะ derive เป้าหมายตัวอย่างหนึ่งรายการต่อ SecretRef class จาก metadata ของรีจิสทรี (`listSecretTargetRegistryEntries()`), จากนั้นตรวจสอบว่า traversal-segment exec ids ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูลเป้าหมาย SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้ปรับ `classifyTargetClass` ในการทดสอบนั้น การทดสอบนี้ตั้งใจให้ล้มเหลวเมื่อเจอ target id ที่ยังไม่ถูกจัดประเภท เพื่อไม่ให้ class ใหม่ถูกข้ามไปแบบเงียบ ๆ
