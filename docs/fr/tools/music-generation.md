---
read_when:
    - Génération de musique ou d’audio via l’agent
    - Configuration des providers et modèles de génération musicale
    - Comprendre les paramètres de l’outil `music_generate`
summary: Générer de la musique avec des providers partagés, y compris des Plugins adossés à des workflows
title: Génération de musique
x-i18n:
    generated_at: "2026-04-24T07:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec des providers configurés tels que Google,
MiniMax, et ComfyUI configuré par workflow.

Pour les sessions d’agent adossées à des providers partagés, OpenClaw démarre la génération musicale comme une
tâche d’arrière-plan, la suit dans le registre des tâches, puis réveille à nouveau l’agent lorsque
la piste est prête afin que l’agent puisse republier l’audio final dans le canal
d’origine.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un provider de génération musicale est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent, configurez `agents.defaults.musicGenerationModel` ou définissez une clé API provider.
</Note>

## Démarrage rapide

### Génération adossée à des providers partagés

1. Définissez une clé API pour au moins un provider, par exemple `GEMINI_API_KEY` ou
   `MINIMAX_API_KEY`.
2. Définissez éventuellement votre modèle préféré :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Demandez à l’agent : _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

L’agent appelle automatiquement `music_generate`. Aucune liste d’autorisation d’outil n’est nécessaire.

Pour les contextes synchrones directs sans exécution d’agent adossée à une session, l’outil intégré
revient quand même à une génération inline et renvoie le chemin final du média dans
le résultat de l’outil.

Exemples de prompts :

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Génération Comfy pilotée par workflow

Le Plugin intégré `comfy` s’intègre à l’outil partagé `music_generate` via
le registre des providers de génération musicale.

1. Configurez `models.providers.comfy.music` avec un JSON de workflow et
   des nœuds de prompt/sortie.
2. Si vous utilisez Comfy Cloud, définissez `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Demandez de la musique à l’agent ou appelez l’outil directement.

Exemple :

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Prise en charge partagée des providers intégrés

| Provider | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                  | Clé API                                |
| -------- | ---------------------- | -------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Jusqu’à 1 image      | Musique ou audio définis par workflow                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Jusqu’à 10 images    | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | Aucune               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matrice de capacités déclarées

Il s’agit du contrat de mode explicite utilisé par `music_generate`, les tests de contrat,
et le balayage live partagé.

| Provider | `generate` | `edit` | Limite d’édition | Voies live partagées                                                        |
| -------- | ---------- | ------ | ---------------- | --------------------------------------------------------------------------- |
| ComfyUI  | Yes        | Yes    | 1 image          | Pas dans le balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
| Google   | Yes        | Yes    | 10 images        | `generate`, `edit`                                                          |
| MiniMax  | Yes        | No     | None             | `generate`                                                                  |

Utilisez `action: "list"` pour inspecter les providers et modèles partagés disponibles
à l’exécution :

```text
/tool music_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session :

```text
/tool music_generate action=status
```

Exemple de génération directe :

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Paramètres de l’outil intégré

| Paramètre         | Type     | Description                                                                                     |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de génération musicale (requis pour `action: "generate"`)                               |
| `action`          | string   | `"generate"` (par défaut), `"status"` pour la tâche de session courante, ou `"list"` pour inspecter les providers |
| `model`           | string   | Remplacement provider/modèle, par ex. `google/lyria-3-pro-preview` ou `comfy/workflow`         |
| `lyrics`          | string   | Paroles facultatives lorsque le provider prend en charge une entrée explicite de paroles       |
| `instrumental`    | boolean  | Demande une sortie instrumentale uniquement lorsque le provider le prend en charge             |
| `image`           | string   | Chemin ou URL d’une image de référence unique                                                   |
| `images`          | string[] | Plusieurs images de référence (jusqu’à 10)                                                      |
| `durationSeconds` | number   | Durée cible en secondes lorsque le provider prend en charge les indications de durée           |
| `timeoutMs`       | number   | Délai d’attente facultatif de requête provider en millisecondes                                 |
| `format`          | string   | Indication de format de sortie (`mp3` ou `wav`) lorsque le provider le prend en charge         |
| `filename`        | string   | Indication de nom de fichier de sortie                                                          |

Tous les providers ne prennent pas en charge tous les paramètres. OpenClaw valide quand même les limites strictes
telles que le nombre d’entrées avant soumission. Lorsqu’un provider prend en charge la durée mais
utilise un maximum plus court que la valeur demandée, OpenClaw la borne automatiquement
à la durée prise en charge la plus proche. Les indications facultatives réellement non prises en charge sont ignorées
avec un avertissement lorsque le provider ou le modèle sélectionné ne peut pas les honorer.

Les résultats de l’outil signalent les paramètres appliqués. Lorsque OpenClaw borne la durée pendant le repli provider, la valeur renvoyée dans `durationSeconds` reflète la valeur soumise et `details.normalization.durationSeconds` montre le mapping entre valeur demandée et valeur appliquée.

## Comportement asynchrone pour le chemin adossé à des providers partagés

- Exécutions d’agent adossées à une session : `music_generate` crée une tâche d’arrière-plan, renvoie immédiatement une réponse started/task, puis publie la piste terminée plus tard dans un message de suivi de l’agent.
- Prévention des doublons : tant que cette tâche d’arrière-plan est encore `queued` ou `running`, les appels ultérieurs à `music_generate` dans la même session renvoient le statut de la tâche au lieu de démarrer une autre génération.
- Recherche de statut : utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session sans démarrer une nouvelle génération.
- Suivi des tâches : utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour inspecter les statuts queued, running, et terminaux de la génération.
- Réveil à l’achèvement : OpenClaw injecte un événement interne d’achèvement dans la même session afin que le modèle puisse lui-même écrire le message de suivi destiné à l’utilisateur.
- Indication de prompt : les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite indication d’exécution lorsqu’une tâche musicale est déjà en cours afin que le modèle n’appelle pas aveuglément `music_generate` à nouveau.
- Repli sans session : les contextes directs/locaux sans vraie session d’agent s’exécutent quand même inline et renvoient le résultat audio final dans le même tour.

### Cycle de vie de la tâche

Chaque requête `music_generate` passe par quatre états :

1. **queued** -- tâche créée, en attente que le provider l’accepte.
2. **running** -- le provider traite la demande (généralement de 30 secondes à 3 minutes selon le provider et la durée).
3. **succeeded** -- la piste est prête ; l’agent se réveille et la publie dans la conversation.
4. **failed** -- erreur provider ou délai d’attente dépassé ; l’agent se réveille avec les détails de l’erreur.

Vérifiez le statut depuis le CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prévention des doublons : si une tâche musicale est déjà `queued` ou `running` pour la session courante, `music_generate` renvoie le statut de la tâche existante au lieu d’en démarrer une nouvelle. Utilisez `action: "status"` pour vérifier explicitement sans déclencher une nouvelle génération.

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Ordre de sélection des providers

Lors de la génération de musique, OpenClaw essaie les providers dans cet ordre :

1. le paramètre `model` de l’appel d’outil, si l’agent en spécifie un
2. `musicGenerationModel.primary` depuis la configuration
3. `musicGenerationModel.fallbacks` dans l’ordre
4. auto-détection utilisant uniquement les valeurs par défaut des providers adossés à l’authentification :
   - provider par défaut courant en premier
   - providers de génération musicale enregistrés restants dans l’ordre des identifiants provider

Si un provider échoue, le candidat suivant est essayé automatiquement. Si tous échouent, l’erreur
inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous voulez que
la génération musicale utilise uniquement les entrées explicites `model`, `primary`, et `fallbacks`.

## Remarques sur les providers

- Google utilise la génération batch Lyria 3. Le flux intégré actuel prend en charge
  le prompt, un texte de paroles facultatif, et des images de référence facultatives.
- MiniMax utilise le point de terminaison batch `music_generation`. Le flux intégré actuel
  prend en charge le prompt, des paroles facultatives, le mode instrumental, le pilotage de durée, et
  la sortie mp3.
- La prise en charge de ComfyUI est pilotée par workflow et dépend du graphe configuré ainsi que
  du mapping des nœuds pour les champs prompt/sortie.

## Modes de capacité provider

Le contrat partagé de génération musicale prend désormais en charge des déclarations explicites de mode :

- `generate` pour la génération à partir d’un prompt seul
- `edit` lorsque la requête inclut une ou plusieurs images de référence

Les nouvelles implémentations de provider devraient préférer des blocs de mode explicites :

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Les champs plats hérités tels que `maxInputImages`, `supportsLyrics`, et
`supportsFormat` ne suffisent pas pour annoncer la prise en charge de l’édition. Les providers doivent
déclarer `generate` et `edit` explicitement afin que les tests live, les tests de contrat, et
l’outil partagé `music_generate` puissent valider la prise en charge des modes de façon déterministe.

## Choisir le bon chemin

- Utilisez le chemin adossé à des providers partagés lorsque vous voulez la sélection de modèle, le basculement provider, et le flux asynchrone intégré de tâche/statut.
- Utilisez un chemin Plugin tel que ComfyUI lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un provider qui ne fait pas partie de la capacité musicale intégrée partagée.
- Si vous déboguez un comportement spécifique à ComfyUI, voir [ComfyUI](/fr/providers/comfy). Si vous déboguez un comportement provider partagé, commencez par [Google (Gemini)](/fr/providers/google) ou [MiniMax](/fr/providers/minimax).

## Tests live

Couverture live opt-in pour les providers intégrés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d’environnement provider manquantes depuis `~/.profile`, préfère
par défaut les clés API live/env aux profils d’authentification stockés, et exécute à la fois la couverture
`generate` et la couverture `edit` déclarée lorsque le provider active le mode édition.

Aujourd’hui, cela signifie :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy séparée, pas dans le balayage provider partagé

Couverture live opt-in pour le chemin musical ComfyUI intégré :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre aussi les workflows d’image et de vidéo comfy lorsque ces
sections sont configurées.

## Liens associés

- [Tâches d’arrière-plan](/fr/automation/tasks) - suivi des tâches pour les exécutions détachées de `music_generate`
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration `musicGenerationModel`
- [ComfyUI](/fr/providers/comfy)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) - configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
