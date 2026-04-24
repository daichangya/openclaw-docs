---
read_when:
    - Implementieren des Canvas-Panels unter macOS
    - Hinzufügen von Agent-Steuerelementen für den visuellen Workspace
    - Fehleranalyse bei Canvas-Ladevorgängen in WKWebView
summary: Agentengesteuertes Canvas-Panel, eingebettet über WKWebView + benutzerdefiniertes URL-Schema
title: Canvas
x-i18n:
    generated_at: "2026-04-24T06:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

Die macOS-App bettet ein agentengesteuertes **Canvas-Panel** mit `WKWebView` ein. Es
ist ein leichtgewichtiger visueller Workspace für HTML/CSS/JS, A2UI und kleine interaktive
UI-Oberflächen.

## Wo Canvas liegt

Der Canvas-Zustand wird unter Application Support gespeichert:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Das Canvas-Panel stellt diese Dateien über ein **benutzerdefiniertes URL-Schema** bereit:

- `openclaw-canvas://<session>/<path>`

Beispiele:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Wenn im Root keine `index.html` existiert, zeigt die App eine **integrierte Scaffold-Seite** an.

## Verhalten des Panels

- Rahmenloses, skalierbares Panel, verankert nahe der Menüleiste (oder des Mauszeigers).
- Merkt sich Größe/Position pro Sitzung.
- Lädt automatisch neu, wenn sich lokale Canvas-Dateien ändern.
- Es ist immer nur ein Canvas-Panel sichtbar (die Sitzung wird bei Bedarf gewechselt).

Canvas kann in Einstellungen → **Allow Canvas** deaktiviert werden. Wenn es deaktiviert ist, geben Canvas-
Node-Befehle `CANVAS_DISABLED` zurück.

## Oberfläche der Agent-API

Canvas wird über den **Gateway-WebSocket** bereitgestellt, sodass der Agent:

- das Panel anzeigen/ausblenden kann
- zu einem Pfad oder einer URL navigieren kann
- JavaScript auswerten kann
- ein Snapshot-Bild aufnehmen kann

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

A2UI wird vom Gateway-Canvas-Host bereitgestellt und im Canvas-Panel gerendert.
Wenn das Gateway einen Canvas-Host veröffentlicht, navigiert die macOS-App beim
ersten Öffnen automatisch zur A2UI-Host-Seite.

Standardmäßige A2UI-Host-URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI-Befehle (v0.8)

Canvas akzeptiert derzeit **A2UI-v0.8**-Server→Client-Nachrichten:

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

## Agent-Runs aus Canvas auslösen

Canvas kann über Deep Links neue Agent-Runs auslösen:

- `openclaw://agent?...`

Beispiel (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Die App fordert eine Bestätigung an, sofern kein gültiger Schlüssel bereitgestellt wird.

## Sicherheitshinweise

- Das Canvas-Schema blockiert Directory Traversal; Dateien müssen unter dem Sitzungs-Root liegen.
- Lokaler Canvas-Inhalt verwendet ein benutzerdefiniertes Schema (kein loopback-Server erforderlich).
- Externe `http(s)`-URLs sind nur erlaubt, wenn ausdrücklich dorthin navigiert wird.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [WebChat](/de/web/webchat)
