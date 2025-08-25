module.exports = {
  FAST_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes (when there are matches)
  SLOW_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes (when there are no matches)
  NEWS_CRON_SCHEDULE: "* * * * *",
  NEWS_CRON_TIMEZONE: "Europe/Warsaw",
  NEWS_REWRITE_PROMPT: `
    Jesteś redaktorem sportowym. Otrzymałeś artykuł o tenisie. Twoim zadaniem jest napisanie go od nowa.
    1. Stwórz nowy, chwytliwy tytuł (max 15 słów).
    2. Napisz zwięzłe streszczenie artykułu (max 8 zdań), które posłuży jako treść newsa w aplikacji mobilnej.
    3. Zachowaj kluczowe informacje (nazwiska, wyniki), ale użyj innego stylu.
    4. Twoja odpowiedź MUSI być poprawnym obiektem JSON. Nie dodawaj żadnego tekstu przed ani po JSON.
    5. Użyj następujących kluczy w JSON: "newTitle" oraz "newContent".
    6. WAŻNE: Kategorycznie pomiń wszelkie informacje o tym, gdzie oglądać transmisję, o relacjach na żywo lub inne wezwania do działania pochodzące z oryginalnego artykułu.

    Oryginalny artykuł do przetworzenia:
    ---
    {{title}}

    {{lead}}

    {{content}}
    ---
  `,
};
