---
read_when:
    - 내장 에이전트 런타임 또는 하니스 레지스트리를 변경하고 있습니다
    - 번들 또는 신뢰된 Plugin에서 에이전트 하니스를 등록하고 있습니다
    - Codex Plugin이 모델 provider와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 내장 에이전트 실행기를 대체하는 Plugin용 실험적 SDK 표면
title: 에이전트 하니스 Plugin
x-i18n:
    generated_at: "2026-04-24T06:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

에이전트 하니스는 준비된 OpenClaw 에이전트 턴 하나를 실행하는 저수준 실행기입니다. 모델 provider도 아니고, 채널도 아니며, 도구 레지스트리도 아닙니다.

이 표면은 번들 또는 신뢰된 네이티브 Plugin에만 사용하세요. 계약은 의도적으로 현재 내장 러너를 반영하는 파라미터 타입을 사용하므로 아직 실험적입니다.

## 하니스를 언제 사용하나요

모델 계열이 자체 네이티브 세션 런타임을 가지고 있고, 일반 OpenClaw provider 전송이 잘못된 추상화일 때 에이전트 하니스를 등록하세요.

예시:

- 스레드와 Compaction을 소유하는 네이티브 coding-agent 서버
- 네이티브 plan/reasoning/tool 이벤트를 스트리밍해야 하는 로컬 CLI 또는 daemon
- OpenClaw 세션 transcript 외에 자체 resume ID가 필요한 모델 런타임

단순히 새 LLM API를 추가하기 위해 하니스를 등록하지는 마세요. 일반적인 HTTP 또는
WebSocket 모델 API에는 [provider Plugin](/ko/plugins/sdk-provider-plugins)을 만드세요.

## core가 계속 소유하는 것

하니스가 선택되기 전에 OpenClaw는 이미 다음을 해석했습니다.

- provider 및 모델
- 런타임 인증 상태
- 사고 수준 및 컨텍스트 예산
- OpenClaw transcript/세션 파일
- 워크스페이스, sandbox, 도구 정책
- 채널 응답 콜백 및 스트리밍 콜백
- 모델 폴백 및 실제 모델 전환 정책

이 분리는 의도적입니다. 하니스는 준비된 시도를 실행할 뿐이며, provider를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

## 하니스 등록

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // 네이티브 스레드를 시작하거나 재개합니다.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, 그리고 그 외 준비된 시도 필드를 사용하세요.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 선택 정책

OpenClaw는 provider/model 해석 후 하니스를 선택합니다.

1. 기존 세션에 기록된 하니스 ID가 우선하므로 config/env 변경이 그 transcript를 다른 런타임으로 즉시 전환하지 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 아직 고정되지 않은 세션에 대해 해당 ID의 등록된 하니스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하니스를 강제합니다.
4. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 하니스에게 해석된 provider/model을 지원하는지 묻습니다.
5. 일치하는 등록 하니스가 없으면 PI 폴백이 비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin 하니스 실패는 실행 실패로 노출됩니다. `auto` 모드에서는 등록된 Plugin 하니스가 해석된
provider/model을 지원하지 않을 때만 PI 폴백이 사용됩니다. Plugin 하니스가 실행을 일단 점유한 후에는 OpenClaw는 동일한
턴을 PI로 다시 실행하지 않습니다. 이는 인증/런타임 의미를 바꾸거나 부작용을 중복시킬 수 있기 때문입니다.

선택된 하니스 ID는 내장 실행 후 세션 ID와 함께 영구 저장됩니다.
하니스 고정이 도입되기 전에 생성된 레거시 세션은 transcript 기록이 있는 경우 PI 고정으로 취급됩니다. PI와
네이티브 Plugin 하니스 사이를 바꾸려면 새 세션/재설정 세션을 사용하세요. `/status`는 기본값이 아닌 하니스 ID(예: `codex`)를 `Fast` 옆에 표시합니다. PI는 기본 호환 경로이므로 숨겨집니다.
선택된 하니스가 예상과 다르다면 `agents/harness` 디버그 로깅을 활성화하고 gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에는 선택된 하니스 ID, 선택 사유, 런타임/폴백 정책, 그리고 `auto` 모드일 때 각 Plugin 후보의 지원 결과가 포함됩니다.

번들 Codex Plugin은 `codex`를 하니스 ID로 등록합니다. core는 이를 일반적인 Plugin 하니스 ID로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라 Plugin 또는 운영자 config에 속해야 합니다.

## provider와 하니스의 페어링

대부분의 하니스는 provider도 함께 등록해야 합니다. provider는 모델 ref,
인증 상태, 모델 메타데이터, `/model` 선택을 나머지 OpenClaw에 보이게 합니다. 그런 다음 하니스는 `supports(...)`에서 해당 provider를 점유합니다.

번들 Codex Plugin은 이 패턴을 따릅니다.

- provider ID: `codex`
- 사용자 모델 ref: `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"`; 레거시 `codex/gpt-*` ref는 호환성을 위해 계속 허용됨
- harness ID: `codex`
- auth: synthetic provider 가용성. Codex 하니스가 네이티브 Codex 로그인/세션을 소유하기 때문
- app-server 요청: OpenClaw는 Codex에 순수 모델 ID만 보내고, 하니스가 네이티브 app-server 프로토콜과 통신하게 함

Codex Plugin은 additive입니다. 일반 `openai/gpt-*` ref는 `embeddedHarness.runtime: "codex"`로 Codex 하니스를 강제하지 않는 한 계속 일반 OpenClaw provider 경로를 사용합니다. 오래된 `codex/gpt-*` ref는 호환성을 위해 여전히 Codex provider와 하니스를 선택합니다.

운영자 설정, 모델 접두사 예시, Codex 전용 config는
[Codex Harness](/ko/plugins/codex-harness)를 참조하세요.

OpenClaw는 Codex app-server `0.118.0` 이상을 요구합니다. Codex Plugin은
app-server initialize 핸드셰이크를 확인하고 더 오래되었거나 버전이 없는 서버는 차단하여, OpenClaw가 테스트된 프로토콜 표면에 대해서만 실행되도록 합니다.

### Codex app-server tool-result 미들웨어

번들 Plugin은 manifest에 `contracts.embeddedExtensionFactories: ["codex-app-server"]`를 선언할 때 `api.registerCodexAppServerExtensionFactory(...)`를 통해 Codex app-server 전용 `tool_result`
미들웨어도 연결할 수 있습니다.
이것은 네이티브 Codex 하니스 내부에서 도구 출력이 OpenClaw transcript로 다시 투영되기 전에 비동기 tool-result 변환을 실행해야 하는 신뢰된 Plugin용 연결 지점입니다.

### 네이티브 Codex 하니스 모드

번들 `codex` 하니스는 내장 OpenClaw
에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들 `codex` Plugin을 활성화하고, config에서 제한적인 허용 목록을 사용하는 경우 `plugins.allow`에 `codex`를 포함하세요. 네이티브 app-server config는 `openai/gpt-*`와 `embeddedHarness.runtime: "codex"`를 사용해야 합니다.
대신 PI를 통한 Codex OAuth에는 `openai-codex/*`를 사용하세요. 레거시 `codex/*`
모델 ref는 네이티브 하니스용 호환 별칭으로 남아 있습니다.

이 모드가 실행될 때 Codex는 네이티브 스레드 ID, resume 동작,
Compaction, app-server 실행을 소유합니다. OpenClaw는 여전히 채팅 채널,
보이는 transcript 미러, 도구 정책, 승인, 미디어 전달, 세션 선택을 소유합니다. 실행을 오직 Codex
app-server 경로만 점유하는지 증명해야 할 때는 `embeddedHarness.runtime: "codex"`와
`embeddedHarness.fallback: "none"`을 사용하세요. 이 config는 선택 가드일 뿐입니다:
Codex app-server 실패는 이미 PI를 통한 재시도 없이 직접 실패합니다.

## PI 폴백 비활성화

기본적으로 OpenClaw는 `agents.defaults.embeddedHarness`를
`{ runtime: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서는 등록된 Plugin
하니스가 provider/model 쌍을 점유할 수 있습니다. 일치하는 것이 없으면 OpenClaw는 PI로 폴백합니다.

누락된 Plugin 하니스 선택이 PI를 사용하는 대신 실패하게 해야 할 때는
`fallback: "none"`을 설정하세요. 선택된 Plugin 하니스 실패는 이미 강하게 실패합니다.
이것은 명시적인 `runtime: "pi"` 또는 `OPENCLAW_AGENT_RUNTIME=pi`를 막지 않습니다.

Codex 전용 내장 실행의 경우:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

등록된 모든 Plugin 하니스가 일치하는 모델을 점유할 수 있게 하되, OpenClaw가 조용히 PI로 폴백하는 것은 원하지 않는다면 `runtime: "auto"`를 유지하고 폴백을 비활성화하세요.

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

에이전트별 재정의도 같은 형태를 사용합니다.

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`는 여전히 구성된 런타임을 재정의합니다.
환경에서 PI 폴백을 비활성화하려면
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화되면, 요청한 하니스가 등록되지 않았거나,
해석된 provider/model을 지원하지 않거나,
턴 부작용을 만들기 전에 실패하면 세션은 일찍 실패합니다. 이는 Codex 전용 배포와 Codex app-server 경로가 실제로 사용되고 있음을 증명해야 하는 라이브 테스트에 의도된 동작입니다.

이 설정은 내장 에이전트 하니스만 제어합니다. 이미지, 비디오, 음악, TTS, PDF 또는 기타 provider별 모델 라우팅을 비활성화하지는 않습니다.

## 네이티브 세션과 transcript 미러

하니스는 네이티브 세션 ID, 스레드 ID 또는 daemon 측 resume 토큰을 유지할 수 있습니다.
이 바인딩은 OpenClaw 세션에 명시적으로 연결된 상태로 유지하고,
사용자에게 보이는 assistant/tool 출력을 OpenClaw transcript에 계속 미러링하세요.

OpenClaw transcript는 다음에 대한 호환 계층으로 남습니다.

- 채널에 보이는 세션 기록
- transcript 검색 및 인덱싱
- 이후 턴에서 내장 PI 하니스로 되돌리기
- 일반 `/new`, `/reset`, 세션 삭제 동작

하니스가 sidecar 바인딩을 저장한다면, 소유한 OpenClaw 세션이 재설정될 때 OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

core는 OpenClaw 도구 목록을 구성해 준비된 시도에 전달합니다.
하니스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내는 대신
하니스 결과 형태를 통해 도구 결과를 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력이
PI 기반 실행과 같은 전달 경로를 유지합니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 별칭은
  호환성을 위해 여전히 `Pi` 이름을 가지고 있습니다.
- 타사 하니스 설치는 실험적입니다. 네이티브 세션 런타임이 필요한 경우가 아니라면
  provider Plugin을 우선하세요.
- 하니스 전환은 턴 사이에서는 지원됩니다. 네이티브 도구, 승인, assistant 텍스트 또는 메시지 전송이 시작된 뒤에는
  턴 중간에 하니스를 바꾸지 마세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 도우미](/ko/plugins/sdk-runtime)
- [Provider Plugins](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [모델 provider](/ko/concepts/model-providers)
