---
read_when:
    - Ausführen oder Konfigurieren des CLI-Onboardings
    - Einrichten eines neuen Rechners
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: geführte Einrichtung für Gateway, Workspace, Kanäle und Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-07T06:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

CLI-Onboarding ist die **empfohlene** Methode, um OpenClaw unter macOS,
Linux oder Windows (über WSL2; dringend empfohlen) einzurichten.
Es konfiguriert in einem geführten Ablauf ein lokales Gateway oder eine Verbindung zu einem Remote-Gateway sowie Kanäle, Skills
und Workspace-Standards.

```bash
openclaw onboard
```

<Info>
Der schnellste Weg zum ersten Chat: Öffnen Sie die Control UI (keine Kanaleinrichtung erforderlich). Führen Sie
`openclaw dashboard` aus und chatten Sie im Browser. Dokumentation: [Dashboard](/web/dashboard).
</Info>

Zum späteren Neukonfigurieren:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive`.
</Note>

<Tip>
Das CLI-Onboarding enthält einen Schritt zur Websuche, in dem Sie einen Anbieter
wie Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG oder Tavily auswählen können. Einige Anbieter benötigen einen
API-Schlüssel, andere nicht. Sie können dies später auch mit
`openclaw configure --section web` konfigurieren. Dokumentation: [Web tools](/de/tools/web).
</Tip>

## QuickStart vs. Advanced

Das Onboarding beginnt mit **QuickStart** (Standardwerte) vs. **Advanced** (volle Kontrolle).

<Tabs>
  <Tab title="QuickStart (Standardwerte)">
    - Lokales Gateway (loopback)
    - Workspace-Standard (oder vorhandener Workspace)
    - Gateway-Port **18789**
    - Gateway-Auth **Token** (automatisch generiert, selbst bei loopback)
    - Standard für die Tool-Richtlinie bei neuen lokalen Setups: `tools.profile: "coding"` (ein vorhandenes explizites Profil bleibt erhalten)
    - Standard für DM-Isolierung: Lokales Onboarding schreibt `session.dmScope: "per-channel-peer"`, wenn nicht gesetzt. Details: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Standard für Telegram- und WhatsApp-DMs: **Zulassungsliste** (Sie werden nach Ihrer Telefonnummer gefragt)
  </Tab>
  <Tab title="Advanced (volle Kontrolle)">
    - Stellt jeden Schritt bereit (Modus, Workspace, Gateway, Kanäle, Daemon, Skills).
  </Tab>
</Tabs>

## Was das Onboarding konfiguriert

**Lokaler Modus (Standard)** führt Sie durch diese Schritte:

1. **Modell/Auth** — Wählen Sie einen beliebigen unterstützten Anbieter-/Auth-Ablauf (API-Schlüssel, OAuth oder anbieterspezifische manuelle Auth), einschließlich benutzerdefiniertem Anbieter
   (OpenAI-kompatibel, Anthropic-kompatibel oder Unknown Auto-Detect). Wählen Sie ein Standardmodell.
   Sicherheitshinweis: Wenn dieser Agent Tools ausführen oder Webhook-/Hook-Inhalte verarbeiten soll, bevorzugen Sie das stärkste verfügbare Modell der neuesten Generation und halten Sie die Tool-Richtlinie strikt. Schwächere/ältere Stufen lassen sich leichter per Prompt Injection beeinflussen.
   Bei nicht interaktiven Ausführungen speichert `--secret-input-mode ref` env-gestützte Referenzen in Auth-Profilen anstelle von Klartextwerten für API-Schlüssel.
   Im nicht interaktiven `ref`-Modus muss die Env-Var des Anbieters gesetzt sein; die Übergabe von Inline-Schlüssel-Flags ohne diese Env-Var schlägt sofort fehl.
   Bei interaktiven Ausführungen können Sie durch Auswahl des Secret-Referenzmodus entweder auf eine Umgebungsvariable oder auf eine konfigurierte Anbieter-Referenz (`file` oder `exec`) zeigen, mit einer schnellen Vorabvalidierung vor dem Speichern.
   Für Anthropic bietet interaktives Onboarding/Konfigurieren **Anthropic Claude CLI** als bevorzugten lokalen Pfad und **Anthropic API key** als empfohlenen Produktionspfad. Anthropic-Setup-Token bleibt ebenfalls als unterstützter Token-Auth-Pfad verfügbar.
2. **Workspace** — Speicherort für Agent-Dateien (Standard `~/.openclaw/workspace`). Erstellt Bootstrap-Dateien.
3. **Gateway** — Port, Bind-Adresse, Auth-Modus, Tailscale-Freigabe.
   Im interaktiven Token-Modus wählen Sie entweder die standardmäßige Klartextspeicherung des Tokens oder SecretRef.
   Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** — integrierte und gebündelte Chat-Kanäle wie BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** — Installiert einen LaunchAgent (macOS), eine systemd-User-Unit (Linux/WSL2) oder eine native Windows Scheduled Task mit benutzerspezifischem Fallback auf den Startup-Ordner.
   Wenn Token-Auth ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert die Daemon-Installation dieses, persistiert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Supervisor-Dienstes.
   Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, wird die Daemon-Installation mit konkreten Hinweisen blockiert.
   Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Daemon-Installation blockiert, bis der Modus explizit gesetzt ist.
6. **Systemprüfung** — Startet das Gateway und überprüft, ob es läuft.
7. **Skills** — Installiert empfohlene Skills und optionale Abhängigkeiten.

<Note>
Eine erneute Ausführung des Onboardings löscht nichts, es sei denn, Sie wählen ausdrücklich **Reset** (oder übergeben `--reset`).
CLI-`--reset` verwendet standardmäßig Konfiguration, Zugangsdaten und Sitzungen; verwenden Sie `--reset-scope full`, um den Workspace einzuschließen.
Wenn die Konfiguration ungültig ist oder Legacy-Schlüssel enthält, fordert Sie das Onboarding zuerst auf, `openclaw doctor` auszuführen.
</Note>

**Remote-Modus** konfiguriert nur den lokalen Client, damit er sich mit einem Gateway an einem anderen Ort verbindet.
Er installiert oder ändert **nichts** auf dem Remote-Host.

## Weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace,
eigenen Sitzungen und eigenen Auth-Profilen zu erstellen. Das Ausführen ohne `--workspace` startet das Onboarding.

Was dabei gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen dem Muster `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (das Onboarding kann dies erledigen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Detaillierte Schritt-für-Schritt-Aufschlüsselungen und Konfigurationsausgaben finden Sie unter
[CLI Setup Reference](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI Automation](/de/start/wizard-cli-automation).
Die ausführlichere technische Referenz einschließlich RPC-Details finden Sie unter
[Onboarding Reference](/de/reference/wizard).

## Verwandte Dokumente

- CLI-Befehlsreferenz: [`openclaw onboard`](/cli/onboard)
- Onboarding-Überblick: [Onboarding Overview](/de/start/onboarding-overview)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Ritual beim ersten Start des Agenten: [Agent Bootstrapping](/de/start/bootstrapping)
