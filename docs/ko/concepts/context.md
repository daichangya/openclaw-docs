---
read_when:
    - OpenClaw에서 “컨텍스트”가 무엇을 의미하는지 이해하려는 경우
    - 모델이 왜 무언가를 “알고” 있는지(또는 잊었는지) 디버깅하는 경우
    - 컨텍스트 오버헤드(`/context`, `/status`, `/compact`)를 줄이려는 경우
summary: '컨텍스트: 모델이 보는 것, 컨텍스트가 구성되는 방식, 그리고 이를 검사하는 방법'
title: 컨텍스트
x-i18n:
    generated_at: "2026-04-24T06:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

“컨텍스트”는 **실행 시 OpenClaw가 모델에 보내는 모든 것**입니다. 이는 모델의 **컨텍스트 윈도우**(토큰 제한)로 제한됩니다.

초보자용 이해 방식:

- **시스템 프롬프트**(OpenClaw가 구성): 규칙, 도구, Skills 목록, 시간/런타임, 주입된 워크스페이스 파일
- **대화 기록**: 이 세션에서의 사용자 메시지 + 어시스턴트 메시지
- **도구 호출/결과 + 첨부 파일**: 명령 출력, 파일 읽기, 이미지/오디오 등

컨텍스트는 “메모리”와 _같은 것_ 이 아닙니다. 메모리는 디스크에 저장했다가 나중에 다시 불러올 수 있지만, 컨텍스트는 모델의 현재 윈도우 안에 있는 것입니다.

## 빠른 시작(컨텍스트 검사)

- `/status` → “내 윈도우가 얼마나 찼나?”를 빠르게 보는 뷰 + 세션 설정
- `/context list` → 무엇이 주입되었는지 + 대략적인 크기(파일별 + 전체)
- `/context detail` → 더 자세한 분해: 파일별, 도구 스키마 크기별, skill 항목 크기별, 시스템 프롬프트 크기
- `/usage tokens` → 일반 응답에 응답별 사용량 푸터 추가
- `/compact` → 오래된 기록을 간결한 항목으로 요약해 윈도우 공간 확보

추가로 참조: [슬래시 명령](/ko/tools/slash-commands), [토큰 사용 및 비용](/ko/reference/token-use), [Compaction](/ko/concepts/compaction).

## 예시 출력

값은 모델, provider, 도구 정책, 워크스페이스 내용에 따라 달라집니다.

### `/context list`

```
🧠 컨텍스트 분해
Workspace: <workspaceDir>
Bootstrap 최대/파일: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

주입된 워크스페이스 파일:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills 목록(시스템 프롬프트 텍스트): 2,184 chars (~546 tok) (12 skills)
도구: read, edit, write, exec, process, browser, message, sessions_send, …
도구 목록(시스템 프롬프트 텍스트): 1,032 chars (~258 tok)
도구 스키마(JSON): 31,988 chars (~7,997 tok) (컨텍스트에 포함되며, 텍스트로는 표시되지 않음)
도구: (위와 같음)

세션 토큰(캐시됨): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 컨텍스트 분해(상세)
…
상위 skills(프롬프트 항목 크기):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

상위 도구(스키마 크기):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## 컨텍스트 윈도우에 포함되는 것

모델이 받는 모든 것이 포함됩니다. 예:

- 시스템 프롬프트(모든 섹션)
- 대화 기록
- 도구 호출 + 도구 결과
- 첨부 파일/전사본(이미지/오디오/파일)
- Compaction 요약 및 pruning 아티팩트
- provider “wrapper” 또는 숨겨진 헤더(보이지 않아도 포함됨)

## OpenClaw가 시스템 프롬프트를 구성하는 방식

시스템 프롬프트는 **OpenClaw가 소유**하며 실행마다 다시 구성됩니다. 포함 항목:

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만, 아래 참조)
- 워크스페이스 위치
- 시간(UTC + 설정된 경우 변환된 사용자 시간)
- 런타임 메타데이터(호스트/OS/모델/thinking)
- **Project Context** 아래에 주입된 워크스페이스 bootstrap 파일

전체 분해: [시스템 프롬프트](/ko/concepts/system-prompt).

## 주입된 워크스페이스 파일(Project Context)

기본적으로 OpenClaw는 고정된 워크스페이스 파일 집합을 주입합니다(존재하는 경우).

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (첫 실행 시에만)

큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값 `12000` chars)를 사용해 파일별로 잘립니다. OpenClaw는 또한 `agents.defaults.bootstrapTotalMaxChars`(기본값 `60000` chars)를 사용해 파일 전체에 걸친 bootstrap 주입 총량 제한도 적용합니다. `/context`는 **raw 대 injected** 크기와 잘림 발생 여부를 보여줍니다.

잘림이 발생하면 런타임은 Project Context 아래에 프롬프트 내 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`; 기본값 `once`)으로 구성합니다.

## Skills: 주입되는 것 vs 필요 시 로드되는 것

시스템 프롬프트에는 간결한 **Skills 목록**(이름 + 설명 + 위치)이 포함됩니다. 이 목록은 실제 오버헤드를 가집니다.

Skill 지침 자체는 기본적으로 포함되지 않습니다. 모델은 필요할 때만 해당 skill의 `SKILL.md`를 `read`할 것으로 기대됩니다.

## 도구: 비용은 두 가지입니다

도구는 두 가지 방식으로 컨텍스트에 영향을 줍니다.

1. 시스템 프롬프트 안의 **도구 목록 텍스트**(“Tooling”으로 보이는 것)
2. **도구 스키마**(JSON). 모델이 도구를 호출할 수 있도록 전송됩니다. 일반 텍스트로 보이지 않더라도 컨텍스트에 포함됩니다.

`/context detail`은 가장 큰 도구 스키마를 분해해 무엇이 지배적인지 보여줍니다.

## 명령, 지시문, 그리고 "인라인 바로가기"

슬래시 명령은 Gateway가 처리합니다. 몇 가지 서로 다른 동작이 있습니다.

- **독립 명령**: 메시지가 `/...`만으로 이루어져 있으면 명령으로 실행됩니다.
- **지시문**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue`는 모델이 메시지를 보기 전에 제거됩니다.
  - 지시문만 있는 메시지는 세션 설정을 유지합니다.
  - 일반 메시지 안의 인라인 지시문은 메시지별 힌트로 작동합니다.
- **인라인 바로가기**(허용 목록 발신자만): 일반 메시지 안의 특정 `/...` 토큰은 즉시 실행될 수 있으며(예: “hey /status”), 나머지 텍스트를 모델이 보기 전에 제거됩니다.

자세한 내용: [슬래시 명령](/ko/tools/slash-commands).

## 세션, Compaction, pruning(무엇이 유지되는가)

메시지 간 유지되는 것은 메커니즘에 따라 다릅니다.

- **일반 기록**은 정책에 따라 compact/prune될 때까지 세션 transcript에 유지됩니다.
- **Compaction**은 요약을 transcript에 유지하고 최근 메시지는 그대로 둡니다.
- **Pruning**은 컨텍스트 윈도우 공간을 확보하기 위해 _메모리 내_ 프롬프트에서 오래된 도구 결과를 제거하지만, 세션 transcript 자체를 다시 쓰지는 않습니다. 전체 기록은 여전히 디스크에서 검사할 수 있습니다.

문서: [세션](/ko/concepts/session), [Compaction](/ko/concepts/compaction), [세션 pruning](/ko/concepts/session-pruning).

기본적으로 OpenClaw는 조립과
compaction에 내장 `legacy` 컨텍스트 엔진을 사용합니다. `kind: "context-engine"`을 제공하는 plugin을 설치하고
`plugins.slots.contextEngine`으로 선택하면, OpenClaw는 컨텍스트
조립, `/compact`, 그리고 관련 하위 에이전트 컨텍스트 수명 주기 훅을 대신 해당
엔진에 위임합니다. `ownsCompaction: false`는 legacy
엔진으로 자동 대체되지 않습니다. 활성 엔진은 여전히 `compact()`를 올바르게 구현해야 합니다. 전체
플러그형 인터페이스, 수명 주기 훅, 구성은
[Context Engine](/ko/concepts/context-engine)을 참조하세요.

## `/context`가 실제로 보고하는 것

`/context`는 가능할 때 최신 **실행 시 구성된** 시스템 프롬프트 보고서를 우선 사용합니다.

- `System prompt (run)` = 마지막 임베디드(도구 사용 가능) 실행에서 캡처되어 세션 저장소에 유지된 값
- `System prompt (estimate)` = 실행 보고서가 없을 때(또는 실행 보고서를 생성하지 않는 CLI 백엔드를 통해 실행할 때) 즉석에서 계산된 값

어느 쪽이든 크기와 상위 기여 요소를 보고하며, 전체 시스템 프롬프트나 도구 스키마를 덤프하지는 않습니다.

## 관련

- [Context Engine](/ko/concepts/context-engine) — plugins를 통한 사용자 지정 컨텍스트 주입
- [Compaction](/ko/concepts/compaction) — 긴 대화 요약
- [시스템 프롬프트](/ko/concepts/system-prompt) — 시스템 프롬프트가 구성되는 방식
- [에이전트 루프](/ko/concepts/agent-loop) — 전체 에이전트 실행 주기
