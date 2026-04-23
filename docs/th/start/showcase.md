---
description: Real-world OpenClaw projects from the community
read_when:
    - กำลังมองหาตัวอย่างการใช้งาน OpenClaw จริง to=final
    - การอัปเดตไฮไลต์โปรเจกต์จากชุมชน to=final
summary: โปรเจกต์และการผสานรวมที่สร้างโดยชุมชนซึ่งขับเคลื่อนด้วย OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-23T05:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# Showcase

<div className="showcase-hero">
  <p className="showcase-kicker">สร้างขึ้นในแชต เทอร์มินัล เบราว์เซอร์ และห้องนั่งเล่น</p>
  <p className="showcase-lead">
    โปรเจกต์ OpenClaw ไม่ใช่เดโมเล่น ๆ ผู้คนกำลังปล่อยลูปรีวิว PR, แอปมือถือ, ระบบอัตโนมัติในบ้าน,
    ระบบเสียง, devtools และเวิร์กโฟลว์ที่ใช้หน่วยความจำหนักจากช่องทางที่พวกเขาใช้อยู่แล้ว
  </p>
  <div className="showcase-actions">
    <a href="#videos">ดูเดโม</a>
    <a href="#fresh-from-discord">ดูโปรเจกต์</a>
    <a href="https://discord.gg/clawd">แชร์ของคุณ</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>การสร้างแบบเนทีฟในแชต</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, web chat และเวิร์กโฟลว์ที่เน้นเทอร์มินัลเป็นหลัก</span>
    </div>
    <div className="showcase-highlight">
      <strong>ระบบอัตโนมัติจริง</strong>
      <span>การจอง การช้อปปิ้ง การซัพพอร์ต การรายงาน และการควบคุมเบราว์เซอร์โดยไม่ต้องรอ API</span>
    </div>
    <div className="showcase-highlight">
      <strong>โลกจริง + อุปกรณ์จริง</strong>
      <span>เครื่องพิมพ์ หุ่นดูดฝุ่น กล้อง ข้อมูลสุขภาพ ระบบในบ้าน และฐานความรู้ส่วนตัว</span>
    </div>
  </div>
</div>

<Info>
**อยากให้โปรเจกต์ของคุณถูกนำเสนอไหม?** แชร์โปรเจกต์ของคุณใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [แท็ก @openclaw บน X](https://x.com/openclaw)
</Info>

<div className="showcase-jump-links">
  <a href="#videos">วิดีโอ</a>
  <a href="#fresh-from-discord">สดใหม่จาก Discord</a>
  <a href="#automation-workflows">ระบบอัตโนมัติ</a>
  <a href="#knowledge-memory">หน่วยความจำและความรู้</a>
  <a href="#voice-phone">เสียงและโทรศัพท์</a>
  <a href="#infrastructure-deployment">โครงสร้างพื้นฐาน</a>
  <a href="#home-hardware">บ้านและฮาร์ดแวร์</a>
  <a href="#community-projects">ชุมชน</a>
  <a href="#submit-your-project">ส่งโปรเจกต์ของคุณ</a>
</div>

<h2 id="videos">วิดีโอ</h2>

<p className="showcase-section-intro">
  เริ่มจากตรงนี้ถ้าคุณต้องการเส้นทางที่สั้นที่สุดจาก “นี่คืออะไร?” ไปสู่ “โอเค เข้าใจแล้ว”
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>วิดีโอแนะนำการตั้งค่าแบบเต็ม</h3>
    <p>VelvetShark, 28 นาที ติดตั้ง ทำ onboarding และไปจนถึงผู้ช่วยตัวแรกที่ใช้งานได้แบบครบวงจร</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">ดูบน YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>วิดีโอรวมผลงานจากชุมชน</h3>
    <p>พาชมโปรเจกต์จริง พื้นผิวจริง และเวิร์กโฟลว์จริงที่สร้างขึ้นรอบ OpenClaw แบบกระชับ</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">ดูบน YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>โปรเจกต์จากโลกจริง</h3>
    <p>ตัวอย่างจากชุมชน ตั้งแต่วงจรเขียนโค้ดในแชตไปจนถึงฮาร์ดแวร์และระบบอัตโนมัติส่วนบุคคล</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">ดูบน YouTube</a>
  </div>
</div>

<h2 id="fresh-from-discord">สดใหม่จาก Discord</h2>

<p className="showcase-section-intro">
  ผลงานเด่นล่าสุดในสายโค้ด devtools มือถือ และการสร้างผลิตภัณฑ์แบบเนทีฟในแชต
</p>

<CardGroup cols={2}>

<Card title="PR Review → Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode ทำการเปลี่ยนแปลงเสร็จ → เปิด PR → OpenClaw รีวิว diff และตอบกลับใน Telegram ด้วย “minor suggestions” พร้อมคำตัดสินชัดเจนว่าควร merge หรือไม่ (รวมถึงจุดแก้วิกฤตก่อน merge)

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ผลการรีวิว PR ของ OpenClaw ที่ส่งใน Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ขอให้ “Robby” (@openclaw) สร้างสกิลห้องเก็บไวน์แบบ local มันขอไฟล์ CSV ตัวอย่าง + ตำแหน่งจัดเก็บ จากนั้นสร้าง/ทดสอบสกิลได้อย่างรวดเร็ว (ตัวอย่างนี้มี 962 ขวด)

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw กำลังสร้างสกิลห้องเก็บไวน์จาก CSV ในเครื่อง" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

แผนมื้ออาหารรายสัปดาห์ → ของที่ซื้อประจำ → จองช่วงเวลาจัดส่ง → ยืนยันคำสั่งซื้อ ไม่มี API ใช้การควบคุมเบราว์เซอร์ล้วน ๆ

  <img src="/assets/showcase/tesco-shop.jpg" alt="ระบบอัตโนมัติสำหรับการซื้อของ Tesco ผ่านแชต" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

กดฮอตคีย์เลือกพื้นที่หน้าจอ → Gemini vision → ได้ Markdown ลง clipboard ทันที

  <img src="/assets/showcase/snag.png" alt="เครื่องมือแปลงภาพหน้าจอเป็น Markdown ของ SNAG" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

แอปเดสก์ท็อปสำหรับจัดการสกิล/คำสั่งข้าม Agents, Claude, Codex และ OpenClaw

  <img src="/assets/showcase/agents-ui.jpg" alt="แอป Agents UI" />
</Card>

<Card title="Telegram Voice Notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

ห่อ TTS ของ papla.media แล้วส่งผลลัพธ์เป็นข้อความเสียงใน Telegram (ไม่มี autoplay ที่น่ารำคาญ)

  <img src="/assets/showcase/papla-tts.jpg" alt="ผลลัพธ์ข้อความเสียง Telegram จาก TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ตัวช่วยติดตั้งผ่าน Homebrew สำหรับแสดงรายการ/ตรวจสอบ/ติดตามเซสชัน OpenAI Codex ในเครื่อง (CLI + VS Code)

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor บน ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

ควบคุมและแก้ไขปัญหาเครื่องพิมพ์ BambuLab: สถานะ งาน กล้อง AMS การคาลิเบรต และอีกมากมาย

  <img src="/assets/showcase/bambu-cli.png" alt="สกิล Bambu CLI บน ClawHub" />
</Card>

<Card title="Vienna Transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

เวลารถออกแบบเรียลไทม์ การหยุดชะงัก สถานะลิฟต์ และการหาเส้นทางสำหรับระบบขนส่งสาธารณะของเวียนนา

  <img src="/assets/showcase/wienerlinien.png" alt="สกิล Wiener Linien บน ClawHub" />
</Card>

<Card title="ParentPay School Meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ระบบจองอาหารโรงเรียนในสหราชอาณาจักรอัตโนมัติผ่าน ParentPay ใช้พิกัดเมาส์เพื่อคลิกเซลล์ในตารางได้อย่างน่าเชื่อถือ
</Card>

<Card title="R2 Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

อัปโหลดไปยัง Cloudflare R2/S3 และสร้างลิงก์ดาวน์โหลดแบบ presigned ที่ปลอดภัย เหมาะอย่างยิ่งสำหรับ OpenClaw instance ระยะไกล
</Card>

<Card title="iOS App via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

สร้างแอป iOS แบบสมบูรณ์พร้อมแผนที่และการบันทึกเสียง แล้ว deploy ไปยัง TestFlight ทั้งหมดผ่านแชต Telegram

  <img src="/assets/showcase/ios-testflight.jpg" alt="แอป iOS บน TestFlight" />
</Card>

<Card title="Oura Ring Health Assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

ผู้ช่วยสุขภาพ AI ส่วนบุคคลที่ผสานข้อมูล Oura ring เข้ากับปฏิทิน นัดหมาย และตารางออกกำลังกาย

  <img src="/assets/showcase/oura-health.png" alt="ผู้ช่วยสุขภาพ Oura ring" />
</Card>
<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

เอเจนต์ 14+ ตัวภายใต้ gateway เดียว โดยมี Opus 4.5 orchestrator ที่มอบหมายงานให้ Codex workers มี [บทความเชิงเทคนิค](https://github.com/adam91holt/orchestrated-ai-articles) ครอบคลุม Dream Team roster, การเลือกโมเดล, sandboxing, Webhooks, Heartbeat และโฟลว์การมอบหมายงาน [Clawdspace](https://github.com/adam91holt/clawdspace) สำหรับ sandboxing ของเอเจนต์ [บทความบล็อก](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI สำหรับ Linear ที่ผสานเข้ากับเวิร์กโฟลว์แบบเอเจนต์ (Claude Code, OpenClaw) จัดการ issue, โปรเจกต์ และเวิร์กโฟลว์จากเทอร์มินัล มี external PR แรกถูก merge แล้ว!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

อ่าน ส่ง และเก็บข้อความผ่าน Beeper Desktop ใช้ Beeper local MCP API เพื่อให้เอเจนต์จัดการแชตทั้งหมดของคุณ (iMessage, WhatsApp ฯลฯ) ได้จากที่เดียว
</Card>

</CardGroup>

<h2 id="automation-workflows">ระบบอัตโนมัติและเวิร์กโฟลว์</h2>

<p className="showcase-section-intro">
  การจัดตาราง การควบคุมเบราว์เซอร์ ลูปการซัพพอร์ต และด้าน “ช่วยทำงานนี้ให้ที” ของผลิตภัณฑ์
</p>

<CardGroup cols={2}>

<Card title="Winix Air Purifier Control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ค้นพบและยืนยันการควบคุมเครื่องฟอกอากาศแล้ว จากนั้น OpenClaw เข้ามารับช่วงเพื่อจัดการคุณภาพอากาศในห้อง

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="การควบคุมเครื่องฟอกอากาศ Winix ผ่าน OpenClaw" />
</Card>

<Card title="Pretty Sky Camera Shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

ทริกเกอร์จากกล้องบนหลังคา: ขอให้ OpenClaw ถ่ายภาพท้องฟ้าเมื่อมันดูสวย — มันออกแบบสกิลและถ่ายภาพให้

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="ภาพท้องฟ้าจากกล้องบนหลังคาที่ OpenClaw ถ่ายไว้" />
</Card>

<Card title="Visual Morning Briefing Scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

พรอมป์ตามกำหนดเวลาจะสร้างภาพ “ฉาก” เดียวทุกเช้า (อากาศ งาน วันที่ โพสต์/คำคมที่ชอบ) ผ่าน persona ของ OpenClaw
</Card>

<Card title="Padel Court Booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  CLI สำหรับตรวจสอบเวลาว่างและจองคอร์ท Playtomic อย่าพลาดคอร์ทว่างอีกต่อไป
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="ภาพหน้าจอ padel-cli" />
</Card>

<Card title="Accounting Intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  รวบรวม PDF จากอีเมล และเตรียมเอกสารสำหรับที่ปรึกษาด้านภาษี งานบัญชีรายเดือนเป็นอัตโนมัติ
</Card>

<Card title="Couch Potato Dev Mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

สร้างเว็บส่วนตัวใหม่ทั้งเว็บผ่าน Telegram ระหว่างดู Netflix — ย้ายจาก Notion → Astro, ย้ายโพสต์ 18 บทความ, เปลี่ยน DNS ไป Cloudflare โดยไม่เคยเปิดแล็ปท็อปเลย
</Card>

<Card title="Job Search Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

ค้นหาประกาศงาน จับคู่กับคีย์เวิร์ดใน CV และคืนโอกาสงานที่เกี่ยวข้องพร้อมลิงก์ สร้างเสร็จใน 30 นาทีด้วย JSearch API
</Card>

<Card title="Jira Skill Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw เชื่อมต่อกับ Jira จากนั้นก็สร้างสกิลใหม่ขึ้นมาทันที (ก่อนที่มันจะมีอยู่บน ClawHub)
</Card>

<Card title="Todoist Skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

ทำงาน Todoist ให้เป็นอัตโนมัติ และให้ OpenClaw สร้างสกิลโดยตรงภายในแชต Telegram
</Card>

<Card title="TradingView Analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ล็อกอินเข้า TradingView ผ่าน browser automation จับภาพกราฟ และทำการวิเคราะห์ทางเทคนิคตามต้องการ ไม่ต้องมี API—ใช้เพียงการควบคุมเบราว์เซอร์
</Card>

<Card title="Slack Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

เฝ้าดูช่อง Slack ของบริษัท ตอบกลับอย่างมีประโยชน์ และส่งต่อการแจ้งเตือนไปยัง Telegram มันแก้บั๊ก production ในแอปที่ deploy อยู่ได้เองโดยไม่ต้องมีใครบอก
</Card>

</CardGroup>

<h2 id="knowledge-memory">ความรู้และ Memory</h2>

<p className="showcase-section-intro">
  ระบบที่ทำดัชนี ค้นหา จดจำ และให้เหตุผลกับความรู้ส่วนตัวหรือของทีม
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  เอนจินสำหรับเรียนภาษาจีนพร้อมฟีดแบ็กด้านการออกเสียงและโฟลว์การเรียนผ่าน OpenClaw
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ฟีดแบ็กการออกเสียงของ xuezh" />
</Card>

<Card title="WhatsApp Memory Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  นำเข้า WhatsApp export แบบเต็ม ถอดเสียง voice note มากกว่า 1k รายการ ตรวจสอบไขว้กับ git logs และส่งออกรายงาน Markdown แบบเชื่อมโยงกัน
</Card>

<Card title="Karakeep Semantic Search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  เพิ่ม vector search ให้ bookmark ของ Karakeep โดยใช้ Qdrant + embeddings จาก OpenAI/Ollama
</Card>

<Card title="Inside-Out-2 Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  memory manager แยกต่างหากที่เปลี่ยนไฟล์เซสชันให้กลายเป็นความทรงจำ → ความเชื่อ → แบบจำลองตนเองที่พัฒนาไปเรื่อย ๆ
</Card>

</CardGroup>

<h2 id="voice-phone">เสียงและโทรศัพท์</h2>

<p className="showcase-section-intro">
  จุดเริ่มต้นแบบเสียงเป็นหลัก, สะพานเชื่อมโทรศัพท์ และเวิร์กโฟลว์ที่เน้นการถอดเสียงอย่างหนัก
</p>

<CardGroup cols={2}>

<Card title="Clawdia Phone Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  สะพานเชื่อมผู้ช่วยเสียง Vapi ↔ OpenClaw HTTP โทรศัพท์แบบใกล้เรียลไทม์กับเอเจนต์ของคุณ
</Card>

<Card title="OpenRouter Transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

การถอดเสียงหลายภาษาผ่าน OpenRouter (Gemini ฯลฯ) ใช้งานได้บน ClawHub
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">โครงสร้างพื้นฐานและการปรับใช้</h2>

<p className="showcase-section-intro">
  การแพ็กเกจ การปรับใช้ และการผสานรวมที่ทำให้ OpenClaw รันและขยายได้ง่ายขึ้น
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  OpenClaw gateway ที่รันบน Home Assistant OS พร้อมการรองรับ SSH tunnel และสถานะถาวร
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  ควบคุมและทำให้อุปกรณ์ Home Assistant เป็นอัตโนมัติด้วยภาษาธรรมชาติ
</Card>

<Card title="Nix Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  การกำหนดค่า OpenClaw แบบ nixified ที่มาพร้อมครบสำหรับการปรับใช้ที่ทำซ้ำได้
</Card>

<Card title="CalDAV Calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  สกิลปฏิทินที่ใช้ khal/vdirsyncer การผสานรวมปฏิทินแบบ self-hosted
</Card>

</CardGroup>

<h2 id="home-hardware">บ้านและฮาร์ดแวร์</h2>

<p className="showcase-section-intro">
  ด้านที่เชื่อมกับโลกจริงของ OpenClaw: บ้าน เซนเซอร์ กล้อง หุ่นดูดฝุ่น และอุปกรณ์อื่น ๆ
</p>

<CardGroup cols={2}>

<Card title="GoHome Automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  ระบบอัตโนมัติในบ้านแบบ Nix-native โดยใช้ OpenClaw เป็นอินเทอร์เฟซ พร้อมแดชบอร์ด Grafana ที่สวยงาม
  
  <img src="/assets/showcase/gohome-grafana.png" alt="แดชบอร์ด Grafana ของ GoHome" />
</Card>

<Card title="Roborock Vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  ควบคุมหุ่นดูดฝุ่น Roborock ของคุณผ่านการสนทนาแบบธรรมชาติ
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="สถานะ Roborock" />
</Card>

</CardGroup>

<h2 id="community-projects">โปรเจกต์จากชุมชน</h2>

<p className="showcase-section-intro">
  สิ่งที่เติบโตเกินกว่าเวิร์กโฟลว์เดียว จนกลายเป็นผลิตภัณฑ์หรือระบบนิเวศที่กว้างขึ้น
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  มาร์เก็ตเพลสอุปกรณ์ดาราศาสตร์แบบเต็มรูปแบบ สร้างขึ้นด้วย/รอบระบบนิเวศของ OpenClaw
</Card>

</CardGroup>

---

<h2 id="submit-your-project">ส่งโปรเจกต์ของคุณ</h2>

<p className="showcase-section-intro">
  หากคุณกำลังสร้างสิ่งที่น่าสนใจด้วย OpenClaw ส่งมาให้เราได้เลย ภาพหน้าจอที่ชัดเจนและผลลัพธ์ที่เป็นรูปธรรมจะช่วยได้มาก
</p>

มีอะไรอยากแชร์หรือไม่? เราอยากนำเสนอมาก!

<Steps>
  <Step title="แชร์มัน">
    โพสต์ใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [ทวีตถึง @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="ใส่รายละเอียด">
    บอกเราว่ามันทำอะไร ลิงก์ไปยัง repo/demo และแชร์ภาพหน้าจอถ้าคุณมี
  </Step>
  <Step title="ได้รับการนำเสนอ">
    เราจะเพิ่มโปรเจกต์เด่นลงในหน้านี้
  </Step>
</Steps>
