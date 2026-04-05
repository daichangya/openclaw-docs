---
read_when:
    - Un utilisateur signale que des agents restent bloqués à répéter des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques d’outils/de runtime des agents
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-04-05T12:56:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# Détection des boucles d’outils

OpenClaw peut empêcher les agents de rester bloqués dans des schémas répétés d’appels d’outils.
Cette protection est **désactivée par défaut**.

Activez-la uniquement là où c’est nécessaire, car elle peut bloquer des appels répétés légitimes avec des paramètres stricts.

## Pourquoi cela existe

- Détecter des séquences répétitives qui ne progressent pas.
- Détecter des boucles à haute fréquence sans résultat (même outil, mêmes entrées, erreurs répétées).
- Détecter des schémas spécifiques d’appels répétés pour des outils de polling connus.

## Bloc de configuration

Valeurs par défaut globales :

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

Remplacement par agent (facultatif) :

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

- `enabled` : commutateur principal. `false` signifie qu’aucune détection de boucle n’est effectuée.
- `historySize` : nombre d’appels d’outils récents conservés pour l’analyse.
- `warningThreshold` : seuil avant de classer un schéma comme simple avertissement.
- `criticalThreshold` : seuil à partir duquel les schémas répétitifs de boucle sont bloqués.
- `globalCircuitBreakerThreshold` : seuil global du coupe-circuit en cas d’absence de progression.
- `detectors.genericRepeat` : détecte les schémas répétés même-outil + mêmes-paramètres.
- `detectors.knownPollNoProgress` : détecte les schémas de type polling connus sans changement d’état.
- `detectors.pingPong` : détecte les schémas alternés de ping-pong.

## Configuration recommandée

- Commencez avec `enabled: true`, sans modifier les valeurs par défaut.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si des faux positifs apparaissent :
  - augmentez `warningThreshold` et/ou `criticalThreshold`
  - (facultativement) augmentez `globalCircuitBreakerThreshold`
  - désactivez uniquement le détecteur à l’origine du problème
  - réduisez `historySize` pour un contexte historique moins strict

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et bloque ou atténue le cycle d’outil suivant selon la gravité.
Cela protège les utilisateurs contre une consommation incontrôlée de tokens et les blocages tout en préservant l’accès normal aux outils.

- Préférez d’abord l’avertissement et la suppression temporaire.
- N’escaladez que lorsque des preuves répétées s’accumulent.

## Notes

- `tools.loopDetection` est fusionné avec les remplacements au niveau de l’agent.
- La configuration par agent remplace entièrement ou étend les valeurs globales.
- Si aucune configuration n’existe, les garde-fous restent désactivés.
