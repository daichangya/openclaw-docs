---
read_when:
    - กำลังเพิ่มความสามารถที่ขยายการเข้าถึงหรือระบบอัตโนมัติ
summary: ข้อพิจารณาด้านความปลอดภัยและโมเดลภัยคุกคามสำหรับการรัน AI gateway ที่มีสิทธิ์เข้าถึง shell
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-04-23T05:35:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47f524e57500faff35363f656c199e60bf51364f6aeb94114e1a0885ce04b128
    source_path: gateway/security/index.md
    workflow: 15
---

# ความปลอดภัย

<Warning>
**โมเดลความเชื่อถือแบบผู้ช่วยส่วนตัว:** แนวทางนี้ตั้งอยู่บนสมมติฐานว่ามีขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้หนึ่งขอบเขตต่อหนึ่ง gateway (โมเดลผู้ใช้คนเดียว/ผู้ช่วยส่วนตัว)
OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบ multi-tenant ที่ต้านทานผู้ใช้ที่เป็นปฏิปักษ์หลายคนซึ่งใช้ agent/gateway ร่วมกัน
หากคุณต้องการการทำงานแบบหลายระดับความเชื่อถือหรือมีผู้ใช้เชิงปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือ (แยก gateway + ข้อมูลรับรอง และ ideally แยก OS user/host)
</Warning>

**ในหน้านี้:** [โมเดลความเชื่อถือ](#scope-first-personal-assistant-security-model) | [การตรวจสอบอย่างรวดเร็ว](#quick-check-openclaw-security-audit) | [baseline แบบ hardened](#hardened-baseline-in-60-seconds) | [โมเดลการเข้าถึง DM](#dm-access-model-pairing-allowlist-open-disabled) | [การ harden การกำหนดค่า](#configuration-hardening-examples) | [การตอบสนองต่อเหตุการณ์](#incident-response)

## เริ่มจากขอบเขต: โมเดลความปลอดภัยแบบผู้ช่วยส่วนตัว

แนวทางด้านความปลอดภัยของ OpenClaw ตั้งอยู่บนการใช้งานแบบ **ผู้ช่วยส่วนตัว**: หนึ่งขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้ อาจมีหลาย agent

- posture ด้านความปลอดภัยที่รองรับ: หนึ่งผู้ใช้/ขอบเขตความเชื่อถือ ต่อหนึ่ง gateway (ควรเป็นหนึ่ง OS user/host/VPS ต่อหนึ่งขอบเขต)
- ขอบเขตความปลอดภัยที่ไม่รองรับ: หนึ่ง gateway/agent ที่ใช้ร่วมกันโดยผู้ใช้ที่ไม่เชื่อถือกันหรือเป็นปฏิปักษ์ต่อกัน
- หากต้องการการแยกสำหรับผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกตามขอบเขตความเชื่อถือ (แยก gateway + ข้อมูลรับรอง และ ideally แยก OS user/host)
- หากมีผู้ใช้ที่ไม่เชื่อถือกันหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือได้หนึ่งตัว ให้ถือว่าพวกเขาใช้สิทธิ์ของเครื่องมือที่ถูกมอบหมายให้ agent นั้นร่วมกัน

หน้านี้อธิบายการ harden **ภายในโมเดลนี้** ไม่ได้อ้างว่ารองรับการแยกแบบ hostile multi-tenant บน gateway ที่ใช้ร่วมกันหนึ่งตัว

## ตรวจสอบอย่างรวดเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [Formal Verification (Security Models)](/th/security/formal-verification)

รันสิ่งนี้เป็นประจำ (โดยเฉพาะหลังเปลี่ยน config หรือเปิดเผยพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` ถูกตั้งใจให้มีขอบเขตแคบ: มันจะพลิกนโยบายกลุ่มแบบเปิดที่พบบ่อย
ให้เป็น allowlist, คืนค่า `logging.redactSensitive: "tools"`, ทำให้สิทธิ์ของ
state/config/include-file เข้มขึ้น และใช้การรีเซ็ต Windows ACL แทน
POSIX `chmod` เมื่อรันบน Windows

มันจะแจ้ง footgun ทั่วไป (การเปิดเผย auth ของ Gateway, การเปิดเผย browser control, allowlist ของ elevated, สิทธิ์ของไฟล์ระบบ, การอนุมัติ exec ที่ผ่อนปรน, และการเปิดเผยเครื่องมือในช่องทางแบบเปิด)

OpenClaw เป็นทั้งผลิตภัณฑ์และการทดลอง: คุณกำลังเชื่อมพฤติกรรมของโมเดล frontier เข้ากับพื้นผิวการส่งข้อความจริงและเครื่องมือจริง **ไม่มีการตั้งค่าแบบ “ปลอดภัยอย่างสมบูรณ์”** เป้าหมายคือการตั้งใจคิดอย่างรอบคอบเกี่ยวกับ:

- ใครสามารถคุยกับบอตของคุณได้
- บอตได้รับอนุญาตให้ลงมือที่ใด
- บอตสามารถแตะต้องอะไรได้บ้าง

เริ่มจากสิทธิ์น้อยที่สุดที่ยังใช้งานได้ แล้วค่อยขยายเมื่อคุณมั่นใจมากขึ้น

### การ deploy และความเชื่อถือของโฮสต์

OpenClaw ตั้งสมมติฐานว่าโฮสต์และขอบเขต config นั้นเชื่อถือได้:

- หากใครบางคนสามารถแก้ไข state/config ของ Gateway host (`~/.openclaw` รวมถึง `openclaw.json`) ให้ถือว่าบุคคลนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้
- การรัน Gateway หนึ่งตัวสำหรับผู้ปฏิบัติงานหลายคนที่ไม่เชื่อถือกัน/เป็นปฏิปักษ์ต่อกัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีระดับความเชื่อถือปะปนกัน ให้แยกขอบเขตความเชื่อถือด้วย gateway แยกกัน (หรืออย่างน้อยแยก OS user/host)
- ค่าเริ่มต้นที่แนะนำ: หนึ่งผู้ใช้ต่อหนึ่งเครื่อง/โฮสต์ (หรือ VPS), หนึ่ง gateway สำหรับผู้ใช้นั้น และหนึ่งหรือหลาย agent ภายใน gateway นั้น
- ภายในอินสแตนซ์ Gateway เดียว การเข้าถึงของผู้ปฏิบัติงานที่ยืนยันตัวตนแล้วถือเป็นบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาท tenant แยกต่อผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session ID, label) เป็นตัวเลือกสำหรับการกำหนดเส้นทาง ไม่ใช่โทเค็นการอนุญาต
- หากหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือได้หนึ่งตัว แต่ละคนสามารถชี้นำชุดสิทธิ์เดียวกันนั้นได้ การแยก session/memory ต่อผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยน shared agent ให้เป็นการอนุญาตโฮสต์แบบแยกต่อผู้ใช้

### workspace Slack ที่ใช้ร่วมกัน: ความเสี่ยงจริง

หาก "ทุกคนใน Slack สามารถส่งข้อความถึงบอตได้" ความเสี่ยงหลักคือสิทธิ์ของเครื่องมือที่ถูกมอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้สามารถกระตุ้นการเรียกใช้เครื่องมือ (`exec`, browser, เครื่องมือเครือข่าย/ไฟล์) ภายใต้นโยบายของ agent;
- prompt/content injection จากผู้ส่งคนหนึ่งอาจทำให้เกิดการกระทำที่ส่งผลต่อ state อุปกรณ์ หรือเอาต์พุตที่ใช้ร่วมกัน;
- หาก shared agent หนึ่งตัวมีข้อมูลรับรอง/ไฟล์ที่อ่อนไหว ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้อาจขับเคลื่อนการดึงข้อมูลออกผ่านการใช้เครื่องมือได้

ใช้ agent/gateway แยกกันพร้อมเครื่องมือน้อยที่สุดสำหรับเวิร์กโฟลว์ทีม; เก็บ agent ที่เกี่ยวข้องกับข้อมูลส่วนตัวไว้เป็นส่วนตัว

### agent ที่ใช้ร่วมกันในบริษัท: รูปแบบที่ยอมรับได้

สิ่งนี้ยอมรับได้เมื่อทุกคนที่ใช้ agent นั้นอยู่ในขอบเขตความเชื่อถือเดียวกัน (เช่น ทีมหนึ่งในบริษัท) และ agent ถูกจำกัดขอบเขตอย่างเข้มงวดให้ใช้กับงานธุรกิจเท่านั้น

- รันบนเครื่อง/VM/container เฉพาะ;
- ใช้ OS user + browser/profile/accounts เฉพาะสำหรับรันไทม์นั้น;
- อย่าลงชื่อเข้าใช้รันไทม์นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือโปรไฟล์ password-manager/browser ส่วนตัว

หากคุณผสมอัตลักษณ์ส่วนตัวและของบริษัทในรันไทม์เดียวกัน คุณจะทำให้การแยกขอบเขตพังลงและเพิ่มความเสี่ยงการเปิดเผยข้อมูลส่วนตัว

## แนวคิดเรื่องความเชื่อถือของ Gateway และ Node

ให้มอง Gateway และ Node เป็นโดเมนความเชื่อถือของผู้ปฏิบัติงานเดียวกัน แต่มีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวนโยบาย (`gateway.auth`, นโยบายเครื่องมือ, การกำหนดเส้นทาง)
- **Node** คือพื้นผิวการรันระยะไกลที่จับคู่กับ Gateway นั้น (คำสั่ง การกระทำของอุปกรณ์ ความสามารถเฉพาะโฮสต์)
- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วจะได้รับความเชื่อถือในขอบเขตของ Gateway หลังจากจับคู่แล้ว การกระทำของ node ถือเป็นการกระทำของผู้ปฏิบัติงานที่เชื่อถือได้บน node นั้น
- `sessionKey` เป็นการเลือกการกำหนดเส้นทาง/บริบท ไม่ใช่ auth ต่อผู้ใช้
- การอนุมัติ exec (allowlist + ask) เป็น guardrail สำหรับเจตนาของผู้ปฏิบัติงาน ไม่ใช่การแยกแบบ hostile multi-tenant
- ค่าเริ่มต้นของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าแบบผู้ปฏิบัติงานเดียวที่เชื่อถือได้คือ อนุญาต host exec บน `gateway`/`node` โดยไม่ต้องมีพรอมป์อนุมัติ (`security="full"`, `ask="off"` เว้นแต่คุณจะทำให้เข้มขึ้น) ค่าเริ่มต้นนี้เป็น UX ที่ตั้งใจ ไม่ใช่ช่องโหว่โดยตัวมันเอง
- การอนุมัติ exec จะ bind กับบริบทของคำขอที่ตรงกันและ direct local file operand แบบ best-effort; มันไม่ได้จำลองทุกพาธของ runtime/interpreter loader ในเชิงความหมาย ใช้ sandboxing และการแยกโฮสต์สำหรับขอบเขตที่แข็งแรง

หากคุณต้องการการแยกสำหรับผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือด้วย OS user/host และรัน gateway แยกกัน

## เมทริกซ์ขอบเขตความเชื่อถือ

ใช้สิ่งนี้เป็นโมเดลแบบเร็วเมื่อต้อง triage ความเสี่ยง:

| ขอบเขตหรือการควบคุม                                   | ความหมาย                                      | ความเข้าใจผิดที่พบบ่อย                                                     |
| ------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตนผู้เรียกกับ gateway API            | "ต้องมีลายเซ็นต่อข้อความทุก frame จึงจะปลอดภัย"                            |
| `sessionKey`                                           | คีย์การกำหนดเส้นทางสำหรับการเลือกบริบท/เซสชัน | "session key คือขอบเขต auth ของผู้ใช้"                                      |
| prompt/content guardrail                               | ลดความเสี่ยงจากการใช้โมเดลในทางที่ผิด         | "prompt injection เพียงอย่างเดียวพิสูจน์การข้าม auth แล้ว"                  |
| `canvas.eval` / browser evaluate                       | ความสามารถของผู้ปฏิบัติงานที่ตั้งใจให้มีเมื่อเปิดใช้ | "primitive ของ JS eval ใด ๆ เป็นช่องโหว่โดยอัตโนมัติในโมเดลความเชื่อถือนี้" |
| shell `!` ใน TUI แบบ local                            | การรันในเครื่องที่ผู้ปฏิบัติงานกระตุ้นอย่างชัดเจน | "คำสั่ง shell แบบสะดวกในเครื่องคือการฉีดจากระยะไกล"                        |
| การจับคู่ Node และคำสั่งของ Node                       | การรันระยะไกลระดับผู้ปฏิบัติงานบนอุปกรณ์ที่จับคู่แล้ว | "การควบคุมอุปกรณ์ระยะไกลควรถูกมองเป็นการเข้าถึงของผู้ใช้ที่ไม่น่าเชื่อถือโดยค่าเริ่มต้น" |

## สิ่งที่ไม่ถือเป็นช่องโหว่โดยการออกแบบ

รูปแบบเหล่านี้มักถูกรายงาน และโดยทั่วไปจะถูกปิดแบบไม่ดำเนินการ เว้นแต่จะแสดงการข้ามขอบเขตจริงได้:

- ห่วงโซ่ที่อาศัย prompt injection อย่างเดียวโดยไม่มีการข้าม policy/auth/sandbox
- ข้อกล่าวอ้างที่ตั้งอยู่บนสมมติฐานการใช้งานแบบ hostile multi-tenant บนโฮสต์/config ที่ใช้ร่วมกันหนึ่งตัว
- ข้อกล่าวอ้างที่จัดการเข้าถึงแบบอ่านของผู้ปฏิบัติงานตามปกติ (เช่น `sessions.list`/`sessions.preview`/`chat.history`) ให้เป็น IDOR ในการตั้งค่า shared-gateway
- ข้อค้นพบสำหรับการ deploy แบบ localhost-only (เช่น HSTS บน gateway ที่เปิดเฉพาะ loopback)
- ข้อค้นพบเกี่ยวกับลายเซ็น inbound webhook ของ Discord สำหรับ inbound path ที่ไม่มีอยู่ใน repo นี้
- รายงานที่มอง metadata ของการจับคู่ node เป็นชั้นอนุมัติต่อคำสั่งชั้นที่สองแบบซ่อนอยู่สำหรับ `system.run`, ทั้งที่ขอบเขตการรันจริงยังคงเป็นนโยบายคำสั่ง node ส่วนกลางของ gateway รวมถึงการอนุมัติ exec ของ node เอง
- ข้อค้นพบ "ขาดการอนุญาตต่อผู้ใช้" ที่มอง `sessionKey` เป็นโทเค็น auth

## รายการตรวจสอบล่วงหน้าสำหรับนักวิจัย

ก่อนเปิด GHSA ให้ตรวจสอบทั้งหมดนี้:

1. การทำซ้ำยังใช้ได้บน `main` ล่าสุดหรือ release ล่าสุด
2. รายงานมีพาธโค้ดที่แน่นอน (`file`, function, line range) และเวอร์ชัน/commit ที่ทดสอบ
3. ผลกระทบข้ามขอบเขตความเชื่อถือที่มีการบันทึกไว้ (ไม่ใช่เพียง prompt injection)
4. ข้อกล่าวอ้างไม่ได้อยู่ใน [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope)
5. ได้ตรวจ advisories ที่มีอยู่แล้วเพื่อหาความซ้ำ (ใช้ GHSA หลักเดิมเมื่อเกี่ยวข้อง)
6. สมมติฐานการ deploy ถูกระบุไว้อย่างชัดเจน (loopback/local เทียบกับ exposed, ผู้ปฏิบัติงานที่เชื่อถือได้เทียบกับไม่น่าเชื่อถือ)

## baseline แบบ hardened ภายใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิดใช้เครื่องมือกลับทีละส่วนสำหรับ agent ที่เชื่อถือได้:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

สิ่งนี้ทำให้ Gateway เปิดใช้เฉพาะในเครื่อง แยก DM และปิดเครื่องมือฝั่ง control-plane/runtime โดยค่าเริ่มต้น

## กฎแบบเร็วสำหรับกล่องข้อความที่ใช้ร่วมกัน

หากมีมากกว่าหนึ่งคนที่สามารถ DM บอตของคุณได้:

- ตั้งค่า `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางหลายบัญชี)
- ใช้ `dmPolicy: "pairing"` หรือ allowlist แบบเข้มงวด
- อย่ารวม DM ที่ใช้ร่วมกันเข้ากับการเข้าถึงเครื่องมือแบบกว้าง
- สิ่งนี้ช่วย harden กล่องข้อความแบบร่วมมือ/ใช้ร่วมกัน แต่ไม่ได้ออกแบบเป็นการแยก co-tenant แบบ hostile เมื่อผู้ใช้ใช้สิทธิ์เขียนโฮสต์/config ร่วมกัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดนี้ออกจากกัน:

- **การอนุญาตให้ trigger**: ใครสามารถ trigger agent ได้ (`dmPolicy`, `groupPolicy`, allowlist, mention gate)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าไปในอินพุตของโมเดล (เนื้อหาตอบกลับ, ข้อความอ้างอิง, ประวัติเธรด, metadata ของการส่งต่อ)

allowlist ควบคุม trigger และการอนุญาตคำสั่ง การตั้งค่า `contextVisibility` ควบคุมวิธีกรองบริบทเสริม (การตอบกลับแบบอ้างอิง, root ของเธรด, ประวัติที่ดึงมา):

- `contextVisibility: "all"` (ค่าเริ่มต้น) จะคงบริบทเสริมไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ผ่านการตรวจ allowlist ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการอ้างอิงคำตอบแบบชัดเจนไว้หนึ่งรายการ

ตั้งค่า `contextVisibility` ได้ต่อช่องทางหรือต่อห้อง/บทสนทนา ดู [Group Chats](/th/channels/groups#context-visibility-and-allowlists) สำหรับรายละเอียดการตั้งค่า

คำแนะนำในการ triage advisory:

- ข้อกล่าวอ้างที่แสดงเพียงว่า "โมเดลสามารถเห็นข้อความที่อ้างอิงหรือข้อความย้อนหลังจากผู้ส่งที่ไม่อยู่ใน allowlist" เป็นข้อค้นพบเชิง hardening ที่แก้ได้ด้วย `contextVisibility` ไม่ใช่การข้ามขอบเขต auth หรือ sandbox ด้วยตัวมันเอง
- เพื่อให้มีผลกระทบด้านความปลอดภัย รายงานยังคงต้องแสดงการข้ามขอบเขตความเชื่อถือที่พิสูจน์ได้ (auth, policy, sandbox, approval หรือขอบเขตอื่นที่มีการบันทึกไว้)

## สิ่งที่ audit ตรวจสอบ (ระดับสูง)

- **การเข้าถึงขาเข้า** (นโยบาย DM, นโยบายกลุ่ม, allowlist): คนแปลกหน้าสามารถ trigger บอตได้หรือไม่?
- **รัศมีผลกระทบของเครื่องมือ** (เครื่องมือ elevated + ห้องแบบเปิด): prompt injection สามารถกลายเป็นการกระทำต่อ shell/ไฟล์/เครือข่ายได้หรือไม่?
- **drift ของการอนุมัติ exec** (`security=full`, `autoAllowSkills`, allowlist ของ interpreter โดยไม่มี `strictInlineEval`): guardrail ของ host-exec ยังทำงานตามที่คุณคิดอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนเชิง posture แบบกว้าง ไม่ใช่หลักฐานของบั๊ก เป็นค่าเริ่มต้นที่เลือกไว้สำหรับการตั้งค่าแบบผู้ช่วยส่วนตัวที่เชื่อถือได้; ทำให้เข้มขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการ guardrail แบบ approval หรือ allowlist
- **การเปิดเผยต่อเครือข่าย** (Gateway bind/auth, Tailscale Serve/Funnel, โทเค็น auth ที่อ่อนหรือสั้น)
- **การเปิดเผย browser control** (remote node, relay port, remote endpoint ของ CDP)
- **สุขอนามัยของดิสก์ภายในเครื่อง** (สิทธิ์, symlink, include ของ config, พาธแบบ “synced folder”)
- **Plugins** (Plugin โหลดโดยไม่มี allowlist แบบชัดเจน)
- **drift/misconfig ของนโยบาย** (ตั้งค่า sandbox docker ไว้แต่โหมด sandbox ปิดอยู่; รูปแบบ `gateway.nodes.denyCommands` ที่ไม่มีผลเพราะการจับคู่เป็นแบบ exact command-name เท่านั้น (เช่น `system.run`) และไม่ตรวจข้อความ shell; รายการ `gateway.nodes.allowCommands` ที่อันตราย; `tools.profile="minimal"` แบบ global ถูก override ด้วยโปรไฟล์ราย agent; เครื่องมือที่ Plugin เป็นเจ้าของยังเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน)
- **drift ของความคาดหวังรันไทม์** (เช่น คิดว่า implicit exec ยังหมายถึง `sandbox` ในขณะที่ค่าเริ่มต้นของ `tools.exec.host` ตอนนี้เป็น `auto`, หรือกำหนด `tools.exec.host="sandbox"` อย่างชัดเจนในขณะที่โหมด sandbox ปิดอยู่)
- **สุขอนามัยของโมเดล** (เตือนเมื่อโมเดลที่กำหนดค่าดูเป็นแบบเดิม; ไม่ใช่การบล็อกแบบ hard block)

หากคุณรัน `--deep`, OpenClaw จะพยายามทำ live Gateway probe แบบ best-effort เพิ่มเติมด้วย

## แผนผังการเก็บข้อมูลรับรอง

ใช้สิ่งนี้เมื่อกำลังตรวจสอบการเข้าถึงหรือตัดสินใจว่าจะสำรองอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **โทเค็นบอต Telegram**: config/env หรือ `channels.telegram.tokenFile` (รองรับเฉพาะไฟล์ปกติ; ปฏิเสธ symlink)
- **โทเค็นบอต Discord**: config/env หรือ SecretRef (provider แบบ env/file/exec)
- **โทเค็น Slack**: config/env (`channels.slack.*`)
- **allowlist สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **auth profile ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของ secret แบบอิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบเดิม**: `~/.openclaw/credentials/oauth.json`

## รายการตรวจสอบการตรวจสอบความปลอดภัย

เมื่อ audit พิมพ์ข้อค้นพบออกมา ให้จัดลำดับความสำคัญดังนี้:

1. **ทุกอย่างที่เป็น “open” + เปิดใช้เครื่องมือ**: ล็อก DM/กลุ่มก่อน (pairing/allowlist) จากนั้นทำให้นโยบายเครื่องมือ/sandboxing เข้มขึ้น
2. **การเปิดเผยต่อเครือข่ายสาธารณะ** (bind กับ LAN, Funnel, ไม่มี auth): แก้ทันที
3. **การเปิดเผย browser control ระยะไกล**: ให้ปฏิบัติเสมือนเป็นการเข้าถึงของผู้ปฏิบัติงาน (ใช้ tailnet-only, จับคู่ node อย่างตั้งใจ, หลีกเลี่ยงการเปิดสาธารณะ)
4. **สิทธิ์**: ตรวจสอบให้แน่ใจว่า state/config/credentials/auth ไม่เปิดให้อ่านได้สำหรับ group/world
5. **Plugins**: โหลดเฉพาะสิ่งที่คุณเชื่อถืออย่างชัดเจนเท่านั้น
6. **การเลือกโมเดล**: ควรใช้โมเดลสมัยใหม่ที่ hardened ต่อคำสั่ง สำหรับบอตใด ๆ ที่มีเครื่องมือ

## อภิธานศัพท์ของการตรวจสอบความปลอดภัย

ค่า `checkId` ที่มีสัญญาณสูงซึ่งคุณมีแนวโน้มจะเห็นมากที่สุดในการ deploy จริง (ไม่ใช่รายการทั้งหมด):

| `checkId`                                                     | ความรุนแรง    | เหตุผลที่สำคัญ                                                                        | คีย์/พาธหลักสำหรับการแก้ไข                                                                          | แก้อัตโนมัติ |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| `fs.state_dir.perms_world_writable`                           | critical      | ผู้ใช้/โปรเซสอื่นสามารถแก้ไข state ทั้งหมดของ OpenClaw ได้                            | สิทธิ์ของระบบไฟล์บน `~/.openclaw`                                                                    | ได้          |
| `fs.state_dir.perms_group_writable`                           | warn          | ผู้ใช้ในกลุ่มสามารถแก้ไข state ทั้งหมดของ OpenClaw ได้                                 | สิทธิ์ของระบบไฟล์บน `~/.openclaw`                                                                    | ได้          |
| `fs.state_dir.perms_readable`                                 | warn          | ไดเรกทอรี state เปิดให้อื่นอ่านได้                                                     | สิทธิ์ของระบบไฟล์บน `~/.openclaw`                                                                    | ได้          |
| `fs.state_dir.symlink`                                        | warn          | เป้าหมายของไดเรกทอรี state กลายเป็นอีกขอบเขตความเชื่อถือหนึ่ง                         | โครงสร้างระบบไฟล์ของ state dir                                                                      | ไม่ได้       |
| `fs.config.perms_writable`                                    | critical      | ผู้อื่นสามารถเปลี่ยน auth/นโยบายเครื่องมือ/config ได้                                   | สิทธิ์ของระบบไฟล์บน `~/.openclaw/openclaw.json`                                                      | ได้          |
| `fs.config.symlink`                                           | warn          | ไม่รองรับการเขียนไฟล์ config แบบ symlink และเพิ่มอีกขอบเขตความเชื่อถือหนึ่ง           | แทนที่ด้วยไฟล์ config ปกติ หรือชี้ `OPENCLAW_CONFIG_PATH` ไปยังไฟล์จริง                              | ไม่ได้       |
| `fs.config.perms_group_readable`                              | warn          | ผู้ใช้ในกลุ่มสามารถอ่านโทเค็น/การตั้งค่าจาก config ได้                                  | สิทธิ์ของระบบไฟล์บนไฟล์ config                                                                       | ได้          |
| `fs.config.perms_world_readable`                              | critical      | config อาจเปิดเผยโทเค็น/การตั้งค่า                                                     | สิทธิ์ของระบบไฟล์บนไฟล์ config                                                                       | ได้          |
| `fs.config_include.perms_writable`                            | critical      | ผู้อื่นสามารถแก้ไขไฟล์ include ของ config ได้                                           | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json`                                                  | ได้          |
| `fs.config_include.perms_group_readable`                      | warn          | ผู้ใช้ในกลุ่มสามารถอ่าน secret/การตั้งค่าที่ include ได้                                 | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json`                                                  | ได้          |
| `fs.config_include.perms_world_readable`                      | critical      | secret/การตั้งค่าที่ include เปิดให้อ่านได้ทั้งระบบ                                     | สิทธิ์ของไฟล์ include ที่อ้างอิงจาก `openclaw.json`                                                  | ได้          |
| `fs.auth_profiles.perms_writable`                             | critical      | ผู้อื่นสามารถฉีดหรือแทนที่ข้อมูลรับรองของโมเดลที่เก็บไว้ได้                             | สิทธิ์ของ `agents/<agentId>/agent/auth-profiles.json`                                                | ได้          |
| `fs.auth_profiles.perms_readable`                             | warn          | ผู้อื่นสามารถอ่าน API key และ OAuth token ได้                                            | สิทธิ์ของ `agents/<agentId>/agent/auth-profiles.json`                                                | ได้          |
| `fs.credentials_dir.perms_writable`                           | critical      | ผู้อื่นสามารถแก้ไขสถานะ pairing/credential ของช่องทางได้                                | สิทธิ์ของระบบไฟล์บน `~/.openclaw/credentials`                                                        | ได้          |
| `fs.credentials_dir.perms_readable`                           | warn          | ผู้อื่นสามารถอ่านสถานะ credential ของช่องทางได้                                         | สิทธิ์ของระบบไฟล์บน `~/.openclaw/credentials`                                                        | ได้          |
| `fs.sessions_store.perms_readable`                            | warn          | ผู้อื่นสามารถอ่านทรานสคริปต์/metadata ของเซสชันได้                                      | สิทธิ์ของ session store                                                                              | ได้          |
| `fs.log_file.perms_readable`                                  | warn          | ผู้อื่นสามารถอ่านล็อกที่ถูกปกปิดแล้วแต่ยังอาจอ่อนไหวอยู่                                 | สิทธิ์ของไฟล์ล็อกของ gateway                                                                         | ได้          |
| `fs.synced_dir`                                               | warn          | state/config ใน iCloud/Dropbox/Drive ทำให้การเปิดเผยโทเค็น/ทรานสคริปต์กว้างขึ้น         | ย้าย config/state ออกจากโฟลเดอร์ที่ซิงก์อยู่                                                        | ไม่ได้       |
| `gateway.bind_no_auth`                                        | critical      | bind แบบรีโมตโดยไม่มี shared secret                                                     | `gateway.bind`, `gateway.auth.*`                                                                     | ไม่ได้       |
| `gateway.loopback_no_auth`                                    | critical      | loopback ที่ผ่าน reverse proxy อาจกลายเป็นไม่มีการยืนยันตัวตน                           | `gateway.auth.*`, การตั้งค่า proxy                                                                   | ไม่ได้       |
| `gateway.trusted_proxies_missing`                             | warn          | มี header จาก reverse proxy แต่ไม่ได้เชื่อถือ                                            | `gateway.trustedProxies`                                                                             | ไม่ได้       |
| `gateway.http.no_auth`                                        | warn/critical | เข้าถึง Gateway HTTP API ได้โดยใช้ `auth.mode="none"`                                    | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                      | ไม่ได้       |
| `gateway.http.session_key_override_enabled`                   | info          | ผู้เรียก HTTP API สามารถ override `sessionKey` ได้                                        | `gateway.http.allowSessionKeyOverride`                                                               | ไม่ได้       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | เปิดใช้เครื่องมืออันตรายอีกครั้งผ่าน HTTP API                                            | `gateway.tools.allow`                                                                                | ไม่ได้       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | เปิดใช้คำสั่ง node ที่มีผลกระทบสูง (camera/screen/contacts/calendar/SMS)                  | `gateway.nodes.allowCommands`                                                                        | ไม่ได้       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | รายการ deny แบบคล้ายแพตเทิร์นไม่ตรงกับข้อความ shell หรือกลุ่ม                          | `gateway.nodes.denyCommands`                                                                         | ไม่ได้       |
| `gateway.tailscale_funnel`                                    | critical      | เปิดเผยสู่สาธารณะทางอินเทอร์เน็ต                                                        | `gateway.tailscale.mode`                                                                             | ไม่ได้       |
| `gateway.tailscale_serve`                                     | info          | มีการเปิดเผยสู่ tailnet ผ่าน Serve                                                       | `gateway.tailscale.mode`                                                                             | ไม่ได้       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | Control UI ที่ไม่ใช่ loopback โดยไม่มี allowlist ของ browser-origin แบบชัดเจน             | `gateway.controlUi.allowedOrigins`                                                                   | ไม่ได้       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` ปิดการ allowlist ของ browser-origin                                | `gateway.controlUi.allowedOrigins`                                                                   | ไม่ได้       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | เปิดใช้ Host-header origin fallback (ลดระดับการป้องกัน DNS rebinding)                    | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                         | ไม่ได้       |
| `gateway.control_ui.insecure_auth`                            | warn          | เปิดใช้สวิตช์ความเข้ากันได้ของ insecure-auth                                             | `gateway.controlUi.allowInsecureAuth`                                                                | ไม่ได้       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | ปิดการตรวจสอบตัวตนอุปกรณ์                                                                | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                     | ไม่ได้       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | การเชื่อถือ fallback ของ `X-Real-IP` อาจเปิดทางให้ปลอม source-IP ผ่าน proxy misconfig    | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                              | ไม่ได้       |
| `gateway.token_too_short`                                     | warn          | shared token ที่สั้นเดาแบบ brute force ได้ง่ายกว่า                                       | `gateway.auth.token`                                                                                 | ไม่ได้       |
| `gateway.auth_no_rate_limit`                                  | warn          | auth ที่เปิดเผยโดยไม่มี rate limiting เพิ่มความเสี่ยงจาก brute-force                     | `gateway.auth.rateLimit`                                                                             | ไม่ได้       |
| `gateway.trusted_proxy_auth`                                  | critical      | ตอนนี้ตัวตนของ proxy กลายเป็นขอบเขต auth                                                | `gateway.auth.mode="trusted-proxy"`                                                                  | ไม่ได้       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy auth โดยไม่มี IP ของ proxy ที่เชื่อถือได้ไม่ปลอดภัย                        | `gateway.trustedProxies`                                                                             | ไม่ได้       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy auth ไม่สามารถ resolve ตัวตนผู้ใช้ได้อย่างปลอดภัย                          | `gateway.auth.trustedProxy.userHeader`                                                               | ไม่ได้       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy auth ยอมรับผู้ใช้ upstream ที่ยืนยันตัวตนแล้วทุกคน                         | `gateway.auth.trustedProxy.allowUsers`                                                               | ไม่ได้       |
| `checkId`                                                     | ความรุนแรง    | เหตุผลที่สำคัญ                                                                        | คีย์/พาธหลักสำหรับการแก้ไข                                                                          | แก้อัตโนมัติ |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | deep probe ไม่สามารถ resolve auth SecretRef ในพาธคำสั่งนี้ได้                          | แหล่ง auth ของ deep-probe / ความพร้อมของ SecretRef                                                  | ไม่ได้       |
| `gateway.probe_failed`                                        | warn/critical | live Gateway probe ล้มเหลว                                                            | การเข้าถึง/การยืนยันตัวตนของ gateway                                                                | ไม่ได้       |
| `discovery.mdns_full_mode`                                    | warn/critical | โหมดเต็มของ mDNS โฆษณา metadata `cliPath`/`sshPort` บนเครือข่ายภายใน                 | `discovery.mdns.mode`, `gateway.bind`                                                                | ไม่ได้       |
| `config.insecure_or_dangerous_flags`                          | warn          | มีการเปิดใช้แฟล็กดีบักที่ไม่ปลอดภัย/อันตรายใด ๆ                                      | หลายคีย์ (ดูรายละเอียดใน finding)                                                                   | ไม่ได้       |
| `config.secrets.gateway_password_in_config`                   | warn          | รหัสผ่านของ Gateway ถูกเก็บไว้ตรง ๆ ใน config                                         | `gateway.auth.password`                                                                              | ไม่ได้       |
| `config.secrets.hooks_token_in_config`                        | warn          | bearer token ของ hook ถูกเก็บไว้ตรง ๆ ใน config                                       | `hooks.token`                                                                                        | ไม่ได้       |
| `hooks.token_reuse_gateway_token`                             | critical      | hook ingress token ยังใช้ปลดล็อก auth ของ Gateway ได้ด้วย                              | `hooks.token`, `gateway.auth.token`                                                                  | ไม่ได้       |
| `hooks.token_too_short`                                       | warn          | brute force ต่อ hook ingress ได้ง่ายขึ้น                                               | `hooks.token`                                                                                        | ไม่ได้       |
| `hooks.default_session_key_unset`                             | warn          | hook agent fan out ไปยังเซสชันต่อคำขอที่สร้างขึ้นเอง                                  | `hooks.defaultSessionKey`                                                                            | ไม่ได้       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | ผู้เรียก hook ที่ยืนยันตัวตนแล้วสามารถกำหนดเส้นทางไปยัง agent ที่กำหนดค่าไว้ตัวใดก็ได้ | `hooks.allowedAgentIds`                                                                              | ไม่ได้       |
| `hooks.request_session_key_enabled`                           | warn/critical | ผู้เรียกภายนอกสามารถเลือก `sessionKey` ได้                                             | `hooks.allowRequestSessionKey`                                                                       | ไม่ได้       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | ไม่มีการจำกัดรูปแบบของ session key ภายนอก                                             | `hooks.allowedSessionKeyPrefixes`                                                                    | ไม่ได้       |
| `hooks.path_root`                                             | critical      | พาธของ hook เป็น `/` ทำให้ ingress ชนกันหรือกำหนดเส้นทางผิดได้ง่าย                    | `hooks.path`                                                                                         | ไม่ได้       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | เรคคอร์ดการติดตั้ง hook ไม่ถูก pin กับ npm spec แบบ immutable                         | metadata ของการติดตั้ง hook                                                                          | ไม่ได้       |
| `hooks.installs_missing_integrity`                            | warn          | เรคคอร์ดการติดตั้ง hook ขาด metadata ด้าน integrity                                   | metadata ของการติดตั้ง hook                                                                          | ไม่ได้       |
| `hooks.installs_version_drift`                                | warn          | เรคคอร์ดการติดตั้ง hook drift จากแพ็กเกจที่ติดตั้งอยู่                                 | metadata ของการติดตั้ง hook                                                                          | ไม่ได้       |
| `logging.redact_off`                                          | warn          | ค่าที่อ่อนไหวรั่วไหลไปยัง logs/status                                                  | `logging.redactSensitive`                                                                            | ได้          |
| `browser.control_invalid_config`                              | warn          | config ของ browser control ไม่ถูกต้องก่อนรันไทม์                                      | `browser.*`                                                                                          | ไม่ได้       |
| `browser.control_no_auth`                                     | critical      | browser control ถูกเปิดเผยโดยไม่มี token/password auth                                 | `gateway.auth.*`                                                                                     | ไม่ได้       |
| `browser.remote_cdp_http`                                     | warn          | CDP ระยะไกลผ่าน HTTP แบบ plaintext ขาดการเข้ารหัสทรานสปอร์ต                           | `cdpUrl` ของโปรไฟล์ browser                                                                         | ไม่ได้       |
| `browser.remote_cdp_private_host`                             | warn          | CDP ระยะไกลชี้ไปยังโฮสต์ private/internal                                              | `cdpUrl` ของโปรไฟล์ browser, `browser.ssrfPolicy.*`                                                 | ไม่ได้       |
| `sandbox.docker_config_mode_off`                              | warn          | มี config ของ Sandbox Docker อยู่แต่ไม่ได้ใช้งาน                                       | `agents.*.sandbox.mode`                                                                              | ไม่ได้       |
| `sandbox.bind_mount_non_absolute`                             | warn          | bind mount แบบ relative อาจ resolve ได้อย่างคาดเดาไม่ได้                              | `agents.*.sandbox.docker.binds[]`                                                                    | ไม่ได้       |
| `sandbox.dangerous_bind_mount`                                | critical      | เป้าหมาย bind mount ของ sandbox ชี้ไปยังพาธระบบ ข้อมูลรับรอง หรือ Docker socket ที่ถูกบล็อก | `agents.*.sandbox.docker.binds[]`                                                                    | ไม่ได้       |
| `sandbox.dangerous_network_mode`                              | critical      | เครือข่าย Docker ของ sandbox ใช้โหมด `host` หรือ `container:*` แบบ join namespace     | `agents.*.sandbox.docker.network`                                                                    | ไม่ได้       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | seccomp profile ของ sandbox ทำให้การแยก container อ่อนลง                                | `agents.*.sandbox.docker.securityOpt`                                                                | ไม่ได้       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | AppArmor profile ของ sandbox ทำให้การแยก container อ่อนลง                              | `agents.*.sandbox.docker.securityOpt`                                                                | ไม่ได้       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | bridge ของ browser ใน sandbox ถูกเปิดเผยโดยไม่มีการจำกัด source-range                  | `sandbox.browser.cdpSourceRange`                                                                     | ไม่ได้       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | container browser ที่มีอยู่เผยแพร่ CDP บนอินเทอร์เฟซที่ไม่ใช่ loopback                | config การ publish ของ browser sandbox container                                                    | ไม่ได้       |
| `sandbox.browser_container.hash_label_missing`                | warn          | container browser ที่มีอยู่ถูกสร้างก่อน label hash ของ config ปัจจุบัน                  | `openclaw sandbox recreate --browser --all`                                                          | ไม่ได้       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | container browser ที่มีอยู่ถูกสร้างก่อน epoch ของ config browser ปัจจุบัน               | `openclaw sandbox recreate --browser --all`                                                          | ไม่ได้       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` จะ fail closed เมื่อ sandbox ปิดอยู่                                | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | ไม่ได้       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | `exec host=sandbox` ราย agent จะ fail closed เมื่อ sandbox ปิดอยู่                      | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | ไม่ได้       |
| `tools.exec.security_full_configured`                         | warn/critical | host exec กำลังรันด้วย `security="full"`                                               | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | ไม่ได้       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | การอนุมัติ exec เชื่อ trust skill bins โดยปริยาย                                      | `~/.openclaw/exec-approvals.json`                                                                    | ไม่ได้       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | allowlist ของ interpreter อนุญาต inline eval โดยไม่มี forced reapproval                | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, allowlist การอนุมัติ exec | ไม่ได้       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | interpreter/runtime bin ใน `safeBins` ที่ไม่มีโปรไฟล์แบบชัดเจนทำให้ความเสี่ยงของ exec กว้างขึ้น | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                    | ไม่ได้       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | เครื่องมือพฤติกรรมกว้างใน `safeBins` ทำให้โมเดลความเชื่อถือ low-risk stdin-filter อ่อนลง | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                           | ไม่ได้       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` มีไดเรกทอรีที่แก้ไขได้หรือมีความเสี่ยง                           | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                       | ไม่ได้       |
| `skills.workspace.symlink_escape`                             | warn          | `skills/**/SKILL.md` ใน workspace resolve ออกนอก root ของ workspace (symlink-chain drift) | สถานะระบบไฟล์ของ workspace `skills/**`                                                              | ไม่ได้       |
| `plugins.extensions_no_allowlist`                             | warn          | ติดตั้ง Plugin โดยไม่มี allowlist ของ Plugin แบบชัดเจน                                | `plugins.allowlist`                                                                                  | ไม่ได้       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | เรคคอร์ดการติดตั้ง Plugin ไม่ถูก pin กับ npm spec แบบ immutable                       | metadata ของการติดตั้ง Plugin                                                                        | ไม่ได้       |
| `checkId`                                                     | ความรุนแรง    | เหตุผลที่สำคัญ                                                                        | คีย์/พาธหลักสำหรับการแก้ไข                                                                          | แก้อัตโนมัติ |
| ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| `plugins.installs_missing_integrity`                          | warn          | เรคคอร์ดการติดตั้ง Plugin ขาด metadata ด้าน integrity                                | metadata ของการติดตั้ง Plugin                                                                        | ไม่ได้       |
| `plugins.installs_version_drift`                              | warn          | เรคคอร์ดการติดตั้ง Plugin drift จากแพ็กเกจที่ติดตั้งอยู่                              | metadata ของการติดตั้ง Plugin                                                                        | ไม่ได้       |
| `plugins.code_safety`                                         | warn/critical | การสแกนโค้ดของ Plugin พบรูปแบบที่น่าสงสัยหรืออันตราย                                  | โค้ดของ Plugin / แหล่งที่มาของการติดตั้ง                                                            | ไม่ได้       |
| `plugins.code_safety.entry_path`                              | warn          | พาธ entry ของ Plugin ชี้เข้าไปยังตำแหน่งที่ซ่อนอยู่หรืออยู่ใน `node_modules`          | `entry` ใน manifest ของ Plugin                                                                       | ไม่ได้       |
| `plugins.code_safety.entry_escape`                            | critical      | entry ของ Plugin หลุดออกนอกไดเรกทอรีของ Plugin                                       | `entry` ใน manifest ของ Plugin                                                                       | ไม่ได้       |
| `plugins.code_safety.scan_failed`                             | warn          | การสแกนโค้ดของ Plugin ไม่สามารถทำจนเสร็จได้                                           | พาธของ Plugin / สภาพแวดล้อมของการสแกน                                                              | ไม่ได้       |
| `skills.code_safety`                                          | warn/critical | metadata/โค้ดของตัวติดตั้ง skill มีรูปแบบที่น่าสงสัยหรืออันตราย                        | แหล่งที่มาของการติดตั้ง skill                                                                        | ไม่ได้       |
| `skills.code_safety.scan_failed`                              | warn          | การสแกนโค้ดของ skill ไม่สามารถทำจนเสร็จได้                                            | สภาพแวดล้อมของการสแกน skill                                                                        | ไม่ได้       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | ห้องที่ใช้ร่วมกัน/สาธารณะสามารถเข้าถึง agent ที่เปิดใช้ exec ได้                       | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`        | ไม่ได้       |
| `security.exposure.open_groups_with_elevated`                 | critical      | กลุ่มแบบเปิด + เครื่องมือ elevated สร้างพาธ prompt-injection ที่มีผลกระทบสูง          | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | ไม่ได้       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | กลุ่มแบบเปิดสามารถเข้าถึงเครื่องมือคำสั่ง/ไฟล์ได้โดยไม่มี guard ของ sandbox/workspace   | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`    | ไม่ได้       |
| `security.trust_model.multi_user_heuristic`                   | warn          | config ดูเหมือนเป็นแบบหลายผู้ใช้ ทั้งที่โมเดลความเชื่อถือของ gateway เป็นผู้ช่วยส่วนตัว | แยกขอบเขตความเชื่อถือ หรือทำ shared-user hardening (`sandbox.mode`, tool deny/workspace scoping)    | ไม่ได้       |
| `tools.profile_minimal_overridden`                            | warn          | การ override ของ agent ข้าม global minimal profile                                    | `agents.list[].tools.profile`                                                                        | ไม่ได้       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | เครื่องมือของ extension เข้าถึงได้ในบริบทที่ผ่อนปรน                                   | `tools.profile` + tool allow/deny                                                                    | ไม่ได้       |
| `models.legacy`                                               | warn          | ยังมีการกำหนดค่าตระกูลโมเดลแบบเดิมอยู่                                                 | การเลือกโมเดล                                                                                       | ไม่ได้       |
| `models.weak_tier`                                            | warn          | โมเดลที่กำหนดค่าไว้ต่ำกว่าระดับที่แนะนำในปัจจุบัน                                      | การเลือกโมเดล                                                                                       | ไม่ได้       |
| `models.small_params`                                         | critical/info | โมเดลขนาดเล็ก + พื้นผิวเครื่องมือที่ไม่ปลอดภัยเพิ่มความเสี่ยงจากการฉีด                | การเลือกโมเดล + นโยบาย sandbox/เครื่องมือ                                                          | ไม่ได้       |
| `summary.attack_surface`                                      | info          | สรุปรวมของ posture ด้าน auth, channel, tool และการเปิดเผย                              | หลายคีย์ (ดูรายละเอียดใน finding)                                                                   | ไม่ได้       |

## Control UI ผ่าน HTTP

Control UI ต้องใช้ **secure context** (HTTPS หรือ localhost) เพื่อสร้างตัวตนอุปกรณ์
`gateway.controlUi.allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้สำหรับ local:

- บน localhost มันอนุญาต Control UI auth โดยไม่มีตัวตนอุปกรณ์เมื่อหน้า
  ถูกโหลดผ่าน HTTP ที่ไม่ปลอดภัย
- มันไม่ได้ข้ามการตรวจสอบ pairing
- มันไม่ได้ผ่อนปรนข้อกำหนดเรื่องตัวตนอุปกรณ์สำหรับรีโมต (non-localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI บน `127.0.0.1`

สำหรับสถานการณ์ break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบตัวตนอุปกรณ์ทั้งหมด นี่คือการลดระดับความปลอดภัยอย่างรุนแรง;
ควรปิดไว้ เว้นแต่คุณกำลังดีบักอยู่จริงและสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจากแฟล็กอันตรายเหล่านั้น หาก `gateway.auth.mode: "trusted-proxy"` สำเร็จ
ก็สามารถยอมรับเซสชัน Control UI ของ **ผู้ปฏิบัติงาน** โดยไม่มีตัวตนอุปกรณ์ได้ ซึ่งเป็น
พฤติกรรมของโหมด auth ที่ตั้งใจไว้ ไม่ใช่ทางลัดจาก `allowInsecureAuth` และก็ยัง
ไม่ครอบคลุมถึงเซสชัน Control UI แบบ role ของ node

`openclaw security audit` จะเตือนเมื่อเปิดใช้การตั้งค่านี้

## สรุปแฟล็กที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะรวม `config.insecure_or_dangerous_flags` เมื่อ
เปิดใช้สวิตช์ดีบักที่ทราบว่าไม่ปลอดภัย/อันตราย การตรวจสอบนี้ปัจจุบันจะ
รวม:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

คีย์ config แบบ `dangerous*` / `dangerously*` ทั้งหมดที่กำหนดไว้ใน schema
ของ config OpenClaw:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (ช่องทาง Plugin)
- `channels.zalouser.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.irc.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.mattermost.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## การกำหนดค่า Reverse Proxy

หากคุณรัน Gateway หลัง reverse proxy (nginx, Caddy, Traefik เป็นต้น) ให้กำหนดค่า
`gateway.trustedProxies` เพื่อให้จัดการ forwarded-client IP ได้ถูกต้อง

เมื่อ Gateway ตรวจพบ proxy header จากที่อยู่ที่ **ไม่** อยู่ใน `trustedProxies`, มันจะ **ไม่** ปฏิบัติต่อการเชื่อมต่อนั้นเหมือนเป็น local client หากปิด gateway auth การเชื่อมต่อเหล่านั้นจะถูกปฏิเสธ สิ่งนี้ป้องกันการข้ามการยืนยันตัวตนที่การเชื่อมต่อผ่าน proxy อาจดูเหมือนมาจาก localhost และได้รับความเชื่อถือโดยอัตโนมัติ

`gateway.trustedProxies` ยังป้อนให้กับ `gateway.auth.mode: "trusted-proxy"` ด้วย แต่โหมด auth นั้นเข้มงวดกว่า:

- trusted-proxy auth **ล้มเหลวแบบ fail closed เมื่อ proxy ต้นทางเป็น loopback**
- reverse proxy แบบ loopback บนโฮสต์เดียวกันยังคงใช้ `gateway.trustedProxies` เพื่อการตรวจจับ local-client และจัดการ forwarded IP ได้
- สำหรับ reverse proxy แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ token/password auth แทน `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP ของ reverse proxy
  # ไม่บังคับ ค่าเริ่มต้น false
  # เปิดใช้เฉพาะเมื่อ proxy ของคุณไม่สามารถให้ X-Forwarded-For ได้
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

เมื่อกำหนดค่า `trustedProxies` ไว้ Gateway จะใช้ `X-Forwarded-For` เพื่อระบุ client IP ส่วน `X-Real-IP` จะถูกละเลยโดยค่าเริ่มต้น เว้นแต่จะตั้ง `gateway.allowRealIpFallback: true` อย่างชัดเจน

พฤติกรรม reverse proxy ที่ดี (เขียนทับ forwarding header ขาเข้าทั้งหมด):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรม reverse proxy ที่ไม่ดี (ต่อท้าย/คง forwarding header ที่ไม่น่าเชื่อถือไว้):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุเรื่อง HSTS และ origin

- OpenClaw gateway เน้น local/loopback ก่อน หากคุณ terminate TLS ที่ reverse proxy ให้ตั้ง HSTS ที่โดเมน HTTPS ฝั่ง proxy นั้น
- หาก gateway เองเป็นผู้ terminate HTTPS คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อให้ OpenClaw ส่ง HSTS header จาก response ของตัวเองได้
- คำแนะนำการ deploy แบบละเอียดอยู่ใน [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับการ deploy Control UI ที่ไม่ใช่ loopback ต้องกำหนด `gateway.controlUi.allowedOrigins` โดยค่าเริ่มต้น
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบาย browser-origin แบบ allow-all อย่างชัดเจน ไม่ใช่ค่าเริ่มต้นแบบ hardened หลีกเลี่ยงการใช้ยกเว้นการทดสอบ local ที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวของ browser-origin auth บน loopback ยังคงถูกจำกัดอัตราแม้ว่า
  จะเปิดการยกเว้น loopback ทั่วไปไว้ แต่คีย์สำหรับการ lockout จะมีขอบเขตต่อ
  ค่า `Origin` ที่ normalize แล้ว แทนที่จะใช้ bucket localhost ร่วมกันหนึ่งชุด
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดโหมด Host-header origin fallback; ให้ถือว่าเป็นนโยบายอันตรายที่ผู้ปฏิบัติงานเลือกเอง
- ให้ถือว่า DNS rebinding และพฤติกรรม host header ของ proxy เป็นข้อกังวลด้านการ harden ในการ deploy; กำหนด `trustedProxies` ให้แคบ และหลีกเลี่ยงการเปิด gateway สู่สาธารณะโดยตรง

## ล็อกเซสชันในเครื่องอยู่บนดิสก์

OpenClaw เก็บทรานสคริปต์ของเซสชันไว้บนดิสก์ใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
สิ่งนี้จำเป็นสำหรับความต่อเนื่องของเซสชันและ (แบบไม่บังคับ) การทำดัชนีหน่วยความจำของเซสชัน แต่ก็หมายความว่า
**โปรเซส/ผู้ใช้ใดก็ตามที่เข้าถึงระบบไฟล์ได้สามารถอ่านล็อกเหล่านั้นได้** ให้ถือว่าการเข้าถึงดิสก์คือขอบเขต
ความเชื่อถือ และล็อกสิทธิ์ของ `~/.openclaw` ให้แน่น (ดูส่วน audit ด้านล่าง) หากคุณต้องการ
การแยกที่เข้มกว่านี้ระหว่าง agent ให้รันภายใต้ OS user แยกกันหรือโฮสต์แยกกัน

## การรันบน Node (`system.run`)

หากมีการจับคู่ macOS node แล้ว Gateway สามารถเรียก `system.run` บน node นั้นได้ นี่คือ **การรันโค้ดจากระยะไกล** บน Mac:

- ต้องมีการจับคู่ node (การอนุมัติ + โทเค็น)
- การจับคู่ node ของ Gateway ไม่ใช่พื้นผิวการอนุมัติต่อคำสั่ง แต่เป็นการสร้างตัวตน/ความเชื่อถือของ node และการออกโทเค็น
- Gateway ใช้นโยบายคำสั่ง node ส่วนกลางแบบหยาบผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **Settings → Exec approvals** (security + ask + allowlist)
- นโยบาย `system.run` ต่อ node คือไฟล์อนุมัติ exec ของ node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มหรือผ่อนกว่านโยบาย command-ID ส่วนกลางของ gateway
- node ที่รันด้วย `security="full"` และ `ask="off"` กำลังทำตามโมเดลผู้ปฏิบัติงานที่เชื่อถือได้ซึ่งเป็นค่าเริ่มต้น ให้ถือว่านี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่การ deploy ของคุณจะต้องการ posture แบบ approval หรือ allowlist ที่เข้มกว่านี้โดยชัดแจ้ง
- โหมด approval จะ bind กับบริบทของคำขอที่ตรงกัน และเมื่อเป็นไปได้ จะ bind กับ script/file ในเครื่องที่เป็นรูปธรรมเพียงรายการเดียว หาก OpenClaw ไม่สามารถระบุไฟล์ท้องถิ่นตรงหนึ่งรายการได้อย่างชัดเจนสำหรับคำสั่ง interpreter/runtime การรันที่อาศัย approval จะถูกปฏิเสธ แทนที่จะรับประกันความครอบคลุมเชิงความหมายทั้งหมด
- สำหรับ `host=node`, การรันที่อาศัย approval จะจัดเก็บ `systemRunPlan` แบบ canonical ที่เตรียมไว้ด้วย
  การส่งต่อที่ได้รับอนุมัติในภายหลังจะนำแผนที่เก็บไว้นั้นกลับมาใช้ และ gateway
  validation จะปฏิเสธการแก้ไข command/cwd/session context ของผู้เรียก
  หลังจากที่มีการสร้างคำขออนุมัติแล้ว
- หากคุณไม่ต้องการการรันจากระยะไกล ให้ตั้งค่า security เป็น **deny** และลบการจับคู่ node ของ Mac นั้น

ความแตกต่างนี้สำคัญต่อการ triage:

- node ที่จับคู่แล้วเชื่อมต่อใหม่และโฆษณารายการคำสั่งที่ต่างออกไป ไม่ใช่ช่องโหว่โดยตัวมันเอง หากนโยบายส่วนกลางของ Gateway และการอนุมัติ exec ภายในเครื่องของ node ยังคงบังคับใช้ขอบเขตการรันจริงอยู่
- รายงานที่มอง metadata ของการจับคู่ node เป็นชั้นอนุมัติต่อคำสั่งแบบซ่อนอยู่อีกชั้นหนึ่ง มักเป็นความสับสนด้านนโยบาย/UX ไม่ใช่การข้ามขอบเขตความปลอดภัย

## Skills แบบไดนามิก (watcher / remote node)

OpenClaw สามารถรีเฟรชรายการ Skills ระหว่างเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลงใน `SKILL.md` สามารถอัปเดต snapshot ของ Skills ได้ในเทิร์นถัดไปของ agent
- **Remote node**: การเชื่อมต่อ macOS node สามารถทำให้ Skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้ (อิงจากการ probe ไบนารี)

ให้ถือว่าโฟลเดอร์ skill เป็น **โค้ดที่เชื่อถือได้** และจำกัดผู้ที่สามารถแก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- รันคำสั่ง shell ตามอำเภอใจ
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความถึงใครก็ได้ (หากคุณให้สิทธิ์เข้าถึง WhatsApp)

คนที่ส่งข้อความถึงคุณสามารถ:

- พยายามหลอก AI ของคุณให้ทำสิ่งไม่ดี
- ใช้วิศวกรรมสังคมเพื่อเข้าถึงข้อมูลของคุณ
- probing เพื่อหาข้อมูลโครงสร้างพื้นฐาน

## แนวคิดหลัก: ควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่การโจมตีซับซ้อน — แต่คือ “มีคนส่งข้อความถึงบอต แล้วบอตก็ทำตามที่ถูกขอ”

จุดยืนของ OpenClaw:

- **ตัวตนมาก่อน:** ตัดสินใจก่อนว่าใครสามารถคุยกับบอตได้ (DM pairing / allowlist / “open” แบบชัดเจน)
- **ขอบเขตถัดมา:** ตัดสินใจว่าบอตได้รับอนุญาตให้ลงมือที่ใด (allowlist ของกลุ่ม + mention gating, เครื่องมือ, sandboxing, สิทธิ์ของอุปกรณ์)
- **โมเดลเป็นลำดับสุดท้าย:** ถือว่าโมเดลสามารถถูกชักจูงได้; ออกแบบให้การชักจูงมีรัศมีผลกระทบจำกัด

## โมเดลการอนุญาตคำสั่ง

Slash command และ directive จะได้รับการยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** การอนุญาตถูกอนุมานจาก
allowlist/pairing ของช่องทาง บวกกับ `commands.useAccessGroups` (ดู [Configuration](/th/gateway/configuration)
และ [Slash commands](/th/tools/slash-commands)) หาก allowlist ของช่องทางว่างหรือมี `"*"`,
คำสั่งจะเปิดอย่างมีผลสำหรับช่องทางนั้น

`/exec` เป็นเพียงทางลัดระดับเซสชันสำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต มัน **ไม่** เขียน config หรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของเครื่องมือฝั่ง control plane

มีเครื่องมือ built-in สองตัวที่สามารถทำการเปลี่ยนแปลงถาวรใน control plane ได้:

- `gateway` สามารถตรวจสอบ config ด้วย `config.schema.lookup` / `config.get` และสามารถทำการเปลี่ยนแปลงถาวรด้วย `config.apply`, `config.patch`, และ `update.run`
- `cron` สามารถสร้าง job ที่จัดตารางไว้ซึ่งยังคงทำงานต่อหลังจากแชต/งานต้นฉบับสิ้นสุดแล้ว

เครื่องมือรันไทม์ `gateway` แบบ owner-only ยังคงปฏิเสธการเขียน
`tools.exec.ask` หรือ `tools.exec.security`; alias แบบเดิมของ `tools.bash.*` จะถูก
normalize ไปยังพาธ exec ที่ได้รับการปกป้องแบบเดียวกันก่อนการเขียน

สำหรับ agent/พื้นผิวใดก็ตามที่จัดการกับเนื้อหาที่ไม่น่าเชื่อถือ ให้ deny สิ่งเหล่านี้โดยค่าเริ่มต้น:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` บล็อกเฉพาะการกระทำรีสตาร์ต มันไม่ได้ปิดการทำงาน `gateway` สำหรับ config/update

## Plugins

Plugin ทำงาน **ในโปรเซสเดียวกัน** กับ Gateway ให้ถือว่ามันเป็นโค้ดที่เชื่อถือได้:

- ติดตั้ง Plugin เฉพาะจากแหล่งที่คุณเชื่อถือ
- ควรใช้ allowlist แบบชัดเจนด้วย `plugins.allow`
- ตรวจทาน config ของ Plugin ก่อนเปิดใช้
- รีสตาร์ต Gateway หลังเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugin (`openclaw plugins install <package>`, `openclaw plugins update <id>`), ให้ถือว่าเหมือนกำลังรันโค้ดที่ไม่น่าเชื่อถือ:
  - พาธการติดตั้งคือไดเรกทอรีต่อ Plugin ภายใต้ root การติดตั้ง Plugin ที่ใช้งานอยู่
  - OpenClaw รันการสแกนโค้ดอันตรายแบบ built-in ก่อนติดตั้ง/อัปเดต finding ระดับ `critical` จะถูกบล็อกโดยค่าเริ่มต้น
  - OpenClaw ใช้ `npm pack` แล้วรัน `npm install --omit=dev` ในไดเรกทอรีนั้น (npm lifecycle script สามารถรันโค้ดระหว่างการติดตั้งได้)
  - ควรใช้เวอร์ชันที่ pin แบบ exact (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่ถูก unpack ลงบนดิสก์ก่อนเปิดใช้
  - `--dangerously-force-unsafe-install` ใช้เฉพาะกรณี break-glass สำหรับ false positive จากการสแกน built-in ในโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น มันไม่ข้ามการบล็อกจากนโยบาย hook `before_install` ของ Plugin และไม่ข้ามความล้มเหลวของการสแกน
  - การติดตั้ง dependency ของ skill ที่ขับเคลื่อนโดย Gateway ใช้การแยก dangerous/suspicious แบบเดียวกัน: finding ระดับ `critical` ของ built-in จะถูกบล็อก เว้นแต่ผู้เรียกจะตั้ง `dangerouslyForceUnsafeInstall` อย่างชัดเจน ขณะที่ finding แบบ suspicious ยังคงเป็นเพียงคำเตือน `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill จาก ClawHub แยกต่างหาก

รายละเอียด: [Plugins](/th/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## โมเดลการเข้าถึง DM (pairing / allowlist / open / disabled)

ทุกช่องทางปัจจุบันที่รองรับ DM รองรับ DM policy (`dmPolicy` หรือ `*.dm.policy`) ซึ่งควบคุม DM ขาเข้า **ก่อน** ที่ข้อความจะถูกประมวลผล:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับโค้ด pairing แบบสั้น และบอตจะเพิกเฉยต่อข้อความของพวกเขาจนกว่าจะได้รับการอนุมัติ โค้ดหมดอายุหลัง 1 ชั่วโมง; DM ซ้ำจะไม่ส่งโค้ดอีกจนกว่าจะมีคำขอใหม่ จำนวนคำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง** โดยค่าเริ่มต้น
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มี pairing handshake)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM (สาธารณะ) **ต้อง** ให้ allowlist ของช่องทางมี `"*"` (เป็นการเลือกเปิดใช้อย่างชัดเจน)
- `disabled`: ไม่สนใจ DM ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [Pairing](/th/channels/pairing)

## การแยกเซสชันของ DM (โหมดหลายผู้ใช้)

โดยค่าเริ่มต้น OpenClaw จะกำหนดเส้นทาง **DM ทั้งหมดไปยังเซสชันหลัก** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทาง หาก **มีหลายคน** ที่สามารถส่ง DM ถึงบอตได้ (DM แบบเปิดหรือ allowlist หลายคน) ให้พิจารณาแยกเซสชันของ DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

สิ่งนี้ป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะที่ยังคงให้แชตกลุ่มแยกจากกัน

นี่คือขอบเขตของบริบทการส่งข้อความ ไม่ใช่ขอบเขตผู้ดูแลโฮสต์ หากผู้ใช้เป็นปฏิปักษ์ต่อกันและใช้ Gateway host/config ร่วมกัน ให้รัน gateway แยกต่อขอบเขตความเชื่อถือแทน

### โหมด DM ที่ปลอดภัย (แนะนำ)

ให้ถือว่า snippet ด้านบนคือ **โหมด DM ที่ปลอดภัย**:

- ค่าเริ่มต้น: `session.dmScope: "main"` (DM ทั้งหมดใช้เซสชันเดียวกันเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของ local CLI onboarding: เขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า (คงค่าที่ตั้งไว้อย่างชัดเจนเดิมไว้)
- โหมด DM ที่ปลอดภัย: `session.dmScope: "per-channel-peer"` (คู่ของช่องทาง+ผู้ส่งแต่ละคู่จะได้บริบท DM ที่แยกจากกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (ผู้ส่งแต่ละคนจะได้หนึ่งเซสชันข้ามทุกช่องทางชนิดเดียวกัน)

หากคุณรันหลายบัญชีบนช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากบุคคลเดียวกันติดต่อคุณจากหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวมเซสชัน DM เหล่านั้นเป็นตัวตน canonical เดียว ดู [Session Management](/th/concepts/session) และ [Configuration](/th/gateway/configuration)

## Allowlists (DM + กลุ่ม) - คำศัพท์

OpenClaw มีสองชั้น “ใครสามารถ trigger ฉันได้?” ที่แยกจากกัน:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; แบบเดิม: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครบ้างที่ได้รับอนุญาตให้คุยกับบอตใน direct message
  - เมื่อ `dmPolicy="pairing"`, การอนุมัติจะถูกเขียนลงใน pairing allowlist store แบบขอบเขตต่อบัญชีใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีเริ่มต้น, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น) และรวมเข้ากับ allowlist จาก config
- **Group allowlist** (เฉพาะช่องทาง): กลุ่ม/ช่องทาง/guild ใดบ้างที่บอตจะยอมรับข้อความเข้ามาเลย
  - รูปแบบที่พบบ่อย:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นต่อกลุ่ม เช่น `requireMention`; เมื่อกำหนดค่าไว้ มันยังทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรม allow-all)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถ trigger บอต _ภายใน_ เซสชันของกลุ่ม (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlist ต่อพื้นผิว + ค่าเริ่มต้นเรื่อง mention
  - การตรวจสอบกลุ่มรันตามลำดับนี้: `groupPolicy`/group allowlist ก่อน, การกระตุ้นด้วย mention/reply ตามมาเป็นลำดับที่สอง
  - การตอบกลับข้อความของบอต (implicit mention) **ไม่** ข้าม allowlist ของผู้ส่ง เช่น `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้ถือว่า `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรใช้น้อยมาก; ควรใช้ pairing + allowlist เว้นแต่คุณจะเชื่อถือทุกคนในห้องนั้นอย่างเต็มที่

รายละเอียด: [Configuration](/th/gateway/configuration) และ [Groups](/th/channels/groups)

## Prompt injection (มันคืออะไร และทำไมจึงสำคัญ)

Prompt injection คือเมื่อผู้โจมตีสร้างข้อความที่ชักจูงโมเดลให้ทำสิ่งที่ไม่ปลอดภัย (“เพิกเฉยต่อคำสั่งของคุณ”, “dump ระบบไฟล์ของคุณ”, “เปิดลิงก์นี้และรันคำสั่ง” เป็นต้น)

แม้จะมี system prompt ที่แข็งแรง **prompt injection ก็ยังไม่ใช่ปัญหาที่ถูกแก้แล้ว** guardrail ใน system prompt เป็นเพียงคำแนะนำแบบ soft; การบังคับใช้จริงมาจากนโยบายเครื่องมือ การอนุมัติ exec, sandboxing และ allowlist ของช่องทาง (และผู้ปฏิบัติงานสามารถปิดสิ่งเหล่านี้ได้โดยการออกแบบ) สิ่งที่ช่วยได้ในทางปฏิบัติ:

- ล็อก DM ขาเข้าให้แน่น (pairing/allowlist)
- ควรใช้ mention gating ในกลุ่ม; หลีกเลี่ยงบอตแบบ “always-on” ในห้องสาธารณะ
- ให้ถือว่าลิงก์ ไฟล์แนบ และคำสั่งที่วางเข้ามาเป็นสิ่งที่เป็นปฏิปักษ์โดยค่าเริ่มต้น
- รันการใช้เครื่องมือที่อ่อนไหวใน sandbox; เก็บ secret ให้อยู่นอกระบบไฟล์ที่ agent เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบเลือกเปิดใช้ หากปิดโหมด sandbox, `host=auto` แบบ implicit จะ resolve ไปยังโฮสต์ของ gateway ส่วน `host=sandbox` แบบชัดเจนจะยัง fail closed เพราะไม่มี sandbox runtime ให้ใช้ ตั้ง `host=gateway` หากคุณต้องการให้พฤติกรรมนั้นชัดเจนใน config
- จำกัดเครื่องมือความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ไว้เฉพาะ agent ที่เชื่อถือได้หรือ allowlist แบบชัดเจน
- หากคุณใช้ allowlist สำหรับ interpreter (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- การวิเคราะห์การอนุมัติของ shell ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **heredoc ที่ไม่ถูก quote** ด้วย ดังนั้นเนื้อหา heredoc ที่อยู่ใน allowlist จะไม่สามารถลักลอบขยาย shell ผ่านการตรวจสอบ allowlist โดยปลอมเป็นข้อความธรรมดาได้ ให้ quote ตัวปิด heredoc (เช่น `<<'EOF'`) เพื่อเลือกรูปแบบเนื้อหาตามตัวอักษร; heredoc ที่ไม่ถูก quote และจะมีการขยายตัวแปรจะถูกปฏิเสธ
- **การเลือกโมเดลมีผล:** โมเดลรุ่นเก่า/ขนาดเล็ก/แบบเดิมมีความแข็งแรงต่อ prompt injection และการใช้เครื่องมือผิดทางต่ำกว่ามาก สำหรับ agent ที่เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแรงต่อคำสั่งเท่าที่มีให้ใช้

สัญญาณอันตรายที่ควรถือว่าไม่น่าเชื่อถือ:

- “อ่านไฟล์/URL นี้แล้วทำตามทุกอย่างที่มันบอก”
- “เพิกเฉยต่อ system prompt หรือกฎความปลอดภัยของคุณ”
- “เปิดเผยคำสั่งที่ซ่อนไว้หรือเอาต์พุตของเครื่องมือ”
- “วางเนื้อหาทั้งหมดของ ~/.openclaw หรือ logs ของคุณ”

## การทำความสะอาด special token ของเนื้อหาภายนอก

OpenClaw จะลบ literal ของ special token ใน chat template ที่พบบ่อยของ self-hosted LLM ออกจากเนื้อหาภายนอกและ metadata ที่ถูกห่อก่อนที่จะไปถึงโมเดล ครอบคลุม marker family เช่น Qwen/ChatML, Llama, Gemma, Mistral, Phi และ token บทบาท/เทิร์นของ GPT-OSS

เหตุผล:

- backend แบบ OpenAI-compatible ที่ทำหน้ากับโมเดล self-hosted บางครั้งยังคงเก็บ special token ที่ปรากฏในข้อความของผู้ใช้ไว้ แทนที่จะ mask ทิ้ง ผู้โจมตีที่สามารถเขียนเข้าไปในเนื้อหาภายนอกขาเข้าได้ (หน้าเว็บที่ดึงมา, เนื้อหาอีเมล, เอาต์พุตจากเครื่องมืออ่านไฟล์) อาจฉีดขอบเขตบทบาท `assistant` หรือ `system` ปลอมและหลุดออกจาก guardrail ของ wrapped-content ได้
- การทำความสะอาดเกิดขึ้นที่เลเยอร์การห่อเนื้อหาภายนอก ดังนั้นจึงใช้ได้สม่ำเสมอข้ามเครื่องมือ fetch/read และเนื้อหาขาเข้าจากช่องทาง แทนที่จะต้องทำแยกตาม provider
- การตอบกลับขาออกของโมเดลมี sanitizer แยกต่างหากอยู่แล้วซึ่งลบ `<tool_call>`, `<function_calls>` และ scaffolding ที่คล้ายกันออกจากข้อความตอบกลับที่ผู้ใช้มองเห็น ตัวทำความสะอาดเนื้อหาภายนอกคือตัวคู่กันสำหรับขาเข้า

สิ่งนี้ไม่ได้แทนที่การ harden อื่น ๆ ในหน้านี้ — `dmPolicy`, allowlist, การอนุมัติ exec, sandboxing และ `contextVisibility` ยังคงทำหน้าที่หลัก มันเพียงปิดช่องทางข้ามชั้น tokenizer แบบหนึ่งสำหรับสแตก self-hosted ที่ส่งต่อข้อความผู้ใช้พร้อม special token แบบไม่แตะต้อง

## แฟล็กข้ามการป้องกันเนื้อหาภายนอกที่ไม่ปลอดภัย

OpenClaw มีแฟล็ก bypass แบบชัดเจนที่ปิดการห่อความปลอดภัยของเนื้อหาภายนอก:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- ฟิลด์ payload ของ Cron `allowUnsafeExternalContent`

คำแนะนำ:

- คงค่าเหล่านี้เป็น unset/false ใน production
- เปิดใช้ชั่วคราวเฉพาะสำหรับการดีบักที่มีขอบเขตจำกัดมากเท่านั้น
- หากเปิดใช้ ให้แยก agent นั้นออก (sandbox + เครื่องมือน้อยที่สุด + namespace ของเซสชันเฉพาะ)

หมายเหตุความเสี่ยงของ Hooks:

- payload ของ hook คือเนื้อหาที่ไม่น่าเชื่อถือ แม้การส่งจะมาจากระบบที่คุณควบคุม (อีเมล/เอกสาร/เนื้อหาเว็บก็สามารถมี prompt injection ได้)
- โมเดลระดับอ่อนจะเพิ่มความเสี่ยงนี้ สำหรับ automation ที่ขับเคลื่อนด้วย hook ควรใช้โมเดลสมัยใหม่ที่แข็งแรง และคงนโยบายเครื่องมือให้แน่น (`tools.profile: "messaging"` หรือเข้มกว่านั้น) พร้อม sandboxing เมื่อเป็นไปได้

### Prompt injection ไม่จำเป็นต้องมี DM สาธารณะ

แม้ว่า **มีเพียงคุณเท่านั้น** ที่ส่งข้อความถึงบอตได้ prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่น่าเชื่อถือ** ใด ๆ ที่บอตอ่าน (ผลลัพธ์จาก web search/fetch, หน้า browser,
อีเมล, เอกสาร, ไฟล์แนบ, ล็อก/โค้ดที่วางเข้ามา) กล่าวอีกอย่างคือ: ผู้ส่งไม่ใช่พื้นผิวภัยคุกคามเพียงอย่างเดียว;
**ตัวเนื้อหาเอง** ก็สามารถมีคำสั่งที่เป็นปฏิปักษ์ได้

เมื่อเปิดใช้เครื่องมือ ความเสี่ยงทั่วไปคือการดึงบริบทออกหรือการ trigger
การเรียกใช้เครื่องมือ ลดรัศมีผลกระทบได้โดย:

- ใช้ **reader agent** ที่อ่านอย่างเดียวหรือปิดใช้เครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
  แล้วค่อยส่งสรุปนั้นไปยัง agent หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้เครื่องมือ เว้นแต่จำเป็น
- สำหรับอินพุต URL ของ OpenResponses (`input_file` / `input_image`) ให้ตั้ง
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้แคบ และตั้ง `maxUrlParts` ให้ต่ำ
  allowlist ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากคุณต้องการปิดการดึง URL ทั้งหมด
- สำหรับอินพุตไฟล์ของ OpenResponses ข้อความ `input_file` ที่ถูกถอดรหัสแล้วยังคงถูกฉีดเป็น
  **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** อย่าถือว่าข้อความจากไฟล์เชื่อถือได้เพียงเพราะ
  Gateway ถอดรหัสในเครื่อง บล็อกที่ถูกฉีดยังคงมี marker ขอบเขต
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` แบบชัดเจนพร้อม metadata `Source: External`
  แม้พาธนี้จะละแบนเนอร์ `SECURITY NOTICE:` ที่ยาวกว่าออกไป
- การห่อด้วย marker แบบเดียวกันนี้ถูกใช้เมื่อ media-understanding ดึงข้อความ
  จากเอกสารแนบก่อนจะต่อข้อความนั้นเข้ากับ media prompt
- เปิดใช้ sandboxing และ allowlist ของเครื่องมือแบบเข้มสำหรับ agent ใดก็ตามที่แตะอินพุตที่ไม่น่าเชื่อถือ
- เก็บ secret ไว้นอกพรอมป์; ส่งผ่าน env/config บนโฮสต์ gateway แทน

### backend LLM แบบ self-hosted

backend แบบ self-hosted ที่เข้ากันได้กับ OpenAI เช่น vLLM, SGLang, TGI, LM Studio,
หรือสแตก tokenizer ของ Hugging Face แบบกำหนดเอง อาจแตกต่างจาก provider ที่โฮสต์ไว้ในวิธีที่
special token ของ chat template ถูกจัดการ หาก backend ทำการ tokenize สตริงตามตัวอักษร
เช่น `<|im_start|>`, `<|start_header_id|>`, หรือ `<start_of_turn>` ให้เป็น
token โครงสร้างของ chat template ภายในเนื้อหาของผู้ใช้ ข้อความที่ไม่น่าเชื่อถืออาจพยายาม
ปลอมขอบเขตของบทบาทในชั้น tokenizer ได้

OpenClaw จะลบ literal ของ special token ที่พบบ่อยในตระกูลโมเดลออกจาก
เนื้อหาภายนอกที่ถูกห่อ ก่อนส่งไปยังโมเดล คงการห่อ
เนื้อหาภายนอกไว้ และควรใช้การตั้งค่า backend ที่แยกหรือ escape special
token ในเนื้อหาที่ผู้ใช้ส่งมา เมื่อมีให้ใช้ provider ที่โฮสต์ไว้ เช่น OpenAI
และ Anthropic ใช้การทำความสะอาดฝั่งคำขอของตัวเองอยู่แล้ว

### ความแข็งแรงของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่ได้เท่ากันในทุกระดับของโมเดล** โมเดลที่เล็กกว่า/ราคาถูกกว่ามักจะเสี่ยงต่อการใช้เครื่องมือผิดทางและการยึดคำสั่งมากกว่า โดยเฉพาะเมื่อเจอกับพรอมป์เชิงปฏิปักษ์

<Warning>
สำหรับ agent ที่เปิดใช้เครื่องมือ หรือ agent ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ ความเสี่ยงจาก prompt injection กับโมเดลที่เก่ากว่า/เล็กกว่ามักจะสูงเกินไป อย่ารันงานเหล่านั้นบนโมเดลระดับอ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดลรุ่นล่าสุดระดับสูงสุดที่ดีที่สุด** สำหรับบอตใด ๆ ที่สามารถรันเครื่องมือหรือแตะต้องไฟล์/เครือข่ายได้
- **อย่าใช้ระดับที่เก่ากว่า/อ่อนกว่า/เล็กกว่า** สำหรับ agent ที่เปิดใช้เครื่องมือหรือกล่องข้อความที่ไม่น่าเชื่อถือ; ความเสี่ยงจาก prompt injection สูงเกินไป
- หากจำเป็นต้องใช้โมเดลขนาดเล็ก ให้ **ลดรัศมีผลกระทบ** (เครื่องมืออ่านอย่างเดียว, sandboxing ที่เข้ม, การเข้าถึงระบบไฟล์ให้น้อยที่สุด, allowlist ที่เข้มงวด)
- เมื่อรันโมเดลขนาดเล็ก ให้ **เปิดใช้ sandboxing สำหรับทุกเซสชัน** และ **ปิด web_search/web_fetch/browser** เว้นแต่อินพุตจะถูกควบคุมอย่างเข้มงวด
- สำหรับผู้ช่วยส่วนตัวแบบแชตอย่างเดียวที่มีอินพุตน่าเชื่อถือและไม่มีเครื่องมือ โมเดลขนาดเล็กมักเพียงพอ

<a id="reasoning-verbose-output-in-groups"></a>

## Reasoning และเอาต์พุตแบบละเอียดในกลุ่ม

`/reasoning`, `/verbose`, และ `/trace` สามารถเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ หรือการวินิจฉัยของ Plugin ที่
ไม่ได้ตั้งใจให้ปรากฏในช่องทางสาธารณะได้ ในการตั้งค่าแบบกลุ่ม ให้ถือว่าสิ่งเหล่านี้เป็น **สำหรับการดีบักเท่านั้น**
และปิดไว้ เว้นแต่คุณจำเป็นต้องใช้จริง ๆ

คำแนะนำ:

- ปิด `/reasoning`, `/verbose`, และ `/trace` ไว้ในห้องสาธารณะ
- หากจะเปิดใช้ ให้เปิดเฉพาะใน DM ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- จำไว้ว่า: เอาต์พุตแบบ verbose และ trace อาจรวม arg ของเครื่องมือ, URL, การวินิจฉัยของ Plugin และข้อมูลที่โมเดลเห็น

## การ harden การกำหนดค่า (ตัวอย่าง)

### 0) สิทธิ์ของไฟล์

เก็บ config + state ให้เป็นส่วนตัวบนโฮสต์ของ gateway:

- `~/.openclaw/openclaw.json`: `600` (ผู้ใช้อ่าน/เขียนได้เท่านั้น)
- `~/.openclaw`: `700` (เฉพาะผู้ใช้)

`openclaw doctor` สามารถเตือนและเสนอให้ทำสิทธิ์เหล่านี้ให้เข้มขึ้นได้

### 0.4) การเปิดเผยต่อเครือข่าย (bind + port + firewall)

Gateway multiplex ทั้ง **WebSocket + HTTP** บนพอร์ตเดียว:

- ค่าเริ่มต้น: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวม Control UI และ canvas host:

- Control UI (SPA assets) (base path ค่าเริ่มต้น `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ให้ถือว่าเป็นเนื้อหาที่ไม่น่าเชื่อถือ)

หากคุณโหลดเนื้อหา canvas ใน browser ปกติ ให้ปฏิบัติต่อมันเหมือนหน้าเว็บที่ไม่น่าเชื่อถือทั่วไป:

- อย่าเปิดเผย canvas host ให้เครือข่าย/ผู้ใช้ที่ไม่น่าเชื่อถือเข้าถึง
- อย่าทำให้เนื้อหา canvas ใช้ origin เดียวกับพื้นผิวเว็บที่มีสิทธิพิเศษ เว้นแต่คุณจะเข้าใจผลกระทบอย่างถ่องแท้

โหมด bind ควบคุมว่า Gateway รับฟังที่ใด:

- `gateway.bind: "loopback"` (ค่าเริ่มต้น): มีเพียงไคลเอนต์ในเครื่องเท่านั้นที่เชื่อมต่อได้
- bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) จะขยายพื้นผิวการโจมตี ใช้เฉพาะเมื่อมี gateway auth (shared token/password หรือ trusted proxy แบบ non-loopback ที่ตั้งค่าอย่างถูกต้อง) และมี firewall จริง

หลักปฏิบัติโดยย่อ:

- ควรใช้ Tailscale Serve แทน bind แบบ LAN (Serve จะคง Gateway ไว้บน loopback และ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind กับ LAN ให้ตั้ง firewall ของพอร์ตให้มี allowlist ของ source IP ที่แคบ; อย่าทำ port-forward แบบกว้าง
- อย่าเปิดเผย Gateway แบบไม่มีการยืนยันตัวตนบน `0.0.0.0` เด็ดขาด

### 0.4.1) การ publish พอร์ตของ Docker + UFW (`DOCKER-USER`)

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำไว้ว่าพอร์ตของ container ที่ publish ไว้
(`-p HOST:CONTAINER` หรือ `ports:` ใน Compose) จะถูกกำหนดเส้นทางผ่าน chain ของ Docker สำหรับการส่งต่อ
ไม่ใช่แค่กฎ `INPUT` ของโฮสต์เท่านั้น

เพื่อให้ทราฟฟิกของ Docker สอดคล้องกับนโยบาย firewall ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้จะถูกประเมินก่อนกฎ accept ของ Docker เอง)
บน distro สมัยใหม่จำนวนมาก `iptables`/`ip6tables` ใช้ frontend แบบ `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend ของ nftables

ตัวอย่าง allowlist แบบขั้นต่ำ (IPv4):

```bash
# /etc/ufw/after.rules (append เป็นส่วน *filter ของตัวเอง)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 มีตารางแยกต่างหาก เพิ่มนโยบายที่ตรงกันใน `/etc/ufw/after6.rules` หาก
เปิดใช้ Docker IPv6

หลีกเลี่ยงการ hardcode ชื่ออินเทอร์เฟซ เช่น `eth0` ใน snippet ของเอกสาร ชื่ออินเทอร์เฟซ
แตกต่างกันไปตามภาพ VPS (`ens3`, `enp*` เป็นต้น) และหากไม่ตรงกันอาจทำให้
กฎปฏิเสธของคุณถูกข้ามโดยไม่ได้ตั้งใจ

การตรวจสอบอย่างรวดเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

พอร์ตภายนอกที่คาดว่าจะเปิดควรมีเพียงสิ่งที่คุณตั้งใจเปิดเผยเท่านั้น (สำหรับการตั้งค่าส่วนใหญ่:
SSH + พอร์ตของ reverse proxy ของคุณ)

### 0.4.2) การค้นพบผ่าน mDNS/Bonjour (การเปิดเผยข้อมูล)

Gateway กระจายการมีอยู่ของมันผ่าน mDNS (`_openclaw-gw._tcp` บนพอร์ต 5353) เพื่อการค้นหาอุปกรณ์ในเครือข่ายท้องถิ่น ในโหมดเต็ม จะมี TXT record ที่อาจเปิดเผยรายละเอียดการปฏิบัติการ:

- `cliPath`: พาธเต็มของระบบไฟล์ไปยังไบนารี CLI (เปิดเผยชื่อผู้ใช้และตำแหน่งติดตั้ง)
- `sshPort`: โฆษณาว่าโฮสต์นั้นเปิดใช้ SSH
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยเชิงปฏิบัติการ:** การกระจายรายละเอียดของโครงสร้างพื้นฐานทำให้การสอดแนมง่ายขึ้นสำหรับทุกคนในเครือข่ายท้องถิ่น แม้ข้อมูลที่ดู “ไม่อันตราย” เช่นพาธระบบไฟล์และการมีอยู่ของ SSH ก็ช่วยให้ผู้โจมตีทำแผนผังสภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **โหมด minimal** (ค่าเริ่มต้น, แนะนำสำหรับ gateway ที่เปิดเผย): ละฟิลด์ที่อ่อนไหวออกจากการกระจาย mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **ปิดทั้งหมด** หากคุณไม่ต้องการการค้นหาอุปกรณ์ในเครื่อง:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **โหมด full** (เลือกเปิดเอง): รวม `cliPath` + `sshPort` ใน TXT record:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **ตัวแปรสภาพแวดล้อม** (ทางเลือก): ตั้ง `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิด mDNS โดยไม่ต้องเปลี่ยน config

ในโหมด minimal Gateway จะยังคงกระจายข้อมูลพอสำหรับการค้นหาอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะละ `cliPath` และ `sshPort` ออก แอปที่ต้องการข้อมูลพาธ CLI สามารถดึงข้อมูลนั้นผ่านการเชื่อมต่อ WebSocket ที่ยืนยันตัวตนแล้วแทนได้

### 0.5) ล็อก WebSocket ของ Gateway ให้แน่น (local auth)

Gateway auth เป็นสิ่งที่ **บังคับใช้โดยค่าเริ่มต้น** หากไม่มีการกำหนดพาธ auth ที่ใช้ได้อย่างถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (fail-closed)

Onboarding จะสร้างโทเค็นให้โดยค่าเริ่มต้น (แม้บน loopback) ดังนั้น
ไคลเอนต์ local ต้องยืนยันตัวตน

ตั้งค่าโทเค็นเพื่อให้ **ไคลเอนต์ WS ทุกตัว** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

หมายเหตุ: `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์
สิ่งเหล่านี้ **ไม่ได้** ป้องกันการเข้าถึง WS ในเครื่องด้วยตัวมันเอง
พาธการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*`
ยังไม่ได้ตั้งค่า
หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดไว้อย่างชัดเจนผ่าน
SecretRef แต่ยัง resolve ไม่ได้ การ resolve จะล้มเหลวแบบ fail closed (ไม่มี remote fallback มาปกปิด)
แบบไม่บังคับ: pin TLS ระยะไกลด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
`ws://` แบบ plaintext ถูกจำกัดให้ใช้กับ loopback เท่านั้นโดยค่าเริ่มต้น สำหรับพาธ
private-network ที่เชื่อถือได้ ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสของไคลเอนต์ในกรณี break-glass

การจับคู่อุปกรณ์ในเครื่อง:

- device pairing จะได้รับการอนุมัติอัตโนมัติสำหรับการเชื่อมต่อ direct local loopback เพื่อให้
  ไคลเอนต์บนโฮสต์เดียวกันทำงานได้ราบรื่น
- OpenClaw ยังมีพาธ self-connect ภายใน backend/container-local แบบแคบสำหรับ
  โฟลว์ helper ที่เชื่อถือได้ซึ่งใช้ shared secret
- การเชื่อมต่อผ่าน tailnet และ LAN รวมถึง bind แบบ tailnet บนโฮสต์เดียวกัน จะถูกถือว่าเป็น
  รีโมตสำหรับ pairing และยังต้องได้รับการอนุมัติ

โหมด auth:

- `gateway.auth.mode: "token"`: shared bearer token (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: password auth (ควรตั้งผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ reverse proxy ที่รับรู้ตัวตนให้ยืนยันผู้ใช้และส่งตัวตนผ่าน header (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

รายการตรวจสอบการหมุน (token/password):

1. สร้าง/ตั้งค่า secret ใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ต Gateway (หรือรีสตาร์ตแอป macOS หากมันเป็นผู้ดูแล Gateway)
3. อัปเดตไคลเอนต์ระยะไกลทั้งหมด (`gateway.remote.token` / `.password` บนเครื่องที่เรียกเข้า Gateway)
4. ยืนยันว่าคุณไม่สามารถเชื่อมต่อด้วยข้อมูลรับรองเดิมได้อีก

### 0.6) header ตัวตนของ Tailscale Serve

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าเริ่มต้นสำหรับ Serve), OpenClaw
จะยอมรับ header ตัวตนของ Tailscale Serve (`tailscale-user-login`) สำหรับการยืนยันตัวตนของ Control
UI/WebSocket OpenClaw จะตรวจสอบตัวตนโดย resolve
ที่อยู่ `x-forwarded-for` ผ่าน local Tailscale daemon (`tailscale whois`)
และจับคู่กับ header สิ่งนี้จะเกิดขึ้นเฉพาะสำหรับคำขอที่มาถึง loopback
และมี `x-forwarded-for`, `x-forwarded-proto`, และ `x-forwarded-host`
ตามที่ Tailscale ฉีดเข้ามา
สำหรับพาธการตรวจสอบตัวตนแบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
จะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น
การ retry พร้อมกันแบบผิดจาก Serve client ตัวเดียวกันอาจทำให้การพยายามครั้งที่สองถูก lock out ทันที
แทนที่จะหลุดรอดไปเป็นการไม่ตรงกันธรรมดาสองครั้ง
endpoint ของ HTTP API (เช่น `/v1/*`, `/tools/invoke`, และ `/api/channels/*`)
**ไม่** ใช้ auth ผ่าน header ตัวตนของ Tailscale โดยยังคงเป็นไปตาม
โหมด HTTP auth ที่กำหนดค่าของ gateway

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- Gateway HTTP bearer auth มีผลเหมือนการเข้าถึงของผู้ปฏิบัติงานแบบ all-or-nothing
- ให้ถือว่าข้อมูลรับรองที่สามารถเรียก `/v1/chat/completions`, `/v1/responses`, หรือ `/api/channels/*` เป็น secret ของผู้ปฏิบัติงานแบบ full-access สำหรับ gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI, shared-secret bearer auth จะคืน scope เริ่มต้นของผู้ปฏิบัติงานทั้งหมด (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และความหมายของ owner สำหรับ agent turn; ค่า `x-openclaw-scopes` ที่แคบกว่าจะไม่ลดสิทธิ์ในพาธ shared-secret นี้
- ความหมายของ scope ต่อคำขอบน HTTP จะมีผลเฉพาะเมื่อคำขอมาจากโหมดที่มีตัวตน เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress
- ในโหมดที่มีตัวตนเหล่านั้น หากละ `x-openclaw-scopes` ออก จะ fallback ไปยังชุด scope เริ่มต้นของผู้ปฏิบัติงานตามปกติ; ส่ง header นี้อย่างชัดเจนเมื่อคุณต้องการชุด scope ที่แคบกว่า
- `/tools/invoke` ใช้กฎ shared-secret แบบเดียวกัน: token/password bearer auth จะถูกถือเป็นการเข้าถึงของผู้ปฏิบัติงานแบบเต็มที่นี่ด้วย ขณะที่โหมดที่มีตัวตนยังคงเคารพ scope ที่ประกาศไว้
- อย่าแชร์ข้อมูลรับรองเหล่านี้กับผู้เรียกที่ไม่น่าเชื่อถือ; ควรใช้ gateway แยกต่อขอบเขตความเชื่อถือ

**สมมติฐานด้านความเชื่อถือ:** Serve auth แบบไม่มีโทเค็นตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway นั้นเชื่อถือได้
อย่าถือว่านี่เป็นการป้องกันต่อโปรเซสบนโฮสต์เดียวกันที่เป็นปฏิปักษ์ หากอาจมี
โค้ดในเครื่องที่ไม่น่าเชื่อถือรันอยู่บนโฮสต์ของ gateway ให้ปิด `gateway.auth.allowTailscale`
และบังคับใช้ shared-secret auth แบบชัดเจนด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎด้านความปลอดภัย:** อย่าส่งต่อ header เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณ terminate TLS หรือทำ proxy หน้า gateway ให้ปิด
`gateway.auth.allowTailscale` และใช้ shared-secret auth (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
แทน

trusted proxy:

- หากคุณ terminate TLS หน้า Gateway ให้ตั้ง `gateway.trustedProxies` เป็น IP ของ proxy ของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IP เหล่านั้นเพื่อระบุ client IP สำหรับการตรวจ pairing ในเครื่องและการตรวจ HTTP auth/local
- ตรวจสอบให้แน่ใจว่า proxy ของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึงพอร์ตของ Gateway โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [Web overview](/web)

### 0.6.1) browser control ผ่านโฮสต์ของ node (แนะนำ)

หาก Gateway ของคุณอยู่ระยะไกลแต่ browser รันอยู่บนอีกเครื่องหนึ่ง ให้รัน **node host**
บนเครื่อง browser และให้ Gateway ทำ proxy การกระทำของ browser (ดู [Browser tool](/th/tools/browser))
ให้ถือว่าการจับคู่ node มีค่าเท่ากับการเข้าถึงระดับผู้ดูแล

รูปแบบที่แนะนำ:

- ให้ Gateway และ node host อยู่บน tailnet เดียวกัน (Tailscale)
- จับคู่ node อย่างตั้งใจ; ปิด browser proxy routing หากคุณไม่ต้องการใช้

หลีกเลี่ยง:

- การเปิดเผย relay/control port ผ่าน LAN หรืออินเทอร์เน็ตสาธารณะ
- Tailscale Funnel สำหรับ endpoint ของ browser control (การเปิดเผยสู่สาธารณะ)

### 0.7) secret บนดิสก์ (ข้อมูลที่อ่อนไหว)

ให้สมมติว่าสิ่งใดก็ตามใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมี secret หรือข้อมูลส่วนตัว:

- `openclaw.json`: config อาจมีโทเค็น (gateway, remote gateway), การตั้งค่า provider, และ allowlist
- `credentials/**`: ข้อมูลรับรองของช่องทาง (เช่น WhatsApp creds), pairing allowlist, การนำเข้า OAuth แบบเดิม
- `agents/<agentId>/agent/auth-profiles.json`: API key, token profile, OAuth token และ `keyRef`/`tokenRef` แบบไม่บังคับ
- `secrets.json` (ไม่บังคับ): payload ของ secret แบบอิงไฟล์ที่ใช้โดย provider SecretRef แบบ `file` (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์ความเข้ากันได้แบบเดิม รายการ `api_key` แบบคงที่จะถูกล้างเมื่อพบ
- `agents/<agentId>/sessions/**`: ทรานสคริปต์ของเซสชัน (`*.jsonl`) + metadata การกำหนดเส้นทาง (`sessions.json`) ซึ่งอาจมีข้อความส่วนตัวและเอาต์พุตจากเครื่องมือ
- แพ็กเกจ Plugin ที่มากับระบบ: Plugin ที่ติดตั้งแล้ว (รวมถึง `node_modules/` ของมัน)
- `sandboxes/**`: workspace ของ tool sandbox; อาจสะสมสำเนาของไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

เคล็ดลับการ harden:

- ตั้งสิทธิ์ให้แน่น (`700` สำหรับไดเรกทอรี, `600` สำหรับไฟล์)
- ใช้การเข้ารหัสดิสก์ทั้งลูกบนโฮสต์ของ gateway
- ควรใช้บัญชี OS เฉพาะสำหรับ Gateway หากโฮสต์นั้นใช้ร่วมกัน

### 0.8) ไฟล์ `.env` ของ workspace

OpenClaw โหลดไฟล์ `.env` ภายใน workspace สำหรับ agent และเครื่องมือ แต่ไม่เคยปล่อยให้ไฟล์เหล่านั้น override การควบคุมรันไทม์ของ gateway แบบเงียบ ๆ

- คีย์ใดก็ตามที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่น่าเชื่อถือ
- การบล็อกเป็นแบบ fail-closed: ตัวแปรควบคุมรันไทม์ใหม่ที่เพิ่มมาใน release ในอนาคตจะไม่สามารถถูกสืบทอดจาก `.env` ที่ถูก commit หรือจัดหาโดยผู้โจมตีได้; คีย์จะถูกละเลยและ gateway จะคงค่าของตนเองไว้
- ตัวแปรสภาพแวดล้อมของ process/OS ที่เชื่อถือได้ (shell ของ gateway เอง, unit ของ launchd/systemd, app bundle) ยังคงมีผล — สิ่งนี้จำกัดเฉพาะการโหลดจากไฟล์ `.env` เท่านั้น

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ข้างโค้ดของ agent, ถูก commit โดยไม่ได้ตั้งใจ หรือถูกเขียนโดยเครื่องมือ การบล็อก prefix `OPENCLAW_*` ทั้งหมดทำให้การเพิ่มแฟล็ก `OPENCLAW_*` ใหม่ในอนาคตไม่สามารถถดถอยกลับไปสู่การสืบทอดแบบเงียบจาก state ของ workspace ได้

### 0.9) ล็อก + ทรานสคริปต์ (การปกปิด + การเก็บรักษา)

ล็อกและทรานสคริปต์สามารถรั่วไหลข้อมูลอ่อนไหวได้ แม้ว่าการควบคุมการเข้าถึงจะถูกต้อง:

- ล็อกของ Gateway อาจมีสรุปของเครื่องมือ ข้อผิดพลาด และ URL
- ทรานสคริปต์ของเซสชันอาจมี secret ที่วางเข้าไป เนื้อหาไฟล์ เอาต์พุตคำสั่ง และลิงก์

คำแนะนำ:

- เปิดใช้การปกปิดสรุปของเครื่องมือไว้ (`logging.redactSensitive: "tools"`; ค่าเริ่มต้น)
- เพิ่มรูปแบบแบบกำหนดเองสำหรับสภาพแวดล้อมของคุณด้วย `logging.redactPatterns` (โทเค็น, ชื่อโฮสต์, URL ภายใน)
- เมื่อต้องแชร์การวินิจฉัย ให้คุ้นใช้ `openclaw status --all` (วางต่อได้, secret ถูกปกปิด) มากกว่าล็อกดิบ
- ตัดทรานสคริปต์ของเซสชันและไฟล์ล็อกเก่าออก หากคุณไม่ต้องการเก็บไว้นาน

รายละเอียด: [Logging](/th/gateway/logging)

### 1) DM: ใช้ pairing โดยค่าเริ่มต้น

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) กลุ่ม: บังคับให้ต้องมีการกล่าวถึงทุกที่

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

ในแชตกลุ่ม ให้ตอบเฉพาะเมื่อมีการกล่าวถึงอย่างชัดเจน

### 3) แยกหมายเลข (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงหมายเลขโทรศัพท์ ให้พิจารณารัน AI ของคุณบนหมายเลขโทรศัพท์ที่แยกจากหมายเลขส่วนตัว:

- หมายเลขส่วนตัว: การสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอต: AI จัดการสิ่งเหล่านี้ โดยมีขอบเขตที่เหมาะสม

### 4) โหมดอ่านอย่างเดียว (ผ่าน sandbox + tools)

คุณสามารถสร้างโปรไฟล์แบบอ่านอย่างเดียวได้โดยผสมผสาน:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ให้เข้าถึง workspace เลย)
- รายการ allow/deny ของเครื่องมือที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` เป็นต้น

ตัวเลือกการ harden เพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าเริ่มต้น): ทำให้มั่นใจว่า `apply_patch` ไม่สามารถเขียน/ลบนอกไดเรกทอรี workspace ได้ แม้ sandboxing จะปิดอยู่ ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอก workspace
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัดพาธของ `read`/`write`/`edit`/`apply_patch` และพาธโหลดรูปภาพอัตโนมัติจากพรอมป์แบบ native ไว้ที่ไดเรกทอรี workspace (มีประโยชน์หากวันนี้คุณอนุญาต absolute path และต้องการ guardrail ตัวเดียว)
- ทำให้ root ของระบบไฟล์แคบ: หลีกเลี่ยง root ที่กว้าง เช่น home directory ของคุณ สำหรับ workspace ของ agent/workspace ของ sandbox root ที่กว้างอาจเปิดเผยไฟล์ภายในเครื่องที่อ่อนไหว (เช่น state/config ใต้ `~/.openclaw`) ให้กับเครื่องมือระบบไฟล์

### 5) baseline ที่ปลอดภัย (คัดลอก/วาง)

config แบบ “safe default” ที่คงความเป็นส่วนตัวของ Gateway, บังคับ DM pairing และหลีกเลี่ยงบอตกลุ่มแบบ always-on:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

หากคุณต้องการการรันเครื่องมือที่ “ปลอดภัยกว่าโดยค่าเริ่มต้น” ด้วย ให้เพิ่ม sandbox + deny เครื่องมืออันตรายสำหรับ agent ที่ไม่ใช่ owner ทุกตัว (ตัวอย่างด้านล่างใน “Per-agent access profiles”)

baseline แบบ built-in สำหรับ agent turn ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่ owner จะไม่สามารถใช้เครื่องมือ `cron` หรือ `gateway`

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

สองแนวทางที่เสริมกัน:

- **รัน Gateway ทั้งหมดใน Docker** (ขอบเขตของ container): [Docker](/th/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, โฮสต์ gateway + เครื่องมือที่แยกด้วย sandbox; Docker คือ backend ค่าเริ่มต้น): [Sandboxing](/th/gateway/sandboxing)

หมายเหตุ: เพื่อป้องกันการเข้าถึงข้าม agent ให้คง `agents.defaults.sandbox.scope` ไว้ที่ `"agent"` (ค่าเริ่มต้น)
หรือ `"session"` เพื่อการแยกต่อเซสชันที่เข้มกว่า `scope: "shared"` ใช้
container/workspace เดียวร่วมกัน

พิจารณาการเข้าถึง workspace ของ agent ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าเริ่มต้น) จะกัน workspace ของ agent ออกจากการเข้าถึง; เครื่องมือจะรันกับ sandbox workspace ใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` จะ mount workspace ของ agent แบบอ่านอย่างเดียวที่ `/agent` (ปิด `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` จะ mount workspace ของ agent แบบอ่าน/เขียนที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูกตรวจสอบเทียบกับ source path ที่ normalize และ canonicalize แล้ว กลอุบาย parent-symlink และ alias ของ home แบบ canonical ยังคง fail closed หาก resolve เข้าไปยัง root ที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรีข้อมูลรับรองภายใต้ home ของ OS

สำคัญ: `tools.elevated` คือ escape hatch ระดับ global ที่รัน exec นอก sandbox effective host คือ `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อกำหนดเป้าหมาย exec เป็น `node` รักษา `tools.elevated.allowFrom` ให้แคบ และอย่าเปิดใช้สำหรับคนแปลกหน้า คุณยังสามารถจำกัด elevated ต่อ agent เพิ่มเติมได้ผ่าน `agents.list[].tools.elevated` ดู [Elevated Mode](/th/tools/elevated)

### guardrail สำหรับการมอบหมายงานไปยัง sub-agent

หากคุณอนุญาตเครื่องมือเซสชัน ให้ถือว่าการรัน sub-agent ที่ถูกมอบหมายเป็นอีกหนึ่งการตัดสินใจเรื่องขอบเขต:

- deny `sessions_spawn` เว้นแต่ agent จำเป็นต้องใช้การมอบหมายจริง ๆ
- จำกัด `agents.defaults.subagents.allowAgents` และ override ราย agent ใด ๆ ใน `agents.list[].subagents.allowAgents` ไว้เฉพาะ agent เป้าหมายที่รู้ว่าปลอดภัย
- สำหรับเวิร์กโฟลว์ใดก็ตามที่ต้องคงอยู่ใน sandbox ให้เรียก `sessions_spawn` ด้วย `sandbox: "require"` (ค่าเริ่มต้นคือ `inherit`)
- `sandbox: "require"` จะ fail fast เมื่อรันไทม์ลูกเป้าหมายไม่ได้อยู่ใน sandbox

## ความเสี่ยงของ browser control

การเปิดใช้ browser control ทำให้โมเดลสามารถขับ browser จริงได้
หากโปรไฟล์ browser นั้นมีเซสชันที่ลงชื่อเข้าใช้อยู่แล้ว โมเดลก็สามารถ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่าโปรไฟล์ browser เป็น **state ที่อ่อนไหว**:

- ควรใช้โปรไฟล์เฉพาะสำหรับ agent (โปรไฟล์ `openclaw` เริ่มต้น)
- หลีกเลี่ยงการชี้ agent ไปยังโปรไฟล์ส่วนตัวที่คุณใช้งานประจำ
- คง host browser control ให้ปิดไว้สำหรับ agent ที่อยู่ใน sandbox เว้นแต่คุณจะเชื่อถือมัน
- standalone loopback browser control API จะยอมรับเฉพาะ shared-secret auth
  (gateway token bearer auth หรือ gateway password) มันไม่ใช้
  trusted-proxy หรือ header ตัวตนของ Tailscale Serve
- ให้ถือว่าการดาวน์โหลดจาก browser เป็นอินพุตที่ไม่น่าเชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดที่แยกออกมา
- ปิด browser sync/password manager ในโปรไฟล์ของ agent หากทำได้ (ลดรัศมีผลกระทบ)
- สำหรับ gateway ระยะไกล ให้ถือว่า “browser control” เทียบเท่ากับ “การเข้าถึงของผู้ปฏิบัติงาน” ต่อทุกสิ่งที่โปรไฟล์นั้นเข้าถึงได้
- รักษา Gateway และโฮสต์ของ node ให้อยู่เฉพาะบน tailnet; หลีกเลี่ยงการเปิดเผยพอร์ต browser control ต่อ LAN หรืออินเทอร์เน็ตสาธารณะ
- ปิด browser proxy routing เมื่อไม่ต้องใช้ (`gateway.nodes.browser.mode="off"`)
- โหมด Chrome MCP existing-session **ไม่ได้** “ปลอดภัยกว่า”; มันสามารถทำงานในนามของคุณในทุกสิ่งที่โปรไฟล์ Chrome บนโฮสต์นั้นเข้าถึงได้

### นโยบาย SSRF ของ browser (เข้มงวดโดยค่าเริ่มต้น)

นโยบายการนำทาง browser ของ OpenClaw เข้มงวดโดยค่าเริ่มต้น: ปลายทาง private/internal จะยังถูกบล็อก เว้นแต่คุณจะเลือกเปิดใช้อย่างชัดเจน

- ค่าเริ่มต้น: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ยังไม่ได้ตั้งค่า ดังนั้นการนำทางของ browser จะยังคงบล็อกปลายทางแบบ private/internal/special-use
- alias แบบเดิม: `browser.ssrfPolicy.allowPrivateNetwork` ยังคงยอมรับเพื่อความเข้ากันได้
- โหมดเลือกเปิด: ตั้ง `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทางแบบ private/internal/special-use
- ในโหมดเข้มงวด ให้ใช้ `hostnameAllowlist` (แพตเทิร์นเช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้นชื่อโฮสต์แบบ exact รวมถึงชื่อที่ถูกบล็อกอย่าง `localhost`) สำหรับข้อยกเว้นแบบชัดเจน
- การนำทางจะถูกตรวจสอบก่อน request และตรวจสอบซ้ำแบบ best-effort บน URL `http(s)` สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

ตัวอย่างนโยบายเข้มงวด:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## โปรไฟล์การเข้าถึงราย agent (multi-agent)

ด้วยการกำหนดเส้นทางแบบ multi-agent, แต่ละ agent สามารถมี sandbox + นโยบายเครื่องมือของตัวเองได้:
ใช้สิ่งนี้เพื่อให้สิทธิ์แบบ **เข้าถึงเต็มรูปแบบ**, **อ่านอย่างเดียว**, หรือ **ไม่ให้เข้าถึงเลย** ต่อ agent
ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดทั้งหมด
และกฎลำดับความสำคัญ

กรณีใช้งานทั่วไป:

- agent ส่วนตัว: เข้าถึงเต็มรูปแบบ, ไม่มี sandbox
- agent สำหรับครอบครัว/งาน: อยู่ใน sandbox + เครื่องมือแบบอ่านอย่างเดียว
- agent สาธารณะ: อยู่ใน sandbox + ไม่มีเครื่องมือระบบไฟล์/shell

### ตัวอย่าง: เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### ตัวอย่าง: เครื่องมือแบบอ่านอย่างเดียว + workspace แบบอ่านอย่างเดียว

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### ตัวอย่าง: ไม่มีการเข้าถึงระบบไฟล์/shell (อนุญาตการส่งข้อความผ่าน provider)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // เครื่องมือเซสชันอาจเปิดเผยข้อมูลอ่อนไหวจากทรานสคริปต์ โดยค่าเริ่มต้น OpenClaw จำกัดเครื่องมือเหล่านี้
        // ไว้ที่เซสชันปัจจุบัน + เซสชัน subagent ที่ spawn ขึ้น แต่คุณสามารถจำกัดให้แคบกว่านี้ได้หากต้องการ
        // ดู `tools.sessions.visibility` ในเอกสารอ้างอิงการกำหนดค่า
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## สิ่งที่ควรบอก AI ของคุณ

ใส่แนวทางด้านความปลอดภัยไว้ใน system prompt ของ agent:

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## การตอบสนองต่อเหตุการณ์

หาก AI ของคุณทำสิ่งที่ไม่ดี:

### ควบคุมสถานการณ์

1. **หยุดมัน:** หยุดแอป macOS (หากมันเป็นผู้ดูแล Gateway) หรือยุติโปรเซส `openclaw gateway`
2. **ปิดการเปิดเผย:** ตั้ง `gateway.bind: "loopback"` (หรือปิด Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **แช่แข็งการเข้าถึง:** เปลี่ยน DM/กลุ่มที่เสี่ยงให้เป็น `dmPolicy: "disabled"` / บังคับให้ต้องมีการกล่าวถึง และลบรายการ allow-all `"*"` ออกหากก่อนหน้านี้คุณเคยใช้

### หมุนข้อมูลรับรอง (ให้ถือว่าถูก compromise หากมี secret รั่วไหล)

1. หมุน Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) แล้วรีสตาร์ต
2. หมุน secret ของไคลเอนต์ระยะไกล (`gateway.remote.token` / `.password`) บนทุกเครื่องที่สามารถเรียกเข้า Gateway
3. หมุนข้อมูลรับรองของ provider/API (WhatsApp creds, โทเค็น Slack/Discord, โมเดล/API key ใน `auth-profiles.json`, และค่าของ encrypted secrets payload เมื่อมีการใช้)

### ตรวจสอบ

1. ตรวจสอบล็อกของ Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจสอบทรานสคริปต์ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจสอบการเปลี่ยนแปลง config ล่าสุด (ทุกอย่างที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย dm/group, `tools.elevated`, การเปลี่ยนแปลง Plugin)
4. รัน `openclaw security audit --deep` ใหม่ และยืนยันว่า finding ระดับ critical ได้รับการแก้แล้ว

### เก็บข้อมูลสำหรับรายงาน

- timestamp, OS ของโฮสต์ gateway + เวอร์ชันของ OpenClaw
- ทรานสคริปต์ของเซสชัน + log tail แบบสั้น (หลังปกปิดข้อมูลแล้ว)
- สิ่งที่ผู้โจมตีส่งมา + สิ่งที่ agent ทำ
- Gateway ถูกเปิดเผยเกินกว่า loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## Secret Scanning (`detect-secrets`)

CI จะรัน pre-commit hook ของ `detect-secrets` ใน job `secrets`
การ push ไปที่ `main` จะรันการสแกนทุกไฟล์เสมอ ส่วน pull request จะใช้พาธแบบเร็วเฉพาะไฟล์ที่เปลี่ยน
เมื่อมี base commit และจะ fallback ไปสแกนทุกไฟล์
ในกรณีอื่น หากล้มเหลว แสดงว่ามี candidate ใหม่ที่ยังไม่อยู่ใน baseline

### หาก CI ล้มเหลว

1. ทำซ้ำในเครื่อง:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ทำความเข้าใจเครื่องมือ:
   - `detect-secrets` ใน pre-commit จะรัน `detect-secrets-hook` โดยใช้
     baseline และ excludes ของ repo
   - `detect-secrets audit` จะเปิดการตรวจทานแบบโต้ตอบเพื่อทำเครื่องหมายรายการใน baseline
     แต่ละรายการว่าเป็นของจริงหรือ false positive
3. สำหรับ secret จริง: หมุน/ลบมัน จากนั้นรันการสแกนอีกครั้งเพื่ออัปเดต baseline
4. สำหรับ false positive: รัน interactive audit และทำเครื่องหมายว่าเป็น false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. หากคุณต้องการ exclude ใหม่ ให้เพิ่มใน `.detect-secrets.cfg` และสร้าง
   baseline ใหม่ด้วยแฟล็ก `--exclude-files` / `--exclude-lines` ที่ตรงกัน (ไฟล์ config
   นี้มีไว้เพื่ออ้างอิงเท่านั้น; detect-secrets จะไม่อ่านโดยอัตโนมัติ)

commit `.secrets.baseline` ที่อัปเดตแล้ว เมื่อมันสะท้อนสถานะที่ตั้งใจไว้

## การรายงานปัญหาด้านความปลอดภัย

พบช่องโหว่ใน OpenClaw หรือ? โปรดรายงานอย่างรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะแก้ไขแล้ว
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
