---
read_when:
    - Chcesz zrozumieć, jakie narzędzia sesji ma agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie subagentów
    - Chcesz sprawdzać stan lub sterować uruchomionymi subagentami
summary: Narzędzia agenta do międzyseryjnego statusu, przywoływania pamięci, wiadomości i orkiestracji subagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-04-23T10:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Narzędzia sesji

OpenClaw daje agentom narzędzia do pracy między sesjami, sprawdzania stanu i
orkiestracji subagentów.

## Dostępne narzędzia

| Narzędzie         | Co robi                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `sessions_list`   | Wyświetla listę sesji z opcjonalnymi filtrami (rodzaj, etykieta, agent, recentność, podgląd) |
| `sessions_history` | Odczytuje transkrypt konkretnej sesji                                         |
| `sessions_send`   | Wysyła wiadomość do innej sesji i opcjonalnie czeka                           |
| `sessions_spawn`  | Uruchamia odizolowaną sesję subagenta do pracy w tle                          |
| `sessions_yield`  | Kończy bieżącą turę i czeka na dalsze wyniki subagenta                        |
| `subagents`       | Wyświetla, steruje lub kończy uruchomione subagenty dla tej sesji             |
| `session_status`  | Pokazuje kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu per sesja |

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, `agentId`, rodzajem, kanałem, modelem,
liczbą tokenów i znacznikami czasu. Filtruj według rodzaju (`main`, `group`, `cron`, `hook`,
`node`), dokładnej `label`, dokładnego `agentId`, tekstu wyszukiwania lub recentności
(`activeMinutes`). Gdy potrzebujesz triage w stylu skrzynki odbiorczej, narzędzie może także poprosić o
tytuł pochodny ograniczony zakresem widoczności, fragment podglądu ostatniej wiadomości lub
ograniczone ostatnie wiadomości w każdym wierszu. Tytuły pochodne i podglądy są tworzone tylko dla
sesji, które wywołujący może już zobaczyć zgodnie ze skonfigurowanymi zasadami
widoczności narzędzi sesji, więc niezwiązane sesje pozostają ukryte.

`sessions_history` pobiera transkrypt rozmowy dla konkretnej sesji.
Domyślnie wyniki narzędzi są wykluczone — przekaż `includeTools: true`, aby je zobaczyć.
Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi myślenia są usuwane
  - bloki szablonowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - zwykłe tekstowe bloki XML ładunków wywołań narzędzi, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` oraz
    `<function_calls>...</function_calls>`, są usuwane, w tym ucięte
    ładunki, które nigdy nie zamykają się poprawnie
  - zdegradowane bloki szablonowe wywołań/wyników narzędzi, takie jak `[Tool Call: ...]`,
    `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty pełnej szerokości `<｜...｜>`, są usuwane
  - nieprawidłowy XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` /
    `</minimax:tool_call>`, jest usuwany
- tekst przypominający poświadczenia/tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są skracane
- bardzo duże historie mogą usuwać starsze wiersze albo zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- narzędzie zgłasza flagi podsumowujące, takie jak `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` oraz `bytes`

Oba narzędzia akceptują albo **klucz sesji** (na przykład `"main"`), albo **ID sesji**
z poprzedniego wywołania listy.

Jeśli potrzebujesz dokładnego transkryptu bajt po bajcie, sprawdź plik transkryptu na
dysku zamiast traktować `sessions_history` jako surowy zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie czeka na
odpowiedź:

- **Wyślij i zapomnij:** ustaw `timeoutSeconds: 0`, aby umieścić w kolejce i zwrócić
  wynik natychmiast.
- **Czekaj na odpowiedź:** ustaw limit czasu i otrzymaj odpowiedź inline.

Po odpowiedzi celu OpenClaw może uruchomić **pętlę odpowiedzi zwrotnej**, w której
agenci naprzemiennie wysyłają wiadomości (do 5 tur). Agent docelowy może odpowiedzieć
`REPLY_SKIP`, aby zakończyć wcześniej.

## Pomocniki stanu i orkiestracji

`session_status` to lekkie narzędzie równoważne `/status` dla bieżącej
lub innej widocznej sesji. Raportuje użycie, czas, stan modelu/runtime oraz
powiązany kontekst zadania w tle, jeśli jest obecny. Podobnie jak `/status`, może uzupełniać
rzadkie liczniki tokenów/cache z najnowszego wpisu użycia w transkrypcie, a
`model=default` czyści nadpisanie per sesja.

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być
zdarzeniem uzupełniającym, na które czekasz. Użyj go po uruchomieniu subagentów, gdy
chcesz, aby wyniki ukończenia dotarły jako następna wiadomość zamiast budowania
pętli odpytywania.

`subagents` to pomocnik płaszczyzny sterowania dla już uruchomionych subagentów
OpenClaw. Obsługuje:

- `action: "list"` do sprawdzania aktywnych/niedawnych uruchomień
- `action: "steer"` do wysyłania dalszych wskazówek do działającego potomka
- `action: "kill"` do zatrzymania jednego potomka albo `all`

## Uruchamianie subagentów

`sessions_spawn` tworzy odizolowaną sesję dla zadania w tle. Zawsze jest
nieblokujące — zwraca natychmiast z `runId` i `childSessionKey`.

Kluczowe opcje:

- `runtime: "subagent"` (domyślnie) albo `"acp"` dla zewnętrznych agentów harness.
- nadpisania `model` i `thinking` dla sesji potomnej.
- `thread: true`, aby powiązać uruchomienie z wątkiem czatu (Discord, Slack itd.).
- `sandbox: "require"`, aby wymusić sandbox dla potomka.

Domyślne liściowe subagenty nie dostają narzędzi sesji. Gdy
`maxSpawnDepth >= 2`, subagenty orkiestratora na głębokości 1 dodatkowo dostają
`sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby
mogły zarządzać własnymi potomkami. Uruchomienia liściowe nadal nie dostają
rekurencyjnych narzędzi orkiestracji.

Po zakończeniu krok ogłoszenia publikuje wynik do kanału żądającego.
Dostarczanie ukończenia zachowuje routing powiązanego wątku/tematu, gdy jest dostępny,
a jeśli źródło ukończenia identyfikuje tylko kanał, OpenClaw nadal może użyć
zapisanego routingu sesji żądającego (`lastChannel` / `lastTo`) do bezpośredniego
dostarczenia.

Informacje o zachowaniu specyficznym dla ACP znajdziesz w [ACP Agents](/pl/tools/acp-agents).

## Widoczność

Narzędzia sesji mają ograniczony zakres, aby limitować to, co agent może zobaczyć:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja + uruchomione subagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Domyślnie jest to `tree`. Sesje w sandbox są ograniczane do `tree` niezależnie od
konfiguracji.

## Dalsza lektura

- [Session Management](/pl/concepts/session) — routing, cykl życia, utrzymanie
- [ACP Agents](/pl/tools/acp-agents) — uruchamianie zewnętrznego harness
- [Multi-agent](/pl/concepts/multi-agent) — architektura wielu agentów
- [Gateway Configuration](/pl/gateway/configuration) — ustawienia konfiguracji narzędzi sesji
