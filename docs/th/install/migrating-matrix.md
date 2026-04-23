---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่แล้ว
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์】【。final
summary: วิธีที่ OpenClaw อัปเกรด Matrix Plugin เดิมแบบแทนที่เดิม รวมถึงข้อจำกัดของการกู้คืนสถานะที่เข้ารหัสและขั้นตอนกู้คืนแบบกำหนดเอง
title: การย้าย Matrix
x-i18n:
    generated_at: "2026-04-23T05:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# การย้าย Matrix

หน้านี้ครอบคลุมการอัปเกรดจาก Matrix Plugin สาธารณะรุ่นก่อนหน้าไปสู่ implementation ปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะเกิดขึ้นแบบแทนที่เดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- channel ยังคงเป็น `matrix`
- config ของคุณยังคงอยู่ภายใต้ `channels.matrix`
- cached credentials ยังคงอยู่ใต้ `~/.openclaw/credentials/matrix/`
- สถานะรันไทม์ยังคงอยู่ใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อ config keys หรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่

## สิ่งที่การย้ายทำให้อัตโนมัติ

เมื่อ gateway เริ่มต้น และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor) OpenClaw จะพยายามซ่อมแซมสถานะ Matrix แบบเก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้าย Matrix ที่ทำได้จริงใดๆ จะเปลี่ยนสถานะบนดิสก์ OpenClaw จะสร้างหรือใช้ focused recovery snapshot เดิมซ้ำ

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่นอนจะขึ้นกับวิธีติดตั้ง OpenClaw:

- การติดตั้งจากซอร์สจะรัน `openclaw doctor --fix` ระหว่างโฟลว์อัปเดต แล้วรีสตาร์ต gateway ตามค่าเริ่มต้น
- การติดตั้งผ่าน package manager จะอัปเดตแพ็กเกจ รัน doctor แบบ non-interactive หนึ่งรอบ แล้วอาศัยการรีสตาร์ต gateway ตามค่าเริ่มต้นเพื่อให้ startup ทำการย้าย Matrix จนเสร็จ
- หากคุณใช้ `openclaw update --no-restart` การย้าย Matrix ที่อาศัย startup จะถูกเลื่อนไปจนกว่าคุณจะรัน `openclaw doctor --fix` และรีสตาร์ต gateway ภายหลัง

การย้ายอัตโนมัติครอบคลุม:

- การสร้างหรือใช้ pre-migration snapshot เดิมภายใต้ `~/Backups/openclaw-migrations/`
- การนำ cached Matrix credentials ของคุณกลับมาใช้
- การคงการเลือกบัญชีและ config `channels.matrix` เดิมไว้
- การย้าย Matrix sync store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบกำหนดขอบเขตตามบัญชีในปัจจุบัน
- การย้าย Matrix crypto store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบกำหนดขอบเขตตามบัญชีในปัจจุบัน เมื่อสามารถ resolve บัญชีเป้าหมายได้อย่างปลอดภัย
- การดึง Matrix room-key backup decryption key ที่เคยบันทึกไว้ก่อนหน้าออกจาก rust crypto store เก่า เมื่อคีย์นั้นมีอยู่ในเครื่อง
- การนำ token-hash storage root ที่สมบูรณ์ที่สุดที่มีอยู่กลับมาใช้สำหรับบัญชี Matrix, homeserver และผู้ใช้คนเดิม เมื่อ access token เปลี่ยนในภายหลัง
- การสแกน sibling token-hash storage roots เพื่อหา metadata การกู้คืนสถานะที่เข้ารหัสที่ยัง pending อยู่ เมื่อ Matrix access token เปลี่ยนแต่ identity ของบัญชี/อุปกรณ์ยังคงเดิม
- การกู้คืน room keys ที่สำรองไว้เข้าไปยัง crypto store ใหม่ในการเริ่ม Matrix ครั้งถัดไป

รายละเอียดของ snapshot:

- OpenClaw จะเขียน marker file ที่ `~/.openclaw/matrix/migration-snapshot.json` หลังจากสร้าง snapshot สำเร็จ เพื่อให้ startup และรอบซ่อมแซมครั้งถัดไปสามารถใช้ archive เดิมซ้ำได้
- snapshots อัตโนมัติสำหรับการย้าย Matrix เหล่านี้จะสำรองเฉพาะ config + state (`includeWorkspace: false`)
- หาก Matrix มีเพียงสถานะการย้ายแบบ warning-only เช่นเพราะยังขาด `userId` หรือ `accessToken` OpenClaw จะยังไม่สร้าง snapshot เพราะยังไม่มีการเปลี่ยนสถานะ Matrix ที่ทำได้จริง
- หากขั้นตอน snapshot ล้มเหลว OpenClaw จะข้ามการย้าย Matrix ในรอบนั้น แทนที่จะเปลี่ยนสถานะโดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดแบบหลายบัญชี:

- flat Matrix store ที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบ single-store ดังนั้น OpenClaw จึงสามารถย้ายมันไปยังเป้าหมายบัญชี Matrix ที่ resolve ได้เพียงหนึ่งบัญชีเท่านั้น
- Matrix stores แบบเก่าที่กำหนดขอบเขตตามบัญชีอยู่แล้วจะถูกตรวจพบและเตรียมพร้อมรายบัญชี Matrix ที่กำหนดค่าไว้

## สิ่งที่การย้ายไม่สามารถทำให้อัตโนมัติได้

Matrix Plugin สาธารณะรุ่นก่อนหน้า **ไม่ได้** สร้าง Matrix room-key backups โดยอัตโนมัติ มันเก็บสถานะ crypto ในเครื่องและร้องขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่า room keys ของคุณถูกสำรองไว้บน homeserver

นั่นหมายความว่าการติดตั้งแบบเข้ารหัสบางกรณีสามารถย้ายได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้สำหรับ:

- room keys ที่อยู่เฉพาะในเครื่องและไม่เคยถูกสำรอง
- สถานะที่เข้ารหัสเมื่อยังไม่สามารถ resolve บัญชี Matrix เป้าหมายได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้
- การย้ายอัตโนมัติของ flat Matrix store ที่ใช้ร่วมกันเพียงชุดเดียว เมื่อมีการกำหนดค่าหลายบัญชี Matrix แต่ไม่ได้ตั้ง `channels.matrix.defaultAccount`
- การติดตั้ง custom plugin path ที่ pin ไว้กับพาธของ repo แทนที่จะใช้แพ็กเกจ Matrix มาตรฐาน
- recovery key ที่หายไป เมื่อ store เก่ามี backed-up keys แต่ไม่ได้เก็บ decryption key ไว้ในเครื่อง

ขอบเขตของคำเตือนปัจจุบัน:

- การติดตั้ง Matrix plugin แบบ custom path จะแสดงโดยทั้ง gateway startup และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมีประวัติที่เข้ารหัสซึ่งอยู่เฉพาะในเครื่องและไม่เคยถูกสำรอง ข้อความเก่าบางส่วนที่เข้ารหัสไว้อาจยังไม่สามารถอ่านได้หลังการอัปเกรด

## โฟลว์การอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Matrix Plugin ตามปกติ
   ควรใช้ `openclaw update` แบบปกติโดยไม่ใส่ `--no-restart` เพื่อให้ startup ทำการย้าย Matrix จนเสร็จทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายที่ทำได้จริง doctor จะสร้างหรือใช้ pre-migration snapshot เดิมก่อน แล้วพิมพ์พาธของ archive

3. เริ่มหรือรีสตาร์ต gateway
4. ตรวจสอบสถานะการยืนยันและการสำรองข้อมูลปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. หาก OpenClaw แจ้งว่าต้องใช้ recovery key ให้รัน:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. หากอุปกรณ์นี้ยังไม่ผ่านการยืนยัน ให้รัน:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. หากคุณตั้งใจจะละทิ้งประวัติเก่าที่กู้คืนไม่ได้ และต้องการ backup baseline ใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. หากยังไม่มี server-side key backup ให้สร้างไว้สำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## การย้ายแบบเข้ารหัสทำงานอย่างไร

การย้ายแบบเข้ารหัสเป็นกระบวนการสองขั้น:

1. Startup หรือ `openclaw doctor --fix` จะสร้างหรือใช้ pre-migration snapshot เดิม หากการย้ายแบบเข้ารหัสทำได้จริง
2. Startup หรือ `openclaw doctor --fix` จะตรวจสอบ Matrix crypto store เก่าผ่านการติดตั้ง Matrix Plugin ที่กำลังใช้งานอยู่
3. หากพบ backup decryption key OpenClaw จะเขียนมันเข้าสู่โฟลว์ recovery-key ใหม่ และทำเครื่องหมายว่า room-key restore ยัง pending อยู่
4. ใน Matrix startup ครั้งถัดไป OpenClaw จะกู้คืน backed-up room keys เข้าไปใน crypto store ใหม่โดยอัตโนมัติ

หาก store เก่ารายงานว่ามี room keys ที่ไม่เคยถูกสำรอง OpenClaw จะเตือน แทนที่จะแสร้งว่าการกู้คืนสำเร็จ

## ข้อความที่พบบ่อยและความหมาย

### ข้อความการอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบสถานะ Matrix บนดิสก์แบบเก่าและย้ายไปยังเลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่เอาต์พุตเดียวกันนั้นจะมีคำเตือนรวมอยู่ด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้าง recovery archive ก่อนเปลี่ยนสถานะ Matrix
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบ marker ของ Matrix migration snapshot ที่มีอยู่แล้ว และใช้ archive เดิมซ้ำแทนการสร้างสำรองซ้ำ
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มีสถานะ Matrix แบบเก่าอยู่ แต่ OpenClaw ยังไม่สามารถแมปมันไปยังบัญชี Matrix ปัจจุบันได้เพราะยังไม่ได้กำหนดค่า Matrix
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบสถานะเก่า แต่ยังไม่สามารถระบุ root ของบัญชี/อุปกรณ์ปัจจุบันที่แน่นอนได้
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจากมี cached credentials แล้ว

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ flat Matrix store ที่ใช้ร่วมกันเพียงชุดเดียว แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix แบบตั้งชื่อใดควรได้รับมัน
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ต้องการ จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งแบบกำหนดขอบเขตตามบัญชีใหม่มี sync หรือ crypto store อยู่แล้ว ดังนั้น OpenClaw จึงไม่เขียนทับโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้อง ก่อนลบหรือย้ายเป้าหมายที่ชนกันนั้นด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้ายสถานะ Matrix แบบเก่า แต่การทำงานกับระบบไฟล์ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์และสภาพดิสก์ จากนั้นรัน `openclaw doctor --fix` ใหม่

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบ encrypted Matrix store แบบเก่า แต่ยังไม่มี config Matrix ปัจจุบันให้ผูกเข้าด้วย
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: encrypted store มีอยู่ แต่ OpenClaw ยังไม่สามารถตัดสินได้อย่างปลอดภัยว่ามันเป็นของบัญชี/อุปกรณ์ปัจจุบันใด
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจาก cached credentials พร้อมแล้ว

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ legacy crypto store แบบ flat ที่ใช้ร่วมกันเพียงชุดเดียว แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix แบบตั้งชื่อใดควรได้รับมัน
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ต้องการ จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบสถานะ Matrix แบบเก่า แต่การย้ายยังถูกบล็อกเพราะขาดข้อมูลตัวตนหรือข้อมูลรับรอง
- สิ่งที่ต้องทำ: ทำ Matrix login หรือการตั้งค่า config ให้เสร็จ จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบสถานะ Matrix แบบเข้ารหัสเก่า แต่ไม่สามารถโหลด helper entrypoint จาก Matrix Plugin ที่ปกติใช้ตรวจสอบ store นั้นได้
- สิ่งที่ต้องทำ: ติดตั้งหรือซ่อม Matrix Plugin ใหม่ (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ helper ที่หลุดออกจากรากของ Plugin หรือไม่ผ่านการตรวจสอบขอบเขตของ Plugin จึงปฏิเสธที่จะ import
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ จากนั้นรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยนสถานะ Matrix เพราะไม่สามารถสร้าง recovery snapshot ได้ก่อน
- สิ่งที่ต้องทำ: แก้ข้อผิดพลาดของการสำรองข้อมูล แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: fallback ฝั่ง Matrix client พบ storage แบบ flat เก่า แต่การย้ายล้มเหลว ขณะนี้ OpenClaw จะยกเลิก fallback นั้นแทนที่จะเริ่มด้วย store ใหม่แบบเงียบๆ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือความขัดแย้งต่างๆ รักษาสถานะเก่าไว้ให้ครบ แล้วลองใหม่หลังแก้ข้อผิดพลาดนั้น

`Matrix ถูกติดตั้งจากพาธแบบกำหนดเอง: ...`

- ความหมาย: Matrix ถูก pin ไว้กับการติดตั้งแบบพาธ ดังนั้นการอัปเดต mainline จะไม่แทนที่มันด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Matrix Plugin ค่าเริ่มต้น

### ข้อความเกี่ยวกับการกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: room keys ที่สำรองไว้ถูกกู้คืนสำเร็จเข้าไปยัง crypto store ใหม่
- สิ่งที่ต้องทำ: โดยทั่วไปไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: room keys เก่าบางรายการมีอยู่เฉพาะใน store เดิมในเครื่อง และไม่เคยถูกอัปโหลดไปยัง Matrix backup
- สิ่งที่ต้องทำ: ให้คาดไว้ว่า encrypted history เก่าบางส่วนจะยังไม่สามารถใช้ได้ เว้นแต่คุณจะกู้คืน keys เหล่านั้นด้วยตนเองจากไคลเอนต์ที่ผ่านการยืนยันแล้วเครื่องอื่น

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- ความหมาย: มี backup อยู่ แต่ OpenClaw ไม่สามารถกู้ recovery key กลับมาได้โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ encrypted store แบบเก่า แต่ไม่สามารถตรวจสอบมันได้อย่างปลอดภัยพอที่จะเตรียมการกู้คืน
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` ใหม่ หากเกิดซ้ำ ให้คงไดเรกทอรีสถานะเก่าไว้เหมือนเดิม แล้วกู้คืนโดยใช้ Matrix client ที่ผ่านการยืนยันแล้วเครื่องอื่นร่วมกับ `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบให้แน่ใจว่า recovery key ใดถูกต้องก่อนลองรันคำสั่ง restore ใดๆ อีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือขีดจำกัดแบบแข็งของรูปแบบการจัดเก็บแบบเก่า
- สิ่งที่ต้องทำ: backed-up keys ยังสามารถกู้คืนได้ แต่ประวัติที่เข้ารหัสซึ่งอยู่เฉพาะในเครื่องอาจยังคงใช้ไม่ได้

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix คืนข้อผิดพลาดกลับมา
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` จากนั้นลองใหม่ด้วย `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` หากจำเป็น

### ข้อความเกี่ยวกับการกู้คืนแบบกำหนดเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw รู้ว่าคุณควรมี backup key แต่ยังไม่ได้เปิดใช้งานบนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือส่ง `--recovery-key` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: อุปกรณ์นี้ยังไม่มี recovery key ถูกเก็บไว้ในปัจจุบัน
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ด้วย recovery key ของคุณก่อน จากนั้นค่อย restore backup

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- ความหมาย: key ที่เก็บไว้ไม่ตรงกับ Matrix backup ที่ใช้งานอยู่
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่ด้วย key ที่ถูกต้อง

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ คุณสามารถรีเซ็ต
backup baseline ปัจจุบันแทนได้ด้วย `openclaw matrix verify backup reset --yes` เมื่อ
backup secret ที่เก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่สามารถโหลดได้อย่างถูกต้องหลังการรีสตาร์ต

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- ความหมาย: มี backup อยู่ แต่ device นี้ยังไม่เชื่อถือ cross-signing chain มากพอ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนกู้คืนโดยไม่ได้ส่ง recovery key ในกรณีที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งใหม่พร้อม recovery key ของคุณ

`Invalid Matrix recovery key: ...`

- ความหมาย: key ที่ให้มาไม่สามารถ parse ได้ หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองใหม่ด้วย recovery key แบบตรงตัวจาก Matrix client หรือไฟล์ recovery-key ของคุณ

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- ความหมาย: key ถูกนำไปใช้แล้ว แต่อุปกรณ์ยังไม่สามารถยืนยันตัวตนจนเสร็จได้
- สิ่งที่ต้องทำ: ยืนยันว่าคุณใช้ key ถูกต้อง และบัญชีนั้นมี cross-signing ใช้งานได้ จากนั้นลองใหม่

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่สามารถสร้าง active backup session บนอุปกรณ์นี้ได้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ก่อน จากนั้นตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- ความหมาย: อุปกรณ์นี้ยังไม่สามารถกู้คืนจาก secret storage ได้จนกว่าจะยืนยันอุปกรณ์เสร็จ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ก่อน

### ข้อความเกี่ยวกับการติดตั้ง custom plugin

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: บันทึกการติดตั้ง Plugin ของคุณชี้ไปยังพาธในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หาก encrypted history ยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

หาก backup ถูกกู้คืนสำเร็จ แต่บางห้องเก่ายังไม่มีประวัติ แสดงว่า keys ที่หายไปเหล่านั้นน่าจะไม่เคยถูกสำรองโดย Plugin ก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ และต้องการเพียง backup baseline ที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากหลังจากนั้นอุปกรณ์ยังไม่ผ่านการยืนยัน ให้ทำการยืนยันให้เสร็จจาก Matrix client ของคุณโดยเปรียบเทียบอีโมจิ SAS หรือรหัสตัวเลข แล้วกดยืนยันว่าตรงกัน

## หน้าที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix)
- [Doctor](/th/gateway/doctor)
- [Migrating](/th/install/migrating)
- [Plugins](/th/tools/plugin)
