---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio ให้เป็นการขนส่งสำหรับ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุโดยตรงผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:23:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

รองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw

Plugin นี้ถูกออกแบบให้ทำงานแบบชัดเจน:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุไว้อย่างชัดเจนเท่านั้น
- เสียงแบบ `realtime` เป็นโหมดค่าเริ่มต้น
- เสียงแบบ Realtime สามารถเรียกกลับไปยังเอเจนต์ OpenClaw แบบเต็มได้เมื่อจำเป็นต้องใช้การให้เหตุผลที่ลึกขึ้นหรือเครื่องมือเพิ่มเติม
- การยืนยันตัวตนเริ่มต้นจาก Google OAuth ส่วนบุคคล หรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- แบ็กเอนด์เสียงเริ่มต้นของ Chrome คือ `BlackHole 2ch`
- Chrome สามารถทำงานภายในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้ก็ได้
- Twilio รองรับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF ที่เป็นตัวเลือก
- คำสั่ง CLI คือ `googlemeet`; ส่วน `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงภายในเครื่อง และตรวจสอบให้แน่ใจว่า provider แบบ realtime สามารถใช้ OpenAI ได้:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` จะติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องรีบูตก่อนที่ macOS จะมองเห็นอุปกรณ์นี้:

```bash
sudo reboot
```

หลังจากรีบูตแล้ว ให้ตรวจสอบทั้งสองส่วน:

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

หรือให้เอเจนต์เข้าร่วมผ่าน tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome จะเข้าร่วมโดยใช้โปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่ ใน Meet ให้เลือก `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับเสียงดูเพล็กซ์ที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; การใช้ BlackHole อุปกรณ์เดียวก็เพียงพอสำหรับ smoke test ครั้งแรก แต่สามารถเกิดเสียงสะท้อนได้

### Gateway ภายในเครื่อง + Chrome บน Parallels

คุณ **ไม่จำเป็น** ต้องมี OpenClaw Gateway แบบเต็มหรือคีย์ API ของโมเดลภายใน macOS VM เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และเอเจนต์ไว้ภายในเครื่อง แล้วรันโฮสต์ Node ใน VM เปิดใช้งาน Plugin ที่มาพร้อมกันบน VM หนึ่งครั้งเพื่อให้ Node โฆษณาคำสั่ง Chrome:

สิ่งที่ทำงานในแต่ละที่:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซของเอเจนต์, คีย์โมเดล/API, provider แบบ realtime และการตั้งค่า Plugin Google Meet
- macOS VM บน Parallels: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google แล้ว
- สิ่งที่ไม่จำเป็นใน VM: บริการ Gateway, การตั้งค่าเอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่า model provider

ติดตั้ง dependency ใน VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังจากติดตั้ง BlackHole เพื่อให้ macOS มองเห็น `BlackHole 2ch`:

```bash
sudo reboot
```

หลังจากรีบูตแล้ว ให้ตรวจสอบว่า VM มองเห็นอุปกรณ์เสียงและคำสั่ง SoX ได้:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้งาน Plugin ที่มาพร้อมกันนั้น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP บน LAN และคุณไม่ได้ใช้ TLS, Node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณจะเลือกอนุญาตสำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ตัวแปรสภาพแวดล้อมเดียวกันนี้เมื่อติดตั้ง Node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของโปรเซส ไม่ใช่การตั้งค่าใน `openclaw.json` คำสั่ง `openclaw node install` จะเก็บค่านี้ไว้ในสภาพแวดล้อมของ LaunchAgent เมื่อมีการระบุไว้ในคำสั่งติดตั้ง

อนุมัติ Node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway มองเห็น Node และ Node โฆษณา `googlemeet.chrome`:

```bash
openclaw nodes status
```

กำหนดเส้นทาง Meet ผ่าน Node นั้นบนโฮสต์ Gateway:

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

ตอนนี้ให้เข้าร่วมตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือขอให้เอเจนต์ใช้ tool `google_meet` พร้อม `transport: "chrome-node"`.

หากละเว้น `chromeNode.node`, OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี Node ที่เชื่อมต่ออยู่เพียงหนึ่งตัวเท่านั้นที่โฆษณา `googlemeet.chrome` หากมีหลาย Node ที่รองรับ ให้กำหนด `chromeNode.node` เป็น id ของ Node, ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบเมื่อเกิดข้อผิดพลาดที่พบบ่อย:

- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM, อนุมัติการจับคู่ และตรวจสอบว่าได้รัน `openclaw plugins enable google-meet` ใน VM แล้ว นอกจากนี้ให้ยืนยันว่าโฮสต์ Gateway อนุญาตคำสั่งของ Node ด้วย `gateway.nodes.allowCommands: ["googlemeet.chrome"]`
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch` ใน VM และรีบูต VM
- Chrome เปิดได้แต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้ Chrome ภายใน VM และยืนยันว่าโปรไฟล์นั้นสามารถเข้าร่วม URL ของ Meet ด้วยตนเองได้
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือนที่ OpenClaw ใช้; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback เพื่อให้ได้เสียงดูเพล็กซ์ที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบ realtime ของ Chrome ใช้เครื่องมือภายนอกสองตัว:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่ง `rec` และ `play` ของมันสำหรับบริดจ์เสียง G.711 mu-law แบบ 8 kHz ค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนสำหรับ macOS โดยจะสร้างอุปกรณ์เสียง `BlackHole 2ch` ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมมากับแพ็กเกจใด และไม่ได้แจกจ่ายแพ็กเกจใดต่อ เอกสารแนะนำให้ผู้ใช้ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาต `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ใช้ GPL-3.0 หากคุณสร้างตัวติดตั้งหรือ appliance ที่รวม BlackHole มากับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาตต้นทางของ BlackHole หรือขอรับสัญญาอนุญาตแยกต่างหากจาก Existential Audio

## การขนส่ง

### Chrome

การขนส่งผ่าน Chrome จะเปิด URL ของ Meet ใน Google Chrome และเข้าร่วมด้วยโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่ บน macOS Plugin จะตรวจสอบ `BlackHole 2ch` ก่อนเปิด หากมีการกำหนดค่าไว้ จะรันคำสั่งตรวจสอบสถานะของ audio bridge และคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่บน Node ที่จับคู่ไว้ เช่น macOS VM บน Parallels

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่าน audio bridge ภายในเครื่องของ OpenClaw หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดด้านการตั้งค่า แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

การขนส่งผ่าน Twilio เป็น dial plan แบบเข้มงวดที่มอบหมายให้ Plugin Voice Call โดยจะไม่แยกวิเคราะห์หน้าของ Meet เพื่อหาเบอร์โทรศัพท์

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องการลำดับแบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และ preflight

การเข้าถึง Google Meet Media API จะใช้ไคลเอนต์ OAuth ส่วนบุคคลก่อน กำหนดค่า `oauth.clientId` และอาจรวมถึง `oauth.clientSecret` จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งนี้จะพิมพ์บล็อกการตั้งค่า `oauth` พร้อม refresh token โดยใช้ PKCE, callback ผ่าน localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์คัดลอก/วางด้วยตนเองร่วมกับ `--manual`

ตัวแปรสภาพแวดล้อมต่อไปนี้รองรับให้ใช้เป็นค่าทดแทน:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง URL ของ Meet, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รัน preflight ก่อนทำงานด้านสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากที่ยืนยันแล้วว่าโปรเจกต์ Cloud, principal ของ OAuth และผู้เข้าร่วมประชุมของคุณได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome แบบ realtime ทั่วไปต้องการเพียงการเปิดใช้งาน Plugin, BlackHole, SoX และคีย์ OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

กำหนดค่า Plugin ภายใต้ `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/ชื่อ/IP ของ Node แบบตัวเลือกสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: คำสั่ง SoX `rec` ที่เขียนเสียง G.711 mu-law แบบ 8 kHz ไปยัง stdout
- `chrome.audioOutputCommand`: คำสั่ง SoX `play` ที่อ่านเสียง G.711 mu-law แบบ 8 kHz จาก stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: การตอบด้วยเสียงพูดแบบสั้น ๆ พร้อมใช้
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: ข้อความพร้อมใช้งานแบบสั้นที่พูดเมื่อ realtime bridge เชื่อมต่อ; ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ

การแทนที่เพิ่มเติมที่เป็นตัวเลือก:

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
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
  },
}
```

การกำหนดค่าเฉพาะ Twilio:

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

## Tool

เอเจนต์สามารถใช้ tool `google_meet` ได้:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway ใช้ `transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ไว้ เช่น VM บน Parallels ในทั้งสองกรณี โมเดลแบบ realtime และ `openclaw_agent_consult` จะทำงานบนโฮสต์ Gateway ดังนั้นข้อมูลรับรองของโมเดลจะยังคงอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่ หรือตรวจสอบ ID ของเซสชัน ใช้ `action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์แบบ realtime พูดได้ทันที ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## การปรึกษาเอเจนต์แบบ Realtime

โหมด realtime ของ Chrome ถูกปรับให้เหมาะกับลูปเสียงสด provider เสียงแบบ realtime จะได้ยินเสียงจากการประชุมและพูดผ่าน audio bridge ที่กำหนดค่าไว้ เมื่อโมเดลแบบ realtime ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ตามปกติ ก็สามารถเรียก `openclaw_agent_consult` ได้

Tool consult จะรันเอเจนต์ OpenClaw ปกติอยู่เบื้องหลังโดยใช้บริบททรานสคริปต์การประชุมล่าสุด และส่งกลับคำตอบแบบกระชับที่พูดได้ไปยังเซสชันเสียงแบบ realtime จากนั้นโมเดลเสียงก็สามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผย tool consult และจำกัดเอเจนต์ปกติให้ใช้ได้เฉพาะ
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผย tool consult และใหัเอเจนต์ปกติใช้ policy เครื่องมือของเอเจนต์ตามปกติ
- `none`: ไม่เปิดเผย tool consult ให้กับโมเดลเสียงแบบ realtime

คีย์เซสชัน consult จะถูกกำหนดขอบเขตแยกตามแต่ละเซสชัน Meet ดังนั้นการเรียก consult ต่อเนื่องจึงสามารถนำบริบท consult ก่อนหน้ากลับมาใช้ซ้ำได้ภายในการประชุมเดียวกัน

หากต้องการบังคับให้มีการตรวจสอบความพร้อมแบบพูดหลังจากที่ Chrome เข้าร่วมการโทรอย่างสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## หมายเหตุ

media API อย่างเป็นทางการของ Google Meet เน้นการรับข้อมูลเป็นหลัก ดังนั้นการพูดเข้าไปในการโทร Meet ยังคงต้องใช้เส้นทางของผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตดังกล่าวมองเห็นได้ชัดเจน: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงภายในเครื่อง; Twilio จัดการการเข้าร่วมผ่านการโทรเข้า

โหมด realtime ของ Chrome ต้องมีอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` ร่วมกับ `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของบริดจ์โมเดลแบบ realtime และ pipe เสียง G.711 mu-law แบบ 8 kHz ระหว่างคำสั่งเหล่านั้นกับ provider เสียงแบบ realtime ที่เลือก
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงภายในเครื่องทั้งหมด และต้องจบการทำงานหลังจากเริ่มหรือยืนยัน daemon ของมันแล้ว

เพื่อให้ได้เสียงดูเพล็กซ์ที่สะอาด ให้กำหนดเส้นทางเอาต์พุตของ Meet และไมโครโฟนของ Meet ผ่านอุปกรณ์เสมือนแยกกันหรือกราฟอุปกรณ์เสมือนแบบ Loopback การใช้ BlackHole อุปกรณ์เดียวร่วมกันอาจสะท้อนเสียงของผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทรได้

`googlemeet speak` จะทริกเกอร์ audio bridge แบบ realtime ที่กำลังทำงานอยู่สำหรับเซสชัน Chrome `googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Plugin Voice Call, `leave` จะวางสายการโทรเสียงที่อยู่เบื้องล่างด้วย

## ที่เกี่ยวข้อง

- [Plugin Voice call](/th/plugins/voice-call)
- [โหมด Talk](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
