---
read_when:
    - Oracle Cloud에서 OpenClaw를 설정하는 중입니다.
    - OpenClaw용 저비용 VPS 호스팅을 찾는 중입니다.
    - 작은 서버에서 24/7 OpenClaw를 실행하려고 합니다.
summary: Oracle Cloud(Always Free ARM)에서 OpenClaw 실행
title: Oracle Cloud (플랫폼)
x-i18n:
    generated_at: "2026-04-24T06:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud(OCI)에서 OpenClaw

## 목표

Oracle Cloud의 **Always Free** ARM 티어에서 지속적으로 실행되는 OpenClaw Gateway를 운영합니다.

Oracle의 무료 티어는 OpenClaw에 잘 맞을 수 있습니다(특히 이미 OCI 계정이 있다면). 하지만 다음과 같은 트레이드오프가 있습니다.

- ARM 아키텍처(대부분은 동작하지만 일부 바이너리는 x86 전용일 수 있음)
- 용량과 가입 과정이 다소 까다로울 수 있음

## 비용 비교 (2026)

| Provider     | Plan            | 사양                   | 월 비용   | 참고                     |
| ------------ | --------------- | ---------------------- | -------- | ------------------------ |
| Oracle Cloud | Always Free ARM | 최대 4 OCPU, 24GB RAM  | $0       | ARM, 제한된 용량         |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4     | 가장 저렴한 유료 옵션    |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6       | 쉬운 UI, 좋은 문서       |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6       | 다양한 지역              |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5       | 현재 Akamai 소속         |

---

## 사전 요구 사항

- Oracle Cloud 계정([signup](https://www.oracle.com/cloud/free/)) — 문제가 생기면 [커뮤니티 가입 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) 참조
- Tailscale 계정([tailscale.com](https://tailscale.com)에서 무료)
- 약 30분

## 1) OCI 인스턴스 생성

1. [Oracle Cloud Console](https://cloud.oracle.com/)에 로그인
2. **Compute → Instances → Create Instance**로 이동
3. 다음과 같이 구성:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (또는 최대 4)
   - **Memory:** 12 GB (또는 최대 24 GB)
   - **Boot volume:** 50 GB (최대 200 GB 무료)
   - **SSH key:** 공개 키 추가
4. **Create** 클릭
5. 공인 IP 주소 기록

**팁:** 인스턴스 생성이 "Out of capacity"로 실패하면 다른 가용성 도메인을 시도하거나 나중에 다시 시도하세요. 무료 티어 용량은 제한적입니다.

## 2) 연결 및 업데이트

```bash
# 공인 IP로 연결
ssh ubuntu@YOUR_PUBLIC_IP

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**참고:** 일부 의존성의 ARM 컴파일을 위해 `build-essential`이 필요합니다.

## 3) 사용자 및 호스트명 구성

```bash
# 호스트명 설정
sudo hostnamectl set-hostname openclaw

# ubuntu 사용자 비밀번호 설정
sudo passwd ubuntu

# lingering 활성화(로그아웃 후에도 사용자 서비스 계속 실행)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale 설치

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

이렇게 하면 Tailscale SSH가 활성화되어 tailnet의 어떤 장치에서든 `ssh openclaw`로 연결할 수 있습니다. 공인 IP는 필요 없습니다.

확인:

```bash
tailscale status
```

**이제부터는 Tailscale로 연결:** `ssh ubuntu@openclaw` (또는 Tailscale IP 사용)

## 5) OpenClaw 설치

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?"라는 질문이 나오면 **"Do this later"**를 선택하세요.

> 참고: ARM 네이티브 빌드 문제가 생기면 Homebrew를 쓰기 전에 먼저 시스템 패키지부터 설치하세요(예: `sudo apt install -y build-essential`).

## 6) Gateway 구성(loopback + token auth) 및 Tailscale Serve 활성화

기본값으로 token 인증을 사용하세요. 더 예측 가능하고 “insecure auth” Control UI 플래그를 따로 둘 필요가 없습니다.

```bash
# VM 안에서는 Gateway를 비공개로 유지
openclaw config set gateway.bind loopback

# Gateway + Control UI에 인증 요구
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve를 통해 노출(HTTPS + tailnet 접근)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

여기서 `gateway.trustedProxies=["127.0.0.1"]`는 로컬 Tailscale Serve 프록시의 forwarded-IP/local-client 처리만을 위한 것입니다. **`gateway.auth.mode: "trusted-proxy"`가 아닙니다.** 이 설정에서는 diff viewer 경로가 fail-closed 동작을 유지하므로, forwarded proxy 헤더 없이 들어오는 원시 `127.0.0.1` viewer 요청은 `Diff not found`를 반환할 수 있습니다. 첨부에는 `mode=file` / `mode=both`를 사용하거나, 공유 가능한 viewer 링크가 필요하면 의도적으로 remote viewer를 활성화하고 `plugins.entries.diffs.config.viewerBaseUrl`(또는 프록시 `baseUrl`)을 설정하세요.

## 7) 검증

```bash
# 버전 확인
openclaw --version

# 데몬 상태 확인
systemctl --user status openclaw-gateway.service

# Tailscale Serve 확인
tailscale serve status

# 로컬 응답 테스트
curl http://localhost:18789
```

## 8) VCN 보안 잠그기

모든 것이 동작하는 것을 확인한 후에는 Tailscale 외의 모든 트래픽을 차단하도록 VCN을 잠그세요. OCI의 Virtual Cloud Network는 네트워크 엣지에서 방화벽처럼 동작하여, 트래픽이 인스턴스에 도달하기 전에 차단합니다.

1. OCI Console에서 **Networking → Virtual Cloud Networks**로 이동
2. VCN 클릭 → **Security Lists** → Default Security List
3. 다음을 제외한 모든 ingress 규칙 **제거**:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. 기본 egress 규칙 유지(모든 아웃바운드 허용)

이렇게 하면 22번 포트의 SSH, HTTP, HTTPS 및 그 외 모든 것이 네트워크 엣지에서 차단됩니다. 이제부터는 Tailscale을 통해서만 연결할 수 있습니다.

---

## Control UI 접근

Tailscale 네트워크 내 어느 장치에서든:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>`은 당신의 tailnet 이름으로 바꾸세요(`tailscale status`에서 확인 가능).

SSH 터널은 필요 없습니다. Tailscale이 다음을 제공합니다.

- HTTPS 암호화(자동 인증서)
- Tailscale ID 기반 인증
- tailnet 내 모든 장치(노트북, 휴대폰 등)에서 접근 가능

---

## 보안: VCN + Tailscale(권장 기본값)

VCN이 잠겨 있고(UDP 41641만 열림) Gateway가 loopback에 바인딩되어 있으면, 강력한 defense-in-depth를 얻게 됩니다. 공용 트래픽은 네트워크 엣지에서 차단되고, 관리자 접근은 tailnet을 통해 이루어집니다.

이 설정은 인터넷 전체의 SSH brute force를 막기 위한 추가 호스트 기반 방화벽 규칙의 _필요성을_ 상당히 줄여 줍니다. 하지만 OS는 계속 업데이트하고, `openclaw security audit`를 실행하며, 실수로 공용 인터페이스에 listen하고 있지 않은지 확인해야 합니다.

### 이미 보호되는 항목

| 전통적인 단계     | 필요한가?   | 이유                                                                          |
| ---------------- | ----------- | ----------------------------------------------------------------------------- |
| UFW 방화벽       | 아니요      | VCN이 트래픽이 인스턴스에 도달하기 전에 차단                                   |
| fail2ban         | 아니요      | VCN에서 22번 포트를 막으면 brute force 자체가 없음                            |
| sshd 하드닝      | 아니요      | Tailscale SSH는 sshd를 사용하지 않음                                          |
| root 로그인 차단 | 아니요      | Tailscale은 시스템 사용자가 아니라 Tailscale ID를 사용                         |
| SSH key 전용 인증| 아니요      | Tailscale이 tailnet을 통해 인증                                               |
| IPv6 하드닝      | 보통은 아님 | VCN/subnet 설정에 따라 다름. 실제로 무엇이 할당/노출되는지 확인 필요           |

### 여전히 권장되는 항목

- **자격 증명 권한:** `chmod 700 ~/.openclaw`
- **보안 감사:** `openclaw security audit`
- **시스템 업데이트:** 정기적으로 `sudo apt update && sudo apt upgrade`
- **Tailscale 모니터링:** [Tailscale 관리자 콘솔](https://login.tailscale.com/admin)에서 장치 검토

### 보안 상태 검증

```bash
# 공용 포트가 listen하지 않는지 확인
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH 활성 여부 확인
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 선택 사항: sshd 완전히 비활성화
sudo systemctl disable --now ssh
```

---

## 대체 경로: SSH 터널

Tailscale Serve가 동작하지 않으면 SSH 터널을 사용하세요.

```bash
# 로컬 머신에서(Tailscale 경유)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

그다음 `http://localhost:18789`를 여세요.

---

## 문제 해결

### 인스턴스 생성 실패("Out of capacity")

무료 티어 ARM 인스턴스는 인기가 많습니다. 다음을 시도하세요.

- 다른 가용성 도메인
- 한가한 시간대(이른 아침)에 재시도
- shape 선택 시 "Always Free" 필터 사용

### Tailscale이 연결되지 않음

```bash
# 상태 확인
sudo tailscale status

# 재인증
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway가 시작되지 않음

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI에 접근할 수 없음

```bash
# Tailscale Serve가 실행 중인지 확인
tailscale serve status

# gateway가 listen 중인지 확인
curl http://localhost:18789

# 필요하면 재시작
systemctl --user restart openclaw-gateway.service
```

### ARM 바이너리 문제

일부 도구는 ARM 빌드가 없을 수 있습니다. 다음을 확인하세요.

```bash
uname -m  # aarch64가 표시되어야 함
```

대부분의 npm 패키지는 잘 동작합니다. 바이너리의 경우 `linux-arm64` 또는 `aarch64` 릴리스를 찾으세요.

---

## 영속성

모든 상태는 다음 위치에 있습니다.

- `~/.openclaw/` — `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공자 상태, 세션 데이터
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, 메모리, 아티팩트)

주기적으로 백업하세요.

```bash
openclaw backup create
```

---

## 관련 항목

- [Gateway 원격 액세스](/ko/gateway/remote) — 다른 원격 액세스 패턴
- [Tailscale 통합](/ko/gateway/tailscale) — 전체 Tailscale 문서
- [Gateway 구성](/ko/gateway/configuration) — 모든 config 옵션
- [DigitalOcean 가이드](/ko/install/digitalocean) — 유료지만 더 쉬운 가입을 원할 때
- [Hetzner 가이드](/ko/install/hetzner) — Docker 기반 대안
