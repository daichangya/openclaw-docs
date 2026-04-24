---
read_when:
    - คุณต้องการติดตั้งบันเดิลที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องเข้าใจว่า OpenClaw แมปเนื้อหาในบันเดิลไปยังฟีเจอร์แบบเนทีฟอย่างไร
    - คุณกำลังดีบักการตรวจจับบันเดิลหรือความสามารถที่หายไป
summary: ติดตั้งและใช้บันเดิล Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: บันเดิล Plugin
x-i18n:
    generated_at: "2026-04-24T09:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw สามารถติดตั้งปลั๊กอินจากระบบนิเวศภายนอกได้สามแบบ: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **bundles** — แพ็กของเนื้อหาและข้อมูลเมตาที่
OpenClaw แมปไปยังฟีเจอร์แบบเนทีฟ เช่น skills, hooks และเครื่องมือ MCP

<Info>
  Bundles **ไม่ใช่** ปลั๊กอิน OpenClaw แบบเนทีฟเหมือนกัน ปลั๊กอินแบบเนทีฟทำงาน
  ภายในโปรเซสและสามารถลงทะเบียนความสามารถใดก็ได้ ส่วน bundles เป็นแพ็กเนื้อหาที่มี
  การแมปฟีเจอร์แบบเลือกเฉพาะและมีขอบเขตความเชื่อถือที่แคบกว่า
</Info>

## เหตุผลที่มี bundles

ปลั๊กอินที่มีประโยชน์จำนวนมากถูกเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่
จะบังคับให้ผู้เขียนต้องเขียนใหม่เป็นปลั๊กอิน OpenClaw แบบเนทีฟ OpenClaw จะตรวจจับ
รูปแบบเหล่านี้และแมปเนื้อหาที่รองรับไปยังชุดฟีเจอร์แบบเนทีฟ ซึ่งหมายความว่าคุณสามารถ
ติดตั้งแพ็กคำสั่ง Claude หรือบันเดิล skill ของ Codex แล้วใช้งานได้ทันที

## ติดตั้งบันเดิล

<Steps>
  <Step title="ติดตั้งจากไดเรกทอรี ไฟล์เก็บถาวร หรือมาร์เก็ตเพลส">
    ```bash
    # ไดเรกทอรีในเครื่อง
    openclaw plugins install ./my-bundle

    # ไฟล์เก็บถาวร
    openclaw plugins install ./my-bundle.tgz

    # มาร์เก็ตเพลส Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="ตรวจสอบการตรวจจับ">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    บันเดิลจะแสดงเป็น `Format: bundle` โดยมีชนิดย่อยเป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="รีสตาร์ตและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่ถูกแมปแล้ว (skills, hooks, เครื่องมือ MCP, ค่าเริ่มต้นของ LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจาก bundles

ฟีเจอร์ของบันเดิลไม่ได้ทุกอย่างที่จะทำงานใน OpenClaw ได้ในตอนนี้ ด้านล่างนี้คือสิ่งที่
ใช้งานได้ และสิ่งที่ตรวจจับได้แต่ยังไม่ได้เชื่อมการทำงาน

### รองรับแล้วในตอนนี้

| ฟีเจอร์ | วิธีการแมป | ใช้กับ |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา skill | ราก skill ของบันเดิลโหลดเป็น Skills ของ OpenClaw ตามปกติ | ทุกรูปแบบ |
| คำสั่ง | `commands/` และ `.cursor/commands/` ถูกมองเป็นราก skill | Claude, Cursor |
| แพ็ก hook | เลย์เอาต์แบบ OpenClaw ของ `HOOK.md` + `handler.ts` | Codex |
| เครื่องมือ MCP | การตั้งค่า MCP ของบันเดิลถูกรวมเข้ากับการตั้งค่า Pi แบบฝัง; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ |
| เซิร์ฟเวอร์ LSP | `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest ถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝัง | Claude |
| การตั้งค่า | `settings.json` ของ Claude ถูกนำเข้าเป็นค่าเริ่มต้นของ Pi แบบฝัง | Claude |

#### เนื้อหา skill

- ราก skill ของบันเดิลโหลดเป็นราก Skills ของ OpenClaw ตามปกติ
- ราก `commands` ของ Claude ถูกมองเป็นราก skill เพิ่มเติม
- ราก `.cursor/commands` ของ Cursor ถูกมองเป็นราก skill เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่ง markdown ของ Claude ทำงานผ่านตัวโหลด skill ปกติของ OpenClaw ส่วน markdown คำสั่งของ Cursor ก็ทำงานผ่านเส้นทางเดียวกัน

#### แพ็ก hook

- ราก hook ของบันเดิลจะทำงาน **เฉพาะ** เมื่อใช้เลย์เอาต์แพ็ก hook ปกติของ OpenClaw
  เท่านั้น ปัจจุบันกรณีหลักคือรูปแบบที่เข้ากันได้กับ Codex:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- บันเดิลที่เปิดใช้งานสามารถเพิ่มการตั้งค่าเซิร์ฟเวอร์ MCP ได้
- OpenClaw รวมการตั้งค่า MCP ของบันเดิลเข้าไปยังการตั้งค่า Pi แบบฝังที่มีผลจริงในชื่อ
  `mcpServers`
- OpenClaw จะแสดงเครื่องมือ MCP ของบันเดิลที่รองรับระหว่างรอบการทำงานของเอเจนต์ Pi แบบฝัง
  โดยการเปิดเซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของบันเดิลไว้โดยค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อปิดใช้สำหรับเอเจนต์หรือ gateway
- การตั้งค่า Pi ระดับโปรเจ็กต์ในเครื่องยังคงมีผลหลังจากค่าเริ่มต้นของบันเดิล ดังนั้น
  การตั้งค่าระดับเวิร์กสเปซจึงสามารถแทนที่รายการ MCP ของบันเดิลได้เมื่อจำเป็น
- แค็ตตาล็อกเครื่องมือ MCP ของบันเดิลถูกจัดเรียงแบบกำหนดแน่นอนก่อนลงทะเบียน ดังนั้น
  การเปลี่ยนลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อกเครื่องมือ prompt-cache เปลี่ยนไปมา

##### ทรานสปอร์ต

เซิร์ฟเวอร์ MCP สามารถใช้ทรานสปอร์ตแบบ stdio หรือ HTTP:

**Stdio** จะเปิด child process:

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

**HTTP** จะเชื่อมต่อไปยังเซิร์ฟเวอร์ MCP ที่กำลังทำงานอยู่ผ่าน `sse` โดยค่าเริ่มต้น หรือ `streamable-http` เมื่อมีการระบุ:

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

- `transport` สามารถตั้งเป็น `"streamable-http"` หรือ `"sse"`; หากไม่ระบุ OpenClaw จะใช้ `sse`
- อนุญาตเฉพาะ URL scheme แบบ `http:` และ `https:` เท่านั้น
- ค่าใน `headers` รองรับการแทรกค่า `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และ query params) จะถูกปกปิดในคำอธิบายเครื่องมือ
  และบันทึก
- `connectionTimeoutMs` ใช้แทนค่าหมดเวลาเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  ทั้งทรานสปอร์ต stdio และ HTTP

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของบันเดิลด้วยชื่อที่ปลอดภัยสำหรับผู้ให้บริการในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่ใช้คีย์ `"vigil-harbor"` และเผยแพร่
เครื่องมือ `memory_search` จะถูกลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระที่อยู่นอก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- คำนำหน้าของเซิร์ฟเวอร์ถูกจำกัดไว้ที่ 30 อักขระ
- ชื่อเครื่องมือเต็มถูกจำกัดไว้ที่ 64 อักขระ
- หากชื่อเซิร์ฟเวอร์ว่าง จะย้อนกลับไปใช้ `mcp`
- ชื่อที่ผ่านการ sanitize แล้วชนกันจะถูกแยกความต่างด้วย suffix แบบตัวเลข
- ลำดับเครื่องมือสุดท้ายที่แสดงจะเป็นแบบกำหนดแน่นอนตาม safe name เพื่อให้รอบการทำงาน
  ของ Pi ที่เกิดซ้ำยังคงเสถียรต่อแคช
- การกรองตามโปรไฟล์จะมองเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของบันเดิลหนึ่งตัวว่าเป็นของปลั๊กอิน
  `bundle-mcp` ดังนั้นรายการอนุญาตและรายการปฏิเสธของโปรไฟล์จึงสามารถระบุได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัวหรือคีย์ปลั๊กอิน `bundle-mcp`

#### การตั้งค่า Pi แบบฝัง

- `settings.json` ของ Claude ถูกนำเข้าเป็นการตั้งค่า Pi แบบฝังเริ่มต้นเมื่อ
  เปิดใช้งานบันเดิล
- OpenClaw จะ sanitize คีย์ override ของ shell ก่อนนำไปใช้

คีย์ที่ถูก sanitize:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบฝัง

- บันเดิล Claude ที่เปิดใช้งานสามารถเพิ่มการตั้งค่าเซิร์ฟเวอร์ LSP ได้
- OpenClaw โหลด `.lsp.json` พร้อมกับพาธ `lspServers` ที่ประกาศใน manifest
- การตั้งค่า LSP ของบันเดิลถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังที่มีผลจริง
- ปัจจุบันสามารถรันได้เฉพาะเซิร์ฟเวอร์ LSP ที่รองรับและทำงานบน stdio; ทรานสปอร์ตที่ไม่รองรับ
  จะยังคงแสดงใน `openclaw plugins inspect <id>`

### ตรวจจับได้แต่ยังไม่ถูกเรียกใช้งาน

สิ่งเหล่านี้จะถูกรับรู้และแสดงในข้อมูลวินิจฉัย แต่ OpenClaw จะยังไม่เรียกใช้งาน:

- `agents`, ระบบอัตโนมัติ `hooks.json`, `outputStyles` ของ Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` ของ Cursor
- ข้อมูลเมตาแบบ inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบบันเดิล

<AccordionGroup>
  <Accordion title="บันเดิล Codex">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริมที่อาจมี: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    บันเดิล Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้ราก skill และ
    ไดเรกทอรีแพ็ก hook แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="บันเดิล Claude">
    โหมดการตรวจจับมีสองแบบ:

    - **อิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกมองเป็นเนื้อหา skill
    - `settings.json` ถูกนำเข้าไปยังการตั้งค่า Pi แบบฝัง (คีย์ override ของ shell จะถูก sanitize)
    - `.mcp.json` แสดงเครื่องมือ stdio ที่รองรับให้กับ Pi แบบฝัง
    - `.lsp.json` พร้อมพาธ `lspServers` ที่ประกาศใน manifest จะถูกโหลดเข้าเป็นค่าเริ่มต้น LSP ของ Pi แบบฝัง
    - `hooks/hooks.json` ถูกตรวจจับได้แต่ไม่ถูกเรียกใช้งาน
    - พาธคอมโพเนนต์แบบกำหนดเองใน manifest จะเป็นแบบ additive (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="บันเดิล Cursor">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริมที่อาจมี: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกมองเป็นเนื้อหา skill
    - `.cursor/rules/`, `.cursor/agents/` และ `.cursor/hooks.json` เป็นแบบตรวจจับเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญของการตรวจจับ

OpenClaw จะตรวจหารูปแบบปลั๊กอินแบบเนทีฟก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถือเป็น **ปลั๊กอินแบบเนทีฟ**
2. ตัวบ่งชี้บันเดิล (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถือเป็น **บันเดิล**

หากไดเรกทอรีหนึ่งมีทั้งสองแบบ OpenClaw จะใช้เส้นทางแบบเนทีฟ วิธีนี้ช่วยป้องกันไม่ให้
แพ็กเกจแบบสองรูปแบบถูกติดตั้งเป็นบันเดิลเพียงบางส่วน

## การพึ่งพาขณะรันไทม์และการล้างข้อมูล

- การพึ่งพาขณะรันไทม์ของปลั๊กอินแบบ bundled จะถูกรวมมากับแพ็กเกจ OpenClaw ภายใต้
  `dist/*` OpenClaw จะ **ไม่** รัน `npm install` ตอนเริ่มต้นสำหรับ
  ปลั๊กอินแบบ bundled; ไปป์ไลน์รีลีสเป็นผู้รับผิดชอบในการจัดส่ง payload ของ dependency แบบ bundled ที่สมบูรณ์ (ดูข้อกำหนดการตรวจสอบหลังเผยแพร่ใน
  [Releasing](/th/reference/RELEASING))

## ความปลอดภัย

Bundles มีขอบเขตความเชื่อถือที่แคบกว่าปลั๊กอินแบบเนทีฟ:

- OpenClaw จะ **ไม่** โหลดโมดูลรันไทม์ของบันเดิลแบบใดๆ เข้าสู่ in-process
- พาธของ skill และ hook-pack ต้องอยู่ภายในรากของปลั๊กอินเท่านั้น (มีการตรวจสอบขอบเขต)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเปิดเป็น subprocess

สิ่งนี้ทำให้ bundles ปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณก็ควรปฏิบัติต่อ bundles ของบุคคลที่สาม
ในฐานะเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่พวกมันเปิดเผยได้เช่นกัน

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบบันเดิลแล้ว แต่ความสามารถไม่ทำงาน">
    รัน `openclaw plugins inspect <id>` หากมีความสามารถแสดงอยู่แต่ถูกทำเครื่องหมายว่า
    ยังไม่ได้เชื่อมการทำงาน นั่นคือข้อจำกัดของผลิตภัณฑ์ — ไม่ใช่การติดตั้งที่เสียหาย
  </Accordion>

  <Accordion title="ไฟล์คำสั่งของ Claude ไม่แสดง">
    ตรวจสอบให้แน่ใจว่าเปิดใช้งานบันเดิลแล้ว และไฟล์ markdown อยู่ภายในราก
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่ถูกนำมาใช้">
    รองรับเฉพาะการตั้งค่า Pi แบบฝังจาก `settings.json` เท่านั้น OpenClaw
    ไม่ได้มองการตั้งค่าของบันเดิลเป็นแพตช์ config แบบดิบ
  </Accordion>

  <Accordion title="hooks ของ Claude ไม่ทำงาน">
    `hooks/hooks.json` เป็นแบบตรวจจับเท่านั้น หากคุณต้องการ hooks ที่เรียกใช้งานได้ ให้ใช้
    เลย์เอาต์แพ็ก hook ของ OpenClaw หรือจัดส่งเป็นปลั๊กอินแบบเนทีฟ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่าปลั๊กอิน](/th/tools/plugin)
- [การสร้างปลั๊กอิน](/th/plugins/building-plugins) — สร้างปลั๊กอินแบบเนทีฟ
- [Manifest ของปลั๊กอิน](/th/plugins/manifest) — สคีมา manifest แบบเนทีฟ
