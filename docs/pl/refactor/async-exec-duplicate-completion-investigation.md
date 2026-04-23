---
read_when:
    - Debugowanie powtarzających się zdarzeń zakończenia exec Node
    - Praca nad deduplikacją Heartbeat/zdarzeń systemowych
summary: Notatki z dochodzenia dotyczącego zduplikowanego wstrzyknięcia zakończenia asynchronicznego exec
title: Dochodzenie dotyczące zduplikowanego zakończenia Async Exec
x-i18n:
    generated_at: "2026-04-23T10:08:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Dochodzenie dotyczące zduplikowanego zakończenia Async Exec

## Zakres

- Sesja: `agent:main:telegram:group:-1003774691294:topic:1`
- Objaw: to samo asynchroniczne zakończenie exec dla sesji/przebiegu `keen-nexus` zostało zapisane dwukrotnie w LCM jako tury użytkownika.
- Cel: ustalić, czy najbardziej prawdopodobne jest zduplikowane wstrzyknięcie sesji, czy zwykła ponowna próba dostarczenia wychodzącego.

## Wniosek

Najbardziej prawdopodobne jest, że to **zduplikowane wstrzyknięcie sesji**, a nie czysta ponowna próba dostarczenia wychodzącego.

Najsilniejsza luka po stronie gateway znajduje się w **ścieżce zakończenia exec Node**:

1. Zakończenie exec po stronie Node emituje `exec.finished` z pełnym `runId`.
2. Gateway `server-node-events` przekształca to w zdarzenie systemowe i żąda Heartbeat.
3. Przebieg Heartbeat wstrzykuje opróżniony blok zdarzeń systemowych do promptu agenta.
4. Osadzony runner utrwala ten prompt jako nową turę użytkownika w transkrypcie sesji.

Jeśli to samo `exec.finished` dotrze do gateway dwa razy dla tego samego `runId` z dowolnego powodu (replay, duplikat po ponownym połączeniu, resend upstream, zduplikowany producer), OpenClaw obecnie **nie ma sprawdzenia idempotencji kluczowanego przez `runId`/`contextKey`** na tej ścieżce. Druga kopia stanie się drugą wiadomością użytkownika o tej samej treści.

## Dokładna ścieżka kodu

### 1. Producer: zdarzenie zakończenia exec Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emituje `node.event` ze zdarzeniem `exec.finished`.
  - Payload zawiera `sessionKey` i pełne `runId`.

### 2. Ingest zdarzenia przez Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Obsługuje `exec.finished`.
  - Buduje tekst:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Kolejkuje go przez:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Natychmiast żąda wybudzenia:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Słabość deduplikacji zdarzeń systemowych

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` tłumi tylko **kolejne duplikaty tekstu**:
    - `if (entry.lastText === cleaned) return false`
  - Przechowuje `contextKey`, ale **nie** używa `contextKey` do idempotencji.
  - Po opróżnieniu tłumienie duplikatów się resetuje.

To oznacza, że powtórzone `exec.finished` z tym samym `runId` może zostać ponownie zaakceptowane później, mimo że kod miał już stabilnego kandydata do idempotencji (`exec:<runId>`).

### 4. Obsługa wybudzenia nie jest głównym źródłem duplikacji

- `src/infra/heartbeat-wake.ts:79-117`
  - Wybudzenia są łączone według `(agentId, sessionKey)`.
  - Zduplikowane żądania wybudzenia dla tego samego celu zwijają się do jednego oczekującego wpisu wybudzenia.

To sprawia, że **sama zduplikowana obsługa wybudzeń** jest słabszym wyjaśnieniem niż zduplikowany ingest zdarzenia.

### 5. Heartbeat konsumuje zdarzenie i zamienia je w wejście promptu

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight podgląda oczekujące zdarzenia systemowe i klasyfikuje przebiegi exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` opróżnia kolejkę dla sesji.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Opróżniony blok zdarzeń systemowych jest dopisywany na początku treści promptu agenta.

### 6. Punkt wstrzyknięcia do transkryptu

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` przekazuje pełny prompt do osadzonej sesji PI.
  - To jest punkt, w którym prompt pochodzący z zakończenia staje się utrwaloną turą użytkownika.

Tak więc, gdy to samo zdarzenie systemowe zostanie dwa razy przebudowane do promptu, zduplikowane wiadomości użytkownika w LCM są oczekiwane.

## Dlaczego czysta ponowna próba dostarczenia wychodzącego jest mniej prawdopodobna

W runnerze Heartbeat istnieje rzeczywista ścieżka błędu wychodzącego:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Najpierw generowana jest odpowiedź.
  - Dostarczanie wychodzące następuje później przez `deliverOutboundPayloads(...)`.
  - Błąd tam zwraca `{ status: "failed" }`.

Jednak dla tego samego wpisu kolejki zdarzeń systemowych to samo w sobie **nie wystarcza**, aby wyjaśnić zduplikowane tury użytkownika:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Kolejka zdarzeń systemowych jest już opróżniona przed dostarczeniem wychodzącym.

Zatem samo ponowienie wysyłki kanałowej nie odtworzyłoby dokładnie tego samego zakolejkowanego zdarzenia. Mogłoby wyjaśnić brakującą/nieudaną dostawę zewnętrzną, ale samo z siebie nie wyjaśnia drugiej identycznej wiadomości użytkownika w sesji.

## Wtórna, mniej pewna możliwość

W runnerze agenta istnieje pełna pętla ponawiania przebiegu:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Niektóre błędy przejściowe mogą ponowić cały przebieg i ponownie przesłać to samo `commandBody`.

To może zduplikować utrwalony prompt użytkownika **w ramach tego samego wykonania odpowiedzi**, jeśli prompt został już dopisany przed wystąpieniem warunku ponowienia.

Oceniam to niżej niż zduplikowany ingest `exec.finished`, ponieważ:

- obserwowana luka wynosiła około 51 sekund, co wygląda bardziej jak druga tura/wybudzenie niż ponowienie in-process;
- raport wspomina już o powtarzających się błędach wysyłki wiadomości, co bardziej wskazuje na osobną późniejszą turę niż na natychmiastowe ponowienie modelu/runtime.

## Hipoteza przyczyny źródłowej

Hipoteza o najwyższej pewności:

- Zakończenie `keen-nexus` przyszło przez **ścieżkę zdarzeń exec Node**.
- To samo `exec.finished` zostało dostarczone do `server-node-events` dwa razy.
- Gateway zaakceptował oba, ponieważ `enqueueSystemEvent(...)` nie deduplikuje według `contextKey` / `runId`.
- Każde zaakceptowane zdarzenie wywołało Heartbeat i zostało wstrzyknięte jako tura użytkownika do transkryptu PI.

## Proponowana mała chirurgiczna poprawka

Jeśli potrzebna jest poprawka, najmniejszą zmianą o wysokiej wartości jest:

- sprawić, aby idempotencja exec/zdarzeń systemowych uwzględniała `contextKey` przez krótki horyzont, przynajmniej dla dokładnych powtórzeń `(sessionKey, contextKey, text)`;
- albo dodać dedykowaną deduplikację w `server-node-events` dla `exec.finished` kluczowaną przez `(sessionKey, runId, rodzaj zdarzenia)`.

To bezpośrednio zablokowałoby powtórzone duplikaty `exec.finished`, zanim staną się turami sesji.
