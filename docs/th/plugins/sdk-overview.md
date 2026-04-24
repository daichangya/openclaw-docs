---
read_when:
    - คุณต้องรู้ว่าควร import จาก subpath ใดของ SDK
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอดการลงทะเบียนทั้งหมดบน OpenClawPluginApi
    - คุณกำลังค้นหา export เฉพาะตัวของ SDK
sidebarTitle: SDK overview
summary: Import map, เอกสารอ้างอิง API สำหรับการลงทะเบียน และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:24:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK คือสัญญาแบบมีชนิดระหว่างปลั๊กอินกับแกนหลัก หน้านี้เป็นเอกสารอ้างอิงสำหรับ **สิ่งที่ควร import** และ **สิ่งที่คุณลงทะเบียนได้**

<Tip>
  กำลังมองหาคู่มือแบบ how-to อยู่หรือไม่?

- ปลั๊กอินตัวแรก? เริ่มที่ [Building plugins](/th/plugins/building-plugins)
- ปลั๊กอินช่องทางส่งข้อความ? ดู [Channel plugins](/th/plugins/sdk-channel-plugins)
- ปลั๊กอินผู้ให้บริการ? ดู [Provider plugins](/th/plugins/sdk-provider-plugins)
  </Tip>

## ข้อกำหนดในการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่แยกตัวเองได้ ซึ่งช่วยให้การเริ่มต้นทำได้รวดเร็วและ
ป้องกันปัญหาการพึ่งพาแบบวนรอบ สำหรับตัวช่วย entry/build ที่เฉพาะกับช่องทางส่งข้อความ
ควรเลือกใช้ `openclaw/plugin-sdk/channel-core`; ส่วน `openclaw/plugin-sdk/core`
ให้ใช้กับพื้นผิวแบบ umbrella ที่กว้างกว่าและตัวช่วยที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

<Warning>
  อย่า import convenience seam ที่ติดแบรนด์ผู้ให้บริการหรือช่องทางส่งข้อความ (เช่น
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  ปลั๊กอินแบบ bundled จะประกอบ subpath ของ SDK แบบทั่วไปไว้ภายใน barrel
  `api.ts` / `runtime-api.ts` ของตัวเอง; ฝั่งผู้ใช้แกนหลักควรใช้ barrel ภายในปลั๊กอินนั้น
  หรือเพิ่มสัญญา SDK แบบทั่วไปที่แคบและชัดเจนเมื่อมีความต้องการข้ามหลายช่องทางจริงๆ

seam ตัวช่วยของปลั๊กอินแบบ bundled จำนวนน้อย (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` และที่คล้ายกัน) ยังปรากฏอยู่ใน
export map ที่สร้างอัตโนมัติ สิ่งเหล่านี้มีไว้สำหรับการดูแลปลั๊กอินแบบ bundled เท่านั้น และไม่ใช่เส้นทาง import ที่แนะนำสำหรับปลั๊กอินภายนอกใหม่
</Warning>

## เอกสารอ้างอิง subpath

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบที่จัดกลุ่มตามพื้นที่ใช้งาน (plugin
entry, channel, provider, auth, runtime, capability, memory และตัวช่วยที่สงวนไว้สำหรับปลั๊กอินแบบ bundled) สำหรับแค็ตตาล็อกฉบับเต็ม — ที่จัดกลุ่มและลิงก์ไว้แล้ว — ดู
[Plugin SDK subpaths](/th/plugins/sdk-subpaths)

รายการที่สร้างอัตโนมัติซึ่งมีมากกว่า 200 subpaths อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

## API การลงทะเบียน

callback `register(api)` จะได้รับอ็อบเจ็กต์ `OpenClawPluginApi` ที่มีเมธอดต่อไปนี้:

### การลงทะเบียนความสามารถ

| เมธอด | สิ่งที่ลงทะเบียน |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)` | การอนุมานข้อความ (LLM) |
| `api.registerAgentHarness(...)` | ตัวรันเอเจนต์ระดับล่างแบบทดลอง |
| `api.registerCliBackend(...)` | แบ็กเอนด์ CLI สำหรับการอนุมานในเครื่อง |
| `api.registerChannel(...)` | ช่องทางส่งข้อความ |
| `api.registerSpeechProvider(...)` | การสังเคราะห์ข้อความเป็นเสียง / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบเรียลไทม์ชนิดสตรีม |
| `api.registerRealtimeVoiceProvider(...)` | เซสชันเสียงแบบเรียลไทม์สองทาง |
| `api.registerMediaUnderstandingProvider(...)` | การวิเคราะห์ภาพ/เสียง/วิดีโอ |
| `api.registerImageGenerationProvider(...)` | การสร้างภาพ |
| `api.registerMusicGenerationProvider(...)` | การสร้างเพลง |
| `api.registerVideoGenerationProvider(...)` | การสร้างวิดีโอ |
| `api.registerWebFetchProvider(...)` | ผู้ให้บริการ web fetch / scrape |
| `api.registerWebSearchProvider(...)` | การค้นหาเว็บ |

### เครื่องมือและคำสั่ง

| เมธอด | สิ่งที่ลงทะเบียน |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | เครื่องมือเอเจนต์ (บังคับหรือ `{ optional: true }`) |
| `api.registerCommand(def)` | คำสั่งแบบกำหนดเอง (ข้าม LLM) |

### โครงสร้างพื้นฐาน

| เมธอด | สิ่งที่ลงทะเบียน |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)` | hook ของเหตุการณ์ |
| `api.registerHttpRoute(params)` | endpoint HTTP ของ Gateway |
| `api.registerGatewayMethod(name, handler)` | เมธอด RPC ของ Gateway |
| `api.registerGatewayDiscoveryService(service)` | ตัวประกาศการค้นพบ Gateway ในเครื่อง |
| `api.registerCli(registrar, opts?)` | คำสั่งย่อย CLI |
| `api.registerService(service)` | บริการเบื้องหลัง |
| `api.registerInteractiveHandler(registration)` | interactive handler |
| `api.registerEmbeddedExtensionFactory(factory)` | โรงงาน extension ของตัวรันแบบฝังของ Pi |
| `api.registerMemoryPromptSupplement(builder)` | ส่วน prompt ที่เพิ่มเข้าไปข้างเคียงกับหน่วยความจำ |
| `api.registerMemoryCorpusSupplement(adapter)` | corpus สำหรับค้นหา/อ่านหน่วยความจำที่เพิ่มเข้าไป |

<Note>
  namespace สำหรับแอดมินของแกนหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) จะยังคงเป็น `operator.admin` เสมอ แม้ว่าปลั๊กอินจะพยายามกำหนด
  scope ของ gateway method ให้แคบกว่า ควรใช้ prefix ที่เฉพาะกับปลั๊กอินสำหรับ
  เมธอดที่ปลั๊กอินเป็นเจ้าของ
</Note>

<Accordion title="ควรใช้ registerEmbeddedExtensionFactory เมื่อใด">
  ใช้ `api.registerEmbeddedExtensionFactory(...)` เมื่อปลั๊กอินต้องการจังหวะเหตุการณ์แบบเนทีฟของ Pi
  ระหว่างการรันแบบฝังของ OpenClaw — ตัวอย่างเช่น การเขียนซ้ำ `tool_result`
  แบบ async ที่ต้องเกิดขึ้นก่อนที่ข้อความผลลัพธ์ของเครื่องมือสุดท้ายจะถูกปล่อยออกมา

นี่เป็น seam สำหรับปลั๊กอินแบบ bundled ในปัจจุบัน: มีเพียงปลั๊กอินแบบ bundled เท่านั้นที่ลงทะเบียนได้
และปลั๊กอินต้องประกาศ `contracts.embeddedExtensionFactories: ["pi"]` ใน
`openclaw.plugin.json` ให้ใช้ hook ปกติของปลั๊กอิน OpenClaw สำหรับทุกสิ่งที่
ไม่ต้องการ seam ระดับล่างนี้
</Accordion>

### การลงทะเบียนการค้นพบ Gateway

`api.registerGatewayDiscoveryService(...)` ให้ปลั๊กอินประกาศ Gateway ที่กำลังทำงานอยู่
บนทรานสปอร์ตการค้นพบในเครื่อง เช่น mDNS/Bonjour OpenClaw จะเรียก service นี้
ระหว่างการเริ่มต้น Gateway เมื่อเปิดใช้การค้นพบในเครื่อง ส่งพอร์ต Gateway ปัจจุบันและ
ข้อมูล TXT hint ที่ไม่เป็นความลับให้ และเรียก handler `stop` ที่คืนกลับมา
ระหว่างการปิด Gateway

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

ปลั๊กอินการค้นพบ Gateway ต้องไม่ปฏิบัติต่อค่า TXT ที่ประกาศเป็นความลับหรือข้อมูลยืนยันตัวตน
การค้นพบเป็นเพียง hint สำหรับการกำหนดเส้นทาง; ความเชื่อถือยังคงเป็นหน้าที่ของ
การยืนยันตัวตนของ Gateway และ TLS pinning

### ข้อมูลเมตาสำหรับการลงทะเบียน CLI

`api.registerCli(registrar, opts?)` ยอมรับข้อมูลเมตาระดับบนได้สองชนิด:

- `commands`: รากคำสั่งที่ registrar เป็นเจ้าของโดยระบุชัดเจน
- `descriptors`: ตัวบรรยายคำสั่งในช่วง parse ที่ใช้สำหรับ help ของ CLI ราก,
  การกำหนดเส้นทาง และการลงทะเบียน CLI ของปลั๊กอินแบบ lazy

หากคุณต้องการให้คำสั่งของปลั๊กอินยังคงเป็น lazy-loaded บนเส้นทาง CLI รากปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมรากคำสั่งระดับบนทั้งหมดที่ registrar นี้เปิดเผย

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "จัดการบัญชี Matrix การยืนยัน อุปกรณ์ และสถานะโปรไฟล์",
        hasSubcommands: true,
      },
    ],
  },
);
```

ให้ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการการลงทะเบียน CLI รากแบบ lazy
เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับอยู่ แต่จะไม่ติดตั้ง placeholder
ที่รองรับ descriptor สำหรับการโหลดแบบ lazy ในช่วง parse

### การลงทะเบียนแบ็กเอนด์ CLI

`api.registerCliBackend(...)` ให้ปลั๊กอินเป็นเจ้าของ config เริ่มต้นของแบ็กเอนด์ AI CLI
ในเครื่อง เช่น `codex-cli`

- `id` ของแบ็กเอนด์จะกลายเป็น prefix ของผู้ให้บริการใน model ref เช่น `codex-cli/gpt-5`
- `config` ของแบ็กเอนด์ใช้โครงสร้างเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีลำดับความสำคัญสูงกว่า OpenClaw จะรวม `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของปลั๊กอินก่อนรัน CLI
- ใช้ `normalizeConfig` เมื่อแบ็กเอนด์ต้องการการเขียนความเข้ากันได้ใหม่หลังการรวมค่า
  (เช่น การ normalize รูปแบบ flag แบบเก่า)

### สล็อตแบบเอกสิทธิ์

| เมธอด | สิ่งที่ลงทะเบียน |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | เอนจินบริบท (มีได้ทีละตัวที่ทำงานอยู่) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้เอนจินสามารถปรับแต่งส่วนเสริมของ prompt ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถด้านหน่วยความจำแบบรวมศูนย์ |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วน prompt ของหน่วยความจำ |
| `api.registerMemoryFlushPlan(resolver)` | ตัวแก้แผน flush ของหน่วยความจำ |
| `api.registerMemoryRuntime(runtime)` | adapter runtime ของหน่วยความจำ |

### adapter สำหรับ embedding ของหน่วยความจำ

| เมธอด | สิ่งที่ลงทะเบียน |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding ของหน่วยความจำสำหรับปลั๊กอินที่ทำงานอยู่ |

- `registerMemoryCapability` คือ API ที่แนะนำสำหรับปลั๊กอินหน่วยความจำแบบเอกสิทธิ์
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)` ได้ด้วย
  เพื่อให้ปลั๊กอินคู่ทำงานสามารถใช้ artifact ของหน่วยความจำที่ส่งออกผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึงเลย์เอาต์ส่วนตัวของ
  ปลั๊กอินหน่วยความจำตัวใดตัวหนึ่งโดยตรง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API ของปลั๊กอินหน่วยความจำแบบเอกสิทธิ์ที่ยังคงเข้ากันได้กับระบบเดิม
- `registerMemoryEmbeddingProvider` ให้ปลั๊กอินหน่วยความจำที่ทำงานอยู่ลงทะเบียน id ของ adapter embedding ได้หนึ่งตัวหรือหลายตัว (เช่น `openai`, `gemini` หรือ id แบบกำหนดเองของปลั๊กอิน)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve เทียบกับ id ของ adapter ที่ลงทะเบียนไว้เหล่านั้น

### เหตุการณ์และวงจรชีวิต

| เมธอด | สิ่งที่ทำ |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)` | lifecycle hook แบบมีชนิด |
| `api.onConversationBindingResolved(handler)` | callback เมื่อ conversation binding ถูก resolve |

### ความหมายของการตัดสินใจของ hook

- `before_tool_call`: การคืนค่า `{ block: true }` ถือเป็นผลลัพธ์สิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block` ออก) ไม่ใช่การ override
- `before_install`: การคืนค่า `{ block: true }` ถือเป็นผลลัพธ์สิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การคืนค่า `{ block: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `block` ออก) ไม่ใช่การ override
- `reply_dispatch`: การคืนค่า `{ handled: true, ... }` ถือเป็นผลลัพธ์สิ้นสุด เมื่อ handler ใดอ้างสิทธิ์การ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทาง dispatch ของโมเดลแบบค่าเริ่มต้นจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: true }` ถือเป็นผลลัพธ์สิ้นสุด เมื่อ handler ใดตั้งค่านี้แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ (เหมือนกับการละ `cancel` ออก) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบมีชนิดเมื่อคุณต้องการการกำหนดเส้นทาง thread/topic ขาเข้า ให้ `metadata` คงไว้สำหรับข้อมูลเสริมเฉพาะช่องทางส่งข้อความ
- `message_sending`: ใช้ฟิลด์การกำหนดเส้นทาง `replyToId` / `threadId` แบบมีชนิดก่อนค่อย fallback ไปใช้ `metadata` เฉพาะช่องทางส่งข้อความ
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ Gateway เป็นเจ้าของ แทนการอาศัย hook ภายใน `gateway:startup`

### ฟิลด์ของอ็อบเจ็กต์ API

| ฟิลด์ | ชนิด | คำอธิบาย |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | id ของปลั๊กอิน |
| `api.name` | `string` | ชื่อที่ใช้แสดงผล |
| `api.version` | `string?` | เวอร์ชันของปลั๊กอิน (ไม่บังคับ) |
| `api.description` | `string?` | คำอธิบายปลั๊กอิน (ไม่บังคับ) |
| `api.source` | `string` | พาธต้นทางของปลั๊กอิน |
| `api.rootDir` | `string?` | ไดเรกทอรีรากของปลั๊กอิน (ไม่บังคับ) |
| `api.config` | `OpenClawConfig` | snapshot ของ config ปัจจุบัน (เป็น snapshot ของ runtime ในหน่วยความจำที่กำลังใช้งานอยู่เมื่อมี) |
| `api.pluginConfig` | `Record<string, unknown>` | config เฉพาะปลั๊กอินจาก `plugins.entries.<id>.config` |
| `api.runtime` | `PluginRuntime` | [ตัวช่วย runtime](/th/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`) |
| `api.registrationMode` | `PluginRegistrationMode` | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าก่อนเข้า full-entry แบบ lightweight |
| `api.resolvePath(input)` | `(string) => string` | resolve พาธโดยอิงจากรากของปลั๊กอิน |

## ข้อกำหนดสำหรับโมดูลภายใน

ภายในปลั๊กอินของคุณ ให้ใช้ไฟล์ barrel ภายในสำหรับการ import:

```text
my-plugin/
  api.ts            # export สาธารณะสำหรับผู้ใช้ภายนอก
  runtime-api.ts    # export runtime ภายในเท่านั้น
  index.ts          # entry point ของปลั๊กอิน
  setup-entry.ts    # entry สำหรับ setup อย่างเดียวแบบ lightweight (ไม่บังคับ)
```

<Warning>
  ห้าม import ปลั๊กอินของตัวเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จากโค้ด production โดยเด็ดขาด ให้กำหนดเส้นทางการ import ภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธ SDK เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของปลั๊กอินแบบ bundled ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะอื่นที่คล้ายกัน) จะเลือกใช้
snapshot ของ config runtime ที่กำลังทำงานอยู่เมื่อ OpenClaw รันอยู่แล้ว หากยังไม่มี
snapshot ของ runtime ระบบจะ fallback ไปใช้ไฟล์ config บนดิสก์ที่ resolve ได้

ปลั๊กอินผู้ให้บริการสามารถเปิดเผย barrel สัญญาแบบ local ของปลั๊กอินที่แคบได้ เมื่อ
helper ใดถูกตั้งใจให้เฉพาะกับผู้ให้บริการนั้นจริงๆ และยังไม่เหมาะจะอยู่ใน subpath ของ SDK แบบทั่วไป ตัวอย่างของ bundled:

- **Anthropic**: seam สาธารณะ `api.ts` / `contract-api.ts` สำหรับ helper ของ
  Claude beta-header และสตรีม `service_tier`
- **`@openclaw/openai-provider`**: `api.ts` export ตัวสร้างผู้ให้บริการ,
  helper สำหรับโมเดลเริ่มต้น และตัวสร้างผู้ให้บริการแบบ realtime
- **`@openclaw/openrouter-provider`**: `api.ts` export ตัวสร้างผู้ให้บริการ
  พร้อม helper สำหรับ onboarding/config

<Warning>
  โค้ด production ของส่วนขยายควรหลีกเลี่ยงการ import
  `openclaw/plugin-sdk/<other-plugin>` ด้วยเช่นกัน หาก helper ใดใช้ร่วมกันจริง
  ให้ย้ายขึ้นไปเป็น subpath ของ SDK แบบเป็นกลาง เช่น `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` หรือพื้นผิวอื่นที่ยึดตามความสามารถ แทนการผูกปลั๊กอินสองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="จุดเริ่มต้น" icon="door-open" href="/th/plugins/sdk-entrypoints">
    ตัวเลือกของ `definePluginEntry` และ `defineChannelPluginEntry`
  </Card>
  <Card title="ตัวช่วย runtime" icon="gears" href="/th/plugins/sdk-runtime">
    เอกสารอ้างอิง namespace `api.runtime` แบบเต็ม
  </Card>
  <Card title="การตั้งค่าและ config" icon="sliders" href="/th/plugins/sdk-setup">
    การแพ็กเกจ manifests และสคีมา config
  </Card>
  <Card title="การทดสอบ" icon="vial" href="/th/plugins/sdk-testing">
    ยูทิลิตีทดสอบและกฎ lint
  </Card>
  <Card title="การย้าย SDK" icon="arrows-turn-right" href="/th/plugins/sdk-migration">
    การย้ายออกจากพื้นผิวที่เลิกใช้แล้ว
  </Card>
  <Card title="ภายในของปลั๊กอิน" icon="diagram-project" href="/th/plugins/architecture">
    สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
  </Card>
</CardGroup>
