---
read_when:
    - คุณกำลังเปลี่ยน embedded agent runtime หรือรีจิสทรีของ harness【อ่านข้อความเต็มanalysis to=final code  omitted بسبب translation-only instruction? Need answer only translated text.
    - คุณกำลังลงทะเบียน agent harness จาก Plugin ที่ bundled มาหรือเชื่อถือได้
    - คุณต้องการทำความเข้าใจว่า Codex Plugin เชื่อมโยงกับ model providers อย่างไร
sidebarTitle: Agent Harness
summary: พื้นผิว SDK แบบ experimental สำหรับ Plugins ที่เข้ามาแทนตัวรัน embedded agent ระดับล่าง
title: Agent Harness Plugins
x-i18n:
    generated_at: "2026-04-23T05:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Agent Harness Plugins

**Agent harness** คือ executor ระดับล่างสำหรับหนึ่งเทิร์นของเอเจนต์ OpenClaw ที่ถูกเตรียมไว้แล้ว
มันไม่ใช่ model provider, ไม่ใช่ช่องทาง และไม่ใช่ registry ของเครื่องมือ

ให้ใช้พื้นผิวนี้เฉพาะกับ native Plugins ที่ bundled มาหรือเชื่อถือได้เท่านั้น สัญญานี้
ยังคงเป็นแบบ experimental เพราะประเภทของพารามิเตอร์ตั้งใจให้สะท้อน runner แบบ embedded ในปัจจุบัน

## ควรใช้ harness เมื่อใด

ให้ลงทะเบียน agent harness เมื่อ model family หนึ่งมี session
runtime แบบ native ของตัวเอง และ transport แบบ provider ปกติของ OpenClaw เป็น abstraction ที่ไม่เหมาะ

ตัวอย่าง:

- native coding-agent server ที่เป็นเจ้าของ threads และ Compaction
- local CLI หรือ daemon ที่ต้องสตรีม native plan/reasoning/tool events
- model runtime ที่ต้องมี resume id ของตัวเองเพิ่มเติมจาก
  session transcript ของ OpenClaw

**อย่า** ลงทะเบียน harness เพียงเพื่อเพิ่ม LLM API ใหม่ สำหรับ model APIs แบบ HTTP หรือ
WebSocket ปกติ ให้สร้าง [provider Plugin](/th/plugins/sdk-provider-plugins)

## สิ่งที่ core ยังคงเป็นเจ้าของ

ก่อนที่ harness จะถูกเลือก OpenClaw ได้ resolve สิ่งเหล่านี้ไปแล้ว:

- provider และโมเดล
- สถานะ auth ของรันไทม์
- ระดับการคิดและงบประมาณบริบท
- transcript/session file ของ OpenClaw
- workspace, sandbox และนโยบายเครื่องมือ
- channel reply callbacks และ streaming callbacks
- นโยบาย model fallback และการสลับโมเดลแบบสด

การแยกแบบนี้เกิดขึ้นโดยตั้งใจ Harness จะรันความพยายามที่ถูกเตรียมไว้แล้ว; มันจะไม่เลือก
providers, ไม่แทนที่การส่งผ่านช่องทาง และไม่สลับโมเดลแบบเงียบๆ

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
    // เริ่มหรือกลับไปยัง native thread ของคุณ
    // ใช้ params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent และฟิลด์ความพยายามที่เตรียมไว้ตัวอื่นๆ
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

OpenClaw จะเลือก harness หลังจาก resolve provider/model แล้ว:

1. `OPENCLAW_AGENT_RUNTIME=<id>` จะบังคับใช้ registered harness ที่มี id นั้น
2. `OPENCLAW_AGENT_RUNTIME=pi` จะบังคับใช้ PI harness ที่มีมาในตัว
3. `OPENCLAW_AGENT_RUNTIME=auto` จะถาม registered harnesses ว่ารองรับ
   provider/model ที่ resolve แล้วหรือไม่
4. หากไม่มี registered harness ตัวใดตรง OpenClaw จะใช้ PI เว้นแต่ PI fallback
   จะถูกปิดไว้

ความล้มเหลวของ plugin harness จะถูกแสดงเป็นความล้มเหลวของการรัน ในโหมด `auto` จะใช้ PI fallback
เฉพาะเมื่อไม่มี registered plugin harness ตัวใดรองรับ
provider/model ที่ resolve แล้ว เมื่อ plugin harness ได้ claim การรันไปแล้ว OpenClaw จะไม่ replay เทิร์นเดิมนั้นผ่าน PI เพราะนั่นอาจเปลี่ยน semantics ของ auth/runtime
หรือทำให้ side effects ซ้ำซ้อน

bundled Codex Plugin จะลงทะเบียน `codex` เป็น harness id ของมัน โดย core มองสิ่งนี้
เป็นเพียง plugin harness id ปกติ; aliases ที่เฉพาะกับ Codex ควรอยู่ใน Plugin
หรือใน operator config ไม่ใช่ในตัวเลือก runtime ร่วม

## การจับคู่ provider กับ harness

harness ส่วนใหญ่ควรลงทะเบียน provider ด้วย Provider จะทำให้ model refs,
สถานะ auth, metadata ของโมเดล และการเลือกผ่าน `/model` ถูกมองเห็นได้โดยส่วนอื่นของ
OpenClaw จากนั้น harness ค่อย claim provider นั้นใน `supports(...)`

bundled Codex Plugin ใช้รูปแบบนี้:

- provider id: `codex`
- user model refs: `codex/gpt-5.4`, `codex/gpt-5.2` หรือโมเดลอื่นที่คืนมา
  โดย Codex app server
- harness id: `codex`
- auth: ความพร้อมใช้งานของ provider แบบสังเคราะห์ เพราะ Codex harness เป็นเจ้าของ
  native Codex login/session
- คำขอไปยัง app-server: OpenClaw จะส่ง bare model id ไปยัง Codex แล้วปล่อยให้
  harness คุยกับ native app-server protocol

Codex Plugin เป็นแบบ additive refs แบบ `openai/gpt-*` ปกติยังคงเป็น OpenAI provider
refs และยังคงใช้ provider path ปกติของ OpenClaw ให้เลือก `codex/gpt-*`
เมื่อคุณต้องการ auth ที่ Codex จัดการ, การค้นพบโมเดลของ Codex, native threads และ
การรันผ่าน Codex app-server โดย `/model` สามารถสลับระหว่างโมเดล Codex ที่ Codex app server คืนค่ามาได้ โดยไม่ต้องใช้ OpenAI provider credentials

สำหรับการตั้งค่าระดับ operator, ตัวอย่าง model prefix และ configs แบบ Codex-only โปรดดู
[Codex Harness](/th/plugins/codex-harness)

OpenClaw ต้องใช้ Codex app-server `0.118.0` หรือใหม่กว่า โดย Codex Plugin จะตรวจสอบ
app-server initialize handshake และบล็อกเซิร์ฟเวอร์ที่เก่ากว่าหรือไม่มีเวอร์ชัน เพื่อให้
OpenClaw รันเฉพาะกับพื้นผิว protocol ที่มันถูกทดสอบมาแล้วเท่านั้น

### มิดเดิลแวร์ tool-result ของ Codex app-server

bundled Plugins สามารถแนบมิดเดิลแวร์ `tool_result` ที่เฉพาะกับ Codex app-server ได้ผ่าน `api.registerCodexAppServerExtensionFactory(...)` เมื่อ manifest ของพวกมันประกาศ `contracts.embeddedExtensionFactories: ["codex-app-server"]`
นี่คือ seam สำหรับ trusted-plugin สำหรับการแปลง tool-result แบบ async ที่ต้อง
รันภายใน native Codex harness ก่อนที่ผลลัพธ์ของเครื่องมือจะถูกฉายกลับเข้า
ทรานสคริปต์ของ OpenClaw

### โหมด native Codex harness

bundled `codex` harness คือโหมด native Codex สำหรับ embedded OpenClaw
agent turns ให้เปิดใช้งาน bundled `codex` Plugin ก่อน และรวม `codex` ไว้ใน
`plugins.allow` หาก config ของคุณใช้ allowlist แบบจำกัด มันแตกต่างจาก `openai-codex/*`:

- `openai-codex/*` ใช้ ChatGPT/Codex OAuth ผ่าน provider
  path ปกติของ OpenClaw
- `codex/*` ใช้ bundled Codex provider และกำหนดเส้นทางของเทิร์นผ่าน Codex
  app-server

เมื่อโหมดนี้ทำงาน Codex จะเป็นเจ้าของ native thread id, พฤติกรรมการ resume,
Compaction และการรัน app-server ส่วน OpenClaw ยังคงเป็นเจ้าของ chat channel,
visible transcript mirror, นโยบายเครื่องมือ, approvals, การส่งสื่อ และ
การเลือก session ใช้ `embeddedHarness.runtime: "codex"` ร่วมกับ
`embeddedHarness.fallback: "none"` เมื่อต้องการพิสูจน์ว่าเฉพาะ
เส้นทาง Codex app-server เท่านั้นที่สามารถ claim การรันนี้ได้ config นี้เป็นเพียงเกตการเลือก:
ความล้มเหลวของ Codex app-server จะล้มเหลวโดยตรงอยู่แล้ว แทนที่จะ retry ผ่าน PI

## ปิด PI fallback

โดยค่าเริ่มต้น OpenClaw จะรัน embedded agents โดยตั้ง `agents.defaults.embeddedHarness`
เป็น `{ runtime: "auto", fallback: "pi" }` ในโหมด `auto`, registered plugin
harnesses สามารถ claim provider/model pair ได้ หากไม่มีตัวใดตรง OpenClaw จะ fallback ไปใช้ PI

ตั้ง `fallback: "none"` เมื่อต้องการให้การเลือก plugin harness ที่หายไปล้มเหลว
แทนที่จะไปใช้ PI โดยความล้มเหลวของ plugin harness ที่ถูกเลือกจะล้มเหลวแบบ hard อยู่แล้ว
สิ่งนี้ไม่ได้บล็อก `runtime: "pi"` แบบ explicit หรือ `OPENCLAW_AGENT_RUNTIME=pi`

สำหรับการรัน embedded แบบ Codex-only:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

หากคุณต้องการให้ registered plugin harness ใดก็ได้ claim โมเดลที่ตรงกัน แต่ไม่ต้องการให้ OpenClaw fallback ไปยัง PI แบบเงียบๆ เลย ให้คง `runtime: "auto"` และปิด fallback:

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

overrides รายเอเจนต์ใช้รูปแบบเดียวกัน:

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ยังคง override runtime ที่ตั้งค่าไว้ ใช้
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อปิด PI fallback จาก
environment

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback แล้ว session จะล้มเหลวตั้งแต่ต้นเมื่อ harness ที่ร้องขอไม่ได้ถูก
ลงทะเบียน, ไม่รองรับ provider/model ที่ resolve แล้ว หรือเกิดความล้มเหลวก่อน
จะสร้าง side effects ของเทิร์น นี่เป็นสิ่งที่ตั้งใจไว้สำหรับการติดตั้งแบบ Codex-only และ
สำหรับ live tests ที่ต้องพิสูจน์ว่าเส้นทาง Codex app-server ถูกใช้งานจริง

การตั้งค่านี้ควบคุมเฉพาะ embedded agent harness เท่านั้น มันไม่ได้ปิด
การกำหนดเส้นทางของโมเดลเฉพาะ provider สำหรับ image, video, music, TTS, PDF หรืออย่างอื่น

## Native sessions และ transcript mirror

Harness อาจเก็บ native session id, thread id หรือ daemon-side resume token ไว้
ให้คงการผูกนี้เชื่อมกับ session ของ OpenClaw อย่างชัดเจน และคงการ mirror
ผลลัพธ์ของ assistant/tool ที่ผู้ใช้มองเห็นได้เข้าไปในทรานสคริปต์ของ OpenClaw

ทรานสคริปต์ของ OpenClaw ยังคงเป็นเลเยอร์ compatibility สำหรับ:

- ประวัติ session ที่มองเห็นได้ในช่องทาง
- การค้นหาและทำดัชนีทรานสคริปต์
- การสลับกลับไปใช้ PI harness ที่มีมาในตัวในเทิร์นถัดไป
- พฤติกรรมทั่วไปของ `/new`, `/reset` และการลบ session

หาก harness ของคุณเก็บ sidecar binding ไว้ ให้ติดตั้ง `reset(...)` เพื่อให้ OpenClaw สามารถ
ล้างมันได้เมื่อ session เจ้าของใน OpenClaw ถูกรีเซ็ต

## ผลลัพธ์ของเครื่องมือและสื่อ

Core จะสร้างรายการเครื่องมือของ OpenClaw และส่งเข้าไปในความพยายามที่เตรียมไว้
เมื่อ harness รัน dynamic tool call ให้ส่งผลลัพธ์ของเครื่องมือกลับผ่าน
รูปแบบผลลัพธ์ของ harness แทนการส่งสื่อผ่านช่องทางด้วยตัวเอง

สิ่งนี้ทำให้ผลลัพธ์ของข้อความ, รูปภาพ, วิดีโอ, เพลง, TTS, approvals และ messaging-tool
อยู่บนเส้นทางการส่งเดียวกับการรันที่รองรับโดย PI

## ข้อจำกัดปัจจุบัน

- พาธ import แบบสาธารณะเป็นแบบทั่วไป แต่ aliases ของประเภท attempt/result บางตัวยังคง
  ใช้ชื่อ `Pi` เพื่อ compatibility
- การติดตั้ง harness จาก third-party ยังเป็นแบบ experimental ควรเลือก provider plugins
  ไปก่อน จนกว่าคุณจะต้องใช้ native session runtime จริงๆ
- รองรับการสลับ harness ข้ามหลายเทิร์น แต่อย่าสลับ harness
  กลางเทิร์นหลังจาก native tools, approvals, ข้อความ assistant หรือ message
  sends เริ่มต้นไปแล้ว

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview)
- [Runtime Helpers](/th/plugins/sdk-runtime)
- [Provider Plugins](/th/plugins/sdk-provider-plugins)
- [Codex Harness](/th/plugins/codex-harness)
- [Model Providers](/th/concepts/model-providers)
