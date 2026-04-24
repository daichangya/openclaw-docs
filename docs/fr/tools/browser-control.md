---
read_when:
    - Script ou débogage du navigateur de l’agent via l’API de contrôle locale
    - Vous cherchez la référence CLI de `openclaw browser`
    - Ajouter une automatisation browser personnalisée avec snapshots et refs
summary: API de contrôle browser OpenClaw, référence CLI et actions de script
title: API de contrôle browser
x-i18n:
    generated_at: "2026-04-24T07:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Pour la configuration, la mise en place et le dépannage, voir [Browser](/fr/tools/browser).
Cette page est la référence pour l’API HTTP locale de contrôle, la CLI `openclaw browser`
et les schémas de script (snapshots, refs, waits, flux de débogage).

## API de contrôle (facultative)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP loopback :

- État/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les endpoints acceptent `?profile=<name>`.

Si l’authentification gateway à secret partagé est configurée, les routes HTTP browser exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou une authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API browser loopback autonome ne consomme **pas** les en-têtes d’identité trusted-proxy ou
  Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes browser loopback
  n’héritent pas de ces modes porteurs d’identité ; gardez-les réservées au loopback.

### Contrat d’erreur de `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau de la route et
les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est absent ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : `targetId` au niveau supérieur ou en lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils existing-session.

Les autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/AI snapshot/role snapshot, captures
d’écran d’élément, PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces endpoints renvoient
une erreur 501 explicite.

Ce qui fonctionne encore sans Playwright :

- Snapshots ARIA
- Captures d’écran de page pour le navigateur géré `openclaw` lorsqu’un WebSocket
  CDP par onglet est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran basées sur `ref` pour `existing-session` (`--ref`) à partir de la sortie snapshot

Ce qui nécessite encore Playwright :

- `navigate`
- `act`
- AI snapshots / role snapshots
- Captures d’écran d’élément via sélecteur CSS (`--element`)
- Export PDF complet du navigateur

Les captures d’écran d’élément rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, réparez les dépendances runtime du plugin browser intégré pour que `playwright-core` soit installé,
puis redémarrez le gateway. Pour les installations empaquetées, exécutez `openclaw doctor --fix`.
Pour Docker, installez aussi les binaires du navigateur Chromium comme indiqué ci-dessous.

#### Installation Docker de Playwright

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de remplacement npm).
Utilisez la CLI intégrée à la place :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour persister les téléchargements de navigateurs, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est persisté via
`OPENCLAW_HOME_VOLUME` ou un bind mount. Voir [Docker](/fr/install/docker).

## Comment cela fonctionne (interne)

Un petit serveur de contrôle loopback accepte les requêtes HTTP et se connecte aux navigateurs basés sur Chromium via CDP. Les actions avancées (click/type/snapshot/PDF) passent par Playwright au-dessus de CDP ; lorsque Playwright est absent, seules les opérations non Playwright sont disponibles. L’agent voit une interface stable tandis que les navigateurs et profils locaux/distants s’échangent librement en dessous.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique, et `--json` pour une sortie lisible par machine.

<AccordionGroup>

<Accordion title="Bases : statut, onglets, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection : screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions : navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="État : cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Remarques :

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la touche qui déclenche le sélecteur/la boîte de dialogue.
- `click`/`type`/etc nécessitent une `ref` issue de `snapshot` (numérique `12` ou role ref `e12`). Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions.
- Les chemins de téléchargement, de trace et de téléversement sont limités aux racines temp OpenClaw : `/tmp/openclaw{,/downloads,/uploads}` (repli : `${os.tmpdir()}/openclaw/...`).
- `upload` peut aussi définir directement les inputs de fichier via `--input-ref` ou `--element`.

Aperçu des indicateurs de snapshot :

- `--format ai` (par défaut avec Playwright) : AI snapshot avec refs numériques (`aria-ref="<n>"`).
- `--format aria` : arbre d’accessibilité, sans refs ; inspection uniquement.
- `--efficient` (ou `--mode efficient`) : preset de role snapshot compact. Définissez `browser.snapshotDefaults.mode: "efficient"` pour en faire la valeur par défaut (voir [Configuration Gateway](/fr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forcent un role snapshot avec des refs `ref=e12`. `--frame "<iframe>"` limite les role snapshots à une iframe.
- `--labels` ajoute une capture d’écran du viewport avec des étiquettes de ref superposées (affiche `MEDIA:<path>`).

## Snapshots et refs

OpenClaw prend en charge deux styles de “snapshot” :

- **AI snapshot (refs numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un snapshot texte qui inclut des refs numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la ref est résolue via `aria-ref` de Playwright.

- **Role snapshot (role refs comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la ref est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran du viewport avec les étiquettes `e12` superposées.

Comportement des refs :

- Les refs ne sont **pas stables entre les navigations** ; si quelque chose échoue, relancez `snapshot` et utilisez une nouvelle ref.
- Si le role snapshot a été pris avec `--frame`, les role refs sont limitées à cette iframe jusqu’au prochain role snapshot.

## Super-pouvoirs de wait

Vous pouvez attendre autre chose que du temps/texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces options peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflows de débogage

Lorsqu’une action échoue (par ex. “not visible”, “strict mode violation”, “covered”) :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les role refs en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné au scripting et à l’outillage structuré.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les role snapshots en JSON incluent `refs` plus un petit bloc `stats` (lignes/caractères/refs/interactive) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Réglages d’état et d’environnement

Ils sont utiles pour les workflows « faire se comporter le site comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Storage : `storage local|session get|set|clear`
- Offline : `set offline on|off`
- Headers : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP Basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / locale : `set timezone ...`, `set locale ...`
- Appareil / viewport :
  - `set device "iPhone 14"` (presets d’appareil Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil browser openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. L’injection de prompt peut
  orienter cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les remarques anti-bot (X/Twitter, etc.), voir [Connexion browser + publication X/Twitter](/fr/tools/browser-login).
- Gardez l’hôte Gateway/nœud privé (loopback ou tailnet uniquement).
- Les endpoints CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple de mode strict (bloquer par défaut les destinations privées/internes) :

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Associé

- [Browser](/fr/tools/browser) — vue d’ensemble, configuration, profils, sécurité
- [Connexion browser](/fr/tools/browser-login) — se connecter aux sites
- [Dépannage browser sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage browser WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
