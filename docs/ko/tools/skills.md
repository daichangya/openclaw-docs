---
read_when:
    - Skills 추가 또는 수정하기
    - Skill 게이팅 또는 로드 규칙 변경하기
summary: 'Skills: 관리형 vs 워크스페이스, 게이팅 규칙, 구성/env 연결'
title: Skills
x-i18n:
    generated_at: "2026-04-24T06:42:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw는 도구 사용법을 에이전트에게 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** Skill 폴더를 사용합니다. 각 Skill은 YAML frontmatter와 지침이 포함된 `SKILL.md`를 가진 디렉터리입니다. OpenClaw는 **번들 Skills**와 선택적 로컬 재정의를 로드하고, 환경, 구성, 바이너리 존재 여부에 따라 로드 시점에 필터링합니다.

## 위치와 우선순위

OpenClaw는 다음 소스에서 Skills를 로드합니다:

1. **추가 Skill 폴더**: `skills.load.extraDirs`로 구성
2. **번들 Skills**: 설치물(npm 패키지 또는 OpenClaw.app)에 포함
3. **관리형/로컬 Skills**: `~/.openclaw/skills`
4. **개인 agent Skills**: `~/.agents/skills`
5. **프로젝트 agent Skills**: `<workspace>/.agents/skills`
6. **워크스페이스 Skills**: `<workspace>/skills`

Skill 이름이 충돌하면 우선순위는 다음과 같습니다:

`<workspace>/skills` (가장 높음) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 Skills → `skills.load.extraDirs` (가장 낮음)

## 에이전트별 Skills vs 공유 Skills

**멀티 에이전트** 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다. 이는 다음을 의미합니다:

- **에이전트별 Skills**는 해당 에이전트 전용 `<workspace>/skills`에 있습니다.
- **프로젝트 agent Skills**는 `<workspace>/.agents/skills`에 있으며,
  일반 워크스페이스 `skills/` 폴더보다 먼저 해당 워크스페이스에 적용됩니다.
- **개인 agent Skills**는 `~/.agents/skills`에 있으며,
  그 머신의 모든 워크스페이스에 적용됩니다.
- **공유 Skills**는 `~/.openclaw/skills`(관리형/로컬)에 있으며 동일 머신의
  **모든 에이전트**에서 볼 수 있습니다.
- **공유 폴더**는 `skills.load.extraDirs`를 통해 추가할 수도 있습니다(가장 낮은
  우선순위). 여러 에이전트가 사용하는 공통 Skills 팩에 적합합니다.

같은 Skill 이름이 여러 위치에 있으면 일반적인 우선순위가
적용됩니다: 워크스페이스가 우선이고, 그다음 프로젝트 agent Skills, 그다음 개인 agent Skills,
그다음 관리형/로컬, 그다음 번들, 그다음 추가 디렉터리입니다.

## 에이전트 Skill allowlist

Skill **위치**와 Skill **가시성**은 별도의 제어입니다.

- 위치/우선순위는 같은 이름의 Skill 중 어떤 사본이 이기는지 결정합니다.
- 에이전트 allowlist는 보이는 Skills 중 실제로 어떤 것을 에이전트가 사용할 수 있는지 결정합니다.

공유 기본값에는 `agents.defaults.skills`를 사용하고, 에이전트별 재정의에는
`agents.list[].skills`를 사용하세요:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

규칙:

- 기본적으로 Skills를 제한 없이 허용하려면 `agents.defaults.skills`를 생략하세요.
- `agents.defaults.skills`를 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills가 없게 하려면 `agents.list[].skills: []`로 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  기본값과 병합되지 않습니다.

OpenClaw는 유효한 에이전트 Skill 집합을 프롬프트 빌드, Skill
슬래시 명령 discovery, 샌드박스 동기화, Skill 스냅샷 전반에 적용합니다.

## Plugins + Skills

Plugins는 `openclaw.plugin.json`에
`skills` 디렉터리(Plugin 루트 기준 상대 경로)를 나열하여 자체 Skill을 제공할 수 있습니다. Plugin Skill은 Plugin이 활성화될 때 로드됩니다. 현재 이 디렉터리들은 `skills.load.extraDirs`와 같은
낮은 우선순위 경로로 병합되므로, 동일한 이름의 번들,
관리형, agent, 워크스페이스 Skill이 이를 재정의합니다.
Plugin의 구성
항목에서 `metadata.openclaw.requires.config`를 통해 이를 게이트할 수 있습니다.
발견/구성은 [Plugins](/ko/tools/plugin), 해당
Skill이 가르치는 도구 표면은 [도구](/ko/tools)를 참조하세요.

## Skill Workshop

선택적이고 실험적인 Skill Workshop Plugin은 agent 작업 중 관찰된 재사용 가능한 절차로부터 워크스페이스 Skill을 생성하거나 업데이트할 수 있습니다. 기본적으로 비활성화되어 있으며,
`plugins.entries.skill-workshop`을 통해 명시적으로 활성화해야 합니다.

Skill Workshop은 `<workspace>/skills`에만 쓰고, 생성된 내용을 스캔하며,
대기 승인 또는 자동 안전 쓰기를 지원하고, 안전하지 않은
제안을 격리하며, 성공적인 쓰기 후 Skill 스냅샷을 새로 고쳐
Gateway 재시작 없이 새 Skill을 사용할 수 있게 합니다.

“다음에는 GIF attribution을 검증하라” 같은 수정사항이나
미디어 QA 체크리스트 같은 힘들게 얻은 워크플로를 지속적인 절차 지침으로 만들고 싶을 때 사용하세요. 먼저 대기 승인으로 시작하고, 제안을 검토한 뒤 신뢰된 워크스페이스에서만 자동 쓰기를 사용하세요. 전체 가이드:
[Skill Workshop Plugin](/ko/plugins/skill-workshop).

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw의 공개 Skill 레지스트리입니다. 탐색은
[https://clawhub.ai](https://clawhub.ai)에서 할 수 있습니다. Skill 검색/설치/업데이트에는 네이티브 `openclaw skills`
명령을 사용하고, 게시/동기화 워크플로가 필요하면 별도의 `clawhub` CLI를 사용하세요.
전체 가이드: [ClawHub](/ko/tools/clawhub).

일반적인 흐름:

- 워크스페이스에 Skill 설치:
  - `openclaw skills install <skill-slug>`
- 설치된 모든 Skill 업데이트:
  - `openclaw skills update --all`
- 동기화(스캔 + 업데이트 게시):
  - `clawhub sync --all`

네이티브 `openclaw skills install`은 활성 워크스페이스 `skills/`
디렉터리에 설치합니다. 별도 `clawhub` CLI도 현재 작업 디렉터리의 `./skills`에 설치하며
(또는 구성된 OpenClaw 워크스페이스로 폴백),
다음 세션에서 OpenClaw는 이를 `<workspace>/skills`로 인식합니다.

## 보안 참고

- 서드파티 Skill은 **신뢰할 수 없는 코드**로 취급하세요. 활성화 전에 읽어보세요.
- 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 우선하세요. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
- 워크스페이스 및 extra-dir Skill discovery는 확인된 realpath가 구성된 루트 내부에 머무는 Skill 루트와 `SKILL.md` 파일만 허용합니다.
- Gateway 기반 Skill 의존성 설치(`skills.install`, 온보딩, Skills 설정 UI)는 설치 메타데이터를 실행하기 전에 내장 위험 코드 스캐너를 실행합니다. `critical` 결과는 호출자가 명시적으로 위험한 재정의를 설정하지 않는 한 기본적으로 차단되며, 의심스러운 결과는 여전히 경고만 합니다.
- `openclaw skills install <slug>`는 다릅니다: ClawHub Skill 폴더를 워크스페이스로 다운로드하며 위의 installer-metadata 경로를 사용하지 않습니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는
  **샌드박스가 아니라 호스트** 프로세스에 secret을 주입합니다(해당 에이전트 턴용).
  secret을 프롬프트와 로그에 넣지 마세요.
- 더 넓은 위협 모델과 체크리스트는 [보안](/ko/gateway/security)을 참조하세요.

## 형식 (AgentSkills + Pi 호환)

`SKILL.md`는 최소한 다음을 포함해야 합니다:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

참고:

- 레이아웃/의도는 AgentSkills 사양을 따릅니다.
- 임베디드 에이전트가 사용하는 parser는 **단일 줄** frontmatter 키만 지원합니다.
- `metadata`는 **단일 줄 JSON 객체**여야 합니다.
- Skill 폴더 경로를 참조하려면 지침에서 `{baseDir}`를 사용하세요.
- 선택적 frontmatter 키:
  - `homepage` — macOS Skills UI에서 “Website”로 표시되는 URL (`metadata.openclaw.homepage`를 통해서도 지원).
  - `user-invocable` — `true|false` (기본값: `true`). `true`일 때 Skill은 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false` (기본값: `false`). `true`일 때 Skill은 모델 프롬프트에서 제외됩니다(사용자 호출로는 계속 사용 가능).
  - `command-dispatch` — `tool` (선택 사항). `tool`로 설정하면 슬래시 명령이 모델을 우회하고 직접 도구로 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정되었을 때 호출할 도구 이름.
  - `command-arg-mode` — `raw` (기본값). 도구 디스패치 시 원시 args 문자열을 도구로 전달합니다(코어 파싱 없음).

    도구는 다음 params로 호출됩니다:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅(로드 시 필터)

OpenClaw는 `metadata`(단일 줄 JSON)를 사용해 **로드 시점에 Skills를 필터링**합니다:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
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

- `always: true` — Skill을 항상 포함(다른 게이트 건너뜀)
- `emoji` — macOS Skills UI에서 사용하는 선택적 이모지
- `homepage` — macOS Skills UI에서 “Website”로 표시되는 선택적 URL
- `os` — 선택적 플랫폼 목록 (`darwin`, `linux`, `win32`). 설정되면 해당 OS에서만 Skill이 적격함
- `requires.bins` — 목록; 각각이 `PATH`에 존재해야 함
- `requires.anyBins` — 목록; 그중 하나 이상이 `PATH`에 존재해야 함
- `requires.env` — 목록; env var가 존재해야 하거나 **또는** 구성에 제공되어야 함
- `requires.config` — truthy여야 하는 `openclaw.json` 경로 목록
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연결된 env var 이름
- `install` — macOS Skills UI에서 사용하는 선택적 installer 사양 배열 (brew/node/go/uv/download)

샌드박싱 참고:

- `requires.bins`는 Skill 로드 시점에 **호스트**에서 검사됩니다.
- 에이전트가 샌드박스 상태라면 해당 바이너리는 **컨테이너 내부에도** 존재해야 합니다.
  `agents.defaults.sandbox.docker.setupCommand`(또는 사용자 정의 이미지)로 설치하세요.
  `setupCommand`는 컨테이너 생성 후 한 번 실행됩니다.
  패키지 설치에는 네트워크 이그레스, 쓰기 가능한 루트 FS, 샌드박스 내 root 사용자도 필요합니다.
  예: `summarize` Skill (`skills/summarize/SKILL.md`)은 그곳에서 실행되려면
  샌드박스 컨테이너 안에 `summarize` CLI가 있어야 합니다.

설치기 예시:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
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
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

참고:

- 여러 installer가 나열되면 Gateway는 **하나의** 선호 옵션을 선택합니다(가능하면 brew, 아니면 node).
- 모든 installer가 `download`이면 OpenClaw는 사용 가능한 아티팩트를 볼 수 있도록 각 항목을 모두 나열합니다.
- Installer 사양에는 플랫폼별 옵션 필터링을 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
- Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun).
  이는 **Skill 설치에만** 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (Bun은 WhatsApp/Telegram에 권장되지 않음).
- Gateway 기반 installer 선택은 node 전용이 아니라 선호도 기반입니다:
  install 사양에 여러 종류가 섞여 있으면 OpenClaw는
  `skills.install.preferBrew`가 활성화되어 있고 `brew`가 존재할 때 Homebrew를 우선하고, 그다음 `uv`, 그다음
  구성된 node manager, 그다음 `go` 또는 `download` 같은 기타 폴백을 선택합니다.
- 모든 install spec이 `download`이면 OpenClaw는
  하나의 선호 installer로 축약하지 않고 모든 다운로드 옵션을 표시합니다.
- Go 설치: `go`가 없고 `brew`가 있으면 gateway는 먼저 Homebrew로 Go를 설치하고 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
- Download 설치: `url` (필수), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (기본값: archive 감지 시 자동), `stripComponents`, `targetDir` (기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면
구성에서 비활성화되지 않았고, 번들 Skill의 경우 `skills.allowBundled`에 의해 차단되지 않는 한 Skill은 항상 적격합니다.

## 구성 재정의 (`~/.openclaw/openclaw.json`)

번들/관리형 Skills는 토글할 수 있고 env 값을 제공받을 수 있습니다:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
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

참고: Skill 이름에 하이픈이 포함되어 있으면 키를 따옴표로 감싸세요(JSON5는 따옴표가 있는 키를 허용합니다).

OpenClaw 자체 내부에서 기본 이미지 생성/편집을 원한다면 번들 Skill 대신
코어 `image_generate` 도구와 `agents.defaults.imageGenerationModel`을 사용하세요. 여기의 Skill 예시는
사용자 정의 또는 서드파티 워크플로용입니다.

네이티브 이미지 분석에는 `agents.defaults.imageModel`과 함께 `image` 도구를 사용하세요.
네이티브 이미지 생성/편집에는
`agents.defaults.imageGenerationModel`과 함께 `image_generate`를 사용하세요. `openai/*`, `google/*`,
`fal/*` 또는 다른 provider별 이미지 모델을 선택했다면, 해당 provider의 인증/API
키도 추가하세요.

구성 키는 기본적으로 **Skill 이름**과 일치합니다. Skill이
`metadata.openclaw.skillKey`를 정의한 경우, `skills.entries` 아래에서는 그 키를 사용하세요.

규칙:

- `enabled: false`는 Skill이 번들/설치되어 있어도 비활성화합니다.
- `env`: 변수가 프로세스에 이미 설정되어 있지 **않을 때만** 주입됩니다.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언한 Skill을 위한
  편의 기능입니다.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.
- `config`: 사용자 정의 스킬별 필드를 위한 선택적 bag입니다. 사용자 정의 키는 여기에 있어야 합니다.
- `allowBundled`: **번들** Skills 전용 선택적 allowlist입니다. 설정되면
  목록에 있는 번들 Skills만 적격해집니다(관리형/워크스페이스 Skills는 영향받지 않음).

## 환경 주입 (에이전트 실행별)

에이전트 실행이 시작되면 OpenClaw는:

1. Skill 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를
   `process.env`에 적용합니다.
3. **적격한** Skills로 시스템 프롬프트를 빌드합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

이것은 전역 셸 환경이 아니라 **에이전트 실행 범위**입니다.

번들 `claude-cli` 백엔드의 경우 OpenClaw는 동일한
적격 스냅샷을 임시 Claude Code Plugin으로도 구체화하고,
`--plugin-dir`과 함께 전달합니다. 그러면 Claude Code가 네이티브 Skill 확인자를 사용할 수 있고, OpenClaw는 여전히 우선순위, 에이전트별 allowlist, 게이팅,
`skills.entries.*` env/API 키 주입을 소유합니다. 다른 CLI 백엔드는 프롬프트
카탈로그만 사용합니다.

## 세션 스냅샷 (성능)

OpenClaw는 세션이 시작될 때 적격 Skills를 스냅샷하고, 같은 세션의 후속 턴에 그 목록을 재사용합니다. Skills 또는 구성 변경 사항은 다음 새 세션부터 적용됩니다.

Skills watcher가 활성화되어 있거나 새로운 적격 원격 노드가 나타나면 세션 중간에도 Skills를 새로 고칠 수 있습니다(아래 참조). 이를 **핫 리로드**처럼 생각하면 됩니다: 새로 고쳐진 목록은 다음 에이전트 턴에서 반영됩니다.

해당 세션의 유효한 에이전트 Skill allowlist가 변경되면 OpenClaw는
보이는 Skills가 현재 에이전트와 계속 일치하도록 스냅샷을 새로 고칩니다.

## 원격 macOS 노드 (Linux Gateway)

Gateway가 Linux에서 실행 중이지만 **macOS 노드**가 연결되어 있고 **`system.run`이 허용되어 있을 때**(Exec approvals security가 `deny`가 아님), OpenClaw는 필요한 바이너리가 해당 노드에 있으면 macOS 전용 Skills를 적격한 것으로 취급할 수 있습니다. 에이전트는 `host=node`와 함께 `exec` 도구를 통해 해당 Skills를 실행해야 합니다.

이 기능은 노드가 명령 지원 상태를 보고하고 `system.run`을 통한 bin probe를 수행하는 것에 의존합니다. 이후 macOS 노드가 오프라인이 되더라도 Skills는 계속 보입니다. 노드가 다시 연결될 때까지 호출은 실패할 수 있습니다.

## Skills watcher (자동 새로 고침)

기본적으로 OpenClaw는 Skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 Skills 스냅샷을 갱신합니다. 이는 `skills.load` 아래에서 구성합니다:

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

## 토큰 영향 (Skills 목록)

Skills가 적격하면 OpenClaw는 사용 가능한 Skills의 압축된 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다:

- **기본 오버헤드 (Skill이 1개 이상일 때만):** 195자
- **Skill당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이

공식(문자 수):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고:

- XML 이스케이프는 `& < > " '`를 엔티티(`&amp;`, `&lt;` 등)로 확장하므로 길이가 증가합니다.
- 토큰 수는 모델 tokenizer에 따라 다릅니다. 대략적인 OpenAI 스타일 추정으로는 약 4자/토큰이므로 **97자 ≈ Skill당 24토큰** + 실제 필드 길이입니다.

## 관리형 Skills 수명 주기

OpenClaw는 설치물의 일부로 **번들 Skills**라는 기준 Skill 집합을 제공합니다
(npm 패키지 또는 OpenClaw.app). `~/.openclaw/skills`는 로컬
재정의용으로 존재합니다(예: 번들 사본을 변경하지 않고 Skill을 pin/patch). 워크스페이스 Skills는 사용자 소유이며 이름 충돌 시 둘 다 재정의합니다.

## 구성 참조

전체 구성 스키마는 [Skills 구성](/ko/tools/skills-config)을 참조하세요.

## 더 많은 Skills를 찾고 계신가요?

[https://clawhub.ai](https://clawhub.ai)에서 둘러보세요.

---

## 관련

- [Skills 만들기](/ko/tools/creating-skills) — 사용자 정의 Skills 빌드
- [Skills 구성](/ko/tools/skills-config) — Skill 구성 참조
- [슬래시 명령](/ko/tools/slash-commands) — 사용 가능한 모든 슬래시 명령
- [Plugins](/ko/tools/plugin) — Plugin 시스템 개요
