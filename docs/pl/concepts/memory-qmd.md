---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Chcesz zaawansowanych funkcji pamięci, takich jak reranking lub dodatkowe indeksowane ścieżki
summary: Lokalny sidecar wyszukiwania z BM25, wektorami, rerankingiem i rozwijaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-04-25T13:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) to lokalny sidecar wyszukiwania, który działa
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i reranking w jednym
pliku binarnym oraz może indeksować treści wykraczające poza pliki pamięci workspace.

## Co dodaje ponad silnik wbudowany

- **Reranking i rozwijanie zapytań** dla lepszego recall.
- **Indeksowanie dodatkowych katalogów** — dokumentacji projektu, notatek zespołu, wszystkiego na dysku.
- **Indeksowanie transkryptów sesji** — przywoływanie wcześniejszych rozmów.
- **W pełni lokalne** — działa z opcjonalnym pakietem runtime node-llama-cpp i
  automatycznie pobiera modele GGUF.
- **Automatyczny fallback** — jeśli QMD jest niedostępne, OpenClaw płynnie przełącza się na
  silnik wbudowany.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` albo `bun install -g @tobilu/qmd`
- Build SQLite pozwalający na rozszerzenia (`brew install sqlite` na macOS).
- QMD musi znajdować się w `PATH` Gateway.
- macOS i Linux działają od razu. Windows jest najlepiej obsługiwany przez WSL2.

### Włączanie

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tworzy samodzielny katalog domowy QMD w
`~/.openclaw/agents/<agentId>/qmd/` i automatycznie zarządza cyklem życia
sidecara — kolekcje, aktualizacje i uruchomienia embeddingów są obsługiwane za Ciebie.
Preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale nadal wraca do
starszych flag kolekcji `--mask` i starszych nazw narzędzi MCP, gdy to potrzebne.
Uzgadnianie przy uruchamianiu odtwarza również nieaktualne zarządzane kolekcje do ich
kanonicznych wzorców, gdy starsza kolekcja QMD o tej samej nazwie jest nadal obecna.

## Jak działa sidecar

- OpenClaw tworzy kolekcje z plików pamięci workspace i wszystkich
  skonfigurowanych `memory.qmd.paths`, a następnie uruchamia `qmd update` + `qmd embed` przy starcie
  i okresowo (domyślnie co 5 minut).
- Domyślna kolekcja workspace śledzi `MEMORY.md` oraz drzewo `memory/`.
  Małe `memory.md` nie jest indeksowane jako główny plik pamięci.
- Odświeżanie przy starcie działa w tle, więc uruchamianie czatu nie jest blokowane.
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługuje też
  `vsearch` i `query`). Jeśli tryb zawiedzie, OpenClaw ponawia próbę z `qmd query`.
- Jeśli QMD całkowicie zawiedzie, OpenClaw wraca do wbudowanego silnika SQLite.

<Info>
Pierwsze wyszukiwanie może być wolne — QMD automatycznie pobiera modele GGUF (~2 GB) do
rerankingu i rozwijania zapytań przy pierwszym uruchomieniu `qmd query`.
</Info>

## Nadpisania modeli

Zmienne środowiskowe modeli QMD są przekazywane bez zmian z procesu
Gateway, więc możesz globalnie dostroić QMD bez dodawania nowej konfiguracji OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu embeddingów uruchom embeddingi ponownie, aby indeks pasował do
nowej przestrzeni wektorowej.

## Indeksowanie dodatkowych ścieżek

Skieruj QMD na dodatkowe katalogi, aby można było je przeszukiwać:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Fragmenty z dodatkowych ścieżek pojawiają się jako `qmd/<collection>/<relative-path>` w
wynikach wyszukiwania. `memory_get` rozumie ten prefiks i odczytuje z poprawnego
roota kolekcji.

## Indeksowanie transkryptów sesji

Włącz indeksowanie sesji, aby przywoływać wcześniejsze rozmowy:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrypty są eksportowane jako oczyszczone tury User/Assistant do dedykowanej kolekcji QMD
w `~/.openclaw/agents/<id>/qmd/sessions/`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są udostępniane w sesjach direct i channel
(nie w group). Aby to zmienić, skonfiguruj `memory.qmd.scope`:

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

Gdy zakres odrzuca wyszukiwanie, OpenClaw zapisuje ostrzeżenie w logach z wyprowadzonym kanałem i
typem czatu, dzięki czemu łatwiej diagnozować puste wyniki.

## Cytaty

Gdy `memory.citations` ma wartość `auto` albo `on`, fragmenty wyszukiwania zawierają
stopkę `Source: <path#line>`. Ustaw `memory.citations = "off"`, aby pominąć stopkę,
nadal przekazując ścieżkę agentowi wewnętrznie.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Rerankingu dla wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek poza workspace.
- Przywoływania rozmów z poprzednich sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

W prostszych konfiguracjach [silnik wbudowany](/pl/concepts/memory-builtin) sprawdza się dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny znajduje się w `PATH` Gateway. Jeśli OpenClaw
działa jako usługa, utwórz dowiązanie symboliczne:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Pierwsze wyszukiwanie jest bardzo wolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Wstępnie rozgrzej
przez `qmd query "test"` z użyciem tych samych katalogów XDG, których używa OpenClaw.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000 ms).
Ustaw `120000` dla wolniejszego sprzętu.

**Puste wyniki w czatach grupowych?** Sprawdź `memory.qmd.scope` — domyślnie
zezwala tylko na sesje direct i channel.

**Wyszukiwanie pamięci root nagle stało się zbyt szerokie?** Uruchom ponownie Gateway albo poczekaj na
następne uzgadnianie przy starcie. OpenClaw odtwarza nieaktualne zarządzane kolekcje
do kanonicznych wzorców `MEMORY.md` i `memory/`, gdy wykryje konflikt tej samej nazwy.

**Tymczasowe repozytoria widoczne w workspace powodują `ENAMETOOLONG` albo uszkodzone indeksowanie?**
Przechodzenie QMD obecnie opiera się na zachowaniu bazowego skanera QMD, a nie na
wbudowanych regułach symlinków OpenClaw. Przechowuj tymczasowe checkouty monorepo w
ukrytych katalogach, takich jak `.tmp/`, albo poza indeksowanymi rootami QMD, dopóki QMD nie udostępni
przechodzenia bezpiecznego względem cykli lub jawnych kontrolek wykluczania.

## Konfiguracja

Pełny zakres konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały
aktualizacji, reguły zakresu i wszystkie pozostałe ustawienia znajdziesz w
[dokumentacji konfiguracji Memory](/pl/reference/memory-config).

## Powiązane

- [Przegląd Memory](/pl/concepts/memory)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
