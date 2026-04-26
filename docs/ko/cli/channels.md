---
read_when:
    - 채널 계정(WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)을 추가하거나 제거하려고 합니다.
    - 채널 상태를 확인하거나 채널 로그를 실시간으로 확인하려고 합니다.
summary: '`openclaw channels`용 CLI 참조 (계정, 상태, 로그인/로그아웃, 로그)'
title: 채널
x-i18n:
    generated_at: "2026-04-26T12:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway에서 채팅 채널 계정과 해당 런타임 상태를 관리합니다.

관련 문서:

- 채널 가이드: [채널](/ko/channels/index)
- Gateway 구성: [구성](/ko/gateway/configuration)

## 공통 명령어

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 상태 / capabilities / resolve / 로그

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel`과 함께 사용할 때만 가능), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe`는 실시간 경로입니다. 연결 가능한 gateway에서는 계정별로
`probeAccount` 및 선택적인 `auditAccount` 검사를 실행하므로, 출력에 전송 상태와 함께
`works`, `probe failed`, `audit ok`, `audit failed` 같은 프로브 결과가 포함될 수 있습니다.
gateway에 연결할 수 없는 경우 `channels status`는 실시간 프로브 출력 대신
구성 전용 요약으로 대체됩니다.

## 계정 추가 / 제거

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

팁: `openclaw channels add --help`는 채널별 플래그(token, private key, app token, signal-cli 경로 등)를 보여줍니다.

일반적인 비대화형 추가 표면은 다음과 같습니다.

- bot-token 채널: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage 전송 필드: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat 필드: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix 필드: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr 필드: `--private-key`, `--relay-urls`
- Tlon 필드: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- 지원되는 경우 기본 계정의 env 기반 인증에 사용하는 `--use-env`

플래그 기반 추가 명령 중 채널 Plugin 설치가 필요한 경우, OpenClaw는 대화형 Plugin 설치 프롬프트를 열지 않고 해당 채널의 기본 설치 소스를 사용합니다.

플래그 없이 `openclaw channels add`를 실행하면 대화형 마법사가 다음을 물을 수 있습니다.

- 선택한 채널별 계정 ID
- 해당 계정의 선택적 표시 이름
- `Bind configured channel accounts to agents now?`

지금 바인드하는 것을 확인하면, 마법사는 각 구성된 채널 계정을 어떤 에이전트가 소유해야 하는지 묻고 계정 범위 라우팅 바인딩을 기록합니다.

같은 라우팅 규칙은 나중에 `openclaw agents bindings`, `openclaw agents bind`, `openclaw agents unbind`로도 관리할 수 있습니다([agents](/ko/cli/agents) 참조).

여전히 단일 계정 최상위 설정을 사용하는 채널에 기본이 아닌 계정을 추가하면, OpenClaw는 새 계정을 기록하기 전에 계정 범위 최상위 값을 해당 채널의 계정 맵으로 승격합니다. 대부분의 채널은 이 값을 `channels.<channel>.accounts.default`에 배치하지만, 번들 채널은 대신 기존에 일치하는 승격 계정을 유지할 수 있습니다. 현재 예시는 Matrix입니다. 이름이 지정된 계정이 이미 하나 존재하거나 `defaultAccount`가 기존 이름 지정 계정을 가리키면, 승격 시 새 `accounts.default`를 만드는 대신 그 계정을 유지합니다.

라우팅 동작은 일관되게 유지됩니다.

- 기존의 채널 전용 바인딩(`accountId` 없음)은 계속 기본 계정과 일치합니다.
- `channels add`는 비대화형 모드에서 바인딩을 자동 생성하거나 다시 쓰지 않습니다.
- 대화형 설정에서는 선택적으로 계정 범위 바인딩을 추가할 수 있습니다.

구성이 이미 혼합 상태였다면(이름이 지정된 계정이 있고 최상위 단일 계정 값도 여전히 설정된 상태), `openclaw doctor --fix`를 실행해 계정 범위 값을 해당 채널에 대해 선택된 승격 계정으로 이동하세요. 대부분의 채널은 `accounts.default`로 승격되며, Matrix는 기존 이름 지정/기본 대상을 유지할 수 있습니다.

## 로그인 / 로그아웃(대화형)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

참고:

- `channels login`은 `--verbose`를 지원합니다.
- `channels login` / `logout`은 지원되는 로그인 대상이 하나만 구성된 경우 채널을 추론할 수 있습니다.

## 문제 해결

- 광범위한 프로브를 위해 `openclaw status --deep`를 실행하세요.
- 안내형 수정은 `openclaw doctor`를 사용하세요.
- `openclaw channels list`에 `Claude: HTTP 403 ... user:profile`이 출력되면 사용량 스냅샷에 `user:profile` 범위가 필요하다는 뜻입니다. `--no-usage`를 사용하거나, claude.ai 세션 키(`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)를 제공하거나, Claude CLI로 다시 인증하세요.
- `openclaw channels status`는 gateway에 연결할 수 없을 때 구성 전용 요약으로 대체됩니다. 지원되는 채널 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우, 해당 계정은 구성되지 않은 것으로 표시되지 않고 저하 관련 메모와 함께 구성된 것으로 보고됩니다.

## Capabilities 프로브

사용 가능한 경우 provider capability 힌트(intents/scopes)와 정적 기능 지원을 함께 가져옵니다.

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

참고:

- `--channel`은 선택 사항이며, 생략하면 모든 채널(확장 포함)을 나열합니다.
- `--account`는 `--channel`과 함께 사용할 때만 유효합니다.
- `--target`은 `channel:<id>` 또는 원시 숫자 채널 ID를 허용하며 Discord에만 적용됩니다.
- 프로브는 provider별입니다. Discord intents + 선택적 채널 권한, Slack bot + user scopes, Telegram bot 플래그 + Webhook, Signal daemon 버전, Microsoft Teams app token + Graph roles/scopes(알려진 경우 주석 포함)를 지원합니다. 프로브가 없는 채널은 `Probe: unavailable`을 보고합니다.

## 이름을 ID로 확인

provider 디렉터리를 사용해 채널/사용자 이름을 ID로 확인합니다.

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

참고:

- 대상 유형을 강제하려면 `--kind user|group|auto`를 사용하세요.
- 같은 이름을 공유하는 항목이 여러 개일 때는 활성 항목을 우선합니다.
- `channels resolve`는 읽기 전용입니다. 선택한 계정이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 해당 자격 증명을 사용할 수 없는 경우, 명령은 전체 실행을 중단하는 대신 메모가 포함된 저하된 미확인 결과를 반환합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [채널 개요](/ko/channels)
