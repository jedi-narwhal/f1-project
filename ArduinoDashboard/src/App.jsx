import React from "react";
import LiveMap from "./Maps";
import './App.css';

function App() {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            <header className="bg-blue-500 text-white p-4 text-center shrink-0">
                Top Bar
            </header>
            <div className="w-[90vw] h-[60vh] mx-auto border overflow-hidden">
                <LiveMap />
            </div>
        </div>
    );
}

export default App;
