---
read_when:
    - Uruchamianie harnessów kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach komunikacyjnych
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i okablowaniem Plugin
    - Debugowanie dostarczania ukończeń ACP lub pętli agent-agent
    - Obsługa poleceń `/acp` z poziomu czatu
summary: Używaj sesji środowiska wykonawczego ACP dla Claude Code, Cursor, Gemini CLI, jawnego fallbacku Codex ACP, OpenClaw ACP i innych agentów harness
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-25T13:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy kodowania (na przykład Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez Plugin backendu ACP.

Jeśli poprosisz OpenClaw zwykłym językiem o powiązanie lub sterowanie Codex w bieżącej konwersacji, OpenClaw powinien użyć natywnego Plugin serwera aplikacji Codex (`/codex bind`, `/codex threads`, `/codex resume`). Jeśli poprosisz o `/acp`, ACP, acpx lub sesję potomną Codex w tle, OpenClaw nadal może kierować Codex przez ACP. Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli poprosisz OpenClaw zwykłym językiem, aby „uruchomił Claude Code w wątku” lub użył innego zewnętrznego harnessu, OpenClaw powinien skierować to żądanie do środowiska wykonawczego ACP (a nie do natywnego środowiska wykonawczego sub-agentów).

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP bezpośrednio
z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.

## Którą stronę chcę?

W pobliżu są trzy powierzchnie, które łatwo pomylić:

| Chcesz...                                                                                      | Użyj tego                              | Uwagi                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub sterować Codex w bieżącej konwersacji                                             | `/codex bind`, `/codex threads`        | Natywna ścieżka serwera aplikacji Codex; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/fast/uprawnienia, sterowanie zatrzymaniem i naprowadzaniem. ACP to jawny fallback |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: agenci ACP                  | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, sterowanie środowiskiem wykonawczym                              |
| Udostępnić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta                    | [`openclaw acp`](/pl/cli/acp)             | Tryb pomostu. IDE/klient komunikuje się z OpenClaw przez ACP przez stdio/WebSocket                                                                             |
| Ponownie użyć lokalnego CLI AI jako tekstowego modelu fallback                                 | [Backendy CLI](/pl/gateway/cli-backends)  | To nie jest ACP. Brak narzędzi OpenClaw, brak sterowania ACP, brak środowiska wykonawczego harnessu                                                           |

## Czy to działa od razu po instalacji?

Zwykle tak. Świeże instalacje są dostarczane z dołączonym Plugin środowiska wykonawczego `acpx`, włączonym domyślnie, z przypiętym lokalnie dla Plugin binarium `acpx`, które OpenClaw sprawdza i samonaprawia przy uruchamianiu. Uruchom `/acp doctor`, aby wykonać kontrolę gotowości.

Pułapki przy pierwszym uruchomieniu:

- Adaptery docelowego harnessu (Codex, Claude itd.) mogą zostać pobrane na żądanie przez `npx` przy pierwszym użyciu.
- Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma npm ani dostępu do sieci, pobrania adapterów przy pierwszym uruchomieniu zakończą się niepowodzeniem, dopóki pamięci podręczne nie zostaną wstępnie rozgrzane lub adapter nie zostanie zainstalowany inną metodą.

## Instrukcja operatora

Szybki proces `/acp` z czatu:

1. **Uruchom** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` lub jawne `/acp spawn codex --bind here`
2. **Pracuj** w powiązanej konwersacji lub wątku (albo wskaż jawnie klucz sesji).
3. **Sprawdź stan** — `/acp status`
4. **Dostrój** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Naprowadzaj** bez zastępowania kontekstu — `/acp steer tighten logging and continue`
6. **Zatrzymaj** — `/acp cancel` (bieżąca tura) lub `/acp close` (sesja + powiązania)

Wyzwalacze w języku naturalnym, które powinny być kierowane do natywnego Plugin Codex:

- „Powiąż ten kanał Discord z Codex.”
- „Podłącz ten czat do wątku Codex `<id>`.”
- „Pokaż wątki Codex, a potem powiąż ten.”

Natywne powiązanie konwersacji Codex jest domyślną ścieżką sterowania czatem. Dynamiczne
narzędzia OpenClaw nadal wykonują się przez OpenClaw, podczas gdy natywne narzędzia Codex, takie jak
shell/apply-patch, wykonują się wewnątrz Codex. Dla natywnych zdarzeń narzędzi Codex OpenClaw
wstrzykuje przekaźnik natywnego hooka na turę, aby hooki Plugin mogły blokować
`before_tool_call`, obserwować `after_tool_call` i kierować zdarzenia Codex
`PermissionRequest` przez zatwierdzenia OpenClaw. Przekaźnik v1 jest
celowo zachowawczy: nie modyfikuje argumentów natywnych narzędzi Codex,
nie przepisuje rekordów wątków Codex ani nie bramkuje końcowych odpowiedzi/hooków Stop. Używaj jawnego
ACP tylko wtedy, gdy chcesz modelu środowiska wykonawczego/sesji ACP. Granica
obsługi osadzonego Codex jest opisana w
[kontrakcie obsługi harnessu Codex v1](/pl/plugins/codex-harness#v1-support-contract).

Wyzwalacze w języku naturalnym, które powinny być kierowane do środowiska wykonawczego ACP:

- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem zachowaj kolejne działania w tym samym wątku.”
- „Uruchom Codex przez ACP w wątku w tle.”

OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessu, powiązuje z bieżącą konwersacją lub wątkiem, jeśli jest to obsługiwane, i kieruje kolejne działania do tej sesji aż do zamknięcia/wygaśnięcia. Codex podąża tą ścieżką tylko wtedy, gdy ACP jest jawne lub żądane środowisko wykonawcze w tle nadal wymaga ACP.

## ACP a sub-agenci

Używaj ACP, gdy chcesz zewnętrznego środowiska wykonawczego harnessu. Używaj natywnego serwera aplikacji Codex do powiązania/sterowania konwersacją Codex. Używaj sub-agentów, gdy chcesz delegowanych uruchomień natywnych dla OpenClaw.

| Obszar         | Sesja ACP                             | Uruchomienie sub-agenta             |
| -------------- | ------------------------------------- | ----------------------------------- |
| Środowisko wykonawcze | Plugin backendu ACP (na przykład acpx) | Natywne środowisko wykonawcze sub-agentów OpenClaw |
| Klucz sesji    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Główne polecenia | `/acp ...`                          | `/subagents ...`                    |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko wykonawcze) |

Zobacz też [Sub-agenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesji ACP OpenClaw
2. dołączony Plugin środowiska wykonawczego `acpx`
3. adapter Claude ACP
4. mechanika środowiska wykonawczego/sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harnessu ze sterowaniem ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem konwersacji/wątku.
- Backendy CLI to osobne lokalne środowiska wykonawcze fallback tylko tekstowe. Zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest następująca:

- jeśli chcesz `/acp spawn`, sesji, które można powiązać, sterowania środowiskiem wykonawczym lub trwałej pracy harnessu: użyj ACP
- jeśli chcesz prostego lokalnego fallbacku tekstowego przez surowe CLI: użyj backendów CLI

## Powiązane sesje

### Powiązania z bieżącą konwersacją

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do uruchomionej sesji ACP — bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal zarządza transportem, uwierzytelnianiem, bezpieczeństwem i dostarczaniem; kolejne wiadomości w tej konwersacji są kierowane do tej samej sesji; `/new` i `/reset` resetują sesję na miejscu; `/acp close` usuwa powiązanie.

Model mentalny:

- **powierzchnia czatu** — miejsce, gdzie ludzie dalej rozmawiają (kanał Discord, temat Telegram, czat iMessage).
- **sesja ACP** — trwały stan środowiska wykonawczego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **wątek/temat potomny** — opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **obszar roboczy środowiska wykonawczego** — lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa harness. Niezależna od powierzchni czatu.

Przykłady:

- `/codex bind` — zachowaj ten czat, uruchom lub podłącz natywny serwer aplikacji Codex, kieruj przyszłe wiadomości tutaj.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — dostrajaj powiązany natywny wątek Codex z czatu.
- `/codex stop` lub `/codex steer focus on the failing tests first` — steruj aktywną turą natywnego Codex.
- `/acp spawn codex --bind here` — jawny fallback ACP dla Codex.
- `/acp spawn codex --thread auto` — OpenClaw może utworzyć potomny wątek/temat i tam powiązać.
- `/acp spawn codex --bind here --cwd /workspace/repo` — to samo powiązanie czatu, Codex działa w `/workspace/repo`.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają.
- `--bind here` działa tylko na kanałach, które deklarują powiązanie z bieżącą konwersacją; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania przetrwają restarty gateway.
- W Discord `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć potomny wątek dla `--thread auto|here` — nie dla `--bind here`.
- Jeśli uruchamiasz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące ścieżki dziedziczone (`ENOENT`/`ENOTDIR`) wracają do domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) są zgłaszane jako błędy uruchomienia.

### Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla adaptera kanału, sesje ACP mogą być powiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
- Odłączenie fokusu/zamknięcie/archiwizacja/limit bezczynności lub wygaśnięcie maksymalnego wieku usuwa powiązanie.

Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat o braku obsługi/dostępności.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dyspozycję ACP)
- Włączona flaga uruchamiania wątku ACP adaptera kanału (specyficzna dla adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Każdy adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
- Obecna wbudowana obsługa:
  - wątki/kanały Discord
  - tematy Telegram (tematy forum w grupach/supergrupach i tematy DM)
- Kanały Plugin mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

W przypadku przepływów nieefemerycznych skonfiguruj trwałe powiązania ACP w najwyższego poziomu wpisach `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie konwersacji ACP.
- `bindings[].match` identyfikuje docelową konwersację:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grupowych.
  - czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Preferuj `chat_id:*` dla stabilnych powiązań grupowych.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia środowiska wykonawczego na agenta

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Kolejność pierwszeństwa nadpisań dla powiązanych sesji ACP:

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

Działanie:

- OpenClaw zapewnia istnienie skonfigurowanej sesji ACP przed użyciem.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP na miejscu.
- Tymczasowe powiązania środowiska wykonawczego (na przykład tworzone przez przepływy skupienia na wątku) nadal mają zastosowanie, jeśli są obecne.
- Dla uruchomień między agentami ACP bez jawnego `cwd` OpenClaw dziedziczy obszar roboczy docelowego agenta z konfiguracji agenta.
- Brakujące dziedziczone ścieżki obszaru roboczego wracają do domyślnego `cwd` backendu; błędy dostępu dla istniejących ścieżek są zgłaszane jako błędy uruchomienia.

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
- Jeśli `agentId` zostanie pominięte, OpenClaw użyje `acp.defaultAgent`, jeśli jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby utrzymać trwałą powiązaną konwersację.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) lub `session` (trwałe).
  - wartość domyślna to `run`
  - jeśli `thread: true`, a tryb został pominięty, OpenClaw może domyślnie wybrać zachowanie trwałe zależnie od ścieżki środowiska wykonawczego
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy środowiska wykonawczego (walidowany przez politykę backendu/środowiska wykonawczego). Jeśli zostanie pominięty, uruchomienie ACP dziedziczy obszar roboczy docelowego agenta, jeśli jest skonfigurowany; brakujące dziedziczone ścieżki wracają do domyślnych ustawień backendu, a rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta dla operatora używana w tekście sesji/banera.
- `resumeSessionId` (opcjonalne): wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię swojej konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` przesyła strumieniowo podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy jest dostępne, akceptowane odpowiedzi zawierają `streamLogPath` wskazujące dziennik JSONL o zakresie sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby zobaczyć pełną historię przekazywania.
- `model` (opcjonalne): jawne nadpisanie modelu dla potomnej sesji ACP. Respektowane dla `runtime: "acp"`, aby sesja potomna używała żądanego modelu zamiast po cichu wracać do wartości domyślnej docelowego agenta.

## Model dostarczania

Sesje ACP mogą być interaktywnymi obszarami roboczymi albo pracą w tle należącą do rodzica. Ścieżka dostarczania zależy od tego kształtu.

### Interaktywne sesje ACP

Sesje interaktywne służą do dalszej rozmowy na widocznej powierzchni czatu:

- `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
- `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
- Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

Kolejne wiadomości w powiązanej konwersacji są kierowane bezpośrednio do sesji ACP, a wyjście ACP jest dostarczane z powrotem do tego samego kanału/wątku/tematu.

### Jednorazowe sesje ACP należące do rodzica

Jednorazowe sesje ACP uruchamiane przez inne uruchomienie agenta są potomkami w tle, podobnie jak sub-agenci:

- Rodzic zleca pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Potomek działa we własnej sesji harnessu ACP.
- Zakończenie jest raportowane z powrotem przez wewnętrzną ścieżkę ogłaszania zakończenia zadania.
- Rodzic przepisuje wynik potomka zwykłym głosem asystenta, gdy przydaje się odpowiedź skierowana do użytkownika.

Nie traktuj tej ścieżki jako czatu peer-to-peer między rodzicem a potomkiem. Potomek ma już kanał zakończenia z powrotem do rodzica.

### `sessions_send` i dostarczanie A2A

`sessions_send` może być kierowane do innej sesji po uruchomieniu. Dla zwykłych sesji peer OpenClaw używa ścieżki kolejnego działania agent-do-agenta (A2A) po wstrzyknięciu wiadomości:

- czeka na odpowiedź docelowej sesji
- opcjonalnie pozwala żądającemu i celowi wymienić ograniczoną liczbę kolejnych tur
- prosi cel o utworzenie wiadomości ogłoszenia
- dostarcza to ogłoszenie do widocznego kanału lub wątku

Ta ścieżka A2A jest fallbackiem dla wysyłań peer, gdy nadawca potrzebuje widocznego kolejnego działania. Pozostaje włączona, gdy niepowiązana sesja może zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich ustawieniach `tools.sessions.visibility`.

OpenClaw pomija kolejne działanie A2A tylko wtedy, gdy żądający jest rodzicem własnego jednorazowego potomka ACP należącego do rodzica. W takim przypadku uruchomienie A2A na ścieżce zakończenia zadania może obudzić rodzica wynikiem potomka, przekazać odpowiedź rodzica z powrotem do potomka i utworzyć pętlę echo rodzic/potomek. Wynik `sessions_send` raportuje `delivery.status="skipped"` dla tego przypadku potomka należącego do rodzica, ponieważ za wynik odpowiada już ścieżka zakończenia.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować wcześniejszą sesję ACP zamiast zaczynać od nowa. Agent odtwarza historię swojej konwersacji przez `session/load`, więc podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe przypadki użycia:

- Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie skończyłeś
- Kontynuowanie sesji kodowania rozpoczętej interaktywnie w CLI, teraz bezgłowo przez agenta
- Podjęcie pracy przerwanej przez restart gateway lub limit bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte ze środowiskiem wykonawczym sub-agenta.
- `resumeSessionId` przywraca historię konwersacji upstream ACP; `thread` i `mode` nadal stosują się normalnie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code obsługują).
- Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

<Accordion title="Test smoke po wdrożeniu">

Po wdrożeniu gateway uruchom aktywną kontrolę end-to-end zamiast ufać testom jednostkowym:

1. Zweryfikuj wdrożoną wersję gateway i commit na docelowym hoście.
2. Otwórz tymczasową sesję pomostową ACPX do aktywnego agenta.
3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` i zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Zweryfikuj `accepted=yes`, prawdziwy `childSessionKey` i brak błędu walidatora.
5. Posprzątaj tymczasową sesję pomostową.

Utrzymuj bramkę na `mode: "run"` i pomijaj `streamTo: "parent"` — powiązane z wątkiem `mode: "session"` i ścieżki przekazywania strumienia to osobne, bogatsze przebiegi integracyjne.

</Accordion>

## Zgodność z sandboxem

Sesje ACP obecnie działają w środowisku wykonawczym hosta, a nie wewnątrz sandboxa OpenClaw.

Obecne ograniczenia:

- Jeśli sesja żądająca jest objęta sandboxem, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn` dla jawnego sterowania operatora z czatu, gdy jest to potrzebne.

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

## Rozwiązywanie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` lub `session-label`).

Kolejność rozwiązywania:

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - najpierw próbuje klucz
   - potem identyfikator sesji w kształcie UUID
   - potem etykietę
2. Bieżące powiązanie wątku (jeśli ta konwersacja/wątek jest powiązana z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą konwersacją i powiązania wątków uczestniczą w kroku 2.

Jeśli nie uda się rozwiązać żadnego celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązania przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Działanie                                                              |
| ------ | ---------------------------------------------------------------------- |
| `here` | Wiąże bieżącą aktywną konwersację na miejscu; kończy się błędem, jeśli żadna nie jest aktywna. |
| `off`  | Nie tworzy powiązania z bieżącą konwersacją.                           |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „niech ten kanał lub czat będzie wspierany przez Codex”.
- `--bind here` nie tworzy potomnego wątku.
- `--bind here` jest dostępne tylko w kanałach udostępniających obsługę powiązania z bieżącą konwersacją.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Działanie                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: wiąże ten wątek. Poza wątkiem: tworzy/wiąże potomny wątek tam, gdzie jest to obsługiwane. |
| `here` | Wymaga bieżącego aktywnego wątku; kończy się błędem, jeśli nie jesteś w wątku.                      |
| `off`  | Brak powiązania. Sesja uruchamia się niepowiązana.                                                   |

Uwagi:

- Na powierzchniach bez powiązań z wątkami zachowanie domyślne jest w praktyce równe `off`.
- Uruchomienie z powiązaniem wątku wymaga obsługi przez politykę kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, jeśli chcesz przypiąć bieżącą konwersację bez tworzenia potomnego wątku.

## Sterowanie ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalnie bieżące powiązanie lub powiązanie z wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę będącą w toku dla docelowej sesji.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję naprowadzającą do działającej sesji.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odwiązuje cele wątków.                     | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska wykonawczego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska wykonawczego dla docelowej sesji. | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji środowiska wykonawczego.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska wykonawczego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska wykonawczego (sekundy).    | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska wykonawczego.        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska wykonawczego sesji.     | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska wykonawczego oraz identyfikatory sesji na poziomie środowiska wykonawczego i backendu. Błędy nieobsługiwanych mechanizmów sterowania są wyraźnie zgłaszane, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji lub sesji żądającej; tokeny celu (`session-key`, `session-id` lub `session-label`) są rozwiązywane przez wykrywanie sesji gateway, w tym niestandardowe katalogi główne `session.store` dla poszczególnych agentów.

## Mapowanie opcji środowiska wykonawczego

`/acp` ma wygodne polecenia i ogólny setter.

Równoważne operacje:

- `/acp model <id>` odpowiada kluczowi konfiguracji środowiska wykonawczego `model`.
- `/acp permissions <profile>` odpowiada kluczowi konfiguracji środowiska wykonawczego `approval_policy`.
- `/acp timeout <seconds>` odpowiada kluczowi konfiguracji środowiska wykonawczego `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie `cwd` środowiska wykonawczego.
- `/acp set <key> <value>` to ogólna ścieżka.
  - Szczególny przypadek: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania środowiska wykonawczego dla docelowej sesji.

## Harness acpx, konfiguracja Plugin i uprawnienia

Informacje o konfiguracji harnessu acpx (aliasy Claude Code / Codex / Gemini CLI),
mostach MCP plugin-tools i OpenClaw-tools oraz trybach uprawnień ACP znajdziesz w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                         | Naprawa                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak Plugin backendu lub jest wyłączony.                                        | Zainstaluj i włącz Plugin backendu, a następnie uruchom `/acp doctor`.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                   | Ustaw `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dyspozycja z normalnych wiadomości wątku jest wyłączona.                        | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agenta nie ma na liście dozwolonych.                                            | Użyj dozwolonego `agentId` lub zaktualizuj `acp.allowedAgents`.                                                                                                          |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/id/etykiety.                                         | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` użyto bez aktywnej konwersacji, którą można powiązać.             | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą konwersacją.                 | Użyj `/acp spawn ... --thread ...` tam, gdzie jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` użyto poza kontekstem wątku.                                    | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                    | Powiąż ponownie jako właściciel albo użyj innej konwersacji lub wątku.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania z wątkiem.                                 | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko wykonawcze ACP działa po stronie hosta; sesja żądająca jest objęta sandboxem. | Użyj `runtime="subagent"` z sesji objętych sandboxem albo uruchom ACP z sesji nieobjętej sandboxem.                                                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska wykonawczego ACP.                   | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo użyj ACP z `sandbox="inherit"` z sesji nieobjętej sandboxem.                                                  |
| Brak metadanych ACP dla powiązanej sesji                                    | Nieaktualne/usunięte metadane sesji ACP.                                        | Odtwórz przez `/acp spawn`, a następnie ponownie powiąż/skup wątek.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapis/wykonanie w nieinteraktywnej sesji ACP.          | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| Sesja ACP kończy się wcześnie z niewielką ilością danych wyjściowych        | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po ukończeniu pracy                        | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia.           | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                                |

## Powiązane

- [Sub-agenci](/pl/tools/subagents)
- [Narzędzia sandboxa wieloagentowego](/pl/tools/multi-agent-sandbox-tools)
- [Wysyłanie do agenta](/pl/tools/agent-send)
