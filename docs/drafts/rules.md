Rules
📌 Vocabulary JSON Placement — Canonical Rule

1. ar_u_roots
	•	❌ NO vocabulary meanings
	•	❌ NO cards
	•	✔ Root identity only

2. ar_u_tokens
	•	✔ Basic vocabulary (lemma-level)
	•	✔ One simple meaning set
	•	✔ Optional basic card

3. ar_u_lexicon
	•	✔ Full meaning ranges
	•	✔ Sense distinctions
	•	✔ Qur’anic / contextual nuance
	•	✔ Proper vocab cards

⸻

📌 Card Rule (Minimal)
	•	Front → unique occurrence (lemma + ref)
	•	Back → range of meanings

⸻

📌 Law (One Line)
Roots define origin, tokens define words, lexicon defines meaning.

Here is the minimal, clean DOs & DON’Ts for your system structure.

⸻
## Roots
✅ DOs
	•	Build bottom-up
Universal → Occurrence → Container/Lesson
	•	Use SHA only for universal IDs
From canonical_input only
	•	Keep roots pure
Identity only, no meanings
	•	Put vocabulary on tokens / lexicon
Not on roots
	•	Normalize text only for search
Store normalized fields separately
	•	Reuse universals everywhere
One root / token / span forever
	•	Use spans for grouping, sentences for predication

⸻

❌ DON’Ts
	•	❌ Don’t add meanings to ar_u_roots
	•	❌ Don’t hash normalized/search text
	•	❌ Don’t create universals from occurrences
	•	❌ Don’t mix container logic with semantics
	•	❌ Don’t duplicate tokens, spans, or sentences
	•	❌ Don’t treat verb+prep as a noun span
	•	❌ Don’t analyze before structure exists

⸻

⚖️ Law (One Line)

Identity is universal, location is occurrence, presentation is container.

That’s the final structure rule set.


Phrase / Span — Type IDs (Minimal)

All phrases are dependent and live inside a sentence.
	•	IDAFI — إضافة
مثال: أحسن القصص
	•	WASFI — موصوف + صفة
مثال: الكتاب المبين
	•	JAR_MAJRUR — جار + مجرور
مثال: في يوسف
	•	ISHARA — إشارة + مشار إليه
مثال: تلك آيات
	•	COMPLEX — عبارة مركبة (جملة ضمنية)
مثال: بما أوحينا إليك

⸻

Law

Phrases depend; sentences decide.