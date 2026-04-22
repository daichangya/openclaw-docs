---
read_when:
    - Paketlenmiş Codex uygulama sunucusu koşum takımını kullanmak istiyorsunuz
    - Codex model başvurularına ve yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımları için Pi geri dönüşünü devre dışı bırakmak istiyorsunuz
summary: OpenClaw gömülü ajan dönüşlerini paketlenmiş Codex uygulama sunucusu koşum takımı üzerinden çalıştırın
title: Codex Koşum Takımı
x-i18n:
    generated_at: "2026-04-22T08:54:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Koşum Takımı

Paketlenmiş `codex` Plugin'i, OpenClaw'ın yerleşik PI koşum takımı yerine
Codex uygulama sunucusu üzerinden gömülü ajan dönüşlerini çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunun Codex tarafından yönetilmesini istediğinizde kullanın: model
keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve uygulama sunucusu yürütmesi.
OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür transkript yansısını yönetir.

Koşum takımı varsayılan olarak kapalıdır. Yalnızca `codex` Plugin'i
etkinleştirildiğinde ve çözümlenen model bir `codex/*` modeli olduğunda
veya `embeddedHarness.runtime: "codex"` ya da `OPENCLAW_AGENT_RUNTIME=codex` açıkça zorlandığında seçilir.
Hiçbir zaman `codex/*` yapılandırmazsanız, mevcut PI, OpenAI, Anthropic, Gemini, local
ve custom-provider çalıştırmaları mevcut davranışlarını korur.

## Doğru model önekini seçin

OpenClaw, OpenAI erişimi ile Codex biçimli erişim için ayrı yollara sahiptir:

| Model başvurusu       | Çalışma zamanı yolu                         | Şu durumda kullanın                                                      |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile doğrudan OpenAI Platform API erişimi istiyorsunuz.  |
| `openai-codex/gpt-5.4` | PI üzerinden OpenAI Codex OAuth sağlayıcısı | Codex uygulama sunucusu koşum takımı olmadan ChatGPT/Codex OAuth istiyorsunuz. |
| `codex/gpt-5.4`       | Paketlenmiş Codex sağlayıcısı ve Codex koşum takımı | Gömülü ajan dönüşü için yerel Codex uygulama sunucusu yürütmesi istiyorsunuz. |

Codex koşum takımı yalnızca `codex/*` model başvurularını üstlenir. Mevcut `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local ve custom provider başvuruları
normal yollarını korur.

## Gereksinimler

- Paketlenmiş `codex` Plugin'i kullanılabilir durumda olan OpenClaw.
- Codex uygulama sunucusu `0.118.0` veya daha yeni sürüm.
- Uygulama sunucusu süreci için kullanılabilir Codex kimlik doğrulaması.

Plugin, daha eski veya sürümlendirilmemiş uygulama sunucusu el sıkışmalarını engeller. Bu,
OpenClaw'ı üzerinde test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle `OPENAI_API_KEY` ile,
ayrıca `~/.codex/auth.json` ve
`~/.codex/config.toml` gibi isteğe bağlı Codex CLI dosyalarıyla sağlanır. Yerel Codex uygulama sunucunuzun
kullandığı aynı kimlik doğrulama materyalini kullanın.

## Minimal yapılandırma

`codex/gpt-5.4` kullanın, paketlenmiş Plugin'i etkinleştirin ve `codex` koşum takımını zorlayın:

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

Yapılandırmanız `plugins.allow` kullanıyorsa, `codex` öğesini de oraya ekleyin:

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
paketlenmiş `codex` Plugin'ini otomatik olarak etkinleştirir. Açık Plugin girdisi,
özellikle paylaşılan yapılandırmalarda yine de yararlıdır çünkü dağıtım niyetini açıkça gösterir.

## Diğer modelleri değiştirmeden Codex ekleyin

`codex/*` modeller için Codex, diğer her şey için PI istiyorsanız `runtime: "auto"` değerini koruyun:

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

- `/model codex` veya `/model codex/gpt-5.4`, Codex uygulama sunucusu koşum takımını kullanır.
- `/model gpt` veya `/model openai/gpt-5.4`, OpenAI sağlayıcı yolunu kullanır.
- `/model opus`, Anthropic sağlayıcı yolunu kullanır.
- Codex olmayan bir model seçilirse, PI uyumluluk koşum takımı olarak kalır.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex koşum takımını kullandığını kanıtlamanız gerektiğinde
PI geri dönüşünü devre dışı bırakın:

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

Ortam değişkeni geçersiz kılması:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışı bırakıldığında, `codex` Plugin'i devre dışıysa,
istenen model bir `codex/*` başvurusu değilse, uygulama sunucusu çok eskiyse veya
uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.

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

Ajanları ve modelleri değiştirmek için normal oturum komutlarını kullanın. `/new`, yeni bir
OpenClaw oturumu oluşturur ve Codex koşum takımı gerektiğinde kendi yardımcı uygulama sunucusu
iş parçacığını oluşturur veya sürdürür. `/reset`, o iş parçacığı için OpenClaw oturum bağını temizler.

## Model keşfi

Varsayılan olarak Codex Plugin'i, uygulama sunucusundan kullanılabilir modelleri ister. Keşif
başarısız olursa veya zaman aşımına uğrarsa, paketlenmiş geri dönüş kataloğunu kullanır:

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

Başlangıçta Codex yoklamasından kaçınmak ve geri dönüş kataloğuna bağlı kalmak istediğinizde
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

## Uygulama sunucusu bağlantısı ve ilkesi

Varsayılan olarak Plugin, Codex'i yerel olarak şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Varsayılan olarak OpenClaw, Codex'ten yerel onaylar istemesini ister. Bu
ilkeyi daha da ayarlayabilirsiniz; örneğin daha sıkı hale getirip incelemeleri
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

Zaten çalışmakta olan bir uygulama sunucusu için WebSocket taşımasını kullanın:

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

| Alan                | Varsayılan                               | Anlamı                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.       |
| `command`           | `"codex"`                                | stdio taşıması için yürütülebilir dosya.                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için bağımsız değişkenler.                                |
| `url`               | ayarlanmadı                              | WebSocket uygulama sunucusu URL'si.                                      |
| `authToken`         | ayarlanmadı                              | WebSocket taşıması için Bearer token.                                    |
| `headers`           | `{}`                                     | Ek WebSocket üst bilgileri.                                              |
| `requestTimeoutMs`  | `60000`                                  | Uygulama sunucusu kontrol düzlemi çağrıları için zaman aşımı.            |
| `approvalPolicy`    | `"on-request"`                           | İş parçacığı başlatma/sürdürme/dönüşe gönderilen yerel Codex onay ilkesi. |
| `sandbox`           | `"workspace-write"`                      | İş parçacığı başlatma/sürdürmeye gönderilen yerel Codex sandbox modu.    |
| `approvalsReviewer` | `"user"`                                 | Yerel onayları Codex guardian'ın incelemesini sağlamak için `"guardian_subagent"` kullanın. |
| `serviceTier`       | ayarlanmadı                              | İsteğe bağlı Codex hizmet katmanı, örneğin `"priority"`.                 |

Aşağıdaki eski ortam değişkenleri, eşleşen yapılandırma alanı ayarlanmadığında
yerel testler için geri dönüş olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir.

## Yaygın tarifler

Varsayılan stdio taşıması ile yerel Codex:

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

PI geri dönüşü devre dışı bırakılmış şekilde yalnızca Codex koşum takımı doğrulaması:

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

Açık üst bilgilerle uzak uygulama sunucusu:

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

Model değiştirme OpenClaw tarafından yönetilmeye devam eder. Bir OpenClaw oturumu mevcut bir
Codex iş parçacığına bağlandığında, sonraki dönüş şu anda seçili olan
`codex/*` modelini, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını
uygulama sunucusuna yeniden gönderir. `codex/gpt-5.4` modelinden `codex/gpt-5.2` modeline geçmek,
iş parçacığı bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir slash komutu olarak kaydeder. Bu komut
geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status`, canlı uygulama sunucusu bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models`, canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]`, son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>`, mevcut OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact`, Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review`, bağlı iş parçacığı için yerel Codex incelemesini başlatır.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex uygulama sunucusu MCP sunucu durumunu listeler.
- `/codex skills`, Codex uygulama sunucusu Skills listesini gösterir.

`/codex resume`, normal dönüşler için koşum takımının kullandığı aynı yardımcı bağlama dosyasını
yazar. Sonraki iletide OpenClaw bu Codex iş parçacığını sürdürür, o anda seçili
OpenClaw `codex/*` modelini uygulama sunucusuna geçirir ve genişletilmiş
geçmişi etkin tutar.

Komut yüzeyi Codex uygulama sunucusu `0.118.0` veya daha yenisini gerektirir. Tek tek
denetim yöntemleri, gelecekteki veya özel bir uygulama sunucusu o JSON-RPC yöntemini
sunmuyorsa `unsupported by this Codex app-server` olarak bildirilir.

## Araçlar, medya ve Compaction

Codex koşum takımı yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve koşum takımından dinamik araç sonuçlarını
alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolu üzerinden devam eder.

Seçili model Codex koşum takımını kullandığında, yerel iş parçacığı Compaction
işlemi Codex uygulama sunucusuna devredilir. OpenClaw, kanal geçmişi,
arama, `/new`, `/reset` ve gelecekteki model veya koşum takımı geçişleri için bir transkript yansısı tutar. Bu
yansı, kullanıcı istemini, son asistan metnini ve uygulama sunucusu bunları yayınladığında
hafif Codex akıl yürütme veya plan kayıtlarını içerir.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya
anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex `/model` içinde görünmüyor:** `plugins.entries.codex.enabled` seçeneğini etkinleştirin,
bir `codex/*` model başvurusu ayarlayın veya `plugins.allow` içinde `codex` öğesinin hariç tutulup tutulmadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** hiçbir Codex koşum takımı çalıştırmayı üstlenmezse,
OpenClaw uyumluluk arka ucu olarak PI kullanabilir. Test sırasında Codex seçimini zorlamak için
`embeddedHarness.runtime: "codex"` ayarlayın veya eşleşen bir Plugin koşum takımı olmadığında
başarısız olmak için `embeddedHarness.fallback: "none"` ayarlayın. Codex uygulama sunucusu seçildikten sonra,
hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**Uygulama sunucusu reddediliyor:** uygulama sunucusu el sıkışmasının
`0.118.0` veya daha yeni bir sürüm bildirmesi için Codex'i yükseltin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün
veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`
ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu beklenen bir durumdur. Codex koşum takımı yalnızca
`codex/*` model başvurularını üstlenir.

## İlgili

- [Ajan Koşum Takımı Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
- [Test](\/help/testing#live-codex-app-server-harness-smoke)
