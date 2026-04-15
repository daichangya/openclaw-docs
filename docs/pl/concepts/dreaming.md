---
read_when:
    - Chcesz, aby promocja pamięci uruchamiała się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami lekkiego, głębokiego i REM snu oraz Dziennikiem snów
title: Dreaming (eksperymentalne)
x-i18n:
    generated_at: "2026-04-15T09:51:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5882a5068f2eabe54ca9893184e5385330a432b921870c38626399ce11c31e25
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (eksperymentalne)

Dreaming to system konsolidacji pamięci działający w tle w `memory-core`.
Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci,
zachowując przy tym przejrzystość i możliwość przeglądu procesu.

Dreaming jest **opcjonalne** i domyślnie wyłączone.

## Co zapisuje Dreaming

Dreaming utrzymuje dwa rodzaje wyników:

- **Stan maszyny** w `memory/.dreams/` (magazyn recall, sygnały faz, punkty kontrolne ingestii, blokady).
- **Czytelne dla człowieka dane wyjściowe** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja do pamięci długoterminowej nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                       | Trwały zapis      |
| ----- | ----------------------------------------- | ----------------- |
| Lekka | Sortowanie i przygotowanie ostatnich materiałów krótkoterminowych | Nie               |
| Głęboka  | Ocenianie i promowanie trwałych kandydatów      | Tak (`MEMORY.md`) |
| REM   | Refleksja nad tematami i powracającymi ideami     | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie oddzielnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza lekka

Faza lekka pobiera ostatnie dzienne sygnały pamięci i ślady recall, usuwa duplikaty
i przygotowuje kandydackie linie.

- Odczytuje dane ze stanu recall krótkoterminowego, ostatnich dziennych plików pamięci oraz zredagowanych transkrypcji sesji, jeśli są dostępne.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające do późniejszego rankingu fazy głębokiej.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza głęboka

Faza głęboka decyduje, co staje się pamięcią długoterminową.

- Klasyfikuje kandydatów przy użyciu ważonego scoringu i progów granicznych.
- Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
- Przed zapisem ponownie odtwarza fragmenty z aktywnych plików dziennych, więc nieaktualne lub usunięte fragmenty są pomijane.
- Dopisuje promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wyodrębnia wzorce i sygnały refleksyjne.

- Buduje podsumowania tematów i refleksji na podstawie ostatnich śladów krótkoterminowych.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające REM używane przez ranking fazy głębokiej.
- Nigdy nie zapisuje do `MEMORY.md`.

## Ingestia transkrypcji sesji

Dreaming może pobierać zredagowane transkrypcje sesji do korpusu Dreaming. Gdy
transkrypcje są dostępne, są przekazywane do fazy lekkiej razem z dziennymi
sygnałami pamięci i śladami recall. Treści osobiste i wrażliwe są redagowane
przed ingestą.

## Dream Diary

Dreaming prowadzi również narracyjny **Dream Diary** w `DREAMS.md`.
Gdy po każdej fazie zbierze się wystarczająco dużo materiału, `memory-core` uruchamia
w tle, w trybie best-effort, turę subagenta (z użyciem domyślnego modelu runtime)
i dopisuje krótki wpis do dziennika.

Ten dziennik służy do czytania przez człowieka w interfejsie Dreams, a nie jako
źródło promocji.
Artefakty dziennika/raportów generowane przez Dreaming są wykluczone z promocji
krótkoterminowej. Do promocji do `MEMORY.md` kwalifikują się wyłącznie
ugruntowane fragmenty pamięci.

Istnieje również ugruntowana ścieżka historycznego backfillu do prac przeglądowych i odzyskiwania:

- `memory rem-harness --path ... --grounded` wyświetla podgląd ugruntowanych danych wyjściowych dziennika na podstawie historycznych notatek `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym magazynie dowodów krótkoterminowych, którego używa już zwykła faza głęboka.
- `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty backfillu bez naruszania zwykłych wpisów dziennika ani aktywnego recall krótkoterminowego.

Control UI udostępnia ten sam przepływ backfillu/resetu dziennika, dzięki czemu możesz sprawdzić
wyniki w scenie Dreams, zanim zdecydujesz, czy ugruntowani kandydaci
zasługują na promocję. Scena pokazuje również odrębny ugruntowany tor, dzięki czemu możesz zobaczyć,
które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane
elementy były prowadzone przez dane ugruntowane, i czyścić tylko przygotowane wpisy wyłącznie ugruntowane
bez naruszania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu fazy głębokiej

Ranking fazy głębokiej wykorzystuje sześć ważonych sygnałów bazowych oraz wzmocnienie fazowe:

| Sygnał              | Waga | Opis                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Częstotliwość           | 0.24   | Ile sygnałów krótkoterminowych zgromadził wpis |
| Trafność           | 0.30   | Średnia jakość odzyskiwania dla wpisu           |
| Różnorodność zapytań     | 0.15   | Różne konteksty zapytań/dni, w których się pojawił      |
| Świeżość             | 0.15   | Wynik świeżości osłabiany w czasie                      |
| Konsolidacja       | 0.10   | Siła powtarzalności między dniami                     |
| Bogactwo pojęciowe | 0.06   | Gęstość tagów pojęciowych z fragmentu/ścieżki             |

Trafienia fazy lekkiej i REM dodają niewielkie wzmocnienie osłabiane w czasie z
`memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego
przebiegu Dreaming. Każdy przebieg uruchamia fazy po kolei: lekka -> REM -> głęboka.

Domyślne zachowanie harmonogramu:

| Ustawienie              | Domyślnie     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Szybki start

Włącz Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Włącz Dreaming z własnym harmonogramem przebiegu:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Polecenie slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ pracy CLI

Użyj promocji CLI do podglądu lub ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy głębokiej, chyba że zostaną nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Wyświetl podgląd refleksji REM, prawd kandydatów i wyników promocji fazy głębokiej bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

| Key         | Domyślnie     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Polityka faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji
(a nie konfiguracją dostępną dla użytkownika).

Pełną listę kluczy znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#dreaming-experimental).

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- stan na poziomie faz i obecność zarządzanego przebiegu
- liczby elementów krótkoterminowych, ugruntowanych, sygnałów i promowanych dzisiaj
- czas do następnego zaplanowanego uruchomienia
- odrębny tor sceny ugruntowanej dla przygotowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dream Diary oparty na `doctor.memory.dreamDiary`

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Referencja konfiguracji pamięci](/pl/reference/memory-config)
