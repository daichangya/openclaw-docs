---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex intégré
    - Vous avez besoin de références de modèles Codex et d’exemples de configuration
    - Vous souhaitez désactiver le fallback PI pour les déploiements Codex uniquement
summary: Exécuter des tours d’agent embarqués OpenClaw via le harnais app-server Codex intégré
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-21T07:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harnais Codex

Le plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqués via le
app-server Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex prenne en charge la session d’agent bas niveau : découverte
des modèles, reprise native des threads, Compaction native et exécution app-server.
OpenClaw conserve toutefois la gestion des canaux de chat, des fichiers de session, de la sélection des modèles, des outils,
des approbations, de la livraison des médias et du miroir de transcription visible.

Le harnais est désactivé par défaut. Il n’est sélectionné que lorsque le plugin `codex` est
activé et que le modèle résolu est un modèle `codex/*`, ou lorsque vous forcez explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Si vous ne configurez jamais `codex/*`, les exécutions existantes PI, OpenAI, Anthropic, Gemini, locales
et à provider personnalisé conservent leur comportement actuel.

## Choisir le bon préfixe de modèle

OpenClaw dispose de routes distinctes pour l’accès de type OpenAI et de type Codex :

| Référence de modèle    | Chemin runtime                               | À utiliser lorsque                                                        |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Provider OpenAI via le plumbing OpenClaw/PI | Vous voulez un accès direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Provider OAuth OpenAI Codex via PI          | Vous voulez l’OAuth ChatGPT/Codex sans le harnais app-server Codex.       |
| `codex/gpt-5.4`        | Provider Codex intégré plus harnais Codex   | Vous voulez l’exécution native app-server Codex pour le tour d’agent embarqué. |

Le harnais Codex ne prend en charge que les références de modèle `codex/*`. Les références existantes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, locales et à provider personnalisé conservent
leurs chemins normaux.

## Exigences

- OpenClaw avec le plugin `codex` intégré disponible.
- app-server Codex `0.118.0` ou plus récent.
- Authentification Codex disponible pour le processus app-server.

Le plugin bloque les handshakes app-server plus anciens ou non versionnés. Cela maintient
OpenClaw sur la surface de protocole avec laquelle il a été testé.

Pour les tests smoke en direct et sous Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus
les fichiers facultatifs de la CLI Codex tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez le même matériel d’authentification que votre app-server Codex local.

## Configuration minimale

Utilisez `codex/gpt-5.4`, activez le plugin intégré et forcez le harnais `codex` :

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

Si votre configuration utilise `plugins.allow`, incluez aussi `codex` :

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

Définir `agents.defaults.model` ou un modèle d’agent sur `codex/<model>` active aussi
automatiquement le plugin `codex` intégré. L’entrée explicite du plugin reste
utile dans les configurations partagées car elle rend l’intention de déploiement évidente.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` si vous voulez Codex pour les modèles `codex/*` et PI pour
tout le reste :

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

Avec cette structure :

- `/model codex` ou `/model codex/gpt-5.4` utilise le harnais app-server Codex.
- `/model gpt` ou `/model openai/gpt-5.4` utilise le chemin provider OpenAI.
- `/model opus` utilise le chemin provider Anthropic.
- Si un modèle non Codex est sélectionné, PI reste le harnais de compatibilité.

## Déploiements Codex uniquement

Désactivez le fallback PI lorsque vous devez prouver que chaque tour d’agent embarqué utilise
le harnais Codex :

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

Remplacement par variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le fallback désactivé, OpenClaw échoue tôt si le plugin Codex est désactivé,
si le modèle demandé n’est pas une référence `codex/*`, si le app-server est trop ancien, ou si le
app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent Codex uniquement tout en laissant à l’agent par défaut la
sélection automatique normale :

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
session OpenClaw et le harnais Codex crée ou reprend son thread sidecar app-server
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce thread.

## Découverte des modèles

Par défaut, le plugin Codex demande au app-server les modèles disponibles. Si la
découverte échoue ou expire, il utilise le catalogue de secours intégré :

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Vous pouvez ajuster la découverte sous `plugins.entries.codex.config.discovery` :

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
catalogue de secours :

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

## Connexion app-server et politique

Par défaut, le plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw demande à Codex de requérir des approbations natives. Vous pouvez ajuster davantage cette
politique, par exemple en la resserrant et en faisant passer les revues par le guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Pour un app-server déjà en cours d’exécution, utilisez le transport WebSocket :

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

Champs `appServer` pris en charge :

| Champ               | Par défaut                                | Signification                                                            |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                 | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.               |
| `command`           | `"codex"`                                 | Exécutable pour le transport stdio.                                      |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Arguments pour le transport stdio.                                       |
| `url`               | non défini                                | URL WebSocket du app-server.                                             |
| `authToken`         | non défini                                | Jeton Bearer pour le transport WebSocket.                                |
| `headers`           | `{}`                                      | En-têtes WebSocket supplémentaires.                                      |
| `requestTimeoutMs`  | `60000`                                   | Timeout pour les appels du plan de contrôle app-server.                  |
| `approvalPolicy`    | `"on-request"`                            | Politique d’approbation native Codex envoyée au démarrage/reprise/tour du thread. |
| `sandbox`           | `"workspace-write"`                       | Mode sandbox natif Codex envoyé au démarrage/reprise du thread.          |
| `approvalsReviewer` | `"user"`                                  | Utilisez `"guardian_subagent"` pour laisser le guardian Codex examiner les approbations natives. |
| `serviceTier`       | non défini                                | Niveau de service Codex facultatif, par exemple `"priority"`.            |

Les anciennes variables d’environnement fonctionnent toujours comme solutions de secours pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

La configuration est préférable pour des déploiements reproductibles.

## Recettes courantes

Codex local avec transport stdio par défaut :

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

Validation de harnais Codex uniquement, avec fallback PI désactivé :

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

Approbations Codex examinées par guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

App-server distant avec en-têtes explicites :

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
à un thread Codex existant, le tour suivant renvoie au app-server le
modèle `codex/*`, le provider, la politique d’approbation, le sandbox et le niveau de service actuellement sélectionnés.
Passer de `codex/gpt-5.4` à `codex/gpt-5.2` conserve la
liaison du thread mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le plugin intégré enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande au app-server Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du app-server Codex.
- `/codex skills` liste les skills du app-server Codex.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour les
tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet au
app-server le modèle OpenClaw `codex/*` actuellement sélectionné, et conserve l’historique
étendu activé.

La surface de commande exige un app-server Codex `0.118.0` ou plus récent. Les méthodes de
contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Outils, médias et Compaction

Le harnais Codex ne modifie que l’exécuteur d’agent embarqué bas niveau.

OpenClaw continue de construire la liste des outils et de recevoir les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin normal de livraison OpenClaw.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native des threads est
déléguée au app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique des canaux,
la recherche, `/new`, `/reset`, et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant et des enregistrements légers
de raisonnement ou de plan Codex lorsque le app-server les émet.

La génération de médias ne nécessite pas PI. Les images, la vidéo, la musique, les PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres de provider/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
définissez une référence de modèle `codex/*`, ou vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw revient sur PI :** définissez `embeddedHarness.fallback: "none"` ou
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` pendant les tests.

**Le app-server est rejeté :** mettez à niveau Codex afin que le handshake app-server
signale la version `0.118.0` ou plus récente.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le app-server distant parle la même version de protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est attendu. Le harnais Codex ne prend en charge que
les références de modèle `codex/*`.

## Liens associés

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Providers de modèles](/fr/concepts/model-providers)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Testing](/fr/help/testing#live-codex-app-server-harness-smoke)
