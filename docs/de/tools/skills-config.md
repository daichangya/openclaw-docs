---
read_when:
    - Hinzufügen oder Ändern der Skills-Konfiguration
    - Anpassen von gebündelter Allowlist oder Installationsverhalten
summary: Konfigurationsschema und Beispiele für Skills
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-04-24T07:05:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Die meiste Konfiguration für Laden/Installieren von Skills liegt unter `skills` in
`~/.openclaw/openclaw.json`. Agentenspezifische Sichtbarkeit von Skills liegt unter
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway-Laufzeit bleibt Node; bun wird nicht empfohlen)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-Zeichenfolge
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

Für integrierte Bildgenerierung/-bearbeitung bevorzugen Sie `agents.defaults.imageGenerationModel`
plus das Core-Tool `image_generate`. `skills.entries.*` ist nur für benutzerdefinierte oder
Drittanbieter-Workflows mit Skills gedacht.

Wenn Sie einen bestimmten Bild-Provider/ein bestimmtes Bildmodell auswählen, konfigurieren Sie außerdem
Auth/API key dieses Providers. Typische Beispiele: `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für
`google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Einrichtung im Stil von Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent-Skill-Allowlists

Verwenden Sie die Agenten-Konfiguration, wenn Sie dieselben Skill-Roots für Maschine/Workspace wollen, aber
pro Agent unterschiedliche sichtbare Skill-Sets.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erbt Standardwerte -> github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills`: gemeinsame Basis-Allowlist für Agenten, die
  `agents.list[].skills` weglassen.
- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig unbeschränkt zu lassen.
- `agents.list[].skills`: explizites finales Skill-Set für diesen Agenten; es
  wird nicht mit Standardwerten zusammengeführt.
- `agents.list[].skills: []`: für diesen Agenten keine Skills verfügbar machen.

## Felder

- Integrierte Skill-Roots umfassen immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills aus der Liste zulässig (verwaltete, Agent- und Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse zum Scannen (niedrigste Priorität).
- `load.watch`: Skill-Ordner überwachen und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Debounce für Skill-Watcher-Ereignisse in Millisekunden (Standard: 250).
- `install.preferBrew`: bevorzugt, wenn verfügbar, Installer über brew (Standard: true).
- `install.nodeManager`: Präferenz für Node-Installer (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Laufzeit sollte weiterhin Node
  sein (Bun wird für WhatsApp/Telegram nicht empfohlen).
  - `openclaw setup --node-manager` ist enger und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie
    Yarn-gestützte Skill-Installationen möchten.
- `entries.<skillKey>`: Überschreibungen pro Skill.
- `agents.defaults.skills`: optionale Standard-Skill-Allowlist, die von Agenten geerbt wird,
  die `agents.list[].skills` weglassen.
- `agents.list[].skills`: optionale finale Skill-Allowlist pro Agent; explizite
  Listen ersetzen geerbte Standardwerte, statt sie zusammenzuführen.

Felder pro Skill:

- `enabled`: auf `false` setzen, um einen Skill zu deaktivieren, auch wenn er gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agentenlauf injiziert werden (nur wenn noch nicht gesetzt).
- `apiKey`: optionale Komfortfunktion für Skills, die eine primäre Env-Variable deklarieren.
  Unterstützt Klartext-Zeichenfolge oder SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig dem Skill-Namen zugeordnet. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Die Ladepriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agent-Durchlauf übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills + Env-Variablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb des konfigurierten
Sandbox-Backends. Die Sandbox erbt **nicht** die Host-`process.env`.

Verwenden Sie eines von:

- `agents.defaults.sandbox.docker.env` für das Docker-Backend (oder pro Agent `agents.list[].sandbox.docker.env`)
- die Env in Ihr benutzerdefiniertes Sandbox-Image oder in die Remote-Sandbox-Umgebung einbacken

Globales `env` und `skills.entries.<skill>.env/apiKey` gelten nur für **Host**-Läufe.

## Verwandt

- [Skills](/de/tools/skills)
- [Creating skills](/de/tools/creating-skills)
- [Slash commands](/de/tools/slash-commands)
