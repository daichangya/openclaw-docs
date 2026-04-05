---
read_when:
    - Você precisa de edições estruturadas de arquivos em vários arquivos
    - Você quer documentar ou depurar edições baseadas em patch
summary: Aplique patches em vários arquivos com a ferramenta apply_patch
title: Ferramenta apply_patch
x-i18n:
    generated_at: "2026-04-05T12:53:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# ferramenta apply_patch

Aplique mudanças em arquivos usando um formato estruturado de patch. Isso é ideal para edições com vários arquivos
ou vários hunks, em que uma única chamada `edit` seria frágil.

A ferramenta aceita uma única string `input` que encapsula uma ou mais operações de arquivo:

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

## Parâmetros

- `input` (obrigatório): Conteúdo completo do patch, incluindo `*** Begin Patch` e `*** End Patch`.

## Observações

- Caminhos no patch oferecem suporte a caminhos relativos (a partir do diretório do workspace) e caminhos absolutos.
- `tools.exec.applyPatch.workspaceOnly` usa `true` por padrão (contido no workspace). Defina como `false` apenas se você intencionalmente quiser que `apply_patch` escreva/exclua fora do diretório do workspace.
- Use `*** Move to:` dentro de um hunk `*** Update File:` para renomear arquivos.
- `*** End of File` marca uma inserção somente no EOF quando necessário.
- Disponível por padrão para modelos OpenAI e OpenAI Codex. Defina
  `tools.exec.applyPatch.enabled: false` para desativá-la.
- Opcionalmente, restrinja por modelo via
  `tools.exec.applyPatch.allowModels`.
- A configuração existe apenas em `tools.exec`.

## Exemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
