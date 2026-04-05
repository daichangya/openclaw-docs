---
read_when:
    - Você quer memória persistente que funcione entre sessões e canais
    - Você quer recuperação baseada em IA e modelagem de usuário
summary: Memória entre sessões nativa para IA via plugin Honcho
title: Memória Honcho
x-i18n:
    generated_at: "2026-04-05T12:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Memória Honcho

[Honcho](https://honcho.dev) adiciona memória nativa para IA ao OpenClaw. Ele persiste
conversas em um serviço dedicado e constrói modelos de usuário e agente ao longo do tempo,
dando ao seu agente contexto entre sessões que vai além de arquivos Markdown
do workspace.

## O que ele oferece

- **Memória entre sessões** -- as conversas são persistidas após cada turno, então
  o contexto é mantido entre redefinições de sessão, compactação e trocas de canal.
- **Modelagem de usuário** -- o Honcho mantém um perfil para cada usuário (preferências,
  fatos, estilo de comunicação) e para o agente (personalidade, comportamentos
  aprendidos).
- **Busca semântica** -- busca em observações de conversas passadas, não
  apenas na sessão atual.
- **Consciência de múltiplos agentes** -- agentes pai rastreiam automaticamente
  subagentes iniciados, com os pais adicionados como observadores nas sessões filhas.

## Ferramentas disponíveis

O Honcho registra ferramentas que o agente pode usar durante a conversa:

**Recuperação de dados (rápida, sem chamada de LLM):**

| Tool                        | O que faz                                            |
| --------------------------- | ---------------------------------------------------- |
| `honcho_context`            | Representação completa do usuário entre sessões      |
| `honcho_search_conclusions` | Busca semântica nas conclusões armazenadas           |
| `honcho_search_messages`    | Encontra mensagens entre sessões (filtra por remetente, data) |
| `honcho_session`            | Histórico e resumo da sessão atual                   |

**Perguntas e respostas (com LLM):**

| Tool         | O que faz                                                                   |
| ------------ | ---------------------------------------------------------------------------- |
| `honcho_ask` | Faz perguntas sobre o usuário. `depth='quick'` para fatos, `'thorough'` para síntese |

## Primeiros passos

Instale o plugin e execute a configuração:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

O comando de configuração solicita suas credenciais de API, grava a configuração e,
opcionalmente, migra arquivos de memória existentes do workspace.

<Info>
O Honcho pode ser executado inteiramente de forma local (auto-hospedado) ou via API gerenciada em
`api.honcho.dev`. Nenhuma dependência externa é necessária para a opção
auto-hospedada.
</Info>

## Configuração

As configurações ficam em `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omita para auto-hospedado
          workspaceId: "openclaw", // isolamento de memória
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Para instâncias auto-hospedadas, aponte `baseUrl` para seu servidor local (por exemplo
`http://localhost:8000`) e omita a chave de API.

## Migrando memória existente

Se você já tiver arquivos de memória existentes do workspace (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` os detecta e
oferece a migração.

<Info>
A migração não é destrutiva -- os arquivos são enviados para o Honcho. Os originais
nunca são excluídos nem movidos.
</Info>

## Como funciona

Após cada turno de IA, a conversa é persistida no Honcho. Tanto mensagens do usuário quanto do
agente são observadas, permitindo que o Honcho construa e refine seus modelos ao longo do
tempo.

Durante a conversa, as ferramentas do Honcho consultam o serviço na fase `before_prompt_build`,
injetando contexto relevante antes que o modelo veja o prompt. Isso garante
limites de turno precisos e recuperação relevante.

## Honcho vs memória integrada

|                   | Integrada / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Armazenamento** | Arquivos Markdown do workspace | Serviço dedicado (local ou hospedado) |
| **Entre sessões** | Via arquivos de memória        | Automática, integrada               |
| **Modelagem de usuário** | Manual (gravar em `MEMORY.md`) | Perfis automáticos            |
| **Busca**         | Vetorial + palavra-chave (híbrida) | Semântica sobre observações     |
| **Múltiplos agentes** | Não rastreado              | Consciência de pai/filho            |
| **Dependências**  | Nenhuma (integrada) ou binário QMD | Instalação de plugin            |

O Honcho e o sistema de memória integrado podem funcionar juntos. Quando o QMD está configurado,
ferramentas adicionais ficam disponíveis para buscar em arquivos Markdown locais junto com a memória entre sessões do Honcho.

## Comandos da CLI

```bash
openclaw honcho setup                        # Configura a chave de API e migra arquivos
openclaw honcho status                       # Verifica o status da conexão
openclaw honcho ask <question>               # Consulta o Honcho sobre o usuário
openclaw honcho search <query> [-k N] [-d D] # Busca semântica na memória
```

## Leitura adicional

- [Código-fonte do plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentação do Honcho](https://docs.honcho.dev)
- [Guia de integração do Honcho com OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- visão geral da memória no OpenClaw
- [Context Engines](/concepts/context-engine) -- como funcionam os mecanismos de contexto de plugins
