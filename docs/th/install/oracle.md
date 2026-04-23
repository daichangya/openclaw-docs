---
read_when:
    - การตั้งค่า OpenClaw บน Oracle Cloud
    - กำลังมองหาโฮสติ้ง VPS ฟรีสำหรับ OpenClaw
    - ต้องการ OpenClaw แบบ 24/7 บนเซิร์ฟเวอร์ขนาดเล็ก
summary: โฮสต์ OpenClaw บน ARM tier แบบ Always Free ของ Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-23T05:42:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

รัน OpenClaw Gateway แบบถาวรบน ARM tier แบบ **Always Free** ของ Oracle Cloud (สูงสุด 4 OCPU, RAM 24 GB, ที่เก็บข้อมูล 200 GB) โดยไม่มีค่าใช้จ่าย

## ข้อกำหนดเบื้องต้น

- บัญชี Oracle Cloud ([สมัคร](https://www.oracle.com/cloud/free/)) -- ดู [คู่มือสมัครจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) หากคุณพบปัญหา
- บัญชี Tailscale (ฟรีที่ [tailscale.com](https://tailscale.com))
- คู่คีย์ SSH
- เวลาประมาณ 30 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้าง OCI instance">
    1. ล็อกอินเข้า [Oracle Cloud Console](https://cloud.oracle.com/)
    2. ไปที่ **Compute > Instances > Create Instance**
    3. กำหนดค่า:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (หรือสูงสุด 4)
       - **Memory:** 12 GB (หรือสูงสุด 24 GB)
       - **Boot volume:** 50 GB (ฟรีได้สูงสุด 200 GB)
       - **SSH key:** เพิ่ม public key ของคุณ
    4. คลิก **Create** และจด public IP address ไว้

    <Tip>
    หากการสร้าง instance ล้มเหลวพร้อมข้อความ "Out of capacity" ให้ลอง availability domain อื่น หรือลองใหม่ภายหลัง ความจุของ free tier มีจำกัด
    </Tip>

  </Step>

  <Step title="เชื่อมต่อและอัปเดตระบบ">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    ต้องใช้ `build-essential` สำหรับการคอมไพล์ dependency บางตัวบน ARM

  </Step>

  <Step title="กำหนดค่าผู้ใช้และ hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    การเปิดใช้ linger จะทำให้บริการของผู้ใช้ยังทำงานต่อหลังจาก logout

  </Step>

  <Step title="ติดตั้ง Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    จากนี้ไป ให้เชื่อมต่อผ่าน Tailscale: `ssh ubuntu@openclaw`

  </Step>

  <Step title="ติดตั้ง OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    เมื่อมีพรอมป์ถามว่า "How do you want to hatch your bot?" ให้เลือก **Do this later**

  </Step>

  <Step title="กำหนดค่า gateway">
    ใช้ token auth ร่วมกับ Tailscale Serve เพื่อการเข้าถึงระยะไกลที่ปลอดภัย

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ตรงนี้มีไว้เฉพาะสำหรับการจัดการ forwarded-IP/local-client ของ local Tailscale Serve proxy เท่านั้น มัน **ไม่ใช่** `gateway.auth.mode: "trusted-proxy"` เส้นทางของ diff viewer จะยังคงมีพฤติกรรม fail-closed ในการตั้งค่านี้: คำขอ viewer แบบดิบจาก `127.0.0.1` ที่ไม่มี forwarded proxy headers อาจตอบกลับ `Diff not found` ใช้ `mode=file` / `mode=both` สำหรับไฟล์แนบ หรือเปิดใช้ remote viewer โดยตั้งใจและกำหนด `plugins.entries.diffs.config.viewerBaseUrl` (หรือส่ง `baseUrl` ของ proxy) หากคุณต้องการลิงก์ viewer ที่แชร์ได้

  </Step>

  <Step title="ล็อก down ความปลอดภัยของ VCN">
    บล็อกทราฟฟิกทั้งหมด ยกเว้น Tailscale ที่ network edge:

    1. ไปที่ **Networking > Virtual Cloud Networks** ใน OCI Console
    2. คลิก VCN ของคุณ จากนั้นไปที่ **Security Lists > Default Security List**
    3. **ลบ** ingress rules ทั้งหมด ยกเว้น `0.0.0.0/0 UDP 41641` (Tailscale)
    4. คง egress rules เริ่มต้นไว้ (อนุญาต outbound ทั้งหมด)

    วิธีนี้จะบล็อก SSH บนพอร์ต 22, HTTP, HTTPS และทุกอย่างอื่นที่ network edge จากจุดนี้ไป คุณจะเชื่อมต่อได้เฉพาะผ่าน Tailscale เท่านั้น

  </Step>

  <Step title="ตรวจสอบ">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    เข้าถึง Control UI จากอุปกรณ์ใดก็ได้บน tailnet ของคุณ:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    แทนที่ `<tailnet-name>` ด้วยชื่อ tailnet ของคุณ (ดูได้จาก `tailscale status`)

  </Step>
</Steps>

## ทางเลือกสำรอง: SSH tunnel

หาก Tailscale Serve ใช้งานไม่ได้ ให้ใช้ SSH tunnel จากเครื่อง local ของคุณ:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

จากนั้นเปิด `http://localhost:18789`

## การแก้ไขปัญหา

**การสร้าง instance ล้มเหลว ("Out of capacity")** -- instance ARM แบบ free tier ได้รับความนิยมมาก ให้ลอง availability domain อื่น หรือพยายามใหม่ในช่วงนอกเวลาใช้งานหนาแน่น

**Tailscale เชื่อมต่อไม่ได้** -- รัน `sudo tailscale up --ssh --hostname=openclaw --reset` เพื่อตรวจสอบสิทธิ์ใหม่

**Gateway ไม่ยอมเริ่มทำงาน** -- รัน `openclaw doctor --non-interactive` และตรวจสอบล็อกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**ปัญหาไบนารีบน ARM** -- แพ็กเกจ npm ส่วนใหญ่ทำงานบน ARM64 ได้ สำหรับไบนารีเนทีฟ ให้มองหารุ่น `linux-arm64` หรือ `aarch64` ตรวจสอบสถาปัตยกรรมด้วย `uname -m`

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือก config ทั้งหมด
- [Updating](/th/install/updating) -- ทำให้ OpenClaw ทันสมัยอยู่เสมอ
