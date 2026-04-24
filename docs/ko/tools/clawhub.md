---
read_when:
    - 새 사용자에게 ClawHub를 소개하는 중입니다.
    - Skills 또는 Plugins를 설치, 검색 또는 게시하는 중입니다.
    - ClawHub CLI 플래그와 동기화 동작을 설명하는 중입니다.
summary: 'ClawHub 가이드: 공개 레지스트리, 네이티브 OpenClaw 설치 흐름 및 ClawHub CLI 워크플로우'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T06:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub는 **OpenClaw Skills와 Plugins**를 위한 공개 레지스트리입니다.

- Skills를 검색/설치/업데이트하고, Plugins를 ClawHub에서 설치하려면 네이티브 `openclaw` 명령어를 사용하세요.
- 레지스트리 인증, 게시, 삭제, 삭제 취소, 동기화 워크플로우가 필요할 때는 별도의 `clawhub` CLI를 사용하세요.

사이트: [clawhub.ai](https://clawhub.ai)

## 네이티브 OpenClaw 흐름

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

bare npm-safe Plugin spec도 npm보다 먼저 ClawHub에서 시도됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

네이티브 `openclaw` 명령어는 활성 workspace에 설치하며, 이후 `update` 호출이 ClawHub를 계속 사용할 수 있도록 소스 메타데이터를 영속화합니다.

Plugin 설치는 아카이브 설치가 실행되기 전에 광고된 `pluginApi`와 `minGatewayVersion` 호환성을 검증하므로, 호스트가 호환되지 않으면 패키지를 부분적으로 설치하는 대신 조기에 안전하게 실패합니다.

`openclaw plugins install clawhub:...`는 설치 가능한 Plugin 계열만 허용합니다.
ClawHub 패키지가 실제로는 Skill이라면 OpenClaw는 중단하고
대신 `openclaw skills install <slug>`를 사용하라고 안내합니다.

## ClawHub란 무엇인가

- OpenClaw Skills와 Plugins를 위한 공개 레지스트리
- Skill 번들과 메타데이터의 버전 관리 저장소
- 검색, 태그, 사용 신호를 위한 검색 표면

## 작동 방식

1. 사용자가 Skill 번들(파일 + 메타데이터)을 게시합니다.
2. ClawHub가 번들을 저장하고, 메타데이터를 파싱하고, 버전을 할당합니다.
3. 레지스트리가 검색 및 탐색을 위해 Skill을 인덱싱합니다.
4. 사용자가 Skills를 둘러보고, 다운로드하고, OpenClaw에 설치합니다.

## 할 수 있는 일

- 새 Skills와 기존 Skills의 새 버전을 게시
- 이름, 태그, 검색어로 Skills 탐색
- Skill 번들을 다운로드하고 파일을 확인
- 악의적이거나 안전하지 않은 Skills 신고
- moderator라면 숨기기, 숨김 해제, 삭제, 차단 수행

## 누구를 위한 것인가 (초보자 친화적)

OpenClaw 에이전트에 새로운 기능을 추가하고 싶다면, ClawHub는 Skills를 찾고 설치하는 가장 쉬운 방법입니다. 백엔드가 어떻게 동작하는지 알 필요는 없습니다. 할 수 있는 일:

- 자연어로 Skills 검색
- workspace에 Skill 설치
- 나중에 명령 한 번으로 Skills 업데이트
- 자신의 Skills를 게시해 백업

## 빠른 시작 (비기술적)

1. 필요한 것을 검색합니다:
   - `openclaw skills search "calendar"`
2. Skill을 설치합니다:
   - `openclaw skills install <skill-slug>`
3. 새 OpenClaw 세션을 시작해 새 Skill을 반영합니다.
4. 게시하거나 레지스트리 인증을 관리하려면 별도의
   `clawhub` CLI도 설치하세요.

## ClawHub CLI 설치

이것은 publish/sync 같은 레지스트리 인증 워크플로우에만 필요합니다.

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw와의 관계

네이티브 `openclaw skills install`은 활성 workspace의 `skills/`
디렉터리에 설치합니다. `openclaw plugins install clawhub:...`는 일반 관리형
Plugin 설치와 함께 업데이트용 ClawHub 소스 메타데이터를 기록합니다.

익명 ClawHub Plugin 설치도 비공개 패키지에 대해서는 안전하게 실패합니다.
커뮤니티 또는 기타 비공식 채널은 여전히 설치할 수 있지만, OpenClaw는
소스와 검증을 검토한 뒤 활성화할 수 있도록 운영자에게 경고를 표시합니다.

별도의 `clawhub` CLI도 현재 작업 디렉터리 아래 `./skills`에 Skills를 설치합니다. OpenClaw workspace가 구성되어 있다면 `clawhub`는 `--workdir`(또는 `CLAWHUB_WORKDIR`)로 재정의하지 않는 한 그 workspace로 대체합니다. OpenClaw는 `<workspace>/skills`에서 workspace Skills를 로드하며, **다음** 세션에서 이를 반영합니다. 이미 `~/.openclaw/skills` 또는 번들 Skills를 사용 중이라면 workspace Skills가 우선합니다.

Skills가 어떻게 로드되고, 공유되고, 게이트되는지에 대한 자세한 내용은 [Skills](/ko/tools/skills)를 참조하세요.

## Skill 시스템 개요

Skill은 OpenClaw에 특정 작업 수행 방법을 가르치는 버전 관리 번들입니다. 게시할 때마다 새 버전이 생성되며, 레지스트리는 사용자가 변경 사항을 감사할 수 있도록 버전 히스토리를 유지합니다.

일반적인 Skill에는 다음이 포함됩니다.

- 기본 설명 및 사용법이 담긴 `SKILL.md`
- Skill이 사용하는 선택적 config, 스크립트 또는 지원 파일
- 태그, 요약, 설치 요구 사항 같은 메타데이터

ClawHub는 메타데이터를 사용해 검색을 구동하고 Skill capability를 안전하게 노출합니다. 레지스트리는 별점과 다운로드 수 같은 사용 신호도 추적해 순위와 가시성을 개선합니다.

## 서비스가 제공하는 기능

- Skills와 그 `SKILL.md` 콘텐츠의 **공개 탐색**
- 단순 키워드가 아닌 임베딩(벡터 검색) 기반 **검색**
- semver, changelog, 태그(`latest` 포함)를 통한 **버전 관리**
- 버전별 zip **다운로드**
- 커뮤니티 피드백을 위한 **별점과 댓글**
- 승인 및 감사를 위한 **moderation** 훅
- 자동화와 스크립팅을 위한 **CLI 친화적 API**

## 보안 및 moderation

ClawHub는 기본적으로 열려 있습니다. 누구나 Skill을 업로드할 수 있지만, 게시하려면 GitHub 계정이 최소 1주일 이상 되어야 합니다. 이는 정상적인 기여자를 막지 않으면서 악용을 늦추기 위한 장치입니다.

신고 및 moderation:

- 로그인한 모든 사용자는 Skill을 신고할 수 있습니다.
- 신고 사유는 필수이며 기록됩니다.
- 각 사용자는 한 번에 최대 20개의 활성 신고를 가질 수 있습니다.
- 3명 이상의 고유 사용자에게 신고된 Skill은 기본적으로 자동 숨김 처리됩니다.
- Moderator는 숨겨진 Skills를 보고, 숨김 해제하고, 삭제하거나, 사용자를 차단할 수 있습니다.
- 신고 기능을 악용하면 계정 차단으로 이어질 수 있습니다.

Moderator가 되고 싶다면 OpenClaw Discord에서 물어보고 moderator나 maintainer에게 연락하세요.

## CLI 명령과 매개변수

전역 옵션(모든 명령에 적용):

- `--workdir <dir>`: 작업 디렉터리(기본값: 현재 디렉터리, OpenClaw workspace로 대체됨)
- `--dir <dir>`: workdir 기준 Skills 디렉터리(기본값: `skills`)
- `--site <url>`: 사이트 base URL(브라우저 로그인)
- `--registry <url>`: 레지스트리 API base URL
- `--no-input`: 프롬프트 비활성화(비대화형)
- `-V, --cli-version`: CLI 버전 출력

인증:

- `clawhub login` (브라우저 흐름) 또는 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

옵션:

- `--token <token>`: API token 직접 입력
- `--label <label>`: 브라우저 로그인 token에 저장할 레이블(기본값: `CLI token`)
- `--no-browser`: 브라우저를 열지 않음(`--token` 필요)

검색:

- `clawhub search "query"`
- `--limit <n>`: 최대 결과 수

설치:

- `clawhub install <slug>`
- `--version <version>`: 특정 버전 설치
- `--force`: 폴더가 이미 있으면 덮어쓰기

업데이트:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 특정 버전으로 업데이트(단일 slug만)
- `--force`: 로컬 파일이 게시된 어떤 버전과도 일치하지 않을 때 덮어쓰기

목록:

- `clawhub list` (`.clawhub/lock.json` 읽음)

Skills 게시:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug
- `--name <name>`: 표시 이름
- `--version <version>`: semver 버전
- `--changelog <text>`: changelog 텍스트(비워 둘 수 있음)
- `--tags <tags>`: 쉼표로 구분된 태그(기본값: `latest`)

Plugins 게시:

- `clawhub package publish <source>`
- `<source>`는 로컬 폴더, `owner/repo`, `owner/repo@ref`, 또는 GitHub URL이 될 수 있음
- `--dry-run`: 아무것도 업로드하지 않고 정확한 게시 계획만 빌드
- `--json`: CI용 기계 판독 출력
- `--source-repo`, `--source-commit`, `--source-ref`: 자동 감지가 충분하지 않을 때의 선택적 재정의

삭제/삭제 취소(owner/admin 전용):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

동기화(로컬 Skills를 스캔하고 새 항목/업데이트된 항목 게시):

- `clawhub sync`
- `--root <dir...>`: 추가 스캔 루트
- `--all`: 프롬프트 없이 모두 업로드
- `--dry-run`: 업로드될 항목 표시
- `--bump <type>`: 업데이트 시 `patch|minor|major` (기본값: `patch`)
- `--changelog <text>`: 비대화형 업데이트용 changelog
- `--tags <tags>`: 쉼표로 구분된 태그(기본값: `latest`)
- `--concurrency <n>`: 레지스트리 검사 동시성(기본값: 4)

## 에이전트를 위한 일반적인 워크플로우

### Skills 검색

```bash
clawhub search "postgres backups"
```

### 새 Skills 다운로드

```bash
clawhub install my-skill-pack
```

### 설치된 Skills 업데이트

```bash
clawhub update --all
```

### Skills 백업(publish 또는 sync)

단일 Skill 폴더의 경우:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

여러 Skills를 한 번에 스캔하고 백업하려면:

```bash
clawhub sync --all
```

### GitHub에서 Plugin 게시

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

코드 Plugin에는 `package.json`에 필수 OpenClaw 메타데이터가 포함되어야 합니다.

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

게시된 패키지는 빌드된 JavaScript를 포함하고 `runtimeExtensions`가 그 출력을 가리켜야 합니다. Git 체크아웃 설치는 빌드된 파일이 없을 때 여전히 TypeScript 소스로 대체할 수 있지만, 빌드된 런타임 엔트리는 시작, doctor, Plugin 로딩 경로에서 런타임 TypeScript 컴파일을 피할 수 있습니다.

## 고급 세부 사항 (기술적)

### 버전 관리 및 태그

- 게시할 때마다 새로운 **semver** `SkillVersion`이 생성됩니다.
- 태그(`latest` 등)는 특정 버전을 가리키며, 태그를 옮기면 롤백할 수 있습니다.
- Changelog는 버전별로 연결되며, sync 또는 업데이트 게시 시 비워 둘 수 있습니다.

### 로컬 변경 사항 vs 레지스트리 버전

업데이트는 콘텐츠 해시를 사용해 로컬 Skill 내용과 레지스트리 버전을 비교합니다. 로컬 파일이 게시된 어떤 버전과도 일치하지 않으면, CLI는 덮어쓰기 전에 확인을 요청하거나(비대화형 실행에서는 `--force` 필요) 중단합니다.

### Sync 스캔 및 fallback 루트

`clawhub sync`는 먼저 현재 workdir를 스캔합니다. Skill을 찾지 못하면 알려진 레거시 위치(예: `~/openclaw/skills`, `~/.openclaw/skills`)로 대체합니다. 이는 추가 플래그 없이도 오래된 Skill 설치를 찾도록 설계되었습니다.

### 저장소 및 lockfile

- 설치된 Skills는 workdir 아래 `.clawhub/lock.json`에 기록됩니다.
- 인증 token은 ClawHub CLI config 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의 가능).

### Telemetry (설치 수)

로그인한 상태에서 `clawhub sync`를 실행하면, CLI는 설치 수 계산을 위해 최소한의 스냅샷을 전송합니다. 이를 완전히 비활성화할 수 있습니다.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 환경 변수

- `CLAWHUB_SITE`: 사이트 URL 재정의
- `CLAWHUB_REGISTRY`: 레지스트리 API URL 재정의
- `CLAWHUB_CONFIG_PATH`: CLI가 token/config를 저장하는 위치 재정의
- `CLAWHUB_WORKDIR`: 기본 workdir 재정의
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` 시 telemetry 비활성화

## 관련 항목

- [Plugin](/ko/tools/plugin)
- [Skills](/ko/tools/skills)
- [커뮤니티 Plugins](/ko/plugins/community)
