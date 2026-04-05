---
read_when:
    - Hinzufügen oder Ändern von Doctor-Migrationen
    - Einführen inkompatibler Konfigurationsänderungen
summary: 'Doctor-Befehl: Zustandsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T12:43:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete
Konfiguration/Zustände, prüft die Systemgesundheit und bietet umsetzbare Reparaturschritte.

## Schnellstart

```bash
openclaw doctor
```

### Headless / Automatisierung

```bash
openclaw doctor --yes
```

Akzeptiert Standardwerte ohne Rückfrage (einschließlich Neustart-/Service-/Sandbox-Reparaturschritten, wenn zutreffend).

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

Wird ohne Prompts ausgeführt und wendet nur sichere Migrationen an (Konfigurationsnormalisierung + Verschiebungen von Zuständen auf der Festplatte). Überspringt Neustart-/Service-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern.
Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

```bash
openclaw doctor --deep
```

Prüft Systemdienste auf zusätzliche Gateway-Installationen (launchd/systemd/schtasks).

Wenn Sie Änderungen vor dem Schreiben überprüfen möchten, öffnen Sie zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionale Vorab-Aktualisierung für Git-Installationen (nur interaktiv).
- Prüfung der Aktualität des UI-Protokolls (erstellt die Control UI neu, wenn das Protokollschema neuer ist).
- Zustandsprüfung + Neustart-Prompt.
- Skills-Statusübersicht (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Legacy-Werte.
- Talk-Konfigurationsmigration von veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
- Prüfungen zur Browser-Migration für veraltete Chrome-Erweiterungskonfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Überschreibungen (`models.providers.opencode` / `models.providers.opencode-go`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
- Legacy-Zustandsmigration auf der Festplatte (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Migration veralteter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration veralteter Cron-Speicher (`jobId`, `schedule.cron`, Delivery-/Payload-Felder auf oberster Ebene, Payload-`provider`, einfache Webhook-Fallback-Jobs mit `notify: true`).
- Inspektion von Sitzungs-Sperrdateien und Bereinigung veralteter Sperren.
- Prüfungen auf Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
- Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600), wenn lokal ausgeführt.
- Modell-Authentifizierungszustand: prüft OAuth-Ablauf, kann bald ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur des Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration veralteter Services und Erkennung zusätzlicher Gateways.
- Migration veralteter Matrix-Kanalzustände (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Service installiert, aber nicht ausgeführt; zwischengespeichertes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Prüfungen bewährter Verfahren für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Gateway-Portkollisionen (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Token-Generierung an, wenn keine Token-Quelle existiert; überschreibt keine Token-SecretRef-Konfigurationen).
- Prüfung von systemd linger unter Linux.
- Prüfung der Größe von Workspace-Bootstrap-Dateien (Warnungen bei Kürzung/nahe am Limit für Kontextdateien).
- Prüfung des Status der Shell-Vervollständigung und automatische Installation/Aktualisierung.
- Prüfung der Bereitschaft des Embedding-Providers für Memory Search (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
- Prüfungen bei Source-Installationen (pnpm-Workspace-Mismatch, fehlende UI-Assets, fehlende tsx-Binärdatei).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Detailliertes Verhalten und Begründung

### 0) Optionale Aktualisierung (Git-Installationen)

Wenn dies ein Git-Checkout ist und Doctor interaktiv läuft, bietet es an,
vor der Ausführung von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration veraltete Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifische Überschreibung), normalisiert Doctor sie in das aktuelle
Schema.

Dazu gehören auch veraltete flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey`-Formen in die Provider-Map um.

### 2) Migration veralteter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
Sie auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche veralteten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein
veraltetes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Speichers werden von `openclaw doctor --fix` verarbeitet.

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
- Für Kanäle mit benannten `accounts`, aber verbleibenden kanalweiten Werten für ein einzelnes Konto auf oberster Ebene, diese kontobezogenen Werte in das beförderte Konto für diesen Kanal verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Erweiterung)

Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Multi-Account-Kanäle:

- Wenn zwei oder mehr `channels.<channel>.accounts`-Einträge ohne `channels.<channel>.defaultAccount` oder `accounts.default` konfiguriert sind, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto wählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet konfigurierte Konto-IDs auf.

### 2b) OpenCode-Provider-Überschreibungen

Wenn Sie `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt haben, überschreibt dies den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Das kann Modelle an die falsche API zwingen oder Kosten auf null setzen. Doctor warnt, damit Sie die Überschreibung entfernen und das Routing pro Modell + die Kosten wiederherstellen können.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn Ihre Browser-Konfiguration weiterhin auf den entfernten Pfad der Chrome-Erweiterung zeigt, normalisiert Doctor
sie zum aktuellen hostlokalen Attach-Modell von Chrome MCP:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft außerdem den hostlokalen Chrome-MCP-Pfad, wenn Sie `defaultProfile:
"user"` oder ein konfiguriertes `existing-session`-Profil verwenden:

- prüft, ob Google Chrome auf demselben Host für Standardprofile mit automatischer
  Verbindung installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert Sie daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  oder `edge://inspect/#remote-debugging`)

Doctor kann die browserseitige Einstellung nicht für Sie aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- den lokal laufenden Browser
- im Browser aktiviertes Remote-Debugging
- die Genehmigung des ersten Zustimmungs-Prompts zum Anhängen im Browser

Die Bereitschaft hier betrifft nur lokale Voraussetzungen für das Anhängen. Existing-session behält
die aktuellen Einschränkungen der Chrome-MCP-Route bei; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker-, Sandbox-, Remote-Browser- oder andere
headless Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node-/OpenSSL-TLS-Stack die Zertifikatskette
validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt Doctor plattformspezifische Hinweise zur Behebung aus. Unter macOS mit einem Homebrew-Node
ist die Lösung gewöhnlich `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung
auch dann ausgeführt, wenn das Gateway gesund ist.

### 3) Migrationen veralteter Zustände (Festplattenlayout)

Doctor kann ältere Layouts auf der Festplatte in die aktuelle Struktur migrieren:

- Sitzungsspeicher + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Auth-Zustand (Baileys):
  - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standard-Konto-ID: `default`)

Diese Migrationen erfolgen nach bestem Bemühen und sind idempotent; Doctor gibt Warnungen aus, wenn
veraltete Ordner als Backups zurückbleiben. Gateway/CLI migrieren die
veralteten Sitzungen + das Agent-Verzeichnis beim Start ebenfalls automatisch, sodass Verlauf/Auth/Modelle im
pfad pro Agent landen, ohne dass ein manueller Doctor-Lauf erforderlich ist. Die WhatsApp-Authentifizierung wird absichtlich nur
über `openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt per struktureller Gleichheit, sodass Unterschiede nur in der Schlüsselreihenfolge keine wiederholten
No-op-Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Migrationen veralteter Plugin-Manifeste

Doctor prüft alle installierten Plugin-Manifeste auf veraltete Fähigkeitsschlüssel auf oberster Ebene
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn sie gefunden werden, bietet es an, sie in das `contracts`-
Objekt zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Migrationen veralteter Cron-Speicher

Doctor prüft auch den Cron-Job-Speicher (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus Kompatibilitätsgründen
weiterhin akzeptiert.

Aktuelle Bereinigungen für Cron umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliase für Payload `provider` → explizites `delivery.channel`
- einfache veraltete Webhook-Fallback-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert `notify: true`-Jobs nur automatisch, wenn dies ohne
Verhaltensänderung möglich ist. Wenn ein Job veraltetes Notify-Fallback mit einem bestehenden
Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungssperren

Doctor prüft jedes Sitzungsverzeichnis eines Agent auf veraltete Schreib-Sperrdateien — Dateien, die
zurückbleiben, wenn eine Sitzung abnormal beendet wurde. Für jede gefundene Sperrdatei meldet es:
den Pfad, die PID, ob die PID noch lebt, das Alter der Sperre und ob sie
als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und
fordert Sie auf, mit `--fix` erneut auszuführen.

### 4) Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist der operative Stamm des Gehirns. Wenn es verschwindet, verlieren Sie
Sitzungen, Anmeldedaten, Logs und Konfiguration (außer Sie haben anderweitig Backups).

Doctor prüft:

- **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fordert zur Neuerstellung
  des Verzeichnisses auf und erinnert daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: prüft Schreibbarkeit; bietet die Reparatur von
  Berechtigungen an (und gibt einen `chown`-Hinweis aus, wenn ein Owner-/Gruppen-Mismatch erkannt wird).
- **Cloud-synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn sich der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` befindet, da synchronisationsgestützte Pfade langsamere E/A
  sowie Sperr-/Synchronisationsrennen verursachen können.
- **Zustandsverzeichnis auf Linux-SD oder eMMC**: warnt, wenn sich der Zustand auf eine `mmcblk*`-
  Mount-Quelle auflöst, da zufällige E/A auf SD- oder eMMC-Basis bei Schreibvorgängen für Sitzungen und Anmeldedaten langsamer sein und den Datenträger schneller abnutzen kann.
- **Sitzungsverzeichnisse fehlen**: `sessions/` und das Verzeichnis des Sitzungsspeichers sind
  erforderlich, um den Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen Transkriptdateien fehlen.
- **Hauptsitzung „1-line JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat
  (der Verlauf sammelt sich nicht an).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf etwas anderes zeigt (der Verlauf kann sich zwischen Installationen aufteilen).
- **Hinweis zum Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor daran, dass Sie
  es auf dem Remote-Host ausführen müssen (dort liegt der Zustand).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Modell-Authentifizierungszustand (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Speicher, warnt, wenn Tokens
bald ablaufen/abgelaufen sind, und kann sie aktualisieren, wenn dies sicher möglich ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es die Migration auf Claude CLI oder einen
Anthropic-API-Schlüssel vor.
Prompts zur Aktualisierung erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Doctor meldet auch Auth-Profile, die vorübergehend nicht verwendbar sind aufgrund von:

- kurzen Cooldowns (Ratenlimits/Timeouts/Auth-Fehler)
- längeren Deaktivierungen (Billing-/Kreditfehler)

### 6) Validierung des Hooks-Modells

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegen den
Katalog und die Allowlist und warnt, wenn sie sich nicht auflösen lässt oder nicht erlaubt ist.

### 7) Reparatur des Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder
zu veralteten Namen zu wechseln, falls das aktuelle Image fehlt.

### 7b) Runtime-Abhängigkeiten gebündelter Plugins

Doctor prüft, ob Runtime-Abhängigkeiten gebündelter Plugins (zum Beispiel die
Discord-Plugin-Runtime-Pakete) im OpenClaw-Installationsstamm vorhanden sind.
Wenn welche fehlen, meldet Doctor die Pakete und installiert sie im
Modus `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrationen von Gateway-Services und Hinweise zur Bereinigung

Doctor erkennt veraltete Gateway-Services (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Service mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen gatewayähnlichen Services suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Services gelten als erstklassig und werden nicht
als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder anwendbare Migration eines veralteten Zustands hat,
erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Schritte der Best-Effort-Migration aus: Migration des veralteten Matrix-Zustands und Vorbereitung des veralteten
verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und
der Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider ohne Allowlist für DMs offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd linger (Linux)

Wenn es als systemd-Benutzerdienst läuft, stellt Doctor sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Abmelden aktiv bleibt.

### 11) Workspace-Status (Skills, Plugins und veraltete Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standard-Agent aus:

- **Skills-Status**: zählt geeignete, fehlende Anforderungen und durch Allowlist blockierte Skills.
- **Veraltete Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere veraltete Workspace-Verzeichnisse
  neben dem aktuellen Workspace existieren.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für
  Fehler auf; meldet Fähigkeiten gebündelter Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnostik**: macht Ladezeit-Warnungen oder -Fehler sichtbar, die von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe der Bootstrap-Dateien

Doctor prüft, ob Bootstrap-Dateien des Workspace (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe am oder über dem konfigurierten
Zeichenbudget liegen. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen, den Prozentsatz der
Kürzung, die Ursache der Kürzung (`max/file` oder `max/total`) und die gesamte Anzahl injizierter
Zeichen als Anteil am Gesamtbudget. Wenn Dateien gekürzt werden oder nahe am
Limit liegen, gibt Doctor Hinweise zum Anpassen von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Vervollständigung

Doctor prüft, ob die Tab-Vervollständigung für die aktuelle Shell
(zsh, bash, fish oder PowerShell) installiert ist:

- Wenn das Shell-Profil ein langsames Muster mit dynamischer Vervollständigung verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere
  Variante mit gecachter Datei.
- Wenn die Vervollständigung im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  erzeugt Doctor den Cache automatisch neu.
- Wenn überhaupt keine Vervollständigung konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; mit `--non-interactive` übersprungen).

Führen Sie `openclaw completion --write-state` aus, um den Cache manuell neu zu erzeugen.

### 12) Prüfungen der Gateway-Authentifizierung (lokaler Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Token-Quelle existiert, bietet Doctor an, eines zu generieren.
- Wenn `gateway.auth.token` von SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Schreibgeschützte SecretRef-bewusste Reparaturen

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das schnelle Fehlschlagen zur Laufzeit zu schwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie statusartige Befehle für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` mit `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token über SecretRef konfiguriert ist, aber im aktuellen Befehlsweg nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, statt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Zustandsprüfung des Gateway + Neustart

Doctor führt eine Zustandsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund erscheint.

### 13b) Bereitschaft von Memory Search

Doctor prüft, ob der konfigurierte Embedding-Provider für Memory Search für den
Standard-Agent bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die `qmd`-Binärdatei verfügbar und startbar ist.
  Falls nicht, gibt es Hinweise zur Behebung aus, einschließlich des npm-Pakets und einer manuellen Option für den Binärpfad.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  entfernte/herunterladbare Modell-URL. Falls sie fehlt, wird vorgeschlagen, zu einem entfernten Provider zu wechseln.
- **Expliziter entfernter Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel in der Umgebung oder im Auth-Speicher
  vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, wenn er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden entfernten
  Provider in der Reihenfolge der automatischen Auswahl.

Wenn ein Ergebnis der Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung gesund), gleicht Doctor dessen Ergebnis mit der für die CLI sichtbaren Konfiguration ab und vermerkt
Abweichungen.

Verwenden Sie `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu verifizieren.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt Doctor eine Prüfung des Kanalstatus aus und meldet
Warnungen mit empfohlenen Korrekturen.

### 15) Audit + Reparatur der Supervisor-Konfiguration

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-`network-online`-Abhängigkeiten und
Neustartverzögerung). Wenn es eine Abweichung findet, empfiehlt es eine Aktualisierung und kann
die Service-Datei/Task auf die aktuellen Standardwerte neu schreiben.

Hinweise:

- `openclaw doctor` fragt nach, bevor die Supervisor-Konfiguration neu geschrieben wird.
- `openclaw doctor --yes` akzeptiert die Standard-Prompts zur Reparatur.
- `openclaw doctor --repair` wendet empfohlene Korrekturen ohne Rückfrage an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token benötigt und `gateway.auth.token` von SecretRef verwaltet wird, validiert die Installation/Reparatur des Doctor-Service den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in die Umgebungsmetadaten des Supervisor-Service.
- Wenn die Token-Authentifizierung ein Token benötigt und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt ist.
- Für Linux-user-systemd-Units umfassen die Prüfungen auf Token-Drift von Doctor jetzt sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen beim Vergleich der Service-Authentifizierungsmetadaten.
- Sie können jederzeit ein vollständiges Neuschreiben erzwingen mit `openclaw gateway install --force`.

### 16) Diagnose der Gateway-Laufzeit + des Ports

Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der
Service installiert, aber tatsächlich nicht ausgeführt wird. Es prüft auch auf Portkollisionen
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Bewährte Verfahren für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Service auf Bun oder einem versionsverwalteten Node-Pfad
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades beschädigt werden, weil der Service Ihre Shell-Initialisierung nicht
lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn
verfügbar (Homebrew/apt/choco).

### 18) Schreibvorgang für Konfiguration + Wizard-Metadaten

Doctor persistiert Konfigurationsänderungen und markiert Wizard-Metadaten, um den
Doctor-Lauf aufzuzeichnen.

### 19) Workspace-Tipps (Backup + Speichersystem)

Doctor schlägt bei Fehlen ein Workspace-Speichersystem vor und gibt einen Backup-Hinweis aus,
wenn der Workspace noch nicht unter Git steht.

Siehe [/concepts/agent-workspace](/concepts/agent-workspace) für eine vollständige Anleitung zur
Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).
