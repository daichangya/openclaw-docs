---
read_when:
    - คุณต้องการใช้การสมัครใช้งาน Claude Max กับเครื่องมือแบบ OpenAI-compatible
    - คุณต้องการเซิร์ฟเวอร์ API ในเครื่องที่ครอบ Claude Code CLI
    - คุณต้องการประเมินความแตกต่างระหว่างการเข้าถึง Anthropic แบบสมัครใช้งานกับแบบ API key
summary: พร็อกซีจากชุมชนเพื่อเปิดเผยข้อมูลรับรองการสมัครใช้งาน Claude เป็น endpoint แบบ OpenAI-compatible
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-23T05:50:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** เป็นเครื่องมือจากชุมชนที่เปิดเผยการสมัครใช้งาน Claude Max/Pro ของคุณในรูปแบบ OpenAI-compatible API endpoint วิธีนี้ทำให้คุณใช้การสมัครของคุณกับเครื่องมือใดก็ได้ที่รองรับรูปแบบ OpenAI API

<Warning>
เส้นทางนี้มีไว้เพื่อความเข้ากันได้ทางเทคนิคเท่านั้น ในอดีต Anthropic เคยบล็อกการใช้งานการสมัครสมาชิกบางรูปแบบนอก Claude Code คุณต้องเป็นผู้ตัดสินใจเองว่าจะใช้หรือไม่ และควรตรวจสอบข้อกำหนดปัจจุบันของ Anthropic ก่อนพึ่งพาวิธีนี้
</Warning>

## ทำไมจึงควรใช้สิ่งนี้?

| แนวทาง                  | ค่าใช้จ่าย                                            | เหมาะที่สุดสำหรับ                        |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Anthropic API           | จ่ายตามโทเค็น (~$15/M input, $75/M output สำหรับ Opus) | แอป production, ปริมาณสูง                |
| การสมัคร Claude Max     | $200/เดือน แบบคงที่                                  | การใช้งานส่วนตัว, การพัฒนา, การใช้งานไม่จำกัด |

หากคุณมีการสมัคร Claude Max และต้องการใช้กับเครื่องมือแบบ OpenAI-compatible พร็อกซีนี้อาจช่วยลดต้นทุนสำหรับบางเวิร์กโฟลว์ได้ API keys ยังคงเป็นเส้นทางตามนโยบายที่ชัดเจนกว่าสำหรับการใช้งานใน production

## วิธีการทำงาน

```
แอปของคุณ → claude-max-api-proxy → Claude Code CLI → Anthropic (ผ่านการสมัคร)
 (รูปแบบ OpenAI)                (แปลงรูปแบบ)         (ใช้การล็อกอินของคุณ)
```

พร็อกซีจะ:

1. รับคำขอรูปแบบ OpenAI ที่ `http://localhost:3456/v1/chat/completions`
2. แปลงคำขอเหล่านั้นเป็นคำสั่งของ Claude Code CLI
3. ส่งคืนคำตอบในรูปแบบ OpenAI (รองรับ streaming)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้งพร็อกซี">
    ต้องใช้ Node.js 20+ และ Claude Code CLI

    ```bash
    npm install -g claude-max-api-proxy

    # ตรวจสอบว่า Claude CLI ยืนยันตัวตนแล้ว
    claude --version
    ```

  </Step>
  <Step title="เริ่มเซิร์ฟเวอร์">
    ```bash
    claude-max-api
    # เซิร์ฟเวอร์รันที่ http://localhost:3456
    ```
  </Step>
  <Step title="ทดสอบพร็อกซี">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # แสดงรายการโมเดล
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="กำหนดค่า OpenClaw">
    ให้ OpenClaw ชี้ไปยังพร็อกซีนี้ในฐานะ endpoint แบบ OpenAI-compatible แบบกำหนดเอง:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## โมเดลที่มีให้ใช้

| Model ID          | แมปไปยัง         |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## ขั้นสูง

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับเส้นทาง OpenAI-compatible แบบพร็อกซี">
    เส้นทางนี้ใช้เส้นทาง OpenAI-compatible แบบพร็อกซีเดียวกับ backend `/v1`
    แบบกำหนดเองอื่นๆ:

    - การจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟจะไม่ถูกนำมาใช้
    - ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี prompt-cache hints และไม่มี
      การจัดรูป payload reasoning-compat ของ OpenAI
    - OpenClaw attribution headers แบบซ่อน (`originator`, `version`, `User-Agent`)
      จะไม่ถูก inject บน URL ของพร็อกซี

  </Accordion>

  <Accordion title="เริ่มอัตโนมัติบน macOS ด้วย LaunchAgent">
    สร้าง LaunchAgent เพื่อให้พร็อกซีรันโดยอัตโนมัติ:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## ลิงก์

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## หมายเหตุ

- นี่เป็น **เครื่องมือจากชุมชน** ไม่ได้รองรับอย่างเป็นทางการโดย Anthropic หรือ OpenClaw
- ต้องมีการสมัคร Claude Max/Pro ที่ยังใช้งานอยู่ และ Claude Code CLI ที่ยืนยันตัวตนแล้ว
- พร็อกซีรันในเครื่องและจะไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ของบุคคลที่สาม
- รองรับการตอบกลับแบบ streaming เต็มรูปแบบ

<Note>
สำหรับการผสานรวม Anthropic แบบเนทีฟด้วย Claude CLI หรือ API keys ดู [Anthropic provider](/th/providers/anthropic) สำหรับการสมัครใช้งาน OpenAI/Codex ดู [OpenAI provider](/th/providers/openai)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/th/providers/anthropic" icon="bolt">
    การผสานรวมแบบเนทีฟของ OpenClaw กับ Claude CLI หรือ API keys
  </Card>
  <Card title="OpenAI provider" href="/th/providers/openai" icon="robot">
    สำหรับการสมัครใช้งาน OpenAI/Codex
  </Card>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config แบบเต็ม
  </Card>
</CardGroup>
