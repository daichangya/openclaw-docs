---
read_when:
    - Sie möchten ein Codex-, Claude- oder Cursor-kompatibles Bundle installieren.
    - Sie müssen verstehen, wie OpenClaw Bundle-Inhalte auf native Funktionen abbildet.
    - Sie debuggen Bundle-Erkennung oder fehlende Fähigkeiten.
summary: Codex-, Claude- und Cursor-Bundles als OpenClaw-Plugin installieren und verwenden
title: Plugin-Bundles
x-i18n:
    generated_at: "2026-04-23T14:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin-Bundles

OpenClaw kann Plugin aus drei externen Ökosystemen installieren: **Codex**, **Claude**
und **Cursor**. Diese werden **Bundles** genannt — Inhalts- und Metadatenpakete, die
OpenClaw auf native Funktionen wie Skills, Hooks und MCP-Tools abbildet.

<Info>
  Bundles sind **nicht** dasselbe wie native OpenClaw-Plugin. Native Plugin laufen
  im Prozess und können jede Fähigkeit registrieren. Bundles sind Inhaltspakete mit
  selektiver Funktionsabbildung und einer engeren Vertrauensgrenze.
</Info>

## Warum es Bundles gibt

Viele nützliche Plugin werden im Codex-, Claude- oder Cursor-Format veröffentlicht. Statt
von Autoren zu verlangen, sie als native OpenClaw-Plugin neu zu schreiben, erkennt OpenClaw
diese Formate und bildet ihre unterstützten Inhalte auf die nativen Funktionen ab. Das bedeutet,
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

  <Step title="Erkennung prüfen">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles werden als `Format: bundle` mit einem Subtyp `codex`, `claude` oder `cursor` angezeigt.

  </Step>

  <Step title="Neu starten und verwenden">
    ```bash
    openclaw gateway restart
    ```

    Abgebildete Funktionen (Skills, Hooks, MCP-Tools, eingebettete Pi-LSP-Standards) sind in der nächsten Sitzung verfügbar.

  </Step>
</Steps>

## Was OpenClaw aus Bundles abbildet

Nicht jede Bundle-Funktion läuft heute in OpenClaw. Hier sehen Sie, was funktioniert und was
zwar erkannt, aber noch nicht verdrahtet ist.

### Derzeit unterstützt

| Funktion      | Wie sie abgebildet wird                                                                       | Gilt für      |
| ------------- | --------------------------------------------------------------------------------------------- | ------------- |
| Skill-Inhalt  | Bundle-Skill-Wurzeln werden als normale OpenClaw-Skills geladen                               | Alle Formate  |
| Befehle       | `commands/` und `.cursor/commands/` werden als Skill-Wurzeln behandelt                        | Claude, Cursor |
| Hook-Pakete   | OpenClaw-artige Layouts mit `HOOK.md` + `handler.ts`                                          | Codex         |
| MCP-Tools     | Bundle-MCP-Konfiguration wird in eingebettete Pi-Einstellungen zusammengeführt; unterstützte stdio- und HTTP-Server werden geladen | Alle Formate  |
| LSP-Server    | Claude-`.lsp.json` und im Manifest deklarierte `lspServers` werden in eingebettete Pi-LSP-Standards zusammengeführt | Claude        |
| Einstellungen | Claude-`settings.json` wird als eingebettete Pi-Standards importiert                          | Claude        |

#### Skill-Inhalt

- Bundle-Skill-Wurzeln werden als normale OpenClaw-Skill-Wurzeln geladen
- Claude-`commands`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt
- Cursor-`.cursor/commands`-Wurzeln werden als zusätzliche Skill-Wurzeln behandelt

Das bedeutet, dass Claude-Markdown-Befehlsdateien über den normalen OpenClaw-Skill-
Loader funktionieren. Cursor-Befehls-Markdown funktioniert über denselben Pfad.

#### Hook-Pakete

- Bundle-Hook-Wurzeln funktionieren **nur**, wenn sie das normale OpenClaw-Layout
  für Hook-Pakete verwenden. Heute ist dies vor allem der mit Codex kompatible Fall:
  - `HOOK.md`
  - `handler.ts` oder `handler.js`

#### MCP für Pi

- Aktivierte Bundles können MCP-Serverkonfiguration beitragen
- OpenClaw führt Bundle-MCP-Konfiguration in die effektiven eingebetteten Pi-Einstellungen als
  `mcpServers` zusammen
- OpenClaw stellt unterstützte Bundle-MCP-Tools während eingebetteter Pi-Agent-Turns bereit, indem
  stdio-Server gestartet oder Verbindungen zu HTTP-Servern hergestellt werden
- Die Tool-Profile `coding` und `messaging` enthalten Bundle-MCP-Tools standardmäßig; verwenden Sie `tools.deny: ["bundle-mcp"]`, um sie für einen Agenten oder das Gateway zu deaktivieren
- Projektlokale Pi-Einstellungen werden weiterhin nach den Bundle-Standards angewendet, sodass Workspace-
  Einstellungen bei Bedarf Bundle-MCP-Einträge überschreiben können
- Bundle-MCP-Toolkataloge werden vor der Registrierung deterministisch sortiert, damit Änderungen an der Upstream-Reihenfolge von `listTools()` Prompt-Cache-Tool-Blöcke nicht durcheinanderbringen

##### Transporte

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

**HTTP** verbindet sich standardmäßig über `sse` mit einem laufenden MCP-Server oder bei Anforderung über `streamable-http`:

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

- `transport` kann auf `"streamable-http"` oder `"sse"` gesetzt werden; wenn ausgelassen, verwendet OpenClaw `sse`
- nur URL-Schemata `http:` und `https:` sind zulässig
- `headers`-Werte unterstützen `${ENV_VAR}`-Interpolation
- ein Servereintrag mit sowohl `command` als auch `url` wird abgelehnt
- URL-Zugangsdaten (userinfo und Query-Parameter) werden aus Tool-
  Beschreibungen und Logs redigiert
- `connectionTimeoutMs` überschreibt das Standard-Connection-Timeout von 30 Sekunden für
  sowohl stdio- als auch HTTP-Transporte

##### Tool-Benennung

OpenClaw registriert Bundle-MCP-Tools mit provider-sicheren Namen im Format
`serverName__toolName`. Zum Beispiel wird ein Server mit dem Schlüssel `"vigil-harbor"`, der ein
Tool `memory_search` bereitstellt, als `vigil-harbor__memory_search` registriert.

- Zeichen außerhalb von `A-Za-z0-9_-` werden durch `-` ersetzt
- Serverpräfixe sind auf 30 Zeichen begrenzt
- vollständige Tool-Namen sind auf 64 Zeichen begrenzt
- leere Servernamen fallen auf `mcp` zurück
- kollidierende bereinigte Namen werden mit numerischen Suffixen unterschieden
- die endgültige sichtbare Tool-Reihenfolge ist deterministisch nach sicherem Namen, damit wiederholte Pi-
  Turns cache-stabil bleiben
- Profilfilterung behandelt alle Tools von einem Bundle-MCP-Server als Plugin im Besitz von
  `bundle-mcp`, sodass Positivlisten und Sperrlisten für Profile entweder
  einzelne sichtbare Tool-Namen oder den Plugin-Schlüssel `bundle-mcp` enthalten können

#### Eingebettete Pi-Einstellungen

- Claude-`settings.json` wird als Standard für eingebettete Pi-Einstellungen importiert, wenn das
  Bundle aktiviert ist
- OpenClaw bereinigt Shell-Override-Schlüssel vor ihrer Anwendung

Bereinigte Schlüssel:

- `shellPath`
- `shellCommandPrefix`

#### Eingebettetes Pi-LSP

- aktivierte Claude-Bundles können LSP-Serverkonfiguration beitragen
- OpenClaw lädt `.lsp.json` sowie alle im Manifest deklarierten `lspServers`-Pfade
- Bundle-LSP-Konfiguration wird in die effektiven eingebetteten Pi-LSP-Standards zusammengeführt
- nur unterstützte stdio-basierte LSP-Server sind heute ausführbar; nicht unterstützte
  Transporte werden weiterhin in `openclaw plugins inspect <id>` angezeigt

### Erkannt, aber nicht ausgeführt

Diese werden erkannt und in der Diagnose angezeigt, aber OpenClaw führt sie nicht aus:

- Claude-`agents`, `hooks.json`-Automatisierung, `outputStyles`
- Cursor-`.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-Inline-/App-Metadaten über die reine Fähigkeitsberichterstattung hinaus

## Bundle-Formate

<AccordionGroup>
  <Accordion title="Codex-Bundles">
    Marker: `.codex-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-Bundles passen am besten zu OpenClaw, wenn sie Skill-Wurzeln und OpenClaw-artige
    Hook-Paket-Verzeichnisse verwenden (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-Bundles">
    Zwei Erkennungsmodi:

    - **Manifest-basiert:** `.claude-plugin/plugin.json`
    - **Ohne Manifest:** Standard-Claude-Layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-spezifisches Verhalten:

    - `commands/` wird als Skill-Inhalt behandelt
    - `settings.json` wird in eingebettete Pi-Einstellungen importiert (Shell-Override-Schlüssel werden bereinigt)
    - `.mcp.json` stellt unterstützte stdio-Tools für eingebettete Pi bereit
    - `.lsp.json` plus im Manifest deklarierte `lspServers`-Pfade werden in eingebettete Pi-LSP-Standards geladen
    - `hooks/hooks.json` wird erkannt, aber nicht ausgeführt
    - Benutzerdefinierte Komponentenpfade im Manifest sind additiv (sie erweitern die Standards, statt sie zu ersetzen)

  </Accordion>

  <Accordion title="Cursor-Bundles">
    Marker: `.cursor-plugin/plugin.json`

    Optionale Inhalte: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wird als Skill-Inhalt behandelt
    - `.cursor/rules/`, `.cursor/agents/` und `.cursor/hooks.json` sind nur Erkennung

  </Accordion>
</AccordionGroup>

## Erkennungsreihenfolge

OpenClaw prüft zuerst auf das native Plugin-Format:

1. `openclaw.plugin.json` oder gültige `package.json` mit `openclaw.extensions` — wird als **natives Plugin** behandelt
2. Bundle-Marker (`.codex-plugin/`, `.claude-plugin/` oder Standard-Layout von Claude/Cursor) — wird als **Bundle** behandelt

Wenn ein Verzeichnis beides enthält, verwendet OpenClaw den nativen Pfad. Das verhindert,
dass Dual-Format-Packages teilweise als Bundles installiert werden.

## Laufzeitabhängigkeiten und Bereinigung

- Laufzeitabhängigkeiten gebündelter Plugin werden innerhalb des OpenClaw-Packages unter
  `dist/*` ausgeliefert. OpenClaw führt beim Start **nicht** `npm install` für gebündelte
  Plugin aus; die Release-Pipeline ist dafür verantwortlich, eine vollständige Payload gebündelter
  Abhängigkeiten auszuliefern (siehe die Verifizierungsregel nach dem Veröffentlichen in
  [Releasing](/de/reference/RELEASING)).

## Sicherheit

Bundles haben eine engere Vertrauensgrenze als native Plugin:

- OpenClaw lädt keine beliebigen Bundle-Laufzeitmodule im Prozess
- Skills- und Hook-Paket-Pfade müssen innerhalb der Plugin-Wurzel bleiben (mit Boundary-Prüfung)
- Einstellungsdateien werden mit denselben Boundary-Prüfungen gelesen
- Unterstützte stdio-MCP-Server können als Subprozesse gestartet werden

Dadurch sind Bundles standardmäßig sicherer, aber Sie sollten Drittanbieter-
Bundles für die Funktionen, die sie tatsächlich verfügbar machen, weiterhin als vertrauenswürdige Inhalte behandeln.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bundle wird erkannt, aber Fähigkeiten laufen nicht">
    Führen Sie `openclaw plugins inspect <id>` aus. Wenn eine Fähigkeit aufgeführt, aber als
    nicht verdrahtet markiert ist, ist das eine Produktgrenze — keine defekte Installation.
  </Accordion>

  <Accordion title="Claude-Befehlsdateien erscheinen nicht">
    Stellen Sie sicher, dass das Bundle aktiviert ist und sich die Markdown-Dateien innerhalb einer erkannten
    `commands/`- oder `skills/`-Wurzel befinden.
  </Accordion>

  <Accordion title="Claude-Einstellungen werden nicht angewendet">
    Nur eingebettete Pi-Einstellungen aus `settings.json` werden unterstützt. OpenClaw behandelt
    Bundle-Einstellungen nicht als rohe Konfigurations-Patches.
  </Accordion>

  <Accordion title="Claude-Hooks werden nicht ausgeführt">
    `hooks/hooks.json` ist nur Erkennung. Wenn Sie ausführbare Hooks benötigen, verwenden Sie das
    OpenClaw-Layout für Hook-Pakete oder liefern Sie ein natives Plugin aus.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Install and Configure Plugins](/de/tools/plugin)
- [Building Plugins](/de/plugins/building-plugins) — ein natives Plugin erstellen
- [Plugin Manifest](/de/plugins/manifest) — natives Manifest-Schema
