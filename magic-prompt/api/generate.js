// api/generate.js
// Bu funksiya Vercel-də serverless function kimi işləyir: /api/generate
// OpenRouter-in PULSUZ modellərini işlədir (Anthropic API-yə görə pul tələb etmir).

const CATEGORY_GUIDES = {
  email: `Kateqoriya: E-poçt yazmaq.
Optimizə edilmiş prompt aşağıdakıları dəqiq soruşmalıdır:
- Göndərənin kim olduğu, alıcının kim olduğu, əlaqənin xarakteri (rəsmi/qeyri-rəsmi)
- E-poçtun məqsədi (xahiş, təklif, şikayət, təşəkkür və s.)
- İstənilən ton (rəsmi, səmimi, qısa, ətraflı)
- Türkiyə/Azərbaycan iş mühitinə uyğun müraciət formaları (məs. "Hörmətli", "Salam")
- Son olaraq aydın bir "call to action" (nə gözlənilir alıcıdan)`,

  sunum: `Kateqoriya: Sunum / Təqdimat hazırlamaq.
Optimizə edilmiş prompt aşağıdakıları dəqiq soruşmalıdır:
- Auditoriya kim (investorlar, tələbələr, iş yoldaşları)
- Neçə slayd, neçə dəqiqəlik təqdimat
- Əsas mesaj / tezis nədir
- Yerli nümunələr istənilməlidir (Azərbaycan/Türkiyə bazarından, Amerika nümunələri əvəzinə)
- Vizual struktur təklifi (başlıq, alt başlıqlar, data nöqtələri)`,

  is_fikri: `Kateqoriya: İş fikri / Startap konsepti.
Optimizə edilmiş prompt aşağıdakıları dəqiq soruşmalıdır:
- Hədəf bazar (yerli, məsələn Azərbaycan/Türkiyə şəraiti, qanunvericilik, ödəniş vərdişləri)
- Problem-həll cütlüyü aydın tərif edilməlidir
- Rəqiblərin yerli kontekstdə təhlili
- Gəlir modeli təklifləri yerli reallıqlara uyğun (məs. nağd ödəniş vərdişi, kart istifadəsi)
- Növbəti addımlar (MVP, pilot bazar və s.)`,

  sinav: `Kateqoriya: Sınaq/imtahana hazırlaşmaq.
Optimizə edilmiş prompt aşağıdakıları dəqiq soruşmalıdır:
- Mövzu və dərəcə (universitet, məktəb, hansı fənn)
- Bilik səviyyəsi (başlanğıc/orta/irəli)
- İstənilən format (test sualları, açıq-uclu suallar, xülasə, flashcard)
- Yerli təhsil sisteminə uyğunluq (məs. Azərbaycan/Türkiyə universitet proqramı)
- Öyrənmə üsulu tərcihi (Feynman texnikası, təkrar test və s.)`,

  genel: `Kateqoriya: Ümumi/sərbəst istək.
Optimizə edilmiş prompt istifadəçinin əsl niyyətini aydınlaşdırmalı, çatışmayan detalları
soruşmaq əvəzinə məntiqli fərziyyələrlə doldurmalı, və nəticənin formatını (uzunluq, dil,
struktur) dəqiq müəyyən etməlidir.`,
};

const SYSTEM_PROMPT = `Sən təcrübəli bir prompt mühəndisisən. Sənin işin istifadəçinin qısa,
xam istəyini götürüb, bunu Claude/ChatGPT kimi AI modellərindən ƏN YAXŞI nəticəni alacaq,
Azərbaycan/Türkiyə kontekstinə uyğunlaşdırılmış, DETALLI bir promota çevirməkdir.

QAYDALAR:
1. Cavabın YALNIZ hazır prompt mətni olmalıdır — heç bir izah, giriş cümləsi, ya da
   "Budur sizin promptunuz:" kimi əlavə söz YAZMA.
2. Prompt Azərbaycan dilində (və ya istifadəçi hansı dildə yazıbsa o dildə) yazılmalıdır.
3. Amerika-mərkəzli nümunələr əvəzinə yerli (Azərbaycan/Türkiyə) reallıqlara, qanunlara,
   mədəniyyətə uyğun nümunələr və kontekst istifadə et.
4. Prompt rol (persona), kontekst, dəqiq tapşırıq, format tələbləri və məhdudiyyətləri
   (uzunluq, ton, dil) aydın şəkildə əhatə etməlidir.
5. Prompt maksimum 150-200 söz olmalıdır — çox uzun olmasın, praktik olsun.
6. ÇOX VACİB: Öz düşüncə prosesini, planını, təhlilini və ya izahını HEÇ VAXT göstərmə.
   "Düşünürəm ki...", "Əvvəlcə...", "Analiz:", "Reasoning:", "<think>" kimi hər hansı
   fikirləşmə izi YAZMA. Birbaşa, heç bir prefiks olmadan yalnız son prompt mətnini yaz.`;

// Bəzi modellər (xüsusən "reasoning" xüsusiyyətli pulsuz modellər) təlimata baxmayaraq
// öz düşüncə prosesini ("<think>...</think>", "Düşünürəm ki...", "Budur sizin
// promptunuz:" kimi) cavabın içinə qatır. Bu funksiya belə izləri silir, yalnız
// əsl prompt mətnini saxlayır.
function stripThinkingTraces(text) {
  let cleaned = text;

  // <think>...</think> və ya [think]...[/think] bloklarını tam sil
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/\[think\][\s\S]*?\[\/think\]/gi, "");

  // Sətir başında olan tipik "düşüncə" prefikslərini (bütün sətri) sil
  const thinkingLinePrefixes =
    /^\s*(düşün(cə|ürəm)[^\n]*|analiz\s*:.*|reasoning\s*:.*|thinking\s*:.*|plan\s*:.*|əvvəlcə,?\s+.*|budur\s+(sizin\s+)?promptunuz\s*:?.*|i(ş)?tə\s+prompt\s*:?.*|here'?s?\s+the\s+prompt\s*:?.*)\s*$/gim;
  cleaned = cleaned.replace(thinkingLinePrefixes, "");

  // Prompt mətnini bəzən "````" kod blokuna salırlar — varsa çıxar
  cleaned = cleaned.replace(/^```[a-z]*\n?/gim, "").replace(/```$/gim, "");

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

// Bəzi pulsuz/kvantlaşdırılmış modellər ara-sıra əlaqəsiz əlifbalardan (Çin, yapon,
// koreya, ərəb, ivrit, tay, hind və s.) təsadüfi simvollar qatır ("token sızması").
// Bu funksiya nəticəni təmizləyir: yalnız latın, kiril (Azərbaycan/Türk hərfləri daxil
// olmaqla), rəqəm və adi durğu işarələrini saxlayır.
function sanitizePromptText(text) {
  const unwantedScripts =
    /[\u4E00-\u9FFF\u3000-\u303F\u3040-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0E00-\u0E7F\u0900-\u097F\uFF00-\uFFEF]/g;

  return text
    .replace(unwantedScripts, "")
    // silinmə nəticəsində yaranan artıq boşluqları təmizlə
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Limit hər gün 00:00 UTC-də sıfırlanır. Bunu Bakı vaxtına (UTC+4) çevirib
// istifadəçiyə anlaşılan bir mesaj qaytarırıq.
function getResetTimeMessage() {
  const now = new Date();
  const nextResetUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

  const bakuTime = new Intl.DateTimeFormat("az-AZ", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
  }).format(nextResetUTC);

  const hoursLeft = Math.ceil((nextResetUTC - now) / (1000 * 60 * 60));

  return `Limit Bakı vaxtı ilə saat ${bakuTime}-da (təqribən ${hoursLeft} saat sonra) sıfırlanacaq.`;
}

// OpenRouter-ə sorğu göndərir. 25 saniyəlik nəzarətli timeout var ki, Vercel
// funksiyanı özü abrupt kəsib HTML xəta səhifəsi qaytarmasın.
async function callOpenRouter({ apiKey, model, systemContent, userMessage }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://magic-prompt.vercel.app",
        "X-Title": "Magic Prompt Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 600,
        reasoning: { exclude: true },
      }),
    });

    if (!response.ok) {
      return { ok: false, status: response.status, errorText: await response.text() };
    }

    const data = await response.json();
    const rawPrompt = data?.choices?.[0]?.message?.content?.trim();
    return { ok: true, rawPrompt, modelUsed: data.model || model };
  } finally {
    clearTimeout(timeoutId);
  }
}

// OpenRouter gündəlik limiti dolanda ehtiyat variant kimi Google Gemini-nin
// öz pulsuz API-sinə keçirik — bu tamamilə ayrı, öz limiti olan bir xidmətdir.
async function callGemini({ apiKey, systemContent, userMessage }) {
  const geminiModel = "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContent }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
        }),
      }
    );

    if (!response.ok) {
      return { ok: false, status: response.status, errorText: await response.text() };
    }

    const data = await response.json();
    const rawPrompt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { ok: true, rawPrompt, modelUsed: `google/${geminiModel} (ehtiyat)` };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = async function handler(req, res) {
  // CORS - sadə frontend-dən çağırış üçün
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Yalnız POST metoduna icazə verilir." });
    return;
  }

  const { request: userRequest, category, attachedContext, attachedFileName } = req.body || {};

  if (!userRequest || typeof userRequest !== "string" || !userRequest.trim()) {
    res.status(400).json({ error: "'request' sahəsi boş ola bilməz." });
    return;
  }

  // Server tərəfində də təhlükəsizlik üçün ölçünü məhdudlaşdır (frontend artıq kəsib göndərir)
  const MAX_ATTACHED_CHARS = 6000;
  const safeAttachedContext =
    typeof attachedContext === "string" ? attachedContext.slice(0, MAX_ATTACHED_CHARS) : "";

  const apiKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY; // könüllü — varsa fallback işləyir
  if (!apiKey) {
    res.status(500).json({
      error:
        "OPENROUTER_API_KEY tapılmadı. Vercel-in Environment Variables bölməsinə əlavə edin.",
    });
    return;
  }

  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
  const categoryGuide = CATEGORY_GUIDES[category] || CATEGORY_GUIDES.genel;

  const systemContent = safeAttachedContext
    ? `${SYSTEM_PROMPT}\n\n${categoryGuide}\n\nİstifadəçi bir sənəd də əlavə edib. Yaratdığın promptda bu sənədin məzmununa uyğun konkret detalları (rəqəmlər, adlar, mövzular) istifadə et ki, prompt daha dəqiq və şəxsiləşdirilmiş olsun.`
    : `${SYSTEM_PROMPT}\n\n${categoryGuide}`;

  // Əlavə edilmiş sənəd varsa, istifadəçi mesajına aydın işarələnmiş şəkildə qoşuruq
  let userMessage = userRequest.trim();
  if (safeAttachedContext) {
    const label = attachedFileName ? `"${attachedFileName}" adlı sənəd` : "əlavə edilmiş sənəd";
    userMessage += `\n\n--- ${label} məzmunu (istinad üçün) ---\n${safeAttachedContext}\n--- sənəd sonu ---`;
  }

  try {
    let result = await callOpenRouter({ apiKey, model, systemContent, userMessage });
    let geminiAttempted = false;
    let geminiError = null;

    // OpenRouter gündəlik limiti (50/gün) dolubsa və Gemini açarı varsa, ehtiyat
    // variana keçirik. Bu, tamamilə ayrı bir xidmət olduğu üçün öz limitini gətirir.
    if (!result.ok && result.status === 429 && geminiKey) {
      geminiAttempted = true;
      const geminiResult = await callGemini({ apiKey: geminiKey, systemContent, userMessage });
      if (geminiResult.ok) {
        result = geminiResult;
      } else {
        geminiError = geminiResult;
      }
    }

    if (!result.ok) {
      if (result.status === 429) {
        let debugNote;
        if (!geminiKey) {
          debugNote = "(Gemini fallback sınanmadı: GEMINI_API_KEY təyin olunmayıb.)";
        } else if (geminiAttempted && geminiError) {
          debugNote = `(Gemini fallback da uğursuz oldu — status ${geminiError.status}: ${String(geminiError.errorText).slice(0, 200)})`;
        } else {
          debugNote = "";
        }
        res.status(429).json({
          error: `Pulsuz model gündəlik limiti doldu (50 sorğu/gün). ${getResetTimeMessage()} ${debugNote}`,
        });
        return;
      }
      res.status(result.status || 500).json({ error: `Model xətası: ${result.errorText}` });
      return;
    }

    if (!result.rawPrompt) {
      res.status(502).json({ error: "Model boş cavab qaytardı, yenidən sınayın." });
      return;
    }

    const generatedPrompt = sanitizePromptText(stripThinkingTraces(result.rawPrompt));

    if (!generatedPrompt) {
      res.status(502).json({
        error: "Model anlaşılmaz nəticə qaytardı, yenidən sınayın (başqa model seçin).",
      });
      return;
    }

    res.status(200).json({ prompt: generatedPrompt, model_used: result.modelUsed });
  } catch (err) {
    if (err.name === "AbortError") {
      res.status(504).json({
        error: "Model çox uzun çəkdi (25 saniyədən çox). Yenidən sınayın.",
      });
      return;
    }
    res.status(500).json({ error: `Server xətası: ${err.message}` });
  }
};
