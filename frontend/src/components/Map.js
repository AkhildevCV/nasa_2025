import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng); },
  });
  return null;
}

export default function Map({ lat, lon, zoom, onMapClick, onZoomChange }) {
  const pos = [lat, lon];
  return (
    <MapContainer
      center={pos}
      zoom={zoom}
      style={{ height: '450px', width: '100%', cursor: 'crosshair' }}
      whenCreated={(m) => m.on('zoomend', () => onZoomChange(m.getZoom()))}
    >
      <ChangeView center={pos} zoom={zoom} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={pos} />
      <ClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
}