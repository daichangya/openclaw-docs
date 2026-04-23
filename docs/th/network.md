---
read_when:
    - คุณต้องการภาพรวมสถาปัตยกรรมเครือข่าย + ความปลอดภัย
    - คุณกำลังดีบักการเข้าถึงแบบ local เทียบกับ tailnet หรือการจับคู่
    - คุณต้องการรายการเอกสารด้านเครือข่ายที่เป็นมาตรฐาน canonical
summary: 'ศูนย์กลางเครือข่าย: พื้นผิวของ Gateway, การจับคู่, การค้นพบ และความปลอดภัย'
title: เครือข่าย
x-i18n:
    generated_at: "2026-04-23T05:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# ศูนย์กลางเครือข่าย

ศูนย์กลางนี้เชื่อมโยงเอกสารหลักสำหรับวิธีที่ OpenClaw เชื่อมต่อ จับคู่ และรักษาความปลอดภัยของอุปกรณ์ข้าม localhost, LAN และ tailnet

## โมเดลหลัก

การทำงานส่วนใหญ่ไหลผ่าน Gateway (`openclaw gateway`) ซึ่งเป็นโปรเซสระยะยาวเพียงตัวเดียวที่เป็นเจ้าของการเชื่อมต่อของช่องทางและ WebSocket control plane

- **Loopback มาก่อน**: ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`
  การ bind แบบ non-loopback ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง: shared-secret
  token/password auth หรือการติดตั้ง `trusted-proxy`
  แบบ non-loopback ที่ตั้งค่าอย่างถูกต้อง
- **แนะนำให้มีหนึ่ง Gateway ต่อหนึ่ง host** สำหรับการแยกออกจากกัน ให้รันหลาย gateways ด้วย profiles และ ports ที่แยกกัน ([Multiple Gateways](/th/gateway/multiple-gateways))
- **Canvas host** ถูกให้บริการบนพอร์ตเดียวกับ Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) และถูกป้องกันด้วย Gateway auth เมื่อ bind เกินกว่า loopback
- **การเข้าถึงระยะไกล** โดยทั่วไปใช้ SSH tunnel หรือ Tailscale VPN ([Remote Access](/th/gateway/remote))

เอกสารอ้างอิงหลัก:

- [สถาปัตยกรรม Gateway](/th/concepts/architecture)
- [Gateway protocol](/th/gateway/protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [พื้นผิวเว็บ + โหมด bind](/web)

## การจับคู่ + อัตลักษณ์

- [ภาพรวมการจับคู่ (DM + nodes)](/th/channels/pairing)
- [การจับคู่ node ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)
- [CLI ของอุปกรณ์ (การจับคู่ + การหมุนเวียน token)](/cli/devices)
- [CLI ของ Pairing (การอนุมัติ DM)](/cli/pairing)

ความเชื่อถือแบบ local:

- การเชื่อมต่อแบบ local loopback โดยตรงสามารถได้รับการอนุมัติอัตโนมัติสำหรับการจับคู่ เพื่อให้ UX บน host เดียวกันราบรื่น
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับโฟลว์ helper ที่ใช้ shared-secret และเชื่อถือได้
- ไคลเอนต์บน tailnet และ LAN รวมถึงการ bind แบบ tailnet บน host เดียวกัน ยังคงต้องได้รับการอนุมัติการจับคู่แบบชัดเจน

## การค้นพบ + การขนส่ง

- [การค้นพบและการขนส่ง](/th/gateway/discovery)
- [Bonjour / mDNS](/th/gateway/bonjour)
- [การเข้าถึงระยะไกล (SSH)](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)

## Nodes + การขนส่ง

- [ภาพรวม Nodes](/th/nodes)
- [Bridge protocol (legacy nodes, เชิงประวัติศาสตร์)](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Node: iOS](/th/platforms/ios)
- [คู่มือปฏิบัติการ Node: Android](/th/platforms/android)

## ความปลอดภัย

- [ภาพรวมความปลอดภัย](/th/gateway/security)
- [เอกสารอ้างอิงการตั้งค่า Gateway](/th/gateway/configuration)
- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [Doctor](/th/gateway/doctor)
