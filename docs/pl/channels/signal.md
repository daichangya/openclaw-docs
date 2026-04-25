---
read_when:
    - Konfigurowanie obsługi Signal
    - Debugowanie wysyłania/odbierania Signal
summary: Obsługa Signal przez `signal-cli` (JSON-RPC + SSE), ścieżki konfiguracji i model numerów
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Status: zewnętrzna integracja CLI. Gateway komunikuje się z `signal-cli` przez HTTP JSON-RPC + SSE.

## Wymagania wstępne

- OpenClaw zainstalowany na serwerze (poniższy przepływ dla Linuksa testowany na Ubuntu 24).
- `signal-cli` dostępny na hoście, na którym działa gateway.
- Numer telefonu, który może odebrać jeden weryfikacyjny SMS (dla ścieżki rejestracji SMS).
- Dostęp do przeglądarki dla captcha Signal (`signalcaptchas.org`) podczas rejestracji.

## Szybka konfiguracja (dla początkujących)

1. Użyj **oddzielnego numeru Signal** dla bota (zalecane).
2. Zainstaluj `signal-cli` (Java jest wymagana, jeśli używasz kompilacji JVM).
3. Wybierz jedną ścieżkę konfiguracji:
   - **Ścieżka A (łączenie przez QR):** `signal-cli link -n "OpenClaw"` i zeskanuj kod w Signal.
   - **Ścieżka B (rejestracja SMS):** zarejestruj dedykowany numer przy użyciu captcha + weryfikacji SMS.
4. Skonfiguruj OpenClaw i uruchom ponownie gateway.
5. Wyślij pierwszą wiadomość DM i zatwierdź parowanie (`openclaw pairing approve signal <CODE>`).

Minimalna konfiguracja:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Opis pól:

| Pole        | Opis                                              |
| ----------- | ------------------------------------------------- |
| `account`   | Numer telefonu bota w formacie E.164 (`+15551234567`) |
| `cliPath`   | Ścieżka do `signal-cli` (`signal-cli`, jeśli jest w `PATH`) |
| `dmPolicy`  | Zasada dostępu do DM (`pairing` zalecane)         |
| `allowFrom` | Numery telefonów lub wartości `uuid:<id>`, które mogą pisać na DM |

## Czym to jest

- Kanał Signal przez `signal-cli` (nie osadzony libsignal).
- Deterministyczny routing: odpowiedzi zawsze wracają do Signal.
- DM współdzielą główną sesję agenta; grupy są izolowane (`agent:<agentId>:signal:group:<groupId>`).

## Zapis do konfiguracji

Domyślnie Signal może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model numerów (ważne)

- Gateway łączy się z **urządzeniem Signal** (kontem `signal-cli`).
- Jeśli uruchomisz bota na **swoim osobistym koncie Signal**, będzie ignorować Twoje własne wiadomości (ochrona przed pętlą).
- Jeśli chcesz, by „piszę do bota i on odpowiada”, użyj **oddzielnego numeru bota**.

## Ścieżka konfiguracji A: połącz istniejące konto Signal (QR)

1. Zainstaluj `signal-cli` (kompilacja JVM lub natywna).
2. Połącz konto bota:
   - `signal-cli link -n "OpenClaw"` a następnie zeskanuj kod QR w Signal.
3. Skonfiguruj Signal i uruchom gateway.

Przykład:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Obsługa wielu kont: użyj `channels.signal.accounts` z konfiguracją per konto i opcjonalnym `name`. Zobacz [`gateway/configuration`](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec.

## Ścieżka konfiguracji B: zarejestruj dedykowany numer bota (SMS, Linux)

Użyj tej ścieżki, jeśli chcesz dedykowany numer bota zamiast łączenia istniejącego konta aplikacji Signal.

1. Zdobądź numer, który może odbierać SMS-y (lub weryfikację głosową dla linii stacjonarnych).
   - Użyj dedykowanego numeru bota, aby uniknąć konfliktów kont/sesji.
2. Zainstaluj `signal-cli` na hoście gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jeśli używasz kompilacji JVM (`signal-cli-${VERSION}.tar.gz`), najpierw zainstaluj JRE 25+.
Aktualizuj `signal-cli`; upstream zaznacza, że stare wydania mogą przestać działać wraz ze zmianami API serwerów Signal.

3. Zarejestruj i zweryfikuj numer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jeśli wymagana jest captcha:

1. Otwórz `https://signalcaptchas.org/registration/generate.html`.
2. Ukończ captcha, skopiuj docelowy link `signalcaptcha://...` z „Open Signal”.
3. W miarę możliwości uruchom z tego samego zewnętrznego IP co sesja przeglądarki.
4. Natychmiast uruchom rejestrację ponownie (tokeny captcha szybko wygasają):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Skonfiguruj OpenClaw, uruchom ponownie gateway, zweryfikuj kanał:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Sparuj nadawcę DM:
   - Wyślij dowolną wiadomość na numer bota.
   - Zatwierdź kod na serwerze: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Zapisz numer bota jako kontakt w telefonie, aby uniknąć „Unknown contact”.

Ważne: rejestrowanie konta numeru telefonu przez `signal-cli` może wylogować główną sesję aplikacji Signal dla tego numeru. Preferuj dedykowany numer bota albo użyj trybu łączenia przez QR, jeśli musisz zachować istniejącą konfigurację aplikacji na telefonie.

Odnośniki upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Przepływ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Przepływ łączenia: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Tryb zewnętrznego demona (httpUrl)

Jeśli chcesz samodzielnie zarządzać `signal-cli` (powolne zimne starty JVM, inicjalizacja kontenera lub współdzielone CPU), uruchom demona osobno i wskaż go w OpenClaw:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

To pomija automatyczne uruchamianie i oczekiwanie przy starcie wewnątrz OpenClaw. Przy wolnych startach podczas auto-uruchamiania ustaw `channels.signal.startupTimeoutMs`.

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.signal.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing to domyślna wymiana tokenów dla DM w Signal. Szczegóły: [Pairing](/pl/channels/pairing)
- Nadawcy tylko z UUID (z `sourceUuid`) są zapisywani jako `uuid:<id>` w `channels.signal.allowFrom`.

Grupy:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kontroluje, kto może wywoływać w grupach, gdy ustawione jest `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` może nadpisywać zachowanie grupy przez `requireMention`, `tools` i `toolsBySender`.
- Użyj `channels.signal.accounts.<id>.groups` dla nadpisań per konto w konfiguracjach wielokontowych.
- Uwaga środowiska wykonawczego: jeśli `channels.signal` całkowicie nie istnieje, środowisko wykonawcze wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

## Jak to działa (zachowanie)

- `signal-cli` działa jako demon; gateway odczytuje zdarzenia przez SSE.
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału.
- Odpowiedzi są zawsze kierowane z powrotem do tego samego numeru lub grupy.

## Media i limity

- Tekst wychodzący jest dzielony na części zgodnie z `channels.signal.textChunkLimit` (domyślnie 4000).
- Opcjonalne dzielenie po nowych liniach: ustaw `channels.signal.chunkMode="newline"`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- Załączniki są obsługiwane (base64 pobierane z `signal-cli`).
- Załączniki notatek głosowych używają nazwy pliku `signal-cli` jako awaryjnego MIME, gdy brakuje `contentType`, dzięki czemu transkrypcja audio może nadal klasyfikować notatki głosowe AAC.
- Domyślny limit mediów: `channels.signal.mediaMaxMb` (domyślnie 8).
- Użyj `channels.signal.ignoreAttachments`, aby pominąć pobieranie mediów.
- Kontekst historii grup używa `channels.signal.historyLimit` (lub `channels.signal.accounts.*.historyLimit`), z ustawieniem awaryjnym do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).

## Wskaźniki pisania i potwierdzenia odczytu

- **Wskaźniki pisania**: OpenClaw wysyła sygnały pisania przez `signal-cli sendTyping` i odświeża je, gdy trwa generowanie odpowiedzi.
- **Potwierdzenia odczytu**: gdy `channels.signal.sendReadReceipts` ma wartość true, OpenClaw przekazuje potwierdzenia odczytu dla dozwolonych DM.
- Signal-cli nie udostępnia potwierdzeń odczytu dla grup.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=signal`.
- Cele: nadawca E.164 lub UUID (użyj `uuid:<id>` z wyniku pairingu; sam UUID też działa).
- `messageId` to znacznik czasu Signal wiadomości, na którą reagujesz.
- Reakcje grupowe wymagają `targetAuthor` lub `targetAuthorUuid`.

Przykłady:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguracja:

- `channels.signal.actions.reactions`: włączanie/wyłączanie akcji reakcji (domyślnie true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` wyłącza reakcje agenta (narzędzie wiadomości `react` zwróci błąd).
  - `minimal`/`extensive` włącza reakcje agenta i ustawia poziom wskazówek.
- Nadpisania per konto: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cele dostarczania (CLI/cron)

- DM: `signal:+15551234567` (lub zwykły E.164).
- DM z UUID: `uuid:<id>` (lub sam UUID).
- Grupy: `signal:group:<groupId>`.
- Nazwy użytkownika: `username:<name>` (jeśli są obsługiwane przez Twoje konto Signal).

## Rozwiązywanie problemów

Najpierw uruchom tę drabinkę:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Następnie w razie potrzeby potwierdź stan pairingu DM:

```bash
openclaw pairing list signal
```

Typowe problemy:

- Demon jest osiągalny, ale brak odpowiedzi: sprawdź ustawienia konta/demona (`httpUrl`, `account`) i tryb odbioru.
- DM są ignorowane: nadawca oczekuje na zatwierdzenie pairingu.
- Wiadomości grupowe są ignorowane: bramkowanie nadawcy/wzmianek grupowych blokuje dostarczenie.
- Błędy walidacji konfiguracji po edycjach: uruchom `openclaw doctor --fix`.
- Brak Signal w diagnostyce: potwierdź `channels.signal.enabled: true`.

Dodatkowe kontrole:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Przepływ triage: [/channels/troubleshooting](/pl/channels/troubleshooting).

## Uwagi dotyczące bezpieczeństwa

- `signal-cli` przechowuje lokalnie klucze konta (zwykle `~/.local/share/signal-cli/data/`).
- Wykonaj kopię zapasową stanu konta Signal przed migracją serwera lub przebudową.
- Zachowaj `channels.signal.dmPolicy: "pairing"`, chyba że celowo chcesz szerszy dostęp do DM.
- Weryfikacja SMS jest potrzebna tylko do rejestracji lub odzyskiwania, ale utrata kontroli nad numerem/kontem może skomplikować ponowną rejestrację.

## Dokumentacja referencyjna konfiguracji (Signal)

Pełna konfiguracja: [Configuration](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.signal.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.signal.account`: E.164 dla konta bota.
- `channels.signal.cliPath`: ścieżka do `signal-cli`.
- `channels.signal.httpUrl`: pełny URL demona (nadpisuje host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: powiązanie demona (domyślnie 127.0.0.1:8080).
- `channels.signal.autoStart`: automatyczne uruchamianie demona (domyślnie true, jeśli `httpUrl` nie jest ustawione).
- `channels.signal.startupTimeoutMs`: limit czasu oczekiwania na start w ms (maks. 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: pomija pobieranie załączników.
- `channels.signal.ignoreStories`: ignoruje stories z demona.
- `channels.signal.sendReadReceipts`: przekazuje potwierdzenia odczytu.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.signal.allowFrom`: allowlista DM (E.164 lub `uuid:<id>`). `open` wymaga `"*"`. Signal nie ma nazw użytkownika; używaj identyfikatorów telefonu/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.signal.groupAllowFrom`: allowlista nadawców grupowych.
- `channels.signal.groups`: nadpisania per grupa kluczowane identyfikatorem grupy Signal (lub `"*"`). Obsługiwane pola: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: wersja `channels.signal.groups` per konto dla konfiguracji wielokontowych.
- `channels.signal.historyLimit`: maksymalna liczba wiadomości grupowych uwzględnianych jako kontekst (0 wyłącza).
- `channels.signal.dmHistoryLimit`: limit historii DM w turach użytkownika. Nadpisania per użytkownik: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: rozmiar fragmentu wychodzącego (znaki).
- `channels.signal.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.signal.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB).

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (Signal nie obsługuje natywnych wzmianek).
- `messages.groupChat.mentionPatterns` (globalne ustawienie awaryjne).
- `messages.responsePrefix`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
