---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google-Meet-Anruf teilnimmt
    - Sie konfigurieren Chrome, einen Chrome-Node oder Twilio als Google-Meet-Transport
summary: 'Google-Meet-Plugin: explizite Meet-URLs über Chrome oder Twilio beitreten mit Standardwerten für Echtzeitstimme'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-04-24T06:49:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab439b777e3043cc647a29e8e17b2794d14f48deceaadf8f81a014dd44583e23
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Unterstützung für Google-Meet-Teilnehmer in OpenClaw.

Das Plugin ist absichtlich explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- `realtime`-Stimme ist der Standardmodus.
- Die Echtzeitstimme kann zurück in den vollständigen OpenClaw-Agenten aufrufen, wenn tieferes
  Reasoning oder Tools benötigt werden.
- Die Authentifizierung beginnt mit persönlichem Google OAuth oder einem bereits angemeldeten Chrome-Profil.
- Es gibt keine automatische Einwilligungsankündigung.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gepaarten Node-Host laufen.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für allgemeinere Agent-
  Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audio-Abhängigkeiten und stellen Sie sicher, dass der Echtzeit-Provider
OpenAI verwenden kann:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der Installer von Homebrew
erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart beide Komponenten:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Aktivieren Sie das Plugin:

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

Setup prüfen:

```bash
openclaw googlemeet setup
```

Einem Meeting beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder einen Agenten über das Tool `google_meet` beitreten lassen:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome tritt als angemeldetes Chrome-Profil bei. Wählen Sie in Meet `BlackHole 2ch` für
den Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für sauberes Duplex-Audio verwenden Sie
separate virtuelle Geräte oder einen Graph im Stil von Loopback; ein einzelnes BlackHole-Gerät reicht
für einen ersten Smoke-Test, kann aber Echo verursachen.

### Lokales Gateway + Parallels Chrome

Sie benötigen **kein** vollständiges OpenClaw Gateway oder einen Modell-API-Schlüssel innerhalb einer macOS-VM,
nur damit die VM Chrome besitzt. Führen Sie Gateway und Agent lokal aus und starten Sie dann einen
Node-Host in der VM. Aktivieren Sie das gebündelte Plugin dort einmal, damit der Node
den Chrome-Befehl ankündigt:

Was läuft wo:

- Gateway-Host: OpenClaw Gateway, Agent-Workspace, Modell-/API-Schlüssel, Realtime-
  Provider und die Konfiguration des Google-Meet-Plugins.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht nötig: Gateway-Dienst, Agent-Konfiguration, OpenAI/GPT-Schlüssel oder
  Modell-Provider-Setup.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS `BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle sehen kann:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installieren oder aktualisieren Sie OpenClaw in der VM und aktivieren Sie dort dann das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der Node die
Klartext-WebSocket-Verbindung, sofern Sie für dieses vertrauenswürdige private Netzwerk nicht explizit zustimmen:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwenden Sie dieselbe Umgebungsvariable, wenn Sie den Node als LaunchAgent installieren:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass das Gateway den Node sieht und dass er `googlemeet.chrome` ankündigt:

```bash
openclaw nodes status
```

Leiten Sie Meet auf diesem Node am Gateway-Host weiter:

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

Treten Sie jetzt wie gewohnt vom Gateway-Host aus bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder bitten Sie den Agenten, das Tool `google_meet` mit `transport: "chrome-node"` zu verwenden.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node `googlemeet.chrome` ankündigt. Wenn mehrere fähige Nodes
verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID, den Anzeigenamen oder die Remote-IP.

Häufige Prüfungen bei Fehlern:

- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` in der VM ausgeführt wurde.
  Bestätigen Sie außerdem, dass der Gateway-Host den Node-Befehl mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]` erlaubt.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich in Chrome innerhalb der VM an und bestätigen Sie, dass dieses
  Profil der Meet-URL manuell beitreten kann.
- Kein Audio: Leiten Sie Mikrofon/Lautsprecher in Meet über den virtuellen Audiopfad,
  den OpenClaw verwendet; verwenden Sie separate virtuelle Geräte oder Routing im Stil von Loopback
  für sauberes Duplex-Audio.

## Hinweise zur Installation

Der Standardpfad für Chrome Realtime verwendet zwei externe Tools:

- `sox`: Kommandozeilen-Audio-Utility. Das Plugin verwendet dessen Befehle `rec` und `play`
  für die standardmäßige 8-kHz-G.711-mu-law-Audiobrücke.
- `blackhole-2ch`: virtueller Audiotreiber für macOS. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet geroutet werden kann.

OpenClaw bündelt oder verteilt keines der beiden Pakete weiter. Die Dokumentation fordert Benutzer auf,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist lizenziert als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole steht unter GPL-3.0. Wenn Sie einen
Installer oder eine Appliance bauen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
Lizenzbedingungen von BlackHole upstream oder holen Sie sich eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL in Google Chrome und tritt mit dem angemeldeten
Chrome-Profil bei. Auf macOS prüft das Plugin vor dem Start auf `BlackHole 2ch`.
Wenn konfiguriert, führt es außerdem einen Audio-Bridge-Health-Befehl und einen Startbefehl
aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn Chrome/Audio auf dem Gateway-Host laufen;
verwenden Sie `chrome-node`, wenn Chrome/Audio auf einem gepaarten Node wie einer Parallels-
macOS-VM laufen.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecheraudio über die lokale OpenClaw-Audio-
Bridge. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler
fehl, statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice-Call-Plugin delegiert wird. Er
parst Meet-Seiten nicht nach Telefonnummern.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwenden Sie `--dtmf-sequence`, wenn das Meeting eine benutzerdefinierte Sequenz benötigt:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth und Preflight

Der Zugriff auf die Google Meet Media API verwendet zuerst einen persönlichen OAuth-Client. Konfigurieren Sie
`oauth.clientId` und optional `oauth.clientSecret`, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen Localhost-Callback unter `http://localhost:8085/oauth2callback` und einen manuellen
Copy/Paste-Flow mit `--manual`.

Diese Umgebungsvariablen werden als Fallback akzeptiert:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oder `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oder `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oder
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oder `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oder `GOOGLE_MEET_PREVIEW_ACK`

Lösen Sie eine Meet-URL, einen Code oder `spaces/{id}` über `spaces.get` auf:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Führen Sie Preflight vor Medienarbeit aus:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-
Projekt, OAuth-Principal und die Meeting-Teilnehmer im Google Workspace Developer Preview Program für Meet-Media-APIs angemeldet sind.

## Konfiguration

Der gemeinsame Chrome-Realtime-Pfad benötigt nur das aktivierte Plugin, BlackHole, SoX
und einen OpenAI-Schlüssel:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Setzen Sie die Plugin-Konfiguration unter `plugins.entries.google-meet.config`:

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

Standards:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionale Node-ID/-Name/-IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: SoX-`rec`-Befehl, der 8-kHz-G.711-mu-law-
  Audio nach stdout schreibt
- `chrome.audioOutputCommand`: SoX-`play`-Befehl, der 8-kHz-G.711-mu-law-
  Audio von stdin liest
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für tiefere Antworten

Optionale Overrides:

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
    toolPolicy: "owner",
  },
}
```

Nur-Twilio-Konfiguration:

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

## Tool

Agenten können das Tool `google_meet` verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwenden Sie
`transport: "chrome-node"`, wenn Chrome auf einem gepaarten Node wie einer Parallels-
VM läuft. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem
Gateway-Host, sodass Modell-Anmeldedaten dort bleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "leave"`, um eine Sitzung als beendet zu markieren.

## Realtime-Agent-Consult

Der Chrome-Realtime-Modus ist für einen Live-Sprach-Loop optimiert. Der Realtime-Sprach-
Provider hört das Meeting-Audio und spricht über die konfigurierte Audiobrücke.
Wenn das Realtime-Modell tieferes Reasoning, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem
Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort an die Realtime-
Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann in das Meeting sprechen.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: das Consult-Tool verfügbar machen und den regulären Agenten auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get` begrenzen.
- `owner`: das Consult-Tool verfügbar machen und dem regulären Agenten die normale
  Tool-Richtlinie des Agenten erlauben.
- `none`: das Consult-Tool dem Realtime-Sprachmodell nicht bereitstellen.

Der Sitzungsschlüssel für Consult ist pro Meet-Sitzung begrenzt, sodass nachfolgende Consult-Aufrufe
während desselben Meetings den vorherigen Consult-Kontext wiederverwenden können.

## Hinweise

Die offizielle Media API von Google Meet ist auf Empfang ausgerichtet, daher erfordert das Sprechen in einen Meet-
Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin hält diese Grenze sichtbar:
Chrome übernimmt Browser-Teilnahme und lokales Audio-Routing; Twilio übernimmt
die Teilnahme per Telefoneinwahl.

Der Chrome-Realtime-Modus benötigt entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt die
  Brücke zum Realtime-Modell und leitet 8-kHz-G.711-mu-law-Audio zwischen diesen
  Befehlen und dem ausgewählten Realtime-Sprachprovider weiter.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl besitzt den gesamten lokalen
  Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon über separate
virtuelle Geräte oder einen Graph für virtuelle Geräte im Stil von Loopback. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echoen.

`googlemeet leave` stoppt die kommandogepaarten Realtime-Audiobrücken für Chrome-
Sitzungen. Für Twilio-Sitzungen, die über das Voice-Call-Plugin delegiert werden, wird außerdem
der zugrunde liegende Sprach-Anruf aufgelegt.

## Verwandt

- [Voice-Call-Plugin](/de/plugins/voice-call)
- [Talk-Modus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
