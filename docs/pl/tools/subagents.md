---
read_when:
    - Chcesz wykonywać pracę w tle/równolegle przez agenta
    - Zmieniasz politykę `sessions_spawn` lub narzędzia podagentów
    - Implementujesz lub rozwiązujesz problemy sesji podagentów powiązanych z wątkiem
summary: 'Podagenci: uruchamianie izolowanych przebiegów agentów, które odsyłają wyniki z powrotem do czatu żądającego'
title: Podagenci
x-i18n:
    generated_at: "2026-04-25T14:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Podagenci to przebiegi agentów uruchamiane w tle z istniejącego przebiegu agenta. Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po zakończeniu **ogłaszają** swój wynik z powrotem do kanału czatu żądającego. Każdy przebieg podagenta jest śledzony jako [background task](/pl/automation/tasks).

## Polecenie slash

Użyj `/subagents`, aby sprawdzić lub sterować przebiegami podagentów dla **bieżącej sesji**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrolki powiązania z wątkiem:

Te polecenia działają w kanałach obsługujących trwałe powiązania z wątkami. Zobacz **Kanały obsługujące wątki** poniżej.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` pokazuje metadane przebiegu (status, znaczniki czasu, identyfikator sesji, ścieżkę transkryptu, cleanup).
Użyj `sessions_history` do ograniczonego, filtrowanego pod kątem bezpieczeństwa widoku przypomnienia; sprawdź
ścieżkę transkryptu na dysku, gdy potrzebujesz surowego pełnego transkryptu.

### Zachowanie uruchamiania

`/subagents spawn` uruchamia podagenta w tle jako polecenie użytkownika, a nie wewnętrzny relay, i po zakończeniu przebiegu wysyła jedną końcową aktualizację z powrotem do czatu żądającego.

- Polecenie uruchamiania nie blokuje; natychmiast zwraca identyfikator przebiegu.
- Po zakończeniu podagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem do kanału czatu żądającego.
- Dostarczenie zakończenia działa w modelu push. Po uruchomieniu nie odpytywać w pętli `/subagents list`,
  `sessions_list` ani `sessions_history` tylko po to, by czekać na zakończenie;
  sprawdzaj status tylko na żądanie do debugowania lub interwencji.
- Po zakończeniu OpenClaw w miarę możliwości zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję podagenta, zanim będzie kontynuowany cleanup ogłoszenia.
- Dla ręcznych uruchomień dostarczenie jest odporne:
  - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
  - Jeśli bezpośrednie dostarczenie się nie powiedzie, przechodzi do routingu przez kolejkę.
  - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym backoff przed ostateczną rezygnacją.
- Dostarczenie zakończenia zachowuje rozwiązaną trasę żądającego:
  - jeśli dostępne są trasy zakończenia powiązane z wątkiem lub konwersacją, mają one pierwszeństwo
  - jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący target/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało
- Przekazanie zakończenia do sesji żądającego to wewnętrzny kontekst generowany w runtime (nie tekst napisany przez użytkownika) i obejmuje:
  - `Result` (ostatni widoczny tekst odpowiedzi `assistant`, a w przeciwnym razie sanityzowany ostatni tekst `tool`/`toolResult`; końcowe nieudane przebiegi nie używają ponownie przechwyconego tekstu odpowiedzi)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - zwarte statystyki runtime/tokenów
  - instrukcję dostarczenia, która mówi agentowi żądającemu, aby przepisał to normalnym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych)
- `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego przebiegu.
- Użyj `info`/`log`, aby sprawdzić szczegóły i wynik po zakończeniu.
- `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
- Dla sesji harness ACP (Codex, Claude Code, Gemini CLI) użyj `sessions_spawn` z `runtime: "acp"` i zobacz [ACP Agents](/pl/tools/acp-agents), szczególnie [ACP delivery model](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-do-agenta.

Główne cele:

- Równoleglenie pracy typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślna izolacja podagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzia trudnej do niewłaściwego użycia: podagenci **nie** dostają domyślnie narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestracji.

Uwaga dotycząca kosztów: każdy podagent ma domyślnie **własny** kontekst i własne zużycie tokenów. Dla ciężkich lub
powtarzalnych zadań ustaw tańszy model dla podagentów, a głównego agenta pozostaw na
modelu wyższej jakości. Możesz to skonfigurować przez `agents.defaults.subagents.model` albo nadpisania
per-agent. Gdy dziecko rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
`context: "fork"` dla tego pojedynczego uruchomienia.

## Tryby kontekstu

Natywni podagenci startują w izolacji, chyba że wywołujący jawnie zażąda sforkowania
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                       | Zachowanie                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nowy research, niezależna implementacja, praca z wolnym narzędziem albo wszystko, co da się opisać w treści zadania                   | Tworzy czysty transkrypt potomny. To ustawienie domyślne i pomaga ograniczyć zużycie tokenów. |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansów instrukcji obecnych już w transkrypcie żądającego    | Rozgałęzia transkrypt żądającego do sesji potomnej przed startem potomka.         |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako zamiennik
jasno napisanego promptu zadania.

## Narzędzie

Użyj `sessions_spawn`:

- Uruchamia przebieg podagenta (`deliver: false`, global lane: `subagent`)
- Następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia do kanału czatu żądającego
- Model domyślny: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub per-agent `agents.list[].subagents.model`); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- Thinking domyślnie: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub per-agent `agents.list[].subagents.thinking`); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- Domyślny timeout przebiegu: jeśli pominięto `sessions_spawn.runTimeoutSeconds`, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, jeśli jest ustawione; w przeciwnym razie wraca do `0` (brak limitu czasu).

Parametry narzędzia:

- `task` (wymagane)
- `label?` (opcjonalne)
- `agentId?` (opcjonalne; uruchom pod innym identyfikatorem agenta, jeśli jest to dozwolone)
- `model?` (opcjonalne; nadpisuje model podagenta; nieprawidłowe wartości są pomijane, a podagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia)
- `thinking?` (opcjonalne; nadpisuje poziom thinking dla przebiegu podagenta)
- `runTimeoutSeconds?` (domyślnie `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawione, w przeciwnym razie `0`; jeśli ustawione, przebieg podagenta jest przerywany po N sekundach)
- `thread?` (domyślnie `false`; gdy `true`, żąda powiązania kanału z wątkiem dla tej sesji podagenta)
- `mode?` (`run|session`)
  - domyślnie `run`
  - jeśli `thread: true` i pominięto `mode`, domyślnie staje się `session`
  - `mode: "session"` wymaga `thread: true`
- `cleanup?` (`delete|keep`, domyślnie `keep`)
- `sandbox?` (`inherit|require`, domyślnie `inherit`; `require` odrzuca uruchomienie, jeśli docelowy runtime potomny nie jest sandboxowany)
- `context?` (`isolated|fork`, domyślnie `isolated`; tylko dla natywnych podagentów)
  - `isolated` tworzy czysty transkrypt potomny i jest ustawieniem domyślnym.
  - `fork` rozgałęzia bieżący transkrypt żądającego do sesji potomnej, więc potomek startuje z tym samym kontekstem rozmowy.
  - Używaj `fork` tylko wtedy, gdy potomek potrzebuje bieżącego transkryptu. Dla zakresowych prac pomiń `context`.
- `sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj `message`/`sessions_send` z uruchomionego przebiegu.

## Sesje powiązane z wątkiem

Gdy powiązania z wątkami są włączone dla kanału, podagent może pozostać powiązany z wątkiem, tak aby dalsze wiadomości użytkownika w tym wątku nadal trafiały do tej samej sesji podagenta.

### Kanały obsługujące wątki

- Discord (obecnie jedyny obsługiwany kanał): obsługuje trwałe sesje podagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`), ręczne sterowanie wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) oraz klucze adaptera `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` i `channels.discord.threadBindings.spawnSubagentSessions`.

Szybki przepływ:

1. Uruchom przez `sessions_spawn` z użyciem `thread: true` (i opcjonalnie `mode: "session"`).
2. OpenClaw tworzy wątek albo wiąże go z celem tej sesji w aktywnym kanale.
3. Odpowiedzi i dalsze wiadomości w tym wątku są kierowane do powiązanej sesji.
4. Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odwiązywanie po bezczynności, oraz `/session max-age`, aby kontrolować twardy limit.
5. Użyj `/unfocus`, aby odłączyć ręcznie.

Sterowanie ręczne:

- `/focus <target>` wiąże bieżący wątek (albo go tworzy) z celem podagenta/sesji.
- `/unfocus` usuwa powiązanie dla bieżącego powiązanego wątku.
- `/agents` wyświetla aktywne przebiegi i stan powiązania (`thread:<id>` albo `unbound`).
- `/session idle` i `/session max-age` działają tylko dla skupionych powiązanych wątków.

Przełączniki konfiguracji:

- Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Nadpisania kanałowe i klucze automatycznego wiązania przy uruchamianiu są specyficzne dla adaptera. Zobacz **Kanały obsługujące wątki** powyżej.

Aktualne szczegóły adapterów znajdziesz w [Configuration Reference](/pl/gateway/configuration-reference) i [Slash commands](/pl/tools/slash-commands).

Lista dozwolonych:

- `agents.list[].subagents.allowAgents`: lista identyfikatorów agentów, które można kierować przez `agentId` (`["*"]`, aby zezwolić na dowolny). Domyślnie: tylko agent żądający.
- `agents.defaults.subagents.allowAgents`: domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
- Zabezpieczenie dziedziczenia sandbox: jeśli sesja żądającego jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandboxu.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: gdy `true`, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Domyślnie: false.

Wykrywanie:

- Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla `sessions_spawn`.

Autoarchiwizacja:

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie: 60).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (transkrypt nadal zostaje zachowany przez zmianę nazwy).
- Autoarchiwizacja jest wykonywana w miarę możliwości; oczekujące timery przepadają po restarcie gateway.
- `runTimeoutSeconds` **nie** autoarchiwizuje; tylko zatrzymuje przebieg. Sesja pozostaje do czasu autoarchiwizacji.
- Autoarchiwizacja dotyczy jednakowo sesji głębokości 1 i 2.
- Cleanup przeglądarki jest oddzielny od cleanup archiwizacji: śledzone karty/procesy przeglądarki są w miarę możliwości zamykane po zakończeniu przebiegu, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni podagenci

Domyślnie podagenci nie mogą uruchamiać własnych podagentów (`maxSpawnDepth: 1`). Możesz włączyć jeden poziom zagnieżdżenia, ustawiając `maxSpawnDepth: 2`, co pozwala na **wzorzec orkiestratora**: główny → podagent orkiestrator → podrzędni podagenci roboczy.

### Jak to włączyć

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // pozwala podagentom uruchamiać potomków (domyślnie: 1)
        maxChildrenPerAgent: 5, // maksymalna liczba aktywnych potomków na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności lane (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny timeout dla sessions_spawn, gdy pominięte (0 = bez limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?             |
| --------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                           | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                | Podagent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (worker liściowy)                | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki wracają w górę łańcucha:

1. Worker głębokości 2 kończy pracę → ogłasza wynik rodzicowi (orkiestratorowi głębokości 1)
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy pracę → ogłasza wynik do głównego agenta
3. Główny agent odbiera ogłoszenie i dostarcza je użytkownikowi

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich potomków.

Wskazówki operacyjne:

- Uruchamiaj pracę potomną raz i czekaj na zdarzenia zakończenia zamiast budować pętle odpytywania
  wokół `sessions_list`, `sessions_history`, `/subagents list` albo
  poleceń `exec` z `sleep`.
- `sessions_list` i `/subagents list` utrzymują relacje child-session skupione
  na aktywnej pracy: aktywne dzieci pozostają przypięte, zakończone dzieci są nadal widoczne przez
  krótki ostatni okres, a nieaktualne powiązania potomne tylko ze storage są ignorowane po upływie okna świeżości. To zapobiega wskrzeszaniu widmowych dzieci po restarcie przez stare metadane `spawnedBy` / `parentSessionKey`.
- Jeśli zdarzenie zakończenia potomka dotrze po tym, jak końcowa odpowiedź została już wysłana,
  poprawną odpowiedzią następczą jest dokładnie cichy token `NO_REPLY` / `no_reply`.

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. To zapobiega przypadkowemu odzyskaniu uprawnień orkiestratora przez płaskie lub przywrócone klucze sesji.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`)**: otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemu pozostają zablokowane.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`)**: brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (worker liściowy)**: brak narzędzi sesji — `sessions_spawn` jest zawsze blokowane na głębokości 2. Nie może uruchamiać kolejnych potomków.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent` (domyślnie: 5) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu z jednego orkiestratora.

### Zatrzymanie kaskadowe

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich podagentów dla żądającego i działa kaskadowo.

## Uwierzytelnianie

Auth podagenta jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Store auth jest ładowany z `agentDir` tego agenta.
- Profile auth głównego agenta są scalane jako **fallback**; profile agenta mają pierwszeństwo przy konfliktach.

Uwaga: scalanie jest addytywne, więc profile głównego agenta są zawsze dostępne jako fallback. W pełni izolowane auth per agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Podagenci raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji podagenta (a nie sesji żądającego).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładnie cichy token `NO_REPLY` / `no_reply`,
  wynik ogłoszenia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.
- W przeciwnym razie dostarczenie zależy od głębokości żądającego:
  - sesje żądającego najwyższego poziomu używają następczego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`)
  - zagnieżdżone sesje podagentów żądającego otrzymują wewnętrzne wstrzyknięcie następcze (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki potomków w obrębie sesji
  - jeśli zagnieżdżona sesja podagenta żądającego już nie istnieje, OpenClaw wraca do żądającego tej sesji, jeśli jest dostępny
- Dla sesji żądającego najwyższego poziomu bezpośrednie dostarczenie w trybie completion najpierw rozwiązuje każdą powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia brakujące pola targetu kanału z zapisanej trasy sesji żądającego. Dzięki temu zakończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło zakończenia identyfikuje tylko kanał.
- Agregacja zakończeń potomków jest ograniczona do bieżącego przebiegu żądającego przy budowaniu zagnieżdżonych ustaleń zakończenia, co zapobiega przeciekaniu starych wyników potomków z wcześniejszych przebiegów do bieżącego ogłoszenia.
- Odpowiedzi ogłoszeń zachowują routing wątku/tematu tam, gdzie jest dostępny w adapterach kanałów.
- Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:
  - źródło (`subagent` albo `cron`)
  - klucz/id sesji potomnej
  - typ ogłoszenia + etykieta zadania
  - wiersz statusu wyprowadzony z wyniku runtime (`success`, `error`, `timeout` albo `unknown`)
  - treść wyniku wybrana z najnowszego widocznego tekstu asystenta, a w przeciwnym razie sanityzowany najnowszy tekst `tool`/`toolResult`; końcowe nieudane przebiegi raportują status porażki bez odtwarzania przechwyconego tekstu odpowiedzi
  - instrukcję następczą opisującą, kiedy odpowiadać, a kiedy pozostać cicho
- `Status` nie jest wywnioskowany z wyniku modelu; pochodzi z sygnałów wyniku runtime.
- W przypadku timeout, jeśli dziecko zdążyło tylko przejść przez wywołania narzędzi, ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowy wynik narzędzia.

Payloady ogłoszeń zawierają na końcu wiersz statystyk (nawet jeśli są opakowane):

- Runtime (np. `runtime 5m12s`)
- Zużycie tokenów (wejściowe/wyjściowe/łączne)
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` i ścieżkę transkryptu (aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku)
- Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi skierowane do użytkownika powinny być przepisane normalnym głosem asystenta.

` sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- przypomnienie asystenta jest najpierw normalizowane:
  - usuwane są tagi thinking
  - usuwane są bloki scaffolding `<relevant-memories>` / `<relevant_memories>`
  - usuwane są zwykłe tekstowe bloki XML payload wywołań narzędzi, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, w tym
    ucięte payloady, które nigdy nie domykają się poprawnie
  - usuwane są zdegradowane scaffolding wywołań/wyników narzędzi i znaczniki kontekstu historycznego
  - usuwane są wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz ich pełnoszerokie warianty `<｜...｜>`
  - usuwany jest nieprawidłowy XML wywołań narzędzi MiniMax
- tekst przypominający poświadczenia/tokeny jest redagowany
- długie bloki mogą być przycinane
- bardzo duże historie mogą odrzucać starsze wiersze albo zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- sprawdzenie surowego transkryptu na dysku pozostaje fallbackiem, gdy potrzebujesz pełnego transkryptu bajt w bajt

## Polityka narzędzi (narzędzia podagentów)

Domyślnie podagenci otrzymują **wszystkie narzędzia poza narzędziami sesji** i narzędziami systemowymi:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

` sessions_history` również tutaj pozostaje ograniczonym, sanityzowanym widokiem przypomnienia; nie
jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, podagenci-orkiestratorzy głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi dziećmi.

Nadpisanie przez konfigurację:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wygrywa
        deny: ["gateway", "cron"],
        // jeśli ustawiono allow, staje się allow-only (deny nadal wygrywa)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Współbieżność

Podagenci używają dedykowanego lane kolejki w procesie:

- Nazwa lane: `subagent`
- Współbieżność: `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że podagent
nadal działa. Niezakończone przebiegi starsze niż okno nieaktualnych przebiegów przestają być liczone jako
aktywne/oczekujące w `/subagents list`, podsumowaniach statusu, bramkowaniu zakończeń potomków
oraz sprawdzaniu współbieżności per sesja.

Po restarcie gateway nieaktualne niezakończone przywrócone przebiegi są usuwane, chyba że ich
sesja potomna jest oznaczona `abortedLastRun: true`. Te przerwane przy restarcie sesje potomne
pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych podagentów, który
wysyła syntetyczną wiadomość wznowienia przed wyczyszczeniem znacznika przerwania.

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne przebiegi podagentów uruchomione z niej, kaskadowo także dzieci zagnieżdżone.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo jego dzieci.

## Ograniczenia

- Ogłoszenie podagenta działa **w miarę możliwości**. Jeśli gateway zostanie zrestartowany, oczekująca praca „ogłoś z powrotem” przepada.
- Podagenci nadal współdzielą zasoby tego samego procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (`maxSpawnDepth` zakres: 1–5). Głębokość 2 jest zalecana dla większości zastosowań.
- `maxChildrenPerAgent` ogranicza aktywne dzieci na sesję (domyślnie: 5, zakres: 1–20).

## Powiązane

- [ACP agents](/pl/tools/acp-agents)
- [Multi-agent sandbox tools](/pl/tools/multi-agent-sandbox-tools)
- [Agent send](/pl/tools/agent-send)
