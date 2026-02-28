import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapPanner({ position }) {
    const map = useMap();
    useEffect(() => {
        map.panTo(position);
    }, [position]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, []);
    return null;
}

const LiveMap = () => {
    const [cars, setCars] = useState({
        car1: { lat: 51.505, lon: -0.09 },
        car2: { lat: 51.506, lon: -0.092 },
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCars(prev => ({
                car1: {
                    lat: prev.car1.lat + (Math.random() - 0.5) * 0.001,
                    lon: prev.car1.lon + (Math.random() - 0.5) * 0.001
                },
                car2: {
                    lat: prev.car2.lat + (Math.random() - 0.5) * 0.001,
                    lon: prev.car2.lon + (Math.random() - 0.5) * 0.001
                }
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const followCar = cars.car1;

    return (
        <MapContainer center={[51.505, -0.09]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            {Object.entries(cars).map(([id, car]) => (
                <Marker key={id} position={[car.lat, car.lon]}>
                    <Popup>{id}</Popup>
                </Marker>
            ))}
            <MapPanner position={[followCar.lat, followCar.lon]} />
            <MapResizer />
        </MapContainer>
    );
};

export default LiveMap;
