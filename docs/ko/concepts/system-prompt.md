---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록, 또는 시간/Heartbeat 섹션 편집하기
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경하기
summary: OpenClaw 시스템 프롬프트에 무엇이 포함되는지와 그것이 조립되는 방식
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-04-24T06:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 구성합니다. 이 프롬프트는 **OpenClaw가 소유**하며 pi-coding-agent의 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조립하여 각 에이전트 실행에 주입합니다.

provider Plugin은 전체 OpenClaw 소유 프롬프트를 대체하지 않으면서 캐시 인지형 프롬프트 지침을 기여할 수 있습니다. provider 런타임은 다음을 할 수 있습니다.

- 소수의 이름 있는 핵심 섹션(`interaction_style`,
  `tool_call_style`, `execution_bias`)을 교체
- 프롬프트 캐시 경계 위에 **안정적인 prefix**를 주입
- 프롬프트 캐시 경계 아래에 **동적인 suffix**를 주입

모델 계열별 튜닝에는 provider 소유 기여를 사용하세요. 레거시
`before_prompt_build` 프롬프트 변형은 호환성 유지나 진짜 전역 프롬프트 변경에만 사용하고, 일반 provider 동작에는 사용하지 마세요.

OpenAI GPT-5 계열 오버레이는 핵심 실행 규칙을 작게 유지하면서 페르소나 고정, 간결한 출력, 도구 규율, 병렬 조회, 결과물 완전성, 검증, 누락된 컨텍스트, 터미널 도구 위생에 대한 모델별 지침을 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정된 섹션을 사용합니다.

- **Tooling**: 구조화된 도구의 source-of-truth 알림 + 런타임 도구 사용 지침.
- **Execution Bias**: 간결한 끝까지 수행 지침: 실행 가능한 요청은 현재 턴에서 처리하고, 완료되거나 막힐 때까지 계속하며, 약한 도구 결과에서는 복구하고, 변경 가능한 상태는 실시간으로 확인하고, 최종화 전에 검증합니다.
- **Safety**: 권력 추구 행동이나 감독 우회를 피하기 위한 짧은 가드레일 알림.
- **Skills**(사용 가능한 경우): 필요할 때 skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw Self-Update**: `config.schema.lookup`으로 config를 안전하게 검사하고,
  `config.patch`로 config를 패치하고, `config.apply`로 전체
  config를 교체하고, 명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법. owner 전용 `gateway` 도구는
  정규화되어 보호된 exec 경로가 되는 레거시 `tools.bash.*`
  별칭을 포함해 `tools.exec.ask` / `tools.exec.security` 재작성도 거부합니다.
- **Workspace**: 작업 디렉터리(`agents.defaults.workspace`).
- **Documentation**: 로컬 OpenClaw 문서 경로(repo 또는 npm package)와 이를 읽어야 하는 경우.
- **Workspace Files (injected)**: 부트스트랩 파일이 아래에 포함된다는 표시.
- **Sandbox**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 상승된 exec 사용 가능 여부를 표시.
- **Current Date & Time**: 사용자 로컬 시간, 시간대, 시간 형식.
- **Reply Tags**: 지원되는 provider용 선택적 응답 태그 문법.
- **Heartbeats**: 기본 에이전트에 Heartbeat가 활성화된 경우의 Heartbeat 프롬프트 및 ack 동작.
- **Runtime**: 호스트, OS, node, 모델, repo 루트(감지된 경우), 사고 수준(한 줄).
- **Reasoning**: 현재 가시성 수준 + /reasoning 전환 힌트.

Tooling 섹션에는 장시간 작업을 위한 런타임 지침도 포함됩니다.

- `exec` sleep 루프, `yieldMs` 지연 트릭, 반복적인 `process`
  폴링 대신 미래 후속 작업(`나중에 다시 확인`, 리마인더, 반복 작업)에는 cron을 사용
- `exec` / `process`는 지금 시작해서 백그라운드에서 계속 실행되는 명령에만 사용
- 자동 완료 wake가 활성화되어 있으면 명령은 한 번만 시작하고, 출력이 발생하거나 실패할 때의 push 기반 wake 경로에 의존
- 실행 중인 명령을 검사해야 할 때는 로그, 상태, 입력, 개입에 `process`를 사용
- 작업이 더 크다면 `sessions_spawn`을 우선 사용. 하위 에이전트 완료는 push 기반이며 요청자에게 자동으로 알림
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프에서 폴링하지 말 것

실험적 `update_plan` 도구가 활성화되면 Tooling은 모델에게 이를 사소하지 않은 다단계 작업에만 사용하고, 정확히 하나의 `in_progress` 단계를 유지하며, 업데이트 후 전체 계획을 반복하지 말라고도 지시합니다.

시스템 프롬프트의 안전 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 수단으로는 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록을 사용하세요. 운영자는 설계상 이것들을 비활성화할 수 있습니다.

네이티브 승인 카드/버튼이 있는 채널에서는 런타임 프롬프트가 이제 에이전트에게 먼저 그 네이티브 승인 UI에 의존하라고 알려줍니다. 도구 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 말하는 경우에만 수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 하위 에이전트용으로 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행마다 `promptMode`를 설정합니다(사용자 대상 config는 아님).

- `full`(기본값): 위의 모든 섹션 포함
- `minimal`: 하위 에이전트에 사용. **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, **Heartbeats**를 생략합니다. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time(알려진 경우), Runtime, 주입된
  컨텍스트는 계속 사용 가능합니다.
- `none`: 기본 ID 줄만 반환

`promptMode=minimal`일 때 추가 주입 프롬프트는 **Group Chat Context** 대신 **Subagent
Context**로 레이블됩니다.

## 워크스페이스 부트스트랩 주입

부트스트랩 파일은 모델이 명시적인 읽기 없이도 ID와 프로필 컨텍스트를 볼 수 있도록 **Project Context** 아래에 잘려서 추가됩니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(완전히 새로운 워크스페이스에서만)
- 존재하는 경우 `MEMORY.md`

이 모든 파일은 **매 턴마다 컨텍스트 윈도우에 주입**되며,
파일별 게이트가 있는 경우만 예외입니다. `HEARTBEAT.md`는 기본 에이전트에서
Heartbeat가 비활성화되어 있거나
`agents.defaults.heartbeat.includeSystemPromptSection`이 false이면 일반 실행에서 생략됩니다. 주입되는
파일은 간결하게 유지하세요. 특히 `MEMORY.md`는 시간이 지날수록 커질 수 있어
예상보다 높은 컨텍스트 사용량과 더 잦은 Compaction으로 이어질 수 있습니다.

> **참고:** `memory/*.md` 일일 파일은 일반 부트스트랩
> Project Context의 일부가 아닙니다. 일반 턴에서는
> `memory_search` 및 `memory_get` 도구를 통해 필요 시 접근하므로,
> 모델이 명시적으로 읽지 않는 한 컨텍스트 윈도우를 차지하지 않습니다. 예외는 일반 `/new` 및
> `/reset` 턴입니다. 런타임은 그 첫 턴에 대해 최근 일일 메모리를 일회성 시작 컨텍스트 블록으로 앞에 붙일 수 있습니다.

큰 파일은 마커와 함께 잘립니다. 파일별 최대 크기는
`agents.defaults.bootstrapMaxChars`(기본값: 12000)로 제어됩니다. 파일 전체에 걸친 총 주입 부트스트랩
콘텐츠는 `agents.defaults.bootstrapTotalMaxChars`
(기본값: 60000)로 제한됩니다. 누락된 파일은 짧은 missing-file 마커를 주입합니다. 잘림이 발생하면
OpenClaw는 Project Context에 경고 블록을 주입할 수 있습니다. 이는
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
기본값: `once`)로 제어합니다.

하위 에이전트 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(다른 부트스트랩 파일은
하위 에이전트 컨텍스트를 작게 유지하기 위해 필터링됨).

내부 hook은 `agent:bootstrap`을 통해 이 단계에 개입하여
주입된 부트스트랩 파일을 변경하거나 교체할 수 있습니다(예:
`SOUL.md`를 대체 페르소나로 바꾸기).

에이전트가 덜 일반적으로 들리게 하고 싶다면
[SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

각 주입 파일이 얼마나 기여하는지(원본 vs 주입본, 잘림 여부, 도구 스키마 오버헤드 포함)를 확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참조하세요.

## 시간 처리

시스템 프롬프트는 사용자 시간대를 알고 있을 때 전용 **Current Date & Time** 섹션을 포함합니다. 프롬프트 캐시를 안정적으로 유지하기 위해 이제 **시간대만** 포함하며(동적인 시계나 시간 형식은 포함하지 않음),

에이전트가 현재 시간이 필요할 때는 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구로 선택적으로 세션별 모델 재정의도 설정할 수 있습니다(`model=default`는 이를 지움).

다음으로 구성하세요.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [Date & Time](/ko/date-time)을 참조하세요.

## Skills

사용 가능한 Skills가 존재하면 OpenClaw는 각 skill의 **파일 경로**를 포함하는 간결한 **사용 가능한 Skills 목록**
(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에게 나열된 위치(워크스페이스, 관리형 또는 번들)에서 SKILL.md를 로드하기 위해 `read`를 사용하라고 지시합니다. 사용할 수 있는 skill이 없으면 Skills 섹션은 생략됩니다.

자격 조건에는 skill 메타데이터 게이트, 런타임 환경/config 검사,
그리고 `agents.defaults.skills` 또는
`agents.list[].skills`가 구성된 경우 유효한 에이전트 skill 허용 목록이 포함됩니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 대상 skill 사용은 가능하게 합니다.

skills 목록 예산은 skills 서브시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 재정의: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한된 런타임 발췌는 다른 표면을 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 skills 크기 조정을 `memory_get`, 라이브 도구 결과, post-compaction AGENTS.md 새로고침 같은 런타임 읽기/주입 크기 조정과 분리해 줍니다.

## 문서

사용 가능할 때 시스템 프롬프트는 로컬 OpenClaw 문서 디렉터리(repo 워크스페이스의 `docs/` 또는 번들 npm
package 문서)를 가리키는 **Documentation** 섹션을 포함하며, 공개 미러, 소스 repo, 커뮤니티 Discord, 그리고 Skills 검색용
ClawHub([https://clawhub.ai](https://clawhub.ai))도 함께 언급합니다. 프롬프트는 모델에게 OpenClaw 동작, 명령, 구성, 아키텍처에 대해서는 먼저 로컬 문서를 참고하고, 가능하면 `openclaw status`를 직접 실행하며(접근 권한이 없을 때만 사용자에게 묻기)라고 지시합니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [컨텍스트 엔진](/ko/concepts/context-engine)
