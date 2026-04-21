---
read_when:
    - Hinzufügen oder Ändern von Doctor-Migrationen
    - Einführen von Änderungen mit inkompatiblen Konfigurationsänderungen
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T06:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete
Konfigurationen/Zustände, prüft den Systemzustand und liefert umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Akzeptiert Standardwerte ohne Rückfrage (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, falls zutreffend).

```bash
openclaw doctor --repair
```

Wendet empfohlene Reparaturen ohne Rückfrage an (Reparaturen + Neustarts, wo sicher).

```bash
openclaw doctor --repair --force
```

Wendet auch aggressive Reparaturen an (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

```bash
openclaw doctor --non-interactive
```

Wird ohne Rückfragen ausgeführt und wendet nur sichere Migrationen an (Konfigurationsnormalisierung + Verschiebungen von Zuständen auf der Festplatte). Überspringt Neustart-/Service-/Sandbox-Aktionen, die menschliche Bestätigung erfordern.
Migrationen von Altzuständen werden bei Erkennung automatisch ausgeführt.

```bash
openclaw doctor --deep
```

Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Vorab-Aktualisierung für Git-Installationen (nur interaktiv).
- Frischeprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
- Integritätsprüfung + Neustartabfrage.
- Zusammenfassung des Skills-Status (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Altwerte.
- Migration der Talk-Konfiguration von alten flachen `talk.*`-Feldern in `talk.provider` + `talk.providers.<provider>`.
- Browser-Migrationsprüfungen für alte Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
- Warnungen zu Codex-OAuth-Shadowing (`models.providers.openai-codex`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
- Migration alter Zustände auf der Festplatte (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Migration alter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration des alten Cron-Stores (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
- Prüfung von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
- Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
- Berechtigungsprüfungen für Konfigurationsdateien (`chmod 600`), wenn lokal ausgeführt.
- Modell-Auth-Integrität: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration alter Dienste und Erkennung zusätzlicher Gateways.
- Migration alter Matrix-Kanalzustände (im Modus `--fix` / `--repair`).
- Laufzeitprüfungen des Gateway (Dienst installiert, aber nicht gestartet; zwischengespeichertes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway abgefragt).
- Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Prüfung empfohlener Laufzeiteinstellungen für das Gateway (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkollisionen (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Token-Erstellung an, wenn keine Token-Quelle existiert; überschreibt keine Token-`SecretRef`-Konfigurationen).
- Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Scope-Upgrades, veraltete lokale Drift im Device-Token-Cache und Drift bei Auth-Daten gepaarter Einträge).
- Prüfung von systemd linger unter Linux.
- Prüfung der Größe der Workspace-Bootstrap-Datei (Warnungen bei Abschneidung/nahe am Limit für Kontextdateien).
- Prüfung des Status der Shell-Autovervollständigung und automatische Installation/Aktualisierung.
- Prüfung der Bereitschaft des Embedding-Providers für die Memory-Suche (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
- Prüfungen der Quellcode-Installation (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlende tsx-Binärdatei).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Dreams-UI-Backfill und Reset

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded**
für den Grounded-Dreaming-Workflow. Diese Aktionen verwenden doctor-ähnliche RPC-Methoden des Gateway,
sind aber **nicht** Teil der Reparatur-/Migrationslogik der CLI `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven
  Workspace, führt den Grounded-REM-Diary-Durchlauf aus und schreibt reversible Backfill-Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Diary-Einträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorgemerkte rein grounded Kurzzeiteinträge, die
  aus historischen Wiederholungen stammen und noch keine Live-Erinnerung oder tägliche
  Unterstützung angesammelt haben.

Was sie nicht von selbst tun:

- sie bearbeiten nicht `MEMORY.md`
- sie führen keine vollständigen Doctor-Migrationen aus
- sie übernehmen grounded Kandidaten nicht automatisch in den aktiven Kurzzeit-
  Promotionsspeicher, sofern Sie nicht zuvor ausdrücklich den CLI-Pfad für das Staging ausführen

Wenn Sie möchten, dass grounded historische Wiederholungen die normale Deep-Promotion-
Strecke beeinflussen, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden grounded dauerhafte Kandidaten in den Kurzzeit-Dreaming-Store vorgemerkt,
während `DREAMS.md` die Oberfläche für die Überprüfung bleibt.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es an,
vor der Ausführung von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration alte Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifische Überschreibung), normalisiert Doctor sie auf das aktuelle
Schema.

Dazu gehören auch alte flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen alter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche alten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start auch automatisch aus, wenn es ein
altes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Stores werden von `openclaw doctor --fix` behandelt.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → oberste Ebene `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- alte `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Bei Kanälen mit benannten `accounts`, aber verbliebenen Top-Level-Kanalwerten aus einer Einzelkonto-Konfiguration, werden diese kontobezogenen Werte in das für diesen Kanal ausgewählte hochgestufte Konto verschoben (`accounts.default` bei den meisten Kanälen; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (alte Relay-Einstellung der Erweiterung)

Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Mehrfachkonto-Kanäle:

- Wenn zwei oder mehr Einträge in `channels.<channel>.accounts` konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Überschreibungen

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Das kann Modelle auf die falsche API zwingen oder Kosten auf null setzen. Doctor warnt Sie, damit
Sie die Überschreibung entfernen und das API-Routing + die Kosten pro Modell wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration noch auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert Doctor
sie auf das aktuelle hostlokale Attach-Modell von Chrome MCP:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes Profil `existing-session` verwenden:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Autoverbindungsprofile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert Sie daran, Remote-Debugging auf der Browser-Inspektionsseite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  oder `edge://inspect/#remote-debugging`)

Doctor kann die Einstellung auf der Chrome-Seite nicht für Sie aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- einen lokal laufenden Browser
- aktiviertes Remote-Debugging in diesem Browser
- Zustimmung zur ersten Attach-Bestätigungsabfrage im Browser

Die Bereitschaft hier betrifft nur lokale Attach-Voraussetzungen. Existing-session behält
die aktuellen Routenbeschränkungen von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale TLS-Stack von Node/OpenSSL die
Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt Doctor plattformspezifische Anleitungen zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Behebung meist `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt,
wenn das Gateway in Ordnung ist.

### 2c) Codex-OAuth-Provider-Überschreibungen

Wenn Sie zuvor alte OpenAI-Transporteinstellungen unter
`models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-
Provider-Pfad überlagern, den neuere Releases automatisch verwenden. Doctor warnt, wenn es
diese alten Transporteinstellungen zusammen mit Codex OAuth erkennt, damit Sie die veraltete
Transport-Überschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten
wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin
unterstützt und lösen diese Warnung nicht aus.

### 3) Migrationen alter Zustände (Festplattenlayout)

Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

- Sitzungsspeicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Auth-Zustand (Baileys):
  - aus dem alten `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn
es alte Ordner als Backups zurücklässt. Gateway/CLI migriert die alten Sitzungen + das Agent-Verzeichnis
beim Start ebenfalls automatisch, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im
pfadbezogenen Pro-Agent-Ziel landen. Die WhatsApp-Authentifizierung wird absichtlich nur über
`openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt nach
struktureller Gleichheit, sodass reine Unterschiede in der Schlüsselsortierung keine wiederholten
wirkungslosen Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Migrationen alter Plugin-Manifeste

Doctor durchsucht alle installierten Plugin-Manifeste nach veralteten Top-Level-Fähigkeitsschlüsseln
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn welche gefunden werden, bietet es an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der alte Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Migrationen alter Cron-Stores

Doctor prüft auch den Cron-Job-Store (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus
Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Cron-Bereinigungen umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliase für Payload-`provider` → explizites `delivery.channel`
- einfache alte Webhook-Fallback-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert Jobs mit `notify: true` nur dann automatisch, wenn dies ohne
Verhaltensänderung möglich ist. Wenn ein Job altes Notify-Fallback mit einem bestehenden
Nicht-Webhook-Zustellmodus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungssperren

Doctor durchsucht jedes Agent-Sitzungsverzeichnis nach veralteten Schreibsperrdateien — Dateien, die
zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet es:
den Pfad, die PID, ob die PID noch aktiv ist, das Alter der Sperre und ob sie als
veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und fordert
Sie auf, den Befehl mit `--fix` erneut auszuführen.

### 4) Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie
Sitzungen, Anmeldedaten, Logs und Konfiguration (es sei denn, Sie haben anderswo Backups).

Doctor prüft:

- **Fehlendes Zustandsverzeichnis**: warnt vor katastrophalem Zustandsverlust, fragt, ob das
  Verzeichnis neu erstellt werden soll, und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet die Reparatur von Berechtigungen an
  (und gibt einen `chown`-Hinweis aus, wenn eine Abweichung bei Eigentümer/Gruppe erkannt wird).
- **Unter macOS cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade langsamere I/O-
  Vorgänge und Sperr-/Synchronisationsrennen verursachen können.
- **Unter Linux Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine Einhängequelle
  `mmcblk*` aufgelöst wird, da zufällige I/O auf SD- oder eMMC-Basis bei Schreibvorgängen für Sitzungen und
  Anmeldedaten langsamer sein und schneller verschleißen kann.
- **Fehlende Sitzungsverzeichnisse**: `sessions/` und das Sitzungsspeicherverzeichnis sind
  erforderlich, um den Verlauf zu speichern und `ENOENT`-Abstürze zu vermeiden.
- **Abweichung bei Transkripten**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
- **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat
  (der Verlauf sammelt sich nicht an).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere Ordner `~/.openclaw` über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Pfad zeigt
  (der Verlauf kann sich zwischen Installationen aufteilen).
- **Hinweis zu Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran,
  es auf dem Remote-Host auszuführen (dort liegt der Zustand).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Alle lesbar ist, und bietet an, dies auf `600` zu verschärfen.

### 5) Integrität der Modell-Authentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Speicher, warnt bei bald ablaufenden/abgelaufenen Tokens
und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den
Anthropic-Setup-Token-Pfad vor.
Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`,
`invalid_grant` oder wenn ein Provider mitteilt, dass Sie sich erneut anmelden müssen), meldet Doctor,
dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten Befehl
`openclaw models auth login --provider ...` aus, den Sie ausführen müssen.

Doctor meldet außerdem Auth-Profile, die vorübergehend nicht verwendbar sind wegen:

- kurzer Cooldowns (Rate-Limits/Timeouts/Auth-Fehler)
- längerer Deaktivierungen (Abrechnungs-/Guthabenfehler)

### 6) Hooks-Modellvalidierung

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den
Katalog und die Allowlist und warnt, wenn sie sich nicht auflösen lässt oder nicht zulässig ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder
auf alte Namen umzuschalten, wenn das aktuelle Image fehlt.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der
aktuellen Konfiguration aktiv sind oder durch den Standard ihres gebündelten Manifests aktiviert werden, zum Beispiel
`plugins.entries.discord.enabled: true`, altes
`channels.discord.enabled: true` oder ein standardmäßig aktivierter gebündelter Provider. Wenn welche
fehlen, meldet Doctor die Pakete und installiert sie im Modus
`openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin
`openclaw plugins install` / `openclaw plugins update`; Doctor installiert keine
Abhängigkeiten für beliebige Plugin-Pfade.

### 8) Migrationen von Gateway-Diensten und Hinweise zur Bereinigung

Doctor erkennt alte Gateway-Dienste (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen gatewayähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare Migration eines Altzustands hat,
erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Migrationsschritte nach bestem Bemühen aus: Migration des alten Matrix-Zustands und Vorbereitung des alten
verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der
Start wird fortgesetzt. Im Nur-Lese-Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 8c) Geräte-Pairing und Auth-Drift

Doctor prüft jetzt den Zustand des Geräte-Pairings als Teil der normalen Integritätsprüfung.

Was gemeldet wird:

- ausstehende erstmalige Pairing-Anfragen
- ausstehende Rollen-Upgrades für bereits gepaarte Geräte
- ausstehende Scope-Upgrades für bereits gepaarte Geräte
- Reparaturen bei Abweichungen des öffentlichen Schlüssels, wenn die Geräte-ID noch stimmt, aber die
  Geräteidentität nicht mehr mit dem genehmigten Eintrag übereinstimmt
- gepaarte Einträge ohne aktives Token für eine genehmigte Rolle
- gepaarte Tokens, deren Scopes von der genehmigten Pairing-Basislinie abweichen
- lokale gecachte Device-Token-Einträge für die aktuelle Maschine, die älter sind als eine
  gatewayseitige Token-Rotation oder veraltete Scope-Metadaten enthalten

Doctor genehmigt Pairing-Anfragen nicht automatisch und rotiert Device-Tokens nicht automatisch. Es
gibt stattdessen die exakten nächsten Schritte aus:

- ausstehende Anfragen mit `openclaw devices list` prüfen
- die genaue Anfrage mit `openclaw devices approve <requestId>` genehmigen
- ein neues Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
- einen veralteten Eintrag mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

Dadurch wird die übliche Lücke „bereits gepaart, aber weiterhin Pairing erforderlich“
geschlossen: Doctor unterscheidet jetzt zwischen erstmaligem Pairing, ausstehenden Rollen-/Scope-
Upgrades und veralteter Drift von Token/Geräteidentität.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder
wenn eine Richtlinie gefährlich konfiguriert ist.

### 10) systemd linger (Linux)

Wenn Doctor als systemd-Benutzerdienst läuft, stellt es sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Abmelden weiterläuft.

### 11) Workspace-Status (Skills, Plugins und alte Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agenten aus:

- **Skills-Status**: zählt geeignete Skills, Skills mit fehlenden Voraussetzungen und durch Allowlist blockierte Skills.
- **Alte Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere alte Workspace-Verzeichnisse
  neben dem aktuellen Workspace existieren.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für
  Fehler auf; meldet Fähigkeiten gebündelter Plugins.
- **Plugin-Kompatibilitätswarnungen**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnostik**: zeigt Warnungen oder Fehler an, die beim Laden von der
  Plugin-Registry ausgegeben wurden.

### 11b) Größe der Bootstrap-Datei

Doctor prüft, ob Bootstrap-Dateien des Workspace (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten
Zeichenbudget liegen oder dieses überschreiten. Es meldet pro Datei rohe gegenüber injizierten Zeichenanzahlen, den
Prozentsatz der Abschneidung, die Ursache der Abschneidung (`max/file` oder `max/total`) und die insgesamt injizierten
Zeichen als Anteil am Gesamtbudget. Wenn Dateien abgeschnitten werden oder nahe am Limit liegen,
gibt Doctor Hinweise zur Feinabstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Autovervollständigung

Doctor prüft, ob Tab-Vervollständigung für die aktuelle Shell
(zsh, bash, fish oder PowerShell) installiert ist:

- Wenn das Shell-Profil ein langsames Muster für dynamische Vervollständigung verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere
  Variante mit gecachter Datei.
- Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  generiert Doctor den Cache automatisch neu.
- Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

### 12) Prüfungen der Gateway-Authentifizierung (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Nur-Lese-Reparaturen mit SecretRef-Bewusstsein

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit zu schwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe Nur-Lese-SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` mit `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Gateway-Integritätsprüfung + Neustart

Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund wirkt.

### 13b) Bereitschaft der Memory-Suche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Memory-Suche für den
Standard-Agenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Wenn nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Option für den Binärpfad.
- **Expliziter lokaler Provider**: prüft, ob eine lokale Modelldatei oder eine erkannte
  Remote-/herunterladbare Modell-URL vorhanden ist. Wenn nicht, wird ein Wechsel zu einem Remote-Provider vorgeschlagen.
- **Expliziter Remote-Provider** (`openai`, `voyage` usw.): prüft, ob ein API-Schlüssel
  in der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-
  Provider in der Auto-Auswahlreihenfolge.

Wenn ein Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung in Ordnung), gleicht Doctor sein Ergebnis mit der für die CLI sichtbaren Konfiguration ab und vermerkt
jede Abweichung.

Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu prüfen.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway in Ordnung ist, führt Doctor eine Kanalstatus-Prüfung aus und meldet
Warnungen mit vorgeschlagenen Behebungen.

### 15) Audit der Supervisor-Konfiguration + Reparatur

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und
Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es eine Aktualisierung und kann
die Dienstdatei/Aufgabe mit den aktuellen Standardwerten neu schreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
- `openclaw doctor --repair` wendet empfohlene Behebungen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Dienstinstallation/-reparatur von Doctor das SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
- Bei Linux-user-systemd-Units umfassen die Prüfungen auf Token-Drift von Doctor jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich von Auth-Metadaten des Dienstes.
- Sie können jederzeit ein vollständiges Neuschreiben mit `openclaw gateway install --force` erzwingen.

### 16) Laufzeit- und Portdiagnostik des Gateway

Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der
Dienst installiert, aber tatsächlich nicht gestartet ist. Es prüft auch auf Portkollisionen
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Dienst auf Bun oder auf einem versionsverwalteten Node-Pfad
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades kaputtgehen, weil der Dienst Ihre
Shell-Initialisierung nicht lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn
verfügbar (Homebrew/apt/choco).

### 18) Schreiben der Konfiguration + Wizard-Metadaten

Doctor speichert alle Konfigurationsänderungen und versieht die Wizard-Metadaten mit einem Eintrag,
um den Doctor-Lauf zu protokollieren.

### 19) Workspace-Tipps (Backup + Memory-System)

Doctor schlägt ein Workspace-Memory-System vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus,
wenn der Workspace noch nicht unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur
Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).
