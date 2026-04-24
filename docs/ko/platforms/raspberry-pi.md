---
read_when:
    - Raspberry Pi에 OpenClaw 설정하기
    - ARM 기기에서 OpenClaw 실행하기
    - 저렴한 상시 실행 개인 AI 구축하기
summary: Raspberry Pi에서 OpenClaw 실행하기(예산형 self-hosted 설정)
title: Raspberry Pi (플랫폼)
x-i18n:
    generated_at: "2026-04-24T06:25:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi에서 OpenClaw 실행하기

## 목표

**약 \$35-80의 일회성 비용**(월 요금 없음)으로 Raspberry Pi에서 지속적이고 항상 켜진 OpenClaw Gateway를 실행합니다.

다음에 적합합니다:

- 24/7 개인 AI 어시스턴트
- 홈 오토메이션 허브
- 저전력, 항상 사용 가능한 Telegram/WhatsApp 봇

## 하드웨어 요구 사항

| Pi 모델 | RAM | 가능 여부 | 참고 |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5** | 4GB/8GB | ✅ 최고 | 가장 빠름, 권장 |
| **Pi 4** | 4GB | ✅ 좋음 | 대부분 사용자에게 최적 |
| **Pi 4** | 2GB | ✅ 괜찮음 | 동작함, 스왑 추가 |
| **Pi 4** | 1GB | ⚠️ 빠듯함 | 스왑과 최소 구성으로 가능 |
| **Pi 3B+** | 1GB | ⚠️ 느림 | 동작하지만 굼뜸 |
| **Pi Zero 2 W** | 512MB | ❌ | 권장하지 않음 |

**최소 사양:** RAM 1GB, 코어 1개, 디스크 500MB  
**권장:** RAM 2GB+, 64비트 OS, 16GB+ SD 카드(또는 USB SSD)

## 필요한 것

- Raspberry Pi 4 또는 5(2GB+ 권장)
- MicroSD 카드(16GB+) 또는 USB SSD(더 나은 성능)
- 전원 공급 장치(공식 Pi PSU 권장)
- 네트워크 연결(Ethernet 또는 WiFi)
- 약 30분

## 1) OS 플래시

헤드리스 서버에는 데스크톱이 필요 없으므로 **Raspberry Pi OS Lite (64-bit)**를 사용하세요.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/)를 다운로드합니다
2. OS 선택: **Raspberry Pi OS Lite (64-bit)**
3. 기어 아이콘(⚙️)을 클릭해 미리 구성합니다:
   - 호스트 이름 설정: `gateway-host`
   - SSH 활성화
   - 사용자 이름/비밀번호 설정
   - WiFi 구성(Ethernet을 사용하지 않는 경우)
4. SD 카드 / USB 드라이브에 플래시합니다
5. Pi에 삽입하고 부팅합니다

## 2) SSH로 연결

```bash
ssh user@gateway-host
# 또는 IP 주소 사용
ssh user@192.168.x.x
```

## 3) 시스템 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y git curl build-essential

# 시간대 설정(Cron/알림에 중요)
sudo timedatectl set-timezone America/Chicago  # 자신의 시간대로 변경
```

## 4) Node.js 24 설치(ARM64)

```bash
# NodeSource를 통해 Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node --version  # v24.x.x가 표시되어야 함
npm --version
```

## 5) 스왑 추가(2GB 이하에서는 중요)

스왑은 메모리 부족 충돌을 방지합니다:

```bash
# 2GB 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 저 RAM 최적화(swappiness 낮추기)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw 설치

### 옵션 A: 표준 설치(권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 옵션 B: 수정 가능한 설치(실험용)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

수정 가능한 설치는 로그와 코드에 직접 접근할 수 있게 해 주므로 ARM 전용 문제를 디버깅할 때 유용합니다.

## 7) 온보딩 실행

```bash
openclaw onboard --install-daemon
```

마법사에서 다음을 따르세요:

1. **Gateway 모드:** Local
2. **인증:** API 키 권장(OAuth는 헤드리스 Pi에서 까다로울 수 있음)
3. **채널:** 시작은 Telegram이 가장 쉬움
4. **데몬:** 예(systemd)

## 8) 설치 검증

```bash
# 상태 확인
openclaw status

# 서비스 확인(표준 설치 = systemd user unit)
systemctl --user status openclaw-gateway.service

# 로그 보기
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw 대시보드 접근

`user@gateway-host`는 Pi 사용자 이름과 호스트 이름 또는 IP 주소로 바꾸세요.

컴퓨터에서 Pi에게 새 대시보드 URL을 출력하게 하세요:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

이 명령은 `Dashboard URL:`을 출력합니다. `gateway.auth.token`
구성 방식에 따라 URL은 일반 `http://127.0.0.1:18789/` 링크이거나
`#token=...`이 포함된 링크일 수 있습니다.

컴퓨터의 다른 터미널에서 SSH 터널을 생성하세요:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

그런 다음 출력된 Dashboard URL을 로컬 브라우저에서 여세요.

UI가 공유 시크릿 인증을 요구하면 구성된 토큰 또는 비밀번호를
Control UI 설정에 붙여넣으세요. 토큰 인증의 경우 `gateway.auth.token`(또는
`OPENCLAW_GATEWAY_TOKEN`)을 사용하세요.

항상 켜진 원격 접근은 [Tailscale](/ko/gateway/tailscale)을 참고하세요.

---

## 성능 최적화

### USB SSD 사용(엄청난 개선)

SD 카드는 느리고 수명이 닳습니다. USB SSD는 성능을 크게 개선합니다:

```bash
# USB로 부팅 중인지 확인
lsblk
```

설정은 [Pi USB 부팅 가이드](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참고하세요.

### CLI 시작 속도 향상(모듈 컴파일 캐시)

저전력 Pi 호스트에서는 Node의 모듈 컴파일 캐시를 활성화해 반복 CLI 실행 속도를 높이세요:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

참고:

- `NODE_COMPILE_CACHE`는 이후 실행(`status`, `health`, `--help`) 속도를 높입니다.
- `/var/tmp`는 `/tmp`보다 재부팅 후 유지성이 좋습니다.
- `OPENCLAW_NO_RESPAWN=1`은 CLI self-respawn로 인한 추가 시작 비용을 피합니다.
- 첫 실행은 캐시를 예열하고, 이후 실행에서 가장 큰 효과를 봅니다.

### systemd 시작 튜닝(선택 사항)

이 Pi가 주로 OpenClaw를 실행한다면, 서비스 drop-in을 추가해 재시작
지터를 줄이고 시작 환경을 안정적으로 유지하세요:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

그런 다음 적용:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

가능하면 OpenClaw 상태/캐시는 SSD 기반 저장소에 두어 콜드 스타트 중 SD 카드의
랜덤 I/O 병목을 피하세요.

헤드리스 Pi라면, 로그아웃 후에도 사용자 서비스가 유지되도록 lingering을 한 번 활성화하세요:

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` 정책이 자동 복구에 어떻게 도움되는지:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### 메모리 사용량 줄이기

```bash
# GPU 메모리 할당 비활성화(헤드리스)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 필요 없으면 Bluetooth 비활성화
sudo systemctl disable bluetooth
```

### 리소스 모니터링

```bash
# 메모리 확인
free -h

# CPU 온도 확인
vcgencmd measure_temp

# 실시간 모니터링
htop
```

---

## ARM 전용 참고

### 바이너리 호환성

대부분의 OpenClaw 기능은 ARM64에서 작동하지만, 일부 외부 바이너리는 ARM 빌드가 필요할 수 있습니다:

| 도구 | ARM64 상태 | 참고 |
| ------------------ | ------------ | ----------------------------------- |
| Node.js | ✅ | 매우 잘 작동 |
| WhatsApp (Baileys) | ✅ | 순수 JS, 문제 없음 |
| Telegram | ✅ | 순수 JS, 문제 없음 |
| gog (Gmail CLI) | ⚠️ | ARM 릴리스 확인 필요 |
| Chromium (browser) | ✅ | `sudo apt install chromium-browser` |

Skill이 실패한다면 해당 바이너리에 ARM 빌드가 있는지 확인하세요. 많은 Go/Rust 도구는 있지만, 없는 것도 있습니다.

### 32비트 vs 64비트

**항상 64비트 OS를 사용하세요.** Node.js와 많은 현대 도구가 이를 요구합니다. 다음으로 확인하세요:

```bash
uname -m
# 다음이 표시되어야 함: aarch64 (64비트), armv7l (32비트) 아님
```

---

## 권장 모델 설정

Pi는 Gateway 역할만 하고(모델은 클라우드에서 실행), API 기반 모델을 사용하세요:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Pi에서 로컬 LLM을 실행하려고 하지 마세요** — 작은 모델도 너무 느립니다. Claude/GPT가 무거운 작업을 하도록 두세요.

---

## 부팅 시 자동 시작

온보딩이 이를 설정하지만, 검증하려면:

```bash
# 서비스 활성화 여부 확인
systemctl --user is-enabled openclaw-gateway.service

# 활성화되지 않았다면
systemctl --user enable openclaw-gateway.service

# 부팅 시 시작
systemctl --user start openclaw-gateway.service
```

---

## 문제 해결

### 메모리 부족(OOM)

```bash
# 메모리 확인
free -h

# 더 많은 스왑 추가(5단계 참고)
# 또는 Pi에서 실행 중인 서비스 줄이기
```

### 느린 성능

- SD 카드 대신 USB SSD 사용
- 사용하지 않는 서비스 비활성화: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling 확인: `vcgencmd get_throttled` (`0x0`이 반환되어야 함)

### 서비스가 시작되지 않음

```bash
# 로그 확인
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# 일반적인 해결: 재빌드
cd ~/openclaw  # 수정 가능한 설치를 사용하는 경우
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 바이너리 문제

Skill이 "exec format error"와 함께 실패하면:

1. 해당 바이너리에 ARM64 빌드가 있는지 확인하세요
2. 소스에서 빌드해 보세요
3. 또는 ARM 지원이 있는 Docker 컨테이너를 사용하세요

### WiFi 끊김

WiFi를 사용하는 헤드리스 Pi의 경우:

```bash
# WiFi 전원 관리 비활성화
sudo iwconfig wlan0 power off

# 영구 적용
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 비용 비교

| 구성 | 일회성 비용 | 월 비용 | 참고 |
| -------------- | ------------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~$45 | $0 | + 전기료 (~$5/년) |
| **Pi 4 (4GB)** | ~$55 | $0 | 권장 |
| **Pi 5 (4GB)** | ~$60 | $0 | 최고의 성능 |
| **Pi 5 (8GB)** | ~$80 | $0 | 과하지만 미래 대비 |
| DigitalOcean | $0 | $6/월 | $72/년 |
| Hetzner | $0 | €3.79/월 | ~$50/년 |

**손익분기점:** Pi는 클라우드 VPS 대비 약 6~12개월 안에 본전을 뽑습니다.

---

## 관련 문서

- [Linux 가이드](/ko/platforms/linux) — 일반 Linux 설정
- [DigitalOcean 가이드](/ko/install/digitalocean) — 클라우드 대안
- [Hetzner 가이드](/ko/install/hetzner) — Docker 설정
- [Tailscale](/ko/gateway/tailscale) — 원격 접근
- [Nodes](/ko/nodes) — 노트북/휴대폰을 Pi Gateway와 페어링
