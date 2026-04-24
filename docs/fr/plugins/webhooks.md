---
read_when:
    - Vous souhaitez déclencher ou piloter des TaskFlow depuis un système externe
    - Vous configurez le plugin Webhooks inclus
summary: 'Plugin Webhooks : entrée TaskFlow authentifiée pour une automatisation externe de confiance'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-24T07:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (plugin)

Le plugin Webhooks ajoute des routes HTTP authentifiées qui lient une
automatisation externe aux TaskFlow OpenClaw.

Utilisez-le lorsque vous voulez qu’un système de confiance tel que Zapier, n8n, une tâche CI ou un
service interne crée et pilote des TaskFlow gérés sans écrire d’abord un plugin personnalisé.

## Où il s’exécute

Le plugin Webhooks s’exécute dans le processus Gateway.

Si votre Gateway s’exécute sur une autre machine, installez et configurez le plugin sur
cet hôte Gateway, puis redémarrez le Gateway.

## Configurer les routes

Définissez la configuration sous `plugins.entries.webhooks.config` :

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Pont TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Champs de route :

- `enabled` : facultatif, vaut `true` par défaut
- `path` : facultatif, vaut `/plugins/webhooks/<routeId>` par défaut
- `sessionKey` : session requise qui possède les TaskFlow liés
- `secret` : secret partagé requis ou SecretRef
- `controllerId` : identifiant facultatif du contrôleur pour les flux gérés créés
- `description` : note opérateur facultative

Entrées `secret` prises en charge :

- Chaîne simple
- SecretRef avec `source: "env" | "file" | "exec"`

Si une route adossée à un secret ne peut pas résoudre son secret au démarrage, le plugin ignore
cette route et journalise un avertissement au lieu d’exposer un point de terminaison cassé.

## Modèle de sécurité

Chaque route est considérée comme de confiance pour agir avec l’autorité TaskFlow de sa
`sessionKey` configurée.

Cela signifie que la route peut inspecter et modifier les TaskFlow possédés par cette session, donc
vous devriez :

- Utiliser un secret fort et unique par route
- Préférer les références de secret aux secrets en clair inline
- Lier les routes à la session la plus étroite adaptée au flux de travail
- Exposer uniquement le chemin de Webhook spécifique dont vous avez besoin

Le plugin applique :

- L’authentification par secret partagé
- Des garde-fous sur la taille du corps de requête et les délais
- Une limitation de débit à fenêtre fixe
- Une limitation des requêtes en vol
- Un accès TaskFlow lié au propriétaire via `api.runtime.taskFlow.bindSession(...)`

## Format de requête

Envoyez des requêtes `POST` avec :

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` ou `x-openclaw-webhook-secret: <secret>`

Exemple :

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Actions prises en charge

Le plugin accepte actuellement ces valeurs JSON `action` :

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Crée un TaskFlow géré pour la session liée à la route.

Exemple :

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Crée une tâche enfant gérée dans un TaskFlow géré existant.

Les runtimes autorisés sont :

- `subagent`
- `acp`

Exemple :

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Forme de la réponse

Les réponses réussies renvoient :

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Les requêtes rejetées renvoient :

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow introuvable.",
  "result": {}
}
```

Le plugin expurge volontairement les métadonnées de propriétaire/session des réponses Webhook.

## Documentation liée

- [SDK runtime de Plugin](/fr/plugins/sdk-runtime)
- [Aperçu hooks et Webhooks](/fr/automation/hooks)
- [CLI webhooks](/fr/cli/webhooks)
