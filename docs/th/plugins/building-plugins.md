---
read_when:
    - คุณต้องการสร้าง Plugin ใหม่ของ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ tool หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin แรกของ OpenClaw ของคุณได้ในไม่กี่นาที
title: การสร้าง Plugins
x-i18n:
    generated_at: "2026-04-23T05:46:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# การสร้าง Plugins

Plugins ใช้ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, web fetch, web search, agent tools หรือการผสมผสานแบบใดก็ได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณเข้าไปในรีโปของ OpenClaw ให้เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) หรือ npm แล้วผู้ใช้จะติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลอง ClawHub ก่อน และ
fallback ไปยัง npm โดยอัตโนมัติ

## ข้อกำหนดเบื้องต้น

- Node >= 22 และ package manager (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ภายในรีโป: ต้องโคลนรีโปและรัน `pnpm install` แล้ว

## Plugin แบบไหน?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อม OpenClaw เข้ากับแพลตฟอร์มส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    ลงทะเบียน agent tools, event hooks หรือ services — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

หาก channel plugin เป็นแบบไม่บังคับและอาจยังไม่ถูกติดตั้งเมื่อรัน onboarding/setup
ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` มันจะสร้าง setup adapter + wizard คู่กัน
ที่ประกาศว่าต้องติดตั้งก่อน และจะ fail-closed สำหรับการเขียนคอนฟิกจริง
จนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: tool plugin

คู่มือนี้จะสร้าง Plugin ขั้นต่ำที่ลงทะเบียน agent tool หนึ่งตัว ส่วน channel
plugin และ provider plugin มีคู่มือเฉพาะแยกต่างหากตามลิงก์ด้านบน

<Steps>
  <Step title="สร้าง package และ manifest">
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
    [Manifest](/th/plugins/manifest) สำหรับ schema แบบเต็ม ส่วน snippet มาตรฐานสำหรับการเผยแพร่ไปยัง ClawHub
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

    `definePluginEntry` ใช้สำหรับ Plugin ที่ไม่ใช่ช่องทาง สำหรับช่องทาง ให้ใช้
    `defineChannelPluginEntry` — ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือกของ entry point แบบเต็ม ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugins ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub จากนั้นติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ยังตรวจสอบ ClawHub ก่อน npm สำหรับ package spec แบบเปล่าอย่าง
    `@myorg/openclaw-my-plugin` ด้วย

    **Plugins ภายในรีโป:** วางไว้ใต้ต้นไม้ workspace ของ bundled plugin — ระบบจะค้นพบให้อัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้หลายแบบผ่านอ็อบเจ็กต์ `api`:

| ความสามารถ            | เมธอดการลงทะเบียน                           | คู่มือโดยละเอียด                                                                 |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Text inference (LLM)  | `api.registerProvider(...)`                 | [Provider Plugins](/th/plugins/sdk-provider-plugins)                                |
| CLI inference backend | `api.registerCliBackend(...)`               | [CLI Backends](/th/gateway/cli-backends)                                            |
| Channel / messaging   | `api.registerChannel(...)`                  | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                  |
| Speech (TTS/STT)      | `api.registerSpeechProvider(...)`           | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice        | `api.registerRealtimeVoiceProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Media understanding   | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Image generation      | `api.registerImageGenerationProvider(...)`  | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Music generation      | `api.registerMusicGenerationProvider(...)`  | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Video generation      | `api.registerVideoGenerationProvider(...)`  | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web fetch             | `api.registerWebFetchProvider(...)`         | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web search            | `api.registerWebSearchProvider(...)`        | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Embedded Pi extension | `api.registerEmbeddedExtensionFactory(...)` | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                            |
| Agent tools           | `api.registerTool(...)`                     | ด้านล่าง                                                                        |
| คำสั่งแบบกำหนดเอง    | `api.registerCommand(...)`                  | [Entry Points](/th/plugins/sdk-entrypoints)                                         |
| Event hooks           | `api.registerHook(...)`                     | [Entry Points](/th/plugins/sdk-entrypoints)                                         |
| HTTP routes           | `api.registerHttpRoute(...)`                | [Internals](/th/plugins/architecture#gateway-http-routes)                           |
| CLI subcommands       | `api.registerCli(...)`                      | [Entry Points](/th/plugins/sdk-entrypoints)                                         |

สำหรับ Registration API แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

ใช้ `api.registerEmbeddedExtensionFactory(...)` เมื่อ Plugin ต้องการ
hook ของ embedded-runner แบบ native ของ Pi เช่น การ rewrite `tool_result` แบบ async ก่อนที่ข้อความผลลัพธ์ของ tool ขั้นสุดท้ายจะถูกปล่อยออกมา ควรใช้ hook ของ Plugin แบบปกติของ OpenClaw หากงานนั้นไม่ต้องอาศัยจังหวะเวลาระดับ extension ของ Pi

หาก Plugin ของคุณลงทะเบียนเมธอด Gateway RPC แบบกำหนดเอง ให้คงไว้บน
คำนำหน้าเฉพาะของ Plugin namespace admin หลักของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ resolve ไปที่
`operator.admin` เสมอ แม้ Plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

ความหมายของ guard ใน hook ที่ควรจำไว้:

- `before_tool_call`: `{ block: true }` เป็นผลลัพธ์สุดท้ายและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการรันของเอเจนต์ชั่วคราว และขอการอนุมัติจากผู้ใช้ผ่าน overlay การอนุมัติ exec, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนทุกช่องทาง
- `before_install`: `{ block: true }` เป็นผลลัพธ์สุดท้ายและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นผลลัพธ์สุดท้ายและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: ควรใช้ฟิลด์ `threadId` ที่มีชนิดชัดเจนเมื่อคุณต้องการการกำหนดเส้นทางขาเข้าของ thread/topic ให้คง `metadata` ไว้สำหรับส่วนเสริมเฉพาะช่องทาง
- `message_sending`: ควรใช้ฟิลด์การกำหนดเส้นทาง `replyToId` / `threadId` ที่มีชนิดชัดเจน มากกว่าคีย์ metadata เฉพาะช่องทาง

คำสั่ง `/approve` จัดการทั้งการอนุมัติ exec และ Plugin โดยมี bounded fallback: เมื่อไม่พบ approval id ของ exec, OpenClaw จะลอง id เดิมนั้นผ่านการอนุมัติของ Plugin อีกครั้ง การส่งต่อการอนุมัติของ Plugin สามารถตั้งค่าแยกได้ผ่าน `approvals.plugin` ในคอนฟิก

หากโครงสร้างการอนุมัติแบบกำหนดเองของคุณต้องตรวจจับกรณี bounded fallback เดียวกันนั้น
ให้เลือกใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงของการหมดอายุ approval ด้วยตนเอง

ดูรายละเอียดได้ที่ [ความหมายของการตัดสินใจใน hook ของภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## การลงทะเบียน agent tools

tool คือฟังก์ชันที่มีชนิดชัดเจนซึ่ง LLM สามารถเรียกใช้ได้ โดยอาจเป็นแบบบังคับ (มีใช้งานเสมอ) หรือแบบไม่บังคับ (ผู้ใช้ต้องเลือกเปิดเอง):

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

ผู้ใช้เปิดใช้ tool แบบไม่บังคับในคอนฟิกได้ดังนี้:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อของ tool ต้องไม่ชนกับ core tool (หากชน ระบบจะข้าม)
- ใช้ `optional: true` สำหรับ tool ที่มีผลข้างเคียงหรือมีข้อกำหนดเรื่องไบนารีเพิ่มเติม
- ผู้ใช้สามารถเปิด tool ทุกตัวจาก Plugin หนึ่งได้ด้วยการเพิ่ม plugin id ลงใน `tools.allow`

## ข้อตกลงเรื่อง import

ให้ import จากพาธ `openclaw/plugin-sdk/<subpath>` ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับรายการ subpath แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ local barrel file (`api.ts`, `runtime-api.ts`) สำหรับ
import ภายใน — ห้าม import Plugin ของตัวเองผ่านพาธ SDK ของมัน

สำหรับ provider plugin ให้เก็บ helper ที่เฉพาะผู้ให้บริการไว้ใน
barrel ระดับรากของแพ็กเกจนั้น เว้นแต่ seam นั้นจะเป็นแบบทั่วไปจริง ๆ ตัวอย่าง bundled ปัจจุบัน:

- Anthropic: wrapper ของสตรีม Claude และ helper ของ `service_tier` / beta
- OpenAI: builder ของผู้ให้บริการ, helper โมเดลค่าเริ่มต้น, ผู้ให้บริการแบบ realtime
- OpenRouter: builder ของผู้ให้บริการ พร้อม helper สำหรับ onboarding/config

หาก helper ใดมีประโยชน์เฉพาะภายใน bundled provider package เดียว ให้คงไว้บน seam ระดับรากของแพ็กเกจนั้น แทนการยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

ยังมี seam ของ helper ที่สร้างขึ้นบางส่วนใน `openclaw/plugin-sdk/<bundled-id>` สำหรับ
การดูแล bundled plugin และความเข้ากันได้อยู่บ้าง ตัวอย่างเช่น
`plugin-sdk/feishu-setup` หรือ `plugin-sdk/zalo-setup` ให้ถือว่าสิ่งเหล่านี้เป็นพื้นผิวที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ third-party plugin ใหม่

## เช็กลิสต์ก่อนส่ง

<Check>**package.json** มีเมทาดาทา `openclaw` ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>ทุก import ใช้พาธ `plugin-sdk/<subpath>` ที่เฉพาะเจาะจง</Check>
<Check>import ภายในใช้โมดูลภายในเครื่อง ไม่ใช่ SDK self-import</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (สำหรับ Plugin ภายในรีโป)</Check>

## การทดสอบ beta release

1. คอยดูแท็กรีลีสบน GitHub ที่ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และ subscribe ผ่าน `Watch` > `Releases` แท็ก beta จะมีลักษณะอย่าง `v2026.3.N-beta.1` คุณสามารถเปิดการแจ้งเตือนสำหรับบัญชี OpenClaw อย่างเป็นทางการบน X [@openclaw](https://x.com/openclaw) เพื่อรับประกาศรีลีสได้เช่นกัน
2. ทดสอบ Plugin ของคุณกับแท็ก beta ทันทีที่มันปรากฏขึ้น ช่วงเวลาก่อน stable โดยทั่วไปจะมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin คุณในช่อง Discord `plugin-forum` หลังจากทดสอบแล้ว โดยระบุว่า `all good` หรือบอกว่าอะไรพัง หากคุณยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีบางอย่างพัง ให้เปิด issue หรืออัปเดต issue ที่มีชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ป้าย `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยตั้งชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue นั้นทั้งใน PR และในเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถติดป้ายให้ PR ได้ ดังนั้นชื่อ PR จึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ blocker ที่มี PR จะถูก merge; blocker ที่ไม่มี PR อาจถูกปล่อยออกไปอยู่ดี ผู้ดูแลจะเฝ้าดูเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลาไป การแก้ไขของคุณก็มักจะไปลงในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง channel plugin สำหรับระบบส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง provider plugin สำหรับผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    เอกสารอ้างอิง import map และ Registration API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, search, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบสำหรับการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิง schema ของ manifest แบบเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [Plugin Architecture](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ Plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugin
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugin
