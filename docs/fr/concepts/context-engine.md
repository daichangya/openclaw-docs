---
read_when:
    - Vous voulez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous passez du moteur hérité à un moteur de plugin, ou inversement
    - Vous créez un plugin de moteur de contexte
summary: 'Moteur de contexte : assemblage de contexte enfichable, compaction et cycle de vie des sous-agents'
title: Context Engine
x-i18n:
    generated_at: "2026-04-05T12:39:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Context Engine

Un **moteur de contexte** contrôle la façon dont OpenClaw construit le contexte du modèle pour chaque exécution.
Il décide quels messages inclure, comment résumer l’historique plus ancien et comment
gérer le contexte entre les limites des sous-agents.

OpenClaw est livré avec un moteur intégré `legacy`. Les plugins peuvent enregistrer
des moteurs alternatifs qui remplacent le cycle de vie actif du moteur de contexte.

## Démarrage rapide

Vérifiez quel moteur est actif :

```bash
openclaw doctor
# ou inspectez directement la configuration :
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installer un plugin de moteur de contexte

Les plugins de moteur de contexte s’installent comme n’importe quel autre plugin OpenClaw. Installez-le
d’abord, puis sélectionnez le moteur dans le slot :

```bash
# Installer depuis npm
openclaw plugins install @martian-engineering/lossless-claw

# Ou installer depuis un chemin local (pour le développement)
openclaw plugins install -l ./my-context-engine
```

Ensuite, activez le plugin et sélectionnez-le comme moteur actif dans votre configuration :

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // doit correspondre à l’id de moteur enregistré du plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // La configuration spécifique au plugin va ici (voir la documentation du plugin)
      },
    },
  },
}
```

Redémarrez la gateway après l’installation et la configuration.

Pour revenir au moteur intégré, définissez `contextEngine` sur `"legacy"` (ou
supprimez complètement la clé — `"legacy"` est la valeur par défaut).

## Fonctionnement

Chaque fois qu’OpenClaw exécute un prompt de modèle, le moteur de contexte participe à
quatre points du cycle de vie :

1. **Ingest** — appelé lorsqu’un nouveau message est ajouté à la session. Le moteur
   peut stocker ou indexer le message dans son propre magasin de données.
2. **Assemble** — appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble
   ordonné de messages (et éventuellement un `systemPromptAddition`) qui tiennent dans
   le budget de jetons.
3. **Compact** — appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute
   `/compact`. Le moteur résume l’historique plus ancien pour libérer de l’espace.
4. **After turn** — appelé une fois l’exécution terminée. Le moteur peut conserver l’état,
   déclencher une compaction en arrière-plan ou mettre à jour les index.

### Cycle de vie du sous-agent (facultatif)

OpenClaw appelle actuellement un hook de cycle de vie de sous-agent :

- **onSubagentEnded** — nettoyage lorsqu’une session de sous-agent se termine ou est purgée.

Le hook `prepareSubagentSpawn` fait partie de l’interface pour une utilisation future, mais
le runtime ne l’invoque pas encore.

### Ajout au prompt système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw
la préfixe au prompt système de l’exécution. Cela permet aux moteurs d’injecter
des consignes de rappel dynamiques, des instructions de récupération ou des indices
tenant compte du contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur hérité

Le moteur intégré `legacy` préserve le comportement d’origine d’OpenClaw :

- **Ingest** : no-op (le gestionnaire de session gère directement la persistance des messages).
- **Assemble** : passage direct (le pipeline existant sanitize → validate → limit
  dans le runtime gère l’assemblage du contexte).
- **Compact** : délègue à la compaction intégrée par résumé, qui crée
  un résumé unique des anciens messages et conserve les messages récents intacts.
- **After turn** : no-op.

Le moteur hérité n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsqu’aucun `plugins.slots.contextEngine` n’est défini (ou qu’il est défini sur `"legacy"`), ce
moteur est utilisé automatiquement.

## Moteurs de plugin

Un plugin peut enregistrer un moteur de contexte à l’aide de l’API des plugins :

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Ensuite, activez-le dans la configuration :

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### L’interface ContextEngine

Membres requis :

| Membre             | Type     | Rôle                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriété | ID du moteur, nom, version et indication s’il gère la compaction |
| `ingest(params)`   | Méthode  | Stocker un message unique                                |
| `assemble(params)` | Méthode  | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode  | Résumer/réduire le contexte                              |

`assemble` renvoie un `AssembleResult` avec :

- `messages` — les messages ordonnés à envoyer au modèle.
- `estimatedTokens` (requis, `number`) — l’estimation par le moteur du total
  de jetons dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil
  de compaction et les rapports de diagnostic.
- `systemPromptAddition` (facultatif, `string`) — préfixé au prompt système.

Membres facultatifs :

| Membre                         | Type   | Rôle                                                                                                           |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par ex. importer l’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé comme lot. Appelé après la fin d’une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie après exécution (persister l’état, déclencher une compaction en arrière-plan).       |
| `prepareSubagentSpawn(params)` | Méthode | Préparer un état partagé pour une session enfant.                                                             |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent.                                                                        |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé lors de l’arrêt de la gateway ou du rechargement du plugin — pas par session. |

### ownsCompaction

`ownsCompaction` contrôle si l’auto-compaction intégrée de Pi pendant la tentative reste
activée pour l’exécution :

- `true` — le moteur possède le comportement de compaction. OpenClaw désactive l’auto-compaction intégrée de Pi
  pour cette exécution, et l’implémentation `compact()` du moteur est
  responsable de `/compact`, de la compaction de récupération en cas de dépassement, et de toute compaction
  proactive qu’il souhaite effectuer dans `afterTurn()`.
- `false` ou non défini — l’auto-compaction intégrée de Pi peut toujours s’exécuter pendant
  l’exécution du prompt, mais la méthode `compact()` du moteur actif est toujours appelée pour
  `/compact` et la récupération en cas de dépassement.

`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement
au chemin de compaction du moteur hérité.

Cela signifie qu’il existe deux modèles de plugin valides :

- **Mode propriétaire** — implémentez votre propre algorithme de compaction et définissez
  `ownsCompaction: true`.
- **Mode délégation** — définissez `ownsCompaction: false` et faites en sorte que `compact()` appelle
  `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser
  le comportement de compaction intégré d’OpenClaw.

Un `compact()` no-op n’est pas sûr pour un moteur actif non propriétaire, car il
désactive le chemin normal de compaction `/compact` et de récupération en cas de dépassement pour ce
slot de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Sélectionne le moteur de contexte actif. Par défaut : "legacy".
      // Définissez-le sur un id de plugin pour utiliser un moteur de plugin.
      contextEngine: "legacy",
    },
  },
}
```

Le slot est exclusif à l’exécution — un seul moteur de contexte enregistré est
résolu pour une exécution donnée ou une opération de compaction. D’autres plugins activés
`kind: "context-engine"` peuvent toujours se charger et exécuter leur code
d’enregistrement ; `plugins.slots.contextEngine` ne fait que sélectionner quel id de moteur enregistré
OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.

## Relation avec la compaction et la mémoire

- **La compaction** est une responsabilité du moteur de contexte. Le moteur hérité
  délègue au résumé intégré d’OpenClaw. Les moteurs de plugin peuvent implémenter
  n’importe quelle stratégie de compaction (résumés DAG, récupération vectorielle, etc.).
- **Les plugins de mémoire** (`plugins.slots.memory`) sont distincts des moteurs de contexte.
  Les plugins de mémoire fournissent la recherche/la récupération ; les moteurs de contexte contrôlent ce que le
  modèle voit. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser les données
  d’un plugin de mémoire pendant l’assemblage.
- **L’élagage de session** (suppression des anciens résultats d’outils en mémoire) continue de s’exécuter
  quel que soit le moteur de contexte actif.

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel.
  Le nouveau moteur prend le relais pour les futures exécutions.
- Les erreurs du moteur sont journalisées et remontées dans les diagnostics. Si un moteur de plugin
  échoue à s’enregistrer ou si l’id du moteur sélectionné ne peut pas être résolu, OpenClaw
  ne revient pas automatiquement en arrière ; les exécutions échouent tant que vous ne corrigez pas le plugin ou
  ne redéfinissez pas `plugins.slots.contextEngine` sur `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un
  répertoire de plugin local sans le copier.

Voir aussi : [Compaction](/concepts/compaction), [Context](/concepts/context),
[Plugins](/tools/plugin), [Manifeste de plugin](/plugins/manifest).

## Lié

- [Context](/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture des plugins](/plugins/architecture) — enregistrement des plugins de moteur de contexte
- [Compaction](/concepts/compaction) — résumé des longues conversations
