# Webhook da Ticto para o Clube das Brabas

Este script processa webhooks enviados pela Ticto para o endpoint `https://n8n-n8n.p6yhvh.easypanel.host/webhook/ticto`, gerenciando o cadastro automático de usuários e a inativação de contas com base no status da compra.

## Funcionalidades

1. **Cadastro automático de usuários**:
   - Processa compras dos produtos com IDs: 82022, 81667, 81668
   - Cria novos usuários no Supabase quando o status indica aprovação
   - Envia email com dados de acesso para novos usuários
   - Reativa usuários existentes que estavam inativos

2. **Inativação de usuários**:
   - Inativa usuários quando o status indica cancelamento ou reembolso

3. **Status processados**:
   - **Aprovação**: `authorized`, `all_charges_paid`, `uncanceled`
   - **Cancelamento**: `subscription_canceled`, `refunded`, `chargeback`

## Configuração

1. Crie um arquivo `.env` baseado no `.env.example` com as seguintes variáveis:
   ```
   # Configurações do Supabase
   SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   SUPABASE_SERVICE_KEY=sua-chave-de-servico-do-supabase

   # Configurações de Email
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=seu-email@example.com
   EMAIL_PASS=sua-senha-de-email

   # Configurações do Servidor
   PORT=3000
   ```

2. Instale as dependências:
   ```
   npm install express body-parser @supabase/supabase-js nodemailer dotenv
   ```

3. Inicie o servidor:
   ```
   node ticto-webhook.js
   ```

## Integração com n8n

Para usar este webhook com o n8n:

1. Crie um novo fluxo no n8n
2. Adicione um nó "Webhook" configurado para receber POST em `/webhook/ticto`
3. Conecte o nó webhook a um nó "Execute Command" que execute este script
4. Alternativamente, você pode implementar a lógica diretamente no n8n usando nós HTTP Request para interagir com o Supabase

## Formato do Webhook da Ticto

O webhook da Ticto envia dados no seguinte formato:

```json
{
  "status": "authorized",
  "buyer": {
    "name": "Nome do Comprador",
    "email": "email@exemplo.com",
    "phone": "(11) 99999-9999"
  },
  "items": [
    {
      "product_id": "82022",
      "name": "Nome do Produto",
      "price": 99.90
    }
  ]
}
```

## Possíveis valores para o campo "status"

- `abandoned_cart`: Abandono de Carrinho
- `authorized`: Venda Realizada
- `bank_slip_delayed`: Boleto Atrasado
- `bank_slip_created`: Boleto Impresso
- `chargeback`: Chargeback
- `close`: Encerrado
- `claimed`: Reclamado
- `pix_created`: Pix Gerado
- `pix_expired`: Pix Expirado
- `refunded`: Reembolso
- `refused`: Venda Recusada
- `trial`: Tempo de Teste
- `waiting_payment`: Aguardando Pagamento
- `all_charges_paid`: [Assinatura] - Encerrada (Todas as Cobranças Finalizadas)
- `card_exchanged`: [Assinatura] - Cartão atualizado
- `extended`: [Assinatura] - Extendida
- `subscription_canceled`: [Assinatura] - Cancelada
- `subscription_delayed`: [Assinatura] - Atrasada
- `trial_started`: [Assinatura] - Período de Testes Iniciado
- `trial_ended`: [Assinatura] - Período de Testes Encerrado
- `uncanceled`: [Assinatura] - Retomada
