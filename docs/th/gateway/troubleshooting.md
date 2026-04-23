---
read_when:
    - ศูนย์กลางการแก้ไขปัญหาได้ชี้คุณมาที่นี่เพื่อการวินิจฉัยเชิงลึก უფრო
    - คุณต้องการส่วนคู่มือแบบอิงอาการที่มีเสถียรภาพพร้อมคำสั่งที่ชัดเจน
summary: คู่มือแก้ไขปัญหาเชิงลึกสำหรับ gateway, ช่องทาง, ระบบอัตโนมัติ, nodes และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-23T05:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหา Gateway

หน้านี้คือคู่มือเชิงลึก
เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการโฟลว์คัดแยกปัญหาแบบรวดเร็วก่อน

## ลำดับคำสั่ง

ให้รันคำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่บ่งชี้ว่าสุขภาพดีตามที่คาดหวัง:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหา config/service ที่ขัดขวางการทำงาน
- `openclaw channels status --probe` แสดงสถานะ transport แบบสดต่อบัญชี และ
  ในกรณีที่รองรับ จะแสดงผลการ probe/audit เช่น `works` หรือ `audit ok`

## Anthropic 429 ต้องใช้การใช้งานเพิ่มเติมสำหรับบริบทแบบยาว

ใช้ส่วนนี้เมื่อในล็อก/ข้อผิดพลาดมีข้อความ:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ให้มองหา:

- โมเดล Anthropic Opus/Sonnet ที่ถูกเลือกมี `params.context1m: true`
- ข้อมูลรับรอง Anthropic ปัจจุบันไม่มีสิทธิ์ใช้งานบริบทยาว
- คำขอล้มเหลวเฉพาะในเซสชันยาวหรือการรันโมเดลที่ต้องใช้เส้นทางเบต้า 1M

ทางเลือกในการแก้ไข:

1. ปิด `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปใช้หน้าต่างบริบทปกติ
2. ใช้ข้อมูลรับรอง Anthropic ที่มีสิทธิ์สำหรับคำขอแบบ long-context หรือสลับไปใช้ Anthropic API key
3. กำหนด fallback model เพื่อให้การรันทำงานต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ

ที่เกี่ยวข้อง:

- [/providers/anthropic](/th/providers/anthropic)
- [/reference/token-use](/th/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/th/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend แบบ local ที่เข้ากันได้กับ OpenAI ผ่าน direct probe แต่การรันของเอเจนต์ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ทำงานได้
- การเรียก `/v1/chat/completions` แบบเล็ก ๆ โดยตรงทำงานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะในเทิร์นของเอเจนต์ตามปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ให้มองหา:

- การเรียกแบบเล็กโดยตรงสำเร็จ แต่การรันของ OpenClaw ล้มเหลวเฉพาะกับพรอมป์ขนาดใหญ่กว่า
- ข้อผิดพลาดจาก backend เกี่ยวกับ `messages[].content` ที่คาดว่าจะเป็นสตริง
- backend แครชเฉพาะเมื่อจำนวน prompt-token มากขึ้นหรือใช้พรอมป์ของรันไทม์เอเจนต์แบบเต็ม

ลายเซ็นที่พบบ่อย:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  ปฏิเสธ structured Chat Completions content parts วิธีแก้: ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true`
- direct request แบบเล็กสำเร็จ แต่การรันของเอเจนต์ OpenClaw ล้มเหลวด้วยอาการแครชของ backend/model
  (เช่น Gemma บนบิลด์ `inferrs` บางรุ่น) → transport ของ OpenClaw
  น่าจะถูกต้องอยู่แล้ว; ปัญหาคือ backend ล้มเหลวกับรูปแบบพรอมป์ของรันไทม์เอเจนต์ที่ใหญ่กว่า
- ความล้มเหลวลดลงหลังปิด tools แต่ไม่หายไป → schema ของ tool เป็นส่วนหนึ่งของแรงกดดัน
  แต่ปัญหาที่เหลือยังคงเป็นข้อจำกัดของโมเดล/เซิร์ฟเวอร์ upstream หรือเป็นบั๊กของ backend

ทางเลือกในการแก้ไข:

1. ตั้งค่า `compat.requiresStringContent: true` สำหรับ backend ของ Chat Completions ที่รองรับเฉพาะสตริง
2. ตั้งค่า `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่ไม่สามารถรองรับ
   พื้นผิว schema ของ tool ใน OpenClaw ได้อย่างน่าเชื่อถือ
3. ลดแรงกดดันของพรอมป์เมื่อทำได้: bootstrap ของ workspace ให้เล็กลง ประวัติเซสชันสั้นลง
   โมเดล local ที่เบากว่า หรือ backend ที่รองรับ long-context ได้ดีกว่า
4. หาก direct request แบบเล็กยังคงผ่าน แต่เทิร์นของเอเจนต์ OpenClaw ยังคงแครช
   ภายใน backend ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และยื่น
   repro ไปที่นั่นพร้อมรูปแบบ payload ที่รับได้

ที่เกี่ยวข้อง:

- [/gateway/local-models](/th/gateway/local-models)
- [/gateway/configuration](/th/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางเปิดอยู่แต่ไม่มีอะไรตอบกลับ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนจะ reconnect อะไรก็ตาม

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ให้มองหา:

- การจับคู่ยังค้างอยู่สำหรับผู้ส่ง DM
- การกำหนดให้ต้องมีการ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- allowlist ของช่องทาง/กลุ่มไม่ตรงกัน

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมีการ mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองออกโดยนโยบาย

ที่เกี่ยวข้อง:

- [/channels/troubleshooting](/th/channels/troubleshooting)
- [/channels/pairing](/th/channels/pairing)
- [/channels/groups](/th/channels/groups)

## การเชื่อมต่อ dashboard control ui

เมื่อ dashboard/control UI เชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, โหมด auth และข้อสมมติเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ให้มองหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- โหมด auth/token ไม่ตรงกันระหว่างไคลเอนต์กับ gateway
- การใช้ HTTP ในกรณีที่ต้องใช้อัตลักษณ์ของอุปกรณ์

ลายเซ็นที่พบบ่อย:

- `device identity required` → เป็น non-secure context หรือไม่มี device auth
- `origin not allowed` → browser `Origin` ไม่อยู่ใน `gateway.controlUi.allowedOrigins`
  (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี
  allowlist แบบ explicit)
- `device nonce required` / `device nonce mismatch` → ไคลเอนต์ไม่ได้ทำโฟลว์ device auth
  แบบ challenge-based ให้เสร็จ (`connect.challenge` + `device.nonce`)
- `device signature invalid` / `device signature expired` → ไคลเอนต์เซ็น payload ผิด
  (หรือใช้ timestamp เก่า) สำหรับ handshake ปัจจุบัน
- `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถ retry แบบเชื่อถือได้หนึ่งครั้งด้วย cached device token
- การ retry ด้วย cached-token นั้นจะใช้ชุด scope ที่ถูกแคชไว้พร้อมกับ paired
  device token ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` แบบ explicit จะยังคงใช้
  ชุด scope ที่ร้องขอไว้เอง
- นอกเหนือจากเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared
  token/password แบบ explicit ก่อน จากนั้น `deviceToken` แบบ explicit แล้วตามด้วย stored device token
  แล้วจึง bootstrap token
- บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
  จะถูกจัดลำดับให้เป็นอนุกรมก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการ retry พร้อมกัน
  ที่ไม่ถูกต้องสองครั้งจากไคลเอนต์เดียวกันอาจทำให้ครั้งที่สองแสดง `retry later`
  แทนที่จะเป็นความไม่ตรงกันแบบธรรมดาสองครั้ง
- `too many failed authentication attempts (retry later)` จากไคลเอนต์ loopback ที่มี browser-origin
  → ความล้มเหลวซ้ำ ๆ จาก `Origin` ที่ถูก normalized เดียวกันนั้นจะถูกล็อกชั่วคราว;
  localhost origin อื่นจะใช้ bucket แยกกัน
- `unauthorized` ซ้ำหลังจาก retry นั้น → shared token/device token ไม่ตรงกัน; รีเฟรช config ของ token และอนุมัติ/หมุน device token ใหม่หากจำเป็น
- `gateway connect failed:` → host/port/url เป้าหมายผิด

### แผนที่ detail code ของ Auth แบบรวดเร็ว

ใช้ `error.details.code` จากคำตอบ `connect` ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| Detail code                  | ความหมาย                                                                                                                                                                                    | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่ง shared token ที่จำเป็นมา                                                                                                                                                 | วาง/ตั้งค่า token ในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทาง dashboard: `openclaw config get gateway.auth.token` แล้ววางลงในค่าการตั้งค่าของ Control UI                                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token                                                                                                                                                   | หาก `canRetryWithDeviceToken=true` ให้ยอมให้มี trusted retry หนึ่งครั้ง การ retry ด้วย cached-token จะใช้ approved scope ที่เก็บไว้ซ้ำ ผู้เรียกที่ใช้ `deviceToken` / `scopes` แบบ explicit จะคง scope ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน [เช็กลิสต์การกู้คืน token drift](/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | per-device token ที่แคชไว้เก่าหรือถูกเพิกถอน                                                                                                                                               | หมุน/อนุมัติ device token ใหม่โดยใช้ [devices CLI](/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | อัตลักษณ์ของอุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่ค้างอยู่: `openclaw devices list` แล้ว `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้โฟลว์เดียวกันหลังจากคุณตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว                                                                                                   |

การตรวจสอบการย้ายไปยัง device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากล็อกแสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบว่ามัน:

1. รอ `connect.challenge`
2. เซ็น payload ที่ผูกกับ challenge
3. ส่ง `connect.params.device.nonce` พร้อม nonce ของ challenge เดียวกัน

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันที่ใช้ paired-device token สามารถจัดการได้เฉพาะ **อุปกรณ์ของตัวเอง**
  เว้นแต่ผู้เรียกนั้นจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะ operator scope ที่
  เซสชันของผู้เรียกถืออยู่แล้วเท่านั้น

ที่เกี่ยวข้อง:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/th/gateway/configuration) (โหมด auth ของ gateway)
- [/gateway/trusted-proxy-auth](/th/gateway/trusted-proxy-auth)
- [/gateway/remote](/th/gateway/remote)
- [/cli/devices](/cli/devices)

## บริการ Gateway ไม่ทำงาน

ใช้ส่วนนี้เมื่อมีการติดตั้ง service แล้ว แต่โปรเซสไม่สามารถทำงานค้างอยู่ได้

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # สแกน service ระดับระบบด้วย
```

ให้มองหา:

- `Runtime: stopped` พร้อมคำใบ้ออกจากระบบ
- config ของ service ไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- การชนกันของพอร์ต/listener
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้สำหรับ cleanup ของ `Other gateway-like services detected (best effort)`

ลายเซ็นที่พบบ่อย:

- `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ไม่ได้เปิดใช้โหมด local ของ gateway หรือไฟล์ config ถูก clobber จนทำให้ `gateway.mode` หายไป วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` ใหม่เพื่อประทับ config แบบ local-mode ที่คาดหวังอีกครั้ง หากคุณรัน OpenClaw ผ่าน Podman พาธ config เริ่มต้นคือ `~/.openclaw/openclaw.json`
- `refusing to bind gateway ... without auth` → มีการ bind กับที่อยู่ที่ไม่ใช่ loopback โดยไม่มีเส้นทาง auth ของ gateway ที่ถูกต้อง (token/password หรือ trusted-proxy หากมีการกำหนดค่าไว้)
- `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตชนกัน
- `Other gateway-like services detected (best effort)` → มี unit ของ launchd/systemd/schtasks แบบเก่าหรือขนานกันอยู่ โดยการตั้งค่าส่วนใหญ่ควรมีหนึ่ง gateway ต่อหนึ่งเครื่อง; หากคุณจำเป็นต้องมีมากกว่าหนึ่ง ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

ที่เกี่ยวข้อง:

- [/gateway/background-process](/th/gateway/background-process)
- [/gateway/configuration](/th/gateway/configuration)
- [/gateway/doctor](/th/gateway/doctor)

## Gateway กู้คืน config ล่าสุดที่เชื่อถือได้แล้ว

ใช้ส่วนนี้เมื่อ Gateway เริ่มทำงานได้ แต่ในล็อกบอกว่ามันกู้คืน `openclaw.json`

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ให้มองหา:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp อยู่ข้าง ๆ config ที่ใช้งานอยู่
- system event ของเอเจนต์หลักที่ขึ้นต้นด้วย `Config recovery warning`

สิ่งที่เกิดขึ้น:

- config ที่ถูกปฏิเสธไม่ผ่านการตรวจสอบระหว่าง startup หรือ hot reload
- OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
- config ที่ใช้งานอยู่ถูกกู้คืนจากสำเนา last-known-good ที่ผ่านการตรวจสอบล่าสุด
- เทิร์นถัดไปของเอเจนต์หลักจะได้รับคำเตือนว่าไม่ควรเขียนทับ config ที่ถูกปฏิเสธแบบไม่ตรวจสอบ

ตรวจสอบและซ่อมแซม:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

ลายเซ็นที่พบบ่อย:

- มี `.clobbered.*` อยู่ → การแก้ไขโดยตรงจากภายนอกหรือการอ่านตอน startup ถูกกู้คืน
- มี `.rejected.*` อยู่ → การเขียน config ที่ OpenClaw เป็นผู้จัดการล้มเหลวในการผ่าน schema หรือการตรวจสอบ clobber ก่อน commit
- `Config write rejected:` → การเขียนพยายามลบโครงสร้างที่จำเป็น ทำให้ไฟล์หดลงอย่างมาก หรือพยายามบันทึก config ที่ไม่ถูกต้อง
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → ตอน startup ถือว่าไฟล์ปัจจุบันถูก clobber เพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับ backup last-known-good
- `Config last-known-good promotion skipped` → ค่าที่เสนอมี placeholder ของความลับที่ถูกปกปิด เช่น `***`

ทางเลือกในการแก้ไข:

1. เก็บ config ที่ใช้งานอยู่ซึ่งถูกกู้คืนแล้วไว้ หากมันถูกต้อง
2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` แล้วค่อยนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
3. รัน `openclaw config validate` ก่อนรีสตาร์ต
4. หากคุณแก้ไขด้วยมือ ให้คง config JSON5 ทั้งไฟล์ไว้ ไม่ใช่แค่ object บางส่วนที่คุณต้องการเปลี่ยน

ที่เกี่ยวข้อง:

- [/gateway/configuration#strict-validation](/th/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/th/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/th/gateway/doctor)

## คำเตือนจาก Gateway probe

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังคงพิมพ์บล็อกคำเตือนออกมา

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ให้มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- คำเตือนนั้นเกี่ยวกับ SSH fallback, หลาย gateway, scope ที่ขาดหาย หรือ auth ref ที่ resolve ไม่ได้หรือไม่

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลอง target ที่กำหนดไว้/loopback แบบตรงต่อไป
- `multiple reachable gateways detected` → มีมากกว่าหนึ่ง target ที่ตอบกลับ โดยทั่วไปหมายถึงการตั้งค่า multi-gateway โดยตั้งใจ หรือมี listener ซ้ำ/เก่า
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → การเชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วย scope; ให้จับคู่อัตลักษณ์อุปกรณ์หรือใช้ข้อมูลรับรองที่มี `operator.read`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/รับการอนุมัติก่อนจะเข้าถึง operator ตามปกติได้
- ข้อความคำเตือนเกี่ยวกับ SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → ข้อมูล auth ใช้งานไม่ได้ในเส้นทางคำสั่งนี้สำหรับ target ที่ล้มเหลว

ที่เกี่ยวข้อง:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- [/gateway/remote](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้วแต่ข้อความไม่ไหล

หากสถานะของช่องทางเป็น connected แต่การไหลของข้อความตายไป ให้โฟกัสที่นโยบาย สิทธิ์ และกฎการส่งเฉพาะของช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ให้มองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดเรื่องการ mention
- สิทธิ์/ขอบเขต API ของช่องทางที่ขาดหาย

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการ mention ในกลุ่ม
- ร่องรอย `pairing` / pending approval → ผู้ส่งยังไม่ได้รับการอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาด้าน auth/permissions ของช่องทาง

ที่เกี่ยวข้อง:

- [/channels/troubleshooting](/th/channels/troubleshooting)
- [/channels/whatsapp](/th/channels/whatsapp)
- [/channels/telegram](/th/channels/telegram)
- [/channels/discord](/th/channels/discord)

## การส่งของ Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ทำงาน หรือทำงานแล้วไม่ส่ง ให้ตรวจสอบสถานะ scheduler ก่อน แล้วค่อยตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ให้มองหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันของงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

ลายเซ็นที่พบบ่อย:

- `cron: scheduler disabled; jobs will not run automatically` → ปิด Cron อยู่
- `cron: timer tick failed` → scheduler tick ล้มเหลว; ให้ตรวจสอบไฟล์/ล็อก/ข้อผิดพลาดของรันไทม์
- `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาที่ active
- `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงบรรทัดว่าง / markdown header เท่านั้น ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
- `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
- `heartbeat: unknown accountId` → account id ไม่ถูกต้องสำหรับเป้าหมายการส่งของ Heartbeat
- `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูก resolve ไปยังปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือ override ต่อเอเจนต์) ถูกตั้งเป็น `block`

ที่เกี่ยวข้อง:

- [/automation/cron-jobs#troubleshooting](/th/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/th/automation/cron-jobs)
- [/gateway/heartbeat](/th/gateway/heartbeat)

## Tool ของ node ที่จับคู่ไว้ล้มเหลว

หาก node ถูกจับคู่แล้วแต่ tools ล้มเหลว ให้แยกตรวจสถานะ foreground, permission และ approval

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ให้มองหา:

- Node ออนไลน์พร้อมความสามารถตามที่คาดไว้
- การอนุญาตระดับ OS สำหรับกล้อง/ไมค์/ตำแหน่ง/หน้าจอ
- สถานะ exec approvals และ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ระดับ OS
- `SYSTEM_RUN_DENIED: approval required` → กำลังรอ exec approval
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [/nodes/troubleshooting](/th/nodes/troubleshooting)
- [/nodes/index](/th/nodes/index)
- [/tools/exec-approvals](/th/tools/exec-approvals)

## Browser tool ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของ browser tool ล้มเหลว แม้ gateway เองจะยังปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ให้มองหา:

- มีการตั้งค่า `plugins.allow` และรวม `browser` ไว้หรือไม่
- พาธ executable ของเบราว์เซอร์ถูกต้องหรือไม่
- โปรไฟล์ CDP เข้าถึงได้หรือไม่
- มี Chrome ในเครื่องพร้อมใช้งานสำหรับโปรไฟล์ `existing-session` / `user` หรือไม่

ลายเซ็นที่พบบ่อย:

- `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser plugin ถูกตัดออกโดย `plugins.allow`
- browser tool หายไป / ใช้งานไม่ได้ทั้งที่ `browser.enabled=true` → `plugins.allow` ตัด `browser` ออก ทำให้ Plugin ไม่ถูกโหลดเลย
- `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์ไม่สามารถเริ่มได้
- `browser.executablePath not found` → พาธที่กำหนดไว้ไม่ถูกต้อง
- `browser.cdpUrl must be http(s) or ws(s)` → CDP URL ที่กำหนดใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
- `browser.cdpUrl has invalid port` → CDP URL ที่กำหนดมีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
- `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังไม่สามารถ attach เข้ากับ data dir ของเบราว์เซอร์ที่เลือกได้ ให้เปิดหน้า inspect ของเบราว์เซอร์ เปิดใช้ remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติพรอมป์การ attach ครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องคงสถานะการลงชื่อเข้าใช้ ให้เลือกใช้โปรไฟล์ `openclaw` ที่จัดการให้
- `No Chrome tabs found for profile="user"` → โปรไฟล์ attach ของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
- `Remote CDP for profile "<name>" is not reachable` → endpoint ของ remote CDP ที่กำหนดไม่สามารถเข้าถึงได้จากโฮสต์ของ gateway
- `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มี target ที่เข้าถึงได้ หรือ HTTP endpoint ตอบแล้วแต่ CDP WebSocket ยังไม่สามารถเปิดได้
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง gateway ปัจจุบันไม่มี runtime dependency `playwright-core` ของ bundled browser plugin; ให้รัน `openclaw doctor --fix` แล้วรีสตาร์ต gateway จากนั้น ARIA snapshots และภาพหน้าจอพื้นฐานของหน้าอาจยังทำงานได้ แต่การนำทาง AI snapshots ภาพหน้าจอองค์ประกอบด้วย CSS selector และการส่งออก PDF จะยังใช้งานไม่ได้
- `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้ page capture หรือ `--ref` จาก snapshot ไม่ใช่ CSS `--element`
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook อัปโหลดไฟล์บนโปรไฟล์ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selector
- `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดครั้งละหนึ่งไฟล์บนโปรไฟล์ Chrome MCP
- `existing-session dialog handling does not support timeoutMs.` → hook ของ dialog บนโปรไฟล์ Chrome MCP ไม่รองรับ timeout override
- `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ที่จัดการเองหรือโปรไฟล์ raw CDP
- viewport / dark-mode / locale / offline override ค้างอยู่บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิด active control session และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ต gateway ทั้งหมด

ที่เกี่ยวข้อง:

- [/tools/browser-linux-troubleshooting](/th/tools/browser-linux-troubleshooting)
- [/tools/browser](/th/tools/browser)

## หากคุณอัปเกรดแล้วมีบางอย่างพังขึ้นมาอย่างกะทันหัน

ปัญหาหลังอัปเกรดส่วนใหญ่มักมาจาก config drift หรือมีการบังคับใช้ค่าเริ่มต้นที่เข้มงวดขึ้น

### 1) พฤติกรรมของ auth และ URL override เปลี่ยนไป

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

สิ่งที่ต้องตรวจสอบ:

- หาก `gateway.mode=remote` คำสั่ง CLI อาจกำลังกำหนดเป้าหมายไปยัง remote ขณะที่ service ในเครื่องของคุณยังปกติดี
- การเรียกด้วย `--url` แบบ explicit จะไม่ fallback ไปใช้ข้อมูลรับรองที่เก็บไว้

ลายเซ็นที่พบบ่อย:

- `gateway connect failed:` → URL เป้าหมายผิด
- `unauthorized` → เข้าถึง endpoint ได้ แต่ auth ผิด

### 2) Guardrail ของ bind และ auth เข้มงวดขึ้น

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

สิ่งที่ต้องตรวจสอบ:

- การ bind แบบไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง: auth แบบ shared token/password หรือ deployment แบบ non-loopback `trusted-proxy` ที่กำหนดค่าอย่างถูกต้อง
- คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

ลายเซ็นที่พบบ่อย:

- `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีเส้นทาง auth ของ gateway ที่ถูกต้อง
- `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → gateway ยังมีชีวิตอยู่ แต่ไม่สามารถเข้าถึงได้ด้วย auth/url ปัจจุบัน

### 3) สถานะของการจับคู่และอัตลักษณ์ของอุปกรณ์เปลี่ยนไป

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

สิ่งที่ต้องตรวจสอบ:

- มีการอนุมัติอุปกรณ์ที่ค้างอยู่สำหรับ dashboard/nodes
- มีการอนุมัติการจับคู่ DM ที่ค้างอยู่หลังจากมีการเปลี่ยนนโยบายหรืออัตลักษณ์

ลายเซ็นที่พบบ่อย:

- `device identity required` → ยังไม่ผ่าน device auth
- `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

หาก config ของ service และรันไทม์ยังคงไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง metadata ของ service ใหม่จากโปรไฟล์/ไดเรกทอรีสถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [/gateway/pairing](/th/gateway/pairing)
- [/gateway/authentication](/th/gateway/authentication)
- [/gateway/background-process](/th/gateway/background-process)
