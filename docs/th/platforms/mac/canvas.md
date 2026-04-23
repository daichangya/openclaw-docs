---
read_when:
    - การพัฒนาแผง Canvas บน macOS
    - การเพิ่มส่วนควบคุมของเอเจนต์สำหรับพื้นที่ทำงานแบบภาพ】【：】【“】【assistant to=final
    - การดีบักการโหลด Canvas ของ WKWebView
summary: แผง Canvas ที่เอเจนต์ควบคุมซึ่งฝังผ่าน WKWebView + custom URL scheme
title: Canvas
x-i18n:
    generated_at: "2026-04-23T05:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (แอป macOS)

แอป macOS ฝัง **แผง Canvas** ที่เอเจนต์ควบคุมผ่าน `WKWebView` มันคือ
พื้นที่ทำงานแบบภาพที่มีน้ำหนักเบาสำหรับ HTML/CSS/JS, A2UI และ
พื้นผิว UI แบบโต้ตอบขนาดเล็ก

## ตำแหน่งของ Canvas

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

- แผงไร้ขอบ ปรับขนาดได้ และยึดอยู่ใกล้แถบเมนู (หรือเคอร์เซอร์เมาส์)
- จดจำขนาด/ตำแหน่งแยกตามเซสชัน
- รีโหลดอัตโนมัติเมื่อไฟล์ Canvas ในเครื่องเปลี่ยน
- มองเห็นแผง Canvas ได้เพียงหนึ่งแผงในแต่ละครั้งเท่านั้น (จะสลับเซสชันตามต้องการ)

สามารถปิด Canvas ได้จาก Settings → **Allow Canvas** เมื่อปิดอยู่
คำสั่ง node ของ canvas จะคืนค่า `CANVAS_DISABLED`

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

- `canvas.navigate` ยอมรับทั้ง **local canvas paths**, URL แบบ `http(s)` และ URL แบบ `file://`
- หากคุณส่ง `"/"` Canvas จะแสดงสเกฟโฟลด์ในเครื่องหรือ `index.html`

## A2UI ใน Canvas

A2UI ถูกโฮสต์โดย canvas host ของ Gateway และเรนเดอร์ภายในแผง Canvas
เมื่อ Gateway ประกาศ Canvas host แอป macOS จะนำทางไปยัง
หน้าโฮสต์ A2UI โดยอัตโนมัติเมื่อเปิดครั้งแรก

URL ของโฮสต์ A2UI เริ่มต้น:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### คำสั่ง A2UI (v0.8)

ขณะนี้ Canvas ยอมรับข้อความ A2UI แบบ server→client ของ **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

ยังไม่รองรับ `createSurface` (v0.9)

ตัวอย่าง CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

การทดสอบแบบรวดเร็ว:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## การกระตุ้นการรันของเอเจนต์จาก Canvas

Canvas สามารถกระตุ้นการรันของเอเจนต์ใหม่ผ่าน deep link:

- `openclaw://agent?...`

ตัวอย่าง (ใน JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

แอปจะขอการยืนยัน เว้นแต่จะมีการระบุคีย์ที่ถูกต้องไว้

## หมายเหตุด้านความปลอดภัย

- scheme ของ Canvas บล็อก directory traversal; ไฟล์ต้องอยู่ภายใต้รากของเซสชัน
- เนื้อหา Canvas ในเครื่องใช้ custom scheme (ไม่ต้องมี loopback server)
- URL แบบ `http(s)` ภายนอกจะได้รับอนุญาตก็ต่อเมื่อมีการนำทางไปยังมันอย่างชัดเจน
