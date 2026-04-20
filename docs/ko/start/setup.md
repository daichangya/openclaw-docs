---
read_when:
    - 새 머신 설정하기
    - 개인 설정을 망가뜨리지 않으면서 “최신 + 최고” 상태를 원합니다
summary: OpenClaw의 고급 설정 및 개발 워크플로우
title: 설정
x-i18n:
    generated_at: "2026-04-20T06:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# 설정

<Note>
처음 설정하는 경우 [시작하기](/ko/start/getting-started)부터 시작하세요.
온보딩 세부 정보는 [온보딩 (CLI)](/ko/start/wizard)를 참고하세요.
</Note>

## TL;DR

- **맞춤 설정은 리포지토리 외부에 저장됩니다:** `~/.openclaw/workspace` (워크스페이스) + `~/.openclaw/openclaw.json` (구성).
- **안정적인 워크플로우:** macOS 앱을 설치하고, 번들된 Gateway를 실행하도록 둡니다.
- **최신 실험적 워크플로우:** `pnpm gateway:watch`로 직접 Gateway를 실행한 다음, macOS 앱이 로컬 모드에서 연결하도록 둡니다.

## 사전 요구 사항(소스에서 실행)

- Node 24 권장 (Node 22 LTS, 현재 `22.14+`,도 계속 지원됨)
- `pnpm` 권장(또는 의도적으로 [Bun 워크플로우](/ko/install/bun)를 사용하는 경우 Bun)
- Docker (선택 사항; 컨테이너 기반 설정/e2e에만 필요 — [Docker](/ko/install/docker) 참고)

## 맞춤 설정 전략(업데이트가 문제를 일으키지 않도록)

“나에게 100% 맞춤” _이면서_ 쉽게 업데이트하고 싶다면, 사용자 지정은 다음 위치에 유지하세요:

- **구성:** `~/.openclaw/openclaw.json` (JSON/JSON5 비슷한 형식)
- **워크스페이스:** `~/.openclaw/workspace` (skills, 프롬프트, 메모리; 비공개 git 리포지토리로 만드는 것을 권장)

한 번만 초기화하세요:

```bash
openclaw setup
```

이 리포지토리 내부에서는 로컬 CLI 진입점을 사용하세요:

```bash
openclaw setup
```

아직 전역 설치가 없다면 `pnpm openclaw setup`으로 실행하세요(Bun 워크플로우를 사용하는 경우 `bun run openclaw setup`).

## 이 리포지토리에서 Gateway 실행

`pnpm build` 후에는 패키징된 CLI를 직접 실행할 수 있습니다:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 워크플로우(macOS 앱 우선)

1. **OpenClaw.app**(메뉴 막대)을 설치하고 실행합니다.
2. 온보딩/권한 체크리스트(TCC 프롬프트)를 완료합니다.
3. Gateway가 **Local**로 설정되어 실행 중인지 확인합니다(앱이 이를 관리함).
4. 표면을 연결합니다(예: WhatsApp):

```bash
openclaw channels login
```

5. 정상 동작 확인:

```bash
openclaw health
```

빌드에 온보딩이 포함되어 있지 않은 경우:

- `openclaw setup`을 실행한 다음 `openclaw channels login`을 실행하고, 그 후 Gateway를 수동으로 시작하세요(`openclaw gateway`).

## 최신 실험적 워크플로우(터미널에서 Gateway 실행)

목표: TypeScript Gateway를 개발하고, 핫 리로드를 사용하며, macOS 앱 UI는 계속 연결된 상태로 유지합니다.

### 0) (선택 사항) macOS 앱도 소스에서 실행

macOS 앱도 최신 실험적 상태로 사용하려면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발용 Gateway 시작

```bash
pnpm install
# 첫 실행에서만 필요(또는 로컬 OpenClaw 구성/워크스페이스를 초기화한 후)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`는 감시 모드로 gateway를 실행하며, 관련 소스,
구성, 번들된 Plugin 메타데이터 변경 시 다시 로드합니다.
`pnpm openclaw setup`은 새 체크아웃에 대해 한 번만 수행하는 로컬 구성/워크스페이스 초기화 단계입니다.
`pnpm gateway:watch`는 `dist/control-ui`를 다시 빌드하지 않으므로, `ui/` 변경 후에는 `pnpm ui:build`를 다시 실행하거나 Control UI를 개발하는 동안 `pnpm ui:dev`를 사용하세요.

의도적으로 Bun 워크플로우를 사용하는 경우, 동등한 명령은 다음과 같습니다:

```bash
bun install
# 첫 실행에서만 필요(또는 로컬 OpenClaw 구성/워크스페이스를 초기화한 후)
bun run openclaw setup
bun run gateway:watch
```

### 2) 실행 중인 Gateway를 macOS 앱이 사용하도록 설정

**OpenClaw.app**에서:

- 연결 모드: **Local**
  앱이 구성된 포트에서 실행 중인 gateway에 연결됩니다.

### 3) 확인

- 앱 내 Gateway 상태에 **“기존 gateway 사용 중 …”** 이라고 표시되어야 합니다.
- 또는 CLI에서:

```bash
openclaw health
```

### 흔히 겪는 문제

- **잘못된 포트:** Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. 앱과 CLI가 같은 포트를 사용하도록 유지하세요.
- **상태가 저장되는 위치:**
  - 채널/프로바이더 상태: `~/.openclaw/credentials/`
  - 모델 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 세션: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장소 맵

인증 문제를 디버깅하거나 무엇을 백업할지 결정할 때 사용하세요:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env 또는 `channels.telegram.tokenFile` (일반 파일만 허용, symlink는 거부됨)
- **Discord bot token**: config/env 또는 SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (기본이 아닌 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 시크릿 페이로드(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth 가져오기**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [보안](/ko/gateway/security#credential-storage-map).

## 업데이트(설정을 망가뜨리지 않고)

- `~/.openclaw/workspace`와 `~/.openclaw/`는 “내 것”으로 유지하세요. 개인 프롬프트/구성을 `openclaw` 리포지토리에 넣지 마세요.
- 소스 업데이트: `git pull` + 선택한 패키지 관리자 설치 단계(기본값은 `pnpm install`, Bun 워크플로우는 `bun install`) + 계속해서 같은 `gateway:watch` 명령을 사용하세요.

## Linux(systemd 사용자 서비스)

Linux 설치는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는
로그아웃/유휴 상태에서 사용자 서비스를 중지하므로 Gateway도 종료됩니다. 온보딩은
사용자를 대신해 lingering을 활성화하려고 시도합니다(sudo 프롬프트가 나타날 수 있음). 여전히 비활성화되어 있으면 다음을 실행하세요:

```bash
sudo loginctl enable-linger $USER
```

항상 켜져 있어야 하거나 다중 사용자 서버인 경우에는
사용자 서비스 대신 **시스템** 서비스를 고려하세요(lingering 불필요). systemd 관련 참고 사항은 [Gateway 실행 가이드](/ko/gateway)를 확인하세요.

## 관련 문서

- [Gateway 실행 가이드](/ko/gateway) (플래그, 감독, 포트)
- [Gateway 구성](/ko/gateway/configuration) (구성 스키마 + 예시)
- [Discord](/ko/channels/discord) 및 [Telegram](/ko/channels/telegram) (답장 태그 + replyToMode 설정)
- [OpenClaw assistant 설정](/ko/start/openclaw)
- [macOS 앱](/ko/platforms/macos) (gateway 수명 주기)
