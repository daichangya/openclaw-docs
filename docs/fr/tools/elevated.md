---
read_when:
    - ajustement des valeurs par défaut, listes d’autorisation ou comportement des commandes slash du mode Elevated
    - comprendre comment des agents sandboxés peuvent accéder à l’hôte
summary: 'mode exec Elevated : exécuter des commandes hors du sandbox depuis un agent sandboxé'
title: mode Elevated
x-i18n:
    generated_at: "2026-04-24T07:35:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Lorsqu’un agent s’exécute dans un sandbox, ses commandes `exec` sont confinées à
l’environnement sandbox. Le **mode Elevated** permet à l’agent d’en sortir et d’exécuter des commandes
hors du sandbox à la place, avec des barrières d’approbation configurables.

<Info>
  Le mode Elevated ne change le comportement que lorsque l’agent est **sandboxé**. Pour
  les agents non sandboxés, exec s’exécute déjà sur l’hôte.
</Info>

## Directives

Contrôlez le mode Elevated par session avec des commandes slash :

| Directive        | Ce qu’elle fait                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Exécute hors du sandbox sur le chemin hôte configuré, tout en gardant les approbations |
| `/elevated ask`  | Identique à `on` (alias)                                               |
| `/elevated full` | Exécute hors du sandbox sur le chemin hôte configuré et ignore les approbations |
| `/elevated off`  | Revient à une exécution confinée au sandbox                            |

Également disponible sous la forme `/elev on|off|ask|full`.

Envoyez `/elevated` sans argument pour voir le niveau courant.

## Fonctionnement

<Steps>
  <Step title="Vérifier la disponibilité">
    Elevated doit être activé dans la configuration et l’expéditeur doit être dans la liste d’autorisation :

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Définir le niveau">
    Envoyez un message ne contenant qu’une directive pour définir la valeur par défaut de la session :

    ```
    /elevated full
    ```

    Ou utilisez-la en ligne (s’applique seulement à ce message) :

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Les commandes s’exécutent hors du sandbox">
    Lorsque Elevated est actif, les appels `exec` quittent le sandbox. L’hôte effectif est
    `gateway` par défaut, ou `node` lorsque la cible exec configurée/de session est
    `node`. En mode `full`, les approbations exec sont ignorées. En mode `on`/`ask`,
    les règles d’approbation configurées s’appliquent toujours.
  </Step>
</Steps>

## Ordre de résolution

1. **Directive en ligne** dans le message (s’applique seulement à ce message)
2. **Redéfinition de session** (définie en envoyant un message ne contenant qu’une directive)
3. **Valeur par défaut globale** (`agents.defaults.elevatedDefault` dans la configuration)

## Disponibilité et listes d’autorisation

- **Barrière globale** : `tools.elevated.enabled` (doit être `true`)
- **Liste d’autorisation des expéditeurs** : `tools.elevated.allowFrom` avec listes par canal
- **Barrière par agent** : `agents.list[].tools.elevated.enabled` (ne peut que restreindre davantage)
- **Liste d’autorisation par agent** : `agents.list[].tools.elevated.allowFrom` (l’expéditeur doit correspondre à la fois à la liste globale et à celle de l’agent)
- **Repli Discord** : si `tools.elevated.allowFrom.discord` est omis, `channels.discord.allowFrom` est utilisé comme repli
- **Toutes les barrières doivent réussir** ; sinon Elevated est traité comme indisponible

Formats des entrées de liste d’autorisation :

| Préfixe                 | Correspond à                    |
| ----------------------- | ------------------------------- |
| (aucun)                 | ID expéditeur, E.164, ou champ From |
| `name:`                 | Nom affiché de l’expéditeur     |
| `username:`             | Nom d’utilisateur de l’expéditeur |
| `tag:`                  | Tag de l’expéditeur             |
| `id:`, `from:`, `e164:` | Ciblage explicite d’identité    |

## Ce que Elevated ne contrôle pas

- **Politique d’outils** : si `exec` est refusé par la politique d’outils, Elevated ne peut pas le contourner
- **Politique de sélection d’hôte** : Elevated ne transforme pas `auto` en redéfinition libre inter-hôte. Il utilise les règles configurées/de session de cible exec, en choisissant `node` uniquement lorsque la cible est déjà `node`.
- **Séparé de `/exec`** : la directive `/exec` ajuste les valeurs par défaut exec par session pour les expéditeurs autorisés et ne nécessite pas le mode Elevated

## Liens associés

- [Outil Exec](/fr/tools/exec) — exécution de commandes shell
- [Approbations Exec](/fr/tools/exec-approvals) — système d’approbation et de liste d’autorisation
- [Sandboxing](/fr/gateway/sandboxing) — configuration du sandbox
- [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
