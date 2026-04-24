---
read_when:
    - การกำหนดค่านโยบาย allowlists หรือฟีเจอร์ experimental ของ `tools.*`
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือ override base URLs
    - การตั้งค่า endpoints แบบ self-hosted ที่เข้ากันได้กับ OpenAI
summary: คอนฟิก Tools (นโยบาย experimental toggles เครื่องมือที่ขับเคลื่อนด้วยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/custom base-URL
title: การกำหนดค่า — Tools และผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-04-24T09:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

คีย์คอนฟิก `tools.*` และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับ agents,
channels และคีย์คอนฟิกระดับบนสุดอื่น ๆ โปรดดู
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## Tools

### โปรไฟล์เครื่องมือ

`tools.profile` กำหนด allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

การ onboarding ในเครื่องจะตั้งค่า local configs ใหม่เป็น `tools.profile: "coding"` โดยค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้อย่างชัดเจนเดิมจะถูกรักษาไว้)

| โปรไฟล์     | รวม                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` เท่านั้น                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่จำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                  |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น alias ของ `exec`)                                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวมผู้ให้บริการแบบ Plugin)                                                                  |

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบ global (deny ชนะ) ไม่แยกตัวพิมพ์เล็กใหญ่ รองรับ wildcard `*` มีผลแม้ปิด Docker sandbox อยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับผู้ให้บริการหรือโมเดลที่ระบุ ลำดับคือ: base profile → provider profile → allow/deny

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

ควบคุมการเข้าถึง exec แบบ elevated นอก sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- การ override รายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดให้เข้มขึ้นได้เท่านั้น
- `/elevated on|off|ask|full` จะเก็บสถานะแยกตามเซสชัน; inline directives มีผลกับข้อความเดียว
- `exec` แบบ elevated จะข้าม sandboxing และใช้ escape path ที่กำหนดไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

การตรวจจับความปลอดภัยของ tool-loop จะ**ปิดเป็นค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ
สามารถกำหนดการตั้งค่าแบบ global ได้ใน `tools.loopDetection` และ override รายเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ประวัติ tool-call สูงสุดที่เก็บไว้สำหรับวิเคราะห์ loop
- `warningThreshold`: เกณฑ์รูปแบบซ้ำแบบไม่มีความคืบหน้าสำหรับการเตือน
- `criticalThreshold`: เกณฑ์ซ้ำที่สูงกว่าสำหรับบล็อก loop ระดับวิกฤต
- `globalCircuitBreakerThreshold`: เกณฑ์หยุดแบบ hard stop สำหรับการรันใด ๆ ที่ไม่มีความคืบหน้า
- `detectors.genericRepeat`: เตือนเมื่อมีการเรียก same-tool/same-args ซ้ำ
- `detectors.knownPollNoProgress`: เตือน/บล็อกกับ poll tools ที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
- `detectors.pingPong`: เตือน/บล็อกกับรูปแบบคู่สลับไปมาที่ไม่มีความคืบหน้า
- หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบความถูกต้องจะล้มเหลว

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // หรือ BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อ auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

กำหนดค่าความเข้าใจสื่อขาเข้า (ภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: ส่งเพลง/วิดีโอ async ที่เสร็จแล้วตรงไปยังช่องทาง
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="ฟิลด์ของรายการ media model">

**รายการ Provider** (`type: "provider"` หรือไม่ระบุ):

- `provider`: provider id ของ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
- `model`: override ของ model id
- `profile` / `preferredProfile`: การเลือก profile จาก `auth-profiles.json`

**รายการ CLI** (`type: "cli"`):

- `command`: executable ที่จะรัน
- `args`: args แบบมีเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น)

**ฟิลด์ทั่วไป:**

- `capabilities`: รายการแบบไม่บังคับ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overrides รายรายการ
- หากล้มเหลวจะ fallback ไปยังรายการถัดไป

auth ของ provider ทำงานตามลำดับมาตรฐาน: `auth-profiles.json` → env vars → `models.providers.*.apiKey`

**ฟิลด์ async completion:**

- `asyncCompletion.directSend`: เมื่อเป็น `true` งาน `music_generate`
  และ `video_generate` แบบ async ที่เสร็จแล้วจะพยายามส่งตรงไปยังช่องทางก่อน ค่าเริ่มต้น: `false`
  (เส้นทาง legacy requester-session wake/model-delivery)

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

ควบคุมว่าเซสชันใดสามารถเป็นเป้าหมายของ session tools (`sessions_list`, `sessions_history`, `sessions_send`) ได้

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูกสร้างจากมัน เช่น subagents)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

หมายเหตุ:

- `self`: เฉพาะ session key ปัจจุบัน
- `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างจากเซสชันปัจจุบัน (subagents)
- `agent`: เซสชันใด ๆ ที่เป็นของ agent id ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรันเซสชันแบบรายผู้ส่งภายใต้ agent id เดียวกัน)
- `all`: เซสชันใด ๆ ก็ได้ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
- Sandbox clamp: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ระบบจะบังคับ visibility เป็น `tree` แม้ `tools.sessions.visibility="all"` ก็ตาม

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบ inline สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ตั้งเป็น true เพื่ออนุญาตไฟล์แนบแบบ inline
        maxTotalBytes: 5242880, // รวมทุกไฟล์ได้ 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บไฟล์แนบไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

หมายเหตุ:

- ไฟล์แนบรองรับเฉพาะ `runtime: "subagent"` เท่านั้น runtime ของ ACP จะปฏิเสธ
- ไฟล์จะถูก materialize ลงใน child workspace ที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
- เนื้อหาของไฟล์แนบจะถูกปกปิดโดยอัตโนมัติจากการบันทึก transcript
- อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจ alphabet/padding แบบเข้มงวดและตัวป้องกันขนาดก่อนถอดรหัส
- สิทธิ์ไฟล์เป็น `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
- การ cleanup เป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้ก็ต่อเมื่อ `retainOnSessionKeep: true`

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ปิดเป็นค่าเริ่มต้น เว้นแต่จะมีกฎเปิดใช้อัตโนมัติ strict-agentic GPT-5

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบทดลอง
    },
  },
}
```

หมายเหตุ:

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับการติดตามงานหลายขั้นตอนที่ไม่ใช่งานง่าย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือ override รายเอเจนต์) จะถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล GPT-5 ของ OpenAI หรือ OpenAI Codex ตั้งค่า `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือ `false` เพื่อปิดไว้แม้ในการรัน strict-agentic GPT-5
- เมื่อเปิดใช้งาน system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เครื่องมือนี้เฉพาะกับงานที่มีสาระสำคัญ และมีได้ไม่เกินหนึ่งขั้นตอนที่เป็น `in_progress`

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่ถูกสร้างขึ้น หากไม่ระบุ sub-agents จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ agent ids เป้าหมายสำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกใช้เครื่องมือไม่ได้ระบุ `runTimeoutSeconds` `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือราย subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการแบบกำหนดเองและ base URLs

OpenClaw ใช้ catalog โมเดลในตัว เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ในคอนฟิกหรือ `~/.openclaw/agents/<agentId>/agent/models.json`

```json5
{
  models: {
    mode: "merge", // merge (ค่าเริ่มต้น) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- ใช้ `authHeader: true` + `headers` สำหรับความต้องการ auth แบบกำหนดเอง
- override รากคอนฟิกของเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของตัวแปรสภาพแวดล้อมแบบ legacy)
- ลำดับความสำคัญของการ merge สำหรับ provider IDs ที่ตรงกัน:
  - ค่า `baseUrl` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะชนะ
  - ค่า `apiKey` ที่ไม่ว่างของเอเจนต์จะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบทคอนฟิก/auth-profile ปัจจุบัน
  - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการบันทึก secrets ที่ resolve แล้ว
  - ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
  - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีอยู่จะ fallback ไปยัง `models.providers` ในคอนฟิก
  - ค่า `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่างคอนฟิกแบบชัดเจนกับค่า catalog แบบ implicit
  - `contextTokens` ของโมเดลที่ตรงกันจะคง runtime cap แบบชัดเจนไว้เมื่อมีอยู่; ใช้มันเพื่อจำกัด effective context โดยไม่เปลี่ยน metadata ดั้งเดิมของโมเดล
  - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้คอนฟิกเขียนทับ `models.json` ทั้งหมด
  - การบันทึก marker อ้างอิงแหล่งที่มาเป็นหลัก: markers จะถูกเขียนจาก snapshot คอนฟิกของแหล่งข้อมูลที่กำลังใช้งาน (ก่อนการ resolve) ไม่ใช่จากค่าความลับ runtime ที่ resolve แล้ว

### รายละเอียดฟิลด์ของผู้ให้บริการ

- `models.mode`: พฤติกรรม catalog ของผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: map ของผู้ให้บริการแบบกำหนดเองโดยใช้ provider id เป็นคีย์
  - การแก้ไขอย่างปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มรายการ `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`
- `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น)
- `models.providers.*.apiKey`: credentials ของผู้ให้บริการ (ควรใช้ SecretRef/env substitution)
- `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
- `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปใน requests (ค่าเริ่มต้น: `true`)
- `models.providers.*.authHeader`: บังคับส่ง credentials ใน header `Authorization` เมื่อจำเป็น
- `models.providers.*.baseUrl`: base URL ของ API ต้นทาง
- `models.providers.*.headers`: headers แบบ static เพิ่มเติมสำหรับ proxy/tenant routing
- `models.providers.*.request`: overrides การขนส่งสำหรับคำขอ HTTP ของ model-provider
  - `request.headers`: headers เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) ค่ารองรับ SecretRef
  - `request.auth`: override กลยุทธ์ auth โหมด: `"provider-default"` (ใช้ auth ในตัวของ provider), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, และ `prefix` แบบไม่บังคับ)
  - `request.proxy`: override HTTP proxy โหมด: `"env-proxy"` (ใช้ env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบไม่บังคับ
  - `request.tls`: override TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
  - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยัง private, CGNAT หรือช่วงที่คล้ายกัน ผ่านตัวป้องกัน HTTP fetch ของ provider (operator opt-in สำหรับ trusted self-hosted endpoints ที่เข้ากันได้กับ OpenAI) WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ SSRF gate ของ fetch นั้น ค่าเริ่มต้น `false`
- `models.providers.*.models`: รายการ catalog โมเดลของผู้ให้บริการแบบ explicit
- `models.providers.*.models.*.contextWindow`: metadata ของ native model context window
- `models.providers.*.models.*.contextTokens`: runtime context cap แบบไม่บังคับ ใช้เมื่อคุณต้องการ effective context budget ที่เล็กกว่า `contextWindow` ดั้งเดิมของโมเดล
- `models.providers.*.models.*.compat.supportsDeveloperRole`: compatibility hint แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบ non-native ไม่ว่าง (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับให้เป็น `false` ใน runtime ค่า `baseUrl` ที่ว่างหรือไม่ระบุจะคงพฤติกรรม OpenAI เริ่มต้นไว้
- `models.providers.*.models.*.compat.requiresStringContent`: compatibility hint แบบไม่บังคับสำหรับ chat endpoints ที่เข้ากันได้กับ OpenAI และรองรับเฉพาะ string เมื่อเป็น `true` OpenClaw จะ flatten `messages[].content` arrays ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
- `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่า auto-discovery ของ Bedrock
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS region สำหรับ discovery
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับ targeted discovery
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลา polling สำหรับรีเฟรช discovery
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window สำรองสำหรับโมเดลที่ค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: max output tokens สำรองสำหรับโมเดลที่ค้นพบ

### ตัวอย่างผู้ให้บริการ

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras; ใช้ `zai/glm-4.7` สำหรับ Z.AI โดยตรง

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับ Zen catalog หรือ refs แบบ `opencode-go/...` สำหรับ Go catalog ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

ตั้งค่า `ZAI_API_KEY` รองรับ aliases `z.ai/*` และ `z-ai/*` ทางลัด: `openclaw onboard --auth-choice zai-api-key`

- endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
- endpoint สำหรับงานโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
- สำหรับ endpoint ทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อม override base URL

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

สำหรับ endpoint ในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

endpoints ของ Moonshot แบบ native จะโฆษณาความเข้ากันได้ของ streaming usage บน transport
`openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะอิงสิ่งนั้นจากความสามารถของ endpoint
แทนที่จะอิงจาก built-in provider id เพียงอย่างเดียว

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

เข้ากันได้กับ Anthropic, เป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

</Accordion>

<Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL ควรละ `/v1` ออก (ไคลเอนต์ Anthropic จะเติมให้เอง) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ตั้งค่า `MINIMAX_API_KEY` ทางลัด:
`openclaw onboard --auth-choice minimax-global-api` หรือ
`openclaw onboard --auth-choice minimax-cn-api`
catalog โมเดลจะตั้งค่าเริ่มต้นเป็น M2.7 เท่านั้น
บนเส้นทางสตรีมแบบเข้ากันได้กับ Anthropic OpenClaw จะปิดการคิดของ MiniMax
เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน `/fast on` หรือ
`params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น
`MiniMax-M2.7-highspeed`

</Accordion>

<Accordion title="โมเดลในเครื่อง (LM Studio)">

ดู [โมเดลในเครื่อง](/th/gateway/local-models) สรุปสั้น ๆ: รันโมเดลในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง; คงโมเดลที่โฮสต์ไว้ให้ merge อยู่เพื่อใช้เป็น fallback

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่น ๆ
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [Tools และ Plugins](/th/tools)
