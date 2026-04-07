---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려는 경우
summary: OpenClaw에서 API 키 또는 Claude CLI를 통해 Anthropic Claude 사용하기
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T05:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic은 **Claude** 모델 계열을 개발하며 API와
Claude CLI를 통해 접근을 제공합니다. OpenClaw에서는 Anthropic API 키와 Claude CLI 재사용을 모두
지원합니다. 기존 레거시 Anthropic token profile이 이미 구성되어 있다면
런타임에서 계속 적용됩니다.

<Warning>
Anthropic 직원이 OpenClaw 방식의 Claude CLI 사용이 다시 허용된다고 알려주었으므로,
Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을
이 통합에서 허용된 것으로 간주합니다.

장기간 실행되는 gateway 호스트의 경우, Anthropic API 키가 여전히 가장 명확하고
예측 가능한 프로덕션 경로입니다. 호스트에서 이미 Claude CLI를 사용 중이라면,
OpenClaw가 해당 로그인을 직접 재사용할 수 있습니다.

Anthropic의 현재 공개 문서:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

가장 명확한 과금 경로를 원한다면 대신 Anthropic API 키를 사용하세요.
OpenClaw는 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding Plan](/ko/providers/qwen),
[MiniMax Coding Plan](/ko/providers/minimax), [Z.AI / GLM Coding
Plan](/ko/providers/glm) 등 다른 구독형 옵션도 지원합니다.
</Warning>

## 옵션 A: Anthropic API 키

**적합한 경우:** 표준 API 접근 및 사용량 기반 과금.
Anthropic Console에서 API 키를 생성하세요.

### CLI 설정

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Anthropic config 스니펫

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinking 기본값 (Claude 4.6)

- Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않은 경우 OpenClaw에서 기본적으로 `adaptive` thinking을 사용합니다.
- 메시지별(`/think:<level>`) 또는 model params의 `agents.defaults.models["anthropic/<model>"].params.thinking`으로 재정의할 수 있습니다.
- 관련 Anthropic 문서:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast mode (Anthropic API)

OpenClaw의 공통 `/fast` 토글은 `api.anthropic.com`으로 전송되는 API 키 및 OAuth 인증 요청을 포함한 직접적인 공개 Anthropic 트래픽도 지원합니다.

- `/fast on`은 `service_tier: "auto"`에 매핑됩니다
- `/fast off`는 `service_tier: "standard_only"`에 매핑됩니다
- Config 기본값:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

중요한 제한 사항:

- OpenClaw는 직접 `api.anthropic.com` 요청에 대해서만 Anthropic service tier를 주입합니다. `anthropic/*`를 프록시나 gateway를 통해 라우팅하는 경우 `/fast`는 `service_tier`를 변경하지 않습니다.
- 명시적인 Anthropic `serviceTier` 또는 `service_tier` model params가 설정되면 `/fast` 기본값보다 우선합니다.
- Anthropic은 응답의 `usage.service_tier` 아래에 실제 적용된 tier를 보고합니다. Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 여전히 `standard`로 해석될 수 있습니다.

## 프롬프트 캐싱 (Anthropic API)

OpenClaw는 Anthropic의 프롬프트 캐싱 기능을 지원합니다. 이것은 **API 전용**이며, 레거시 Anthropic token 인증은 캐시 설정을 적용하지 않습니다.

### 구성

model config에서 `cacheRetention` 파라미터를 사용하세요:

| Value   | 캐시 기간 | 설명 |
| ------- | --------- | ---- |
| `none`  | 캐싱 없음 | 프롬프트 캐싱 비활성화 |
| `short` | 5분 | API 키 인증의 기본값 |
| `long`  | 1시간 | 확장 캐시 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### 기본값

Anthropic API 키 인증을 사용할 때 OpenClaw는 모든 Anthropic 모델에 대해 자동으로 `cacheRetention: "short"`(5분 캐시)를 적용합니다. config에서 `cacheRetention`을 명시적으로 설정해 이 값을 재정의할 수 있습니다.

### 에이전트별 cacheRetention 재정의

model 수준 params를 기준값으로 사용하고, `agents.list[].params`를 통해 특정 agent만 재정의하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // 대부분의 agent용 기준값
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // 이 agent에만 적용되는 재정의
    ],
  },
}
```

캐시 관련 params의 config 병합 순서:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id`가 일치하는 항목, 키별로 재정의)

이를 통해 같은 model을 사용하는 한 agent는 장기 캐시를 유지하고, 다른 agent는 급증하거나 재사용률이 낮은 트래픽에서 쓰기 비용을 피하기 위해 캐싱을 비활성화할 수 있습니다.

### Bedrock Claude 참고

- Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 구성 시 `cacheRetention` 전달을 허용합니다.
- Anthropic이 아닌 Bedrock 모델은 런타임에서 강제로 `cacheRetention: "none"`이 됩니다.
- Anthropic API 키 스마트 기본값은 명시적인 값이 설정되지 않은 경우 Claude-on-Bedrock model ref에도 `cacheRetention: "short"`를 기본 적용합니다.

## 1M context window (Anthropic beta)

Anthropic의 1M context window는 beta로 제한됩니다. OpenClaw에서는 지원되는 Opus/Sonnet 모델에 대해
`params.context1m: true`로 model별 활성화할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw는 이를 Anthropic
요청에서 `anthropic-beta: context-1m-2025-08-07`로 매핑합니다.

이 기능은 해당 model에 대해 `params.context1m`이 명시적으로 `true`로 설정된 경우에만
활성화됩니다.

요구 사항: 해당 credential에 대해 Anthropic이 장문맥 사용을 허용해야 합니다.

참고: Anthropic은 현재
레거시 Anthropic token 인증(`sk-ant-oat-*`)을 사용할 때 `context-1m-*` beta 요청을 거부합니다. 이
레거시 인증 모드에서 `context1m: true`를 구성하면 OpenClaw는 경고를 기록하고
필수 OAuth beta는 유지하면서 context1m beta
header를 건너뛰어 표준 context window로 fallback합니다.

## Claude CLI backend

번들 Anthropic `claude-cli` backend는 OpenClaw에서 지원됩니다.

- Anthropic 직원이 이 사용 방식이 다시 허용된다고 알려주었습니다.
- 따라서 Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을
  이 통합에서 허용된 것으로 간주합니다.
- Anthropic API 키는 상시 실행되는 gateway
  호스트와 명시적인 서버 측 과금 제어를 위한 가장 명확한 프로덕션 경로로 남아 있습니다.
- 설정 및 런타임 세부 사항은 [/gateway/cli-backends](/ko/gateway/cli-backends)에 있습니다.

## 참고

- Anthropic의 공개 Claude Code 문서는 여전히
  `claude -p` 같은 직접 CLI 사용을 문서화하고 있으며, Anthropic 직원도 OpenClaw 방식의 Claude CLI 사용이
  다시 허용된다고 알려주었습니다. Anthropic이
  새로운 정책 변경을 발표하지 않는 한 이 지침을 확정된 것으로 보고 있습니다.
- Anthropic setup-token은 OpenClaw에서 계속 지원되는 token 인증 경로로 제공되지만, 이제 OpenClaw는 가능할 때 Claude CLI 재사용과 `claude -p`를 우선합니다.
- 인증 세부 사항 및 재사용 규칙은 [/concepts/oauth](/ko/concepts/oauth)에 있습니다.

## 문제 해결

**401 오류 / token이 갑자기 유효하지 않음**

- Anthropic token 인증은 만료되거나 취소될 수 있습니다.
- 새 설정의 경우 Anthropic API 키로 마이그레이션하세요.

**provider "anthropic"에 대한 API 키를 찾을 수 없음**

- 인증은 **agent별**입니다. 새 agent는 메인 agent의 키를 상속하지 않습니다.
- 해당 agent에 대해 onboarding을 다시 실행하거나 gateway
  호스트에 API 키를 구성한 뒤 `openclaw models status`로 확인하세요.

**profile `anthropic:default`에 대한 credential을 찾을 수 없음**

- 어떤 인증 profile이 활성 상태인지 보려면 `openclaw models status`를 실행하세요.
- onboarding을 다시 실행하거나 해당 profile 경로에 대한 API 키를 구성하세요.

**사용 가능한 auth profile이 없음(모두 cooldown/unavailable 상태)**

- `auth.unusableProfiles`를 확인하려면 `openclaw models status --json`을 사용하세요.
- Anthropic rate limit cooldown은 model 범위일 수 있으므로, 현재 모델이 cooldown 중이어도 다른 Anthropic
  모델은 여전히 사용할 수 있습니다.
- 다른 Anthropic profile을 추가하거나 cooldown이 끝날 때까지 기다리세요.

더 보기: [/gateway/troubleshooting](/ko/gateway/troubleshooting) 및 [/help/faq](/ko/help/faq).
