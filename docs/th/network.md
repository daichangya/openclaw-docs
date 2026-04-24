---
read_when:
    - คุณต้องการภาพรวมสถาปัตยกรรมเครือข่าย + ความปลอดภัย
    - คุณกำลังแก้ปัญหาการเข้าถึงแบบ local เทียบกับ tailnet หรือการจับคู่
    - คุณต้องการรายการเอกสารด้านเครือข่ายฉบับ canonical
summary: 'ศูนย์กลางเครือข่าย: พื้นผิวของ gateway, การจับคู่, การค้นพบ และความปลอดภัย'
title: เครือข่าย
x-i18n:
    generated_at: "2026-04-24T09:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# ศูนย์กลางเครือข่าย

ศูนย์กลางนี้ลิงก์ไปยังเอกสารหลักสำหรับวิธีที่ OpenClaw ใช้เชื่อมต่อ จับคู่ และรักษาความปลอดภัยของอุปกรณ์ข้าม localhost, LAN และ tailnet

## โมเดลหลัก

การทำงานส่วนใหญ่ไหลผ่าน Gateway (`openclaw gateway`) ซึ่งเป็นโพรเซสระยะยาวตัวเดียวที่เป็นเจ้าของการเชื่อมต่อของช่องทางและ WebSocket control plane

- **Loopback มาก่อน**: WS ของ Gateway มีค่าปริยายเป็น `ws://127.0.0.1:18789`
  bind ที่ไม่ใช่ loopback ต้องมีเส้นทาง gateway auth ที่ถูกต้อง:
  auth แบบ shared-secret token/password หรือ deployment
  `trusted-proxy` แบบ non-loopback ที่กำหนดค่าอย่างถูกต้อง
- **แนะนำให้มี Gateway หนึ่งตัวต่อหนึ่งโฮสต์** หากต้องการการแยก ให้รันหลาย gateway พร้อมโปรไฟล์และพอร์ตที่แยกจากกัน ([Multiple Gateways](/th/gateway/multiple-gateways))
- **Canvas host** ให้บริการบนพอร์ตเดียวกับ Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) และถูกป้องกันด้วย Gateway auth เมื่อ bind นอก loopback
- **การเข้าถึงระยะไกล** โดยทั่วไปใช้ SSH tunnel หรือ Tailscale VPN ([Remote Access](/th/gateway/remote))

ข้อมูลอ้างอิงหลัก:

- [สถาปัตยกรรม Gateway](/th/concepts/architecture)
- [โปรโตคอล Gateway](/th/gateway/protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [พื้นผิวเว็บ + bind mode](/th/web)

## การจับคู่ + ตัวตน

- [ภาพรวมการจับคู่ (DM + Node)](/th/channels/pairing)
- [การจับคู่ Node ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)
- [CLI ของ Devices (การจับคู่ + การหมุนโทเค็น)](/th/cli/devices)
- [CLI ของ Pairing (การอนุมัติ DM)](/th/cli/pairing)

ความเชื่อถือในเครื่อง:

- การเชื่อมต่อ loopback ในเครื่องโดยตรงสามารถอนุมัติการจับคู่ให้อัตโนมัติได้ เพื่อให้
  UX บนโฮสต์เดียวกันลื่นไหล
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับ
  helper flow แบบ shared-secret ที่เชื่อถือได้
- ไคลเอนต์ผ่าน tailnet และ LAN รวมถึง tailnet bind บนโฮสต์เดียวกัน ยังคงต้องได้รับ
  การอนุมัติการจับคู่แบบ explicit

## การค้นพบ + transport

- [การค้นพบและ transport](/th/gateway/discovery)
- [Bonjour / mDNS](/th/gateway/bonjour)
- [การเข้าถึงระยะไกล (SSH)](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)

## Node + transport

- [ภาพรวมของ Node](/th/nodes)
- [Bridge protocol (legacy nodes, เชิงประวัติ)](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Node: iOS](/th/platforms/ios)
- [คู่มือปฏิบัติการ Node: Android](/th/platforms/android)

## ความปลอดภัย

- [ภาพรวมความปลอดภัย](/th/gateway/security)
- [ข้อมูลอ้างอิงคอนฟิก Gateway](/th/gateway/configuration)
- [การแก้ปัญหา](/th/gateway/troubleshooting)
- [Doctor](/th/gateway/doctor)

## ที่เกี่ยวข้อง

- [โมเดลเครือข่ายของ Gateway](/th/gateway/network-model)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
