---
read_when:
    - 메모리 위키 CLI를 사용하려는 경우
    - '`openclaw wiki`을(를) 문서화하거나 변경하는 경우'
summary: 메모리 위키 볼트 상태, 검색, 컴파일, 린트, 적용, 브리지 및 Obsidian 헬퍼용 `openclaw wiki`에 대한 CLI 참조
title: 위키
x-i18n:
    generated_at: "2026-04-24T06:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

`memory-wiki` 볼트를 검사하고 유지 관리합니다.

번들 `memory-wiki` Plugin이 제공합니다.

관련 항목:

- [Memory Wiki Plugin](/ko/plugins/memory-wiki)
- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/ko/cli/memory)

## 용도

다음이 포함된 컴파일된 지식 볼트가 필요할 때 `openclaw wiki`를 사용하세요.

- 위키 네이티브 검색 및 페이지 읽기
- 출처 정보가 풍부한 종합
- 모순 및 최신성 보고서
- 활성 메모리 Plugin에서 가져오는 브리지 import
- 선택적 Obsidian CLI 헬퍼

## 일반적인 명령

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 명령

### `wiki status`

현재 볼트 모드, 상태, Obsidian CLI 사용 가능 여부를 검사합니다.

볼트가 초기화되었는지, bridge 모드가 정상인지,
또는 Obsidian 통합을 사용할 수 있는지 확실하지 않을 때 먼저 사용하세요.

### `wiki doctor`

위키 상태 검사를 실행하고 구성 또는 볼트 문제를 표시합니다.

일반적인 문제 예시:

- 공개 메모리 아티팩트 없이 bridge 모드가 활성화됨
- 유효하지 않거나 누락된 볼트 레이아웃
- Obsidian 모드가 예상될 때 외부 Obsidian CLI가 없음

### `wiki init`

위키 볼트 레이아웃과 시작 페이지를 생성합니다.

최상위 인덱스와 캐시
디렉터리를 포함한 루트 구조를 초기화합니다.

### `wiki ingest <path-or-url>`

위키 소스 계층으로 콘텐츠를 가져옵니다.

참고:

- URL ingest는 `ingest.allowUrlIngest`에 의해 제어됩니다
- 가져온 소스 페이지는 frontmatter에 출처 정보를 유지합니다
- 활성화된 경우 ingest 후 auto-compile이 실행될 수 있습니다

### `wiki compile`

인덱스, 관련 블록, 대시보드, 컴파일된 digest를 다시 빌드합니다.

다음 위치에 안정적인 머신 대상 아티팩트를 씁니다.

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards`가 활성화된 경우 compile은 보고서 페이지도 새로 고칩니다.

### `wiki lint`

볼트를 린트하고 다음을 보고합니다.

- 구조 문제
- 출처 정보 누락
- 모순
- 미해결 질문
- 신뢰도가 낮은 페이지/claim
- 오래된 페이지/claim

의미 있는 위키 업데이트 후에 실행하세요.

### `wiki search <query>`

위키 콘텐츠를 검색합니다.

동작은 구성에 따라 달라집니다.

- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory`, 또는 `all`

위키별 순위 또는 출처 세부 정보가 필요할 때 `wiki search`를 사용하세요.
활성 메모리 Plugin이 shared search를 노출하는 경우,
광범위한 공용 리콜 1회를 위해서는 `openclaw memory search`를 사용하는 것이 좋습니다.

### `wiki get <lookup>`

ID 또는 상대 경로로 위키 페이지를 읽습니다.

예시:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

자유 형식 페이지 수술 없이 좁은 범위의 변경을 적용합니다.

지원되는 흐름 예시:

- synthesis 페이지 생성/업데이트
- 페이지 메타데이터 업데이트
- source id 연결
- 질문 추가
- 모순 추가
- confidence/status 업데이트
- 구조화된 claim 쓰기

이 명령은 관리되는 블록을 수동 편집하지 않고도
위키를 안전하게 발전시킬 수 있도록 존재합니다.

### `wiki bridge import`

활성 메모리 Plugin의 공개 메모리 아티팩트를 bridge 기반
소스 페이지로 가져옵니다.

최신 export된 메모리 아티팩트를
위키 볼트로 가져오고 싶을 때 `bridge` 모드에서 사용하세요.

### `wiki unsafe-local import`

`unsafe-local` 모드에서 명시적으로 구성된 로컬 경로에서 가져옵니다.

의도적으로 실험적이며 동일 머신 전용입니다.

### `wiki obsidian ...`

Obsidian 친화 모드에서 실행되는 볼트를 위한 Obsidian 헬퍼 명령입니다.

하위 명령:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli`가 활성화되어 있으면
이 명령들은 `PATH`에 공식 `obsidian` CLI가 있어야 합니다.

## 실용적인 사용 지침

- 출처 정보와 페이지 식별이 중요할 때는 `wiki search` + `wiki get`을 사용하세요.
- 관리되는 생성 섹션은 직접 편집하지 말고 `wiki apply`를 사용하세요.
- 모순되거나 신뢰도가 낮은 콘텐츠를 신뢰하기 전에 `wiki lint`를 사용하세요.
- 대량 import 또는 소스 변경 후 대시보드와 컴파일된 digest를 즉시 최신 상태로 만들고 싶다면 `wiki compile`을 사용하세요.
- bridge 모드가 새로 export된 메모리 아티팩트에 의존한다면 `wiki bridge import`를 사용하세요.

## 관련 구성

`openclaw wiki` 동작은 다음 설정의 영향을 받습니다.

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

전체 구성 모델은 [Memory Wiki Plugin](/ko/plugins/memory-wiki)을 참조하세요.

## 관련

- [CLI 참조](/ko/cli)
- [Memory Wiki](/ko/plugins/memory-wiki)
