---
read_when:
    - การตอบคำถามช่วยเหลือทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - การคัดกรองปัญหาที่ผู้ใช้รายงานก่อนเข้าสู่การดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-04-23T05:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# คำถามที่พบบ่อย

คำตอบแบบรวดเร็วพร้อมการแก้ไขปัญหาเชิงลึกสำหรับการตั้งค่าในโลกจริง (local dev, VPS, multi-agent, OAuth/API key, model failover) สำหรับการวินิจฉัยรันไทม์ ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงคอนฟิกแบบเต็ม ดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกหากมีบางอย่างเสีย

1. **สถานะอย่างรวดเร็ว (ตรวจสอบอย่างแรก)**

   ```bash
   openclaw status
   ```

   สรุปภายในเครื่องแบบรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, คอนฟิก provider + ปัญหารันไทม์ (เมื่อเข้าถึง gateway ได้)

2. **รายงานที่นำไปวางต่อได้ (ปลอดภัยต่อการแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อม log tail (token ถูกปกปิดแล้ว)

3. **สถานะ daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดงรันไทม์ของ supervisor เทียบกับการเข้าถึง RPC, probe target URL และ config ใดที่ service น่าจะใช้

4. **probe แบบลึก**

   ```bash
   openclaw status --deep
   ```

   รัน live gateway health probe รวมถึง channel probe เมื่อรองรับ
   (ต้องเข้าถึง gateway ได้) ดู [Health](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ใช้งานไม่ได้ ให้ fallback ไปใช้:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   file log แยกจาก service log; ดู [Logging](/th/logging) และ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health check ดู [Doctor](/th/gateway/doctor)

7. **snapshot ของ Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง target URL + config path เมื่อเกิดข้อผิดพลาด
   ```

   ขอ snapshot แบบเต็มจาก gateway ที่กำลังทำงานอยู่ (WS-only) ดู [Health](/th/gateway/health)

## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

<AccordionGroup>
  <Accordion title="ฉันติดปัญหาอยู่ วิธีที่เร็วที่สุดในการหลุดจากปัญหาคืออะไร">
    ใช้ AI agent ภายในเครื่องที่ **มองเห็นเครื่องของคุณได้** วิธีนี้มีประสิทธิภาพมากกว่าการถาม
    ใน Discord มาก เพราะกรณี “ฉันติดปัญหาอยู่” ส่วนใหญ่คือปัญหา **config หรือ environment ภายในเครื่อง**
    ที่ผู้ช่วยจากระยะไกลตรวจดูไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่าน repo, รันคำสั่ง, ตรวจสอบ log และช่วยแก้การตั้งค่าระดับเครื่องของคุณ
    (PATH, services, permissions, auth files) ให้สิทธิ์พวกมันกับ **ซอร์สโค้ดเต็มทั้ง checkout** ผ่าน
    การติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    สิ่งนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้ agent อ่านโค้ด + เอกสาร และ
    ให้เหตุผลกับเวอร์ชันที่คุณกำลังรันได้อย่างแม่นยำ คุณสามารถสลับกลับไปใช้ stable ภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่ต้องใส่ `--install-method git`

    เคล็ดลับ: ขอให้ agent **วางแผนและกำกับดูแล** การแก้ไข (ทีละขั้นตอน) แล้วจึงให้รันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ช่วยให้การเปลี่ยนแปลงเล็กลงและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบ bug จริงหรือมีวิธีแก้ กรุณาส่ง GitHub issue หรือ PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มต้นด้วยคำสั่งเหล่านี้ (แชร์ผลลัพธ์เมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่แต่ละคำสั่งทำ:

    - `openclaw status`: snapshot อย่างรวดเร็วของสุขภาพ gateway/agent + config พื้นฐาน
    - `openclaw models status`: ตรวจสอบ auth ของ provider + ความพร้อมของโมเดล
    - `openclaw doctor`: ตรวจสอบและซ่อมปัญหา config/state ทั่วไป

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    ลูปดีบักแบบเร็ว: [60 วินาทีแรกหากมีบางอย่างเสีย](#60-วินาทีแรกหากมีบางอย่างเสีย)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟลกของตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ถูกข้ามตลอด เหตุผลการข้ามแต่ละแบบหมายความว่าอะไร">
    เหตุผลการข้าม heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกหน้าต่าง active-hours ที่กำหนดไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงเปล่าที่เป็นบรรทัดว่าง/heading เท่านั้น
    - `no-tasks-due`: เปิดใช้ task mode ของ `HEARTBEAT.md` อยู่ แต่ยังไม่มีช่วงเวลาของ task ใดถึงกำหนด
    - `alerts-disabled`: ปิดการมองเห็นของ heartbeat ทั้งหมดแล้ว (`showOk`, `showAlerts` และ `useIndicator` ปิดทั้งหมด)

    ใน task mode เวลาประทับ due จะถูกเลื่อนไปข้างหน้าหลังจากการรัน heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติและงาน](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถ build asset ของ UI ให้อัตโนมัติได้ด้วย หลัง onboarding ปกติคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (สำหรับผู้ร่วมพัฒนา/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    หากคุณยังไม่มี global install ให้รันผ่าน `pnpm openclaw onboard`

  </Accordion>

  <Accordion title="หลัง onboarding แล้วฉันจะเปิด dashboard ได้อย่างไร">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย dashboard URL แบบสะอาด (ไม่มี token อยู่ใน URL) ทันทีหลัง onboarding และยังพิมพ์ลิงก์ไว้ในสรุปด้วย ให้เปิดแท็บนั้นค้างไว้; หากมันไม่เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนกับ dashboard บน localhost เทียบกับแบบ remote ได้อย่างไร">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วาง token หรือรหัสผ่านที่กำหนดไว้ใน settings ของ Control UI
    - แหล่งที่มาของ token: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้ตั้ง shared secret ให้สร้าง token ด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่ localhost:**

    - **Tailscale Serve** (แนะนำ): bind ไว้ที่ loopback, รัน `openclaw gateway --tailscale serve`, เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true`, header ตัวตนจะตอบสนอง auth ของ Control UI/WebSocket (ไม่ต้องวาง shared secret เอง โดยสมมติว่าโฮสต์ gateway เชื่อถือได้); HTTP API ยังต้องใช้ shared-secret auth เว้นแต่คุณจะตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม auth ผ่าน Serve ที่ผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้นการลองผิดครั้งที่สองอาจขึ้น `retry later` ได้เลย
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนด password auth), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันใน settings ของ dashboard
    - **Identity-aware reverse proxy**: ให้ Gateway อยู่หลัง trusted proxy แบบ non-loopback, กำหนด `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` shared-secret auth ยังมีผลผ่าน tunnel; ให้วาง token หรือรหัสผ่านที่กำหนดไว้หากระบบถาม

    ดู [Dashboard](/web/dashboard) และ [พื้นผิวเว็บ](/web) สำหรับรายละเอียด bind mode และ auth

  </Accordion>

  <Accordion title="ทำไมถึงมีคอนฟิก exec approval สำหรับ chat approvals สองแบบ">
    มันควบคุมคนละชั้นกัน:

    - `approvals.exec`: ส่งต่อพรอมป์การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องนั้นทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟสำหรับ exec approval

    host exec policy ยังคงเป็นเกตการอนุมัติจริง คอนฟิกของแชตควบคุมเพียงว่าพรอมป์
    การอนุมัติจะไปโผล่ที่ไหน และคนจะตอบกลับอย่างไร

    ในการตั้งค่าส่วนใหญ่คุณ **ไม่จำเป็น** ต้องมีทั้งสองแบบ:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันก็ใช้งานได้ผ่านเส้นทางร่วม
    - หากช่องแบบเนทีฟที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิด native approval แบบ DM-first ให้อัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าหรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติแบบเนทีฟ available, UI แบบเนทีฟนั้นคือเส้นทางหลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อจำเป็นต้องส่งต่อพรอมป์ไปยังแชตอื่นหรือห้อง ops ที่ระบุชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้มีการโพสต์พรอมป์การอนุมัติกลับไปยังห้อง/topic ต้นทางโดยตรง
    - การอนุมัติของ Plugin ก็แยกต่างหากอีกชั้น: ใช้ `/approve` ในแชตเดียวกันเป็นค่าเริ่มต้น, มี `approvals.plugin` forwarding แบบไม่บังคับ และมีเพียงบางช่องแบบเนทีฟเท่านั้นที่ยังมีการจัดการ plugin-approval-native ทับลงไปอีก

    สรุปสั้น ๆ: forwarding มีไว้สำหรับ routing ส่วน native client config มีไว้สำหรับ UX ที่เจาะจงตามช่องและสมบูรณ์กว่า
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร">
    ต้องใช้ Node **>= 22** แนะนำ `pnpm` ไม่แนะนำ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="มันรันบน Pi ได้ไหม">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 คอร์** และพื้นที่ดิสก์ประมาณ **500MB**
    ก็เพียงพอสำหรับการใช้งานส่วนตัว และยังระบุด้วยว่า **Pi 4 สามารถรันได้**

    หากคุณต้องการเผื่อเหลือเผื่อขาดมากขึ้น (log, media, services อื่น) แนะนำ **2GB** แต่
    ไม่ใช่ขั้นต่ำแบบตายตัว

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **node** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอภายในเครื่อง กล้อง canvas หรือการรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Pi ไหม">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีมุมขรุขระอยู่บ้าง

    - ใช้ OS แบบ **64-bit** และคง Node >= 22
    - ควรใช้การติดตั้งแบบ **hackable (git)** เพื่อให้ดู log และอัปเดตได้เร็ว
    - เริ่มโดยไม่ใส่ channels/Skills ก่อน แล้วค่อยเพิ่มทีละอย่าง
    - หากคุณเจอปัญหาแปลก ๆ กับไบนารี ส่วนใหญ่มักเป็นปัญหา **ความเข้ากันได้ของ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="มันค้างที่ wake up my friend / onboarding ฟักไม่ออก ต้องทำอย่างไร">
    หน้าจอนั้นขึ้นอยู่กับว่าเข้าถึง Gateway ได้และยืนยันตัวตนสำเร็จหรือไม่ TUI ยังส่ง
    "Wake up, my friend!" ให้อัตโนมัติในการ hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นแล้ว **ไม่มีคำตอบ**
    และ token ยังคงเป็น 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ต Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ให้แน่ใจว่า tunnel/Tailscale เชื่อมต่ออยู่ และ UI
    ชี้ไปที่ Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้ไหม">
    ได้ ให้คัดลอก **ไดเรกทอรี state** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้จะ
    คงบอตของคุณ “เหมือนเดิมทุกอย่าง” (หน่วยความจำ ประวัติเซสชัน auth และสถานะ
    ของช่อง) ตราบใดที่คุณคัดลอก **ทั้งสองตำแหน่ง**:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ตบริการ Gateway

    นั่นจะคง config, auth profile, ข้อมูลรับรองของ WhatsApp, sessions และหน่วยความจำไว้ หากคุณอยู่ใน
    remote mode โปรดจำไว้ว่าโฮสต์ gateway เป็นผู้ถือครอง session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณขึ้น GitHub คุณกำลังสำรอง
    **หน่วยความจำ + ไฟล์ bootstrap** แต่ **ไม่ได้** สำรองประวัติเซสชันหรือ auth สิ่งเหล่านั้นอยู่
    ภายใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [ไฟล์ต่าง ๆ อยู่ตรงไหนบนดิสก์](#ไฟล์ต่าง-ๆ-อยู่ตรงไหนบนดิสก์),
    [workspace ของเอเจนต์](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูได้จากที่ไหนว่ามีอะไรใหม่ในเวอร์ชันล่าสุด">
    ดู changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่สุดอยู่ด้านบน หากส่วนบนสุดมีเครื่องหมาย **Unreleased** ส่วนที่มีวันที่ถัดลงมาคือ
    เวอร์ชันที่เผยแพร่ล่าสุด รายการจะถูกจัดกลุ่มเป็น **Highlights**, **Changes** และ
    **Fixes** (รวมถึงส่วน docs/อื่น ๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้า docs.openclaw.ai ไม่ได้ (SSL error)">
    การเชื่อมต่อ Comcast/Xfinity บางแห่งบล็อก `docs.openclaw.ai` ผิดพลาดผ่าน Xfinity
    Advanced Security ให้ปิดมันหรือเพิ่ม `docs.openclaw.ai` เข้า allowlist แล้วลองใหม่
    โปรดช่วยเราปลดบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าเว็บไซต์ไม่ได้ เอกสารถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable กับ beta">
    **Stable** และ **beta** เป็น **npm dist-tag** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = build รุ่นก่อนหน้าเพื่อการทดสอบ

    โดยปกติ stable release จะขึ้นไปที่ **beta** ก่อน จากนั้นจะมีขั้นตอน
    promotion แบบ explicit ที่เลื่อนเวอร์ชันเดียวกันนั้นไปยัง `latest` ฝ่ายดูแลยังสามารถ
    เผยแพร่ตรงไปที่ `latest` ได้เมื่อจำเป็น จึงเป็นเหตุผลว่าทำไม beta และ stable จึงอาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังการ promotion

    ดูว่ามีอะไรเปลี่ยนไป:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับ one-liner การติดตั้งและความต่างระหว่าง beta กับ dev ดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งรุ่น beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลัง promotion)
    **Dev** คือส่วนหัวที่เคลื่อนที่ของ `main` (git); เมื่อมีการ publish จะใช้ npm dist-tag `dev`

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้งบน Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟลกของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร">
    มีสองทางเลือก:

    1. **ช่อง dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    สิ่งนี้จะสลับไปที่สาขา `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งแบบ hackable (จากเว็บไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    สิ่งนี้จะให้ local repo ที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณชอบการ clone แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [Update](/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ปกติแล้วการติดตั้งและ onboarding ใช้เวลานานแค่ไหน">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวนช่อง/โมเดลที่คุณกำหนดค่า

    หากมันค้าง ให้ใช้ [ตัวติดตั้งค้าง](#การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก)
    และลูปดีบักเร็วใน [ฉันติดปัญหาอยู่](#การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดูข้อมูลเพิ่มเติมได้อย่างไร">
    รันตัวติดตั้งใหม่ด้วย **verbose output**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง beta พร้อม verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    คำสั่งเทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 ยังไม่มีแฟลก -Verbose โดยเฉพาะ
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟลกของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows ขึ้นว่า git not found หรือ openclaw not recognized">
    มีปัญหาบน Windows ที่พบบ่อยสองอย่าง:

    **1) npm error spawn git / git not found**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่บน PATH
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นรันตัวติดตั้งอีกครั้ง

    **2) openclaw is not recognized หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่บน PATH
    - ตรวจสอบพาธ:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นลงใน user PATH (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่มันคือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ลื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบเนทีฟ
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ฉันควรทำอย่างไร">
    โดยทั่วไปนี่คือปัญหา console code page ไม่ตรงกันบน shell แบบเนทีฟของ Windows

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็นตัวเพี้ยน
    - คำสั่งเดียวกันแสดงผลปกติในโปรไฟล์เทอร์มินัลอื่น

    วิธีแก้ชั่วคราวแบบเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้นรีสตาร์ต Gateway แล้วลองคำสั่งอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยังทำให้เกิดปัญหานี้ได้บน OpenClaw เวอร์ชันล่าสุด ให้ติดตาม/รายงานไว้ที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่านี้ได้อย่างไร">
    ใช้การติดตั้งแบบ **hackable (git)** เพื่อให้คุณมีซอร์สโค้ดและเอกสารครบในเครื่อง แล้วถาม
    บอตของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟลกของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางด่วนบน Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [การติดตั้งและการอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร">
    Linux VPS ใดก็ได้ใช้งานได้ ติดตั้งบนเซิร์ฟเวอร์ จากนั้นใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway remote](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบน cloud/VPS อยู่ที่ไหน">
    เรามี **ศูนย์รวมการโฮสต์** สำหรับผู้ให้บริการที่พบบ่อย เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [การโฮสต์ VPS](/th/vps) (รวมผู้ให้บริการทั้งหมดไว้ในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบนคลาวด์: **Gateway รันบนเซิร์ฟเวอร์** และคุณเข้าถึงมัน
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่าโฮสต์นั้นเป็นแหล่งข้อมูลจริงและสำรองมันไว้

    คุณสามารถจับคู่ **node** (Mac/iOS/Android/headless) กับ Gateway บนคลาวด์นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ภายในเครื่อง หรือรันคำสั่งบนแล็ปท็อปของคุณ ขณะที่ยังคงให้
    Gateway อยู่บนคลาวด์

    ศูนย์รวม: [Platforms](/th/platforms) การเข้าถึงระยะไกล: [Gateway remote](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [CLI ของ Nodes](/cli/nodes)

  </Accordion>

  <Accordion title="ฉันสั่งให้ OpenClaw อัปเดตตัวเองได้ไหม">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** โฟลว์การอัปเดตอาจรีสตาร์ต
    Gateway (ซึ่งจะตัดเซสชันที่กำลังใช้งาน), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจถามเพื่อยืนยัน วิธีที่ปลอดภัยกว่าคือรันการอัปเดตจาก shell ในฐานะผู้ดูแล

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำอัตโนมัติจากเอเจนต์:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [Update](/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ บ้าง">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **local mode** มันจะพาคุณผ่าน:

    - **การตั้งค่าโมเดล/auth** (OAuth ของ provider, API key, setup-token ของ Anthropic รวมถึงตัวเลือกโมเดลภายในเครื่อง เช่น LM Studio)
    - ตำแหน่งของ **workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง channel plugin ที่มาพร้อมในชุดอย่าง QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **Skills**

    มันยังเตือนด้วยหากโมเดลที่คุณกำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันจำเป็นต้องมี Claude หรือ OpenAI subscription เพื่อรันสิ่งนี้ไหม">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API key** (Anthropic/OpenAI/อื่น ๆ) หรือใช้
    **โมเดลภายในเครื่องล้วน** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณเอง Subscriptions (Claude
    Pro/Max หรือ OpenAI Codex) เป็นเพียงตัวเลือกในการยืนยันตัวตนกับผู้ให้บริการเหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งแบบใช้งานจริงคือ:

    - **Anthropic API key**: คิดค่าบริการตาม Anthropic API ปกติ
    - **Claude CLI / auth จาก Claude subscription ใน OpenClaw**: ทีมงาน Anthropic
      แจ้งเราว่าการใช้งานแบบนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw กำลังถือว่าการใช้ `claude -p`
      ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับโฮสต์ gateway แบบระยะยาว Anthropic API key ยังคงเป็น
    การตั้งค่าที่คาดเดาได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ
    ภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือกแบบ subscription-style ที่โฮสต์อยู่ที่อื่น รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [โมเดลภายในเครื่อง](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่ใช้ API key ได้ไหม">
    ได้

    ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น
    OpenClaw จึงถือว่า auth จาก Claude subscription และการใช้ `claude -p` เป็นสิ่งที่ได้รับการรับรอง
    สำหรับการผสานรวมนี้ เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดเดาได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ auth จาก Claude subscription (Claude Pro หรือ Max) ไหม">
    รองรับ

    ทีมงาน Anthropic แจ้งเราว่าการใช้งานแบบนี้ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นสิ่งที่ได้รับการรับรองสำหรับการผสานรวมนี้
    เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่

    setup-token ของ Anthropic ยังคงใช้ได้ในฐานะเส้นทาง token ที่ OpenClaw รองรับ แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้
    สำหรับงาน production หรือโหลดงานแบบหลายผู้ใช้ auth ด้วย Anthropic API key ยังคงเป็น
    ตัวเลือกที่ปลอดภัยกว่าและคาดเดาได้มากกว่า หากคุณต้องการตัวเลือกแบบ subscription-style ที่โฮสต์อยู่ที่อื่น
    ใน OpenClaw ให้ดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="ทำไมฉันถึงเห็น HTTP 429 rate_limit_error จาก Anthropic">
นั่นหมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดลงสำหรับหน้าต่างเวลาปัจจุบันแล้ว หากคุณ
ใช้ **Claude CLI** ให้รอจนกว่าหน้าต่างจะรีเซ็ตหรืออัปเกรดแพ็กเกจของคุณ หากคุณ
ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
เรื่องการใช้งาน/การเรียกเก็บเงินและเพิ่มขีดจำกัดตามความจำเป็น

    หากข้อความเป็นแบบนี้โดยเฉพาะ:
    `Extra usage is required for long context requests` หมายความว่าคำขอกำลังพยายามใช้
    1M context beta ของ Anthropic (`context1m: true`) ซึ่งจะทำงานได้ก็ต่อเมื่อ
    ข้อมูลรับรองของคุณมีสิทธิ์ใช้การเรียกเก็บเงินแบบ long-context (การเรียกเก็บผ่าน API key หรือ
    เส้นทาง Claude-login ของ OpenClaw ที่เปิด Extra Usage อยู่)

    เคล็ดลับ: ตั้ง **fallback model** เพื่อให้ OpenClaw ยังตอบกลับได้ในขณะที่ provider ถูก rate-limit
    ดู [Models](/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock ไหม">
    รองรับ OpenClaw มี provider **Amazon Bedrock (Converse)** ที่มาพร้อมในชุด เมื่อมีตัวบ่งชี้ env ของ AWS อยู่ OpenClaw สามารถค้นหา catalog ของ Bedrock สำหรับการสตรีม/ข้อความแบบอัตโนมัติและ merge เข้ามาเป็น provider `amazon-bedrock` แบบ implicit ได้; มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการ provider ด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบ managed การมีพร็อกซีที่เข้ากันได้กับ OpenAI ไว้หน้า Bedrock ก็ยังเป็นทางเลือกที่ใช้ได้เช่นกัน
  </Accordion>

  <Accordion title="auth ของ Codex ทำงานอย่างไร">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (ลงชื่อเข้าใช้ ChatGPT) Onboarding สามารถรันโฟลว์ OAuth ให้คุณได้ และจะตั้งโมเดลเริ่มต้นเป็น `openai-codex/gpt-5.4` เมื่อเหมาะสม ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม ChatGPT GPT-5.4 ถึงไม่ปลดล็อก openai/gpt-5.4 ใน OpenClaw">
    OpenClaw ถือว่าเส้นทางทั้งสองนี้แยกจากกัน:

    - `openai-codex/gpt-5.4` = OAuth ของ ChatGPT/Codex
    - `openai/gpt-5.4` = OpenAI Platform API โดยตรง

    ใน OpenClaw การลงชื่อเข้าใช้ ChatGPT/Codex จะเชื่อมกับเส้นทาง `openai-codex/*`
    ไม่ใช่เส้นทาง `openai/*` โดยตรง หากคุณต้องการเส้นทาง API โดยตรงใน
    OpenClaw ให้ตั้ง `OPENAI_API_KEY` (หรือคอนฟิก provider ของ OpenAI ที่เทียบเท่ากัน)
    หากคุณต้องการการลงชื่อเข้าใช้ ChatGPT/Codex ใน OpenClaw ให้ใช้ `openai-codex/*`

  </Accordion>

  <Accordion title="ทำไมขีดจำกัดของ Codex OAuth ถึงต่างจากบน ChatGPT web ได้">
    `openai-codex/*` ใช้เส้นทาง Codex OAuth และหน้าต่าง quota ที่ใช้ได้ของมันนั้น
    ถูกจัดการโดย OpenAI และขึ้นกับแพ็กเกจ ในทางปฏิบัติ ขีดจำกัดเหล่านั้นอาจต่างจาก
    ประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่าทั้งคู่จะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่างการใช้งาน/quota ของ provider ที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือ normalize สิทธิ์ของ ChatGPT-web
    ให้กลายเป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ใช้ `openai/*` พร้อม API key

  </Accordion>

  <Accordion title="คุณรองรับ auth แบบ OpenAI subscription (Codex OAuth) ไหม">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างสมบูรณ์
    OpenAI อนุญาตอย่างชัดเจนให้ใช้ subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    อย่าง OpenClaw Onboarding สามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร">
    Gemini CLI ใช้ **plugin auth flow** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลัง login: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway

    สิ่งนี้จะจัดเก็บ OAuth token ไว้ใน auth profile บนโฮสต์ gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลภายในเครื่องใช้คุยทั่วไปแบบสบาย ๆ ได้ไหม">
    โดยทั่วไปไม่ได้ OpenClaw ต้องการ context ขนาดใหญ่ + ความปลอดภัยที่แข็งแรง; การ์ดเล็ก ๆ จะตัดทอนและรั่วไหล หากคุณจำเป็นต้องใช้ ให้รัน build ของโมเดลที่ **ใหญ่ที่สุด** เท่าที่ทำได้ในเครื่อง (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กลง/ถูก quantize จะเพิ่มความเสี่ยงจาก prompt injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะทำให้ทราฟฟิกของโมเดลที่โฮสต์อยู่คงอยู่ใน region ที่กำหนดได้อย่างไร">
    เลือก endpoint ที่ pin region ไว้ OpenRouter มีตัวเลือกแบบโฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; เลือกตัวแปรที่โฮสต์ในสหรัฐฯ เพื่อคงข้อมูลให้อยู่ใน region นั้น คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่กับสิ่งเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังคงพร้อมใช้งาน ขณะที่ยังเคารพ provider ตาม region ที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อมาติดตั้งสิ่งนี้ไหม">
    ไม่ OpenClaw รันได้บน macOS หรือ Linux (Windows ผ่าน WSL2) Mac mini เป็นทางเลือกเท่านั้น - บางคน
    ซื้อมาเป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก home server หรือเครื่องระดับ Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac **เฉพาะสำหรับเครื่องมือที่มีบน macOS เท่านั้น** สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ ส่วน Gateway จะรันบน Linux หรือที่อื่นก็ได้ หากคุณต้องการเครื่องมือเฉพาะ macOS อื่น ๆ ให้รัน Gateway บน Mac หรือจับคู่ macOS node

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes), [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage ไหม">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่องหนึ่ง** ที่ลงชื่อเข้าใช้ Messages อยู่ มัน **ไม่จำเป็น** ต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ **ให้ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ในขณะที่ Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าที่พบบ่อย:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac เครื่องใดก็ได้ที่ลงชื่อเข้าใช้ Messages อยู่
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าแบบเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes),
    [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini มารัน OpenClaw ฉันจะเชื่อมมันกับ MacBook Pro ได้ไหม">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่หู) ได้ Node จะไม่รัน Gateway - แต่จะเพิ่ม
    ความสามารถอย่างหน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบที่พบบ่อย:

    - Gateway อยู่บน Mac mini (เปิดตลอด)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node แล้วจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูมัน

    เอกสาร: [Nodes](/th/nodes), [CLI ของ Nodes](/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบบั๊กในรันไทม์ โดยเฉพาะกับ WhatsApp และ Telegram
    ให้ใช้ **Node** สำหรับ gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ฉันต้องใส่อะไรใน allowFrom">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ username ของบอต

    ระบบตั้งค่าจะถามหาเฉพาะ user ID แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` แบบ legacy อยู่แล้วใน config, `openclaw doctor --fix` สามารถลอง resolve ให้ได้

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    - ส่ง DM หาบอตของคุณ แล้วรัน `openclaw logs --follow` จากนั้นอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - ส่ง DM หาบอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` แล้วอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - ส่ง DM ถึง `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนใช้หมายเลข WhatsApp เดียวกันกับ OpenClaw คนละอินสแตนซ์ได้ไหม">
    ได้ ผ่าน **การกำหนดเส้นทางหลายเอเจนต์** ผูก **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, sender แบบ E.164 เช่น `+15551234567`) เข้ากับ `agentId` คนละตัว เพื่อให้แต่ละคนมี workspace และ session store ของตัวเอง คำตอบยังคงส่งกลับจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบส่วนกลางต่อบัญชี WhatsApp นั้น ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันสามารถมีเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้ไหม'>
    ได้ ใช้การกำหนดเส้นทางหลายเอเจนต์: ให้แต่ละเอเจนต์มีโมเดลเริ่มต้นของตัวเอง จากนั้นผูกเส้นทางขาเข้า (บัญชี provider หรือ peer ที่ระบุชัดเจน) เข้ากับแต่ละเอเจนต์ ตัวอย่าง config อยู่ใน [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติมที่ [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้บน Linux ได้ไหม">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ให้ตรวจสอบว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ brew prefix ของคุณ) อยู่ด้วย เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` ถูก resolve ได้ใน non-login shell
    build รุ่นใหม่ยัง prepend ไดเรกทอรี user bin ที่พบบ่อยบนบริการ Linux systemd ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และยังรองรับ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อมีการตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้งแบบ hackable git กับ npm install">
    - **การติดตั้งแบบ hackable (git):** มีซอร์สโค้ดเต็ม checkout, แก้ไขได้, เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณ build ภายในเครื่องและ patch โค้ด/เอกสารได้
    - **npm install:** ติดตั้ง CLI แบบ global, ไม่มี repo, เหมาะสำหรับแบบ “แค่รันมัน”
      การอัปเดตมาจาก npm dist-tag

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสามารถสลับไปมาระหว่างการติดตั้งแบบ npm กับ git ภายหลังได้ไหม">
    ได้ ติดตั้งแบบอีกฝั่งหนึ่ง แล้วรัน Doctor เพื่อให้บริการ gateway ชี้ไปยัง entrypoint ใหม่
    สิ่งนี้ **ไม่ลบข้อมูลของคุณ** - มันเพียงเปลี่ยนการติดตั้งโค้ดของ OpenClaw เท่านั้น state ของคุณ
    (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) จะยังคงอยู่โดยไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    จาก git ไป npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor จะตรวจพบความไม่ตรงกันของ gateway service entrypoint และเสนอให้เขียน config ของ service ใหม่ให้ตรงกับการติดตั้งปัจจุบัน (ใช้ `--repair` ในงานอัตโนมัติ)

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](#ไฟล์ต่าง-ๆ-อยู่ตรงไหนบนดิสก์)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือบน VPS">
    คำตอบสั้น ๆ: **หากคุณต้องการความเสถียรตลอด 24/7 ให้ใช้ VPS** หากคุณต้องการ
    เสียดทานต่ำที่สุดและรับได้กับการ sleep/restart ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ภายในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์ เข้าถึงไฟล์ในเครื่องโดยตรง มีหน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = ตัดการเชื่อมต่อ, การอัปเดต OS/รีบูตจะรบกวน, เครื่องต้องไม่หลับ

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อป sleep, ดูแลง่ายกว่าให้ทำงานต่อเนื่อง
    - **ข้อเสีย:** มักรันแบบ headless (ใช้ screenshot), เข้าถึงไฟล์ได้เฉพาะระยะไกล, คุณต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ใช้งานได้ดีทั้งหมดจาก VPS สิ่งที่ต้องชั่งน้ำหนักจริง ๆ คือ **เบราว์เซอร์แบบ headless** เทียบกับหน้าต่างที่มองเห็นได้ ดู [Browser](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยเจอ gateway disconnect มาก่อน การรันในเครื่องเหมาะมากเมื่อคุณใช้งาน Mac อยู่แล้วและต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน">
    ไม่จำเป็น แต่ **แนะนำเพื่อความเสถียรและการแยกขอบเขต**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดตลอดเวลา, มีการรบกวนจาก sleep/reboot น้อยกว่า, permission สะอาดกว่า, ดูแลง่ายกว่าให้รันต่อเนื่อง
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ได้ดีสำหรับการทดสอบและการใช้งานจริงระหว่างวัน แต่คาดว่าจะหยุดชั่วคราวเมื่อเครื่อง sleep หรืออัปเดต

    หากคุณต้องการข้อดีทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะ และจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือ screen/camera/exec ในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับแนวทางด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และระบบปฏิบัติการที่แนะนำคืออะไร">
    OpenClaw มีน้ำหนักเบา สำหรับ Gateway พื้นฐาน + หนึ่งช่องแชต:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ ~500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB หรือมากกว่าเพื่อเผื่อพื้นที่ (log, media, หลายช่อง) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรค่อนข้างมาก

    ระบบปฏิบัติการ: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่อื่น ๆ) เส้นทางการติดตั้งบน Linux ถูกทดสอบดีที่สุดบนระบบเหล่านี้

    เอกสาร: [Linux](/th/platforms/linux), [การโฮสต์ VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และต้องการอะไรบ้าง">
    ได้ ปฏิบัติกับ VM แบบเดียวกับ VPS: มันต้องเปิดอยู่ตลอด เข้าถึงได้ และมี
    RAM เพียงพอสำหรับ Gateway และช่องต่าง ๆ ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB หรือมากกว่า หากคุณรันหลายช่อง browser automation หรือ media tools
    - **ระบบปฏิบัติการ:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows, **WSL2 คือการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด
    ดู [Windows](/th/platforms/windows), [การโฮสต์ VPS](/th/vps)
    หากคุณรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไร ในหนึ่งย่อหน้า">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ channel plugin ที่มาพร้อมในชุด เช่น QQ Bot) และยังทำเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane แบบเปิดตลอดเวลา; ส่วนผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าหลัก">
    OpenClaw ไม่ใช่ “แค่ตัวห่อ Claude” แต่มันคือ **local-first control plane** ที่ทำให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    เซสชันแบบมีสถานะ หน่วยความจำ และเครื่องมือ - โดยไม่ต้องยกการควบคุมเวิร์กโฟลว์ของคุณให้กับ
    SaaS ที่โฮสต์โดยผู้อื่น

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ไหนก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติเซสชันไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ sandbox บนเว็บ:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/อื่น ๆ
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทางรายเอเจนต์
      และ failover
    - **ตัวเลือกแบบในเครื่องล้วน:** รันโมเดลภายในเครื่อง เพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณ** ได้ หากคุณต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยกเอเจนต์ตามช่อง บัญชี หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและแก้ไขได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรเป็นอย่างแรก">
    โปรเจกต์แรก ๆ ที่ดีมีเช่น:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site แบบง่าย)
    - ทำต้นแบบแอปมือถือ (โครงร่าง หน้าจอ แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (ทำความสะอาด ตั้งชื่อ แท็ก)
    - เชื่อม Gmail แล้วทำสรุปหรือระบบติดตามอัตโนมัติ

    มันจัดการงานใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานออกเป็นหลายเฟส และ
    ใช้ sub-agent สำหรับงานขนาน

  </Accordion>

  <Accordion title="ห้า use case ประจำวันที่ดีที่สุดของ OpenClaw คืออะไร">
    สิ่งที่มักใช้แล้วเห็นผลทุกวันมักมีลักษณะดังนี้:

    - **สรุปส่วนตัว:** สรุปกล่องจดหมาย ปฏิทิน และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่างเอกสาร:** ค้นคว้าอย่างรวดเร็ว สรุป และทำร่างแรกสำหรับอีเมลหรือเอกสาร
    - **การเตือนและการติดตาม:** การสะกิดและเช็กลิสต์ที่ขับเคลื่อนด้วย cron หรือ Heartbeat
    - **Browser automation:** กรอกฟอร์ม เก็บข้อมูล และทำงานบนเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ของคุณ ให้ Gateway รันมันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับมาในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, โฆษณา และบล็อกสำหรับ SaaS ได้ไหม">
    ได้สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสามารถสแกนเว็บไซต์ สร้าง shortlists,
    สรุปข้อมูลผู้มุ่งหวัง และเขียนร่างข้อความ outreach หรือโฆษณาได้

    สำหรับ **การ outreach หรือรันโฆษณา** ควรมีมนุษย์อยู่ในลูปเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณเป็นผู้อนุมัติ

    เอกสาร: [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex หากคุณต้องการลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการหน่วยความจำที่คงอยู่ การเข้าถึงข้ามอุปกรณ์ และการ orchestration ของเครื่องมือ

    ข้อได้เปรียบ:

    - **หน่วยความจำ + workspace แบบถาวร** ข้ามเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การ orchestration ของเครื่องมือ** (เบราว์เซอร์ ไฟล์ การจัดตารางเวลา hooks)
    - **Gateway แบบเปิดตลอด** (รันบน VPS แล้วโต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับ browser/screen/camera/exec ภายในเครื่อง

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้ repo สกปรกได้อย่างไร">
    ใช้ managed override แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ที่ `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → ที่มาพร้อมระบบ → `skills.load.extraDirs` ดังนั้น managed override ยังคงมีความสำคัญเหนือ Skills ที่มาพร้อมในชุดโดยไม่ต้องแตะ git หากคุณต้องการให้ skill ติดตั้งแบบ global แต่ให้มองเห็นได้เฉพาะบางเอเจนต์ ให้เก็บสำเนาที่ใช้ร่วมกันไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่เหมาะส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PR
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม">
    ได้ เพิ่มไดเรกทอรีพิเศษผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → ที่มาพร้อมในชุด → `skills.load.extraDirs` `clawhub` จะติดตั้งลงใน `./skills` เป็นค่าเริ่มต้น ซึ่ง OpenClaw จะถือว่าเป็น `<workspace>/skills` ในเซสชันถัดไป หาก skill ควรมองเห็นได้เฉพาะบางเอเจนต์ ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร">
    ปัจจุบันรูปแบบที่รองรับคือ:

    - **งาน Cron**: งานแบบ isolated สามารถตั้ง `model` override รายงานได้
    - **Sub-agent**: กำหนดเส้นทางงานไปยังเอเจนต์แยกต่างหากที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเมื่อ

    ดู [งาน Cron](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างระหว่างทำงานหนัก ฉันจะ offload มันได้อย่างไร">
    ใช้ **sub-agent** สำหรับงานที่ยาวหรืองานขนาน Sub-agent จะรันในเซสชันของตัวเอง
    ส่งกลับเป็นสรุป และทำให้แชตหลักของคุณยังตอบสนองได้

    บอกบอตของคุณให้ “spawn a sub-agent for this task” หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งหรือไม่)

    เคล็ดลับเรื่อง token: ทั้งงานยาวและ sub-agent ใช้ token หากกังวลเรื่องค่าใช้จ่าย ให้ตั้ง
    โมเดลที่ถูกกว่าสำหรับ sub-agent ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="เซสชัน subagent ที่ผูกกับ thread บน Discord ทำงานอย่างไร">
    ใช้ thread binding คุณสามารถผูก Discord thread เข้ากับ subagent หรือเป้าหมายเซสชัน เพื่อให้ข้อความติดตามใน thread นั้นคงอยู่บนเซสชันที่ผูกไว้

    โฟลว์พื้นฐาน:

    - spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และจะใส่ `mode: "session"` ด้วยก็ได้สำหรับการติดตามแบบถาวร)
    - หรือผูกด้วยตนเองผ่าน `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุมการ auto-unfocus
    - ใช้ `/unfocus` เพื่อถอด thread ออก

    คอนฟิกที่จำเป็น:

    - ค่าเริ่มต้นแบบส่วนกลาง: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - override ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - ผูกอัตโนมัติตอน spawn: ตั้ง `channels.discord.threadBindings.spawnSubagentSessions: true`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="Subagent ตัวหนึ่งทำงานเสร็จแล้ว แต่การอัปเดตผลลัพธ์กลับไปผิดที่หรือไม่โพสต์เลย ฉันควรตรวจอะไรบ้าง">
    ให้ตรวจ requester route ที่ resolve แล้วก่อน:

    - การส่งมอบ subagent แบบ completion-mode จะให้ความสำคัญกับ thread หรือ conversation route ที่ถูกผูกไว้ หากมีอยู่
    - หากต้นทางของ completion มีเพียง channel เท่านั้น OpenClaw จะ fallback ไปใช้ route ที่เก็บไว้ใน requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้ง route ที่ถูกผูกไว้และ route ที่เก็บไว้ซึ่งใช้งานได้ การส่งโดยตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปยังการส่งมอบผ่าน queued session แทนการโพสต์เข้าแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือค้างเก่าอาจยังคงบังคับให้ fallback ไปคิว หรือทำให้การส่งมอบขั้นสุดท้ายล้มเหลว
    - หากคำตอบ assistant ล่าสุดที่มองเห็นได้ของ child เป็น silent token `NO_REPLY` / `no_reply` ตรงตัว หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะระงับการ announce โดยตั้งใจ แทนที่จะโพสต์ความคืบหน้าก่อนหน้าที่ค้างเก่า
    - หาก child หมดเวลาไปหลังจากมีเพียงการเรียก tool การ announce อาจยุบสิ่งนั้นให้กลายเป็นสรุปความคืบหน้าบางส่วนแบบสั้น แทนที่จะเล่นซ้ำเอาต์พุตดิบของ tool

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือการเตือนไม่ทำงาน ฉันควรตรวจอะไรบ้าง">
    Cron รันอยู่ภายในโปรเซส Gateway หาก Gateway ไม่ได้ทำงานต่อเนื่อง
    งานตามกำหนดเวลาจะไม่รัน

    เช็กลิสต์:

    - ยืนยันว่าเปิดใช้ cron อยู่ (`cron.enabled`) และไม่ได้ตั้ง `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway ทำงานตลอด 24/7 (ไม่มี sleep/restart)
    - ตรวจสอบการตั้งค่าเขตเวลาของงาน (`--tz` เทียบกับเขตเวลาของโฮสต์)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง เพราะอะไร">
    ให้ตรวจโหมดการส่งมอบก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดหวังการส่งแบบ fallback โดย runner
    - หากไม่มีหรือเป้าหมาย announce ไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งขาออก
    - ความล้มเหลวด้าน auth ของช่อง (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ถูกข้อมูลรับรองบล็อกไว้
    - ผลลัพธ์ isolated แบบเงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถูกมองว่าเป็นสิ่งที่ตั้งใจไม่ให้ส่งมอบ ดังนั้น runner จะระงับ queued fallback delivery ด้วย

    สำหรับงาน cron แบบ isolated เอเจนต์ยังคงส่งโดยตรงได้ผ่านเครื่องมือ `message`
    เมื่อมี chat route พร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทาง fallback ของ runner
    สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งเท่านั้น

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="ทำไม isolated cron run ถึงสลับโมเดลหรือ retry หนึ่งครั้ง">
    โดยปกติแล้วนี่คือเส้นทาง live model-switch ไม่ใช่การจัดตารางซ้ำซ้อน

    cron แบบ isolated สามารถบันทึก runtime model handoff และ retry ได้เมื่อการรันที่ active
    โยน `LiveSessionModelSwitchError` ขึ้นมา การ retry จะคง provider/model ที่ถูกสลับแล้วไว้
    และหากการสลับนั้นมี auth profile override ใหม่มาด้วย cron
    จะบันทึกสิ่งนั้นไว้ก่อน retry ด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - Gmail hook model override ชนะเป็นอันดับแรกเมื่อเข้าเงื่อนไข
    - จากนั้นคือ `model` ระดับงาน
    - จากนั้น model override ของ cron-session ที่เก็บไว้
    - จากนั้นคือการเลือกโมเดลแบบปกติของ agent/default

    ลูป retry มีขอบเขตจำกัด หลังจากการพยายามครั้งแรกบวกกับ switch retry อีก 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนซ้ำไม่รู้จบ

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI ของ cron](/cli/cron)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงใน workspace ของคุณ UI ของ Skills บน macOS ใช้งานไม่ได้บน Linux
    เรียกดู Skills ได้ที่ [https://clawhub.ai](https://clawhub.ai)

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` แบบเนทีฟจะเขียนลงในไดเรกทอรี `skills/`
    ของ workspace ที่ active อยู่ ติดตั้ง CLI แยกชื่อ `clawhub` เฉพาะเมื่อคุณต้องการ publish หรือ
    sync Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันข้ามเอเจนต์ ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่าเอเจนต์ใดมองเห็นได้บ้าง

  </Accordion>

  <Accordion title="OpenClaw รันงานตามกำหนดหรือทำงานต่อเนื่องในเบื้องหลังได้ไหม">
    ได้ ใช้ตัวจัดตารางเวลาของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดหรือเกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบแบบเป็นระยะของ “เซสชันหลัก”
    - **งานแบบ Isolated** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ของ Apple ที่มีเฉพาะบน macOS จาก Linux ได้ไหม">
    ไม่ได้โดยตรง Skills บน macOS ถูกควบคุมด้วย `metadata.openclaw.os` ร่วมกับไบนารีที่จำเป็น และ Skills จะปรากฏใน system prompt ก็ต่อเมื่อผ่านเกณฑ์บน **โฮสต์ Gateway** เท่านั้น บน Linux, Skills ที่เป็น `darwin`-only (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะ override การควบคุมนี้

    คุณมีรูปแบบที่รองรับอยู่สามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway บนเครื่องที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [remote mode](#พอร์ต-gateway-กำลังทำงานอยู่แล้วและ-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ macOS node (ไม่ใช้ SSH)**
    รัน Gateway บน Linux จับคู่ macOS node (แอป menubar) และตั้ง **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่มีเฉพาะบน macOS ผ่านเกณฑ์ได้ เมื่อไบนารีที่จำเป็นมีอยู่บน node เอเจนต์จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ในพรอมป์จะเพิ่มคำสั่งนั้นเข้า allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง)**
    คง Gateway ไว้บน Linux แต่ทำให้ CLI binary ที่ต้องใช้ resolve ไปยัง SSH wrapper ที่รันบน Mac จากนั้น override skill เพื่ออนุญาต Linux ให้มันยังคงผ่านเกณฑ์

    1. สร้าง SSH wrapper สำหรับไบนารีนั้น (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. นำ wrapper ไปไว้บน `PATH` ของโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override metadata ของ skill (ใน workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้ snapshot ของ Skills รีเฟรช

  </Accordion>

  <Accordion title="คุณมี integration กับ Notion หรือ HeyGen ไหม">
    ตอนนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion/HeyGen มี API)
    - **Browser automation:** ทำงานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทแยกตามลูกค้า (เวิร์กโฟลว์ของเอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อลูกค้าหนึ่งราย (บริบท + ค่ากำหนด + งานที่กำลังทำ)
    - ขอให้เอเจนต์ดึงหน้านั้นมาตอนเริ่มเซสชัน

    หากคุณต้องการ integration แบบเนทีฟ ให้เปิด feature request หรือสร้าง skill
    ที่เรียกใช้ API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะลงในไดเรกทอรี `skills/` ของ workspace ที่ active อยู่ สำหรับ Skills ที่ใช้ร่วมกันข้ามเอเจนต์ ให้วางไว้ที่ `~/.openclaw/skills/<name>/SKILL.md` หากต้องการให้มีเพียงบางเอเจนต์เท่านั้นที่เห็นการติดตั้งแบบใช้ร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางตัวคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการคำถามพบบ่อยเรื่อง Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [คอนฟิก Skills](/th/tools/skills-config) และ [ClawHub](/th/tools/clawhub)

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้ไว้อยู่แล้วกับ OpenClaw ได้อย่างไร">
    ใช้ browser profile แบบ `user` ที่มีมาในตัว ซึ่งจะเชื่อมผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อกำหนดเอง ให้สร้าง MCP profile แบบ explicit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์ของโฮสต์ภายในเครื่องหรือ browser node ที่เชื่อมต่ออยู่ก็ได้ หาก Gateway รันอยู่ที่อื่น ให้รัน node host บนเครื่องที่มีเบราว์เซอร์ หรือใช้ remote CDP แทน

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - action เป็นแบบอิง ref ไม่ใช่แบบอิง CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และตอนนี้รองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับดาวน์โหลด และ batch action ยังต้องใช้ managed browser หรือ raw CDP profile

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารเรื่อง sandboxing โดยเฉพาะไหม">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker รู้สึกว่าถูกจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มได้อย่างไร">
    อิมเมจค่าเริ่มต้นเน้นความปลอดภัยเป็นหลักและรันในฐานะผู้ใช้ `node` ดังนั้นจึง
    ไม่มี system package, Homebrew หรือเบราว์เซอร์ที่มาพร้อมในชุด สำหรับการตั้งค่าที่ครบขึ้น:

    - คงค่า `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชอยู่รอด
    - ใส่ system dependency ลงในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ของ Playwright ผ่าน CLI ที่มาพร้อม:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้ง `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่าพาธนั้นถูกเก็บถาวร

    เอกสาร: [Docker](/th/install/docker), [Browser](/th/tools/browser)

  </Accordion>

  <Accordion title="ฉันสามารถให้ DM เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน sandbox ด้วยเอเจนต์ตัวเดียวได้ไหม">
    ได้ — หากทราฟฟิกส่วนตัวของคุณเป็น **DM** และทราฟฟิกสาธารณะของคุณเป็น **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันของกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน sandbox backend ที่กำหนดไว้ ขณะที่เซสชัน DM หลักยังคงอยู่บนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกเอง จากนั้นจำกัดว่าเครื่องมือใดใช้ได้ในเซสชันที่อยู่ใน sandbox ผ่าน `tools.sandbox.tools`

    คู่มือตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    เอกสารอ้างอิงคีย์คอนฟิก: [การกำหนดค่า Gateway](/th/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้า sandbox ได้อย่างไร">
    ตั้ง `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind แบบ global + รายเอเจนต์จะ merge กัน; bind รายเอเจนต์จะถูกละเลยเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่อ่อนไหว และจำไว้ว่าการ bind จะทะลุกำแพงระบบไฟล์ของ sandbox โดยตรง

    OpenClaw จะตรวจสอบแหล่งที่มาของ bind เทียบกับทั้ง normalized path และ canonical path ที่ resolve ผ่านบรรพบุรุษที่ลึกที่สุดซึ่งมีอยู่จริง นั่นหมายความว่าการหลุดออกนอกขอบเขตผ่าน symlink-parent จะยังคง fail closed แม้ว่า path segment ตัวสุดท้ายจะยังไม่มีอยู่จริง และการตรวจสอบ allowed-root ก็ยังมีผลหลังการ resolve symlink แล้ว

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของเอเจนต์:

    - บันทึกประจำวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **silent pre-compaction memory flush** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อ workspace
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้าม) ดู [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่าง ๆ อยู่เรื่อย ๆ ฉันจะทำให้มันจำได้นานขึ้นได้อย่างไร">
    บอกบอตให้ **เขียนข้อเท็จจริงนั้นลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    ส่วนบริบทระยะสั้นควรไปอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังคงเป็นพื้นที่ที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้เก็บความทรงจำจะช่วยได้;
    มันจะรู้ว่าควรทำอย่างไร หากมันยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้ workspace เดียวกัน
    ในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีข้อจำกัดอะไรบ้าง">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบมัน ข้อจำกัดคือพื้นที่จัดเก็บของคุณ
    ไม่ใช่โมเดล อย่างไรก็ตาม **บริบทของเซสชัน** ยังถูกจำกัดด้วยหน้าต่าง context ของโมเดล
    ดังนั้นบทสนทนายาว ๆ อาจถูก compact หรือตัดทอนได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำอยู่ - มันจะดึงกลับมาเฉพาะส่วนที่เกี่ยวข้องเข้าสู่บริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context)

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้ OpenAI API key ไหม">
    ต้องใช้เฉพาะเมื่อคุณใช้ **embedding ของ OpenAI** เท่านั้น Codex OAuth ครอบคลุมแชต/คอมพลีชัน และ
    **ไม่** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การล็อกอินผ่าน Codex CLI)** จะไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย การใช้ OpenAI embeddings
    ยังคงต้องมี API key จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ระบุ provider ไว้อย่างชัดเจน OpenClaw จะเลือก provider อัตโนมัติเมื่อมัน
    สามารถ resolve API key ได้ (auth profile, `models.providers.*.apiKey` หรือ env vars)
    มันจะให้ความสำคัญกับ OpenAI ก่อน หาก resolve คีย์ OpenAI ได้ มิฉะนั้นเป็น Gemini หาก resolve คีย์ Gemini
    ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลให้ใช้ การค้นหาหน่วยความจำ
    จะยังคงปิดอยู่จนกว่าคุณจะกำหนดค่า หากคุณมีเส้นทางโมเดลภายในเครื่อง
    กำหนดค่าไว้และมีอยู่จริง OpenClaw
    จะให้ความสำคัญกับ `local` Ollama รองรับเมื่อคุณตั้ง
    `memorySearch.provider = "ollama"` อย่างชัดเจน

    หากคุณต้องการอยู่ในเครื่องล้วน ให้ตั้ง `memorySearch.provider = "local"` (และจะตั้ง
    `memorySearch.fallback = "none"` ด้วยก็ได้) หากคุณต้องการ Gemini embeddings ให้ตั้ง
    `memorySearch.provider = "gemini"` และให้ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding ของ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    - ดู [หน่วยความจำ](/th/concepts/memory) สำหรับรายละเอียดการตั้งค่า

  </Accordion>
</AccordionGroup>

## ไฟล์ต่าง ๆ อยู่ตรงไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่">
    ไม่ - **state ของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งไปให้มัน**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** sessions, ไฟล์หน่วยความจำ, config และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **ต้องออกไปภายนอกตามธรรมชาติ:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/อื่น ๆ) จะไปยัง
      API ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/อื่น ๆ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมร่องรอยได้:** การใช้โมเดลภายในเครื่องทำให้พรอมป์อยู่บนเครื่องของคุณ แต่ทราฟฟิกของช่อง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องนั้น

    ที่เกี่ยวข้อง: [workspace ของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw จัดเก็บข้อมูลไว้ที่ไหน">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | จุดประสงค์                                                           |
    | --------------------------------------------------------------- | -------------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบ legacy (คัดลอกไปยัง auth profile เมื่อใช้งานครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | auth profile (OAuth, API key และ `keyRef`/`tokenRef` แบบไม่บังคับ)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload ของ secret แบบ file-backed ที่เป็นตัวเลือกสำหรับ provider SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบ legacy (รายการ `api_key` แบบ static จะถูกล้างออก) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | state ของ provider (เช่น `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | state รายเอเจนต์ (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติและ state ของการสนทนา (ต่อเอเจนต์)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | metadata ของเซสชัน (ต่อเอเจนต์)                                     |

    พาธแบบ legacy สำหรับ single-agent: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, Skills ฯลฯ) แยกต่างหาก และกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน">
    ไฟล์เหล่านี้อยู่ใน **workspace ของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อเอเจนต์):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (หรือ fallback แบบ legacy คือ `memory.md` เมื่อไม่มี `MEMORY.md`),
      `memory/YYYY-MM-DD.md`, และ `HEARTBEAT.md` แบบไม่บังคับ
    - **State dir (`~/.openclaw`)**: config, state ของ channel/provider, auth profile, sessions, logs,
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    workspace ค่าเริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต “ลืม” หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้ workspace เดียวกัน
    ในทุกการเปิดใช้งาน (และจำไว้ว่า remote mode ใช้ workspace ของ **โฮสต์ gateway**
    ไม่ใช่ของแล็ปท็อปในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงทน ให้ขอให้บอต **เขียนมันลงใน
    AGENTS.md หรือ MEMORY.md** แทนที่จะพึ่งประวัติแชต

    ดู [workspace ของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์การสำรองข้อมูลที่แนะนำ">
    ให้นำ **workspace ของเอเจนต์** ของคุณไปไว้ใน repo git แบบ **private** และสำรองไว้ในที่ส่วนตัว
    (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน “จิตใจ” ของผู้ช่วยได้ในภายหลัง

    **อย่า** commit อะไรที่อยู่ภายใต้ `~/.openclaw` (ข้อมูลรับรอง, sessions, tokens หรือ payload ของ secret ที่เข้ารหัสแล้ว)
    หากคุณต้องการกู้คืนแบบเต็ม ให้สำรองทั้ง workspace และ state directory
    แยกกัน (ดูคำถามเรื่องการย้ายระบบด้านบน)

    เอกสาร: [workspace ของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ออกทั้งหมดได้อย่างไร">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอก workspace ได้ไหม">
    ได้ workspace คือ **cwd เริ่มต้น** และจุดยึดของหน่วยความจำ ไม่ใช่ sandbox แบบแข็ง
    พาธแบบสัมพัทธ์จะ resolve ภายใน workspace แต่พาธแบบสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่น
    บนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกขอบเขต ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox รายเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปยัง root ของ repo repo ของ OpenClaw เป็นเพียงซอร์สโค้ด; ควรแยก
    workspace ออก เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

    ตัวอย่าง (ใช้ repo เป็น cwd เริ่มต้น):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode: session store อยู่ที่ไหน">
    state ของเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ใน remote mode session store ที่คุณควรสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานของคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกเป็นฟอร์แมตอะไร อยู่ที่ไหน">
    OpenClaw จะอ่านคอนฟิก **JSON5** แบบไม่บังคับจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ ระบบจะใช้ค่าเริ่มต้นที่ปลอดภัยพอสมควร (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้ง `gateway.bind: "lan"` (หรือ `"tailnet"`) แล้วตอนนี้ไม่มีอะไรฟังอยู่ / UI ขึ้น unauthorized'>
    การ bind แบบ non-loopback **ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติแปลว่า:

    - shared-secret auth: token หรือรหัสผ่าน
    - `gateway.auth.mode: "trusted-proxy"` หลัง identity-aware reverse proxy แบบ non-loopback ที่กำหนดค่าอย่างถูกต้อง

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    หมายเหตุ:

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้ local gateway auth ด้วยตัวเอง
    - เส้นทางการเรียกภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้ง `gateway.auth.*`
    - สำหรับ password auth ให้ตั้ง `gateway.auth.mode: "password"` พร้อมกับ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดอย่างชัดเจนผ่าน SecretRef และยังไม่ resolve การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ใน settings ของแอป/UI) ส่วนโหมดที่มีการถือข้อมูลตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` จะใช้ request header แทน หลีกเลี่ยงการใส่ shared secret ลงใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback ที่อยู่บนโฮสต์เดียวกันก็ยัง **ไม่** เพียงพอสำหรับ trusted-proxy auth trusted proxy ต้องเป็นแหล่ง non-loopback ที่กำหนดค่าไว้

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องมี token แม้อยู่บน localhost">
    OpenClaw บังคับใช้ gateway auth เป็นค่าเริ่มต้น รวมถึงบน loopback ด้วย ในเส้นทางเริ่มต้นตามปกติ สิ่งนั้นหมายถึง token auth: หากไม่ได้กำหนดเส้นทาง auth แบบ explicit การเริ่มต้น gateway จะ resolve ไปเป็นโหมด token และสร้าง token ให้อัตโนมัติ โดยบันทึกไว้ที่ `gateway.auth.token` ดังนั้น **ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน**
    สิ่งนี้ป้องกันไม่ให้โปรเซสอื่นในเครื่องเรียกใช้ Gateway ได้ง่าย ๆ

    หากคุณต้องการเส้นทาง auth แบบอื่น คุณสามารถเลือก password mode อย่างชัดเจนได้ (หรือสำหรับ reverse proxy แบบ non-loopback ที่รับรู้ตัวตนได้ ใช้ `trusted-proxy`) หากคุณ **ต้องการ** เปิด loopback แบบไม่มี auth จริง ๆ ให้ตั้ง `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังแก้ไข config ไหม">
    Gateway เฝ้าดู config และรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): hot-apply การเปลี่ยนแปลงที่ปลอดภัย และรีสตาร์ตสำหรับการเปลี่ยนแปลงสำคัญ
    - รองรับ `hot`, `restart`, `off` เช่นกัน

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ใน CLI ได้อย่างไร">
    ตั้ง `cli.banner.taglineMode` ใน config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ banner/เวอร์ชันไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมค่าเริ่มต้น)
    - หากคุณไม่ต้องการ banner เลย ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้ web search (และ web fetch) ได้อย่างไร">
    `web_fetch` ใช้งานได้โดยไม่ต้องมี API key ส่วน `web_search` ขึ้นกับ provider
    ที่คุณเลือก:

    - provider ที่ใช้ API เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่า API key ตามปกติของแต่ละเจ้า
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้อง `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็น integration แบบ HTML ที่ไม่เป็นทางการ
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนด `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** รัน `openclaw configure --section web` แล้วเลือก provider
    ทางเลือกผ่าน environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` หรือ `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อ auto-detect
            },
          },
        },
    }
    ```

    คอนฟิก web-search แบบเฉพาะ provider ตอนนี้อยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    พาธ provider แบบ legacy ใน `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับ config ใหม่
    คอนฟิก fallback ของ Firecrawl web-fetch อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานเป็นค่าเริ่มต้น (เว้นแต่จะปิดอย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะ auto-detect provider สำหรับ fetch fallback ตัวแรกที่พร้อมจากข้อมูลรับรองที่มีอยู่ ปัจจุบัน provider ที่มาพร้อมในชุดคือ Firecrawl
    - daemon จะอ่าน env var จาก `~/.openclaw/.env` (หรือจาก environment ของ service)

    เอกสาร: [Web tools](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้าง config ของฉันหมด ฉันจะกู้คืนและป้องกันอย่างไร">
    `config.apply` จะแทนที่ **config ทั้งหมด** หากคุณส่ง object มาเพียงบางส่วน
    อย่างอื่นทั้งหมดจะถูกลบออก

    ปัจจุบัน OpenClaw ป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียน config ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config เต็มหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายล้างจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload พัง Gateway จะกู้คืน config แบบ last-known-good และบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`
    - เอเจนต์หลักจะได้รับ boot warning หลังการกู้คืน เพื่อไม่ให้เขียน config ที่ผิดซ้ำแบบไม่คิด

    การกู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหาข้อความ `Config auto-restored from last-known-good`, `Config write rejected:` หรือ `config reload restored last-known-good config`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ไฟล์ล่าสุดข้าง ๆ config ที่ใช้งานอยู่
    - เก็บ config ที่กู้คืนแล้วซึ่งกำลังใช้งานอยู่ไว้ หากมันใช้ได้ แล้วคัดลอกเฉพาะคีย์ที่ตั้งใจกลับมาด้วย `openclaw config set` หรือ `config.patch`
    - รัน `openclaw config validate` และ `openclaw doctor`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้จากแบ็กอัป หรือรัน `openclaw doctor` ใหม่แล้วกำหนดช่อง/โมเดลอีกครั้ง
    - หากสิ่งนี้เกิดขึ้นโดยไม่คาดคิด ให้ส่ง bug พร้อมแนบ config ล่าสุดที่ใช้งานได้หรือแบ็กอัปใด ๆ ที่มี
    - local coding agent มักช่วยกู้ config ที่ใช้งานได้จาก log หรือประวัติได้

    วิธีหลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับพาธหรือรูปแบบของฟิลด์ มันจะคืน shallow schema node พร้อมสรุปลูกโดยตรงสำหรับการเจาะลงไปทีละชั้น
    - ใช้ `config.patch` สำหรับการแก้ไข RPC แบบบางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่ config ทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` ที่เป็น owner-only จากการรันของเอเจนต์ มันจะยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias แบบ legacy ของ `tools.bash.*` ที่ normalize ไปยังพาธ exec ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [Config](/cli/config), [Configure](/cli/configure), [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบที่พบบ่อยคือ **หนึ่ง Gateway** (เช่น Raspberry Pi) บวกกับ **node** และ **agent**:

    - **Gateway (ศูนย์กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Nodes (อุปกรณ์):** Mac, iOS, Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agents (worker):** สมอง/workspace แยกสำหรับบทบาทเฉพาะ (เช่น "Hetzner ops", "ข้อมูลส่วนตัว")
    - **Sub-agents:** สปินงานเบื้องหลังจากเอเจนต์หลักเมื่อคุณต้องการงานขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ของ OpenClaw รันแบบ headless ได้ไหม">
    ได้ เป็นตัวเลือกใน config:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    ค่าเริ่มต้นคือ `false` (headful) แบบ headless มีโอกาสกระตุ้นการตรวจจับ anti-bot บางเว็บไซต์ได้มากกว่า ดู [Browser](/th/tools/browser)

    headless ใช้ **Chromium engine เดียวกัน** และใช้ได้กับ automation ส่วนใหญ่ (ฟอร์ม การคลิก การ scrape การล็อกอิน) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ให้เห็น (ใช้ screenshot หากคุณต้องการภาพ)
    - บางเว็บไซต์เข้มงวดกับ automation มากขึ้นในโหมด headless (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อกเซสชันแบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้ง `browser.executablePath` ให้ชี้ไปยังไบนารีของ Brave (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวอื่น) แล้วรีสตาร์ต Gateway
    ดูตัวอย่าง config แบบเต็มได้ที่ [Browser](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway ระยะไกลและ node

<AccordionGroup>
  <Accordion title="คำสั่งถูกส่งต่อกันอย่างไรระหว่าง Telegram, gateway และ node">
    ข้อความจาก Telegram ถูกจัดการโดย **gateway** gateway จะรันเอเจนต์และ
    จากนั้นจึงเรียก node ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้ node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node จะไม่เห็นทราฟฟิกขาเข้าจาก provider; มันรับเพียง node RPC call เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้น ๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (หน้าจอ กล้อง ระบบ) บนเครื่องในพื้นที่ของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/home server)
    2. ให้นำโฮสต์ Gateway + คอมพิวเตอร์ของคุณอยู่ใน tailnet เดียวกัน
    3. ตรวจสอบให้แน่ใจว่าเข้าถึง Gateway WS ได้ (ผ่าน tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่อง แล้วเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้มันลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; node เชื่อมต่อผ่าน Gateway WebSocket

    เตือนเรื่องความปลอดภัย: การจับคู่ macOS node อนุญาตให้ใช้ `system.run` บนเครื่องนั้นได้ ควร
    จับคู่เฉพาะอุปกรณ์ที่คุณเชื่อถือ และอ่าน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [macOS remote mode](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับคำตอบเลย ต้องทำอย่างไร">
    ตรวจสอบพื้นฐานก่อน:

    - Gateway กำลังทำงานอยู่: `openclaw gateway status`
    - สถานะสุขภาพของ Gateway: `openclaw status`
    - สถานะสุขภาพของช่อง: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ให้แน่ใจว่าตั้ง `gateway.auth.allowTailscale` ถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า local tunnel ทำงานอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlist ของคุณ (DM หรือกลุ่ม) มีบัญชีของคุณรวมอยู่ด้วย

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels)

  </Accordion>

  <Accordion title="OpenClaw สองอินสแตนซ์คุยกันเองได้ไหม (ในเครื่อง + VPS)">
    ได้ ไม่มี bridge “bot-to-bot” ในตัว แต่คุณสามารถต่อมันเข้าหากันได้ด้วยวิธีที่เชื่อถือได้ไม่กี่แบบ:

    **ง่ายที่สุด:** ใช้ช่องแชตปกติที่บอตทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วปล่อยให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายไปยังแชตที่อีกบอต
    กำลังฟังอยู่ หากบอตตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอตสองตัววนตอบกันไม่รู้จบ (กล่าวถึงเท่านั้น, channel
    allowlist หรือกฎ “อย่าตอบข้อความจากบอต”)

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [CLI ของ Agent](/cli/agent), [Agent send](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์ไหม">
    ไม่ หนึ่ง Gateway สามารถโฮสต์หลายเอเจนต์ได้ โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของโมเดล
    และ routing ของตัวเอง นี่คือรูปแบบปกติ และถูกกว่าและง่ายกว่าการรัน
    หนึ่ง VPS ต่อหนึ่งเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกขอบเขตแบบแข็งจริง ๆ (security boundary) หรือมีคอนฟิก
    ที่ต่างกันมากจนคุณไม่ต้องการแชร์ร่วมกัน มิฉะนั้นให้คงไว้ที่ Gateway เดียวและ
    ใช้หลายเอเจนต์หรือ sub-agent แทน

  </Accordion>

  <Accordion title="มีข้อดีไหมในการใช้ node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS">
    มี — node คือวิธีแบบ first-class ในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และมัน
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    มีน้ำหนักเบา (VPS ขนาดเล็กหรือเครื่องระดับ Pi ก็พอ; RAM 4 GB เหลือเฟือ) ดังนั้นรูปแบบที่พบบ่อย
    คือโฮสต์แบบเปิดตลอดเวลาหนึ่งตัว บวกกับแล็ปท็อปของคุณในฐานะ node

    - **ไม่ต้องเปิด SSH ขาเข้า** node จะเชื่อมต่อออกไปยัง Gateway WebSocket และใช้ device pairing
    - **การควบคุมการรันที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlist/approval ของ node บนแล็ปท็อปนั้น
    - **มีเครื่องมืออุปกรณ์มากกว่า** node เปิดเผย `canvas`, `camera` และ `screen` นอกเหนือจาก `system.run`
    - **Browser automation ในเครื่อง** ให้ Gateway อยู่บน VPS แต่รัน Chrome ในเครื่องผ่าน node host บนแล็ปท็อป หรือเชื่อมกับ Chrome ภายในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH ใช้ได้ดีสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ node ง่ายกว่าสำหรับเวิร์กโฟลว์ของเอเจนต์และ
    automation บนอุปกรณ์อย่างต่อเนื่อง

    เอกสาร: [Nodes](/th/nodes), [CLI ของ Nodes](/cli/nodes), [Browser](/th/tools/browser)

  </Accordion>

  <Accordion title="node รันบริการ gateway ด้วยไหม">
    ไม่ ควรมี **gateway เพียงตัวเดียว** ต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)) node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (node บน iOS/Android หรือ “node mode” บน macOS ในแอป menubar) สำหรับ node
    host แบบ headless และการควบคุมผ่าน CLI ดู [CLI ของ Node host](/cli/node)

    ต้องรีสตาร์ตเต็มสำหรับการเปลี่ยนแปลงของ `gateway`, `discovery` และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี apply config ผ่าน API / RPC ไหม">
    มี

    - `config.schema.lookup`: ตรวจดู config subtree หนึ่งส่วนพร้อม shallow schema node, UI hint ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot ปัจจุบัน + hash
    - `config.patch`: อัปเดตแบบบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อเป็นไปได้และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบ + แทนที่ config ทั้งหมด; hot-reload เมื่อเป็นไปได้และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือรันไทม์ `gateway` ที่เป็น owner-only ยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; alias แบบ legacy ของ `tools.bash.*` จะ normalize ไปยังพาธ exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="คอนฟิกขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    สิ่งนี้จะตั้ง workspace ของคุณและจำกัดว่าใครสามารถเรียกใช้บอตได้

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Tailscale บน VPS และเชื่อมต่อจาก Mac ได้อย่างไร">
    ขั้นตอนขั้นต่ำ:

    1. **ติดตั้ง + login บน VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ติดตั้ง + login บน Mac ของคุณ**
       - ใช้แอป Tailscale แล้วลงชื่อเข้าใช้ tailnet เดียวกัน
    3. **เปิดใช้ MagicDNS (แนะนำ)**
       - ในคอนโซลผู้ดูแลของ Tailscale ให้เปิด MagicDNS เพื่อให้ VPS มีชื่อที่เสถียร
    4. **ใช้ hostname ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    สิ่งนี้จะคง gateway ไว้ที่ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Mac node เข้ากับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร">
    Serve จะเปิดเผย **Gateway Control UI + WS** node เชื่อมต่อผ่านปลายทาง Gateway WS เดียวกันนี้

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ใน Remote mode** (เป้าหมาย SSH สามารถเป็น tailnet hostname ได้)
       แอปจะทำ tunnel พอร์ตของ Gateway และเชื่อมต่อเป็น node
    3. **อนุมัติ node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [macOS remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปอีกเครื่องหนึ่ง หรือแค่เพิ่ม node">
    หากคุณต้องการเพียง **เครื่องมือในเครื่อง** (screen/camera/exec) บนแล็ปท็อปอีกเครื่อง ให้เพิ่มมันเป็น
    **node** วิธีนี้ทำให้คง Gateway เดียวและหลีกเลี่ยง config ซ้ำซ้อน เครื่องมือของ local node
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ให้ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกขอบเขตแบบแข็ง** หรือบอตที่แยกจากกันโดยสมบูรณ์สองตัว

    เอกสาร: [Nodes](/th/nodes), [CLI ของ Nodes](/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env var และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร">
    OpenClaw อ่าน env var จาก parent process (shell, launchd/systemd, CI ฯลฯ) และยังโหลดเพิ่มเติมจาก:

    - `.env` จาก current working directory
    - `.env` แบบ global fallback จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองจะไม่เขียนทับ env var ที่มีอยู่แล้ว

    คุณยังสามารถกำหนด inline env var ใน config ได้ด้วย (จะใช้เฉพาะเมื่อไม่มีอยู่ใน process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    ดู [/environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

  </Accordion>

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env var หายไป ต้องทำอย่างไร">
    มีวิธีแก้ทั่วไปสองแบบ:

    1. ใส่คีย์ที่หายไว้ใน `~/.openclaw/.env` เพื่อให้ยังถูกอ่านแม้ service จะไม่ได้สืบทอด shell env ของคุณ
    2. เปิดใช้ shell import (ตัวช่วยแบบ opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    สิ่งนี้จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดหวังซึ่งยังขาดอยู่เท่านั้น (ไม่เขียนทับ) ค่าผ่าน env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้ง `COPILOT_GITHUB_TOKEN` แล้ว แต่ models status แสดงว่า "Shell env: off." ทำไม'>
    `openclaw models status` รายงานว่า **shell env import** ถูกเปิดอยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env var ของคุณหายไป - มันแค่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) มันจะไม่สืบทอด shell
    environment ของคุณ แก้ได้ด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

    1. ใส่ token ไว้ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้ shell import (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มมันลงในบล็อก `env` ของ config (จะใช้เฉพาะเมื่อยังไม่มี)

    จากนั้นรีสตาร์ต gateway แล้วตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot จะถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มบทสนทนาใหม่ได้อย่างไร">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตอัตโนมัติไหมถ้าฉันไม่เคยส่ง /new">
    เซสชันสามารถหมดอายุได้หลัง `session.idleMinutes` แต่สิ่งนี้ **ถูกปิดไว้โดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ให้ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้ idle expiry เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังจากช่วงเวลา idle จะเริ่ม session id ใหม่สำหรับ chat key นั้น
    สิ่งนี้ไม่ลบ transcript - มันเพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีทำทีม OpenClaw หลายตัวไหม (หนึ่ง CEO และหลาย agent)">
    มี ผ่าน **การกำหนดเส้นทางหลายเอเจนต์** และ **sub-agent** คุณสามารถสร้างเอเจนต์
    ผู้ประสานงานหนึ่งตัวและเอเจนต์ worker หลายตัวที่มี workspace และโมเดลของตัวเองได้

    อย่างไรก็ตาม สิ่งนี้ควรถูกมองว่าเป็น **การทดลองที่สนุก** มากกว่า มันใช้ token หนักและบ่อยครั้ง
    มีประสิทธิภาพน้อยกว่าการใช้บอตตัวเดียวกับหลายเซสชัน รูปแบบทั่วไปที่เรา
    มองเห็นคือบอตหนึ่งตัวที่คุณคุยด้วย โดยมีหลายเซสชันสำหรับงานขนาน บอตตัวนั้น
    ยังสามารถสปิน sub-agent เมื่อจำเป็นได้ด้วย

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [CLI ของ Agents](/cli/agents)

  </Accordion>

  <Accordion title="ทำไมบริบทถึงถูกตัดกลางงาน ฉันจะป้องกันอย่างไร">
    บริบทของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตที่ยาว เอาต์พุตของเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    สามารถกระตุ้นให้เกิด compaction หรือ truncation ได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บบริบทสำคัญไว้ใน workspace แล้วขอให้บอตอ่านมันกลับมา
    - ใช้ sub-agent สำหรับงานยาวหรืองานขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้น หากปัญหานี้เกิดบ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    รีเซ็ตเต็มแบบไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรันการตั้งค่าใหม่:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังมีตัวเลือก **Reset** หากมันเห็น config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profile (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ตแต่ละ state dir (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (dev-only; ล้าง dev config + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้ข้อผิดพลาด "context too large" - ฉันจะรีเซ็ตหรือ compact อย่างไร'>
    ใช้ตัวเลือกใดตัวเลือกหนึ่งต่อไปนี้:

    - **Compact** (เก็บบทสนทนาไว้ แต่สรุปเทิร์นเก่า ๆ):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับการสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นอยู่:

    - เปิดใช้หรือปรับ **session pruning** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตของ tool เก่า ๆ
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันถึงเห็น "LLM request rejected: messages.content.tool_use.input field required"'>
    นี่คือข้อผิดพลาด validation ของ provider: โมเดลปล่อยบล็อก `tool_use` ออกมาโดยไม่มี
    `input` ที่จำเป็น ปกติแล้วหมายความว่าประวัติเซสชันค้างเก่าหรือเสียหาย (มักเกิดหลัง thread ยาว ๆ
    หรือมีการเปลี่ยนแปลง tool/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (เป็นข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ heartbeat ทุก 30 นาที">
    Heartbeat รันทุก **30m** เป็นค่าเริ่มต้น (**1h** เมื่อใช้ OAuth auth) ปรับหรือปิดได้ดังนี้:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // หรือ "0m" เพื่อปิดใช้งาน
          },
        },
      },
    }
    ```

    หากมี `HEARTBEAT.md` อยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและ markdown
    heading เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัด API call
    หากไม่มีไฟล์ heartbeat จะยังคงรัน และให้โมเดลตัดสินใจว่าจะทำอะไร

    การ override รายเอเจนต์ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอต" เข้าไปในกลุ่ม WhatsApp หรือไม่'>
    ไม่ OpenClaw รันบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็เห็นกลุ่มนั้นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่สามารถเรียกการตอบกลับในกลุ่มได้:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ฉันจะดู JID ของกลุ่ม WhatsApp ได้อย่างไร">
    ตัวเลือกที่ 1 (เร็วที่สุด): ติดตาม log แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือกที่ 2 (หากกำหนดค่า/allowlist ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ถึงไม่ตอบในกลุ่ม">
    มีสาเหตุที่พบบ่อยสองอย่าง:

    - การควบคุมด้วยการกล่าวถึงเปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนด `channels.whatsapp.groups` ไว้โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/เธรดใช้บริทร่วมกับ DM ไหม">
    แชตโดยตรงจะถูกรวมเข้าเซสชันหลักเป็นค่าเริ่มต้น ส่วนกลุ่ม/ช่องจะมี session key ของตัวเอง และ Telegram topic / Discord thread ก็เป็นเซสชันแยกกัน ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสร้าง workspace และเอเจนต์ได้กี่อัน">
    ไม่มีขีดจำกัดตายตัว หลายสิบ (แม้แต่หลายร้อย) ก็ใช้ได้ แต่ให้ระวัง:

    - **ดิสก์โต:** sessions + transcript อยู่ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้ token:** เอเจนต์มากขึ้นหมายถึงการใช้โมเดลพร้อมกันมากขึ้น
    - **ภาระการดูแล:** auth profile, workspace และ channel routing รายเอเจนต์

    เคล็ดลับ:

    - ให้มี workspace ที่ **active** อยู่หนึ่งตัวต่อเอเจนต์ (`agents.defaults.workspace`)
    - ลบเซสชันเก่า (ลบ JSONL หรือรายการใน store) หากดิสก์โต
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspace ที่หลงเหลือและความไม่ตรงกันของ profile

  </Accordion>

  <Accordion title="ฉันสามารถรันหลายบอตหรือหลายแชตพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันเอเจนต์แยกกันหลายตัว และกำหนดเส้นทางข้อความขาเข้าตาม
    channel/account/peer Slack รองรับในฐานะ channel และสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์มีพลังมาก แต่ไม่ใช่ “ทำได้ทุกอย่างเหมือนมนุษย์” - anti-bot, CAPTCHA และ MFA
    ยังสามารถบล็อก automation ได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ภายในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าที่เป็น best practice:

    - โฮสต์ Gateway แบบเปิดตลอด (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (bindings)
    - ช่อง Slack ที่ผูกเข้ากับเอเจนต์เหล่านั้น
    - ใช้เบราว์เซอร์ภายในเครื่องผ่าน Chrome MCP หรือ node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [Browser](/th/tools/browser), [Nodes](/th/nodes)

  </Accordion>
</AccordionGroup>

## โมเดล: ค่าเริ่มต้น การเลือก aliases การสลับ

<AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร'>
    โมเดลเริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลจะอ้างอิงเป็น `provider/model` (ตัวอย่าง: `openai/gpt-5.4`) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจะลอง unique configured-provider match สำหรับ model id ตรงตัวนั้น และจึงค่อย fallback ไปยัง configured default provider ในฐานะเส้นทางความเข้ากันได้แบบ deprecated เท่านั้น หาก provider นั้นไม่เปิดให้ใช้ configured default model อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้แทน แทนที่จะโผล่ค่าเริ่มต้นเก่าจาก provider ที่ถูกลบไปแล้ว คุณยังควร **ตั้ง `provider/model` อย่างชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลอะไร">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่มีในชุด provider ของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ให้ความสำคัญกับความแข็งแกร่งของโมเดลมากกว่าต้นทุน
    **สำหรับแชตทั่วไป/งานความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    กฎคร่าว ๆ: ใช้ **โมเดลที่ดีที่สุดเท่าที่คุณจ่ายไหว** สำหรับงานสำคัญ และใช้โมเดล
    ที่ถูกกว่าสำหรับแชตทั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลรายเอเจนต์และใช้ sub-agent เพื่อ
    ทำงานยาว ๆ แบบขนานได้ (แต่ละ sub-agent ใช้ token) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนแรง: โมเดลที่อ่อนกว่า/quantize มากเกินไปมีความเปราะบางต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ทั้งหมดได้อย่างไร">
    ใช้ **คำสั่งโมเดล** หรือแก้เฉพาะฟิลด์ **model** เท่านั้น หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ทางเลือกที่ปลอดภัย:

    - `/model` ในแชต (เร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` พร้อม object บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจด้วย `config.schema.lookup` ก่อนและควรใช้ `config.patch` payload จาก lookup จะให้ normalized path, เอกสาร/ข้อจำกัดของ shallow schema และสรุปลูกโดยตรง
    สำหรับการอัปเดตแบบบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้จากแบ็กอัปหรือรัน `openclaw doctor` ใหม่เพื่อซ่อม

    เอกสาร: [โมเดล](/th/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดล self-hosted (llama.cpp, vLLM, Ollama) ได้ไหม">
    ได้ Ollama คือเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` จะให้ทั้งโมเดลคลาวด์และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่จำเป็นต้อง pull ภายในเครื่อง
    - สำหรับการสลับด้วยมือ ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กหรือถูก quantize อย่างหนักมีความเปราะบางต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใดก็ตามที่ใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลเล็ก ให้เปิด sandboxing และใช้ tool allowlist แบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร">
    - deployment เหล่านี้อาจต่างกันและอาจเปลี่ยนไปตามเวลา; ไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจสอบค่ารันไทม์ปัจจุบันบนแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่มี

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลแบบ on the fly (โดยไม่ต้องรีสตาร์ต) ได้อย่างไร">
    ใช้คำสั่ง `/model` เป็นข้อความเดี่ยว:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    เหล่านี้คือ alias ที่มีมาในตัว ส่วน alias แบบกำหนดเองสามารถเพิ่มได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่พร้อมใช้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบย่อที่มีหมายเลขกำกับ เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับ auth profile เฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` จะแสดงว่าเอเจนต์ใด active อยู่, ใช้ไฟล์ `auth-profiles.json` ใด และ auth profile ใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง provider endpoint (`baseUrl`) และโหมด API (`api`) ที่กำหนดค่าไว้เมื่อมี

    **ฉันจะ unpin profile ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` ใหม่ **โดยไม่ใส่** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกมันจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่า auth profile ใด active อยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.2 สำหรับงานประจำวัน และ Codex 5.3 สำหรับเขียนโค้ดได้ไหม">
    ได้ ตั้งตัวหนึ่งเป็นค่าเริ่มต้นแล้วสลับตามต้องการ:

    - **สลับเร็ว (ต่อเซสชัน):** `/model gpt-5.4` สำหรับงานประจำวัน, `/model openai-codex/gpt-5.4` สำหรับเขียนโค้ดด้วย Codex OAuth
    - **ค่าเริ่มต้น + การสลับ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.4` จากนั้นสลับไป `openai-codex/gpt-5.4` เมื่อต้องเขียนโค้ด (หรือกลับกัน)
    - **Sub-agents:** กำหนดเส้นทางงานเขียนโค้ดไปยัง sub-agent ที่มีโมเดลเริ่มต้นต่างกัน

    ดู [โมเดล](/th/concepts/models) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่า fast mode สำหรับ GPT 5.4 ได้อย่างไร">
    ใช้ได้ทั้งตัวสลับต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะเซสชันกำลังใช้ `openai/gpt-5.4` หรือ `openai-codex/gpt-5.4`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.4"].params.fastMode` เป็น `true`
    - **ใช้กับ Codex OAuth ด้วย:** หากคุณใช้ `openai-codex/gpt-5.4` ด้วย ให้ตั้งแฟลกเดียวกันไว้ตรงนั้นเช่นกัน

    ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    สำหรับ OpenAI fast mode จะถูกแมปเป็น `service_tier = "priority"` บนคำขอ native Responses ที่รองรับ การ override ด้วย `/fast` ระดับเซสชันมีความสำคัญสูงกว่าค่าเริ่มต้นใน config

    ดู [Thinking และ fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#openai-fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันถึงเห็น "Model ... is not allowed" แล้วก็ไม่มีคำตอบ'>
    หากมีการตั้ง `agents.defaults.models` ไว้ มันจะกลายเป็น **allowlist** สำหรับ `/model` และ
    session override ใด ๆ การเลือกโมเดลที่ไม่ได้อยู่ในรายการนั้นจะได้ผลลัพธ์ว่า:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ข้อผิดพลาดนี้จะถูกส่งกลับ **แทน** คำตอบปกติ วิธีแก้คือ: เพิ่มโมเดลนั้นลงใน
    `agents.defaults.models`, ลบ allowlist หรือเลือกโมเดลจาก `/model list`

  </Accordion>

  <Accordion title='ทำไมฉันถึงเห็น "Unknown model: minimax/MiniMax-M2.7"'>
    นี่หมายความว่า **provider ยังไม่ได้กำหนดค่า** (ไม่พบ config หรือ auth
    profile ของ MiniMax) ดังนั้นจึงไม่สามารถ resolve โมเดลได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ต gateway
    2. ตรวจสอบให้แน่ใจว่าได้กำหนดค่า MiniMax ไว้แล้ว (ผ่านวิซาร์ดหรือ JSON) หรือมี MiniMax auth
       อยู่ใน env/auth profile เพื่อให้สามารถ inject provider ที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id แบบตรงตัว (case-sensitive) ให้ตรงกับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าแบบ API key
       หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าแบบ OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือใช้ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้น และใช้ OpenAI สำหรับงานซับซ้อนได้ไหม">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** แล้วสลับโมเดล **ต่อเซสชัน** เมื่อจำเป็น
    Fallback มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

    **ตัวเลือก A: สลับต่อเซสชัน**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    จากนั้น:

    ```
    /model gpt
    ```

    **ตัวเลือก B: เอเจนต์แยกกัน**

    - ค่าเริ่มต้นของ Agent A: MiniMax
    - ค่าเริ่มต้นของ Agent B: OpenAI
    - กำหนดเส้นทางตามเอเจนต์ หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็นช็อตคัตที่มีมาในตัวไหม">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางตัว (จะใช้ก็ต่อเมื่อโมเดลนั้นมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองโดยใช้ชื่อเดียวกัน ค่าของคุณจะมีความสำคัญกว่า

  </Accordion>

  <Accordion title="ฉันจะกำหนด/override ช็อตคัตของโมเดล (alias) ได้อย่างไร">
    alias มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve ไปยัง model ID นั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจาก provider อื่นอย่าง OpenRouter หรือ Z.AI ได้อย่างไร">
    OpenRouter (จ่ายตาม token; มีหลายโมเดล):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (โมเดล GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    หากคุณอ้างอิง provider/model แต่ไม่มีคีย์ของ provider ที่จำเป็น คุณจะได้ runtime auth error (เช่น `No API key found for provider "zai"`)

    **ไม่พบ API key ของ provider หลังจากเพิ่มเอเจนต์ใหม่**

    โดยทั่วไปนี่หมายความว่า **เอเจนต์ใหม่** มี auth store ว่างเปล่า auth เป็นรายเอเจนต์และ
    เก็บไว้ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    วิธีแก้:

    - รัน `openclaw agents add <id>` แล้วกำหนดค่า auth ระหว่างวิซาร์ด
    - หรือคัดลอก `auth-profiles.json` จาก `agentDir` ของเอเจนต์หลักไปยัง `agentDir` ของเอเจนต์ใหม่

    อย่าใช้ `agentDir` ร่วมกันระหว่างเอเจนต์; มันจะทำให้เกิดการชนกันของ auth/session

  </Accordion>
</AccordionGroup>

## Model failover และ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร">
    Failover เกิดขึ้นสองขั้น:

    1. **การหมุนเวียน auth profile** ภายใน provider เดียวกัน
    2. **Model fallback** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    มี cooldown กับ profile ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบกลับได้ต่อไปแม้ provider จะถูก rate-limit หรือล้มเหลวชั่วคราว

    bucket ของ rate-limit ครอบคลุมมากกว่าการตอบกลับ `429` แบบธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และ periodic
    usage-window limit (`weekly/monthly limit reached`) เป็น rate limit ที่ควร failover ด้วย

    การตอบกลับบางแบบที่ดูเหมือนเรื่อง billing ไม่ได้เป็น `402` และการตอบกลับ `402`
    บางแบบก็ยังอยู่ใน bucket แบบชั่วคราวนั้น หาก provider ส่ง
    ข้อความ billing ที่ชัดเจนบน `401` หรือ `403` OpenClaw ก็ยังสามารถเก็บไว้ใน
    กลุ่ม billing ได้ แต่ text matcher แบบเฉพาะ provider จะยังจำกัดขอบเขตอยู่กับ
    provider ที่เป็นเจ้าของมัน (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือนเป็น usage-window ที่ retry ได้ หรือ
    spend limit ของ organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะมองเป็น
    `rate_limit` ไม่ใช่ billing disable ระยะยาว

    ข้อผิดพลาด context-overflow เป็นคนละเรื่องกัน: รูปแบบอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่ในเส้นทาง compaction/retry แทนการขยับ model
    fallback

    ข้อความ server-error ทั่วไปถูกกำหนดให้แคบกว่าความหมายแบบ “อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น” โดยตั้งใจ OpenClaw จะถือว่าเฉพาะรูปแบบชั่วคราวที่ขึ้นกับ provider
    เช่น Anthropic แบบ bare `An unknown error occurred`, OpenRouter แบบ bare
    `Provider returned error`, ข้อผิดพลาด stop-reason อย่าง `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความ server ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดแบบ provider-busy เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควร failover เมื่อบริบทของ provider
    ตรงกัน
    ข้อความ fallback ภายในแบบทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงตีความอย่างระมัดระวังและไม่ trigger model fallback ด้วยตัวมันเอง

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" หมายความว่าอะไร'>
    มันหมายความว่าระบบพยายามใช้ auth profile ID `anthropic:default` แต่ไม่พบข้อมูลรับรองสำหรับมันใน auth store ที่คาดหวังไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันตำแหน่งที่ auth profile อยู่** (พาธใหม่เทียบกับ legacy)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า Gateway โหลด env var ของคุณแล้ว**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd มันอาจไม่สืบทอดค่า ให้ใส่มันไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจให้แน่ใจว่าคุณกำลังแก้เอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมี `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/auth แบบ sanity check**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และว่า provider ได้รับการยืนยันตัวตนหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    นี่หมายความว่าการรันถูก pin ไว้กับ Anthropic auth profile แต่ Gateway
    หาไม่เจอใน auth store ของมัน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ลงใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ pin อยู่ซึ่งบังคับให้ใช้ profile ที่ไม่มีอยู่:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ใน remote mode, auth profile อยู่บนเครื่อง gateway ไม่ใช่บนแล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมมันถึงลอง Google Gemini แล้วล้มเหลวด้วย">
    หากคอนฟิกโมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณสลับไปใช้ shorthand ของ Gemini) OpenClaw จะลองมันระหว่าง model fallback หากคุณยังไม่ได้กำหนดค่า credential ของ Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: จัดเตรียม Google auth หรือเอาโมเดล Google ออกจาก/หลีกเลี่ยงใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback ไปเส้นทางนั้น

    **LLM request rejected: thinking signature required (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking block ที่ไม่มี signature** อยู่ (มักเกิดจาก
    stream ที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องการ signature สำหรับ thinking block

    วิธีแก้: ตอนนี้ OpenClaw จะตัด thinking block ที่ไม่มี signature ออกสำหรับ Google Antigravity Claude หากยังเห็นอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้ง `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## Auth profile: มันคืออะไร และจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="auth profile คืออะไร">
    auth profile คือระเบียนข้อมูลรับรองแบบมีชื่อ (OAuth หรือ API key) ที่ผูกกับ provider profile จะอยู่ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="profile ID แบบที่พบบ่อยมีอะไรบ้าง">
    OpenClaw ใช้ ID ที่มี prefix ของ provider เช่น:

    - `anthropic:default` (พบบ่อยเมื่อยังไม่มีอีเมลตัวตน)
    - `anthropic:<email>` สำหรับ OAuth identity
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่า auth profile ตัวไหนจะถูกลองก่อน">
    ได้ config รองรับ metadata แบบไม่บังคับสำหรับ profile และการจัดลำดับต่อ provider (`auth.order.<provider>`) สิ่งนี้ **ไม่** เก็บ secret; มันเพียงแมป ID กับ provider/mode และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้าม profile ชั่วคราวหากมันอยู่ใน **cooldown** ระยะสั้น (rate limit/timeout/auth failure) หรือสถานะ **disabled** ระยะยาวกว่า (billing/เครดิตไม่พอ) หากต้องการตรวจสอบสิ่งนี้ ให้รัน `openclaw models status --json` แล้วดู `auth.unusableProfiles` การปรับแต่งใช้ `auth.cooldowns.billingBackoffHours*`

    cooldown ของ rate-limit สามารถมีขอบเขตระดับโมเดลได้ profile ที่กำลัง cooldown
    สำหรับโมเดลหนึ่งอาจยังใช้ได้กับโมเดลพี่น้องบน provider เดียวกัน
    ขณะที่หน้าต่าง billing/disabled ยังคงบล็อกทั้ง profile

    คุณยังสามารถตั้ง **override ลำดับต่อเอเจนต์** (เก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI ได้:

    ```bash
    # ใช้เอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้เป็นค่าเริ่มต้น (ละ --agent ได้)
    openclaw models auth order get --provider anthropic

    # ล็อกการหมุนเวียนให้เหลือ profile เดียว (ลองเฉพาะตัวนี้)
    openclaw models auth order set --provider anthropic anthropic:default

    # หรือตั้งลำดับแบบ explicit (fallback ภายใน provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # ล้าง override (fallback ไปใช้ config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    หากต้องการเจาะจงเอเจนต์ตัวใดตัวหนึ่ง:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าจะลองอะไรจริง ๆ ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากมี stored profile ตัวใดถูกละออกจาก explicit order, probe จะรายงาน
    `excluded_by_auth_order` สำหรับ profile นั้น แทนที่จะลองมันแบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับ API key ต่างกันอย่างไร">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงผ่าน subscription (เมื่อมี)
    - **API key** ใช้การเรียกเก็บเงินแบบจ่ายตาม token

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API key อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## Gateway: พอร์ต, “กำลังรันอยู่แล้ว” และ remote mode

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตอะไร">
    `gateway.port` ควบคุมพอร์ตแบบ multiplexed พอร์ตเดียวสำหรับทั้ง WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status ถึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือการที่ CLI พยายามเชื่อมต่อไปยัง gateway WebSocket จริง ๆ

    ใช้ `openclaw gateway status` แล้วเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่บนพอร์ตจริง ๆ)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อโปรเซสยังมีชีวิตอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status ถึงแสดง "Config (cli)" และ "Config (service)" ไม่ตรงกัน'>
    คุณกำลังแก้ไฟล์ config หนึ่งไฟล์ ในขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็นปัญหา `--profile` / `OPENCLAW_STATE_DIR` ไม่ตรงกัน)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    ให้รันคำสั่งนี้จาก `--profile` / environment เดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='“another gateway instance is already listening” หมายความว่าอะไร'>
    OpenClaw บังคับใช้ runtime lock โดย bind ตัวรับฟัง WebSocket ทันทีตอนเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการ bind ล้มเหลวด้วย `EADDRINUSE` มันจะโยน `GatewayLockError` ออกมาเพื่อระบุว่ามีอีกอินสแตนซ์หนึ่งกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอีกอินสแตนซ์หนึ่ง, ปล่อยพอร์ต หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ใน remote mode ได้อย่างไร (ไคลเอนต์เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น)">
    ตั้ง `gateway.mode: "remote"` และชี้ไปยัง URL ของ WebSocket ระยะไกล พร้อม shared-secret remote credential แบบไม่บังคับ:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    หมายเหตุ:

    - `openclaw gateway` จะเริ่มทำงานเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่งแฟลก override)
    - แอป macOS เฝ้าดูไฟล์ config และสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรองระยะไกลฝั่งไคลเอนต์เท่านั้น; มันไม่ได้เปิด local gateway auth ด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI ขึ้น "unauthorized" (หรือ reconnect ไม่หยุด) ต้องทำอย่างไร'>
    เส้นทาง auth ของ gateway กับวิธี auth ของ UI ของคุณไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บ token ไว้ใน `sessionStorage` สำหรับ session ของแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดียวกันจึงยังใช้งานได้โดยไม่ต้องกลับไปใช้ localStorage token แบบเก็บยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH`, trusted client สามารถลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย cached device token ได้ เมื่อ gateway ส่ง hint สำหรับ retry กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - ตอนนี้ cached-token retry จะใช้ cached approved scopes ที่เก็บไว้กับ device token นั้นซ้ำ ผู้เรียกที่ระบุ `deviceToken` / ระบุ `scopes` เองอย่างชัดเจนจะยังคงชุด scope ที่ร้องขอไว้เอง แทนที่จะสืบทอด cached scope
    - นอกเส้นทาง retry นี้ ลำดับความสำคัญของ connect auth คือ shared token/password แบบ explicit ก่อน จากนั้น explicit `deviceToken`, จากนั้น stored device token แล้วจึง bootstrap token
    - การตรวจสอบ bootstrap token scope ใช้คำนำหน้าตาม role built-in bootstrap operator allowlist จะตอบสนองได้เฉพาะคำขอของ operator; node หรือ role อื่นที่ไม่ใช่ operator ยังต้องมี scope ภายใต้คำนำหน้าของ role นั้นเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก dashboard URL และพยายามเปิดให้; จะแสดง SSH hint หากเป็น headless)
    - หากคุณยังไม่มี token: `openclaw doctor --generate-gateway-token`
    - หากเป็น remote ให้ทำ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้ง `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แล้ววาง secret ที่ตรงกันใน settings ของ Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิด `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด URL ของ Serve ไม่ใช่ URL loopback/tailnet ดิบที่ข้าม Tailscale identity header
    - โหมด trusted-proxy: ตรวจสอบให้แน่ใจว่าคุณกำลังเข้าผ่าน identity-aware proxy แบบ non-loopback ที่กำหนดค่าไว้ ไม่ใช่พร็อกซี loopback บนโฮสต์เดียวกันหรือ URL ของ gateway โดยตรง
    - หาก mismatch ยังคงอยู่หลังจาก retry หนึ่งครั้ง ให้หมุน/อนุมัติ paired device token ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate บอกว่าถูกปฏิเสธ ให้ตรวจสองอย่าง:
      - session ของ paired-device สามารถ rotate ได้เฉพาะ **อุปกรณ์ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุอย่างชัดเจนต้องไม่เกิน operator scope ปัจจุบันของผู้เรียก
    - หากยังติดอยู่ ให้รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [Dashboard](/web/dashboard) สำหรับรายละเอียดด้าน auth

  </Accordion>

  <Accordion title="ฉันตั้ง gateway.bind เป็น tailnet แต่ bind ไม่ได้และไม่มีอะไรฟังอยู่">
    การ bind แบบ `tailnet` จะเลือก Tailscale IP จาก network interface ของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรือ interface ล่ม) ก็จะไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - สลับไปใช้ `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นแบบ explicit ส่วน `auto` จะให้ความสำคัญกับ loopback; ให้ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind แบบ tailnet-only

  </Accordion>

  <Accordion title="ฉันสามารถรันหลาย Gateway บนโฮสต์เดียวกันได้ไหม">
    โดยปกติไม่ได้ - หนึ่ง Gateway สามารถรันหลายช่องทางการส่งข้อความและหลายเอเจนต์ได้ ใช้หลาย Gateway เฉพาะเมื่อคุณต้องการ redundancy (เช่น rescue bot) หรือการแยกขอบเขตแบบแข็ง

    ได้ แต่คุณต้องแยกสิ่งต่อไปนี้:

    - `OPENCLAW_CONFIG_PATH` (config ต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (state ต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าแบบเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (จะสร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้ง `gateway.port` ที่ไม่ซ้ำกันใน config ของแต่ละ profile (หรือส่ง `--port` สำหรับการรันแบบแมนนวล)
    - ติดตั้ง service ต่อ profile: `openclaw --profile <name> gateway install`

    profile ยังใส่ suffix ให้ชื่อ service ด้วย (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 หมายความว่าอะไร'>
    Gateway เป็น **WebSocket server** และมันคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากมันได้รับอย่างอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (policy violation)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL แบบ **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ WS client
    - คุณใช้พอร์ตหรือ path ไม่ถูกต้อง
    - พร็อกซีหรือ tunnel ตัด auth header ทิ้ง หรือส่งคำขอที่ไม่ใช่ของ Gateway

    วิธีแก้แบบเร็ว:

    1. ใช้ WS URL: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิด auth อยู่ ให้ส่ง token/password ไปในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

  </Accordion>
</AccordionGroup>

## Logging และการดีบัก

<AccordionGroup>
  <Accordion title="log อยู่ที่ไหน">
    file log (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งพาธคงที่ได้ผ่าน `logging.file` ระดับของ file log ควบคุมด้วย `logging.level` ความละเอียดของ console ควบคุมด้วย `--verbose` และ `logging.consoleLevel`

    การดู log แบบเร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    log ของ service/supervisor (เมื่อ gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; profile จะใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลเพิ่มเติม

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร">
    ใช้ตัวช่วยของ gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway แบบแมนนวล `openclaw gateway --force` สามารถ reclaim พอร์ตได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - ฉันจะรีสตาร์ต OpenClaw ได้อย่างไร">
    มี **สองโหมดการติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ภายใน Linux

    เปิด PowerShell เข้า WSL แล้วรีสตาร์ต:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณยังไม่เคยติดตั้ง service ให้เริ่มในโหมด foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (ไม่แนะนำ):** Gateway รันตรงบน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันแบบแมนนวล (ไม่มี service) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [runbook ของบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานอยู่แต่คำตอบไม่เคยมาถึง ฉันควรตรวจอะไรบ้าง">
    เริ่มด้วยการกวาด health แบบเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - model auth ไม่ได้ถูกโหลดบน **โฮสต์ gateway** (ตรวจ `models status`)
    - pairing/allowlist ของช่องบล็อกการตอบกลับ (ตรวจ channel config + logs)
    - WebChat/Dashboard เปิดอยู่โดยไม่มี token ที่ถูกต้อง

    หากคุณอยู่แบบ remote ให้ยืนยันว่า tunnel/Tailscale ทำงานอยู่ และ
    เข้าถึง Gateway WebSocket ได้

    เอกสาร: [Channels](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร'>
    โดยทั่วไปนี่หมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ให้ตรวจ:

    1. Gateway กำลังทำงานอยู่หรือไม่ `openclaw gateway status`
    2. Gateway ปกติดีหรือไม่ `openclaw status`
    3. UI มี token ที่ถูกต้องหรือไม่ `openclaw dashboard`
    4. หากเป็น remote, ลิงก์ tunnel/Tailscale ยังอยู่หรือไม่

    จากนั้นติดตาม log:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ฉันควรตรวจอะไรบ้าง">
    เริ่มจาก log และสถานะของช่อง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่กับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้ถึงขีดจำกัดของ Telegram แล้วและ retry ด้วยคำสั่งที่น้อยลง แต่ก็ยังต้องตัดรายการบางอย่างออกอีก ลดจำนวนคำสั่งจาก Plugin/Skills/คำสั่งแบบกำหนดเอง หรือปิด `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายลักษณะใกล้เคียงกัน: หากคุณอยู่บน VPS หรืออยู่หลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ให้ตรวจสอบว่าคุณกำลังดู log บนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ฉันควรตรวจอะไรบ้าง">
    ก่อนอื่นให้ยืนยันว่าเข้าถึง Gateway ได้และเอเจนต์รันได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดหวังคำตอบในแชต
    ให้ตรวจว่ามีการเปิดใช้การส่งมอบแล้ว (`/deliver on`)

    เอกสาร: [TUI](/web/tui), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร">
    หากคุณติดตั้ง service ไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    สิ่งนี้จะหยุด/เริ่ม **supervised service** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway รันอยู่ในเบื้องหลังในฐานะ daemon

    หากคุณรันใน foreground ให้หยุดด้วย Ctrl-C จากนั้นใช้:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [runbook ของบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="อธิบายแบบง่ายมาก: openclaw gateway restart กับ openclaw gateway ต่างกันอย่างไร">
    - `openclaw gateway restart`: รีสตาร์ต **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้ง service แล้ว ให้ใช้คำสั่งกลุ่ม gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรัน foreground แบบครั้งเดียว

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อให้ได้รายละเอียดใน console มากขึ้น จากนั้นตรวจสอบไฟล์ log เพื่อดู channel auth, model routing และข้อผิดพลาดของ RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่คนละบรรทัดของตัวเอง) ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติมด้วยว่า:

    - ช่องเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกด้วย allowlist
    - ไฟล์มีขนาดอยู่ในขีดจำกัดของ provider (ภาพจะถูกปรับขนาดให้ไม่เกิน 2048px)
    - `tools.fs.workspaceOnly=true` จะจำกัดการส่งพาธภายในเครื่องไว้ที่ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบจาก sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ภายในเครื่องของโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและเอกสารที่ปลอดภัย (ภาพ เสียง วิดีโอ PDF และเอกสาร Office) เท่านั้น ไฟล์ข้อความล้วนและไฟล์ที่ดูเป็นความลับจะยังถูกบล็อก

    ดู [Images](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยไหม">
    ให้ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องที่รองรับ DM คือ **pairing**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code; บอตจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่อง**; ตรวจด้วย `openclaw pairing list --channel <channel> [--account <id>]` หากโค้ดไม่มาถึง
    - การเปิด DM สาธารณะต้อง opt-in อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่เสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นปัญหาเฉพาะบอตสาธารณะหรือไม่">
    ไม่ prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครส่ง DM หาบอตได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (web search/fetch, หน้าเบราว์เซอร์, อีเมล,
    เอกสาร, ไฟล์แนบ, log ที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุมโมเดลได้ เรื่องนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งคนเดียว** ก็ตาม

    ความเสี่ยงใหญ่ที่สุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    exfiltrate บริบทหรือเรียกใช้เครื่องมือแทนคุณ ลด blast radius โดย:

    - ใช้เอเจนต์แบบอ่านอย่างเดียวหรือปิดเครื่องมือ “reader” เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ปฏิบัติกับข้อความจากไฟล์/เอกสารที่ถอดรหัสแล้วว่าไม่น่าเชื่อถือด้วย: OpenResponses
      `input_file` และการดึงข้อความจากไฟล์แนบสื่อจะห่อข้อความที่ดึงมาได้ด้วย
      marker ขอบเขตของเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความดิบของไฟล์เข้าไปตรง ๆ
    - ใช้ sandboxing และ tool allowlist แบบเข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองไหม">
    ควรมี สำหรับการตั้งค่าส่วนใหญ่ การแยกบอตด้วยบัญชีและหมายเลขโทรศัพท์แยกต่างหาก
    จะช่วยลด blast radius หากเกิดปัญหา นอกจากนี้ยังทำให้หมุนเวียน
    ข้อมูลรับรองหรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากน้อยก่อน ให้สิทธิ์เฉพาะกับเครื่องมือและบัญชีที่คุณต้องใช้จริง ๆ และค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [Pairing](/th/channels/pairing)

  </Accordion>

  <Accordion title="ฉันให้มันจัดการข้อความส่วนตัวของฉันแบบอัตโนมัติได้ไหม และปลอดภัยหรือไม่">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - คง DM ไว้ใน **pairing mode** หรือ allowlist ที่แคบมาก
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่าง แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกมันไว้ ดู
    [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม">
    ได้ **ถ้า** เอเจนต์นั้นใช้แค่แชตและอินพุตเชื่อถือได้ tier ที่เล็กกว่ามีแนวโน้ม
    จะถูก hijack ด้วยคำสั่งได้ง่ายกว่า ดังนั้นให้หลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านเนื้อหาที่ไม่น่าเชื่อถือ หากคุณจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แล้วแต่ไม่ได้ pairing code">
    pairing code จะถูกส่ง **เฉพาะเมื่อ** ผู้ส่งที่ไม่รู้จักส่งข้อความหาบอต และ
    เปิด `dmPolicy: "pairing"` อยู่ การส่ง `/start` อย่างเดียวจะไม่สร้างโค้ด

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณลง allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? การ pairing ทำงานอย่างไร">
    ไม่ นโยบาย DM ค่าเริ่มต้นของ WhatsApp คือ **pairing** ผู้ส่งที่ไม่รู้จักจะได้รับเพียง pairing code และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะแชตที่มันได้รับมา หรือการส่งแบบ explicit ที่คุณ trigger เท่านั้น

    อนุมัติ pairing ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    ช่องกรอกหมายเลขโทรศัพท์ในวิซาร์ด: ใช้เพื่อตั้ง **allowlist/เจ้าของ** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต มันไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิด `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ “มันไม่ยอมหยุด”

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร">
    ข้อความภายในหรือข้อความของเครื่องมือส่วนใหญ่จะปรากฏก็ต่อเมื่อเปิด **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    วิธีแก้ในแชตที่คุณเห็นมัน:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนอยู่ ให้ตรวจการตั้งค่าเซสชันใน Control UI และตั้ง verbose
    เป็น **inherit** นอกจากนี้ให้ยืนยันว่าคุณไม่ได้ใช้โปรไฟล์บอตที่ตั้ง `verboseDefault` เป็น
    `on` ใน config

    เอกสาร: [Thinking และ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security#reasoning-verbose-output-in-groups)

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร">
    ส่งอย่างใดอย่างหนึ่งต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่มี slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    เหล่านี้เป็นตัวกระตุ้นการ abort (ไม่ใช่ slash command)

    สำหรับโปรเซสเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมของ Slash commands: ดู [Slash commands](/th/tools/slash-commands)

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่มี shortcut บางตัว (เช่น `/status`) ที่ใช้งาน inline ได้ด้วยสำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร ("Cross-context messaging denied")'>
    OpenClaw จะบล็อกการส่งข้อความ **ข้าม provider** เป็นค่าเริ่มต้น หากการเรียก tool ถูกผูก
    กับ Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้การส่งข้อความข้าม provider สำหรับเอเจนต์:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    รีสตาร์ต gateway หลังแก้ config

  </Accordion>

  <Accordion title='ทำไมมันรู้สึกเหมือนบอต "เมิน" ข้อความที่ส่งรัว ๆ'>
    queue mode ควบคุมว่าข้อความใหม่จะโต้ตอบกับการรันที่กำลังทำอยู่แบบไหน ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - ข้อความใหม่เปลี่ยนทิศทางงานปัจจุบัน
    - `followup` - รันข้อความทีละข้อความ
    - `collect` - รวมข้อความเป็นชุดแล้วตอบครั้งเดียว (ค่าเริ่มต้น)
    - `steer-backlog` - เปลี่ยนทิศทางเดี๋ยวนี้ แล้วค่อยประมวลผล backlog
    - `interrupt` - abort การรันปัจจุบันแล้วเริ่มใหม่

    คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:2s cap:25 drop:summarize` สำหรับโหมด followup ได้

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นของ Anthropic เมื่อใช้ API key คืออะไร'>
    ใน OpenClaw ข้อมูลรับรองกับการเลือกโมเดลเป็นคนละเรื่องกัน การตั้ง `ANTHROPIC_API_KEY` (หรือเก็บ Anthropic API key ไว้ใน auth profile) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือสิ่งที่คุณกำหนดไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` แปลว่า Gateway หา Anthropic credential ใน `auth-profiles.json` ที่คาดหวังไว้สำหรับเอเจนต์ที่กำลังรันไม่พบ
  </Accordion>
</AccordionGroup>

---

หากยังติดปัญหาอยู่ ให้ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [GitHub discussion](https://github.com/openclaw/openclaw/discussions)
