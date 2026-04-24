---
read_when:
    - คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ plugin
    - คุณต้องการทำความเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนด schema ของ config plugin หรือ metadata `openclaw` ใน package.json
sidebarTitle: Setup and Config
summary: วิซาร์ดการตั้งค่า setup-entry.ts schema ของ config และ metadata ใน package.json
title: การตั้งค่าและ config ของ Plugin
x-i18n:
    generated_at: "2026-04-24T09:25:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

เอกสารอ้างอิงสำหรับการแพ็กเกจ plugin (metadata ใน `package.json`), manifests
(`openclaw.plugin.json`), setup entries และ config schemas

<Tip>
  **กำลังมองหาคู่มือแบบลงมือทำอยู่หรือไม่?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบทการใช้งาน:
  [plugin ของช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ
  [plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## metadata ของแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ plugin ว่า
plugin ของคุณมีสิ่งใดให้ใช้งานบ้าง:

**plugin ของช่องทาง:**

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

**plugin ของผู้ให้บริการ / baseline สำหรับเผยแพร่บน ClawHub:**

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

หากคุณเผยแพร่ plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build`
เหล่านั้นเป็นสิ่งจำเป็น snippets สำหรับการเผยแพร่แบบ canonical อยู่ใน
`docs/snippets/plugin-publish/`

### ฟิลด์ `openclaw`

| ฟิลด์        | ชนิด      | คำอธิบาย                                                                                                                  |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ไฟล์ entry point (สัมพันธ์กับรากของแพ็กเกจ)                                                                                |
| `setupEntry` | `string`  | entry แบบเบาสำหรับ setup-only (ไม่บังคับ)                                                                                  |
| `channel`    | `object`  | metadata แค็ตตาล็อกช่องทางสำหรับพื้นผิวการตั้งค่า ตัวเลือก quickstart และสถานะ                                              |
| `providers`  | `string[]` | provider ids ที่ลงทะเบียนโดย plugin นี้                                                                                   |
| `install`    | `object`  | คำใบ้สำหรับการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`  | flags สำหรับพฤติกรรมตอนเริ่มต้น                                                                                            |

### `openclaw.channel`

`openclaw.channel` คือ metadata ของแพ็กเกจที่มีต้นทุนต่ำสำหรับการค้นพบช่องทางและ
พื้นผิวการตั้งค่าก่อนที่รันไทม์จะถูกโหลด

| ฟิลด์                                  | ชนิด      | ความหมาย                                                                    |
| -------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`  | channel id แบบ canonical                                                     |
| `label`                                | `string`  | ป้ายชื่อหลักของช่องทาง                                                        |
| `selectionLabel`                       | `string`  | ป้ายชื่อในตัวเลือก/การตั้งค่า เมื่อควรแตกต่างจาก `label`                      |
| `detailLabel`                          | `string`  | ป้ายรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ยิ่งขึ้น       |
| `docsPath`                             | `string`  | เส้นทางเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                                  |
| `docsLabel`                            | `string`  | ป้ายชื่อทดแทนที่ใช้สำหรับลิงก์เอกสาร เมื่อควรแตกต่างจาก channel id              |
| `blurb`                                | `string`  | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                      |
| `order`                                | `number`  | ลำดับการเรียงในแค็ตตาล็อกช่องทาง                                               |
| `aliases`                              | `string[]` | aliases เพิ่มเติมสำหรับการค้นหาเพื่อเลือกช่องทาง                               |
| `preferOver`                           | `string[]` | plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า     |
| `systemImage`                          | `string`  | ชื่อไอคอน/system-image แบบไม่บังคับสำหรับแค็ตตาล็อก UI ของช่องทาง               |
| `selectionDocsPrefix`                  | `string`  | ข้อความคำนำหน้าก่อนลิงก์เอกสารในพื้นผิวการเลือก                                |
| `selectionDocsOmitLabel`               | `boolean` | แสดงเส้นทางเอกสารโดยตรงแทนลิงก์เอกสารแบบมีป้ายชื่อในข้อความตัวเลือก            |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความตัวเลือก                                  |
| `markdownCapable`                      | `boolean` | ระบุว่าช่องทางรองรับ markdown สำหรับการตัดสินใจด้านการจัดรูปแบบขาออก            |
| `exposure`                             | `object`  | ตัวควบคุมการมองเห็นของช่องทางสำหรับการตั้งค่า รายการที่ตั้งค่าแล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean` | เปิดใช้โฟลว์การตั้งค่า `allowFrom` แบบ quickstart มาตรฐานให้กับช่องทางนี้        |
| `forceAccountBinding`                  | `boolean` | บังคับให้ผูกบัญชีแบบชัดเจน แม้ว่าจะมีเพียงบัญชีเดียว                            |
| `preferSessionLookupForAnnounceTarget` | `boolean` | ให้ใช้การค้นหา session ก่อนเมื่อ resolve เป้าหมายการประกาศสำหรับช่องทางนี้       |

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

- `configured`: รวมช่องทางนี้ไว้ในพื้นผิวรายการแบบ configured/status
- `setup`: รวมช่องทางนี้ไว้ในตัวเลือกแบบโต้ตอบสำหรับตั้งค่า/configure
- `docs`: ระบุว่าช่องทางนี้เปิดเผยต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ aliases แบบ legacy โดยควรใช้
`exposure`

### `openclaw.install`

`openclaw.install` คือ metadata ของแพ็กเกจ ไม่ใช่ metadata ของ manifest

| ฟิลด์                        | ชนิด                 | ความหมาย                                                                         |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec แบบ canonical สำหรับโฟลว์การติดตั้ง/อัปเดต                              |
| `localPath`                  | `string`             | เส้นทางติดตั้งในเครื่องสำหรับการพัฒนา หรือเส้นทางติดตั้งแบบ bundled                |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีให้ใช้ทั้งสองแบบ                                      |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับ ในรูปแบบ `>=x.y.z`                             |
| `expectedIntegrity`          | `string`             | สตริง npm dist integrity ที่คาดไว้ โดยปกติเป็น `sha512-...` สำหรับการติดตั้งแบบ pin |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้โฟลว์ติดตั้ง bundled-plugin ใหม่กู้คืนจากความล้มเหลวของ config เก่าบางกรณี |

Interactive onboarding ยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand
ด้วย หาก plugin ของคุณเปิดเผยตัวเลือก auth ของ provider หรือ metadata ของการตั้งค่า/แค็ตตาล็อกช่องทาง
ก่อนที่รันไทม์จะถูกโหลด onboarding สามารถแสดงตัวเลือกนั้น ถามว่าจะติดตั้งผ่าน npm
หรือ local ติดตั้งหรือเปิดใช้งาน plugin จากนั้นจึงดำเนินโฟลว์ที่เลือกต่อ
ตัวเลือก onboarding แบบ npm ต้องใช้ metadata ของแค็ตตาล็อกที่เชื่อถือได้พร้อม registry
`npmSpec`; เวอร์ชันแบบระบุแน่นอนและ `expectedIntegrity` เป็นหมุดแบบไม่บังคับ หากมี
`expectedIntegrity` โฟลว์การติดตั้ง/อัปเดตจะบังคับตรวจสอบมัน ให้เก็บ metadata
ประเภท “จะแสดงอะไร” ไว้ใน `openclaw.plugin.json` และเก็บ metadata ประเภท “จะติดตั้งอย่างไร”
ไว้ใน `package.json`

หากตั้งค่า `minHostVersion` ไว้ ทั้งการติดตั้งและการโหลดผ่าน manifest-registry จะบังคับใช้มัน
โฮสต์ที่เก่ากว่าจะข้าม plugin นี้ และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ

สำหรับการติดตั้ง npm แบบ pin ให้คงเวอร์ชันแบบตรงตัวไว้ใน `npmSpec` และเพิ่ม
integrity ของอาร์ติแฟกต์ที่คาดไว้:

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

`allowInvalidConfigRecovery` ไม่ใช่ทางลัดทั่วไปสำหรับข้าม config ที่เสียหาย มันมีไว้
เฉพาะสำหรับการกู้คืน bundled-plugin แบบจำกัดเท่านั้น เพื่อให้การติดตั้งใหม่/การตั้งค่า
สามารถซ่อมแซมเศษตกค้างจากการอัปเกรดที่ทราบแล้ว เช่น เส้นทาง bundled plugin ที่หายไป หรือรายการ
`channels.<id>` ที่เก่าค้างสำหรับ plugin เดียวกันนั้น หาก config เสียหายจากสาเหตุอื่น
การติดตั้งจะยังคงล้มเหลวแบบปิด และจะแจ้งให้ผู้ดูแลรัน `openclaw doctor --fix`

### การเลื่อนโหลดแบบเต็ม

plugin ของช่องทางสามารถเลือกใช้การโหลดแบบเลื่อนเวลาได้ด้วย:

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

เมื่อเปิดใช้งาน OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วงเริ่มต้นก่อน listen
แม้กับช่องทางที่ตั้งค่าไว้แล้ว โดย full entry จะถูกโหลดหลังจาก gateway เริ่ม listen

<Warning>
  ให้เปิดใช้การโหลดแบบเลื่อนเวลาเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่
  gateway ต้องใช้ก่อนที่มันจะเริ่ม listen (การลงทะเบียนช่องทาง HTTP routes
  gateway methods) หาก full entry เป็นเจ้าของความสามารถในการเริ่มต้นที่จำเป็น ให้ใช้
  พฤติกรรมเริ่มต้นต่อไป
</Warning>

หาก setup/full entry ของคุณลงทะเบียน gateway RPC methods ด้วย ให้คง methods เหล่านั้นไว้ภายใต้
prefix ที่เฉพาะกับ plugin namespaces ของผู้ดูแล core ที่สงวนไว้ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve ไปยัง
`operator.admin` เสมอ

## manifest ของ Plugin

ทุก native plugin ต้องมี `openclaw.plugin.json` อยู่ที่รากของแพ็กเกจ
OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบ config โดยไม่ต้องรันโค้ดของ plugin

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

สำหรับ plugin ของช่องทาง ให้เพิ่ม `kind` และ `channels`:

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

แม้แต่ plugins ที่ไม่มี config ก็ต้องมี schema ด้วย schema ว่างถือว่าใช้ได้:

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

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ plugin ให้ใช้คำสั่ง ClawHub ที่เฉพาะสำหรับแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

alias การเผยแพร่แบบเดิมที่ใช้สำหรับ skills นั้นมีไว้สำหรับ skills เท่านั้น แพ็กเกจ plugin ควร
ใช้ `clawhub package publish` เสมอ

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาแทน `index.ts` ซึ่ง
OpenClaw จะโหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวสำหรับ setup (onboarding, การซ่อมแซม config,
การตรวจสอบช่องทางที่ถูกปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ดรันไทม์ที่หนัก (ไลบรารีเข้ารหัส การลงทะเบียน CLI
บริการเบื้องหลัง) ระหว่างโฟลว์การตั้งค่า

bundled workspace channels ที่เก็บ exports ที่ปลอดภัยต่อ setup ไว้ใน sidecar modules
สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทน
`defineSetupPluginEntry(...)` ได้ สัญญาแบบ bundled นี้ยังรองรับ `runtime` export
แบบไม่บังคับด้วย เพื่อให้การเชื่อมต่อ runtime ระหว่าง setup ยังคงเบาและชัดเจน

**เมื่อ OpenClaw ใช้ `setupEntry` แทน full entry:**

- ช่องทางถูกปิดใช้งาน แต่ยังต้องมีพื้นผิวสำหรับ setup/onboarding
- ช่องทางเปิดใช้งานแล้ว แต่ยังไม่ได้ตั้งค่า
- เปิดใช้งาน deferred loading (`deferConfiguredChannelFullLoadUntilAfterListen`)

**สิ่งที่ `setupEntry` ต้องลงทะเบียน:**

- อ็อบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
- HTTP routes ใด ๆ ที่จำเป็นก่อน gateway listen
- gateway methods ใด ๆ ที่จำเป็นระหว่างการเริ่มต้นระบบ

gateway methods ระหว่างเริ่มต้นเหล่านั้นยังคงควรหลีกเลี่ยง
namespaces ผู้ดูแล core ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

**สิ่งที่ `setupEntry` ไม่ควรมี:**

- การลงทะเบียน CLI
- บริการเบื้องหลัง
- imports รันไทม์ที่หนัก (crypto, SDKs)
- Gateway methods ที่จำเป็นหลังจากเริ่มต้นระบบเท่านั้น

### การนำเข้า setup helper แบบแคบ

สำหรับเส้นทาง setup-only ที่ทำงานบ่อย ให้เลือกใช้ seams ของ setup helper แบบแคบแทน
umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการใช้เพียงบางส่วนของพื้นผิว setup:

| เส้นทาง import                     | ใช้สำหรับ                                                                                 | exports หลัก                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วยรันไทม์ระหว่าง setup ที่ยังคงใช้ได้ใน `setupEntry` / การเริ่มต้น channel แบบ deferred | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | account setup adapters ที่รับรู้สภาพแวดล้อม                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers สำหรับ setup/install CLI/archive/docs                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

ให้ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการชุดเครื่องมือ setup
ที่ใช้ร่วมกันแบบเต็ม รวมถึง helpers สำหรับ config-patch เช่น
`moveSingleAccountChannelSectionToDefaultAccount(...)`

setup patch adapters ยังคงปลอดภัยต่อเส้นทางการทำงานที่ต้องร้อนแรงในขั้นตอน import โดย
การค้นหาพื้นผิวสัญญาสำหรับการเลื่อนระดับ single-account แบบ bundled
จะเป็นแบบ lazy ดังนั้นการ import
`plugin-sdk/setup-runtime` จะไม่ทำให้เกิดการโหลดการค้นพบพื้นผิวสัญญาแบบ bundled
ล่วงหน้าก่อนที่ adapter จะถูกใช้งานจริง

### การเลื่อนระดับ single-account ที่เป็นของ channel

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบ single-account ไปเป็น
`channels.<id>.accounts.*` พฤติกรรมที่ใช้ร่วมกันโดยค่าเริ่มต้นคือการย้ายค่าระดับบัญชี
ที่ถูกเลื่อนระดับไปไว้ใน `accounts.default`

bundled channels สามารถจำกัดหรือ override การเลื่อนระดับนั้นผ่านพื้นผิวสัญญา setup
ของตนได้:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปยัง
  บัญชีที่ถูกเลื่อนระดับ
- `namedAccountPromotionKeys`: เมื่อมี named accounts อยู่แล้ว ให้ย้ายเฉพาะคีย์เหล่านี้
  เข้าไปยังบัญชีที่ถูกเลื่อนระดับ ส่วนคีย์นโยบาย/การส่งมอบที่ใช้ร่วมกันจะคงอยู่ที่รากของ channel
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่ตัวใด
  จะได้รับค่าที่ถูกเลื่อนระดับ

Matrix คือตัวอย่าง bundled ปัจจุบัน หากมี named Matrix account อยู่แล้วเพียงหนึ่งบัญชี
หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่แบบไม่เป็น canonical เช่น `Ops`
การเลื่อนระดับจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่

## schema ของ config

config ของ plugin จะถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้
กำหนดค่า plugins ผ่าน:

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

plugin ของคุณจะได้รับ config นี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับ config ที่เฉพาะกับ channel ให้ใช้ส่วน channel config แทน:

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

### การสร้าง schema ของ channel config

ใช้ `buildChannelConfigSchema` จาก `openclaw/plugin-sdk/core` เพื่อแปลง
Zod schema ให้เป็น wrapper `ChannelConfigSchema` ที่ OpenClaw ใช้ตรวจสอบ:

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

## วิซาร์ดการตั้งค่า

plugin ของช่องทางสามารถจัดเตรียมวิซาร์ดการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard`
ได้ วิซาร์ดนี้คืออ็อบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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
ดูตัวอย่างแบบเต็มได้จากแพ็กเกจ bundled plugin (เช่น Discord plugin `src/channel.setup.ts`)

สำหรับพรอมป์ allowlist ของ DM ที่ต้องการเพียงโฟลว์มาตรฐาน
`note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ setup
helpers ที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` และ
`createNestedChannelParsedAllowFromPrompt(...)`

สำหรับบล็อกสถานะการตั้งค่า channel ที่ต่างกันเพียง labels, scores และบรรทัดเพิ่มเติมแบบไม่บังคับ
ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก
`openclaw/plugin-sdk/setup` แทนการเขียนอ็อบเจ็กต์ `status` แบบเดียวกันขึ้นใหม่
ในแต่ละ plugin

สำหรับพื้นผิว setup แบบไม่บังคับที่ควรแสดงเฉพาะบางบริบท ให้ใช้
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

`plugin-sdk/channel-setup` ยังเปิดเผย builders ระดับล่างกว่า
`createOptionalChannelSetupAdapter(...)` และ
`createOptionalChannelSetupWizard(...)` ด้วย ในกรณีที่คุณต้องการเพียงครึ่งเดียวของ
พื้นผิว optional-install นั้น

optional adapter/wizard ที่สร้างขึ้นจะล้มเหลวแบบปิดเมื่อต้องเขียน config จริง โดย
พวกมันจะใช้ข้อความเดียวกันที่บอกว่าจำเป็นต้องติดตั้งซ้ำใน `validateInput`,
`applyAccountConfig` และ `finalize` และจะต่อท้ายลิงก์เอกสารเมื่อมีการตั้งค่า `docsPath`

สำหรับ UI การตั้งค่าที่อิงกับไบนารี ให้เลือกใช้ delegated helpers ที่ใช้ร่วมกันแทน
การคัดลอก glue สำหรับไบนารี/สถานะแบบเดิมลงในทุก channel:

- `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเพียง labels,
  hints, scores และการตรวจจับไบนารี
- `createCliPathTextInput(...)` สำหรับ text inputs ที่อิงกับ path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ
  `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยัง
  full wizard ที่หนักกว่าแบบ lazy
- `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องการเพียง
  ส่งต่อการตัดสินใจ `textInputs[*].shouldPrompt`

## การเผยแพร่และการติดตั้ง

**plugins ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) หรือ npm แล้วติดตั้ง:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw จะลองใช้ ClawHub ก่อนและ fallback ไปยัง npm โดยอัตโนมัติ คุณยังสามารถ
บังคับใช้ ClawHub โดยตรงได้ด้วย:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub เท่านั้น
```

ไม่มีตัว override `npm:` ที่ตรงกัน ให้ใช้ npm package spec ปกติเมื่อคุณ
ต้องการใช้เส้นทาง npm หลังจาก ClawHub fallback:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**plugins ภายในรีโป:** วางไว้ภายใต้ต้นไม้ workspace ของ bundled plugin แล้วระบบจะ
ค้นพบโดยอัตโนมัติระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้ด้วย:**

```bash
openclaw plugins install <package-name>
```

<Info>
  สำหรับการติดตั้งที่มาจาก npm คำสั่ง `openclaw plugins install` จะรัน
  `npm install --ignore-scripts` (ไม่มี lifecycle scripts) ให้คง dependency
  trees ของ plugin เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้การ build ผ่าน `postinstall`
</Info>

bundled plugins ที่เป็นของ OpenClaw เท่านั้นที่เป็นข้อยกเว้นด้านการซ่อมแซมระหว่างเริ่มต้น: เมื่อ
การติดตั้งแบบแพ็กเกจพบว่ามี plugin แบบนั้นถูกเปิดใช้งานโดย config ของ plugin, legacy channel config หรือ
manifest แบบ bundled default-enabled ของมัน ระหว่างเริ่มต้นระบบจะติดตั้ง runtime dependencies
ที่ขาดหายของ plugin นั้นก่อน import third-party plugins ไม่ควรพึ่งพาการติดตั้งตอนเริ่มต้น
ให้ใช้ตัวติดตั้ง plugin แบบชัดเจนต่อไป

## ที่เกี่ยวข้อง

- [จุดเริ่มต้นของ SDK](/th/plugins/sdk-entrypoints) -- `definePluginEntry` และ `defineChannelPluginEntry`
- [Plugin Manifest](/th/plugins/manifest) -- เอกสารอ้างอิง schema ของ manifest แบบเต็ม
- [การสร้าง Plugins](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
