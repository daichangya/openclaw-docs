---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Breaking Changes an der Konfiguration einführen
summary: 'Doctor-Befehl: Health Checks, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T06:37:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` ist das Reparatur- + Migrationstool für OpenClaw. Es behebt veraltete
Konfigurationen/Zustände, prüft den Zustand und bietet umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Standardwerte ohne Rückfrage akzeptieren (einschließlich Neustart-/Dienst-/Sandbox-Reparaturschritten, wenn anwendbar).

```bash
openclaw doctor --repair
```

Empfohlene Reparaturen ohne Rückfrage anwenden (Reparaturen + Neustarts, wo sicher).

```bash
openclaw doctor --repair --force
```

Auch aggressive Reparaturen anwenden (überschreibt benutzerdefinierte Supervisor-Konfigurationen).

```bash
openclaw doctor --non-interactive
```

Ohne Rückfragen ausführen und nur sichere Migrationen anwenden (Konfigurationsnormalisierung + Verschiebungen von On-Disk-Zustand). Überspringt Neustart-/Dienst-/Sandbox-Aktionen, die menschliche Bestätigung erfordern.
Legacy-Zustandsmigrationen laufen bei Erkennung automatisch.

```bash
openclaw doctor --deep
```

Systemdienste auf zusätzliche Gateway-Installationen prüfen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben prüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Pre-Flight-Aktualisierung für Git-Installationen (nur interaktiv).
- Frischeprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
- Health Check + Neustartabfrage.
- Skills-Statuszusammenfassung (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Legacy-Werte.
- Migration der Talk-Konfiguration von veralteten flachen `talk.*`-Feldern nach `talk.provider` + `talk.providers.<provider>`.
- Prüfungen zur Browser-Migration für veraltete Chrome-Extension-Konfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
- Warnungen zu überschattetem Codex OAuth (`models.providers.openai-codex`).
- TLS-Voraussetzungsprüfung für OAuth-Profile von OpenAI Codex.
- Legacy-Migration von On-Disk-Zustand (Sitzungen/Agentenverzeichnis/WhatsApp-Authentifizierung).
- Migration veralteter Plugin-Manifest-Contract-Schlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration des Legacy-Cron-Stores (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload `provider`, einfache Fallback-Jobs für Webhook mit `notify: true`).
- Prüfung von Sitzungs-Lock-Dateien und Bereinigung veralteter Locks.
- Integritäts- und Berechtigungsprüfungen des Zustands (Sitzungen, Transkripte, Zustandsverzeichnis).
- Prüfungen der Berechtigungen von Konfigurationsdateien (chmod 600) bei lokaler Ausführung.
- Zustand der Modell-Authentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Disabled-Zustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration veralteter Dienste und Erkennung zusätzlicher Gateways.
- Migration von Legacy-Zustand des Matrix-Kanals (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht laufend; zwischengespeichertes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Audit von Supervisor-Konfigurationen (launchd/systemd/schtasks) mit optionaler Reparatur.
- Best-Practice-Prüfungen der Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkollisionen (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle existiert; überschreibt keine Token-`SecretRef`-Konfigurationen).
- Erkennung von Problemen beim Device Pairing (ausstehende Erstkopplungsanfragen, ausstehende Rollen-/Scope-Upgrades, Drift im veralteten lokalen Device-Token-Cache und Auth-Drift in Pairing-Einträgen).
- Prüfung von systemd linger unter Linux.
- Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Abschneidung/nahe am Limit für Kontextdateien).
- Prüfung des Status von Shell-Completion und automatische Installation/Aktualisierung.
- Bereitschaftsprüfung für Embedding-Provider der Memory-Suche (lokales Modell, Remote-API-Schlüssel oder QMD-Binärdatei).
- Prüfungen von Source-Installationen (Nichtübereinstimmung des pnpm-Workspace, fehlende UI-Assets, fehlende `tsx`-Binärdatei).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Dreams-UI-Backfill und -Reset

Die Dreams-Szene der Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded**
für den geerdeten Dreaming-Workflow. Diese Aktionen verwenden Gateway-
RPC-Methoden im Stil von Doctor, sind aber **nicht** Teil der CLI-
Reparatur/Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** durchsucht historische `memory/YYYY-MM-DD.md`-Dateien im aktiven
  Workspace, führt den geerdeten REM-Tagebuch-Durchlauf aus und schreibt reversible Backfill-
  Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorbereitete, ausschließlich geerdete kurzfristige Einträge,
  die aus historischem Replay stammen und noch keinen Live-Recall oder tägliche
  Unterstützung angesammelt haben.

Was sie selbst **nicht** tun:

- sie bearbeiten nicht `MEMORY.md`
- sie führen keine vollständigen Doctor-Migrationen aus
- sie stagen geerdete Kandidaten nicht automatisch in den Live-Store für kurzfristige
  Promotion, sofern Sie nicht zuvor ausdrücklich den vorbereiteten CLI-Pfad ausführen

Wenn Sie möchten, dass geerdetes historisches Replay die normale tiefe Promotion-
Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete dauerhafte Kandidaten in den Store für kurzfristiges Dreaming gestagt,
während `DREAMS.md` die Prüfoberfläche bleibt.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn dies ein Git-Checkout ist und Doctor interaktiv läuft, bietet es an,
vor dem Ausführen von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration veraltete Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifische Überschreibung), normalisiert Doctor sie auf das aktuelle
Schema.

Dazu gehören veraltete flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte
Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen veralteter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche veralteten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start auch automatisch aus, wenn es ein
veraltetes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Stores werden von `openclaw doctor --fix` behandelt.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` auf oberster Ebene
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- veraltete `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Bei Kanälen mit benannten `accounts`, aber verbliebenen Einzelkonto-Werten auf oberster Ebene des Kanals, werden diese kontobezogenen Werte in das für diesen Kanal gewählte hochgestufte Konto verschoben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Extension)

Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Multi-Account-Kanäle:

- Wenn zwei oder mehr Einträge unter `channels.<channel>.accounts` konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet konfigurierte Konto-IDs auf.

### 2b) OpenCode-Provider-Überschreibungen

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Das kann Modelle auf die falsche API zwingen oder Kosten auf null setzen. Doctor warnt, damit Sie die Überschreibung entfernen und Routing + Kosten pro Modell wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration noch auf den entfernten Pfad der Chrome-Extension zeigt, normalisiert Doctor
sie auf das aktuelle hostlokale Attach-Modell von Chrome MCP:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft auch den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Autoverbindungsprofile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert Sie daran, Remote Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  oder `edge://inspect/#remote-debugging`)

Doctor kann die Einstellung auf der Chrome-Seite nicht für Sie aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- den lokal laufenden Browser
- im Browser aktiviertes Remote Debugging
- das Bestätigen der ersten Attach-Consent-Abfrage im Browser

Bereitschaft hier betrifft nur lokale Attach-Voraussetzungen. Existing-session behält
die aktuellen Routenbegrenzungen von Chrome MCP; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
Headless-Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack die
Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Lösung in der Regel `brew postinstall ca-certificates`. Mit `--deep` läuft die Prüfung
auch dann, wenn das Gateway gesund ist.

### 2c) Überschreibungen des Codex-OAuth-Providers

Wenn Sie zuvor veraltete OpenAI-Transporteinstellungen unter
`models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-
Providerpfad überschatten, den neuere Versionen automatisch verwenden. Doctor warnt, wenn es
diese alten Transporteinstellungen zusammen mit Codex OAuth sieht, damit Sie die veraltete
Transportüberschreibung entfernen oder umschreiben und das integrierte Routing-/Fallback-
Verhalten wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Überschreibungen werden weiterhin unterstützt und lösen diese Warnung nicht aus.

### 3) Legacy-Zustandsmigrationen (Datenträgerlayout)

Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

- Sitzungsspeicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Authentifizierungszustand (Baileys):
  - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Account-ID: `default`)

Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn
es veraltete Ordner als Backups zurücklässt. Gateway/CLI migriert auch automatisch
die veralteten Sitzungen + das Agent-Verzeichnis beim Start, sodass Verlauf/Auth/Modelle im
agentenspezifischen Pfad landen, ohne dass ein manueller Doctor-Lauf nötig ist. Die WhatsApp-Authentifizierung wird absichtlich nur
über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map
vergleicht jetzt nach struktureller Gleichheit, sodass Unterschiede nur in der Schlüsselreihenfolge keine
wiederholten folgenlosen Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Legacy-Migrationen von Plugin-Manifests

Doctor durchsucht alle installierten Plugin-Manifests auf veraltete Capability-
Schlüssel auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt umzuschreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte hat, wird der veraltete Schlüssel
entfernt, ohne die Daten zu duplizieren.

### 3b) Legacy-Migrationen des Cron-Stores

Doctor prüft auch den Cron-Job-Store (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler
aus Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Bereinigungen für Cron umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliasse von Payload `provider` → explizites `delivery.channel`
- einfache veraltete Webhook-Fallback-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert Jobs mit `notify: true` nur automatisch, wenn dies ohne
Verhaltensänderung möglich ist. Wenn ein Job veraltetes Notify-Fallback mit einem vorhandenen
Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job zur manuellen Prüfung.

### 3c) Bereinigung von Sitzungs-Locks

Doctor durchsucht jedes Sitzungsverzeichnis eines Agenten nach veralteten Schreib-Lock-Dateien — Dateien, die
zurückbleiben, wenn eine Sitzung anormal beendet wurde. Für jede gefundene Lock-Datei meldet es:
den Pfad, die PID, ob die PID noch lebt, das Alter der Sperre und ob sie
als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Lock-Dateien automatisch; andernfalls gibt es einen Hinweis aus und
weist Sie an, mit `--fix` erneut auszuführen.

### 4) Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie
Sitzungen, Zugangsdaten, Logs und Konfiguration (sofern Sie keine Backups an anderer Stelle haben).

Doctor prüft:

- **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zum Neuerstellen
  des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen
  zu reparieren (und gibt einen `chown`-Hinweis aus, wenn eine Nichtübereinstimmung bei Eigentümer/Gruppe erkannt wird).
- **Unter macOS cloud-synchronisiertes Zustandsverzeichnis**: warnt, wenn der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, da synchronisationsgestützte Pfade zu langsamerem I/O
  und Lock-/Synchronisations-Rennen führen können.
- **Unter Linux Zustandsverzeichnis auf SD- oder eMMC-Speicher**: warnt, wenn der Zustand auf eine
  Mount-Quelle `mmcblk*` aufgelöst wird, da zufälliges I/O auf SD- oder eMMC-Basis langsamer sein und
  bei Sitzungs- und Zugangsdaten-Schreibvorgängen schneller verschleißen kann.
- **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Store-Verzeichnis sind
  erforderlich, um den Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Nichtübereinstimmung**: warnt, wenn bei aktuellen Sitzungseinträgen
  Transkriptdateien fehlen.
- **Hauptsitzung mit „1-zeiligem JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat
  (der Verlauf wird nicht angesammelt).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere Ordner `~/.openclaw` über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (der Verlauf kann
  zwischen Installationen aufgeteilt werden).
- **Remote-Modus-Erinnerung**: wenn `gateway.mode=remote`, erinnert Doctor Sie daran,
  es auf dem Remote-Host auszuführen (dort liegt der Zustand).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Zustand der Modell-Authentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Store, warnt, wenn Tokens
bald ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den
Setup-Token-Pfad von Anthropic vor.
Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`,
`invalid_grant` oder wenn ein Provider mitteilt, dass Sie sich erneut anmelden müssen), meldet Doctor,
dass eine erneute Authentifizierung erforderlich ist, und gibt den exakten Befehl `openclaw models auth login --provider ...`
aus, der auszuführen ist.

Doctor meldet auch Auth-Profile, die vorübergehend nicht nutzbar sind wegen:

- kurzer Cooldowns (Rate-Limits/Timeouts/Auth-Fehler)
- längerer Deaktivierungen (Abrechnungs-/Kreditfehler)

### 6) Modellvalidierung für Hooks

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den
Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst werden kann oder nicht erlaubt ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder
auf veraltete Namen zu wechseln, falls das aktuelle Image fehlt.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert Laufzeitabhängigkeiten nur für gebündelte Plugins, die in
der aktuellen Konfiguration aktiv sind oder durch ihren gebündelten Manifest-Standard aktiviert werden, zum Beispiel
`plugins.entries.discord.enabled: true`, veraltetes
`channels.discord.enabled: true` oder einen standardmäßig aktivierten gebündelten Provider. Wenn welche
fehlen, meldet Doctor die Pakete und installiert sie im
Modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe Plugins verwenden weiterhin
`openclaw plugins install` / `openclaw plugins update`; Doctor installiert keine
Abhängigkeiten für beliebige Plugin-Pfade.

### 8) Migrationen von Gateway-Diensten und Hinweise zur Bereinigung

Doctor erkennt veraltete Gateway-Dienste (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen gatewayähnlichen Diensten suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht
als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Legacy-Zustandsmigration hat,
erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Migrationsschritte nach bestem Bemühen aus: Migration des veralteten Matrix-Zustands und Vorbereitung des
veralteten verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und
der Start läuft weiter. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 8c) Device Pairing und Auth-Drift

Doctor prüft jetzt den Zustand von Device Pairing als Teil des normalen Health-Passes.

Was es meldet:

- ausstehende Anfragen für erstmaliges Pairing
- ausstehende Rollen-Upgrades für bereits gekoppelte Geräte
- ausstehende Scope-Upgrades für bereits gekoppelte Geräte
- Reparaturen bei Nichtübereinstimmung des Public Keys, bei denen die Geräte-ID noch passt, aber die Geräte-
  identität nicht mehr zum genehmigten Eintrag passt
- gekoppelte Einträge ohne aktives Token für eine genehmigte Rolle
- gekoppelte Tokens, deren Scopes außerhalb der genehmigten Pairing-Basislinie driften
- lokal zwischengespeicherte Device-Token-Einträge für den aktuellen Rechner, die älter sind als eine
  gatewayseitige Token-Rotation oder veraltete Scope-Metadaten tragen

Doctor genehmigt Pairing-Anfragen nicht automatisch und rotiert Device-Tokens nicht automatisch. Es
gibt stattdessen die exakten nächsten Schritte aus:

- ausstehende Anfragen mit `openclaw devices list` prüfen
- die exakte Anfrage mit `openclaw devices approve <requestId>` genehmigen
- ein neues Token mit `openclaw devices rotate --device <deviceId> --role <role>` rotieren
- einen veralteten Eintrag mit `openclaw devices remove <deviceId>` entfernen und erneut genehmigen

Damit wird die häufige Lücke „bereits gekoppelt, aber trotzdem weiterhin Pairing erforderlich“
geschlossen: Doctor unterscheidet jetzt zwischen erstmaligem Pairing, ausstehenden Rollen-/Scope-
Upgrades und veraltetem Token-/Geräteidentitäts-Drift.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd linger (Linux)

Wenn Doctor als systemd-Benutzerdienst läuft, stellt es sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Logout weiterläuft.

### 11) Workspace-Status (Skills, Plugins und veraltete Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standardagenten aus:

- **Skills-Status**: zählt geeignete, durch fehlende Anforderungen fehlende und durch Allowlist blockierte Skills.
- **Veraltete Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere veraltete Workspace-Verzeichnisse
  neben dem aktuellen Workspace existieren.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs bei
  Fehlern auf; meldet Fähigkeiten gebündelter Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnosen**: zeigt alle Warnungen oder Fehler beim Laden an, die von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe der Bootstrap-Datei

Doctor prüft, ob Bootstrap-Dateien des Workspace (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere eingebundene Kontextdateien) nahe am konfigurierten
Zeichenbudget liegen oder es überschreiten. Es meldet pro Datei rohe vs. eingebundene Zeichenzahlen, Abschneide-
prozent, Ursache der Abschneidung (`max/file` oder `max/total`) und die insgesamt eingebundenen
Zeichen als Anteil des Gesamtbudgets. Wenn Dateien abgeschnitten sind oder nahe am
Limit liegen, gibt Doctor Hinweise zur Abstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell-Completion

Doctor prüft, ob Tab-Completion für die aktuelle Shell installiert ist
(zsh, bash, fish oder PowerShell):

- Wenn das Shell-Profil ein langsames dynamisches Completion-Muster verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere
  Variante mit zwischengespeicherter Datei.
- Wenn Completion im Profil konfiguriert ist, die Cache-Datei aber fehlt,
  regeneriert Doctor den Cache automatisch.
- Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

### 12) Prüfungen der Gateway-Authentifizierung (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Schreibgeschützte SecretRef-bewusste Reparaturen

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit abzuschwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` mit `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlsweg nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Gateway-Health-Check + Neustart

Doctor führt einen Health Check aus und bietet an, das Gateway neu zu starten, wenn es
ungesund aussieht.

### 13b) Bereitschaft der Memory-Suche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Memory-Suche für den Standardagenten bereit ist.
Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Wenn nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Binärpfad-Option.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  Remote-/downloadbare Modell-URL. Wenn sie fehlt, wird vorgeschlagen, auf einen Remote-Provider umzuschalten.
- **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel
  in der Umgebung oder im Auth-Store vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-
  Provider in der Reihenfolge der automatischen Auswahl.

Wenn ein Ergebnis einer Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung gesund), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und vermerkt
jede Abweichung.

Verwenden Sie `openclaw memory status --deep`, um die Bereitschaft für Embeddings zur Laufzeit zu prüfen.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt Doctor eine Statusprüfung der Kanäle aus und meldet
Warnungen mit vorgeschlagenen Korrekturen.

### 15) Audit + Reparatur der Supervisor-Konfiguration

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von `network-online` und
Neustartverzögerung). Wenn eine Nichtübereinstimmung gefunden wird, empfiehlt es eine Aktualisierung und kann
die Dienstdatei/Aufgabe mit den aktuellen Standardwerten neu schreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
- `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token benötigt und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Installation/Reparatur des Doctor-Dienstes den SecretRef, persistiert aber keine aufgelösten Klartext-Tokenwerte in Supervisor-Dienstumgebungsmetadaten.
- Wenn die Token-Authentifizierung ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus ausdrücklich gesetzt ist.
- Für Linux-Benutzer-systemd-Units umfassen Token-Drift-Prüfungen von Doctor jetzt sowohl Quellen aus `Environment=` als auch aus `EnvironmentFile=`, wenn Dienst-Authentifizierungsmetadaten verglichen werden.
- Sie können jederzeit ein vollständiges Neuschreiben mit `openclaw gateway install --force` erzwingen.

### 16) Diagnose von Gateway-Laufzeit + Port

Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der
Dienst installiert, aber tatsächlich nicht läuft. Es prüft auch auf Portkollisionen
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Dienst unter Bun oder einem versionsverwalteten Node-Pfad
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades kaputtgehen, weil der Dienst Ihre Shell-Initialisierung nicht
lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn
verfügbar (Homebrew/apt/choco).

### 18) Konfigurationsschreiben + Wizard-Metadaten

Doctor persistiert alle Konfigurationsänderungen und versieht Wizard-Metadaten mit einem Zeitstempel, um den
Doctor-Lauf aufzuzeichnen.

### 19) Workspace-Tipps (Backup + Memory-System)

Doctor schlägt ein Workspace-Memory-System vor, wenn es fehlt, und gibt einen Backup-Hinweis aus,
wenn der Workspace noch nicht unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur
Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).

## Verwandt

- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Gateway-Runbook](/de/gateway)
