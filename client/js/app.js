/**
 * Campus Lost & Found - Client Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Campus Lost & Found] Frontend entry point initialized.');

  const serverStatusBadge = document.getElementById('server-status-badge');
  const serverStatusText = document.getElementById('server-status-text');
  const serverLatencyText = document.getElementById('server-latency-text');
  
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusText = document.getElementById('db-status-text');
  
  const rawResponseEl = document.getElementById('raw-response');
  const pingBtn = document.getElementById('ping-btn');

  // Determine API Base URL:
  // If hosted via Express, relative URL '/api/health' works.
  // If opened as a static local file (file:///), point to default server port 3001.
  const API_URL = window.location.protocol === 'file:' 
    ? 'http://localhost:3001/api/health' 
    : '/api/health';

  async function checkBackendHealth() {
    serverStatusBadge.className = 'badge badge-warning';
    serverStatusBadge.innerHTML = '<span class="indicator-dot"></span> Checking...';
    serverStatusText.textContent = 'Connecting to server...';
    serverLatencyText.textContent = 'Measuring latency...';
    rawResponseEl.textContent = 'Sending request to: ' + API_URL;

    const startTime = performance.now();

    try {
      const response = await fetch(API_URL, {
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
      serverLatencyText.textContent = `Response time: ${elapsed}ms | Env: ${data.environment}`;

      // Update Database Status
      const isDbConnected = data.services?.database === 'connected';
      dbStatusBadge.className = isDbConnected ? 'badge badge-success' : 'badge badge-warning';
      dbStatusBadge.innerHTML = `<span class="indicator-dot"></span> ${isDbConnected ? 'Connected' : 'Offline / Mock'}`;
      dbStatusText.textContent = isDbConnected ? 'Supabase Connected' : 'Supabase Not Configured';

      // Output Raw Response
      rawResponseEl.textContent = JSON.stringify(data, null, 2);
      console.log('[Campus Lost & Found] Health check successful:', data);
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);

      serverStatusBadge.className = 'badge badge-danger';
      serverStatusBadge.innerHTML = '<span class="indicator-dot"></span> Offline';
      serverStatusText.textContent = 'Cannot reach backend server';
      serverLatencyText.textContent = `Attempted ${API_URL} (${elapsed}ms)`;

      dbStatusBadge.className = 'badge badge-danger';
      dbStatusBadge.innerHTML = '<span class="indicator-dot"></span> Unavailable';
      dbStatusText.textContent = 'Backend unreachable';

      rawResponseEl.textContent = `Error connecting to backend:\n${err.message}\n\nPlease ensure the backend server is running via:\n  npm run dev (or cd server && npm start)`;
      console.warn('[Campus Lost & Found] Backend health check failed:', err.message);
    }
  }

  if (pingBtn) {
    pingBtn.addEventListener('click', checkBackendHealth);
  }

  // Initial check
  checkBackendHealth();
});
