---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องส่งมอบ schema config ของ Plugin หรือแก้ไขข้อผิดพลาดการตรวจสอบ Plugin
summary: manifest ของ Plugin + ข้อกำหนดของ JSON schema (การตรวจสอบ config แบบเข้มงวด)
title: manifest ของ Plugin
x-i18n:
    generated_at: "2026-04-23T05:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da8ce35aca4c12bf49a4c3e352fb7fc2b5768cb34157a00dabd247fe60b4f04
    source_path: plugins/manifest.md
    workflow: 15
---

# manifest ของ Plugin (`openclaw.plugin.json`)

หน้านี้มีไว้สำหรับ **manifest ของ Plugin แบบ native ของ OpenClaw** เท่านั้น

สำหรับ layout ของ bundle ที่เข้ากันได้ ดู [Plugin bundles](/th/plugins/bundles)

bundle format ที่เข้ากันได้ใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือ layout คอมโพเนนต์ Claude
  เริ่มต้นที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw ตรวจจับ layout ของ bundle เหล่านั้นโดยอัตโนมัติด้วย แต่จะไม่ถูกตรวจสอบ
เทียบกับ schema ของ `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ bundle ที่เข้ากันได้ ปัจจุบัน OpenClaw อ่าน metadata ของ bundle รวมถึง
skill root ที่ประกาศไว้, Claude command root, ค่าเริ่มต้น `settings.json` ของ Claude bundle,
ค่าเริ่มต้น LSP ของ Claude bundle และ hook pack ที่รองรับ เมื่อ layout ตรงกับ
ความคาดหวังของรันไทม์ OpenClaw

Plugin แบบ native ของ OpenClaw ทุกตัว **ต้อง** มีไฟล์ `openclaw.plugin.json` อยู่ใน
**plugin root** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบการกำหนดค่า
**โดยไม่ต้องรันโค้ดของ Plugin** manifest ที่ไม่มีหรือไม่ถูกต้องจะถูกถือว่า
เป็นข้อผิดพลาดของ Plugin และจะบล็อกการตรวจสอบ config

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugins](/th/tools/plugin)
สำหรับโมเดล capability แบบ native และแนวทางปัจจุบันสำหรับความเข้ากันได้ภายนอก:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่านก่อนจะโหลด
โค้ดของ Plugin ของคุณ

ใช้สำหรับ:

- ตัวตนของ Plugin
- การตรวจสอบ config
- metadata ของ auth และ onboarding ที่ควรพร้อมใช้งานได้โดยไม่ต้องบูต
  runtime ของ Plugin
- activation hint ราคาถูกที่พื้นผิว control-plane สามารถตรวจสอบได้ก่อน runtime
  จะโหลด
- ตัวอธิบายการตั้งค่าราคาถูกที่พื้นผิว setup/onboarding สามารถตรวจสอบได้ก่อน
  runtime จะโหลด
- metadata ของ alias และการเปิดใช้งานอัตโนมัติที่ควรถูก resolve ก่อน runtime ของ Plugin จะโหลด
- metadata แบบ shorthand ของความเป็นเจ้าของ model-family ที่ควรทำให้
  Plugin เปิดใช้งานโดยอัตโนมัติก่อน runtime จะโหลด
- snapshot แบบ static ของความเป็นเจ้าของ capability ที่ใช้สำหรับ compat wiring ของ bundle และ
  coverage ของสัญญา
- metadata ของ QA runner ราคาถูกที่โฮสต์ร่วม `openclaw qa` สามารถตรวจสอบได้
  ก่อน runtime ของ Plugin จะโหลด
- metadata ของ config เฉพาะช่องทางที่ควรรวมเข้ากับ catalog และพื้นผิว
  การตรวจสอบโดยไม่ต้องโหลด runtime
- คำใบ้สำหรับ UI ของ config

อย่าใช้สำหรับ:

- การลงทะเบียนพฤติกรรมขณะรันไทม์
- การประกาศ code entrypoint
- metadata สำหรับการติดตั้ง npm

สิ่งเหล่านั้นควรอยู่ในโค้ดของ Plugin และ `package.json`

## ตัวอย่างขั้นต่ำ

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## ตัวอย่างแบบสมบูรณ์

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin provider ของ OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## เอกสารอ้างอิงฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น  | ชนิดข้อมูล                       | ความหมาย                                                                                                                                                                                                    |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | รหัส Plugin แบบ canonical นี่คือรหัสที่ใช้ใน `plugins.entries.<id>`                                                                                                                                        |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบ inline สำหรับ config ของ Plugin นี้                                                                                                                                                         |
| `enabledByDefault`                   | ไม่      | `true`                           | ระบุว่า Plugin ที่มากับระบบถูกเปิดใช้โดยค่าเริ่มต้น ละฟิลด์นี้ไว้ หรือกำหนดเป็นค่าใด ๆ ที่ไม่ใช่ `true` เพื่อให้ Plugin ปิดไว้โดยค่าเริ่มต้น                                                             |
| `legacyPluginIds`                    | ไม่      | `string[]`                       | รหัสแบบเดิมที่จะถูก normalize มาเป็นรหัส Plugin แบบ canonical นี้                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | ไม่      | `string[]`                       | รหัส provider ที่ควรทำให้ Plugin นี้เปิดใช้งานอัตโนมัติเมื่อ auth, config หรือ model ref กล่าวถึงพวกมัน                                                                                                  |
| `kind`                               | ไม่      | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบ exclusive ที่ใช้โดย `plugins.slots.*`                                                                                                                                                |
| `channels`                           | ไม่      | `string[]`                       | รหัสช่องทางที่เป็นของ Plugin นี้ ใช้สำหรับการค้นพบและการตรวจสอบ config                                                                                                                                     |
| `providers`                          | ไม่      | `string[]`                       | รหัส provider ที่เป็นของ Plugin นี้                                                                                                                                                                         |
| `modelSupport`                       | ไม่      | `object`                         | metadata แบบ shorthand ของตระกูลโมเดลที่ manifest เป็นเจ้าของ ใช้เพื่อ auto-load Plugin ก่อน runtime                                                                                                      |
| `providerEndpoints`                  | ไม่      | `object[]`                       | metadata ของ host/baseUrl endpoint ที่ manifest เป็นเจ้าของสำหรับ route ของ provider ที่ core ต้องจำแนกก่อนที่ runtime ของ provider จะโหลด                                                                 |
| `cliBackends`                        | ไม่      | `string[]`                       | รหัส backend ของ CLI inference ที่เป็นของ Plugin นี้ ใช้สำหรับการเปิดใช้งานอัตโนมัติตอนเริ่มต้นจาก config ref แบบชัดเจน                                                                                |
| `syntheticAuthRefs`                  | ไม่      | `string[]`                       | ref ของ provider หรือ CLI backend ที่ควร probe hook synthetic auth ที่ Plugin เป็นเจ้าของระหว่างการค้นพบโมเดลแบบ cold ก่อนที่ runtime จะโหลด                                                              |
| `nonSecretAuthMarkers`               | ไม่      | `string[]`                       | ค่า API key แบบ placeholder ที่เป็นของ Plugin ที่มากับระบบ และใช้แทนสถานะ credential แบบ non-secret, local, OAuth หรือ ambient                                                                           |
| `commandAliases`                     | ไม่      | `object[]`                       | ชื่อคำสั่งที่เป็นของ Plugin นี้ ซึ่งควรทำให้เกิดการวินิจฉัย config และ CLI แบบรับรู้ Plugin ก่อน runtime จะโหลด                                                                                            |
| `providerAuthEnvVars`                | ไม่      | `Record<string, string[]>`       | metadata ของ env สำหรับ auth ของ provider แบบราคาถูกที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ดของ Plugin                                                                                             |
| `providerAuthAliases`                | ไม่      | `Record<string, string>`         | รหัส provider ที่ควรใช้รหัส provider อื่นร่วมกันสำหรับการค้นหา auth เช่น provider สำหรับ coding ที่ใช้ API key และ auth profile ร่วมกับ provider พื้นฐาน                                                  |
| `channelEnvVars`                     | ไม่      | `Record<string, string[]>`       | metadata ของ env สำหรับช่องทางแบบราคาถูกที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ดของ Plugin ใช้สิ่งนี้สำหรับพื้นผิว setup หรือ auth ของช่องทางที่ขับเคลื่อนด้วย env ซึ่งตัวช่วย startup/config ทั่วไปควรมองเห็น |
| `providerAuthChoices`                | ไม่      | `object[]`                       | metadata แบบราคาถูกของตัวเลือก auth สำหรับตัวเลือกใน onboarding, การ resolve provider ที่ต้องการ, และการเชื่อมต่อ CLI flag แบบง่าย                                                                       |
| `activation`                         | ไม่      | `object`                         | activation hint แบบราคาถูกสำหรับการโหลดที่ถูกทริกเกอร์ด้วย provider, command, channel, route และ capability เป็น metadata เท่านั้น; runtime ของ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                          |
| `setup`                              | ไม่      | `object`                         | ตัวอธิบาย setup/onboarding แบบราคาถูกที่พื้นผิว discovery และ setup สามารถตรวจสอบได้โดยไม่ต้องโหลด runtime ของ Plugin                                                                                    |
| `qaRunners`                          | ไม่      | `object[]`                       | ตัวอธิบาย QA runner แบบราคาถูกที่โฮสต์ร่วม `openclaw qa` ใช้ก่อน runtime ของ Plugin จะโหลด                                                                                                              |
| `contracts`                          | ไม่      | `object`                         | snapshot แบบ static ของ capability ที่มากับระบบ สำหรับ speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่      | `Record<string, object>`         | ค่าเริ่มต้นของ media-understanding แบบราคาถูกสำหรับรหัส provider ที่ประกาศไว้ใน `contracts.mediaUnderstandingProviders`                                                                                    |
| `channelConfigs`                     | ไม่      | `Record<string, object>`         | metadata ของ config ช่องทางที่ manifest เป็นเจ้าของ ซึ่งจะถูกรวมเข้ากับพื้นผิว discovery และการตรวจสอบก่อน runtime จะโหลด                                                                                |
| `skills`                             | ไม่      | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด โดยอิงจาก plugin root                                                                                                                                                            |
| `name`                               | ไม่      | `string`                         | ชื่อ Plugin แบบอ่านเข้าใจได้                                                                                                                                                                                 |
| `description`                        | ไม่      | `string`                         | สรุปสั้น ๆ ที่แสดงในพื้นผิวของ Plugin                                                                                                                                                                        |
| `version`                            | ไม่      | `string`                         | เวอร์ชันของ Plugin เพื่อใช้เป็นข้อมูลประกอบ                                                                                                                                                                  |
| `uiHints`                            | ไม่      | `Record<string, object>`         | ป้ายกำกับ UI, placeholder และคำใบ้เรื่องความอ่อนไหวสำหรับฟิลด์ config                                                                                                                                      |

## เอกสารอ้างอิง `providerAuthChoices`

แต่ละรายการใน `providerAuthChoices` จะอธิบายตัวเลือก onboarding หรือ auth หนึ่งรายการ
OpenClaw อ่านสิ่งนี้ก่อนที่ runtime ของ provider จะโหลด

| ฟิลด์                 | จำเป็น  | ชนิดข้อมูล                                      | ความหมาย                                                                                         |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | รหัส provider ที่ตัวเลือกนี้สังกัดอยู่                                                           |
| `method`              | ใช่      | `string`                                        | รหัสวิธี auth ที่จะส่งต่อไป                                                                      |
| `choiceId`            | ใช่      | `string`                                        | รหัส auth-choice ที่คงที่ ใช้โดย onboarding และโฟลว์ CLI                                        |
| `choiceLabel`         | ไม่      | `string`                                        | ป้ายชื่อที่แสดงต่อผู้ใช้ หากไม่ระบุ OpenClaw จะ fallback ไปใช้ `choiceId`                       |
| `choiceHint`          | ไม่      | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับตัวเลือก                                                                |
| `assistantPriority`   | ไม่      | `number`                                        | ค่าที่น้อยกว่าจะเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดยผู้ช่วย                           |
| `assistantVisibility` | ไม่      | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกนี้จากตัวเลือกของผู้ช่วย แต่ยังอนุญาตให้เลือกผ่าน CLI แบบแมนนวลได้                |
| `deprecatedChoiceIds` | ไม่      | `string[]`                                      | รหัส choice แบบเดิมที่ควรพาผู้ใช้ไปยังตัวเลือกทดแทนนี้                                          |
| `groupId`             | ไม่      | `string`                                        | รหัสกลุ่มแบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                     |
| `groupLabel`          | ไม่      | `string`                                        | ป้ายชื่อที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                           |
| `groupHint`           | ไม่      | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับกลุ่ม                                                                    |
| `optionKey`           | ไม่      | `string`                                        | คีย์ตัวเลือกภายในสำหรับโฟลว์ auth แบบแฟล็กเดียวอย่างง่าย                                       |
| `cliFlag`             | ไม่      | `string`                                        | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                        |
| `cliOption`           | ไม่      | `string`                                        | รูปแบบตัวเลือก CLI เต็ม เช่น `--openrouter-api-key <key>`                                        |
| `cliDescription`      | ไม่      | `string`                                        | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                             |
| `onboardingScopes`    | ไม่      | `Array<"text-inference" \| "image-generation">` | พื้นผิว onboarding ใดบ้างที่ควรแสดงตัวเลือกนี้ หากไม่ระบุ จะใช้ค่าเริ่มต้นเป็น `["text-inference"]` |

## เอกสารอ้างอิง `commandAliases`

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งขณะรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดลงใน `plugins.allow` หรือพยายามรันเป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ต้อง import โค้ด runtime ของ Plugin

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| ฟิลด์        | จำเป็น  | ชนิดข้อมูล        | ความหมาย                                                                  |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | ใช่      | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                                           |
| `kind`       | ไม่      | `"runtime-slash"` | ระบุว่า alias นี้เป็นคำสั่ง slash ในแชต แทนที่จะเป็นคำสั่ง CLI ระดับราก |
| `cliCommand` | ไม่      | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องเพื่อแนะนำสำหรับการใช้งาน CLI หากมี       |

## เอกสารอ้างอิง `activation`

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้แบบราคาถูกว่าเหตุการณ์ control-plane ใดบ้าง
ควรทำให้มันถูกเปิดใช้งานในภายหลัง

## เอกสารอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ Plugin มีส่วนร่วมด้วย transport runner อย่างน้อยหนึ่งตัวภายใต้
root ร่วม `openclaw qa` ให้คง metadata นี้ให้เบาและคงที่; runtime ของ Plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว
`runtime-api.ts` แบบเบาที่ export `qaRunnerCliRegistrations`

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "รัน QA lane แบบ Matrix live ที่ใช้ Docker กับ homeserver ชั่วคราว"
    }
  ]
}
```

| ฟิลด์         | จำเป็น  | ชนิดข้อมูล | ความหมาย                                                          |
| ------------- | -------- | ---------- | ----------------------------------------------------------------- |
| `commandName` | ใช่      | `string`   | subcommand ที่ mount ใต้ `openclaw qa` เช่น `matrix`             |
| `description` | ไม่      | `string`   | ข้อความช่วยเหลือ fallback ที่ใช้เมื่อโฮสต์ร่วมต้องการ stub command |

บล็อกนี้เป็น metadata เท่านั้น มันไม่ได้ลงทะเบียนพฤติกรรมขณะรันไทม์ และ
ไม่ได้แทนที่ `register(...)`, `setupEntry` หรือ entrypoint อื่นของ runtime/Plugin
consumer ปัจจุบันใช้มันเป็นคำใบ้สำหรับการทำ narrowing ก่อนการโหลด Plugin ที่กว้างกว่า ดังนั้น
metadata ของ activation ที่ขาดหายไปโดยทั่วไปมีผลเพียงเรื่องประสิทธิภาพ; มันไม่ควร
เปลี่ยนความถูกต้อง ตราบใดที่ fallback ของความเป็นเจ้าของ manifest แบบเดิมยังคงมีอยู่

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| ฟิลด์            | จำเป็น  | ชนิดข้อมูล                                           | ความหมาย                                                             |
| ---------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | ไม่      | `string[]`                                           | รหัส provider ที่ควรทำให้ Plugin นี้เปิดใช้งานเมื่อมีการร้องขอ        |
| `onCommands`     | ไม่      | `string[]`                                           | รหัสคำสั่งที่ควรทำให้ Plugin นี้เปิดใช้งาน                            |
| `onChannels`     | ไม่      | `string[]`                                           | รหัสช่องทางที่ควรทำให้ Plugin นี้เปิดใช้งาน                           |
| `onRoutes`       | ไม่      | `string[]`                                           | ชนิดของ route ที่ควรทำให้ Plugin นี้เปิดใช้งาน                        |
| `onCapabilities` | ไม่      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ความสามารถแบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane |

consumer ที่ใช้งานจริงในปัจจุบัน:

- การวางแผน CLI ที่ถูกทริกเกอร์ด้วยคำสั่งจะ fallback ไปยัง
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- การวางแผน setup/channel ที่ถูกทริกเกอร์ด้วยช่องทางจะ fallback ไปยังความเป็นเจ้าของ
  `channels[]` แบบเดิม เมื่อไม่มี metadata ของ channel activation แบบชัดเจน
- การวางแผน setup/runtime ที่ถูกทริกเกอร์ด้วย provider จะ fallback ไปยัง
  `providers[]` แบบเดิม และความเป็นเจ้าของ `cliBackends[]` ระดับบนสุด เมื่อไม่มี metadata ของ provider
  activation แบบชัดเจน

## เอกสารอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการ metadata ของ Plugin แบบราคาถูก
ก่อนที่ runtime จะโหลด

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` ระดับบนสุดยังคงใช้ได้ และยังคงใช้อธิบาย CLI inference
backend ต่อไป `setup.cliBackends` คือพื้นผิวตัวอธิบายเฉพาะ setup สำหรับ
control-plane/setup flow ที่ควรคงไว้เป็น metadata เท่านั้น

เมื่อมีอยู่ `setup.providers` และ `setup.cliBackends` คือพื้นผิวสำหรับค้นหาแบบ
descriptor-first ที่แนะนำสำหรับการค้นพบ setup หากตัวอธิบายเพียง
ทำหน้าที่ narrowing candidate Plugin และ setup ยังต้องการ hook ขณะ setup ที่สมบูรณ์กว่านี้
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็น
พาธ fallback สำหรับการดำเนินการ

เนื่องจากการค้นหา setup สามารถรันโค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้
ค่า `setup.providers[].id` และ `setup.cliBackends[]` ที่ผ่านการ normalize แล้วจึงต้อง
คงความไม่ซ้ำกันข้าม Plugin ที่ถูกค้นพบ ความเป็นเจ้าของที่กำกวมจะ fail closed
แทนที่จะเลือกผู้ชนะตามลำดับของการค้นพบ

### เอกสารอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น  | ชนิดข้อมูล | ความหมาย                                                                                 |
| ------------- | -------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | ใช่      | `string`   | รหัส provider ที่เปิดเผยระหว่าง setup หรือ onboarding ให้คงรหัสที่ normalize แล้วไม่ซ้ำกันทั้งระบบ |
| `authMethods` | ไม่      | `string[]` | รหัสวิธี setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลด runtime เต็ม                   |
| `envVars`     | ไม่      | `string[]` | env var ที่พื้นผิว setup/status แบบทั่วไปสามารถตรวจสอบได้ก่อน runtime ของ Plugin จะโหลด |

### ฟิลด์ `setup`

| ฟิลด์              | จำเป็น  | ชนิดข้อมูล | ความหมาย                                                                                          |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่      | `object[]` | ตัวอธิบาย setup ของ provider ที่เปิดเผยระหว่าง setup และ onboarding                               |
| `cliBackends`      | ไม่      | `string[]` | รหัส backend ขณะ setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first ให้คงรหัสที่ normalize แล้วไม่ซ้ำกันทั้งระบบ |
| `configMigrations` | ไม่      | `string[]` | รหัส config migration ที่เป็นของพื้นผิว setup ของ Plugin นี้                                      |
| `requiresRuntime`  | ไม่      | `boolean`  | setup ยังคงต้องรัน `setup-api` หลังการค้นหาแบบ descriptor หรือไม่                                 |

## เอกสารอ้างอิง `uiHints`

`uiHints` คือ map จากชื่อฟิลด์ config ไปยังคำใบ้ด้านการเรนเดอร์ขนาดเล็ก

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "ใช้สำหรับคำขอ OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

คำใบ้ของแต่ละฟิลด์อาจมี:

| ฟิลด์         | ชนิดข้อมูล | ความหมาย                                  |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | ป้ายชื่อฟิลด์ที่แสดงต่อผู้ใช้             |
| `help`        | `string`   | ข้อความช่วยเหลือสั้น ๆ                   |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                      |
| `advanced`    | `boolean`  | ระบุว่าฟิลด์นี้เป็นฟิลด์ขั้นสูง           |
| `sensitive`   | `boolean`  | ระบุว่าฟิลด์นี้เป็น secret หรืออ่อนไหว    |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับฟอร์มอินพุต     |

## เอกสารอ้างอิง `contracts`

ใช้ `contracts` เฉพาะกับ metadata แบบ static ของความเป็นเจ้าของ capability ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้อง import runtime ของ Plugin

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

แต่ละรายการเป็นแบบไม่บังคับ:

| ฟิลด์                            | ชนิดข้อมูล | ความหมาย                                                              |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | รหัส runtime แบบ embedded ที่ Plugin ที่มากับระบบอาจลงทะเบียน factory ให้ |
| `speechProviders`                | `string[]` | รหัส speech provider ที่ Plugin นี้เป็นเจ้าของ                         |
| `realtimeTranscriptionProviders` | `string[]` | รหัส realtime-transcription provider ที่ Plugin นี้เป็นเจ้าของ         |
| `realtimeVoiceProviders`         | `string[]` | รหัส realtime-voice provider ที่ Plugin นี้เป็นเจ้าของ                 |
| `mediaUnderstandingProviders`    | `string[]` | รหัส media-understanding provider ที่ Plugin นี้เป็นเจ้าของ            |
| `imageGenerationProviders`       | `string[]` | รหัส image-generation provider ที่ Plugin นี้เป็นเจ้าของ               |
| `videoGenerationProviders`       | `string[]` | รหัส video-generation provider ที่ Plugin นี้เป็นเจ้าของ               |
| `webFetchProviders`              | `string[]` | รหัส web-fetch provider ที่ Plugin นี้เป็นเจ้าของ                      |
| `webSearchProviders`             | `string[]` | รหัส web-search provider ที่ Plugin นี้เป็นเจ้าของ                     |
| `tools`                          | `string[]` | ชื่อเครื่องมือของเอเจนต์ที่ Plugin นี้เป็นเจ้าของ สำหรับการตรวจสอบสัญญาของ bundle |

## เอกสารอ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
โมเดลเริ่มต้น ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสารแบบ native ที่
ตัวช่วย generic ของ core ต้องรู้ก่อน runtime จะโหลด คีย์ต้องถูกประกาศไว้ด้วยใน
`contracts.mediaUnderstandingProviders`

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

รายการของ provider แต่ละตัวอาจมี:

| ฟิลด์                  | ชนิดข้อมูล                          | ความหมาย                                                                    |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | ความสามารถด้านสื่อที่ provider นี้เปิดเผย                                   |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นแบบ capability-to-model ที่ใช้เมื่อ config ไม่ระบุโมเดล          |
| `autoPriority`         | `Record<string, number>`            | ค่าที่น้อยกว่าจะเรียงก่อนสำหรับ fallback ของ provider อัตโนมัติที่อิงข้อมูลรับรอง |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบ native ที่ provider รองรับ                                  |

## เอกสารอ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ Plugin ของช่องทางต้องการ metadata ของ config แบบราคาถูกก่อน
runtime จะโหลด

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "การเชื่อมต่อ Matrix homeserver",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

รายการของแต่ละช่องทางอาจมี:

| ฟิลด์         | ชนิดข้อมูล               | ความหมาย                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการ config ของช่องทางที่ประกาศไว้ |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ UI/placeholder/คำใบ้เรื่องความอ่อนไหวแบบไม่บังคับสำหรับส่วน config ของช่องทางนั้น |
| `label`       | `string`                 | ป้ายชื่อช่องทางที่จะถูกรวมเข้ากับพื้นผิว picker และ inspect เมื่อ metadata ขณะรันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายสั้น ๆ ของช่องทางสำหรับพื้นผิว inspect และ catalog                               |
| `preferOver`  | `string[]`               | รหัส Plugin แบบเดิมหรือแบบลำดับความสำคัญต่ำกว่าที่ช่องทางนี้ควรมีอันดับเหนือกว่าในพื้นผิวการเลือก |

## เอกสารอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin provider ของคุณจาก
รหัสโมเดลแบบ shorthand เช่น `gpt-5.4` หรือ `claude-sonnet-4.6` ก่อนที่ runtime ของ Plugin
จะโหลด

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญดังนี้:

- ref แบบ `provider/model` ที่ชัดเจนจะใช้ metadata `providers` ของ manifest ที่เป็นเจ้าของ
- `modelPatterns` มีลำดับเหนือ `modelPrefixes`
- หากทั้ง Plugin ที่ไม่มากับระบบหนึ่งตัวและ Plugin ที่มากับระบบหนึ่งตัวตรงกัน Plugin ที่ไม่มากับระบบจะชนะ
- ความกำกวมที่เหลือจะถูกละเลยจนกว่าผู้ใช้หรือ config จะระบุ provider

ฟิลด์:

| ฟิลด์           | ชนิดข้อมูล | ความหมาย                                                                    |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | prefix ที่จับคู่ด้วย `startsWith` กับรหัสโมเดลแบบ shorthand                  |
| `modelPatterns` | `string[]` | source ของ regex ที่จับคู่กับรหัสโมเดลแบบ shorthand หลังลบ profile suffix แล้ว |

คีย์ capability ระดับบนสุดแบบเดิมเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การ
โหลด manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็น
ความเป็นเจ้าของ capability อีกต่อไป

## manifest เทียบกับ `package.json`

ไฟล์ทั้งสองทำหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ, การตรวจสอบ config, metadata ของ auth-choice และคำใบ้ UI ที่ต้องมีอยู่ก่อนโค้ดของ Plugin จะรัน                               |
| `package.json`         | metadata ของ npm, การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, install gating, setup หรือ metadata ของ catalog |

หากคุณไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้มันก่อนโหลดโค้ดของ Plugin ให้นำไปไว้ใน `openclaw.plugin.json`
- หากมันเกี่ยวกับ packaging, ไฟล์ entry หรือพฤติกรรมการติดตั้งของ npm ให้นำไปไว้ใน `package.json`

### ฟิลด์ใน `package.json` ที่มีผลต่อการค้นพบ

metadata ของ Plugin ก่อนรันไทม์บางอย่างตั้งใจอยู่ใน `package.json` ภายใต้
บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ประกาศ entrypoint ของ Plugin แบบ native ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                                            |
| `openclaw.runtimeExtensions`                                      | ประกาศ entrypoint ของ runtime JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                     |
| `openclaw.setupEntry`                                             | entrypoint แบบเบาสำหรับ setup เท่านั้น ใช้ระหว่าง onboarding, การเริ่มต้นช่องทางแบบ deferred และการค้นพบ channel status/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin |
| `openclaw.runtimeSetupEntry`                                      | ประกาศ entrypoint ของ setup JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                        |
| `openclaw.channel`                                                | metadata ราคาถูกของ catalog ช่องทาง เช่น ป้ายชื่อ พาธเอกสาร alias และข้อความสำหรับการเลือก                                                                                  |
| `openclaw.channel.configuredState`                                | metadata ราคาถูกสำหรับตัวตรวจสอบ configured-state ที่สามารถตอบได้ว่า "มีการตั้งค่าผ่าน env อย่างเดียวอยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ของช่องทางเต็ม                  |
| `openclaw.channel.persistedAuthState`                             | metadata ราคาถูกสำหรับตัวตรวจสอบ persisted-auth ที่สามารถตอบได้ว่า "มีอะไรลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ของช่องทางเต็ม                                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | คำใบ้สำหรับ install/update ของ Plugin ที่มากับระบบและ Plugin ที่เผยแพร่ภายนอก                                                                                                |
| `openclaw.install.defaultChoice`                                  | พาธการติดตั้งที่ต้องการเมื่อมีหลายแหล่งติดตั้ง                                                                                                                                |
| `openclaw.install.minHostVersion`                                 | เวอร์ชันต่ำสุดของโฮสต์ OpenClaw ที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22`                                                                                              |
| `openclaw.install.expectedIntegrity`                              | สตริง npm dist integrity ที่คาดไว้ เช่น `sha512-...`; โฟลว์ติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมาว่าตรงกับค่านี้                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตพาธการกู้คืนแบบแคบสำหรับการติดตั้งใหม่ของ Plugin ที่มากับระบบเมื่อ config ไม่ถูกต้อง                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิวช่องทางแบบ setup-only โหลดได้ก่อน Plugin ช่องทางเต็มระหว่างการเริ่มต้น                                                                                        |

metadata ใน manifest จะตัดสินว่าตัวเลือก provider/channel/setup ใด
ปรากฏใน onboarding ก่อนที่ runtime จะโหลด ส่วน `package.json#openclaw.install` จะบอก
onboarding ว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไร เมื่อผู้ใช้เลือกหนึ่งในตัวเลือก
เหล่านั้น อย่าย้ายคำใบ้การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด registry
ของ manifest ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ถูกต้องแต่ใหม่กว่าโฮสต์จะทำให้
Plugin ถูกข้ามบนโฮสต์ที่เก่ากว่า

การ pin เวอร์ชัน npm แบบ exact มีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` ให้จับคู่สิ่งนี้กับ
`expectedIntegrity` เมื่อคุณต้องการให้โฟลว์อัปเดต fail closed หาก artifact npm
ที่ดึงมาไม่ตรงกับ release ที่ pin ไว้อีกต่อไป onboarding แบบ interactive จะเสนอ
ตัวเลือกการติดตั้ง npm เฉพาะจาก metadata ของ catalog ที่เชื่อถือได้เมื่อ `npmSpec` เป็นเวอร์ชัน exact และมี `expectedIntegrity` อยู่; มิฉะนั้นจะ fallback ไปยังแหล่ง local หรือ skip

Plugin ของช่องทางควรมี `openclaw.setupEntry` เมื่อ status, รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าไว้โดยไม่ต้องโหลด runtime เต็ม
entry ของ setup ควรเปิดเผย metadata ของช่องทาง พร้อม adapter สำหรับ config, status และ secrets ที่ปลอดภัยสำหรับ setup; ให้เก็บ network client, gateway listener และ transport runtime ไว้ใน extension entrypoint หลัก

ฟิลด์ runtime entrypoint ไม่ได้ override การตรวจสอบขอบเขตของแพ็กเกจสำหรับฟิลด์ source entrypoint ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` มีขอบเขตแคบโดยตั้งใจ มันไม่ได้
ทำให้ config ที่พังแบบตามอำเภอใจสามารถติดตั้งได้ ปัจจุบันมันอนุญาตเฉพาะ
โฟลว์การติดตั้งให้กู้คืนจากความล้มเหลวเฉพาะของการอัปเกรด Plugin ที่มากับระบบแบบล้าสมัย เช่น
พาธของ Plugin ที่มากับระบบหายไป หรือรายการ `channels.<id>` แบบล้าสมัยสำหรับ
Plugin ที่มากับระบบตัวเดียวกัน ข้อผิดพลาดของ config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่ง
ผู้ปฏิบัติงานไปยัง `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ metadata ของแพ็กเกจสำหรับโมดูล checker ขนาดเล็ก:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

ใช้เมื่อโฟลว์ setup, doctor หรือ configured-state ต้องการการ probe สถานะ auth แบบ yes/no ราคาถูก
ก่อนที่ Plugin ช่องทางเต็มจะโหลด export เป้าหมายควรเป็นฟังก์ชันขนาดเล็ก
ที่อ่านเฉพาะ persisted state; อย่ากำหนดเส้นทางผ่าน barrel runtime ของช่องทางเต็ม

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบ configured แบบ env-only ราคาถูก:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

ใช้เมื่อช่องทางสามารถตอบ configured-state จาก env หรืออินพุตขนาดเล็กอื่น
ที่ไม่ใช่ runtime ได้ หากการตรวจสอบต้องใช้การ resolve config เต็มหรือ
runtime จริงของช่องทาง ให้คงตรรกะนั้นไว้ใน hook `config.hasConfiguredState`
ของ Plugin แทน

## ลำดับความสำคัญของการค้นพบ (รหัส Plugin ซ้ำ)

OpenClaw ค้นพบ Plugin จากหลาย root (bundled, global install, workspace, พาธที่เลือกผ่าน config แบบชัดเจน) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด** เท่านั้น; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดควบคู่กัน

ลำดับความสำคัญ จากสูงไปต่ำ:

1. **เลือกผ่าน config** — พาธที่ pin ไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อม OpenClaw
3. **Global install** — Plugin ที่ติดตั้งลงใน global OpenClaw plugin root
4. **Workspace** — Plugin ที่ถูกค้นพบโดยอิงจาก workspace ปัจจุบัน

ผลที่ตามมา:

- fork หรือสำเนาเก่าของ Plugin ที่มากับระบบซึ่งวางอยู่ใน workspace จะไม่สามารถ shadow บิลด์ที่มากับระบบได้
- หากต้องการ override Plugin ที่มากับระบบด้วย Plugin ในเครื่องจริง ๆ ให้ pin ผ่าน `plugins.entries.<id>` เพื่อให้มันชนะด้วยลำดับความสำคัญ แทนที่จะพึ่งการค้นพบจาก workspace
- การทิ้งรายการซ้ำจะถูกบันทึกในล็อก เพื่อให้ Doctor และการวินิจฉัยระหว่างเริ่มต้นระบบสามารถชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนดของ JSON Schema

- **Plugin ทุกตัวต้องมี JSON Schema** แม้ว่าจะไม่รับ config ใด ๆ ก็ตาม
- schema แบบว่างถือว่ายอมรับได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema จะถูกตรวจสอบตอนอ่าน/เขียน config ไม่ใช่ตอนรันไทม์

## พฤติกรรมการตรวจสอบ

- คีย์ `channels.*` ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด** เว้นแต่รหัสช่องทางนั้นจะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, และ `plugins.slots.*`
  ต้องอ้างอิงรหัส Plugin ที่ **ค้นพบได้** รหัสที่ไม่รู้จักถือเป็น **ข้อผิดพลาด**
- หาก Plugin ถูกติดตั้งอยู่แต่มี manifest หรือ schema ที่เสียหายหรือขาดหาย
  การตรวจสอบจะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin อยู่แต่ Plugin **ถูกปิดใช้งาน** config จะยังคงอยู่ และ
  จะมี **คำเตือน** ใน Doctor + logs

ดู [Configuration reference](/th/gateway/configuration) สำหรับ schema แบบเต็มของ `plugins.*`

## หมายเหตุ

- manifest เป็นสิ่งที่ **จำเป็นสำหรับ Plugin แบบ native ของ OpenClaw** รวมถึงการโหลดจากระบบไฟล์ในเครื่อง
- runtime ยังคงโหลดโมดูลของ Plugin แยกต่างหาก; manifest มีไว้สำหรับ
  discovery + validation เท่านั้น
- manifest แบบ native จะถูก parse ด้วย JSON5 ดังนั้นจึงรองรับ comment, comma ปิดท้าย และ
  คีย์ที่ไม่ใส่เครื่องหมายอัญประกาศ ตราบใดที่ค่าท้ายสุดยังคงเป็นอ็อบเจ็กต์
- ตัวโหลด manifest จะอ่านเฉพาะฟิลด์ manifest ที่มีเอกสารรองรับเท่านั้น หลีกเลี่ยงการเพิ่ม
  คีย์ระดับบนสุดแบบกำหนดเองที่นี่
- `providerAuthEnvVars` คือพาธ metadata แบบราคาถูกสำหรับ auth probe, การตรวจสอบ env-marker
  และพื้นผิวอื่นที่เกี่ยวกับ provider-auth ซึ่งไม่ควรต้องบูต runtime ของ Plugin
  เพียงเพื่อดูชื่อ env
- `providerAuthAliases` ช่วยให้ provider variant ใช้ auth env var,
  auth profile, auth ที่รองรับด้วย config และตัวเลือก onboarding ของ API key
  ร่วมกับ provider อื่นได้ โดยไม่ต้อง hardcode ความสัมพันธ์นั้นไว้ใน core
- `providerEndpoints` ช่วยให้ Plugin ของ provider เป็นเจ้าของ metadata แบบง่ายสำหรับการจับคู่ host/baseUrl ของ endpoint ใช้มันเฉพาะกับ endpoint class ที่ core รองรับอยู่แล้ว;
  Plugin ยังคงเป็นเจ้าของพฤติกรรมขณะรันไทม์
- `syntheticAuthRefs` คือพาธ metadata แบบราคาถูกสำหรับ synthetic
  auth hook ที่ Plugin เป็นเจ้าของ ซึ่งต้องมองเห็นได้จากการค้นพบโมเดลแบบ cold
  ก่อนที่ registry ขณะรันไทม์จะมีอยู่ ให้ระบุเฉพาะ ref ที่ runtime ของ provider หรือ CLI backend
  นั้น ๆ ติดตั้ง `resolveSyntheticAuth` จริงเท่านั้น
- `nonSecretAuthMarkers` คือพาธ metadata แบบราคาถูกสำหรับ
  placeholder API key ที่ Plugin ที่มากับระบบเป็นเจ้าของ เช่น marker ของ credential แบบ local, OAuth หรือ ambient
  Core จะถือว่าสิ่งเหล่านี้เป็น non-secret สำหรับการแสดง auth และการ audit secret โดยไม่ต้อง hardcode provider ที่เป็นเจ้าของ
- `channelEnvVars` คือพาธ metadata แบบราคาถูกสำหรับ shell-env fallback, พรอมป์ setup
  และพื้นผิวของช่องทางที่คล้ายกัน ซึ่งไม่ควรต้องบูต runtime ของ Plugin
  เพียงเพื่อตรวจสอบชื่อ env ชื่อ env เป็น metadata ไม่ใช่ activation
  ด้วยตัวมันเอง: status, audit, การตรวจสอบ cron delivery validation และพื้นผิวแบบอ่านอย่างเดียวอื่น ๆ
  ยังคงใช้นโยบายความเชื่อถือของ Plugin และนโยบาย activation ที่มีผลอยู่ก่อนที่จะ
  ถือว่า env var นั้นเป็นช่องทางที่กำหนดค่าไว้
- `providerAuthChoices` คือพาธ metadata แบบราคาถูกสำหรับตัวเลือก auth,
  การ resolve `--auth-choice`, การแมป preferred-provider และการลงทะเบียน
  CLI flag แบบง่ายใน onboarding ก่อนที่ runtime ของ provider จะโหลด สำหรับ metadata ของ wizard ขณะรันไทม์
  ที่ต้องใช้โค้ด provider ดู
  [Provider runtime hooks](/th/plugins/architecture#provider-runtime-hooks)
- ชนิดของ Plugin แบบ exclusive จะถูกเลือกผ่าน `plugins.slots.*`
  - `kind: "memory"` ถูกเลือกโดย `plugins.slots.memory`
  - `kind: "context-engine"` ถูกเลือกโดย `plugins.slots.contextEngine`
    (ค่าเริ่มต้น: `legacy` แบบ built-in)
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ได้เมื่อ
  Plugin ไม่ต้องใช้
- หาก Plugin ของคุณต้องใช้ native module ให้จัดทำเอกสารขั้นตอน build และ
  ข้อกำหนด allowlist ของ package manager ที่เกี่ยวข้อง (เช่น pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — เริ่มต้นกับ Plugins
- [Plugin Architecture](/th/plugins/architecture) — สถาปัตยกรรมภายใน
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิง Plugin SDK
