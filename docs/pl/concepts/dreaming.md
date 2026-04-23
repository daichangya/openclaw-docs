---
read_when:
    - Chcesz, aby promowanie pamięci działało automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania `MEMORY.md`
summary: Konsolidacja pamięci w tle z fazami light, deep i REM oraz Dziennikiem Snów
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T09:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming to system konsolidacji pamięci działający w tle w `memory-core`.
Pomaga OpenClaw przenosić silne sygnały pamięci krótkoterminowej do trwałej pamięci,
przy zachowaniu wyjaśnialności i możliwości przeglądu procesu.

Dreaming jest **opcjonalne** i domyślnie wyłączone.

## Co zapisuje Dreaming

Dreaming przechowuje dwa rodzaje danych wyjściowych:

- **Stan maszynowy** w `memory/.dreams/` (magazyn recall, sygnały faz, checkpointy ingestii, blokady).
- **Czytelne dla człowieka dane wyjściowe** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalnych plikach raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promowanie do pamięci długoterminowej nadal zapisuje tylko do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza | Cel                                       | Trwały zapis      |
| ----- | ----------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowanie ostatnich materiałów krótkoterminowych | Nie               |
| Deep  | Ocenianie i promowanie trwałych kandydatów | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi ideami | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi
konfigurowanymi przez użytkownika „trybami”.

### Faza Light

Faza Light pobiera ostatnie dzienne sygnały pamięci i ślady recall, deduplikuje je
i przygotowuje linie kandydatów.

- Odczytuje stan krótkoterminowego recall, ostatnie dzienne pliki pamięci oraz zredagowane transkrypty sesji, jeśli są dostępne.
- Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające do późniejszego rankingu deep.
- Nigdy nie zapisuje do `MEMORY.md`.

### Faza Deep

Faza Deep decyduje, co staje się pamięcią długoterminową.

- Ranking kandydatów odbywa się z użyciem wag i progów.
- Wymaga przejścia `minScore`, `minRecallCount` i `minUniqueQueries`.
- Przed zapisem ponownie hydratuje fragmenty z aktywnych dziennych plików, więc przestarzałe/usunięte fragmenty są pomijane.
- Dopisuje promowane wpisy do `MEMORY.md`.
- Zapisuje podsumowanie `## Deep Sleep` do `DREAMS.md` i opcjonalnie do `memory/dreaming/deep/YYYY-MM-DD.md`.

### Faza REM

Faza REM wyodrębnia wzorce i sygnały refleksyjne.

- Buduje podsumowania motywów i refleksji na podstawie ostatnich krótkoterminowych śladów.
- Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn zawiera dane wyjściowe inline.
- Rejestruje sygnały wzmacniające REM używane przez ranking deep.
- Nigdy nie zapisuje do `MEMORY.md`.

## Ingestia transkryptów sesji

Dreaming może ingestować zredagowane transkrypty sesji do korpusu Dreaming. Gdy
transkrypty są dostępne, trafiają do fazy light razem z dziennymi
sygnałami pamięci i śladami recall. Treści osobiste i wrażliwe są redagowane
przed ingestą.

## Dziennik Snów

Dreaming prowadzi także narracyjny **Dziennik Snów** w `DREAMS.md`.
Gdy po każdej fazie zbierze się wystarczająco dużo materiału, `memory-core` uruchamia w tle
najlepszym dostępnym sposobem turę subagenta (z użyciem domyślnego modelu runtime)
i dopisuje krótki wpis do dziennika.

Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako źródło promocji.
Artefakty dziennika/raportów wygenerowane przez Dreaming są wykluczone z promocji
krótkoterminowej. Do promowania do
`MEMORY.md` kwalifikują się tylko ugruntowane fragmenty pamięci.

Istnieje także ugruntowany historyczny przebieg backfill do prac przeglądowych i odzyskiwania:

- `memory rem-harness --path ... --grounded` podgląda ugruntowane dane wyjściowe dziennika z historycznych notatek `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym magazynie dowodów krótkoterminowych, którego używa już normalna faza deep.
- `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty backfill bez naruszania zwykłych wpisów dziennika ani aktywnego krótkoterminowego recall.

Interfejs Control udostępnia ten sam przepływ backfill/reset dziennika, dzięki czemu możesz sprawdzić
wyniki w scenie Dreams przed podjęciem decyzji, czy ugruntowani kandydaci
zasługują na promocję. Scena pokazuje także osobną ścieżkę ugruntowaną, dzięki czemu możesz zobaczyć,
które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane
elementy były prowadzone przez dane ugruntowane, oraz wyczyścić tylko przygotowane wpisy wyłącznie ugruntowane bez
naruszania zwykłego bieżącego stanu krótkoterminowego.

## Sygnały rankingu Deep

Ranking deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                              |
| ------------------- | ---- | ------------------------------------------------- |
| Częstotliwość       | 0.24 | Ile krótkoterminowych sygnałów zgromadził wpis    |
| Trafność            | 0.30 | Średnia jakość odzyskiwania dla wpisu             |
| Różnorodność zapytań | 0.15 | Różne konteksty zapytań/dni, które go ujawniły   |
| Aktualność          | 0.15 | Wynik świeżości z zanikiem w czasie               |
| Konsolidacja        | 0.10 | Siła nawrotów w wielu dniach                      |
| Bogactwo pojęciowe  | 0.06 | Gęstość tagów pojęciowych z fragmentu/ścieżki     |

Trafienia faz Light i REM dodają niewielkie wzmocnienie z zanikiem aktualności z
`memory/.dreams/phase-signals.json`.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego
przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: light -> REM -> deep.

Domyślne zachowanie harmonogramu:

| Ustawienie           | Domyślnie   |
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

## Komenda slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ CLI

Użyj promocji CLI do podglądu lub ręcznego zastosowania:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Ręczne `memory promote` domyślnie używa progów fazy deep, chyba że zostaną nadpisane
flagami CLI.

Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby promowany:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Podejrzyj refleksje REM, prawdy kandydatów i dane wyjściowe promocji deep bez
zapisywania czegokolwiek:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się w `plugins.entries.memory-core.config.dreaming`.

| Klucz       | Domyślnie   |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Polityka faz, progi i zachowanie magazynu są wewnętrznymi szczegółami implementacji
(i nie są konfiguracją przeznaczoną dla użytkownika).

Zobacz [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config#dreaming),
aby poznać pełną listę kluczy.

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gatewayu pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczbę krótkoterminowych, ugruntowanych, sygnałowych i promowanych-dzisiaj wpisów
- czas następnego zaplanowanego uruchomienia
- osobną ścieżkę sceny dla przygotowanych wpisów historycznego odtworzenia opartych na danych ugruntowanych
- rozwijany czytnik Dziennika Snów oparty na `doctor.memory.dreamDiary`

## Rozwiązywanie problemów

### Dreaming nigdy się nie uruchamia (status pokazuje blocked)

Zarządzany cron Dreaming korzysta z Heartbeat domyślnego agenta. Jeśli Heartbeat nie uruchamia się dla tego agenta, cron kolejkuje zdarzenie systemowe, którego nikt nie konsumuje, i Dreaming po cichu się nie uruchamia. Zarówno `openclaw memory status`, jak i `/dreaming status` zgłaszają wtedy `blocked` i wskazują agenta, którego Heartbeat jest blokadą.

Dwie typowe przyczyny:

- Inny agent deklaruje jawny blok `heartbeat:`. Gdy jakikolwiek wpis w `agents.list` ma własny blok `heartbeat`, Heartbeat wysyłają tylko ci agenci — ustawienia domyślne przestają dotyczyć wszystkich pozostałych, więc domyślny agent może zamilknąć. Przenieś ustawienia Heartbeat do `agents.defaults.heartbeat` albo dodaj jawny blok `heartbeat` do domyślnego agenta. Zobacz [Zakres i pierwszeństwo](/pl/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` ma wartość `0`, pustą lub nie daje się sparsować. Cron nie ma interwału, według którego mógłby planować, więc Heartbeat jest w praktyce wyłączony. Ustaw `every` na dodatni czas trwania, na przykład `30m`. Zobacz [Wartości domyślne](/pl/gateway/heartbeat#defaults).

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat)
- [Pamięć](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [CLI memory](/pl/cli/memory)
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config)
