---
read_when:
    - CLI에서 exec 승인을 편집하려는 경우
    - Gateway 또는 Node 호스트에서 허용 목록을 관리해야 하는 경우
summary: '``openclaw approvals`` 및 ``openclaw exec-policy``에 대한 CLI 참조'
title: 승인
x-i18n:
    generated_at: "2026-04-24T06:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

**로컬 호스트**, **Gateway 호스트**, 또는 **Node 호스트**의 exec 승인을 관리합니다.
기본적으로 명령은 디스크의 로컬 승인 파일을 대상으로 합니다. Gateway를 대상으로 하려면 `--gateway`를, 특정 Node를 대상으로 하려면 `--node`를 사용하세요.

별칭: `openclaw exec-approvals`

관련 항목:

- Exec 승인: [Exec approvals](/ko/tools/exec-approvals)
- Node: [Nodes](/ko/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`는 요청된
`tools.exec.*` 설정과 로컬 호스트 승인 파일을 한 번에 정렬 상태로 유지하기 위한 로컬 편의 명령입니다.

다음과 같은 경우에 사용하세요.

- 로컬 요청 정책, 호스트 승인 파일, 그리고 유효하게 병합된 결과를 검사하려는 경우
- YOLO 또는 deny-all 같은 로컬 프리셋을 적용하려는 경우
- 로컬 `tools.exec.*`와 로컬 `~/.openclaw/exec-approvals.json`을 동기화하려는 경우

예시:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

출력 모드:

- `--json` 없음: 사람이 읽기 쉬운 표 형식 출력
- `--json`: 기계가 읽기 쉬운 구조화된 출력

현재 범위:

- `exec-policy`는 **로컬 전용**입니다
- 로컬 설정 파일과 로컬 승인 파일을 함께 업데이트합니다
- 정책을 Gateway 호스트나 Node 호스트로 푸시하지는 않습니다
- `--host node`는 이 명령에서 거부됩니다. Node exec 승인은 런타임에 Node에서 가져오며, 대신 Node 대상 승인 명령을 통해 관리해야 하기 때문입니다
- `openclaw exec-policy show`는 로컬 승인 파일에서 유효 정책을 도출하는 대신 `host=node` 범위를 런타임 Node 관리 대상으로 표시합니다

원격 호스트 승인을 직접 편집해야 한다면 계속 `openclaw approvals set --gateway`
또는 `openclaw approvals set --node <id|name|ip>`를 사용하세요.

## 일반 명령

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get`은 이제 로컬, Gateway, Node 대상에 대한 유효 exec 정책을 표시합니다.

- 요청된 `tools.exec` 정책
- 호스트 승인 파일 정책
- 우선순위 규칙이 적용된 후의 유효 결과

우선순위는 의도된 동작입니다.

- 호스트 승인 파일은 강제 적용 가능한 단일 정보원입니다
- 요청된 `tools.exec` 정책은 의도를 더 좁히거나 넓힐 수 있지만, 유효 결과는 여전히 호스트 규칙에서 도출됩니다
- `--node`는 Node 호스트 승인 파일과 Gateway `tools.exec` 정책을 함께 결합합니다. 둘 다 런타임에 계속 적용되기 때문입니다
- Gateway 설정을 사용할 수 없으면 CLI는 Node 승인 스냅샷으로 대체하고, 최종 런타임 정책을 계산할 수 없었다는 점을 표시합니다

## 파일로 승인 전체 교체

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`은 엄격한 JSON만이 아니라 JSON5를 허용합니다. `--file` 또는 `--stdin` 중 하나만 사용하고, 둘 다 함께 사용하지 마세요.

## "절대 프롬프트하지 않음" / YOLO 예시

exec 승인 때문에 절대 중단되면 안 되는 호스트의 경우, 호스트 승인 기본값을 `full` + `off`로 설정하세요.

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Node 변형:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

이렇게 하면 **호스트 승인 파일**만 변경됩니다. 요청된 OpenClaw 정책도 정렬 상태로 유지하려면 다음도 설정하세요.

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

이 예시에서 `tools.exec.host=gateway`인 이유:

- `host=auto`는 여전히 "가능하면 sandbox, 아니면 gateway"를 의미합니다.
- YOLO는 라우팅이 아니라 승인에 관한 것입니다.
- sandbox가 구성되어 있어도 호스트 exec을 사용하려면 `gateway` 또는 `/exec host=gateway`로 호스트 선택을 명시하세요.

이는 현재의 호스트 기본 YOLO 동작과 일치합니다. 승인이 필요하다면 더 엄격하게 설정하세요.

로컬 바로가기:

```bash
openclaw exec-policy preset yolo
```

이 로컬 바로가기는 요청된 로컬 `tools.exec.*` 설정과
로컬 승인 기본값을 함께 업데이트합니다. 의도 면에서는 위의 수동 2단계 설정과 동일하지만, 로컬 머신에만 적용됩니다.

## 허용 목록 도우미

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 공통 옵션

`get`, `set`, `allowlist add|remove`는 모두 다음을 지원합니다.

- `--node <id|name|ip>`
- `--gateway`
- 공용 Node RPC 옵션: `--url`, `--token`, `--timeout`, `--json`

대상 지정 참고:

- 대상 플래그가 없으면 디스크의 로컬 승인 파일을 의미합니다
- `--gateway`는 Gateway 호스트 승인 파일을 대상으로 합니다
- `--node`는 id, 이름, IP 또는 id 접두사를 확인한 뒤 하나의 Node 호스트를 대상으로 합니다

`allowlist add|remove`는 다음도 지원합니다.

- `--agent <id>` (기본값 `*`)

## 참고

- `--node`는 `openclaw nodes`와 동일한 확인자(id, name, ip, 또는 id prefix)를 사용합니다.
- `--agent` 기본값은 `"*"`이며, 모든 에이전트에 적용됩니다.
- Node 호스트는 `system.execApprovals.get/set`을 광고해야 합니다(macOS 앱 또는 헤드리스 Node 호스트).
- 승인 파일은 호스트별로 `~/.openclaw/exec-approvals.json`에 저장됩니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Exec approvals](/ko/tools/exec-approvals)
