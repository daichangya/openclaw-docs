---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw 샌드박싱 작동 방식: 모드, 범위, 워크스페이스 액세스, 이미지'
title: 샌드박싱
x-i18n:
    generated_at: "2026-04-21T06:02:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# 샌드박싱

OpenClaw는 **도구를 샌드박스 백엔드 내부에서 실행**하여 영향 범위를 줄일 수 있습니다.
이 기능은 **선택 사항**이며 구성(`agents.defaults.sandbox` 또는
`agents.list[].sandbox`)으로 제어됩니다. 샌드박싱이 꺼져 있으면 도구는 호스트에서 실행됩니다.
Gateway는 호스트에 그대로 유지되며, 활성화된 경우 도구 실행만 격리된 샌드박스에서
수행됩니다.

이것은 완벽한 보안 경계는 아니지만, 모델이 어리석은 동작을 했을 때 파일 시스템과
프로세스 접근을 실질적으로 제한합니다.

## 무엇이 샌드박스 처리되는가

- 도구 실행(`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등).
- 선택적 샌드박스 브라우저(`agents.defaults.sandbox.browser`).
  - 기본적으로 브라우저 도구가 필요로 할 때 샌드박스 브라우저가 자동 시작됩니다(CDP 도달 가능 보장).
    `agents.defaults.sandbox.browser.autoStart` 및 `agents.defaults.sandbox.browser.autoStartTimeoutMs`로 구성합니다.
  - 기본적으로 샌드박스 브라우저 컨테이너는 전역 `bridge` 네트워크 대신 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 사용합니다.
    `agents.defaults.sandbox.browser.network`로 구성합니다.
  - 선택적 `agents.defaults.sandbox.browser.cdpSourceRange`는 CIDR 허용 목록으로 컨테이너 엣지 CDP 인바운드를 제한합니다(예: `172.21.0.1/32`).
  - noVNC 옵저버 액세스는 기본적으로 비밀번호로 보호됩니다. OpenClaw는 로컬 부트스트랩 페이지를 제공하고 URL 쿼리/헤더 로그가 아닌 URL 프래그먼트에 비밀번호를 담아 noVNC를 여는 단기 토큰 URL을 출력합니다.
  - `agents.defaults.sandbox.browser.allowHostControl`은 샌드박스 세션이 호스트 브라우저를 명시적으로 대상으로 지정할 수 있게 합니다.
  - 선택적 허용 목록이 `target: "custom"`을 제어합니다: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

샌드박스 처리되지 않는 항목:

- Gateway 프로세스 자체.
- 명시적으로 샌드박스 밖에서 실행되도록 허용된 도구(예: `tools.elevated`).
  - **elevated exec는 샌드박싱을 우회하고 구성된 탈출 경로를 사용합니다(기본값은 `gateway`, exec 대상이 `node`이면 `node`).**
  - 샌드박싱이 꺼져 있으면 `tools.elevated`는 실행 방식을 바꾸지 않습니다(이미 호스트에서 실행 중). [Elevated Mode](/ko/tools/elevated)를 참고하세요.

## 모드

`agents.defaults.sandbox.mode`는 **언제** 샌드박싱을 사용할지 제어합니다:

- `"off"`: 샌드박싱 없음.
- `"non-main"`: **non-main** 세션만 샌드박싱(일반 채팅은 호스트에서 실행하고 싶을 때의 기본값).
- `"all"`: 모든 세션을 샌드박스에서 실행.
  참고: `"non-main"`은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다.
  그룹/채널 세션은 자체 키를 사용하므로 non-main으로 간주되어 샌드박스 처리됩니다.

## 범위

`agents.defaults.sandbox.scope`는 **컨테이너를 몇 개 생성할지**를 제어합니다:

- `"agent"`(기본값): 에이전트당 컨테이너 하나.
- `"session"`: 세션당 컨테이너 하나.
- `"shared"`: 모든 샌드박스 세션이 하나의 컨테이너를 공유.

## 백엔드

`agents.defaults.sandbox.backend`는 **어떤 런타임이** 샌드박스를 제공할지 제어합니다:

- `"docker"`(샌드박싱이 활성화된 경우 기본값): 로컬 Docker 기반 샌드박스 런타임.
- `"ssh"`: 일반 SSH 기반 원격 샌드박스 런타임.
- `"openshell"`: OpenShell 기반 샌드박스 런타임.

SSH 전용 구성은 `agents.defaults.sandbox.ssh` 아래에 있습니다.
OpenShell 전용 구성은 `plugins.entries.openshell.config` 아래에 있습니다.

### 백엔드 선택하기

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **실행 위치**   | 로컬 컨테이너                  | SSH로 접근 가능한 모든 호스트        | OpenShell 관리 샌드박스                           |
| **설정**           | `scripts/sandbox-setup.sh`       | SSH 키 + 대상 호스트          | OpenShell Plugin 활성화                            |
| **워크스페이스 모델** | 바인드 마운트 또는 복사               | 원격 기준(remote-canonical, 1회 시드)   | `mirror` 또는 `remote`                                |
| **네트워크 제어** | `docker.network` (기본값: 없음) | 원격 호스트에 따라 다름         | OpenShell에 따라 다름                                |
| **브라우저 샌드박스** | 지원                        | 지원되지 않음                  | 아직 지원되지 않음                                   |
| **바인드 마운트**     | `docker.binds`                   | 해당 없음                            | 해당 없음                                                 |
| **가장 적합한 용도**        | 로컬 개발, 완전한 격리        | 원격 머신으로 오프로딩 | 선택적 양방향 동기화가 있는 관리형 원격 샌드박스 |

### Docker 백엔드

샌드박싱은 기본적으로 꺼져 있습니다. 샌드박싱을 활성화하고
백엔드를 선택하지 않으면 OpenClaw는 Docker 백엔드를 사용합니다. 이 경우 도구와 샌드박스 브라우저를
Docker 데몬 소켓(`/var/run/docker.sock`)을 통해 로컬에서 실행합니다. 샌드박스 컨테이너
격리는 Docker 네임스페이스에 의해 결정됩니다.

**Docker-out-of-Docker (DooD) 제약 사항**:
OpenClaw Gateway 자체를 Docker 컨테이너로 배포하는 경우, 호스트의 Docker 소켓을 사용해 형제 샌드박스 컨테이너를 오케스트레이션합니다(DooD). 이때 특정 경로 매핑 제약이 생깁니다:

- **구성에는 호스트 경로가 필요함**: `openclaw.json`의 `workspace` 구성에는 Gateway 컨테이너 내부 경로가 아니라 **호스트의 절대 경로**(예: `/home/user/.openclaw/workspaces`)가 반드시 들어 있어야 합니다. OpenClaw가 Docker 데몬에 샌드박스 생성을 요청하면, 데몬은 Gateway 네임스페이스가 아니라 호스트 OS 네임스페이스를 기준으로 경로를 해석합니다.
- **FS 브리지 패리티(동일한 볼륨 맵)**: OpenClaw Gateway 네이티브 프로세스도 `workspace` 디렉터리에 Heartbeat 및 브리지 파일을 씁니다. Gateway 역시 컨테이너 환경 내부에서 동일한 문자열(호스트 경로)을 평가하므로, Gateway 배포에는 호스트 네임스페이스를 네이티브하게 연결하는 동일한 볼륨 맵이 반드시 포함되어야 합니다(`-v /home/user/.openclaw:/home/user/.openclaw`).

절대 호스트 경로와 동일한 매핑 없이 내부 경로만 매핑하면, 완전한 경로 문자열이 네이티브하게 존재하지 않기 때문에 OpenClaw는 컨테이너 환경 안에서 Heartbeat를 쓰려 할 때 기본적으로 `EACCES` 권한 오류를 발생시킵니다.

### SSH 백엔드

SSH로 접근 가능한 임의의 머신에서 OpenClaw가 `exec`, 파일 도구, 미디어 읽기를
샌드박싱하도록 하려면 `backend: "ssh"`를 사용하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 또는 로컬 파일 대신 SecretRef / 인라인 내용을 사용할 수 있습니다:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

동작 방식:

- OpenClaw는 `sandbox.ssh.workspaceRoot` 아래에 범위별 원격 루트를 생성합니다.
- 생성 또는 재생성 후 처음 사용할 때 OpenClaw는 로컬 워크스페이스를 한 번 원격 워크스페이스로 시드합니다.
- 이후 `exec`, `read`, `write`, `edit`, `apply_patch`, 프롬프트 미디어 읽기, 수신 미디어 스테이징은 SSH를 통해 원격 워크스페이스를 직접 대상으로 실행됩니다.
- OpenClaw는 원격 변경 사항을 로컬 워크스페이스로 자동 동기화하지 않습니다.

인증 자료:

- `identityFile`, `certificateFile`, `knownHostsFile`: 기존 로컬 파일을 사용하고 OpenSSH 구성으로 전달합니다.
- `identityData`, `certificateData`, `knownHostsData`: 인라인 문자열 또는 SecretRef를 사용합니다. OpenClaw는 일반 시크릿 런타임 스냅샷을 통해 이를 해석하고, `0600` 권한으로 임시 파일에 기록한 뒤 SSH 세션이 끝나면 삭제합니다.
- 동일한 항목에 대해 `*File`과 `*Data`가 모두 설정되면, 해당 SSH 세션에서는 `*Data`가 우선합니다.

이것은 **원격 기준(remote-canonical)** 모델입니다. 초기 시드 이후에는 원격 SSH 워크스페이스가 실제 샌드박스 상태가 됩니다.

중요한 결과:

- 시드 단계 이후 OpenClaw 밖에서 수행한 호스트 로컬 편집은 샌드박스를 재생성할 때까지 원격에 반영되지 않습니다.
- `openclaw sandbox recreate`는 범위별 원격 루트를 삭제하고, 다음 사용 시 로컬에서 다시 시드합니다.
- 브라우저 샌드박싱은 SSH 백엔드에서 지원되지 않습니다.
- `sandbox.docker.*` 설정은 SSH 백엔드에 적용되지 않습니다.

### OpenShell 백엔드

OpenClaw가 OpenShell이 관리하는 원격 환경에서 도구를
샌드박싱하게 하려면 `backend: "openshell"`을 사용하세요. 전체 설정 가이드, 구성
참조, 워크스페이스 모드 비교는 전용
[OpenShell 페이지](/ko/gateway/openshell)를 참고하세요.

OpenShell은 일반 SSH 백엔드와 동일한 핵심 SSH 전송 및 원격 파일 시스템 브리지를 재사용하며,
여기에 OpenShell 전용 수명 주기
(`sandbox create/get/delete`, `sandbox ssh-config`)와 선택적 `mirror`
워크스페이스 모드를 추가합니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 모드:

- `mirror`(기본값): 로컬 워크스페이스가 기준으로 유지됩니다. OpenClaw는 exec 전에 로컬 파일을 OpenShell로 동기화하고, exec 후 원격 워크스페이스를 다시 동기화합니다.
- `remote`: 샌드박스 생성 후 OpenShell 워크스페이스가 기준이 됩니다. OpenClaw는 로컬 워크스페이스를 원격 워크스페이스로 한 번 시드한 뒤, 변경 사항을 다시 동기화하지 않고 파일 도구와 exec를 원격 샌드박스에 직접 실행합니다.

원격 전송 세부 사항:

- OpenClaw는 `openshell sandbox ssh-config <name>`를 통해 샌드박스별 SSH 구성을 OpenShell에 요청합니다.
- 코어는 해당 SSH 구성을 임시 파일에 기록하고 SSH 세션을 연 뒤, `backend: "ssh"`에서 사용하는 것과 동일한 원격 파일 시스템 브리지를 재사용합니다.
- `mirror` 모드에서는 수명 주기만 다릅니다: exec 전에 로컬을 원격으로 동기화하고, exec 후 다시 동기화합니다.

현재 OpenShell 제한 사항:

- 샌드박스 브라우저는 아직 지원되지 않음
- `sandbox.docker.binds`는 OpenShell 백엔드에서 지원되지 않음
- `sandbox.docker.*` 아래의 Docker 전용 런타임 설정은 여전히 Docker 백엔드에만 적용됨

#### 워크스페이스 모드

OpenShell에는 두 가지 워크스페이스 모델이 있습니다. 실제로 가장 중요한 부분은 이것입니다.

##### `mirror`

**로컬 워크스페이스를 기준으로 유지**하려면 `plugins.entries.openshell.config.mode: "mirror"`를 사용하세요.

동작:

- `exec` 전에 OpenClaw는 로컬 워크스페이스를 OpenShell 샌드박스로 동기화합니다.
- `exec` 후 OpenClaw는 원격 워크스페이스를 로컬 워크스페이스로 다시 동기화합니다.
- 파일 도구는 여전히 샌드박스 브리지를 통해 동작하지만, 턴 사이에서는 로컬 워크스페이스가 기준 상태로 유지됩니다.

다음과 같은 경우에 사용하세요:

- OpenClaw 밖에서 로컬 파일을 편집하며 그 변경 사항이 샌드박스에 자동 반영되길 원할 때
- OpenShell 샌드박스가 가능한 한 Docker 백엔드처럼 동작하길 원할 때
- 각 exec 턴 후 호스트 워크스페이스가 샌드박스 쓰기 결과를 반영하길 원할 때

절충점:

- exec 전후에 추가 동기화 비용이 발생함

##### `remote`

**OpenShell 워크스페이스를 기준으로 만들고 싶을 때** `plugins.entries.openshell.config.mode: "remote"`를 사용하세요.

동작:

- 샌드박스가 처음 생성될 때 OpenClaw는 로컬 워크스페이스를 원격 워크스페이스로 한 번 시드합니다.
- 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`가 원격 OpenShell 워크스페이스를 직접 대상으로 동작합니다.
- OpenClaw는 exec 후 원격 변경 사항을 로컬 워크스페이스로 **동기화하지 않습니다**.
- 프롬프트 시점 미디어 읽기는 여전히 동작합니다. 파일 및 미디어 도구가 로컬 호스트 경로를 가정하는 대신 샌드박스 브리지를 통해 읽기 때문입니다.
- 전송은 `openshell sandbox ssh-config`가 반환한 OpenShell 샌드박스로의 SSH를 사용합니다.

중요한 결과:

- 시드 단계 이후 OpenClaw 밖에서 호스트의 파일을 편집해도 원격 샌드박스는 그 변경 사항을 자동으로 **보지 못합니다**.
- 샌드박스를 재생성하면 원격 워크스페이스는 다시 로컬 워크스페이스를 기준으로 시드됩니다.
- `scope: "agent"` 또는 `scope: "shared"`를 사용하면 해당 원격 워크스페이스는 그 동일한 범위에서 공유됩니다.

다음과 같은 경우에 사용하세요:

- 샌드박스가 주로 원격 OpenShell 쪽에서 유지되어야 할 때
- 턴당 동기화 오버헤드를 더 낮추고 싶을 때
- 호스트 로컬 편집이 원격 샌드박스 상태를 조용히 덮어쓰지 않게 하고 싶을 때

샌드박스를 임시 실행 환경으로 생각한다면 `mirror`를 선택하세요.
샌드박스를 실제 워크스페이스로 생각한다면 `remote`를 선택하세요.

#### OpenShell 수명 주기

OpenShell 샌드박스도 일반적인 샌드박스 수명 주기를 통해 관리됩니다:

- `openclaw sandbox list`는 Docker 런타임뿐 아니라 OpenShell 런타임도 표시합니다
- `openclaw sandbox recreate`는 현재 런타임을 삭제하고, 다음 사용 시 OpenClaw가 다시 생성하도록 합니다
- prune 로직도 백엔드를 인식합니다

`remote` 모드에서는 recreate가 특히 중요합니다:

- recreate는 해당 범위의 기준 원격 워크스페이스를 삭제합니다
- 다음 사용 시 로컬 워크스페이스를 기준으로 새 원격 워크스페이스를 시드합니다

`mirror` 모드에서는 로컬 워크스페이스가 어차피 기준으로 유지되므로,
recreate는 주로 원격 실행 환경을 재설정하는 역할을 합니다.

## 워크스페이스 액세스

`agents.defaults.sandbox.workspaceAccess`는 **샌드박스가 무엇을 볼 수 있는지**를 제어합니다:

- `"none"`(기본값): 도구는 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스를 봅니다.
- `"ro"`: 에이전트 워크스페이스를 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
- `"rw"`: 에이전트 워크스페이스를 `/workspace`에 읽기/쓰기로 마운트합니다.

OpenShell 백엔드 사용 시:

- `mirror` 모드는 exec 턴 사이에 여전히 로컬 워크스페이스를 기준 소스로 사용합니다
- `remote` 모드는 초기 시드 이후 원격 OpenShell 워크스페이스를 기준 소스로 사용합니다
- `workspaceAccess: "ro"` 및 `"none"`도 동일한 방식으로 쓰기 동작을 제한합니다

수신 미디어는 활성 샌드박스 워크스페이스(`media/inbound/*`)에 복사됩니다.
Skills 참고: `read` 도구는 샌드박스 루트를 기준으로 동작합니다. `workspaceAccess: "none"`일 때,
OpenClaw는 읽을 수 있도록 적격 Skills를 샌드박스 워크스페이스(`.../skills`)로 미러링합니다.
`"rw"`일 때는 워크스페이스 Skills를
`/workspace/skills`에서 읽을 수 있습니다.

## 사용자 지정 바인드 마운트

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉터리를 컨테이너에 마운트합니다.
형식: `host:container:mode`(예: `"/home/user/source:/source:rw"`).

전역 및 에이전트별 바인드는 **병합**되며(대체되지 않음), `scope: "shared"`에서는 에이전트별 바인드가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 추가 호스트 디렉터리를 **샌드박스 브라우저** 컨테이너에만 마운트합니다.

- 설정되면(`[]` 포함) 브라우저 컨테이너에 대해서는 `agents.defaults.sandbox.docker.binds`를 대체합니다.
- 생략되면 브라우저 컨테이너는 이전 버전과의 호환성을 위해 `agents.defaults.sandbox.docker.binds`를 사용합니다.

예시(읽기 전용 소스 + 추가 데이터 디렉터리):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

보안 참고 사항:

- 바인드는 샌드박스 파일 시스템을 우회합니다. 설정한 모드(`:ro` 또는 `:rw`) 그대로 호스트 경로를 노출합니다.
- OpenClaw는 위험한 바인드 소스(예: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, 그리고 이들을 노출할 수 있는 상위 마운트)를 차단합니다.
- OpenClaw는 `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` 같은 일반적인 홈 디렉터리 자격 증명 루트도 차단합니다.
- 바인드 검증은 단순 문자열 비교가 아닙니다. OpenClaw는 소스 경로를 정규화한 뒤, 존재하는 가장 깊은 상위 디렉터리를 통해 다시 해석하고 나서 차단 경로와 허용 루트를 다시 검사합니다.
- 즉, 최종 리프가 아직 존재하지 않더라도 심볼릭 링크 상위 경로를 통한 탈출은 여전히 안전하게 차단됩니다. 예: `run-link`가 그 위치를 가리키면 `/workspace/run-link/new-file`는 여전히 `/var/run/...`으로 해석됩니다.
- 허용된 소스 루트도 같은 방식으로 정규화되므로, 심볼릭 링크 해석 전에는 허용 목록 안처럼 보여도 실제로는 `outside allowed roots`로 거부됩니다.
- 민감한 마운트(시크릿, SSH 키, 서비스 자격 증명)는 꼭 필요하지 않다면 `:ro`여야 합니다.
- 워크스페이스에 읽기 전용 액세스만 필요하다면 `workspaceAccess: "ro"`와 조합하세요. 바인드 모드는 독립적으로 유지됩니다.
- 바인드가 도구 정책 및 elevated exec와 어떻게 상호작용하는지는 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.

## 이미지 + 설정

기본 Docker 이미지: `openclaw-sandbox:bookworm-slim`

한 번 빌드하세요:

```bash
scripts/sandbox-setup.sh
```

참고: 기본 이미지에는 **Node가 포함되어 있지 않습니다**. Skill에 Node(또는
다른 런타임)가 필요하면 사용자 지정 이미지를 만들거나
`sandbox.docker.setupCommand`로 설치하세요(네트워크 이그레스 + 쓰기 가능한 루트 +
root 사용자 필요).

`curl`, `jq`, `nodejs`, `python3`, `git` 같은 일반 도구가 포함된 더 기능적인
샌드박스 이미지를 원한다면 다음을 빌드하세요:

```bash
scripts/sandbox-common-setup.sh
```

그런 다음 `agents.defaults.sandbox.docker.image`를
`openclaw-sandbox-common:bookworm-slim`으로 설정하세요.

샌드박스 브라우저 이미지:

```bash
scripts/sandbox-browser-setup.sh
```

기본적으로 Docker 샌드박스 컨테이너는 **네트워크 없이** 실행됩니다.
`agents.defaults.sandbox.docker.network`로 재정의하세요.

번들된 샌드박스 브라우저 이미지는 컨테이너 워크로드를 위해 보수적인 Chromium 시작 기본값도 적용합니다.
현재 컨테이너 기본값에는 다음이 포함됩니다:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox`가 활성화되면 `--no-sandbox` 및 `--disable-setuid-sandbox`.
- 세 가지 그래픽 강화 플래그(`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`)는 선택 사항이며,
  컨테이너에 GPU 지원이 없을 때 유용합니다. 워크로드에 WebGL 또는 기타 3D/브라우저 기능이 필요하면
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 설정하세요.
- `--disable-extensions`는 기본적으로 활성화되어 있으며, 확장 프로그램 의존 흐름이 필요하면
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 비활성화할 수 있습니다.
- `--renderer-process-limit=2`는
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 제어되며, `0`이면 Chromium 기본값을 유지합니다.

다른 런타임 프로필이 필요하면 사용자 지정 브라우저 이미지를 사용하고
직접 엔트리포인트를 제공하세요. 로컬(비컨테이너) Chromium 프로필의 경우
`browser.extraArgs`를 사용해 추가 시작 플래그를 덧붙이세요.

보안 기본값:

- `network: "host"`는 차단됩니다.
- `network: "container:<id>"`는 기본적으로 차단됩니다(네임스페이스 조인 우회 위험).
- 긴급 예외 재정의: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker 설치와 컨테이너형 Gateway는 여기에서 다룹니다:
[Docker](/ko/install/docker)

Docker Gateway 배포의 경우 `scripts/docker/setup.sh`가 샌드박스 구성을 부트스트랩할 수 있습니다.
해당 경로를 활성화하려면 `OPENCLAW_SANDBOX=1`(또는 `true`/`yes`/`on`)을 설정하세요.
소켓 위치는 `OPENCLAW_DOCKER_SOCKET`으로 재정의할 수 있습니다. 전체 설정 및 환경
참조: [Docker](/ko/install/docker#agent-sandbox)

## setupCommand(1회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 **후 한 번만** 실행됩니다(매 실행마다 아님).
컨테이너 내부에서 `sh -lc`를 통해 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- 에이전트별: `agents.list[].sandbox.docker.setupCommand`

일반적인 함정:

- 기본 `docker.network`는 `"none"`(이그레스 없음)이므로 패키지 설치가 실패합니다.
- `docker.network: "container:<id>"`는 `dangerouslyAllowContainerNamespaceJoin: true`가 필요하며 긴급 예외 전용입니다.
- `readOnlyRoot: true`는 쓰기를 막습니다. `readOnlyRoot: false`로 설정하거나 사용자 지정 이미지를 만드세요.
- 패키지 설치에는 `user`가 root여야 합니다(`user`를 생략하거나 `user: "0:0"` 설정).
- 샌드박스 exec는 호스트의 `process.env`를 상속하지 않습니다.
  Skill API 키에는 `agents.defaults.sandbox.docker.env`(또는 사용자 지정 이미지)를 사용하세요.

## 도구 정책 + 탈출 해치

도구 허용/거부 정책은 샌드박스 규칙보다 먼저 적용됩니다. 어떤 도구가 전역 또는 에이전트별로
거부되어 있다면 샌드박싱을 켜도 다시 사용할 수 없습니다.

`tools.elevated`는 샌드박스 밖에서 `exec`를 실행하는 명시적 탈출 해치입니다(기본값은 `gateway`, exec 대상이 `node`이면 `node`).
`/exec` 지시어는 권한 있는 발신자에게만 적용되며 세션별로 유지됩니다. `exec`를 강제로 비활성화하려면
도구 정책 거부를 사용하세요([Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 참고).

디버깅:

- `openclaw sandbox explain`을 사용해 실제 적용되는 샌드박스 모드, 도구 정책, 수정할 구성 키를 확인하세요.
- “왜 이게 차단되나요?”라는 판단 모델은 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.
  잠금 상태를 유지하세요.

## 다중 에이전트 재정의

각 에이전트는 샌드박스와 도구를 재정의할 수 있습니다:
`agents.list[].sandbox` 및 `agents.list[].tools` (`sandbox` 도구 정책용 `agents.list[].tools.sandbox.tools` 포함).
우선순위는 [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

## 최소 활성화 예시

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 관련 문서

- [OpenShell](/ko/gateway/openshell) -- 관리형 샌드박스 백엔드 설정, 워크스페이스 모드, 구성 참조
- [샌드박스 구성](/ko/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- "왜 이게 차단되나요?" 디버깅
- [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의 및 우선순위
- [보안](/ko/gateway/security)
