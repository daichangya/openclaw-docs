---
read_when:
    - Vous avez besoin de modifications structurées de fichiers sur plusieurs fichiers
    - Vous voulez documenter ou déboguer des modifications basées sur des correctifs
summary: Appliquer des correctifs multi-fichiers avec l'outil apply_patch
title: Outil apply_patch
x-i18n:
    generated_at: "2026-04-05T12:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# outil apply_patch

Appliquez des modifications de fichiers à l'aide d'un format de correctif structuré. C'est idéal pour les modifications multi-fichiers
ou multi-sections où un seul appel `edit` serait fragile.

L'outil accepte une seule chaîne `input` qui encapsule une ou plusieurs opérations sur des fichiers :

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Paramètres

- `input` (obligatoire) : contenu complet du correctif, y compris `*** Begin Patch` et `*** End Patch`.

## Remarques

- Les chemins du correctif prennent en charge les chemins relatifs (depuis le répertoire de travail) et les chemins absolus.
- `tools.exec.applyPatch.workspaceOnly` est défini par défaut sur `true` (limité au workspace). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de travail.
- Utilisez `*** Move to:` dans une section `*** Update File:` pour renommer des fichiers.
- `*** End of File` marque une insertion uniquement en fin de fichier si nécessaire.
- Disponible par défaut pour les modèles OpenAI et OpenAI Codex. Définissez
  `tools.exec.applyPatch.enabled: false` pour le désactiver.
- Vous pouvez éventuellement le restreindre par modèle via
  `tools.exec.applyPatch.allowModels`.
- La configuration se trouve uniquement sous `tools.exec`.

## Exemple

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
