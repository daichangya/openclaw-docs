---
read_when:
    - Claude Code / Codex / Gemini CLI용 acpx 하니스를 설치하거나 구성하는 중입니다.
    - plugin-tools 또는 OpenClaw-tools MCP 브리지를 활성화하는 중입니다.
    - ACP 권한 모드를 구성하는 중입니다.
summary: 'ACP 에이전트 설정: acpx 하니스 config, Plugin 설정, 권한'
title: ACP 에이전트 — 설정
x-i18n:
    generated_at: "2026-04-24T06:37:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

개요, 운영자 런북, 개념은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.
이 페이지는 acpx 하니스 config, MCP 브리지용 Plugin 설정, 권한 구성을 다룹니다.

## acpx 하니스 지원(현재)

현재 acpx 내장 하니스 별칭:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw가 acpx 백엔드를 사용할 때는 acpx config에 커스텀 agent alias가 정의되어 있지 않은 한 `agentId`에는 이 값들을 사용하는 것이 좋습니다.
로컬 Cursor 설치가 아직 ACP를 `agent acp`로 노출한다면, 내장 기본값을 바꾸는 대신 acpx config에서 `cursor` agent 명령을 재정의하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`로 임의의 어댑터를 대상으로 지정할 수도 있지만, 이 raw escape hatch는 acpx CLI 기능일 뿐이며 일반 OpenClaw `agentId` 경로는 아닙니다.

## 필수 config

핵심 ACP 기본 설정:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어는 유지한 채 ACP dispatch만 일시 중지하려면 false로 설정합니다.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

스레드 바인딩 config는 채널 어댑터별입니다. Discord 예시:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

스레드 바인딩된 ACP spawn이 동작하지 않는다면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩에는 하위 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

[구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## acpx 백엔드용 Plugin 설정

새 설치에서는 번들 `acpx` 런타임 Plugin이 기본적으로 활성화되어 있으므로, 보통 수동 Plugin 설치 단계 없이 ACP가 동작합니다.

다음부터 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 거부했거나, 로컬 개발 체크아웃으로 전환하려면 명시적인 Plugin 경로를 사용하세요.

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 workspace 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그런 다음 백엔드 상태를 확인하세요.

```text
/acp doctor
```

### acpx 명령 및 버전 구성

기본적으로 번들 `acpx` Plugin은 Plugin 로컬의 고정 바이너리(`node_modules/.bin/acpx`, Plugin 패키지 내부)를 사용합니다. 시작 시 백엔드는 not-ready로 등록되고, 백그라운드 작업이 `acpx --version`을 확인합니다. 바이너리가 없거나 버전이 맞지 않으면 `npm install --omit=dev --no-save acpx@<pinned>`를 실행한 뒤 다시 확인합니다. 이 전체 과정에서 gateway는 non-blocking 상태를 유지합니다.

Plugin config에서 명령이나 버전을 재정의할 수 있습니다.

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command`는 절대 경로, 상대 경로(OpenClaw workspace 기준으로 확인), 또는 명령 이름을 받을 수 있습니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- 커스텀 `command` 경로를 사용하면 Plugin 로컬 자동 설치는 비활성화됩니다.

[Plugins](/ko/tools/plugin)를 참조하세요.

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면, acpx
런타임 의존성(플랫폼별 바이너리)은 postinstall 훅을 통해 자동 설치됩니다. 자동 설치가 실패하더라도 gateway는 정상적으로 시작되며, `openclaw acp doctor`를 통해 누락된 의존성을 보고합니다.

### Plugin tools MCP 브리지

기본적으로 ACPX 세션은 OpenClaw에 Plugin으로 등록된 도구를 ACP 하니스에 노출하지 **않습니다**.

Codex나 Claude Code 같은 ACP 에이전트가 메모리 recall/store 같은 설치된 OpenClaw Plugin 도구를 호출하도록 하려면 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 설정이 하는 일:

- ACPX 세션 bootstrap에 `openclaw-plugin-tools`라는 내장 MCP 서버를 주입
- 이미 설치 및 활성화된 OpenClaw Plugins가 등록한 Plugin 도구를 노출
- 이 기능을 명시적이고 기본 비활성 상태로 유지

보안 및 신뢰 참고:

- 이는 ACP 하니스의 도구 표면을 확장합니다.
- ACP 에이전트는 gateway에서 이미 활성화된 Plugin 도구에만 접근할 수 있습니다.
- 이는 해당 Plugins를 OpenClaw 자체에서 실행하게 둘 때와 같은 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 Plugins를 검토하세요.

커스텀 `mcpServers`는 이전과 동일하게 계속 동작합니다. 내장 plugin-tools 브리지는
추가적인 옵트인 편의 기능이며, 일반 MCP 서버 config를 대체하는 것이 아닙니다.

### OpenClaw tools MCP 브리지

기본적으로 ACPX 세션은 내장 OpenClaw 도구도 MCP를 통해 노출하지 **않습니다**. ACP 에이전트가 `cron` 같은 선택된 내장 도구를 필요로 할 때는 별도의 core-tools 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이 설정이 하는 일:

- ACPX 세션 bootstrap에 `openclaw-tools`라는 내장 MCP 서버를 주입
- 선택된 내장 OpenClaw 도구를 노출. 초기 서버는 `cron`을 노출
- core-tool 노출을 명시적이고 기본 비활성 상태로 유지

### 런타임 타임아웃 구성

번들 `acpx` Plugin은 임베디드 런타임 턴의 기본 타임아웃을 120초로 설정합니다. 이는 Gemini CLI 같은 더 느린 하니스가 ACP 시작 및 초기화를 완료하기에 충분한 시간을 제공합니다. 호스트에 다른 런타임 제한이 필요하다면 이를 재정의하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 뒤에는 gateway를 다시 시작하세요.

### 상태 프로브 agent 구성

번들 `acpx` Plugin은 임베디드 런타임 백엔드 준비 상태를 결정할 때 하나의 하니스 agent를 프로브합니다. 기본값은 `codex`입니다. 배포에서 다른 기본 ACP agent를 사용한다면 probe agent도 같은 ID로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 뒤에는 gateway를 다시 시작하세요.

## 권한 구성

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기 및 shell-exec 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 개의 config 키를 제공합니다.

이 ACPX 하니스 권한은 OpenClaw exec 승인과는 별개이며, Claude CLI `--permission-mode bypassPermissions` 같은 CLI 백엔드 vendor 우회 플래그와도 별개입니다. ACPX의 `approve-all`은 ACP 세션용 하니스 수준 break-glass 스위치입니다.

### `permissionMode`

하니스 agent가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 셸 명령을 자동 승인                      |
| `approve-reads` | 읽기만 자동 승인하고, 쓰기와 exec는 프롬프트 필요         |
| `deny-all`      | 모든 권한 프롬프트 거부                                   |

### `nonInteractivePermissions`

권한 프롬프트를 보여줘야 하지만 대화형 TTY가 없는 경우(ACP 세션에서는 항상 해당) 어떻게 처리할지를 제어합니다.

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션 중단. **(기본값)**                  |
| `deny` | 권한을 조용히 거부하고 계속 진행(점진적 기능 저하)                |

### 구성

Plugin config로 설정:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 뒤에는 gateway를 다시 시작하세요.

> **중요:** OpenClaw는 현재 기본적으로 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`을 사용합니다. 비대화형 ACP 세션에서는 권한 프롬프트를 트리거하는 모든 쓰기 또는 exec가 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`로 실패할 수 있습니다.
>
> 권한을 제한해야 한다면 `nonInteractivePermissions`를 `deny`로 설정하세요. 그러면 세션이 충돌하는 대신 점진적으로 기능이 저하됩니다.

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents) — 개요, 운영자 런북, 개념
- [하위 에이전트](/ko/tools/subagents)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
