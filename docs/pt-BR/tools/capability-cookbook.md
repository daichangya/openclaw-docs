---
read_when:
    - Adicionando uma nova capability central e uma superfície de registro de Plugin
    - Decidindo se o código pertence ao core, a um Plugin de fornecedor ou a um Plugin de funcionalidade
    - Conectando um novo helper de runtime para canais ou ferramentas
sidebarTitle: Adding Capabilities
summary: Guia do contribuidor para adicionar uma nova capability compartilhada ao sistema de Plugin do OpenClaw
title: Adicionando capabilities (guia do contribuidor)
x-i18n:
    generated_at: "2026-04-24T09:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Este é um **guia do contribuidor** para desenvolvedores do core do OpenClaw. Se você está
  criando um Plugin externo, consulte [Building Plugins](/pt-BR/plugins/building-plugins)
  em vez disso.
</Info>

Use isto quando o OpenClaw precisar de um novo domínio, como geração de imagens, geração de vídeo
ou alguma futura área de funcionalidade com suporte de fornecedor.

A regra:

- plugin = limite de responsabilidade
- capability = contrato central compartilhado

Isso significa que você não deve começar conectando um fornecedor diretamente a um canal ou a uma
ferramenta. Comece definindo a capability.

## Quando criar uma capability

Crie uma nova capability quando tudo isto for verdadeiro:

1. mais de um fornecedor puder implementá-la de forma plausível
2. canais, ferramentas ou Plugins de funcionalidade precisarem consumi-la sem se importar com
   o fornecedor
3. o core precisar controlar fallback, política, configuração ou comportamento de entrega

Se o trabalho for apenas de fornecedor e ainda não existir um contrato compartilhado, pare e defina
primeiro o contrato.

## A sequência padrão

1. Defina o contrato central tipado.
2. Adicione o registro de Plugin para esse contrato.
3. Adicione um helper de runtime compartilhado.
4. Conecte um Plugin real de fornecedor como prova.
5. Migre consumidores de funcionalidade/canal para o helper de runtime.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de responsabilidade.

## O que vai em cada lugar

Core:

- tipos de requisição/resposta
- registro de provedor + resolução
- comportamento de fallback
- schema de configuração mais metadados de documentação propagados de `title` / `description` em nós de objeto aninhado, curinga, item de array e composição
- superfície do helper de runtime

Plugin de fornecedor:

- chamadas à API do fornecedor
- tratamento de autenticação do fornecedor
- normalização de requisições específica do fornecedor
- registro da implementação da capability

Plugin de funcionalidade/canal:

- chama `api.runtime.*` ou o helper correspondente `plugin-sdk/*-runtime`
- nunca chama diretamente uma implementação de fornecedor

## Interfaces de provedor e Harness

Use hooks de provedor quando o comportamento pertencer ao contrato do provedor de modelo
em vez do loop genérico do agente. Exemplos incluem params de requisição específicos do provedor após a seleção de transporte, preferência de perfil de autenticação, overlays de prompt e roteamento de fallback subsequente após failover de modelo/perfil.

Use hooks de harness do agente quando o comportamento pertencer ao runtime que está
executando um turno. Harnesses podem classificar resultados de tentativa bem-sucedidos, mas inutilizáveis,
como respostas vazias, apenas de raciocínio ou apenas de planejamento, para que a política externa de fallback de modelo possa tomar a decisão de nova tentativa.

Mantenha ambas as interfaces estreitas:

- o core controla a política de retry/fallback
- Plugins de provedor controlam dicas de requisição/autenticação/roteamento específicas do provedor
- Plugins de harness controlam a classificação de tentativa específica do runtime
- Plugins de terceiros retornam dicas, não mutações diretas do estado central

## Checklist de arquivos

Para uma nova capability, espere tocar estas áreas:

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
- um ou mais pacotes de Plugin integrados
- config/docs/tests

## Exemplo: geração de imagens

A geração de imagens segue o formato padrão:

1. o core define `ImageGenerationProvider`
2. o core expõe `registerImageGenerationProvider(...)`
3. o core expõe `runtime.imageGeneration.generate(...)`
4. os Plugins `openai`, `google`, `fal` e `minimax` registram implementações com suporte de fornecedor
5. fornecedores futuros podem registrar o mesmo contrato sem alterar canais/ferramentas

A chave de configuração é separada do roteamento de análise de visão:

- `agents.defaults.imageModel` = analisar imagens
- `agents.defaults.imageGenerationModel` = gerar imagens

Mantenha isso separado para que fallback e política permaneçam explícitos.

## Checklist de revisão

Antes de entregar uma nova capability, verifique:

- nenhum canal/ferramenta importa código de fornecedor diretamente
- o helper de runtime é o caminho compartilhado
- pelo menos um teste de contrato verifica a responsabilidade integrada
- os docs de configuração nomeiam a nova chave de modelo/configuração
- os docs de Plugin explicam o limite de responsabilidade

Se um PR ignorar a camada de capability e codificar comportamento de fornecedor diretamente em um
canal/ferramenta, devolva-o e defina primeiro o contrato.

## Relacionado

- [Plugin](/pt-BR/tools/plugin)
- [Creating skills](/pt-BR/tools/creating-skills)
- [Tools and plugins](/pt-BR/tools)
