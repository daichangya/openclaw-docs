---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ครอบคลุม channels, routing, media และ UX
title: ฟีเจอร์
x-i18n:
    generated_at: "2026-04-24T09:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## ไฮไลต์

<Columns>
  <Card title="Channels" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอื่นๆ อีกมากมายผ่าน Gateway เดียว
  </Card>
  <Card title="Plugins" icon="plug" href="/th/tools/plugin">
    bundled plugins เพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอื่นๆ อีกมากมายโดยไม่ต้องติดตั้งแยกในรุ่นปัจจุบันทั่วไป
  </Card>
  <Card title="Routing" icon="route" href="/th/concepts/multi-agent">
    การ route แบบหลายเอเจนต์พร้อมเซสชันที่แยกออกจากกัน
  </Card>
  <Card title="Media" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างภาพ/วิดีโอ
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/th/web/control-ui">
    Web Control UI และแอปคู่หูบน macOS
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/th/nodes">
    nodes บน iOS และ Android พร้อม pairing, เสียง/แชต และคำสั่งอุปกรณ์แบบสมบูรณ์
  </Card>
</Columns>

## รายการทั้งหมด

**Channels:**

- channels ที่มีมาในตัวประกอบด้วย Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- channels ของ bundled plugin ประกอบด้วย BlueBubbles สำหรับ iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- channel plugins แบบไม่บังคับที่ติดตั้งแยกต่างหากประกอบด้วย Voice Call และแพ็กเกจของบุคคลที่สาม เช่น WeChat
- channel plugins ของบุคคลที่สามสามารถขยาย Gateway ได้เพิ่มเติม เช่น WeChat
- รองรับแชตกลุ่มพร้อมการเปิดใช้งานตามการ mention
- ความปลอดภัยของ DM ด้วย allowlists และ pairing

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังตัวพร้อมการสตรีมเครื่องมือ
- การ route แบบหลายเอเจนต์พร้อมเซสชันแยกต่อ workspace หรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะถูกรวมเป็น `main`; กลุ่มจะถูกแยกออกจากกัน
- การสตรีมและการแบ่งช่วงสำหรับการตอบกลับที่ยาว

**Auth และ providers:**

- ผู้ให้บริการ model มากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่นๆ)
- subscription auth ผ่าน OAuth (เช่น OpenAI Codex)
- รองรับ provider แบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และ endpoint ใดๆ ที่เข้ากันได้กับ OpenAI หรือ Anthropic)

**Media:**

- รูปภาพ เสียง วิดีโอ และเอกสาร ทั้งขาเข้าและขาออก
- พื้นผิวความสามารถร่วมสำหรับการสร้างภาพและการสร้างวิดีโอ
- การถอดเสียง voice note
- การแปลงข้อความเป็นเสียงด้วยผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ Control UI บนเบราว์เซอร์
- แอปคู่หูบนแถบเมนูของ macOS
- iOS node พร้อม pairing, Canvas, กล้อง, การบันทึกหน้าจอ, ตำแหน่ง และเสียง
- Android node พร้อม pairing, แชต, เสียง, Canvas, กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติเบราว์เซอร์, exec, sandboxing
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการตั้งเวลา Heartbeat
- Skills, plugins และ workflow pipelines (Lobster)

## ที่เกี่ยวข้อง

- [Experimental features](/th/concepts/experimental-features)
- [Agent runtime](/th/concepts/agent)
