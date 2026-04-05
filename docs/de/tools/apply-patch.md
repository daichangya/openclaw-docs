---
read_when:
    - Du benötigst strukturierte Dateibearbeitungen über mehrere Dateien hinweg
    - Du möchtest patchbasierte Bearbeitungen dokumentieren oder debuggen
summary: Dateiänderungen über mehrere Dateien mit dem Tool apply_patch anwenden
title: apply_patch-Tool
x-i18n:
    generated_at: "2026-04-05T12:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# apply_patch-Tool

Wende Dateiänderungen mit einem strukturierten Patch-Format an. Das ist ideal für Bearbeitungen über mehrere Dateien
oder mehrere Hunk-Blöcke, bei denen ein einzelner `edit`-Aufruf fragil wäre.

Das Tool akzeptiert einen einzelnen `input`-String, der eine oder mehrere Dateioperationen umschließt:

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

## Parameter

- `input` (erforderlich): Vollständiger Patch-Inhalt einschließlich `*** Begin Patch` und `*** End Patch`.

## Hinweise

- Patch-Pfade unterstützen relative Pfade (ausgehend vom Workspace-Verzeichnis) und absolute Pfade.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace beschränkt). Setze es nur dann auf `false`, wenn du absichtlich möchtest, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.
- Verwende `*** Move to:` innerhalb eines `*** Update File:`-Hunks, um Dateien umzubenennen.
- `*** End of File` markiert bei Bedarf eine reine EOF-Einfügung.
- Standardmäßig verfügbar für OpenAI- und OpenAI Codex-Modelle. Setze
  `tools.exec.applyPatch.enabled: false`, um es zu deaktivieren.
- Optional per Modell einschränkbar über
  `tools.exec.applyPatch.allowModels`.
- Die Konfiguration liegt nur unter `tools.exec`.

## Beispiel

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
