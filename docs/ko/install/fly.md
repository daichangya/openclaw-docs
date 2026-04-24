---
read_when:
    - Fly.io에 OpenClaw 배포하기
    - Fly 볼륨, secret, 초기 실행 구성 설정하기
summary: 영구 스토리지와 HTTPS를 갖춘 OpenClaw용 Fly.io 단계별 배포
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T06:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Fly.io 배포

**목표:** 영구 스토리지, 자동 HTTPS, Discord/채널 액세스를 갖춘 [Fly.io](https://fly.io) 머신에서 OpenClaw Gateway 실행.

## 필요한 것

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정(무료 티어로도 가능)
- 모델 인증: 선택한 모델 provider용 API 키
- 채널 자격 증명: Discord 봇 토큰, Telegram 토큰 등

## 초보자용 빠른 경로

1. 리포지토리 클론 → `fly.toml` 사용자 지정
2. 앱 + 볼륨 생성 → secret 설정
3. `fly deploy`로 배포
4. SSH로 접속해 구성 생성 또는 Control UI 사용

<Steps>
  <Step title="Fly 앱 만들기">
    ```bash
    # 리포지토리 클론
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 새 Fly 앱 생성(이름은 직접 선택)
    fly apps create my-openclaw

    # 영구 볼륨 생성(보통 1GB면 충분)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **팁:** 가까운 리전을 선택하세요. 일반적인 옵션: `lhr`(런던), `iad`(버지니아), `sjc`(산호세).

  </Step>

  <Step title="fly.toml 구성">
    앱 이름과 요구 사항에 맞게 `fly.toml`을 편집하세요.

    **보안 참고:** 기본 구성은 공개 URL을 노출합니다. 공개 IP가 없는 강화된 배포는 [Private Deployment](#private-deployment-hardened)를 보거나 `fly.private.toml`을 사용하세요.

    ```toml
    app = "my-openclaw"  # 앱 이름
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **핵심 설정:**

    | 설정 | 이유 |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan` | Fly 프록시가 gateway에 도달할 수 있도록 `0.0.0.0`에 바인딩 |
    | `--allow-unconfigured` | 구성 파일 없이 시작(나중에 생성) |
    | `internal_port = 3000` | Fly 상태 점검을 위해 `--port 3000`(또는 `OPENCLAW_GATEWAY_PORT`)과 일치해야 함 |
    | `memory = "2048mb"` | 512MB는 너무 작음, 2GB 권장 |
    | `OPENCLAW_STATE_DIR = "/data"` | 상태를 볼륨에 영구 저장 |

  </Step>

  <Step title="Secret 설정">
    ```bash
    # 필수: Gateway 토큰(non-loopback 바인딩용)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 모델 provider API 키
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 선택 사항: 기타 provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # 채널 토큰
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **참고:**

    - non-loopback 바인드(`--bind lan`)에는 유효한 Gateway 인증 경로가 필요합니다. 이 Fly.io 예시는 `OPENCLAW_GATEWAY_TOKEN`을 사용하지만, `gateway.auth.password` 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포도 이 요구 사항을 충족합니다.
    - 이 토큰들은 비밀번호처럼 취급하세요.
    - 모든 API 키와 토큰은 **구성 파일보다 env var를 우선**하세요. 이렇게 하면 secret이 `openclaw.json`에 들어가 실수로 노출되거나 로그에 남는 것을 방지할 수 있습니다.

  </Step>

  <Step title="배포">
    ```bash
    fly deploy
    ```

    첫 배포는 Docker 이미지를 빌드하므로 약 2~3분 걸립니다. 이후 배포는 더 빠릅니다.

    배포 후 확인:

    ```bash
    fly status
    fly logs
    ```

    다음과 같은 내용이 보여야 합니다.

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="구성 파일 생성">
    올바른 구성을 만들기 위해 머신에 SSH로 접속하세요.

    ```bash
    fly ssh console
    ```

    구성 디렉터리와 파일 생성:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **참고:** `OPENCLAW_STATE_DIR=/data`를 사용하므로 구성 경로는 `/data/openclaw.json`입니다.

    **참고:** Discord 토큰은 다음 둘 중 하나에서 올 수 있습니다.

    - 환경 변수: `DISCORD_BOT_TOKEN`(secret에는 권장)
    - 구성 파일: `channels.discord.token`

    env var를 사용하는 경우 구성에 토큰을 추가할 필요가 없습니다. Gateway는 `DISCORD_BOT_TOKEN`을 자동으로 읽습니다.

    적용하려면 재시작:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway에 접근">
    ### Control UI

    브라우저에서 열기:

    ```bash
    fly open
    ```

    또는 `https://my-openclaw.fly.dev/` 방문

    구성된 공유 secret으로 인증하세요. 이 가이드는
    `OPENCLAW_GATEWAY_TOKEN`의 Gateway 토큰을 사용합니다. 비밀번호 인증으로 바꿨다면
    대신 해당 비밀번호를 사용하세요.

    ### 로그

    ```bash
    fly logs              # 라이브 로그
    fly logs --no-tail    # 최근 로그
    ```

    ### SSH 콘솔

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 문제 해결

### "App is not listening on expected address"

Gateway가 `0.0.0.0`이 아니라 `127.0.0.1`에 바인딩되고 있습니다.

**해결:** `fly.toml`의 process 명령에 `--bind lan`을 추가하세요.

### 상태 점검 실패 / connection refused

Fly가 구성된 포트에서 Gateway에 도달하지 못하고 있습니다.

**해결:** `internal_port`가 Gateway 포트와 일치하는지 확인하세요(`--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000` 설정).

### OOM / 메모리 문제

컨테이너가 계속 재시작되거나 종료됩니다. 징후: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, 또는 조용한 재시작.

**해결:** `fly.toml`에서 메모리를 늘리세요.

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 머신 업데이트:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**참고:** 512MB는 너무 작습니다. 1GB도 동작할 수는 있지만 부하가 있거나 verbose logging 시 OOM이 날 수 있습니다. **2GB를 권장합니다.**

### Gateway 잠금 문제

Gateway가 "already running" 오류와 함께 시작을 거부합니다.

이는 컨테이너가 재시작되었지만 PID 잠금 파일이 볼륨에 남아 있을 때 발생합니다.

**해결:** 잠금 파일을 삭제하세요.

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

잠금 파일은 `/data/gateway.*.lock`에 있습니다(하위 디렉터리가 아님).

### 구성이 읽히지 않음

`--allow-unconfigured`는 시작 가드만 우회합니다. `/data/openclaw.json`을 생성하거나 복구하지는 않으므로, 실제 구성이 존재하고 정상적인 로컬 Gateway 시작을 원할 경우 `gateway.mode="local"`이 포함되어 있는지 확인하세요.

구성이 존재하는지 확인:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH로 구성 쓰기

`fly ssh console -C` 명령은 셸 리디렉션을 지원하지 않습니다. 구성 파일을 쓰려면:

```bash
# echo + tee 사용(로컬에서 원격으로 파이프)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 또는 sftp 사용
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**참고:** 파일이 이미 존재하면 `fly sftp`가 실패할 수 있습니다. 먼저 삭제하세요.

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 상태가 유지되지 않음

재시작 후 auth profile, 채널/provider 상태, 세션이 사라진다면
상태 디렉터리가 컨테이너 파일시스템에 기록되고 있는 것입니다.

**해결:** `fly.toml`에 `OPENCLAW_STATE_DIR=/data`가 설정되어 있는지 확인하고 다시 배포하세요.

## 업데이트

```bash
# 최신 변경 가져오기
git pull

# 재배포
fly deploy

# 상태 확인
fly status
fly logs
```

### 머신 명령 업데이트

전체 재배포 없이 시작 명령만 변경해야 한다면:

```bash
# 머신 ID 가져오기
fly machines list

# 명령 업데이트
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 또는 메모리 증가와 함께
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**참고:** `fly deploy` 후 머신 명령은 `fly.toml`에 있는 내용으로 재설정될 수 있습니다. 수동 변경을 했다면 배포 후 다시 적용하세요.

## Private Deployment (강화)

기본적으로 Fly는 공개 IP를 할당하므로 Gateway는 `https://your-app.fly.dev`에서 접근 가능합니다. 편리하지만 인터넷 스캐너(Shodan, Censys 등)가 배포를 발견할 수 있음을 의미합니다.

**공개 노출이 전혀 없는** 강화된 배포를 원한다면 private 템플릿을 사용하세요.

### private 배포를 사용할 시점

- **아웃바운드** 호출/메시지만 수행함(인바운드 Webhook 없음)
- 모든 Webhook 콜백에 **ngrok 또는 Tailscale** 터널을 사용함
- 브라우저 대신 **SSH, 프록시, 또는 WireGuard**를 통해 Gateway에 접근함
- 배포를 **인터넷 스캐너에서 숨기고** 싶음

### 설정

표준 구성 대신 `fly.private.toml`을 사용하세요.

```bash
# private 구성으로 배포
fly deploy -c fly.private.toml
```

또는 기존 배포를 전환:

```bash
# 현재 IP 목록
fly ips list -a my-openclaw

# 공개 IP 해제
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# future deploy가 공개 IP를 다시 할당하지 않도록 private 구성으로 전환
# ([http_service] 제거 또는 private 템플릿으로 배포)
fly deploy -c fly.private.toml

# private 전용 IPv6 할당
fly ips allocate-v6 --private -a my-openclaw
```

이후 `fly ips list`는 `private` 유형 IP만 보여야 합니다.

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### private 배포 접근 방법

공개 URL이 없으므로 다음 방법 중 하나를 사용하세요.

**옵션 1: 로컬 프록시(가장 간단)**

```bash
# 로컬 포트 3000을 앱으로 포워드
fly proxy 3000:3000 -a my-openclaw

# 그런 다음 브라우저에서 http://localhost:3000 열기
```

**옵션 2: WireGuard VPN**

```bash
# WireGuard 구성 생성(1회)
fly wireguard create

# WireGuard 클라이언트로 가져온 뒤 내부 IPv6로 접근
# 예: http://[fdaa:x:x:x:x::x]:3000
```

**옵션 3: SSH만 사용**

```bash
fly ssh console -a my-openclaw
```

### private 배포에서 Webhook 사용

공개 노출 없이도 Webhook 콜백(Twilio, Telnyx 등)이 필요하다면:

1. **ngrok 터널** - 컨테이너 내부 또는 사이드카로 ngrok 실행
2. **Tailscale Funnel** - 특정 경로만 Tailscale을 통해 노출
3. **아웃바운드 전용** - 일부 provider(Twilio)는 Webhook 없이도 아웃바운드 호출에 충분함

ngrok를 사용한 음성 통화 구성 예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok 터널은 컨테이너 내부에서 실행되며 Fly 앱 자체를 노출하지 않고 공개 Webhook URL을 제공합니다. 전달된 호스트 헤더가 허용되도록 `webhookSecurity.allowedHosts`를 공개 터널 호스트 이름으로 설정하세요.

### 보안 이점

| 항목 | Public | Private |
| ----------------- | ------------ | ---------- |
| 인터넷 스캐너 | 발견 가능 | 숨김 |
| 직접 공격 | 가능 | 차단됨 |
| Control UI 접근 | 브라우저 | 프록시/VPN |
| Webhook 전달 | 직접 | 터널 경유 |

## 참고

- Fly.io는 **x86 아키텍처**를 사용합니다(ARM 아님)
- Dockerfile은 두 아키텍처 모두와 호환됩니다
- WhatsApp/Telegram 온보딩에는 `fly ssh console`을 사용하세요
- 영구 데이터는 `/data`의 볼륨에 저장됩니다
- Signal에는 Java + `signal-cli`가 필요합니다. 사용자 정의 이미지를 사용하고 메모리는 2GB 이상으로 유지하세요.

## 비용

권장 구성(`shared-cpu-2x`, 2GB RAM) 기준:

- 사용량에 따라 월 약 $10~15
- 무료 티어에 일부 기본 할당량 포함

자세한 내용은 [Fly.io 가격](https://fly.io/docs/about/pricing/)을 참조하세요.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- OpenClaw 최신 상태 유지: [업데이트](/ko/install/updating)

## 관련

- [설치 개요](/ko/install)
- [Hetzner](/ko/install/hetzner)
- [Docker](/ko/install/docker)
- [VPS 호스팅](/ko/vps)
