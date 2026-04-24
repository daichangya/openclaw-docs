---
read_when:
    - implémentation du panneau Canvas macOS
    - ajout de contrôles d’agent pour l’espace de travail visuel
    - débogage des chargements Canvas WKWebView
summary: panneau Canvas contrôlé par l’agent intégré via WKWebView + schéma d’URL personnalisé
title: Canvas
x-i18n:
    generated_at: "2026-04-24T07:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

L’app macOS intègre un **panneau Canvas** contrôlé par l’agent à l’aide de `WKWebView`. Il
s’agit d’un espace de travail visuel léger pour HTML/CSS/JS, A2UI et de petites
surfaces d’interface interactives.

## Où vit Canvas

L’état de Canvas est stocké sous Application Support :

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
- Se recharge automatiquement lorsque les fichiers Canvas locaux changent.
- Un seul panneau Canvas est visible à la fois (la session change selon les besoins).

Canvas peut être désactivé depuis Réglages → **Allow Canvas**. Lorsqu’il est désactivé, les
commandes de nœud canvas renvoient `CANVAS_DISABLED`.

## Surface d’API de l’agent

Canvas est exposé via le **WebSocket Gateway**, afin que l’agent puisse :

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

- `canvas.navigate` accepte des **chemins Canvas locaux**, des URL `http(s)` et des URL `file://`.
- Si vous passez `"/"`, Canvas affiche l’échafaudage local ou `index.html`.

## A2UI dans Canvas

A2UI est hébergé par le canvas host de la Gateway et rendu dans le panneau Canvas.
Lorsque la Gateway annonce un canvas host, l’app macOS navigue automatiquement vers la
page hôte A2UI à la première ouverture.

URL hôte A2UI par défaut :

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Commandes A2UI (v0.8)

Canvas accepte actuellement les messages serveur→client **A2UI v0.8** :

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

Test rapide :

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

L’app demande confirmation sauf si une clé valide est fournie.

## Remarques de sécurité

- Le schéma Canvas bloque la traversée de répertoires ; les fichiers doivent vivre sous la racine de session.
- Le contenu Canvas local utilise un schéma personnalisé (aucun serveur loopback requis).
- Les URL `http(s)` externes ne sont autorisées que lorsqu’elles sont explicitement utilisées pour la navigation.

## Liens associés

- [app macOS](/fr/platforms/macos)
- [WebChat](/fr/web/webchat)
