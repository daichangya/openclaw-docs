---
read_when:
    - Potrzebujesz dokładnego omówienia pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkryptu lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-23T09:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Pętla agenta (OpenClaw)

Pętla agentowa to pełne „prawdziwe” uruchomienie agenta: przyjęcie → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, utrzymując spójny stan sesji.

W OpenClaw pętla to pojedyncze, serializowane uruchomienie na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta rzeczywista pętla
jest połączona od końca do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (wysoki poziom)

1. RPC `agent` waliduje parametry, rozstrzyga sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozstrzyga domyślne wartości modelu + thinking/verbose/trace
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emituje **lifecycle end/error**, jeśli osadzona pętla ich nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki per sesja + globalne
   - rozstrzyga model + profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **lifecycle end/error** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Uruchomienia są serializowane per klucz sesji (pas sesji) i opcjonalnie przez pas globalny.
- To zapobiega wyścigom narzędzi/sesji i utrzymuje spójność historii sesji.
- Kanały wiadomości mogą wybierać tryby kolejkowania (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkryptu są również chronione blokadą zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wychwytuje zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu.
- Blokady zapisu sesji są domyślnie nierekurencyjne. Jeśli pomocnik celowo zagnieżdża przejęcie
  tej samej blokady przy zachowaniu jednego logicznego zapisującego, musi jawnie włączyć tę możliwość przez
  `allowReentrant: true`.

## Przygotowanie sesji + obszaru roboczego

- Obszar roboczy jest rozstrzygany i tworzony; uruchomienia sandboxowane mogą przekierowywać do korzenia obszaru roboczego sandbox.
- Skills są ładowane (lub ponownie używane z migawki) i wstrzykiwane do env oraz promptu.
- Pliki bootstrap/kontekstu są rozstrzygane i wstrzykiwane do raportu promptu systemowego.
- Przejmowana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkryptu, Compaction lub obcinania musi przejąć tę samą blokadę przed otwarciem lub
  mutacją pliku transkryptu.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań per uruchomienie.
- Wymuszane są limity specyficzne dla modelu oraz tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie można przechwycić)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: uruchamiany podczas budowania plików bootstrap przed finalizacją promptu systemowego.
  Użyj go, aby dodawać/usuwać pliki kontekstu bootstrap.
- **Hooki poleceń**: zdarzenia `/new`, `/reset`, `/stop` i innych poleceń (zobacz dokument Hooks).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + gateway)

Są uruchamiane wewnątrz pętli agenta lub potoku gateway:

- **`before_model_resolve`**: uruchamiany przed sesją (bez `messages`), aby deterministycznie nadpisać provider/model przed rozstrzygnięciem modelu.
- **`before_prompt_build`**: uruchamiany po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu per tura, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znaleźć się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w obu fazach; preferuj powyższe hooki jawne.
- **`before_agent_reply`**: uruchamiany po akcjach inline i przed wywołaniem LLM, pozwalając Pluginowi przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwują lub adnotują cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytują parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i może opcjonalnie blokować instalacje Skills lub Plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi przed zapisaniem ich do transkryptu sesji.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Zasady decyzji hooków dla zabezpieczeń narzędzi/wyjścia:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/architecture#provider-runtime-hooks), aby poznać API hooków i szczegóły rejestracji.

## Strumieniowanie + częściowe odpowiedzi

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie blokowe może emitować częściowe odpowiedzi na `text_end` lub `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień lub jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie chunkingu i odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emisją.
- Wysłania przez narzędzia wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnie rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne renderowalne ładunki, a narzędzie zwróciło błąd, emitowana jest awaryjna odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości wysłało już widoczną dla użytkownika odpowiedź).

## Compaction + ponowne próby

- Automatyczny Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć duplikacji wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane do wiadomości czatu `delta`.
- Końcowy czat `final` jest emitowany przy **lifecycle end/error**.

## Limity czasu

- Domyślnie `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Runtime agenta: domyślnie `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane w liczniku przerwania `runEmbeddedPiAgent`.
- Limit bezczynności LLM: `agents.defaults.llm.idleTimeoutSeconds` przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne chunki odpowiedzi. Ustaw to jawnie dla wolnych modeli lokalnych albo providerów rozumowania/wywołań narzędzi; ustaw `0`, aby wyłączyć. Jeśli nie jest ustawione, OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, w przeciwnym razie 120 s. Uruchomienia wyzwalane przez cron bez jawnego limitu czasu LLM lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu cron.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak długie rozmowy są podsumowywane
- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking
