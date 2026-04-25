---
read_when:
    - Paketlenmiş Codex app-server bağlayıcısını kullanmak istiyorsunuz
    - Codex bağlayıcısı yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Paketlenmiş Codex app-server bağlayıcısı üzerinden OpenClaw gömülü ajan dönüşlerini çalıştırma
title: Codex bağlayıcısı
x-i18n:
    generated_at: "2026-04-25T13:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Paketlenmiş `codex` Plugin'i, OpenClaw'ın gömülü ajan dönüşlerini yerleşik PI bağlayıcısı yerine Codex app-server üzerinden çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunun Codex tarafından sahiplenilmesini istediğinizde kullanın: model keşfi, yerel thread sürdürme, yerel Compaction ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür transcript yansıtmasını sahiplenir.

Kendinizi yönlendirmeye çalışıyorsanız,
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model başvurusudur, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

Yerel Codex dönüşleri, OpenClaw Plugin kancalarını genel uyumluluk katmanı olarak korur.
Bunlar süreç içi OpenClaw kancalarıdır, Codex `hooks.json` komut kancaları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- yansıtılmış transcript kayıtları için `before_message_write`
- `agent_end`

Plugin'ler ayrıca, OpenClaw dinamik araç sonuçlarını OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce yeniden yazmak için çalışma zamanından bağımsız araç sonucu ara katmanı kaydedebilir. Bu, OpenClaw sahipli transcript araç sonucu yazımlarını dönüştüren genel
`tool_result_persist` Plugin kancasından ayrıdır.

Plugin kancası anlambiliminin kendisi için [Plugin kancaları](/tr/plugins/hooks)
ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

Bağlayıcı varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model başvurularını
`openai/gpt-*` olarak kanonik tutmalı ve yerel app-server yürütmesi istediklerinde
açıkça `embeddedHarness.runtime: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex`
zorlamalıdır. Eski `codex/*` model başvuruları uyumluluk için hâlâ bağlayıcıyı otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

## Doğru model önekini seçin

OpenAI ailesi yolları öneke özgüdür. PI üzerinden Codex OAuth istediğinizde
`openai-codex/*`; doğrudan OpenAI API erişimi istediğinizde veya
yerel Codex app-server bağlayıcısını zorlarken `openai/*` kullanın:

| Model başvurusu                                     | Çalışma zamanı yolu                           | Ne zaman kullanılır                                                         |
| --------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                    | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile mevcut doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                              | OpenClaw/PI üzerinden OpenAI Codex OAuth      | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server bağlayıcısı                | Gömülü ajan dönüşü için yerel Codex app-server yürütmesi istiyorsunuz.      |

GPT-5.5 şu anda OpenClaw'da yalnızca abonelik/OAuth ile kullanılabilir.
PI OAuth için `openai-codex/gpt-5.5` veya Codex
app-server bağlayıcısıyla `openai/gpt-5.5` kullanın. OpenAI, GPT-5.5'i genel API'de etkinleştirdiğinde
`openai/gpt-5.5` için doğrudan API anahtarı erişimi desteklenir.

Eski `codex/gpt-*` başvuruları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor
uyumluluk geçişi, eski birincil çalışma zamanı başvurularını kanonik model başvurularına yeniden yazar ve çalışma zamanı ilkesini ayrı olarak kaydeder; yalnızca geri dönüşte kullanılan eski başvurular ise değiştirilmeden bırakılır çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır.
Yeni PI Codex OAuth yapılandırmaları `openai-codex/gpt-*`; yeni yerel
app-server bağlayıcı yapılandırmaları ise `openai/gpt-*` artı
`embeddedHarness.runtime: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler.
Görsel anlamanın OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışmasını istiyorsanız
`openai-codex/gpt-*` kullanın. Görsel anlamanın sınırlı bir Codex app-server dönüşü
üzerinden çalışmasını istiyorsanız `codex/gpt-*` kullanın. Codex app-server modeli
görsel girdi desteği ilan etmelidir; yalnızca metin destekleyen Codex modelleri medya dönüşü
başlamadan önce başarısız olur.

Geçerli oturum için etkin bağlayıcıyı doğrulamak amacıyla `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüğünü etkinleştirin
ve gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt
seçilen bağlayıcı kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve
`auto` modunda her Plugin adayının destek sonucunu içerir.

Bağlayıcı seçimi canlı bir oturum denetimi değildir. Gömülü bir dönüş çalıştığında,
OpenClaw seçilen bağlayıcı kimliğini o oturum üzerine kaydeder ve aynı oturum kimliğindeki sonraki dönüşlerde de kullanmaya devam eder. Gelecekteki oturumların başka bir bağlayıcı kullanmasını istediğinizde `embeddedHarness` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ve Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın.
Bu, tek bir transcript'in iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Bağlayıcı sabitlemelerinden önce oluşturulmuş eski oturumlar, transcript geçmişine sahip olduklarında PI'ye sabitlenmiş olarak değerlendirilir. Yapılandırmayı değiştirdikten sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status`, etkin model çalışma zamanını gösterir. Varsayılan PI bağlayıcısı
`Runtime: OpenClaw Pi Default`, Codex app-server bağlayıcısı ise
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketlenmiş `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.118.0` veya daha yenisi.
- App-server süreci için kullanılabilir Codex kimlik doğrulaması.

Plugin daha eski veya sürümsüz app-server el sıkışmalarını engeller. Bu, OpenClaw'ı
test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle `OPENAI_API_KEY` ile, ayrıca `~/.codex/auth.json` ve
`~/.codex/config.toml` gibi isteğe bağlı Codex CLI dosyalarıyla sağlanır. Yerel Codex app-server'ınızın kullandığı aynı kimlik doğrulama materyalini kullanın.

## Minimal yapılandırma

`openai/gpt-5.5` kullanın, paketlenmiş Plugin'i etkinleştirin ve `codex` bağlayıcısını zorlayın:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

`agents.defaults.model` veya bir ajan modelini
`codex/<model>` olarak ayarlayan eski yapılandırmalar paketlenmiş `codex` Plugin'ini hâlâ otomatik etkinleştirir. Yeni yapılandırmalar
`openai/<model>` artı yukarıdaki açık `embeddedHarness` girdisini tercih etmelidir.

## Codex'i diğer modellerle birlikte ekleme

Aynı ajanın Codex ve Codex olmayan sağlayıcı modelleri arasında serbestçe geçmesi gerekiyorsa `runtime: "codex"` değerini genel olarak ayarlamayın. Zorlanmış bir çalışma zamanı, o ajan veya oturum için her gömülü dönüşe uygulanır. Bu çalışma zamanı zorlanmışken bir Anthropic modeli seçerseniz, OpenClaw yine de Codex bağlayıcısını dener ve o dönüşü sessizce PI üzerinden yönlendirmek yerine kapalı başarısız olur.

Bunun yerine şu şekillerden birini kullanın:

- Codex'i `embeddedHarness.runtime: "codex"` ile ayrılmış bir ajana koyun.
- Varsayılan ajanı `runtime: "auto"` ve PI geri dönüşüyle normal karma
  sağlayıcı kullanımı için bırakın.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` artı açık bir Codex çalışma zamanı ilkesi tercih etmelidir.

Örneğin bu, varsayılan ajanı normal otomatik seçimde tutar ve
ayrı bir Codex ajanı ekler:

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Bu yapıyla:

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` ajanı Codex app-server bağlayıcısını kullanır.
- `codex` ajanı için Codex eksikse veya desteklenmiyorsa, dönüş
  sessizce PI kullanmak yerine başarısız olur.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde
Codex bağlayıcısını zorlayın. Açık Plugin çalışma zamanları varsayılan olarak PI geri dönüşü olmadan gelir; bu nedenle
`fallback: "none"` isteğe bağlıdır ancak çoğu zaman belgeleyici olarak yararlıdır:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex zorlandığında OpenClaw, Codex Plugin'i devre dışıysa,
app-server çok eskiyse veya app-server başlatılamıyorsa erken başarısız olur.
Eksik bağlayıcı seçimini bilerek PI'nin işlemesini istiyorsanız yalnızca
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` ayarlayın.

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
        model: "openai/gpt-5.5",
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
OpenClaw oturumu oluşturur ve Codex bağlayıcısı gerektiğinde kendi sidecar app-server
thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağını temizler
ve sonraki dönüşün bağlayıcıyı geçerli yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin'i kullanılabilir modeller için app-server'a sorar. Keşif başarısız olursa veya zaman aşımına uğrarsa, şu modeller için paketlenmiş bir geri dönüş kataloğu kullanır:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

Başlangıçta Codex'i yoklamaktan kaçınmak ve geri dönüş kataloğuna bağlı kalmak istediğinizde keşfi devre dışı bırakın:

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

## App-server bağlantısı ve ilkesi

Varsayılan olarak Plugin, Codex'i yerelde şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Varsayılan olarak OpenClaw, yerel Codex bağlayıcı oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur: Codex, etrafta yanıt verecek kimse olmayan yerel onay istemlerinde durmadan shell ve ağ araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara katılmak için `appServer.mode:
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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex
sandbox'tan çıkmak, çalışma alanı dışına yazmak veya ağ
erişimi gibi izinler eklemek istediğinde, Codex bu onay isteğini insan istemi yerine yerel gözden geçiriciye yönlendirir. Gözden geçirici Codex'in risk çerçevesini uygular ve
belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma önlemi istiyor ancak yine de gözetimsiz ajanların ilerleme kaydetmesine ihtiyaç duyuyorsanız Guardian kullanın.

`guardian` ön ayarı, `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler.
Tekil ilke alanları yine de `mode` değerini geçersiz kılar; böylece gelişmiş dağıtımlar
ön ayarı açık seçimlerle karıştırabilir. Eski `guardian_subagent` gözden geçirici değeri
uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar
`auto_review` kullanmalıdır.

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

| Alan                | Varsayılan                               | Anlamı                                                                                                                |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex başlatır; `"websocket"` ise `url` adresine bağlanır.                                                  |
| `command`           | `"codex"`                                | stdio taşıması için yürütülebilir dosya.                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için argümanlar.                                                                                        |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                           |
| `authToken`         | ayarlanmamış                             | WebSocket taşıması için Bearer token.                                                                                  |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                               |
| `requestTimeoutMs`  | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                 |
| `mode`              | `"yolo"`                                 | YOLO veya guardian gözden geçirmeli yürütme için ön ayar.                                                              |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/sürdürme/dönüş sırasında gönderilen yerel Codex onay ilkesi.                                          |
| `sandbox`           | `"danger-full-access"`                   | Thread başlatma/sürdürme sırasında gönderilen yerel Codex sandbox modu.                                                |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski takma ad olarak kalır. |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.     |

Eski ortam değişkenleri, eşleşen yapılandırma alanı ayarlanmadığında
yerel testler için geri dönüş olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya
tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir çünkü Plugin davranışını
Codex bağlayıcısı kurulumunun geri kalanıyla aynı gözden geçirilmiş dosyada tutar.

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

Yalnızca Codex bağlayıcı doğrulaması:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
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
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Açık başlıklara sahip uzak app-server:

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
OpenAI modeli, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını
yeniden app-server'a gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek,
thread bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir slash komutu olarak kaydeder. Bu komut
geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex thread'lerini listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex thread'ine bağlar.
- `/codex compact` Codex app-server'dan bağlı thread üzerinde Compaction yapmasını ister.
- `/codex review` bağlı thread için yerel Codex incelemesini başlatır.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucu durumunu listeler.
- `/codex skills` Codex app-server Skills'ini listeler.

`/codex resume`, bağlayıcının normal dönüşler için kullandığı aynı sidecar bağlama dosyasını yazar. Sonraki mesajda OpenClaw bu Codex thread'ini sürdürür, o anda
seçili OpenClaw modelini app-server'a iletir ve genişletilmiş geçmişi
etkin tutar.

Komut yüzeyi Codex app-server `0.118.0` veya daha yenisini gerektirir. Tekil
denetim yöntemleri, gelecekteki veya özel bir app-server bu JSON-RPC yöntemini açığa çıkarmıyorsa
`unsupported by this Codex app-server` olarak bildirilir.

## Kanca sınırları

Codex bağlayıcısının üç kanca katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex bağlayıcıları arasında ürün/Plugin uyumluluğu.         |
| Codex app-server uzantı ara katmanı   | OpenClaw paketlenmiş Plugin'leri | OpenClaw dinamik araçları çevresinde dönüş başına bağdaştırıcı davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için,
OpenClaw thread başına Codex yapılandırmasını `PreToolUse`, `PostToolUse` ve
`PermissionRequest` için enjekte eder. `SessionStart`,
`UserPromptSubmit` ve `Stop` gibi diğer Codex kancaları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde OpenClaw Plugin kancaları olarak açığa çıkarılmazlar.

OpenClaw dinamik araçları için, Codex çağrı istedikten sonra aracı OpenClaw yürütür;
bu nedenle OpenClaw, bağlayıcı bağdaştırıcısında sahip olduğu Plugin ve ara katman davranışını tetikler. Codex yerel araçları için, kanonik araç kaydı Codex'e aittir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca geri çağrıları yoluyla açığa çıkarmadıkça yerel Codex
thread'ini yeniden yazamaz.

Compaction ve LLM yaşam döngüsü izdüşümleri, yerel Codex kanca komutlarından değil,
Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları bağdaştırıcı düzeyinde gözlemlerdir; Codex'in dahili istek veya Compaction payload'larının bayt düzeyinde yakalanmış kopyaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri,
iz ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır.
Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında yalnızca farklı bir model çağrısı olan PI değildir. Codex,
yerel model döngüsünün daha fazlasına sahip olur ve OpenClaw Plugin ile oturum yüzeylerini
bu sınır etrafında uyarlar.

Codex runtime v1'de desteklenenler:

| Yüzey                                   | Destek                                  | Neden                                                                                                                                         |
| --------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü    | Desteklenir                             | Codex app-server OpenAI dönüşüne, yerel thread sürdürmeye ve yerel araç devamına sahiptir.                                                   |
| OpenClaw kanal yönlendirmesi ve teslimi | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                         |
| OpenClaw dinamik araçları               | Desteklenir                             | Codex bu araçları yürütmesi için OpenClaw'dan ister; böylece OpenClaw yürütme yolunda kalır.                                                 |
| İstem ve bağlam Plugin'leri             | Desteklenir                             | OpenClaw, thread'i başlatmadan veya sürdürmeden önce istem katmanları oluşturur ve bağlamı Codex dönüşüne yansıtır.                          |
| Bağlam motoru yaşam döngüsü             | Desteklenir                             | Derleme, içeri alma veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                         |
| Dinamik araç kancaları                  | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'a ait dinamik araçlar etrafında çalışır.                          |
| Yaşam döngüsü kancaları                 | Bağdaştırıcı gözlemleri olarak desteklenir | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu payload'larıyla tetiklenir.          |
| Yerel shell ve patch engelleme veya gözlemleme | Yerel kanca rölesi üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, işlenen yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazımı desteklenmez. |
| Yerel izin ilkesi                       | Yerel kanca rölesi üzerinden desteklenir | Codex `PermissionRequest`, çalışma zamanı bunu açığa çıkardığı yerde OpenClaw ilkesi üzerinden yönlendirilebilir.                            |
| App-server iz yakalama                  | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                       |

Codex runtime v1'de desteklenmeyenler:

| Yüzey                                              | V1 sınırı                                                                                                                                      | Gelecek yolu                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Yerel araç argümanı değiştirme                     | Codex yerel ön araç kancaları engelleyebilir, ancak OpenClaw Codex'e ait yerel araç argümanlarını yeniden yazmaz.                             | Araç girdisini değiştirmek için Codex kanca/şema desteği gerektirir.                                         |
| Düzenlenebilir Codex yerel transcript geçmişi      | Kanonik yerel thread geçmişi Codex'e aittir. OpenClaw bir yansıtma sahibidir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel thread cerrahisi gerekirse açık Codex app-server API'leri eklenmelidir.                               |
| Codex'e ait yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex'e ait yerel araç kayıtlarını değil OpenClaw'a ait transcript yazımlarını dönüştürür.                                 | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazım Codex desteği gerektirir.                  |
| Zengin yerel Compaction meta verisi                | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir korunan/atılan liste, token deltası veya özet payload'ı almaz. | Daha zengin Codex Compaction olayları gerekir.                                                               |
| Compaction müdahalesi                              | Geçerli OpenClaw Compaction kancaları Codex modunda bildirim düzeyindedir.                                                                     | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/sonra Compaction kancaları eklenmelidir. |
| Durdurma veya son yanıt kapısı                     | Codex'in yerel stop kancaları vardır, ancak OpenClaw son yanıt kapısını v1 Plugin sözleşmesi olarak açığa çıkarmaz.                           | Döngü ve zaman aşımı korumalarıyla gelecekte isteğe bağlı bir ilkel.                                         |
| Taahhüt edilmiş v1 yüzeyi olarak yerel MCP kanca eşliği | Röle geneldir, ancak OpenClaw yerel MCP ön/sonra kanca davranışını uçtan uca sürüm kapılı olarak test etmemiştir.                          | Desteklenen app-server protokol tabanı bu payload'ları kapsadığında OpenClaw MCP röle testleri ve belgeleri eklenmelidir. |
| Bayt düzeyinde model API isteği yakalama           | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak son OpenAI API isteğini Codex çekirdeği dahili olarak oluşturur.        | Codex model-istek izleme olayı veya hata ayıklama API'si gerekir.                                            |

## Araçlar, medya ve Compaction

Codex bağlayıcısı yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve bağlayıcıdan dinamik araç sonuçları alır.
Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktıları
normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel kanca rölesi bilerek genel tutulmuştur, ancak v1 destek sözleşmesi
yalnızca OpenClaw'ın test ettiği Codex'e ait yerel araç ve izin yollarıyla sınırlıdır. Çalışma zamanı
sözleşmesi bunu adlandırana kadar gelecekteki her Codex kanca olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

Codex MCP araç onayı elicitation'ları, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı
üzerinden yönlendirilir. Codex `request_user_input` istemleri kaynak
sohbete geri gönderilir ve kuyruğa alınan sonraki takip mesajı ek bağlam olarak yönlendirilmek yerine
o yerel sunucu isteğine yanıt verir. Diğer MCP elicitation
istekleri yine kapalı başarısız olur.

Seçili model Codex bağlayıcısını kullandığında, yerel thread Compaction'ı
Codex app-server'a devredilir. OpenClaw kanal
geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya bağlayıcı değiştirme için bir transcript yansıtması tutar. Bu
yansıtma, kullanıcı istemini, son asistan metnini ve app-server bunları yaydığında hafif Codex
muhakeme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir
Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste
sunmaz.

Kanonik yerel thread Codex'e ait olduğu için, `tool_result_persist` şu anda
Codex'e ait yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca
OpenClaw'a ait bir oturum transcript araç sonucu yazıldığında uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya
anlama `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için
bu beklenen bir durumdur. `embeddedHarness.runtime: "codex"` ile (veya eski bir `codex/*` başvurusu ile)
bir `openai/gpt-*` modeli seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve
`plugins.allow` değerinin `codex`i dışlayıp dışlamadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `runtime: "auto"` hâlâ hiçbir Codex bağlayıcısı çalıştırmayı sahiplenmediğinde uyumluluk arka ucu olarak PI kullanabilir.
Test ederken Codex seçimini zorlamak için
`embeddedHarness.runtime: "codex"` ayarlayın. Zorlanmış bir Codex çalışma zamanı artık siz
açıkça `embeddedHarness.fallback: "pi"` ayarlamadıkça PI'ye geri dönmek yerine başarısız olur.
Codex app-server seçildiğinde, hataları ek geri dönüş yapılandırması olmadan doğrudan yüzeye çıkar.

**App-server reddediliyor:** app-server el sıkışması
`0.118.0` veya daha yeni sürüm bildirecek şekilde Codex'i güncelleyin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`
ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** o ajan için
`embeddedHarness.runtime: "codex"` zorlamadıysanız veya eski bir
`codex/*` başvurusu seçmediyseniz bu beklenir. Düz `openai/gpt-*` ve diğer sağlayıcı başvuruları `auto` modunda normal
sağlayıcı yolunda kalır. `runtime: "codex"` zorlarsanız, o ajan için her gömülü
dönüş Codex tarafından desteklenen bir OpenAI modeli olmak zorundadır.

## İlgili

- [Ajan bağlayıcı Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin kancaları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
