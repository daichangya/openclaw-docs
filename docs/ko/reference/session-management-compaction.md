---
read_when:
    - 세션 ID, 전사 JSONL, 또는 `sessions.json` 필드를 디버깅해야 합니다
    - 자동 Compaction 동작을 변경하거나 “사전 Compaction” housekeeping을 추가하고 있습니다
    - 메모리 flush 또는 무음 시스템 턴을 구현하고 싶습니다
summary: '심층 분석: 세션 저장소 + 전사, 수명 주기, (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-04-24T06:34:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 세션 관리 및 Compaction (심층 분석)

이 문서는 OpenClaw가 세션을 엔드 투 엔드로 어떻게 관리하는지 설명합니다:

- **세션 라우팅** (수신 메시지가 어떻게 `sessionKey`에 매핑되는지)
- **세션 저장소** (`sessions.json`)와 그 추적 내용
- **전사 영속화** (`*.jsonl`)와 그 구조
- **전사 위생 관리** (실행 전 provider별 수정)
- **컨텍스트 제한** (컨텍스트 윈도 대 추적 토큰)
- **Compaction** (수동 + 자동 Compaction)과 사전 Compaction 작업을 걸 수 있는 위치
- **무음 housekeeping** (예: 사용자에게 보이는 출력 없이 처리해야 하는 메모리 기록)

먼저 상위 수준 개요가 필요하다면 다음부터 시작하세요:

- [/concepts/session](/ko/concepts/session)
- [/concepts/compaction](/ko/concepts/compaction)
- [/concepts/memory](/ko/concepts/memory)
- [/concepts/memory-search](/ko/concepts/memory-search)
- [/concepts/session-pruning](/ko/concepts/session-pruning)
- [/reference/transcript-hygiene](/ko/reference/transcript-hygiene)

---

## 기준 원본: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 세션 목록과 토큰 수를 Gateway에 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로, “로컬 Mac 파일 확인”은 Gateway가 실제로 사용하는 내용을 반영하지 않습니다.

---

## 두 개의 영속성 계층

OpenClaw는 세션을 두 계층으로 영속화합니다:

1. **세션 저장소 (`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고 가변적이며, 편집(또는 항목 삭제)해도 비교적 안전함
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등) 추적

2. **전사 (`<sessionId>.jsonl`)**
   - 트리 구조를 가진 append-only 전사(항목에는 `id` + `parentId` 있음)
   - 실제 대화 + 도구 호출 + Compaction 요약 저장
   - 향후 턴의 모델 컨텍스트를 다시 구성하는 데 사용

---

## 디스크상의 위치

Gateway 호스트에서 에이전트별로:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 전사: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 토픽 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 확인합니다.

---

## 저장소 유지보수 및 디스크 제어

세션 영속성에는 `sessions.json`과 전사 아티팩트를 위한 자동 유지보수 제어(`session.maintenance`)가 있습니다:

- `mode`: `warn` (기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 연령 기준(기본값 `30d`)
- `maxEntries`: `sessions.json` 항목 수 상한(기본값 `500`)
- `rotateBytes`: `sessions.json`이 너무 커지면 회전(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` 전사 아카이브의 보존 기간(기본값: `pruneAfter`와 같음, `false`는 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 목표치(기본값 `maxDiskBytes`의 `80%`)

디스크 예산 정리의 강제 순서(`mode: "enforce"`):

1. 가장 오래된 아카이브 또는 orphan 전사 아티팩트를 먼저 제거
2. 여전히 목표치보다 크면 가장 오래된 세션 항목과 해당 전사 파일을 제거
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속 진행

`mode: "warn"`에서는 OpenClaw가 잠재적 제거를 보고만 하고 저장소/파일은 변경하지 않습니다.

필요 시 유지보수를 수동 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션과 실행 로그

격리된 Cron 실행도 세션 항목/전사를 만들며, 전용 보존 제어가 있습니다:

- `cron.sessionRetention` (기본값 `24h`)은 세션 저장소에서 오래된 격리 Cron 실행 세션을 정리합니다(`false`는 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000` 바이트 및 `2000` 줄).

---

## 세션 키 (`sessionKey`)

`sessionKey`는 _어떤 대화 버킷에 있는지_ 를 식별합니다(라우팅 + 격리).

일반적인 패턴:

- 메인/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>` (기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 룸/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (재정의되지 않는 한)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID (`sessionId`)

각 `sessionKey`는 현재 `sessionId`를 가리킵니다(대화를 이어가는 전사 파일).

경험칙:

- **재설정** (`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 만듭니다.
- **일일 재설정** (기본값 Gateway 호스트 로컬 시간 기준 오전 4:00)은 재설정 경계를 지난 뒤 다음 메시지에서 새 `sessionId`를 만듭니다.
- **유휴 만료** (`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 창 이후 메시지가 도착하면 새 `sessionId`를 만듭니다. 일일 + 유휴가 모두 구성된 경우 먼저 만료되는 쪽이 우선합니다.
- **스레드 부모 포크 가드** (`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 크면 부모 전사 포크를 건너뜁니다. 새 스레드는 새로 시작합니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 사항: 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마 (`sessions.json`)

저장소 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 목록 아님):

- `sessionId`: 현재 전사 ID (`sessionFile`이 설정되지 않은 한 파일 이름은 여기서 파생됨)
- `updatedAt`: 마지막 활동 타임스탬프
- `sessionFile`: 선택적 명시적 전사 경로 재정의
- `chatType`: `direct | group | room` (UI 및 send policy에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(best-effort / provider 의존적):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에서 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 사전 Compaction 메모리 flush 타임스탬프
- `memoryFlushCompactionCount`: 마지막 flush가 실행되었을 때의 Compaction 카운트

저장소는 편집해도 비교적 안전하지만, 권한은 Gateway에 있습니다. 세션이 실행되면서 항목을 다시 쓰거나 재구성할 수 있습니다.

---

## 전사 구조 (`*.jsonl`)

전사는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL 형식입니다:

- 첫 줄: 세션 헤더 (`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목(트리)

주요 항목 유형:

- `message`: 사용자/어시스턴트/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ 확장 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에는 _들어가지 않는_ 확장 상태
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 가진 영속 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때의 영속 요약

OpenClaw는 의도적으로 전사를 “수정”하지 않습니다. Gateway는 `SessionManager`를 사용해 읽고 씁니다.

---

## 컨텍스트 윈도 대 추적 토큰

두 가지 서로 다른 개념이 중요합니다:

1. **모델 컨텍스트 윈도**: 모델별 하드 상한(모델이 볼 수 있는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 롤링 통계(`/status` 및 대시보드에 사용)

제한을 조정하고 있다면:

- 컨텍스트 윈도는 모델 카탈로그에서 오며(구성으로 재정의 가능)
- 저장소의 `contextTokens`는 런타임 추정/보고 값이므로 엄격한 보장으로 취급하지 마세요

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 그것이 무엇인가

Compaction은 오래된 대화를 전사에 영속 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

Compaction 후 향후 턴이 보게 되는 것:

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영속적**입니다(세션 가지치기와 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction 청크 경계와 도구 페어링

OpenClaw가 긴 전사를 Compaction 청크로 나눌 때는
어시스턴트 도구 호출과 그에 대응하는 `toolResult` 항목을 함께 유지합니다.

- 토큰 비율 기준 분할이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는
  둘을 분리하지 않고 경계를 해당 assistant tool-call 메시지로 이동합니다.
- 후행 tool-result 블록 때문에 청크가 목표를 초과하게 될 경우,
  OpenClaw는 대기 중인 tool 블록을 보존하고 요약되지 않은 tail을 그대로 유지합니다.
- 중단/오류 tool-call 블록은 대기 중인 분할을 계속 열어 두지 않습니다.

---

## 자동 Compaction이 발생하는 시점 (Pi 런타임)

내장 Pi 에이전트에서 자동 Compaction은 두 경우에 트리거됩니다:

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류를 반환
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 provider별 변형) → compact → 재시도.
2. **임계값 유지보수**: 성공적인 턴 후, 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 윈도
- `reserveTokens`는 프롬프트 + 다음 모델 출력에 남겨둘 headroom

이것은 Pi 런타임 의미입니다(OpenClaw가 이벤트를 소비하지만, Compaction 시점을 결정하는 것은 Pi입니다).

---

## Compaction 설정 (`reserveTokens`, `keepRecentTokens`)

Pi의 Compaction 설정은 Pi 설정에 있습니다:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 내장 실행에 대해 안전 하한도 강제합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 이를 올립니다.
- 기본 하한은 `20000` 토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`으로 설정하세요.
- 이미 더 높으면 OpenClaw는 그대로 둡니다.

이유: Compaction이 불가피해지기 전에 메모리 기록 같은 다중 턴 “housekeeping”을 위한 충분한 headroom을 남겨 두기 위함입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction provider

Plugins는 plugin API의 `registerCompactionProvider()`를 통해 Compaction provider를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 provider ID로 설정되면, safeguard 확장은 내장 `summarizeInStages` 파이프라인 대신 해당 provider에 요약을 위임합니다.

- `provider`: 등록된 Compaction provider Plugin의 ID. 기본 LLM 요약을 사용하려면 비워 두세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- provider는 내장 경로와 동일한 Compaction 지시 및 identifier 보존 정책을 받습니다.
- safeguard는 여전히 provider 출력 뒤에 최근 턴 및 분할 턴 suffix 컨텍스트를 보존합니다.
- provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 내장 LLM 요약으로 폴백합니다.
- abort/timeout 신호는 호출자 취소를 존중하기 위해 다시 던집니다(삼키지 않음).

소스: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음을 통해 Compaction과 세션 상태를 관찰할 수 있습니다:

- `/status` (모든 채팅 세션에서)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 상세 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 무음 housekeeping (`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업을 위한 “무음” 턴을 지원합니다.

규칙:

- 어시스턴트는 정확한 무응답 토큰 `NO_REPLY` /
  `no_reply`로 출력을 시작해 “사용자에게 응답을 전달하지 마라”를 나타냅니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 무응답 토큰 억제는 대소문자를 구분하지 않으므로, 전체 payload가 무응답 토큰뿐일 때 `NO_REPLY`와
  `no_reply`가 모두 인정됩니다.
- 이것은 진정한 백그라운드/무전달 턴 전용이며, 일반적인 실행 가능한 사용자 요청의 지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는 부분 청크가 `NO_REPLY`로 시작할 때 **draft/typing 스트리밍**도 억제하므로, 무음 작업이 턴 중간에 부분 출력을 누출하지 않습니다.

---

## 사전 Compaction "메모리 flush" (구현됨)

목표: 자동 Compaction이 발생하기 전에 영속 상태를 디스크에 기록하는 무음 에이전트 턴을 실행합니다(예:
에이전트 작업공간의 `memory/YYYY-MM-DD.md`). 이렇게 하면 Compaction이 중요한 컨텍스트를 지워버릴 수 없습니다.

OpenClaw는 **사전 임계값 flush** 접근 방식을 사용합니다:

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. “소프트 임계값”(Pi의 Compaction 임계값보다 아래)을 넘으면, 에이전트에
   무음 “지금 메모리 기록” directive를 실행합니다.
3. 정확한 무응답 토큰 `NO_REPLY` / `no_reply`를 사용해
   사용자가 아무것도 보지 않게 합니다.

구성 (`agents.defaults.compaction.memoryFlush`):

- `enabled` (기본값: `true`)
- `softThresholdTokens` (기본값: `4000`)
- `prompt` (flush 턴용 사용자 메시지)
- `systemPrompt` (flush 턴에 덧붙는 추가 시스템 프롬프트)

참고:

- 기본 prompt/system prompt에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함되어 있습니다.
- flush는 Compaction 주기당 한 번만 실행됩니다(`sessions.json`에 추적됨).
- flush는 내장 Pi 세션에서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 작업공간이 읽기 전용일 때(`workspaceAccess: "ro"` 또는 `"none"`)는 flush를 건너뜁니다.
- 작업공간 파일 레이아웃과 기록 패턴은 [메모리](/ko/concepts/memory)를 참조하세요.

Pi도 확장 API에 `session_before_compact` 훅을 노출하지만, OpenClaw의
flush 로직은 현재 Gateway 쪽에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)부터 시작하고 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 전사가 일치하지 않나요? `openclaw status`에서 Gateway 호스트와 저장소 경로를 확인하세요.
- Compaction이 너무 자주 일어나나요? 다음을 확인하세요:
  - 모델 컨텍스트 윈도(너무 작음)
  - Compaction 설정(`reserveTokens`가 모델 윈도에 비해 너무 높으면 더 이른 Compaction이 발생할 수 있음)
  - tool-result 팽창: 세션 가지치기를 활성화/조정하세요
- 무음 턴이 새나요? 응답이 `NO_REPLY`(대소문자 구분 없는 정확한 토큰)로 시작하는지, 그리고 스트리밍 억제 수정이 포함된 빌드인지 확인하세요.

## 관련

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
- [컨텍스트 엔진](/ko/concepts/context-engine)
