---
read_when:
    - Você quer usar modelos do Amazon Bedrock com o OpenClaw
    - Você precisa configurar credenciais/região da AWS para chamadas de modelo
summary: Use modelos do Amazon Bedrock (API Converse) com o OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T12:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

O OpenClaw pode usar modelos do **Amazon Bedrock** por meio do provedor de
streaming **Bedrock Converse** do pi‑ai. A autenticação do Bedrock usa a
**cadeia padrão de credenciais do AWS SDK**, não uma chave de API.

## O que o pi-ai oferece suporte

- Provedor: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Autenticação: credenciais da AWS (variáveis de ambiente, configuração compartilhada ou função da instância)
- Região: `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)

## Descoberta automática de modelos

O OpenClaw pode descobrir automaticamente modelos do Bedrock com suporte a **streaming**
e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e os resultados ficam em cache (padrão: 1 hora).

Como o provedor implícito é habilitado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`,
  o OpenClaw tentará descobrir mesmo quando nenhum marcador de ambiente AWS estiver presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido,
  o OpenClaw só adicionará automaticamente o
  provedor implícito do Bedrock quando encontrar um destes marcadores de autenticação AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de autenticação em runtime do Bedrock ainda usa a cadeia padrão do AWS SDK, portanto
  configuração compartilhada, SSO e autenticação de função de instância IMDS podem funcionar mesmo quando a descoberta
  precisou de `enabled: true` para ser ativada.

As opções de configuração ficam em `plugins.entries.amazon-bedrock.config.discovery`:

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

Observações:

- `enabled` usa o modo automático por padrão. No modo automático, o OpenClaw só habilita o
  provedor implícito do Bedrock quando encontra um marcador de ambiente AWS compatível.
- `region` usa `AWS_REGION` ou `AWS_DEFAULT_REGION` por padrão, e depois `us-east-1`.
- `providerFilter` corresponde aos nomes de provedor do Bedrock (por exemplo, `anthropic`).
- `refreshInterval` está em segundos; defina como `0` para desabilitar o cache.
- `defaultContextWindow` (padrão: `32000`) e `defaultMaxTokens` (padrão: `4096`)
  são usados para modelos descobertos (substitua se você souber os limites do seu modelo).
- Para entradas explícitas em `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode
  resolver antecipadamente a autenticação de marcador de ambiente do Bedrock a partir de marcadores de ambiente AWS, como
  `AWS_BEARER_TOKEN_BEDROCK`, sem forçar o carregamento completo da autenticação em runtime. O
  caminho real de autenticação para chamadas de modelo ainda usa a cadeia padrão do AWS SDK.

## Onboarding

1. Garanta que as credenciais da AWS estejam disponíveis no **gateway host**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Opcional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Opcional (chave de API/token bearer do Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Adicione um provedor e um modelo do Bedrock à sua configuração (não é necessário `apiKey`):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## Funções de instância EC2

Ao executar o OpenClaw em uma instância EC2 com uma função IAM anexada, o AWS SDK
pode usar o serviço de metadados da instância (IMDS) para autenticação. Para descoberta de modelos do Bedrock,
o OpenClaw só habilita automaticamente o provedor implícito a partir de marcadores de ambiente AWS
a menos que você defina explicitamente
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configuração recomendada para hosts com IMDS:

- Defina `plugins.entries.amazon-bedrock.config.discovery.enabled` como `true`.
- Defina `plugins.entries.amazon-bedrock.config.discovery.region` (ou exporte `AWS_REGION`).
- Você **não** precisa de uma chave de API falsa.
- Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de ambiente
  para o modo automático ou superfícies de status.

```bash
# Recomendado: habilitação explícita da descoberta + região
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Opcional: adicione um marcador de ambiente se quiser modo automático sem habilitação explícita
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permissões IAM obrigatórias** para a função da instância EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (para descoberta automática)
- `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

Ou anexe a política gerenciada `AmazonBedrockFullAccess`.

## Configuração rápida (caminho AWS)

```bash
# 1. Criar função IAM e perfil de instância
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Anexar à sua instância EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Na instância EC2, habilite explicitamente a descoberta
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: adicione um marcador de ambiente se quiser modo automático sem habilitação explícita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verificar se os modelos foram descobertos
openclaw models list
```

## Perfis de inferência

O OpenClaw descobre **perfis de inferência regionais e globais** junto com
os modelos foundation. Quando um perfil é mapeado para um modelo foundation conhecido, o
perfil herda os recursos desse modelo (janela de contexto, máximo de tokens,
raciocínio, visão) e a região correta de requisição do Bedrock é injetada
automaticamente. Isso significa que perfis do Claude entre regiões funcionam sem substituições manuais
de provedor.

Os IDs de perfil de inferência se parecem com `us.anthropic.claude-opus-4-6-v1:0` (regional)
ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo subjacente já estiver
nos resultados de descoberta, o perfil herda seu conjunto completo de capacidades;
caso contrário, padrões seguros são aplicados.

Nenhuma configuração extra é necessária. Desde que a descoberta esteja habilitada e o principal IAM
tenha `bedrock:ListInferenceProfiles`, os perfis aparecem junto com
os modelos foundation em `openclaw models list`.

## Observações

- O Bedrock exige **acesso ao modelo** habilitado na sua conta/região AWS.
- A descoberta automática requer as permissões `bedrock:ListFoundationModels` e
  `bedrock:ListInferenceProfiles`.
- Se você depende do modo automático, defina um dos marcadores de ambiente de autenticação AWS compatíveis no
  gateway host. Se preferir autenticação IMDS/configuração compartilhada sem marcadores de ambiente, defina
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- O OpenClaw exibe a origem da credencial nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
  depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
  cadeia padrão do AWS SDK.
- O suporte a raciocínio depende do modelo; consulte o cartão do modelo Bedrock para
  os recursos atuais.
- Se você preferir um fluxo de chave gerenciado, também pode colocar um proxy
  compatível com OpenAI na frente do Bedrock e configurá-lo como um provedor OpenAI.

## Guardrails

Você pode aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
a todas as invocações de modelo do Bedrock adicionando um objeto `guardrail` à
configuração do plugin `amazon-bedrock`. Os Guardrails permitem aplicar filtragem de conteúdo,
negação de tópicos, filtros de palavras, filtros de informações confidenciais e verificações de
grounding contextual.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // ID do guardrail ou ARN completo
            guardrailVersion: "1", // número da versão ou "DRAFT"
            streamProcessingMode: "sync", // opcional: "sync" ou "async"
            trace: "enabled", // opcional: "enabled", "disabled" ou "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (obrigatório) aceita um ID de guardrail (por exemplo, `abc123`) ou um
  ARN completo (por exemplo, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (obrigatório) especifica qual versão publicada usar, ou
  `"DRAFT"` para o rascunho de trabalho.
- `streamProcessingMode` (opcional) controla se a avaliação do guardrail é executada
  de forma síncrona (`"sync"`) ou assíncrona (`"async"`) durante o streaming. Se
  omitido, o Bedrock usa seu comportamento padrão.
- `trace` (opcional) habilita a saída de rastreamento do guardrail na resposta da API. Defina como
  `"enabled"` ou `"enabled_full"` para depuração; omita ou defina como `"disabled"` para
  produção.

O principal IAM usado pelo gateway deve ter a permissão `bedrock:ApplyGuardrail`
além das permissões padrão de invocação.
