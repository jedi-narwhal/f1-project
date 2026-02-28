import React from "react";
import LiveMap from "./Maps";
import './App.css';

function App() {
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
                        <LiveMap />
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
