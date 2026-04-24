---
read_when:
    - DigitalOcean에 OpenClaw 설정하기
    - OpenClaw용 간단한 유료 VPS를 찾고 있습니다
summary: DigitalOcean Droplet에 OpenClaw 호스팅하기
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T06:20:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

DigitalOcean Droplet에서 지속적으로 실행되는 OpenClaw Gateway를 운영하세요.

## 사전 요구 사항

- DigitalOcean 계정([가입](https://cloud.digitalocean.com/registrations/new))
- SSH 키 쌍(또는 비밀번호 인증 사용 의사)
- 약 20분

## 설정

<Steps>
  <Step title="Droplet 생성">
    <Warning>
    깨끗한 베이스 이미지(Ubuntu 24.04 LTS)를 사용하세요. 시작 스크립트와 방화벽 기본값을 검토하지 않았다면 서드파티 Marketplace 1-click 이미지는 피하세요.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/)에 로그인합니다.
    2. **Create > Droplets**를 클릭합니다.
    3. 다음을 선택합니다:
       - **리전:** 가장 가까운 지역
       - **이미지:** Ubuntu 24.04 LTS
       - **크기:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **인증:** SSH 키(권장) 또는 비밀번호
    4. **Create Droplet**을 클릭하고 IP 주소를 기록합니다.

  </Step>

  <Step title="연결 및 설치">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 설치
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw 설치
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사가 모델 인증, 채널 설정, Gateway 토큰 생성, 데몬 설치(systemd)를 안내합니다.

  </Step>

  <Step title="스왑 추가(1 GB Droplet 권장)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway 검증">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI 접근">
    Gateway는 기본적으로 loopback에 바인드됩니다. 다음 옵션 중 하나를 선택하세요.

    **옵션 A: SSH 터널(가장 간단함)**

    ```bash
    # 로컬 머신에서
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    그런 다음 `http://localhost:18789`를 엽니다.

    **옵션 B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    그런 다음 tailnet의 아무 기기에서나 `https://<magicdns>/`를 엽니다.

    **옵션 C: Tailnet bind(Serve 없음)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    그런 다음 `http://<tailscale-ip>:18789`를 엽니다(토큰 필요).

  </Step>
</Steps>

## 문제 해결

**Gateway가 시작되지 않음** -- `openclaw doctor --non-interactive`를 실행하고 `journalctl --user -u openclaw-gateway.service -n 50`로 로그를 확인하세요.

**포트가 이미 사용 중임** -- `lsof -i :18789`를 실행해 프로세스를 찾은 뒤 중지하세요.

**메모리 부족** -- `free -h`로 스왑이 활성 상태인지 확인하세요. 여전히 OOM이 발생하면 로컬 모델 대신 API 기반 모델(Claude, GPT)을 사용하거나 2 GB Droplet로 업그레이드하세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션
- [업데이트](/ko/install/updating) -- OpenClaw를 최신 상태로 유지

## 관련 문서

- [설치 개요](/ko/install)
- [Fly.io](/ko/install/fly)
- [Hetzner](/ko/install/hetzner)
- [VPS 호스팅](/ko/vps)
