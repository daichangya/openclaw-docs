---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

จัดการ Plugin ของ Gateway, hook pack และบันเดิลที่เข้ากันได้

ที่เกี่ยวข้อง:

- ระบบ Plugin: [Plugins](/th/tools/plugin)
- ความเข้ากันได้ของบันเดิล: [Plugin bundles](/th/plugins/bundles)
- manifest และ schema ของ Plugin: [Plugin manifest](/th/plugins/manifest)
- การเสริมความปลอดภัย: [Security](/th/gateway/security)

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

Bundled plugins มาพร้อมกับ OpenClaw บางตัวถูกเปิดใช้งานเป็นค่าเริ่มต้น (ตัวอย่างเช่น ผู้ให้บริการโมเดลแบบ bundled, ผู้ให้บริการเสียงพูดแบบ bundled และ browser plugin แบบ bundled) ส่วนตัวอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบ inline (`configSchema` แม้จะว่างเปล่าก็ตาม) ส่วนบันเดิลที่เข้ากันได้จะใช้ bundle manifest ของตัวเองแทน

`plugins list` จะแสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตแบบ verbose ของ list/info จะแสดงประเภทย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบด้วย

### การติดตั้ง

```bash
openclaw plugins install <package>                      # ClawHub ก่อน แล้วค่อย npm
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ตรึงเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธในเครื่อง
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

ชื่อแพ็กเกจแบบเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึงค่อย npm หมายเหตุด้านความปลอดภัย: ให้ถือว่าการติดตั้ง Plugin เทียบเท่ากับการรันโค้ด ควรใช้เวอร์ชันที่ถูกตรึงไว้

หากส่วน `plugins` ของคุณอ้างอิงจาก `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ถูกรวมไว้นั้น และจะไม่แตะต้อง `openclaw.json` การ include ที่ราก, include arrays และ include ที่มีการ override ระดับเดียวกันจะปิดแบบ fail closed แทนที่จะ flatten ดูรูปร่างที่รองรับได้ที่ [Config includes](/th/gateway/configuration)

หาก config ไม่ถูกต้อง โดยปกติ `plugins install` จะปิดแบบ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ข้อยกเว้นเดียวที่มีการบันทึกไว้คือเส้นทางกู้คืนแบบแคบสำหรับ bundled plugin ที่เลือกเปิดใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

`--force` จะใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจากพาธในเครื่องใหม่, archive, แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm สำหรับการอัปเกรดตามปกติของ npm plugin ที่ถูกติดตามอยู่แล้ว ให้ใช้ `openclaw plugins update <id-or-npm-spec>` แทน

หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและแนะนำให้ใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือใช้ `plugins install <package> --force` หากคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

`--pin` ใช้ได้กับการติดตั้งจาก npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะบันทึก metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับกรณี false positive ในตัวสแกนโค้ดอันตรายที่มีมาในตัว มันอนุญาตให้การติดตั้งดำเนินต่อแม้ตัวสแกนในตัวจะรายงานผลการตรวจพบระดับ `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบาย `before_install` hook ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

แฟล็ก CLI นี้ใช้กับโฟลว์ install/update ของ Plugin การติดตั้ง dependency ของ skill ที่ขับเคลื่อนด้วย Gateway จะใช้ request override ที่สอดคล้องกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill จาก ClawHub แยกต่างหาก

`plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook pack ที่ประกาศ `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` เพื่อดู hook แบบกรองแล้วและเปิดใช้งานเป็นราย hook ไม่ใช่เพื่อติดตั้งแพ็กเกจ

npm spec เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบ exact** หรือ **dist-tag** ที่เป็นตัวเลือก) ไม่รองรับ Git/URL/file spec และ semver range การติดตั้ง dependency จะรันด้วย `--ignore-scripts` เพื่อความปลอดภัย

spec แบบเปล่าและ `@latest` จะอยู่ในสาย stable หาก npm resolve สิ่งใดสิ่งหนึ่งเหล่านั้นไปยัง prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

หาก install spec แบบเปล่าตรงกับ id ของ bundled plugin (เช่น `diffs`) OpenClaw จะติดตั้ง bundled plugin โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar`

รองรับการติดตั้งจาก Claude marketplace ด้วยเช่นกัน

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ปัจจุบัน OpenClaw ยังให้ความสำคัญกับ ClawHub ก่อนสำหรับ plugin spec แบบ npm-safe ที่เป็นชื่อเปล่าเช่นกัน โดยจะ fallback ไป npm ก็ต่อเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw จะดาวน์โหลด package archive จาก ClawHub ตรวจสอบความเข้ากันได้ของ plugin API / gateway ขั้นต่ำที่ประกาศไว้ จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ รายการติดตั้งที่ถูกบันทึกจะเก็บ metadata แหล่งที่มาจาก ClawHub ไว้สำหรับการอัปเดตในภายหลัง

ใช้ shorthand แบบ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อต้องการส่งแหล่ง marketplace แบบชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

แหล่ง marketplace สามารถเป็นได้ดังนี้:

- ชื่อ known marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
- รากของ marketplace ในเครื่อง หรือพาธ `marketplace.json`
- shorthand ของ repo GitHub เช่น `owner/repo`
- URL ของ repo GitHub เช่น `https://github.com/owner/repo`
- git URL

สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องคงอยู่ภายใน cloned marketplace repo นั้น OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และจะปฏิเสธแหล่ง Plugin จาก manifest ระยะไกลที่เป็น HTTP(S), absolute-path, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธ

สำหรับพาธในเครื่องและ archive, OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin แบบเนทีฟของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout คอมโพเนนต์ Claude แบบค่าเริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, Claude command-skills, ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` / `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานขณะรัน

### รายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--enabled` เพื่อแสดงเฉพาะ Plugin ที่ถูกโหลด ใช้ `--verbose` เพื่อสลับจากมุมมองแบบตารางเป็นบรรทัดรายละเอียดของแต่ละ Plugin พร้อม metadata ของ source/origin/version/activation ใช้ `--json` สำหรับ inventory ที่เครื่องอ่านได้พร้อม diagnostics ของ registry

`plugins list` จะรันการค้นพบจาก environment และ config ของ CLI ปัจจุบัน จึงมีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกเปิดใช้งาน/โหลดได้หรือไม่ แต่ไม่ใช่การตรวจสอบ runtime แบบสดของโปรเซส Gateway ที่กำลังรันอยู่แล้ว หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการ channel ก่อน แล้วค่อยคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่เริ่มทำงาน สำหรับการ deploy แบบ remote/container ให้ตรวจสอบว่าคุณกำลังรีสตาร์ต child ของ `openclaw gateway run` ตัวจริง ไม่ใช่แค่ wrapper process

สำหรับการดีบัก hook ตอน runtime:

- `openclaw plugins inspect <id> --json` จะแสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว
- `openclaw gateway status --deep --require-rpc` จะยืนยัน Gateway ที่เข้าถึงได้ พร้อมข้อมูลบอกใบ้ของ service/process, พาธ config และสถานะสุขภาพของ RPC
- hook สำหรับบทสนทนาที่ไม่ใช่ bundled (`llm_input`, `llm_output`, `agent_end`) ต้องมี `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มเข้าไปใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธต้นทางซ้ำแทนการคัดลอกทับไปยังเป้าหมายการติดตั้งที่ถูกจัดการ

ใช้ `--pin` กับการติดตั้งจาก npm เพื่อบันทึก exact spec ที่ถูก resolve แล้ว (`name@version`) ลงใน `plugins.installs` โดยยังคงพฤติกรรมค่าเริ่มต้นแบบไม่ตรึงเวอร์ชันไว้

### การถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบบันทึกของ Plugin ออกจาก `plugins.entries`, `plugins.installs`, allowlist ของ Plugin และรายการ linked `plugins.load.paths` เมื่อเกี่ยวข้อง สำหรับ Active Memory plugins ช่องหน่วยความจำจะถูกรีเซ็ตเป็น `memory-core`

ตามค่าเริ่มต้น การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้ง Plugin ใต้ราก plugin ของ state-dir ที่ใช้งานอยู่ด้วย ใช้ `--keep-files` เพื่อเก็บไฟล์ไว้บนดิสก์

รองรับ `--keep-config` ในฐานะ alias ที่เลิกใช้แล้วของ `--keep-files`

### การอัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะมีผลกับการติดตั้งที่ถูกติดตามไว้ใน `plugins.installs` และการติดตั้ง hook-pack ที่ถูกติดตามไว้ใน `hooks.internal.installs`

เมื่อคุณส่ง id ของ Plugin มา OpenClaw จะใช้ install spec ที่บันทึกไว้ของ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เคยเก็บไว้ก่อนหน้านี้ เช่น `@beta` และเวอร์ชันแบบตรึง exact จะยังคงถูกใช้ต่อไปในการรัน `update <id>` ครั้งถัด ๆ ไป

สำหรับการติดตั้งจาก npm คุณยังสามารถส่ง npm package spec แบบชัดเจนที่มี dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังบันทึก Plugin ที่ถูกติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่ไว้สำหรับการอัปเดตในอนาคตโดยอิงจาก id

การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยังบันทึก Plugin ที่ถูกติดตามเช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปใช้สายรีลีสค่าเริ่มต้นของ registry

ก่อนการอัปเดต npm แบบมีผลจริง OpenClaw จะตรวจสอบเวอร์ชันของแพ็กเกจที่ติดตั้งอยู่เทียบกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและเอกลักษณ์ของอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้วอยู่ก่อนแล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

เมื่อมีการเก็บค่าแฮชความสมบูรณ์ไว้แล้ว และแฮชของอาร์ติแฟกต์ที่ดึงมามีการเปลี่ยนแปลง OpenClaw จะถือว่านี่คือ npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์ค่าแฮชที่คาดไว้และค่าจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะปิดแบบ fail closed เว้นแต่ผู้เรียกจะระบุนโยบายให้ดำเนินการต่ออย่างชัดเจน

`--dangerously-force-unsafe-install` ใช้ได้กับ `plugins update` เช่นกัน โดยเป็นตัวเลือกฉุกเฉินสำหรับ false positive ของการสแกนโค้ดอันตรายที่มีมาในตัวระหว่างการอัปเดต Plugin อย่างไรก็ตาม มันยังคงไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ Plugin เดียว จะแสดง identity, สถานะการโหลด, source, capability ที่ลงทะเบียนไว้, hook, tool, คำสั่ง, service, เมธอดของ gateway, HTTP route, แฟล็กนโยบาย, diagnostics, metadata การติดตั้ง, ความสามารถของบันเดิล และการรองรับ MCP หรือเซิร์ฟเวอร์ LSP ที่ตรวจพบ

แต่ละ Plugin จะถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงขณะ runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin ที่เป็นผู้ให้บริการอย่างเดียว)
- **hybrid-capability** — หลายประเภทความสามารถ (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มี capability หรือพื้นผิวอื่น
- **non-capability** — มี tool/คำสั่ง/service แต่ไม่มี capability

ดู [Plugin shapes](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดล capability

แฟล็ก `--json` จะส่งออกรายงานแบบที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ

`inspect --all` จะแสดงตารางทั้ง fleet พร้อมคอลัมน์ของ shape, ชนิด capability, หมายเหตุความเข้ากันได้, ความสามารถของบันเดิล และสรุป hook

`info` เป็น alias ของ `inspect`

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และหมายเหตุความเข้ากันได้ เมื่อทุกอย่างเรียบร้อย มันจะพิมพ์ `No plugin issues detected.`

สำหรับความล้มเหลวด้านรูปร่างของโมดูล เช่น ไม่มี export `register`/`activate` ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบย่อไว้ในเอาต์พุต diagnostics

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ marketplace รองรับพาธ marketplace ในเครื่อง, พาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL `--json` จะพิมพ์ป้ายกำกับ source ที่ resolve แล้ว พร้อม marketplace manifest และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การสร้าง Plugins](/th/plugins/building-plugins)
- [Community plugins](/th/plugins/community)
