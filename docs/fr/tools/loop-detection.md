---
read_when:
    - Un utilisateur signale que des agents restent bloqués en répétant des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques d’outil/d’exécution des agents
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection de boucle d’outils
x-i18n:
    generated_at: "2026-04-24T07:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw peut empêcher les agents de se retrouver bloqués dans des schémas répétés d’appels d’outils.
Cette protection est **désactivée par défaut**.

Activez-la uniquement là où c’est nécessaire, car avec des paramètres stricts elle peut bloquer des appels répétés légitimes.

## Pourquoi cela existe

- Détecter des séquences répétitives qui n’avancent pas.
- Détecter des boucles à haute fréquence sans résultat (même outil, mêmes entrées, erreurs répétées).
- Détecter des schémas spécifiques d’appels répétés pour des outils de sondage connus.

## Bloc de configuration

Valeurs globales par défaut :

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Remplacement par agent (facultatif) :

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportement des champs

- `enabled` : interrupteur principal. `false` signifie qu’aucune détection de boucle n’est effectuée.
- `historySize` : nombre d’appels d’outils récents conservés pour l’analyse.
- `warningThreshold` : seuil avant de classer un schéma comme avertissement uniquement.
- `criticalThreshold` : seuil pour bloquer les schémas de boucle répétitifs.
- `globalCircuitBreakerThreshold` : seuil global du coupe-circuit en cas d’absence de progression.
- `detectors.genericRepeat` : détecte les schémas répétés même outil + mêmes paramètres.
- `detectors.knownPollNoProgress` : détecte les schémas de type sondage connus sans changement d’état.
- `detectors.pingPong` : détecte les schémas alternés de ping-pong.

## Configuration recommandée

- Commencez avec `enabled: true`, sans modifier les valeurs par défaut.
- Gardez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- En cas de faux positifs :
  - augmentez `warningThreshold` et/ou `criticalThreshold`
  - augmentez éventuellement `globalCircuitBreakerThreshold`
  - désactivez uniquement le détecteur qui pose problème
  - réduisez `historySize` pour un contexte historique moins strict

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et bloque ou atténue le cycle d’outil suivant selon la gravité.
Cela protège les utilisateurs contre des dépenses excessives en jetons et les blocages, tout en préservant un accès normal aux outils.

- Préférez d’abord l’avertissement et la suppression temporaire.
- Ne faites remonter la sévérité que lorsque des preuves répétées s’accumulent.

## Remarques

- `tools.loopDetection` est fusionné avec les remplacements au niveau de l’agent.
- La configuration par agent remplace complètement ou étend les valeurs globales.
- Si aucune configuration n’existe, les garde-fous restent désactivés.

## Voir aussi

- [Approbations Exec](/fr/tools/exec-approvals)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
