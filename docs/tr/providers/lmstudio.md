---
read_when:
    - OpenClaw'ı LM Studio üzerinden açık kaynak modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'ı LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T09:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio, kendi donanımınızda open-weight modeller çalıştırmak için kullanıcı dostu ama güçlü bir uygulamadır. llama.cpp (GGUF) veya MLX modellerini (Apple Silicon) çalıştırmanıza olanak tanır. GUI paketi veya headless daemon (`llmster`) olarak gelir. Ürün ve kurulum belgeleri için bkz. [lmstudio.ai](https://lmstudio.ai/).

## Hızlı başlangıç

1. LM Studio'yu (masaüstü) veya `llmster`'ı (headless) kurun, ardından yerel sunucuyu başlatın:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Sunucuyu başlatın

Masaüstü uygulamasını başlattığınızdan veya aşağıdaki komutla daemon'u çalıştırdığınızdan emin olun:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Uygulamayı kullanıyorsanız, sorunsuz bir deneyim için JIT'in etkin olduğundan emin olun. Daha fazla bilgi için [LM Studio JIT ve TTL kılavuzu](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) sayfasına bakın.

3. OpenClaw bir LM Studio token değeri gerektirir. `LM_API_TOKEN` ayarlayın:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio kimlik doğrulaması devre dışıysa, boş olmayan herhangi bir token değeri kullanın:

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio auth kurulumu ayrıntıları için bkz. [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Onboarding çalıştırın ve `LM Studio` seçin:

```bash
openclaw onboard
```

5. Onboarding sırasında, LM Studio modelinizi seçmek için `Default model` istemini kullanın.

Bunu daha sonra da ayarlayabilir veya değiştirebilirsiniz:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini izler (ör. `qwen/qwen3.5-9b`). OpenClaw
model başvuruları sağlayıcı adını öne ekler: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını,
`curl http://localhost:1234/api/v1/models` komutunu çalıştırıp `key` alanına bakarak bulabilirsiniz.

## Etkileşimli olmayan onboarding

Kurulumu betiklemek istediğinizde (CI, sağlama, uzak önyükleme) etkileşimli olmayan onboarding kullanın:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Veya API anahtarıyla base URL ya da modeli belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, sağlayıcı öneki `lmstudio/` olmadan,
LM Studio'nun döndürdüğü model anahtarını alır (ör. `qwen/qwen3.5-9b`).

Etkileşimli olmayan onboarding, `--lmstudio-api-key` gerektirir (veya ortamda `LM_API_TOKEN`).
Kimlik doğrulamasız LM Studio sunucuları için boş olmayan herhangi bir token değeri çalışır.

`--custom-api-key` uyumluluk için desteklenmeye devam eder, ancak LM Studio için `--lmstudio-api-key` tercih edilir.

Bu işlem `models.providers.lmstudio` yazar, varsayılan modeli
`lmstudio/<custom-model-id>` olarak ayarlar ve `lmstudio:default` auth profilini yazar.

Etkileşimli kurulum, isteğe bağlı tercih edilen yükleme bağlam uzunluğu sorabilir ve bunu yapılandırmaya kaydettiği keşfedilen LM Studio modellerine uygular.

## Yapılandırma

### Akışlı kullanım uyumluluğu

LM Studio, akışlı kullanım ile uyumludur. OpenAI biçimli bir
`usage` nesnesi yaymadığında, OpenClaw bunun yerine llama.cpp tarzı
`timings.prompt_n` / `timings.predicted_n` meta verilerinden token sayılarını geri kazanır.

Aynı davranış şu OpenAI uyumlu yerel arka uçlar için de geçerlidir:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Açık yapılandırma

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

## Sorun giderme

### LM Studio algılanmıyor

LM Studio'nun çalıştığından ve `LM_API_TOKEN` ayarladığınızdan emin olun (kimlik doğrulamasız sunucular için boş olmayan herhangi bir token değeri çalışır):

```bash
# Masaüstü uygulaması üzerinden başlatın veya headless olarak:
lms server start --port 1234
```

API'nin erişilebilir olduğunu doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

Kurulum HTTP 401 bildiriyorsa, API anahtarınızı doğrulayın:

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılmış anahtarla eşleştiğini kontrol edin.
- LM Studio auth kurulumu ayrıntıları için bkz. [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Sunucunuz kimlik doğrulama gerektirmiyorsa, `LM_API_TOKEN` için boş olmayan herhangi bir token değeri kullanın.

### Tam zamanında model yükleme

LM Studio, modellerin ilk istekte yüklendiği tam zamanında (JIT) model yüklemeyi destekler. 'Model not loaded' hatalarını önlemek için bunun etkin olduğundan emin olun.
