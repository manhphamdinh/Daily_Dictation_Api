import fetch from 'node-fetch';


// GET /translation?text=...&from=en&to=vi
export const translateText = async (req, res) => {
  const { text, from = 'en', to } = req.query;

  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus !== 200) {
      return res.status(500).json({ error: 'Translation failed' });
    }

    res.json({ translation: data.responseData.translatedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

