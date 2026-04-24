---
read_when:
    - 단순한 MEMORY.md 메모를 넘어서는 영속적인 지식을 원합니다
    - 번들된 memory-wiki Plugin을 구성하고 있습니다
    - wiki_search, wiki_get 또는 브리지 모드를 이해하고 싶습니다
summary: 'memory-wiki: 출처, 주장, 대시보드, 브리지 모드를 갖춘 컴파일된 지식 보관소'
title: 메모리 위키
x-i18n:
    generated_at: "2026-04-24T06:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki`는 영속 메모리를 컴파일된 지식 보관소로 바꾸는 번들 Plugin입니다.

이 Plugin은 Active Memory Plugin을 대체하지 않습니다. Active Memory Plugin은 여전히
리콜, 승격, 인덱싱, Dreaming을 소유합니다. `memory-wiki`는 그 옆에서 동작하며
영속 지식을 탐색 가능한 위키로 컴파일합니다. 여기에는 결정적 페이지,
구조화된 주장, 출처, 대시보드, 머신 판독 가능한 다이제스트가 포함됩니다.

메모리가 Markdown 파일 더미처럼이 아니라 유지 관리되는 지식 계층처럼 동작하길 원할 때 사용하세요.

## 추가되는 것

- 결정적인 페이지 레이아웃을 가진 전용 위키 보관소
- 단순 산문이 아닌 구조화된 주장 및 증거 메타데이터
- 페이지 수준의 출처, 신뢰도, 모순, 열린 질문
- 에이전트/런타임 소비자를 위한 컴파일된 다이제스트
- 위키 네이티브 search/get/apply/lint 도구
- Active Memory Plugin의 공개 아티팩트를 가져오는 선택적 브리지 모드
- 선택적인 Obsidian 친화 렌더 모드 및 CLI 통합

## 메모리와의 관계

구분은 다음과 같이 생각하세요:

| 계층                                                    | 소유 항목                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Active Memory Plugin (`memory-core`, QMD, Honcho 등)    | 리콜, 의미 검색, 승격, Dreaming, 메모리 런타임                                              |
| `memory-wiki`                                           | 컴파일된 위키 페이지, 출처가 풍부한 종합, 대시보드, 위키 전용 search/get/apply            |

Active Memory Plugin이 공유 리콜 아티팩트를 노출하면, OpenClaw는
`memory_search corpus=all`로 두 계층을 한 번에 검색할 수 있습니다.

위키 전용 랭킹, 출처 또는 직접 페이지 접근이 필요할 때는
위키 네이티브 도구를 대신 사용하세요.

## 권장 하이브리드 패턴

로컬 우선 설정을 위한 강력한 기본값은 다음과 같습니다:

- 리콜과 광범위한 의미 검색에는 QMD를 Active Memory 백엔드로 사용
- 영속적인 종합 지식 페이지에는 `memory-wiki`를 `bridge` 모드로 사용

이 구분이 잘 작동하는 이유는 각 계층이 자신의 역할에 집중하기 때문입니다:

- QMD는 원시 노트, 세션 내보내기, 추가 컬렉션을 검색 가능하게 유지
- `memory-wiki`는 안정적인 엔터티, 주장, 대시보드, 소스 페이지를 컴파일

실용적 규칙:

- 메모리 전체에 걸친 광범위한 리콜 한 번이 필요하면 `memory_search` 사용
- 출처를 인식하는 위키 결과가 필요하면 `wiki_search`와 `wiki_get` 사용
- 공유 검색이 두 계층 모두를 아우르게 하려면 `memory_search corpus=all` 사용

브리지 모드가 내보낸 아티팩트 0개를 보고한다면, Active Memory Plugin이 현재는
공개 브리지 입력을 아직 노출하지 않는다는 뜻입니다. 먼저 `openclaw wiki doctor`를 실행하고,
그다음 Active Memory Plugin이 공개 아티팩트를 지원하는지 확인하세요.

## 보관소 모드

`memory-wiki`는 세 가지 보관소 모드를 지원합니다:

### `isolated`

자체 보관소, 자체 소스, `memory-core`에 대한 의존성 없음.

위키를 자체적인 큐레이션된 지식 저장소로 만들고 싶을 때 사용하세요.

### `bridge`

공개 Plugin SDK seam을 통해 Active Memory Plugin의 공개 메모리 아티팩트와 메모리 이벤트를 읽습니다.

메모리 Plugin의 내보낸 아티팩트를 비공개 Plugin 내부에 접근하지 않고 위키에서
컴파일하고 정리하고 싶을 때 사용하세요.

브리지 모드는 다음을 인덱싱할 수 있습니다:

- 내보낸 메모리 아티팩트
- Dreaming 보고서
- 일일 노트
- 메모리 루트 파일
- 메모리 이벤트 로그

### `unsafe-local`

로컬 비공개 경로를 위한 명시적인 같은 머신 탈출구입니다.

이 모드는 의도적으로 실험적이며 이식성이 없습니다. 신뢰 경계를 이해하고,
브리지 모드가 제공할 수 없는 로컬 파일 시스템 접근이 정말 필요할 때만 사용하세요.

## 보관소 레이아웃

Plugin은 다음과 같이 보관소를 초기화합니다:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

관리되는 콘텐츠는 생성된 블록 내부에 유지됩니다. 사람이 작성한 노트 블록은 보존됩니다.

주요 페이지 그룹은 다음과 같습니다:

- 가져온 원시 자료와 브리지 기반 페이지를 위한 `sources/`
- 지속적인 사물, 사람, 시스템, 프로젝트, 객체를 위한 `entities/`
- 아이디어, 추상화, 패턴, 정책을 위한 `concepts/`
- 컴파일된 요약과 유지 관리되는 롤업을 위한 `syntheses/`
- 생성된 대시보드를 위한 `reports/`

## 구조화된 주장과 증거

페이지는 자유 형식 텍스트뿐 아니라 구조화된 `claims` frontmatter를 가질 수 있습니다.

각 주장은 다음을 포함할 수 있습니다:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

증거 항목은 다음을 포함할 수 있습니다:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

이것이 위키를 수동적인 메모 덤프가 아니라 믿음 계층처럼 동작하게 만드는 요소입니다.
주장은 추적, 점수화, 이의 제기, 소스까지의 확인이 가능합니다.

## 컴파일 파이프라인

컴파일 단계는 위키 페이지를 읽고, 요약을 정규화하며, 안정적인
머신 대상 아티팩트를 다음 아래에 출력합니다:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

이 다이제스트는 에이전트와 런타임 코드가 Markdown 페이지를
스크래핑하지 않아도 되도록 존재합니다.

컴파일된 출력은 다음에도 사용됩니다:

- search/get 흐름을 위한 첫 번째 패스 위키 인덱싱
- claim ID를 소유 페이지로 되돌리는 lookup
- 간결한 프롬프트 보조
- 보고서/대시보드 생성

## 대시보드와 상태 보고서

`render.createDashboards`가 활성화되면, compile은 `reports/` 아래에 대시보드를 유지합니다.

내장 보고서는 다음과 같습니다:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

이 보고서들은 다음과 같은 항목을 추적합니다:

- 모순 노트 클러스터
- 경쟁하는 주장 클러스터
- 구조화된 증거가 없는 주장
- 낮은 신뢰도의 페이지와 주장
- 오래되었거나 신선도를 알 수 없는 항목
- 해결되지 않은 질문이 있는 페이지

## 검색과 조회

`memory-wiki`는 두 가지 검색 백엔드를 지원합니다:

- `shared`: 가능할 때 공유 메모리 검색 흐름 사용
- `local`: 로컬에서 위키 검색

또한 세 가지 코퍼스를 지원합니다:

- `wiki`
- `memory`
- `all`

중요한 동작:

- `wiki_search`와 `wiki_get`은 가능할 때 첫 번째 패스로 컴파일된 다이제스트를 사용합니다
- claim ID는 소유 페이지로 확인될 수 있습니다
- contested/stale/fresh 주장이 랭킹에 영향을 줍니다
- 출처 레이블이 결과까지 유지될 수 있습니다

실용적 규칙:

- 메모리 전체에 걸친 광범위한 리콜 한 번에는 `memory_search corpus=all` 사용
- 위키 전용 랭킹,
  출처 또는 페이지 수준 믿음 구조가 중요할 때는 `wiki_search` + `wiki_get` 사용

## 에이전트 도구

Plugin은 다음 도구를 등록합니다:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

기능:

- `wiki_status`: 현재 보관소 모드, 상태, Obsidian CLI 사용 가능 여부
- `wiki_search`: 위키 페이지 검색 및, 구성된 경우 공유 메모리 코퍼스 검색
- `wiki_get`: ID/경로로 위키 페이지를 읽거나 공유 메모리 코퍼스로 폴백
- `wiki_apply`: 자유 형식 페이지 수술 없이 좁은 종합/메타데이터 변경 수행
- `wiki_lint`: 구조 검사, 출처 공백, 모순, 열린 질문 점검

Plugin은 또한 비독점 메모리 코퍼스 보조를 등록하므로, Active Memory Plugin이 코퍼스 선택을 지원할 경우 공유 `memory_search`와 `memory_get`이 위키에 도달할 수 있습니다.

## 프롬프트와 컨텍스트 동작

`context.includeCompiledDigestPrompt`가 활성화되면, 메모리 프롬프트 섹션은 `agent-digest.json`의 간결한 컴파일 스냅샷을 덧붙입니다.

이 스냅샷은 의도적으로 작고 신호성이 높습니다:

- 최상위 페이지만
- 최상위 주장만
- 모순 개수
- 질문 개수
- 신뢰도/신선도 한정자

이 기능은 프롬프트 형태를 바꾸며, 주로 명시적으로 메모리 보조를 소비하는 context engine이나 레거시 프롬프트 조립에 유용하기 때문에 opt-in입니다.

## 구성

구성은 `plugins.entries.memory-wiki.config` 아래에 둡니다:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

핵심 토글:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` 또는 `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin 공개 아티팩트 가져오기
- `bridge.followMemoryEvents`: 브리지 모드에서 이벤트 로그 포함
- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory`, 또는 `all`
- `context.includeCompiledDigestPrompt`: 메모리 프롬프트 섹션에 간결한 다이제스트 스냅샷 추가
- `render.createBacklinks`: 결정적인 관련 블록 생성
- `render.createDashboards`: 대시보드 페이지 생성

### 예시: QMD + 브리지 모드

리콜에는 QMD를 사용하고, 유지 관리되는
지식 계층에는 `memory-wiki`를 사용하고 싶을 때 사용하세요:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

이 설정은 다음을 유지합니다:

- QMD가 Active Memory 리콜을 담당
- `memory-wiki`는 컴파일된 페이지와 대시보드에 집중
- 의도적으로 컴파일된 다이제스트 프롬프트를 활성화하기 전까지 프롬프트 형태는 변경되지 않음

## CLI

`memory-wiki`는 최상위 CLI 표면도 노출합니다:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

전체 명령 참조는 [CLI: wiki](/ko/cli/wiki)를 참조하세요.

## Obsidian 지원

`vault.renderMode`가 `obsidian`일 때 Plugin은 Obsidian 친화적인
Markdown을 작성하며, 선택적으로 공식 `obsidian` CLI를 사용할 수 있습니다.

지원되는 워크플로는 다음과 같습니다:

- 상태 프로브
- 보관소 검색
- 페이지 열기
- Obsidian 명령 호출
- 일일 노트로 이동

이는 선택 사항입니다. Obsidian이 없어도 위키는 네이티브 모드에서 계속 동작합니다.

## 권장 워크플로

1. 리콜/승격/Dreaming에는 Active Memory Plugin을 유지하세요.
2. `memory-wiki`를 활성화하세요.
3. 브리지 모드를 명시적으로 원하지 않는 한 `isolated` 모드로 시작하세요.
4. 출처가 중요할 때는 `wiki_search` / `wiki_get`을 사용하세요.
5. 좁은 종합 또는 메타데이터 업데이트에는 `wiki_apply`를 사용하세요.
6. 의미 있는 변경 후에는 `wiki_lint`를 실행하세요.
7. 오래된 정보/모순 가시성이 필요하면 대시보드를 켜세요.

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/ko/cli/memory)
- [CLI: wiki](/ko/cli/wiki)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
