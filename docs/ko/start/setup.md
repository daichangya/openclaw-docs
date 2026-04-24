---
read_when:
    - 새 머신 설정하기
    - 개인 설정을 깨뜨리지 않고 “최신 + 최고” 상태를 원합니다
summary: OpenClaw의 고급 설정 및 개발 워크플로
title: 설정
x-i18n:
    generated_at: "2026-04-24T06:37:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
처음 설정하는 경우 [시작하기](/ko/start/getting-started)부터 시작하세요.
온보딩 세부 정보는 [온보딩 (CLI)](/ko/start/wizard)를 참조하세요.
</Note>

## TL;DR

업데이트를 얼마나 자주 받고 싶은지, Gateway를 직접 실행할지에 따라 설정 워크플로를 선택하세요:

- **개인 맞춤은 저장소 밖에 둡니다:** 구성을 `~/.openclaw/openclaw.json`, 작업공간을 `~/.openclaw/workspace/`에 두면 저장소 업데이트가 이를 건드리지 않습니다.
- **안정적인 워크플로 (대부분에 권장):** macOS 앱을 설치하고 번들된 Gateway를 실행하게 두세요.
- **최신 개발 워크플로 (dev):** `pnpm gateway:watch`로 Gateway를 직접 실행하고, macOS 앱은 Local 모드로 연결하게 두세요.

## 사전 요구 사항 (소스에서)

- Node 24 권장 (Node 22 LTS, 현재 `22.14+`, 여전히 지원됨)
- `pnpm` 권장 (또는 의도적으로 [Bun 워크플로](/ko/install/bun)를 사용하는 경우 Bun)
- Docker (선택 사항; 컨테이너 설정/e2e 전용 — [Docker](/ko/install/docker) 참조)

## 맞춤화 전략 (업데이트로 인한 손상 방지)

“100% 나에게 맞춤”이면서도 쉽게 업데이트하고 싶다면, 커스터마이징을 다음 위치에 두세요:

- **구성:** `~/.openclaw/openclaw.json` (JSON/JSON5 비슷한 형식)
- **작업공간:** `~/.openclaw/workspace` (skills, prompts, memories; 비공개 git 저장소로 두는 것을 권장)

한 번 부트스트랩:

```bash
openclaw setup
```

이 저장소 내부에서는 로컬 CLI 진입점을 사용하세요:

```bash
openclaw setup
```

아직 전역 설치가 없다면 `pnpm openclaw setup`으로 실행하세요(Bun 워크플로를 사용 중이면 `bun run openclaw setup`).

## 이 저장소에서 Gateway 실행

`pnpm build` 후에는 패키지된 CLI를 직접 실행할 수 있습니다:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 워크플로 (macOS 앱 우선)

1. **OpenClaw.app** 설치 및 실행 (메뉴 막대)
2. 온보딩/권한 체크리스트 완료 (TCC 프롬프트)
3. Gateway가 **Local**이며 실행 중인지 확인 (앱이 관리함)
4. 표면 연결 (예: WhatsApp):

```bash
openclaw channels login
```

5. 정상 동작 확인:

```bash
openclaw health
```

빌드에 온보딩이 없으면:

- `openclaw setup`을 실행하고, 이어서 `openclaw channels login`, 그다음 Gateway를 수동으로 시작하세요 (`openclaw gateway`).

## 최신 개발 워크플로 (터미널에서 Gateway 실행)

목표: TypeScript Gateway를 작업하고, hot reload를 받고, macOS 앱 UI는 계속 연결된 상태로 유지.

### 0) (선택 사항) macOS 앱도 소스에서 실행

macOS 앱도 최신 개발 상태로 사용하고 싶다면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발용 Gateway 시작

```bash
pnpm install
# 첫 실행만(또는 로컬 OpenClaw config/workspace를 재설정한 후)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`는 감시 모드로 Gateway를 실행하며 관련 소스,
구성, 번들 Plugin 메타데이터 변경 시 다시 로드합니다.
`pnpm openclaw setup`은 새 체크아웃에 대한 일회성 로컬 config/workspace 초기화 단계입니다.
`pnpm gateway:watch`는 `dist/control-ui`를 다시 빌드하지 않으므로, `ui/` 변경 후에는 `pnpm ui:build`를 다시 실행하거나 Control UI 개발 중에는 `pnpm ui:dev`를 사용하세요.

의도적으로 Bun 워크플로를 사용하는 경우 동등한 명령은 다음과 같습니다:

```bash
bun install
# 첫 실행만(또는 로컬 OpenClaw config/workspace를 재설정한 후)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS 앱을 실행 중인 Gateway에 연결

**OpenClaw.app**에서:

- Connection Mode: **Local**
  앱이 구성된 포트에서 실행 중인 Gateway에 연결합니다.

### 3) 확인

- 앱 내 Gateway 상태는 **“Using existing gateway …”** 로 표시되어야 합니다
- 또는 CLI로 확인:

```bash
openclaw health
```

### 흔한 함정

- **잘못된 포트:** Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. 앱과 CLI가 같은 포트를 사용하게 하세요.
- **상태가 저장되는 위치:**
  - 채널/provider 상태: `~/.openclaw/credentials/`
  - 모델 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 세션: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장소 맵

인증을 디버깅하거나 백업할 항목을 결정할 때 사용하세요:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: config/env 또는 `channels.telegram.tokenFile` (일반 파일만; 심볼릭 링크는 거부됨)
- **Discord 봇 토큰**: config/env 또는 SecretRef (env/file/exec provider)
- **Slack 토큰**: config/env (`channels.slack.*`)
- **페어링 allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (비기본 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 payload (선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth import**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [보안](/ko/gateway/security#credential-storage-map).

## 업데이트 (설정을 망치지 않고)

- `~/.openclaw/workspace`와 `~/.openclaw/`는 “내 것”으로 유지하세요. 개인 프롬프트/구성을 `openclaw` 저장소 안에 두지 마세요.
- 소스 업데이트: `git pull` + 선택한 패키지 관리자 설치 단계(기본값 `pnpm install`, Bun 워크플로면 `bun install`) + 동일한 `gateway:watch` 명령 계속 사용.

## Linux (systemd 사용자 서비스)

Linux 설치는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는
로그아웃/유휴 상태가 되면 사용자 서비스를 중지하므로 Gateway가 종료됩니다. 온보딩이 lingering을 자동 활성화하려고 시도하지만(sudo를 요청할 수 있음), 여전히 꺼져 있으면 다음을 실행하세요:

```bash
sudo loginctl enable-linger $USER
```

항상 켜져 있어야 하거나 다중 사용자 서버라면,
사용자 서비스 대신 **시스템** 서비스를 고려하세요(lingering 불필요). systemd 관련 내용은 [Gateway 운영 가이드](/ko/gateway)를 참조하세요.

## 관련 문서

- [Gateway 운영 가이드](/ko/gateway) (플래그, 감독, 포트)
- [Gateway 구성](/ko/gateway/configuration) (구성 스키마 + 예시)
- [Discord](/ko/channels/discord) 및 [Telegram](/ko/channels/telegram) (응답 태그 + `replyToMode` 설정)
- [OpenClaw 어시스턴트 설정](/ko/start/openclaw)
- [macOS 앱](/ko/platforms/macos) (Gateway 수명 주기)
