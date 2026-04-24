---
read_when:
    - DigitalOcean에 OpenClaw 설정하기
    - OpenClaw용 저렴한 VPS 호스팅을 찾고 있습니다
summary: DigitalOcean에서 OpenClaw 사용하기(간단한 유료 VPS 옵션)
title: DigitalOcean(플랫폼)
x-i18n:
    generated_at: "2026-04-24T06:23:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean에서 OpenClaw 사용하기

## 목표

DigitalOcean에서 **월 $6**(또는 예약 요금 사용 시 월 $4)으로 지속 실행되는 OpenClaw Gateway를 운영합니다.

월 $0 옵션을 원하고 ARM + 제공업체별 설정을 감수할 수 있다면 [Oracle Cloud 가이드](/ko/install/oracle)를 참조하세요.

## 비용 비교 (2026)

| Provider     | Plan            | Specs                  | Price/mo    | Notes                              |
| ------------ | --------------- | ---------------------- | ----------- | ---------------------------------- |
| Oracle Cloud | Always Free ARM | 최대 4 OCPU, 24GB RAM  | $0          | ARM, 제한된 수용량 / 가입 특이사항 |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | 가장 저렴한 유료 옵션              |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | 쉬운 UI, 좋은 문서                 |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | 많은 지역                          |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | 현재 Akamai 소속                   |

**제공업체 선택하기:**

- DigitalOcean: 가장 단순한 UX + 예측 가능한 설정(이 가이드)
- Hetzner: 좋은 가격/성능([Hetzner 가이드](/ko/install/hetzner) 참조)
- Oracle Cloud: 월 $0 가능하지만 더 까다롭고 ARM 전용([Oracle 가이드](/ko/install/oracle) 참조)

---

## 사전 요구 사항

- DigitalOcean 계정([$200 무료 크레딧으로 가입](https://m.do.co/c/signup))
- SSH 키 쌍(또는 비밀번호 인증 사용 의향)
- 약 20분

## 1) Droplet 만들기

<Warning>
깨끗한 베이스 이미지(Ubuntu 24.04 LTS)를 사용하세요. 시작 스크립트와 방화벽 기본값을 검토하지 않았다면 서드파티 Marketplace 1-click 이미지는 피하세요.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/)에 로그인합니다.
2. **Create → Droplets**를 클릭합니다.
3. 다음을 선택합니다.
   - **Region:** 본인(또는 사용자)과 가장 가까운 지역
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH 키(권장) 또는 비밀번호
4. **Create Droplet**을 클릭합니다.
5. IP 주소를 기록해 둡니다.

## 2) SSH로 연결

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw 설치

```bash
# 시스템 업데이트
apt update && apt upgrade -y

# Node.js 24 설치
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw 설치
curl -fsSL https://openclaw.ai/install.sh | bash

# 확인
openclaw --version
```

## 4) 온보딩 실행

```bash
openclaw onboard --install-daemon
```

마법사가 다음 과정을 안내합니다.

- 모델 인증(API 키 또는 OAuth)
- 채널 설정(Telegram, WhatsApp, Discord 등)
- Gateway 토큰(자동 생성)
- 데몬 설치(systemd)

## 5) Gateway 확인

```bash
# 상태 확인
openclaw status

# 서비스 확인
systemctl --user status openclaw-gateway.service

# 로그 보기
journalctl --user -u openclaw-gateway.service -f
```

## 6) 대시보드 접근

Gateway는 기본적으로 loopback에 바인딩됩니다. Control UI에 접근하려면 다음을 사용하세요.

**옵션 A: SSH 터널(권장)**

```bash
# 로컬 머신에서
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# 그런 다음 열기: http://localhost:18789
```

**옵션 B: Tailscale Serve (HTTPS, loopback-only)**

```bash
# droplet에서
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Gateway가 Tailscale Serve를 사용하도록 설정
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

열기: `https://<magicdns>/`

참고:

- Serve는 Gateway를 loopback-only로 유지하고 Tailscale identity header를 통해 Control UI/WebSocket 트래픽을 인증합니다(토큰 없는 인증은 신뢰할 수 있는 gateway 호스트를 가정함. HTTP API는 이러한 Tailscale header를 사용하지 않고 대신 gateway의 일반 HTTP 인증 모드를 따릅니다).
- 대신 명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

**옵션 C: tailnet 바인딩(Serve 없음)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

열기: `http://<tailscale-ip>:18789` (토큰 필요)

## 7) 채널 연결

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR 코드 스캔
```

다른 제공업체는 [채널](/ko/channels)을 참조하세요.

---

## 1GB RAM 최적화

$6 droplet에는 1GB RAM만 있습니다. 원활하게 실행하려면 다음을 고려하세요.

### swap 추가(권장)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 더 가벼운 모델 사용

OOM이 발생한다면 다음을 고려하세요.

- 로컬 모델 대신 API 기반 모델(Claude, GPT) 사용
- `agents.defaults.model.primary`를 더 작은 모델로 설정

### 메모리 모니터링

```bash
free -h
htop
```

---

## 지속성

모든 상태는 다음 위치에 저장됩니다.

- `~/.openclaw/` — `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공업체 상태, 세션 데이터
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, memory 등)

이 데이터는 재부팅 후에도 유지됩니다. 주기적으로 백업하세요.

```bash
openclaw backup create
```

---

## Oracle Cloud 무료 대안

Oracle Cloud는 여기의 어떤 유료 옵션보다도 훨씬 강력한 **Always Free** ARM 인스턴스를 월 $0에 제공합니다.

| 제공 항목          | Specs             |
| ------------------ | ----------------- |
| **4 OCPU**         | ARM Ampere A1     |
| **24GB RAM**       | 충분하고도 남음   |
| **200GB storage**  | Block volume      |
| **영구 무료**      | 신용카드 청구 없음 |

**주의 사항:**

- 가입이 까다로울 수 있음(실패하면 다시 시도)
- ARM 아키텍처 — 대부분은 동작하지만 일부 바이너리는 ARM 빌드가 필요함

전체 설정 가이드는 [Oracle Cloud](/ko/install/oracle)를 참조하세요. 가입 팁과 등록 과정 문제 해결은 이 [커뮤니티 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참조하세요.

---

## 문제 해결

### Gateway가 시작되지 않음

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 포트가 이미 사용 중임

```bash
lsof -i :18789
kill <PID>
```

### 메모리 부족

```bash
# 메모리 확인
free -h

# swap을 더 추가
# 또는 $12/월 droplet(2GB RAM)로 업그레이드
```

---

## 관련 항목

- [Hetzner 가이드](/ko/install/hetzner) — 더 저렴하고 더 강력함
- [Docker 설치](/ko/install/docker) — 컨테이너 기반 설정
- [Tailscale](/ko/gateway/tailscale) — 안전한 원격 접근
- [구성](/ko/gateway/configuration) — 전체 config 참조
