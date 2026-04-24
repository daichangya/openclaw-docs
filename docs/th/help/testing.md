---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่ม regression สำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ gateway + เอเจนต์
summary: 'ชุดการทดสอบ: ชุดทดสอบ unit/e2e/live, Docker runners และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-24T09:15:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw มีชุดทดสอบ Vitest อยู่ 3 ชุด (unit/integration, e2e, live) และมี Docker runners
จำนวนน้อย เอกสารนี้คือคู่มือ “เราทดสอบกันอย่างไร”:

- แต่ละชุดครอบคลุมอะไรบ้าง (และตั้งใจ **ไม่** ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- live tests ค้นหาข้อมูลรับรองและเลือกโมเดล/providers อย่างไร
- วิธีเพิ่ม regression สำหรับปัญหา model/provider ที่เกิดขึ้นจริง

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไปในแต่ละวัน:

- ชุดตรวจสอบเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันเต็มทุก suite ที่เร็วขึ้นบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- วงรอบ watch ของ Vitest โดยตรง: `pnpm test:watch`
- การกำหนดเป้าหมายไฟล์โดยตรงตอนนี้รองรับ paths ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ความล้มเหลวจุดเดียว
- ไซต์ QA แบบใช้ Docker: `pnpm qa:lab:up`
- QA lane แบบใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้อง tests หรือต้องการความมั่นใจเพิ่ม:

- Coverage gate: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อกำลังดีบัก providers/models จริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (models + gateway tool/image probes): `pnpm test:live`
- กำหนดเป้าหมายไฟล์ live ไฟล์เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การกวาด live models แบบ Docker: `pnpm test:docker:live-models`
  - ตอนนี้แต่ละโมเดลที่เลือกจะรันทั้ง text turn และ file-read-style probe ขนาดเล็ก
    โมเดลที่ metadata ระบุว่ารับอินพุต `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probes เพิ่มเติมเหล่านี้ได้ด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกความล้มเหลวของ provider
  - ความครอบคลุมใน CI: งานรายวัน `OpenClaw Scheduled Live And E2E Checks` และงานแบบ manual
    `OpenClaw Release Checks` ต่างก็เรียก reusable live/E2E workflow พร้อม
    `include_live_suites: true` ซึ่งรวม Docker live model matrix jobs แบบแยก shard ตาม provider
  - สำหรับการ rerun เฉพาะจุดใน CI ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ใหม่ที่มีสัญญาณชัดเจนลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อมกับ `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกแบบ scheduled/release
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง app-server ของ Codex, bind Slack DM จำลองด้วย `/codex bind`, ทดสอบ `/codex fast` และ `/codex permissions` จากนั้นตรวจสอบว่าทั้งการตอบแบบข้อความธรรมดาและไฟล์แนบรูปภาพถูกกำหนดเส้นทางผ่าน native plugin binding แทน ACP
- Moonshot/Kimi cost smoke: เมื่อมี `MOONSHOT_API_KEY` ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ transcript ของ assistant เก็บ `usage.cost` ที่ถูกทำให้เป็นมาตรฐานแล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวกรณีเดียว ควรจำกัด live tests ผ่าน allowlist env vars ที่อธิบายไว้ด้านล่าง

## Runners เฉพาะสำหรับ QA

คำสั่งเหล่านี้อยู่ควบคู่กับ test suites หลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ `Parity gate` จะรันบน PR ที่ตรงเงื่อนไข
และจาก manual dispatch ด้วย mock providers ส่วน `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, live Matrix lane และ live Telegram lane ที่จัดการด้วย Convex เป็นงานขนาน `OpenClaw Release Checks`
จะรัน lanes เดียวกันนี้ก่อนอนุมัติ release

- `pnpm openclaw qa suite`
  - รัน QA scenarios ที่อิง repo โดยตรงบนโฮสต์
  - รันหลาย scenarios ที่เลือกแบบขนานโดยค่าเริ่มต้นด้วย isolated
    gateway workers โดย `qa-channel` มีค่าเริ่มต้นเป็น concurrency 4 (ถูกจำกัดด้วยจำนวน scenario ที่เลือก)
    ใช้ `--concurrency <count>` เพื่อปรับจำนวน workers หรือ `--concurrency 1` สำหรับ lane แบบอนุกรมรุ่นเก่า
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
  - รองรับ provider modes คือ `live-frontier`, `mock-openai` และ `aimock`
    โดย `aimock` จะเริ่ม local AIMock-backed provider server สำหรับการครอบคลุมแบบ experimental ของ fixture และ protocol-mock โดยไม่แทนที่ lane `mock-openai` ที่รับรู้ scenario
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือก scenario แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้ flags สำหรับการเลือก provider/model แบบเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่อ QA auth inputs ที่รองรับและใช้งานได้จริงสำหรับ guest:
    provider keys แบบ env, path ของ QA live provider config และ `CODEX_HOME` เมื่อมี
  - output dirs ต้องอยู่ภายใต้ repo root เพื่อให้ guest เขียนกลับผ่าน mounted workspace ได้
  - เขียน QA report + summary ปกติ พร้อม Multipass logs ลงใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA แบบใช้ Docker สำหรับงาน QA สไตล์ผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ภายใน
    Docker รัน onboarding แบบไม่โต้ตอบด้วย OpenAI API key กำหนดค่า Telegram โดยค่าเริ่มต้น ตรวจสอบว่าการเปิดใช้ Plugin ติดตั้ง runtime dependencies ตามต้องการ รัน doctor และรัน local agent turn หนึ่งครั้งกับ mocked OpenAI endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน packaged-install lane เดียวกันกับ Discord
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจ OpenClaw ที่เผยแพร่แล้วใน Docker รัน installed-package
    onboarding กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นนำ live Telegram QA lane เดิมกลับมาใช้โดยให้แพ็กเกจที่ติดตั้งแล้วเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`
  - ใช้ข้อมูลรับรอง Telegram ผ่าน env หรือแหล่งข้อมูลรับรอง Convex แบบเดียวกับ
    `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติใน CI/release ให้ตั้ง
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI
    Docker wrapper จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ใช้กำหนดแทน
    `OPENCLAW_QA_CREDENTIAL_ROLE` แบบใช้ร่วมกันสำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น workflow แบบ manual สำหรับผู้ดูแลชื่อ
    `NPM Telegram Beta E2E` มันจะไม่รันตอน merge โดย workflow นี้ใช้
    environment `qa-live-shared` และ Convex CI credential leases
- `pnpm test:docker:bundled-channel-deps`
  - pack และติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม Gateway
    โดยตั้งค่า OpenAI แล้ว จากนั้นเปิดใช้ bundled channel/plugins ผ่านการแก้ไข config
  - ตรวจสอบว่าการค้นพบระหว่าง setup ทำให้ runtime dependencies ของ Plugin ที่ยังไม่ได้กำหนดค่า
    ยังคงไม่ถูกติดตั้ง การรัน Gateway หรือ doctor ครั้งแรกหลังตั้งค่า
    จะติดตั้ง runtime dependencies ของแต่ละ bundled Plugin ตามต้องการ และการรีสตาร์ตครั้งที่สองจะไม่ติดตั้ง dependencies ที่ถูกเปิดใช้งานไปแล้วซ้ำ
  - ยังติดตั้ง npm baseline รุ่นเก่าที่รู้จัก เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ซ่อม runtime dependencies ของ bundled channel ได้โดยไม่ต้องมีการซ่อม postinstall จาก harness
- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะ local AIMock provider server สำหรับ protocol smoke testing โดยตรง
- `pnpm openclaw qa matrix`
  - รัน Matrix live QA lane กับ Tuwunel homeserver แบบใช้ Docker ที่ใช้แล้วทิ้ง
  - โฮสต์ QA นี้ในปัจจุบันมีไว้สำหรับ repo/dev เท่านั้น การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่มาพร้อม
    `qa-lab` ดังนั้นจึงไม่เปิด `openclaw qa`
  - checkout ของ repo จะโหลด bundled runner โดยตรง ไม่ต้องมีขั้นตอนติดตั้ง Plugin แยก
  - จัดเตรียมผู้ใช้ Matrix ชั่วคราวสามราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง จากนั้นเริ่ม QA gateway child โดยใช้ Matrix Plugin จริงเป็น SUT transport
  - ใช้ Tuwunel image รุ่น stable ที่ปักหมุดไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` โดยค่าเริ่มต้น กำหนดแทนด้วย `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อต้องการทดสอบ image อื่น
  - Matrix ไม่เปิดเผย shared credential-source flags เพราะ lane นี้จัดเตรียมผู้ใช้ชั่วคราวในเครื่องเอง
  - เขียน Matrix QA report, summary, artifact ของ observed-events และ combined stdout/stderr output log ลงใต้ `.artifacts/qa-e2e/...`
- `pnpm openclaw qa telegram`
  - รัน Telegram live QA lane กับกลุ่มส่วนตัวจริงโดยใช้ driver และ SUT bot tokens จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` โดย group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ pooled credentials แบบใช้ร่วมกัน ใช้ env mode เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled leases
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน และ SUT bot ต้องมี Telegram username
  - เพื่อให้การสังเกตแบบ bot-to-bot มีเสถียรภาพ ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบว่า driver bot สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียน Telegram QA report, summary และ artifact ของ observed-messages ลงใต้ `.artifacts/qa-e2e/...` โดย scenarios แบบตอบกลับจะรวม RTT ตั้งแต่ driver ส่งคำขอจนสังเกตเห็นการตอบกลับจาก SUT

live transport lanes ใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ transports ใหม่เบี่ยงเบน:

`qa-channel` ยังคงเป็น synthetic QA suite แบบกว้าง และไม่ใช่ส่วนหนึ่งของ live
transport coverage matrix

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### ข้อมูลรับรอง Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบ exclusive จากพูลที่รองรับด้วย Convex, ส่ง heartbeat
ให้ lease นั้นขณะ lane กำลังทำงาน และปล่อย lease เมื่อปิดการทำงาน

โครงสร้างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, เป็น `maintainer` ในกรณีอื่น)

ตัวแปร env แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ `http://` บน loopback สำหรับการพัฒนาในเครื่องเท่านั้น

โดยทั่วไป `OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://`

คำสั่งผู้ดูแลสำหรับจัดการ (เพิ่ม/ลบ/แสดงรายการในพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้ในสคริปต์และยูทิลิตีของ CI

สัญญาปลายทางเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (ใช้ maintainer secret เท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ใช้ maintainer secret เท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - การป้องกัน lease ที่ยัง active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ใช้ maintainer secret เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางเข้า QA

การเพิ่มช่องทางเข้าไปในระบบ QA แบบ Markdown ต้องมีเพียงสองสิ่งเท่านั้น:

1. transport adapter สำหรับช่องทางนั้น
2. scenario pack ที่ทดสอบสัญญาของช่องทางนั้น

อย่าเพิ่ม root คำสั่ง QA ระดับบนตัวใหม่ หากโฮสต์ `qa-lab` แบบใช้ร่วมกันสามารถ
เป็นเจ้าของโฟลว์นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มและปิด suite
- worker concurrency
- การเขียน artifacts
- การสร้างรายงาน
- การรัน scenario
- compatibility aliases สำหรับ scenarios `qa-channel` รุ่นเก่า

runner plugins เป็นเจ้าของสัญญาการขนส่ง:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธี inject เหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcripts และสถานะ transport แบบ normalized
- วิธีรัน actions ที่รองรับด้วย transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำสำหรับการรับช่องทางใหม่คือ:

1. ให้ `qa-lab` ยังคงเป็นเจ้าของ root `qa` ที่ใช้ร่วมกัน
2. ติดตั้ง transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน runner plugin หรือ channel harness
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน
   โดย runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export `qaRunnerCliRegistrations` array ที่ตรงกันจาก `runtime-api.ts`
   ให้ `runtime-api.ts` มีขนาดเบา; การรัน CLI และ runner แบบ lazy ควรอยู่หลัง entrypoints แยกกัน
5. เขียนหรือดัดแปลง Markdown scenarios ภายใต้ไดเรกทอรีแบบ themed ใน `qa/scenarios/`
6. ใช้ generic scenario helpers สำหรับ scenarios ใหม่
7. คง compatibility aliases ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ repo กำลังทำ migration แบบตั้งใจ

กฎการตัดสินใจมีความเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นอยู่กับ channel transport เพียงตัวเดียว ให้เก็บไว้ใน runner plugin หรือ plugin harness ของตัวนั้น
- หาก scenario ต้องการ capability ใหม่ที่ใช้ได้มากกว่าหนึ่งช่องทาง ให้เพิ่ม generic helper แทนการเพิ่มสาขาเฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้คง scenario นั้นเป็นแบบ transport-specific และระบุให้ชัดเจนในสัญญาของ scenario

ชื่อ generic helper ที่แนะนำสำหรับ scenarios ใหม่คือ:

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

compatibility aliases ยังคงมีให้ใช้สำหรับ scenarios ที่มีอยู่แล้ว รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งานช่องทางใหม่ควรใช้ชื่อ generic helper
compatibility aliases มีไว้เพื่อหลีกเลี่ยงการ migration แบบ flag day ไม่ใช่เพื่อเป็นต้นแบบสำหรับ
การเขียน scenario ใหม่

## Test suites (อะไรทำงานที่ไหน)

ให้คิดถึง suites เหล่านี้ว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (และความเปราะบาง/ต้นทุนที่เพิ่มขึ้นด้วย)

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันแบบไม่กำหนดเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย multi-project shards เป็น per-project configs สำหรับการจัดตารางขนาน
- ไฟล์: inventories ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และ `ui` node tests ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - pure unit tests
  - in-process integration tests (gateway auth, routing, tooling, parsing, config)
  - deterministic regressions สำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
    <AccordionGroup>
    <Accordion title="โปรเจกต์, shards และ scoped lanes"> - การรัน `pnpm test` แบบไม่กำหนดเป้าหมายจะใช้ shard configs ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนการใช้ native root-project process ขนาดใหญ่เพียงตัวเดียว วิธีนี้ลด peak RSS บนเครื่องที่มีโหลดสูงและป้องกันไม่ให้งาน auto-reply/extension ไปแย่งทรัพยากรจาก suites อื่นที่ไม่เกี่ยวข้อง - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์จาก `vitest.config.ts` ระดับ root แบบเนทีฟ เพราะวงรอบ watch แบบ multi-shard ไม่ค่อยใช้งานได้จริง - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะกำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีแบบชัดเจนผ่าน scoped lanes ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายต้นทุนการเริ่มต้นของ root project เต็มชุด - `pnpm test:changed` จะขยาย changed git paths ไปยัง scoped lanes เดียวกันเมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้สะอาด ส่วนการแก้ไข config/setup จะย้อนกลับไปใช้การ rerun แบบกว้างของ root-project - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานที่แคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata และ tooling จากนั้นรัน lanes ของ typecheck/lint/test ที่ตรงกัน การเปลี่ยนแปลงใน public Plugin SDK และ plugin-contract จะรวม extension validation pass หนึ่งครั้ง เพราะ extensions พึ่งพาสัญญาระดับ core เหล่านั้น การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบ version/config/root-dependency แบบเจาะจงแทน full suite พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package ที่อยู่นอกฟิลด์เวอร์ชันระดับบนสุด - import-light unit tests จาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ utility ล้วนที่คล้ายกัน จะถูกกำหนดเส้นทางผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ส่วนไฟล์ที่มีสถานะ/มี runtime หนักจะยังอยู่ใน lanes เดิม - ไฟล์ source helper บางส่วนของ `plugin-sdk` และ `commands` ยังแมป changed-mode runs ไปยัง sibling tests แบบชัดเจนใน light lanes เหล่านั้นด้วย เพื่อให้การแก้ helper ไม่ต้อง rerun heavy suite ทั้งชุดของไดเรกทอรีนั้น - `auto-reply` มีบัคเก็ตเฉพาะสามชุด: top-level core helpers, top-level `reply.*` integration tests และ subtree `src/auto-reply/reply/**` วิธีนี้ช่วยแยกงาน harness ของ reply ที่หนักที่สุดออกจาก tests ราคาถูกอย่าง status/chunk/token
    </Accordion>

      <Accordion title="ความครอบคลุมของ embedded runner">
        - เมื่อคุณเปลี่ยนอินพุตการค้นพบ message-tool หรือบริบท runtime ของ compaction
          ให้คงความครอบคลุมไว้ทั้งสองระดับ
        - เพิ่ม focused helper regressions สำหรับขอบเขต pure routing และ normalization
        - รักษาชุด integration ของ embedded runner ให้แข็งแรง:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
        - suites เหล่านี้ตรวจสอบว่า scoped ids และพฤติกรรม compaction ยังคงไหล
          ผ่านเส้นทาง `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะ helper เพียงอย่างเดียวไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับเส้นทาง integration เหล่านี้
      </Accordion>

      <Accordion title="ค่าเริ่มต้นของ Vitest pool และ isolation">
        - config พื้นฐานของ Vitest ใช้ค่าเริ่มต้นเป็น `threads`
        - config Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` ตายตัว และใช้
          non-isolated runner ข้าม root projects, e2e และ live configs
        - root UI lane ยังคงมี `jsdom` setup และ optimizer ของตัวเอง แต่ทำงานบน
          non-isolated runner ที่ใช้ร่วมกันเช่นกัน
        - แต่ละ shard ของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
          ชุดเดียวกันจาก shared Vitest config
        - `scripts/run-vitest.mjs` จะเพิ่ม `--no-maglev` สำหรับ Vitest child Node
          processes โดยค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่
          ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับ
          พฤติกรรม V8 แบบปกติ
      </Accordion>

      <Accordion title="การวนพัฒนาในเครื่องแบบรวดเร็ว">
        - `pnpm changed:lanes` แสดงว่า diff หนึ่งชุดจะกระตุ้น architectural lanes ใดบ้าง
        - pre-commit hook มีไว้สำหรับการจัดรูปแบบเท่านั้น มันจะ restage ไฟล์ที่ถูกจัดรูปแบบ
          และไม่รัน lint, typecheck หรือ tests
        - ให้รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่องานหรือ push เมื่อคุณ
          ต้องการ smart local gate การเปลี่ยนแปลงใน public Plugin SDK และ plugin-contract
          จะรวม extension validation pass หนึ่งครั้ง
        - `pnpm test:changed` จะกำหนดเส้นทางผ่าน scoped lanes เมื่อ changed paths
          แมปได้ชัดเจนไปยัง suite ที่เล็กกว่า
        - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทางเดียวกัน
          เพียงแต่ใช้เพดาน worker ที่สูงกว่า
        - auto-scaling ของ workers ในเครื่องมีความอนุรักษ์นิยมโดยตั้งใจ และจะถอยลง
          เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกันจะสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
        - config พื้นฐานของ Vitest ทำเครื่องหมาย projects/config files เป็น
          `forceRerunTriggers` เพื่อให้ changed-mode reruns ยังถูกต้องเมื่อสายการต่อ test เปลี่ยนไป
        - config ยังคงเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` บน
          โฮสต์ที่รองรับ; ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
          ตำแหน่งแคชแบบชัดเจนเพียงแห่งเดียวสำหรับการ profiling โดยตรง
      </Accordion>

      <Accordion title="การดีบักประสิทธิภาพ">
        - `pnpm test:perf:imports` เปิดใช้การรายงานระยะเวลาการ import ของ Vitest พร้อม
          ผลลัพธ์ import-breakdown
        - `pnpm test:perf:imports:changed` จำกัดมุมมองการ profiling แบบเดียวกันไปยัง
          ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
        - เมื่อ hot test หนึ่งตัวยังคงใช้เวลาส่วนใหญ่ไปกับ startup imports,
          ให้เก็บ dependencies ที่หนักไว้หลัง seam แคบ ๆ แบบ local `*.runtime.ts` และ mock seam นั้นโดยตรง แทนการ deep-import ตัวช่วย runtime เพียงเพื่อส่งผ่านต่อให้ `vi.mock(...)`
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` จะเปรียบเทียบ
          `test:changed` ที่ถูกกำหนดเส้นทางแล้วกับเส้นทาง native root-project สำหรับ diff ที่ commit นั้น และพิมพ์ทั้ง wall time และ macOS max RSS
        - `pnpm test:perf:changed:bench -- --worktree` จะ benchmark dirty tree ปัจจุบันโดยกำหนดเส้นทาง changed file list ผ่าน
          `scripts/test-projects.mjs` และ root Vitest config
        - `pnpm test:perf:profile:main` จะเขียน main-thread CPU profile สำหรับ
          overhead จากการเริ่มต้นและ transform ของ Vitest/Vite
        - `pnpm test:perf:profile:runner` จะเขียน runner CPU+heap profiles สำหรับ
          unit suite โดยปิด file parallelism
      </Accordion>
    </AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับให้ใช้หนึ่ง worker
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับเคลื่อนการ churn ของข้อความ gateway, memory และ large-payload แบบสังเคราะห์ผ่านเส้นทาง diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วยการเก็บถาวร diagnostic stability bundle
  - ตรวจสอบว่า recorder ยังคงมีขอบเขต, ตัวอย่าง RSS แบบสังเคราะห์ยังอยู่ต่ำกว่างบประมาณแรงกดดัน และความลึกของคิวรายเซสชันระบายกลับสู่ศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แบบแคบสำหรับติดตาม regression ด้านเสถียรภาพ ไม่ใช่ตัวแทนของ Gateway suite แบบเต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ bundled-plugin E2E tests ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` กับ `isolate: false` เช่นเดียวกับส่วนอื่นของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมด silent โดยค่าเริ่มต้นเพื่อลด overhead จาก console I/O
- overrides ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน workers (จำกัดไว้ที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดผลลัพธ์ console แบบละเอียดกลับมา
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, node pairing และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อ pipeline เปิดใช้งาน)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนที่เคลื่อนไหวมากกว่า unit tests (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรมไฟล์ระบบที่ remote เป็นตัวหลักผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เป็นแบบเลือกใช้เท่านั้น; ไม่ใช่ส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี local `openshell` CLI พร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยก จากนั้นทำลาย test gateway และ sandbox
- overrides ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้ test นี้เมื่อรัน broader e2e suite ด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง CLI binary หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (providers จริง + models จริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ bundled-plugin live tests ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของ provider, ความแปลกของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่เสถียรสำหรับ CI โดยเจตนา (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, โควตา, การล่ม)
  - มีค่าใช้จ่าย / ใช้ rate limits
  - ควรรันแบบจำกัดขอบเขตแทนการรัน “ทั้งหมด”
- การรันแบบ live จะ source `~/.profile` เพื่อดึง API keys ที่หายไป
- โดยค่าเริ่มต้น การรันแบบ live ยังคงแยก `HOME` และคัดลอก config/auth material ไปยัง temp test home เพื่อไม่ให้ unit fixtures ไปเปลี่ยน `~/.openclaw` จริงของคุณ
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live tests ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` มีค่าเริ่มต้นเป็นโหมดที่เงียบขึ้น: มันยังคงแสดงความคืบหน้า `[live] ...` แต่ซ่อนข้อความเพิ่มเติมเกี่ยวกับ `~/.profile` และปิดเสียง gateway bootstrap logs/Bonjour chatter ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ logs ตอนเริ่มต้นแบบเต็มกลับคืนมา
- การหมุน API key (เฉพาะตาม provider): ตั้ง `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override เฉพาะ live ผ่าน `OPENCLAW_LIVE_*_KEY`; tests จะ retry เมื่อเจอการตอบกลับแบบ rate limit
- ผลลัพธ์ progress/heartbeat:
  - ตอนนี้ live suites จะส่ง progress lines ไปยัง stderr เพื่อให้มองเห็นได้ชัดว่าการเรียก provider ที่ใช้เวลานานยังทำงานอยู่ แม้การจับ console ของ Vitest จะอยู่ในโหมดเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้ progress lines ของ provider/gateway ไหลออกมาทันทีระหว่างการรันแบบ live
  - ปรับ heartbeats ของ direct-model ได้ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeats ของ gateway/probe ได้ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ไหน?

ใช้ตารางตัดสินใจนี้:

- แก้ไขตรรกะ/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนไปมาก)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบ live (แตะเครือข่าย)

สำหรับ live model matrix, CLI backend smokes, ACP smokes, Codex app-server
harness และ media-provider live tests ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการข้อมูลรับรองสำหรับการรันแบบ live — ดู
[การทดสอบ — live suites](/th/help/testing-live)

## Docker runners (ตัวเลือก "ใช้งานได้ใน Linux")

Docker runners เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ตรงกับ profile-key ภายใน repo Docker image (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount local config dir และ workspace ของคุณ (และ source `~/.profile` หากถูก mount) ส่วน entrypoints ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners มีค่าเริ่มต้นเป็น smoke cap ที่เล็กลงเพื่อให้การกวาด Docker เต็มชุดยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12`, และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` กำหนดแทน env vars เหล่านี้เมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่านี้อย่างชัดเจน
- `test:docker:all` จะสร้าง live Docker image หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นนำกลับมาใช้ซ้ำสำหรับ live Docker lanes ทั้งสอง นอกจากนี้ยังสร้าง shared image หนึ่งตัวจาก `scripts/e2e/Dockerfile` ผ่าน `test:docker:e2e-build` และใช้ซ้ำสำหรับ E2E container smoke runners ที่ทดสอบแอปที่ build แล้ว
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูต containers จริงหนึ่งตัวหรือมากกว่า และตรวจสอบเส้นทาง integration ระดับสูงกว่า

live-model Docker runners ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปยัง home ภายใน container ก่อนการรัน เพื่อให้ external-CLI OAuth สามารถรีเฟรช tokens ได้โดยไม่ไปแก้ไข host auth store:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, scaffolding เต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker กำหนดค่า OpenAI ผ่าน env-ref onboarding พร้อม Telegram เป็นค่าเริ่มต้น ตรวจสอบว่า doctor ซ่อม runtime deps ของ Plugin ที่ถูกเปิดใช้งาน และรัน mocked OpenAI agent turn หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าได้ด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build ฝั่งโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` จะ pack tree ปัจจุบัน ติดตั้งด้วย `bun install -g` ใน home ที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` คืน bundled image providers แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build ฝั่งโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache หนึ่งชุดระหว่าง root, update และ direct-npm containers ของมัน โดย update smoke ใช้ npm `latest` เป็น stable baseline ตามค่าเริ่มต้นก่อนอัปเกรดไปยัง candidate tarball ส่วนการตรวจสอบ installer แบบ non-root จะคง npm cache ที่แยกออกมาเพื่อไม่ให้ cache entries ที่ root เป็นเจ้าของมาปกปิดพฤติกรรมการติดตั้งในระดับผู้ใช้ ตั้ง `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache ของ root/update/direct-npm ซ้ำระหว่างการ rerun ในเครื่อง
- Install Smoke CI ข้าม direct-npm global update ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; หากต้องการความครอบคลุมของ `npm install -g` โดยตรง ให้รันสคริปต์ในเครื่องโดยไม่ตั้ง env นี้
- Gateway networking (สอง containers, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) จะรัน mocked OpenAI server ผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ provider schema reject และตรวจสอบว่ารายละเอียดดิบปรากฏใน Gateway logs
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (real stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + stdio MCP child teardown หลัง isolated cron และ one-shot subagent runs): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + `/plugin` alias + Claude-bundle restart semantics): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` จะสร้าง Docker runner image ขนาดเล็กโดยค่าเริ่มต้น สร้างและ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าไปในแต่ละ Linux install scenario ใช้ image ซ้ำได้ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ rebuild ฝั่งโฮสต์หลัง local build ใหม่ ๆ ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่แล้วด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
- จำกัด bundled plugin runtime deps ขณะวนแก้โดยปิด scenarios ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ prebuild และใช้ shared built-app image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

suite-specific image overrides เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังคงมีลำดับความสำคัญสูงกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง remote shared image สคริปต์จะ pull image นั้นหากยังไม่มีในเครื่อง ส่วน QR และ installer Docker tests ยังคงใช้ Dockerfiles ของตัวเอง เพราะมันทดสอบพฤติกรรมของ package/install แทนที่จะเป็น shared built-app runtime

live-model Docker runners ยัง bind-mount checkout ปัจจุบันแบบ read-only และ
stage เข้าไปยัง workdir ชั่วคราวภายใน container วิธีนี้ทำให้ runtime
image ยังคงขนาดเล็ก ขณะที่ยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตัว
ขั้นตอนการ staging จะข้าม local-only caches ขนาดใหญ่และผลลัพธ์การ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี `.build` หรือ
Gradle output ที่เป็นของแอปในเครื่อง ดังนั้น Docker live runs จะไม่เสียเวลาหลายนาทีไปกับการคัดลอก
artifacts ที่ผูกกับเครื่องเฉพาะ
นอกจากนี้ยังตั้ง `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probes เริ่ม
workers ของช่องทางจริงอย่าง Telegram/Discord/อื่น ๆ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น gateway
live coverage จาก Docker lane นี้
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
OpenClaw gateway container โดยเปิดใช้ OpenAI-compatible HTTP endpoints,
เริ่ม Open WebUI container รุ่นที่ปักหมุดไว้ให้ชี้ไปยัง gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default` จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
Open WebUI image และ Open WebUI เองอาจต้องทำ cold-start setup ให้เสร็จ
lane นี้คาดว่าจะมี live model key ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(ค่าเริ่มต้น `~/.profile`) คือวิธีหลักในการส่งผ่านค่านั้นในการรันแบบ Dockerized
เมื่อรันสำเร็จจะพิมพ์ JSON payload ขนาดเล็กประมาณ `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic โดยตั้งใจ และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันจะบูต seeded Gateway
container เริ่ม container ตัวที่สองที่ spawn `openclaw mcp serve` จากนั้น
ตรวจสอบ routed conversation discovery, transcript reads, attachment metadata,
พฤติกรรมของ live event queue, outbound send routing และ Claude-style channel +
permission notifications ผ่าน stdio MCP bridge จริง การตรวจสอบ notification
จะสำรวจ raw stdio MCP frames โดยตรง ดังนั้น smoke นี้จึงตรวจสอบสิ่งที่ bridge ส่งออกจริง
ไม่ใช่เพียงสิ่งที่ client SDK ใด SDK หนึ่งบังเอิญแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` เป็นแบบ deterministic และไม่ต้องใช้ live
model key มันจะ build repo Docker image, เริ่ม real stdio MCP probe server
ภายใน container, materialize เซิร์ฟเวอร์นั้นผ่าน embedded Pi bundle
MCP runtime, รัน tool แล้วตรวจสอบว่า `coding` และ `messaging` คง
tools ของ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` จะกรองออก
`test:docker:cron-mcp-cleanup` เป็นแบบ deterministic และไม่ต้องใช้ live model
key มันจะเริ่ม seeded Gateway พร้อม real stdio MCP probe server รัน
isolated cron turn และ `/subagents spawn` one-shot child turn จากนั้นตรวจสอบว่า
MCP child process ออกจากระบบหลังการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่อยู่ใน CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- ให้เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug มันอาจจำเป็นอีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบทิ้ง

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) ถูก mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) ถูก mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) ถูก mount ไปที่ `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source มาจาก `OPENCLAW_PROFILE_FILE` โดยใช้ config/workspace dirs ชั่วคราวและไม่มีการ mount external CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) ถูก mount ไปที่ `/home/node/.npm-global` สำหรับการแคช CLI installs ภายใน Docker
- external CLI auth dirs/files ใต้ `$HOME` จะถูก mount แบบ read-only ใต้ `/host-auth...` แล้วคัดลอกเข้าไปยัง `/home/node/...` ก่อนเริ่ม tests
  - dirs เริ่มต้น: `.minimax`
  - files เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันแบบจำกัด provider จะ mount เฉพาะ dirs/files ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - กำหนดแทนด้วยตนเองได้ผ่าน `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ `openclaw:local-live` image ที่มีอยู่แล้วซ้ำสำหรับการ rerun ที่ไม่จำเป็นต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลรับรองมาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อกำหนดแทน nonce-check prompt ที่ใช้ใน Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อกำหนดแทน Open WebUI image tag ที่ปักหมุดไว้

## การตรวจสอบเอกสาร

รัน docs checks หลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchors ภายในหน้าแบบเต็มของ Mintlify เมื่อต้องการตรวจสอบหัวข้อในหน้าเพิ่มเติมด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้เป็น regressions แบบ “ไปป์ไลน์จริง” โดยไม่ต้องใช้ providers จริง:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (เคส: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับ auth): `src/gateway/gateway.test.ts` (เคส: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งมีลักษณะคล้าย “agent reliability evals”:

- Mock tool-calling ผ่าน gateway + agent loop จริง (`src/gateway/gateway.test.ts`)
- End-to-end wizard flows ที่ตรวจสอบการเดินสายของเซสชันและผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **Decisioning:** เมื่อ Skills ถูกแสดงใน prompt เอเจนต์เลือก Skill ที่ถูกต้อง (หรือหลีกเลี่ยง Skills ที่ไม่เกี่ยวข้อง) หรือไม่?
- **Compliance:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่จำเป็นหรือไม่?
- **Workflow contracts:** สถานการณ์หลายเทิร์นที่ตรวจสอบลำดับของ tools, การส่งต่อประวัติเซสชัน และขอบเขตของ sandbox

evals ในอนาคตควรเริ่มจาก deterministic ก่อน:

- scenario runner ที่ใช้ mock providers เพื่อยืนยันการเรียก tools + ลำดับ, การอ่านไฟล์ skill และการเดินสายของเซสชัน
- ชุด scenarios ขนาดเล็กที่เน้น skills (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- live evals แบบไม่บังคับ (เลือกใช้เอง, gated ด้วย env) เฉพาะหลังจากมี suite ที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ Plugin และ channel)

Contract tests ใช้ตรวจสอบว่า Plugin และ channel ที่ลงทะเบียนไว้ทุกตัวเป็นไปตาม
interface contract ของมัน โดยจะวนผ่าน plugins ที่ค้นพบทั้งหมดและรันชุดการยืนยัน
ด้านรูปร่างและพฤติกรรม `pnpm test` unit lane ตามค่าเริ่มต้นตั้งใจข้าม shared seam และ smoke files เหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิวของ channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- ทุก contracts: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - สัญญาของวิซาร์ดตั้งค่า
- **session-binding** - พฤติกรรมการ bind เซสชัน
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - action handlers ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - API ของ directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - probes สำหรับสถานะช่องทาง
- **registry** - รูปร่างของ registry ของ Plugin

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาของโฟลว์ auth
- **auth-choice** - การเลือก/คัดเลือก auth
- **catalog** - API ของ model catalog
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - วิซาร์ดตั้งค่า

### เมื่อใดควรรัน

- หลังจากเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังจากเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลังจาก refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากทำได้ (mock/stub provider หรือจับการแปลงรูป request ที่แน่นอน)
- หากเป็นปัญหาที่เป็น live-only โดยเนื้อแท้ (rate limits, auth policies) ให้คง live test ไว้ให้แคบและเลือกใช้ผ่าน env vars
- ควรกำหนดเป้าหมายไปยังชั้นที่เล็กที่สุดที่จับบั๊กนั้นได้:
  - บั๊กการแปลง/เล่นซ้ำ request ของ provider → direct models test
  - บั๊กใน gateway session/history/tool pipeline → gateway live smoke หรือ CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะอนุมาน sampled target หนึ่งรายการต่อ SecretRef class จาก registry metadata (`listSecretTargetRegistryEntries()`), แล้วตรวจสอบว่า traversal-segment exec ids ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูลเป้าหมาย SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts`, ให้อัปเดต `classifyTargetClass` ใน test นั้น test นี้ตั้งใจให้ล้มเหลวเมื่อเจอ target ids ที่ยังไม่ได้จัดประเภท เพื่อไม่ให้ classes ใหม่ถูกข้ามไปอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบแบบ live](/th/help/testing-live)
- [CI](/th/ci)
