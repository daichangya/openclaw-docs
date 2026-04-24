---
read_when:
    - Linux 서버 또는 클라우드 VPS에서 Gateway를 실행하고 싶습니다
    - 호스팅 가이드의 빠른 개요가 필요합니다
    - OpenClaw용 일반 Linux 서버 튜닝을 원합니다
sidebarTitle: Linux Server
summary: Linux 서버 또는 클라우드 VPS에서 OpenClaw 실행하기 — provider 선택, 아키텍처, 튜닝
title: Linux 서버
x-i18n:
    generated_at: "2026-04-24T06:43:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

모든 Linux 서버 또는 클라우드 VPS에서 OpenClaw Gateway를 실행할 수 있습니다. 이 페이지는
provider 선택을 돕고, 클라우드 배포가 어떻게 동작하는지 설명하며, 어디서나 적용되는 일반 Linux
튜닝을 다룹니다.

## provider 선택

<CardGroup cols={2}>
  <Card title="Railway" href="/ko/install/railway">원클릭, 브라우저 설정</Card>
  <Card title="Northflank" href="/ko/install/northflank">원클릭, 브라우저 설정</Card>
  <Card title="DigitalOcean" href="/ko/install/digitalocean">간단한 유료 VPS</Card>
  <Card title="Oracle Cloud" href="/ko/install/oracle">Always Free ARM 티어</Card>
  <Card title="Fly.io" href="/ko/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ko/install/hetzner">Hetzner VPS에서 Docker</Card>
  <Card title="Hostinger" href="/ko/install/hostinger">원클릭 설정이 있는 VPS</Card>
  <Card title="GCP" href="/ko/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ko/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ko/install/exe-dev">HTTPS 프록시가 있는 VM</Card>
  <Card title="Raspberry Pi" href="/ko/install/raspberry-pi">ARM 셀프 호스팅</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)**도 잘 동작합니다.
커뮤니티 영상 안내는 다음에서 볼 수 있습니다:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(커뮤니티 자료 -- 더 이상 제공되지 않을 수 있음).

## 클라우드 설정이 동작하는 방식

- **Gateway는 VPS에서 실행**되며 상태 + 작업공간을 소유합니다.
- **Control UI** 또는 **Tailscale/SSH**를 통해 노트북이나 휴대폰에서 연결합니다.
- VPS를 source of truth로 취급하고 상태 + 작업공간을 정기적으로 **백업**하세요.
- 안전한 기본값: Gateway를 loopback에 유지하고 SSH 터널 또는 Tailscale Serve로 접근하세요.
  `lan` 또는 `tailnet`에 바인딩하는 경우 `gateway.auth.token` 또는 `gateway.auth.password`를 요구하세요.

관련 페이지: [Gateway 원격 액세스](/ko/gateway/remote), [플랫폼 허브](/ko/platforms).

## VPS에서 공유 회사 에이전트 실행

모든 사용자가 동일한 신뢰 경계 안에 있고 에이전트가 업무 전용이라면, 팀을 위한 단일 에이전트를 실행하는 것은 유효한 설정입니다.

- 전용 런타임(VPS/VM/컨테이너 + 전용 OS 사용자/계정)에서 유지하세요.
- 해당 런타임을 개인 Apple/Google 계정이나 개인 브라우저/비밀번호 관리자 프로필에 로그인시키지 마세요.
- 사용자끼리 적대적일 수 있다면 gateway/host/OS 사용자 기준으로 분리하세요.

보안 모델 세부 사항: [보안](/ko/gateway/security).

## VPS와 함께 Node 사용

Gateway는 클라우드에 두고 로컬 장치에 **Node**를 페어링할 수 있습니다
(Mac/iOS/Android/헤드리스). Node는 로컬 화면/카메라/canvas와 `system.run`
capability를 제공하고, Gateway는 클라우드에 유지됩니다.

문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

## 소형 VM 및 ARM 호스트를 위한 시작 튜닝

저전력 VM(또는 ARM 호스트)에서 CLI 명령이 느리게 느껴진다면 Node의 모듈 컴파일 캐시를 활성화하세요:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`는 반복 명령의 시작 시간을 개선합니다.
- `OPENCLAW_NO_RESPAWN=1`은 self-respawn 경로에서 발생하는 추가 시작 오버헤드를 피합니다.
- 첫 명령 실행은 캐시를 워밍업하고, 이후 실행은 더 빨라집니다.
- Raspberry Pi 관련 세부 사항은 [Raspberry Pi](/ko/install/raspberry-pi)를 참조하세요.

### systemd 튜닝 체크리스트 (선택 사항)

`systemd`를 사용하는 VM 호스트에서는 다음을 고려하세요:

- 안정적인 시작 경로를 위한 서비스 환경 변수 추가:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 재시작 동작을 명시적으로 유지:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 상태/캐시 경로의 랜덤 I/O 콜드 스타트 페널티를 줄이기 위해 SSD 기반 디스크를 선호하세요.

표준 `openclaw onboard --install-daemon` 경로에서는 사용자 유닛을 편집하세요:

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

의도적으로 시스템 유닛을 설치했다면,
`sudo systemctl edit openclaw-gateway.service`로 `openclaw-gateway.service`를 편집하세요.

`Restart=` 정책이 자동 복구에 어떻게 도움이 되는지는 다음을 참조하세요:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM 동작, 자식 프로세스 희생자 선택, `exit 137`
진단에 대해서는 [Linux 메모리 압박 및 OOM kill](/ko/platforms/linux#memory-pressure-and-oom-kills)를 참조하세요.

## 관련

- [설치 개요](/ko/install)
- [DigitalOcean](/ko/install/digitalocean)
- [Fly.io](/ko/install/fly)
- [Hetzner](/ko/install/hetzner)
