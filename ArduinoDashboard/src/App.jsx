import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HistoricalData from "./pages/HistoricalData";
import LiveData from "./pages/LiveDataTab";
import { getArduinoData } from "./api/fetchApi";

const DashboardData = {
    DistanceTraveled: 0,
    DistanceFromSensor: 0,
    PosX: -122.4194,
    PosY: 37.7749,
    HeatTemp: 0,
};

export default function App() {
    const [data, setData] = useState(DashboardData);
    const [view, setView] = useState("live");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [heatHistory, setHeatHistory] = useState([]); // cumulative heat data
    const [paused, setPaused] = useState(false); // NEW: pause/resume state

    useEffect(() => {
        if (paused) return; // do not fetch if paused

        const fetchData = async () => {
            try {
                const fetched = await getArduinoData();
                if (!fetched) return;

                setData(prev => {
                    const updated = {
                        ...prev,
                        DistanceTraveled: fetched.DistanceTraveled ?? prev.DistanceTraveled,
                        DistanceFromSensor: fetched.DistanceFromSensor ?? prev.DistanceFromSensor,
                        PosX: fetched.PosX ?? prev.PosX,
                        PosY: fetched.PosY ?? prev.PosY,
                        HeatTemp: fetched.HeatTemp ?? prev.HeatTemp,
                    };

                    setHeatHistory(history => [
                        ...history,
                        { date: new Date(), temp: updated.HeatTemp }
                    ]);

                    return updated;
                });
            } catch (e) {
                console.error(e);
            }
        };

        const interval = setInterval(fetchData, 500);
        return () => clearInterval(interval);
    }, [paused]); // re-run effect whenever paused changes

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            {/* Map or historical graph */}
            <div className="absolute inset-0">
                {view === "live" ? (
                    <LiveData data={data} />
                ) : (
                    <HistoricalData data={heatHistory} />
                )}
            </div>

            {/* Sidebar */}
            <div
                className={`absolute top-0 left-0 h-full bg-gray-900/80 backdrop-blur-sm border-r border-gray-700 flex flex-col transition-all duration-300 overflow-hidden z-[1000] ${sidebarOpen ? "w-72" : "w-0"}`}
            >
                <div className="w-72 p-4 flex flex-col gap-4 pt-16">
                    <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mt-2">Live Stats</h2>
                    <div className="flex flex-col gap-3">
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-gray-400 mb-1">Distance Traveled</p>
                            <p className="text-xl font-bold text-white">
                                {data.DistanceTraveled?.toFixed(1)} <span className="text-sm font-normal text-gray-400">m</span>
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-gray-400 mb-1">Distance from Sensor</p>
                            <p className="text-xl font-bold text-white">
                                {data.DistanceFromSensor?.toFixed(1)} <span className="text-sm font-normal text-gray-400">m</span>
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-gray-400 mb-1">Heat Temp</p>
                            <p className="text-xl font-bold text-white">
                                {data.HeatTemp?.toFixed(1)} <span className="text-sm font-normal text-gray-400">°C</span>
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-gray-400 mb-1">Coordinates</p>
                            <p className="text-sm font-bold text-white">{data.PosX?.toFixed(4)}</p>
                            <p className="text-sm font-bold text-white">{data.PosY?.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(o => !o)}
                className="absolute bottom-4 left-4 z-[1001] bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-700 transition-colors duration-300 flex items-center justify-center"
            >
                {sidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
            </button>

            {/* View toggle */}
            <button
                onClick={() => setView(v => (v === "live" ? "history" : "live"))}
                className="absolute top-4 right-4 z-[1001] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-colors duration-200"
            >
                {view === "live" ? "View Historical" : "View Live Map"}
            </button>

            {/* Pause/Resume button */}
            <button
                onClick={() => setPaused(p => !p)}
                className="absolute bottom-4 right-4 z-[1001] bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-colors duration-200"
            >
                {paused ? "Resume" : "Pause"}
            </button>
        </div>
    );
}
