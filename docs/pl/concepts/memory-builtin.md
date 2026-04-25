---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować providerów embeddingów lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-04-25T13:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Wbudowany silnik to domyślny backend pamięci. Przechowuje indeks pamięci w
bazie danych SQLite per agent i nie wymaga żadnych dodatkowych zależności na start.

## Co zapewnia

- **Wyszukiwanie słów kluczowych** przez indeksowanie pełnotekstowe FTS5 (punktacja BM25).
- **Wyszukiwanie wektorowe** przez embeddingi z dowolnego obsługiwanego providera.
- **Wyszukiwanie hybrydowe** łączące oba podejścia dla najlepszych wyników.
- **Obsługę CJK** przez tokenizację trigramową dla języków chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalnie).

## Pierwsze kroki

Jeśli masz klucz API do OpenAI, Gemini, Voyage lub Mistral, wbudowany
silnik automatycznie go wykrywa i włącza wyszukiwanie wektorowe. Konfiguracja nie jest potrzebna.

Aby jawnie ustawić providera:

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

Bez providera embeddingów dostępne jest tylko wyszukiwanie słów kluczowych.

Aby wymusić wbudowanego lokalnego providera embeddingów, zainstaluj opcjonalny
pakiet runtime `node-llama-cpp` obok OpenClaw, a następnie skieruj `local.modelPath`
na plik GGUF:

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

## Obsługiwani providerzy embeddingów

| Provider | ID        | Wykrywany automatycznie | Uwagi                                |
| -------- | --------- | ----------------------- | ------------------------------------ |
| OpenAI   | `openai`  | Tak                     | Domyślnie: `text-embedding-3-small`  |
| Gemini   | `gemini`  | Tak                     | Obsługuje multimodalność (obraz + audio) |
| Voyage   | `voyage`  | Tak                     |                                      |
| Mistral  | `mistral` | Tak                     |                                      |
| Ollama   | `ollama`  | Nie                     | Lokalny, ustawiany jawnie            |
| Local    | `local`   | Tak (pierwszy)          | Opcjonalny runtime `node-llama-cpp`  |

Automatyczne wykrywanie wybiera pierwszego providera, którego klucz API można rozwiązać, w
pokazanej kolejności. Ustaw `memorySearch.provider`, aby to nadpisać.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` oraz `memory/*.md` do chunków (~400 tokenów z
nakładaniem 80 tokenów) i przechowuje je w bazie danych SQLite per agent.

- **Lokalizacja indeksu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Obserwowanie plików:** zmiany w plikach pamięci wywołują opóźnione ponowne indeksowanie (1,5 s).
- **Automatyczne ponowne indeksowanie:** gdy provider embeddingów, model lub konfiguracja chunkowania
  się zmienia, cały indeks jest automatycznie przebudowywany.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz też indeksować pliki Markdown spoza workspace za pomocą
`memorySearch.extraPaths`. Zobacz
[dokumentację konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik to właściwy wybór dla większości użytkowników:

- Działa od razu bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich providerów embeddingów.
- Wyszukiwanie hybrydowe łączy najlepsze cechy obu podejść do wyszukiwania.

Rozważ przejście na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz rerankingu, rozwijania
zapytań lub chcesz indeksować katalogi spoza workspace.

Rozważ [Honcho](/pl/concepts/memory-honcho), jeśli chcesz mieć pamięć między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci wyłączone?** Sprawdź `openclaw memory status`. Jeśli nie wykryto providera,
ustaw go jawnie albo dodaj klucz API.

**Lokalny provider nie jest wykrywany?** Upewnij się, że ścieżka lokalna istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora providera `local`.
Jeśli provider jest ustawiony na `auto`, lokalne embeddingi są rozważane jako pierwsze tylko
wtedy, gdy `memorySearch.local.modelPath` wskazuje na istniejący plik lokalny.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować indeks. Obserwator
w rzadkich przypadkach może nie wychwycić zmian.

**`sqlite-vec` się nie ładuje?** OpenClaw automatycznie wraca do obliczania podobieństwa cosinusowego
w procesie. Sprawdź logi, aby zobaczyć konkretny błąd ładowania.

## Konfiguracja

Aby skonfigurować providera embeddingów, dostroić wyszukiwanie hybrydowe (wagi, MMR, zanikanie
czasowe), indeksowanie wsadowe, pamięć multimodalną, sqlite-vec, dodatkowe ścieżki i wszystkie
inne opcje konfiguracji, zobacz
[dokumentację konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
