import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

export function LineGraph({ data }) {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        chartRef.current.innerHTML = "";

        const tempMax = Math.max(...data.map(d => d.temp));
        const defaultMax = 40; // default max temperature for y-axis
        const yMax = Math.max(defaultMax, tempMax);

        const chart = Plot.plot({
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
            style: {
                background: "#111827", // match bg-gray-900 from app
                color: "#d1d5db",      // match text-gray-300 from sidebar
            },
            x: {
                grid: true,
                label: "Time",
                tickFormat: d => {
                    const dt = new Date(d);
                    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                },
                color: "#9ca3af", // text-gray-400
            },
            y: {
                grid: true,
                label: "Temperature (°C)",
                domain: [0, yMax],
                color: "#9ca3af", // text-gray-400
            },
            marks: [
                Plot.ruleY([yMax], { stroke: "#374151", strokeDasharray: "4 2" }), // border-gray-700
                Plot.lineY(data, { x: d => new Date(d.date), y: "temp", stroke: "#f59e0b" }), // orange-500
                Plot.dot(data, { x: d => new Date(d.date), y: "temp", fill: "#f59e0b" })
            ]
        });

        chartRef.current.appendChild(chart);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
