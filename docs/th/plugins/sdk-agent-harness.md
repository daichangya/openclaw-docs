---
read_when:
    - คุณกำลังเปลี่ยนรันไทม์เอเจนต์แบบฝังตัวหรือรีจิสทรีของ harness
    - คุณกำลังลงทะเบียน harness ของเอเจนต์จาก Plugin แบบ bundled หรือที่เชื่อถือได้
    - คุณต้องเข้าใจว่า Plugin Codex เชื่อมโยงกับผู้ให้บริการโมเดลอย่างไร
sidebarTitle: Agent Harness
summary: พื้นผิว SDK แบบทดลองสำหรับ Plugin ที่มาแทนที่ตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำ
title: Plugin harness ของเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:24:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Agent harness** คือ executor ระดับต่ำสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่เตรียมไว้แล้ว
มันไม่ใช่ผู้ให้บริการโมเดล ไม่ใช่ channel และไม่ใช่รีจิสทรีของเครื่องมือ

ให้ใช้ surface นี้เฉพาะกับ Plugin เนทีฟแบบ bundled หรือที่เชื่อถือได้เท่านั้น สัญญานี้
ยังคงเป็นแบบทดลอง เพราะชนิดของพารามิเตอร์จงใจสะท้อน embedded runner ปัจจุบัน

## เมื่อใดควรใช้ harness

ให้ลงทะเบียน agent harness เมื่อโมเดลตระกูลหนึ่งมีรันไทม์เซสชันเนทีฟของตัวเอง
และ transport ของผู้ให้บริการ OpenClaw แบบปกติเป็น abstraction ที่ไม่เหมาะสม

ตัวอย่าง:

- เซิร์ฟเวอร์ coding-agent แบบเนทีฟที่เป็นเจ้าของเธรดและ Compaction
- CLI หรือ daemon ภายในเครื่องที่ต้องสตรีม event แบบเนทีฟของ plan/reasoning/tool
- รันไทม์โมเดลที่ต้องมี resume id ของตัวเองเพิ่มเติมจาก session transcript
  ของ OpenClaw

**อย่า** ลงทะเบียน harness เพียงเพื่อเพิ่ม API ของ LLM ใหม่ สำหรับ API โมเดลแบบ HTTP หรือ
WebSocket ปกติ ให้สร้าง [Provider plugin](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังคงรับผิดชอบ

ก่อนจะเลือก harness นั้น OpenClaw ได้ resolve สิ่งต่อไปนี้ไว้แล้ว:

- ผู้ให้บริการและโมเดล
- สถานะ auth ของรันไทม์
- ระดับการคิดและงบประมาณ context
- ไฟล์ transcript/session ของ OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- callback การตอบกลับของ channel และ callback การสตรีม
- นโยบาย model fallback และการสลับโมเดลแบบสด

การแยกหน้าที่นี้เป็นสิ่งที่ตั้งใจไว้ harness จะรัน attempt ที่เตรียมไว้แล้ว
มันไม่ได้เลือกผู้ให้บริการ ไม่ได้มาแทนการส่งผ่าน channel และไม่ได้สลับโมเดลแบบเงียบ ๆ

## ลงทะเบียน harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## นโยบายการเลือก

OpenClaw จะเลือก harness หลังจาก resolve ผู้ให้บริการ/โมเดลแล้ว:

1. harness id ที่บันทึกไว้ของเซสชันเดิมจะมีผลก่อน เพื่อไม่ให้การเปลี่ยน config/env
   สลับรันไทม์ของ transcript นั้นไปเป็นตัวอื่นแบบ hot-switch
2. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับใช้ harness ที่ลงทะเบียนไว้ด้วย id นั้น
   สำหรับเซสชันที่ยังไม่ได้ถูกปักหมุดไว้
3. `OPENCLAW_AGENT_RUNTIME=pi` จะบังคับใช้ harness PI ที่มีมาในระบบ
4. `OPENCLAW_AGENT_RUNTIME=auto` จะถาม harness ที่ลงทะเบียนไว้ว่ารองรับ
   ผู้ให้บริการ/โมเดลที่ resolve แล้วหรือไม่
5. หากไม่มี harness ที่ลงทะเบียนไว้ตัวใดตรง OpenClaw จะใช้ PI เว้นแต่จะปิด
   PI fallback ไว้

ความล้มเหลวของ Plugin harness จะแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto`
ระบบจะใช้ PI fallback ก็ต่อเมื่อไม่มี Plugin harness ที่ลงทะเบียนไว้ตัวใดรองรับ
provider/model ที่ resolve แล้วเท่านั้น เมื่อ Plugin harness ใดรับงานรันนั้นไปแล้ว
OpenClaw จะไม่ replay เทิร์นเดิมนั้นผ่าน PI เพราะอาจทำให้ความหมายของ auth/runtime เปลี่ยน
หรือเกิดผลข้างเคียงซ้ำ

harness id ที่ถูกเลือกจะถูกเก็บถาวรร่วมกับ session id หลังจากการรันแบบ embedded
เซสชันเก่าที่สร้างก่อนมีการปักหมุด harness จะถูกมองว่าเป็นแบบปักหมุด PI เมื่อมีประวัติ transcript แล้ว
ให้ใช้เซสชันใหม่/รีเซ็ตเมื่อต้องการสลับระหว่าง PI กับ Plugin harness แบบเนทีฟ
`/status` จะแสดง harness id ที่ไม่ใช่ค่าเริ่มต้น เช่น `codex`
ถัดจาก `Fast`; ส่วน PI จะถูกซ่อนไว้เพราะเป็นเส้นทางความเข้ากันได้เริ่มต้น
หาก harness ที่ถูกเลือกดูไม่เป็นไปตามคาด ให้เปิด debug logging ของ `agents/harness`
และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ Gateway ซึ่งจะมี
harness id ที่ถูกเลือก เหตุผลของการเลือก นโยบาย runtime/fallback และในโหมด `auto`
จะมีผลการรองรับของผู้สมัคร Plugin แต่ละตัว

Plugin Codex แบบ bundled จะลงทะเบียน `codex` เป็น harness id ของมัน Core ปฏิบัติต่อสิ่งนี้
เหมือน harness id ของ Plugin ปกติทั่วไป; alias ที่เฉพาะกับ Codex ควรอยู่ใน Plugin
หรือ config ของ operator ไม่ใช่ในตัวเลือก runtime ที่ใช้ร่วมกัน

## การจับคู่ provider กับ harness

ส่วนใหญ่ harness ควรลงทะเบียน provider ด้วย provider ทำให้ model ref,
สถานะ auth, metadata ของโมเดล และการเลือก `/model` มองเห็นได้จากส่วนอื่นของ
OpenClaw จากนั้น harness จะรับ provider นั้นใน `supports(...)`

Plugin Codex แบบ bundled ใช้รูปแบบนี้:

- provider id: `codex`
- user model ref: `openai/gpt-5.5` พร้อม `embeddedHarness.runtime: "codex"`; ส่วน ref แบบเก่า `codex/gpt-*` ยังยอมรับเพื่อความเข้ากันได้
- harness id: `codex`
- auth: ความพร้อมใช้งานของ provider แบบ synthetic เพราะ Codex harness เป็นเจ้าของ
  การล็อกอิน/เซสชัน Codex แบบเนทีฟ
- คำขอ app-server: OpenClaw ส่ง bare model id ให้ Codex แล้วให้
  harness คุยกับโปรโตคอล app-server แบบเนทีฟ

Plugin Codex เป็นแบบ additive `openai/gpt-*` ปกติจะยังคงใช้เส้นทาง provider
ของ OpenClaw ตามปกติ เว้นแต่คุณจะบังคับ Codex harness ด้วย
`embeddedHarness.runtime: "codex"` ส่วน ref แบบเก่า `codex/gpt-*`
จะยังคงเลือก provider และ harness ของ Codex เพื่อความเข้ากันได้

สำหรับการตั้งค่าของ operator ตัวอย่าง prefix ของโมเดล และ config เฉพาะ Codex โปรดดู
[Codex Harness](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.118.0` ขึ้นไป Plugin Codex จะตรวจสอบ
initialize handshake ของ app-server และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน
เพื่อให้ OpenClaw รันเฉพาะกับพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้วเท่านั้น

### middleware ของ tool-result สำหรับ Codex app-server

Plugin แบบ bundled ยังสามารถแนบ `tool_result`
middleware ที่เฉพาะกับ Codex app-server ได้ผ่าน `api.registerCodexAppServerExtensionFactory(...)`
เมื่อ manifest ของมันประกาศ `contracts.embeddedExtensionFactories: ["codex-app-server"]`
นี่คือรอยต่อสำหรับ Plugin ที่เชื่อถือได้ สำหรับการแปลงผลลัพธ์เครื่องมือแบบ async
ที่ต้องรันภายใน Codex harness แบบเนทีฟ ก่อนที่ผลลัพธ์เครื่องมือจะถูกฉายกลับเข้าไปใน
transcript ของ OpenClaw

### โหมด harness แบบเนทีฟของ Codex

harness `codex` แบบ bundled คือโหมด Codex แบบเนทีฟสำหรับเทิร์นเอเจนต์ OpenClaw
แบบ embedded ให้เปิดใช้ Plugin `codex` แบบ bundled ก่อน และใส่ `codex` ลงใน
`plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด config ของ app-server แบบเนทีฟ
ควรใช้ `openai/gpt-*` ร่วมกับ `embeddedHarness.runtime: "codex"`
ให้ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI แทน ส่วน model ref แบบเก่า `codex/*`
ยังคงเป็น alias เพื่อความเข้ากันได้สำหรับ harness แบบเนทีฟ

เมื่อโหมดนี้ทำงาน Codex จะเป็นเจ้าของ thread id แบบเนทีฟ พฤติกรรมการ resume,
Compaction และการทำงานของ app-server ส่วน OpenClaw ยังคงเป็นเจ้าของ chat channel,
transcript mirror ที่มองเห็นได้, นโยบายเครื่องมือ, approvals, การส่งสื่อ และการเลือกเซสชัน
ให้ใช้ `embeddedHarness.runtime: "codex"` ร่วมกับ
`embeddedHarness.fallback: "none"` เมื่อต้องการพิสูจน์ว่าเฉพาะเส้นทาง Codex
app-server เท่านั้นที่สามารถรับงานรันได้ config นี้เป็นเพียงตัวป้องกันการเลือกเท่านั้น:
ความล้มเหลวของ Codex app-server จะล้มเหลวโดยตรงอยู่แล้วแทนที่จะลองใหม่ผ่าน PI

## ปิด PI fallback

โดยค่าเริ่มต้น OpenClaw จะรันเอเจนต์แบบ embedded โดยตั้ง `agents.defaults.embeddedHarness`
เป็น `{ runtime: "auto", fallback: "pi" }` ในโหมด `auto` Plugin harness
ที่ลงทะเบียนไว้สามารถรับคู่ provider/model ได้ หากไม่มีตัวใดตรง OpenClaw จะ fallback ไปยัง PI

ให้ตั้ง `fallback: "none"` เมื่อต้องการให้การไม่สามารถเลือก Plugin harness
ล้มเหลวแทนการใช้ PI ความล้มเหลวของ Plugin harness ที่ถูกเลือกแล้วจะล้มเหลวแบบ hard อยู่แล้ว
การตั้งค่านี้ไม่บล็อก `runtime: "pi"` แบบชัดเจน หรือ `OPENCLAW_AGENT_RUNTIME=pi`

สำหรับการรัน embedded แบบ Codex เท่านั้น:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

หากคุณต้องการให้ Plugin harness ที่ลงทะเบียนไว้ตัวใดก็ได้เข้ารับโมเดลที่ตรงกัน
แต่ไม่ต้องการให้ OpenClaw fallback ไปยัง PI แบบเงียบ ๆ เลย ให้คง `runtime: "auto"`
ไว้และปิด fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

การ override รายเอเจนต์ใช้รูปแบบเดียวกัน:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ยังคง override runtime ที่ตั้งค่าไว้ ให้ใช้
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อปิด PI fallback จากสภาพแวดล้อม

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback เซสชันจะล้มเหลวตั้งแต่ต้นหาก harness ที่ร้องขอไม่ได้ถูกลงทะเบียน
ไม่รองรับ provider/model ที่ resolve แล้ว หรือเกิดความล้มเหลวก่อนจะสร้างผลข้างเคียงของเทิร์น
ซึ่งเป็นพฤติกรรมที่ตั้งใจไว้สำหรับการติดตั้งใช้งานแบบ Codex เท่านั้น และสำหรับการทดสอบแบบ live
ที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะ agent harness แบบ embedded เท่านั้น มันไม่ได้ปิดการกำหนดเส้นทางโมเดล
เฉพาะผู้ให้บริการสำหรับภาพ วิดีโอ เพลง TTS PDF หรือความสามารถอื่น

## เซสชันแบบเนทีฟและ transcript mirror

harness อาจเก็บ native session id, thread id หรือ resume token ฝั่ง daemon
ให้คงการผูกความสัมพันธ์นี้ไว้กับเซสชัน OpenClaw อย่างชัดเจน และคงการ mirror
ผลลัพธ์ assistant/tool ที่ผู้ใช้มองเห็นได้กลับเข้าไปใน transcript ของ OpenClaw

transcript ของ OpenClaw ยังคงเป็นชั้นความเข้ากันได้สำหรับ:

- ประวัติเซสชันที่มองเห็นได้ใน channel
- การค้นหาและทำดัชนี transcript
- การสลับกลับไปใช้ harness PI ที่มีมาในระบบในเทิร์นถัดไป
- พฤติกรรม `/new`, `/reset` และการลบเซสชันแบบทั่วไป

หาก harness ของคุณเก็บการผูกแบบ sidecar ให้ implement `reset(...)` เพื่อให้ OpenClaw
ล้างข้อมูลนั้นได้เมื่อมีการรีเซ็ตเซสชัน OpenClaw ที่เป็นเจ้าของ

## ผลลัพธ์ของเครื่องมือและสื่อ

Core จะสร้างรายการเครื่องมือของ OpenClaw และส่งเข้าไปยัง attempt ที่เตรียมไว้
เมื่อ harness เรียกใช้ dynamic tool call ให้ส่งผลลัพธ์ของเครื่องมือกลับผ่าน
รูปแบบผลลัพธ์ของ harness แทนการส่งสื่อผ่าน channel ด้วยตัวเอง

สิ่งนี้ช่วยให้ผลลัพธ์จากข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และเครื่องมือรับส่งข้อความ
อยู่บนเส้นทางการส่งเดียวกันกับการรันที่ใช้ PI

## ข้อจำกัดปัจจุบัน

- พาธ import สาธารณะเป็นแบบทั่วไป แต่ alias ของชนิด attempt/result บางตัวยังคงมีชื่อ `Pi` เพื่อความเข้ากันได้
- การติดตั้ง harness แบบ third-party ยังเป็นแบบทดลอง ควรใช้ Provider plugin
  จนกว่าจะจำเป็นต้องมีรันไทม์เซสชันแบบเนทีฟ
- รองรับการสลับ harness ข้ามเทิร์นได้ อย่าสลับ harness กลางเทิร์นหลังจากที่เครื่องมือแบบเนทีฟ
  approvals ข้อความ assistant หรือการส่งข้อความได้เริ่มขึ้นแล้ว

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview)
- [Runtime Helpers](/th/plugins/sdk-runtime)
- [Provider Plugins](/th/plugins/sdk-provider-plugins)
- [Codex Harness](/th/plugins/codex-harness)
- [Model Providers](/th/concepts/model-providers)
