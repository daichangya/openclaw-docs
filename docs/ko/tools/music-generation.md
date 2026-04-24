---
read_when:
    - 에이전트를 통해 음악 또는 오디오 생성하기
    - 음악 생성 provider와 모델 구성하기
    - '`music_generate` 도구 매개변수 이해하기'
summary: 공유 provider(워크플로 기반 Plugin 포함)로 음악 생성하기
title: 음악 생성
x-i18n:
    generated_at: "2026-04-24T06:41:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 도구를 사용하면 에이전트가 Google,
MiniMax, 워크플로로 구성된 ComfyUI 같은 provider를 통해 공유 음악 생성 기능으로 음악이나 오디오를 만들 수 있습니다.

공유 provider 기반 에이전트 세션의 경우 OpenClaw는 음악 생성을
백그라운드 작업으로 시작하고, 작업 원장에 추적한 뒤, 트랙이 준비되면
에이전트를 다시 깨워서 완성된 오디오를 원래 채널에 다시 게시하게 합니다.

<Note>
기본 제공 공유 도구는 사용 가능한 음악 생성 provider가 하나 이상 있을 때만 나타납니다. 에이전트 도구에 `music_generate`가 보이지 않는다면 `agents.defaults.musicGenerationModel`을 구성하거나 provider API 키를 설정하세요.
</Note>

## 빠른 시작

### 공유 provider 기반 생성

1. 예를 들어 `GEMINI_API_KEY` 또는
   `MINIMAX_API_KEY`처럼, 최소 하나의 provider에 대한 API 키를 설정합니다.
2. 필요하면 선호 모델을 설정합니다.

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. 에이전트에게 요청합니다: _"네온 도시를 가로지르는 야간 드라이브에 대한 경쾌한 synthpop 트랙을 생성해줘."_

에이전트가 `music_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은 필요 없습니다.

세션 기반 에이전트 실행이 없는 직접 동기 컨텍스트에서도, 기본 제공
도구는 여전히 인라인 생성으로 대체되어 최종 미디어 경로를 도구 결과로 반환합니다.

예시 프롬프트:

```text
보컬 없이 부드러운 스트링이 깔린 시네마틱 피아노 트랙을 생성해줘.
```

```text
해 뜰 무렵 로켓을 발사하는 내용의 에너지 넘치는 chiptune 루프를 생성해줘.
```

### 워크플로 기반 Comfy 생성

번들된 `comfy` Plugin은
음악 생성 provider 레지스트리를 통해 공유 `music_generate` 도구에 연결됩니다.

1. `models.providers.comfy.music`를 워크플로 JSON과
   프롬프트/출력 node로 구성합니다.
2. Comfy Cloud를 사용한다면 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY`를 설정합니다.
3. 에이전트에게 음악을 요청하거나 도구를 직접 호출합니다.

예시:

```text
/tool music_generate prompt="부드러운 테이프 질감이 있는 따뜻한 앰비언트 신스 루프"
```

## 공유 번들 provider 지원

| Provider | 기본 모델 | 참조 입력 | 지원되는 제어 | API 키 |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 최대 1개 이미지 | 워크플로 정의 음악 또는 오디오 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 최대 10개 이미지 | `lyrics`, `instrumental`, `format` | `GEMINI_API_KEY`, `GOOGLE_API_KEY` |
| MiniMax  | `music-2.5+`           | 없음 | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` |

### 선언된 capability 매트릭스

이것은 `music_generate`, contract test,
공유 live sweep에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `edit` | 편집 한도 | 공유 live 레인 |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | 예 | 예 | 이미지 1개 | 공유 sweep에는 없음, `extensions/comfy/comfy.live.test.ts`에서 커버 |
| Google   | 예 | 예 | 이미지 10개 | `generate`, `edit` |
| MiniMax  | 예 | 아니요 | 없음 | `generate` |

런타임에 사용 가능한 공유 provider와 모델을 검사하려면
`action: "list"`를 사용하세요.

```text
/tool music_generate action=list
```

활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요.

```text
/tool music_generate action=status
```

직접 생성 예시:

```text
/tool music_generate prompt="비닐 질감과 잔잔한 빗소리가 있는 몽환적인 lo-fi hip hop" instrumental=true
```

## 기본 제공 도구 매개변수

| 매개변수 | 타입 | 설명 |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt` | string | 음악 생성 프롬프트(`action: "generate"`에 필수) |
| `action` | string | `"generate"`(기본값), 현재 세션 작업 확인용 `"status"`, provider 검사용 `"list"` |
| `model` | string | provider/모델 재정의. 예: `google/lyria-3-pro-preview` 또는 `comfy/workflow` |
| `lyrics` | string | provider가 명시적 가사 입력을 지원할 때 선택적 가사 |
| `instrumental` | boolean | provider가 지원할 때 반주 전용 출력을 요청 |
| `image` | string | 단일 참조 이미지 경로 또는 URL |
| `images` | string[] | 여러 참조 이미지(최대 10개) |
| `durationSeconds` | number | provider가 길이 힌트를 지원할 때 목표 길이(초) |
| `timeoutMs` | number | 선택적 provider 요청 타임아웃(밀리초) |
| `format` | string | provider가 지원할 때 출력 형식 힌트(`mp3` 또는 `wav`) |
| `filename` | string | 출력 파일명 힌트 |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 제출 전에
입력 개수 같은 하드 한도를 여전히 검증합니다. provider가 duration을 지원하지만
요청값보다 더 짧은 최대값을 사용한다면 OpenClaw는 자동으로
가장 가까운 지원 길이로 제한합니다. 실제로 지원되지 않는 선택적 힌트는
선택한 provider 또는 모델이 이를 처리할 수 없을 때 경고와 함께 무시됩니다.

도구 결과는 적용된 설정을 보고합니다. provider fallback 중 OpenClaw가 duration을 제한한 경우, 반환된 `durationSeconds`는 제출된 값을 반영하고 `details.normalization.durationSeconds`는 요청값과 적용값의 매핑을 보여 줍니다.

## 공유 provider 기반 경로의 비동기 동작

- 세션 기반 에이전트 실행: `music_generate`는 백그라운드 작업을 만들고, 즉시 started/task 응답을 반환한 다음, 나중에 후속 에이전트 메시지로 완성된 트랙을 게시합니다.
- 중복 방지: 해당 백그라운드 작업이 같은 세션에서 아직 `queued` 또는 `running` 상태라면, 이후 `music_generate` 호출은 새 생성을 시작하는 대신 작업 상태를 반환합니다.
- 상태 조회: 새 작업을 시작하지 않고 활성 세션 기반 음악 작업을 확인하려면 `action: "status"`를 사용하세요.
- 작업 추적: 생성의 대기, 실행, 종료 상태를 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.
- 완료 wake: OpenClaw는 내부 완료 이벤트를 같은 세션에 다시 주입하므로 모델이 사용자 대상 후속 메시지를 직접 작성할 수 있습니다.
- 프롬프트 힌트: 같은 세션의 이후 사용자/수동 턴에는 음악 작업이 이미 진행 중일 때 작은 런타임 힌트가 제공되므로 모델이 `music_generate`를 무작정 다시 호출하지 않습니다.
- 무세션 fallback: 실제 에이전트 세션이 없는 직접/로컬 컨텍스트는 여전히 인라인으로 실행되어 같은 턴에 최종 오디오 결과를 반환합니다.

### 작업 수명 주기

각 `music_generate` 요청은 네 가지 상태를 거칩니다.

1. **queued** -- 작업 생성 완료, provider가 수락하기를 기다리는 중.
2. **running** -- provider가 처리 중(보통 provider와 길이에 따라 30초에서 3분).
3. **succeeded** -- 트랙 준비 완료, 에이전트가 깨어나 대화에 게시.
4. **failed** -- provider 오류 또는 타임아웃, 에이전트가 오류 세부 정보와 함께 깨어남.

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대해 음악 작업이 이미 `queued` 또는 `running` 상태이면, `music_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다. 새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### provider 선택 순서

음악을 생성할 때 OpenClaw는 다음 순서로 provider를 시도합니다.

1. 에이전트가 지정한 경우, 도구 호출의 `model` 매개변수
2. config의 `musicGenerationModel.primary`
3. 순서대로 `musicGenerationModel.fallbacks`
4. 인증 기반 provider 기본값만 사용하는 자동 감지:
   - 먼저 현재 기본 provider
   - 이후 남은 등록된 음악 생성 provider를 provider-id 순서로

provider가 실패하면 다음 후보가 자동으로 시도됩니다. 모두 실패하면
오류에 각 시도의 세부 정보가 포함됩니다.

음악 생성이 명시적 `model`, `primary`, `fallbacks`
항목만 사용하게 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

## provider 참고 사항

- Google은 Lyria 3 일괄 생성을 사용합니다. 현재 번들 흐름은
  프롬프트, 선택적 가사 텍스트, 선택적 참조 이미지를 지원합니다.
- MiniMax는 일괄 `music_generation` 엔드포인트를 사용합니다. 현재 번들 흐름은
  프롬프트, 선택적 가사, 반주 모드, 길이 조정,
  mp3 출력을 지원합니다.
- ComfyUI 지원은 워크플로 기반이며, 구성된 그래프와
  프롬프트/출력 필드의 node 매핑에 따라 달라집니다.

## provider capability 모드

공유 음악 생성 계약은 이제 명시적 모드 선언을 지원합니다.

- 프롬프트 전용 생성을 위한 `generate`
- 요청에 하나 이상의 참조 이미지가 포함될 때의 `edit`

새 provider 구현은 명시적 모드 블록을 선호해야 합니다.

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

기존의 `maxInputImages`, `supportsLyrics`,
`supportsFormat` 같은 평면 필드는 edit 지원을 알리기에 충분하지 않습니다. provider는
`generate`와 `edit`를 명시적으로 선언해야 live test, contract test,
공유 `music_generate` 도구가 모드 지원을 결정적으로 검증할 수 있습니다.

## 올바른 경로 선택

- 모델 선택, provider failover, 기본 제공 비동기 작업/상태 흐름이 필요하다면 공유 provider 기반 경로를 사용하세요.
- 사용자 지정 워크플로 그래프나 공유 번들 음악 capability에 포함되지 않은 provider가 필요하다면 ComfyUI 같은 Plugin 경로를 사용하세요.
- ComfyUI 전용 동작을 디버깅하는 경우 [ComfyUI](/ko/providers/comfy)를 참조하세요. 공유 provider 동작을 디버깅하는 경우 [Google (Gemini)](/ko/providers/google) 또는 [MiniMax](/ko/providers/minimax)부터 시작하세요.

## live test

공유 번들 provider에 대한 opt-in live 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

저장소 wrapper:

```bash
pnpm test:live:media music
```

이 live 파일은 `~/.profile`에서 누락된 provider env var를 로드하고,
기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하며,
provider가 edit 모드를 활성화한 경우 `generate`와 선언된 `edit` 커버리지를 모두 실행합니다.

현재 기준:

- `google`: `generate` 및 `edit`
- `minimax`: `generate`만
- `comfy`: 별도의 Comfy live 커버리지, 공유 provider sweep에는 포함되지 않음

번들 ComfyUI 음악 경로에 대한 opt-in live 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live 파일은 해당 섹션이 구성되어 있으면 comfy 이미지 및 비디오 워크플로도 함께 커버합니다.

## 관련 항목

- [Background Tasks](/ko/automation/tasks) - 분리된 `music_generate` 실행의 작업 추적
- [Configuration Reference](/ko/gateway/config-agents#agent-defaults) - `musicGenerationModel` 설정
- [ComfyUI](/ko/providers/comfy)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [Models](/ko/concepts/models) - 모델 구성 및 failover
- [Tools Overview](/ko/tools)
