---
read_when:
    - Sie benötigen strukturierte Dateiänderungen über mehrere Dateien hinweg
    - Sie möchten patchbasierte Änderungen dokumentieren oder debuggen
summary: Mehrdatei-Patches mit dem Tool `apply_patch` anwenden
title: Tool `apply_patch`
x-i18n:
    generated_at: "2026-04-24T07:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Dateiänderungen mit einem strukturierten Patch-Format anwenden. Das ist ideal für Änderungen über mehrere Dateien
oder mehrere Hunks hinweg, bei denen ein einzelner `edit`-Aufruf fragil wäre.

Das Tool akzeptiert eine einzelne Zeichenfolge `input`, die eine oder mehrere Dateioperationen umschließt:

```
*** Begin Patch
*** Add File: path/to/file.txt
+Zeile 1
+Zeile 2
*** Update File: src/app.ts
@@
-alte Zeile
+neue Zeile
*** Delete File: obsolete.txt
*** End Patch
```

## Parameter

- `input` (erforderlich): Vollständiger Patch-Inhalt einschließlich `*** Begin Patch` und `*** End Patch`.

## Hinweise

- Patch-Pfade unterstützen relative Pfade (vom Workspace-Verzeichnis aus) und absolute Pfade.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig auf `true` gesetzt (auf den Workspace beschränkt). Setzen Sie es nur dann auf `false`, wenn Sie absichtlich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.
- Verwenden Sie `*** Move to:` innerhalb eines `*** Update File:`-Hunks, um Dateien umzubenennen.
- `*** End of File` markiert bei Bedarf ein reines EOF-Inserat.
- Standardmäßig verfügbar für OpenAI- und OpenAI-Codex-Modelle. Setzen Sie
  `tools.exec.applyPatch.enabled: false`, um es zu deaktivieren.
- Optional nach Modell einschränken über
  `tools.exec.applyPatch.allowModels`.
- Die Konfiguration befindet sich nur unter `tools.exec`.

## Beispiel

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Verwandt

- [Diffs](/de/tools/diffs)
- [Exec tool](/de/tools/exec)
- [Code execution](/de/tools/code-execution)
