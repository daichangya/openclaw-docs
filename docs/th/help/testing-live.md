---
read_when:
    - การรันเมทริกซ์โมเดลแบบ Live / การทดสอบแบบ smoke สำหรับแบ็กเอนด์ CLI / ACP / ผู้ให้บริการสื่อ
    - การดีบักการ resolve ข้อมูลรับรองของการทดสอบแบบ Live
    - การเพิ่มการทดสอบแบบ Live ใหม่ที่เฉพาะกับ provider
sidebarTitle: Live tests
summary: 'การทดสอบแบบ Live (แตะเครือข่ายจริง): เมทริกซ์ของโมเดล, แบ็กเอนด์ CLI, ACP, ผู้ให้บริการสื่อ, ข้อมูลรับรอง'
title: 'การทดสอบ: ชุดทดสอบแบบ Live'
x-i18n:
    generated_at: "2026-04-24T09:15:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

สำหรับการเริ่มต้นอย่างรวดเร็ว, ตัวรัน QA, ชุดทดสอบ unit/integration และ flow แบบ Docker โปรดดู
[การทดสอบ](/th/help/testing) หน้านี้ครอบคลุมชุดทดสอบแบบ **Live** (แตะเครือข่ายจริง):
เมทริกซ์ของโมเดล, แบ็กเอนด์ CLI, ACP และการทดสอบแบบ Live ของผู้ให้บริการสื่อ รวมถึง
การจัดการข้อมูลรับรอง

## Live: การกวาด capabilities ของ Android node

- การทดสอบ: `src/gateway/android-node.capabilities.live.test.ts`
- สคริปต์: `pnpm android:test:integration`
- เป้าหมาย: เรียกใช้ **ทุกคำสั่งที่ Android node ที่เชื่อมต่ออยู่ประกาศรองรับอยู่ในปัจจุบัน** และยืนยันลักษณะการทำงานตามสัญญาของคำสั่ง
- ขอบเขต:
  - มีการเตรียมสภาพก่อนหน้า/ตั้งค่าด้วยมือ (ชุดทดสอบนี้ไม่ติดตั้ง/รัน/จับคู่แอปให้)
  - การตรวจสอบ `node.invoke` ของ gateway แบบทีละคำสั่งสำหรับ Android node ที่เลือก
- การตั้งค่าล่วงหน้าที่จำเป็น:
  - แอป Android เชื่อมต่อและจับคู่กับ gateway แล้ว
  - แอปต้องเปิดค้างไว้ใน foreground
  - ต้องให้สิทธิ์/ยอมรับการจับภาพสำหรับ capabilities ที่คุณคาดว่าจะผ่าน
- การ override เป้าหมายแบบไม่บังคับ:
  - `OPENCLAW_ANDROID_NODE_ID` หรือ `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- รายละเอียดการตั้งค่า Android แบบเต็ม: [แอป Android](/th/platforms/android)

## Live: model smoke (profile keys)

การทดสอบแบบ Live ถูกแยกเป็น 2 ชั้นเพื่อให้แยกสาเหตุของความล้มเหลวได้:

- “Direct model” บอกเราได้ว่า provider/model สามารถตอบได้จริงหรือไม่ด้วยคีย์ที่ให้มา
- “Gateway smoke” บอกเราได้ว่า pipeline เต็มของ gateway+agent ทำงานกับโมเดลนั้นได้ (sessions, history, tools, sandbox policy เป็นต้น)

### ชั้นที่ 1: Direct model completion (ไม่มี gateway)

- การทดสอบ: `src/agents/models.profiles.live.test.ts`
- เป้าหมาย:
  - แสดงรายการโมเดลที่ค้นพบ
  - ใช้ `getApiKeyForModel` เพื่อเลือกโมเดลที่คุณมีข้อมูลรับรอง
  - รัน completion ขนาดเล็กต่อหนึ่งโมเดล (และ regression แบบเจาะจงเมื่อจำเป็น)
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- ตั้ง `OPENCLAW_LIVE_MODELS=modern` (หรือ `all`, ซึ่งเป็น alias ของ modern) เพื่อให้รันชุดนี้จริง มิฉะนั้นระบบจะข้ามเพื่อให้ `pnpm test:live` โฟกัสกับ gateway smoke
- วิธีเลือกโมเดล:
  - `OPENCLAW_LIVE_MODELS=modern` เพื่อรัน allowlist แบบ modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` เป็น alias ของ modern allowlist
  - หรือ `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist แบบคั่นด้วยจุลภาค)
  - การกวาดแบบ modern/all จะจำกัดไว้ที่ชุดสัญญาณสูงที่คัดไว้ตามค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_MAX_MODELS=0` เพื่อกวาด modern แบบครบทั้งหมด หรือใช้ค่าบวกเพื่อลดจำนวน
  - การกวาดแบบครบทั้งหมดจะใช้ `OPENCLAW_LIVE_TEST_TIMEOUT_MS` เป็น timeout ของการทดสอบ direct-model ทั้งชุด ค่าเริ่มต้น: 60 นาที
  - direct-model probes รันแบบขนาน 20 รายการตามค่าเริ่มต้น; ใช้ `OPENCLAW_LIVE_MODEL_CONCURRENCY` เพื่อ override
- วิธีเลือก providers:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist แบบคั่นด้วยจุลภาค)
- คีย์มาจากที่ใด:
  - ตามค่าเริ่มต้น: profile store และ env fallbacks
  - ตั้ง `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับให้ใช้ **profile store** เท่านั้น
- เหตุผลที่มีชุดนี้:
  - แยก “provider API เสีย / คีย์ไม่ถูกต้อง” ออกจาก “gateway agent pipeline เสีย”
  - บรรจุ regression ขนาดเล็กแบบแยกขาด (ตัวอย่าง: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### ชั้นที่ 2: Gateway + dev agent smoke (สิ่งที่ "@openclaw" ทำจริง)

- การทดสอบ: `src/gateway/gateway-models.profiles.live.test.ts`
- เป้าหมาย:
  - สร้าง in-process gateway ขึ้นมา
  - สร้าง/แพตช์ session `agent:dev:*` (override โมเดลต่อการรัน)
  - วนผ่านโมเดลที่มีคีย์และยืนยันว่า:
    - มีการตอบกลับที่ “มีความหมาย” (ไม่ใช้ tools)
    - การเรียกใช้เครื่องมือจริงทำงานได้ (read probe)
    - มี extra tool probes แบบไม่บังคับ (exec+read probe)
    - เส้นทาง regression ของ OpenAI (tool-call-only → follow-up) ยังคงทำงาน
- รายละเอียดของ probe (เพื่อให้คุณอธิบายความล้มเหลวได้เร็ว):
  - `read` probe: การทดสอบจะเขียนไฟล์ nonce ลงใน workspace แล้วขอให้เอเจนต์ `read` ไฟล์นั้นและ echo nonce กลับมา
  - `exec+read` probe: การทดสอบจะขอให้เอเจนต์ใช้ `exec` เขียน nonce ลงไฟล์ชั่วคราว แล้ว `read` กลับมา
  - image probe: การทดสอบจะแนบ PNG ที่สร้างขึ้น (แมว + โค้ดสุ่ม) และคาดว่าโมเดลจะตอบ `cat <CODE>`
  - อ้างอิงการทำงาน: `src/gateway/gateway-models.profiles.live.test.ts` และ `src/gateway/live-image-probe.ts`
- วิธีเปิดใช้งาน:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
- วิธีเลือกโมเดล:
  - ค่าเริ่มต้น: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` เป็น alias ของ modern allowlist
  - หรือกำหนด `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (หรือรายการคั่นด้วยจุลภาค) เพื่อจำกัดขอบเขต
  - การกวาด gateway แบบ modern/all จะจำกัดไว้ที่ชุดสัญญาณสูงที่คัดไว้ตามค่าเริ่มต้น; ตั้ง `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` เพื่อกวาด modern แบบครบทั้งหมด หรือใช้ค่าบวกเพื่อลดจำนวน
- วิธีเลือก providers (หลีกเลี่ยง “OpenRouter ทุกอย่าง”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist แบบคั่นด้วยจุลภาค)
- tool + image probes เปิดอยู่เสมอใน live test นี้:
  - `read` probe + `exec+read` probe (ทดสอบความเครียดของเครื่องมือ)
  - image probe จะรันเมื่อโมเดลประกาศว่ารองรับ image input
  - Flow (ระดับสูง):
    - การทดสอบสร้าง PNG ขนาดเล็กที่มี “CAT” + โค้ดสุ่ม (`src/gateway/live-image-probe.ts`)
    - ส่งผ่าน `agent` ด้วย `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway แปลง attachments เป็น `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent ส่ง multimodal user message ต่อไปยังโมเดล
    - การยืนยัน: คำตอบต้องมี `cat` + โค้ดนั้น (ทนต่อ OCR ที่ผิดเล็กน้อยได้)

เคล็ดลับ: หากต้องการดูว่าคุณทดสอบอะไรได้บ้างบนเครื่องของคุณ (และ `provider/model` ids ที่แน่นอน) ให้รัน:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini หรือ CLIs แบบโลคัลอื่น ๆ)

- การทดสอบ: `src/gateway/gateway-cli-backend.live.test.ts`
- เป้าหมาย: ตรวจสอบ pipeline ของ Gateway + agent โดยใช้ CLI backend แบบโลคัล โดยไม่แตะ config เริ่มต้นของคุณ
- ค่าเริ่มต้นของ smoke เฉพาะ backend อยู่กับ `cli-backend.ts` ของส่วนขยายเจ้าของ
- เปิดใช้:
  - `pnpm test:live` (หรือ `OPENCLAW_LIVE_TEST=1` หากเรียก Vitest โดยตรง)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- ค่าเริ่มต้น:
  - provider/model เริ่มต้น: `claude-cli/claude-sonnet-4-6`
  - พฤติกรรม command/args/image มาจาก metadata ของ plugin CLI backend เจ้าของ
- Overrides (ไม่บังคับ):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` เพื่อส่ง image attachment จริง (paths จะถูกฉีดเข้าไปในพรอมป์ต์)
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` เพื่อส่ง paths ของไฟล์ภาพเป็น CLI args แทนการฉีดในพรอมป์ต์
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (หรือ `"list"`) เพื่อควบคุมวิธีส่ง image args เมื่อมีการตั้ง `IMAGE_ARG`
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` เพื่อส่งเทิร์นที่สองและตรวจสอบ flow การ resume
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` เพื่อปิด Claude Sonnet -> Opus same-session continuity probe ที่เปิดเป็นค่าเริ่มต้น (ตั้งเป็น `1` เพื่อบังคับเปิดเมื่อโมเดลที่เลือกมีเป้าหมายสำหรับสลับได้)

ตัวอย่าง:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

สูตรแบบ Docker:

```bash
pnpm test:docker:live-cli-backend
```

สูตร Docker แบบผู้ให้บริการเดียว:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

หมายเหตุ:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-cli-backend-docker.sh`
- มันรัน live CLI-backend smoke ภายใน image Docker ของรีโปในฐานะผู้ใช้ `node` ที่ไม่ใช่ root
- มัน resolve metadata ของ CLI smoke จากส่วนขยายเจ้าของ จากนั้นติดตั้งแพ็กเกจ Linux CLI ที่ตรงกัน (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) ลงใน prefix ที่เขียนได้และมีแคชไว้ที่ `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`)
- `pnpm test:docker:live-cli-backend:claude-subscription` ต้องใช้ portable Claude Code subscription OAuth ผ่านอย่างใดอย่างหนึ่งคือ `~/.claude/.credentials.json` ที่มี `claudeAiOauth.subscriptionType` หรือ `CLAUDE_CODE_OAUTH_TOKEN` จาก `claude setup-token` มันจะพิสูจน์ก่อนว่า `claude -p` ใช้งานได้ใน Docker แล้วจึงรัน Gateway CLI-backend สองเทิร์นโดยไม่เก็บ env vars ของ Anthropic API-key ไว้ lane แบบ subscription นี้จะปิด Claude MCP/tool และ image probes ตามค่าเริ่มต้น เพราะปัจจุบัน Claude คิดค่าบริการการใช้งานแอปของบุคคลที่สามผ่าน extra-usage billing แทนขีดจำกัดของแผน subscription ปกติ
- ตอนนี้ live CLI-backend smoke ทดสอบ flow แบบ end-to-end เดียวกันสำหรับ Claude, Codex และ Gemini: เทิร์นข้อความ, เทิร์นจำแนกรูปภาพ จากนั้นเรียกเครื่องมือ MCP `cron` และตรวจสอบผ่าน gateway CLI
- smoke เริ่มต้นของ Claude ยังแพตช์ session จาก Sonnet ไปเป็น Opus และตรวจสอบว่า session ที่ resume แล้วยังคงจำโน้ตก่อนหน้าได้

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- การทดสอบ: `src/gateway/gateway-acp-bind.live.test.ts`
- เป้าหมาย: ตรวจสอบ flow การ bind บทสนทนา ACP จริงกับ ACP agent แบบ live:
  - ส่ง `/acp spawn <agent> --bind here`
  - bind บทสนทนาของ synthetic message-channel ให้อยู่กับที่
  - ส่ง follow-up ปกติบนบทสนทนาเดียวกันนั้น
  - ตรวจสอบว่า follow-up ไปถึง transcript ของ ACP session ที่ bind ไว้
- เปิดใช้:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- ค่าเริ่มต้น:
  - ACP agents ใน Docker: `claude,codex,gemini`
  - ACP agent สำหรับ `pnpm test:live ...` โดยตรง: `claude`
  - Synthetic channel: บริบทบทสนทนาแบบ Slack DM
  - ACP backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- หมายเหตุ:
  - lane นี้ใช้พื้นผิว `chat.send` ของ gateway พร้อมฟิลด์ originating-route แบบสังเคราะห์ที่ใช้ได้เฉพาะผู้ดูแล เพื่อให้การทดสอบแนบบริบทของ message-channel ได้โดยไม่แสร้งว่ากำลังส่งออกภายนอกจริง
  - เมื่อไม่ได้ตั้ง `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` การทดสอบจะใช้รีจิสทรี agent ในตัวของ plugin `acpx` แบบฝังสำหรับ ACP harness agent ที่เลือก

ตัวอย่าง:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

สูตรแบบ Docker:

```bash
pnpm test:docker:live-acp-bind
```

สูตร Docker แบบเอเจนต์เดียว:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-acp-bind-docker.sh`
- ตามค่าเริ่มต้น มันจะรัน ACP bind smoke กับ live CLI agents ที่รองรับทั้งหมดตามลำดับ: `claude`, `codex`, แล้ว `gemini`
- ใช้ `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` หรือ `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` เพื่อจำกัดเมทริกซ์
- มันจะ source `~/.profile`, จัดเตรียมข้อมูล auth ของ CLI ที่ตรงกันเข้าไปในคอนเทนเนอร์, ติดตั้ง `acpx` ลงใน npm prefix ที่เขียนได้ จากนั้นจึงติดตั้ง live CLI ที่ร้องขอ (`@anthropic-ai/claude-code`, `@openai/codex` หรือ `@google/gemini-cli`) หากยังไม่มี
- ภายใน Docker ตัวรันจะตั้ง `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` เพื่อให้ acpx ยังคงมี env vars ของ provider จาก profile ที่ source มาใช้ได้สำหรับ child harness CLI

## Live: Codex app-server harness smoke

- เป้าหมาย: ตรวจสอบ Codex harness ที่เป็นของ Plugin ผ่านเมธอด `agent` ปกติของ gateway:
  - โหลด Plugin `codex` ที่มาพร้อมระบบ
  - เลือก `OPENCLAW_AGENT_RUNTIME=codex`
  - ส่ง gateway agent turn แรกไปยัง `openai/gpt-5.2` โดยบังคับใช้ Codex harness
  - ส่ง turn ที่สองไปยัง OpenClaw session เดียวกัน และตรวจสอบว่า app-server
    thread สามารถ resume ได้
  - รัน `/codex status` และ `/codex models` ผ่านเส้นทางคำสั่งของ gateway เดียวกัน
  - รัน Guardian-reviewed escalated shell probes แบบไม่บังคับ 2 รายการ: คำสั่งที่ไม่อันตราย
    หนึ่งรายการซึ่งควรได้รับอนุมัติ และการอัปโหลด fake-secret หนึ่งรายการที่ควรถูก
    ปฏิเสธเพื่อให้เอเจนต์ถามกลับ
- การทดสอบ: `src/gateway/gateway-codex-harness.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- โมเดลเริ่มต้น: `openai/gpt-5.2`
- image probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- MCP/tool probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Guardian probe แบบไม่บังคับ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke นี้ตั้ง `OPENCLAW_AGENT_HARNESS_FALLBACK=none` เพื่อไม่ให้ Codex
  harness ที่เสียแล้วผ่านได้โดย fallback ไปยัง PI แบบเงียบ ๆ
- Auth: ใช้ Codex app-server auth จากการล็อกอิน Codex subscription แบบโลคัล Docker
  smokes ยังสามารถให้ `OPENAI_API_KEY` สำหรับ probes ที่ไม่ใช่ Codex เมื่อเกี่ยวข้องได้
  รวมถึง `~/.codex/auth.json` และ `~/.codex/config.toml` ที่คัดลอกมาแบบไม่บังคับ

สูตรแบบโลคัล:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

สูตรแบบ Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

หมายเหตุสำหรับ Docker:

- ตัวรัน Docker อยู่ที่ `scripts/test-live-codex-harness-docker.sh`
- มันจะ source `~/.profile` ที่ mount เข้ามา, ส่ง `OPENAI_API_KEY`, คัดลอกไฟล์ auth ของ Codex CLI เมื่อมี, ติดตั้ง `@openai/codex` ลงใน npm prefix ที่เขียนได้และถูก mount, จัดเตรียม source tree แล้วจึงรันเฉพาะการทดสอบ Codex-harness แบบ live
- Docker จะเปิด image, MCP/tool และ Guardian probes ตามค่าเริ่มต้น ตั้ง
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` หรือ
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` เมื่อต้องการรันดีบักที่แคบลง
- Docker ยังส่งออก `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ด้วย ซึ่งตรงกับ config ของ live
  test เพื่อไม่ให้ legacy aliases หรือ PI fallback ซ่อน regression ของ Codex harness

### สูตร live ที่แนะนำ

allowlists ที่แคบและชัดเจนจะเร็วที่สุดและมีโอกาสสะดุดน้อยที่สุด:

- โมเดลเดียว, direct (ไม่มี gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- โมเดลเดียว, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- การเรียกใช้เครื่องมือข้ามหลาย providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- โฟกัส Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

หมายเหตุ:

- `google/...` ใช้ Gemini API (API key)
- `google-antigravity/...` ใช้ Antigravity OAuth bridge (ปลายทาง agent แบบ Cloud Code Assist)
- `google-gemini-cli/...` ใช้ Gemini CLI แบบโลคัลบนเครื่องของคุณ (มี auth + ความแปลกของ tooling แยกต่างหาก)
- Gemini API เทียบกับ Gemini CLI:
  - API: OpenClaw เรียก Gemini API ที่ Google โฮสต์ผ่าน HTTP (API key / profile auth); นี่คือสิ่งที่ผู้ใช้ส่วนใหญ่หมายถึงเมื่อพูดว่า “Gemini”
  - CLI: OpenClaw เรียกไบนารี `gemini` แบบโลคัลผ่าน shell; มี auth ของตัวเองและอาจมีพฤติกรรมต่างออกไป (streaming/tool support/version skew)

## Live: เมทริกซ์ของโมเดล (สิ่งที่เราครอบคลุม)

ไม่มี “รายการโมเดลของ CI” แบบตายตัว (live เป็นแบบ opt-in) แต่ต่อไปนี้คือโมเดลที่ **แนะนำ** ให้ครอบคลุมเป็นประจำบนเครื่อง dev ที่มีคีย์

### ชุด smoke แบบ modern (tool calling + image)

นี่คือการรัน “โมเดลทั่วไป” ที่เราคาดว่าจะยังทำงานได้ต่อไป:

- OpenAI (ไม่ใช่ Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` และ `google/gemini-3-flash-preview` (หลีกเลี่ยง Gemini 2.x รุ่นเก่า)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` และ `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

รัน gateway smoke พร้อม tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ค่าพื้นฐาน: tool calling (Read + Exec แบบไม่บังคับ)

เลือกอย่างน้อยหนึ่งรายการต่อ provider family:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (หรือ `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (หรือ `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ความครอบคลุมเพิ่มเติมแบบไม่บังคับ (มีก็ดี):

- xAI: `xai/grok-4` (หรือรุ่นล่าสุดที่มี)
- Mistral: `mistral/`… (เลือกโมเดลที่รองรับ “tools” สักหนึ่งตัวที่คุณเปิดใช้ไว้)
- Cerebras: `cerebras/`… (หากคุณเข้าถึงได้)
- LM Studio: `lmstudio/`… (โลคัล; การเรียกใช้เครื่องมือขึ้นอยู่กับโหมด API)

### Vision: การส่งภาพ (attachment → multimodal message)

ควรรวมโมเดลที่รองรับภาพอย่างน้อยหนึ่งตัวไว้ใน `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI รุ่นที่รองรับ vision เป็นต้น) เพื่อทดสอบ image probe

### Aggregators / alternate gateways

หากคุณเปิดใช้คีย์ไว้ เรารองรับการทดสอบผ่าน:

- OpenRouter: `openrouter/...` (หลายร้อยโมเดล; ใช้ `openclaw models scan` เพื่อหา candidates ที่รองรับ tool+image)
- OpenCode: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go (auth ผ่าน `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providers เพิ่มเติมที่คุณสามารถรวมใน live matrix ได้ (หากมี creds/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- ผ่าน `models.providers` (ปลายทางแบบกำหนดเอง): `minimax` (cloud/API) รวมถึงพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic ใด ๆ (LM Studio, vLLM, LiteLLM เป็นต้น)

เคล็ดลับ: อย่าพยายาม hardcode “ทุกโมเดล” ลงในเอกสาร รายการที่เป็นข้อมูลอ้างอิงจริงคือสิ่งที่ `discoverModels(...)` คืนค่าบนเครื่องของคุณ + คีย์ที่ใช้งานได้จริง

## ข้อมูลรับรอง (ห้าม commit)

การทดสอบแบบ Live ค้นหาข้อมูลรับรองแบบเดียวกับที่ CLI ทำ ผลที่ตามมาในทางปฏิบัติ:

- หาก CLI ทำงานได้ การทดสอบแบบ Live ก็ควรหาคีย์เดียวกันเจอ
- หากการทดสอบแบบ Live บอกว่า “no creds” ให้ดีบักแบบเดียวกับที่คุณดีบัก `openclaw models list` / การเลือกโมเดล

- auth profiles รายเอเจนต์: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (นี่คือความหมายของ “profile keys” ใน live tests)
- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- state dir แบบเดิม: `~/.openclaw/credentials/` (จะถูกคัดลอกเข้า staged live home เมื่อมี แต่ไม่ใช่แหล่งเก็บ profile-key หลัก)
- การรัน live แบบโลคัลจะคัดลอก active config, ไฟล์ `auth-profiles.json` รายเอเจนต์, `credentials/` แบบเดิม และไดเรกทอรี auth ของ CLI ภายนอกที่รองรับ ไปยัง temp test home ตามค่าเริ่มต้น; staged live homes จะข้าม `workspace/` และ `sandboxes/` และจะตัด overrides ของ path อย่าง `agents.*.workspace` / `agentDir` ออก เพื่อให้ probes ไม่แตะ workspace จริงของโฮสต์คุณ

หากคุณต้องการพึ่งพาคีย์จาก env (เช่น ที่ export ไว้ใน `~/.profile`) ให้รันการทดสอบแบบโลคัลหลัง `source ~/.profile` หรือใช้ตัวรัน Docker ด้านล่าง (สามารถ mount `~/.profile` เข้าไปในคอนเทนเนอร์ได้)

## Deepgram live (การถอดเสียงจากเสียง)

- การทดสอบ: `extensions/deepgram/audio.live.test.ts`
- เปิดใช้: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- การทดสอบ: `extensions/byteplus/live.test.ts`
- เปิดใช้: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- override โมเดลแบบไม่บังคับ: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- การทดสอบ: `extensions/comfy/comfy.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- ขอบเขต:
  - ทดสอบเส้นทาง image, video และ `music_generate` ของ comfy ที่มาพร้อมระบบ
  - ข้ามแต่ละ capability เว้นแต่จะมีการกำหนดค่า `models.providers.comfy.<capability>`
  - มีประโยชน์หลังจากเปลี่ยน workflow submission, polling, downloads หรือการลงทะเบียน plugin ของ comfy

## Image generation live

- การทดสอบ: `test/image-generation.runtime.live.test.ts`
- คำสั่ง: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- ขอบเขต:
  - แสดงรายการทุก Plugin ผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้
  - โหลด env vars ของผู้ให้บริการที่ขาดหายจาก login shell ของคุณ (`~/.profile`) ก่อน probing
  - ใช้ live/env API keys ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบังคีย์จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รัน image-generation variants มาตรฐานผ่าน runtime capability ที่ใช้ร่วมกัน:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- ผู้ให้บริการแบบ bundled ที่ครอบคลุมในปัจจุบัน:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- ลักษณะการทำงานด้าน auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่ใช้ env-only overrides

## Music generation live

- การทดสอบ: `extensions/music-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
  - ปัจจุบันครอบคลุม Google และ MiniMax
  - โหลด env vars ของผู้ให้บริการจาก login shell (`~/.profile`) ก่อน probing
  - ใช้ live/env API keys ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบังคีย์จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันทั้งสอง runtime modes ที่ประกาศไว้เมื่อมี:
    - `generate` ด้วยอินพุตแบบ prompt-only
    - `edit` เมื่อผู้ให้บริการประกาศ `capabilities.edit.enabled`
  - ความครอบคลุมของ shared lane ในปัจจุบัน:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ใช้ไฟล์ live ของ Comfy แยกต่างหาก ไม่รวมอยู่ในการกวาดนี้
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- ลักษณะการทำงานด้าน auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่ใช้ env-only overrides

## Video generation live

- การทดสอบ: `extensions/video-generation-providers.live.test.ts`
- เปิดใช้: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- ขอบเขต:
  - ทดสอบเส้นทางผู้ให้บริการสร้างวิดีโอแบบ bundled ที่ใช้ร่วมกัน
  - ค่าเริ่มต้นใช้เส้นทาง smoke ที่ปลอดภัยสำหรับการปล่อย: ผู้ให้บริการที่ไม่ใช่ FAL, หนึ่งคำขอ text-to-video ต่อ provider, พรอมป์ต์กุ้งล็อบสเตอร์หนึ่งวินาที และเพดานเวลาการดำเนินการต่อ provider จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)
  - ข้าม FAL ตามค่าเริ่มต้น เพราะ latency ของคิวฝั่ง provider อาจครอบเวลา release; ส่ง `--video-providers fal` หรือ `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` หากต้องการรันอย่างชัดเจน
  - โหลด env vars ของผู้ให้บริการจาก login shell (`~/.profile`) ก่อน probing
  - ใช้ live/env API keys ก่อน stored auth profiles ตามค่าเริ่มต้น เพื่อไม่ให้ test keys เก่าที่ค้างใน `auth-profiles.json` มาบดบังคีย์จริงจาก shell
  - ข้าม providers ที่ไม่มี auth/profile/model ที่ใช้ได้
  - รันเฉพาะ `generate` ตามค่าเริ่มต้น
  - ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform modes ที่ประกาศไว้ด้วยเมื่อมี:
    - `imageToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.imageToVideo.enabled` และ provider/model ที่เลือกยอมรับ local image input แบบ buffer-backed ใน shared sweep
    - `videoToVideo` เมื่อผู้ให้บริการประกาศ `capabilities.videoToVideo.enabled` และ provider/model ที่เลือกยอมรับ local video input แบบ buffer-backed ใน shared sweep
  - ผู้ให้บริการ `imageToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `vydra` เพราะ `veo3` ที่ bundled มาเป็น text-only และ `kling` ที่ bundled มาต้องใช้ remote image URL
  - ความครอบคลุมเฉพาะผู้ให้บริการ Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ไฟล์นั้นจะรัน `veo3` แบบ text-to-video รวมถึง lane ของ `kling` ที่ใช้ remote image URL fixture ตามค่าเริ่มต้น
  - ความครอบคลุม `videoToVideo` แบบ live ในปัจจุบัน:
    - `runway` เท่านั้นเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`
  - ผู้ให้บริการ `videoToVideo` ที่ประกาศไว้แต่ถูกข้ามใน shared sweep ปัจจุบัน:
    - `alibaba`, `qwen`, `xai` เพราะเส้นทางเหล่านั้นปัจจุบันต้องใช้ remote reference URLs แบบ `http(s)` / MP4
    - `google` เพราะ shared Gemini/Veo lane ปัจจุบันใช้ input แบบ local buffer-backed และเส้นทางนั้นไม่ถูกยอมรับใน shared sweep
    - `openai` เพราะ shared lane ปัจจุบันยังไม่มีการรับประกันการเข้าถึงวิดีโอ inpaint/remix แบบเฉพาะองค์กร
- การจำกัดขอบเขตแบบไม่บังคับ:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` เพื่อรวมทุก provider ใน default sweep รวมถึง FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` เพื่อลดเพดานเวลาการดำเนินการของแต่ละ provider สำหรับ smoke run แบบเข้มข้น
- ลักษณะการทำงานด้าน auth แบบไม่บังคับ:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อบังคับใช้ auth จาก profile-store และไม่ใช้ env-only overrides

## Media live harness

- คำสั่ง: `pnpm test:live:media`
- จุดประสงค์:
  - รันชุด live แบบ image, music และ video ที่ใช้ร่วมกันผ่าน entrypoint แบบ repo-native เดียว
  - โหลด provider env vars ที่ขาดหายจาก `~/.profile` อัตโนมัติ
  - จำกัดขอบเขตของแต่ละ suite ไปยัง providers ที่ปัจจุบันมี auth ที่ใช้งานได้โดยอัตโนมัติตามค่าเริ่มต้น
  - ใช้ `scripts/test-live.mjs` ร่วมกัน ดังนั้นลักษณะการทำงานของ heartbeat และ quiet-mode จึงสม่ำเสมอ
- ตัวอย่าง:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing) — ชุดทดสอบ unit, integration, QA และ Docker
