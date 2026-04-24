---
read_when:
    - Vous souhaitez installer un bundle compatible Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw mappe le contenu d’un bundle vers des fonctionnalités natives
    - Vous déboguez la détection de bundle ou des capacités manquantes
summary: Installer et utiliser les bundles Codex, Claude et Cursor comme plugins OpenClaw
title: Bundles de plugins
x-i18n:
    generated_at: "2026-04-24T07:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw peut installer des plugins provenant de trois écosystèmes externes : **Codex**, **Claude**,
et **Cursor**. Ceux-ci sont appelés **bundles** — des packs de contenu et de métadonnées que
OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les bundles ne sont **pas** la même chose que les plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des packs de contenu avec
  un mappage sélectif de fonctionnalités et une frontière de confiance plus étroite.
</Info>

## Pourquoi les bundles existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’exiger que les auteurs les réécrivent comme plugins OpenClaw natifs, OpenClaw
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

Toutes les fonctionnalités d’un bundle ne s’exécutent pas aujourd’hui dans OpenClaw. Voici ce qui fonctionne et ce qui
est détecté mais pas encore raccordé.

### Pris en charge actuellement

| Fonctionnalité | Comment elle est mappée                                                                  | S’applique à    |
| -------------- | ---------------------------------------------------------------------------------------- | --------------- |
| Contenu de Skills | Les racines de Skills du bundle se chargent comme des Skills OpenClaw normales       | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` sont traités comme des racines de Skills              | Claude, Cursor  |
| Packs de hooks | Dispositions de type OpenClaw `HOOK.md` + `handler.ts`                                   | Codex           |
| Outils MCP     | La configuration MCP du bundle est fusionnée dans les paramètres de Pi intégré ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats |
| Serveurs LSP   | Le `.lsp.json` Claude et les `lspServers` déclarés dans le manifeste sont fusionnés dans les valeurs par défaut LSP de Pi intégré | Claude          |
| Paramètres     | Le `settings.json` Claude est importé comme valeurs par défaut de Pi intégré             | Claude          |

#### Contenu de Skills

- les racines de Skills du bundle se chargent comme des racines de Skills OpenClaw normales
- les racines Claude `commands` sont traitées comme des racines de Skills supplémentaires
- les racines Cursor `.cursor/commands` sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commande markdown Claude fonctionnent via le chargeur normal de Skills OpenClaw.
Les commandes markdown Cursor fonctionnent via le même chemin.

#### Packs de hooks

- les racines de hooks de bundle ne fonctionnent **que** lorsqu’elles utilisent la disposition
  normale de pack de hooks OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les bundles activés peuvent contribuer une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres effectifs de Pi intégré sous
  `mcpServers`
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours d’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent par défaut les outils MCP de bundle ;
  utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou un gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du bundle, de sorte que les
  paramètres d’espace de travail peuvent remplacer les entrées MCP du bundle si nécessaire
- les catalogues d’outils MCP de bundle sont triés de manière déterministe avant l’enregistrement, de sorte que
  les changements en amont dans l’ordre `listTools()` ne perturbent pas les blocs d’outils du cache de prompt

##### Transports

Les serveurs MCP peuvent utiliser stdio ou le transport HTTP :

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

**HTTP** se connecte à un serveur MCP en cours d’exécution via `sse` par défaut, ou `streamable-http` sur demande :

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
- les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur contenant à la fois `command` et `url` est rejetée
- les identifiants dans l’URL (userinfo et paramètres de requête) sont masqués dans les descriptions
  d’outils et les journaux
- `connectionTimeoutMs` remplace le délai d’attente de connexion par défaut de 30 secondes pour
  les transports stdio comme HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de bundle avec des noms sûrs pour le fournisseur, sous la forme
`serverName__toolName`. Par exemple, un serveur dont la clé est `"vigil-harbor"` exposant un
outil `memory_search` est enregistré sous `vigil-harbor__memory_search`.

- les caractères en dehors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont limités à 30 caractères
- les noms complets d’outil sont limités à 64 caractères
- les noms de serveur vides reviennent à `mcp`
- les noms nettoyés en collision sont désambiguïsés avec des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de garder les tours Pi
  répétés stables pour le cache
- le filtrage par profil traite tous les outils provenant d’un serveur MCP de bundle comme appartenant au plugin
  `bundle-mcp`, de sorte que les listes d’autorisation et de refus de profil peuvent inclure soit
  des noms d’outil exposés individuels, soit la clé de plugin `bundle-mcp`

#### Paramètres Pi intégré

- le `settings.json` Claude est importé comme paramètres par défaut de Pi intégré lorsque le
  bundle est activé
- OpenClaw nettoie les clés de remplacement shell avant application

Clés nettoyées :

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi intégré

- les bundles Claude activés peuvent contribuer une configuration de serveur LSP
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du bundle est fusionnée dans les valeurs par défaut effectives LSP de Pi intégré
- seuls les serveurs LSP adossés à stdio pris en charge sont exécutables aujourd’hui ; les
  transports non pris en charge apparaissent tout de même dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- Claude `agents`, automatisation `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Métadonnées inline/app Codex au-delà du rapport de capacités

## Formats de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des
    répertoires de packs de hooks de type OpenClaw
    (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** disposition Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement spécifique à Claude :

    - `commands/` est traité comme du contenu de Skills
    - `settings.json` est importé dans les paramètres Pi intégré (les clés de remplacement shell sont nettoyées)
    - `.mcp.json` expose les outils stdio pris en charge à Pi intégré
    - `.lsp.json` plus les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP de Pi intégré
    - `hooks/hooks.json` est détecté mais non exécuté
    - Les chemins de composants personnalisés du manifeste sont additifs (ils étendent les valeurs par défaut, ils ne les remplacent pas)

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de Skills
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw vérifie d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **plugin natif**
2. Marqueurs de bundle (`.codex-plugin/`, `.claude-plugin/`, ou disposition Claude/Cursor par défaut) — traité comme **bundle**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela empêche
que des paquets à double format soient partiellement installés comme bundles.

## Dépendances runtime et nettoyage

- Les dépendances runtime des plugins intégrés sont livrées dans le paquet OpenClaw sous
  `dist/*`. OpenClaw n’exécute **pas** `npm install` au démarrage pour les plugins intégrés ;
  le pipeline de publication est responsable de livrer une charge utile complète de dépendances
  intégrées (voir la règle de vérification postpublish dans
  [Releasing](/fr/reference/RELEASING)).

## Sécurité

Les bundles ont une frontière de confiance plus étroite que les plugins natifs :

- OpenClaw ne charge **pas** arbitrairement les modules runtime de bundle dans le processus
- Les chemins de Skills et de packs de hooks doivent rester à l’intérieur de la racine du plugin (contrôle de frontière)
- Les fichiers de paramètres sont lus avec les mêmes contrôles de frontière
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les bundles plus sûrs par défaut, mais vous devez tout de même traiter les
bundles tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le bundle est détecté mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non raccordée, il s’agit d’une limite produit — pas d’une installation cassée.
  </Accordion>

  <Accordion title="Les fichiers de commande Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi intégré issus de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de bundle comme des patches bruts de configuration.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est uniquement détecté. Si vous avez besoin de hooks exécutables, utilisez la
    disposition de pack de hooks OpenClaw ou fournissez un plugin natif.
  </Accordion>
</AccordionGroup>

## Associé

- [Installer et configurer des plugins](/fr/tools/plugin)
- [Créer des plugins](/fr/plugins/building-plugins) — créer un plugin natif
- [Manifeste de plugin](/fr/plugins/manifest) — schéma de manifeste natif
