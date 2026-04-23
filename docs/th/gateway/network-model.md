---
read_when:
    - คุณต้องการภาพรวมแบบกระชับของโมเดลเครือข่ายของ Gateway
summary: Gateway, Node และ canvas host เชื่อมต่อกันอย่างไร
title: โมเดลเครือข่าย
x-i18n:
    generated_at: "2026-04-23T05:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# โมเดลเครือข่าย

> เนื้อหานี้ถูกรวมเข้าไปใน [Network](/th/network#core-model) แล้ว ดูหน้าดังกล่าวสำหรับคู่มือปัจจุบัน

การทำงานส่วนใหญ่ไหลผ่าน Gateway (`openclaw gateway`) ซึ่งเป็นโปรเซสระยะยาวตัวเดียว
ที่เป็นเจ้าของการเชื่อมต่อแชนเนลและ control plane แบบ WebSocket

## กฎหลัก

- แนะนำให้มี Gateway หนึ่งตัวต่อโฮสต์ มันเป็นโปรเซสเดียวที่ได้รับอนุญาตให้เป็นเจ้าของเซสชัน WhatsApp Web สำหรับบอตกู้คืนหรือการแยกอย่างเข้มงวด ให้รันหลาย gateway พร้อมโปรไฟล์และพอร์ตที่แยกจากกัน ดู [Multiple gateways](/th/gateway/multiple-gateways)
- loopback มาก่อน: ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789` วิซาร์ดจะสร้าง shared-secret auth เป็นค่าเริ่มต้น และโดยมากจะสร้างโทเค็นแม้สำหรับ loopback สำหรับการเข้าถึงที่ไม่ใช่ loopback ให้ใช้เส้นทาง auth ของ gateway ที่ถูกต้อง: shared-secret token/password auth หรือ deployment `trusted-proxy` ที่ไม่ใช่ loopback ซึ่งกำหนดค่าอย่างถูกต้อง การตั้งค่าแบบ tailnet/มือถือมักทำงานได้ดีที่สุดผ่าน Tailscale Serve หรือ endpoint `wss://` แบบอื่น แทน `ws://` ของ tailnet แบบดิบ
- Node เชื่อมต่อกับ Gateway WS ผ่าน LAN, tailnet หรือ SSH ตามความจำเป็น
  โดย legacy TCP bridge ถูกถอดออกแล้ว
- canvas host ถูกเสิร์ฟโดยเซิร์ฟเวอร์ HTTP ของ Gateway บน **พอร์ตเดียวกัน** กับ Gateway (ค่าเริ่มต้น `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    เมื่อมีการกำหนดค่า `gateway.auth` และ Gateway bind เกิน loopback เส้นทางเหล่านี้จะถูกป้องกันด้วย Gateway auth ไคลเอนต์ Node ใช้ URL ความสามารถแบบกำหนดขอบเขตต่อ node ที่ผูกกับเซสชัน WS ที่กำลังใช้งานอยู่ ดู [การกำหนดค่า Gateway](/th/gateway/configuration) (`canvasHost`, `gateway`)
- การใช้งานจากระยะไกลโดยทั่วไปใช้ SSH tunnel หรือ tailnet VPN ดู [Remote access](/th/gateway/remote) และ [Discovery](/th/gateway/discovery)
