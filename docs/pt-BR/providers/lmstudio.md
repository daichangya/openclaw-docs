---
read_when:
    - Você quer executar o OpenClaw com modelos de código aberto via LM Studio
    - Você quer configurar o LM Studio
summary: Execute o OpenClaw com o LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

O LM Studio é um aplicativo amigável, porém poderoso, para executar modelos com pesos abertos no seu próprio hardware. Ele permite executar modelos llama.cpp (GGUF) ou MLX (Apple Silicon). Está disponível em um pacote com GUI ou como daemon headless (`llmster`). Para documentação do produto e de configuração, consulte [lmstudio.ai](https://lmstudio.ai/).

## Início rápido

1. Instale o LM Studio (desktop) ou o `llmster` (headless) e, em seguida, inicie o servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicie o servidor

Certifique-se de iniciar o aplicativo desktop ou executar o daemon usando o seguinte comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se você estiver usando o aplicativo, certifique-se de ter o JIT habilitado para uma experiência fluida. Saiba mais no [guia de JIT e TTL do LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. O OpenClaw requer um valor de token do LM Studio. Defina `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se a autenticação do LM Studio estiver desativada, use qualquer valor de token não vazio:

```bash
export LM_API_TOKEN="placeholder-key"
```

Para detalhes de configuração da autenticação do LM Studio, consulte [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Execute o onboarding e escolha `LM Studio`:

```bash
openclaw onboard
```

5. No onboarding, use o prompt `Default model` para escolher seu modelo do LM Studio.

Você também pode defini-lo ou alterá-lo depois:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

As chaves de modelo do LM Studio seguem o formato `author/model-name` (por exemplo, `qwen/qwen3.5-9b`). As referências de modelo do OpenClaw adicionam o nome do provedor antes: `lmstudio/qwen/qwen3.5-9b`. Você pode encontrar a chave exata de um modelo executando `curl http://localhost:1234/api/v1/models` e procurando o campo `key`.

## Onboarding não interativo

Use o onboarding não interativo quando quiser automatizar a configuração (CI, provisionamento, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ou especifique a URL base ou o modelo com chave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` recebe a chave do modelo retornada pelo LM Studio (por exemplo, `qwen/qwen3.5-9b`), sem o prefixo de provedor `lmstudio/`.

O onboarding não interativo exige `--lmstudio-api-key` (ou `LM_API_TOKEN` no ambiente).
Para servidores LM Studio sem autenticação, qualquer valor de token não vazio funciona.

`--custom-api-key` continua compatível por razões de compatibilidade, mas `--lmstudio-api-key` é o preferido para o LM Studio.

Isso grava `models.providers.lmstudio`, define o modelo padrão como
`lmstudio/<custom-model-id>` e grava o perfil de autenticação `lmstudio:default`.

A configuração interativa pode solicitar um comprimento de contexto de carregamento preferido opcional e aplicá-lo aos modelos do LM Studio descobertos que ela salva na configuração.

## Configuração

### Configuração explícita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Solução de problemas

### LM Studio não detectado

Certifique-se de que o LM Studio está em execução e de que você definiu `LM_API_TOKEN` (para servidores sem autenticação, qualquer valor de token não vazio funciona):

```bash
# Inicie pelo aplicativo desktop ou em modo headless:
lms server start --port 1234
```

Verifique se a API está acessível:

```bash
curl http://localhost:1234/api/v1/models
```

### Erros de autenticação (HTTP 401)

Se a configuração relatar HTTP 401, verifique sua chave de API:

- Verifique se `LM_API_TOKEN` corresponde à chave configurada no LM Studio.
- Para detalhes de configuração da autenticação do LM Studio, consulte [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se o seu servidor não exigir autenticação, use qualquer valor de token não vazio para `LM_API_TOKEN`.

### Carregamento de modelo just-in-time

O LM Studio oferece suporte ao carregamento de modelo just-in-time (JIT), em que os modelos são carregados na primeira solicitação. Certifique-se de que isso esteja habilitado para evitar erros de "Model not loaded".
