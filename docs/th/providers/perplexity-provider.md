---
read_when:
    - คุณต้องการตั้งค่า Perplexity เป็น web search provider
    - คุณต้องการ Perplexity API key หรือการตั้งค่า proxy ผ่าน OpenRouter
summary: การตั้งค่า Perplexity web search provider (API key, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-04-23T05:52:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Web Search Provider)

Perplexity Plugin ให้ความสามารถในการค้นหาเว็บผ่าน Perplexity
Search API หรือ Perplexity Sonar ผ่าน OpenRouter

<Note>
หน้านี้ครอบคลุมการตั้งค่า **provider** ของ Perplexity สำหรับ
**tool** ของ Perplexity (วิธีที่เอเจนต์ใช้งานมัน) โปรดดู [Perplexity tool](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ    | ค่า                                                                   |
| ------------ | --------------------------------------------------------------------- |
| ประเภท       | Web search provider (ไม่ใช่ model provider)                           |
| Auth         | `PERPLEXITY_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธของ config | `plugins.entries.perplexity.config.webSearch.apiKey`                  |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รันโฟลว์การตั้งค่า web-search แบบโต้ตอบ:

    ```bash
    openclaw configure --section web
    ```

    หรือตั้งค่าคีย์โดยตรง:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="เริ่มค้นหา">
    เอเจนต์จะใช้ Perplexity สำหรับการค้นหาเว็บโดยอัตโนมัติเมื่อมีการตั้งค่า key แล้ว
    ไม่ต้องมีขั้นตอนเพิ่มเติม
  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะเลือก transport อัตโนมัติตาม prefix ของ API key:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `pplx-`, OpenClaw จะใช้ native Perplexity Search
    API โดย transport นี้จะคืนผลลัพธ์แบบมีโครงสร้าง และรองรับตัวกรอง domain, language
    และ date (ดูตัวเลือกการกรองด้านล่าง)
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `sk-or-`, OpenClaw จะกำหนดเส้นทางผ่าน OpenRouter โดยใช้
    Perplexity Sonar model transport นี้จะคืนคำตอบแบบ AI-synthesized พร้อม
    citations
  </Tab>
</Tabs>

| Prefix ของคีย์ | Transport                     | ฟีเจอร์                                           |
| -------------- | ----------------------------- | ------------------------------------------------- |
| `pplx-`        | Native Perplexity Search API  | ผลลัพธ์แบบมีโครงสร้าง, ตัวกรอง domain/language/date |
| `sk-or-`       | OpenRouter (Sonar)            | คำตอบแบบ AI-synthesized พร้อม citations          |

## การกรองของ Native API

<Note>
ตัวเลือกการกรองใช้ได้เฉพาะเมื่อใช้ native Perplexity API
(คีย์ `pplx-`) เท่านั้น การค้นหาแบบ OpenRouter/Sonar ไม่รองรับพารามิเตอร์เหล่านี้
</Note>

เมื่อใช้ native Perplexity API การค้นหารองรับตัวกรองต่อไปนี้:

| ตัวกรอง         | คำอธิบาย                              | ตัวอย่าง                           |
| --------------- | ------------------------------------ | ---------------------------------- |
| ประเทศ          | รหัสประเทศ 2 ตัวอักษร                | `us`, `de`, `jp`                   |
| ภาษา            | รหัสภาษา ISO 639-1                   | `en`, `fr`, `zh`                   |
| ช่วงวันที่       | หน้าต่างความใหม่                     | `day`, `week`, `month`, `year`     |
| ตัวกรองโดเมน    | allowlist หรือ denylist (สูงสุด 20 โดเมน) | `example.com`                      |
| งบประมาณเนื้อหา | ขีดจำกัดโทเค็นต่อการตอบ / ต่อหน้า      | `max_tokens`, `max_tokens_per_page` |

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรแวดล้อมสำหรับโปรเซสแบบ daemon">
    หาก OpenClaw Gateway รันเป็น daemon (launchd/systemd) ให้แน่ใจว่า
    `PERPLEXITY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่ตั้งไว้เพียงใน `~/.profile` จะไม่มองเห็นได้โดย launchd/systemd
    daemon เว้นแต่ environment นั้นจะถูกนำเข้าอย่างชัดเจน ให้ตั้งค่าคีย์ไว้ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway
    อ่านค่านี้ได้
    </Warning>

  </Accordion>

  <Accordion title="การตั้งค่า proxy ผ่าน OpenRouter">
    หากคุณต้องการกำหนดเส้นทางการค้นหาของ Perplexity ผ่าน OpenRouter ให้ตั้งค่า
    `OPENROUTER_API_KEY` (prefix `sk-or-`) แทนคีย์ Perplexity แบบ native
    OpenClaw จะตรวจจับ prefix และสลับไปใช้ Sonar transport
    โดยอัตโนมัติ

    <Tip>
    OpenRouter transport มีประโยชน์หากคุณมีบัญชี OpenRouter อยู่แล้ว
    และต้องการรวมการคิดค่าบริการจากหลาย providers ไว้ด้วยกัน
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่เอเจนต์เรียกใช้การค้นหาด้วย Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการตั้งค่าแบบเต็ม รวมถึงรายการ Plugin
  </Card>
</CardGroup>
