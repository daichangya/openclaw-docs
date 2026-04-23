---
read_when:
    - Plugin을 설치하거나 구성하고 있습니다
    - Plugin 검색 및 로드 규칙을 이해하고 있습니다
    - Codex/Claude 호환 Plugin 번들과 작업하고 있습니다
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리하기
title: Plugin
x-i18n:
    generated_at: "2026-04-23T06:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb81789de548aed0cd0404e8c42a2d9ce00d0e9163f944e07237b164d829ac40
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin은 새로운 기능으로 OpenClaw를 확장합니다: 채널, 모델 provider,
도구, Skills, 음성, 실시간 전사, 실시간 음성,
미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹
검색 등. 일부 Plugin은 **core**(OpenClaw와 함께 제공)이고, 다른 일부는
**external**(커뮤니티가 npm에 게시)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 보기">
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

chat 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 확인자를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 패키지 사양(ClawHub 우선, 이후 npm 폴백).

config가 잘못된 경우 설치는 일반적으로 실패 시 닫히며
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`에 opt-in한 Plugin을 위한
제한된 번들 Plugin 재설치 경로입니다.

패키지된 OpenClaw 설치는 모든 번들 Plugin의
런타임 의존성 트리를 미리 설치하지 않습니다. Plugin config, 레거시 channel config 또는 기본 활성화된 manifest에서
번들 OpenClaw 소유 Plugin이 활성화되어 있을 때는
시작 시 해당 Plugin을 import하기 전에 그 Plugin이 선언한 런타임 의존성만 복구합니다.
external Plugin과 사용자 정의 로드 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다:

| 형식       | 동작 방식                                                        | 예시                                                   |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈, 프로세스 내에서 실행       | 공식 Plugin, 커뮤니티 npm 패키지                       |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃, OpenClaw 기능으로 매핑        | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list`에 표시됩니다. 번들 세부 정보는 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

native Plugin을 작성 중이라면 [Building Plugins](/ko/plugins/building-plugins)
및 [Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 공식 Plugin

### 설치 가능(npm)

| Plugin          | 패키지                | 문서                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ko/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ko/plugins/zalouser)   |

### core(OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 provider(기본 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 Plugin">
    - `memory-core` — 번들 메모리 검색(`plugins.slots.memory`를 통한 기본값)
    - `memory-lancedb` — 주문형 설치 장기 메모리, 자동 리콜/캡처 포함(`plugins.slots.memory = "memory-lancedb"` 설정)
  </Accordion>

  <Accordion title="음성 provider(기본 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — 브라우저 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스를 위한 번들 브라우저 Plugin(기본 활성화, 교체 전 비활성화 필요)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본 비활성화)
  </Accordion>
</AccordionGroup>

서드파티 Plugin을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

## 구성

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 필드            | 설명                                                    |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                              |
| `allow`          | Plugin 허용 목록(선택 사항)                              |
| `deny`           | Plugin 거부 목록(선택 사항, 거부가 우선)                 |
| `load.paths`     | 추가 Plugin 파일/디렉터리                                |
| `slots`          | 배타적 슬롯 선택자(예: `memory`, `contextEngine`)        |
| `entries.\<id\>` | Plugin별 토글 + config                                   |

config 변경은 **Gateway 재시작이 필요**합니다. Gateway가 config
watch + 프로세스 내 재시작이 활성화된 상태(기본 `openclaw gateway` 경로)로 실행 중이면,
그 재시작은 보통 config 기록이 반영된 직후 자동으로 수행됩니다.

<Accordion title="Plugin 상태: 비활성화 대 누락 대 잘못됨">
  - **비활성화**: Plugin은 존재하지만 활성화 규칙으로 인해 꺼져 있습니다. config는 유지됩니다.
  - **누락**: config가 Plugin id를 참조하지만 검색에서 찾지 못했습니다.
  - **잘못됨**: Plugin은 존재하지만 config가 선언된 스키마와 일치하지 않습니다.
</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 스캔합니다(첫 일치 항목 우선):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로.
  </Step>

  <Step title="워크스페이스 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 Plugin">
    OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(모델 provider, 음성 등).
    다른 항목은 명시적으로 활성화해야 합니다.
  </Step>
</Steps>

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화합니다
- `plugins.deny`는 항상 `allow`보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다
- 워크스페이스 원본 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함)
- 번들 Plugin은 재정의되지 않는 한 내장 기본 활성화 집합을 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 Plugin을 강제로 활성화할 수 있습니다

## Plugin 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성):

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

| 슬롯            | 제어 대상              | 기본값             |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 메모리 Plugin    | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진    | `legacy` (내장)     |

## CLI 참조

```bash
openclaw plugins list                       # 간단 인벤토리
openclaw plugins list --enabled            # 로드된 Plugin만
openclaw plugins list --verbose            # Plugin별 상세 행
openclaw plugins list --json               # 기계 판독 가능 인벤토리
openclaw plugins inspect <id>              # 상세 정보
openclaw plugins inspect <id> --json       # 기계 판독 가능
openclaw plugins inspect --all             # 전체 테이블
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # 진단

openclaw plugins install <package>         # 설치(ClawHub 우선, 이후 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 안 함)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확한 확인된 npm 사양 기록
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

번들 Plugin은 OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(예:
번들 모델 provider, 번들 음성 provider, 번들 browser
Plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존 설치된 Plugin 또는 hook pack을 제자리에서 덮어씁니다. 추적된 npm
Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요. 이는
`--link`와 함께 지원되지 않으며, `--link`는 관리되는 설치 대상을
복사하는 대신 원본 경로를 재사용합니다.

`openclaw plugins update <id-or-npm-spec>`는 추적된 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 있는 npm 패키지 사양을 전달하면 패키지 이름을
추적된 Plugin 레코드로 다시 확인하고 향후 업데이트를 위해 새 사양을 기록합니다.
버전 없이 패키지 이름을 전달하면 정확히 고정된 설치가
레지스트리의 기본 릴리스 라인으로 돌아갑니다. 설치된 npm Plugin이 이미
확인된 버전 및 기록된 아티팩트 ID와 일치하면 OpenClaw는 다운로드,
재설치, config 재작성 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. `--marketplace`와 함께는 지원되지 않습니다.
마켓플레이스 설치는 npm 사양 대신
마켓플레이스 소스 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한
비상용 재정의입니다. 이 플래그는 Plugin 설치와 Plugin 업데이트가 내장 `critical`
발견 사항을 지나 계속 진행되도록 허용하지만, 여전히 Plugin `before_install`
정책 차단이나 스캔 실패 차단은 우회하지 않습니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 skill
의존성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청
재정의를 사용하며, `openclaw skills install`은 별도의 ClawHub
skill 다운로드/설치 흐름으로 유지됩니다.

호환 번들은 동일한 Plugin list/inspect/enable/disable 흐름에 참여합니다.
현재 런타임 지원에는 bundle Skills, Claude command-Skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 manifest 선언
`lspServers` 기본값, Cursor command-Skills, 호환되는 Codex hook
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 기능과
지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

마켓플레이스 소스는
`~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름,
로컬 마켓플레이스 루트 또는 `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub 저장소
URL 또는 git URL일 수 있습니다. 원격 마켓플레이스의 경우 Plugin 항목은
복제된 마켓플레이스 저장소 내부에 머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 세부 정보는 [`openclaw plugins` CLI reference](/cli/plugins)를 참조하세요.

## Plugin API 개요

native Plugin은 `register(api)`를 노출하는 entry 객체를 export합니다. 오래된
Plugin은 여전히 레거시 별칭으로 `activate(api)`를 사용할 수 있지만, 새 Plugin은
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

OpenClaw는 entry 객체를 로드하고 Plugin
활성화 중에 `register(api)`를 호출합니다. 로더는 오래된 Plugin을 위해 여전히 `activate(api)`로
폴백하지만, 번들 Plugin과 새로운 external Plugin은
`register`를 공개 계약으로 취급해야 합니다.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상                    |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 provider(LLM)          |
| `registerChannel`                       | chat channel                |
| `registerTool`                          | 에이전트 도구               |
| `registerHook` / `on(...)`              | 수명 주기 Hook              |
| `registerSpeechProvider`                | 텍스트-음성 변환 / STT      |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성          |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석          |
| `registerImageGenerationProvider`       | 이미지 생성                 |
| `registerMusicGenerationProvider`       | 음악 생성                   |
| `registerVideoGenerationProvider`       | 비디오 생성                 |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 provider |
| `registerWebSearchProvider`             | 웹 검색                     |
| `registerHttpRoute`                     | HTTP 엔드포인트             |
| `registerCommand` / `registerCli`       | CLI 명령                    |
| `registerContextEngine`                 | 컨텍스트 엔진               |
| `registerService`                       | 백그라운드 서비스           |

타입이 지정된 수명 주기 Hook에 대한 Hook 가드 동작:

- `before_tool_call`: `{ block: true }`는 종료 신호이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료 신호이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며, 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료 신호이며, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며, 이전 cancel을 해제하지 않습니다.

전체 타입 지정 Hook 동작은 [SDK Overview](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련 항목

- [Building Plugins](/ko/plugins/building-plugins) — 직접 Plugin 만들기
- [Plugin Bundles](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마
- [Registering Tools](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 에이전트 도구 추가
- [Plugin Internals](/ko/plugins/architecture) — 기능 모델과 로드 파이프라인
- [Community Plugins](/ko/plugins/community) — 서드파티 목록
