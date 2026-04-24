---
read_when:
    - Vous voulez des résultats d’outil `exec` ou `bash` plus courts dans OpenClaw
    - Vous voulez activer le Plugin tokenjuice intégré
    - Vous devez comprendre ce que tokenjuice modifie et ce qu’il laisse brut
summary: Compacter les résultats bruyants des outils exec et bash avec un Plugin intégré facultatif
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T07:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` est un Plugin intégré facultatif qui compacte les résultats bruyants des outils `exec` et `bash`
une fois la commande déjà exécutée.

Il modifie le `tool_result` renvoyé, pas la commande elle-même. Tokenjuice ne
réécrit pas l’entrée shell, ne réexécute pas les commandes et ne modifie pas les codes de sortie.

Aujourd’hui, cela s’applique aux exécutions embarquées sur Pi, où tokenjuice s’accroche au chemin `tool_result`
embarqué et réduit la sortie renvoyée dans la session.

## Activer le Plugin

Chemin rapide :

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Équivalent :

```bash
openclaw plugins enable tokenjuice
```

OpenClaw fournit déjà le Plugin. Il n’existe pas d’étape distincte `plugins install`
ou `tokenjuice install openclaw`.

Si vous préférez modifier directement la configuration :

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Ce que tokenjuice modifie

- Compacte les résultats bruyants de `exec` et `bash` avant qu’ils ne soient réinjectés dans la session.
- Laisse l’exécution de la commande d’origine intacte.
- Préserve les lectures exactes de contenu de fichier et les autres commandes que tokenjuice doit laisser brutes.
- Reste opt-in : désactivez le Plugin si vous voulez une sortie verbatim partout.

## Vérifier qu’il fonctionne

1. Activez le Plugin.
2. Démarrez une session capable d’appeler `exec`.
3. Exécutez une commande bruyante telle que `git status`.
4. Vérifiez que le résultat d’outil renvoyé est plus court et plus structuré que la sortie shell brute.

## Désactiver le Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou :

```bash
openclaw plugins disable tokenjuice
```

## Liens associés

- [Outil Exec](/fr/tools/exec)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Moteur de contexte](/fr/concepts/context-engine)
