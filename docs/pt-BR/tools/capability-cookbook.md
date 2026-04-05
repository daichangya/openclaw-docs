---
read_when:
    - Ao adicionar uma nova capacidade central e uma nova superfície de registro de plugin
    - Ao decidir se o código deve ficar no core, em um plugin de fornecedor ou em um plugin de funcionalidade
    - Ao conectar um novo helper de runtime para canais ou ferramentas
sidebarTitle: Adding Capabilities
summary: Guia para colaboradores sobre como adicionar uma nova capacidade compartilhada ao sistema de plugins do OpenClaw
title: Adicionando Capacidades (Guia para Colaboradores)
x-i18n:
    generated_at: "2026-04-05T12:54:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Adicionando Capacidades

<Info>
  Este é um **guia para colaboradores** destinado a desenvolvedores do core do OpenClaw. Se você estiver
  criando um plugin externo, consulte [Criando Plugins](/plugins/building-plugins)
  em vez disso.
</Info>

Use isto quando o OpenClaw precisar de um novo domínio, como geração de imagens, geração de vídeo
ou alguma futura área de funcionalidade apoiada por fornecedor.

A regra:

- plugin = limite de propriedade
- capacidade = contrato central compartilhado

Isso significa que você não deve começar conectando um fornecedor diretamente a um canal ou a uma
ferramenta. Comece definindo a capacidade.

## Quando criar uma capacidade

Crie uma nova capacidade quando todas estas condições forem verdadeiras:

1. mais de um fornecedor puder implementá-la de forma plausível
2. canais, ferramentas ou plugins de funcionalidade precisarem consumi-la sem se preocupar com
   o fornecedor
3. o core precisar controlar fallback, política, configuração ou comportamento de entrega

Se o trabalho for específico de um fornecedor e ainda não existir contrato compartilhado, pare e defina
o contrato primeiro.

## A sequência padrão

1. Defina o contrato central tipado.
2. Adicione o registro de plugin para esse contrato.
3. Adicione um helper de runtime compartilhado.
4. Conecte um plugin real de fornecedor como prova.
5. Mova consumidores de funcionalidade/canal para o helper de runtime.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de propriedade.

## O que vai para onde

Core:

- tipos de request/response
- registro de provedores + resolução
- comportamento de fallback
- esquema de configuração mais metadados de documentação propagados de `title` / `description` em nós de objeto aninhado, wildcard, item de array e composição
- superfície de helper de runtime

Plugin de fornecedor:

- chamadas à API do fornecedor
- tratamento de autenticação do fornecedor
- normalização de request específica do fornecedor
- registro da implementação da capacidade

Plugin de funcionalidade/canal:

- chama `api.runtime.*` ou o helper correspondente `plugin-sdk/*-runtime`
- nunca chama diretamente uma implementação de fornecedor

## Checklist de arquivos

Para uma nova capacidade, espere tocar nestas áreas:

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
- um ou mais pacotes de plugins empacotados
- configuração/documentação/testes

## Exemplo: geração de imagens

A geração de imagens segue o formato padrão:

1. o core define `ImageGenerationProvider`
2. o core expõe `registerImageGenerationProvider(...)`
3. o core expõe `runtime.imageGeneration.generate(...)`
4. os plugins `openai`, `google`, `fal` e `minimax` registram implementações apoiadas por fornecedor
5. fornecedores futuros podem registrar o mesmo contrato sem alterar canais/ferramentas

A chave de configuração é separada do roteamento de análise de visão:

- `agents.defaults.imageModel` = analisar imagens
- `agents.defaults.imageGenerationModel` = gerar imagens

Mantenha esses itens separados para que fallback e política permaneçam explícitos.

## Checklist de revisão

Antes de entregar uma nova capacidade, verifique:

- nenhum canal/ferramenta importa diretamente código de fornecedor
- o helper de runtime é o caminho compartilhado
- pelo menos um teste de contrato valida a propriedade empacotada
- a documentação de configuração nomeia a nova chave de modelo/configuração
- a documentação de plugins explica o limite de propriedade

Se um PR ignorar a camada de capacidade e codificar o comportamento de fornecedor diretamente em um
canal/ferramenta, devolva-o e defina o contrato primeiro.
