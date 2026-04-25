---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet.
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet.
    - Konfigurujesz Chrome, Chrome node lub Twilio jako transport Google Meet.
summary: 'Plugin Google Meet: dołączanie do jawnych URL-i Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T13:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Obsługa uczestnika Google Meet dla OpenClaw — Plugin jest celowo zaprojektowany w sposób jawny:

- Dołącza tylko do jawnego URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego URL.
- Domyślnym trybem jest głos `realtime`.
- Głos realtime może wywoływać z powrotem pełnego agenta OpenClaw, gdy potrzebne
  jest głębsze rozumowanie lub narzędzia.
- Agenci wybierają sposób dołączania przez `mode`: użyj `realtime` do
  na żywo słuchania/odpowiadania głosem, albo `transcribe`, aby dołączyć/kontrolować przeglądarkę bez
  mostu głosowego realtime.
- Uwierzytelnianie zaczyna się jako osobisty Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście Node.
- Twilio akceptuje numer dial-in oraz opcjonalny PIN albo sekwencję DTMF.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych
  przepływów telekonferencyjnych agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backendowego dostawcę głosu realtime.
OpenAI jest domyślny; Google Gemini Live również działa z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator
Homebrew wymaga restartu, zanim macOS udostępni urządzenie:

```bash
sudo reboot
```

Po restarcie sprawdź oba elementy:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Włącz Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Sprawdź konfigurację:

```bash
openclaw googlemeet setup
```

Dane wyjściowe konfiguracji są przeznaczone do odczytu przez agenta. Zgłaszają profil Chrome,
most audio, przypięcie Nodea, opóźnione wprowadzenie realtime oraz, gdy skonfigurowano delegację Twilio,
czy Plugin `voice-call` i dane uwierzytelniające Twilio są gotowe.
Traktuj każde sprawdzenie `ok: false` jako blokujące, zanim poprosisz agenta o dołączenie.
Użyj `openclaw googlemeet setup --json` dla skryptów lub wyjścia czytelnego maszynowo.

Dołącz do spotkania:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Albo pozwól agentowi dołączyć przez narzędzie `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Utwórz tylko URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano dane uwierzytelniające Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu UI przeglądarki.
- Fallback przeglądarkowy: używany, gdy brak danych uwierzytelniających OAuth. OpenClaw używa
  przypiętego Chrome Nodea, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego URL z kodem spotkania, a następnie zwraca ten URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na Nodezie był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet dotyczący mikrofonu przy pierwszym uruchomieniu; ten monit
  nie jest traktowany jako błąd logowania do Google.
  Przepływy dołączania i tworzenia również próbują ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe parametry zapytania URL, takie jak `authuser`, więc
  ponowna próba agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą kartę Chrome.

Dane wyjściowe polecenia/narzędzia zawierają pole `source` (`api` albo `browser`), aby agenci
mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko wygenerować URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego z głosem realtime i wyślij
mi link”. Agent powinien wywołać `google_meet` z `action: "create"` i
następnie udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko do obserwacji/kontroli przeglądarki ustaw `"mode": "transcribe"`. To
nie uruchamia dupleksowego mostu modelu realtime, więc nie będzie odzywać się z powrotem do
spotkania.

Podczas sesji realtime status `google_meet` obejmuje kondycję przeglądarki i mostu audio,
taką jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów oraz stan zamknięcia mostu. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsłuży go, kiedy może. Logowanie, dopuszczenie przez hosta oraz monity
o uprawnienia przeglądarki/OS są zgłaszane jako działanie ręczne z powodem i
komunikatem do przekazania przez agenta.

Chrome dołącza jako zalogowany profil Chrome. W Meet wybierz `BlackHole 2ch` jako
ścieżkę mikrofonu/głośnika używaną przez OpenClaw. Dla czystego dupleksowego audio używaj
osobnych urządzeń wirtualnych albo grafu w stylu Loopback; pojedyncze urządzenie BlackHole
wystarcza do pierwszego smoke testu, ale może powodować echo.

### Lokalny Gateway + Parallels Chrome

Nie potrzebujesz pełnego Gateway OpenClaw ani klucza API modelu wewnątrz maszyny wirtualnej macOS
tylko po to, aby VM posiadała Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
hosta Node w VM. Włącz dołączony Plugin w VM jeden raz, aby Node
ogłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: Gateway OpenClaw, obszar roboczy agenta, klucze modelu/API, dostawca
  realtime oraz konfiguracja Pluginu Google Meet.
- VM macOS w Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niewymagane w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po instalacji BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po restarcie sprawdź, czy VM widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom hosta Node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, Node odrzuca
jawny WebSocket, chyba że wyrazisz zgodę dla tej zaufanej sieci prywatnej:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania Nodea jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` to środowisko procesu, a nie
ustawienie `openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź Node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi Node i że ogłasza zarówno `googlemeet.chrome`,
jak i możliwość browser/`browser.proxy`:

```bash
openclaw nodes status
```

Skieruj Meet przez tego Nodea na hoście Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Teraz dołącz normalnie z hosta Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

albo poproś agenta o użycie narzędzia `google_meet` z `transport: "chrome-node"`.

Dla jednokomendowego smoke testu, który tworzy lub ponownie używa sesji,
wypowiada znaną frazę i wypisuje kondycję sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika Join/Ask
to join i akceptuje wybór Meet „Use microphone” przy pierwszym uruchomieniu, gdy ten monit
się pojawi. Podczas tworzenia spotkania tylko przez przeglądarkę może także przejść dalej przez
ten sam monit bez mikrofonu, jeśli Meet nie udostępnia przycisku użycia mikrofonu.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez hosta,
Chrome potrzebuje uprawnienia do mikrofonu/kamery albo Meet utknął na monicie,
którego automatyzacja nie mogła rozwiązać, wynik dołączenia/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać dołączanie, przekazać dokładnie
ten komunikat plus bieżące `browserUrl`/`browserTitle` i ponowić próbę dopiero po
zakończeniu ręcznej czynności w przeglądarce.

Jeśli pominięto `chromeNode.node`, OpenClaw automatycznie wybiera tylko wtedy, gdy dokładnie jeden
podłączony Node ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
podłączonych jest kilka zdolnych Nodeów, ustaw `chromeNode.node` na identyfikator Nodea,
nazwę wyświetlaną albo zdalny IP.

Typowe kontrole błędów:

- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser` zostały uruchomione w VM. Potwierdź też, że
  host Gateway zezwala na oba polecenia Nodea przez
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki w VM albo
  pozostaw ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki Nodea; upewnij się, że
  konfiguracja przeglądarki Nodea wskazuje profil, którego chcesz użyć, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  przeglądarkowe tworzenie spotkania ponownie używa trwającej karty `https://meet.google.com/new`
  albo monitu konta Google przed otwarciem kolejnej.
- Brak dźwięku: w Meet skieruj mikrofon/głośnik przez ścieżkę urządzenia wirtualnego
  używaną przez OpenClaw; używaj osobnych urządzeń wirtualnych albo routingu w stylu Loopback
  dla czystego dźwięku dupleksowego.

## Uwagi instalacyjne

Domyślna konfiguracja realtime Chrome używa dwóch narzędzi zewnętrznych:

- `sox`: narzędzie audio w wierszu poleceń. Plugin używa jego poleceń `rec` i `play`
  dla domyślnego mostu audio G.711 mu-law 8 kHz.
- `blackhole-2ch`: sterownik wirtualnego audio dla macOS. Tworzy urządzenie audio
  `BlackHole 2ch`, przez które Chrome/Meet mogą kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
zainstalowanie ich jako zależności hosta przez Homebrew. SoX ma licencję
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ma GPL-3.0. Jeśli budujesz
instalator lub urządzenie, które dołącza BlackHole do OpenClaw, sprawdź warunki licencji
upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet w Google Chrome i dołącza jako zalogowany
profil Chrome. Na macOS Plugin sprawdza `BlackHole 2ch` przed uruchomieniem.
Jeśli skonfigurowano, uruchamia również polecenie kondycji mostu audio i polecenie startowe
przed otwarciem Chrome. Używaj `chrome`, gdy Chrome/audio działają na hoście Gateway;
używaj `chrome-node`, gdy Chrome/audio działają na sparowanym Nodezie, takim jak VM macOS
w Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Przekierowuje audio mikrofonu i głośników Chrome przez lokalny most audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowane, dołączanie kończy się błędem konfiguracji
zamiast cichego dołączenia bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Pluginu Voice Call. Nie
parsuje stron Meet w celu znalezienia numerów telefonów.

Użyj tego, gdy udział przez Chrome nie jest dostępny albo gdy chcesz mieć
fallback dla połączenia telefonicznego. Google Meet musi udostępniać numer
dial-in i PIN dla spotkania; OpenClaw nie wykrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, a nie na Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // albo ustaw "twilio", jeśli Twilio ma być domyślne
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Podaj dane uwierzytelniające Twilio przez środowisko lub konfigurację. Środowisko pozwala
trzymać sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Po włączeniu `voice-call` uruchom ponownie albo przeładuj Gateway; zmiany konfiguracji Pluginu
nie pojawiają się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie sprawdź:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegacja Twilio jest podłączona, `googlemeet setup` zawiera udane kontrole
`twilio-voice-call-plugin` i `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Użyj `--dtmf-sequence`, gdy spotkanie wymaga niestandardowej sekwencji:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth i preflight

OAuth jest opcjonalny przy tworzeniu linku Meet, ponieważ `googlemeet create` może
przejść fallbackiem do automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz używać oficjalnego
tworzenia przez API, rozwiązywania przestrzeni lub kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta Google Cloud OAuth,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
wynikowy refresh token w konfiguracji Pluginu Google Meet albo podaj
zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz podłączony
Node, gdy używasz udziału przez przeglądarkę. OAuth służy tylko do oficjalnej
ścieżki Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni i uruchamiania
kontroli preflight Meet Media API.

### Utwórz dane uwierzytelniające Google

W Google Cloud Console:

1. Utwórz lub wybierz projekt Google Cloud.
2. Włącz dla tego projektu **Google Meet REST API**.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy, których żąda OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Utwórz identyfikator klienta OAuth.
   - Typ aplikacji: **Web application**.
   - Autoryzowany redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Skopiuj identyfikator klienta i client secret.

`meetings.space.created` jest wymagane przez Google Meet `spaces.create`.
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet do przestrzeni.
`meetings.conference.media.readonly` służy do preflightu Meet Media API i pracy z mediami;
Google może wymagać rejestracji w Developer Preview dla faktycznego użycia Media API.
Jeśli potrzebujesz tylko dołączania przez przeglądarkowy Chrome, całkowicie pomiń OAuth.

### Wygeneruj refresh token

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret`, albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z refresh tokenem. Używa PKCE,
lokalnego callbacka na `http://localhost:8085/oauth2callback` oraz ręcznego
przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może dotrzeć do lokalnego callbacka:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Dane wyjściowe JSON obejmują:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Zapisz obiekt `oauth` w konfiguracji Pluginu Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Preferuj zmienne środowiskowe, jeśli nie chcesz trzymać refresh tokena w konfiguracji.
Jeśli obecne są zarówno wartości z configu, jak i ze środowiska, Plugin najpierw rozwiązuje config,
a potem używa fallbacku środowiskowego.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet oraz dostęp do odczytu mediów konferencji Meet. Jeśli uwierzytelniałeś się przed dodaniem
obsługi tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby refresh
token miał zakres `meetings.space.created`.

### Zweryfikuj OAuth przez doctor

Uruchom OAuth doctor, gdy chcesz mieć szybką, bezsekretną kontrolę kondycji:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje runtime’u Chrome ani nie wymaga podłączonego Chrome Nodea. Sprawdza,
czy konfiguracja OAuth istnieje i czy refresh token może wygenerować access token. Raport
JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje access tokena,
refresh tokena ani client secreta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne są `oauth.clientId` plus `oauth.refreshToken` albo access token z cache.         |
| `oauth-token`        | Access token z cache jest nadal ważny albo refresh token wygenerował nowy access token. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejącą przestrzeń Meet.                  |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                    |

Aby dodatkowo potwierdzić włączenie Google Meet API i zakres `spaces.create`, uruchom
kontrolę create z efektem ubocznym:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy tymczasowy URL Meet. Użyj go, gdy chcesz potwierdzić,
że projekt Google Cloud ma włączone Meet API i że autoryzowane
konto ma zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu istniejącej
przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z tych kontroli
zwykle oznacza, że Google Meet REST API jest wyłączone, zatwierdzony refresh token
nie ma wymaganego zakresu albo konto Google nie ma dostępu do tej przestrzeni Meet.
Błąd refresh tokena oznacza, że trzeba ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Do fallbacku przeglądarkowego nie są potrzebne żadne dane uwierzytelniające OAuth. W tym trybie auth Google pochodzi z zalogowanego profilu Chrome na wybranym Nodezie, a nie z
konfiguracji OpenClaw.

Te zmienne środowiskowe są akceptowane jako fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż URL Meet, kod albo `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom preflight przed pracą z mediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i obecność po tym, jak Meet utworzy rekordy konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Przy `--meeting` polecenia `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy zachowany rekord
dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać URL spotkania z Google Calendar przed odczytem
artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` w poszukiwaniu wydarzenia Calendar z
linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz
`--calendar <id>` dla kalendarza innego niż podstawowy. Wyszukiwanie w kalendarzu wymaga świeżego
logowania OAuth, które obejmuje zakres readonly zdarzeń Calendar.
`calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które
wybiorą `latest`, `artifacts`, `attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, wskaż go bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Zapisz czytelny raport:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników,
nagrania, transkryptu, ustrukturyzowanych wpisów transkryptu i inteligentnych notatek, gdy
Google udostępnia je dla danego spotkania. Użyj `--no-transcript-entries`, aby pominąć
wyszukiwanie wpisów dla dużych spotkań. `attendance` rozwija uczestników do
wierszy sesji uczestników z czasami pierwszego/ostatniego pojawienia się, łącznym czasem trwania sesji,
flagami spóźnienia/wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego
użytkownika lub nazwy wyświetlanej. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby uczestników
osobno, `--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje katalog zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` oraz `manifest.json`.
`manifest.json` zapisuje wybrane wejście, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokena, wydarzenie Calendar, gdy zostało użyte, oraz
wszelkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby dodatkowo zapisać
przenośne archiwum obok katalogu. Przekaż `--include-doc-bodies`, aby
eksportować tekst powiązanych Dokumentów Google z transkrypcją i inteligentnymi notatkami przez Google Drive `files.export`; wymaga to
świeżego logowania OAuth obejmującego zakres readonly dla Drive Meet. Bez
`--include-doc-bodies` eksporty zawierają tylko metadane Meet i ustrukturyzowane
wpisy transkryptu. Jeśli Google zwróci częściowy błąd artefaktu, taki jak
lista inteligentnych notatek, wpis transkryptu albo błąd treści dokumentu Drive, podsumowanie i
manifest zachowują ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/obecności i wypisać
manifest JSON bez tworzenia katalogu ani ZIP. To jest przydatne przed zapisaniem
dużego eksportu albo gdy agent potrzebuje tylko liczników, wybranych rekordów i
ostrzeżeń.

Agenci mogą również utworzyć ten sam pakiet przez narzędzie `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Ustaw `"dryRun": true`, aby zwrócić tylko manifest eksportu i pominąć zapis plików.

Uruchom chroniony live smoke na prawdziwym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany URL Meet, kod albo
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` podaje identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` podaje
  refresh token.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oraz
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw fallback
  bez prefiksu `OPENCLAW_`.

Bazowy live smoke dla artefaktów/obecności wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` oraz
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie
w Calendar wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport
treści dokumentów z Drive wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz nową przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowe `meeting uri`, źródło oraz sesję dołączenia. Przy danych uwierzytelniających OAuth
używa oficjalnego Google Meet API. Bez danych uwierzytelniających OAuth używa
jako fallbacku zalogowanego profilu przeglądarki przypiętego Chrome Nodea. Agenci mogą
używać narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym
kroku. Aby tworzyć tylko URL, przekaż `"join": false`.

Przykładowe wyjście JSON z fallbacku przeglądarkowego:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Jeśli fallback przeglądarkowy napotka logowanie Google albo blokadę uprawnień Meet zanim
uda mu się utworzyć URL, metoda Gateway zwraca odpowiedź z błędem, a
narzędzie `google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Gdy agent widzi `manualActionRequired: true`, powinien zgłosić
`manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać otwierać nowe
karty Meet, dopóki operator nie wykona kroku w przeglądarce.

Przykładowe wyjście JSON z tworzenia przez API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Tworzenie Meet domyślnie dołącza. Transport Chrome albo Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo
błąd fallbacku przeglądarkowego i prosi operatora o dokończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
tożsamość OAuth i uczestnicy spotkania są zapisani do Google
Workspace Developer Preview Program dla Meet media APIs.

## Konfiguracja

Typowa ścieżka Chrome realtime wymaga tylko włączenia Pluginu, BlackHole, SoX
i klucza backendowego dostawcy głosu realtime. OpenAI jest domyślne; ustaw
`realtime.provider: "google"`, aby używać Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

Ustaw konfigurację Pluginu pod `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Wartości domyślne:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP Nodea dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet bez logowania
- `chrome.autoJoin: true`: best-effort wypełnienie nazwy gościa i kliknięcie Join Now
  przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuje istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: czeka, aż karta Meet zgłosi stan in-call
  przed uruchomieniem wprowadzenia realtime
- `chrome.audioInputCommand`: polecenie SoX `rec` zapisujące audio G.711 mu-law 8 kHz
  na stdout
- `chrome.audioOutputCommand`: polecenie SoX `play` odczytujące audio G.711 mu-law 8 kHz
  ze stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótka mówiona kontrola gotowości po podłączeniu mostu realtime;
  ustaw `""`, aby dołączyć po cichu

Opcjonalne nadpisania:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Powiedz dokładnie: Jestem tutaj.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Konfiguracja tylko dla Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` ma domyślnie wartość `true`; przy transporcie Twilio deleguje
rzeczywiste połączenie PSTN i DTMF do Pluginu Voice Call. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może walidować i rejestrować plan wybierania, ale nie może
wykonać połączenia Twilio.

## Narzędzie

Agenci mogą używać narzędzia `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway. Użyj
`transport: "chrome-node"`, gdy Chrome działa na sparowanym Nodezie, takim jak Parallels
VM. W obu przypadkach model realtime i `openclaw_agent_consult` działają na
hoście Gateway, więc dane uwierzytelniające modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby natychmiast kazać agentowi realtime
mówić. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
wywołać znaną frazę i zwrócić kondycję `inCall`, gdy host Chrome może ją
zgłosić. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` obejmuje kondycję Chrome, gdy jest dostępna:

- `inCall`: Chrome wydaje się być wewnątrz rozmowy Meet
- `micMuted`: best-effort stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez hosta Meet, uprawnień lub
  naprawy sterowania przeglądarką, zanim mowa zacznie działać
- `providerConnected` / `realtimeReady`: stan mostu głosu realtime
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostu lub wysłane do niego

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Powiedz dokładnie: Jestem tutaj i słucham."
}
```

## Konsultacja agenta realtime

Tryb realtime Chrome jest zoptymalizowany pod kątem pętli głosowej na żywo. Dostawca
głosu realtime słyszy audio spotkania i mówi przez skonfigurowany most audio.
Gdy model realtime potrzebuje głębszego rozumowania, bieżących informacji lub zwykłych
narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia za kulisami zwykłego agenta OpenClaw z kontekstem
ostatniego transkryptu spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej realtime. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem do
spotkania. Używa tego samego współdzielonego narzędzia konsultacyjnego realtime co Voice Call.

`realtime.toolPolicy` steruje uruchomieniem konsultacji:

- `safe-read-only`: udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępnia narzędzia konsultacji modelowi głosowemu realtime.

Klucz sesji konsultacji jest ograniczony do sesji Meet, dzięki czemu kolejne wywołania konsultacji
mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówioną kontrolę gotowości po pełnym dołączeniu Chrome do rozmowy:

```bash
openclaw googlemeet speak meet_... "Powiedz dokładnie: Jestem tutaj i słucham."
```

Dla pełnego smoke testu dołączania i mówienia:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Powiedz dokładnie: Jestem tutaj i słucham."
```

## Lista kontrolna testu live

Użyj tej sekwencji przed przekazaniem spotkania agentowi bez nadzoru:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Powiedz dokładnie: Test mowy Google Meet zakończony."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` jest w całości zielone.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy `chrome-node` jest
  domyślnym transportem albo gdy Node jest przypięty.
- `nodes status` pokazuje, że wybrany Node jest podłączony.
- Wybrany Node ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do rozmowy, a `test-speech` zwraca kondycję Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak VM macOS w Parallels, jest to najkrótsza
bezpieczna kontrola po aktualizacji Gateway albo VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dowodzi to, że Plugin Gateway jest załadowany, VM Node jest podłączony z
bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy prawdziwą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia szczegóły dial-in:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone kontrole `twilio-voice-call-plugin` i
  `twilio-voice-call-credentials`.
- `voicecall` jest dostępne w CLI po przeładowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie albo przeładuj Gateway.
Działający agent widzi tylko narzędzia Pluginów zarejestrowane przez bieżący proces Gateway.

### Brak podłączonego Nodea zdolnego do Google Meet

Na hoście Node uruchom:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Na hoście Gateway zatwierdź Node i sprawdź polecenia:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node musi być podłączony i wymieniać `googlemeet.chrome` oraz `browser.proxy`.
Konfiguracja Gateway musi zezwalać na te polecenia Nodea:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` albo log Gateway zgłasza
`gateway token mismatch`, zainstaluj ponownie albo uruchom ponownie Node z bieżącym tokenem Gateway.
Dla Gateway w LAN zwykle oznacza to:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Następnie przeładuj usługę Node i ponownie uruchom:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka się otwiera, ale agent nie może dołączyć

Uruchom `googlemeet test-speech` i sprawdź zwróconą kondycję Chrome. Jeśli
zwraca `manualActionRequired: true`, pokaż operatorowi `manualActionMessage`
i przestań ponawiać próby, dopóki działanie w przeglądarce nie zostanie zakończone.

Typowe działania ręczne:

- Zalogowanie się do profilu Chrome.
- Dopuszczenie gościa z konta hosta Meet.
- Przyznanie Chrome uprawnień do mikrofonu/kamery, gdy pojawi się natywny monit Chrome.
- Zamknięcie albo naprawienie zablokowanego dialogu uprawnień Meet.

Nie zgłaszaj „not signed in” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?”. To interfejs pośredni wyboru audio Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy to możliwe, i dalej
czeka na rzeczywisty stan spotkania. Dla fallbacku przeglądarkowego tylko do tworzenia OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL nie wymaga
ścieżki audio realtime.

### Tworzenie spotkania kończy się błędem

`googlemeet create` najpierw używa endpointu Google Meet API `spaces.create`,
gdy skonfigurowano dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przechodzi fallbackiem
do przeglądarki przypiętego Chrome Nodea. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`,
  albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: refresh token został wygenerowany po dodaniu
  obsługi create. Starsze tokeny mogą nie mieć zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Pluginu.
- Dla fallbacku przeglądarkowego: `defaultTransport: "chrome-node"` i
  `chromeNode.node` wskazują podłączony Node z `browser.proxy` oraz
  `googlemeet.chrome`.
- Dla fallbacku przeglądarkowego: profil Chrome OpenClaw na tym Nodezie jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla fallbacku przeglądarkowego: ponowienia ponownie używają istniejącej karty
  `https://meet.google.com/new` albo monitu konta Google przed otwarciem nowej karty.
  Jeśli agent przekroczy limit czasu, ponów wywołanie narzędzia zamiast ręcznie otwierać
  kolejną kartę Meet.
- Dla fallbacku przeglądarkowego: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` oraz
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj w pętli, dopóki to
  działanie nie zostanie zakończone.
- Dla fallbacku przeglądarkowego: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  fallbacku tylko do tworzenia, **Continue without microphone** przez automatyzację
  przeglądarki i dalej czekać na wygenerowany URL Meet. Jeśli nie może, błąd
  powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do słuchania/odpowiadania głosem. `mode: "transcribe"` celowo
nie uruchamia dupleksowego mostu głosowego realtime.

Dodatkowo sprawdź:

- Na hoście Gateway jest dostępny klucz dostawcy realtime, taki jak
  `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczne na hoście Chrome.
- `rec` i `play` istnieją na hoście Chrome.
- Mikrofon i głośnik Meet są skierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, Node, stan in-call,
powód ręcznego działania, połączenie dostawcy realtime, `realtimeReady`, aktywność
wejścia/wyjścia audio, znaczniki czasu ostatniego audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id]`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy chcesz zweryfikować odświeżenie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz
również potwierdzenia przez Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważne działanie narzędzia to `recover_current_tab`. Skupia i sprawdza
istniejącą kartę Meet na skonfigurowanym Chrome Nodezie. Nie otwiera nowej karty ani
nie tworzy nowej sesji; zgłasza bieżącą blokadę, taką jak logowanie, dopuszczenie,
uprawnienia albo stan wyboru audio. Polecenie CLI komunikuje się ze skonfigurowanym
Gateway, więc Gateway musi działać, a Chrome Node musi być podłączony.

### Kontrole konfiguracji Twilio kończą się błędem

`twilio-voice-call-plugin` kończy się błędem, gdy `voice-call` nie jest dozwolony albo nie jest włączony.
Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się błędem, gdy backend Twilio nie ma account
SID, auth tokena albo numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Następnie uruchom ponownie albo przeładuj Gateway i wykonaj:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać dry-run dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące połączenie
powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie wchodzi do spotkania

Potwierdź, że wydarzenie Meet udostępnia szczegóły telefonu dial-in. Przekaż dokładny numer
dial-in i PIN albo własną sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca wymaga pauzy
przed wpisaniem PIN-u.

## Uwagi

Oficjalne media API Google Meet są zorientowane na odbiór, więc mówienie do rozmowy Meet
nadal wymaga ścieżki uczestnika. Ten Plugin zachowuje tę granicę jako widoczną:
Chrome obsługuje udział przez przeglądarkę i lokalny routing audio; Twilio obsługuje
udział przez telefoniczne dial-in.

Tryb Chrome realtime wymaga jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostem modelu realtime i przesyła audio G.711 mu-law 8 kHz między tymi
  poleceniami a wybranym dostawcą głosu realtime.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu zarządza całą lokalną
  ścieżką audio i musi zakończyć się po uruchomieniu lub zweryfikowaniu swojego daemona.

Dla czystego dupleksowego audio kieruj wyjście Meet i mikrofon Meet przez osobne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może powodować echo innych uczestników z powrotem do rozmowy.

`googlemeet speak` wyzwala aktywny most audio realtime dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. Dla sesji Twilio delegowanych
przez Plugin Voice Call, `leave` dodatkowo rozłącza bazowe połączenie głosowe.

## Powiązane

- [Plugin Voice Call](/pl/plugins/voice-call)
- [Talk mode](/pl/nodes/talk)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
