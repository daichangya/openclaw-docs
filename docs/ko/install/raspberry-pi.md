---
read_when:
    - Raspberry Pi에 OpenClaw를 설정하는 중입니다.
    - ARM 장치에서 OpenClaw를 실행하는 중입니다.
    - 저렴한 항상 켜진 개인 AI를 구축하는 중입니다.
summary: 항상 켜진 셀프 호스팅을 위해 Raspberry Pi에서 OpenClaw 호스팅
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T06:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

지속적이고 항상 켜져 있는 OpenClaw Gateway를 Raspberry Pi에서 실행하세요. Pi는 gateway 역할만 하고 모델은 API를 통해 클라우드에서 실행되므로, 비교적 보급형 Pi도 이 워크로드를 충분히 처리할 수 있습니다.

## 사전 요구 사항

- Raspberry Pi 4 또는 5, RAM 2 GB 이상(4 GB 권장)
- MicroSD 카드(16 GB 이상) 또는 USB SSD(성능상 더 좋음)
- 공식 Pi 전원 공급 장치
- 네트워크 연결(Ethernet 또는 WiFi)
- 64비트 Raspberry Pi OS(필수 -- 32비트 사용 금지)
- 약 30분

## 설정

<Steps>
  <Step title="OS 플래시">
    헤드리스 서버에는 데스크톱이 필요 없으므로 **Raspberry Pi OS Lite (64-bit)**를 사용하세요.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/)를 다운로드합니다.
    2. OS 선택: **Raspberry Pi OS Lite (64-bit)**
    3. 설정 대화상자에서 다음을 미리 구성합니다.
       - Hostname: `gateway-host`
       - SSH 활성화
       - 사용자 이름과 비밀번호 설정
       - WiFi 구성(Ethernet을 사용하지 않는 경우)
    4. SD 카드 또는 USB 드라이브에 플래시한 뒤 삽입하고 Pi를 부팅합니다.

  </Step>

  <Step title="SSH로 연결">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="시스템 업데이트">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # 시간대 설정(Cron 및 리마인더에 중요)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 설치">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="스왑 추가(2 GB 이하에서 중요)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 저메모리 장치용 swappiness 감소
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw 설치">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사를 따라가세요. 헤드리스 장치에서는 OAuth보다 API key를 권장합니다. 시작 채널로는 Telegram이 가장 쉽습니다.

  </Step>

  <Step title="검증">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI 접근">
    컴퓨터에서 Pi로부터 대시보드 URL을 가져옵니다.

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    그런 다음 다른 터미널에서 SSH 터널을 만드세요.

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    로컬 브라우저에서 출력된 URL을 엽니다. 항상 켜진 원격 액세스는 [Tailscale 통합](/ko/gateway/tailscale)을 참조하세요.

  </Step>
</Steps>

## 성능 팁

**USB SSD 사용** -- SD 카드는 느리고 수명이 빨리 닳습니다. USB SSD는 성능을 크게 개선합니다. [Pi USB 부팅 가이드](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참조하세요.

**모듈 컴파일 캐시 활성화** -- 저전력 Pi 호스트에서 반복적인 CLI 호출 속도를 높입니다.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**메모리 사용량 줄이기** -- 헤드리스 설정에서는 GPU 메모리를 줄이고 사용하지 않는 서비스를 비활성화하세요.

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## 문제 해결

**메모리 부족** -- `free -h`로 스왑이 활성화되어 있는지 확인하세요. 사용하지 않는 서비스를 비활성화하세요(`sudo systemctl disable cups bluetooth avahi-daemon`). API 기반 모델만 사용하세요.

**느린 성능** -- SD 카드 대신 USB SSD를 사용하세요. `vcgencmd get_throttled`로 CPU throttling을 확인하세요(반환값은 `0x0`이어야 함).

**서비스가 시작되지 않음** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100`로 로그를 확인하고 `openclaw doctor --non-interactive`를 실행하세요. 헤드리스 Pi라면 lingering도 활성화되어 있는지 확인하세요: `sudo loginctl enable-linger "$(whoami)"`.

**ARM 바이너리 문제** -- Skill이 "exec format error"로 실패하면 해당 바이너리에 ARM64 빌드가 있는지 확인하세요. `uname -m`으로 아키텍처를 확인하세요(`aarch64`가 표시되어야 함).

**WiFi 끊김** -- WiFi 전원 관리를 비활성화하세요: `sudo iwconfig wlan0 power off`.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결
- [Gateway 구성](/ko/gateway/configuration) -- 모든 config 옵션
- [업데이트](/ko/install/updating) -- OpenClaw를 최신 상태로 유지

## 관련 항목

- [설치 개요](/ko/install)
- [Linux 서버](/ko/vps)
- [플랫폼](/ko/platforms)
