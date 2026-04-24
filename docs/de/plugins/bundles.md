---
read_when:
    - Sie möchten ein Codex-, Claude- oder Cursor-kompatibles Bundle installieren.
    - Sie möchten verstehen, wie OpenClaw Bundle-Inhalte auf native Funktionen abbildet.
    - Sie debuggen Bundle-Erkennung oder fehlende Funktionen.
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-04-24T06:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden **Bundles** genannt — Pakete aus Inhalt und Metadaten, die
OpenClaw auf native Funktionen wie Skills, Hooks und MCP-Tools abbildet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  im Prozess und können beliebige Funktionen registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionszuordnung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Format von Codex, Claude oder Cursor veröffentlicht. Statt
von Autoren zu verlangen, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und bildet ihre unterstützten Inhalte auf den nativen Funktionssatz ab. Das bedeutet,
dass Sie ein Claude-Befehlspaket oder ein Codex-Skill-Bundle installieren können
und es sofort verwenden können.

## Ein Bundle installieren

<Steps>
  <Step title="Aus einem Verzeichnis, Archiv oder Marketplace installieren">
    ```bash
    # Lokales Verzeichnis
    openclaw plugins install ./my-bundle

    # Archiv
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Erkennung prüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles werden als `Format: bundle` mit einem Untertyp `codex`, `claude` oder `cursor` angezeigt.

  </Step>

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Abgebildete Funktionen (Skills, Hooks, MCP-Tools, LSP-Standards) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles abbildet

Nicht jede Bundle-Funktion läuft heute in OpenClaw. Hier sehen Sie, was funktioniert und was
erkannt, aber noch nicht verdrahtet ist.

### Derzeit unterstützt

| Funktion      | Wie sie abgebildet wird                                                                    | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Skill-Inhalt  | Skill-Roots des Bundles werden als normale OpenClaw-Skills geladen                         | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Roots behandelt                       | Claude, Cursor |
| Hook-Packs    | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                       | Codex          |
| MCP-Tools     | MCP-Konfiguration des Bundles wird in eingebettete Pi-Settings zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate |
| LSP-Server    | Claude `.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standards zusammengeführt | Claude |
| Settings      | Claude `settings.json` wird als eingebettete Pi-Standardeinstellungen importiert           | Claude         |

#### Skill-Inhalt

- Skill-Roots von Bundles werden als normale OpenClaw-Skill-Roots geladen
- Claude-Roots `commands` werden als zusätzliche Skill-Roots behandelt
- Cursor-Roots `.cursor/commands` werden als zusätzliche Skill-Roots behandelt

Das bedeutet, dass Markdown-Befehlsdateien von Claude über den normalen OpenClaw-Skill-
Loader funktionieren. Markdown-Befehle von Cursor funktionieren über denselben Pfad.

#### Hook-Packs

- Hook-Roots von Bundles funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Pack-
  Layout verwenden. Heute ist das vor allem der Codex-kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- Aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt die MCP-Konfiguration des Bundles in die effektiven eingebetteten Pi-Settings als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte MCP-Tools aus Bundles während eingebetteter Pi-Agent-Turns bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- Die Tool-Profile `coding` und `messaging` enthalten standardmäßig MCP-Tools aus Bundles; verwenden Sie `tools.deny: ["bundle-mcp"]`, um dies für einen Agenten oder ein Gateway zu deaktivieren
- Projektlokale Pi-Settings gelten weiterhin nach den Standards des Bundles, sodass Workspace-
  Einstellungen MCP-Einträge aus Bundles bei Bedarf überschreiben können
- Tool-Kataloge von Bundle-MCP werden vor der Registrierung deterministisch sortiert, sodass
  Upstream-Änderungen in `listTools()` keine Unruhe in Tool-Blöcken des Prompt-Cache verursachen

##### Transports

MCP-Server können stdio oder HTTP-Transport verwenden:

**Stdio** startet einen Child-Prozess:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder mit `streamable-http`, wenn angefordert:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn weggelassen, verwendet OpenClaw `sse`
- es sind nur URL-Schemata `http:` und `https:` erlaubt
- Werte in `headers` unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Zugangsdaten (userinfo und Query-Parameter) werden aus Tool-
  Beschreibungen und Logs redigiert
- `connectionTimeoutMs` überschreibt den Standard-Connection-Timeout von 30 Sekunden für
  stdio- und HTTP-Transporte

##### Tool-Namensgebung

OpenClaw registriert MCP-Tools aus Bundles mit providersicheren Namen im Format
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
Tool `memory_search` bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Server-Präfixe werden auf 30 Zeichen begrenzt
- Vollständige Tool-Namen werden auf 64 Zeichen begrenzt
- Leere Servernamen fallen auf `mcp` zurück
- Kollidierende bereinigte Namen werden mit numerischen Suffixen eindeutig gemacht
- Die endgültige Reihenfolge der exponierten Tools ist nach sicherem Namen deterministisch, um wiederholte Pi-
  Turns cache-stabil zu halten
- Profil-Filterung behandelt alle Tools eines MCP-Servers aus einem Bundle als plugin-eigen
  von `bundle-mcp`, sodass Allowlist- und Deny-Listen eines Profils entweder
  einzelne exponierte Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete Pi-Settings

- Claude `settings.json` wird als Standard für eingebettete Pi-Settings importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor sie angewendet werden

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- Aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` sowie alle im Manifest deklarierten Pfade `lspServers`
- LSP-Konfiguration des Bundles wird in die effektiven eingebetteten Pi-LSP-Standards zusammengeführt
- nur unterstützte LSP-Server auf stdio-Basis sind heute ausführbar; nicht unterstützte
  Transporte erscheinen dennoch in `openclaw plugins inspect <id>`

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in Diagnosen angezeigt, aber OpenClaw führt sie nicht aus:

- Claude `agents`, Automatisierung über `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Inline-/App-Metadaten von Codex über reines Capability-Reporting hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Marker: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skill-Roots und Hook-Pack-
    Verzeichnisse im OpenClaw-Stil verwenden (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifest-basiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Standard-Layout von Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete Pi-Settings importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes Pi bereit
    - `.lsp.json` sowie im Manifest deklarierte Pfade `lspServers` werden in die eingebetteten Pi-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern die Standards, statt sie zu ersetzen)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` werden nur erkannt

  </Accordion>
</AccordionGroup>

## Erkennungspriorität

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Layout von Claude/Cursor) — wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Das verhindert,
dass Dual-Format-Pakete teilweise als Bundles installiert werden.

## Runtime-Abhängigkeiten und Cleanup

- Runtime-Abhängigkeiten gebündelter Plugins werden innerhalb des OpenClaw-Pakets unter
  `dist/*` ausgeliefert. OpenClaw führt beim Start **kein** `npm install` für gebündelte
  Plugins aus; die Release-Pipeline ist dafür verantwortlich, eine vollständige gebündelte
  Nutzlast an Abhängigkeiten auszuliefern (siehe Regel zur Postpublish-Verifikation unter
  [Releasing](/de/reference/RELEASING)).

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt **keine** beliebigen Runtime-Module aus Bundles im Prozess
- Pfade für Skills und Hook-Packs müssen innerhalb der Plugin-Root bleiben (Grenzprüfung)
- Settings-Dateien werden mit denselben Grenzprüfungen gelesen
- Unterstützte stdio-MCP-Server können als Subprozesse gestartet werden

Dadurch sind Bundles standardmäßig sicherer, aber Sie sollten Bundles von Drittanbietern dennoch
als vertrauenswürdigen Inhalt für die Funktionen behandeln, die sie tatsächlich offenlegen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Funktionen laufen nicht">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Funktion aufgeführt, aber als
    not wired markiert ist, handelt es sich um eine Produktgrenze — nicht um eine defekte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien erscheinen nicht">
    Stellen Sie sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien innerhalb einer erkannten
    Root `commands/` oder `skills/` befinden.
  </Accordion>

  <Accordion title="Claude-Settings werden nicht angewendet">
    Es werden nur eingebettete Pi-Settings aus `settings.json` unterstützt. OpenClaw behandelt
    Bundle-Settings nicht als rohe Config-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` wird nur erkannt. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    Hook-Pack-Layout von OpenClaw oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin)
- [Plugins erstellen](/de/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) — natives Manifest-Schema
