---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating oder Laderegeln ändern
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln und Konfigurations-/Env-Verdrahtung'
title: Skills
x-i18n:
    generated_at: "2026-04-24T07:05:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw verwendet **mit [AgentSkills](https://agentskills.io) kompatible** Skill-Ordner, um dem Agenten beizubringen, wie Tools verwendet werden. Jeder Skill ist ein Verzeichnis, das ein `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt **gebündelte Skills** plus optionale lokale Overrides und filtert sie zur Ladezeit anhand von Umgebung, Konfiguration und Binärdateipräsenz.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen:

1. **Zusätzliche Skill-Ordner**: konfiguriert über `skills.load.extraDirs`
2. **Gebündelte Skills**: werden mit der Installation ausgeliefert (npm-Paket oder OpenClaw.app)
3. **Verwaltete/lokale Skills**: `~/.openclaw/skills`
4. **Persönliche Agent-Skills**: `~/.agents/skills`
5. **Projekt-Agent-Skills**: `<workspace>/.agents/skills`
6. **Workspace-Skills**: `<workspace>/skills`

Wenn ein Skill-Name kollidiert, gilt folgende Priorität:

`<workspace>/skills` (höchste) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills → `skills.load.extraDirs` (niedrigste)

## Pro Agent vs. gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Workspace. Das bedeutet:

- **Skills pro Agent** liegen in `<workspace>/skills` und gelten nur für diesen Agenten.
- **Projekt-Agent-Skills** liegen in `<workspace>/.agents/skills` und gelten für
  diesen Workspace vor dem normalen Ordner `skills/` des Workspace.
- **Persönliche Agent-Skills** liegen in `~/.agents/skills` und gelten
  Workspace-übergreifend auf diesem Rechner.
- **Gemeinsame Skills** liegen in `~/.openclaw/skills` (verwaltet/lokal) und sind
  für **alle Agenten** auf demselben Rechner sichtbar.
- **Gemeinsame Ordner** können auch über `skills.load.extraDirs` hinzugefügt werden (niedrigste
  Priorität), wenn Sie ein gemeinsames Skill-Pack für mehrere Agenten verwenden möchten.

Wenn derselbe Skill-Name an mehr als einem Ort existiert, gilt die übliche
Priorität: Workspace gewinnt, dann Projekt-Agent-Skills, dann persönliche Agent-Skills,
dann verwaltete/lokale, dann gebündelte und dann Extra-Dirs.

## Skill-Allowlists pro Agent

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind getrennte Steuerungen.

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
      { id: "docs", skills: ["docs-search"] }, // ersetzt defaults
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- Lassen Sie `agents.defaults.skills` weg, wenn Skills standardmäßig uneingeschränkt sein sollen.
- Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Defaults zusammengeführt.

OpenClaw wendet die effektive Skill-Menge des Agenten auf Prompt-Erstellung, Skill-
Slash-Command-Erkennung, Sandbox-Synchronisierung und Skill-Snapshots an.

## Plugins + Skills

Plugins können eigene Skills ausliefern, indem sie in
`openclaw.plugin.json` Verzeichnisse `skills` auflisten (Pfade relativ zur Plugin-Wurzel). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist. Aktuell werden diese Verzeichnisse in denselben Pfad mit niedriger Priorität wie `skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agent- oder Workspace-Skill sie überschreibt.
Sie können sie über `metadata.openclaw.requires.config` auf dem Konfigurations-
Eintrag des Plugins gaten. Siehe [Plugins](/de/tools/plugin) für Discovery/Konfiguration und [Tools](/de/tools) für die
Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale experimentelle Plugin Skill Workshop kann Workspace-
Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die während der Agent-Arbeit beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über
`plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur nach `<workspace>/skills`, scannt generierte Inhalte,
unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, quarantänisiert unsichere
Vorschläge und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, sodass neue
Skills ohne Gateway-Neustart verfügbar werden können.

Verwenden Sie es, wenn Korrekturen wie „beim nächsten Mal GIF-Attribution prüfen“ oder
mühsam erarbeitete Workflows wie Media-QA-Checklisten zu dauerhaften prozeduralen
Anweisungen werden sollen. Beginnen Sie mit ausstehender Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen
Workspaces, nachdem Sie die Vorschläge geprüft haben. Vollständige Anleitung:
[Skill Workshop Plugin](/de/plugins/skill-workshop).

## ClawHub (Installieren + Synchronisieren)

ClawHub ist die öffentliche Skills-Registry für OpenClaw. Durchsuchen unter
[https://clawhub.ai](https://clawhub.ai). Verwenden Sie native `openclaw skills`-
Befehle, um Skills zu entdecken/zu installieren/zu aktualisieren, oder die separate `clawhub`-CLI, wenn
Sie Publish-/Sync-Workflows benötigen.
Vollständige Anleitung: [ClawHub](/de/tools/clawhub).

Häufige Abläufe:

- Einen Skill in Ihren Workspace installieren:
  - `openclaw skills install <skill-slug>`
- Alle installierten Skills aktualisieren:
  - `openclaw skills update --all`
- Synchronisieren (scannen + Updates veröffentlichen):
  - `clawhub sync --all`

Das native `openclaw skills install` installiert in das Verzeichnis `skills/`
des aktiven Workspace. Die separate `clawhub`-CLI installiert ebenfalls nach `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis (oder fällt auf den konfigurierten OpenClaw-Workspace zurück).
OpenClaw übernimmt das in der nächsten Sitzung als `<workspace>/skills`.

## Sicherheitshinweise

- Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor dem Aktivieren.
- Bevorzugen Sie sandboxed Läufe für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing).
- Discovery von Workspace-Skills und Skills aus Extra-Dirs akzeptiert nur Skill-Wurzeln und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb der konfigurierten Wurzel bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungs-UI) führen den eingebauten Scanner für gefährlichen Code aus, bevor Installer-Metadaten ausgeführt werden. Befunde vom Typ `critical` blockieren standardmäßig, sofern der Aufrufer nicht explizit das gefährliche Override setzt; verdächtige Befunde erzeugen weiterhin nur Warnungen.
- `openclaw skills install <slug>` ist anders: Es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben genannten Pfad über Installer-Metadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets in den **Host**-Prozess
  für diesen Agent-Turn (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs heraus.
- Für ein breiteres Bedrohungsmodell und Checklisten siehe [Sicherheit](/de/gateway/security).

## Format (AgentSkills + Pi-kompatibel)

`SKILL.md` muss mindestens enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Hinweise:

- Wir folgen der AgentSkills-Spezifikation für Layout/Intention.
- Der vom eingebetteten Agenten verwendete Parser unterstützt nur **einzeilige** Frontmatter-Schlüssel.
- `metadata` sollte ein **einzeiliges JSON-Objekt** sein.
- Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.
- Optionale Frontmatter-Schlüssel:
  - `homepage` — URL, die in der macOS-Skills-UI als „Website“ angezeigt wird (auch unterstützt über `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (Standard: `true`). Wenn `true`, wird der Skill als User-Slash-Command bereitgestellt.
  - `disable-model-invocation` — `true|false` (Standard: `false`). Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (weiterhin über Benutzerauslösung verfügbar).
  - `command-dispatch` — `tool` (optional). Wenn auf `tool` gesetzt, umgeht der Slash-Command das Modell und dispatcht direkt an ein Tool.
  - `command-tool` — Name des Tools, das aufgerufen werden soll, wenn `command-dispatch: tool` gesetzt ist.
  - `command-arg-mode` — `raw` (Standard). Für Tool-Dispatch wird der rohe Args-String an das Tool weitergeleitet (kein Core-Parsing).

    Das Tool wird mit folgenden Parametern aufgerufen:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (Filter zur Ladezeit)

OpenClaw **filtert Skills zur Ladezeit** über `metadata` (einzeiliges JSON):

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

- `always: true` — den Skill immer einschließen (andere Gates überspringen).
- `emoji` — optionales Emoji, das von der macOS-Skills-UI verwendet wird.
- `homepage` — optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
- `os` — optionale Liste von Plattformen (`darwin`, `linux`, `win32`). Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
- `requires.bins` — Liste; jeder Eintrag muss auf `PATH` existieren.
- `requires.anyBins` — Liste; mindestens einer muss auf `PATH` existieren.
- `requires.env` — Liste; Env-Variable muss existieren **oder** in der Konfiguration bereitgestellt werden.
- `requires.config` — Liste von Pfaden in `openclaw.json`, die truthy sein müssen.
- `primaryEnv` — Name der Env-Variablen, die mit `skills.entries.<name>.apiKey` verknüpft ist.
- `install` — optionales Array mit Installer-Spezifikationen, das von der macOS-Skills-UI verwendet wird (brew/node/go/uv/download).

Hinweis zu Sandboxing:

- `requires.bins` wird zur Skill-Ladezeit auf dem **Host** geprüft.
- Wenn ein Agent sandboxed ist, muss die Binärdatei auch **im Container** existieren.
  Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image).
  `setupCommand` läuft einmal nach der Erstellung des Containers.
  Paketinstallationen benötigen außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer in der Sandbox.
  Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI `summarize`
  im Sandbox-Container, um dort ausgeführt zu werden.

Installer-Beispiel:

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

- Wenn mehrere Installer aufgelistet sind, wählt das Gateway **eine einzelne** bevorzugte Option aus (brew, wenn verfügbar, sonst node).
- Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
- Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
- Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Runtime sollte weiterhin Node
  sein (Bun wird für WhatsApp/Telegram nicht empfohlen).
- Die Auswahl von Installern durch das Gateway ist präferenzgesteuert, nicht nur node-basiert:
  wenn Installer-Spezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den
  konfigurierten Node-Manager und dann andere Fallbacks wie `go` oder `download`.
- Wenn jede Install-Spezifikation `download` ist, stellt OpenClaw alle Download-Optionen bereit,
  statt sie auf einen bevorzugten Installer zu reduzieren.
- Go-Installationen: Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf das `bin` von Homebrew.
- Download-Installationen: `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (es sei denn,
er ist in der Konfiguration deaktiviert oder wird bei gebündelten Skills von `skills.allowBundled` blockiert).

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

Wenn Sie Standard-Bilderzeugung/-bearbeitung direkt in OpenClaw möchten, verwenden Sie das Core-
Tool `image_generate` mit `agents.defaults.imageGenerationModel` statt eines
gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-Workflows.

Für native Bildanalyse verwenden Sie das Tool `image` mit `agents.defaults.imageModel`.
Für native Bilderzeugung/-bearbeitung verwenden Sie `image_generate` mit
`agents.defaults.imageGenerationModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes providerspezifisches Bildmodell wählen, fügen Sie auch dessen Auth/API-
Key hinzu.

Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

Regeln:

- `enabled: false` deaktiviert den Skill, auch wenn er gebündelt/installiert ist.
- `env`: wird **nur dann** injiziert, wenn die Variable nicht bereits im Prozess gesetzt ist.
- `apiKey`: Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).
- `config`: optionaler Container für benutzerdefinierte Felder pro Skill; benutzerdefinierte Schlüssel müssen hier liegen.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in dieser Liste zulässig (verwaltete/Workspace-Skills sind nicht betroffen).

## Umgebungsinjektion (pro Agent-Lauf)

Wenn ein Agent-Lauf startet, tut OpenClaw Folgendes:

1. Skill-Metadaten lesen.
2. Alle `skills.entries.<key>.env` oder `skills.entries.<key>.apiKey` auf
   `process.env` anwenden.
3. Den System-Prompt mit **zulässigen** Skills aufbauen.
4. Die ursprüngliche Umgebung wiederherstellen, nachdem der Lauf endet.

Dies ist **auf den Agent-Lauf begrenzt**, nicht auf eine globale Shell-Umgebung.

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw denselben
zulässigen Snapshot außerdem als temporäres Claude-Code-Plugin und übergibt es mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Priorität, Allowlists pro Agent, Gating und
Env-/API-Key-Injektion über `skills.entries.*` steuert. Andere CLI Backends verwenden nur den Prompt-
Katalog.

## Sitzungs-Snapshot (Performance)

OpenClaw erstellt einen Snapshot der zulässigen Skills **beim Start einer Sitzung** und verwendet diese Liste für nachfolgende Turns in derselben Sitzung wieder. Änderungen an Skills oder Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können auch mitten in einer Sitzung aktualisiert werden, wenn der Skills-Watcher aktiviert ist oder wenn ein neuer zulässiger Remote-Node erscheint (siehe unten). Betrachten Sie das als ein **Hot Reload**: Die aktualisierte Liste wird beim nächsten Agent-Turn übernommen.

Wenn sich die effektive Skill-Allowlist des Agenten für diese Sitzung ändert, aktualisiert OpenClaw
den Snapshot, damit die sichtbaren Skills mit dem aktuellen
Agenten abgeglichen bleiben.

## Remote-macOS-Nodes (Linux-Gateway)

Wenn das Gateway auf Linux läuft, aber ein **macOS-Node** verbunden ist **mit erlaubtem `system.run`** (Sicherheit für Exec-Genehmigungen nicht auf `deny` gesetzt), kann OpenClaw Skills, die nur für macOS gelten, als zulässig behandeln, wenn die erforderlichen Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und ein Bin-Probe über `system.run` erfolgt. Wenn der macOS-Node später offline geht, bleiben die Skills sichtbar; Aufrufe können fehlschlagen, bis sich der Node wieder verbindet.

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

## Token-Auswirkungen (Skills-Liste)

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer Skills in den System-Prompt (über `formatSkillsForPrompt` in `pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead (nur wenn ≥1 Skill):** 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte von `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Hinweise:

- XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.), was die Länge erhöht.
- Token-Zahlen variieren je nach Modell-Tokenizer. Eine grobe OpenAI-artige Schätzung ist ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Tokens** pro Skill plus die tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert eine Basismenge an Skills als **gebündelte Skills** als Teil der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` dient lokalen
Overrides (zum Beispiel einen Skill pinnen/patchen, ohne die gebündelte
Kopie zu ändern). Workspace-Skills gehören dem Benutzer und überschreiben beide bei Namenskonflikten.

## Konfigurationsreferenz

Siehe [Skills-Konfiguration](/de/tools/skills-config) für das vollständige Konfigurationsschema.

## Suchen Sie nach weiteren Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai).

---

## Verwandt

- [Skills erstellen](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Skills-Konfiguration](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash Commands](/de/tools/slash-commands) — alle verfügbaren Slash Commands
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
