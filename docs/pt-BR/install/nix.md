---
read_when:
    - Você quer instalações reprodutíveis e com rollback
    - Você já usa Nix/NixOS/Home Manager
    - Você quer tudo fixado e gerenciado declarativamente
summary: Instale o OpenClaw de forma declarativa com Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T12:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Instalação com Nix

Instale o OpenClaw de forma declarativa com **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- um módulo Home Manager completo, com tudo incluído.

<Info>
O repositório [nix-openclaw](https://github.com/openclaw/nix-openclaw) é a fonte de verdade para a instalação com Nix. Esta página é uma visão geral rápida.
</Info>

## O que você recebe

- Gateway + app para macOS + ferramentas (whisper, spotify, câmeras) -- tudo fixado
- Serviço launchd que sobrevive a reinicializações
- Sistema de plugins com configuração declarativa
- Rollback instantâneo: `home-manager switch --rollback`

## Início rápido

<Steps>
  <Step title="Instalar Determinate Nix">
    Se o Nix ainda não estiver instalado, siga as instruções do [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Criar um flake local">
    Use o modelo agent-first do repositório nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copie templates/agent-first/flake.nix do repositório nix-openclaw
    ```
  </Step>
  <Step title="Configurar segredos">
    Configure seu token de bot de mensagens e a API key do provider de modelo. Arquivos simples em `~/.secrets/` funcionam bem.
  </Step>
  <Step title="Preencher os placeholders do modelo e aplicar a configuração">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirme que o serviço launchd está em execução e que seu bot responde às mensagens.
  </Step>
</Steps>

Consulte o [README do nix-openclaw](https://github.com/openclaw/nix-openclaw) para opções completas do módulo e exemplos.

## Comportamento de runtime no modo Nix

Quando `OPENCLAW_NIX_MODE=1` está definido (automático com nix-openclaw), o OpenClaw entra em um modo determinístico que desativa fluxos de instalação automática.

Você também pode defini-lo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

No macOS, o app com GUI não herda automaticamente variáveis de ambiente do shell. Ative o modo Nix via defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### O que muda no modo Nix

- Fluxos de instalação automática e automutação são desativados
- Dependências ausentes exibem mensagens de remediação específicas para Nix
- A UI exibe um banner somente leitura para o modo Nix

### Caminhos de configuração e estado

O OpenClaw lê configuração JSON5 de `OPENCLAW_CONFIG_PATH` e armazena dados mutáveis em `OPENCLAW_STATE_DIR`. Ao executar sob Nix, defina esses caminhos explicitamente para locais gerenciados pelo Nix, para que o estado de runtime e a configuração fiquem fora do armazenamento imutável.

| Variável               | Padrão                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## Relacionado

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guia completo de configuração
- [Wizard](/pt-BR/start/wizard) -- configuração da CLI sem Nix
- [Docker](/install/docker) -- configuração em contêiner
