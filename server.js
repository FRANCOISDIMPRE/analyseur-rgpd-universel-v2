const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");

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

    const points = {
      https: url.startsWith("https") ? "OK" : "NOK",
      mentions_legales: /mentions légales/i.test(text) ? "OK" : "NOK",
      politique_confidentialite: /politique.*confidentialité/i.test(text) ? "OK" : "NOK",
      cookies: /cookie/i.test(text) ? "OK" : "NOK",
      cgv: /conditions générales/i.test(text) ? "OK" : "NOK"
    };

    const score =
      Object.values(points).filter(v => v === "OK").length * 20;

    res.json({ score, points });

  } catch (error) {
    res.status(500).json({ error: "Impossible d'analyser le site." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Serveur lancé sur le port " + PORT)
);
