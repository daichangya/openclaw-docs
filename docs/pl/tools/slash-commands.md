---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia slash: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia slash
x-i18n:
    generated_at: "2026-04-23T10:10:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia slash

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość rozpoczynająca się od `/`.
Polecenie czatu bash dostępne tylko na hoście używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim zobaczy ją model.
  - W zwykłych wiadomościach czatu (niebędących wyłącznie dyrektywą) są traktowane jako „inline hints” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane w sesji i odpowiadają potwierdzeniem.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    allowlista używana dla dyrektyw; w przeciwnym razie autoryzacja pochodzi z allowlist kanału/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje też kilka **skrótów inline** (tylko dla nadawców z allowlisty/autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim wiadomość zobaczy model, a pozostały tekst przechodzi dalej przez normalny przepływ.

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
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz poleceń slash); ignorowane dla providerów bez obsługi natywnej.
  - Ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native`, aby nadpisać per provider (bool albo `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy uruchamianiu. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skills**, gdy są obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia osobnego polecenia slash dla każdej Skill).
  - Ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills`, aby nadpisać per provider (bool albo `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) kontroluje, jak długo bash czeka przed przełączeniem do trybu tła (`0` natychmiast przenosi do tła).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis zarządzanej przez OpenClaw konfiguracji MCP pod `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status Pluginów oraz sterowanie install + enable/disable).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko runtime).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzia restartu gateway.
- `commands.ownerAllowFrom` (opcjonalne) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. Jest to oddzielne od `commands.allowFrom`.
- Per kanał `channels.<channel>.commands.enforceOwnerForCommands` (opcjonalne, domyślnie `false`) sprawia, że polecenia dostępne tylko dla właściciela wymagają do uruchomienia **tożsamości właściciela** na tej powierzchni. Gdy ma wartość `true`, nadawca musi albo pasować do rozwiązanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` lub natywnej metadanej właściciela providera), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wildcard w kanałowym `allowFrom` albo pusta/nierozwiązana lista kandydatów właściciela **nie** wystarcza — polecenia tylko dla właściciela kończą się fail-closed na tym kanale. Pozostaw to wyłączone, jeśli chcesz, by polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe allowlisty poleceń.
- `commands.ownerDisplay` kontroluje, jak identyfikatory właściciela pojawiają się w system prompt: `raw` albo `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalne) ustawia allowlistę per provider dla autoryzacji poleceń. Gdy jest skonfigurowane, jest
  jedynym źródłem autoryzacji dla poleceń i dyrektyw (`allowFrom` kanałów/parowanie i `commands.useAccessGroups`
  są ignorowane). Użyj `"*"` dla globalnej wartości domyślnej; klucze specyficzne dla providera mają pierwszeństwo.
- `commands.useAccessGroups` (domyślnie `true`) egzekwuje allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Obecne źródło prawdy:

- wbudowane polecenia core pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia Pluginów pochodzą z wywołań `registerCommand()` Pluginów
- rzeczywista dostępność na Twoim gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych Pluginów

### Wbudowane polecenia core

Wbudowane polecenia dostępne obecnie:

- `/new [model]` rozpoczyna nową sesję; `/reset` jest aliasem resetu.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startup/system-prompt w miejscu.
- `/compact [instructions]` wykonuje Compaction kontekstu sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżący przebieg.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązań wątków.
- `/think <level>` ustawia poziom myślenia. Opcje pochodzą z profilu providera aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a niestandardowe poziomy, takie jak `xhigh`, `adaptive`, `max` albo binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza tryb verbose. Alias: `/v`.
- `/trace on|off` przełącza output trace Pluginów dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb fast.
- `/reasoning [on|off|stream]` przełącza widoczność reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia wartości domyślne exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla listę providerów albo modeli dla providera.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może teraz używać.
- `/status` pokazuje status runtime, w tym użycie/limit providera, gdy jest dostępny.
- `/tasks` wyświetla aktywne/ostatnie zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/export-trajectory [path]` eksportuje JSONL [pakiet trajektorii](/pl/tools/trajectory) dla bieżącej sesji. Alias: `/trajectory`.
- `/whoami` pokazuje identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia Skill po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekstowo.
- `/approve <id> <decision>` rozwiązuje prompty zatwierdzeń exec.
- `/btw <question>` zadaje pytanie poboczne bez zmiany przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza przebiegami podagentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami runtime.
- `/focus <target>` wiąże bieżący wątek Discord albo temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla agentów związanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego albo wszystkich działających podagentów.
- `/steer <id|#> <message>` wysyła sterowanie do działającego podagenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje albo zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje albo zapisuje zarządzaną przez OpenClaw konfigurację serwera MCP pod `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza albo modyfikuje stan Pluginu. `/plugin` jest aliasem. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko runtime. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` kontroluje stopkę użycia per odpowiedź albo wypisuje lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowo. Alias: `! <command>`. Wymaga `commands.bash: true` oraz allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z Pluginów kanałów z obsługą poleceń natywnych. Obecny dołączony zestaw:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych Pluginów

Dołączone Pluginy mogą dodawać więcej poleceń slash. Obecne dołączone polecenia w tym repo:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzeń. Zobacz [Parowanie](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja wysokiego ryzyka polecenia Node telefonu.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i kontroluje dołączony harness app-server Codex. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia Skills

Skills wywoływane przez użytkownika są również udostępniane jako polecenia slash:

- `/skill <name> [input]` zawsze działa jako generyczny entrypoint.
- Skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy Skill/Plugin je rejestruje.
- Rejestracja natywnych poleceń Skills jest kontrolowana przez `commands.nativeSkills` oraz `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny znak `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę providera (fuzzy match); jeśli nic nie pasuje, tekst jest traktowany jako treść wiadomości.
- Aby uzyskać pełne zestawienie użycia per provider, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
- W kanałach wielokontowych kierowane do konfiguracji `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` także respektują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia per odpowiedź; `/usage cost` wypisuje lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje Pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm albo `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację Pluginów i może poprosić o restart.
- Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i poleceń natywnych; niedostępne jako tekst).
- Polecenia wiązania wątków Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają skutecznie włączonych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowanie runtime: [Agenci ACP](/pl/tools/acp-agents).
- `/verbose` służy do debugowania i dodatkowej widoczności; w normalnym użyciu trzymaj je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do Pluginów i wyłącza zwykły verbose chatter narzędzi.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie Sessions, aby je wyczyścić i wrócić do wartości domyślnych z konfiguracji.
- `/fast` jest specyficzne dla providera: OpenAI/OpenAI Codex mapują je na `service_tier=priority` na natywnych endpointach Responses, podczas gdy bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi są nadal pokazywane, gdy mają znaczenie, ale szczegółowy tekst błędu jest uwzględniany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawniać wewnętrzne reasoning, output narzędzi albo diagnostykę Pluginów, których nie zamierzałeś ujawnić. Najlepiej pozostawiać je wyłączone, zwłaszcza na czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następny przebieg użyje go od razu.
- Jeśli przebieg jest już aktywny, OpenClaw oznacza aktywne przełączenie jako oczekujące i restartuje do nowego modelu dopiero przy czystym punkcie ponowienia.
- Jeśli aktywność narzędzi albo output odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia albo następnej tury użytkownika.
- **Ścieżka fast:** wiadomości zawierające tylko polecenie od nadawców z allowlisty są obsługiwane natychmiast (omijają kolejkę + model).
- **Bramkowanie wzmianką w grupach:** wiadomości zawierające tylko polecenie od nadawców z allowlisty omijają wymagania wzmianki.
- **Skróty inline (tylko nadawcy z allowlisty):** niektóre polecenia działają również po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź statusową, a pozostały tekst przechodzi dalej przez zwykły przepływ.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jak zwykły tekst.
- **Polecenia Skills:** Skills typu `user-invocable` są udostępniane jako polecenia slash. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają numeryczne sufiksy (np. `_2`).
  - `/skill <name> [input]` uruchamia Skill po nazwie (przydatne, gdy limity poleceń natywnych uniemożliwiają polecenia per Skill).
  - Domyślnie polecenia Skills są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (Plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty poleceń natywnych:** Discord używa autocomplete dla opcji dynamicznych (oraz menu przycisków po pominięciu wymaganych argumentów). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory, a Ty pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie runtime, a nie na pytanie konfiguracyjne: **czego ten agent może używać teraz w
tej rozmowie**.

- Domyślne `/tools` jest zwarte i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie poleceń natywnych obsługujące argumenty udostępniają ten sam przełącznik trybu `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy albo modelu może
  zmienić output.
- `/tools` obejmuje narzędzia, które są faktycznie osiągalne w runtime, w tym narzędzia core, podłączone
  narzędzia Pluginów i narzędzia należące do kanałów.

Do edycji profili i nadpisań używaj panelu Tools w Control UI albo powierzchni config/catalog zamiast
traktować `/tools` jak statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit providera** (przykład: „Claude 80% left”) pojawia się w `/status` dla bieżącego providera modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna providerów do `% left`; dla MiniMax pola procentowe zawierające tylko pozostałą wartość są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu oraz etykietę planu z tagiem modelu.
- **Linie token/cache** w `/status` mogą awaryjnie używać najnowszego wpisu użycia z transkryptu, gdy aktywna migawka sesji jest uboga. Istniejące niezerowe wartości live nadal mają pierwszeństwo, a fallback do transkryptu może także odzyskać etykietę aktywnego modelu runtime oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są brakujące albo mniejsze.
- **Tokeny/koszt per odpowiedź** są kontrolowane przez `/usage off|tokens|full` (dopisywane do zwykłych odpowiedzi).
- `/model status` dotyczy **modeli/auth/endpointów**, a nie użycia.

## Wybór modelu (`/model`)

`/model` jest zaimplementowane jako dyrektywa.

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

- `/model` i `/model list` pokazują zwarty, numerowany selektor (rodzina modelu + dostępni providerzy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi providera i modelu oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego providera).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint providera (`baseUrl`) oraz tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać **nadpisania konfiguracji tylko runtime** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.debug: true`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Uwagi:

- Nadpisania są stosowane natychmiast do nowych odczytów konfiguracji, ale **nie** zapisują nic do `openclaw.json`.
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z dysku.

## Output trace Pluginów

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
- Linie trace Pluginów mogą pojawiać się w `/status` oraz jako diagnostyczna wiadomość uzupełniająca po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko runtime.
- `/trace` nie zastępuje `/verbose`; zwykły verbose output narzędzi/statusu nadal należy do `/verbose`.

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

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw pod `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz przez `commands.mcp: true`.

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

`/plugins` pozwala operatorom sprawdzać wykryte Pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz przez `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania Pluginów względem bieżącego workspace oraz konfiguracji na dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację Pluginów; nie instaluje ani nie odinstalowuje Pluginów.
- Po zmianach enable/disable uruchom ponownie gateway, aby je zastosować.

## Uwagi o powierzchniach

- **Polecenia tekstowe** działają w zwykłej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają izolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (celuje w sesję czatu przez `CommandTargetSessionKey`)
- **`/stop`** celuje w aktywną sesję czatu, aby móc przerwać bieżący przebieg.
- **Slack:** `channels.slack.slashCommand` nadal jest obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć jedno polecenie slash Slack dla każdego wbudowanego polecenia (te same nazwy co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Wyjątek natywny Slack: zarejestruj `/agentstatus` (a nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W odróżnieniu od zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- działa jako osobne **bez-narzędziowe** wywołanie jednorazowe,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane w historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne
zadanie nadal trwa.

Przykład:

```text
/btw co teraz robimy?
```

Zobacz [Pytania poboczne BTW](/pl/tools/btw), aby poznać pełne zachowanie i
szczegóły UX klienta.
