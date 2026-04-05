---
x-i18n:
    generated_at: "2026-04-05T12:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Utiliser Qwen Cloud via le fournisseur qwen intégré d’OpenClaw"
read_when:

- Vous voulez utiliser Qwen avec OpenClaw
- Vous utilisiez auparavant Qwen OAuth
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth a été supprimé.** L’intégration OAuth de niveau gratuit
(`qwen-portal`) qui utilisait les points de terminaison `portal.qwen.ai` n’est plus disponible.
Voir [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour plus de
contexte.

</Warning>

## Recommandé : Qwen Cloud

OpenClaw traite désormais Qwen comme un fournisseur intégré de premier plan avec l’identifiant canonique
`qwen`. Le fournisseur intégré cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, et continue de faire fonctionner les identifiants hérités `modelstudio` comme
alias de compatibilité.

- Fournisseur : `qwen`
- Variable d’environnement préférée : `QWEN_API_KEY`
- Également acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d’API : compatible OpenAI

Si vous voulez `qwen3.6-plus`, préférez le point de terminaison **Standard (paiement à l’usage)**.
La prise en charge de Coding Plan peut être en retard par rapport au catalogue public.

```bash
# Point de terminaison global Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Point de terminaison Chine Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Point de terminaison global Standard (paiement à l’usage)
openclaw onboard --auth-choice qwen-standard-api-key

# Point de terminaison Chine Standard (paiement à l’usage)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Les identifiants hérités `modelstudio-*` pour `auth-choice` et les références de modèle `modelstudio/...`
fonctionnent toujours comme alias de compatibilité, mais les nouveaux flux de configuration doivent préférer les identifiants canoniques
`qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.

Après l’onboarding, définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Plan de capacités

L’extension `qwen` est en train d’être positionnée comme le foyer fournisseur pour toute la surface
Qwen Cloud, pas seulement pour les modèles de code/texte.

- Modèles texte/chat : intégrés maintenant
- Appel d’outils, sortie structurée, thinking : hérités du transport compatible OpenAI
- Génération d’image : prévue au niveau du plugin de fournisseur
- Compréhension image/vidéo : intégrée maintenant sur le point de terminaison Standard
- Speech/audio : prévu au niveau du plugin de fournisseur
- Embeddings/reranking mémoire : prévus via la surface de l’adaptateur d’embedding
- Génération de vidéo : intégrée maintenant via la capacité partagée de génération vidéo

## Extensions multimodales

L’extension `qwen` expose désormais aussi :

- Compréhension vidéo via `qwen-vl-max-latest`
- Génération vidéo Wan via :
  - `wan2.6-t2v` (par défaut)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ces surfaces multimodales utilisent les points de terminaison DashScope **Standard**, et non
les points de terminaison Coding Plan.

- URL de base Standard globale/intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL de base Standard Chine : `https://dashscope.aliyuncs.com/compatible-mode/v1`

Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l’hôte
DashScope AIGC correspondant avant de soumettre la tâche :

- Global/Intl : `https://dashscope-intl.aliyuncs.com`
- Chine : `https://dashscope.aliyuncs.com`

Cela signifie qu’un `models.providers.qwen.baseUrl` normal pointant vers l’un ou l’autre des hôtes
Qwen Coding Plan ou Standard maintient tout de même la génération vidéo sur le bon
point de terminaison vidéo DashScope régional.

Pour la génération vidéo, définissez explicitement un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites actuelles intégrées de génération vidéo Qwen :

- Jusqu’à **1** vidéo de sortie par requête
- Jusqu’à **1** image d’entrée
- Jusqu’à **4** vidéos d’entrée
- Jusqu’à **10 secondes** de durée
- Prend en charge `size`, `aspectRatio`, `resolution`, `audio`, et `watermark`

Voir [Qwen / Model Studio](/providers/qwen_modelstudio) pour les détails au niveau des points de terminaison
et les remarques de compatibilité.
