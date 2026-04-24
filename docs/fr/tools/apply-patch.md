---
read_when:
    - Vous avez besoin de modifications structurées de fichiers sur plusieurs fichiers
    - Vous souhaitez documenter ou déboguer des modifications basées sur des correctifs
summary: Appliquer des correctifs multi-fichiers avec l’outil `apply_patch`
title: outil `apply_patch`
x-i18n:
    generated_at: "2026-04-24T07:34:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Appliquer des modifications de fichiers à l’aide d’un format de correctif structuré. C’est idéal pour des modifications multi-fichiers
ou multi-blocs où un simple appel `edit` serait fragile.

L’outil accepte une seule chaîne `input` qui encapsule une ou plusieurs opérations sur les fichiers :

```text
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

- `input` (obligatoire) : contenu complet du correctif, incluant `*** Begin Patch` et `*** End Patch`.

## Remarques

- Les chemins de correctif prennent en charge les chemins relatifs (depuis le répertoire de travail) et les chemins absolus.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de travail.
- Utilisez `*** Move to:` dans un bloc `*** Update File:` pour renommer des fichiers.
- `*** End of File` marque une insertion uniquement en fin de fichier lorsque nécessaire.
- Disponible par défaut pour les modèles OpenAI et OpenAI Codex. Définissez
  `tools.exec.applyPatch.enabled: false` pour le désactiver.
- Vous pouvez éventuellement filtrer par modèle via
  `tools.exec.applyPatch.allowModels`.
- La configuration se trouve uniquement sous `tools.exec`.

## Exemple

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Lié

- [Diffs](/fr/tools/diffs)
- [Outil Exec](/fr/tools/exec)
- [Exécution de code](/fr/tools/code-execution)
