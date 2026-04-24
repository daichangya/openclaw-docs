---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่แล้ว
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะของอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Plugin Matrix รุ่นก่อนหน้าแบบแทนที่ในจุดเดิม รวมถึงข้อจำกัดของการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้าย Matrix
x-i18n:
    generated_at: "2026-04-24T09:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

หน้านี้ครอบคลุมการอัปเกรดจาก Plugin `matrix` รุ่นสาธารณะก่อนหน้าไปยัง implementation ปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะเป็นแบบแทนที่ในจุดเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- config ของคุณยังคงอยู่ภายใต้ `channels.matrix`
- cached credentials ยังคงอยู่ภายใต้ `~/.openclaw/credentials/matrix/`
- runtime state ยังคงอยู่ภายใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์ config หรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่

## สิ่งที่การย้ายทำให้อัตโนมัติ

เมื่อ gateway เริ่มทำงาน และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor), OpenClaw จะพยายามซ่อม Matrix state เก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้าย Matrix ที่มีผลจริงใด ๆ จะเปลี่ยนสถานะบนดิสก์ OpenClaw จะสร้างหรือใช้ recovery snapshot แบบเจาะจงซ้ำ

เมื่อคุณใช้ `openclaw update`, ตัวกระตุ้นที่แน่นอนขึ้นอยู่กับวิธีติดตั้ง OpenClaw:

- การติดตั้งจาก source จะรัน `openclaw doctor --fix` ระหว่างโฟลว์การอัปเดต แล้วรีสตาร์ต gateway โดยค่าเริ่มต้น
- การติดตั้งผ่าน package manager จะอัปเดตแพ็กเกจ รัน doctor pass แบบไม่โต้ตอบ แล้วอาศัยการรีสตาร์ต gateway ตามค่าเริ่มต้นเพื่อให้ startup ทำ Matrix migration ให้เสร็จ
- หากคุณใช้ `openclaw update --no-restart`, Matrix migration ที่พึ่งพา startup จะถูกเลื่อนไปจนกว่าคุณจะรัน `openclaw doctor --fix` และรีสตาร์ต gateway ในภายหลัง

การย้ายอัตโนมัติครอบคลุม:

- การสร้างหรือใช้ pre-migration snapshot ซ้ำภายใต้ `~/Backups/openclaw-migrations/`
- การใช้ cached Matrix credentials ของคุณซ้ำ
- การคงการเลือกบัญชีเดิมและ config `channels.matrix`
- การย้าย Matrix sync store แบบแบนที่เก่าที่สุดไปยังตำแหน่งแบบมีขอบเขตบัญชีในปัจจุบัน
- การย้าย Matrix crypto store แบบแบนที่เก่าที่สุดไปยังตำแหน่งแบบมีขอบเขตบัญชีปัจจุบัน เมื่อสามารถ resolve บัญชีเป้าหมายได้อย่างปลอดภัย
- การดึง Matrix room-key backup decryption key ที่เคยบันทึกไว้จาก rust crypto store เก่า เมื่อมีคีย์นั้นอยู่ในเครื่อง
- การใช้ token-hash storage root เดิมที่สมบูรณ์ที่สุดซ้ำสำหรับ Matrix account, homeserver และ user เดียวกัน เมื่อ access token เปลี่ยนภายหลัง
- การสแกน sibling token-hash storage roots เพื่อหา pending encrypted-state restore metadata เมื่อ Matrix access token เปลี่ยน แต่ account/device identity ยังคงเดิม
- การกู้คืน backed-up room keys เข้า crypto store ใหม่ในการเริ่ม Matrix ครั้งถัดไป

รายละเอียดของ snapshot:

- OpenClaw จะเขียน marker file ที่ `~/.openclaw/matrix/migration-snapshot.json` หลัง snapshot สำเร็จ เพื่อให้การเริ่มต้นครั้งถัดไปและการซ่อมแซมสามารถใช้ archive เดียวกันซ้ำได้
- automatic Matrix migration snapshots เหล่านี้จะสำรองเฉพาะ config + state (`includeWorkspace: false`)
- หาก Matrix มีสถานะการย้ายที่เป็นเพียงคำเตือนเท่านั้น เช่น เพราะยังขาด `userId` หรือ `accessToken`, OpenClaw จะยังไม่สร้าง snapshot เพราะยังไม่มีการเปลี่ยนแปลง Matrix ใดที่ทำได้จริง
- หากขั้นตอนการสร้าง snapshot ล้มเหลว OpenClaw จะข้าม Matrix migration สำหรับการรันนั้น แทนที่จะเปลี่ยนสถานะโดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดแบบหลายบัญชี:

- Matrix store แบบแบนที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบ single-store ดังนั้น OpenClaw จึงสามารถย้ายมันเข้าเป้าหมายบัญชี Matrix ที่ resolve ได้เพียงบัญชีเดียว
- legacy Matrix stores ที่มีขอบเขตบัญชีอยู่แล้วจะถูกตรวจพบและเตรียมแยกตามบัญชี Matrix ที่กำหนดค่าไว้

## สิ่งที่การย้ายทำให้อัตโนมัติไม่ได้

Matrix Plugin รุ่นสาธารณะก่อนหน้า **ไม่ได้** สร้าง Matrix room-key backups โดยอัตโนมัติ มันเก็บ local crypto state และขอให้มีการยืนยันตัวตนอุปกรณ์ แต่ไม่ได้รับประกันว่า room keys ของคุณถูกสำรองไปยัง homeserver

นั่นหมายความว่าบางการติดตั้งที่เข้ารหัสไว้จะย้ายได้เพียงบางส่วน

OpenClaw ไม่สามารถกู้คืนอัตโนมัติได้สำหรับ:

- local-only room keys ที่ไม่เคยถูกสำรอง
- encrypted state เมื่อยังไม่สามารถ resolve บัญชี Matrix เป้าหมายได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้งาน
- การย้ายอัตโนมัติของ shared flat Matrix store หนึ่งชุด เมื่อมีการกำหนดค่าหลายบัญชี Matrix แต่ไม่ได้ตั้ง `channels.matrix.defaultAccount`
- การติดตั้ง custom plugin path ที่ถูกปักหมุดไว้กับ path ของ repo แทนแพ็กเกจ Matrix มาตรฐาน
- recovery key ที่หายไป เมื่อ store เก่ามี backed-up keys แต่ไม่ได้เก็บ decryption key ไว้ในเครื่อง

ขอบเขตคำเตือนปัจจุบัน:

- การติดตั้ง custom Matrix plugin path จะถูกรายงานทั้งจาก gateway startup และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมี encrypted history แบบ local-only ที่ไม่เคยถูกสำรอง ข้อความเข้ารหัสเก่าบางรายการอาจยังคงอ่านไม่ได้หลังการอัปเกรด

## โฟลว์การอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Matrix Plugin ตามปกติ
   ควรใช้ `openclaw update` แบบปกติโดยไม่ใช้ `--no-restart` เพื่อให้ startup ทำ Matrix migration ให้เสร็จทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานการย้ายที่ทำได้จริง doctor จะสร้างหรือใช้ pre-migration snapshot ซ้ำก่อน และพิมพ์ path ของ archive ออกมา

3. เริ่มหรือรีสตาร์ต gateway
4. ตรวจสอบสถานะการยืนยันตัวตนและ backup ปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. หาก OpenClaw แจ้งว่าจำเป็นต้องใช้ recovery key ให้รัน:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยันตัวตน ให้รัน:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้ และต้องการ backup baseline ใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. หากยังไม่มี server-side key backup ให้สร้างไว้สำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## การย้ายแบบเข้ารหัสทำงานอย่างไร

การย้ายแบบเข้ารหัสเป็นกระบวนการสองขั้นตอน:

1. Startup หรือ `openclaw doctor --fix` จะสร้างหรือใช้ pre-migration snapshot ซ้ำ หากการย้ายแบบเข้ารหัสสามารถทำได้จริง
2. Startup หรือ `openclaw doctor --fix` จะตรวจสอบ Matrix crypto store เก่าผ่านการติดตั้ง Matrix Plugin ที่ใช้งานอยู่
3. หากพบ backup decryption key, OpenClaw จะเขียนคีย์นั้นเข้าไปในโฟลว์ recovery-key ใหม่ และทำเครื่องหมายว่า room-key restore อยู่ในสถานะ pending
4. ใน Matrix startup ครั้งถัดไป OpenClaw จะกู้คืน backed-up room keys เข้า crypto store ใหม่โดยอัตโนมัติ

หาก store เก่ารายงานว่ามี room keys ที่ไม่เคยถูกสำรอง OpenClaw จะเตือนแทนที่จะทำเหมือนว่าการกู้คืนสำเร็จ

## ข้อความที่พบบ่อยและความหมาย

### ข้อความการอัปเกรดและการตรวจจับ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบ Matrix state บนดิสก์แบบเก่าและย้ายเข้าเลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ควรทำ: ไม่ต้องทำอะไร เว้นแต่ผลลัพธ์เดียวกันนั้นจะมีคำเตือนด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้าง recovery archive ก่อนเปลี่ยน Matrix state
- สิ่งที่ควรทำ: เก็บ path ของ archive ที่พิมพ์ไว้นั้นไว้จนกว่าคุณจะยืนยันว่าการย้ายสำเร็จแล้ว

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบ Matrix migration snapshot marker ที่มีอยู่แล้ว และใช้ archive เดิมซ้ำแทนการสร้าง backup ซ้ำ
- สิ่งที่ควรทำ: เก็บ path ของ archive ที่พิมพ์ไว้นั้นไว้จนกว่าคุณจะยืนยันว่าการย้ายสำเร็จแล้ว

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มี Matrix state แบบเก่าอยู่ แต่ OpenClaw ยังไม่สามารถแมปมันเข้ากับบัญชี Matrix ปัจจุบันได้ เพราะ Matrix ยังไม่ได้กำหนดค่า
- สิ่งที่ควรทำ: กำหนดค่า `channels.matrix`, แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบ state แบบเก่า แต่ยังไม่สามารถระบุ current account/device root ที่แน่นอนได้
- สิ่งที่ควรทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจากมี cached credentials แล้ว

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ shared flat Matrix store หนึ่งชุด แต่ปฏิเสธที่จะเดาเองว่าควรย้ายไปยังบัญชี Matrix ที่มีชื่อบัญชีใด
- สิ่งที่ควรทำ: ตั้ง `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งแบบมีขอบเขตบัญชีใหม่มี sync หรือ crypto store อยู่แล้ว ดังนั้น OpenClaw จึงไม่เขียนทับให้อัตโนมัติ
- สิ่งที่ควรทำ: ตรวจสอบก่อนว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้อง ก่อนลบหรือย้าย target ที่ชนกันด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้าย Matrix state แบบเก่า แต่การดำเนินการระดับระบบไฟล์ล้มเหลว
- สิ่งที่ควรทำ: ตรวจสอบสิทธิ์ของระบบไฟล์และสถานะดิสก์ จากนั้นรัน `openclaw doctor --fix` ใหม่

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบ encrypted Matrix store แบบเก่า แต่ยังไม่มี Matrix config ปัจจุบันที่จะนำไปผูก
- สิ่งที่ควรทำ: กำหนดค่า `channels.matrix`, แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: encrypted store มีอยู่ แต่ OpenClaw ยังไม่สามารถตัดสินได้อย่างปลอดภัยว่ามันเป็นของ current account/device ใด
- สิ่งที่ควรทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจาก cached credentials พร้อมแล้ว

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ shared flat legacy crypto store หนึ่งชุด แต่ปฏิเสธที่จะเดาเองว่าควรย้ายไปยังบัญชี Matrix ที่มีชื่อบัญชีใด
- สิ่งที่ควรทำ: ตั้ง `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบ Matrix state แบบเก่า แต่การย้ายยังถูกบล็อกด้วยข้อมูลตัวตนหรือข้อมูลรับรองที่หายไป
- สิ่งที่ควรทำ: ทำ Matrix login หรือการตั้งค่า config ให้เสร็จ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบ encrypted Matrix state แบบเก่า แต่ไม่สามารถโหลด helper entrypoint จาก Matrix Plugin ซึ่งปกติใช้ตรวจสอบ store นั้นได้
- สิ่งที่ควรทำ: ติดตั้งหรือซ่อม Matrix Plugin ใหม่ (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบ path ของ helper file ที่หลุดออกจาก plugin root หรือไม่ผ่านการตรวจสอบขอบเขตของ plugin ดังนั้นจึงปฏิเสธที่จะ import
- สิ่งที่ควรทำ: ติดตั้ง Matrix Plugin ใหม่จาก path ที่เชื่อถือได้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยน Matrix state เพราะไม่สามารถสร้าง recovery snapshot ได้ก่อน
- สิ่งที่ควรทำ: แก้ไขข้อผิดพลาดของการสำรองข้อมูล แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: Matrix client-side fallback พบ flat storage แบบเก่า แต่การย้ายล้มเหลว ปัจจุบัน OpenClaw จะยกเลิก fallback นั้นแทนที่จะเริ่มด้วย store ใหม่แบบเงียบ ๆ
- สิ่งที่ควรทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือความขัดแย้ง คง state เก่าไว้ แล้วลองใหม่หลังแก้ข้อผิดพลาดแล้ว

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกปักหมุดไว้กับการติดตั้งแบบ path ดังนั้นการอัปเดตสายหลักจะไม่แทนที่มันด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ควรทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อคุณต้องการกลับไปใช้ Matrix Plugin เริ่มต้น

### ข้อความการกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: room keys ที่ถูกสำรองไว้ถูกกู้คืนเข้าสู่ crypto store ใหม่สำเร็จแล้ว
- สิ่งที่ควรทำ: โดยปกติไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: room keys เก่าบางรายการมีอยู่เฉพาะใน local store เก่าและไม่เคยถูกอัปโหลดไปยัง Matrix backup
- สิ่งที่ควรทำ: ให้คาดว่าประวัติที่เข้ารหัสเก่าบางส่วนจะยังคงไม่พร้อมใช้งาน เว้นแต่คุณจะสามารถกู้คืนคีย์เหล่านั้นด้วยตนเองจากไคลเอนต์ที่ได้รับการยืนยันตัวตนอีกเครื่องหนึ่ง

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- ความหมาย: มี backup อยู่ แต่ OpenClaw ไม่สามารถกู้ recovery key โดยอัตโนมัติได้
- สิ่งที่ควรทำ: รัน `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ encrypted store เก่า แต่ไม่สามารถตรวจสอบได้อย่างปลอดภัยเพียงพอสำหรับการเตรียมกู้คืน
- สิ่งที่ควรทำ: รัน `openclaw doctor --fix` ใหม่ หากยังเกิดซ้ำ ให้คงไดเรกทอรี state เก่าไว้ และกู้คืนโดยใช้ Matrix client อีกตัวที่ได้รับการยืนยันตัวตนแล้วร่วมกับ `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ควรทำ: ตรวจสอบก่อนว่า recovery key ใดถูกต้อง ก่อนลองรันคำสั่ง restore ใด ๆ ใหม่

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือข้อจำกัดที่แท้จริงของรูปแบบการจัดเก็บเก่า
- สิ่งที่ควรทำ: backed-up keys ยังสามารถกู้คืนได้ แต่ encrypted history แบบ local-only อาจยังคงไม่พร้อมใช้งาน

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix ตอบกลับด้วยข้อผิดพลาด
- สิ่งที่ควรทำ: รัน `openclaw matrix verify backup status` แล้วลองใหม่ด้วย `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` หากจำเป็น

### ข้อความการกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw รู้ว่าคุณควรมี backup key แต่ยังไม่เปิดใช้งานบนอุปกรณ์นี้
- สิ่งที่ควรทำ: รัน `openclaw matrix verify backup restore` หรือส่ง `--recovery-key` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: ขณะนี้อุปกรณ์นี้ยังไม่มี recovery key ถูกจัดเก็บไว้
- สิ่งที่ควรทำ: ยืนยันตัวตนอุปกรณ์ด้วย recovery key ของคุณก่อน แล้วจึง restore backup

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- ความหมาย: คีย์ที่จัดเก็บไว้ไม่ตรงกับ Matrix backup ที่ใช้งานอยู่
- สิ่งที่ควรทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่ด้วยคีย์ที่ถูกต้อง

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ คุณสามารถรีเซ็ต
backup baseline ปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
backup secret ที่จัดเก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่สามารถโหลดได้ถูกต้องหลังรีสตาร์ต

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- ความหมาย: backup มีอยู่ แต่ขณะนี้อุปกรณ์นี้ยังไม่เชื่อถือ cross-signing chain อย่างแข็งแรงเพียงพอ
- สิ่งที่ควรทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนการกู้คืนโดยไม่ส่ง recovery key ในกรณีที่จำเป็นต้องใช้
- สิ่งที่ควรทำ: รันคำสั่งใหม่พร้อม recovery key ของคุณ

`Invalid Matrix recovery key: ...`

- ความหมาย: คีย์ที่ให้มา parse ไม่ได้หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ควรทำ: ลองใหม่โดยใช้ recovery key ตรงตัวจาก Matrix client หรือไฟล์ recovery-key

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- ความหมาย: มีการใช้คีย์แล้ว แต่อุปกรณ์ยังไม่สามารถยืนยันตัวตนให้เสร็จสิ้นได้
- สิ่งที่ควรทำ: ยืนยันว่าคุณใช้คีย์ถูกต้อง และมี cross-signing พร้อมใช้งานบนบัญชี จากนั้นลองใหม่

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่ได้สร้างเซสชัน backup ที่ใช้งานอยู่บนอุปกรณ์นี้
- สิ่งที่ควรทำ: ยืนยันตัวตนอุปกรณ์ก่อน แล้วตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- ความหมาย: อุปกรณ์นี้ยังไม่สามารถกู้คืนจาก secret storage ได้จนกว่าการยืนยันตัวตนอุปกรณ์จะเสร็จ
- สิ่งที่ควรทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ก่อน

### ข้อความเกี่ยวกับการติดตั้ง custom plugin

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยัง local path ที่ไม่มีอยู่แล้ว
- สิ่งที่ควรทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณกำลังรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หาก encrypted history ยังคงไม่กลับมา

ให้รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

หาก backup ถูกกู้คืนสำเร็จ แต่บางห้องเก่ายังคงไม่มีประวัติ คีย์ที่หายไปเหล่านั้นน่าจะไม่เคยถูกสำรองโดย Plugin รุ่นก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ และต้องการเพียง backup baseline ที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากหลังจากนั้นอุปกรณ์ยังไม่ผ่านการยืนยันตัวตน ให้ทำการยืนยันตัวตนให้เสร็จจาก Matrix client ของคุณ โดยเปรียบเทียบ SAS emoji หรือรหัสตัวเลข แล้วกดยืนยันว่าตรงกัน

## หน้าที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix)
- [Doctor](/th/gateway/doctor)
- [การย้ายระบบ](/th/install/migrating)
- [Plugins](/th/tools/plugin)
