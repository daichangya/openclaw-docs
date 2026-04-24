---
read_when:
    - คุณต้องการสร้าง Plugin OpenClaw ใหม่
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-04-24T09:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin ช่วยขยายความสามารถใหม่ให้กับ OpenClaw: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ
การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ, เครื่องมือเอเจนต์ หรือความสามารถเหล่านี้
ในชุดผสมใดก็ได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณเข้าไปในรีโพซิทอรี OpenClaw ให้เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) หรือ npm แล้วผู้ใช้จะติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลองใช้ ClawHub ก่อน
และสลับไปใช้ npm โดยอัตโนมัติหากจำเป็น

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- มีความคุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ภายในรีโพซิทอรี: โคลนรีโพซิทอรีแล้วและรัน `pnpm install` แล้ว

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, พร็อกซี หรือปลายทางแบบกำหนดเอง)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    ลงทะเบียนเครื่องมือเอเจนต์, event hook หรือบริการ — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Channel plugin ที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อกระบวนการ onboarding/setup
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งจะสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดเรื่องการติดตั้ง และปิดกั้นการเขียนค่าคอนฟิกจริงไว้ก่อน
จนกว่าจะติดตั้ง Plugin แล้ว

## เริ่มต้นอย่างรวดเร็ว: Tool plugin

ตัวอย่างนี้จะสร้าง Plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือเอเจนต์ Channel plugin
และ Provider plugin มีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

<Steps>
  <Step title="สร้างแพ็กเกจและ manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    ทุก Plugin ต้องมี manifest แม้จะไม่มีคอนฟิกก็ตาม ดู
    [Manifest](/th/plugins/manifest) สำหรับสคีมาฉบับเต็ม ส่วน snippet มาตรฐานสำหรับการเผยแพร่ไปยัง ClawHub
    อยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="เขียน entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` ใช้สำหรับ Plugin ที่ไม่ใช่ channel สำหรับ channel ให้ใช้
    `defineChannelPluginEntry` — ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือก entry point ทั้งหมด ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub แล้วจึงติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw จะตรวจสอบ ClawHub ก่อน npm ด้วยสำหรับสเปกแพ็กเกจแบบตรง เช่น
    `@myorg/openclaw-my-plugin`

    **Plugin ภายในรีโพซิทอรี:** วางไว้ใต้ทรี workspace ของ bundled plugin — ระบบจะค้นพบให้อัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้หลายรายการผ่านออบเจ็กต์ `api`:

| ความสามารถ             | เมธอดที่ใช้ลงทะเบียน                           | คู่มือโดยละเอียด                                                                |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM) | `api.registerProvider(...)`                    | [Provider Plugins](/th/plugins/sdk-provider-plugins)                               |
| แบ็กเอนด์การอนุมาน CLI | `api.registerCliBackend(...)`                  | [CLI Backends](/th/gateway/cli-backends)                                           |
| Channel / การรับส่งข้อความ | `api.registerChannel(...)`                  | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)     | `api.registerSpeechProvider(...)`              | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์      | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การทำความเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ           | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง          | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ         | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลเว็บ       | `api.registerWebFetchProvider(...)`            | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ           | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ส่วนขยาย Pi แบบฝังตัว | `api.registerEmbeddedExtensionFactory(...)`    | [SDK Overview](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือเอเจนต์      | `api.registerTool(...)`                        | ด้านล่าง                                                                        |
| คำสั่งแบบกำหนดเอง      | `api.registerCommand(...)`                     | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| Event hook             | `api.registerHook(...)`                        | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| เส้นทาง HTTP           | `api.registerHttpRoute(...)`                   | [Internals](/th/plugins/architecture-internals#gateway-http-routes)                |
| คำสั่งย่อย CLI         | `api.registerCli(...)`                         | [Entry Points](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนทั้งหมด ดู [SDK Overview](/th/plugins/sdk-overview#registration-api)

ใช้ `api.registerEmbeddedExtensionFactory(...)` เมื่อ Plugin ต้องใช้ hook ของ embedded-runner
แบบเนทีฟของ Pi เช่นการเขียน `tool_result` ใหม่แบบ async ก่อนที่ข้อความผลลัพธ์เครื่องมือสุดท้ายจะถูกส่งออก
ควรใช้ hook ของ Plugin ปกติของ OpenClaw เมื่องานนั้นไม่จำเป็นต้องใช้จังหวะการทำงานของส่วนขยาย Pi

หาก Plugin ของคุณลงทะเบียนเมธอด Gateway RPC แบบกำหนดเอง ให้คงไว้ภายใต้พรีฟิกซ์เฉพาะของ Plugin
namespace แอดมินของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ resolve ไปยัง
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

ความหมายของ hook guard ที่ควรทราบ:

- `before_tool_call`: `{ block: true }` เป็นผลลัพธ์สิ้นสุดและจะหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการทำงานของเอเจนต์ชั่วคราวและขอให้ผู้ใช้อนุมัติผ่าน exec approval overlay, ปุ่ม Telegram, Discord interactions หรือคำสั่ง `/approve` บนทุก channel
- `before_install`: `{ block: true }` เป็นผลลัพธ์สิ้นสุดและจะหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นผลลัพธ์สิ้นสุดและจะหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: ควรใช้ฟิลด์ `threadId` ที่มีชนิดกำกับเมื่อคุณต้องการกำหนดเส้นทางเธรด/หัวข้อขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะของ channel
- `message_sending`: ควรใช้ฟิลด์กำหนดเส้นทาง `replyToId` / `threadId` ที่มีชนิดกำกับแทนคีย์ metadata เฉพาะของ channel

คำสั่ง `/approve` รองรับทั้งการอนุมัติ exec และ Plugin พร้อม bounded fallback: เมื่อไม่พบ exec approval id
OpenClaw จะลองใช้ id เดิมนั้นอีกครั้งผ่านการอนุมัติของ Plugin การส่งต่อการอนุมัติ Plugin สามารถตั้งค่าแยกได้ผ่าน `approvals.plugin` ในคอนฟิก

หากระบบ approval แบบกำหนดเองของคุณจำเป็นต้องตรวจจับกรณี bounded fallback เดียวกันนั้น
ให้ใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงข้อความ approval-expiry ด้วยตนเอง

ดู [SDK Overview hook decision semantics](/th/plugins/sdk-overview#hook-decision-semantics) สำหรับรายละเอียด

## การลงทะเบียนเครื่องมือเอเจนต์

เครื่องมือคือฟังก์ชันที่มีชนิดกำกับซึ่ง LLM สามารถเรียกใช้ได้ โดยอาจเป็นแบบจำเป็น (พร้อมใช้งานเสมอ)
หรือแบบไม่บังคับ (ผู้ใช้ต้องเลือกเปิดใช้เอง):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

ผู้ใช้เปิดใช้เครื่องมือแบบไม่บังคับได้ในคอนฟิก:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือของ core (หากชนกันจะถูกข้าม)
- ใช้ `optional: true` สำหรับเครื่องมือที่มีผลข้างเคียงหรือต้องใช้ไบนารีเพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก Plugin หนึ่งได้โดยเพิ่ม id ของ Plugin ลงใน `tools.allow`

## ข้อตกลงการ import

ให้ import จากพาธแบบเจาะจง `openclaw/plugin-sdk/<subpath>` เสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับรายการ subpath อ้างอิงทั้งหมด ดู [SDK Overview](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การ import ภายใน — ห้าม import Plugin ของคุณเองผ่านพาธ SDK ของมัน

สำหรับ Provider plugin ให้เก็บ helper ที่เฉพาะกับผู้ให้บริการไว้ใน
barrel ระดับรากของแพ็กเกจเหล่านั้น เว้นแต่รอยต่อดังกล่าวจะเป็นแบบทั่วไปจริง ๆ ตัวอย่าง bundled ที่มีอยู่ตอนนี้:

- Anthropic: wrapper ของสตรีม Claude และ helper สำหรับ `service_tier` / beta
- OpenAI: ตัวสร้างผู้ให้บริการ, helper โมเดลเริ่มต้น, ผู้ให้บริการแบบเรียลไทม์
- OpenRouter: ตัวสร้างผู้ให้บริการ พร้อม helper สำหรับ onboarding/config

หาก helper ใช้งานได้เฉพาะภายในแพ็กเกจผู้ให้บริการแบบ bundled แพ็กเกจเดียว
ให้คงไว้ที่รอยต่อระดับรากของแพ็กเกจนั้น แทนที่จะย้ายขึ้นไปไว้ใน `openclaw/plugin-sdk/*`

บางรอยต่อ helper แบบสร้างอัตโนมัติใน `openclaw/plugin-sdk/<bundled-id>` ยังคงมีอยู่สำหรับ
การดูแลรักษา bundled-plugin และความเข้ากันได้ ตัวอย่างเช่น
`plugin-sdk/feishu-setup` หรือ `plugin-sdk/zalo-setup` ให้ถือว่าสิ่งเหล่านี้เป็น
surface ที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ Plugin ภายนอกแบบ third-party ตัวใหม่

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>Entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การ import ทั้งหมดใช้พาธแบบเจาะจง `plugin-sdk/<subpath>`</Check>
<Check>การ import ภายในใช้โมดูลภายในเครื่อง ไม่ใช่การ self-import ผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (สำหรับ Plugin ภายในรีโพซิทอรี)</Check>

## การทดสอบ Beta Release

1. เฝ้าดูแท็กรีลีสบน GitHub ของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครติดตามผ่าน `Watch` > `Releases` แท็กเบต้าจะมีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X อย่างเป็นทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศรีลีสได้เช่นกัน
2. ทดสอบ Plugin ของคุณกับแท็กเบต้าทันทีที่ปรากฏ ช่วงเวลาก่อน stable โดยทั่วไปมักมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบเสร็จ โดยระบุว่า `all good` หรืออธิบายสิ่งที่พัง หากคุณยังไม่มีเธรด ให้สร้างขึ้น
4. หากมีบางอย่างพัง ให้เปิด issue ใหม่หรืออัปเดต issue ที่มีชื่อว่า `Beta blocker: <plugin-name> - <summary>` และใส่ป้ายกำกับ `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยตั้งชื่อว่า `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ไว้ทั้งใน PR และในเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถใส่ป้ายกำกับ PR ได้ ดังนั้นชื่อเรื่องจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ Blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มีอาจถูกปล่อยออกไปอยู่ดี ผู้ดูแลจะติดตามเธรดเหล่านี้ระหว่างการทดสอบเบต้า
6. ถ้าเงียบแปลว่าผ่าน หากคุณพลาดช่วงเวลาไปแล้ว การแก้ไขของคุณก็มักจะไปลงในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Channel plugin สำหรับระบบรับส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Provider plugin สำหรับผู้ให้บริการโมเดล
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/th/plugins/sdk-overview">
    แผนที่การ import และข้อมูลอ้างอิง API การลงทะเบียน
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิงสคีมา manifest แบบเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [Plugin Architecture](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [SDK Overview](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ plugin manifest
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง Channel plugin
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง Provider plugin
