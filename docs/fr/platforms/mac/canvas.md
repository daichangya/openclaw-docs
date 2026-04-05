---
read_when:
    - Implémentation du panneau Canvas macOS
    - Ajout de contrôles d’agent pour l’espace de travail visuel
    - Débogage des chargements canvas WKWebView
summary: Panneau Canvas contrôlé par l’agent, intégré via WKWebView + schéma d’URL personnalisé
title: Canvas
x-i18n:
    generated_at: "2026-04-05T12:48:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (app macOS)

L’app macOS intègre un **panneau Canvas** contrôlé par l’agent via `WKWebView`. Il
s’agit d’un espace de travail visuel léger pour HTML/CSS/JS, A2UI et de petites
surfaces d’interface interactives.

## Où se trouve Canvas

L’état Canvas est stocké sous Application Support :

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Le panneau Canvas sert ces fichiers via un **schéma d’URL personnalisé** :

- `openclaw-canvas://<session>/<path>`

Exemples :

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Si aucun `index.html` n’existe à la racine, l’app affiche une **page d’échafaudage intégrée**.

## Comportement du panneau

- Panneau sans bordure, redimensionnable, ancré près de la barre de menus (ou du curseur de la souris).
- Mémorise la taille/la position par session.
- Se recharge automatiquement lorsque les fichiers canvas locaux changent.
- Un seul panneau Canvas est visible à la fois (la session est changée si nécessaire).

Canvas peut être désactivé dans Réglages → **Allow Canvas**. Lorsqu’il est désactivé, les
commandes node canvas renvoient `CANVAS_DISABLED`.

## Surface API d’agent

Canvas est exposé via le **WebSocket de la passerelle**, de sorte que l’agent peut :

- afficher/masquer le panneau
- naviguer vers un chemin ou une URL
- évaluer du JavaScript
- capturer une image instantanée

Exemples CLI :

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Remarques :

- `canvas.navigate` accepte des **chemins canvas locaux**, des URL `http(s)` et des URL `file://`.
- Si vous passez `"/"`, Canvas affiche l’échafaudage local ou `index.html`.

## A2UI dans Canvas

A2UI est hébergé par l’hôte canvas de la passerelle et rendu à l’intérieur du panneau Canvas.
Lorsque la passerelle annonce un hôte Canvas, l’app macOS navigue automatiquement vers la
page d’hôte A2UI lors de la première ouverture.

URL d’hôte A2UI par défaut :

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Commandes A2UI (v0.8)

Canvas accepte actuellement les messages serveur→client **A2UI v0.8** suivants :

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) n’est pas pris en charge.

Exemple CLI :

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke test rapide :

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Déclencher des exécutions d’agent depuis Canvas

Canvas peut déclencher de nouvelles exécutions d’agent via des liens profonds :

- `openclaw://agent?...`

Exemple (en JS) :

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

L’app demande une confirmation sauf si une clé valide est fournie.

## Remarques de sécurité

- Le schéma Canvas bloque la traversée de répertoires ; les fichiers doivent se trouver sous la racine de session.
- Le contenu Canvas local utilise un schéma personnalisé (aucun serveur loopback requis).
- Les URL `http(s)` externes ne sont autorisées que lorsqu’elles sont explicitement visitées.
