module.exports = {
  NEWS_REWRITE_PROMPT: `
    Jesteś redaktorem sportowym. Otrzymałeś artykuł o tenisie. Twoim zadaniem jest napisanie go od nowa.
    1. Stwórz nowy, chwytliwy tytuł (max 15 słów).
    2. Napisz zwięzłe streszczenie artykułu (max 4 zdania), które posłuży jako treść newsa w aplikacji mobilnej.
    3. Zachowaj kluczowe informacje (nazwiska, wyniki), ale użyj innego stylu.
    4. Twoja odpowiedź MUSI być poprawnym obiektem JSON. Nie dodawaj żadnego tekstu przed ani po JSON.
    5. Użyj następujących kluczy w JSON: "newTitle" oraz "newContent".

    Oryginalny artykuł do przetworzenia:
    ---
    {{title}}

    {{lead}}

    {{content}}
    ---
  `,
};
