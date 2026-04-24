---
read_when:
    - การติดตั้งใช้งานแผง Canvas บน macOS
    - การเพิ่มการควบคุมพื้นที่ทำงานแบบภาพสำหรับเอเจนต์
    - การดีบักการโหลด canvas ของ WKWebView
summary: แผง Canvas ที่ควบคุมโดยเอเจนต์แบบฝังผ่าน WKWebView + custom URL scheme
title: Canvas
x-i18n:
    generated_at: "2026-04-24T09:21:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

แอป macOS ฝัง **แผง Canvas** ที่ควบคุมโดยเอเจนต์ผ่าน `WKWebView` มันเป็น
พื้นที่ทำงานแบบภาพน้ำหนักเบาสำหรับ HTML/CSS/JS, A2UI และพื้นผิว UI แบบโต้ตอบขนาดเล็ก

## ตำแหน่งที่ Canvas อยู่

สถานะของ Canvas ถูกเก็บไว้ใต้ Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

แผง Canvas ให้บริการไฟล์เหล่านั้นผ่าน **custom URL scheme**:

- `openclaw-canvas://<session>/<path>`

ตัวอย่าง:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

หากไม่มี `index.html` ที่ราก แอปจะแสดง **หน้าสเกฟโฟลด์ที่มีมาในตัว**

## พฤติกรรมของแผง

- แผงไร้ขอบ ปรับขนาดได้ ยึดอยู่ใกล้แถบเมนู (หรือเคอร์เซอร์เมาส์)
- จำขนาด/ตำแหน่งแยกตามเซสชัน
- รีโหลดอัตโนมัติเมื่อไฟล์ canvas ในเครื่องเปลี่ยน
- แสดงแผง Canvas ได้ครั้งละหนึ่งแผงเท่านั้น (ระบบจะสลับเซสชันตามต้องการ)

สามารถปิด Canvas ได้จาก Settings → **Allow Canvas** เมื่อปิดใช้งาน คำสั่ง node ของ canvas
จะส่งกลับ `CANVAS_DISABLED`

## พื้นผิว API ของเอเจนต์

Canvas ถูกเปิดเผยผ่าน **Gateway WebSocket** ดังนั้นเอเจนต์จึงสามารถ:

- แสดง/ซ่อนแผง
- นำทางไปยัง path หรือ URL
- ประเมิน JavaScript
- จับภาพ snapshot

ตัวอย่าง CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

หมายเหตุ:

- `canvas.navigate` รับได้ทั้ง **local canvas paths**, URL แบบ `http(s)` และ URL แบบ `file://`
- หากคุณส่ง `"/"` Canvas จะแสดง local scaffold หรือ `index.html`

## A2UI ใน Canvas

A2UI ถูกโฮสต์โดย canvas host ของ Gateway และเรนเดอร์ภายในแผง Canvas
เมื่อ Gateway โฆษณา Canvas host แอป macOS จะนำทางอัตโนมัติไปยัง
หน้าโฮสต์ A2UI เมื่อเปิดครั้งแรก

URL เริ่มต้นของโฮสต์ A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### คำสั่ง A2UI (v0.8)

ปัจจุบัน Canvas รับข้อความเซิร์ฟเวอร์→ไคลเอนต์ของ **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

ไม่รองรับ `createSurface` (v0.9)

ตัวอย่าง CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

ทดสอบแบบรวดเร็ว:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## การทริกเกอร์การรันของเอเจนต์จาก Canvas

Canvas สามารถทริกเกอร์การรันใหม่ของเอเจนต์ผ่าน deep links:

- `openclaw://agent?...`

ตัวอย่าง (ใน JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

แอปจะขอการยืนยัน เว้นแต่จะมีคีย์ที่ถูกต้องถูกส่งมา

## หมายเหตุด้านความปลอดภัย

- Canvas scheme บล็อก directory traversal; ไฟล์ต้องอยู่ใต้รากของเซสชัน
- เนื้อหา Canvas ในเครื่องใช้ custom scheme (ไม่ต้องใช้ loopback server)
- URL ภายนอกแบบ `http(s)` จะได้รับอนุญาตก็ต่อเมื่อมีการนำทางไปยังมันอย่างชัดเจน

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [WebChat](/th/web/webchat)
