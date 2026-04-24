---
read_when:
    - คุณกำลังเชื่อมต่อพฤติกรรมวงจรชีวิตของ context-engine เข้ากับ Codex harness
    - คุณต้องการให้ lossless-claw หรือ Plugin context-engine อื่นทำงานกับเซสชัน embedded harness แบบ codex/*
    - คุณกำลังเปรียบเทียบพฤติกรรม context ของ embedded PI และ Codex app-server
summary: ข้อกำหนดสำหรับทำให้ bundled Codex app-server harness เคารพ Plugins ของ context-engine ของ OpenClaw
title: พอร์ตของ Codex Harness Context Engine
x-i18n:
    generated_at: "2026-04-24T09:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# พอร์ตของ Codex Harness Context Engine

## สถานะ

ข้อกำหนดการติดตั้งใช้งานฉบับร่าง

## เป้าหมาย

ทำให้ bundled Codex app-server harness เคารพสัญญาวงจรชีวิตของ context-engine ของ OpenClaw
แบบเดียวกับที่ embedded PI turns เคารพอยู่แล้ว

เซสชันที่ใช้ `agents.defaults.embeddedHarness.runtime: "codex"` หรือ
โมเดล `codex/*` ควรยังคงทำให้ Plugin context-engine ที่เลือก เช่น
`lossless-claw` สามารถควบคุมการประกอบ context, การ ingest หลังจบเทิร์น, maintenance และ
นโยบาย Compaction ระดับ OpenClaw ได้ เท่าที่ขอบเขตของ Codex app-server อนุญาต

## สิ่งที่ไม่ใช่เป้าหมาย

- ห้าม reimplement internals ของ Codex app-server
- ห้ามทำให้ native thread compaction ของ Codex สร้างสรุปแบบ lossless-claw
- ห้ามบังคับให้โมเดลที่ไม่ใช่ Codex ต้องใช้ Codex harness
- ห้ามเปลี่ยนพฤติกรรมของเซสชัน ACP/acpx ข้อกำหนดนี้มีไว้สำหรับ
  เส้นทาง non-ACP embedded agent harness เท่านั้น
- ห้ามให้ Plugins จากภายนอกมาลงทะเบียน Codex app-server extension factories;
  ขอบเขตความเชื่อถือของ bundled-plugin ที่มีอยู่ยังคงเดิม

## สถาปัตยกรรมปัจจุบัน

ลูปการรันแบบ embedded จะ resolve context engine ที่กำหนดค่าไว้หนึ่งครั้งต่อการรัน ก่อนเลือก low-level harness ที่เป็นรูปธรรม:

- `src/agents/pi-embedded-runner/run.ts`
  - เริ่มต้น Plugins ของ context-engine
  - เรียก `resolveContextEngine(params.config)`
  - ส่ง `contextEngine` และ `contextTokenBudget` เข้าไปยัง
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` จะมอบหมายต่อไปยัง agent harness ที่เลือก:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness ถูกลงทะเบียนโดย Plugin Codex ที่มาพร้อมระบบ:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

การติดตั้งใช้งาน Codex harness จะรับ `EmbeddedRunAttemptParams` ชุดเดียวกัน
กับ PI-backed attempts:

- `extensions/codex/src/app-server/run-attempt.ts`

ซึ่งหมายความว่าจุด hook ที่ต้องใช้ อยู่ในโค้ดที่ OpenClaw ควบคุมได้
ขอบเขตภายนอกคือโปรโตคอลของ Codex app-server เอง: OpenClaw ควบคุมสิ่งที่ส่งไปยัง
`thread/start`, `thread/resume` และ `turn/start` ได้ และสังเกต notifications ได้
แต่ไม่สามารถเปลี่ยน internal thread store หรือ native compactor ของ Codex ได้

## ช่องว่างปัจจุบัน

Embedded PI attempts เรียกวงจรชีวิตของ context-engine โดยตรง:

- bootstrap/maintenance ก่อน attempt
- assemble ก่อนเรียกโมเดล
- afterTurn หรือ ingest หลัง attempt
- maintenance หลังเทิร์นที่สำเร็จ
- Compaction ของ context-engine สำหรับ engines ที่เป็นเจ้าของ Compaction เอง

โค้ด PI ที่เกี่ยวข้อง:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

ปัจจุบัน Codex app-server attempts รัน generic agent-harness hooks และ mirror
transcript แต่ไม่ได้เรียก `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` หรือ
`params.contextEngine.maintain`

โค้ด Codex ที่เกี่ยวข้อง:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## พฤติกรรมที่ต้องการ

สำหรับ Codex harness turns, OpenClaw ควรรักษาวงจรชีวิตนี้ไว้:

1. อ่าน mirrored OpenClaw session transcript
2. Bootstrap context engine ที่ใช้งานอยู่เมื่อมีไฟล์ session ก่อนหน้าอยู่แล้ว
3. รัน bootstrap maintenance เมื่อรองรับ
4. ประกอบ context โดยใช้ context engine ที่ใช้งานอยู่
5. แปลง context ที่ประกอบแล้วให้เป็นอินพุตที่เข้ากันได้กับ Codex
6. เริ่มหรือ resume Codex thread พร้อม developer instructions ที่รวม
   `systemPromptAddition` ของ context-engine หากมี
7. เริ่ม Codex turn ด้วย user-facing prompt ที่ประกอบแล้ว
8. mirror ผลลัพธ์ของ Codex กลับเข้า OpenClaw transcript
9. เรียก `afterTurn` ถ้ามีการติดตั้งไว้ มิฉะนั้นใช้ `ingestBatch`/`ingest` โดยใช้
   mirrored transcript snapshot
10. รัน turn maintenance หลังเทิร์นที่สำเร็จและไม่ถูกยกเลิก
11. รักษา native compaction signals ของ Codex และ Compaction hooks ของ OpenClaw

## ข้อจำกัดของการออกแบบ

### Codex app-server ยังคงเป็น canonical สำหรับ native thread state

Codex เป็นเจ้าของ native thread และ extended history ภายในใด ๆ OpenClaw ไม่ควร
พยายาม mutate internal history ของ app-server นอกจากผ่าน protocol calls ที่รองรับ

transcript mirror ของ OpenClaw ยังคงเป็นแหล่งข้อมูลสำหรับฟีเจอร์ของ OpenClaw:

- ประวัติแชต
- การค้นหา
- การทำบัญชีของ `/new` และ `/reset`
- การสลับโมเดลหรือ harness ในอนาคต
- สถานะของ Plugin context-engine

### การประกอบ context engine ต้องถูกฉายลงในอินพุตของ Codex

อินเทอร์เฟซของ context-engine คืนค่าเป็น `AgentMessage[]` ของ OpenClaw ไม่ใช่ Codex
thread patch ขณะที่ `turn/start` ของ Codex app-server รับ current user input และ
`thread/start` กับ `thread/resume` รับ developer instructions

ดังนั้น การติดตั้งใช้งานจึงต้องมีชั้น projection เวอร์ชันแรกที่ปลอดภัย
ควรหลีกเลี่ยงการแสร้งว่ามันสามารถแทนที่ internal history ของ Codex ได้ มันควรฉีด
context ที่ประกอบแล้วเป็น material ของ prompt/developer-instruction แบบกำหนดแน่นอนรอบ ๆ
เทิร์นปัจจุบัน

### ความเสถียรของ prompt-cache สำคัญ

สำหรับ engines อย่าง lossless-claw, context ที่ประกอบแล้วควรกำหนดแน่นอน
เมื่ออินพุตไม่เปลี่ยน ห้ามเพิ่ม timestamps, ids แบบสุ่ม หรือการเรียงลำดับแบบไม่กำหนดแน่นอนลงในข้อความ context ที่สร้างขึ้น

### ความหมายของ PI fallback ไม่เปลี่ยน

การเลือก harness ยังคงเป็นแบบเดิม:

- `runtime: "pi"` บังคับใช้ PI
- `runtime: "codex"` เลือก Codex harness ที่ลงทะเบียนไว้
- `runtime: "auto"` ให้ plugin harnesses อ้างสิทธิ์ providers ที่รองรับได้
- `fallback: "none"` ปิด PI fallback เมื่อไม่มี plugin harness ใดตรงเงื่อนไข

งานนี้เปลี่ยนเฉพาะสิ่งที่เกิดขึ้นหลังจากเลือก Codex harness แล้ว

## แผนการติดตั้งใช้งาน

### 1. ส่งออกหรือย้ายตัวช่วย context-engine attempt ที่นำกลับมาใช้ซ้ำได้

ทุกวันนี้ reusable lifecycle helpers อยู่ใต้ PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ไม่ควร import จากเส้นทาง implementation ที่ชื่อบ่งบอกว่าเป็น PI หาก
เราหลีกเลี่ยงได้

ให้สร้างโมดูลที่เป็นกลางต่อ harness เช่น:

- `src/agents/harness/context-engine-lifecycle.ts`

ย้ายหรือ re-export:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper ขนาดเล็กรอบ `runContextEngineMaintenance`

คงให้ imports ฝั่ง PI ยังทำงานได้ ไม่ว่าจะโดย re-export จากไฟล์เดิมหรืออัปเดต PI
call sites ใน PR เดียวกัน

ชื่อ helper ที่เป็นกลางไม่ควรกล่าวถึง PI

ชื่อที่แนะนำ:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. เพิ่มตัวช่วย Codex context projection

เพิ่มโมดูลใหม่:

- `extensions/codex/src/app-server/context-engine-projection.ts`

หน้าที่:

- รับ `AgentMessage[]` ที่ประกอบแล้ว, ประวัติ mirrored ดั้งเดิม และ
  prompt ปัจจุบัน
- ตัดสินว่า context ส่วนใดควรอยู่ใน developer instructions เทียบกับ current user
  input
- รักษา current user prompt ให้เป็นคำขอที่ลงมือทำจริงลำดับสุดท้าย
- render ข้อความก่อนหน้าในรูปแบบที่คงที่และชัดเจน
- หลีกเลี่ยง metadata ที่เปลี่ยนไปตามรัน

API ที่เสนอ:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

projection เวอร์ชันแรกที่แนะนำ:

- ใส่ `systemPromptAddition` ลงใน developer instructions
- ใส่ assembled transcript context ไว้ก่อน current prompt ใน `promptText`
- ติดป้ายให้ชัดว่าเป็น context ที่ OpenClaw ประกอบขึ้นสำหรับเทิร์นนี้
- ให้ current prompt อยู่ท้ายสุด
- ตัด current user prompt ที่ซ้ำออก หากมันปรากฏอยู่แล้วที่ส่วนท้าย

รูปแบบ prompt ตัวอย่าง:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

สิ่งนี้อาจไม่สวยเท่าการผ่าตัด native Codex history แต่สามารถติดตั้งใช้งานได้
ภายใน OpenClaw และรักษาความหมายของ context-engine ไว้

การปรับปรุงในอนาคต: หาก Codex app-server เปิดเผยโปรโตคอลสำหรับแทนที่หรือเสริม
thread history ให้สลับชั้น projection นี้ไปใช้ API นั้น

### 3. เชื่อม bootstrap ก่อนเริ่ม Codex thread

ใน `extensions/codex/src/app-server/run-attempt.ts`:

- อ่าน mirrored session history เหมือนปัจจุบัน
- ตรวจว่ามีไฟล์ session อยู่ก่อนรันนี้หรือไม่ ควรใช้ helper
  ที่ตรวจ `fs.stat(params.sessionFile)` ก่อนการ mirror writes
- เปิด `SessionManager` หรือใช้อะแดปเตอร์ session manager แบบแคบ หาก helper
  ต้องการ
- เรียก neutral bootstrap helper เมื่อมี `params.contextEngine`

pseudo-flow:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

ใช้รูปแบบ `sessionKey` เดียวกับที่ Codex tool bridge และ transcript
mirror ใช้อยู่ ปัจจุบัน Codex คำนวณ `sandboxSessionKey` จาก `params.sessionKey` หรือ
`params.sessionId`; ให้ใช้แบบนั้นอย่างสม่ำเสมอ เว้นแต่จะมีเหตุผลที่ต้องเก็บ `params.sessionKey` ดิบไว้

### 4. เชื่อม assemble ก่อน `thread/start` / `thread/resume` และ `turn/start`

ใน `runCodexAppServerAttempt`:

1. สร้าง dynamic tools ก่อน เพื่อให้ context engine มองเห็นชื่อเครื่องมือที่ใช้งานได้จริง
2. อ่าน mirrored session history
3. รัน context-engine `assemble(...)` เมื่อมี `params.contextEngine`
4. ฉายผลลัพธ์ที่ประกอบแล้วไปเป็น:
   - developer instruction addition
   - prompt text สำหรับ `turn/start`

การเรียก hook ที่มีอยู่:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

ควรถูกทำให้รับรู้ context ดังนี้:

1. คำนวณ developer instructions พื้นฐานด้วย `buildDeveloperInstructions(params)`
2. ใช้ context-engine assembly/projection
3. รัน `before_prompt_build` ด้วย prompt/developer instructions ที่ฉายแล้ว

ลำดับนี้ทำให้ generic prompt hooks มองเห็นพรอมป์ต์เดียวกับที่ Codex จะได้รับ หาก
เราต้องการความสอดคล้องแบบเข้มกับ PI ให้รัน context-engine assembly ก่อน hook composition
เพราะ PI ใช้ `systemPromptAddition` ของ context-engine กับ system prompt สุดท้ายหลังจาก prompt pipeline ของตัวเองแล้ว invariant ที่สำคัญคือ ทั้ง context
engine และ hooks ต้องได้ลำดับที่กำหนดแน่นอนและมีเอกสารกำกับ

ลำดับที่แนะนำสำหรับ implementation แรก:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. append/prepend `systemPromptAddition` ไปยัง developer instructions
4. project assembled messages ลงใน prompt text
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. ส่ง developer instructions สุดท้ายไปยัง `startOrResumeThread(...)`
7. ส่ง prompt text สุดท้ายไปยัง `buildTurnStartParams(...)`

ข้อกำหนดนี้ควรถูกเข้ารหัสไว้ใน tests เพื่อไม่ให้การเปลี่ยนแปลงในอนาคตสลับลำดับโดยไม่ตั้งใจ

### 5. รักษารูปแบบที่เสถียรสำหรับ prompt-cache

projection helper ต้องสร้างเอาต์พุตที่เสถียรระดับไบต์สำหรับอินพุตที่เหมือนกัน:

- ลำดับข้อความที่คงที่
- ป้ายบทบาทที่คงที่
- ไม่มี timestamps ที่สร้างขึ้น
- ไม่มีการรั่วของลำดับ object keys
- ไม่มี delimiters แบบสุ่ม
- ไม่มี ids ต่อการรัน

ให้ใช้ delimiters แบบตายตัวและ sections ที่ชัดเจน

### 6. เชื่อม post-turn หลัง transcript mirroring

Codex ของ `CodexAppServerEventProjector` จะสร้าง `messagesSnapshot` แบบโลคัลสำหรับ
เทิร์นปัจจุบัน `mirrorTranscriptBestEffort(...)` จะเขียน snapshot นั้นลงใน
transcript mirror ของ OpenClaw

หลังจาก mirror สำเร็จหรือล้มเหลว ให้เรียก finalizer ของ context-engine ด้วย
message snapshot ที่ดีที่สุดที่หาได้:

- ควรใช้ mirrored session context แบบเต็มหลังการเขียนก่อน เพราะ `afterTurn`
  คาดหวัง session snapshot ไม่ใช่แค่เทิร์นปัจจุบัน
- หากเปิดไฟล์ session ใหม่ไม่ได้ ให้ fallback เป็น `historyMessages + result.messagesSnapshot`

pseudo-flow:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

หาก mirror ล้มเหลว ก็ยังคงเรียก `afterTurn` ด้วย fallback snapshot แต่ต้อง log
ว่าขณะนี้ context engine กำลัง ingest จาก fallback turn data

### 7. ทำให้ usage และ prompt-cache runtime context อยู่ในรูปแบบปกติ

ผลลัพธ์ของ Codex มี usage ที่ normalize แล้วจาก app-server token notifications เมื่อ
มีข้อมูลอยู่ ให้ส่ง usage นั้นเข้าไปใน runtime context ของ context-engine

หากในอนาคต Codex app-server เปิดเผยรายละเอียด cache read/write ให้แมปค่าลงใน
`ContextEnginePromptCacheInfo` จนกว่าจะถึงตอนนั้น ให้ละ `promptCache` ไว้
แทนที่จะสร้างค่า zero ขึ้นมาเอง

### 8. นโยบาย Compaction

มีระบบ Compaction อยู่ 2 ระบบ:

1. `compact()` ของ context-engine ของ OpenClaw
2. `thread/compact/start` แบบเนทีฟของ Codex app-server

ห้ามผสมทั้งสองอย่างเข้าด้วยกันแบบเงียบ ๆ

#### `/compact` และ Compaction แบบ OpenClaw ที่เรียกอย่างชัดเจน

เมื่อ context engine ที่เลือกมี `info.ownsCompaction === true`,
Compaction แบบ OpenClaw ที่เรียกอย่างชัดเจนควรให้ผลลัพธ์จาก `compact()` ของ context engine
เป็นตัวหลักสำหรับ transcript mirror และสถานะ Plugin ของ OpenClaw

เมื่อ Codex harness ที่เลือกมี native thread binding อยู่ เราอาจขอให้ Codex ทำ native compaction เพิ่มเติม
เพื่อให้ app-server thread ยังแข็งแรง แต่สิ่งนี้ต้องถูกรายงานเป็นการกระทำของ backend
ที่แยกต่างหากใน details

พฤติกรรมที่แนะนำ:

- หาก `contextEngine.info.ownsCompaction === true`:
  - เรียก `compact()` ของ context-engine ก่อน
  - จากนั้นเรียก Codex native compaction แบบ best-effort เมื่อมี thread binding
  - คืนค่าผลลัพธ์ของ context-engine เป็นผลลัพธ์หลัก
  - รวมสถานะของ Codex native compaction ไว้ใน `details.codexNativeCompaction`
- หาก context engine ที่ใช้งานอยู่ไม่ได้เป็นเจ้าของ Compaction:
  - คงลักษณะการทำงาน native compaction ของ Codex แบบปัจจุบันไว้

สิ่งนี้น่าจะต้องแก้ `extensions/codex/src/app-server/compact.ts` หรือ
wrap มันจากเส้นทาง Compaction แบบ generic ขึ้นอยู่กับว่ามีการเรียก
`maybeCompactAgentHarnessSession(...)` ที่ใด

#### เหตุการณ์ `contextCompaction` แบบ native ของ Codex ระหว่างเทิร์น

Codex อาจปล่อย item events แบบ `contextCompaction` ระหว่างเทิร์น คงการปล่อย hooks
before/after compaction แบบปัจจุบันไว้ใน `event-projector.ts` แต่ห้ามถือว่านั่นคือ
context-engine compaction ที่เสร็จสมบูรณ์แล้ว

สำหรับ engines ที่เป็นเจ้าของ Compaction ให้ปล่อย diagnostic แบบชัดเจนเมื่อ Codex
ยังทำ native compaction อยู่:

- ชื่อ stream/event: ใช้ stream `compaction` ที่มีอยู่ก็ได้
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

สิ่งนี้ทำให้การแยกส่วนสามารถตรวจสอบย้อนหลังได้

### 9. พฤติกรรมของการรีเซ็ตและการ bind session

`reset(...)` ของ Codex harness ที่มีอยู่จะล้าง Codex app-server binding ออกจาก
ไฟล์ OpenClaw session ให้คงพฤติกรรมนี้ไว้

และต้องตรวจสอบให้แน่ใจด้วยว่าการ cleanup สถานะของ context-engine ยังคงเกิดขึ้นผ่าน
เส้นทางวงจรชีวิต session ของ OpenClaw ที่มีอยู่ ห้ามเพิ่ม cleanup เฉพาะ Codex เว้นแต่
ปัจจุบันว่าวงจรชีวิตของ context-engine จะพลาด reset/delete events สำหรับทุก harness จริง ๆ

### 10. การจัดการข้อผิดพลาด

ให้ทำตามความหมายแบบ PI:

- bootstrap ที่ล้มเหลวให้เตือนแล้วทำต่อ
- assemble ที่ล้มเหลวให้เตือนและ fallback กลับไปใช้ pipeline messages/prompt ที่ยังไม่ได้ประกอบ
- afterTurn/ingest ที่ล้มเหลวให้เตือนและทำเครื่องหมายว่า post-turn finalization ไม่สำเร็จ
- maintenance จะรันเฉพาะหลังเทิร์นที่สำเร็จ, ไม่ถูกยกเลิก และไม่ใช่ yield turn
- ข้อผิดพลาดของ Compaction ไม่ควรถูกลองใหม่ในฐานะ prompt ใหม่

ส่วนเพิ่มเติมเฉพาะ Codex:

- หาก context projection ล้มเหลว ให้เตือนและ fallback ไปใช้ prompt เดิม
- หาก transcript mirror ล้มเหลว ให้ยังพยายามทำ context-engine finalization ด้วย
  fallback messages
- หาก Codex native compaction ล้มเหลวหลังจาก context-engine compaction สำเร็จ
  ห้ามทำให้ OpenClaw compaction ทั้งก้อนล้มเหลว เมื่อ context engine เป็นตัวหลัก

## แผนการทดสอบ

### Unit tests

เพิ่ม tests ใต้ `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex เรียก `bootstrap` เมื่อมีไฟล์ session อยู่แล้ว
   - Codex เรียก `assemble` ด้วย mirrored messages, token budget, ชื่อเครื่องมือ,
     citations mode, model id และ prompt
   - `systemPromptAddition` ถูกใส่ลงใน developer instructions
   - assembled messages ถูกฉายลงใน prompt ก่อน current request
   - Codex เรียก `afterTurn` หลัง transcript mirroring
   - หากไม่มี `afterTurn`, Codex จะเรียก `ingestBatch` หรือ `ingest` แบบต่อข้อความ
   - turn maintenance รันหลังเทิร์นที่สำเร็จ
   - turn maintenance จะไม่รันเมื่อ prompt error, abort หรือ yield abort

2. `context-engine-projection.test.ts`
   - เอาต์พุตคงที่สำหรับอินพุตที่เหมือนกัน
   - ไม่มี current prompt ซ้ำเมื่อ assembled history มีมันอยู่แล้ว
   - จัดการกรณีประวัติว่างได้
   - รักษาลำดับ role ไว้
   - ใส่ system prompt addition เฉพาะใน developer instructions เท่านั้น

3. `compact.context-engine.test.ts`
   - ผลลัพธ์หลักของ owning context engine ต้องชนะ
   - สถานะ Codex native compaction ปรากฏใน details เมื่อมีการลองด้วย
   - ความล้มเหลวของ Codex native ต้องไม่ทำให้ owning context-engine compaction ล้มเหลว
   - non-owning context engine ยังคงลักษณะการทำงาน native compaction แบบปัจจุบัน

### Existing tests ที่ต้องอัปเดต

- `extensions/codex/src/app-server/run-attempt.test.ts` หากมีอยู่ มิฉะนั้น
  ให้ใช้ tests ฝั่ง Codex app-server run ที่ใกล้ที่สุด
- `extensions/codex/src/app-server/event-projector.test.ts` เฉพาะกรณีที่รายละเอียดของ compaction
  events เปลี่ยน
- `src/agents/harness/selection.test.ts` ไม่ควรต้องเปลี่ยน เว้นแต่พฤติกรรม config
  จะเปลี่ยน; มันควรยังคงเดิม
- tests ของ PI context-engine ควรยังผ่านได้โดยไม่เปลี่ยนแปลง

### Integration / live tests

เพิ่มหรือขยาย live Codex harness smoke tests:

- กำหนดค่า `plugins.slots.contextEngine` ให้เป็น test engine
- กำหนดค่า `agents.defaults.model` ให้เป็นโมเดล `codex/*`
- กำหนด `agents.defaults.embeddedHarness.runtime = "codex"`
- ยืนยันว่า test engine ได้สังเกต:
  - bootstrap
  - assemble
  - afterTurn หรือ ingest
  - maintenance

หลีกเลี่ยงการบังคับให้ต้องมี lossless-claw ใน tests ของ OpenClaw core ใช้ fake
context engine plugin ขนาดเล็กในรีโปแทน

## การสังเกตการณ์

เพิ่ม debug logs รอบการเรียกวงจรชีวิต context-engine ของ Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` พร้อมเหตุผล
- `codex native compaction completed alongside context-engine compaction`

หลีกเลี่ยงการ log พรอมป์ต์แบบเต็มหรือเนื้อหา transcript

เพิ่ม structured fields เมื่อมีประโยชน์:

- `sessionId`
- `sessionKey` ให้ปกปิดหรือละไว้ตามแนวทางการบันทึก log ที่มีอยู่
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## การย้ายระบบ / ความเข้ากันได้

สิ่งนี้ควรเข้ากันได้แบบย้อนหลัง:

- หากไม่ได้กำหนดค่า context engine ไว้ พฤติกรรม context engine แบบเดิมควร
  เทียบเท่ากับพฤติกรรม Codex harness ในปัจจุบัน
- หาก `assemble` ของ context-engine ล้มเหลว Codex ควรทำต่อด้วย
  เส้นทาง prompt เดิม
- Codex thread bindings ที่มีอยู่แล้วควรยังใช้ได้
- dynamic tool fingerprinting ต้องไม่รวมเอาต์พุตของ context-engine; มิฉะนั้น
  การเปลี่ยน context ทุกครั้งอาจบังคับให้สร้าง Codex thread ใหม่ มีเพียง tool catalog
  เท่านั้นที่ควรมีผลกับ dynamic tool fingerprint

## คำถามที่ยังเปิดอยู่

1. ควรฉีด assembled context ทั้งหมดลงใน user prompt, ทั้งหมดลงใน
   developer instructions หรือแยกกัน?

   ข้อแนะนำ: แยกกัน ใส่ `systemPromptAddition` ลงใน developer instructions;
   ใส่ assembled transcript context ลงใน user prompt wrapper วิธีนี้ตรงกับ
   โปรโตคอล Codex ปัจจุบันมากที่สุดโดยไม่ mutate native thread history

2. ควรปิด Codex native compaction เมื่อ context engine เป็นเจ้าของ
   Compaction หรือไม่?

   ข้อแนะนำ: ไม่ อย่างน้อยในช่วงแรก Codex native compaction อาจยัง
   จำเป็นต่อการทำให้ app-server thread มีชีวิตอยู่ได้ แต่ต้องถูกรายงานในฐานะ
   native Codex compaction ไม่ใช่ context-engine compaction

3. `before_prompt_build` ควรรันก่อนหรือหลัง context-engine assembly?

   ข้อแนะนำ: หลัง context-engine projection สำหรับ Codex เพื่อให้ generic harness
   hooks เห็น prompt/developer instructions จริงที่ Codex จะได้รับ หาก PI
   parity ต้องการลำดับตรงข้าม ให้เข้ารหัสลำดับที่เลือกไว้ใน tests และอธิบายไว้
   ที่นี่

4. Codex app-server จะรองรับ structured context/history override ในอนาคตได้หรือไม่?

   ยังไม่ทราบ หากรองรับได้ ให้แทนที่ชั้น text projection ด้วยโปรโตคอลนั้น และ
   คงการเรียกวงจรชีวิตไว้เหมือนเดิม

## เกณฑ์การยอมรับ

- embedded harness turn แบบ `codex/*` เรียก assemble lifecycle ของ
  context engine ที่เลือก
- `systemPromptAddition` ของ context-engine มีผลกับ developer instructions ของ Codex
- assembled context มีผลกับ Codex turn input แบบกำหนดแน่นอน
- Codex turns ที่สำเร็จเรียก `afterTurn` หรือใช้ ingest fallback
- Codex turns ที่สำเร็จรัน turn maintenance ของ context-engine
- turns ที่ล้มเหลว/ถูกยกเลิก/yield-aborted จะไม่รัน turn maintenance
- Compaction ที่เป็นของ context-engine ยังคงเป็นตัวหลักสำหรับสถานะของ OpenClaw/Plugin
- Codex native compaction ยังคงตรวจสอบย้อนหลังได้ว่าเป็นพฤติกรรม native ของ Codex
- พฤติกรรม context-engine ของ PI ที่มีอยู่ไม่เปลี่ยน
- พฤติกรรม Codex harness ที่มีอยู่ไม่เปลี่ยน เมื่อไม่มี non-legacy context engine
  ถูกเลือก หรือเมื่อ assembly ล้มเหลว
