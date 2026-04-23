---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Diagnozujesz dostępność pamięci lub indeksowanie
    - Chcesz promować przywołaną pamięć krótkoterminową do `MEMORY.md`
summary: Dokumentacja CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: memory
x-i18n:
    generated_at: "2026-04-23T09:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Zarządzanie indeksowaniem i wyszukiwaniem pamięci semantycznej.
Dostarczane przez aktywny Plugin pamięci (domyślnie: `memory-core`; ustaw `plugins.slots.memory = "none"`, aby wyłączyć).

Powiązane:

- Koncepcja pamięci: [Memory](/pl/concepts/memory)
- Wiki pamięci: [Memory Wiki](/pl/plugins/memory-wiki)
- CLI wiki: [wiki](/pl/cli/wiki)
- Pluginy: [Plugins](/pl/tools/plugin)

## Przykłady

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opcje

`memory status` i `memory index`:

- `--agent <id>`: ogranicza do jednego agenta. Bez tego te polecenia działają dla każdego skonfigurowanego agenta; jeśli nie skonfigurowano listy agentów, wracają do agenta domyślnego.
- `--verbose`: emituje szczegółowe logi podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sonduje dostępność wektorów i embeddingów.
- `--index`: uruchamia ponowne indeksowanie, jeśli magazyn jest zabrudzony (implikuje `--deep`).
- `--fix`: naprawia nieaktualne blokady przywołań i normalizuje metadane promowania.
- `--json`: wypisuje wynik JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzany Cron Dreaming jest włączony, ale Heartbeat, który go uruchamia, nie wykonuje się dla domyślnego agenta. Zobacz [Dreaming never runs](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie typowe przyczyny.

`memory index`:

- `--force`: wymusza pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż albo pozycyjne `[query]`, albo `--query <text>`.
- Jeśli podano oba, pierwszeństwo ma `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicza liczbę zwracanych wyników.
- `--min-score <n>`: odfiltrowuje dopasowania z niskim wynikiem.
- `--json`: wypisuje wyniki JSON.

`memory promote`:

Podgląd i stosowanie promowania pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` — zapisuje promowane wpisy do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` — ogranicza liczbę pokazywanych kandydatów.
- `--include-promoted` — uwzględnia wpisy już promowane w poprzednich cyklach.

Pełne opcje:

- Szereguje kandydatów krótkoterminowych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promowania (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkoterminowych zarówno z przywołań pamięci, jak i z codziennych przebiegów ingestii, plus lekkich sygnałów wzmacniających fazy light/REM.
- Gdy Dreaming jest włączone, `memory-core` automatycznie zarządza jednym zadaniem Cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (bez ręcznego `openclaw cron add`).
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promowania.
- `--min-recall-count <n>`: minimalna liczba przywołań wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba różnych zapytań wymagana dla kandydata.
- `--apply`: dopisuje wybranych kandydatów do `MEMORY.md` i oznacza ich jako promowanych.
- `--include-promoted`: uwzględnia w wyniku kandydatów już promowanych.
- `--json`: wypisuje wynik JSON.

`memory promote-explain`:

Wyjaśnia konkretnego kandydata do promowania i rozbicie jego wyniku.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki lub fragment wycinka do wyszukania.
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już promowanych kandydatów.
- `--json`: wypisuje wynik JSON.

`memory rem-harness`:

Podgląd refleksji REM, kandydatów na prawdy i wyniku promowania deep bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już promowanych kandydatów deep.
- `--json`: wypisuje wynik JSON.

## Dreaming

Dreaming to system konsolidacji pamięci działający w tle, z trzema współpracującymi
fazami: **light** (sortowanie/przygotowanie materiału krótkoterminowego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) oraz **REM** (refleksja i wydobywanie tematów).

- Włącz przez `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełączaj z czatu przez `/dreaming on|off` (lub sprawdzaj przez `/dreaming status`).
- Dreaming działa według jednego zarządzanego harmonogramu przebiegów (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelne dla człowieka wyjście faz i wpisy dziennika są zapisywane do `DREAMS.md` (lub istniejącego `dreams.md`), z opcjonalnymi raportami per faza w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości przywołań, trafności odzyskiwania, różnorodności zapytań, świeżości czasowej, konsolidacji między dniami i wyprowadzonego bogactwa pojęciowego.
- Promowanie ponownie odczytuje bieżącą notatkę dzienną przed zapisem do `MEMORY.md`, dzięki czemu edytowane lub usunięte krótkoterminowe wycinki nie są promowane ze starych migawek magazynu przywołań.
- Zaplanowane i ręczne uruchomienia `memory promote` współdzielą te same domyślne ustawienia fazy deep, chyba że przekażesz nadpisania progów przez flagi CLI.
- Automatyczne uruchomienia rozchodzą się na wszystkie skonfigurowane obszary robocze pamięci.

Domyślne harmonogramy:

- **Częstotliwość przebiegu**: `dreaming.frequency = 0 3 * * *`
- **Progi deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Przykład:

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

Uwagi:

- `memory index --verbose` wypisuje szczegóły per faza (provider, model, źródła, aktywność partii).
- `memory status` uwzględnia wszelkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie aktywne pola kluczy API zdalnej pamięci są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnej migawki Gateway. Jeśli Gateway jest niedostępne, polecenie szybko kończy się błędem.
- Uwaga o rozjechaniu wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd unknown-method.
- Dostosuj częstotliwość zaplanowanych przebiegów przez `dreaming.frequency`. Sama polityka promowania deep pozostaje wewnętrzna; używaj flag CLI w `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań.
- `memory rem-harness --path <file-or-dir> --grounded` pokazuje podgląd ugruntowanych `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych notatek dziennych bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md` do przeglądu w interfejsie.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila ugruntowanych trwałych kandydatów do aktywnego magazynu promowania krótkoterminowego, aby normalna faza deep mogła ich ocenić.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej przygotowanych ugruntowanych kandydatów krótkoterminowych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać pełne opisy faz i dokumentację konfiguracji.
