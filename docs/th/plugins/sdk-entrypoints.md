---
read_when:
    - คุณต้องการลายเซ็นชนิดที่แน่นอนของ definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (full เทียบกับ setup เทียบกับ metadata ของ CLI)
    - คุณกำลังค้นหาตัวเลือกของจุดเริ่มต้น
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นของ Plugin
x-i18n:
    generated_at: "2026-04-24T09:24:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

ทุก plugin จะ export อ็อบเจ็กต์ entry เริ่มต้นแบบ default โดย SDK มีตัวช่วยสามตัวสำหรับ
การสร้างอ็อบเจ็กต์เหล่านี้

สำหรับ plugins ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลดรันไทม์ไปยัง
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

`extensions` และ `setupEntry` ยังคงใช้ได้เป็น source entries สำหรับการพัฒนาแบบ workspace และ git
checkout ส่วน `runtimeExtensions` และ `runtimeSetupEntry` จะถูกเลือกใช้ก่อน
เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm หลีกเลี่ยงการคอมไพล์
TypeScript ระหว่างรันไทม์ หากแพ็กเกจที่ติดตั้งแล้วประกาศเฉพาะ source entry แบบ TypeScript
OpenClaw จะใช้ built `dist/*.js` peer ที่ตรงกันเมื่อมีอยู่ จากนั้นจึง fallback ไปยัง source TypeScript

ทุก entry path ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin เสมอ runtime entries
และ built JavaScript peers ที่อนุมานได้ จะไม่ทำให้ source path ของ `extensions` หรือ
`setupEntry` ที่หลุดออกนอกขอบเขตกลายเป็นเส้นทางที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบลงมือทำอยู่หรือไม่?** ดู [plugin ของช่องทาง](/th/plugins/sdk-channel-plugins)
  หรือ [plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับคำแนะนำแบบทีละขั้นตอน
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ provider plugins, tool plugins, hook plugins และทุกอย่างที่ **ไม่ใช่**
ช่องทางการส่งข้อความ

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

| ฟิลด์         | ชนิด                                                            | จำเป็น   | ค่าเริ่มต้น         |
| ------------- | --------------------------------------------------------------- | -------- | ------------------- |
| `id`          | `string`                                                        | ใช่      | —                   |
| `name`        | `string`                                                        | ใช่      | —                   |
| `description` | `string`                                                        | ใช่      | —                   |
| `kind`        | `string`                                                        | ไม่      | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่      | schema อ็อบเจ็กต์ว่าง |
| `register`    | `(api: OpenClawPluginApi) => void`                              | ใช่      | —                   |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับสล็อตแบบเอกสิทธิ์: `"memory"` หรือ `"context-engine"`
- `configSchema` สามารถเป็นฟังก์ชันสำหรับการประเมินค่าแบบ lazy ได้
- OpenClaw จะ resolve และ memoize schema นั้นเมื่อมีการเข้าถึงครั้งแรก ดังนั้นตัวสร้าง schema
  ที่มีต้นทุนสูงจะทำงานเพียงครั้งเดียว

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

ครอบ `definePluginEntry` ด้วยการเชื่อมต่อที่เฉพาะช่องทาง โดยจะเรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผย seam ของ CLI metadata
สำหรับ root help แบบเลือกได้ และควบคุม `registerFull` ตาม registration mode

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

| ฟิลด์                | ชนิด                                                            | จำเป็น   | ค่าเริ่มต้น         |
| -------------------- | --------------------------------------------------------------- | -------- | ------------------- |
| `id`                 | `string`                                                        | ใช่      | —                   |
| `name`               | `string`                                                        | ใช่      | —                   |
| `description`        | `string`                                                        | ใช่      | —                   |
| `plugin`             | `ChannelPlugin`                                                 | ใช่      | —                   |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่      | schema อ็อบเจ็กต์ว่าง |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                              | ไม่      | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                              | ไม่      | —                   |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                              | ไม่      | —                   |

- `setRuntime` จะถูกเรียกระหว่างการลงทะเบียน เพื่อให้คุณสามารถเก็บ reference ของ runtime
  ได้ (โดยทั่วไปผ่าน `createPluginRuntimeStore`) โดยจะไม่เรียกในระหว่างการเก็บ
  CLI metadata
- `registerCliMetadata` จะทำงานทั้งใน `api.registrationMode === "cli-metadata"`
  และ `api.registrationMode === "full"`
  ให้ใช้สิ่งนี้เป็นที่หลักสำหรับ channel-owned CLI descriptors เพื่อให้ root help
  ไม่ทำให้เกิดการ activate ขณะเดียวกันการลงทะเบียนคำสั่ง CLI ตามปกติยังคงเข้ากันได้
  กับการโหลด plugin แบบเต็ม
- `registerFull` จะทำงานเฉพาะเมื่อ `api.registrationMode === "full"` เท่านั้น โดยจะไม่ทำงาน
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry` ค่า `configSchema` สามารถเป็น factory แบบ lazy ได้ และ OpenClaw
  จะ memoize schema ที่ resolve แล้วเมื่อมีการเข้าถึงครั้งแรก
- สำหรับคำสั่ง root CLI ที่เป็นของ plugin ให้เลือกใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคงถูก lazy-load โดยไม่หายไปจาก
  parse tree ของ root CLI สำหรับ channel plugins ให้ลงทะเบียน descriptors เหล่านั้น
  จาก `registerCliMetadata(...)` และให้ `registerFull(...)` มุ่งเน้นเฉพาะงานที่เป็น runtime เท่านั้น
- หาก `registerFull(...)` ลงทะเบียน gateway RPC methods ด้วย ให้เก็บ methods เหล่านั้นไว้ใต้
  prefix ที่เฉพาะกับ plugin เสมอ namespaces ของผู้ดูแลระบบ core ที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับให้เป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบเบา โดยจะคืนค่าเพียง `{ plugin }` โดยไม่มี
การเชื่อมต่อ runtime หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw จะโหลดสิ่งนี้แทน full entry เมื่อช่องทางถูกปิดใช้งาน
ยังไม่ได้ตั้งค่า หรือเมื่อเปิดใช้งาน deferred loading ดู
[Setup และ Config](/th/plugins/sdk-setup#setup-entry) ว่าสิ่งนี้มีความสำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับตระกูล setup helper
แบบแคบเหล่านี้:

- `openclaw/plugin-sdk/setup-runtime` สำหรับตัวช่วย setup ที่ปลอดภัยต่อ runtime เช่น
  import-safe setup patch adapters, เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ delegated setup proxies
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิว setup แบบ optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับ setup/install CLI/archive/docs helpers

ให้เก็บ SDKs ที่หนัก การลงทะเบียน CLI และบริการรันไทม์ที่มีอายุยาวไว้ใน full
entry

bundled workspace channels ที่แยกพื้นผิว setup และ runtime ออกจากกัน สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ สัญญานี้ช่วยให้
setup entry สามารถคง exports ของ plugin/secrets ที่ปลอดภัยต่อ setup ไว้ได้ ขณะเดียวกัน
ก็ยังเปิดเผยตัวตั้งค่า runtime:

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

ให้ใช้ bundled contract นี้เฉพาะเมื่อ setup flows ต้องการตัวตั้งค่า runtime แบบเบา
จริง ๆ ก่อนที่ full channel entry จะถูกโหลด

## โหมดการลงทะเบียน

`api.registrationMode` บอก plugin ของคุณว่ามันถูกโหลดอย่างไร:

| โหมด             | เมื่อใด                             | สิ่งที่ควรลงทะเบียน                                                                    |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`         | การเริ่มต้น Gateway ตามปกติ         | ทุกอย่าง                                                                                |
| `"setup-only"`   | ช่องทางที่ปิดใช้งาน/ยังไม่ตั้งค่า    | เฉพาะการลงทะเบียนช่องทาง                                                                |
| `"setup-runtime"` | โฟลว์ setup ที่มี runtime ใช้งานได้ | การลงทะเบียนช่องทาง พร้อม runtime แบบเบาเท่านั้นที่จำเป็นก่อน full entry จะถูกโหลด |
| `"cli-metadata"` | root help / การเก็บ CLI metadata   | เฉพาะ CLI descriptors                                                                   |

`defineChannelPluginEntry` จัดการการแยกนี้ให้อัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงกับช่องทาง ให้ตรวจสอบโหมดด้วยตัวเอง:

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

ให้ถือว่า `"setup-runtime"` เป็นช่วงที่พื้นผิวการเริ่มต้นแบบ setup-only
ต้องมีอยู่ได้โดยไม่กลับเข้าไปสู่ full bundled channel runtime อีกครั้ง
สิ่งที่เหมาะคือ การลงทะเบียนช่องทาง HTTP routes ที่ปลอดภัยต่อ setup
gateway methods ที่ปลอดภัยต่อ setup และ delegated setup helpers ส่วนบริการเบื้องหลังที่หนัก
CLI registrars และการบูตสตรัป provider/client SDK ยังคงควรอยู่ใน `"full"`

สำหรับ CLI registrars โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของ root commands อย่างน้อยหนึ่งคำสั่ง และคุณ
  ต้องการให้ OpenClaw lazy-load โมดูล CLI จริงเมื่อมีการเรียกใช้ครั้งแรก
- ตรวจสอบให้แน่ใจว่า descriptors เหล่านั้นครอบคลุม top-level command root ทุกตัวที่ registrar
  เปิดเผย
- ใช้เฉพาะ `commands` อย่างเดียวสำหรับเส้นทางความเข้ากันได้แบบ eager เท่านั้น

## รูปแบบของ plugin

OpenClaw จัดประเภท plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                | คำอธิบาย                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ความสามารถประเภทเดียว (เช่น provider-only)         |
| **hybrid-capability** | หลายประเภทความสามารถ (เช่น provider + speech)      |
| **hook-only**         | มีเฉพาะ hooks ไม่มี capabilities                   |
| **non-capability**    | มี tools/commands/services แต่ไม่มี capabilities    |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง registration API และ subpath
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime) — `api.runtime` และ `createPluginRuntimeStore`
- [Setup และ Config](/th/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [plugin ของช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้างอ็อบเจ็กต์ `ChannelPlugin`
- [plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins) — การลงทะเบียน provider และ hooks
