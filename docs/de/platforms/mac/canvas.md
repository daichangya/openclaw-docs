---
read_when:
    - Das Canvas-Panel für macOS implementieren
    - Agentensteuerungen für den visuellen Workspace hinzufügen
    - Canvas-Ladevorgänge in WKWebView debuggen
summary: Vom Agenten gesteuertes Canvas-Panel, eingebettet über WKWebView + benutzerdefiniertes URL-Schema
title: Canvas
x-i18n:
    generated_at: "2026-04-05T12:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (macOS-App)

Die macOS-App bettet ein vom Agenten gesteuertes **Canvas-Panel** mit `WKWebView` ein. Es
ist ein leichtgewichtiger visueller Workspace für HTML/CSS/JS, A2UI und kleine interaktive
UI-Oberflächen.

## Wo Canvas liegt

Der Canvas-Status wird unter Application Support gespeichert:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Das Canvas-Panel stellt diese Dateien über ein **benutzerdefiniertes URL-Schema** bereit:

- `openclaw-canvas://<session>/<path>`

Beispiele:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Wenn im Root keine `index.html` existiert, zeigt die App eine **eingebaute Scaffold-Seite** an.

## Verhalten des Panels

- Rahmenloses, in der Größe veränderbares Panel, verankert nahe der Menüleiste (oder des Mauszeigers).
- Merkt sich Größe/Position pro Sitzung.
- Lädt automatisch neu, wenn sich lokale Canvas-Dateien ändern.
- Es ist immer nur ein Canvas-Panel gleichzeitig sichtbar (die Sitzung wird nach Bedarf gewechselt).

Canvas kann in den Einstellungen unter **Allow Canvas** deaktiviert werden. Wenn es deaktiviert ist, geben
Canvas-Knotenbefehle `CANVAS_DISABLED` zurück.

## API-Oberfläche für Agenten

Canvas wird über das **Gateway WebSocket** bereitgestellt, sodass der Agent Folgendes kann:

- das Panel anzeigen/verbergen
- zu einem Pfad oder einer URL navigieren
- JavaScript auswerten
- ein Snapshot-Bild aufnehmen

CLI-Beispiele:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Hinweise:

- `canvas.navigate` akzeptiert **lokale Canvas-Pfade**, `http(s)`-URLs und `file://`-URLs.
- Wenn Sie `"/"` übergeben, zeigt Canvas das lokale Scaffold oder `index.html` an.

## A2UI in Canvas

A2UI wird vom Gateway-Canvas-Host gehostet und innerhalb des Canvas-Panels gerendert.
Wenn das Gateway einen Canvas-Host bewirbt, navigiert die macOS-App beim ersten Öffnen automatisch zur
A2UI-Hostseite.

Standard-URL des A2UI-Hosts:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI-Befehle (v0.8)

Canvas akzeptiert derzeit **A2UI-v0.8**-Nachrichten vom Server an den Client:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) wird nicht unterstützt.

CLI-Beispiel:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Schneller Smoke-Test:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Agentenläufe aus Canvas auslösen

Canvas kann über Deep Links neue Agentenläufe auslösen:

- `openclaw://agent?...`

Beispiel (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Die App fordert zur Bestätigung auf, sofern kein gültiger Schlüssel bereitgestellt wird.

## Sicherheitshinweise

- Das Canvas-Schema blockiert Directory Traversal; Dateien müssen unter der Root der Sitzung liegen.
- Lokaler Canvas-Inhalt verwendet ein benutzerdefiniertes Schema (kein loopback-Server erforderlich).
- Externe `http(s)`-URLs sind nur erlaubt, wenn explizit zu ihnen navigiert wird.
