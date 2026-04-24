---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Obsługa uczestnika Google Meet dla OpenClaw.

Plugin jest celowo jawny:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Głos `realtime` jest trybem domyślnym.
- Głos w czasie rzeczywistym może wywołać pełnego agenta OpenClaw, gdy potrzebne są głębsze
  rozumowanie lub narzędzia.
- Uwierzytelnianie zaczyna się od osobistego Google OAuth lub już zalogowanego profilu Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie lub na sparowanym hoście Node.
- Twilio przyjmuje numer do połączenia oraz opcjonalny PIN lub sekwencję DTMF.
- Poleceniem CLI jest `googlemeet`; `meet` jest zarezerwowane dla szerszych
  przepływów telekonferencyjnych agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę głosu działającego w czasie rzeczywistym
w backendzie. OpenAI jest domyślne; Google Gemini Live również działa z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator
Homebrew wymaga ponownego uruchomienia, zanim macOS udostępni to urządzenie:

```bash
sudo reboot
```

Po ponownym uruchomieniu sprawdź oba elementy:

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

Dołącz do spotkania:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Albo pozwól agentowi dołączyć przez narzędzie `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome dołącza jako zalogowany profil Chrome. W Meet wybierz `BlackHole 2ch` dla
ścieżki mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać czysty dźwięk dupleksowy, użyj
osobnych urządzeń wirtualnych lub grafu w stylu Loopback; pojedyncze urządzenie BlackHole
wystarcza do pierwszego testu smoke, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

**Nie** potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz macOS VM
tylko po to, aby VM był hostem dla Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
hosta Node w VM. Włącz dołączony Plugin w VM jeden raz, aby Node
ogłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API, dostawca
  `realtime` oraz konfiguracja pluginu Google Meet.
- Parallels macOS VM: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niepotrzebne w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności w VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po zainstalowaniu BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu sprawdź, czy VM widzi urządzenie audio i polecenia SoX:

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

Jeśli `<gateway-host>` jest adresem IP w LAN i nie używasz TLS, Node odrzuca
nieszyfrowany WebSocket, chyba że jawnie włączysz to dla tej zaufanej sieci prywatnej:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie ustawieniem
`openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź Node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi Node i że ogłasza on `googlemeet.chrome`:

```bash
openclaw nodes status
```

Kieruj Meet przez ten Node na hoście Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony Node ogłasza `googlemeet.chrome`. Jeśli podłączonych jest kilka
obsługiwanych Node, ustaw `chromeNode.node` na identyfikator Node, nazwę wyświetlaną lub zdalny adres IP.

Typowe kontrole w przypadku błędów:

- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że uruchomiono `openclaw plugins enable google-meet`
  w VM. Potwierdź też, że host Gateway zezwala na polecenie Node przez
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do Chrome wewnątrz VM i potwierdź, że ten
  profil może ręcznie dołączyć do adresu URL Meet.
- Brak dźwięku: w Meet kieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj osobnych urządzeń wirtualnych lub routingu w stylu Loopback,
  aby uzyskać czysty dupleks audio.

## Uwagi dotyczące instalacji

Domyślna konfiguracja Chrome `realtime` używa dwóch narzędzi zewnętrznych:

- `sox`: narzędzie audio w wierszu poleceń. Plugin używa jego poleceń `rec` i `play`
  dla domyślnego mostka audio 8 kHz G.711 mu-law.
- `blackhole-2ch`: wirtualny sterownik audio dla macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet może kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników
o zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany na
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole na GPL-3.0. Jeśli budujesz
instalator lub appliance, który dołącza BlackHole do OpenClaw, przejrzyj warunki licencyjne
BlackHole u źródła albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera adres URL Meet w Google Chrome i dołącza jako zalogowany
profil Chrome. W macOS Plugin sprawdza obecność `BlackHole 2ch` przed uruchomieniem.
Jeśli skonfigurowano, uruchamia też polecenie sprawdzania kondycji mostka audio oraz polecenie
startowe przed otwarciem Chrome. Użyj `chrome`, gdy Chrome/audio działa na hoście Gateway;
użyj `chrome-node`, gdy Chrome/audio działa na sparowanym Node, takim jak Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Kieruj dźwięk mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji
zamiast cichego dołączenia bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do pluginu Voice Call. Nie
parsuje stron Meet w poszukiwaniu numerów telefonów.

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

## OAuth i wstępna kontrola

Dostęp do Google Meet Media API najpierw używa osobistego klienta OAuth. Skonfiguruj
`oauth.clientId` i opcjonalnie `oauth.clientSecret`, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
wywołania zwrotnego localhost pod `http://localhost:8085/oauth2callback` oraz ręcznego
przepływu kopiuj/wklej z `--manual`.

Te zmienne środowiskowe są akceptowane jako wartości zapasowe:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż adres URL Meet, kod lub `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom wstępną kontrolę przed pracą z mediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zapisani do Google
Workspace Developer Preview Program dla interfejsów API mediów Meet.

## Konfiguracja

Typowa ścieżka Chrome `realtime` wymaga tylko włączonego pluginu, BlackHole, SoX
oraz klucza dostawcy głosu działającego w czasie rzeczywistym w backendzie. OpenAI jest domyślne; ustaw
`realtime.provider: "google"`, aby używać Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

Ustaw konfigurację pluginu w `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: opcjonalny identyfikator/nazwa/adres IP Node dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: polecenie SoX `rec` zapisujące dźwięk 8 kHz G.711 mu-law
  na stdout
- `chrome.audioOutputCommand`: polecenie SoX `play` odczytujące dźwięk 8 kHz G.711 mu-law
  ze stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości po połączeniu mostka `realtime`;
  ustaw na `""`, aby dołączyć po cichu

Opcjonalne nadpisania:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym Node, takim jak Parallels
VM. W obu przypadkach model `realtime` i `openclaw_agent_consult` działają na
hoście Gateway, więc poświadczenia modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent `realtime`
natychmiast coś powiedział. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Powiedz dokładnie: Jestem tutaj i słucham."
}
```

## Konsultacja z agentem realtime

Tryb Chrome `realtime` jest zoptymalizowany pod kątem pętli głosowej na żywo. Dostawca głosu
działającego w czasie rzeczywistym słyszy dźwięk spotkania i mówi przez skonfigurowany mostek audio.
Gdy model `realtime` potrzebuje głębszego rozumowania, aktualnych informacji lub zwykłych
narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem
ostatniej transkrypcji spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej
`realtime`. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem na spotkaniu.

`realtime.toolPolicy` steruje przebiegiem konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosowemu `realtime`.

Klucz sesji konsultacji jest ograniczony do danej sesji Meet, więc kolejne wywołania
konsultacji mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówiony test gotowości po pełnym dołączeniu Chrome do rozmowy:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Uwagi

Oficjalne media API Google Meet jest zorientowane na odbiór, więc mówienie podczas rozmowy Meet
nadal wymaga ścieżki uczestnika. Ten Plugin zachowuje tę granicę jako widoczną:
Chrome obsługuje udział z poziomu przeglądarki i lokalne routowanie audio; Twilio obsługuje
udział przez połączenie telefoniczne.

Tryb Chrome `realtime` wymaga jednego z poniższych:

- `chrome.audioInputCommand` oraz `chrome.audioOutputCommand`: OpenClaw zarządza
  mostkiem modelu `realtime` i przesyła dźwięk 8 kHz G.711 mu-law między tymi
  poleceniami a wybranym dostawcą głosu `realtime`.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostka zarządza całą lokalną
  ścieżką audio i musi zakończyć działanie po uruchomieniu lub sprawdzeniu swojego demona.

Aby uzyskać czysty dźwięk dupleksowy, kieruj wyjście Meet i mikrofon Meet przez osobne
urządzenia wirtualne lub graf urządzeń wirtualnych w stylu Loopback. Pojedyncze współdzielone
urządzenie BlackHole może powodować echo innych uczestników z powrotem do rozmowy.

`googlemeet speak` wyzwala aktywny mostek audio `realtime` dla sesji Chrome.
`googlemeet leave` zatrzymuje ten mostek. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call, `leave` również rozłącza bazowe połączenie głosowe.

## Powiązane

- [Plugin Voice call](/pl/plugins/voice-call)
- [Tryb Talk](/pl/nodes/talk)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
