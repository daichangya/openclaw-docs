---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia slash: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia slash
x-i18n:
    generated_at: "2026-04-25T14:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Polecenia są obsługiwane przez Gateway. Większość poleceń musi być wysłana jako **samodzielna** wiadomość zaczynająca się od `/`.
Polecenie bash czatu dostępne tylko na hoście używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (nie tylko z dyrektywami) są traktowane jako „wskazówki inline” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    używana allowlista; w przeciwnym razie autoryzacja pochodzi z allowlist kanałów/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje też kilka **skrótów inline** (tylko dla nadawców z allowlisty/autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane zanim wiadomość zobaczy model, a pozostały tekst przechodzi dalej przez normalny przepływ.

## Konfiguracja

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (domyślnie `true`) włącza parsowanie `/...` w wiadomościach czatu.
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje polecenia natywne.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń slash); ignorowane dla providerów bez natywnej obsługi.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać per provider (bool albo `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy uruchomieniu. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skills**, gdy są obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia polecenia slash dla każdego Skills).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać per provider (bool albo `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) określa, jak długo bash czeka przed przejściem do trybu tła (`0` natychmiast przenosi do tła).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis zarządzanej przez OpenClaw konfiguracji MCP pod `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status Pluginów oraz sterowanie install + enable/disable).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko runtime).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzi restartu gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi tylko dla właściciela. To jest oddzielne od `commands.allowFrom`.
- Per kanał `channels.<channel>.commands.enforceOwnerForCommands` (opcjonalne, domyślnie `false`) sprawia, że polecenia tylko dla właściciela wymagają **tożsamości właściciela**, aby działały na tej powierzchni. Gdy ma wartość `true`, nadawca musi albo pasować do rozwiązanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnej metadanej właściciela providera), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wildcard w kanałowym `allowFrom` albo pusta/nierozwiązywalna lista kandydatów właściciela **nie** wystarcza — polecenia tylko dla właściciela kończą się bezpieczną odmową na tym kanale. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były kontrolowane wyłącznie przez `ownerAllowFrom` i standardowe allowlisty poleceń.
- `commands.ownerDisplay` kontroluje sposób pojawiania się identyfikatorów właściciela w promptcie systemowym: `raw` albo `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia allowlistę per provider dla autoryzacji poleceń. Gdy jest skonfigurowana, jest
  jedynym źródłem autoryzacji dla poleceń i dyrektyw (allowlisty kanałów/parowanie oraz `commands.useAccessGroups`
  są ignorowane). Użyj `"*"` dla globalnej wartości domyślnej; klucze specyficzne dla providera ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) egzekwuje allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Aktualne źródło prawdy:

- podstawowe polecenia wbudowane pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Pluginów pochodzą z wywołań `registerCommand()` w Pluginach
- rzeczywista dostępność na Twoim Gateway nadal zależy od flag konfiguracyjnych, powierzchni kanału oraz zainstalowanych/włączonych Pluginów

### Podstawowe polecenia wbudowane

Obecnie dostępne polecenia wbudowane:

- `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startup/system prompt w miejscu.
- `/compact [instructions]` kompaktuje kontekst sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania wątku.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu providera aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, z niestandardowymi poziomami takimi jak `xhigh`, `adaptive`, `max` albo binarnym `on` tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/trace on|off` przełącza wyjście śledzenia Plugin dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb fast.
- `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb podwyższonych uprawnień. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla providery lub modele dla providera.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może używać w tej chwili.
- `/status` pokazuje status wykonania/runtime, w tym etykiety `Execution`/`Runtime` oraz użycie/limit providera, gdy są dostępne.
- `/crestodian <request>` uruchamia pomocnika konfiguracji i naprawy Crestodian z DM właściciela.
- `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/export-trajectory [path]` eksportuje pakiet JSONL [trajectory bundle](/pl/tools/trajectory) dla bieżącej sesji. Alias: `/trajectory`.
- `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia Skills po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekstowe.
- `/approve <id> <decision>` rozwiązuje monity zatwierdzeń exec.
- `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami subagentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami runtime.
- `/focus <target>` wiąże bieżący wątek Discord albo temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego lub wszystkich działających subagentów.
- `/steer <id|#> <message>` wysyła steering do działającego subagenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje zarządzaną przez OpenClaw konfigurację serwera MCP pod `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan Pluginów. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko runtime. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką usage per odpowiedź albo wypisuje lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowe. Alias: `! <command>`. Wymaga `commands.bash: true` oraz allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash działające w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash działające w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z Pluginów kanałów z obsługą natywnych poleceń. Obecny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych Pluginów

Dołączone Pluginy mogą dodawać więcej poleceń slash. Bieżące dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza memory Dreaming. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja wysokiego ryzyka polecenia phone node.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety rich card LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i steruje dołączonym harness serwera aplikacji Codex. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są również udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy rejestruje je Skills/Plugin.
- Rejestracją natywnych poleceń Skills sterują `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę providera (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełny podział usage providera, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
- W kanałach z wieloma kontami polecenia `/allowlist --account <id>` skierowane do konfiguracji oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` docelowego konta.
- `/usage` steruje stopką usage per odpowiedź; `/usage cost` wypisuje lokalne podsumowanie kosztów na podstawie logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje Plugin co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm albo `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację Plugin i może poprosić o restart.
- Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (niedostępne jako tekst). `join` wymaga guild oraz wybranego kanału voice/stage. Wymaga `channels.discord.voice` i natywnych poleceń.
- Polecenia powiązań wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowanie runtime: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostawiaj je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do Pluginów i pozostawia wyłączony normalny szczegółowy szum narzędzi.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w Sessions UI, aby je wyczyścić i wrócić do wartości domyślnych z konfiguracji.
- `/fast` jest specyficzne dla providera: OpenAI/OpenAI Codex mapują je do `service_tier=priority` na natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je do `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy mają znaczenie, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne reasoning, wyjście narzędzi albo diagnostykę Pluginów, których nie zamierzałeś ujawniać. Preferuj pozostawienie ich wyłączonych, szczególnie na czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie od razu go użyje.
- Jeśli uruchomienie już trwa, OpenClaw oznacza live switch jako oczekujący i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi albo wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo do następnej tury użytkownika.
- W lokalnym TUI polecenie `/crestodian [request]` wraca z normalnego TUI agenta do
  Crestodian. To jest oddzielne od trybu ratunkowego kanału wiadomości i nie
  nadaje zdalnych uprawnień do konfiguracji.
- **Szybka ścieżka:** wiadomości zawierające tylko polecenia od nadawców z allowlisty są obsługiwane natychmiast (omijają kolejkę i model).
- **Bramka wzmianek grupowych:** wiadomości zawierające tylko polecenia od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko dla nadawców z allowlisty):** niektóre polecenia działają również wtedy, gdy są osadzone w normalnej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź ze statusem, a pozostały tekst przechodzi dalej przez normalny przepływ.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenia są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia Skills:** Skills oznaczone jako `user-invocable` są udostępniane jako polecenia slash. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje otrzymują sufiksy liczbowe (np. `_2`).
  - `/skill <name> [input]` uruchamia Skills po nazwie (przydatne, gdy ograniczenia natywnych poleceń uniemożliwiają polecenia per Skills).
  - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty natywnych poleceń:** Discord używa autouzupełniania dla dynamicznych opcji (oraz menu przycisków, gdy pominiesz wymagane argumenty). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument. Dynamiczne wybory są rozwiązywane względem modelu docelowej sesji, więc opcje specyficzne dla modelu, takie jak poziomy `/think`, podążają za nadpisaniem `/model` tej sesji.

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie na pytanie o konfigurację: **czego ten agent może używać teraz
w tej konwersacji**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie natywnych poleceń obsługujące argumenty udostępniają ten sam przełącznik trybu `compact|verbose`.
- Wyniki są ograniczone do sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy albo modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia faktycznie osiągalne w runtime, w tym narzędzia podstawowe, podłączone
  narzędzia Pluginów i narzędzia należące do kanałów.

Do edycji profili i nadpisań używaj panelu Tools w Control UI albo powierzchni config/catalog zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie usage (co jest pokazywane gdzie)

- **Usage/limit providera** (np. „Claude 80% left”) pojawia się w `/status` dla bieżącego providera modelu, gdy śledzenie usage jest włączone. OpenClaw normalizuje okna providerów do `% left`; dla MiniMax pola procentowe typu remaining-only są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu oznaczoną modelem.
- **Wiersze token/cache** w `/status` mogą wracać do najnowszego wpisu usage w transkrypcie, gdy migawka live sesji jest uboga. Istniejące niezerowe wartości live nadal wygrywają, a fallback z transkryptu może też odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są nieobecne lub mniejsze.
- **Execution vs runtime:** `/status` raportuje `Execution` dla efektywnej ścieżki sandbox oraz `Runtime` dla tego, kto faktycznie uruchamia sesję: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI albo backend ACP.
- **Tokeny/koszt per odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dodawane do normalnych odpowiedzi).
- `/model status` dotyczy **modeli/uwierzytelniania/endpointów**, a nie usage.

## Wybór modelu (`/model`)

`/model` jest implementowane jako dyrektywa.

Przykłady:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Uwagi:

- `/model` i `/model list` pokazują zwięzły, numerowany selektor (rodzina modeli + dostępni providery).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi providera i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego providera).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint providera (`baseUrl`) i tryb API (`api`), gdy są dostępne.

## Nadpisania debug

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko w runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują się do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji na dysku.

## Wyjście trace Pluginów

`/trace` pozwala przełączać **linie trace/debug Pluginów w zakresie sesji** bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan trace dla sesji.
- `/trace on` włącza linie trace Pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie trace Pluginów mogą pojawiać się w `/status` i jako follow-up komunikat diagnostyczny po normalnej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko runtime.
- `/trace` nie zastępuje `/verbose`; normalne szczegółowe wyjście narzędzi/statusu nadal należy do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do konfiguracji na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.config: true`.

Przykłady:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Uwagi:

- Konfiguracja jest walidowana przed zapisem; nieprawidłowe zmiany są odrzucane.
- Aktualizacje `/config` utrzymują się po restartach.

## Aktualizacje MCP

`/mcp` zapisuje zarządzane przez OpenClaw definicje serwerów MCP pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` zapisuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery runtime decydują, które transporty są faktycznie wykonywalne.

## Aktualizacje Pluginów

`/plugins` pozwala operatorom sprawdzać wykryte Pluginy i przełączać włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Pluginów względem bieżącego obszaru roboczego oraz konfiguracji na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację Pluginów; nie instaluje ani nie odinstalowuje Pluginów.
- Po zmianach enable/disable uruchom ponownie gateway, aby je zastosować.

## Uwagi dotyczące powierzchni

- **Polecenia tekstowe** działają w normalnej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, dzięki czemu może przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` jest nadal obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego polecenia wbudowanego (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek natywny Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W odróżnieniu od zwykłego czatu:

- używa bieżącej sesji jako kontekstu tła,
- działa jako oddzielne **jednorazowe** wywołanie bez narzędzi,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane do historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe wyjaśnienie, podczas gdy główne
zadanie nadal trwa.

Przykład:

```text
/btw what are we doing right now?
```

Pełne zachowanie i szczegóły UX klienta znajdziesz w [BTW Side Questions](/pl/tools/btw).

## Powiązane

- [Skills](/pl/tools/skills)
- [Konfiguracja Skills](/pl/tools/skills-config)
- [Tworzenie Skills](/pl/tools/creating-skills)
