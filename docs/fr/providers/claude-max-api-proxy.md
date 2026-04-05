---
read_when:
    - Vous souhaitez utiliser un abonnement Claude Max avec des outils compatibles OpenAI
    - Vous souhaitez un serveur API local qui encapsule Claude Code CLI
    - Vous souhaitez évaluer l’accès Anthropic basé sur un abonnement par rapport à un accès basé sur une clé API
summary: Proxy communautaire pour exposer les identifiants d’abonnement Claude comme point de terminaison compatible OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-04-05T12:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Proxy API Claude Max

**claude-max-api-proxy** est un outil communautaire qui expose votre abonnement Claude Max/Pro comme point de terminaison API compatible OpenAI. Cela vous permet d’utiliser votre abonnement avec n’importe quel outil prenant en charge le format de l’API OpenAI.

<Warning>
Cette voie n’est qu’une compatibilité technique. Anthropic a déjà bloqué certains usages d’abonnement
en dehors de Claude Code. Vous devez décider vous-même si vous souhaitez
l’utiliser et vérifier les conditions actuelles d’Anthropic avant de vous y fier.
</Warning>

## Pourquoi l’utiliser ?

| Approche                | Coût                                                | Idéal pour                                  |
| ----------------------- | --------------------------------------------------- | ------------------------------------------- |
| API Anthropic           | Paiement au jeton (~15 $/M en entrée, 75 $/M en sortie pour Opus) | Applications de production, volume élevé    |
| Abonnement Claude Max   | 200 $/mois forfaitaires                             | Usage personnel, développement, usage illimité |

Si vous avez un abonnement Claude Max et souhaitez l’utiliser avec des outils compatibles OpenAI, ce proxy peut réduire les coûts pour certains flux de travail. Les clés API restent la voie la plus claire du point de vue des règles pour un usage en production.

## Fonctionnement

```
Votre application → claude-max-api-proxy → Claude Code CLI → Anthropic (via abonnement)
   (format OpenAI)          (convertit le format)         (utilise votre connexion)
```

Le proxy :

1. Accepte les requêtes au format OpenAI sur `http://localhost:3456/v1/chat/completions`
2. Les convertit en commandes Claude Code CLI
3. Renvoie les réponses au format OpenAI (streaming pris en charge)

## Installation

```bash
# Nécessite Node.js 20+ et Claude Code CLI
npm install -g claude-max-api-proxy

# Vérifier que Claude CLI est authentifié
claude --version
```

## Utilisation

### Démarrer le serveur

```bash
claude-max-api
# Le serveur s’exécute sur http://localhost:3456
```

### Le tester

```bash
# Vérification d’état
curl http://localhost:3456/health

# Lister les modèles
curl http://localhost:3456/v1/models

# Completion de chat
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Avec OpenClaw

Vous pouvez faire pointer OpenClaw vers le proxy comme point de terminaison personnalisé compatible OpenAI :

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

Cette voie utilise la même route de type proxy compatible OpenAI que les autres backends personnalisés
`/v1` :

- le façonnage des requêtes natif propre à OpenAI ne s’applique pas
- pas de `service_tier`, pas de `store` Responses, pas d’indices de cache de prompt, ni de
  façonnage de charge utile de compatibilité du raisonnement OpenAI
- les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur l’URL du proxy

## Modèles disponibles

| ID du modèle       | Correspond à      |
| ------------------ | ----------------- |
| `claude-opus-4`    | Claude Opus 4     |
| `claude-sonnet-4`  | Claude Sonnet 4   |
| `claude-haiku-4`   | Claude Haiku 4    |

## Démarrage automatique sur macOS

Créez un LaunchAgent pour exécuter automatiquement le proxy :

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Liens

- **npm :** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub :** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Problèmes :** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Remarques

- Il s’agit d’un **outil communautaire**, non officiellement pris en charge par Anthropic ou OpenClaw
- Nécessite un abonnement Claude Max/Pro actif avec Claude Code CLI authentifié
- Le proxy s’exécute localement et n’envoie pas de données à des serveurs tiers
- Les réponses en streaming sont entièrement prises en charge

## Voir aussi

- [Anthropic provider](/providers/anthropic) - intégration OpenClaw native avec Claude CLI ou des clés API
- [OpenAI provider](/providers/openai) - pour les abonnements OpenAI/Codex
