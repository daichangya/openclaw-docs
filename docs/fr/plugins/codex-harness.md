---
read_when:
    - Vous voulez utiliser le harnais app-server Codex fourni avec le bundle
    - Vous avez besoin de références de modèle Codex et d’exemples de configuration
    - Vous voulez désactiver le repli PI pour les déploiements uniquement Codex
summary: Exécuter les tours d’agent intégrés OpenClaw via le harnais app-server Codex fourni avec le bundle
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-23T14:00:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harnais Codex

Le Plugin `codex` fourni avec le bundle permet à OpenClaw d’exécuter les tours d’agent intégrés via le
app-server Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex prenne en charge la session d’agent de bas niveau : découverte
des modèles, reprise native des fils, Compaction native et exécution app-server.
OpenClaw continue de gérer les canaux de chat, les fichiers de session, la sélection des modèles, les outils,
les approbations, la livraison des médias et le miroir visible de la transcription.

Les tours Codex natifs respectent également les hooks Plugin partagés afin que les shims de prompt,
l’automatisation sensible à la Compaction, le middleware d’outils et les observateurs de cycle de vie restent
alignés avec le harnais PI :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Les plugins fournis avec le bundle peuvent aussi enregistrer une fabrique d’extensions app-server Codex pour ajouter
un middleware `tool_result` asynchrone.

Le harnais est désactivé par défaut. Il n’est sélectionné que lorsque le Plugin `codex` est
activé et que le modèle résolu est un modèle `codex/*`, ou lorsque vous forcez explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Si vous ne configurez jamais `codex/*`, les exécutions PI, OpenAI, Anthropic, Gemini, local,
et fournisseur personnalisé existantes conservent leur comportement actuel.

## Choisir le bon préfixe de modèle

OpenClaw a des chemins distincts pour l’accès de type OpenAI et de type Codex :

| Référence de modèle | Chemin d’exécution                           | À utiliser lorsque                                                       |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`    | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez un accès direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Fournisseur OAuth OpenAI Codex via PI     | Vous voulez OAuth ChatGPT/Codex sans le harnais app-server Codex.        |
| `codex/gpt-5.4`     | Fournisseur Codex fourni avec le bundle plus harnais Codex | Vous voulez l’exécution native app-server Codex pour le tour d’agent intégré. |

Le harnais Codex ne prend en charge que les références de modèle `codex/*`. Les références existantes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local et fournisseur personnalisé conservent
leurs chemins normaux.

## Exigences

- OpenClaw avec le Plugin `codex` fourni avec le bundle disponible.
- app-server Codex `0.118.0` ou plus récent.
- Authentification Codex disponible pour le processus app-server.

Le Plugin bloque les poignées de main app-server plus anciennes ou non versionnées. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus
des fichiers CLI Codex facultatifs tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’authentification que ceux utilisés par votre app-server Codex local.

## Configuration minimale

Utilisez `codex/gpt-5.4`, activez le Plugin fourni avec le bundle et forcez le harnais `codex` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, incluez aussi `codex` :

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Définir `agents.defaults.model` ou le modèle d’un agent sur `codex/<model>` active aussi
automatiquement le Plugin `codex` fourni avec le bundle. L’entrée de Plugin explicite reste
utile dans les configurations partagées parce qu’elle rend l’intention du déploiement évidente.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` si vous voulez Codex pour les modèles `codex/*` et PI pour
tout le reste :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Avec cette structure :

- `/model codex` ou `/model codex/gpt-5.4` utilise le harnais app-server Codex.
- `/model gpt` ou `/model openai/gpt-5.4` utilise le chemin du fournisseur OpenAI.
- `/model opus` utilise le chemin du fournisseur Anthropic.
- Si un modèle non Codex est sélectionné, PI reste le harnais de compatibilité.

## Déploiements uniquement Codex

Désactivez le repli PI lorsque vous devez prouver que chaque tour d’agent intégré utilise
le harnais Codex :

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Remplacement via variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, OpenClaw échoue tôt si le Plugin Codex est désactivé,
si le modèle demandé n’est pas une référence `codex/*`, si le app-server est trop ancien ou si le
app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez faire en sorte qu’un agent soit uniquement Codex tandis que l’agent par défaut conserve
la sélection automatique normale :

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session normales pour changer d’agent et de modèle. `/new` crée une nouvelle
session OpenClaw et le harnais Codex crée ou reprend son fil app-server sidecar
si nécessaire. `/reset` efface la liaison de session OpenClaw pour ce fil.

## Découverte des modèles

Par défaut, le Plugin Codex interroge le app-server sur les modèles disponibles. Si la
découverte échoue ou expire, il utilise le catalogue de repli fourni avec le bundle :

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Vous pouvez ajuster la découverte sous `plugins.entries.codex.config.discovery` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et s’en tienne au
catalogue de repli :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connexion et politique du app-server

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Il s’agit de la posture d’opérateur local de confiance utilisée
pour les Heartbeat autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est là pour répondre.

Pour activer les approbations Codex revues par guardian, définissez `appServer.mode:
"guardian"` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Le mode guardian se développe en :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian est un réviseur d’approbation natif Codex. Lorsque Codex demande à sortir du
sandbox, à écrire en dehors de l’espace de travail ou à ajouter des autorisations telles que l’accès réseau,
Codex route cette demande d’approbation vers un sous-agent réviseur au lieu d’une invite
humaine. Le réviseur collecte le contexte et applique le cadre de risque de Codex, puis
approuve ou refuse la demande spécifique. Guardian est utile lorsque vous voulez plus de
garde-fous que le mode YOLO mais que vous avez toujours besoin que des agents et Heartbeat sans supervision puissent
avancer.

Le harnais live Docker inclut une sonde Guardian lorsque
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Il démarre le harnais Codex en
mode Guardian, vérifie qu’une commande shell escaladée bénigne est approuvée et
vérifie qu’un téléversement de faux secret vers une destination externe non fiable est
refusé afin que l’agent redemande une approbation explicite.

Les champs de politique individuels gardent tout de même la priorité sur `mode`, ce qui permet aux déploiements avancés de
mélanger le préréglage avec des choix explicites.

Pour un app-server déjà en cours d’exécution, utilisez le transport WebSocket :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Champs `appServer` pris en charge :

| Champ               | Par défaut                               | Signification                                                                                             |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                |
| `command`           | `"codex"`                                | Exécutable pour le transport stdio.                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                        |
| `url`               | non défini                               | URL WebSocket du app-server.                                                                              |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                 |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                       |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels du plan de contrôle app-server.                                       |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou revue par guardian.                                                   |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage/reprise/tour de fil.                            |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage/reprise du fil.                                              |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"guardian_subagent"` pour laisser Codex Guardian examiner les invites.                          |
| `serviceTier`       | non défini                               | Niveau de service app-server Codex facultatif : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées. |

Les anciennes variables d’environnement fonctionnent toujours comme solutions de repli pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La configuration est
préférée pour les déploiements reproductibles parce qu’elle conserve le comportement du Plugin dans le
même fichier revu que le reste de la configuration du harnais Codex.

## Recettes courantes

Codex local avec le transport stdio par défaut :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validation du harnais uniquement Codex, avec repli PI désactivé :

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approbations Codex revues par Guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server distant avec en-têtes explicites :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Le changement de modèle reste contrôlé par OpenClaw. Lorsqu’une session OpenClaw est attachée
à un fil Codex existant, le tour suivant renvoie au app-server le
modèle `codex/*`, le fournisseur, la politique d’approbation, le sandbox et le niveau de service
actuellement sélectionnés. Passer de `codex/gpt-5.4` à `codex/gpt-5.2` conserve la
liaison du fil mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin fourni avec le bundle enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un fil Codex existant.
- `/codex compact` demande au app-server Codex de faire une Compaction du fil attaché.
- `/codex review` démarre la révision native Codex pour le fil attaché.
- `/codex account` affiche le compte et l’état des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du app-server Codex.
- `/codex skills` liste les Skills du app-server Codex.

`/codex resume` écrit le même fichier de liaison sidecar que le harnais utilise pour
les tours normaux. Au message suivant, OpenClaw reprend ce fil Codex, transmet au app-server le
modèle OpenClaw `codex/*` actuellement sélectionné et conserve l’historique étendu
activé.

La surface de commande nécessite le app-server Codex `0.118.0` ou plus récent. Les méthodes
de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Outils, médias et Compaction

Le harnais Codex ne change que l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, la synthèse vocale, les approbations et la sortie de l’outil de messagerie
continuent de passer par le chemin de livraison normal d’OpenClaw.

Les sollicitations d’approbation d’outils MCP Codex sont routées via le flux d’approbation
Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"` ; les autres demandes de sollicitation et de saisie libre échouent toujours
de manière fermée.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du fil est
déléguée au app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique des canaux,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant et des enregistrements légers de raisonnement ou de plan Codex lorsque le app-server les émet. Aujourd’hui, OpenClaw n’enregistre que les signaux de début et de fin de Compaction native. Il n’expose pas encore de résumé de Compaction lisible par un humain ni de liste vérifiable des entrées que Codex a conservées après la Compaction.

La génération de médias ne nécessite pas PI. La génération d’images, de vidéo, de musique, de PDF, la synthèse vocale et la
compréhension des médias continuent d’utiliser les paramètres fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
définissez une référence de modèle `codex/*` ou vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise PI au lieu de Codex :** si aucun harnais Codex ne prend en charge l’exécution,
OpenClaw peut utiliser PI comme backend de compatibilité. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests, ou
`embeddedHarness.fallback: "none"` pour échouer lorsqu’aucun harnais Plugin ne correspond. Une fois
le app-server Codex sélectionné, ses échecs apparaissent directement sans configuration
de repli supplémentaire.

**Le app-server est rejeté :** mettez à niveau Codex afin que la poignée de main app-server
signale la version `0.118.0` ou plus récente.

**La découverte de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le app-server distant parle la même version du protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est attendu. Le harnais Codex ne prend en charge que les
références de modèle `codex/*`.

## Liens connexes

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing#live-codex-app-server-harness-smoke)
