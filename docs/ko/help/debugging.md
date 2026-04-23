---
read_when:
    - reasoning 누수를 확인하려면 원시 모델 출력을 검사해야 합니다
    - 반복 작업 중에 Gateway를 watch 모드로 실행하려고 합니다
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: watch 모드, 원시 모델 스트림, 그리고 reasoning 누수 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-04-23T06:03:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# 디버깅

이 페이지는 스트리밍 출력용 디버깅 도우미를 다루며, 특히
provider가 reasoning을 일반 텍스트에 섞는 경우를 대상으로 합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용해 **런타임 전용** 구성 재정의(디스크가 아닌 메모리)를 설정하세요.
`/debug`는 기본적으로 비활성화되어 있으며, `commands.debug: true`로 활성화합니다.
이는 `openclaw.json`을 편집하지 않고 드문 설정을 전환해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 온디스크 구성으로 되돌립니다.

## 세션 추적 출력

한 세션에서 전체 상세 모드를 켜지 않고도 plugin 소유의 trace/debug 줄을 보고 싶다면 `/trace`를 사용하세요.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약과 같은 plugin 진단에는 `/trace`를 사용하세요.
일반적인 상세 상태/도구 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 구성 재정의에는 계속
`/debug`를 사용하세요.

## 임시 CLI 디버그 타이밍

OpenClaw는 로컬
조사를 위한 작은 도우미로 `src/cli/debug-timing.ts`를 유지합니다. 이 파일은 의도적으로 기본적으로 CLI 시작, 명령 라우팅,
또는 어떤 명령에도 연결되어 있지 않습니다. 느린 명령을 디버깅하는 동안에만 사용하고, 동작 변경을 반영하기 전에
import와 span을 제거하세요.

이것은 명령이 느리고, CPU 프로파일러를 사용할지 특정 하위 시스템을 수정할지 결정하기 전에 빠른 단계별 분석이 필요할 때 사용합니다.

### 임시 span 추가

조사 중인 코드 근처에 도우미를 추가하세요. 예를 들어
`openclaw models list`를 디버깅하는 동안
`src/commands/models/list.list-command.ts`의 임시 패치는
다음과 같을 수 있습니다:

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

- 임시 단계 이름에는 `debug:` 접두사를 붙이세요.
- 느릴 것으로 의심되는 구간 주변에 span을 몇 개만 추가하세요.
- 도우미
  이름보다는 `registry`, `auth_store`, `rows` 같은 넓은 단계명을 선호하세요.
- 동기 작업에는 `time()`, Promise에는 `timeAsync()`를 사용하세요.
- stdout은 깨끗하게 유지하세요. 도우미는 stderr에 기록하므로 명령 JSON 출력은 계속
  파싱 가능합니다.
- 최종 수정 PR을 열기 전에 임시 import와 span을 제거하세요.
- 최적화를 설명하는 이슈나 PR에는
  타이밍 출력 또는 짧은 요약을 포함하세요.

### 읽기 쉬운 출력으로 실행

읽기 쉬운 모드는 라이브 디버깅에 가장 적합합니다:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

임시 `models list` 조사에서의 출력 예시:

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

| 단계                                     |       시간 | 의미                                                                 |
| ---------------------------------------- | ---------: | -------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile 저장소 로드가 가장 큰 비용이며, 먼저 조사해야 합니다.    |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` 동기화 비용이 커서 캐싱이나 건너뛰기 조건을 살펴볼 만합니다. |
| `debug:models:list:load_model_registry`  |       5.9s | 레지스트리 구성과 provider 가용성 작업도 의미 있는 비용입니다.         |
| `debug:models:list:read_registry_models` |       2.4s | 모든 레지스트리 모델 읽기는 공짜가 아니며 `--all`에서 중요할 수 있습니다. |
| 행 추가 단계들                           | 3.2s total | 표시되는 5개 행을 구성하는 데도 몇 초가 걸리므로 필터링 경로를 더 자세히 볼 가치가 있습니다. |
| `debug:models:list:print_model_table`    |        0ms | 렌더링은 병목이 아닙니다.                                              |

이 결과만으로도 프로덕션 경로에
타이밍 코드를 남기지 않고 다음 패치를 안내하기에 충분합니다.

### JSON 출력으로 실행

타이밍 데이터를 저장하거나 비교하려면 JSON 모드를 사용하세요:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

각 stderr 줄은 하나의 JSON 객체입니다:

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

### 반영 전 정리

최종 PR을 열기 전에:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

정상적인 경우, PR이 영구적인 진단 표면을 명시적으로 추가하는 것이 아니라면
이 명령은 임시 계측 호출 위치를 반환하지 않아야 합니다. 일반적인 성능
수정에서는 동작 변경, 테스트, 그리고 타이밍
근거를 담은 짧은 메모만 남기세요.

더 깊은 CPU 핫스팟에는 타이밍 래퍼를 더 추가하는 대신 Node 프로파일링(`--cpu-prof`) 또는 외부
프로파일러를 사용하세요.

## Gateway watch 모드

빠른 반복 작업을 위해 파일 watcher 아래에서 gateway를 실행하세요:

```bash
pnpm gateway:watch
```

이는 다음에 매핑됩니다:

```bash
node scripts/watch-node.mjs gateway --force
```

watcher는 `src/` 아래의 빌드 관련 파일, extension 소스 파일,
extension `package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`,
`package.json`, `tsdown.config.ts`가 변경되면 재시작합니다. Extension 메타데이터 변경은
`tsdown` 재빌드를 강제하지 않고 gateway를 재시작하며, 소스 및 구성 변경은 여전히 먼저
`dist`를 다시 빌드합니다.

`gateway:watch` 뒤에 gateway CLI 플래그를 추가하면
매번 재시작 시 그대로 전달됩니다. 이제 동일한 repo/플래그 조합으로 같은 watch 명령을 다시 실행하면
중복 watcher 부모 프로세스를 남기는 대신 이전 watcher를 교체합니다.

## dev 프로필 + dev gateway (`--dev`)

디버깅을 위해 상태를 분리하고 안전하며 폐기 가능한 설정을 빠르게 띄우려면 dev 프로필을 사용하세요. `--dev` 플래그는 **두 가지**가 있습니다:

- **전역 `--dev` (프로필):** `~/.openclaw-dev` 아래로 상태를 분리하고
  gateway 포트를 기본적으로 `19001`로 설정합니다(파생 포트도 함께 이동).
- **`gateway --dev`:** 누락된 경우 Gateway가 기본 구성 +
  workspace를 자동 생성하도록 지시합니다(그리고 BOOTSTRAP.md는 건너뜁니다).

권장 흐름(dev 프로필 + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없다면 `pnpm openclaw ...`를 통해 CLI를 실행하세요.

이 동작이 하는 일:

1. **프로필 분리** (전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas도 그에 맞춰 이동)

2. **Dev bootstrap** (`gateway --dev`)
   - 누락된 경우 최소 구성을 씁니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 dev workspace로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(BOOTSTRAP.md 없음).
   - 누락된 경우 workspace 파일을 시드합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 identity: **C3‑PO** (protocol droid).
   - dev 모드에서는 채널 provider를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

재설정 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

참고: `--dev`는 **전역** 프로필 플래그이며 일부 runner에서 소비될 수 있습니다.
명시적으로 적어야 한다면 env var 형식을 사용하세요:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`은 구성, 자격 증명, 세션, dev workspace를 지우고(`rm`이 아니라
`trash` 사용), 기본 dev 설정을 다시 만듭니다.

팁: dev가 아닌 gateway가 이미 실행 중이라면(launchd/systemd) 먼저 중지하세요:

```bash
openclaw gateway stop
```

## 원시 스트림 로깅(OpenClaw)

OpenClaw는 필터링/포맷팅 전의 **원시 assistant 스트림**을 기록할 수 있습니다.
이것은 reasoning이 일반 텍스트 delta로 들어오는지
(또는 별도의 thinking 블록으로 들어오는지) 확인하는 가장 좋은 방법입니다.

CLI로 활성화:

```bash
pnpm gateway:watch --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 env var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## 원시 청크 로깅(pi-mono)

블록으로 파싱되기 전에 **원시 OpenAI-compat 청크**를 캡처하려면,
pi-mono는 별도의 로거를 제공합니다:

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

## 안전 참고사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
- 로그는 로컬에만 보관하고 디버깅 후 삭제하세요.
- 로그를 공유해야 한다면 먼저 시크릿과 PII를 제거하세요.
