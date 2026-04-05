---
read_when:
    - Du möchtest, dass Agenten Code- oder Markdown-Änderungen als Diffs anzeigen
    - Du möchtest eine canvas-fähige Viewer-URL oder eine gerenderte Diff-Datei
    - Du benötigst kontrollierte, temporäre Diff-Artefakte mit sicheren Standardwerten
summary: Schreibgeschützter Diff-Viewer und Dateirenderer für Agenten (optionales Plugin-Tool)
title: Diffs
x-i18n:
    generated_at: "2026-04-05T12:57:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einem begleitenden Skill, der Änderungsinhalte in ein schreibgeschütztes Diff-Artefakt für Agenten umwandelt.

Es akzeptiert entweder:

- `before`- und `after`-Text
- ein vereinheitlichtes `patch`

Es kann zurückgeben:

- eine Gateway-Viewer-URL für die Darstellung in Canvas
- einen gerenderten Dateipfad (PNG oder PDF) für die Nachrichtenzustellung
- beide Ausgaben in einem Aufruf

Wenn es aktiviert ist, stellt das Plugin knappe Nutzungshinweise dem System-Prompt-Bereich voran und stellt zusätzlich einen detaillierten Skill für Fälle bereit, in denen der Agent ausführlichere Anweisungen benötigt.

## Schnellstart

1. Aktiviere das Plugin.
2. Rufe `diffs` mit `mode: "view"` für Canvas-first-Abläufe auf.
3. Rufe `diffs` mit `mode: "file"` für Chat-Dateizustellungsabläufe auf.
4. Rufe `diffs` mit `mode: "both"` auf, wenn du beide Artefakte brauchst.

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

Wenn du das `diffs`-Tool aktiviert lassen, aber seine integrierte System-Prompt-Anleitung deaktivieren möchtest, setze `plugins.entries.diffs.hooks.allowPromptInjection` auf `false`:

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

Wenn du sowohl die Anleitung als auch das Tool deaktivieren möchtest, deaktiviere stattdessen das Plugin.

## Typischer Agent-Workflow

1. Der Agent ruft `diffs` auf.
2. Der Agent liest die Felder in `details`.
3. Der Agent:
   - öffnet `details.viewerUrl` mit `canvas present`
   - sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`
   - oder tut beides

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

- `before` (`string`): ursprünglicher Text. Erforderlich zusammen mit `after`, wenn `patch` weggelassen wird.
- `after` (`string`): aktualisierter Text. Erforderlich zusammen mit `before`, wenn `patch` weggelassen wird.
- `patch` (`string`): vereinheitlichter Diff-Text. Gegenseitig ausschließend mit `before` und `after`.
- `path` (`string`): angezeigter Dateiname für den Modus with before/after.
- `lang` (`string`): Sprach-Override-Hinweis für den Modus with before/after. Unbekannte Werte fallen auf Klartext zurück.
- `title` (`string`): Override für den Viewer-Titel.
- `mode` (`"view" | "file" | "both"`): Ausgabemodus. Standard ist der Plugin-Standard `defaults.mode`.
  Veralteter Alias: `"image"` verhält sich wie `"file"` und wird aus Gründen der Abwärtskompatibilität weiterhin akzeptiert.
- `theme` (`"light" | "dark"`): Viewer-Theme. Standard ist der Plugin-Standard `defaults.theme`.
- `layout` (`"unified" | "split"`): Diff-Layout. Standard ist der Plugin-Standard `defaults.layout`.
- `expandUnchanged` (`boolean`): unveränderte Abschnitte erweitern, wenn vollständiger Kontext verfügbar ist. Nur Aufrufoption (kein Plugin-Standardschlüssel).
- `fileFormat` (`"png" | "pdf"`): gerendertes Dateiformat. Standard ist der Plugin-Standard `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): Qualitäts-Preset für PNG- oder PDF-Rendering.
- `fileScale` (`number`): Override für Geräteskalierung (`1`-`4`).
- `fileMaxWidth` (`number`): maximale Renderbreite in CSS-Pixeln (`640`-`2400`).
- `ttlSeconds` (`number`): Artefakt-TTL in Sekunden für Viewer- und eigenständige Dateiausgaben. Standard 1800, Maximum 21600.
- `baseUrl` (`string`): Override für den Ursprung der Viewer-URL. Überschreibt das Plugin-`viewerBaseUrl`. Muss `http` oder `https` sein, ohne Query/Hash.

Legacy-Eingabealiase werden aus Gründen der Abwärtskompatibilität weiterhin akzeptiert:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validierung und Grenzen:

- `before` und `after` jeweils max. 512 KiB.
- `patch` max. 2 MiB.
- `path` max. 2048 Bytes.
- `lang` max. 128 Bytes.
- `title` max. 1024 Bytes.
- Begrenzung der Patch-Komplexität: max. 128 Dateien und 120000 Gesamtzeilen.
- `patch` zusammen mit `before` oder `after` wird abgelehnt.
- Sicherheitsgrenzen für gerenderte Dateien (gelten für PNG und PDF):
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

Zusammenfassung des Modusverhaltens:

- `mode: "view"`: nur Viewer-Felder.
- `mode: "file"`: nur Dateifelder, kein Viewer-Artefakt.
- `mode: "both"`: Viewer-Felder plus Dateifelder. Wenn das Dateirendering fehlschlägt, wird der Viewer trotzdem mit `fileError` und dem Kompatibilitätsalias `imageError` zurückgegeben.

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Bedienelemente zum Erweitern in diesen Zeilen sind bedingt und nicht für jede Eingabeart garantiert.
- Bedienelemente zum Erweitern erscheinen, wenn der gerenderte Diff erweiterbare Kontextdaten enthält, was typisch für before-/after-Eingaben ist.
- Bei vielen vereinheitlichten Patch-Eingaben sind ausgelassene Kontextkörper in den geparsten Patch-Hunks nicht verfügbar, sodass die Zeile ohne Bedienelemente zum Erweitern erscheinen kann. Das ist erwartetes Verhalten.
- `expandUnchanged` gilt nur, wenn erweiterbarer Kontext existiert.

## Plugin-Standardeinstellungen

Setze pluginweite Standardwerte in `~/.openclaw/openclaw.json`:

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

Persistente Viewer-URL-Konfiguration:

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
  - `false`: Anfragen ohne loopback an Viewer-Routen werden abgelehnt.
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

## Artefakt-Lebenszyklus und Speicherung

- Artefakte werden unter dem temp-Unterordner gespeichert: `$TMPDIR/openclaw-diffs`.
- Viewer-Artefakt-Metadaten enthalten:
  - zufällige Artefakt-ID (20 Hex-Zeichen)
  - zufälliges Token (48 Hex-Zeichen)
  - `createdAt` und `expiresAt`
  - gespeicherten Pfad `viewer.html`
- Die Standard-Artefakt-TTL beträgt 30 Minuten, wenn nichts angegeben ist.
- Die maximal akzeptierte Viewer-TTL beträgt 6 Stunden.
- Das Bereinigen läuft opportunistisch nach der Artefakterstellung.
- Abgelaufene Artefakte werden gelöscht.
- Fallback-Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL- und Netzwerkverhalten

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für diese Asset-Anfragen erhalten bleibt.

Verhalten beim URL-Aufbau:

- Wenn `baseUrl` im Tool-Aufruf angegeben ist, wird es nach strikter Validierung verwendet.
- Sonst wird, falls das Plugin-`viewerBaseUrl` konfiguriert ist, dieses verwendet.
- Ohne eines dieser Overrides ist die Viewer-URL standardmäßig auf loopback `127.0.0.1`.
- Wenn der Gateway-Bind-Modus `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

Regeln für `baseUrl`:

- Muss `http://` oder `https://` sein.
- Query und Hash werden abgelehnt.
- Origin plus optionaler Basispfad sind erlaubt.

## Sicherheitsmodell

Härtung des Viewers:

- Standardmäßig nur loopback.
- Tokenisierte Viewer-Pfade mit strikter ID- und Token-Validierung.
- CSP der Viewer-Antwort:
  - `default-src 'none'`
  - Skripte und Assets nur von self
  - kein ausgehendes `connect-src`
- Drosselung bei Remote-Fehlschlägen, wenn Remote-Zugriff aktiviert ist:
  - 40 Fehler pro 60 Sekunden
  - 60 Sekunden Sperre (`429 Too Many Requests`)

Härtung des Dateirenderings:

- Request-Routing des Screenshot-Browsers ist standardmäßig deny-by-default.
- Nur lokale Viewer-Assets von `http://127.0.0.1/plugins/diffs/assets/*` sind erlaubt.
- Externe Netzwerkanfragen werden blockiert.

## Browser-Anforderungen für Dateimodus

`mode: "file"` und `mode: "both"` benötigen einen Chromium-kompatiblen Browser.

Reihenfolge der Auflösung:

1. `browser.executablePath` in der OpenClaw-Konfiguration.
2. Umgebungsvariablen:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Plattformweites Fallback für Befehls-/Pfaderkennung.

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Behebe das durch Installation von Chrome, Chromium, Edge oder Brave oder durch Setzen einer der oben genannten Pfadoptionen für die ausführbare Datei.

## Fehlerbehebung

Eingabevalidierungsfehler:

- `Provide patch or both before and after text.`
  - Gib sowohl `before` als auch `after` an oder stelle `patch` bereit.
- `Provide either patch or before/after input, not both.`
  - Mische die Eingabemodi nicht.
- `Invalid baseUrl: ...`
  - Verwende einen `http(s)`-Origin mit optionalem Pfad, ohne Query/Hash.
- `{field} exceeds maximum size (...)`
  - Reduziere die Größe des Payloads.
- Ablehnung wegen großem Patch
  - Reduziere die Anzahl der Dateien oder die Gesamtzeilen im Patch.

Probleme mit der Erreichbarkeit des Viewers:

- Viewer-URLs werden standardmäßig zu `127.0.0.1` aufgelöst.
- Für Remote-Zugriffsszenarien gilt entweder:
  - setze das Plugin-`viewerBaseUrl`, oder
  - übergib `baseUrl` pro Tool-Aufruf, oder
  - verwende `gateway.bind=custom` und `gateway.customBindHost`
- Wenn `gateway.trustedProxies` loopback für einen Proxy auf demselben Host enthält (zum Beispiel Tailscale Serve), schlagen rohe loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header konstruktionsbedingt fail-closed fehl.
- Für diese Proxy-Topologie:
  - bevorzuge `mode: "file"` oder `mode: "both"`, wenn du nur einen Anhang brauchst, oder
  - aktiviere absichtlich `security.allowRemoteViewer` und setze das Plugin-`viewerBaseUrl` oder übergib ein Proxy-/öffentliches `baseUrl`, wenn du eine teilbare Viewer-URL brauchst
- Aktiviere `security.allowRemoteViewer` nur, wenn du externen Viewer-Zugriff beabsichtigst.

Die Zeile für unveränderte Zeilen hat keinen Erweitern-Button:

- Das kann bei Patch-Eingabe passieren, wenn der Patch keinen erweiterbaren Kontext enthält.
- Das ist erwartet und weist nicht auf einen Fehler des Viewers hin.

Artefakt nicht gefunden:

- Artefakt ist wegen TTL abgelaufen.
- Token oder Pfad wurde geändert.
- Die Bereinigung hat veraltete Daten entfernt.

## Betriebshinweise

- Bevorzuge `mode: "view"` für lokale interaktive Prüfungen in Canvas.
- Bevorzuge `mode: "file"` für ausgehende Chat-Channels, die einen Anhang benötigen.
- Lasse `allowRemoteViewer` deaktiviert, es sei denn, dein Deployment benötigt Remote-Viewer-URLs.
- Setze explizite kurze `ttlSeconds` für sensible Diffs.
- Vermeide es, Secrets in Diff-Eingaben zu senden, wenn dies nicht erforderlich ist.
- Wenn dein Channel Bilder stark komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzuge PDF-Ausgabe (`fileFormat: "pdf"`).

Diff-Rendering-Engine:

- Bereitgestellt von [Diffs](https://diffs.com).

## Zugehörige Docs

- [Tools overview](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
