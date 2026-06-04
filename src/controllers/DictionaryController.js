import fetch from 'node-fetch';

// GET /dictionary?word=

const getDictionaryEntry = async (req, res) => {
  const word = req.query.word.toLowerCase().replace(/[^a-z']/g, '');

  try {
    // Gọi song song: dictionary API + translate API
    const [dictRes, transRes] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
    ]);

    // --- IPA ---
    let ukIpa = null, usIpa = null;
    if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
      const data = await dictRes.value.json();
      const entry = data[0];
      const phonetics = entry?.phonetics || [];

      ukIpa = phonetics.find(p => p.audio?.includes('-uk'))?.text
           || phonetics.find(p => p.text)?.text
           || entry?.phonetic
           || null;

      usIpa = phonetics.find(p => p.audio?.includes('-us'))?.text
           || phonetics.find(p => !p.audio?.includes('-uk') && p.text)?.text
           || entry?.phonetic
           || null;
    }

    // --- Translation ---
    let translation = null;
    if (transRes.status === 'fulfilled' && transRes.value.ok) {
      const data = await transRes.value.json();
      if (data.responseStatus === 200) {
        translation = data.responseData.translatedText;
      }
    }

    res.json({ word, ukIpa, usIpa, translation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getDictionaryEntry };
