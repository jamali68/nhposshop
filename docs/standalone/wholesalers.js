/**
 * ====================================================================
 * ہول سیلر کھاتہ لاجک - wholesalers.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * ====================================================================
 */

window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('wholesalers');
  renderWholesalersList();
});

function handleWholesalerSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('wsNameInput').value.trim();
  const phone = document.getElementById('wsPhoneInput').value.trim() || '---';
  const amount = parseFloat(document.getElementById('wsAmountInput').value) || 0;

  if (!name || amount <= 0) {
    alert('براہ کرم ڈیلر کا نام اور درست رقم درج کریں!');
    return;
  }

  const data = getTajData();
  const existing = data.wholesalers.find(w => w.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.amount += amount;
    if (phone !== '---') existing.phone = phone;
  } else {
    data.wholesalers.push({
      id: 'ws_' + Date.now(),
      name: name,
      phone: phone,
      amount: amount
    });
  }

  saveTajData(data);
  renderWholesalersList();

  document.getElementById('wsNameInput').value = '';
  document.getElementById('wsPhoneInput').value = '';
  document.getElementById('wsAmountInput').value = '';

  alert(`ڈیلر "${name}" کا Rs ${amount} کا بل کھاتے میں درج ہو گیا!`);
}

function renderWholesalersList() {
  const data = getTajData();
  const tbody = document.getElementById('wholesalersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  let totalPayable = 0;

  data.wholesalers.forEach((ws, index) => {
    totalPayable += ws.amount;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${ws.name}</strong></td>
      <td><span style="direction: ltr; display: inline-block;">${ws.phone}</span></td>
      <td style="color: #b45309; font-weight: bold; font-size: 1.1rem;">Rs ${ws.amount.toLocaleString()}</td>
      <td>
        <button class="action-pay-btn" onclick="payWholesalerModal(${index})">ادائیگی کریں 💳</button>
      </td>
      <td>
        <button class="delete-btn" onclick="deleteWholesalerRecord(${index})">حذف 🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('statTotalPayable').textContent = 'Rs ' + totalPayable.toLocaleString();
  document.getElementById('statSupplierCount').textContent = data.wholesalers.length;
}

function payWholesalerModal(index) {
  const data = getTajData();
  const ws = data.wholesalers[index];
  const payStr = prompt(`${ws.name} کو ادا کردہ رقم درج کریں:`, ws.amount);
  if (!payStr) return;

  const payAmount = parseFloat(payStr) || 0;
  if (payAmount <= 0) return;

  ws.amount = Math.max(0, ws.amount - payAmount);

  // دکان کے کیش سے منہا کریں (Cash Out)
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  data.cashEntries.unshift({
    id: 'tx_' + Date.now(),
    type: 'out',
    amount: payAmount,
    desc: `ڈیلر بل ادائیگی: ${ws.name}`,
    time: timeStr,
    user: data.currentUser?.username || 'admin'
  });

  saveTajData(data);
  renderWholesalersList();
  alert(`Rs ${payAmount} ادائیگی درج ہو گئی اور کیش کاؤنٹر سے منہا کر دی گئی!`);
}

function deleteWholesalerRecord(index) {
  if (confirm('کیا آپ واقعی یہ سپلائر کھاتہ حذف کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.wholesalers.splice(index, 1);
    saveTajData(data);
    renderWholesalersList();
  }
}
