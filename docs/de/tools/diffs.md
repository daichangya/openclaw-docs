---
read_when:
    - Sie möchten, dass Agenten Code- oder Markdown-Änderungen als Diffs anzeigen
    - Sie möchten eine Canvas-fähige Viewer-URL oder eine gerenderte Diff-Datei 菲龙ിഐassistant to=functions.read commentary  无码av_json  天天中彩票双色球{"path":"docs/plugins/diffs.md","offset":1,"limit":260}
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardwerten
summary: Schreibgeschützter Diff-Viewer und Datei-Renderer für Agenten (optionales Plugin-Tool)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T07:02:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einem begleitenden Skill, der Änderungsinhalte für Agenten in ein schreibgeschütztes Diff-Artefakt umwandelt.

Es akzeptiert entweder:

- `before`- und `after`-Text
- einen einheitlichen `patch`

Es kann zurückgeben:

- eine Gateway-Viewer-URL für die Darstellung in Canvas
- einen gerenderten Dateipfad (PNG oder PDF) für die Zustellung per Nachricht
- beide Ausgaben in einem Aufruf

Wenn aktiviert, stellt das Plugin knappe Nutzungshinweise dem System-Prompt-Bereich voran und bietet zusätzlich einen detaillierten Skill für Fälle, in denen der Agent ausführlichere Anweisungen benötigt.

## Schnellstart

1. Das Plugin aktivieren.
2. `diffs` mit `mode: "view"` für Canvas-First-Flows aufrufen.
3. `diffs` mit `mode: "file"` für Flows mit Dateizustellung im Chat aufrufen.
4. `diffs` mit `mode: "both"` aufrufen, wenn Sie beide Artefakte benötigen.

## Das Plugin aktivieren

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Integrierte Systemanleitung deaktivieren

Wenn Sie das Tool `diffs` aktiviert lassen, aber seine integrierte System-Prompt-Anleitung deaktivieren möchten, setzen Sie `plugins.entries.diffs.hooks.allowPromptInjection` auf `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Dadurch wird der Hook `before_prompt_build` des Diffs-Plugins blockiert, während Plugin, Tool und begleitender Skill weiterhin verfügbar bleiben.

Wenn Sie sowohl die Anleitung als auch das Tool deaktivieren möchten, deaktivieren Sie stattdessen das Plugin.

## Typischer Workflow für Agenten

1. Agent ruft `diffs` auf.
2. Agent liest die Felder in `details`.
3. Agent führt dann entweder Folgendes aus:
   - öffnet `details.viewerUrl` mit `canvas present`
   - sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`
   - oder beides

## Eingabebeispiele

Before und after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referenz für Tool-Eingaben

Alle Felder sind optional, sofern nicht anders angegeben:

- `before` (`string`): Originaltext. Erforderlich zusammen mit `after`, wenn `patch` weggelassen wird.
- `after` (`string`): aktualisierter Text. Erforderlich zusammen mit `before`, wenn `patch` weggelassen wird.
- `patch` (`string`): einheitlicher Diff-Text. Gegenseitig ausschließend mit `before` und `after`.
- `path` (`string`): angezeigter Dateiname für den Before-/After-Modus.
- `lang` (`string`): Hint zum Überschreiben der Sprache für den Before-/After-Modus. Unbekannte Werte fallen auf Klartext zurück.
- `title` (`string`): Überschreibung des Viewer-Titels.
- `mode` (`"view" | "file" | "both"`): Ausgabemodus. Standard ist der Plugin-Standard `defaults.mode`.
  Veralteter Alias: `"image"` verhält sich wie `"file"` und wird aus Gründen der Rückwärtskompatibilität weiterhin akzeptiert.
- `theme` (`"light" | "dark"`): Viewer-Theme. Standard ist der Plugin-Standard `defaults.theme`.
- `layout` (`"unified" | "split"`): Diff-Layout. Standard ist der Plugin-Standard `defaults.layout`.
- `expandUnchanged` (`boolean`): unveränderte Abschnitte erweitern, wenn vollständiger Kontext verfügbar ist. Nur Option pro Aufruf (kein Plugin-Standard-Schlüssel).
- `fileFormat` (`"png" | "pdf"`): gerendertes Dateiformat. Standard ist der Plugin-Standard `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): Qualitäts-Preset für PNG- oder PDF-Rendering.
- `fileScale` (`number`): Override für den Device-Scale (`1`-`4`).
- `fileMaxWidth` (`number`): maximale Renderbreite in CSS-Pixeln (`640`-`2400`).
- `ttlSeconds` (`number`): TTL des Artefakts in Sekunden für Viewer- und eigenständige Dateiausgaben. Standard 1800, max. 21600.
- `baseUrl` (`string`): Override für die Ursprung-URL des Viewers. Überschreibt das Plugin-`viewerBaseUrl`. Muss `http` oder `https` sein, ohne Query/Hash.

Legacy-Eingabe-Aliasse werden zur Rückwärtskompatibilität weiterhin akzeptiert:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validierung und Limits:

- `before` und `after` jeweils max. 512 KiB.
- `patch` max. 2 MiB.
- `path` max. 2048 Bytes.
- `lang` max. 128 Bytes.
- `title` max. 1024 Bytes.
- Limit für Patch-Komplexität: max. 128 Dateien und 120000 Zeilen insgesamt.
- `patch` zusammen mit `before` oder `after` wird abgelehnt.
- Sicherheitslimits für gerenderte Dateien (gelten für PNG und PDF):
  - `fileQuality: "standard"`: max. 8 MP (8.000.000 gerenderte Pixel).
  - `fileQuality: "hq"`: max. 14 MP (14.000.000 gerenderte Pixel).
  - `fileQuality: "print"`: max. 24 MP (24.000.000 gerenderte Pixel).
  - PDF hat außerdem ein Maximum von 50 Seiten.

## Vertrag für Ausgabedetails

Das Tool gibt strukturierte Metadaten unter `details` zurück.

Gemeinsame Felder für Modi, die einen Viewer erzeugen:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, wenn verfügbar)

Dateifelder, wenn PNG oder PDF gerendert wird:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (derselbe Wert wie `filePath`, für Kompatibilität mit dem Message-Tool)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Kompatibilitäts-Aliasse werden für bestehende Aufrufer ebenfalls zurückgegeben:

- `format` (derselbe Wert wie `fileFormat`)
- `imagePath` (derselbe Wert wie `filePath`)
- `imageBytes` (derselbe Wert wie `fileBytes`)
- `imageQuality` (derselbe Wert wie `fileQuality`)
- `imageScale` (derselbe Wert wie `fileScale`)
- `imageMaxWidth` (derselbe Wert wie `fileMaxWidth`)

Zusammenfassung des Verhaltens der Modi:

- `mode: "view"`: nur Viewer-Felder.
- `mode: "file"`: nur Dateifelder, kein Viewer-Artefakt.
- `mode: "both"`: Viewer-Felder plus Dateifelder. Wenn das Rendern der Datei fehlschlägt, wird der Viewer dennoch mit `fileError` und dem Kompatibilitäts-Alias `imageError` zurückgegeben.

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Expand-Steuerelemente in diesen Zeilen sind bedingt und nicht für jede Art von Eingabe garantiert.
- Expand-Steuerelemente erscheinen, wenn der gerenderte Diff erweiterbare Kontextdaten enthält, was typischerweise bei Before-/After-Eingaben der Fall ist.
- Bei vielen einheitlichen Patch-Eingaben sind ausgelassene Kontext-Bodies in den geparsten Patch-Hunks nicht verfügbar, daher kann die Zeile ohne Expand-Steuerelemente erscheinen. Das ist erwartetes Verhalten.
- `expandUnchanged` gilt nur dann, wenn erweiterbarer Kontext existiert.

## Plugin-Standards

Setzen Sie pluginweite Standardwerte in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Unterstützte Standardwerte:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Explizite Tool-Parameter überschreiben diese Standardwerte.

Persistente Konfiguration der Viewer-URL:

- `viewerBaseUrl` (`string`, optional)
  - Plugin-eigener Fallback für zurückgegebene Viewer-Links, wenn ein Tool-Aufruf kein `baseUrl` übergibt.
  - Muss `http` oder `https` sein, ohne Query/Hash.

Beispiel:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Sicherheitskonfiguration

- `security.allowRemoteViewer` (`boolean`, Standard `false`)
  - `false`: Nicht-Loopback-Anfragen an Viewer-Routen werden abgelehnt.
  - `true`: Remote-Viewer sind erlaubt, wenn der tokenisierte Pfad gültig ist.

Beispiel:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Lebenszyklus und Speicherung von Artefakten

- Artefakte werden im temporären Unterordner gespeichert: `$TMPDIR/openclaw-diffs`.
- Metadaten von Viewer-Artefakten enthalten:
  - zufällige Artefakt-ID (20 Hex-Zeichen)
  - zufälliges Token (48 Hex-Zeichen)
  - `createdAt` und `expiresAt`
  - gespeicherten Pfad `viewer.html`
- Die Standard-TTL für Artefakte beträgt 30 Minuten, wenn nichts angegeben wird.
- Die maximal akzeptierte TTL für Viewer beträgt 6 Stunden.
- Die Bereinigung läuft opportunistisch nach der Erstellung von Artefakten.
- Abgelaufene Artefakte werden gelöscht.
- Eine Fallback-Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Verhalten von Viewer-URL und Netzwerk

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales Pfadpräfix in `baseUrl` auch für Asset-Anfragen beibehalten wird.

Verhalten beim Erstellen von URLs:

- Wenn im Tool-Aufruf `baseUrl` angegeben ist, wird dies nach strikter Validierung verwendet.
- Andernfalls wird, wenn im Plugin `viewerBaseUrl` konfiguriert ist, dieses verwendet.
- Ohne eines dieser Overrides wird die Viewer-URL standardmäßig auf Loopback `127.0.0.1` gesetzt.
- Wenn der Gateway-Bind-Modus `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

Regeln für `baseUrl`:

- Muss `http://` oder `https://` sein.
- Query und Hash werden abgelehnt.
- Origin plus optionaler Basispfad sind erlaubt.

## Sicherheitsmodell

Härtung des Viewers:

- Standardmäßig nur Loopback.
- Tokenisierte Viewer-Pfade mit strikter Validierung von ID und Token.
- CSP der Viewer-Antwort:
  - `default-src 'none'`
  - Skripte und Assets nur von self
  - kein ausgehendes `connect-src`
- Drosselung bei Remote-Misses, wenn Remote-Zugriff aktiviert ist:
  - 40 Fehlschläge pro 60 Sekunden
  - 60 Sekunden Lockout (`429 Too Many Requests`)

Härtung beim Rendern von Dateien:

- Request-Routing für Screenshot-Browser ist standardmäßig verweigert.
- Nur lokale Viewer-Assets von `http://127.0.0.1/plugins/diffs/assets/*` sind erlaubt.
- Externe Netzwerkanfragen werden blockiert.

## Browser-Anforderungen für den Dateimodus

`mode: "file"` und `mode: "both"` benötigen einen Chromium-kompatiblen Browser.

Reihenfolge der Auflösung:

1. `browser.executablePath` in der OpenClaw-Konfiguration.
2. Umgebungsvariablen:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback über plattformspezifische Befehls-/Pfaderkennung.

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder einen der obigen Pfadoptionen für ausführbare Dateien setzen.

## Fehlerbehebung

Validierungsfehler bei Eingaben:

- `Provide patch or both before and after text.`
  - Geben Sie sowohl `before` als auch `after` an oder stellen Sie `patch` bereit.
- `Provide either patch or before/after input, not both.`
  - Mischen Sie keine Eingabemodi.
- `Invalid baseUrl: ...`
  - Verwenden Sie einen `http(s)`-Origin mit optionalem Pfad, ohne Query/Hash.
- `{field} exceeds maximum size (...)`
  - Reduzieren Sie die Payload-Größe.
- Ablehnung wegen großem Patch
  - Reduzieren Sie die Anzahl der Dateien im Patch oder die Gesamtzahl der Zeilen.

Probleme mit der Erreichbarkeit des Viewers:

- Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
- Für Remote-Zugriffsszenarien entweder:
  - Plugin-`viewerBaseUrl` setzen, oder
  - `baseUrl` pro Tool-Aufruf übergeben, oder
  - `gateway.bind=custom` und `gateway.customBindHost` verwenden
- Wenn `gateway.trustedProxies` Loopback für einen Proxy auf demselben Host enthält (zum Beispiel Tailscale Serve), schlagen rohe Loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header absichtlich fail-closed fehl.
- Für diese Proxy-Topologie:
  - bevorzugen Sie `mode: "file"` oder `mode: "both"`, wenn Sie nur einen Anhang benötigen, oder
  - aktivieren Sie bewusst `security.allowRemoteViewer` und setzen Sie Plugin-`viewerBaseUrl` oder übergeben Sie ein Proxy-/öffentliches `baseUrl`, wenn Sie eine teilbare Viewer-URL benötigen
- Aktivieren Sie `security.allowRemoteViewer` nur, wenn Sie tatsächlich externen Viewer-Zugriff beabsichtigen.

Zeile mit unveränderten Zeilen hat keinen Expand-Button:

- Dies kann bei Patch-Eingaben vorkommen, wenn der Patch keinen erweiterbaren Kontext enthält.
- Das ist erwartetes Verhalten und weist nicht auf einen Viewer-Fehler hin.

Artefakt nicht gefunden:

- Artefakt ist aufgrund der TTL abgelaufen.
- Token oder Pfad wurden geändert.
- Die Bereinigung hat veraltete Daten entfernt.

## Betriebliche Hinweise

- Bevorzugen Sie `mode: "view"` für lokale interaktive Reviews in Canvas.
- Bevorzugen Sie `mode: "file"` für ausgehende Chat-Kanäle, die einen Anhang benötigen.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihr Deployment keine Remote-Viewer-URLs erfordert.
- Setzen Sie für sensible Diffs explizit kurze `ttlSeconds`.
- Vermeiden Sie es, Secrets in die Diff-Eingabe aufzunehmen, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder aggressiv komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzugen Sie PDF-Ausgabe (`fileFormat: "pdf"`).

Diff-Rendering-Engine:

- Bereitgestellt von [Diffs](https://diffs.com).

## Verwandte Dokumentation

- [Tool-Überblick](/de/tools)
- [Plugins](/de/tools/plugin)
- [Browser](/de/tools/browser)
