---
x-i18n:
    generated_at: "2026-04-05T12:51:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Use o Qwen Cloud pelo provedor qwen integrado do OpenClaw"
read_when:

- Você quer usar o Qwen com o OpenClaw
- Você usava anteriormente o OAuth do Qwen
  title: "Qwen"

---

# Qwen

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth do nível gratuito
(`qwen-portal`) que usava endpoints `portal.qwen.ai` não está mais disponível.
Veja a [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
contexto.

</Warning>

## Recomendado: Qwen Cloud

O OpenClaw agora trata o Qwen como um provedor integrado de primeira classe com id canônico
`qwen`. O provedor integrado aponta para os endpoints Qwen Cloud / Alibaba DashScope e
Coding Plan, e mantém ids legados `modelstudio` funcionando como alias de
compatibilidade.

- Provedor: `qwen`
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas por compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatível com OpenAI

Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pay-as-you-go)**.
O suporte do Coding Plan pode ficar atrás do catálogo público.

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

Ids legados de `auth-choice` `modelstudio-*` e refs de modelo `modelstudio/...` ainda
funcionam como aliases de compatibilidade, mas os novos fluxos de setup devem preferir os ids canônicos
de `auth-choice` `qwen-*` e refs de modelo `qwen/...`.

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

## Plano de capacidades

A extensão `qwen` está sendo posicionada como a casa do fornecedor para toda a superfície do Qwen
Cloud, não apenas para modelos de coding/texto.

- Modelos de texto/chat: integrados agora
- Chamada de ferramentas, saída estruturada, thinking: herdados do transporte compatível com OpenAI
- Geração de imagem: planejada na camada de plugin de provedor
- Entendimento de imagem/vídeo: integrado agora no endpoint Standard
- Fala/áudio: planejados na camada de plugin de provedor
- Embeddings/reranking de memória: planejados por meio da superfície do adaptador de embedding
- Geração de vídeo: integrada agora por meio da capacidade compartilhada de geração de vídeo

## Complementos multimodais

A extensão `qwen` agora também expõe:

- Entendimento de vídeo via `qwen-vl-max-latest`
- Geração de vídeo Wan via:
  - `wan2.6-t2v` (padrão)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Essas superfícies multimodais usam os endpoints DashScope **Standard**, não os
endpoints do Coding Plan.

- Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
DashScope AIGC correspondente antes de enviar o job:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Isso significa que uma `models.providers.qwen.baseUrl` normal apontando para qualquer um dos
hosts Qwen Coding Plan ou Standard ainda mantém a geração de vídeo no endpoint
regional correto de vídeo do DashScope.

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

Limites atuais integrados de geração de vídeo do Qwen:

- Até **1** vídeo de saída por solicitação
- Até **1** imagem de entrada
- Até **4** vídeos de entrada
- Até **10 segundos** de duração
- Suporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`

Veja [Qwen / Model Studio](/providers/qwen_modelstudio) para detalhes no nível de endpoint
e observações de compatibilidade.
