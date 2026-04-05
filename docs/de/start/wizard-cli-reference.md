---
read_when:
    - Du benötigst detailliertes Verhalten für `openclaw onboard`
    - Du debugst Onboarding-Ergebnisse oder integrierst Onboarding-Clients
sidebarTitle: CLI reference
summary: Vollständige Referenz für den CLI-Setup-Ablauf, Auth-/Modell-Setup, Ausgaben und Interna
title: CLI-Setup-Referenz
x-i18n:
    generated_at: "2026-04-05T12:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI-Setup-Referenz

Diese Seite ist die vollständige Referenz für `openclaw onboard`.
Die Kurzfassung findest du unter [Onboarding (CLI)](/de/start/wizard).

## Was der Assistent tut

Der lokale Modus (Standard) führt dich durch:

- Modell- und Auth-Setup (OAuth für OpenAI Code subscription, Anthropic Claude CLI oder API-Key sowie Optionen für MiniMax, GLM, Ollama, Moonshot, StepFun und AI Gateway)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bind, Auth, Tailscale)
- Channels und Provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles und andere gebündelte Channel-Plugins)
- Daemon-Installation (LaunchAgent, systemd-User-Unit oder native Windows Scheduled Task mit Fallback über den Startup-Ordner)
- Health-Check
- Skills-Setup

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder verändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Falls `~/.openclaw/openclaw.json` existiert, wähle Beibehalten, Ändern oder Zurücksetzen.
    - Ein erneutes Ausführen des Assistenten löscht nichts, außer du wählst ausdrücklich Zurücksetzen (oder übergibst `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwende `--reset-scope full`, um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder alte Schlüssel enthält, stoppt der Assistent und fordert dich auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Das Zurücksetzen verwendet `trash` und bietet folgende Umfänge:
      - Nur Konfiguration
      - Konfiguration + Credentials + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell und Auth">
    - Die vollständige Optionsmatrix findest du unter [Auth- und Modelloptionen](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Bootstrap-Ritual beim ersten Start benötigt werden.
    - Workspace-Layout: [Agent-Workspace](/de/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Fragt nach Port, Bind, Auth-Modus und Tailscale-Exposition.
    - Empfohlen: Token-Auth auch bei loopback aktiviert lassen, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (Opt-in)
    - Im Passwort-Modus unterstützt das interaktive Setup ebenfalls die Speicherung als Klartext oder über SecretRef.
    - Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Env-Var in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktiviere Auth nur, wenn du jedem lokalen Prozess vollständig vertraust.
    - Nicht-loopback-Binds erfordern weiterhin Auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Service-Account-JSON + Webhook-Audience
    - [Mattermost](/de/channels/mattermost): Bot-Token + Base-URL
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration
    - [BlueBubbles](/de/channels/bluebubbles): empfohlen für iMessage; Server-URL + Passwort + Webhook
    - [iMessage](/de/channels/imessage): alter `imsg`-CLI-Pfad + DB-Zugriff
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmige ihn mit
      `openclaw pairing approve <channel> <code>` oder verwende Allowlists.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine eingeloggte Benutzersitzung; für headless verwende einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux und Windows über WSL2: systemd-User-Unit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach dem Logout weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); versucht es zuerst ohne sudo.
    - Natives Windows: zuerst Scheduled Task
      - Wenn die Erstellung der Aufgabe verweigert wird, greift OpenClaw auf ein Login-Element pro Benutzer im Startup-Ordner zurück und startet das Gateway sofort.
      - Scheduled Tasks bleiben bevorzugt, weil sie besseren Supervisor-Status bieten.
    - Laufzeitauswahl: Node (empfohlen; erforderlich für WhatsApp und Telegram). Bun wird nicht empfohlen.
  </Step>
  <Step title="Health-Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt die Live-Gateway-Health-Prüfung zur Statusausgabe hinzu, einschließlich Channel-Probes, wenn unterstützt.
  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills und prüft Anforderungen.
    - Lässt dich den Node-Manager wählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS, Android und die macOS-App.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Port-Forward-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diesen Rechner so, dass er sich mit einem Gateway an einem anderen Ort verbindet.

<Info>
Der Remote-Modus installiert oder verändert nichts auf dem Remote-Host.
</Info>

Was du festlegst:

- URL des Remote-Gateways (`ws://...`)
- Token, falls für das Remote-Gateway Auth erforderlich ist (empfohlen)

<Note>
- Wenn das Gateway nur über loopback erreichbar ist, verwende SSH-Tunneling oder ein Tailnet.
- Discovery-Hinweise:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Auth- und Modelloptionen

<AccordionGroup>
  <Accordion title="Anthropic API-Key">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Key und speichert ihn dann für die Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Verwendet einen lokalen Claude-CLI-Login auf dem Gateway-Host wieder und wechselt die Modellauswahl auf eine kanonische Referenz `claude-cli/claude-*`.

    Dies ist ein verfügbarer lokaler Fallback-Pfad in `openclaw onboard` und
    `openclaw configure`. Für den produktiven Einsatz ist ein Anthropic-API-Key vorzuziehen.

    - macOS: prüft den Keychain-Eintrag "Claude Code-credentials"
    - Linux und Windows: verwendet `~/.claude/.credentials.json` erneut, falls vorhanden

    Unter macOS wähle "Always Allow", damit Starts über launchd nicht blockiert werden.

  </Accordion>
  <Accordion title="OpenAI Code subscription (Wiederverwendung von Codex CLI)">
    Falls `~/.codex/auth.json` existiert, kann der Assistent es wiederverwenden.
    Wiederverwendete Credentials von Codex CLI bleiben von Codex CLI verwaltet; bei Ablauf liest OpenClaw
    diese Quelle zuerst erneut, und wenn der Provider sie aktualisieren kann, schreibt er
    die aktualisierte Credential zurück in den Codex-Speicher, statt selbst die Zuständigkeit
    zu übernehmen.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Browser-Ablauf; füge `code#state` ein.

    Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*` verwendet wird.

  </Accordion>
  <Accordion title="OpenAI API-Key">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Key und speichert die Credential dann in Auth-Profilen.

    Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.

  </Accordion>
  <Accordion title="xAI (Grok) API-Key">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt dich den Zen- oder Go-Katalog auswählen.
    Setup-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Key (generisch)">
    Speichert den Key für dich.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Mehr Details: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mehr Details: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M2.7`; API-Key-Setup verwendet
    `minimax/...`, und OAuth-Setup verwendet `minimax-portal/...`.
    Mehr Details: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    Mehr Details: [StepFun](/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Mehr Details: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
    Fragt nach der Base-URL (Standard `http://127.0.0.1:11434`) und bietet dann Cloud + Local oder Local an.
    Erkennt verfügbare Modelle und schlägt Standards vor.
    Mehr Details: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Das interaktive Onboarding unterstützt dieselben Speicheroptionen für API-Keys wie andere API-Key-Abläufe für Provider:
    - **API-Key jetzt einfügen** (Klartext)
    - **Secret Reference verwenden** (Env-Ref oder konfigurierte Provider-Ref, mit Preflight-Validierung)

    Nicht interaktive Flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; greift auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|anthropic>` (optional; Standard `openai`)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt Auth unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wähle ein Standardmodell aus den erkannten Optionen oder gib Provider und Modell manuell ein.
- Wenn das Onboarding mit einer Provider-Auth-Choice startet, bevorzugt der Modellpicker
  automatisch diesen Provider. Für Volcengine und BytePlus gleicht dieselbe Präferenz
  auch deren Coding-Plan-Varianten ab (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Falls dieser Filter für den bevorzugten Provider leer wäre, fällt der Picker auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.

Pfade für Credentials und Profile:

- Auth-Profile (API-Keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Alter OAuth-Import: `~/.openclaw/credentials/oauth.json`

Speichermodus für Credentials:

- Das Standardverhalten beim Onboarding speichert API-Keys als Klartextwerte in Auth-Profilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Speicherung von Klartext-Keys.
  Im interaktiven Setup kannst du Folgendes wählen:
  - Referenz auf eine Umgebungsvariable (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias + ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Preflight-Validierung aus.
  - Env-Refs: validiert Variablennamen + nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Refs: validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn der Preflight fehlschlägt, zeigt das Onboarding den Fehler und lässt dich es erneut versuchen.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` nur env-basiert.
  - Setze die Env-Var des Providers in der Prozessumgebung des Onboardings.
  - Inline-Key-Flags (zum Beispiel `--openai-api-key`) erfordern, dass diese Env-Var gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Für benutzerdefinierte Provider speichert der nicht interaktive Modus `ref` `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall für benutzerdefinierte Provider erfordert `--custom-api-key`, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Auth-Credentials unterstützen im interaktiven Setup Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwort-Modus: Klartext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Setups funktionieren unverändert weiter.

<Note>
Tipp für headless und Server: Schließe OAuth auf einem Rechner mit Browser ab und kopiere dann
die `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine alte Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding setzt dies standardmäßig auf `"coding"`, wenn nichts gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokales Onboarding setzt dies standardmäßig auf `per-channel-peer`, wenn nichts gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack, Discord, Matrix, Microsoft Teams), wenn du sie während der Eingabeaufforderungen aktivierst (Namen werden wenn möglich in IDs aufgelöst)
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - In der manuellen Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` gesetzt werden.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Credentials liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

<Note>
Einige Channels werden als Plugins ausgeliefert. Wenn sie während des Setups ausgewählt werden, fordert der Assistent
dich auf, das Plugin (npm oder lokaler Pfad) vor der Channel-Konfiguration zu installieren.
</Note>

Gateway-Assistent-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte darstellen, ohne die Onboarding-Logik neu implementieren zu müssen.

Signal-Setup-Verhalten:

- Lädt das passende Release-Asset herunter
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- JVM-Builds erfordern Java 21
- Native Builds werden verwendet, wenn verfügbar
- Windows verwendet WSL2 und folgt dem Linux-`signal-cli`-Ablauf innerhalb von WSL

## Verwandte Dokumente

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/cli/onboard)
