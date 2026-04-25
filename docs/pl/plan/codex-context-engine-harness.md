---
read_when:
    - Podłączasz zachowanie cyklu życia silnika kontekstu do wiązki Codex
    - Potrzebujesz, aby lossless-claw lub inny Plugin silnika kontekstu działał z sesjami osadzonej wiązki codex/*
    - Porównujesz zachowanie kontekstu osadzonego PI i app-server Codex
summary: Specyfikacja, jak sprawić, by dołączona wiązka app-server Codex respektowała Pluginy silnika kontekstu OpenClaw
title: Port silnika kontekstu wiązki Codex
x-i18n:
    generated_at: "2026-04-25T13:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Status

Wstępna specyfikacja implementacji.

## Cel

Sprawić, aby dołączona wiązka app-server Codex respektowała ten sam kontrakt
cyklu życia silnika kontekstu OpenClaw, który respektują już osadzone tury PI.

Sesja używająca `agents.defaults.embeddedHarness.runtime: "codex"` albo modelu
`codex/*` powinna nadal pozwalać wybranemu Plugin silnika kontekstu, takiemu jak
`lossless-claw`, kontrolować składanie kontekstu, przetwarzanie po turze,
utrzymanie i zasady Compaction na poziomie OpenClaw w takim zakresie, na jaki
pozwala granica app-server Codex.

## Rzeczy poza zakresem

- Nie implementować ponownie wewnętrznych elementów app-server Codex.
- Nie sprawiać, aby natywny Compaction wątku Codex tworzył podsumowanie lossless-claw.
- Nie wymagać, aby modele inne niż Codex używały wiązki Codex.
- Nie zmieniać zachowania sesji ACP/acpx. Ta specyfikacja dotyczy tylko
  ścieżki wiązki osadzonego agenta bez ACP.
- Nie wymagać, aby zewnętrzne Pluginy rejestrowały fabryki rozszerzeń app-server Codex;
  istniejąca granica zaufania dołączonych Plugin pozostaje bez zmian.

## Obecna architektura

Pętla uruchamiania osadzonego agenta rozwiązuje skonfigurowany silnik kontekstu raz na uruchomienie przed
wyborem konkretnej wiązki niskiego poziomu:

- `src/agents/pi-embedded-runner/run.ts`
  - inicjalizuje Pluginy silnika kontekstu
  - wywołuje `resolveContextEngine(params.config)`
  - przekazuje `contextEngine` i `contextTokenBudget` do
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` deleguje do wybranej wiązki agenta:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Wiązka app-server Codex jest rejestrowana przez dołączony Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementacja wiązki Codex otrzymuje te same `EmbeddedRunAttemptParams` co próby oparte na PI:

- `extensions/codex/src/app-server/run-attempt.ts`

To oznacza, że wymagany punkt zaczepienia znajduje się w kodzie kontrolowanym przez OpenClaw. Zewnętrzną
granicą jest sam protokół app-server Codex: OpenClaw może kontrolować to, co
wysyła do `thread/start`, `thread/resume` i `turn/start`, oraz może obserwować
powiadomienia, ale nie może zmieniać wewnętrznego magazynu wątków ani natywnego kompaktora Codex.

## Obecna luka

Osadzone próby PI wywołują cykl życia silnika kontekstu bezpośrednio:

- bootstrap/utrzymanie przed próbą
- assemble przed wywołaniem modelu
- afterTurn albo ingest po próbie
- utrzymanie po pomyślnej turze
- Compaction silnika kontekstu dla silników, które zarządzają Compaction

Odpowiedni kod PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Próby app-server Codex obecnie uruchamiają ogólne haki wiązki agenta i odzwierciedlają
transkrypt, ale nie wywołują `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ani
`params.contextEngine.maintain`.

Odpowiedni kod Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Pożądane zachowanie

Dla tur wiązki Codex OpenClaw powinien zachować ten cykl życia:

1. Odczytać odzwierciedlony transkrypt sesji OpenClaw.
2. Zbootstrapować aktywny silnik kontekstu, gdy istnieje plik poprzedniej sesji.
3. Uruchomić utrzymanie bootstrap, jeśli jest dostępne.
4. Złożyć kontekst przy użyciu aktywnego silnika kontekstu.
5. Przekształcić złożony kontekst w dane wejściowe zgodne z Codex.
6. Uruchomić albo wznowić wątek Codex z instrukcjami deweloperskimi zawierającymi
   dowolne `systemPromptAddition` silnika kontekstu.
7. Rozpocząć turę Codex ze złożonym promptem widocznym dla użytkownika.
8. Odzwierciedlić wynik Codex z powrotem do transkryptu OpenClaw.
9. Wywołać `afterTurn`, jeśli jest zaimplementowane, w przeciwnym razie `ingestBatch`/`ingest`, używając
   snapshotu odzwierciedlonego transkryptu.
10. Uruchomić utrzymanie tury po pomyślnych, nieprzerwanych turach.
11. Zachować natywne sygnały Compaction Codex i haki Compaction OpenClaw.

## Ograniczenia projektowe

### App-server Codex pozostaje źródłem kanonicznym dla natywnego stanu wątku

Codex zarządza swoim natywnym wątkiem i wszelką wewnętrzną rozszerzoną historią. OpenClaw
nie powinien próbować mutować wewnętrznej historii app-server poza obsługiwanymi
wywołaniami protokołu.

Odzwierciedlony transkrypt OpenClaw pozostaje źródłem dla funkcji OpenClaw:

- historia czatu
- wyszukiwanie
- księgowość `/new` i `/reset`
- przyszłe przełączanie modelu albo wiązki
- stan Plugin silnika kontekstu

### Składanie silnika kontekstu musi być rzutowane na dane wejściowe Codex

Interfejs silnika kontekstu zwraca `AgentMessage[]` OpenClaw, a nie łatkę wątku Codex.
`turn/start` app-server Codex akceptuje bieżące wejście użytkownika, podczas gdy
`thread/start` i `thread/resume` akceptują instrukcje deweloperskie.

Dlatego implementacja potrzebuje warstwy projekcji. Bezpieczna pierwsza wersja
powinna unikać udawania, że może zastąpić wewnętrzną historię Codex. Powinna
wstrzykiwać złożony kontekst jako deterministyczny materiał promptu/instrukcji deweloperskich
wokół bieżącej tury.

### Stabilność prompt-cache ma znaczenie

Dla silników takich jak lossless-claw złożony kontekst powinien być deterministyczny
przy niezmienionych danych wejściowych. Nie dodawaj znaczników czasu, losowych ID ani
niedeterministycznego porządku do generowanego tekstu kontekstu.

### Semantyka fallback PI nie zmienia się

Wybór wiązki pozostaje bez zmian:

- `runtime: "pi"` wymusza PI
- `runtime: "codex"` wybiera zarejestrowaną wiązkę Codex
- `runtime: "auto"` pozwala wiązkom Plugin przejmować obsługę wspieranych dostawców
- `fallback: "none"` wyłącza fallback PI, gdy żadna wiązka Plugin nie pasuje

Ta praca zmienia to, co dzieje się po wybraniu wiązki Codex.

## Plan implementacji

### 1. Wyeksportować albo przenieść wielokrotnego użytku pomocników prób silnika kontekstu

Dziś pomocniki cyklu życia wielokrotnego użytku znajdują się pod runnerem PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex nie powinien importować ze ścieżki implementacyjnej, której nazwa sugeruje PI,
jeśli da się tego uniknąć.

Utwórz moduł neutralny względem wiązki, na przykład:

- `src/agents/harness/context-engine-lifecycle.ts`

Przenieś albo wyeksportuj ponownie:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- mały wrapper wokół `runContextEngineMaintenance`

Zachowaj działanie importów PI przez ponowny eksport ze starych plików albo przez aktualizację miejsc wywołania PI w tym samym PR.

Neutralne nazwy pomocników nie powinny wspominać o PI.

Sugerowane nazwy:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Dodać pomocnika projekcji kontekstu Codex

Dodaj nowy moduł:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Odpowiedzialności:

- Przyjmować złożone `AgentMessage[]`, oryginalną odzwierciedloną historię i bieżący
  prompt.
- Określać, który kontekst należy do instrukcji deweloperskich, a który do bieżącego
  wejścia użytkownika.
- Zachować bieżący prompt użytkownika jako końcowe, wykonywalne żądanie.
- Renderować wcześniejsze wiadomości w stabilnym, jawnym formacie.
- Unikać zmiennych metadanych.

Proponowane API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Zalecana pierwsza projekcja:

- Umieść `systemPromptAddition` w instrukcjach deweloperskich.
- Umieść złożony kontekst transkryptu przed bieżącym promptem w `promptText`.
- Oznacz go wyraźnie jako złożony kontekst OpenClaw.
- Zachowaj bieżący prompt na końcu.
- Wyklucz zduplikowany bieżący prompt użytkownika, jeśli już pojawia się na końcu.

Przykładowy kształt promptu:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

To jest mniej eleganckie niż natywna chirurgia historii Codex, ale da się to zaimplementować
wewnątrz OpenClaw i zachowuje semantykę silnika kontekstu.

Przyszłe ulepszenie: jeśli app-server Codex udostępni protokół do zastępowania albo
uzupełniania historii wątku, zamień tę warstwę projekcji tak, aby używała tego API.

### 3. Podłączyć bootstrap przed uruchomieniem wątku Codex

W `extensions/codex/src/app-server/run-attempt.ts`:

- Odczytaj odzwierciedloną historię sesji tak jak obecnie.
- Ustal, czy plik sesji istniał przed tym uruchomieniem. Preferuj pomocnika,
  który sprawdza `fs.stat(params.sessionFile)` przed zapisami mirror.
- Otwórz `SessionManager` albo użyj wąskiego adaptera menedżera sesji, jeśli pomocnik tego wymaga.
- Wywołaj neutralny pomocnik bootstrap, gdy istnieje `params.contextEngine`.

Przepływ pseudo-kodu:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Użyj tej samej konwencji `sessionKey` co most narzędzi Codex i mirror transkryptu. Dziś Codex oblicza `sandboxSessionKey` z `params.sessionKey` albo `params.sessionId`; używaj tego konsekwentnie, chyba że istnieje powód, by zachować surowe `params.sessionKey`.

### 4. Podłączyć assemble przed `thread/start` / `thread/resume` i `turn/start`

W `runCodexAppServerAttempt`:

1. Najpierw zbuduj dynamiczne narzędzia, aby silnik kontekstu widział rzeczywiste dostępne nazwy narzędzi.
2. Odczytaj odzwierciedloną historię sesji.
3. Uruchom `assemble(...)` silnika kontekstu, gdy istnieje `params.contextEngine`.
4. Rzutuj złożony wynik na:
   - dodatek do instrukcji deweloperskich
   - tekst promptu dla `turn/start`

Istniejące wywołanie haka:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

powinno stać się świadome kontekstu:

1. oblicz bazowe instrukcje deweloperskie przez `buildDeveloperInstructions(params)`
2. zastosuj składanie/projekcję silnika kontekstu
3. uruchom `before_prompt_build` z rzutowanym promptem/instrukcjami deweloperskimi

Taka kolejność pozwala ogólnym hakom promptu zobaczyć ten sam prompt, który otrzyma Codex. Jeśli
potrzebujemy ścisłej zgodności z PI, uruchom składanie silnika kontekstu przed kompozycją hooków,
ponieważ PI stosuje `systemPromptAddition` silnika kontekstu do końcowego promptu systemowego po swoim
potoku promptu. Ważną niezmienną jest to, że zarówno silnik kontekstu, jak i haki dostają
deterministyczną, udokumentowaną kolejność.

Zalecana kolejność dla pierwszej implementacji:

1. `buildDeveloperInstructions(params)`
2. `assemble()` silnika kontekstu
3. dołącz na początku/końcu `systemPromptAddition` do instrukcji deweloperskich
4. rzutuj złożone wiadomości do tekstu promptu
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. przekaż końcowe instrukcje deweloperskie do `startOrResumeThread(...)`
7. przekaż końcowy tekst promptu do `buildTurnStartParams(...)`

Specyfikacja powinna zostać zakodowana w testach, aby przyszłe zmiany nie zmieniły kolejności przypadkiem.

### 5. Zachować stabilne formatowanie prompt-cache

Pomocnik projekcji musi tworzyć bajtowo stabilne dane wyjściowe dla identycznych wejść:

- stabilna kolejność wiadomości
- stabilne etykiety ról
- brak generowanych znaczników czasu
- brak przecieków kolejności kluczy obiektu
- brak losowych ograniczników
- brak ID per uruchomienie

Używaj stałych ograniczników i jawnych sekcji.

### 6. Podłączyć przetwarzanie po turze po odzwierciedleniu transkryptu

`CodexAppServerEventProjector` w Codex buduje lokalny `messagesSnapshot` dla
bieżącej tury. `mirrorTranscriptBestEffort(...)` zapisuje ten snapshot do
odzwierciedlenia transkryptu OpenClaw.

Po pomyślnym albo nieudanym odzwierciedleniu wywołaj finalizator silnika kontekstu z
najlepszym dostępnym snapshotem wiadomości:

- Preferuj pełny odzwierciedlony kontekst sesji po zapisie, ponieważ `afterTurn`
  oczekuje snapshotu sesji, a nie tylko bieżącej tury.
- Wracaj do `historyMessages + result.messagesSnapshot`, jeśli nie można ponownie otworzyć
  pliku sesji.

Przepływ pseudo-kodu:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Jeśli odzwierciedlenie się nie powiedzie, nadal wywołaj `afterTurn` ze snapshotem zapasowym, ale zaloguj,
że silnik kontekstu przetwarza ingest z zapasowych danych tury.

### 7. Znormalizować usage i runtime context prompt-cache

Wyniki Codex zawierają znormalizowane usage z powiadomień tokenów app-server, gdy
są dostępne. Przekaż to usage do runtime context silnika kontekstu.

Jeśli app-server Codex w przyszłości ujawni szczegóły odczytu/zapisu cache, odwzoruj je do
`ContextEnginePromptCacheInfo`. Do tego czasu pomijaj `promptCache`, zamiast wymyślać zera.

### 8. Zasady Compaction

Istnieją dwa systemy Compaction:

1. `compact()` silnika kontekstu OpenClaw
2. natywne `thread/compact/start` app-server Codex

Nie utożsamiaj ich po cichu.

#### `/compact` i jawny Compaction OpenClaw

Gdy wybrany silnik kontekstu ma `info.ownsCompaction === true`, jawny
Compaction OpenClaw powinien preferować wynik `compact()` silnika kontekstu dla
odzwierciedlenia transkryptu OpenClaw i stanu Plugin.

Gdy wybrana wiązka Codex ma natywne powiązanie wątku, możemy dodatkowo
zażądać natywnego Compaction Codex, aby utrzymać zdrowie wątku app-server, ale
musi to być raportowane jako osobne działanie backendu w szczegółach.

Zalecane zachowanie:

- Jeśli `contextEngine.info.ownsCompaction === true`:
  - najpierw wywołaj `compact()` silnika kontekstu
  - następnie spróbuj best-effort wywołać natywny Compaction Codex, gdy istnieje powiązanie wątku
  - zwróć wynik silnika kontekstu jako wynik główny
  - uwzględnij stan natywnego Compaction Codex w `details.codexNativeCompaction`
- Jeśli aktywny silnik kontekstu nie zarządza Compaction:
  - zachowaj bieżące natywne zachowanie Compaction Codex

Prawdopodobnie wymaga to zmiany `extensions/codex/src/app-server/compact.ts` albo
opakowania go z ogólnej ścieżki Compaction, zależnie od tego, gdzie
wywoływane jest `maybeCompactAgentHarnessSession(...)`.

#### Natywne zdarzenia `contextCompaction` Codex w trakcie tury

Codex może emitować zdarzenia elementów `contextCompaction` podczas tury. Zachowaj bieżącą emisję hooków
before/after compaction w `event-projector.ts`, ale nie traktuj tego jako
zakończonego Compaction silnika kontekstu.

Dla silników, które zarządzają Compaction, emituj jawną diagnostykę, gdy Codex mimo to wykonuje
natywny Compaction:

- nazwa strumienia/zdarzenia: istniejący strumień `compaction` jest akceptowalny
- szczegóły: `{ backend: "codex-app-server", ownsCompaction: true }`

Dzięki temu podział pozostaje audytowalny.

### 9. Zachowanie resetowania sesji i powiązań

Istniejące `reset(...)` wiązki Codex czyści powiązanie app-server Codex z
pliku sesji OpenClaw. Zachowaj to zachowanie.

Upewnij się też, że czyszczenie stanu silnika kontekstu nadal odbywa się przez istniejące
ścieżki cyklu życia sesji OpenClaw. Nie dodawaj czyszczenia specyficznego dla Codex, chyba że
cykl życia silnika kontekstu obecnie pomija zdarzenia resetowania/usuwania dla wszystkich wiązek.

### 10. Obsługa błędów

Stosuj semantykę PI:

- błędy bootstrap generują ostrzeżenie i kontynuują
- błędy assemble generują ostrzeżenie i wracają do niezłożonych wiadomości/promptu potoku
- błędy afterTurn/ingest generują ostrzeżenie i oznaczają finalizację po turze jako nieudaną
- utrzymanie działa tylko po pomyślnych, nieprzerwanych turach bez yield
- błędy Compaction nie powinny być ponawiane jako świeże prompty

Dodatki specyficzne dla Codex:

- Jeśli projekcja kontekstu się nie powiedzie, wygeneruj ostrzeżenie i wróć do oryginalnego promptu.
- Jeśli odzwierciedlenie transkryptu się nie powiedzie, nadal spróbuj finalizacji silnika kontekstu z
  wiadomościami zapasowymi.
- Jeśli natywny Compaction Codex się nie powiedzie po pomyślnym Compaction silnika kontekstu,
  nie psuj całego Compaction OpenClaw, gdy silnik kontekstu jest główny.

## Plan testów

### Testy jednostkowe

Dodaj testy pod `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex wywołuje `bootstrap`, gdy istnieje plik sesji.
   - Codex wywołuje `assemble` z odzwierciedlonymi wiadomościami, budżetem tokenów, nazwami narzędzi,
     trybem cytowań, ID modelu i promptem.
   - `systemPromptAddition` jest uwzględniane w instrukcjach deweloperskich.
   - Złożone wiadomości są rzutowane do promptu przed bieżącym żądaniem.
   - Codex wywołuje `afterTurn` po odzwierciedleniu transkryptu.
   - Bez `afterTurn` Codex wywołuje `ingestBatch` albo `ingest` per wiadomość.
   - Utrzymanie tury działa po pomyślnych turach.
   - Utrzymanie tury nie działa przy błędzie promptu, przerwaniu albo przerwaniu yield.

2. `context-engine-projection.test.ts`
   - stabilne dane wyjściowe dla identycznych wejść
   - brak duplikatu bieżącego promptu, gdy złożona historia go zawiera
   - obsługa pustej historii
   - zachowanie kolejności ról
   - uwzględnianie dodatku promptu systemowego tylko w instrukcjach deweloperskich

3. `compact.context-engine.test.ts`
   - główny wynik należącego do silnika kontekstu wygrywa
   - stan natywnego Compaction Codex pojawia się w szczegółach, gdy także podjęto próbę
   - natywna awaria Codex nie psuje Compaction należącego do silnika kontekstu
   - silnik kontekstu bez ownsCompaction zachowuje bieżące natywne zachowanie Compaction

### Istniejące testy do aktualizacji

- `extensions/codex/src/app-server/run-attempt.test.ts`, jeśli istnieje, w przeciwnym razie
  najbliższe testy uruchomień app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` tylko jeśli szczegóły zdarzeń
  Compaction się zmienią.
- `src/agents/harness/selection.test.ts` nie powinien wymagać zmian, chyba że zmieni się
  zachowanie config; powinien pozostać stabilny.
- Testy silnika kontekstu PI powinny nadal przechodzić bez zmian.

### Testy integracyjne / live

Dodaj albo rozszerz testy smoke wiązki live Codex:

- skonfiguruj `plugins.slots.contextEngine` na silnik testowy
- skonfiguruj `agents.defaults.model` na model `codex/*`
- skonfiguruj `agents.defaults.embeddedHarness.runtime = "codex"`
- potwierdź, że silnik testowy zaobserwował:
  - bootstrap
  - assemble
  - afterTurn albo ingest
  - utrzymanie

Unikaj wymagania lossless-claw w testach core OpenClaw. Użyj małego
fałszywego Plugin silnika kontekstu w repo.

## Obserwowalność

Dodaj logi debug wokół wywołań cyklu życia silnika kontekstu Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` z powodem
- `codex native compaction completed alongside context-engine compaction`

Unikaj logowania pełnych promptów albo zawartości transkryptu.

Tam, gdzie to przydatne, dodaj pola strukturalne:

- `sessionId`
- `sessionKey` zredagowany albo pominięty zgodnie z istniejącą praktyką logowania
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migracja / zgodność

To powinno być zgodne wstecz:

- Jeśli nie skonfigurowano silnika kontekstu, zachowanie starszego silnika kontekstu powinno być
  równoważne dzisiejszemu zachowaniu wiązki Codex.
- Jeśli `assemble` silnika kontekstu się nie powiedzie, Codex powinien kontynuować z oryginalną
  ścieżką promptu.
- Istniejące powiązania wątków Codex powinny pozostać prawidłowe.
- Odcisk palca dynamicznych narzędzi nie powinien zawierać danych wyjściowych silnika kontekstu; w przeciwnym razie
  każda zmiana kontekstu mogłaby wymuszać nowy wątek Codex. Tylko katalog narzędzi
  powinien wpływać na odcisk palca dynamicznych narzędzi.

## Otwarte pytania

1. Czy złożony kontekst powinien być wstrzykiwany w całości do promptu użytkownika, w całości
   do instrukcji deweloperskich, czy podzielony?

   Zalecenie: podzielony. Umieść `systemPromptAddition` w instrukcjach deweloperskich;
   umieść złożony kontekst transkryptu w wrapperze promptu użytkownika. To najlepiej pasuje
   do obecnego protokołu Codex bez mutowania natywnej historii wątku.

2. Czy natywny Compaction Codex powinien być wyłączony, gdy silnik kontekstu zarządza
   Compaction?

   Zalecenie: nie, przynajmniej na początku. Natywny Compaction Codex może nadal być
   konieczny do utrzymania wątku app-server przy życiu. Musi jednak być raportowany jako
   natywny Compaction Codex, a nie jako Compaction silnika kontekstu.

3. Czy `before_prompt_build` powinno działać przed czy po składaniu silnika kontekstu?

   Zalecenie: po projekcji silnika kontekstu dla Codex, aby ogólne haki wiązki
   widziały rzeczywisty prompt/instrukcje deweloperskie, które otrzyma Codex. Jeśli zgodność z PI
   wymaga odwrotnej kolejności, zakoduj wybraną kolejność w testach i udokumentuj ją
   tutaj.

4. Czy app-server Codex może przyjąć przyszłe ustrukturyzowane nadpisanie kontekstu/historii?

   Nie wiadomo. Jeśli tak, zastąp warstwę projekcji tekstu tym protokołem i
   pozostaw wywołania cyklu życia bez zmian.

## Kryteria akceptacji

- Tura osadzonej wiązki `codex/*` wywołuje cykl życia assemble wybranego silnika kontekstu.
- `systemPromptAddition` silnika kontekstu wpływa na instrukcje deweloperskie Codex.
- Złożony kontekst wpływa deterministycznie na dane wejściowe tury Codex.
- Pomyślne tury Codex wywołują `afterTurn` albo zapasowy ingest.
- Pomyślne tury Codex uruchamiają utrzymanie tury silnika kontekstu.
- Nieudane/przerwane/przerwane przez yield tury nie uruchamiają utrzymania tury.
- Compaction zarządzany przez silnik kontekstu pozostaje główny dla stanu OpenClaw/Plugin.
- Natywny Compaction Codex pozostaje audytowalny jako natywne zachowanie Codex.
- Istniejące zachowanie silnika kontekstu PI nie zmienia się.
- Istniejące zachowanie wiązki Codex nie zmienia się, gdy nie wybrano żadnego silnika kontekstu innego niż legacy
  albo gdy assemble się nie powiedzie.
