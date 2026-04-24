---
read_when:
    - provider 런타임 훅, 채널 수명 주기 또는 package pack 구현하기
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅하기
    - 새 Plugin capability 또는 context engine Plugin 추가하기
summary: 'Plugin 아키텍처 내부: 로드 파이프라인, 레지스트리, 런타임 훅, HTTP 라우트, 참조 표'
title: Plugin 아키텍처 내부
x-i18n:
    generated_at: "2026-04-24T06:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

공개 capability 모델, Plugin 형태, 소유권/실행 계약은 [Plugin architecture](/ko/plugins/architecture)를 참조하세요. 이 페이지는
내부 메커니즘의 참조 문서입니다: 로드 파이프라인, 레지스트리, 런타임 훅,
Gateway HTTP 라우트, import 경로, 스키마 표를 다룹니다.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 plugin 루트를 검색
2. 네이티브 또는 호환 번들 manifest와 package 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. plugin config 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈 로드: 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   빌드되지 않은 네이티브 plugin은 jiti를 사용
7. 네이티브 `register(api)` 훅을 호출하고 등록 항목을 plugin registry에 수집
8. 명령/런타임 표면에 registry 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 쪽(`def.register ?? def.activate`)을 해석하여 같은 시점에 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 사용하세요.
</Note>

안전성 게이트는 런타임 실행 **이전**에 발생합니다. 다음 경우 후보가 차단됩니다:
엔트리가 plugin 루트 밖으로 벗어나는 경우, 경로가 world-writable인 경우, 또는
번들되지 않은 plugin에 대해 경로 소유권이 의심스러워 보이는 경우입니다.

### Manifest 우선 동작

manifest는 제어 평면의 기준 정보입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- plugin 식별
- 선언된 channels/Skills/config 스키마 또는 번들 capability 검색
- `plugins.entries.<id>.config` 검증
- Control UI 레이블/placeholder 보강
- 설치/카탈로그 메타데이터 표시
- plugin 런타임을 로드하지 않고도 가벼운 활성화 및 설정 descriptor 유지

네이티브 Plugin의 경우 런타임 모듈이 데이터 평면 부분입니다. 여기서
훅, 도구, 명령, provider 흐름 같은 실제 동작을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 제어 평면에 남습니다.
이들은 활성화 계획 및 설정 검색을 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 실제 활성화 소비자는 이제 manifest의 command, channel, provider 힌트를 사용해
더 넓은 registry 구체화 전에 plugin 로딩 범위를 좁힙니다.

- CLI 로딩은 요청된 기본 명령을 소유한 plugin으로 범위를 좁힙니다.
- channel setup/plugin 해석은 요청된
  channel id를 소유한 plugin으로 범위를 좁힙니다.
- 명시적 provider setup/runtime 해석은 요청된
  provider id를 소유한 plugin으로 범위를 좁힙니다.

활성화 플래너는 기존 호출자를 위한 ids-only API와
새 진단을 위한 plan API를 모두 제공합니다. Plan 항목은 plugin이 선택된 이유를 보고하며,
명시적 `activation.*` 플래너 힌트와 `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, 훅 같은 manifest 소유권 폴백을 구분합니다. 이 이유 구분이
호환성 경계입니다. 기존 plugin 메타데이터는 계속 동작하고, 새 코드는
런타임 로딩 시맨틱을 바꾸지 않고도 광범위한 힌트나 폴백 동작을 감지할 수 있습니다.

이제 setup 검색은 먼저 `setup.providers` 및
`setup.cliBackends` 같은 descriptor 소유 id를 우선 사용해 후보 plugin 범위를 좁힌 뒤,
여전히 setup 시점 런타임 훅이 필요한 plugin에 대해서만 `setup-api`로 폴백합니다.
검색된 plugin이 동일한 정규화된 setup provider 또는 CLI backend id를 둘 이상 주장하면,
setup 조회는 검색 순서에 의존하지 않고 그 모호한 소유자를 거부합니다.

### 로더가 캐시하는 항목

OpenClaw는 프로세스 내부에 다음에 대한 짧은 캐시를 유지합니다.

- 검색 결과
- manifest registry 데이터
- 로드된 plugin registry

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄입니다. 이를
영속 저장소가 아닌 수명이 짧은 성능 캐시로 이해하면 됩니다.

성능 참고:

- 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 기간은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정할 수 있습니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역 상태를 직접 변경하지 않습니다. 대신
중앙 plugin registry에 등록합니다.

registry는 다음을 추적합니다.

- plugin 레코드(식별성, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅 및 타입 지정 훅
- channels
- providers
- gateway RPC 핸들러
- HTTP 라우트
- CLI registrar
- 백그라운드 서비스
- plugin 소유 명령

그런 다음 코어 기능은 plugin 모듈과 직접 통신하지 않고 이 registry를 읽습니다.
이렇게 하면 로딩 방향이 한쪽으로 유지됩니다.

- plugin 모듈 -> registry 등록
- 코어 런타임 -> registry 소비

이 분리는 유지보수성에 중요합니다. 대부분의 코어 표면이
"모든 plugin 모듈을 특수 처리"가 아니라 "registry 읽기"라는
하나의 통합 지점만 필요하게 해주기 때문입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인 해결 시 반응할 수 있습니다.

승인되거나 거부된 후 바인드 요청에 대한 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이 plugin + conversation에 대한 바인딩이 이제 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬의 대기 상태를 정리합니다.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대한 해결된 바인딩
- `request`: 원래 요청 요약, detach 힌트, sender id,
  conversation 메타데이터

이 콜백은 알림 전용입니다. 대화 바인딩 허용 대상을 바꾸지 않으며,
코어 승인 처리가 끝난 뒤 실행됩니다.

## provider 런타임 훅

provider Plugin에는 세 가지 계층이 있습니다.

- 런타임 이전의 가벼운 조회를 위한 **manifest 메타데이터**:
  `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`
- **config 시점 훅**: `catalog`(레거시 `discovery`) 및
  `applyConfigDefaults`
- **런타임 훅**: 인증, 모델 해석,
  스트림 래핑, thinking 수준, replay 정책, 사용량 엔드포인트를 다루는 40개 이상의 선택적 훅. 전체 목록은
  [훅 순서 및 사용법](#hook-order-and-usage)을 참조하세요.

OpenClaw는 여전히 일반 에이전트 루프, failover, transcript 처리,
도구 정책을 담당합니다. 이 훅은 전체 사용자 지정 추론 transport 없이도
provider별 동작을 확장할 수 있는 표면입니다.

provider가 런타임을 로드하지 않고도 일반 인증/상태/모델 선택기 경로에서 볼 수 있어야 하는
환경 기반 자격 증명이 있다면 manifest `providerAuthEnvVars`를 사용하세요.
하나의 provider id가 다른 provider id의 env var, 인증 프로필, config 기반 인증,
API 키 온보딩 선택을 재사용해야 한다면 manifest `providerAuthAliases`를 사용하세요.
온보딩/인증 선택 CLI 표면이 provider 런타임을 로드하지 않고도 provider의 선택 id,
그룹 레이블, 단순한 단일 플래그 인증 연결을 알아야 한다면 manifest `providerAuthChoices`를 사용하세요.
provider 런타임의 `envVars`는 온보딩 레이블이나 OAuth
client-id/client-secret 설정 변수 같은 운영자 대상 힌트에 유지하세요.

channel에 런타임을 로드하지 않고도 일반 shell-env 폴백, config/status 검사,
setup 프롬프트가 확인해야 하는 env 기반 인증 또는 설정이 있다면
manifest `channelEnvVars`를 사용하세요.

### 훅 순서 및 사용법

모델/provider Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"사용 시점" 열은 빠른 판단 가이드입니다.

| #   | Hook                              | 기능                                                                                                           | 사용 시점                                                                                                                                    |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 provider config를 게시                                             | provider가 카탈로그 또는 기본 base URL을 소유할 때                                                                                            |
| 2   | `applyConfigDefaults`             | config materialization 중 provider 소유의 전역 config 기본값 적용                                             | 기본값이 인증 모드, env, 또는 provider 모델 계열 시맨틱에 따라 달라질 때                                                                    |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 registry/catalog 경로를 시도함                                                           | _(Plugin hook 아님)_                                                                                                                         |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 프리뷰 model-id 별칭 정규화                                                             | provider가 정식 모델 해석 전에 별칭 정리를 소유할 때                                                                                         |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열의 `api` / `baseUrl` 정규화                                                  | provider가 동일 transport 계열 내의 사용자 지정 provider id에 대한 transport 정리를 소유할 때                                                |
| 5   | `normalizeConfig`                 | 런타임/provider 해석 전에 `models.providers.<id>` 정규화                                                      | provider에 Plugin과 함께 있어야 하는 config 정리가 필요할 때. 번들된 Google 계열 도우미는 지원되는 Google config 엔트리도 보조 처리함      |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 streaming-usage 호환성 재작성 적용                                                 | provider에 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요할 때                                                              |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로딩 전에 config provider의 env-marker 인증 해석                                                  | provider가 provider 소유의 env-marker API 키 해석을 가질 때. `amazon-bedrock`도 여기서 내장 AWS env-marker resolver를 가짐                 |
| 8   | `resolveSyntheticAuth`            | 평문을 저장하지 않고 로컬/셀프 호스팅 또는 config 기반 인증 노출                                              | provider가 합성/로컬 자격 증명 마커로 동작할 수 있을 때                                                                                      |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 인증 프로필 오버레이. 기본 `persistence`는 CLI/app 소유 자격 증명에 대해 `runtime-only` | provider가 복사된 refresh token을 저장하지 않고 외부 인증 자격 증명을 재사용할 때. manifest에 `contracts.externalAuthProviders`를 선언     |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 합성 프로필 placeholder의 우선순위를 env/config 기반 인증보다 낮춤                                     | provider가 우선순위를 가져가면 안 되는 합성 placeholder 프로필을 저장할 때                                                                   |
| 11  | `resolveDynamicModel`             | 아직 로컬 registry에 없는 provider 소유 model id에 대한 동기 폴백                                             | provider가 임의의 업스트림 model id를 허용할 때                                                                                              |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행                                                            | provider가 알 수 없는 id를 해석하기 전에 네트워크 메타데이터가 필요할 때                                                                     |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 해석된 모델을 사용하기 전 최종 재작성                                                         | provider에 transport 재작성이 필요하지만 여전히 코어 transport를 사용할 때                                                                    |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 transport 뒤에 있는 vendor 모델에 대한 호환성 플래그 제공                                           | provider가 provider를 인수하지 않고도 프록시 transport에서 자체 모델을 인식할 때                                                             |
| 15  | `capabilities`                    | 공유 코어 로직이 사용하는 provider 소유 transcript/tooling 메타데이터                                         | provider에 transcript/provider 계열 특이사항이 필요할 때                                                                                     |
| 16  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마 정규화                                                                  | provider에 transport 계열 스키마 정리가 필요할 때                                                                                            |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 진단 노출                                                                      | 코어에 provider별 규칙을 가르치지 않고 provider가 키워드 경고를 제공하려 할 때                                                               |
| 18  | `resolveReasoningOutputMode`      | 네이티브 대 태그 기반 reasoning-output 계약 선택                                                              | provider에 네이티브 필드 대신 태그 기반 reasoning/final output이 필요할 때                                                                   |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                                               | provider에 기본 요청 매개변수 또는 provider별 매개변수 정리가 필요할 때                                                                      |
| 20  | `createStreamFn`                  | 사용자 지정 transport로 일반 스트림 경로를 완전히 대체                                                       | provider에 단순 래퍼가 아닌 사용자 지정 wire protocol이 필요할 때                                                                             |
| 21  | `wrapStreamFn`                    | 일반 래퍼가 적용된 후 스트림 래퍼                                                                             | provider에 사용자 지정 transport 없이 요청 헤더/본문/모델 호환성 래퍼가 필요할 때                                                            |
| 22  | `resolveTransportTurnState`       | 네이티브 turn별 transport 헤더 또는 메타데이터 첨부                                                          | provider가 일반 transport가 provider 네이티브 turn identity를 보내도록 하려 할 때                                                           |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 cool-down 정책 첨부                                                        | provider가 일반 WS transport의 세션 헤더 또는 폴백 정책을 조정하려 할 때                                                                     |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 프로필이 런타임 `apiKey` 문자열이 됨                                           | provider가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요할 때                                                          |
| 25  | `refreshOAuth`                    | 사용자 지정 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                            | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                              |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                      | provider에 refresh 실패 후 provider 소유 인증 복구 안내가 필요할 때                                                                           |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 창 초과 매처                                                                           | provider에 일반 휴리스틱이 놓치는 원시 overflow 오류가 있을 때                                                                                |
| 28  | `classifyFailoverReason`          | provider 소유 failover 사유 분류                                                                              | provider가 원시 API/transport 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                            |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider를 위한 프롬프트 캐시 정책                                                                | provider에 프록시별 캐시 TTL 게이팅이 필요할 때                                                                                               |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지 대체                                                                            | provider에 provider별 missing-auth 복구 힌트가 필요할 때                                                                                      |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김과 선택적 사용자 대상 오류 힌트                                                      | provider가 오래된 업스트림 행을 숨기거나 vendor 힌트로 대체해야 할 때                                                                         |
| 32  | `augmentModelCatalog`             | 검색 후 추가되는 합성/최종 카탈로그 행                                                                        | provider에 `models list`와 선택기에서 사용할 합성 forward-compat 행이 필요할 때                                                              |
| 33  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 레이블, 기본값                                                                | provider가 선택된 모델에 대해 사용자 지정 thinking 단계 또는 이진 레이블을 제공할 때                                                         |
| 34  | `isBinaryThinking`                | 켜짐/꺼짐 reasoning 토글 호환성 훅                                                                            | provider가 이진 thinking on/off만 노출할 때                                                                                                   |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning 지원 호환성 훅                                                                              | provider가 모델 일부에서만 `xhigh`를 제공하려 할 때                                                                                           |
| 36  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 훅                                                                                  | provider가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                         |
| 37  | `isModernModelRef`      | 라이브 프로필 필터 및 스모크 선택을 위한 modern-model 매처                         | provider가 라이브/스모크 선호 모델 매칭을 소유할 때                                    |
| 38  | `prepareRuntimeAuth`    | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                         | provider에 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요할 때                       |
| 39  | `resolveUsageAuth`      | `/usage` 및 관련 상태 표면을 위한 사용량/청구 자격 증명 해석                      | provider에 사용자 지정 사용량/쿼터 토큰 파싱 또는 다른 사용량 자격 증명이 필요할 때   |
| 40  | `fetchUsageSnapshot`    | 인증 해석 후 provider별 사용량/쿼터 스냅샷 가져오기 및 정규화                     | provider에 provider별 usage 엔드포인트 또는 페이로드 파서가 필요할 때                  |
| 41  | `createEmbeddingProvider` | memory/search를 위한 provider 소유 임베딩 어댑터 생성                           | memory 임베딩 동작이 provider Plugin에 속할 때                                         |
| 42  | `buildReplayPolicy`     | provider의 transcript 처리를 제어하는 replay 정책 반환                           | provider에 사용자 지정 transcript 정책(예: thinking 블록 제거)이 필요할 때             |
| 43  | `sanitizeReplayHistory` | 일반 transcript 정리 후 replay 기록 재작성                                       | provider에 공유 Compaction 도우미를 넘는 provider별 replay 재작성이 필요할 때          |
| 44  | `validateReplayTurns`   | 임베디드 러너 이전의 최종 replay turn 검증 또는 형태 재구성                      | provider transport에 일반 정리 후 더 엄격한 turn 검증이 필요할 때                      |
| 45  | `onModelSelected`       | 모델 선택 후 provider 소유 후속 효과 실행                                        | 모델이 활성화될 때 provider에 텔레메트리 또는 provider 소유 상태가 필요할 때           |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치하는 provider Plugin을 확인한 다음, model id 또는 transport/config를
실제로 변경하는 훅을 찾을 때까지 다른 hook-capable provider Plugin으로 폴백합니다. 이렇게 하면
호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이
별칭/호환 provider shim이 계속 동작할 수 있습니다. 어떤 provider 훅도
지원되는 Google 계열 config 엔트리를 재작성하지 않으면, 번들된 Google config normalizer가
여전히 해당 호환성 정리를 적용합니다.

provider에 완전히 사용자 지정 wire protocol 또는 사용자 지정 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 훅들은
여전히 OpenClaw의 일반 추론 루프 위에서 실행되는 provider 동작을 위한 것입니다.

### Provider 예시

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 내장 예시

번들된 provider Plugin은 위 훅들을 조합해 각 벤더의 catalog,
인증, thinking, replay, usage 요구 사항에 맞춥니다. 권위 있는 훅 집합은
`extensions/` 아래 각 Plugin과 함께 존재하며, 이 페이지는
목록을 그대로 복제하기보다 형태를 설명합니다.

<AccordionGroup>
  <Accordion title="패스스루 catalog provider">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의 정적 catalog보다
    먼저 업스트림 model id를 노출할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 usage 엔드포인트 provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`과 함께 사용하여 토큰 교환과 `/usage` 통합을 담당합니다.
  </Accordion>
  <Accordion title="Replay 및 transcript 정리 계열">
    공유 명명 계열(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)은 각 Plugin이
    정리 로직을 다시 구현하는 대신 `buildReplayPolicy`를 통해 transcript 정책을
    선택할 수 있게 합니다.
  </Accordion>
  <Accordion title="catalog 전용 provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`,
    `volcengine`은 `catalog`만 등록하고 공유 추론 루프를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 스트림 도우미">
    베타 헤더, `/fast` / `serviceTier`, `context1m`은
    일반 SDK가 아니라 Anthropic Plugin의 공개 `api.ts` / `contract-api.ts` 경계
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) 내부에 존재합니다.
  </Accordion>
</AccordionGroup>

## 런타임 도우미

Plugin은 `api.runtime`를 통해 선택된 코어 도우미에 접근할 수 있습니다. TTS의 경우:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

참고:

- `textToSpeech`는 파일/음성 노트 표면에 대한 일반 코어 TTS 출력 페이로드를 반환합니다.
- 코어 `messages.tts` config 및 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + sample rate를 반환합니다. Plugin은 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별 선택 사항입니다. 벤더 소유 음성 선택기나 setup 흐름에 사용하세요.
- 음성 목록에는 provider 인식 선택기를 위한 locale, gender, personality 태그 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 telephony를 지원하는 것은 OpenAI와 ElevenLabs입니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 speech provider를 등록할 수도 있습니다.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

참고:

- TTS 정책, 폴백, 응답 전달은 코어에 유지하세요.
- 벤더 소유 합성 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. OpenClaw가 해당 capability 계약을 추가함에 따라
  하나의 벤더 Plugin이 텍스트, 음성, 이미지, 향후 미디어 provider를 함께 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우 Plugin은 일반 key/value bag 대신
하나의 타입 지정된 media-understanding provider를 등록합니다.

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

참고:

- 오케스트레이션, 폴백, config, channel 연결은 코어에 유지하세요.
- 벤더 동작은 provider Plugin에 유지하세요.
- 점진적 확장은 타입이 유지되어야 합니다: 새로운 선택적 메서드, 새로운 선택적
  결과 필드, 새로운 선택적 capability.
- 비디오 생성도 이미 같은 패턴을 따릅니다.
  - 코어가 capability 계약과 런타임 도우미를 소유
  - 벤더 Plugin이 `api.registerVideoGenerationProvider(...)`를 등록
  - 기능/channel Plugin이 `api.runtime.videoGeneration.*`를 소비

media-understanding 런타임 도우미의 경우 Plugin은 다음을 호출할 수 있습니다.

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

오디오 전사의 경우 Plugin은 media-understanding 런타임이나
이전 STT 별칭 둘 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME을 안정적으로 추론할 수 없을 때 선택 사항:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는 이미지/오디오/비디오 이해를 위한
  선호되는 공유 표면입니다.
- 코어 media-understanding 오디오 config(`tools.media.audio`)와 provider 폴백 순서를 사용합니다.
- 전사 출력이 생성되지 않으면 `{ text: undefined }`를 반환합니다
  (예: 입력이 건너뛰어졌거나 지원되지 않는 경우).
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 계속 남아 있습니다.

Plugin은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행도 시작할 수 있습니다.

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

참고:

- `provider`와 `model`은 영구 세션 변경이 아니라 실행별 선택적 재정의입니다.
- OpenClaw는 신뢰할 수 있는 호출자에 대해서만 해당 재정의 필드를 존중합니다.
- Plugin 소유 폴백 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 허용해야 합니다.
- 신뢰된 Plugin을 특정 정규 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 모든 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 Plugin의 subagent 실행도 동작하지만, 재정의 요청은 조용히 폴백되는 대신 거부됩니다.

웹 검색의 경우 Plugin은 에이전트 도구 연결에 직접 접근하는 대신
공유 런타임 도우미를 사용할 수 있습니다.

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin은 `api.registerWebSearchProvider(...)`를 통해
웹 검색 provider를 등록할 수도 있습니다.

참고:

- provider 선택, 자격 증명 해석, 공유 요청 시맨틱은 코어에 유지하세요.
- 벤더별 검색 transport에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 래퍼에 의존하지 않고
  검색 동작이 필요한 기능/channel Plugin을 위한 선호되는 공유 표면입니다.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 구성된 이미지 생성 provider 체인을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 provider와 해당 capability를 나열합니다.

## Gateway HTTP 라우트

Plugin은 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

라우트 필드:

- `path`: gateway HTTP 서버 아래의 라우트 경로
- `auth`: 필수. 일반 gateway 인증이 필요하면 `"gateway"`를, plugin 관리 인증/Webhook 검증에는 `"plugin"`을 사용
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`
- `replaceExisting`: 선택 사항. 동일 Plugin이 자신의 기존 라우트 등록을 교체할 수 있게 함
- `handler`: 라우트가 요청을 처리했으면 `true`를 반환

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 plugin-load 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아니면 거부되며, 한 Plugin이 다른 Plugin의 라우트를 교체할 수는 없습니다.
- 서로 다른 `auth` 수준의 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 같은 auth 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 범위를 자동으로 받지 않습니다. 이는 권한 있는 Gateway helper 호출이 아니라 plugin 관리 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 범위 안에서 실행되지만, 그 범위는 의도적으로 보수적입니다.
  - 공유 비밀 bearer 인증(`gateway.auth.mode = "token"` / `"password"`)은 호출자가 `x-openclaw-scopes`를 보내더라도 plugin-route 런타임 범위를 `operator.write`에 고정합니다.
  - 신뢰된 identity-bearing HTTP 모드(예: `trusted-proxy` 또는 private ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 존중합니다.
  - 이러한 identity-bearing plugin-route 요청에서 `x-openclaw-scopes`가 없으면, 런타임 범위는 `operator.write`로 폴백합니다.
- 실용적인 규칙: gateway 인증 Plugin 라우트가 암묵적인 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면, identity-bearing auth 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

새 Plugin을 작성할 때는 단일 루트 barrel인 `openclaw/plugin-sdk` 대신
좁은 SDK 하위 경로를 사용하세요. 코어 하위 경로:

| Subpath                             | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                      |
| `openclaw/plugin-sdk/channel-core`  | channel 엔트리/빌드 도우미                 |
| `openclaw/plugin-sdk/core`          | 일반 공유 도우미 및 umbrella 계약          |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`) |

channel Plugin은 좁은 경계들의 집합에서 선택합니다. `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`가 있습니다. 승인 동작은 관련 없는
Plugin 필드에 걸쳐 섞는 대신 하나의 `approvalCapability` 계약으로
통합해야 합니다. 자세한 내용은 [Channel plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요.

런타임 및 config 도우미는 대응되는 `*-runtime` 하위 경로 아래에 있습니다
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` 등).

<Info>
`openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않습니다. 이전 Plugin을 위한 호환성 shim입니다. 새 코드는 더 좁은 일반 기본 요소를 import해야 합니다.
</Info>

저장소 내부 엔트리 포인트(번들 Plugin package 루트별):

- `index.js` — 번들 Plugin 엔트리
- `api.js` — 도우미/타입 barrel
- `runtime-api.js` — 런타임 전용 barrel
- `setup-entry.js` — setup Plugin 엔트리

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 import해야 합니다. 코어에서든
다른 Plugin에서든 다른 Plugin package의 `src/*`를 절대 import하지 마세요.
facade 로드 엔트리 포인트는 활성 런타임 config 스냅샷이 있으면 그것을 우선 사용하고,
없으면 디스크에 있는 해석된 config 파일로 폴백합니다.

`image-generation`, `media-understanding`,
`speech` 같은 capability별 하위 경로는 번들 Plugin이 현재 이를 사용하고 있기 때문에 존재합니다. 이들은
장기적으로 자동 동결되는 외부 계약이 아닙니다. 여기에 의존할 때는
관련 SDK 참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugin은 반응, 읽음, 투표 같은 메시지가 아닌 기본 요소에 대해
channel별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다.
공유 send 표현은 provider 네이티브 버튼, 컴포넌트, 블록, 카드 필드 대신
일반 `MessagePresentation` 계약을 사용해야 합니다.
계약, 폴백 규칙, provider 매핑, Plugin 작성자 체크리스트는
[Message Presentation](/ko/plugins/message-presentation)을 참조하세요.

send capability를 가진 Plugin은 메시지 capability를 통해 자신이 렌더링할 수 있는 항목을 선언합니다.

- 의미 기반 표현 블록(`text`, `context`, `divider`, `buttons`, `select`)용 `presentation`
- 고정 전달 요청용 `delivery-pin`

코어는 표현을 네이티브로 렌더링할지 텍스트로 낮출지 결정합니다.
일반 메시지 도구에서 provider 네이티브 UI 탈출 경로를 노출하지 마세요.
레거시 네이티브 스키마용 더 이상 권장되지 않는 SDK 도우미는 기존
서드파티 Plugin을 위해 계속 내보내지지만, 새 Plugin은 이를 사용하지 않아야 합니다.

## Channel 대상 해석

channel Plugin은 channel별 대상 시맨틱을 소유해야 합니다. 공유
아웃바운드 호스트는 일반적으로 유지하고 provider 규칙에는 messaging adapter 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 처리할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 코어에
  디렉터리 검색 대신 id 유사 해석으로 바로 넘어가야 하는 입력인지 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는
  디렉터리 탐색 실패 후에 코어가 최종 provider 소유 해석이 필요할 때 사용하는 Plugin 폴백입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 후
  provider별 세션 라우트 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType`을 사용
- "이를 명시적/네이티브 대상 id로 취급" 검사에는 `looksLikeId`를 사용
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 폴백에는 `resolveTarget`을 사용
- chat id, thread id, JID, handle, room id 같은 provider 네이티브 id는
  일반 SDK 필드가 아니라 `target` 값 또는 provider별 params 안에 유지

## Config 기반 디렉터리

config에서 디렉터리 엔트리를 파생하는 Plugin은 그 로직을
Plugin 안에 유지하고
`openclaw/plugin-sdk/directory-runtime`의 공유 도우미를 재사용해야 합니다.

다음과 같은 config 기반 peer/group가 필요한 channel에서 이를 사용하세요.

- allowlist 기반 DM peer
- 구성된 channel/group 맵
- 계정 범위의 정적 디렉터리 폴백

`directory-runtime`의 공유 도우미는 일반 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- 중복 제거/정규화 도우미
- `ChannelDirectoryEntry[]` 빌드

channel별 계정 검사 및 id 정규화는
Plugin 구현에 남아 있어야 합니다.

## Provider 카탈로그

provider Plugin은
`registerProvider({ catalog: { run(...) { ... } } })`를 사용해 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가
`models.providers`에 기록하는 것과 동일한 형태를 반환합니다.

- 하나의 provider 엔트리에 대해 `{ provider }`
- 여러 provider 엔트리에 대해 `{ providers }`

Plugin이 provider별 model id, 기본 base URL,
또는 인증에 의해 제한되는 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의
내장 암시적 provider에 상대적으로 언제 병합되는지 제어합니다.

- `simple`: 일반 API 키 또는 env 기반 provider
- `profile`: 인증 프로필이 존재할 때 나타나는 provider
- `paired`: 서로 관련된 여러 provider 엔트리를 합성하는 provider
- `late`: 다른 암시적 provider 이후 마지막 단계

키 충돌 시 나중 provider가 우선하므로, Plugin은 동일한 provider id를 가진
내장 provider 엔트리를 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 계속 레거시 별칭으로 동작
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용

## 읽기 전용 channel 검사

Plugin이 channel을 등록한다면
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 우선 고려하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 materialize되었다고 가정할 수 있으며, 필요한 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는
  구성을 설명하기 위해 런타임 자격 증명을 materialize할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환
- `enabled`와 `configured`를 유지
- 관련이 있으면 자격 증명 소스/상태 필드 포함:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 대응하는 source 필드)만으로 충분합니다.
- SecretRef를 통해 자격 증명이 구성되었지만 현재 명령 경로에서 사용할 수 없으면
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 계정을 구성되지 않은 것으로 오인하거나 충돌하는 대신
"구성되었지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## Package pack

Plugin 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 엔트리는 하나의 Plugin이 됩니다. pack에 여러 extension이 있으면 Plugin id는
`name/<fileBase>`가 됩니다.

Plugin이 npm 의존성을 import한다면 해당 디렉터리에 이를 설치해
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 엔트리는 symlink 해석 후에도
plugin 디렉터리 내부에 있어야 합니다. package 디렉터리 밖으로 벗어나는 엔트리는
거부됩니다.

보안 참고: `openclaw plugins install`은
`npm install --omit=dev --ignore-scripts`로 Plugin 의존성을 설치합니다
(수명 주기 스크립트 없음, 런타임 시 dev 의존성 없음). Plugin 의존성 트리는
"순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 package는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 channel Plugin에 대한 setup 표면이 필요할 때,
또는 channel Plugin이 활성화되어 있지만 아직 구성되지 않았을 때는
전체 Plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면
기본 Plugin 엔트리가 도구, 훅, 기타 런타임 전용 코드를 함께 연결하더라도
시작과 setup을 더 가볍게 유지할 수 있습니다.

선택 사항:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 channel Plugin이
이미 구성된 경우에도 gateway의 pre-listen 시작 단계 동안
동일한 `setupEntry` 경로를 사용하도록 선택할 수 있게 합니다.

이 옵션은 `setupEntry`가 gateway가 수신을 시작하기 전에
존재해야 하는 시작 표면을 완전히 다룰 때만 사용하세요. 실제로는
setup 엔트리가 시작이 의존하는 모든 channel 소유 capability를 등록해야 함을 의미합니다. 예를 들면:

- channel 등록 자체
- gateway가 수신을 시작하기 전에 사용 가능해야 하는 모든 HTTP 라우트
- 같은 시점에 존재해야 하는 모든 gateway 메서드, 도구, 서비스

전체 엔트리가 여전히 필요한 시작 capability를 하나라도 소유하고 있다면
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 OpenClaw가 시작 중
전체 엔트리를 로드하게 하세요.

번들 channel은 코어가 전체 channel 런타임이 로드되기 전에 참조할 수 있는
setup 전용 계약 표면 도우미도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 레거시 단일 계정 channel
config를 전체 Plugin 엔트리를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때
이 표면을 사용합니다. Matrix가 현재 번들 예시입니다. 이미 이름 있는 계정이 존재할 때
인증/부트스트랩 키만 이름 있는 승격 계정으로 옮기며,
항상 `accounts.default`를 만드는 대신 구성된 비정규 기본 계정 키를 보존할 수 있습니다.

이러한 setup patch adapter는 번들 계약 표면 검색을 지연 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 시 번들 channel 시작을
다시 진입하는 대신 최초 사용 시에만 로드됩니다.

이러한 시작 표면에 gateway RPC 메서드가 포함된다면
plugin별 prefix를 유지하세요. 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며,
Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 해석됩니다.

예시:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel 카탈로그 메타데이터

channel Plugin은 `openclaw.channel`을 통해 setup/검색 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 코어 카탈로그를 데이터 비의존적으로 유지할 수 있습니다.

예시:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk Webhook bot을 통한 셀프 호스팅 채팅.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

최소 예시 외에 유용한 `openclaw.channel` 필드:

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 엔트리가 우선해야 하는 더 낮은 우선순위의 plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 아웃바운드 서식 결정 시 channel이 markdown을 지원함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 channel 목록 표면에서 해당 channel을 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure 선택기에서 해당 channel을 숨김
- `exposure.docs`: 문서 탐색 표면에서 해당 channel을 내부용/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭. 가능하면 `exposure`를 사용
- `quickstartAllowFrom`: channel을 표준 빠른 시작 `allowFrom` 흐름에 포함
- `forceAccountBinding`: 계정이 하나만 있어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 알림 대상을 해석할 때 세션 조회를 우선

OpenClaw는 **외부 channel 카탈로그**(예: MPM
registry export)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일에는
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`가
들어 있어야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## Context engine Plugin

Context engine Plugin은 세션 컨텍스트 오케스트레이션의 수집, 조립,
Compaction을 소유합니다. Plugin에서
`api.registerContextEngine(id, factory)`로 등록한 다음, 활성 엔진은
`plugins.slots.contextEngine`으로 선택합니다.

기본 컨텍스트
파이프라인을 단순히 memory 검색이나 훅으로 추가하는 수준이 아니라 교체하거나 확장해야 할 때 이를 사용하세요.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

엔진이 Compaction 알고리즘을 소유하지 **않는다면**, `compact()`를
구현한 상태로 두고 명시적으로 위임하세요.

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 새 capability 추가

Plugin에 현재 API에 맞지 않는 동작이 필요하다면,
비공개 직접 접근으로 plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 소유해야 하는 공유 동작을 결정합니다: 정책, 폴백, config 병합,
   수명 주기, channel 대상 시맨틱, 런타임 도우미 형태.
2. 타입 지정된 Plugin 등록/런타임 표면 추가
   가장 작은 유용한 타입 지정 capability 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`를 확장합니다.
3. 코어 + channel/feature 소비자 연결
   channel과 feature Plugin은 벤더 구현을 직접 import하지 말고,
   코어를 통해 새 capability를 소비해야 합니다.
4. 벤더 구현 등록
   그런 다음 벤더 Plugin이 해당 capability에 대해 자신의 백엔드를 등록합니다.
5. 계약 범위 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 한
provider의 세계관에 하드코딩되지 않으면서도 일관된 방향성을 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는 [Capability Cookbook](/ko/plugins/architecture)를 참조하세요.

### Capability 체크리스트

새 capability를 추가할 때 구현은 일반적으로 다음
표면을 함께 수정해야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 러너/런타임 도우미
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin registry 연결
- feature/channel
  Plugin이 이를 소비해야 할 때의 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 도우미
- `src/plugins/contracts/registry.ts`의 소유권/계약 단언
- `docs/`의 운영자/Plugin 문서

이 표면 중 하나라도 빠져 있다면, 보통은 그 capability가
아직 완전히 통합되지 않았다는 신호입니다.

### Capability 템플릿

최소 패턴:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// feature/channel plugin을 위한 공유 런타임 도우미
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순해집니다.

- 코어가 capability 계약 + 오케스트레이션을 소유
- 벤더 Plugin이 벤더 구현을 소유
- feature/channel Plugin이 런타임 도우미를 소비
- 계약 테스트가 소유권을 명시적으로 유지

## 관련 항목

- [Plugin architecture](/ko/plugins/architecture) — 공개 capability 모델 및 형태
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
