---
read_when:
    - Executar scripts do repositório
    - Adicionar ou alterar scripts em ./scripts
summary: 'Scripts do repositório: finalidade, escopo e observações de segurança'
title: Scripts
x-i18n:
    generated_at: "2026-04-05T12:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Scripts

O diretório `scripts/` contém scripts auxiliares para fluxos de trabalho locais e tarefas operacionais.
Use-os quando uma tarefa estiver claramente vinculada a um script; caso contrário, prefira a CLI.

## Convenções

- Scripts são **opcionais**, a menos que sejam referenciados na documentação ou em checklists de release.
- Prefira superfícies da CLI quando existirem (exemplo: o monitoramento de autenticação usa `openclaw models status --check`).
- Considere que scripts são específicos do host; leia-os antes de executá-los em uma nova máquina.

## Scripts de monitoramento de autenticação

O monitoramento de autenticação é abordado em [Autenticação](/gateway/authentication). Os scripts em `scripts/` são extras opcionais para fluxos com systemd/Termux em telefone.

## Ao adicionar scripts

- Mantenha os scripts focados e documentados.
- Adicione uma entrada curta na documentação relevante (ou crie uma, se estiver faltando).
