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
    const text = $("body").text();

    const checks = {
      https: url.startsWith("https"),
      mentions: /mentions légales/i.test(text),
      politique: /politique de confidentialité/i.test(text),
      cgv: /conditions générales/i.test(text),
      cookies: /cookie/i.test(text),
      formulaire: $("form").length > 0
    };

    const score =
      Object.values(checks).filter(Boolean).length /
      Object.keys(checks).length *
      100;

    res.json({
      score: Math.round(score),
      checks
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de l'analyse" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});
