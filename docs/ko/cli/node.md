---
read_when:
    - 헤드리스 Node 호스트 실행
    - '`system.run`용 비 macOS Node 페어링'
summary: '`openclaw node`에 대한 CLI 참조(헤드리스 Node 호스트)'
title: Node
x-i18n:
    generated_at: "2026-04-24T06:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61b16bdd0c52115bc9938a0fc975369159a4e45d743173ab4e65fce8292af51e
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서
`system.run` / `system.which`를 노출하는 **헤드리스 Node 호스트**를 실행합니다.

## 왜 Node 호스트를 사용하나요?

네트워크의 **다른 머신에서 명령을 실행**하게 하면서
그곳에 전체 macOS 컴패니언 앱을 설치하고 싶지 않을 때 Node 호스트를 사용하세요.

일반적인 사용 사례:

- 원격 Linux/Windows 박스(빌드 서버, 랩 머신, NAS)에서 명령 실행
- exec는 Gateway에서 **샌드박스** 상태로 유지하면서, 승인된 실행만 다른 호스트에 위임
- 자동화 또는 CI Node용 경량 헤드리스 실행 대상 제공

실행은 여전히 Node 호스트의 **exec 승인**과 에이전트별 허용 목록에 의해 보호되므로,
명령 액세스를 범위가 명확하고 명시적으로 유지할 수 있습니다.

## 브라우저 프록시(무설정)

Node 호스트는 Node에서 `browser.enabled`가 비활성화되지 않았다면 자동으로 브라우저 프록시를 광고합니다. 이렇게 하면 추가 설정 없이 해당 Node에서 브라우저 자동화를 에이전트가 사용할 수 있습니다.

기본적으로 프록시는 Node의 일반 브라우저 프로필 표면을 노출합니다. `nodeHost.browserProxy.allowProfiles`를 설정하면 프록시는 제한적으로 바뀝니다.
허용 목록에 없는 프로필 대상 지정은 거부되며, 프록시를 통한 영구 프로필
create/delete 경로는 차단됩니다.

필요하면 Node에서 비활성화하세요.

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 실행(포그라운드)

```bash
openclaw node run --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: Node ID 재정의(페어링 토큰 삭제)
- `--display-name <name>`: Node 표시 이름 재정의

## Node 호스트용 Gateway 인증

`openclaw node run`과 `openclaw node install`은 config/env에서 gateway 인증을 확인합니다(Node 명령에는 `--token`/`--password` 플래그 없음).

- 먼저 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 확인합니다.
- 그다음 로컬 config 대체: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서 Node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, Node 인증 확인은 fail closed됩니다(원격 대체가 이를 가리지 않음).
- `gateway.mode=remote`에서는 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 원격 우선순위 규칙에 따라 대상이 됩니다.
- Node 호스트 인증 확인은 `OPENCLAW_GATEWAY_*` 환경 변수만 따릅니다.

신뢰할 수 있는 사설 네트워크의 non-loopback `ws://` Gateway에 연결하는 Node의 경우
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요. 설정하지 않으면 Node 시작은 fail closed되며 `wss://`, SSH 터널 또는 Tailscale 사용을 요구합니다.
`openclaw node install`은 이 opt-in을 감독되는 Node 서비스에 영속 저장합니다.

## 서비스(백그라운드)

헤드리스 Node 호스트를 사용자 서비스로 설치합니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: Gateway 연결에 TLS 사용
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: Node ID 재정의(페어링 토큰 삭제)
- `--display-name <name>`: Node 표시 이름 재정의
- `--runtime <runtime>`: 서비스 런타임(`node` 또는 `bun`)
- `--force`: 이미 설치된 경우 재설치/덮어쓰기

서비스 관리:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 Node 호스트(서비스 없음)에는 `openclaw node run`을 사용하세요.

서비스 명령은 기계 판독 가능한 출력을 위해 `--json`을 받을 수 있습니다.

## 페어링

첫 연결 시 Gateway에 보류 중인 장치 페어링 요청(`role: node`)이 생성됩니다.
다음으로 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Node가 변경된 인증 세부 정보(role/scopes/public key)로 페어링을 재시도하면,
이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다.
승인 전에 `openclaw devices list`를 다시 실행하세요.

Node 호스트는 Node ID, 토큰, 표시 이름, Gateway 연결 정보를
`~/.openclaw/node.json`에 저장합니다.

## Exec 승인

`system.run`은 로컬 exec 승인에 의해 제어됩니다.

- `~/.openclaw/exec-approvals.json`
- [Exec 승인](/ko/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway에서 편집)

승인된 비동기 Node exec의 경우, OpenClaw는 프롬프트 전에 정규화된 `systemRunPlan`을 준비합니다.
이후 승인된 `system.run` 전달은 저장된 해당 계획을 재사용하므로,
승인 요청 생성 후 command/cwd/session 필드를 수정하려는 시도는 Node 실행 내용을 바꾸는 대신 거부됩니다.

## 관련

- [CLI 참조](/ko/cli)
- [Nodes](/ko/nodes)
