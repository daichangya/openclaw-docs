---
read_when:
    - Potrzebujesz dokładnego omówienia pętli agenta lub zdarzeń cyklu życia.
    - Zmieniasz kolejkowanie sesji, zapisy transkryptu lub zachowanie blokady zapisu sesji.
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-25T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, przy zachowaniu spójnego stanu sesji.

W OpenClaw pętla to pojedyncze, serializowane uruchomienie na sesję, które emituje zdarzenia cyklu życia i zdarzenia strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje dane wyjściowe. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (na wysokim poziomie)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (sessionKey/sessionId), zapisuje metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje domyślne ustawienia modelu + thinking/verbose/trace
   - ładuje snapshot Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko wykonawcze pi-agent-core)
   - emituje **lifecycle end/error**, jeśli osadzona pętla tego nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki per sesja i globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję Pi
   - subskrybuje zdarzenia Pi i strumieniuje delty assistant/tool
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

- Uruchomienia są serializowane per klucz sesji (pas sesji), a opcjonalnie także przez pas globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Command Queue](/pl/concepts/queue).
- Zapisy transkryptu są również chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesów i oparta na pliku, więc wychwytuje zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu.
- Blokady zapisu sesji są domyślnie nierekurencyjne. Jeśli pomocnik celowo zagnieżdża przejęcie
  tej samej blokady przy zachowaniu jednego logicznego zapisującego, musi jawnie włączyć tę możliwość przez
  `allowReentrant: true`.

## Przygotowanie sesji + obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; uruchomienia sandboxowane mogą przekierowywać do katalogu głównego obszaru roboczego sandbox.
- Skills są ładowane (lub ponownie używane ze snapshotu) i wstrzykiwane do środowiska i promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu system prompt.
- Przejmowana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkryptu, Compaction lub przycinania musi przejąć tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkryptu.

## Składanie promptu + system prompt

- System prompt jest budowany z promptu bazowego OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań per uruchomienie.
- Wymuszane są limity specyficzne dla modelu oraz rezerwowe tokeny Compaction.
- Zobacz [System prompt](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie można przechwycić)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: uruchamiany podczas budowania plików bootstrap, zanim system prompt zostanie sfinalizowany.
  Używaj go do dodawania/usuwania plików kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację Hooks).

Zobacz [Hooks](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + gateway)

Są uruchamiane wewnątrz pętli agenta lub potoku gateway:

- **`before_model_resolve`**: uruchamiany przed sesją (bez `messages`) w celu deterministycznego nadpisania dostawcy/modelu przed rozwiązaniem modelu.
- **`before_prompt_build`**: uruchamiany po załadowaniu sesji (z `messages`) w celu wstrzyknięcia `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Używaj `prependContext` dla dynamicznego tekstu per tura, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni system prompt.
- **`before_agent_start`**: starszy hook zgodności, który może działać w obu fazach; preferuj powyższe jawne hooki.
- **`before_agent_reply`**: uruchamiany po działaniach inline i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwują lub oznaczają cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytują parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje skill lub Plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi przed ich zapisaniem do transkryptu sesji należącego do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Zasady podejmowania decyzji przez hooki dla strażników wychodzących/narzędziowych:

- `before_tool_call`: `{ block: true }` jest ostateczne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest ostateczne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest ostateczne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Zobacz [Plugin hooks](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą adaptować te hooki w różny sposób. Harness app-server Codex zachowuje
hooki Plugin OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni
lustrzanych, podczas gdy natywne hooki Codex pozostają osobnym, niższym mechanizmem Codex.

## Strumieniowanie + odpowiedzi częściowe

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować odpowiedzi częściowe na `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Streaming](/pl/concepts/streaming), aby poznać zachowanie chunkowania i odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emisją.
- Wysyłki narzędzia wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnie rozumowania)
  - podsumowań narzędzi inline (gdy `verbose` i dozwolone)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest odfiltrowywany z wychodzących
  ładunków.
- Duplikaty narzędzia wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne renderowalne ładunki, a narzędzie zwróciło błąd, emitowana jest rezerwowa odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało widoczną dla użytkownika odpowiedź).

## Compaction + ponowienia

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyjścia.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz rezerwowo przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane do wiadomości czatu `delta`.
- Końcowy czat `final` jest emitowany przy **lifecycle end/error**.

## Limity czasu

- Domyślnie `agent.wait`: 30s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje tę wartość.
- Środowisko wykonawcze agenta: `agents.defaults.timeoutSeconds` domyślnie 172800s (48 godzin); egzekwowane w liczniku przerwania `runEmbeddedPiAgent`.
- Limit bezczynności LLM: `agents.defaults.llm.idleTimeoutSeconds` przerywa żądanie modelu, gdy żadne chunky odpowiedzi nie nadejdą przed upływem okna bezczynności. Ustaw go jawnie dla wolnych modeli lokalnych lub dostawców rozumowania/wywołań narzędzi; ustaw na 0, aby wyłączyć. Jeśli nie jest ustawiony, OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, w przeciwnym razie 120s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu LLM lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu Cron.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (dotyczy tylko oczekiwania, nie zatrzymuje agenta)

## Powiązane

- [Tools](/pl/tools) — dostępne narzędzia agenta
- [Hooks](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak długie rozmowy są podsumowywane
- [Exec Approvals](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking/rozumowania
