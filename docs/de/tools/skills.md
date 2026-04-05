---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating oder Laderegeln ändern
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln und Verkabelung von Konfiguration/Umgebung'
title: Skills
x-i18n:
    generated_at: "2026-04-05T12:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw verwendet **mit [AgentSkills](https://agentskills.io) kompatible** Skill-Ordner, um dem Agenten beizubringen, wie Tools verwendet werden. Jeder Skill ist ein Verzeichnis mit einer `SKILL.md`, die YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt **gebündelte Skills** sowie optionale lokale Overrides und filtert sie zur Ladezeit anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen:

1. **Zusätzliche Skill-Ordner**: konfiguriert mit `skills.load.extraDirs`
2. **Gebündelte Skills**: mit der Installation ausgeliefert (npm-Paket oder OpenClaw.app)
3. **Verwaltete/lokale Skills**: `~/.openclaw/skills`
4. **Persönliche Agent-Skills**: `~/.agents/skills`
5. **Projekt-Agent-Skills**: `<workspace>/.agents/skills`
6. **Workspace-Skills**: `<workspace>/skills`

Wenn es einen Konflikt beim Skill-Namen gibt, ist die Priorität:

`<workspace>/skills` (höchste) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills → `skills.load.extraDirs` (niedrigste)

## Skills pro Agent vs. gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Workspace. Das bedeutet:

- **Skills pro Agent** liegen in `<workspace>/skills` und gelten nur für diesen Agenten.
- **Projekt-Agent-Skills** liegen in `<workspace>/.agents/skills` und gelten für
  diesen Workspace vor dem normalen Ordner `skills/` des Workspace.
- **Persönliche Agent-Skills** liegen in `~/.agents/skills` und gelten
  workspaceübergreifend auf diesem Rechner.
- **Gemeinsame Skills** liegen in `~/.openclaw/skills` (verwaltet/lokal) und sind
  für **alle Agenten** auf demselben Rechner sichtbar.
- **Gemeinsame Ordner** können auch über `skills.load.extraDirs` hinzugefügt werden (niedrigste
  Priorität), wenn Sie ein gemeinsames Skills-Paket für mehrere Agenten verwenden möchten.

Wenn derselbe Skill-Name an mehr als einem Ort existiert, gilt die normale Priorität:
Workspace gewinnt, dann Projekt-Agent-Skills, dann persönliche Agent-Skills,
dann verwaltet/lokal, dann gebündelt, dann zusätzliche Verzeichnisse.

## Skill-Allowlists pro Agent

**Speicherort** eines Skills und **Sichtbarkeit** eines Skills sind separate Steuerungen.

- Speicherort/Priorität entscheidet, welche Kopie eines gleichnamigen Skills gewinnt.
- Agent-Allowlists entscheiden, welche sichtbaren Skills ein Agent tatsächlich verwenden kann.

Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann pro Agent mit
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills` weglassen für standardmäßig uneingeschränkte Skills.
- `agents.list[].skills` weglassen, um `agents.defaults.skills` zu erben.
- `agents.list[].skills: []` setzen für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standards zusammengeführt.

OpenClaw wendet die effektive Skill-Menge des Agenten beim Prompt-Aufbau, bei der Erkennung von Skill-Slash-Commands, bei der Sandbox-Synchronisierung und bei Skill-Snapshots an.

## Plugins + Skills

Plugins können ihre eigenen Skills mitliefern, indem sie Verzeichnisse `skills` in
`openclaw.plugin.json` auflisten (Pfade relativ zur Plugin-Root). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist. Heute werden diese Verzeichnisse in denselben
Pfad mit niedriger Priorität wie `skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agent- oder Workspace-Skill sie überschreibt.
Sie können sie über `metadata.openclaw.requires.config` am Konfigurationseintrag des Plugins
steuern. Siehe [Plugins](/tools/plugin) für Erkennung/Konfiguration und [Tools](/tools) für die
Tool-Oberfläche, die diese Skills vermitteln.

## ClawHub (Installation + Synchronisierung)

ClawHub ist das öffentliche Skills-Register für OpenClaw. Durchsuchen Sie es unter
[https://clawhub.ai](https://clawhub.ai). Verwenden Sie die nativen Befehle `openclaw skills`,
um Skills zu entdecken/zu installieren/zu aktualisieren, oder die separate `clawhub`-CLI, wenn
Sie Workflows zum Veröffentlichen/Synchronisieren benötigen.
Vollständige Anleitung: [ClawHub](/tools/clawhub).

Gängige Abläufe:

- Einen Skill in Ihren Workspace installieren:
  - `openclaw skills install <skill-slug>`
- Alle installierten Skills aktualisieren:
  - `openclaw skills update --all`
- Synchronisieren (scannen + Updates veröffentlichen):
  - `clawhub sync --all`

`openclaw skills install` installiert nativ in das aktive Verzeichnis `skills/`
des Workspace. Die separate `clawhub`-CLI installiert ebenfalls in `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis (oder greift auf den konfigurierten OpenClaw-Workspace zurück).
OpenClaw übernimmt dies in der nächsten Sitzung als `<workspace>/skills`.

## Sicherheitshinweise

- Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor dem Aktivieren.
- Bevorzugen Sie sandboxed Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing).
- Die Erkennung von Workspace-Skills und Skills aus zusätzlichen Verzeichnissen akzeptiert nur Skill-Roots und `SKILL.md`-Dateien, deren aufgelöster `realpath` innerhalb der konfigurierten Root bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die UI für Skills-Einstellungen) führen den integrierten Scanner für gefährlichen Code aus, bevor Installer-Metadaten ausgeführt werden. Befunde mit `critical` blockieren standardmäßig, es sei denn, der Aufrufer setzt explizit den Override für gefährlichen Code; verdächtige Befunde führen weiterhin nur zu Warnungen.
- `openclaw skills install <slug>` ist etwas anderes: Es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben beschriebenen Pfad mit Installer-Metadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets in den **Host**-Prozess
  für diesen Agent-Turn (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs heraus.
- Für ein umfassenderes Bedrohungsmodell und Checklisten siehe [Security](/de/gateway/security).

## Format (AgentSkills + Pi-kompatibel)

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Hinweise:

- Wir folgen der AgentSkills-Spezifikation für Layout/Absicht.
- Der Parser, der vom eingebetteten Agenten verwendet wird, unterstützt nur **einzeilige** Frontmatter-Schlüssel.
- `metadata` sollte ein **einzeiliges JSON-Objekt** sein.
- Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.
- Optionale Frontmatter-Schlüssel:
  - `homepage` — URL, die in der macOS-UI für Skills als „Website“ angezeigt wird (auch unterstützt über `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (Standard: `true`). Wenn `true`, wird der Skill als Slash-Command für Benutzer bereitgestellt.
  - `disable-model-invocation` — `true|false` (Standard: `false`). Wenn `true`, wird der Skill aus dem Model-Prompt ausgeschlossen (weiterhin über Benutzeraufruf verfügbar).
  - `command-dispatch` — `tool` (optional). Wenn auf `tool` gesetzt, umgeht der Slash-Command das Model und leitet direkt an ein Tool weiter.
  - `command-tool` — Name des Tools, das aufgerufen werden soll, wenn `command-dispatch: tool` gesetzt ist.
  - `command-arg-mode` — `raw` (Standard). Bei Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergeleitet (kein Core-Parsing).

    Das Tool wird mit folgenden Parametern aufgerufen:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (Filter zur Ladezeit)

OpenClaw **filtert Skills zur Ladezeit** mit `metadata` (einzeiliges JSON):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Felder unter `metadata.openclaw`:

- `always: true` — Skill immer einschließen (andere Gates überspringen).
- `emoji` — optionales Emoji, das von der macOS-UI für Skills verwendet wird.
- `homepage` — optionale URL, die in der macOS-UI für Skills als „Website“ angezeigt wird.
- `os` — optionale Liste von Plattformen (`darwin`, `linux`, `win32`). Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
- `requires.bins` — Liste; jede Binärdatei muss auf `PATH` existieren.
- `requires.anyBins` — Liste; mindestens eine muss auf `PATH` existieren.
- `requires.env` — Liste; Umgebungsvariable muss existieren **oder** in der Konfiguration bereitgestellt werden.
- `requires.config` — Liste von `openclaw.json`-Pfaden, die truthy sein müssen.
- `primaryEnv` — Name der Umgebungsvariable, die `skills.entries.<name>.apiKey` zugeordnet ist.
- `install` — optionales Array von Installer-Spezifikationen, das von der macOS-UI für Skills verwendet wird (brew/node/go/uv/download).

Hinweis zu Sandboxing:

- `requires.bins` wird zur Ladezeit des Skills auf dem **Host** geprüft.
- Wenn ein Agent sandboxed ist, muss die Binärdatei auch **im Container** vorhanden sein.
  Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image).
  `setupCommand` wird einmal ausgeführt, nachdem der Container erstellt wurde.
  Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
  Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI `summarize`
  im Sandbox-Container, um dort ausgeführt zu werden.

Beispiel für einen Installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Hinweise:

- Wenn mehrere Installer aufgelistet sind, wählt das Gateway **eine einzige** bevorzugte Option aus (brew, wenn verfügbar, sonst node).
- Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
- Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
- Node-Installationen respektieren `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Runtime sollte weiterhin Node sein
  (Bun wird für WhatsApp/Telegram nicht empfohlen).
- Die Auswahl Gateway-gestützter Installer ist präferenzgesteuert, nicht nur node-basiert:
  Wenn Installationsspezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den
  konfigurierten Node-Manager und dann andere Fallbacks wie `go` oder `download`.
- Wenn jede Installationsspezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an,
  statt sie auf einen bevorzugten Installer zu reduzieren.
- Go-Installationen: Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway Go zuerst über Homebrew und setzt `GOBIN` nach Möglichkeit auf das `bin`-Verzeichnis von Homebrew.
- Download-Installationen: `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (es sei denn,
er ist in der Konfiguration deaktiviert oder durch `skills.allowBundled` für gebündelte Skills blockiert).

## Konfigurations-Overrides (`~/.openclaw/openclaw.json`)

Gebündelte/verwaltete Skills können umgeschaltet und mit Env-Werten versorgt werden:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-String
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Hinweis: Wenn der Skill-Name Bindestriche enthält, setzen Sie den Schlüssel in Anführungszeichen (JSON5 erlaubt Schlüssel in Anführungszeichen).

Wenn Sie Standard-Bildgenerierung/-Bearbeitung direkt innerhalb von OpenClaw möchten, verwenden Sie das Core-
Tool `image_generate` mit `agents.defaults.imageGenerationModel` statt eines
gebündelten Skills. Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-Workflows.

Für native Bildanalyse verwenden Sie das Tool `image` mit `agents.defaults.imageModel`.
Für native Bildgenerierung/-bearbeitung verwenden Sie `image_generate` mit
`agents.defaults.imageGenerationModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes providerspezifisches Bild-Model wählen, fügen Sie außerdem die Authentifizierung/den API-
Key dieses Providers hinzu.

Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

Regeln:

- `enabled: false` deaktiviert den Skill, auch wenn er gebündelt/installiert ist.
- `env`: wird **nur dann** injiziert, wenn die Variable nicht bereits im Prozess gesetzt ist.
- `apiKey`: Komfortfunktion für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).
- `config`: optionaler Container für benutzerdefinierte Felder pro Skill; benutzerdefinierte Schlüssel müssen hier liegen.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete/Workspace-Skills bleiben unberührt).

## Environment-Injektion (pro Agent-Ausführung)

Wenn eine Agent-Ausführung startet, führt OpenClaw Folgendes aus:

1. Skill-Metadaten lesen.
2. `skills.entries.<key>.env` oder `skills.entries.<key>.apiKey` auf
   `process.env` anwenden.
3. Den System-Prompt mit **zulässigen** Skills erstellen.
4. Die ursprüngliche Umgebung nach Ende der Ausführung wiederherstellen.

Dies ist **auf die Agent-Ausführung begrenzt**, nicht auf eine globale Shell-Umgebung.

## Sitzungs-Snapshot (Leistung)

OpenClaw erstellt einen Snapshot der zulässigen Skills **beim Start einer Sitzung** und verwendet diese Liste für nachfolgende Turns in derselben Sitzung wieder. Änderungen an Skills oder Konfiguration werden mit der nächsten neuen Sitzung wirksam.

Skills können sich auch mitten in einer Sitzung aktualisieren, wenn der Skills-Watcher aktiviert ist oder wenn ein neuer zulässiger Remote-Node erscheint (siehe unten). Betrachten Sie dies als **Hot Reload**: Die aktualisierte Liste wird beim nächsten Agent-Turn übernommen.

Wenn sich die effektive Skill-Allowlist des Agenten für diese Sitzung ändert, aktualisiert OpenClaw
den Snapshot, sodass die sichtbaren Skills mit dem aktuellen Agenten übereinstimmen.

## Remote-macOS-Nodes (Linux-Gateway)

Wenn das Gateway auf Linux läuft, aber ein **macOS-Node** verbunden ist **und `system.run` erlaubt ist** (Exec-Approvals-Sicherheit nicht auf `deny` gesetzt), kann OpenClaw macOS-exklusive Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und dass eine Binärdatei-Prüfung über `system.run` erfolgt. Wenn der macOS-Node später offline geht, bleiben die Skills sichtbar; Aufrufe können fehlschlagen, bis der Node sich erneut verbindet.

## Skills-Watcher (automatische Aktualisierung)

Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Skills-Snapshot, wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Token-Auswirkung (Skills-Liste)

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer Skills in den System-Prompt (über `formatSkillsForPrompt` in `pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead (nur wenn ≥1 Skill):** 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte von `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Hinweise:

- XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.) und erhöht dadurch die Länge.
- Die Token-Zahl variiert je nach Tokenizer des Models. Eine grobe Schätzung im OpenAI-Stil ist ~4 Zeichen/Token, daher entsprechen **97 Zeichen ≈ 24 Tokens** pro Skill zuzüglich Ihrer tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert einen Basissatz von Skills als **gebündelte Skills** als Teil der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für lokale
Overrides gedacht (zum Beispiel, um einen Skill zu pinnen/zu patchen, ohne die gebündelte
Kopie zu ändern). Workspace-Skills gehören dem Benutzer und überschreiben beide bei Namenskonflikten.

## Konfigurationsreferenz

Siehe [Skills-Konfiguration](/tools/skills-config) für das vollständige Konfigurationsschema.

## Suchen Sie nach weiteren Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai).

---

## Verwandt

- [Skills erstellen](/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Skills-Konfiguration](/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash Commands](/tools/slash-commands) — alle verfügbaren Slash-Commands
- [Plugins](/tools/plugin) — Überblick über das Plugin-System
