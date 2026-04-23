---
read_when:
    - |-
      คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ Plugin】【”】【analysis to=functions.read  聚利_commentary  天天中彩票官方 彩票招商  北京赛车女json
      {"path":"/home/runner/work/docs/docs/source/.agents/skills/translation?","offset":1,"limit":10}
    - คุณต้องเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนด config schema ของ Plugin หรือ metadata openclaw ใน package.json
sidebarTitle: Setup and Config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, config schema และ metadata ใน package.json
title: การตั้งค่าและคอนฟิกของ Plugin
x-i18n:
    generated_at: "2026-04-23T05:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# การตั้งค่าและคอนฟิกของ Plugin

เอกสารอ้างอิงสำหรับการแพ็กเกจ Plugin (`package.json` metadata), manifest
(`openclaw.plugin.json`), setup entry และ config schema

<Tip>
  **กำลังมองหาคู่มือแบบทีละขั้นอยู่หรือไม่?** คู่มือ how-to ครอบคลุมเรื่องการแพ็กเกจในบริบทจริง:
  [Channel Plugins](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ
  [Provider Plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## Package metadata

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า
Plugin ของคุณมีอะไรให้บ้าง:

**Channel plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider plugin / ค่าเริ่มต้นสำหรับการ publish บน ClawHub:**

```json openclaw-clawhub-package.json
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

หากคุณ publish Plugin ออกไปภายนอกบน ClawHub ฟิลด์ `compat` และ `build`
เหล่านั้นถือว่าจำเป็น ตัวอย่าง snippet สำหรับ publish แบบ canonical อยู่ใน
`docs/snippets/plugin-publish/`

### ฟิลด์ใน `openclaw`

| ฟิลด์        | ชนิด      | คำอธิบาย                                                                                                                  |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ไฟล์ entry point (อ้างอิงจาก package root)                                                                                |
| `setupEntry` | `string`   | entry แบบเบาที่ใช้เฉพาะ setup (ไม่บังคับ)                                                                                |
| `channel`    | `object`   | metadata ของ channel catalog สำหรับพื้นผิว setup, picker, quickstart และ status                                            |
| `providers`  | `string[]` | provider id ที่ Plugin นี้ลงทะเบียน                                                                                       |
| `install`    | `object`   | install hint: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | แฟลกพฤติกรรมการเริ่มต้น                                                                                                    |

### `openclaw.channel`

`openclaw.channel` คือ package metadata แบบเบาสำหรับการค้นพบ channel และพื้นผิว setup
ก่อนที่ runtime จะถูกโหลด

| ฟิลด์                                  | ชนิด      | ความหมาย                                                                     |
| -------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | channel id แบบ canonical                                                     |
| `label`                                | `string`   | label หลักของ channel                                                        |
| `selectionLabel`                       | `string`   | label สำหรับ picker/setup เมื่อควรต่างจาก `label`                            |
| `detailLabel`                          | `string`   | label รายละเอียดรองสำหรับ channel catalog และพื้นผิว status ที่ richer       |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์ของ setup และการเลือก                                   |
| `docsLabel`                            | `string`   | label ที่ใช้สำหรับลิงก์เอกสาร เมื่อควรต่างจาก channel id                     |
| `blurb`                                | `string`   | คำอธิบายสั้น ๆ สำหรับ onboarding/catalog                                     |
| `order`                                | `number`   | ลำดับการเรียงใน channel catalog                                              |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับการเลือก channel                                         |
| `preferOver`                           | `string[]` | plugin/channel id ที่มีลำดับต่ำกว่าและ channel นี้ควรอยู่เหนือกว่า          |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image แบบไม่บังคับสำหรับ catalog ของ UI channel            |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                                   |
| `selectionDocsOmitLabel`               | `boolean`  | แสดง docs path ตรง ๆ แทนการใช้ลิงก์เอกสารที่มี label ในข้อความเลือก         |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ถูกต่อท้ายในข้อความเลือก                                |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่า channel รองรับ markdown สำหรับการตัดสินใจเรื่องการจัดรูปแบบขาออก |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นของ channel สำหรับพื้นผิว setup, รายการที่กำหนดค่าแล้ว และ docs |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ channel นี้ใช้โฟลว์ quickstart `allowFrom` มาตรฐาน                  |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้จะมีเพียงหนึ่งบัญชี                          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ให้ความสำคัญกับ session lookup เมื่อ resolve announce target สำหรับ channel นี้ |

ตัวอย่าง:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` รองรับ:

- `configured`: รวม channel นี้ไว้ในพื้นผิวแบบรายการ configured/status
- `setup`: รวม channel นี้ไว้ใน picker ของ setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายว่า channel นี้เผยต่อสาธารณะในพื้นผิว docs/navigation

`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias แบบ legacy แนะนำให้ใช้
`exposure`

### `openclaw.install`

`openclaw.install` เป็น package metadata ไม่ใช่ manifest metadata

| ฟิลด์                        | ชนิด                 | ความหมาย                                                                         |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec แบบ canonical สำหรับโฟลว์ install/update                               |
| `localPath`                  | `string`             | local development path หรือ bundled install path                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ควรเลือกเป็นค่าเริ่มต้นเมื่อมีทั้งสองแบบ                         |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับ ในรูปแบบ `>=x.y.z`                            |
| `expectedIntegrity`          | `string`             | ค่าความสมบูรณ์ของ npm dist ที่คาดหวัง โดยทั่วไปคือ `sha512-...` สำหรับ install แบบตรึงเวอร์ชัน |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้โฟลว์ reinstall ของ bundled-plugin กู้คืนจากความล้มเหลวของ stale-config บางแบบ |

Interactive onboarding ยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand
ด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของ provider หรือ metadata ของ setup/catalog ของ channel
ก่อนที่ runtime จะถูกโหลด onboarding สามารถแสดงตัวเลือกนั้น ถามว่าจะใช้ npm หรือ local install ติดตั้งหรือเปิดใช้ Plugin แล้วจึงดำเนินโฟลว์ที่เลือกต่อไป ตัวเลือก npm ใน onboarding ต้องใช้ trusted catalog metadata ที่มี `npmSpec` เวอร์ชันตรงตัวและ `expectedIntegrity`; จะไม่เสนอชื่อแพ็กเกจที่ไม่ตรึงเวอร์ชันและ dist-tag สำหรับการติดตั้ง onboarding อัตโนมัติ ให้เก็บ metadata แบบ “ควรแสดงอะไร” ไว้ใน `openclaw.plugin.json` และ metadata แบบ “จะติดตั้งอย่างไร” ไว้ใน `package.json`

หากมีการตั้ง `minHostVersion`, ทั้งกระบวนการ install และการโหลดจาก manifest-registry จะบังคับใช้มัน โฮสต์ที่เก่ากว่าจะข้าม Plugin นี้ และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ

สำหรับการติดตั้ง npm แบบตรึงเวอร์ชัน ให้คงเวอร์ชันที่แน่นอนไว้ใน `npmSpec` และเพิ่ม
artifact integrity ที่คาดหวัง:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` ไม่ใช่ทางลัดทั่วไปสำหรับ config ที่พัง มันมีไว้
สำหรับการกู้คืน bundled-plugin แบบแคบและเฉพาะเจาะจงเท่านั้น เพื่อให้ reinstall/setup สามารถซ่อม
เศษซากจากการอัปเกรดที่รู้จัก เช่น bundled plugin path ที่หายไป หรือรายการ `channels.<id>`
ที่ค้างเก่าสำหรับ Plugin เดียวกันนั้น หาก config พังด้วยเหตุผลที่ไม่เกี่ยวกัน install ก็ยังคง fail closed และบอกผู้ปฏิบัติการให้รัน `openclaw doctor --fix`

### Deferred full load

Channel plugin สามารถเลือกใช้ deferred loading ได้ด้วย:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่าง pre-listen startup
phase แม้กระทั่งสำหรับ channel ที่กำหนดค่าไว้แล้ว full entry จะถูกโหลดหลังจาก
gateway เริ่มฟังแล้ว

<Warning>
  เปิดใช้ deferred loading เฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่
  gateway ต้องใช้ก่อนเริ่มฟังแล้ว (การลงทะเบียน channel, HTTP route,
  gateway method) หาก full entry เป็นเจ้าของ capability ตอนเริ่มต้นที่จำเป็น ให้คง
  พฤติกรรมค่าเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียน gateway RPC method ด้วย ให้คงพวกมันไว้ภายใต้
prefix เฉพาะของ Plugin namespace admin ของ core ที่สงวนไว้ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และจะ resolve
เป็น `operator.admin` เสมอ

## Plugin manifest

ทุก native plugin ต้องมี `openclaw.plugin.json` อยู่ที่ package root
OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบ config โดยไม่ต้อง execute โค้ดของ Plugin

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

สำหรับ channel plugin ให้เพิ่ม `kind` และ `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

แม้แต่ Plugin ที่ไม่มี config ก็ต้องมี schema ด้วย schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Plugin Manifest](/th/plugins/manifest) สำหรับเอกสารอ้างอิง schema แบบเต็ม

## การ publish บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub แบบเฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

publish alias แบบ legacy ที่มีไว้สำหรับ skill เท่านั้น ใช้กับ skill อย่างเดียว สำหรับแพ็กเกจ Plugin
ควรใช้ `clawhub package publish` เสมอ

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาของ `index.ts` ที่
OpenClaw จะโหลดเมื่อมันต้องการเพียงพื้นผิว setup (onboarding, config repair,
การตรวจสอบ channel ที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

สิ่งนี้ช่วยหลีกเลี่ยงการโหลดโค้ดรันไทม์ที่หนัก (ไลบรารีเข้ารหัส, การลงทะเบียน CLI,
บริการเบื้องหลัง) ระหว่างโฟลว์ setup

bundled workspace channel ที่เก็บ export ที่ปลอดภัยต่อ setup ไว้ใน sidecar module สามารถ
ใช้ `defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทน
`defineSetupPluginEntry(...)` ได้ bundled contract นั้นยังรองรับ
`runtime` export แบบไม่บังคับด้วย เพื่อให้ runtime wiring ตอน setup ยังคงเบาและชัดเจน

**เมื่อใด OpenClaw จะใช้ `setupEntry` แทน full entry:**

- channel ถูกปิดใช้งาน แต่ยังต้องใช้พื้นผิว setup/onboarding
- channel เปิดใช้งานอยู่แต่ยังไม่ได้กำหนดค่า
- เปิดใช้ deferred loading (`deferConfiguredChannelFullLoadUntilAfterListen`)

**สิ่งที่ `setupEntry` ต้องลงทะเบียน:**

- ออบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
- HTTP route ใด ๆ ที่จำเป็นก่อน gateway จะเริ่มฟัง
- gateway method ใด ๆ ที่ต้องใช้ระหว่างการเริ่มต้น

gateway method ระหว่างเริ่มต้นเหล่านั้นก็ควรหลีกเลี่ยง namespace admin ของ core
ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

**สิ่งที่ `setupEntry` ไม่ควรมี:**

- การลงทะเบียน CLI
- บริการเบื้องหลัง
- import ของ runtime ที่หนัก (crypto, SDK)
- gateway method ที่จำเป็นเฉพาะหลังการเริ่มต้น

### Narrow setup helper import

สำหรับเส้นทาง setup-only แบบ hot path ให้ใช้ narrow setup helper seam แทน
umbrella แบบกว้างของ `plugin-sdk/setup` เมื่อคุณต้องการเพียงบางส่วนของพื้นผิว setup:

| Import path                        | ใช้สำหรับ                                                                                 | export หลัก                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper ของ runtime ตอน setup ที่ยังใช้งานได้ใน `setupEntry` / deferred channel startup   | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | account setup adapter ที่รับรู้ environment                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | helper สำหรับ setup/install CLI/archive/docs                                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

ใช้ seam แบบกว้างของ `plugin-sdk/setup` เมื่อคุณต้องการ shared setup
toolbox เต็มชุด รวมถึง helper สำหรับ config-patch เช่น
`moveSingleAccountChannelSectionToDefaultAccount(...)`

setup patch adapter ยังคงปลอดภัยสำหรับ hot path ตั้งแต่ตอน import bundled
single-account promotion contract-surface lookup ของมันเป็นแบบ lazy ดังนั้นการ import
`plugin-sdk/setup-runtime` จะไม่โหลด bundled contract-surface discovery อย่าง eager ก่อนที่ adapter จะถูกใช้จริง

### การเลื่อน single-account ที่ channel เป็นเจ้าของ

เมื่อ channel อัปเกรดจาก top-level config แบบ single-account ไปเป็น
`channels.<id>.accounts.*`, พฤติกรรมร่วมแบบค่าเริ่มต้นคือย้ายค่าแบบ account-scoped
ที่ถูกเลื่อนเข้าไปไว้ใน `accounts.default`

bundled channel สามารถทำให้ promotion นี้แคบลงหรือ override ได้ผ่าน setup
contract surface ของมัน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปยัง
  account ที่ถูกเลื่อน
- `namedAccountPromotionKeys`: เมื่อมี named account อยู่แล้ว จะย้ายเฉพาะ
  คีย์เหล่านี้เข้าไปยัง account ที่ถูกเลื่อน; คีย์ shared policy/delivery จะคงอยู่ที่ root ของ
  channel
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่า existing account ตัวใดจะ
  รับค่าที่ถูกเลื่อน

Matrix คือตัวอย่าง bundled ปัจจุบัน หากมี named Matrix account อยู่แล้วเพียงหนึ่งตัว
หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่ไม่ canonical แต่มีอยู่จริง เช่น `Ops`,
promotion จะคง account นั้นไว้แทนที่จะสร้าง `accounts.default` ใหม่

## Config schema

config ของ Plugin จะถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้
กำหนดค่า Plugin ผ่าน:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin ของคุณจะได้รับ config นี้ในชื่อ `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับ config แบบเฉพาะ channel ให้ใช้ส่วนคอนฟิกของ channel แทน:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### การสร้าง channel config schema

ใช้ `buildChannelConfigSchema` จาก `openclaw/plugin-sdk/core` เพื่อแปลง
Zod schema ให้เป็นตัวห่อ `ChannelConfigSchema` ที่ OpenClaw ใช้ตรวจสอบ:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Setup wizard

Channel plugin สามารถจัดเตรียม setup wizard แบบโต้ตอบสำหรับ `openclaw onboard`
ได้ วิซาร์ดจะเป็นออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ
ดูแพ็กเกจ bundled plugin (เช่น Discord plugin `src/channel.setup.ts`) สำหรับ
ตัวอย่างแบบเต็ม

สำหรับพรอมป์ DM allowlist ที่ต้องการเพียงโฟลว์มาตรฐานแบบ
`note -> prompt -> parse -> merge -> patch` ให้ใช้ shared setup
helper จาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` และ
`createNestedChannelParsedAllowFromPrompt(...)`

สำหรับบล็อกสถานะของ channel setup ที่แตกต่างกันเพียง label, score และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้ใช้ `createStandardChannelSetupStatus(...)` จาก
`openclaw/plugin-sdk/setup` แทนการเขียน `status` object แบบเดียวกันขึ้นเองใน
แต่ละ Plugin

สำหรับพื้นผิว setup แบบไม่บังคับที่ควรปรากฏเฉพาะในบางบริบท ให้ใช้
`createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` ยังเปิดเผย builder ระดับต่ำกว่าอย่าง
`createOptionalChannelSetupAdapter(...)` และ
`createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของ
พื้นผิว optional-install นั้น

optional adapter/wizard ที่ถูกสร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง
มันจะใช้ข้อความ install-required ข้อความเดียวซ้ำใน `validateInput`,
`applyAccountConfig` และ `finalize` และจะต่อท้ายลิงก์เอกสารเมื่อมีการตั้ง `docsPath`

สำหรับ setup UI ที่อิงกับไบนารี ให้ใช้ shared delegated helper แทน
การคัดลอก glue เรื่อง binary/status แบบเดียวกันไปใส่ในทุก channel:

- `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเพียง label,
  hint, score และการตรวจจับไบนารี
- `createCliPathTextInput(...)` สำหรับ text input ที่อิงพาธ
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ
  `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้อง forward ไปยัง
  full wizard ที่หนักกว่าแบบ lazy
- `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องการเพียง
  delegate การตัดสินใจ `textInputs[*].shouldPrompt`

## การ publish และการติดตั้ง

**Plugin ภายนอก:** publish ไปยัง [ClawHub](/th/tools/clawhub) หรือ npm แล้วติดตั้ง:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw จะลอง ClawHub ก่อน และ fallback ไปยัง npm โดยอัตโนมัติ คุณยังสามารถ
บังคับให้ใช้ ClawHub อย่างชัดเจนได้:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

ไม่มี override แบบ `npm:` ที่ตรงกัน ให้ใช้ npm package spec ปกติเมื่อคุณ
ต้องการเส้นทาง npm หลังจาก ClawHub fallback:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin ภายใน repo:** วางไว้ใต้ tree ของ bundled plugin workspace แล้วระบบจะค้นพบ
โดยอัตโนมัติระหว่าง build

**ผู้ใช้สามารถติดตั้งได้ด้วย:**

```bash
openclaw plugins install <package-name>
```

<Info>
  สำหรับการติดตั้งจาก npm, `openclaw plugins install` จะรัน
  `npm install --ignore-scripts` (ไม่มี lifecycle script) ควรรักษา dependency tree
  ของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ build จาก `postinstall`
</Info>

bundled plugin ที่ OpenClaw เป็นเจ้าของคือข้อยกเว้นเดียวของการซ่อมตอนเริ่มต้น: เมื่อ
การติดตั้งแบบแพ็กเกจพบว่ามีการเปิดใช้ Plugin นั้นจาก plugin config, legacy channel config หรือ default-enabled manifest ที่มาพร้อมในชุด การเริ่มต้นจะติดตั้ง runtime dependency ที่ขาดของ Plugin นั้นก่อน import ส่วน third-party plugin ไม่ควรพึ่งพาการติดตั้งตอนเริ่มต้น; ให้ใช้ตัวติดตั้ง Plugin แบบ explicit ต่อไป

## ที่เกี่ยวข้อง

- [จุดเริ่มต้นของ SDK](/th/plugins/sdk-entrypoints) -- `definePluginEntry` และ `defineChannelPluginEntry`
- [Plugin Manifest](/th/plugins/manifest) -- เอกสารอ้างอิง schema ของ manifest แบบเต็ม
- [การสร้าง Plugins](/th/plugins/building-plugins) -- คู่มือเริ่มต้นแบบทีละขั้น
