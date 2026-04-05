---
read_when:
    - Vous voulez installer un bundle compatible Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw mappe le contenu des bundles vers des fonctionnalités natives
    - Vous déboguez la détection des bundles ou des capacités manquantes
summary: Installer et utiliser des bundles Codex, Claude et Cursor comme plugins OpenClaw
title: Bundles de plugins
x-i18n:
    generated_at: "2026-04-05T12:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundles de plugins

OpenClaw peut installer des plugins depuis trois écosystèmes externes : **Codex**, **Claude**
et **Cursor**. On les appelle des **bundles** — des packs de contenu et de métadonnées que
OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les bundles ne sont **pas** la même chose que les plugins natifs OpenClaw. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des packs de contenu avec
  un mappage sélectif des fonctionnalités et une limite de confiance plus étroite.
</Info>

## Pourquoi les bundles existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’exiger que les auteurs les réécrivent comme plugins natifs OpenClaw, OpenClaw
détecte ces formats et mappe leur contenu pris en charge vers l’ensemble de fonctionnalités natives.
Cela signifie que vous pouvez installer un pack de commandes Claude ou un bundle de Skills Codex
et l’utiliser immédiatement.

## Installer un bundle

<Steps>
  <Step title="Installer depuis un répertoire, une archive ou une marketplace">
    ```bash
    # Répertoire local
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Vérifier la détection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Les bundles apparaissent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités mappées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles dans la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe depuis les bundles

Toutes les fonctionnalités d’un bundle ne s’exécutent pas aujourd’hui dans OpenClaw. Voici ce qui
fonctionne et ce qui est détecté mais pas encore connecté.

### Pris en charge maintenant

| Fonctionnalité | Comment elle est mappée                                                                    | S’applique à    |
| -------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Contenu de Skill | Les racines de Skills du bundle se chargent comme des Skills OpenClaw normales          | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` sont traités comme des racines de Skills                | Claude, Cursor  |
| Packs de hooks | Dispositions de style OpenClaw `HOOK.md` + `handler.ts`                                    | Codex           |
| Outils MCP     | La configuration MCP du bundle est fusionnée dans les paramètres Pi embarqués ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats |
| Serveurs LSP   | Le `.lsp.json` de Claude et les `lspServers` déclarés dans le manifeste sont fusionnés dans les valeurs par défaut LSP de Pi embarqué | Claude          |
| Paramètres     | Le `settings.json` de Claude est importé comme valeurs par défaut de Pi embarqué           | Claude          |

#### Contenu de Skill

- les racines de Skills du bundle se chargent comme des racines de Skills OpenClaw normales
- les racines `commands` Claude sont traitées comme des racines de Skills supplémentaires
- les racines `.cursor/commands` Cursor sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commandes Markdown Claude fonctionnent via le chargeur normal de Skills OpenClaw. Le Markdown de commandes Cursor fonctionne via le même chemin.

#### Packs de hooks

- les racines de hooks du bundle fonctionnent **uniquement** lorsqu’elles utilisent la disposition
  normale des packs de hooks OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les bundles activés peuvent contribuer une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres Pi embarqués effectifs sous
  `mcpServers`
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours d’agent Pi embarqué en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du bundle, de sorte que les
  paramètres d’espace de travail peuvent remplacer les entrées MCP du bundle si nécessaire
- les catalogues d’outils MCP des bundles sont triés de manière déterministe avant l’enregistrement, afin que les
  changements d’ordre `listTools()` en amont ne perturbent pas les blocs d’outils du cache de prompt

##### Transports

Les serveurs MCP peuvent utiliser le transport stdio ou HTTP :

**Stdio** lance un processus enfant :

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** se connecte à un serveur MCP en cours d’exécution via `sse` par défaut, ou `streamable-http` lorsqu’il est demandé :

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` peut être défini sur `"streamable-http"` ou `"sse"` ; lorsqu’il est omis, OpenClaw utilise `sse`
- seuls les schémas d’URL `http:` et `https:` sont autorisés
- les valeurs `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur avec à la fois `command` et `url` est rejetée
- les identifiants d’URL (userinfo et paramètres de requête) sont masqués dans les descriptions d’outils et les journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de bundle avec des noms sûrs pour le fournisseur sous la forme
`serverName__toolName`. Par exemple, un serveur avec la clé `"vigil-harbor"` exposant un
outil `memory_search` est enregistré comme `vigil-harbor__memory_search`.

- les caractères hors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont plafonnés à 30 caractères
- les noms complets d’outils sont plafonnés à 64 caractères
- les noms de serveur vides reviennent à `mcp`
- les noms assainis en collision sont désambiguïsés avec des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de garder les tours Pi répétés
  stables vis-à-vis du cache

#### Paramètres Pi embarqués

- le `settings.json` de Claude est importé comme paramètres Pi embarqués par défaut lorsque le
  bundle est activé
- OpenClaw assainit les clés de remplacement du shell avant de les appliquer

Clés assainies :

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi embarqué

- les bundles Claude activés peuvent contribuer une configuration de serveur LSP
- OpenClaw charge `.lsp.json` plus tous les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du bundle est fusionnée dans les valeurs par défaut LSP effectives de Pi embarqué
- seuls les serveurs LSP adossés à stdio pris en charge peuvent être exécutés aujourd’hui ; les transports non pris en charge
  apparaissent toujours dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- `agents`, automatisation `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- métadonnées inline/app Codex au-delà du signalement de capacité

## Formats de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des
    répertoires de packs de hooks de style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** disposition Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement spécifique à Claude :

    - `commands/` est traité comme du contenu de Skill
    - `settings.json` est importé dans les paramètres Pi embarqués (les clés de remplacement du shell sont assainies)
    - `.mcp.json` expose les outils stdio pris en charge à Pi embarqué
    - `.lsp.json` plus les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP de Pi embarqué
    - `hooks/hooks.json` est détecté mais non exécuté
    - les chemins de composants personnalisés dans le manifeste sont additifs (ils étendent les valeurs par défaut, ils ne les remplacent pas)

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de Skill
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont détectés uniquement

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw vérifie d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **plugin natif**
2. Marqueurs de bundle (`.codex-plugin/`, `.claude-plugin/`, ou disposition Claude/Cursor par défaut) — traité comme **bundle**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela empêche
que des packages à double format soient partiellement installés comme bundles.

## Sécurité

Les bundles ont une limite de confiance plus étroite que les plugins natifs :

- OpenClaw ne charge **pas** arbitrairement des modules runtime de bundle dans le processus
- les chemins des Skills et des packs de hooks doivent rester à l’intérieur de la racine du plugin (vérification de frontière)
- les fichiers de paramètres sont lus avec les mêmes vérifications de frontière
- les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les bundles plus sûrs par défaut, mais vous devez tout de même considérer les
bundles tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le bundle est détecté mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non connectée, il s’agit d’une limite du produit — pas d’une installation cassée.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi embarqués de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de bundle comme des correctifs de configuration bruts.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est détecté uniquement. Si vous avez besoin de hooks exécutables, utilisez la
    disposition de pack de hooks OpenClaw ou livrez un plugin natif.
  </Accordion>
</AccordionGroup>

## Lié

- [Installer et configurer des plugins](/tools/plugin)
- [Building Plugins](/plugins/building-plugins) — créer un plugin natif
- [Manifeste de plugin](/plugins/manifest) — schéma du manifeste natif
