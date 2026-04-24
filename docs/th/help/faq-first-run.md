---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้างอยู่ หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือก auth และ subscriptions ของ provider
    - เข้า docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ หรือติดตั้งค้างอยู่
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก — การติดตั้ง การเริ่มใช้งาน Auth subscriptions และความล้มเหลวในช่วงแรกเริ่ม'
title: 'คำถามที่พบบ่อย: การตั้งค่าในการรันครั้งแรก'
x-i18n:
    generated_at: "2026-04-24T09:14:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  คำถามและคำตอบแบบรวดเร็วสำหรับการเริ่มต้นและการรันครั้งแรก สำหรับการใช้งานประจำวัน เรื่อง models, auth, sessions
  และการแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหาอยู่ วิธีที่เร็วที่สุดในการหลุดจากปัญหาคืออะไร">
    ใช้เอเจนต์ AI ในเครื่องที่ **มองเห็นเครื่องของคุณได้จริง** วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณีส่วนใหญ่ของ "ฉันติดปัญหา" คือ **ปัญหา config หรือสภาพแวดล้อมในเครื่อง**
    ที่ผู้ช่วยจากระยะไกลไม่สามารถตรวจสอบได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่าน repo, รันคำสั่ง, ตรวจ logs และช่วยแก้ปัญหาระดับเครื่องของคุณได้
    (PATH, services, permissions, auth files) ให้สิทธิ์พวกมันเข้าถึง **source checkout แบบเต็ม**
    ผ่านการติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    คำสั่งนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสารได้ และ
    วิเคราะห์ตามเวอร์ชันจริงที่คุณกำลังใช้อยู่ คุณสามารถสลับกลับไปใช้ stable ได้เสมอ
    โดยรันตัวติดตั้งใหม่อีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับดูแล** การแก้ปัญหา (ทีละขั้นตอน) แล้วค่อยรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้จะทำให้การเปลี่ยนแปลงมีขนาดเล็กและตรวจสอบได้ง่ายกว่า

    หากคุณพบข้อบกพร่องจริงหรือมีวิธีแก้ โปรดเปิด GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มจากคำสั่งเหล่านี้ก่อน (แชร์ผลลัพธ์เมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: snapshot แบบรวดเร็วของสุขภาพ gateway/agent + config พื้นฐาน
    - `openclaw models status`: ตรวจ auth ของ provider + ความพร้อมของ model
    - `openclaw doctor`: ตรวจสอบและซ่อมปัญหา config/state ที่พบบ่อย

    คำสั่ง CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักแบบรวดเร็ว: [60 วินาทีแรกเมื่อมีบางอย่างพัง](#first-60-seconds-if-something-is-broken)
    เอกสารติดตั้ง: [Install](/th/install), [Installer flags](/th/install/installer), [Updating](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามตลอด เหตุผลการข้ามแต่ละแบบหมายถึงอะไร">
    เหตุผลการข้าม Heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกช่วง active-hours ที่กำหนดไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงร่างว่าง/หัวข้อเท่านั้น
    - `no-tasks-due`: โหมด task ของ `HEARTBEAT.md` ทำงานอยู่ แต่ยังไม่มี task interval ไหนถึงกำหนด
    - `alerts-disabled`: การแสดงผล heartbeat ทั้งหมดถูกปิด (`showOk`, `showAlerts` และ `useIndicator` ปิดทั้งหมด)

    ในโหมด task ระบบจะเลื่อน due timestamps ก็ต่อเมื่อมีการรัน heartbeat จริง
    ที่เสร็จสมบูรณ์แล้วเท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จสิ้น

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo นี้แนะนำให้รันจาก source และใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard ยังสามารถ build UI assets ให้อัตโนมัติได้ด้วย หลัง onboarding แล้ว โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จาก source (สำหรับผู้ร่วมพัฒนา/dev):

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

  <Accordion title="หลัง onboarding แล้วจะเปิดแดชบอร์ดได้อย่างไร">
    wizard จะเปิดเบราว์เซอร์ของคุณด้วย URL ของแดชบอร์ดแบบสะอาด (ไม่ใส่ token ใน URL) ทันทีหลัง onboarding และยังพิมพ์ลิงก์ไว้ในสรุปด้วย ให้เปิดแท็บนั้นค้างไว้; หากมันไม่เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="จะยืนยันตัวตนกับแดชบอร์ดบน localhost เทียบกับแบบ remote ได้อย่างไร">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วาง token หรือ password ที่กำหนดค่าไว้ลงใน settings ของ Control UI
    - แหล่งที่มาของ token: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของ password: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนด shared secret ให้สร้าง token ด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คงการ bind แบบ loopback แล้วรัน `openclaw gateway --tailscale serve`, เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true`, identity headers จะตอบโจทย์ auth ของ Control UI/WebSocket (ไม่ต้องวาง shared secret, โดยถือว่าโฮสต์ gateway เชื่อถือได้); HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณจะตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม auth ผ่าน Serve ที่ผิดพร้อมกันจากไคลเอนต์เดียวกันจะถูก serialize ก่อนที่ตัวจำกัด failed-auth จะบันทึก ดังนั้นการลองผิดครั้งที่สองอาจขึ้น `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนด password auth), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันใน settings ของแดชบอร์ด
    - **Identity-aware reverse proxy**: ให้ Gateway อยู่หลัง trusted proxy แบบ non-loopback, กำหนด `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` shared-secret auth ยังคงมีผลผ่าน tunnel; หากระบบถาม ให้วาง token หรือ password ที่กำหนดค่าไว้

    ดู [Dashboard](/th/web/dashboard) และ [Web surfaces](/th/web) สำหรับรายละเอียดเรื่องโหมด bind และ auth

  </Accordion>

  <Accordion title="ทำไมถึงมี config การอนุมัติ exec สองแบบสำหรับการอนุมัติในแชต">
    มันควบคุมกันคนละชั้น:

    - `approvals.exec`: ส่งต่อพรอมป์ต์อนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ channel นั้นทำหน้าที่เป็นไคลเอนต์อนุมัติแบบ native สำหรับ exec approvals

    host exec policy ยังคงเป็นด่านอนุมัติที่แท้จริง config ฝั่งแชตแค่ควบคุมว่าพรอมป์ต์อนุมัติ
    จะไปโผล่ที่ไหน และคนจะตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว การใช้ `/approve` ในแชตเดียวกันก็ใช้งานได้ผ่านเส้นทางร่วม
    - หาก native channel ที่รองรับสามารถระบุ approvers ได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิด DM-first native approvals ให้อัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งไว้หรือเป็น `"auto"`
    - เมื่อมี native approval cards/buttons ให้ใช้ UI แบบ native นั้นเป็นเส้นทางหลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual ก็ต่อเมื่อผลลัพธ์จากเครื่องมือบอกว่า chat approvals ใช้งานไม่ได้ หรือ manual approval เป็นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อพรอมป์ต์ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops โดยเฉพาะด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` ก็ต่อเมื่อคุณต้องการให้พรอมป์ต์อนุมัติถูกโพสต์กลับไปยังห้อง/หัวข้อเดิมอย่างชัดเจน
    - Plugin approvals แยกออกไปอีก: ใช้ `/approve` ในแชตเดียวกันเป็นค่าเริ่มต้น, มี `approvals.plugin` สำหรับการส่งต่อแบบไม่บังคับ และมีเพียงบาง native channels เท่านั้นที่ยังมีการจัดการ plugin-approval-native ซ้อนอยู่อีกชั้น

    สรุปสั้นๆ: forwarding มีไว้สำหรับ routing, ส่วน native client config มีไว้เพื่อ UX ที่ดีกว่าและเฉพาะ channel
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม">
    ได้ Gateway ค่อนข้างเบา — เอกสารระบุว่า **RAM 512MB-1GB**, **1 คอร์** และดิสก์ประมาณ **500MB**
    ก็เพียงพอสำหรับการใช้งานส่วนตัว และยังระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการเผื่อพื้นที่เพิ่ม (logs, media, services อื่นๆ) แนะนำ **2GB**
    แต่ไม่ใช่ขั้นต่ำแบบบังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณเพื่อ
    ใช้งานหน้าจอ/กล้อง/Canvas หรือการรันคำสั่งในเครื่อง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีคำแนะนำอะไรสำหรับการติดตั้งบน Raspberry Pi ไหม">
    สรุปสั้นๆ: ใช้งานได้ แต่คาดว่าจะมีมุมที่ยังหยาบอยู่

    - ใช้ระบบปฏิบัติการแบบ **64-bit** และรักษา Node ให้เป็น >= 22
    - ควรใช้การติดตั้งแบบ **hackable (git)** เพื่อให้ดู logs และอัปเดตได้เร็ว
    - เริ่มจากไม่มี channels/Skills ก่อน แล้วค่อยเพิ่มทีละตัว
    - หากเจอปัญหาแปลกๆ เกี่ยวกับไบนารี มักเป็นปัญหา **ความเข้ากันได้ของ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [Install](/th/install)

  </Accordion>

  <Accordion title="มันค้างอยู่ที่ wake up my friend / onboarding ไม่ยอม hatch ควรทำอย่างไร">
    หน้าจอนั้นขึ้นอยู่กับการที่ Gateway เข้าถึงได้และยืนยันตัวตนได้ TUI ยังส่ง
    "Wake up, my friend!" ให้อัตโนมัติในครั้งแรกที่ hatch ด้วย หากคุณเห็นบรรทัดนั้นแต่ **ไม่มีการตอบกลับ**
    และ tokens ยังคงเป็น 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ต Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจ status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway เป็นแบบ remote ให้แน่ใจว่า tunnel/Tailscale connection ทำงานอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [Remote access](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันย้ายการตั้งค่าไปเครื่องใหม่ (Mac mini) ได้ไหมโดยไม่ต้องทำ onboarding ใหม่">
    ได้ ให้คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    จะทำให้บอทของคุณ "เหมือนเดิมทุกอย่าง" (memory, ประวัติเซสชัน, auth และ
    state ของ channel) ตราบใดที่คุณคัดลอก **ทั้งสองตำแหน่ง**:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` แล้วรีสตาร์ตบริการ Gateway

    วิธีนี้จะคง config, auth profiles, credentials ของ WhatsApp, sessions และ memory ไว้ หากคุณอยู่ใน
    remote mode อย่าลืมว่าโฮสต์ gateway เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียงแค่ commit/push workspace ไปยัง GitHub คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ได้** สำรองประวัติเซสชันหรือ auth สิ่งเหล่านั้นอยู่
    ภายใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [Migrating](/th/install/migrating), [สิ่งต่างๆ อยู่บนดิสก์ที่ไหน](#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูได้จากที่ไหนว่าเวอร์ชันล่าสุดมีอะไรใหม่บ้าง">
    ตรวจ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนที่มีวันที่ถัดลงมาคือ
    เวอร์ชันที่ปล่อยจริงล่าสุด รายการจะถูกจัดกลุ่มเป็น **Highlights**, **Changes** และ
    **Fixes** (รวมถึงส่วน docs/อื่นๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้า docs.openclaw.ai ไม่ได้ (SSL error)">
    การเชื่อมต่อบางแบบของ Comcast/Xfinity บล็อก `docs.openclaw.ai` อย่างไม่ถูกต้องผ่าน Xfinity
    Advanced Security ให้ปิดฟีเจอร์นั้นหรือ allowlist `docs.openclaw.ai` แล้วลองใหม่
    และโปรดช่วยเราปลดบล็อกด้วยการรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าไซต์ไม่ได้ เอกสารถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** เป็น **npm dist-tags** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = build ช่วงต้นสำหรับการทดสอบ

    โดยปกติแล้ว stable release จะไปลงที่ **beta** ก่อน จากนั้นจะมี
    ขั้นตอน promote แบบชัดเจนที่ย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นั่นจึงเป็นเหตุผลว่าทำไม beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังการ promote

    ดูว่ามีอะไรเปลี่ยนไปบ้าง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev ดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังการ promote)
    **Dev** คือส่วนหัวที่เคลื่อนไหวของ `main` (git); เมื่อ publish แล้ว จะใช้ npm dist-tag `dev`

    คำสั่งแบบบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [Development channels](/th/install/development-channels) และ [Installer flags](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร">
    มีสองทางเลือก:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยังสาขา `main` และอัปเดตจาก source

    2. **Hackable install (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้ local repo ที่คุณแก้ไขได้ แล้วอัปเดตต่อด้วย git

    หากคุณต้องการ clone แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [Update](/th/cli/update), [Development channels](/th/install/development-channels),
    [Install](/th/install)

  </Accordion>

  <Accordion title="โดยปกติการติดตั้งและ onboarding ใช้เวลานานเท่าไร">
    คร่าวๆ คือ:

    - **Install:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับว่าคุณกำหนด channels/models กี่รายการ

    หากมันค้าง ให้ใช้ [Installer stuck](#quick-start-and-first-run-setup)
    และวงจรดีบักแบบเร็วใน [I am stuck](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดู feedback เพิ่มได้อย่างไร">
    รันตัวติดตั้งอีกครั้งพร้อม **verbose output**:

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

    เวอร์ชันเทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 ยังไม่มีแฟลก -Verbose โดยเฉพาะในตอนนี้
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [Installer flags](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows บอกว่า git not found หรือ openclaw not recognized">
    มีปัญหาบน Windows ที่พบบ่อยสองอย่าง:

    **1) npm error spawn git / git not found**

    - ติดตั้ง **Git for Windows** และตรวจให้แน่ใจว่า `git` อยู่บน PATH
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นรันตัวติดตั้งอีกครั้ง

    **2) `openclaw` ไม่ถูกจดจำหลังการติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่บน PATH
    - ตรวจพาธด้วย:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นลงใน user PATH ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่จะเป็น `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ลื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบ native
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ฉันควรทำอย่างไร">
    โดยปกติแล้วนี่คือปัญหา console code page ไม่ตรงกันบน shell แบบ native ของ Windows

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติใน terminal profile อื่น

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

    หากคุณยังพบปัญหานี้บน OpenClaw รุ่นล่าสุด ให้ติดตาม/รายงานได้ที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่านี้อย่างไร">
    ใช้ **hackable (git) install** เพื่อให้คุณมี source และ docs แบบเต็มในเครื่อง จากนั้นถาม
    บอทของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [Install](/th/install) และ [Installer flags](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร">
    คำตอบสั้นๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางแบบเร็วบน Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบเต็ม: [Getting Started](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [Install & updates](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร">
    Linux VPS ใดๆ ก็ใช้ได้ ติดตั้งบนเซิร์ฟเวอร์ จากนั้นใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงแบบ remote: [Gateway remote](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือติดตั้งบน cloud/VPS อยู่ที่ไหน">
    เรามี **hosting hub** สำหรับผู้ให้บริการที่ใช้บ่อย ให้เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [VPS hosting](/th/vps) (รวมผู้ให้บริการทั้งหมดไว้ในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบนคลาวด์คือ **Gateway ทำงานบนเซิร์ฟเวอร์** และคุณเข้าถึงมัน
    จากแล็ปท็อป/โทรศัพท์ของคุณผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่าโฮสต์นั้นเป็นแหล่งความจริงและสำรองข้อมูลไว้

    คุณสามารถ pair **nodes** (Mac/iOS/Android/headless) เข้ากับ cloud Gateway นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/Canvas ในเครื่องหรือรันคำสั่งบนแล็ปท็อปของคุณ ขณะเดียวกันยังคงให้
    Gateway อยู่บนคลาวด์

    ศูนย์รวม: [Platforms](/th/platforms) การเข้าถึงแบบ remote: [Gateway remote](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันสามารถให้ OpenClaw อัปเดตตัวเองได้ไหม">
    คำตอบสั้นๆ: **ทำได้ แต่ไม่แนะนำ** ขั้นตอนการอัปเดตอาจรีสตาร์ต
    Gateway (ซึ่งจะทำให้เซสชันปัจจุบันหลุด) อาจต้องใช้ git checkout ที่สะอาด และ
    อาจถามเพื่อยืนยัน วิธีที่ปลอดภัยกว่าคือรันการอัปเดตจาก shell ในฐานะผู้ดูแล

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำให้เป็นอัตโนมัติจากเอเจนต์:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [Update](/th/cli/update), [Updating](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริงๆ บ้าง">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **local mode** มันจะพาคุณผ่านขั้นตอนเหล่านี้:

    - **การตั้งค่า model/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือก local model เช่น LM Studio)
    - ตำแหน่ง **workspace** + bootstrap files
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง bundled channel plugins เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **Skills**

    มันยังเตือนด้วยหาก model ที่คุณกำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้ไหม">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่นๆ) หรือด้วย
    **local-only models** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณเอง subscriptions (Claude
    Pro/Max หรือ OpenAI Codex) เป็นเพียงวิธีเลือกได้สำหรับการยืนยันตัวตนกับ providers เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งการใช้งานในทางปฏิบัติคือ:

    - **Anthropic API key**: การคิดค่าบริการแบบ Anthropic API ปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: ทีมงาน Anthropic
      แจ้งกับเราว่าการใช้งานลักษณะนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้ `claude -p`
      เป็นสิ่งที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่
      นโยบายใหม่

    สำหรับโฮสต์ gateway ระยะยาว Anthropic API keys ยังคงเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือกแบบ hosted subscription อื่นๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [Local models](/th/gateway/local-models), [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่ใช้ API key ได้ไหม">
    ได้

    ทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI ในลักษณะ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาต
    สำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="รองรับ Claude subscription auth (Claude Pro หรือ Max) ไหม">
    รองรับ

    ทีมงาน Anthropic แจ้งกับเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมี
    สำหรับงาน production หรือหลายผู้ใช้ การยืนยันตัวตนด้วย Anthropic API key ยังคงเป็น
    ทางเลือกที่ปลอดภัยและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือกแบบ hosted subscription
    อื่นๆ ใน OpenClaw ดูได้ที่ [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันถึงเห็น HTTP 429 rate_limit_error จาก Anthropic">
    นั่นหมายความว่า **โควตา/ขีดจำกัดอัตรา** ของ Anthropic ของคุณหมดแล้วสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอจนกว่าหน้าต่างจะรีเซ็ตหรืออัปเกรดแพ็กเกจของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่ม limits ตามความจำเป็น

    หากข้อความระบุชัดเจนว่า:
    `Extra usage is required for long context requests` แปลว่าคำขอนั้นพยายามใช้
    1M context beta ของ Anthropic (`context1m: true`) ซึ่งจะใช้ได้ก็ต่อเมื่อ
    credential ของคุณมีสิทธิ์สำหรับการเรียกเก็บเงินแบบ long-context (การเรียกเก็บเงินด้วย API key หรือ
    เส้นทาง Claude-login ของ OpenClaw ที่เปิด Extra Usage)

    เคล็ดลับ: ตั้งค่า **fallback model** เพื่อให้ OpenClaw ยังตอบกลับได้ต่อไปเมื่อ provider ติด rate limit
    ดู [Models](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock ไหม">
    รองรับ OpenClaw มี provider **Amazon Bedrock (Converse)** แบบ bundled เมื่อมี AWS env markers อยู่ OpenClaw สามารถค้นหาแค็ตตาล็อก Bedrock แบบ streaming/text โดยอัตโนมัติและรวมเข้ามาเป็น provider `amazon-bedrock` แบบ implicit ได้; หากไม่มี คุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` แบบชัดเจนหรือเพิ่มรายการ provider ด้วยตนเองได้ ดู [Amazon Bedrock](/th/providers/bedrock) และ [Model providers](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบจัดการให้ proxy ที่เข้ากันได้กับ OpenAI อยู่หน้า Bedrock ก็ยังเป็นทางเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="Codex auth ทำงานอย่างไร">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (ลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai-codex/gpt-5.5` สำหรับ Codex OAuth ผ่าน PI runner เริ่มต้น ใช้
    `openai/gpt-5.4` สำหรับการเข้าถึงด้วย OpenAI API-key แบบ direct ในปัจจุบัน การเข้าถึง GPT-5.5 แบบ direct
    ด้วย API-key จะรองรับเมื่อ OpenAI เปิดใช้บน public API; ปัจจุบัน
    GPT-5.5 ใช้ subscription/OAuth ผ่าน `openai-codex/gpt-5.5` หรือการรัน native Codex
    app-server ด้วย `openai/gpt-5.5` และ `embeddedHarness.runtime: "codex"` ดู [Model providers](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังพูดถึง openai-codex อยู่">
    `openai-codex` คือ provider และ auth-profile id สำหรับ ChatGPT/Codex OAuth
    มันยังเป็น prefix ของ PI model แบบ explicit สำหรับ Codex OAuth ด้วย:

    - `openai/gpt-5.4` = เส้นทาง direct OpenAI API-key ปัจจุบันใน PI
    - `openai/gpt-5.5` = เส้นทาง direct API-key ในอนาคต เมื่อ OpenAI เปิดใช้ GPT-5.5 บน API
    - `openai-codex/gpt-5.5` = เส้นทาง Codex OAuth ใน PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = เส้นทาง native Codex app-server
    - `openai-codex:...` = auth profile id ไม่ใช่ model ref

    หากคุณต้องการเส้นทางการคิดค่าบริการ/limits แบบ direct ผ่าน OpenAI Platform ให้ตั้ง
    `OPENAI_API_KEY` หากคุณต้องการ ChatGPT/Codex subscription auth ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` แล้วใช้
    model refs แบบ `openai-codex/*` สำหรับการรันของ PI

  </Accordion>

  <Accordion title="ทำไม limits ของ Codex OAuth ถึงอาจต่างจาก ChatGPT บนเว็บ">
    Codex OAuth ใช้หน้าต่างโควตาที่จัดการโดย OpenAI และขึ้นกับแพ็กเกจ ในทางปฏิบัติ
    limits เหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้
    ทั้งสองอย่างจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่าง usage/quota ของ provider ที่มองเห็นได้ในขณะนั้นใน
    `openclaw models status` แต่จะไม่สร้างหรือทำให้ entitlement ของ ChatGPT-web
    กลายเป็นการเข้าถึง direct API หากคุณต้องการเส้นทางการคิดค่าบริการ/limits แบบ direct ผ่าน OpenAI Platform
    ให้ใช้ `openai/*` กับ API key

  </Accordion>

  <Accordion title="รองรับ OpenAI subscription auth (Codex OAuth) ไหม">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างสมบูรณ์
    OpenAI อนุญาตอย่างชัดเจนให้ใช้ subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw onboarding สามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [Model providers](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร">
    Gemini CLI ใช้ **plugin auth flow** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ plugin: `openclaw plugins enable google`
    3. ล็อกอิน: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. model เริ่มต้นหลังล็อกอิน: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway

    สิ่งนี้จะจัดเก็บ OAuth tokens ไว้ใน auth profiles บนโฮสต์ gateway รายละเอียด: [Model providers](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="local model ใช้สำหรับแชตสบายๆ ได้ไหม">
    โดยทั่วไปไม่ได้ OpenClaw ต้องใช้ context ขนาดใหญ่ + ความปลอดภัยที่แข็งแรง; การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็นจริงๆ ให้รัน model build ที่ **ใหญ่ที่สุด** เท่าที่เครื่องคุณไหวในเครื่อง (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) model ที่เล็กกว่า/quantized จะเพิ่มความเสี่ยงจาก prompt-injection - ดู [Security](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะทำให้ทราฟฟิกของ hosted model อยู่ใน region ที่กำหนดได้อย่างไร">
    เลือก endpoints ที่ปักหมุด region ไว้ OpenRouter เปิดตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; ให้เลือก variant ที่โฮสต์ในสหรัฐฯ เพื่อให้ข้อมูลอยู่ใน region นั้น คุณยังสามารถใส่ Anthropic/OpenAI ไว้ร่วมกันได้ด้วยการใช้ `models.mode: "merge"` เพื่อให้ fallbacks ยังใช้งานได้ ขณะเดียวกันก็เคารพ provider แบบ regional ที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้ไหม">
    ไม่ OpenClaw รันได้บน macOS หรือ Linux (Windows ผ่าน WSL2) Mac mini เป็นเพียงตัวเลือก - บางคน
    ซื้อมาเป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก home server หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณจะต้องใช้ Mac **สำหรับเครื่องมือที่มีเฉพาะบน macOS** เท่านั้น สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ ส่วน Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่มีเฉพาะบน macOS ให้รัน Gateway บน Mac หรือ pair macOS node

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes), [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini สำหรับการรองรับ iMessage ไหม">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่องหนึ่ง** ที่ลงชื่อเข้าใช้ Messages อยู่ มัน **ไม่จำเป็นต้องเป็น Mac mini** -
    Mac เครื่องไหนก็ได้ **ให้ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ขณะที่ Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าที่พบบ่อย:

    - รัน Gateway บน Linux/VPS แล้วรันเซิร์ฟเวอร์ BlueBubbles บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes),
    [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันจะเชื่อมต่อมันเข้ากับ MacBook Pro ได้ไหม">
    ได้ **Mac mini สามารถรัน Gateway ได้** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่หู) ได้ Nodes ไม่ได้รัน Gateway - พวกมันให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/Canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบที่พบบ่อย:

    - Gateway บน Mac mini (เปิดตลอด)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node แล้ว pair เข้ากับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูสถานะ

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบ runtime bugs โดยเฉพาะกับ WhatsApp และ Telegram
    ให้ใช้ **Node** สำหรับ gateways ที่ต้องการเสถียรภาพ

    หากคุณยังอยากทดลองกับ Bun ให้ทดลองบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้ของบอท

    ขั้นตอนตั้งค่าจะถามเฉพาะ user IDs แบบตัวเลขเท่านั้น หากคุณมีรายการ `@username` แบบ legacy อยู่ใน config แล้ว `openclaw doctor --fix` อาจช่วย resolve ให้ได้

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอทของบุคคลที่สาม):

    - DM ไปหาบอทของคุณ จากนั้นรัน `openclaw logs --follow` แล้วอ่านค่า `from.id`

    Bot API ทางการ:

    - DM ไปหาบอทของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` แล้วอ่าน `message.from.id`

    บริการของบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM ไปที่ `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนใช้ WhatsApp หมายเลขเดียวกับ OpenClaw คนละอินสแตนซ์ได้ไหม">
    ได้ ผ่าน **multi-agent routing** ให้ bind **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, sender E.164 เช่น `+15551234567`) ไปยัง `agentId` คนละตัว เพื่อให้แต่ละคนมี workspace และ session store ของตัวเอง การตอบกลับจะยังคงส่งมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบ global ต่อบัญชี WhatsApp ดู [Multi-Agent Routing](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันสามารถมีเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้ไหม'>
    ได้ ใช้ multi-agent routing: กำหนด model เริ่มต้นของแต่ละเอเจนต์ จากนั้น bind inbound routes (บัญชี provider หรือ peers เฉพาะ) ไปยังแต่ละเอเจนต์ ตัวอย่าง config อยู่ใน [Multi-Agent Routing](/th/concepts/multi-agent) ดูเพิ่มเติมที่ [Models](/th/concepts/models) และ [Configuration](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้งานบน Linux ได้ไหม">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ให้ตรวจสอบว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ brew prefix ของคุณ) เพื่อให้ tools ที่ติดตั้งด้วย `brew` ถูก resolve ได้ใน non-login shells
    ใน build ล่าสุด ระบบยัง prepend ไดเรกทอรี bin ทั่วไปของผู้ใช้บน Linux systemd services ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และรองรับ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อมีการตั้งค่า

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง hackable git install กับ npm install">
    - **Hackable (git) install:** source checkout แบบเต็ม แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณ build ในเครื่องและแก้โค้ด/เอกสารได้
    - **npm install:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับการ "แค่ใช้งาน"
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [Getting started](/th/start/getting-started), [Updating](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับไปมาระหว่าง npm กับ git installs ทีหลังได้ไหม">
    ได้ ติดตั้งอีกแบบหนึ่ง แล้วรัน Doctor เพื่อให้บริการ gateway ชี้ไปที่ entrypoint ใหม่
    วิธีนี้ **จะไม่ลบข้อมูลของคุณ** - มันแค่เปลี่ยนการติดตั้งโค้ดของ OpenClaw เท่านั้น state ของคุณ
    (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) จะไม่ถูกแตะต้อง

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

    Doctor จะตรวจพบว่า entrypoint ของบริการ gateway ไม่ตรงกัน และจะเสนอให้เขียน config ของ service ใหม่ให้ตรงกับการติดตั้งปัจจุบัน (ใช้ `--repair` ในระบบอัตโนมัติ)

    เคล็ดลับเรื่องการสำรองข้อมูล: ดู [Backup strategy](#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS">
    คำตอบสั้นๆ: **ถ้าคุณต้องการความน่าเชื่อถือแบบ 24/7 ให้ใช้ VPS** ถ้าคุณต้องการ
    ความสะดวกที่สุดและรับได้กับการ sleep/restart ก็ให้รันในเครื่อง

    **แล็ปท็อป (local Gateway)**

    - **ข้อดี:** ไม่มีค่าใช้จ่ายเซิร์ฟเวอร์ เข้าถึงไฟล์ในเครื่องได้โดยตรง มีหน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = disconnects, การอัปเดต/รีบูตของ OS รบกวนการทำงาน, เครื่องต้องเปิดตลอด

    **VPS / cloud**

    - **ข้อดี:** เปิดตลอด เครือข่ายเสถียร ไม่มีปัญหาแล็ปท็อป sleep รักษาการทำงานต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบ headless (ใช้ screenshots), เข้าถึงไฟล์ได้แบบ remote เท่านั้น, คุณต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ใช้งานจาก VPS ได้สบาย ความต่างจริงๆ มีแค่เรื่อง **headless browser** เทียบกับหน้าต่างที่มองเห็นได้ ดู [Browser](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากก่อนหน้านี้คุณเคยมีปัญหา gateway disconnects การรันในเครื่องเหมาะมากเมื่อคุณกำลังใช้งาน Mac อยู่จริงๆ และต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกการทำงาน**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดตลอดเวลา มีการขัดจังหวะจาก sleep/reboot น้อยกว่า สิทธิ์การเข้าถึงสะอาดกว่า รักษาให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงได้สบาย แต่คาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่อง sleep หรืออัปเดต

    หากคุณต้องการได้ทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะ แล้ว pair แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับแนวทางด้านความปลอดภัย โปรดอ่าน [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="VPS ขั้นต่ำต้องการอะไรบ้าง และระบบปฏิบัติการที่แนะนำคืออะไร">
    OpenClaw ค่อนข้างเบา สำหรับ Gateway พื้นฐาน + หนึ่ง chat channel:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อเผื่อพื้นที่ (logs, media, หลาย channels) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรค่อนข้างมาก

    ระบบปฏิบัติการ: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ถูกทดสอบดีที่สุดบนระบบเหล่านี้

    เอกสาร: [Linux](/th/platforms/linux), [VPS hosting](/th/vps)

  </Accordion>

  <Accordion title="ฉันสามารถรัน OpenClaw ใน VM ได้ไหม และต้องการอะไรบ้าง">
    ได้ ให้มอง VM เหมือน VPS: มันต้องเปิดอยู่ตลอดเวลา เข้าถึงได้ และมี RAM เพียงพอ
    สำหรับ Gateway และ channels ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลาย channels, browser automation หรือ media tools
    - **ระบบปฏิบัติการ:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่นๆ

    หากคุณใช้ Windows, **WSL2 คือการตั้งค่าแบบ VM ที่ง่ายที่สุด** และเข้ากันได้กับเครื่องมือดีที่สุด
    ดู [Windows](/th/platforms/windows), [VPS hosting](/th/vps)
    หากคุณกำลังรัน macOS ใน VM ให้ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (models, sessions, gateway, security และอื่นๆ)
- [Install overview](/th/install)
- [Getting started](/th/start/getting-started)
- [Troubleshooting](/th/help/troubleshooting)
