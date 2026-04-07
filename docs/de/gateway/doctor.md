---
read_when:
    - Hinzufügen oder Ändern von Doctor-Migrationen
    - Einführen von Breaking Changes in der Konfiguration
summary: 'Doctor-Befehl: Integritätsprüfungen, Konfigurationsmigrationen und Reparaturschritte'
title: Doctor
x-i18n:
    generated_at: "2026-04-07T06:15:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a834dc7aec79c20d17bc23d37fb5f5e99e628d964d55bd8cf24525a7ee57130c
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` ist das Reparatur- und Migrationstool für OpenClaw. Es behebt veraltete
Konfigurationen/Zustände, prüft die Integrität und bietet umsetzbare Reparaturschritte.

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

Wird ohne Eingabeaufforderungen ausgeführt und wendet nur sichere Migrationen an (Konfigurationsnormalisierung + Verschiebungen von On-Disk-Zuständen). Überspringt Neustart-/Service-/Sandbox-Aktionen, die eine menschliche Bestätigung erfordern.
Legacy-Zustandsmigrationen werden automatisch ausgeführt, wenn sie erkannt werden.

```bash
openclaw doctor --deep
```

Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen (launchd/systemd/schtasks).

Wenn du Änderungen vor dem Schreiben prüfen möchtest, öffne zuerst die Konfigurationsdatei:

```bash
cat ~/.openclaw/openclaw.json
```

## Was es tut (Zusammenfassung)

- Optionales Vorab-Update für Git-Installationen (nur interaktiv).
- Frischeprüfung des UI-Protokolls (baut die Control UI neu, wenn das Protokollschema neuer ist).
- Integritätsprüfung + Neustartaufforderung.
- Zusammenfassung des Skills-Status (geeignet/fehlend/blockiert) und Plugin-Status.
- Konfigurationsnormalisierung für Legacy-Werte.
- Migration der Talk-Konfiguration von den veralteten flachen `talk.*`-Feldern zu `talk.provider` + `talk.providers.<provider>`.
- Browser-Migrationsprüfungen für veraltete Chrome-Extension-Konfigurationen und Chrome-MCP-Bereitschaft.
- Warnungen zu OpenCode-Provider-Overrides (`models.providers.opencode` / `models.providers.opencode-go`).
- Prüfung der OAuth-TLS-Voraussetzungen für OpenAI-Codex-OAuth-Profile.
- Migration veralteter Zustände auf dem Datenträger (Sitzungen/Agent-Verzeichnis/WhatsApp-Authentifizierung).
- Migration veralteter Plugin-Manifest-Vertragsschlüssel (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration des veralteten Cron-Store (`jobId`, `schedule.cron`, Delivery-/Payload-Felder der obersten Ebene, Payload-`provider`, einfache Fallback-Webhook-Jobs mit `notify: true`).
- Prüfung von Sitzungs-Lock-Dateien und Bereinigung veralteter Sperren.
- Prüfungen der Zustandsintegrität und Berechtigungen (Sitzungen, Transkripte, Zustandsverzeichnis).
- Prüfung der Berechtigungen der Konfigurationsdatei (chmod 600) bei lokaler Ausführung.
- Integrität der Modellauthentifizierung: prüft OAuth-Ablauf, kann ablaufende Tokens aktualisieren und meldet Cooldown-/Deaktivierungszustände von Auth-Profilen.
- Erkennung zusätzlicher Workspace-Verzeichnisse (`~/openclaw`).
- Reparatur von Sandbox-Images, wenn Sandboxing aktiviert ist.
- Migration veralteter Services und Erkennung zusätzlicher Gateways.
- Migration veralteter Matrix-Kanalzustände (im Modus `--fix` / `--repair`).
- Prüfungen der Gateway-Laufzeit (Service installiert, aber nicht ausgeführt; gecachtes launchd-Label).
- Warnungen zum Kanalstatus (vom laufenden Gateway geprüft).
- Audit der Supervisor-Konfiguration (launchd/systemd/schtasks) mit optionaler Reparatur.
- Best-Practice-Prüfungen für die Gateway-Laufzeit (Node vs Bun, Pfade von Versionsmanagern).
- Diagnose von Kollisionen auf dem Gateway-Port (Standard `18789`).
- Sicherheitswarnungen für offene DM-Richtlinien.
- Prüfungen der Gateway-Authentifizierung für den lokalen Token-Modus (bietet Tokengenerierung an, wenn keine Tokenquelle vorhanden ist; überschreibt keine Token-SecretRef-Konfigurationen).
- systemd-linger-Prüfung unter Linux.
- Prüfung der Dateigröße von Workspace-Bootstrap-Dateien (Warnungen bei Abschneidung/nahe am Limit für Kontextdateien).
- Prüfung des Status von Shell-Completion und automatische Installation/Aktualisierung.
- Bereitschaftsprüfung des Embedding-Providers für die Speicher-Suche (lokales Modell, entfernter API-Schlüssel oder QMD-Binärdatei).
- Prüfungen für Source-Installationen (pnpm-Workspace-Mismatch, fehlende UI-Assets, fehlende tsx-Binärdatei).
- Schreibt aktualisierte Konfiguration + Wizard-Metadaten.

## Detailliertes Verhalten und Begründung

### 0) Optionales Update (Git-Installationen)

Wenn dies ein Git-Checkout ist und Doctor interaktiv ausgeführt wird, bietet es an,
vor der Ausführung von Doctor zu aktualisieren (fetch/rebase/build).

### 1) Konfigurationsnormalisierung

Wenn die Konfiguration veraltete Wertformen enthält (zum Beispiel `messages.ackReaction`
ohne kanalspezifischen Override), normalisiert Doctor sie auf das aktuelle
Schema.

Dazu gehören veraltete flache Talk-Felder. Die aktuelle öffentliche Talk-Konfiguration ist
`talk.provider` + `talk.providers.<provider>`. Doctor schreibt alte Formen von
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` in die Provider-Map um.

### 2) Migrationen veralteter Konfigurationsschlüssel

Wenn die Konfiguration veraltete Schlüssel enthält, verweigern andere Befehle die Ausführung und fordern
dich auf, `openclaw doctor` auszuführen.

Doctor wird:

- Erklären, welche veralteten Schlüssel gefunden wurden.
- Die angewendete Migration anzeigen.
- `~/.openclaw/openclaw.json` mit dem aktualisierten Schema neu schreiben.

Das Gateway führt Doctor-Migrationen beim Start ebenfalls automatisch aus, wenn es ein
veraltetes Konfigurationsformat erkennt, sodass veraltete Konfigurationen ohne manuelles Eingreifen repariert werden.
Migrationen des Cron-Job-Stores werden von `openclaw doctor --fix` verarbeitet.

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
- Für Kanäle mit benannten `accounts`, aber weiterhin vorhandenen Top-Level-Kanalwerten für Einzelkonten, diese kontobezogenen Werte in das für diesen Kanal hochgestufte Konto verschieben (`accounts.default` für die meisten Kanäle; Matrix kann ein vorhandenes passendes benanntes/Standardziel beibehalten)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` entfernen (veraltete Relay-Einstellung der Extension)

Doctor-Warnungen enthalten auch Hinweise zu Standardkonten für Multi-Account-Kanäle:

- Wenn zwei oder mehr Einträge in `channels.<channel>.accounts` konfiguriert sind, ohne `channels.<channel>.defaultAccount` oder `accounts.default`, warnt Doctor, dass Fallback-Routing ein unerwartetes Konto auswählen kann.
- Wenn `channels.<channel>.defaultAccount` auf eine unbekannte Konto-ID gesetzt ist, warnt Doctor und listet die konfigurierten Konto-IDs auf.

### 2b) OpenCode-Provider-Overrides

Wenn du `models.providers.opencode`, `opencode-zen` oder `opencode-go`
manuell hinzugefügt hast, überschreibt das den integrierten OpenCode-Katalog aus `@mariozechner/pi-ai`.
Das kann Modelle zur falschen API zwingen oder Kosten auf null setzen. Doctor warnt dich, damit du den Override entfernen und das Routing pro Modell + die Kosten wiederherstellen kannst.

### 2c) Browser-Migration und Chrome-MCP-Bereitschaft

Wenn deine Browser-Konfiguration noch auf den entfernten Chrome-Extension-Pfad zeigt, normalisiert Doctor
sie auf das aktuelle hostlokale Chrome-MCP-Attach-Modell:

- `browser.profiles.*.driver: "extension"` wird zu `"existing-session"`
- `browser.relayBindHost` wird entfernt

Doctor prüft auch den hostlokalen Chrome-MCP-Pfad, wenn du `defaultProfile:
"user"` oder ein konfiguriertes `existing-session`-Profil verwendest:

- prüft, ob Google Chrome auf demselben Host für Standard-
  Auto-Connect-Profile installiert ist
- prüft die erkannte Chrome-Version und warnt, wenn sie unter Chrome 144 liegt
- erinnert dich daran, Remote-Debugging auf der Browser-Inspect-Seite zu aktivieren (zum
  Beispiel `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  oder `edge://inspect/#remote-debugging`)

Doctor kann die Chrome-seitige Einstellung nicht für dich aktivieren. Hostlokales Chrome MCP
erfordert weiterhin:

- einen Chromium-basierten Browser 144+ auf dem Gateway-/Node-Host
- den lokal laufenden Browser
- aktiviertes Remote-Debugging in diesem Browser
- das Bestätigen der ersten Attach-Zustimmungsaufforderung im Browser

Die Bereitschaft hier bezieht sich nur auf lokale Attach-Voraussetzungen. Existing-session behält
die aktuellen Routenbeschränkungen von Chrome MCP bei; erweiterte Routen wie `responsebody`, PDF-
Export, Download-Abfangung und Batch-Aktionen erfordern weiterhin einen verwalteten
Browser oder ein rohes CDP-Profil.

Diese Prüfung gilt **nicht** für Docker, Sandbox, Remote-Browser oder andere
headless Abläufe. Diese verwenden weiterhin rohes CDP.

### 2d) OAuth-TLS-Voraussetzungen

Wenn ein OpenAI-Codex-OAuth-Profil konfiguriert ist, prüft Doctor den OpenAI-
Autorisierungsendpunkt, um zu verifizieren, dass der lokale Node/OpenSSL-TLS-Stack die
Zertifikatskette validieren kann. Wenn die Prüfung mit einem Zertifikatsfehler fehlschlägt (zum
Beispiel `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, abgelaufenes Zertifikat oder selbstsigniertes Zertifikat),
gibt Doctor plattformspezifische Anleitungen zur Behebung aus. Unter macOS mit einem Homebrew-Node ist die
Behebung normalerweise `brew postinstall ca-certificates`. Mit `--deep` wird die Prüfung auch dann ausgeführt,
wenn das Gateway gesund ist.

### 3) Legacy-Zustandsmigrationen (Datenträgerlayout)

Doctor kann ältere On-Disk-Layouts in die aktuelle Struktur migrieren:

- Sitzungs-Store + Transkripte:
  - von `~/.openclaw/sessions/` nach `~/.openclaw/agents/<agentId>/sessions/`
- Agent-Verzeichnis:
  - von `~/.openclaw/agent/` nach `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp-Authentifizierungszustand (Baileys):
  - von veraltetem `~/.openclaw/credentials/*.json` (außer `oauth.json`)
  - nach `~/.openclaw/credentials/whatsapp/<accountId>/...` (Standardkonto-ID: `default`)

Diese Migrationen erfolgen nach Best Effort und sind idempotent; Doctor gibt Warnungen aus, wenn
es veraltete Ordner als Backups zurücklässt. Das Gateway/die CLI migriert auch automatisch
die veralteten Sitzungen + das Agent-Verzeichnis beim Start, sodass Verlauf/Auth/Modelle ohne manuellen Doctor-Lauf im
agentenspezifischen Pfad landen. Die WhatsApp-Authentifizierung wird absichtlich nur über
`openclaw doctor` migriert. Die Normalisierung von Talk-Provider/Provider-Map vergleicht jetzt
nach struktureller Gleichheit, sodass Unterschiede nur in der Schlüsselreihenfolge keine
wiederholten No-op-Änderungen durch `doctor --fix` mehr auslösen.

### 3a) Migrationen veralteter Plugin-Manifeste

Doctor scannt alle installierten Plugin-Manifeste auf veraltete Capability-
Schlüssel der obersten Ebene (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Wenn welche gefunden werden, bietet es an, sie in das Objekt `contracts`
zu verschieben und die Manifestdatei direkt neu zu schreiben. Diese Migration ist idempotent;
wenn der Schlüssel `contracts` bereits dieselben Werte enthält, wird der veraltete Schlüssel entfernt,
ohne die Daten zu duplizieren.

### 3b) Migrationen des veralteten Cron-Stores

Doctor prüft auch den Cron-Job-Store (`~/.openclaw/cron/jobs.json` standardmäßig,
oder `cron.store`, wenn überschrieben) auf alte Job-Formen, die der Scheduler aus
Kompatibilitätsgründen weiterhin akzeptiert.

Aktuelle Bereinigungen für Cron umfassen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- Payload-Felder auf oberster Ebene (`message`, `model`, `thinking`, ...) → `payload`
- Delivery-Felder auf oberster Ebene (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- Delivery-Aliasse des Payload-`provider` → explizites `delivery.channel`
- einfache veraltete Fallback-Webhook-Jobs mit `notify: true` → explizites `delivery.mode="webhook"` mit `delivery.to=cron.webhook`

Doctor migriert Jobs mit `notify: true` nur dann automatisch, wenn dies möglich ist, ohne
das Verhalten zu ändern. Wenn ein Job einen veralteten Notify-Fallback mit einem vorhandenen
Nicht-Webhook-Delivery-Modus kombiniert, warnt Doctor und überlässt diesen Job der manuellen Prüfung.

### 3c) Bereinigung von Sitzungs-Sperren

Doctor scannt jedes Agenten-Sitzungsverzeichnis auf veraltete Schreib-Sperrdateien — Dateien, die zurückbleiben,
wenn eine Sitzung ungewöhnlich beendet wurde. Für jede gefundene Sperrdatei meldet es:
den Pfad, die PID, ob die PID noch lebt, das Alter der Sperre und ob sie
als veraltet gilt (tote PID oder älter als 30 Minuten). Im Modus `--fix` / `--repair`
entfernt es veraltete Sperrdateien automatisch; andernfalls gibt es einen Hinweis aus und
weist dich an, mit `--fix` erneut auszuführen.

### 4) Prüfungen der Zustandsintegrität (Sitzungspersistenz, Routing und Sicherheit)

Das Zustandsverzeichnis ist das operative Rückgrat. Wenn es verschwindet, verlierst du
Sitzungen, Anmeldedaten, Logs und Konfiguration (sofern du keine Backups an anderer Stelle hast).

Doctor prüft:

- **Zustandsverzeichnis fehlt**: warnt vor katastrophalem Zustandsverlust, fragt nach, ob das
  Verzeichnis neu erstellt werden soll, und erinnert dich daran, dass fehlende Daten nicht wiederhergestellt werden können.
- **Berechtigungen des Zustandsverzeichnisses**: prüft die Schreibbarkeit; bietet an, Berechtigungen
  zu reparieren (und gibt einen `chown`-Hinweis aus, wenn ein Eigentümer-/Gruppen-Mismatch erkannt wird).
- **Cloud-synchronisiertes Zustandsverzeichnis unter macOS**: warnt, wenn der Zustand unter iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oder
  `~/Library/CloudStorage/...` aufgelöst wird, weil synchronisationsgestützte Pfade zu langsamerem I/O
  und Sperr-/Synchronisationskonflikten führen können.
- **Linux-Zustandsverzeichnis auf SD oder eMMC**: warnt, wenn der Zustand auf eine `mmcblk*`-
  Mount-Quelle aufgelöst wird, weil zufällige I/O auf SD- oder eMMC-Medien langsamer sein und
  unter Sitzungs- und Credential-Schreibvorgängen schneller verschleißen kann.
- **Sitzungsverzeichnisse fehlen**: `sessions/` und das Sitzungs-Store-Verzeichnis sind
  erforderlich, um den Verlauf zu persistieren und `ENOENT`-Abstürze zu vermeiden.
- **Transkript-Mismatch**: warnt, wenn bei aktuellen Sitzungseinträgen
  Transkriptdateien fehlen.
- **Hauptsitzung „1-zeilige JSONL“**: markiert, wenn das Haupttranskript nur eine Zeile hat
  (der Verlauf sammelt sich nicht an).
- **Mehrere Zustandsverzeichnisse**: warnt, wenn mehrere `~/.openclaw`-Ordner über
  Home-Verzeichnisse hinweg existieren oder wenn `OPENCLAW_STATE_DIR` auf etwas anderes zeigt (der Verlauf kann
  zwischen Installationen aufgeteilt werden).
- **Hinweis zum Remote-Modus**: wenn `gateway.mode=remote`, erinnert Doctor dich daran,
  es auf dem Remote-Host auszuführen (der Zustand liegt dort).
- **Berechtigungen der Konfigurationsdatei**: warnt, wenn `~/.openclaw/openclaw.json`
  für Gruppe/Welt lesbar ist, und bietet an, auf `600` zu verschärfen.

### 5) Integrität der Modellauthentifizierung (OAuth-Ablauf)

Doctor prüft OAuth-Profile im Auth-Store, warnt bei
ablaufenden/abgelaufenen Tokens und kann sie aktualisieren, wenn dies sicher ist. Wenn das Anthropic-
OAuth-/Token-Profil veraltet ist, schlägt es einen Anthropic-API-Schlüssel oder den
Anthropic-Setup-Token-Pfad vor.
Aufforderungen zum Aktualisieren erscheinen nur bei interaktiver Ausführung (TTY); `--non-interactive`
überspringt Aktualisierungsversuche.

Doctor meldet auch Auth-Profile, die vorübergehend nicht nutzbar sind aufgrund von:

- kurzen Cooldowns (Rate Limits/Timeouts/Auth-Fehler)
- längeren Deaktivierungen (Billing-/Kreditfehler)

### 6) Modellvalidierung für Hooks

Wenn `hooks.gmail.model` gesetzt ist, validiert Doctor die Modellreferenz gegenüber dem
Katalog und der Allowlist und warnt, wenn sie nicht aufgelöst wird oder nicht erlaubt ist.

### 7) Reparatur von Sandbox-Images

Wenn Sandboxing aktiviert ist, prüft Doctor Docker-Images und bietet an, sie zu bauen oder
auf veraltete Namen umzuschalten, wenn das aktuelle Image fehlt.

### 7b) Laufzeitabhängigkeiten gebündelter Plugins

Doctor verifiziert, dass Laufzeitabhängigkeiten gebündelter Plugins (zum Beispiel die
Discord-Plugin-Laufzeitpakete) im OpenClaw-Installationsstamm vorhanden sind.
Wenn welche fehlen, meldet Doctor die Pakete und installiert sie im
Modus `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrationen von Gateway-Services und Bereinigungshinweise

Doctor erkennt veraltete Gateway-Services (launchd/systemd/schtasks) und
bietet an, sie zu entfernen und den OpenClaw-Service mit dem aktuellen Gateway-
Port zu installieren. Es kann auch nach zusätzlichen gatewayähnlichen Services suchen und Hinweise zur Bereinigung ausgeben.
Profilbenannte OpenClaw-Gateway-Services gelten als erstklassig und werden nicht
als „zusätzlich“ markiert.

### 8b) Matrix-Migration beim Start

Wenn ein Matrix-Kanalkonto eine ausstehende oder umsetzbare Migration eines veralteten Zustands hat,
erstellt Doctor (im Modus `--fix` / `--repair`) einen Snapshot vor der Migration und führt dann
die Best-Effort-Migrationsschritte aus: Migration des veralteten Matrix-Zustands und Vorbereitung des veralteten
verschlüsselten Zustands. Beide Schritte sind nicht fatal; Fehler werden protokolliert und der
Start wird fortgesetzt. Im schreibgeschützten Modus (`openclaw doctor` ohne `--fix`) wird diese Prüfung
vollständig übersprungen.

### 9) Sicherheitswarnungen

Doctor gibt Warnungen aus, wenn ein Provider für DMs ohne Allowlist offen ist oder
wenn eine Richtlinie auf gefährliche Weise konfiguriert ist.

### 10) systemd-linger (Linux)

Wenn Doctor als systemd-Benutzerservice ausgeführt wird, stellt es sicher, dass Linger aktiviert ist, damit das
Gateway nach dem Logout weiterläuft.

### 11) Workspace-Status (Skills, Plugins und veraltete Verzeichnisse)

Doctor gibt eine Zusammenfassung des Workspace-Zustands für den Standardagenten aus:

- **Skills-Status**: zählt geeignete, fehlende Anforderungen und durch Allowlist blockierte Skills.
- **Veraltete Workspace-Verzeichnisse**: warnt, wenn `~/openclaw` oder andere veraltete Workspace-Verzeichnisse
  neben dem aktuellen Workspace existieren.
- **Plugin-Status**: zählt geladene/deaktivierte/fehlerhafte Plugins; listet Plugin-IDs für etwaige
  Fehler auf; meldet Capabilitys gebündelter Plugins.
- **Kompatibilitätswarnungen für Plugins**: markiert Plugins, die Kompatibilitätsprobleme mit
  der aktuellen Laufzeit haben.
- **Plugin-Diagnose**: zeigt Warnungen oder Fehler an, die zur Ladezeit von der
  Plugin-Registry ausgegeben werden.

### 11b) Größe der Bootstrap-Dateien

Doctor prüft, ob Workspace-Bootstrap-Dateien (zum Beispiel `AGENTS.md`,
`CLAUDE.md` oder andere injizierte Kontextdateien) nahe am konfigurierten
Zeichenbudget liegen oder es überschreiten. Es meldet pro Datei rohe vs. injizierte Zeichenzahlen,
Prozentsatz der Abschneidung, Ursache der Abschneidung (`max/file` oder `max/total`) sowie die gesamten injizierten
Zeichen als Anteil des Gesamtbudgets. Wenn Dateien abgeschnitten werden oder nahe am
Limit liegen, gibt Doctor Tipps zur Abstimmung von `agents.defaults.bootstrapMaxChars`
und `agents.defaults.bootstrapTotalMaxChars` aus.

### 11c) Shell-Completion

Doctor prüft, ob Tab-Completion für die aktuelle Shell
(zsh, bash, fish oder PowerShell) installiert ist:

- Wenn das Shell-Profil ein langsames Muster für dynamische Completion verwendet
  (`source <(openclaw completion ...)`), aktualisiert Doctor es auf die schnellere
  Variante mit gecachter Datei.
- Wenn Completion im Profil konfiguriert ist, aber die Cache-Datei fehlt,
  regeneriert Doctor den Cache automatisch.
- Wenn überhaupt keine Completion konfiguriert ist, fordert Doctor zur Installation auf
  (nur im interaktiven Modus; wird mit `--non-interactive` übersprungen).

Führe `openclaw completion --write-state` aus, um den Cache manuell zu regenerieren.

### 12) Prüfungen der Gateway-Authentifizierung (lokales Token)

Doctor prüft die Bereitschaft der lokalen Gateway-Token-Authentifizierung.

- Wenn der Token-Modus ein Token benötigt und keine Tokenquelle vorhanden ist, bietet Doctor an, eines zu generieren.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, aber nicht verfügbar ist, warnt Doctor und überschreibt es nicht mit Klartext.
- `openclaw doctor --generate-gateway-token` erzwingt die Generierung nur dann, wenn kein Token-SecretRef konfiguriert ist.

### 12b) Schreibgeschützte SecretRef-bewusste Reparaturen

Einige Reparaturabläufe müssen konfigurierte Anmeldedaten prüfen, ohne das Fail-fast-Verhalten der Laufzeit zu schwächen.

- `openclaw doctor --fix` verwendet jetzt dasselbe schreibgeschützte SecretRef-Zusammenfassungsmodell wie die Statusbefehlsfamilie für gezielte Konfigurationsreparaturen.
- Beispiel: Die Reparatur von Telegram-`allowFrom` / `groupAllowFrom` mit `@username` versucht, konfigurierte Bot-Anmeldedaten zu verwenden, wenn verfügbar.
- Wenn das Telegram-Bot-Token per SecretRef konfiguriert ist, aber im aktuellen Befehlsablauf nicht verfügbar ist, meldet Doctor, dass die Anmeldedaten konfiguriert, aber nicht verfügbar sind, und überspringt die automatische Auflösung, anstatt abzustürzen oder das Token fälschlich als fehlend zu melden.

### 13) Integritätsprüfung des Gateways + Neustart

Doctor führt eine Integritätsprüfung aus und bietet an, das Gateway neu zu starten, wenn es
ungesund wirkt.

### 13b) Bereitschaft der Speicher-Suche

Doctor prüft, ob der konfigurierte Embedding-Provider für die Speicher-Suche für
den Standardagenten bereit ist. Das Verhalten hängt vom konfigurierten Backend und Provider ab:

- **QMD-Backend**: prüft, ob die Binärdatei `qmd` verfügbar und startbar ist.
  Falls nicht, werden Hinweise zur Behebung ausgegeben, einschließlich npm-Paket und Option für einen manuellen Binärpfad.
- **Expliziter lokaler Provider**: prüft auf eine lokale Modelldatei oder eine erkannte
  entfernte/herunterladbare Modell-URL. Falls diese fehlt, wird vorgeschlagen, zu einem entfernten Provider zu wechseln.
- **Expliziter entfernter Provider** (`openai`, `voyage` usw.): verifiziert, dass ein API-Schlüssel
  in der Umgebung oder im Auth-Store vorhanden ist. Gibt umsetzbare Hinweise zur Behebung aus, falls er fehlt.
- **Auto-Provider**: prüft zuerst die Verfügbarkeit lokaler Modelle und versucht dann jeden entfernten
  Provider in der Reihenfolge der automatischen Auswahl.

Wenn ein Ergebnis der Gateway-Prüfung verfügbar ist (das Gateway war zum Zeitpunkt der
Prüfung gesund), gleicht Doctor dessen Ergebnis mit der in der CLI sichtbaren Konfiguration ab und weist auf
etwaige Abweichungen hin.

Verwende `openclaw memory status --deep`, um die Embedding-Bereitschaft zur Laufzeit zu verifizieren.

### 14) Warnungen zum Kanalstatus

Wenn das Gateway gesund ist, führt Doctor eine Prüfung des Kanalstatus aus und meldet
Warnungen mit Vorschlägen zur Behebung.

### 15) Audit der Supervisor-Konfiguration + Reparatur

Doctor prüft die installierte Supervisor-Konfiguration (launchd/systemd/schtasks) auf
fehlende oder veraltete Standardwerte (z. B. systemd-Abhängigkeiten von network-online und
Neustartverzögerung). Wenn es eine Abweichung findet, empfiehlt es eine Aktualisierung und kann
die Service-Datei/Aufgabe auf die aktuellen Standardwerte umschreiben.

Hinweise:

- `openclaw doctor` fragt vor dem Umschreiben der Supervisor-Konfiguration nach.
- `openclaw doctor --yes` akzeptiert die Standardaufforderungen zur Reparatur.
- `openclaw doctor --repair` wendet empfohlene Reparaturen ohne Rückfragen an.
- `openclaw doctor --repair --force` überschreibt benutzerdefinierte Supervisor-Konfigurationen.
- Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Service-Installation/-Reparatur von Doctor das SecretRef, persistiert jedoch keine aufgelösten Klartext-Tokenwerte in die Umgebungsmetadaten des Supervisor-Service.
- Wenn die Token-Authentifizierung ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert Doctor den Installations-/Reparaturpfad mit umsetzbaren Hinweisen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert Doctor Installation/Reparatur, bis der Modus explizit gesetzt wird.
- Für Linux-user-systemd-Units umfassen die Prüfungen von Doctor auf Token-Drift jetzt sowohl Quellen aus `Environment=` als auch `EnvironmentFile=` beim Vergleich der Service-Authentifizierungsmetadaten.
- Du kannst jederzeit mit `openclaw gateway install --force` ein vollständiges Umschreiben erzwingen.

### 16) Diagnose von Gateway-Laufzeit + Port

Doctor prüft die Service-Laufzeit (PID, letzter Exit-Status) und warnt, wenn der
Service installiert, aber tatsächlich nicht ausgeführt wird. Es prüft auch auf Portkollisionen
am Gateway-Port (Standard `18789`) und meldet wahrscheinliche Ursachen (Gateway läuft bereits,
SSH-Tunnel).

### 17) Best Practices für die Gateway-Laufzeit

Doctor warnt, wenn der Gateway-Service auf Bun oder einem Node-Pfad eines Versionsmanagers
(`nvm`, `fnm`, `volta`, `asdf` usw.) läuft. WhatsApp- und Telegram-Kanäle erfordern Node,
und Pfade von Versionsmanagern können nach Upgrades kaputtgehen, weil der Service deine Shell-Initialisierung nicht
lädt. Doctor bietet an, auf eine System-Node-Installation zu migrieren, wenn
verfügbar (Homebrew/apt/choco).

### 18) Schreiben der Konfiguration + Wizard-Metadaten

Doctor persistiert alle Konfigurationsänderungen und versieht die Wizard-Metadaten mit einem Marker, um den
Doctor-Lauf aufzuzeichnen.

### 19) Workspace-Tipps (Backup + Speichersystem)

Doctor schlägt ein Workspace-Speichersystem vor, wenn keines vorhanden ist, und gibt einen Backup-Hinweis aus,
falls der Workspace nicht bereits unter Git steht.

Siehe [/concepts/agent-workspace](/de/concepts/agent-workspace) für eine vollständige Anleitung zur
Workspace-Struktur und zu Git-Backups (empfohlen: privates GitHub oder GitLab).
