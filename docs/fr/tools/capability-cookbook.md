---
read_when:
    - Ajouter une nouvelle capacité cœur et une surface d’enregistrement de plugin
    - Décider si le code appartient au cœur, à un plugin fournisseur, ou à un plugin de fonctionnalité
    - Câbler un nouveau helper runtime pour les canaux ou les outils
sidebarTitle: Adding Capabilities
summary: Guide du contributeur pour ajouter une nouvelle capacité partagée au système de plugins OpenClaw
title: Ajouter des capacités (guide du contributeur)
x-i18n:
    generated_at: "2026-04-24T07:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Ceci est un **guide du contributeur** pour les développeurs du cœur OpenClaw. Si vous
  construisez un plugin externe, voir plutôt [Créer des plugins](/fr/plugins/building-plugins).
</Info>

Utilisez ceci lorsqu’OpenClaw a besoin d’un nouveau domaine comme la génération d’image, la génération vidéo, ou toute future zone de fonctionnalité adossée à un fournisseur.

La règle :

- plugin = frontière de responsabilité
- capacité = contrat cœur partagé

Cela signifie que vous ne devez pas commencer par câbler un fournisseur directement dans un canal ou un
outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque toutes les conditions suivantes sont vraies :

1. plus d’un fournisseur pourrait raisonnablement l’implémenter
2. les canaux, outils ou plugins de fonctionnalité devraient la consommer sans se soucier du fournisseur
3. le cœur doit posséder le comportement de repli, la politique, la configuration ou la livraison

Si le travail est uniquement propre à un fournisseur et qu’aucun contrat partagé n’existe encore, arrêtez-vous et définissez d’abord le contrat.

## Séquence standard

1. Définir le contrat cœur typé.
2. Ajouter l’enregistrement de plugin pour ce contrat.
3. Ajouter un helper runtime partagé.
4. Câbler un vrai plugin fournisseur comme preuve.
5. Faire passer les consommateurs de fonctionnalité/canal par le helper runtime.
6. Ajouter des tests de contrat.
7. Documenter la configuration orientée opérateur et le modèle de responsabilité.

## Ce qui va où

Cœur :

- types requête/réponse
- registre de fournisseurs + résolution
- comportement de repli
- schéma de configuration plus métadonnées de documentation `title` / `description` propagées sur les nœuds d’objet imbriqué, joker, élément de tableau et composition
- surface de helper runtime

Plugin fournisseur :

- appels API du fournisseur
- gestion de l’authentification du fournisseur
- normalisation de requête spécifique au fournisseur
- enregistrement de l’implémentation de la capacité

Plugin de fonctionnalité/canal :

- appelle `api.runtime.*` ou le helper `plugin-sdk/*-runtime` correspondant
- n’appelle jamais directement une implémentation fournisseur

## Checklist de fichiers

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
- un ou plusieurs packages de plugins inclus
- config/docs/tests

## Exemple : génération d’image

La génération d’image suit la forme standard :

1. le cœur définit `ImageGenerationProvider`
2. le cœur expose `registerImageGenerationProvider(...)`
3. le cœur expose `runtime.imageGeneration.generate(...)`
4. les plugins `openai`, `google`, `fal`, et `minimax` enregistrent des implémentations adossées à des fournisseurs
5. les futurs fournisseurs peuvent enregistrer le même contrat sans modifier les canaux/outils

La clé de configuration est distincte du routage d’analyse de vision :

- `agents.defaults.imageModel` = analyser les images
- `agents.defaults.imageGenerationModel` = générer des images

Gardez-les séparés afin que le repli et la politique restent explicites.

## Checklist de revue

Avant de livrer une nouvelle capacité, vérifiez :

- aucun canal/outil n’importe directement du code fournisseur
- le helper runtime est le chemin partagé
- au moins un test de contrat affirme la responsabilité des éléments inclus
- la documentation de configuration nomme la nouvelle clé de modèle/configuration
- la documentation des plugins explique la frontière de responsabilité

Si une PR saute la couche de capacité et code en dur le comportement fournisseur dans un
canal/outil, renvoyez-la et définissez d’abord le contrat.

## Articles connexes

- [Plugin](/fr/tools/plugin)
- [Créer des Skills](/fr/tools/creating-skills)
- [Outils et plugins](/fr/tools)
