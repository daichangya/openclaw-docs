---
read_when:
    - Dodawanie lub modyfikowanie migracji doctor
    - Wprowadzanie niekompatybilnych zmian konfiguracji
summary: 'Polecenie Doctor: kontrole stanu, migracje konfiguracji i kroki naprawcze'
title: Doctor
x-i18n:
    generated_at: "2026-04-08T02:15:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3761a222d9db7088f78215575fa84e5896794ad701aa716e8bf9039a4424dca6
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` to narzędzie naprawy i migracji dla OpenClaw. Naprawia
nieaktualną konfigurację i stan, sprawdza kondycję systemu oraz podaje
konkretne kroki naprawcze.

## Szybki start

```bash
openclaw doctor
```

### Tryb bezgłowy / automatyzacja

```bash
openclaw doctor --yes
```

Akceptuje domyślne opcje bez pytań (w tym kroki naprawy restartu/usługi/sandboxa, gdy mają zastosowanie).

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

Uruchamia bez pytań i stosuje tylko bezpieczne migracje (normalizacja konfiguracji + przenoszenie stanu na dysku). Pomija działania restartu/usługi/sandboxa, które wymagają potwierdzenia człowieka.
Migracje starszego stanu są uruchamiane automatycznie po ich wykryciu.

```bash
openclaw doctor --deep
```

Skanuje usługi systemowe pod kątem dodatkowych instalacji gatewaya (launchd/systemd/schtasks).

Jeśli chcesz przejrzeć zmiany przed zapisaniem, najpierw otwórz plik konfiguracji:

```bash
cat ~/.openclaw/openclaw.json
```

## Co robi (podsumowanie)

- Opcjonalna aktualizacja przed uruchomieniem dla instalacji z gita (tylko interaktywnie).
- Sprawdzenie aktualności protokołu UI (przebudowuje Control UI, gdy schemat protokołu jest nowszy).
- Kontrola stanu + monit o restart.
- Podsumowanie stanu Skills (kwalifikujące się/brakujące/zablokowane) oraz stanu pluginów.
- Normalizacja konfiguracji dla starszych wartości.
- Migracja konfiguracji Talk ze starszych płaskich pól `talk.*` do `talk.provider` + `talk.providers.<provider>`.
- Kontrole migracji przeglądarki dla starszych konfiguracji rozszerzenia Chrome i gotowości Chrome MCP.
- Ostrzeżenia o nadpisaniu dostawcy OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Ostrzeżenia o przesłanianiu Codex OAuth (`models.providers.openai-codex`).
- Sprawdzenie wymagań TLS OAuth dla profili OpenAI Codex OAuth.
- Migracja starszego stanu na dysku (sesje/katalog agenta/uwierzytelnianie WhatsApp).
- Migracja starszych kluczy kontraktu manifestu pluginu (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migracja starszego magazynu cron (`jobId`, `schedule.cron`, pola delivery/payload na najwyższym poziomie, `provider` w payload, proste zadania zapasowe webhooka z `notify: true`).
- Inspekcja plików blokady sesji i czyszczenie nieaktualnych blokad.
- Kontrole integralności i uprawnień stanu (sesje, transkrypty, katalog stanu).
- Kontrole uprawnień pliku konfiguracji (`chmod 600`) przy uruchomieniu lokalnym.
- Kondycja uwierzytelniania modeli: sprawdza wygaśnięcie OAuth, może odświeżyć wygasające tokeny i raportuje stany cooldown/wyłączenia profilu uwierzytelniania.
- Wykrywanie dodatkowego katalogu workspace (`~/openclaw`).
- Naprawa obrazu sandboxa, gdy sandboxing jest włączony.
- Migracja starszych usług i wykrywanie dodatkowych gatewayów.
- Migracja starszego stanu kanału Matrix (w trybie `--fix` / `--repair`).
- Kontrole środowiska uruchomieniowego gatewaya (usługa zainstalowana, ale nie działa; zapisany w pamięci podręcznej label launchd).
- Ostrzeżenia o stanie kanałów (sondowane z działającego gatewaya).
- Audyt konfiguracji supervisora (launchd/systemd/schtasks) z opcjonalną naprawą.
- Kontrole dobrych praktyk środowiska uruchomieniowego gatewaya (Node vs Bun, ścieżki menedżera wersji).
- Diagnostyka kolizji portu gatewaya (domyślnie `18789`).
- Ostrzeżenia bezpieczeństwa dla otwartych zasad DM.
- Kontrole uwierzytelniania gatewaya dla lokalnego trybu tokena (oferuje wygenerowanie tokena, gdy nie istnieje żadne źródło tokena; nie nadpisuje konfiguracji tokenów SecretRef).
- Sprawdzenie `systemd linger` w systemie Linux.
- Sprawdzenie rozmiaru plików bootstrap workspace (ostrzeżenia o obcięciu / zbliżaniu się do limitu dla plików kontekstowych).
- Sprawdzenie stanu autouzupełniania powłoki i automatyczna instalacja/aktualizacja.
- Sprawdzenie gotowości dostawcy embeddingów wyszukiwania pamięci (model lokalny, zdalny klucz API lub binarka QMD).
- Kontrole instalacji ze źródeł (niezgodność workspace pnpm, brakujące zasoby UI, brakująca binarka tsx).
- Zapisuje zaktualizowaną konfigurację + metadane kreatora.

## Szczegółowe działanie i uzasadnienie

### 0) Opcjonalna aktualizacja (instalacje z gita)

Jeśli jest to checkout z gita i doctor działa interaktywnie, oferuje
aktualizację (fetch/rebase/build) przed uruchomieniem doctor.

### 1) Normalizacja konfiguracji

Jeśli konfiguracja zawiera starsze kształty wartości (na przykład `messages.ackReaction`
bez nadpisania specyficznego dla kanału), doctor normalizuje je do bieżącego
schematu.

Dotyczy to także starszych płaskich pól Talk. Obecna publiczna konfiguracja Talk to
`talk.provider` + `talk.providers.<provider>`. Doctor przepisuje stare kształty
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` do mapy dostawców.

### 2) Migracje starszych kluczy konfiguracji

Gdy konfiguracja zawiera przestarzałe klucze, inne polecenia odmawiają działania i proszą,
aby uruchomić `openclaw doctor`.

Doctor wykona wtedy:

- Wyjaśni, które starsze klucze zostały znalezione.
- Pokaże zastosowaną migrację.
- Przepisze `~/.openclaw/openclaw.json` z użyciem zaktualizowanego schematu.

Gateway uruchamia także migracje doctor automatycznie przy starcie, gdy wykryje
starszy format konfiguracji, dzięki czemu nieaktualne konfiguracje są naprawiane
bez ręcznej interwencji.
Migracje magazynu zadań cron są obsługiwane przez `openclaw doctor --fix`.

Bieżące migracje:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → najwyższy poziom `bindings`
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
- Dla kanałów z nazwanymi `accounts`, ale z pozostałymi jednokontowymi wartościami kanału na najwyższym poziomie, przenieś te wartości przypisane do konta do wybranego promowanego konta dla tego kanału (`accounts.default` dla większości kanałów; Matrix może zachować istniejący pasujący nazwany/domyslny cel)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- usuń `browser.relayBindHost` (starsze ustawienie relay rozszerzenia)

Ostrzeżenia doctor obejmują też wskazówki dotyczące domyślnego konta dla kanałów wielokontowych:

- Jeśli skonfigurowano dwa lub więcej wpisów `channels.<channel>.accounts` bez `channels.<channel>.defaultAccount` lub `accounts.default`, doctor ostrzega, że routing zapasowy może wybrać nieoczekiwane konto.
- Jeśli ustawiono `channels.<channel>.defaultAccount` na nieznany identyfikator konta, doctor ostrzega i wyświetla listę skonfigurowanych identyfikatorów kont.

### 2b) Nadpisania dostawcy OpenCode

Jeśli ręcznie dodano `models.providers.opencode`, `opencode-zen` lub `opencode-go`,
nadpisuje to wbudowany katalog OpenCode z `@mariozechner/pi-ai`.
Może to wymusić użycie niewłaściwego API dla modeli albo wyzerować koszty. Doctor ostrzega, aby
można było usunąć nadpisanie i przywrócić routing API oraz koszty dla każdego modelu.

### 2c) Migracja przeglądarki i gotowość Chrome MCP

Jeśli konfiguracja przeglądarki nadal wskazuje na usuniętą ścieżkę rozszerzenia Chrome, doctor
normalizuje ją do obecnego modelu dołączania Chrome MCP lokalnego dla hosta:

- `browser.profiles.*.driver: "extension"` zmienia się na `"existing-session"`
- `browser.relayBindHost` jest usuwane

Doctor audytuje też lokalną dla hosta ścieżkę Chrome MCP, gdy używasz `defaultProfile:
"user"` albo skonfigurowanego profilu `existing-session`:

- sprawdza, czy Google Chrome jest zainstalowany na tym samym hoście dla domyślnych
  profili automatycznego łączenia
- sprawdza wykrytą wersję Chrome i ostrzega, gdy jest niższa niż Chrome 144
- przypomina o włączeniu zdalnego debugowania na stronie inspekcji przeglądarki (na
  przykład `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  lub `edge://inspect/#remote-debugging`)

Doctor nie może włączyć ustawienia po stronie Chrome za Ciebie. Lokalny dla hosta Chrome MCP
nadal wymaga:

- przeglądarki opartej na Chromium 144+ na hoście gatewaya/noda
- lokalnie uruchomionej przeglądarki
- włączonego zdalnego debugowania w tej przeglądarce
- zatwierdzenia pierwszego monitu o zgodę na dołączenie w przeglądarce

Gotowość w tym miejscu dotyczy wyłącznie wymagań wstępnych lokalnego dołączania. Existing-session zachowuje
obecne ograniczenia tras Chrome MCP; zaawansowane trasy, takie jak `responsebody`, eksport PDF,
przechwytywanie pobierania i działania wsadowe, nadal wymagają zarządzanej
przeglądarki lub surowego profilu CDP.

To sprawdzenie **nie** dotyczy Docker, sandbox, remote-browser ani innych
przepływów bezgłowych. One nadal używają surowego CDP.

### 2d) Wymagania TLS OAuth

Gdy skonfigurowany jest profil OpenAI Codex OAuth, doctor sonduje punkt końcowy
autoryzacji OpenAI, aby sprawdzić, czy lokalny stos TLS Node/OpenSSL potrafi
zweryfikować łańcuch certyfikatów. Jeśli sonda zakończy się błędem certyfikatu (na
przykład `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, wygasły certyfikat lub certyfikat własny),
doctor wyświetla wskazówki naprawcze specyficzne dla platformy. W systemie macOS z Node z Homebrew
naprawą jest zwykle `brew postinstall ca-certificates`. Z `--deep` sonda działa
nawet wtedy, gdy gateway jest zdrowy.

### 2c) Nadpisania dostawcy Codex OAuth

Jeśli wcześniej dodano starsze ustawienia transportu OpenAI w
`models.providers.openai-codex`, mogą one przesłaniać wbudowaną ścieżkę
dostawcy Codex OAuth, której nowsze wydania używają automatycznie. Doctor ostrzega, gdy wykryje
te stare ustawienia transportu razem z Codex OAuth, aby można było usunąć lub przepisać
nieaktualne nadpisanie transportu i odzyskać wbudowane zachowanie routingu/fallbacku.
Niestandardowe proxy i nadpisania samych nagłówków są nadal obsługiwane i nie
wywołują tego ostrzeżenia.

### 3) Migracje starszego stanu (układ na dysku)

Doctor może migrować starsze układy na dysku do bieżącej struktury:

- Magazyn sesji + transkrypty:
  - z `~/.openclaw/sessions/` do `~/.openclaw/agents/<agentId>/sessions/`
- Katalog agenta:
  - z `~/.openclaw/agent/` do `~/.openclaw/agents/<agentId>/agent/`
- Stan uwierzytelniania WhatsApp (Baileys):
  - ze starszego `~/.openclaw/credentials/*.json` (z wyjątkiem `oauth.json`)
  - do `~/.openclaw/credentials/whatsapp/<accountId>/...` (domyślny identyfikator konta: `default`)

Te migracje są realizowane w trybie best-effort i są idempotentne; doctor wyemituje ostrzeżenia, gdy
pozostawi jakiekolwiek starsze foldery jako kopie zapasowe. Gateway/CLI również automatycznie migruje
starsze sesje + katalog agenta przy starcie, dzięki czemu historia/uwierzytelnianie/modele trafiają do
ścieżki per-agent bez ręcznego uruchamiania doctor. Uwierzytelnianie WhatsApp jest celowo
migrowane tylko przez `openclaw doctor`. Normalizacja dostawcy/mapy dostawców Talk porównuje teraz
według równości strukturalnej, więc różnice wyłącznie w kolejności kluczy nie wywołują już
powtarzanych zmian bez efektu przez `doctor --fix`.

### 3a) Migracje starszych manifestów pluginów

Doctor skanuje wszystkie zainstalowane manifesty pluginów pod kątem przestarzałych kluczy
możliwości na najwyższym poziomie (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Gdy je znajdzie, oferuje przeniesienie ich do obiektu `contracts`
i przepisanie pliku manifestu w miejscu. Ta migracja jest idempotentna;
jeśli klucz `contracts` ma już te same wartości, starszy klucz jest usuwany
bez duplikowania danych.

### 3b) Migracje starszego magazynu cron

Doctor sprawdza także magazyn zadań cron (`~/.openclaw/cron/jobs.json` domyślnie,
lub `cron.store`, jeśli został nadpisany) pod kątem starych kształtów zadań, które harmonogram
nadal akceptuje ze względów kompatybilności.

Bieżące porządki cron obejmują:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- pola payload na najwyższym poziomie (`message`, `model`, `thinking`, ...) → `payload`
- pola delivery na najwyższym poziomie (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliasy delivery `provider` w payload → jawne `delivery.channel`
- proste starsze zadania zapasowe webhooka `notify: true` → jawne `delivery.mode="webhook"` z `delivery.to=cron.webhook`

Doctor automatycznie migruje zadania `notify: true` tylko wtedy, gdy może to zrobić bez
zmiany zachowania. Jeśli zadanie łączy starszy zapasowy mechanizm notify z istniejącym
trybem delivery innym niż webhook, doctor ostrzega i pozostawia to zadanie do ręcznego przeglądu.

### 3c) Czyszczenie blokad sesji

Doctor skanuje każdy katalog sesji agenta w poszukiwaniu nieaktualnych plików blokady zapisu — plików
pozostawionych po nieprawidłowym zakończeniu sesji. Dla każdego znalezionego pliku blokady raportuje:
ścieżkę, PID, czy PID nadal żyje, wiek blokady i czy jest
uznawana za nieaktualną (martwy PID lub więcej niż 30 minut). W trybie `--fix` / `--repair`
automatycznie usuwa nieaktualne pliki blokady; w przeciwnym razie wyświetla notatkę i
instrukcję, aby uruchomić ponownie z `--fix`.

### 4) Kontrole integralności stanu (trwałość sesji, routing i bezpieczeństwo)

Katalog stanu to operacyjny pień mózgu systemu. Jeśli zniknie, stracisz
sesje, poświadczenia, logi i konfigurację (chyba że masz kopie zapasowe gdzie indziej).

Doctor sprawdza:

- **Brak katalogu stanu**: ostrzega o katastrofalnej utracie stanu, proponuje odtworzenie
  katalogu i przypomina, że nie może odzyskać brakujących danych.
- **Uprawnienia katalogu stanu**: weryfikuje możliwość zapisu; oferuje naprawę uprawnień
  (i wyświetla wskazówkę `chown`, gdy wykryje niezgodność właściciela/grupy).
- **Katalog stanu synchronizowany z chmurą w macOS**: ostrzega, gdy stan znajduje się pod iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) lub
  `~/Library/CloudStorage/...`, ponieważ ścieżki oparte na synchronizacji mogą powodować wolniejsze I/O
  oraz wyścigi blokad/synchronizacji.
- **Katalog stanu na Linux na SD lub eMMC**: ostrzega, gdy stan znajduje się na źródle montowania `mmcblk*`,
  ponieważ losowe I/O na nośnikach SD lub eMMC może być wolniejsze i szybciej zużywać nośnik
  przy zapisie sesji i poświadczeń.
- **Brak katalogów sesji**: `sessions/` i katalog magazynu sesji są
  wymagane do trwałego zapisywania historii i unikania awarii `ENOENT`.
- **Niezgodność transkryptu**: ostrzega, gdy ostatnie wpisy sesji mają brakujące
  pliki transkryptu.
- **Główna sesja „1-wierszowy JSONL”**: sygnalizuje, gdy główny transkrypt ma tylko jeden
  wiersz (historia się nie gromadzi).
- **Wiele katalogów stanu**: ostrzega, gdy istnieje wiele folderów `~/.openclaw` w różnych
  katalogach domowych lub gdy `OPENCLAW_STATE_DIR` wskazuje inne miejsce (historia może się
  rozdzielać między instalacjami).
- **Przypomnienie o trybie zdalnym**: jeśli `gateway.mode=remote`, doctor przypomina, aby uruchomić
  go na zdalnym hoście (tam znajduje się stan).
- **Uprawnienia pliku konfiguracji**: ostrzega, jeśli `~/.openclaw/openclaw.json` jest
  czytelny dla grupy/świata i oferuje zaostrzenie do `600`.

### 5) Kondycja uwierzytelniania modeli (wygaśnięcie OAuth)

Doctor sprawdza profile OAuth w magazynie uwierzytelniania, ostrzega, gdy tokeny
wygasają lub wygasły, i może je odświeżyć, gdy jest to bezpieczne. Jeśli profil
OAuth/token Anthropic jest nieaktualny, sugeruje użycie klucza API Anthropic albo
ścieżki setup-token Anthropic.
Monity o odświeżenie pojawiają się tylko w trybie interaktywnym (TTY); `--non-interactive`
pomija próby odświeżenia.

Doctor raportuje też profile uwierzytelniania, które są tymczasowo nieużywalne z powodu:

- krótkich cooldownów (rate limits/timeouts/błędy uwierzytelniania)
- dłuższych wyłączeń (problemy z rozliczeniami/kredytem)

### 6) Walidacja modelu hooks

Jeśli ustawiono `hooks.gmail.model`, doctor waliduje odwołanie do modelu względem
katalogu i listy dozwolonych modeli oraz ostrzega, gdy nie będzie się rozwiązywać lub jest niedozwolone.

### 7) Naprawa obrazu sandboxa

Gdy sandboxing jest włączony, doctor sprawdza obrazy Docker i oferuje ich zbudowanie lub
przełączenie na starsze nazwy, jeśli obecny obraz nie istnieje.

### 7b) Zależności uruchomieniowe bundlowanych pluginów

Doctor weryfikuje, czy zależności uruchomieniowe bundlowanych pluginów (na przykład
pakiety uruchomieniowe pluginu Discord) są obecne w katalogu głównym instalacji OpenClaw.
Jeśli którychś brakuje, doctor raportuje pakiety i instaluje je w trybie
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migracje usług gatewaya i wskazówki dotyczące czyszczenia

Doctor wykrywa starsze usługi gatewaya (launchd/systemd/schtasks) i
oferuje ich usunięcie oraz instalację usługi OpenClaw z użyciem bieżącego portu gatewaya.
Może też skanować w poszukiwaniu dodatkowych usług podobnych do gatewaya i wyświetlać wskazówki porządkowe.
Usługi gatewaya OpenClaw nazwane według profilu są traktowane jako pełnoprawne i nie są
oznaczane jako „dodatkowe”.

### 8b) Migracja Matrix przy starcie

Gdy konto kanału Matrix ma oczekującą lub możliwą do wykonania migrację starszego stanu,
doctor (w trybie `--fix` / `--repair`) tworzy snapshot przed migracją, a następnie
uruchamia kroki migracji w trybie best-effort: migrację starszego stanu Matrix oraz przygotowanie starszego
stanu szyfrowanego. Oba kroki nie są krytyczne; błędy są logowane, a
uruchamianie jest kontynuowane. W trybie tylko do odczytu (`openclaw doctor` bez `--fix`) to sprawdzenie
jest całkowicie pomijane.

### 9) Ostrzeżenia bezpieczeństwa

Doctor emituje ostrzeżenia, gdy dostawca jest otwarty na DM bez listy dozwolonych,
albo gdy zasada jest skonfigurowana w niebezpieczny sposób.

### 10) systemd linger (Linux)

Jeśli działa jako usługa użytkownika systemd, doctor upewnia się, że lingering jest włączony, aby
gateway pozostał aktywny po wylogowaniu.

### 11) Stan workspace (Skills, pluginy i starsze katalogi)

Doctor wyświetla podsumowanie stanu workspace dla domyślnego agenta:

- **Stan Skills**: liczba skills kwalifikujących się, z brakującymi wymaganiami i zablokowanych przez allowlistę.
- **Starsze katalogi workspace**: ostrzega, gdy `~/openclaw` lub inne starsze katalogi workspace
  istnieją obok bieżącego workspace.
- **Stan pluginów**: liczba załadowanych/wyłączonych/pluginów z błędami; wyświetla identyfikatory pluginów dla wszystkich
  błędów; raportuje możliwości bundlowanych pluginów.
- **Ostrzeżenia o zgodności pluginów**: oznacza pluginy, które mają problemy ze zgodnością z
  bieżącym środowiskiem uruchomieniowym.
- **Diagnostyka pluginów**: pokazuje wszelkie ostrzeżenia lub błędy z czasu ładowania emitowane przez
  rejestr pluginów.

### 11b) Rozmiar pliku bootstrap

Doctor sprawdza, czy pliki bootstrap workspace (na przykład `AGENTS.md`,
`CLAUDE.md` lub inne wstrzykiwane pliki kontekstowe) są blisko skonfigurowanego
limitu znaków lub go przekraczają. Raportuje dla każdego pliku liczbę surowych i wstrzykniętych znaków,
procent obcięcia, przyczynę obcięcia (`max/file` lub `max/total`) oraz łączną liczbę wstrzykniętych
znaków jako ułamek całkowitego budżetu. Gdy pliki są obcięte lub blisko limitu,
doctor wyświetla wskazówki dotyczące dostrojenia `agents.defaults.bootstrapMaxChars`
i `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autouzupełnianie powłoki

Doctor sprawdza, czy autouzupełnianie tabulatorem jest zainstalowane dla bieżącej powłoki
(zsh, bash, fish lub PowerShell):

- Jeśli profil powłoki używa wolnego dynamicznego wzorca autouzupełniania
  (`source <(openclaw completion ...)`), doctor aktualizuje go do szybszego
  wariantu z plikiem cache.
- Jeśli autouzupełnianie jest skonfigurowane w profilu, ale brakuje pliku cache,
  doctor automatycznie odtwarza cache.
- Jeśli autouzupełnianie nie jest w ogóle skonfigurowane, doctor proponuje jego instalację
  (tylko w trybie interaktywnym; pomijane z `--non-interactive`).

Uruchom `openclaw completion --write-state`, aby ręcznie odtworzyć cache.

### 12) Kontrole uwierzytelniania gatewaya (lokalny token)

Doctor sprawdza gotowość lokalnego uwierzytelniania tokenem gatewaya.

- Jeśli tryb tokena potrzebuje tokena i nie istnieje żadne źródło tokena, doctor proponuje jego wygenerowanie.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale niedostępny, doctor ostrzega i nie nadpisuje go jawnym tekstem.
- `openclaw doctor --generate-gateway-token` wymusza generowanie tylko wtedy, gdy nie skonfigurowano tokena SecretRef.

### 12b) Naprawy świadome SecretRef w trybie tylko do odczytu

Niektóre ścieżki naprawy muszą sprawdzać skonfigurowane poświadczenia bez osłabiania zachowania fail-fast w runtime.

- `openclaw doctor --fix` używa teraz tego samego modelu podsumowania SecretRef tylko do odczytu co polecenia z rodziny status dla ukierunkowanych napraw konfiguracji.
- Przykład: naprawa Telegram `allowFrom` / `groupAllowFrom` `@username` próbuje użyć skonfigurowanych poświadczeń bota, jeśli są dostępne.
- Jeśli token bota Telegram jest skonfigurowany przez SecretRef, ale niedostępny w bieżącej ścieżce polecenia, doctor zgłasza, że poświadczenie jest skonfigurowane-ale-niedostępne, i pomija automatyczne rozwiązywanie zamiast kończyć się awarią lub błędnie raportować brak tokena.

### 13) Kontrola stanu gatewaya + restart

Doctor uruchamia kontrolę stanu i oferuje restart gatewaya, gdy wygląda on na
niezdrowy.

### 13b) Gotowość wyszukiwania pamięci

Doctor sprawdza, czy skonfigurowany dostawca embeddingów wyszukiwania pamięci jest gotowy
dla domyślnego agenta. Zachowanie zależy od skonfigurowanego backendu i dostawcy:

- **Backend QMD**: sonduje, czy binarka `qmd` jest dostępna i daje się uruchomić.
  Jeśli nie, wyświetla wskazówki naprawcze, w tym pakiet npm i opcję ręcznej ścieżki do binarki.
- **Jawny dostawca lokalny**: sprawdza istnienie lokalnego pliku modelu lub rozpoznanego
  zdalnego/pobieralnego URL modelu. Jeśli go brakuje, sugeruje przełączenie na zdalnego dostawcę.
- **Jawny dostawca zdalny** (`openai`, `voyage` itd.): weryfikuje, czy klucz API jest
  obecny w środowisku lub magazynie uwierzytelniania. Jeśli go brakuje, wyświetla praktyczne wskazówki naprawcze.
- **Dostawca automatyczny**: najpierw sprawdza dostępność modelu lokalnego, a następnie próbuje każdego zdalnego
  dostawcę w kolejności automatycznego wyboru.

Gdy wynik sondy gatewaya jest dostępny (gateway był zdrowy w momencie
sprawdzenia), doctor porównuje go z konfiguracją widoczną z CLI i odnotowuje
wszelkie rozbieżności.

Użyj `openclaw memory status --deep`, aby zweryfikować gotowość embeddingów w runtime.

### 14) Ostrzeżenia o stanie kanałów

Jeśli gateway jest zdrowy, doctor uruchamia sondę stanu kanałów i zgłasza
ostrzeżenia wraz z sugerowanymi poprawkami.

### 15) Audyt konfiguracji supervisora + naprawa

Doctor sprawdza zainstalowaną konfigurację supervisora (launchd/systemd/schtasks) pod kątem
brakujących lub nieaktualnych ustawień domyślnych (np. zależności systemd od network-online i
opóźnienia restartu). Gdy wykryje niezgodność, rekomenduje aktualizację i może
przepisać plik usługi/zadanie do bieżących ustawień domyślnych.

Uwagi:

- `openclaw doctor` pyta przed przepisaniem konfiguracji supervisora.
- `openclaw doctor --yes` akceptuje domyślne monity naprawy.
- `openclaw doctor --repair` stosuje zalecane poprawki bez pytań.
- `openclaw doctor --repair --force` nadpisuje niestandardowe konfiguracje supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzany przez SecretRef, doctor podczas instalacji/naprawy usługi waliduje SecretRef, ale nie zapisuje rozwiązanych jawnych wartości tokena do metadanych środowiska usługi supervisora.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany token SecretRef nie jest rozwiązany, doctor blokuje ścieżkę instalacji/naprawy z konkretnymi wskazówkami.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, doctor blokuje instalację/naprawę, dopóki tryb nie zostanie ustawiony jawnie.
- W przypadku jednostek user-systemd w Linux, kontrole dryfu tokena w doctor obejmują teraz zarówno źródła `Environment=`, jak i `EnvironmentFile=` przy porównywaniu metadanych uwierzytelniania usługi.
- Zawsze możesz wymusić pełne przepisanie przez `openclaw gateway install --force`.

### 16) Diagnostyka środowiska uruchomieniowego gatewaya + portu

Doctor sprawdza środowisko uruchomieniowe usługi (PID, ostatni status zakończenia) i ostrzega, gdy
usługa jest zainstalowana, ale faktycznie nie działa. Sprawdza też kolizje portu
gatewaya (domyślnie `18789`) i raportuje prawdopodobne przyczyny (gateway już
działa, tunel SSH).

### 17) Najlepsze praktyki środowiska uruchomieniowego gatewaya

Doctor ostrzega, gdy usługa gatewaya działa na Bun lub na ścieżce Node zarządzanej przez menedżer wersji
(`nvm`, `fnm`, `volta`, `asdf` itd.). Kanały WhatsApp + Telegram wymagają Node,
a ścieżki menedżerów wersji mogą przestać działać po aktualizacjach, ponieważ usługa nie
ładuje inicjalizacji powłoki. Doctor oferuje migrację do systemowej instalacji Node, gdy
jest dostępna (Homebrew/apt/choco).

### 18) Zapis konfiguracji + metadane kreatora

Doctor utrwala wszystkie zmiany konfiguracji i zapisuje metadane kreatora, aby odnotować
uruchomienie doctor.

### 19) Wskazówki dotyczące workspace (kopia zapasowa + system pamięci)

Doctor sugeruje system pamięci workspace, jeśli go brakuje, i wyświetla wskazówkę dotyczącą kopii zapasowej,
jeśli workspace nie jest już pod kontrolą gita.

Zobacz [/concepts/agent-workspace](/pl/concepts/agent-workspace), aby przeczytać pełny przewodnik po
strukturze workspace i kopiach zapasowych w git (zalecane prywatne GitHub lub GitLab).
