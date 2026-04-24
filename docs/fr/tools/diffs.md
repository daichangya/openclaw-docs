---
read_when:
    - Vous souhaitez que les agents affichent les modifications de code ou de Markdown sous forme de diffs
    - "Vous souhaitez une URL de visionneuse prête pour canvas ou un fichier de diff rendu\tRTLU to=final code നൽകിDiffs"
    - Vous avez besoin d’artefacts de diff temporaires et contrôlés avec des valeurs par défaut sécurisées
summary: Visionneuse de diff en lecture seule et moteur de rendu de fichiers pour agents (outil de plugin optionnel)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T07:35:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` est un outil de plugin optionnel avec une courte guidance système intégrée et une Skill compagnon qui transforme le contenu des modifications en artefact de diff en lecture seule pour les agents.

Il accepte soit :

- du texte `before` et `after`
- un `patch` unifié

Il peut renvoyer :

- une URL de visionneuse gateway pour une présentation canvas
- un chemin de fichier rendu (PNG ou PDF) pour une livraison par message
- les deux sorties en un seul appel

Lorsqu’il est activé, le plugin ajoute une guidance d’utilisation concise dans l’espace du prompt système et expose aussi une Skill détaillée pour les cas où l’agent a besoin d’instructions plus complètes.

## Démarrage rapide

1. Activez le plugin.
2. Appelez `diffs` avec `mode: "view"` pour les flux orientés canvas.
3. Appelez `diffs` avec `mode: "file"` pour les flux de livraison de fichier dans le chat.
4. Appelez `diffs` avec `mode: "both"` lorsque vous avez besoin des deux artefacts.

## Activer le plugin

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

## Désactiver la guidance système intégrée

Si vous voulez garder l’outil `diffs` activé mais désactiver sa guidance intégrée dans le prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

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

Cela bloque le hook `before_prompt_build` du plugin diffs tout en gardant le plugin, l’outil et la Skill compagnon disponibles.

Si vous voulez désactiver à la fois la guidance et l’outil, désactivez plutôt le plugin.

## Workflow typique d’agent

1. L’agent appelle `diffs`.
2. L’agent lit les champs `details`.
3. L’agent :
   - ouvre `details.viewerUrl` avec `canvas present`
   - envoie `details.filePath` avec `message` en utilisant `path` ou `filePath`
   - ou fait les deux

## Exemples d’entrée

Before et after :

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch :

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Référence des entrées de l’outil

Tous les champs sont facultatifs sauf mention contraire :

- `before` (`string`) : texte original. Requis avec `after` lorsque `patch` est omis.
- `after` (`string`) : texte mis à jour. Requis avec `before` lorsque `patch` est omis.
- `patch` (`string`) : texte de diff unifié. Mutuellement exclusif avec `before` et `after`.
- `path` (`string`) : nom de fichier d’affichage pour le mode before/after.
- `lang` (`string`) : indice de langue de surcharge pour le mode before/after. Les valeurs inconnues reviennent au texte brut.
- `title` (`string`) : surcharge du titre de la visionneuse.
- `mode` (`"view" | "file" | "both"`) : mode de sortie. Par défaut sur `defaults.mode` du plugin.
  Alias obsolète : `"image"` se comporte comme `"file"` et reste accepté pour compatibilité descendante.
- `theme` (`"light" | "dark"`) : thème de la visionneuse. Par défaut sur `defaults.theme` du plugin.
- `layout` (`"unified" | "split"`) : disposition du diff. Par défaut sur `defaults.layout` du plugin.
- `expandUnchanged` (`boolean`) : développer les sections inchangées lorsque le contexte complet est disponible. Option par appel uniquement (pas une clé par défaut du plugin).
- `fileFormat` (`"png" | "pdf"`) : format du fichier rendu. Par défaut sur `defaults.fileFormat` du plugin.
- `fileQuality` (`"standard" | "hq" | "print"`) : préréglage de qualité pour le rendu PNG ou PDF.
- `fileScale` (`number`) : surcharge d’échelle du périphérique (`1`-`4`).
- `fileMaxWidth` (`number`) : largeur maximale de rendu en pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`) : TTL de l’artefact en secondes pour la visionneuse et les sorties fichier autonomes. Par défaut 1800, max 21600.
- `baseUrl` (`string`) : surcharge de l’origine d’URL de la visionneuse. Remplace `viewerBaseUrl` du plugin. Doit être en `http` ou `https`, sans query/hash.

Les alias d’entrée hérités restent acceptés pour compatibilité descendante :

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validation et limites :

- `before` et `after` : max 512 Kio chacun.
- `patch` : max 2 Mio.
- `path` : max 2048 octets.
- `lang` : max 128 octets.
- `title` : max 1024 octets.
- Limite de complexité du patch : max 128 fichiers et 120000 lignes au total.
- `patch` et `before` ou `after` ensemble sont rejetés.
- Limites de sécurité du fichier rendu (s’appliquent à PNG et PDF) :
  - `fileQuality: "standard"` : max 8 MP (8 000 000 pixels rendus).
  - `fileQuality: "hq"` : max 14 MP (14 000 000 pixels rendus).
  - `fileQuality: "print"` : max 24 MP (24 000 000 pixels rendus).
  - Le PDF a aussi un maximum de 50 pages.

## Contrat de sortie `details`

L’outil renvoie des métadonnées structurées sous `details`.

Champs partagés pour les modes qui créent une visionneuse :

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` lorsque disponible)

Champs de fichier lorsque le PNG ou le PDF est rendu :

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (même valeur que `filePath`, pour compatibilité avec l’outil message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Des alias de compatibilité sont aussi renvoyés pour les appelants existants :

- `format` (même valeur que `fileFormat`)
- `imagePath` (même valeur que `filePath`)
- `imageBytes` (même valeur que `fileBytes`)
- `imageQuality` (même valeur que `fileQuality`)
- `imageScale` (même valeur que `fileScale`)
- `imageMaxWidth` (même valeur que `fileMaxWidth`)

Résumé du comportement selon le mode :

- `mode: "view"` : champs de visionneuse uniquement.
- `mode: "file"` : champs de fichier uniquement, sans artefact de visionneuse.
- `mode: "both"` : champs de visionneuse plus champs de fichier. Si le rendu du fichier échoue, la visionneuse est quand même renvoyée avec `fileError` et l’alias de compatibilité `imageError`.

## Sections inchangées repliées

- La visionneuse peut afficher des lignes comme `N unmodified lines`.
- Les contrôles de développement sur ces lignes sont conditionnels et non garantis pour chaque type d’entrée.
- Les contrôles de développement apparaissent lorsque le diff rendu contient des données de contexte développables, ce qui est typique pour une entrée before/after.
- Pour beaucoup d’entrées de patch unifié, les corps de contexte omis ne sont pas disponibles dans les hunks de patch analysés, de sorte que la ligne peut apparaître sans contrôles de développement. C’est un comportement attendu.
- `expandUnchanged` ne s’applique que lorsqu’un contexte développable existe.

## Valeurs par défaut du plugin

Définissez les valeurs par défaut globales du plugin dans `~/.openclaw/openclaw.json` :

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

Valeurs par défaut prises en charge :

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

Les paramètres explicites de l’outil remplacent ces valeurs par défaut.

Configuration persistante d’URL de visionneuse :

- `viewerBaseUrl` (`string`, facultatif)
  - Valeur de repli détenue par le plugin pour les liens de visionneuse renvoyés lorsqu’un appel d’outil ne passe pas `baseUrl`.
  - Doit être en `http` ou `https`, sans query/hash.

Exemple :

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

## Configuration de sécurité

- `security.allowRemoteViewer` (`boolean`, par défaut `false`)
  - `false` : les requêtes non loopback vers les routes de la visionneuse sont refusées.
  - `true` : les visionneuses distantes sont autorisées si le chemin avec jeton est valide.

Exemple :

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

## Cycle de vie et stockage des artefacts

- Les artefacts sont stockés dans le sous-dossier temporaire : `$TMPDIR/openclaw-diffs`.
- Les métadonnées des artefacts de visionneuse contiennent :
  - identifiant d’artefact aléatoire (20 caractères hexadécimaux)
  - jeton aléatoire (48 caractères hexadécimaux)
  - `createdAt` et `expiresAt`
  - chemin `viewer.html` stocké
- Le TTL par défaut des artefacts est de 30 minutes lorsqu’il n’est pas spécifié.
- Le TTL maximal accepté pour la visionneuse est de 6 heures.
- Le nettoyage s’exécute de manière opportuniste après la création de l’artefact.
- Les artefacts expirés sont supprimés.
- Le nettoyage de repli supprime les dossiers obsolètes de plus de 24 heures lorsque les métadonnées sont absentes.

## URL de la visionneuse et comportement réseau

Route de la visionneuse :

- `/plugins/diffs/view/{artifactId}/{token}`

Ressources de la visionneuse :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Le document de la visionneuse résout ces ressources relativement à l’URL de la visionneuse, donc un préfixe de chemin `baseUrl` facultatif est également conservé pour ces requêtes de ressources.

Comportement de construction des URL :

- Si `baseUrl` est fourni dans l’appel d’outil, il est utilisé après validation stricte.
- Sinon, si `viewerBaseUrl` du plugin est configuré, il est utilisé.
- Sans l’une ou l’autre surcharge, l’URL de la visionneuse utilise par défaut loopback `127.0.0.1`.
- Si le mode de bind du gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé.

Règles `baseUrl` :

- Doit être en `http://` ou `https://`.
- Les query et hash sont rejetés.
- L’origine plus un chemin de base facultatif sont autorisés.

## Modèle de sécurité

Durcissement de la visionneuse :

- Loopback-only par défaut.
- Chemins de visionneuse avec jeton et validation stricte de l’identifiant et du jeton.
- CSP de réponse de la visionneuse :
  - `default-src 'none'`
  - scripts et ressources uniquement depuis self
  - aucun `connect-src` sortant
- Limitation des échecs distants lorsque l’accès distant est activé :
  - 40 échecs par 60 secondes
  - verrouillage de 60 secondes (`429 Too Many Requests`)

Durcissement du rendu de fichier :

- Le routage des requêtes navigateur de capture d’écran est refusé par défaut.
- Seules les ressources locales de visionneuse depuis `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
- Les requêtes réseau externes sont bloquées.

## Exigences navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible Chromium.

Ordre de résolution :

1. `browser.executablePath` dans la configuration OpenClaw.
2. Variables d’environnement :
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Repli de découverte de commande/chemin selon la plateforme.

Texte d’échec courant :

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrigez cela en installant Chrome, Chromium, Edge, ou Brave, ou en définissant l’une des options de chemin d’exécutable ci-dessus.

## Dépannage

Erreurs de validation d’entrée :

- `Provide patch or both before and after text.`
  - Incluez `before` et `after`, ou fournissez `patch`.
- `Provide either patch or before/after input, not both.`
  - Ne mélangez pas les modes d’entrée.
- `Invalid baseUrl: ...`
  - Utilisez une origine `http(s)` avec chemin facultatif, sans query/hash.
- `{field} exceeds maximum size (...)`
  - Réduisez la taille de la charge utile.
- Rejet de patch volumineux
  - Réduisez le nombre de fichiers du patch ou le nombre total de lignes.

Problèmes d’accessibilité de la visionneuse :

- L’URL de la visionneuse se résout par défaut vers `127.0.0.1`.
- Pour les scénarios d’accès distant, soit :
  - définissez le `viewerBaseUrl` du plugin, ou
  - passez `baseUrl` à chaque appel d’outil, ou
  - utilisez `gateway.bind=custom` et `gateway.customBindHost`
- Si `gateway.trustedProxies` inclut loopback pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes loopback vers la visionneuse sans en-têtes transmis d’IP client échouent en mode fermé par conception.
- Pour cette topologie de proxy :
  - préférez `mode: "file"` ou `mode: "both"` lorsque vous n’avez besoin que d’une pièce jointe, ou
  - activez intentionnellement `security.allowRemoteViewer` et définissez `viewerBaseUrl` du plugin ou passez un `baseUrl` proxy/public lorsque vous avez besoin d’une URL de visionneuse partageable
- N’activez `security.allowRemoteViewer` que si vous avez réellement l’intention d’autoriser l’accès externe à la visionneuse.

La ligne des lignes inchangées n’a pas de bouton de développement :

- Cela peut se produire pour une entrée patch lorsque le patch ne transporte pas de contexte développable.
- C’est un comportement attendu et n’indique pas une défaillance de la visionneuse.

Artefact introuvable :

- L’artefact a expiré à cause du TTL.
- Le jeton ou le chemin a changé.
- Le nettoyage a supprimé des données obsolètes.

## Recommandations opérationnelles

- Préférez `mode: "view"` pour les revues interactives locales dans canvas.
- Préférez `mode: "file"` pour les canaux de chat sortants qui ont besoin d’une pièce jointe.
- Gardez `allowRemoteViewer` désactivé sauf si votre déploiement exige des URL de visionneuse distantes.
- Définissez un `ttlSeconds` court et explicite pour les diffs sensibles.
- Évitez d’envoyer des secrets dans l’entrée du diff lorsque ce n’est pas nécessaire.
- Si votre canal compresse fortement les images (par exemple Telegram ou WhatsApp), préférez la sortie PDF (`fileFormat: "pdf"`).

Moteur de rendu des diffs :

- Propulsé par [Diffs](https://diffs.com).

## Documentation associée

- [Vue d’ensemble des outils](/fr/tools)
- [Plugins](/fr/tools/plugin)
- [Navigateur](/fr/tools/browser)
