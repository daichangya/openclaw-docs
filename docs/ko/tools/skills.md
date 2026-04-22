---
read_when:
    - Skills 추가 또는 수정하기
    - Skill 게이팅 또는 로드 규칙 변경하기
summary: 'Skills: 관리형 vs 작업공간, 게이팅 규칙, 구성/env wiring'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw는 에이전트에게 도구 사용 방법을 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** skill 폴더를 사용합니다. 각 skill은 YAML frontmatter와 지침이 들어 있는 `SKILL.md`를 포함하는 디렉터리입니다. OpenClaw는 **번들 skill**과 선택적 로컬 재정의를 로드하고, 환경, 구성, 바이너리 존재 여부를 기준으로 로드 시점에 이를 필터링합니다.

## 위치와 우선순위

OpenClaw는 다음 소스에서 skills를 로드합니다.

1. **추가 skill 폴더**: `skills.load.extraDirs`로 구성
2. **번들 skills**: 설치물(npm 패키지 또는 OpenClaw.app)과 함께 제공
3. **관리형/로컬 skills**: `~/.openclaw/skills`
4. **개인 agent skills**: `~/.agents/skills`
5. **프로젝트 agent skills**: `<workspace>/.agents/skills`
6. **작업공간 skills**: `<workspace>/skills`

skill 이름이 충돌하면 우선순위는 다음과 같습니다.

`<workspace>/skills`(가장 높음) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 skills → `skills.load.extraDirs`(가장 낮음)

## 에이전트별 skills vs 공유 skills

**멀티 에이전트** 설정에서는 각 에이전트가 자체 작업공간을 가집니다. 즉:

- **에이전트별 skills**는 해당 에이전트 전용 `<workspace>/skills`에 있습니다.
- **프로젝트 agent skills**는 `<workspace>/.agents/skills`에 있으며
  일반 작업공간 `skills/` 폴더보다 먼저 해당 작업공간에 적용됩니다.
- **개인 agent skills**는 `~/.agents/skills`에 있으며 해당 머신의
  작업공간 전반에 적용됩니다.
- **공유 skills**는 `~/.openclaw/skills`(관리형/로컬)에 있으며 같은 머신의
  **모든 에이전트**에서 볼 수 있습니다.
- 여러 에이전트가 공통 skills 팩을 사용하도록 하려면
  `skills.load.extraDirs`를 통해 **공유 폴더**를 추가할 수도 있습니다(가장 낮은 우선순위).

같은 skill 이름이 여러 위치에 있으면 일반 우선순위가
적용됩니다. 작업공간이 우선이고, 그다음 프로젝트 agent skills, 개인 agent skills,
관리형/로컬, 번들, extra dirs 순입니다.

## 에이전트 skill 허용 목록

Skill **위치**와 skill **가시성**은 별개의 제어입니다.

- 위치/우선순위는 같은 이름의 skill 사본 중 어느 것이 우선하는지 결정합니다.
- 에이전트 허용 목록은 보이는 skill 중 에이전트가 실제로 사용할 수 있는 skill을 결정합니다.

공유 기준선에는 `agents.defaults.skills`를 사용하고, 에이전트별 재정의에는
`agents.list[].skills`를 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // defaults 대체
      { id: "locked-down", skills: [] }, // skills 없음
    ],
  },
}
```

규칙:

- 기본적으로 skills를 제한하지 않으려면 `agents.defaults.skills`를 생략합니다.
- `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략합니다.
- skills 없음으로 하려면 `agents.list[].skills: []`를 설정합니다.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  defaults와 병합되지 않습니다.

OpenClaw는 프롬프트 빌드, skill 슬래시 명령 검색, sandbox 동기화, skill 스냅샷 전반에 걸쳐 유효한 에이전트 skill 집합을 적용합니다.

## Plugins + skills

Plugins는 `openclaw.plugin.json`에 `skills` 디렉터리(Plugin 루트 기준 상대 경로)를 나열하여
자체 skills를 제공할 수 있습니다. Plugin이 활성화되면 Plugin skills가 로드됩니다. 현재 이 디렉터리들은 `skills.load.extraDirs`와 같은 저우선순위 경로로 병합되므로, 같은 이름의 번들,
관리형, agent, 또는 작업공간 skill이 이를 재정의합니다.
Plugin 구성 항목의 `metadata.openclaw.requires.config`를 통해 이를 게이팅할 수 있습니다.
검색/구성은 [Plugins](/ko/tools/plugin), 해당 skills가 가르치는 도구 표면은 [Tools](/ko/tools)를 참고하세요.

## Skill Workshop

선택적 실험 기능인 Skill Workshop Plugin은 에이전트 작업 중 관찰된 재사용 가능한 절차로부터 작업공간
skills를 생성하거나 업데이트할 수 있습니다. 기본적으로 비활성화되어 있으며
`plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 기록하고, 생성된 콘텐츠를 검사하며,
보류 중 승인 또는 자동 안전 쓰기를 지원하고, 안전하지 않은
제안을 격리하며, 성공적으로 기록한 뒤에는 skill 스냅샷을 새로 고쳐
Gateway 재시작 없이 새 skills를 사용할 수 있게 합니다.

“다음에는 GIF 출처를 확인하라” 같은 수정 사항이나
미디어 QA 체크리스트 같은 어렵게 얻은 워크플로를 영구적인 절차 지침으로 만들고 싶을 때 사용하세요. 보류 중 승인부터 시작하고, 제안을 검토한 뒤 신뢰할 수 있는 작업공간에서만 자동 쓰기를 사용하세요. 전체 가이드:
[Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw용 공개 skills 레지스트리입니다.
[https://clawhub.ai](https://clawhub.ai)에서 찾아볼 수 있습니다. 검색/설치/업데이트에는 네이티브 `openclaw skills`
명령을 사용하고, publish/sync 워크플로가 필요할 때는 별도의 `clawhub` CLI를 사용하세요.
전체 가이드: [ClawHub](/ko/tools/clawhub).

일반적인 흐름:

- 작업공간에 skill 설치:
  - `openclaw skills install <skill-slug>`
- 설치된 모든 skills 업데이트:
  - `openclaw skills update --all`
- 동기화(스캔 + 업데이트 게시):
  - `clawhub sync --all`

네이티브 `openclaw skills install`은 활성 작업공간의 `skills/`
디렉터리에 설치합니다. 별도의 `clawhub` CLI도 현재 작업 디렉터리 아래 `./skills`에 설치하며
(또는 구성된 OpenClaw 작업공간으로 폴백). OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.

## 보안 참고 사항

- 서드파티 skills는 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
- 신뢰할 수 없는 입력과 위험한 도구에는 sandbox 실행을 선호하세요. [Sandboxing](/ko/gateway/sandboxing)을 참고하세요.
- 작업공간 및 extra-dir skill 검색은 해석된 realpath가 구성된 루트 내부에 머무는 skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 skill 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 메타데이터를 실행하기 전에 내장 위험 코드 스캐너를 실행합니다. `critical` 발견은 호출자가 명시적으로 위험 재정의를 설정하지 않는 한 기본적으로 차단되며, 의심스러운 발견은 계속 경고만 합니다.
- `openclaw skills install <slug>`는 다릅니다. ClawHub skill 폴더를 작업공간에 다운로드하며 위의 설치 메타데이터 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴에 대해 **호스트** 프로세스에
  비밀을 주입합니다(sandbox 아님). 프롬프트와 로그에는 비밀을 넣지 마세요.
- 더 넓은 위협 모델과 체크리스트는 [Security](/ko/gateway/security)를 참고하세요.

## 형식(AgentSkills + Pi 호환)

`SKILL.md`에는 최소한 다음이 포함되어야 합니다.

```markdown
---
name: image-lab
description: 프로바이더 기반 이미지 워크플로를 통해 이미지를 생성하거나 편집
---
```

참고:

- 레이아웃/의도에는 AgentSkills 사양을 따릅니다.
- 내장 에이전트가 사용하는 파서는 **한 줄짜리** frontmatter 키만 지원합니다.
- `metadata`는 **한 줄짜리 JSON 객체**여야 합니다.
- 지침에서 skill 폴더 경로를 참조하려면 `{baseDir}`를 사용하세요.
- 선택적 frontmatter 키:
  - `homepage` — macOS Skills UI에서 “Website”로 표시되는 URL(`metadata.openclaw.homepage`로도 지원).
  - `user-invocable` — `true|false`(기본값: `true`). `true`이면 skill이 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false`(기본값: `false`). `true`이면 skill이 모델 프롬프트에서 제외됩니다(여전히 사용자 호출로는 사용 가능).
  - `command-dispatch` — `tool`(선택 사항). `tool`로 설정하면 슬래시 명령이 모델을 우회하고 직접 도구로 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정되었을 때 호출할 도구 이름.
  - `command-arg-mode` — `raw`(기본값). 도구 디스패치의 경우 원시 args 문자열을 도구에 전달합니다(코어 파싱 없음).

    도구는 다음 params로 호출됩니다:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅(로드 시점 필터)

OpenClaw는 `metadata`(한 줄짜리 JSON)를 사용하여 **로드 시점에 skills를 필터링**합니다.

```markdown
---
name: image-lab
description: 프로바이더 기반 이미지 워크플로를 통해 이미지를 생성하거나 편집
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 아래 필드:

- `always: true` — 항상 skill을 포함합니다(다른 게이트 건너뜀).
- `emoji` — macOS Skills UI에서 사용하는 선택적 이모지.
- `homepage` — macOS Skills UI에서 “Website”로 표시되는 선택적 URL.
- `os` — 선택적 플랫폼 목록(`darwin`, `linux`, `win32`). 설정되면 해당 OS에서만 skill이 적격입니다.
- `requires.bins` — 목록. 각각이 `PATH`에 존재해야 합니다.
- `requires.anyBins` — 목록. 그중 최소 하나가 `PATH`에 존재해야 합니다.
- `requires.env` — 목록. env var가 존재해야 하며, **또는** 구성에서 제공되어야 합니다.
- `requires.config` — truthy여야 하는 `openclaw.json` 경로 목록.
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연관된 env var 이름.
- `install` — macOS Skills UI에서 사용하는 선택적 설치 프로그램 사양 배열(brew/node/go/uv/download).

sandboxing 참고:

- `requires.bins`는 skill 로드 시점에 **호스트**에서 확인됩니다.
- 에이전트가 sandboxed이면 해당 바이너리도 **컨테이너 내부에**
  존재해야 합니다.
  `agents.defaults.sandbox.docker.setupCommand`(또는 사용자 지정 이미지)로 이를 설치하세요.
  `setupCommand`는 컨테이너가 생성된 후 한 번 실행됩니다.
  패키지 설치에는 네트워크 egress, 쓰기 가능한 루트 FS, sandbox의 루트 사용자도 필요합니다.
  예: `summarize` skill(`skills/summarize/SKILL.md`)은 वहां 실행하려면
  sandbox 컨테이너 안에 `summarize` CLI가 있어야 합니다.

설치 프로그램 예시:

```markdown
---
name: gemini
description: 코딩 지원과 Google 검색 조회에 Gemini CLI를 사용합니다.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Gemini CLI 설치(brew)",
            },
          ],
      },
  }
---
```

참고:

- 여러 설치 프로그램이 나열되면 gateway는 **하나의** 선호 옵션을 선택합니다(가능하면 brew, 아니면 node).
- 모든 설치 프로그램이 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 나열합니다.
- 설치 프로그램 사양에는 플랫폼별 옵션 필터링을 위한 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
- Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun).
  이는 **skill 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에는 Bun이 권장되지 않음).
- Gateway 기반 설치 프로그램 선택은 node 전용이 아니라 선호도 기반입니다:
  install 사양에 여러 kind가 섞여 있으면 OpenClaw는
  `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 우선하고, 그다음 `uv`, 그다음
  구성된 node manager, 그다음 `go` 또는 `download` 같은 다른 폴백을 사용합니다.
- 모든 install spec이 `download`이면 OpenClaw는
  하나의 선호 설치 프로그램으로 축약하지 않고 모든 다운로드 옵션을 노출합니다.
- Go 설치: `go`가 없고 `brew`가 있으면 gateway는 먼저 Homebrew로 Go를 설치하고 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
- Download 설치: `url`(필수), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: archive 감지 시 자동), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면 해당 skill은 항상 적격입니다(
구성에서 비활성화되었거나 번들 skills에 대해 `skills.allowBundled`에 의해 차단되지 않는 한).

## 구성 재정의 (`~/.openclaw/openclaw.json`)

번들/관리형 skills는 토글할 수 있고 env 값을 제공할 수 있습니다.

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 평문 문자열
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

참고: skill 이름에 하이픈이 포함되어 있으면 키를 따옴표로 감싸세요(JSON5는 따옴표가 있는 키를 허용합니다).

OpenClaw 자체 내부에서 기본 이미지 생성/편집을 원한다면, 번들
skill 대신 `agents.defaults.imageGenerationModel`과 함께 코어
`image_generate` 도구를 사용하세요. 여기의 skill 예시는 사용자 지정 또는 서드파티 워크플로용입니다.

네이티브 이미지 분석에는 `agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요.
네이티브 이미지 생성/편집에는
`agents.defaults.imageGenerationModel`과 함께 `image_generate`를 사용하세요. `openai/*`, `google/*`,
`fal/*` 또는 다른 프로바이더별 이미지 모델을 선택한다면, 해당 프로바이더의 인증/API
키도 추가하세요.

구성 키는 기본적으로 **skill 이름**과 일치합니다. skill이
`metadata.openclaw.skillKey`를 정의한다면, `skills.entries` 아래에서 해당 키를 사용하세요.

규칙:

- `enabled: false`는 번들/설치된 skill이라도 비활성화합니다.
- `env`: 변수가 프로세스에 아직 설정되지 않은 경우에만 **주입**됩니다.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언한 skills를 위한 편의 기능입니다.
  평문 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.
- `config`: 사용자 지정 skill별 필드를 위한 선택적 가방입니다. 사용자 지정 키는 여기에 있어야 합니다.
- `allowBundled`: **번들** skills에만 적용되는 선택적 허용 목록입니다. 설정되면
  목록에 있는 번들 skills만 적격입니다(관리형/작업공간 skills는 영향 없음).

## 환경 주입(에이전트 실행별)

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

1. skill 메타데이터를 읽습니다.
2. 모든 `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를
   `process.env`에 적용합니다.
3. **적격** skills로 시스템 프롬프트를 빌드합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

이 범위는 전역 셸 환경이 아니라 **에이전트 실행 범위**입니다.

번들 `claude-cli` 백엔드의 경우, OpenClaw는 동일한
적격 스냅샷을 임시 Claude Code Plugin으로 구체화하고
`--plugin-dir`과 함께 전달합니다. 그러면 Claude Code는 네이티브 skill resolver를 사용할 수 있고, OpenClaw는 여전히 우선순위, 에이전트별 허용 목록, 게이팅,
`skills.entries.*` env/API 키 주입을 소유합니다. 다른 CLI 백엔드는 프롬프트
카탈로그만 사용합니다.

## 세션 스냅샷(성능)

OpenClaw는 **세션이 시작될 때** 적격 skills를 스냅샷하고 같은 세션의 이후 턴에서 그 목록을 재사용합니다. skills 또는 구성의 변경 사항은 다음 새 세션에서 적용됩니다.

skills watcher가 활성화되어 있거나 새 적격 원격 Node가 나타나면 skills는 세션 중간에도 새로 고쳐질 수 있습니다(아래 참고). 이를 **핫 리로드**로 생각하세요. 새로 고쳐진 목록은 다음 에이전트 턴에서 반영됩니다.

해당 세션의 유효한 에이전트 skill 허용 목록이 변경되면, OpenClaw는
가시적인 skills가 현재 에이전트와 정렬되도록 스냅샷을 새로 고칩니다.

## 원격 macOS Node(Linux gateway)

Gateway가 Linux에서 실행 중이지만 **macOS Node**가 연결되어 있고 **`system.run`이 허용된 경우**(Exec approvals 보안이 `deny`로 설정되지 않음), OpenClaw는 필요한 바이너리가 해당 Node에 존재할 때 macOS 전용 skills를 적격으로 취급할 수 있습니다. 에이전트는 `exec` 도구와 `host=node`를 사용해 해당 skills를 실행해야 합니다.

이는 Node가 명령 지원을 보고하고 `system.run`을 통한 bin probe에 의존합니다. macOS Node가 나중에 오프라인이 되면 skills는 계속 표시되지만, Node가 다시 연결될 때까지 호출은 실패할 수 있습니다.

## Skills watcher(자동 새로 고침)

기본적으로 OpenClaw는 skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 skills 스냅샷을 올립니다. 이는 `skills.load` 아래에서 구성합니다.

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## 토큰 영향(skills 목록)

skills가 적격이면 OpenClaw는 사용 가능한 skills의 간결한 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다.

- **기본 오버헤드(1개 이상의 skill이 있을 때만):** 195자.
- **skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이.

공식(문자 수):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고:

- XML 이스케이프는 `& < > " '`를 엔터티(`&amp;`, `&lt;` 등)로 확장하므로 길이가 증가합니다.
- 토큰 수는 모델 tokenizer에 따라 달라집니다. 대략적인 OpenAI 스타일 추정은 약 4자/토큰이므로, **97자 ≈ 24토큰**/skill + 실제 필드 길이입니다.

## 관리형 skills 수명주기

OpenClaw는 설치물의 일부로 **번들 skills**라는 기본 skill 집합을 제공합니다(npm 패키지 또는 OpenClaw.app). `~/.openclaw/skills`는 로컬
재정의용으로 존재합니다(예: 번들 사본을 변경하지 않고 skill을 고정/패치). 작업공간 skills는 사용자 소유이며 이름 충돌 시 둘 다 재정의합니다.

## 구성 참조

전체 구성 스키마는 [Skills config](/ko/tools/skills-config)를 참고하세요.

## 더 많은 skills를 찾고 있나요?

[https://clawhub.ai](https://clawhub.ai)를 둘러보세요.

---

## 관련 항목

- [Creating Skills](/ko/tools/creating-skills) — 사용자 지정 skills 만들기
- [Skills Config](/ko/tools/skills-config) — skill 구성 참조
- [Slash Commands](/ko/tools/slash-commands) — 사용 가능한 모든 슬래시 명령
- [Plugins](/ko/tools/plugin) — Plugin 시스템 개요
