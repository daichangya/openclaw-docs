---
read_when:
    - Skills-Konfiguration hinzufügen oder ändern
    - Gebündelte Allowlist oder Installationsverhalten anpassen
summary: Skills-Konfigurationsschema und Beispiele
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-04-21T06:32:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills-Konfiguration

Der Großteil der Konfiguration für das Laden/Installieren von Skills liegt unter `skills` in `~/.openclaw/openclaw.json`. Die agentspezifische Sichtbarkeit von Skills liegt unter `agents.defaults.skills` und `agents.list[].skills`.

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway-Laufzeit bleibt Node; bun nicht empfohlen)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-String
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

Für eingebaute Bildgenerierung/-bearbeitung bevorzugen Sie `agents.defaults.imageGenerationModel` plus das Core-Tool `image_generate`. `skills.entries.*` ist nur für benutzerdefinierte oder Drittanbieter-Skill-Workflows gedacht.

Wenn Sie einen bestimmten Bildanbieter/ein bestimmtes Bildmodell auswählen, konfigurieren Sie außerdem Auth/API-Schlüssel dieses Anbieters. Typische Beispiele: `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Einrichtung im Nano-Banana-Stil: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent-Skill-Allowlists

Verwenden Sie die Agent-Konfiguration, wenn Sie dieselben Skill-Roots für Maschine/Workspace möchten, aber einen anderen sichtbaren Skill-Satz pro Agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erbt Defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Defaults
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills`: gemeinsame Basis-Allowlist für Agenten, die `agents.list[].skills` weglassen.
- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig nicht einzuschränken.
- `agents.list[].skills`: expliziter finaler Skill-Satz für diesen Agenten; er wird nicht mit Defaults zusammengeführt.
- `agents.list[].skills: []`: macht für diesen Agenten keine Skills sichtbar.

## Felder

- Eingebaute Skill-Roots enthalten immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, kommen nur gebündelte Skills in der Liste infrage (verwaltete, Agent- und Workspace-Skills bleiben unbeeinflusst).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse, die gescannt werden (niedrigste Priorität).
- `load.watch`: Skill-Ordner beobachten und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Debounce für Skill-Watcher-Ereignisse in Millisekunden (Standard: 250).
- `install.preferBrew`: Brew-Installer bevorzugen, wenn verfügbar (Standard: true).
- `install.nodeManager`: Präferenz für Node-Installer (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Laufzeit sollte weiterhin Node sein
  (`bun` nicht empfohlen für WhatsApp/Telegram).
  - `openclaw setup --node-manager` ist enger gefasst und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie Skill-Installationen auf Basis von Yarn möchten.
- `entries.<skillKey>`: Überschreibungen pro Skill.
- `agents.defaults.skills`: optionale Standard-Allowlist für Skills, die von Agenten geerbt wird, die `agents.list[].skills` weglassen.
- `agents.list[].skills`: optionale finale Skill-Allowlist pro Agent; explizite Listen ersetzen geerbte Defaults, statt mit ihnen zusammengeführt zu werden.

Felder pro Skill:

- `enabled`: auf `false` setzen, um einen Skill zu deaktivieren, auch wenn er gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agentenlauf injiziert werden (nur wenn sie nicht bereits gesetzt sind).
- `apiKey`: optionale Komfortfunktion für Skills, die eine primäre Env-Var deklarieren.
  Unterstützt Klartext-String oder ein SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig dem Skill-Namen zugeordnet. Wenn ein Skill `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Die Ladepriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agenten-Turn übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills + Env-Variablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb des konfigurierten Sandbox-Backends. Die Sandbox erbt **nicht** das hostseitige `process.env`.

Verwenden Sie eines von:

- `agents.defaults.sandbox.docker.env` für das Docker-Backend (oder pro Agent `agents.list[].sandbox.docker.env`)
- baken Sie die Env in Ihr benutzerdefiniertes Sandbox-Image oder die entfernte Sandbox-Umgebung ein

Globales `env` und `skills.entries.<skill>.env/apiKey` gelten nur für **hostseitige** Läufe.
