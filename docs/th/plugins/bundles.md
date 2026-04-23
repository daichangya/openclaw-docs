---
read_when:
    - คุณต้องการติดตั้ง bundle ที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องการทำความเข้าใจว่า OpenClaw แมปเนื้อหาของ bundle เข้ากับฟีเจอร์แบบ native อย่างไร
    - คุณกำลังดีบักการตรวจจับ bundle หรือความสามารถที่หายไป
summary: ติดตั้งและใช้ bundles ของ Codex, Claude และ Cursor เป็น Plugins ของ OpenClaw
title: Plugin Bundles
x-i18n:
    generated_at: "2026-04-23T05:46:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin Bundles

OpenClaw สามารถติดตั้ง Plugins จากระบบนิเวศภายนอกได้สามแบบ: **Codex**, **Claude**
และ **Cursor** โดยสิ่งเหล่านี้เรียกว่า **bundles** — ชุดเนื้อหาและ metadata ที่
OpenClaw แมปเข้าสู่ฟีเจอร์แบบ native เช่น skills, hooks และ MCP tools

<Info>
  Bundles **ไม่เหมือนกับ** native Plugins ของ OpenClaw โดย native plugins จะรัน
  ในโปรเซสเดียวกันและสามารถลงทะเบียนความสามารถใดก็ได้ ส่วน bundles เป็น content packs ที่มีการแมปฟีเจอร์แบบเลือกเฉพาะและมีขอบเขตความเชื่อถือที่แคบกว่า
</Info>

## ทำไมต้องมี bundles

มี Plugins ที่มีประโยชน์จำนวนมากถูกเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่จะบังคับให้ผู้เขียนต้องเขียนใหม่เป็น native Plugins ของ OpenClaw นั้น OpenClaw จะตรวจจับรูปแบบเหล่านี้และแมปเนื้อหาที่รองรับเข้าสู่ชุดฟีเจอร์แบบ native ซึ่งหมายความว่าคุณสามารถติดตั้งชุดคำสั่ง Claude หรือ skill bundle ของ Codex แล้วใช้งานได้ทันที

## ติดตั้ง bundle

<Steps>
  <Step title="ติดตั้งจากไดเรกทอรี, archive หรือ marketplace">
    ```bash
    # ไดเรกทอรีในเครื่อง
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="ตรวจสอบการตรวจจับ">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles จะแสดงเป็น `Format: bundle` พร้อม subtype เป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="รีสตาร์ตและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่ถูกแมปแล้ว (skills, hooks, MCP tools, LSP defaults) จะพร้อมใช้ใน session ถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจาก bundles

ยังไม่ใช่ทุกฟีเจอร์ของ bundle ที่รันใน OpenClaw ได้ในตอนนี้ ต่อไปนี้คือสิ่งที่ใช้ได้แล้ว และสิ่งที่ตรวจพบได้แต่ยังไม่ได้เชื่อมต่อให้ทำงาน

### รองรับแล้วในตอนนี้

| ฟีเจอร์       | วิธีที่ถูกแมป                                                                                | ใช้กับ           |
| ------------- | ------------------------------------------------------------------------------------------- | ---------------- |
| เนื้อหา Skills | ราก skill ของ bundle จะถูกโหลดเป็น Skills ปกติของ OpenClaw                                | ทุกรูปแบบ        |
| Commands      | `commands/` และ `.cursor/commands/` ถูกมองเป็น skill roots                                 | Claude, Cursor   |
| Hook packs    | layout แบบ OpenClaw ของ `HOOK.md` + `handler.ts`                                           | Codex            |
| MCP tools     | MCP config ของ bundle ถูก merge เข้ากับการตั้งค่า embedded Pi; โหลด stdio และ HTTP servers ที่รองรับ | ทุกรูปแบบ        |
| LSP servers   | Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest ถูก merge เข้ากับ embedded Pi LSP defaults | Claude           |
| Settings      | Claude `settings.json` ถูกนำเข้าเป็นค่าเริ่มต้นของ embedded Pi                             | Claude           |

#### เนื้อหา Skills

- ราก skill ของ bundle จะถูกโหลดเป็นรากของ Skills ปกติใน OpenClaw
- ราก `commands` ของ Claude จะถูกมองเป็นรากของ Skills เพิ่มเติม
- ราก `.cursor/commands` ของ Cursor จะถูกมองเป็นรากของ Skills เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่ง markdown ของ Claude จะทำงานผ่านตัวโหลด Skills ปกติของ OpenClaw และ markdown commands ของ Cursor ก็ทำงานผ่านเส้นทางเดียวกัน

#### Hook packs

- ราก hook ของ bundle จะทำงาน **ได้ก็ต่อเมื่อ** มันใช้ layout ของ hook-pack ปกติของ OpenClaw โดยตอนนี้กรณีที่เด่นที่สุดคือแบบเข้ากันได้กับ Codex:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- bundles ที่เปิดใช้งานแล้วสามารถเพิ่ม MCP server config ได้
- OpenClaw จะ merge MCP config ของ bundle เข้าไปใน effective embedded Pi settings ในชื่อ `mcpServers`
- OpenClaw จะเปิดเผย bundle MCP tools ที่รองรับระหว่าง embedded Pi agent turns โดยการ launch stdio servers หรือเชื่อมต่อไปยัง HTTP servers
- โปรไฟล์เครื่องมือ `coding` และ `messaging` จะรวม bundle MCP tools มาให้โดยค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อ opt out สำหรับเอเจนต์หรือ gateway ใด
- การตั้งค่า Pi แบบ local ต่อโปรเจ็กต์ยังคงถูกนำมาใช้หลังค่าเริ่มต้นของ bundle ดังนั้นการตั้งค่าของ workspace จึงสามารถ override รายการ MCP ของ bundle ได้เมื่อจำเป็น
- แค็ตตาล็อกเครื่องมือของ bundle MCP จะถูกเรียงลำดับแบบกำหนดแน่นอนก่อนการลงทะเบียน เพื่อไม่ให้การเปลี่ยนแปลงลำดับจาก `listTools()` ต้นทางทำให้ prompt-cache tool blocks แกว่งไปมา

##### การขนส่ง

MCP servers สามารถใช้ stdio หรือ HTTP transport ได้:

**Stdio** จะ launch child process:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** จะเชื่อมต่อกับ MCP server ที่กำลังรันอยู่ โดยใช้ `sse` เป็นค่าเริ่มต้น หรือใช้ `streamable-http` เมื่อร้องขอ:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- สามารถตั้ง `transport` เป็น `"streamable-http"` หรือ `"sse"`; หากไม่ระบุ OpenClaw จะใช้ `sse`
- อนุญาตเฉพาะ URL schemes แบบ `http:` และ `https:` เท่านั้น
- ค่าใน `headers` รองรับการแทนค่า `${ENV_VAR}`
- รายการ server ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- credentials ใน URL (userinfo และ query params) จะถูกปกปิดออกจาก
  คำอธิบายของเครื่องมือและ logs
- `connectionTimeoutMs` ใช้ override ค่าเริ่มต้นของ connection timeout 30 วินาที
  สำหรับทั้ง stdio และ HTTP transports

##### การตั้งชื่อเครื่องมือ

OpenClaw จะลงทะเบียน bundle MCP tools ด้วยชื่อที่ปลอดภัยสำหรับ provider ในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น server ที่คีย์ว่า `"vigil-harbor"` และเปิดเผย
เครื่องมือ `memory_search` จะถูกลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระที่อยู่นอก `A-Za-z0-9_-` จะถูกแทนด้วย `-`
- server prefixes ถูกจำกัดไว้ที่ 30 ตัวอักษร
- ชื่อเครื่องมือเต็มถูกจำกัดไว้ที่ 64 ตัวอักษร
- server names ที่ว่างจะ fallback เป็น `mcp`
- ชื่อที่ sanitize แล้วชนกันจะถูกแยกความต่างด้วย suffix แบบตัวเลข
- ลำดับของเครื่องมือสุดท้ายที่ถูกเปิดเผยจะเป็นแบบกำหนดแน่นอนตาม safe name เพื่อให้ Pi turns ที่เกิดซ้ำมี cache ที่คงที่
- การกรองด้วยโปรไฟล์จะถือว่าเครื่องมือทั้งหมดจาก bundle MCP server เดียวกันเป็นของ Plugin เดียวกันในชื่อ `bundle-mcp` ดังนั้น profile allowlists และ deny lists จึงสามารถระบุได้ทั้งชื่อเครื่องมือที่ถูกเปิดเผยเป็นรายตัว หรือคีย์ Plugin `bundle-mcp`

#### Embedded Pi settings

- Claude `settings.json` จะถูกนำเข้าเป็นค่าเริ่มต้นของ embedded Pi settings เมื่อ
  bundle ถูกเปิดใช้งาน
- OpenClaw จะ sanitize shell override keys ก่อนนำไปใช้

คีย์ที่ sanitize:

- `shellPath`
- `shellCommandPrefix`

#### Embedded Pi LSP

- Claude bundles ที่เปิดใช้งานแล้วสามารถเพิ่ม LSP server config ได้
- OpenClaw จะโหลด `.lsp.json` รวมถึงพาธ `lspServers` ที่ประกาศใน manifest
- LSP config ของ bundle จะถูก merge เข้า effective embedded Pi LSP defaults
- ปัจจุบันรองรับการรันเฉพาะ LSP servers แบบ stdio-backed ที่รองรับเท่านั้น; transports ที่ไม่รองรับจะยังคงแสดงอยู่ใน `openclaw plugins inspect <id>`

### ตรวจพบได้แต่ยังไม่ถูก execute

สิ่งเหล่านี้ถูกจดจำและแสดงใน diagnostics แต่ OpenClaw ยังไม่รันมัน:

- Claude `agents`, automation ของ `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app metadata ที่นอกเหนือจากการรายงานความสามารถ

## รูปแบบของ bundle

<AccordionGroup>
  <Accordion title="Codex bundles">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาแบบไม่บังคับ: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex bundles เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้รากของ skill และ
    ไดเรกทอรี hook-pack แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="Claude bundles">
    มีสองโหมดการตรวจจับ:

    - **Manifest-based:** `.claude-plugin/plugin.json`
    - **Manifestless:** layout ปกติของ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกมองเป็นเนื้อหา Skills
    - `settings.json` ถูกนำเข้าไปยัง embedded Pi settings (shell override keys จะถูก sanitize)
    - `.mcp.json` เปิดเผย stdio tools ที่รองรับให้กับ embedded Pi
    - `.lsp.json` รวมถึงพาธ `lspServers` ที่ประกาศใน manifest จะถูกโหลดเข้า embedded Pi LSP defaults
    - `hooks/hooks.json` ถูกตรวจพบได้แต่ไม่ถูก execute
    - custom component paths ใน manifest เป็นแบบ additive (มันขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="Cursor bundles">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาแบบไม่บังคับ: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกมองเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/` และ `.cursor/hooks.json` มีไว้ตรวจพบเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญในการตรวจจับ

OpenClaw จะตรวจสอบรูปแบบ native plugin ก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — จะถูกมองเป็น **native Plugin**
2. ตัวบ่งชี้ของ bundle (`.codex-plugin/`, `.claude-plugin/` หรือ layout เริ่มต้นของ Claude/Cursor) — จะถูกมองเป็น **bundle**

หากไดเรกทอรีมีทั้งสองอย่าง OpenClaw จะใช้เส้นทาง native วิธีนี้ป้องกันไม่ให้
แพ็กเกจแบบ dual-format ถูกติดตั้งเป็น bundle แบบไม่สมบูรณ์บางส่วน

## ความปลอดภัย

Bundles มีขอบเขตความเชื่อถือที่แคบกว่า native plugins:

- OpenClaw **จะไม่** โหลด arbitrary bundle runtime modules แบบ in-process
- พาธของ Skills และ hook-pack ต้องอยู่ภายในรากของ Plugin (มี boundary check)
- ไฟล์ settings จะถูกอ่านด้วย boundary checks แบบเดียวกัน
- stdio MCP servers ที่รองรับอาจถูก launch เป็น subprocesses

สิ่งนี้ทำให้ bundles ปลอดภัยกว่าเป็นค่าเริ่มต้น แต่คุณก็ควรมอง bundles จาก third-party ว่าเป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่มันเปิดเผยอยู่ดี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบ bundle แล้ว แต่ความสามารถไม่ทำงาน">
    รัน `openclaw plugins inspect <id>` หากมีความสามารถถูกแสดงอยู่แต่ถูกระบุว่า
    ยังไม่ได้เชื่อมต่อ นั่นคือข้อจำกัดของผลิตภัณฑ์ — ไม่ใช่การติดตั้งเสีย
  </Accordion>

  <Accordion title="ไฟล์คำสั่งของ Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่า bundle ถูกเปิดใช้งานแล้ว และไฟล์ markdown อยู่ภายใน
    ราก `commands/` หรือ `skills/` ที่ระบบตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่ถูกนำไปใช้">
    รองรับเฉพาะ embedded Pi settings จาก `settings.json` เท่านั้น OpenClaw จะ
    ไม่มอง bundle settings เป็น raw config patches
  </Accordion>

  <Accordion title="Claude hooks ไม่ถูก execute">
    `hooks/hooks.json` มีไว้ตรวจพบเท่านั้น หากคุณต้องการ hooks ที่รันได้ ให้ใช้
    layout แบบ OpenClaw hook-pack หรือส่งมาเป็น native Plugin
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Install and Configure Plugins](/th/tools/plugin)
- [Building Plugins](/th/plugins/building-plugins) — สร้าง native Plugin
- [Plugin Manifest](/th/plugins/manifest) — schema ของ native manifest
