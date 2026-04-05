---
read_when:
    - Ajustement des valeurs par défaut du mode élevé, des listes d’autorisation ou du comportement des commandes slash
    - Compréhension de la manière dont les agents en bac à sable peuvent accéder à l’hôte
summary: 'Mode d’exécution élevé : exécuter des commandes hors du bac à sable depuis un agent en bac à sable'
title: Mode élevé
x-i18n:
    generated_at: "2026-04-05T12:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Mode élevé

Lorsqu’un agent s’exécute dans un bac à sable, ses commandes `exec` sont limitées à l’environnement du bac à sable. Le **mode élevé** permet à l’agent d’en sortir et d’exécuter des commandes hors du bac à sable à la place, avec des garde-fous d’approbation configurables.

<Info>
  Le mode élevé ne change le comportement que lorsque l’agent est **en bac à sable**. Pour les agents hors bac à sable, `exec` s’exécute déjà sur l’hôte.
</Info>

## Directives

Contrôlez le mode élevé par session avec des commandes slash :

| Directive        | Ce qu’elle fait                                                         |
| ---------------- | ----------------------------------------------------------------------- |
| `/elevated on`   | Exécute hors du bac à sable sur le chemin d’hôte configuré, en conservant les approbations |
| `/elevated ask`  | Identique à `on` (alias)                                                |
| `/elevated full` | Exécute hors du bac à sable sur le chemin d’hôte configuré et ignore les approbations |
| `/elevated off`  | Revient à une exécution limitée au bac à sable                          |

Également disponible sous la forme `/elev on|off|ask|full`.

Envoyez `/elevated` sans argument pour voir le niveau actuel.

## Fonctionnement

<Steps>
  <Step title="Vérifier la disponibilité">
    Elevated doit être activé dans la configuration et l’expéditeur doit figurer sur la liste d’autorisation :

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
    Envoyez un message contenant uniquement une directive pour définir la valeur par défaut de la session :

    ```
    /elevated full
    ```

    Ou utilisez-la en ligne (s’applique uniquement à ce message) :

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Les commandes s’exécutent hors du bac à sable">
    Avec elevated actif, les appels `exec` quittent le bac à sable. L’hôte effectif est
    `gateway` par défaut, ou `node` lorsque la cible `exec` configurée/de session est
    `node`. En mode `full`, les approbations `exec` sont ignorées. En mode `on`/`ask`,
    les règles d’approbation configurées continuent de s’appliquer.
  </Step>
</Steps>

## Ordre de résolution

1. **Directive en ligne** dans le message (s’applique uniquement à ce message)
2. **Remplacement de session** (défini en envoyant un message ne contenant qu’une directive)
3. **Valeur par défaut globale** (`agents.defaults.elevatedDefault` dans la configuration)

## Disponibilité et listes d’autorisation

- **Garde-fou global** : `tools.elevated.enabled` (doit être `true`)
- **Liste d’autorisation de l’expéditeur** : `tools.elevated.allowFrom` avec des listes par canal
- **Garde-fou par agent** : `agents.list[].tools.elevated.enabled` (ne peut que restreindre davantage)
- **Liste d’autorisation par agent** : `agents.list[].tools.elevated.allowFrom` (l’expéditeur doit correspondre à la fois à la liste globale et à celle de l’agent)
- **Repli Discord** : si `tools.elevated.allowFrom.discord` est omis, `channels.discord.allowFrom` est utilisé comme solution de repli
- **Tous les garde-fous doivent passer** ; sinon elevated est considéré comme indisponible

Formats des entrées de liste d’autorisation :

| Préfixe                | Correspond à                    |
| ---------------------- | ------------------------------- |
| (aucun)                | ID expéditeur, E.164 ou champ From |
| `name:`                | Nom d’affichage de l’expéditeur |
| `username:`            | Nom d’utilisateur de l’expéditeur |
| `tag:`                 | Tag de l’expéditeur             |
| `id:`, `from:`, `e164:` | Ciblage explicite d’identité    |

## Ce que elevated ne contrôle pas

- **Politique d’outil** : si `exec` est refusé par la politique d’outil, elevated ne peut pas la contourner
- **Politique de sélection d’hôte** : elevated ne transforme pas `auto` en remplacement inter-hôte libre. Il utilise les règles de cible `exec` configurée/de session, en choisissant `node` uniquement lorsque la cible est déjà `node`.
- **Séparé de `/exec`** : la directive `/exec` ajuste les valeurs par défaut `exec` par session pour les expéditeurs autorisés et ne nécessite pas le mode élevé

## Liens associés

- [Outil Exec](/tools/exec) — exécution de commandes shell
- [Approbations Exec](/tools/exec-approvals) — système d’approbation et de liste d’autorisation
- [Sandboxing](/fr/gateway/sandboxing) — configuration du bac à sable
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
