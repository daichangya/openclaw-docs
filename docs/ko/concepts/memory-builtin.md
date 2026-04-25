---
read_when:
    - 기본 메모리 백엔드를 이해하려고 합니다
    - 임베딩 공급자 또는 하이브리드 검색을 구성하려고 합니다
summary: 키워드, 벡터 및 하이브리드 검색을 지원하는 기본 SQLite 기반 메모리 백엔드
title: 내장 메모리 엔진
x-i18n:
    generated_at: "2026-04-25T12:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

내장 엔진은 기본 메모리 백엔드입니다. 에이전트별 SQLite 데이터베이스에 메모리 인덱스를 저장하며, 시작하는 데 추가 의존성이 필요하지 않습니다.

## 제공 기능

- FTS5 전체 텍스트 인덱싱(BM25 점수화)을 통한 **키워드 검색**
- 지원되는 모든 공급자의 임베딩을 통한 **벡터 검색**
- 최상의 결과를 위해 둘을 결합한 **하이브리드 검색**
- 중국어, 일본어, 한국어를 위한 트라이그램 토큰화를 통한 **CJK 지원**
- 데이터베이스 내 벡터 쿼리를 위한 **sqlite-vec 가속**(선택 사항)

## 시작하기

OpenAI, Gemini, Voyage 또는 Mistral용 API 키가 있으면, 내장 엔진이 이를 자동 감지하고 벡터 검색을 활성화합니다. 구성은 필요하지 않습니다.

공급자를 명시적으로 설정하려면 다음을 사용하세요.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

임베딩 공급자가 없으면 키워드 검색만 사용할 수 있습니다.

기본 제공 로컬 임베딩 공급자를 강제로 사용하려면, OpenClaw 옆에 선택적 `node-llama-cpp` 런타임 패키지를 설치한 다음 `local.modelPath`를 GGUF 파일로 지정하세요.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 지원되는 임베딩 공급자

| 공급자 | ID | 자동 감지 | 참고 |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI | `openai` | 예 | 기본값: `text-embedding-3-small` |
| Gemini | `gemini` | 예 | 멀티모달(이미지 + 오디오) 지원 |
| Voyage | `voyage` | 예 | |
| Mistral | `mistral` | 예 | |
| Ollama | `ollama` | 아니요 | 로컬, 명시적으로 설정 |
| Local | `local` | 예(우선) | 선택적 `node-llama-cpp` 런타임 |

자동 감지는 API 키를 확인할 수 있는 첫 번째 공급자를 위 표의 순서대로 선택합니다. 재정의하려면 `memorySearch.provider`를 설정하세요.

## 인덱싱 방식

OpenClaw는 `MEMORY.md` 및 `memory/*.md`를 청크(약 400토큰, 80토큰 중첩)로 인덱싱하고 이를 에이전트별 SQLite 데이터베이스에 저장합니다.

- **인덱스 위치:** `~/.openclaw/memory/<agentId>.sqlite`
- **파일 감시:** 메모리 파일 변경 시 디바운스된 재인덱싱이 트리거됩니다(1.5초).
- **자동 재인덱싱:** 임베딩 공급자, 모델 또는 청킹 구성이 바뀌면 전체 인덱스가 자동으로 다시 빌드됩니다.
- **온디맨드 재인덱싱:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths`를 사용하면 워크스페이스 외부의 Markdown 파일도 인덱싱할 수 있습니다. 자세한 내용은 [구성 참조](/ko/reference/memory-config#additional-memory-paths)를 참조하세요.
</Info>

## 사용 시점

대부분의 사용자에게 내장 엔진이 적절한 선택입니다.

- 추가 의존성 없이 바로 동작합니다.
- 키워드 및 벡터 검색을 모두 잘 처리합니다.
- 모든 임베딩 공급자를 지원합니다.
- 하이브리드 검색은 두 검색 방식의 장점을 결합합니다.

재순위 지정, 쿼리 확장 기능이 필요하거나 워크스페이스 외부 디렉터리를 인덱싱하려면 [QMD](/ko/concepts/memory-qmd)로 전환하는 것을 고려하세요.

자동 사용자 모델링이 포함된 세션 간 메모리가 필요하다면 [Honcho](/ko/concepts/memory-honcho)를 고려하세요.

## 문제 해결

**메모리 검색이 비활성화되었나요?** `openclaw memory status`를 확인하세요. 감지된 공급자가 없으면 하나를 명시적으로 설정하거나 API 키를 추가하세요.

**로컬 공급자가 감지되지 않나요?** 로컬 경로가 존재하는지 확인한 다음 다음을 실행하세요.

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

독립형 CLI 명령과 Gateway는 모두 동일한 `local` 공급자 ID를 사용합니다. 공급자가 `auto`로 설정된 경우, `memorySearch.local.modelPath`가 존재하는 로컬 파일을 가리킬 때만 로컬 임베딩이 우선 고려됩니다.

**결과가 오래되었나요?** `openclaw memory index --force`를 실행해 다시 빌드하세요. 드문 경우 파일 감시기가 변경을 놓칠 수 있습니다.

**sqlite-vec이 로드되지 않나요?** OpenClaw는 자동으로 프로세스 내 코사인 유사도 방식으로 대체합니다. 구체적인 로드 오류는 로그를 확인하세요.

## 구성

임베딩 공급자 설정, 하이브리드 검색 튜닝(가중치, MMR, 시간 감쇠), 배치 인덱싱, 멀티모달 메모리, sqlite-vec, 추가 경로 및 기타 모든 구성 옵션은 [메모리 구성 참조](/ko/reference/memory-config)를 참조하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [Active Memory](/ko/concepts/active-memory)
