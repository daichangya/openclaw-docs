---
read_when:
    - Görev başına istem olmadan çalışan otonom ajan iş akışlarını ayarlama
    - Ajanın bağımsız olarak neler yapabileceğini ve neler için insan onayı gerektiğini tanımlama
    - Çok programlı ajanları net sınırlar ve eskalasyon kurallarıyla yapılandırma
summary: Otonom ajan programları için kalıcı işletim yetkisini tanımlayın
title: Kalıcı talimatlar
x-i18n:
    generated_at: "2026-04-25T13:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

Kalıcı talimatlar, tanımlanmış programlar için ajanınıza **kalıcı işletim yetkisi** verir. Her seferinde tek tek görev talimatları vermek yerine, kapsamı, tetikleyicileri ve eskalasyon kuralları net olan programlar tanımlarsınız — ve ajan bu sınırlar içinde otonom olarak çalışır.

Bu, asistanınıza her cuma "haftalık raporu gönder" demek ile kalıcı yetki vermek arasındaki farktır: "Haftalık rapor senin sorumluluğunda. Her cuma derle, gönder ve yalnızca bir şeyler yanlış görünürse eskale et."

## Neden Kalıcı Talimatlar?

**Kalıcı talimatlar olmadan:**

- Her görev için ajanı siz yönlendirmeniz gerekir
- Ajan, istekler arasında boşta bekler
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Kalıcı talimatlarla:**

- Ajan, tanımlanmış sınırlar içinde otonom olarak çalışır
- Rutin işler, yönlendirme gerektirmeden zamanında yapılır
- Siz yalnızca istisnalar ve onaylar için devreye girersiniz
- Ajan, boş zamanı verimli şekilde değerlendirir

## Nasıl çalışırlar

Kalıcı talimatlar, [ajan çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturumda otomatik olarak eklenir); böylece ajanın bunları her zaman bağlamında bulundurması sağlanır. Daha büyük yapılandırmalarda, bunları `standing-orders.md` gibi ayrı bir dosyaya da koyabilir ve bu dosyaya `AGENTS.md` içinden referans verebilirsiniz.

Her program şunları belirtir:

1. **Kapsam** — ajanın yapmaya yetkili olduğu şeyler
2. **Tetikleyiciler** — ne zaman çalışacağı (zamanlama, olay veya koşul)
3. **Onay kapıları** — eyleme geçmeden önce hangi durumlarda insan onayı gerektiği
4. **Eskalasyon kuralları** — ne zaman durup yardım istemesi gerektiği

Ajan bu talimatları her oturumda çalışma alanı bootstrap dosyaları üzerinden yükler (otomatik eklenen dosyaların tam listesi için [Agent Workspace](/tr/concepts/agent-workspace) bölümüne bakın) ve zaman tabanlı uygulama için [Cron işler](/tr/automation/cron-jobs) ile birlikte bunlara göre hareket eder.

<Tip>
Kalıcı talimatları `AGENTS.md` içine koyun; böylece her oturumda yüklendiklerinden emin olursunuz. Çalışma alanı bootstrap süreci `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak ekler — ancak alt dizinlerdeki rastgele dosyaları eklemez.
</Tip>

## Bir Kalıcı Talimatın Anatomisi

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Kalıcı Talimatlar + Cron İşleri

Kalıcı talimatlar, ajanın ne yapmaya yetkili olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs) bunun ne zaman gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron işi istemi, kalıcı talimatı tekrar etmek yerine ona referans vermelidir:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Örnekler

### Örnek 1: İçerik ve Sosyal Medya (Haftalık Döngü)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Örnek 2: Finans Operasyonları (Olay Tetiklemeli)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Örnek 3: İzleme ve Uyarılar (Sürekli)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Yürüt-Doğrula-Raporla Deseni

Kalıcı talimatlar, sıkı bir yürütme disipliniyle birleştirildiğinde en iyi sonucu verir. Kalıcı talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** — Gerçek işi yapın (yalnızca talimatı kabul etmeyin)
2. **Doğrula** — Sonucun doğru olduğunu teyit edin (dosya mevcut mu, mesaj iletildi mi, veri ayrıştırıldı mı)
3. **Raporla** — Nelerin yapıldığını ve nelerin doğrulandığını sahibine bildirin

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Bu desen, ajanların en yaygın hata modunu önler: bir görevi tamamlamadan yalnızca kabul etmek.

## Çok Programlı Mimari

Birden fazla alanı yöneten ajanlar için kalıcı talimatları, sınırları net ayrı programlar olarak düzenleyin:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Her program şunlara sahip olmalıdır:

- Kendi **tetikleyici temposu** (haftalık, aylık, olay odaklı, sürekli)
- Kendi **onay kapıları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (ajan, bir programın nerede bitip diğerinin nerede başladığını bilmelidir)

## En İyi Uygulamalar

### Yapılması gerekenler

- Dar yetkiyle başlayın ve güven arttıkça kapsamı genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "Ne YAPILMAMALI" bölümleri ekleyin — sınırlar, izinler kadar önemlidir
- Güvenilir zaman tabanlı yürütme için Cron işleri ile birleştirin
- Kalıcı talimatların izlendiğini doğrulamak için ajan günlüklerini haftalık gözden geçirin
- İhtiyaçlarınız geliştikçe kalıcı talimatları güncelleyin — bunlar yaşayan belgelerdir

### Kaçınılması gerekenler

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün şeyi yap")
- Eskalasyon kurallarını atlamak — her programın bir "ne zaman durup sormalı" maddesi olmalıdır
- Ajanın sözlü talimatları hatırlayacağını varsaymak — her şeyi dosyaya yazın
- Farklı alanları tek programda karıştırmak — farklı alanlar için ayrı programlar oluşturun
- Cron işleriyle uygulamayı unutmak — tetikleyici olmayan kalıcı talimatlar, yalnızca öneri olarak kalır

## İlgili

- [Automation & Tasks](/tr/automation) — tüm otomasyon mekanizmalarına genel bakış
- [Cron Jobs](/tr/automation/cron-jobs) — kalıcı talimatlar için zamanlama uygulaması
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları için olay tetiklemeli betikler
- [Webhooks](/tr/automation/cron-jobs#webhooks) — gelen HTTP olay tetikleyicileri
- [Agent Workspace](/tr/concepts/agent-workspace) — kalıcı talimatların bulunduğu yer; otomatik eklenen bootstrap dosyalarının tam listesi de burada yer alır (`AGENTS.md`, `SOUL.md` vb.)
