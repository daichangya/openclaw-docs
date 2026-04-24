---
read_when:
    - Vous voulez activer ou configurer code_execution
    - Vous voulez une analyse distante sans accès shell local
    - Vous voulez combiner x_search ou web_search avec une analyse Python distante
summary: code_execution -- exécuter une analyse Python distante sandboxée avec xAI
title: exécution de code
x-i18n:
    generated_at: "2026-04-24T07:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` exécute une analyse Python distante sandboxée sur l’API Responses de xAI.
C’est différent de l’outil local [`exec`](/fr/tools/exec) :

- `exec` exécute des commandes shell sur votre machine ou votre nœud
- `code_execution` exécute du Python dans le sandbox distant de xAI

Utilisez `code_execution` pour :

- les calculs
- la tabulation
- les statistiques rapides
- les analyses de type graphique
- l’analyse de données renvoyées par `x_search` ou `web_search`

Ne l’utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d’appareils associés. Utilisez plutôt [`exec`](/fr/tools/exec).

## Configuration

Vous avez besoin d’une clé API xAI. N’importe laquelle de celles-ci fonctionne :

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

## Comment l’utiliser

Demandez naturellement et explicitez l’intention d’analyse :

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

L’outil prend en interne un seul paramètre `task`, donc l’agent doit envoyer
la requête d’analyse complète et toutes les données en ligne dans un seul prompt.

## Limites

- Il s’agit d’une exécution xAI distante, pas d’une exécution de processus locale.
- Cela doit être traité comme une analyse éphémère, pas comme un notebook persistant.
- Ne supposez pas l’accès aux fichiers locaux ni à votre espace de travail.
- Pour des données X récentes, utilisez d’abord [`x_search`](/fr/tools/web#x_search).

## Liens associés

- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)
- [Outil apply_patch](/fr/tools/apply-patch)
- [Outils Web](/fr/tools/web)
- [xAI](/fr/providers/xai)
