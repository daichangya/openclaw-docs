---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie zmian łamiących kompatybilność konfiguracji
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia nieaktualną
konfigurację/stan, sprawdza kondycję i podaje możliwe do wykonania kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezobsługowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez promptów (w tym kroki naprawy restartu/usługi/sandboxa, jeśli mają zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez promptów (naprawy + restarty tam, gdzie to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

```bash
openclaw doctor --non-interactive
```

Uruchamia bez promptów i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przeniesienia stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia człowieka.
Starsze migracje stanu uruchamiają się automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway (launchd/systemd/schtasks).

Jeśli chcesz przejrzeć zmiany przed zapisem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
- Kontrola aktualności protokołu UI (przebudowuje interfejs Control UI, gdy schemat protokołu jest nowszy).
- Kontrola stanu + prompt restartu.
- Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) i status Plugin.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniu dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
- Kontrola wymagań wstępnych TLS dla profili OpenAI Codex OAuth.
- Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktów manifestu Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola dostarczenia/payload najwyższego poziomu, payload `provider`, proste zadania awaryjne Webhook z `notify: true`).
- Inspekcja plików blokad sesji i czyszczenie nieaktualnych blokad.
- Kontrole integralności stanu i uprawnień (sesje, transkrypty, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
- Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżać wygasające tokeny i raportuje stany cooldown/disabled profili uwierzytelniania.
- Wykrywanie dodatkowego katalogu obszaru roboczego (`~/openclaw`).
- Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
- Migracja starszej usługi i wykrywanie dodatkowych Gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole środowiska wykonawczego Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
- Ostrzeżenia o stanie kanałów (sondowane z działającego Gateway).
- Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
- Kontrole dobrych praktyk środowiska wykonawczego Gateway (Node vs Bun, ścieżki menedżera wersji).
- Diagnostyka kolizji portu Gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych polityk DM.
- Kontrole uwierzytelniania Gateway dla lokalnego trybu tokenu (oferuje wygenerowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji tokenu SecretRef).
- Wykrywanie problemów z parowaniem urządzeń (oczekujące pierwszorazowe żądania pairingu, oczekujące podniesienia roli/zakresu, nieaktualny lokalny dryf cache tokenu urządzenia oraz dryf uwierzytelniania sparowanych rekordów).
- Kontrola `linger` systemd w Linuksie.
- Kontrola rozmiaru plików bootstrap obszaru roboczego (ostrzeżenia o obcięciu/bliskości limitu dla plików kontekstowych).
- Kontrola stanu autouzupełniania powłoki oraz automatyczna instalacja/aktualizacja.
- Kontrola gotowości dostawcy embeddings dla wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niedopasowanie workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Backfill i reset Dreams UI

Scena Dreams w interfejsie Control UI zawiera akcje **Backfill**, **Reset** i **Clear Grounded**
dla ugruntowanego przepływu Dreaming. Te akcje używają metod RPC
w stylu doctor Gateway, ale **nie** są częścią naprawy/migracji CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym
  obszarze roboczym, uruchamia ugruntowany przebieg pamiętnika REM i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa tylko oznaczone wpisy pamiętnika backfill z `DREAMS.md`.
- **Clear Grounded** usuwa tylko przygotowane ugruntowane wpisy krótkoterminowe, które
  pochodzą z historycznego odtwarzania i nie zgromadziły jeszcze wsparcia z aktywnego przywołania ani dnia.

Czego same nie robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przygotowują automatycznie ugruntowanych kandydatów do aktywnego magazynu promocji krótkoterminowej, chyba że wcześniej jawnie uruchomisz ścieżkę CLI dla stagingu

Jeśli chcesz, aby ugruntowane historyczne odtwarzanie wpływało na normalną ścieżkę głębokiej promocji,
użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje ugruntowanych trwałych kandydatów w magazynie krótkoterminowego Dreaming, przy
jednoczesnym zachowaniu `DREAMS.md` jako powierzchni przeglądu.

## Szczegółowe zachowanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli jest to checkout git i doctor działa interaktywnie, oferuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego
schematu.

Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare
kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy dostawcy.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą
o uruchomienie `openclaw doctor`.

Doctor:

- Wyjaśnia, które starsze klucze zostały znalezione.
- Pokazuje zastosowaną migrację.
- Przepisuje `~/.openclaw/openclaw.json` z użyciem zaktualizowanego schematu.

Gateway również automatycznie uruchamia migracje doctor przy starcie, gdy wykryje
starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji.
Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

Bieżące migracje:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` najwyższego poziomu
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` i `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` i `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` i `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` i `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Dla kanałów z nazwanymi `accounts`, ale z zalegającymi wartościami kanału jednokontowego najwyższego poziomu, przenieś te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyslny cel)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuń `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)

Ostrzeżenia doctor zawierają też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że fallback routing może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodałeś `models.providers.opencode`, `opencode-zen` lub `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić używanie niewłaściwego API dla modeli albo wyzerować koszty. Doctor ostrzega, aby
można było usunąć nadpisanie i przywrócić routing per model API + koszty.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do bieżącego modelu podłączania host-local Chrome MCP:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje też ścieżkę host-local Chrome MCP, gdy używasz `defaultProfile:
"user"` albo skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych
  profili auto-connect
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspect przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć ustawienia po stronie Chrome za Ciebie. Host-local Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gateway/node
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zatwierdzenia pierwszego promptu zgody na podłączenie w przeglądarce

Gotowość w tym miejscu dotyczy tylko wymagań wstępnych lokalnego podłączenia. Existing-session zachowuje
obecne ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobrań i akcje wsadowe, nadal wymagają zarządzanej
przeglądarki lub surowego profilu CDP.

Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych
przepływów bezgłowych. One nadal używają surowego CDP.

### 2d) Wymagania wstępne TLS dla OAuth

Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje punkt
autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi
zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na
przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat
samopodpisany), doctor wypisuje wskazówki naprawy specyficzne dla platformy. Na
macOS z Node z Homebrew naprawą jest zwykle `brew postinstall ca-certificates`. Z
`--deep` sonda uruchamia się nawet wtedy, gdy gateway jest zdrowy.

### 2c) Nadpisania dostawcy Codex OAuth

Jeśli wcześniej dodałeś starsze ustawienia transportu OpenAI pod
`models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę
dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor
ostrzega, gdy widzi te stare ustawienia transportu obok Codex OAuth, aby można
było usunąć lub przepisać nieaktualne nadpisanie transportu i odzyskać
wbudowane zachowanie routingu/fallbacku. Niestandardowe proxy i nadpisania
wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego ostrzeżenia.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypty:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są wykonywane w trybie best-effort i są idempotentne; doctor emituje
ostrzeżenia, jeśli pozostawi jakiekolwiek starsze katalogi jako kopie zapasowe.
Gateway/CLI również automatycznie migrują starsze sesje + katalog agenta przy
starcie, dzięki czemu historia/uwierzytelnianie/modele trafiają do ścieżki per agent
bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane
tylko przez `openclaw doctor`. Normalizacja Talk provider/provider-map porównuje
teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy
nie wywołują już powtarzających się pustych zmian `doctor --fix`.

### 3a) Migracje starszych manifestów Plugin

Doctor skanuje wszystkie zainstalowane manifesty Plugin pod kątem przestarzałych
kluczy możliwości najwyższego poziomu (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Po ich znalezieniu proponuje przeniesienie ich do obiektu
`contracts` i przepisanie pliku manifestu na miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany bez
duplikowania danych.

### 3b) Migracje starszego magazynu Cron

Doctor sprawdza również magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie
lub `cron.store`, gdy został nadpisany) pod kątem starych kształtów zadań, które
harmonogram nadal akceptuje dla zgodności.

Bieżące porządki Cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload najwyższego poziomu (`message`, `model`, `thinking`, ...) → `payload`
- pola dostarczenia najwyższego poziomu (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy dostarczenia `provider` w payload → jawne `delivery.channel`
- proste starsze zadania awaryjne Webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to
zrobić bez zmiany zachowania. Jeśli zadanie łączy starszy awaryjny fallback
powiadomień z istniejącym trybem dostarczenia innym niż webhook, doctor ostrzega
i pozostawia takie zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików
blokady zapisu — plików pozostawionych po nienormalnym zakończeniu sesji. Dla
każdego znalezionego pliku blokady raportuje: ścieżkę, PID, czy PID nadal
działa, wiek blokady i czy jest uznawana za nieaktualną (martwy PID lub starsza
niż 30 minut). W trybie `--fix` / `--repair` automatycznie usuwa nieaktualne
pliki blokady; w przeciwnym razie wypisuje notatkę i instruuje, aby uruchomić
ponownie z `--fix`.

### 4) Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu. Jeśli zniknie, tracisz sesje,
poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega przed katastrofalną utratą stanu, proponuje odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i emituje wskazówkę `chown`, gdy wykryje niedopasowanie właściciela/grupy).
- **Katalog stanu synchronizowany przez chmurę na macOS**: ostrzega, gdy stan rozwiązuje się pod iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki wspierane przez synchronizację mogą powodować wolniejsze I/O
  i wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux na SD lub eMMC**: ostrzega, gdy stan rozwiązuje się do źródła montowania `mmcblk*`,
  ponieważ losowe I/O na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do utrwalania historii i unikania awarii `ENOENT`.
- **Niedopasowanie transkryptu**: ostrzega, gdy ostatnie wpisy sesji mają brakujące
  pliki transkryptów.
- **Główna sesja „1-line JSONL”**: oznacza sytuację, gdy główny transkrypt ma tylko jedną
  linię (historia się nie kumuluje).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele katalogów `~/.openclaw` w różnych
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje gdzie indziej (historia może
  zostać podzielona między instalacje).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na zdalnym hoście (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  odczytywalny dla grupy/świata i proponuje zaostrzenie do `600`.

### 5) Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny
wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic lub
ścieżkę setup-token Anthropic.
Prompty odświeżania pojawiają się tylko przy uruchomieniu interaktywnym (TTY); `--non-interactive`
pomija próby odświeżania.

Gdy odświeżanie OAuth trwale się nie powiedzie (na przykład `refresh_token_reused`,
`invalid_grant` lub dostawca każe zalogować się ponownie), doctor zgłasza,
że wymagane jest ponowne uwierzytelnienie, i wypisuje dokładne polecenie `openclaw models auth login --provider ...`,
które należy uruchomić.

Doctor raportuje również profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

- krótkich okresów cooldown (limity, timeouty, błędy uwierzytelniania)
- dłuższych wyłączeń (błędy rozliczeń/kredytu)

### 6) Walidacja modelu Hooks

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje referencję modelu względem
katalogu i allowlisty i ostrzega, gdy nie da się jej rozwiązać lub jest niedozwolona.

### 7) Naprawa obrazu sandboxa

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje ich
zbudowanie lub przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.

### 7b) Zależności wykonawcze dołączonych Plugin

Doctor weryfikuje zależności wykonawcze tylko dla dołączonych Plugin aktywnych w
bieżącej konfiguracji lub włączonych przez domyślne ustawienie ich dołączonego manifestu, na przykład
`plugins.entries.discord.enabled: true`, starsze
`channels.discord.enabled: true` lub domyślnie włączony dołączony dostawca. Jeśli
czegoś brakuje, doctor raportuje pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`. Zewnętrzne Pluginy nadal
używają `openclaw plugins install` / `openclaw plugins update`; doctor nie
instaluje zależności dla dowolnych ścieżek Plugin.

Gateway i lokalne CLI mogą też naprawiać zależności wykonawcze aktywnych dołączonych Plugin
na żądanie przed importem dołączonego Plugin. Te instalacje są
ograniczone do katalogu instalacji runtime Plugin, uruchamiane z wyłączonymi skryptami, nie
zapisują locka pakietu i są chronione blokadą katalogu instalacji, tak aby równoległe uruchomienia CLI
lub Gateway nie modyfikowały jednocześnie tego samego drzewa `node_modules`.

### 8) Migracje usługi Gateway i wskazówki czyszczenia

Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i
proponuje ich usunięcie oraz instalację usługi OpenClaw przy użyciu bieżącego portu gateway.
Może też skanować w poszukiwaniu dodatkowych usług podobnych do gateway i wypisywać wskazówki czyszczenia.
Usługi Gateway OpenClaw nazwane od profilu są traktowane jako pełnoprawne i nie są
oznaczane jako „extra”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy migawkę przed migracją, a następnie
uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie
starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a
start jest kontynuowany. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 8c) Pairing urządzeń i dryf uwierzytelniania

Doctor teraz sprawdza stan pairingu urządzeń jako część normalnego przebiegu kontroli kondycji.

Co raportuje:

- oczekujące żądania pierwszorazowego pairingu
- oczekujące podniesienia ról dla już sparowanych urządzeń
- oczekujące podniesienia zakresów dla już sparowanych urządzeń
- naprawy niedopasowania klucza publicznego, gdy identyfikator urządzenia nadal się zgadza, ale tożsamość urządzenia
  nie zgadza się już z zatwierdzonym rekordem
- sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
- sparowane tokeny, których zakresy dryfują poza zatwierdzoną bazę pairingu
- lokalne wpisy cache tokenu urządzenia dla bieżącej maszyny, które poprzedzają
  rotację tokenu po stronie gateway lub zawierają nieaktualne metadane zakresu

Doctor nie zatwierdza automatycznie żądań pairingu ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego
wypisuje dokładne kolejne kroki:

- sprawdź oczekujące żądania za pomocą `openclaw devices list`
- zatwierdź dokładne żądanie za pomocą `openclaw devices approve <requestId>`
- zrotuj świeży token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
- usuń i zatwierdź ponownie nieaktualny rekord za pomocą `openclaw devices remove <deviceId>`

To zamyka częstą lukę „już sparowane, ale nadal pojawia się pairing required”:
doctor rozróżnia teraz pierwszy pairing od oczekujących podniesień roli/zakresu
oraz od nieaktualnego dryfu tokenu/tożsamości urządzenia.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez allowlisty lub
gdy polityka jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby
gateway pozostawał aktywny po wylogowaniu.

### 11) Status obszaru roboczego (Skills, Pluginy i starsze katalogi)

Doctor wypisuje podsumowanie stanu obszaru roboczego dla domyślnego agenta:

- **Status Skills**: liczba Skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlistę.
- **Starsze katalogi obszaru roboczego**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi obszaru roboczego
  istnieją obok bieżącego obszaru roboczego.
- **Status Plugin**: liczba załadowanych/wyłączonych/błędnych Plugin; wypisuje identyfikatory Plugin dla wszelkich
  błędów; raportuje możliwości dołączonych Plugin.
- **Ostrzeżenia zgodności Plugin**: oznacza Pluginy, które mają problemy zgodności z
  bieżącym środowiskiem wykonawczym.
- **Diagnostyka Plugin**: pokazuje wszelkie ostrzeżenia lub błędy czasu ładowania emitowane przez
  rejestr Plugin.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap obszaru roboczego (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstowe) są blisko lub ponad skonfigurowanym
budżetem znaków. Raportuje per plik liczbę znaków surowych vs. wstrzykniętych, procent
obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcinane lub blisko limitu,
doctor wypisuje wskazówki dostrajania `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Uzupełnianie powłoki

Doctor sprawdza, czy uzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki
(zsh, bash, fish lub PowerShell):

- Jeśli profil powłoki używa wolnego dynamicznego wzorca uzupełniania
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem cache.
- Jeśli uzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache,
  doctor automatycznie regeneruje cache.
- Jeśli uzupełnianie w ogóle nie jest skonfigurowane, doctor proponuje jego instalację
  (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

### 12) Kontrole uwierzytelniania Gateway (lokalny token)

Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem Gateway.

- Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne źródło tokenu, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzane przez SecretRef, ale niedostępne, doctor ostrzega i nie nadpisuje go jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano żadnego tokenu SecretRef.

### 12b) Naprawy tylko do odczytu świadome SecretRef

Niektóre przepływy naprawy muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w środowisku wykonawczym.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status dla ukierunkowanych napraw konfiguracji.
- Przykład: naprawa `allowFrom` / `groupAllowFrom` z `@username` dla Telegram próbuje użyć skonfigurowanych poświadczeń bota, gdy są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane-ale-niedostępne, i pomija automatyczne rozwiązywanie zamiast się zawieszać albo błędnie zgłaszać brak tokenu.

### 13) Kontrola stanu Gateway + restart

Doctor uruchamia kontrolę stanu i proponuje restart Gateway, gdy wygląda on na
niezdrowy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddings dla wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i możliwa do uruchomienia.
  Jeśli nie, wypisuje wskazówki naprawcze, w tym pakiet npm i ręczną opcję ścieżki do binarki.
- **Jawny dostawca lokalny**: sprawdza lokalny plik modelu lub rozpoznawalny
  zdalny/pobieralny URL modelu. Jeśli go brakuje, sugeruje przełączenie na zdalnego dostawcę.
- **Jawny dostawca zdalny** (`openai`, `voyage` itp.): weryfikuje, czy klucz API jest
  obecny w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wypisuje możliwe do wykonania wskazówki naprawcze.
- **Dostawca auto**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego zdalnego
  dostawcy w kolejności automatycznego wyboru.

Gdy dostępny jest wynik sondy gateway (gateway był zdrowy w czasie
kontroli), doctor porównuje go z konfiguracją widoczną dla CLI i odnotowuje
wszelkie rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddings w środowisku wykonawczym.

### 14) Ostrzeżenia o stanie kanałów

Jeśli gateway jest zdrowy, doctor uruchamia sondę stanu kanałów i zgłasza
ostrzeżenia wraz z sugerowanymi naprawami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem
brakujących lub nieaktualnych wartości domyślnych (np. zależności systemd network-online oraz
opóźnienia restartu). Gdy znajdzie niedopasowanie, zaleca aktualizację i może
przepisać plik usługi/zadanie do bieżących wartości domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne prompty naprawy.
- `openclaw doctor --repair` stosuje zalecane naprawy bez promptów.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja/naprawa usługi przez doctor waliduje SecretRef, ale nie utrwala rozwiązanego jawnego tekstu tokenu w metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i pokazuje możliwe do wykonania wskazówki.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę do czasu jawnego ustawienia trybu.
- Dla jednostek user-systemd w Linuksie kontrole dryfu tokenu doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` przy porównywaniu metadanych uwierzytelniania usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka środowiska wykonawczego Gateway + portu

Doctor sprawdza środowisko wykonawcze usługi (PID, status ostatniego wyjścia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza również kolizje portów
na porcie gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już
działa, tunel SSH).

### 17) Dobre praktyki środowiska wykonawczego Gateway

Doctor ostrzega, gdy usługa gateway działa na Bun albo na ścieżce Node zarządzanej przez menedżera wersji
(`nvm`, `fnm`, `volta`, `asdf` itp.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżerów wersji mogą psuć się po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node,
gdy jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor utrwala wszelkie zmiany konfiguracji i zapisuje metadane kreatora, aby odnotować
uruchomienie doctor.

### 19) Wskazówki dotyczące obszaru roboczego (backup + system pamięci)

Doctor sugeruje system pamięci obszaru roboczego, gdy go brakuje, i wypisuje wskazówkę dotyczącą backupu,
jeśli obszar roboczy nie jest już pod kontrolą git.

Pełny przewodnik po strukturze obszaru roboczego i backupie git (zalecane prywatne GitHub lub GitLab) znajdziesz w [/concepts/agent-workspace](/pl/concepts/agent-workspace).

## Powiązane

- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Runbook Gateway](/pl/gateway)
