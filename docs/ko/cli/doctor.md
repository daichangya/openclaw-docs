---
read_when:
    - 연결/인증 문제가 있어 안내형 해결을 원하시는 것입니다
    - 업데이트 후 정상 동작 확인을 원하시는 것입니다
summary: '`openclaw doctor`에 대한 CLI 참조(상태 점검 + 안내형 복구)'
title: 의사
x-i18n:
    generated_at: "2026-04-24T06:07:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway와 채널을 위한 상태 점검 + 빠른 복구입니다.

관련:

- 문제 해결: [문제 해결](/ko/gateway/troubleshooting)
- 보안 감사: [보안](/ko/gateway/security)

## 예시

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 옵션

- `--no-workspace-suggestions`: 워크스페이스 메모리/검색 제안 비활성화
- `--yes`: 묻지 않고 기본값 수락
- `--repair`: 묻지 않고 권장 복구 적용
- `--fix`: `--repair`의 별칭
- `--force`: 필요 시 사용자 정의 서비스 구성을 덮어쓰는 것을 포함해 적극적인 복구 적용
- `--non-interactive`: 프롬프트 없이 실행, 안전한 마이그레이션만 수행
- `--generate-gateway-token`: Gateway 토큰 생성 및 구성
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스 검사

참고:

- 대화형 프롬프트(예: 키체인/OAuth 복구)는 stdin이 TTY이고 `--non-interactive`가 **설정되지 않은 경우에만** 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)에서는 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 헤드리스 상태 점검을 빠르게 유지하기 위해 eager Plugin 로딩을 건너뜁니다. 대화형 세션은 검사가 Plugin 기여를 필요로 할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 백업을 `~/.openclaw/openclaw.json.bak`에 쓰고, 알 수 없는 구성 키를 제거하며 각 제거 항목을 나열합니다.
- 상태 무결성 검사는 이제 세션 디렉터리의 고아 transcript 파일을 감지하며, 안전하게 공간을 회수하기 위해 이를 `.deleted.<timestamp>`로 아카이브할 수 있습니다.
- Doctor는 또한 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 레거시 Cron 작업 형태를 검사하며, 스케줄러가 런타임에 자동 정규화하기 전에 이를 제자리에서 다시 쓸 수 있습니다.
- Doctor는 설치된 OpenClaw 패키지에 대한 쓰기 권한 없이도 누락된 번들 Plugin 런타임 의존성을 복구합니다. 루트 소유 npm 설치 또는 강화된 systemd 유닛의 경우 `/var/lib/openclaw/plugin-runtime-deps` 같은 쓰기 가능한 디렉터리로 `OPENCLAW_PLUGIN_STAGE_DIR`를 설정하세요.
- Doctor는 레거시 평면 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 차이가 객체 키 순서뿐인 경우 반복적인 `doctor --fix` 실행은 더 이상 Talk 정규화를 보고하거나 적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 검사가 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 신호가 강한 경고를 보고합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없는 경우 doctor는 읽기 전용 경고를 보고하며 일반 텍스트 대체 자격 증명을 쓰지 않습니다.
- 복구 경로에서 채널 SecretRef 검사에 실패하더라도 doctor는 조기 종료하지 않고 계속 진행하며 경고를 보고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 실행에서는 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면 해당 값이 구성 파일을 재정의하여 지속적인 “unauthorized” 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
