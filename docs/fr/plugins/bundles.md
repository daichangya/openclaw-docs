---
read_when:
    - Vous souhaitez installer un bundle compatible Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw mappe le contenu d’un bundle vers des fonctionnalités natives
    - Vous déboguez la détection de bundle ou des capacités manquantes
summary: Installer et utiliser les bundles Codex, Claude et Cursor comme plugins OpenClaw
title: Bundles de plugins
x-i18n:
    generated_at: "2026-04-23T14:00:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundles de plugins

OpenClaw peut installer des plugins provenant de trois écosystèmes externes : **Codex**, **Claude**,
et **Cursor**. Ceux-ci sont appelés des **bundles** — des packs de contenu et de métadonnées que
OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les bundles **ne sont pas** la même chose que les plugins OpenClaw natifs. Les plugins natifs s’exécutent
  en processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des packs de contenu avec
  un mappage sélectif des fonctionnalités et une frontière de confiance plus étroite.
</Info>

## Pourquoi les bundles existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’exiger des auteurs qu’ils les réécrivent comme plugins OpenClaw natifs, OpenClaw
détecte ces formats et mappe leur contenu pris en charge vers l’ensemble de fonctionnalités natif.
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

    Les bundles s’affichent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités mappées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles dans la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe à partir des bundles

Toutes les fonctionnalités de bundle ne s’exécutent pas dans OpenClaw aujourd’hui. Voici ce qui fonctionne et ce
qui est détecté mais pas encore raccordé.

### Pris en charge actuellement

| Fonctionnalité | Comment elle est mappée                                                                    | S’applique à    |
| -------------- | ------------------------------------------------------------------------------------------- | --------------- |
| Contenu de Skill | Les racines de Skill du bundle se chargent comme des Skills OpenClaw normales             | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` traités comme des racines de Skill                      | Claude, Cursor  |
| Packs de hooks | Dispositions de style OpenClaw `HOOK.md` + `handler.ts`                                    | Codex           |
| Outils MCP     | La configuration MCP du bundle est fusionnée dans les paramètres Pi intégrés ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats |
| Serveurs LSP   | Claude `.lsp.json` et `lspServers` déclarés dans le manifeste sont fusionnés dans les valeurs par défaut LSP de Pi intégré | Claude          |
| Paramètres     | Claude `settings.json` importé comme valeurs par défaut de Pi intégré                      | Claude          |

#### Contenu de Skill

- les racines de Skill du bundle se chargent comme des racines de Skill OpenClaw normales
- les racines Claude `commands` sont traitées comme des racines de Skill supplémentaires
- les racines Cursor `.cursor/commands` sont traitées comme des racines de Skill supplémentaires

Cela signifie que les fichiers de commande markdown Claude fonctionnent via le chargeur
de Skills OpenClaw normal. Les commandes markdown Cursor fonctionnent par le même chemin.

#### Packs de hooks

- les racines de hook du bundle fonctionnent **uniquement** lorsqu’elles utilisent la disposition normale
  de pack de hooks OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les bundles activés peuvent contribuer à la configuration du serveur MCP
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres effectifs de Pi intégré en tant que
  `mcpServers`
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours d’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent les outils MCP de bundle par défaut ; utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou une Gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du bundle, de sorte que les paramètres d’espace de travail peuvent remplacer des entrées MCP du bundle si nécessaire
- les catalogues d’outils MCP de bundle sont triés de manière déterministe avant l’enregistrement, afin que
  les changements en amont de l’ordre `listTools()` ne perturbent pas les blocs d’outils du cache de prompt

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
- les identifiants URL (userinfo et paramètres de requête) sont masqués dans les descriptions
  d’outils et les journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de bundle avec des noms sûrs pour le fournisseur sous la forme
`serverName__toolName`. Par exemple, un serveur avec la clé `"vigil-harbor"` exposant un
outil `memory_search` s’enregistre sous `vigil-harbor__memory_search`.

- les caractères hors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont plafonnés à 30 caractères
- les noms complets d’outils sont plafonnés à 64 caractères
- les noms de serveur vides retombent sur `mcp`
- les noms assainis en collision sont départagés par des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de garder les tours
  Pi répétés stables vis-à-vis du cache
- le filtrage de profil traite tous les outils d’un même serveur MCP de bundle comme détenus
  par le plugin `bundle-mcp`, de sorte que les listes d’autorisation et listes de refus de profil peuvent inclure soit
  des noms d’outils exposés individuels, soit la clé de plugin `bundle-mcp`

#### Paramètres Pi intégrés

- Claude `settings.json` est importé comme paramètres Pi intégrés par défaut lorsque le
  bundle est activé
- OpenClaw assainit les clés de remplacement shell avant de les appliquer

Clés assainies :

- `shellPath`
- `shellCommandPrefix`

#### LSP de Pi intégré

- les bundles Claude activés peuvent contribuer à la configuration du serveur LSP
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du bundle est fusionnée dans les valeurs par défaut effectives du LSP de Pi intégré
- seuls les serveurs LSP pris en charge reposant sur stdio peuvent être exécutés aujourd’hui ; les transports non pris en charge apparaissent toujours dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- Claude `agents`, automatisation `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- métadonnées Codex inline/app au-delà du signalement des capacités

## Formats de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skill et des
    répertoires de pack de hooks de style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** disposition Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement spécifique à Claude :

    - `commands/` est traité comme du contenu de Skill
    - `settings.json` est importé dans les paramètres Pi intégrés (les clés de remplacement shell sont assainies)
    - `.mcp.json` expose les outils stdio pris en charge à Pi intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP de Pi intégré
    - `hooks/hooks.json` est détecté mais non exécuté
    - les chemins de composants personnalisés du manifeste sont additifs (ils étendent les valeurs par défaut, sans les remplacer)

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
les packages à double format d’être partiellement installés comme bundles.

## Dépendances d’exécution et nettoyage

- Les dépendances d’exécution des plugins intégrés sont livrées dans le package OpenClaw sous
  `dist/*`. OpenClaw **n’exécute pas** `npm install` au démarrage pour les plugins
  intégrés ; le pipeline de publication est responsable de livrer une charge utile complète des
  dépendances intégrées (voir la règle de vérification postpublication dans
  [Releasing](/fr/reference/RELEASING)).

## Sécurité

Les bundles ont une frontière de confiance plus étroite que les plugins natifs :

- OpenClaw **ne charge pas** de modules d’exécution de bundle arbitraires en processus
- Les chemins des Skills et packs de hooks doivent rester à l’intérieur de la racine du plugin (contrôle des limites)
- Les fichiers de paramètres sont lus avec les mêmes contrôles de limites
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les bundles plus sûrs par défaut, mais vous devez tout de même traiter les
bundles tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le bundle est détecté mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non raccordée, il s’agit d’une limite du produit — pas d’une installation défectueuse.
  </Accordion>

  <Accordion title="Les fichiers de commande Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi intégrés issus de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de bundle comme des correctifs de configuration bruts.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est détecté uniquement. Si vous avez besoin de hooks exécutables, utilisez la
    disposition de pack de hooks OpenClaw ou livrez un plugin natif.
  </Accordion>
</AccordionGroup>

## Liens associés

- [Installer et configurer des plugins](/fr/tools/plugin)
- [Créer des plugins](/fr/plugins/building-plugins) — créer un plugin natif
- [Manifeste de plugin](/fr/plugins/manifest) — schéma de manifeste natif
