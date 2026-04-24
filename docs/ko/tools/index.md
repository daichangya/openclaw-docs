---
read_when:
    - OpenClaw가 제공하는 도구가 무엇인지 이해하려고 합니다.
    - 도구를 구성하거나, 허용하거나, 거부해야 합니다.
    - 기본 제공 도구, Skills, Plugins 중 무엇을 사용할지 결정하는 중입니다.
summary: 'OpenClaw 도구 및 Plugins 개요: 에이전트가 할 수 있는 일과 확장 방법'
title: 도구 및 Plugins
x-i18n:
    generated_at: "2026-04-24T06:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

에이전트가 텍스트 생성 외에 수행하는 모든 일은 **도구**를 통해 이루어집니다.
도구는 에이전트가 파일을 읽고, 명령을 실행하고, 웹을 탐색하고, 메시지를 보내고,
기기와 상호작용하는 방식입니다.

## 도구, Skills, Plugins

OpenClaw에는 함께 작동하는 세 개의 계층이 있습니다.

<Steps>
  <Step title="도구는 에이전트가 호출하는 것입니다">
    도구는 에이전트가 호출할 수 있는 타입이 지정된 함수입니다(예: `exec`, `browser`,
    `web_search`, `message`). OpenClaw는 **기본 제공 도구** 집합을 제공하며,
    Plugins는 추가 도구를 등록할 수 있습니다.

    에이전트는 도구를 모델 API로 전송되는 구조화된 함수 정의로 인식합니다.

  </Step>

  <Step title="Skills는 언제 어떻게 사용할지 에이전트에게 가르칩니다">
    Skill은 시스템 프롬프트에 주입되는 markdown 파일(`SKILL.md`)입니다.
    Skills는 에이전트가 도구를 효과적으로 사용할 수 있도록 컨텍스트, 제약 조건,
    단계별 지침을 제공합니다. Skills는 workspace, 공유 폴더에 있거나,
    Plugins 내부에 포함될 수 있습니다.

    [Skills 참조](/ko/tools/skills) | [Skills 만들기](/ko/tools/creating-skills)

  </Step>

  <Step title="Plugins는 모든 것을 함께 패키징합니다">
    Plugin은 다음 capability의 임의 조합을 등록할 수 있는 패키지입니다:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search 등. 일부 Plugins는 **core**(OpenClaw와 함께 제공)이고,
    다른 Plugins는 **external**(커뮤니티가 npm에 게시)입니다.

    [Plugins 설치 및 구성](/ko/tools/plugin) | [직접 만들기](/ko/plugins/building-plugins)

  </Step>
</Steps>

## 기본 제공 도구

이 도구들은 OpenClaw와 함께 제공되며 Plugin을 설치하지 않아도 사용할 수 있습니다.

| Tool                                       | 기능                                                          | 페이지                                                         |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 셸 명령 실행, 백그라운드 프로세스 관리                        | [Exec](/ko/tools/exec), [Exec Approvals](/ko/tools/exec-approvals) |
| `code_execution`                           | 샌드박스된 원격 Python 분석 실행                              | [Code Execution](/ko/tools/code-execution)                      |
| `browser`                                  | Chromium 브라우저 제어(탐색, 클릭, 스크린샷)                  | [Browser](/ko/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | 웹 검색, X 게시물 검색, 페이지 콘텐츠 가져오기               | [Web](/ko/tools/web), [Web Fetch](/ko/tools/web-fetch)             |
| `read` / `write` / `edit`                  | workspace 내 파일 I/O                                         |                                                              |
| `apply_patch`                              | 여러 hunk로 이루어진 파일 패치                                | [Apply Patch](/ko/tools/apply-patch)                            |
| `message`                                  | 모든 채널로 메시지 전송                                       | [Agent Send](/ko/tools/agent-send)                              |
| `canvas`                                   | node Canvas 구동(present, eval, snapshot)                     |                                                              |
| `nodes`                                    | 페어링된 기기 검색 및 대상 지정                               |                                                              |
| `cron` / `gateway`                         | 예약 작업 관리, gateway 검사/패치/재시작/업데이트            |                                                              |
| `image` / `image_generate`                 | 이미지 분석 또는 생성                                         | [Image Generation](/ko/tools/image-generation)                  |
| `music_generate`                           | 음악 트랙 생성                                                | [Music Generation](/ko/tools/music-generation)                  |
| `video_generate`                           | 비디오 생성                                                   | [Video Generation](/ko/tools/video-generation)                  |
| `tts`                                      | 일회성 text-to-speech 변환                                    | [TTS](/ko/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | 세션 관리, 상태 확인, 하위 에이전트 오케스트레이션           | [Sub-agents](/ko/tools/subagents)                               |
| `session_status`                           | 경량 `/status` 스타일 읽기와 세션별 모델 재정의              | [Session Tools](/ko/concepts/session-tool)                      |

이미지 작업에서는 분석에는 `image`를, 생성 또는 편집에는 `image_generate`를 사용하세요. `openai/*`, `google/*`, `fal/*` 또는 다른 비기본 이미지 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API key를 구성하세요.

음악 작업에서는 `music_generate`를 사용하세요. `google/*`, `minimax/*` 또는 다른 비기본 음악 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API key를 구성하세요.

비디오 작업에서는 `video_generate`를 사용하세요. `qwen/*` 또는 다른 비기본 비디오 provider를 대상으로 한다면, 먼저 해당 provider의 auth/API key를 구성하세요.

워크플로우 기반 오디오 생성에서는 ComfyUI 같은 Plugin이 등록하는
`music_generate`를 사용하세요. 이것은 text-to-speech인 `tts`와는 별개입니다.

`session_status`는 sessions 그룹의 경량 상태/읽기 도구입니다.
현재 세션에 대한 `/status` 스타일 질문에 답하며,
선택적으로 세션별 모델 재정의를 설정할 수 있습니다. `model=default`는 해당
재정의를 지웁니다. `/status`처럼 최신 transcript usage 항목에서 희소한 token/cache 카운터와
활성 런타임 모델 레이블을 보강할 수 있습니다.

`gateway`는 gateway 작업을 위한 owner 전용 런타임 도구입니다.

- 편집 전 경로 범위 config 서브트리 하나를 위한 `config.schema.lookup`
- 현재 config 스냅샷 + 해시를 위한 `config.get`
- 재시작이 수반되는 부분 config 업데이트를 위한 `config.patch`
- 전체 config 교체에만 사용하는 `config.apply`
- 명시적 self-update + restart를 위한 `update.run`

부분 변경에는 `config.schema.lookup` 후 `config.patch`를 우선 사용하세요.
전체 config를 의도적으로 교체할 때만 `config.apply`를 사용하세요.
또한 이 도구는 `tools.exec.ask`나 `tools.exec.security` 변경을 거부합니다.
레거시 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다.

### Plugin이 제공하는 도구

Plugins는 추가 도구를 등록할 수 있습니다. 예시:

- [Diffs](/ko/tools/diffs) — diff 뷰어 및 렌더러
- [LLM Task](/ko/tools/llm-task) — 구조화된 출력을 위한 JSON 전용 LLM 단계
- [Lobster](/ko/tools/lobster) — 재개 가능한 승인이 있는 타입 워크플로우 런타임
- [Music Generation](/ko/tools/music-generation) — 워크플로우 기반 provider를 사용하는 공유 `music_generate` 도구
- [OpenProse](/ko/prose) — markdown 우선 워크플로우 오케스트레이션
- [Tokenjuice](/ko/tools/tokenjuice) — 장황한 `exec` 및 `bash` 도구 결과를 압축

## 도구 구성

### 허용 및 거부 목록

config의 `tools.allow` / `tools.deny`로 에이전트가 호출할 수 있는 도구를 제어합니다.
거부는 항상 허용보다 우선합니다.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### 도구 프로필

`tools.profile`은 `allow`/`deny`가 적용되기 전에 기본 allowlist를 설정합니다.
에이전트별 재정의: `agents.list[].tools.profile`.

| Profile     | 포함 항목                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 제한 없음(미설정과 동일)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status`만 포함                                                                                                                             |

`coding` 및 `messaging` 프로필은 Plugin 키 `bundle-mcp` 아래의 구성된 bundle MCP 도구도 허용합니다.
프로필이 일반 기본 제공 도구는 유지하면서 모든 구성된 MCP 도구를 숨기게 하려면 `tools.deny: ["bundle-mcp"]`를 추가하세요.
`minimal` 프로필에는 bundle MCP 도구가 포함되지 않습니다.

### 도구 그룹

허용/거부 목록에서 `group:*` 축약형을 사용하세요.

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`는 `exec`의 별칭으로 허용됨)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 모든 기본 제공 OpenClaw 도구(Plugin 도구 제외)                                                       |

`sessions_history`는 경계가 있고 안전 필터가 적용된 recall 뷰를 반환합니다. 이 도구는
생각 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 tool-call XML
payload(`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, 잘린 tool-call 블록 포함),
다운그레이드된 tool-call 스캐폴딩, 유출된 ASCII/full-width 모델 제어
토큰, assistant 텍스트의 잘못된 MiniMax tool-call XML을 제거한 뒤,
원시 transcript 덤프처럼 동작하는 대신 redaction/truncation과
필요 시 oversized-row placeholder를 적용합니다.

### provider별 제한

전역 기본값을 바꾸지 않고 특정 provider의 도구를 제한하려면
`tools.byProvider`를 사용하세요.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
