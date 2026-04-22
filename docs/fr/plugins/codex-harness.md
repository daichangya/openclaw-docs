---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex intégré
    - Vous avez besoin de références de modèle Codex et d’exemples de configuration
    - Vous souhaitez désactiver le repli Pi pour les déploiements Codex uniquement
summary: Exécutez les tours d’agent intégrés d’OpenClaw via le harnais app-server Codex intégré
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-22T06:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harnais Codex

Le Plugin `codex` intégré permet à OpenClaw d’exécuter les tours d’agent intégrés via l’app-server Codex au lieu du harnais Pi intégré.

Utilisez-le lorsque vous souhaitez que Codex prenne en charge la session d’agent de bas niveau : découverte des modèles, reprise native des threads, compaction native et exécution via app-server.
OpenClaw continue de gérer les canaux de discussion, les fichiers de session, la sélection du modèle, les outils,
les approbations, la livraison des médias et le miroir visible de la transcription.

Le harnais est désactivé par défaut. Il est sélectionné uniquement lorsque le Plugin `codex` est
activé et que le modèle résolu est un modèle `codex/*`, ou lorsque vous forcez explicitement `embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Si vous ne configurez jamais `codex/*`, les exécutions existantes PI, OpenAI, Anthropic, Gemini, local,
et custom-provider conservent leur comportement actuel.

## Choisir le bon préfixe de modèle

OpenClaw dispose de routes distinctes pour l’accès de type OpenAI et de type Codex :

| Référence de modèle   | Chemin d’exécution                          | À utiliser lorsque                                                      |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Fournisseur OpenAI via le pipeline OpenClaw/PI | Vous souhaitez un accès direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Fournisseur OpenAI Codex OAuth via PI      | Vous souhaitez utiliser ChatGPT/Codex OAuth sans le harnais app-server Codex. |
| `codex/gpt-5.4`       | Fournisseur Codex intégré plus harnais Codex | Vous souhaitez une exécution native via l’app-server Codex pour le tour d’agent intégré. |

Le harnais Codex ne prend en charge que les références de modèle `codex/*`. Les références existantes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local et custom provider conservent
leurs chemins normaux.

## Exigences

- OpenClaw avec le Plugin `codex` intégré disponible.
- App-server Codex `0.118.0` ou version plus récente.
- Auth Codex disponible pour le processus app-server.

Le Plugin bloque les handshakes app-server plus anciens ou non versionnés. Cela permet à
OpenClaw de rester sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke en direct et dans Docker, l’auth provient généralement de `OPENAI_API_KEY`, ainsi que de
fichiers facultatifs de CLI Codex comme `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’auth que ceux utilisés par votre app-server Codex locale.

## Configuration minimale

Utilisez `codex/gpt-5.4`, activez le Plugin intégré et forcez le harnais `codex` :

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

Si votre configuration utilise `plugins.allow`, incluez également `codex` :

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

Définir `agents.defaults.model` ou un modèle d’agent sur `codex/<model>` active également automatiquement
le Plugin `codex` intégré. L’entrée explicite du Plugin reste néanmoins
utile dans les configurations partagées, car elle rend l’intention du déploiement évidente.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` lorsque vous souhaitez utiliser Codex pour les modèles `codex/*` et PI pour
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

## Déploiements Codex uniquement

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

Surcharge par variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, OpenClaw échoue rapidement si le Plugin Codex est désactivé,
si le modèle demandé n’est pas une référence `codex/*`, si l’app-server est trop ancienne, ou si
l’app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent Codex-only tandis que l’agent par défaut conserve la
sélection automatique normale :

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
si nécessaire. `/reset` efface l’association de session OpenClaw pour ce thread.

## Découverte des modèles

Par défaut, le Plugin Codex interroge l’app-server pour obtenir les modèles disponibles. Si la
découverte échoue ou expire, il utilise le catalogue de repli intégré :

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

Désactivez la découverte lorsque vous souhaitez que le démarrage évite de sonder Codex et s’en tienne au
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

## Connexion et stratégie de l’app-server

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw demande à Codex de solliciter des approbations natives. Vous pouvez ajuster davantage cette
stratégie, par exemple en la resserrant et en redirigeant les revues via le guardian :

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

| Champ               | Valeur par défaut                         | Signification                                                            |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                 | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.               |
| `command`           | `"codex"`                                 | Exécutable pour le transport stdio.                                      |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Arguments pour le transport stdio.                                       |
| `url`               | non défini                                | URL WebSocket de l’app-server.                                           |
| `authToken`         | non défini                                | Token Bearer pour le transport WebSocket.                                |
| `headers`           | `{}`                                      | En-têtes WebSocket supplémentaires.                                      |
| `requestTimeoutMs`  | `60000`                                   | Délai d’expiration pour les appels au plan de contrôle de l’app-server.  |
| `approvalPolicy`    | `"on-request"`                            | Stratégie d’approbation native Codex envoyée au démarrage/reprise/tour du thread. |
| `sandbox`           | `"workspace-write"`                       | Mode sandbox natif Codex envoyé au démarrage/reprise du thread.          |
| `approvalsReviewer` | `"user"`                                  | Utilisez `"guardian_subagent"` pour laisser le guardian Codex examiner les approbations natives. |
| `serviceTier`       | non défini                                | Niveau de service Codex facultatif, par exemple `"priority"`.            |

Les anciennes variables d’environnement fonctionnent toujours comme solutions de repli pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

La configuration est à privilégier pour des déploiements reproductibles.

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

Validation du harnais Codex-only, avec repli PI désactivé :

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

Approbations Codex examinées par le guardian :

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

App-server distante avec en-têtes explicites :

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
à un thread Codex existant, le tour suivant renvoie le modèle
`codex/*`, le fournisseur, la stratégie d’approbation, le sandbox et le niveau de service actuellement sélectionnés à
l’app-server. Passer de `codex/gpt-5.4` à `codex/gpt-5.2` conserve l’association avec le thread mais demande à Codex de poursuivre avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin intégré enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande à l’app-server Codex d’effectuer une compaction du thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les Skills de l’app-server Codex.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour
les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet à
l’app-server le modèle OpenClaw `codex/*` actuellement sélectionné, et conserve l’historique étendu
activé.

La surface de commande nécessite l’app-server Codex `0.118.0` ou une version plus récente. Les méthodes de
contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si une
future app-server ou une app-server personnalisée n’expose pas cette méthode JSON-RPC.

## Outils, médias et Compaction

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

OpenClaw continue de construire la liste des outils et de recevoir les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison normal d’OpenClaw.

Lorsque le modèle sélectionné utilise le harnais Codex, la compaction native du thread est
déléguée à l’app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique du canal,
la recherche, `/new`, `/reset`, et les futurs changements de modèle ou de harnais. Le
miroir inclut l’invite de l’utilisateur, le texte final de l’assistant, et des enregistrements légers de raisonnement ou de plan Codex lorsque l’app-server les émet.

La génération de médias ne nécessite pas PI. La génération d’images, de vidéo, de musique, de PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres du fournisseur/modèle correspondants, tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
définissez une référence de modèle `codex/*`, ou vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise PI au lieu de Codex :** si aucun harnais Codex ne prend en charge l’exécution,
OpenClaw peut utiliser PI comme backend de compatibilité. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests, ou
`embeddedHarness.fallback: "none"` pour échouer lorsqu’aucun harnais de Plugin correspondant n’est trouvé. Une fois
l’app-server Codex sélectionnée, ses échecs apparaissent directement sans
configuration de repli supplémentaire.

**L’app-server est rejetée :** mettez à niveau Codex afin que le handshake de l’app-server
signale la version `0.118.0` ou une version plus récente.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que l’app-server distante parle la même version du protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est normal. Le harnais Codex ne prend en charge que
les références de modèle `codex/*`.

## Liens connexes

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing#live-codex-app-server-harness-smoke)
