---
read_when:
    - Gateway Plugins 또는 호환 번들을 설치하거나 관리하려고 합니다
    - Plugin 로드 실패를 디버깅하려고 합니다
summary: '`openclaw plugins`용 CLI 참조(목록, 설치, marketplace, 제거, 활성화/비활성화, doctor)'
title: Plugins
x-i18n:
    generated_at: "2026-04-24T06:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway Plugins, 훅 팩, 호환 번들을 관리합니다.

관련:

- Plugin 시스템: [Plugins](/ko/tools/plugin)
- 번들 호환성: [Plugin 번들](/ko/plugins/bundles)
- Plugin 매니페스트 + 스키마: [Plugin 매니페스트](/ko/plugins/manifest)
- 보안 강화: [보안](/ko/gateway/security)

## 명령

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

번들 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화됩니다(예:
번들 모델 provider, 번들 음성 provider, 번들 browser
Plugin). 다른 것들은 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugins는 인라인 JSON
Schema(`configSchema`, 비어 있어도 포함)을 가진 `openclaw.plugin.json`을 제공해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 list/info
출력은 번들 하위 유형(`codex`, `claude`, 또는 `cursor`)과 감지된 번들
capability도 표시합니다.

### 설치

```bash
openclaw plugins install <package>                      # ClawHub 우선, 그다음 npm
openclaw plugins install clawhub:<package>              # ClawHub 전용
openclaw plugins install <package> --force              # 기존 설치 덮어쓰기
openclaw plugins install <package> --pin                # 버전 고정
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 로컬 경로
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (명시적)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

범용 package 이름은 먼저 ClawHub에서 확인한 다음 npm에서 확인합니다. 보안 참고:
Plugin 설치는 코드를 실행하는 것처럼 취급하세요. 가능하면 버전을 고정하세요.

`plugins` 섹션이 단일 파일 `$include`로 구성되어 있으면, `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 직접 기록하고 `openclaw.json`은 건드리지 않습니다. 루트 include, include 배열, 형제 재정의가 있는 include는 평탄화하는 대신 fail closed됩니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참조하세요.

구성이 유효하지 않으면 `plugins install`은 일반적으로 fail closed되고 먼저
`openclaw doctor --fix`를 실행하라고 안내합니다. 문서화된 유일한 예외는
`openclaw.install.allowInvalidConfigRecovery`를 명시적으로 선택한 Plugin에 대한 좁은
번들 Plugin 복구 경로입니다.

`--force`는 기존 설치 대상을 재사용하고 이미 설치된
Plugin 또는 훅 팩을 제자리에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub package 또는 npm 아티팩트에서 동일한 ID를 의도적으로 다시 설치할 때 사용하세요.
이미 추적 중인 npm Plugin의 일반 업그레이드에는
`openclaw plugins update <id-or-npm-spec>`를 권장합니다.

이미 설치된 Plugin ID에 대해 `plugins install`을 실행하면, OpenClaw는
중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를,
정말로 다른 소스에서 현재 설치를 덮어쓰려는 경우에는
`plugins install <package> --force`를 안내합니다.

`--pin`은 npm 설치에만 적용됩니다. `--marketplace`와 함께는 지원되지 않습니다.
marketplace 설치는 npm spec 대신 marketplace 소스 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한 비상 옵션입니다.
내장 스캐너가 `critical` 결과를 보고해도 설치를 계속 진행할 수 있게 하지만, Plugin `before_install` 훅 정책 차단은 **우회하지 않으며**
스캔 실패도 우회하지 않습니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 skill
의존성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하지만, `openclaw skills install`은 별도의 ClawHub skill
다운로드/설치 흐름으로 남습니다.

`plugins install`은 `package.json`에 `openclaw.hooks`를 노출하는 훅 팩의 설치 표면이기도 합니다.
패키지 설치가 아니라 필터링된 훅 가시성과 훅별 활성화에는 `openclaw hooks`를 사용하세요.

Npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 의존성 설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

범용 spec과 `@latest`는 stable 트랙을 유지합니다. npm이 이 둘 중 하나를 prerelease로 확인하면, OpenClaw는 중단하고
`@beta`/`@rc` 같은 prerelease 태그 또는
`@1.2.3-beta.4` 같은 정확한 prerelease 버전으로 명시적으로 선택하라고 요청합니다.

범용 설치 spec이 번들 Plugin ID와 일치하면(예: `diffs`), OpenClaw는
번들 Plugin을 직접 설치합니다. 같은 이름의 npm package를 설치하려면 명시적인 scoped spec(예: `@scope/diffs`)을 사용하세요.

지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace 설치도 지원됩니다.

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

이제 OpenClaw는 범용 npm-safe Plugin spec에도 ClawHub를 우선 사용합니다. ClawHub에 해당 package나 버전이 없을 때만
npm으로 폴백합니다:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw는 ClawHub에서 package 아카이브를 다운로드하고, 광고된
Plugin API / 최소 Gateway 호환성을 확인한 다음, 일반
아카이브 경로로 설치합니다. 기록된 설치는 나중 업데이트를 위해 ClawHub 소스 메타데이터를 유지합니다.

marketplace 이름이 Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 존재하면
`plugin@marketplace` 축약형을 사용하세요:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace 소스를 명시적으로 전달하려면 `--marketplace`를 사용하세요:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplace 소스는 다음 중 하나일 수 있습니다:

- `~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름
- 로컬 marketplace 루트 또는 `marketplace.json` 경로
- `owner/repo` 같은 GitHub 저장소 축약형
- `https://github.com/owner/repo` 같은 GitHub 저장소 URL
- git URL

GitHub 또는 git에서 로드한 원격 marketplace의 경우, Plugin 항목은 클론된 marketplace 저장소 내부에 있어야 합니다. OpenClaw는 해당 저장소의 상대 경로 소스를 허용하고, 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 비경로 Plugin 소스는 거부합니다.

로컬 경로와 아카이브의 경우, OpenClaw는 자동으로 감지합니다:

- 네이티브 OpenClaw Plugins (`openclaw.plugin.json`)
- Codex 호환 번들 (`.codex-plugin/plugin.json`)
- Claude 호환 번들 (`.claude-plugin/plugin.json` 또는 기본 Claude
  component 레이아웃)
- Cursor 호환 번들 (`.cursor-plugin/plugin.json`)

호환 번들은 일반 Plugin 루트에 설치되고
동일한 list/info/enable/disable 흐름에 참여합니다. 현재는 번들 Skills, Claude
command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` /
매니페스트 선언 `lspServers` 기본값, Cursor command-skills, 호환
Codex hook 디렉터리가 지원됩니다. 그 외 감지된 번들 capability는 진단/info에 표시되지만 아직 런타임 실행에 연결되지는 않습니다.

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

로드된 Plugin만 보려면 `--enabled`를 사용하세요. `--verbose`를 사용하면
표 보기에서 소스/출처/버전/활성화
메타데이터가 포함된 Plugin별 상세 줄로 전환됩니다. 머신 판독 가능한 인벤토리와 레지스트리
진단에는 `--json`을 사용하세요.

로컬 디렉터리를 복사하지 않으려면 `--link`를 사용하세요(`plugins.load.paths`에 추가):

```bash
openclaw plugins install -l ./my-plugin
```

링크된 설치는 관리되는 설치 대상을 덮어쓰는 대신 소스 경로를 재사용하므로 `--link`와 함께 `--force`는 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서
확인된 정확한 spec(`name@version`)을 `plugins.installs`에 저장합니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 `plugins.entries`, `plugins.installs`,
Plugin 허용 목록, 그리고 해당되는 경우 링크된 `plugins.load.paths` 항목에서 Plugin 기록을 제거합니다.
Active Memory Plugins의 경우 메모리 슬롯은 `memory-core`로 재설정됩니다.

기본적으로 제거는 활성
state-dir Plugin 루트 아래의 Plugin 설치 디렉터리도 삭제합니다.
디스크에 파일을 유지하려면
`--keep-files`를 사용하세요.

`--keep-config`는 더 이상 권장되지 않는 `--keep-files`의 별칭으로 지원됩니다.

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 `plugins.installs`의 추적된 설치와 `hooks.internal.installs`의 추적된 훅 팩
설치에 적용됩니다.

Plugin ID를 전달하면 OpenClaw는 해당
Plugin에 대해 기록된 설치 spec을 재사용합니다. 즉, 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된 버전이 이후 `update <id>` 실행에서도 계속 사용됩니다.

npm 설치의 경우 dist-tag
또는 정확한 버전이 포함된 명시적인 npm package spec을 전달할 수도 있습니다. OpenClaw는 해당 package 이름을 다시 추적된 Plugin
기록으로 확인하고, 설치된 Plugin을 업데이트하며, 이후 ID 기반 업데이트를 위해 새로운 npm spec을 기록합니다.

버전이나 태그 없이 npm package 이름을 전달해도 추적된 Plugin 기록으로 다시 확인됩니다. Plugin이 정확한 버전에 고정되어 있었고
레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

실제 npm 업데이트 전에 OpenClaw는 설치된 package 버전을
npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트
정체성이 이미 확인된 대상과 일치하면, 다운로드, 재설치, `openclaw.json` 재기록 없이 업데이트를 건너뜁니다.

저장된 무결성 해시가 존재하고 가져온 아티팩트 해시가 변경되면,
OpenClaw는 이를 npm 아티팩트 드리프트로 간주합니다. 대화형
`openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고
진행 전 확인을 요청합니다. 비대화형 업데이트 도우미는 호출자가 명시적인 계속 정책을 제공하지 않으면 fail closed됩니다.

`--dangerously-force-unsafe-install`은 Plugin 업데이트 중
내장 위험 코드 스캔 오탐에 대한 비상 재정의로 `plugins update`에서도 사용할 수 있습니다. 여전히 Plugin `before_install` 정책 차단이나
스캔 실패 차단은 우회하지 않으며, 훅 팩 업데이트가 아닌 Plugin 업데이트에만 적용됩니다.

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

단일 Plugin에 대한 심층 검사입니다. 정체성, 로드 상태, 소스,
등록된 capability, 훅, 도구, 명령, 서비스, Gateway 메서드,
HTTP 라우트, 정책 플래그, 진단, 설치 메타데이터, 번들 capability,
감지된 MCP 또는 LSP 서버 지원을 보여줍니다.

각 Plugin은 런타임에 실제로 등록하는 내용에 따라 분류됩니다:

- **plain-capability** — 하나의 capability 유형만 있음(예: provider 전용 Plugin)
- **hybrid-capability** — 여러 capability 유형이 있음(예: text + speech + images)
- **hook-only** — capability나 표면 없이 훅만 있음
- **non-capability** — capability 없이 tools/commands/services만 있음

capability 모델에 대한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

`--json` 플래그는 스크립팅 및
감사에 적합한 머신 판독 가능한 보고서를 출력합니다.

`inspect --all`은 shape, capability kinds,
호환성 공지, 번들 capability, 훅 요약 열이 포함된 전체 플릿 테이블을 렌더링합니다.

`info`는 `inspect`의 별칭입니다.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/검색 진단, 그리고
호환성 공지를 보고합니다. 모든 것이 깨끗하면 `No plugin issues
detected.`를 출력합니다.

`register`/`activate` export 누락 같은 모듈 형태 실패의 경우,
진단 출력에 간단한 export 형태 요약을 포함하려면
`OPENCLAW_PLUGIN_LOAD_DEBUG=1`과 함께 다시 실행하세요.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 목록은 로컬 marketplace 경로, `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub 저장소 URL, 또는 git URL을 받습니다. `--json`은
확인된 소스 레이블과 파싱된 marketplace 매니페스트 및
Plugin 항목을 출력합니다.

## 관련

- [CLI 참조](/ko/cli)
- [Plugins 빌드하기](/ko/plugins/building-plugins)
- [커뮤니티 Plugins](/ko/plugins/community)
