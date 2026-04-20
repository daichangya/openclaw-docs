---
read_when:
    - Doctor-Migrationen hinzufügen oder ändern
    - Einführung grundlegender Konfigurationsänderungen
summary: 'Doctor-Befehl: Zustandsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doktor
x-i18n:
    generated_at: "2026-04-20T06:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete
Konfigurationen/Zustände, prüft den Zustand und bietet umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Akzeptiert Standardwerte ohne Rückfrage (einschließlich Neustart-/Dienst-/Sandbox-Reparaturschritten, wenn zutreffend).

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

Wird ohne Rückfragen ausgeführt und wendet nur sichere Migrationen an (Konfigurationsnormalisierung + Zustandsverschiebungen auf dem Datenträger). Überspringt Neustart-/Dienst-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern.
Legacy-Zustandsmigrationen werden bei Erkennung automatisch ausgeführt.

```bash
openclaw doctor --deep
```

Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben überprüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionales Pre-Flight-Update für Git-Installationen (nur interaktiv).
- Frischeprüfung des UI-Protokolls (erstellt Control UI neu, wenn das Protokollschema neuer ist).
- Zustandsprüfung + Aufforderung zum Neustart.
- Skills-Statuszusammenfassung (verfügbar/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Legacy-Werte.
- Migration der Talk-Konfiguration von Legacy-`talk.*`-Feldern in `talk.provider` + `talk.providers.<provider>`.
- Browser-Migrationsprüfungen für Legacy-Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
- Warnungen zu überschattendem Codex OAuth (`models.providers.openai-codex`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI Codex OAuth-Profile.
- Legacy-Zustandsmigration auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Legacy-Migration von Plugin-Manifest-Vertragsschlüsseln (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Legacy-Migration des Cron-Speichers (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache `notify: true`-Webhook-Fallback-Jobs).
- Überprüfung von Session-Lock-Dateien und Bereinigung veralteter Locks.
- Integritäts- und Berechtigungsprüfungen des Zustands (Sitzungen, Transkripte, Zustandsverzeichnis).
- Prüfung der Berechtigungen der Konfigurationsdatei (`chmod 600`) bei lokaler Ausführung.
- Zustand der Modellauthentifizierung: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktiviert-Zustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Legacy-Dienstmigration und Erkennung zusätzlicher Gateways.
- Legacy-Zustandsmigration des Matrix-Kanals (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Dienst installiert, aber nicht ausgeführt; gecachtes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Prüfung der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Best-Practice-Prüfungen für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkonflikten (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Token-Erzeugung an, wenn keine Token-Quelle existiert; überschreibt keine Token-SecretRef-Konfigurationen).
- Erkennung von Problemen beim Geräte-Pairing (ausstehende erstmalige Pairing-Anfragen, ausstehende Rollen-/Bereichsupgrades, veraltete lokale Abweichungen im Gerätespeicher-Cache und Auth-Abweichungen gepaarter Einträge).
- Prüfung von systemd linger unter Linux.
- Prüfung der Dateigröße von Workspace-Bootstrap-Dateien (Warnungen bei Abschneidung/nahe am Limit für Kontextdateien).
- Prüfung des Shell-Completion-Status und automatische Installation/Aktualisierung.
- Prüfung der Bereitschaft des Embedding-Providers für die Erinnerungssuche (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
- Prüfungen für Quellinstallationen (pnpm-Workspace-Abweichung, fehlende UI-Assets, fehlende `tsx`-Binärdatei).
- Schreibt aktualisierte Konfiguration + Assistent-Metadaten.

## Dreams-UI-Backfill und Zurücksetzen

Die Dreams-Szene in Control UI enthält die Aktionen **Backfill**, **Reset** und **Clear Grounded**
für den geerdeten Dreaming-Workflow. Diese Aktionen verwenden Gateway-
RPC-Methoden im Doctor-Stil, sind aber **kein** Teil der CLI-Reparatur/Migration von `openclaw doctor`.

Was sie tun:

- **Backfill** scannt historische `memory/YYYY-MM-DD.md`-Dateien im aktiven
  Workspace, führt den geerdeten REM-Tagebuchdurchlauf aus und schreibt reversible Backfill-
  Einträge in `DREAMS.md`.
- **Reset** entfernt nur diese markierten Backfill-Tagebucheinträge aus `DREAMS.md`.
- **Clear Grounded** entfernt nur vorgemerkte kurzfristige rein geerdete Einträge, die
  aus historischem Replay stammen und noch keine Live-Erinnerung oder tägliche
  Unterstützung angesammelt haben.

Was sie selbst **nicht** tun:

- sie bearbeiten `MEMORY.md` nicht
- sie führen keine vollständigen Doctor-Migrationen aus
- sie übernehmen geerdete Kandidaten nicht automatisch in den Live-Kurzzeit-
  Promotion-Speicher, es sei denn, Sie führen zuerst ausdrücklich den vorgemerkten CLI-Pfad aus

Wenn Sie möchten, dass geerdetes historisches Replay die normale tiefe Promotion-
Lane beeinflusst, verwenden Sie stattdessen den CLI-Ablauf:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dadurch werden geerdete dauerhafte Kandidaten in den Kurzzeit-Dreaming-Speicher vorgemerkt, während
`DREAMS.md` als Prüfoberfläche erhalten bleibt.

## Detailliertes Verhalten und Begründung

### 0) Optionales Update (Git-Installationen)

Wenn es sich um einen Git-Checkout handelt und doctor interaktiv ausgeführt wird, bietet es an,
vor der Ausführung von doctor ein Update durchzuführen (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration Legacy-Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifischen Override), normalisiert doctor sie in das aktuelle
Schema.

Dazu gehören auch Legacy-Talk-Flat-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte
Formen von `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen von Legacy-Konfigurationsschlüsseln

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche Legacy-Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein
Legacy-Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Speichers werden von `openclaw doctor --fix` behandelt.

Aktuelle Migrationen:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` auf oberster Ebene
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- Legacy-`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Bei Kanälen mit benannten `accounts`, aber verbliebenen einkonto-spezifischen Kanalwerten auf oberster Ebene, diese kontobezogenen Werte in das für diesen Kanal ausgewählte hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (Legacy-Einstellung für Extension-Relay)

Doctor-Warnungen enthalten außerdem Hinweise zu Kontostandards für Mehrkonto-Kanäle:

- Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Overrides

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Das kann Modelle auf die falsche API zwingen oder Kosten auf null setzen. Doctor warnt, damit Sie
den Override entfernen und API-Routing + Kosten pro Modell wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration noch auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert doctor
sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes Profil `existing-session` verwenden:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Auto-Connect-Profile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  oder `edge://inspect/#remote-debugging`)

Doctor kann die browserseitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- den lokal laufenden Browser
- in diesem Browser aktiviertes Remote-Debugging
- die Bestätigung der ersten Attach-Zustimmungsabfrage im Browser

Die Bereitschaft hier betrifft nur lokale Attach-Voraussetzungen. Existing-session behält
die aktuellen Routenbeschränkungen von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein Raw-CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
Headless-Abläufe. Diese verwenden weiterhin Raw-CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI Codex OAuth-Profil konfiguriert ist, prüft doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack die
Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Behebung in der Regel `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung
selbst dann ausgeführt, wenn das Gateway gesund ist.

### 2c) Codex-OAuth-Provider-Overrides

Wenn Sie zuvor Legacy-OpenAI-Transporteinstellungen unter
`models.providers.openai-codex` hinzugefügt haben, können diese den integrierten Codex-OAuth-
Provider-Pfad überschatten, den neuere Releases automatisch verwenden. Doctor warnt, wenn es
diese alten Transporteinstellungen zusammen mit Codex OAuth sieht, damit Sie den
veralteten Transport-Override entfernen oder umschreiben und das integrierte Routing-/Fallback-Verhalten
wiederherstellen können. Benutzerdefinierte Proxys und reine Header-Overrides werden weiterhin unterstützt und lösen diese Warnung nicht aus.

### 3) Legacy-Zustandsmigrationen (Datenträgerlayout)

Doctor kann ältere Layouts auf dem Datenträger in die aktuelle Struktur migrieren:

- Sitzungsspeicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Authentifizierungszustand (Baileys):
  - von Legacy-`~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

Diese Migrationen sind Best-Effort und idempotent; doctor gibt Warnungen aus, wenn
Legacy-Ordner als Backups zurückbleiben. Gateway/CLI migriert auch die
Legacy-Sitzungen + das Agent-Verzeichnis beim Start automatisch, sodass Verlauf/Auth/Modelle im
pfad pro Agent landen, ohne dass doctor manuell ausgeführt werden muss. Die WhatsApp-Authentifizierung wird absichtlich nur
über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map
vergleicht jetzt nach struktureller Gleichheit, sodass Unterschiede nur in der Schlüsselreihenfolge keine
wiederholten No-Op-Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Legacy-Plugin-Manifest-Migrationen

Doctor scannt alle installierten Plugin-Manifeste auf veraltete Capability-
Schlüssel auf oberster Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der Legacy-Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Legacy-Cron-Speichermigrationen

Doctor prüft außerdem den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus
Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Cron-Bereinigungen umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Payload-`provider`-Delivery-Aliase → explizites `delivery.channel`
- einfache Legacy-Webhook-Fallback-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert `notify: true`-Jobs nur automatisch, wenn dies ohne
Verhaltensänderung möglich ist. Wenn ein Job den Legacy-Notify-Fallback mit einem vorhandenen
Nicht-Webhook-Delivery-Modus kombiniert, warnt doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Session-Locks

Doctor scannt jedes Agent-Sitzungsverzeichnis auf veraltete Write-Lock-Dateien — Dateien, die
zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Lock-Datei meldet es:
den Pfad, die PID, ob die PID noch aktiv ist, das Alter des Locks und ob es als
veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Lock-Dateien automatisch; andernfalls gibt es einen Hinweis aus und
weist Sie an, mit `--fix` erneut auszuführen.

### 4) Integritätsprüfungen des Zustands (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist der operative Hirnstamm. Wenn es verschwindet, verlieren Sie
Sitzungen, Anmeldedaten, Logs und Konfiguration (es sei denn, Sie haben Backups an anderer Stelle).

Doctor prüft:

- **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung
  des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet an, Berechtigungen
  zu reparieren (und gibt einen `chown`-Hinweis aus, wenn ein Besitzer-/Gruppen-Mismatch erkannt wird).
- **Cloud-synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, da sync-gestützte Pfade langsameres I/O
  und Lock-/Sync-Rennen verursachen können.
- **SD- oder eMMC-Zustandsverzeichnis unter Linux**: warnt, wenn der Zustand auf eine `mmcblk*`-
  Mount-Quelle aufgelöst wird, da SD- oder eMMC-gestütztes zufälliges I/O langsamer sein und
  unter Sitzungs- und Credential-Schreibvorgängen schneller verschleißen kann.
- **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungsverzeichnis des Speichers sind
  erforderlich, um den Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen
  Transkriptdateien fehlen.
- **Hauptsitzung „1-zeiliges JSONL“**: markiert, wenn das Haupttranskript nur eine
  Zeile hat (der Verlauf sammelt sich nicht an).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf einen anderen Ort zeigt (der Verlauf kann
  zwischen Installationen aufgeteilt werden).
- **Erinnerung an den Remote-Modus**: wenn `gateway.mode=remote`, erinnert doctor Sie daran,
  es auf dem Remote-Host auszuführen (der Zustand liegt dort).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Zustand der Modellauthentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Speicher, warnt, wenn Tokens bald
ablaufen/bereits abgelaufen sind, und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den
Anthropic-Setup-Token-Pfad vor.
Aufforderungen zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Wenn eine OAuth-Aktualisierung dauerhaft fehlschlägt (zum Beispiel `refresh_token_reused`,
`invalid_grant` oder ein Provider Ihnen mitteilt, sich erneut anzumelden), meldet doctor,
dass eine erneute Authentifizierung erforderlich ist, und gibt den genauen Befehl
`openclaw models auth login --provider ...` aus, den Sie ausführen müssen.

Doctor meldet auch Auth-Profile, die vorübergehend unbrauchbar sind aufgrund von:

- kurzen Cooldowns (Ratenlimits/Timeouts/Auth-Fehler)
- längeren Deaktivierungen (Abrechnungs-/Guthabenfehler)

### 6) Hook-Modellvalidierung

Wenn `hooks.gmail.model` gesetzt ist, validiert doctor die Modellreferenz gegen den
Katalog und die Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft doctor Docker-Images und bietet an, sie zu bauen oder
zu Legacy-Namen zu wechseln, wenn das aktuelle Image fehlt.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert, dass Laufzeitabhängigkeiten gebündelter Plugins (zum Beispiel die
Laufzeitpakete des Discord-Plugins) im Installationsstamm von OpenClaw vorhanden sind.
Wenn welche fehlen, meldet doctor die Pakete und installiert sie im
Modus `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrationen von Gateway-Diensten und Bereinigungshinweise

Doctor erkennt Legacy-Gateway-Dienste (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Dienst mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen gateway-ähnlichen Diensten scannen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Dienste gelten als erstklassig und werden nicht
als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder ausführbare Legacy-Zustandsmigration hat,
erstellt doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Best-Effort-Migrationsschritte aus: Legacy-Migration des Matrix-Zustands und Vorbereitung
des Legacy-verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und
der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 8c) Geräte-Pairing und Auth-Abweichungen

Doctor prüft jetzt den Zustand des Geräte-Pairings als Teil des normalen Zustandsdurchlaufs.

Was es meldet:

- ausstehende erstmalige Pairing-Anfragen
- ausstehende Rollen-Upgrades für bereits gepaarte Geräte
- ausstehende Bereichs-Upgrades für bereits gepaarte Geräte
- Reparaturen bei Public-Key-Mismatches, bei denen die Geräte-ID noch übereinstimmt, aber die Geräte-
  Identität nicht mehr dem genehmigten Eintrag entspricht
- gepaarte Einträge ohne aktives Token für eine genehmigte Rolle
- gepaarte Tokens, deren Bereiche von der genehmigten Pairing-Baseline abweichen
- lokal gecachte Gerätespeicher-Token-Einträge für das aktuelle Gerät, die älter sind als eine
  gatewayseitige Token-Rotation oder veraltete Bereichsmetadaten enthalten

Doctor genehmigt Pairing-Anfragen nicht automatisch und rotiert Gerätetokens nicht automatisch. Es
gibt stattdessen die genauen nächsten Schritte aus:

- prüfen Sie ausstehende Anfragen mit `openclaw devices list`
- genehmigen Sie die genaue Anfrage mit `openclaw devices approve <requestId>`
- rotieren Sie ein frisches Token mit `openclaw devices rotate --device <deviceId> --role <role>`
- entfernen und genehmigen Sie einen veralteten Eintrag erneut mit `openclaw devices remove <deviceId>`

Dadurch wird die häufige Lücke „bereits gepaart, aber immer noch Pairing erforderlich“
geschlossen: doctor unterscheidet jetzt zwischen erstmaligem Pairing, ausstehenden Rollen-/Bereichs-
Upgrades und veralteten Token-/Geräteidentitäts-Abweichungen.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd linger (Linux)

Wenn es als systemd-Benutzerdienst läuft, stellt doctor sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Abmelden aktiv bleibt.

### 11) Workspace-Status (Skills, Plugins und Legacy-Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Status für den Standard-Agent aus:

- **Skills-Status**: zählt verfügbare, fehlende Anforderungen und durch Allowlist blockierte Skills.
- **Legacy-Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere Legacy-Workspace-Verzeichnisse
  neben dem aktuellen Workspace existieren.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für alle
  Fehler auf; meldet Capabilitys gebündelter Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnose**: zeigt alle Ladezeitwarnungen oder -fehler an, die von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe der Bootstrap-Datei

Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe an oder über dem konfigurierten
Zeichenbudget liegen. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen, Prozentsatz
der Abschneidung, Ursache der Abschneidung (`max/file` oder `max/total`) und insgesamt injizierte
Zeichen als Anteil des Gesamtbudgets. Wenn Dateien abgeschnitten werden oder nahe am
Limit liegen, gibt doctor Hinweise zur Anpassung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Completion

Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell installiert ist
(zsh, bash, fish oder PowerShell):

- Wenn das Shell-Profil ein langsames dynamisches Vervollständigungsmuster verwendet
  (`source <(openclaw completion ...)`), aktualisiert doctor es auf die schnellere
  Variante mit gecachter Datei.
- Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  regeneriert doctor den Cache automatisch.
- Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert doctor zur Installation auf
  (nur interaktiver Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu generieren.

### 12) Prüfungen der Gateway-Authentifizierung (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet doctor an, eines zu generieren.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Schreibgeschützte SecretRef-fähige Reparaturen

Einige Reparaturabläufe müssen konfigurierte Zugangsdaten prüfen, ohne das Fail-Fast-Verhalten der Laufzeit zu schwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie Befehle der Status-Familie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` `@username` versucht, konfigurierte Bot-Zugangsdaten zu verwenden, wenn sie verfügbar sind.
- Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlsablauf nicht verfügbar ist, meldet doctor, dass die Zugangsdaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Gateway-Zustandsprüfung + Neustart

Doctor führt eine Zustandsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund erscheint.

### 13b) Bereitschaft der Erinnerungssuche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Erinnerungssuche für den
Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Wenn nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Binärpfadoption.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  Remote-/downloadbare Modell-URL. Falls sie fehlt, wird ein Wechsel zu einem Remote-Provider vorgeschlagen.
- **Expliziter Remote-Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel in
  der Umgebung oder im Auth-Speicher vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden Remote-
  Provider in der automatischen Auswahlreihenfolge.

Wenn ein Gateway-Prüfergebnis verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung gesund), gleicht doctor dessen Ergebnis mit der für CLI sichtbaren Konfiguration ab und vermerkt
etwaige Abweichungen.

Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu überprüfen.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt doctor eine Prüfung des Kanalstatus aus und meldet
Warnungen mit vorgeschlagenen Behebungen.

### 15) Prüfung der Supervisor-Konfiguration + Reparatur

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. `systemd`-Abhängigkeiten von `network-online` und
Neustartverzögerung). Wenn eine Abweichung gefunden wird, empfiehlt es eine Aktualisierung und kann
die Dienstdaten/Task auf die aktuellen Standardwerte neu schreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Neuschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standard-Reparaturabfragen.
- `openclaw doctor --repair` wendet empfohlene Behebungen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token benötigt und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Installation/Reparatur des Doctor-Dienstes den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
- Für Linux-User-`systemd`-Units umfassen die Prüfungen von doctor auf Token-Abweichungen jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Auth-Metadaten des Dienstes.
- Sie können jederzeit mit `openclaw gateway install --force` ein vollständiges Neuschreiben erzwingen.

### 16) Gateway-Laufzeit + Portdiagnose

Doctor prüft die Laufzeit des Dienstes (PID, letzter Exit-Status) und warnt, wenn der
Dienst installiert, aber nicht tatsächlich ausgeführt wird. Außerdem prüft es auf Portkonflikte
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Dienst auf Bun oder einem von einem Versionsmanager verwalteten Node-Pfad
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades kaputtgehen, da der Dienst Ihre Shell-Initialisierung nicht
lädt. Doctor bietet an, zu einer System-Node-Installation zu migrieren, wenn eine verfügbar ist
(Homebrew/apt/choco).

### 18) Schreiben der Konfiguration + Wizard-Metadaten

Doctor speichert alle Konfigurationsänderungen und versieht die Wizard-Metadaten mit einem Eintrag, um den
Doctor-Lauf zu protokollieren.

### 19) Workspace-Tipps (Backup + Erinnerungssystem)

Doctor schlägt ein Workspace-Erinnerungssystem vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus,
wenn der Workspace noch nicht unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für einen vollständigen Leitfaden zur
Workspace-Struktur und zum Git-Backup (empfohlen: privates GitHub oder GitLab).
