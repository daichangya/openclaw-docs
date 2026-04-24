---
read_when:
    - Vous voulez que les agents transforment des corrections ou des procédures réutilisables en Skills d’espace de travail
    - Vous configurez la mémoire procédurale des Skills
    - Vous déboguez le comportement de l’outil `skill_workshop`
    - Vous décidez s’il faut activer la création automatique de Skills
summary: Capture expérimentale de procédures réutilisables sous forme de Skills d’espace de travail avec revue, approbation, quarantaine et actualisation à chaud des Skills
title: Plugin d’atelier de Skills
x-i18n:
    generated_at: "2026-04-24T07:24:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop est **expérimental**. Il est désactivé par défaut, ses
heuristiques de capture et ses prompts de review peuvent changer entre les versions, et les écritures automatiques ne doivent être utilisées que dans des espaces de travail de confiance après avoir d’abord examiné la sortie en mode pending.

Skill Workshop est la mémoire procédurale des Skills d’espace de travail. Il permet à un agent de transformer
des workflows réutilisables, des corrections utilisateur, des correctifs durement acquis et des pièges récurrents
en fichiers `SKILL.md` sous :

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Ceci est différent de la mémoire long terme :

- **Memory** stocke les faits, préférences, entités et le contexte passé.
- **Skills** stockent des procédures réutilisables que l’agent doit suivre sur les tâches futures.
- **Skill Workshop** est le pont entre un tour utile et un Skill durable de l’espace de travail,
  avec vérifications de sécurité et approbation facultative.

Skill Workshop est utile lorsque l’agent apprend une procédure telle que :

- comment valider des ressources GIF animées provenant de sources externes
- comment remplacer des captures d’écran et vérifier les dimensions
- comment exécuter un scénario QA spécifique à un dépôt
- comment déboguer une panne récurrente de provider
- comment réparer une note de workflow local obsolète

Il n’est pas destiné à :

- des faits comme « l’utilisateur aime le bleu »
- une mémoire autobiographique large
- l’archivage brut de transcription
- les secrets, identifiants, ou texte de prompt caché
- des instructions ponctuelles qui ne se répéteront pas

## État par défaut

Le Plugin intégré est **expérimental** et **désactivé par défaut** à moins d’être
explicitement activé dans `plugins.entries.skill-workshop`.

Le manifeste du Plugin ne définit pas `enabledByDefault: true`. La valeur par défaut `enabled: true`
dans le schéma de configuration du Plugin ne s’applique qu’après la sélection et le chargement de l’entrée de Plugin.

Expérimental signifie :

- le Plugin est suffisamment pris en charge pour des tests opt-in et du dogfooding
- le stockage des propositions, les seuils de review et les heuristiques de capture peuvent évoluer
- l’approbation en attente est le mode de départ recommandé
- l’application automatique est destinée aux configurations personnelles/de confiance, et non aux environnements partagés ou exposés à des entrées lourdes et hostiles

## Activer

Configuration minimale sûre :

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Avec cette configuration :

- l’outil `skill_workshop` est disponible
- les corrections réutilisables explicites sont mises en file comme propositions en attente
- les passes de review basées sur des seuils peuvent proposer des mises à jour de Skills
- aucun fichier de Skill n’est écrit tant qu’une proposition en attente n’est pas appliquée

N’utilisez les écritures automatiques que dans des espaces de travail de confiance :

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` utilise toujours le même scanner et le même chemin de quarantaine. Il
n’applique pas les propositions avec résultats critiques.

## Configuration

| Clé                  | Par défaut   | Plage / valeurs                              | Signification                                                        |
| -------------------- | ------------ | -------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`       | booléen                                      | Active le Plugin après le chargement de l’entrée de Plugin.          |
| `autoCapture`        | `true`       | booléen                                      | Active la capture/review après tour sur les tours d’agent réussis.   |
| `approvalPolicy`     | `"pending"`  | `"pending"`, `"auto"`                        | Mettre les propositions en file ou écrire automatiquement les propositions sûres. |
| `reviewMode`         | `"hybrid"`   | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Choisit la capture de correction explicite, le reviewer LLM, les deux, ou aucun. |
| `reviewInterval`     | `15`         | `1..200`                                     | Exécuter le reviewer après ce nombre de tours réussis.               |
| `reviewMinToolCalls` | `8`          | `1..500`                                     | Exécuter le reviewer après ce nombre d’appels d’outils observés.     |
| `reviewTimeoutMs`    | `45000`      | `5000..180000`                               | Délai maximal pour l’exécution du reviewer intégré.                  |
| `maxPending`         | `50`         | `1..200`                                     | Nombre maximal de propositions pending/quarantined conservées par espace de travail. |
| `maxSkillBytes`      | `40000`      | `1024..200000`                               | Taille maximale d’un fichier de Skill/support généré.                |

Profils recommandés :

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Chemins de capture

Skill Workshop possède trois chemins de capture.

### Suggestions d’outil

Le modèle peut appeler directement `skill_workshop` lorsqu’il voit une procédure réutilisable
ou lorsque l’utilisateur lui demande de sauvegarder/mettre à jour un Skill.

C’est le chemin le plus explicite et il fonctionne même avec `autoCapture: false`.

### Capture heuristique

Lorsque `autoCapture` est activé et que `reviewMode` est `heuristic` ou `hybrid`, le
Plugin analyse les tours réussis à la recherche de phrases explicites de correction utilisateur :

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L’heuristique crée une proposition à partir de la dernière instruction utilisateur correspondante. Elle
utilise des indices de sujet pour choisir les noms de Skill pour les workflows courants :

- tâches GIF animées -> `animated-gif-workflow`
- tâches de capture d’écran ou de ressource -> `screenshot-asset-workflow`
- tâches QA ou de scénario -> `qa-scenario-workflow`
- tâches de PR GitHub -> `github-pr-workflow`
- repli -> `learned-workflows`

La capture heuristique est volontairement étroite. Elle sert aux corrections claires et aux notes de processus répétables, pas au résumé général de transcription.

### Reviewer LLM

Lorsque `autoCapture` est activé et que `reviewMode` est `llm` ou `hybrid`, le Plugin
exécute un reviewer intégré compact lorsque les seuils sont atteints.

Le reviewer reçoit :

- le texte de transcription récent, limité aux 12 000 derniers caractères
- jusqu’à 12 Skills d’espace de travail existants
- jusqu’à 2 000 caractères de chaque Skill existant
- des instructions JSON-only

Le reviewer n’a pas d’outils :

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Le reviewer renvoie soit `{ "action": "none" }`, soit une proposition. Le champ `action` vaut `create`, `append`, ou `replace` — préférez `append`/`replace` lorsqu’un Skill pertinent existe déjà ; utilisez `create` seulement lorsqu’aucun Skill existant ne convient.

Exemple `create` :

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` ajoute `section` + `body`. `replace` remplace `oldText` par `newText` dans le Skill nommé.

## Cycle de vie des propositions

Chaque mise à jour générée devient une proposition avec :

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` facultatif
- `sessionId` facultatif
- `skillName`
- `title`
- `reason`
- `source` : `tool`, `agent_end`, ou `reviewer`
- `status`
- `change`
- `scanFindings` facultatif
- `quarantineReason` facultatif

Statuts de proposition :

- `pending` - en attente d’approbation
- `applied` - écrit dans `<workspace>/skills`
- `rejected` - rejeté par l’opérateur/le modèle
- `quarantined` - bloqué par des résultats critiques du scanner

L’état est stocké par espace de travail sous le répertoire d’état du Gateway :

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Les propositions pending et quarantined sont dédupliquées par nom de Skill et par
charge utile de changement. Le magasin conserve les propositions pending/quarantined les plus récentes jusqu’à
`maxPending`.

## Référence de l’outil

Le Plugin enregistre un outil d’agent :

```text
skill_workshop
```

### `status`

Compte les propositions par état pour l’espace de travail actif.

```json
{ "action": "status" }
```

Forme du résultat :

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Liste les propositions pending.

```json
{ "action": "list_pending" }
```

Pour lister un autre état :

```json
{ "action": "list_pending", "status": "applied" }
```

Valeurs valides pour `status` :

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Liste les propositions mises en quarantaine.

```json
{ "action": "list_quarantine" }
```

Utilisez ceci lorsque la capture automatique semble ne rien faire et que les journaux mentionnent
`skill-workshop: quarantined <skill>`.

### `inspect`

Récupère une proposition par identifiant.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crée une proposition. Avec `approvalPolicy: "pending"` (par défaut), cela met en file au lieu d’écrire.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Forcer une écriture sûre (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Forcer pending sous une politique auto (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Ajouter à une section nommée">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Remplacer un texte exact">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Applique une proposition pending.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` refuse les propositions quarantined :

```text
quarantined proposal cannot be applied
```

### `reject`

Marque une proposition comme rejetée.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Écrit un fichier de support dans un répertoire de Skill existant ou proposé.

Répertoires de support de niveau supérieur autorisés :

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Exemple :

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Les fichiers de support sont limités à l’espace de travail, contrôlés au niveau du chemin, limités en octets par
`maxSkillBytes`, scannés, et écrits atomiquement.

## Écritures de Skills

Skill Workshop n’écrit que sous :

```text
<workspace>/skills/<normalized-skill-name>/
```

Les noms de Skill sont normalisés :

- en minuscules
- les séquences non `[a-z0-9_-]` deviennent `-`
- les caractères non alphanumériques de début/fin sont supprimés
- la longueur maximale est de 80 caractères
- le nom final doit correspondre à `[a-z0-9][a-z0-9_-]{1,79}`

Pour `create` :

- si le Skill n’existe pas, Skill Workshop écrit un nouveau `SKILL.md`
- s’il existe déjà, Skill Workshop ajoute le corps à `## Workflow`

Pour `append` :

- si le Skill existe, Skill Workshop ajoute à la section demandée
- s’il n’existe pas, Skill Workshop crée un Skill minimal puis ajoute

Pour `replace` :

- le Skill doit déjà exister
- `oldText` doit être présent exactement
- seule la première correspondance exacte est remplacée

Toutes les écritures sont atomiques et actualisent immédiatement l’instantané en mémoire des Skills, de sorte que le nouveau Skill ou le Skill mis à jour puisse devenir visible sans redémarrage du Gateway.

## Modèle de sécurité

Skill Workshop possède un scanner de sécurité sur le contenu généré de `SKILL.md` et les fichiers de support.

Les résultats critiques mettent les propositions en quarantaine :

| Rule id                                | Bloque le contenu qui...                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dit à l’agent d’ignorer des instructions antérieures/de niveau supérieur |
| `prompt-injection-system`              | fait référence aux prompts système, messages développeur ou instructions cachées |
| `prompt-injection-tool`                | encourage le contournement des permissions/approbations d’outils        |
| `shell-pipe-to-shell`                  | inclut `curl`/`wget` redirigé vers `sh`, `bash` ou `zsh`                |
| `secret-exfiltration`                  | semble envoyer des données env/process env sur le réseau                |

Les résultats warn sont conservés mais ne bloquent pas à eux seuls :

| Rule id              | Avertit sur...                     |
| -------------------- | ---------------------------------- |
| `destructive-delete` | commandes larges de type `rm -rf`  |
| `unsafe-permissions` | usage de permissions de type `chmod 777` |

Les propositions quarantined :

- conservent `scanFindings`
- conservent `quarantineReason`
- apparaissent dans `list_quarantine`
- ne peuvent pas être appliquées via `apply`

Pour récupérer une proposition mise en quarantaine, créez une nouvelle proposition sûre dont le contenu dangereux a été supprimé. N’éditez pas le JSON du magasin à la main.

## Consignes de prompt

Lorsqu’il est activé, Skill Workshop injecte une courte section de prompt indiquant à l’agent
d’utiliser `skill_workshop` pour la mémoire procédurale durable.

Les consignes mettent l’accent sur :

- les procédures, pas les faits/préférences
- les corrections utilisateur
- les procédures non évidentes mais réussies
- les pièges récurrents
- la réparation des Skills obsolètes/minces/incorrects via append/replace
- la sauvegarde d’une procédure réutilisable après de longues boucles d’outils ou des correctifs difficiles
- un texte de Skill court et impératif
- pas de dumps de transcription

Le texte du mode d’écriture change avec `approvalPolicy` :

- mode pending : mettre les suggestions en file ; appliquer uniquement après approbation explicite
- mode auto : appliquer les mises à jour sûres de Skills d’espace de travail lorsqu’elles sont clairement réutilisables

## Coûts et comportement à l’exécution

La capture heuristique n’appelle pas de modèle.

La review LLM utilise une exécution intégrée sur le modèle actif/par défaut de l’agent. Elle
est basée sur des seuils, donc elle ne s’exécute pas sur chaque tour par défaut.

Le reviewer :

- utilise le même contexte provider/modèle configuré lorsqu’il est disponible
- revient aux valeurs par défaut de l’agent à l’exécution
- utilise `reviewTimeoutMs`
- utilise un contexte bootstrap léger
- n’a pas d’outils
- n’écrit rien directement
- ne peut émettre qu’une proposition qui passe ensuite par le scanner normal et
  le chemin d’approbation/quarantaine

Si le reviewer échoue, expire, ou renvoie un JSON invalide, le Plugin journalise un
message warning/debug et ignore cette passe de review.

## Modèles d’exploitation

Utilisez Skill Workshop lorsque l’utilisateur dit :

- « la prochaine fois, fais X »
- « à partir de maintenant, préfère Y »
- « assure-toi de vérifier Z »
- « sauvegarde ceci comme workflow »
- « ça a pris du temps ; retiens le processus »
- « mets à jour le Skill local pour cela »

Bon texte de Skill :

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Mauvais texte de Skill :

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Raisons pour lesquelles cette mauvaise version ne doit pas être sauvegardée :

- forme de transcription
- pas impératif
- inclut des détails ponctuels bruyants
- ne dit pas au prochain agent quoi faire

## Débogage

Vérifiez si le Plugin est chargé :

```bash
openclaw plugins list --enabled
```

Vérifiez le nombre de propositions depuis un contexte agent/outil :

```json
{ "action": "status" }
```

Inspectez les propositions pending :

```json
{ "action": "list_pending" }
```

Inspectez les propositions quarantined :

```json
{ "action": "list_quarantine" }
```

Symptômes courants :

| Symptôme                              | Cause probable                                                                      | Vérification                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| L’outil est indisponible              | L’entrée de Plugin n’est pas activée                                                | `plugins.entries.skill-workshop.enabled` et `openclaw plugins list`   |
| Aucune proposition automatique n’apparaît | `autoCapture: false`, `reviewMode: "off"`, ou seuils non atteints                | Configuration, statut des propositions, journaux du Gateway           |
| L’heuristique n’a pas capturé         | La formulation utilisateur ne correspondait pas aux motifs de correction            | Utilisez `skill_workshop.suggest` explicite ou activez le reviewer LLM |
| Le reviewer n’a pas créé de proposition | Le reviewer a renvoyé `none`, un JSON invalide, ou a expiré                       | Journaux du Gateway, `reviewTimeoutMs`, seuils                        |
| La proposition n’est pas appliquée    | `approvalPolicy: "pending"`                                                         | `list_pending`, puis `apply`                                          |
| La proposition a disparu de pending   | Proposition dupliquée réutilisée, élagage max pending, ou appliquée/rejetée/quarantined | `status`, `list_pending` avec filtres d’état, `list_quarantine`    |
| Le fichier de Skill existe mais le modèle le manque | L’instantané du Skill n’a pas été actualisé ou le filtrage de Skill l’exclut | `openclaw skills` status et éligibilité des Skills de l’espace de travail |

Journaux pertinents :

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scénarios QA

Scénarios QA adossés au dépôt :

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Exécutez la couverture déterministe :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Exécutez la couverture reviewer :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Le scénario reviewer est volontairement séparé car il active
`reviewMode: "llm"` et exerce la passe de review intégrée.

## Quand ne pas activer l’application automatique

Évitez `approvalPolicy: "auto"` lorsque :

- l’espace de travail contient des procédures sensibles
- l’agent travaille sur des entrées non fiables
- les Skills sont partagés au sein d’une large équipe
- vous êtes encore en train d’ajuster les prompts ou les règles du scanner
- le modèle traite fréquemment du contenu web/e-mail hostile

Utilisez d’abord le mode pending. Ne passez au mode auto qu’après avoir examiné le type de
Skills que l’agent propose dans cet espace de travail.

## Documentation associée

- [Skills](/fr/tools/skills)
- [Plugins](/fr/tools/plugin)
- [Testing](/fr/reference/test)
