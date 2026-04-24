---
read_when:
    - Vous souhaitez utiliser Volcano Engine ou les modèles Doubao avec OpenClaw
    - Vous devez configurer la clé API Volcano Engine
summary: Configuration de Volcano Engine (modèles Doubao, endpoints généraux + code)
title: Volcano Engine (Doubao)
x-i18n:
    generated_at: "2026-04-24T07:29:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Le fournisseur Volcano Engine donne accès aux modèles Doubao et à des modèles tiers
hébergés sur Volcano Engine, avec des endpoints séparés pour les charges de travail générales et de code.

| Détail    | Valeur                                              |
| --------- | --------------------------------------------------- |
| Fournisseurs | `volcengine` (général) + `volcengine-plan` (code) |
| Authentification | `VOLCANO_ENGINE_API_KEY`                   |
| API       | Compatible OpenAI                                   |

## Premiers pas

<Steps>
  <Step title="Définir la clé API">
    Lancez l’onboarding interactif :

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Cela enregistre les fournisseurs général (`volcengine`) et code (`volcengine-plan`) à partir d’une seule clé API.

  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Pour une configuration non interactive (CI, scripts), passez directement la clé :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Fournisseurs et endpoints

| Fournisseur       | Endpoint                                  | Cas d’usage      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modèles généraux |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modèles de code  |

<Note>
Les deux fournisseurs sont configurés à partir d’une seule clé API. Le setup enregistre les deux automatiquement.
</Note>

## Catalogue intégré

<Tabs>
  <Tab title="Général (volcengine)">
    | Référence de modèle                         | Nom                             | Entrée      | Contexte |
    | ------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`         | Doubao Seed 1.8                 | texte, image | 256 000 |
    | `volcengine/doubao-seed-code-preview-251028`| doubao-seed-code-preview-251028 | texte, image | 256 000 |
    | `volcengine/kimi-k2-5-260127`               | Kimi K2.5                       | texte, image | 256 000 |
    | `volcengine/glm-4-7-251222`                 | GLM 4.7                         | texte, image | 200 000 |
    | `volcengine/deepseek-v3-2-251201`           | DeepSeek V3.2                   | texte, image | 128 000 |
  </Tab>
  <Tab title="Code (volcengine-plan)">
    | Référence de modèle                              | Nom                      | Entrée | Contexte |
    | ------------------------------------------------ | ------------------------ | ------ | -------- |
    | `volcengine-plan/ark-code-latest`                | Ark Coding Plan          | texte  | 256 000 |
    | `volcengine-plan/doubao-seed-code`               | Doubao Seed Code         | texte  | 256 000 |
    | `volcengine-plan/glm-4.7`                        | GLM 4.7 Coding           | texte  | 200 000 |
    | `volcengine-plan/kimi-k2-thinking`               | Kimi K2 Thinking         | texte  | 256 000 |
    | `volcengine-plan/kimi-k2.5`                      | Kimi K2.5 Coding         | texte  | 256 000 |
    | `volcengine-plan/doubao-seed-code-preview-251028`| Doubao Seed Code Preview | texte  | 256 000 |
  </Tab>
</Tabs>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Modèle par défaut après l’onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` définit actuellement
    `volcengine-plan/ark-code-latest` comme modèle par défaut tout en enregistrant également
    le catalogue général `volcengine`.
  </Accordion>

  <Accordion title="Comportement de repli du sélecteur de modèle">
    Pendant l’onboarding/la sélection de modèle dans configure, le choix d’authentification Volcengine préfère
    les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont
    pas encore chargés, OpenClaw revient au catalogue non filtré au lieu d’afficher
    un sélecteur limité au fournisseur vide.
  </Accordion>

  <Accordion title="Variables d’environnement pour les processus daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que
    `VOLCANO_ENGINE_API_KEY` est disponible pour ce processus (par exemple, dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Lorsque vous exécutez OpenClaw comme service en arrière-plan, les variables d’environnement définies dans votre
shell interactif ne sont pas héritées automatiquement. Voir la remarque ci-dessus sur le daemon.
</Warning>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de bascule.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquentes sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
