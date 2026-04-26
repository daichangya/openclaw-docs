---
read_when:
    - Dostrajanie domyślnych ustawień agenta (modele, myślenie, workspace, Heartbeat, multimedia, Skills)
    - Konfigurowanie routingu i powiązań wieloagentowych
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu talk
summary: Domyślne ustawienia agenta, routing wieloagentowy, konfiguracja sesji, wiadomości i talk
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-04-26T11:28:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Klucze konfiguracji w zakresie agenta pod `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. W przypadku kanałów, narzędzi, runtime Gateway i innych
kluczy najwyższego poziomu zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agenta

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium pokazywany w wierszu Runtime system promptu. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych Skills dla agentów, które nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie Skills nie były ograniczane.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie
  jest łączona z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki bootstrap workspace są wstrzykiwane do system promptu. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzykiwanie bootstrap workspace, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza wstrzykiwanie bootstrap workspace i plików kontekstowych w każdej turze. Używaj tego tylko dla agentów, które w pełni zarządzają własnym cyklem życia promptu (niestandardowe silniki kontekstu, natywne runtime, które budują własny kontekst, albo wyspecjalizowane przebiegi bez bootstrap). Tury Heartbeat i odzyskiwania po Compaction również pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap workspace przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików bootstrap workspace. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczny dla agenta tekst ostrzeżenia, gdy kontekst bootstrap zostaje obcięty.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do system promptu.
- `"once"`: wstrzykuj ostrzeżenie raz dla każdego unikalnego sygnatury obcięcia (zalecane).
- `"always"`: wstrzykuj ostrzeżenie przy każdym uruchomieniu, gdy istnieje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele budżetów promptu/kontekstu o dużym wolumenie i są one
celowo rozdzielone według podsystemów zamiast przechodzić przez jedno ogólne
pokrętło.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie bootstrap workspace.
- `agents.defaults.startupContext.*`:
  jednorazowe preludium startowe `/new` i `/reset`, w tym ostatnie dzienne
  pliki `memory/*.md`.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do system promptu.
- `agents.defaults.contextLimits.*`:
  ograniczone wycinki runtime i wstrzykiwane bloki należące do runtime.
- `memory.qmd.limits.*`:
  rozmiar fragmentu i wstrzykiwania indeksowanego wyszukiwania pamięci.

Używaj pasującego nadpisania per agent tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje preludium startowe pierwszej tury wstrzykiwane przy pustych uruchomieniach `/new` i `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Współdzielone wartości domyślne dla ograniczonych powierzchni kontekstu runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: domyślny limit wycinka `memory_get` przed dodaniem
  metadanych obcięcia i informacji o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno linii `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: bieżący limit wyników narzędzi używany dla zapisanych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit wycinka `AGENTS.md` używany podczas wstrzykiwania odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie per agent dla współdzielonych pokręteł `contextLimits`. Pominięte pola dziedziczą
z `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit dla kompaktowej listy Skills wstrzykiwanej do system promptu. To
nie wpływa na odczyt plików `SKILL.md` na żądanie.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Nadpisanie per agent dla budżetu promptu Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar w pikselach dla dłuższego boku obrazu w blokach obrazu transkryptu/narzędzi przed wywołaniami providera.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów wizji i rozmiar ładunku żądania w przebiegach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu system promptu (nie dla znaczników czasu wiadomości). Używa fallback do strefy czasowej hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w system prompt. Domyślnie: `auto` (preferencja systemu operacyjnego).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globalne domyślne parametry providera
      agentRuntime: {
        id: "pi", // pi | auto | zarejestrowany identyfikator harnessu, np. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Forma ciągu ustawia tylko model główny.
  - Forma obiektu ustawia model główny oraz uporządkowane modele failover.
- `imageModel`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu vision.
  - Używany także do routingu fallback, gdy wybrany/domyślny model nie obsługuje wejścia obrazowego.
- `imageGenerationModel`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/pluginu generującą obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images lub `openai/gpt-image-1.5` dla wyjścia OpenAI PNG/WebP z przezroczystym tłem.
  - Jeśli wybierzesz bezpośrednio provider/model, skonfiguruj też pasujące uwierzytelnianie providera (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` lub OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pole jest pominięte, `image_generate` nadal może wywnioskować domyślny provider oparty na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania obrazów w kolejności identyfikatorów providerów.
- `musicGenerationModel`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.6`.
  - Jeśli pole jest pominięte, `music_generate` nadal może wywnioskować domyślny provider oparty na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania muzyki w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz bezpośrednio provider/model, skonfiguruj też pasujące uwierzytelnianie/API key providera.
- `videoGenerationModel`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli pole jest pominięte, `video_generate` nadal może wywnioskować domyślny provider oparty na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania wideo w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz bezpośrednio provider/model, skonfiguruj też pasujące uwierzytelnianie/API key providera.
  - Dołączony provider generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 wejściowy obraz, 4 wejściowe wideo, czas trwania do 10 sekund oraz opcje na poziomie providera `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje albo ciąg znaków (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modelu.
  - Jeśli pole jest pominięte, narzędzie PDF używa fallback do `imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie jest przekazane w czasie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb fallback ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom verbose dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `elevatedDefault`: domyślny poziom elevated-output dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla dostępu przez API key lub `openai-codex/gpt-5.5` dla Codex OAuth). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego providera dla tego dokładnego identyfikatora modelu, a dopiero na końcu używa fallback do skonfigurowanego domyślnego providera (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten provider nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw używa fallback do pierwszego skonfigurowanego providera/modelu zamiast zgłaszać nieaktualne ustawienie domyślne dla usuniętego providera.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) oraz `params` (specyficzne dla providera, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odmawia zamian, które usunęłyby istniejące wpisy listy dozwolonych, chyba że przekażesz `--replace`.
  - Przebiegi konfiguracji/onboardingu w zakresie providera scalają wybrane modele providera do tej mapy i zachowują już skonfigurowanych, niezwiązanych providerów.
  - Dla bezpośrednich modeli OpenAI Responses server-side Compaction jest włączany automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, lub `params.responsesCompactThreshold`, aby nadpisać próg. Zobacz [OpenAI server-side compaction](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry providera stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Priorytet scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest nadpisywane przez `agents.defaults.models["provider/model"].params` (per model), a następnie `agents.list[].params` (pasujący identyfikator agenta) nadpisuje po kluczu. Szczegóły znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: zaawansowany pass-through JSON scalany z ciałami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowe body wygrywa; nienatywne ścieżki completions nadal później usuwają właściwość `store` właściwą tylko dla OpenAI.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI, scalane z ciałami żądań najwyższego poziomu `api: "openai-completions"`. Dla `vllm/nemotron-3-*` przy wyłączonym myśleniu OpenClaw automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` nadpisują te wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczny priorytet.
- `params.preserveThinking`: opt-in tylko dla Z.AI dla preserved thinking. Gdy jest włączone i myślenie jest aktywne, OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [Z.AI thinking and preserved thinking](/pl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: domyślna polityka niskopoziomowego runtime agenta. Pominięte `id` domyślnie oznacza OpenClaw Pi. Użyj `id: "pi"`, aby wymusić wbudowany harness PI, `id: "auto"`, aby pozwolić zarejestrowanym harnessom pluginów przejmować obsługiwane modele, zarejestrowanego identyfikatora harnessu, takiego jak `id: "codex"`, albo obsługiwanego aliasu backendu CLI, takiego jak `id: "claude-cli"`. Ustaw `fallback: "none"`, aby wyłączyć automatyczny fallback do Pi. Jawne runtime pluginów, takie jak `codex`, domyślnie kończą się błędem w trybie fail-closed, chyba że ustawisz `fallback: "pi"` w tym samym zakresie nadpisania. Zachowuj referencje modeli w kanonicznej postaci `provider/model`; wybieraj Codex, Claude CLI, Gemini CLI i inne backendy wykonawcze przez konfigurację runtime zamiast przestarzałych prefiksów providerów runtime. Zobacz [Agent runtimes](/pl/concepts/agent-runtimes), aby zrozumieć, czym różni się to od wyboru provider/model.
- Zapisujące konfigurację mechanizmy, które modyfikują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania fallback), zapisują kanoniczną formę obiektu i w miarę możliwości zachowują istniejące listy fallback.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kontroluje, który niskopoziomowy executor uruchamia tury agenta. W większości
wdrożeń należy pozostawić domyślny runtime OpenClaw Pi. Użyj tego, gdy zaufany
plugin udostępnia natywny harness, taki jak dołączony harness serwera aplikacji Codex,
albo gdy chcesz używać obsługiwanego backendu CLI, takiego jak Claude CLI. Model mentalny znajdziesz w [Agent runtimes](/pl/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, zarejestrowany identyfikator harnessu pluginu albo obsługiwany alias backendu CLI. Dołączony plugin Codex rejestruje `codex`; dołączony plugin Anthropic udostępnia backend CLI `claude-cli`.
- `fallback`: `"pi"` lub `"none"`. W trybie `id: "auto"` pominięty fallback domyślnie ma wartość `"pi"`, aby starsze konfiguracje mogły nadal używać PI, gdy żaden harness pluginu nie przejmie uruchomienia. W trybie jawnego runtime pluginu, takim jak `id: "codex"`, pominięty fallback domyślnie ma wartość `"none"`, aby brakujący harness powodował błąd zamiast cichego użycia PI. Nadpisania runtime nie dziedziczą fallback z szerszego zakresu; ustaw `fallback: "pi"` obok jawnego runtime, gdy celowo chcesz taki fallback zgodności. Błędy wybranego harnessu pluginu są zawsze pokazywane bezpośrednio.
- Nadpisania środowiskowe: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` nadpisuje `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` nadpisuje fallback dla tego procesu.
- W wdrożeniach tylko z Codex ustaw `model: "openai/gpt-5.5"` oraz `agentRuntime.id: "codex"`. Możesz również jawnie ustawić `agentRuntime.fallback: "none"` dla czytelności; jest to wartość domyślna dla jawnych runtime pluginów.
- W wdrożeniach Claude CLI preferuj `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Przestarzałe referencje modeli `claude-cli/claude-opus-4-7` nadal działają dla zgodności, ale nowa konfiguracja powinna zachowywać wybór provider/model w formie kanonicznej i umieszczać backend wykonawczy w `agentRuntime.id`.
- Starsze klucze polityki runtime są przepisywane do `agentRuntime` przez `openclaw doctor --fix`.
- Wybór harnessu jest przypinany per identyfikator sesji po pierwszym osadzonym uruchomieniu. Zmiany konfiguracji/środowiska wpływają na nowe lub zresetowane sesje, a nie na istniejący transkrypt. Starsze sesje z historią transkryptu, ale bez zapisanego przypięcia, są traktowane jako przypięte do PI. `/status` raportuje efektywny runtime, na przykład `Runtime: OpenClaw Pi Default` lub `Runtime: OpenAI Codex`.
- To kontroluje tylko wykonywanie tekstowych tur agenta. Generowanie multimediów, vision, PDF, muzyki, wideo i TTS nadal używają swoich ustawień provider/model.

**Wbudowane skrócone aliasy** (mają zastosowanie tylko wtedy, gdy model znajduje się w `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` lub `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Twoje skonfigurowane aliasy zawsze mają pierwszeństwo przed domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla streamingu wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają myślenia `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI dla awaryjnych uruchomień tekstowych (bez wywołań narzędzi). Przydatne jako zapasowe rozwiązanie, gdy providery API zawodzą.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Albo użyj `systemPromptFileArg`, gdy CLI akceptuje flagę pliku promptu.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backendy CLI są zorientowane na tekst; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawione jest `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki do plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały system prompt złożony przez OpenClaw stałym ciągiem znaków. Ustawiane na poziomie domyślnym (`agents.defaults.systemPromptOverride`) albo per agent (`agents.list[].systemPromptOverride`). Wartości per agent mają pierwszeństwo; pusta wartość lub wartość zawierająca tylko białe znaki jest ignorowana. Przydatne do kontrolowanych eksperymentów z promptami.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Niezależne od providera nakładki promptu stosowane według rodziny modeli. Identyfikatory modeli z rodziny GPT-5 otrzymują współdzielony kontrakt zachowania między providerami; `personality` kontroluje tylko warstwę przyjaznego stylu interakcji.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (domyślnie) i `"on"` włączają warstwę przyjaznego stylu interakcji.
- `"off"` wyłącza tylko warstwę przyjazną; tagowany kontrakt zachowania GPT-5 pozostaje włączony.
- Przestarzałe `plugins.entries.openai.config.personality` jest nadal odczytywane, gdy to współdzielone ustawienie nie jest ustawione.

### `agents.defaults.heartbeat`

Okresowe uruchomienia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m wyłącza
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // domyślnie: true; false pomija sekcję Heartbeat w system prompt
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w nowej sesji (bez historii rozmowy)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (domyślnie) | block
        target: "none", // domyślnie: none | opcje: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie API key) lub `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w system prompt i pomija wstrzykiwanie `HEARTBEAT.md` do kontekstu bootstrap. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, tłumi ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: polityka dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` tłumi dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
- `isolatedSession`: gdy ma wartość true, każdy Heartbeat działa w nowej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co w Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów per Heartbeat z około 100K do około 2–5K tokenów.
- Per agent: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- Heartbeat uruchamia pełne tury agenta — krótsze interwały spalają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // identyfikator zarejestrowanego pluginu providera Compaction (opcjonalnie)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // używane, gdy identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] wyłącza ponowne wstrzykiwanie
        model: "openrouter/anthropic/claude-sonnet-4-6", // opcjonalne nadpisanie modelu tylko dla Compaction
        notifyUser: true, // wysyła krótkie powiadomienia do użytkownika przy rozpoczęciu i zakończeniu Compaction (domyślnie: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` lub `safeguard` (podsumowywanie porcjowane dla długiej historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego pluginu providera Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` providera zamiast wbudowanego podsumowania przez LLM. W razie błędu używa fallback do wbudowanego mechanizmu. Ustawienie providera wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla jednej operacji Compaction, po której OpenClaw ją przerywa. Domyślnie: `900`.
- `keepRecentTokens`: budżet punktu cięcia Pi do zachowania najnowszego ogona transkryptu dosłownie. Ręczne `/compact` uwzględnia to, gdy jest jawnie ustawione; w przeciwnym razie ręczny Compaction jest twardym checkpointem.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki zachowania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst zachowania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponownej próby przy nieprawidłowym wyjściu dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z `AGENTS.md` do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzykiwanie. Gdy pole nie jest ustawione albo jawnie ustawione na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są również akceptowane jako starszy fallback.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla podsumowania Compaction. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction powinny działać na innym; gdy pole nie jest ustawione, Compaction używa modelu głównego sesji.
- `notifyUser`: gdy ma wartość `true`, wysyła krótkie powiadomienia do użytkownika, gdy Compaction się rozpoczyna i kończy (na przykład „Compacting context...” i „Compaction complete”). Domyślnie wyłączone, aby zachować ciszę wokół Compaction.
- `memoryFlush`: cicha tura agentowa przed automatycznym Compaction do zapisania trwałych wspomnień. Pomijana, gdy workspace jest tylko do odczytu.

### `agents.defaults.contextPruning`

Przycina **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem do LLM. **Nie** modyfikuje historii sesji na dysku.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // czas trwania (ms/s/m/h), domyślna jednostka: minuty
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` kontroluje, jak często przycinanie może uruchomić się ponownie (po ostatnim dotknięciu cache).
- Przycinanie najpierw miękko obcina zbyt duże wyniki narzędzi, a potem twardo czyści starsze wyniki narzędzi, jeśli to konieczne.

**Soft-trim** zachowuje początek i koniec oraz wstawia `...` pośrodku.

**Hard-clear** zastępuje cały wynik narzędzia placeholderem.

Uwagi:

- Bloki obrazów nigdy nie są przycinane/czyszczone.
- Współczynniki są oparte na znakach (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły zachowania znajdziesz w [Przycinanie sesji](/pl/concepts/session-pruning).

### Streaming bloków

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (użyj minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa przerwa między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie per agent: `agents.list[].humanDelay`.

Szczegóły zachowania i chunkingu znajdziesz w [Streaming](/pl/concepts/streaming).

### Wskaźniki pisania

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla czatów grupowych bez wzmianki.
- Nadpisania per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalny sandboxing dla osadzonego agenta. Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Obsługiwane są też SecretRefs / treści inline:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Szczegóły sandbox">

**Backend:**

- `docker`: lokalny runtime Docker (domyślnie)
- `ssh`: ogólny zdalny runtime oparty na SSH
- `openshell`: runtime OpenShell

Gdy wybrane jest `backend: "openshell"`, ustawienia specyficzne dla runtime są przenoszone do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla workspace per zakres
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące lokalne pliki przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline lub SecretRefs, które OpenClaw materializuje do plików tymczasowych w runtime
- `strictHostKeyChecking` / `updateHostKeys`: pokrętła polityki kluczy hosta OpenSSH

**Priorytet uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnego snapshotu runtime sekretów przed rozpoczęciem sesji sandbox

**Zachowanie backendu SSH:**

- inicjalizuje zdalny workspace raz po utworzeniu lub odtworzeniu
- następnie utrzymuje zdalny workspace SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem na hosta
- nie obsługuje kontenerów przeglądarki sandbox

**Dostęp do workspace:**

- `none`: workspace sandbox per zakres pod `~/.openclaw/sandboxes`
- `ro`: workspace sandbox pod `/workspace`, workspace agenta zamontowany tylko do odczytu pod `/agent`
- `rw`: workspace agenta zamontowany do odczytu/zapisu pod `/workspace`

**Zakres:**

- `session`: kontener + workspace per sesja
- `agent`: jeden kontener + workspace per agent (domyślnie)
- `shared`: współdzielony kontener i workspace (bez izolacji między sesjami)

**Konfiguracja pluginu OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcjonalnie
          gatewayEndpoint: "https://lab.example", // opcjonalnie
          policy: "strict", // opcjonalny identyfikator polityki OpenShell
          providers: ["openai"], // opcjonalnie
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: inicjalizuje zdalne środowisko z lokalnego przed `exec`, synchronizuje z powrotem po `exec`; lokalny workspace pozostaje kanoniczny
- `remote`: inicjalizuje zdalne środowisko raz przy tworzeniu sandbox, następnie utrzymuje zdalny workspace jako kanoniczny

W trybie `remote` lokalne edycje hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do sandbox po kroku inicjalizacji.
Transport odbywa się przez SSH do sandbox OpenShell, ale plugin zarządza cyklem życia sandbox i opcjonalną synchronizacją mirror.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego połączenia sieciowego, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub własną sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest zablokowane. `"container:<id>"` jest domyślnie zablokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Załączniki przychodzące** są tymczasowo umieszczane w `media/inbound/*` w aktywnym workspace.

**`docker.binds`** montuje dodatkowe katalogi hosta; globalne i per-agent binds są scalane.

**Przeglądarka sandboxowana** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC jest wstrzykiwany do system promptu. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje URL z krótkotrwałym tokenem (zamiast ujawniać hasło we współdzielonym URL).

- `allowHostControl: false` (domyślnie) blokuje sesje sandboxowane przed kierowaniem ruchu do przeglądarki hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na brzegu kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera przeglądarki sandbox. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne parametry uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone pod hosty kontenerowe:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<pochodzący z OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (domyślnie włączone)
  - `--disable-3d-apis`, `--disable-software-rasterizer` i `--disable-gpu` są
    domyślnie włączone i można je wyłączyć przez
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli użycie WebGL/3D tego wymaga.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli Twój workflow
    ich wymaga.
  - `--renderer-process-limit=2` można zmienić przez
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć
    domyślnego limitu procesów Chromium.
  - oraz `--no-sandbox`, gdy włączone jest `noSandbox`.
  - Wartości domyślne są bazą obrazu kontenera; użyj własnego obrazu przeglądarki z własnym
    entrypoint, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Sandboxing przeglądarki i `sandbox.docker.binds` są dostępne tylko dla Docker.

Budowanie obrazów:

```bash
scripts/sandbox-setup.sh           # główny obraz sandbox
scripts/sandbox-browser-setup.sh   # opcjonalny obraz przeglądarki
```

### `agents.list` (nadpisania per agent)

Użyj `agents.list[].tts`, aby nadać agentowi własnego providera TTS, głos, model,
styl albo tryb automatycznego TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, więc współdzielone poświadczenia mogą pozostać w jednym miejscu, podczas gdy poszczególni
agenci nadpisują tylko potrzebne pola głosu lub providera. Nadpisanie aktywnego agenta
ma zastosowanie do automatycznych odpowiedzi głosowych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Przykłady providerów i priorytet znajdziesz w [Text-to-speech](/pl/tools/tts#per-agent-voice-overrides).

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // albo { primary, fallbacks }
        thinkingDefault: "high", // nadpisanie poziomu myślenia per agent
        reasoningDefault: "on", // nadpisanie widoczności reasoning per agent
        fastModeDefault: false, // nadpisanie fast mode per agent
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // nadpisuje pasujące params z defaults.models po kluczu
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // zastępuje agents.defaults.skills, gdy ustawione
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabilny identyfikator agenta (wymagany).
- `default`: gdy ustawionych jest wiele, wygrywa pierwszy (zapisywane jest ostrzeżenie). Jeśli żaden nie jest ustawiony, domyślny jest pierwszy wpis listy.
- `model`: forma ciągu nadpisuje tylko `primary`; forma obiektu `{ primary, fallbacks }` nadpisuje oba (`[]` wyłącza globalne fallbacki). Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne fallbacki, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per agent scalane ponad wybrany wpis modelu w `agents.defaults.models`. Używaj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania text-to-speech per agent. Blok jest głęboko scalany z `messages.tts`, więc współdzielone poświadczenia providera i politykę fallback trzymaj w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak provider, głos, model, styl lub tryb auto.
- `skills`: opcjonalna lista dozwolonych Skills per agent. Jeśli pole jest pominięte, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast się z nimi scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania per wiadomość lub sesję. Wybrany profil providera/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie należące do providera (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność reasoning per agent (`on | off | stream`). Ma zastosowanie, gdy nie ustawiono nadpisania reasoning per wiadomość lub sesję.
- `fastModeDefault`: opcjonalna wartość domyślna fast mode per agent (`true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania fast mode per wiadomość lub sesję.
- `agentRuntime`: opcjonalne nadpisanie polityki niskopoziomowego runtime per agent. Użyj `{ id: "codex" }`, aby jeden agent był tylko Codex, podczas gdy inni agenci zachowają domyślny fallback PI w trybie `auto`.
- `runtime`: opcjonalny deskryptor runtime per agent. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent powinien domyślnie używać sesji harness ACP.
- `identity.avatar`: ścieżka względna do workspace, URL `http(s)` lub URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów agentów dla `sessions_spawn` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- Ochrona dziedziczenia sandbox: jeśli sesja żądająca jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandbox.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wieloagentowy

Uruchamiaj wiele izolowanych agentów wewnątrz jednego Gateway. Zobacz [Wieloagentowość](/pl/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Pola dopasowania powiązań

- `type` (opcjonalnie): `route` dla zwykłego routingu (brak typu domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalnie; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalnie; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalnie; specyficzne dla kanału)
- `acp` (opcjonalnie; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (dla całego kanału)
6. Agent domyślny

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje według dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań route.

### Profile dostępu per agent

<Accordion title="Pełny dostęp (bez sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Narzędzia i workspace tylko do odczytu">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Brak dostępu do systemu plików (tylko wiadomości)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Szczegóły priorytetów znajdziesz w [Wieloagentowy sandbox i narzędzia](/pl/tools/multi-agent-sandbox-tools).

---

## Sesja

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // pomija fork wątku nadrzędnego powyżej tej liczby tokenów (0 wyłącza)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // czas trwania lub false
      maxDiskBytes: "500mb", // opcjonalny twardy budżet
      highWaterBytes: "400mb", // opcjonalny cel czyszczenia
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // domyślne automatyczne odwiązanie po bezczynności w godzinach (`0` wyłącza)
      maxAgeHours: 0, // domyślny twardy maksymalny wiek w godzinach (`0` wyłącza)
    },
    mainKey: "main", // starsze pole (runtime zawsze używa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól sesji">

- **`scope`**: bazowa strategia grupowania sesji dla kontekstów czatu grupowego.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w obrębie kontekstu kanału.
  - `global`: wszyscy uczestnicy kontekstu kanału współdzielą jedną sesję (używaj tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania DM.
  - `main`: wszystkie DM współdzielą główną sesję.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja per kanał + nadawca (zalecane dla wieloużytkownikowych skrzynek odbiorczych).
  - `per-account-channel-peer`: izolacja per konto + kanał + nadawca (zalecane dla wielu kont).
- **`identityLinks`**: mapa identyfikatorów kanonicznych na peery z prefiksem providera dla współdzielenia sesji między kanałami.
- **`reset`**: podstawowa polityka resetu. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowane są oba, wygrywa to, które wygaśnie pierwsze. Świeżość codziennego resetu używa `sessionStartedAt` z wiersza sesji; świeżość resetu po bezczynności używa `lastInteractionAt`. Zapisy w tle/zdarzeń systemowych, takie jak Heartbeat, wybudzenia Cron, powiadomienia exec i księgowanie Gateway, mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynności.
- **`resetByType`**: nadpisania per typ (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`parentForkMaxTokens`**: maksymalna liczba `totalTokens` sesji nadrzędnej dozwolona przy tworzeniu rozwidlonej sesji wątku (domyślnie `100000`).
  - Jeśli `totalTokens` rodzica jest powyżej tej wartości, OpenClaw rozpoczyna nową sesję wątku zamiast dziedziczyć historię transkryptu rodzica.
  - Ustaw `0`, aby wyłączyć tę ochronę i zawsze zezwalać na fork rodzica.
- **`mainKey`**: starsze pole. Runtime zawsze używa `"main"` dla głównego koszyka czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasowuje według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsze odrzucenie wygrywa.
- **`maintenance`**: sterowanie czyszczeniem i retencją magazynu sesji.
  - `mode`: `warn` emituje tylko ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`).
  - `rotateBytes`: rotuje `sessions.json`, gdy przekroczy ten rozmiar (domyślnie `10mb`).
  - `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>`. Domyślnie odpowiada `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` zapisuje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` z `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny domyślny przełącznik (providery mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odwiązanie po bezczynności w godzinach (`0` wyłącza; providery mogą nadpisywać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; providery mogą nadpisywać)

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // albo "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 wyłącza
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks odpowiedzi

Nadpisania per kanał/konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozwiązywanie (wygrywa najbardziej szczegółowe): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna          | Opis                     | Przykład                    |
| ---------------- | ------------------------ | --------------------------- |
| `{model}`         | Krótka nazwa modelu      | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa providera          | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia  | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta  | (to samo co `"auto"`)       |

Zmienne nie rozróżniają wielkości liter. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja ack

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania per kanał: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozwiązywania: konto → kanał → `messages.ackReaction` → fallback tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa ack po odpowiedzi na kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i BlueBubbles.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia na Slack, Discord i Telegram.
  Na Slack i Discord brak ustawienia utrzymuje reakcje statusu włączone, gdy aktywne są reakcje ack.
  Na Telegram ustaw to jawnie na `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce przychodzący

Łączy szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki są natychmiast opróżniane. Polecenia sterujące omijają debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` kontroluje domyślny tryb automatycznego TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może nadpisać lokalne preferencje, a `/tts status` pokazuje stan efektywny.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` domyślnie ma wartość `false` (opt-in).
- API key używają fallback do `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- Dołączeni providery mowy należą do pluginów. Jeśli ustawiono `plugins.allow`, dołącz każdy plugin providera TTS, którego chcesz używać, na przykład `microsoft` dla Edge TTS. Starszy identyfikator providera `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` nadpisuje endpoint OpenAI TTS. Kolejność rozwiązywania to konfiguracja, potem `OPENAI_TTS_BASE_URL`, a następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje endpoint inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

---

## Talk

Wartości domyślne dla trybu Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` musi odpowiadać kluczowi w `talk.providers`, gdy skonfigurowano wielu providerów Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów używają fallback do `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje ciągi plaintext lub obiekty SecretRef.
- Fallback `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano API key dla Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX na macOS. Jeśli pole jest pominięte, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX na macOS działa przez dołączonego helpera `openclaw-mlx-tts`, jeśli jest dostępny, albo przez plik wykonywalny na `PATH`; `OPENCLAW_MLX_TTS_BIN` nadpisuje ścieżkę helpera na potrzeby developmentu.
- `speechLocale` ustawia identyfikator lokalizacji BCP 47 używany przez rozpoznawanie mowy Talk na iOS/macOS. Pozostaw nieustawione, aby użyć domyślnej lokalizacji urządzenia.
- `silenceTimeoutMs` kontroluje, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypt. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms na macOS i Android, 900 ms na iOS`).

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
