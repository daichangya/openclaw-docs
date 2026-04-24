---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาชี้คุณมาที่นี่เพื่อการวินิจฉัยเชิงลึก વધુ
    - คุณต้องการส่วนคู่มือปฏิบัติตามอาการที่มีเสถียรภาพพร้อมคำสั่งที่แน่นอน
summary: คู่มือการแก้ไขปัญหาเชิงลึกสำหรับ gateway, channels, automation, โหนด และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-24T09:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหา Gateway

หน้านี้คือคู่มือปฏิบัติการเชิงลึก
เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการโฟลว์คัดกรองแบบรวดเร็วก่อน

## ลำดับคำสั่ง

ให้รันคำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่คาดหวังเมื่อระบบปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหา config/บริการที่บล็อกการทำงาน
- `openclaw channels status --probe` แสดงสถานะการขนส่งแบบ live รายบัญชี และในจุดที่รองรับ จะแสดงผล probe/audit เช่น `works` หรือ `audit ok`

## Anthropic 429 extra usage required for long context

ใช้หัวข้อนี้เมื่อ logs/ข้อผิดพลาดมีข้อความ:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ให้มองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกอยู่มี `params.context1m: true`
- ข้อมูลรับรอง Anthropic ปัจจุบันไม่มีสิทธิ์สำหรับการใช้งาน long-context
- คำขอล้มเหลวเฉพาะในเซสชันยาวหรือการรันโมเดลที่ต้องใช้เส้นทางเบต้า 1M

วิธีแก้ที่เป็นไปได้:

1. ปิด `context1m` สำหรับโมเดลนั้นเพื่อย้อนกลับไปใช้หน้าต่างบริบทปกติ
2. ใช้ข้อมูลรับรอง Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือเปลี่ยนไปใช้ Anthropic API key
3. กำหนดค่า fallback models เพื่อให้การรันทำงานต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ

ที่เกี่ยวข้อง:

- [/providers/anthropic](/th/providers/anthropic)
- [/reference/token-use](/th/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## แบ็กเอนด์ local OpenAI-compatible ผ่าน direct probes แต่การรันของเอเจนต์ล้มเหลว

ใช้หัวข้อนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` แบบเล็กโดยตรงใช้งานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะในเทิร์นเอเจนต์ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ให้มองหา:

- การเรียกแบบเล็กโดยตรงสำเร็จ แต่การรันของ OpenClaw ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- ข้อผิดพลาดของแบ็กเอนด์เกี่ยวกับ `messages[].content` ที่คาดว่าเป็นสตริง
- การแครชของแบ็กเอนด์ที่เกิดขึ้นเฉพาะกับจำนวน prompt-token ที่มากขึ้นหรือ prompt แบบเต็มของ runtime เอเจนต์

ลายเซ็นที่พบบ่อย:

- `messages[...].content: invalid type: sequence, expected a string` → แบ็กเอนด์ปฏิเสธ structured Chat Completions content parts วิธีแก้: ตั้งค่า `models.providers.<provider>.models[].compat.requiresStringContent: true`
- คำขอเล็กโดยตรงสำเร็จ แต่การรันเอเจนต์ของ OpenClaw ล้มเหลวพร้อมการแครชของแบ็กเอนด์/โมเดล (เช่น Gemma บนบางบิลด์ของ `inferrs`) → การขนส่งของ OpenClaw น่าจะถูกต้องแล้ว; แบ็กเอนด์กำลังล้มเหลวกับรูปแบบ prompt ที่ใหญ่กว่าของ runtime เอเจนต์
- ความล้มเหลวลดลงหลังจากปิด tools แต่ไม่หายไป → schema ของ tools เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นข้อจำกัดของโมเดล/เซิร์ฟเวอร์ upstream หรือบั๊กของแบ็กเอนด์

วิธีแก้ที่เป็นไปได้:

1. ตั้งค่า `compat.requiresStringContent: true` สำหรับแบ็กเอนด์ Chat Completions ที่รองรับเฉพาะสตริง
2. ตั้งค่า `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่ไม่สามารถรองรับพื้นผิว schema ของ tools ใน OpenClaw ได้อย่างน่าเชื่อถือ
3. ลดแรงกดดันของ prompt เมื่อทำได้: workspace bootstrap ที่เล็กลง, ประวัติเซสชันที่สั้นลง, local model ที่เบากว่า หรือแบ็กเอนด์ที่รองรับ long-context ได้ดีกว่า
4. หากคำขอเล็กโดยตรงยังผ่านต่อไป แต่เทิร์นเอเจนต์ของ OpenClaw ยังคงแครชภายในแบ็กเอนด์ ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และส่ง repro ไปที่นั่นพร้อมรูปแบบ payload ที่ยอมรับได้

ที่เกี่ยวข้อง:

- [/gateway/local-models](/th/gateway/local-models)
- [/gateway/configuration](/th/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หาก channels ทำงานอยู่แต่ไม่มีอะไรตอบกลับ ให้ตรวจสอบ routing และ policy ก่อนเชื่อมต่ออะไรใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ให้มองหา:

- มี pairing ที่รอดำเนินการสำหรับผู้ส่ง DM
- การบังคับ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- allowlist ของช่องทาง/กลุ่มไม่ตรงกัน

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกเพิกเฉยจนกว่าจะมี mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [/channels/troubleshooting](/th/channels/troubleshooting)
- [/channels/pairing](/th/channels/pairing)
- [/channels/groups](/th/channels/groups)

## การเชื่อมต่อของ dashboard control ui

เมื่อ dashboard/control UI เชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, auth mode และข้อสมมติเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ให้มองหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- auth mode/token ไม่ตรงกันระหว่างไคลเอนต์กับ gateway
- มีการใช้ HTTP ในจุดที่ต้องใช้ device identity

ลายเซ็นที่พบบ่อย:

- `device identity required` → เป็น non-secure context หรือไม่มี device auth
- `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่ได้อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist แบบชัดเจน)
- `device nonce required` / `device nonce mismatch` → ไคลเอนต์ไม่ได้ทำ challenge-based device auth flow (`connect.challenge` + `device.nonce`) ให้เสร็จ
- `device signature invalid` / `device signature expired` → ไคลเอนต์ลงนาม payload ผิดตัว (หรือใช้ timestamp ที่ล้าสมัย) สำหรับ handshake ปัจจุบัน
- `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถทำ trusted retry ได้หนึ่งครั้งด้วย cached device token
- cached-token retry นั้นจะใช้ชุด scopes ที่เก็บแคชไว้พร้อม approved device token ซ้ำ ส่วนผู้เรียกที่ใช้ `deviceToken` แบบชัดเจน / `scopes` แบบชัดเจน จะคงชุด scopes ที่ร้องขอไว้
- นอกเหนือจากเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password แบบชัดเจนก่อน จากนั้น `deviceToken` แบบชัดเจน จากนั้น stored device token และสุดท้าย bootstrap token
- บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น bad concurrent retries สองครั้งจากไคลเอนต์เดียวกันอาจทำให้ครั้งที่สองแสดง `retry later` แทนที่จะเป็น plain mismatch สองครั้ง
- `too many failed authentication attempts (retry later)` จาก browser-origin loopback client → ความพยายามที่ล้มเหลวซ้ำ ๆ จาก `Origin` เดียวกันที่ถูก normalize แล้วจะถูกล็อกชั่วคราว; localhost origin อื่นจะใช้คนละ bucket
- `repeated unauthorized` หลัง retry นั้น → shared token/device token ไม่ตรงกัน; รีเฟรช config ของ token และอนุมัติใหม่/หมุน device token หากจำเป็น
- `gateway connect failed:` → host/port/url เป้าหมายผิด

### แผนที่รหัสรายละเอียด auth แบบย่อ

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| Detail code                  | ความหมาย                                                                                                                                                                                 | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่ง shared token ที่จำเป็น                                                                                                                                               | วาง/ตั้งค่า token ในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทาง dashboard: `openclaw config get gateway.auth.token` แล้ววางลงใน settings ของ Control UI                                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้ยอมให้ทำ trusted retry ได้หนึ่งครั้ง cached-token retries จะใช้ approved scopes ที่จัดเก็บไว้ซ้ำ ส่วนผู้เรียกที่ใช้ `deviceToken` / `scopes` แบบชัดเจนจะคง scopes ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | cached per-device token ล้าสมัยหรือถูกเพิกถอน                                                                                                                                          | หมุน/อนุมัติ device token ใหม่โดยใช้ [devices CLI](/th/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | device identity ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` เพื่อดู `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` แล้ว `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้โฟลว์เดียวกันหลังจากคุณตรวจสอบการเข้าถึงที่ร้องขอแล้ว                                                                                               |

การตรวจสอบการย้ายไปยัง device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก logs แสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบว่ามัน:

1. รอ `connect.challenge`
2. ลงนาม payload ที่ผูกกับ challenge
3. ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธอย่างไม่คาดคิด:

- เซสชัน paired-device token สามารถจัดการได้เฉพาะ **อุปกรณ์ของตัวเอง** เท่านั้น เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะ operator scopes ที่
  เซสชันของผู้เรียกถืออยู่แล้ว

ที่เกี่ยวข้อง:

- [/web/control-ui](/th/web/control-ui)
- [/gateway/configuration](/th/gateway/configuration) (โหมด gateway auth)
- [/gateway/trusted-proxy-auth](/th/gateway/trusted-proxy-auth)
- [/gateway/remote](/th/gateway/remote)
- [/cli/devices](/th/cli/devices)

## บริการ Gateway ไม่ทำงาน

ใช้หัวข้อนี้เมื่อมีการติดตั้งบริการแล้ว แต่โปรเซสไม่สามารถทำงานค้างไว้ได้

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # สแกนบริการระดับระบบด้วย
```

ให้มองหา:

- `Runtime: stopped` พร้อมคำใบ้เรื่องการออกจากโปรเซส
- ค่าบริการไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- พอร์ต/ตัวรับฟังชนกัน
- มีการติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำแนะนำให้ล้าง `Other gateway-like services detected (best effort)`

ลายเซ็นที่พบบ่อย:

- `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ยังไม่ได้เปิดใช้ local gateway mode หรือไฟล์ config ถูกเขียนทับจนทำให้ `gateway.mode` หายไป วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` ใหม่เพื่อประทับ config ที่คาดหวังสำหรับโหมด local อีกครั้ง หากคุณรัน OpenClaw ผ่าน Podman path ของ config เริ่มต้นคือ `~/.openclaw/openclaw.json`
- `refusing to bind gateway ... without auth` → มีการ bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง (token/password หรือ trusted-proxy ในกรณีที่กำหนดค่าไว้)
- `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตชนกัน
- `Other gateway-like services detected (best effort)` → มี launchd/systemd/schtasks units ที่ค้างอยู่หรือทำงานขนานกันอยู่ การตั้งค่าส่วนใหญ่ควรใช้หนึ่ง gateway ต่อหนึ่งเครื่อง; หากคุณจำเป็นต้องใช้มากกว่าหนึ่ง ให้แยกพอร์ต + config/state/workspace ออกจากกัน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

ที่เกี่ยวข้อง:

- [/gateway/background-process](/th/gateway/background-process)
- [/gateway/configuration](/th/gateway/configuration)
- [/gateway/doctor](/th/gateway/doctor)

## Gateway กู้คืน config แบบ last-known-good

ใช้หัวข้อนี้เมื่อ Gateway เริ่มทำงานได้ แต่ logs ระบุว่ามันกู้คืน `openclaw.json`

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
- ไฟล์ `openclaw.json.clobbered.*` แบบมี timestamp อยู่ข้างไฟล์ config ที่ใช้งานอยู่
- system event ของเอเจนต์หลักที่ขึ้นต้นด้วย `Config recovery warning`

สิ่งที่เกิดขึ้น:

- config ที่ถูกปฏิเสธไม่ผ่านการตรวจสอบระหว่าง startup หรือ hot reload
- OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
- config ที่ใช้งานอยู่ถูกกู้คืนจากสำเนา last-known-good ล่าสุดที่ผ่านการตรวจสอบแล้ว
- ในเทิร์นถัดไปของเอเจนต์หลักจะมีคำเตือนว่าไม่ควรเขียนทับ config ที่ถูกปฏิเสธแบบไม่ไตร่ตรอง

ตรวจสอบและซ่อมแซม:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

ลายเซ็นที่พบบ่อย:

- มี `.clobbered.*` → มีการแก้ไขไฟล์โดยตรงจากภายนอกหรือการอ่านตอนเริ่มต้นถูกกู้คืน
- มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวจาก schema หรือการตรวจจับการเขียนทับแบบทำลายข้อมูลก่อน commit
- `Config write rejected:` → การเขียนพยายามลบรูปร่างที่จำเป็น ทำให้ไฟล์เล็กลงอย่างมาก หรือบันทึก config ที่ไม่ถูกต้อง
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → ตอนเริ่มต้นระบบมองว่าไฟล์ปัจจุบันถูกเขียนทับเสียหายเพราะทำให้ฟิลด์หรือขนาดหายไปเมื่อเทียบกับสำเนา last-known-good
- `Config last-known-good promotion skipped` → candidate มีตัวแทนค่า secret ที่ถูกปกปิด เช่น `***`

วิธีแก้ที่เป็นไปได้:

1. ใช้ config ที่ถูกกู้คืนแล้วต่อไป หากมันถูกต้องอยู่แล้ว
2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` แล้วค่อยปรับใช้ด้วย `openclaw config set` หรือ `config.patch`
3. รัน `openclaw config validate` ก่อนรีสตาร์ต
4. หากแก้ไขด้วยมือ ให้เก็บ config JSON5 ทั้งไฟล์ ไม่ใช่เฉพาะ partial object ที่คุณต้องการเปลี่ยน

ที่เกี่ยวข้อง:

- [/gateway/configuration#strict-validation](/th/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/th/gateway/configuration#config-hot-reload)
- [/cli/config](/th/cli/config)
- [/gateway/doctor](/th/gateway/doctor)

## คำเตือนจาก Gateway probe

ใช้หัวข้อนี้เมื่อ `openclaw gateway probe` ติดต่ออะไรบางอย่างได้ แต่ยังคงแสดงบล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ให้มองหา:

- `warnings[].code` และ `primaryTargetId` ในผลลัพธ์ JSON
- คำเตือนนั้นเกี่ยวกับ SSH fallback, หลาย gateways, scopes ที่ขาดหาย หรือ auth refs ที่ resolve ไม่ได้หรือไม่

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลองเป้าหมาย direct ที่กำหนดค่าไว้/loopback ต่อ
- `multiple reachable gateways detected` → มีมากกว่าหนึ่งเป้าหมายที่ตอบกลับ โดยปกติหมายถึงมีการตั้งค่าหลาย gateway โดยตั้งใจ หรือมี listeners ซ้ำ/ค้างอยู่
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → การเชื่อมต่อสำเร็จ แต่ detail RPC ถูกจำกัดด้วย scope; ให้จับคู่ device identity หรือใช้ข้อมูลรับรองที่มี `operator.read`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/อนุมัติก่อนจึงจะเข้าถึงแบบ operator ตามปกติได้
- ข้อความคำเตือนเกี่ยวกับ `gateway.auth.*` / `gateway.remote.*` SecretRef ที่ resolve ไม่ได้ → auth material ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [/cli/gateway](/th/cli/gateway)
- [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- [/gateway/remote](/th/gateway/remote)

## Channel เชื่อมต่อแล้วแต่ข้อความไม่ไหล

หากสถานะ channel แสดงว่าเชื่อมต่อแล้วแต่การไหลของข้อความหยุด ให้โฟกัสที่ policy, permissions และกฎการส่งเฉพาะของ channel

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ให้มองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดเรื่อง mention
- API permissions/scopes ของ channel ที่หายไป

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกเพิกเฉยโดย policy การบังคับ mention ในกลุ่ม
- `pairing` / traces ของการอนุมัติที่รอดำเนินการ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหา auth/permissions ของ channel

ที่เกี่ยวข้อง:

- [/channels/troubleshooting](/th/channels/troubleshooting)
- [/channels/whatsapp](/th/channels/whatsapp)
- [/channels/telegram](/th/channels/telegram)
- [/channels/discord](/th/channels/discord)

## การส่ง Cron และ Heartbeat

หาก cron หรือ Heartbeat ไม่รันหรือไม่ได้ส่ง ให้ตรวจสอบสถานะของ scheduler ก่อน จากนั้นจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ให้มองหา:

- เปิดใช้ Cron แล้วและมี next wake
- สถานะประวัติการรันของ job (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

ลายเซ็นที่พบบ่อย:

- `cron: scheduler disabled; jobs will not run automatically` → ปิดใช้งาน cron อยู่
- `cron: timer tick failed` → scheduler tick ล้มเหลว; ให้ตรวจสอบไฟล์/log/ข้อผิดพลาดของ runtime
- `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วง active hours
- `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่แต่มีเพียงบรรทัดว่าง / markdown headers เท่านั้น ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
- `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
- `heartbeat: unknown accountId` → account id ไม่ถูกต้องสำหรับเป้าหมายการส่งของ Heartbeat
- `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat resolve ไปยังปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการกำหนดแทนรายเอเจนต์) ถูกตั้งเป็น `block`

ที่เกี่ยวข้อง:

- [/automation/cron-jobs#troubleshooting](/th/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/th/automation/cron-jobs)
- [/gateway/heartbeat](/th/gateway/heartbeat)

## โหนดจับคู่แล้วแต่ tool ล้มเหลว

หากโหนดถูกจับคู่แล้วแต่ tools ล้มเหลว ให้แยกวิเคราะห์เรื่อง foreground, permissions และสถานะการอนุมัติ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ให้มองหา:

- โหนดออนไลน์พร้อม capabilities ที่คาดหวัง
- การอนุญาตระดับระบบปฏิบัติการสำหรับกล้อง/ไมค์/ตำแหน่ง/หน้าจอ
- การอนุมัติ exec และสถานะ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอปโหนดต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดการอนุญาตจากระบบปฏิบัติการ
- `SYSTEM_RUN_DENIED: approval required` → มี exec approval ที่รอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [/nodes/troubleshooting](/th/nodes/troubleshooting)
- [/nodes/index](/th/nodes/index)
- [/tools/exec-approvals](/th/tools/exec-approvals)

## Browser tool ล้มเหลว

ใช้หัวข้อนี้เมื่อ actions ของ browser tool ล้มเหลว แม้ gateway เองจะปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ให้มองหา:

- มีการตั้ง `plugins.allow` ไว้หรือไม่ และรวม `browser` อยู่หรือไม่
- path ของ browser executable ถูกต้องหรือไม่
- CDP profile เข้าถึงได้หรือไม่
- มี Chrome ในเครื่องพร้อมสำหรับ profiles แบบ `existing-session` / `user` หรือไม่

ลายเซ็นที่พบบ่อย:

- `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser Plugin ถูกตัดออกโดย `plugins.allow`
- browser tool หายไป / ใช้งานไม่ได้ทั้งที่ `browser.enabled=true` → `plugins.allow` ไม่รวม `browser` ดังนั้น Plugin จึงไม่ถูกโหลด
- `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มต้นไม่สำเร็จ
- `browser.executablePath not found` → path ที่กำหนดไว้ไม่ถูกต้อง
- `browser.cdpUrl must be http(s) or ws(s)` → CDP URL ที่กำหนดใช้สคีมที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
- `browser.cdpUrl has invalid port` → CDP URL ที่กำหนดมีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วงที่รองรับ
- `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังไม่สามารถ attach กับ browser data dir ที่เลือกได้ ให้เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้ remote debugging เปิดเบราว์เซอร์ทิ้งไว้ อนุมัติ prompt การ attach ครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะที่ล็อกอินอยู่ ควรใช้โปรไฟล์ `openclaw` แบบมีการจัดการ
- `No Chrome tabs found for profile="user"` → โปรไฟล์สำหรับการ attach ของ Chrome MCP ไม่มีแท็บ Chrome ภายในเครื่องที่เปิดอยู่
- `Remote CDP for profile "<name>" is not reachable` → ปลายทาง CDP ระยะไกลที่กำหนดไม่สามารถเข้าถึงได้จากโฮสต์ของ gateway
- `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์แบบ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือแม้ปลายทาง HTTP จะตอบแล้ว แต่ยังไม่สามารถเปิด CDP WebSocket ได้
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง gateway ปัจจุบันไม่มี dependency ของ runtime `playwright-core` จาก bundled browser Plugin ให้รัน `openclaw doctor --fix` แล้วรีสตาร์ต gateway หลังจากนั้น ARIA snapshots และภาพหน้าจอหน้าเว็บพื้นฐานยังอาจใช้งานได้ แต่การนำทาง, AI snapshots, ภาพหน้าจอองค์ประกอบด้วย CSS selector และการส่งออก PDF จะยังไม่พร้อมใช้งาน
- `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้ page capture หรือ `--ref` จาก snapshot ไม่ใช่ CSS `--element`
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → upload hooks ของ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
- `existing-session file uploads currently support one file at a time.` → ให้ส่งอัปโหลดทีละไฟล์สำหรับโปรไฟล์ Chrome MCP
- `existing-session dialog handling does not support timeoutMs.` → dialog hooks บนโปรไฟล์ Chrome MCP ไม่รองรับ timeout overrides
- `existing-session type does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:type` บน `profile="user"` / โปรไฟล์ Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อต้องการ custom timeout
- `existing-session evaluate does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:evaluate` บน `profile="user"` / โปรไฟล์ Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อต้องการ custom timeout
- `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์แบบ managed หรือโปรไฟล์ CDP แบบดิบ
- viewport / dark-mode / locale / offline overrides ที่ค้างอยู่บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิด active control session และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ตทั้ง gateway

ที่เกี่ยวข้อง:

- [/tools/browser-linux-troubleshooting](/th/tools/browser-linux-troubleshooting)
- [/tools/browser](/th/tools/browser)

## หากคุณอัปเกรดแล้วมีบางอย่างพังขึ้นมากะทันหัน

ปัญหาหลังอัปเกรดส่วนใหญ่มาจาก config drift หรือมีการบังคับใช้ค่าเริ่มต้นที่เข้มงวดขึ้น

### 1) พฤติกรรมของ auth และ URL override เปลี่ยนไป

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

สิ่งที่ต้องตรวจสอบ:

- หาก `gateway.mode=remote`, คำสั่ง CLI อาจกำลังชี้ไปยัง remote ขณะที่บริการในเครื่องของคุณยังปกติดี
- การเรียกด้วย `--url` แบบชัดเจนจะไม่ย้อนกลับไปใช้ข้อมูลรับรองที่เก็บไว้

ลายเซ็นที่พบบ่อย:

- `gateway connect failed:` → URL เป้าหมายผิด
- `unauthorized` → ปลายทางเข้าถึงได้แต่ auth ไม่ถูกต้อง

### 2) การป้องกันเรื่อง bind และ auth เข้มงวดขึ้น

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

สิ่งที่ต้องตรวจสอบ:

- การ bind แบบ non-loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง gateway auth ที่ถูกต้อง: shared token/password auth หรือ deployment `trusted-proxy` ที่ไม่ใช่ loopback และกำหนดค่าไว้อย่างถูกต้อง
- คีย์เก่าอย่าง `gateway.token` ไม่ได้ใช้แทน `gateway.auth.token`

ลายเซ็นที่พบบ่อย:

- `refusing to bind gateway ... without auth` → มีการ bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง
- `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → gateway ยังมีชีวิตอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

### 3) สถานะ pairing และ device identity เปลี่ยนไป

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

สิ่งที่ต้องตรวจสอบ:

- มี approvals ของอุปกรณ์ที่รอดำเนินการสำหรับ dashboard/โหนด
- มี approvals ของ DM pairing ที่รอดำเนินการหลังการเปลี่ยน policy หรือตัวตน

ลายเซ็นที่พบบ่อย:

- `device identity required` → device auth ยังไม่ครบ
- `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

หาก config ของบริการและ runtime ยังคงไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง service metadata ใหม่จาก profile/state directory เดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [/gateway/pairing](/th/gateway/pairing)
- [/gateway/authentication](/th/gateway/authentication)
- [/gateway/background-process](/th/gateway/background-process)

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
