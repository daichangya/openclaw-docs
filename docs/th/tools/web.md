---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า `web_search`
    - You want to enable or configure x_search
    - คุณต้องเลือกผู้ให้บริการค้นหา
    - คุณต้องการเข้าใจการตรวจจับอัตโนมัติและ fallback ของผู้ให้บริการ
sidebarTitle: Web Search
summary: '`web_search`, `x_search` และ `web_fetch` -- ค้นหาเว็บ ค้นหาโพสต์บน X หรือดึงเนื้อหาหน้าเว็บ'
title: การค้นหาเว็บ
x-i18n:
    generated_at: "2026-04-23T06:04:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# การค้นหาเว็บ

เครื่องมือ `web_search` ใช้ค้นหาเว็บผ่านผู้ให้บริการที่คุณกำหนดค่าไว้และ
ส่งคืนผลลัพธ์ ผลลัพธ์จะถูกแคชตาม query เป็นเวลา 15 นาที (ปรับแต่งได้)

OpenClaw ยังมี `x_search` สำหรับโพสต์บน X (เดิมคือ Twitter) และ
`web_fetch` สำหรับการดึง URL แบบเบา ในเฟสนี้ `web_fetch` ยังคง
ทำงานแบบ local ขณะที่ `web_search` และ `x_search` สามารถใช้ xAI Responses อยู่เบื้องหลังได้

<Info>
  `web_search` เป็นเครื่องมือ HTTP แบบเบา ไม่ใช่ browser automation สำหรับ
  เว็บไซต์ที่ใช้ JS หนักหรือมีการล็อกอิน ให้ใช้ [Web Browser](/th/tools/browser) สำหรับ
  การดึง URL เฉพาะ ให้ใช้ [Web Fetch](/th/tools/web-fetch)
</Info>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    เลือกผู้ให้บริการและทำการตั้งค่าที่จำเป็นให้เสร็จ ผู้ให้บริการบางราย
    ไม่ต้องใช้คีย์ ขณะที่บางรายใช้ API keys ดูหน้าผู้ให้บริการด้านล่างสำหรับ
    รายละเอียด
  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    ```
    คำสั่งนี้จะจัดเก็บผู้ให้บริการและ credential ที่จำเป็น คุณยังสามารถตั้ง env
    var (เช่น `BRAVE_API_KEY`) และข้ามขั้นตอนนี้สำหรับผู้ให้บริการที่ใช้
    API ได้
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
    ผลลัพธ์แบบมีโครงสร้างพร้อม snippets รองรับโหมด `llm-context`, ตัวกรองประเทศ/ภาษา มี free tier
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/th/tools/duckduckgo-search">
    fallback แบบไม่ใช้คีย์ ไม่ต้องใช้ API key เป็นการเชื่อมต่อแบบ HTML ที่ไม่เป็นทางการ
  </Card>
  <Card title="Exa" icon="brain" href="/th/tools/exa-search">
    การค้นหาแบบ neural + keyword พร้อมการดึงเนื้อหา (highlights, text, summaries)
  </Card>
  <Card title="Firecrawl" icon="flame" href="/th/tools/firecrawl">
    ผลลัพธ์แบบมีโครงสร้าง เหมาะที่สุดเมื่อใช้คู่กับ `firecrawl_search` และ `firecrawl_scrape` สำหรับการดึงข้อมูลเชิงลึก
  </Card>
  <Card title="Gemini" icon="sparkles" href="/th/tools/gemini-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน Google Search grounding
  </Card>
  <Card title="Grok" icon="zap" href="/th/tools/grok-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน xAI web grounding
  </Card>
  <Card title="Kimi" icon="moon" href="/th/tools/kimi-search">
    คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงผ่าน Moonshot web search
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/th/tools/minimax-search">
    ผลลัพธ์แบบมีโครงสร้างผ่าน MiniMax Coding Plan search API
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/th/tools/ollama-search">
    การค้นหาแบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ที่กำหนดค่าไว้ ต้องใช้ `ollama signin`
  </Card>
  <Card title="Perplexity" icon="search" href="/th/tools/perplexity-search">
    ผลลัพธ์แบบมีโครงสร้างพร้อมตัวควบคุมการดึงเนื้อหาและการกรองโดเมน
  </Card>
  <Card title="SearXNG" icon="server" href="/th/tools/searxng-search">
    meta-search แบบ self-hosted ไม่ต้องใช้ API key รวบรวมผลจาก Google, Bing, DuckDuckGo และอื่นๆ
  </Card>
  <Card title="Tavily" icon="globe" href="/th/tools/tavily">
    ผลลัพธ์แบบมีโครงสร้างพร้อม search depth, topic filtering และ `tavily_extract` สำหรับการดึง URL
  </Card>
</CardGroup>

### การเปรียบเทียบผู้ให้บริการ

| ผู้ให้บริการ                                  | รูปแบบผลลัพธ์               | ตัวกรอง                                          | API key                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/th/tools/brave-search)              | snippets แบบมีโครงสร้าง        | ประเทศ, ภาษา, เวลา, โหมด `llm-context`      | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/th/tools/duckduckgo-search)    | snippets แบบมีโครงสร้าง        | --                                               | ไม่มี (ไม่ใช้คีย์)                                                                  |
| [Exa](/th/tools/exa-search)                  | มีโครงสร้าง + ดึงเนื้อหา     | โหมด neural/keyword, วันที่, การดึงเนื้อหา    | `EXA_API_KEY`                                                                    |
| [Firecrawl](/th/tools/firecrawl)             | snippets แบบมีโครงสร้าง        | ผ่านเครื่องมือ `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/th/tools/gemini-search)            | สังเคราะห์โดย AI + การอ้างอิง | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/th/tools/grok-search)                | สังเคราะห์โดย AI + การอ้างอิง | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/th/tools/kimi-search)                | สังเคราะห์โดย AI + การอ้างอิง | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/th/tools/minimax-search)   | snippets แบบมีโครงสร้าง        | ภูมิภาค (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/th/tools/ollama-search) | snippets แบบมีโครงสร้าง        | --                                               | ไม่มีโดยค่าเริ่มต้น; ต้องใช้ `ollama signin`, และสามารถใช้ Ollama provider bearer auth ซ้ำได้หากโฮสต์ต้องใช้ |
| [Perplexity](/th/tools/perplexity-search)    | snippets แบบมีโครงสร้าง        | ประเทศ, ภาษา, เวลา, โดเมน, ขีดจำกัดเนื้อหา | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/th/tools/searxng-search)          | snippets แบบมีโครงสร้าง        | หมวดหมู่, ภาษา                             | ไม่มี (self-hosted)                                                               |
| [Tavily](/th/tools/tavily)                   | snippets แบบมีโครงสร้าง        | ผ่านเครื่องมือ `tavily_search`                         | `TAVILY_API_KEY`                                                                 |

## การตรวจจับอัตโนมัติ

## Native OpenAI web search

โมเดล Responses แบบ direct ของ OpenAI จะใช้เครื่องมือ `web_search` แบบโฮสต์ของ OpenAI โดยอัตโนมัติ เมื่อเปิดใช้งาน OpenClaw web search และไม่มีการ pin ผู้ให้บริการที่มีการจัดการไว้ นี่เป็นพฤติกรรมที่ผู้ให้บริการเป็นเจ้าของใน OpenAI plugin ที่บันเดิลมา และใช้เฉพาะกับทราฟฟิก native OpenAI API เท่านั้น ไม่ใช้กับ OpenAI-compatible proxy base URLs หรือ Azure routes ตั้ง `tools.web.search.provider` เป็นผู้ให้บริการอื่น เช่น `brave` หากคุณต้องการคงเครื่องมือ `web_search` แบบมีการจัดการไว้สำหรับโมเดล OpenAI หรือกำหนด `tools.web.search.enabled: false` เพื่อปิดทั้ง managed search และ native OpenAI search

## Native Codex web search

โมเดลที่รองรับ Codex สามารถเลือกใช้เครื่องมือ `web_search` แบบ Responses ที่เป็น native ของผู้ให้บริการ แทนฟังก์ชัน `web_search` แบบมีการจัดการของ OpenClaw ได้

- กำหนดค่าที่ `tools.web.search.openaiCodex`
- จะเปิดใช้งานเฉพาะสำหรับโมเดลที่รองรับ Codex (`openai-codex/*` หรือผู้ให้บริการที่ใช้ `api: "openai-codex-responses"`)
- `web_search` แบบมีการจัดการยังคงใช้กับโมเดลที่ไม่ใช่ Codex
- `mode: "cached"` เป็นค่าตั้งต้นและเป็นค่าที่แนะนำ
- `tools.web.search.enabled: false` จะปิดทั้ง managed และ native search

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

หากเปิด native Codex search อยู่ แต่โมเดลปัจจุบันไม่รองรับ Codex OpenClaw จะคงพฤติกรรม `web_search` แบบมีการจัดการตามปกติไว้

## การตั้งค่า web search

รายการผู้ให้บริการในเอกสารและ flow การตั้งค่าจะเรียงตามตัวอักษร การตรวจจับอัตโนมัติใช้
ลำดับความสำคัญอีกชุดหนึ่งต่างหาก

หากไม่ได้ตั้ง `provider` OpenClaw จะตรวจสอบผู้ให้บริการตามลำดับนี้และใช้
ตัวแรกที่พร้อมใช้งาน:

เริ่มจากผู้ให้บริการที่ใช้ API ก่อน:

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
11. **Ollama Web Search** -- fallback แบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ที่กำหนดค่าไว้; ต้องเข้าถึง Ollama ได้และล็อกอินด้วย `ollama signin` และสามารถใช้ Ollama provider bearer auth ซ้ำได้หากโฮสต์ต้องใช้ (ลำดับ 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ลำดับ 200)

หากตรวจไม่พบผู้ให้บริการใดเลย ระบบจะ fallback ไปที่ Brave (คุณจะได้รับข้อผิดพลาด
เรื่องคีย์หายไปเพื่อให้ไปกำหนดค่า)

<Note>
  ฟิลด์คีย์ของผู้ให้บริการทุกตัวรองรับออบเจ็กต์ SecretRef ฟิลด์ SecretRef
  ระดับ Plugin ภายใต้ `plugins.entries.<plugin>.config.webSearch.apiKey` จะถูก resolve สำหรับ
  ผู้ให้บริการ Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity และ Tavily ที่บันเดิลมา
  ไม่ว่าผู้ให้บริการจะถูกเลือกแบบ explicit ผ่าน `tools.web.search.provider` หรือ
  ถูกเลือกผ่าน auto-detect
  ในโหมด auto-detect OpenClaw จะ resolve เฉพาะคีย์ของผู้ให้บริการที่ถูกเลือกเท่านั้น --
  SecretRefs ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะยังคงไม่ทำงาน ดังนั้นคุณจึง
  สามารถเก็บคอนฟิกผู้ให้บริการหลายรายไว้ได้โดยไม่ต้องเสียต้นทุนการ resolve สำหรับ
  ตัวที่คุณไม่ได้ใช้
</Note>

## คอนฟิก

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

คอนฟิกเฉพาะผู้ให้บริการ (API keys, base URLs, modes) อยู่ภายใต้
`plugins.entries.<plugin>.config.webSearch.*` ดูหน้าของผู้ให้บริการ
สำหรับตัวอย่าง

การเลือกผู้ให้บริการ fallback ของ `web_fetch` แยกออกมาต่างหาก:

- เลือกได้ด้วย `tools.web.fetch.provider`
- หรือปล่อยฟิลด์นั้นว่างไว้ แล้วให้ OpenClaw auto-detect ผู้ให้บริการ web-fetch ตัวแรกที่พร้อมใช้งานจาก credentials ที่มี
- ปัจจุบันผู้ให้บริการ web-fetch ที่บันเดิลมาคือ Firecrawl ซึ่งกำหนดค่าอยู่ภายใต้
  `plugins.entries.firecrawl.config.webFetch.*`

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web`, OpenClaw ยังสามารถถามเพิ่มเติมเกี่ยวกับ:

- ภูมิภาคของ Moonshot API (`https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`)
- โมเดลเริ่มต้นของ Kimi web-search (ค่าเริ่มต้นคือ `kimi-k2.6`)

สำหรับ `x_search` ให้กำหนดค่าที่ `plugins.entries.xai.config.xSearch.*` มันใช้
fallback `XAI_API_KEY` เดียวกันกับ Grok web search
คอนฟิกแบบเดิม `tools.web.x_search.*` จะถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`
เมื่อคุณเลือก Grok ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`,
OpenClaw ยังสามารถเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วยคีย์ตัวเดียวกัน
นี่เป็นขั้นตอนติดตามผลแยกภายในเส้นทางของ Grok ไม่ใช่ตัวเลือกผู้ให้บริการ
web-search ระดับบนสุดแยกต่างหาก หากคุณเลือกผู้ให้บริการรายอื่น OpenClaw จะไม่
แสดงพรอมป์ต์ `x_search`

### การจัดเก็บ API keys

<Tabs>
  <Tab title="ไฟล์คอนฟิก">
    รัน `openclaw configure --section web` หรือตั้งค่าคีย์โดยตรง:

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
    ตั้ง env var ของผู้ให้บริการในสภาพแวดล้อมของโปรเซส Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`
    ดู [Env vars](/th/help/faq#env-vars-and-env-loading)

  </Tab>
</Tabs>

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์             | คำอธิบาย                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | คำค้นหา (จำเป็น)                               |
| `count`               | จำนวนผลลัพธ์ที่จะคืน (1-10, ค่าเริ่มต้น: 5)                  |
| `country`             | รหัสประเทศ ISO 2 ตัวอักษร (เช่น "US", "DE")           |
| `language`            | รหัสภาษา ISO 639-1 (เช่น "en", "de")             |
| `search_lang`         | รหัสภาษาของการค้นหา (เฉพาะ Brave)                     |
| `freshness`           | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`        |
| `date_after`          | ผลลัพธ์หลังวันที่นี้ (YYYY-MM-DD)                  |
| `date_before`         | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                 |
| `ui_lang`             | รหัสภาษา UI (เฉพาะ Brave)                         |
| `domain_filter`       | อาร์เรย์ allowlist/denylist ของโดเมน (เฉพาะ Perplexity)     |
| `max_tokens`          | งบประมาณเนื้อหารวม ค่าเริ่มต้น 25000 (เฉพาะ Perplexity) |
| `max_tokens_per_page` | ขีดจำกัดโทเค็นต่อหน้า ค่าเริ่มต้น 2048 (เฉพาะ Perplexity)  |

<Warning>
  ไม่ใช่ทุกพารามิเตอร์ที่ใช้ได้กับทุกผู้ให้บริการ โหมด `llm-context` ของ Brave
  จะปฏิเสธ `ui_lang`, `freshness`, `date_after` และ `date_before`
  Gemini, Grok และ Kimi จะคืนคำตอบที่สังเคราะห์หนึ่งคำตอบพร้อมการอ้างอิง พวกมัน
  ยอมรับ `count` เพื่อความเข้ากันได้ของเครื่องมือแบบใช้ร่วมกัน แต่ไม่ได้เปลี่ยน
  รูปทรงของคำตอบแบบ grounded
  Perplexity จะมีพฤติกรรมแบบเดียวกันเมื่อคุณใช้เส้นทางความเข้ากันได้แบบ Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` หรือ `OPENROUTER_API_KEY`)
  SearXNG ยอมรับ `http://` ได้เฉพาะกับโฮสต์ที่เชื่อถือได้ในเครือข่ายส่วนตัวหรือ loopback;
  endpoints ของ SearXNG แบบสาธารณะต้องใช้ `https://`
  Firecrawl และ Tavily รองรับเฉพาะ `query` และ `count` ผ่าน `web_search`
  -- ใช้เครื่องมือเฉพาะของพวกมันสำหรับตัวเลือกขั้นสูง
</Warning>

## x_search

`x_search` ใช้ xAI ในการค้นหาโพสต์บน X (เดิมคือ Twitter) และคืน
คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิง มันรับทั้งคำค้นแบบภาษาธรรมชาติและ
ตัวกรองแบบมีโครงสร้างได้แบบไม่บังคับ OpenClaw จะเปิดใช้เครื่องมือ `x_search`
ของ xAI ที่มีมาในตัวเฉพาะในคำขอที่ให้บริการการเรียกใช้เครื่องมือนี้

<Note>
  เอกสารของ xAI ระบุว่า `x_search` รองรับ keyword search, semantic search, user
  search และ thread fetch สำหรับสถิติ engagement แบบรายโพสต์ เช่น reposts,
  replies, bookmarks หรือ views ให้เลือกการค้นหาแบบเจาะจงไปยัง URL ของโพสต์นั้น
  หรือ status ID โดยตรง การค้นหาคำกว้างๆ อาจเจอโพสต์ที่ถูกต้อง แต่คืน metadata
  ต่อโพสต์มาไม่ครบเท่าที่ควร รูปแบบที่ดีคือ: หาโพสต์ให้เจอก่อน แล้วค่อย
  รันคำขอ `x_search` รอบที่สองโดยโฟกัสที่โพสต์นั้นโดยตรง
</Note>

### คอนฟิก x_search

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### พารามิเตอร์ของ x_search

| พารามิเตอร์                    | คำอธิบาย                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | คำค้นหา (จำเป็น)                                |
| `allowed_x_handles`          | จำกัดผลลัพธ์ให้อยู่ใน X handles ที่ระบุ                 |
| `excluded_x_handles`         | ยกเว้น X handles ที่ระบุ                             |
| `from_date`                  | รวมเฉพาะโพสต์ตั้งแต่วันที่นี้เป็นต้นไป (YYYY-MM-DD)  |
| `to_date`                    | รวมเฉพาะโพสต์ถึงหรือก่อนวันที่นี้ (YYYY-MM-DD) |
| `enable_image_understanding` | ให้ xAI วิเคราะห์ภาพที่แนบมากับโพสต์ที่ตรงเงื่อนไข      |
| `enable_video_understanding` | ให้ xAI วิเคราะห์วิดีโอที่แนบมากับโพสต์ที่ตรงเงื่อนไข      |

### ตัวอย่าง x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// สถิติรายโพสต์: ใช้ status URL หรือ status ID แบบตรงตัวเมื่อทำได้
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## ตัวอย่าง

```javascript
// การค้นหาแบบพื้นฐาน
await web_search({ query: "OpenClaw plugin SDK" });

// การค้นหาแบบเฉพาะเยอรมนี
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({ query: "AI developments", freshness: "week" });

// ช่วงวันที่
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// การกรองโดเมน (เฉพาะ Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Tool profiles

หากคุณใช้ tool profiles หรือ allowlists ให้เพิ่ม `web_search`, `x_search` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Fetch](/th/tools/web-fetch) -- ดึง URL และแยกเนื้อหาที่อ่านได้
- [Web Browser](/th/tools/browser) -- browser automation แบบเต็มสำหรับเว็บไซต์ที่ใช้ JS หนัก
- [Grok Search](/th/tools/grok-search) -- Grok ในฐานะผู้ให้บริการ `web_search`
- [Ollama Web Search](/th/tools/ollama-search) -- การค้นหาเว็บแบบไม่ใช้คีย์ผ่านโฮสต์ Ollama ของคุณ
