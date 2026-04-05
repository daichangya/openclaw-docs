---
read_when:
    - Ajout d'une nouvelle capacité principale et d'une surface d'enregistrement de plugin
    - 'Décision sur l''emplacement du code : cœur, plugin fournisseur ou plugin de fonctionnalité'
    - Câblage d'un nouvel assistant d'exécution pour les canaux ou les outils
sidebarTitle: Adding Capabilities
summary: Guide du contributeur pour ajouter une nouvelle capacité partagée au système de plugins OpenClaw
title: Ajouter des capacités (guide du contributeur)
x-i18n:
    generated_at: "2026-04-05T12:55:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Ajouter des capacités

<Info>
  Ceci est un **guide du contributeur** pour les développeurs du cœur d'OpenClaw. Si vous
  créez un plugin externe, consultez plutôt [Building Plugins](/fr/plugins/building-plugins).
</Info>

Utilisez ceci lorsque OpenClaw a besoin d'un nouveau domaine, comme la génération d'images, la
génération de vidéos ou un futur domaine de fonctionnalité pris en charge par un fournisseur.

La règle :

- plugin = limite de responsabilité
- capability = contrat principal partagé

Cela signifie que vous ne devez pas commencer par connecter un fournisseur directement à un canal ou à un
outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque tous les points suivants sont vrais :

1. plus d'un fournisseur pourrait vraisemblablement l'implémenter
2. les canaux, outils ou plugins de fonctionnalité doivent la consommer sans se soucier
   du fournisseur
3. le cœur doit être propriétaire du comportement de repli, des règles, de la configuration ou de la diffusion

Si le travail est limité à un fournisseur et qu'aucun contrat partagé n'existe encore, arrêtez-vous et définissez
d'abord le contrat.

## La séquence standard

1. Définir le contrat principal typé.
2. Ajouter l'enregistrement de plugin pour ce contrat.
3. Ajouter un assistant d'exécution partagé.
4. Connecter un vrai plugin fournisseur comme preuve.
5. Faire passer les consommateurs de fonctionnalité/canal à l'assistant d'exécution.
6. Ajouter des tests de contrat.
7. Documenter la configuration destinée aux opérateurs et le modèle de responsabilité.

## Ce qui va où

Cœur :

- types de requête/réponse
- registre des fournisseurs + résolution
- comportement de repli
- schéma de configuration plus métadonnées de documentation `title` / `description` propagées sur les nœuds d'objet imbriqué, wildcard, élément de tableau et composition
- surface d'assistant d'exécution

Plugin fournisseur :

- appels d'API du fournisseur
- gestion de l'authentification du fournisseur
- normalisation des requêtes spécifique au fournisseur
- enregistrement de l'implémentation de la capacité

Plugin de fonctionnalité/canal :

- appelle `api.runtime.*` ou l'assistant `plugin-sdk/*-runtime` correspondant
- n'appelle jamais directement une implémentation de fournisseur

## Liste de fichiers à vérifier

Pour une nouvelle capacité, attendez-vous à modifier ces zones :

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- un ou plusieurs packages de plugins groupés
- config/docs/tests

## Exemple : génération d'images

La génération d'images suit la forme standard :

1. le cœur définit `ImageGenerationProvider`
2. le cœur expose `registerImageGenerationProvider(...)`
3. le cœur expose `runtime.imageGeneration.generate(...)`
4. les plugins `openai`, `google`, `fal` et `minimax` enregistrent des implémentations prises en charge par des fournisseurs
5. les futurs fournisseurs peuvent enregistrer le même contrat sans modifier les canaux/outils

La clé de configuration est distincte du routage d'analyse de vision :

- `agents.defaults.imageModel` = analyser des images
- `agents.defaults.imageGenerationModel` = générer des images

Gardez-les séparés afin que le comportement de repli et les règles restent explicites.

## Liste de vérification de revue

Avant de livrer une nouvelle capacité, vérifiez :

- aucun canal/outil n'importe directement du code fournisseur
- l'assistant d'exécution est le chemin partagé
- au moins un test de contrat affirme la responsabilité du bundle
- la documentation de configuration nomme la nouvelle clé de modèle/configuration
- la documentation des plugins explique la limite de responsabilité

Si une PR ignore la couche de capacité et code en dur le comportement fournisseur dans un
canal/outil, renvoyez-la et définissez d'abord le contrat.
