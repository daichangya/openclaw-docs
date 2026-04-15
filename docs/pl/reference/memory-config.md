---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania pamięci lub modele embeddingów
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanik czasowy
    - Chcesz włączyć multimodalne indeksowanie pamięci
summary: Wszystkie opcje konfiguracji wyszukiwania w pamięci, dostawców embeddingów, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Referencja konfiguracji pamięci
x-i18n:
    generated_at: "2026-04-15T09:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a13f6e982ee47401cc9a71bf2ee6a5305d06158b806a04703bcdcd92e340e4d5
    source_path: reference/memory-config.md
    workflow: 15
---

# Referencja konfiguracji pamięci

Ta strona zawiera wszystkie opcje konfiguracji wyszukiwania pamięci w OpenClaw. Omówienia koncepcyjne znajdziesz tutaj:

- [Przegląd pamięci](/pl/concepts/memory) -- jak działa pamięć
- [Wbudowany silnik](/pl/concepts/memory-builtin) -- domyślny backend SQLite
- [Silnik QMD](/pl/concepts/memory-qmd) -- lokalny sidecar
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search) -- pipeline wyszukiwania i dostrajanie
- [Active Memory](/pl/concepts/active-memory) -- włączanie subagenta pamięci dla interaktywnych sesji

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w
`openclaw.json`, o ile nie zaznaczono inaczej.

Jeśli szukasz przełącznika funkcji **Active Memory** i konfiguracji subagenta,
znajdują się one w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu dwóch bramek:

1. Plugin musi być włączony i kierowany na bieżący identyfikator agenta
2. Żądanie musi dotyczyć kwalifikującej się interaktywnej trwałej sesji czatu

Model aktywacji, konfigurację należącą do Pluginu, trwałość transkryptów i bezpieczny wzorzec wdrażania opisano w [Active Memory](/pl/concepts/active-memory).

---

## Wybór dostawcy

| Key        | Type      | Default          | Opis                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | wykrywany automatycznie    | Identyfikator adaptera embeddingów: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | domyślny dostawcy | Nazwa modelu embeddingów                                                                                          |
| `fallback` | `string`  | `"none"`         | Identyfikator adaptera zapasowego, gdy podstawowy zawiedzie                                                                    |
| `enabled`  | `boolean` | `true`           | Włącza lub wyłącza wyszukiwanie pamięci                                                                               |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszy dostępny:

1. `local` -- jeśli `memorySearch.local.modelPath` jest skonfigurowane i plik istnieje.
2. `github-copilot` -- jeśli można rozwiązać token GitHub Copilot (zmienna środowiskowa lub profil uwierzytelniania).
3. `openai` -- jeśli można rozwiązać klucz OpenAI.
4. `gemini` -- jeśli można rozwiązać klucz Gemini.
5. `voyage` -- jeśli można rozwiązać klucz Voyage.
6. `mistral` -- jeśli można rozwiązać klucz Mistral.
7. `bedrock` -- jeśli łańcuch poświadczeń AWS SDK zostanie rozwiązany (rola instancji, klucze dostępu, profil, SSO, tożsamość webowa lub współdzielona konfiguracja).

`ollama` jest obsługiwane, ale nie jest wykrywane automatycznie (ustaw je jawnie).

### Rozwiązywanie klucza API

Zdalne embeddingi wymagają klucza API. Bedrock zamiast tego używa domyślnego
łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Provider       | Env var                                            | Config key                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | łańcuch poświadczeń AWS                               | Klucz API nie jest wymagany                 |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez logowanie urządzenia     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (symbol zastępczy)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

OAuth Codex obejmuje tylko czat/completions i nie spełnia wymagań żądań embeddingów.

---

## Konfiguracja zdalnego endpointu

Dla własnych endpointów zgodnych z OpenAI lub nadpisywania ustawień domyślnych dostawcy:

| Key              | Type     | Opis                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | Własny bazowy URL API                                |
| `remote.apiKey`  | `string` | Nadpisanie klucza API                                   |
| `remote.headers` | `object` | Dodatkowe nagłówki HTTP (łączone z domyślnymi ustawieniami dostawcy) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Konfiguracja specyficzna dla Gemini

| Key                    | Type     | Default                | Opis                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Obsługuje także `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Dla Embedding 2: 768, 1536 lub 3072        |

<Warning>
Zmiana modelu lub `outputDimensionality` powoduje automatyczne pełne przeindeksowanie.
</Warning>

---

## Konfiguracja embeddingów Bedrock

Bedrock używa domyślnego łańcucha poświadczeń AWS SDK -- nie są potrzebne klucze API.
Jeśli OpenClaw działa na EC2 z rolą instancji z włączonym Bedrock, wystarczy ustawić
dostawcę i model:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Key                    | Type     | Default                        | Opis                     |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu embeddingów Bedrock  |
| `outputDimensionality` | `number` | domyślna wartość modelu                  | Dla Titan V2: 256, 512 lub 1024 |

### Obsługiwane modele

Obsługiwane są następujące modele (z wykrywaniem rodziny i domyślnymi
wymiarami):

| Model ID                                   | Provider   | Default Dims | Configurable Dims    |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

Warianty z sufiksem przepustowości (np. `amazon.titan-embed-text-v1:2:8k`) dziedziczą
konfigurację modelu bazowego.

### Uwierzytelnianie

Uwierzytelnianie Bedrock używa standardowej kolejności rozwiązywania poświadczeń AWS SDK:

1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Pamięć podręczna tokenów SSO
3. Poświadczenia tokena tożsamości webowej
4. Współdzielone pliki poświadczeń i konfiguracji
5. Poświadczenia metadanych ECS lub EC2

Region jest rozwiązywany na podstawie `AWS_REGION`, `AWS_DEFAULT_REGION`,
`baseUrl` dostawcy `amazon-bedrock` lub domyślnie przyjmuje wartość `us-east-1`.

### Uprawnienia IAM

Rola lub użytkownik IAM potrzebuje:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Aby zachować zasadę najmniejszych uprawnień, ogranicz `InvokeModel` do konkretnego modelu:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Konfiguracja embeddingów lokalnych

| Key                   | Type     | Default                | Opis                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | pobierany automatycznie        | Ścieżka do pliku modelu GGUF         |
| `local.modelCacheDir` | `string` | domyślna wartość node-llama-cpp | Katalog pamięci podręcznej dla pobranych modeli |

Domyślny model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, pobierany automatycznie).
Wymaga natywnego builda: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Opis                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Włącza wyszukiwanie hybrydowe BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`   | Waga dla wyników wektorowych (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Waga dla wyników BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Mnożnik rozmiaru puli kandydatów     |

### MMR (różnorodność)

| Key           | Type      | Default | Opis                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Włącza ponowne rankingowanie MMR                |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = maksymalna różnorodność, 1 = maksymalna trafność |

### Zanik czasowy (świeżość)

| Key                          | Type      | Default | Opis               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Włącza zwiększenie wyniku za świeżość      |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Wynik zmniejsza się o połowę co N dni |

Pliki evergreen (`MEMORY.md`, pliki bez daty w `memory/`) nigdy nie podlegają zanikowi.

### Pełny przykład

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Dodatkowe ścieżki pamięci

| Key          | Type       | Opis                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Dodatkowe katalogi lub pliki do indeksowania |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Ścieżki mogą być bezwzględne lub względne względem workspace. Katalogi są skanowane
rekurencyjnie w poszukiwaniu plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego backendu:
wbudowany silnik ignoruje dowiązania symboliczne, podczas gdy QMD stosuje zachowanie
bazowego skanera QMD.

W przypadku wyszukiwania transkryptów między agentami w zakresie agenta użyj
`agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`.
Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale
są scalane dla każdego agenta i mogą zachować jawne współdzielone nazwy, gdy ścieżka
wskazuje poza bieżący workspace.
Jeśli ta sama rozwiązana ścieżka pojawi się zarówno w `memory.qmd.paths`, jak i w
`memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija
duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i audio razem z Markdownem za pomocą Gemini Embedding 2:

| Key                       | Type       | Default    | Opis                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Włącza indeksowanie multimodalne             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania             |

Dotyczy tylko plików w `extraPaths`. Domyślne korzenie pamięci pozostają tylko dla Markdowna.
Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embeddingów

| Key                | Type      | Default | Opis                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Buforuje embeddingi chunków w SQLite |
| `cache.maxEntries` | `number`  | `50000` | Maksymalna liczba buforowanych embeddingów            |

Zapobiega ponownemu tworzeniu embeddingów dla niezmienionego tekstu podczas przeindeksowania lub aktualizacji transkryptów.

---

## Indeksowanie wsadowe

| Key                           | Type      | Default | Opis                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Włącza wsadowe API embeddingów |
| `remote.batch.concurrency`    | `number`  | `2`     | Równoległe zadania wsadowe        |
| `remote.batch.wait`           | `boolean` | `true`  | Czeka na zakończenie wsadu  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interwał odpytywania              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Limit czasu wsadu              |

Dostępne dla `openai`, `gemini` i `voyage`. Wsady OpenAI są zazwyczaj
najszybsze i najtańsze przy dużych backfillach.

---

## Wyszukiwanie pamięci sesji (eksperymentalne)

Indeksuj transkrypty sesji i udostępniaj je przez `memory_search`:

| Key                           | Type       | Default      | Opis                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Włącza indeksowanie sesji                 |
| `sources`                     | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypty |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Próg bajtów do przeindeksowania              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Próg wiadomości do przeindeksowania           |

Indeksowanie sesji jest opcjonalne i działa asynchronicznie. Wyniki mogą być nieco
nieaktualne. Logi sesji są przechowywane na dysku, więc dostęp do systemu plików należy traktować jako granicę zaufania.

---

## Akceleracja wektorowa SQLite (`sqlite-vec`)

| Key                          | Type      | Default | Opis                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Używa `sqlite-vec` do zapytań wektorowych |
| `store.vector.extensionPath` | `string`  | bundled | Nadpisuje ścieżkę `sqlite-vec`          |

Gdy `sqlite-vec` jest niedostępne, OpenClaw automatycznie przechodzi na
podobieństwo cosinusowe w procesie.

---

## Magazyn indeksu

| Key                   | Type     | Default                               | Opis                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` lub `trigram`)   |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w
`memory.qmd`:

| Key                      | Type      | Default  | Opis                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Ścieżka do pliku wykonywalnego QMD                          |
| `searchMode`             | `string`  | `search` | Polecenie wyszukiwania: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Automatycznie indeksuje `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | Dodatkowe ścieżki: `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | Indeksuje transkrypty sesji                    |
| `sessions.retentionDays` | `number`  | --       | Retencja transkryptów                         |
| `sessions.exportDir`     | `string`  | --       | Katalog eksportu                             |

OpenClaw preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale nadal
obsługuje starsze wydania QMD, wracając w razie potrzeby do starszych flag kolekcji `--mask`
i starszych nazw narzędzi MCP.

Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli chcesz
globalnie nadpisać modele QMD, ustaw zmienne środowiskowe takie jak
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL` w środowisku
runtime Gateway.

### Harmonogram aktualizacji

| Key                       | Type      | Default | Opis                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Interwał odświeżania                      |
| `update.debounceMs`       | `number`  | `15000` | Debounce zmian plików                 |
| `update.onBoot`           | `boolean` | `true`  | Odświeża przy starcie                    |
| `update.waitForBootSync`  | `boolean` | `false` | Blokuje start do czasu zakończenia odświeżenia |
| `update.embedInterval`    | `string`  | --      | Oddzielny harmonogram embeddingu                |
| `update.commandTimeoutMs` | `number`  | --      | Limit czasu dla poleceń QMD              |
| `update.updateTimeoutMs`  | `number`  | --      | Limit czasu dla operacji aktualizacji QMD     |
| `update.embedTimeoutMs`   | `number`  | --      | Limit czasu dla operacji embeddingu QMD      |

### Limity

| Key                       | Type     | Default | Opis                |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | Maksymalna liczba wyników wyszukiwania         |
| `limits.maxSnippetChars`  | `number` | --      | Ogranicza długość fragmentu       |
| `limits.maxInjectedChars` | `number` | --      | Ogranicza łączną liczbę wstrzykniętych znaków |
| `limits.timeoutMs`        | `number` | `4000`  | Limit czasu wyszukiwania             |

### Zakres

Kontroluje, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co
[`session.sendPolicy`](/pl/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Dostarczana domyślna konfiguracja dopuszcza sesje direct i channel, nadal odrzucając
grupy.

Wartością domyślną jest tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji;
`match.rawKeyPrefix` dopasowuje surowy klucz, w tym `agent:<id>:`.

### Cytowania

`memory.citations` dotyczy wszystkich backendów:

| Value            | Behavior                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (domyślnie) | Dołącza stopkę `Source: <path#line>` do fragmentów    |
| `on`             | Zawsze dołącza stopkę                               |
| `off`            | Pomija stopkę (ścieżka nadal jest przekazywana wewnętrznie do agenta) |

### Pełny przykład QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (eksperymentalne)

Dreaming jest konfigurowane w `plugins.entries.memory-core.config.dreaming`,
a nie w `agents.defaults.memorySearch`.

Dreaming działa jako jeden zaplanowany przebieg i używa wewnętrznych faz light/deep/REM jako
szczegółu implementacyjnego.

Opis zachowania koncepcyjnego i poleceń slash znajdziesz w [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Key         | Type      | Default     | Opis                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Włącza lub wyłącza Dreaming całkowicie               |
| `frequency` | `string`  | `0 3 * * *` | Opcjonalny harmonogram Cron dla pełnego przebiegu Dreaming |

### Przykład

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Uwagi:

- Dreaming zapisuje stan maszyny do `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka dane narracyjne do `DREAMS.md` (lub istniejącego `dreams.md`).
- Polityka faz light/deep/REM i progi są zachowaniem wewnętrznym, a nie konfiguracją dostępną dla użytkownika.
