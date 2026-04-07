---
read_when:
    - Einen bestimmten Onboarding-Schritt oder ein bestimmtes Flag nachschlagen
    - Onboarding mit dem nicht interaktiven Modus automatisieren
    - Onboarding-Verhalten debuggen
sidebarTitle: Onboarding Reference
summary: 'Vollständige Referenz für CLI-Onboarding: jeder Schritt, jedes Flag und jedes Konfigurationsfeld'
title: Onboarding-Referenz
x-i18n:
    generated_at: "2026-04-07T06:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a142b9ec4323fabb9982d05b64375d2b4a4007dffc910acbee3a38ff871a7236
    source_path: reference/wizard.md
    workflow: 15
---

# Onboarding-Referenz

Dies ist die vollständige Referenz für `openclaw onboard`.
Eine allgemeine Übersicht finden Sie unter [Onboarding (CLI)](/de/start/wizard).

## Ablaufdetails (lokaler Modus)

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Keep / Modify / Reset**.
    - Ein erneutes Ausführen des Onboardings löscht nichts, außer Sie wählen ausdrücklich **Reset**
      (oder übergeben `--reset`).
    - CLI-`--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`,
      um zusätzlich den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, stoppt der Assistent und fordert
      Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Beim Zurücksetzen wird `trash` verwendet (niemals `rm`) und es werden diese Bereiche angeboten:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)
  </Step>
  <Step title="Modell/Auth">
    - **Anthropic-API-Schlüssel**: verwendet `ANTHROPIC_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann für die Nutzung durch den Daemon.
    - **Anthropic-API-Schlüssel**: bevorzugte Anthropic-Assistentenwahl in Onboarding/Konfiguration.
    - **Anthropic-Setup-Token**: weiterhin in Onboarding/Konfiguration verfügbar, obwohl OpenClaw jetzt die Wiederverwendung von Claude CLI bevorzugt, wenn verfügbar.
    - **OpenAI Code (Codex)-Abonnement (Codex CLI)**: wenn `~/.codex/auth.json` vorhanden ist, kann das Onboarding es wiederverwenden. Wiederverwendete Codex-CLI-Anmeldedaten werden weiterhin von Codex CLI verwaltet; bei Ablauf liest OpenClaw zuerst erneut aus dieser Quelle und schreibt aktualisierte Anmeldedaten, wenn der Provider sie erneuern kann, zurück in den Codex-Speicher, statt selbst die Kontrolle zu übernehmen.
    - **OpenAI Code (Codex)-Abonnement (OAuth)**: Browser-Flow; fügen Sie `code#state` ein.
      - Setzt `agents.defaults.model` auf `openai-codex/gpt-5.4`, wenn kein Modell gesetzt ist oder `openai/*` verwendet wird.
    - **OpenAI-API-Schlüssel**: verwendet `OPENAI_API_KEY`, wenn vorhanden, oder fragt nach einem Schlüssel und speichert ihn dann in Auth-Profilen.
      - Setzt `agents.defaults.model` auf `openai/gpt-5.4`, wenn kein Modell gesetzt ist, `openai/*` oder `openai-codex/*`.
    - **xAI (Grok)-API-Schlüssel**: fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider.
    - **OpenCode**: fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`, erhältlich unter https://opencode.ai/auth) und lässt Sie den Zen- oder Go-Katalog auswählen.
    - **Ollama**: fragt nach der Ollama-Basis-URL, bietet den Modus **Cloud + Local** oder **Local** an, erkennt verfügbare Modelle und zieht das ausgewählte lokale Modell bei Bedarf automatisch.
    - Mehr Details: [Ollama](/de/providers/ollama)
    - **API-Schlüssel**: speichert den Schlüssel für Sie.
    - **Vercel AI Gateway (Multi-Model-Proxy)**: fragt nach `AI_GATEWAY_API_KEY`.
    - Mehr Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: fragt nach Account ID, Gateway ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mehr Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
    - **MiniMax**: Konfiguration wird automatisch geschrieben; gehosteter Standard ist `MiniMax-M2.7`.
      Die Einrichtung mit API-Schlüssel verwendet `minimax/...`, die OAuth-Einrichtung
      verwendet `minimax-portal/...`.
    - Mehr Details: [MiniMax](/de/providers/minimax)
    - **StepFun**: Konfiguration wird automatisch für StepFun Standard oder Step Plan auf China- oder globalen Endpunkten geschrieben.
    - Standard enthält derzeit `step-3.5-flash`, und Step Plan enthält zusätzlich `step-3.5-flash-2603`.
    - Mehr Details: [StepFun](/de/providers/stepfun)
    - **Synthetic (Anthropic-kompatibel)**: fragt nach `SYNTHETIC_API_KEY`.
    - Mehr Details: [Synthetic](/de/providers/synthetic)
    - **Moonshot (Kimi K2)**: Konfiguration wird automatisch geschrieben.
    - **Kimi Coding**: Konfiguration wird automatisch geschrieben.
    - Mehr Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
    - **Überspringen**: noch keine Authentifizierung konfiguriert.
    - Wählen Sie aus den erkannten Optionen ein Standardmodell aus (oder geben Sie `provider/model` manuell ein). Für beste Qualität und ein geringeres Risiko durch Prompt-Injection wählen Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    - Onboarding führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder Auth fehlt.
    - Der Speichermodus für API-Schlüssel verwendet standardmäßig Klartextwerte in Auth-Profilen. Verwenden Sie `--secret-input-mode ref`, um stattdessen env-gestützte Refs zu speichern (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-Profile befinden sich unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-Schlüssel + OAuth). `~/.openclaw/credentials/oauth.json` dient nur noch dem Import aus Altbeständen.
    - Mehr Details: [/concepts/oauth](/de/concepts/oauth)
    <Note>
    Tipp für Headless-/Server-Systeme: Schließen Sie OAuth auf einem Rechner mit Browser ab und kopieren Sie dann
    die `auth-profiles.json` dieses Agenten (zum Beispiel
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
    Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
    ist nur noch eine Altquelle für den Import.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standard `~/.openclaw/workspace` (konfigurierbar).
    - Legt die für das Bootstrap-Ritual des Agenten benötigten Workspace-Dateien an.
    - Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent-Workspace](/de/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, Bind, Auth-Modus, Tailscale-Exponierung.
    - Auth-Empfehlung: Behalten Sie **Token** auch für Loopback bei, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Generate/store plaintext token** (Standard)
      - **Use SecretRef** (Opt-in)
      - Quickstart verwendet vorhandene `gateway.auth.token`-SecretRefs der Provider `env`, `file` und `exec` für Onboarding-Probe/Dashboard-Bootstrap erneut.
      - Wenn dieses SecretRef konfiguriert ist, aber nicht aufgelöst werden kann, schlägt das Onboarding frühzeitig mit einer klaren Meldung zur Behebung fehl, statt die Laufzeit-Authentifizierung stillschweigend zu verschlechtern.
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls Klartext- oder SecretRef-Speicherung.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie Auth nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Binds erfordern weiterhin Auth.
  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionaler QR-Login.
    - [Telegram](/de/channels/telegram): Bot-Token.
    - [Discord](/de/channels/discord): Bot-Token.
    - [Google Chat](/de/channels/googlechat): Service-Account-JSON + Webhook-Audience.
    - [Mattermost](/de/channels/mattermost) (Plugin): Bot-Token + Basis-URL.
    - [Signal](/de/channels/signal): optionale `signal-cli`-Installation + Kontokonfiguration.
    - [BlueBubbles](/de/channels/bluebubbles): **empfohlen für iMessage**; Server-URL + Passwort + Webhook.
    - [iMessage](/de/channels/imessage): veralteter `imsg`-CLI-Pfad + DB-Zugriff.
    - DM-Sicherheit: Standard ist Kopplung. Die erste DM sendet einen Code; genehmigen Sie ihn mit `openclaw pairing approve <channel> <code>` oder verwenden Sie Allowlists.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen unterstützten Provider wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG oder Tavily (oder überspringen Sie den Schritt).
    - API-gestützte Provider können für die Schnelleinrichtung Umgebungsvariablen oder bestehende Konfiguration verwenden; schlüssellose Provider nutzen stattdessen ihre providerspezifischen Voraussetzungen.
    - Mit `--skip-search` überspringen.
    - Später konfigurieren: `openclaw configure --section web`.
  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; für Headless-Systeme verwenden Sie einen benutzerdefinierten LaunchDaemon (nicht mitgeliefert).
    - Linux (und Windows über WSL2): systemd-Benutzereinheit
      - Das Onboarding versucht, Lingering über `loginctl enable-linger <user>` zu aktivieren, damit das Gateway nach dem Abmelden weiterläuft.
      - Kann nach sudo fragen (schreibt nach `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - **Laufzeitauswahl:** Node (empfohlen; erforderlich für WhatsApp/Telegram). Bun ist **nicht empfohlen**.
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation es, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
    - Wenn Token-Auth ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst werden kann, wird die Daemon-Installation mit umsetzbaren Hinweisen blockiert.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt wird.
  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls nötig) und führt `openclaw health` aus.
    - Tipp: `openclaw status --deep` erweitert die Statusausgabe um die Live-Gateway-Integritätsprüfung, einschließlich Kanal-Probes, sofern unterstützt (erfordert ein erreichbares Gateway).
  </Step>
  <Step title="Skills (empfohlen)">
    - Liest die verfügbaren Skills und prüft die Anforderungen.
    - Lässt Sie einen Node-Manager auswählen: **npm / pnpm** (Bun nicht empfohlen).
    - Installiert optionale Abhängigkeiten (einige verwenden Homebrew unter macOS).
  </Step>
  <Step title="Abschluss">
    - Zusammenfassung + nächste Schritte, einschließlich iOS-/Android-/macOS-Apps für zusätzliche Funktionen.
  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt das Onboarding SSH-Port-Forwarding-Anweisungen für die Control UI aus, anstatt einen Browser zu öffnen.
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

Fügen Sie `--json` für eine maschinenlesbare Zusammenfassung hinzu.

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

Providerspezifische Befehlsbeispiele finden Sie unter [CLI Automation](/de/start/wizard-cli-automation#provider-specific-examples).
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

## Gateway-Assistenten-RPC

Das Gateway stellt den Onboarding-Ablauf über RPC bereit (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-App, Control UI) können Schritte rendern, ohne die Onboarding-Logik erneut implementieren zu müssen.

## Signal-Einrichtung (signal-cli)

Das Onboarding kann `signal-cli` aus GitHub-Releases installieren:

- Lädt das passende Release-Asset herunter.
- Speichert es unter `~/.openclaw/tools/signal-cli/<version>/`.
- Schreibt `channels.signal.cliPath` in Ihre Konfiguration.

Hinweise:

- JVM-Builds erfordern **Java 21**.
- Native Builds werden verwendet, wenn verfügbar.
- Windows verwendet WSL2; die Installation von signal-cli folgt innerhalb von WSL dem Linux-Ablauf.

## Was der Assistent schreibt

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding setzt standardmäßig `"coding"`, wenn nicht gesetzt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bind, Auth, Tailscale)
- `session.dmScope` (Verhaltensdetails: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Allowlists (Slack/Discord/Matrix/Microsoft Teams), wenn Sie ihnen während der Eingabeaufforderungen zustimmen (Namen werden, wenn möglich, zu IDs aufgelöst).
- `skills.install.nodeManager`
  - `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - In der manuellen Konfiguration kann weiterhin `yarn` verwendet werden, indem `skills.install.nodeManager` direkt gesetzt wird.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten liegen unter `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sitzungen werden unter `~/.openclaw/agents/<agentId>/sessions/` gespeichert.

Einige Kanäle werden als Plugins bereitgestellt. Wenn Sie während der Einrichtung einen solchen auswählen,
fordert das Onboarding Sie auf, ihn zu installieren (npm oder ein lokaler Pfad), bevor er konfiguriert werden kann.

## Verwandte Dokumente

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration)
- Provider: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord), [Google Chat](/de/channels/googlechat), [Signal](/de/channels/signal), [BlueBubbles](/de/channels/bluebubbles) (iMessage), [iMessage](/de/channels/imessage) (veraltet)
- Skills: [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config)
