---
read_when:
    - Skills-Konfiguration hinzufügen oder ändern
    - Gebündelte Zulassungsliste oder Installationsverhalten anpassen
summary: Konfigurationsschema und Beispiele für Skills
title: Skills-Konfiguration
x-i18n:
    generated_at: "2026-04-23T14:07:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills-Konfiguration

Der Großteil der Konfiguration für das Laden/Installieren von Skills befindet sich unter `skills` in
`~/.openclaw/openclaw.json`. Agentenspezifische Sichtbarkeit von Skills befindet sich unter
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway-Laufzeit bleibt weiterhin Node; bun nicht empfohlen)
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

Für integrierte Bilderzeugung/-bearbeitung verwenden Sie bevorzugt `agents.defaults.imageGenerationModel`
plus das Core-Tool `image_generate`. `skills.entries.*` ist nur für benutzerdefinierte oder
Drittanbieter-Workflows mit Skills gedacht.

Wenn Sie einen bestimmten Bild-Provider/ein bestimmtes Modell auswählen, konfigurieren Sie auch die
Authentifizierung bzw. den API-Schlüssel dieses Providers. Typische Beispiele: `GEMINI_API_KEY` oder
`GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*` und `FAL_KEY` für `fal/*`.

Beispiele:

- Native Einrichtung im Stil von Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal-Einrichtung: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Zulassungslisten für Agenten-Skills

Verwenden Sie die Agentenkonfiguration, wenn Sie dieselben Skill-Roots für Maschine/Workspace verwenden möchten,
aber pro Agent eine andere sichtbare Skill-Menge.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // übernimmt Standards -> github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- `agents.defaults.skills`: gemeinsame Basis-Zulassungsliste für Agenten, die
  `agents.list[].skills` auslassen.
- Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig nicht einzuschränken.
- `agents.list[].skills`: explizite endgültige Skill-Menge für diesen Agenten; sie wird nicht
  mit den Standards zusammengeführt.
- `agents.list[].skills: []`: stellt für diesen Agenten keine Skills bereit.

## Felder

- Integrierte Skill-Roots enthalten immer `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` und `<workspace>/skills`.
- `allowBundled`: optionale Zulassungsliste nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in dieser Liste zulässig (verwaltete, agentenbezogene und Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche Skill-Verzeichnisse zum Scannen (niedrigste Priorität).
- `load.watch`: Skill-Ordner beobachten und den Skills-Snapshot aktualisieren (Standard: true).
- `load.watchDebounceMs`: Debounce für Ereignisse des Skill-Watchers in Millisekunden (Standard: 250).
- `install.preferBrew`: Brew-Installer bevorzugen, wenn verfügbar (Standard: true).
- `install.nodeManager`: bevorzugter Node-Installer (`npm` | `pnpm` | `yarn` | `bun`, Standard: npm).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Laufzeit sollte weiterhin Node sein
  (`bun` wird für WhatsApp/Telegram nicht empfohlen).
  - `openclaw setup --node-manager` ist enger gefasst und akzeptiert derzeit `npm`,
    `pnpm` oder `bun`. Setzen Sie `skills.install.nodeManager: "yarn"` manuell, wenn Sie
    Skill-Installationen auf Basis von Yarn möchten.
- `entries.<skillKey>`: skill-spezifische Overrides.
- `agents.defaults.skills`: optionale Standard-Zulassungsliste für Skills, die von Agenten übernommen wird,
  die `agents.list[].skills` auslassen.
- `agents.list[].skills`: optionale endgültige Skill-Zulassungsliste pro Agent; explizite
  Listen ersetzen übernommene Standards, statt sie zusammenzuführen.

Skill-spezifische Felder:

- `enabled`: auf `false` setzen, um eine Skill zu deaktivieren, auch wenn sie gebündelt/installiert ist.
- `env`: Umgebungsvariablen, die für den Agentenlauf injiziert werden (nur wenn sie nicht bereits gesetzt sind).
- `apiKey`: optionale Komfortfunktion für Skills, die eine primäre Env-Variable deklarieren.
  Unterstützt einen Klartext-String oder ein SecretRef-Objekt (`{ source, provider, id }`).

## Hinweise

- Schlüssel unter `entries` werden standardmäßig der Skill-Namen zugeordnet. Wenn eine Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel.
- Die Ladepriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills →
  `skills.load.extraDirs`.
- Änderungen an Skills werden beim nächsten Agentenzug übernommen, wenn der Watcher aktiviert ist.

### Sandboxed Skills + Env-Variablen

Wenn eine Sitzung **sandboxed** ist, laufen Skill-Prozesse innerhalb des konfigurierten
Sandbox-Backends. Die Sandbox übernimmt **nicht** das Host-`process.env`.

Verwenden Sie eines von Folgendem:

- `agents.defaults.sandbox.docker.env` für das Docker-Backend (oder pro Agent `agents.list[].sandbox.docker.env`)
- backen Sie die Env in Ihr benutzerdefiniertes Sandbox-Image oder die Remote-Sandbox-Umgebung ein

Globales `env` und `skills.entries.<skill>.env/apiKey` gelten nur für **Host**-Läufe.
