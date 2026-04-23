---
read_when:
    - คุณต้องการ type signature ที่แน่นอนของ definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (full เทียบกับ setup เทียบกับ metadata ของ CLI)
    - คุณกำลังค้นหาตัวเลือกของจุดเริ่มต้น
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นของ Plugin
x-i18n:
    generated_at: "2026-04-23T05:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# จุดเริ่มต้นของ Plugin

ทุก Plugin จะ export ออบเจ็กต์ entry เริ่มต้นหนึ่งตัว SDK มี helper อยู่สามตัวสำหรับ
การสร้างสิ่งเหล่านี้

สำหรับ Plugin ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลดตอนรันไทม์ไปยัง
JavaScript ที่ build แล้วเมื่อมีให้ใช้:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` และ `setupEntry` ยังคงใช้ได้ในฐานะ source entry สำหรับการพัฒนาแบบ workspace และ git
checkout ส่วน `runtimeExtensions` และ `runtimeSetupEntry` จะถูกให้ความสำคัญ
เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm หลีกเลี่ยงการคอมไพล์
TypeScript ตอนรันไทม์ หากแพ็กเกจที่ติดตั้งประกาศเพียง source entry แบบ TypeScript
OpenClaw จะใช้ peer แบบ `dist/*.js` ที่ build แล้วและตรงกันเมื่อมีอยู่ จากนั้นจึง fallback ไปยัง source แบบ TypeScript

พาธ entry ทั้งหมดต้องยังอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin พาธ runtime entry
และ peer JavaScript ที่ build แล้วซึ่งอนุมานได้ จะไม่ทำให้ `extensions` หรือ
`setupEntry` source path ที่หลุดออกนอกแพ็กเกจกลายเป็น path ที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบทีละขั้นอยู่หรือไม่?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins)
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ provider plugin, tool plugin, hook plugin และสิ่งใดก็ตามที่ **ไม่ใช่**
messaging channel

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| ฟิลด์          | ชนิด                                                            | จำเป็น | ค่าเริ่มต้น         |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`           | `string`                                                         | ใช่    | —                   |
| `name`         | `string`                                                         | ใช่    | —                   |
| `description`  | `string`                                                         | ใช่    | —                   |
| `kind`         | `string`                                                         | ไม่    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | schema แบบ object ว่าง |
| `register`     | `(api: OpenClawPluginApi) => void`                               | ใช่    | —                   |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` มีไว้สำหรับสล็อตแบบ exclusive: `"memory"` หรือ `"context-engine"`
- `configSchema` สามารถเป็นฟังก์ชันเพื่อประเมินค่าแบบ lazy ได้
- OpenClaw จะ resolve และ memoize schema นั้นเมื่อถูกเข้าถึงครั้งแรก ดังนั้น builder ของ schema ที่มีต้นทุนสูงจะรันเพียงครั้งเดียว

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` ด้วย wiring แบบเฉพาะ channel โดยจะเรียก
`api.registerChannel({ plugin })` ให้อัตโนมัติ เปิด seam ของ root-help CLI metadata แบบไม่บังคับ และควบคุม `registerFull` ตาม registration mode

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| ฟิลด์                 | ชนิด                                                            | จำเป็น | ค่าเริ่มต้น         |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | ใช่    | —                   |
| `name`                | `string`                                                         | ใช่    | —                   |
| `description`         | `string`                                                         | ใช่    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | ใช่    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | schema แบบ object ว่าง |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | ไม่    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | ไม่    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | ไม่    | —                   |

- `setRuntime` จะถูกเรียกระหว่างการลงทะเบียนเพื่อให้คุณเก็บ runtime reference ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) มันจะถูกข้ามระหว่างการจับ CLI metadata
- `registerCliMetadata` จะรันทั้งใน `api.registrationMode === "cli-metadata"`
  และ `api.registrationMode === "full"`
  ให้ใช้ตรงนี้เป็นตำแหน่ง canonical สำหรับ descriptor ของ CLI ที่ channel เป็นเจ้าของ เพื่อให้ root help
  ยังคงเป็นแบบไม่เปิดใช้งาน ขณะที่การลงทะเบียนคำสั่ง CLI ปกติยังเข้ากันได้
  กับการโหลด Plugin แบบเต็ม
- `registerFull` จะรันเฉพาะเมื่อ `api.registrationMode === "full"` เท่านั้น มันจะถูกข้าม
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry`, `configSchema` สามารถเป็น lazy factory ได้ และ OpenClaw
  จะ memoize schema ที่ resolve แล้วเมื่อถูกเข้าถึงครั้งแรก
- สำหรับคำสั่ง root CLI ที่ Plugin เป็นเจ้าของ ควรใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคง lazy-loaded โดยไม่หายไปจาก
  root CLI parse tree สำหรับ channel plugin ควรลงทะเบียน descriptor เหล่านั้น
  จาก `registerCliMetadata(...)` และให้ `registerFull(...)` โฟกัสเฉพาะงานที่เป็น runtime-only
- หาก `registerFull(...)` ลงทะเบียน gateway RPC method ด้วย ให้คงพวกมันไว้ภายใต้
  prefix เฉพาะของ Plugin namespace admin ของ core ที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับเป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบเบา จะคืนเพียง `{ plugin }` โดยไม่มี
wiring สำหรับ runtime หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw จะโหลดสิ่งนี้แทน full entry เมื่อ channel ถูกปิดใช้งาน
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้ deferred loading ดู
[Setup and Config](/th/plugins/sdk-setup#setup-entry) ว่าสิ่งนี้สำคัญเมื่อใด

ในทางปฏิบัติ ควรจับคู่ `defineSetupPluginEntry(...)` กับกลุ่ม setup helper
ที่แคบและเฉพาะทาง:

- `openclaw/plugin-sdk/setup-runtime` สำหรับ setup helper ที่ปลอดภัยต่อรันไทม์ เช่น
  import-safe setup patch adapter, เอาต์พุตแบบ lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ delegated setup proxy
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิว setup แบบ optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับ helper ของ setup/install CLI/archive/docs

ให้เก็บ SDK ขนาดใหญ่, การลงทะเบียน CLI และบริการรันไทม์ระยะยาวไว้ใน full
entry

bundled workspace channel ที่แยกพื้นผิว setup กับ runtime ออกจากกัน สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` ได้แทน contract นี้ทำให้
setup entry คง export ของ plugin/secrets ที่ปลอดภัยต่อ setup ไว้ได้ พร้อมทั้งยังเปิดเผย
runtime setter ได้ด้วย:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

ใช้ bundled contract นี้เฉพาะเมื่อโฟลว์ setup จำเป็นต้องมี runtime setter แบบเบา
จริง ๆ ก่อนที่ full channel entry จะถูกโหลด

## Registration mode

`api.registrationMode` จะบอก Plugin ของคุณว่ามันถูกโหลดมาอย่างไร:

| โหมด              | เมื่อใด                             | ควรลงทะเบียนอะไร                                                                       |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น gateway ตามปกติ        | ทุกอย่าง                                                                                |
| `"setup-only"`    | channel ถูกปิด/ยังไม่ได้กำหนดค่า   | เฉพาะการลงทะเบียน channel                                                               |
| `"setup-runtime"` | โฟลว์ setup ที่มี runtime พร้อม    | การลงทะเบียน channel บวกกับ runtime แบบเบาเท่าที่จำเป็นก่อน full entry จะถูกโหลด      |
| `"cli-metadata"`  | root help / การจับ CLI metadata    | เฉพาะ CLI descriptor                                                                    |

`defineChannelPluginEntry` จัดการการแยกนี้ให้อัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงกับ channel ให้ตรวจโหมดด้วยตัวเอง:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

ให้มอง `"setup-runtime"` เป็นช่วงเวลาที่พื้นผิว startup แบบ setup-only ต้อง
มีอยู่ได้โดยไม่ re-enter full bundled channel runtime สิ่งที่เหมาะคือ
การลงทะเบียน channel, HTTP route ที่ปลอดภัยต่อ setup, gateway method ที่ปลอดภัยต่อ setup และ delegated setup helper บริการเบื้องหลังขนาดใหญ่, CLI registrar และการบูต SDK ของ provider/client ยังคงควรอยู่ใน `"full"`

สำหรับ CLI registrar โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของ root command หนึ่งคำสั่งขึ้นไป และคุณ
  ต้องการให้ OpenClaw lazy-load โมดูล CLI จริงเมื่อมีการเรียกครั้งแรก
- ตรวจให้แน่ใจว่า descriptor เหล่านั้นครอบคลุมทุก top-level command root ที่ registrar เปิดเผย
- ใช้ `commands` อย่างเดียวเฉพาะเส้นทาง eager compatibility เท่านั้น

## รูปทรงของ Plugin

OpenClaw จะจัดประเภท Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปทรง                | คำอธิบาย                                             |
| --------------------- | ---------------------------------------------------- |
| **plain-capability**  | มี capability type เดียว (เช่น provider-only)        |
| **hybrid-capability** | มีหลาย capability type (เช่น provider + speech)      |
| **hook-only**         | มีแต่ hook ไม่มี capability                           |
| **non-capability**    | มี tools/commands/services แต่ไม่มี capability         |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปทรงของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) — API การลงทะเบียนและเอกสารอ้างอิง subpath
- [Runtime Helpers](/th/plugins/sdk-runtime) — `api.runtime` และ `createPluginRuntimeStore`
- [Setup and Config](/th/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้างออบเจ็กต์ `ChannelPlugin`
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การลงทะเบียน provider และ hooks
