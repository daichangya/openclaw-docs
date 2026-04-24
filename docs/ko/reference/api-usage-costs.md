---
read_when:
    - 유료 API를 호출할 수 있는 기능이 무엇인지 이해하고 싶습니다
    - 키, 비용, 사용량 가시성을 감사해야 합니다
    - /status 또는 /usage cost 보고를 설명하고 있습니다
summary: 무엇이 비용을 발생시키는지, 어떤 키가 사용되는지, 사용량을 어떻게 보는지 감사하기
title: API 사용량 및 비용
x-i18n:
    generated_at: "2026-04-24T06:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 사용량 및 비용

이 문서는 **API 키를 호출할 수 있는 기능**과 그 비용이 어디에 표시되는지를 정리합니다. OpenClaw 기능 중 provider 사용량이나 유료 API 호출을 발생시킬 수 있는 부분에 초점을 맞춥니다.

## 비용이 표시되는 위치(채팅 + CLI)

**세션별 비용 스냅샷**

- `/status`는 현재 세션 모델, 컨텍스트 사용량, 마지막 응답 토큰을 표시합니다.
- 모델이 **API 키 인증**을 사용할 경우 `/status`는 마지막 응답의 **예상 비용**도 표시합니다.
- 실제 세션 메타데이터가 희소한 경우 `/status`는 최신 transcript 사용량 항목에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수 있습니다. 기존의 0이 아닌 실제 값은 계속 우선하고, 저장된 총합이 없거나 더 작을 때는 프롬프트 크기 기준 transcript 총합이 우선할 수 있습니다.

**메시지별 비용 푸터**

- `/usage full`은 모든 응답에 사용량 푸터를 추가하며, **예상 비용**도 포함합니다(API 키 전용).
- `/usage tokens`는 토큰만 표시합니다. 구독 스타일 OAuth/토큰 및 CLI 흐름은 달러 비용을 숨깁니다.
- Gemini CLI 참고: CLI가 JSON 출력을 반환할 때 OpenClaw는
  `stats`에서 사용량을 읽고 `stats.cached`를 `cacheRead`로 정규화하며,
  필요할 때 `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.

Anthropic 참고: Anthropic 측에서 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔기 때문에, Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을 이 통합에 대해 승인된 것으로 취급합니다.
Anthropic은 여전히 `/usage full`에 표시할 수 있는 메시지별 달러 추정치를 노출하지 않습니다.

**CLI 사용량 윈도우(provider quota)**

- `openclaw status --usage`와 `openclaw channels list`는 provider **사용량 윈도우**
  (메시지별 비용이 아니라 quota 스냅샷)을 표시합니다.
- 사람이 읽는 출력은 provider 전반에서 `X% left`로 정규화됩니다.
- 현재 사용량 윈도우 provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.
- MiniMax 참고: 원시 `usage_percent` / `usagePercent` 필드는 남은
  quota를 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 개수 기반 필드가 있으면 그것이 계속 우선합니다. provider가 `model_remains`를 반환하면 OpenClaw는 채팅 모델 항목을 우선하고, 필요 시 타임스탬프에서 윈도우 레이블을 계산하며, 계획 레이블에 모델 이름을 포함합니다.
- 해당 quota 윈도우에 대한 사용량 인증은 가능할 때 provider별 hook에서 가져오고, 그렇지 않으면 OpenClaw는 auth profile, env 또는 config의 일치하는 OAuth/API 키 자격 증명으로 폴백합니다.

자세한 내용과 예시는 [Token use & costs](/ko/reference/token-use)를 참조하세요.

## 키가 발견되는 방식

OpenClaw는 다음에서 자격 증명을 가져올 수 있습니다.

- **인증 프로필**(에이전트별, `auth-profiles.json`에 저장)
- **환경 변수**(예: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) — 키를 skill 프로세스 env로 내보낼 수 있음

## 비용을 발생시킬 수 있는 기능

### 1) core 모델 응답(채팅 + 도구)

모든 응답 또는 도구 호출은 **현재 모델 provider**(OpenAI, Anthropic 등)를 사용합니다. 이것이 사용량과 비용의 주요 원인입니다.

여기에는 OpenClaw 로컬 UI 밖에서 여전히 과금되는 구독 스타일 호스팅 provider도 포함됩니다. 예:
**OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, 그리고
**Extra Usage**가 활성화된 Anthropic의 OpenClaw Claude 로그인 경로.

가격 config는 [Models](/ko/providers/models), 표시 방식은 [Token use & costs](/ko/reference/token-use)를 참조하세요.

### 2) 미디어 이해(오디오/이미지/비디오)

인바운드 미디어는 응답이 실행되기 전에 요약/전사될 수 있습니다. 이 과정은 모델/provider API를 사용합니다.

- 오디오: OpenAI / Groq / Deepgram / Google / Mistral
- 이미지: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- 비디오: Google / Qwen / Moonshot

[미디어 이해](/ko/nodes/media-understanding)를 참조하세요.

### 3) 이미지 및 비디오 생성

공유 생성 기능도 provider 키 비용을 발생시킬 수 있습니다.

- 이미지 생성: OpenAI / Google / fal / MiniMax
- 비디오 생성: Qwen

이미지 생성은 `agents.defaults.imageGenerationModel`이 설정되지 않았을 때
인증이 있는 provider 기본값을 추론할 수 있습니다. 비디오 생성은 현재
`qwen/wan2.6-t2v` 같은 명시적인 `agents.defaults.videoGenerationModel`이 필요합니다.

[이미지 생성](/ko/tools/image-generation), [Qwen Cloud](/ko/providers/qwen),
[Models](/ko/concepts/models)를 참조하세요.

### 4) 메모리 임베딩 + 시맨틱 검색

시맨틱 메모리 검색은 원격 provider용으로 구성된 경우 **임베딩 API**를 사용합니다.

- `memorySearch.provider = "openai"` → OpenAI 임베딩
- `memorySearch.provider = "gemini"` → Gemini 임베딩
- `memorySearch.provider = "voyage"` → Voyage 임베딩
- `memorySearch.provider = "mistral"` → Mistral 임베딩
- `memorySearch.provider = "lmstudio"` → LM Studio 임베딩(로컬/자체 호스팅)
- `memorySearch.provider = "ollama"` → Ollama 임베딩(로컬/자체 호스팅, 보통 호스팅 API 과금 없음)
- 로컬 임베딩 실패 시 원격 provider로의 선택적 폴백

`memorySearch.provider = "local"`로 설정하면 로컬만 사용할 수 있습니다(API 사용 없음).

[Memory](/ko/concepts/memory)를 참조하세요.

### 5) 웹 검색 도구

`web_search`는 provider에 따라 사용량 요금이 발생할 수 있습니다.

- **Brave Search API**: `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` 또는 `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, 또는 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, 또는 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: 기본적으로 키 필요 없음. 하지만 접근 가능한 Ollama 호스트와 `ollama signin`이 필요하며, 호스트가 이를 요구하는 경우 일반 Ollama provider bearer 인증도 재사용할 수 있음
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, 또는 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: 키 없는 폴백(API 과금 없음, 단 비공식이며 HTML 기반)
- **SearXNG**: `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl` (키 없음/자체 호스팅, 호스팅 API 과금 없음)

레거시 `tools.web.search.*` provider 경로는 여전히 임시 호환성 shim을 통해 로드되지만, 더 이상 권장되는 config 표면은 아닙니다.

**Brave Search 무료 크레딧:** 각 Brave 플랜에는 매월 갱신되는
\$5/월의 무료 크레딧이 포함됩니다. Search 플랜은 1,000회 요청당 \$5이므로
이 크레딧으로 월 1,000회 요청을 무료로 처리할 수 있습니다. 예기치 않은 비용을 피하려면 Brave 대시보드에서 사용량 한도를 설정하세요.

[Web tools](/ko/tools/web)를 참조하세요.

### 5) 웹 fetch 도구(Firecrawl)

`web_fetch`는 API 키가 있을 때 **Firecrawl**을 호출할 수 있습니다.

- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl이 구성되어 있지 않으면 이 도구는 직접 fetch + readability로 폴백합니다(유료 API 없음).

[Web tools](/ko/tools/web)를 참조하세요.

### 6) provider 사용량 스냅샷(status/health)

일부 status 명령은 quota 윈도우나 인증 상태를 표시하기 위해 **provider 사용량 엔드포인트**를 호출합니다.
이는 일반적으로 호출량이 적지만 여전히 provider API를 사용합니다.

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/ko/cli/models)를 참조하세요.

### 7) Compaction 보호 요약

Compaction 보호 기능은 **현재 모델**을 사용해 세션 기록을 요약할 수 있으며,
실행될 때 provider API를 호출합니다.

[세션 관리 + Compaction](/ko/reference/session-management-compaction)을 참조하세요.

### 8) 모델 스캔 / probe

`openclaw models scan`은 OpenRouter 모델을 probe할 수 있으며,
probe가 활성화된 경우 `OPENROUTER_API_KEY`를 사용합니다.

[Models CLI](/ko/cli/models)를 참조하세요.

### 9) Talk (음성)

Talk 모드는 구성된 경우 **ElevenLabs**를 호출할 수 있습니다.

- `ELEVENLABS_API_KEY` 또는 `talk.providers.elevenlabs.apiKey`

[Talk mode](/ko/nodes/talk)를 참조하세요.

### 10) Skills (타사 API)

Skills는 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. Skill이 그 키를 외부
API에 사용하면 해당 skill의 provider 정책에 따라 비용이 발생할 수 있습니다.

[Skills](/ko/tools/skills)를 참조하세요.

## 관련 항목

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
