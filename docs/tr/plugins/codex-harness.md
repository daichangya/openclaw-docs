---
read_when:
    - Bundled Codex app-server harness kullanmak istiyorsunuz
    - Codex model başvurularına ve yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımları için PI geri dönüşünü devre dışı bırakmak istiyorsunuz
summary: OpenClaw gömülü ajan dönüşlerini bundled Codex app-server harness üzerinden çalıştırın
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T09:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Bundled `codex` Plugin'i, OpenClaw'ın gömülü ajan dönüşlerini
yerleşik PI harness yerine Codex app-server üzerinden çalıştırmasını sağlar.

Bunu, düşük düzey ajan oturumunun sahibi olarak Codex'i kullanmak istediğinizde
kullanın: model keşfi, yerel thread sürdürme, yerel Compaction ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarının, oturum dosyalarının, model seçiminin, araçların,
onayların, medya tesliminin ve görünür transkript yansısının sahibidir.

Yerel Codex dönüşleri de paylaşılan Plugin Hook'larına uyar; böylece istem şimleri,
Compaction farkındalığı olan otomasyon, araç middleware'i ve yaşam döngüsü gözlemcileri
PI harness ile uyumlu kalır:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Bundled Plugin'ler, eşzamansız `tool_result` middleware'i eklemek için bir
Codex app-server eklenti fabrikası da kaydedebilir.

Harness varsayılan olarak kapalıdır. Yalnızca `codex` Plugin'i
etkin olduğunda ve çözümlenen model bir `codex/*` modeli olduğunda ya da
`embeddedHarness.runtime: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` ile açıkça zorlandığında seçilir.
Hiçbir zaman `codex/*` yapılandırmazsanız, mevcut PI, OpenAI, Anthropic, Gemini, local
ve custom-provider çalıştırmaları geçerli davranışlarını korur.

## Doğru model önekini seçin

OpenClaw, OpenAI ve Codex biçimli erişim için ayrı yollara sahiptir:

| Model başvurusu       | Çalışma zamanı yolu                         | Şu durumda kullanın                                                      |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile doğrudan OpenAI Platform API erişimi istiyorsanız. |
| `openai-codex/gpt-5.4` | PI üzerinden OpenAI Codex OAuth sağlayıcısı | Codex app-server harness olmadan ChatGPT/Codex OAuth istiyorsanız.      |
| `codex/gpt-5.4`       | Bundled Codex sağlayıcısı + Codex harness   | Gömülü ajan dönüşü için yerel Codex app-server yürütmesi istiyorsanız.  |

Codex harness yalnızca `codex/*` model başvurularını sahiplenir. Mevcut `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local ve custom provider başvuruları
normal yollarını korur.

## Gereksinimler

- Bundled `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.118.0` veya daha yenisi.
- App-server süreci için kullanılabilir Codex kimlik doğrulaması.

Plugin, daha eski veya sürümsüz app-server el sıkışmalarını engeller. Bu,
OpenClaw'ı test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle `OPENAI_API_KEY` ile, ayrıca
`~/.codex/auth.json` ve
`~/.codex/config.toml` gibi isteğe bağlı Codex CLI dosyalarıyla sağlanır. Yerel Codex app-server'ınızın
kullandığı aynı kimlik doğrulama materyalini kullanın.

## Minimal yapılandırma

`codex/gpt-5.4` kullanın, bundled Plugin'i etkinleştirin ve `codex` harness'i zorlayın:

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

Yapılandırmanız `plugins.allow` kullanıyorsa, `codex` değerini de oraya ekleyin:

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
bundled `codex` Plugin'ini otomatik etkinleştirir. Açık Plugin girdisi, paylaşılan yapılandırmalarda yine de
yararlıdır; çünkü dağıtım amacını belirgin kılar.

## Diğer modelleri değiştirmeden Codex ekleme

`codex/*` modelleri için Codex, diğer her şey için PI
istiyorsanız `runtime: "auto"` değerini koruyun:

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

- `/model codex` veya `/model codex/gpt-5.4`, Codex app-server harness'i kullanır.
- `/model gpt` veya `/model openai/gpt-5.4`, OpenAI sağlayıcı yolunu kullanır.
- `/model opus`, Anthropic sağlayıcı yolunu kullanır.
- Codex olmayan bir model seçilirse, PI uyumluluk harness'i olarak kalır.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün
Codex harness kullandığını kanıtlamanız gerekiyorsa PI geri dönüşünü devre dışı bırakın:

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

Geri dönüş devre dışıyken, Codex Plugin'i devre dışıysa,
istenen model bir `codex/*` başvurusu değilse, app-server çok eskiyse veya
app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## Ajan başına Codex

Varsayılan ajan normal
otomatik seçimi korurken bir ajanı yalnızca Codex yapabilirsiniz:

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
OpenClaw oturumu oluşturur ve Codex harness, gerektiğinde yan app-server
thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağını temizler.

## Model keşfi

Varsayılan olarak Codex Plugin'i, app-server'dan kullanılabilir modelleri ister. Keşif
başarısız olursa veya zaman aşımına uğrarsa bundled geri dönüş kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamasını önlemek ve geri dönüş kataloğunda kalmasını
istediğinizde keşfi devre dışı bırakın:

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

Varsayılan olarak Plugin, Codex'i yerel olarak şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO kipinde başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur:
Codex, kimsenin yanıtlamak için etrafta olmadığı yerel onay istemlerinde
duraksamadan shell ve ağ araçlarını kullanabilir.

Codex guardian tarafından gözden geçirilen onaylara katılmak için `appServer.mode:
"guardian"` ayarlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian kipi şu yapıya genişler:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Guardian, yerel bir Codex onay gözden geçiricisidir. Codex sandbox dışına çıkmak,
çalışma alanı dışına yazmak veya ağ erişimi gibi izinler eklemek istediğinde,
Codex bu onay isteğini insan istemi yerine bir gözden geçirici alt ajana yönlendirir.
Gözden geçirici bağlamı toplar ve Codex'in risk çerçevesini uygular, ardından
belirli isteği onaylar veya reddeder. Guardian, YOLO kipinden daha fazla
koruma isterken yine de gözetimsiz ajanların ve Heartbeat'lerin ilerleme kaydetmesi gerektiğinde yararlıdır.

Docker canlı harness, şu durumda bir Guardian yoklaması içerir:
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Codex harness'i
Guardian kipinde başlatır, zararsız bir yükseltilmiş shell komutunun onaylandığını doğrular ve
güvenilmeyen bir dış hedefe sahte gizli anahtar yüklemesinin reddedildiğini doğrular; böylece ajan
açık onay için geri sorar.

Tekil ilke alanları yine de `mode` değerine üstün gelir; bu nedenle gelişmiş dağıtımlar
hazır ayarı açık seçimlerle karıştırabilir.

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

| Alan                | Varsayılan                               | Anlamı                                                                                                     |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex başlatır; `"websocket"` `url` adresine bağlanır.                                          |
| `command`           | `"codex"`                                | stdio taşıması için yürütülebilir dosya.                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için argümanlar.                                                                            |
| `url`               | ayarsız                                  | WebSocket app-server URL'si.                                                                               |
| `authToken`         | ayarsız                                  | WebSocket taşıması için Bearer token.                                                                      |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                   |
| `requestTimeoutMs`  | `60000`                                  | App-server denetim düzlemi çağrıları için zaman aşımı.                                                     |
| `mode`              | `"yolo"`                                 | YOLO veya guardian gözden geçirmeli yürütme için hazır ayar.                                               |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/sürdürme/dönüş için gönderilen yerel Codex onay ilkesi.                                   |
| `sandbox`           | `"danger-full-access"`                   | Thread başlatma/sürdürme için gönderilen yerel Codex sandbox kipi.                                         |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian'ın istemleri gözden geçirmesi için `"guardian_subagent"` kullanın.                         |
| `serviceTier`       | ayarsız                                  | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır. |

Daha eski ortam değişkenleri, eşleşen yapılandırma alanı ayarsız olduğunda
yerel test için geri dönüş olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya
tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için
yapılandırma tercih edilir; çünkü Plugin davranışını, Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

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

PI geri dönüşü devre dışı bırakılmış şekilde yalnızca Codex harness doğrulaması:

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

Guardian tarafından gözden geçirilen Codex onayları:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Model değiştirme OpenClaw denetiminde kalır. Bir OpenClaw oturumu
mevcut bir Codex thread'ine bağlandığında, sonraki dönüş o anda seçili
`codex/*` modeli, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını
yeniden app-server'a gönderir. `codex/gpt-5.4` modelinden `codex/gpt-5.2` modeline geçmek,
thread bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Bundled Plugin, yetkili slash komutu olarak `/codex` kaydeder. Geneldir
ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex thread'lerini listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex thread'ine bağlar.
- `/codex compact` Codex app-server'dan bağlı thread'i sıkıştırmasını ister.
- `/codex review` bağlı thread için Codex yerel incelemesini başlatır.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucu durumunu listeler.
- `/codex skills` Codex app-server Skills'ini listeler.

`/codex resume`, harness'in normal dönüşler için kullandığı aynı sidecar bağlama dosyasını yazar.
Sonraki mesajda OpenClaw bu Codex thread'ini sürdürür, o anda seçili
OpenClaw `codex/*` modelini app-server'a geçirir ve genişletilmiş
geçmişi etkin tutar.

Komut yüzeyi Codex app-server `0.118.0` veya daha yenisini gerektirir. Tekil
denetim yöntemleri, gelecekteki veya özel bir app-server bu JSON-RPC yöntemini sunmazsa
`unsupported by this Codex app-server` olarak raporlanır.

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzey gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve
harness'ten dinamik araç sonuçları alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolundan geçmeye devam eder.

Codex MCP araç onay çağrıları, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin
onay akışı üzerinden yönlendirilir; diğer çağrılar ve serbest biçimli girdi istekleri yine fail-closed olur.

Seçili model Codex harness kullandığında yerel thread Compaction işlemi
Codex app-server'a devredilir. OpenClaw; kanal geçmişi,
arama, `/new`, `/reset` ve gelecekteki model veya harness değiştirme için bir transkript yansısı tutar. Bu
yansı; kullanıcı istemini, nihai assistant metnini ve app-server bunları yaydığında
hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca
yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir
Compaction özeti veya Compaction sonrasında Codex'in hangi girdileri tuttuğuna dair denetlenebilir bir
liste sunmaz.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya
anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex `/model` içinde görünmüyor:** `plugins.entries.codex.enabled` değerini etkinleştirin,
bir `codex/*` model başvurusu ayarlayın veya `plugins.allow` içinde `codex` dışlanmış mı kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** hiçbir Codex harness çalıştırmayı sahiplenmezse,
OpenClaw uyumluluk arka ucu olarak PI kullanabilir.
Test sırasında Codex seçimini zorlamak için `embeddedHarness.runtime: "codex"` ayarlayın veya
hiçbir Plugin harness eşleşmediğinde başarısız olması için `embeddedHarness.fallback: "none"` ayarlayın.
Codex app-server seçildiğinde, hataları ek
geri dönüş yapılandırması olmadan doğrudan görünür.

**App-server reddediliyor:** app-server el sıkışmasının
`0.118.0` veya daha yeni sürüm bildirmesi için Codex'i yükseltin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması anında başarısız oluyor:** `appServer.url`, `authToken`
ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu beklenen davranıştır. Codex harness yalnızca
`codex/*` model başvurularını sahiplenir.

## İlgili

- [Agent Harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
- [Test](/tr/help/testing#live-codex-app-server-harness-smoke)
