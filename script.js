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
  const distributionNameInput = document.getElementById('distribution-name');
  const saveDistributionButton = document.getElementById('save-distribution');
  const savedDistributionsContainer = document.getElementById('saved-distributions');
  const savedCounter = document.getElementById('saved-counter');
  const saveFeedback = document.getElementById('save-feedback');

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
  let savedDistributionId = 0;
  let activeDistributionId = null;
  const savedDistributions = [];

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

  saveDistributionButton?.addEventListener('click', handleSaveDistribution);
  distributionNameInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveDistribution();
    }
  });

  savedDistributionsContainer?.addEventListener('click', handleSavedListInteraction);
  savedDistributionsContainer?.addEventListener('keydown', handleSavedListKeydown);

  defaultAssets.forEach(addAsset);
  totalInput.value = currencyFormatter.format(5000);
  recalculate();
  renderSavedDistributions();
  setSaveFeedback('Salve diferentes perfis para alternar entre cenários rapidamente.', 'muted');

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

  function handleSaveDistribution() {
    if (!distributionNameInput) return;

    const scenarioName = distributionNameInput.value.trim();
    if (!scenarioName) {
      setSaveFeedback('Escolha um nome antes de salvar a distribuição.', 'danger');
      distributionNameInput.focus();
      return;
    }

    const rows = Array.from(assetsList.querySelectorAll('.asset-row'));
    if (!rows.length) {
      setSaveFeedback('Adicione pelo menos um ativo para salvar.', 'danger');
      return;
    }

    const totalAmount = parseCurrencyToNumber(totalInput.value);
    if (!totalAmount) {
      setSaveFeedback('Informe um valor de aporte válido para salvar.', 'danger');
      totalInput.focus();
      return;
    }

    const assetsPayload = serializeAssets(rows);
    const sumPercentages = assetsPayload.reduce((acc, asset) => acc + asset.percentage, 0);
    if (Math.abs(sumPercentages - 100) > percentageTolerance) {
      setSaveFeedback('A soma dos percentuais precisa ser 100% para salvar.', 'danger');
      return;
    }

    const normalizedName = scenarioName.toLowerCase();
    const existingIndex = savedDistributions.findIndex((item) => item.normalizedName === normalizedName);

    const distributionData = {
      id: existingIndex > -1 ? savedDistributions[existingIndex].id : savedDistributionId++,
      name: scenarioName,
      normalizedName,
      totalAmount,
      assets: assetsPayload,
    };

    if (existingIndex > -1) {
      savedDistributions[existingIndex] = distributionData;
    } else {
      savedDistributions.push(distributionData);
    }

    activeDistributionId = distributionData.id;
    renderSavedDistributions();
    setSaveFeedback(
      existingIndex > -1
        ? `Distribuição "${scenarioName}" atualizada.`
        : `Distribuição "${scenarioName}" salva com sucesso.`,
      'success'
    );
  }

  function handleSavedListInteraction(event) {
    const deleteButton = event.target.closest('[data-action="delete"]');
    if (deleteButton) {
      deleteDistribution(deleteButton.dataset.id);
      return;
    }

    const card = event.target.closest('.saved-card');
    if (!card) return;
    loadDistribution(card.dataset.id);
  }

  function handleSavedListKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('[data-action="delete"]')) {
      return;
    }
    const card = event.target.closest('.saved-card');
    if (!card) return;
    event.preventDefault();
    loadDistribution(card.dataset.id);
  }

  function renderSavedDistributions() {
    if (!savedDistributionsContainer) return;
    savedDistributionsContainer.innerHTML = '';

    if (!savedDistributions.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'saved-empty mb-0';
      emptyState.textContent = 'Nenhuma distribuição salva até agora.';
      savedDistributionsContainer.appendChild(emptyState);
    } else {
      const fragment = document.createDocumentFragment();
      savedDistributions.forEach((distribution) => {
        const card = createSavedCardElement(distribution);
        fragment.appendChild(card);
      });
      savedDistributionsContainer.appendChild(fragment);
    }

    updateSavedCounter();
  }

  function createSavedCardElement(distribution) {
    const card = document.createElement('div');
    card.className = 'saved-card';
    card.dataset.id = distribution.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const isActive = distribution.id === activeDistributionId;
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    if (isActive) {
      card.classList.add('is-active');
    }

    const infoWrapper = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'saved-card__title mb-1';
    title.textContent = distribution.name;
    const meta = document.createElement('p');
    meta.className = 'saved-card__meta mb-0';
    const assetLabel = distribution.assets.length === 1 ? 'ativo' : 'ativos';
    meta.textContent = `${distribution.assets.length} ${assetLabel} · ${currencyFormatter.format(
      distribution.totalAmount
    )}`;
    infoWrapper.append(title, meta);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'd-flex align-items-center gap-2 flex-shrink-0';
    const badge = document.createElement('span');
    badge.className = 'saved-card__badge';
    badge.textContent = 'Carregar';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'saved-card__delete';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = distribution.id;
    deleteButton.setAttribute('aria-label', `Remover ${distribution.name}`);
    deleteButton.textContent = 'Remover';
    actionsWrapper.append(badge, deleteButton);

    card.append(infoWrapper, actionsWrapper);
    return card;
  }

  function loadDistribution(distributionId) {
    const numericId = Number(distributionId);
    const distribution = savedDistributions.find((item) => item.id === numericId);
    if (!distribution) return;

    totalInput.value = currencyFormatter.format(distribution.totalAmount);
    assetsList.innerHTML = '';
    distribution.assets.forEach((asset) => addAsset(asset));
    if (distributionNameInput) {
      distributionNameInput.value = distribution.name;
    }
    activeDistributionId = distribution.id;
    renderSavedDistributions();
    setSaveFeedback(`Distribuição "${distribution.name}" carregada.`, 'success');
  }

  function deleteDistribution(distributionId) {
    const numericId = Number(distributionId);
    const index = savedDistributions.findIndex((item) => item.id === numericId);
    if (index === -1) return;
    const [removed] = savedDistributions.splice(index, 1);
    if (activeDistributionId === numericId) {
      activeDistributionId = null;
    }
    renderSavedDistributions();
    setSaveFeedback(`Distribuição "${removed.name}" removida.`, 'muted');
  }

  function serializeAssets(rows) {
    return rows.map((row, index) => {
      const nameInput = row.querySelector('.asset-name');
      const percentInput = row.querySelector('.asset-percent');
      const rawName = nameInput?.value?.trim();
      const percentageValue = Number(percentInput?.value);
      return {
        name: rawName || `Ativo ${index + 1}`,
        percentage: Number.isFinite(percentageValue) ? percentageValue : 0,
      };
    });
  }

  function setSaveFeedback(message = '', tone = 'muted') {
    if (!saveFeedback) return;
    const toneClass =
      tone === 'success'
        ? 'text-success'
        : tone === 'danger'
        ? 'text-danger'
        : tone === 'warning'
        ? 'text-warning'
        : 'text-muted';
    saveFeedback.textContent = message;
    saveFeedback.className = `form-text mt-2 ${toneClass}`;
  }

  function updateSavedCounter() {
    if (!savedCounter) return;
    const total = savedDistributions.length;
    savedCounter.textContent = total
      ? `${total} ${total === 1 ? 'lista salva' : 'listas salvas'}`
      : 'Nenhuma ainda';
  }
});

