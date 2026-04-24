---
read_when:
    - reasoning leakage를 위해 원시 모델 출력을 검사해야 하는 경우
    - 반복 작업 중 Gateway를 watch 모드로 실행하려는 경우
    - 반복 가능한 디버깅 워크플로가 필요한 경우
summary: '디버깅 도구: watch 모드, 원시 모델 스트림, reasoning leakage 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-04-24T06:17:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

이 페이지는 특히 provider가 reasoning을 일반 텍스트에 섞어 보낼 때
스트리밍 출력을 디버깅하는 도우미를 다룹니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용하면 **런타임 전용** 설정 재정의(디스크가 아닌 메모리)를 설정할 수 있습니다.
`/debug`는 기본적으로 비활성화되어 있으며 `commands.debug: true`로 활성화합니다.
이는 `openclaw.json`을 편집하지 않고도 잘 사용하지 않는 설정을 전환해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크에 있는 설정으로 되돌립니다.

## 세션 trace 출력

한 세션에서 Plugin 소유 trace/debug 줄을 보고 싶지만 전체 verbose 모드는 켜고 싶지 않다면 `/trace`를 사용하세요.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약 같은 Plugin 진단에는 `/trace`를 사용하세요.
일반적인 verbose 상태/도구 출력에는 계속 `/verbose`를 사용하고,
런타임 전용 설정 재정의에는 계속 `/debug`를 사용하세요.

## 임시 CLI 디버그 타이밍

OpenClaw는 로컬
조사를 위한 작은 도우미로 `src/cli/debug-timing.ts`를 유지합니다. 이는 의도적으로 CLI 시작,
명령 라우팅 또는 어떤 명령에도 기본적으로 연결되어 있지 않습니다. 느린 명령을 디버깅할 때만 사용하고,
동작 변경을 반영하기 전에 import와 span을 제거하세요.

명령이 느리고 CPU profiler를 사용할지 또는 특정 하위 시스템을 수정할지 결정하기 전에
빠른 단계별 분석이 필요할 때 사용하세요.

### 임시 span 추가

조사 중인 코드 근처에 도우미를 추가하세요. 예를 들어
`openclaw models list`를 디버깅하는 동안
`src/commands/models/list.list-command.ts`의 임시 패치는 다음과 같을 수 있습니다.

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

가이드라인:

- 임시 단계 이름은 `debug:` 접두사로 시작하세요.
- 의심되는 느린 구간 주변에 span을 몇 개만 추가하세요.
- 헬퍼
  이름보다는 `registry`, `auth_store`, `rows` 같은 넓은 단계명을 선호하세요.
- 동기 작업에는 `time()`을, Promise에는 `timeAsync()`를 사용하세요.
- stdout은 깨끗하게 유지하세요. 도우미는 stderr에 기록하므로 명령의 JSON 출력은 계속 파싱 가능합니다.
- 최종 수정 PR을 열기 전에 임시 import와 span을 제거하세요.
- 최적화를 설명하는 이슈나 PR에는 타이밍 출력 또는 짧은 요약을 포함하세요.

### 읽기 쉬운 출력으로 실행

읽기 쉬운 모드는 라이브 디버깅에 가장 적합합니다.

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

임시 `models list` 조사 예시 출력:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

이 출력에서 얻을 수 있는 결과:

| 단계 | 시간 | 의미 |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store` | 20.3s | 인증 프로필 저장소 로드가 가장 큰 비용이므로 가장 먼저 조사해야 합니다. |
| `debug:models:list:ensure_models_json` | 5.0s | `models.json` 동기화가 캐싱 또는 건너뛰기 조건을 살펴볼 만큼 충분히 비쌉니다. |
| `debug:models:list:load_model_registry` | 5.9s | 레지스트리 구성과 provider 가용성 작업도 의미 있는 비용입니다. |
| `debug:models:list:read_registry_models` | 2.4s | 모든 레지스트리 모델을 읽는 것은 공짜가 아니며 `--all`에서 중요할 수 있습니다. |
| row append 단계 | 총 3.2s | 표시되는 행이 5개뿐이어도 빌드에 몇 초가 걸리므로 필터링 경로를 더 자세히 볼 가치가 있습니다. |
| `debug:models:list:print_model_table` | 0ms | 렌더링은 병목이 아닙니다. |

이 정도 결과면 프로덕션 경로에 타이밍 코드를 남기지 않고도 다음 패치를 안내하기에 충분합니다.

### JSON 출력으로 실행

타이밍 데이터를 저장하거나 비교하려면 JSON 모드를 사용하세요.

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr의 각 줄은 하나의 JSON 객체입니다.

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 반영 전에 정리

최종 PR을 열기 전에:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

이 명령은 PR이
영구 진단 표면을 명시적으로 추가하는 경우가 아니라면 임시 instrumentation 호출 위치를 반환하지 않아야 합니다. 일반적인 성능
수정에서는 동작 변경, 테스트, 그리고 타이밍 증거에 대한 짧은 메모만 남기세요.

더 깊은 CPU 병목 분석에는 타이밍 래퍼를 더 추가하는 대신 Node 프로파일링(`--cpu-prof`) 또는 외부
profiler를 사용하세요.

## Gateway watch 모드

빠른 반복 작업을 위해 파일 watcher 아래에서 gateway를 실행하세요.

```bash
pnpm gateway:watch
```

이는 다음에 매핑됩니다.

```bash
node scripts/watch-node.mjs gateway --force
```

watcher는 `src/` 아래의 빌드 관련 파일, extension 소스 파일,
extension `package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`,
`package.json`, `tsdown.config.ts` 변경 시 재시작됩니다. Extension 메타데이터 변경은
`tsdown` 재빌드를 강제하지 않고 gateway를 재시작하며, 소스 및 설정 변경은 여전히 먼저 `dist`를 재빌드합니다.

`gateway:watch` 뒤에 Gateway CLI 플래그를 추가하면 매 재시작 시 함께 전달됩니다.
이제 같은 저장소/플래그 조합으로 동일한 watch 명령을 다시 실행하면
중복 watcher 부모를 남기지 않고 이전 watcher를 대체합니다.

## 개발 프로필 + 개발 gateway (`--dev`)

개발 프로필을 사용해 상태를 격리하고 안전하고 일회용인 디버깅 환경을 만드세요.
`--dev` 플래그는 **두 가지**가 있습니다.

- **전역 `--dev` (프로필):** 상태를 `~/.openclaw-dev` 아래에 격리하고
  gateway 포트를 기본적으로 `19001`로 설정합니다(파생 포트도 함께 이동).
- **`gateway --dev`: Gateway가 기본 설정 + 워크스페이스를 자동 생성하도록 지시**합니다.
  누락된 경우(그리고 `BOOTSTRAP.md`는 건너뜀).

권장 흐름(개발 프로필 + 개발 부트스트랩):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없다면 `pnpm openclaw ...`를 통해 CLI를 실행하세요.

이 동작이 하는 일:

1. **프로필 격리** (전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas도 이에 맞춰 이동)

2. **개발 부트스트랩** (`gateway --dev`)
   - 누락된 경우 최소 설정을 기록합니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 개발 워크스페이스로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(`BOOTSTRAP.md` 없음).
   - 누락된 경우 워크스페이스 파일을 시드합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 정체성: **C3‑PO** (protocol droid).
   - 개발 모드에서 채널 provider를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

초기화 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

참고: `--dev`는 **전역** 프로필 플래그이며 일부 runner에서 소비될 수 있습니다.
명시적으로 적어야 한다면 환경 변수 형식을 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`은 설정, 자격 증명, 세션, 개발 워크스페이스를 지운 뒤
(`rm`이 아니라 `trash` 사용), 기본 개발 설정을 다시 생성합니다.

팁: 비개발 gateway가 이미 실행 중이라면(launchd/systemd) 먼저 중지하세요.

```bash
openclaw gateway stop
```

## 원시 스트림 로깅(OpenClaw)

OpenClaw는 필터링/포맷팅 전에 **원시 assistant 스트림**을 기록할 수 있습니다.
이것은 reasoning이 일반 텍스트 delta로 도착하는지
(또는 별도의 thinking 블록으로 도착하는지) 확인하는 가장 좋은 방법입니다.

CLI를 통해 활성화:

```bash
pnpm gateway:watch --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 환경 변수:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## 원시 청크 로깅(pi-mono)

블록으로 파싱되기 전에 **원시 OpenAI 호환 청크**를 캡처하려면
pi-mono는 별도의 로거를 제공합니다.

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이것은 pi-mono의
> `openai-completions` provider를 사용하는 프로세스에서만 출력됩니다.

## 안전 참고

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
- 로그는 로컬에만 보관하고 디버깅 후 삭제하세요.
- 로그를 공유할 경우 먼저 비밀 정보와 PII를 마스킹하세요.

## 관련 항목

- [Troubleshooting](/ko/help/troubleshooting)
- [FAQ](/ko/help/faq)
