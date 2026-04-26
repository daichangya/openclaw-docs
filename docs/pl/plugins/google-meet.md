---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet.
    - Chcesz, aby agent OpenClaw utworzył nową rozmowę Google Meet.
    - Konfigurujesz Chrome, Chrome Node lub Twilio jako transport Google Meet.
summary: 'Plugin Google Meet: dołączanie do jawnych URL-i Meet przez Chrome lub Twilio z domyślnymi ustawieniami realtime voice'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-26T11:36:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Obsługa uczestnika Google Meet dla OpenClaw — Plugin jest celowo jawny:

- Dołącza tylko do jawnego URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego URL.
- `realtime` voice jest trybem domyślnym.
- Realtime voice może wywoływać z powrotem pełnego agenta OpenClaw, gdy potrzebne jest głębsze
  rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania przez `mode`: użyj `realtime` do live
  słuchania/odpowiadania głosem albo `transcribe`, aby dołączyć/kontrolować przeglądarkę bez
  mostu realtime voice.
- Uwierzytelnianie zaczyna się jako osobisty Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie lub na sparowanym hoście Node.
- Twilio akceptuje numer do wybierania oraz opcjonalny PIN albo sekwencję DTMF.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów
  telekonferencyjnych agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę backendu realtime voice.
Domyślny jest OpenAI; działa też Google Gemini Live z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# albo
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator
Homebrew wymaga restartu, zanim macOS udostępni urządzenie:

```bash
sudo reboot
```

Po restarcie zweryfikuj oba elementy:

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

Wynik setup jest przeznaczony do odczytu przez agentów. Raportuje profil Chrome,
most audio, przypięcie Node, opóźnione wprowadzenie realtime, a gdy skonfigurowano
delegację Twilio, także to, czy Plugin `voice-call` i poświadczenia Twilio są gotowe.
Traktuj każde sprawdzenie `ok: false` jako blokadę, zanim poprosisz agenta o dołączenie.
Użyj `openclaw googlemeet setup --json` dla skryptów albo wyniku czytelnego maszynowo.
Użyj `--transport chrome`, `--transport chrome-node` albo `--transport twilio`,
aby wykonać preflight konkretnego transportu, zanim agent spróbuje go użyć.

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

- Tworzenie przez API: używane, gdy skonfigurowane są poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu UI przeglądarki.
- Fallback przeglądarkowy: używany, gdy brak poświadczeń OAuth. OpenClaw używa
  przypiętego Chrome Node, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego URL z kodem spotkania, a następnie zwraca ten URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na Node był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny pierwszy monit Meet o mikrofon; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują także ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe parametry zapytania URL, takie jak `authuser`, więc
  ponowna próba agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą kartę
  Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` lub `browser`), dzięki czemu agenci
mogą wyjaśnić, która ścieżka została użyta. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` wraz z sesją dołączania. Aby tylko wygenerować URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego z realtime voice i wyślij
mi link.” Agent powinien wywołać `google_meet` z `action: "create"`, a
następnie udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko do obserwacji/kontroli przeglądarki ustaw `"mode": "transcribe"`. To
nie uruchamia mostu modelu realtime duplex, więc nie będzie odzywać się z powrotem do
spotkania.

Podczas sesji realtime status `google_meet` obejmuje kondycję przeglądarki i mostu audio,
taką jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ostatnie znaczniki czasu wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostu. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsłuży go, gdy może. Logowanie, dopuszczenie przez hosta oraz
monity uprawnień przeglądarki/OS są zgłaszane jako ręczna akcja z powodem i
komunikatem do przekazania przez agenta.

Chrome dołącza jako zalogowany profil Chrome. W Meet wybierz `BlackHole 2ch` dla ścieżki
mikrofonu/głośnika używanej przez OpenClaw. Dla czystego audio duplex użyj
oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; pojedyncze urządzenie BlackHole wystarczy
do pierwszego testu smoke, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz macOS VM
tylko po to, by VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a potem uruchom
host Node w VM. Włącz dołączony Plugin w VM jeden raz, aby Node
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, workspace agenta, klucze model/API, dostawca realtime
  oraz konfiguracja Pluginu Google Meet.
- macOS VM w Parallels: OpenClaw CLI/host Node, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niewymagane w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom VM ponownie po instalacji BlackHole, aby macOS udostępnił `BlackHole 2ch`:

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

Uruchom host Node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP w LAN i nie używasz TLS, Node odrzuci
połączenie plain WebSocket, chyba że wyrazisz zgodę dla tej zaufanej sieci prywatnej:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania Node jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` to środowisko procesu, a nie ustawienie
`openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź Node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi Node i że reklamuje on zarówno `googlemeet.chrome`,
jak i browser capability/`browser.proxy`:

```bash
openclaw nodes status
```

Skieruj Meet przez ten Node na hoście Gateway:

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

Dla testu smoke jednym poleceniem, który tworzy lub ponownie używa sesji, wypowiada znaną
frazę i wypisuje kondycję sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika Join/Ask
to join i akceptuje pierwszy monit Meet „Use microphone”, gdy ten monit
się pojawi. Podczas tworzenia spotkania tylko w przeglądarce może też przejść dalej przez
ten sam monit bez mikrofonu, jeśli Meet nie pokazuje przycisku use-microphone.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez hosta,
Chrome potrzebuje uprawnienia do mikrofonu/kamery albo Meet utknął na monicie,
którego automatyzacja nie mogła rozwiązać, wynik join/test-speech raportuje
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać dołączanie,
zgłosić dokładnie ten komunikat wraz z bieżącymi `browserUrl`/`browserTitle`
i ponowić dopiero po wykonaniu ręcznej akcji w przeglądarce.

Jeśli pominięto `chromeNode.node`, OpenClaw automatycznie wybiera Node tylko wtedy, gdy dokładnie jeden
połączony Node reklamuje zarówno `googlemeet.chrome`, jak i kontrolę przeglądarki. Jeśli
połączonych jest kilka zdolnych Node, ustaw `chromeNode.node` na id Node,
display name lub zdalny adres IP.

Typowe kontrole błędów:

- `Configured Google Meet node ... is not usable: offline`: przypięty Node jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten Node jako
  stan diagnostyczny, a nie używalny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser` zostały uruchomione w VM. Potwierdź też, że
  host Gateway zezwala na oba polecenia Node przez
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na
  sprawdzanym hoście i uruchom ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome się otwiera, ale nie może dołączyć: zaloguj się do profilu przeglądarki w VM albo
  pozostaw ustawione `chrome.guestName` dla dołączenia jako gość. Auto-join gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki Node; upewnij się, że konfiguracja
  przeglądarki Node wskazuje profil, którego chcesz używać, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Duplikaty kart Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  lub karty monitu konta Google, zanim otworzy kolejną.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj oddzielnych urządzeń wirtualnych lub routingu w stylu Loopback
  dla czystego audio duplex.

## Uwagi instalacyjne

Domyślny tryb realtime Chrome używa dwóch narzędzi zewnętrznych:

- `sox`: narzędzie audio z wiersza poleceń. Plugin używa jego poleceń `rec` i `play`
  dla domyślnego mostu audio G.711 mu-law 8 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet mogą kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
instalację ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest GPL-3.0. Jeśli budujesz
instalator lub appliance, który dołącza BlackHole do OpenClaw, sprawdź warunki licencyjne
BlackHole upstream albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet w Google Chrome i dołącza jako zalogowany
profil Chrome. Na macOS Plugin sprawdza obecność `BlackHole 2ch` przed uruchomieniem.
Jeśli jest skonfigurowany, uruchamia także polecenie kontroli kondycji mostu audio oraz polecenie startowe
przed otwarciem Chrome. Używaj `chrome`, gdy Chrome/audio działają na hoście Gateway;
używaj `chrome-node`, gdy Chrome/audio działają na sparowanym Node, takim jak macOS VM w Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj dźwięk mikrofonu i głośnika Chrome przez lokalny most audio
OpenClaw. Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji,
zamiast po cichu dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Pluginu Voice Call. Nie
parsuje stron Meet w celu znalezienia numerów telefonów.

Używaj go, gdy uczestnictwo przez Chrome nie jest dostępne albo chcesz mieć fallback
dial-in przez telefon. Google Meet musi udostępniać numer telefonu i PIN dla
spotkania; OpenClaw nie wykrywa ich ze strony Meet.

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

Dostarcz poświadczenia Twilio przez środowisko lub konfigurację. Środowisko trzyma
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Uruchom ponownie lub przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji pluginu
nie pojawiają się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegacja Twilio jest poprawnie podłączona, `googlemeet setup` zawiera zakończone sukcesem
kontrole `twilio-voice-call-plugin` i `twilio-voice-call-credentials`.

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

OAuth jest opcjonalny przy tworzeniu linku Meet, ponieważ `googlemeet create` może przejść awaryjnie
do automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz używać oficjalnego tworzenia przez API,
rozwiązywania spaces lub kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
wynikowy refresh token w konfiguracji Pluginu Google Meet lub podaj
zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX i połączony
Node, gdy używasz uczestnictwa przez przeglądarkę. OAuth służy tylko do oficjalnej ścieżki Google
Meet API: tworzenia meeting spaces, rozwiązywania spaces i uruchamiania kontroli
preflight Meet Media API.

### Tworzenie poświadczeń Google

W Google Cloud Console:

1. Utwórz lub wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy, o które prosi OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Utwórz OAuth client ID.
   - Typ aplikacji: **Web application**.
   - Autoryzowany redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Skopiuj client ID i client secret.

`meetings.space.created` jest wymagane przez `spaces.create` Google Meet.
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet do spaces.
`meetings.conference.media.readonly` służy do preflight Meet Media API i pracy z mediami;
Google może wymagać zapisania do Developer Preview dla rzeczywistego użycia Media API.
Jeśli potrzebujesz tylko dołączania przez Chrome opartego na przeglądarce, całkowicie pomiń OAuth.

### Wygenerowanie refresh token

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret`, albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z refresh tokenem. Używa PKCE,
localhost callback pod `http://localhost:8085/oauth2callback` oraz ręcznego
przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może dotrzeć do lokalnego callback:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Wynik JSON zawiera:

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

Zapisz obiekt `oauth` pod konfiguracją Pluginu Google Meet:

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

Preferuj zmienne środowiskowe, gdy nie chcesz trzymać refresh tokenu w konfiguracji.
Jeśli obecne są jednocześnie wartości z konfiguracji i środowiska, Plugin rozwiązuje najpierw konfigurację,
a potem fallback środowiskowy.

Zgoda OAuth obejmuje tworzenie Meet spaces, odczyt Meet spaces i odczyt
mediów konferencyjnych Meet. Jeśli uwierzytelniłeś się przed dodaniem obsługi
tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby refresh
token miał zakres `meetings.space.created`.

### Weryfikacja OAuth przez doctor

Uruchom doctor OAuth, gdy chcesz uzyskać szybką kontrolę kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje runtime Chrome ani nie wymaga podłączonego Chrome Node. Sprawdza,
czy istnieje konfiguracja OAuth i czy refresh token może wygenerować access
token. Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje access
tokenu, refresh tokenu ani client secret.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `oauth-config`       | Obecne są `oauth.clientId` plus `oauth.refreshToken` albo buforowany access token.         |
| `oauth-token`        | Buforowany access token jest nadal ważny albo refresh token wygenerował nowy access token. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejącą Meet space.                          |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową Meet space.                            |

Aby dodatkowo potwierdzić włączenie Google Meet API i zakres `spaces.create`, uruchom
kontrolę tworzącą skutki uboczne:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy tymczasowy URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API i że autoryzowane
konto ma zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącej meeting space:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` oraz `resolve-space` potwierdzają dostęp do odczytu istniejącej
space, do której autoryzowane konto Google ma dostęp. `403` z tych kontroli
zwykle oznacza, że Google Meet REST API jest wyłączone, zatwierdzony refresh token
nie ma wymaganego zakresu albo konto Google nie ma dostępu do tej Meet
space. Błąd refresh tokenu oznacza, że trzeba ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Dla fallbacku przeglądarkowego nie są potrzebne żadne poświadczenia OAuth. W tym trybie uwierzytelnianie Google
pochodzi z zalogowanego profilu Chrome na wybranym Node, a nie z konfiguracji
OpenClaw.

Te zmienne środowiskowe są akceptowane jako fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż URL Meet, kod lub `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom preflight przed pracą z mediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wylistuj artefakty spotkania i obecność po tym, jak Meet utworzy rekordy konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting`, `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
Przekaż `--all-conference-records`, gdy chcesz wszystkie zachowane rekordy
dla tego spotkania.

Wyszukiwanie kalendarza może rozwiązać URL spotkania z Google Calendar przed odczytem
artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` w poszukiwaniu Calendar event z
linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst zdarzenia, oraz
`--calendar <id>` dla kalendarza innego niż primary. Wyszukiwanie kalendarza wymaga świeżego
logowania OAuth obejmującego zakres readonly zdarzeń Calendar.
`calendar-events` podgląda pasujące zdarzenia Meet i oznacza zdarzenie, które
wybiorą `latest`, `artifacts`, `attendance` lub `export`.

Jeśli znasz już id rekordu konferencji, odwołaj się do niego bezpośrednio:

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

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników, nagrań,
transkrypcji, ustrukturyzowanych wpisów transkrypcji i inteligentnych notatek,
gdy Google udostępnia je dla spotkania. Użyj `--no-transcript-entries`, aby pominąć
pobieranie wpisów dla dużych spotkań. `attendance` rozwija uczestników do
wierszy participant-session z czasami pierwszej/ostatniej obecności, łącznym czasem
trwania sesji, flagami spóźnienia/wcześniejszego wyjścia oraz zduplikowanymi zasobami
uczestników scalonymi według zalogowanego użytkownika lub nazwy wyświetlanej.
Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby uczestników osobno,
`--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz `--early-before-minutes`,
aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane dane wejściowe, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczności, źródło tokena, wydarzenie Calendar, jeśli zostało użyte,
oraz wszelkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby dodatkowo zapisać
przenośne archiwum obok folderu. Przekaż `--include-doc-bodies`, aby eksportować
tekst połączonych Dokumentów Google z transkrypcji i inteligentnych notatek przez Google Drive `files.export`;
wymaga to świeżego logowania OAuth obejmującego zakres tylko do odczytu Drive Meet.
Bez `--include-doc-bodies` eksporty zawierają tylko metadane Meet i
ustrukturyzowane wpisy transkrypcji. Jeśli Google zwróci częściowy błąd artefaktu,
na przykład dla listy inteligentnych notatek, wpisu transkrypcji lub treści dokumentu Drive,
podsumowanie i manifest zachowają ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artifacts/attendance i wypisać
JSON manifestu bez tworzenia folderu ani ZIP. Jest to przydatne przed zapisaniem
dużego eksportu lub gdy agent potrzebuje tylko liczności, wybranych rekordów
i ostrzeżeń.

Agenci mogą również utworzyć ten sam pakiet za pomocą narzędzia `google_meet`:

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

Uruchom chroniony test live smoke na rzeczywistym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod lub
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw zastępczych
  bez prefiksu `OPENCLAW_`.

Bazowy live smoke dla artifacts/attendance wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` oraz
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w Calendar
wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentów Drive
wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz nową przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowe `meeting uri`, źródło i sesję dołączenia. Z poświadczeniami OAuth
używa oficjalnego API Google Meet. Bez poświadczeń OAuth
używa jako rozwiązania awaryjnego zalogowanego profilu przeglądarki przypiętego węzła Chrome. Agenci mogą
użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym
kroku. Aby utworzyć tylko URL, przekaż `"join": false`.

Przykładowe wyjście JSON z rozwiązania awaryjnego przeglądarki:

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

Jeśli rozwiązanie awaryjne przeglądarki natrafi na logowanie Google lub blokadę uprawnień Meet,
zanim będzie mogło utworzyć URL, metoda Gateway zwraca nieudane żądanie, a
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

Gdy agent zobaczy `manualActionRequired: true`, powinien zgłosić
`manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać otwierać nowe
karty Meet, dopóki operator nie ukończy kroku w przeglądarce.

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

Tworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd
rozwiązania awaryjnego przeglądarki i prosi operatora o dokończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zapisani do programu Google
Workspace Developer Preview Program dla interfejsów API mediów Meet.

## Konfiguracja

Wspólna ścieżka Chrome w czasie rzeczywistym wymaga tylko włączonego Plugin,
BlackHole, SoX i klucza dostawcy głosu backendu w czasie rzeczywistym. OpenAI jest domyślny; ustaw
`realtime.provider: "google"`, aby używać Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

Ustaw konfigurację Plugin pod `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie
  gościa Meet bez logowania
- `chrome.autoJoin: true`: wypełnianie nazwy gościa i kliknięcie Dołącz teraz
  w miarę możliwości przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuje istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: oczekuje, aż karta Meet zgłosi uczestnictwo w połączeniu,
  zanim zostanie uruchomione wprowadzenie w czasie rzeczywistym
- `chrome.audioInputCommand`: polecenie SoX `rec` zapisujące dźwięk 8 kHz G.711 mu-law
  na stdout
- `chrome.audioOutputCommand`: polecenie SoX `play` odczytujące dźwięk 8 kHz G.711 mu-law
  ze stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi głosowe, z
  `openclaw_agent_consult` dla bardziej szczegółowych odpowiedzi
- `realtime.introMessage`: krótki głosowy test gotowości po połączeniu
  mostka czasu rzeczywistego; ustaw `""`, aby dołączyć po cichu

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
    introMessage: "Say exactly: I'm here.",
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

`voiceCall.enabled` domyślnie ma wartość `true`; przy transporcie Twilio deleguje
rzeczywiste połączenie PSTN i DTMF do Plugin Voice Call. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może zweryfikować i zarejestrować plan wybierania, ale nie może
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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak maszyna
wirtualna Parallels. W obu przypadkach model czasu rzeczywistego i `openclaw_agent_consult`
działają na hoście Gateway, więc poświadczenia modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
uruchomić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może go
zgłosić. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wygląda na będące wewnątrz połączenia Meet
- `micMuted`: najlepsza dostępna informacja o stanie mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez hosta Meet, uprawnień
  lub naprawy sterowania przeglądarką, zanim mowa zacznie działać
- `providerConnected` / `realtimeReady`: stan mostka głosowego czasu rzeczywistego
- `lastInputAt` / `lastOutputAt`: ostatni dźwięk odebrany z mostka lub wysłany do niego

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultacja agenta czasu rzeczywistego

Tryb Chrome w czasie rzeczywistym jest zoptymalizowany pod kątem pętli głosowej na żywo. Dostawca
głosu czasu rzeczywistego słyszy dźwięk spotkania i mówi przez skonfigurowany mostek audio.
Gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, bieżących informacji
lub zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem
ostatniej transkrypcji spotkania i zwraca zwięzłą odpowiedź głosową do sesji
głosowej czasu rzeczywistego. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem
na spotkaniu. Używa tego samego współdzielonego narzędzia konsultacji czasu rzeczywistego co Voice Call.

`realtime.toolPolicy` kontroluje uruchomienie konsultacji:

- `safe-read-only`: udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i
  `memory_get`.
- `owner`: udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępnia narzędzia konsultacji modelowi głosowemu czasu rzeczywistego.

Klucz sesji konsultacji ma zakres per sesja Meet, więc kolejne wywołania konsultacji
mogą ponownie wykorzystać wcześniejszy kontekst konsultacji podczas tego samego spotkania.

Aby wymusić głosowy test gotowości po pełnym dołączeniu Chrome do połączenia:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Dla pełnego testu smoke z dołączeniem i mową:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista kontrolna testu live

Użyj tej sekwencji przed przekazaniem spotkania agentowi działającemu bez nadzoru:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` jest cały na zielono.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy `chrome-node` jest
  domyślnym transportem lub gdy przypięto węzeł.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do połączenia, a `test-speech` zwraca stan Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, jest to
najkrótsza bezpieczna kontrola po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To dowodzi, że Plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z
bieżącym tokenem, a mostek audio Meet jest dostępny, zanim agent otworzy
rzeczywistą kartę spotkania.

Dla testu smoke z Twilio użyj spotkania, które udostępnia szczegóły wybierania telefonicznego:

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
- `voicecall` jest dostępne w CLI po ponownym załadowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` i `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i ponownie załaduj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie lub przeładuj Gateway.
Działający agent widzi tylko narzędzia Plugin zarejestrowane przez bieżący proces Gateway.

### Brak połączonego węzła z obsługą Google Meet

Na hoście węzła uruchom:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Na hoście Gateway zatwierdź węzeł i zweryfikuj polecenia:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Węzeł musi być połączony i musi wyświetlać `googlemeet.chrome` oraz `browser.proxy`.
Konfiguracja Gateway musi zezwalać na te polecenia węzła:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przejdzie kontroli `chrome-node-connected` lub log Gateway zgłasza
`gateway token mismatch`, zainstaluj ponownie lub uruchom ponownie węzeł z bieżącym tokenem Gateway.
Dla Gateway w sieci LAN zwykle oznacza to:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Następnie przeładuj usługę węzła i ponownie uruchom:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka się otwiera, ale agent nie może dołączyć

Uruchom `googlemeet test-speech` i sprawdź zwrócony stan Chrome. Jeśli
zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage`
i przestań ponawiać próby, dopóki działanie w przeglądarce nie zostanie ukończone.

Typowe działania ręczne:

- Zaloguj się do profilu Chrome.
- Dopuść gościa z konta hosta Meet.
- Przyznaj Chrome uprawnienia do mikrofonu/kamery, gdy pojawi się natywne
  okno uprawnień Chrome.
- Zamknij lub napraw zawieszone okno dialogowe uprawnień Meet.

Nie zgłaszaj „not signed in” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?”. To ekran pośredni wyboru audio w Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy to możliwe, i nadal czeka
na rzeczywisty stan spotkania. W przypadku rozwiązania awaryjnego przeglądarki tylko do tworzenia OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL nie wymaga
ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego Google Meet API `spaces.create`,
gdy skonfigurowano poświadczenia OAuth. Bez poświadczeń OAuth przechodzi do
przeglądarki przypiętego węzła Chrome. Potwierdź:

- Dla tworzenia przez API: `oauth.clientId` i `oauth.refreshToken` są skonfigurowane,
  lub obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi
  tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla rozwiązania awaryjnego przeglądarki: `defaultTransport: "chrome-node"` i
  `chromeNode.node` wskazują na połączony węzeł z `browser.proxy` i
  `googlemeet.chrome`.
- Dla rozwiązania awaryjnego przeglądarki: profil OpenClaw Chrome na tym węźle jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla rozwiązania awaryjnego przeglądarki: ponowienia używają istniejącej karty `https://meet.google.com/new`
  lub karty z prośbą o konto Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla rozwiązania awaryjnego przeglądarki: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby pokierować operatorem. Nie ponawiaj prób w pętli, dopóki to
  działanie nie zostanie ukończone.
- Dla rozwiązania awaryjnego przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** lub, dla
  rozwiązania awaryjnego tylko do tworzenia, **Continue without microphone** przez
  automatyzację przeglądarki i dalej czekać na wygenerowany URL Meet. Jeśli nie może, komunikat
  o błędzie powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do słuchania i odpowiadania głosem. `mode: "transcribe"`
celowo nie uruchamia dwukierunkowego mostka głosowego czasu rzeczywistego.

Sprawdź również:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` lub `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczne na hoście Chrome.
- `rec` i `play` istnieją na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan połączenia,
powód ręcznej akcji, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`,
aktywność wejścia/wyjścia audio, znaczniki czasu ostatniego audio, liczniki bajtów i adres URL przeglądarki.
Użyj `googlemeet status [session-id]`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy chcesz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` lub `--create-space`, gdy potrzebujesz również
potwierdzenia Google Meet API.

Jeśli agent przekroczył limit czasu i widać już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważna akcja narzędzia to `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Dla `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; dla `chrome-node` używa skonfigurowanego
węzła Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; zgłasza
bieżącą blokadę, taką jak logowanie, dopuszczenie, uprawnienia lub stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga też połączonego węzła Chrome.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolone lub nie jest włączone.
Dodaj je do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backendowi Twilio brakuje account
SID, auth token lub numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Następnie uruchom ponownie lub przeładuj Gateway i uruchom:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać dry-run dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące
połączenie powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie wchodzi do spotkania

Potwierdź, że wydarzenie Meet udostępnia szczegóły wybierania telefonicznego. Przekaż dokładny numer
do wybierania i PIN lub niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj wiodącego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca wymaga pauzy
przed wprowadzeniem PIN-u.

## Uwagi

Oficjalne API mediów Google Meet jest zorientowane na odbiór, więc mówienie do połączenia Meet
nadal wymaga ścieżki uczestnika. Ten Plugin wyraźnie pokazuje tę granicę:
Chrome obsługuje udział przez przeglądarkę i lokalne przekierowanie audio; Twilio obsługuje
udział przez telefoniczne wybieranie.

Tryb Chrome w czasie rzeczywistym wymaga jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostkiem modelu czasu rzeczywistego i przesyła dźwięk 8 kHz G.711 mu-law między tymi
  poleceniami a wybranym dostawcą głosu czasu rzeczywistego.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostka zarządza całą lokalną
  ścieżką audio i musi zakończyć się po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czysty dźwięk dwukierunkowy, kieruj wyjście Meet i mikrofon Meet przez osobne
urządzenia wirtualne lub graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może powodować echo innych uczestników z powrotem do połączenia.

`googlemeet speak` uruchamia aktywny mostek audio czasu rzeczywistego dla sesji
Chrome. `googlemeet leave` zatrzymuje ten mostek. Dla sesji Twilio delegowanych
przez Plugin Voice Call, `leave` rozłącza również bazowe połączenie głosowe.

## Powiązane

- [Plugin Voice Call](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
