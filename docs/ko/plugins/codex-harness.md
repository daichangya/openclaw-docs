---
read_when:
    - 번들 Codex app-server 하니스를 사용하려고 합니다.
    - Codex 모델 ref와 config 예시가 필요합니다.
    - Codex 전용 배포를 위해 PI 대체 경로를 비활성화하려고 합니다.
summary: 번들 Codex app-server 하니스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하니스
x-i18n:
    generated_at: "2026-04-24T06:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

번들 `codex` Plugin은 OpenClaw가 기본 제공 PI 하니스 대신 Codex app-server를 통해 임베디드 에이전트 턴을 실행할 수 있게 합니다.

Codex가 저수준 에이전트 세션(모델 검색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행)을 소유하도록 하려면 이를 사용하세요. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구, 승인, 미디어 전송, 사용자에게 보이는 대화 기록 미러를 소유합니다.

네이티브 Codex 턴은 공개 호환성 계층으로 OpenClaw Plugin 훅을 계속 유지합니다.
이것들은 Codex `hooks.json` 명령 훅이 아니라 OpenClaw 내부 프로세스 훅입니다.

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 미러링된 대화 기록 레코드용 `before_message_write`
- `agent_end`

번들 Plugins는 비동기 `tool_result` 미들웨어를 추가하기 위한 Codex app-server 확장 팩토리도 등록할 수 있습니다. 이 미들웨어는 OpenClaw가 도구를 실행한 뒤, 그 결과가 Codex로 반환되기 전에 OpenClaw 동적 도구에 대해 실행됩니다. 이것은 OpenClaw 소유의 대화 기록 도구 결과 쓰기를 변환하는 공개 `tool_result_persist` Plugin 훅과는 별개입니다.

하니스는 기본적으로 비활성화되어 있습니다. 새 config는 OpenAI 모델 ref를 `openai/gpt-*` 형태로 표준적으로 유지하고, 네이티브 app-server 실행이 필요할 때만 `embeddedHarness.runtime: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제해야 합니다. 레거시 `codex/*` 모델 ref는 호환성을 위해 여전히 자동으로 하니스를 선택합니다.

## 올바른 모델 접두사 선택

OpenAI 계열 경로는 접두사에 따라 의미가 다릅니다. PI를 통한 Codex OAuth를 원하면 `openai-codex/*`를, 직접 OpenAI API 액세스 또는 네이티브 Codex app-server 하니스를 강제하려면 `openai/*`를 사용하세요.

| Model ref                                             | Runtime path                                 | 사용 시점                                                                 |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI 경유 OpenAI provider             | `OPENAI_API_KEY`로 현재 직접 OpenAI Platform API 액세스를 원할 때        |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI 경유 OpenAI Codex OAuth          | 기본 PI runner로 ChatGPT/Codex 구독 인증을 원할 때                       |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | 임베디드 에이전트 턴에 네이티브 Codex app-server 실행을 원할 때          |

GPT-5.5는 현재 OpenClaw에서 구독/OAuth 전용입니다. PI OAuth에는
`openai-codex/gpt-5.5`를 사용하거나, Codex app-server 하니스에는
`openai/gpt-5.5`와 함께 사용하세요. `openai/gpt-5.5`에 대한 직접 API key 액세스는 OpenAI가 공개 API에서 GPT-5.5를 활성화하면 지원됩니다.

레거시 `codex/gpt-*` ref는 여전히 호환성 별칭으로 허용됩니다. 새 PI
Codex OAuth config는 `openai-codex/gpt-*`를, 새 네이티브 app-server
하니스 config는 `openai/gpt-*`와 `embeddedHarness.runtime:
"codex"`를 선호해야 합니다.

`agents.defaults.imageModel`도 동일한 접두사 분리를 따릅니다. 이미지 이해를 OpenAI
Codex OAuth provider 경로로 실행하려면 `openai-codex/gpt-*`를 사용하세요. 이미지 이해를 제한된 Codex app-server 턴을 통해 실행하려면 `codex/gpt-*`를 사용하세요. Codex app-server 모델은 이미지 입력 지원을 광고해야 하며, 텍스트 전용 Codex 모델은 미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 실제 하니스를 확인하려면 `/status`를 사용하세요. 선택 결과가 예상과 다르면 `agents/harness` 하위 시스템에 대한 디버그 로깅을 활성화하고 gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에는 선택된 harness ID, 선택 이유, runtime/fallback 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

하니스 선택은 라이브 세션 제어가 아닙니다. 임베디드 턴이 실행되면 OpenClaw는 해당 세션에 선택된 harness ID를 기록하고, 같은 세션 ID의 이후 턴에서도 계속 그것을 사용합니다. 향후 세션에서 다른 하니스를 사용하려면 `embeddedHarness` config 또는 `OPENCLAW_AGENT_RUNTIME`을 변경하세요. 기존 대화를 PI와 Codex 사이에서 전환하기 전에는 `/new` 또는 `/reset`을 사용해 새 세션을 시작하세요. 이렇게 하면 하나의 대화 기록을 서로 호환되지 않는 두 네이티브 세션 시스템에 재재생하는 일을 피할 수 있습니다.

하니스 pin이 생기기 전에 만들어진 레거시 세션은 대화 기록이 있는 순간 PI-pinned로 취급됩니다. config를 변경한 뒤 그 대화를 Codex로 전환하려면 `/new` 또는 `/reset`을 사용하세요.

`/status`는 `Fast` 옆에 실제 non-PI harness를 표시합니다(예: `Fast · codex`). 기본 PI harness는 계속 `Runner: pi (embedded)`로 표시되며 별도의 harness 배지는 추가되지 않습니다.

## 요구 사항

- 번들 `codex` Plugin을 사용할 수 있는 OpenClaw
- Codex app-server `0.118.0` 이상
- app-server 프로세스에서 사용할 수 있는 Codex 인증

Plugin은 더 오래되었거나 버전 정보가 없는 app-server 핸드셰이크를 차단합니다. 이렇게 하면 OpenClaw가 자신이 테스트한 프로토콜 표면 위에 머물 수 있습니다.

실시간 및 Docker 스모크 테스트의 경우, 인증은 보통 `OPENAI_API_KEY`에서 오고, 추가로 `~/.codex/auth.json` 및 `~/.codex/config.toml` 같은 Codex CLI 파일을 사용할 수 있습니다. 로컬 Codex app-server가 사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 config

`openai/gpt-5.5`를 사용하고, 번들 Plugin을 활성화한 다음, `codex` 하니스를 강제합니다.

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

config가 `plugins.allow`를 사용한다면 거기에 `codex`도 포함하세요.

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

`agents.defaults.model` 또는 에이전트 모델을 `codex/<model>`로 설정하는 레거시 config는 여전히 번들 `codex` Plugin을 자동 활성화합니다. 새 config는 위 예시처럼 `openai/<model>`과 명시적 `embeddedHarness` 항목을 선호해야 합니다.

## 다른 모델을 유지하면서 Codex 추가

레거시 `codex/*` ref는 Codex를 선택하고 나머지는 PI를 사용하게 하려면 `runtime: "auto"`를 유지하세요. 새 config에서는 harness를 써야 하는 에이전트에 `runtime: "codex"`를 명시하는 편이 좋습니다.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

이 구성에서는:

- `/model gpt` 또는 `/model openai/gpt-5.5`는 이 config에서 Codex app-server 하니스를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면 PI가 호환성 하니스로 유지됩니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex 하니스를 사용한다는 것을 보장하려면 PI 대체 경로를 비활성화하세요.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

대체 경로를 비활성화하면 Codex Plugin이 꺼져 있거나, app-server가 너무 오래되었거나, app-server를 시작할 수 없을 때 OpenClaw는 조기에 실패합니다.

## 에이전트별 Codex

기본 에이전트는 일반적인 자동 선택을 유지하면서 한 에이전트만 Codex 전용으로 만들 수 있습니다.

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

에이전트와 모델 전환에는 일반 세션 명령어를 사용하세요. `/new`는 새 OpenClaw 세션을 만들고, Codex 하니스는 필요에 따라 sidecar app-server 스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지우고, 다음 턴에서 현재 config를 기준으로 하니스를 다시 확인하게 합니다.

## 모델 검색

기본적으로 Codex Plugin은 app-server에 사용 가능한 모델을 요청합니다. 검색이 실패하거나 타임아웃되면 다음에 대한 번들 fallback 카탈로그를 사용합니다.

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` 아래에서 검색 동작을 조정할 수 있습니다.

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

시작 시 Codex를 프로빙하지 않고 fallback 카탈로그만 사용하게 하려면 검색을 비활성화하세요.

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

기본적으로 Plugin은 다음으로 Codex를 로컬에서 시작합니다.

```bash
codex app-server --listen stdio://
```

기본적으로 OpenClaw는 로컬 Codex harness 세션을 YOLO 모드로 시작합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`,
`sandbox: "danger-full-access"`. 이는 자율적인 heartbeat에 사용되는 신뢰된 로컬 운영자 자세입니다. Codex는 누구도 응답할 수 없는 네이티브 승인 프롬프트에 멈추지 않고 셸과 네트워크 도구를 사용할 수 있습니다.

Codex guardian-reviewed 승인을 opt-in하려면 `appServer.mode:
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

Guardian은 네이티브 Codex 승인 reviewer입니다. Codex가 샌드박스를 벗어나거나, 워크스페이스 밖에 쓰거나, 네트워크 액세스 같은 권한을 추가하려고 할 때 Codex는 인간 프롬프트 대신 reviewer 하위 에이전트로 해당 승인 요청을 보냅니다. reviewer는 Codex의 위험 프레임워크를 적용하여 특정 요청을 승인하거나 거부합니다. YOLO 모드보다 더 많은 가드레일이 필요하지만, 무인 에이전트가 계속 진행해야 한다면 Guardian을 사용하세요.

`guardian` 프리셋은 `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, `sandbox: "workspace-write"`로 확장됩니다. 개별 정책 필드는 여전히 `mode`를 재정의하므로, 고급 배포에서는 프리셋과 명시적 선택을 섞을 수 있습니다.

이미 실행 중인 app-server에 대해서는 WebSocket 전송을 사용하세요.

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

| Field               | Default                                  | 의미                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 시작하고, `"websocket"`은 `url`에 연결합니다.                                        |
| `command`           | `"codex"`                                | stdio 전송용 실행 파일입니다.                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다.                                                                                  |
| `url`               | unset                                    | WebSocket app-server URL입니다.                                                                           |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer token입니다.                                                                      |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 호출 타임아웃입니다.                                                             |
| `mode`              | `"yolo"`                                 | YOLO 또는 guardian-reviewed 실행을 위한 프리셋입니다.                                                     |
| `approvalPolicy`    | `"never"`                                | 네이티브 Codex 승인 정책으로, 스레드 시작/재개/턴에 전송됩니다.                                           |
| `sandbox`           | `"danger-full-access"`                   | 네이티브 Codex 샌드박스 모드로, 스레드 시작/재개에 전송됩니다.                                            |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian이 프롬프트를 검토하게 하려면 `"guardian_subagent"`를 사용하세요.                          |
| `serviceTier`       | unset                                    | 선택적 Codex app-server 서비스 티어: `"fast"`, `"flex"`, 또는 `null`. 잘못된 레거시 값은 무시됩니다.     |

기존 환경 변수도 일치하는 config 필드가 비어 있을 때 로컬 테스트용 대체값으로 계속 동작합니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에서는 config가 더 권장됩니다. Codex harness 설정의 나머지와 함께 동일한 검토 대상 파일에 Plugin 동작을 유지할 수 있기 때문입니다.

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

PI fallback을 비활성화한 Codex 전용 harness 검증:

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

Guardian-reviewed Codex 승인:

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

명시적 헤더가 있는 원격 app-server:

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

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex 스레드에 연결되어 있을 때, 다음 턴은 현재 선택된 OpenAI 모델, provider, 승인 정책, 샌드박스, 서비스 티어를 다시 app-server로 보냅니다. `openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만 Codex에게 새로 선택된 모델로 계속하라고 요청합니다.

## Codex 명령어

번들 Plugin은 승인된 슬래시 명령어로 `/codex`를 등록합니다. 이 명령어는 일반적이며, OpenClaw 텍스트 명령어를 지원하는 모든 채널에서 동작합니다.

일반적인 형태:

- `/codex status`는 실시간 app-server 연결성, 모델, 계정, 속도 제한, MCP 서버, Skills를 보여줍니다.
- `/codex models`는 실시간 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드를 Compaction하라고 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 review를 시작합니다.
- `/codex account`는 계정 및 속도 제한 상태를 보여줍니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 harness가 일반 턴에 사용하는 것과 동일한 sidecar 바인딩 파일을 씁니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw 모델을 app-server에 전달하며, 확장 히스토리를 계속 활성화합니다.

이 명령 표면은 Codex app-server `0.118.0` 이상이 필요합니다. 향후 또는 커스텀 app-server가 특정 JSON-RPC 메서드를 노출하지 않으면, 개별 control 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## 훅 경계

Codex harness에는 세 가지 훅 계층이 있습니다.

| Layer                                 | Owner                    | 목적                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw Plugin 훅                    | OpenClaw                 | PI와 Codex harness 전반의 제품/Plugin 호환성                      |
| Codex app-server 확장 미들웨어        | OpenClaw 번들 Plugins    | OpenClaw 동적 도구 주변의 턴별 어댑터 동작                        |
| Codex 네이티브 훅                     | Codex                    | Codex config의 저수준 Codex 수명 주기 및 네이티브 도구 정책       |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을 사용하지 않습니다. Codex 네이티브 훅은 셸 정책, 네이티브 도구 결과 검토, 중단 처리, 네이티브 Compaction/모델 수명 주기 같은 Codex 소유 작업에는 유용하지만, OpenClaw Plugin API는 아닙니다.

OpenClaw 동적 도구의 경우 Codex가 호출을 요청한 뒤에 OpenClaw가 도구를 실행하므로, OpenClaw는 harness 어댑터에서 자신이 소유한 Plugin 및 미들웨어 동작을 실행합니다. Codex 네이티브 도구의 경우, 정식 도구 레코드는 Codex가 소유합니다. OpenClaw는 선택된 이벤트를 미러링할 수는 있지만, Codex가 해당 작업을 app-server 또는 네이티브 훅 콜백으로 노출하지 않는 한 네이티브 Codex 스레드를 다시 쓸 수는 없습니다.

향후 Codex app-server 빌드가 네이티브 Compaction 및 모델 수명 주기 훅 이벤트를 노출할 경우, OpenClaw는 해당 프로토콜 지원을 버전 게이트하고 의미가 정직하게 유지되는 범위에서 기존 OpenClaw 훅 계약으로 매핑해야 합니다. 그 전까지는 OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`, `llm_output` 이벤트는 어댑터 수준 관찰일 뿐, Codex 내부 요청 또는 Compaction 페이로드의 바이트 단위 캡처는 아닙니다.

## 도구, 미디어 및 Compaction

Codex harness는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 구성하고 harness로부터 동적 도구 결과를 받습니다. 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속 일반 OpenClaw 전송 경로를 따릅니다.

Codex MCP 도구 승인 elicitation은 Codex가 `_meta.codex_approval_kind`를
`"mcp_tool_call"`로 표시할 때 OpenClaw의 Plugin 승인 흐름으로 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 보내지며, 다음에 대기 중인 후속 메시지는 추가 컨텍스트로 steer되는 대신 해당 네이티브 서버 요청에 대한 응답이 됩니다. 다른 MCP elicitation 요청은 계속 fail closed 처리됩니다.

선택된 모델이 Codex harness를 사용할 때, 네이티브 스레드 Compaction은 Codex app-server에 위임됩니다. OpenClaw는 채널 히스토리, 검색, `/new`, `/reset`, 향후 모델 또는 harness 전환을 위해 대화 기록 미러를 유지합니다. 이 미러에는 사용자 프롬프트, 최종 assistant 텍스트, 그리고 app-server가 이를 내보낼 때의 가벼운 Codex reasoning 또는 plan 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나, Compaction 후 Codex가 어떤 항목을 유지했는지에 대한 감사 가능한 목록은 노출하지 않습니다.

Codex가 정식 네이티브 스레드를 소유하므로, `tool_result_persist`는 현재 Codex 네이티브 도구 결과 레코드를 다시 쓰지 않습니다. 이는 OpenClaw가 OpenClaw 소유 세션 대화 기록의 도구 결과를 쓸 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어 이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 일치하는 provider/모델 설정을 사용합니다.

## 문제 해결

**Codex가 `/model`에 나타나지 않음:** `plugins.entries.codex.enabled`를 활성화하고,
`embeddedHarness.runtime: "codex"`가 설정된 `openai/gpt-*` 모델(또는 레거시 `codex/*` ref)을 선택한 다음, `plugins.allow`가 `codex`를 제외하지 않는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** 어떤 Codex harness도 해당 실행을 주장하지 않으면,
OpenClaw는 호환성 백엔드로 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면
`embeddedHarness.runtime: "codex"`를 설정하거나, 어떤 Plugin harness도 일치하지 않을 때 실패하게 하려면
`embeddedHarness.fallback: "none"`을 설정하세요. Codex app-server가 선택된 후의 실패는 추가 fallback config 없이 직접 표면화됩니다.

**app-server가 거부됨:** app-server 핸드셰이크가
버전 `0.118.0` 이상을 보고하도록 Codex를 업그레이드하세요.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나
검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 이는 `embeddedHarness.runtime: "codex"`를 강제했거나(또는 레거시 `codex/*` ref를 선택했거나) 하지 않은 한 예상된 동작입니다. 일반 `openai/gpt-*` 및 다른 provider ref는 정상적인 provider 경로를 유지합니다.

## 관련 항목

- [Agent Harness Plugins](/ko/plugins/sdk-agent-harness)
- [모델 제공자](/ko/concepts/model-providers)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
