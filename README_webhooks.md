# Documentação Técnica de Webhooks & Integração de Pagamentos — Agro Moz (M-Pesa / e-Mola)

Esta documentação detalha a arquitetura, configuração e segurança dos endpoints de webhook (**Cloud Functions & Express API**) para integração com as carteiras móveis **M-Pesa (Vodacom)** e **e-Mola (Movitel)** no sistema **Agro Moz**.

---

## 📌 Arquitetura dos Webhooks de Pagamento e Carteira

No Agro Moz, todas as transações financeiras operam sob os modelos:
- **C2B (Customer-to-Business)**: Depósitos e pagamentos de compras efetuados por compradores via STK Push.
- **B2C (Business-to-Customer)**: Levantamentos de saldo de carteira solicitados por agricultores e transportadores.

```
┌─────────────────┐        1. Inicia Pagamento (STK Push)        ┌───────────────────────┐
│                 │ ───────────────────────────────────────────> │                       │
│ App Comprador   │                                              │ M-Pesa / e-Mola API   │
│ (Agro Moz UI)   │ <─────────────────────────────────────────── │  (Operadora Móvel)    │
└─────────────────┘        2. Solicitado PIN na App/USSD         └───────────────────────┘
                                                                             │
                                                                             │ 3. Notificação Async
                                                                             │    (Callback Webhook)
                                                                             ▼
                                                                 ┌───────────────────────┐
                                                                 │ Webhooks Agro Moz     │
                                                                 │ • webhookMpesa        │
                                                                 │ • webhookEmola        │
                                                                 │ • webhookLevantamentoMpesa
                                                                 │ • webhookLevantamentoEmola
                                                                 └───────────────────────┘
                                                                             │
                                                                             │ 4. Validação x-webhook-secret
                                                                             │    & Transação Atómica
                                                                             ▼
                                                                 ┌───────────────────────┐
                                                                 │ Firestore Database    │
                                                                 │ /carteiras/{userId}   │
                                                                 │ /pagamentos_pendentes │
                                                                 │ /levantamentos        │
                                                                 └───────────────────────┘
```

---

## 🔒 Validação de Segurança (`x-webhook-secret`)

Por razões legais e de cibersegurança, **a aplicação Agro Moz NUNCA solicita ou processa o PIN do utilizador**. O PIN é inserido de forma totalmente isolada dentro do canal da operadora.

Para impedir que terceiros mal-intencionados simulem chamadas de confirmação ao webhook, **todas as requisições enviadas pelas operadoras DEVEM passar pela verificação do cabeçalho `x-webhook-secret`**.

### Lógica de Validação da Assinatura e Chave
Cada operadora ou agregador deve ser configurado para enviar a chave secreta no cabeçalho HTTP:

- **Cabeçalho esperada**: `x-webhook-secret` (ou `X-Webhook-Secret`)
- **Valor esperado**: Corresponde a `functions.config().mpesa.webhook_secret` / `functions.config().emola.webhook_secret` (ou variável de ambiente `MPESA_WEBHOOK_SECRET` / `EMOLA_WEBHOOK_SECRET`).

```typescript
function validarAssinaturaWebhook(
  req: functions.https.Request | Request,
  operadora: 'mpesa' | 'emola'
): boolean {
  const chaveEsperada =
    operadora === 'mpesa'
      ? functions.config().mpesa.webhook_secret || process.env.MPESA_WEBHOOK_SECRET
      : functions.config().emola.webhook_secret || process.env.EMOLA_WEBHOOK_SECRET;

  const chaveRecebida = req.headers['x-webhook-secret'] as string;
  return !!chaveRecebida && chaveRecebida === chaveEsperada;
}
```

---

## 🚀 Mapeamento Detalhado dos Endpoints de Webhook

### 1. `webhookMpesa` (M-Pesa C2B — Confirmação de Depósito / Pagamento)
- **Tipo**: Cloud Function HTTPS (`onRequest`) ou rota Express `/api/webhooks/mpesa-c2b`
- **Fluxo de Confirmação**:
  1. O comprador inicia o pagamento (`iniciarPagamento`).
  2. A M-Pesa envia um pedido STK Push ao telemóvel do comprador.
  3. Quando o comprador digita o PIN e autoriza, a M-Pesa invoca o `webhookMpesa`.
  4. O handler valida `x-webhook-secret`.
  5. Se `estado === 'sucesso'`: invoca `reterPagamentoEncomenda()` para mover o dinheiro para o `saldoRetido` (custódia da encomenda) e atualiza o estado do pagamento para `concluido`.
  6. Se `estado === 'falhado'` ou cancelado: atualiza a encomenda para `aguardando_pagamento` para permitir nova tentativa.

**Exemplo de Payload C2B**:
```json
{
  "referencia": "pag_doc_id_12345",
  "transacaoExternaId": "MPESA_TX_8899110022",
  "estado": "sucesso"
}
```

---

### 2. `webhookEmola` (e-Mola C2B — Confirmação de Depósito / Pagamento)
- **Tipo**: Cloud Function HTTPS (`onRequest`) ou rota Express `/api/webhooks/emola-c2b`
- **Fluxo de Confirmação**:
  1. Processamento análogo ao M-Pesa, adaptado para a rede e-Mola (Movitel).
  2. Valida o cabeçalho `x-webhook-secret` contra as credenciais e-Mola.
  3. Executa a transação atómica no Firestore retendo o valor em custódia até à confirmação de receção da encomenda.

---

### 3. `webhookLevantamentoMpesa` (M-Pesa B2C — Confirmação de Levantamento)
- **Tipo**: Cloud Function HTTPS (`onRequest`)
- **Fluxo de Confirmação**:
  1. O agricultor/transportador solicita levantamento (`solicitarLevantamento`).
  2. O backend debita o `saldoDisponivel` de forma atómica e chama a API B2C da M-Pesa.
  3. A M-Pesa transfere os fundos para o telemóvel do utilizador e responde ao `webhookLevantamentoMpesa`.
  4. O handler valida `x-webhook-secret`.
  5. **Se `sucesso`**: Marca o documento em `/levantamentos/{id}` como `estado: 'concluido'`.
  6. **Garantia de Integridade (Se `falhado`)**: Executa a função `reverterLevantamento()` devolvendo atomicamente o valor debitado ao `saldoDisponivel` na carteira Firestore do utilizador.

---

### 4. `webhookLevantamentoEmola` (e-Mola B2C — Confirmação de Levantamento)
- **Tipo**: Cloud Function HTTPS (`onRequest`)
- **Fluxo de Confirmação**:
  1. Trata a confirmação assíncrona das transferências B2C realizadas via e-Mola.
  2. Valida `x-webhook-secret` da e-Mola.
  3. Atualiza o registo de levantamento para `concluido` ou reverte atomicamente o saldo em caso de falha (ex: número inválido ou conta e-Mola inativa).

---

## ⚙️ Configuração de Variáveis de Ambiente & Firebase Config

### Variáveis via Firebase Functions Config
```bash
firebase functions:config:set mpesa.webhook_secret="SEGREDO_MPESA_AGRO_MOZ_2026"
firebase functions:config:set emola.webhook_secret="SEGREDO_EMOLA_AGRO_MOZ_2026"
```

### Variáveis em Ficheiro Local `.env`
```env
MPESA_WEBHOOK_SECRET=SEGREDO_MPESA_AGRO_MOZ_2026
EMOLA_WEBHOOK_SECRET=SEGREDO_EMOLA_AGRO_MOZ_2026
```

---

## 🧪 Exemplo de Teste de Validação com cURL

Para simular a validação do `x-webhook-secret` durante os testes:

```bash
# Simular webhook de confirmação de depósito M-Pesa
curl -X POST https://sua-regiao-seu-projeto.cloudfunctions.net/webhookMpesa \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEGREDO_MPESA_AGRO_MOZ_2026" \
  -d '{
    "referencia": "pag_test_001",
    "transacaoExternaId": "MPESA_SIMULATED_123",
    "estado": "sucesso"
  }'
```

---

## 📋 Tabela Resumo das Regras de Integridade de Transação

| Webhook | Evento | Estado Recebido | Ação na Carteira Firestore |
| :--- | :--- | :--- | :--- |
| `webhookMpesa` / `webhookEmola` | Pagamento C2B | `sucesso` | Move valor para `saldoRetido` (Custódia) |
| `webhookMpesa` / `webhookEmola` | Pagamento C2B | `falhado` | Reverte estado da encomenda para `aguardando_pagamento` |
| `webhookLevantamentoMpesa` / `webhookLevantamentoEmola` | Levantamento B2C | `sucesso` | Marca levantamento como `concluido` |
| `webhookLevantamentoMpesa` / `webhookLevantamentoEmola` | Levantamento B2C | `falhado` | Reverte o saldo debitado de volta para `saldoDisponivel` |

---
*Agro Moz — Documentação Interna de Engenharia & Pagamentos Móveis.*
