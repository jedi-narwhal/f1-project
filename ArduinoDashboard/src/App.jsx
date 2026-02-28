import { useState, useEffect } from "react";
import LiveMap from "./Maps";
import './App.css';
import { getArduinoData } from "./api/fetchApi";

const DashboardData = {
    DistanceTraveled: 0,
    DistanceFromCensor: 0,
    PosX: 0,
    PosY: 0,
    HeatTemp: 0,
};

function App() {
    const [data, updateData] = useState(DashboardData);
    // Handles updating dashboard state safely
    const handleUpdate = (jsonData) => {
        if (!jsonData) return;

        updateData(prev => ({
            ...prev,
            DistanceTraveled: prev.DistanceTraveled + (jsonData.DistanceTraveled || 0),
            DistanceFromCensor: jsonData.DistanceFromCensor || 0,
            PosX: jsonData.PosX || 0,
            PosY: jsonData.PosY || 0,
            HeatTemp: jsonData.HeatTemp || 0,
        }));
    };

    // Fetch data every second
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetched = await getArduinoData();
                handleUpdate(fetched);
            } catch (error) {
                console.error(error);
            }
        };

        const interval = setInterval(fetchData, 500);
        return () => clearInterval(interval);
    }, []);

    // For testing: log whenever data changes
    useEffect(() => {
        console.log("Dashboard data updated:", data);
    }, [data]);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            {/* Top bar */}
            <header className="bg-blue-500 text-white p-4 text-center shrink-0">
                Top Bar
            </header>

            {/* Middle row: left sidebar + map + right sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-70 bg-gray-100 border-r p-4 shrink-0">
                    <h2 className="font-bold text-sm mb-2">Left Panel</h2>
                    <p className="text-xs text-gray-500">Car list, filters, etc.</p>
                </div>

                {/* Map + Bottom Panel */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Map */}
                    <div className="flex-1 overflow-hidden">
                        <LiveMap data={data} />
                    </div>

                    {/* Bottom Panel */}
                    <div className="h-70 bg-gray-100 border-t p-4 shrink-0">
                        <h2 className="font-bold text-sm mb-2">Bottom Panel</h2>
                        <p className="text-xs text-gray-500">Timeline, logs, stats, etc.</p>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-70 bg-gray-100 border-l p-4 shrink-0">
                    <h2 className="font-bold text-sm mb-2">Right Panel</h2>
                    <p className="text-xs text-gray-500">Car details, speed, etc.</p>
                </div>
            </div>
        </div>
    );
}

export default App;
