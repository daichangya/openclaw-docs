---
read_when:
    - การทำสคริปต์หรือดีบักเบราว์เซอร์ของเอเจนต์ผ่าน Control API ภายในเครื่อง
    - กำลังมองหาข้อมูลอ้างอิง CLI `openclaw browser`
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วย snapshots และ refs
summary: Control API บนเบราว์เซอร์ของ OpenClaw, ข้อมูลอ้างอิง CLI และการดำเนินการแบบสคริปต์
title: Control API บนเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-24T09:35:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา ดูที่ [Browser](/th/tools/browser)
หน้านี้เป็นข้อมูลอ้างอิงสำหรับ HTTP API ควบคุมภายในเครื่อง, CLI `openclaw browser`
และรูปแบบการทำสคริปต์ (snapshots, refs, waits, debug flows)

## Control API (ทางเลือก)

สำหรับการเชื่อมต่อภายในเครื่องเท่านั้น Gateway จะเปิดเผย HTTP API แบบ loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- snapshot/ภาพหน้าจอ: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- ฮุก: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รองรับ `?profile=<name>`

หากมีการตั้งค่าการยืนยันตัวตน Gateway แบบ shared-secret เส้นทาง HTTP ของ browser ก็ต้องยืนยันตัวตนด้วยเช่นกัน:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth โดยใช้รหัสผ่านนั้น

หมายเหตุ:

- Browser API แบบ loopback ที่แยกอิสระนี้ **ไม่** รองรับ trusted-proxy หรือ
  เฮดเดอร์ข้อมูลระบุตัวตนจาก Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy`, เส้นทาง browser แบบ loopback
  เหล่านี้จะไม่สืบทอดโหมดที่มีข้อมูลระบุตัวตนดังกล่าว; ควรจำกัดไว้ที่ loopback เท่านั้น

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบระดับเส้นทางและ
ความล้มเหลวจากนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จักค่า
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalize หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดด้วยการกำหนดค่า
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบแบตช์ขัดแย้งกับเป้าหมายของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action นี้ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวขณะรันอื่น ๆ อาจยังคงตอบกลับเป็น `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

ฟีเจอร์บางอย่าง (navigate/act/AI snapshot/role snapshot, ภาพหน้าจอของ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งกลับ
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังทำงานได้โดยไม่ต้องมี Playwright:

- ARIA snapshots
- ภาพหน้าจอหน้าเว็บสำหรับ browser `openclaw` ที่จัดการอยู่ เมื่อมี WebSocket
  CDP ต่อแท็บให้ใช้งาน
- ภาพหน้าจอหน้าเว็บสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบอิง ref ของ `existing-session` (`--ref`) จากเอาต์พุต snapshot

สิ่งที่ยังคงต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- ภาพหน้าจอ element ด้วย CSS selector (`--element`)
- การ export PDF ของ browser แบบเต็มรูปแบบ

ภาพหน้าจอ element จะปฏิเสธ `--full-page` เช่นกัน; เส้นทางจะตอบกลับว่า `fullPage is
not supported for element screenshots`

หากคุณพบ `Playwright is not available in this gateway build` ให้ซ่อมแซม
runtime dependency ของ Plugin browser ที่ bundled ไว้เพื่อให้มีการติดตั้ง `playwright-core`
แล้วจึงรีสตาร์ต gateway สำหรับการติดตั้งแบบแพ็กเกจ ให้รัน `openclaw doctor --fix`
สำหรับ Docker ให้ติดตั้ง Chromium browser binaries เพิ่มเติมตามที่แสดงด้านล่าง

#### การติดตั้ง Playwright ใน Docker

หาก Gateway ของคุณทำงานใน Docker ให้หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ให้ใช้ CLI ที่ bundled มาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการให้การดาวน์โหลด browser คงอยู่ ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (ตัวอย่างเช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับ browser ที่อิง Chromium ผ่าน CDP การกระทำขั้นสูง (click/type/snapshot/PDF) ทำผ่าน Playwright บน CDP; เมื่อไม่มี Playwright จะใช้งานได้เฉพาะการดำเนินการที่ไม่ต้องใช้ Playwright เอเจนต์จะเห็นอินเทอร์เฟซที่เสถียรเพียงหนึ่งเดียว ในขณะที่ browser และโปรไฟล์แบบ local/remote สามารถสลับเปลี่ยนอยู่ด้านล่างได้อย่างอิสระ

## ข้อมูลอ้างอิง CLI แบบรวดเร็ว

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อระบุโปรไฟล์ที่ต้องการ และ `--json` สำหรับเอาต์พุตแบบอ่านได้โดยเครื่อง

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ, แท็บ, เปิด/โฟกัส/ปิด">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # ล้างการจำลองบน attach-only/remote CDP ด้วย
openclaw browser tabs
openclaw browser tab             # ทางลัดสำหรับแท็บปัจจุบัน
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="การตรวจสอบ: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # หรือ --ref e12 สำหรับ role refs
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="การกระทำ: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # หรือ e12 สำหรับ role refs
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="สถานะ: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # ใช้ --clear เพื่อลบ
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

หมายเหตุ:

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อนการ click/press ที่จะทริกเกอร์ file chooser/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12` หรือ role ref `e12`) โดยเจตนาไม่รองรับ CSS selectors สำหรับ actions
- พาธสำหรับ download, trace และ upload ถูกจำกัดไว้ภายใน temp root ของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้งค่า file input ได้โดยตรงผ่าน `--input-ref` หรือ `--element`

ภาพรวมแฟล็กของ snapshot:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): AI snapshot พร้อม ref ตัวเลข (`aria-ref="<n>"`)
- `--format aria`: accessibility tree, ไม่มี refs; ใช้สำหรับการตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): พรีเซ็ต role snapshot แบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้เป็นค่าเริ่มต้นได้ (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` จะบังคับใช้ role snapshot พร้อม refs แบบ `ref=e12` `--frame "<iframe>"` ใช้จำกัด role snapshots ให้อยู่ภายใน iframe
- `--labels` จะเพิ่มภาพหน้าจอเฉพาะ viewport พร้อมป้ายกำกับ ref ซ้อนทับ (พิมพ์ `MEDIA:<path>`)

## Snapshots และ refs

OpenClaw รองรับ “snapshot” อยู่สองรูปแบบ:

- **AI snapshot (ref ตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: snapshot แบบข้อความที่มี ref ตัวเลขรวมอยู่
  - Actions: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ระบบจะ resolve ref ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role ref เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/ต้นไม้แบบอิง role พร้อม `[ref=e12]` (และอาจมี `[nth=1]`)
  - Actions: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ระบบจะ resolve ref ผ่าน `getByRole(...)` (และ `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อใส่ภาพหน้าจอ viewport พร้อมป้ายกำกับ `e12` ซ้อนทับ

พฤติกรรมของ ref:

- ref **ไม่คงที่ข้ามการ navigate**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` ใหม่และใช้ ref ชุดใหม่
- หาก role snapshot ถูกสร้างโดยใช้ `--frame`, role refs จะถูกจำกัดอยู่ใน iframe นั้นจนกว่าจะมี role snapshot ครั้งถัดไป

## พลังเสริมของ wait

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ glob ของ Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สิ่งเหล่านี้สามารถใช้ร่วมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อ action ล้มเหลว (เช่น “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้ role refs ในโหมด interactive)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าเว็บมีพฤติกรรมแปลก:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำซ้ำปัญหา
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับการทำสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots ใน JSON มี `refs` พร้อมทั้งบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถประเมินขนาดและความหนาแน่นของ payload ได้

## ตัวควบคุมสถานะและสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แนว “ทำให้เว็บไซต์มีพฤติกรรมเหมือน X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับ `set headers --json '{"X-Debug":"1"}'` แบบเดิมอยู่)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งทางภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / locale: `set timezone ...`, `set locale ...`
- อุปกรณ์ / viewport:
  - `set device "iPhone 14"` (พรีเซ็ตอุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์ browser ของ openclaw อาจมีเซสชันที่ล็อกอินอยู่; ควรถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะรัน JavaScript ตามอำเภอใจในบริบทของหน้าเว็บ Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่จำเป็นต้องใช้
- สำหรับการล็อกอินและหมายเหตุเกี่ยวกับ anti-bot (X/Twitter ฯลฯ) ดู [Browser login + การโพสต์บน X/Twitter](/th/tools/browser-login)
- ควรทำให้โฮสต์ Gateway/node เป็นส่วนตัว (loopback หรือ tailnet-only)
- endpoint CDP ระยะไกลมีอำนาจสูง; ควรทำ tunnel และป้องกันไว้

ตัวอย่าง strict-mode (บล็อกปลายทาง private/internal โดยค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser) — ภาพรวม, การกำหนดค่า, โปรไฟล์, ความปลอดภัย
- [Browser login](/th/tools/browser-login) — การลงชื่อเข้าใช้เว็บไซต์
- [การแก้ไขปัญหา Browser บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหา Browser บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
