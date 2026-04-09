---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usava anteriormente o OAuth do Qwen
summary: Use o Qwen Cloud pelo provedor qwen incluído do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-09T01:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4786df2cb6ec1ab29d191d012c61dcb0e5468bf0f8561fbbb50eed741efad325
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth de nível gratuito
(`qwen-portal`) que usava endpoints `portal.qwen.ai` não está mais disponível.
Veja a [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
contexto.

</Warning>

## Recomendado: Qwen Cloud

O OpenClaw agora trata o Qwen como um provedor incluído de primeira classe com o ID canônico
`qwen`. O provedor incluído aponta para os endpoints Qwen Cloud / Alibaba DashScope e
Coding Plan e mantém IDs legados `modelstudio` funcionando como alias de
compatibilidade.

- Provedor: `qwen`
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas por compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatível com OpenAI

Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pay-as-you-go)**.
O suporte ao Coding Plan pode demorar a acompanhar o catálogo público.

```bash
# Endpoint global do Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint China do Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint global Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

IDs legados `modelstudio-*` de auth-choice e refs de modelo `modelstudio/...` ainda
funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os IDs canônicos
de auth-choice `qwen-*` e refs de modelo `qwen/...`.

Após o onboarding, defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Tipos de plano e endpoints

| Plano                      | Região | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provedor seleciona automaticamente o endpoint com base no seu auth choice. As escolhas canônicas
usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode substituir isso com um `baseUrl` personalizado na configuração.

Endpoints nativos do Model Studio anunciam compatibilidade de uso de streaming no
transporte compartilhado `openai-completions`. Agora o OpenClaw baseia isso nas
capacidades do endpoint, então IDs personalizados de provedor compatíveis com DashScope que apontam para os
mesmos hosts nativos herdam o mesmo comportamento de uso de streaming, em vez de
exigir especificamente o ID do provedor incluído `qwen`.

## Obtenha sua API key

- **Gerenciar chaves**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentação**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catálogo incluído

Atualmente, o OpenClaw inclui este catálogo do Qwen. O catálogo configurado é
sensível ao endpoint: configurações do Coding Plan omitem modelos que só são conhecidos por funcionar no
endpoint Standard.

| Ref do modelo              | Entrada     | Contexto  | Observações                                        |
| -------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`        | texto, imagem | 1,000,000 | Modelo padrão                                      |
| `qwen/qwen3.6-plus`        | texto, imagem | 1,000,000 | Prefira endpoints Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23` | texto        | 262,144   | Linha Qwen Max                                     |
| `qwen/qwen3-coder-next`    | texto        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`    | texto        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`        | texto        | 1,000,000 | Reasoning ativado                                  |
| `qwen/glm-5`               | texto        | 202,752   | GLM                                                |
| `qwen/glm-4.7`             | texto        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`           | texto, imagem | 262,144   | Moonshot AI via Alibaba                            |

A disponibilidade ainda pode variar por endpoint e plano de cobrança, mesmo quando um modelo está
presente no catálogo incluído.

A compatibilidade de uso de streaming nativo se aplica tanto aos hosts do Coding Plan quanto aos
hosts Standard compatíveis com DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilidade do Qwen 3.6 Plus

`qwen3.6-plus` está disponível nos endpoints Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Se os endpoints do Coding Plan retornarem um erro de "unsupported model" para
`qwen3.6-plus`, mude para Standard (pay-as-you-go) em vez do par
endpoint/chave do Coding Plan.

## Plano de capacidades

A extensão `qwen` está sendo posicionada como a casa do fornecedor para toda a superfície do Qwen
Cloud, não apenas para modelos de coding/texto.

- Modelos de texto/chat: incluídos agora
- Chamada de ferramentas, saída estruturada, thinking: herdados do transporte compatível com OpenAI
- Geração de imagem: planejada na camada de plugin de provedor
- Entendimento de imagem/vídeo: incluído agora no endpoint Standard
- Fala/áudio: planejado na camada de plugin de provedor
- Embeddings/reranking de memória: planejados por meio da superfície do adaptador de embeddings
- Geração de vídeo: incluída agora por meio da capacidade compartilhada de geração de vídeo

## Complementos multimodais

A extensão `qwen` agora também expõe:

- Entendimento de vídeo por meio de `qwen-vl-max-latest`
- Geração de vídeo Wan por meio de:
  - `wan2.6-t2v` (padrão)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Essas superfícies multimodais usam os endpoints DashScope **Standard**, não os
endpoints do Coding Plan.

- URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
DashScope AIGC correspondente antes de enviar a tarefa:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Isso significa que um `models.providers.qwen.baseUrl` normal apontando para qualquer um dos
hosts Qwen Coding Plan ou Standard ainda mantém a geração de vídeo no endpoint de vídeo DashScope
regional correto.

Para geração de vídeo, defina explicitamente um modelo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites atuais incluídos de geração de vídeo do Qwen:

- Até **1** vídeo de saída por solicitação
- Até **1** imagem de entrada
- Até **4** vídeos de entrada
- Até **10 segundos** de duração
- Suporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
- O modo de imagem/vídeo de referência atualmente exige **URLs remotas http(s)**. Caminhos
  de arquivos locais são rejeitados logo de início porque o endpoint de vídeo DashScope não
  aceita buffers locais enviados para essas referências.

Veja [Geração de vídeo](/pt-BR/tools/video-generation) para os parâmetros compartilhados da
ferramenta, seleção de provedor e comportamento de failover.

## Observação sobre ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `QWEN_API_KEY` esteja
disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
