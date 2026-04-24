---
read_when:
    - คุณต้องการมุมมองแบบกระชับของโมเดลเครือข่ายของ Gateway
summary: วิธีที่ Gateway, โหนด และ canvas host เชื่อมต่อกัน
title: โมเดลเครือข่าย
x-i18n:
    generated_at: "2026-04-24T09:11:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> เนื้อหานี้ถูกรวมเข้าไว้ใน [Network](/th/network#core-model) แล้ว ดูหน้านั้นสำหรับคู่มือปัจจุบัน

การทำงานส่วนใหญ่ไหลผ่าน Gateway (`openclaw gateway`) ซึ่งเป็นโปรเซสระยะยาวตัวเดียวที่เป็นเจ้าของการเชื่อมต่อช่องทางและ control plane แบบ WebSocket

## กฎหลัก

- แนะนำให้ใช้ Gateway หนึ่งตัวต่อหนึ่งโฮสต์ เป็นโปรเซสเดียวที่ได้รับอนุญาตให้เป็นเจ้าของเซสชัน WhatsApp Web สำหรับ rescue bots หรือการแยกแบบเข้มงวด ให้รันหลาย gateway พร้อม profiles และพอร์ตที่แยกกัน ดู [หลาย gateway](/th/gateway/multiple-gateways)
- ยึด loopback ก่อน: Gateway WS มีค่าเริ่มต้นเป็น `ws://127.0.0.1:18789` ตัวช่วยตั้งค่าจะสร้างการยืนยันตัวตนแบบ shared-secret เป็นค่าเริ่มต้น และโดยปกติจะสร้างโทเค็นแม้สำหรับ loopback สำหรับการเข้าถึงที่ไม่ใช่ loopback ให้ใช้เส้นทางการยืนยันตัวตนของ gateway ที่ถูกต้อง: การยืนยันตัวตนแบบ shared-secret token/password หรือ deployment `trusted-proxy` ที่ไม่ใช่ loopback และกำหนดค่าไว้อย่างถูกต้อง สำหรับการตั้งค่าแบบ tailnet/มือถือ โดยทั่วไปจะทำงานได้ดีที่สุดผ่าน Tailscale Serve หรือปลายทาง `wss://` แบบอื่น แทน `ws://` แบบ tailnet ดิบ
- โหนดเชื่อมต่อกับ Gateway WS ผ่าน LAN, tailnet หรือ SSH ตามต้องการ โดย
  TCP bridge แบบเดิมถูกนำออกแล้ว
- Canvas host ถูกให้บริการโดยเซิร์ฟเวอร์ HTTP ของ Gateway บน **พอร์ตเดียวกัน** กับ Gateway (ค่าเริ่มต้น `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    เมื่อมีการกำหนดค่า `gateway.auth` และ Gateway bind เกินกว่า loopback เส้นทางเหล่านี้จะถูกป้องกันด้วยการยืนยันตัวตนของ Gateway ไคลเอนต์ Node ใช้ capability URLs แบบมีขอบเขตตามโหนดที่ผูกกับเซสชัน WS ที่ใช้งานอยู่ ดู [การกำหนดค่า Gateway](/th/gateway/configuration) (`canvasHost`, `gateway`)
- การใช้งานระยะไกลโดยทั่วไปคือ SSH tunnel หรือ tailnet VPN ดู [การเข้าถึงระยะไกล](/th/gateway/remote) และ [Discovery](/th/gateway/discovery)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)
- [Gateway protocol](/th/gateway/protocol)
