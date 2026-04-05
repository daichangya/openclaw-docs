---
read_when:
    - Nach einem bestimmten Onboarding-Schritt oder Flag suchen
    - Onboarding mit dem nicht interaktiven Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für das CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-05T12:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding-Referenz

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Behalten / Ändern / Zurücksetzen**.
    - Das erneute Ausführen des Onboardings löscht **nichts**, es sei denn, Sie wählen ausdrücklich **Zurücksetzen**
      (oder übergeben `--reset`).
    - `--reset` in der CLI verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, stoppt der Assistent und fordert
      Sie auf, vor dem Fortfahren `openclaw doctor` auszuführen.
    - Beim Zurücksetzen wird `trash` verwendet (niemals `rm`) und folgende Bereiche werden angeboten:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic-API-Schlüssel**: verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann für den Daemon-Betrieb.
    - **Anthropic Claude CLI**: bevorzugte Anthropic-Assistent-Option in Onboarding/Konfiguration. Unter macOS prüft das Onboarding den Keychain-Eintrag „Claude Code-credentials“ (wählen Sie „Always Allow“, damit `launchd`-Starts nicht blockieren); unter Linux/Windows wird `~/.claude/.credentials.json` wiederverwendet, falls vorhanden, und die Modellauswahl auf eine kanonische Referenz `claude-cli/claude-*` umgestellt.
    - **Anthropic-Setup-Token (Legacy/manuell)**: wieder in Onboarding/Konfiguration verfügbar, aber Anthropic hat OpenClaw-Nutzern mitgeteilt, dass der OpenClaw-Claude-Login-Pfad als Nutzung durch ein Drittanbieter-Harness zählt und **Extra Usage** für das Claude-Konto erfordert.
    - **OpenAI Code (Codex)-Abonnement (Codex CLI)**: falls `~/.codex/auth.json` vorhanden ist, kann das Onboarding es wiederverwenden. Wiederverwendete Codex-CLI-Anmeldedaten bleiben von Codex CLI verwaltet; bei Ablauf liest OpenClaw diese Quelle zuerst erneut und schreibt, wenn der Provider sie aktualisieren kann, die erneuerten Anmeldedaten zurück in den Codex-Speicher, statt selbst die Verwaltung zu übernehmen.
    - **OpenAI Code (Codex)-Abonnement (OAuth)**: Browser-Ablauf; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*` verwendet wird.
    - **OpenAI-API-Schlüssel**: verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*` verwendet wird.
    - **xAI (Grok)-API-Schlüssel**: fordert `XAI_API_KEY` an und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fordert `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) an und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: fordert die Ollama-Base-URL an, bietet die Modi **Cloud + Local** oder **Local**, erkennt verfügbare Modelle und lädt das ausgewählte lokale Modell bei Bedarf automatisch.
    - Mehr Details: [Ollama](/providers/ollama)
    - **API-Schlüssel**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Multi-Model-Proxy)**: fordert `AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fordert Account-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY` an.
    - Mehr Details: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**: Konfiguration wird automatisch geschrieben; gehosteter Standard ist `MiniMax-M2.7`.
      Die Einrichtung mit API-Schlüssel verwendet `minimax/...`, und die OAuth-Einrichtung verwendet
      `minimax-portal/...`.
    - Mehr Details: [MiniMax](/providers/minimax)
    - **StepFun**: Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fordert `SYNTHETIC_API_KEY` an.
    - Mehr Details: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Überspringen**: noch keine Authentifizierung konfiguriert.
    - Wählen Sie ein Standardmodell aus den erkannten Optionen aus (oder geben Sie `provider/model` manuell ein). Für beste Qualität und geringeres Prompt-Injection-Risiko wählen Sie das stärkste aktuelle Modell, das in Ihrem Provider-Stack verfügbar ist.
    - Das Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Authentifizierung fehlt.
    - Der Speichermodus für API-Schlüssel verwendet standardmäßig Auth-Profilwerte im Klartext. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Referenzen zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile befinden sich unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` dient nur noch dem Legacy-Import.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless-/Server-Umgebungen: Führen Sie OAuth auf einem Rechner mit Browser aus und kopieren Sie dann
    `auth-profiles.json` dieses Agents (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
    Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur eine Legacy-Importquelle.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standard ist `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die Workspace-Dateien, die für das Bootstrap-Ritual des Agents benötigt werden.
    - Vollständiges Workspace-Layout + Backup-Anleitung: [Agent-Workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Freigabe.
    - Empfehlung für Authentifizierung: Behalten Sie **Token** auch bei loopback bei, damit lokale WS-Clients authentifiziert werden müssen.
    - Im Token-Modus bietet das interaktive Setup:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (optional)
      - Quickstart verwendet bestehende SecretRefs in `gateway.auth.token` über die Provider `env`, `file` und `exec` für Onboarding-Probe/Dashboard-Bootstrap wieder.
      - Wenn dieser SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Fehlerbehebung fehl, statt die Runtime-Authentifizierung stillschweigend abzuschwächen.
    - Im Passwortmodus unterstützt das interaktive Setup ebenfalls die Speicherung im Klartext oder per SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere env var in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-loopback-Binds erfordern weiterhin Authentifizierung.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): JSON für Service-Konto + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Base-URL.
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): Legacy-Pfad zu `imsg` CLI + DB-Zugriff.
    - DM-Sicherheit: Standard ist Kopplung. Die erste DM sendet einen Code; Freigabe per `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie diesen Schritt).
    - API-basierte Provider können env vars oder vorhandene Konfiguration für ein schnelles Setup nutzen; schlüssellose Provider verwenden stattdessen ihre providerspezifischen Voraussetzungen.
    - Mit `--skip-search` überspringen.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Setups verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux (und Windows über WSL2): systemd-User-Unit
      - Das Onboarding versucht, `linger` über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Abmelden weiterläuft.
      - Möglicherweise wird nach `sudo` gefragt (schreibt nach `/var/lib/systemd/linger`); zuerst wird es ohne `sudo` versucht.
    - **Runtime-Auswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun wird **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert aber keine aufgelösten Klartext-Token-Werte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus ausdrücklich gesetzt wird.
  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` ergänzt die Statusausgabe um die Live-Integritätsprüfung des Gateways, einschließlich Channel-Probes, wenn unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft Anforderungen.
    - Lässt Sie einen Node-Manager wählen: **npm / pnpm** (bun wird nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige nutzen Homebrew unter macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding SSH-Portweiterleitungsanweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn die Assets der Control UI fehlen, versucht das Onboarding, sie zu bauen; Fallback ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Nicht interaktiver Modus

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

Gateway-Token-SecretRef im nicht interaktiven Modus:

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
`--json` impliziert **nicht** den nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

Providerspezifische Befehlsbeispiele finden Sie unter [CLI-Automatisierung](/start/wizard-cli-automation#provider-specific-examples).
Verwenden Sie diese Referenzseite für die Semantik der Flags und die Reihenfolge der Schritte.

### Agent hinzufügen (nicht interaktiv)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-Assistent-RPC

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut implementieren zu müssen.

## Signal-Setup (`signal-cli`)

Das Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die Installation von `signal-cli` folgt dem Linux-Ablauf innerhalb von WSL.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn MiniMax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn kein Wert gesetzt ist; bestehende explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI-Setup-Referenz](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie diese während der Eingabeaufforderungen aktivieren (Namen werden nach Möglichkeit in IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann weiterhin `yarn` verwenden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` gespeichert.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Channels werden als Plugins bereitgestellt. Wenn Sie eines davon während des Setups auswählen, fordert das Onboarding
Sie auf, es zu installieren (npm oder lokaler Pfad), bevor es konfiguriert werden kann.

## Verwandte Docs

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Onboarding in der macOS-App: [Onboarding](/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (Legacy)
- Skills: [Skills](/tools/skills), [Skills-Konfiguration](/tools/skills-config)
