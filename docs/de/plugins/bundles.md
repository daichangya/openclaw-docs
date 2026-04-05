---
read_when:
    - Sie möchten ein Codex-, Claude- oder Cursor-kompatibles Bundle installieren
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte auf native Features abbildet
    - Sie debuggen die Bundle-Erkennung oder fehlende Fähigkeiten
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugins installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-04-05T12:50:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin-Bundles

OpenClaw kann Plugins aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden **Bundles** genannt — Inhalts- und Metadatenpakete, die
OpenClaw auf native Features wie Skills, Hooks und MCP-Tools abbildet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugins. Native Plugins laufen
  im Prozess und können jede Fähigkeit registrieren. Bundles sind Inhaltspakete mit
  selektiver Feature-Abbildung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugins werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Statt
Autoren dazu zu verpflichten, sie als native OpenClaw-Plugins neu zu schreiben, erkennt OpenClaw
diese Formate und bildet ihre unterstützten Inhalte auf die native Feature-Menge ab. Das bedeutet,
dass Sie ein Claude-Befehlspaket oder ein Codex-Skills-Bundle installieren
und sofort verwenden können.

## Ein Bundle installieren

<Steps>
  <Step title="Aus einem Verzeichnis, Archiv oder Marketplace installieren">
    ```bash
    # Lokales Verzeichnis
    openclaw plugins install ./my-bundle

    # Archiv
    openclaw plugins install ./my-bundle.tgz

    # Claude-Marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Erkennung überprüfen">
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

    Abgebildete Features (Skills, Hooks, MCP-Tools, LSP-Standardeinstellungen) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles abbildet

Nicht jedes Bundle-Feature läuft heute in OpenClaw. Hier sehen Sie, was funktioniert und was
zwar erkannt, aber noch nicht angebunden ist.

### Derzeit unterstützt

| Feature       | Wie es abgebildet wird                                                                      | Gilt für       |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill-Inhalte | Bundle-Skill-Roots werden als normale OpenClaw-Skills-Roots geladen                         | Alle Formate   |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skills-Roots behandelt                       | Claude, Cursor |
| Hook-Pakete   | OpenClaw-Layouts im Stil `HOOK.md` + `handler.ts`                                           | Codex          |
| MCP-Tools     | Bundle-MCP-Konfiguration wird in eingebettete Pi-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate   |
| LSP-Server    | Claude-`.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standardeinstellungen zusammengeführt | Claude         |
| Einstellungen | Claude-`settings.json` wird als eingebettete Pi-Standardeinstellungen importiert            | Claude         |

#### Skill-Inhalte

- Bundle-Skill-Roots werden als normale OpenClaw-Skills-Roots geladen
- Claude-`commands`-Roots werden als zusätzliche Skills-Roots behandelt
- Cursor-`.cursor/commands`-Roots werden als zusätzliche Skills-Roots behandelt

Das bedeutet, dass Claude-Markdown-Befehlsdateien über den normalen OpenClaw-Skills-Loader funktionieren.
Cursor-Befehls-Markdown funktioniert über denselben Pfad.

#### Hook-Pakete

- Bundle-Hook-Roots funktionieren **nur**, wenn sie das normale OpenClaw-Hook-Paket-Layout
  verwenden. Heute ist das primär der Codex-kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- aktivierte Bundles können zur MCP-Server-Konfiguration beitragen
- OpenClaw führt Bundle-MCP-Konfiguration in die effektiven eingebetteten Pi-Einstellungen als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter Pi-Agent-Turns bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- projektlokale Pi-Einstellungen gelten weiterhin nach den Bundle-Standardeinstellungen, sodass Workspace-
  Einstellungen bei Bedarf Bundle-MCP-Einträge überschreiben können
- Bundle-MCP-Tool-Kataloge werden vor der Registrierung deterministisch sortiert, sodass
  vorgelagerte Änderungen an der `listTools()`-Reihenfolge keine Instabilität in Tool-Blöcken des Prompt-Cache verursachen

##### Transports

MCP-Server können stdio- oder HTTP-Transport verwenden:

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

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder auf Wunsch über `streamable-http`:

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

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn es weggelassen wird, verwendet OpenClaw `sse`
- nur URL-Schemata `http:` und `https:` sind erlaubt
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Zugangsdaten (userinfo und Query-Parameter) werden in Tool-
  Beschreibungen und Logs unkenntlich gemacht
- `connectionTimeoutMs` überschreibt das standardmäßige 30-Sekunden-Verbindungs-Timeout für
  sowohl stdio- als auch HTTP-Transports

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit provider-sicheren Namen im Format
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
`memory_search`-Tool bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Server-Präfixe sind auf 30 Zeichen begrenzt
- vollständige Tool-Namen sind auf 64 Zeichen begrenzt
- leere Server-Namen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen unterschieden
- die endgültige offengelegte Tool-Reihenfolge ist nach sicherem Namen deterministisch, damit wiederholte Pi-
  Turns cache-stabil bleiben

#### Eingebettete Pi-Einstellungen

- Claude-`settings.json` wird als eingebettete Pi-Standardeinstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel, bevor es sie anwendet

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- aktivierte Claude-Bundles können zur LSP-Server-Konfiguration beitragen
- OpenClaw lädt `.lsp.json` sowie alle im Manifest deklarierten `lspServers`-Pfade
- Bundle-LSP-Konfiguration wird in die effektiven eingebetteten Pi-LSP-Standardeinstellungen zusammengeführt
- heute sind nur unterstützte stdio-basierte LSP-Server lauffähig; nicht unterstützte
  Transports werden weiterhin in `openclaw plugins inspect <id>` angezeigt

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in der Diagnose angezeigt, aber OpenClaw führt sie nicht aus:

- Claude-`agents`, `hooks.json`-Automatisierung, `outputStyles`
- Cursor-`.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über die Fähigkeitsberichterstattung hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Marker: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skills-Roots und OpenClaw-Hook-Paket-
    Verzeichnisse verwenden (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifest-basiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Standard-Layout von Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete Pi-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettetes Pi bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete Pi-LSP-Standardeinstellungen geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern die Standardeinstellungen, ersetzen sie nicht)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` werden nur erkannt

  </Accordion>
</AccordionGroup>

## Erkennungs-Priorität

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Layout von Claude/Cursor) — wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Dies verhindert,
dass Dual-Format-Pakete teilweise als Bundles installiert werden.

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugins:

- OpenClaw lädt keine beliebigen Bundle-Laufzeitmodule im Prozess
- Skills- und Hook-Paket-Pfade müssen innerhalb der Plugin-Root bleiben (grenzgeprüft)
- Einstellungsdateien werden mit denselben Grenzprüfungen gelesen
- unterstützte stdio-MCP-Server können als Unterprozesse gestartet werden

Das macht Bundles standardmäßig sicherer, aber Sie sollten Drittanbieter-
Bundles für die Features, die sie tatsächlich bereitstellen, dennoch als vertrauenswürdige Inhalte behandeln.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Fähigkeiten laufen nicht">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Fähigkeit aufgeführt, aber als
    nicht angebunden markiert ist, handelt es sich um eine Produktgrenze — nicht um eine defekte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien werden nicht angezeigt">
    Stellen Sie sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien innerhalb einer erkannten
    `commands/`- oder `skills/`-Root befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Es werden nur eingebettete Pi-Einstellungen aus `settings.json` unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` wird nur erkannt. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Hook-Paket-Layout oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugins installieren und konfigurieren](/tools/plugin)
- [Plugins erstellen](/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin-Manifest](/plugins/manifest) — natives Manifest-Schema
