export default function StatCard({ label, value, unit }) {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold text-gray-100">
                {value}
                {unit && (
                    <span className="text-sm font-normal ml-1 text-gray-400">
                        {unit}
                    </span>
                )}
            </span>
        </div>
    );
}
