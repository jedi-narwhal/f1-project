import { useState, useEffect, useRef, useCallback } from 'react';
import LiveMap     from './Maps';
import TopBar      from './components/TopBar';
import BottomHUD   from './components/BottomHUD';
import SideTabs    from './components/SideTabs';
import DriverPanel from './components/DriverPanel';
import CarPanel    from './components/CarPanel';
import { parse }         from './utils/telemetry';
import { getArduinoData } from './api/fetchApi';

const DEFAULT_SAMPLE = `------ DATA ------
IR: OBSTACLE DETECTED
Accel: 0.162, 0.078, 1.013
Temp (C): 25.49
Humidity (%): 54.42
BPM: 78
Gas: 142`;

const INITIAL_TELEMETRY = {
  readings: 0,
  irAlerts: 0,
  irTotal:  0,
  peakMag:  0,
  lastData: null,
  hrPeak:   0,
  gasPeak:  0,
  flowSpeed: 0.45,
  logLines:  [],
  t0: Date.now(),
};

/** Haversine distance in metres between two WGS84 lat/lon points */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180, Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [telemetry,       setTelemetry]       = useState(INITIAL_TELEMETRY);
  const [activePanel,     setActivePanel]     = useState(null);
  const [rawInput,        setRawInput]        = useState(DEFAULT_SAMPLE);
  const [injectFeedback,  setInjectFeedback]  = useState({ text: '', cls: 'fb' });
  const [pathDistanceMeters, setPathDistanceMeters] = useState(0);
  const [cameraObjects, setCameraObjects] = useState([]);

  // Refs used by canvas animation loops (avoid stale closures & excessive re-renders)
  const telemetryRef = useRef(INITIAL_TELEMETRY);
  const ecgRef       = useRef({ hrBpm: 0, phase: 0, buf: new Array(120).fill(0) });
  const lastApiTMs   = useRef(null);
  const lastLatLon   = useRef(null);

  // Keep telemetryRef in sync with state
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  // Sync body class for CSS panel transitions
  useEffect(() => {
    document.body.classList.toggle('panel-open', activePanel !== null);
  }, [activePanel]);

  // ECG buffer update at 60fps (mutates ref, no state update)
  useEffect(() => {
    const id = setInterval(() => {
      const e = ecgRef.current;
      if (!e.hrBpm) return;
      const period = 60 / e.hrBpm;
      e.phase = (e.phase + 1 / (period * 60)) % 1;
      const p = e.phase;
      let v = 0;
      if      (p < 0.08) v = 0.12 * Math.sin(p / 0.08 * Math.PI);
      else if (p < 0.13) v = 0;
      else if (p < 0.15) v = -0.22 * (p - 0.13) / 0.02;
      else if (p < 0.19) v = Math.sin((p - 0.15) / 0.04 * Math.PI);
      else if (p < 0.23) v = -0.18 * (0.23 - p) / 0.04;
      else if (p < 0.38) v = 0;
      else if (p < 0.55) v = 0.32 * Math.sin((p - 0.38) / 0.17 * Math.PI);
      e.buf.push(v);
      if (e.buf.length > 120) e.buf.shift();
    }, 1000 / 60);
    return () => clearInterval(id);
  }, []);

  // Core data update — called when new Arduino data is injected
  const handleUpdate = useCallback((d) => {
    const now = new Date();
    const mag = d.ax !== undefined ? Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2) : 0;

    // Update canvas refs immediately (no re-render needed)
    if (d.bpm !== undefined) ecgRef.current.hrBpm = d.bpm;

    setTelemetry(prev => {
      const next = {
        ...prev,
        readings: prev.readings + 1,
        lastData: d,
        hrPeak:   d.bpm  !== undefined ? Math.max(prev.hrPeak,  d.bpm)  : prev.hrPeak,
        gasPeak:  d.gas  !== undefined ? Math.max(prev.gasPeak, d.gas)  : prev.gasPeak,
        peakMag:  mag > 0             ? Math.max(prev.peakMag,  mag)   : prev.peakMag,
        flowSpeed: mag > 0 ? Math.max(0.06, Math.min(1, mag / 12)) : prev.flowSpeed,
        irTotal:  d.ir !== undefined ? prev.irTotal + 1 : prev.irTotal,
        irAlerts: d.ir === 'OBSTACLE DETECTED' ? prev.irAlerts + 1 : prev.irAlerts,
      };

      // Build structured log entry
      const ts = now.toLocaleTimeString('en-US', { hour12: false });
      const ic = d.ir === 'OBSTACLE DETECTED' ? 'log-r' : 'log-ok';
      const is = d.ir === 'OBSTACLE DETECTED' ? '⚠ ' : '✓ ';
      const ac = d.ax !== undefined ? `A:[${d.ax.toFixed(2)},${d.ay.toFixed(2)},${d.az.toFixed(2)}] ` : '';
      const bp = d.bpm !== undefined ? `${d.bpm}bpm ` : '';
      const gs = d.gas !== undefined ? `${d.gas}ppm` : '';
      next.logLines = [{ id: now.getTime(), ts, ic, is, ac, bp, gs }, ...prev.logLines].slice(0, 7);

      // Sync canvas ref (safe inside updater since refs are mutable)
      telemetryRef.current = next;
      return next;
    });
  }, []);

  // Poll telemetry server; also receive camera objects (updated every 10s by camera worker)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getArduinoData();
        if (Array.isArray(data?.cameraObjects)) setCameraObjects(data.cameraObjects);
        if (data?.t_ms != null && data.t_ms > 0 && data.t_ms !== lastApiTMs.current) {
          lastApiTMs.current = data.t_ms;
          handleUpdate({
            ax: data.ax,
            ay: data.ay,
            az: data.az,
            temp: data.temp,
            hum: data.hum,
            bpm: data.bpm,
            gas: data.gas,
            ir: data.ir,
          });
        }
      } catch {
        // Server down or CORS; ignore
      }
    }, 500);
    return () => clearInterval(interval);
  }, [handleUpdate]);

  // Inject button handler
  const handleInject = useCallback(() => {
    const d = parse(rawInput);
    if (d.ok) {
      handleUpdate(d);
      setInjectFeedback({ text: '✓ OK', cls: 'fb fb--ok' });
      setTimeout(() => setInjectFeedback({ text: '', cls: 'fb' }), 2000);
    } else {
      setInjectFeedback({ text: '✗ FAIL', cls: 'fb fb--err' });
      setTimeout(() => setInjectFeedback({ text: '', cls: 'fb' }), 3000);
    }
  }, [rawInput, handleUpdate]);

  // Panel toggle
  const handleTogglePanel = useCallback((which) => {
    setActivePanel(prev => prev === which ? null : which);
  }, []);

  // Path distance from GPS (lat/lon changes)
  const onPositionChange = useCallback((lat, lon) => {
    const prev = lastLatLon.current;
    if (prev != null) {
      const meters = haversineMeters(prev.lat, prev.lon, lat, lon);
      if (meters > 0) setPathDistanceMeters(m => m + meters);
    }
    lastLatLon.current = { lat, lon };
  }, []);

  // Quick Start: reset session and start fresh data collection + distance counting
  const handleQuickStart = useCallback(() => {
    lastLatLon.current = null;
    setPathDistanceMeters(0);
    setTelemetry({
      ...INITIAL_TELEMETRY,
      t0: Date.now(),
    });
  }, []);

  // Derived display values (accel assumed in g's: at rest mag ≈ 1, so speed = 0, g = 1.0)
  const d       = telemetry.lastData;
  const mag     = d?.ax !== undefined ? Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2) : 0;
  const speedG  = Math.max(0, mag - 1);
  const mph     = (speedG * 25).toFixed(1);
  const gForce  = mag > 0 ? mag.toFixed(2) : '0.00';
  const speedAlert = mag > 10;
  const pathDistanceMiles = pathDistanceMeters / 1609.34;
  const irDet   = d?.ir === 'OBSTACLE DETECTED';
  const lastUpd = d ? `LAST ${new Date().toLocaleTimeString('en-US', { hour12: false })}` : null;

  const irPillClass   = irDet ? 'pill pill--r' : 'pill pill--d';
  const irPillContent = irDet
    ? '<div class="dot dot--r"></div>IR ALERT'
    : '<div class="dot dot--a"></div>IR STANDBY';

  // Auto-inject sample on first load
  useEffect(() => {
    const d = parse(DEFAULT_SAMPLE);
    if (d.ok) handleUpdate(d);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Full-screen map background */}
      <LiveMap panelOpen={activePanel !== null} irAlert={irDet} onPositionChange={onPositionChange} />

      {/* Bottom gradient fade */}
      <div className="bottom-fade" />

      {/* Top bar */}
      <TopBar
        lastUpd={lastUpd}
        irPillClass={irPillClass}
        irPillContent={irPillContent}
        t0={telemetry.t0}
      />

      {/* Quick Start — positioned below top bar */}
      <button
        type="button"
        className="quick-start-btn"
        onClick={handleQuickStart}
        title="Start data collection and distance tracking"
      >
        QUICK START
      </button>

      {/* Side tab buttons */}
      <SideTabs activePanel={activePanel} onToggle={handleTogglePanel} />

      {/* Driver stats panel */}
      <DriverPanel
        isOpen={activePanel === 'driver'}
        telemetry={telemetry}
        ecgRef={ecgRef}
      />

      {/* Car stats panel */}
      <CarPanel
        isOpen={activePanel === 'car'}
        telemetry={telemetry}
        telemetryRef={telemetryRef}
        rawInput={rawInput}
        onRawChange={setRawInput}
        onInject={handleInject}
        injectFeedback={injectFeedback}
        cameraObjects={cameraObjects}
      />

      {/* Bottom HUD */}
      <BottomHUD
        mph={mph}
        gForce={gForce}
        distance={pathDistanceMiles}
        distanceUnit="MI"
        speedAlert={speedAlert}
      />
    </>
  );
}
