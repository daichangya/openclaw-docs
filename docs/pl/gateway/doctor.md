---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niezgodnych zmian konfiguracji
summary: 'Polecenie doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-20T09:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` to narzędzie naprawcze + migracyjne dla OpenClaw. Naprawia nieaktualną konfigurację/stan, sprawdza kondycję systemu i podaje konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezgłowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje wartości domyślne bez pytań (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

```bash
openclaw doctor --repair
```

Stosuje zalecane naprawy bez pytań (naprawy + restarty tam, gdzie jest to bezpieczne).

```bash
openclaw doctor --repair --force
```

Stosuje także agresywne naprawy (nadpisuje niestandardowe konfiguracje supervisora).

```bash
openclaw doctor --non-interactive
```

Uruchamia bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/sandboxa wymagające potwierdzenia człowieka.
Migracje starszego stanu są uruchamiane automatycznie po wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway (launchd/systemd/schtasks).

Jeśli chcesz przejrzeć zmiany przed zapisaniem, najpierw otwórz plik konfiguracyjny:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji git (tylko interaktywnie).
- Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Kontrola stanu + monit o restart.
- Podsumowanie stanu Skills (dostępne/brakujące/zablokowane) i stanu Plugin.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniach dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Ostrzeżenia o przesłanianiu OAuth Codex (`models.providers.openai-codex`).
- Sprawdzenie wymagań TLS dla profili OAuth OpenAI Codex.
- Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu Cron (`jobId`, `schedule.cron`, pola delivery/payload na najwyższym poziomie, `provider` w payload, proste zadania zapasowe Webhook z `notify: true`).
- Inspekcja plików blokady sesji i czyszczenie nieaktualnych blokad.
- Kontrole integralności stanu i uprawnień (sesje, transkrypcje, katalog stanu).
- Kontrole uprawnień pliku konfiguracyjnego (`chmod 600`) przy uruchomieniu lokalnym.
- Stan uwierzytelniania modelu: sprawdza wygaśnięcie OAuth, może odświeżyć tokeny bliskie wygaśnięcia i raportuje stany cooldown/disabled profilu uwierzytelniania.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
- Migracja starszej usługi i wykrywanie dodatkowych Gateway.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole środowiska wykonawczego Gateway (usługa zainstalowana, ale nieuruchomiona; zbuforowana etykieta launchd).
- Ostrzeżenia o stanie kanałów (sprawdzane z działającego Gateway).
- Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
- Kontrole dobrych praktyk środowiska uruchomieniowego Gateway (Node vs Bun, ścieżki menedżera wersji).
- Diagnostyka konfliktu portu Gateway (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych zasad DM.
- Kontrole uwierzytelniania Gateway dla lokalnego trybu tokenu (oferuje generowanie tokenu, gdy nie istnieje źródło tokenu; nie nadpisuje konfiguracji tokenu SecretRef).
- Wykrywanie problemów z parowaniem urządzeń (oczekujące żądania pierwszego parowania, oczekujące podniesienia roli/zakresu, nieaktualny dryf lokalnej pamięci podręcznej tokenu urządzenia i dryf uwierzytelniania sparowanych rekordów).
- Kontrola `linger` systemd w Linuksie.
- Kontrola rozmiaru pliku bootstrap workspace (ostrzeżenia o przycięciu/bliskości limitu dla plików kontekstowych).
- Kontrola stanu uzupełniania powłoki i automatyczna instalacja/aktualizacja.
- Kontrola gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niedopasowanie workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Uzupełnianie i resetowanie Dreams UI

Scena Dreams w Control UI zawiera działania **Backfill**, **Reset** i **Clear Grounded** dla przepływu grounded dreaming. Działania te używają metod RPC w stylu doctor dla Gateway, ale **nie** są częścią naprawy/migracji w CLI `openclaw doctor`.

Co robią:

- **Backfill** skanuje historyczne pliki `memory/YYYY-MM-DD.md` w aktywnym workspace, uruchamia grounded REM diary pass i zapisuje odwracalne wpisy backfill do `DREAMS.md`.
- **Reset** usuwa z `DREAMS.md` tylko te oznaczone wpisy diary backfill.
- **Clear Grounded** usuwa tylko przygotowane krótkoterminowe wpisy wyłącznie grounded, które pochodzą z historycznego odtworzenia i nie zgromadziły jeszcze live recall ani dziennego wsparcia.

Czego same z siebie **nie** robią:

- nie edytują `MEMORY.md`
- nie uruchamiają pełnych migracji doctor
- nie przenoszą automatycznie kandydatów grounded do aktywnego magazynu promocji krótkoterminowej, chyba że najpierw jawnie uruchomisz przygotowaną ścieżkę CLI

Jeśli chcesz, aby grounded historical replay wpływał na normalną ścieżkę deep promotion, użyj zamiast tego przepływu CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

To przygotowuje grounded durable candidates w magazynie short-term dreaming, pozostawiając `DREAMS.md` jako powierzchnię przeglądu.

## Szczegółowe działanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje git)

Jeśli to checkout git i doctor działa interaktywnie, oferuje aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction` bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego schematu.

Obejmuje to starsze płaskie pola Talk. Bieżąca publiczna konfiguracja Talk to `talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` do mapy dostawców.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają uruchomienia i proszą o uruchomienie `openclaw doctor`.

Doctor wykona wtedy:

- Wyjaśni, które starsze klucze zostały znalezione.
- Pokaże zastosowaną migrację.
- Przepisze `~/.openclaw/openclaw.json` z użyciem zaktualizowanego schematu.

Gateway również automatycznie uruchamia migracje doctor przy starcie, gdy wykryje starszy format konfiguracji, więc nieaktualne konfiguracje są naprawiane bez ręcznej interwencji.
Migracje magazynu zadań Cron są obsługiwane przez `openclaw doctor --fix`.

Bieżące migracje:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` na najwyższym poziomie
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- starsze `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Dla kanałów z nazwanymi `accounts`, ale z pozostawionymi jednokontowymi wartościami kanału na najwyższym poziomie, przenosi te wartości o zakresie konta do promowanego konta wybranego dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyślny cel)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuwa `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)

Ostrzeżenia doctor obejmują także wskazówki dotyczące kont domyślnych dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` albo `accounts.default`, doctor ostrzega, że routowanie zapasowe może wybrać nieoczekiwane konto.
- Jeśli `channels.<channel>.defaultAccount` jest ustawione na nieznany identyfikator konta, doctor ostrzega i wypisuje skonfigurowane identyfikatory kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`, nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić użycie niewłaściwego API dla modeli albo wyzerować koszty. Doctor ostrzega, aby można było usunąć nadpisanie i przywrócić routowanie API oraz koszty per model.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor normalizuje ją do bieżącego modelu dołączania Chrome MCP hostowanego lokalnie:

- `browser.profiles.*.driver: "extension"` staje się `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje także lokalną ścieżkę Chrome MCP na hoście, gdy używasz `defaultProfile:"user"` lub skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych profili auto-connect
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspect przeglądarki (na przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć tego ustawienia po stronie Chrome za Ciebie. Lokalny Chrome MCP nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gateway/node
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zaakceptowania pierwszego monitu o zgodę na dołączenie w przeglądarce

Gotowość w tym miejscu dotyczy wyłącznie lokalnych warunków wstępnych dołączenia. Existing-session zachowuje bieżące ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF, przechwytywanie pobierania i działania wsadowe, nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP.

Ta kontrola **nie** dotyczy Docker, sandbox, remote-browser ani innych przepływów bezgłowych. One nadal używają surowego CDP.

### 2d) Wymagania wstępne OAuth TLS

Gdy skonfigurowany jest profil OAuth OpenAI Codex, doctor sonduje punkt autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi zweryfikować łańcuch certyfikatów. Jeśli sonda kończy się błędem certyfikatu (na przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat samopodpisany), doctor wyświetla wskazówki naprawy specyficzne dla platformy. W systemie macOS z Node z Homebrew naprawa zwykle polega na uruchomieniu `brew postinstall ca-certificates`. Z `--deep` sonda jest uruchamiana nawet wtedy, gdy Gateway jest w dobrym stanie.

### 2c) Nadpisania dostawcy Codex OAuth

Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w
`models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę
dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor
ostrzega, gdy wykryje te stare ustawienia transportu obok Codex OAuth, aby
umożliwić usunięcie lub przepisanie nieaktualnego nadpisania transportu i
przywrócenie wbudowanego routingu/zachowania fallback. Niestandardowe proxy i
nadpisania wyłącznie nagłówków są nadal obsługiwane i nie wywołują tego
ostrzeżenia.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypcje:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są wykonywane na zasadzie best-effort i są idempotentne; doctor emituje ostrzeżenia, gdy pozostawi starsze foldery jako kopie zapasowe. Gateway/CLI również automatycznie migruje starsze sesje + katalog agenta przy starcie, dzięki czemu historia/uwierzytelnianie/modele trafiają do ścieżki per-agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo migrowane wyłącznie przez `openclaw doctor`. Normalizacja dostawcy Talk/mapy dostawców porównuje teraz według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie wywołują już powtarzających się zmian bez efektu przy `doctor --fix`.

### 3a) Migracje starszych manifestów pluginów

Doctor skanuje wszystkie zainstalowane manifesty pluginów pod kątem przestarzałych kluczy możliwości na najwyższym poziomie (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Po wykryciu oferuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` zawiera już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu Cron

Doctor sprawdza także magazyn zadań Cron (`~/.openclaw/cron/jobs.json` domyślnie,
lub `cron.store`, jeśli został nadpisany) pod kątem starych kształtów zadań, które harmonogram nadal
akceptuje dla zgodności.

Bieżące porządki w Cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload na najwyższym poziomie (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery na najwyższym poziomie (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy delivery `provider` w payload → jawne `delivery.channel`
- proste starsze zadania zapasowe Webhook z `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić
bez zmiany zachowania. Jeśli zadanie łączy starszy mechanizm zapasowy notify z istniejącym
trybem delivery innym niż webhook, doctor ostrzega i pozostawia takie zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta pod kątem nieaktualnych plików blokady zapisu — plików pozostawionych
po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal działa, wiek blokady oraz czy jest
uznawana za nieaktualną (martwy PID lub starsza niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa nieaktualne pliki blokady; w przeciwnym razie wyświetla uwagę i
poleca ponowne uruchomienie z `--fix`.

### 4) Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu systemu. Jeśli zniknie, tracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i podaje wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
- **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan znajduje się w iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki wspierane synchronizacją mogą powodować wolniejsze I/O
  oraz wyścigi blokad/synchronizacji.
- **Katalog stanu na SD lub eMMC w Linuksie**: ostrzega, gdy stan znajduje się na źródle montowania `mmcblk*`,
  ponieważ losowe I/O oparte na SD lub eMMC może być wolniejsze i szybciej zużywać nośnik przy zapisach sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do zachowania historii i uniknięcia awarii `ENOENT`.
- **Niezgodność transkrypcji**: ostrzega, gdy ostatnie wpisy sesji nie mają
  odpowiadających plików transkrypcji.
- **Główna sesja „1-line JSONL”**: sygnalizuje, gdy główna transkrypcja ma tylko jedną
  linię (historia się nie kumuluje).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może
  dzielić się między instalacjami).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na hoście zdalnym (tam znajduje się stan).
- **Uprawnienia pliku konfiguracyjnego**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  czytelny dla grupy/świata, i oferuje zaostrzenie do `600`.

### 5) Stan uwierzytelniania modelu (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny
wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest nieaktualny, sugeruje klucz API Anthropic albo
ścieżkę setup-token Anthropic.
Monity o odświeżenie pojawiają się tylko w trybie interaktywnym (TTY); `--non-interactive`
pomija próby odświeżania.

Gdy odświeżenie OAuth kończy się trwałym błędem (na przykład `refresh_token_reused`,
`invalid_grant` albo dostawca informuje, że trzeba zalogować się ponownie), doctor zgłasza,
że wymagana jest ponowna autoryzacja, i wyświetla dokładne polecenie `openclaw models auth login --provider ...`,
które należy uruchomić.

Doctor raportuje także profile uwierzytelniania, które są tymczasowo niedostępne z powodu:

- krótkich okresów cooldown (limity szybkości/timeouty/błędy uwierzytelniania)
- dłuższych wyłączeń (problemy z rozliczeniami/kredytami)

### 6) Walidacja modelu Hooks

Jeśli ustawiono `hooks.gmail.model`, doctor weryfikuje odwołanie do modelu względem
katalogu i allowlisty oraz ostrzega, gdy nie zostanie rozwiązane albo jest niedozwolone.

### 7) Naprawa obrazu sandboxa

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i proponuje zbudowanie ich lub
przełączenie na starsze nazwy, jeśli bieżący obraz nie istnieje.

### 7b) Runtime dependencies bundlowanych pluginów

Doctor weryfikuje, czy runtime dependencies bundlowanych pluginów (na przykład pakiety
runtime pluginu Discord) są obecne w katalogu głównym instalacji OpenClaw.
Jeśli jakichkolwiek brakuje, doctor zgłasza pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migracje usług Gateway i wskazówki czyszczenia

Doctor wykrywa starsze usługi Gateway (launchd/systemd/schtasks) i
oferuje ich usunięcie oraz zainstalowanie usługi OpenClaw przy użyciu bieżącego portu Gateway.
Może także skanować w poszukiwaniu dodatkowych usług podobnych do Gateway i wyświetlać wskazówki czyszczenia.
Usługi Gateway OpenClaw nazwane profilem są traktowane jako pełnoprawne i nie są oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy snapshot przed migracją, a następnie
uruchamia kroki migracji best-effort: migrację starszego stanu Matrix i przygotowanie starszego stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a
uruchamianie trwa dalej. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) ta kontrola
jest całkowicie pomijana.

### 8c) Parowanie urządzeń i dryf uwierzytelniania

Doctor sprawdza teraz stan parowania urządzeń w ramach normalnego przebiegu kontroli stanu.

Co raportuje:

- oczekujące żądania pierwszego parowania
- oczekujące podniesienia ról dla już sparowanych urządzeń
- oczekujące podniesienia zakresów dla już sparowanych urządzeń
- naprawy niezgodności klucza publicznego, gdy identyfikator urządzenia nadal się zgadza, ale tożsamość urządzenia
  nie odpowiada już zatwierdzonemu rekordowi
- sparowane rekordy bez aktywnego tokenu dla zatwierdzonej roli
- sparowane tokeny, których zakresy odbiegają od zatwierdzonej bazy parowania
- lokalne wpisy pamięci podręcznej tokenu urządzenia dla bieżącej maszyny, które poprzedzają
  rotację tokenu po stronie gateway lub zawierają nieaktualne metadane zakresu

Doctor nie zatwierdza automatycznie żądań parowania ani nie rotuje automatycznie tokenów urządzeń. Zamiast tego
wyświetla dokładne kolejne kroki:

- sprawdź oczekujące żądania za pomocą `openclaw devices list`
- zatwierdź konkretne żądanie za pomocą `openclaw devices approve <requestId>`
- zrotuj nowy token za pomocą `openclaw devices rotate --device <deviceId> --role <role>`
- usuń nieaktualny rekord i zatwierdź go ponownie za pomocą `openclaw devices remove <deviceId>`

To zamyka częstą lukę „już sparowane, ale nadal pojawia się pairing required”:
doctor rozróżnia teraz pierwsze parowanie od oczekujących podniesień roli/zakresu
oraz od nieaktualnego dryfu tokenu/tożsamości urządzenia.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez allowlisty lub
gdy polityka jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że linger jest włączony, aby
gateway pozostał aktywny po wylogowaniu.

### 11) Stan workspace (Skills, pluginy i starsze katalogi)

Doctor wyświetla podsumowanie stanu workspace dla domyślnego agenta:

- **Stan Skills**: liczba Skills dostępnych, missing-requirements i allowlist-blocked.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Stan pluginów**: liczba pluginów loaded/disabled/errored; wypisuje identyfikatory pluginów dla
  błędów; raportuje możliwości bundlowanych pluginów.
- **Ostrzeżenia zgodności pluginów**: oznacza pluginy mające problemy zgodności z
  bieżącym runtime.
- **Diagnostyka pluginów**: pokazuje ostrzeżenia lub błędy z czasu ładowania emitowane przez
  rejestr pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstowe) są blisko lub przekraczają
skonfigurowany budżet znaków. Raportuje dla każdego pliku liczbę znaków raw vs. injected, procent
przycięcia, przyczynę przycięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są przycinane lub zbliżają się do limitu,
doctor wyświetla wskazówki dotyczące strojenia `agents.defaults.bootstrapMaxChars`
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
  (tylko tryb interaktywny; pomijane z `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie zregenerować cache.

### 12) Kontrole uwierzytelniania Gateway (token lokalny)

Doctor sprawdza gotowość uwierzytelniania tokenem lokalnego Gateway.

- Jeśli tryb tokenu wymaga tokenu i nie istnieje żadne jego źródło, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokenu SecretRef.

### 12b) Naprawy tylko do odczytu z uwzględnieniem SecretRef

Niektóre przepływy naprawcze muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status dla ukierunkowanych napraw konfiguracji.
- Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` z `@username` próbuje użyć skonfigurowanych poświadczeń bota, jeśli są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane-ale-niedostępne, i pomija automatyczne rozwiązywanie zamiast kończyć się awarią lub błędnie zgłaszać brak tokenu.

### 13) Kontrola stanu Gateway + restart

Doctor uruchamia kontrolę stanu i proponuje restart gateway, gdy wygląda
na niezdatny do pracy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddingów wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sprawdza, czy binarka `qmd` jest dostępna i może się uruchomić.
  Jeśli nie, wyświetla wskazówki naprawy, w tym pakiet npm i opcję ręcznej ścieżki do binarki.
- **Jawny dostawca lokalny**: sprawdza obecność lokalnego pliku modelu lub rozpoznawanego
  zdalnego/pobieralnego URL modelu. Jeśli go brakuje, sugeruje przełączenie na zdalnego dostawcę.
- **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest
  obecny w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wyświetla praktyczne wskazówki naprawy.
- **Dostawca auto**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego zdalnego
  dostawcę w kolejności automatycznego wyboru.

Gdy wynik sondy gateway jest dostępny (gateway był zdrowy w momencie
sprawdzenia), doctor porównuje jego wynik z konfiguracją widoczną dla CLI i wskazuje
wszelkie rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o stanie kanałów

Jeśli gateway jest w dobrym stanie, doctor uruchamia sondę stanu kanałów i zgłasza
ostrzeżenia wraz z sugerowanymi poprawkami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem
brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd network-online i
opóźnienia restartu). Gdy wykryje niezgodność, zaleca aktualizację i może
przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne monity naprawy.
- `openclaw doctor --repair` stosuje zalecane poprawki bez pytań.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzany przez SecretRef, instalacja/naprawa usługi doctor weryfikuje SecretRef, ale nie zapisuje rozwiązanego tokenu w jawnym tekście do metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy i podaje praktyczne wskazówki.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
- W przypadku jednostek user-systemd w Linuksie kontrole dryfu tokenu doctor uwzględniają teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` przy porównywaniu metadanych uwierzytelniania usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka runtime Gateway + portu

Doctor sprawdza runtime usługi (PID, ostatni status wyjścia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza także konflikty portów
na porcie gateway (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już
działa, tunel SSH).

### 17) Dobre praktyki runtime Gateway

Doctor ostrzega, gdy usługa gateway działa na Bun lub na ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżera wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki. Doctor proponuje migrację do systemowej instalacji Node, gdy
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor zapisuje wszelkie zmiany konfiguracji i oznacza metadane kreatora, aby zarejestrować
uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)

Doctor sugeruje system pamięci workspace, jeśli go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej,
jeśli workspace nie jest już pod kontrolą git.

Zobacz pełny przewodnik po strukturze workspace i kopii zapasowej git na stronie [/concepts/agent-workspace](/pl/concepts/agent-workspace) (zalecane prywatne GitHub lub GitLab).
