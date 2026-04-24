---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous souhaitez vous connecter à votre Chrome local déjà authentifié via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: Navigateur
x-i18n:
    generated_at: "2026-04-24T07:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions navigateur (cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage).

Associé :

- Outil navigateur + API : [Browser tool](/fr/tools/browser)

## Indicateurs courants

- `--url <gatewayWsUrl>` : URL WebSocket du Gateway (par défaut depuis la configuration).
- `--token <token>` : jeton Gateway (si requis).
- `--timeout <ms>` : délai d’attente de la requête (ms).
- `--expect-final` : attendre une réponse finale du Gateway.
- `--browser-profile <name>` : choisir un profil de navigateur (par défaut depuis la configuration).
- `--json` : sortie lisible par machine (lorsqu’elle est prise en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, dépannez d’abord la disponibilité de CDP. Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est sain et l’échec provient généralement de la politique SSRF de navigation.

Séquence minimale :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guide détaillé : [Dépannage du navigateur](/fr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cycle de vie

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Remarques :

- Pour les profils `attachOnly` et CDP distants, `openclaw browser stop` ferme la
  session de contrôle active et efface les remplacements d’émulation temporaires même lorsque
  OpenClaw n’a pas lancé lui-même le processus du navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus
  du navigateur lancé.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans
`~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, le Plugin navigateur intégré doit être listé
explicitement :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` ne rétablit pas la sous-commande CLI lorsque la
liste d’autorisation des plugins exclut `browser`.

Associé : [Browser tool](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage du navigateur. En pratique :

- `openclaw` : lance ou attache une instance Chrome dédiée gérée par OpenClaw (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome existante déjà authentifiée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utiliser un profil spécifique :

```bash
openclaw browser --browser-profile work tabs
```

## Onglets

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Instantané / capture d’écran / actions

Instantané :

```bash
openclaw browser snapshot
```

Capture d’écran :

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Remarques :

- `--full-page` est réservé aux captures de page ; il ne peut pas être combiné avec `--ref`
  ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures de page et les captures `--ref`
  issues de la sortie d’instantané, mais pas les captures CSS `--element`.

Navigate/click/type (automatisation UI basée sur des ref) :

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Assistants pour fichiers + boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## État et stockage

Viewport + émulation :

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + stockage :

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Débogage

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existant via MCP

Utilisez le profil `user` intégré, ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ce chemin est réservé à l’hôte. Pour Docker, les serveurs headless, Browserless ou d’autres configurations distantes, utilisez plutôt un profil CDP.

Limites actuelles de existing-session :

- les actions pilotées par instantané utilisent des ref, pas des sélecteurs CSS
- `click` est limité au clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` refusent
  les remplacements de délai d’attente par appel
- `select` ne prend en charge qu’une seule valeur
- `wait --load networkidle` n’est pas pris en charge
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge le CSS
  `--element` et prennent actuellement en charge un seul fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais pas le CSS `--element`
- `responsebody`, l’interception de téléchargement, l’export PDF et les actions par lot
  nécessitent toujours un navigateur géré ou un profil CDP brut

## Contrôle distant du navigateur (proxy d’hôte node)

Si le Gateway s’exécute sur une machine différente de celle du navigateur, exécutez un **hôte node** sur la machine qui dispose de Chrome/Brave/Edge/Chromium. Le Gateway transmettra les actions du navigateur à ce nœud (aucun serveur séparé de contrôle du navigateur n’est requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un nœud spécifique si plusieurs sont connectés.

Sécurité + configuration distante : [Browser tool](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Security](/fr/gateway/security)

## Associé

- [Référence CLI](/fr/cli)
- [Browser](/fr/tools/browser)
