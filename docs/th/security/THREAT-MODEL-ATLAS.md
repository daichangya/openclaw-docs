---
read_when:
    - การทบทวน security posture หรือสถานการณ์ภัยคุกคาม
    - การทำงานกับฟีเจอร์ด้านความปลอดภัยหรือการตอบกลับผลการตรวจสอบถวายสัตย์ฯanalysis to=final code omitted
summary: โมเดลภัยคุกคามของ OpenClaw ที่แมปกับกรอบงาน MITRE ATLAS
title: โมเดลภัยคุกคาม (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-23T05:56:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# โมเดลภัยคุกคามของ OpenClaw v1.0

## กรอบงาน MITRE ATLAS

**เวอร์ชัน:** 1.0-draft
**อัปเดตล่าสุด:** 2026-02-04
**ระเบียบวิธี:** MITRE ATLAS + Data Flow Diagrams
**กรอบงาน:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### การอ้างอิงกรอบงาน

โมเดลภัยคุกคามนี้สร้างขึ้นบน [MITRE ATLAS](https://atlas.mitre.org/) ซึ่งเป็นกรอบงานมาตรฐานอุตสาหกรรมสำหรับการจัดทำเอกสารภัยคุกคามเชิงปฏิปักษ์ต่อระบบ AI/ML โดยเฉพาะ ATLAS ดูแลโดย [MITRE](https://www.mitre.org/) ร่วมกับชุมชนด้านความปลอดภัย AI

**ทรัพยากร ATLAS สำคัญ:**

- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Tactics](https://atlas.mitre.org/tactics/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Contributing to ATLAS](https://atlas.mitre.org/resources/contribute)

### การมีส่วนร่วมกับโมเดลภัยคุกคามนี้

นี่คือเอกสารที่มีชีวิตซึ่งดูแลโดยชุมชน OpenClaw ดู [CONTRIBUTING-THREAT-MODEL.md](/th/security/CONTRIBUTING-THREAT-MODEL) สำหรับแนวทางการมีส่วนร่วม:

- การรายงานภัยคุกคามใหม่
- การอัปเดตภัยคุกคามที่มีอยู่
- การเสนอ attack chain
- การเสนอแนวทางบรรเทา

---

## 1. บทนำ

### 1.1 วัตถุประสงค์

โมเดลภัยคุกคามนี้บันทึกภัยคุกคามเชิงปฏิปักษ์ต่อแพลตฟอร์ม AI agent ของ OpenClaw และตลาด Skills ของ ClawHub โดยใช้กรอบงาน MITRE ATLAS ที่ออกแบบมาสำหรับระบบ AI/ML โดยเฉพาะ

### 1.2 ขอบเขต

| องค์ประกอบ              | รวมอยู่ | หมายเหตุ                                          |
| ----------------------- | ------- | ------------------------------------------------- |
| OpenClaw Agent Runtime  | ใช่     | การรันเอเจนต์หลัก การเรียกเครื่องมือ เซสชัน      |
| Gateway                 | ใช่     | การยืนยันตัวตน การกำหนดเส้นทาง การผสานรวมช่อง     |
| Channel Integrations    | ใช่     | WhatsApp, Telegram, Discord, Signal, Slack ฯลฯ   |
| ClawHub Marketplace     | ใช่     | การเผยแพร่ Skills การกลั่นกรอง การกระจาย          |
| MCP Servers             | ใช่     | ผู้ให้บริการเครื่องมือภายนอก                     |
| User Devices            | บางส่วน | แอปมือถือ ไคลเอนต์เดสก์ท็อป                      |

### 1.3 สิ่งที่อยู่นอกขอบเขต

ไม่มีสิ่งใดถูกระบุว่าอยู่นอกขอบเขตอย่างชัดเจนสำหรับโมเดลภัยคุกคามนี้

---

## 2. สถาปัตยกรรมของระบบ

### 2.1 ขอบเขตความเชื่อถือ

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 การไหลของข้อมูล

| Flow | ต้นทาง  | ปลายทาง    | ข้อมูล             | การป้องกัน            |
| ---- | ------- | ----------- | ------------------ | --------------------- |
| F1   | Channel | Gateway     | ข้อความผู้ใช้      | TLS, AllowFrom        |
| F2   | Gateway | Agent       | ข้อความที่กำหนดเส้นทางแล้ว | การแยกเซสชัน     |
| F3   | Agent   | Tools       | การเรียกใช้เครื่องมือ | การบังคับใช้นโยบาย   |
| F4   | Agent   | External    | คำขอ web_fetch     | การบล็อก SSRF        |
| F5   | ClawHub | Agent       | โค้ด Skill         | การกลั่นกรอง การสแกน |
| F6   | Agent   | Channel     | คำตอบ              | การกรองเอาต์พุต      |

---

## 3. การวิเคราะห์ภัยคุกคามตาม Tactic ของ ATLAS

### 3.1 การลาดตระเวน (AML.TA0002)

#### T-RECON-001: การค้นพบปลายทางของ Agent

| คุณลักษณะ               | ค่า                                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                           |
| **Description**         | ผู้โจมตีสแกนหาปลายทาง gateway ของ OpenClaw ที่เปิดเผยอยู่             |
| **Attack Vector**       | การสแกนเครือข่าย, การค้นหาผ่าน shodan, การทำ DNS enumeration         |
| **Affected Components** | Gateway, ปลายทาง API ที่เปิดเผย                                       |
| **Current Mitigations** | ตัวเลือก Tailscale auth, bind กับ loopback เป็นค่าเริ่มต้น             |
| **Residual Risk**       | ปานกลาง - Gateway สาธารณะสามารถถูกค้นพบได้                           |
| **Recommendations**     | จัดทำเอกสารการติดตั้งใช้งานอย่างปลอดภัย, เพิ่ม rate limiting บนปลายทางสำหรับการค้นหา |

#### T-RECON-002: การ probe ของ Channel Integration

| คุณลักษณะ               | ค่า                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                         |
| **Description**         | ผู้โจมตี probe ช่องทางการส่งข้อความเพื่อระบุบัญชีที่มี AI จัดการอยู่ |
| **Attack Vector**       | ส่งข้อความทดสอบ สังเกตรูปแบบการตอบกลับ                            |
| **Affected Components** | การผสานรวมช่องทั้งหมด                                               |
| **Current Mitigations** | ไม่มีแบบเฉพาะ                                                       |
| **Residual Risk**       | ต่ำ - การค้นพบเพียงอย่างเดียวมีประโยชน์จำกัด                        |
| **Recommendations**     | พิจารณาการสุ่มเวลาในการตอบกลับ                                       |

---

### 3.2 การเข้าถึงเริ่มต้น (AML.TA0004)

#### T-ACCESS-001: การดักจับ Pairing Code

| คุณลักษณะ               | ค่า                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                                                      |
| **Description**         | ผู้โจมตีดักจับ pairing code ระหว่างช่วงผ่อนผันของการ pairing (1 ชม. สำหรับการ pairing ของช่อง DM, 5 นาทีสำหรับการ pairing ของ node) |
| **Attack Vector**       | มองข้ามไหล่, ดักฟังเครือข่าย, social engineering                                                             |
| **Affected Components** | ระบบ device pairing                                                                                            |
| **Current Mitigations** | หมดอายุใน 1 ชม. (DM pairing) / 5 นาที (node pairing), ส่งโค้ดผ่านช่องที่มีอยู่เดิม                            |
| **Residual Risk**       | ปานกลาง - ช่วงผ่อนผันถูกใช้ประโยชน์ได้                                                                        |
| **Recommendations**     | ลดช่วงผ่อนผัน, เพิ่มขั้นตอนยืนยัน                                                                             |

#### T-ACCESS-002: การปลอมแปลง AllowFrom

| คุณลักษณะ               | ค่า                                                                           |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                     |
| **Description**         | ผู้โจมตีปลอมตัวตนของผู้ส่งที่ได้รับอนุญาตในช่อง                               |
| **Attack Vector**       | ขึ้นกับช่อง - การปลอมหมายเลขโทรศัพท์ การปลอมตัวเป็นชื่อผู้ใช้                  |
| **Affected Components** | การตรวจสอบ AllowFrom ต่อช่อง                                                  |
| **Current Mitigations** | การยืนยันตัวตนเฉพาะตามช่อง                                                    |
| **Residual Risk**       | ปานกลาง - บางช่องมีช่องโหว่ต่อการปลอมแปลง                                    |
| **Recommendations**     | จัดทำเอกสารความเสี่ยงเฉพาะตามช่อง, เพิ่มการยืนยันเชิงเข้ารหัสเมื่อเป็นไปได้   |

#### T-ACCESS-003: การขโมย Token

| คุณลักษณะ               | ค่า                                                           |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                     |
| **Description**         | ผู้โจมตีขโมย token สำหรับการยืนยันตัวตนจากไฟล์ config         |
| **Attack Vector**       | มัลแวร์, การเข้าถึงอุปกรณ์โดยไม่ได้รับอนุญาต, การเปิดเผยจากแบ็กอัป config |
| **Affected Components** | ~/.openclaw/credentials/, ที่เก็บ config                      |
| **Current Mitigations** | สิทธิ์ของไฟล์                                                 |
| **Residual Risk**       | สูง - token ถูกเก็บเป็นข้อความล้วน                            |
| **Recommendations**     | ใช้การเข้ารหัส token เมื่อเก็บไว้, เพิ่มการหมุนเวียน token     |

---

### 3.3 การรัน (AML.TA0005)

#### T-EXEC-001: Direct Prompt Injection

| คุณลักษณะ               | ค่า                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                             |
| **Description**         | ผู้โจมตีส่งพรอมป์ที่สร้างขึ้นมาเพื่อบิดพฤติกรรมของเอเจนต์                               |
| **Attack Vector**       | ข้อความในช่องที่มีคำสั่งเชิงปฏิปักษ์                                                    |
| **Affected Components** | LLM ของเอเจนต์, พื้นผิวอินพุตทั้งหมด                                                     |
| **Current Mitigations** | การตรวจจับตามรูปแบบ, การห่อเนื้อหาภายนอก                                                |
| **Residual Risk**       | วิกฤต - มีเพียงการตรวจจับ ไม่มีการบล็อก; การโจมตีที่ซับซ้อนสามารถหลบได้                 |
| **Recommendations**     | ใช้การป้องกันหลายชั้น, การตรวจสอบเอาต์พุต, การยืนยันจากผู้ใช้สำหรับการกระทำที่อ่อนไหว    |

#### T-EXEC-002: Indirect Prompt Injection

| คุณลักษณะ               | ค่า                                                         |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **Description**         | ผู้โจมตีฝังคำสั่งอันตรายไว้ในเนื้อหาที่ถูกดึงมา             |
| **Attack Vector**       | URL อันตราย, อีเมลที่ถูกวางยา, webhook ที่ถูกยึดครอง        |
| **Affected Components** | web_fetch, การนำเข้าอีเมล, แหล่งข้อมูลภายนอก               |
| **Current Mitigations** | การห่อเนื้อหาด้วย XML tag และข้อความแจ้งเตือนด้านความปลอดภัย |
| **Residual Risk**       | สูง - LLM อาจเพิกเฉยต่อคำสั่งห่อดังกล่าว                   |
| **Recommendations**     | ใช้การ sanitize เนื้อหา, แยก execution context              |

#### T-EXEC-003: Tool Argument Injection

| คุณลักษณะ               | ค่า                                                           |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                  |
| **Description**         | ผู้โจมตีบิดค่าอาร์กิวเมนต์ของเครื่องมือผ่าน prompt injection |
| **Attack Vector**       | พรอมป์ที่ถูกสร้างขึ้นเพื่อมีอิทธิพลต่อค่าพารามิเตอร์ของเครื่องมือ |
| **Affected Components** | การเรียกใช้เครื่องมือทั้งหมด                                   |
| **Current Mitigations** | exec approval สำหรับคำสั่งอันตราย                              |
| **Residual Risk**       | สูง - พึ่งพาการตัดสินใจของผู้ใช้                               |
| **Recommendations**     | ใช้การตรวจสอบอาร์กิวเมนต์, การเรียกใช้เครื่องมือแบบกำหนดพารามิเตอร์ |

#### T-EXEC-004: การข้าม Exec Approval

| คุณลักษณะ               | ค่า                                                         |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                          |
| **Description**         | ผู้โจมตีสร้างคำสั่งที่ข้าม approval allowlist ได้           |
| **Attack Vector**       | การอำพรางคำสั่ง, การใช้ alias ในทางที่ผิด, การบิด path      |
| **Affected Components** | exec-approvals.ts, command allowlist                        |
| **Current Mitigations** | allowlist + ask mode                                        |
| **Residual Risk**       | สูง - ไม่มีการ sanitize คำสั่ง                              |
| **Recommendations**     | ใช้การ normalize คำสั่ง, ขยาย blocklist                    |

---

### 3.4 การคงอยู่ (AML.TA0006)

#### T-PERSIST-001: การติดตั้ง Skill ที่เป็นอันตราย

| คุณลักษณะ               | ค่า                                                                     |
| ----------------------- | ----------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                    |
| **Description**         | ผู้โจมตีเผยแพร่ Skill ที่เป็นอันตรายไปยัง ClawHub                      |
| **Attack Vector**       | สร้างบัญชี เผยแพร่ Skill ที่มีโค้ดอันตรายซ่อนอยู่                     |
| **Affected Components** | ClawHub, การโหลด Skill, การรันของเอเจนต์                               |
| **Current Mitigations** | การยืนยันอายุบัญชี GitHub, แฟลกการกลั่นกรองตามรูปแบบ                  |
| **Residual Risk**       | วิกฤต - ไม่มี sandboxing, การตรวจสอบจำกัด                              |
| **Recommendations**     | การผสานรวม VirusTotal (กำลังดำเนินการ), sandboxing ของ Skill, การตรวจสอบโดยชุมชน |

#### T-PERSIST-002: การวางยาการอัปเดต Skill

| คุณลักษณะ               | ค่า                                                            |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software           |
| **Description**         | ผู้โจมตียึดครอง Skill ยอดนิยมแล้ว push การอัปเดตอันตราย       |
| **Attack Vector**       | การยึดครองบัญชี, social engineering ต่อเจ้าของ Skill           |
| **Affected Components** | การทำ versioning ของ ClawHub, โฟลว์ auto-update               |
| **Current Mitigations** | การทำ fingerprint เวอร์ชัน                                     |
| **Residual Risk**       | สูง - auto-update อาจดึงเวอร์ชันอันตรายเข้ามา                 |
| **Recommendations**     | ใช้การเซ็นการอัปเดต, ความสามารถในการ rollback, การ pin เวอร์ชัน |

#### T-PERSIST-003: การแก้ไข Agent Configuration

| คุณลักษณะ               | ค่า                                                            |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Supply Chain Compromise: Data                  |
| **Description**         | ผู้โจมตีแก้ config ของเอเจนต์เพื่อคงสิทธิ์การเข้าถึงไว้       |
| **Attack Vector**       | การแก้ไขไฟล์ config, การฉีดการตั้งค่า                          |
| **Affected Components** | config ของเอเจนต์, นโยบายของเครื่องมือ                         |
| **Current Mitigations** | สิทธิ์ของไฟล์                                                  |
| **Residual Risk**       | ปานกลาง - ต้องมีการเข้าถึงในเครื่อง                           |
| **Recommendations**     | ใช้การตรวจสอบความสมบูรณ์ของ config, audit log สำหรับการเปลี่ยน config |

---

### 3.5 การหลบหลีกการป้องกัน (AML.TA0007)

#### T-EVADE-001: การหลบเลี่ยงรูปแบบการกลั่นกรอง

| คุณลักษณะ               | ค่า                                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                                    |
| **Description**         | ผู้โจมตีสร้างเนื้อหา Skill เพื่อหลบ pattern ของการกลั่นกรอง         |
| **Attack Vector**       | Unicode homoglyph, กลวิธีเข้ารหัส, การโหลดแบบไดนามิก                |
| **Affected Components** | moderation.ts ของ ClawHub                                             |
| **Current Mitigations** | FLAG_RULES แบบอิง pattern                                             |
| **Residual Risk**       | สูง - regex แบบง่ายหลบเลี่ยงได้ง่าย                                   |
| **Recommendations**     | เพิ่มการวิเคราะห์พฤติกรรม (VirusTotal Code Insight), การตรวจจับแบบ AST |

#### T-EVADE-002: การหลบออกจาก Content Wrapper

| คุณลักษณะ               | ค่า                                                      |
| ----------------------- | -------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                       |
| **Description**         | ผู้โจมตีสร้างเนื้อหาที่หลุดออกจากบริบท XML wrapper      |
| **Attack Vector**       | การบิด tag, ความสับสนของบริบท, การ override คำสั่ง      |
| **Affected Components** | การห่อเนื้อหาภายนอก                                      |
| **Current Mitigations** | XML tag + ข้อความแจ้งเตือนด้านความปลอดภัย               |
| **Residual Risk**       | ปานกลาง - มีการค้นพบวิธีหลบแบบใหม่อย่างสม่ำเสมอ         |
| **Recommendations**     | ใช้ wrapper หลายชั้น, การตรวจสอบฝั่งเอาต์พุต             |

---

### 3.6 การค้นพบ (AML.TA0008)

#### T-DISC-001: การไล่ดูเครื่องมือ

| คุณลักษณะ               | ค่า                                                   |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access             |
| **Description**         | ผู้โจมตีไล่ดูเครื่องมือที่ใช้ได้ผ่านการตั้งคำถาม      |
| **Attack Vector**       | คำถามสไตล์ "คุณมีเครื่องมืออะไรบ้าง?"                |
| **Affected Components** | registry ของเครื่องมือเอเจนต์                         |
| **Current Mitigations** | ไม่มีแบบเฉพาะ                                        |
| **Residual Risk**       | ต่ำ - โดยทั่วไปเครื่องมือมีเอกสารอยู่แล้ว            |
| **Recommendations**     | พิจารณาตัวควบคุมการมองเห็นของเครื่องมือ              |

#### T-DISC-002: การดึงข้อมูลเซสชัน

| คุณลักษณะ               | ค่า                                                    |
| ----------------------- | ------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access              |
| **Description**         | ผู้โจมตีดึงข้อมูลอ่อนไหวจากบริบทของเซสชัน             |
| **Attack Vector**       | คำถามอย่าง "เราคุยอะไรกันไป?" การ probe บริบท          |
| **Affected Components** | transcript ของเซสชัน, context window                   |
| **Current Mitigations** | การแยกเซสชันต่อผู้ส่ง                                  |
| **Residual Risk**       | ปานกลาง - เข้าถึงข้อมูลภายในเซสชันได้                  |
| **Recommendations**     | ใช้การปกปิดข้อมูลอ่อนไหวในบริบท                        |

---

### 3.7 การเก็บรวบรวมและการดึงข้อมูลออก (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: การขโมยข้อมูลผ่าน web_fetch

| คุณลักษณะ               | ค่า                                                                     |
| ----------------------- | ----------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                                  |
| **Description**         | ผู้โจมตีดึงข้อมูลออกโดยสั่งให้เอเจนต์ส่งไปยัง URL ภายนอก               |
| **Attack Vector**       | Prompt injection ที่ทำให้เอเจนต์ POST ข้อมูลไปยังเซิร์ฟเวอร์ของผู้โจมตี |
| **Affected Components** | เครื่องมือ web_fetch                                                    |
| **Current Mitigations** | การบล็อก SSRF สำหรับเครือข่ายภายใน                                     |
| **Residual Risk**       | สูง - ยังอนุญาต URL ภายนอก                                              |
| **Recommendations**     | ใช้ URL allowlist, การตระหนักรู้ตามการจัดชั้นข้อมูล                    |

#### T-EXFIL-002: การส่งข้อความโดยไม่ได้รับอนุญาต

| คุณลักษณะ               | ค่า                                                             |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                          |
| **Description**         | ผู้โจมตีทำให้เอเจนต์ส่งข้อความที่มีข้อมูลอ่อนไหว                |
| **Attack Vector**       | Prompt injection ที่ทำให้เอเจนต์ส่งข้อความหาผู้โจมตี             |
| **Affected Components** | เครื่องมือ Message, การผสานรวมช่อง                              |
| **Current Mitigations** | การควบคุมการส่งข้อความขาออก                                     |
| **Residual Risk**       | ปานกลาง - การควบคุมอาจถูกข้ามได้                                |
| **Recommendations**     | บังคับการยืนยันอย่างชัดเจนสำหรับผู้รับรายใหม่                    |

#### T-EXFIL-003: การเก็บเกี่ยวข้อมูลรับรอง

| คุณลักษณะ               | ค่า                                                       |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                    |
| **Description**         | Skill อันตรายเก็บเกี่ยวข้อมูลรับรองจากบริบทของเอเจนต์     |
| **Attack Vector**       | โค้ดของ Skill อ่าน environment variable, ไฟล์ config      |
| **Affected Components** | สภาพแวดล้อมการรัน Skill                                  |
| **Current Mitigations** | ไม่มีแบบเฉพาะสำหรับ Skills                                |
| **Residual Risk**       | วิกฤต - Skills รันด้วยสิทธิ์ของเอเจนต์                   |
| **Recommendations**     | sandboxing ของ Skill, การแยกข้อมูลรับรอง                  |

---

### 3.8 ผลกระทบ (AML.TA0011)

#### T-IMPACT-001: การรันคำสั่งโดยไม่ได้รับอนุญาต

| คุณลักษณะ               | ค่า                                                  |
| ----------------------- | ---------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                 |
| **Description**         | ผู้โจมตีรันคำสั่งตามอำเภอใจบนระบบของผู้ใช้          |
| **Attack Vector**       | Prompt injection ร่วมกับการข้าม exec approval       |
| **Affected Components** | เครื่องมือ Bash, การรันคำสั่ง                        |
| **Current Mitigations** | Exec approval, ตัวเลือก Docker sandbox               |
| **Residual Risk**       | วิกฤต - รันบนโฮสต์ได้โดยไม่ใช้ sandbox              |
| **Recommendations**     | ใช้ sandbox เป็นค่าเริ่มต้น, ปรับปรุง approval UX   |

#### T-IMPACT-002: การใช้ทรัพยากรจนหมด (DoS)

| คุณลักษณะ               | ค่า                                                 |
| ----------------------- | --------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                |
| **Description**         | ผู้โจมตีใช้เครดิต API หรือทรัพยากรคอมพิวต์จนหมด     |
| **Attack Vector**       | การถล่มข้อความอัตโนมัติ, การเรียกเครื่องมือที่มีต้นทุนสูง |
| **Affected Components** | Gateway, เซสชันเอเจนต์, ผู้ให้บริการ API            |
| **Current Mitigations** | ไม่มี                                               |
| **Residual Risk**       | สูง - ไม่มี rate limiting                           |
| **Recommendations**     | ใช้ rate limit ต่อผู้ส่ง, ตั้งงบประมาณต้นทุน         |

#### T-IMPACT-003: ความเสียหายต่อชื่อเสียง

| คุณลักษณะ               | ค่า                                                          |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                         |
| **Description**         | ผู้โจมตีทำให้เอเจนต์ส่งเนื้อหาที่เป็นอันตราย/ไม่เหมาะสม     |
| **Attack Vector**       | Prompt injection ที่ทำให้เกิดการตอบกลับไม่เหมาะสม           |
| **Affected Components** | การสร้างเอาต์พุต, การส่งข้อความในช่อง                       |
| **Current Mitigations** | นโยบายเนื้อหาของผู้ให้บริการ LLM                            |
| **Residual Risk**       | ปานกลาง - ตัวกรองของผู้ให้บริการไม่สมบูรณ์                  |
| **Recommendations**     | ใช้ชั้นการกรองเอาต์พุต, ตัวควบคุมฝั่งผู้ใช้                 |

---

## 4. การวิเคราะห์ Supply Chain ของ ClawHub

### 4.1 มาตรการควบคุมความปลอดภัยปัจจุบัน

| มาตรการควบคุม       | การนำไปใช้                     | ประสิทธิผล                                                |
| ------------------- | ----------------------------- | ---------------------------------------------------------- |
| อายุบัญชี GitHub    | `requireGitHubAccountAge()`   | ปานกลาง - เพิ่มต้นทุนให้ผู้โจมตีรายใหม่                    |
| Path Sanitization   | `sanitizePath()`              | สูง - ป้องกัน path traversal                               |
| File Type Validation| `isTextFile()`                | ปานกลาง - มีแต่ไฟล์ข้อความ แต่ก็ยังอาจเป็นอันตรายได้       |
| Size Limits         | bundle รวม 50MB              | สูง - ป้องกันการใช้ทรัพยากรจนหมด                           |
| บังคับมี SKILL.md   | ต้องมี readme                 | คุณค่าด้านความปลอดภัยต่ำ - มีไว้ให้ข้อมูลเท่านั้น           |
| Pattern Moderation  | `FLAG_RULES` ใน moderation.ts | ต่ำ - หลบเลี่ยงได้ง่าย                                     |
| Moderation Status   | ฟิลด์ `moderationStatus`      | ปานกลาง - สามารถตรวจสอบด้วยมือได้                          |

### 4.2 รูปแบบแฟลกของการกลั่นกรอง

รูปแบบปัจจุบันใน `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**ข้อจำกัด:**

- ตรวจเฉพาะ slug, displayName, summary, frontmatter, metadata, file path
- ไม่วิเคราะห์เนื้อหาโค้ดจริงของ Skill
- regex แบบง่ายหลบเลี่ยงได้ง่ายด้วยการอำพราง
- ไม่มีการวิเคราะห์เชิงพฤติกรรม

### 4.3 การปรับปรุงที่วางแผนไว้

| การปรับปรุง             | สถานะ                                  | ผลกระทบ                                                              |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| VirusTotal Integration | กำลังดำเนินการ                         | สูง - การวิเคราะห์พฤติกรรมด้วย Code Insight                          |
| Community Reporting    | บางส่วน (`skillReports` table มีอยู่) | ปานกลาง                                                              |
| Audit Logging          | บางส่วน (`auditLogs` table มีอยู่)    | ปานกลาง                                                              |
| Badge System           | ติดตั้งแล้ว                             | ปานกลาง - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. เมทริกซ์ความเสี่ยง

### 5.1 ความน่าจะเป็นเทียบกับผลกระทบ

| Threat ID     | ความน่าจะเป็น | ผลกระทบ | ระดับความเสี่ยง | ลำดับความสำคัญ |
| ------------- | -------------- | -------- | --------------- | --------------- |
| T-EXEC-001    | สูง            | วิกฤต    | **วิกฤต**       | P0              |
| T-PERSIST-001 | สูง            | วิกฤต    | **วิกฤต**       | P0              |
| T-EXFIL-003   | ปานกลาง        | วิกฤต    | **วิกฤต**       | P0              |
| T-IMPACT-001  | ปานกลาง        | วิกฤต    | **สูง**         | P1              |
| T-EXEC-002    | สูง            | สูง      | **สูง**         | P1              |
| T-EXEC-004    | ปานกลาง        | สูง      | **สูง**         | P1              |
| T-ACCESS-003  | ปานกลาง        | สูง      | **สูง**         | P1              |
| T-EXFIL-001   | ปานกลาง        | สูง      | **สูง**         | P1              |
| T-IMPACT-002  | สูง            | ปานกลาง | **สูง**         | P1              |
| T-EVADE-001   | สูง            | ปานกลาง | **ปานกลาง**    | P2              |
| T-ACCESS-001  | ต่ำ            | สูง      | **ปานกลาง**    | P2              |
| T-ACCESS-002  | ต่ำ            | สูง      | **ปานกลาง**    | P2              |
| T-PERSIST-002 | ต่ำ            | สูง      | **ปานกลาง**    | P2              |

### 5.2 Critical Path Attack Chain

**Attack Chain 1: การขโมยข้อมูลผ่าน Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish Skill อันตราย) → (หลบการกลั่นกรอง) → (เก็บเกี่ยวข้อมูลรับรอง)
```

**Attack Chain 2: Prompt Injection ไปสู่ RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (ข้าม exec approval) → (รันคำสั่ง)
```

**Attack Chain 3: Indirect Injection ผ่านเนื้อหาที่ดึงมา**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(วางยาเนื้อหา URL) → (เอเจนต์ดึงและทำตามคำสั่ง) → (ส่งข้อมูลให้ผู้โจมตี)
```

---

## 6. สรุปข้อเสนอแนะ

### 6.1 ทันที (P0)

| ID    | ข้อเสนอแนะ                                   | รับมือกับ                   |
| ----- | --------------------------------------------- | --------------------------- |
| R-001 | ทำ VirusTotal integration ให้เสร็จสมบูรณ์     | T-PERSIST-001, T-EVADE-001  |
| R-002 | ใช้ sandboxing สำหรับ Skill                   | T-PERSIST-001, T-EXFIL-003  |
| R-003 | เพิ่มการตรวจสอบเอาต์พุตสำหรับการกระทำที่อ่อนไหว | T-EXEC-001, T-EXEC-002      |

### 6.2 ระยะสั้น (P1)

| ID    | ข้อเสนอแนะ                                 | รับมือกับ      |
| ----- | ------------------------------------------ | -------------- |
| R-004 | ใช้ rate limiting                          | T-IMPACT-002   |
| R-005 | เพิ่มการเข้ารหัส token เมื่อเก็บไว้        | T-ACCESS-003   |
| R-006 | ปรับปรุง UX และการตรวจสอบของ exec approval | T-EXEC-004     |
| R-007 | ใช้ URL allowlist สำหรับ web_fetch         | T-EXFIL-001    |

### 6.3 ระยะกลาง (P2)

| ID    | ข้อเสนอแนะ                                           | รับมือกับ       |
| ----- | ---------------------------------------------------- | --------------- |
| R-008 | เพิ่มการยืนยันช่องเชิงเข้ารหัสเมื่อเป็นไปได้          | T-ACCESS-002    |
| R-009 | ใช้การตรวจสอบความสมบูรณ์ของ config                   | T-PERSIST-003   |
| R-010 | เพิ่มการเซ็นการอัปเดตและการ pin เวอร์ชัน              | T-PERSIST-002   |

---

## 7. ภาคผนวก

### 7.1 การแมปเทคนิคของ ATLAS

| ATLAS ID      | ชื่อเทคนิค                     | ภัยคุกคามของ OpenClaw                                            |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                    |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                       |

### 7.2 ไฟล์ความปลอดภัยสำคัญ

| พาธ                                | จุดประสงค์                    | ระดับความเสี่ยง |
| ----------------------------------- | ----------------------------- | --------------- |
| `src/infra/exec-approvals.ts`       | ตรรกะการอนุมัติคำสั่ง         | **วิกฤต**       |
| `src/gateway/auth.ts`               | การยืนยันตัวตนของ Gateway     | **วิกฤต**       |
| `src/infra/net/ssrf.ts`             | การป้องกัน SSRF              | **วิกฤต**       |
| `src/security/external-content.ts`  | การบรรเทา prompt injection    | **วิกฤต**       |
| `src/agents/sandbox/tool-policy.ts` | การบังคับใช้นโยบายของเครื่องมือ | **วิกฤต**     |
| `src/routing/resolve-route.ts`      | การแยกเซสชัน                  | **ปานกลาง**    |

### 7.3 อภิธานศัพท์

| คำศัพท์                | คำจำกัดความ                                                |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS**              | Adversarial Threat Landscape for AI Systems ของ MITRE       |
| **ClawHub**            | ตลาด Skills ของ OpenClaw                                   |
| **Gateway**            | ชั้นการกำหนดเส้นทางข้อความและการยืนยันตัวตนของ OpenClaw   |
| **MCP**                | Model Context Protocol - อินเทอร์เฟซของผู้ให้บริการเครื่องมือ |
| **Prompt Injection**   | การโจมตีที่ฝังคำสั่งอันตรายไว้ในอินพุต                     |
| **Skill**              | ส่วนขยายที่ดาวน์โหลดได้สำหรับเอเจนต์ของ OpenClaw          |
| **SSRF**               | Server-Side Request Forgery                                 |

---

_โมเดลภัยคุกคามนี้เป็นเอกสารที่มีชีวิต รายงานปัญหาด้านความปลอดภัยได้ที่ security@openclaw.ai_
