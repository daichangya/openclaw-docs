---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องส่งมอบ schema คอนฟิกของ Plugin หรือแก้ปัญหาข้อผิดพลาดในการตรวจสอบ Plugin
summary: ข้อกำหนดของ Plugin manifest + JSON schema (การตรวจสอบคอนฟิกแบบเข้มงวด)
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-24T09:23:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

หน้านี้มีไว้สำหรับ **native OpenClaw plugin manifest** เท่านั้น

สำหรับเลย์เอาต์ bundle ที่เข้ากันได้ โปรดดู [Plugin bundles](/th/plugins/bundles)

รูปแบบ bundle ที่เข้ากันได้ใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือเลย์เอาต์ component แบบค่าปริยายของ Claude
  ที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw ตรวจจับเลย์เอาต์ bundle เหล่านั้นโดยอัตโนมัติด้วยเช่นกัน แต่จะไม่ถูกตรวจสอบ
เทียบกับ schema ของ `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ bundle ที่เข้ากันได้ ปัจจุบัน OpenClaw จะอ่าน metadata ของ bundle พร้อมกับ
root ของ skill ที่ประกาศไว้, root ของคำสั่ง Claude, ค่าเริ่มต้นจาก `settings.json` ของ Claude bundle,
ค่าเริ่มต้น LSP ของ Claude bundle และ hook pack ที่รองรับเมื่อเลย์เอาต์ตรงกับความคาดหวังของรันไทม์ OpenClaw

native OpenClaw Plugin ทุกตัว **ต้อง** มีไฟล์ `openclaw.plugin.json` อยู่ใน
**plugin root** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบการกำหนดค่า
**โดยไม่ต้องรันโค้ดของ Plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถูกถือเป็น
ข้อผิดพลาดของ Plugin และบล็อกการตรวจสอบคอนฟิก

ดูคู่มือระบบ Plugin แบบเต็มได้ที่: [Plugins](/th/tools/plugin)
สำหรับโมเดล capability แบบเนทีฟและแนวทางปัจจุบันเกี่ยวกับความเข้ากันได้ภายนอก:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่าน **ก่อนที่จะโหลดโค้ดของ
Plugin** ของคุณ ทุกอย่างด้านล่างนี้ต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูตรันไทม์ของ
Plugin

**ใช้สำหรับ:**

- ตัวตนของ Plugin, การตรวจสอบคอนฟิก และ hint สำหรับ UI ของคอนฟิก
- metadata สำหรับ auth, onboarding และการตั้งค่า (alias, auto-enable, env var ของ provider, ตัวเลือก auth)
- hint การเปิดใช้งานสำหรับพื้นผิว control-plane
- การเป็นเจ้าของตระกูลโมเดลแบบ shorthand
- snapshot ของการเป็นเจ้าของ capability แบบ static (`contracts`)
- metadata ของ QA runner ที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันสามารถตรวจสอบได้
- metadata คอนฟิกเฉพาะช่องทางที่ merge เข้าไปใน catalog และพื้นผิวการ validation

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรมรันไทม์, การประกาศ code entrypoint
หรือ metadata สำหรับการติดตั้ง npm สิ่งเหล่านั้นเป็นหน้าที่ของโค้ด Plugin และ `package.json`

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
  "description": "OpenRouter provider plugin",
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

## ข้อมูลอ้างอิงของฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น | ประเภท                           | ความหมาย                                                                                                                                                                                                                          |
| ------------------------------------ | ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่    | `string`                         | id แบบ canonical ของ Plugin นี่คือ id ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                           |
| `configSchema`                       | ใช่    | `object`                         | JSON Schema แบบ inline สำหรับคอนฟิกของ Plugin นี้                                                                                                                                                                                  |
| `enabledByDefault`                   | ไม่    | `true`                           | ทำเครื่องหมายว่าเป็น bundled Plugin ที่เปิดใช้งานเป็นค่าปริยาย หากละไว้ หรือกำหนดค่าอื่นที่ไม่ใช่ `true` Plugin จะยังคงปิดไว้เป็นค่าปริยาย                                                                                     |
| `legacyPluginIds`                    | ไม่    | `string[]`                       | id แบบ legacy ที่จะถูก normalize ให้เป็น canonical plugin id นี้                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | ไม่    | `string[]`                       | id ของ provider ที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติ เมื่อมีการอ้างถึง provider เหล่านั้นใน auth, config หรือ model ref                                                                                                      |
| `kind`                               | ไม่    | `"memory"` \| `"context-engine"` | ประกาศชนิดของ Plugin แบบ exclusive ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                   |
| `channels`                           | ไม่    | `string[]`                       | id ของช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบคอนฟิก                                                                                                                                                       |
| `providers`                          | ไม่    | `string[]`                       | id ของ provider ที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | ไม่    | `string`                         | พาธของโมดูล provider-discovery แบบ lightweight อ้างอิงจาก plugin root สำหรับ metadata ของ provider catalog ที่อยู่ในขอบเขต manifest ซึ่งโหลดได้โดยไม่ต้องเปิดใช้รันไทม์เต็มของ Plugin                                            |
| `modelSupport`                       | ไม่    | `object`                         | metadata แบบ shorthand สำหรับตระกูลโมเดลที่ manifest เป็นเจ้าของ ใช้เพื่อ auto-load Plugin ก่อนรันไทม์                                                                                                                           |
| `providerEndpoints`                  | ไม่    | `object[]`                       | metadata ของ host/baseUrl ของ endpoint ที่ manifest เป็นเจ้าของ สำหรับเส้นทาง provider ที่ core ต้องจำแนกก่อนที่รันไทม์ของ provider จะโหลด                                                                                         |
| `cliBackends`                        | ไม่    | `string[]`                       | id ของ CLI inference backend ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติระหว่างเริ่มต้นจาก explicit config ref                                                                                                       |
| `syntheticAuthRefs`                  | ไม่    | `string[]`                       | ref ของ provider หรือ CLI backend ที่ synthetic auth hook ของ Plugin ควรถูก probe ระหว่าง cold model discovery ก่อนที่รันไทม์จะโหลด                                                                                               |
| `nonSecretAuthMarkers`               | ไม่    | `string[]`                       | ค่า API key placeholder ที่เป็นของ bundled plugin ซึ่งแทนสถานะข้อมูลรับรองแบบไม่ใช่ความลับ เช่น local, OAuth หรือ ambient                                                                                                          |
| `commandAliases`                     | ไม่    | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรให้ผลลัพธ์เป็น config และ CLI diagnostics แบบรับรู้ Plugin ก่อนรันไทม์จะโหลด                                                                                                            |
| `providerAuthEnvVars`                | ไม่    | `Record<string, string[]>`       | metadata ของ env สำหรับ provider auth แบบ lightweight ที่ OpenClaw ตรวจสอบได้โดยไม่ต้องโหลดโค้ดของ Plugin                                                                                                                        |
| `providerAuthAliases`                | ไม่    | `Record<string, string>`         | id ของ provider ที่ควรใช้ id ของ provider อื่นซ้ำสำหรับการค้นหา auth เช่น coding provider ที่ใช้ API key และ auth profile ร่วมกับ base provider                                                                                      |
| `channelEnvVars`                     | ไม่    | `Record<string, string[]>`       | metadata ของ env สำหรับช่องทางแบบ lightweight ที่ OpenClaw ตรวจสอบได้โดยไม่ต้องโหลดโค้ดของ Plugin ใช้สิ่งนี้สำหรับพื้นผิวการตั้งค่าหรือ auth ของช่องทางที่ขับเคลื่อนด้วย env ซึ่ง startup/config helper แบบทั่วไปควรมองเห็นได้ |
| `providerAuthChoices`                | ไม่    | `object[]`                       | metadata ของ auth choice แบบ lightweight สำหรับ onboarding picker, การ resolve preferred-provider และการเชื่อมต่อ CLI flag แบบง่าย                                                                                                   |
| `activation`                         | ไม่    | `object`                         | metadata ของ activation planner แบบ lightweight สำหรับการโหลดที่ทริกเกอร์ด้วย provider, command, channel, route และ capability เป็น metadata เท่านั้น; พฤติกรรมจริงยังเป็นหน้าที่ของรันไทม์ Plugin                                |
| `setup`                              | ไม่    | `object`                         | descriptor ของ setup/onboarding แบบ lightweight ที่พื้นผิวการค้นพบและการตั้งค่าตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ของ Plugin                                                                                                            |
| `qaRunners`                          | ไม่    | `object[]`                       | descriptor ของ QA runner แบบ lightweight ที่ `openclaw qa` host ที่ใช้ร่วมกันใช้ก่อนรันไทม์ของ Plugin จะโหลด                                                                                                                       |
| `contracts`                          | ไม่    | `object`                         | snapshot ของ capability แบบ static ที่มาพร้อมระบบ สำหรับ external auth hook, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และการเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่    | `Record<string, object>`         | ค่าเริ่มต้นของ media-understanding แบบ lightweight สำหรับ provider id ที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                              |
| `channelConfigs`                     | ไม่    | `Record<string, object>`         | metadata ของคอนฟิกช่องทางที่ manifest เป็นเจ้าของ ซึ่งถูก merge เข้าไปในพื้นผิวการค้นพบและ validation ก่อนที่รันไทม์จะโหลด                                                                                                          |
| `skills`                             | ไม่    | `string[]`                       | ไดเรกทอรีของ Skills ที่จะโหลด โดยอ้างอิงจาก plugin root                                                                                                                                                                           |
| `name`                               | ไม่    | `string`                         | ชื่อ Plugin แบบอ่านเข้าใจได้สำหรับมนุษย์                                                                                                                                                                                          |
| `description`                        | ไม่    | `string`                         | สรุปสั้น ๆ ที่แสดงบนพื้นผิวของ Plugin                                                                                                                                                                                             |
| `version`                            | ไม่    | `string`                         | เวอร์ชันของ Plugin เพื่อใช้เป็นข้อมูลประกอบ                                                                                                                                                                                       |
| `uiHints`                            | ไม่    | `Record<string, object>`         | label, placeholder และ hint เกี่ยวกับความอ่อนไหวสำหรับฟิลด์คอนฟิก                                                                                                                                                               |

## ข้อมูลอ้างอิง `providerAuthChoices`

แต่ละรายการใน `providerAuthChoices` จะอธิบาย onboarding หรือ auth choice หนึ่งรายการ
OpenClaw จะอ่านส่วนนี้ก่อนที่รันไทม์ของ provider จะโหลด

| ฟิลด์                 | จำเป็น | ประเภท                                          | ความหมาย                                                                                              |
| --------------------- | ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่    | `string`                                        | id ของ provider ที่ choice นี้สังกัดอยู่                                                               |
| `method`              | ใช่    | `string`                                        | id ของวิธี auth ที่จะใช้ dispatch                                                                       |
| `choiceId`            | ใช่    | `string`                                        | id ของ auth-choice แบบคงที่ที่ใช้โดย onboarding และ flow ของ CLI                                      |
| `choiceLabel`         | ไม่    | `string`                                        | label ที่แสดงต่อผู้ใช้ หากละไว้ OpenClaw จะ fallback ไปใช้ `choiceId`                                   |
| `choiceHint`          | ไม่    | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับตัวเลือก                                                                       |
| `assistantPriority`   | ไม่    | `number`                                        | ค่าที่ต่ำกว่าจะเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดย assistant                                  |
| `assistantVisibility` | ไม่    | `"visible"` \| `"manual-only"`                  | ซ่อน choice นี้จากตัวเลือกของ assistant แต่ยังอนุญาตให้เลือกผ่าน CLI แบบ manual ได้                  |
| `deprecatedChoiceIds` | ไม่    | `string[]`                                      | id ของ choice แบบ legacy ที่ควรเปลี่ยนเส้นทางผู้ใช้มายัง choice ทดแทนนี้                            |
| `groupId`             | ไม่    | `string`                                        | group id แบบไม่บังคับ สำหรับจัดกลุ่ม choice ที่เกี่ยวข้องกัน                                            |
| `groupLabel`          | ไม่    | `string`                                        | label ที่แสดงต่อผู้ใช้สำหรับ group นั้น                                                                  |
| `groupHint`           | ไม่    | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับ group                                                                          |
| `optionKey`           | ไม่    | `string`                                        | คีย์ option ภายในสำหรับ flow auth แบบ one-flag อย่างง่าย                                              |
| `cliFlag`             | ไม่    | `string`                                        | ชื่อ CLI flag เช่น `--openrouter-api-key`                                                              |
| `cliOption`           | ไม่    | `string`                                        | รูปแบบ CLI option แบบเต็ม เช่น `--openrouter-api-key <key>`                                            |
| `cliDescription`      | ไม่    | `string`                                        | คำอธิบายที่ใช้ใน CLI help                                                                              |
| `onboardingScopes`    | ไม่    | `Array<"text-inference" \| "image-generation">` | พื้นผิว onboarding ใดบ้างที่ควรแสดง choice นี้ หากละไว้ ค่าปริยายจะเป็น `["text-inference"]`        |

## ข้อมูลอ้างอิง `commandAliases`

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามรันในฐานะคำสั่ง CLI ระดับ root โดยผิดพลาด OpenClaw
ใช้ metadata นี้เพื่อสร้าง diagnostics โดยไม่ต้อง import โค้ดรันไทม์ของ Plugin

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

| ฟิลด์        | จำเป็น | ประเภท            | ความหมาย                                                                  |
| ------------ | ------ | ----------------- | ------------------------------------------------------------------------- |
| `name`       | ใช่    | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                                           |
| `kind`       | ไม่    | `"runtime-slash"` | ทำเครื่องหมาย alias นี้ว่าเป็นคำสั่ง slash ในแชต ไม่ใช่คำสั่ง CLI ระดับ root |
| `cliCommand` | ไม่    | `string`          | คำสั่ง CLI ระดับ root ที่เกี่ยวข้องเพื่อใช้แนะนำในการดำเนินการผ่าน CLI หากมี   |

## ข้อมูลอ้างอิง `activation`

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้แบบ lightweight ว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผน activation/load

บล็อกนี้เป็น metadata ของ planner ไม่ใช่ lifecycle API มันไม่ได้ลงทะเบียน
พฤติกรรมรันไทม์ ไม่ได้แทนที่ `register(...)` และไม่ได้รับประกันว่า
โค้ดของ Plugin ได้ทำงานไปแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด candidate plugin ให้แคบลง ก่อนจะ fallback ไปยัง metadata ของการเป็นเจ้าของ manifest ที่มีอยู่เดิม
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hook

ควรเลือกใช้ metadata ที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของได้อยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, setup descriptor หรือ `contracts`
เมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์ได้ ใช้ `activation` สำหรับ hint เพิ่มเติมของ planner
ที่ไม่สามารถแทนได้ด้วยฟิลด์การเป็นเจ้าของเหล่านั้น

บล็อกนี้เป็นเพียง metadata มันไม่ได้ลงทะเบียนพฤติกรรมรันไทม์ และไม่ได้
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint ของ runtime/plugin แบบอื่น
ผู้ใช้ปัจจุบันใช้มันเป็น hint สำหรับจำกัดขอบเขตก่อนการโหลด Plugin แบบกว้างขึ้น ดังนั้น
metadata ของ activation ที่หายไปมักทำให้เสียประสิทธิภาพเท่านั้น; ไม่ควร
เปลี่ยนความถูกต้องตราบใดที่ยังมี fallback ของการเป็นเจ้าของ manifest แบบ legacy อยู่

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

| ฟิลด์            | จำเป็น | ประเภท                                               | ความหมาย                                                                                              |
| ---------------- | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `onProviders`    | ไม่    | `string[]`                                           | id ของ provider ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                          |
| `onCommands`     | ไม่    | `string[]`                                           | id ของคำสั่งที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                               |
| `onChannels`     | ไม่    | `string[]`                                           | id ของช่องทางที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                               |
| `onRoutes`       | ไม่    | `string[]`                                           | ชนิดของ route ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                             |
| `onCapabilities` | ไม่    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | hint ด้าน capability แบบกว้างที่ใช้โดย planning ของ activation ใน control-plane ควรใช้ฟิลด์ที่แคบกว่านี้เมื่อทำได้ |

ผู้ใช้จริงในปัจจุบัน:

- การวางแผน CLI ที่ถูกทริกเกอร์ด้วยคำสั่งจะ fallback ไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบ legacy
- การวางแผน setup/channel ที่ถูกทริกเกอร์ด้วยช่องทางจะ fallback ไปใช้การเป็นเจ้าของ
  `channels[]` แบบ legacy เมื่อไม่มี metadata ของ channel activation แบบ explicit
- การวางแผน setup/runtime ที่ถูกทริกเกอร์ด้วย provider จะ fallback ไปใช้การเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบ legacy เมื่อไม่มี metadata ของ provider
  activation แบบ explicit

diagnostics ของ planner สามารถแยกความแตกต่างระหว่าง activation hint แบบ explicit กับ
fallback จากการเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายถึง
ตรงกับ `activation.onCommands` ขณะที่ `manifest-command-alias` หมายถึง
planner ใช้การเป็นเจ้าของจาก `commandAliases` แทน label ของ reason เหล่านี้มีไว้สำหรับ
diagnostics และการทดสอบของโฮสต์; ผู้สร้าง Plugin ควรประกาศ metadata ที่
อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ Plugin สนับสนุน runner หนึ่งตัวหรือมากกว่าภายใต้
root `openclaw qa` ที่ใช้ร่วมกัน ควรทำให้ metadata นี้ lightweight และเป็นแบบ static;
ส่วนรันไทม์ของ Plugin ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว
`runtime-api.ts` แบบ lightweight ซึ่งส่งออก `qaRunnerCliRegistrations`

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| ฟิลด์         | จำเป็น | ประเภท   | ความหมาย                                                             |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| `commandName` | ใช่    | `string` | subcommand ที่ mount ใต้ `openclaw qa` เช่น `matrix`                 |
| `description` | ไม่    | `string` | ข้อความช่วยแบบ fallback เมื่อ shared host ต้องใช้ stub command      |

## ข้อมูลอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิวสำหรับ setup และ onboarding ต้องการ metadata ของ Plugin แบบ lightweight
ก่อนที่รันไทม์จะโหลด

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

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังคงใช้อธิบาย CLI inference
backend ส่วน `setup.cliBackends` เป็นพื้นผิว descriptor เฉพาะสำหรับ setup
สำหรับ flow ของ control-plane/setup ที่ควรคงไว้เป็น metadata เท่านั้น

เมื่อมีอยู่ `setup.providers` และ `setup.cliBackends` จะเป็น
พื้นผิว descriptor-first ที่ควรใช้สำหรับการค้นหา setup หาก
descriptor มีหน้าที่เพียงจำกัด candidate plugin ให้แคบลง และ setup ยังต้องใช้ hook ของรันไทม์ในช่วง setup ที่เข้มข้นกว่า ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็นเส้นทาง fallback สำหรับการทำงานจริง

เนื่องจากการค้นหา setup สามารถรันโค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้
ค่าของ `setup.providers[].id` และ `setup.cliBackends[]` ที่ normalize แล้วจึงต้องคงความไม่ซ้ำกันข้าม Plugin ที่ถูกค้นพบ การเป็นเจ้าของที่กำกวมจะ fail closed แทนที่จะเลือกผู้ชนะตามลำดับการค้นพบ

### ข้อมูลอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น | ประเภท     | ความหมาย                                                                                |
| ------------- | ------ | ---------- | --------------------------------------------------------------------------------------- |
| `id`          | ใช่    | `string`   | id ของ provider ที่ถูกเปิดเผยระหว่าง setup หรือ onboarding ควรทำให้ normalized id ไม่ซ้ำกันทั่วทั้งระบบ |
| `authMethods` | ไม่    | `string[]` | id ของวิธี setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลดรันไทม์เต็ม                     |
| `envVars`     | ไม่    | `string[]` | env var ที่พื้นผิว setup/status แบบทั่วไปสามารถตรวจสอบได้ก่อนที่รันไทม์ของ Plugin จะโหลด    |

### ฟิลด์ของ `setup`

| ฟิลด์              | จำเป็น | ประเภท     | ความหมาย                                                                                     |
| ------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | ไม่    | `object[]` | descriptor ของการตั้งค่า provider ที่ถูกเปิดเผยระหว่าง setup และ onboarding                  |
| `cliBackends`      | ไม่    | `string[]` | id ของ backend ในช่วง setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first ควรทำให้ normalized id ไม่ซ้ำกันทั่วทั้งระบบ |
| `configMigrations` | ไม่    | `string[]` | id ของ config migration ที่เป็นของพื้นผิว setup ของ Plugin นี้                                 |
| `requiresRuntime`  | ไม่    | `boolean`  | setup ยังต้องใช้การรัน `setup-api` ต่อหลังจาก descriptor lookup หรือไม่                        |

## ข้อมูลอ้างอิง `uiHints`

`uiHints` เป็นแมปจากชื่อฟิลด์คอนฟิกไปยัง rendering hint ขนาดเล็ก

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

hint ของแต่ละฟิลด์สามารถมีสิ่งต่อไปนี้ได้:

| ฟิลด์         | ประเภท     | ความหมาย                                 |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | label ของฟิลด์ที่แสดงต่อผู้ใช้            |
| `help`        | `string`   | ข้อความช่วยสั้น ๆ                        |
| `tags`        | `string[]` | tag สำหรับ UI แบบไม่บังคับ               |
| `advanced`    | `boolean`  | ทำเครื่องหมายว่าฟิลด์นี้เป็นแบบ advanced |
| `sensitive`   | `boolean`  | ทำเครื่องหมายว่าฟิลด์นี้เป็น secret หรือมีความอ่อนไหว |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับ input ในฟอร์ม |

## ข้อมูลอ้างอิง `contracts`

ใช้ `contracts` เฉพาะสำหรับ metadata การเป็นเจ้าของ capability แบบ static ที่ OpenClaw
สามารถอ่านได้โดยไม่ต้อง import รันไทม์ของ Plugin

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| ฟิลด์                            | ประเภท     | ความหมาย                                                              |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id ของ embedded runtime ที่ bundled Plugin สามารถลงทะเบียน factory ให้ได้ |
| `externalAuthProviders`          | `string[]` | id ของ provider ที่ external auth profile hook เป็นของ Plugin นี้       |
| `speechProviders`                | `string[]` | id ของ speech provider ที่ Plugin นี้เป็นเจ้าของ                       |
| `realtimeTranscriptionProviders` | `string[]` | id ของ realtime-transcription provider ที่ Plugin นี้เป็นเจ้าของ      |
| `realtimeVoiceProviders`         | `string[]` | id ของ realtime-voice provider ที่ Plugin นี้เป็นเจ้าของ              |
| `memoryEmbeddingProviders`       | `string[]` | id ของ memory embedding provider ที่ Plugin นี้เป็นเจ้าของ            |
| `mediaUnderstandingProviders`    | `string[]` | id ของ media-understanding provider ที่ Plugin นี้เป็นเจ้าของ         |
| `imageGenerationProviders`       | `string[]` | id ของ image-generation provider ที่ Plugin นี้เป็นเจ้าของ            |
| `videoGenerationProviders`       | `string[]` | id ของ video-generation provider ที่ Plugin นี้เป็นเจ้าของ            |
| `webFetchProviders`              | `string[]` | id ของ web-fetch provider ที่ Plugin นี้เป็นเจ้าของ                   |
| `webSearchProviders`             | `string[]` | id ของ web-search provider ที่ Plugin นี้เป็นเจ้าของ                  |
| `tools`                          | `string[]` | ชื่อเครื่องมือของเอเจนต์ที่ Plugin นี้เป็นเจ้าของ สำหรับ bundled contract checks |

Provider plugin ที่ใช้ `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugin ที่ไม่มีการประกาศนี้ยังคงทำงานผ่าน compatibility fallback ที่เลิกใช้แล้วได้ แต่ fallback นั้นช้ากว่าและจะ
ถูกนำออกหลังจากหมดช่วง migration

bundled memory embedding provider ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับทุก adapter id ที่มันเปิดเผย รวมถึง
adapter ที่มีมาในตัวเช่น `local` เส้นทาง CLI แบบ standalone ใช้สัญญาใน manifest นี้
เพื่อโหลดเฉพาะ Plugin เจ้าของ ก่อนที่รันไทม์ Gateway แบบเต็มจะลงทะเบียน provider

## ข้อมูลอ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
โมเดลค่าปริยาย ลำดับความสำคัญ auto-auth fallback หรือตัวรองรับเอกสารแบบเนทีฟ ที่ helper ทั่วไปของ core ต้องใช้ก่อนรันไทม์จะโหลด คีย์ต้องถูกประกาศไว้ใน
`contracts.mediaUnderstandingProviders` ด้วย

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

แต่ละรายการของ provider สามารถมีสิ่งต่อไปนี้ได้:

| ฟิลด์                  | ประเภท                              | ความหมาย                                                                     |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | capability ด้านสื่อที่ provider นี้เปิดเผย                                  |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นแบบ capability-to-model ที่ใช้เมื่อ config ไม่ได้ระบุโมเดล       |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะถูกเรียงก่อนสำหรับ fallback อัตโนมัติของ provider ตามข้อมูลรับรอง |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบเนทีฟที่ provider รองรับ                                      |

## ข้อมูลอ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ channel plugin ต้องการ metadata ของคอนฟิกแบบ lightweight ก่อน
ที่รันไทม์จะโหลด

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
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

แต่ละรายการของช่องทางสามารถมีสิ่งต่อไปนี้ได้:

| ฟิลด์         | ประเภท                   | ความหมาย                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการคอนฟิกช่องทางที่ประกาศไว้      |
| `uiHints`     | `Record<string, object>` | label/placeholder/hint เรื่องความอ่อนไหวแบบไม่บังคับสำหรับส่วนคอนฟิกของช่องทางนั้น       |
| `label`       | `string`                 | label ของช่องทางที่ merge เข้าไปในพื้นผิวตัวเลือกและการตรวจสอบ เมื่อ metadata ของรันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายสั้น ๆ ของช่องทางสำหรับพื้นผิว inspect และ catalog                                 |
| `preferOver`  | `string[]`               | id ของ Plugin แบบ legacy หรือมีลำดับความสำคัญต่ำกว่า ที่ช่องทางนี้ควรมีน้ำหนักเหนือกว่าในพื้นผิวการเลือก |

## ข้อมูลอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน provider plugin ของคุณจาก
model id แบบ shorthand เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่รันไทม์ของ Plugin
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

- ref แบบ explicit `provider/model` จะใช้ metadata `providers` ใน manifest ของเจ้าของ
- `modelPatterns` มีความสำคัญเหนือ `modelPrefixes`
- หากมี Plugin ที่ไม่ bundled หนึ่งตัว และ bundled plugin หนึ่งตัวตรงกันทั้งคู่
  Plugin ที่ไม่ bundled จะชนะ
- ความกำกวมที่เหลือจะถูกละไว้จนกว่าผู้ใช้หรือ config จะระบุ provider อย่างชัดเจน

ฟิลด์:

| ฟิลด์           | ประเภท     | ความหมาย                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | prefix ที่จับคู่ด้วย `startsWith` กับ shorthand model id                |
| `modelPatterns` | `string[]` | regex source ที่จับคู่กับ shorthand model id หลังจากตัด profile suffix ออก |

คีย์ capability ระดับบนสุดแบบ legacy เลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ภายใต้ `contracts`; การโหลด manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นการเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

ไฟล์สองไฟล์นี้มีหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ การตรวจสอบคอนฟิก metadata ของ auth-choice และ hint ของ UI ที่ต้องมีอยู่ก่อนโค้ดของ Plugin จะรัน                        |
| `package.json`         | metadata ของ npm, การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, install gating, setup หรือ metadata ของ catalog |

หากคุณไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ไหน ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ข้อมูลนั้นก่อนโหลดโค้ดของ Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเป็นเรื่องการแพ็กเกจ ไฟล์ entry หรือพฤติกรรมการติดตั้งของ npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ใน package.json ที่มีผลต่อการค้นพบ

metadata ก่อนรันไทม์ของ Plugin บางส่วนตั้งใจให้เก็บไว้ใน `package.json` ภายใต้
บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ประกาศ entrypoint ของ native Plugin ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                                                           |
| `openclaw.runtimeExtensions`                                      | ประกาศ entrypoint ของ JavaScript runtime ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                  |
| `openclaw.setupEntry`                                             | entrypoint แบบ setup-only ที่ lightweight ใช้ระหว่าง onboarding, deferred channel startup และการค้นพบสถานะช่องทาง/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin |
| `openclaw.runtimeSetupEntry`                                      | ประกาศ built JavaScript setup entrypoint สำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                              |
| `openclaw.channel`                                                | metadata แบบ lightweight ของ catalog ช่องทาง เช่น label, พาธของ docs, alias และข้อความสำหรับการเลือก                                                                                  |
| `openclaw.channel.configuredState`                                | metadata ของตัวตรวจสอบ configured-state แบบ lightweight ที่สามารถตอบได้ว่า "มีการตั้งค่าจาก env อย่างเดียวอยู่แล้วหรือไม่" โดยไม่ต้องโหลดรันไทม์เต็มของช่องทาง                         |
| `openclaw.channel.persistedAuthState`                             | metadata ของตัวตรวจสอบ persisted-auth แบบ lightweight ที่สามารถตอบได้ว่า "มีการล็อกอินอะไรอยู่แล้วหรือไม่" โดยไม่ต้องโหลดรันไทม์เต็มของช่องทาง                                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | hint สำหรับการติดตั้ง/อัปเดตของ bundled plugin และ Plugin ที่เผยแพร่ภายนอก                                                                                                             |
| `openclaw.install.defaultChoice`                                  | เส้นทางการติดตั้งที่ควรใช้เป็นอันดับแรกเมื่อมีหลายแหล่งให้ติดตั้ง                                                                                                                          |
| `openclaw.install.minHostVersion`                                 | เวอร์ชันขั้นต่ำของโฮสต์ OpenClaw ที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22`                                                                                                        |
| `openclaw.install.expectedIntegrity`                              | สตริง integrity ที่คาดหวังของ npm dist เช่น `sha512-...`; flow การติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมาว่าตรงกับค่านี้                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตเส้นทางการกู้คืนแบบแคบสำหรับการติดตั้ง bundled plugin ใหม่ เมื่อคอนฟิกไม่ถูกต้อง                                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิวช่องทางแบบ setup-only โหลดก่อน full channel plugin ระหว่างการเริ่มต้น                                                                                                   |

metadata ใน manifest เป็นตัวตัดสินว่า choice ของ provider/channel/setup ใด
จะปรากฏใน onboarding ก่อนที่รันไทม์จะโหลด ส่วน `package.json#openclaw.install` จะบอก
onboarding ว่าควรดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
choice เหล่านั้น อย่าย้าย install hint ไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและ
การโหลด registry ของ manifest ค่าไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม
Plugin นั้นบนโฮสต์ที่เก่ากว่า

การปักหมุดเวอร์ชัน npm แบบ exact มีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการใน official external catalog
ควรจับคู่สเปกแบบ exact กับ `expectedIntegrity` เพื่อให้ flow การอัปเดต fail
closed หาก npm artifact ที่ดึงมาไม่ตรงกับ release ที่ปักหมุดไว้แล้ว
interactive onboarding ยังคงเสนอ trusted registry npm spec รวมถึง bare
package name และ dist-tag เพื่อความเข้ากันได้ catalog diagnostics สามารถ
แยกแยะได้ระหว่างแหล่งที่เป็น exact, floating, integrity-pinned และ missing-integrity
เมื่อมี `expectedIntegrity`, flow การติดตั้ง/อัปเดตจะบังคับใช้มัน; เมื่อไม่มี
ระบบจะบันทึก registry resolution โดยไม่มี integrity pin

channel plugin ควรจัดเตรียม `openclaw.setupEntry` เมื่อสถานะ รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าไว้โดยไม่ต้องโหลด
รันไทม์เต็ม setup entry ควรเปิดเผย metadata ของช่องทาง พร้อมตัวปรับสำหรับ config,
status และ secrets ที่ปลอดภัยในขั้นตอน setup; ให้คง network client,
gateway listener และ transport runtime ไว้ใน extension entrypoint หลัก

ฟิลด์ runtime entrypoint ไม่ได้ override การตรวจสอบขอบเขตแพ็กเกจสำหรับ
ฟิลด์ source entrypoint ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดขอบเขตถูกโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกตั้งใจให้แคบมาก มัน
ไม่ได้ทำให้คอนฟิกเสียทุกแบบติดตั้งได้ ปัจจุบันมันอนุญาตเพียงให้ flow การติดตั้ง
กู้คืนจากความล้มเหลวบางแบบในการอัปเกรด bundled plugin ที่ค้างอยู่ เช่น
พาธของ bundled plugin ที่หายไป หรือรายการ `channels.<id>` เก่าที่ค้างอยู่สำหรับ
bundled plugin เดียวกันนั้น ข้อผิดพลาดของคอนฟิกที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่ง
operator ไปยัง `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ metadata ในแพ็กเกจสำหรับโมดูลตรวจสอบขนาดเล็ก:

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

ใช้สิ่งนี้เมื่อ flow ของ setup, doctor หรือ configured-state ต้องการ auth
probe แบบ yes/no ที่ lightweight ก่อนจะโหลด channel plugin แบบเต็ม export เป้าหมายควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะ persisted state เท่านั้น; อย่า route ผ่าน barrel ของรันไทม์ช่องทางเต็ม

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจ configured-state
แบบ lightweight ที่อิงจาก env เท่านั้น:

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

ใช้เมื่อช่องทางสามารถตอบ configured-state ได้จาก env หรืออินพุตขนาดเล็กอื่น
ที่ไม่ใช่รันไทม์ หากการตรวจต้องใช้ full config resolution หรือ
รันไทม์จริงของช่องทาง ให้คงตรรกะนั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญในการค้นพบ (plugin id ซ้ำ)

OpenClaw ค้นพบ Plugin จากหลาย root (bundled, global install, workspace, path ที่เลือกผ่าน config อย่างชัดเจน) หากการค้นพบสองรายการมี `id` เดียวกัน ระบบจะเก็บไว้เฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด** เท่านั้น; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะถูกโหลดอยู่ข้างกัน

ลำดับความสำคัญจากสูงไปต่ำ:

1. **Config-selected** — พาธที่ถูกปักหมุดอย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อมกับ OpenClaw
3. **Global install** — Plugin ที่ติดตั้งไว้ใน global OpenClaw plugin root
4. **Workspace** — Plugin ที่ถูกค้นพบโดยอิงจาก workspace ปัจจุบัน

ผลที่ตามมา:

- fork หรือสำเนาเก่าของ bundled plugin ที่วางไว้ใน workspace จะไม่สามารถบัง bundled build ได้
- หากต้องการ override bundled plugin ด้วย Plugin ในเครื่องจริง ๆ ให้ปักหมุดมันผ่าน `plugins.entries.<id>` เพื่อให้มันชนะด้วยลำดับความสำคัญ แทนที่จะพึ่งการค้นพบจาก workspace
- การทิ้งรายการซ้ำจะถูกบันทึกใน log เพื่อให้ Doctor และ startup diagnostics สามารถชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนดของ JSON Schema

- **ทุก Plugin ต้องมี JSON Schema** แม้ว่าจะไม่รับคอนฟิกเลยก็ตาม
- อนุญาตให้ใช้ schema แบบว่างได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema จะถูกตรวจสอบตอนอ่าน/เขียนคอนฟิก ไม่ใช่ตอนรันไทม์

## พฤติกรรมของการ validation

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ channel id นั้นจะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id ของ Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักเป็น **ข้อผิดพลาด**
- หากติดตั้ง Plugin แล้ว แต่มี manifest หรือ schema ที่เสียหายหรือหายไป
  validation จะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมีคอนฟิกของ Plugin อยู่ แต่ Plugin นั้น **ถูกปิดใช้งาน**
  คอนฟิกจะยังถูกเก็บไว้ และจะแสดง **คำเตือน** ใน Doctor + log

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema ของ `plugins.*` แบบเต็ม

## หมายเหตุ

- manifest **จำเป็นสำหรับ native OpenClaw plugin** รวมถึงการโหลดจากไฟล์ระบบในเครื่อง รันไทม์ยังคงโหลดโมดูลของ Plugin แยกต่างหาก; manifest มีไว้สำหรับ discovery + validation เท่านั้น
- native manifest จะถูก parse ด้วย JSON5 ดังนั้นคอมเมนต์, trailing comma และคีย์ที่ไม่ใส่เครื่องหมายคำพูดจึงรองรับ ตราบใดที่ค่าท้ายสุดยังเป็นออบเจ็กต์
- loader ของ manifest จะอ่านเฉพาะฟิลด์ที่มีเอกสารกำกับไว้เท่านั้น ควรหลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ได้ทั้งหมดเมื่อ Plugin ไม่จำเป็นต้องใช้
- `providerDiscoveryEntry` ต้องยังคงเป็นแบบ lightweight และไม่ควร import โค้ดรันไทม์กว้าง ๆ; ใช้มันสำหรับ metadata ของ static provider catalog หรือ descriptor การค้นพบแบบแคบ ไม่ใช่การทำงานตอน request-time
- ชนิดของ Plugin แบบ exclusive จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าปริยาย `legacy`)
- metadata ของ env var (`providerAuthEnvVars`, `channelEnvVars`) เป็นแบบประกาศเท่านั้น พื้นผิวแบบอ่านอย่างเดียว เช่น status, audit, การตรวจ cron delivery และพื้นผิวอื่น ๆ ยังคงใช้ความเชื่อถือของ Plugin และนโยบาย activation ที่มีผลจริง ก่อนจะถือว่า env var ถูกกำหนดค่าแล้ว
- สำหรับ metadata ของ wizard ในรันไทม์ที่ต้องใช้โค้ด provider โปรดดู [Provider runtime hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณพึ่ง native module ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนดเกี่ยวกับ allowlist ของ package manager (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดล capability
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    ข้อมูลอ้างอิง Plugin SDK และ subpath import
  </Card>
</CardGroup>
