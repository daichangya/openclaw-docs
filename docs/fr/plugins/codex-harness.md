---
read_when:
    - Vous voulez utiliser le harnais app-server Codex intégré
    - Vous avez besoin de références de modèles Codex et d’exemples de configuration
    - Vous voulez désactiver le repli PI pour les déploiements Codex uniquement
summary: Exécuter des tours d’agent embarqué OpenClaw via le harnais app-server Codex intégré
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-24T07:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

Le Plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqué via le
serveur d’application Codex au lieu du harnais PI intégré.

Utilisez cela lorsque vous voulez que Codex possède la session d’agent de bas niveau : découverte de modèles, reprise native de fil, Compaction native et exécution du serveur d’application.
OpenClaw reste responsable des canaux de chat, des fichiers de session, de la sélection de modèle, des outils,
des approbations, de la livraison des médias et du miroir de transcription visible.

Les tours Codex natifs conservent les hooks de Plugin OpenClaw comme couche publique de compatibilité.
Il s’agit de hooks OpenClaw en processus, pas des hooks de commande `hooks.json` de Codex :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` pour les enregistrements miroir de transcription
- `agent_end`

Les plugins intégrés peuvent aussi enregistrer une fabrique d’extension de serveur d’application Codex pour ajouter un middleware asynchrone `tool_result`. Ce middleware s’exécute pour les outils dynamiques OpenClaw après qu’OpenClaw a exécuté l’outil et avant que le résultat ne soit renvoyé à Codex. Il est distinct du hook public de Plugin `tool_result_persist`, qui transforme les écritures de résultats d’outils détenues par OpenClaw dans la transcription.

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèles OpenAI sous la forme canonique `openai/gpt-*` et forcer explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
veulent une exécution native du serveur d’application. Les anciennes références de modèles `codex/*` sélectionnent encore automatiquement le harnais pour compatibilité.

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI dépendent du préfixe. Utilisez `openai-codex/*` lorsque vous voulez
l’OAuth Codex via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l’API OpenAI ou
lorsque vous forcez le harnais natif du serveur d’application Codex :

| Réf. de modèle                                         | Chemin d’exécution                           | Utiliser lorsque                                                           |
| ------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                       | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez l’accès direct actuel à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                 | OAuth OpenAI Codex via OpenClaw/PI           | Vous voulez l’authentification par abonnement ChatGPT/Codex avec l’exécuteur PI par défaut. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"`  | Harnais serveur d’application Codex          | Vous voulez une exécution native du serveur d’application Codex pour le tour d’agent embarqué. |

GPT-5.5 est actuellement uniquement disponible via abonnement/OAuth dans OpenClaw. Utilisez
`openai-codex/gpt-5.5` pour l’OAuth PI, ou `openai/gpt-5.5` avec le harnais du
serveur d’application Codex. L’accès direct par clé API à `openai/gpt-5.5` est pris en charge
une fois qu’OpenAI active GPT-5.5 sur l’API publique.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. Les nouvelles configurations PI
Codex OAuth doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations du harnais natif du serveur d’application
doivent utiliser `openai/gpt-*` plus `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d’image doit passer par le chemin du fournisseur OpenAI
Codex OAuth. Utilisez `codex/gpt-*` lorsque la compréhension d’image doit passer
par un tour borné du serveur d’application Codex. Le modèle Codex du serveur d’application doit
annoncer la prise en charge des entrées image ; les modèles Codex texte uniquement échouent avant le début du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du gateway. Il
inclut l’ID du harnais sélectionné, la raison de sélection, la politique d’exécution/de repli, et,
en mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

La sélection de harnais n’est pas un contrôle dynamique de session active. Lorsqu’un tour embarqué s’exécute,
OpenClaw enregistre l’ID du harnais sélectionné sur cette session et continue à l’utiliser pour les
tours ultérieurs du même ID de session. Modifiez la configuration `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante entre PI et Codex. Cela évite de relire une même transcription à travers deux systèmes natifs de session incompatibles.

Les anciennes sessions créées avant l’épinglage du harnais sont traitées comme épinglées PI une fois qu’elles ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire adhérer cette conversation à Codex après changement de configuration.

`/status` affiche le harnais effectif non-PI à côté de `Fast`, par exemple
`Fast · codex`. Le harnais PI par défaut reste `Runner: pi (embedded)` et n’ajoute
pas de badge de harnais séparé.

## Exigences

- OpenClaw avec le Plugin `codex` intégré disponible.
- Serveur d’application Codex `0.118.0` ou plus récent.
- Authentification Codex disponible pour le processus du serveur d’application.

Le Plugin bloque les handshakes de serveur d’application plus anciens ou sans version. Cela permet à
OpenClaw de rester sur la surface de protocole avec laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus des fichiers CLI Codex facultatifs comme `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’authentification que ceux de votre serveur d’application Codex local.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le Plugin intégré et forcez le harnais `codex` :

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, incluez-y aussi `codex` :

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

Les anciennes configurations qui définissent `agents.defaults.model` ou un modèle d’agent sur
`codex/<model>` activent encore automatiquement le Plugin `codex` intégré. Les nouvelles configurations doivent
préférer `openai/<model>` plus l’entrée explicite `embeddedHarness` ci-dessus.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` lorsque vous voulez que les anciennes références `codex/*` sélectionnent Codex et
PI pour tout le reste. Pour les nouvelles configurations, préférez `runtime: "codex"` explicite sur
les agents qui doivent utiliser le harnais.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Avec cette forme :

- `/model gpt` ou `/model openai/gpt-5.5` utilise le harnais du serveur d’application Codex pour cette configuration.
- `/model opus` utilise le chemin du fournisseur Anthropic.
- Si un modèle non-Codex est sélectionné, PI reste le harnais de compatibilité.

## Déploiements Codex uniquement

Désactivez le repli PI lorsque vous devez prouver que chaque tour d’agent embarqué utilise
le harnais Codex :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Remplacement par environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, OpenClaw échoue immédiatement si le Plugin Codex est désactivé,
si le serveur d’application est trop ancien, ou s’il ne peut pas démarrer.

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session et de modèle normales pour changer d’agent et de modèle. `/new` crée une nouvelle
session OpenClaw et le harnais Codex crée ou reprend son fil sidecar de serveur d’application
si nécessaire. `/reset` efface la liaison de session OpenClaw pour ce fil
et laisse le tour suivant résoudre de nouveau le harnais depuis la configuration actuelle.

## Discovery de modèle

Par défaut, le Plugin Codex interroge le serveur d’application pour connaître les modèles disponibles. Si la
discovery échoue ou expire, il utilise un catalogue de repli intégré pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Vous pouvez ajuster la discovery sous `plugins.entries.codex.config.discovery` :

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

Désactivez la discovery lorsque vous voulez que le démarrage évite de sonder Codex et s’en tienne au
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

## Connexion au serveur d’application et politique

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, et
`sandbox: "danger-full-access"`. Il s’agit de la posture locale d’opérateur de confiance utilisée
pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est présent pour répondre.

Pour adhérer explicitement aux approbations relues par guardian de Codex, définissez `appServer.mode:
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

Guardian est un relecteur natif d’approbations Codex. Lorsque Codex demande à sortir du sandbox, écrire hors de l’espace de travail, ou ajouter des permissions comme l’accès réseau, Codex route cette demande d’approbation vers un sous-agent relecteur au lieu d’un prompt humain. Le relecteur applique le cadre de risque de Codex et approuve ou refuse la demande spécifique. Utilisez Guardian lorsque vous voulez plus de garde-fous que le mode YOLO mais avez encore besoin que des agents non supervisés puissent progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, et `sandbox: "workspace-write"`. Les champs de politique individuels remplacent toujours `mode`, de sorte que les déploiements avancés peuvent combiner le préréglage avec des choix explicites.

Pour un serveur d’application déjà en cours d’exécution, utilisez le transport WebSocket :

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

| Champ               | Valeur par défaut                          | Signification                                                                                         |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                  | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                            |
| `command`           | `"codex"`                                  | Exécutable pour le transport stdio.                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Arguments pour le transport stdio.                                                                    |
| `url`               | non défini                                 | URL WebSocket du serveur d’application.                                                               |
| `authToken`         | non défini                                 | Jeton Bearer pour le transport WebSocket.                                                             |
| `headers`           | `{}`                                       | En-têtes WebSocket supplémentaires.                                                                   |
| `requestTimeoutMs`  | `60000`                                    | Délai d’expiration pour les appels de plan de contrôle au serveur d’application.                      |
| `mode`              | `"yolo"`                                   | Préréglage pour exécution YOLO ou relue par guardian.                                                 |
| `approvalPolicy`    | `"never"`                                  | Politique native d’approbation Codex envoyée au démarrage/reprise/tour de fil.                        |
| `sandbox`           | `"danger-full-access"`                     | Mode de sandbox Codex natif envoyé au démarrage/reprise de fil.                                       |
| `approvalsReviewer` | `"user"`                                   | Utilisez `"guardian_subagent"` pour laisser Codex Guardian relire les prompts.                        |
| `serviceTier`       | non défini                                 | Niveau de service facultatif du serveur d’application Codex : `"fast"`, `"flex"`, ou `null`. Les anciennes valeurs invalides sont ignorées. |

Les anciennes variables d’environnement fonctionnent toujours comme replis pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférée pour les déploiements reproductibles car elle conserve le comportement du Plugin dans le
même fichier revu que le reste de la configuration du harnais Codex.

## Recettes courantes

Codex local avec transport stdio par défaut :

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

Validation de harnais Codex-only, avec repli PI désactivé :

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

Approbations Codex relues par guardian :

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

Serveur d’application distant avec en-têtes explicites :

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
à un fil Codex existant, le tour suivant envoie de nouveau au
serveur d’application le modèle OpenAI actuellement sélectionné, le fournisseur, la politique d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison de fil mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin intégré enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité live du serveur d’application, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles live du serveur d’application Codex.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un fil Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le fil attaché.
- `/codex review` démarre une revue native Codex pour le fil attaché.
- `/codex account` affiche le compte et l’état des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` liste les Skills du serveur d’application Codex.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour les
tours normaux. Au message suivant, OpenClaw reprend ce fil Codex, transmet le
modèle OpenClaw actuellement sélectionné au serveur d’application, et garde l’historique étendu
activé.

La surface de commande exige un serveur d’application Codex `0.118.0` ou plus récent. Les méthodes de
contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
serveur d’application futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Frontières des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                  | Propriétaire              | But                                                                 |
| --------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw                | OpenClaw                  | Compatibilité produit/Plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins intégrés OpenClaw | Comportement d’adaptation par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                      | Codex                     | Cycle de vie bas niveau de Codex et politique d’outils natifs depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers de projet ou globaux `hooks.json` de Codex pour router le
comportement des plugins OpenClaw. Les hooks natifs Codex sont utiles pour les opérations
détenues par Codex telles que la politique shell, la revue native des résultats d’outils, la gestion de l’arrêt, et le cycle de vie natif de Compaction/modèle, mais ils ne constituent pas l’API de Plugin OpenClaw.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware qu’il possède dans l’adaptateur
de harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le fil natif Codex
à moins que Codex n’expose cette opération via le serveur d’application ou des callbacks de hook natifs.

Lorsque de nouvelles versions du serveur d’application Codex exposeront des événements natifs de hook pour la Compaction et le cycle de vie du modèle, OpenClaw devra version-garder cette prise en charge du protocole et mapper les
événements vers le contrat de hook OpenClaw existant lorsque la sémantique est honnête.
Jusqu’à alors, les événements `before_compaction`, `after_compaction`, `llm_input`, et
`llm_output` d’OpenClaw sont des observations au niveau adaptateur, pas des captures octet pour octet
de la requête interne de Codex ou de la charge utile de Compaction.

## Outils, médias et Compaction

Le harnais Codex ne change que l’exécuteur d’agent embarqué de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin normal de livraison OpenClaw.

Les sollicitations d’approbation d’outil MCP Codex sont routées via le flux d’approbation de Plugin OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les prompts Codex `request_user_input` sont renvoyés dans le
chat d’origine, et le message de suivi suivant en file répond à cette demande native
du serveur au lieu d’être orienté comme contexte supplémentaire. Les autres demandes de sollicitation MCP échouent toujours en mode fermé par défaut.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native de fil est déléguée au serveur d’application Codex. OpenClaw conserve un miroir de transcription pour l’historique de canal, la recherche, `/new`, `/reset`, et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant, et des enregistrements légers de raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw enregistre uniquement les signaux natifs de début et de fin de Compaction. Il n’expose pas encore un résumé de Compaction lisible par l’humain ni une liste auditable des entrées que Codex a conservées après la Compaction.

Parce que Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit pas actuellement les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session détenue par OpenClaw.

La génération de médias n’exige pas PI. L’image, la vidéo, la musique, le PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres de fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
sélectionnez un modèle `openai/gpt-*` avec `embeddedHarness.runtime: "codex"` (ou une
ancienne référence `codex/*`), et vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise PI au lieu de Codex :** si aucun harnais Codex ne revendique l’exécution,
OpenClaw peut utiliser PI comme backend de compatibilité. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests, ou
`embeddedHarness.fallback: "none"` pour échouer lorsqu’aucun harnais de Plugin ne correspond. Une fois
le serveur d’application Codex sélectionné, ses échecs remontent directement sans configuration de repli supplémentaire.

**Le serveur d’application est rejeté :** mettez à jour Codex afin que le handshake du serveur d’application
signale la version `0.118.0` ou plus récente.

**La discovery de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la discovery.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant parle la même version de protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`embeddedHarness.runtime: "codex"` (ou sélectionné une ancienne référence `codex/*`). Les références simples
`openai/gpt-*` et les autres références fournisseurs restent sur leur chemin normal de fournisseur.

## Lié

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Testing](/fr/help/testing-live#live-codex-app-server-harness-smoke)
