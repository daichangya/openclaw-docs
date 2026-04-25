---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
summary: Projekt kolejki poleceń, która serializuje przychodzące uruchomienia automatycznych odpowiedzi
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-04-25T13:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (wszystkie kanały) przez małą kolejkę w procesie, aby zapobiec kolizjom wielu uruchomień agenta, jednocześnie nadal umożliwiając bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących nadejdzie w krótkim odstępie czasu.
- Serializacja zapobiega rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów po stronie upstream.

## Jak to działa

- Kolejka FIFO świadoma pasów opróżnia każdy pas z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych pasów; `main` domyślnie ma 4, a `subagent` 8).
- `runEmbeddedPiAgent` dodaje do kolejki według **klucza sesji** (pas `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie umieszczane w kolejce do **globalnego pasa** (`main` domyślnie), aby całkowita równoległość była ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, uruchomienia w kolejce emitują krótką informację, jeśli czekały ponad ~2 s przed rozpoczęciem.
- Wskaźniki pisania nadal uruchamiają się natychmiast przy dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika pozostaje bez zmian, gdy czekamy na swoją kolej.

## Tryby kolejki (per kanał)

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę followup albo robić obie rzeczy:

- `steer`: wstrzyknij natychmiast do bieżącego uruchomienia (anuluje oczekujące wywołania narzędzi po następnej granicy narzędzia). Jeśli brak streamingu, wraca do followup.
- `followup`: dodaj do kolejki na następną turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scal wszystkie wiadomości w kolejce w **jedną** turę followup (domyślnie). Jeśli wiadomości są kierowane do różnych kanałów/wątków, są opróżniane osobno, aby zachować routing.
- `steer-backlog` (czyli `steer+backlog`): steruj teraz **i** zachowaj wiadomość dla tury followup.
- `interrupt` (starsze): przerwij aktywne uruchomienie dla tej sesji, a następnie uruchom najnowszą wiadomość.
- `queue` (starszy alias): to samo co `steer`.

Steer-backlog oznacza, że po uruchomieniu sterowanym możesz otrzymać odpowiedź followup, więc
powierzchnie streamingowe mogą wyglądać jak duplikaty. Preferuj `collect`/`steer`, jeśli chcesz
jedną odpowiedź na każdą wiadomość przychodzącą.
Wyślij `/queue collect` jako samodzielne polecenie (per sesję) albo ustaw `messages.queue.byChannel.discord: "collect"`.

Wartości domyślne (gdy nie ustawiono w konfiguracji):

- Wszystkie powierzchnie → `collect`

Skonfiguruj globalnie albo per kanał przez `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opcje kolejki

Opcje dotyczą `followup`, `collect` i `steer-backlog` (oraz `steer`, gdy wraca do followup):

- `debounceMs`: czekaj na ciszę przed rozpoczęciem tury followup (zapobiega „continue, continue”).
- `cap`: maksymalna liczba wiadomości w kolejce na sesję.
- `drop`: polityka przepełnienia (`old`, `new`, `summarize`).

Summarize zachowuje krótką listę punktów pominiętych wiadomości i wstrzykuje ją jako syntetyczny prompt followup.
Wartości domyślne: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Nadpisania per sesję

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` albo `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agenta automatycznych odpowiedzi we wszystkich kanałach przychodzących korzystających z potoku odpowiedzi gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny pas (`main`) działa na poziomie całego procesu dla przychodzących wiadomości + głównych Heartbeatów; ustaw `agents.defaults.maxConcurrent`, aby pozwolić na równoległość wielu sesji.
- Mogą istnieć dodatkowe pasy (np. `cron`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Pasy per sesję gwarantują, że tylko jedno uruchomienie agenta naraz dotyka danej sesji.
- Brak zewnętrznych zależności lub wątków workerów w tle; czysty TypeScript + promises.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze czasu kolejki.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Polityka ponawiania](/pl/concepts/retry)
