export type Locale =
  | "it"
  | "en"
  | "fr"
  | "ar"
  | "es"
  | "pt"
  | "ro"
  | "uk"
  | "ru"
  | "zh"
  | "ur"
  | "tl";

export interface I18nStrings {
  welcome: string;
  language_select: string;
  intro_message: (autoscuolaNome: string) => string;
  intro_start: string;
  step_nome_q: string;
  step_nome_confirm: (nome: string) => string;
  // Nuovi step anagrafica
  step_sesso_q: string;
  step_sesso_m: string;
  step_sesso_f: string;
  step_nascita_q: string;
  step_luogo_nascita_q: string;
  step_codice_fiscale_q: string;
  step_codice_fiscale_skip: string;
  step_residenza_comune_q: string;
  step_residenza_indirizzo_q: string;
  step_tipo_istanza_q: string;
  step_tipo_istanza_esami: string;
  step_tipo_istanza_conversione: string;
  step_tipo_istanza_riclassificazione: string;
  step_paese_q: string;
  step_paese_found: (nome: string) => string;
  step_paese_confirm_yes: string;
  step_paese_confirm_no: string;
  step_paese_not_found: string;
  step_categoria_q: string;
  step_data_rilascio_q: string;
  step_data_rilascio_hint: string;
  step_data_invalid: string;
  step_scadenza_q: string;
  step_scadenza_valid: string;
  step_scadenza_expired: string;
  step_scadenza_unknown: string;
  step_scadenza_date_q: string;
  step_residenza_q: string;
  step_residenza_no_residence: string;
  step_soggiorno_q: string;
  step_soggiorno_pds: string;
  step_soggiorno_carta: string;
  step_soggiorno_cittadino: string;
  step_soggiorno_no_doc: string;
  step_soggiorno_scadenza_q: string;
  step_foto_q: string;
  step_foto_hint: string;
  step_foto_skip: string;
  step_foto_received: string;
  step_riepilogo_title: string;
  step_riepilogo_confirm: string;
  step_riepilogo_modify: string;
  step_elaborazione: string;
  result_convertible_title: string;
  result_convertible_body: string;
  result_not_convertible_title: string;
  result_not_convertible_body: string;
  result_needs_review_title: string;
  result_needs_review_body: string;
  result_docs_title: string;
  result_contact_school: string;
  error_token_invalid: string;
  error_already_completed: string;
  error_generic: string;
  input_invalid: string;
  cancelled: string;
  privacy_notice: string;
}

export const strings: Record<Locale, I18nStrings> = {
  it: {
    welcome: "Benvenuto! / Welcome! / مرحباً!\nScegli la tua lingua:",
    language_select: "Seleziona lingua:",
    intro_message: (nome) =>
      `Ciao! 👋 Sono il bot dell'autoscuola *${nome}*.\n\nTi aiuterò a raccogliere le informazioni per la conversione della tua patente estera.\n\n📋 Ti farò alcune domande — circa 5 minuti.\n📸 Alla fine ti chiederò una foto della tua patente.\n🔒 I tuoi dati sono usati solo dall'autoscuola per la tua pratica.\n\n[Privacy: i tuoi dati sono trattati ai sensi del GDPR]`,
    intro_start: "▶️ Inizia",
    step_nome_q: "Come ti chiami? Scrivi il tuo *nome e cognome completo*.",
    step_nome_confirm: (nome) => `Grazie, *${nome}*! Procediamo. 👍`,
    step_sesso_q: "Qual è il tuo sesso?",
    step_sesso_m: "👨 Maschio (M)",
    step_sesso_f: "👩 Femmina (F)",
    step_nascita_q: "Quando sei nato/a? Scrivi la data nel formato *GG/MM/AAAA*",
    step_luogo_nascita_q: "In quale *comune* sei nato/a?\nSe sei nato all'estero scrivi anche il paese (es. _Buenos Aires, Argentina_)",
    step_codice_fiscale_q: "Hai il *codice fiscale italiano*? Scrivilo, oppure premi il pulsante se non ce l'hai.",
    step_codice_fiscale_skip: "Non ho il codice fiscale",
    step_residenza_comune_q: "In quale *comune italiano* risiedi?\nScrivi comune e sigla provincia (es. _Milano, MI_)",
    step_residenza_indirizzo_q: "Qual è il tuo *indirizzo completo* in Italia?\nScrivi via, numero civico e CAP\n(es. _Via Roma 10, 20121_)",
    step_tipo_istanza_q: "Per quale motivo vuoi presentare la domanda?\nSeleziona il tipo di istanza:",
    step_tipo_istanza_esami: "📝 Sostenere gli esami (Foglio Rosa)",
    step_tipo_istanza_conversione: "🔄 Conversione/duplicato della patente",
    step_tipo_istanza_riclassificazione: "🔃 Riclassificazione della patente",
    step_paese_q:
      "In quale paese è stata rilasciata la tua patente di guida?\n\nScrivi il nome del paese in italiano o inglese (es. _Marocco_, _Romania_, _Brasil_)",
    step_paese_found: (nome) => `Ho trovato: *${nome}*\n\nÈ corretto?`,
    step_paese_confirm_yes: "✅ Sì, corretto",
    step_paese_confirm_no: "❌ No, cambia",
    step_paese_not_found: "Non ho trovato quel paese. Prova a scrivere diversamente (es. in italiano o inglese).",
    step_categoria_q:
      "Quale categoria di patente hai?\n\nSeleziona il tipo:",
    step_data_rilascio_q:
      "Quando è stata rilasciata la tua patente?\nScrivi la data nel formato *GG/MM/AAAA*\n(guarda la voce *4a* sulla tua patente)",
    step_data_rilascio_hint: "Esempio: 15/03/2018",
    step_data_invalid:
      "❌ Data non valida. Usa il formato GG/MM/AAAA (es. 15/03/2018).",
    step_scadenza_q: "La tua patente è ancora valida?",
    step_scadenza_valid: "✅ Sì, è valida",
    step_scadenza_expired: "❌ No, è scaduta",
    step_scadenza_unknown: "❓ Non so",
    step_scadenza_date_q: "Quando scade (o è scaduta)? *GG/MM/AAAA*",
    step_residenza_q:
      "Quando hai fissato la *residenza in Italia* per la prima volta?\n(Data iscrizione anagrafe — formato GG/MM/AAAA)",
    step_residenza_no_residence: "Non ho ancora la residenza",
    step_soggiorno_q: "Che tipo di documento di soggiorno hai?",
    step_soggiorno_pds: "📄 Permesso di soggiorno",
    step_soggiorno_carta: "🪪 Carta di soggiorno UE",
    step_soggiorno_cittadino: "🇮🇹 Cittadinanza italiana/UE",
    step_soggiorno_no_doc: "❌ Non ho ancora il documento",
    step_soggiorno_scadenza_q: "Quando scade il tuo permesso di soggiorno? *GG/MM/AAAA*",
    step_foto_q:
      "📸 *Invia una foto del FRONTE della tua patente*\n\nAssicurati che:\n• La foto sia nitida\n• Tutti i testi siano leggibili\n• Non ci siano riflessi",
    step_foto_hint: 'Se non hai la patente con te adesso, digita "salta".',
    step_foto_skip: "salta",
    step_foto_received: "✅ Foto ricevuta!",
    step_riepilogo_title: "📋 *Riepilogo informazioni:*",
    step_riepilogo_confirm: "✅ Sì, conferma",
    step_riepilogo_modify: "✏️ Modifica",
    step_elaborazione: "⏳ Sto elaborando le tue informazioni...",
    result_convertible_title: "🎉 *Buone notizie!*",
    result_convertible_body:
      "In base alle informazioni fornite, la tua patente sembra *convertibile direttamente*.\n\nL'autoscuola ti contatterà per i dettagli sui prossimi passi.",
    result_not_convertible_title: "ℹ️ *Risultato valutazione*",
    result_not_convertible_body:
      "In base alle informazioni fornite, la conversione diretta *non è possibile*.\n\nDovrai sostenere l'esame teorico e pratico.\nL'autoscuola può iscriverti ai corsi necessari.",
    result_needs_review_title: "⚠️ *Valutazione in corso*",
    result_needs_review_body:
      "Le informazioni raccolte richiedono una *verifica manuale* da parte dell'operatore.\n\nTi contatteranno entro 1-2 giorni lavorativi.",
    result_docs_title: "📋 *Documenti che ti verranno richiesti:*",
    result_contact_school: "📞 Contatta l'autoscuola",
    error_token_invalid:
      "❌ Link non valido o scaduto. Contatta l'autoscuola per un nuovo link.",
    error_already_completed:
      "✅ Hai già completato il questionario per questa pratica.",
    error_generic: "❌ Si è verificato un errore. Contatta l'autoscuola.",
    input_invalid: "Non ho capito. Riprova.",
    cancelled: "Operazione annullata. Puoi riprendere usando lo stesso link.",
    privacy_notice: "🔒 _I tuoi dati personali sono trattati in conformità al GDPR e usati esclusivamente per la gestione della tua pratica di conversione patente._",
  },
  en: {
    welcome: "Welcome! Choose your language:",
    language_select: "Select language:",
    intro_message: (nome) =>
      `Hello! 👋 I'm the bot for driving school *${nome}*.\n\nI'll help you collect information for your foreign licence conversion.\n\n📋 A few questions — about 5 minutes.\n📸 At the end I'll ask for a photo of your licence.\n🔒 Your data is only used by the driving school for your case.`,
    intro_start: "▶️ Start",
    step_nome_q: "What's your name? Please write your *full name*.",
    step_nome_confirm: (nome) => `Thank you, *${nome}*! Let's continue. 👍`,
    step_sesso_q: "What is your gender?",
    step_sesso_m: "👨 Male (M)",
    step_sesso_f: "👩 Female (F)",
    step_nascita_q: "When were you born? Write the date as *DD/MM/YYYY*",
    step_luogo_nascita_q: "In which *city/town* were you born?\nIf born abroad, include the country (e.g. _Buenos Aires, Argentina_)",
    step_codice_fiscale_q: "Do you have an *Italian tax code (codice fiscale)*? Write it, or press the button if you don't have one.",
    step_codice_fiscale_skip: "I don't have a tax code",
    step_residenza_comune_q: "In which *Italian city* do you reside?\nWrite city name and province code (e.g. _Milan, MI_)",
    step_residenza_indirizzo_q: "What is your *full address* in Italy?\nWrite street, number and postal code\n(e.g. _Via Roma 10, 20121_)",
    step_tipo_istanza_q: "Why are you submitting this application?\nSelect the type of request:",
    step_tipo_istanza_esami: "📝 Sit the driving exams (Provisional licence)",
    step_tipo_istanza_conversione: "🔄 Conversion/duplicate of licence",
    step_tipo_istanza_riclassificazione: "🔃 Reclassification of licence",
    step_paese_q: "In which country was your driving licence issued?\n\nWrite the country name (e.g. _Morocco_, _Romania_, _Brazil_)",
    step_paese_found: (nome) => `I found: *${nome}*\n\nIs that correct?`,
    step_paese_confirm_yes: "✅ Yes, correct",
    step_paese_confirm_no: "❌ No, change",
    step_paese_not_found: "Country not found. Please try a different spelling.",
    step_categoria_q: "Which licence category do you have?",
    step_data_rilascio_q: "When was your licence issued?\nWrite the date as *DD/MM/YYYY*\n(check field *4a* on your licence)",
    step_data_rilascio_hint: "Example: 15/03/2018",
    step_data_invalid: "❌ Invalid date. Use format DD/MM/YYYY (e.g. 15/03/2018).",
    step_scadenza_q: "Is your licence still valid?",
    step_scadenza_valid: "✅ Yes, valid",
    step_scadenza_expired: "❌ No, expired",
    step_scadenza_unknown: "❓ Not sure",
    step_scadenza_date_q: "When does it expire (or expired)? *DD/MM/YYYY*",
    step_residenza_q: "When did you first register your *residence in Italy*?\n(Municipality registration date — format DD/MM/YYYY)",
    step_residenza_no_residence: "I don't have Italian residence yet",
    step_soggiorno_q: "What type of residence document do you have?",
    step_soggiorno_pds: "📄 Residence permit (Permesso di soggiorno)",
    step_soggiorno_carta: "🪪 EU long-stay residence card",
    step_soggiorno_cittadino: "🇮🇹 Italian/EU citizenship",
    step_soggiorno_no_doc: "❌ I don't have the document yet",
    step_soggiorno_scadenza_q: "When does your residence permit expire? *DD/MM/YYYY*",
    step_foto_q: "📸 *Send a photo of the FRONT of your licence*\n\nMake sure:\n• Photo is clear and sharp\n• All text is readable\n• No glare or reflections",
    step_foto_hint: 'If you don\'t have your licence with you now, type "skip".',
    step_foto_skip: "skip",
    step_foto_received: "✅ Photo received!",
    step_riepilogo_title: "📋 *Summary of your information:*",
    step_riepilogo_confirm: "✅ Yes, confirm",
    step_riepilogo_modify: "✏️ Edit",
    step_elaborazione: "⏳ Processing your information...",
    result_convertible_title: "🎉 *Good news!*",
    result_convertible_body: "Based on the information provided, your licence appears to be *directly convertible*.\n\nThe driving school will contact you with the next steps.",
    result_not_convertible_title: "ℹ️ *Assessment result*",
    result_not_convertible_body: "Based on the information provided, direct conversion is *not possible*.\n\nYou will need to take theory and practical exams.\nThe driving school can enrol you in the required courses.",
    result_needs_review_title: "⚠️ *Assessment in progress*",
    result_needs_review_body: "The information collected requires *manual review* by an operator.\n\nThey will contact you within 1-2 business days.",
    result_docs_title: "📋 *Documents you'll need:*",
    result_contact_school: "📞 Contact the driving school",
    error_token_invalid: "❌ Invalid or expired link. Contact the driving school for a new link.",
    error_already_completed: "✅ You have already completed the questionnaire for this case.",
    error_generic: "❌ An error occurred. Please contact the driving school.",
    input_invalid: "I didn't understand. Please try again.",
    cancelled: "Cancelled. You can resume using the same link.",
    privacy_notice: "🔒 _Your personal data is processed in accordance with GDPR and used solely for managing your licence conversion case._",
  },
  ar: {
    welcome: "مرحباً! اختر لغتك:",
    language_select: "اختر اللغة:",
    intro_message: (nome) => `مرحباً! 👋 أنا روبوت مدرسة القيادة *${nome}*.\n\nسأساعدك في جمع المعلومات اللازمة لتحويل رخصة قيادتك الأجنبية.\n\n📋 بعض الأسئلة — حوالي 5 دقائق.\n📸 في النهاية سأطلب صورة من رخصتك.\n🔒 بياناتك تُستخدم فقط لإدارة ملفك.`,
    intro_start: "▶️ ابدأ",
    step_nome_q: "ما اسمك؟ اكتب *اسمك الكامل*.",
    step_nome_confirm: (nome) => `شكراً، *${nome}*! 👍`,
    step_sesso_q: "ما جنسك؟",
    step_sesso_m: "👨 ذكر (M)",
    step_sesso_f: "👩 أنثى (F)",
    step_nascita_q: "متى وُلدت؟ اكتب التاريخ بصيغة *يوم/شهر/سنة*",
    step_luogo_nascita_q: "في أي *مدينة* وُلدت؟\nإذا وُلدت في الخارج اكتب أيضاً الدولة (مثال: _الدار البيضاء، المغرب_)",
    step_codice_fiscale_q: "هل لديك *رمز ضريبي إيطالي (codice fiscale)*؟ اكتبه، أو اضغط الزر إذا لم يكن لديك.",
    step_codice_fiscale_skip: "ليس لدي رمز ضريبي",
    step_residenza_comune_q: "في أي *مدينة إيطالية* تقيم؟\nاكتب اسم المدينة ورمز المحافظة (مثال: _ميلان، MI_)",
    step_residenza_indirizzo_q: "ما *عنوانك الكامل* في إيطاليا؟\nاكتب الشارع والرقم والرمز البريدي\n(مثال: _Via Roma 10, 20121_)",
    step_tipo_istanza_q: "ما سبب تقديم هذا الطلب؟\nاختر نوع الطلب:",
    step_tipo_istanza_esami: "📝 اجتياز اختبارات القيادة",
    step_tipo_istanza_conversione: "🔄 تحويل/استبدال الرخصة",
    step_tipo_istanza_riclassificazione: "🔃 إعادة تصنيف الرخصة",
    step_paese_q: "في أي دولة صدرت رخصة قيادتك؟\n\nاكتب اسم الدولة (مثال: _المغرب_, _رومانيا_, _البرازيل_)",
    step_paese_found: (nome) => `وجدت: *${nome}*\n\nهل هذا صحيح؟`,
    step_paese_confirm_yes: "✅ نعم، صحيح",
    step_paese_confirm_no: "❌ لا، تغيير",
    step_paese_not_found: "لم أجد هذه الدولة. حاول الكتابة بشكل مختلف.",
    step_categoria_q: "ما فئة رخصتك؟",
    step_data_rilascio_q: "متى صدرت رخصتك؟\nاكتب التاريخ بصيغة *يوم/شهر/سنة*",
    step_data_rilascio_hint: "مثال: 15/03/2018",
    step_data_invalid: "❌ تاريخ غير صالح. استخدم صيغة يوم/شهر/سنة",
    step_scadenza_q: "هل رخصتك لا تزال سارية المفعول؟",
    step_scadenza_valid: "✅ نعم، سارية",
    step_scadenza_expired: "❌ لا، منتهية",
    step_scadenza_unknown: "❓ لا أعرف",
    step_scadenza_date_q: "متى تنتهي (أو انتهت)؟ *يوم/شهر/سنة*",
    step_residenza_q: "متى سجلت *إقامتك في إيطاليا* لأول مرة؟\n(تاريخ التسجيل في السجل البلدي — يوم/شهر/سنة)",
    step_residenza_no_residence: "ليس لدي إقامة في إيطاليا بعد",
    step_soggiorno_q: "ما نوع وثيقة إقامتك؟",
    step_soggiorno_pds: "📄 تصريح إقامة",
    step_soggiorno_carta: "🪪 بطاقة الإقامة الأوروبية",
    step_soggiorno_cittadino: "🇮🇹 جنسية إيطالية/أوروبية",
    step_soggiorno_no_doc: "❌ لا يوجد لدي الوثيقة بعد",
    step_soggiorno_scadenza_q: "متى ينتهي تصريح إقامتك؟ *يوم/شهر/سنة*",
    step_foto_q: "📸 *أرسل صورة من الوجه الأمامي لرخصتك*\n\nتأكد من:\n• وضوح الصورة\n• قراءة جميع النصوص\n• عدم وجود انعكاسات ضوئية",
    step_foto_hint: 'إذا لم تكن الرخصة معك الآن، اكتب "تخطي".',
    step_foto_skip: "تخطي",
    step_foto_received: "✅ تم استلام الصورة!",
    step_riepilogo_title: "📋 *ملخص معلوماتك:*",
    step_riepilogo_confirm: "✅ نعم، تأكيد",
    step_riepilogo_modify: "✏️ تعديل",
    step_elaborazione: "⏳ جارٍ معالجة معلوماتك...",
    result_convertible_title: "🎉 *أخبار جيدة!*",
    result_convertible_body: "بناءً على المعلومات المقدمة، يبدو أن رخصتك *قابلة للتحويل المباشر*.\n\nستتواصل معك مدرسة القيادة للخطوات التالية.",
    result_not_convertible_title: "ℹ️ *نتيجة التقييم*",
    result_not_convertible_body: "بناءً على المعلومات المقدمة، التحويل المباشر *غير ممكن*.\n\nستحتاج لاجتياز اختبار النظري والعملي.",
    result_needs_review_title: "⚠️ *التقييم جارٍ*",
    result_needs_review_body: "المعلومات المجمعة تتطلب *مراجعة يدوية* من قبل موظف.\n\nسيتواصلون معك خلال 1-2 يوم عمل.",
    result_docs_title: "📋 *الوثائق المطلوبة:*",
    result_contact_school: "📞 تواصل مع مدرسة القيادة",
    error_token_invalid: "❌ الرابط غير صالح أو منتهي. تواصل مع مدرسة القيادة للحصول على رابط جديد.",
    error_already_completed: "✅ لقد أكملت الاستبيان مسبقاً لهذه الحالة.",
    error_generic: "❌ حدث خطأ. تواصل مع مدرسة القيادة.",
    input_invalid: "لم أفهم. حاول مجدداً.",
    cancelled: "تم الإلغاء. يمكنك الاستئناف باستخدام نفس الرابط.",
    privacy_notice: "🔒 _بياناتك الشخصية تُعالج وفق اللائحة الأوروبية GDPR وتُستخدم حصرياً لإدارة ملف تحويل رخصتك._",
  },
  // Fallback for other locales: use English
  fr: {} as I18nStrings,
  es: {} as I18nStrings,
  pt: {} as I18nStrings,
  ro: {} as I18nStrings,
  uk: {} as I18nStrings,
  ru: {} as I18nStrings,
  zh: {} as I18nStrings,
  ur: {} as I18nStrings,
  tl: {} as I18nStrings,
};

// Fill missing locales with English fallback
for (const locale of ["fr", "es", "pt", "ro", "uk", "ru", "zh", "ur", "tl"] as Locale[]) {
  strings[locale] = strings.en;
}

export function t(locale: Locale, key: keyof I18nStrings, ...args: string[]): string {
  const locStrings = strings[locale] ?? strings.en;
  const val = locStrings[key];
  if (typeof val === "function") {
    return (val as (...a: string[]) => string)(...args);
  }
  return val as string ?? (strings.en[key] as string) ?? key;
}
