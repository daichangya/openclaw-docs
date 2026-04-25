---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/프로바이더 버그에 대한 회귀 테스트 추가하기
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 실행기, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw에는 세 가지 Vitest 스위트(단위/통합, e2e, 라이브)와 소수의 Docker 실행기가 있습니다. 이 문서는 "우리가 어떻게 테스트하는지"에 대한 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 _다루지 않는_ 것은 무엇인지).
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 어떤 명령을 실행해야 하는지.
- 라이브 테스트가 자격 증명을 어떻게 찾고 모델/프로바이더를 어떻게 선택하는지.
- 실제 모델/프로바이더 문제에 대한 회귀 테스트를 어떻게 추가하는지.

## 빠른 시작

대부분의 날에는 다음을 사용합니다.

- 전체 게이트(푸시 전에 예상됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest 감시 루프: `pnpm test:watch`
- 이제 직접 파일 지정이 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 작업 중일 때는 먼저 대상 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때는 다음을 사용합니다.

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- 라이브 스위트(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 라이브 파일만 조용히 대상 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 라이브 모델 스윕: `pnpm test:docker:live-models`
  - 이제 선택된 각 모델은 텍스트 턴과 작은 파일 읽기 스타일 프로브를 실행합니다.
    메타데이터가 `image` 입력을 광고하는 모델은 작은 이미지 턴도 실행합니다.
    프로바이더 실패를 분리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 둘 다 재사용 가능한 라이브/E2E 워크플로를
    `include_live_suites: true`로 호출하며, 여기에는 프로바이더별로 샤딩된
    별도 Docker 라이브 모델 매트릭스 작업이 포함됩니다.
  - 집중된 CI 재실행의 경우 `OpenClaw Live And E2E Checks (Reusable)`를
    `include_live_suites: true` 및 `live_models_only: true`로 디스패치하세요.
  - 새로운 고신호 프로바이더 시크릿을 추가할 때는 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`, 그리고 그
    scheduled/release 호출자에도 추가하세요.
- 네이티브 Codex 바인드 채팅 스모크: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker 라이브 레인을 실행하고, 합성
    Slack DM을 `/codex bind`로 바인드한 뒤, `/codex fast`와
    `/codex permissions`를 실행하고, 일반 답장과 이미지 첨부가 ACP 대신
    네이티브 Plugin 바인딩을 통해 라우팅되는지 확인합니다.
- Crestodian 구조 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 구조 명령 표면을 위한 선택형 이중 안전 점검입니다.
    `/crestodian status`를 실행하고, 지속형 모델 변경을 대기열에 넣고,
    `/crestodian yes`에 응답한 다음, 감사/구성 쓰기 경로를 확인합니다.
- Crestodian planner Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 구성 없는 컨테이너에서 Crestodian을 실행하고
    fuzzy planner 대체 경로가 감사된 형식화된 구성 쓰기로 변환되는지 확인합니다.
- Crestodian 첫 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작해, 기본 `openclaw`를 Crestodian으로
    라우팅하고, setup/model/agent/Discord Plugin + SecretRef 쓰기를 적용하고,
    구성을 검증하고, 감사 항목을 확인합니다. 동일한 Ring 0 설정 경로는 QA Lab의
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`에서도
    다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  을 실행하세요. JSON이 Moonshot/K2.6을 보고하고 어시스턴트 transcript가 정규화된
  `usage.cost`를 저장하는지 확인하세요.

팁: 하나의 실패 사례만 필요할 때는 아래에 설명된 허용 목록 env var로 라이브 테스트 범위를 좁히는 방식을 선호하세요.

## QA 전용 실행기

이 명령은 QA-lab 수준의 현실성이 필요할 때 메인 테스트 스위트 옆에서 사용합니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
수동 디스패치에서 mock 프로바이더로 실행됩니다. `QA-Lab - All Lanes`는
`main`에서 매일 밤, 그리고 수동 디스패치에서 mock parity gate, 라이브 Matrix 레인,
Convex 관리형 라이브 Telegram 레인을 병렬 작업으로 실행합니다. `OpenClaw Release Checks`는
릴리스 승인 전에 동일한 레인을 실행합니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커와 함께 여러 선택된 시나리오를 병렬로 실행합니다.
    `qa-channel`은 기본적으로 동시성 4를 사용합니다(선택된 시나리오 수에 의해 제한됨).
    워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전의 직렬 레인은
    `--concurrency 1`을 사용하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이
    아티팩트를 원할 때는 `--allow-failures`를 사용하세요.
  - 프로바이더 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 실험적 fixture 및 프로토콜 mock 커버리지를 위해 로컬 AIMock 기반
    프로바이더 서버를 시작하지만, 시나리오 인지형 `mock-openai` 레인을 대체하지는 않습니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 내부에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 프로바이더/모델 선택 플래그를 재사용합니다.
  - 라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 프로바이더 키, QA 라이브 프로바이더 구성 경로, 존재할 경우 `CODEX_HOME`.
  - 출력 디렉터리는 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록
    저장소 루트 아래에 있어야 합니다.
  - 일반 QA 보고서 + 요약과 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, Docker에 전역 설치하고,
    비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하고,
    Plugin 활성화가 런타임 의존성을 필요 시 설치하는지 확인하고, doctor를 실행하고,
    mock된 OpenAI 엔드포인트에 대해 하나의 로컬 에이전트 턴을 실행합니다.
  - 동일한 패키지 설치 레인을 Discord로 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:npm-telegram-live`
  - 게시된 OpenClaw 패키지를 Docker에 설치하고, 설치된 패키지 온보딩을 실행하고,
    설치된 CLI를 통해 Telegram을 구성한 다음, 그 설치된 패키지를 SUT Gateway로 하여
    라이브 Telegram QA 레인을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명
    소스를 사용합니다. CI/릴리스 자동화의 경우
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL`, 그리고 역할 시크릿을 설정하세요. CI에서
    `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex 역할 시크릿이 존재하면 Docker 래퍼는
    자동으로 Convex를 선택합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 한해
    공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 레인을 수동 maintainer 워크플로
    `NPM Telegram Beta E2E`로 노출합니다. 병합 시에는 실행되지 않습니다. 이 워크플로는
    `qa-live-shared` environment와 Convex CI 자격 증명 리스를 사용합니다.
- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 Docker에 pack 및 설치하고, OpenAI가 구성된 상태로 Gateway를
    시작한 다음, config 편집을 통해 번들된 channel/plugins를 활성화합니다.
  - 설정 탐지가 구성되지 않은 Plugin 런타임 의존성을 부재 상태로 두는지, 첫 번째로
    구성된 Gateway 또는 doctor 실행이 각 번들 Plugin의 런타임 의존성을 필요 시 설치하는지,
    두 번째 재시작이 이미 활성화된 의존성을 다시 설치하지 않는지 확인합니다.
  - 알려진 오래된 npm 기준 버전도 설치하고, `openclaw update --tag <candidate>`를
    실행하기 전에 Telegram을 활성화한 다음, 후보 버전의 사후 업데이트 doctor가
    하네스 측 postinstall 복구 없이 번들 channel 런타임 의존성을 복구하는지 확인합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 스모크를 실행합니다.
    선택된 각 플랫폼은 먼저 요청된 기준 패키지를 설치한 다음, 같은 게스트에서 설치된
    `openclaw update` 명령을 실행하고 설치 버전, 업데이트 상태, gateway 준비 상태,
    그리고 하나의 로컬 에이전트 턴을 확인합니다.
  - 한 게스트에서 반복 작업할 때는 `--platform macos`, `--platform windows`,
    또는 `--platform linux`를 사용하세요. 요약 아티팩트 경로와 레인별 상태를 보려면
    `--json`을 사용하세요.
  - 긴 로컬 실행은 호스트 timeout으로 감싸서 Parallels 전송 정체가 나머지 테스트 시간
    전체를 소모하지 않도록 하세요.

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩된 레인 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 씁니다.
    외부 래퍼가 멈췄다고 판단하기 전에 `windows-update.log`, `macos-update.log`,
    또는 `linux-update.log`를 확인하세요.
  - Windows 업데이트는 차가운 게스트에서 사후 업데이트 doctor/런타임 의존성 복구에
    10~15분이 걸릴 수 있습니다. 중첩된 npm 디버그 로그가 진행 중이라면 이는 여전히 정상입니다.
  - 이 집계 래퍼를 개별 Parallels macOS, Windows 또는 Linux 스모크 레인과 병렬로
    실행하지 마세요. 이들은 VM 상태를 공유하며 snapshot 복원, 패키지 제공 또는
    게스트 gateway 상태에서 충돌할 수 있습니다.
  - 사후 업데이트 증명은 일반적인 번들 Plugin 표면을 실행합니다. speech, image generation,
    media understanding 같은 capability facade는 에이전트 턴 자체가 단순한 텍스트 응답만
    확인하더라도 번들된 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock 프로바이더 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel 홈서버에 대해 Matrix 라이브 QA 레인을 실행합니다.
  - 이 QA 호스트는 현재 저장소/개발 전용입니다. 패키지로 설치된 OpenClaw에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`를 노출하지 않습니다.
  - 저장소 체크아웃은 번들된 실행기를 직접 로드하므로 별도의 Plugin 설치 단계가 필요 없습니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 비공개 room 하나를 프로비저닝한 다음, 실제 Matrix Plugin을 SUT 전송으로 사용하는 QA gateway 자식을 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`를 사용합니다. 다른 이미지를 테스트해야 할 때는 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix는 레인이 일회용 사용자를 로컬에서 프로비저닝하므로 공유 자격 증명 소스 플래그를 노출하지 않습니다.
  - Matrix QA 보고서, 요약, observed-events 아티팩트, 그리고 결합된 stdout/stderr 출력 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
  - 기본적으로 진행 상황을 출력하고 `OPENCLAW_QA_MATRIX_TIMEOUT_MS`(기본값 30분)로 강제 실행 시간 제한을 적용합니다. 정리는 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`로 제한되며, 실패 시 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT 봇 토큰을 사용해 실제 비공개 그룹에 대해 Telegram 라이브 QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 ID는 숫자형 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명을 위해 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하거나, 풀 임대를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트를 원할 때는 `--allow-failures`를 사용하세요.
  - 동일한 비공개 그룹에 서로 다른 두 개의 봇이 필요하며, SUT 봇은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 봇 간 관찰을 위해 `@BotFather`에서 두 봇 모두에 대해 Bot-to-Bot Communication Mode를 활성화하고 driver 봇이 그룹의 봇 트래픽을 관찰할 수 있게 하세요.
  - Telegram QA 보고서, 요약, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다. 응답 시나리오에는 driver 전송 요청부터 관찰된 SUT 응답까지의 RTT가 포함됩니다.

라이브 전송 레인은 새 전송이 드리프트하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 여전히 광범위한 합성 QA 스위트이며 라이브 전송 커버리지 매트릭스의 일부는 아닙니다.

| 레인     | Canary | 멘션 게이팅 | 허용 목록 차단 | 최상위 응답 | 재시작 재개 | 스레드 후속 조치 | 스레드 격리 | 반응 관찰 | 도움말 명령 |
| -------- | ------ | ----------- | -------------- | ----------- | ----------- | ---------------- | ----------- | --------- | ----------- |
| Matrix   | x      | x           | x              | x           | x           | x                | x           | x         |             |
| Telegram | x      |             |                |             |             |                  |             |           | x           |

### Convex를 통한 공유 Telegram 자격 증명 (v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면, QA lab은 Convex 기반 풀에서 독점 임대를 획득하고, 레인이 실행되는 동안 해당 임대에 Heartbeat를 보내며, 종료 시 임대를 해제합니다.

참조 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env var:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 시크릿 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본 `ci`, 그 외에는 `maintainer`)

선택적 env var:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

maintainer 관리자 명령(pool add/remove/list)에는 구체적으로
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

maintainer용 CLI 도우미:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용해 시크릿 값을 출력하지 않고 Convex 사이트 URL,
broker 시크릿, endpoint prefix, HTTP timeout, 관리자/list 도달 가능성을 확인하세요.
스크립트와 CI 유틸리티에서 기계 판독 가능한 출력을 원하면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(maintainer 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(maintainer 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 임대 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(maintainer 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind에 대한 payload 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 payload를 거부합니다.

### QA에 channel 추가하기

Markdown QA 시스템에 channel을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 channel용 전송 어댑터.
2. channel 계약을 검증하는 시나리오 팩.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다:

- `openclaw qa` 명령 루트
- 스위트 시작 및 종료
- 워커 동시성
- 아티팩트 기록
- 보고서 생성
- 시나리오 실행
- 오래된 `qa-channel` 시나리오에 대한 호환성 별칭

실행기 Plugin은 전송 계약을 소유합니다:

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 어떻게 마운트되는지
- 해당 전송에 대해 gateway가 어떻게 구성되는지
- 준비 상태를 어떻게 확인하는지
- 인바운드 이벤트를 어떻게 주입하는지
- 아웃바운드 메시지를 어떻게 관찰하는지
- transcript와 정규화된 전송 상태를 어떻게 노출하는지
- 전송 기반 동작을 어떻게 실행하는지
- 전송별 재설정 또는 정리를 어떻게 처리하는지

새 channel의 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자로 `qa-lab`을 유지합니다.
2. 공유 `qa-lab` 호스트 시임에서 전송 실행기를 구현합니다.
3. 전송별 메커니즘은 실행기 Plugin 또는 channel 하네스 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 실행기를 `openclaw qa <runner>`로 마운트합니다.
   실행기 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다.
   `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 실행기 실행은 별도의 엔트리포인트 뒤에 있어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 Markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 시나리오 도우미를 사용합니다.
7. 저장소가 의도적인 마이그레이션을 수행 중이 아닌 한 기존 호환성 별칭이 계속 작동하도록 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 넣으세요.
- 동작이 하나의 channel 전송에 의존한다면 해당 실행기 Plugin 또는 Plugin 하네스에 유지하세요.
- 시나리오에 둘 이상의 channel이 사용할 수 있는 새 기능이 필요하다면 `suite.ts`에 channel별 분기를 추가하는 대신 일반 도우미를 추가하세요.
- 동작이 하나의 전송에만 의미가 있다면 시나리오를 해당 전송 전용으로 유지하고 시나리오 계약에서 이를 명시하세요.

새 시나리오에 권장되는 일반 도우미 이름은 다음과 같습니다.

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

기존 시나리오를 위한 호환성 별칭도 계속 사용할 수 있습니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 channel 작업에는 일반 도우미 이름을 사용해야 합니다.
호환성 별칭은 플래그 데이 마이그레이션을 피하기 위해 존재하는 것이지,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(어디서 무엇이 실행되는지)

스위트를 “현실성이 점점 높아지는 것”(그리고 불안정성/비용도 증가하는 것)으로 생각하세요.

### 단위 / 통합(기본값)

- 명령: `pnpm test`
- 구성: 대상 미지정 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`에서 다루는 허용 목록 `ui` node 테스트
- 범위:
  - 순수 단위 테스트
  - 프로세스 내 통합 테스트(gateway 인증, 라우팅, 도구, 파싱, 구성)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 대상이 지정되지 않은 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 있는 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기는 일을 방지합니다.
    - `pnpm test --watch`는 다중 샤드 감시 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 대상을 먼저 범위 지정 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 diff가 라우팅 가능한 소스/테스트 파일만 건드릴 때 변경된 git 경로를 동일한 범위 지정 레인으로 확장합니다. config/setup 편집은 여전히 광범위한 루트 프로젝트 재실행으로 폴백합니다.
    - `pnpm check:changed`는 좁은 작업에 대한 일반적인 스마트 로컬 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, release metadata, tooling으로 분류한 다음 일치하는 typecheck/lint/test 레인을 실행합니다. 공개 Plugin SDK 및 plugin-contract 변경에는 extension이 해당 core 계약에 의존하므로 extension 검증 1회가 포함됩니다. 릴리스 메타데이터 전용 버전 범프는 전체 스위트 대신 대상 버전/config/root-dependency 검사를 실행하며, 최상위 버전 필드 외부의 package 변경을 거부하는 가드가 있습니다.
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import가 가벼운 단위 테스트는 `unit-fast` 레인을 통해 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 런타임이 무거운 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 변경 모드 실행을 해당 가벼운 레인의 명시적 sibling 테스트로 매핑하므로, helper 편집이 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않도록 합니다.
    - `auto-reply`에는 세 개의 전용 버킷이 있습니다: 최상위 core helper, 최상위 `reply.*` 통합 테스트, 그리고 `src/auto-reply/reply/**` 하위 트리입니다. 이렇게 하면 가장 무거운 reply 하네스 작업이 저렴한 status/chunk/token 테스트에 올라타지 않게 됩니다.

  </Accordion>

  <Accordion title="임베디드 실행기 커버리지">

    - message-tool 탐지 입력이나 Compaction 런타임 컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화 경계를 위한 집중된 helper 회귀 테스트를 추가하세요.
    - 임베디드 실행기 통합 스위트가 정상 상태를 유지하도록 하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 스위트들은 범위 지정된 ID와 Compaction 동작이 실제 `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지를 검증합니다. helper 전용 테스트만으로는 이러한 통합 경로를 충분히 대체할 수 없습니다.

  </Accordion>

  <Accordion title="Vitest 풀 및 격리 기본값">

    - 기본 Vitest 구성은 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest 구성은 `isolate: false`를 고정하고 루트 프로젝트, e2e, 라이브 구성 전반에서 비격리 실행기를 사용합니다.
    - 루트 UI 레인은 `jsdom` 설정과 optimizer를 유지하지만, 역시 공유 비격리 실행기에서 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 포맷팅 전용입니다. 포맷된 파일을 다시 스테이징하지만 lint, typecheck, test는 실행하지 않습니다.
    - 스마트 로컬 게이트가 필요할 때는 handoff 또는 push 전에 `pnpm check:changed`를 명시적으로 실행하세요. 공개 Plugin SDK 및 plugin-contract 변경에는 extension 검증 1회가 포함됩니다.
    - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때 범위 지정 레인을 통해 라우팅됩니다.
    - `pnpm test:max`와 `pnpm test:changed:max`도 같은 라우팅 동작을 유지하며, 단지 더 높은 worker 상한을 사용할 뿐입니다.
    - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가 이미 높을 때는 물러나므로, 여러 동시 Vitest 실행이 기본적으로 덜 해롭습니다.
    - 기본 Vitest 구성은 프로젝트/구성 파일을 `forceRerunTriggers`로 표시하여 테스트 wiring이 바뀔 때 변경 모드 재실행이 정확하게 유지되도록 합니다.
    - 이 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성 상태로 유지합니다. 직접 프로파일링을 위해 하나의 명시적 캐시 위치를 원한다면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 프로파일링 뷰를 `origin/main` 이후 변경된 파일로 범위를 좁힙니다.
    - 하나의 hot test가 여전히 시작 import에 대부분의 시간을 쓰고 있다면, 무거운 의존성을 좁은 로컬 `*.runtime.ts` 시임 뒤에 두고, 런타임 helper를 단지 `vi.mock(...)`에 넘기기 위해 deep-import하는 대신 그 시임을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋된 diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest 구성으로 라우팅해 현재 dirty tree를 벤치마크합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
    - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 상태로 단위 스위트의 runner CPU+heap 프로파일을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 기본적으로 진단이 활성화된 실제 loopback Gateway를 시작합니다
  - 합성 gateway 메시지, 메모리, 대형 payload churn을 진단 이벤트 경로로 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 조회합니다
  - 진단 안정성 번들 지속성 helper를 다룹니다
  - recorder가 bounded 상태를 유지하고, 합성 RSS 샘플이 압력 예산 아래를 유지하며, 세션별 queue depth가 다시 0으로 배수되는지 단언합니다
- 기대 사항:
  - CI 안전 및 키 불필요
  - 안정성 회귀 후속 조치를 위한 좁은 레인이지, 전체 Gateway 스위트를 대체하는 것은 아님

### E2E(Gateway 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - 저장소의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 worker를 사용합니다(CI: 최대 2, 로컬: 기본값 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행합니다.
- 유용한 재정의:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(상한 16).
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`.
- 범위:
  - 다중 인스턴스 gateway 종단 간 동작
  - WebSocket/HTTP 표면, Node pairing, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - 단위 테스트보다 움직이는 부분이 더 많음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작합니다
  - 임시 로컬 Dockerfile에서 sandbox를 생성합니다
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드를 실행합니다
  - sandbox fs bridge를 통해 원격 canonical 파일 시스템 동작을 검증합니다
- 기대 사항:
  - 선택적 실행 전용이며 기본 `pnpm test:e2e` 실행의 일부가 아님
  - 로컬 `openshell` CLI와 정상 동작하는 Docker daemon이 필요함
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 gateway와 sandbox를 파기함
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본값이 아닌 CLI 바이너리 또는 wrapper 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### 라이브(실제 프로바이더 + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin 라이브 테스트
- 기본값: `pnpm test:live`로 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 프로바이더/모델이 _오늘_ 실제 자격 증명으로 실제로 동작하는가?”
  - 프로바이더 형식 변경, tool-calling 특성, 인증 문제, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 프로바이더 정책, quota, 장애)
  - 비용이 들고 / rate limit를 사용함
  - “전부”보다 범위를 좁힌 부분집합 실행을 선호
- 라이브 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소스로 불러옵니다.
- 기본적으로 라이브 실행도 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈으로 복사하므로 단위 fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- 라이브 테스트가 의도적으로 실제 홈 디렉터리를 사용해야 할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본값으로 사용합니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림은 숨기고 gateway bootstrap 로그/Bonjour chatter는 음소거합니다. 전체 시작 로그를 다시 보고 싶다면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 회전(프로바이더별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나, 라이브별 재정의로 `OPENCLAW_LIVE_*_KEY`를 설정하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - 라이브 스위트는 이제 stderr로 진행 줄을 출력하므로 Vitest 콘솔 캡처가 조용한 경우에도 긴 프로바이더 호출이 눈에 보이게 활성 상태를 유지합니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 프로바이더/gateway 진행 줄이 라이브 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

이 결정 표를 사용하세요.

- 로직/테스트를 편집하는 경우: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / pairing을 건드리는 경우: `pnpm test:e2e` 추가
- “내 봇이 다운됨” / 프로바이더별 실패 / tool calling을 디버깅하는 경우: 범위를 좁힌 `pnpm test:live` 실행

## 라이브(네트워크 접촉) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex app-server
하네스, 그리고 모든 미디어 프로바이더 라이브 테스트(Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — 라이브 실행의 자격 증명 처리 포함 — 에 대해서는
[Testing — 라이브 스위트](/ko/help/testing-live)를 참조하세요.

## Docker 실행기(선택적 "Linux에서 동작함" 확인)

이 Docker 실행기는 두 개의 버킷으로 나뉩니다:

- 라이브 모델 실행기: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 내부에서 일치하는 profile-key 라이브 파일만 실행합니다(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`). 이때 로컬 config 디렉터리와 워크스페이스를 마운트하며(마운트된 경우 `~/.profile`도 소스로 불러옴), 일치하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 실행기는 전체 Docker 스윕이 실용적으로 유지되도록 기본적으로 더 작은 스모크 상한을 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`를 사용하고,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 더 큰 전체 스캔을
  명시적으로 원할 때는 해당 env var를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드한 뒤, 이를 라이브 Docker 레인에서 재사용합니다. 또한 `test:docker:e2e-build`를 통해 하나의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드하고, 빌드된 앱을 검증하는 E2E 컨테이너 스모크 실행기에서 이를 재사용합니다. 이 집계는 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`이 프로세스 슬롯을 제어하고, 리소스 상한은 무거운 라이브, npm-install, 다중 서비스 레인이 한꺼번에 모두 시작되지 않도록 합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 여유가 더 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`을 조정하세요. 실행기는 기본적으로 Docker preflight를 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장하며, 이후 실행에서는 그 타이밍을 사용해 더 긴 레인을 먼저 시작합니다. 빌드나 Docker 실행 없이 가중치 기반 레인 매니페스트만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하세요.
- 컨테이너 스모크 실행기: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 통합 경로를 검증합니다.

라이브 모델 Docker 실행기는 필요한 CLI 인증 홈만 바인드 마운트하고(또는 실행 범위가 좁혀지지 않았을 때는 지원되는 모든 홈을 마운트), 실행 전에 이를 컨테이너 홈으로 복사합니다. 이렇게 하면 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 다루며, 엄격한 OpenCode 커버리지는 `pnpm test:docker:live-acp-bind:opencode` 사용)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server 하네스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- npm tarball 온보딩/channel/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩을 통해 OpenAI를 구성한 뒤 기본적으로 Telegram을 구성하고, doctor가 활성화된 Plugin 런타임 의존성을 복구하는지 확인하며, mock된 OpenAI 에이전트 턴 1회를 실행합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하고, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`을 사용하며, channel을 바꾸려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패킹하고, 격리된 홈에서 `bun install -g`로 설치한 다음, `openclaw infer image providers --json`이 멈추지 않고 번들된 이미지 프로바이더를 반환하는지 검증합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하고, 호스트 빌드를 건너뛰려면 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`을 사용하며, 빌드된 Docker 이미지에서 `dist/`를 복사하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`을 사용하세요.
- Installer Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 루트, 업데이트, direct-npm 컨테이너 전체에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 tarball로 업그레이드하기 전 안정 기준선으로 기본적으로 npm `latest`를 사용합니다. 비루트 installer 검사는 루트 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 간 루트/업데이트/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`을 사용해 중복된 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 로컬에서 스크립트를 실행하세요.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 워크스페이스를 가진 두 에이전트를 시드하고, `agents delete --json`을 실행한 뒤, 유효한 JSON과 유지된 워크스페이스 동작을 검증합니다. install-smoke 이미지를 재사용하려면 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`을 사용하세요.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태 확인): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` 최소 reasoning 회귀 테스트: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 mock된 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, 프로바이더 스키마 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP channel bridge(시드된 Gateway + stdio bridge + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 임베디드 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP 정리(실제 Gateway + stdio MCP 자식 종료, 격리된 Cron 및 원샷 subagent 실행 후): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 의미론): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
- 변경 없음 Plugin 업데이트 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- 구성 리로드 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- 번들 Plugin 런타임 의존성: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker 실행기 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드 및 패킹한 다음, 각 Linux 설치 시나리오에 그 tarball을 마운트합니다. 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용하고, 새 로컬 빌드 후 호스트 재빌드를 건너뛰려면 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`을 사용하며, 기존 tarball을 가리키려면 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하세요. 전체 Docker 집계는 이 tarball을 한 번 미리 패킹한 뒤, 번들 channel 검사를 독립 레인으로 샤딩하며, Telegram, Discord, Slack, Feishu, memory-lancedb, ACPX용 별도 업데이트 레인도 포함합니다. 번들 레인을 직접 실행할 때 channel 매트릭스를 좁히려면 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`를 사용하고, 업데이트 시나리오를 좁히려면 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`를 사용하세요. 이 레인은 또한 `channels.<id>.enabled=false`와 `plugins.entries.<id>.enabled=false`가 doctor/런타임 의존성 복구를 억제하는지도 검증합니다.
- 반복 작업 중에는 관련 없는 시나리오를 비활성화해 번들 Plugin 런타임 의존성 범위를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

공유 built-app 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트별 이미지 재정의는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키면, 스크립트는 해당 이미지가 아직 로컬에 없을 때 pull합니다. QR 및 installer Docker 테스트는 공유 built-app 런타임이 아니라 package/install 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 실행기는 현재 체크아웃도 읽기 전용으로 바인드 마운트하고,
이를 컨테이너 내부의 임시 workdir로 스테이징합니다. 이렇게 하면 런타임
이미지는 슬림하게 유지하면서도 정확히 로컬 소스/config에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고
앱 로컬 `.build` 또는 Gradle 출력 디렉터리 같은 대형 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로,
Docker 라이브 실행이 머신별 아티팩트를 복사하는 데 몇 분씩 소비하지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway 라이브 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등의 channel 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 gateway 라이브 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. 이 레인은
OpenAI 호환 HTTP 엔드포인트가 활성화된 OpenClaw gateway 컨테이너를 시작하고,
해당 gateway에 대해 고정된 Open WebUI 컨테이너를 시작하며, Open WebUI를 통해 로그인하고,
`/api/models`가 `openclaw/default`를 노출하는지 확인한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 chat 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 pull해야 하거나 Open WebUI가 자체 cold-start 설정을 마쳐야 할 수 있으므로 눈에 띄게 더 느릴 수 있습니다.
이 레인에는 사용 가능한 라이브 모델 키가 필요하며, Dockerized 실행에서 이를 제공하는 기본 방법은
`OPENCLAW_PROFILE_FILE`(`~/.profile`이 기본값)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord, 또는 iMessage 계정이 필요하지 않습니다. 시드된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 스폰하는 두 번째 컨테이너를 시작한 다음,
실제 stdio MCP bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 메타데이터,
라이브 이벤트 queue 동작, outbound send 라우팅, 그리고 Claude 스타일 channel +
권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP frame을 직접 검사하므로,
이 스모크는 특정 클라이언트 SDK가 우연히 노출하는 것만이 아니라 bridge가 실제로 내보내는 것을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 라이브 모델 키가 필요하지 않습니다.
이 레인은 저장소 Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하고,
그 서버를 임베디드 Pi 번들 MCP 런타임을 통해 구체화하고, 도구를 실행한 다음,
`coding`과 `messaging`은 `bundle-mcp` 도구를 유지하고,
`minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`도 결정적이며 라이브 모델 키가 필요하지 않습니다.
이 레인은 실제 stdio MCP 프로브 서버가 있는 시드된 Gateway를 시작하고,
격리된 Cron 턴과 `/subagents spawn` 원샷 자식 턴을 실행한 다음,
각 실행 후 MCP 자식 프로세스가 종료되는지 검증합니다.

수동 ACP 평이한 언어 thread 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로용으로 유지하세요. ACP thread 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env var:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`) → `/home/node/.profile`에 마운트되며 테스트 실행 전에 소스로 불러옴
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`을 사용하면 `OPENCLAW_PROFILE_FILE`에서 소스로 불러온 env var만 검증하며, 임시 config/workspace 디렉터리를 사용하고 외부 CLI 인증 마운트는 하지 않습니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트
- `$HOME` 아래의 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 프로바이더 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트합니다
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 프로바이더 필터링: `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 env가 아니라 profile 저장소에서 오도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI 스모크용으로 gateway가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크가 사용하는 nonce 확인 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 sanity

문서를 편집한 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사도 필요할 때는 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

이들은 실제 프로바이더 없이도 “실제 파이프라인” 회귀를 검증합니다.

- Gateway tool calling(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config + auth 강제 쓰기): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 evals(Skills)

이미 CI 안전 테스트 몇 개가 있으며, 이는 “에이전트 신뢰성 evals”처럼 동작합니다.

- 실제 gateway + agent loop를 통한 mock tool-calling(`src/gateway/gateway.test.ts`).
- 세션 wiring과 config 효과를 검증하는 종단 간 wizard 흐름(`src/gateway/gateway.test.ts`).

Skills에 대해 여전히 부족한 부분([Skills](/ko/tools/skills) 참조):

- **의사결정:** 프롬프트에 skill이 나열되었을 때 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 것을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인수를 따르는가?
- **워크플로 계약:** tool 순서, 세션 기록 이월, sandbox 경계를 단언하는 다중 턴 시나리오.

향후 eval은 우선 결정적이어야 합니다.

- tool 호출 + 순서, skill 파일 읽기, 세션 wiring을 단언하기 위해 mock 프로바이더를 사용하는 시나리오 실행기.
- skill 중심의 작은 시나리오 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션).
- 선택형 라이브 eval(env 게이트됨)은 CI 안전 스위트가 마련된 뒤에만 추가.

## 계약 테스트(Plugin 및 channel 형태)

계약 테스트는 등록된 모든 Plugin과 channel이 해당 인터페이스 계약을 준수하는지 검증합니다. 이 테스트는 발견된 모든 Plugin을 순회하고 형태 및 동작 단언 스위트를 실행합니다. 기본 `pnpm test` 단위 레인은 의도적으로 이러한 공유 시임 및 스모크 파일을 건너뛰므로, 공유 channel 또는 프로바이더 표면을 건드릴 때는 계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- channel 계약만: `pnpm test:contracts:channels`
- 프로바이더 계약만: `pnpm test:contracts:plugins`

### Channel 계약

위치: `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - 기본 Plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - channel 동작 핸들러
- **threading** - thread ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### 프로바이더 상태 계약

위치: `src/plugins/contracts/*.contract.test.ts`.

- **status** - channel 상태 프로브
- **registry** - Plugin 레지스트리 형태

### 프로바이더 계약

위치: `src/plugins/contracts/*.contract.test.ts`:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 발견
- **loader** - Plugin 로딩
- **runtime** - 프로바이더 런타임
- **shape** - Plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- channel 또는 프로바이더 Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 발견을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가하기(가이드)

라이브에서 발견된 프로바이더/모델 문제를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub 프로바이더를 사용하거나 정확한 요청 형태 변환을 캡처)
- 본질적으로 라이브 전용이라면(rate limit, 인증 정책), 라이브 테스트는 좁고 env var를 통한 opt-in으로 유지하세요
- 버그를 잡는 가장 작은 계층을 대상으로 하는 것을 선호하세요:
  - 프로바이더 요청 변환/재생 버그 → 직접 모델 테스트
  - gateway 세션/기록/tool 파이프라인 버그 → gateway 라이브 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스당 샘플 대상 하나를 도출한 다음, 순회 세그먼트 exec ID가 거부되는지 단언합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 패밀리를 추가한다면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 새 클래스가 조용히 건너뛰어지지 않도록 분류되지 않은 target ID에서 의도적으로 실패합니다.

## 관련 항목

- [Testing live](/ko/help/testing-live)
- [CI](/ko/ci)
