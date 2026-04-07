---
read_when:
    - 세션 ID, 트랜스크립트 JSONL, 또는 `sessions.json` 필드를 디버그해야 할 때
    - 자동 압축 동작을 변경하거나 "압축 전" 하우스키핑을 추가할 때
    - 메모리 플러시나 무음 시스템 턴을 구현하려고 할 때
summary: '심층 분석: 세션 저장소 + 트랜스크립트, 수명 주기, 그리고 (자동) 압축 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-04-07T06:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 세션 관리 및 압축(심층 분석)

이 문서는 OpenClaw가 세션을 엔드투엔드로 관리하는 방식을 설명합니다.

- **세션 라우팅**(수신 메시지가 `sessionKey`에 매핑되는 방식)
- **세션 저장소**(`sessions.json`)와 여기에 추적되는 항목
- **트랜스크립트 영속성**(`*.jsonl`)과 그 구조
- **트랜스크립트 위생**(실행 전 공급자별 보정)
- **컨텍스트 제한**(컨텍스트 윈도우와 추적된 토큰의 차이)
- **압축**(수동 + 자동 압축)과 압축 전 작업을 연결할 위치
- **무음 하우스키핑**(예: 사용자에게 보이는 출력을 생성하면 안 되는 메모리 쓰기)

먼저 더 상위 수준의 개요를 보고 싶다면 다음부터 시작하세요.

- [/concepts/session](/ko/concepts/session)
- [/concepts/compaction](/ko/concepts/compaction)
- [/concepts/memory](/ko/concepts/memory)
- [/concepts/memory-search](/ko/concepts/memory-search)
- [/concepts/session-pruning](/ko/concepts/session-pruning)
- [/reference/transcript-hygiene](/ko/reference/transcript-hygiene)

---

## 단일 진실 공급원: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 세션 목록과 토큰 수를 Gateway에 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로, "로컬 Mac 파일을 확인"해도 Gateway가 실제로 사용하는 내용은 반영되지 않습니다.

---

## 두 개의 영속성 계층

OpenClaw는 세션을 두 계층으로 영속화합니다.

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 편집(또는 항목 삭제)해도 안전함
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)를 추적함

2. **트랜스크립트(` <sessionId>.jsonl`)**
   - 추가 전용 트랜스크립트이며 트리 구조를 가짐(항목에 `id` + `parentId` 포함)
   - 실제 대화 + 도구 호출 + 압축 요약을 저장함
   - 이후 턴을 위해 모델 컨텍스트를 다시 구성하는 데 사용됨

---

## 디스크 상 위치

Gateway 호스트에서 에이전트별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 토픽 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 해석합니다.

---

## 저장소 유지 관리 및 디스크 제어

세션 영속성에는 `sessions.json` 및 트랜스크립트 아티팩트를 위한 자동 유지 관리 제어(`session.maintenance`)가 있습니다.

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 보관 기간 기준(기본값 `30d`)
- `maxEntries`: `sessions.json`의 최대 항목 수(기본값 `500`)
- `rotateBytes`: 크기가 너무 커지면 `sessions.json` 순환(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` 트랜스크립트 아카이브의 보관 기간(기본값: `pruneAfter`와 동일, `false`이면 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 용량 예산
- `highWaterBytes`: 정리 후 목표치(기본값 `maxDiskBytes`의 `80%`)

디스크 예산 정리의 적용 순서(`mode: "enforce"`):

1. 가장 오래된 아카이브 또는 고아 트랜스크립트 아티팩트를 먼저 제거합니다.
2. 그래도 목표치를 초과하면, 가장 오래된 세션 항목과 해당 트랜스크립트 파일을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서는 OpenClaw가 잠재적인 제거 대상을 보고만 하고 저장소/파일은 변경하지 않습니다.

필요 시 유지 관리를 실행합니다.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## 크론 세션 및 실행 로그

격리된 크론 실행도 세션 항목/트랜스크립트를 생성하며, 전용 보관 제어가 있습니다.

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 크론 실행 세션을 정리합니다(`false`이면 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000`바이트 및 `2000`줄).

---

## 세션 키(`sessionKey`)

`sessionKey`는 _어떤 대화 버킷_ 에 있는지를 식별합니다(라우팅 + 격리).

일반적인 패턴:

- 기본/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>`(기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 룸/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- 크론: `cron:<job.id>`
- 웹훅: `hook:<uuid>`(재정의되지 않은 경우)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어가는 트랜스크립트 파일)를 가리킵니다.

경험칙:

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 만듭니다.
- **일일 재설정**(기본값: Gateway 호스트 로컬 시간 오전 4:00)은 재설정 경계를 지난 다음 메시지에서 새 `sessionId`를 만듭니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 시간 창이 지난 뒤 메시지가 도착하면 새 `sessionId`를 만듭니다. 일일 재설정과 유휴 만료가 모두 설정된 경우 더 먼저 만료되는 쪽이 적용됩니다.
- **스레드 부모 포크 가드**(`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 클 때 부모 트랜스크립트 포크를 건너뜁니다. 새 스레드는 새로 시작합니다. 비활성화하려면 `0`으로 설정합니다.

구현 세부 사항: 이 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 아님):

- `sessionId`: 현재 트랜스크립트 ID(`sessionFile`이 설정되지 않은 경우 파일명은 여기서 파생됨)
- `updatedAt`: 마지막 활동 타임스탬프
- `sessionFile`: 명시적 트랜스크립트 경로 재정의를 위한 선택적 필드
- `chatType`: `direct | group | room`(UI와 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블링용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(최선 추정 / 공급자 의존적):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 압축이 완료된 횟수
- `memoryFlushAt`: 마지막 압축 전 메모리 플러시 타임스탬프
- `memoryFlushCompactionCount`: 마지막 플러시가 실행되었을 때의 압축 횟수

저장소는 편집해도 안전하지만, 권한은 Gateway에 있습니다. 세션이 실행되면 항목을 다시 쓰거나 재구성할 수 있습니다.

---

## 트랜스크립트 구조(`*.jsonl`)

트랜스크립트는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL 형식입니다.

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목들(트리 구조)

주목할 만한 항목 유형:

- `message`: 사용자/어시스턴트/`toolResult` 메시지
- `custom_message`: 모델 컨텍스트에 _포함되는_ 확장 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에 _포함되지 않는_ 확장 상태
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 포함하는 영속적 압축 요약
- `branch_summary`: 트리 브랜치를 탐색할 때 저장되는 요약

OpenClaw는 의도적으로 트랜스크립트를 "보정"하지 않습니다. Gateway는 `SessionManager`를 사용해 이를 읽고 씁니다.

---

## 컨텍스트 윈도우와 추적된 토큰

서로 다른 두 개념이 중요합니다.

1. **모델 컨텍스트 윈도우**: 모델별 하드 한도(모델이 볼 수 있는 토큰 수)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 누적 통계(`/status` 및 대시보드에 사용)

제한을 조정하는 경우:

- 컨텍스트 윈도우는 모델 카탈로그에서 오며(설정을 통해 재정의 가능)
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## 압축: 무엇인가

압축은 오래된 대화를 트랜스크립트의 영속적 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

압축 후 이후 턴은 다음을 보게 됩니다.

- 압축 요약
- `firstKeptEntryId` 이후의 메시지

압축은 **영속적**입니다(세션 가지치기와 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## 압축 청크 경계와 도구 페어링

OpenClaw가 긴 트랜스크립트를 압축 청크로 분할할 때는
어시스턴트 도구 호출이 해당 `toolResult` 항목과 짝지어진 상태를 유지합니다.

- 토큰 비중 분할 지점이 도구 호출과 그 결과 사이에 걸치면, OpenClaw는
  둘을 분리하는 대신 경계를 어시스턴트 도구 호출 메시지 쪽으로 이동합니다.
- 후행 도구 결과 블록 때문에 청크가 목표 크기를 초과하게 되는 경우,
  OpenClaw는 해당 보류 중인 도구 블록을 보존하고 요약되지 않은 꼬리 부분을 그대로 유지합니다.
- 중단되었거나 오류가 난 도구 호출 블록은 보류 중인 분할 상태를 유지시키지 않습니다.

---

## 자동 압축이 발생하는 시점(Pi 런타임)

내장된 Pi 에이전트에서는 자동 압축이 두 경우에 트리거됩니다.

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류를 반환함
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 공급자별 변형) → 압축 → 재시도.
2. **임계값 유지 관리**: 성공적인 턴 이후, 다음 조건일 때

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 윈도우
- `reserveTokens`는 프롬프트 + 다음 모델 출력에 예약된 여유 공간

이 동작은 Pi 런타임의 의미론입니다(OpenClaw는 이벤트를 소비하지만, 압축 시점은 Pi가 결정합니다).

---

## 압축 설정(`reserveTokens`, `keepRecentTokens`)

Pi의 압축 설정은 Pi 설정에 있습니다.

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 내장 실행에 대해 안전 하한도 적용합니다.

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 하한은 `20000`토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`으로 설정합니다.
- 이미 더 높다면 OpenClaw는 그대로 둡니다.

이유: 압축이 불가피해지기 전에 메모리 쓰기 같은 다중 턴 "하우스키핑"을 위한 충분한 여유 공간을 남겨두기 위함입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 사용자에게 보이는 표면

다음을 통해 압축과 세션 상태를 관찰할 수 있습니다.

- `/status`(모든 채팅 세션에서)
- `openclaw status`(CLI)
- `openclaw sessions` / `sessions --json`
- 자세한 모드: `🧹 Auto-compaction complete` + 압축 횟수

---

## 무음 하우스키핑(`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보면 안 되는 백그라운드 작업을 위해 "무음" 턴을 지원합니다.

규칙:

- 어시스턴트는 정확한 무음 토큰 `NO_REPLY` / `no_reply`로 출력을 시작해
  "사용자에게 답변을 전달하지 말라"는 뜻을 나타냅니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 무음 토큰 억제는 대소문자를 구분하지 않으므로, 전체 페이로드가 무음 토큰뿐이라면 `NO_REPLY`와
  `no_reply`가 모두 해당됩니다.
- 이것은 진정한 백그라운드/무전달 턴에만 사용해야 하며,
  일반적인 실행 가능한 사용자 요청을 위한 지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는
부분 청크가 `NO_REPLY`로 시작할 때 **초안/타이핑 스트리밍**도 억제하므로, 무음 작업이 턴 중간에 부분 출력을 유출하지 않습니다.

---

## 압축 전 "메모리 플러시"(구현됨)

목표: 자동 압축이 일어나기 전에 디스크에 영속 상태(예: 에이전트 작업공간의 `memory/YYYY-MM-DD.md`)를 쓰는 무음 에이전트 턴을 실행하여, 압축이 중요한 컨텍스트를 지워버리지 못하게 하는 것입니다.

OpenClaw는 **사전 임계값 플러시** 접근 방식을 사용합니다.

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. 이것이 "소프트 임계값"(Pi 압축 임계값보다 낮음)을 넘으면, 에이전트에 무음
   "지금 메모리를 기록하라" 지시를 실행합니다.
3. 사용자가 아무것도 보지 않도록 정확한 무음 토큰 `NO_REPLY` / `no_reply`를 사용합니다.

구성(`agents.defaults.compaction.memoryFlush`):

- `enabled`(기본값: `true`)
- `softThresholdTokens`(기본값: `4000`)
- `prompt`(플러시 턴용 사용자 메시지)
- `systemPrompt`(플러시 턴에 추가되는 추가 시스템 프롬프트)

참고:

- 기본 `prompt`/`systemPrompt`에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- 플러시는 압축 주기당 한 번 실행됩니다(`sessions.json`에서 추적).
- 플러시는 내장된 Pi 세션에서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 작업공간이 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 플러시는 건너뜁니다.
- 작업공간 파일 레이아웃과 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참조하세요.

Pi는 확장 API에서 `session_before_compact` 훅도 제공하지만, OpenClaw의
플러시 로직은 현재 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)부터 시작해서 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 트랜스크립트가 일치하지 않나요? Gateway 호스트와 `openclaw status`의 저장소 경로를 확인하세요.
- 압축이 과도하게 자주 발생하나요? 다음을 확인하세요.
  - 모델 컨텍스트 윈도우(너무 작은 경우)
  - 압축 설정(모델 윈도우에 비해 `reserveTokens`가 너무 크면 더 이른 압축을 유발할 수 있음)
  - `toolResult` 팽창: 세션 가지치기를 활성화/조정하세요
- 무음 턴이 새고 있나요? 답변이 `NO_REPLY`(대소문자를 구분하지 않는 정확한 토큰)로 시작하는지, 그리고 스트리밍 억제 수정이 포함된 빌드를 사용 중인지 확인하세요.
