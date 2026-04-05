---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
x-i18n:
    generated_at: "2026-04-05T12:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

O [DeepSeek](https://www.deepseek.com) fornece modelos de IA poderosos com uma API compatível com OpenAI.

- Provedor: `deepseek`
- Autenticação: `DEEPSEEK_API_KEY`
- API: compatível com OpenAI
- URL base: `https://api.deepseek.com`

## Início rápido

Defina a chave de API (recomendado: armazená-la para o Gateway):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Isso solicitará sua chave de API e definirá `deepseek/deepseek-chat` como o modelo padrão.

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Observação sobre ambiente

Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `DEEPSEEK_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Catálogo integrado

| Ref. do modelo               | Nome               | Entrada | Contexto | Saída máx. | Observações                                       |
| ---------------------------- | ------------------ | ------- | -------- | ---------- | ------------------------------------------------ |
| `deepseek/deepseek-chat`     | DeepSeek Chat      | text    | 131,072  | 8,192      | Modelo padrão; superfície sem raciocínio do DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner  | text    | 131,072  | 65,536     | Superfície V3.2 com raciocínio habilitado        |

Ambos os modelos empacotados atualmente anunciam compatibilidade com uso de streaming no código-fonte.

Obtenha sua chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
