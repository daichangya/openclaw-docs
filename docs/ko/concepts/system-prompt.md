---
read_when:
    - 시스템 프롬프트 텍스트, 도구 목록 또는 시간/Heartbeat 섹션 편집
    - 워크스페이스 부트스트랩 또는 Skills 주입 동작 변경
summary: OpenClaw 시스템 프롬프트에 무엇이 포함되어 있으며 어떻게 조합되는지
title: 시스템 프롬프트
x-i18n:
    generated_at: "2026-04-25T12:24:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw는 모든 에이전트 실행마다 사용자 지정 시스템 프롬프트를 빌드합니다. 이 프롬프트는 **OpenClaw가 소유**하며 pi-coding-agent 기본 프롬프트를 사용하지 않습니다.

프롬프트는 OpenClaw가 조합하여 각 에이전트 실행에 주입합니다.

공급자 Plugin은 OpenClaw가 소유한 전체 프롬프트를 대체하지 않고도 캐시를 인식하는 프롬프트 가이드를 제공할 수 있습니다. 공급자 런타임은 다음을 수행할 수 있습니다.

- 이름이 지정된 소수의 핵심 섹션(`interaction_style`, `tool_call_style`, `execution_bias`) 교체
- 프롬프트 캐시 경계 위에 **안정적인 접두사** 주입
- 프롬프트 캐시 경계 아래에 **동적 접미사** 주입

모델 계열별 튜닝에는 공급자 소유 기여를 사용하세요. 레거시 `before_prompt_build` 프롬프트 변경은 호환성 유지 또는 진정한 전역 프롬프트 변경에만 사용하고, 일반적인 공급자 동작에는 사용하지 마세요.

OpenAI GPT-5 계열 오버레이는 핵심 실행 규칙을 작게 유지하면서 페르소나 고정, 간결한 출력, 도구 사용 규율, 병렬 조회, 전달물 범위, 검증, 누락된 컨텍스트, 터미널 도구 위생에 대한 모델별 가이드를 추가합니다.

## 구조

프롬프트는 의도적으로 간결하며 고정된 섹션을 사용합니다.

- **Tooling**: 구조화된 도구의 기준 정보 알림과 런타임 도구 사용 가이드
- **Execution Bias**: 압축된 후속 수행 가이드. 실행 가능한 요청은 현재 턴에서 처리하고, 완료되거나 막힐 때까지 계속하며, 약한 도구 결과에서 복구하고, 변경 가능한 상태를 실시간으로 확인하며, 최종 응답 전에 검증합니다.
- **Safety**: 권력 추구 행동이나 감독 우회를 피하기 위한 짧은 가드레일 알림
- **Skills**(사용 가능한 경우): 필요 시 Skill 지침을 로드하는 방법을 모델에 알려줍니다.
- **OpenClaw Self-Update**: `config.schema.lookup`으로 구성을 안전하게 검사하고, `config.patch`로 구성을 패치하고, `config.apply`로 전체 구성을 교체하고, 명시적인 사용자 요청이 있을 때만 `update.run`을 실행하는 방법입니다. 소유자 전용 `gateway` 도구는 레거시 `tools.bash.*` 별칭이 해당 보호된 exec 경로로 정규화되는 경우를 포함해 `tools.exec.ask` / `tools.exec.security` 재작성을 거부합니다.
- **Workspace**: 작업 디렉터리(`agents.defaults.workspace`)
- **Documentation**: OpenClaw 문서의 로컬 경로(리포지토리 또는 npm 패키지)와 읽어야 하는 시점
- **Workspace Files (injected)**: 부트스트랩 파일이 아래에 포함된다는 표시
- **Sandbox**(활성화된 경우): 샌드박스 런타임, 샌드박스 경로, 상승된 exec 사용 가능 여부를 표시
- **Current Date & Time**: 사용자 로컬 시간, 시간대, 시간 형식
- **Reply Tags**: 지원되는 공급자를 위한 선택적 답장 태그 문법
- **Heartbeats**: 기본 에이전트에 대해 Heartbeat가 활성화된 경우 Heartbeat 프롬프트와 ack 동작
- **Runtime**: 호스트, OS, node, 모델, 리포지토리 루트(감지된 경우), 사고 수준(한 줄)
- **Reasoning**: 현재 가시성 수준 + /reasoning 전환 힌트

Tooling 섹션에는 장시간 실행 작업에 대한 런타임 가이드도 포함됩니다.

- 미래의 후속 작업(`나중에 다시 확인`, 리마인더, 반복 작업)에는 `exec` sleep 루프, `yieldMs` 지연 꼼수, 반복적인 `process` 폴링 대신 Cron을 사용합니다.
- 지금 시작해서 백그라운드에서 계속 실행되는 명령에만 `exec` / `process`를 사용합니다.
- 자동 완료 웨이크가 활성화되어 있으면 명령은 한 번만 시작하고, 출력이 발생하거나 실패할 때 push 기반 웨이크 경로에 의존합니다.
- 실행 중인 명령의 로그, 상태, 입력, 개입을 검사해야 할 때는 `process`를 사용합니다.
- 작업이 더 크면 `sessions_spawn`을 우선 사용합니다. 서브에이전트 완료는 push 기반이며 요청자에게 자동으로 알려집니다.
- 완료를 기다리기 위해 `subagents list` / `sessions_list`를 루프에서 폴링하지 마세요.

실험적 `update_plan` 도구가 활성화되면 Tooling은 모델에게 이것을 사소하지 않은 다단계 작업에만 사용하고, 정확히 하나의 `in_progress` 단계만 유지하며, 각 업데이트 뒤에 전체 계획을 반복하지 말라고도 지시합니다.

시스템 프롬프트의 Safety 가드레일은 권고 사항입니다. 모델 동작을 안내하지만 정책을 강제하지는 않습니다. 강제 적용에는 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록을 사용하세요. 운영자는 설계상 이를 비활성화할 수 있습니다.

기본 승인 카드/버튼을 지원하는 채널에서는 런타임 프롬프트가 이제 에이전트에게 먼저 해당 기본 승인 UI에 의존하라고 알려줍니다. 도구 결과에서 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 명시하는 경우에만 수동 `/approve` 명령을 포함해야 합니다.

## 프롬프트 모드

OpenClaw는 서브에이전트를 위해 더 작은 시스템 프롬프트를 렌더링할 수 있습니다. 런타임은 각 실행에 대해 `promptMode`를 설정합니다(사용자 대상 구성은 아님).

- `full`(기본값): 위의 모든 섹션을 포함합니다.
- `minimal`: 서브에이전트에 사용되며 **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies**, **Heartbeats**를 생략합니다. Tooling, **Safety**, Workspace, Sandbox, Current Date & Time(알려진 경우), Runtime, 주입된 컨텍스트는 계속 사용할 수 있습니다.
- `none`: 기본 정체성 줄만 반환합니다.

`promptMode=minimal`일 때 추가 주입 프롬프트에는 **Group Chat Context** 대신 **Subagent Context**라는 레이블이 붙습니다.

## Workspace 부트스트랩 주입

부트스트랩 파일은 명시적으로 읽지 않아도 모델이 정체성과 프로필 컨텍스트를 볼 수 있도록 **Project Context** 아래에 잘려서 추가됩니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(새 워크스페이스에서만)
- `MEMORY.md`(존재하는 경우)

이 모든 파일은 **파일별 게이트가 적용되지 않는 한** 매 턴마다 **컨텍스트 창에 주입**됩니다. `HEARTBEAT.md`는 기본 에이전트에서 Heartbeat가 비활성화되어 있거나 `agents.defaults.heartbeat.includeSystemPromptSection`이 false일 때 일반 실행에서는 생략됩니다. 주입되는 파일은 간결하게 유지하세요. 특히 `MEMORY.md`는 시간이 지날수록 커질 수 있어 예상보다 높은 컨텍스트 사용량과 더 잦은 Compaction으로 이어질 수 있습니다.

> **참고:** `memory/*.md` 일일 파일은 일반적인 부트스트랩 Project Context의 일부가 **아닙니다**. 일반 턴에서는 `memory_search` 및 `memory_get` 도구를 통해 필요할 때 접근하므로, 모델이 명시적으로 읽지 않는 한 컨텍스트 창을 차지하지 않습니다. 예외는 순수 `/new` 및 `/reset` 턴입니다. 이 첫 턴에서는 런타임이 최근 일일 메모리를 일회성 시작 컨텍스트 블록으로 앞에 붙일 수 있습니다.

큰 파일은 마커와 함께 잘립니다. 파일당 최대 크기는 `agents.defaults.bootstrapMaxChars`(기본값: 12000)로 제어됩니다. 파일 전체에 걸친 총 주입 부트스트랩 콘텐츠는 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. 누락된 파일은 짧은 누락 파일 마커를 주입합니다. 잘림이 발생하면 OpenClaw는 Project Context에 경고 블록을 주입할 수 있습니다. 이는 `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`; 기본값: `once`)로 제어합니다.

서브에이전트 세션은 `AGENTS.md`와 `TOOLS.md`만 주입합니다(서브에이전트 컨텍스트를 작게 유지하기 위해 다른 부트스트랩 파일은 필터링됨).

내부 훅은 `agent:bootstrap`을 통해 이 단계를 가로채 주입된 부트스트랩 파일을 변경하거나 교체할 수 있습니다(예: `SOUL.md`를 대체 페르소나로 교체).

에이전트가 덜 일반적으로 들리게 하고 싶다면 [SOUL.md Personality Guide](/ko/concepts/soul)부터 시작하세요.

주입된 각 파일의 기여도(원본 대비 주입본, 잘림 여부, 도구 스키마 오버헤드 포함)를 검사하려면 `/context list` 또는 `/context detail`을 사용하세요. 자세한 내용은 [Context](/ko/concepts/context)를 참조하세요.

## 시간 처리

사용자 시간대를 알고 있으면 시스템 프롬프트에는 전용 **Current Date & Time** 섹션이 포함됩니다. 프롬프트 캐시를 안정적으로 유지하기 위해 이제 이 섹션에는 **시간대**만 포함되며(동적인 시계나 시간 형식은 포함되지 않음) 있습니다.

에이전트에 현재 시간이 필요하면 `session_status`를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다. 같은 도구는 선택적으로 세션별 모델 재정의도 설정할 수 있습니다(`model=default`는 이를 지움).

다음으로 구성합니다.

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

전체 동작 세부 정보는 [Date & Time](/ko/date-time)을 참조하세요.

## Skills

조건에 맞는 Skill이 있으면 OpenClaw는 각 Skill의 **파일 경로**를 포함한 간결한 **사용 가능한 Skills 목록**(`formatSkillsForPrompt`)을 주입합니다. 프롬프트는 모델에게 나열된 위치(워크스페이스, 관리형 또는 번들)의 SKILL.md를 로드하기 위해 `read`를 사용하라고 지시합니다. 조건에 맞는 Skill이 없으면 Skills 섹션은 생략됩니다.

조건 충족 여부에는 Skill 메타데이터 게이트, 런타임 환경/구성 검사, 그리고 `agents.defaults.skills` 또는 `agents.list[].skills`가 구성된 경우 유효한 에이전트 Skill 허용 목록이 포함됩니다.

Plugin에 번들된 Skills는 해당 Plugin이 활성화된 경우에만 조건을 충족합니다. 이를 통해 도구 Plugin은 그 모든 가이드를 각 도구 설명에 직접 포함하지 않고도 더 깊은 운영 가이드를 노출할 수 있습니다.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

이렇게 하면 기본 프롬프트를 작게 유지하면서도 대상화된 Skill 사용을 가능하게 합니다.

Skills 목록 예산은 Skills 하위 시스템이 소유합니다.

- 전역 기본값: `skills.limits.maxSkillsPromptChars`
- 에이전트별 재정의: `agents.list[].skillsLimits.maxSkillsPromptChars`

일반적인 제한 런타임 발췌는 다른 표면을 사용합니다.

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

이 분리는 Skills 크기 조정을 `memory_get`, 실시간 도구 결과, Compaction 후 AGENTS.md 새로고침 같은 런타임 읽기/주입 크기 조정과 분리합니다.

## Documentation

시스템 프롬프트에는 **Documentation** 섹션이 포함됩니다. 로컬 문서를 사용할 수 있으면 로컬 OpenClaw 문서 디렉터리(Git 체크아웃의 `docs/` 또는 번들된 npm 패키지 문서)를 가리킵니다. 로컬 문서를 사용할 수 없으면 [https://docs.openclaw.ai](https://docs.openclaw.ai)로 대체됩니다.

같은 섹션에는 OpenClaw 소스 위치도 포함됩니다. Git 체크아웃은 로컬 소스 루트를 노출하므로 에이전트가 코드를 직접 검사할 수 있습니다. 패키지 설치는 GitHub 소스 URL을 포함하며, 문서가 불완전하거나 오래된 경우 সেখানে 소스를 검토하라고 에이전트에 지시합니다. 또한 프롬프트는 public docs mirror, 커뮤니티 Discord, 그리고 Skills 검색을 위한 ClawHub([https://clawhub.ai](https://clawhub.ai))도 언급합니다. 이 프롬프트는 OpenClaw 동작, 명령, 구성, 아키텍처에 대해서는 먼저 문서를 참조하고, 가능하면 `openclaw status`를 직접 실행하며(접근 권한이 없을 때만 사용자에게 묻도록) 모델에 지시합니다.

## 관련 항목

- [Agent runtime](/ko/concepts/agent)
- [Agent workspace](/ko/concepts/agent-workspace)
- [Context engine](/ko/concepts/context-engine)
