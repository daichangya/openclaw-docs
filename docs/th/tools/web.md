---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า `web_search`
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า `x_search`
    - คุณต้องเลือกผู้ให้บริการการค้นหา
    - คุณต้องการเข้าใจการตรวจจับอัตโนมัติและ fallback ของผู้ให้บริการ
sidebarTitle: Web Search
summary: '`web_search`, `x_search` และ `web_fetch` -- ค้นหาเว็บ ค้นหาโพสต์บน X หรือดึงเนื้อหาหน้าเว็บ'
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-04-24T09:39:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

เครื่องมือ `web_search` ใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ในการค้นหาเว็บและ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตามคำค้นหาเป็นเวลา 15 นาที (กำหนดค่าได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ
`web_fetch` สำหรับดึง URL แบบน้ำหนักเบา ในระยะนี้ `web_fetch` ยังคงทำงาน
ในเครื่อง ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses อยู่เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบน้ำหนักเบา ไม่ใช่ระบบอัตโนมัติของเบราว์เซอร์ สำหรับ
  เว็บไซต์ที่พึ่งพา JS มากหรือการล็อกอิน ให้ใช้ [Web Browser](/th/tools/browser) สำหรับ
  การดึง URL ที่ระบุ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    เลือกผู้ให้บริการและทำการตั้งค่าที่จำเป็นให้เสร็จสิ้น ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่บางรายใช้ API key ดูรายละเอียดได้ในหน้าของ
    ผู้ให้บริการด้านล่าง
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและข้อมูลรับรองที่จำเป็น คุณยังสามารถตั้งค่า env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้ได้สำหรับผู้ให้บริการ
    ที่ใช้ API
  </Step>
  <Step title="ใช้งาน">
    ตอนนี้เอเจนต์สามารถเรียก `web_search` ได้แล้ว:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    สำหรับโพสต์บน X ให้ใช้:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## การเลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/th/tools/brave-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อม snippet รองรับโหมด `llm-context`, ตัวกรองประเทศ/ภาษา มี free tier ให้ใช้งาน
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    fallback แบบไม่ใช้คีย์ ไม่ต้องใช้ API key เป็นการเชื่อมต่อแบบไม่เป็นทางการผ่าน HTML
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบ neural + keyword พร้อมการดึงเนื้อหา (ไฮไลต์ ข้อความ สรุป)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่สังเคราะห์ด้วย AI พร้อมการอ้างอิงผ่านการ grounding ของ Google Search
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่สังเคราะห์ด้วย AI พร้อมการอ้างอิงผ่านการ grounding เว็บของ xAI
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่สังเคราะห์ด้วย AI พร้อมการอ้างอิงผ่านการค้นหาเว็บของ Moonshot
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน MiniMax Coding Plan search API
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    การค้นหาแบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ที่คุณกำหนดค่าไว้ ต้องใช้ `ollama signin`
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมการควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    meta-search แบบโฮสต์เอง ไม่ต้องใช้ API key รวบรวมผลจาก Google, Bing, DuckDuckGo และอื่น ๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อมความลึกของการค้นหา การกรองหัวข้อ และ `tavily_extract` สำหรับการดึง URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                               | ลักษณะผลลัพธ์              | ตัวกรอง                                          | API key                                                                          |
| ------------------------------------------ | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)               | snippet แบบมีโครงสร้าง     | ประเทศ, ภาษา, เวลา, โหมด `llm-context`          | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/th/tools/duckduckgo-search)     | snippet แบบมีโครงสร้าง     | --                                               | ไม่มี (ไม่ใช้คีย์)                                                               |
| [Exa](/th/tools/exa-search)                   | มีโครงสร้าง + ดึงเนื้อหา   | โหมด neural/keyword, วันที่, การดึงเนื้อหา      | `EXA_API_KEY`                                                                    |
| [Firecrawl](/th/tools/firecrawl)              | snippet แบบมีโครงสร้าง     | ผ่านเครื่องมือ `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/th/tools/gemini-search)             | AI สังเคราะห์ + การอ้างอิง | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/th/tools/grok-search)                 | AI สังเคราะห์ + การอ้างอิง | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/th/tools/kimi-search)                 | AI สังเคราะห์ + การอ้างอิง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/th/tools/minimax-search)    | snippet แบบมีโครงสร้าง     | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/th/tools/ollama-search)  | snippet แบบมีโครงสร้าง     | --                                               | ไม่มีตามค่าเริ่มต้น; ต้องใช้ `ollama signin`, และสามารถใช้ bearer auth ของผู้ให้บริการ Ollama ซ้ำได้ |
| [Perplexity](/th/tools/perplexity-search)     | snippet แบบมีโครงสร้าง     | ประเทศ, ภาษา, เวลา, โดเมน, ขีดจำกัดเนื้อหา      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/th/tools/searxng-search)           | snippet แบบมีโครงสร้าง     | หมวดหมู่, ภาษา                                   | ไม่มี (โฮสต์เอง)                                                                  |
| [Tavily](/th/tools/tavily)                    | snippet แบบมีโครงสร้าง     | ผ่านเครื่องมือ `tavily_search`                   | `TAVILY_API_KEY`                                                                 |

## การตรวจจับอัตโนมัติ

## การค้นหาเว็บแบบ native ของ OpenAI

โมเดล OpenAI Responses โดยตรงจะใช้เครื่องมือ `web_search` แบบโฮสต์โดย OpenAI โดยอัตโนมัติเมื่อเปิดใช้งานการค้นหาเว็บของ OpenClaw และไม่ได้ตรึงผู้ให้บริการแบบ managed ไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน bundled OpenAI Plugin และใช้ได้เฉพาะกับทราฟฟิก native OpenAI API เท่านั้น ไม่รวม base URL ของ proxy ที่เข้ากันได้กับ OpenAI หรือเส้นทาง Azure ตั้งค่า `tools.web.search.provider` เป็นผู้ให้บริการอื่น เช่น `brave` หากต้องการคงเครื่องมือ `web_search` แบบ managed ไว้สำหรับโมเดล OpenAI หรือกำหนด `tools.web.search.enabled: false` เพื่อปิดทั้งการค้นหาแบบ managed และการค้นหาแบบ native ของ OpenAI

## การค้นหาเว็บแบบ native ของ Codex

โมเดลที่รองรับ Codex สามารถใช้เครื่องมือ `web_search` แบบ Responses ของผู้ให้บริการโดยตรงแทนฟังก์ชัน `web_search` แบบ managed ของ OpenClaw ได้ตามต้องการ

- กำหนดค่าได้ภายใต้ `tools.web.search.openaiCodex`
- จะเปิดใช้งานเฉพาะกับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` แบบ managed ยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าตั้งต้นและเป็นค่าที่แนะนำ
- `tools.web.search.enabled: false` จะปิดทั้งการค้นหาแบบ managed และแบบ native

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

หากเปิดการค้นหาแบบ native ของ Codex แต่โมเดลปัจจุบันไม่รองรับ Codex OpenClaw จะคงพฤติกรรม `web_search` แบบ managed ปกติไว้

## การตั้งค่า web search

รายการผู้ให้บริการในเอกสารและโฟลว์การตั้งค่าจะเรียงตามตัวอักษร แต่การตรวจจับอัตโนมัติจะใช้
ลำดับความสำคัญแยกต่างหาก

หากไม่ได้ตั้งค่า `provider` ไว้ OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
รายแรกที่พร้อมใช้งาน:

ผู้ให้บริการที่ใช้ API ก่อน:

1. **Brave** -- `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey` (ลำดับ 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey` (ลำดับ 15)
3. **Gemini** -- `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey` (ลำดับ 20)
4. **Grok** -- `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` (ลำดับ 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey` (ลำดับ 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey` (ลำดับ 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey` (ลำดับ 60)
8. **Exa** -- `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey` (ลำดับ 65)
9. **Tavily** -- `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey` (ลำดับ 70)

จากนั้นจึงเป็น fallback แบบไม่ใช้คีย์:

10. **DuckDuckGo** -- fallback แบบ HTML ที่ไม่ใช้คีย์ ไม่ต้องมีบัญชีหรือ API key (ลำดับ 100)
11. **Ollama Web Search** -- fallback แบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ที่คุณกำหนดค่าไว้; ต้องให้ Ollama เข้าถึงได้และลงชื่อเข้าใช้ด้วย `ollama signin` และสามารถใช้ bearer auth ของผู้ให้บริการ Ollama ซ้ำได้หากโฮสต์ต้องการ (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการใดเลย ระบบจะ fallback ไปที่ Brave (คุณจะได้รับข้อผิดพลาด
ว่าขาดคีย์ซึ่งจะแนะนำให้คุณกำหนดค่า)

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทั้งหมดรองรับออบเจ็กต์ SecretRef ฟิลด์ SecretRef
  ในขอบเขต Plugin ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูกแก้หาให้กับ
  ผู้ให้บริการ Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity และ Tavily แบบ bundled
  ไม่ว่าผู้ให้บริการจะถูกเลือกแบบ explicit ผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่านการตรวจจับอัตโนมัติ ในโหมดตรวจจับอัตโนมัติ OpenClaw จะแก้หาเฉพาะ
  คีย์ของผู้ให้บริการที่ถูกเลือกเท่านั้น -- SecretRef ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะยังไม่ทำงาน ทำให้คุณ
  สามารถเก็บการกำหนดค่าผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียต้นทุนการแก้หา
  สำหรับรายที่คุณไม่ได้ใช้งาน
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // ค่าเริ่มต้น: true
        provider: "brave", // หรือไม่ต้องระบุเพื่อใช้การตรวจจับอัตโนมัติ
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

config เฉพาะผู้ให้บริการ (API keys, base URLs, modes) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` ดูตัวอย่างได้ในหน้าของผู้ให้บริการแต่ละราย

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกต่างหาก:

- เลือกได้ด้วย `tools.web.fetch.provider`
- หรือไม่ต้องระบุฟิลด์นี้ และให้ OpenClaw ตรวจจับอัตโนมัติผู้ให้บริการ web-fetch
  รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มี
- ปัจจุบันผู้ให้บริการ web-fetch แบบ bundled คือ Firecrawl ซึ่งกำหนดค่าไว้ภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw อาจถามเพิ่มเติมเกี่ยวกับ:

- region ของ Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดล web-search ค่าเริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่า `plugins.entries.xai.config.xSearch.*` โดยใช้
fallback `XAI_API_KEY` แบบเดียวกับการค้นหาเว็บของ Grok
config แบบเดิม `tools.web.x_search.*` จะถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยคีย์เดียวกันได้
นี่เป็นขั้นตอนติดตามผลแยกภายในเส้นทางของ Grok ไม่ใช่ตัวเลือกผู้ให้บริการ
web-search ระดับบนสุดแยกต่างหาก หากคุณเลือกผู้ให้บริการอื่น OpenClaw จะไม่
แสดงพรอมป์ `x_search`

### การจัดเก็บ API keys

<Tabs>
  <Tab title="ไฟล์ Config">
    รัน `openclaw configure --section web` หรือกำหนดคีย์โดยตรง:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ตัวแปรสภาพแวดล้อม">
    ตั้งค่า env var ของผู้ให้บริการในสภาพแวดล้อม process ของ Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`
    ดู [Env vars](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์          | คำอธิบาย                                              |
| -------------------- | ------------------------------------------------------ |
| `query`              | คำค้นหา (จำเป็น)                                       |
| `count`              | จำนวนผลลัพธ์ที่จะส่งกลับ (1-10, ค่าเริ่มต้น: 5)        |
| `country`            | รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น "US", "DE")       |
| `language`           | รหัสภาษา ISO 639-1 (เช่น "en", "de")                   |
| `search_lang`        | รหัสภาษาสำหรับการค้นหา (Brave เท่านั้น)               |
| `freshness`          | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`        |
| `date_after`         | ผลลัพธ์หลังจากวันที่นี้ (YYYY-MM-DD)                   |
| `date_before`        | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                      |
| `ui_lang`            | รหัสภาษา UI (Brave เท่านั้น)                           |
| `domain_filter`      | อาร์เรย์ allowlist/denylist ของโดเมน (Perplexity เท่านั้น) |
| `max_tokens`         | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (Perplexity เท่านั้น) |
| `max_tokens_per_page`| ขีดจำกัดโทเค็นต่อหน้า ค่าเริ่มต้น 2048 (Perplexity เท่านั้น) |

<Warning>
  ไม่ใช่ทุกพารามิเตอร์ที่จะทำงานได้กับทุกผู้ให้บริการ โหมด `llm-context` ของ Brave
  จะปฏิเสธ `ui_lang`, `freshness`, `date_after` และ `date_before`
  Gemini, Grok และ Kimi จะส่งคืนคำตอบที่สังเคราะห์เพียงหนึ่งรายการพร้อมการอ้างอิง โดย
  รองรับ `count` เพื่อความเข้ากันได้กับเครื่องมือที่ใช้ร่วมกัน แต่จะไม่เปลี่ยน
  รูปร่างของคำตอบที่มีการ grounding
  Perplexity ก็มีพฤติกรรมเช่นเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้แบบ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` ได้เฉพาะกับโฮสต์ local loopback หรือเครือข่ายส่วนตัวที่เชื่อถือได้;
  endpoint SearXNG สาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ให้ใช้เครื่องมือเฉพาะของพวกมันสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ใช้ xAI ในการค้นหาโพสต์บน X (เดิมคือ Twitter) และส่งคืน
คำตอบที่สังเคราะห์ด้วย AI พร้อมการอ้างอิง รองรับคำค้นหาแบบภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างเพิ่มเติมตามต้องการ OpenClaw จะเปิดใช้เฉพาะเครื่องมือ `x_search`
ในตัวของ xAI ในคำขอที่ให้บริการการเรียกใช้เครื่องมือนี้เท่านั้น

<Note>
  xAI ระบุว่า `x_search` รองรับการค้นหาด้วยคีย์เวิร์ด การค้นหาเชิงความหมาย การค้นหาผู้ใช้
  และการดึงเธรด สำหรับสถิติการมีส่วนร่วมต่อโพสต์ เช่น reposts,
  replies, bookmarks หรือ views ให้ใช้การค้นหาแบบเจาะจงสำหรับ URL
  หรือ status ID ของโพสต์นั้นโดยตรง การค้นหาคีย์เวิร์ดแบบกว้างอาจพบโพสต์ที่ถูกต้อง
  แต่ส่งคืนเมทาดาทาต่อโพสต์ที่ไม่ครบถ้วนเท่าใดนัก รูปแบบที่ดีคือ: หาโพสต์ให้เจอก่อน แล้ว
  รันคำค้น `x_search` รอบที่สองโดยโฟกัสที่โพสต์นั้นโดยตรง
</Note>

### config ของ x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // ไม่บังคับหากตั้งค่า XAI_API_KEY ไว้แล้ว
          },
        },
      },
    },
  },
}
```

### พารามิเตอร์ของ x_search

| พารามิเตอร์                 | คำอธิบาย                                              |
| --------------------------- | ------------------------------------------------------ |
| `query`                     | คำค้นหา (จำเป็น)                                       |
| `allowed_x_handles`         | จำกัดผลลัพธ์ให้เฉพาะแฮนเดิล X ที่ระบุ                  |
| `excluded_x_handles`        | ตัดแฮนเดิล X ที่ระบุออก                                |
| `from_date`                 | รวมเฉพาะโพสต์ในหรือหลังวันที่นี้ (YYYY-MM-DD)         |
| `to_date`                   | รวมเฉพาะโพสต์ในหรือก่อนวันที่นี้ (YYYY-MM-DD)         |
| `enable_image_understanding`| ให้ xAI ตรวจสอบรูปภาพที่แนบมากับโพสต์ที่ตรงเงื่อนไข    |
| `enable_video_understanding`| ให้ xAI ตรวจสอบวิดีโอที่แนบมากับโพสต์ที่ตรงเงื่อนไข    |

### ตัวอย่าง x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// สถิติต่อโพสต์: ใช้ status URL หรือ status ID ที่ตรงกันเมื่อเป็นไปได้
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## ตัวอย่าง

```javascript
// การค้นหาพื้นฐาน
await web_search({ query: "OpenClaw plugin SDK" });

// การค้นหาเฉพาะเยอรมนี
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({ query: "AI developments", freshness: "week" });

// ช่วงวันที่
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// การกรองโดเมน (Perplexity เท่านั้น)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## โปรไฟล์เครื่องมือ

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlist ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // หรือ: allow: ["group:web"]  (รวม web_search, x_search และ web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Fetch](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับเว็บไซต์ที่พึ่งพา JS มาก
- [Grok Search](/th/tools/grok-search) -- ใช้ Grok เป็นผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
