const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/audit', async (req, res) => {
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
        const text = $('body').text();

        const points = {
            "HTTPS": url.startsWith("https") ? "ok" : "nok",
            "Mentions légales": /mentions légales/i.test(text) ? "ok" : "nok",
            "Politique confidentialité": /politique|privacy/i.test(text) ? "ok" : "nok",
            "CGV": /conditions générales|CGV/i.test(text) ? "ok" : "nok",
            "Bannière cookies": /cookie/i.test(text) ? "ok" : "nok",
            "Formulaire présent": $('form').length > 0 ? "ok" : "nok"
        };

        const totalPoints = Object.keys(points).length;
        const okPoints = Object.values(points).filter(v => v === "ok").length;
        const score = Math.round((okPoints / totalPoints) * 100);

        res.json({ score, points });

    } catch (error) {
        res.status(500).json({ error: "Analyse impossible" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
