---
read_when:
    - Générer de la musique ou de l’audio via l’agent
    - Configurer des fournisseurs et des modèles de génération de musique
    - Comprendre les paramètres de l’outil `music_generate`
summary: Générez de la musique avec des fournisseurs partagés, y compris des plugins adossés à des workflows
title: Génération de musique
x-i18n:
    generated_at: "2026-04-06T03:13:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a03de8aa75cfb7248eb0c1d969fb2a6da06117967d097e6f6e95771d0f017ae1
    source_path: tools/music-generation.md
    workflow: 15
---

# Génération de musique

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec des fournisseurs configurés comme Google,
MiniMax et ComfyUI configuré par workflow.

Pour les sessions d’agent adossées à des fournisseurs partagés, OpenClaw démarre la génération musicale comme une
tâche d’arrière-plan, la suit dans le registre des tâches, puis réveille à nouveau l’agent lorsque
la piste est prête afin qu’il puisse republier l’audio final dans le
canal d’origine.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent, configurez `agents.defaults.musicGenerationModel` ou définissez une clé API de fournisseur.
</Note>

## Démarrage rapide

### Génération adossée à des fournisseurs partagés

1. Définissez une clé API pour au moins un fournisseur, par exemple `GEMINI_API_KEY` ou
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

3. Demandez à l’agent : _« Génère une piste synthpop entraînante sur une virée nocturne
   dans une ville néon. »_

L’agent appelle automatiquement `music_generate`. Aucune liste d’autorisation d’outils n’est nécessaire.

Pour les contextes synchrones directs sans exécution d’agent adossée à une session, l’outil intégré
bascule toujours vers une génération inline et renvoie le chemin final du média dans
le résultat de l’outil.

Exemples de prompts :

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Génération Comfy pilotée par workflow

Le plugin groupé `comfy` se branche sur l’outil partagé `music_generate` via
le registre des fournisseurs de génération musicale.

1. Configurez `models.providers.comfy.music` avec un workflow JSON et des
   nœuds de prompt/sortie.
2. Si vous utilisez Comfy Cloud, définissez `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Demandez de la musique à l’agent ou appelez directement l’outil.

Exemple :

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Prise en charge des fournisseurs groupés partagés

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                    | Clé API                                |
| ----------- | ---------------------- | -------------------- | ----------------------------------------------------------- | -------------------------------------- |
| ComfyUI     | `workflow`             | Jusqu’à 1 image      | Musique ou audio définis par le workflow                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google      | `lyria-3-clip-preview` | Jusqu’à 10 images    | `lyrics`, `instrumental`, `format`                          | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax     | `music-2.5+`           | Aucune               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`   | `MINIMAX_API_KEY`                      |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles partagés disponibles à
l’exécution :

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

| Paramètre         | Type     | Description                                                                                           |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de génération musicale (requis pour `action: "generate"`)                                     |
| `action`          | string   | `"generate"` (par défaut), `"status"` pour la tâche de la session en cours, ou `"list"` pour inspecter les fournisseurs |
| `model`           | string   | Surcharge fournisseur/modèle, par ex. `google/lyria-3-pro-preview` ou `comfy/workflow`              |
| `lyrics`          | string   | Paroles facultatives lorsque le fournisseur prend en charge une entrée explicite de paroles          |
| `instrumental`    | boolean  | Demander une sortie instrumentale uniquement lorsque le fournisseur la prend en charge               |
| `image`           | string   | Chemin ou URL d’une image de référence unique                                                         |
| `images`          | string[] | Plusieurs images de référence (jusqu’à 10)                                                            |
| `durationSeconds` | number   | Durée cible en secondes lorsque le fournisseur prend en charge les indications de durée              |
| `format`          | string   | Indication de format de sortie (`mp3` ou `wav`) lorsque le fournisseur la prend en charge            |
| `filename`        | string   | Indication de nom de fichier de sortie                                                                |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide quand même les limites strictes
comme le nombre d’entrées avant l’envoi, mais les indications facultatives non prises en charge sont
ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les honorer.

## Comportement asynchrone pour le chemin partagé adossé à des fournisseurs

- Exécutions d’agent adossées à une session : `music_generate` crée une tâche d’arrière-plan, renvoie immédiatement une réponse de démarrage/tâche, puis publie la piste terminée plus tard dans un message de suivi de l’agent.
- Prévention des doublons : tant que cette tâche d’arrière-plan est encore `queued` ou `running`, les appels ultérieurs à `music_generate` dans la même session renvoient l’état de la tâche au lieu de démarrer une autre génération.
- Consultation d’état : utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session sans en démarrer une nouvelle.
- Suivi des tâches : utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour inspecter les états en file d’attente, en cours d’exécution et terminaux de la génération.
- Réveil à l’achèvement : OpenClaw injecte un événement interne d’achèvement dans la même session afin que le modèle puisse lui-même rédiger le message de suivi destiné à l’utilisateur.
- Indication de prompt : les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite indication d’exécution lorsqu’une tâche musicale est déjà en vol afin que le modèle ne rappelle pas aveuglément `music_generate`.
- Repli sans session : les contextes directs/locaux sans véritable session d’agent s’exécutent toujours inline et renvoient le résultat audio final dans le même tour.

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

### Ordre de sélection des fournisseurs

Lors de la génération de musique, OpenClaw essaie les fournisseurs dans cet ordre :

1. Le paramètre `model` de l’appel d’outil, si l’agent en spécifie un
2. `musicGenerationModel.primary` depuis la configuration
3. `musicGenerationModel.fallbacks` dans l’ordre
4. Auto-détection en utilisant uniquement les valeurs par défaut des fournisseurs adossées à l’authentification :
   - le fournisseur par défaut actuel en premier
   - les autres fournisseurs de génération musicale enregistrés, dans l’ordre des identifiants de fournisseur

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous échouent, l’
erreur inclut des détails de chaque tentative.

## Notes sur les fournisseurs

- Google utilise la génération par lots Lyria 3. Le flux groupé actuel prend en charge
  le prompt, le texte de paroles facultatif et des images de référence facultatives.
- MiniMax utilise le point de terminaison batch `music_generation`. Le flux groupé actuel
  prend en charge le prompt, des paroles facultatives, le mode instrumental, le pilotage de la durée et
  la sortie mp3.
- La prise en charge de ComfyUI est pilotée par workflow et dépend du graphe configuré ainsi que
  du mappage des nœuds pour les champs de prompt/sortie.

## Choisir le bon chemin

- Utilisez le chemin partagé adossé à des fournisseurs lorsque vous voulez la sélection de modèle, le basculement de fournisseur et le flux intégré asynchrone de tâche/état.
- Utilisez un chemin de plugin comme ComfyUI lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un fournisseur qui ne fait pas partie de la capacité musicale groupée partagée.
- Si vous déboguez un comportement spécifique à ComfyUI, consultez [ComfyUI](/fr/providers/comfy). Si vous déboguez un comportement de fournisseur partagé, commencez par [Google (Gemini)](/fr/providers/google) ou [MiniMax](/fr/providers/minimax).

## Tests en direct

Couverture en direct sur opt-in pour les fournisseurs groupés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Couverture en direct sur opt-in pour le chemin musical ComfyUI groupé :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre aussi les workflows d’image et de vidéo Comfy lorsque ces
sections sont configurées.

## Lié

- [Background Tasks](/fr/automation/tasks) - suivi des tâches pour les exécutions détachées de `music_generate`
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults) - configuration `musicGenerationModel`
- [ComfyUI](/fr/providers/comfy)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Models](/fr/concepts/models) - configuration des modèles et basculement
- [Tools Overview](/fr/tools)
