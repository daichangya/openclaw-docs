---
read_when:
    - การกำหนดค่า SecretRef สำหรับข้อมูลรับรองของผู้ให้บริการและ ref ของ `auth-profiles.json`
    - การใช้งาน secrets reload, audit, configure และ apply อย่างปลอดภัยใน production
    - การทำความเข้าใจการ fail-fast ตอนเริ่มต้น การกรองพื้นผิวที่ไม่ทำงาน และพฤติกรรม last-known-good
summary: 'การจัดการ Secrets: สัญญา SecretRef พฤติกรรม runtime snapshot และการล้างข้อมูลทางเดียวอย่างปลอดภัย'
title: การจัดการ Secrets
x-i18n:
    generated_at: "2026-04-24T09:12:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw รองรับ SecretRef แบบเพิ่มเติม เพื่อให้ข้อมูลรับรองที่รองรับไม่จำเป็นต้องถูกเก็บเป็นข้อความธรรมดาไว้ในการกำหนดค่า

ข้อความธรรมดายังคงใช้งานได้ SecretRef เป็นแบบเลือกใช้เองต่อข้อมูลรับรองแต่ละรายการ

## เป้าหมายและโมเดลรันไทม์

Secrets จะถูก resolve ไปเป็น runtime snapshot ในหน่วยความจำ

- การ resolve เป็นแบบ eager ระหว่างการเปิดใช้งาน ไม่ใช่แบบ lazy บนเส้นทางคำขอ
- การเริ่มต้นระบบจะ fail-fast เมื่อ SecretRef ที่มีผลใช้งานจริงไม่สามารถ resolve ได้
- การ reload ใช้ atomic swap: สำเร็จทั้งหมด หรือคง snapshot ที่ดีล่าสุดไว้
- การละเมิดนโยบาย SecretRef (เช่น โปรไฟล์ auth โหมด OAuth ที่ใช้ร่วมกับอินพุต SecretRef) จะทำให้ activation ล้มเหลวก่อน runtime swap
- คำขอรันไทม์จะอ่านจาก active in-memory snapshot เท่านั้น
- หลังจาก config activation/load สำเร็จครั้งแรก เส้นทางโค้ดของรันไทม์จะยังคงอ่าน active in-memory snapshot นั้นจนกว่าจะมี successful reload มาสลับมันออก
- เส้นทางการส่งขาออกก็อ่านจาก active snapshot นั้นด้วย (เช่น การส่ง reply/thread ของ Discord และการส่ง action ของ Telegram); มันจะไม่ resolve SecretRef ใหม่ทุกครั้งที่ส่ง

สิ่งนี้ช่วยกันไม่ให้ปัญหาการล่มของผู้ให้บริการ secrets ไปเกิดบน hot request paths

## การกรองพื้นผิวที่ทำงานอยู่จริง

SecretRefs จะถูกตรวจสอบเฉพาะบนพื้นผิวที่ทำงานอยู่จริงเท่านั้น

- พื้นผิวที่เปิดใช้งาน: ref ที่ยัง resolve ไม่ได้จะบล็อกการเริ่มต้น/รีโหลด
- พื้นผิวที่ไม่ทำงาน: ref ที่ยัง resolve ไม่ได้จะไม่บล็อกการเริ่มต้น/รีโหลด
- ref ที่ไม่ทำงานจะปล่อย diagnostics แบบไม่ร้ายแรงด้วยโค้ด `SECRETS_REF_IGNORED_INACTIVE_SURFACE`

ตัวอย่างของพื้นผิวที่ไม่ทำงาน:

- รายการ channel/account ที่ปิดใช้งาน
- ข้อมูลรับรองช่องทางระดับบนสุดที่ไม่มีบัญชีที่เปิดใช้งานใดสืบทอด
- พื้นผิว tool/feature ที่ปิดใช้งาน
- คีย์เฉพาะผู้ให้บริการของ web search ที่ไม่ได้ถูกเลือกโดย `tools.web.search.provider`
  ในโหมด auto (ไม่ได้ตั้ง provider) คีย์จะถูกพิจารณาตามลำดับความสำคัญเพื่อใช้ตรวจจับผู้ให้บริการอัตโนมัติจนกว่าจะ resolve ได้ตัวหนึ่ง
  หลังจากเลือกแล้ว คีย์ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก
- วัสดุ auth ของ sandbox SSH (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` รวมถึง per-agent overrides) จะทำงานก็ต่อเมื่อ
  backend sandbox ที่มีผลจริงเป็น `ssh` สำหรับเอเจนต์เริ่มต้นหรือเอเจนต์ที่เปิดใช้งาน
- SecretRef ของ `gateway.remote.token` / `gateway.remote.password` จะทำงานหากมีข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:
  - `gateway.mode=remote`
  - มีการกำหนดค่า `gateway.remote.url`
  - `gateway.tailscale.mode` เป็น `serve` หรือ `funnel`
  - ใน local mode ที่ไม่มีพื้นผิว remote เหล่านั้น:
    - `gateway.remote.token` จะทำงานเมื่อ token auth มีโอกาสชนะและไม่มีการกำหนด env/auth token ไว้
    - `gateway.remote.password` จะทำงานก็ต่อเมื่อ password auth มีโอกาสชนะและไม่มีการกำหนด env/auth password ไว้
- SecretRef ของ `gateway.auth.token` จะไม่ทำงานสำหรับการ resolve auth ตอนเริ่มต้นเมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN` เพราะอินพุต token จาก env ชนะสำหรับรันไทม์นั้น

## diagnostics ของพื้นผิว auth ของ Gateway

เมื่อมีการกำหนด SecretRef บน `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` หรือ `gateway.remote.password`, ระหว่างการเริ่มต้น/รีโหลด gateway จะบันทึก
สถานะของพื้นผิวอย่างชัดเจน:

- `active`: SecretRef เป็นส่วนหนึ่งของพื้นผิว auth ที่มีผลจริงและต้อง resolve ได้
- `inactive`: SecretRef ถูกเพิกเฉยสำหรับรันไทม์นี้เพราะมีพื้นผิว auth อื่นชนะ หรือ
  เพราะ remote auth ถูกปิด/ไม่ทำงาน

รายการเหล่านี้จะถูกบันทึกด้วย `SECRETS_GATEWAY_AUTH_SURFACE` และมีเหตุผลที่ใช้อ้างอิงจาก
นโยบายพื้นผิวที่ทำงานอยู่จริงรวมอยู่ด้วย เพื่อให้คุณเห็นว่าทำไมข้อมูลรับรองจึงถูกถือว่า active หรือ inactive

## การตรวจสอบล่วงหน้าของ reference ใน onboarding

เมื่อ onboarding ทำงานในโหมดโต้ตอบและคุณเลือกใช้การจัดเก็บแบบ SecretRef OpenClaw จะทำการตรวจสอบล่วงหน้าก่อนบันทึก:

- Env refs: ตรวจสอบชื่อ env var และยืนยันว่ามองเห็นค่าที่ไม่ว่างระหว่างการตั้งค่า
- Provider refs (`file` หรือ `exec`): ตรวจสอบการเลือก provider, resolve `id` และตรวจชนิดค่าที่ resolve แล้ว
- เส้นทางใช้ค่า quickstart ซ้ำ: เมื่อ `gateway.auth.token` เป็น SecretRef อยู่แล้ว onboarding จะ resolve มันก่อนการ bootstrap probe/dashboard (สำหรับ ref แบบ `env`, `file` และ `exec`) โดยใช้ fail-fast gate เดียวกัน

หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่

## สัญญา SecretRef

ใช้รูปร่างออบเจ็กต์เดียวกันทุกที่:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

การตรวจสอบ:

- `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
- `id` ต้องตรงกับ `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

การตรวจสอบ:

- `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
- `id` ต้องเป็น absolute JSON pointer (`/...`)
- การ escape ตาม RFC6901 ในแต่ละ segment: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

การตรวจสอบ:

- `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
- `id` ต้องตรงกับ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` ต้องไม่มี `.` หรือ `..` เป็น path segment ที่คั่นด้วย slash (เช่น `a/../b` จะถูกปฏิเสธ)

## การกำหนดค่า provider

กำหนด providers ภายใต้ `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- มี allowlist แบบไม่บังคับผ่าน `allowlist`
- ค่า env ที่ไม่มีหรือว่างจะทำให้การ resolve ล้มเหลว

### File provider

- อ่านไฟล์ภายในเครื่องจาก `path`
- `mode: "json"` คาดหวัง payload เป็นออบเจ็กต์ JSON และ resolve `id` เป็น pointer
- `mode: "singleValue"` คาดหวัง ref id เป็น `"value"` และส่งคืนเนื้อหาไฟล์
- พาธต้องผ่านการตรวจสอบเจ้าของ/สิทธิ์
- หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธได้ การ resolve จะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

### Exec provider

- รันพาธไบนารีแบบ absolute ที่กำหนดไว้ โดยไม่ใช้ shell
- โดยค่าเริ่มต้น `command` ต้องชี้ไปยังไฟล์ปกติ (ไม่ใช่ symlink)
- ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธคำสั่งที่เป็น symlink (เช่น Homebrew shims) OpenClaw จะตรวจสอบพาธของ target ที่ resolve แล้ว
- จับคู่ `allowSymlinkCommand` กับ `trustedDirs` สำหรับพาธของ package manager (เช่น `["/opt/homebrew"]`)
- รองรับ timeout, no-output timeout, ขีดจำกัดไบต์ของเอาต์พุต, env allowlist และ trusted dirs
- หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธคำสั่งได้ การ resolve จะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

payload ของคำขอ (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

payload ของคำตอบ (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

ข้อผิดพลาดต่อ id แบบไม่บังคับ:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## ตัวอย่างการเชื่อมต่อ exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## ตัวแปร environment ของ MCP server

ตัวแปร env ของ MCP server ที่กำหนดค่าผ่าน `plugins.entries.acpx.config.mcpServers` รองรับ SecretInput สิ่งนี้ช่วยให้ API keys และโทเค็นไม่ต้องอยู่ใน config แบบข้อความธรรมดา:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

ค่าสตริงแบบข้อความธรรมดายังคงใช้ได้ Env-template refs แบบ `${MCP_SERVER_API_KEY}` และออบเจ็กต์ SecretRef จะถูก resolve ระหว่าง gateway activation ก่อนที่โปรเซส MCP server จะถูกสปอว์น เช่นเดียวกับพื้นผิว SecretRef อื่น ๆ ref ที่ยัง resolve ไม่ได้จะบล็อก activation เฉพาะเมื่อ Plugin `acpx` ทำงานอยู่จริงเท่านั้น

## วัสดุ auth ของ sandbox SSH

backend `ssh` ของ sandbox ใน core ก็รองรับ SecretRefs สำหรับวัสดุ auth ของ SSH เช่นกัน:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

พฤติกรรมรันไทม์:

- OpenClaw จะ resolve ref เหล่านี้ระหว่าง sandbox activation ไม่ใช่แบบ lazy ในทุก SSH call
- ค่าที่ resolve แล้วจะถูกเขียนลงไฟล์ชั่วคราวด้วยสิทธิ์แบบเข้มงวดและใช้ใน SSH config ที่สร้างขึ้น
- หาก backend sandbox ที่มีผลจริงไม่ใช่ `ssh` ref เหล่านี้จะคงสถานะไม่ทำงานและไม่บล็อกการเริ่มต้นระบบ

## พื้นผิวข้อมูลรับรองที่รองรับ

ข้อมูลรับรองที่รองรับและไม่รองรับแบบ canonical ถูกระบุไว้ใน:

- [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)

ข้อมูลรับรองที่สร้างขึ้นในรันไทม์หรือหมุนเวียนได้ และวัสดุ OAuth refresh ถูกตั้งใจให้ไม่รวมอยู่ในการ resolve แบบอ่านอย่างเดียวของ SecretRef

## พฤติกรรมและลำดับความสำคัญที่ต้องมี

- ฟิลด์ที่ไม่มี ref: ไม่เปลี่ยนแปลง
- ฟิลด์ที่มี ref: จำเป็นบนพื้นผิวที่ทำงานอยู่จริงระหว่าง activation
- หากมีทั้งข้อความธรรมดาและ ref พร้อมกัน ref จะมีลำดับความสำคัญเหนือกว่าบนเส้นทางลำดับความสำคัญที่รองรับ
- sentinel สำหรับการปกปิดข้อมูล `__OPENCLAW_REDACTED__` สงวนไว้สำหรับการปกปิด/กู้คืน config ภายใน และจะถูกปฏิเสธหากส่งมาเป็นข้อมูล config แบบ literal

สัญญาณคำเตือนและการตรวจสอบ:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (คำเตือนระหว่างรันไทม์)
- `REF_SHADOWED` (ผลการตรวจพบจาก audit เมื่อข้อมูลรับรองใน `auth-profiles.json` มีลำดับความสำคัญเหนือ ref ใน `openclaw.json`)

พฤติกรรมความเข้ากันได้ของ Google Chat:

- `serviceAccountRef` มีลำดับความสำคัญเหนือ `serviceAccount` แบบข้อความธรรมดา
- ค่าข้อความธรรมดาจะถูกเพิกเฉยเมื่อมี ref ที่อยู่ระดับเดียวกันถูกตั้งไว้

## ทริกเกอร์การ activation

การเปิดใช้งาน secret จะรันในกรณีต่อไปนี้:

- ตอนเริ่มต้นระบบ (preflight และ activation ขั้นสุดท้าย)
- เส้นทาง hot-apply ของ config reload
- เส้นทาง restart-check ของ config reload
- การ reload ด้วยตนเองผ่าน `secrets.reload`
- preflight ของ Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) สำหรับความสามารถในการ resolve SecretRef บนพื้นผิวที่ทำงานอยู่จริงภายใน payload config ที่ส่งเข้ามาก่อนบันทึกการแก้ไข

สัญญา activation:

- สำเร็จแล้วจึงสลับ snapshot แบบอะตอมมิก
- ความล้มเหลวตอนเริ่มต้นจะยกเลิกการเริ่มต้น gateway
- ความล้มเหลวระหว่าง runtime reload จะคง last-known-good snapshot ไว้
- ความล้มเหลวของ write-RPC preflight จะปฏิเสธ config ที่ส่งเข้ามาและคงทั้ง config บนดิสก์และ active runtime snapshot ไว้โดยไม่เปลี่ยนแปลง
- การให้ channel token แบบ explicit ต่อการเรียก outbound helper/tool จะไม่ทริกเกอร์การ activation ของ SecretRef; จุด activation ยังคงเป็นตอนเริ่มต้น การ reload และ `secrets.reload` แบบ explicit เท่านั้น

## สัญญาณ degraded และ recovered

เมื่อ activation ระหว่าง reload ล้มเหลวหลังจากอยู่ในสถานะปกติ OpenClaw จะเข้าสู่สถานะ secrets แบบ degraded

system event และรหัส log แบบ one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

พฤติกรรม:

- Degraded: รันไทม์จะคง last-known-good snapshot ไว้
- Recovered: จะถูกส่งออกครั้งเดียวหลัง activation ครั้งถัดไปที่สำเร็จ
- หากล้มเหลวซ้ำขณะอยู่ในสถานะ degraded แล้ว จะบันทึกคำเตือนแต่จะไม่สแปมอีเวนต์
- การ fail-fast ตอนเริ่มต้นจะไม่ปล่อย degraded events เพราะรันไทม์ไม่เคยกลายเป็น active

## การ resolve ในเส้นทางคำสั่ง

เส้นทางคำสั่งสามารถเลือกใช้การ resolve SecretRef ที่รองรับผ่าน gateway snapshot RPC ได้

มีพฤติกรรมกว้าง ๆ สองแบบ:

- เส้นทางคำสั่งแบบเข้มงวด (เช่น เส้นทาง remote-memory ของ `openclaw memory` และ `openclaw qr --remote` เมื่อจำเป็นต้องใช้ remote shared-secret refs) จะอ่านจาก active snapshot และ fail fast เมื่อ SecretRef ที่จำเป็นไม่พร้อมใช้งาน
- เส้นทางคำสั่งแบบอ่านอย่างเดียว (เช่น `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` และโฟลว์ read-only ของ doctor/config repair) ก็จะให้ความสำคัญกับ active snapshot เช่นกัน แต่จะ degrade แทนการยกเลิกเมื่อ SecretRef เป้าหมายไม่พร้อมใช้งานในเส้นทางคำสั่งนั้น

พฤติกรรมแบบอ่านอย่างเดียว:

- เมื่อ gateway กำลังทำงาน คำสั่งเหล่านี้จะอ่านจาก active snapshot ก่อน
- หากการ resolve ของ gateway ยังไม่สมบูรณ์หรือ gateway ไม่พร้อมใช้งาน ระบบจะพยายาม fallback แบบ local เฉพาะเป้าหมายสำหรับพื้นผิวคำสั่งนั้น
- หาก SecretRef เป้าหมายยังไม่พร้อมใช้งาน คำสั่งจะทำงานต่อด้วยเอาต์พุตแบบ degraded สำหรับอ่านอย่างเดียว พร้อม diagnostics แบบชัดเจน เช่น “configured but unavailable in this command path”
- พฤติกรรม degraded นี้มีผลเฉพาะภายในคำสั่งนั้นเท่านั้น มันไม่ได้ทำให้เส้นทาง runtime startup, reload หรือ send/auth อ่อนลง

หมายเหตุอื่น ๆ:

- การรีเฟรช snapshot หลังการหมุนเวียน secret ใน backend จัดการผ่าน `openclaw secrets reload`
- เมธอด Gateway RPC ที่ใช้โดยเส้นทางคำสั่งเหล่านี้: `secrets.resolve`

## เวิร์กโฟลว์ audit และ configure

โฟลว์เริ่มต้นสำหรับผู้ปฏิบัติงาน:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

สิ่งที่ตรวจพบรวมถึง:

- ค่าข้อความธรรมดาที่เก็บอยู่ (`openclaw.json`, `auth-profiles.json`, `.env` และ `agents/*/agent/models.json` ที่สร้างขึ้น)
- คราบค่า header ของผู้ให้บริการที่ละเอียดอ่อนในรูปข้อความธรรมดาในรายการ `models.json` ที่สร้างขึ้น
- ref ที่ยัง resolve ไม่ได้
- การถูกบังจากลำดับความสำคัญ (`auth-profiles.json` มีลำดับความสำคัญเหนือ ref ใน `openclaw.json`)
- คราบของระบบเดิม (`auth.json`, การเตือนเกี่ยวกับ OAuth)

หมายเหตุเกี่ยวกับ exec:

- โดยค่าเริ่มต้น audit จะข้ามการตรวจสอบความสามารถในการ resolve ของ exec SecretRef เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
- ใช้ `openclaw secrets audit --allow-exec` เพื่อให้รัน exec providers ระหว่าง audit

หมายเหตุเกี่ยวกับคราบของ header:

- การตรวจจับ header ของผู้ให้บริการที่ละเอียดอ่อนอิงตาม heuristic ของชื่อ (ชื่อและส่วนประกอบของ header สำหรับ auth/credential ที่พบบ่อย เช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

### `secrets configure`

ตัวช่วยแบบโต้ตอบที่:

- กำหนดค่า `secrets.providers` ก่อน (`env`/`file`/`exec`, เพิ่ม/แก้ไข/ลบ)
- ให้คุณเลือกฟิลด์ที่รองรับการเก็บ secret ใน `openclaw.json` พร้อมทั้ง `auth-profiles.json` สำหรับหนึ่งขอบเขตเอเจนต์
- สามารถสร้างการแมป `auth-profiles.json` ใหม่ได้โดยตรงในตัวเลือกเป้าหมาย
- เก็บรายละเอียดของ SecretRef (`source`, `provider`, `id`)
- รัน preflight resolution
- สามารถ apply ได้ทันที

หมายเหตุเกี่ยวกับ exec:

- preflight จะข้ามการตรวจสอบ exec SecretRef เว้นแต่จะตั้ง `--allow-exec`
- หากคุณ apply โดยตรงจาก `configure --apply` และแผนมี exec refs/providers ให้คง `--allow-exec` ไว้สำหรับขั้น apply ด้วย

โหมดที่มีประโยชน์:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

ค่าเริ่มต้นของ `configure` เมื่อ apply:

- ล้างข้อมูลรับรองแบบคงที่ที่ตรงกันออกจาก `auth-profiles.json` สำหรับผู้ให้บริการที่เป็นเป้าหมาย
- ล้างรายการ `api_key` แบบคงที่ของระบบเดิมออกจาก `auth.json`
- ล้างบรรทัด secret ที่รู้จักและตรงกันออกจาก `<config-dir>/.env`

### `secrets apply`

ใช้แผนที่บันทึกไว้:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

หมายเหตุเกี่ยวกับ exec:

- dry-run จะข้ามการตรวจสอบ exec เว้นแต่จะตั้ง `--allow-exec`
- โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRefs/providers เว้นแต่จะตั้ง `--allow-exec`

สำหรับรายละเอียดสัญญา target/path แบบเข้มงวดและกฎการปฏิเสธที่แน่นอน ดู:

- [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract)

## นโยบายความปลอดภัยแบบทางเดียว

OpenClaw ตั้งใจไม่เขียน backup สำหรับ rollback ที่มีค่า secret แบบข้อความธรรมดาในอดีต

โมเดลความปลอดภัย:

- preflight ต้องสำเร็จก่อนโหมดเขียน
- runtime activation ถูกตรวจสอบก่อน commit
- apply อัปเดตไฟล์โดยใช้การแทนที่ไฟล์แบบอะตอมมิกและการกู้คืนแบบ best-effort เมื่อเกิดความล้มเหลว

## หมายเหตุความเข้ากันได้กับ auth แบบเดิม

สำหรับข้อมูลรับรองแบบคงที่ รันไทม์ไม่พึ่งพาการจัดเก็บ auth แบบเดิมในรูปข้อความธรรมดาอีกต่อไป

- แหล่งข้อมูลรับรองของรันไทม์คือ in-memory snapshot ที่ resolve แล้ว
- รายการ `api_key` แบบคงที่ของระบบเดิมจะถูกล้างเมื่อพบ
- พฤติกรรมความเข้ากันได้ที่เกี่ยวข้องกับ OAuth ยังคงแยกออกต่างหาก

## หมายเหตุเกี่ยวกับ Web UI

union ของ SecretInput บางแบบตั้งค่าได้ง่ายกว่าในโหมด raw editor มากกว่า form mode

## เอกสารที่เกี่ยวข้อง

- คำสั่ง CLI: [secrets](/th/cli/secrets)
- รายละเอียดสัญญาของแผน: [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract)
- พื้นผิวข้อมูลรับรอง: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- การตั้งค่า auth: [Authentication](/th/gateway/authentication)
- แนวทางด้านความปลอดภัย: [Security](/th/gateway/security)
- ลำดับความสำคัญของ environment: [Environment Variables](/th/help/environment)
