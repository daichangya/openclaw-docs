---
read_when:
    - session id, transcript JSONL 또는 sessions.json 필드를 디버깅해야 할 때
    - auto-compaction 동작을 변경하거나 “pre-compaction” housekeeping을 추가할 때
    - 메모리 flush 또는 silent system turn을 구현하려고 할 때
summary: '심화 분석: 세션 저장소 + transcript, 수명 주기, 그리고 (자동) compaction 내부 구조'
title: 세션 관리 심화 분석
x-i18n:
    generated_at: "2026-04-08T02:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1a4048646486693db8943a9e9c6c5bcb205f0ed532b34842de3d0346077454
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 세션 관리 및 Compaction(심화 분석)

이 문서는 OpenClaw가 세션을 엔드 투 엔드로 관리하는 방식을 설명합니다:

- **세션 라우팅**(수신 메시지가 `sessionKey`에 어떻게 매핑되는지)
- **세션 저장소**(`sessions.json`) 및 추적하는 항목
- **Transcript 지속성**(`*.jsonl`) 및 구조
- **Transcript hygiene**(실행 전 provider별 보정)
- **컨텍스트 한도**(컨텍스트 윈도우 대 추적된 토큰)
- **Compaction**(수동 + 자동 compaction) 및 pre-compaction 작업을 연결할 위치
- **silent housekeeping**(예: 사용자에게 보이는 출력을 만들지 않아야 하는 메모리 쓰기)

먼저 더 상위 수준의 개요를 보고 싶다면 다음부터 시작하세요:

- [/concepts/session](/ko/concepts/session)
- [/concepts/compaction](/ko/concepts/compaction)
- [/concepts/memory](/ko/concepts/memory)
- [/concepts/memory-search](/ko/concepts/memory-search)
- [/concepts/session-pruning](/ko/concepts/session-pruning)
- [/reference/transcript-hygiene](/ko/reference/transcript-hygiene)

---

## 단일 진실 공급원: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 Gateway에 세션 목록과 토큰 수를 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로 “로컬 Mac 파일 확인”으로는 Gateway가 실제로 사용하는 내용을 반영하지 않습니다.

---

## 두 개의 지속성 계층

OpenClaw는 세션을 두 계층에 걸쳐 저장합니다:

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 편집(또는 항목 삭제)해도 안전
   - 세션 메타데이터(현재 session id, 마지막 활동, 토글, 토큰 카운터 등) 추적

2. **Transcript (`<sessionId>.jsonl`)**
   - 트리 구조를 가진 append-only transcript(항목에 `id` + `parentId`가 있음)
   - 실제 대화 + 도구 호출 + compaction 요약 저장
   - 향후 턴에서 모델 컨텍스트를 재구성하는 데 사용

---

## 디스크 위치

Gateway 호스트에서 agent별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 확인합니다.

---

## 저장소 유지 관리 및 디스크 제어

세션 지속성에는 `sessions.json` 및 transcript 아티팩트를 위한 자동 유지 관리 제어(`session.maintenance`)가 있습니다:

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 보관 기간 기준(기본값 `30d`)
- `maxEntries`: `sessions.json` 내 최대 항목 수(기본값 `500`)
- `rotateBytes`: `sessions.json`이 너무 커지면 회전(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript 아카이브의 보관 기간(기본값: `pruneAfter`와 동일, `false`면 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 목표치(기본값 `maxDiskBytes`의 `80%`)

디스크 예산 정리의 적용 순서(`mode: "enforce"`):

1. 가장 오래된 아카이브 또는 orphan transcript 아티팩트를 먼저 제거합니다.
2. 여전히 목표치를 초과하면, 가장 오래된 세션 항목과 해당 transcript 파일을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서는 OpenClaw가 잠재적인 제거를 보고하지만 저장소/파일은 변경하지 않습니다.

필요 시 유지 관리 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 cron 실행도 세션 항목/transcript를 생성하며, 전용 보관 제어가 있습니다:

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 cron 실행 세션을 제거합니다(`false`면 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000`바이트 및 `2000`줄).

---

## 세션 키(`sessionKey`)

`sessionKey`는 _어떤 대화 버킷에 있는지_를 식별합니다(라우팅 + 격리).

일반적인 패턴:

- 메인/직접 채팅(agent별): `agent:<agentId>:<mainKey>` (기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 방/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (재정의되지 않은 경우)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 id(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어가는 transcript 파일)를 가리킵니다.

경험칙:

- **Reset** (`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 생성합니다.
- **일일 reset**(기본값: gateway 호스트 로컬 시간 오전 4:00)은 reset 경계를 지난 뒤 다음 메시지에서 새 `sessionId`를 생성합니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 기간이 지난 뒤 메시지가 도착하면 새 `sessionId`를 생성합니다. 일일 + 유휴가 모두 구성된 경우 먼저 만료되는 쪽이 적용됩니다.
- **스레드 부모 fork 가드**(`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 큰 경우 부모 transcript fork를 건너뜁니다. 새 스레드는 새로 시작합니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 사항: 이 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 목록은 아님):

- `sessionId`: 현재 transcript id(`sessionFile`이 설정되지 않은 한 파일명은 여기서 파생됨)
- `updatedAt`: 마지막 활동 타임스탬프
- `sessionFile`: 선택적 명시적 transcript 경로 재정의
- `chatType`: `direct | group | room` (UI 및 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 라벨링용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(최선의 노력 / provider 종속):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 session key에 대해 auto-compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 pre-compaction memory flush의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 flush가 실행되었을 때의 compaction 수

저장소는 편집해도 안전하지만 권한은 Gateway에 있습니다. 세션이 실행되면서 항목을 다시 쓰거나 재구성할 수 있습니다.

---

## Transcript 구조(`*.jsonl`)

Transcript는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL 형식입니다:

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목(트리 구조)

주요 항목 타입:

- `message`: user/assistant/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _포함되는_ 확장 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에 _포함되지 않는_ 확장 상태
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 가진 영속 compaction 요약
- `branch_summary`: 트리 브랜치 탐색 시 저장되는 요약

OpenClaw는 의도적으로 transcript를 “보정”하지 않습니다. Gateway는 이를 읽고 쓰기 위해 `SessionManager`를 사용합니다.

---

## 컨텍스트 윈도우 대 추적된 토큰

서로 다른 두 개념이 중요합니다:

1. **모델 컨텍스트 윈도우**: 모델별 하드 제한(모델에 보이는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 누적 통계(`/status` 및 대시보드에 사용)

한도를 조정하는 경우:

- 컨텍스트 윈도우는 모델 카탈로그에서 오며 config로 재정의할 수 있습니다.
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 엄격한 보장으로 간주하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 무엇인가

Compaction은 transcript 내 오래된 대화를 영속 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

compaction 이후 이후 턴에서 보이는 내용:

- compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영속적**입니다(세션 pruning과 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction 청크 경계 및 도구 페어링

OpenClaw가 긴 transcript를 compaction 청크로 나눌 때는
assistant 도구 호출과 해당 `toolResult` 항목의 짝을 유지합니다.

- 토큰 비율 분할 지점이 도구 호출과 결과 사이에 걸리면, OpenClaw는
  짝을 분리하는 대신 경계를 assistant 도구 호출 메시지로 이동합니다.
- 뒤따르는 tool-result 블록 때문에 청크가 목표치를 초과하게 되는 경우,
  OpenClaw는 해당 대기 중 도구 블록을 보존하고 요약되지 않은 꼬리 부분을 그대로 유지합니다.
- 중단되었거나 오류가 있는 도구 호출 블록은 대기 중인 분할을 계속 열어 두지 않습니다.

---

## auto-compaction이 일어나는 시점(Pi 런타임)

내장 Pi agent에서 auto-compaction은 두 경우에 트리거됩니다:

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류를 반환함
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 provider 형태의 변형) → compact → 재시도.
2. **임계값 유지 관리**: 성공한 턴 이후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 윈도우
- `reserveTokens`는 프롬프트 + 다음 모델 출력용으로 예약된 헤드룸

이것은 Pi 런타임 의미 체계입니다(OpenClaw는 이벤트를 소비하지만 언제 compact할지는 Pi가 결정합니다).

---

## Compaction 설정(`reserveTokens`, `keepRecentTokens`)

Pi의 compaction 설정은 Pi 설정에 있습니다:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 내장 실행에 대해 안전 하한도 적용합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 하한은 `20000`토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`으로 설정하세요.
- 이미 더 높다면 OpenClaw는 그대로 둡니다.

이유: compaction이 불가피해지기 전에 메모리 쓰기 같은 다중 턴 “housekeeping”을 위한 충분한 헤드룸을 남기기 위함입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 compaction provider

plugin은 plugin API의 `registerCompactionProvider()`를 통해 compaction provider를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 provider id로 설정되면, safeguard 확장은 내장 `summarizeInStages` 파이프라인 대신 해당 provider에 요약을 위임합니다.

- `provider`: 등록된 compaction provider plugin의 id. 기본 LLM 요약을 사용하려면 설정하지 마세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- provider는 내장 경로와 동일한 compaction 지침 및 식별자 보존 정책을 받습니다.
- safeguard는 provider 출력 이후에도 최근 턴과 분할 턴의 접미 컨텍스트를 보존합니다.
- provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 내장 LLM 요약으로 폴백합니다.
- 중단/타임아웃 시그널은 호출자 취소를 존중하기 위해 다시 던져지며(삼키지 않음) 처리됩니다.

소스: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음을 통해 compaction 및 세션 상태를 관찰할 수 있습니다:

- `/status`(모든 채팅 세션에서)
- `openclaw status`(CLI)
- `openclaw sessions` / `sessions --json`
- verbose 모드: `🧹 Auto-compaction complete` + compaction 수

---

## silent housekeeping (`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보면 안 되는 백그라운드 작업을 위해 “silent” 턴을 지원합니다.

관례:

- assistant는 출력 시작에 정확한 silent 토큰 `NO_REPLY` /
  `no_reply`를 넣어 “사용자에게 답장을 전달하지 않음”을 나타냅니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 silent 토큰 억제는 대소문자를 구분하지 않으므로, 전체 payload가 silent 토큰뿐일 때 `NO_REPLY`와
  `no_reply`가 모두 해당됩니다.
- 이것은 진정한 백그라운드/비전달 턴만을 위한 것이며,
  일반적인 실행 가능한 사용자 요청을 위한 지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는
부분 청크가 `NO_REPLY`로 시작할 때 **draft/typing streaming**도 억제하므로,
silent 작업이 턴 중간에 부분 출력을 노출하지 않습니다.

---

## Pre-compaction "memory flush"(구현됨)

목표: auto-compaction이 발생하기 전에 디스크에 지속 상태를 기록하는
silent agentic 턴을 실행합니다(예: agent 워크스페이스의 `memory/YYYY-MM-DD.md`). 이렇게 하면 compaction으로 인해
중요한 컨텍스트가 사라지지 않습니다.

OpenClaw는 **사전 임계값 flush** 접근 방식을 사용합니다:

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. “소프트 임계값”(Pi의 compaction 임계값보다 낮음)을 넘으면
   agent에게 silent “지금 메모리를 써라” 지시를 실행합니다.
3. 사용자는 아무것도 보지 않도록 정확한 silent 토큰 `NO_REPLY` / `no_reply`를 사용합니다.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (기본값: `true`)
- `softThresholdTokens` (기본값: `4000`)
- `prompt` (flush 턴용 사용자 메시지)
- `systemPrompt` (flush 턴에 추가되는 추가 시스템 프롬프트)

참고:

- 기본 prompt/system prompt에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- flush는 compaction 주기마다 한 번 실행됩니다(`sessions.json`에서 추적).
- flush는 내장 Pi 세션에서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 워크스페이스가 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 flush를 건너뜁니다.
- 워크스페이스 파일 레이아웃 및 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참조하세요.

Pi도 확장 API에서 `session_before_compact` hook를 노출하지만, OpenClaw의
flush 로직은 현재 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)부터 시작하고 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 transcript가 일치하지 않나요? Gateway 호스트와 `openclaw status`의 저장소 경로를 확인하세요.
- compaction이 너무 자주 발생하나요? 다음을 확인하세요:
  - 모델 컨텍스트 윈도우(너무 작음)
  - compaction 설정(모델 윈도우에 비해 `reserveTokens`가 너무 높으면 더 이른 compaction을 유발할 수 있음)
  - tool-result 팽창: 세션 pruning을 활성화/조정하세요
- silent 턴이 새나요? 답장이 `NO_REPLY`(대소문자 구분 없는 정확한 토큰)로 시작하는지, 그리고 streaming 억제 수정이 포함된 빌드를 사용 중인지 확인하세요.
