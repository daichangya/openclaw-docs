---
read_when:
    - Oracle Cloud에 OpenClaw 설정하기
    - OpenClaw용 무료 VPS 호스팅 찾기
    - 작은 서버에서 24/7 OpenClaw를 원하시는 것입니다
summary: Oracle Cloud Always Free ARM 티어에서 OpenClaw 호스팅
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T06:22:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Oracle Cloud의 **Always Free** ARM 티어(최대 4 OCPU, 24 GB RAM, 200 GB 스토리지)에서 비용 없이 지속 실행되는 OpenClaw Gateway를 운영하세요.

## 사전 준비

- Oracle Cloud 계정([signup](https://www.oracle.com/cloud/free/)) -- 문제가 생기면 [커뮤니티 가입 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) 참조
- Tailscale 계정([tailscale.com](https://tailscale.com)에서 무료)
- SSH 키 쌍
- 약 30분

## 설정

<Steps>
  <Step title="OCI 인스턴스 생성">
    1. [Oracle Cloud Console](https://cloud.oracle.com/)에 로그인합니다.
    2. **Compute > Instances > Create Instance**로 이동합니다.
    3. 다음과 같이 구성합니다:
       - **이름:** `openclaw`
       - **이미지:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (또는 최대 4)
       - **메모리:** 12 GB (또는 최대 24 GB)
       - **부트 볼륨:** 50 GB (최대 200 GB 무료)
       - **SSH 키:** 공개 키 추가
    4. **Create**를 클릭하고 공인 IP 주소를 기록합니다.

    <Tip>
    인스턴스 생성이 "Out of capacity"로 실패하면 다른 availability domain을 시도하거나 나중에 다시 시도하세요. 무료 티어 용량은 제한적입니다.
    </Tip>

  </Step>

  <Step title="접속 후 시스템 업데이트">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential`은 일부 의존성을 ARM에서 컴파일하는 데 필요합니다.

  </Step>

  <Step title="사용자 및 호스트 이름 구성">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    linger를 활성화하면 로그아웃 후에도 사용자 서비스가 계속 실행됩니다.

  </Step>

  <Step title="Tailscale 설치">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    이제부터는 Tailscale을 통해 접속하세요: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw 설치">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    "How do you want to hatch your bot?" 프롬프트가 나오면 **Do this later**를 선택하세요.

  </Step>

  <Step title="Gateway 구성">
    안전한 원격 액세스를 위해 Tailscale Serve와 토큰 인증을 사용합니다.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    여기서 `gateway.trustedProxies=["127.0.0.1"]`는 로컬 Tailscale Serve 프록시의 전달 IP/로컬 클라이언트 처리용일 뿐입니다. 이는 `gateway.auth.mode: "trusted-proxy"`가 **아닙니다**. 이 설정에서는 diff viewer 경로도 닫힌 실패 동작을 유지합니다. 전달 프록시 헤더가 없는 원시 `127.0.0.1` viewer 요청은 `Diff not found`를 반환할 수 있습니다. 첨부 파일에는 `mode=file` / `mode=both`를 사용하거나, 공유 가능한 viewer 링크가 필요하면 의도적으로 원격 viewer를 활성화하고 `plugins.entries.diffs.config.viewerBaseUrl`(또는 프록시 `baseUrl`)을 설정하세요.

  </Step>

  <Step title="VCN 보안 잠그기">
    네트워크 엣지에서 Tailscale을 제외한 모든 트래픽을 차단합니다.

    1. OCI Console에서 **Networking > Virtual Cloud Networks**로 이동합니다.
    2. VCN을 클릭한 다음 **Security Lists > Default Security List**로 이동합니다.
    3. `0.0.0.0/0 UDP 41641`(Tailscale)을 제외한 모든 인바운드 규칙을 **제거**합니다.
    4. 기본 이그레스 규칙은 유지합니다(모든 아웃바운드 허용).

    이렇게 하면 포트 22의 SSH, HTTP, HTTPS, 기타 모든 것이 네트워크 엣지에서 차단됩니다. 이 시점부터는 Tailscale을 통해서만 연결할 수 있습니다.

  </Step>

  <Step title="검증">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    tailnet에 있는 모든 기기에서 Control UI에 접근:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>`은 tailnet 이름으로 바꾸세요(`tailscale status`에서 확인 가능).

  </Step>
</Steps>

## 대체 방법: SSH 터널

Tailscale Serve가 작동하지 않으면 로컬 머신에서 SSH 터널을 사용하세요.

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

그런 다음 `http://localhost:18789`를 여세요.

## 문제 해결

**인스턴스 생성 실패("Out of capacity")** -- 무료 티어 ARM 인스턴스는 인기가 많습니다. 다른 availability domain을 시도하거나 비혼잡 시간대에 다시 시도하세요.

**Tailscale이 연결되지 않음** -- `sudo tailscale up --ssh --hostname=openclaw --reset`을 실행하여 다시 인증하세요.

**Gateway가 시작되지 않음** -- `openclaw doctor --non-interactive`를 실행하고 `journalctl --user -u openclaw-gateway.service -n 50`으로 로그를 확인하세요.

**ARM 바이너리 문제** -- 대부분의 npm 패키지는 ARM64에서 작동합니다. 네이티브 바이너리의 경우 `linux-arm64` 또는 `aarch64` 릴리스를 찾으세요. `uname -m`으로 아키텍처를 확인하세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션
- [업데이트](/ko/install/updating) -- OpenClaw 최신 상태 유지

## 관련

- [설치 개요](/ko/install)
- [GCP](/ko/install/gcp)
- [VPS 호스팅](/ko/vps)
