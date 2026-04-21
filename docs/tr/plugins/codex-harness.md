---
read_when:
    - Paketle gelen Codex app-server harness'ı kullanmak istiyorsunuz
    - Codex model ref'lerine ve yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımları için Pi fallback'ini devre dışı bırakmak istiyorsunuz
summary: Paketle gelen Codex app-server harness üzerinden OpenClaw gömülü ajan dönüşlerini çalıştırın
title: Codex Harness
x-i18n:
    generated_at: "2026-04-21T09:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Paketle gelen `codex` plugin'i, OpenClaw'un gömülü ajan dönüşlerini yerleşik Pi harness yerine
Codex app-server üzerinden çalıştırmasını sağlar.

Bunu, düşük düzey ajan oturumuna Codex'in sahip olmasını istediğinizde kullanın: model
keşfi, yerel thread sürdürme, yerel Compaction ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarına, oturum dosyalarına, model seçimine, araçlara,
onaylara, medya teslimatına ve görünür transcript yansısına sahip olmaya devam eder.

Harness varsayılan olarak kapalıdır. Yalnızca `codex` plugin'i
etkin olduğunda ve çözümlenen model bir `codex/*` modeli olduğunda ya da `embeddedHarness.runtime: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` ile açıkça zorladığınızda seçilir.
Hiçbir zaman `codex/*` yapılandırmazsanız, mevcut Pi, OpenAI, Anthropic, Gemini, yerel
ve özel sağlayıcı çalıştırmaları mevcut davranışlarını korur.

## Doğru model önekini seçin

OpenClaw, OpenAI ve Codex biçimli erişim için ayrı yollara sahiptir:

| Model ref              | Çalışma zamanı yolu                           | Şu durumda kullanın                                                      |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`       | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.4` | PI üzerinden OpenAI Codex OAuth sağlayıcısı   | Codex app-server harness olmadan ChatGPT/Codex OAuth istiyorsunuz.      |
| `codex/gpt-5.4`        | Paketle gelen Codex sağlayıcısı artı Codex harness | Gömülü ajan dönüşü için yerel Codex app-server yürütmesi istiyorsunuz.  |

Codex harness yalnızca `codex/*` model ref'lerini sahiplenir. Mevcut `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, yerel ve özel sağlayıcı ref'leri
normal yollarını korur.

## Gereksinimler

- Paketle gelen `codex` plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.118.0` veya daha yeni.
- App-server süreci için Codex kimlik doğrulamasının kullanılabilir olması.

Plugin, daha eski veya sürümsüz app-server el sıkışmalarını engeller. Bu,
OpenClaw'u test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle `OPENAI_API_KEY` üzerinden gelir; ayrıca isteğe bağlı Codex CLI dosyaları olan `~/.codex/auth.json` ve
`~/.codex/config.toml` da kullanılabilir. Yerel Codex app-server'ınızın kullandığı aynı kimlik doğrulama materyalini kullanın.

## En düşük düzey yapılandırma

`codex/gpt-5.4` kullanın, paketle gelen plugin'i etkinleştirin ve `codex` harness'ı zorlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Yapılandırmanız `plugins.allow` kullanıyorsa, `codex` değerini de buraya ekleyin:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` veya bir ajan modelini `codex/<model>` olarak ayarlamak da
paketle gelen `codex` plugin'ini otomatik olarak etkinleştirir. Açık plugin girdisi, paylaşılan yapılandırmalarda yine de kullanışlıdır çünkü dağıtım niyetini açık hâle getirir.

## Diğer modelleri değiştirmeden Codex ekleyin

`codex/*` modeller için Codex, diğer her şey için Pi istiyorsanız `runtime: "auto"` kullanın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Bu yapıyla:

- `/model codex` veya `/model codex/gpt-5.4`, Codex app-server harness'ı kullanır.
- `/model gpt` veya `/model openai/gpt-5.4`, OpenAI sağlayıcı yolunu kullanır.
- `/model opus`, Anthropic sağlayıcı yolunu kullanır.
- Codex olmayan bir model seçilirse Pi, uyumluluk harness'ı olarak kalır.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex harness kullandığını kanıtlamanız gerekiyorsa
Pi fallback'ini devre dışı bırakın:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Ortam geçersiz kılması:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Fallback devre dışıyken, Codex plugin devre dışıysa,
istenen model bir `codex/*` ref'i değilse, app-server çok eskiyse veya
app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## Ajan başına Codex

Varsayılan ajan normal otomatik seçimi korurken bir ajanı yalnızca Codex yapabilirsiniz:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Ajan ve model değiştirmek için normal oturum komutlarını kullanın. `/new`, yeni bir
OpenClaw oturumu oluşturur ve Codex harness gerektiğinde kendi sidecar app-server
thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağını temizler.

## Model keşfi

Varsayılan olarak Codex plugin'i, mevcut modelleri app-server'a sorar. Keşif
başarısız olursa veya zaman aşımına uğrarsa, paketle gelen fallback kataloğunu kullanır:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Keşfi `plugins.entries.codex.config.discovery` altında ayarlayabilirsiniz:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Başlangıçta Codex yoklamasından kaçınmak ve fallback kataloğuna bağlı kalmak istediğinizde
keşfi devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server bağlantısı ve ilke

Varsayılan olarak plugin, Codex'i yerelde şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Varsayılan olarak OpenClaw, Codex'ten yerel onaylar istemesini ister. Bu
ilkeyi daha da ayarlayabilirsiniz; örneğin sıkılaştırıp incelemeleri
guardian üzerinden yönlendirebilirsiniz:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Zaten çalışan bir app-server için WebSocket taşımasını kullanın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlamı                                                                  |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` değerine bağlanır.     |
| `command`           | `"codex"`                                | stdio taşıması için yürütülebilir dosya.                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için argümanlar.                                        |
| `url`               | ayarlı değil                             | WebSocket app-server URL'si.                                           |
| `authToken`         | ayarlı değil                             | WebSocket taşıması için Bearer token.                                  |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                               |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane çağrıları için zaman aşımı.                   |
| `approvalPolicy`    | `"on-request"`                           | Thread başlatma/sürdürme/dönüşe gönderilen yerel Codex onay ilkesi.    |
| `sandbox`           | `"workspace-write"`                      | Thread başlatma/sürdürmeye gönderilen yerel Codex sandbox modu.        |
| `approvalsReviewer` | `"user"`                                 | Yerel onayları Codex guardian'ın incelemesi için `"guardian_subagent"` kullanın. |
| `serviceTier`       | ayarlı değil                             | İsteğe bağlı Codex hizmet katmanı, örneğin `"priority"`.               |

Eski ortam değişkenleri, eşleşen yapılandırma alanı ayarlı değilse
yerel testler için fallback olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir.

## Yaygın tarifler

Varsayılan stdio taşımasıyla yerel Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Pi fallback devre dışıyken yalnızca Codex harness doğrulaması:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian tarafından incelenen Codex onayları:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Açık başlıklarla uzak app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Model değiştirme OpenClaw tarafından kontrol edilmeye devam eder. Bir OpenClaw oturumu
mevcut bir Codex thread'ine bağlı olduğunda, sonraki dönüş seçili
`codex/*` modelini, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını
yeniden app-server'a gönderir. `codex/gpt-5.4` modelinden `codex/gpt-5.2` modeline geçmek,
thread bağını korur ama Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketle gelen plugin, yetkili bir slash komutu olarak `/codex` kaydeder. Bu komut
geneldir ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status`, canlı app-server bağlantısını, modelleri, hesabı, rate limit'leri, MCP sunucularını ve Skills öğelerini gösterir.
- `/codex models`, canlı Codex app-server modellerini listeler.
- `/codex threads [filter]`, son Codex thread'lerini listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex thread'ine bağlar.
- `/codex compact`, Codex app-server'dan bağlı thread üzerinde Compaction yapmasını ister.
- `/codex review`, bağlı thread için yerel Codex incelemesini başlatır.
- `/codex account`, hesap ve rate-limit durumunu gösterir.
- `/codex mcp`, Codex app-server MCP sunucu durumunu listeler.
- `/codex skills`, Codex app-server Skills öğelerini listeler.

`/codex resume`, harness'ın normal dönüşler için kullandığı aynı sidecar binding dosyasını yazar. Sonraki mesajda OpenClaw o Codex thread'ini sürdürür, şu anda seçili OpenClaw `codex/*` modelini app-server'a geçirir ve genişletilmiş geçmişi etkin tutar.

Komut yüzeyi Codex app-server `0.118.0` veya daha yenisini gerektirir. Gelecekteki veya özel bir app-server ilgili JSON-RPC yöntemini sunmazsa, tekil control yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzey gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve harness'tan dinamik araç sonuçlarını alır. Metin, görseller, video, müzik, TTS, onaylar ve message-tool çıktısı normal OpenClaw teslim yolu üzerinden akmaya devam eder.

Seçili model Codex harness kullandığında, yerel thread Compaction işlemi Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness değiştirme için bir transcript yansısını korur. Bu yansı, kullanıcı prompt'unu, son asistan metnini ve app-server bunları yayımladığında hafif Codex reasoning veya plan kayıtlarını içerir.

Medya üretimi Pi gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex `/model` içinde görünmüyor:** `plugins.entries.codex.enabled` ayarını etkinleştirin, bir `codex/*` model ref'i ayarlayın veya `plugins.allow` listesinin `codex` değerini hariç tutup tutmadığını kontrol edin.

**OpenClaw Pi'ye geri dönüyor:** test sırasında `embeddedHarness.fallback: "none"` veya `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlayın.

**App-server reddediliyor:** app-server el sıkışmasının `0.118.0` veya daha yeni bir sürüm bildirmesi için Codex'i yükseltin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model Pi kullanıyor:** bu beklenen davranıştır. Codex harness yalnızca `codex/*` model ref'lerini sahiplenir.

## İlgili

- [Agent Harness Plugins](/tr/plugins/sdk-agent-harness)
- [Model Providers](/tr/concepts/model-providers)
- [Configuration Reference](/tr/gateway/configuration-reference)
- [Testing](/tr/help/testing#live-codex-app-server-harness-smoke)
