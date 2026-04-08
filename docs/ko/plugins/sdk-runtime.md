---
read_when:
    - plugin에서 코어 헬퍼(TTS, STT, 이미지 생성, 웹 검색, subagent)를 호출해야 할 때
    - api.runtime이 무엇을 노출하는지 이해하고 싶을 때
    - plugin 코드에서 config, agent 또는 미디어 헬퍼에 접근하고 있을 때
sidebarTitle: Runtime Helpers
summary: api.runtime -- plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-04-08T02:17:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: acb9e56678e9ed08d0998dfafd7cd1982b592be5bc34d9e2d2c1f70274f8f248
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Plugin 런타임 헬퍼

등록 중 모든 plugin에 주입되는 `api.runtime` 객체의 참조 문서입니다.
호스트 내부를 직접 import하는 대신 이 헬퍼를 사용하세요.

<Tip>
  **사용 방법 안내를 찾고 있나요?** 이 헬퍼가 실제로 어떻게 쓰이는지 단계별로 보여주는
  [Channel Plugins](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참조하세요.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 런타임 네임스페이스

### `api.runtime.agent`

Agent 정체성, 디렉터리, 세션 관리.

```typescript
// agent의 작업 디렉터리 확인
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// agent 워크스페이스 확인
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// agent 정체성 가져오기
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 기본 thinking 수준 가져오기
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// agent 타임아웃 가져오기
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 워크스페이스가 존재하도록 보장
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 내장된 Pi agent 실행
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "최신 변경 사항을 요약해 주세요",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**세션 저장소 헬퍼**는 `api.runtime.agent.session` 아래에 있습니다:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

기본 모델 및 provider 상수:

```typescript
const model = api.runtime.agent.defaults.model; // 예: "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 예: "anthropic"
```

### `api.runtime.subagent`

백그라운드 subagent 실행을 시작하고 관리합니다.

```typescript
// subagent 실행 시작
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "이 쿼리를 더 집중된 후속 검색으로 확장해 주세요.",
  provider: "openai", // 선택적 재정의
  model: "gpt-4.1-mini", // 선택적 재정의
  deliver: false,
});

// 완료 대기
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// 세션 메시지 읽기
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 세션 삭제
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  모델 재정의(`provider`/`model`)는 config의
  `plugins.entries.<id>.subagent.allowModelOverride: true`를 통한
  운영자 opt-in이 필요합니다.
  신뢰되지 않은 plugin도 subagent를 실행할 수는 있지만 재정의 요청은 거부됩니다.
</Warning>

### `api.runtime.taskFlow`

Task Flow 런타임을 기존 OpenClaw 세션 키 또는 신뢰된 도구 컨텍스트에 바인딩한 뒤,
호출마다 owner를 전달하지 않고도 Task Flow를 생성하고 관리합니다.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "새 pull request 검토",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "PR #123 검토",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

자체 바인딩 레이어에서 이미 신뢰된 OpenClaw 세션 키를 갖고 있다면
`bindSession({ sessionKey, requesterOrigin })`을 사용하세요. 원시 사용자 입력에서
직접 바인딩하지 마세요.

### `api.runtime.tts`

텍스트 음성 변환.

```typescript
// 표준 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "OpenClaw에서 인사드립니다",
  cfg: api.config,
});

// 전화용으로 최적화된 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "OpenClaw에서 인사드립니다",
  cfg: api.config,
});

// 사용 가능한 음성 목록
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

코어 `messages.tts` config와 provider 선택을 사용합니다. PCM 오디오
버퍼 + 샘플 레이트를 반환합니다.

### `api.runtime.mediaUnderstanding`

이미지, 오디오, 비디오 분석.

```typescript
// 이미지 설명
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 오디오 전사
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // MIME을 추론할 수 없을 때 선택 사항
});

// 비디오 설명
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 일반 파일 분석
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

출력이 생성되지 않으면(예: 입력이 건너뛰어진 경우) `{ text: undefined }`를 반환합니다.

<Info>
  `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 남아 있으며
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`를 가리킵니다.
</Info>

### `api.runtime.imageGeneration`

이미지 생성.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "노을을 그리는 로봇",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

웹 검색.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

저수준 미디어 유틸리티.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Config 로드 및 쓰기.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

시스템 수준 유틸리티.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

이벤트 구독.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

로깅.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

모델 및 provider 인증 확인.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

상태 디렉터리 확인.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

메모리 도구 팩토리 및 CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

채널 전용 런타임 헬퍼(채널 plugin이 로드된 경우 사용 가능).

`api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 plugin을 위한
공유 수신 멘션 정책 표면입니다:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

사용 가능한 멘션 헬퍼:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions`는 의도적으로 이전의
`resolveMentionGating*` 호환성 헬퍼를 노출하지 않습니다. 정규화된
`{ facts, policy }` 경로를 사용하세요.

## 런타임 참조 저장

`register` 콜백 외부에서 사용할 런타임 참조를 저장하려면
`createPluginRuntimeStore`를 사용하세요:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// 진입점에서
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 다른 파일에서
export function getRuntime() {
  return store.getRuntime(); // 초기화되지 않았으면 예외 발생
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 초기화되지 않았으면 null 반환
}
```

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다:

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | Plugin 표시 이름                                                                            |
| `api.config`             | `OpenClawConfig`          | 현재 config 스냅샷(사용 가능한 경우 활성 인메모리 런타임 스냅샷)                            |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 plugin 전용 config                                          |
| `api.logger`             | `PluginLogger`            | 범위가 지정된 로거(`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드; `"setup-runtime"`은 전체 엔트리 이전의 경량 시작/설정 창입니다              |
| `api.resolvePath(input)` | `(string) => string`      | plugin 루트를 기준으로 경로 확인                                                            |

## 관련 문서

- [SDK Overview](/ko/plugins/sdk-overview) -- 서브패스 참조
- [SDK Entry Points](/ko/plugins/sdk-entrypoints) -- `definePluginEntry` 옵션
- [Plugin Internals](/ko/plugins/architecture) -- 기능 모델 및 레지스트리
