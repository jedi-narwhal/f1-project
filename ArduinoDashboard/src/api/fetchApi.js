const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function getArduinoData() {
  const response = await fetch(`${API_BASE}/getTelemetry?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!response.ok) throw new Error(`Telemetry server ${response.status}`);
  const data = await response.json();
  return data;
}
