---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่ม regression สำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือการทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T05:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 059968e60173b86a101ffc1a24e5d6c2383caaef6b8d037abd7cc7c275a225d3
    source_path: help/testing.md
    workflow: 15
---

# การทดสอบ

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และมีตัวรัน Docker ขนาดเล็กอีกชุดหนึ่ง

เอกสารนี้คือคู่มือ “เราทดสอบกันอย่างไร”:

- แต่ละชุดทดสอบครอบคลุมอะไรบ้าง (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- ชุดทดสอบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- จะเพิ่ม regression สำหรับปัญหาจริงของโมเดล/ผู้ให้บริการได้อย่างไร

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- เกตแบบเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite แบบเร็วกว่าในเครื่องบนเครื่องที่ทรัพยากรเยอะ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- ตอนนี้การกำหนดเป้าหมายเป็นไฟล์โดยตรงจะกำหนดเส้นทางพาธของ extension/channel ได้ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงเป้าหมายก่อนเมื่อคุณกำลังวนแก้ failure เพียงรายการเดียว
- เว็บไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- QA lane ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้องการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกตด้าน coverage: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุดทดสอบ live (models + gateway tool/image probes): `pnpm test:live`
- กำหนดเป้าหมายเป็นไฟล์ live เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- cost smoke ของ Moonshot/Kimi: เมื่อกำหนด `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกเดี่ยวกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของผู้ช่วยเก็บ `usage.cost` ที่ถูกทำให้เป็นมาตรฐานแล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงเคสที่ล้มเหลวตัวเดียว ให้จำกัด live tests ผ่านตัวแปร env ของ allowlist ที่อธิบายไว้ด้านล่าง

## ตัวรันเฉพาะสำหรับ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลัก เมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ `Parity gate` จะรันบน PR ที่ตรงเงื่อนไขและ
จาก manual dispatch โดยใช้ mock provider ส่วน `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, live Matrix lane และ
live Telegram lane ที่จัดการด้วย Convex เป็นงานขนานกัน `OpenClaw Release Checks`
จะรัน lane ชุดเดียวกันก่อนอนุมัติ release

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิง repo โดยตรงบนโฮสต์
  - รันหลายสถานการณ์ที่เลือกไว้แบบขนานโดยค่าเริ่มต้น ด้วย
    gateway worker แบบแยกกัน `qa-channel` ใช้ concurrency 4 เป็นค่าเริ่มต้น (ถูกจำกัดด้วยจำนวนสถานการณ์
    ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` สำหรับ lane แบบอนุกรมรุ่นเก่า
  - จบด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่ให้จบด้วยรหัสล้มเหลว
  - รองรับ provider mode แบบ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` จะเริ่มเซิร์ฟเวอร์ provider ที่ใช้ AIMock ในเครื่องสำหรับการครอบคลุมแบบทดลองของ fixture และ protocol-mock โดยไม่แทนที่ lane `mock-openai`
    ที่รับรู้สถานการณ์
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้แฟล็กการเลือก provider/model ชุดเดียวกับ `qa suite`
  - สำหรับการรันแบบ live จะส่งต่ออินพุต auth ของ QA ที่รองรับซึ่งใช้งานได้จริงกับ guest:
    คีย์ของ provider ที่อิง env, พาธ config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรีเอาต์พุตต้องอยู่ภายใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ไว้ได้
  - เขียน QA report + summary ปกติ รวมทั้ง log ของ Multipass ลงใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่ใช้ Docker สำหรับงาน QA ในลักษณะผู้ปฏิบัติการ
- `pnpm test:docker:npm-onboard-channel-agent`
  - build npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding แบบไม่โต้ตอบด้วย OpenAI API key กำหนดค่า Telegram
    เป็นค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้ plugin จะติดตั้ง dependency ของ runtime ตามต้องการ, รัน doctor และรันหนึ่ง turn ของ agent ในเครื่องกับ endpoint OpenAI แบบ mocked
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane การติดตั้งแบบแพ็กเกจเดียวกัน
    กับ Discord
- `pnpm test:docker:bundled-channel-deps`
  - pack และติดตั้ง build OpenClaw ปัจจุบันใน Docker เริ่ม Gateway
    โดยตั้งค่า OpenAI แล้ว จากนั้นเปิดใช้ bundled channel/plugins ผ่านการแก้ config
  - ตรวจสอบว่าการค้นพบในการตั้งค่าทำให้ dependency ของ runtime ของ plugin ที่ยังไม่กำหนดค่า
    ยังคงไม่ถูกติดตั้ง, การรัน Gateway หรือ doctor ครั้งแรกหลังการกำหนดค่าจะติดตั้ง dependency ของ runtime ของ bundled plugin แต่ละตัวตามต้องการ และการรีสตาร์ตครั้งที่สองจะไม่ติดตั้ง dependency ที่เปิดใช้งานแล้วซ้ำ
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบแน่ชัด เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า
    doctor หลังการอัปเดตของ candidate ซ่อมแซม dependency ของ runtime สำหรับ bundled channel
    โดยไม่ต้องมีการซ่อม postinstall จากฝั่ง harness
- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ในเครื่องสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รัน Matrix live QA lane กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่รองรับด้วย Docker
  - ปัจจุบันโฮสต์ QA นี้ใช้ได้เฉพาะกับ repo/dev เท่านั้น การติดตั้ง OpenClaw แบบแพ็กเกจ
    ไม่ได้มาพร้อม `qa-lab` ดังนั้นจึงไม่มี `openclaw qa`
  - checkout ของ repo จะโหลด bundled runner โดยตรง ไม่ต้องมีขั้นตอนติดตั้ง plugin แยก
  - จัดเตรียมผู้ใช้ Matrix ชั่วคราวสามราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง จากนั้นเริ่มกระบวนการลูกของ QA gateway โดยใช้ Matrix plugin จริงเป็น SUT transport
  - ใช้ Tuwunel image รุ่นเสถียรที่ปักหมุด `ghcr.io/matrix-construct/tuwunel:v1.5.1` เป็นค่าเริ่มต้น แทนที่ด้วย `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อคุณต้องการทดสอบ image ตัวอื่น
  - Matrix ไม่เปิดเผยแฟล็กแหล่งข้อมูลรับรองร่วม เพราะ lane นี้จัดเตรียมผู้ใช้แบบใช้แล้วทิ้งในเครื่อง
  - เขียน Matrix QA report, summary, artifact ของ observed-events และ log เอาต์พุต stdout/stderr รวม ลงใต้ `.artifacts/qa-e2e/...`
- `pnpm openclaw qa telegram`
  - รัน Telegram live QA lane กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอตของ driver และ SUT จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` โดย group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองรวมที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - จบด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่ให้จบด้วยรหัสล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องมี Telegram username
  - เพื่อให้การสังเกต bot-to-bot เสถียร ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบให้แน่ใจว่าบอต driver สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียน Telegram QA report, summary และ artifact ของ observed-messages ลงใต้ `.artifacts/qa-e2e/...`

live transport lane ใช้สัญญามาตรฐานร่วมกันหนึ่งชุด เพื่อไม่ให้ transport ใหม่ ๆ เบี่ยงเบน:

`qa-channel` ยังคงเป็นชุด QA แบบสังเคราะห์ขนาดกว้าง และไม่ใช่ส่วนหนึ่งของเมทริกซ์การครอบคลุม live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### ข้อมูลรับรอง Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิด `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบเอกสิทธิ์จากพูลที่รองรับด้วย Convex ส่ง Heartbeat
ให้ lease นั้นระหว่างที่ lane กำลังรัน และปล่อย lease เมื่อปิดตัว

scaffold ของโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งตัวสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทของข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นผ่าน env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นคือ `ci` ใน CI และ `maintainer` ในกรณีอื่น)

ตัวแปร env แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการใช้งานปกติ

คำสั่งแอดมินสำหรับ maintainer (เพิ่ม/ลบ/list พูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `--json` เพื่อให้ได้เอาต์พุตที่อ่านได้ด้วยเครื่องในสคริปต์และยูทิลิตีของ CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - หมดพูล/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ maintainer secret)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวกัน lease ที่กำลังใช้งาน: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มแชนเนลเข้า QA

การเพิ่มแชนเนลเข้าสู่ระบบ markdown QA ต้องมีสองอย่างพอดี:

1. transport adapter สำหรับแชนเนลนั้น
2. scenario pack ที่ทดสอบสัญญาของแชนเนลนั้น

ห้ามเพิ่ม top-level QA command root ใหม่ เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถ
รับผิดชอบโฟลว์นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- command root `openclaw qa`
- การเริ่มต้นและปิดชุดทดสอบ
- worker concurrency
- การเขียน artifact
- การสร้างรายงาน
- การรันสถานการณ์
- compatibility alias สำหรับสถานการณ์ `qa-channel` แบบเก่า

runner plugin เป็นเจ้าของสัญญา transport:

- วิธีที่ `openclaw qa <runner>` ถูก mount ภายใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีที่ gateway ถูกกำหนดค่าสำหรับ transport นั้น
- วิธีที่ตรวจสอบความพร้อม
- วิธีที่ inject inbound event
- วิธีที่สังเกต outbound message
- วิธีที่เปิดเผย transcript และสถานะ transport ที่ทำให้เป็นมาตรฐานแล้ว
- วิธีที่รัน action ที่อิง transport
- วิธีจัดการ reset หรือ cleanup ที่เฉพาะกับ transport

เกณฑ์ขั้นต่ำสำหรับการรับแชนเนลใหม่มีดังนี้:

1. คงให้ `qa-lab` เป็นเจ้าของ `qa` root ที่ใช้ร่วมกัน
2. implement transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกที่เฉพาะกับ transport ไว้ใน runner plugin หรือ channel harness
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ใหม่ที่แข่งกัน
   runner plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   คง `runtime-api.ts` ให้เบา; การรัน CLI และ runner แบบ lazy ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือดัดแปลง markdown scenario ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ตัวช่วย scenario แบบทั่วไปสำหรับ scenario ใหม่
7. คง compatibility alias ที่มีอยู่ให้ทำงานต่อ เว้นแต่ repo กำลังทำ migration อย่างตั้งใจ

กฎการตัดสินใจเป็นแบบเข้มงวด:

- หากพฤติกรรมสามารถเขียนเพียงครั้งเดียวใน `qa-lab` ได้ ให้วางไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ channel transport เพียงตัวเดียว ให้เก็บไว้ใน runner plugin หรือ plugin harness ของ transport นั้น
- หาก scenario ต้องการความสามารถใหม่ที่มากกว่าหนึ่งแชนเนลใช้ได้ ให้เพิ่มตัวช่วยแบบทั่วไปแทนการแตกแขนงเฉพาะแชนเนลใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้คง scenario นั้นเป็นแบบเฉพาะ transport และระบุให้ชัดเจนใน scenario contract

ชื่อตัวช่วยแบบทั่วไปที่ควรใช้สำหรับ scenario ใหม่คือ:

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

compatibility alias ยังคงมีให้ใช้สำหรับ scenario เดิม รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งานแชนเนลใหม่ควรใช้ชื่อตัวช่วยแบบทั่วไป
compatibility alias มีไว้เพื่อหลีกเลี่ยงการย้ายแบบ flag day ไม่ใช่เป็นต้นแบบ
สำหรับการเขียน scenario ใหม่

## ชุดทดสอบ (อะไรรันที่ไหน)

ให้มองชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- config: การรัน shard แบบลำดับต่อเนื่องสิบชุด (`vitest.full-*.config.ts`) บน Vitest project แบบกำหนดขอบเขตที่มีอยู่
- ไฟล์: รายการ unit/core ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ node ใน `ui` ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบ unit แบบบริสุทธิ์
  - การทดสอบ integration ภายในโปรเซส (gateway auth, routing, tooling, parsing, config)
  - regression แบบกำหนดแน่นอนสำหรับบั๊กที่ทราบแล้ว
- สิ่งที่คาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
- หมายเหตุเรื่อง project:
  - `pnpm test` ที่ไม่ได้กำหนดเป้าหมาย ตอนนี้รันบน config shard ขนาดเล็กสิบเอ็ดชุด (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนที่จะเป็นโปรเซส root-project แบบ native ขนาดยักษ์หนึ่งตัว วิธีนี้ลด peak RSS บนเครื่องที่มีโหลด และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจาก suite อื่นที่ไม่เกี่ยวข้อง
  - `pnpm test --watch` ยังคงใช้กราฟ project ของ root `vitest.config.ts` แบบ native เพราะลูป watch แบบหลาย shard ไม่เหมาะใช้งานจริง
  - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะกำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit ผ่าน scoped lane ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะไม่ต้องเสียต้นทุน startup ของ root project แบบเต็ม
  - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนไปยัง scoped lane เดียวกันเมื่อ diff แตะเฉพาะไฟล์ซอร์ส/ทดสอบที่กำหนดเส้นทางได้; การแก้ไข config/setup จะ fallback ไปสู่การ rerun แบบ root-project กว้าง
  - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานแคบ ๆ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata และ tooling จากนั้นรัน lane typecheck/lint/test ที่ตรงกัน การเปลี่ยนแปลงของ Plugin SDK สาธารณะและ plugin-contract จะรวมการตรวจสอบ extension ด้วย เพราะ extension พึ่งพาสัญญาแกนเหล่านั้น การ bump เวอร์ชันที่เป็น release metadata-only จะรันการตรวจสอบแบบเจาะจงสำหรับ version/config/root-dependency แทน suite เต็ม พร้อมตัวกันที่ปฏิเสธการเปลี่ยนแปลงแพ็กเกจนอก field เวอร์ชันระดับบนสุด
  - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีบริสุทธิ์ที่คล้ายกัน จะถูกกำหนดเส้นทางผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ส่วนไฟล์ที่มี stateful/runtime หนักจะยังอยู่ใน lane เดิม
  - ไฟล์ซอร์สตัวช่วยที่เลือกไว้ใน `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยังการทดสอบ sibling แบบ explicit ใน lane เบาเหล่านั้นด้วย ดังนั้นการแก้ helper จะไม่ต้อง rerun suite หนักทั้งชุดของไดเรกทอรีนั้น
  - ตอนนี้ `auto-reply` มีบักเก็ตเฉพาะสามชุด: core helper ระดับบนสุด, การทดสอบ integration ของ `reply.*` ระดับบนสุด และ subtree `src/auto-reply/reply/**` ซึ่งช่วยให้งาน reply harness ที่หนักที่สุดไม่ไปปะปนกับการทดสอบสถานะ/chunk/token ที่เบา
- หมายเหตุเรื่อง embedded runner:
  - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือบริบท runtime ของ Compaction
    ให้คงการครอบคลุมทั้งสองระดับไว้
  - เพิ่ม regression แบบเจาะจง helper สำหรับ boundary ของ routing/normalization ที่บริสุทธิ์
  - และต้องคง suite integration ของ embedded runner ให้สุขภาพดีด้วย:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
  - suite เหล่านี้ตรวจสอบว่า id แบบกำหนดขอบเขตและพฤติกรรมของ Compaction ยังคงไหลผ่าน
    เส้นทางจริงของ `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper อย่างเดียว
    ไม่เพียงพอที่จะทดแทนเส้นทาง integration เหล่านี้
- หมายเหตุเรื่อง pool:
  - base Vitest config ตอนนี้ใช้ค่าเริ่มต้นเป็น `threads`
  - shared Vitest config ยังตรึง `isolate: false` และใช้ non-isolated runner ร่วมกันใน root projects, e2e และ live config
  - lane UI ระดับ root ยังคงใช้ `jsdom` setup และ optimizer ของมัน แต่ตอนนี้รันบน shared non-isolated runner เช่นกัน
  - shard แต่ละชุดของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false` เดียวกันจาก shared Vitest config
  - launcher ร่วม `scripts/run-vitest.mjs` ตอนนี้ยังเพิ่ม `--no-maglev` ให้กับ child Node process ของ Vitest โดยค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่ ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` หากคุณต้องการเปรียบเทียบกับพฤติกรรม V8 แบบปกติ
- หมายเหตุเรื่องการวนงานในเครื่องแบบเร็ว:
  - `pnpm changed:lanes` แสดงว่า diff หนึ่งชุดกระตุ้น architectural lane ใดบ้าง
  - pre-commit hook จะรัน `pnpm check:changed --staged` หลังจัดรูปแบบ/lint ของไฟล์ staged แล้ว ดังนั้น commit ที่แตะเฉพาะ core จะไม่ต้องจ่ายต้นทุนการทดสอบ extension เว้นแต่จะแตะสัญญาสาธารณะที่หันหน้าไปทาง extension โดยตรง commit ที่เป็น release metadata-only จะยังอยู่ใน lane แบบเจาะจง version/config/root-dependency
  - หากชุดการเปลี่ยนแปลง staged เดียวกันนั้นถูกตรวจสอบแล้วด้วย gate ที่เทียบเท่าหรือเข้มกว่า ให้ใช้ `scripts/committer --fast "<message>" <files...>` เพื่อข้ามเฉพาะการ rerun changed-scope hook เท่านั้น staged format/lint จะยังรันอยู่ ให้ระบุ gate ที่ผ่านแล้วใน handoff ของคุณ วิธีนี้ยอมรับได้เช่นกันหลัง rerun isolated flaky hook failure แล้วผ่านพร้อมหลักฐานแบบกำหนดขอบเขต
  - `pnpm test:changed` จะกำหนดเส้นทางผ่าน scoped lane เมื่อพาธที่เปลี่ยนแมปไปยัง suite ที่เล็กกว่าได้อย่างชัดเจน
  - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทางเดิม เพียงแต่ใช้เพดาน worker ที่สูงกว่า
  - ตอนนี้การ auto-scale worker ในเครื่องถูกทำให้ระมัดระวังโดยตั้งใจ และยังถอยลงเมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุดจะสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
  - base Vitest config ทำเครื่องหมายไฟล์ projects/config เป็น `forceRerunTriggers` เพื่อให้ changed-mode rerun ยังคงถูกต้องเมื่อ wiring ของการทดสอบเปลี่ยน
  - config คง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบนโฮสต์ที่รองรับ; ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการตำแหน่งแคชแบบ explicit สำหรับการทำ profiling โดยตรง
- หมายเหตุเรื่อง perf-debug:
  - `pnpm test:perf:imports` จะเปิดการรายงานระยะเวลาการ import ของ Vitest พร้อมเอาต์พุต breakdown ของการ import
  - `pnpm test:perf:imports:changed` จะกำหนดขอบเขตมุมมอง profiling เดียวกันไปยังไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ `test:changed` แบบกำหนดเส้นทางกับเส้นทาง root-project แบบ native สำหรับ diff ที่ commit แล้วนั้น และพิมพ์ wall time พร้อม macOS max RSS
- `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark ของต้นไม้ที่ยังสกปรกอยู่ในปัจจุบัน โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน `scripts/test-projects.mjs` และ root Vitest config
  - `pnpm test:perf:profile:main` จะเขียน main-thread CPU profile สำหรับ overhead ของ Vitest/Vite ด้าน startup และ transform
  - `pnpm test:perf:profile:runner` จะเขียน runner CPU+heap profile สำหรับ unit suite โดยปิด file parallelism

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- config: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ป้อน churn ของข้อความ gateway, memory และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านเส้นทาง diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS แบบสังเคราะห์ยังต่ำกว่างบความกดดัน และความลึกของคิวต่อเซสชันลดกลับเป็นศูนย์
- สิ่งที่คาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แบบแคบสำหรับติดตาม regression ด้านความเสถียร ไม่ใช่ตัวแทนของ Gateway suite เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` เช่นเดียวกับส่วนอื่นของ repo
  - ใช้ worker แบบปรับได้ (CI: สูงสุด 2, ในเครื่อง: ค่าเริ่มต้น 1)
  - รันใน silent mode โดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (สูงสุด 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบ verbose กลับมา
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, node pairing และเครือข่ายที่หนักกว่า
- สิ่งที่คาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (จึงอาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `test/openshell-sandbox.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกตัวบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ในเครื่องแบบชั่วคราว
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรมของ filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- สิ่งที่คาดหวัง:
  - เป็นแบบ opt-in เท่านั้น; ไม่ใช่ส่วนหนึ่งของ `pnpm test:e2e` ปกติ
  - ต้องมี `openshell` CLI ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกตัว จากนั้นทำลาย test gateway และ sandbox
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรัน e2e suite แบบกว้างด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ยังใช้งานได้ _วันนี้_ จริงไหม ด้วยข้อมูลรับรองจริง?”
  - ตรวจจับการเปลี่ยนรูปแบบของผู้ให้บริการ, ความแปลกของการเรียก tool, ปัญหา auth และพฤติกรรม rate limit
- สิ่งที่คาดหวัง:
  - โดยออกแบบมาให้ไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบายของผู้ให้บริการจริง, โควตา, การล่ม)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเฉพาะส่วนย่อยที่แคบลงแทนการรัน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อดึง API key ที่ขาดหายไป
- โดยค่าเริ่มต้น การรัน live ยังคงแยก `HOME` และคัดลอก config/auth material ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture ของ unit เปลี่ยนแปลง `~/.openclaw` จริงของคุณ
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live test ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: มันคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อนประกาศ `~/.profile` เพิ่มเติมและปิดเสียง log ตอน bootstrap gateway/Bonjour chatter ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log ตอนเริ่มต้นแบบเต็มกลับมา
- การหมุน API key (เฉพาะผู้ให้บริการ): ตั้ง `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือกำหนดแทนที่แบบ per-live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อได้รับการตอบกลับแบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ live suite จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้การจับ console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าจาก provider/gateway ถูกสตรีมทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดทดสอบไหน?

ใช้ตารางตัดสินใจนี้:

- แก้ logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนไปมาก)
- แตะ networking ของ gateway / โปรโตคอล WS / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / failure เฉพาะผู้ให้บริการ / การเรียก tool: รัน `pnpm test:live` แบบเจาะจงให้แคบลง

## Live: Android node capability sweep

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียก **ทุกคำสั่งที่ประกาศอยู่ในปัจจุบัน** โดย Android node ที่เชื่อมต่ออยู่ และยืนยันพฤติกรรมตามสัญญาของคำสั่ง
- ขอบเขต:
  - ต้องมีเงื่อนไขก่อนหน้า/การตั้งค่าด้วยตนเอง (suite นี้ไม่ติดตั้ง/รัน/pair แอปให้)
  - การตรวจสอบ `node.invoke` ของ gateway ทีละคำสั่งสำหรับ Android node ที่เลือก
- การตั้งค่าก่อนเริ่มที่จำเป็น:
  - แอป Android เชื่อมต่อและ pair กับ gateway แล้ว
  - คงแอปไว้ใน foreground
  - ให้สิทธิ์/คำยินยอมการจับข้อมูลสำหรับความสามารถที่คุณคาดว่าจะผ่าน
- การแทนที่เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## Live: model smoke (profile key)

live test ถูกแบ่งเป็นสองชั้นเพื่อให้เราแยก failure ได้:

- “Direct model” บอกเราว่าผู้ให้บริการ/โมเดลสามารถตอบได้จริงหรือไม่ด้วยคีย์ที่กำหนด
- “Gateway smoke” บอกเราว่า pipeline แบบเต็มของ gateway+agent ใช้งานได้กับโมเดลนั้นหรือไม่ (sessions, history, tools, sandbox policy เป็นต้น)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - ไล่รายการโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กต่อโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, alias ของ modern) เพื่อรัน suite นี้จริง; หากไม่ตั้ง มันจะข้ามเพื่อให้ `pnpm test:live` โฟกัสที่ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ allowlist แบบ modern
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist แบบ comma)
  - การกวาดแบบ modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้เป็นค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` สำหรับการกวาด modern แบบครบทั้งหมด หรือจำนวนบวกเพื่อกำหนดเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist แบบ comma)
- แหล่งที่มาของคีย์:
  - ค่าเริ่มต้น: profile store และ fallback จาก env
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับให้ใช้ **profile store** เท่านั้น
- เหตุผลที่มีชั้นนี้:
  - แยก “provider API พัง / คีย์ไม่ถูกต้อง” ออกจาก “pipeline ของ gateway agent พัง”
  - บรรจุ regression ขนาดเล็กและแยกตัวได้ (ตัวอย่าง: โฟลว์ reasoning replay + tool-call ของ OpenAI Responses/Codex Responses)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - หมุนขึ้น in-process gateway
  - สร้าง/patch เซสชัน `agent:dev:*` (แทนที่โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - ได้การตอบกลับที่ “มีความหมาย” (ไม่มี tools)
    - การเรียก tool จริงทำงานได้ (read probe)
    - probe ของ tool เพิ่มเติมแบบทางเลือกทำงานได้ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียด probe (เพื่อให้คุณอธิบาย failure ได้เร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ใน workspace แล้วขอให้เอเจนต์ `read` ไฟล์นั้นและ echo nonce กลับ
  - `exec+read` probe: การทดสอบจะขอให้เอเจนต์ `exec` เพื่อเขียน nonce ลงในไฟล์ชั่วคราว จากนั้น `read` กลับ
  - image probe: การทดสอบแนบ PNG ที่สร้างขึ้น (แมว + รหัสสุ่ม) และคาดว่าโมเดลจะตอบ `cat <CODE>`
  - จุดอ้างอิง implementation: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ allowlist แบบ modern
  - หรือตั้ง `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการแบบ comma) เพื่อจำกัดให้แคบลง
  - การกวาด gateway แบบ modern/all จะใช้เพดาน high-signal ที่คัดสรรไว้เป็นค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` สำหรับการกวาด modern แบบครบทั้งหมด หรือจำนวนบวกเพื่อกำหนดเพดานที่เล็กลง
- วิธีเลือกผู้ให้บริการ (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist แบบ comma)
- probe ของ tool + image เปิดอยู่เสมอใน live test นี้:
  - `read` probe + `exec+read` probe (stress ของ tool)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - โฟลว์ (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + รหัสสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` ด้วย `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parse attachments ไปเป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - embedded agent ส่งต่อข้อความผู้ใช้แบบหลายรูปแบบข้อมูลไปยังโมเดล
    - การยืนยัน: คำตอบมี `cat` + รหัสนั้น (ยอมให้ OCR ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าเครื่องของคุณทดสอบอะไรได้บ้าง (และ `provider/model` id ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLI ในเครื่องอื่น)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้ CLI backend ในเครื่อง โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะแบ็กเอนด์อยู่กับนิยาม `cli-backend.ts` ของ extension เจ้าของนั้น
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - provider/model เริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ CLI backend plugin เจ้าของนั้น
- การแทนที่ (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่งไฟล์แนบรูปภาพจริง (พาธจะถูก inject ลงใน prompt)
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่งพาธไฟล์รูปภาพเป็นอาร์กิวเมนต์ของ CLI แทนการ inject ลง prompt
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่งอาร์กิวเมนต์รูปภาพเมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่ง turn ที่สองและตรวจสอบโฟลว์ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` เพื่อปิดการตรวจสอบความต่อเนื่องในเซสชันเดียวกันแบบ Claude Sonnet -> Opus ซึ่งเปิดอยู่เป็นค่าเริ่มต้น (ตั้งเป็น `1` เพื่อบังคับเปิดเมื่อโมเดลที่เลือกมีเป้าหมายที่สลับได้)

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
- มันรัน live CLI-backend smoke ภายใน image Docker ของ repo ในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จาก extension เจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และถูกแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่านอย่างใดอย่างหนึ่ง: `~/.claude/.credentials.json` พร้อม `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันจะพิสูจน์ `claude -p` โดยตรงใน Docker ก่อน จากนั้นจึงรัน Gateway CLI-backend สอง turn โดยไม่เก็บตัวแปร env ของ Anthropic API key ไว้ lane แบบ subscription นี้จะปิด Claude MCP/tool และ image probe เป็นค่าเริ่มต้น เพราะตอนนี้ Claude คิดค่าบริการการใช้งานจากแอป third-party ผ่าน extra-usage billing แทนขีดจำกัดของแผน subscription ปกติ
- ตอนนี้ live CLI-backend smoke ทดสอบโฟลว์ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: turn ข้อความ, turn จัดประเภทภาพ, แล้วตามด้วยการเรียก MCP `cron` tool ที่ยืนยันผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยัง patch เซสชันจาก Sonnet ไป Opus และยืนยันว่าเซสชันที่ resume แล้วยังจำโน้ตก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบโฟลว์การ bind การสนทนา ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind บทสนทนาแบบ synthetic message-channel ในตำแหน่งเดิม
  - ส่งข้อความติดตามผลแบบปกติบนบทสนทนาเดิมนั้น
  - ยืนยันว่าข้อความติดตามผลนั้นไปลงใน transcript ของเซสชัน ACP ที่ถูก bind แล้ว
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - แชนเนลสังเคราะห์: บริบทการสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- การแทนที่:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- หมายเหตุ:
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route แบบ synthetic ที่ใช้ได้เฉพาะแอดมิน เพื่อให้การทดสอบแนบบริบทของ message-channel ได้โดยไม่แกล้งทำเป็นส่งออกภายนอก
  - เมื่อไม่ได้ตั้ง `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรี agent ภายในของ embedded `acpx` plugin สำหรับ ACP harness agent ที่เลือก

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

สูตร Docker แบบ agent เดียว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- โดยค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agent ที่รองรับทั้งหมดตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` เพื่อทำให้เมทริกซ์แคบลง
- มันจะ source `~/.profile`, จัดเตรียม auth material ของ CLI ที่ตรงกันลงในคอนเทนเนอร์, ติดตั้ง `acpx` ลงใน npm prefix ที่เขียนได้, จากนั้นติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) หากยังไม่มี
- ภายใน Docker ตัวรันจะตั้ง `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` เพื่อให้ acpx คง env var ของผู้ให้บริการจาก profile ที่ถูก source ไว้และพร้อมใช้กับ harness CLI ลูก

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่ plugin เป็นเจ้าของผ่านเมธอด
  `agent` ปกติของ gateway:
  - โหลด bundled `codex` plugin
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `codex/gpt-5.4`
  - ส่ง turn ที่สองไปยังเซสชัน OpenClaw เดิม และยืนยันว่า app-server
    thread สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway เดียวกัน
  - เลือกรัน shell probe แบบยกระดับสองตัวที่ผ่านการทบทวนโดย Guardian: คำสั่งที่ไม่เป็นอันตราย
    ซึ่งควรได้รับอนุมัติ และการอัปโหลด secret ปลอมที่ควรถูก
    ปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `codex/gpt-5.4`
- image probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้ง `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อไม่ให้ Codex
  harness ที่พังผ่านไปได้ด้วยการ fallback ไปยัง PI แบบเงียบ ๆ
- Auth: `OPENAI_API_KEY` จาก shell/profile พร้อมทางเลือกในการคัดลอก
  `~/.codex/auth.json` และ `~/.codex/config.toml`

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
- มันจะ source `~/.profile` ที่ mount มา ส่งผ่าน `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI
  เมื่อมีอยู่, ติดตั้ง `@openai/codex` ลงใน npm
  prefix แบบเขียนได้ที่ mount ไว้, จัดเตรียม source tree แล้วรันเฉพาะ Codex-harness live test
- Docker เปิด image, MCP/tool และ Guardian probe เป็นค่าเริ่มต้น ตั้ง
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อคุณต้องการรันดีบักแบบแคบลง
- Docker ยัง export `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ด้วย ซึ่งตรงกับ
  config ของ live test เพื่อไม่ให้ fallback ของ `openai-codex/*` หรือ PI ซ่อน
  regression ของ Codex harness ได้

### สูตร live ที่แนะนำ

allowlist แบบแคบและ explicit เร็วที่สุดและมีความผันผวนน้อยที่สุด:

- โมเดลเดี่ยว, direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดี่ยว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียก tool ข้ามหลายผู้ให้บริการ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ Antigravity OAuth bridge (endpoint ของเอเจนต์แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI ในเครื่องของคุณ (มี auth + ความแปลกของ tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API แบบโฮสต์ของ Google ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่นึกถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw shell out ไปยังไบนารี `gemini` ในเครื่อง; มันมี auth ของตัวเองและอาจมีพฤติกรรมต่างออกไป (รองรับการสตรีม/tool/ความเหลื่อมของเวอร์ชัน)

## Live: model matrix (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดล CI” แบบตายตัว (live เป็นแบบ opt-in) แต่นี่คือโมเดลที่ **แนะนำ**
ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มีคีย์

### ชุด smoke แบบ modern (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะต้องใช้งานได้ต่อเนื่อง:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.4` (ไม่บังคับ: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยง Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec แบบทางเลือก)

เลือกอย่างน้อยหนึ่งโมเดลต่อ family ของผู้ให้บริการ:

- OpenAI: `openai/gpt-5.4` (หรือ `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบไม่บังคับ (ถ้ามีก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ tools และคุณเปิดใช้งานอยู่หนึ่งตัว)
- Cerebras: `cerebras/`… (หากคุณเข้าถึงได้)
- LM Studio: `lmstudio/`… (ในเครื่อง; การเรียก tool ขึ้นกับโหมด API)

### Vision: การส่งภาพ (ไฟล์แนบ → ข้อความหลายรูปแบบข้อมูล)

รวมอย่างน้อยหนึ่งโมเดลที่รองรับภาพไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (เช่น Claude/Gemini/OpenAI รุ่นที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregator / alternate gateway

หากคุณเปิดใช้คีย์ไว้ เราก็รองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (มีโมเดลหลายร้อยตัว; ใช้ `openclaw models scan` เพื่อหา candidate ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ผู้ให้บริการเพิ่มเติมที่คุณรวมเข้า live matrix ได้ (หากมี creds/config):

- แบบ built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (endpoint แบบกำหนดเอง): `minimax` (cloud/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายามฮาร์ดโค้ด “ทุกโมเดล” ลงในเอกสาร รายการที่ authoritative คือสิ่งที่ `discoverModels(...)` ส่งคืนบนเครื่องของคุณ + คีย์ที่พร้อมใช้งาน

## ข้อมูลรับรอง (ห้ามคอมมิต)

live test ค้นหาข้อมูลรับรองแบบเดียวกับที่ CLI ทำ ผลในทางปฏิบัติคือ:

- หาก CLI ใช้งานได้ live test ก็ควรพบคีย์เดียวกัน
- หาก live test บอกว่า “ไม่มี creds” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- โปรไฟล์ auth รายเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ใน live tests)
- config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- state dir แบบเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้า staged live home เมื่อมีอยู่ แต่ไม่ใช่ store หลักของ profile key)
- การรัน live ในเครื่องจะคัดลอก config ที่ใช้งานอยู่, ไฟล์ `auth-profiles.json` รายเอเจนต์, `credentials/` แบบเดิม และไดเรกทอรี auth ของ external CLI ที่รองรับ ไปยัง test home ชั่วคราวเป็นค่าเริ่มต้น; staged live home จะข้าม `workspace/` และ `sandboxes/` และจะลบการแทนที่พาธ `agents.*.workspace` / `agentDir` ออก เพื่อให้ probe ไม่แตะ workspace จริงของโฮสต์คุณ

หากคุณต้องการพึ่งคีย์จาก env (เช่น export ไว้ใน `~/.profile`) ให้รันการทดสอบในเครื่องหลัง `source ~/.profile` หรือใช้ Docker runner ด้านล่าง (มันสามารถ mount `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียงเสียง)

- การทดสอบ: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `src/agents/byteplus.live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- การแทนที่โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง image, video และ `music_generate` ของ bundled comfy
  - ข้ามแต่ละความสามารถ เว้นแต่มีการกำหนดค่า `models.providers.comfy.<capability>`
  - มีประโยชน์หลังจากเปลี่ยนการส่ง workflow ของ comfy, polling, downloads หรือการลงทะเบียน plugin

## Image generation live

- การทดสอบ: `src/image-generation/runtime.live.test.ts`
- คำสั่ง: `pnpm test:live src/image-generation/runtime.live.test.ts`
- harness: `pnpm test:live:media image`
- ขอบเขต:
  - ไล่ทุก provider plugin สำหรับการสร้างภาพที่ลงทะเบียนไว้
  - โหลดตัวแปร env ของ provider ที่ขาดจาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างอยู่ใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รัน variant การสร้างภาพมาตรฐานผ่านความสามารถ runtime ที่ใช้ร่วมกัน:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- provider แบบ bundled ที่ครอบคลุมในปัจจุบัน:
  - `openai`
  - `google`
  - `xai`
- การทำให้แคบลงแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และละเว้นการแทนที่จาก env-only

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทาง provider สำหรับการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลดตัวแปร env ของ provider จาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างอยู่ใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รัน runtime mode ที่ประกาศไว้ทั้งสองแบบเมื่อมี:
    - `generate` โดยใช้อินพุตเป็น prompt อย่างเดียว
    - `edit` เมื่อ provider ประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของ shared lane ในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยก ไม่ใช่การกวาดร่วมนี้
- การทำให้แคบลงแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และละเว้นการแทนที่จาก env-only

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทาง provider สำหรับการสร้างวิดีโอแบบ bundled ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นเป็นเส้นทาง smoke ที่ปลอดภัยสำหรับ release: provider ที่ไม่ใช่ FAL, คำขอ text-to-video หนึ่งครั้งต่อ provider, prompt กุ้งมังกรหนึ่งวินาที และเพดานการทำงานต่อ provider จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` เป็นค่าเริ่มต้น)
  - ข้าม FAL เป็นค่าเริ่มต้น เพราะ latency จากคิวฝั่ง provider อาจครอบงำเวลา release; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` เพื่อรันโดยชัดเจน
  - โหลดตัวแปร env ของ provider จาก login shell ของคุณ (`~/.profile`) ก่อน probe
  - ใช้ API key แบบ live/env ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น เพื่อไม่ให้ test key เก่าที่ค้างอยู่ใน `auth-profiles.json` มาบดบังข้อมูลรับรองจริงจาก shell
  - ข้าม provider ที่ไม่มี auth/profile/model ที่ใช้งานได้
  - รันเฉพาะ `generate` เป็นค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform mode ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อ provider ประกาศ `capabilities.imageToVideo.enabled` และ provider/model ที่เลือกยอมรับอินพุตภาพในเครื่องแบบ buffer-backed ในการกวาดร่วม
    - `videoToVideo` เมื่อ provider ประกาศ `capabilities.videoToVideo.enabled` และ provider/model ที่เลือกยอมรับอินพุตวิดีโอในเครื่องแบบ buffer-backed ในการกวาดร่วม
  - provider `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `vydra` เพราะ bundled `veo3` รองรับเฉพาะข้อความ และ bundled `kling` ต้องใช้ URL รูปภาพระยะไกล
  - ความครอบคลุม Vydra เฉพาะ provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นจะรัน `veo3` แบบ text-to-video และ lane `kling` ที่ใช้ fixture ของ remote image URL เป็นค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบ live ในปัจจุบัน:
    - `runway` เท่านั้น เมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - provider `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะตอนนี้เส้นทางเหล่านั้นต้องใช้ reference URL แบบระยะไกล `http(s)` / MP4
    - `google` เพราะ lane Gemini/Veo ที่ใช้ร่วมกันในปัจจุบันใช้อินพุตแบบ local buffer-backed และเส้นทางนั้นไม่ถูกรับใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันยังไม่มีหลักประกันการเข้าถึง video inpaint/remix แบบเฉพาะองค์กร
- การทำให้แคบลงแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมทุก provider ในการกวาดค่าเริ่มต้น รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานการทำงานต่อ provider สำหรับ smoke run แบบเข้มงวด
- พฤติกรรม auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile store และละเว้นการแทนที่จาก env-only

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- วัตถุประสงค์:
  - รัน image, music และ video live suite ที่ใช้ร่วมกันผ่าน entrypoint แบบเนทีฟของ repo เพียงจุดเดียว
  - โหลดตัวแปร env ของ provider ที่ขาดจาก `~/.profile` โดยอัตโนมัติ
  - ทำให้แต่ละ suite แคบลงอัตโนมัติไปยัง provider ที่มี auth ใช้งานได้ในปัจจุบันเป็นค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ซ้ำ จึงทำให้พฤติกรรม heartbeat และ quiet mode คงเส้นคงวา
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runner (ตัวเลือกสำหรับการตรวจสอบแบบ "ใช้งานได้บน Linux")

Docker runner เหล่านี้แบ่งเป็นสองกลุ่ม:

- live-model runner: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน image Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount config dir และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากมีการ mount) local entrypoint ที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runner ใช้เพดาน smoke ที่เล็กกว่าเป็นค่าเริ่มต้น เพื่อให้การกวาด Docker แบบเต็มยังทำได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้แทนที่ env เหล่านั้นเมื่อคุณ
  ต้องการสแกนแบบครบใหญ่ขึ้นโดยชัดเจน
- `test:docker:all` จะ build live Docker image หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นใช้ซ้ำกับ live Docker lane ทั้งสอง มันยัง build image ร่วมหนึ่งชุดจาก `scripts/e2e/Dockerfile` ผ่าน `test:docker:e2e-build` และใช้ซ้ำกับ E2E container smoke runner ที่ทดสอบแอปที่ build แล้ว
- container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่าและตรวจสอบเส้นทาง integration ระดับสูง

live-model Docker runner ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทุกตัวที่รองรับเมื่อการรันไม่ได้ถูกทำให้แคบลง) จากนั้นคัดลอกเข้า home ของคอนเทนเนอร์ก่อนเริ่มรัน เพื่อให้ external-CLI OAuth สามารถรีเฟรชโทเค็นได้โดยไม่แก้ไข auth store บนโฮสต์:

- direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, scaffolding เต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง tarball OpenClaw ที่ pack แล้วแบบ global ใน Docker กำหนดค่า OpenAI ผ่านการ onboarding แบบ env-ref พร้อม Telegram เป็นค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้ plugin ติดตั้ง runtime deps ตามต้องการ รัน doctor และรันหนึ่ง mocked OpenAI agent turn ใช้ tarball ที่ build ไว้แล้วซ้ำได้ด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับแชนเนลด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (real stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + stdio MCP child teardown หลัง isolated cron และ one-shot subagent run): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + semantics การรีสตาร์ตของ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- runtime deps ของ bundled plugin: `pnpm test:docker:bundled-channel-deps` จะ build Docker runner image ขนาดเล็กเป็นค่าเริ่มต้น, build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าไปในแต่ละสถานการณ์การติดตั้งบน Linux ใช้ image เดิมซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ build บนโฮสต์หลังจาก build ในเครื่องใหม่แล้วด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่ด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
- ทำให้การทดสอบ runtime deps ของ bundled plugin แคบลงระหว่างการวนงาน โดยปิดสถานการณ์ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ prebuild และใช้ shared built-app image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การแทนที่ image แบบเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังมีสิทธิ์เหนือกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image ที่ใช้ร่วมกันแบบระยะไกล สคริปต์จะ pull image นั้นหากยังไม่มีในเครื่อง การทดสอบ Docker ของ QR และ installer ยังคงใช้ Dockerfile ของตัวเอง เพราะพวกมันตรวจสอบพฤติกรรมของ package/install แทน runtime ของ built-app ที่ใช้ร่วมกัน

Docker runner สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบ read-only และ
จัดเตรียมมันเข้าไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้ runtime
image มีขนาดเล็ก ขณะยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและเอาต์พุต build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี `.build` หรือ
Gradle output ที่เป็น local ของแอป เพื่อไม่ให้ Docker live run เสียเวลาหลายนาทีในการคัดลอก
artifact ที่เฉพาะกับเครื่อง
มันยังตั้ง `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probe เริ่ม
worker ของแชนเนลจริงอย่าง Telegram/Discord/etc. ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเช่นกัน เมื่อคุณต้องการจำกัดหรือแยก coverage ของ gateway
live ออกจาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ OpenClaw gateway พร้อมเปิดใช้งาน OpenAI-compatible HTTP endpoint
จากนั้นเริ่มคอนเทนเนอร์ Open WebUI ที่ปักหมุดเวอร์ชันไว้กับ gateway นั้น ล็อกอินผ่าน
Open WebUI ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดหวังคีย์ของ live model ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` เป็นค่าเริ่มต้น) คือวิธีหลักในการส่งมันเข้าไปในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้กำหนดแน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway
ที่ seed ไว้แล้ว เริ่มคอนเทนเนอร์ตัวที่สองซึ่ง spawn `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นพบบทสนทนาแบบกำหนดเส้นทาง การอ่าน transcript, metadata ของไฟล์แนบ,
พฤติกรรมของ live event queue, การกำหนดเส้นทางการส่งขาออก และการแจ้งเตือนแบบ Claude-style ของแชนเนล +
permission ผ่าน stdio MCP bridge จริง การตรวจสอบการแจ้งเตือนนี้จะตรวจสอบ raw stdio MCP frame โดยตรง เพื่อให้ smoke นี้ตรวจสอบสิ่งที่
bridge ส่งออกจริง ไม่ใช่เพียงสิ่งที่ client SDK ตัวใดตัวหนึ่งบังเอิญเปิดเผย
`test:docker:pi-bundle-mcp-tools` มีลักษณะกำหนดแน่นอนและไม่ต้องใช้
live model key มัน build image Docker ของ repo เริ่ม stdio MCP probe server จริง
ภายในคอนเทนเนอร์ ทำให้เซิร์ฟเวอร์นั้นปรากฏผ่าน embedded Pi bundle
MCP runtime รัน tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงมี
tool แบบ `bundle-mcp` ในขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองมันออก
`test:docker:cron-mcp-cleanup` มีลักษณะกำหนดแน่นอนและไม่ต้องใช้ live model
key มันเริ่ม Gateway ที่ seed ไว้พร้อม stdio MCP probe server จริง รัน
isolated cron turn และ `/subagents spawn` child turn แบบ one-shot จากนั้นตรวจสอบว่า
โปรเซสลูกของ MCP ออกจากระบบหลังแต่ละการรัน

manual ACP plain-language thread smoke (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- ควรเก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug มันอาจจำเป็นอีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นห้ามลบ

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อยืนยันเฉพาะตัวแปร env ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่ mount auth ของ external CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบแคชภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ external CLI ภายใต้ `$HOME` จะถูก mount แบบ read-only ภายใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบแคบจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - แทนที่ด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการ comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อทำให้การรันแคบลง
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่ซ้ำสำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway จะเปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อแทนที่ prompt แบบ nonce-check ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อแทนที่แท็ก image ของ Open WebUI ที่ปักหมุดไว้

## ความถูกต้องของ docs

รันการตรวจสอบ docs หลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจสอบหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้คือ regression ของ “pipeline จริง” โดยไม่ใช้ provider จริง:

- Gateway tool calling (mock OpenAI, gateway + agent loop จริง): `src/gateway/gateway.test.ts` (เคส: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, บังคับทั้งการเขียน config + auth): `src/gateway/gateway.test.ts` (เคส: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำหน้าที่คล้าย “agent reliability evals”:

- mock tool-calling ผ่าน gateway + agent loop จริง (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบ wiring ของเซสชันและผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดอยู่สำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **Decisioning:** เมื่อมี Skills อยู่ใน prompt เอเจนต์เลือก skill ที่ถูกต้องหรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องได้หรือไม่?
- **Compliance:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและปฏิบัติตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่?
- **Workflow contracts:** สถานการณ์หลาย turn ที่ยืนยันลำดับของ tool, การคงอยู่ของประวัติเซสชัน และ sandbox boundary

evaluator ในอนาคตควรคงความกำหนดแน่นอนไว้ก่อนเป็นอันดับแรก:

- scenario runner ที่ใช้ mock provider เพื่อยืนยันการเรียก tool + ลำดับ, การอ่านไฟล์ skill และ wiring ของเซสชัน
- ชุดสถานการณ์ขนาดเล็กที่โฟกัสเรื่อง skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- live eval แบบทางเลือก (opt-in, gated ด้วย env) เฉพาะหลังจากมีชุดทดสอบที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ plugin และแชนเนล)

contract test ตรวจสอบว่า plugin และแชนเนลที่ลงทะเบียนทุกตัวเป็นไปตาม
interface contract ของมัน โดยจะวนผ่าน plugin ที่ค้นพบทั้งหมดและรันชุดของ
การยืนยันด้านรูปร่างและพฤติกรรม unit lane เริ่มต้นของ `pnpm test`
ตั้งใจข้ามไฟล์ seam และ smoke ที่ใช้ร่วมกันเหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิวร่วมของแชนเนลหรือผู้ให้บริการ

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ที่ `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ plugin (id, name, capabilities)
- **setup** - สัญญาของ setup wizard
- **session-binding** - พฤติกรรมของ session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของแชนเนล
- **threading** - การจัดการ thread ID
- **directory** - API สำหรับ directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`

- **status** - status probe ของแชนเนล
- **registry** - รูปร่างของ plugin registry

### Provider contracts

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาของ auth flow
- **auth-choice** - การเลือก/การคัดเลือก auth
- **catalog** - API แค็ตตาล็อกโมเดล
- **discovery** - การค้นพบ plugin
- **loader** - การโหลด plugin
- **runtime** - runtime ของ provider
- **shape** - รูปร่าง/interface ของ plugin
- **wizard** - setup wizard

### เมื่อใดควรรัน

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ plugin

contract test รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ปัญหาผู้ให้บริการ/โมเดลที่ค้นพบจาก live:

- ให้เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub ผู้ให้บริการ หรือจับการแปลงรูปร่างคำขอที่แน่นอน)
- หากเป็นสิ่งที่ต้องพึ่ง live โดยเนื้อแท้ (rate limit, นโยบาย auth) ให้คง live test นั้นให้แคบและเป็น opt-in ผ่านตัวแปร env
- ควรกำหนดเป้าหมายเป็นชั้นที่เล็กที่สุดซึ่งจับบั๊กนั้นได้:
  - บั๊กการแปลง/รีเพลย์คำขอของ provider → direct models test
  - บั๊ก pipeline ด้าน session/history/tool ของ gateway → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- รั้วป้องกันการ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะอนุมาน target ตัวอย่างหนึ่งตัวต่อ SecretRef class จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), จากนั้นยืนยันว่า traversal-segment exec id ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูล target ของ SecretRef ใหม่ที่ใช้ `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้ปรับ `classifyTargetClass` ในการทดสอบนั้น การทดสอบนี้ตั้งใจล้มเหลวเมื่อพบ target id ที่ยังไม่ถูกจัดประเภท เพื่อไม่ให้ class ใหม่ถูกข้ามอย่างเงียบ ๆ
