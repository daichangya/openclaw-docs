---
read_when:
    - Uruchamiasz coding harnesses przez ACP
    - Konfigurujesz sesje ACP powiązane z rozmową na kanałach wiadomości
    - Powiązujesz rozmowę na kanale wiadomości z trwałą sesją ACP
    - Rozwiązujesz problemy z backendem ACP i połączeniami pluginów
    - Obsługujesz polecenia /acp z czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harness
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-08T02:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71c7c0cdae5247aefef17a0029360950a1c2987ddcee21a1bb7d78c67da52950
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenci ACP

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne coding harnesses (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnesses ACPX) przez plugin backendu ACP.

Jeśli poprosisz OpenClaw zwykłym językiem, aby „uruchomił to w Codex” albo „uruchomił Claude Code w wątku”, OpenClaw powinien skierować to żądanie do runtime ACP (a nie do natywnego runtime podagentów). Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex lub Claude Code połączyły się bezpośrednio jako zewnętrzny klient MCP
z istniejącymi rozmowami kanałowymi OpenClaw, użyj
[`openclaw mcp serve`](/cli/mcp) zamiast ACP.

## Którą stronę chcę?

Są tu trzy powiązane powierzchnie, które łatwo pomylić:

| Chcesz... | Użyj tego | Uwagi |
| --- | --- | --- |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: agenci ACP | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta | [`openclaw acp`](/cli/acp) | Tryb mostka. IDE/klient mówi ACP do OpenClaw przez stdio/WebSocket |
| Użyć lokalnego AI CLI ponownie jako tekstowego modelu zapasowego | [CLI Backends](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak runtime harness |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje są teraz dostarczane z włączonym domyślnie dołączonym pluginem runtime `acpx`.
- Dołączony plugin `acpx` preferuje własny, przypięty binarny plik `acpx`.
- Przy uruchomieniu OpenClaw sonduje ten plik binarny i w razie potrzeby sam go naprawia.
- Zacznij od `/acp doctor`, jeśli chcesz przeprowadzić szybki test gotowości.

Co nadal może się zdarzyć przy pierwszym użyciu:

- Adapter docelowego harness może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harness.
- Uwierzytelnienie dostawcy nadal musi istnieć na hoście dla tego harness.
- Jeśli host nie ma dostępu do npm/sieci, pobrania adapterów przy pierwszym uruchomieniu mogą się nie powieść, dopóki pamięci podręczne nie zostaną rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do bootstrapowania `acpx`, ale adapter ACP Codex może nadal wymagać pobrania przy pierwszym uruchomieniu.
- `/acp spawn claude`: podobnie w przypadku adaptera ACP Claude oraz uwierzytelnienia po stronie Claude na tym hoście.

## Szybki przepływ operatora

Użyj tego, gdy chcesz praktycznego poradnika do `/acp`:

1. Uruchom sesję:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Pracuj w powiązanej rozmowie lub wątku (albo wskaż jawnie ten klucz sesji).
3. Sprawdź stan runtime:
   - `/acp status`
4. Dostosuj opcje runtime w razie potrzeby:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Skieruj aktywną sesję bez zastępowania kontekstu:
   - `/acp steer tighten logging and continue`
6. Zatrzymaj pracę:
   - `/acp cancel` (zatrzymaj bieżącą turę), albo
   - `/acp close` (zamknij sesję i usuń powiązania)

## Szybki start dla ludzi

Przykłady naturalnych próśb:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom trwałą sesję Codex w wątku tutaj i utrzymuj jej fokus.”
- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i zachowaj kolejne wiadomości w tym samym obszarze roboczym.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem zachowaj kolejne wiadomości w tym samym wątku.”

Co OpenClaw powinien zrobić:

1. Wybrać `runtime: "acp"`.
2. Rozpoznać żądany cel harness (`agentId`, na przykład `codex`).
3. Jeśli zażądano powiązania z bieżącą rozmową i aktywny kanał to obsługuje, powiązać sesję ACP z tą rozmową.
4. W przeciwnym razie, jeśli zażądano powiązania z wątkiem i bieżący kanał to obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować kolejne wiadomości w powiązaniu do tej samej sesji ACP, dopóki nie zostanie odfokusowana/zamknięta/wygaśnie.

## ACP a podagenci

Używaj ACP, gdy chcesz zewnętrznego runtime harness. Używaj podagentów, gdy chcesz delegowanych uruchomień natywnych dla OpenClaw.

| Obszar | Sesja ACP | Uruchomienie podagenta |
| --- | --- | --- |
| Runtime | Plugin backendu ACP (na przykład acpx) | Natywny runtime podagentów OpenClaw |
| Klucz sesji | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Główne polecenia | `/acp ...` | `/subagents ...` |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Sub-agents](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

W przypadku Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesjami ACP OpenClaw
2. dołączony plugin runtime `acpx`
3. adapter Claude ACP
4. mechanizm runtime/sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harness z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem z rozmową/wątkiem.
- CLI backends to oddzielne tekstowe lokalne runtime zapasowe. Zobacz [CLI Backends](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesje możliwe do powiązania, kontrolki runtime albo trwałą pracę harness: użyj ACP
- chcesz prosty lokalny fallback tekstowy przez surowe CLI: użyj CLI backends

## Powiązane sesje

### Powiązania z bieżącą rozmową

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca rozmowa stała się trwałym obszarem roboczym ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal zarządza transportem kanału, auth, bezpieczeństwem i dostarczaniem.
- Bieżąca rozmowa jest przypinana do uruchomionego klucza sesji ACP.
- Kolejne wiadomości w tej rozmowie są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję i usuwa powiązanie bieżącej rozmowy.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` nadal może utworzyć nową sesję ACP, jeśli uruchamiasz nową pracę.
- `--bind here` sam z siebie nie tworzy podrzędnego wątku Discord ani tematu Telegram.
- Runtime ACP nadal może mieć własny katalog roboczy (`cwd`) albo obszar roboczy zarządzany przez backend na dysku. Ten obszar roboczy runtime jest oddzielny od powierzchni czatu i nie oznacza nowego wątku wiadomości.
- Jeśli uruchamiasz do innego agenta ACP i nie podajesz `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **docelowego agenta**, a nie żądającego.
- Jeśli ta odziedziczona ścieżka obszaru roboczego nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw wraca do domyślnego `cwd` backendu zamiast po cichu ponownie użyć niewłaściwego drzewa.
- Jeśli odziedziczony obszar roboczy istnieje, ale nie można uzyskać do niego dostępu (na przykład `EACCES`), uruchomienie zwraca rzeczywisty błąd dostępu zamiast porzucać `cwd`.

Model mentalny:

- powierzchnia czatu: gdzie ludzie nadal rozmawiają (`kanał Discord`, `temat Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego OpenClaw kieruje wiadomości
- podrzędny wątek/temat: opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`
- obszar roboczy runtime: lokalizacja w systemie plików, w której działa harness (`cwd`, checkout repozytorium, obszar roboczy backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, uruchom lub dołącz sesję Codex ACP i kieruj do niej przyszłe wiadomości stąd
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/temat i tam powiązać sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: to samo powiązanie czatu co wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązań z bieżącą rozmową:

- Kanały czatu/wiadomości, które ogłaszają obsługę powiązania z bieżącą rozmową, mogą używać `--bind here` przez współdzieloną ścieżkę powiązań rozmów.
- Kanały z niestandardową semantyką wątków/tematów nadal mogą zapewniać kanoniczność specyficzną dla kanału za tym samym współdzielonym interfejsem.
- `--bind here` zawsze oznacza „powiąż bieżącą rozmowę na miejscu”.
- Ogólne powiązania z bieżącą rozmową używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek na miejscu. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia powiązań ACP z bieżącą rozmową, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania o „nową sesję” dotyczą sesji ACP, a nie kanału. Możesz ponownie użyć albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla adaptera kanału, sesje ACP mogą być powiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Wynik ACP jest dostarczany z powrotem do tego samego wątku.
- Odfokusowanie/zamknięcie/archiwizacja/wygaśnięcie limitu bezczynności lub maksymalnego wieku usuwa powiązanie.

Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat, że funkcja jest nieobsługiwana/niedostępna.

Wymagane feature flags dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga uruchamiania wątków ACP adaptera kanału (zależna od adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Dowolny adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
- Bieżąca wbudowana obsługa:
  - wątki/kanały Discord
  - tematy Telegram (tematy forum w grupach/supergrupach i tematy DM)
- Kanały pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

W przypadku nieefemerycznych przepływów pracy skonfiguruj trwałe powiązania ACP w wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie rozmowy ACP.
- `bindings[].match` identyfikuje docelową rozmowę:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Dla stabilnych powiązań grup preferuj `chat_id:*` lub `chat_identifier:*`.
  - czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Dla stabilnych powiązań grup preferuj `chat_id:*`.
- `bindings[].agentId` to identyfikator właścicielskiego agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia runtime na agenta

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harness, na przykład `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Kolejność pierwszeństwa nadpisań dla powiązanych sesji ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globalne ustawienia domyślne ACP (na przykład `acp.backend`)

Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Zachowanie:

- OpenClaw zapewnia istnienie skonfigurowanej sesji ACP przed użyciem.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP na miejscu.
- Tymczasowe powiązania runtime (na przykład utworzone przez przepływy fokusu wątków) nadal mają zastosowanie tam, gdzie istnieją.
- Przy uruchamianiu ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy obszar roboczy docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego wracają do domyślnego `cwd` backendu; rzeczywiste błędy dostępu są zwracane jako błędy uruchomienia.

## Uruchamianie sesji ACP (interfejsy)

### Z `sessions_spawn`

Użyj `runtime: "acp"`, aby uruchomić sesję ACP z tury agenta lub wywołania narzędzia.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Uwagi:

- `runtime` domyślnie ma wartość `subagent`, więc ustaw `runtime: "acp"` jawnie dla sesji ACP.
- Jeśli pominięto `agentId`, OpenClaw użyje `acp.defaultAgent`, jeśli jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby zachować trwałą powiązaną rozmowę.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harness ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawiony.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem, gdy jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) albo `session` (trwałe).
  - domyślnie jest `run`
  - jeśli `thread: true` i `mode` pominięto, OpenClaw może domyślnie przejść do zachowania trwałego zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime). Jeśli pominięty, uruchomienie ACP dziedziczy obszar roboczy docelowego agenta, gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają do domyślnych backendu, a rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora używana w tekście sesji/banera.
- `resumeSessionId` (opcjonalne): wznowienie istniejącej sesji ACP zamiast tworzenia nowej. Agent odtwarza historię rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy dostępne, zaakceptowane odpowiedzi zawierają `streamLogPath`, wskazujące na plik JSONL logu o zakresie sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby zobaczyć pełną historię przekazywania.

### Wznowienie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast zaczynać od nowa. Agent odtwarza historię rozmowy przez `session/load`, więc wznawia pracę z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe przypadki użycia:

- Przekazanie sesji Codex z laptopa na telefon — poproś agenta, aby podjął pracę tam, gdzie skończyłeś
- Kontynuowanie sesji programistycznej rozpoczętej interaktywnie w CLI, teraz bezgłowo przez agenta
- Wznowienie pracy przerwanej przez restart gateway albo timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime podagenta.
- `resumeSessionId` przywraca historię rozmowy upstream ACP; `thread` i `mode` nadal stosują się normalnie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code to obsługują).
- Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jawnym błędem — bez cichego przejścia do nowej sesji.

### Smoke test operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybko na żywo sprawdzić, czy uruchamianie ACP naprawdę działa end-to-end, a nie tylko przechodzi testy jednostkowe.

Zalecana bramka:

1. Zweryfikuj wdrożoną wersję/commit gateway na hoście docelowym.
2. Potwierdź, że wdrożone źródło zawiera akceptację linii ACP w
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Otwórz tymczasową sesję mostka ACPX do aktywnego agenta (na przykład
   `razor(main)` na `jpclawhq`).
4. Poproś tego agenta o wywołanie `sessions_spawn` z:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent zgłasza:
   - `accepted=yes`
   - rzeczywisty `childSessionKey`
   - brak błędu walidatora
6. Posprzątaj tymczasową sesję mostka ACPX.

Przykładowy prompt do aktywnego agenta:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Trzymaj ten smoke test w `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  możliwości żądającego/sesji i jest osobnym testem integracyjnym.
- Traktuj testowanie `mode: "session"` powiązanego z wątkiem jako drugi, bogatszy przebieg integracyjny
  z rzeczywistego wątku Discord albo tematu Telegram.

## Zgodność z sandbox

Sesje ACP obecnie działają w runtime hosta, a nie wewnątrz sandbox OpenClaw.

Obecne ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Używaj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn`, gdy potrzebujesz jawnej kontroli operatora z czatu.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Kluczowe flagi:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Zobacz [Slash Commands](/pl/tools/slash-commands).

## Rozpoznawanie celu sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` albo `session-label`).

Kolejność rozpoznawania:

1. Jawny argument celu (albo `--session` dla `/acp steer`)
   - próbuje najpierw klucza
   - potem identyfikatora sesji w formacie UUID
   - potem etykiety
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP)
3. Powrót do bieżącej sesji żądającej

Powiązania z bieżącą rozmową i powiązania wątków biorą udział w kroku 2.

Jeśli nie uda się rozpoznać żadnego celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązania przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb | Zachowanie |
| --- | --- |
| `here` | Powiąż bieżącą aktywną rozmowę na miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
| `off` | Nie twórz powiązania z bieżącą rozmową. |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „niech ten kanał lub czat będzie obsługiwany przez Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania z bieżącą rozmową.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb | Zachowanie |
| --- | --- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek, jeśli jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku. |
| `off` | Brak powiązania. Sesja uruchamia się bez powiązania. |

Uwagi:

- Na powierzchniach bez obsługi powiązań wątków domyślne zachowanie jest w praktyce równe `off`.
- Uruchamianie powiązane z wątkiem wymaga obsługi polityki kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, jeśli chcesz przypiąć bieżącą rozmowę bez tworzenia podrzędnego wątku.

## Kontrolki ACP

Dostępna rodzina poleceń:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` pokazuje efektywne opcje runtime i, gdy są dostępne, identyfikatory sesji zarówno na poziomie runtime, jak i backendu.

Niektóre kontrolki zależą od możliwości backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca jasny błąd nieobsługiwanej kontrolki.

## Książka kucharska poleceń ACP

| Polecenie | Co robi | Przykład |
| --- | --- | --- |
| `/acp spawn` | Tworzy sesję ACP; opcjonalnie powiązanie z bieżącą rozmową albo z wątkiem. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Anuluje turę będącą w toku dla docelowej sesji. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Wysyła instrukcję sterującą do uruchomionej sesji. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Zamyka sesję i odpina cele wątków. | `/acp close` |
| `/acp status` | Pokazuje backend, tryb, stan, opcje runtime, możliwości. | `/acp status` |
| `/acp set-mode` | Ustawia tryb runtime dla docelowej sesji. | `/acp set-mode plan` |
| `/acp set` | Ogólny zapis opcji konfiguracji runtime. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Ustawia nadpisanie katalogu roboczego runtime. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Ustawia profil polityki zatwierdzeń. | `/acp permissions strict` |
| `/acp timeout` | Ustawia limit czasu runtime (sekundy). | `/acp timeout 120` |
| `/acp model` | Ustawia nadpisanie modelu runtime. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji. | `/acp reset-options` |
| `/acp sessions` | Wyświetla ostatnie sesje ACP z magazynu. | `/acp sessions` |
| `/acp doctor` | Stan backendu, możliwości, możliwe działania naprawcze. | `/acp doctor` |
| `/acp install` | Wyświetla deterministyczne kroki instalacji i włączenia. | `/acp install` |

`/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji albo sesji żądającej. Polecenia, które akceptują tokeny `session-key`, `session-id` albo `session-label`, rozpoznają cele przez wykrywanie sesji gateway, w tym niestandardowe katalogi `session.store` dla poszczególnych agentów.

## Mapowanie opcji runtime

`/acp` ma wygodne polecenia i generyczny setter.

Równoważne operacje:

- `/acp model <id>` mapuje do klucza konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje do klucza konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje do klucza konfiguracji runtime `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie `cwd` runtime.
- `/acp set <key> <value>` to ścieżka ogólna.
  - Przypadek specjalny: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania runtime dla docelowej sesji.

## Obsługa harness acpx (obecnie)

Bieżące wbudowane aliasy harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że konfiguracja acpx definiuje własne aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w swojej konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może również kierować żądania do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (a nie zwykłą ścieżką `agentId` w OpenClaw).

## Wymagana konfiguracja

Bazowa konfiguracja ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązania wątków zależy od adaptera kanału. Przykład dla Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą rozmową nie wymagają tworzenia podrzędnego wątku. Wymagają aktywnego kontekstu rozmowy i adaptera kanału, który udostępnia powiązania rozmów ACP.

Zobacz [Configuration Reference](/pl/gateway/configuration-reference).

## Konfiguracja pluginu dla backendu acpx

Świeże instalacje są dostarczane z włączonym domyślnie dołączonym pluginem runtime `acpx`, więc ACP zwykle działa bez ręcznego kroku instalacji pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout deweloperski, użyj jawnej ścieżki pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja obszaru roboczego podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie dołączony plugin backendu acpx (`acpx`) używa lokalnego dla pluginu przypiętego pliku binarnego:

1. Polecenie domyślnie wskazuje lokalny dla pluginu `node_modules/.bin/acpx` wewnątrz pakietu pluginu ACPX.
2. Oczekiwana wersja domyślnie jest zgodna z przypięciem rozszerzenia.
3. Przy uruchomieniu ACP backend jest rejestrowany od razu jako niegotowy.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalny dla pluginu plik binarny jest nieobecny albo ma niezgodną wersję, uruchamiane jest:
   `npm install --omit=dev --no-save acpx@<pinned>` i następuje ponowna weryfikacja.

Możesz nadpisać polecenie/wersję w konfiguracji pluginu:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Uwagi:

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną albo nazwę polecenia (`acpx`).
- Ścieżki względne są rozwiązywane względem katalogu obszaru roboczego OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje niestandardowy plik binarny/ścieżkę, automatyczna instalacja lokalna dla pluginu jest wyłączona.
- Uruchamianie OpenClaw pozostaje nieblokujące podczas działania sprawdzania stanu backendu w tle.

Zobacz [Plugins](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(binaria zależne od platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się
normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP dla narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają narzędzi rejestrowanych przez pluginy OpenClaw
harness ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex albo Claude Code, mogli wywoływać zainstalowane
narzędzia pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Zachowuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harness ACP.
- Agenci ACP otrzymują dostęp tylko do narzędzi pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym pluginom na wykonywanie działań
  w samym OpenClaw.
- Przejrzyj zainstalowane pluginy przed włączeniem tej funkcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi pluginów jest
dodatkową wygodną funkcją opt-in, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Konfiguracja limitu czasu runtime

Dołączony plugin `acpx` domyślnie ustawia 120-sekundowy
limit czasu dla osadzonych tur runtime. Daje to wolniejszym harnesses, takim jak Gemini CLI, dość czasu na ukończenie
uruchamiania i inicjalizacji ACP. Nadpisz tę wartość, jeśli host wymaga innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Uruchom ponownie gateway po zmianie tej wartości.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania promptów uprawnień zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracyjne kontrolujące sposób obsługi uprawnień:

Te uprawnienia harness ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag obejścia dostawcy backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` jest przełącznikiem awaryjnym na poziomie harness dla sesji ACP.

### `permissionMode`

Kontroluje, jakie operacje agent harness może wykonywać bez promptu.

| Wartość | Zachowanie |
| --- | --- |
| `approve-all` | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapis i exec wymagają promptów. |
| `deny-all` | Odrzuca wszystkie prompty uprawnień. |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy prompt uprawnień normalnie zostałby pokazany, ale nie ma dostępnego interaktywnego TTY (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie |
| --- | --- |
| `fail` | Przerywa sesję z `AcpRuntimeError`. **(domyślne)** |
| `deny` | Cicho odrzuca uprawnienie i kontynuuje (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Uruchom ponownie gateway po zmianie tych wartości.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła prompt uprawnień, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje ulegały łagodnej degradacji zamiast się wykrzaczać.

## Rozwiązywanie problemów

| Objaw | Prawdopodobna przyczyna | Poprawka |
| --- | --- | --- |
| `ACP runtime backend is not configured` | Brak pluginu backendu albo jest wyłączony. | Zainstaluj i włącz plugin backendu, a następnie uruchom `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP jest globalnie wyłączone. | Ustaw `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Dispatch z normalnych wiadomości w wątku jest wyłączony. | Ustaw `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy` | Agent nie znajduje się na liście dozwolonych. | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`. |
| `Unable to resolve session target: ...` | Nieprawidłowy token klucza/id/etykiety. | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` zostało użyte bez aktywnej rozmowy, którą można powiązać. | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania. |
| `Conversation bindings are unavailable for <channel>.` | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową. | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj wpisy najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` zostało użyte poza kontekstem wątku. | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Inny użytkownik jest właścicielem aktywnego celu powiązania. | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku. |
| `Thread bindings are unavailable for <channel>.` | Adapter nie ma możliwości powiązania wątków. | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | Runtime ACP działa po stronie hosta; sesja żądająca jest sandboxowana. | Użyj `runtime="subagent"` z sesji sandboxowanych albo uruchamiaj ACP z sesji niesandboxowanej. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | Zażądano `sandbox="require"` dla runtime ACP. | Użyj `runtime="subagent"` dla wymaganego sandboxowania albo użyj ACP z `sandbox="inherit"` z niesandboxowanej sesji. |
| Brak metadanych ACP dla powiązanej sesji | Nieaktualne/usunięte metadane sesji ACP. | Odtwórz je przez `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP. | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](#konfiguracja-uprawnień). |
| Sesja ACP kończy się niepowodzeniem wcześnie i daje mało danych wyjściowych | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po ukończeniu pracy | Proces harness zakończył się, ale sesja ACP nie zgłosiła ukończenia. | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy. |
