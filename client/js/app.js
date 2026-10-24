/**
 * Campus Lost & Found - Client Entry Point (SQLite Edition)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Campus Lost & Found] Frontend initialized.');

  // DOM Elements - Status
  const serverStatusBadge = document.getElementById('server-status-badge');
  const serverStatusText = document.getElementById('server-status-text');
  const serverLatencyText = document.getElementById('server-latency-text');
  
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusText = document.getElementById('db-status-text');
  const dbStatusMeta = document.getElementById('db-status-meta');
  
  const rawResponseEl = document.getElementById('raw-response');
  const pingBtn = document.getElementById('ping-btn');

  // DOM Elements - Form & Table
  const itemForm = document.getElementById('item-form');
  const submitItemBtn = document.getElementById('submit-item-btn');
  const formFeedback = document.getElementById('form-feedback');
  const itemsTableBody = document.getElementById('items-table-body');
  const itemsCountDisplay = document.getElementById('items-count-display');
  const refreshItemsBtn = document.getElementById('refresh-items-btn');
  const filterSearch = document.getElementById('filter-search');
  const filterStatus = document.getElementById('filter-status');
  const filterCategory = document.getElementById('filter-category');

  // API Base URL resolver:
  // If served via Express, relative URLs work.
  // If opened directly from disk (file:///), use http://localhost:3001.
  const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3001' : '';

  /**
   * Health Check
   */
  async function checkBackendHealth() {
    serverStatusBadge.className = 'badge badge-warning';
    serverStatusBadge.innerHTML = '<span class="indicator-dot"></span> Checking...';
    serverStatusText.textContent = 'Connecting...';
    serverLatencyText.textContent = 'Measuring latency...';
    rawResponseEl.textContent = 'Contacting backend health check...';

    const startTime = performance.now();

    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // Update Server Status
      serverStatusBadge.className = 'badge badge-success';
      serverStatusBadge.innerHTML = '<span class="indicator-dot"></span> Online';
      serverStatusText.textContent = `${data.app} (v${data.version})`;
      serverLatencyText.textContent = `Response: ${elapsed}ms | Env: ${data.environment}`;

      // Update Database Status
      const isDbConnected = data.services?.database === 'connected';
      dbStatusBadge.className = isDbConnected ? 'badge badge-success' : 'badge badge-danger';
      dbStatusBadge.innerHTML = `<span class="indicator-dot"></span> ${isDbConnected ? 'Connected' : 'Offline'}`;
      dbStatusText.textContent = isDbConnected
        ? `SQLite: ${data.services.totalItems} Items`
        : 'SQLite Disconnected';
      dbStatusMeta.textContent = data.services.databaseFile || 'server/data/campus-lost-found.db';

      // Output Raw Response
      rawResponseEl.textContent = JSON.stringify(data, null, 2);
      console.log('[Campus Lost & Found] SQLite Health Check:', data);
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);

      serverStatusBadge.className = 'badge badge-danger';
      serverStatusBadge.innerHTML = '<span class="indicator-dot"></span> Offline';
      serverStatusText.textContent = 'Backend unreachable';
      serverLatencyText.textContent = `Attempted ${API_BASE}/api/health (${elapsed}ms)`;

      dbStatusBadge.className = 'badge badge-danger';
      dbStatusBadge.innerHTML = '<span class="indicator-dot"></span> Unavailable';
      dbStatusText.textContent = 'Database unavailable';
      dbStatusMeta.textContent = 'Ensure backend server is running via `npm run dev`';

      rawResponseEl.textContent = `Error connecting to backend:\n${err.message}\n\nPlease run:\n  npm run dev (or cd server && npm start)`;
      console.warn('[Campus Lost & Found] Health check failed:', err.message);
    }
  }

  /**
   * Fetch and render items from SQLite
   */
  async function loadItems() {
    const search = filterSearch ? filterSearch.value.trim() : '';
    const status = filterStatus ? filterStatus.value : 'all';
    const category = filterCategory ? filterCategory.value : 'all';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status !== 'all') params.append('status', status);
    if (category !== 'all') params.append('category', category);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const response = await fetch(`${API_BASE}/api/items${queryString}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch items (${response.status})`);
      }

      const result = await response.json();
      const items = result.data || [];

      if (itemsCountDisplay) {
        itemsCountDisplay.textContent = items.length;
      }

      renderItemsTable(items);
    } catch (err) {
      console.error('[Campus Lost & Found] Error loading items:', err);
      if (itemsTableBody) {
        itemsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state" style="color: var(--danger);">
              Failed to load records from SQLite: ${err.message}
            </td>
          </tr>
        `;
      }
    }
  }

  /**
   * Render items in the table
   */
  function renderItemsTable(items) {
    if (!itemsTableBody) return;

    if (items.length === 0) {
      itemsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No matching items found in SQLite database.
          </td>
        </tr>
      `;
      return;
    }

    itemsTableBody.innerHTML = items.map(item => {
      const isLost = item.status === 'Lost';
      const badgeClass = isLost ? 'badge-lost' : 'badge-found';
      const formattedDate = item.created_at ? item.created_at.replace('T', ' ').slice(0, 19) : 'Just now';

      return `
        <tr>
          <td><strong>#${item.id}</strong></td>
          <td>
            <span class="badge ${badgeClass}">${escapeHtml(item.status)}</span>
          </td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td><span style="text-transform: capitalize;">${escapeHtml(item.category)}</span></td>
          <td>📍 ${escapeHtml(item.location)}</td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(formattedDate)}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Escape HTML to avoid injection in display
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Handle Report Item Form Submission (POST /api/items)
   */
  if (itemForm) {
    itemForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('item-name');
      const categoryInput = document.getElementById('item-category');
      const locationInput = document.getElementById('item-location');
      const statusInput = document.getElementById('item-status');

      const payload = {
        name: nameInput.value.trim(),
        category: categoryInput.value,
        location: locationInput.value.trim(),
        status: statusInput.value
      };

      submitItemBtn.disabled = true;
      formFeedback.style.color = 'var(--text-muted)';
      formFeedback.textContent = 'Saving to SQLite database...';

      try {
        const response = await fetch(`${API_BASE}/api/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }

        formFeedback.style.color = 'var(--success)';
        formFeedback.textContent = `✓ Successfully saved item #${result.data.id} to SQLite!`;

        // Clear name and location fields
        nameInput.value = '';
        locationInput.value = '';

        // Refresh table & health stats
        await loadItems();
        await checkBackendHealth();

        // Clear feedback after 4 seconds
        setTimeout(() => {
          formFeedback.textContent = '';
        }, 4000);
      } catch (err) {
        formFeedback.style.color = 'var(--danger)';
        formFeedback.textContent = `✗ Failed to save: ${err.message}`;
      } finally {
        submitItemBtn.disabled = false;
      }
    });
  }

  // Filter Event Listeners
  if (filterSearch) {
    let debounceTimer;
    filterSearch.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadItems, 250);
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', loadItems);
  }

  if (filterCategory) {
    filterCategory.addEventListener('change', loadItems);
  }

  if (refreshItemsBtn) {
    refreshItemsBtn.addEventListener('click', loadItems);
  }

  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      checkBackendHealth();
      loadItems();
    });
  }

  // Initial loads
  checkBackendHealth();
  loadItems();
});
