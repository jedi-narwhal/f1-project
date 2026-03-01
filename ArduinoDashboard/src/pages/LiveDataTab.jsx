import LiveMap from "./../Maps";
import StatCard from "../../StatCard";

export default function LiveData({ data }) {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Map — now fills the full area since stats are in the sidebar */}
            <div className="flex-1 border overflow-hidden">
                <LiveMap x={data.PosX} y={data.PosY} />
            </div>
        </div>
    );
}
