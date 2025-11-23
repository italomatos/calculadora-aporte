document.addEventListener('DOMContentLoaded', () => {
  const totalInput = document.getElementById('total-amount');
  const assetsList = document.getElementById('assets-list');
  const addAssetButton = document.getElementById('add-asset');
  const assetTemplate = document.getElementById('asset-template');
  const percentageAlert = document.getElementById('percentage-alert');
  const resultsTable = document.getElementById('results-table');
  const resultsBody = resultsTable.querySelector('tbody');
  const resultsTotal = document.getElementById('results-total');
  const resultsPercentTotal = document.getElementById('results-percent-total');
  const resultHint = document.getElementById('result-hint');

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const percentageFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const defaultAssets = [
    { name: 'Bitcoin (BTC)', percentage: 80 },
    { name: 'Tether (USDT)', percentage: 10 },
    { name: 'Solana (SOL)', percentage: 5 },
    { name: 'Ethereum (ETH)', percentage: 5 },
  ];

  const percentageTolerance = 0.01;
  let assetCounter = 0;

  addAssetButton.addEventListener('click', () => addAsset());

  totalInput.addEventListener('input', () => {
    recalculate();
  });

  totalInput.addEventListener('blur', () => {
    const numericValue = parseCurrencyToNumber(totalInput.value);
    totalInput.value = numericValue ? currencyFormatter.format(numericValue) : '';
  });

  totalInput.addEventListener('focus', () => {
    totalInput.select();
  });

  defaultAssets.forEach(addAsset);
  totalInput.value = currencyFormatter.format(5000);
  recalculate();

  function addAsset(initialData = {}) {
    const row = assetTemplate.content.firstElementChild.cloneNode(true);
    const nameInput = row.querySelector('.asset-name');
    const percentInput = row.querySelector('.asset-percent');
    const removeButton = row.querySelector('.remove-asset');
    const nameLabel = row.querySelector('[data-label="name"]');
    const percentLabel = row.querySelector('[data-label="percent"]');

    const assetId = assetCounter++;
    const nameId = `asset-name-${assetId}`;
    const percentId = `asset-percent-${assetId}`;

    nameInput.id = nameId;
    percentInput.id = percentId;
    nameLabel?.setAttribute('for', nameId);
    percentLabel?.setAttribute('for', percentId);

    nameInput.value = initialData.name || '';
    if (typeof initialData.percentage === 'number') {
      percentInput.value = initialData.percentage;
    }

    nameInput.addEventListener('input', recalculate);
    percentInput.addEventListener('input', () => handlePercentInput(percentInput));
    percentInput.addEventListener('blur', () => formatPercentInput(percentInput));

    removeButton.addEventListener('click', () => {
      row.remove();
      recalculate();
    });

    assetsList.appendChild(row);
    recalculate();
  }

  function handlePercentInput(input) {
    if (input.value === '') {
      recalculate();
      return;
    }

    let numericValue = Number(input.value);
    if (!Number.isFinite(numericValue)) {
      input.value = '';
    } else {
      numericValue = Math.max(0, Math.min(100, numericValue));
      input.value = numericValue;
    }
    recalculate();
  }

  function formatPercentInput(input) {
    if (input.value === '') return;
    const numericValue = Number(input.value);
    if (!Number.isFinite(numericValue)) {
      input.value = '';
      return;
    }
    input.value = numericValue.toFixed(2);
  }

  function parseCurrencyToNumber(value) {
    if (typeof value !== 'string') return 0;
    const normalized = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  }

  function updatePercentageAlert(sum) {
    const formattedSum = percentageFormatter.format(sum);
    const isBalanced = Math.abs(sum - 100) <= percentageTolerance;
    let helperMessage = '';

    if (!sum) {
      helperMessage = ' · Adicione percentuais para começar';
    } else if (isBalanced) {
      helperMessage = ' · Distribuição pronta';
    } else if (sum > 100) {
      helperMessage = ' · Reduza os percentuais para chegar em 100%';
    } else {
      helperMessage = ' · Complete os percentuais até 100%';
    }

    percentageAlert.textContent = `Soma dos percentuais: ${formattedSum}%${helperMessage}`;
    percentageAlert.classList.remove('alert-success', 'alert-warning', 'alert-danger', 'alert-info', 'subtle-alert');

    if (!sum) {
      percentageAlert.classList.add('alert-info', 'subtle-alert');
      return;
    }

    if (isBalanced) {
      percentageAlert.classList.add('alert-success');
    } else if (sum > 100) {
      percentageAlert.classList.add('alert-danger');
    } else {
      percentageAlert.classList.add('alert-warning');
    }
  }

  function recalculate() {
    const totalAmount = parseCurrencyToNumber(totalInput.value);
    const rows = Array.from(assetsList.querySelectorAll('.asset-row'));
    const percentages = rows.map((row) => {
      const value = Number(row.querySelector('.asset-percent').value);
      return Number.isFinite(value) ? value : 0;
    });

    const sumPercentages = percentages.reduce((acc, current) => acc + current, 0);
    updatePercentageAlert(sumPercentages);

    if (!rows.length) {
      resultHint.textContent = 'Adicione pelo menos um ativo para iniciar os cálculos.';
      toggleResults(false);
      return;
    }

    if (!totalAmount) {
      resultHint.textContent = 'Informe o valor total do aporte para ver a distribuição.';
      toggleResults(false);
      return;
    }

    if (Math.abs(sumPercentages - 100) > percentageTolerance) {
      resultHint.textContent = 'Ajuste os percentuais até que a soma seja exatamente 100%.';
      toggleResults(false);
      return;
    }

    populateResults(rows, totalAmount);
    resultHint.textContent = 'Distribuição pronta! Revise antes de confirmar o aporte.';
    toggleResults(true);
  }

  function populateResults(rows, totalAmount) {
    resultsBody.innerHTML = '';
    let allocatedValue = 0;

    rows.forEach((row, index) => {
      const nameInput = row.querySelector('.asset-name');
      const percentInput = row.querySelector('.asset-percent');

      const label = nameInput.value.trim() || `Ativo ${index + 1}`;
      const percent = Number(percentInput.value) || 0;
      let value = totalAmount * (percent / 100);

      if (index === rows.length - 1) {
        value = totalAmount - allocatedValue;
      } else {
        value = Math.round(value * 100) / 100;
        allocatedValue += value;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${label}</td>
        <td class="text-end">${percentageFormatter.format(percent)}%</td>
        <td class="text-end">${currencyFormatter.format(value)}</td>
      `;
      resultsBody.appendChild(tr);
    });

    resultsTotal.textContent = currencyFormatter.format(totalAmount);
    resultsPercentTotal.textContent = `${percentageFormatter.format(100)}%`;
  }

  function toggleResults(shouldShow) {
    resultsTable.classList.toggle('d-none', !shouldShow);
  }
});

