---
read_when:
    - คุณต้องการให้เอเจนต์แสดงการแก้ไขโค้ดหรือ markdown เป็น diff【อ่านข้อความเต็มanalysis to=final code omitted because translate only.
    - คุณต้องการ URL ของตัวดูที่พร้อมใช้กับ canvas หรือไฟล์ diff ที่เรนเดอร์แล้ว
    - คุณต้องการ artifacts ของ diff แบบชั่วคราวที่ควบคุมได้ พร้อมค่าเริ่มต้นที่ปลอดภัย
summary: ตัวดู diff แบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับเอเจนต์ (เครื่องมือ Plugin แบบไม่บังคับ)
title: Diffs
x-i18n:
    generated_at: "2026-04-23T05:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` เป็นเครื่องมือ Plugin แบบไม่บังคับที่มีคำแนะนำใน system แบบสั้นที่มีมาในตัว และมี skill คู่หูที่เปลี่ยนเนื้อหาการเปลี่ยนแปลงให้เป็น diff artifact แบบอ่านอย่างเดียวสำหรับเอเจนต์

มันรับอินพุตได้ทั้ง:

- ข้อความ `before` และ `after`
- `patch` แบบ unified

และสามารถคืนค่าได้เป็น:

- URL ของ gateway viewer สำหรับการนำเสนอผ่าน canvas
- พาธของไฟล์ที่เรนเดอร์แล้ว (PNG หรือ PDF) สำหรับการส่งผ่านข้อความ
- หรือทั้งสองเอาต์พุตในการเรียกครั้งเดียว

เมื่อเปิดใช้งาน Plugin นี้จะ prepend คำแนะนำการใช้งานแบบกระชับเข้าไปในพื้นที่ของ system-prompt และยังเปิดเผย skill แบบละเอียดสำหรับกรณีที่เอเจนต์ต้องการคำแนะนำเพิ่มเติมด้วย

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้งาน Plugin
2. เรียก `diffs` ด้วย `mode: "view"` สำหรับโฟลว์ที่เน้น canvas ก่อน
3. เรียก `diffs` ด้วย `mode: "file"` สำหรับโฟลว์การส่งไฟล์ทางแชต
4. เรียก `diffs` ด้วย `mode: "both"` เมื่อคุณต้องการทั้งสอง artifact

## เปิดใช้งาน Plugin

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

## ปิดคำแนะนำ system ที่มีมาในตัว

หากคุณต้องการให้เครื่องมือ `diffs` ยังเปิดใช้งานอยู่ แต่ปิดคำแนะนำใน system-prompt ที่มีมาในตัว ให้ตั้ง `plugins.entries.diffs.hooks.allowPromptInjection` เป็น `false`:

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

สิ่งนี้จะบล็อก hook `before_prompt_build` ของ diffs Plugin ขณะที่ยังคงให้ Plugin, tool และ companion skill ใช้งานได้

หากคุณต้องการปิดทั้งคำแนะนำและเครื่องมือ ให้ปิด Plugin แทน

## เวิร์กโฟลว์ของเอเจนต์โดยทั่วไป

1. เอเจนต์เรียก `diffs`
2. เอเจนต์อ่านฟิลด์ `details`
3. จากนั้นเอเจนต์จะ:
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

ทุกฟิลด์เป็นแบบไม่บังคับ เว้นแต่จะระบุไว้เป็นอย่างอื่น:

- `before` (`string`): ข้อความต้นฉบับ จำเป็นเมื่อใช้ร่วมกับ `after` หากไม่ได้ระบุ `patch`
- `after` (`string`): ข้อความที่อัปเดตแล้ว จำเป็นเมื่อใช้ร่วมกับ `before` หากไม่ได้ระบุ `patch`
- `patch` (`string`): ข้อความ diff แบบ unified โดยใช้ร่วมกับ `before` และ `after` ไม่ได้
- `path` (`string`): ชื่อไฟล์ที่ใช้แสดงในโหมด before และ after
- `lang` (`string`): คำใบ้ override ภาษาในโหมด before และ after ค่าที่ไม่รู้จักจะ fallback ไปเป็นข้อความธรรมดา
- `title` (`string`): override ชื่อเรื่องของ viewer
- `mode` (`"view" | "file" | "both"`): โหมดเอาต์พุต ค่าเริ่มต้นคือค่า `defaults.mode` ของ Plugin
  alias แบบ deprecated: `"image"` จะทำงานเหมือน `"file"` และยังคงยอมรับเพื่อ backward compatibility
- `theme` (`"light" | "dark"`): ธีมของ viewer ค่าเริ่มต้นใช้ `defaults.theme` ของ Plugin
- `layout` (`"unified" | "split"`): เลย์เอาต์ของ diff ค่าเริ่มต้นใช้ `defaults.layout` ของ Plugin
- `expandUnchanged` (`boolean`): ขยายส่วนที่ไม่เปลี่ยนแปลงเมื่อมี full context พร้อมใช้ เป็นตัวเลือกแบบ per-call เท่านั้น (ไม่ใช่คีย์ default ระดับ Plugin)
- `fileFormat` (`"png" | "pdf"`): รูปแบบไฟล์ที่เรนเดอร์แล้ว ค่าเริ่มต้นใช้ `defaults.fileFormat` ของ Plugin
- `fileQuality` (`"standard" | "hq" | "print"`): ค่าคุณภาพล่วงหน้าสำหรับการเรนเดอร์ PNG หรือ PDF
- `fileScale` (`number`): override device scale (`1`-`4`)
- `fileMaxWidth` (`number`): ความกว้างสูงสุดที่เรนเดอร์ในหน่วย CSS pixels (`640`-`2400`)
- `ttlSeconds` (`number`): TTL ของ artifact เป็นวินาทีสำหรับ viewer และ file outputs แบบ standalone ค่าเริ่มต้น 1800, สูงสุด 21600
- `baseUrl` (`string`): override ต้นทาง URL ของ viewer โดยจะ override `viewerBaseUrl` ของ Plugin ต้องเป็น `http` หรือ `https` และห้ามมี query/hash

input aliases แบบเดิมยังคงยอมรับเพื่อ backward compatibility:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

การตรวจสอบและขีดจำกัด:

- `before` และ `after` อย่างละสูงสุด 512 KiB
- `patch` สูงสุด 2 MiB
- `path` สูงสุด 2048 bytes
- `lang` สูงสุด 128 bytes
- `title` สูงสุด 1024 bytes
- ขีดจำกัดความซับซ้อนของ patch: สูงสุด 128 ไฟล์ และรวมสูงสุด 120000 บรรทัด
- ระบบจะปฏิเสธการใช้ `patch` ร่วมกับ `before` หรือ `after`
- ขีดจำกัดความปลอดภัยของไฟล์ที่เรนเดอร์แล้ว (ใช้กับทั้ง PNG และ PDF):
  - `fileQuality: "standard"`: สูงสุด 8 MP (8,000,000 rendered pixels)
  - `fileQuality: "hq"`: สูงสุด 14 MP (14,000,000 rendered pixels)
  - `fileQuality: "print"`: สูงสุด 24 MP (24,000,000 rendered pixels)
  - PDF ยังมีขีดจำกัดสูงสุด 50 หน้า

## สัญญาของเอาต์พุตใน `details`

เครื่องมือจะคืน metadata แบบมีโครงสร้างภายใต้ `details`

ฟิลด์ที่ใช้ร่วมกันสำหรับโหมดที่สร้าง viewer:

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
- `path` (ค่าเดียวกับ `filePath`, เพื่อให้เข้ากันได้กับ message tool)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

compatibility aliases สำหรับผู้เรียกแบบเดิมก็จะถูกคืนมาด้วย:

- `format` (ค่าเดียวกับ `fileFormat`)
- `imagePath` (ค่าเดียวกับ `filePath`)
- `imageBytes` (ค่าเดียวกับ `fileBytes`)
- `imageQuality` (ค่าเดียวกับ `fileQuality`)
- `imageScale` (ค่าเดียวกับ `fileScale`)
- `imageMaxWidth` (ค่าเดียวกับ `fileMaxWidth`)

สรุปพฤติกรรมของโหมด:

- `mode: "view"`: คืนเฉพาะฟิลด์ของ viewer
- `mode: "file"`: คืนเฉพาะฟิลด์ของไฟล์ ไม่มี viewer artifact
- `mode: "both"`: คืนทั้งฟิลด์ของ viewer และฟิลด์ของไฟล์ หากการเรนเดอร์ไฟล์ล้มเหลว viewer จะยังคงถูกคืนพร้อม `fileError` และ compatibility alias `imageError`

## ส่วนที่ไม่เปลี่ยนแปลงและถูกพับไว้

- viewer สามารถแสดงแถวแบบ `N unmodified lines` ได้
- ตัวควบคุมสำหรับขยายบนแถวเหล่านั้นเป็นแบบมีเงื่อนไข และไม่ได้รับประกันว่าจะมีสำหรับทุกชนิดของอินพุต
- ตัวควบคุมสำหรับขยายจะปรากฏเมื่อ diff ที่เรนเดอร์แล้วมี expandable context data ซึ่งมักเกิดกับอินพุตแบบ before และ after
- สำหรับอินพุต unified patch จำนวนมาก omitted context bodies จะไม่มีอยู่ใน patch hunks ที่ parse แล้ว ดังนั้นแถวอาจแสดงได้โดยไม่มีตัวควบคุมสำหรับขยาย ซึ่งถือเป็นพฤติกรรมที่คาดไว้
- `expandUnchanged` จะมีผลเฉพาะเมื่อมี expandable context อยู่จริง

## ค่าเริ่มต้นของ Plugin

ตั้งค่า defaults ระดับ Plugin ใน `~/.openclaw/openclaw.json`:

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

การตั้งค่า URL ของ viewer แบบคงที่:

- `viewerBaseUrl` (`string`, ไม่บังคับ)
  - fallback ที่เป็นของ Plugin สำหรับลิงก์ viewer ที่คืนกลับมา เมื่อการเรียกเครื่องมือไม่ได้ส่ง `baseUrl`
  - ต้องเป็น `http` หรือ `https` และห้ามมี query/hash

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

## การตั้งค่าด้านความปลอดภัย

- `security.allowRemoteViewer` (`boolean`, ค่าเริ่มต้น `false`)
  - `false`: คำขอแบบ non-loopback ไปยังเส้นทาง viewer จะถูกปฏิเสธ
  - `true`: อนุญาต remote viewers ได้ หาก tokenized path ถูกต้อง

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

## วงจรชีวิตและการจัดเก็บ Artifact

- Artifacts จะถูกเก็บไว้ภายใต้โฟลเดอร์ย่อยชั่วคราว: `$TMPDIR/openclaw-diffs`
- metadata ของ viewer artifact มี:
  - artifact ID แบบสุ่ม (20 hex chars)
  - token แบบสุ่ม (48 hex chars)
  - `createdAt` และ `expiresAt`
  - พาธ `viewer.html` ที่เก็บไว้
- ค่า artifact TTL เริ่มต้นคือ 30 นาทีเมื่อไม่ได้ระบุ
- ค่า viewer TTL สูงสุดที่ยอมรับคือ 6 ชั่วโมง
- Cleanup จะรันแบบ opportunistic หลังการสร้าง artifact
- Artifacts ที่หมดอายุจะถูกลบ
- fallback cleanup จะลบโฟลเดอร์ค้างเก่าที่มีอายุมากกว่า 24 ชั่วโมง เมื่อไม่มี metadata

## URL ของ viewer และพฤติกรรมของเครือข่าย

เส้นทางของ viewer:

- `/plugins/diffs/view/{artifactId}/{token}`

assets ของ viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

เอกสารของ viewer จะ resolve assets เหล่านั้นแบบสัมพัทธ์กับ viewer URL ดังนั้น baseUrl path prefix แบบไม่บังคับจะถูกคงไว้ทั้งกับคำขอ asset ด้วย

พฤติกรรมการสร้าง URL:

- หากมี `baseUrl` จาก tool-call จะถูกใช้หลังจากผ่านการตรวจสอบแบบเข้มงวด
- มิฉะนั้น หากมีการตั้ง `viewerBaseUrl` ของ Plugin จะใช้ค่านี้
- หากไม่มี override ทั้งสองแบบ viewer URL จะใช้ loopback `127.0.0.1` เป็นค่าเริ่มต้น
- หากโหมด bind ของ gateway เป็น `custom` และมีการตั้ง `gateway.customBindHost` จะใช้ host นั้น

กฎของ `baseUrl`:

- ต้องเป็น `http://` หรือ `https://`
- ระบบจะปฏิเสธ query และ hash
- อนุญาตให้ใช้ origin พร้อม base path แบบไม่บังคับได้

## โมเดลความปลอดภัย

การทำให้ viewer แข็งแกร่งขึ้น:

- เป็น loopback-only โดยค่าเริ่มต้น
- ใช้ tokenized viewer paths พร้อมการตรวจสอบ ID และ token แบบเข้มงวด
- CSP ของการตอบกลับจาก viewer:
  - `default-src 'none'`
  - scripts และ assets จาก self เท่านั้น
  - ไม่มี `connect-src` ขาออก
- การ throttle สำหรับ remote miss เมื่อเปิดใช้การเข้าถึงระยะไกล:
  - ความล้มเหลว 40 ครั้งต่อ 60 วินาที
  - lockout 60 วินาที (`429 Too Many Requests`)

การทำให้การเรนเดอร์ไฟล์แข็งแกร่งขึ้น:

- การกำหนดเส้นทางคำขอของ screenshot browser เป็นแบบ deny-by-default
- อนุญาตเฉพาะ local viewer assets จาก `http://127.0.0.1/plugins/diffs/assets/*` เท่านั้น
- บล็อกคำขอเครือข่ายภายนอก

## ข้อกำหนดของ browser สำหรับโหมด file

`mode: "file"` และ `mode: "both"` ต้องใช้ Chromium-compatible browser

ลำดับการ resolve:

1. `browser.executablePath` ใน config ของ OpenClaw
2. ตัวแปรแวดล้อม:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. fallback เป็นการค้นหาคำสั่ง/พาธตามแพลตฟอร์ม

ข้อความความล้มเหลวที่พบบ่อย:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

แก้ไขโดยติดตั้ง Chrome, Chromium, Edge หรือ Brave หรือกำหนดตัวเลือก executable path อย่างใดอย่างหนึ่งด้านบน

## การแก้ไขปัญหา

ข้อผิดพลาดจากการตรวจสอบอินพุต:

- `Provide patch or both before and after text.`
  - ต้องใส่ทั้ง `before` และ `after` หรือใส่ `patch`
- `Provide either patch or before/after input, not both.`
  - ห้ามผสมโหมดอินพุต
- `Invalid baseUrl: ...`
  - ใช้ origin แบบ `http(s)` พร้อม path แบบไม่บังคับ และห้ามมี query/hash
- `{field} exceeds maximum size (...)`
  - ลดขนาดของ payload
- การปฏิเสธ patch ขนาดใหญ่
  - ลดจำนวนไฟล์ใน patch หรือจำนวนบรรทัดรวม

ปัญหาการเข้าถึง viewer:

- ค่าเริ่มต้นของ viewer URL จะ resolve ไปที่ `127.0.0.1`
- สำหรับสถานการณ์การเข้าถึงระยะไกล ให้เลือกอย่างใดอย่างหนึ่ง:
  - ตั้งค่า `viewerBaseUrl` ของ Plugin หรือ
  - ส่ง `baseUrl` แยกในแต่ละการเรียกเครื่องมือ หรือ
  - ใช้ `gateway.bind=custom` และ `gateway.customBindHost`
- หาก `gateway.trustedProxies` รวม loopback ไว้สำหรับ same-host proxy (เช่น Tailscale Serve) คำขอ loopback viewer แบบดิบที่ไม่มี forwarded client-IP headers จะล้มเหลวแบบ fail closed โดยตั้งใจ
- สำหรับ topology ของ proxy แบบนั้น:
  - ควรใช้ `mode: "file"` หรือ `mode: "both"` เมื่อคุณต้องการเพียงไฟล์แนบ หรือ
  - เปิด `security.allowRemoteViewer` อย่างตั้งใจ และตั้ง `viewerBaseUrl` ของ Plugin หรือส่ง `baseUrl` แบบ proxy/public เมื่อคุณต้องการ viewer URL ที่แชร์ได้
- เปิด `security.allowRemoteViewer` เฉพาะเมื่อคุณตั้งใจให้มีการเข้าถึง viewer จากภายนอก

แถวของบรรทัดที่ไม่เปลี่ยนแปลงไม่มีปุ่มขยาย:

- สิ่งนี้เกิดขึ้นได้กับอินพุตแบบ patch เมื่อ patch ไม่มี expandable context มาด้วย
- นี่เป็นพฤติกรรมที่คาดไว้ และไม่ได้หมายความว่า viewer ล้มเหลว

ไม่พบ Artifact:

- Artifact หมดอายุเพราะ TTL
- token หรือ path เปลี่ยนไป
- cleanup ลบข้อมูลเก่าทิ้งแล้ว

## แนวทางการปฏิบัติงาน

- ควรใช้ `mode: "view"` สำหรับการรีวิวแบบโต้ตอบใน canvas บนเครื่อง
- ควรใช้ `mode: "file"` สำหรับช่องทางแชตขาออกที่ต้องการไฟล์แนบ
- คง `allowRemoteViewer` ไว้เป็นปิด เว้นแต่การติดตั้งของคุณต้องใช้ viewer URLs แบบระยะไกลจริงๆ
- ตั้ง `ttlSeconds` ที่สั้นอย่างชัดเจนสำหรับ diffs ที่อ่อนไหว
- หลีกเลี่ยงการส่ง secrets ในอินพุตของ diff เมื่อไม่จำเป็น
- หากช่องทางของคุณบีบอัดรูปภาพอย่างหนัก (เช่น Telegram หรือ WhatsApp) ควรเลือกเอาต์พุตแบบ PDF (`fileFormat: "pdf"`)

เอนจินการเรนเดอร์ diff:

- ขับเคลื่อนโดย [Diffs](https://diffs.com)

## เอกสารที่เกี่ยวข้อง

- [ภาพรวมของ Tools](/th/tools)
- [Plugins](/th/tools/plugin)
- [Browser](/th/tools/browser)
