---
read_when:
    - Vous souhaitez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre le moteur hérité et un moteur Plugin
    - Vous créez un Plugin de moteur de contexte
summary: 'Moteur de contexte : assemblage de contexte enfichable, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-04-24T07:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution :
quels messages inclure, comment résumer l’historique plus ancien et comment gérer
le contexte aux frontières des sous-agents.

OpenClaw est livré avec un moteur intégré `legacy` et l’utilise par défaut — la plupart des
utilisateurs n’ont jamais besoin de le changer. Installez et sélectionnez un moteur Plugin uniquement lorsque
vous voulez un comportement différent d’assemblage, de Compaction ou de rappel inter-session.

## Démarrage rapide

Vérifiez quel moteur est actif :

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installation d’un Plugin de moteur de contexte

Les Plugins de moteur de contexte s’installent comme n’importe quel autre Plugin OpenClaw. Installez-le
d’abord, puis sélectionnez le moteur dans l’emplacement :

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Ensuite, activez le Plugin et sélectionnez-le comme moteur actif dans votre configuration :

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

Redémarrez le Gateway après l’installation et la configuration.

Pour revenir au moteur intégré, définissez `contextEngine` sur `"legacy"` (ou
supprimez entièrement la clé — `"legacy"` est la valeur par défaut).

## Fonctionnement

Chaque fois qu’OpenClaw exécute un prompt de modèle, le moteur de contexte intervient à
quatre points du cycle de vie :

1. **Ingest** — appelé lorsqu’un nouveau message est ajouté à la session. Le moteur
   peut stocker ou indexer le message dans son propre magasin de données.
2. **Assemble** — appelé avant chaque exécution de modèle. Le moteur renvoie un ensemble
   ordonné de messages (et un `systemPromptAddition` facultatif) qui tiennent dans
   le budget de jetons.
3. **Compact** — appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute
   `/compact`. Le moteur résume l’historique plus ancien pour libérer de l’espace.
4. **After turn** — appelé une fois l’exécution terminée. Le moteur peut conserver l’état,
   déclencher une Compaction en arrière-plan ou mettre à jour des index.

Pour le harnais Codex non-ACP groupé, OpenClaw applique le même cycle de vie en
projetant le contexte assemblé dans les instructions développeur Codex et le prompt du
tour courant. Codex conserve toutefois son historique de fil natif et son compacteur natif.

### Cycle de vie du sous-agent (facultatif)

OpenClaw appelle deux hooks facultatifs de cycle de vie de sous-agent :

- **prepareSubagentSpawn** — prépare un état de contexte partagé avant le démarrage
  d’une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode`
  (`isolated` ou `fork`), les identifiants/fichiers de transcription disponibles et un TTL facultatif.
  S’il renvoie un handle d’annulation, OpenClaw l’appelle lorsque le démarrage échoue après
  une préparation réussie.
- **onSubagentEnded** — nettoie lorsque la session d’un sous-agent se termine ou est balayée.

### Ajout au prompt système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw
l’ajoute au début du prompt système pour l’exécution. Cela permet aux moteurs d’injecter
des indications dynamiques de rappel, des instructions de récupération ou des indices
sensibles au contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur hérité

Le moteur intégré `legacy` préserve le comportement d’origine d’OpenClaw :

- **Ingest** : no-op (le gestionnaire de session gère directement la conservation des messages).
- **Assemble** : passage direct (le pipeline existant sanitize → validate → limit
  dans l’exécution gère l’assemblage du contexte).
- **Compact** : délègue à la Compaction intégrée par résumé, qui crée
  un seul résumé des anciens messages et conserve intacts les messages récents.
- **After turn** : no-op.

Le moteur hérité n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsque `plugins.slots.contextEngine` n’est pas défini (ou vaut `"legacy"`), ce
moteur est utilisé automatiquement.

## Moteurs Plugin

Un Plugin peut enregistrer un moteur de contexte via l’API Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

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

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Ensuite, activez-le dans la configuration :

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

Membres requis :

| Membre             | Type     | Rôle                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriété | Identifiant, nom, version du moteur et s’il possède la Compaction |
| `ingest(params)`   | Méthode   | Stocker un seul message                                  |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                              |

`assemble` renvoie un `AssembleResult` avec :

- `messages` — les messages ordonnés à envoyer au modèle.
- `estimatedTokens` (obligatoire, `number`) — l’estimation par le moteur du nombre total
  de jetons dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil de Compaction
  et les rapports de diagnostic.
- `systemPromptAddition` (facultatif, `string`) — ajouté au début du prompt système.

Membres facultatifs :

| Membre                         | Type   | Rôle                                                                                                            |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelée une fois lorsque le moteur voit une session pour la première fois (par ex. importer l’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé sous forme de lot. Appelée après la fin d’une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie après exécution (conserver l’état, déclencher une Compaction en arrière-plan).        |
| `prepareSubagentSpawn(params)` | Méthode | Mettre en place un état partagé pour une session enfant avant son démarrage.                                   |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent.                                                                         |
| `dispose()`                    | Méthode | Libérer les ressources. Appelée pendant l’arrêt du Gateway ou le rechargement du Plugin — pas par session.    |

### ownsCompaction

`ownsCompaction` contrôle si l’auto-Compaction intégrée à Pi pendant la tentative reste
activée pour l’exécution :

- `true` — le moteur possède le comportement de Compaction. OpenClaw désactive l’auto-Compaction intégrée de Pi
  pour cette exécution, et l’implémentation `compact()` du moteur devient
  responsable de `/compact`, de la Compaction de récupération après dépassement et de toute
  Compaction proactive qu’il souhaite effectuer dans `afterTurn()`.
- `false` ou non défini — l’auto-Compaction intégrée de Pi peut encore s’exécuter pendant l’exécution du prompt,
  mais la méthode `compact()` du moteur actif est toujours appelée pour
  `/compact` et la récupération après dépassement.

`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au
chemin de Compaction du moteur hérité.

Cela signifie qu’il existe deux modèles de Plugin valides :

- **Mode propriétaire** — implémentez votre propre algorithme de Compaction et définissez
  `ownsCompaction: true`.
- **Mode délégation** — définissez `ownsCompaction: false` et faites appeler `compact()`
  `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser
  le comportement de Compaction intégré d’OpenClaw.

Un `compact()` no-op n’est pas sûr pour un moteur actif non propriétaire, car il
désactive le chemin normal de `/compact` et de récupération après dépassement pour ce
slot de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

Le slot est exclusif à l’exécution — un seul moteur de contexte enregistré est
résolu pour une exécution ou une opération de Compaction donnée. Les autres
Plugins `kind: "context-engine"` activés peuvent toujours se charger et exécuter leur code
d’enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement quel identifiant de moteur enregistré
OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.

## Relation avec la Compaction et la mémoire

- **Compaction** est l’une des responsabilités du moteur de contexte. Le moteur hérité
  délègue au résumé intégré d’OpenClaw. Les moteurs Plugin peuvent implémenter
  n’importe quelle stratégie de Compaction (résumés DAG, récupération vectorielle, etc.).
- **Les Plugins de mémoire** (`plugins.slots.memory`) sont distincts des moteurs de contexte.
  Les Plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que le
  modèle voit. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser des données d’un
  Plugin de mémoire pendant l’assemblage. Les moteurs Plugin qui veulent le chemin
  de prompt de mémoire active doivent préférer `buildMemorySystemPromptAddition(...)` depuis
  `openclaw/plugin-sdk/core`, qui convertit les sections actives du prompt mémoire
  en un `systemPromptAddition` prêt à être ajouté au début. Si un moteur a besoin d’un contrôle de plus bas niveau,
  il peut toujours extraire les lignes brutes depuis
  `openclaw/plugin-sdk/memory-host-core` via
  `buildActiveMemoryPromptSection(...)`.
- **L’élagage de session** (suppression des anciens résultats d’outils en mémoire) continue de s’exécuter
  quel que soit le moteur de contexte actif.

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel.
  Le nouveau moteur prend le relais pour les exécutions futures.
- Les erreurs de moteur sont journalisées et remontées dans les diagnostics. Si un moteur Plugin
  ne parvient pas à s’enregistrer ou si l’identifiant de moteur sélectionné ne peut pas être résolu, OpenClaw
  ne revient pas automatiquement en arrière ; les exécutions échouent jusqu’à ce que vous corrigiez le Plugin ou
  que vous remettiez `plugins.slots.contextEngine` sur `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un
  répertoire Plugin local sans le copier.

Voir aussi : [Compaction](/fr/concepts/compaction), [Contexte](/fr/concepts/context),
[Plugins](/fr/tools/plugin), [Manifeste Plugin](/fr/plugins/manifest).

## Voir aussi

- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture Plugin](/fr/plugins/architecture) — enregistrement des Plugins de moteur de contexte
- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
