---
read_when:
    - 번들된 Codex app-server 하네스를 사용하고자 하는 경우
    - Codex 모델 참조와 구성 예제가 필요한 경우
    - Codex 전용 배포에서 PI 대체를 비활성화하고자 하는 경우
summary: 번들된 Codex app-server 하네스를 통해 OpenClaw 임베디드 agent 턴 실행하기
title: Codex 하네스
x-i18n:
    generated_at: "2026-04-23T06:04:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 하네스

번들된 `codex` plugin을 사용하면 OpenClaw는 내장 PI 하네스 대신
Codex app-server를 통해 임베디드 agent 턴을 실행할 수 있습니다.

낮은 수준의 agent 세션을 Codex가 소유하도록 하려는 경우 이 방식을 사용합니다.
즉, 모델 탐색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행을 맡깁니다.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구,
승인, 미디어 전달, 사용자에게 보이는 대화 기록 미러를 소유합니다.

네이티브 Codex 턴은 공유 `before_prompt_build`,
`before_compaction`, `after_compaction` plugin hook도 따르므로, 프롬프트 shim과
Compaction 인지 자동화가 PI 하네스와 일치된 상태를 유지할 수 있습니다.
네이티브 Codex 턴은 공유 `before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output`, `agent_end`
plugin hook도 따르므로, 프롬프트 shim, Compaction 인지 자동화,
수명 주기 옵저버가 PI 하네스와 일치된 상태를 유지할 수 있습니다.

이 하네스는 기본적으로 꺼져 있습니다. `codex` plugin이
활성화되어 있고 해결된 모델이 `codex/*` 모델인 경우, 또는
`embeddedHarness.runtime: "codex"`나 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제한 경우에만 선택됩니다.
`codex/*`를 전혀 구성하지 않으면, 기존 PI, OpenAI, Anthropic, Gemini, local,
custom-provider 실행은 현재 동작을 그대로 유지합니다.

## 올바른 모델 접두사 선택

OpenClaw는 OpenAI 접근과 Codex 형태 접근에 대해 별도의 경로를 가집니다.

| Model ref              | 런타임 경로 | 사용 시점 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI 플러밍을 통한 OpenAI provider | `OPENAI_API_KEY`로 직접 OpenAI Platform API에 접근하려는 경우 |
| `openai-codex/gpt-5.4` | PI를 통한 OpenAI Codex OAuth provider | Codex app-server 하네스 없이 ChatGPT/Codex OAuth를 사용하려는 경우 |
| `codex/gpt-5.4`        | 번들된 Codex provider + Codex 하네스 | 임베디드 agent 턴에 네이티브 Codex app-server 실행을 사용하려는 경우 |

Codex 하네스는 `codex/*` 모델 ref에만 적용됩니다. 기존 `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, custom provider ref는
기존의 일반 경로를 유지합니다.

## 요구 사항

- 번들된 `codex` plugin을 사용할 수 있는 OpenClaw
- Codex app-server `0.118.0` 이상
- app-server 프로세스에서 사용할 수 있는 Codex 인증 정보

이 plugin은 더 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다. 이는
OpenClaw가 검증된 프로토콜 표면에서만 동작하도록 하기 위함입니다.

live 및 Docker 스모크 테스트에서는 보통 `OPENAI_API_KEY`와, 선택적으로
`~/.codex/auth.json`, `~/.codex/config.toml` 같은 Codex CLI 파일에서 인증을 가져옵니다.
로컬 Codex app-server에서 사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 구성

`codex/gpt-5.4`를 사용하고, 번들된 plugin을 활성화하고, `codex` 하네스를 강제합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

구성에서 `plugins.allow`를 사용한다면, 여기에 `codex`도 포함하세요.

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` 또는 agent 모델을 `codex/<model>`로 설정하면
번들된 `codex` plugin도 자동으로 활성화됩니다. 그래도 명시적인 plugin 항목은
공유 구성에서 배포 의도를 분명히 보여 주므로 유용합니다.

## 다른 모델을 대체하지 않고 Codex 추가

`codex/*` 모델에는 Codex를, 그 외 모든 것에는 PI를 사용하려면
`runtime: "auto"`를 유지하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

이 구성을 사용하면:

- `/model codex` 또는 `/model codex/gpt-5.4`는 Codex app-server 하네스를 사용합니다.
- `/model gpt` 또는 `/model openai/gpt-5.4`는 OpenAI provider 경로를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면, PI가 호환성 하네스로 유지됩니다.

## Codex 전용 배포

모든 임베디드 agent 턴이
Codex 하네스를 사용함을 보장해야 하는 경우 PI 대체를 비활성화하세요.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

환경 변수 재정의:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

대체가 비활성화된 상태에서는 Codex plugin이 비활성화되어 있거나,
요청된 모델이 `codex/*` ref가 아니거나, app-server가 너무 오래되었거나,
app-server를 시작할 수 없으면 OpenClaw가 초기에 실패합니다.

## agent별 Codex

기본 agent는 일반적인
자동 선택을 유지하면서, 한 agent만 Codex 전용으로 만들 수 있습니다.

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

일반 세션 명령으로 agent와 모델을 전환하세요. `/new`는 새
OpenClaw 세션을 만들고 Codex 하네스는 필요에 따라 해당 사이드카 app-server
스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지웁니다.

## 모델 탐색

기본적으로 Codex plugin은 app-server에 사용 가능한 모델을 요청합니다. 탐색이
실패하거나 시간 초과되면, 번들된 대체 카탈로그를 사용합니다.

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

`plugins.entries.codex.config.discovery` 아래에서 탐색을 조정할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

시작 시 Codex를 조회하지 않고
대체 카탈로그만 사용하려면 탐색을 비활성화하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server 연결 및 정책

기본적으로 이 plugin은 다음 명령으로 로컬에서 Codex를 시작합니다.

```bash
codex app-server --listen stdio://
```

기본적으로 OpenClaw는 로컬 Codex 하네스 세션을 YOLO 모드로 시작합니다.
`approvalPolicy: "never"`, `approvalsReviewer: "user"`,
`sandbox: "danger-full-access"`를 사용합니다. 이는
자율 Heartbeat에 사용되는 신뢰된 로컬 운영자 자세입니다. 응답할 사람이 없는
네이티브 승인 프롬프트에서 멈추지 않고, Codex가 셸과 네트워크 도구를 사용할 수 있습니다.

Codex guardian 검토 승인에 opt-in하려면 `appServer.mode:
"guardian"`을 설정하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

guardian 모드는 다음으로 확장됩니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian은 네이티브 Codex 승인 검토자입니다. Codex가 샌드박스를 벗어나거나,
workspace 밖에 쓰거나, 네트워크 접근 같은 권한을 추가하려고 요청하면,
Codex는 인간 프롬프트 대신 검토자 subagent로 그 승인 요청을 라우팅합니다.
검토자는 컨텍스트를 수집하고 Codex의 위험 프레임워크를 적용한 뒤,
해당 요청을 승인하거나 거부합니다. Guardian은 YOLO 모드보다 더 많은
가드레일이 필요하지만 여전히 무인 agent와 Heartbeat가 진행되어야 할 때 유용합니다.

Docker live 하네스는
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`일 때 Guardian 프로브를 포함합니다.
이 모드는 Guardian 모드로 Codex 하네스를 시작하고,
무해한 권한 상승 셸 명령이 승인되는지 검증하며,
신뢰되지 않은 외부 대상으로의 가짜 비밀 업로드가 거부되어 agent가
명시적 승인을 다시 요청하는지 검증합니다.

개별 정책 필드는 여전히 `mode`보다 우선하므로, 고급 배포에서는
프리셋과 명시적 선택을 혼합할 수 있습니다.

이미 실행 중인 app-server에는 WebSocket 전송을 사용하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

지원되는 `appServer` 필드:

| Field               | 기본값 | 의미 |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다. |
| `command`           | `"codex"`                                | stdio 전송용 실행 파일입니다. |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다. |
| `url`               | unset                                    | WebSocket app-server URL입니다. |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer 토큰입니다. |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다. |
| `requestTimeoutMs`  | `60000`                                  | app-server 컨트롤 플레인 호출의 타임아웃입니다. |
| `mode`              | `"yolo"`                                 | YOLO 또는 guardian 검토 실행용 프리셋입니다. |
| `approvalPolicy`    | `"never"`                                | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다. |
| `sandbox`           | `"danger-full-access"`                   | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드입니다. |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian이 프롬프트를 검토하게 하려면 `"guardian_subagent"`를 사용하세요. |
| `serviceTier`       | unset                                    | 선택적 Codex app-server 서비스 계층: `"fast"`, `"flex"` 또는 `null`. 유효하지 않은 레거시 값은 무시됩니다. |

기존 환경 변수도 해당 구성 필드가 설정되지 않은 경우
로컬 테스트용 대체값으로 계속 동작합니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`는 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`를 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`를 사용하세요. 반복 가능한 배포에서는
나머지 Codex 하네스 설정과 같은 검토 대상 파일 안에 plugin 동작을 함께 유지할 수 있으므로
구성 방식이 권장됩니다.

## 일반적인 레시피

기본 stdio 전송을 사용하는 로컬 Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

PI 대체를 비활성화한 Codex 전용 하네스 검증:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian 검토형 Codex 승인:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

명시적 헤더를 사용하는 원격 app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex 스레드에 연결되어 있으면,
다음 턴은 현재 선택된 `codex/*` 모델, provider, 승인 정책, sandbox, service tier를
다시 app-server로 전송합니다. `codex/gpt-5.4`에서 `codex/gpt-5.2`로 전환하면
스레드 바인딩은 유지되지만, Codex에는 새로 선택된 모델로 계속 진행하라고 요청합니다.

## Codex 명령

번들된 plugin은 인증된 슬래시 명령으로 `/codex`를 등록합니다. 이 명령은
범용적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 작동합니다.

일반적인 형식:

- `/codex status`는 현재 app-server 연결 상태, 모델, 계정, 속도 제한, MCP 서버, Skills를 표시합니다.
- `/codex models`는 현재 Codex app-server 모델 목록을 표시합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 연결된 스레드에 대해 Codex app-server에 Compaction을 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 검토를 시작합니다.
- `/codex account`는 계정 및 속도 제한 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 하네스가 일반 턴에 사용하는 것과 동일한 사이드카 바인딩 파일을 기록합니다.
다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw `codex/*`
모델을 app-server에 전달하며, 확장 히스토리를 계속 활성화한 상태로 유지합니다.

이 명령 표면은 Codex app-server `0.118.0` 이상이 필요합니다. 개별
제어 메서드는 향후 또는 사용자 지정 app-server가 해당 JSON-RPC 메서드를 노출하지 않으면
`unsupported by this Codex app-server`로 보고됩니다.

## 도구, 미디어, Compaction

Codex 하네스는 낮은 수준의 임베디드 agent 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 구성하고 하네스에서 동적 도구 결과를 받습니다.
텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속 일반적인
OpenClaw 전달 경로를 통해 처리됩니다.

Codex가 `_meta.codex_approval_kind`를
`"mcp_tool_call"`로 표시한 경우, Codex MCP 도구 승인 유도는 OpenClaw의 plugin
승인 흐름을 통해 라우팅됩니다. 그 외 유도 및 자유 형식 입력 요청은 계속 fail closed됩니다.

선택된 모델이 Codex 하네스를 사용할 때, 네이티브 스레드 Compaction은
Codex app-server에 위임됩니다. OpenClaw는 채널 히스토리, 검색, `/new`, `/reset`,
그리고 향후 모델 또는 하네스 전환을 위해 대화 기록 미러를 유지합니다. 이
미러에는 사용자 프롬프트, 최종 assistant 텍스트, 그리고 app-server가 이를 내보낼 경우
경량 Codex 추론 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및
완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나,
Compaction 후 Codex가 어떤 항목을 유지했는지에 대한 감사 가능한 목록은 노출하지 않습니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어
이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, `messages.tts` 같은 해당 provider/모델 설정을 사용합니다.

## 문제 해결

**`/model`에 Codex가 나타나지 않음:** `plugins.entries.codex.enabled`를 활성화하고,
`codex/*` 모델 ref를 설정하거나, `plugins.allow`가 `codex`를 제외하고 있는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** 실행을 차지하는 Codex 하네스가 없으면,
OpenClaw는 호환성 백엔드로 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면
`embeddedHarness.runtime: "codex"`를 설정하거나,
일치하는 plugin 하네스가 없을 때 실패하게 하려면 `embeddedHarness.fallback: "none"`을 설정하세요.
Codex app-server가 선택되면, 해당 실패는 추가 대체 구성 없이 직접 표면화됩니다.

**app-server가 거부됨:** app-server 핸드셰이크가
버전 `0.118.0` 이상을 보고하도록 Codex를 업그레이드하세요.

**모델 탐색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나
탐색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 이는 정상입니다. Codex 하네스는
`codex/*` 모델 ref에만 적용됩니다.

## 관련 항목

- [Agent Harness Plugins](/ko/plugins/sdk-agent-harness)
- [Model Providers](/ko/concepts/model-providers)
- [Configuration Reference](/ko/gateway/configuration-reference)
- [Testing](/ko/help/testing#live-codex-app-server-harness-smoke)
