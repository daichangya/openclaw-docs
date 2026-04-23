---
read_when:
    - 내장 에이전트 런타임 또는 하네스 레지스트리를 변경하고 있습니다
    - 번들 또는 신뢰된 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 provider와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 내장 에이전트 실행기를 대체하는 Plugin용 실험적 SDK 표면
title: 에이전트 하네스 Plugin
x-i18n:
    generated_at: "2026-04-23T06:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 에이전트 하네스 Plugin

**에이전트 하네스**는 준비된 OpenClaw 에이전트 턴 하나를 위한 저수준 실행기입니다.
이는 모델 provider도 아니고, channel도 아니며, 도구 레지스트리도 아닙니다.

이 표면은 번들 또는 신뢰된 네이티브 Plugin에만 사용하세요. 이 계약은
매개변수 타입이 의도적으로 현재 내장 실행기를 반영하기 때문에 아직 실험적입니다.

## 하네스를 사용해야 하는 경우

모델 계열이 자체 네이티브 세션
런타임을 가지고 있고 일반적인 OpenClaw provider 전송 계층이 잘못된 추상화일 때 에이전트 하네스를 등록하세요.

예시:

- 스레드와 Compaction을 자체적으로 관리하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/도구 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 트랜스크립트 외에 자체 재개 ID가 필요한 모델 런타임

새 LLM API를 추가하기 위해 하네스를 등록해서는 **안 됩니다**. 일반적인 HTTP 또는
WebSocket 모델 API의 경우 [provider plugin](/ko/plugins/sdk-provider-plugins)을 구축하세요.

## core가 계속 소유하는 것

하네스가 선택되기 전에 OpenClaw는 이미 다음을 확인했습니다:

- provider와 모델
- 런타임 인증 상태
- thinking 수준과 컨텍스트 예산
- OpenClaw 트랜스크립트/세션 파일
- 워크스페이스, 샌드박스 및 도구 정책
- channel 응답 콜백과 스트리밍 콜백
- 모델 폴백과 라이브 모델 전환 정책

이 분리는 의도적입니다. 하네스는 준비된 시도를 실행합니다. provider를 선택하거나,
channel 전달을 대체하거나, 조용히 모델을 전환하지 않습니다.

## 하네스 등록

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
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
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

OpenClaw는 provider/모델 확인 후 하네스를 선택합니다:

1. `OPENCLAW_AGENT_RUNTIME=<id>`는 해당 id의 등록된 하네스를 강제합니다.
2. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하네스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 하네스에 확인된 provider/모델을 지원하는지 묻습니다.
4. 일치하는 등록 하네스가 없으면, PI 폴백이 비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin 하네스 실패는 실행 실패로 드러납니다. `auto` 모드에서 PI 폴백은
등록된 Plugin 하네스 중 확인된
provider/모델을 지원하는 것이 없을 때만 사용됩니다. Plugin 하네스가 한 번 실행을 맡으면, OpenClaw는
인증/런타임 의미 체계를 바꾸거나 부수 효과를 중복시킬 수 있기 때문에
동일한 턴을 PI로 다시 실행하지 않습니다.

번들 Codex Plugin은 하네스 id로 `codex`를 등록합니다. core는 이를
일반적인 Plugin 하네스 id로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라
Plugin 또는 operator 구성에 속합니다.

## provider와 하네스의 페어링

대부분의 하네스는 provider도 함께 등록해야 합니다. provider는 모델 ref,
인증 상태, 모델 메타데이터, `/model` 선택을 OpenClaw의 나머지 부분에 보이게 만듭니다.
그런 다음 하네스가 `supports(...)`에서 해당 provider를 맡습니다.

번들 Codex Plugin은 이 패턴을 따릅니다:

- provider id: `codex`
- 사용자 모델 ref: `codex/gpt-5.4`, `codex/gpt-5.2`, 또는 Codex 앱 서버가 반환하는 다른 모델
- harness id: `codex`
- auth: Codex 하네스가 네이티브 Codex 로그인/세션을 소유하므로 합성 provider 가용성
- 앱 서버 요청: OpenClaw는 Codex에 순수 모델 id를 보내고, 하네스가 네이티브 앱 서버 프로토콜과 통신하게 합니다

Codex Plugin은 추가적입니다. 일반 `openai/gpt-*` ref는 계속 OpenAI provider
ref로 유지되며 일반적인 OpenClaw provider 경로를 계속 사용합니다. Codex 관리 인증,
Codex 모델 탐색, 네이티브 스레드, Codex 앱 서버 실행을 원할 때는 `codex/gpt-*`
를 선택하세요. `/model`은 OpenAI provider 자격 증명을 요구하지 않고도
Codex 앱 서버가 반환한 Codex 모델 사이를 전환할 수 있습니다.

operator 설정, 모델 접두사 예시, Codex 전용 구성은
[Codex Harness](/ko/plugins/codex-harness)를 참조하세요.

OpenClaw는 Codex 앱 서버 `0.118.0` 이상을 요구합니다. Codex Plugin은
앱 서버 initialize 핸드셰이크를 확인하고 더 오래되었거나 버전 정보가 없는 서버를 차단하여
OpenClaw가 테스트된 프로토콜 표면에 대해서만 실행되도록 합니다.

### Codex 앱 서버 tool-result 미들웨어

번들 Plugin은 manifest가 `contracts.embeddedExtensionFactories: ["codex-app-server"]`를 선언할 때
`api.registerCodexAppServerExtensionFactory(...)`를 통해 Codex 앱 서버 전용 `tool_result`
미들웨어도 연결할 수 있습니다.
이것은 도구 출력이 OpenClaw 트랜스크립트로 다시 투영되기 전에
네이티브 Codex 하네스 내부에서 실행되어야 하는 비동기 도구 결과 변환을 위한
신뢰된 Plugin 경계입니다.

### 네이티브 Codex 하네스 모드

번들 `codex` 하네스는 내장 OpenClaw
에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들 `codex` Plugin을 활성화하고,
구성이 제한적인 허용 목록을 사용하는 경우 `plugins.allow`에 `codex`를 포함하세요. 이것은
`openai-codex/*`와 다릅니다:

- `openai-codex/*`는 일반적인 OpenClaw provider
  경로를 통해 ChatGPT/Codex OAuth를 사용합니다.
- `codex/*`는 번들 Codex provider를 사용하고 턴을 Codex
  앱 서버를 통해 라우팅합니다.

이 모드가 실행되면 Codex는 네이티브 스레드 id, 재개 동작,
Compaction, 앱 서버 실행을 소유합니다. OpenClaw는 여전히 chat channel,
표시 가능한 트랜스크립트 미러, 도구 정책, 승인, 미디어 전달, 세션
선택을 소유합니다. 실행을 Codex
앱 서버 경로만 맡을 수 있음을 증명해야 한다면
`embeddedHarness.runtime: "codex"`와
`embeddedHarness.fallback: "none"`를 사용하세요. 이 구성은 선택 가드일 뿐입니다:
Codex 앱 서버 실패는 이미 PI를 통한 재시도 없이 직접 실패합니다.

## PI 폴백 비활성화

기본적으로 OpenClaw는 `agents.defaults.embeddedHarness`를
`{ runtime: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서는 등록된 Plugin
하네스가 provider/모델 쌍을 맡을 수 있습니다. 일치하는 것이 없으면 OpenClaw는 PI로 폴백합니다.

누락된 Plugin 하네스 선택이 PI 사용 대신 실패해야 할 때는
`fallback: "none"`를 설정하세요. 선택된 Plugin 하네스 실패는 이미 강하게 실패합니다. 이는
명시적인 `runtime: "pi"` 또는 `OPENCLAW_AGENT_RUNTIME=pi`를 막지 않습니다.

Codex 전용 내장 실행의 경우:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

등록된 어떤 Plugin 하네스라도 일치하는 모델을 맡을 수 있게 하되 OpenClaw가
조용히 PI로 폴백하는 것은 원하지 않는다면 `runtime: "auto"`를 유지하고
폴백을 비활성화하세요:

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

에이전트별 재정의는 동일한 형태를 사용합니다:

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
        "model": "codex/gpt-5.4",
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`를 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화된 경우, 요청된 하네스가
등록되지 않았거나, 확인된 provider/모델을 지원하지 않거나,
턴 부수 효과를 생성하기 전에 실패하면 세션은 일찍 실패합니다. 이는 Codex 전용 배포와
Codex 앱 서버 경로가 실제로 사용 중임을 반드시 증명해야 하는 라이브 테스트를 위한
의도된 동작입니다.

이 설정은 내장 에이전트 하네스만 제어합니다. 이미지,
비디오, 음악, TTS, PDF 또는 기타 provider 전용 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션과 트랜스크립트 미러

하네스는 네이티브 세션 id, 스레드 id 또는 데몬 측 재개 토큰을 유지할 수 있습니다.
그 바인딩을 OpenClaw 세션에 명시적으로 연결된 상태로 유지하고,
사용자에게 보이는 assistant/도구 출력을 OpenClaw 트랜스크립트에 계속 미러링하세요.

OpenClaw 트랜스크립트는 다음을 위한 호환성 계층으로 유지됩니다:

- channel에 표시되는 세션 기록
- 트랜스크립트 검색 및 인덱싱
- 이후 턴에서 내장 PI 하네스로 다시 전환
- 일반적인 `/new`, `/reset`, 세션 삭제 동작

하네스가 사이드카 바인딩을 저장하는 경우, 소유한 OpenClaw 세션이 재설정될 때
OpenClaw가 이를 지울 수 있도록 `reset(...)`를 구현하세요.

## 도구 및 미디어 결과

core는 OpenClaw 도구 목록을 구성하고 이를 준비된 시도에 전달합니다.
하네스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내는 대신
하네스 결과 형태를 통해 도구 결과를 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력이
PI 기반 실행과 동일한 전달 경로에 유지됩니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 별칭은 호환성을 위해 여전히
  `Pi` 이름을 유지합니다.
- 서드파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해질 때까지는
  provider Plugin을 우선 사용하세요.
- 하네스 전환은 턴 간에는 지원됩니다. 네이티브 도구, 승인, assistant 텍스트 또는 메시지
  전송이 시작된 뒤 턴 중간에 하네스를 전환하지 마세요.

## 관련 항목

- [SDK Overview](/ko/plugins/sdk-overview)
- [Runtime Helpers](/ko/plugins/sdk-runtime)
- [Provider Plugins](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [Model Providers](/ko/concepts/model-providers)
