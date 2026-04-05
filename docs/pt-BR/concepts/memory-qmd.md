---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reranking ou caminhos indexados extras
summary: Sidecar de pesquisa local-first com BM25, vetores, reranking e expansão de consulta
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-04-05T12:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Mecanismo de memória QMD

[QMD](https://github.com/tobi/qmd) é um sidecar de pesquisa local-first que é executado
junto com o OpenClaw. Ele combina BM25, pesquisa vetorial e reranking em um único
binário, e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele adiciona em relação ao integrado

- **Reranking e expansão de consulta** para melhor recall.
- **Indexação de diretórios extras** -- documentação do projeto, notas da equipe, qualquer coisa em disco.
- **Indexação de transcrições de sessão** -- recorde conversas anteriores.
- **Totalmente local** -- executa via Bun + node-llama-cpp, com download automático de modelos GGUF.
- **Fallback automático** -- se o QMD não estiver disponível, o OpenClaw faz fallback para o
  mecanismo integrado sem interrupções.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `bun install -g @tobilu/qmd`
- Build do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do gateway.
- macOS e Linux funcionam imediatamente. O Windows é melhor compatível via WSL2.

### Ativar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria um diretório home do QMD autocontido em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida do sidecar
-- coleções, atualizações e execuções de embedding são tratadas para você.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos arquivos de memória do seu workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` + `qmd embed` na inicialização
  e periodicamente (o padrão é a cada 5 minutos).
- A atualização na inicialização é executada em segundo plano para que o início do chat não seja bloqueado.
- As pesquisas usam o `searchMode` configurado (padrão: `search`; também oferece suporte a
  `vsearch` e `query`). Se um modo falhar, o OpenClaw tenta novamente com `qmd query`.
- Se o QMD falhar por completo, o OpenClaw faz fallback para o mecanismo SQLite integrado.

<Info>
A primeira pesquisa pode ser lenta -- o QMD faz download automático de modelos GGUF (~2 GB) para
reranking e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Indexação de caminhos extras

Aponte o QMD para diretórios adicionais para torná-los pesquisáveis:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Trechos de caminhos extras aparecem como `qmd/<collection>/<relative-path>` nos
resultados de pesquisa. `memory_get` entende esse prefixo e lê da raiz da coleção
correta.

## Indexação de transcrições de sessão

Ative a indexação de sessão para recordar conversas anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

As transcrições são exportadas como turnos higienizados de User/Assistant para uma coleção QMD
dedicada em `~/.openclaw/agents/<id>/qmd/sessions/`.

## Escopo de pesquisa

Por padrão, os resultados de pesquisa do QMD só são exibidos em sessões de DM (não em grupos ou
canais). Configure `memory.qmd.scope` para alterar isso:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quando o escopo nega uma pesquisa, o OpenClaw registra um aviso com o canal derivado e
o tipo de chat para que resultados vazios sejam mais fáceis de depurar.

## Citações

Quando `memory.citations` é `auto` ou `on`, trechos de pesquisa incluem um
rodapé `Source: <path#line>`. Defina `memory.citations = "off"` para omitir o rodapé
enquanto ainda passa o caminho ao agente internamente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranking para resultados de maior qualidade.
- Pesquisar documentação do projeto ou notas fora do workspace.
- Recordar conversas de sessões anteriores.
- Pesquisa totalmente local sem chaves de API.

Para configurações mais simples, o [mecanismo integrado](/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Verifique se o binário está no `PATH` do gateway. Se o OpenClaw
for executado como serviço, crie um link simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Primeira pesquisa muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça o pre-warm
com `qmd query "test"` usando os mesmos diretórios XDG que o OpenClaw usa.

**A pesquisa expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina `120000` para hardware mais lento.

**Resultados vazios em chats de grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões de DM.

**Repositórios temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
A travessia do QMD atualmente segue o comportamento do scanner QMD subjacente em vez das
regras integradas de link simbólico do OpenClaw. Mantenha checkouts temporários de monorepo em
diretórios ocultos como `.tmp/` ou fora das raízes QMD indexadas até que o QMD exponha
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para a superfície completa de configuração (`memory.qmd.*`), modos de pesquisa, intervalos de atualização,
regras de escopo e todos os outros controles, consulte a
[referência de configuração de memória](/reference/memory-config).
