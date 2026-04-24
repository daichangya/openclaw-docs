---
read_when:
    - คุณต้องการให้ agents แสดงการแก้ไขโค้ดหรือ markdown เป็น diffs
    - คุณต้องการ URL สำหรับตัวแสดงที่พร้อมใช้กับ canvas หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องการอาร์ติแฟกต์ diff ชั่วคราวที่ควบคุมได้พร้อมค่าเริ่มต้นที่ปลอดภัย
summary: ตัวแสดง diff แบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับ agents (เครื่องมือ plugin แบบไม่บังคับ)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T09:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` คือเครื่องมือ plugin แบบไม่บังคับที่มีคำแนะนำระบบแบบสั้นในตัว และมี skill ร่วมที่ใช้เปลี่ยนเนื้อหาการเปลี่ยนแปลงให้เป็นอาร์ติแฟกต์ diff แบบอ่านอย่างเดียวสำหรับ agents

มันรับอินพุตได้สองแบบ:

- ข้อความ `before` และ `after`
- `patch` แบบ unified

และสามารถส่งกลับได้เป็น:

- URL ของตัวแสดงบน gateway สำหรับการนำเสนอใน canvas
- พาธไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งในข้อความ
- เอาต์พุตทั้งสองแบบในการเรียกครั้งเดียว

เมื่อเปิดใช้งาน plugin จะเติมคำแนะนำการใช้งานแบบกระชับไว้ในพื้นที่ system-prompt และยังเปิดเผย skill แบบละเอียดสำหรับกรณีที่ agent ต้องการคำแนะนำที่ครบขึ้น

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้งาน plugin
2. เรียก `diffs` ด้วย `mode: "view"` สำหรับโฟลว์ที่เน้น canvas ก่อน
3. เรียก `diffs` ด้วย `mode: "file"` สำหรับโฟลว์ส่งไฟล์ในแชต
4. เรียก `diffs` ด้วย `mode: "both"` เมื่อคุณต้องการอาร์ติแฟกต์ทั้งสองแบบ

## เปิดใช้งาน plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## ปิดคำแนะนำระบบที่มีมาในตัว

หากคุณต้องการให้เครื่องมือ `diffs` ยังเปิดใช้งานอยู่ แต่ปิดคำแนะนำ system-prompt ที่มีมาในตัว ให้ตั้งค่า `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

สิ่งนี้จะบล็อก hook `before_prompt_build` ของ plugin diffs ขณะที่ยังคงให้ plugin, เครื่องมือ และ skill ร่วมใช้งานได้

หากคุณต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิด plugin แทน

## เวิร์กโฟลว์ทั่วไปของ agent

1. Agent เรียก `diffs`
2. Agent อ่านฟิลด์ใน `details`
3. จากนั้น agent จะ:
   - เปิด `details.viewerUrl` ด้วย `canvas present`
   - ส่ง `details.filePath` ด้วย `message` โดยใช้ `path` หรือ `filePath`
   - หรือทำทั้งสองอย่าง

## ตัวอย่างอินพุต

Before และ after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## เอกสารอ้างอิงอินพุตของเครื่องมือ

ทุกฟิลด์เป็นแบบไม่บังคับ เว้นแต่จะระบุไว้:

- `before` (`string`): ข้อความต้นฉบับ จำเป็นเมื่อใช้คู่กับ `after` และไม่มี `patch`
- `after` (`string`): ข้อความที่อัปเดตแล้ว จำเป็นเมื่อใช้คู่กับ `before` และไม่มี `patch`
- `patch` (`string`): ข้อความ diff แบบ unified ใช้ร่วมกับ `before` และ `after` ไม่ได้
- `path` (`string`): ชื่อไฟล์ที่จะแสดงสำหรับโหมด before และ after
- `lang` (`string`): คำใบ้สำหรับ override ภาษาในโหมด before และ after ค่าที่ไม่รู้จักจะ fallback ไปเป็น plain text
- `title` (`string`): override ชื่อเรื่องของตัวแสดง
- `mode` (`"view" | "file" | "both"`): โหมดเอาต์พุต ค่าเริ่มต้นคือค่าเริ่มต้นของ plugin `defaults.mode`
  alias ที่เลิกใช้แล้ว: `"image"` ทำงานเหมือน `"file"` และยังคงยอมรับเพื่อความเข้ากันได้ย้อนหลัง
- `theme` (`"light" | "dark"`): ธีมของตัวแสดง ค่าเริ่มต้นคือค่าเริ่มต้นของ plugin `defaults.theme`
- `layout` (`"unified" | "split"`): เลย์เอาต์ของ diff ค่าเริ่มต้นคือค่าเริ่มต้นของ plugin `defaults.layout`
- `expandUnchanged` (`boolean`): ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมีบริบทเต็ม ใช้ได้เฉพาะต่อการเรียกแต่ละครั้ง (ไม่ใช่คีย์ค่าเริ่มต้นของ plugin)
- `fileFormat` (`"png" | "pdf"`): รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นคือค่าเริ่มต้นของ plugin `defaults.fileFormat`
- `fileQuality` (`"standard" | "hq" | "print"`): preset คุณภาพสำหรับการเรนเดอร์ PNG หรือ PDF
- `fileScale` (`number`): override ของ device scale (`1`-`4`)
- `fileMaxWidth` (`number`): ความกว้างสูงสุดในการเรนเดอร์เป็น CSS pixels (`640`-`2400`)
- `ttlSeconds` (`number`): TTL ของอาร์ติแฟกต์เป็นวินาทีสำหรับตัวแสดงและเอาต์พุตไฟล์แบบสแตนด์อโลน ค่าเริ่มต้น 1800, สูงสุด 21600
- `baseUrl` (`string`): override origin ของ URL ตัวแสดง ซึ่งจะ override `viewerBaseUrl` ของ plugin ต้องเป็น `http` หรือ `https` และไม่มี query/hash

ยังคงยอมรับ aliases ของอินพุตแบบ legacy เพื่อความเข้ากันได้ย้อนหลัง:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

การตรวจสอบและข้อจำกัด:

- `before` และ `after` อย่างละไม่เกิน 512 KiB
- `patch` ไม่เกิน 2 MiB
- `path` ไม่เกิน 2048 ไบต์
- `lang` ไม่เกิน 128 ไบต์
- `title` ไม่เกิน 1024 ไบต์
- เพดานความซับซ้อนของ patch: สูงสุด 128 ไฟล์ และรวมทั้งหมดไม่เกิน 120000 บรรทัด
- จะปฏิเสธกรณีใช้ `patch` ร่วมกับ `before` หรือ `after`
- ข้อจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (ใช้กับทั้ง PNG และ PDF):
  - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 rendered pixels)
  - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 rendered pixels)
  - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 rendered pixels)
  - PDF ยังมีจำนวนหน้าสูงสุด 50 หน้าอีกด้วย

## สัญญาของ `details` ในเอาต์พุต

เครื่องมือจะส่งกลับ metadata แบบมีโครงสร้างภายใต้ `details`

ฟิลด์ที่ใช้ร่วมกันสำหรับโหมดที่สร้างตัวแสดง:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` เมื่อมี)

ฟิลด์ของไฟล์เมื่อมีการเรนเดอร์ PNG หรือ PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (ค่าเดียวกับ `filePath` เพื่อความเข้ากันได้กับ message tool)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

ยังส่งกลับ compatibility aliases สำหรับผู้เรียกเดิมด้วย:

- `format` (ค่าเดียวกับ `fileFormat`)
- `imagePath` (ค่าเดียวกับ `filePath`)
- `imageBytes` (ค่าเดียวกับ `fileBytes`)
- `imageQuality` (ค่าเดียวกับ `fileQuality`)
- `imageScale` (ค่าเดียวกับ `fileScale`)
- `imageMaxWidth` (ค่าเดียวกับ `fileMaxWidth`)

สรุปพฤติกรรมของโหมด:

- `mode: "view"`: มีเฉพาะฟิลด์ของตัวแสดง
- `mode: "file"`: มีเฉพาะฟิลด์ของไฟล์ ไม่มีอาร์ติแฟกต์ของตัวแสดง
- `mode: "both"`: มีทั้งฟิลด์ของตัวแสดงและฟิลด์ของไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว ตัวแสดงยังคงถูกส่งกลับพร้อม `fileError` และ compatibility alias `imageError`

## ส่วนที่ไม่เปลี่ยนแปลงแบบยุบไว้

- ตัวแสดงอาจแสดงแถวในลักษณะ `N unmodified lines`
- ตัวควบคุมการขยายบนแถวเหล่านั้นมีเงื่อนไข และไม่ได้รับประกันว่าจะมีสำหรับอินพุตทุกประเภท
- ตัวควบคุมการขยายจะปรากฏเมื่อ diff ที่เรนเดอร์มีข้อมูลบริบทที่ขยายได้ ซึ่งเป็นกรณีทั่วไปสำหรับอินพุตแบบ before และ after
- สำหรับอินพุต unified patch จำนวนมาก บริบทที่ถูกละไว้จะไม่มีอยู่ใน patch hunks ที่ parse แล้ว ดังนั้นแถวนั้นอาจแสดงโดยไม่มีตัวควบคุมการขยาย ซึ่งเป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` จะมีผลเฉพาะเมื่อมีบริบทที่ขยายได้เท่านั้น

## ค่าเริ่มต้นของ plugin

ตั้งค่าค่าเริ่มต้นทั้งระบบของ plugin ได้ใน `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

ค่าเริ่มต้นที่รองรับ:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

พารามิเตอร์ของเครื่องมือที่ระบุอย่างชัดเจนจะ override ค่าเริ่มต้นเหล่านี้

config ของ URL ตัวแสดงแบบคงอยู่:

- `viewerBaseUrl` (`string`, ไม่บังคับ)
  - fallback ที่ plugin เป็นเจ้าของสำหรับลิงก์ตัวแสดงที่ส่งกลับเมื่อการเรียกใช้เครื่องมือไม่ได้ส่ง `baseUrl`
  - ต้องเป็น `http` หรือ `https` และไม่มี query/hash

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## config ด้านความปลอดภัย

- `security.allowRemoteViewer` (`boolean`, ค่าเริ่มต้น `false`)
  - `false`: จะปฏิเสธคำขอที่ไม่ใช่ loopback ไปยัง routes ของตัวแสดง
  - `true`: อนุญาตตัวแสดงระยะไกลได้หาก tokenized path ถูกต้อง

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## วงจรชีวิตและการจัดเก็บอาร์ติแฟกต์

- อาร์ติแฟกต์จะถูกเก็บไว้ภายใต้โฟลเดอร์ย่อย temp: `$TMPDIR/openclaw-diffs`
- metadata ของอาร์ติแฟกต์ตัวแสดงประกอบด้วย:
  - artifact ID แบบสุ่ม (20 อักขระฐานสิบหก)
  - token แบบสุ่ม (48 อักขระฐานสิบหก)
  - `createdAt` และ `expiresAt`
  - พาธ `viewer.html` ที่เก็บไว้
- TTL เริ่มต้นของอาร์ติแฟกต์คือ 30 นาทีหากไม่ได้ระบุ
- TTL สูงสุดที่ยอมรับสำหรับตัวแสดงคือ 6 ชั่วโมง
- การล้างข้อมูลจะทำแบบฉวยโอกาสหลังจากสร้างอาร์ติแฟกต์
- อาร์ติแฟกต์ที่หมดอายุจะถูกลบ
- การล้างข้อมูลแบบ fallback จะลบโฟลเดอร์เก่าที่ค้างเกิน 24 ชั่วโมงเมื่อไม่มี metadata

## URL ของตัวแสดงและพฤติกรรมเครือข่าย

route ของตัวแสดง:

- `/plugins/diffs/view/{artifactId}/{token}`

assets ของตัวแสดง:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

เอกสารของตัวแสดงจะ resolve assets เหล่านั้นแบบสัมพันธ์กับ URL ของตัวแสดง ดังนั้นคำนำหน้า path ของ `baseUrl` แบบไม่บังคับจึงยังคงถูกรักษาไว้สำหรับคำขอ assets ด้วย

พฤติกรรมการสร้าง URL:

- หากมี `baseUrl` จากการเรียกใช้เครื่องมือ จะใช้ค่านั้นหลังจากผ่านการตรวจสอบอย่างเข้มงวด
- มิฉะนั้น หากมีการกำหนดค่า `viewerBaseUrl` ของ plugin ไว้ จะใช้ค่านั้น
- หากไม่มี override ทั้งสองแบบ URL ของตัวแสดงจะใช้ loopback `127.0.0.1` เป็นค่าเริ่มต้น
- หากโหมด bind ของ gateway เป็น `custom` และมีการตั้งค่า `gateway.customBindHost` จะใช้โฮสต์นั้น

กฎของ `baseUrl`:

- ต้องเป็น `http://` หรือ `https://`
- จะปฏิเสธ query และ hash
- อนุญาตให้ใช้ origin บวกกับ base path แบบไม่บังคับได้

## โมเดลความปลอดภัย

การทำให้ตัวแสดงแข็งแรงขึ้น:

- จำกัดเฉพาะ loopback โดยค่าเริ่มต้น
- ใช้เส้นทางตัวแสดงแบบมี token พร้อมการตรวจสอบ ID และ token อย่างเข้มงวด
- CSP ของการตอบกลับจากตัวแสดง:
  - `default-src 'none'`
  - scripts และ assets จาก self เท่านั้น
  - ไม่มี `connect-src` ขาออก
- การหน่วง miss จากระยะไกลเมื่อเปิดใช้การเข้าถึงระยะไกล:
  - ล้มเหลวได้ 40 ครั้งต่อ 60 วินาที
  - lockout 60 วินาที (`429 Too Many Requests`)

การทำให้การเรนเดอร์ไฟล์แข็งแรงขึ้น:

- การกำหนดเส้นทางคำขอของเบราว์เซอร์สำหรับการจับภาพหน้าจอเป็นแบบปฏิเสธโดยค่าเริ่มต้น
- อนุญาตเฉพาะ local viewer assets จาก `http://127.0.0.1/plugins/diffs/assets/*`
- บล็อกคำขอเครือข่ายภายนอก

## ข้อกำหนดของเบราว์เซอร์สำหรับโหมดไฟล์

`mode: "file"` และ `mode: "both"` ต้องใช้เบราว์เซอร์ที่เข้ากันได้กับ Chromium

ลำดับการ resolve:

1. `browser.executablePath` ใน config ของ OpenClaw
2. ตัวแปรสภาพแวดล้อม:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. fallback ไปยังการค้นหาคำสั่ง/พาธตามแพลตฟอร์ม

ข้อความล้มเหลวทั่วไป:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขได้โดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือตั้งค่าหนึ่งในตัวเลือก executable path ข้างต้น

## การแก้ไขปัญหา

ข้อผิดพลาดในการตรวจสอบอินพุต:

- `Provide patch or both before and after text.`
  - ใส่ทั้ง `before` และ `after` หรือใส่ `patch`
- `Provide either patch or before/after input, not both.`
  - อย่าผสมโหมดอินพุต
- `Invalid baseUrl: ...`
  - ใช้ origin แบบ `http(s)` พร้อม path แบบไม่บังคับ และไม่มี query/hash
- `{field} exceeds maximum size (...)`
  - ลดขนาด payload
- การปฏิเสธ patch ขนาดใหญ่
  - ลดจำนวนไฟล์ใน patch หรือจำนวนบรรทัดรวม

ปัญหาการเข้าถึงตัวแสดง:

- URL ของตัวแสดงจะ resolve ไปยัง `127.0.0.1` โดยค่าเริ่มต้น
- สำหรับกรณีที่ต้องเข้าถึงจากระยะไกล ให้ทำอย่างใดอย่างหนึ่ง:
  - ตั้งค่า `viewerBaseUrl` ของ plugin หรือ
  - ส่ง `baseUrl` ต่อการเรียกใช้เครื่องมือแต่ละครั้ง หรือ
  - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
- หาก `gateway.trustedProxies` รวม loopback สำหรับพร็อกซีบนโฮสต์เดียวกัน (เช่น Tailscale Serve) คำขอตัวแสดงแบบ raw loopback ที่ไม่มี forwarded client-IP headers จะล้มเหลวแบบปิดตามการออกแบบ
- สำหรับ topology แบบพร็อกซีนั้น:
  - ควรใช้ `mode: "file"` หรือ `mode: "both"` หากคุณต้องการเพียงไฟล์แนบ หรือ
  - เปิดใช้ `security.allowRemoteViewer` อย่างตั้งใจ และตั้งค่า `viewerBaseUrl` ของ plugin หรือส่ง `baseUrl` แบบ proxy/public เมื่อคุณต้องการ URL ของตัวแสดงที่แชร์ได้
- เปิดใช้ `security.allowRemoteViewer` เฉพาะเมื่อคุณตั้งใจให้มีการเข้าถึงตัวแสดงจากภายนอก

แถวบรรทัดที่ไม่เปลี่ยนแปลงไม่มีปุ่มขยาย:

- สิ่งนี้อาจเกิดขึ้นได้กับอินพุตแบบ patch เมื่อ patch นั้นไม่มีบริบทที่ขยายได้
- นี่เป็นพฤติกรรมที่คาดไว้ และไม่ได้บ่งชี้ว่าตัวแสดงล้มเหลว

ไม่พบอาร์ติแฟกต์:

- อาร์ติแฟกต์หมดอายุเนื่องจาก TTL
- token หรือ path ถูกเปลี่ยน
- การล้างข้อมูลลบข้อมูลเก่าที่ค้างไว้แล้ว

## แนวทางการปฏิบัติงาน

- ควรใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบในเครื่องบน canvas
- ควรใช้ `mode: "file"` สำหรับช่องทางแชตขาออกที่ต้องใช้ไฟล์แนบ
- ควรปิด `allowRemoteViewer` ไว้ เว้นแต่ deployment ของคุณจำเป็นต้องใช้ URL ของตัวแสดงจากระยะไกล
- ตั้งค่า `ttlSeconds` แบบสั้นอย่างชัดเจนสำหรับ diff ที่มีความอ่อนไหว
- หลีกเลี่ยงการส่ง secrets ในอินพุตของ diff หากไม่จำเป็น
- หากช่องทางของคุณบีบอัดรูปภาพอย่างหนัก (เช่น Telegram หรือ WhatsApp) ให้เลือกใช้เอาต์พุต PDF (`fileFormat: "pdf"`)

เอนจินการเรนเดอร์ diff:

- ขับเคลื่อนโดย [Diffs](https://diffs.com)

## เอกสารที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools)
- [Plugins](/th/tools/plugin)
- [Browser](/th/tools/browser)
