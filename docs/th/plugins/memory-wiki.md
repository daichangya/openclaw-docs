---
read_when:
    - คุณต้องการความรู้แบบคงอยู่ที่มากกว่าโน้ตธรรมดาใน `MEMORY.md`
    - คุณกำลังกำหนดค่า Plugin memory-wiki ที่มาพร้อมกัน
    - คุณต้องการทำความเข้าใจ `wiki_search`, `wiki_get` หรือโหมดบริดจ์
summary: 'memory-wiki: คลังความรู้ที่คอมไพล์แล้วพร้อมแหล่งที่มา ข้ออ้างอิง แดชบอร์ด และโหมดบริดจ์'
title: วิกิหน่วยความจำ
x-i18n:
    generated_at: "2026-04-24T09:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` เป็น Plugin ที่มาพร้อมกันซึ่งเปลี่ยน durable memory ให้กลายเป็นคลังความรู้ที่คอมไพล์แล้ว

มัน **ไม่ได้** มาแทนที่ Plugin Active Memory โดย Plugin Active Memory ยังคงเป็นเจ้าของงานด้าน recall, promotion, indexing และ Dreaming ส่วน `memory-wiki` จะทำงานควบคู่กัน และคอมไพล์ความรู้ถาวรให้อยู่ในรูปแบบวิกิที่นำทางได้ พร้อมหน้าที่มีโครงสร้างแน่นอน ข้ออ้างอิงแบบมีโครงสร้าง แหล่งที่มา แดชบอร์ด และ digest ที่เครื่องอ่านได้

ใช้มันเมื่อคุณต้องการให้ memory มีลักษณะเหมือนชั้นความรู้ที่ได้รับการดูแล มากกว่าจะเป็นกองไฟล์ Markdown

## สิ่งที่เพิ่มเข้ามา

- คลังวิกิเฉพาะที่มีเลย์เอาต์หน้าแบบกำหนดแน่นอน
- เมทาดาทาของข้ออ้างอิงและหลักฐานแบบมีโครงสร้าง ไม่ใช่แค่ข้อความบรรยาย
- แหล่งที่มา ความเชื่อมั่น ความขัดแย้ง และคำถามเปิดในระดับหน้า
- digest ที่คอมไพล์แล้วสำหรับผู้ใช้ฝั่ง agent/runtime
- เครื่องมือค้นหา/ดึงข้อมูล/apply/lint แบบ native ของวิกิ
- โหมดบริดจ์แบบทางเลือกที่นำเข้าอาร์ติแฟกต์สาธารณะจาก Plugin Active Memory
- โหมดเรนเดอร์ที่เป็นมิตรกับ Obsidian และการผสานรวม CLI แบบทางเลือก

## การทำงานร่วมกับ memory

ให้มองการแยกชั้นแบบนี้:

| ชั้น                                                    | เป็นเจ้าของ                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Plugin Active Memory (`memory-core`, QMD, Honcho ฯลฯ)   | Recall, semantic search, promotion, Dreaming, runtime ของ memory                             |
| `memory-wiki`                                           | หน้าวิกิที่คอมไพล์แล้ว, บทสังเคราะห์ที่มีแหล่งที่มาเข้มข้น, แดชบอร์ด, search/get/apply เฉพาะวิกิ |

หาก Plugin Active Memory เปิดเผยอาร์ติแฟกต์ recall ที่ใช้ร่วมกัน OpenClaw จะสามารถค้นหาทั้งสองชั้นได้ในรอบเดียวด้วย `memory_search corpus=all`

เมื่อคุณต้องการการจัดอันดับเฉพาะวิกิ แหล่งที่มา หรือการเข้าถึงหน้าโดยตรง ให้ใช้เครื่องมือแบบ native ของวิกิแทน

## รูปแบบไฮบริดที่แนะนำ

ค่าเริ่มต้นที่แข็งแรงสำหรับการตั้งค่าแบบ local-first คือ:

- QMD เป็นแบ็กเอนด์ Active Memory สำหรับ recall และ semantic search แบบกว้าง
- `memory-wiki` ในโหมด `bridge` สำหรับหน้าความรู้สังเคราะห์แบบถาวร

การแยกแบบนี้ทำงานได้ดีเพราะแต่ละชั้นยังคงโฟกัสกับหน้าที่ของตัวเอง:

- QMD ทำให้โน้ตดิบ การส่งออก session และคอลเลกชันเพิ่มเติมค้นหาได้
- `memory-wiki` คอมไพล์เอนทิตีที่เสถียร ข้ออ้างอิง แดชบอร์ด และหน้าต้นทาง

กฎเชิงปฏิบัติ:

- ใช้ `memory_search` เมื่อต้องการ recall แบบกว้างครั้งเดียวครอบคลุม memory
- ใช้ `wiki_search` และ `wiki_get` เมื่อต้องการผลลัพธ์วิกิที่คำนึงถึงแหล่งที่มา
- ใช้ `memory_search corpus=all` เมื่อต้องการให้การค้นหาร่วมครอบคลุมทั้งสองชั้น

หากโหมดบริดจ์รายงานว่าไม่มี exported artifacts เลย แสดงว่า Plugin Active Memory ยังไม่ได้เปิดเผย public bridge inputs อยู่ในขณะนี้ ให้รัน `openclaw wiki doctor` ก่อน แล้วตรวจสอบว่า Plugin Active Memory รองรับ public artifacts

## โหมดของคลัง

`memory-wiki` รองรับโหมดคลัง 3 แบบ:

### `isolated`

คลังของตัวเอง แหล่งข้อมูลของตัวเอง ไม่ขึ้นกับ `memory-core`

ใช้เมื่อคุณต้องการให้วิกิเป็นคลังความรู้ที่คัดสรรเองโดยอิสระ

### `bridge`

อ่าน public memory artifacts และ memory events จาก Plugin Active Memory ผ่าน public plugin SDK seams

ใช้เมื่อคุณต้องการให้วิกิคอมไพล์และจัดระเบียบอาร์ติแฟกต์ที่ Plugin Memory ส่งออก โดยไม่ต้องเข้าถึงส่วนภายในส่วนตัวของ Plugin

โหมดบริดจ์สามารถทำดัชนีได้กับ:

- exported memory artifacts
- dream reports
- daily notes
- ไฟล์รากของ memory
- memory event logs

### `unsafe-local`

ช่องทางหลบเลี่ยงแบบ explicit สำหรับพาธส่วนตัวบนเครื่องเดียวกัน

โหมดนี้เป็นแบบทดลองอย่างจงใจและไม่สามารถพกพาได้ ใช้ก็ต่อเมื่อคุณเข้าใจ trust boundary และต้องการเข้าถึงไฟล์ระบบในเครื่องโดยเฉพาะ ซึ่งโหมดบริดจ์ไม่สามารถให้ได้

## เลย์เอาต์ของคลัง

Plugin จะเริ่มต้นคลังแบบนี้:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

เนื้อหาที่ถูกจัดการจะอยู่ภายในบล็อกที่สร้างขึ้น บล็อกโน้ตที่มนุษย์เขียนจะถูกเก็บไว้

กลุ่มหน้าหลักคือ:

- `sources/` สำหรับวัตถุดิบที่นำเข้าและหน้าที่รองรับโดยบริดจ์
- `entities/` สำหรับสิ่ง บุคคล ระบบ โปรเจกต์ และวัตถุที่คงอยู่
- `concepts/` สำหรับแนวคิด สิ่งนามธรรม รูปแบบ และนโยบาย
- `syntheses/` สำหรับสรุปที่คอมไพล์แล้วและ rollup ที่ได้รับการดูแล
- `reports/` สำหรับแดชบอร์ดที่สร้างขึ้น

## ข้ออ้างอิงและหลักฐานแบบมีโครงสร้าง

หน้าสามารถมี frontmatter `claims` แบบมีโครงสร้างได้ ไม่ใช่แค่ข้อความอิสระ

แต่ละ claim อาจมี:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

รายการหลักฐานอาจมี:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

นี่คือสิ่งที่ทำให้วิกิทำงานเหมือน belief layer มากกว่าคลังโน้ตแบบนิ่ง ๆ โดยสามารถติดตาม ให้คะแนน โต้แย้ง และคลี่คลาย claim กลับไปยังแหล่งข้อมูลได้

## ไปป์ไลน์การคอมไพล์

ขั้นตอนคอมไพล์จะอ่านหน้าวิกิ ปรับสรุปให้อยู่ในรูปแบบมาตรฐาน และสร้างอาร์ติแฟกต์ฝั่งเครื่องที่เสถียรไว้ที่:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

digest เหล่านี้มีไว้เพื่อให้ agent และโค้ด runtime ไม่ต้องไป scrape จากหน้า Markdown

ผลลัพธ์ที่คอมไพล์แล้วยังรองรับ:

- การทำดัชนีวิกิรอบแรกสำหรับ flow แบบ search/get
- การ lookup claim-id กลับไปยังหน้าที่เป็นเจ้าของ
- prompt supplement แบบกะทัดรัด
- การสร้างรายงาน/แดชบอร์ด

## แดชบอร์ดและรายงานสุขภาพ

เมื่อเปิดใช้ `render.createDashboards` การคอมไพล์จะดูแลแดชบอร์ดภายใต้ `reports/`

รายงานในตัวประกอบด้วย:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

รายงานเหล่านี้ติดตามสิ่งต่าง ๆ เช่น:

- กลุ่มโน้ตความขัดแย้ง
- กลุ่ม claim ที่แข่งขันกัน
- claim ที่ไม่มีหลักฐานแบบมีโครงสร้าง
- หน้าและ claim ที่มีความเชื่อมั่นต่ำ
- ความใหม่ที่ล้าสมัยหรือไม่ทราบ
- หน้าที่มีคำถามที่ยังไม่ได้คลี่คลาย

## การค้นหาและการดึงข้อมูล

`memory-wiki` รองรับแบ็กเอนด์การค้นหา 2 แบบ:

- `shared`: ใช้ flow การค้นหา memory แบบใช้ร่วมกันเมื่อมีให้ใช้
- `local`: ค้นหาวิกิในเครื่อง

นอกจากนี้ยังรองรับ corpus 3 แบบ:

- `wiki`
- `memory`
- `all`

พฤติกรรมสำคัญ:

- `wiki_search` และ `wiki_get` ใช้ digest ที่คอมไพล์แล้วเป็นรอบแรกเมื่อทำได้
- claim id สามารถ resolve กลับไปยังหน้าที่เป็นเจ้าของได้
- claim ที่ contested/stale/fresh มีผลต่อการจัดอันดับ
- ป้ายกำกับแหล่งที่มาอาจคงอยู่ในผลลัพธ์

กฎเชิงปฏิบัติ:

- ใช้ `memory_search corpus=all` สำหรับ recall แบบกว้างครั้งเดียว
- ใช้ `wiki_search` + `wiki_get` เมื่อคุณสนใจการจัดอันดับเฉพาะวิกิ แหล่งที่มา หรือโครงสร้าง belief ในระดับหน้า

## เครื่องมือของ agent

Plugin นี้ลงทะเบียนเครื่องมือเหล่านี้:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

สิ่งที่เครื่องมือเหล่านี้ทำ:

- `wiki_status`: โหมดคลังปัจจุบัน สถานะสุขภาพ ความพร้อมใช้งานของ Obsidian CLI
- `wiki_search`: ค้นหาหน้าวิกิ และเมื่อกำหนดค่าไว้ ก็สามารถค้นหา corpus memory แบบใช้ร่วมกันได้
- `wiki_get`: อ่านหน้าวิกิตาม id/path หรือ fallback ไปยัง shared memory corpus
- `wiki_apply`: ปรับเปลี่ยนบทสังเคราะห์/เมทาดาทาแบบเฉพาะจุด โดยไม่ผ่าตัดหน้าแบบอิสระ
- `wiki_lint`: ตรวจสอบโครงสร้าง ช่องว่างของแหล่งที่มา ความขัดแย้ง คำถามเปิด

Plugin นี้ยังลงทะเบียน memory corpus supplement แบบไม่ผูกขาดด้วย ทำให้ `memory_search` และ `memory_get` แบบใช้ร่วมกันเข้าถึงวิกิได้ เมื่อ Plugin Active Memory รองรับการเลือก corpus

## พฤติกรรมของ prompt และ context

เมื่อเปิดใช้ `context.includeCompiledDigestPrompt` ส่วน prompt ของ memory จะต่อท้าย snapshot แบบกะทัดรัดที่คอมไพล์แล้วจาก `agent-digest.json`

snapshot นี้จงใจทำให้เล็กและมีสัญญาณสูง:

- เฉพาะหน้าบนสุด
- เฉพาะ claim บนสุด
- จำนวนความขัดแย้ง
- จำนวนคำถาม
- ตัวบ่งชี้ความเชื่อมั่น/ความใหม่

นี่เป็นแบบ opt-in เพราะมันเปลี่ยนรูปร่างของ prompt และมีประโยชน์หลัก ๆ สำหรับ context engine หรือการประกอบ prompt แบบเดิมที่ใช้ memory supplements อย่างชัดเจน

## การกำหนดค่า

ใส่ config ไว้ใต้ `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

สวิตช์สำคัญ:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` หรือ `obsidian`
- `bridge.readMemoryArtifacts`: นำเข้า public artifacts ของ Plugin Active Memory
- `bridge.followMemoryEvents`: รวม event logs ในโหมดบริดจ์
- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `context.includeCompiledDigestPrompt`: ต่อท้าย snapshot ของ digest แบบกะทัดรัดในส่วน prompt ของ memory
- `render.createBacklinks`: สร้างบล็อกที่เกี่ยวข้องแบบกำหนดแน่นอน
- `render.createDashboards`: สร้างหน้าแดชบอร์ด

### ตัวอย่าง: QMD + โหมด bridge

ใช้เมื่อต้องการให้ QMD ดูแล recall และให้ `memory-wiki` เป็นชั้นความรู้ที่ได้รับการดูแล:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

การตั้งค่านี้ทำให้:

- QMD รับผิดชอบ Active Memory recall
- `memory-wiki` โฟกัสกับหน้าที่คอมไพล์แล้วและแดชบอร์ด
- รูปร่างของ prompt ไม่เปลี่ยนจนกว่าคุณจะเปิดใช้ compiled digest prompts โดยตั้งใจ

## CLI

`memory-wiki` ยังเปิดเผยพื้นผิว CLI ระดับบนสุดด้วย:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

ดู [CLI: wiki](/th/cli/wiki) สำหรับข้อมูลอ้างอิงคำสั่งทั้งหมด

## การรองรับ Obsidian

เมื่อ `vault.renderMode` เป็น `obsidian` Plugin จะเขียน Markdown ที่เป็นมิตรกับ Obsidian และสามารถใช้ `obsidian` CLI อย่างเป็นทางการได้แบบทางเลือก

เวิร์กโฟลว์ที่รองรับมีดังนี้:

- ตรวจสอบสถานะ
- ค้นหาในคลัง
- เปิดหน้า
- เรียกใช้คำสั่งของ Obsidian
- กระโดดไปยัง daily note

นี่เป็นทางเลือก วิกิยังคงทำงานได้ในโหมด native โดยไม่ต้องใช้ Obsidian

## เวิร์กโฟลว์ที่แนะนำ

1. คง Plugin Active Memory ไว้สำหรับ recall/promotion/Dreaming
2. เปิดใช้ `memory-wiki`
3. เริ่มจากโหมด `isolated` เว้นแต่คุณต้องการโหมดบริดจ์อย่างชัดเจน
4. ใช้ `wiki_search` / `wiki_get` เมื่อแหล่งที่มามีความสำคัญ
5. ใช้ `wiki_apply` สำหรับบทสังเคราะห์แบบเฉพาะจุดหรือการอัปเดตเมทาดาทา
6. รัน `wiki_lint` หลังจากการเปลี่ยนแปลงที่สำคัญ
7. เปิดใช้แดชบอร์ดหากคุณต้องการมองเห็นความล้าสมัย/ความขัดแย้ง

## เอกสารที่เกี่ยวข้อง

- [ภาพรวม Memory](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)
- [CLI: wiki](/th/cli/wiki)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
