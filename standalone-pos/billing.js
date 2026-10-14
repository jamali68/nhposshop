/**
 * ====================================================================
 * کاؤنٹر سیل و رسید لاجک - billing.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * ====================================================================
 */

let currentBillItems = [];
let invoiceNumber = Math.floor(1000 + Math.random() * 9000);

window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('billing');
  updateReceiptDateTime();
});

function updateReceiptDateTime() {
  const now = new Date();
  const dtStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('receiptDateTime');
  if (el) el.textContent = dtStr;
  const invEl = document.getElementById('receiptInvoiceNo');
  if (invEl) invEl.textContent = '#' + invoiceNumber;
}

function updateReceiptCustomer() {
  const val = document.getElementById('billCustomerInput').value.trim() || 'کاؤنٹر کسٹمر';
  document.getElementById('receiptCustName').textContent = val;
}

function addItemToBill() {
  const itemName = document.getElementById('billItemInput').value.trim();
  const price = parseFloat(document.getElementById('billPriceInput').value) || 0;
  const qty = parseInt(document.getElementById('billQtyInput').value) || 1;

  if (!itemName || price <= 0) {
    alert('براہ کرم آئٹم کا نام اور قیمت درج کریں!');
    return;
  }

  const total = price * qty;
  currentBillItems.push({
    name: itemName,
    price: price,
    qty: qty,
    total: total
  });

  document.getElementById('billItemInput').value = '';
  document.getElementById('billPriceInput').value = '';
  document.getElementById('billQtyInput').value = '1';

  renderBill();
}

function renderBill() {
  const tbody = document.getElementById('billItemsBody');
  const receiptBox = document.getElementById('receiptItemsBox');
  const grandTotalEl = document.getElementById('receiptGrandTotal');

  if (tbody) tbody.innerHTML = '';
  if (receiptBox) receiptBox.innerHTML = '';

  let grandTotal = 0;

  if (currentBillItems.length === 0) {
    if (receiptBox) receiptBox.innerHTML = '<p style="text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 2rem 0;">کوئی آئٹم شامل نہیں کی گئی</p>';
    if (grandTotalEl) grandTotalEl.textContent = 'Rs 0';
    return;
  }

  currentBillItems.forEach((item, index) => {
    grandTotal += item.total;

    // ٹیبل قطار
    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td>Rs ${item.price}</td>
        <td>${item.qty}</td>
        <td><strong>Rs ${item.total}</strong></td>
        <td><button class="delete-btn" onclick="removeItem(${index})">✕</button></td>
      `;
      tbody.appendChild(tr);
    }

    // رسید قطار
    if (receiptBox) {
      const div = document.createElement('div');
      div.className = 'receipt-item-row';
      div.innerHTML = `
        <span>${item.name} (${item.qty} x ${item.price})</span>
        <strong>Rs ${item.total}</strong>
      `;
      receiptBox.appendChild(div);
    }
  });

  if (grandTotalEl) grandTotalEl.textContent = 'Rs ' + grandTotal.toLocaleString();
}

function removeItem(index) {
  currentBillItems.splice(index, 1);
  renderBill();
}

function completeCashSale() {
  if (currentBillItems.length === 0) {
    alert('پہلے بل میں آئٹمز شامل کریں!');
    return;
  }

  let grandTotal = currentBillItems.reduce((acc, curr) => acc + curr.total, 0);
  const customer = document.getElementById('billCustomerInput').value.trim() || 'کاؤنٹر کسٹمر';

  const data = getTajData();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // کیش کاؤنٹر میں نقد آمدنی شامل کریں
  data.cashEntries.unshift({
    id: 'tx_' + Date.now(),
    type: 'in',
    amount: grandTotal,
    desc: `کاؤنٹر بل (#${invoiceNumber}) - ${customer}`,
    time: timeStr,
    user: data.currentUser?.username || 'admin'
  });

  saveTajData(data);
  alert(`Rs ${grandTotal.toLocaleString()} کی نقد سیل مکمل ہو گئی اور کیش کاؤنٹر میں شامل کر دی گئی!`);

  // نیا بل انوائس تیار کریں
  invoiceNumber = Math.floor(1000 + Math.random() * 9000);
  updateReceiptDateTime();
  resetBill();
}

function resetBill() {
  currentBillItems = [];
  document.getElementById('billCustomerInput').value = '';
  document.getElementById('receiptCustName').textContent = 'کاؤنٹر کسٹمر';
  renderBill();
}
