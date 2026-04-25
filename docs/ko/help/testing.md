---
read_when:
    - 로컬 또는 CI에서 테스트 실행
    - 모델/provider 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: unit/e2e/live 스위트, Docker 실행기, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-25T12:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0db8300a2a1b8367faca0aa1a857d67c06723eb4170e86440f827a802d05a34
    source_path: help/testing.md
    workflow: 15
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 실행기가 있습니다. 이 문서는 "우리가 어떻게 테스트하는지"에 대한 가이드입니다:

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 _다루지 않는지_).
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 어떤 명령을 실행해야 하는지.
- live 테스트가 자격 증명을 어떻게 찾고 모델/provider를 어떻게 선택하는지.
- 실제 모델/provider 이슈에 대한 회귀를 어떻게 추가하는지.

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전 기대값): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 이제 직접 파일 대상 지정이 extension/channel 경로도 라우팅함: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 중일 때는 먼저 대상 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 provider/model을 디버깅할 때(실제 자격 증명 필요):

- live 스위트(모델 + gateway tool/image probe): `pnpm test:live`
- 하나의 live 파일만 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 모델 스윕: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴 하나와 작은 파일 읽기 스타일 probe 하나를 실행합니다.
    메타데이터에 `image` 입력이 표시된 모델은 작은 이미지 턴도 실행합니다.
    provider 실패를 분리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 probe를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 둘 다 `include_live_suites: true`와 함께
    재사용 가능한 live/E2E 워크플로를 호출하며, 여기에는 provider별로 샤딩된
    별도의 Docker live 모델 매트릭스 작업이 포함됩니다.
  - 집중된 CI 재실행의 경우 `include_live_suites: true` 및 `live_models_only: true`를 사용해
    `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새로운 고신호 provider 시크릿은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`, 그리고 그
    scheduled/release 호출자에 추가하세요.
- 네이티브 Codex bound-chat 스모크: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker live 레인을 실행하고, 합성 Slack DM을
    `/codex bind`로 바인딩한 다음 `/codex fast`와
    `/codex permissions`를 실행하고, 이후 일반 답장과 이미지 첨부가 ACP가 아니라
    네이티브 Plugin 바인딩을 통해 라우팅되는지 검증합니다.
- Crestodian rescue 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 rescue 명령 표면을 위한 옵트인 안전장치 점검입니다.
    `/crestodian status`를 실행하고, 영구 모델 변경을 대기열에 넣고,
    `/crestodian yes`에 응답한 뒤 audit/config 쓰기 경로를 검증합니다.
- Crestodian planner Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 config 없는 컨테이너에서 Crestodian을 실행하고,
    퍼지 planner fallback이 audit되는 typed config 쓰기로 변환되는지 검증합니다.
- Crestodian 첫 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작하여, bare `openclaw`를
    Crestodian으로 라우팅하고, setup/model/agent/Discord Plugin + SecretRef 쓰기를 적용하고,
    config를 검증하고, audit 항목을 확인합니다. 같은 Ring 0 설정 경로는
    QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`으로 다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`를 실행한 뒤, 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  을 `moonshot/kimi-k2.6`에 대해 실행하세요. JSON이 Moonshot/K2.6을 보고하고,
  어시스턴트 transcript가 정규화된 `usage.cost`를 저장하는지 확인하세요.

팁: 하나의 실패 사례만 필요할 때는 아래에 설명된 allowlist env var를 통해 live 테스트를 좁히는 방식을 선호하세요.

## QA 전용 실행기

이 명령들은 QA-lab 수준의 현실성이 필요할 때 메인 테스트 스위트 옆에서 사용합니다:

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
수동 디스패치에서 mock provider와 함께 실행됩니다. `QA-Lab - All Lanes`는
`main`에서 매일 밤, 그리고 mock parity gate, live Matrix 레인, Convex가 관리하는
live Telegram 레인을 병렬 작업으로 포함하여 수동 디스패치에서 실행됩니다. `OpenClaw Release Checks`는
릴리스 승인 전에 같은 레인을 실행합니다.

- `pnpm openclaw qa suite`
  - 호스트에서 직접 repo 기반 QA 시나리오를 실행합니다.
  - 기본적으로 여러 선택된 시나리오를 격리된 gateway worker와 함께 병렬 실행합니다.
    `qa-channel`의 기본 동시성은 4입니다(선택된 시나리오 수에 의해 제한됨).
    worker 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전의 직렬 레인이 필요하면
    `--concurrency 1`을 사용하세요.
  - 하나라도 시나리오가 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이
    아티팩트만 원할 때는 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 실험적 fixture 및 프로토콜 mock 커버리지를 위해 로컬 AIMock 기반
    provider 서버를 시작하지만, 시나리오 인식 `mock-openai` 레인을 대체하지는 않습니다.
- `pnpm openclaw qa suite --runner multipass`
  - 같은 QA 스위트를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 같은 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 같은 provider/model 선택 플래그를 재사용합니다.
  - live 실행은 guest에 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 그리고 존재할 경우 `CODEX_HOME`.
  - guest가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 출력 디렉터리는 repo 루트 아래에 있어야 합니다.
  - 일반 QA report + summary와 Multipass 로그를
    `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, 이를 Docker에 전역 설치하고,
    비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하고,
    Plugin 활성화가 필요 시 런타임 의존성을 설치하는지 검증하고, doctor를 실행하고,
    mock된 OpenAI 엔드포인트에 대해 로컬 에이전트 턴 하나를 실행합니다.
  - 같은 패키지 설치 레인을 Discord로 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 게시된 OpenClaw 패키지를 설치하고, 설치된 패키지 온보딩을 실행하고,
    설치된 CLI를 통해 Telegram을 구성한 다음, 설치된 패키지를 SUT Gateway로 사용하여
    live Telegram QA 레인을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명 소스를 사용합니다.
    CI/release 자동화에서는
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL`, 그리고 role secret을 설정하세요.
    CI에서 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex role secret이 존재하면
    Docker wrapper는 자동으로 Convex를 선택합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 대해서만
    공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 레인을 수동 메인터너 워크플로
    `NPM Telegram Beta E2E`로 노출합니다. 병합 시 실행되지는 않습니다. 이 워크플로는
    `qa-live-shared` 환경과 Convex CI 자격 증명 lease를 사용합니다.
- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 패킹하고 Docker에 설치한 뒤, OpenAI가 구성된 상태로 Gateway를 시작하고,
    config 편집을 통해 번들 채널/Plugin을 활성화합니다.
  - 설정 검색이 구성되지 않은 Plugin 런타임 의존성을 남겨둔 상태로 유지하는지,
    처음 구성된 Gateway 또는 doctor 실행이 각 번들 Plugin의 런타임 의존성을 필요 시 설치하는지,
    그리고 두 번째 재시작은 이미 활성화된 의존성을 재설치하지 않는지 검증합니다.
  - 또한 알려진 이전 npm 기준 버전을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 뒤,
    후보 버전의 post-update doctor가
    하네스 측 postinstall 복구 없이 번들 채널 런타임 의존성을 복구하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels guest 전반에서 네이티브 패키지 설치 업데이트 스모크를 실행합니다. 선택된 각 플랫폼은 먼저 요청된 기준 패키지를 설치한 뒤,
    같은 guest에서 설치된 `openclaw update` 명령을 실행하고, 설치된 버전, 업데이트 상태, gateway 준비 상태,
    그리고 로컬 에이전트 턴 하나를 검증합니다.
  - 한 guest에서 반복 작업할 때는 `--platform macos`, `--platform windows`, 또는 `--platform linux`를 사용하세요.
    summary 아티팩트 경로 및 레인별 상태에는 `--json`을 사용하세요.
  - 긴 로컬 실행은 호스트 timeout으로 감싸 Parallels 전송 정체가
    남은 테스트 시간 전체를 소비하지 못하게 하세요:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩된 레인 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 기록합니다.
    외부 wrapper가 멈춘 것처럼 보이기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`를 확인하세요.
  - Windows 업데이트는 차가운 guest에서 post-update doctor/런타임
    의존성 복구에 10~15분이 걸릴 수 있습니다. 중첩 npm 디버그 로그가 계속 진행 중이라면 이는 여전히 정상입니다.
  - 이 집계 wrapper는 개별 Parallels macOS, Windows, 또는 Linux 스모크 레인과 병렬로 실행하지 마세요.
    이들은 VM 상태를 공유하며 snapshot 복원, 패키지 제공, 또는 guest gateway 상태에서 충돌할 수 있습니다.
  - post-update 증명은 일반 번들 Plugin 표면을 실행합니다. speech, 이미지 생성, media
    understanding 같은 capability facade는
    에이전트 턴 자체가 단순한 텍스트 응답만 확인하더라도 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel 홈서버에 대해 Matrix live QA 레인을 실행합니다.
  - 이 QA 호스트는 현재 repo/dev 전용입니다. 패키징된 OpenClaw 설치에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`를 노출하지 않습니다.
  - repo 체크아웃은 번들된 runner를 직접 로드하며 별도의 Plugin 설치 단계가 필요하지 않습니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 비공개 room 하나를 프로비저닝한 뒤, 실제 Matrix Plugin을 SUT transport로 사용하는 QA gateway child를 시작합니다.
  - 기본적으로 고정된 stable Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`를 사용합니다. 다른 이미지를 테스트해야 할 때는 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix는 일회용 사용자를 로컬에서 프로비저닝하므로 공유 credential-source 플래그를 노출하지 않습니다.
  - Matrix QA report, summary, observed-events 아티팩트, 그리고 결합된 stdout/stderr 출력 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
  - 기본적으로 진행 상황을 출력하며 `OPENCLAW_QA_MATRIX_TIMEOUT_MS`(기본값 30분)로 하드 실행 시간 제한을 적용합니다. 정리는 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`에 의해 제한되며, 실패 시 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT 봇 토큰을 사용해 실제 비공개 그룹에 대해 Telegram live QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자형 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명을 위해 `--credential-source convex`를 지원합니다. 기본적으로는 env 모드를 사용하고, 풀 lease를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 하나라도 시나리오가 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이
    아티팩트만 원할 때는 `--allow-failures`를 사용하세요.
  - 같은 비공개 그룹 내에 서로 다른 두 개의 봇이 필요하며, SUT 봇은 Telegram 사용자명을 노출해야 합니다.
  - 안정적인 봇 간 관찰을 위해 두 봇 모두에 대해 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하고, driver 봇이 그룹의 봇 트래픽을 관찰할 수 있도록 하세요.
  - Telegram QA report, summary, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다. 답장 시나리오에는 driver 전송 요청부터 관찰된 SUT 답장까지의 RTT가 포함됩니다.

live transport 레인은 새로운 transport가 드리프트하지 않도록 하나의 표준 계약을 공유합니다:

`qa-channel`은 여전히 광범위한 synthetic QA 스위트이며 live
transport 커버리지 매트릭스의 일부는 아닙니다.

| 레인     | Canary | Mention gating | Allowlist block | 최상위 답장 | 재시작 재개 | 스레드 후속 | 스레드 격리 | 반응 관찰 | 도움말 명령 |
| -------- | ------ | -------------- | --------------- | ----------- | ----------- | ----------- | ----------- | --------- | ------------ |
| Matrix   | x      | x              | x               | x           | x           | x           | x           | x         |              |
| Telegram | x      |                |                 |             |             |             |             |           | x            |

### Convex를 통한 공유 Telegram 자격 증명 (v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면, QA lab은 Convex 기반 풀에서 독점 lease를 획득하고, 레인이 실행되는 동안 해당 lease에 Heartbeat를 보내며, 종료 시 lease를 해제합니다.

참고용 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 시크릿 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

메인터너 관리자 명령(pool add/remove/list)에는
구체적으로 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

메인터너용 CLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live 실행 전에 `doctor`를 사용해 Convex site URL, broker 시크릿,
endpoint prefix, HTTP timeout, admin/list 도달 가능성을 시크릿 값 출력 없이 점검하세요. 스크립트와 CI 유틸리티에서 기계 판독 가능한 출력이 필요하면 `--json`을 사용하세요.

기본 endpoint 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }` (또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }` (또는 빈 `2xx`)
- `POST /admin/add` (`maintainer` 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove` (`maintainer` 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 보호: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (`maintainer` 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 payload 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하며 잘못된 payload를 거부합니다.

### QA에 채널 추가하기

Markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다:

1. 해당 채널용 transport adapter.
2. 채널 계약을 실행하는 scenario pack.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있는 경우 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다:

- `openclaw qa` 명령 루트
- 스위트 시작 및 종료
- worker 동시성
- 아티팩트 기록
- report 생성
- scenario 실행
- 기존 `qa-channel` 시나리오를 위한 호환성 별칭

Runner Plugin은 transport 계약을 소유합니다:

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 어떻게 마운트되는지
- 해당 transport에 대해 gateway가 어떻게 구성되는지
- 준비 상태를 어떻게 확인하는지
- 인바운드 이벤트를 어떻게 주입하는지
- 아웃바운드 메시지를 어떻게 관찰하는지
- transcript와 정규화된 transport 상태를 어떻게 노출하는지
- transport 기반 액션을 어떻게 실행하는지
- transport별 재설정 또는 정리를 어떻게 처리하는지

새 채널에 대한 최소 도입 기준은 다음과 같습니다:

1. 공유 `qa` 루트의 소유자를 계속 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 seam에 transport runner를 구현합니다.
3. transport별 메커니즘은 runner Plugin 또는 채널 하네스 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 `openclaw qa <runner>`로 runner를 마운트합니다.
   Runner Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다.
   `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 runner 실행은 별도 엔트리포인트 뒤에 두어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 scenario helper를 사용합니다.
7. repo가 의도적인 마이그레이션을 진행 중이 아닌 한 기존 호환성 별칭은 계속 동작하게 유지합니다.

결정 규칙은 엄격합니다:

- 동작을 `qa-lab`에 한 번만 표현할 수 있다면 `qa-lab`에 두세요.
- 동작이 하나의 채널 transport에 의존한다면 해당 runner Plugin 또는 Plugin 하네스에 유지하세요.
- 시나리오가 둘 이상의 채널이 사용할 수 있는 새 기능이 필요하다면 `suite.ts`에 채널별 분기를 추가하지 말고 일반 helper를 추가하세요.
- 동작이 하나의 transport에만 의미가 있다면 시나리오를 transport별로 유지하고 시나리오 계약에서 이를 명시하세요.

새 시나리오에 권장되는 일반 helper 이름은 다음과 같습니다:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

기존 시나리오를 위한 호환성 별칭은 계속 사용할 수 있으며 다음을 포함합니다:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에서는 일반 helper 이름을 사용해야 합니다.
호환성 별칭은 일괄 전환(flag day) 마이그레이션을 피하기 위한 것이지,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(무엇이 어디서 실행되는가)

스위트는 “현실성이 증가하는 순서”(그리고 flaky/cost도 증가하는 순서)로 생각하세요:

### Unit / integration (기본값)

- 명령: `pnpm test`
- 구성: 대상 지정이 없는 실행은 `vitest.full-*.config.ts` shard 세트를 사용하며 병렬 스케줄링을 위해 멀티 프로젝트 shard를 프로젝트별 config로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`가 다루는 허용된 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - 프로세스 내 integration 테스트(gateway 인증, 라우팅, 툴링, 파싱, config)
  - 알려진 버그에 대한 결정적 회귀
- 기대 사항:
  - CI에서 실행됨
  - 실제 키가 필요하지 않음
  - 빠르고 안정적이어야 함

<AccordionGroup>
  <Accordion title="프로젝트, 샤드 및 범위 지정 레인">

    - 대상 지정이 없는 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 config(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)를 실행합니다. 이렇게 하면 부하가 있는 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않게 합니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 멀티 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 먼저 명시적 파일/디렉터리 대상을 범위 지정 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않아도 됩니다.
    - `pnpm test:changed`는 변경 diff가 라우팅 가능한 소스/테스트 파일만 건드릴 때 변경된 git 경로를 같은 범위 지정 레인으로 확장합니다. config/setup 편집은 여전히 광범위한 루트 프로젝트 재실행으로 fallback됩니다.
    - `pnpm check:changed`는 좁은 작업을 위한 일반적인 스마트 로컬 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, release metadata, tooling으로 분류한 뒤 일치하는 typecheck/lint/test 레인을 실행합니다. 공개 Plugin SDK 및 plugin-contract 변경은 extension이 해당 core 계약에 의존하므로 extension 검증 1회를 포함합니다. release metadata 전용 버전 범프는 전체 스위트 대신 대상 버전/config/root-dependency 검사를 실행하며, 최상위 version 필드 외부의 package 변경을 거부하는 가드가 있습니다.
    - agents, commands, plugins, auto-reply helper, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light unit 테스트는 `unit-fast` 레인을 통해 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 런타임이 무거운 파일은 기존 레인에 그대로 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 changed 모드 실행을 이러한 가벼운 레인의 명시적 sibling 테스트에 매핑하므로, helper 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
    - `auto-reply`에는 전용 버킷 세 개가 있습니다: 최상위 core helper, 최상위 `reply.*` integration 테스트, 그리고 `src/auto-reply/reply/**` 하위 트리입니다. 이렇게 하면 가장 무거운 reply 하네스 작업이 저렴한 status/chunk/token 테스트에 영향을 주지 않습니다.

  </Accordion>

  <Accordion title="임베디드 runner 커버리지">

    - message-tool discovery 입력이나 Compaction 런타임
      컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화
      경계에 대해서는 집중된 helper 회귀를 추가하세요.
    - 임베디드 runner integration 스위트가 건강한 상태를 유지하게 하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 스위트들은 범위 지정된 id와 Compaction 동작이 여전히 실제
      `run.ts` / `compact.ts` 경로를 통해 흐르는지 검증합니다. helper 전용 테스트만으로는
      이러한 integration 경로를 충분히 대체할 수 없습니다.

  </Accordion>

  <Accordion title="Vitest pool 및 격리 기본값">

    - 기본 Vitest config의 기본값은 `threads`입니다.
    - 공유 Vitest config는 `isolate: false`를 고정하고
      루트 프로젝트, e2e, live config 전반에 걸쳐
      비격리 runner를 사용합니다.
    - 루트 UI 레인은 자체 `jsdom` 설정 및 optimizer를 유지하지만
      공유 비격리 runner에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest config에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 기본적으로 Vitest child Node
      프로세스에 `--no-maglev`를 추가해 큰 로컬 실행 중 V8 컴파일 churn을 줄입니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 포맷팅 전용입니다. 포맷된 파일을 다시 stage하며
      lint, typecheck, test는 실행하지 않습니다.
    - handoff 또는 push 전에 스마트 로컬 게이트가
      필요하면 명시적으로 `pnpm check:changed`를 실행하세요. 공개 Plugin SDK 및 plugin-contract
      변경에는 extension 검증 1회가 포함됩니다.
    - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때
      범위 지정 레인을 통해 라우팅합니다.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅
      동작을 유지하되 worker 상한만 더 높습니다.
    - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가
      이미 높을 때는 자동으로 물러서므로, 여러 동시
      Vitest 실행이 기본적으로 덜 큰 피해를 줍니다.
    - 기본 Vitest config는 프로젝트/config 파일을
      `forceRerunTriggers`로 표시하므로 테스트 wiring이 바뀌었을 때 changed 모드 재실행이 올바르게 유지됩니다.
    - config는 지원되는
      호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성화된 상태로 유지합니다. 직접 프로파일링을 위한
      명시적 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration 리포팅과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 같은 프로파일링 보기를
      `origin/main` 이후 변경된 파일로 범위 제한합니다.
    - 하나의 hot test가 여전히 시작 import에 대부분의 시간을 쓴다면,
      무거운 의존성은 좁은 로컬 `*.runtime.ts` seam 뒤에 두고
      `vi.mock(...)`에 전달하기 위해 런타임 helper를 deep-import하지 말고
      해당 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 라우팅된
      `test:changed`와 해당 커밋된 diff의 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 현재 dirty tree를
      변경 파일 목록을
      `scripts/test-projects.mjs`와 루트 Vitest config를 통해 라우팅하는 방식으로 벤치마크합니다.
    - `pnpm test:perf:profile:main`은
      Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
    - `pnpm test:perf:profile:runner`는
      파일 병렬화를 비활성화한 unit 스위트용 runner CPU+heap 프로파일을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성 (gateway)

- 명령: `pnpm test:stability:gateway`
- config: `vitest.gateway.config.ts`, 강제로 worker 하나 사용
- 범위:
  - 기본적으로 진단이 활성화된 실제 loopback Gateway를 시작
  - 진단 이벤트 경로를 통해 합성 gateway message, memory, large-payload churn을 구동
  - Gateway WS RPC를 통해 `diagnostics.stability`를 조회
  - 진단 안정성 번들 영속화 helper를 다룸
  - recorder가 제한된 상태를 유지하고, 합성 RSS 샘플이 pressure budget 아래에 머물며, 세션별 queue depth가 다시 0으로 비워지는지 검증
- 기대 사항:
  - CI 안전, 키 불필요
  - 안정성 회귀 후속 조치를 위한 좁은 레인이며, 전체 Gateway 스위트를 대체하지는 않음

### E2E (gateway 스모크)

- 명령: `pnpm test:e2e`
- config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - repo 나머지와 동일하게 Vitest `threads`와 `isolate: false` 사용
  - 적응형 worker 사용(CI: 최대 2, 로컬: 기본 1)
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행
- 유용한 재정의:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(상한 16)
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`
- 범위:
  - 다중 인스턴스 gateway end-to-end 동작
  - WebSocket/HTTP 표면, node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키가 필요하지 않음
  - unit 테스트보다 이동 부품이 많음(더 느릴 수 있음)

### E2E: OpenShell backend 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작
  - 임시 로컬 Dockerfile에서 sandbox를 생성
  - 실제 `sandbox ssh-config` + SSH exec을 통해 OpenClaw의 OpenShell backend를 실행
  - sandbox fs bridge를 통해 remote-canonical 파일 시스템 동작을 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 동작하는 Docker daemon 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 gateway와 sandbox를 제거
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리나 wrapper 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (실제 provider + 실제 모델)

- 명령: `pnpm test:live`
- config: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin live 테스트
- 기본값: `pnpm test:live`에 의해 **활성화됨** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/model이 오늘 실제 자격 증명으로 _정말_ 동작하는가?”
  - provider 포맷 변경, tool-calling 특이점, 인증 이슈, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 provider 정책, 할당량, 장애)
  - 비용이 들고 / rate limit를 사용함
  - “전부”보다 범위를 좁힌 부분집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행도 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 실제 홈 디렉터리를 사용하도록 의도적으로 해야 할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드가 기본입니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림은 숨기고 gateway bootstrap 로그/Bonjour chatter도 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(provider별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나, live 전용 재정의로 `OPENCLAW_LIVE_*_KEY`를 사용하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - live 스위트는 이제 진행 라인을 stderr로 출력하므로, Vitest 콘솔 캡처가 조용해도 긴 provider 호출이 시각적으로 활성 상태임을 알 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 인터셉션을 비활성화하므로 provider/gateway 진행 라인이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

이 결정 표를 사용하세요:

- 로직/테스트 수정: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 죽었어요” / provider별 실패 / tool calling 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## Live (네트워크 접촉) 테스트

live 모델 매트릭스, CLI backend 스모크, ACP 스모크, Codex app-server
하네스, 그리고 모든 media-provider live 테스트(Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus live 실행을 위한 자격 증명 처리 — 는
[Testing — live suites](/ko/help/testing-live)를 참조하세요.

## Docker 실행기(선택적 "Linux에서 동작함" 검사)

이 Docker 실행기들은 두 가지 버킷으로 나뉩니다:

- Live-model 실행기: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 내부에서 일치하는 profile-key live 파일만 실행합니다(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`). 이때 로컬 config 디렉터리와 워크스페이스를 마운트하며(마운트된 경우 `~/.profile`도 source함), 일치하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 실행기는 전체 Docker 스윕이 실용적으로 유지되도록 더 작은 스모크 상한을 기본으로 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`, 그리고
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 더 큰 exhaustive 스캔이 명시적으로 필요할 때는 해당 env var를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤 이를 live Docker 레인에 재사용합니다. 또한 `test:docker:e2e-build`를 통해 공유 `scripts/e2e/Dockerfile` 이미지 하나를 빌드하고, 빌드된 앱을 실행하는 E2E 컨테이너 스모크 실행기에 재사용합니다. 이 집계는 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`이 프로세스 슬롯을 제어하고, 리소스 상한이 무거운 live, npm-install, multi-service 레인이 동시에 모두 시작되지 않도록 합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`을 조정하세요. 실행기는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인의 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤, 이후 실행에서 더 긴 레인을 먼저 시작하는 데 그 타이밍을 사용합니다. 빌드하거나 Docker를 실행하지 않고 가중 레인 매니페스트만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하세요.
- 컨테이너 스모크 실행기: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live-model Docker 실행기는 필요한 CLI 인증 홈만 bind-mount하며(실행 범위가 좁혀지지 않은 경우에는 지원되는 전체 홈), 실행 전에 이를 컨테이너 홈으로 복사하여 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고도 토큰을 갱신할 수 있게 합니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP bind 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server 하네스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩을 통해 OpenAI와 기본적으로 Telegram을 구성하고, doctor가 활성화된 Plugin 런타임 의존성을 복구하는지 검증하고, mock된 OpenAI 에이전트 턴을 한 번 실행합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, 채널을 바꾸려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패킹하고, 이를 격리된 홈에서 `bun install -g`로 설치한 뒤, `openclaw infer image providers --json`가 멈추지 않고 번들된 이미지 provider를 반환하는지 검증합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 빌드를 건너뛰려면 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, 빌드된 Docker 이미지에서 `dist/`를 복사하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`을 사용하세요.
- 설치 프로그램 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 간 하나의 npm 캐시를 공유합니다. update 스모크는 후보 tarball로 업그레이드하기 전 안정 기준선으로 npm `latest`를 기본 사용합니다. 비root 설치 프로그램 검사는 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 간 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 로컬에서 스크립트를 실행하세요.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에서 하나의 워크스페이스를 공유하는 두 에이전트를 시드한 뒤, `agents delete --json`을 실행하고 유효한 JSON 및 유지된 워크스페이스 동작을 검증합니다. install-smoke 이미지를 재사용하려면 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`을 사용하세요.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태 확인): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 mock된 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 뒤, provider schema 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 임베디드 Pi profile allow/deny 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP 정리(실제 Gateway + 격리된 Cron 및 one-shot subagent 실행 후 stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 시맨틱스): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
- 변경 없음 Plugin 업데이트 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- 번들 Plugin 런타임 의존성: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker 실행기 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드하고 패킹한 다음, 그 tarball을 각 Linux 설치 시나리오에 마운트합니다. 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`, 최근 로컬 빌드 후 호스트 재빌드를 건너뛰려면 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, 기존 tarball을 지정하려면 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하세요. 전체 Docker 집계는 이 tarball을 한 번 미리 패킹한 뒤, Telegram, Discord, Slack, Feishu, memory-lancedb, ACPX에 대한 별도 업데이트 레인을 포함해 번들 채널 검사를 독립 레인으로 샤딩합니다. 번들 레인을 직접 실행할 때 채널 매트릭스를 좁히려면 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, 업데이트 시나리오를 좁히려면 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`를 사용하세요. 이 레인은 또한 `channels.<id>.enabled=false` 및 `plugins.entries.<id>.enabled=false`가 doctor/런타임 의존성 복구를 억제하는지도 검증합니다.
- 반복 작업 중에는 관련 없는 시나리오를 비활성화하여 번들 Plugin 런타임 의존성 범위를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

공유 built-app 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트별 이미지 재정의는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키는 경우, 스크립트는 해당 이미지가 아직 로컬에 없으면 이를 pull합니다. QR 및 설치 프로그램 Docker 테스트는 공유 built-app 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

live-model Docker 실행기는 현재 체크아웃도 읽기 전용으로 bind-mount하고,
이를 컨테이너 내부의 임시 workdir로 stage합니다. 이렇게 하면 런타임
이미지는 슬림하게 유지하면서도 정확한 로컬 source/config에 대해 Vitest를 실행할 수 있습니다.
stage 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고 앱 로컬 `.build` 또는
Gradle 출력 디렉터리 같은 큰 로컬 전용 캐시 및 앱 빌드 출력을 건너뛰므로
Docker live 실행이 머신별 아티팩트를 복사하느라 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`도 설정하므로 gateway live probe가 컨테이너 내부에서
실제 Telegram/Discord 등의 채널 worker를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 gateway live 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 상위 수준의 호환성 스모크입니다. 이 테스트는
OpenAI 호환 HTTP 엔드포인트가 활성화된 OpenClaw gateway 컨테이너를 시작하고,
해당 gateway에 연결된 고정 버전 Open WebUI 컨테이너를 시작한 뒤,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 확인한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 전송합니다.
첫 실행은 Docker가
Open WebUI 이미지를 pull해야 하거나 Open WebUI가 자체 cold-start 설정을 마쳐야 할 수 있어 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 live 모델 키를 필요로 하며, Dockerized 실행에서는
`OPENCLAW_PROFILE_FILE`(`~/.profile`이 기본값)이 이를 제공하는 기본 방식입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제
Telegram, Discord, 또는 iMessage 계정이 필요하지 않습니다. 시드된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 다음,
실제 stdio MCP 브리지를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 메타데이터,
live event queue 동작, 아웃바운드 전송 라우팅, 그리고 Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접
검사하므로, 이 스모크는 특정 클라이언트 SDK가 우연히 노출하는 내용이 아니라
브리지가 실제로 내보내는 내용을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 live
모델 키가 필요하지 않습니다. repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP probe 서버를 시작하고,
임베디드 Pi 번들 MCP 런타임을 통해 해당 서버를 materialize하고,
도구를 실행한 다음, `coding` 및 `messaging`이 계속
`bundle-mcp` 도구를 유지하고 `minimal` 및 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 live 모델
키가 필요하지 않습니다. 실제 stdio MCP probe 서버가 있는 시드된 Gateway를 시작하고,
격리된 Cron 턴과 `/subagents spawn` one-shot child 턴을 실행한 다음,
각 실행 후 MCP child 프로세스가 종료되는지 검증합니다.

수동 ACP plain-language 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`) → `/home/node/.profile`에 마운트되며 테스트 실행 전에 source됨
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`을 사용하면 `OPENCLAW_PROFILE_FILE`에서 source된 env vars만 검증하며, 임시 config/workspace 디렉터리를 사용하고 외부 CLI auth 마운트는 사용하지 않습니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트
- `$HOME` 아래 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 뒤, 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트합니다
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 provider 필터링에는 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 profile 저장소에서 오도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`(env가 아님)
- Open WebUI 스모크를 위해 gateway가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크가 사용하는 nonce-check 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 sanity

문서를 수정한 뒤에는 docs 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사까지 필요할 때는 전체 Mintlify anchor 검사를 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

다음은 실제 provider 없이 “실제 파이프라인” 회귀를 검증하는 항목입니다:

- Gateway tool calling(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, config + auth enforced 쓰기): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 CI 안전한 테스트 몇 개가 있으며, 이들은 “에이전트 신뢰성 평가”처럼 동작합니다:

- 실제 gateway + agent loop를 통한 mock tool-calling (`src/gateway/gateway.test.ts`).
- 세션 wiring과 config 효과를 검증하는 end-to-end 마법사 흐름 (`src/gateway/gateway.test.ts`).

Skills에 대해 아직 부족한 부분([Skills](/ko/tools/skills) 참조):

- **Decisioning:** 프롬프트에 skill이 나열될 때 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 skill을 피하는가)?
- **Compliance:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인자를 따르는가?
- **Workflow contracts:** 도구 순서, 세션 기록 이월, sandbox 경계를 검증하는 멀티턴 시나리오.

향후 평가는 우선 결정적으로 유지되어야 합니다:

- mock provider를 사용해 도구 호출 + 순서, skill 파일 읽기, 세션 wiring을 검증하는 시나리오 실행기.
- skill 중심 시나리오의 소규모 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션).
- CI 안전 스위트가 마련된 후에만 선택적 live 평가(옵트인, env 게이트).

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin과 채널이
자신의 인터페이스 계약을 준수하는지 검증합니다. 발견된 모든 Plugin을 순회하며
형태 및 동작 검증 스위트를 실행합니다. 기본 `pnpm test` unit 레인은 의도적으로
이러한 공유 seam 및 스모크 파일을 건너뜁니다. 공유 채널 또는 provider 표면을 수정했다면
계약 명령을 명시적으로 실행하세요.

### 명령

- 전체 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- provider 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 있습니다:

- **plugin** - 기본 Plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 액션 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/로스터 API
- **group-policy** - 그룹 정책 강제

### Provider 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **status** - 채널 상태 probe
- **registry** - Plugin registry 형태

### Provider 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 검색
- **loader** - Plugin 로딩
- **runtime** - provider 런타임
- **shape** - Plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 하위 경로를 변경한 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 검색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(가이드)

live에서 발견한 provider/model 이슈를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub provider 또는 정확한 request-shape transformation 포착)
- 본질적으로 live 전용이라면(rate limit, auth 정책) live 테스트를 좁고 env var 기반 옵트인으로 유지하세요
- 버그를 잡는 가장 작은 계층을 대상으로 삼는 것을 선호하세요:
  - provider request conversion/replay 버그 → 직접 모델 테스트
  - gateway session/history/tool pipeline 버그 → gateway live 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별로 샘플 대상 하나를 도출한 뒤, traversal-segment exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 계열을 추가한다면 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 id에서 의도적으로 실패하므로 새 클래스가 조용히 건너뛰어질 수 없습니다.

## 관련 항목

- [Testing live](/ko/help/testing-live)
- [CI](/ko/ci)
