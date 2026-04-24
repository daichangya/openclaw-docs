---
read_when:
    - Plugin 설치 또는 구성하기
    - Plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 Plugin 번들 사용하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리하기
title: Plugin
x-i18n:
    generated_at: "2026-04-24T06:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

Plugin은 OpenClaw를 새로운 capability로 확장합니다: channels, model providers,
도구, Skills, speech, 실시간 전사, 실시간 음성,
media-understanding, 이미지 생성, 비디오 생성, web fetch, 웹
검색 등. 일부 Plugin은 **코어**(OpenClaw와 함께 제공)이고, 다른 일부는
**외부**(커뮤니티가 npm에 게시)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 확인">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin 설치">
    ```bash
    # npm에서
    openclaw plugins install @openclaw/voice-call

    # 로컬 디렉터리 또는 아카이브에서
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 config 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 기반 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 resolver를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 package spec(ClawHub 우선, 그다음 npm 폴백).

config가 유효하지 않으면 설치는 기본적으로 fail-closed로 실패하고
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`를 선택한 번들 Plugin에 대한 좁은 재설치 경로입니다.

패키지된 OpenClaw 설치는 모든 번들 Plugin의
런타임 의존성 트리를 미리 적극적으로 설치하지 않습니다.
번들 OpenClaw 소유 Plugin이 plugin config, 레거시 channel config,
또는 기본 활성화 manifest를 통해 활성 상태가 되면, 시작 시
해당 Plugin이 선언한 런타임 의존성만 복구한 뒤 import합니다.
외부 Plugin과 사용자 지정 load 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| Format     | 작동 방식                                                      | 예시                                                     |
| ---------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + 런타임 모듈; 프로세스 내에서 실행됨  | 공식 Plugin, 커뮤니티 npm package                        |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃; OpenClaw 기능에 매핑됨     | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`   |

둘 다 `openclaw plugins list`에 표시됩니다. 번들에 대한 자세한 내용은 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

네이티브 Plugin을 작성한다면 [Plugin 빌드하기](/ko/plugins/building-plugins)
및 [Plugin SDK 개요](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 Plugin

### 설치 가능(npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ko/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ko/plugins/zalouser)   |

### 코어(OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 provider(기본적으로 활성화됨)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — 번들 memory 검색(기본값: `plugins.slots.memory`)
    - `memory-lancedb` — 필요 시 설치되는 장기 memory with auto-recall/capture (`plugins.slots.memory = "memory-lancedb"` 설정)
  </Accordion>

  <Accordion title="Speech provider(기본적으로 활성화됨)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — browser 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, browser 런타임, 기본 browser 제어 서비스를 위한 번들 browser Plugin(기본적으로 활성화됨. 교체하기 전 비활성화 필요)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본적으로 비활성화됨)
  </Accordion>
</AccordionGroup>

서드파티 Plugin을 찾고 있나요? [커뮤니티 Plugin](/ko/plugins/community)을 참조하세요.

## 구성

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                                |
| `allow`          | Plugin allowlist(선택 사항)                                |
| `deny`           | Plugin denylist(선택 사항, deny가 우선함)                  |
| `load.paths`     | 추가 Plugin 파일/디렉터리                                  |
| `slots`          | 배타적 slot 선택자(예: `memory`, `contextEngine`)          |
| `entries.\<id\>` | Plugin별 토글 + config                                     |

config 변경은 **gateway 재시작이 필요**합니다. Gateway가 config
watch + 프로세스 내 재시작을 활성화한 상태로 실행 중이라면(기본 `openclaw gateway` 경로),
config 쓰기가 반영된 직후 잠시 후 이 재시작은 보통 자동으로 수행됩니다.

<Accordion title="Plugin 상태: disabled vs missing vs invalid">
  - **Disabled**: Plugin은 존재하지만 활성화 규칙에 따라 꺼져 있음. config는 보존됨.
  - **Missing**: config가 Plugin id를 참조하지만 검색에서 찾지 못함.
  - **Invalid**: Plugin은 존재하지만 config가 선언된 스키마와 일치하지 않음.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 검색합니다(먼저 일치한 항목이 우선):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적인 파일 또는 디렉터리 경로
  </Step>

  <Step title="Workspace Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="전역 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="번들 Plugin">
    OpenClaw와 함께 제공됩니다. 많은 Plugin이 기본적으로 활성화됩니다(모델 provider, speech).
    다른 일부는 명시적 활성화가 필요합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화합니다.
- `plugins.deny`는 항상 allow보다 우선합니다.
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다.
- workspace 출처 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함).
- 번들 Plugin은 재정의되지 않는 한 내장 기본 활성 집합을 따릅니다.
- 배타적 slot은 해당 slot에서 선택된 Plugin을 강제로 활성화할 수 있습니다.
- 일부 번들 opt-in Plugin은 provider model ref, channel config, harness
  runtime처럼 config가 Plugin 소유 표면을 가리킬 때 자동으로 활성화됩니다.
- OpenAI 계열 Codex 경로는 별도의 Plugin 경계를 유지합니다.
  `openai-codex/*`는 OpenAI Plugin에 속하고, 번들 Codex
  app-server Plugin은 `embeddedHarness.runtime: "codex"` 또는 레거시
  `codex/*` 모델 ref로 선택됩니다.

## Plugin slot(배타적 카테고리)

일부 카테고리는 배타적입니다(한 번에 하나만 활성):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 비활성화하려면 "none"
      contextEngine: "legacy", // 또는 Plugin id
    },
  },
}
```

| Slot            | What it controls      | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 memory Plugin    | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진    | `legacy` (내장)     |

## CLI 참조

```bash
openclaw plugins list                       # 간단한 인벤토리
openclaw plugins list --enabled            # 로드된 Plugin만
openclaw plugins list --verbose            # Plugin별 상세 줄
openclaw plugins list --json               # 기계가 읽을 수 있는 인벤토리
openclaw plugins inspect <id>              # 상세 정보
openclaw plugins inspect <id> --json       # 기계가 읽을 수 있는 형식
openclaw plugins inspect --all             # 전체 테이블
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # 진단

openclaw plugins install <package>         # 설치(ClawHub 우선, 그다음 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 안 함)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확한 해석 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 하나의 Plugin 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 모두 업데이트
openclaw plugins uninstall <id>          # config/설치 기록 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 Plugin은 OpenClaw와 함께 제공됩니다. 많은 Plugin이 기본적으로 활성화됩니다(예:
번들 모델 provider, 번들 speech provider, 번들 browser
plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존 설치된 Plugin 또는 hook pack을 제자리에서 덮어씁니다.
추적되는 npm
Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
소스 경로를 재사용하고 관리되는 설치 대상을 복사하지 않는 `--link`와는 함께 사용할 수 없습니다.

`plugins.allow`가 이미 설정되어 있으면 `openclaw plugins install`은
설치된 Plugin id를 해당 allowlist에 추가한 후 활성화하므로, 재시작 후
즉시 로드할 수 있습니다.

`openclaw plugins update <id-or-npm-spec>`는 추적된 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 있는 npm package spec을 전달하면 package 이름을
추적된 Plugin 레코드로 다시 해석하고 이후 업데이트를 위해 새 spec을 기록합니다.
버전 없는 package 이름을 전달하면 정확히 고정된 설치를
레지스트리의 기본 릴리스 라인으로 되돌립니다.
설치된 npm Plugin이 이미 해석된 버전과 기록된 아티팩트 식별성과 일치하면,
OpenClaw는 다운로드, 재설치, config 다시 쓰기 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. `--marketplace`와는 함께 사용할 수 없습니다.
marketplace 설치는 npm spec 대신
marketplace 소스 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 dangerous-code scanner의 false positive에 대한
긴급 탈출용 재정의입니다.
이 옵션은 Plugin 설치와 Plugin 업데이트가 내장 `critical` 탐지 결과를 지나 계속 진행되게 하지만,
Plugin `before_install` 정책 차단이나 스캔 실패 차단은 여전히 우회하지 않습니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다.
Gateway 기반 Skill 의존성 설치는 대신 대응하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며,
`openclaw skills install`은 별도의 ClawHub Skill 다운로드/설치 흐름으로 남아 있습니다.

호환 번들은 동일한 Plugin list/inspect/enable/disable
흐름에 참여합니다. 현재 런타임 지원에는 번들 Skills, Claude command-skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 manifest에 선언된
`lspServers` 기본값, Cursor command-skills, 호환되는 Codex hook
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 capability와 함께
지원되거나 지원되지 않는 MCP 및 LSP 서버 엔트리도 보고합니다.

Marketplace 소스는
`~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 marketplace 이름,
로컬 marketplace 루트 또는 `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub repo
URL, 또는 git URL이 될 수 있습니다. 원격 marketplace의 경우
Plugin 엔트리는 복제된 marketplace repo 내부에 머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 내용은 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 참조하세요.

## Plugin API 개요

네이티브 Plugin은 `register(api)`를 노출하는 엔트리 객체를 export합니다. 이전
Plugin은 여전히 레거시 별칭인 `activate(api)`를 사용할 수 있지만, 새 Plugin은
`register`를 사용해야 합니다.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw는 엔트리 객체를 로드하고 Plugin
활성화 중 `register(api)`를 호출합니다. 로더는 이전 Plugin에 대해 여전히
`activate(api)`로 폴백하지만, 번들 Plugin과 새 외부 Plugin은
`register`를 공개 계약으로 취급해야 합니다.

일반적인 등록 메서드:

| Method                                  | What it registers           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 provider (LLM)         |
| `registerChannel`                       | 채팅 channel                |
| `registerTool`                          | 에이전트 도구               |
| `registerHook` / `on(...)`              | 수명 주기 훅                |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT      |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성          |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석          |
| `registerImageGenerationProvider`       | 이미지 생성                 |
| `registerMusicGenerationProvider`       | 음악 생성                   |
| `registerVideoGenerationProvider`       | 비디오 생성                 |
| `registerWebFetchProvider`              | 웹 fetch / 스크래핑 provider |
| `registerWebSearchProvider`             | 웹 검색                     |
| `registerHttpRoute`                     | HTTP 엔드포인트             |
| `registerCommand` / `registerCli`       | CLI 명령                    |
| `registerContextEngine`                 | 컨텍스트 엔진               |
| `registerService`                       | 백그라운드 서비스           |

타입 지정 수명 주기 훅의 guard 동작:

- `before_tool_call`: `{ block: true }`는 종료형이며, 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 더 이른 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료형이며, 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며, 더 이른 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료형이며, 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 더 이른 cancel을 해제하지 않습니다.

전체 타입 지정 훅 동작은 [SDK 개요](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins) — 직접 Plugin 만들기
- [Plugin Bundles](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마
- [도구 등록하기](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 에이전트 도구 추가
- [Plugin 내부](/ko/plugins/architecture) — capability 모델 및 로드 파이프라인
- [커뮤니티 Plugin](/ko/plugins/community) — 서드파티 목록
