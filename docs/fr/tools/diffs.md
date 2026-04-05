---
read_when:
    - Vous voulez que les agents affichent les modifications de code ou de Markdown sous forme de diffs
    - Vous voulez une URL de visionneuse prête pour le canvas ou un fichier de diff rendu
    - Vous avez besoin d'artefacts de diff temporaires et contrôlés avec des valeurs par défaut sécurisées
summary: Visionneuse de diff en lecture seule et moteur de rendu de fichiers pour les agents (outil de plugin optionnel)
title: Diffs
x-i18n:
    generated_at: "2026-04-05T12:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` est un outil de plugin optionnel avec de courtes consignes système intégrées et une skill compagnon qui transforme le contenu des modifications en artefact de diff en lecture seule pour les agents.

Il accepte soit :

- le texte `before` et `after`
- un `patch` unifié

Il peut renvoyer :

- une URL de visionneuse Gateway pour une présentation dans le canvas
- un chemin de fichier rendu (PNG ou PDF) pour la distribution par message
- les deux sorties en un seul appel

Lorsqu'il est activé, le plugin ajoute des consignes d'utilisation concises dans l'espace du prompt système et expose également une skill détaillée pour les cas où l'agent a besoin d'instructions plus complètes.

## Démarrage rapide

1. Activez le plugin.
2. Appelez `diffs` avec `mode: "view"` pour les flux orientés canvas en priorité.
3. Appelez `diffs` avec `mode: "file"` pour les flux de distribution de fichiers dans le chat.
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

## Désactiver les consignes système intégrées

Si vous souhaitez conserver l'outil `diffs` activé tout en désactivant ses consignes intégrées dans le prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

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

Cela bloque le hook `before_prompt_build` du plugin diffs tout en gardant le plugin, l'outil et la skill compagnon disponibles.

Si vous souhaitez désactiver à la fois les consignes et l'outil, désactivez plutôt le plugin.

## Workflow typique d'un agent

1. L'agent appelle `diffs`.
2. L'agent lit les champs `details`.
3. L'agent :
   - ouvre `details.viewerUrl` avec `canvas present`
   - envoie `details.filePath` avec `message` en utilisant `path` ou `filePath`
   - fait les deux

## Exemples d'entrée

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

## Référence des entrées de l'outil

Tous les champs sont facultatifs sauf indication contraire :

- `before` (`string`) : texte d'origine. Obligatoire avec `after` lorsque `patch` est omis.
- `after` (`string`) : texte mis à jour. Obligatoire avec `before` lorsque `patch` est omis.
- `patch` (`string`) : texte de diff unifié. Mutuellement exclusif avec `before` et `after`.
- `path` (`string`) : nom de fichier affiché pour le mode before/after.
- `lang` (`string`) : indice de remplacement de langue pour le mode before/after. Les valeurs inconnues reviennent au texte brut.
- `title` (`string`) : remplacement du titre de la visionneuse.
- `mode` (`"view" | "file" | "both"`) : mode de sortie. Par défaut : la valeur du plugin `defaults.mode`.
  Alias obsolète : `"image"` se comporte comme `"file"` et reste accepté pour compatibilité descendante.
- `theme` (`"light" | "dark"`) : thème de la visionneuse. Par défaut : la valeur du plugin `defaults.theme`.
- `layout` (`"unified" | "split"`) : disposition du diff. Par défaut : la valeur du plugin `defaults.layout`.
- `expandUnchanged` (`boolean`) : développe les sections inchangées lorsque le contexte complet est disponible. Option par appel uniquement (pas une clé de valeur par défaut du plugin).
- `fileFormat` (`"png" | "pdf"`) : format du fichier rendu. Par défaut : la valeur du plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`) : préréglage de qualité pour le rendu PNG ou PDF.
- `fileScale` (`number`) : remplacement de l'échelle du périphérique (`1`-`4`).
- `fileMaxWidth` (`number`) : largeur maximale de rendu en pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`) : TTL de l'artefact en secondes pour la visionneuse et les sorties de fichier autonomes. Valeur par défaut : 1800, maximum : 21600.
- `baseUrl` (`string`) : remplacement de l'origine d'URL de la visionneuse. Remplace la valeur du plugin `viewerBaseUrl`. Doit être en `http` ou `https`, sans query/hash.

Les alias d'entrée hérités restent acceptés pour compatibilité descendante :

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validation et limites :

- `before` et `after` : 512 Kio maximum chacun.
- `patch` : 2 Mio maximum.
- `path` : 2048 octets maximum.
- `lang` : 128 octets maximum.
- `title` : 1024 octets maximum.
- Limite de complexité du patch : 128 fichiers maximum et 120000 lignes au total.
- `patch` avec `before` ou `after` ensemble est rejeté.
- Limites de sécurité pour les fichiers rendus (s'appliquent au PNG et au PDF) :
  - `fileQuality: "standard"` : 8 MP maximum (8 000 000 pixels rendus).
  - `fileQuality: "hq"` : 14 MP maximum (14 000 000 pixels rendus).
  - `fileQuality: "print"` : 24 MP maximum (24 000 000 pixels rendus).
  - Le PDF a également une limite maximale de 50 pages.

## Contrat des détails de sortie

L'outil renvoie des métadonnées structurées sous `details`.

Champs partagés pour les modes qui créent une visionneuse :

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` lorsqu'ils sont disponibles)

Champs de fichier lorsqu'un PNG ou un PDF est rendu :

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (même valeur que `filePath`, pour compatibilité avec l'outil de message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Des alias de compatibilité sont également renvoyés pour les appelants existants :

- `format` (même valeur que `fileFormat`)
- `imagePath` (même valeur que `filePath`)
- `imageBytes` (même valeur que `fileBytes`)
- `imageQuality` (même valeur que `fileQuality`)
- `imageScale` (même valeur que `fileScale`)
- `imageMaxWidth` (même valeur que `fileMaxWidth`)

Résumé du comportement par mode :

- `mode: "view"` : champs de visionneuse uniquement.
- `mode: "file"` : champs de fichier uniquement, aucun artefact de visionneuse.
- `mode: "both"` : champs de visionneuse plus champs de fichier. Si le rendu du fichier échoue, la visionneuse est quand même renvoyée avec `fileError` et l'alias de compatibilité `imageError`.

## Sections inchangées repliées

- La visionneuse peut afficher des lignes comme `N unmodified lines`.
- Les contrôles de développement sur ces lignes sont conditionnels et non garantis pour chaque type d'entrée.
- Les contrôles de développement apparaissent lorsque le diff rendu contient des données de contexte développables, ce qui est typique pour une entrée before/after.
- Pour de nombreuses entrées de patch unifié, les corps de contexte omis ne sont pas disponibles dans les hunks de patch analysés ; la ligne peut donc apparaître sans contrôles de développement. C'est un comportement attendu.
- `expandUnchanged` s'applique uniquement lorsqu'un contexte développable existe.

## Valeurs par défaut du plugin

Définissez des valeurs par défaut à l'échelle du plugin dans `~/.openclaw/openclaw.json` :

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

Les paramètres explicites de l'outil remplacent ces valeurs par défaut.

Configuration persistante de l'URL de la visionneuse :

- `viewerBaseUrl` (`string`, facultatif)
  - Valeur de repli gérée par le plugin pour les liens de visionneuse renvoyés lorsqu'un appel d'outil ne transmet pas `baseUrl`.
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
  - `true` : les visionneuses distantes sont autorisées si le chemin tokenisé est valide.

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
- Les métadonnées de l'artefact de visionneuse contiennent :
  - un identifiant d'artefact aléatoire (20 caractères hexadécimaux)
  - un token aléatoire (48 caractères hexadécimaux)
  - `createdAt` et `expiresAt`
  - le chemin `viewer.html` stocké
- Le TTL par défaut de l'artefact est de 30 minutes lorsqu'il n'est pas spécifié.
- Le TTL maximal accepté pour la visionneuse est de 6 heures.
- Le nettoyage s'exécute de manière opportuniste après la création de l'artefact.
- Les artefacts expirés sont supprimés.
- Le nettoyage de repli supprime les dossiers obsolètes de plus de 24 heures lorsque les métadonnées sont absentes.

## Comportement réseau et URL de la visionneuse

Route de la visionneuse :

- `/plugins/diffs/view/{artifactId}/{token}`

Ressources de la visionneuse :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Le document de la visionneuse résout ces ressources relativement à l'URL de la visionneuse ; un préfixe de chemin `baseUrl` facultatif est donc également conservé pour ces requêtes de ressources.

Comportement de construction de l'URL :

- Si `baseUrl` est fourni dans l'appel d'outil, il est utilisé après validation stricte.
- Sinon, si la valeur du plugin `viewerBaseUrl` est configurée, elle est utilisée.
- Sans l'un ni l'autre remplacement, l'URL de la visionneuse utilise par défaut la loopback `127.0.0.1`.
- Si le mode de liaison de la gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé.

Règles pour `baseUrl` :

- Doit commencer par `http://` ou `https://`.
- Query et hash sont rejetés.
- L'origine plus un chemin de base facultatif sont autorisés.

## Modèle de sécurité

Renforcement de la visionneuse :

- Loopback uniquement par défaut.
- Chemins de visionneuse tokenisés avec validation stricte de l'identifiant et du token.
- CSP de la réponse de la visionneuse :
  - `default-src 'none'`
  - scripts et ressources uniquement depuis self
  - aucun `connect-src` sortant
- Limitation des échecs distants lorsque l'accès distant est activé :
  - 40 échecs par 60 secondes
  - verrouillage de 60 secondes (`429 Too Many Requests`)

Renforcement du rendu de fichier :

- Le routage des requêtes navigateur pour capture d'écran est refusé par défaut.
- Seules les ressources locales de la visionneuse depuis `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
- Les requêtes réseau externes sont bloquées.

## Exigences navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible Chromium.

Ordre de résolution :

1. `browser.executablePath` dans la configuration OpenClaw.
2. Variables d'environnement :
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Repli vers la découverte de commande/chemin selon la plateforme.

Texte d'échec courant :

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrigez cela en installant Chrome, Chromium, Edge ou Brave, ou en définissant l'une des options de chemin d'exécutable ci-dessus.

## Dépannage

Erreurs de validation d'entrée :

- `Provide patch or both before and after text.`
  - Incluez `before` et `after`, ou fournissez `patch`.
- `Provide either patch or before/after input, not both.`
  - Ne mélangez pas les modes d'entrée.
- `Invalid baseUrl: ...`
  - Utilisez une origine `http(s)` avec chemin facultatif, sans query/hash.
- `{field} exceeds maximum size (...)`
  - Réduisez la taille de la charge utile.
- Rejet de patch volumineux
  - Réduisez le nombre de fichiers du patch ou le nombre total de lignes.

Problèmes d'accessibilité de la visionneuse :

- L'URL de la visionneuse pointe par défaut vers `127.0.0.1`.
- Pour les scénarios d'accès distant :
  - définissez la valeur du plugin `viewerBaseUrl`, ou
  - transmettez `baseUrl` à chaque appel d'outil, ou
  - utilisez `gateway.bind=custom` et `gateway.customBindHost`
- Si `gateway.trustedProxies` inclut loopback pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes de visionneuse loopback sans en-têtes transférés d'IP client échouent par défaut, conformément à la conception.
- Pour cette topologie de proxy :
  - préférez `mode: "file"` ou `mode: "both"` lorsque vous avez seulement besoin d'une pièce jointe, ou
  - activez intentionnellement `security.allowRemoteViewer` et définissez la valeur du plugin `viewerBaseUrl` ou transmettez un `baseUrl` de proxy/public lorsque vous avez besoin d'une URL de visionneuse partageable
- Activez `security.allowRemoteViewer` uniquement si vous avez l'intention d'autoriser un accès externe à la visionneuse.

La ligne de lignes inchangées n'a pas de bouton de développement :

- Cela peut se produire avec une entrée patch lorsque le patch ne contient pas de contexte développable.
- C'est un comportement attendu et cela n'indique pas un échec de la visionneuse.

Artefact introuvable :

- L'artefact a expiré selon son TTL.
- Le token ou le chemin a été modifié.
- Le nettoyage a supprimé des données obsolètes.

## Consignes opérationnelles

- Préférez `mode: "view"` pour les revues interactives locales dans le canvas.
- Préférez `mode: "file"` pour les canaux de chat sortants qui nécessitent une pièce jointe.
- Gardez `allowRemoteViewer` désactivé sauf si votre déploiement nécessite des URL de visionneuse distantes.
- Définissez un `ttlSeconds` court et explicite pour les diffs sensibles.
- Évitez d'envoyer des secrets dans l'entrée de diff lorsque ce n'est pas nécessaire.
- Si votre canal compresse fortement les images (par exemple Telegram ou WhatsApp), préférez la sortie PDF (`fileFormat: "pdf"`).

Moteur de rendu de diff :

- Propulsé par [Diffs](https://diffs.com).

## Documentation associée

- [Vue d'ensemble des outils](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
