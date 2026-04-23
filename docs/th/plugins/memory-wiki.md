---
read_when:
    - คุณต้องการความรู้แบบคงทนที่มากกว่าบันทึกธรรมดาใน `MEMORY.md`
    - คุณกำลังกำหนดค่า Plugin memory-wiki ที่มาพร้อมกัน】【”】【assistant to=final
    - คุณต้องการเข้าใจ `wiki_search`, `wiki_get` หรือ bridge mode
summary: 'memory-wiki: คลังความรู้ที่คอมไพล์แล้วพร้อม provenance, claims, dashboard และ bridge mode'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-23T05:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` เป็น Plugin ที่มาพร้อมกัน ซึ่งเปลี่ยนหน่วยความจำแบบคงทนให้กลายเป็น
คลังความรู้ที่คอมไพล์แล้ว

มัน **ไม่ได้** มาแทนที่ memory plugin ที่ใช้งานอยู่ memory plugin ที่ใช้งานอยู่ยังคง
รับผิดชอบ recall, promotion, indexing และ Dreaming ส่วน `memory-wiki` จะวางอยู่ข้างกัน
และคอมไพล์ความรู้ที่คงทนให้กลายเป็นวิกิที่นำทางได้ พร้อมหน้าที่กำหนดแน่นอน,
claims แบบมีโครงสร้าง, provenance, dashboard และ digest ที่เครื่องอ่านได้

ใช้มันเมื่อคุณต้องการให้หน่วยความจำทำงานคล้ายชั้นความรู้ที่ได้รับการดูแลรักษา
มากกว่าการเป็นกองไฟล์ Markdown

## สิ่งที่มันเพิ่มเข้ามา

- คลังวิกิโดยเฉพาะพร้อม layout ของหน้าที่กำหนดแน่นอน
- metadata ของ claim และ evidence แบบมีโครงสร้าง ไม่ใช่แค่ prose
- provenance, confidence, contradictions และ open questions ในระดับหน้า
- digest ที่คอมไพล์แล้วสำหรับผู้ใช้เอเจนต์/รันไทม์
- tools แบบวิกิโดยตรงสำหรับ search/get/apply/lint
- bridge mode แบบไม่บังคับที่นำเข้าอาร์ติแฟกต์สาธารณะจาก memory plugin ที่ใช้งานอยู่
- render mode ที่เป็นมิตรกับ Obsidian และ CLI integration แบบไม่บังคับ

## การทำงานร่วมกับ memory

ให้มองการแบ่งหน้าที่แบบนี้:

| Layer                                                   | รับผิดชอบ                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| memory plugin ที่ใช้งานอยู่ (`memory-core`, QMD, Honcho ฯลฯ) | Recall, semantic search, promotion, Dreaming, memory runtime                              |
| `memory-wiki`                                           | หน้าวิกิที่คอมไพล์แล้ว, การสังเคราะห์ที่มี provenance สูง, dashboard, search/get/apply แบบเฉพาะวิกิ |

หาก memory plugin ที่ใช้งานอยู่เปิดเผยอาร์ติแฟกต์สำหรับ recall แบบใช้ร่วมกัน OpenClaw สามารถค้นหา
ทั้งสองชั้นได้ในรอบเดียวด้วย `memory_search corpus=all`

เมื่อคุณต้องการการจัดอันดับแบบเฉพาะวิกิ provenance หรือการเข้าถึงหน้าโดยตรง ให้ใช้
tools แบบวิกิโดยตรงแทน

## รูปแบบ hybrid ที่แนะนำ

ค่าเริ่มต้นที่แข็งแรงสำหรับการตั้งค่าแบบ local-first คือ:

- QMD เป็น backend ของ memory ที่ใช้งานอยู่สำหรับ recall และ semantic search แบบกว้าง
- `memory-wiki` ในโหมด `bridge` สำหรับหน้าความรู้แบบสังเคราะห์ที่คงทน

การแยกแบบนี้ทำงานได้ดีเพราะแต่ละชั้นยังคงโฟกัสกับสิ่งของตัวเอง:

- QMD ทำให้บันทึกดิบ, session export และคอลเลกชันเสริมยังค้นหาได้
- `memory-wiki` คอมไพล์ entities, claims, dashboard และ source page ที่เสถียร

กฎเชิงปฏิบัติ:

- ใช้ `memory_search` เมื่อคุณต้องการ recall แบบกว้างหนึ่งรอบครอบคลุมทั้งหน่วยความจำ
- ใช้ `wiki_search` และ `wiki_get` เมื่อคุณต้องการผลลัพธ์วิกิที่รับรู้ provenance
- ใช้ `memory_search corpus=all` เมื่อคุณต้องการให้การค้นหาแบบใช้ร่วมกันครอบคลุมทั้งสองชั้น

หาก bridge mode รายงานว่า exported artifacts เป็นศูนย์ แปลว่า memory plugin ที่ใช้งานอยู่
ยังไม่ได้เปิดเผยอินพุต bridge แบบสาธารณะในตอนนี้ ให้รัน `openclaw wiki doctor` ก่อน
จากนั้นยืนยันว่า memory plugin ที่ใช้งานอยู่นั้นรองรับ public artifacts

## โหมดของ vault

`memory-wiki` รองรับ vault mode สามแบบ:

### `isolated`

vault ของตัวเอง แหล่งข้อมูลของตัวเอง ไม่ขึ้นกับ `memory-core`

ใช้เมื่อคุณต้องการให้วิกิเป็นคลังความรู้ที่คัดสรรแล้วของตัวเอง

### `bridge`

อ่าน memory artifacts สาธารณะและ memory events จาก memory plugin ที่ใช้งานอยู่
ผ่าน seam สาธารณะของ Plugin SDK

ใช้เมื่อคุณต้องการให้วิกิคอมไพล์และจัดระเบียบอาร์ติแฟกต์ที่ memory plugin
ส่งออก โดยไม่ต้องเข้าถึง internals ส่วนตัวของ Plugin

Bridge mode สามารถทำดัชนี:

- exported memory artifacts
- dream reports
- daily notes
- memory root files
- memory event logs

### `unsafe-local`

ช่องทางหลีกเลี่ยงแบบ explicit บนเครื่องเดียวกันสำหรับ local path ส่วนตัว

โหมดนี้เป็นแบบทดลองโดยตั้งใจและไม่พกพา ใช้เฉพาะเมื่อคุณ
เข้าใจ trust boundary และต้องการเข้าถึงไฟล์ในเครื่องโดยเฉพาะในกรณีที่
bridge mode ให้ไม่ได้

## โครงสร้างของ vault

Plugin จะ initialize vault ดังนี้:

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

เนื้อหาที่ระบบจัดการจะอยู่ภายใน generated block ส่วนบล็อกบันทึกที่มนุษย์เขียนจะถูกเก็บรักษาไว้

กลุ่มหน้าหลักคือ:

- `sources/` สำหรับวัตถุดิบดิบที่นำเข้าและหน้าที่รองรับด้วย bridge
- `entities/` สำหรับสิ่ง บุคคล ระบบ โปรเจกต์ และวัตถุที่คงทน
- `concepts/` สำหรับแนวคิด นามธรรม แพตเทิร์น และนโยบาย
- `syntheses/` สำหรับสรุปที่คอมไพล์แล้วและ rollup ที่ได้รับการดูแล
- `reports/` สำหรับ dashboard ที่สร้างขึ้น

## Claims และ evidence แบบมีโครงสร้าง

หน้าสามารถมี frontmatter แบบ `claims` ที่มีโครงสร้างได้ ไม่ใช่แค่ข้อความอิสระ

แต่ละ claim สามารถมี:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

รายการ evidence สามารถมี:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

สิ่งนี้ทำให้วิกิทำงานคล้ายชั้นความเชื่อมากกว่ากองบันทึกแบบนิ่ง ๆ
claims สามารถถูกติดตาม ให้คะแนน โต้แย้ง และ resolve กลับไปยังแหล่งที่มาได้

## ไปป์ไลน์การคอมไพล์

ขั้นตอน compile จะอ่านหน้าวิกิ ปรับสรุปให้เป็นมาตรฐาน และปล่อย
อาร์ติแฟกต์ที่เสถียรสำหรับฝั่งเครื่องไว้ใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

digest เหล่านี้มีไว้เพื่อให้เอเจนต์และโค้ดรันไทม์ไม่ต้องไป scrape หน้า Markdown

เอาต์พุตที่คอมไพล์แล้วยังขับเคลื่อน:

- การทำดัชนีวิกิรอบแรกสำหรับ flow ของ search/get
- การ lookup claim-id กลับไปยังหน้าที่เป็นเจ้าของ
- ส่วนเสริมของพรอมป์แบบกระชับ
- การสร้าง report/dashboard

## Dashboard และรายงานสุขภาพ

เมื่อเปิด `render.createDashboards` compile จะดูแล dashboard ใต้ `reports/`

รายงาน built-in ได้แก่:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

รายงานเหล่านี้ติดตามสิ่งต่าง ๆ เช่น:

- กลุ่ม contradiction note
- กลุ่ม claim ที่แข่งขันกัน
- claims ที่ขาด evidence แบบมีโครงสร้าง
- หน้าและ claims ที่มี confidence ต่ำ
- ความสดใหม่ที่เก่าหรือไม่ทราบ
- หน้าที่มีคำถามที่ยังไม่ถูกคลี่คลาย

## การค้นหาและการดึงข้อมูล

`memory-wiki` รองรับ search backend สองแบบ:

- `shared`: ใช้ flow การค้นหา memory แบบใช้ร่วมกันเมื่อมี
- `local`: ค้นหาวิกิในเครื่อง

และยังรองรับ corpus สามแบบ:

- `wiki`
- `memory`
- `all`

พฤติกรรมสำคัญ:

- `wiki_search` และ `wiki_get` ใช้ digest ที่คอมไพล์แล้วเป็นรอบแรกเมื่อเป็นไปได้
- claim id สามารถ resolve กลับไปยังหน้าที่เป็นเจ้าของได้
- claims ที่ contested/stale/fresh มีผลต่อการจัดอันดับ
- ป้ายกำกับ provenance สามารถอยู่ต่อไปจนถึงผลลัพธ์ได้

กฎเชิงปฏิบัติ:

- ใช้ `memory_search corpus=all` สำหรับ recall แบบกว้างหนึ่งรอบ
- ใช้ `wiki_search` + `wiki_get` เมื่อคุณใส่ใจกับการจัดอันดับแบบเฉพาะวิกิ,
  provenance หรือโครงสร้างความเชื่อในระดับหน้า

## Agent tools

Plugin นี้ลงทะเบียน tools ต่อไปนี้:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

หน้าที่ของแต่ละตัว:

- `wiki_status`: โหมด vault ปัจจุบัน, สุขภาพ, ความพร้อมใช้งานของ Obsidian CLI
- `wiki_search`: ค้นหาหน้าวิกิ และเมื่อกำหนดค่าไว้ ก็รวมถึง shared memory corpora
- `wiki_get`: อ่านหน้าวิกิตาม id/path หรือ fallback ไปยัง shared memory corpus
- `wiki_apply`: การเปลี่ยนแปลงแบบจำกัดต่อ synthesis/metadata โดยไม่ผ่าตัดหน้าแบบอิสระ
- `wiki_lint`: การตรวจสอบโครงสร้าง ช่องว่างของ provenance ความขัดแย้ง และคำถามที่ยังเปิดอยู่

Plugin นี้ยังลงทะเบียน non-exclusive memory corpus supplement ด้วย ทำให้
`memory_search` และ `memory_get` แบบใช้ร่วมกันสามารถเข้าถึงวิกิได้ เมื่อ memory plugin ที่ใช้งานอยู่รองรับการเลือก corpus

## พฤติกรรมของพรอมป์และบริบท

เมื่อเปิด `context.includeCompiledDigestPrompt` ส่วนของพรอมป์หน่วยความจำจะต่อ snapshot แบบคอมไพล์ที่กระชับจาก `agent-digest.json` เข้าไป

snapshot นั้นตั้งใจให้เล็กและมีสัญญาณสูง:

- เฉพาะหน้าสำคัญ
- เฉพาะ claims สำคัญ
- จำนวนความขัดแย้ง
- จำนวนคำถาม
- ตัวบ่งชี้ confidence/freshness

สิ่งนี้เป็นแบบ opt-in เพราะมันเปลี่ยนรูปร่างของพรอมป์ และมีประโยชน์หลัก ๆ สำหรับ context engine หรือการประกอบพรอมป์แบบเดิมที่บริโภคส่วนเสริมของหน่วยความจำอย่างชัดเจน

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

ตัวสลับสำคัญ:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` หรือ `obsidian`
- `bridge.readMemoryArtifacts`: นำเข้า public artifacts ของ memory plugin ที่ใช้งานอยู่
- `bridge.followMemoryEvents`: รวม event log ใน bridge mode
- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `context.includeCompiledDigestPrompt`: ต่อ digest snapshot แบบกระชับเข้าไปในส่วนของพรอมป์หน่วยความจำ
- `render.createBacklinks`: สร้าง related block แบบกำหนดแน่นอน
- `render.createDashboards`: สร้างหน้า dashboard

### ตัวอย่าง: QMD + bridge mode

ใช้เมื่อคุณต้องการให้ QMD ทำหน้าที่ recall และให้ `memory-wiki` เป็น
ชั้นความรู้ที่ได้รับการดูแล:

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

สิ่งนี้ทำให้:

- QMD รับผิดชอบ active memory recall
- `memory-wiki` โฟกัสที่หน้าที่คอมไพล์แล้วและ dashboard
- รูปร่างของพรอมป์ไม่เปลี่ยนจนกว่าคุณจะตั้งใจเปิดใช้ compiled digest prompt

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

ดู [CLI: wiki](/cli/wiki) สำหรับเอกสารอ้างอิงคำสั่งแบบเต็ม

## การรองรับ Obsidian

เมื่อ `vault.renderMode` เป็น `obsidian` Plugin จะเขียน
Markdown ที่เป็นมิตรกับ Obsidian และสามารถใช้ `obsidian` CLI อย่างเป็นทางการได้แบบไม่บังคับ

เวิร์กโฟลว์ที่รองรับ ได้แก่:

- การตรวจสอบสถานะ
- การค้นหา vault
- การเปิดหน้า
- การเรียกใช้คำสั่งของ Obsidian
- การกระโดดไปยังบันทึกรายวัน

สิ่งนี้เป็นทางเลือก วิกิยังคงทำงานได้ใน native mode โดยไม่ต้องใช้ Obsidian

## เวิร์กโฟลว์ที่แนะนำ

1. คง memory plugin ที่ใช้งานอยู่ของคุณไว้สำหรับ recall/promotion/Dreaming
2. เปิดใช้ `memory-wiki`
3. เริ่มด้วยโหมด `isolated` เว้นแต่คุณต้องการ bridge mode อย่างชัดเจน
4. ใช้ `wiki_search` / `wiki_get` เมื่อ provenance มีความสำคัญ
5. ใช้ `wiki_apply` สำหรับ synthesis แบบจำกัดหรือการอัปเดต metadata
6. รัน `wiki_lint` หลังจากมีการเปลี่ยนแปลงที่มีนัยสำคัญ
7. เปิด dashboard หากคุณต้องการมองเห็น stale/contradiction

## เอกสารที่เกี่ยวข้อง

- [Memory Overview](/th/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK overview](/th/plugins/sdk-overview)
