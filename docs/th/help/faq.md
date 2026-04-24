---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือ runtime
    - การคัดแยกปัญหาที่ผู้ใช้รายงานก่อนเข้าสู่การดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-04-24T09:14:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

คำตอบแบบรวดเร็วพร้อมการแก้ไขปัญหาเชิงลึกสำหรับการตั้งค่าในโลกจริง (local dev, VPS, multi-agent, OAuth/API keys, Model Failover) สำหรับการวินิจฉัย runtime ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงคอนฟิกฉบับเต็ม ดู [Configuration](/th/gateway/configuration)

## 60 วินาทีแรกหากมีบางอย่างเสีย

1. **สถานะอย่างรวดเร็ว (ตรวจสอบอย่างแรก)**

   ```bash
   openclaw status
   ```

   สรุปภายในเครื่องแบบรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, คอนฟิกผู้ให้บริการ + ปัญหา runtime (เมื่อเข้าถึง gateway ได้)

2. **รายงานแบบคัดลอกวางได้ (แชร์ได้อย่างปลอดภัย)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อม log tail (มีการปกปิด tokens)

3. **สถานะ daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดง runtime ของ supervisor เทียบกับการเข้าถึง RPC, probe target URL และคอนฟิกที่ service น่าจะใช้

4. **Deep probes**

   ```bash
   openclaw status --deep
   ```

   รัน live gateway health probe รวมถึง channel probes เมื่อรองรับ
   (ต้องเข้าถึง gateway ได้) ดู [Health](/th/gateway/health)

5. **tail ล็อกล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ใช้งานไม่ได้ ให้ fallback ไปที่:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   file logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้ายคอนฟิกและสถานะ + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **สแนปช็อต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง target URL + config path เมื่อเกิดข้อผิดพลาด
   ```

   ขอ full snapshot จาก gateway ที่กำลังทำงานอยู่ (WS-only) ดู [Health](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

Q&A สำหรับการรันครั้งแรก — การติดตั้ง, onboard, เส้นทาง auth, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ที่ [คำถามที่พบบ่อยสำหรับการรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไร ในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugins ของช่องทางที่รวมมาให้ เช่น QQ Bot) และยังรองรับเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับด้วย **Gateway** คือ control plane ที่เปิดตลอดเวลา; ส่วนตัวผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าหลัก">
    OpenClaw ไม่ใช่ "แค่ตัวครอบ Claude" แต่มันคือ **control plane แบบ local-first** ที่ช่วยให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    เซสชันที่มีสถานะ Memory และเครื่องมือ — โดยไม่ต้องยกการควบคุมเวิร์กโฟลว์ของคุณให้กับ
    SaaS ที่โฮสต์อยู่

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ไหนก็ได้ที่คุณต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติเซสชันไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ sandbox บนเว็บ:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ฯลฯ
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ยึดติดกับโมเดล:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทางรายเอเจนต์
      และ failover
    - **ตัวเลือก local-only:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้**
      หากต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยกเอเจนต์ตามช่องทาง บัญชี หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และโฮสต์เองได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [Multi-agent](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ — ควรทำอะไรก่อนดี?">
    โปรเจกต์แรก ๆ ที่เหมาะมีดังนี้:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site แบบเรียบง่าย)
    - สร้างต้นแบบแอปมือถือ (โครงร่าง หน้าจอ แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, ตั้งชื่อ, tagging)
    - เชื่อม Gmail และทำสรุปหรือ follow-up อัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้ sub agents สำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="ห้า use cases ประจำวันอันดับต้น ๆ ของ OpenClaw คืออะไร?">
    ประโยชน์ในชีวิตประจำวันมักมีลักษณะดังนี้:

    - **สรุปส่วนตัว:** สรุป inbox, ปฏิทิน และข่าวที่คุณสนใจ
    - **การค้นคว้าและการร่าง:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างแรกสำหรับอีเมลหรือเอกสาร
    - **การเตือนและการติดตามผล:** nudges และ checklists ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** กรอกฟอร์ม เก็บข้อมูล และทำงานเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ของคุณ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับมาในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสามารถสแกนเว็บไซต์ สร้าง shortlist,
    สรุป prospects และเขียน outreach หรือร่างข้อความโฆษณาได้

    สำหรับ **outreach หรือการรันโฆษณา** ควรให้มนุษย์อยู่ในวงจรเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อดีเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และเลเยอร์การประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดใน repo ใช้ OpenClaw เมื่อ
    คุณต้องการ memory ที่คงทน การเข้าถึงข้ามอุปกรณ์ และการ orchestration ของเครื่องมือ

    ข้อดี:

    - **Memory + workspace แบบคงอยู่** ข้ามหลายเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การ orchestration ของเครื่องมือ** (เบราว์เซอร์ ไฟล์ การตั้งเวลา hooks)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS และโต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ภายในเครื่อง

    ตัวอย่างผลงาน: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides จะยังชนะ bundled skills โดยไม่ต้องแตะ git หากคุณต้องการติดตั้ง skill แบบ global แต่ให้มองเห็นได้เฉพาะบางเอเจนต์ ให้เก็บสำเนาที่ใช้ร่วมกันไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่เหมาะจะส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งเป็น PR
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` โดยค่าเริ่มต้น `clawhub` จะติดตั้งลงใน `./skills` ซึ่ง OpenClaw จะถือเป็น `<workspace>/skills` ในเซสชันถัดไป หาก skill ควรมองเห็นได้เฉพาะบางเอเจนต์ ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่าง ๆ ได้อย่างไร?">
    ปัจจุบันรูปแบบที่รองรับคือ:

    - **งาน Cron**: งานแบบ isolated สามารถตั้ง `model` override รายงานได้
    - **Sub-agents**: กำหนดเส้นทางงานไปยังเอเจนต์แยกที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเวลา

    ดู [งาน Cron](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างขณะทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานที่ยาวหรืองานขนาน Sub-agents จะรันในเซสชันของตนเอง
    ส่งสรุปกลับมา และทำให้แชตหลักของคุณยังตอบสนองได้

    บอกบอตของคุณว่า "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่องโทเค็น: ทั้งงานยาวและ sub-agents ใช้โทเค็น หากกังวลเรื่องต้นทุน ให้ตั้ง
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="เซสชัน subagent ที่ผูกกับเธรดบน Discord ทำงานอย่างไร?">
    ใช้ thread bindings คุณสามารถผูกเธรด Discord กับ subagent หรือเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงอยู่บนเซสชันที่ผูกไว้

    โฟลว์พื้นฐาน:

    - สร้างด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือก `mode: "session"` สำหรับการติดตามผลแบบคงอยู่)
    - หรือผูกด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุมการ auto-unfocus
    - ใช้ `/unfocus` เพื่อยกเลิกการผูกเธรด

    คอนฟิกที่จำเป็น:

    - ค่าเริ่มต้นแบบ global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - ผูกอัตโนมัติเมื่อ spawn: ตั้งค่า `channels.discord.threadBindings.spawnSubagentSessions: true`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent ทำงานเสร็จแล้ว แต่การอัปเดตเมื่อเสร็จสิ้นไปผิดที่หรือไม่โพสต์เลย ฉันควรตรวจสอบอะไร?">
    ตรวจสอบ requester route ที่ resolve แล้วก่อน:

    - การส่งมอบของ subagent แบบ completion-mode จะให้ความสำคัญกับเธรดหรือเส้นทางบทสนทนาที่ผูกไว้เมื่อมีอยู่
    - หาก origin ของ completion มีเพียงช่องทาง OpenClaw จะ fallback ไปยังเส้นทางที่เก็บไว้ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งตรงยังสำเร็จได้
    - หากไม่มีทั้งเส้นทางที่ผูกไว้และเส้นทางที่เก็บไว้ที่ใช้งานได้ การส่งตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปยัง session delivery แบบเข้าคิวแทนการโพสต์ทันทีในแชต
    - เป้าหมายที่ไม่ถูกต้องหรือล้าสมัยยังคงทำให้ fallback ไปคิวหรือเกิดความล้มเหลวของการส่งมอบขั้นสุดท้ายได้
    - หากคำตอบ assistant ล่าสุดที่มองเห็นได้ของ child เป็น silent token แบบตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` แบบตรงตัว OpenClaw จะระงับการประกาศโดยตั้งใจ แทนที่จะโพสต์ความคืบหน้าเก่าที่ล้าสมัย
    - หาก child หมดเวลาหลังจากมีเพียง tool calls การประกาศอาจยุบให้เหลือสรุปความคืบหน้าบางส่วนแบบสั้น ๆ แทนการเล่นเอาต์พุตดิบของเครื่องมือซ้ำ

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือการเตือนไม่ทำงาน ฉันควรตรวจสอบอะไร?">
    Cron ทำงานภายในโปรเซส Gateway หาก Gateway ไม่ได้ทำงานอย่างต่อเนื่อง
    งานตามกำหนดเวลาจะไม่ทำงาน

    เช็กลิสต์:

    - ยืนยันว่าเปิดใช้ cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway ทำงานตลอด 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบการตั้งค่า timezone ของงาน (`--tz` เทียบกับ timezone ของโฮสต์)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่องทาง ทำไม?">
    ตรวจสอบโหมดการส่งมอบก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่มีการส่งแบบ runner fallback ตามที่คาดไว้
    - announce target (`channel` / `to`) ที่หายไปหรือไม่ถูกต้อง หมายความว่า runner ข้ามการส่งมอบขาออก
    - ความล้มเหลวด้าน auth ของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งมอบแล้ว แต่ credentials บล็อกไว้
    - ผลลัพธ์ isolated แบบเงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าไม่สามารถส่งมอบได้โดยตั้งใจ ดังนั้น runner จึงระงับ queued fallback delivery ด้วย

    สำหรับงาน Cron แบบ isolated เอเจนต์ยังคงส่งตรงได้ด้วยเครื่องมือ `message`
    เมื่อมีเส้นทางแชตให้ใช้ `--announce` ควบคุมเฉพาะเส้นทาง runner
    fallback สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งเองเท่านั้น

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="ทำไมการรัน Cron แบบ isolated ถึงสลับโมเดลหรือ retry หนึ่งครั้ง?">
    โดยปกตินี่คือเส้นทาง live model-switch ไม่ใช่การตั้งเวลาซ้ำ

    Cron แบบ isolated สามารถบันทึก runtime model handoff และ retry เมื่อการรันที่ active
    โยน `LiveSessionModelSwitchError` การ retry จะคง provider/model ที่สลับแล้วไว้
    และหากการสลับนั้นมี auth profile override ใหม่ Cron
    จะบันทึกสิ่งนั้นไว้ด้วยก่อน retry

    กฎการเลือกที่เกี่ยวข้อง:

    - Gmail hook model override ชนะก่อนเมื่อเข้าเงื่อนไข
    - จากนั้นใช้ `model` รายงาน
    - จากนั้นใช้ cron-session model override ที่เก็บไว้
    - จากนั้นใช้การเลือกโมเดลปกติของ agent/default

    ลูป retry มีขอบเขต หลังจากความพยายามเริ่มต้นบวก 2 switch retries
    Cron จะยกเลิกแทนที่จะวนลูปไม่รู้จบ

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [cron CLI](/th/cli/cron)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบ native หรือวาง Skills ลงใน workspace ของคุณ UI สำหรับ Skills บน macOS ใช้งานไม่ได้บน Linux
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

    `openclaw skills install` แบบ native จะเขียนลงในไดเรกทอรี `skills/`
    ของ workspace ที่ active ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงก์ Skills ของคุณเอง สำหรับการติดตั้งแบบใช้ร่วมกันข้ามหลายเอเจนต์ ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่าเอเจนต์ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวตั้งเวลาของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดเวลาหรืองานที่เกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบแบบเป็นระยะของ "main session"
    - **งานแบบ isolated** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือส่งมอบไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [Automation & Tasks](/th/automation),
    [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะบน Apple macOS จาก Linux ได้ไหม?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกควบคุมโดย `metadata.openclaw.os` ร่วมกับ binaries ที่จำเป็น และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีคุณสมบัติเหมาะสมบน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่เป็น `darwin`-only (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะ override การควบคุมนี้

    คุณมีรูปแบบที่รองรับอยู่สามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มี macOS binaries อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ macOS node (ไม่ใช้ SSH)**
    รัน Gateway บน Linux, จับคู่ macOS node (แอป menubar) และตั้ง **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะบน macOS มีคุณสมบัติเหมาะสมได้เมื่อ binaries ที่จำเป็นมีอยู่บน node เอเจนต์จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ใน prompt จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - proxy macOS binaries ผ่าน SSH (ขั้นสูง)**
    คง Gateway ไว้บน Linux แต่ทำให้ CLI binaries ที่จำเป็น resolve ไปยัง SSH wrappers ที่รันบน Mac จากนั้น override skill ให้อนุญาต Linux เพื่อให้ยังมีคุณสมบัติเหมาะสม

    1. สร้าง SSH wrapper สำหรับ binary นั้น (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper ลงบน `PATH` ของโฮสต์ Linux (เช่น `~/bin/memo`)
    3. override metadata ของ skill (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: จัดการ Apple Notes ผ่าน CLI `memo` บน macOS
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้สแนปช็อต Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการเชื่อมต่อกับ Notion หรือ HeyGen ไหม?">
    ตอนนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Custom skill / Plugin:** ดีที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion และ HeyGen มี APIs)
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** ใช้งานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทรายลูกค้า (เวิร์กโฟลว์แบบเอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งลูกค้า (บริบท + การตั้งค่า + งานที่กำลังทำ)
    - ขอให้เอเจนต์ดึงหน้านั้นในช่วงเริ่มต้นของเซสชัน

    หากคุณต้องการการเชื่อมต่อแบบ native ให้เปิดคำขอฟีเจอร์หรือสร้าง skill
    ที่เจาะไปยัง APIs เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบ native จะลงในไดเรกทอรี `skills/` ของ workspace ที่ active สำหรับ Skills ที่ใช้ร่วมกันข้ามหลายเอเจนต์ ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากต้องการให้มีเพียงบางเอเจนต์ที่มองเห็นการติดตั้งแบบใช้ร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังให้มี binaries ที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew บน Linux ด้านบน) ดู [Skills](/th/tools/skills), [คอนฟิก Skills](/th/tools/skills-config) และ [ClawHub](/th/tools/clawhub)

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้แล้วของฉันกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ที่มีมาให้ในตัว ซึ่งเชื่อมต่อผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อแบบกำหนดเอง ให้สร้างโปรไฟล์ MCP แบบ explicit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์บนโฮสต์ในเครื่องหรือ browser node ที่เชื่อมต่ออยู่ได้ หาก Gateway ทำงานอยู่ที่อื่น ให้รัน node host บนเครื่องเบราว์เซอร์หรือใช้ remote CDP แทน

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - actions ขับเคลื่อนด้วย ref ไม่ใช่ CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับดาวน์โหลด และ batch actions ยังต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP แบบดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และ Memory

<AccordionGroup>
  <Accordion title="มีเอกสาร sandboxing โดยเฉพาะไหม?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway ทั้งตัวใน Docker หรือ sandbox images) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker รู้สึกว่าถูกจำกัด — ฉันจะเปิดใช้ฟีเจอร์เต็มได้อย่างไร?">
    image เริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันด้วยผู้ใช้ `node` ดังนั้นจึง
    ไม่มี system packages, Homebrew หรือ bundled browsers หากต้องการการตั้งค่าที่สมบูรณ์ขึ้น:

    - persist `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้ caches อยู่รอด
    - ฝัง system deps ลงใน image ด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่รวมมาให้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบว่าพาธนั้นถูก persist ไว้

    เอกสาร: [Docker](/th/install/docker), [Browser](/th/tools/browser)

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DMs เป็นส่วนตัว แต่ทำให้ groups เป็นสาธารณะ/มี sandbox ด้วยเอเจนต์ตัวเดียวได้ไหม?">
    ได้ — หากทราฟฟิกส่วนตัวของคุณเป็น **DMs** และทราฟฟิกสาธารณะของคุณเป็น **groups**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชัน group/channel (non-main keys) ทำงานใน sandbox backend ที่กำหนดไว้ ขณะที่เซสชัน DM หลักยังคงทำงานบนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกเอง จากนั้นจำกัดว่าเครื่องมือใดใช้ได้ในเซสชันที่มี sandbox ผ่าน `tools.sandbox.tools`

    ขั้นตอนการตั้งค่า + ตัวอย่างคอนฟิก: [Groups: DMs ส่วนตัว + groups สาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    เอกสารอ้างอิงคอนฟิกหลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) binds แบบ global + รายเอเจนต์จะถูก merge; binds รายเอเจนต์จะถูกละเลยเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งใดก็ตามที่มีความอ่อนไหว และจำไว้ว่าการ bind จะข้ามกำแพง filesystem ของ sandbox

    OpenClaw ตรวจสอบแหล่งที่มาของ bind ทั้งกับ path ที่ normalize แล้วและ path canonical ที่ resolve ผ่านบรรพบุรุษที่ลึกที่สุดที่มีอยู่จริง นั่นหมายความว่าการหนีออกผ่าน symlink-parent จะยัง fail closed แม้ส่วนสุดท้ายของ path ยังไม่มีอยู่จริง และการตรวจสอบ allowed-root จะยังมีผลหลังจาก resolve symlink แล้ว

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="Memory ทำงานอย่างไร?">
    Memory ของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของเอเจนต์:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **silent pre-compaction memory flush** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะทำงานเฉพาะเมื่อ workspace
    เขียนได้ (sandboxes แบบอ่านอย่างเดียวจะข้าม) ดู [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="Memory ลืมเรื่องต่าง ๆ ตลอด ฉันจะทำให้มันจำได้อย่างไร?">
    บอกบอตให้ **เขียนข้อเท็จจริงนั้นลงใน memory** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    ส่วนบริบทระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นพื้นที่ที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้เก็บความทรงจำจะช่วยได้;
    มันจะรู้ว่าควรทำอะไร หากมันยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในทุกการรัน

    เอกสาร: [Memory](/th/concepts/memory), [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="Memory อยู่ตลอดไปไหม? มีข้อจำกัดอะไรบ้าง?">
    ไฟล์ Memory อยู่บนดิสก์และจะคงอยู่จนกว่าคุณจะลบมัน ข้อจำกัดคือพื้นที่จัดเก็บของคุณ
    ไม่ใช่โมเดล อย่างไรก็ตาม **บริบทของเซสชัน** ยังถูกจำกัดด้วยหน้าต่าง context ของโมเดล
    ดังนั้นการสนทนาที่ยาวอาจถูก compact หรือ truncate ได้ นั่นจึงเป็นเหตุผลที่
    มี memory search — มันจะดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าสู่บริบท

    เอกสาร: [Memory](/th/concepts/memory), [Context](/th/concepts/context)

  </Accordion>

  <Accordion title="การค้นหา semantic memory ต้องใช้ OpenAI API key ไหม?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุม chat/completions และ
    **ไม่**ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การล็อกอินผ่าน Codex CLI)** ไม่ได้ช่วยสำหรับการค้นหา semantic memory OpenAI embeddings
    ยังคงต้องใช้ API key จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้กำหนดผู้ให้บริการอย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการให้อัตโนมัติเมื่อ
    สามารถ resolve API key ได้ (auth profiles, `models.providers.*.apiKey` หรือ env vars)
    ระบบจะให้ความสำคัญกับ OpenAI หาก resolve คีย์ OpenAI ได้ มิฉะนั้นจะใช้ Gemini หาก resolve คีย์ Gemini
    ได้ จากนั้นจึงเป็น Voyage แล้ว Mistral หากไม่มี remote key ให้ใช้
    memory search จะยังปิดใช้งานจนกว่าคุณจะกำหนดค่า หากคุณมีการกำหนดค่าเส้นทางโมเดลในเครื่อง
    และมีอยู่จริง OpenClaw
    จะให้ความสำคัญกับ `local` รองรับ Ollama เมื่อคุณตั้งค่า
    `memorySearch.provider = "ollama"` อย่างชัดเจน

    หากคุณอยากคงทุกอย่างไว้ในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และเลือก
    `memorySearch.fallback = "none"` ได้) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และให้ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embeddings ของ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [Memory](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ ถูกเก็บไว้ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ — **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้พวกมัน**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** sessions, memory files, config และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **ต้องอยู่ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปที่
      APIs ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความบน
      เซิร์ฟเวอร์ของพวกเขา
    - **คุณควบคุมขอบเขตได้:** การใช้โมเดลในเครื่องทำให้ prompts อยู่บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace), [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                       |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | OAuth import แบบ legacy (คัดลอกเข้า auth profiles เมื่อใช้ครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys และ `keyRef`/`tokenRef` แบบไม่บังคับ) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload ความลับแบบ file-backed สำหรับ `file` SecretRef providers   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ compatibility แบบ legacy (ล้างรายการ `api_key` แบบ static แล้ว) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะของผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)       |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะรายเอเจนต์ (agentDir + sessions)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติและสถานะการสนทนา (รายเอเจนต์)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | metadata ของเซสชัน (รายเอเจนต์)                                    |

    พาธแบบ legacy สำหรับเอเจนต์เดี่ยว: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, memory files, skills ฯลฯ) แยกต่างหาก และกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **workspace ของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **Workspace (รายเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, และ `HEARTBEAT.md` แบบไม่บังคับ
      root `memory.md` ตัวพิมพ์เล็กเป็นเพียงอินพุตสำหรับการซ่อมแซมแบบ legacy; `openclaw doctor --fix`
      สามารถ merge มันเข้า `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์อยู่
    - **State dir (`~/.openclaw`)**: config, สถานะของช่องทาง/ผู้ให้บริการ, auth profiles, sessions, logs,
      และ shared skills (`~/.openclaw/skills`)

    workspace เริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้ workspace เดียวกัน
    ทุกครั้งที่เปิด (และจำไว้ว่า: remote mode ใช้ **workspace ของโฮสต์ gateway**
    ไม่ใช่ของแล็ปท็อปในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือการตั้งค่าที่คงอยู่ ให้บอกบอตให้ **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace) และ [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์การสำรองข้อมูลที่แนะนำ">
    ให้นำ **workspace ของเอเจนต์** ของคุณไปไว้ใน repo git แบบ **private** และสำรองไว้ที่ใดสักแห่ง
    ที่เป็นส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บทั้ง memory + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "ความคิด" ของผู้ช่วยได้ในภายหลัง

    อย่า commit สิ่งใดภายใต้ `~/.openclaw` (credentials, sessions, tokens หรือ encrypted secrets payloads)
    หากคุณต้องการกู้คืนแบบเต็ม ให้สำรองทั้ง workspace และ state directory
    แยกกัน (ดูคำถามเรื่องการย้ายระบบด้านบน)

    เอกสาร: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะได้ที่: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์สามารถทำงานนอก workspace ได้ไหม?">
    ได้ workspace คือ **cwd เริ่มต้น** และจุดยึด memory ไม่ใช่ sandbox แบบบังคับ
    พาธแบบ relative จะ resolve ภายใน workspace แต่พาธแบบ absolute สามารถเข้าถึง
    ตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิด sandboxing หากคุณต้องการการแยกส่วน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox รายเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปยัง root ของ repo repo ของ OpenClaw เป็นเพียง source code; ควรแยก
    workspace ออกจากกัน เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

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

  <Accordion title="Remote mode: session store อยู่ที่ไหน?">
    สถานะของเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ใน remote mode session store ที่คุณสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานของคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกใช้รูปแบบอะไร? อยู่ที่ไหน?">
    OpenClaw อ่านคอนฟิก **JSON5** แบบไม่บังคับจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไรฟังอยู่ / UI บอกว่า unauthorized'>
    การ bind ที่ไม่ใช่ loopback **ต้องใช้เส้นทาง gateway auth ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - auth แบบ shared-secret: token หรือ password
    - `gateway.auth.mode: "trusted-proxy"` หลัง reverse proxy ที่รับรู้ตัวตนและกำหนดค่า non-loopback ถูกต้อง

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

    - `gateway.remote.token` / `.password` **ไม่ได้**เปิดใช้ local gateway auth ได้ด้วยตัวเอง
    - local call paths สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อยังไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ password auth ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดไว้อย่างชัดเจนผ่าน SecretRef และยัง resolve ไม่ได้ ระบบจะ fail closed (ไม่มี remote fallback มาบดบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ใน app/UI settings) โหมดที่มีตัวตนกำกับ เช่น Tailscale Serve หรือ `trusted-proxy` จะใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URLs
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback บนโฮสต์เดียวกันก็ยัง **ไม่**ถือว่าผ่าน trusted-proxy auth trusted proxy ต้องเป็นแหล่ง non-loopback ที่กำหนดค่าไว้

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้ token บน localhost ด้วย?">
    OpenClaw บังคับใช้ gateway auth เป็นค่าเริ่มต้น รวมถึง loopback ด้วย ในเส้นทางเริ่มต้นปกติ นั่นหมายถึง token auth: หากไม่ได้กำหนดเส้นทาง auth แบบ explicit การเริ่มต้น gateway จะ resolve ไปยัง token mode และสร้าง token ให้โดยอัตโนมัติพร้อมบันทึกลงใน `gateway.auth.token` ดังนั้น **local WS clients ต้องยืนยันตัวตน** วิธีนี้ใช้บล็อกโปรเซสภายในเครื่องอื่นไม่ให้เรียก Gateway

    หากคุณต้องการเส้นทาง auth แบบอื่น คุณสามารถเลือก password mode อย่างชัดเจนได้ (หรือสำหรับ reverse proxies แบบ non-loopback ที่รับรู้ตัวตน ใช้ `trusted-proxy`) หากคุณ **ต้องการ** loopback แบบเปิดจริง ๆ ให้ตั้ง `gateway.auth.mode: "none"` อย่างชัดเจนในคอนฟิก Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยนคอนฟิกไหม?">
    Gateway เฝ้าดูคอนฟิกและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): hot-apply การเปลี่ยนแปลงที่ปลอดภัย, รีสตาร์ตสำหรับการเปลี่ยนแปลงที่สำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ใน CLI ได้อย่างไร?">
    ตั้งค่า `cli.banner.taglineMode` ในคอนฟิก:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ/เวอร์ชันของแบนเนอร์ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้ web search (และ web fetch) ได้อย่างไร?">
    `web_fetch` ใช้งานได้โดยไม่ต้องมี API key ส่วน `web_search` ขึ้นอยู่กับผู้ให้บริการ
    ที่คุณเลือก:

    - ผู้ให้บริการแบบใช้ API เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องตั้งค่า API key ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการเชื่อมต่อแบบ HTML ที่ไม่เป็นทางการ
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เอง; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** รัน `openclaw configure --section web` แล้วเลือกผู้ให้บริการ
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

    คอนฟิก web-search แบบเจาะจงผู้ให้บริการตอนนี้อยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทางผู้ให้บริการแบบ legacy ใน `tools.web.search.*` ยังถูกโหลดชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้สำหรับคอนฟิกใหม่
    คอนฟิก fallback ของ Firecrawl web-fetch อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlists ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้เป็นค่าเริ่มต้น (เว้นแต่จะปิดใช้อย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะ auto-detect ผู้ให้บริการ fetch fallback ตัวแรกที่พร้อมใช้งานจาก credentials ที่มีอยู่ ปัจจุบันผู้ให้บริการที่รวมมาให้คือ Firecrawl
    - Daemons อ่าน env vars จาก `~/.openclaw/.env` (หรือ service environment)

    เอกสาร: [Web tools](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างคอนฟิกของฉัน ฉันจะกู้คืนและป้องกันอย่างไร?">
    `config.apply` จะแทนที่ **คอนฟิกทั้งหมด** หากคุณส่ง object แบบบางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจได้หลายกรณี:

    - การเขียนคอนฟิกที่ OpenClaw เป็นเจ้าของจะตรวจสอบคอนฟิกเต็มหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนแบบทำลายข้อมูลหรือไม่ถูกต้องที่ OpenClaw เป็นเจ้าของจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload พัง Gateway จะกู้คืนคอนฟิกที่ใช้งานได้ล่าสุดและบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`
    - เอเจนต์หลักจะได้รับคำเตือนตอนบูตหลังการกู้คืน เพื่อไม่ให้เขียนคอนฟิกที่เสียซ้ำแบบไม่รู้ตัว

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Config auto-restored from last-known-good`, `Config write rejected:` หรือ `config reload restored last-known-good config`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้างคอนฟิกที่ active
    - คงคอนฟิกที่กู้คืนแล้วไว้หากใช้งานได้ จากนั้นคัดลอกกลับเฉพาะคีย์ที่ตั้งใจไว้ด้วย `openclaw config set` หรือ `config.patch`
    - รัน `openclaw config validate` และ `openclaw doctor`
    - หากไม่มีทั้ง last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากแบ็กอัป หรือรัน `openclaw doctor` ใหม่แล้วกำหนดค่า channels/models อีกครั้ง
    - หากเป็นสิ่งที่ไม่คาดคิด ให้รายงานบั๊กและแนบคอนฟิกล่าสุดที่ใช้งานได้หรือแบ็กอัปใด ๆ
    - เอเจนต์เขียนโค้ดในเครื่องมักสามารถสร้างคอนฟิกที่ใช้งานได้ใหม่จาก logs หรือประวัติได้

    ป้องกัน:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path หรือรูปแบบของฟิลด์ มันจะคืน shallow schema node พร้อมสรุปลูกโดยตรงสำหรับการเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC แบบบางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่คอนฟิกทั้งหมดเท่านั้น
    - หากคุณกำลังใช้เครื่องมือ runtime `gateway` แบบ owner-only จากการรันเอเจนต์ มันจะยังปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง aliases แบบ legacy `tools.bash.*` ที่ normalize ไปยัง protected exec paths เดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางร่วมกับ workers เฉพาะทางข้ามหลายอุปกรณ์ได้อย่างไร?">
    รูปแบบที่พบบ่อยคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) บวกกับ **nodes** และ **agents**:

    - **Gateway (ศูนย์กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agents (workers):** brains/workspaces แยกสำหรับบทบาทเฉพาะ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงานเบื้องหลังจากเอเจนต์หลักเมื่อคุณต้องการความขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="OpenClaw browser รันแบบ headless ได้ไหม?">
    ได้ เป็นตัวเลือกในคอนฟิก:

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

    ค่าเริ่มต้นคือ `false` (มีหน้าต่าง) แบบ headless มีแนวโน้มจะกระตุ้นการตรวจจับ anti-bot บนบางเว็บไซต์มากกว่า ดู [Browser](/th/tools/browser)

    โหมด headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับระบบอัตโนมัติส่วนใหญ่ (ฟอร์ม การคลิก การดึงข้อมูล การล็อกอิน) ความต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ให้เห็น (ใช้ภาพหน้าจอหากคุณต้องการภาพประกอบ)
    - บางเว็บไซต์เข้มงวดกับระบบอัตโนมัติในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อกเซสชันแบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร?">
    ตั้งค่า `browser.executablePath` ให้ชี้ไปยัง binary ของ Brave (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวอื่น) แล้วรีสตาร์ต Gateway
    ดูตัวอย่างคอนฟิกแบบเต็มได้ที่ [Browser](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateways ระยะไกลและ nodes

<AccordionGroup>
  <Accordion title="คำสั่งถูกส่งต่อกันอย่างไรระหว่าง Telegram, gateway และ nodes?">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรันเอเจนต์และ
    เรียก nodes ผ่าน **Gateway WebSocket** เฉพาะเมื่อจำเป็นต้องใช้เครื่องมือของ node เท่านั้น:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes จะไม่เห็นทราฟฟิกผู้ให้บริการขาเข้า; พวกมันจะรับเฉพาะการเรียก node RPC เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไร หาก Gateway โฮสต์อยู่ระยะไกล?">
    คำตอบสั้น ๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่องของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/โฮมเซิร์ฟเวอร์)
    2. นำโฮสต์ Gateway + คอมพิวเตอร์ของคุณเข้า tailnet เดียวกัน
    3. ตรวจสอบให้แน่ใจว่าสามารถเข้าถึง Gateway WS ได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้มันลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่ต้องใช้ TCP bridge แยกต่างหาก; nodes เชื่อมต่อผ่าน Gateway WebSocket

    ข้อเตือนด้านความปลอดภัย: การจับคู่ macOS node อนุญาตให้รัน `system.run` บนเครื่องนั้นได้
    จับคู่เฉพาะอุปกรณ์ที่คุณเชื่อถือ และตรวจสอบ [Security](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกลบน macOS](/th/platforms/mac/remote), [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับคำตอบเลย ต้องทำอย่างไรต่อ?">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังทำงานอยู่: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของช่องทาง: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ให้ตรวจสอบว่าตั้งค่า `gateway.auth.allowTailscale` ถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า local tunnel ทำงานอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือกลุ่ม) รวมบัญชีของคุณไว้แล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels)

  </Accordion>

  <Accordion title="OpenClaw สองอินสแตนซ์คุยกันเองได้ไหม (local + VPS)?">
    ได้ ไม่มี bridge แบบ "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้หลายวิธี
    ที่เชื่อถือได้:

    **ง่ายที่สุด:** ใช้ช่องทางแชตปกติที่บอตทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกฝั่งด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายไปยังแชตที่อีกบอต
    กำลังฟังอยู่ หากบอตตัวใดตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปที่ Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอตทั้งสองวนลูปตอบกันไม่รู้จบ (กำหนดให้ตอบเฉพาะเมื่อ mention, ใช้ channel
    allowlists หรือกฎ "ไม่ต้องตอบข้อความจากบอต")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์ไหม?">
    ไม่จำเป็น Gateway หนึ่งตัวสามารถโฮสต์หลายเอเจนต์ได้ โดยแต่ละตัวมี workspace, model defaults
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติ และถูกกว่า/ง่ายกว่ามากเมื่อเทียบกับการรัน
    VPS หนึ่งตัวต่อหนึ่งเอเจนต์

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการ hard isolation (ขอบเขตด้านความปลอดภัย) หรือ
    คอนฟิกที่แตกต่างกันมากจนคุณไม่ต้องการให้ใช้ร่วมกัน นอกเหนือจากนั้น ให้ใช้ Gateway เดียวและ
    ใช้หลายเอเจนต์หรือ sub-agents

  </Accordion>

  <Accordion title="มีประโยชน์ไหมที่จะใช้ node บนแล็ปท็อปส่วนตัวของฉัน แทนการใช้ SSH จาก VPS?">
    มี — nodes คือวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และมัน
    เปิดได้มากกว่าการเข้าถึงเชลล์ Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    มีน้ำหนักเบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าที่พบบ่อย
    คือโฮสต์ที่เปิดตลอดเวลาบวกกับแล็ปท็อปของคุณที่เป็น node

    - **ไม่ต้องใช้ inbound SSH** nodes เชื่อมต่อออกไปยัง Gateway WebSocket และใช้ device pairing
    - **การควบคุมการรันที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlists/approvals ของ node บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** nodes เปิดเผย `canvas`, `camera` และ `screen` เพิ่มเติมจาก `system.run`
    - **ระบบอัตโนมัติบนเบราว์เซอร์ในเครื่อง** คง Gateway ไว้บน VPS แต่รัน Chrome ในเครื่องผ่าน node host บนแล็ปท็อป หรือเชื่อมต่อกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH ใช้ได้ดีสำหรับการเข้าถึงเชลล์แบบ ad-hoc แต่ nodes เรียบง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ระยะยาวและ
    ระบบอัตโนมัติของอุปกรณ์

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [Browser](/th/tools/browser)

  </Accordion>

  <Accordion title="nodes รันเป็น gateway service หรือไม่?">
    ไม่ ควรมี **gateway เพียงหนึ่งตัว** ต่อหนึ่งโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [Multiple gateways](/th/gateway/multiple-gateways)) nodes เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (iOS/Android nodes หรือ "node mode" บน macOS ในแอป menubar) สำหรับ headless node
    hosts และการควบคุมผ่าน CLI ดู [Node host CLI](/th/cli/node)

    ต้องรีสตาร์ตเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery` และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี apply config ผ่าน API / RPC ไหม?">
    มี

    - `config.schema.lookup`: ตรวจสอบ config subtree หนึ่งส่วนพร้อม shallow schema node, UI hint ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: การอัปเดตบางส่วนที่ปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่คอนฟิกทั้งหมด; hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` แบบ owner-only ยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; aliases แบบ legacy `tools.bash.*` จะ normalize ไปยัง protected exec paths เดียวกัน

  </Accordion>

  <Accordion title="คอนฟิกขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    สิ่งนี้จะตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถทริกเกอร์บอตได้

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Tailscale บน VPS และเชื่อมต่อจาก Mac ได้อย่างไร?">
    ขั้นตอนขั้นต่ำ:

    1. **ติดตั้ง + ล็อกอินบน VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ติดตั้ง + ล็อกอินบน Mac**
       - ใช้แอป Tailscale และลงชื่อเข้าใช้ tailnet เดียวกัน
    3. **เปิดใช้ MagicDNS (แนะนำ)**
       - ในคอนโซลผู้ดูแล Tailscale ให้เปิด MagicDNS เพื่อให้ VPS มีชื่อที่คงที่
    4. **ใช้ hostname ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้จะคงการ bind ของ gateway ไว้ที่ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Mac node กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve จะเปิดเผย **Gateway Control UI + WS** nodes จะเชื่อมต่อผ่าน Gateway WS endpoint เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH สามารถเป็น tailnet hostname ได้)
       แอปจะ tunnel พอร์ตของ Gateway และเชื่อมต่อเป็น node
    3. **อนุมัติ node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมดระยะไกลบน macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สอง หรือแค่เพิ่ม node?">
    หากคุณต้องการเพียง **เครื่องมือภายในเครื่อง** (screen/camera/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มมันเป็น
    **node** วิธีนี้จะคง Gateway เพียงตัวเดียวและหลีกเลี่ยงคอนฟิกซ้ำซ้อน ปัจจุบันเครื่องมือ node ภายในเครื่อง
    รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **hard isolation** หรือบอตที่แยกจากกันโดยสมบูรณ์สองตัว

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [Multiple gateways](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อมและการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่าน env vars จาก parent process (shell, launchd/systemd, CI ฯลฯ) และยังโหลดเพิ่มเติมจาก:

    - `.env` จาก current working directory
    - `.env` แบบ global fallback จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไม่มีไฟล์ `.env` ใดเขียนทับ env vars ที่มีอยู่เดิม

    คุณยังสามารถกำหนด inline env vars ในคอนฟิกได้ (จะมีผลเฉพาะเมื่อไม่มีใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env vars หายไป ต้องทำอย่างไร?">
    มีสองวิธีแก้ทั่วไป:

    1. ใส่คีย์ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกโหลดแม้ service จะไม่สืบทอด shell env ของคุณ
    2. เปิดใช้ shell import (ความสะดวกแบบ opt-in):

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

    วิธีนี้จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดว่าจะขาดหาย (ไม่เขียนทับเด็ดขาด) env var ที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่ models status แสดง "Shell env: off." ทำไม?'>
    `openclaw models status` รายงานว่าเปิดใช้ **shell env import** หรือไม่ "Shell env: off"
    **ไม่ได้**หมายความว่า env vars ของคุณหายไป — แค่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) มันจะไม่สืบทอด shell
    environment ของคุณ แก้ได้ด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้ shell import (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ของคอนฟิก (จะมีผลเฉพาะเมื่อไม่มีอยู่)

    จากนั้นรีสตาร์ต gateway แล้วตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    Copilot tokens ถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN` ด้วย)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตอัตโนมัติไหม หากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลัง `session.idleMinutes` ได้ แต่สิ่งนี้ **ปิดอยู่เป็นค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อว่าง เมื่อเปิดใช้แล้ว ข้อความ
    ถัดไปหลังช่วงเวลาว่างจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    สิ่งนี้ไม่ลบ transcripts — แค่เริ่มเซสชันใหม่เท่านั้น

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีทำทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งตัวและเอเจนต์หลายตัว) ไหม?">
    มี ผ่าน **การกำหนดเส้นทางหลายเอเจนต์** และ **sub-agents** คุณสามารถสร้างเอเจนต์ผู้ประสานงานหนึ่งตัว
    และเอเจนต์คนงานหลายตัวพร้อม workspaces และโมเดลของตนเอง

    อย่างไรก็ตาม ควรมองว่านี่เป็น **การทดลองที่สนุก** มันใช้โทเค็นมากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตตัวเดียวกับหลายเซสชัน โมเดลทั่วไปที่เรา
    จินตนาการคือบอตหนึ่งตัวที่คุณคุยด้วย โดยมีเซสชันต่าง ๆ สำหรับงานขนาน บอตตัวนั้น
    ยังสามารถสร้าง sub-agents เมื่อจำเป็นได้ด้วย

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [Agents CLI](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไมบริบทถูกตัดทอนกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    บริบทของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตยาว เอาต์พุตเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    สามารถทริกเกอร์ Compaction หรือการตัดทอนได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อต้องสลับหัวข้อ
    - เก็บบริบทสำคัญไว้ใน workspace แล้วขอให้บอตอ่านกลับมา
    - ใช้ sub-agents สำหรับงานยาวหรืองานขนานเพื่อให้แชตหลักมีขนาดเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้น หากสิ่งนี้เกิดขึ้นบ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    รีเซ็ตเต็มแบบไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรัน setup ใหม่:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังมีตัวเลือก **Reset** หากตรวจพบคอนฟิกเดิม ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ตแต่ละ state dir (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง dev config + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" — ฉันจะรีเซ็ตหรือ compact อย่างไร?'>
    ใช้หนึ่งในวิธีต่อไปนี้:

    - **Compact** (เก็บบทสนทนาไว้แต่สรุป turns เก่า):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อชี้นำการสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากเกิดขึ้นบ่อย:

    - เปิดใช้หรือปรับ **session pruning** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตเครื่องมือเก่า
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาด validation ของผู้ให้บริการ: โมเดลปล่อยบล็อก `tool_use` ออกมาโดยไม่มี
    `input` ที่จำเป็น โดยปกติมักหมายความว่าประวัติของเซสชันเก่าหรือเสียหาย (มักเกิดหลังเธรดยาว
    หรือการเปลี่ยนแปลงเครื่องมือ/สคีมา)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (เป็นข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat จะทำงานทุก **30 นาที** โดยค่าเริ่มต้น (**1 ชั่วโมง** เมื่อใช้ OAuth auth) ปรับหรือปิดได้:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // หรือ "0m" เพื่อปิด
          },
        },
      },
    }
    ```

    หากมี `HEARTBEAT.md` แต่เนื้อหาว่างเปล่าในทางปฏิบัติ (มีเพียงบรรทัดว่างและ markdown
    headers เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัด API calls
    หากไม่มีไฟล์นี้ Heartbeat ก็ยังคงทำงาน และโมเดลจะเป็นผู้ตัดสินใจว่าควรทำอะไร

    การ override รายเอเจนต์ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอต" ลงในกลุ่ม WhatsApp ไหม?'>
    ไม่ OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็จะมองเห็นได้
    โดยค่าเริ่มต้น การตอบในกลุ่มจะถูกบล็อกไว้จนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่ทริกเกอร์การตอบในกลุ่มได้:

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

  <Accordion title="ฉันจะดู JID ของกลุ่ม WhatsApp ได้อย่างไร?">
    ตัวเลือก 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือก 2 (หากกำหนดค่า/allowlist ไว้แล้ว): แสดงรายการ groups จากคอนฟิก:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบในกลุ่ม?">
    มีสองสาเหตุที่พบบ่อย:

    - mention gating เปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนด `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="groups/threads ใช้บริบรทร่วมกับ DMs หรือไม่?">
    แชตตรงจะ collapse ไปยังเซสชันหลักโดยค่าเริ่มต้น ส่วน groups/channels มี session keys ของตัวเอง และ topics ของ Telegram / threads ของ Discord เป็นเซสชันแยกต่างหาก ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspaces และ agents ได้กี่ตัว?">
    ไม่มีขีดจำกัดตายตัว หลายสิบตัว (หรือแม้แต่หลายร้อยตัว) ก็ใช้ได้ แต่ให้ระวัง:

    - **ดิสก์โตขึ้น:** sessions + transcripts อยู่ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ต้นทุนโทเค็น:** เอเจนต์มากขึ้นหมายถึงการใช้โมเดลพร้อมกันมากขึ้น
    - **ภาระงานปฏิบัติการ:** auth profiles, workspaces และ channel routing รายเอเจนต์

    เคล็ดลับ:

    - ให้มี workspace ที่ **active** หนึ่งรายการต่อหนึ่งเอเจนต์ (`agents.defaults.workspace`)
    - ล้างเซสชันเก่า (ลบ JSONL หรือ store entries) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา stray workspaces และ profile mismatches

  </Accordion>

  <Accordion title="ฉันสามารถรันหลายบอตหรือหลายแชตพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันหลายเอเจนต์แบบแยกส่วนและกำหนดเส้นทางข้อความขาเข้าตาม
    channel/account/peer รองรับ Slack เป็นช่องทางและสามารถผูกกับเอเจนต์ที่ระบุได้

    การเข้าถึงเบราว์เซอร์มีพลัง แต่ไม่ใช่แบบ "ทำได้ทุกอย่างเหมือนมนุษย์" — anti-bot, CAPTCHAs และ MFA
    ยังสามารถบล็อกระบบอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าที่เป็นแนวปฏิบัติที่ดี:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (bindings)
    - Slack channel(s) ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [Browser](/th/tools/browser), [Nodes](/th/nodes)

  </Accordion>
</AccordionGroup>

## Models, failover และ auth profiles

Q&A เกี่ยวกับโมเดล — ค่าเริ่มต้น การเลือก aliases การสลับ failover auth profiles —
อยู่ที่ [คำถามที่พบบ่อยเกี่ยวกับ Models](/th/help/faq-models)

## Gateway: พอร์ต, "already running" และ remote mode

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตอะไร?">
    `gateway.port` ควบคุมพอร์ต multiplexed เดียวสำหรับ WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > ค่าเริ่มต้น 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status ถึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือ CLI ที่กำลังเชื่อมต่อกับ gateway WebSocket จริง ๆ

    ใช้ `openclaw gateway status` และเชื่อบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่บนพอร์ตจริง)
    - `Last gateway error:` (ต้นเหตุที่พบบ่อยเมื่อโปรเซสยังมีชีวิตอยู่แต่พอร์ตไม่ได้ listening)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่งไฟล์ ขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็นปัญหา `--profile` / `OPENCLAW_STATE_DIR` ไม่ตรงกัน)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    ให้รันจาก `--profile` / environment เดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายถึงอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดย bind ตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หาก bind ล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` เพื่อระบุว่ามีอินสแตนซ์อื่นกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อีกตัว ปล่อยพอร์ต หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ใน remote mode (ไคลเอนต์เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น) ได้อย่างไร?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง remote WebSocket URL พร้อม remote credentials แบบ shared-secret ได้ตามต้องการ:

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

    - `openclaw gateway` จะเริ่มทำงานเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่ง override flag)
    - แอป macOS เฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นเพียง remote credentials ฝั่งไคลเอนต์; ไม่ได้เปิดใช้ local gateway auth ด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือ reconnect อยู่ตลอด) ต้องทำอย่างไร?'>
    เส้นทาง gateway auth ของคุณและวิธี auth ของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บ token ไว้ใน `sessionStorage` สำหรับ browser tab session ปัจจุบันและ gateway URL ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมยังทำงานได้โดยไม่ต้องกลับไปใช้การเก็บ token ระยะยาวใน localStorage
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย cached device token เมื่อ gateway ส่ง retry hints กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การ retry ด้วย cached-token นั้นตอนนี้จะนำ approved scopes ที่เก็บไว้พร้อม device token กลับมาใช้ด้วย ผู้เรียกที่ส่ง `deviceToken` แบบ explicit / `scopes` แบบ explicit จะยังคงชุด scope ที่ร้องขอเองไว้ แทนที่จะสืบทอด cached scopes
    - นอกเหนือจากเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ explicit shared token/password ก่อน จากนั้น explicit `deviceToken`, จากนั้น stored device token, จากนั้น bootstrap token
    - การตรวจสอบ scope ของ bootstrap จะอิง prefix ของ role bootstrap operator allowlist ในตัวจะตอบสนองได้เฉพาะคำขอของ operator; node หรือ roles อื่นที่ไม่ใช่ operator ยังคงต้องใช้ scopes ภายใต้ prefix ของ role ของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก dashboard URL และพยายามเปิด; แสดง SSH hint หากเป็น headless)
    - หากคุณยังไม่มี token: `openclaw doctor --generate-gateway-token`
    - หากเป็น remote ให้ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แล้ววาง secret ที่ตรงกันใน settings ของ Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิด `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด Serve URL ไม่ใช่ raw loopback/tailnet URL ที่ข้าม Tailscale identity headers
    - โหมด trusted-proxy: ตรวจสอบว่าคุณกำลังเข้าผ่าน non-loopback identity-aware proxy ที่กำหนดค่าไว้ ไม่ใช่ proxy แบบ loopback บนโฮสต์เดียวกันหรือ raw gateway URL
    - หากยัง mismatch หลังจาก retry หนึ่งครั้ง ให้หมุนเวียน/อนุมัติ paired device token ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองอย่าง:
      - paired-device sessions สามารถ rotate ได้เฉพาะอุปกรณ์ของ**ตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` แบบ explicit ต้องไม่เกิน operator scopes ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือ? รัน `openclaw status --all` แล้วทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [Dashboard](/th/web/dashboard) สำหรับรายละเอียด auth

  </Accordion>

  <Accordion title="ฉันตั้ง gateway.bind เป็น tailnet แล้ว bind ไม่ได้และไม่มีอะไรฟังอยู่">
    `tailnet` bind จะเลือก Tailscale IP จาก network interfaces ของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรือ interface down) ก็จะไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - สลับเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นแบบ explicit ส่วน `auto` จะให้ความสำคัญกับ loopback; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind แบบ tailnet-only

  </Accordion>

  <Accordion title="ฉันสามารถรันหลาย Gateways บนโฮสต์เดียวกันได้ไหม?">
    โดยทั่วไปไม่ควร — Gateway หนึ่งตัวสามารถรันหลายช่องทางการส่งข้อความและหลายเอเจนต์ได้ ใช้หลาย Gateways เฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น rescue bot) หรือ hard isolation

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าแบบรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่อหนึ่งอินสแตนซ์ (จะสร้าง `~/.openclaw-<name>` ให้อัตโนมัติ)
    - ตั้ง `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละ profile (หรือส่ง `--port` สำหรับการรันด้วยมือ)
    - ติดตั้ง service ต่อหนึ่ง profile: `openclaw --profile <name> gateway install`

    Profiles ยังใส่ suffix ให้ชื่อ service ด้วย (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Multiple gateways](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายถึงอะไร?'>
    Gateway คือ **WebSocket server** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับอย่างอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (policy violation)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL แบบ **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ WS client
    - คุณใช้พอร์ตหรือ path ผิด
    - พร็อกซีหรือ tunnel ลบ auth headers หรือส่งคำขอที่ไม่ใช่ของ Gateway

    วิธีแก้อย่างรวดเร็ว:

    1. ใช้ WS URL: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิด auth ให้รวม token/password ไว้ในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

  </Accordion>
</AccordionGroup>

## Logging และการดีบัก

<AccordionGroup>
  <Accordion title="ล็อกอยู่ที่ไหน?">
    file logs (มีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้ง stable path ได้ผ่าน `logging.file` ระดับ file log ถูกควบคุมโดย `logging.level` ส่วน console verbosity ถูกควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail log ที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    service/supervisor logs (เมื่อ gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; profiles ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลเพิ่มเติม

  </Accordion>

  <Accordion title="ฉันจะ start/stop/restart Gateway service ได้อย่างไร?">
    ใช้ตัวช่วยของ gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยมือ `openclaw gateway --force` สามารถ reclaim พอร์ตได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว — จะรีสตาร์ต OpenClaw อย่างไร?">
    มี **สองโหมดการติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ภายใน Linux

    เปิด PowerShell, เข้า WSL, แล้วรีสตาร์ต:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณยังไม่เคยติดตั้ง service ให้เริ่มในโหมด foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (ไม่แนะนำ):** Gateway รันโดยตรงใน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยมือ (ไม่มี service) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือปฏิบัติการ Gateway service](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานอยู่แต่คำตอบไม่มาถึงเลย ฉันควรตรวจสอบอะไร?">
    เริ่มจากตรวจสุขภาพแบบเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - model auth ไม่ได้ถูกโหลดบน **โฮสต์ gateway** (ตรวจสอบ `models status`)
    - pairing/allowlist ของช่องทางบล็อกคำตอบ (ตรวจคอนฟิกช่องทาง + logs)
    - WebChat/Dashboard เปิดอยู่โดยไม่มี token ที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่า tunnel/Tailscale เชื่อมต่ออยู่ และ
    สามารถเข้าถึง Gateway WebSocket ได้

    เอกสาร: [Channels](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway สุขภาพดีหรือไม่? `openclaw status`
    3. UI มี token ที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากเป็น remote, tunnel/Tailscale link ใช้งานอยู่หรือไม่?

    จากนั้น tail logs:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ฉันควรตรวจสอบอะไร?">
    เริ่มจาก logs และสถานะของช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่กับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ได้ตัดให้เหลือภายในขีดจำกัดของ Telegram และ retry ด้วยคำสั่งที่น้อยลงแล้ว แต่บางรายการในเมนูยังคงต้องถูกตัดออก ลด plugin/skill/custom commands หรือปิด `channels.telegram.commands.native` หากคุณไม่จำเป็นต้องใช้เมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายลักษณะคล้ายกัน: หากคุณอยู่บน VPS หรือหลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออก และ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ให้แน่ใจว่าคุณกำลังดู logs บนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ฉันควรตรวจสอบอะไร?">
    ก่อนอื่นให้ยืนยันว่าเข้าถึง Gateway ได้และเอเจนต์สามารถรันได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดหวังคำตอบในช่องทางแชต
    ให้ตรวจสอบว่าเปิดใช้การส่งมอบแล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    หากคุณติดตั้ง service ไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    สิ่งนี้จะหยุด/เริ่ม **supervised service** (launchd บน macOS, systemd บน Linux)
    ใช้สิ่งนี้เมื่อ Gateway รันอยู่เบื้องหลังในฐานะ daemon

    หากคุณกำลังรันใน foreground ให้หยุดด้วย Ctrl-C จากนั้น:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติการ Gateway service](/th/gateway)

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้ง service แล้ว ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการการรันแบบครั้งเดียวใน foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการได้รายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อให้ได้รายละเอียดบนคอนโซลมากขึ้น จากนั้นตรวจสอบไฟล์ล็อกสำหรับ channel auth, model routing และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่งออกไป">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่คนละบรรทัดเดี่ยว) ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ถูกบล็อกด้วย allowlists
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดสูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จะจำกัดการส่งแบบ local-path ให้อยู่เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบ sandbox แล้ว
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ภายในเครื่องที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและเอกสารประเภทที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความธรรมดาและไฟล์ที่มีลักษณะเป็นความลับยังคงถูกบล็อก

    ดู [Images](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="ปลอดภัยไหมที่จะเปิด OpenClaw ให้รับ DMs ขาเข้า?">
    ให้ถือว่า DMs ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **pairing**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; บอตจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อหนึ่งช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มา
    - การเปิด DMs สู่สาธารณะต้อง opt-in อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="Prompt injection เป็นปัญหาเฉพาะสำหรับบอตสาธารณะหรือไม่?">
    ไม่ Prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครส่ง DM ให้บอตได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (web search/fetch, หน้าเบราว์เซอร์, อีเมล,
    เอกสาร, ไฟล์แนบ, logs ที่วางเข้ามา) เนื้อหานั้นก็สามารถมีคำสั่งที่พยายาม
    จี้โมเดลได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว** ก็ตาม

    ความเสี่ยงที่ใหญ่ที่สุดเกิดขึ้นเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ดึงบริบทออกไปหรือเรียกเครื่องมือแทนคุณ ลดขอบเขตความเสียหายโดย:

    - ใช้เอเจนต์ "reader" แบบอ่านอย่างเดียวหรือปิดเครื่องมือไว้เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความที่ถอดรหัสจากไฟล์/เอกสารเป็นสิ่งที่ไม่น่าเชื่อถือด้วย: OpenResponses
      `input_file` และการสกัดข้อมูลจาก media-attachment ทั้งคู่จะห่อข้อความที่สกัดได้ไว้ใน
      boundary markers ของเนื้อหาภายนอกอย่างชัดเจน แทนการส่งข้อความไฟล์ดิบ
    - ใช้ sandboxing และ strict tool allowlists

    รายละเอียด: [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควรมีสำหรับการตั้งค่าส่วนใหญ่ การแยกบอตออกด้วยบัญชีและหมายเลขโทรศัพท์แยกต่างหาก
    จะลดขอบเขตความเสียหายหากมีบางอย่างผิดพลาด และยังทำให้ง่ายต่อการหมุนเวียน
    credentials หรือเพิกถอนการเข้าถึงโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็ก ๆ ให้สิทธิ์เฉพาะกับเครื่องมือและบัญชีที่คุณต้องการใช้จริง และค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [Security](/th/gateway/security), [Pairing](/th/channels/pairing)

  </Accordion>

  <Accordion title="ฉันให้มันมีอิสระในการจัดการข้อความส่วนตัวของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่แนะนำ** ให้มีอิสระเต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - คง DMs ไว้ใน **pairing mode** หรือ allowlist ที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างก่อน แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกให้ชัดเจน ดู
    [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="ฉันสามารถใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม?">
    ได้ **ถ้า** เอเจนต์เป็นแบบ chat-only และอินพุตเชื่อถือได้ รุ่นที่เล็กกว่ามี
    ความไวต่อการถูกจี้ด้วยคำสั่งมากกว่า ดังนั้นควรหลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่อต้องอ่านเนื้อหาที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลขนาดเล็ก ให้ล็อกเครื่องมือ
    และรันภายใน sandbox ดู [Security](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัส pairing">
    รหัส pairing จะถูกส่ง **เฉพาะเมื่อ** ผู้ส่งที่ไม่รู้จักส่งข้อความหาบอต และ
    เปิดใช้ `dmPolicy: "pairing"` การส่ง `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้ใส่ sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? การ pairing ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **pairing** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัส pairing และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะแชตที่ได้รับข้อความเข้ามา หรือการส่งแบบ explicit ที่คุณสั่งเท่านั้น

    อนุมัติ pairing ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    prompt ขอหมายเลขโทรศัพท์ใน wizard: ใช้เพื่อตั้งค่า **allowlist/owner** ของคุณ เพื่อให้ DMs ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิด `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความของเครื่องมือส่วนใหญ่จะปรากฏเฉพาะเมื่อเปิด **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    วิธีแก้ในแชตที่คุณเห็นปัญหา:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงดังอยู่ ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้ง verbose
    เป็น **inherit** และยืนยันด้วยว่าคุณไม่ได้ใช้ bot profile ที่ตั้ง `verboseDefault`
    เป็น `on` ในคอนฟิก

    เอกสาร: [Thinking and verbose](/th/tools/thinking), [Security](/th/gateway/security#reasoning-verbose-output-in-groups)

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันอยู่ได้อย่างไร?">
    ส่งอย่างใดอย่างหนึ่งต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่ต้องมี slash):

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

    สิ่งเหล่านี้คือ triggers สำหรับ abort (ไม่ใช่ slash commands)

    สำหรับโปรเซสเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวม slash commands: ดู [Slash commands](/th/tools/slash-commands)

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ shortcuts บางตัว (เช่น `/status`) ก็ใช้ inline ได้สำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** เป็นค่าเริ่มต้น หากการเรียกใช้เครื่องมือถูกผูก
    กับ Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้ cross-provider messaging สำหรับเอเจนต์:

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

    รีสตาร์ต gateway หลังจากแก้ไขคอนฟิก

  </Accordion>

  <Accordion title='ทำไมถึงรู้สึกเหมือนบอต "เมิน" ข้อความที่ส่งรัว ๆ?'>
    queue mode ควบคุมว่าข้อความใหม่จะโต้ตอบกับการรันที่กำลังดำเนินอยู่แบบใด ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - ข้อความใหม่เปลี่ยนทิศทางงานปัจจุบัน
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความแล้วตอบครั้งเดียว (ค่าเริ่มต้น)
    - `steer-backlog` - steer ตอนนี้ แล้วประมวลผล backlog ต่อ
    - `interrupt` - ยกเลิกการรันปัจจุบันและเริ่มใหม่

    คุณสามารถเพิ่มตัวเลือกเช่น `debounce:2s cap:25 drop:summarize` สำหรับโหมด followup

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นของ Anthropic เมื่อใช้ API key คืออะไร?'>
    ใน OpenClaw credentials และการเลือกโมเดลเป็นคนละเรื่องกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการเก็บ Anthropic API key ไว้ใน auth profiles) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริง ๆ คือสิ่งที่คุณกำหนดไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` นั่นหมายความว่า Gateway หา Anthropic credentials ไม่พบใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังรันอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดอยู่หรือ? ถามได้ใน [Discord](https://discord.com/invite/clawd) หรือเปิด [GitHub discussion](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการรันครั้งแรก](/th/help/faq-first-run) — การติดตั้ง onboard auth subscriptions ความล้มเหลวช่วงต้น
- [คำถามที่พบบ่อยเกี่ยวกับ Models](/th/help/faq-models) — การเลือกโมเดล failover auth profiles
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาแบบเริ่มจากอาการ
