---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/provider 버그에 대한 회귀 테스트 추가하기
    - Gateway + 에이전트 동작 디버깅하기
summary: '테스트 키트: unit/e2e/live 스위트, Docker 실행기, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-21T06:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef5bf36f969a6334efd2e8373a0c8002f9e6461af53c4ff630b38ad8e37f73de
    source_path: help/testing.md
    workflow: 15
---

# 테스트

OpenClaw에는 세 개의 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 실행기가 있습니다.

이 문서는 “OpenClaw가 테스트하는 방식” 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 _다루지 않는_ 것이 무엇인지)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 어떤 명령을 실행해야 하는지
- live 테스트가 자격 증명을 어떻게 찾고 모델/provider를 어떻게 선택하는지
- 실제 모델/provider 이슈에 대한 회귀 테스트를 추가하는 방법

## 빠른 시작

대부분의 날에는 다음을 사용합니다.

- 전체 게이트(푸시 전 예상): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 타기팅은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 중이라면 먼저 타기팅 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 건드렸거나 추가 신뢰가 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 providers/models를 디버깅할 때(실제 자격 증명 필요):

- live 스위트(models + gateway tool/image probes): `pnpm test:live`
- 하나의 live 파일만 조용히 타기팅: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`를 설정한 상태에서
  `openclaw models list --provider moonshot --json`를 실행한 다음,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  를 실행하세요. JSON이 Moonshot/K2.6을 보고하고,
  assistant transcript가 정규화된 `usage.cost`를 저장하는지 확인하세요.

팁: 하나의 실패 사례만 필요하다면, 아래에 설명된 허용 목록 env vars를 통해 live 테스트 범위를 좁히는 것을 우선하세요.

## QA 전용 실행기

이 명령들은 QA-lab 현실성이 필요할 때 메인 테스트 스위트 옆에서 사용됩니다.

- `pnpm openclaw qa suite`
  - 호스트에서 repo 기반 QA 시나리오를 직접 실행합니다.
  - 기본적으로 격리된 gateway worker와 함께 여러 선택된 시나리오를 병렬 실행합니다. `qa-channel`은 기본적으로 동시성 4를 사용합니다(선택된 시나리오 수로 제한됨). worker 수를 조정하려면 `--concurrency <count>`를, 이전 직렬 레인을 사용하려면 `--concurrency 1`을 사용하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요하면 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 로컬 AIMock 기반 provider 서버를 시작해, 시나리오 인지형
    `mock-openai` 레인을 대체하지 않으면서 실험적인 fixture 및 프로토콜 mock 커버리지를 제공합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 내부에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/model 선택 플래그를 재사용합니다.
  - live 실행은 게스트에서 실용적인 범위의 지원되는 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 그리고 존재할 경우 `CODEX_HOME`.
  - 출력 디렉터리는 게스트가 마운트된 workspace를 통해 다시 쓸 수 있도록 repo 루트 아래에 있어야 합니다.
  - 일반 QA 보고서 + 요약과 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel 홈서버에 대해 Matrix live QA 레인을 실행합니다.
  - 이 QA 호스트는 현재 repo/dev 전용입니다. 패키징된 OpenClaw 설치에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`도 노출되지 않습니다.
  - repo 체크아웃은 번들된 실행기를 직접 로드하므로 별도의 Plugin 설치 단계가 필요하지 않습니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 하나의 비공개 룸을 프로비저닝한 뒤, 실제 Matrix Plugin을 SUT 전송으로 사용하는 QA gateway 자식 프로세스를 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`을 사용합니다. 다른 이미지를 테스트해야 하면 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix는 로컬에서 일회용 사용자를 프로비저닝하므로 공통 자격 증명 소스 플래그를 노출하지 않습니다.
  - Matrix QA 보고서, 요약, observed-events 아티팩트, 결합 stdout/stderr 출력 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot token을 사용해 실제 비공개 그룹에 대해 Telegram live QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자형 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하고, 풀 lease를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요하면 `--allow-failures`를 사용하세요.
  - 동일한 비공개 그룹 내에 두 개의 서로 다른 bot이 필요하며, SUT bot은 Telegram 사용자명을 노출해야 합니다.
  - 안정적인 bot 간 관찰을 위해 `@BotFather`에서 두 bot 모두에 대해 Bot-to-Bot Communication Mode를 활성화하고, driver bot이 그룹 bot 트래픽을 관찰할 수 있도록 하세요.
  - Telegram QA 보고서, 요약, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다.

live transport 레인은 새 transport가 드리프트하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 여전히 광범위한 합성 QA 스위트이며 live
transport 커버리지 매트릭스의 일부는 아닙니다.

| 레인     | Canary | 멘션 게이팅 | 허용 목록 차단 | 최상위 답장 | 재시작 복구 | 스레드 후속 | 스레드 격리 | 반응 관찰 | 도움말 명령 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex를 통한 공유 Telegram 자격 증명(v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면,
QA lab은 Convex 기반 풀에서 독점 lease를 획득하고, 레인이 실행되는 동안
그 lease에 Heartbeat를 보내며, 종료 시 lease를 해제합니다.

참조 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택된 역할에 맞는 하나의 시크릿:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

관리자용 admin 명령(pool add/remove/list)에는
반드시 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

관리자용 CLI 헬퍼:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

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
- `POST /admin/add`(관리자 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(관리자 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 보호: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(관리자 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind용 payload 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하며, 잘못된 payload는 거부합니다.

### QA에 채널 추가하기

마크다운 QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널용 transport adapter
2. 채널 계약을 검증하는 scenario pack

공유 `qa-lab` 호스트가 흐름을 소유할 수 있는데도 새로운 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- 스위트 시작 및 종료
- worker 동시성
- 아티팩트 기록
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

Runner Plugin은 transport 계약을 소유합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`가 어떻게 마운트되는지
- 해당 transport에 맞게 gateway가 어떻게 구성되는지
- 준비 상태를 어떻게 확인하는지
- 인바운드 이벤트를 어떻게 주입하는지
- 아웃바운드 메시지를 어떻게 관찰하는지
- transcript와 정규화된 transport 상태를 어떻게 노출하는지
- transport 기반 작업을 어떻게 실행하는지
- transport별 리셋 또는 정리를 어떻게 처리하는지

새 채널의 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자는 계속 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 seam에서 transport runner를 구현합니다.
3. transport별 메커니즘은 runner Plugin 또는 채널 harness 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 `openclaw qa <runner>`로 runner를 마운트합니다.
   Runner Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다.
   `runtime-api.ts`는 가볍게 유지하세요. lazy CLI 및 runner 실행은 별도 entrypoint 뒤에 있어야 합니다.
5. 테마화된 `qa/scenarios/` 디렉터리 아래에 마크다운 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 시나리오 헬퍼를 사용합니다.
7. repo가 의도적인 마이그레이션을 수행 중이 아닌 이상 기존 호환성 별칭은 계속 동작하게 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에 한 번만 표현할 수 있다면 `qa-lab`에 넣으세요.
- 동작이 하나의 채널 transport에 의존한다면 해당 runner Plugin 또는 Plugin harness에 유지하세요.
- 시나리오에 둘 이상의 채널이 사용할 수 있는 새 기능이 필요하다면 `suite.ts`에 채널별 분기를 넣는 대신 일반 헬퍼를 추가하세요.
- 동작이 하나의 transport에만 의미가 있다면 시나리오를 transport 전용으로 유지하고, 시나리오 계약에 그 사실을 명시하세요.

새 시나리오에 권장되는 일반 헬퍼 이름은 다음과 같습니다.

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

기존 시나리오용 호환성 별칭도 계속 사용할 수 있습니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에서는 일반 헬퍼 이름을 사용해야 합니다.
호환성 별칭은 플래그 데이 마이그레이션을 피하기 위해 존재하는 것이지,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(무엇이 어디서 실행되는가)

스위트를 “현실성이 점점 높아지는 것”으로 생각하세요(그리고 불안정성/비용도 점점 증가).

### Unit / integration(기본값)

- 명령: `pnpm test`
- 구성: 기존 범위형 Vitest 프로젝트에 대한 10개의 순차 shard 실행(`vitest.full-*.config.ts`)
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`가 다루는 허용된 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - in-process integration 테스트(gateway auth, 라우팅, tooling, 파싱, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
- 프로젝트 참고:
  - 타기팅하지 않은 `pnpm test`는 이제 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 11개의 더 작은 shard config(`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)를 실행합니다. 이렇게 하면 부하가 큰 머신에서 피크 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않게 합니다.
  - `pnpm test --watch`는 다중 shard watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 이제 명시적 파일/디렉터리 대상을 먼저 범위형 레인을 통해 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 지불하지 않습니다.
  - `pnpm test:changed`는 변경된 git 경로가 라우팅 가능한 더 작은 소스/테스트 파일만 건드린 경우 동일한 범위형 레인으로 확장합니다. config/setup 편집은 여전히 넓은 루트 프로젝트 재실행으로 폴백합니다.
  - `pnpm check:changed`는 좁은 작업을 위한 일반적인 스마트 로컬 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, tooling으로 분류한 뒤 일치하는 typecheck/lint/test 레인을 실행합니다. 공개 Plugin SDK 및 plugin-contract 변경은 extension이 그 core 계약에 의존하므로 extension 검증도 포함합니다.
  - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light unit 테스트는 `unit-fast` 레인을 통해 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 런타임이 무거운 파일은 기존 레인에 남습니다.
  - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 changed-mode 실행을 해당 light 레인의 명시적 sibling 테스트로 매핑하므로, helper 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
  - `auto-reply`는 이제 세 개의 전용 버킷을 가집니다: 최상위 core helpers, 최상위 `reply.*` integration 테스트, 그리고 `src/auto-reply/reply/**` 서브트리. 이렇게 하면 가장 무거운 reply harness 작업이 저렴한 status/chunk/token 테스트에 영향을 주지 않습니다.
- 임베디드 실행기 참고:
  - 메시지 도구 discovery 입력 또는 Compaction 런타임 컨텍스트를 변경하는 경우,
    두 수준의 커버리지를 모두 유지하세요.
  - 순수 라우팅/정규화 경계에 대해서는 집중된 helper 회귀 테스트를 추가하세요.
  - 또한 임베디드 실행기 integration 스위트도 건강하게 유지하세요:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - 이 스위트들은 범위형 id와 Compaction 동작이 실제
    `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. helper 전용 테스트만으로는
    이러한 integration 경로를 충분히 대체할 수 없습니다.
- 풀 참고:
  - 기본 Vitest config는 이제 기본적으로 `threads`를 사용합니다.
  - 공유 Vitest config는 또한 `isolate: false`를 고정하고, 루트 프로젝트, e2e, live config 전반에서 비격리 실행기를 사용합니다.
  - 루트 UI 레인은 `jsdom` setup과 optimizer를 유지하지만, 이제 역시 공유 비격리 실행기에서 동작합니다.
  - 각 `pnpm test` shard는 공유 Vitest config에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
  - 공유 `scripts/run-vitest.mjs` launcher는 이제 대규모 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`도 추가합니다. 기본 V8 동작과 비교해야 하면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
- 빠른 로컬 반복 참고:
  - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
  - pre-commit hook은 staged formatting/linting 후 `pnpm check:changed --staged`를 실행하므로, core 전용 커밋은 공개 extension 대상 계약을 건드리지 않는 한 extension 테스트 비용을 지불하지 않습니다.
  - `pnpm test:changed`는 변경 경로가 더 작은 스위트에 깔끔하게 매핑되면 범위형 레인을 통해 라우팅합니다.
  - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅 동작을 유지하며, 더 높은 worker cap만 사용합니다.
  - 로컬 worker 자동 스케일링은 이제 의도적으로 보수적이며, 호스트 load average가 이미 높을 때도 백오프하므로 여러 동시 Vitest 실행이 기본적으로 덜 해롭습니다.
  - 기본 Vitest config는 프로젝트/config 파일을 `forceRerunTriggers`로 표시하여 테스트 wiring이 변경될 때 changed-mode 재실행이 정확하게 유지되도록 합니다.
  - config는 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 계속 활성화합니다. 직접 프로파일링을 위한 명시적 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
- 성능 디버그 참고:
  - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
  - `pnpm test:perf:imports:changed`는 동일한 프로파일링 뷰를 `origin/main` 이후 변경된 파일로 범위를 좁힙니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋 diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS max RSS를 출력합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest config를 통해 라우팅하여 현재 dirty tree를 벤치마크합니다.
  - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
  - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 상태로 unit 스위트의 runner CPU+heap 프로파일을 기록합니다.

### E2E(gateway 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- 런타임 기본값:
  - repo의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 worker를 사용합니다(CI: 최대 2, 로컬: 기본 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행합니다.
- 유용한 재정의:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(최대 16)
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`
- 범위:
  - 다중 인스턴스 gateway 종단 간 동작
  - WebSocket/HTTP 표면, node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - unit 테스트보다 더 많은 가동 요소가 있음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `test/openshell-sandbox.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작
  - 임시 로컬 Dockerfile에서 샌드박스를 생성
  - 실제 `sandbox ssh-config` + SSH exec을 통해 OpenClaw의 OpenShell 백엔드를 검증
  - 샌드박스 fs bridge를 통해 remote-canonical 파일 시스템 동작을 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 동작하는 Docker daemon 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 gateway와 샌드박스를 제거
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리 또는 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live(실제 providers + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`에서 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/model이 _오늘_ 실제 자격 증명으로 실제로 동작하는가?”
  - provider 포맷 변경, tool-calling 특성, auth 이슈, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 provider 정책, 쿼터, 장애)
  - 비용이 들고 rate limit을 사용함
  - “전부”보다는 범위를 좁힌 부분집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소싱합니다.
- 기본적으로 live 실행도 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈에 복사하여 unit fixture가 실제 `~/.openclaw`를 변경하지 못하게 합니다.
- live 테스트가 실제 홈 디렉터리를 사용해야 하는 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가 `~/.profile` 알림을 숨기고 gateway bootstrap 로그/Bonjour chatter를 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(provider별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나, live 전용 재정의로 `OPENCLAW_LIVE_*_KEY`를 사용하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - live 스위트는 이제 진행 라인을 stderr로 출력하므로, Vitest 콘솔 캡처가 조용하더라도 긴 provider 호출이 시각적으로 활성 상태임을 알 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/gateway 진행 라인이 live 실행 중 즉시 스트리밍됩니다.
  - direct-model Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 죽어 있다” / provider별 실패 / tool calling 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## Live: Android node capability 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android node가 현재 광고하는 **모든 명령**을 호출하고 명령 계약 동작을 검증
- 범위:
  - 사전 조건이 있는 수동 setup(스위트는 앱을 설치/실행/페어링하지 않음)
  - 선택된 Android node에 대한 명령별 gateway `node.invoke` 검증
- 필요한 사전 setup:
  - Android 앱이 이미 gateway에 연결되고 페어링되어 있어야 함
  - 앱이 포그라운드 상태로 유지되어야 함
  - 통과를 기대하는 capability에 대한 권한/캡처 동의가 부여되어 있어야 함
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android setup 세부 사항: [Android 앱](/ko/platforms/android)

## Live: 모델 스모크(profile 키)

live 테스트는 실패를 분리할 수 있도록 두 계층으로 나뉩니다.

- “Direct model”은 주어진 키로 provider/model이 최소한 응답할 수 있는지를 알려줍니다.
- “Gateway smoke”는 해당 모델에 대해 전체 gateway+에이전트 파이프라인(session, history, tools, sandbox policy 등)이 동작하는지를 알려줍니다.

### 계층 1: Direct model completion(gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델을 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별로 작은 completion 실행(필요 시 타기팅된 회귀 포함)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정하세요. 그렇지 않으면 `pnpm test:live`가 gateway 스모크에 집중되도록 건너뜁니다.
- 모델 선택 방법:
  - modern 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)을 실행하려면 `OPENCLAW_LIVE_MODELS=modern`
  - `OPENCLAW_LIVE_MODELS=all`은 modern 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`(쉼표 구분 허용 목록)
  - modern/all 스윕은 기본적으로 신호 대비 효율이 높은 엄선된 상한을 사용합니다. exhaustive modern 스윕은 `OPENCLAW_LIVE_MAX_MODELS=0`, 더 작은 상한은 양수 값을 설정하세요.
- provider 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 구분 허용 목록)
- 키 출처:
  - 기본값: profile store와 env 폴백
  - **profile store**만 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 설정
- 존재 이유:
  - “provider API가 깨졌는가 / 키가 유효하지 않은가”와 “gateway 에이전트 파이프라인이 깨졌는가”를 분리
  - 작고 격리된 회귀를 담음(예: OpenAI Responses/Codex Responses reasoning replay + tool-call 흐름)

### 계층 2: Gateway + dev 에이전트 스모크(실제 "@openclaw"가 하는 일)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - in-process gateway를 시작
  - `agent:dev:*` session 생성/patch(실행별 모델 재정의)
  - 키가 있는 모델들을 순회하며 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출이 동작함(read probe)
    - 선택적 추가 도구 probe(exec+read probe)
    - OpenAI 회귀 경로(tool-call-only → follow-up)가 계속 동작함
- probe 세부 사항(실패를 빠르게 설명할 수 있도록):
  - `read` probe: 테스트가 workspace에 nonce 파일을 쓰고, 에이전트에게 이를 `read`하고 nonce를 다시 말하라고 요청합니다.
  - `exec+read` probe: 테스트가 에이전트에게 `exec`로 nonce를 임시 파일에 쓴 뒤, 이를 다시 `read`하라고 요청합니다.
  - image probe: 테스트가 생성된 PNG(고양이 + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환하길 기대합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: modern 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 modern 허용 목록의 별칭
  - 또는 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록) 설정
  - modern/all gateway 스윕은 기본적으로 신호 대비 효율이 높은 엄선된 상한을 사용합니다. exhaustive modern 스윕은 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, 더 작은 상한은 양수 값을 설정하세요.
- provider 선택 방법(“OpenRouter 전부” 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 구분 허용 목록)
- 도구 + image probe는 이 live 테스트에서 항상 활성화됩니다.
  - `read` probe + `exec+read` probe(도구 스트레스)
  - 모델이 이미지 입력 지원을 광고하면 image probe 실행
  - 흐름(고수준):
    - 테스트가 “CAT” + 랜덤 코드가 있는 작은 PNG를 생성(`src/gateway/live-image-probe.ts`)
    - 이를 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 전송
    - Gateway가 첨부 파일을 `images[]`로 파싱(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 임베디드 에이전트가 멀티모달 사용자 메시지를 모델로 전달
    - 검증: 답장에 `cat` + 해당 코드가 포함됨(OCR 허용 오차: 경미한 실수 허용)

팁: 현재 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` id)를 보려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 config를 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + 에이전트 파이프라인을 검증
- 백엔드별 스모크 기본값은 소유 extension의 `cli-backend.ts` 정의와 함께 존재합니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 provider/model: `claude-cli/claude-sonnet-4-6`
  - 명령/인수/image 동작은 소유 CLI 백엔드 Plugin 메타데이터에서 가져옴
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부 파일을 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로는 프롬프트에 주입됨)
  - 프롬프트 주입 대신 이미지 파일 경로를 CLI 인수로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정된 경우 이미지 인수 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 기본 Claude Sonnet -> Opus 동일 session 연속성 probe를 비활성화하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`(선택된 모델이 switch 대상을 지원할 때 강제로 켜려면 `1`)
  
예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-cli-backend
```

단일 provider Docker 레시피:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 실행기는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- repo Docker 이미지 내부에서 비루트 `node` 사용자로 live CLI-backend 스모크를 실행합니다.
- 소유 extension에서 CLI 스모크 메타데이터를 해석한 다음, 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 캐시 가능한 쓰기 가능 prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)에 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`은 `~/.claude/.credentials.json`의 `claudeAiOauth.subscriptionType` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 portable Claude Code subscription OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 검증한 뒤, Anthropic API-key env vars를 유지하지 않은 상태로 두 번의 Gateway CLI-backend 턴을 실행합니다. 이 subscription 레인은 Claude가 현재 일반 subscription 플랜 제한 대신 추가 사용량 청구를 통해 third-party app 사용을 라우팅하므로 기본적으로 Claude MCP/tool 및 image probe를 비활성화합니다.
- live CLI-backend 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 종단 간 흐름을 검증합니다: 텍스트 턴, 이미지 분류 턴, 그다음 gateway CLI를 통해 검증되는 MCP `cron` 도구 호출.
- Claude의 기본 스모크는 session을 Sonnet에서 Opus로 patch하고, 재개된 session이 이전 메모를 여전히 기억하는지도 검증합니다.

## Live: ACP bind 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: live ACP 에이전트와 실제 ACP 대화 바인드 흐름을 검증
  - `/acp spawn <agent> --bind here` 전송
  - 합성 message-channel 대화를 제자리에서 바인드
  - 동일 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인드된 ACP session transcript에 기록되는지 검증
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...`용 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 참고:
  - 이 레인은 admin 전용 합성 originating-route 필드를 가진 gateway `chat.send` 표면을 사용하므로, 테스트가 외부 전달을 가장하지 않고 message-channel 컨텍스트를 첨부할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않으면, 테스트는 선택된 ACP harness 에이전트에 대해 임베디드 `acpx` Plugin의 내장 에이전트 registry를 사용합니다.

예시:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-acp-bind
```

단일 에이전트 Docker 레시피:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 참고:

- Docker 실행기는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 지원되는 모든 live CLI 에이전트(`claude`, `codex`, `gemini`)에 대해 ACP bind 스모크를 순차 실행합니다.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`를 사용하세요.
- `~/.profile`을 소싱하고, 일치하는 CLI auth 자료를 컨테이너에 스테이징한 다음, 쓰기 가능한 npm prefix에 `acpx`를 설치하고, 없으면 요청된 live CLI(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 설치합니다.
- Docker 내부에서 실행기는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하여, 소싱된 profile의 provider env vars를 acpx가 자식 harness CLI에서 계속 사용할 수 있게 합니다.

## Live: Codex app-server harness 스모크

- 목표: 일반 gateway
  `agent` 메서드를 통해 Plugin 소유 Codex harness를 검증
  - 번들된 `codex` Plugin 로드
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택
  - `codex/gpt-5.4`에 첫 번째 gateway agent 턴 전송
  - 동일한 OpenClaw session에 두 번째 턴을 전송하고 app-server
    thread가 재개될 수 있는지 검증
  - 동일한 gateway 명령
    경로를 통해 `/codex status`와 `/codex models` 실행
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `codex/gpt-5.4`
- 선택적 image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 이 스모크는 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 설정하므로,
  Codex harness가 깨져도 PI로 조용히 폴백되어 통과할 수 없습니다.
- 인증: 셸/profile의 `OPENAI_API_KEY`, 그리고 선택적으로 복사된
  `~/.codex/auth.json` 및 `~/.codex/config.toml`

로컬 레시피:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 레시피:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 참고:

- Docker 실행기는 `scripts/test-live-codex-harness-docker.sh`에 있습니다.
- 마운트된 `~/.profile`을 소싱하고, `OPENAI_API_KEY`를 전달하며, 존재할 경우 Codex CLI
  인증 파일을 복사하고, 쓰기 가능한 마운트된 npm
  prefix에 `@openai/codex`를 설치한 뒤, 소스 트리를 스테이징하고, Codex-harness live 테스트만 실행합니다.
- Docker는 기본적으로 image 및 MCP/tool probe를 활성화합니다. 더 좁은 디버그 실행이 필요하면
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`를 설정하세요.
- Docker는 또한 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 export하여, live
  테스트 config와 일치하게 만듭니다. 따라서 `openai-codex/*` 또는 PI 폴백이 Codex harness
  회귀를 숨길 수 없습니다.

### 권장 live 레시피

좁고 명시적인 허용 목록이 가장 빠르고 가장 덜 불안정합니다.

- 단일 모델, direct(gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, gateway 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에 걸친 tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 중심(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth bridge(Cloud Code Assist 스타일 agent 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 로컬 머신의 Gemini CLI를 사용합니다(별도 인증 + tooling 특성).
- Gemini API vs Gemini CLI:
  - API: OpenClaw는 Google의 호스팅된 Gemini API를 HTTP로 호출합니다(API 키 / profile 인증). 대부분의 사용자가 “Gemini”라고 할 때 의미하는 것은 이것입니다.
  - CLI: OpenClaw는 로컬 `gemini` 바이너리를 실행합니다. 자체 인증이 있으며 다르게 동작할 수 있습니다(스트리밍/도구 지원/버전 차이).

## Live: 모델 매트릭스(무엇을 커버하는가)

고정된 “CI 모델 목록”은 없습니다(live는 옵트인입니다). 하지만 키가 있는 개발 머신에서 정기적으로 커버할 것을 **권장하는** 모델은 다음과 같습니다.

### Modern 스모크 세트(tool calling + image)

이것이 우리가 계속 동작하길 기대하는 “일반 모델” 실행입니다.

- OpenAI(non-Codex): `openai/gpt-5.4`(선택 사항: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(오래된 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + image가 포함된 gateway 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: tool calling(Read + 선택적 Exec)

provider 계열별로 최소 하나는 선택하세요.

- OpenAI: `openai/gpt-5.4`(또는 `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview`(또는 `google/gemini-3.1-pro-preview`)
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4`(또는 최신 사용 가능 버전)
- Mistral: `mistral/...`(활성화된 “tools” 가능 모델 하나 선택)
- Cerebras: `cerebras/...`(접근 권한이 있는 경우)
- LM Studio: `lmstudio/...`(로컬, tool calling은 API 모드에 따라 다름)

### Vision: image send(attachment → 멀티모달 메시지)

image probe를 검증하려면 이미지 지원 모델 하나 이상(Claude/Gemini/OpenAI의 vision 지원 변형 등)을 `OPENCLAW_LIVE_GATEWAY_MODELS`에 포함하세요.

### Aggregator / 대체 gateway

키가 활성화되어 있다면 다음을 통한 테스트도 지원합니다.

- OpenRouter: `openrouter/...`(수백 개 모델, tool+image 가능 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen용 `opencode/...`, Go용 `opencode-go/...`(인증은 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

live 매트릭스에 포함할 수 있는 더 많은 provider(자격 증명/config가 있는 경우):

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax`(cloud/API), 그리고 모든 OpenAI/Anthropic 호환 proxy(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려고 하지 마세요. 정식 목록은 현재 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키의 조합입니다.

## 자격 증명(절대 커밋하지 마세요)

live 테스트는 CLI와 동일한 방식으로 자격 증명을 찾습니다. 실질적인 의미는 다음과 같습니다.

- CLI가 동작한다면 live 테스트도 동일한 키를 찾아야 합니다.
- live 테스트가 “자격 증명 없음”이라고 하면, `openclaw models list` / 모델 선택을 디버깅하는 것과 같은 방식으로 디버깅하세요.

- 에이전트별 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(live 테스트에서 “profile keys”가 의미하는 것)
- Config: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/`(존재할 경우 스테이징된 live 홈으로 복사되지만, 메인 profile-key 저장소는 아님)
- 로컬 live 실행은 기본적으로 활성 config, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈에 복사합니다. 스테이징된 live 홈은 `workspace/`와 `sandboxes/`를 건너뛰며, probe가 실제 호스트 workspace를 건드리지 않도록 `agents.*.workspace` / `agentDir` 경로 재정의도 제거합니다.

env 키(예: `~/.profile`에 export된 값)에 의존하려면, 로컬 테스트 전에 `source ~/.profile`을 실행하거나 아래의 Docker 실행기를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram live(오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `src/agents/byteplus.live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy image, video, `music_generate` 경로를 검증
  - `models.providers.comfy.<capability>`가 구성되지 않은 capability는 각각 건너뜀
  - comfy workflow 제출, polling, 다운로드, 또는 Plugin 등록을 변경한 뒤 유용함

## 이미지 생성 live

- 테스트: `src/image-generation/runtime.live.test.ts`
- 명령: `pnpm test:live src/image-generation/runtime.live.test.ts`
- 하니스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 provider Plugin을 열거
  - probe 전에 로그인 셸(`~/.profile`)에서 누락된 provider env vars를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 provider는 건너뜀
  - 공유 런타임 capability를 통해 기본 이미지 생성 변형 실행:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 현재 커버되는 번들 provider:
  - `openai`
  - `google`
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 선택적 인증 동작:
  - profile-store 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 음악 생성 live

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 provider 경로를 검증
  - 현재 Google과 MiniMax를 커버
  - probe 전에 로그인 셸(`~/.profile`)에서 provider env vars를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 provider는 건너뜀
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력을 사용하는 `generate`
    - provider가 `capabilities.edit.enabled`를 선언한 경우의 `edit`
  - 현재 공유 레인 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 별도 Comfy live 파일에서 다루며, 이 공유 스윕에는 포함되지 않음
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 인증 동작:
  - profile-store 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 비디오 생성 live

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 provider 경로를 검증
  - 기본적으로 릴리스 안전 스모크 경로를 사용합니다: 비-FAL provider, provider당 하나의 text-to-video 요청, 1초 길이의 lobster 프롬프트, 그리고 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`(기본값 `180000`)에서 가져오는 provider별 작업 상한
  - provider 측 큐 지연이 릴리스 시간을 지배할 수 있으므로 기본적으로 FAL은 건너뜁니다. 명시적으로 실행하려면 `--video-providers fal` 또는 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하세요
  - probe 전에 로그인 셸(`~/.profile`)에서 provider env vars를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 auth/profile/model이 없는 provider는 건너뜀
  - 기본적으로 `generate`만 실행
  - 사용 가능한 경우 선언된 transform 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 설정:
    - provider가 `capabilities.imageToVideo.enabled`를 선언하고, 선택된 provider/model이 공유 스윕에서 buffer 기반 로컬 이미지 입력을 받아들일 때 `imageToVideo`
    - provider가 `capabilities.videoToVideo.enabled`를 선언하고, 선택된 provider/model이 공유 스윕에서 buffer 기반 로컬 비디오 입력을 받아들일 때 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` provider:
    - `vydra`: 번들된 `veo3`는 텍스트 전용이고, 번들된 `kling`은 원격 이미지 URL이 필요하기 때문
  - provider별 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 `veo3` text-to-video와, 기본적으로 원격 이미지 URL fixture를 사용하는 `kling` 레인을 실행합니다
  - 현재 `videoToVideo` live 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`인 경우에만 `runway`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` provider:
    - `alibaba`, `qwen`, `xai`: 현재 이 경로들이 원격 `http(s)` / MP4 참조 URL을 요구하기 때문
    - `google`: 현재 공유 Gemini/Veo 레인이 로컬 buffer 기반 입력을 사용하며, 이 경로는 공유 스윕에서 허용되지 않기 때문
    - `openai`: 현재 공유 레인에 org별 video inpaint/remix 접근 보장이 없기 때문
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 기본 스윕에 FAL을 포함한 모든 provider를 포함하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 공격적인 스모크 실행을 위해 각 provider 작업 상한을 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - profile-store 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 live 하니스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 이미지, 음악, 비디오 live 스위트를 repo 네이티브 단일 진입점으로 실행
  - 누락된 provider env vars를 `~/.profile`에서 자동 로드
  - 기본적으로 현재 사용 가능한 인증이 있는 provider로 각 스위트 범위를 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 quiet-mode 동작이 일관되게 유지됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 실행기(선택적 “Linux에서 동작함” 확인)

이 Docker 실행기들은 두 가지 버킷으로 나뉩니다.

- Live-model 실행기: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 내부에서 해당하는 profile-key live 파일만 실행합니다(`src/agents/models.profiles.live.test.ts`와 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 config 디렉터리와 workspace를 마운트하고(마운트된 경우 `~/.profile`도 소싱함), 대응하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 실행기는 기본적으로 더 작은 스모크 상한을 사용하므로 전체 Docker 스윕이 실용적으로 유지됩니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 더 큰 exhaustive 스캔을 명시적으로 원할 때는 이 env vars를 재정의하세요.
- `test:docker:all`은 먼저 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 후, 두 개의 live Docker 레인에서 이를 재사용합니다.
- 컨테이너 스모크 실행기: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:plugins`는 하나 이상의 실제 컨테이너를 부팅하고 상위 수준 integration 경로를 검증합니다.

live-model Docker 실행기는 또한 필요한 CLI 인증 홈만 bind-mount하고(또는 실행이 좁혀지지 않은 경우 지원되는 모든 홈을 마운트), 실행 전에 이를 컨테이너 홈으로 복사하여 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 새로 고칠 수 있게 합니다.

- Direct 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP bind 스모크: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness 스모크: `pnpm test:docker:live-codex-harness`(스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev 에이전트: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- Gateway 네트워킹(두 개 컨테이너, WS 인증 + 상태): `pnpm test:docker:gateway-network`(스크립트: `scripts/e2e/gateway-network-docker.sh`)
- MCP 채널 브리지(seed된 Gateway + stdio 브리지 + raw Claude notification-frame 스모크): `pnpm test:docker:mcp-channels`(스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 의미론): `pnpm test:docker:plugins`(스크립트: `scripts/e2e/plugins-docker.sh`)

live-model Docker 실행기는 또한 현재 체크아웃을 읽기 전용으로 bind-mount하고,
컨테이너 내부의 임시 workdir에 이를 스테이징합니다. 이렇게 하면 런타임
이미지는 슬림하게 유지하면서도 정확히 로컬 소스/config에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build`, Gradle 출력 디렉터리 같은
대용량 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로, Docker live 실행이
머신별 아티팩트를 복사하느라 몇 분씩 소비하지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway live probe가 컨테이너 내부에서
실제 Telegram/Discord 등의 채널 worker를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 gateway live 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw gateway 컨테이너를 시작하고,
해당 gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작하고,
Open WebUI를 통해 로그인한 뒤,
`/api/models`가 `openclaw/default`를 노출하는지 검증하고,
그다음 Open WebUI의 `/api/chat/completions` proxy를 통해 실제 채팅 요청을 전송합니다.
첫 실행은 Docker가
Open WebUI 이미지를 가져와야 하거나 Open WebUI 자체의 콜드 스타트 setup을 마쳐야 할 수 있으므로 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 live 모델 키를 기대하며,
Dockerized 실행에서 이를 제공하는 기본 방식은 `OPENCLAW_PROFILE_FILE`
(기본값 `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며,
실제 Telegram, Discord, iMessage 계정이 필요하지 않습니다. seed된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 실행하는 두 번째 컨테이너를 시작한 다음,
실제 stdio MCP 브리지를 통해 라우팅된 대화 탐색, transcript 읽기, attachment 메타데이터,
live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는
특정 클라이언트 SDK가 노출하는 것만이 아니라 브리지가 실제로 방출하는 것을 검증하도록
raw stdio MCP 프레임을 직접 검사합니다.

수동 ACP plain-language thread 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로를 위해 유지하세요. ACP thread 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)를 `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)를 `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)를 `/home/node/.profile`에 마운트하고 테스트 실행 전에 소싱
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`로 `OPENCLAW_PROFILE_FILE`에서 소싱된 env vars만 검증하며, 임시 config/workspace 디렉터리를 사용하고 외부 CLI auth 마운트는 사용하지 않음
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)를 Docker 내부의 캐시된 CLI 설치용 `/home/node/.npm-global`에 마운트
- `$HOME` 아래의 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 뒤, 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 provider 필터링은 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 env가 아닌 profile store에서 오도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI 스모크에서 gateway가 노출할 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크에서 nonce 확인 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 sanity

문서 편집 후에는 문서 검사를 실행하세요: `pnpm check:docs`.
인페이지 heading 검사까지 필요하면 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

실제 provider 없이도 “실제 파이프라인” 회귀를 검증합니다.

- Gateway tool calling(mock OpenAI, 실제 gateway + 에이전트 루프): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, config + auth 강제 쓰기): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 몇 가지 CI 안전 테스트가 있으며, 이는 “에이전트 신뢰성 평가”처럼 동작합니다.

- 실제 gateway + 에이전트 루프를 통한 mock tool-calling(`src/gateway/gateway.test.ts`)
- session wiring과 config 효과를 검증하는 종단 간 마법사 흐름(`src/gateway/gateway.test.ts`)

Skills에 대해 아직 부족한 점은 다음과 같습니다([Skills](/ko/tools/skills) 참고).

- **의사결정:** 프롬프트에 Skills가 나열되었을 때, 에이전트가 올바른 Skill을 선택하는가(또는 관련 없는 Skill을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인수를 따르는가?
- **워크플로 계약:** 도구 순서, session 기록 유지, 샌드박스 경계를 검증하는 multi-turn 시나리오.

향후 평가는 먼저 결정적으로 유지되어야 합니다.

- mock provider를 사용해 tool call + 순서, Skill 파일 읽기, session wiring을 검증하는 시나리오 실행기
- Skill 중심 시나리오의 소규모 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션)
- CI 안전 스위트가 준비된 후에만 선택적으로 live 평가(옵트인, env 게이트)

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin 및 채널이 해당
인터페이스 계약을 준수하는지 검증합니다. 발견된 모든 Plugin을 순회하고
형태 및 동작 검증 모음을 실행합니다. 기본 `pnpm test` unit 레인은 의도적으로
이러한 공유 seam 및 스모크 파일을 건너뜁니다. 공유 채널 또는 provider 표면을 수정했다면
계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- provider 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 Plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 action handler
- **threading** - thread ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### provider 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 위치.

- **status** - 채널 상태 probe
- **registry** - Plugin registry 형태

### provider 계약

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 발견
- **loader** - Plugin 로딩
- **runtime** - provider 런타임
- **shape** - Plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 하위 경로를 변경한 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 발견을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(가이드)

live에서 발견한 provider/model 이슈를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub provider 또는 정확한 요청 형태 변환 캡처)
- 본질적으로 live 전용인 경우(rate limit, auth 정책), live 테스트는 좁고 env var를 통한 옵트인 상태로 유지하세요
- 버그를 잡을 수 있는 가장 작은 계층을 타기팅하는 것을 우선하세요.
  - provider 요청 변환/replay 버그 → direct models 테스트
  - gateway session/history/tool 파이프라인 버그 → gateway live 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별로 샘플 대상 하나를 도출한 뒤, 순회 세그먼트 exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 계열을 추가한다면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 id에서 의도적으로 실패하므로, 새 클래스가 조용히 건너뛰어질 수 없습니다.
