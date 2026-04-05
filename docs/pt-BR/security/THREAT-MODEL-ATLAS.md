---
read_when:
    - Revisando a postura de segurança ou cenários de ameaça
    - Trabalhando em recursos de segurança ou respostas de auditoria
summary: Modelo de ameaças do OpenClaw mapeado para o framework MITRE ATLAS
title: Modelo de ameaças (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T12:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modelo de ameaças do OpenClaw v1.0

## Framework MITRE ATLAS

**Versão:** 1.0-draft
**Última atualização:** 2026-02-04
**Metodologia:** MITRE ATLAS + Diagramas de fluxo de dados
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribuição do framework

Este modelo de ameaças foi criado com base no [MITRE ATLAS](https://atlas.mitre.org/), o framework padrão do setor para documentar ameaças adversariais a sistemas de IA/ML. O ATLAS é mantido pela [MITRE](https://www.mitre.org/) em colaboração com a comunidade de segurança de IA.

**Principais recursos do ATLAS:**

- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Táticas ATLAS](https://atlas.mitre.org/tactics/)
- [Estudos de caso ATLAS](https://atlas.mitre.org/studies/)
- [GitHub do ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuindo para o ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuindo para este modelo de ameaças

Este é um documento vivo mantido pela comunidade OpenClaw. Consulte [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) para orientações sobre como contribuir:

- Relatar novas ameaças
- Atualizar ameaças existentes
- Propor cadeias de ataque
- Sugerir mitigações

---

## 1. Introdução

### 1.1 Objetivo

Este modelo de ameaças documenta ameaças adversariais à plataforma de agentes de IA OpenClaw e ao marketplace de Skills ClawHub, usando o framework MITRE ATLAS projetado especificamente para sistemas de IA/ML.

### 1.2 Escopo

| Componente             | Incluído | Observações                                     |
| ---------------------- | -------- | ----------------------------------------------- |
| Runtime do agente OpenClaw | Sim  | Execução principal do agente, chamadas de ferramentas, sessões |
| Gateway                | Sim      | Autenticação, roteamento, integração de canais  |
| Integrações de canal   | Sim      | WhatsApp, Telegram, Discord, Signal, Slack etc. |
| Marketplace ClawHub    | Sim      | Publicação, moderação, distribuição de Skills   |
| Servidores MCP         | Sim      | Provedores externos de ferramentas              |
| Dispositivos do usuário | Parcial | Apps móveis, clientes desktop                   |

### 1.3 Fora de escopo

Nada está explicitamente fora do escopo deste modelo de ameaças.

---

## 2. Arquitetura do sistema

### 2.1 Limites de confiança

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxos de dados

| Fluxo | Origem  | Destino     | Dados              | Proteção             |
| ----- | ------- | ----------- | ------------------ | -------------------- |
| F1    | Canal   | Gateway     | Mensagens do usuário | TLS, AllowFrom     |
| F2    | Gateway | Agente      | Mensagens roteadas | Isolamento de sessão |
| F3    | Agente  | Ferramentas | Invocações de ferramentas | Aplicação de políticas |
| F4    | Agente  | Externo     | solicitações `web_fetch` | Bloqueio de SSRF |
| F5    | ClawHub | Agente      | Código de Skill    | Moderação, varredura |
| F6    | Agente  | Canal       | Respostas          | Filtragem de saída   |

---

## 3. Análise de ameaças por tática ATLAS

### 3.1 Reconhecimento (AML.TA0002)

#### T-RECON-001: Descoberta de endpoint de agente

| Atributo               | Valor                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0006 - Active Scanning                                         |
| **Descrição**          | O invasor faz varredura em busca de endpoints expostos do gateway OpenClaw |
| **Vetor de ataque**    | Varredura de rede, consultas no Shodan, enumeração de DNS           |
| **Componentes afetados** | Gateway, endpoints de API expostos                                |
| **Mitigações atuais**  | Opção de autenticação Tailscale, bind em loopback por padrão        |
| **Risco residual**     | Médio - Gateways públicos podem ser descobertos                     |
| **Recomendações**      | Documentar implantação segura, adicionar rate limiting em endpoints de descoberta |

#### T-RECON-002: Sondagem de integração de canais

| Atributo               | Valor                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0006 - Active Scanning                                       |
| **Descrição**          | O invasor sonda canais de mensagens para identificar contas gerenciadas por IA |
| **Vetor de ataque**    | Envio de mensagens de teste, observação de padrões de resposta    |
| **Componentes afetados** | Todas as integrações de canal                                   |
| **Mitigações atuais**  | Nenhuma específica                                                |
| **Risco residual**     | Baixo - Valor limitado da descoberta isoladamente                 |
| **Recomendações**      | Considerar randomização do tempo de resposta                      |

---

### 3.2 Acesso inicial (AML.TA0004)

#### T-ACCESS-001: Interceptação de código de pareamento

| Atributo               | Valor                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - AI Model Inference API Access                                                                     |
| **Descrição**          | O invasor intercepta o código de pareamento durante o período de carência do pareamento (1h para pareamento por DM, 5min para pareamento de nó) |
| **Vetor de ataque**    | Observação por cima do ombro, sniffing de rede, engenharia social                                             |
| **Componentes afetados** | Sistema de pareamento de dispositivos                                                                        |
| **Mitigações atuais**  | Expiração de 1h (pareamento por DM) / 5min (pareamento de nó), códigos enviados pelo canal existente         |
| **Risco residual**     | Médio - Período de carência explorável                                                                        |
| **Recomendações**      | Reduzir o período de carência, adicionar etapa de confirmação                                                 |

#### T-ACCESS-002: Spoofing de AllowFrom

| Atributo               | Valor                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - AI Model Inference API Access                                 |
| **Descrição**          | O invasor falsifica a identidade do remetente permitido no canal          |
| **Vetor de ataque**    | Depende do canal - spoofing de número de telefone, personificação de nome de usuário |
| **Componentes afetados** | Validação de AllowFrom por canal                                        |
| **Mitigações atuais**  | Verificação de identidade específica por canal                            |
| **Risco residual**     | Médio - Alguns canais vulneráveis a spoofing                              |
| **Recomendações**      | Documentar riscos específicos por canal, adicionar verificação criptográfica quando possível |

#### T-ACCESS-003: Roubo de token

| Atributo               | Valor                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - AI Model Inference API Access                   |
| **Descrição**          | O invasor rouba tokens de autenticação de arquivos de configuração |
| **Vetor de ataque**    | Malware, acesso não autorizado ao dispositivo, exposição de backup de configuração |
| **Componentes afetados** | `~/.openclaw/credentials/`, armazenamento de configuração |
| **Mitigações atuais**  | Permissões de arquivo                                       |
| **Risco residual**     | Alto - Tokens armazenados em texto simples                  |
| **Recomendações**      | Implementar criptografia de tokens em repouso, adicionar rotação de tokens |

---

### 3.3 Execução (AML.TA0005)

#### T-EXEC-001: Injeção direta de prompt

| Atributo               | Valor                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **ID ATLAS**           | AML.T0051.000 - LLM Prompt Injection: Direct                                         |
| **Descrição**          | O invasor envia prompts elaborados para manipular o comportamento do agente          |
| **Vetor de ataque**    | Mensagens de canal contendo instruções adversariais                                  |
| **Componentes afetados** | LLM do agente, todas as superfícies de entrada                                     |
| **Mitigações atuais**  | Detecção de padrões, encapsulamento de conteúdo externo                              |
| **Risco residual**     | Crítico - Apenas detecção, sem bloqueio; ataques sofisticados contornam              |
| **Recomendações**      | Implementar defesa em várias camadas, validação de saída, confirmação do usuário para ações sensíveis |

#### T-EXEC-002: Injeção indireta de prompt

| Atributo               | Valor                                                     |
| ---------------------- | --------------------------------------------------------- |
| **ID ATLAS**           | AML.T0051.001 - LLM Prompt Injection: Indirect            |
| **Descrição**          | O invasor embute instruções maliciosas em conteúdo obtido |
| **Vetor de ataque**    | URLs maliciosas, e-mails envenenados, webhooks comprometidos |
| **Componentes afetados** | `web_fetch`, ingestão de e-mail, fontes externas de dados |
| **Mitigações atuais**  | Encapsulamento de conteúdo com tags XML e aviso de segurança |
| **Risco residual**     | Alto - O LLM pode ignorar instruções de encapsulamento    |
| **Recomendações**      | Implementar sanitização de conteúdo, contextos de execução separados |

#### T-EXEC-003: Injeção de argumentos de ferramenta

| Atributo               | Valor                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ID ATLAS**           | AML.T0051.000 - LLM Prompt Injection: Direct                |
| **Descrição**          | O invasor manipula argumentos de ferramenta por meio de injeção de prompt |
| **Vetor de ataque**    | Prompts elaborados que influenciam valores de parâmetros da ferramenta |
| **Componentes afetados** | Todas as invocações de ferramenta                          |
| **Mitigações atuais**  | Aprovações de execução para comandos perigosos              |
| **Risco residual**     | Alto - Depende do julgamento do usuário                     |
| **Recomendações**      | Implementar validação de argumentos, chamadas parametrizadas de ferramenta |

#### T-EXEC-004: Bypass de aprovação de execução

| Atributo               | Valor                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Craft Adversarial Data                          |
| **Descrição**          | O invasor cria comandos que contornam a allowlist de aprovação |
| **Vetor de ataque**    | Ofuscação de comando, exploração de alias, manipulação de caminho |
| **Componentes afetados** | `exec-approvals.ts`, allowlist de comandos                |
| **Mitigações atuais**  | Allowlist + modo ask                                        |
| **Risco residual**     | Alto - Sem sanitização de comandos                          |
| **Recomendações**      | Implementar normalização de comandos, expandir blocklist    |

---

### 3.4 Persistência (AML.TA0006)

#### T-PERSIST-001: Instalação de Skill maliciosa

| Atributo               | Valor                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.001 - Supply Chain Compromise: AI Software                |
| **Descrição**          | O invasor publica Skill maliciosa no ClawHub                        |
| **Vetor de ataque**    | Criar conta, publicar Skill com código malicioso oculto             |
| **Componentes afetados** | ClawHub, carregamento de Skill, execução do agente                |
| **Mitigações atuais**  | Verificação de idade da conta GitHub, flags de moderação baseadas em padrão |
| **Risco residual**     | Crítico - Sem sandboxing, revisão limitada                          |
| **Recomendações**      | Integração com VirusTotal (em andamento), sandboxing de Skill, revisão da comunidade |

#### T-PERSIST-002: Envenenamento de atualização de Skill

| Atributo               | Valor                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.001 - Supply Chain Compromise: AI Software           |
| **Descrição**          | O invasor compromete uma Skill popular e envia atualização maliciosa |
| **Vetor de ataque**    | Comprometimento de conta, engenharia social do dono da Skill   |
| **Componentes afetados** | Versionamento do ClawHub, fluxos de atualização automática   |
| **Mitigações atuais**  | Impressão digital de versão                                    |
| **Risco residual**     | Alto - Atualizações automáticas podem trazer versões maliciosas |
| **Recomendações**      | Implementar assinatura de atualização, capacidade de rollback, fixação de versão |

#### T-PERSIST-003: Adulteração de configuração do agente

| Atributo               | Valor                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.002 - Supply Chain Compromise: Data                   |
| **Descrição**          | O invasor modifica a configuração do agente para manter acesso  |
| **Vetor de ataque**    | Modificação de arquivo de configuração, injeção de configurações |
| **Componentes afetados** | Configuração do agente, políticas de ferramentas              |
| **Mitigações atuais**  | Permissões de arquivo                                           |
| **Risco residual**     | Médio - Requer acesso local                                     |
| **Recomendações**      | Verificação de integridade de configuração, logs de auditoria para mudanças de configuração |

---

### 3.5 Evasão de defesa (AML.TA0007)

#### T-EVADE-001: Bypass de padrão de moderação

| Atributo               | Valor                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Craft Adversarial Data                                |
| **Descrição**          | O invasor cria conteúdo de Skill para contornar padrões de moderação |
| **Vetor de ataque**    | Homóglifos Unicode, truques de codificação, carregamento dinâmico |
| **Componentes afetados** | `moderation.ts` do ClawHub                                      |
| **Mitigações atuais**  | `FLAG_RULES` baseadas em padrão                                   |
| **Risco residual**     | Alto - Regex simples é facilmente contornada                      |
| **Recomendações**      | Adicionar análise comportamental (VirusTotal Code Insight), detecção baseada em AST |

#### T-EVADE-002: Escape de encapsulamento de conteúdo

| Atributo               | Valor                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Craft Adversarial Data                         |
| **Descrição**          | O invasor cria conteúdo que escapa do contexto de encapsulamento XML |
| **Vetor de ataque**    | Manipulação de tags, confusão de contexto, sobrescrita de instruções |
| **Componentes afetados** | Encapsulamento de conteúdo externo                        |
| **Mitigações atuais**  | Tags XML + aviso de segurança                              |
| **Risco residual**     | Médio - Novos escapes são descobertos regularmente         |
| **Recomendações**      | Múltiplas camadas de encapsulamento, validação no lado da saída |

---

### 3.6 Descoberta (AML.TA0008)

#### T-DISC-001: Enumeração de ferramentas

| Atributo               | Valor                                                |
| ---------------------- | ---------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - AI Model Inference API Access            |
| **Descrição**          | O invasor enumera ferramentas disponíveis por meio de prompting |
| **Vetor de ataque**    | Consultas do tipo "Que ferramentas você tem?"        |
| **Componentes afetados** | Registro de ferramentas do agente                   |
| **Mitigações atuais**  | Nenhuma específica                                   |
| **Risco residual**     | Baixo - Ferramentas em geral são documentadas        |
| **Recomendações**      | Considerar controles de visibilidade de ferramentas  |

#### T-DISC-002: Extração de dados de sessão

| Atributo               | Valor                                                |
| ---------------------- | ---------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - AI Model Inference API Access            |
| **Descrição**          | O invasor extrai dados sensíveis do contexto da sessão |
| **Vetor de ataque**    | Consultas como "O que discutimos?", sondagem de contexto |
| **Componentes afetados** | Transcrições de sessão, janela de contexto          |
| **Mitigações atuais**  | Isolamento de sessão por remetente                   |
| **Risco residual**     | Médio - Dados dentro da sessão são acessíveis        |
| **Recomendações**      | Implementar redação de dados sensíveis no contexto   |

---

### 3.7 Coleta e exfiltração (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Roubo de dados via web_fetch

| Atributo               | Valor                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0009 - Collection                                                |
| **Descrição**          | O invasor exfiltra dados instruindo o agente a enviar para uma URL externa |
| **Vetor de ataque**    | Injeção de prompt fazendo o agente enviar POST com dados para servidor do invasor |
| **Componentes afetados** | Ferramenta `web_fetch`                                              |
| **Mitigações atuais**  | Bloqueio de SSRF para redes internas                                  |
| **Risco residual**     | Alto - URLs externas são permitidas                                   |
| **Recomendações**      | Implementar allowlist de URL, consciência de classificação de dados    |

#### T-EXFIL-002: Envio não autorizado de mensagens

| Atributo               | Valor                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0009 - Collection                                          |
| **Descrição**          | O invasor faz o agente enviar mensagens contendo dados sensíveis |
| **Vetor de ataque**    | Injeção de prompt fazendo o agente enviar mensagem ao invasor   |
| **Componentes afetados** | Ferramenta de mensagem, integrações de canal                  |
| **Mitigações atuais**  | Controle de envio de mensagens de saída                         |
| **Risco residual**     | Médio - O controle pode ser contornado                          |
| **Recomendações**      | Exigir confirmação explícita para novos destinatários           |

#### T-EXFIL-003: Coleta de credenciais

| Atributo               | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| **ID ATLAS**           | AML.T0009 - Collection                                 |
| **Descrição**          | Skill maliciosa coleta credenciais do contexto do agente |
| **Vetor de ataque**    | Código da Skill lê variáveis de ambiente, arquivos de configuração |
| **Componentes afetados** | Ambiente de execução da Skill                         |
| **Mitigações atuais**  | Nenhuma específica para Skills                         |
| **Risco residual**     | Crítico - Skills são executadas com privilégios do agente |
| **Recomendações**      | Sandboxing de Skill, isolamento de credenciais         |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Execução não autorizada de comandos

| Atributo               | Valor                                              |
| ---------------------- | -------------------------------------------------- |
| **ID ATLAS**           | AML.T0031 - Erode AI Model Integrity               |
| **Descrição**          | O invasor executa comandos arbitrários no sistema do usuário |
| **Vetor de ataque**    | Injeção de prompt combinada com bypass de aprovação de execução |
| **Componentes afetados** | Ferramenta Bash, execução de comandos            |
| **Mitigações atuais**  | Aprovações de execução, opção de sandbox Docker    |
| **Risco residual**     | Crítico - Execução no host sem sandbox             |
| **Recomendações**      | Usar sandbox por padrão, melhorar a UX de aprovação |

#### T-IMPACT-002: Exaustão de recursos (DoS)

| Atributo               | Valor                                             |
| ---------------------- | ------------------------------------------------- |
| **ID ATLAS**           | AML.T0031 - Erode AI Model Integrity              |
| **Descrição**          | O invasor esgota créditos de API ou recursos computacionais |
| **Vetor de ataque**    | Enchente automatizada de mensagens, chamadas caras de ferramentas |
| **Componentes afetados** | Gateway, sessões de agente, provedor de API     |
| **Mitigações atuais**  | Nenhuma                                           |
| **Risco residual**     | Alto - Sem rate limiting                          |
| **Recomendações**      | Implementar limites por remetente, orçamentos de custo |

#### T-IMPACT-003: Dano reputacional

| Atributo               | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| **ID ATLAS**           | AML.T0031 - Erode AI Model Integrity                   |
| **Descrição**          | O invasor faz o agente enviar conteúdo nocivo/ofensivo |
| **Vetor de ataque**    | Injeção de prompt causando respostas inadequadas       |
| **Componentes afetados** | Geração de saída, mensagens em canais                |
| **Mitigações atuais**  | Políticas de conteúdo do provedor de LLM              |
| **Risco residual**     | Médio - Filtros do provedor são imperfeitos           |
| **Recomendações**      | Camada de filtragem de saída, controles do usuário     |

---

## 4. Análise da cadeia de suprimentos do ClawHub

### 4.1 Controles de segurança atuais

| Controle             | Implementação               | Efetividade                                              |
| -------------------- | --------------------------- | -------------------------------------------------------- |
| Idade da conta GitHub | `requireGitHubAccountAge()` | Média - Aumenta a barreira para novos invasores          |
| Sanitização de caminho | `sanitizePath()`           | Alta - Evita path traversal                              |
| Validação de tipo de arquivo | `isTextFile()`       | Média - Apenas arquivos de texto, mas ainda podem ser maliciosos |
| Limites de tamanho   | Bundle total de 50 MB       | Alta - Evita exaustão de recursos                        |
| `SKILL.md` obrigatório | Readme obrigatório         | Baixo valor de segurança - Apenas informativo            |
| Moderação por padrão | `FLAG_RULES` em `moderation.ts` | Baixa - Facilmente contornada                         |
| Status de moderação  | Campo `moderationStatus`    | Médio - Revisão manual possível                          |

### 4.2 Padrões de flags de moderação

Padrões atuais em `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitações:**

- Verifica apenas slug, `displayName`, resumo, frontmatter, metadados e caminhos de arquivo
- Não analisa o conteúdo real do código da Skill
- Regex simples é facilmente contornada com ofuscação
- Sem análise comportamental

### 4.3 Melhorias planejadas

| Melhoria               | Status                                 | Impacto                                                             |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Integração com VirusTotal | Em andamento                        | Alto - Análise comportamental com Code Insight                      |
| Relatórios da comunidade | Parcial (a tabela `skillReports` existe) | Médio                                                             |
| Logs de auditoria      | Parcial (a tabela `auditLogs` existe)  | Médio                                                               |
| Sistema de badges      | Implementado                           | Médio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriz de risco

### 5.1 Probabilidade vs impacto

| ID da ameaça   | Probabilidade | Impacto  | Nível de risco | Prioridade |
| -------------- | ------------- | -------- | -------------- | ---------- |
| T-EXEC-001     | Alta          | Crítico  | **Crítico**    | P0         |
| T-PERSIST-001  | Alta          | Crítico  | **Crítico**    | P0         |
| T-EXFIL-003    | Média         | Crítico  | **Crítico**    | P0         |
| T-IMPACT-001   | Média         | Crítico  | **Alto**       | P1         |
| T-EXEC-002     | Alta          | Alto     | **Alto**       | P1         |
| T-EXEC-004     | Média         | Alto     | **Alto**       | P1         |
| T-ACCESS-003   | Média         | Alto     | **Alto**       | P1         |
| T-EXFIL-001    | Média         | Alto     | **Alto**       | P1         |
| T-IMPACT-002   | Alta          | Médio    | **Alto**       | P1         |
| T-EVADE-001    | Alta          | Médio    | **Médio**      | P2         |
| T-ACCESS-001   | Baixa         | Alto     | **Médio**      | P2         |
| T-ACCESS-002   | Baixa         | Alto     | **Médio**      | P2         |
| T-PERSIST-002  | Baixa         | Alto     | **Médio**      | P2         |

### 5.2 Cadeias de ataque de caminho crítico

**Cadeia de ataque 1: Roubo de dados baseado em Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Cadeia de ataque 2: Injeção de prompt para RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Cadeia de ataque 3: Injeção indireta via conteúdo obtido**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Resumo das recomendações

### 6.1 Imediato (P0)

| ID    | Recomendação                               | Resolve                    |
| ----- | ------------------------------------------ | -------------------------- |
| R-001 | Concluir a integração com VirusTotal       | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementar sandboxing de Skill            | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Adicionar validação de saída para ações sensíveis | T-EXEC-001, T-EXEC-002 |

### 6.2 Curto prazo (P1)

| ID    | Recomendação                              | Resolve      |
| ----- | ----------------------------------------- | ------------ |
| R-004 | Implementar rate limiting                 | T-IMPACT-002 |
| R-005 | Adicionar criptografia de token em repouso | T-ACCESS-003 |
| R-006 | Melhorar UX e validação de aprovação de execução | T-EXEC-004 |
| R-007 | Implementar allowlisting de URL para `web_fetch` | T-EXFIL-001 |

### 6.3 Médio prazo (P2)

| ID    | Recomendação                                           | Resolve       |
| ----- | ------------------------------------------------------ | ------------- |
| R-008 | Adicionar verificação criptográfica de canal quando possível | T-ACCESS-002 |
| R-009 | Implementar verificação de integridade de configuração | T-PERSIST-003 |
| R-010 | Adicionar assinatura de atualização e fixação de versão | T-PERSIST-002 |

---

## 7. Apêndices

### 7.1 Mapeamento de técnicas ATLAS

| ID ATLAS      | Nome da técnica                | Ameaças do OpenClaw                                              |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                    |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                       |

### 7.2 Principais arquivos de segurança

| Caminho                             | Finalidade                    | Nível de risco |
| ----------------------------------- | ----------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprovação de comando | **Crítico**   |
| `src/gateway/auth.ts`               | Autenticação do Gateway       | **Crítico**    |
| `src/infra/net/ssrf.ts`             | Proteção contra SSRF          | **Crítico**    |
| `src/security/external-content.ts`  | Mitigação de injeção de prompt | **Crítico**   |
| `src/agents/sandbox/tool-policy.ts` | Aplicação de política de ferramenta | **Crítico** |
| `src/routing/resolve-route.ts`      | Isolamento de sessão          | **Médio**      |

### 7.3 Glossário

| Termo                | Definição                                                     |
| -------------------- | ------------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems da MITRE          |
| **ClawHub**          | Marketplace de Skills do OpenClaw                             |
| **Gateway**          | Camada de roteamento de mensagens e autenticação do OpenClaw  |
| **MCP**              | Model Context Protocol - interface de provedor de ferramentas |
| **Prompt Injection** | Ataque em que instruções maliciosas são embutidas na entrada  |
| **Skill**            | Extensão baixável para agentes do OpenClaw                    |
| **SSRF**             | Server-Side Request Forgery                                   |

---

_Este modelo de ameaças é um documento vivo. Relate problemas de segurança para security@openclaw.ai_
