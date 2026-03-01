import { LineGraph } from "./../graphs";

export default function HistoricalData({ data }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-900 p-4">
            {data && data.length > 0 ? (
                <div className="w-full h-[400px]">
                    <LineGraph data={data} />
                </div>
            ) : (
                <p className="text-gray-400 text-sm">Historical data coming soon.</p>
            )}
        </div>
    );
}
