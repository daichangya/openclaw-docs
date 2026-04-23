---
read_when:
    - คุณต้องการรายการทั้งหมดของสิ่งที่ OpenClaw รองรับ
summary: ความสามารถของ OpenClaw ครอบคลุมช่องทางต่าง ๆ การกำหนดเส้นทาง สื่อ และประสบการณ์ผู้ใช้
title: ฟีเจอร์
x-i18n:
    generated_at: "2026-04-23T05:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# ฟีเจอร์

## ไฮไลต์

<Columns>
  <Card title="Channels" icon="message-square" href="/th/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat และอีกมากมาย ผ่าน Gateway เดียว
  </Card>
  <Card title="Plugins" icon="plug" href="/th/tools/plugin">
    bundled plugin เพิ่ม Matrix, Nextcloud Talk, Nostr, Twitch, Zalo และอีกมากมาย โดยไม่ต้องติดตั้งแยกในรีลีสปัจจุบันตามปกติ
  </Card>
  <Card title="Routing" icon="route" href="/th/concepts/multi-agent">
    การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกจากกัน
  </Card>
  <Card title="Media" icon="image" href="/th/nodes/images">
    รูปภาพ เสียง วิดีโอ เอกสาร และการสร้างภาพ/วิดีโอ
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/web/control-ui">
    Web Control UI และแอปคู่หูบน macOS
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/th/nodes">
    Node บน iOS และ Android พร้อมการจับคู่ เสียง/แชต และคำสั่งอุปกรณ์แบบสมบูรณ์
  </Card>
</Columns>

## รายการทั้งหมด

**Channels:**

- ช่องทางที่มีมาในตัว ได้แก่ Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat และ WhatsApp
- ช่องทางแบบ bundled plugin ได้แก่ BlueBubbles สำหรับ iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo และ Zalo Personal
- Plugin ช่องทางแบบติดตั้งแยกเพิ่มเติมที่เป็นทางเลือก ได้แก่ Voice Call และแพ็กเกจจากภายนอก เช่น WeChat
- Plugin ช่องทางจากภายนอกสามารถขยาย Gateway ได้เพิ่มเติม เช่น WeChat
- รองรับแชตกลุ่มพร้อมการเปิดใช้งานแบบอิงการกล่าวถึง
- ความปลอดภัยของ DM ด้วย allowlist และการจับคู่

**เอเจนต์:**

- รันไทม์เอเจนต์แบบฝังตัวพร้อมการสตรีมเครื่องมือ
- การกำหนดเส้นทางหลายเอเจนต์พร้อมเซสชันที่แยกจากกันตาม workspace หรือผู้ส่ง
- เซสชัน: แชตโดยตรงจะถูกรวมเข้าที่ `main`; กลุ่มจะถูกแยกออกจากกัน
- การสตรีมและการแบ่งข้อความสำหรับคำตอบที่ยาว

**การยืนยันตัวตนและผู้ให้บริการ:**

- ผู้ให้บริการโมเดลมากกว่า 35 ราย (Anthropic, OpenAI, Google และอื่น ๆ)
- การยืนยันตัวตนแบบสมัครสมาชิกผ่าน OAuth (เช่น OpenAI Codex)
- รองรับผู้ให้บริการแบบกำหนดเองและโฮสต์เอง (vLLM, SGLang, Ollama และ endpoint ที่เข้ากันได้กับ OpenAI หรือ Anthropic)

**สื่อ:**

- รองรับรูปภาพ เสียง วิดีโอ และเอกสาร ทั้งขาเข้าและขาออก
- พื้นผิวความสามารถสำหรับการสร้างภาพและวิดีโอแบบใช้ร่วมกัน
- การถอดเสียง voice note
- การแปลงข้อความเป็นเสียงจากผู้ให้บริการหลายราย

**แอปและอินเทอร์เฟซ:**

- WebChat และ Control UI บนเบราว์เซอร์
- แอปคู่หูบนแถบเมนูของ macOS
- Node บน iOS พร้อมการจับคู่, Canvas, กล้อง, การบันทึกหน้าจอ, ตำแหน่งที่ตั้ง และเสียง
- Node บน Android พร้อมการจับคู่, แชต, เสียง, Canvas, กล้อง และคำสั่งอุปกรณ์

**เครื่องมือและระบบอัตโนมัติ:**

- ระบบอัตโนมัติเบราว์เซอร์, exec, sandboxing
- การค้นหาเว็บ (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- งาน Cron และการตั้งเวลา Heartbeat
- Skills, plugin และ pipeline เวิร์กโฟลว์ (Lobster)
