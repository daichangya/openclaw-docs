---
read_when:
    - 로컬 설치 대신 컨테이너화된 gateway를 원합니다.
    - Docker 흐름을 검증하는 중입니다.
summary: 선택적 Docker 기반 OpenClaw 설정 및 온보딩
title: Docker
x-i18n:
    generated_at: "2026-04-24T06:20:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker는 **선택 사항**입니다. 컨테이너화된 gateway가 필요하거나 Docker 흐름을 검증하려는 경우에만 사용하세요.

## Docker가 나에게 맞을까요?

- **예**: 격리되고 일회성인 gateway 환경이 필요하거나, 로컬 설치 없이 호스트에서 OpenClaw를 실행하고 싶음
- **아니요**: 직접 사용하는 머신에서 가장 빠른 개발 루프만 원함. 이 경우 일반 설치 흐름을 사용하세요.
- **샌드박싱 참고**: 기본 샌드박스 백엔드는 샌드박싱이 활성화되어 있을 때 Docker를 사용하지만, 샌드박싱은 기본적으로 꺼져 있으며 gateway 전체를 Docker에서 실행할 필요는 **없습니다**. SSH와 OpenShell 샌드박스 백엔드도 사용할 수 있습니다. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

## 사전 요구 사항

- Docker Desktop(또는 Docker Engine) + Docker Compose v2
- 이미지 빌드를 위한 최소 2 GB RAM(`pnpm install`은 1 GB 호스트에서 exit 137로 OOM-kill될 수 있음)
- 이미지와 로그를 저장할 충분한 디스크 공간
- VPS/공용 호스트에서 실행하는 경우
  [네트워크 노출을 위한 보안 하드닝](/ko/gateway/security), 특히 Docker `DOCKER-USER` 방화벽 정책을 검토하세요.

## 컨테이너화된 Gateway

<Steps>
  <Step title="이미지 빌드">
    repo 루트에서 setup 스크립트를 실행하세요:

    ```bash
    ./scripts/docker/setup.sh
    ```

    이렇게 하면 gateway 이미지가 로컬에서 빌드됩니다. 미리 빌드된 이미지를 사용하려면:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    미리 빌드된 이미지는
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)에 게시됩니다.
    일반적인 태그: `main`, `latest`, `<version>` (예: `2026.2.26`)

  </Step>

  <Step title="온보딩 완료">
    setup 스크립트는 온보딩도 자동으로 실행합니다. 다음을 수행합니다.

    - 제공자 API key 요청
    - gateway token을 생성하고 `.env`에 기록
    - Docker Compose를 통해 gateway 시작

    설정 중에는 사전 시작 온보딩과 config 쓰기가
    `openclaw-gateway`를 통해 직접 실행됩니다. `openclaw-cli`는 gateway 컨테이너가
    이미 존재한 뒤에 실행하는 명령용입니다.

  </Step>

  <Step title="Control UI 열기">
    브라우저에서 `http://127.0.0.1:18789/`를 열고 설정된
    공유 비밀을 Settings에 붙여 넣으세요. setup 스크립트는 기본적으로 `.env`에 token을
    기록합니다. 컨테이너 config를 비밀번호 인증으로 바꿨다면 대신 그 비밀번호를 사용하세요.

    URL이 다시 필요하신가요?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="채널 구성(선택 사항)">
    CLI 컨테이너를 사용해 메시징 채널을 추가하세요:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord)

  </Step>
</Steps>

### 수동 흐름

setup 스크립트 대신 각 단계를 직접 실행하고 싶다면:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose`는 repo 루트에서 실행하세요. `OPENCLAW_EXTRA_MOUNTS`
또는 `OPENCLAW_HOME_VOLUME`을 활성화했다면 setup 스크립트가 `docker-compose.extra.yml`을
기록합니다. 이 경우 `-f docker-compose.yml -f docker-compose.extra.yml`을 포함하세요.
</Note>

<Note>
`openclaw-cli`는 `openclaw-gateway`의 네트워크 namespace를 공유하므로
사후 시작 도구입니다. `docker compose up -d openclaw-gateway` 이전에는 onboarding과
설정 시점 config 쓰기를 `openclaw-gateway`를 통해
`--no-deps --entrypoint node`와 함께 실행하세요.
</Note>

### 환경 변수

setup 스크립트는 다음 선택적 환경 변수를 받습니다.

| Variable                       | 목적                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | 로컬 빌드 대신 원격 이미지 사용                                 |
| `OPENCLAW_DOCKER_APT_PACKAGES` | 빌드 중 추가 apt 패키지 설치(공백으로 구분)                    |
| `OPENCLAW_EXTENSIONS`          | 빌드 시 Plugin 의존성 사전 설치(공백으로 구분된 이름)          |
| `OPENCLAW_EXTRA_MOUNTS`        | 추가 호스트 bind mount(쉼표로 구분된 `source:target[:opts]`)  |
| `OPENCLAW_HOME_VOLUME`         | `/home/node`를 이름 있는 Docker 볼륨에 영속화                  |
| `OPENCLAW_SANDBOX`             | 샌드박스 부트스트랩 opt-in (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Docker 소켓 경로 재정의                                         |

### 상태 검사

컨테이너 프로브 엔드포인트(인증 필요 없음):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 이미지는 `/healthz`를 핑하는 내장 `HEALTHCHECK`를 포함합니다.
검사가 계속 실패하면 Docker는 컨테이너를 `unhealthy`로 표시하고
오케스트레이션 시스템이 재시작하거나 교체할 수 있습니다.

인증된 심층 상태 스냅샷:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh`는 기본적으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용하므로 Docker 포트 퍼블리싱과 함께 호스트에서 `http://127.0.0.1:18789`로 접근할 수 있습니다.

- `lan` (기본값): 호스트 브라우저와 호스트 CLI가 퍼블리시된 gateway 포트에 접근 가능
- `loopback`: 컨테이너 네트워크 namespace 내부 프로세스만 gateway에 직접 접근 가능

<Note>
`0.0.0.0` 또는 `127.0.0.1` 같은 호스트 별칭이 아니라, `gateway.bind`의 bind 모드 값(`lan` / `loopback` / `custom` / `tailnet` / `auto`)을 사용하세요.
</Note>

### 저장소 및 영속성

Docker Compose는 `OPENCLAW_CONFIG_DIR`을 `/home/node/.openclaw`에,
`OPENCLAW_WORKSPACE_DIR`을 `/home/node/.openclaw/workspace`에 bind-mount하므로,
이 경로들은 컨테이너가 교체되어도 유지됩니다.

이렇게 마운트된 config 디렉터리는 OpenClaw가 다음을 저장하는 위치입니다.

- 동작 config용 `openclaw.json`
- 저장된 제공자 OAuth/API-key 인증용 `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` 같은 env 기반 런타임 비밀 정보를 위한 `.env`

VM 배포에서의 전체 영속성 세부 정보는
[Docker VM Runtime - 무엇이 어디에 저장되는가](/ko/install/docker-vm-runtime#what-persists-where)를 참조하세요.

**디스크 증가 hotspot:** `media/`, 세션 JSONL 파일, `cron/runs/*.jsonl`,
그리고 `/tmp/openclaw/` 아래의 롤링 파일 로그를 주시하세요.

### 셸 헬퍼(선택 사항)

일상적인 Docker 관리를 더 쉽게 하려면 `ClawDock`를 설치하세요.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전에 `scripts/shell-helpers/clawdock-helpers.sh` 원시 경로로 ClawDock를 설치했다면, 위 설치 명령을 다시 실행해 로컬 헬퍼 파일이 새 위치를 따라가도록 하세요.

그런 다음 `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` 등을 사용하세요.
전체 명령은 `clawdock-help`를 실행하세요.
전체 헬퍼 가이드는 [ClawDock](/ko/install/clawdock)을 참조하세요.

<AccordionGroup>
  <Accordion title="Docker gateway에 agent 샌드박스 활성화">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    커스텀 소켓 경로(예: rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    이 스크립트는 샌드박스 사전 요구 사항이 통과한 후에만 `docker.sock`을 마운트합니다. 샌드박스 설정을 완료할 수 없으면 스크립트는 `agents.defaults.sandbox.mode`를 `off`로 재설정합니다.

  </Accordion>

  <Accordion title="자동화 / CI (비대화형)">
    Compose pseudo-TTY 할당을 `-T`로 비활성화하세요.

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="공유 네트워크 보안 참고">
    `openclaw-cli`는 `network_mode: "service:openclaw-gateway"`를 사용하므로 CLI
    명령이 `127.0.0.1`을 통해 gateway에 접근할 수 있습니다. 이를 공유된
    신뢰 경계로 취급하세요. compose config는 `NET_RAW`/`NET_ADMIN`을 제거하고
    `openclaw-cli`에 `no-new-privileges`를 활성화합니다.
  </Accordion>

  <Accordion title="권한 및 EACCES">
    이 이미지는 `node` (uid 1000) 사용자로 실행됩니다. `/home/node/.openclaw`에서
    권한 오류가 보이면, 호스트 bind mount가 uid 1000 소유인지 확인하세요.

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="더 빠른 재빌드">
    의존성 레이어가 캐시되도록 Dockerfile 순서를 구성하세요. 이렇게 하면 lockfile이 바뀌지 않는 한
    `pnpm install`을 다시 실행하지 않아도 됩니다.

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="고급 사용자용 컨테이너 옵션">
    기본 이미지는 보안 우선이며 non-root `node`로 실행됩니다. 더 기능이 풍부한 컨테이너가 필요하다면:

    1. **`/home/node` 영속화**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **시스템 의존성 bake**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright 브라우저 설치**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **브라우저 다운로드 영속화**: 다음을 설정
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` 그리고
       `OPENCLAW_HOME_VOLUME` 또는 `OPENCLAW_EXTRA_MOUNTS` 사용

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (헤드리스 Docker)">
    마법사에서 OpenAI Codex OAuth를 선택하면 브라우저 URL이 열립니다. Docker나 헤드리스 설정에서는
    최종적으로 도달한 전체 리디렉션 URL을 복사해 마법사에 다시 붙여 넣어 인증을 완료하세요.
  </Accordion>

  <Accordion title="베이스 이미지 메타데이터">
    기본 Docker 이미지는 `node:24-bookworm`을 사용하며
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` 등을 포함한 OCI 베이스 이미지 annotation을 게시합니다.
    자세한 내용은
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)를 참조하세요.
  </Accordion>
</AccordionGroup>

### VPS에서 실행 중인가요?

공유 VM 배포 단계(바이너리 bake, 영속성, 업데이트 포함)는
[Hetzner (Docker VPS)](/ko/install/hetzner) 및
[Docker VM Runtime](/ko/install/docker-vm-runtime)을 참조하세요.

## Agent 샌드박스

Docker 백엔드와 함께 `agents.defaults.sandbox`가 활성화되면 gateway는
agent 도구 실행(셸, 파일 읽기/쓰기 등)을 격리된 Docker 컨테이너 내부에서 수행하고,
gateway 자체는 호스트에 그대로 유지됩니다. 이렇게 하면 신뢰되지 않거나 다중 테넌트인
agent 세션 주위에 견고한 경계를 두면서도 gateway 전체를 컨테이너화할 필요가 없습니다.

샌드박스 범위는 agent별(기본값), session별 또는 shared로 설정할 수 있습니다. 각 범위는
`/workspace`에 마운트되는 자체 workspace를 갖습니다. 또한
allow/deny 도구 정책, 네트워크 격리, 리소스 제한, 브라우저 컨테이너도 구성할 수 있습니다.

전체 구성, 이미지, 보안 참고, 멀티 에이전트 프로필은 다음을 참조하세요:

- [샌드박싱](/ko/gateway/sandboxing) -- 전체 샌드박스 참조
- [OpenShell](/ko/gateway/openshell) -- 샌드박스 컨테이너에 대한 대화형 셸 액세스
- [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의

### 빠른 활성화

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

기본 샌드박스 이미지를 빌드하세요:

```bash
scripts/sandbox-setup.sh
```

## 문제 해결

<AccordionGroup>
  <Accordion title="이미지가 없거나 샌드박스 컨테이너가 시작되지 않음">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로
    샌드박스 이미지를 빌드하거나, `agents.defaults.sandbox.docker.image`를 커스텀 이미지로 설정하세요.
    컨테이너는 필요할 때 세션별로 자동 생성됩니다.
  </Accordion>

  <Accordion title="샌드박스에서 권한 오류 발생">
    마운트된 워크스페이스 소유권과 일치하는 UID:GID로 `docker.user`를 설정하거나,
    워크스페이스 폴더를 `chown`하세요.
  </Accordion>

  <Accordion title="샌드박스에서 커스텀 도구를 찾을 수 없음">
    OpenClaw는 `sh -lc`(login shell)로 명령을 실행하며, 이 과정에서
    `/etc/profile`이 로드되고 PATH가 재설정될 수 있습니다. 커스텀 도구 경로를
    앞에 붙이도록 `docker.env.PATH`를 설정하거나, Dockerfile의 `/etc/profile.d/` 아래에
    스크립트를 추가하세요.
  </Accordion>

  <Accordion title="이미지 빌드 중 OOM-killed(exit 137)">
    VM에는 최소 2 GB RAM이 필요합니다. 더 큰 머신 클래스를 사용한 뒤 다시 시도하세요.
  </Accordion>

  <Accordion title="Control UI에서 Unauthorized 또는 pairing required가 표시됨">
    새로운 대시보드 링크를 가져오고 브라우저 장치를 승인하세요:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    자세한 내용: [대시보드](/ko/web/dashboard), [장치](/ko/cli/devices).

  </Accordion>

  <Accordion title="Gateway 대상이 ws://172.x.x.x로 보이거나 Docker CLI에서 pairing 오류가 발생함">
    gateway 모드와 bind를 재설정하세요:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 관련 항목

- [설치 개요](/ko/install) — 모든 설치 방법
- [Podman](/ko/install/podman) — Docker의 Podman 대안
- [ClawDock](/ko/install/clawdock) — Docker Compose 커뮤니티 설정
- [업데이트](/ko/install/updating) — OpenClaw 최신 상태 유지
- [구성](/ko/gateway/configuration) — 설치 후 gateway 구성
