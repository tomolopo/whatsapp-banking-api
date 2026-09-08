const fs = require('fs');
const path = require('path');

const file = path.resolve('c:/Users/tomolopo/AgentOS_Demos/whatsapp-banking-api/postman/whatsapp-banking-api.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

function successEnvelope(requestId, data, meta = null) {
  return JSON.stringify({ success: true, requestId, data, meta }, null, 2);
}

function json(body) {
  return JSON.stringify(body, null, 2);
}

const examples = {
  WhatsApp: {
    initSession: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_init_001', {
        userExists: true,
        user: { id: 'usr_001', firstName: 'Taiwo', lastName: 'Omolopo', address: '15 Admiralty Way Lagos', email: null },
        hasAccount: true,
        accounts: [
          { accountNumber: '1345537268', balance: '9788700' },
          { accountNumber: '6897988792', balance: '99000' },
          { accountNumber: '8935655581', balance: '10000' },
          { accountNumber: '7562637469', balance: '996000' },
          { accountNumber: '4539256601', balance: '63000' }
        ],
        balance: '10956700',
        lastTransactions: [
          { id: '4808843a-64e0-4904-bcf7-76677d544a65', amount: '5000', type: 'transfer', status: 'completed', created_at: '2026-04-17T12:02:31.250Z' },
          { id: 'abdd6e2d-90f4-4aee-ae09-b0ba93a7a109', amount: '6800', type: 'data', status: 'completed', created_at: '2026-04-16T20:46:17.249Z' },
          { id: 'f0271f99-f685-4f20-9024-2c1b8ed84679', amount: '5000', type: 'transfer', status: 'completed', created_at: '2026-04-16T20:44:09.817Z' },
          { id: '6056bb98-9104-496d-9af7-1b57ea49026a', amount: '1000', type: 'airtime', status: 'completed', created_at: '2026-04-01T10:43:20.602Z' },
          { id: '2b6510f8-6443-4279-99b1-4eb48ea9fa9f', amount: '30000', type: 'transfer', status: 'completed', created_at: '2026-03-31T12:55:09.800Z' }
        ]
      })
    },
    checkUser: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_check_001', {
        exists: true,
        user: { id: 'usr_001', first_name: 'John', last_name: 'Doe', phone: '2348012345678' }
      })
    },
    register: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_reg_001', {
        phone: '2348012345678', firstName: 'John', lastName: 'Doe', accountNumber: '0123456789', accountType: 'savings', bankCode: '999', balance: 1000000
      })
    },
    createAccount: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_create_001', {
        accountId: 'acc_001', accountNumber: '0123456789', accountType: 'savings', bankCode: '999', bankName: 'Bank-IB', balance: 1000000
      })
    },
    balance: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_balance_001', { accountNumber: '0123456789', accountType: 'savings', balance: 1000000 })
    },
    resolveAccount: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_resolve_001', { accountNumber: '0987654321', accountName: 'Demo Receiver', bankCode: '044', bankName: 'Access Bank', type: 'external' })
    },
    confirmTransferDetails: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_confirm_001', { accountNumber: '0987654321', accountName: 'Demo Receiver', bankName: 'Access Bank', amount: 5000, confirmationMessage: 'Send ₦5000 to Demo Receiver (Access Bank)?' })
    },
    transfer: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_transfer_001', { success: true, transactionId: 'tx_001', amount: 5000, fromAccount: '0123456789', toAccount: '0987654321', receiptUrl: 'https://example.com/receipts/tx_001.pdf', receiptStatus: 'ok', fraudScore: 12 })
    },
    transactions: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_tx_001', [{ id: 'tx_001', amount: 5000, type: 'transfer', status: 'completed', reference: 'TX-1700000000000', created_at: '2026-09-07T12:00:00.000Z' }])
    },
    addBeneficiary: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_ben_add_001', { message: 'Beneficiary added successfully' })
    },
    favoriteBeneficiary: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_ben_fav_001', { message: 'Beneficiary marked as favorite' })
    },
    getBeneficiaries: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_ben_list_001', { beneficiaries: [{ name: 'Jane Doe', accountNumber: '0987654321', bankCode: '044', nickname: 'Jane', isFavorite: true, label: 'Jane (0987654321)' }] })
    },
    getAccounts: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_accounts_001', { accounts: [{ accountNumber: '0123456789', accountType: 'savings', balance: 1000000, createdAt: '2026-09-07T12:00:00.000Z' }] })
    },
    changePin: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_pin_001', { success: true, message: 'PIN updated successfully' })
    },
    statement: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_statement_001', { message: 'Statement generated successfully', url: 'https://example.com/statements/statement-0123456789.pdf', accountNumber: '0123456789', fromDate: '2026-09-01', toDate: '2026-09-07', totalTransactions: 5 })
    },
    receipt: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_receipt_001', { message: 'Receipt generated successfully', url: 'https://example.com/receipts/receipt-tx_001.pdf', transactionId: 'tx_001', amount: 5000, status: 'completed', createdAt: '2026-09-07T12:00:00.000Z' })
    },
    airtime: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_airtime_001', { success: true, type: 'airtime', amount: 500, phone: '2348012345678', network: 'MTN', transactionId: 'tx_airtime_001', message: 'Airtime 500 sent to 2348012345678 (MTN)' })
    },
    data: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_data_001', { success: true, type: 'data', phone: '2348012345678', network: 'MTN', plan: '2GB', duration: '30d', amount: 1000, transactionId: 'tx_data_001', message: '2GB 30d data sent to 2348012345678 (MTN)' })
    },
    resetPin: {
      name: 'Success', status: 'OK', code: 200,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: successEnvelope('req_reset_001', { message: 'PIN reset successfully' })
    }
  },
  Admin: {
    customers: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ customers: [{ id: 'usr_001', first_name: 'John', last_name: 'Doe', phone: '2348012345678', address: 'Lagos', created_at: '2026-09-07T12:00:00.000Z', account_number: '0123456789', balance: 1000000, transaction_count: '3' }] }) },
    accounts: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ accounts: [{ id: 'acc_001', account_number: '0123456789', balance: 1000000, first_name: 'John', last_name: 'Doe', phone: '2348012345678', created_at: '2026-09-07T12:00:00.000Z' }] }) },
    banks: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ banks: [{ code: '999', name: 'Bank-IB' }, { code: '044', name: 'Access Bank' }] }) },
    fraud: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ fraud: [{ id: 'fraud_001', account_id: 'acc_001', reason: 'High-risk transfer pattern', severity: 'high', created_at: '2026-09-07T12:00:00.000Z' }] }) },
    transactions: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ transactions: [{ id: 'tx_001', amount: 5000, status: 'completed', created_at: '2026-09-07T12:00:00.000Z' }] }) }
  },
  Webhook: {
    infobip: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ success: true }) },
    events: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ success: true }) },
    dispatch: { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ success: true }) }
  },
  'Link Generators': {
    'generate-link': { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: successEnvelope('req_link_001', { phone: '2348012345678', token: 'signed-token', registrationLink: 'https://whatsapp-banking-api.vercel.app/api/register-page?token=signed-token', expiresIn: '10 minutes' }) },
    'generate-transfer-link': { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: successEnvelope('req_xfer_link_001', { transferLink: 'https://whatsapp-banking-api.vercel.app/api/transfer-page?token=signed-transfer-token', expiresIn: '10 minutes' }) }
  },
  Pages: {
    'register-page': { name: 'HTML', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }], body: '<!doctype html>\n<html>\n  <body>Registration page</body>\n</html>' },
    'transfer-page': { name: 'HTML', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }], body: '<!doctype html>\n<html>\n  <body>Transfer confirmation page</body>\n</html>' }
  },
  Docs: {
    'swagger-json': { name: 'Success', status: 'OK', code: 200, header: [{ key: 'Content-Type', value: 'application/json' }], body: json({ openapi: '3.0.0', info: { title: 'WhatsApp Banking API', version: '1.0.0' }, paths: {} }) }
  }
};

function walk(items, parents = []) {
  for (const item of items) {
    const path = [...parents, item.name];
    const group = parents[0];
    const name = item.name;

    if (item.request) {
      if (group && examples[group] && examples[group][name]) {
        item.response = [examples[group][name]];
      }

      if (group === 'WhatsApp Router' && name === 'transactions') {
        item.description = 'Gets transaction history for an account number.';
        item.request.body = { mode: 'raw', raw: '{\n  "accountNumber": "{{accountNumber}}"\n}' };
      }
    }

    if (Array.isArray(item.item)) walk(item.item, path);
  }
}

walk(collection.item);

collection.variable = collection.variable || [];
const vars = collection.variable;
function setVar(key, value) {
  const existing = vars.find(v => v.key === key);
  if (existing) existing.value = value;
  else vars.push({ key, value });
}

setVar('webhookAuth', 'd2ViaG9vay11c2VyOndlYmhvb2stcGFzcw==');
setVar('adminToken', 'admin-jwt');

fs.writeFileSync(file, JSON.stringify(collection, null, 2) + '\n');
