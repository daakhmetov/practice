const searchInput = document.querySelector('#searchInput');
const statusFilter = document.querySelector('#statusFilter');
const tableBody = document.querySelector('#machinesTableBody');
const notice = document.querySelector('#notice');

const statElements = {
  totalMachines: document.querySelector('#totalMachines'),
  onlineMachines: document.querySelector('#onlineMachines'),
  errorMachines: document.querySelector('#errorMachines'),
  totalRevenue: document.querySelector('#totalRevenue')
};

let refreshRequestId = 0;

const formatMoney = (value) => new Intl.NumberFormat('ru-KZ', {
  style: 'currency',
  currency: 'KZT',
  maximumFractionDigits: 0
}).format(value ?? 0);

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[char]));

const setNotice = (message = '', isError = false) => {
  notice.textContent = message;
  notice.classList.toggle('error', isError);
};

const requestJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Запрос не выполнен');
  }

  return data;
};

const buildMachinesUrl = () => {
  const params = new URLSearchParams();
  const search = searchInput.value.trim();
  const status = statusFilter.value;

  if (search) {
    params.set('search', search);
  }

  if (status) {
    params.set('status', status);
  }

  const query = params.toString();
  return query ? `/api/machines?${query}` : '/api/machines';
};

const renderStats = (stats) => {
  statElements.totalMachines.textContent = stats.totalMachines ?? 0;
  statElements.onlineMachines.textContent = stats.onlineMachines ?? 0;
  statElements.errorMachines.textContent = stats.errorMachines ?? 0;
  statElements.totalRevenue.textContent = formatMoney(stats.totalRevenue);
};

const renderMachines = (machines) => {
  if (!machines.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Автоматы не найдены</td></tr>';
    return;
  }

  tableBody.innerHTML = machines.map((machine) => {
    const rowClasses = [
      machine.status === 'Error' ? 'status-error' : '',
      machine.drinksCount < 20 ? 'low-stock' : ''
    ].filter(Boolean).join(' ');

    return `
      <tr class="${rowClasses}">
        <td><strong>${escapeHTML(machine.machineId)}</strong></td>
        <td>${escapeHTML(machine.address)}</td>
        <td><span class="badge ${machine.status}">${escapeHTML(machine.status)}</span></td>
        <td>${machine.drinksCount} / ${machine.maxCapacity}</td>
        <td>${formatMoney(machine.revenue)}</td>
        <td>
          <div class="actions">
            <button type="button" data-action="restock" data-id="${machine._id}">Пополнить</button>
            <button type="button" class="secondary" data-action="collect-cash" data-id="${machine._id}">Инкассация</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

const refreshDashboard = async () => {
  const requestId = ++refreshRequestId;

  try {
    setNotice('Обновление данных...');
    const [stats, machines] = await Promise.all([
      requestJSON('/api/dashboard/stats'),
      requestJSON(buildMachinesUrl())
    ]);

    if (requestId !== refreshRequestId) {
      return;
    }

    renderStats(stats);
    renderMachines(machines);
    setNotice('');
  } catch (error) {
    if (requestId !== refreshRequestId) {
      return;
    }

    setNotice(error.message, true);
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Не удалось загрузить данные</td></tr>';
  }
};

const handleMachineAction = async (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  try {
    button.disabled = true;
    await requestJSON(`/api/machines/${id}/${action}`, { method: 'POST' });
    await refreshDashboard();
  } catch (error) {
    setNotice(error.message, true);
  } finally {
    button.disabled = false;
  }
};

searchInput.addEventListener('input', refreshDashboard);
statusFilter.addEventListener('change', refreshDashboard);
tableBody.addEventListener('click', handleMachineAction);

refreshDashboard();
