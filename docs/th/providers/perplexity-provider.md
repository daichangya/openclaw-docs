---
read_when:
    - คุณต้องการกำหนดค่า Perplexity เป็น provider การค้นหาเว็บ
    - คุณต้องการ API key ของ Perplexity หรือการตั้งค่า proxy ของ OpenRouter
summary: การตั้งค่า provider การค้นหาเว็บของ Perplexity (API key, โหมดการค้นหา, การกรอง)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T09:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (provider การค้นหาเว็บ)

Plugin Perplexity ให้ความสามารถในการค้นหาเว็บผ่าน Perplexity
Search API หรือ Perplexity Sonar ผ่าน OpenRouter

<Note>
หน้านี้ครอบคลุมการตั้งค่า **provider** ของ Perplexity สำหรับ **tool**
ของ Perplexity (วิธีที่ agent ใช้งาน) โปรดดู [Perplexity tool](/th/tools/perplexity-search)
</Note>

| คุณสมบัติ    | ค่า                                                                   |
| ----------- | --------------------------------------------------------------------- |
| ประเภท      | provider การค้นหาเว็บ (ไม่ใช่ provider ของ model)                    |
| Auth        | `PERPLEXITY_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter) |
| พาธ config | `plugins.entries.perplexity.config.webSearch.apiKey`                  |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รัน flow การกำหนดค่าการค้นหาเว็บแบบ interactive:

    ```bash
    openclaw configure --section web
    ```

    หรือตั้งค่าคีย์โดยตรง:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="เริ่มค้นหา">
    agent จะใช้ Perplexity สำหรับการค้นหาเว็บโดยอัตโนมัติทันทีเมื่อ
    กำหนดค่าคีย์แล้ว ไม่ต้องมีขั้นตอนเพิ่มเติม
  </Step>
</Steps>

## โหมดการค้นหา

Plugin จะเลือก transport อัตโนมัติตาม prefix ของ API key:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `pplx-` OpenClaw จะใช้ Perplexity Search
    API แบบ native transport นี้จะคืนผลลัพธ์แบบมีโครงสร้าง และรองรับตัวกรอง
    โดเมน ภาษา และวันที่ (ดูตัวเลือกการกรองด้านล่าง)
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    เมื่อคีย์ของคุณขึ้นต้นด้วย `sk-or-` OpenClaw จะกำหนดเส้นทางผ่าน OpenRouter โดยใช้
    model Perplexity Sonar transport นี้จะคืนคำตอบที่สังเคราะห์โดย AI พร้อม
    การอ้างอิง
  </Tab>
</Tabs>

| prefix ของคีย์ | Transport                     | ความสามารถ                                            |
| -------------- | ----------------------------- | ----------------------------------------------------- |
| `pplx-`        | Native Perplexity Search API  | ผลลัพธ์แบบมีโครงสร้าง, ตัวกรองโดเมน/ภาษา/วันที่       |
| `sk-or-`       | OpenRouter (Sonar)            | คำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิง              |

## การกรองใน Native API

<Note>
ตัวเลือกการกรองใช้ได้เฉพาะเมื่อใช้ Native Perplexity API
(คีย์ `pplx-`) เท่านั้น การค้นหาผ่าน OpenRouter/Sonar ไม่รองรับพารามิเตอร์เหล่านี้
</Note>

เมื่อใช้ Native Perplexity API การค้นหารองรับตัวกรองต่อไปนี้:

| ตัวกรอง         | คำอธิบาย                              | ตัวอย่าง                            |
| --------------- | ------------------------------------- | ----------------------------------- |
| ประเทศ          | รหัสประเทศ 2 ตัวอักษร                | `us`, `de`, `jp`                    |
| ภาษา            | รหัสภาษา ISO 639-1                    | `en`, `fr`, `zh`                    |
| ช่วงวันที่       | หน้าต่างความใหม่                      | `day`, `week`, `month`, `year`      |
| ตัวกรองโดเมน    | allowlist หรือ denylist (สูงสุด 20 โดเมน) | `example.com`                    |
| งบประมาณเนื้อหา | ขีดจำกัดโทเคนต่อการตอบกลับ / ต่อหน้า  | `max_tokens`, `max_tokens_per_page` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับ process แบบ daemon">
    หาก OpenClaw Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `PERPLEXITY_API_KEY` พร้อมใช้งานสำหรับ process นั้น

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน `~/.profile` จะไม่สามารถมองเห็นได้โดย daemon ของ launchd/systemd
    เว้นแต่จะมีการนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ตั้งค่าคีย์ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่า process ของ gateway สามารถ
    อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การตั้งค่า proxy ของ OpenRouter">
    หากคุณต้องการกำหนดเส้นทางการค้นหา Perplexity ผ่าน OpenRouter ให้ตั้งค่า
    `OPENROUTER_API_KEY` (prefix `sk-or-`) แทนคีย์ Native Perplexity
    OpenClaw จะตรวจจับ prefix และสลับไปใช้ transport ของ Sonar
    โดยอัตโนมัติ

    <Tip>
    transport ของ OpenRouter มีประโยชน์หากคุณมีบัญชี OpenRouter อยู่แล้ว
    และต้องการรวมการเรียกเก็บเงินไว้ในหลาย provider
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/th/tools/perplexity-search" icon="magnifying-glass">
    วิธีที่ agent เรียกใช้การค้นหาของ Perplexity และตีความผลลัพธ์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม รวมถึงรายการของ Plugin
  </Card>
</CardGroup>
