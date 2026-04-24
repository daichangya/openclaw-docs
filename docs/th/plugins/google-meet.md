---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet
    - คุณกำลังกำหนดค่า Chrome, โหนด Chrome หรือ Twilio ให้เป็นการส่งผ่านสำหรับ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุโดยตรงผ่าน Chrome หรือ Twilio โดยใช้ค่าเริ่มต้นเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

รองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw

Plugin นี้ถูกออกแบบให้ต้องระบุอย่างชัดเจน:

- เข้าร่วมได้เฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- เสียง `realtime` เป็นโหมดเริ่มต้น
- เสียงแบบเรียลไทม์สามารถเรียกกลับไปยังเอเจนต์ OpenClaw เต็มรูปแบบได้เมื่อต้องการการให้เหตุผลเชิงลึกมากขึ้นหรือใช้เครื่องมือ
- การยืนยันตัวตนเริ่มต้นจาก Google OAuth ส่วนบุคคล หรือ Chrome profile ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- แบ็กเอนด์เสียง Chrome เริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ node ที่จับคู่ไว้ก็ได้
- Twilio รองรับหมายเลข dial-in พร้อม PIN หรือชุด DTMF แบบไม่บังคับ
- คำสั่ง CLI คือ `googlemeet`; โดย `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ในภาพรวม

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency ด้านเสียงภายในเครื่องและกำหนดค่าผู้ให้บริการเสียงแบบเรียลไทม์ฝั่งแบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ใช้งานได้เช่นกันด้วย
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` จะติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องการให้รีบูตก่อนที่ macOS จะมองเห็นอุปกรณ์นี้:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบทั้งสองส่วน:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

เปิดใช้งาน Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

ตรวจสอบการตั้งค่า:

```bash
openclaw googlemeet setup
```

เข้าร่วมการประชุม:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือให้เอเจนต์เข้าร่วมผ่านเครื่องมือ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome จะเข้าร่วมโดยใช้ Chrome profile ที่ลงชื่อเข้าใช้อยู่แล้ว ใน Meet ให้เลือก `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้งาน สำหรับเสียงแบบสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; การใช้อุปกรณ์ BlackHole เพียงตัวเดียวเพียงพอสำหรับ smoke test แรก แต่สามารถเกิดเสียงสะท้อนได้

### Local Gateway + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ API ของโมเดลภายใน macOS VM เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และเอเจนต์ในเครื่อง แล้วรันโฮสต์ node ใน VM เปิดใช้งาน Plugin ที่มาพร้อมกันบน VM หนึ่งครั้งเพื่อให้ node โฆษณาคำสั่ง Chrome:

สิ่งที่รันอยู่ที่ใด:

- โฮสต์ Gateway: OpenClaw Gateway, พื้นที่ทำงานของเอเจนต์, คีย์โมเดล/API, ผู้ให้บริการ realtime และการตั้งค่า Plugin Google Meet
- Parallels macOS VM: OpenClaw CLI/โฮสต์ node, Google Chrome, SoX, BlackHole 2ch และ Chrome profile ที่ลงชื่อเข้าใช้ Google แล้ว
- ไม่จำเป็นใน VM: บริการ Gateway, การตั้งค่าเอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่าผู้ให้บริการโมเดล

ติดตั้ง dependency ใน VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS มองเห็น `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบว่า VM มองเห็นอุปกรณ์เสียงและคำสั่ง SoX ได้:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้งาน Plugin ที่มาพร้อมกันนั้น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น LAN IP และคุณไม่ได้ใช้ TLS, node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณจะเลือกอนุญาตเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ตัวแปรสภาพแวดล้อมเดียวกันนี้เมื่อติดตั้ง node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของโปรเซส ไม่ใช่การตั้งค่าใน `openclaw.json` คำสั่ง `openclaw node install` จะจัดเก็บค่านี้ไว้ในสภาพแวดล้อมของ LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

อนุมัติ node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway มองเห็น node และ node โฆษณา `googlemeet.chrome`:

```bash
openclaw nodes status
```

กำหนดเส้นทาง Meet ผ่าน node นั้นบนโฮสต์ Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

ตอนนี้เข้าร่วมได้ตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือขอให้เอเจนต์ใช้เครื่องมือ `google_meet` พร้อม `transport: "chrome-node"`.

หากละเว้น `chromeNode.node`, OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี node ที่เชื่อมต่ออยู่เพียงตัวเดียวซึ่งโฆษณา `googlemeet.chrome` หากมีหลาย node ที่รองรับเชื่อมต่ออยู่ ให้ตั้งค่า `chromeNode.node` เป็น node id, ชื่อที่แสดง หรือ remote IP

การตรวจสอบเมื่อเกิดข้อผิดพลาดที่พบบ่อย:

- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM, อนุมัติการจับคู่ และตรวจสอบว่าได้รัน `openclaw plugins enable google-meet` ใน VM แล้ว ยืนยันด้วยว่าโฮสต์ Gateway อนุญาตคำสั่งของ node ด้วย `gateway.nodes.allowCommands: ["googlemeet.chrome"]`
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch` ใน VM และรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้ Chrome ภายใน VM และยืนยันว่า profile นั้นสามารถเข้าร่วม Meet URL ได้ด้วยตนเอง
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือนที่ OpenClaw ใช้งาน; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback เพื่อให้ได้เสียงสองทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบ Chrome realtime ใช้เครื่องมือภายนอกสองตัว:

- `sox`: เครื่องมือเสียงบรรทัดคำสั่ง Plugin ใช้คำสั่ง `rec` และ `play` ของมันสำหรับบริดจ์เสียง G.711 mu-law 8 kHz แบบค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนสำหรับ macOS มันสร้างอุปกรณ์เสียง `BlackHole 2ch` ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมมาหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่งใหม่ เอกสารแนะนำให้ผู้ใช้ติดตั้งแพ็กเกจเหล่านี้เป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาตเป็น
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้างตัวติดตั้งหรืออุปกรณ์สำเร็จรูปที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาตต้นทางของ BlackHole หรือขอรับสัญญาอนุญาตแยกต่างหากจาก Existential Audio

## การส่งผ่าน

### Chrome

การส่งผ่านแบบ Chrome จะเปิด URL ของ Meet ใน Google Chrome และเข้าร่วมโดยใช้ Chrome profile ที่ลงชื่อเข้าใช้อยู่แล้ว บน macOS Plugin จะตรวจสอบ `BlackHole 2ch` ก่อนเปิดใช้งาน หากมีการกำหนดค่าไว้ มันจะรันคำสั่งตรวจสุขภาพของ audio bridge และคำสั่งเริ่มต้นก่อนเปิด Chrome ใช้ `chrome` เมื่อ Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่บน node ที่จับคู่ไว้ เช่น Parallels macOS VM

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่าน audio bridge ภายในเครื่องของ OpenClaw หากไม่ได้ติดตั้ง `BlackHole 2ch`, การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

การส่งผ่านแบบ Twilio เป็นแผน dial ที่เข้มงวดซึ่งมอบหมายให้ Plugin Voice Call โดยจะไม่แยกวิเคราะห์หน้า Meet เพื่อหาเบอร์โทรศัพท์

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องการชุดลำดับแบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และ preflight

การเข้าถึง Google Meet Media API ใช้ OAuth client ส่วนบุคคลก่อน กำหนดค่า
`oauth.clientId` และ `oauth.clientSecret` แบบไม่บังคับ แล้วรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งนี้จะพิมพ์บล็อกการตั้งค่า `oauth` พร้อม refresh token โดยใช้ PKCE,
localhost callback ที่ `http://localhost:8085/oauth2callback` และโฟลว์คัดลอก/วางด้วยตนเองพร้อม `--manual`

ยอมรับตัวแปรสภาพแวดล้อมเหล่านี้เป็นค่าทดแทน:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง URL, code หรือ `spaces/{id}` ของ Meet ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รัน preflight ก่อนทำงานกับ media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากยืนยันแล้วว่า Cloud project, OAuth principal และผู้เข้าร่วมประชุมของคุณได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs

## การตั้งค่า

เส้นทาง Chrome realtime ทั่วไปต้องการเพียงการเปิดใช้งาน Plugin, BlackHole, SoX และคีย์ผู้ให้บริการเสียงแบบเรียลไทม์ฝั่งแบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; ตั้งค่า `realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

ตั้งค่า Plugin ภายใต้ `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

ค่าเริ่มต้น:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: node id/name/IP แบบไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: คำสั่ง SoX `rec` ที่เขียนเสียง G.711 mu-law 8 kHz ไปยัง stdout
- `chrome.audioOutputCommand`: คำสั่ง SoX `play` ที่อ่านเสียง G.711 mu-law 8 kHz จาก stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบแบบพูดสั้น ๆ พร้อม
  `openclaw_agent_consult` สำหรับคำตอบเชิงลึก
- `realtime.introMessage`: ข้อความพร้อมใช้งานแบบพูดสั้น ๆ เมื่อ realtime bridge เชื่อมต่อ; ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ

การแทนที่แบบไม่บังคับ:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

การตั้งค่าเฉพาะ Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## เครื่องมือ

เอเจนต์สามารถใช้เครื่องมือ `google_meet` ได้:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome รันอยู่บนโฮสต์ Gateway ใช้
`transport: "chrome-node"` เมื่อ Chrome รันอยู่บน node ที่จับคู่ไว้ เช่น Parallels VM ในทั้งสองกรณี โมเดล realtime และ `openclaw_agent_consult` จะรันอยู่บนโฮสต์ Gateway ดังนั้นข้อมูลรับรองของโมเดลจึงคงอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบ session ID ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์แบบเรียลไทม์พูดได้ทันที ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## การปรึกษาเอเจนต์แบบเรียลไทม์

โหมด Chrome realtime ถูกปรับให้เหมาะกับลูปเสียงสด ผู้ให้บริการเสียงแบบเรียลไทม์จะได้ยินเสียงการประชุมและพูดผ่าน audio bridge ที่กำหนดค่าไว้ เมื่อโมเดลแบบเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ตามปกติ โมเดลนั้นสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult จะรันเอเจนต์ OpenClaw ปกติอยู่เบื้องหลัง พร้อมบริบททรานสคริปต์การประชุมล่าสุด และส่งคืนคำตอบแบบกระชับสำหรับพูดในเซสชันเสียงแบบเรียลไทม์ จากนั้นโมเดลเสียงก็สามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้ได้เฉพาะ
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้อเจนต์ปกติใช้นโยบายเครื่องมือของเอเจนต์ตามปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้กับโมเดลเสียงแบบเรียลไทม์

คีย์เซสชัน consult ถูกกำหนดขอบเขตแยกตามแต่ละเซสชัน Meet ดังนั้นการเรียก consult ต่อเนื่องจึงสามารถใช้บริบท consult ก่อนหน้าในระหว่างการประชุมเดียวกันได้

หากต้องการบังคับให้มีการตรวจความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมการโทรเรียบร้อยแล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## หมายเหตุ

Media API อย่างเป็นทางการของ Google Meet มีลักษณะเน้นการรับสัญญาณ ดังนั้นการพูดเข้าไปในการโทร Meet ยังจำเป็นต้องมีเส้นทางผ่านผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตดังกล่าวมองเห็นได้ชัดเจน: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงภายในเครื่อง; Twilio จัดการการเข้าร่วมผ่านการโทรเข้าทางโทรศัพท์

โหมด Chrome realtime ต้องมีอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของบริดจ์โมเดลแบบเรียลไทม์ และส่งต่อเสียง G.711 mu-law 8 kHz ระหว่างคำสั่งเหล่านั้นกับผู้ให้บริการเสียงแบบเรียลไทม์ที่เลือก
- `chrome.audioBridgeCommand`: คำสั่งบริดจ์ภายนอกเป็นเจ้าของเส้นทางเสียงภายในเครื่องทั้งหมด และต้องจบการทำงานหลังจากเริ่มต้นหรือตรวจสอบ daemon ของมันแล้ว

เพื่อให้ได้เสียงสองทางที่สะอาด ให้กำหนดเส้นทางเอาต์พุตของ Meet และไมโครโฟนของ Meet ผ่านอุปกรณ์เสมือนแยกกัน หรือผ่านกราฟอุปกรณ์เสมือนแบบ Loopback การใช้ BlackHole ร่วมกันเพียงอุปกรณ์เดียวอาจสะท้อนเสียงของผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทรได้

`googlemeet speak` จะทริกเกอร์ audio bridge แบบเรียลไทม์ที่กำลังใช้งานสำหรับเซสชัน Chrome ส่วน `googlemeet leave` จะหยุดบริดจ์นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Plugin Voice Call, `leave` จะวางสายการโทรเสียงที่อยู่เบื้องหลังด้วย

## ที่เกี่ยวข้อง

- [Plugin Voice call](/th/plugins/voice-call)
- [โหมด Talk](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
