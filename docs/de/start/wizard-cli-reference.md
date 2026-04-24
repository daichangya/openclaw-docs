---
read_when:
    - Sie benötigen detailliertes Verhalten für `openclaw onboard`
    - Sie beheben Fehler bei Onboarding-Ergebnissen oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Einrichtungsablauf, Auth-/Modell-Einrichtung, Ausgaben und Interna
title: CLI-Einrichtungsreferenz
x-i18n:
    generated_at: "2026-04-24T07:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurzanleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent macht

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Auth-Einrichtung (OpenAI-Code-Abonnement-OAuth, Anthropic Claude CLI oder API key sowie MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Auth, Tailscale)
- Kanäle und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Kanal-Plugins)
- Daemon-Installation (LaunchAgent, systemd user unit oder native Windows Scheduled Task mit Startup-Ordner-Fallback)
- Health-Check
- Skills-Setup

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details des lokalen Ablaufs

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie Keep, Modify oder Reset.
    - Das erneute Ausführen des Assistenten löscht nichts, außer Sie wählen ausdrücklich Reset (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Reset verwendet `trash` und bietet folgende Bereiche:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiger Reset (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix finden Sie unter [Auth- und Modelloptionen](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt Workspace-Dateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind, Auth-Modus und Tailscale-Exposition.
    - Empfohlen: Lassen Sie Token-Auth auch für Loopback aktiviert, sodass lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Generate/store plaintext token** (Standard)
      - **Use SecretRef** (Opt-in)
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Env-Variable in der Umgebung des Onboarding-Prozesses.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Binds außerhalb von Loopback erfordern weiterhin Auth.
  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): JSON für Dienstkonto + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Base-URL
    - [Signal](/de/channels/signal): optionales `signal-cli`-Installieren + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): veralteter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; Freigabe über
      `openclaw pairing approve <channel> <code>` oder über Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert angemeldete Benutzersitzung; für headless verwenden Sie einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd user unit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Logout weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); versucht es zuerst ohne sudo.
    - Native Windows: zuerst Scheduled Task
      - Wenn die Erstellung der Aufgabe verweigert wird, fällt OpenClaw auf ein Anmeldeelement im Startup-Ordner pro Benutzer zurück und startet das Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie besseren Supervisor-Status liefern.
    - Auswahl der Laufzeit: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Health-Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt der Statusausgabe die Live-Gateway-Health-Probe hinzu, einschließlich Kanal-Probes, wenn unterstützt.
  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt Sie den Node-Manager auswählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Fertigstellen">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS, Android und die macOS-App.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent Anweisungen für SSH-Port-Forwarding zur Control UI aus, statt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details des Remote-Modus

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was Sie festlegen:

- URL des Remote-Gateway (`ws://...`)
- Token, wenn Auth des Remote-Gateway erforderlich ist (empfohlen)

<Note>
- Wenn das Gateway nur auf Loopback lauscht, verwenden Sie SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Auth- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Verwendet `ANTHROPIC_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (OAuth)">
    Browser-Ablauf; `code#state` einfügen.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (Device Pairing)">
    Browser-Pairing-Ablauf mit kurzlebigem Device-Code.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn das Modell nicht gesetzt ist oder bereits zur OpenAI-Familie gehört.

  </Accordion>
  <Accordion title="OpenAI API key">
    Verwendet `OPENAI_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert die Zugangsdaten dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn das Modell nicht gesetzt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt Sie zwischen Zen- oder Go-Katalog wählen.
    Setup-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Standard für gehostet ist `MiniMax-M2.7`; Setups mit API key verwenden
    `minimax/...`, und Setups mit OAuth verwenden `minimax-portal/...`.
    Mehr Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten automatisch geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst außerdem `step-3.5-flash-2603`.
    Mehr Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Mehr Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt zunächst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen nach der Base-URL (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standardwerte vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    Mehr Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Moonshot- (Kimi K2) und Kimi-Coding-Konfigurationen werden automatisch geschrieben.
    Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Interaktives Onboarding unterstützt dieselben Speicherauswahlen für API keys wie andere Flows mit Provider-API-key:
    - **Paste API key now** (Klartext)
    - **Use secret reference** (Env-Ref oder konfigurierter Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie ein Standardmodell aus erkannten Optionen oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Provider-Auth-Auswahl startet, bevorzugt der Modellpicker
  diesen Provider automatisch. Bei Volcengine und BytePlus passt dieselbe Präferenz
  auch auf deren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter auf einen bevorzugten Provider leer wäre, fällt der Picker
  auf den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Zugangsdaten und Profile:

- Auth-Profile (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Veralteter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Zugangsdaten:

- Das Standardverhalten des Onboardings speichert API keys als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus statt Speicherung des Schlüssels als Klartext.
  In der interaktiven Einrichtung können Sie wählen zwischen:
  - Referenz auf eine Umgebungsvariable (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - Referenz auf einen konfigurierten Provider (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn der Preflight fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-gestützt.
  - Setzen Sie die Provider-Env-Variable in der Umgebung des Onboarding-Prozesses.
  - Inline-Key-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Env-Variable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive `ref`-Modus `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem benutzerdefinierten Provider-Fall erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Zugangsdaten für Gateway-Auth unterstützen im interaktiven Setup die Auswahl zwischen Klartext und SecretRef:
  - Token-Modus: **Generate/store plaintext token** (Standard) oder **Use SecretRef**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Setups funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Server-Umgebungen: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie dann die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine veraltete Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wurde)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn es nicht gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn Sie sich in den Prompts dafür entscheiden (Namen werden nach Möglichkeit zu IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Manuelle Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` setzen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Zugangsdaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Kanäle werden als Plugins ausgeliefert. Wenn sie während des Setups ausgewählt werden, fragt der Assistent
zuerst nach der Installation des Plugins (npm oder lokaler Pfad), bevor die Kanalkonfiguration erfolgt.
</Note>

Gateway-Assistenten-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte rendern, ohne die Onboarding-Logik neu zu implementieren.

Verhalten beim Signal-Setup:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-`signal-cli`-Ablauf innerhalb von WSL

## Verwandte Dokumentation

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI Automation](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
