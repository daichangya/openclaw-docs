---
read_when:
    - Diagnozowanie, dlaczego agent odpowiedział, nie powiódł się albo wywołał narzędzia w określony sposób
    - Eksportowanie pakietu wsparcia dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów runtime albo metadanych użycia
    - Wyłączanie albo przenoszenie przechwytywania trajektorii
summary: Eksportuj zredagowane pakiety trajektorii do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-04-23T10:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Pakiety trajektorii

Przechwytywanie trajektorii to per-sesyjny rejestrator przebiegu OpenClaw. Rejestruje
ustrukturyzowaną linię czasu dla każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję do zredagowanego pakietu wsparcia.

Użyj tego, gdy chcesz odpowiedzieć na pytania takie jak:

- Jaki prompt, prompt systemowy i narzędzia zostały wysłane do modelu?
- Które wiadomości transkryptu i wywołania narzędzi doprowadziły do tej odpowiedzi?
- Czy uruchomienie przekroczyło limit czasu, zostało przerwane, skompaktowane albo napotkało błąd providera?
- Który model, Pluginy, Skills i ustawienia runtime były aktywne?
- Jakie metadane użycia i prompt-cache zwrócił provider?

## Szybki start

Wyślij to w aktywnej sesji:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw zapisuje pakiet w obszarze roboczym:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Możesz wybrać względną nazwę katalogu wyjściowego:

```text
/export-trajectory bug-1234
```

Niestandardowa ścieżka jest rozwiązywana wewnątrz `.openclaw/trajectory-exports/`. Ścieżki bezwzględne
i ścieżki `~` są odrzucane.

## Dostęp

Eksport trajektorii jest poleceniem właściciela. Nadawca musi przejść zwykłe
kontrole autoryzacji poleceń oraz kontrole właściciela dla kanału.

## Co jest rejestrowane

Przechwytywanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia runtime obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkryptu są również rekonstruowane z aktywnej gałęzi sesji:

- wiadomości użytkownika
- wiadomości asystenta
- wywołania narzędzi
- wyniki narzędzi
- Compaction
- zmiany modeli
- etykiety i niestandardowe wpisy sesji

Zdarzenia są zapisywane jako JSON Lines z tym znacznikiem schematu:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Pliki pakietu

Wyeksportowany pakiet może zawierać:

| Plik                  | Zawartość                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczba zdarzeń i lista wygenerowanych plików               |
| `events.jsonl`        | Uporządkowana linia czasu runtime i transkryptu                                              |
| `session-branch.json` | Zredagowana aktywna gałąź transkryptu i nagłówek sesji                                       |
| `metadata.json`       | Wersja OpenClaw, OS/runtime, model, migawka konfiguracji, Pluginy, Skills i metadane promptu |
| `artifacts.json`      | Końcowy status, błędy, użycie, prompt cache, liczba Compaction, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Wysłane prompty i wybrane szczegóły budowania promptu                                        |
| `system-prompt.txt`   | Najnowszy skompilowany prompt systemowy, jeśli został przechwycony                           |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały przechwycone                             |

`manifest.json` wylicza pliki obecne w pakiecie. Niektóre pliki są pomijane,
gdy sesja nie przechwyciła odpowiadających im danych runtime.

## Lokalizacja przechwytywania

Domyślnie zdarzenia trajektorii runtime są zapisywane obok pliku sesji:

```text
<session>.trajectory.jsonl
```

OpenClaw zapisuje też plik wskaźnika best-effort obok sesji:

```text
<session>.trajectory-path.json
```

Ustaw `OPENCLAW_TRAJECTORY_DIR`, aby przechowywać boczne pliki trajektorii runtime w
dedykowanym katalogu:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Gdy ta zmienna jest ustawiona, OpenClaw zapisuje jeden plik JSONL na ID sesji w tym
katalogu.

## Wyłączanie przechwytywania

Ustaw `OPENCLAW_TRAJECTORY=0` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

To wyłącza przechwytywanie trajektorii runtime. `/export-trajectory` nadal może eksportować
gałąź transkryptu, ale pliki tylko-runtime, takie jak skompilowany kontekst,
artefakty providera i metadane promptu, mogą być nieobecne.

## Prywatność i limity

Pakiety trajektorii są przeznaczone do wsparcia i debugowania, a nie do publicznego publikowania.
OpenClaw redaguje wrażliwe wartości przed zapisaniem plików eksportu:

- poświadczenia i znane pola ładunków przypominających sekrety
- dane obrazów
- ścieżki lokalnego stanu
- ścieżki obszaru roboczego, zastępowane przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, tam gdzie zostały wykryte

Eksporter ogranicza też rozmiar wejścia:

- boczne pliki runtime: 50 MiB
- pliki sesji: 50 MiB
- zdarzenia runtime: 200 000
- łączna liczba eksportowanych zdarzeń: 250 000
- pojedyncze wiersze zdarzeń runtime są przycinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza zespołem. Redakcja działa w trybie best-effort
i nie może znać każdego sekretu specyficznego dla aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie zawiera zdarzeń runtime:

- potwierdź, że OpenClaw uruchomiono bez `OPENCLAW_TRAJECTORY=0`
- sprawdź, czy `OPENCLAW_TRAJECTORY_DIR` wskazuje katalog z prawem zapisu
- uruchom kolejną wiadomość w sesji, a następnie wyeksportuj ponownie
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj względnej nazwy, takiej jak `bug-1234`
- nie przekazuj `/tmp/...` ani `~/...`
- zachowaj eksport w `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja albo plik boczny przekroczyły
limity bezpieczeństwa eksportu. Rozpocznij nową sesję albo wyeksportuj mniejszą reprodukcję.
