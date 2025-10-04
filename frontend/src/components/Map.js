// frontend/src/components/Map.js
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapEvents({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    },
  });
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function Map({ lat, lon, zoom, onMapClick, onZoomChange }) {
  const position = [lat, lon];

  return (
    <div className="map-container">
      {/* --- CHANGE: Removed inline style for height --- */}
      <MapContainer center={position} zoom={zoom}>
        <ChangeView center={position} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker key={`${lat}-${lon}`} position={position} />
        <MapClickHandler onMapClick={onMapClick} />
        <MapEvents onZoomChange={onZoomChange} />
      </MapContainer>
    </div>
  );
}

export default Map; 