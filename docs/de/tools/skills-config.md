---
read_when:
    - Beim Hinzufügen oder Ändern der Skills-Konfiguration
    - Beim Anpassen der gebündelten Allowlist oder des Installationsverhaltens
summary: Konfigurationsschema und Beispiele für Skills
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-04-05T12:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills-Konfiguration

Der Großteil der Konfiguration für das Laden/Installieren von Skills befindet sich unter `skills` in
`~/.openclaw/openclaw.json`. Die agentenspezifische Sichtbarkeit von Skills befindet sich unter
`agents.defaults.skills` und `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Für integrierte Bildgenerierung/-bearbeitung verwenden Sie bevorzugt
`agents.defaults.imageGenerationModel` plus das Core-Tool `image_generate`.
`skills.entries.*` ist nur für benutzerdefinierte oder
Drittanbieter-Workflows mit Skills gedacht.

Wenn Sie einen bestimmten Bild-Provider/ein bestimmtes Bildmodell auswählen, konfigurieren Sie auch die
Authentifizierung/den API-Schlüssel dieses Providers. Typische Beispiele: `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für
`google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Nano-Banana-ähnliche Einrichtung: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Skill-Allowlists für Agents

Verwenden Sie die Agent-Konfiguration, wenn Sie dieselben Skill-Wurzelverzeichnisse auf Rechner-/Workspace-Ebene möchten, aber
pro Agent eine andere sichtbare Skill-Menge.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills`: gemeinsame Basis-Allowlist für Agents, die
  `agents.list[].skills` weglassen.
- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig nicht einzuschränken.
- `agents.list[].skills`: explizite endgültige Skill-Menge für diesen Agent; sie wird nicht
  mit den Standardwerten zusammengeführt.
- `agents.list[].skills: []`: stellt für diesen Agent keine Skills bereit.

## Felder

- Integrierte Skill-Wurzelverzeichnisse enthalten immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete Skills, Agent-Skills und Workspace-Skills sind nicht betroffen).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse, die gescannt werden (niedrigste Priorität).
- `load.watch`: Skill-Ordner überwachen und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Entprellung für Skill-Watcher-Ereignisse in Millisekunden (Standard: 250).
- `install.preferBrew`: nach Möglichkeit Brew-Installer bevorzugen (Standard: true).
- `install.nodeManager`: bevorzugter Node-Installer (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Runtime sollte weiterhin Node sein
  (`bun` wird für WhatsApp/Telegram nicht empfohlen).
  - `openclaw setup --node-manager` ist enger gefasst und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie
    Skill-Installationen mit Yarn möchten.
- `entries.<skillKey>`: Überschreibungen pro Skill.
- `agents.defaults.skills`: optionale Standard-Allowlist für Skills, die von Agents geerbt wird,
  die `agents.list[].skills` weglassen.
- `agents.list[].skills`: optionale endgültige Allowlist für Skills pro Agent; explizite
  Listen ersetzen geerbte Standardwerte, statt sie zusammenzuführen.

Felder pro Skill:

- `enabled`: auf `false` setzen, um einen Skill zu deaktivieren, selbst wenn er gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agent-Lauf injiziert werden (nur wenn sie nicht bereits gesetzt sind).
- `apiKey`: optionale Vereinfachung für Skills, die eine primäre Umgebungsvariable deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig dem Skill-Namen zugeordnet. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Die Ladepriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agent-Turn übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills + Umgebungsvariablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb von Docker. Die Sandbox
übernimmt **nicht** das hostseitige `process.env`.

Verwenden Sie eine der folgenden Möglichkeiten:

- `agents.defaults.sandbox.docker.env` (oder pro Agent `agents.list[].sandbox.docker.env`)
- die Umgebungsvariablen in Ihr benutzerdefiniertes Sandbox-Image einbacken

Globales `env` und `skills.entries.<skill>.env/apiKey` gelten nur für **hostseitige** Läufe.
