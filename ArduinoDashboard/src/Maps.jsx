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
        const current = map.getCenter();
        const dist = map.distance(current, position);
        if (dist > 5) {
            map.panTo(position);
        }
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

const LiveMap = ({ x, y }) => {

    const [car, setCar] = useState({
        car1: { lat: y, lon: x }, // assuming x = longitude, y = latitude
    });

    const followCar = car.car1;

    useEffect(() => {
        setCar({
            car1: { lat: y, lon: x }
        });
    }, [x, y]);

    return (
        <MapContainer
            center={[y, x]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            <Marker position={[followCar.lat, followCar.lon]}>
                <Popup>car1</Popup>
            </Marker>

            <MapPanner position={[followCar.lat, followCar.lon]} />
            <MapResizer />
        </MapContainer>
    );
};

export default LiveMap;
