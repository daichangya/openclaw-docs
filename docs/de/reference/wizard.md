---
read_when:
    - Einen bestimmten Onboarding-Schritt oder ein Flag nachschlagen.
    - Onboarding mit dem nicht-interaktiven Modus automatisieren.
    - Onboarding-Verhalten debuggen.
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-24T06:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Dies ist die vollständige Referenz für `openclaw onboard`.
Für einen Überblick auf hoher Ebene siehe [Onboarding (CLI)](/de/start/wizard).

## Details zum Ablauf (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` existiert, wählen Sie **Keep / Modify / Reset**.
    - Erneutes Ausführen des Onboarding löscht **nichts**, außer Sie wählen ausdrücklich **Reset**
      (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; mit `--reset-scope full`
      wird zusätzlich auch der Workspace entfernt.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Wizard und fordert
      Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Beim Reset wird `trash` verwendet (niemals `rm`) und es werden folgende Scopes angeboten:
      - Nur Konfiguration
      - Konfiguration + Zugangsdaten + Sitzungen
      - Vollständiger Reset (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic API key**: verwendet `ANTHROPIC_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Daemon-Nutzung.
    - **Anthropic API key**: bevorzugte Anthropic-Assistant-Auswahl in Onboarding/Configure.
    - **Anthropic setup-token**: weiterhin in Onboarding/Configure verfügbar, obwohl OpenClaw jetzt die Wiederverwendung von Claude CLI bevorzugt, wenn verfügbar.
    - **OpenAI Code (Codex) subscription (OAuth)**: Browser-Flow; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI Code (Codex) subscription (device pairing)**: Browser-Pairing-Flow mit kurzlebigem Device-Code.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.5`, wenn kein Modell gesetzt ist oder bereits zur OpenAI-Familie gehört.
    - **OpenAI API key**: verwendet `OPENAI_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.
    - **xAI (Grok) API key**: fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: bietet zuerst **Cloud + Local**, **Cloud only** oder **Local only**. `Cloud only` fragt nach `OLLAMA_API_KEY` und verwendet `https://ollama.com`; die hostgestützten Modi fragen nach der Base-URL von Ollama, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell automatisch, wenn nötig; `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API key**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (multi-model proxy)**: fragt nach `AI_GATEWAY_API_KEY`.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fragt nach Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Konfiguration wird automatisch geschrieben; gehosteter Standard ist `MiniMax-M2.7`.
      API-key-Setup verwendet `minimax/...`, und OAuth-Setup verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält außerdem `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: fragt nach `SYNTHETIC_API_KEY`.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Skip**: noch keine Auth konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie Provider/Modell manuell ein). Für beste Qualität und geringeres Risiko durch Prompt-Injection wählen Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    - Onboarding führt einen Modell-Check aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der Speichermodus für API keys verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Refs zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile liegen unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth). `~/.openclaw/credentials/oauth.json` ist nur noch ein Legacy-Import.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless/Server: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie dann
    `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den passenden
    Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur noch eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt die Workspace-Dateien an, die für das Agent-Bootstrap-Ritual benötigt werden.
    - Vollständiges Workspace-Layout + Backup-Anleitung: [Agent workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Exposition.
    - Auth-Empfehlung: **Token** selbst für loopback beibehalten, damit lokale WS-Clients sich authentifizieren müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Generate/store plaintext token** (Standard)
      - **Use SecretRef** (Opt-in)
      - Quickstart verwendet vorhandene SecretRefs in `gateway.auth.token` aus `env`, `file` und `exec` für Onboarding-Probe/Dashboard-Bootstrap erneut.
      - Wenn dieser SecretRef konfiguriert, aber nicht auflösbar ist, schlägt das Onboarding früh mit einer klaren Meldung zur Behebung fehl, statt die Runtime-Auth stillschweigend zu verschlechtern.
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls Speicherung im Klartext oder per SecretRef.
    - Nicht-interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Env-Variable in der Prozessumgebung des Onboarding.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Auth nur deaktivieren, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Binds erfordern weiterhin Auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Service-Account-JSON + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Base-URL.
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-Pfad für `imsg`-CLI + Datenbankzugriff.
    - DM-Sicherheit: Standard ist Pairing. Die erste DM sendet einen Code; genehmigen Sie ihn mit `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Web search">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie dies).
    - API-gestützte Provider können für schnelles Setup Env-Variablen oder vorhandene Konfiguration verwenden; Provider ohne Schlüssel nutzen stattdessen ihre providerspezifischen Voraussetzungen.
    - Mit `--skip-search` überspringen.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless nutzen Sie einen benutzerdefinierten LaunchDaemon (wird nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-User-Unit
      - Onboarding versucht, Linger über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Logout weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); es wird zuerst ohne sudo versucht.
    - **Runtime selection:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun ist **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation dies, persistiert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Services.
    - Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht auflösbar ist, wird die Daemon-Installation mit konkreten Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt wird.
  </Step>
  <Step title="Health-Check">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Health-Prüfung des Gateway, einschließlich Channel-Prüfungen, wenn unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew auf macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding SSH-Port-Forward-Anweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht das Onboarding, sie zu bauen; der Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht-interaktiver Modus

Verwenden Sie `--non-interactive`, um das Onboarding zu automatisieren oder zu skripten:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Fügen Sie `--json` hinzu, um eine maschinenlesbare Zusammenfassung zu erhalten.

Gateway-Token-SecretRef im nicht-interaktiven Modus:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.

<Note>
`--json` impliziert **nicht** den nicht-interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI Automation](/de/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für Flag-Semantik und Schritt-Reihenfolge.

### Agent hinzufügen (nicht-interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Wizard-RPC

Das Gateway stellt den Onboarding-Flow über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik neu implementieren zu müssen.

## Signal-Setup (`signal-cli`)

Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die Installation von `signal-cli` folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Wizard schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax gewählt wurde)
- `tools.profile` (lokales Onboarding setzt standardmäßig `"coding"`, wenn nichts gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie sich während der Prompts dafür entscheiden (Namen werden, wenn möglich, in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optional `bindings`.

WhatsApp-Zugangsdaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Channels werden als Plugins ausgeliefert. Wenn Sie einen davon während des Setups auswählen, fordert das Onboarding
Sie auf, ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumentation

- Überblick über Onboarding: [Onboarding (CLI)](/de/start/wizard)
- Onboarding in der macOS-App: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway configuration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (Legacy)
- Skills: [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config)
