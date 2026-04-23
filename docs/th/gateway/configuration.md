---
read_when:
    - การตั้งค่า OpenClaw ครั้งแรก
    - กำลังมองหารูปแบบการกำหนดค่าที่พบบ่อย
    - การไปยังส่วนการกำหนดค่าเฉพาะ】【”】【assistant to=final
summary: 'ภาพรวมการกำหนดค่า: งานที่พบบ่อย การตั้งค่าแบบรวดเร็ว และลิงก์ไปยังเอกสารอ้างอิงฉบับเต็ม'
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-23T05:33:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39a9f521b124026a32064464b6d0ce1f93597c523df6839fde37d61e597bcce7
    source_path: gateway/configuration.md
    workflow: 15
---

# การกำหนดค่า

OpenClaw อ่าน config แบบ <Tooltip tip="JSON5 รองรับคอมเมนต์และเครื่องหมายจุลภาคต่อท้าย">**JSON5**</Tooltip> ที่เป็นทางเลือกจาก `~/.openclaw/openclaw.json`
พาธ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ รูปแบบ
`openclaw.json` ที่เป็น symlink ไม่รองรับสำหรับการเขียนที่ OpenClaw เป็นผู้จัดการ; การเขียนแบบอะตอมมิกอาจแทนที่
พาธนั้นแทนการคง symlink ไว้ หากคุณเก็บ config ไว้นอก
ไดเรกทอรีสถานะเริ่มต้น ให้ชี้ `OPENCLAW_CONFIG_PATH` ไปที่ไฟล์จริงโดยตรง

หากไม่มีไฟล์ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย เหตุผลทั่วไปในการเพิ่ม config ได้แก่:

- เชื่อมต่อช่องทางและควบคุมว่าใครสามารถส่งข้อความถึงบอตได้
- ตั้งค่าโมเดล tools sandboxing หรือระบบอัตโนมัติ (Cron, hooks)
- ปรับแต่งเซสชัน สื่อ เครือข่าย หรือ UI

ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference) สำหรับทุกฟิลด์ที่มีให้ใช้

<Tip>
**เพิ่งเริ่มใช้การกำหนดค่าใช่ไหม?** เริ่มด้วย `openclaw onboard` สำหรับการตั้งค่าแบบโต้ตอบ หรือดูคู่มือ [Configuration Examples](/th/gateway/configuration-examples) สำหรับ config แบบคัดลอกไปใช้ได้ทันทีฉบับสมบูรณ์
</Tip>

## config ขั้นต่ำ

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
    openclaw onboard       # โฟลว์ onboarding แบบเต็ม
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
    Control UI จะเรนเดอร์ฟอร์มจาก schema ของ config ที่ใช้งานจริง รวมถึง metadata เอกสารของฟิลด์ `title` / `description` รวมถึง schema ของ Plugin และช่องทางเมื่อ
    มีให้ใช้ พร้อมตัวแก้ไข **Raw JSON** เป็นทางหนีทีไล่ สำหรับ UI แบบเจาะลึก
    และ tooling อื่น ๆ gateway ยังเปิดเผย `config.schema.lookup` เพื่อ
    ดึง schema node ของพาธเดียวพร้อมสรุปลูกโดยตรง
  </Tab>
  <Tab title="แก้ไขโดยตรง">
    แก้ไข `~/.openclaw/openclaw.json` โดยตรง Gateway จะเฝ้าดูไฟล์และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ (ดู [hot reload](#config-hot-reload))
  </Tab>
</Tabs>

## การตรวจสอบความถูกต้องแบบเข้มงวด

<Warning>
OpenClaw ยอมรับเฉพาะการกำหนดค่าที่ตรงกับ schema อย่างครบถ้วนเท่านั้น คีย์ที่ไม่รู้จัก ชนิดที่ผิดรูปแบบ หรือค่าที่ไม่ถูกต้อง จะทำให้ Gateway **ปฏิเสธการเริ่มทำงาน** ข้อยกเว้นเดียวที่ระดับรากคือ `$schema` (string) เพื่อให้ตัวแก้ไขแนบ metadata ของ JSON Schema ได้
</Warning>

หมายเหตุเกี่ยวกับ tooling ของ schema:

- `openclaw config schema` จะแสดง JSON Schema family ชุดเดียวกับที่ Control UI
  และการตรวจสอบ config ใช้
- ให้ถือว่าเอาต์พุต schema นั้นเป็นสัญญาแบบ machine-readable หลักสำหรับ
  `openclaw.json`; ภาพรวมนี้และเอกสารอ้างอิงการกำหนดค่าเป็นเพียงสรุป
- ค่า `title` และ `description` ของฟิลด์จะถูกส่งต่อไปยังเอาต์พุต schema สำหรับ
  tooling ของตัวแก้ไขและฟอร์ม
- รายการของ nested object, wildcard (`*`) และ array-item (`[]`) จะสืบทอด
  metadata เอกสารเดียวกัน เมื่อมีเอกสารของฟิลด์ที่ตรงกัน
- branch ขององค์ประกอบ `anyOf` / `oneOf` / `allOf` ก็สืบทอด metadata เอกสาร
  เดียวกันเช่นกัน ดังนั้นรูปแบบ union/intersection จะยังคงมีคำอธิบายฟิลด์เหมือนเดิม
- `config.schema.lookup` จะคืนค่าพาธ config ที่ถูก normalized หนึ่งพาธพร้อม
  schema node แบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป
  และฟิลด์ตรวจสอบลักษณะคล้ายกัน), metadata คำใบ้ UI ที่จับคู่ได้ และสรุปลูกโดยตรง
  สำหรับ tooling แบบเจาะลึก
- schema ของ Plugin/ช่องทางในรันไทม์จะถูกรวมเข้ามาเมื่อ gateway สามารถโหลด
  manifest registry ปัจจุบันได้
- `pnpm config:docs:check` จะตรวจจับความคลาดเคลื่อนระหว่างอาร์ติแฟกต์ baseline ของ config ฝั่งเอกสาร
  กับพื้นผิว schema ปัจจุบัน

เมื่อการตรวจสอบล้มเหลว:

- Gateway จะไม่บูต
- ใช้ได้เฉพาะคำสั่งวินิจฉัย (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- รัน `openclaw doctor` เพื่อดูปัญหาที่แน่ชัด
- รัน `openclaw doctor --fix` (หรือ `--yes`) เพื่อใช้การซ่อมแซม

Gateway ยังเก็บสำเนาที่เชื่อถือได้ล่าสุดไว้หลังจากเริ่มทำงานสำเร็จอีกด้วย หาก
ภายหลัง `openclaw.json` ถูกเปลี่ยนจากนอก OpenClaw และไม่ผ่านการตรวจสอบอีกต่อไป การเริ่มทำงาน
และ hot reload จะเก็บไฟล์ที่เสียไว้เป็น snapshot `.clobbered.*` ที่มี timestamp,
กู้คืนสำเนาที่เชื่อถือได้ล่าสุด และบันทึกคำเตือนที่ชัดเจนพร้อมเหตุผลในการกู้คืน
การกู้คืนขณะอ่านตอนเริ่มทำงานยังถือว่าขนาดที่ลดลงมากอย่างผิดปกติ metadata ของ config ที่หายไป และ
`gateway.mode` ที่หายไปเป็นลายเซ็น clobber ระดับวิกฤต เมื่อสำเนาที่เชื่อถือได้ล่าสุด
เคยมีฟิลด์เหล่านั้น
หากมีบรรทัดสถานะ/ล็อกถูกเติมนำหน้าก่อน config JSON ที่ถูกต้องอยู่แล้วโดยไม่ได้ตั้งใจ
การเริ่มทำงานของ gateway และ `openclaw doctor --fix` สามารถลบ prefix นั้นออก,
เก็บไฟล์ที่ปนเปื้อนไว้เป็น `.clobbered.*` และทำงานต่อด้วย
JSON ที่กู้คืนแล้ว
เทิร์นถัดไปของเอเจนต์หลักจะได้รับคำเตือนแบบ system-event ด้วยว่า
config ถูกกู้คืนแล้วและต้องไม่ถูกเขียนทับแบบไม่ตรวจสอบ การเลื่อนสถานะเป็น last-known-good
จะอัปเดตหลังการเริ่มทำงานที่ผ่านการตรวจสอบ และหลัง hot reload ที่ได้รับการยอมรับ รวมถึง
การเขียน config ที่ OpenClaw เป็นผู้จัดการซึ่งแฮชของไฟล์ที่ถูกบันทึกยังตรงกับการเขียนที่ยอมรับ
การเลื่อนสถานะจะถูกข้ามเมื่อค่าที่เสนอมี placeholder ของความลับที่ถูกปกปิดไว้
เช่น `***` หรือค่า token แบบย่อ

## งานที่พบบ่อย

<AccordionGroup>
  <Accordion title="ตั้งค่าช่องทาง (WhatsApp, Telegram, Discord ฯลฯ)">
    แต่ละช่องทางมีส่วน config ของตัวเองใต้ `channels.<provider>` ดูหน้าช่องทางเฉพาะสำหรับขั้นตอนการตั้งค่า:

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

    ทุกช่องทางใช้รูปแบบนโยบาย DM เดียวกัน:

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
    ตั้งค่าโมเดลหลักและ fallback แบบไม่บังคับ:

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

    - `agents.defaults.models` กำหนดแค็ตตาล็อกโมเดลและทำหน้าที่เป็น allowlist สำหรับ `/model`
    - ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ allowlist โดยไม่ลบโมเดลที่มีอยู่ รายการแทนที่แบบตรง ๆ ที่จะลบรายการเดิมจะถูกปฏิเสธ เว้นแต่คุณจะส่ง `--replace`
    - model ref ใช้รูปแบบ `provider/model` (เช่น `anthropic/claude-opus-4-6`)
    - `agents.defaults.imageMaxDimensionPx` ควบคุมการลดขนาดภาพใน transcript/tool (ค่าเริ่มต้น `1200`); ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision token ในการรันที่มีภาพหน้าจอจำนวนมาก
    - ดู [Models CLI](/th/concepts/models) สำหรับการสลับโมเดลในแชต และ [Model Failover](/th/concepts/model-failover) สำหรับการหมุน auth และพฤติกรรม fallback
    - สำหรับผู้ให้บริการแบบกำหนดเอง/โฮสต์เอง ดู [Custom providers](/th/gateway/configuration-reference#custom-providers-and-base-urls) ในเอกสารอ้างอิง

  </Accordion>

  <Accordion title="ควบคุมว่าใครสามารถส่งข้อความถึงบอตได้">
    การเข้าถึง DM ถูกควบคุมต่อช่องทางผ่าน `dmPolicy`:

    - `"pairing"` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่แบบครั้งเดียวเพื่อขออนุมัติ
    - `"allowlist"`: อนุญาตเฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)
    - `"open"`: อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)
    - `"disabled"`: เพิกเฉยต่อ DM ทั้งหมด

    สำหรับกลุ่ม ให้ใช้ `groupPolicy` + `groupAllowFrom` หรือ allowlist เฉพาะช่องทาง

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#dm-and-group-access) สำหรับรายละเอียดต่อช่องทาง

  </Accordion>

  <Accordion title="ตั้งค่าการกำหนดให้ต้องมีการ mention ในแชตกลุ่ม">
    ข้อความในกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการ mention** กำหนดรูปแบบต่อเอเจนต์ได้ดังนี้:

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

    - **Metadata mentions**: @-mention แบบเนทีฟ (WhatsApp แตะเพื่อ mention, Telegram @bot ฯลฯ)
    - **รูปแบบข้อความ**: safe regex pattern ใน `mentionPatterns`
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#group-chat-mention-gating) สำหรับการ override ต่อช่องทางและโหมด self-chat

  </Accordion>

  <Accordion title="จำกัด Skills ต่อเอเจนต์">
    ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน จากนั้น override เอเจนต์เฉพาะ
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

    - เว้น `agents.defaults.skills` ไว้เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
    - เว้น `agents.list[].skills` ไว้เพื่อสืบทอดค่าเริ่มต้น
    - ตั้ง `agents.list[].skills: []` เพื่อไม่ให้มี Skills
    - ดู [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config) และ
      [Configuration Reference](/th/gateway/configuration-reference#agents-defaults-skills)

  </Accordion>

  <Accordion title="ปรับแต่งการตรวจสอบสุขภาพช่องทางของ gateway">
    ควบคุมว่า gateway จะรีสตาร์ตช่องทางที่ดูนิ่งผิดปกติอย่างเข้มข้นแค่ไหน:

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

    - ตั้ง `gateway.channelHealthCheckMinutes: 0` เพื่อปิดการรีสตาร์ตโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ
    - `channelStaleEventThresholdMinutes` ควรมากกว่าหรือเท่ากับช่วงเวลาการตรวจสอบ
    - ใช้ `channels.<provider>.healthMonitor.enabled` หรือ `channels.<provider>.accounts.<id>.healthMonitor.enabled` เพื่อปิดการรีสตาร์ตอัตโนมัติสำหรับหนึ่งช่องทางหรือหนึ่งบัญชี โดยไม่ต้องปิดตัวตรวจสอบระดับ global
    - ดู [Health Checks](/th/gateway/health) สำหรับการดีบักเชิงปฏิบัติการ และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#gateway) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="กำหนดค่าเซสชันและการรีเซ็ต">
    เซสชันควบคุมความต่อเนื่องและการแยกการสนทนา:

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
    - `threadBindings`: ค่าเริ่มต้นแบบ global สำหรับการกำหนดเส้นทางเซสชันที่ผูกกับ thread (Discord รองรับ `/focus`, `/unfocus`, `/agents`, `/session idle` และ `/session max-age`)
    - ดู [Session Management](/th/concepts/session) สำหรับขอบเขต ลิงก์อัตลักษณ์ และนโยบายการส่ง
    - ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#session) สำหรับทุกฟิลด์

  </Accordion>

  <Accordion title="เปิดใช้ sandboxing">
    รันเซสชันของเอเจนต์ในรันไทม์ sandbox แบบแยก:

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

    build image ก่อน: `scripts/sandbox-setup.sh`

    ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#agentsdefaultssandbox) สำหรับตัวเลือกทั้งหมด

  </Accordion>

  <Accordion title="เปิดใช้ push ผ่าน relay สำหรับบิลด์ iOS แบบทางการ">
    การตั้งค่า push ผ่าน relay ถูกกำหนดไว้ใน `openclaw.json`

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

    สิ่งที่การตั้งค่านี้ทำ:

    - ทำให้ gateway สามารถส่ง `push.test`, wake nudges และ reconnect wakes ผ่าน relay ภายนอกได้
    - ใช้ send grant ที่มีขอบเขตตาม registration ซึ่งถูกส่งต่อโดยแอป iOS ที่จับคู่ไว้ gateway ไม่จำเป็นต้องมี relay token ระดับ deployment ทั้งระบบ
    - ผูก registration ที่ใช้ relay แต่ละรายการเข้ากับอัตลักษณ์ของ gateway ที่แอป iOS จับคู่ไว้ ทำให้ gateway อื่นไม่สามารถนำ registration ที่เก็บไว้นั้นไปใช้ซ้ำได้
    - ทำให้บิลด์ iOS แบบ local/manual ยังคงใช้ APNs โดยตรง การส่งผ่าน relay จะใช้เฉพาะกับบิลด์แบบทางการที่เผยแพร่แล้วซึ่งลงทะเบียนผ่าน relay เท่านั้น
    - ต้องตรงกับ relay base URL ที่ถูกฝังไว้ในบิลด์ iOS แบบทางการ/TestFlight เพื่อให้ทราฟฟิกการลงทะเบียนและการส่งไปถึง deployment ของ relay เดียวกัน

    โฟลว์แบบ end-to-end:

    1. ติดตั้งบิลด์ iOS แบบทางการ/TestFlight ที่คอมไพล์ด้วย relay base URL เดียวกัน
    2. กำหนดค่า `gateway.push.apns.relay.baseUrl` บน gateway
    3. จับคู่แอป iOS กับ gateway และให้ทั้งเซสชัน node และ operator เชื่อมต่อได้
    4. แอป iOS จะดึงอัตลักษณ์ของ gateway ลงทะเบียนกับ relay โดยใช้ App Attest ร่วมกับ app receipt แล้วเผยแพร่ payload `push.apns.register` แบบใช้ relay ไปยัง gateway ที่จับคู่ไว้
    5. Gateway จะเก็บ relay handle และ send grant แล้วใช้สิ่งเหล่านั้นสำหรับ `push.test`, wake nudges และ reconnect wakes

    หมายเหตุด้านการปฏิบัติการ:

    - หากคุณสลับแอป iOS ไปยัง gateway อื่น ให้เชื่อมต่อแอปใหม่เพื่อให้มันเผยแพร่ relay registration ใหม่ที่ผูกกับ gateway นั้น
    - หากคุณส่งมอบบิลด์ iOS ใหม่ที่ชี้ไปยัง deployment ของ relay คนละตัว แอปจะรีเฟรช relay registration ที่แคชไว้แทนการใช้ origin ของ relay เก่าซ้ำ

    หมายเหตุด้านความเข้ากันได้:

    - `OPENCLAW_APNS_RELAY_BASE_URL` และ `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ยังใช้เป็น env override ชั่วคราวได้
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` ยังคงเป็นช่องทางหลีกเลี่ยงสำหรับการพัฒนาแบบ loopback-only; อย่าบันทึก URL ของ relay แบบ HTTP ลงใน config

    ดู [แอป iOS](/th/platforms/ios#relay-backed-push-for-official-builds) สำหรับโฟลว์แบบ end-to-end และ [Authentication and trust flow](/th/platforms/ios#authentication-and-trust-flow) สำหรับโมเดลความปลอดภัยของ relay

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

    - `sessionRetention`: ตัดทอนเซสชันการรันแบบแยกที่เสร็จแล้วออกจาก `sessions.json` (ค่าเริ่มต้น `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน)
    - `runLog`: ตัดทอนไฟล์ `cron/runs/<jobId>.jsonl` ตามขนาดและจำนวนบรรทัดที่เก็บไว้
    - ดู [งาน Cron](/th/automation/cron-jobs) สำหรับภาพรวมฟีเจอร์และตัวอย่าง CLI

  </Accordion>

  <Accordion title="ตั้งค่า Webhook (hooks)">
    เปิดใช้ endpoint ของ HTTP Webhook บน Gateway:

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
    - ให้ถือว่าเนื้อหา payload ของ hook/webhook ทั้งหมดเป็นอินพุตที่ไม่น่าเชื่อถือ
    - ใช้ `hooks.token` เฉพาะ; อย่านำ Gateway token ที่ใช้ร่วมกันมาใช้ซ้ำ
    - การยืนยันตัวตนของ hook เป็นแบบ header-only (`Authorization: Bearer ...` หรือ `x-openclaw-token`); token ใน query-string จะถูกปฏิเสธ
    - `hooks.path` ต้องไม่เป็น `/`; ให้คง ingress ของ webhook ไว้บน subpath เฉพาะ เช่น `/hooks`
    - ให้ปิดแฟล็ก bypass เนื้อหาที่ไม่ปลอดภัยไว้ (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) เว้นแต่กำลังดีบักแบบจำกัดขอบเขตอย่างเข้มงวด
    - หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดขอบเขตของ session key ที่ผู้เรียกเลือกได้
    - สำหรับเอเจนต์ที่ขับเคลื่อนด้วย hook ควรใช้ tier ของโมเดลสมัยใหม่ที่แข็งแรงและนโยบาย tool ที่เข้มงวด (เช่น อนุญาตเฉพาะการส่งข้อความร่วมกับ sandboxing หากเป็นไปได้)

    ดู [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#hooks) สำหรับตัวเลือก mapping ทั้งหมดและการผสานรวม Gmail

  </Accordion>

  <Accordion title="กำหนดค่าการกำหนดเส้นทางหลายเอเจนต์">
    รันหลายเอเจนต์แบบแยกจากกันพร้อม workspace และเซสชันแยกกัน:

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

    ดู [Multi-Agent](/th/concepts/multi-agent) และ [เอกสารอ้างอิงฉบับเต็ม](/th/gateway/configuration-reference#multi-agent-routing) สำหรับกฎของ binding และ access profile ต่อเอเจนต์

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
    - **คีย์ที่เป็นพี่น้องกัน**: merge หลัง includes (override ค่าที่ include มา)
    - **include ซ้อนกัน**: รองรับได้ลึกสูงสุด 10 ระดับ
    - **พาธแบบ relative**: resolve เทียบกับไฟล์ที่ include
    - **การเขียนที่ OpenClaw เป็นผู้จัดการ**: เมื่อการเขียนเปลี่ยนเฉพาะหนึ่ง top-level section
      ที่รองรับด้วย include แบบไฟล์เดียว เช่น `plugins: { $include: "./plugins.json5" }`,
      OpenClaw จะอัปเดตไฟล์ที่ include นั้น และคง `openclaw.json` เดิมไว้
    - **write-through ที่ไม่รองรับ**: include ที่ราก, include แบบอาร์เรย์ และ include
      ที่มี sibling override จะ fail closed สำหรับการเขียนที่ OpenClaw เป็นผู้จัดการ แทนที่จะ
      flatten config
    - **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดชัดเจนสำหรับไฟล์ที่หายไป parse error และ circular include

  </Accordion>
</AccordionGroup>

## Hot reload ของ config

Gateway จะเฝ้าดู `~/.openclaw/openclaw.json` และนำการเปลี่ยนแปลงไปใช้โดยอัตโนมัติ — โดยส่วนใหญ่ไม่ต้องรีสตาร์ตเอง

การแก้ไขไฟล์โดยตรงจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ watcher จะรอ
ให้ความปั่นป่วนจากการเขียนไฟล์ชั่วคราว/rename ของตัวแก้ไขสงบลงก่อน จากนั้นอ่าน
ไฟล์สุดท้าย และปฏิเสธการแก้ไขภายนอกที่ไม่ถูกต้องโดยกู้คืน config ล่าสุดที่ผ่านการยอมรับ การเขียน config
ที่ OpenClaw เป็นผู้จัดการก็ใช้ schema gate เดียวกันก่อนเขียน; การ clobber แบบทำลายล้าง
เช่น การลบ `gateway.mode` ทิ้งหรือทำให้ไฟล์หดลงเกินครึ่งจะถูกปฏิเสธ
และบันทึกไว้เป็น `.rejected.*` เพื่อให้ตรวจสอบได้

หากคุณเห็น `Config auto-restored from last-known-good` หรือ
`config reload restored last-known-good config` ในล็อก ให้ตรวจสอบไฟล์
`.clobbered.*` ที่ตรงกันข้าง ๆ `openclaw.json`, แก้ payload ที่ถูกปฏิเสธ แล้วรัน
`openclaw config validate` ดู [Gateway troubleshooting](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)
สำหรับเช็กลิสต์การกู้คืน

### โหมดการรีโหลด

| โหมด                   | พฤติกรรม                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (ค่าเริ่มต้น) | ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot ทันที และรีสตาร์ตอัตโนมัติสำหรับการเปลี่ยนแปลงสำคัญ |
| **`hot`**              | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยแบบ hot เท่านั้น และบันทึกคำเตือนเมื่อจำเป็นต้องรีสตาร์ต — คุณจัดการเอง |
| **`restart`**          | รีสตาร์ต Gateway เมื่อมีการเปลี่ยน config ใด ๆ ไม่ว่าจะปลอดภัยหรือไม่                 |
| **`off`**              | ปิดการเฝ้าดูไฟล์ การเปลี่ยนแปลงจะมีผลในการรีสตาร์ตด้วยตนเองครั้งถัดไป                  |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### สิ่งใดใช้แบบ hot ได้ และสิ่งใดต้องรีสตาร์ต

ฟิลด์ส่วนใหญ่ใช้ได้แบบ hot โดยไม่เกิด downtime ในโหมด `hybrid` การเปลี่ยนแปลงที่ต้องรีสตาร์ตจะถูกจัดการให้อัตโนมัติ

| หมวดหมู่            | ฟิลด์                                                            | ต้องรีสตาร์ต? |
| ------------------- | ----------------------------------------------------------------- | ------------- |
| ช่องทาง            | `channels.*`, `web` (WhatsApp) — ช่องทาง built-in และ Plugin ทั้งหมด | ไม่            |
| เอเจนต์และโมเดล      | `agent`, `agents`, `models`, `routing`                            | ไม่            |
| ระบบอัตโนมัติ        | `hooks`, `cron`, `agent.heartbeat`                                | ไม่            |
| เซสชันและข้อความ    | `session`, `messages`                                             | ไม่            |
| Tools และสื่อ       | `tools`, `browser`, `skills`, `audio`, `talk`                     | ไม่            |
| UI และอื่น ๆ        | `ui`, `logging`, `identity`, `bindings`                           | ไม่            |
| เซิร์ฟเวอร์ Gateway | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **ใช่**       |
| โครงสร้างพื้นฐาน    | `discovery`, `canvasHost`, `plugins`                              | **ใช่**       |

<Note>
`gateway.reload` และ `gateway.remote` เป็นข้อยกเว้น — การเปลี่ยนค่า **จะไม่** ทำให้ต้องรีสตาร์ต
</Note>

## Config RPC (การอัปเดตแบบเป็นโปรแกรม)

<Note>
RPC สำหรับการเขียน control plane (`config.apply`, `config.patch`, `update.run`) มีการจำกัดอัตราไว้ที่ **3 คำขอต่อ 60 วินาที** ต่อ `deviceId+clientIp` เมื่อถูกจำกัด RPC จะคืนค่า `UNAVAILABLE` พร้อม `retryAfterMs`
</Note>

โฟลว์ที่ปลอดภัย/เป็นค่าเริ่มต้น:

- `config.schema.lookup`: ตรวจสอบ subtree ของ config ที่มีขอบเขตตามพาธหนึ่งรายการ พร้อม
  schema node แบบตื้น, hint metadata ที่จับคู่ได้ และสรุปลูกโดยตรง
- `config.get`: ดึง snapshot ปัจจุบัน + hash
- `config.patch`: เส้นทางที่แนะนำสำหรับการอัปเดตบางส่วน
- `config.apply`: ใช้แทนที่ config ทั้งหมดเท่านั้น
- `update.run`: สั่งอัปเดตตัวเอง + รีสตาร์ตอย่างชัดเจน

เมื่อคุณไม่ได้แทนที่ config ทั้งหมด ให้ใช้ `config.schema.lookup`
แล้วตามด้วย `config.patch`

<AccordionGroup>
  <Accordion title="config.apply (แทนที่ทั้งหมด)">
    ตรวจสอบ + เขียน config ทั้งหมด และรีสตาร์ต Gateway ในขั้นตอนเดียว

    <Warning>
    `config.apply` จะแทนที่ **config ทั้งหมด** ใช้ `config.patch` สำหรับการอัปเดตบางส่วน หรือ `openclaw config set` สำหรับคีย์เดี่ยว
    </Warning>

    พารามิเตอร์:

    - `raw` (string) — payload JSON5 สำหรับ config ทั้งหมด
    - `baseHash` (ไม่บังคับ) — config hash จาก `config.get` (จำเป็นเมื่อมี config อยู่แล้ว)
    - `sessionKey` (ไม่บังคับ) — session key สำหรับ wake-up ping หลังรีสตาร์ต
    - `note` (ไม่บังคับ) — หมายเหตุสำหรับ restart sentinel
    - `restartDelayMs` (ไม่บังคับ) — ระยะหน่วงก่อนรีสตาร์ต (ค่าเริ่มต้น 2000)

    คำขอรีสตาร์ตจะถูกรวมเข้าด้วยกันเมื่อมีรายการหนึ่งกำลังรอ/กำลังทำงานอยู่แล้ว และมีช่วงคูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ต

    ```bash
    openclaw gateway call config.get --params '{}'  # เก็บ payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (อัปเดตบางส่วน)">
    merge การอัปเดตบางส่วนเข้ากับ config ที่มีอยู่ (ตามความหมายของ JSON merge patch):

    - Objects จะ merge แบบ recursive
    - `null` จะลบคีย์
    - Arrays จะถูกแทนที่

    พารามิเตอร์:

    - `raw` (string) — JSON5 ที่มีเฉพาะคีย์ที่ต้องการเปลี่ยน
    - `baseHash` (จำเป็น) — config hash จาก `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — เหมือนกับ `config.apply`

    พฤติกรรมการรีสตาร์ตเหมือนกับ `config.apply`: รวมคำขอรีสตาร์ตที่รออยู่เข้าด้วยกัน และมีคูลดาวน์ 30 วินาทีระหว่างรอบการรีสตาร์ต

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม

OpenClaw อ่าน env var จาก parent process รวมถึง:

- `.env` จากไดเรกทอรีทำงานปัจจุบัน (ถ้ามี)
- `~/.openclaw/.env` (fallback แบบ global)

ทั้งสองไฟล์จะไม่ override env var ที่มีอยู่แล้ว คุณยังสามารถตั้งค่า env var แบบ inline ใน config ได้ด้วย:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="การนำเข้า shell env (ไม่บังคับ)">
  หากเปิดใช้งาน และคีย์ที่คาดหวังยังไม่ได้ถูกตั้งค่า OpenClaw จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่ขาดหายไป:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ค่า env var ที่เทียบเท่า: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="การแทนค่าด้วย env var ในค่า config">
  อ้างอิง env var ในค่าสตริงของ config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

กฎ:

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่เท่านั้น: `[A-Z_][A-Z0-9_]*`
- หากตัวแปรหายไป/ว่าง จะเกิดข้อผิดพลาดขณะโหลด
- escape ด้วย `$${VAR}` เพื่อให้แสดงผลตามตัวอักษร
- ใช้งานได้ภายในไฟล์ `$include`
- การแทนค่าแบบ inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  สำหรับฟิลด์ที่รองรับ SecretRef object คุณสามารถใช้:

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

รายละเอียดของ SecretRef (รวมถึง `secrets.providers` สำหรับ `env`/`file`/`exec`) อยู่ใน [Secrets Management](/th/gateway/secrets)
เส้นทางข้อมูลรับรองที่รองรับแสดงไว้ใน [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
</Accordion>

ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาแบบเต็ม

## เอกสารอ้างอิงฉบับเต็ม

สำหรับเอกสารอ้างอิงแบบครบถ้วนแยกตามฟิลด์ โปรดดู **[Configuration Reference](/th/gateway/configuration-reference)**

---

_ที่เกี่ยวข้อง: [Configuration Examples](/th/gateway/configuration-examples) · [Configuration Reference](/th/gateway/configuration-reference) · [Doctor](/th/gateway/doctor)_
