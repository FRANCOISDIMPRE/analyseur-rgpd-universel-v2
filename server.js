const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/audit", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL requise" });
    }

    const response = await axios.get(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);
    const texte = $("body").text().toLowerCase();

    const controles = {
      https: url.startsWith("https"),
      mentions: /mentions légales/i.test(texte),
      politique: /politique de confidentialité/i.test(texte),
      cgv: /conditions générales/i.test(texte),
      cookies: /cookies/i.test(texte),
      formulaire: $("form").length > 0
    };

    const total = Object.keys(controles).length;
    const ok = Object.values(controles).filter(v => v).length;
    const score = Math.round((ok / total) * 100);

    res.json({
      score,
      details: controles
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de l'analyse" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Serveur lancé sur le port", PORT);
});
