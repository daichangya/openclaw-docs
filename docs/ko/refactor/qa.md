---
read_when:
    - QA 시나리오 정의 또는 qa-lab 하네스 코드 리팩터링하기
    - Markdown 시나리오와 TypeScript 하네스 로직 사이에서 QA 동작 이동하기
summary: 시나리오 카탈로그와 하네스 통합을 위한 QA 리팩터 계획
title: QA 리팩터
x-i18n:
    generated_at: "2026-04-24T06:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

상태: 기반 마이그레이션이 적용되었습니다.

## 목표

OpenClaw QA를 분리된 정의 모델에서 단일 기준 원본으로 옮깁니다:

- 시나리오 메타데이터
- 모델에 보내는 프롬프트
- 설정 및 정리
- 하네스 로직
- 검증 및 성공 기준
- 아티팩트 및 보고 힌트

원하는 최종 상태는 강력한 시나리오 정의 파일을 로드하는 일반적인 QA 하네스이며, 대부분의 동작을 TypeScript에 하드코딩하지 않는 것입니다.

## 현재 상태

이제 기본 기준 원본은 `qa/scenarios/index.md`와
`qa/scenarios/<theme>/*.md` 아래의 시나리오별 파일입니다.

구현된 항목:

- `qa/scenarios/index.md`
  - 정식 QA 팩 메타데이터
  - 운영자 ID
  - 시작 미션
- `qa/scenarios/<theme>/*.md`
  - 시나리오별 Markdown 파일 하나
  - 시나리오 메타데이터
  - 핸들러 바인딩
  - 시나리오별 실행 구성
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown 팩 파서 + zod 검증
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Markdown 팩에서 계획 렌더링
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 생성된 호환성 파일과 `QA_SCENARIOS.md` 시드
- `extensions/qa-lab/src/suite.ts`
  - Markdown 정의 핸들러 바인딩을 통해 실행 가능한 시나리오 선택
- QA 버스 프로토콜 + UI
  - 이미지/비디오/오디오/파일 렌더링용 일반 인라인 첨부 파일

남아 있는 분리 표면:

- `extensions/qa-lab/src/suite.ts`
  - 여전히 대부분의 실행 가능한 커스텀 핸들러 로직을 소유
- `extensions/qa-lab/src/report.ts`
  - 여전히 런타임 출력에서 보고 구조를 파생

즉, 기준 원본 분리는 해결되었지만 실행은 여전히 완전 선언적이기보다 대부분 핸들러 기반입니다.

## 실제 시나리오 표면은 어떤 모습인가

현재 제품군을 보면 몇 가지 서로 다른 시나리오 클래스가 있습니다.

### 단순 상호작용

- 채널 기준선
- DM 기준선
- 스레드 후속 처리
- 모델 전환
- 승인 후속 진행
- reaction/edit/delete

### 구성 및 런타임 변경

- 구성 patch skill 비활성화
- 구성 적용 재시작 wake-up
- 구성 재시작 capability 전환
- 런타임 인벤토리 drift 확인

### 파일 시스템 및 저장소 검증

- source/docs discovery report
- Lobster Invaders 빌드
- 생성된 이미지 아티팩트 lookup

### 메모리 오케스트레이션

- 메모리 recall
- 채널 컨텍스트의 메모리 도구
- 메모리 실패 폴백
- 세션 메모리 랭킹
- 스레드 메모리 격리
- 메모리 Dreaming sweep

### 도구 및 Plugin 통합

- MCP plugin-tools 호출
- skill 가시성
- skill hot install
- 네이티브 이미지 생성
- 이미지 roundtrip
- 첨부 파일에서의 이미지 이해

### 다중 턴 및 다중 액터

- 하위 에이전트 handoff
- 하위 에이전트 fanout synthesis
- 재시작 복구 스타일 흐름

이 범주들이 중요한 이유는 DSL 요구 사항을 결정하기 때문입니다. 프롬프트 + 기대 텍스트의 평면 목록만으로는 충분하지 않습니다.

## 방향

### 단일 기준 원본

`qa/scenarios/index.md`와 `qa/scenarios/<theme>/*.md`를 작성된
기준 원본으로 사용합니다.

팩은 다음을 유지해야 합니다:

- 리뷰에서 사람이 읽기 쉬움
- 머신이 파싱 가능
- 다음을 구동할 만큼 충분히 풍부함:
  - 제품군 실행
  - QA 작업공간 bootstrap
  - QA Lab UI 메타데이터
  - docs/discovery 프롬프트
  - 보고 생성

### 선호하는 작성 형식

최상위 형식은 Markdown으로, 내부에는 구조화된 YAML을 사용합니다.

권장 형태:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider 재정의
  - prerequisites
- 산문 섹션
  - objective
  - notes
  - debugging hints
- fenced YAML 블록
  - setup
  - steps
  - assertions
  - cleanup

이 형식의 장점:

- 거대한 JSON보다 PR 가독성 우수
- 순수 YAML보다 풍부한 컨텍스트
- 엄격한 파싱과 zod 검증

원시 JSON은 중간 생성 형식으로만 허용됩니다.

## 제안된 시나리오 파일 형태

예시:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL이 커버해야 하는 러너 capability

현재 제품군을 기준으로 보면, 일반 러너는 프롬프트 실행 이상의 기능이 필요합니다.

### 환경 및 설정 작업

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### 에이전트 턴 작업

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 구성 및 런타임 작업

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 파일 및 아티팩트 작업

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### 메모리 및 Cron 작업

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 작업

- `mcp.callTool`

### 검증

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 변수와 아티팩트 참조

DSL은 저장된 출력과 이후 참조를 지원해야 합니다.

현재 제품군의 예시:

- 스레드를 만든 뒤 `threadId` 재사용
- 세션을 만든 뒤 `sessionKey` 재사용
- 이미지를 생성한 뒤 다음 턴에서 파일 첨부
- wake marker 문자열을 생성한 뒤 나중에 나타나는지 검증

필요한 capability:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 경로, 세션 키, 스레드 ID, 마커, 도구 출력에 대한 타입 지정 참조

변수 지원이 없으면 하네스는 계속 시나리오 로직을 TypeScript로 다시 새게 만들 것입니다.

## 탈출구로 남겨야 할 것

완전히 순수한 선언적 러너는 1단계에서는 현실적이지 않습니다.

일부 시나리오는 본질적으로 오케스트레이션이 무겁습니다:

- 메모리 Dreaming sweep
- 구성 적용 재시작 wake-up
- 구성 재시작 capability 전환
- 타임스탬프/경로 기반 생성 이미지 아티팩트 확인
- discovery-report 평가

이들은 우선 명시적 커스텀 핸들러를 사용해야 합니다.

권장 규칙:

- 85-90%는 선언적
- 어려운 나머지는 명시적 `customHandler` 단계 사용
- 이름이 있고 문서화된 커스텀 핸들러만 허용
- 시나리오 파일 내 익명 인라인 코드는 금지

이렇게 하면 일반 엔진을 깔끔하게 유지하면서도 진전을 이룰 수 있습니다.

## 아키텍처 변경

### 현재

시나리오 Markdown은 이미 다음의 기준 원본입니다:

- 제품군 실행
- 작업공간 bootstrap 파일
- QA Lab UI 시나리오 카탈로그
- 보고 메타데이터
- discovery 프롬프트

생성된 호환성:

- 시드된 작업공간에는 여전히 `QA_KICKOFF_TASK.md`가 포함됨
- 시드된 작업공간에는 여전히 `QA_SCENARIO_PLAN.md`가 포함됨
- 시드된 작업공간에는 이제 `QA_SCENARIOS.md`도 포함됨

## 리팩터 계획

### 1단계: 로더와 스키마

완료됨.

- `qa/scenarios/index.md` 추가
- 시나리오를 `qa/scenarios/<theme>/*.md`로 분리
- 이름 있는 Markdown YAML 팩 콘텐츠용 파서 추가
- zod로 검증
- 소비자를 파싱된 팩으로 전환
- 저장소 수준 `qa/seed-scenarios.json` 및 `qa/QA_KICKOFF_TASK.md` 제거

### 2단계: 일반 엔진

- `extensions/qa-lab/src/suite.ts`를 다음으로 분리:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 기존 헬퍼 함수를 엔진 작업으로 유지

산출물:

- 엔진이 단순 선언적 시나리오를 실행함

프롬프트 + 대기 + 검증이 대부분인 시나리오부터 시작:

- threaded follow-up
- 첨부 파일에서의 이미지 이해
- skill 가시성과 호출
- channel baseline

산출물:

- 일반 엔진을 통해 실제 Markdown 정의 시나리오가 처음 출하됨

### 4단계: 중간 난이도 시나리오 마이그레이션

- image generation roundtrip
- 채널 컨텍스트의 메모리 도구
- 세션 메모리 랭킹
- 하위 에이전트 handoff
- 하위 에이전트 fanout synthesis

산출물:

- 변수, 아티팩트, 도구 검증, 요청 로그 검증이 입증됨

### 5단계: 어려운 시나리오는 커스텀 핸들러에 유지

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

산출물:

- 동일한 작성 형식 유지, 단 필요한 경우 명시적 custom-step 블록 사용

### 6단계: 하드코딩된 시나리오 맵 삭제

팩 커버리지가 충분히 좋아지면:

- `extensions/qa-lab/src/suite.ts`의 대부분의 시나리오별 TypeScript 분기를 제거

## 가짜 Slack / 리치 미디어 지원

현재 QA 버스는 텍스트 우선입니다.

관련 파일:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

현재 QA 버스가 지원하는 것:

- text
- reactions
- threads

아직 인라인 미디어 첨부 파일은 모델링하지 않습니다.

### 필요한 전송 계약

일반 QA 버스 첨부 파일 모델 추가:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

그다음 `attachments?: QaBusAttachment[]`를 다음에 추가:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 왜 먼저 일반화해야 하는가

Slack 전용 미디어 모델을 만들지 마세요.

대신:

- 하나의 일반 QA 전송 모델
- 그 위에 여러 렌더러
  - 현재 QA Lab 채팅
  - 미래의 가짜 Slack 웹
  - 기타 가짜 전송 뷰

이렇게 하면 로직 중복을 방지하고 미디어 시나리오를 전송 비종속적으로 유지할 수 있습니다.

### 필요한 UI 작업

QA UI가 다음을 렌더링하도록 업데이트:

- 인라인 이미지 프리뷰
- 인라인 오디오 플레이어
- 인라인 비디오 플레이어
- 파일 첨부 칩

현재 UI는 이미 스레드와 reaction을 렌더링할 수 있으므로, 첨부 파일 렌더링은 동일한 메시지 카드 모델 위에 추가될 수 있어야 합니다.

### 미디어 전송으로 가능해지는 시나리오 작업

첨부 파일이 QA 버스를 통해 흐르기 시작하면, 더 풍부한 가짜 채팅 시나리오를 추가할 수 있습니다:

- 가짜 Slack의 인라인 이미지 응답
- 오디오 첨부 파일 이해
- 비디오 첨부 파일 이해
- 혼합 첨부 파일 순서
- 미디어가 유지된 스레드 응답

## 권장 사항

다음 구현 덩어리는 다음이어야 합니다:

1. Markdown 시나리오 로더 + zod 스키마 추가
2. 현재 카탈로그를 Markdown에서 생성
3. 몇 개의 단순 시나리오를 먼저 마이그레이션
4. 일반 QA 버스 첨부 파일 지원 추가
5. QA UI에서 인라인 이미지 렌더링
6. 그다음 오디오와 비디오로 확장

이것이 두 목표를 모두 입증하는 가장 작은 경로입니다:

- 일반 Markdown 정의 QA
- 더 풍부한 가짜 메시징 표면

## 열린 질문

- 시나리오 파일이 변수 보간이 있는 내장 Markdown 프롬프트 템플릿을 허용해야 하는지
- setup/cleanup가 이름 있는 섹션이어야 하는지, 아니면 단순한 순서형 작업 목록이면 되는지
- 아티팩트 참조를 스키마에서 강하게 타입 지정해야 하는지, 아니면 문자열 기반으로 해야 하는지
- 커스텀 핸들러가 하나의 registry에 있어야 하는지, 아니면 표면별 registry에 있어야 하는지
- 생성된 JSON 호환성 파일을 마이그레이션 중에도 계속 체크인 상태로 유지해야 하는지

## 관련

- [QA 엔드 투 엔드 자동화](/ko/concepts/qa-e2e-automation)
