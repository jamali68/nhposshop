/**
 * ====================================================================
 * بوتلیں و کریٹ لاجک - bottles.js
 * خالص معیاری جاوا اسکرپٹ (No Frameworks)
 * ====================================================================
 */

window.addEventListener('DOMContentLoaded', () => {
  renderCommonHeaderAndNav('bottles');
  renderBottlesList();
});

function handleBottleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('bNameInput').value.trim();
  const full = parseInt(document.getElementById('bFullInput').value) || 0;
  const empty = parseInt(document.getElementById('bEmptyInput').value) || 0;
  const crates = parseInt(document.getElementById('bCratesInput').value) || 0;

  if (!name) return;

  const data = getTajData();
  const existing = data.bottles.find(b => b.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.full = full;
    existing.empty = empty;
    existing.crates = crates;
  } else {
    data.bottles.push({
      id: 'btl_' + Date.now(),
      name: name,
      full: full,
      empty: empty,
      crates: crates
    });
  }

  saveTajData(data);
  renderBottlesList();

  document.getElementById('bNameInput').value = '';
  document.getElementById('bFullInput').value = '24';
  document.getElementById('bEmptyInput').value = '0';
  document.getElementById('bCratesInput').value = '1';

  alert(`بوتل آئٹم "${name}" کا اسٹاک کامیابی سے محفوظ ہو گیا!`);
}

function renderBottlesList() {
  const data = getTajData();
  const tbody = document.getElementById('bottlesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  let totalFull = 0;
  let totalEmpty = 0;
  let totalCrates = 0;

  data.bottles.forEach((b, index) => {
    totalFull += b.full;
    totalEmpty += b.empty;
    totalCrates += b.crates;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.name}</strong></td>
      <td style="color: #059669; font-weight: bold; font-size: 1.1rem;">${b.full}</td>
      <td style="color: #d97706; font-weight: bold; font-size: 1.1rem;">${b.empty}</td>
      <td style="font-weight: bold;">${b.crates}</td>
      <td>
        <button class="action-pay-btn" onclick="sellOneBottle(${index})">1 سیل ہوئی 🥤</button>
        <button class="action-pay-btn" style="background:#fef3c7; color:#92400e; border-color:#fde68a;" onclick="returnOneBottle(${index})">1 خالی واپس 🍾</button>
      </td>
      <td>
        <button class="delete-btn" onclick="deleteBottleRecord(${index})">حذف 🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('statTotalFull').textContent = totalFull;
  document.getElementById('statTotalEmpty').textContent = totalEmpty;
  document.getElementById('statTotalCrates').textContent = totalCrates;
}

function sellOneBottle(index) {
  const data = getTajData();
  if (data.bottles[index].full > 0) {
    data.bottles[index].full -= 1;
    data.bottles[index].empty += 1;
    saveTajData(data);
    renderBottlesList();
  } else {
    alert('بھری بوتلیں ختم ہیں!');
  }
}

function returnOneBottle(index) {
  const data = getTajData();
  if (data.bottles[index].empty > 0) {
    data.bottles[index].empty -= 1;
    saveTajData(data);
    renderBottlesList();
  }
}

function deleteBottleRecord(index) {
  if (confirm('کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟')) {
    const data = getTajData();
    data.bottles.splice(index, 1);
    saveTajData(data);
    renderBottlesList();
  }
}
