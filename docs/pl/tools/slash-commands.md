---
read_when:
    - Używanie lub konfigurowanie poleceń czatu
    - Debugowanie routingu poleceń lub uprawnień
summary: 'Polecenia ukośnikowe: tekstowe vs natywne, konfiguracja i obsługiwane polecenia'
title: Polecenia ukośnikowe
x-i18n:
    generated_at: "2026-04-23T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Polecenia ukośnikowe

Polecenia są obsługiwane przez Gateway. Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość, która zaczyna się od `/`.
Polecenie czatu bash tylko dla hosta używa `! <cmd>` (z aliasem `/bash <cmd>`).

Istnieją dwa powiązane systemy:

- **Polecenia**: samodzielne wiadomości `/...`.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Dyrektywy są usuwane z wiadomości, zanim model ją zobaczy.
  - W zwykłych wiadomościach czatu (nie składających się wyłącznie z dyrektyw) są traktowane jako „wskazówki w treści” i **nie** utrwalają ustawień sesji.
  - W wiadomościach zawierających wyłącznie dyrektywy (wiadomość zawiera tylko dyrektywy) są utrwalane dla sesji i zwracają potwierdzenie.
  - Dyrektywy są stosowane tylko dla **autoryzowanych nadawców**. Jeśli ustawiono `commands.allowFrom`, jest to jedyna
    używana allowlista; w przeciwnym razie autoryzacja pochodzi z allowlist kanałów/parowania oraz `commands.useAccessGroups`.
    Nieautoryzowani nadawcy widzą dyrektywy traktowane jak zwykły tekst.

Istnieje też kilka **skrótów inline** (tylko dla nadawców z allowlisty / autoryzowanych): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Uruchamiają się natychmiast, są usuwane, zanim model zobaczy wiadomość, a pozostały tekst przechodzi dalej przez normalny przepływ.

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

- `commands.text` (domyślnie `true`) włącza analizę `/...` w wiadomościach czatu.
  - Na powierzchniach bez natywnych poleceń (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) polecenia tekstowe nadal działają, nawet jeśli ustawisz to na `false`.
- `commands.native` (domyślnie `"auto"`) rejestruje natywne polecenia.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (dopóki nie dodasz slash commands); ignorowane dla dostawców bez natywnej obsługi.
  - Aby nadpisać ustawienie dla konkretnego dostawcy, ustaw `channels.discord.commands.native`, `channels.telegram.commands.native` lub `channels.slack.commands.native` (bool albo `"auto"`).
  - `false` czyści wcześniej zarejestrowane polecenia na Discord/Telegram przy starcie. Polecenia Slack są zarządzane w aplikacji Slack i nie są usuwane automatycznie.
- `commands.nativeSkills` (domyślnie `"auto"`) rejestruje natywnie polecenia **Skills**, gdy jest to obsługiwane.
  - Auto: włączone dla Discord/Telegram; wyłączone dla Slack (Slack wymaga utworzenia jednego slash command na każdy skill).
  - Aby nadpisać ustawienie dla konkretnego dostawcy, ustaw `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` lub `channels.slack.commands.nativeSkills` (bool albo `"auto"`).
- `commands.bash` (domyślnie `false`) włącza `! <cmd>` do uruchamiania poleceń powłoki hosta (`/bash <cmd>` jest aliasem; wymaga allowlist `tools.elevated`).
- `commands.bashForegroundMs` (domyślnie `2000`) określa, jak długo bash czeka przed przełączeniem w tryb tła (`0` od razu uruchamia w tle).
- `commands.config` (domyślnie `false`) włącza `/config` (odczyt/zapis `openclaw.json`).
- `commands.mcp` (domyślnie `false`) włącza `/mcp` (odczyt/zapis konfiguracji MCP zarządzanej przez OpenClaw w `mcp.servers`).
- `commands.plugins` (domyślnie `false`) włącza `/plugins` (wykrywanie/status pluginów oraz kontrolki instalacji i włączania/wyłączania).
- `commands.debug` (domyślnie `false`) włącza `/debug` (nadpisania tylko w czasie działania).
- `commands.restart` (domyślnie `true`) włącza `/restart` oraz akcje narzędzia restartu Gateway.
- `commands.ownerAllowFrom` (opcjonalnie) ustawia jawną allowlistę właściciela dla powierzchni poleceń/narzędzi dostępnych tylko dla właściciela. To jest oddzielne od `commands.allowFrom`.
- Per-channel `channels.<channel>.commands.enforceOwnerForCommands` (opcjonalnie, domyślnie `false`) sprawia, że polecenia dostępne tylko dla właściciela wymagają uruchomienia przez **tożsamość właściciela** na tej powierzchni. Gdy ustawione na `true`, nadawca musi albo pasować do rozpoznanego kandydata właściciela (na przykład wpisu w `commands.ownerAllowFrom` albo natywnych metadanych właściciela dostawcy), albo mieć wewnętrzny zakres `operator.admin` na wewnętrznym kanale wiadomości. Wpis wieloznaczny w kanałowym `allowFrom` albo pusta/nierozpoznana lista kandydatów właściciela **nie** są wystarczające — polecenia tylko dla właściciela na tym kanale domyślnie odmawiają dostępu. Pozostaw to wyłączone, jeśli chcesz, aby polecenia tylko dla właściciela były ograniczane wyłącznie przez `ownerAllowFrom` i standardowe allowlisty poleceń.
- `commands.ownerDisplay` kontroluje sposób, w jaki identyfikatory właściciela pojawiają się w promptcie systemowym: `raw` albo `hash`.
- `commands.ownerDisplaySecret` opcjonalnie ustawia sekret HMAC używany, gdy `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcjonalnie) ustawia per-provider allowlistę do autoryzacji poleceń. Gdy jest skonfigurowana, jest to
  jedyne źródło autoryzacji dla poleceń i dyrektyw (allowlisty kanałów/parowanie i `commands.useAccessGroups`
  są ignorowane). Użyj `"*"` jako globalnej wartości domyślnej; klucze specyficzne dla dostawcy ją nadpisują.
- `commands.useAccessGroups` (domyślnie `true`) wymusza allowlisty/polityki dla poleceń, gdy `commands.allowFrom` nie jest ustawione.

## Lista poleceń

Aktualne źródło prawdy:

- podstawowe wbudowane polecenia pochodzą z `src/auto-reply/commands-registry.shared.ts`
- wygenerowane polecenia dock pochodzą z `src/auto-reply/commands-registry.data.ts`
- polecenia pluginów pochodzą z wywołań `registerCommand()` w pluginach
- rzeczywista dostępność na Twoim Gateway nadal zależy od flag konfiguracji, powierzchni kanału oraz zainstalowanych/włączonych pluginów

### Podstawowe wbudowane polecenia

Dostępne dziś wbudowane polecenia:

- `/new [model]` rozpoczyna nową sesję; `/reset` to alias resetowania.
- `/reset soft [message]` zachowuje bieżący transkrypt, usuwa ponownie używane identyfikatory sesji backendu CLI i ponownie uruchamia ładowanie startup/system prompt w miejscu.
- `/compact [instructions]` wykonuje Compaction kontekstu sesji. Zobacz [/concepts/compaction](/pl/concepts/compaction).
- `/stop` przerywa bieżące uruchomienie.
- `/session idle <duration|off>` i `/session max-age <duration|off>` zarządzają wygaśnięciem powiązania z wątkiem.
- `/think <level>` ustawia poziom myślenia. Dostępne opcje pochodzą z profilu dostawcy aktywnego modelu; typowe poziomy to `off`, `minimal`, `low`, `medium` i `high`, a niestandardowe poziomy, takie jak `xhigh`, `adaptive`, `max` lub binarne `on`, są dostępne tylko tam, gdzie są obsługiwane. Aliasy: `/thinking`, `/t`.
- `/verbose on|off|full` przełącza szczegółowe wyjście. Alias: `/v`.
- `/trace on|off` przełącza wyjście śledzenia pluginów dla bieżącej sesji.
- `/fast [status|on|off]` pokazuje lub ustawia tryb szybki.
- `/reasoning [on|off|stream]` przełącza widoczność rozumowania. Alias: `/reason`.
- `/elevated [on|off|ask|full]` przełącza tryb podwyższony. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` pokazuje lub ustawia domyślne wartości exec.
- `/model [name|#|status]` pokazuje lub ustawia model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` wyświetla listę dostawców lub modeli dla dostawcy.
- `/queue <mode>` zarządza zachowaniem kolejki (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) oraz opcjami takimi jak `debounce:2s cap:25 drop:summarize`.
- `/help` pokazuje krótkie podsumowanie pomocy.
- `/commands` pokazuje wygenerowany katalog poleceń.
- `/tools [compact|verbose]` pokazuje, czego bieżący agent może używać w tej chwili.
- `/status` pokazuje status środowiska uruchomieniowego, w tym etykiety `Runtime`/`Runner` oraz użycie/limit dostawcy, gdy są dostępne.
- `/tasks` wyświetla aktywne/niedawne zadania w tle dla bieżącej sesji.
- `/context [list|detail|json]` wyjaśnia, jak składany jest kontekst.
- `/export-session [path]` eksportuje bieżącą sesję do HTML. Alias: `/export`.
- `/export-trajectory [path]` eksportuje pakiet JSONL [trajectory bundle](/pl/tools/trajectory) dla bieżącej sesji. Alias: `/trajectory`.
- `/whoami` pokazuje Twój identyfikator nadawcy. Alias: `/id`.
- `/skill <name> [input]` uruchamia skill po nazwie.
- `/allowlist [list|add|remove] ...` zarządza wpisami allowlisty. Tylko tekstowe.
- `/approve <id> <decision>` rozstrzyga prompty zatwierdzenia exec.
- `/btw <question>` zadaje pytanie poboczne bez zmieniania przyszłego kontekstu sesji. Zobacz [/tools/btw](/pl/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` zarządza uruchomieniami sub-agentów dla bieżącej sesji.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` zarządza sesjami ACP i opcjami środowiska uruchomieniowego.
- `/focus <target>` wiąże bieżący wątek Discord lub temat/konwersację Telegram z celem sesji.
- `/unfocus` usuwa bieżące powiązanie.
- `/agents` wyświetla agentów powiązanych z wątkiem dla bieżącej sesji.
- `/kill <id|#|all>` przerywa jednego lub wszystkich uruchomionych sub-agentów.
- `/steer <id|#> <message>` wysyła sterowanie do uruchomionego sub-agenta. Alias: `/tell`.
- `/config show|get|set|unset` odczytuje lub zapisuje `openclaw.json`. Tylko dla właściciela. Wymaga `commands.config: true`.
- `/mcp show|get|set|unset` odczytuje lub zapisuje konfigurację serwera MCP zarządzaną przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Wymaga `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` sprawdza lub modyfikuje stan pluginów. `/plugin` to alias. Zapisy tylko dla właściciela. Wymaga `commands.plugins: true`.
- `/debug show|set|unset|reset` zarządza nadpisaniami konfiguracji tylko w czasie działania. Tylko dla właściciela. Wymaga `commands.debug: true`.
- `/usage off|tokens|full|cost` steruje stopką użycia dla każdej odpowiedzi albo wyświetla lokalne podsumowanie kosztów.
- `/tts on|off|status|provider|limit|summary|audio|help` steruje TTS. Zobacz [/tools/tts](/pl/tools/tts).
- `/restart` restartuje OpenClaw, gdy jest włączone. Domyślnie: włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/activation mention|always` ustawia tryb aktywacji grupy.
- `/send on|off|inherit` ustawia politykę wysyłania. Tylko dla właściciela.
- `/bash <command>` uruchamia polecenie powłoki hosta. Tylko tekstowe. Alias: `! <command>`. Wymaga `commands.bash: true` oraz allowlist `tools.elevated`.
- `!poll [sessionId]` sprawdza zadanie bash w tle.
- `!stop [sessionId]` zatrzymuje zadanie bash w tle.

### Wygenerowane polecenia dock

Polecenia dock są generowane z pluginów kanałów z obsługą natywnych poleceń. Obecny zestaw dołączony w pakiecie:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Polecenia dołączonych pluginów

Dołączone pluginy mogą dodawać więcej slash commands. Obecne dołączone polecenia w tym repozytorium:

- `/dreaming [on|off|status|help]` przełącza Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` zarządza przepływem parowania/konfiguracji urządzenia. Zobacz [Pairing](/pl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tymczasowo uzbraja polecenia node telefonu wysokiego ryzyka.
- `/voice status|list [limit]|set <voiceId|name>` zarządza konfiguracją głosu Talk. Na Discord natywna nazwa polecenia to `/talkvoice`.
- `/card ...` wysyła presety bogatych kart LINE. Zobacz [LINE](/pl/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` sprawdza i kontroluje dołączony harness app-server Codex. Zobacz [Codex Harness](/pl/plugins/codex-harness).
- Polecenia tylko dla QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamiczne polecenia skilli

Skills wywoływane przez użytkownika są również udostępniane jako slash commands:

- `/skill <name> [input]` zawsze działa jako ogólny punkt wejścia.
- skills mogą też pojawiać się jako bezpośrednie polecenia, takie jak `/prose`, gdy skill/plugin je rejestruje.
- rejestracja natywnych poleceń skilli jest kontrolowana przez `commands.nativeSkills` i `channels.<provider>.commands.nativeSkills`.

Uwagi:

- Polecenia akceptują opcjonalny `:` między poleceniem a argumentami (np. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` akceptuje alias modelu, `provider/model` albo nazwę dostawcy (dopasowanie rozmyte); jeśli nie ma dopasowania, tekst jest traktowany jako treść wiadomości.
- Aby zobaczyć pełny rozkład użycia dostawcy, użyj `openclaw status --usage`.
- `/allowlist add|remove` wymaga `commands.config=true` i respektuje kanałowe `configWrites`.
- W kanałach wielokontowych skierowane do konfiguracji `/allowlist --account <id>` oraz `/config set channels.<provider>.accounts.<id>...` również respektują `configWrites` konta docelowego.
- `/usage` steruje stopką użycia dla każdej odpowiedzi; `/usage cost` wyświetla lokalne podsumowanie kosztów z logów sesji OpenClaw.
- `/restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby je wyłączyć.
- `/plugins install <spec>` akceptuje te same specyfikacje pluginów co `openclaw plugins install`: lokalna ścieżka/archiwum, pakiet npm albo `clawhub:<pkg>`.
- `/plugins enable|disable` aktualizuje konfigurację pluginu i może wyświetlić prompt restartu.
- Polecenie natywne tylko dla Discord: `/vc join|leave|status` steruje kanałami głosowymi (wymaga `channels.discord.voice` i natywnych poleceń; niedostępne jako tekst).
- Polecenia powiązania wątku Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) wymagają włączenia efektywnych powiązań wątków (`session.threadBindings.enabled` i/lub `channels.discord.threadBindings.enabled`).
- Dokumentacja poleceń ACP i zachowanie środowiska uruchomieniowego: [ACP Agents](/pl/tools/acp-agents).
- `/verbose` jest przeznaczone do debugowania i dodatkowej widoczności; w normalnym użyciu pozostaw je **wyłączone**.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do pluginów i pozostawia zwykły szczegółowy szum narzędzi wyłączony.
- `/fast on|off` utrwala nadpisanie sesji. Użyj opcji `inherit` w interfejsie użytkownika Sessions, aby je wyczyścić i wrócić do domyślnych ustawień z konfiguracji.
- `/fast` jest zależne od dostawcy: OpenAI/OpenAI Codex mapują je na `service_tier=priority` w natywnych endpointach Responses, natomiast bezpośrednie publiczne żądania Anthropic, w tym ruch uwierzytelniony OAuth wysyłany do `api.anthropic.com`, mapują je na `service_tier=auto` albo `standard_only`. Zobacz [OpenAI](/pl/providers/openai) i [Anthropic](/pl/providers/anthropic).
- Podsumowania błędów narzędzi nadal są pokazywane, gdy to istotne, ale szczegółowy tekst błędu jest dołączany tylko wtedy, gdy `/verbose` ma wartość `on` albo `full`.
- `/reasoning`, `/verbose` i `/trace` są ryzykowne w ustawieniach grupowych: mogą ujawnić wewnętrzne rozumowanie, dane wyjściowe narzędzi lub diagnostykę pluginów, których nie zamierzałeś ujawniać. Najlepiej pozostawić je wyłączone, szczególnie w czatach grupowych.
- `/model` natychmiast utrwala nowy model sesji.
- Jeśli agent jest bezczynny, następne uruchomienie użyje go od razu.
- Jeśli uruchomienie jest już aktywne, OpenClaw oznacza przełączenie na żywo jako oczekujące i restartuje do nowego modelu dopiero w czystym punkcie ponowienia.
- Jeśli aktywność narzędzi lub wyjście odpowiedzi już się rozpoczęły, oczekujące przełączenie może pozostać w kolejce do późniejszej okazji ponowienia lub następnej tury użytkownika.
- **Szybka ścieżka:** wiadomości zawierające tylko polecenie od nadawców z allowlisty są obsługiwane natychmiast (z pominięciem kolejki i modelu).
- **Bramkowanie wzmianek grupowych:** wiadomości zawierające tylko polecenie od nadawców z allowlisty omijają wymagania dotyczące wzmianek.
- **Skróty inline (tylko dla nadawców z allowlisty):** niektóre polecenia działają także po osadzeniu w zwykłej wiadomości i są usuwane, zanim model zobaczy pozostały tekst.
  - Przykład: `hey /status` wywołuje odpowiedź statusu, a pozostały tekst przechodzi dalej przez normalny przepływ.
- Obecnie: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Nieautoryzowane wiadomości zawierające tylko polecenie są po cichu ignorowane, a tokeny inline `/...` są traktowane jako zwykły tekst.
- **Polecenia skilli:** skills `user-invocable` są udostępniane jako slash commands. Nazwy są sanityzowane do `a-z0-9_` (maks. 32 znaki); kolizje dostają sufiksy numeryczne (np. `_2`).
  - `/skill <name> [input]` uruchamia skill po nazwie (przydatne, gdy limity natywnych poleceń uniemożliwiają polecenia dla każdego skilla).
  - Domyślnie polecenia skilli są przekazywane do modelu jako zwykłe żądanie.
  - Skills mogą opcjonalnie deklarować `command-dispatch: tool`, aby kierować polecenie bezpośrednio do narzędzia (deterministycznie, bez modelu).
  - Przykład: `/prose` (plugin OpenProse) — zobacz [OpenProse](/pl/prose).
- **Argumenty natywnych poleceń:** Discord używa autouzupełniania dla dynamicznych opcji (oraz menu przycisków po pominięciu wymaganych argumentów). Telegram i Slack pokazują menu przycisków, gdy polecenie obsługuje wybory i pominiesz argument.

## `/tools`

`/tools` odpowiada na pytanie o środowisko uruchomieniowe, a nie na pytanie o konfigurację: **czego ten agent może używać teraz
w tej konwersacji**.

- Domyślne `/tools` jest zwięzłe i zoptymalizowane pod szybkie skanowanie.
- `/tools verbose` dodaje krótkie opisy.
- Powierzchnie natywnych poleceń obsługujące argumenty udostępniają ten sam przełącznik trybu jako `compact|verbose`.
- Wyniki mają zakres sesji, więc zmiana agenta, kanału, wątku, autoryzacji nadawcy albo modelu może
  zmienić wynik.
- `/tools` obejmuje narzędzia, które są faktycznie osiągalne w czasie działania, w tym narzędzia podstawowe, podłączone
  narzędzia pluginów i narzędzia należące do kanału.

Do edycji profilu i nadpisań używaj panelu Tools w interfejsie użytkownika Control lub powierzchni konfiguracji/katalogu, zamiast
traktować `/tools` jako statyczny katalog.

## Powierzchnie użycia (co pokazuje się gdzie)

- **Użycie/limit dostawcy** (przykład: „Claude 80% left”) pojawia się w `/status` dla dostawcy bieżącego modelu, gdy śledzenie użycia jest włączone. OpenClaw normalizuje okna dostawców do `% left`; dla MiniMax pola procentowe zawierające tylko pozostałą wartość są odwracane przed wyświetleniem, a odpowiedzi `model_remains` preferują wpis modelu czatu wraz z etykietą planu oznaczoną modelem.
- **Linie token/cache** w `/status` mogą wracać do ostatniego wpisu użycia z transkryptu, gdy migawka sesji na żywo jest uboga. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a fallback do transkryptu może też odzyskać etykietę aktywnego modelu środowiska uruchomieniowego oraz większą sumę zorientowaną na prompt, gdy zapisane sumy są niedostępne lub mniejsze.
- **Runtime vs runner:** `/status` raportuje `Runtime` dla efektywnej ścieżki wykonania i stanu sandboxa oraz `Runner` dla tego, kto faktycznie uruchamia sesję: osadzony Pi, dostawca oparty na CLI albo harness/backend ACP.
- **Tokeny/koszt dla każdej odpowiedzi** są kontrolowane przez `/usage off|tokens|full` (dopisywane do zwykłych odpowiedzi).
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

- `/model` i `/model list` pokazują zwięzły, numerowany selektor (rodzina modeli + dostępni dostawcy).
- Na Discord `/model` i `/models` otwierają interaktywny selektor z listami rozwijanymi dostawców i modeli oraz krokiem Submit.
- `/model <#>` wybiera z tego selektora (i w miarę możliwości preferuje bieżącego dostawcę).
- `/model status` pokazuje widok szczegółowy, w tym skonfigurowany endpoint dostawcy (`baseUrl`) oraz tryb API (`api`), gdy są dostępne.

## Nadpisania debugowania

`/debug` pozwala ustawiać nadpisania konfiguracji **tylko w czasie działania** (w pamięci, nie na dysku). Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.debug: true`.

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
- Użyj `/debug reset`, aby wyczyścić wszystkie nadpisania i wrócić do konfiguracji z dysku.

## Wyjście trace pluginów

`/trace` pozwala przełączać **linie trace/debug pluginów o zakresie sesji** bez włączania pełnego trybu szczegółowego.

Przykłady:

```text
/trace
/trace on
/trace off
```

Uwagi:

- `/trace` bez argumentu pokazuje bieżący stan trace dla sesji.
- `/trace on` włącza linie trace pluginów dla bieżącej sesji.
- `/trace off` ponownie je wyłącza.
- Linie trace pluginów mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.
- `/trace` nie zastępuje `/debug`; `/debug` nadal zarządza nadpisaniami konfiguracji tylko w czasie działania.
- `/trace` nie zastępuje `/verbose`; zwykłe szczegółowe wyjście narzędzi/statusu nadal należy do `/verbose`.

## Aktualizacje konfiguracji

`/config` zapisuje do konfiguracji na dysku (`openclaw.json`). Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.config: true`.

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

`/mcp` zapisuje definicje serwerów MCP zarządzane przez OpenClaw w `mcp.servers`. Tylko dla właściciela. Domyślnie wyłączone; włącz za pomocą `commands.mcp: true`.

Przykłady:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Uwagi:

- `/mcp` przechowuje konfigurację w konfiguracji OpenClaw, a nie w ustawieniach projektu należących do Pi.
- Adaptery środowiska uruchomieniowego decydują, które transporty są faktycznie wykonywalne.

## Aktualizacje pluginów

`/plugins` pozwala operatorom sprawdzać wykryte pluginy i przełączać ich włączenie w konfiguracji. Przepływy tylko do odczytu mogą używać `/plugin` jako aliasu. Domyślnie wyłączone; włącz za pomocą `commands.plugins: true`.

Przykłady:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Uwagi:

- `/plugins list` i `/plugins show` używają rzeczywistego wykrywania pluginów względem bieżącego workspace oraz konfiguracji z dysku.
- `/plugins enable|disable` aktualizuje tylko konfigurację pluginów; nie instaluje ani nie odinstalowuje pluginów.
- Po zmianach enable/disable zrestartuj gateway, aby je zastosować.

## Uwagi o powierzchniach

- **Polecenia tekstowe** działają w normalnej sesji czatu (DM współdzielą `main`, grupy mają własną sesję).
- **Polecenia natywne** używają odizolowanych sesji:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks konfigurowalny przez `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (kieruje do sesji czatu przez `CommandTargetSessionKey`)
- **`/stop`** jest kierowane do aktywnej sesji czatu, aby mogło przerwać bieżące uruchomienie.
- **Slack:** `channels.slack.slashCommand` nadal jest obsługiwane dla pojedynczego polecenia w stylu `/openclaw`. Jeśli włączysz `commands.native`, musisz utworzyć w Slack jedno slash command dla każdego wbudowanego polecenia (o tych samych nazwach co `/help`). Menu argumentów poleceń dla Slack są dostarczane jako efemeryczne przyciski Block Kit.
  - Natywny wyjątek Slack: zarejestruj `/agentstatus` (nie `/status`), ponieważ Slack rezerwuje `/status`. Tekstowe `/status` nadal działa w wiadomościach Slack.

## Pytania poboczne BTW

`/btw` to szybkie **pytanie poboczne** dotyczące bieżącej sesji.

W przeciwieństwie do zwykłego czatu:

- używa bieżącej sesji jako kontekstu w tle,
- działa jako osobne jednorazowe wywołanie **bez narzędzi**,
- nie zmienia przyszłego kontekstu sesji,
- nie jest zapisywane do historii transkryptu,
- jest dostarczane jako wynik poboczny na żywo zamiast zwykłej wiadomości asystenta.

To sprawia, że `/btw` jest przydatne, gdy chcesz uzyskać tymczasowe doprecyzowanie, podczas gdy główne
zadanie jest kontynuowane.

Przykład:

```text
/btw co teraz robimy?
```

Zobacz [BTW Side Questions](/pl/tools/btw), aby poznać pełne zachowanie i szczegóły UX klienta.
