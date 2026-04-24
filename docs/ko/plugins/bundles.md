---
read_when:
    - Codex, Claude 또는 Cursor 호환 번들을 설치하려고 합니다
    - OpenClaw가 번들 콘텐츠를 네이티브 기능에 어떻게 매핑하는지 이해해야 합니다
    - 번들 감지 또는 누락된 capability를 디버깅하고 있습니다
summary: Codex, Claude, Cursor 번들을 OpenClaw Plugin으로 설치하고 사용하기
title: Plugin 번들
x-i18n:
    generated_at: "2026-04-24T06:25:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw는 세 가지 외부 생태계의 Plugin을 설치할 수 있습니다: **Codex**, **Claude**,
그리고 **Cursor**. 이것들은 **번들**이라고 부르며, OpenClaw가 skills, hook, MCP 도구 같은 네이티브 기능으로 매핑하는 콘텐츠 및 메타데이터 팩입니다.

<Info>
  번들은 **네이티브 OpenClaw Plugin과 동일하지 않습니다**. 네이티브 Plugin은
  프로세스 내에서 실행되며 어떤 capability든 등록할 수 있습니다. 번들은 콘텐츠 팩이며,
  선택적인 기능 매핑과 더 좁은 신뢰 경계를 가집니다.
</Info>

## 번들이 존재하는 이유

유용한 Plugin 중 다수는 Codex, Claude 또는 Cursor 형식으로 게시됩니다. 작성자에게 이를 네이티브 OpenClaw Plugin으로 다시 작성하라고 요구하는 대신, OpenClaw는 이런 형식을 감지하고 지원되는 콘텐츠를 네이티브 기능 세트로 매핑합니다. 즉, Claude 명령 팩이나 Codex skill 번들을 설치하고 바로 사용할 수 있습니다.

## 번들 설치

<Steps>
  <Step title="디렉터리, 아카이브, 또는 마켓플레이스에서 설치">
    ```bash
    # 로컬 디렉터리
    openclaw plugins install ./my-bundle

    # 아카이브
    openclaw plugins install ./my-bundle.tgz

    # Claude 마켓플레이스
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="감지 확인">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    번들은 `Format: bundle`로 표시되며 subtype은 `codex`, `claude`, 또는 `cursor`입니다.

  </Step>

  <Step title="재시작 후 사용">
    ```bash
    openclaw gateway restart
    ```

    매핑된 기능(skills, hooks, MCP tools, LSP defaults)은 다음 세션에서 사용 가능합니다.

  </Step>
</Steps>

## OpenClaw가 번들에서 매핑하는 것

현재 모든 번들 기능이 OpenClaw에서 실행되는 것은 아닙니다. 다음은 작동하는 것과 감지되지만 아직 연결되지 않은 것을 정리한 것입니다.

### 현재 지원됨

| 기능         | 매핑 방식                                                                                   | 적용 대상        |
| ------------ | ------------------------------------------------------------------------------------------- | ---------------- |
| Skill 콘텐츠 | 번들 skill 루트가 일반 OpenClaw Skills처럼 로드됨                                           | 모든 형식        |
| 명령         | `commands/`와 `.cursor/commands/`를 skill 루트로 취급                                      | Claude, Cursor   |
| Hook 팩      | OpenClaw 스타일 `HOOK.md` + `handler.ts` 레이아웃                                           | Codex            |
| MCP 도구     | 번들 MCP config가 내장 Pi 설정에 병합되고, 지원되는 stdio 및 HTTP 서버가 로드됨            | 모든 형식        |
| LSP 서버     | Claude `.lsp.json` 및 manifest 선언 `lspServers`가 내장 Pi LSP 기본값에 병합됨             | Claude           |
| 설정         | Claude `settings.json`이 내장 Pi 기본값으로 가져와짐                                       | Claude           |

#### Skill 콘텐츠

- 번들 skill 루트는 일반 OpenClaw skill 루트처럼 로드됩니다
- Claude `commands` 루트는 추가 skill 루트로 취급됩니다
- Cursor `.cursor/commands` 루트는 추가 skill 루트로 취급됩니다

즉, Claude markdown 명령 파일은 일반 OpenClaw skill
로더를 통해 작동합니다. Cursor 명령 markdown도 같은 경로를 통해 작동합니다.

#### Hook 팩

- 번들 hook 루트는 일반 OpenClaw hook-pack
  레이아웃을 사용할 때만 작동합니다. 현재는 주로 Codex 호환 경우입니다:
  - `HOOK.md`
  - `handler.ts` 또는 `handler.js`

#### Pi용 MCP

- 활성화된 번들은 MCP 서버 config를 제공할 수 있습니다
- OpenClaw는 번들 MCP config를 실효 내장 Pi 설정의
  `mcpServers`로 병합합니다
- OpenClaw는 stdio 서버를 실행하거나 HTTP 서버에 연결하여 내장 Pi 에이전트 턴 중 지원되는 번들 MCP 도구를 노출합니다
- `coding` 및 `messaging` 도구 profile은 기본적으로 번들 MCP 도구를 포함합니다. 에이전트 또는 gateway에서 제외하려면 `tools.deny: ["bundle-mcp"]`를 사용하세요
- 프로젝트 로컬 Pi 설정은 여전히 번들 기본값 이후에 적용되므로, 필요하면 워크스페이스 설정이 번들 MCP 항목을 재정의할 수 있습니다
- 번들 MCP 도구 카탈로그는 등록 전에 결정론적으로 정렬되므로, 업스트림 `listTools()` 순서 변경이 프롬프트 캐시 도구 블록을 흔들지 않습니다

##### 전송 방식

MCP 서버는 stdio 또는 HTTP 전송을 사용할 수 있습니다.

**Stdio**는 자식 프로세스를 실행합니다:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP**는 기본적으로 `sse`를 통해 실행 중인 MCP 서버에 연결하며, 요청 시 `streamable-http`를 사용합니다:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport`는 `"streamable-http"` 또는 `"sse"`로 설정할 수 있으며, 생략하면 OpenClaw는 `sse`를 사용합니다
- `http:`와 `https:` URL 스킴만 허용됩니다
- `headers` 값은 `${ENV_VAR}` 보간을 지원합니다
- `command`와 `url`이 모두 있는 서버 항목은 거부됩니다
- URL 자격 증명(userinfo 및 query param)은 도구
  설명과 로그에서 redaction 처리됩니다
- `connectionTimeoutMs`는
  stdio와 HTTP 전송 모두에서 기본 30초 연결 타임아웃을 재정의합니다

##### 도구 이름 지정

OpenClaw는 번들 MCP 도구를
`serverName__toolName` 형식의 provider 안전 이름으로 등록합니다. 예를 들어 `"vigil-harbor"` 키를 가진 서버가
`memory_search` 도구를 노출하면 `vigil-harbor__memory_search`로 등록됩니다.

- `A-Za-z0-9_-` 밖의 문자는 `-`로 대체됩니다
- 서버 접두사는 30자로 제한됩니다
- 전체 도구 이름은 64자로 제한됩니다
- 빈 서버 이름은 `mcp`로 폴백합니다
- 정규화된 이름이 충돌하면 숫자 접미사로 구분합니다
- 최종 노출 도구 순서는 반복된 Pi
  턴의 캐시 안정성을 위해 안전한 이름 기준으로 결정론적으로 정렬됩니다
- profile 필터링은 하나의 번들 MCP 서버에서 나온 모든 도구를
  `bundle-mcp` 소유 Plugin으로 취급하므로, profile 허용 목록과 거부 목록은
  개별 노출 도구 이름 또는 `bundle-mcp` Plugin 키 둘 다 포함할 수 있습니다

#### 내장 Pi 설정

- Claude `settings.json`은 번들이 활성화된 경우
  기본 내장 Pi 설정으로 가져와집니다
- OpenClaw는 셸 재정의 키를 적용하기 전에 정리합니다

정리되는 키:

- `shellPath`
- `shellCommandPrefix`

#### 내장 Pi LSP

- 활성화된 Claude 번들은 LSP 서버 config를 제공할 수 있습니다
- OpenClaw는 `.lsp.json`과 manifest에 선언된 `lspServers` 경로를 로드합니다
- 번들 LSP config는 실효 내장 Pi LSP 기본값에 병합됩니다
- 현재는 지원되는 stdio 기반 LSP 서버만 실행할 수 있습니다. 지원되지 않는
  전송 방식은 여전히 `openclaw plugins inspect <id>`에 표시됩니다

### 감지되지만 실행되지 않음

이 항목들은 인식되어 진단에는 표시되지만, OpenClaw는 실행하지 않습니다.

- Claude `agents`, `hooks.json` 자동화, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- capability 보고 외의 Codex inline/app metadata

## 번들 형식

<AccordionGroup>
  <Accordion title="Codex 번들">
    마커: `.codex-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex 번들은 skill 루트와 OpenClaw 스타일
    hook-pack 디렉터리(`HOOK.md` + `handler.ts`)를 사용할 때 OpenClaw에 가장 잘 맞습니다.

  </Accordion>

  <Accordion title="Claude 번들">
    두 가지 감지 모드:

    - **Manifest 기반:** `.claude-plugin/plugin.json`
    - **manifest 없음:** 기본 Claude 레이아웃(`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude 전용 동작:

    - `commands/`는 skill 콘텐츠로 취급됩니다
    - `settings.json`은 내장 Pi 설정으로 가져와집니다(셸 재정의 키는 정리됨)
    - `.mcp.json`은 지원되는 stdio 도구를 내장 Pi에 노출합니다
    - `.lsp.json`과 manifest 선언 `lspServers` 경로는 내장 Pi LSP 기본값으로 로드됩니다
    - `hooks/hooks.json`은 감지만 하며 실행되지는 않습니다
    - manifest의 사용자 지정 component 경로는 가산적입니다(기본값을 대체하지 않고 확장함)

  </Accordion>

  <Accordion title="Cursor 번들">
    마커: `.cursor-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`는 skill 콘텐츠로 취급됩니다
    - `.cursor/rules/`, `.cursor/agents/`, `.cursor/hooks.json`은 감지만 합니다

  </Accordion>
</AccordionGroup>

## 감지 우선순위

OpenClaw는 먼저 네이티브 Plugin 형식을 확인합니다.

1. `openclaw.plugin.json` 또는 `openclaw.extensions`가 있는 유효한 `package.json` — **네이티브 Plugin**으로 취급
2. 번들 마커(`.codex-plugin/`, `.claude-plugin/`, 또는 기본 Claude/Cursor 레이아웃) — **번들**로 취급

디렉터리에 둘 다 들어 있으면 OpenClaw는 네이티브 경로를 사용합니다. 이렇게 하면 이중 형식 패키지가 부분적으로 번들로 설치되는 일을 막을 수 있습니다.

## 런타임 의존성과 정리

- 번들 Plugin 런타임 의존성은 OpenClaw package 내부의
  `dist/*` 아래에 포함되어 제공됩니다. OpenClaw는 번들
  Plugin에 대해 시작 시 `npm install`을 실행하지 않습니다. 완전한 번들 의존성 페이로드를 제공하는 것은 릴리스 파이프라인의 책임입니다
  ([Releasing](/ko/reference/RELEASING)의 postpublish 검증 규칙 참조).

## 보안

번들은 네이티브 Plugin보다 더 좁은 신뢰 경계를 가집니다.

- OpenClaw는 임의의 번들 런타임 모듈을 프로세스 내에서 로드하지 않습니다
- Skills와 hook-pack 경로는 Plugin 루트 내부에 머물러야 합니다(경계 검사됨)
- 설정 파일도 동일한 경계 검사로 읽힙니다
- 지원되는 stdio MCP 서버는 하위 프로세스로 실행될 수 있습니다

이렇게 하면 번들은 기본적으로 더 안전해지지만, 여전히 노출하는 기능에 대해서는 타사 번들을 신뢰된 콘텐츠로 취급해야 합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="번들은 감지되지만 capability가 실행되지 않음">
    `openclaw plugins inspect <id>`를 실행하세요. capability가 나열되지만
    연결되지 않은 것으로 표시된다면, 이는 설치 문제라기보다 제품의 제한입니다.
  </Accordion>

  <Accordion title="Claude 명령 파일이 나타나지 않음">
    번들이 활성화되어 있고 markdown 파일이 감지된
    `commands/` 또는 `skills/` 루트 안에 있는지 확인하세요.
  </Accordion>

  <Accordion title="Claude 설정이 적용되지 않음">
    `settings.json`의 내장 Pi 설정만 지원됩니다. OpenClaw는
    번들 설정을 원시 config patch로 취급하지 않습니다.
  </Accordion>

  <Accordion title="Claude hook이 실행되지 않음">
    `hooks/hooks.json`은 감지 전용입니다. 실행 가능한 hook이 필요하면
    OpenClaw hook-pack 레이아웃을 사용하거나 네이티브 Plugin을 제공하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin 설치 및 구성](/ko/tools/plugin)
- [Building Plugins](/ko/plugins/building-plugins) — 네이티브 Plugin 만들기
- [Plugin Manifest](/ko/plugins/manifest) — 네이티브 manifest 스키마
