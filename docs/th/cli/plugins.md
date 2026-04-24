---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Gateway plugins หรือ bundles ที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด plugin
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T09:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

จัดการ Gateway plugins, hook packs และ bundles ที่เข้ากันได้

ที่เกี่ยวข้อง:

- ระบบ Plugin: [Plugins](/th/tools/plugin)
- ความเข้ากันได้ของ bundle: [Plugin bundles](/th/plugins/bundles)
- manifest และ schema ของ Plugin: [Plugin manifest](/th/plugins/manifest)
- การทำให้แข็งแกร่งด้านความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## คำสั่ง

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Bundled plugins มาพร้อมกับ OpenClaw บางตัวถูกเปิดใช้โดยค่าเริ่มต้น (ตัวอย่างเช่น
ผู้ให้บริการโมเดลที่มาพร้อม ผู้ให้บริการเสียงพูดที่มาพร้อม และ browser
plugin ที่มาพร้อม); ส่วนตัวอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON
Schema แบบอินไลน์ (`configSchema` แม้จะว่างก็ตาม) ส่วน bundles ที่เข้ากันได้จะใช้ bundle
manifest ของตนเองแทน

`plugins list` จะแสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตแบบ verbose ของ list/info
จะแสดงประเภทย่อยของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมด้วย
ความสามารถของ bundle ที่ตรวจพบ

### ติดตั้ง

```bash
openclaw plugins install <package>                      # ClawHub ก่อน จากนั้น npm
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ปักหมุดเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธในเครื่อง
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

ชื่อแพ็กเกจแบบเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน จากนั้นจึง npm หมายเหตุด้านความปลอดภัย:
ให้ปฏิบัติต่อการติดตั้ง plugin เหมือนกับการรันโค้ด แนะนำให้ใช้เวอร์ชันที่ปักหมุดไว้

หากส่วน `plugins` ของคุณรองรับด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และจะไม่แตะ `openclaw.json` การ include ที่ระดับราก, include แบบอาร์เรย์ และ include ที่มีการ override ร่วมระดับเดียวกัน จะล้มเหลวแบบ fail-closed แทนที่จะ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

หาก config ไม่ถูกต้อง โดยปกติ `plugins install` จะล้มเหลวแบบ fail-closed และบอกให้คุณ
รัน `openclaw doctor --fix` ก่อน ข้อยกเว้นที่มีการบันทึกไว้เพียงอย่างเดียวคือเส้นทาง recovery แบบแคบสำหรับ bundled-plugin ที่ plugin นั้นเลือกเปิดใช้
`openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

`--force` จะใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ plugin หรือ hook pack ที่ติดตั้งอยู่แล้ว
ในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, แพ็กเกจ ClawHub หรือ npm artifact ใหม่
สำหรับการอัปเกรดตามปกติของ npm plugin ที่ถูกติดตามอยู่แล้ว แนะนำให้ใช้
`openclaw plugins update <id-or-npm-spec>`

หากคุณรัน `plugins install` สำหรับ plugin id ที่ติดตั้งอยู่แล้ว OpenClaw
จะหยุดและแนะนำให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ
หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับ
การติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

`--pin` ใช้ได้เฉพาะกับการติดตั้งจาก npm เท่านั้น ไม่รองรับกับ `--marketplace`
เพราะการติดตั้งจาก marketplace จะเก็บเมทาดาทาแหล่งที่มาของ marketplace แทน
npm spec

`--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive
ในตัวสแกนโค้ดอันตรายที่มีมาในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้
ตัวสแกนในตัวจะรายงานผลการค้นพบระดับ `critical` แต่ **ไม่** ข้ามบล็อกนโยบายของ hook `before_install` ของ plugin และ **ไม่** ข้าม
ความล้มเหลวของการสแกน

แฟล็ก CLI นี้ใช้กับโฟลว์ install/update ของ plugin ส่วนการติดตั้ง dependency ของ Skills
ที่ขับเคลื่อนโดย Gateway จะใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกัน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

`plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย
`openclaw.hooks` ใน `package.json` ด้วย ให้ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองแล้ว
และการเปิดใช้งานต่อ hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

npm spec เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบระบุแน่นอน** หรือ
**dist-tag** แบบไม่บังคับ) Git/URL/file spec และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency
จะรันด้วย `--ignore-scripts` เพื่อความปลอดภัย

spec แบบเปล่าและ `@latest` จะอยู่ในสาย stable หาก npm resolve อย่างใดอย่างหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้โดยชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบระบุแน่นอน เช่น
`@1.2.3-beta.4`

หาก install spec แบบเปล่าตรงกับ bundled plugin id (เช่น `diffs`) OpenClaw
จะติดตั้ง bundled plugin โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่ชื่อเดียวกัน
ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar`

รองรับการติดตั้งจาก Claude marketplace ด้วยเช่นกัน

การติดตั้งจาก ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ตอนนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub สำหรับ bare npm-safe plugin spec ด้วย โดยจะ fallback ไปที่ npm ก็ต่อเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw จะดาวน์โหลด package archive จาก ClawHub ตรวจสอบ
ความเข้ากันได้ของ plugin API / minimum gateway ตามที่ประกาศไว้ จากนั้นจึงติดตั้งผ่านเส้นทาง
archive ปกติ การติดตั้งที่ถูกบันทึกไว้จะคงเมทาดาทาแหล่งที่มาจาก ClawHub สำหรับการอัปเดตภายหลัง

ใช้รูปแบบย่อ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคช local registry ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่งที่มาของ marketplace แบบชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

แหล่งที่มาของ marketplace สามารถเป็น:

- ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
- ราก marketplace ในเครื่องหรือพาธ `marketplace.json`
- รูปแบบย่อ GitHub repo เช่น `owner/repo`
- URL ของ GitHub repo เช่น `https://github.com/owner/repo`
- git URL

สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ plugin ต้องยังอยู่ภายใน cloned marketplace repo นั้น OpenClaw ยอมรับแหล่ง plugin แบบ relative path จาก repo นั้น และปฏิเสธแหล่ง plugin แบบ HTTP(S), absolute-path, git, GitHub และแหล่งอื่นที่ไม่ใช่พาธจาก remote manifest

สำหรับ local path และ archive OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin เนทีฟของ OpenClaw (`openclaw.plugin.json`)
- bundles ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundles ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout คอมโพเนนต์ Claude เริ่มต้น)
- bundles ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

bundles ที่เข้ากันได้จะถูกติดตั้งในราก plugin ปกติ และเข้าร่วม
ในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของ bundle, Claude
command-skills, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น Claude `.lsp.json` /
`lspServers` ที่ประกาศใน manifest, Cursor command-skills และ compatible
ไดเรกทอรี hook ของ Codex; ความสามารถอื่นของ bundle ที่ตรวจพบ
จะแสดงใน diagnostics/info แต่ยังไม่ถูกต่อเข้ากับการทำงานของรันไทม์

### แสดงรายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--enabled` เพื่อแสดงเฉพาะ plugins ที่โหลดอยู่ ใช้ `--verbose` เพื่อสลับจาก
มุมมองแบบตารางไปเป็นบรรทัดรายละเอียดต่อ plugin พร้อมเมทาดาทา
source/origin/version/activation ใช้ `--json` สำหรับ inventory ที่อ่านได้ด้วยเครื่อง
พร้อม diagnostics ของ registry

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มไปยัง `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้
source path ซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่มีการจัดการอยู่

ใช้ `--pin` กับการติดตั้งจาก npm เพื่อบันทึก spec ที่ resolve แล้วแบบแน่นอน (`name@version`) ลงใน
`plugins.installs` ขณะยังคงให้พฤติกรรมเริ่มต้นไม่ถูกปักหมุด

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบบันทึก plugin ออกจาก `plugins.entries`, `plugins.installs`,
allowlist ของ plugin และรายการ `plugins.load.paths` แบบลิงก์เมื่อมีการใช้งาน
สำหรับ active memory plugins ช่องหน่วยความจำจะรีเซ็ตเป็น `memory-core`

โดยค่าเริ่มต้น การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้ง plugin ใต้ราก plugin ของ state-dir ที่ใช้งานอยู่ด้วย ใช้
`--keep-files` เพื่อเก็บไฟล์ไว้บนดิสก์

รองรับ `--keep-config` เป็นชื่อเรียกแทนที่เลิกใช้แล้วของ `--keep-files`

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้งที่ถูกติดตามใน `plugins.installs` และการติดตั้ง hook-pack ที่ถูกติดตามใน `hooks.internal.installs`

เมื่อคุณส่ง plugin id OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ
plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่จัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ปักหมุดแบบแน่นอน จะยังคงถูกใช้ในการรัน `update <id>` ภายหลัง

สำหรับการติดตั้งจาก npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag
หรือเวอร์ชันแบบแน่นอนได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังบันทึก plugin ที่ถูกติดตาม อัปเดต plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตแบบอิง id ในอนาคต

การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยัง
บันทึก plugin ที่ถูกติดตามเช่นกัน ใช้สิ่งนี้เมื่อ plugin ถูกปักหมุดไว้ที่เวอร์ชันแบบแน่นอน และ
คุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

ก่อนการอัปเดต npm แบบจริง OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งอยู่เทียบกับ
เมทาดาทาของ npm registry หากเวอร์ชันที่ติดตั้งและ
ข้อมูลตัวตนของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่
ดาวน์โหลด ติดตั้งซ้ำ หรือเขียน `openclaw.json` ใหม่

เมื่อมีแฮช integrity ที่จัดเก็บไว้และแฮชของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง
`openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดไว้และแฮชจริง และถาม
เพื่อยืนยันก่อนดำเนินการ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะล้มเหลวแบบ fail-closed
เว้นแต่ผู้เรียกจะส่งนโยบายการดำเนินการต่อแบบชัดเจน

`--dangerously-force-unsafe-install` ใช้ได้กับ `plugins update` เช่นกัน ในฐานะ
break-glass override สำหรับ false positive จากการสแกนโค้ดอันตรายในตัวระหว่าง
การอัปเดต plugin โดยยังคงไม่ข้ามบล็อกนโยบาย `before_install` ของ plugin
หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต plugin ไม่ใช่การอัปเดต hook-pack

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ plugin เดียว แสดงตัวตน สถานะการโหลด แหล่งที่มา
ความสามารถที่ลงทะเบียนไว้ hooks เครื่องมือ คำสั่ง บริการ gateway methods
HTTP routes แฟล็กนโยบาย diagnostics เมทาดาทาการติดตั้ง ความสามารถของ bundle
และการรองรับ MCP หรือ LSP server ที่ตรวจพบ

แต่ละ plugin จะถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงในรันไทม์:

- **plain-capability** — ความสามารถเพียงประเภทเดียว (เช่น plugin ที่เป็น provider อย่างเดียว)
- **hybrid-capability** — หลายประเภทความสามารถ (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hooks ไม่มีความสามารถหรือพื้นผิวใด ๆ
- **non-capability** — มีเครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปแบบของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

แฟล็ก `--json` จะส่งออกรายงานแบบที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และ
การตรวจสอบ

`inspect --all` จะแสดงตารางทั้งชุดพร้อมคอลัมน์ shape, ชนิดของความสามารถ
ข้อสังเกตด้านความเข้ากันได้ ความสามารถของ bundle และสรุป hook

`info` เป็นชื่อเรียกแทนของ `inspect`

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดในการโหลด plugin, diagnostics ของ manifest/การค้นพบ และ
ข้อสังเกตด้านความเข้ากันได้ เมื่อทุกอย่างปกติจะพิมพ์ `No plugin issues
detected.`

สำหรับความล้มเหลวของรูปร่างโมดูล เช่น ไม่มี export `register`/`activate` ให้รันใหม่
พร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบย่อไว้ใน
เอาต์พุต diagnostics

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

การแสดงรายการ marketplace รองรับพาธ marketplace ในเครื่อง พาธ `marketplace.json`
รูปแบบย่อ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL `--json`
จะพิมพ์ป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม marketplace manifest และ
รายการ plugin ที่แยกวิเคราะห์แล้ว

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การสร้าง Plugins](/th/plugins/building-plugins)
- [Plugins ชุมชน](/th/plugins/community)
