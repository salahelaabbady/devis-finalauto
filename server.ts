import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─────────────────────────────────────────────
// Mapping Excel "type" column → exact form label
// (matches INSURANCE_TYPES in QualificationForm.tsx)
// ─────────────────────────────────────────────
const TYPE_MAP: Record<string, string> = {
  "sante":      "Santé & Prévoyance",
  "santé":      "Santé & Prévoyance",
  "sante & prevoyance": "Santé & Prévoyance",
  "santé & prévoyance": "Santé & Prévoyance",
  "habitation": "Habitation",
  "obseques":   "Garantie obsèques",
  "obsèques":   "Garantie obsèques",
  "garantie obseques":  "Garantie obsèques",
  "garantie obsèques":  "Garantie obsèques",
  "auto":       "Auto risques aggravés",
  "auto risques":       "Auto risques aggravés",
  "auto risques aggraves": "Auto risques aggravés",
  "auto risques aggravés": "Auto risques aggravés",
  "pros":       "Professionnels",
  "professionnels": "Professionnels",
  "animaux":    "Assurance Animaux",
  "assurance animaux": "Assurance Animaux",
  "autre":      "Autre besoin",
  "autre besoin": "Autre besoin",
};

// ─────────────────────────────────────────────
// Resolve the type label from Excel value
// ─────────────────────────────────────────────
function resolveType(raw: string | undefined): string {
  if (!raw) return "Santé & Prévoyance"; // default fallback
  const key = raw.toString().toLowerCase().trim();
  return TYPE_MAP[key] || raw; // if already a full label, pass through
}

// ─────────────────────────────────────────────
// Build type-specific fields from Excel row
// Mirrors the steps in QualificationForm.tsx getSteps()
// ─────────────────────────────────────────────
function getTypeFields(typeLabel: string, user: any): Record<string, string> {
  switch (typeLabel) {
    case "Santé & Prévoyance":
    case "Garantie obsèques":
      return {
        dateNaissance: user.dateNaissance || user.date_naissance || user.dob || "",
        codePostal:    user.codePostal    || user.code_postal    || user.cp  || "",
      };

    case "Habitation":
      return {
        statutOccupant: user.statutOccupant || user.statut_occupant || "Locataire",
        typeLogement:   user.typeLogement   || user.type_logement   || "Appartement",
        usageLogement:  user.usageLogement  || user.usage_logement  || "Résidence principale",
        codePostal:     user.codePostal     || user.code_postal     || user.cp || "",
      };

    case "Auto risques aggravés":
      return {
        crm:            user.crm            || user.CRM            || "1.00",
        immatriculation:user.immatriculation|| user.Immatriculation|| "",
        codePostal:     user.codePostal     || user.code_postal    || user.cp || "",
      };

    case "Assurance Animaux":
      return {
        typeAnimal:          user.typeAnimal          || user.type_animal         || "Chien",
        dateNaissanceAnimal: user.dateNaissanceAnimal || user.date_naissance_animal|| "",
      };

    case "Professionnels":
    case "Assurance Animaux":
    case "Autre besoin":
    default:
      return {}; // no specific fields for these
  }
}

// ─────────────────────────────────────────────
// Encode payload as application/x-www-form-urlencoded
// ─────────────────────────────────────────────
function encode(data: Record<string, string>) {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

// ─────────────────────────────────────────────
// Random data fallback (random mode)
// ─────────────────────────────────────────────
function getRandomData() {
  const names    = ["Jean", "Paul", "Ali", "Lucas", "Marc", "Sophie", "Emma", "Thomas"];
  const surnames = ["Dupont", "Martin", "Benali", "Leclerc", "Moreau", "Petit", "Simon"];
  const prenom   = names[Math.floor(Math.random() * names.length)];
  const nom      = surnames[Math.floor(Math.random() * surnames.length)];
  return {
    prenom,
    nom,
    email: `${prenom.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`,
    tel:   "06" + Math.floor(10000000 + Math.random() * 89999999),
    type:  "sante",
  };
}

// ─────────────────────────────────────────────
// POST /api/send-devis
// ─────────────────────────────────────────────
app.post("/api/send-devis", async (req, res) => {
  const { domain, proxy, userData } = req.body;

  if (!domain) {
    return res.status(400).json({ success: false, error: "Domain is required" });
  }

  const user = userData || getRandomData();

  // 1. Resolve type label from Excel value
  const rawType     = user.type || user.Type || user["type-assurance"] || "";
  const typeLabel   = resolveType(rawType);

  // 2. Get type-specific fields
  const typeFields  = getTypeFields(typeLabel, user);

  // 3. Build full Netlify payload
  const nom    = user.nom    || user.Nom    || user.surname || "Inconnu";
  const prenom = user.prenom || user.Prenom || user.name    || "Inconnu";

  const data: Record<string, string> = {
    "form-name":      "contact",
    "replyto":        "contact@lamaisondesassures.fr",
    "type-assurance": typeLabel,
    ...typeFields,                          // inject type-specific fields
    "nom":            nom,
    "prenom":         prenom,
    "email":          user.email     || user.Email || "test@test.com",
    "telephone":      user.tel       || user.Tel   || user.phone || "0600000000",
    "message":        user.message   || user.Message || "Demande automatique",
    "consent":        "on",
    "subject":        `Nouveau devis (${typeLabel}) - ${nom} ${prenom}`,
  };

  try {
    const axiosConfig: any = {
      responseType: "text",
      validateStatus: (status: number) => status >= 200 && status < 500,
      maxRedirects: 5,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    };

    if (proxy) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
    }

    const response = await axios.post(domain, encode(data), axiosConfig);

    console.log(`✅ [${typeLabel}] Sent: ${user.email}`);
    res.json({
      success: true,
      email:   user.email,
      type:    typeLabel,
      fields:  Object.keys(typeFields),
      user,
      status:  response.status,
    });

  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    res.status(500).json({
      success: false,
      error:   err.message,
      user,
    });
  }
});

// ─────────────────────────────────────────────
// Vite / static serving
// ─────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
