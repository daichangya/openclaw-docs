---
read_when:
    - GCP에서 OpenClaw를 24/7 실행하고 싶습니다
    - 자체 VM에서 프로덕션급 상시 실행 Gateway를 원합니다
    - 영속성, 바이너리, 재시작 동작을 완전히 제어하고 싶습니다
summary: 내구성 있는 상태를 유지하면서 GCP Compute Engine VM(Docker)에서 OpenClaw Gateway를 24/7 실행하기
title: GCP
x-i18n:
    generated_at: "2026-04-24T06:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# GCP Compute Engine에서 OpenClaw 실행하기(Docker, 프로덕션 VPS 가이드)

## 목표

GCP Compute Engine VM에서 Docker를 사용해 영속적인 OpenClaw Gateway를 실행하고, 내구성 있는 상태, 이미지에 bake된 바이너리, 안전한 재시작 동작을 갖추는 것입니다.

“월 ~$5-12 정도로 24/7 OpenClaw”를 원한다면, 이것은 Google Cloud에서 신뢰할 수 있는 설정입니다.
요금은 머신 유형과 리전에 따라 달라집니다. 워크로드에 맞는 가장 작은 VM부터 시작하고 OOM이 발생하면 상향 조정하세요.

## 무엇을 하게 되나요? (쉽게 설명하면)

- GCP 프로젝트 생성 및 결제 활성화
- Compute Engine VM 생성
- Docker 설치(격리된 앱 런타임)
- Docker에서 OpenClaw Gateway 시작
- 호스트에 `~/.openclaw` + `~/.openclaw/workspace` 영속화(재시작/재빌드 후에도 유지)
- SSH 터널을 통해 노트북에서 Control UI 접속

그렇게 마운트된 `~/.openclaw` 상태에는 `openclaw.json`, 에이전트별
`agents/<agentId>/agent/auth-profiles.json`, 그리고 `.env`가 포함됩니다.

Gateway는 다음 방식으로 접근할 수 있습니다.

- 노트북에서 SSH 포트 포워딩
- 방화벽과 토큰을 직접 관리하는 경우 직접 포트 노출

이 가이드는 GCP Compute Engine에서 Debian을 사용합니다.
Ubuntu도 작동하며, 패키지는 그에 맞게 매핑하세요.
일반적인 Docker 흐름은 [Docker](/ko/install/docker)를 참조하세요.

---

## 빠른 경로(숙련된 운영자용)

1. GCP 프로젝트 생성 + Compute Engine API 활성화
2. Compute Engine VM 생성(`e2-small`, Debian 12, 20GB)
3. VM에 SSH 접속
4. Docker 설치
5. OpenClaw 리포지토리 클론
6. 영속 호스트 디렉터리 생성
7. `.env` 및 `docker-compose.yml` 구성
8. 필요한 바이너리를 bake하고 빌드 및 실행

---

## 필요한 것

- GCP 계정(`e2-micro`에 대해 무료 등급 가능)
- `gcloud` CLI 설치(또는 Cloud Console 사용)
- 노트북에서의 SSH 접근
- SSH + 복사/붙여넣기에 대한 기본적인 익숙함
- 약 20-30분
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 provider 자격 증명
  - WhatsApp QR
  - Telegram 봇 토큰
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI 설치(또는 Console 사용)">
    **옵션 A: gcloud CLI** (자동화에 권장)

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)에서 설치하세요.

    초기화 및 인증:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **옵션 B: Cloud Console**

    모든 단계는 웹 UI [https://console.cloud.google.com](https://console.cloud.google.com)에서 수행할 수 있습니다.

  </Step>

  <Step title="GCP 프로젝트 생성">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)에서 결제를 활성화하세요(Compute Engine에 필요).

    Compute Engine API 활성화:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project로 이동
    2. 이름을 정하고 생성
    3. 프로젝트에 대해 결제 활성화
    4. APIs & Services > Enable APIs로 이동 > "Compute Engine API" 검색 > Enable

  </Step>

  <Step title="VM 생성">
    **머신 유형:**

    | 유형      | 사양                     | 비용               | 참고                                      |
    | --------- | ------------------------ | ------------------ | ----------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/월            | 로컬 Docker 빌드에 가장 안정적            |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/월            | Docker 빌드를 위한 최소 권장 사양         |
    | e2-micro  | 2 vCPU(공유), 1GB RAM   | 무료 등급 가능     | Docker 빌드 OOM(exit 137)로 자주 실패     |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Compute Engine > VM instances > Create instance로 이동
    2. 이름: `openclaw-gateway`
    3. 리전: `us-central1`, 영역: `us-central1-a`
    4. 머신 유형: `e2-small`
    5. 부팅 디스크: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="VM에 SSH 접속">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine 대시보드에서 VM 옆의 "SSH" 버튼을 클릭하세요.

    참고: VM 생성 후 SSH 키 전파에는 1-2분이 걸릴 수 있습니다. 연결이 거부되면 잠시 기다렸다가 다시 시도하세요.

  </Step>

  <Step title="Docker 설치(VM 내부)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    그룹 변경을 적용하려면 로그아웃 후 다시 로그인하세요.

    ```bash
    exit
    ```

    그런 다음 다시 SSH 접속:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    확인:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw 리포지토리 클론">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    이 가이드는 바이너리 영속성을 보장하기 위해 사용자 지정 이미지를 빌드한다고 가정합니다.

  </Step>

  <Step title="영속 호스트 디렉터리 생성">
    Docker 컨테이너는 일시적입니다.
    모든 장기 상태는 호스트에 있어야 합니다.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="환경 변수 구성">
    리포지토리 루트에 `.env`를 만드세요.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    `.env`를 통해 직접 관리하려는 의도가 아니라면 `OPENCLAW_GATEWAY_TOKEN`은 비워 두세요. OpenClaw는 첫 시작 시 config에 임의의 gateway 토큰을 기록합니다. keyring 비밀번호를 생성해 `GOG_KEYRING_PASSWORD`에 붙여 넣으세요:

    ```bash
    openssl rand -hex 32
    ```

    **이 파일은 커밋하지 마세요.**

    이 `.env` 파일은 `OPENCLAW_GATEWAY_TOKEN` 같은 컨테이너/런타임 env용입니다.
    저장된 provider OAuth/API 키 인증은 마운트된
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다.

  </Step>

  <Step title="Docker Compose 구성">
    `docker-compose.yml`을 생성하거나 업데이트하세요.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # 권장: VM에서는 Gateway를 loopback 전용으로 유지하고 SSH 터널로 접근하세요.
          # 공개 노출하려면 `127.0.0.1:` 접두사를 제거하고 방화벽을 적절히 구성하세요.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured`는 부트스트랩 편의용일 뿐이며, 올바른 gateway 구성을 대체하지 않습니다. 배포에는 여전히 인증(`gateway.auth.token` 또는 비밀번호)을 설정하고 안전한 바인드 설정을 사용하세요.

  </Step>

  <Step title="공용 Docker VM 런타임 단계">
    공통 Docker 호스트 흐름에는 공용 런타임 가이드를 사용하세요.

    - [필요한 바이너리를 이미지에 bake하기](/ko/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [빌드 및 실행](/ko/install/docker-vm-runtime#build-and-launch)
    - [무엇이 어디에 영속되는가](/ko/install/docker-vm-runtime#what-persists-where)
    - [업데이트](/ko/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 전용 실행 참고">
    GCP에서는 `pnpm install --frozen-lockfile` 중 `Killed` 또는 `exit code 137`로 빌드가 실패하면 VM 메모리가 부족한 것입니다. 최소 `e2-small`, 더 안정적인 첫 빌드에는 `e2-medium`을 사용하세요.

    LAN으로 바인딩하는 경우(`OPENCLAW_GATEWAY_BIND=lan`), 계속하기 전에 신뢰할 수 있는 브라우저 origin을 구성하세요.

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    gateway 포트를 변경했다면 `18789`를 구성한 포트로 바꾸세요.

  </Step>

  <Step title="노트북에서 접근">
    Gateway 포트를 포워딩하는 SSH 터널을 만드세요.

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    브라우저에서 열기:

    `http://127.0.0.1:18789/`

    깔끔한 dashboard 링크 다시 출력:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI가 공유 비밀 인증을 요구하면 구성된 토큰 또는
    비밀번호를 Control UI 설정에 붙여 넣으세요. 이 Docker 흐름은 기본적으로 토큰을 기록합니다.
    컨테이너 구성을 비밀번호 인증으로 바꿨다면 대신 그
    비밀번호를 사용하세요.

    Control UI에 `unauthorized` 또는 `disconnected (1008): pairing required`가 표시되면 브라우저 device를 승인하세요.

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    공용 영속성 및 업데이트 참조가 다시 필요한가요?
    [Docker VM Runtime](/ko/install/docker-vm-runtime#what-persists-where) 및 [Docker VM Runtime updates](/ko/install/docker-vm-runtime#updates)를 참조하세요.

  </Step>
</Steps>

---

## 문제 해결

**SSH 연결 거부됨**

VM 생성 후 SSH 키 전파에는 1-2분이 걸릴 수 있습니다. 기다렸다가 다시 시도하세요.

**OS Login 문제**

OS Login 프로필을 확인하세요:

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지 확인하세요.

**메모리 부족(OOM)**

Docker 빌드가 `Killed` 및 `exit code 137`로 실패하면 VM이 OOM-kill된 것입니다. `e2-small`(최소) 또는 `e2-medium`(안정적인 로컬 빌드에 권장)으로 업그레이드하세요.

```bash
# 먼저 VM 중지
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 머신 유형 변경
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM 시작
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 서비스 계정(보안 모범 사례)

개인 용도라면 기본 사용자 계정으로 충분합니다.

자동화 또는 CI/CD 파이프라인에는 최소 권한의 전용 서비스 계정을 생성하세요.

1. 서비스 계정 생성:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin 역할(또는 더 좁은 사용자 지정 역할) 부여:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

자동화에 Owner 역할을 사용하지 마세요. 최소 권한 원칙을 사용하세요.

IAM 역할 세부 사항은 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)를 참조하세요.

---

## 다음 단계

- 메시징 채널 설정: [Channels](/ko/channels)
- 로컬 device를 node로 페어링: [Nodes](/ko/nodes)
- Gateway 구성: [Gateway configuration](/ko/gateway/configuration)

## 관련 항목

- [설치 개요](/ko/install)
- [Azure](/ko/install/azure)
- [VPS 호스팅](/ko/vps)
