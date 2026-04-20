---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-20T06:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 리액션, 수정, 삭제 표면을 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 대화 내용을 관찰하고, 인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기본 QA 시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2패널 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack와 유사한 대화 내용과 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway 레인을 시작하며, 운영자나 자동화 루프가 에이전트에 QA 미션을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했고 실패했으며 계속 막혀 있었는지를 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면, bind-mounted QA Lab 번들로 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 미리 빌드된 이미지로 Docker 서비스를 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 bind-mount합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

전송 계층이 실제인 Matrix 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa matrix
```

이 레인은 Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 드라이버, SUT, 옵저버 사용자를 등록하며, 하나의 비공개 방을 생성한 뒤, QA gateway 하위 프로세스 안에서 실제 Matrix Plugin을 실행합니다. 라이브 전송 레인은 테스트 중인 전송 계층에 맞게 하위 config 범위를 유지하므로, Matrix는 하위 config에서 `qa-channel` 없이 실행됩니다. 이 레인은 구조화된 보고서 아티팩트와 stdout/stderr 통합 로그를 선택한 Matrix QA 출력 디렉터리에 기록합니다. 외부 `scripts/run-node.mjs` 빌드/런처 출력까지 함께 수집하려면 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>`를 리포지토리 로컬 로그 파일로 설정하세요.

전송 계층이 실제인 Telegram 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa telegram
```

이 레인은 일회용 서버를 프로비저닝하는 대신 하나의 실제 비공개 Telegram 그룹을 대상으로 합니다. `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며, 같은 비공개 그룹에 서로 다른 두 개의 봇이 있어야 합니다. SUT 봇은 Telegram 사용자 이름을 가져야 하며, 두 봇 모두 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화했을 때 봇 간 관찰이 가장 잘 동작합니다.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트만 원한다면 `--allow-failures`를 사용하세요.

이제 라이브 전송 레인은 각자 자체 시나리오 목록 구조를 만드는 대신 하나의 더 작은 계약을 공유합니다:

`qa-channel`은 여전히 폭넓은 합성 제품 동작 스위트이며 라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | Canary | 멘션 게이팅 | 허용 목록 차단 | 최상위 답글 | 재시작 복구 | 스레드 후속 응답 | 스레드 격리 | 리액션 관찰 | 도움말 명령 |
| -------- | ------ | ----------- | --------------- | ----------- | ----------- | ---------------- | ----------- | ----------- | ------------ |
| Matrix   | x      | x           | x               | x           | x           | x                | x           | x           |              |
| Telegram | x      |             |                 |             |             |                  |             |             | x            |

이렇게 하면 `qa-channel`은 폭넓은 제품 동작 스위트로 유지되고, Matrix, Telegram 및 향후 라이브 전송 계층은 하나의 명시적인 전송 계약 체크리스트를 공유하게 됩니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 뒤, 일반적인 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
시나리오 선택 동작은 호스트에서의 `qa suite`와 동일하게 재사용합니다.
호스트 및 Multipass 스위트 실행은 기본적으로 격리된 gateway 워커와 함께 여러 개의 선택된 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시성은 4이며, 선택된 시나리오 수를 상한으로 합니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행하려면 `--concurrency 1`을 사용하세요.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트만 원한다면 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에 실용적으로 전달 가능한 지원 QA 인증 입력을 전달합니다: env 기반 provider 키, QA 라이브 provider config 경로, 그리고 존재할 경우 `CODEX_HOME`입니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 두세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이 파일들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다.

`qa-lab`은 일반적인 markdown 러너로 유지되어야 합니다. 각 시나리오 markdown 파일은 한 번의 테스트 실행에 대한 기준 정보여야 하며 다음을 정의해야 합니다:

- 시나리오 메타데이터
- 선택적 category, capability, lane, risk 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구사항
- 선택적 gateway config 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 일반적이고 여러 영역을 가로지르는 형태로 유지될 수 있습니다. 예를 들어, markdown 시나리오는 특수한 러너를 추가하지 않고도 Gateway `browser.request` seam을 통해 내장된 Control UI를 구동하는 브라우저 측 헬퍼와 전송 측 헬퍼를 조합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 capability별로 그룹화해야 합니다. 파일이 이동하더라도 시나리오 ID는 안정적으로 유지하고, 구현 추적 가능성을 위해 `docsRefs`와 `codeRefs`를 사용하세요.

기본 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 handoff
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders와 같은 작은 빌드 작업 하나

## Provider mock 레인

`qa suite`에는 두 개의 로컬 provider mock 레인이 있습니다:

- `mock-openai`는 시나리오 인지형 OpenClaw mock입니다. 리포지토리 기반 QA 및 동등성 게이트를 위한 기본 결정론적 mock 레인으로 유지됩니다.
- `aimock`은 실험적인 프로토콜, 픽스처, record/replay, chaos 커버리지를 위해 AIMock 기반 provider 서버를 시작합니다. 이는 추가적인 옵션이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

provider 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다. 각 provider는 자체 기본값, 로컬 서버 시작, gateway 모델 config, auth-profile 스테이징 필요 사항, 라이브/mock capability 플래그를 소유합니다. 공유 스위트와 gateway 코드는 provider 이름으로 분기하는 대신 provider 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 markdown QA 시나리오를 위한 일반적인 전송 seam을 소유합니다.
`qa-channel`은 그 seam 위의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송 전용 QA 러너를 추가하는 대신 같은 스위트 러너에 연결되어야 합니다.

아키텍처 수준에서의 분리는 다음과 같습니다:

- `qa-lab`은 일반적인 시나리오 실행, 워커 동시성, 아티팩트 기록, 보고를 소유합니다.
- 전송 어댑터는 gateway config, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 액션, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 markdown 시나리오 파일이 테스트 실행을 정의하며, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

새 채널 어댑터를 위한 유지관리자용 도입 가이드는
[Testing](/ko/help/testing#adding-a-channel-to-qa)에 있습니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음 질문에 답해야 합니다:

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

문체 및 스타일 검사를 위해, 같은 시나리오를 여러 라이브 모델 ref에 걸쳐 실행하고 평가된 Markdown 보고서를 작성하세요:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

이 명령은 Docker가 아니라 로컬 QA gateway 하위 프로세스를 실행합니다. character eval 시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅, 워크스페이스 도움말, 작은 파일 작업과 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 자신이 평가 중이라는 사실을 알려주면 안 됩니다. 이 명령은 각 전체 대화 내용을 보존하고, 기본 실행 통계를 기록한 다음, judge 모델에게 fast 모드와 `xhigh` 추론으로 실행 결과를 자연스러움, 분위기, 유머 기준으로 순위를 매기도록 요청합니다.
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. judge 프롬프트는 여전히 모든 대화 내용과 실행 상태를 받지만, 후보 ref는 `candidate-01`과 같은 중립적인 라벨로 대체되며, 보고서는 파싱 후 순위를 실제 ref로 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, 이를 지원하는 OpenAI 모델은 `xhigh`를 사용합니다. 특정 후보를 인라인으로 재정의하려면 `--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히 전역 기본값을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식도 호환성을 위해 유지됩니다.
OpenAI 후보 ref는 provider가 지원하는 경우 우선순위 처리를 사용하도록 기본적으로 fast 모드를 사용합니다. 특정 후보나 judge에 대해 재정의가 필요하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에 fast 모드를 강제로 켜려는 경우에만 `--fast`를 전달하세요. 후보 및 judge 실행 시간은 벤치마크 분석을 위해 보고서에 기록되지만, judge 프롬프트에는 속도로 순위를 매기지 말라고 명시되어 있습니다.
후보 및 judge 모델 실행은 둘 다 기본적으로 동시성 16을 사용합니다. provider 제한이나 로컬 gateway 부하로 인해 실행이 너무 불안정해지면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 character eval은 기본적으로 `openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`,
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`이 전달되지 않으면 judge는 기본적으로
`openai/gpt-5.4,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [Testing](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [Dashboard](/web/dashboard)
