---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ plugins ของ Gateway หรือ bundles ที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (แสดงรายการ, ติดตั้ง, มาร์เก็ตเพลส, ถอนการติดตั้ง, เปิด/ปิดใช้งาน, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T06:19:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad76a8068054d145db578ed01f1fb0726fff884c48d256ad8c0b708a516cd727
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

จัดการ plugins ของ Gateway, hook packs และ bundles ที่เข้ากันได้

ที่เกี่ยวข้อง:

- ระบบ Plugin: [Plugins](/th/tools/plugin)
- ความเข้ากันได้ของ bundle: [Plugin bundles](/th/plugins/bundles)
- manifest และ schema ของ Plugin: [Plugin manifest](/th/plugins/manifest)
- การเสริมความแข็งแกร่งด้านความปลอดภัย: [Security](/th/gateway/security)

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

plugins ที่มาพร้อมกับ OpenClaw จะถูกรวมมากับตัวโปรแกรม บางตัวเปิดใช้งานโดยค่าเริ่มต้น (เช่น
providers ของโมเดลที่มาพร้อมกัน providers ของเสียงพูดที่มาพร้อมกัน และ browser
Plugin ที่มาพร้อมกัน); ส่วนตัวอื่นต้องใช้ `plugins enable`

plugins ของ OpenClaw แบบ native ต้องมี `openclaw.plugin.json` พร้อม JSON
Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) ส่วน bundles ที่เข้ากันได้จะใช้
bundle manifests ของตัวเองแทน

`plugins list` จะแสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info
แบบ verbose จะแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมทั้งความสามารถของ bundle
ที่ตรวจพบด้วย

### ติดตั้ง

```bash
openclaw plugins install <package>                      # ClawHub ก่อน แล้วจึง npm
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ตรึงเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธในเครื่อง
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

ชื่อแพ็กเกจแบบเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึง npm หมายเหตุด้านความปลอดภัย:
ให้มองการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ตรึงไว้

หาก config ไม่ถูกต้อง โดยปกติ `plugins install` จะล้มเหลวแบบปิดไว้ก่อน และบอกให้คุณ
รัน `openclaw doctor --fix` ก่อน ข้อยกเว้นเดียวที่มีเอกสารระบุไว้คือเส้นทางกู้คืน
bundled-plugin แบบจำกัดสำหรับ plugins ที่ opt in อย่างชัดเจนกับ
`openclaw.install.allowInvalidConfigRecovery`

`--force` จะใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack
ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อต้องการติดตั้ง id เดิมซ้ำอย่างตั้งใจ
จากพาธในเครื่องใหม่ ไฟล์บีบอัด แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm
สำหรับการอัปเกรดตามปกติของ npm Plugin ที่มีการติดตามอยู่แล้ว ให้ใช้
`openclaw plugins update <id-or-npm-spec>`

`--pin` ใช้ได้กับการติดตั้ง npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace`
เพราะการติดตั้งจาก marketplace จะบันทึกข้อมูลเมทาดาทาต้นทางของ marketplace แทน
npm spec

`--dangerously-force-unsafe-install` เป็นตัวเลือกใช้ในกรณีฉุกเฉินสำหรับ false positive
จากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัว
จะรายงานผลการตรวจพบระดับ `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบายของ hook
`before_install` ของ Plugin และ **ไม่** ข้ามการบล็อกจาก scan failure

แฟลก CLI นี้ใช้กับโฟลว์การติดตั้ง/อัปเดต Plugin ส่วนการติดตั้ง dependency ของ Skills
ที่อาศัย Gateway จะใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่
`openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

`plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดให้ใช้
`openclaw.hooks` ใน `package.json` ด้วย ให้ใช้ `openclaw hooks` สำหรับการดู hook
แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

สเปก npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบตรงตัว** หรือ
**dist-tag** แบบไม่บังคับ) ระบบจะปฏิเสธสเปกแบบ Git/URL/file และช่วง semver
การติดตั้ง dependency จะรันพร้อม `--ignore-scripts` เพื่อความปลอดภัย

สเปกเปล่าและ `@latest` จะอยู่ในสายเสถียร หาก npm resolve อย่างใดอย่างหนึ่ง
เหล่านั้นไปเป็นรุ่น prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบตรงตัว เช่น
`@1.2.3-beta.4`

หากสเปกการติดตั้งแบบเปล่าตรงกับ id ของ bundled Plugin (เช่น `diffs`), OpenClaw
จะติดตั้ง bundled Plugin นั้นโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่ชื่อเดียวกัน
ให้ใช้สเปกแบบมี scope อย่างชัดเจน (เช่น `@scope/diffs`)

ไฟล์บีบอัดที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar`

รองรับการติดตั้งจาก Claude marketplace ด้วย

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` อย่างชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ตอนนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub ก่อนสำหรับสเปก Plugin แบบ bare ที่ปลอดภัยกับ npm ด้วย
มันจะ fallback ไปยัง npm ก็ต่อเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw จะดาวน์โหลดไฟล์บีบอัดของแพ็กเกจจาก ClawHub ตรวจสอบ
ความเข้ากันได้ของ plugin API / minimum gateway ตามที่ประกาศ แล้วจึงติดตั้งผ่าน
เส้นทางไฟล์บีบอัดตามปกติ การติดตั้งที่บันทึกไว้จะเก็บเมทาดาต้าต้นทางของ ClawHub ไว้สำหรับการอัปเดตภายหลัง

ใช้รูปแบบย่อ `plugin@marketplace` เมื่อมีชื่อ marketplace อยู่ในแคช local registry
ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งต้นทางของ marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

ต้นทางของ marketplace สามารถเป็น:

- ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
- root ของ marketplace ในเครื่องหรือพาธ `marketplace.json`
- รูปแบบย่อ repo ของ GitHub เช่น `owner/repo`
- URL ของ repo บน GitHub เช่น `https://github.com/owner/repo`
- git URL

สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องยังอยู่
ภายใน repo ของ marketplace ที่ถูก clone มา OpenClaw ยอมรับแหล่งที่มาที่เป็นพาธแบบ relative จาก
repo นั้น และจะปฏิเสธแหล่งที่มาของ Plugin จาก manifest ระยะไกลที่เป็น HTTP(S), absolute-path,
git, GitHub และแบบอื่นที่ไม่ใช่พาธ

สำหรับพาธในเครื่องและไฟล์บีบอัด OpenClaw จะตรวจจับอัตโนมัติ:

- plugins ของ OpenClaw แบบ native (`openclaw.plugin.json`)
- bundles ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundles ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์
  component เริ่มต้นของ Claude)
- bundles ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

bundles ที่เข้ากันได้จะถูกติดตั้งลงใน root ของ extensions ตามปกติและเข้าร่วมในโฟลว์
list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ใน bundle,
command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น
`.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor
และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถของ bundle อื่นที่ตรวจพบ
จะแสดงใน diagnostics/info แต่ยังไม่เชื่อมเข้ากับการทำงานขณะรันในตอนนี้

### แสดงรายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--enabled` เพื่อแสดงเฉพาะ plugins ที่โหลดอยู่ ใช้ `--verbose` เพื่อสลับจาก
มุมมองแบบตารางไปเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมทาดาต้า
เกี่ยวกับ source/origin/version/activation ใช้ `--json` สำหรับ inventory
ที่เครื่องอ่านได้พร้อม diagnostics ของ registry

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` ไม่รองรับร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธต้นทาง
แทนการคัดลอกทับเป้าหมายการติดตั้งที่ถูกจัดการ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกสเปก exact ที่ resolve แล้ว (`name@version`) ลงใน
`plugins.installs` ขณะที่พฤติกรรมค่าเริ่มต้นยังคงไม่ตรึงเวอร์ชัน

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบบันทึกของ Plugin ออกจาก `plugins.entries`, `plugins.installs`,
allowlist ของ Plugin และรายการ `plugins.load.paths` แบบลิงก์เมื่อเกี่ยวข้อง
สำหรับ Active Memory plugins ช่องหน่วยความจำจะรีเซ็ตเป็น `memory-core`

โดยค่าเริ่มต้น การถอนการติดตั้งจะลบไดเรกทอรีติดตั้งของ Plugin ใต้
root ของ Plugin ใน state-dir ที่กำลังใช้งานด้วย ใช้
`--keep-files` เพื่อเก็บไฟล์ไว้บนดิสก์

รองรับ `--keep-config` เป็นนามแฝงที่เลิกใช้แล้วของ `--keep-files`

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้งที่ติดตามไว้ใน `plugins.installs` และการติดตั้ง
hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้สเปกการติดตั้งที่บันทึกไว้สำหรับ
Plugin นั้นซ้ำ หมายความว่า dist-tag ที่เก็บไว้ก่อนหน้า เช่น `@beta` และ
เวอร์ชัน exact ที่ตรึงไว้ จะยังคงถูกใช้ต่อในการรัน `update <id>` ภายหลัง

สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag
หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้
อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่ไว้สำหรับการอัปเดตตาม id ในอนาคต

การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็ก ก็จะ resolve กลับไปยัง
ระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้ในกรณีที่ Plugin ถูกตรึงไว้ที่เวอร์ชัน exact และ
คุณต้องการย้ายกลับไปยังสายรีลีสค่าเริ่มต้นของ registry

ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันของแพ็กเกจที่ติดตั้งเทียบกับ
เมทาดาต้าของ npm registry หากเวอร์ชันที่ติดตั้งและตัวตนอาร์ติแฟกต์
ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้วอยู่ก่อนแล้ว การอัปเดตจะถูกข้ามไปโดยไม่
ดาวน์โหลด ติดตั้งซ้ำ หรือเขียน `openclaw.json` ใหม่

เมื่อมีแฮชความถูกต้องที่บันทึกไว้และแฮชของอาร์ติแฟกต์ที่ดึงมาเปลี่ยนไป
OpenClaw จะถือว่านี่คือ npm artifact drift คำสั่ง
`openclaw plugins update` แบบโต้ตอบจะพิมพ์แฮชที่คาดหวังและแฮชจริง พร้อมถาม
การยืนยันก่อนดำเนินการต่อ ส่วนตัวช่วยอัปเดตแบบไม่โต้ตอบจะล้มเหลวแบบปิดไว้ก่อน
เว้นแต่ผู้เรียกจะส่งนโยบายให้ดำเนินการต่ออย่างชัดเจน

`--dangerously-force-unsafe-install` ยังใช้ได้กับ `plugins update` ในฐานะ
ตัวเลือกฉุกเฉินสำหรับ false positive ของการสแกนโค้ดอันตรายในตัวระหว่าง
การอัปเดต Plugin แต่มันก็ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin
หรือการบล็อกจาก scan-failure และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ Plugin เดียว แสดงตัวตน สถานะการโหลด แหล่งที่มา
ความสามารถที่ลงทะเบียนไว้ hooks, tools, commands, services, เมธอดของ Gateway,
เส้นทาง HTTP, แฟล็กนโยบาย, diagnostics, เมทาดาต้าการติดตั้ง, ความสามารถของ bundle
และการรองรับ MCP หรือ LSP server ที่ตรวจพบ

แต่ละ Plugin จะถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงขณะรัน:

- **plain-capability** — มีความสามารถเพียงประเภทเดียว (เช่น Plugin ที่เป็น provider อย่างเดียว)
- **hybrid-capability** — มีหลายประเภทความสามารถ (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hooks ไม่มี capabilities หรือ surfaces
- **non-capability** — มี tools/commands/services แต่ไม่มี capabilities

ดู [รูปร่างของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

แฟลก `--json` จะส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และ
การตรวจสอบ

`inspect --all` จะแสดงตารางทั้งชุด พร้อมคอลัมน์ shape, ชนิดของ capability,
ประกาศความเข้ากันได้, ความสามารถของ bundle และสรุป hook

`info` เป็นนามแฝงของ `inspect`

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดในการโหลด Plugin, diagnostics ของ manifest/discovery และ
ประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อยดีแล้ว มันจะแสดง `No plugin issues
detected.`

สำหรับความล้มเหลวเกี่ยวกับรูปร่างของโมดูล เช่น ไม่มี export `register`/`activate` ให้รันใหม่
พร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบย่อไว้ใน
เอาต์พุตการวินิจฉัย

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ marketplace รับได้ทั้งพาธ marketplace ในเครื่อง พาธ `marketplace.json`
รูปแบบย่อของ GitHub อย่าง `owner/repo`, URL ของ GitHub repo หรือ git URL `--json`
จะพิมพ์ป้ายกำกับต้นทางที่ resolve แล้ว พร้อม manifest ของ marketplace และ
รายการ Plugin ที่แยกวิเคราะห์แล้ว
