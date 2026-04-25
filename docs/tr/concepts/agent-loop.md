---
read_when:
    - Aracı döngüsünün veya yaşam döngüsü olaylarının tam bir açıklamasına ihtiyacınız var
    - Oturum kuyruklamasını, transkript yazımlarını veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Aracı döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Aracı döngüsü
x-i18n:
    generated_at: "2026-04-25T13:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Agentik döngü, bir aracının tam “gerçek” çalıştırmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akış yanıtları → kalıcılık. Bu, bir mesajı
eylemlere ve son bir yanıta dönüştüren, aynı zamanda oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw'da bir döngü, model düşünürken, araç çağırırken ve çıktı akışı yaparken
yaşam döngüsü ve akış olayları yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır.
Bu belge, bu gerçek döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum meta verilerini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` aracıyı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözümler ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve assistant/tool deltalarını akışla iletir
   - zaman aşımını uygular -> aşılırsa çalıştırmayı iptal eder
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına bağlar:
   - araç olayları => `stream: "tool"`
   - assistant deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum şeridi) ve isteğe bağlı olarak genel bir şerit üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları bu şerit sistemine beslenen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazımları da oturum dosyasındaki bir oturum yazma kilidiyle korunur. Kilit,
  süreç farkındalıklıdır ve dosya tabanlıdır; böylece süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar.
- Oturum yazma kilitleri varsayılan olarak yeniden girişsizdir. Bir yardımcı işlev,
  aynı mantıksal yazarı korurken aynı kilidin edinimini kasıtlı olarak iç içe geçiriyorsa,
  bunu açıkça `allowReentrant: true` ile etkinleştirmelidir.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox'lı çalıştırmalar bir sandbox çalışma alanı köküne yeniden yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Bootstrap/bağlam dosyaları çözümlenir ve sistem prompt raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akış başlamadan önce açılır ve hazırlanır. Daha sonraki
  herhangi bir transkript yeniden yazımı, Compaction veya kırpma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## Prompt oluşturma + sistem prompt'u

- Sistem prompt'u, OpenClaw'ın temel prompt'undan, Skills prompt'undan, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction rezerv belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem prompt'u](/tr/concepts/system-prompt).

## Hook noktaları (nerelerde araya girebilirsiniz)

OpenClaw iki hook sistemine sahiptir:

- **İç hook'lar** (Gateway hook'ları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin hook'ları**: aracı/araç yaşam döngüsü ve Gateway işlem hattı içindeki genişletme noktaları.

### İç hook'lar (Gateway hook'ları)

- **`agent:bootstrap`**: sistem prompt'u sonlandırılmadan önce bootstrap dosyaları oluşturulurken çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/çıkarmak için kullanın.
- **Komut hook'ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hook'ları (aracı + Gateway yaşam döngüsü)

Bunlar aracı döngüsü veya Gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli belirleyici biçimde geçersiz kılmak için oturum öncesi çalışır (`messages` yoktur).
- **`before_prompt_build`**: oturum yüklendikten sonra (`messages` ile) prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için çalışır. Tur başına dinamik metin için `prependContext`, sistem prompt alanında kalması gereken kararlı yönlendirme için sistem-bağlam alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk hook'udur; her iki aşamada da çalışabilir, yukarıdaki açık hook'ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin'in turu sahiplenmesine ve sentetik bir yanıt döndürmesine veya turu tamamen susturmasına izin verir.
- **`agent_end`**: tamamlanmadan sonra son mesaj listesini ve çalıştırma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemleyin veya açıklayın.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını araya girin.
- **`before_install`**: yerleşik tarama bulgularını inceleyin ve isteğe bağlı olarak Skill veya Plugin kurulumlarını engelleyin.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw'a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürün.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook'ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: Gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` nihaidir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali temizlemez.

Hook API'si ve kayıt ayrıntıları için bkz. [Plugin hook'ları](/tr/plugins/hooks).

Harness'ler bu hook'ları farklı şekilde uyarlayabilir. Codex app-server harness,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin hook'larını korurken,
Codex yerel hook'ları ayrı, daha düşük seviyeli bir Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Assistant deltaları pi-agent-core'dan akışla iletilir ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Reasoning akışı ayrı bir akış olarak veya blok yanıtlar olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe kaydetmeden/yaymadan önce boyut ve görsel yükleri açısından sanitize edilir.
- Mesajlaşma aracı gönderimleri, yinelenen assistant onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Son yükler şunlardan birleştirilir:
  - assistant metni (ve isteğe bağlı reasoning)
  - satır içi araç özetleri (verbose + izinliyse)
  - model hata verirse assistant hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri son yük listesinden kaldırılır.
- Gösterilebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core'dan akışla gelen deltalar
- `tool`: pi-agent-core'dan akışla gelen araç olayları

## Sohbet kanalı işleme

- Assistant deltaları, sohbet `delta` mesajlarına tamponlanır.
- Bir sohbet `final`, **yaşam döngüsü end/error** üzerinde yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Aracı çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- LLM boşta kalma zaman aşımı: `agents.defaults.llm.idleTimeoutSeconds`, boşta kalma penceresi içinde hiç yanıt parçası gelmezse model isteğini iptal eder. Yavaş yerel modeller veya reasoning/araç çağrısı sağlayıcıları için bunu açıkça ayarlayın; devre dışı bırakmak için `0` yapın. Ayarlanmazsa OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds`, aksi halde 120 sn kullanır. Açık LLM veya aracı zaman aşımı olmayan Cron tetiklemeli çalıştırmalar boşta kalma watchdog'unu devre dışı bırakır ve Cron dış zaman aşımına güvenir.

## Erken bitmenin mümkün olduğu yerler

- Aracı zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, aracıyı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir aracı araçları
- [Hooks](/tr/automation/hooks) — aracı yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Approvals](/tr/tools/exec-approvals) — kabuk komutları için onay geçitleri
- [Thinking](/tr/tools/thinking) — thinking/reasoning düzeyi yapılandırması
