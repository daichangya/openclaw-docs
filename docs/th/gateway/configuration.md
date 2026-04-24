---
read_when:
    - การตั้งค่า OpenClaw เป็นครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าที่ใช้บ่อย
    - การไปยังส่วน config ที่ต้องการ კონკრეტულად
summary: 'ภาพรวมการกำหนดค่า: งานที่พบบ่อย การตั้งค่าอย่างรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-24T09:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw จะอ่าน config แบบ <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> จาก `~/.openclaw/openclaw.json` โดยเป็นตัวเลือก
path ของ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json`
แบบ symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนแบบ atomic อาจแทนที่
path นั้นแทนการคง symlink ไว้ หากคุณเก็บ config ไว้นอก
ไดเรกทอรีสถานะเริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่ม config:

- เชื่อมต่อช่องทางต่าง ๆ และควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล tools sandboxing หรือ automation (cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มีให้ใช้

<Tip>
**เพิ่งเริ่มกับการกำหนดค่าหรือ?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) สำหรับ config แบบคัดลอกและวางได้ครบถ้วน
</Tip>

## การกำหนดค่าขั้นต่ำ

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## การแก้ไข config

<Tabs>
  <Tab title="วิซาร์ดแบบโต้ตอบ">
    ```bash
    openclaw onboard       # โฟลว์การเริ่มต้นใช้งานแบบเต็ม
    openclaw configure     # วิซาร์ด config
    ```
  </Tab>
  <Tab title="CLI (คำสั่งบรรทัดเดียว)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    เปิด [http://127.0.0.1:18789](http://127.0.0.1:18789) แล้วใช้แท็บ **Config**
    Control UI จะแสดงฟอร์มจาก live config schema รวมถึงข้อมูลเอกสารของฟิลด์
    `title` / `description` พร้อม schema ของ Plugin และช่องทางเมื่อ
    มีให้ใช้ โดยมีตัวแก้ไข **Raw JSON** เป็นทางหนีทีไล่ สำหรับ UI ที่ต้องเจาะลึก
    และเครื่องมืออื่น ๆ gateway ยังเปิด `config.schema.lookup` เพื่อ
    ดึง schema node ที่มีขอบเขตหนึ่ง path พร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และปรับใช้การเปลี่ยนแปลงโดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างสมบูรณ์เท่านั้น คีย์ที่ไม่รู้จัก ชนิดข้อมูลที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้อง จะทำให้ Gateway **ปฏิเสธการเริ่มต้น** ข้อยกเว้นเพียงอย่างเดียวที่ระดับรากคือ `$schema` (สตริง) เพื่อให้ editors แนบข้อมูลเมตา JSON Schema ได้
</Warning>

`openclaw config schema` จะพิมพ์ JSON Schema มาตรฐานที่ Control UI
และการตรวจสอบใช้ ส่วน `config.schema.lookup` จะดึงโหนดเดียวตามขอบเขต path พร้อม
สรุปลูกสำหรับเครื่องมือแบบเจาะลึก ข้อมูลเอกสาร `title`/`description` ของฟิลด์
จะถูกส่งต่อไปยัง nested objects, wildcard (`*`), array-item (`[]`) และกิ่ง `anyOf`/
`oneOf`/`allOf` ส่วน runtime schema ของ Plugin และช่องทางจะถูกรวมเข้ามาเมื่อ
โหลด manifest registry แล้ว

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่เริ่มทำงาน
- จะใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อปรับใช้การซ่อมแซม

Gateway จะเก็บสำเนา last-known-good ที่เชื่อถือได้ไว้หลังจากเริ่มต้นสำเร็จแต่ละครั้ง
หากภายหลัง `openclaw.json` ไม่ผ่านการตรวจสอบ (หรือทำให้ `gateway.mode` หายไป ขนาด
เล็กลงอย่างมาก หรือมีบรรทัด log แปลกปลอมถูกเติมไว้ด้านหน้า) OpenClaw จะเก็บไฟล์ที่เสียไว้
เป็น `.clobbered.*`, กู้คืนสำเนา last-known-good และบันทึกเหตุผลของการกู้คืน
ในเทิร์นถัดไปของเอเจนต์จะได้รับคำเตือน system-event ด้วย เพื่อไม่ให้เอเจนต์หลักเขียนทับ config ที่กู้คืนมาอย่างไม่รู้ตัว การเลื่อนขึ้นเป็น last-known-good
จะถูกข้ามเมื่อ candidate มีตัวแทนค่า secret ที่ถูกปกปิด เช่น `***`

## งานที่พบบ่อย

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วน config ของตัวเองภายใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

    - [WhatsApp](/th/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/th/channels/telegram) — `channels.telegram`
    - [Discord](/th/channels/discord) — `channels.discord`
    - [Feishu](/th/channels/feishu) — `channels.feishu`
    - [Google Chat](/th/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/th/channels/msteams) — `channels.msteams`
    - [Slack](/th/channels/slack) — `channels.slack`
    - [Signal](/th/channels/signal) — `channels.signal`
    - [iMessage](/th/channels/imessage) — `channels.imessage`
    - [Mattermost](/th/channels/mattermost) — `channels.mattermost`

    ทุกช่องทางใช้รูปแบบนโยบาย DM แบบเดียวกัน:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // เฉพาะสำหรับ allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="เลือกและกำหนดค่าโมเดล">
    ตั้งค่าโมเดลหลักและ fallbacks แบบไม่บังคับ:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` ใช้กำหนด model catalog และทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่ม entries ลงใน allowlist โดยไม่ลบโมเดลที่มีอยู่ การเขียนทับแบบปกติที่ทำให้ entries หายไปจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - model refs ใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการย่อภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision-token เมื่อมีการรันที่ใช้ภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [การสลับสำรองของโมเดล](/th/concepts/model-failover) สำหรับการสลับการยืนยันตัวตนและพฤติกรรม fallback
    - สำหรับ providers แบบกำหนดเอง/โฮสต์เอง ดู [providers แบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ควบคุมเป็นรายช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียวเพื่ออนุมัติ
    - `"allowlist"`: เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlists เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#dm-and-group-access) สำหรับรายละเอียดรายช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่าการบังคับ mention ในแชตกลุ่ม">
    ข้อความกลุ่มจะมีค่าเริ่มต้นเป็น **ต้องมี mention** กำหนดค่ารูปแบบเป็นรายเอเจนต์:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadata mentions**: @-mentions แบบเนทีฟ (แตะเพื่อ mention ใน WhatsApp, Telegram @bot เป็นต้น)
    - **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `mentionPatterns`
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-channels#group-chat-mention-gating) สำหรับการกำหนดแทนรายช่องทางและโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills รายเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับค่าพื้นฐานที่ใช้ร่วมกัน จากนั้นกำหนดแทนเอเจนต์เฉพาะ
    ด้วย `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // สืบทอด github, weather
          { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
          { id: "locked-down", skills: [] }, // ไม่มี Skills
        ],
      },
    }
    ```

    - ไม่ต้องกำหนด `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - ไม่ต้องกำหนด `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
    - ดู [Skills](/th/tools/skills), [config ของ Skills](/th/tools/skills-config) และ
      [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสุขภาพช่องทางของ gateway">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูเหมือนค้างรุนแรงแค่ไหน:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตจาก health monitor ทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับช่องทางหรือบัญชีเดียว โดยไม่ต้องปิดมอนิเตอร์ส่วนกลาง
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกกันของบทสนทนา:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // แนะนำสำหรับหลายผู้ใช้
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (ใช้ร่วมกัน) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: ค่าเริ่มต้นส่วนกลางสำหรับการกำหนดเส้นทางเซสชันแบบผูกกับเธรด (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age`)
    - ดู [การจัดการเซสชัน](/th/concepts/session) สำหรับขอบเขต ลิงก์ตัวตน และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชันของเอเจนต์ใน runtime แบบ sandbox ที่แยกออกจากกัน:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    สร้าง image ก่อน: `scripts/sandbox-setup.sh`

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ผ่าน relay สำหรับบิลด์ iOS ทางการ">
    การ push ผ่าน relay จะกำหนดค่าใน `openclaw.json`

    ตั้งค่านี้ใน config ของ gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // ไม่บังคับ ค่าเริ่มต้น: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    คำสั่ง CLI ที่เทียบเท่า:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    สิ่งที่ค่านี้ทำ:

    - ช่วยให้ gateway ส่ง `push.test`, wake nudges และ reconnect wakes ผ่าน relay ภายนอกได้
    - ใช้ send grant แบบมีขอบเขตตาม registration ที่แอป iOS ที่จับคู่แล้วส่งต่อมา gateway ไม่จำเป็นต้องมี relay token ระดับทั้งระบบติดตั้ง
    - ผูกแต่ละ relay-backed registration เข้ากับตัวตนของ gateway ที่แอป iOS จับคู่ไว้ ดังนั้น gateway อื่นจึงไม่สามารถนำ registration ที่จัดเก็บไว้กลับมาใช้ได้
    - คงให้บิลด์ iOS ในเครื่อง/แบบกำหนดเองใช้ APNs โดยตรง ส่วนการส่งผ่าน relay จะใช้เฉพาะกับบิลด์ทางการที่เผยแพร่แล้วซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ relay base URL ที่ฝังอยู่ในบิลด์ iOS ทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึงระบบ relay เดียวกัน

    โฟลว์แบบครบวงจร:

    1. ติดตั้งบิลด์ iOS ทางการ/TestFlight ที่คอมไพล์ด้วย relay base URL เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน gateway
    3. จับคู่แอป iOS กับ gateway และให้ทั้งเซสชัน node และผู้ปฏิบัติงานเชื่อมต่อ
    4. แอป iOS จะดึงตัวตนของ gateway ลงทะเบียนกับ relay โดยใช้ App Attest ร่วมกับ app receipt แล้วเผยแพร่ payload `push.apns.register` แบบ relay-backed ไปยัง gateway ที่จับคู่ไว้
    5. gateway จะเก็บ relay handle และ send grant แล้วใช้สิ่งเหล่านั้นสำหรับ `push.test`, wake nudges และ reconnect wakes

    หมายเหตุในการปฏิบัติงาน:

    - หากคุณสลับให้แอป iOS ไปใช้ gateway ตัวอื่น ให้เชื่อมต่อแอปใหม่เพื่อให้สามารถเผยแพร่ relay registration ใหม่ที่ผูกกับ gateway นั้นได้
    - หากคุณออกบิลด์ iOS ใหม่ที่ชี้ไปยังระบบ relay อื่น แอปจะรีเฟรช relay registration ที่แคชไว้แทนการนำต้นทาง relay เดิมกลับมาใช้

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้ได้เป็นตัว override ผ่าน env ชั่วคราว
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นทางหนีเฉพาะงานพัฒนาแบบ loopback-only; อย่าบันทึก relay URL แบบ HTTP ลงใน config

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์ครบวงจร และ [โฟลว์การยืนยันตัวตนและความเชื่อถือ](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

  </Accordion>

  <Accordion title="ตั้งค่า Heartbeat (การเช็กอินเป็นระยะ)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: สตริงระยะเวลา (`30m`, `2h`) ตั้งค่า `0m` เพื่อปิดใช้งาน
    - `target`: `last` | `none` | `<channel-id>` (เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`)
    - `directPolicy`: `allow` (ค่าเริ่มต้น) หรือ `block` สำหรับเป้าหมาย Heartbeat แบบ DM
    - ดู [Heartbeat](/th/gateway/heartbeat) สำหรับคู่มือฉบับเต็ม

  </Accordion>

  <Accordion title="กำหนดค่างาน Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: ลบเซสชันการรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน)
    - `runLog`: ลบ `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมความสามารถและตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้ปลายทาง Webhook แบบ HTTP บน Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    หมายเหตุด้านความปลอดภัย:
    - ให้ถือว่าเนื้อหา payload ทั้งหมดของ hook/webhook เป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะทาง; อย่านำ Gateway token ที่ใช้ร่วมกันมาใช้ซ้ำ
    - การยืนยันตัวตนของ hook เป็นแบบ header-only (`Authorization: Bearer ...` หรือ `x-openclaw-token`); ระบบจะปฏิเสธโทเค็นใน query string
    - `hooks.path` ต้องไม่เป็น `/`; ควรแยกทางรับ Webhook ไว้บน subpath เฉพาะ เช่น `/hooks`
    - ให้ปิดแฟล็กข้ามการป้องกันเนื้อหาไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักแบบจำกัดขอบเขตอย่างเข้มงวด
    - หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัด session keys ที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้ชั้นโมเดลสมัยใหม่ที่แข็งแรงและนโยบาย tools แบบเข้มงวด (เช่น อนุญาตเฉพาะการส่งข้อความร่วมกับ sandboxing เมื่อเป็นไปได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการทำงานร่วมกับ Gmail

  </Accordion>

  <Accordion title="กำหนดค่าเส้นทางหลายเอเจนต์">
    รันหลายเอเจนต์แบบแยกกัน พร้อม workspaces และเซสชันแยกคนละชุด:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    ดู [หลายเอเจนต์](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/config-agents#multi-agent-routing) สำหรับกฎการ bind และโปรไฟล์การเข้าถึงรายเอเจนต์

  </Accordion>

  <Accordion title="แยก config เป็นหลายไฟล์ ($include)">
    ใช้ `$include` เพื่อจัดระเบียบ config ขนาดใหญ่:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **ไฟล์เดียว**: แทนที่ object ที่ครอบอยู่ทั้งหมด
    - **อาร์เรย์ของไฟล์**: deep-merge ตามลำดับ (ตัวหลังชนะ)
    - **คีย์ข้างเคียง**: merge หลัง includes (เขียนทับค่าจากไฟล์ที่ include)
    - **includes แบบซ้อน**: รองรับลึกได้ถึง 10 ระดับ
    - **paths แบบสัมพัทธ์**: resolve เทียบกับไฟล์ที่ทำ include
    - **การเขียนที่ OpenClaw เป็นเจ้าของ**: เมื่อการเขียนเปลี่ยนเพียง top-level section เดียว
      ที่รองรับด้วย include แบบไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ถูกรวมเข้ามานั้นและคง `openclaw.json` เดิมไว้
    - **write-through ที่ไม่รองรับ**: root includes, include arrays และ includes
      ที่มี sibling overrides จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นเจ้าของ แทนที่จะ
      flatten config
    - **การจัดการข้อผิดพลาด**: มีข้อผิดพลาดที่ชัดเจนสำหรับไฟล์หาย parse error และ circular includes

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway จะเฝ้าดู `~/.openclaw/openclaw.json` และปรับใช้การเปลี่ยนแปลงโดยอัตโนมัติ — ไม่ต้องรีสตาร์ตเองสำหรับการตั้งค่าส่วนใหญ่

การแก้ไขไฟล์โดยตรงจะถูกมองว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ watcher จะรอ
ให้การสั่นไหวจากการเขียนไฟล์ชั่วคราว/การเปลี่ยนชื่อของ editor จบก่อน จากนั้นอ่าน
ไฟล์สุดท้าย และปฏิเสธการแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืน last-known-good config การเขียน config
ที่ OpenClaw เป็นเจ้าของจะใช้ schema gate เดียวกันก่อนเขียน; การเขียนทับแบบทำลายข้อมูล
เช่นทำให้ `gateway.mode` หายไปหรือทำให้ไฟล์หดเกินครึ่ง จะถูกปฏิเสธ
และบันทึกเป็น `.rejected.*` เพื่อให้ตรวจสอบได้

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ใน logs ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันข้าง `openclaw.json` แก้ไข payload ที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับรายการตรวจสอบการกู้คืน

### โหมดการรีโหลด

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ปรับใช้การเปลี่ยนแปลงที่ปลอดภัยทันที และรีสตาร์ตอัตโนมัติสำหรับการเปลี่ยนแปลงที่สำคัญ      |
| **`hot`**              | ปรับใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัย และบันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway ทุกครั้งที่ config เปลี่ยน ไม่ว่าจะปลอดภัยหรือไม่                       |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ตด้วยตนเองครั้งถัดไป                      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### อะไร hot-apply ได้ และอะไรต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่สามารถ hot-apply ได้โดยไม่มี downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการให้อัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                             | ต้องรีสตาร์ต? |
| ------------------- | ----------------------------------------------------------------- | ------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ทุกช่องทางแบบ built-in และ Plugin | ไม่            |
| เอเจนต์และโมเดล    | `agent`, `agents`, `models`, `routing`                            | ไม่            |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | ไม่            |
| เซสชันและข้อความ   | `session`, `messages`                                             | ไม่            |
| Tools และสื่อ      | `tools`, `browser`, `skills`, `audio`, `talk`                     | ไม่            |
| UI และอื่น ๆ       | `ui`, `logging`, `identity`, `bindings`                           | ไม่            |
| เซิร์ฟเวอร์ Gateway | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**        |
| โครงสร้างพื้นฐาน   | `discovery`, `canvasHost`, `plugins`                              | **ใช่**        |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนค่าจะ **ไม่** กระตุ้นการรีสตาร์ต
</Note>

### การวางแผนการรีโหลด

เมื่อคุณแก้ไข source file ที่ถูกอ้างอิงผ่าน `$include`, OpenClaw จะวางแผน
การรีโหลดจากเลย์เอาต์ที่ผู้เขียน source กำหนดไว้ ไม่ใช่จากมุมมองในหน่วยความจำที่ถูก flatten แล้ว
วิธีนี้ทำให้การตัดสินใจเรื่อง hot-reload (hot-apply เทียบกับ restart) คาดการณ์ได้แม้
top-level section เดียวจะอยู่ในไฟล์ include ของตัวเอง เช่น
`plugins: { $include: "./plugins.json5" }` การวางแผนการรีโหลดจะ fail closed หาก
เลย์เอาต์ต้นทางกำกวม

## Config RPC (การอัปเดตแบบโปรแกรม)

สำหรับเครื่องมือที่เขียน config ผ่าน gateway API ให้ใช้โฟลว์นี้เป็นหลัก:

- `config.schema.lookup` เพื่อสำรวจหนึ่ง subtree (schema node แบบตื้น + สรุปลูก)
- `config.get` เพื่อดึง snapshot ปัจจุบันพร้อม `hash`
- `config.patch` สำหรับการอัปเดตบางส่วน (JSON merge patch: objects จะ merge, `null`
  ใช้ลบ, arrays จะถูกแทนที่)
- `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ทั้ง config
- `update.run` สำหรับ self-update แบบชัดเจนพร้อมรีสตาร์ต

<Note>
การเขียนฝั่ง control-plane (`config.apply`, `config.patch`, `update.run`) ถูก
จำกัดอัตราไว้ที่ 3 คำขอต่อ 60 วินาทีต่อ `deviceId+clientIp` คำขอรีสตาร์ตจะถูกรวมกัน
และจากนั้นบังคับใช้ช่วงคูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ต
</Note>

ตัวอย่าง partial patch:

```bash
openclaw gateway call config.get --params '{}'  # เก็บ payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

ทั้ง `config.apply` และ `config.patch` รองรับ `raw`, `baseHash`, `sessionKey`,
`note` และ `restartDelayMs` โดย `baseHash` จำเป็นสำหรับทั้งสองเมธอดเมื่อ
มี config อยู่แล้ว

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่านตัวแปร env จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (หากมี)
- `~/.openclaw/.env` (fallback ส่วนกลาง)

ทั้งสองไฟล์จะไม่เขียนทับตัวแปร env ที่มีอยู่แล้ว คุณยังสามารถตั้ง inline env vars ใน config ได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="นำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้งานและยังไม่ได้ตั้งค่าคีย์ที่คาดหวัง OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ตัวแปร env ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนที่ env var ในค่า config">
  อ้างอิงตัวแปร env ในค่าสตริงของ config ใด ๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดขณะโหลด
- escape ด้วย `$${VAR}` หากต้องการผลลัพธ์ตามตัวอักษร
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนที่แบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  สำหรับฟิลด์ที่รองรับอ็อบเจ็กต์ SecretRef คุณสามารถใช้:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [การจัดการ Secrets](/th/gateway/secrets)
รายการเส้นทางข้อมูลรับรองที่รองรับแสดงไว้ใน [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## เอกสารอ้างอิงฉบับเต็ม

สำหรับเอกสารอ้างอิงแบบครบถ้วนรายฟิลด์ โปรดดู **[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
