---
read_when:
    - Vous voulez activer ou configurer code_execution
    - Vous voulez une analyse distante sans accès au shell local
    - Vous voulez combiner x_search ou web_search avec une analyse Python distante
summary: code_execution -- exécuter une analyse Python distante en bac à sable avec xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T12:55:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` exécute une analyse Python distante en bac à sable sur l'API Responses de xAI.
Cela diffère de [`exec`](/tools/exec) en local :

- `exec` exécute des commandes shell sur votre machine ou nœud
- `code_execution` exécute Python dans le bac à sable distant de xAI

Utilisez `code_execution` pour :

- les calculs
- la tabulation
- des statistiques rapides
- une analyse de type graphique
- l'analyse de données renvoyées par `x_search` ou `web_search`

Ne l'utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d'appareils appairés. Utilisez plutôt [`exec`](/tools/exec) dans ce cas.

## Configuration

Vous avez besoin d'une clé API xAI. N'importe laquelle de ces options fonctionne :

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Exemple :

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Comment l'utiliser

Formulez votre demande naturellement et explicitez l'intention d'analyse :

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

L'outil prend en interne un seul paramètre `task`, donc l'agent doit envoyer
la demande d'analyse complète et toutes les données en ligne dans un seul prompt.

## Limites

- Il s'agit d'une exécution distante xAI, pas d'une exécution de processus locale.
- Cela doit être traité comme une analyse éphémère, et non comme un notebook persistant.
- Ne supposez pas l'accès à des fichiers locaux ni à votre workspace.
- Pour des données X récentes, utilisez d'abord [`x_search`](/tools/web#x_search).

## Voir aussi

- [Outils web](/tools/web)
- [Exec](/tools/exec)
- [xAI](/fr/providers/xai)
