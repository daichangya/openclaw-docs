---
read_when:
    - 신규 사용자에게 ClawHub 소개하기
    - Skills 또는 Plugin 설치, 검색 또는 게시하기
    - ClawHub CLI 플래그 및 동기화 동작 설명하기
summary: 'ClawHub 가이드: 공개 레지스트리, 네이티브 OpenClaw 설치 흐름 및 ClawHub CLI 워크플로'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub는 **OpenClaw Skills 및 Plugin**을 위한 공개 레지스트리입니다.

- ClawHub에서 Skills를 검색/설치/업데이트하고 Plugin을 설치하려면 네이티브 `openclaw` 명령을 사용하세요.
- 레지스트리 인증, 게시, 삭제, 삭제 취소 또는 sync 워크플로가 필요할 때는 별도의 `clawhub` CLI를 사용하세요.

사이트: [clawhub.ai](https://clawhub.ai)

## 네이티브 OpenClaw 흐름

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

bare npm-safe Plugin spec도 npm보다 먼저 ClawHub에서 시도됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

네이티브 `openclaw` 명령은 활성 workspace에 설치하고 source
메타데이터를 저장하므로 이후 `update` 호출도 ClawHub를 계속 사용할 수 있습니다.

Plugin 설치는 archive 설치 실행 전에 광고된 `pluginApi` 및 `minGatewayVersion`
호환성을 검증하므로, 호환되지 않는 호스트는 패키지를 부분 설치하는 대신
초기에 fail closed됩니다.

`openclaw plugins install clawhub:...`는 설치 가능한 Plugin 계열만 허용합니다.
ClawHub 패키지가 실제로는 skill이라면, OpenClaw는 중단하고 대신
`openclaw skills install <slug>`를 안내합니다.

## ClawHub란 무엇인가

- OpenClaw Skills 및 Plugin을 위한 공개 레지스트리
- Skill 번들과 메타데이터의 버전 관리 저장소
- 검색, 태그, 사용 신호를 위한 탐색 표면

## 작동 방식

1. 사용자가 skill 번들(파일 + 메타데이터)을 게시합니다.
2. ClawHub가 번들을 저장하고 메타데이터를 파싱한 뒤 버전을 할당합니다.
3. 레지스트리가 해당 skill을 검색 및 탐색용으로 인덱싱합니다.
4. 사용자가 OpenClaw에서 Skills를 둘러보고, 다운로드하고, 설치합니다.

## 할 수 있는 일

- 새 Skills 및 기존 Skills의 새 버전 게시
- 이름, 태그 또는 검색으로 Skills 탐색
- Skill 번들 다운로드 및 파일 검사
- 악의적이거나 안전하지 않은 Skills 신고
- moderator인 경우 숨기기, 숨김 해제, 삭제 또는 차단

## 대상 사용자(초보자 친화적)

OpenClaw 에이전트에 새로운 기능을 추가하고 싶다면, ClawHub는 Skills를 찾고 설치하는 가장 쉬운 방법입니다. 백엔드가 어떻게 동작하는지는 알 필요가 없습니다. 할 수 있는 일:

- 자연어로 Skills 검색
- workspace에 skill 설치
- 나중에 한 번의 명령으로 Skills 업데이트
- 자신의 Skills를 게시하여 백업

## 빠른 시작(비기술 사용자용)

1. 필요한 항목 검색:
   - `openclaw skills search "calendar"`
2. skill 설치:
   - `openclaw skills install <skill-slug>`
3. 새 skill이 반영되도록 새 OpenClaw 세션 시작
4. 게시하거나 레지스트리 인증을 관리하려면 별도의
   `clawhub` CLI도 설치하세요.

## ClawHub CLI 설치

게시/sync 같은 레지스트리 인증 워크플로에만 필요합니다.

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw와의 연동 방식

네이티브 `openclaw skills install`은 활성 workspace `skills/`
디렉터리에 설치합니다. `openclaw plugins install clawhub:...`는 일반적인 managed
Plugin 설치와 함께, 업데이트를 위한 ClawHub source 메타데이터를 기록합니다.

익명 ClawHub Plugin 설치도 private 패키지에 대해서는 fail closed됩니다.
community 또는 기타 비공식 채널은 여전히 설치할 수 있지만, OpenClaw는
운영자가 활성화 전에 source 및 검증을 검토할 수 있도록 경고합니다.

별도의 `clawhub` CLI는 현재 작업 디렉터리 아래의 `./skills`에도 Skills를 설치합니다.
OpenClaw workspace가 구성되어 있으면, `clawhub`는
`--workdir`(또는 `CLAWHUB_WORKDIR`)로 재정의하지 않는 한 해당 workspace로 fallback합니다. OpenClaw는 `<workspace>/skills`에서 workspace Skills를 로드하며,
**다음** 세션에서 이를 인식합니다. 이미
`~/.openclaw/skills` 또는 번들 Skills를 사용 중이면, workspace Skills가 우선합니다.

Skills가 로드되고, 공유되고, 게이트되는 방식에 대한 자세한 내용은
[Skills](/ko/tools/skills)를 참조하세요.

## Skill 시스템 개요

Skill은 OpenClaw가 특정 작업을 수행하는 방법을 학습시키는 버전 관리 번들 파일입니다. 각 게시마다 새 버전이 생성되며, 레지스트리는 사용자가 변경 사항을 감사할 수 있도록 버전 이력을 유지합니다.

일반적인 skill에는 다음이 포함됩니다.

- 기본 설명과 사용법이 담긴 `SKILL.md` 파일
- skill에서 사용하는 선택적 config, 스크립트 또는 지원 파일
- 태그, 요약, 설치 요구 사항 같은 메타데이터

ClawHub는 메타데이터를 사용해 탐색 기능을 제공하고 skill capability를 안전하게 노출합니다.
또한 레지스트리는 순위 및 가시성 향상을 위해 별표 및 다운로드 같은 사용 신호도 추적합니다.

## 서비스가 제공하는 기능

- Skills 및 해당 `SKILL.md` 콘텐츠의 **공개 탐색**
- 단순 키워드가 아닌 임베딩(벡터 검색) 기반 **검색**
- semver, changelog, 태그(`latest` 포함)를 사용한 **버전 관리**
- 버전별 zip 형태의 **다운로드**
- 커뮤니티 피드백을 위한 **별표 및 댓글**
- 승인 및 감사를 위한 **moderation** hook
- 자동화 및 스크립팅을 위한 **CLI 친화적 API**

## 보안 및 moderation

ClawHub는 기본적으로 개방되어 있습니다. 누구나 Skills를 업로드할 수 있지만, 게시하려면 GitHub 계정이 최소 1주일 이상 되어야 합니다. 이는 정상적인 기여자를 막지 않으면서 악용을 늦추는 데 도움이 됩니다.

신고 및 moderation:

- 로그인한 사용자는 누구나 skill을 신고할 수 있습니다.
- 신고 사유는 필수이며 기록됩니다.
- 각 사용자는 동시에 최대 20개의 활성 신고를 가질 수 있습니다.
- 3명 초과의 고유 신고를 받은 Skills는 기본적으로 자동 숨김 처리됩니다.
- moderator는 숨겨진 Skills를 보고, 숨김 해제하고, 삭제하거나, 사용자를 차단할 수 있습니다.
- 신고 기능을 악용하면 계정 차단될 수 있습니다.

moderator가 되고 싶다면 OpenClaw Discord에서 moderator 또는 maintainer에게 문의하세요.

## CLI 명령 및 매개변수

전역 옵션(모든 명령에 적용):

- `--workdir <dir>`: 작업 디렉터리(기본값: 현재 디렉터리, OpenClaw workspace로 fallback)
- `--dir <dir>`: workdir 기준 Skills 디렉터리(기본값: `skills`)
- `--site <url>`: 사이트 base URL(브라우저 로그인)
- `--registry <url>`: 레지스트리 API base URL
- `--no-input`: 프롬프트 비활성화(비대화형)
- `-V, --cli-version`: CLI 버전 출력

인증:

- `clawhub login`(브라우저 흐름) 또는 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

옵션:

- `--token <token>`: API token 붙여넣기
- `--label <label>`: 브라우저 로그인 token에 저장할 label(기본값: `CLI token`)
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
- `--version <version>`: 특정 버전으로 업데이트(단일 slug에서만)
- `--force`: 로컬 파일이 어떤 게시 버전과도 일치하지 않을 때 덮어쓰기

목록:

- `clawhub list` (`.clawhub/lock.json` 읽음)

Skill 게시:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug
- `--name <name>`: 표시 이름
- `--version <version>`: semver 버전
- `--changelog <text>`: changelog 텍스트(비어 있어도 됨)
- `--tags <tags>`: 쉼표로 구분한 태그(기본값: `latest`)

Plugin 게시:

- `clawhub package publish <source>`
- `<source>`는 로컬 폴더, `owner/repo`, `owner/repo@ref`, GitHub URL일 수 있음
- `--dry-run`: 아무것도 업로드하지 않고 정확한 게시 계획만 빌드
- `--json`: CI용 기계 판독 출력
- `--source-repo`, `--source-commit`, `--source-ref`: 자동 감지가 충분하지 않을 때 사용하는 선택적 재정의

삭제/삭제 취소(owner/admin 전용):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync(로컬 Skills 스캔 + 신규/업데이트 게시):

- `clawhub sync`
- `--root <dir...>`: 추가 스캔 루트
- `--all`: 프롬프트 없이 모두 업로드
- `--dry-run`: 업로드될 항목 표시
- `--bump <type>`: 업데이트용 `patch|minor|major`(기본값: `patch`)
- `--changelog <text>`: 비대화형 업데이트용 changelog
- `--tags <tags>`: 쉼표로 구분한 태그(기본값: `latest`)
- `--concurrency <n>`: 레지스트리 확인 수(기본값: 4)

## 에이전트를 위한 일반 워크플로

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

### Skills 백업(게시 또는 sync)

단일 skill 폴더의 경우:

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

코드 Plugin은 `package.json`에 필요한 OpenClaw 메타데이터를 포함해야 합니다.

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

게시된 패키지는 빌드된 JavaScript를 포함하고 `runtimeExtensions`가
해당 출력을 가리켜야 합니다. Git checkout 설치는 빌드 파일이 없을 때 여전히 TypeScript 소스로 fallback할 수 있지만, 빌드된 runtime 진입점은 시작, doctor, Plugin 로딩 경로에서 runtime TypeScript
컴파일을 피할 수 있게 해줍니다.

## 고급 세부 사항(기술)

### 버전 관리 및 태그

- 각 게시마다 새로운 **semver** `SkillVersion`이 생성됩니다.
- `latest` 같은 태그는 특정 버전을 가리키며, 태그를 이동해 롤백할 수 있습니다.
- changelog는 버전별로 첨부되며, sync 또는 업데이트 게시 시 비어 있어도 됩니다.

### 로컬 변경 사항과 레지스트리 버전

업데이트는 콘텐츠 해시를 사용해 로컬 skill 콘텐츠를 레지스트리 버전과 비교합니다. 로컬 파일이 어떤 게시 버전과도 일치하지 않으면, CLI는 덮어쓰기 전에 확인을 요청합니다(또는 비대화형 실행에서는 `--force` 필요).

### Sync 스캔 및 fallback 루트

`clawhub sync`는 먼저 현재 workdir를 스캔합니다. Skills를 찾지 못하면 알려진 레거시 위치(예: `~/openclaw/skills`, `~/.openclaw/skills`)로 fallback합니다. 이는 추가 플래그 없이 오래된 skill 설치를 찾기 위해 설계되었습니다.

### 저장소 및 lockfile

- 설치된 Skills는 workdir 아래 `.clawhub/lock.json`에 기록됩니다.
- 인증 token은 ClawHub CLI config 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의 가능).

### 텔레메트리(설치 수)

로그인된 상태에서 `clawhub sync`를 실행하면 CLI는 설치 수를 계산하기 위해 최소한의 snapshot을 전송합니다. 이를 완전히 비활성화할 수 있습니다.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 환경 변수

- `CLAWHUB_SITE`: 사이트 URL 재정의
- `CLAWHUB_REGISTRY`: 레지스트리 API URL 재정의
- `CLAWHUB_CONFIG_PATH`: CLI가 token/config를 저장하는 위치 재정의
- `CLAWHUB_WORKDIR`: 기본 workdir 재정의
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` 시 텔레메트리 비활성화
