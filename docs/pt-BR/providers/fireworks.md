---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave de API do Fireworks ou do ID do modelo padrão
summary: Configuração do Fireworks (auth + seleção de modelo)
x-i18n:
    generated_at: "2026-04-05T12:50:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. O OpenClaw agora inclui um plugin de provedor Fireworks empacotado.

- Provedor: `fireworks`
- Auth: `FIREWORKS_API_KEY`
- API: chat/completions compatível com OpenAI
- URL base: `https://api.fireworks.ai/inference/v1`
- Modelo padrão: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Início rápido

Configure a auth do Fireworks pelo onboarding:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Isso armazena sua chave do Fireworks na config do OpenClaw e define o modelo inicial Fire Pass como padrão.

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Observação sobre ambiente

Se o Gateway for executado fora do seu shell interativo, verifique se `FIREWORKS_API_KEY`
também está disponível para esse processo. Uma chave presente apenas em `~/.profile` não
ajudará um daemon `launchd`/`systemd`, a menos que esse ambiente também seja importado ali.

## Catálogo integrado

| Ref do modelo                                           | Nome                        | Entrada    | Contexto | Saída máx. | Observações                                |
| ------------------------------------------------------- | --------------------------- | ---------- | -------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000    | Modelo inicial padrão empacotado no Fireworks |

## IDs de modelo personalizados do Fireworks

O OpenClaw também aceita IDs de modelo dinâmicos do Fireworks. Use o ID exato do modelo ou roteador mostrado pelo Fireworks e prefixe-o com `fireworks/`.

Exemplo:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Se o Fireworks publicar um modelo mais novo, como uma nova versão do Qwen ou Gemma, você poderá mudar para ele diretamente usando o ID de modelo do Fireworks sem esperar por uma atualização do catálogo empacotado.
