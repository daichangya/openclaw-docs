---
read_when:
    - Uruchamianie harnessów do kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach wiadomości
    - Powiązanie rozmowy w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i okablowaniem pluginu ACP
    - Debugowanie dostarczania ukończenia ACP lub pętli agent-agent
    - Obsługa poleceń /acp z czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harnessu
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-23T10:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenci ACP

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy do kodowania (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez plugin backendu ACP.

Jeśli poprosisz OpenClaw zwykłym językiem, aby „uruchomił to w Codex” albo „zaczął Claude Code w wątku”, OpenClaw powinien skierować to żądanie do runtime ACP (a nie do natywnego runtime sub-agenta). Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi rozmowami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.

## Której strony potrzebuję?

Są tu trzy pobliskie powierzchnie, które łatwo pomylić:

| Chcesz...                                                                        | Użyj tego                              | Uwagi                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: agenci ACP                 | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime |
| Wystawić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta         | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient mówi ACP do OpenClaw przez stdio/WebSocket                                              |
| Ponownie użyć lokalnego CLI AI jako zapasowego modelu tylko tekstowego            | [Backendy CLI](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak runtime harnessu                             |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje dostarczają teraz dołączony plugin runtime `acpx` włączony domyślnie.
- Dołączony plugin `acpx` preferuje własny, przypięty binarny plik `acpx`.
- Przy uruchamianiu OpenClaw sonduje ten plik binarny i sam go naprawia, jeśli trzeba.
- Zacznij od `/acp doctor`, jeśli chcesz szybkiego sprawdzenia gotowości.

Co nadal może się wydarzyć przy pierwszym użyciu:

- Adapter docelowego harnessu może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harnessu.
- Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma dostępu do npm/sieci, pobranie adaptera przy pierwszym uruchomieniu może się nie udać, dopóki cache nie zostanie rozgrzany albo adapter nie zostanie zainstalowany w inny sposób.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do uruchomienia `acpx`, ale adapter ACP Codex może nadal wymagać pobrania przy pierwszym użyciu.
- `/acp spawn claude`: podobnie dla adaptera ACP Claude, plus uwierzytelnianie po stronie Claude na tym hoście.

## Szybki przepływ operatora

Użyj tego, gdy chcesz praktycznego runbooka `/acp`:

1. Uruchom sesję:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Pracuj w powiązanej rozmowie lub wątku (albo jawnie kieruj do tego klucza sesji).
3. Sprawdź stan runtime:
   - `/acp status`
4. Dostosuj opcje runtime według potrzeb:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Popchnij aktywną sesję bez zastępowania kontekstu:
   - `/acp steer tighten logging and continue`
6. Zatrzymaj pracę:
   - `/acp cancel` (zatrzymaj bieżącą turę), albo
   - `/acp close` (zamknij sesję i usuń powiązania)

## Szybki start dla ludzi

Przykłady naturalnych próśb:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom trwałą sesję Codex w wątku tutaj i utrzymuj ją w skupieniu.”
- „Uruchom to jako jednorazową sesję ACP Claude Code i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i utrzymuj dalsze działania w tym samym workspace.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem zachowaj kolejne działania w tym samym wątku.”

Co powinien zrobić OpenClaw:

1. Wybrać `runtime: "acp"`.
2. Rozpoznać żądany cel harnessu (`agentId`, na przykład `codex`).
3. Jeśli żądane jest powiązanie z bieżącą rozmową i aktywny kanał to obsługuje, powiązać sesję ACP z tą rozmową.
4. W przeciwnym razie, jeśli żądane jest powiązanie z wątkiem i bieżący kanał to obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować dalsze powiązane wiadomości do tej samej sesji ACP, dopóki nie zostanie wyłączona z fokusu/zamknięta/wygaszona.

## ACP a sub-agenci

Używaj ACP, gdy chcesz zewnętrznego runtime harnessu. Używaj sub-agentów, gdy chcesz delegowanych uruchomień natywnych dla OpenClaw.

| Obszar        | Sesja ACP                              | Uruchomienie sub-agenta              |
| ------------- | -------------------------------------- | ------------------------------------ |
| Runtime       | Plugin backendu ACP (na przykład acpx) | Natywny runtime sub-agenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`    |
| Główne polecenia | `/acp ...`                          | `/subagents ...`                     |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Sub-agenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesją ACP OpenClaw
2. dołączony plugin runtime `acpx`
3. adapter ACP Claude
4. runtime/mechanika sesji po stronie Claude

Ważne rozróżnienie:

- Claude przez ACP to sesja harnessu z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem z rozmową/wątkiem.
- Backendy CLI to oddzielne lokalne runtime zapasowe tylko tekstowe. Zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesji możliwych do powiązania, kontrolek runtime lub trwałej pracy harnessu: użyj ACP
- chcesz prostego lokalnego zapasowego tekstu przez surowe CLI: użyj backendów CLI

## Powiązane sesje

### Powiązania z bieżącą rozmową

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca rozmowa stała się trwałym workspace ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal zarządza transportem kanału, uwierzytelnianiem, bezpieczeństwem i dostarczaniem.
- Bieżąca rozmowa zostaje przypięta do uruchomionego klucza sesji ACP.
- Dalsze wiadomości w tej rozmowie są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję i usuwa powiązanie z bieżącą rozmową.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` nadal może utworzyć nową sesję ACP, jeśli uruchamiasz nową pracę. Powiązanie dołącza tę sesję do bieżącej rozmowy.
- `--bind here` samo z siebie nie tworzy podrzędnego wątku Discord ani topicu Telegram.
- Runtime ACP może nadal mieć własny katalog roboczy (`cwd`) lub workspace zarządzany przez backend na dysku. Ten workspace runtime jest oddzielony od powierzchni czatu i nie oznacza nowego wątku wiadomości.
- Jeśli uruchamiasz do innego agenta ACP i nie przekazujesz `--cwd`, OpenClaw domyślnie dziedziczy workspace **docelowego agenta**, a nie żądającego.
- Jeśli ta odziedziczona ścieżka workspace nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw wraca do domyślnego `cwd` backendu zamiast po cichu użyć niewłaściwego drzewa.
- Jeśli odziedziczony workspace istnieje, ale nie można uzyskać do niego dostępu (na przykład `EACCES`), uruchomienie zwraca rzeczywisty błąd dostępu zamiast odrzucać `cwd`.

Model mentalny:

- powierzchnia czatu: miejsce, gdzie ludzie dalej rozmawiają (`kanał Discord`, `topic Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego kieruje OpenClaw
- podrzędny wątek/topic: opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`
- workspace runtime: lokalizacja systemu plików, w której działa harness (`cwd`, checkout repozytorium, workspace backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, uruchom lub dołącz sesję ACP Codex i kieruj do niej przyszłe wiadomości stąd
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/topic i tam powiązać sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: to samo powiązanie czatu co wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązań z bieżącą rozmową:

- Kanały czatu/wiadomości, które deklarują obsługę powiązań ACP z bieżącą rozmową, mogą używać `--bind here` przez współdzieloną ścieżkę powiązań rozmów.
- Kanały z niestandardową semantyką wątków/topiców nadal mogą zapewniać kanonizację specyficzną dla kanału za tym samym współdzielonym interfejsem.
- `--bind here` zawsze oznacza „powiąż bieżącą rozmowę w miejscu”.
- Ogólne powiązania z bieżącą rozmową używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek w miejscu. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia powiązań ACP z bieżącą rozmową, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania o „nową sesję” dotyczą sesji ACP, a nie kanału. Możesz ponownie użyć albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla adaptera kanału, sesje ACP mogą być powiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Dalsze wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
- Wyłączenie fokusu/zamknięcie/archiwizacja/wygaśnięcie z powodu bezczynności lub max-age usuwa powiązanie.

Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat unsupported/unavailable.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga uruchamiania wątku ACP dla adaptera kanału (specyficzna dla adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Każdy adapter kanału, który udostępnia capability powiązań sesji/wątków.
- Obecna wbudowana obsługa:
  - wątki/kanały Discord
  - topiki Telegram (topiki forum w grupach/supergrupach i topiki DM)
- Kanały pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

Dla przepływów nieefemerycznych skonfiguruj trwałe powiązania ACP w wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie rozmowy ACP.
- `bindings[].match` identyfikuje docelową rozmowę:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grup.
  - czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Preferuj `chat_id:*` dla stabilnych powiązań grup.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne wartości runtime dla agenta

Użyj `agents.list[].runtime`, aby zdefiniować domyślne wartości ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Kolejność pierwszeństwa nadpisań dla sesji ACP powiązanych:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globalne wartości domyślne ACP (na przykład `acp.backend`)

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

- OpenClaw upewnia się, że skonfigurowana sesja ACP istnieje przed użyciem.
- Wiadomości na tym kanale lub w tym topiku są kierowane do skonfigurowanej sesji ACP.
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania runtime (na przykład utworzone przez przepływy thread-focus) nadal obowiązują tam, gdzie są obecne.
- Przy uruchamianiu ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy workspace docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki workspace wracają do domyślnego `cwd` backendu; błędy dostępu dla istniejących ścieżek są zgłaszane jako błędy uruchomienia.

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

- `runtime` domyślnie ma wartość `subagent`, więc dla sesji ACP ustaw jawnie `runtime: "acp"`.
- Jeśli `agentId` jest pominięte, OpenClaw używa `acp.defaultAgent`, gdy jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby utrzymać trwałą powiązaną rozmowę.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) albo `session` (trwałe).
  - domyślnie jest `run`
  - jeśli `thread: true`, a `mode` pominięto, OpenClaw może domyślnie wybrać zachowanie trwałe zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime). Gdy pominięte, uruchomienie ACP dziedziczy workspace docelowego agenta, jeśli jest skonfigurowany; brakujące odziedziczone ścieżki wracają do domyślnych ustawień backendu, a rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora używana w tekście sesji/banera.
- `resumeSessionId` (opcjonalne): wznów istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza swoją historię rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy dostępne, akceptowane odpowiedzi obejmują `streamLogPath` wskazujące na plik JSONL ograniczony do sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić dla pełnej historii przekazywania.
- `model` (opcjonalne): jawne nadpisanie modelu dla podrzędnej sesji ACP. Honorowane dla `runtime: "acp"`, aby sesja podrzędna używała żądanego modelu zamiast po cichu wracać do domyślnego modelu docelowego agenta.

## Model dostarczania

Sesje ACP mogą być interaktywnymi workspace albo pracą w tle należącą do rodzica. Ścieżka dostarczania zależy od tego kształtu.

### Interaktywne sesje ACP

Interaktywne sesje mają prowadzić dalszą rozmowę na widocznej powierzchni czatu:

- `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
- `/acp spawn ... --thread ...` wiąże wątek/topic kanału z sesją ACP.
- Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące rozmowy do tej samej sesji ACP.

Dalsze wiadomości w powiązanej rozmowie są kierowane bezpośrednio do sesji ACP, a dane wyjściowe ACP są dostarczane z powrotem do tego samego kanału/wątku/topiku.

### Jednorazowe sesje ACP należące do rodzica

Jednorazowe sesje ACP uruchamiane przez inne uruchomienie agenta są dziećmi w tle, podobnie jak sub-agenci:

- Rodzic prosi o pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Dziecko działa we własnej sesji harnessu ACP.
- Ukończenie jest raportowane z powrotem przez wewnętrzną ścieżkę ogłoszenia ukończenia zadania.
- Rodzic przepisuje wynik dziecka zwykłym głosem asystenta, gdy przydatna jest odpowiedź skierowana do użytkownika.

Nie traktuj tej ścieżki jak czatu peer-to-peer między rodzicem a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do rodzica.

### `sessions_send` i dostarczanie A2A

`sessions_send` może kierować do innej sesji po uruchomieniu. Dla zwykłych sesji peer OpenClaw używa ścieżki dalszego ciągu agent-to-agent (A2A) po wstrzyknięciu wiadomości:

- czeka na odpowiedź docelowej sesji
- opcjonalnie pozwala żądającemu i celowi wymienić ograniczoną liczbę dalszych tur
- prosi cel o wygenerowanie wiadomości announce
- dostarcza to announce do widocznego kanału lub wątku

Ta ścieżka A2A jest fallbackiem dla wysyłek peer, gdy nadawca potrzebuje widocznego dalszego ciągu. Pozostaje włączona, gdy niepowiązana sesja może zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich ustawieniach `tools.sessions.visibility`.

OpenClaw pomija dalszy ciąg A2A tylko wtedy, gdy żądający jest rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim przypadku uruchomienie A2A na ścieżce ukończenia zadania może obudzić rodzica wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i utworzyć pętlę echo rodzic/dziecko. Wynik `sessions_send` zgłasza `delivery.status="skipped"` dla tego przypadku owned-child, ponieważ ścieżka ukończenia już odpowiada za wynik.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast zaczynać od nowa. Agent odtwarza swoją historię rozmowy przez `session/load`, więc podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe zastosowania:

- Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie skończyłeś
- Kontynuowanie sesji kodowania rozpoczętej interaktywnie w CLI, teraz bezgłowo przez agenta
- Wznowienie pracy przerwanej przez restart gateway lub timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime sub-agenta.
- `resumeSessionId` przywraca historię rozmowy z upstream ACP; `thread` i `mode` nadal normalnie obowiązują dla nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code to obsługują).
- Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się wyraźnym błędem — bez cichego fallbacku do nowej sesji.

### Test smoke operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybkiego sprawdzenia live, że uruchamianie ACP
naprawdę działa end-to-end, a nie tylko przechodzi testy jednostkowe.

Zalecana bramka:

1. Zweryfikuj wersję/commit wdrożonego gateway na docelowym hoście.
2. Potwierdź, że wdrożone źródło zawiera akceptację linii rodowodu ACP w
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Otwórz tymczasową sesję mostu ACPX do działającego agenta (na przykład
   `razor(main)` na `jpclawhq`).
4. Poproś tego agenta o wywołanie `sessions_spawn` z:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent zgłasza:
   - `accepted=yes`
   - rzeczywiste `childSessionKey`
   - brak błędu walidatora
6. Posprzątaj tymczasową sesję mostu ACPX.

Przykładowy prompt do działającego agenta:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Zachowaj ten test smoke przy `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  capability żądającego/sesji i jest osobnym sprawdzeniem integracyjnym.
- Testowanie `mode: "session"` powiązanego z wątkiem traktuj jako drugi, bogatszy
  przebieg integracyjny z prawdziwego wątku Discord lub topicu Telegram.

## Zgodność z sandbox

Sesje ACP obecnie działają w runtime hosta, a nie wewnątrz sandbox OpenClaw.

Bieżące ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i dla `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Używaj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn` do jawnego sterowania przez operatora z czatu, gdy jest to potrzebne.

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

Zobacz [Polecenia slash](/pl/tools/slash-commands).

## Rozpoznawanie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` albo `session-label`).

Kolejność rozpoznawania:

1. Jawny argument celu (albo `--session` dla `/acp steer`)
   - najpierw próbuje klucz
   - potem identyfikator sesji w kształcie UUID
   - potem etykietę
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą rozmową i powiązania wątków biorą udział w kroku 2.

Jeśli nie uda się rozpoznać celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązania uruchamiania

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Zachowanie                                                              |
| ------ | ----------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną rozmowę w miejscu; zakończ niepowodzeniem, jeśli żadna nie jest aktywna. |
| `off`  | Nie twórz powiązania z bieżącą rozmową.                                 |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat opartym na Codex.”
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązań z bieżącą rozmową.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków uruchamiania

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Zachowanie                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek tam, gdzie jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ niepowodzeniem, jeśli nie jesteś w wątku.             |
| `off`  | Brak powiązania. Sesja uruchamia się bez powiązania.                                              |

Uwagi:

- Na powierzchniach bez powiązań wątków zachowanie domyślne jest w praktyce równe `off`.
- Uruchamianie powiązane z wątkiem wymaga obsługi przez politykę kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia podrzędnego wątku.

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

`/acp status` pokazuje skuteczne opcje runtime oraz, gdy są dostępne, zarówno identyfikatory sesji na poziomie runtime, jak i backendu.

Niektóre kontrolki zależą od capability backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca jasny błąd unsupported-control.

## Książka kucharska poleceń ACP

| Polecenie            | Co robi                                                  | Przykład                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie z wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę w locie dla docelowej sesji.               | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odpina cele wątków.                      | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime, capability. | `/acp status`                                                |
| `/acp set-mode`      | Ustawia tryb runtime dla docelowej sesji.               | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji runtime.                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzeń.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu runtime (sekundy).                  | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                      | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                   | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, capability, możliwe do wykonania poprawki. | `/acp doctor`                                               |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia. | `/acp install`                                                |

`/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji albo sesji żądającej. Polecenia, które akceptują tokeny `session-key`, `session-id` albo `session-label`, rozpoznają cele przez wykrywanie sesji gateway, w tym niestandardowe katalogi `session.store` dla agentów.

## Mapowanie opcji runtime

`/acp` ma polecenia skrótowe i ogólny setter.

Równoważne operacje:

- `/acp model <id>` mapuje się na klucz konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje się na klucz konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje się na klucz konfiguracji runtime `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie `cwd` runtime.
- `/acp set <key> <value>` to ogólna ścieżka.
  - Przypadek specjalny: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania runtime dla docelowej sesji.

## Obsługa harnessu acpx (obecnie)

Obecne wbudowane aliasy harnessu acpx:

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
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może również kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka awaryjna jest funkcją CLI acpx (a nie normalną ścieżką OpenClaw `agentId`).

## Wymagana konfiguracja

Podstawowa baza ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Domyślnie true; ustaw false, aby wstrzymać dispatch ACP przy zachowaniu kontrolek /acp.
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

Konfiguracja powiązania wątku jest specyficzna dla adaptera kanału. Przykład dla Discord:

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

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw zweryfikuj flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą rozmową nie wymagają tworzenia podrzędnego wątku. Wymagają aktywnego kontekstu rozmowy i adaptera kanału, który udostępnia powiązania rozmów ACP.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja pluginu dla backendu acpx

Świeże instalacje dostarczają dołączony plugin runtime `acpx` włączony domyślnie, więc ACP
zwykle działa bez ręcznego kroku instalacji pluginu.

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

Instalacja z lokalnego workspace podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie dołączony plugin backendu acpx (`acpx`) używa lokalnego dla pluginu przypiętego pliku binarnego:

1. Polecenie domyślnie wskazuje na lokalne dla pluginu `node_modules/.bin/acpx` wewnątrz pakietu pluginu ACPX.
2. Oczekiwana wersja domyślnie odpowiada przypięciu rozszerzenia.
3. Przy uruchamianiu backend ACP jest natychmiast rejestrowany jako niegotowy.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalny dla pluginu plik binarny nie istnieje albo wersja się nie zgadza, uruchamia:
   `npm install --omit=dev --no-save acpx@<pinned>` i ponownie weryfikuje.

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

- `command` akceptuje ścieżkę bezwzględną, względną albo nazwę polecenia (`acpx`).
- Ścieżki względne są rozpoznawane względem katalogu workspace OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje niestandardowy plik binarny/ścieżkę, automatyczna instalacja lokalna dla pluginu jest wyłączana.
- Uruchamianie OpenClaw pozostaje nieblokujące, gdy działa kontrola stanu backendu.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(pliki binarne specyficzne dla platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się
normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają harnessowi ACP narzędzi pluginów zarejestrowanych przez OpenClaw.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, mogli wywoływać zainstalowane
narzędzia pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym pluginom na wykonywanie w samym OpenClaw.
- Przejrzyj zainstalowane pluginy przed włączeniem tej funkcji.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi pluginów jest
dodatkowym wygodnym rozwiązaniem typu opt-in, a nie zamiennikiem dla ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają przez MCP wbudowanych narzędzi OpenClaw. Włącz oddzielny most narzędzi rdzenia, gdy agent ACP potrzebuje wybranych
wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowy serwer udostępnia `cron`.
- Utrzymuje ekspozycję narzędzi rdzenia jako jawną i domyślnie wyłączoną.

### Konfiguracja limitu czasu runtime

Dołączony plugin `acpx` domyślnie ustawia limit czasu osadzonych tur runtime na 120 sekund. To daje wolniejszym harnessom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie
startu ACP i inicjalizacji. Nadpisz to ustawienie, jeśli Twój host potrzebuje innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie gateway.

### Konfiguracja agenta sondy zdrowia

Dołączony plugin `acpx` sonduje jednego agenta harnessu podczas decydowania, czy
osadzony backend runtime jest gotowy. Domyślnie jest to `codex`. Jeśli Twoje wdrożenie
używa innego domyślnego agenta ACP, ustaw agenta sondy na ten sam identyfikator:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania lub odrzucania promptów uprawnień do zapisu plików i wykonywania powłoki. Plugin acpx udostępnia dwa klucze konfiguracji, które kontrolują sposób obsługi uprawnień:

Te uprawnienia harnessu ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag obejścia dostawcy backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to awaryjny przełącznik break-glass na poziomie harnessu dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harnessu może wykonywać bez promptu.

| Value           | Zachowanie                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapis i exec wymagają promptów. |
| `deny-all`      | Odrzuca wszystkie prompty uprawnień.                      |

### `nonInteractivePermissions`

Kontroluje, co się dzieje, gdy prompt uprawnień miałby zostać pokazany, ale nie ma dostępnego interaktywnego TTY (co w przypadku sesji ACP jest zawsze prawdą).

| Value  | Zachowanie                                                        |
| ------ | ----------------------------------------------------------------- |
| `fail` | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**               |
| `deny` | Po cichu odrzuca uprawnienie i kontynuuje (łagodna degradacja).   |

### Konfiguracja

Ustaw przez konfigurację pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła prompt uprawnień, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli chcesz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast się wyłączać.

## Rozwiązywanie problemów

| Symptom                                                                     | Prawdopodobna przyczyna                                                           | Poprawka                                                                                                                                                              |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak pluginu backendu albo jest wyłączony.                                        | Zainstaluj i włącz plugin backendu, a następnie uruchom `/acp doctor`.                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                     | Ustaw `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch ze zwykłych wiadomości wątku jest wyłączony.                             | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na allowliście.                                            | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token key/id/label.                                                 | Uruchom `/acp sessions`, skopiuj dokładny key/label i spróbuj ponownie.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy możliwej do powiązania.                  | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma capability powiązania ACP z bieżącą rozmową.                       | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                      | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                      | Przepnij jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma capability powiązań wątków.                                        | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca jest sandboxowana.            | Użyj `runtime="subagent"` z sandboxowanych sesji albo uruchom ACP z sesji niesandboxowanej.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                     | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo ACP z `sandbox="inherit"` z sesji niesandboxowanej.                                                       |
| Missing ACP metadata for bound session                                      | Stare/usunięte metadane sesji ACP.                                                | Utwórz ponownie przez `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP.                 | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](#permission-configuration).         |
| ACP session fails early with little output                                  | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia.             | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij zawieszone procesy.                                                                                             |
