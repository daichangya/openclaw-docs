---
read_when:
    - การกำหนดค่า SecretRef สำหรับข้อมูลรับรองของผู้ให้บริการและ ref `auth-profiles.json`
    - การปฏิบัติงาน reload ตรวจสอบ กำหนดค่า และ apply ความลับอย่างปลอดภัยใน production
    - การทำความเข้าใจการล้มเหลวแบบ fail-fast ตอนเริ่มต้น การกรองพื้นผิวที่ไม่ใช้งาน และพฤติกรรม last-known-good
summary: 'การจัดการความลับ: สัญญา SecretRef พฤติกรรมสแนปช็อตของรันไทม์ และการล้างข้อมูลทางเดียวอย่างปลอดภัย'
title: การจัดการความลับ
x-i18n:
    generated_at: "2026-04-23T05:35:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# การจัดการความลับ

OpenClaw รองรับ SecretRef แบบ additive เพื่อให้ข้อมูลรับรองที่รองรับไม่จำเป็นต้องเก็บเป็นข้อความล้วนในคอนฟิก

ยังคงใช้ข้อความล้วนได้ SecretRef เป็นตัวเลือกแบบ opt-in ต่อข้อมูลรับรองแต่ละรายการ

## เป้าหมายและโมเดลรันไทม์

ความลับจะถูก resolve ไปเป็นสแนปช็อตของรันไทม์ในหน่วยความจำ

- การ resolve จะเกิดขึ้นแบบ eager ระหว่างการเปิดใช้งาน ไม่ใช่แบบ lazy บนเส้นทางคำขอ
- การเริ่มต้นจะล้มเหลวแบบ fail-fast เมื่อ SecretRef ที่มีผลใช้งานจริงไม่สามารถ resolve ได้
- การ reload ใช้ atomic swap: สำเร็จทั้งหมด หรือคงสแนปช็อต last-known-good ไว้
- การละเมิดนโยบาย SecretRef (เช่น auth profile แบบ OAuth-mode ที่ใช้ร่วมกับอินพุต SecretRef) จะทำให้การเปิดใช้งานล้มเหลวก่อนการ swap ของรันไทม์
- คำขอของรันไทม์จะอ่านจากสแนปช็อตในหน่วยความจำที่ active อยู่เท่านั้น
- หลังจาก config activation/load สำเร็จครั้งแรก เส้นทางโค้ดของรันไทม์จะอ่านจากสแนปช็อตในหน่วยความจำที่ active อยู่นั้นต่อไป จนกว่าจะมี successful reload มา swap มันออก
- เส้นทางการส่งออกภายนอกก็อ่านจากสแนปช็อตที่ active อยู่นั้นเช่นกัน (เช่นการส่ง reply/thread ของ Discord และการส่ง action ของ Telegram); จะไม่ resolve SecretRef ใหม่ทุกครั้งที่ส่ง

สิ่งนี้ช่วยกันไม่ให้ปัญหาของผู้ให้บริการความลับมากระทบเส้นทางคำขอที่ทำงานถี่

## การกรองพื้นผิวที่ใช้งานอยู่

SecretRef จะถูกตรวจสอบเฉพาะบนพื้นผิวที่มีผลใช้งานจริงเท่านั้น

- พื้นผิวที่เปิดใช้งาน: ref ที่ยังไม่ resolve จะบล็อกการเริ่มต้น/รีโหลด
- พื้นผิวที่ไม่ใช้งาน: ref ที่ยังไม่ resolve จะไม่บล็อกการเริ่มต้น/รีโหลด
- ref ที่ไม่ใช้งานจะปล่อย diagnostic แบบไม่ร้ายแรงด้วยรหัส `SECRETS_REF_IGNORED_INACTIVE_SURFACE`

ตัวอย่างของพื้นผิวที่ไม่ใช้งาน:

- รายการ channel/account ที่ปิดใช้งาน
- ข้อมูลรับรองระดับบนสุดของช่องที่ไม่มีบัญชีใดที่เปิดใช้งานอยู่สืบทอดไปใช้
- พื้นผิวของ tool/feature ที่ปิดใช้งาน
- คีย์เฉพาะผู้ให้บริการของ web search ที่ไม่ได้ถูกเลือกโดย `tools.web.search.provider`
  ในโหมด auto (ไม่ได้ตั้ง provider) จะมีการตรวจคีย์ตามลำดับความสำคัญสำหรับการตรวจจับ provider อัตโนมัติจนกว่าจะมีตัวหนึ่ง resolve ได้
  หลังจากเลือกแล้ว คีย์ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
- วัสดุ auth SSH ของ sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` รวมถึง override รายเอเจนต์) จะ active ก็ต่อเมื่อ
  sandbox backend ที่มีผลจริงเป็น `ssh` สำหรับเอเจนต์ค่าเริ่มต้นหรือเอเจนต์ที่เปิดใช้งาน
- SecretRef ของ `gateway.remote.token` / `gateway.remote.password` จะ active หากข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:
  - `gateway.mode=remote`
  - มีการกำหนดค่า `gateway.remote.url`
  - `gateway.tailscale.mode` เป็น `serve` หรือ `funnel`
  - ในโหมด local ที่ไม่มีพื้นผิวระยะไกลเหล่านั้น:
    - `gateway.remote.token` จะ active เมื่อ token auth สามารถชนะได้และไม่มี token จาก env/auth ถูกกำหนดไว้
    - `gateway.remote.password` จะ active เฉพาะเมื่อ password auth สามารถชนะได้และไม่มีรหัสผ่านจาก env/auth ถูกกำหนดไว้
- SecretRef ของ `gateway.auth.token` จะไม่ active สำหรับการ resolve auth ตอนเริ่มต้นเมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN` เพราะอินพุต token จาก env มีความสำคัญสูงกว่าสำหรับรันไทม์นั้น

## diagnostic ของพื้นผิว auth ของ Gateway

เมื่อมีการกำหนดค่า SecretRef บน `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` หรือ `gateway.remote.password`, การเริ่มต้น/รีโหลดของ gateway จะบันทึก
สถานะของพื้นผิวอย่างชัดเจน:

- `active`: SecretRef เป็นส่วนหนึ่งของพื้นผิว auth ที่มีผลจริงและต้อง resolve ได้
- `inactive`: SecretRef นี้ถูกละเลยสำหรับรันไทม์นี้ เพราะมีพื้นผิว auth อื่นชนะอยู่ หรือ
  เพราะ remote auth ถูกปิดใช้งาน/ไม่ได้ active

รายการเหล่านี้จะถูกบันทึกด้วย `SECRETS_GATEWAY_AUTH_SURFACE` และรวมเหตุผลที่ใช้โดยนโยบาย
active-surface ไว้ด้วย เพื่อให้คุณเห็นได้ว่าเหตุใดข้อมูลรับรองนั้นจึงถูกมองว่า active หรือ inactive

## preflight ของ reference ตอน onboarding

เมื่อ onboarding รันในโหมดโต้ตอบและคุณเลือกเก็บข้อมูลแบบ SecretRef, OpenClaw จะรันการตรวจสอบ preflight ก่อนบันทึก:

- Env ref: ตรวจสอบชื่อ env var และยืนยันว่ามีค่าที่ไม่ว่างมองเห็นได้ระหว่างการตั้งค่า
- Provider ref (`file` หรือ `exec`): ตรวจสอบการเลือก provider, resolve `id` และตรวจชนิดค่าที่ resolve ได้
- เส้นทางใช้ quickstart ซ้ำ: เมื่อ `gateway.auth.token` เป็น SecretRef อยู่แล้ว onboarding จะ resolve มันก่อน probe/dashboard bootstrap (สำหรับ ref แบบ `env`, `file` และ `exec`) โดยใช้เกต fail-fast เดียวกัน

หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

## สัญญา SecretRef

ใช้รูปแบบออบเจ็กต์เดียวกันทุกที่:

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
- การ escape แบบ RFC6901 ในแต่ละ segment: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

การตรวจสอบ:

- `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
- `id` ต้องตรงกับ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` ต้องไม่มี `.` หรือ `..` เป็น path segment ที่คั่นด้วย slash (เช่น `a/../b` จะถูกปฏิเสธ)

## คอนฟิก provider

กำหนด provider ไว้ภายใต้ `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // หรือ "singleValue"
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
- ค่า env ที่ไม่มี/ว่างจะทำให้การ resolve ล้มเหลว

### File provider

- อ่านไฟล์ภายในเครื่องจาก `path`
- `mode: "json"` คาดว่าจะเป็น payload ออบเจ็กต์ JSON และ resolve `id` เป็น pointer
- `mode: "singleValue"` คาดว่า ref id เป็น `"value"` และจะคืนค่าเนื้อหาไฟล์
- พาธต้องผ่านการตรวจสอบความเป็นเจ้าของ/สิทธิ์
- หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL ของพาธได้ การ resolve จะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น สามารถตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธได้

### Exec provider

- รัน binary path แบบ absolute ที่กำหนดไว้ โดยไม่ผ่าน shell
- โดยค่าเริ่มต้น `command` ต้องชี้ไปยังไฟล์ปกติ (ไม่ใช่ symlink)
- ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาต command path แบบ symlink (เช่น shim ของ Homebrew) OpenClaw จะตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- ควรใช้ `allowSymlinkCommand` ร่วมกับ `trustedDirs` สำหรับพาธของ package manager (เช่น `["/opt/homebrew"]`)
- รองรับ timeout, no-output timeout, ขีดจำกัดไบต์ของเอาต์พุต, allowlist ของ env และ trusted dirs
- หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL ของ command path ได้ การ resolve จะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น สามารถตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธได้

payload ของคำขอ (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

payload ของคำตอบ (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

ข้อผิดพลาดราย id แบบไม่บังคับ:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## ตัวอย่างการผสานรวม Exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // จำเป็นสำหรับ binary แบบ symlink ของ Homebrew
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
        allowSymlinkCommand: true, // จำเป็นสำหรับ binary แบบ symlink ของ Homebrew
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
        allowSymlinkCommand: true, // จำเป็นสำหรับ binary แบบ symlink ของ Homebrew
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

## ตัวแปรสภาพแวดล้อมของ MCP server

ตัวแปร env ของ MCP server ที่กำหนดค่าผ่าน `plugins.entries.acpx.config.mcpServers` รองรับ SecretInput ซึ่งช่วยให้ API key และ token ไม่ต้องอยู่ใน config แบบข้อความล้วน:

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

ค่าสตริงแบบข้อความล้วนยังคงใช้ได้ Env-template ref เช่น `${MCP_SERVER_API_KEY}` และออบเจ็กต์ SecretRef จะถูก resolve ระหว่าง gateway activation ก่อนจะสปินโปรเซส MCP server เช่นเดียวกับพื้นผิว SecretRef อื่น ๆ ref ที่ยังไม่ resolve จะบล็อกการเปิดใช้งานก็ต่อเมื่อ Plugin `acpx` มีผลใช้งานจริงเท่านั้น

## วัสดุ auth SSH ของ Sandbox

backend `ssh` ของ sandbox ใน core ก็รองรับ SecretRef สำหรับวัสดุ auth SSH เช่นกัน:

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

พฤติกรรมของรันไทม์:

- OpenClaw จะ resolve ref เหล่านี้ระหว่างการเปิดใช้งาน sandbox ไม่ใช่แบบ lazy ระหว่างการเรียก SSH แต่ละครั้ง
- ค่าที่ resolve แล้วจะถูกเขียนลงไฟล์ชั่วคราวด้วยสิทธิ์ที่จำกัด และใช้ใน SSH config ที่สร้างขึ้น
- หาก sandbox backend ที่มีผลจริงไม่ใช่ `ssh`, ref เหล่านี้จะคงสถานะไม่ active และจะไม่บล็อกการเริ่มต้น

## พื้นผิวข้อมูลรับรองที่รองรับ

รายการ canonical ของข้อมูลรับรองที่รองรับและไม่รองรับอยู่ที่:

- [พื้นผิวข้อมูลรับรองของ SecretRef](/th/reference/secretref-credential-surface)

ข้อมูลรับรองที่ถูกสร้างในรันไทม์หรือมีการหมุนเวียน และวัสดุ OAuth refresh ถูกตั้งใจให้ไม่รวมอยู่ในการ resolve แบบ SecretRef ที่อ่านอย่างเดียว

## พฤติกรรมและลำดับความสำคัญที่ต้องเป็นไปตามนี้

- ฟิลด์ที่ไม่มี ref: ไม่เปลี่ยนแปลง
- ฟิลด์ที่มี ref: จำเป็นต้อง resolve ได้บนพื้นผิวที่ active ระหว่างการเปิดใช้งาน
- หากมีทั้งข้อความล้วนและ ref อยู่พร้อมกัน ref จะมีความสำคัญสูงกว่าในเส้นทาง precedence ที่รองรับ
- sentinel สำหรับการ redaction คือ `__OPENCLAW_REDACTED__` ซึ่งสงวนไว้สำหรับการ redaction/restore คอนฟิกภายใน และจะถูกปฏิเสธหากส่งมาเป็นข้อมูลคอนฟิกแบบ literal

สัญญาณเตือนและการตรวจสอบ:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (คำเตือนในรันไทม์)
- `REF_SHADOWED` (ผลการตรวจสอบเมื่อข้อมูลรับรองใน `auth-profiles.json` มีความสำคัญสูงกว่า ref ใน `openclaw.json`)

พฤติกรรมความเข้ากันได้ของ Google Chat:

- `serviceAccountRef` มีความสำคัญสูงกว่าค่า `serviceAccount` แบบข้อความล้วน
- ค่าข้อความล้วนจะถูกละเลยเมื่อมี sibling ref ตั้งอยู่

## ตัวกระตุ้นการเปิดใช้งาน

การเปิดใช้งาน Secret จะรันเมื่อ:

- การเริ่มต้น (preflight รวมถึง final activation)
- เส้นทาง hot-apply ของ config reload
- เส้นทาง restart-check ของ config reload
- การ reload แบบแมนนวลผ่าน `secrets.reload`
- preflight ของ RPC การเขียน config บน gateway (`config.set` / `config.apply` / `config.patch`) สำหรับการ resolve SecretRef ของพื้นผิวที่ active ภายใน payload คอนฟิกที่ส่งมา ก่อนบันทึกการแก้ไข

สัญญาการเปิดใช้งาน:

- หากสำเร็จ จะสลับสแนปช็อตแบบอะตอมมิก
- หากล้มเหลวตอนเริ่มต้น จะยกเลิกการเริ่มต้น gateway
- หาก reload ตอนรันไทม์ล้มเหลว จะคงสแนปช็อต last-known-good ไว้
- หาก preflight ของ write-RPC ล้มเหลว จะปฏิเสธคอนฟิกที่ส่งมา และคงทั้ง config บนดิสก์และสแนปช็อตรันไทม์ที่ active ไว้ไม่เปลี่ยนแปลง
- การส่ง channel token แบบ explicit ต่อการเรียก helper/tool ขาออก จะไม่กระตุ้นการเปิดใช้งาน SecretRef; จุดเปิดใช้งานยังคงเป็นการเริ่มต้น การ reload และ `secrets.reload` แบบ explicit เท่านั้น

## สัญญาณ degraded และ recovered

เมื่อการเปิดใช้งานตอน reload ล้มเหลวหลังจากเคยอยู่ในสถานะปกติ OpenClaw จะเข้าสู่สถานะ secrets แบบ degraded

system event แบบ one-shot และรหัสบันทึก:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

พฤติกรรม:

- Degraded: รันไทม์จะคงสแนปช็อต last-known-good ไว้
- Recovered: จะถูกส่งหนึ่งครั้งหลังการเปิดใช้งานครั้งถัดไปที่สำเร็จ
- ความล้มเหลวซ้ำ ๆ ขณะที่อยู่ในสถานะ degraded แล้ว จะบันทึกเป็นคำเตือนแต่ไม่สแปม event
- การล้มเหลวแบบ fail-fast ตอนเริ่มต้นจะไม่ส่ง degraded event เพราะรันไทม์ยังไม่เคย active

## การ resolve บนเส้นทางคำสั่ง

เส้นทางคำสั่งสามารถ opt in เข้าสู่การ resolve SecretRef แบบที่รองรับผ่าน gateway snapshot RPC

มีพฤติกรรมกว้าง ๆ สองแบบ:

- เส้นทางคำสั่งแบบเข้มงวด (เช่นเส้นทางหน่วยความจำระยะไกลของ `openclaw memory` และ `openclaw qr --remote` เมื่อจำเป็นต้องใช้ ref ของ shared-secret ระยะไกล) จะอ่านจากสแนปช็อตที่ active และล้มเหลวแบบ fail-fast เมื่อ SecretRef ที่ต้องใช้ไม่พร้อมใช้งาน
- เส้นทางคำสั่งแบบอ่านอย่างเดียว (เช่น `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` และโฟลว์ซ่อมแซม doctor/config แบบอ่านอย่างเดียว) ก็จะพยายามใช้สแนปช็อตที่ active ก่อนเช่นกัน แต่จะ degrade แทนการยกเลิกเมื่อ SecretRef เป้าหมายไม่พร้อมใช้งานในเส้นทางคำสั่งนั้น

พฤติกรรมแบบอ่านอย่างเดียว:

- เมื่อ gateway กำลังทำงาน คำสั่งเหล่านี้จะอ่านจากสแนปช็อตที่ active ก่อน
- หากการ resolve ของ gateway ไม่สมบูรณ์หรือ gateway ไม่พร้อมใช้งาน จะพยายามทำ targeted local fallback สำหรับพื้นผิวเฉพาะของคำสั่งนั้น
- หาก SecretRef เป้าหมายยังไม่พร้อมใช้งาน คำสั่งจะทำงานต่อด้วยเอาต์พุตแบบ degraded อ่านอย่างเดียว และมี diagnostic ชัดเจน เช่น “configured but unavailable in this command path”
- พฤติกรรม degraded นี้จำกัดอยู่เฉพาะคำสั่งนั้น ๆ เท่านั้น ไม่ได้ทำให้เส้นทางการเริ่มต้น reload หรือการส่ง/auth ของรันไทม์อ่อนลง

หมายเหตุอื่น ๆ:

- การรีเฟรชสแนปช็อตหลังมีการหมุนเวียน secret ที่ backend จัดการผ่าน `openclaw secrets reload`
- เมธอด Gateway RPC ที่ใช้โดยเส้นทางคำสั่งเหล่านี้: `secrets.resolve`

## เวิร์กโฟลว์การตรวจสอบและการกำหนดค่า

โฟลว์มาตรฐานสำหรับโอเปอเรเตอร์:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

สิ่งที่ตรวจพบรวมถึง:

- ค่าข้อความล้วนที่เก็บอยู่ (`openclaw.json`, `auth-profiles.json`, `.env` และ `agents/*/agent/models.json` ที่สร้างขึ้น)
- คราบคงค้างของ header ผู้ให้บริการที่เป็นข้อมูลอ่อนไหวแบบข้อความล้วนในรายการ `models.json` ที่สร้างขึ้น
- ref ที่ยังไม่ resolve
- การถูก shadow จาก precedence (`auth-profiles.json` มีความสำคัญกว่า ref ใน `openclaw.json`)
- คราบจากระบบ legacy (`auth.json`, ตัวเตือนเกี่ยวกับ OAuth)

หมายเหตุสำหรับ exec:

- โดยค่าเริ่มต้น audit จะข้ามการตรวจสอบความสามารถในการ resolve ของ SecretRef แบบ exec เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
- ใช้ `openclaw secrets audit --allow-exec` เพื่อรัน exec provider ระหว่าง audit

หมายเหตุเรื่องคราบของ header:

- การตรวจจับ header ของผู้ให้บริการที่เป็นข้อมูลอ่อนไหวใช้ heuristic ตามชื่อ (ชื่อ header สำหรับ auth/credential ที่พบบ่อย และส่วนประกอบเช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

### `secrets configure`

ตัวช่วยแบบโต้ตอบที่:

- กำหนดค่า `secrets.providers` ก่อน (`env`/`file`/`exec`, เพิ่ม/แก้ไข/ลบ)
- ให้คุณเลือกฟิลด์ที่รองรับการเก็บความลับใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขตของเอเจนต์หนึ่งตัว
- สามารถสร้างการแมป `auth-profiles.json` ใหม่ได้โดยตรงในตัวเลือกเป้าหมาย
- เก็บรายละเอียด SecretRef (`source`, `provider`, `id`)
- รันการ resolve แบบ preflight
- สามารถ apply ได้ทันที

หมายเหตุสำหรับ exec:

- preflight จะข้ามการตรวจสอบ SecretRef แบบ exec เว้นแต่จะตั้ง `--allow-exec`
- หากคุณ apply โดยตรงจาก `configure --apply` และแผนมี exec ref/provider อยู่ ให้คง `--allow-exec` ไว้สำหรับขั้น apply ด้วย

โหมดที่มีประโยชน์:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

ค่าเริ่มต้นของการ apply จาก `configure`:

- ล้างข้อมูลรับรองแบบ static ที่ตรงกันออกจาก `auth-profiles.json` สำหรับผู้ให้บริการเป้าหมาย
- ล้างรายการ `api_key` แบบ static ของระบบ legacy จาก `auth.json`
- ล้างบรรทัด secret ที่รู้จักและตรงกันจาก `<config-dir>/.env`

### `secrets apply`

ใช้แผนที่บันทึกไว้:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

หมายเหตุสำหรับ exec:

- dry-run จะข้ามการตรวจสอบ exec เว้นแต่จะตั้ง `--allow-exec`
- โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRef/provider เว้นแต่จะตั้ง `--allow-exec`

สำหรับรายละเอียดสัญญาเป้าหมาย/พาธแบบเข้มงวดและกฎการปฏิเสธที่แน่นอน ดู:

- [สัญญาของแผน Secrets Apply](/th/gateway/secrets-plan-contract)

## นโยบายความปลอดภัยแบบทางเดียว

OpenClaw ตั้งใจไม่เขียนแบ็กอัปย้อนกลับที่มีค่าความลับแบบข้อความล้วนในอดีต

โมเดลความปลอดภัย:

- preflight ต้องสำเร็จก่อนโหมดเขียน
- รันไทม์ activation ต้องผ่านการตรวจสอบก่อน commit
- apply จะอัปเดตไฟล์โดยใช้การแทนที่ไฟล์แบบอะตอมมิกและพยายามกู้คืนเมื่อเกิดความล้มเหลวเท่าที่ทำได้

## หมายเหตุเรื่องความเข้ากันได้ของ auth แบบ legacy

สำหรับข้อมูลรับรองแบบ static ตอนนี้รันไทม์ไม่พึ่งที่เก็บ auth แบบ plaintext ของระบบ legacy อีกต่อไป

- แหล่งข้อมูลรับรองของรันไทม์คือสแนปช็อตในหน่วยความจำที่ resolve แล้ว
- รายการ `api_key` แบบ static ของระบบ legacy จะถูกล้างเมื่อพบ
- พฤติกรรมความเข้ากันได้ที่เกี่ยวกับ OAuth ยังคงแยกต่างหาก

## หมายเหตุเกี่ยวกับ Web UI

SecretInput union บางแบบกำหนดค่าได้ง่ายกว่าในโหมดตัวแก้ไขแบบดิบ มากกว่าโหมดฟอร์ม

## เอกสารที่เกี่ยวข้อง

- คำสั่ง CLI: [secrets](/cli/secrets)
- รายละเอียดสัญญาของแผน: [สัญญาของแผน Secrets Apply](/th/gateway/secrets-plan-contract)
- พื้นผิวข้อมูลรับรอง: [พื้นผิวข้อมูลรับรองของ SecretRef](/th/reference/secretref-credential-surface)
- การตั้งค่า auth: [การยืนยันตัวตน](/th/gateway/authentication)
- แนวทางความปลอดภัย: [ความปลอดภัย](/th/gateway/security)
- ลำดับความสำคัญของ environment: [ตัวแปรสภาพแวดล้อม](/th/help/environment)
