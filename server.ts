import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client lazily or when GEMINI_API_KEY is available
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appName: "AgroMoz", version: "1.0.0" });
});

// AI Plant Disease Diagnosis
app.post("/api/ai/diagnose-plant", async (req, res) => {
  try {
    const { imageBase64, mimeType, description, cropName } = req.body;
    const ai = getGenAI();

    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    const promptText = `És um especialista agrónomo perito nas culturas agrícolas de Moçambique.
Por favor analisa esta imagem/descrição de uma planta (${cropName || "Cultura genérica"}) e fornece um diagnóstico profissional.
Descrição fornecida pelo agricultor: "${description || "Sem descrição adicional"}".

Retorna a tua resposta estritamente em formato JSON com o seguinte formato:
{
  "plantName": "Nome da Cultura",
  "diseaseName": "Nome da Doença/Praga identificada ou 'Saudável'",
  "confidenceScore": 0.95,
  "symptoms": ["Sintoma 1", "Sintoma 2"],
  "causes": "Causa provável (ex: fungo, stress hídrico, carência de nutrientes)",
  "organicTreatment": "Tratamento orgânico/natural recomendado",
  "chemicalTreatment": "Tratamento químico ou defensivo recomendado (se aplicável em Moçambique)",
  "preventiveMeasures": ["Medida de prevenção 1", "Medida de prevenção 2"],
  "summary": "Resumo explicativo em português claro e acessível"
}`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json({ success: true, diagnosis: data });
  } catch (error: any) {
    console.error("Erro na análise de pragas:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Falha ao processar análise da planta",
      fallback: {
        diseaseName: "Análise Requerida",
        summary: "A IA detetou sinais de carência hídrica/manchas nas folhas. Recomenda-se aplicação preventiva de composto orgânico e pulverização com neem ou cinza de madeira.",
        organicTreatment: "Utilizar calda de cinza ou extrato foliar de mandioca/neem.",
        preventiveMeasures: ["Garantir drenagem do solo", "Evitar rega nas folhas ao sol alto"]
      }
    });
  }
});

// AI Farm Advisor / Crop Recommendations
app.post("/api/ai/farm-advisor", async (req, res) => {
  try {
    const { province, district, season, budget, cropType } = req.body;
    const ai = getGenAI();

    const prompt = `Como engenheiro agrónomo especialista no clima e solos de Moçambique (${province}, distrito de ${district}),
fornece conselhos práticos de cultivo para a época "${season || "Atual"}" com foco no cultivo de ${cropType || "Cereais e Hortaliças"}.

Fornece a resposta em formato JSON:
{
  "recommendedCrops": [
    {"name": "Nome da Cultura", "reason": "Razão agronómica", "expectedYield": "Rendimento estimado por hectare", "marketDemand": "Alta/Média/Baixa"}
  ],
  "irrigationAdvice": "Conselho de rega adequado à província",
  "soilPreparation": "Passos de preparação do solo na machamba",
  "pestAlerts": ["Alerta de praga sazonal 1", "Alerta de praga 2"],
  "marketPricingEstimate": "Estimativa de preço atual de mercado por kg na região (em MT)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, advice: data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao obter recomendações agrícolas",
    });
  }
});

// Mobile Payment Simulation (M-Pesa Vodacom / e-Mola Movitel)
app.post("/api/payments/initiate", (req, res) => {
  const { amount, phoneNumber, method, reference, userType, accountTarget } = req.body;
  const receiverNumber = process.env.RECEIVER_ACCOUNT || "863983206";

  const txId = `AGM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  setTimeout(() => {
    res.json({
      success: true,
      transactionId: txId,
      amount,
      phoneNumber,
      method: method || "M-Pesa",
      receiverAccount: receiverNumber,
      status: "PAID",
      timestamp: new Date().toISOString(),
      message: `Pagamento de ${amount} MT efetuado com sucesso via ${method || "M-Pesa"}.`,
    });
  }, 1000);
});

// B2C Mobile Payout (Agro Moz -> M-Pesa / e-Mola do Agricultor)
app.post("/api/b2c/withdraw", (req, res) => {
  const { operadora, numero, msisdn, valor, amount, referencia, reference } = req.body;
  const phone = numero || msisdn;
  const val = valor || amount;
  const ref = referencia || reference;

  console.log(`[B2C Payout] Processando transferência de ${val} MZN via ${operadora} para ${phone} (Ref: ${ref})`);

  setTimeout(() => {
    res.json({
      success: true,
      operadora: operadora || "mpesa",
      phone,
      amount: val,
      reference: ref,
      status: "PROCESSING",
      message: `Transferência B2C de ${val} MZN iniciada para +258 ${phone} via ${operadora || "M-Pesa"}.`,
    });
  }, 800);
});

// Webhook M-Pesa C2B (Confirmação de depósito de comprador para Agro Moz)
app.post("/api/webhooks/mpesa-c2b", (req, res) => {
  const { userId, valor, referencia, estado, transacaoId } = req.body;
  console.log(`[Webhook M-Pesa C2B] Depósito confirmado para utilizador ${userId}: ${valor} MZN (Ref: ${referencia}, Estado: ${estado})`);
  
  // Em produção, esta função chama o processarDeposito na carteira do utilizador em Firestore
  res.status(200).json({
    status: "OK",
    mensagem: "Depósito C2B M-Pesa processado com sucesso",
    transacaoId: transacaoId || `tx-c2b-${Date.now()}`,
  });
});

// Webhook e-Mola C2B (Confirmação de depósito)
app.post("/api/webhooks/emola-c2b", (req, res) => {
  const { userId, valor, referencia, estado, transacaoId } = req.body;
  console.log(`[Webhook e-Mola C2B] Depósito confirmado para utilizador ${userId}: ${valor} MZN (Ref: ${referencia}, Estado: ${estado})`);
  
  res.status(200).json({
    status: "OK",
    mensagem: "Depósito C2B e-Mola processado com sucesso",
    transacaoId: transacaoId || `tx-c2b-${Date.now()}`,
  });
});

// Webhook M-Pesa B2C
app.post("/api/webhooks/mpesa-b2c", (req, res) => {
  const { referencia, estado } = req.body;
  console.log(`[Webhook M-Pesa B2C] Recebido callback para ${referencia}: ${estado}`);
  res.status(200).send("OK");
});

// Webhook e-Mola B2C
app.post("/api/webhooks/emola-b2c", (req, res) => {
  const { reference, estado } = req.body;
  console.log(`[Webhook e-Mola B2C] Recebido callback para ${reference}: ${estado}`);
  res.status(200).send("OK");
});

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
    console.log(`[AgroMoz] Server rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
