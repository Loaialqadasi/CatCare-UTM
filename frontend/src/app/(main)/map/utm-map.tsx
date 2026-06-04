'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Cat, EmergencyReport, HealthStatus } from '@/lib/types';

// Fix Leaflet default marker icons
const catIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom colored building icons
function createBuildingIcon(color: string): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -30],
    iconRetinaUrl: '',
  });
}

const healthColors: Record<HealthStatus, string> = {
  healthy: '#10b981',
  needs_attention: '#f59e0b',
  injured: '#ef4444',
  unknown: '#6b7280',
};

// UTM Campus landmarks and buildings
export const utmBuildings = [
  { name: 'Main Gate (Pintu Utama)', lat: 1.5581, lng: 103.6360, type: 'gate', desc: 'Main entrance to UTM campus' },
  { name: 'Chancellery (Canseleri)', lat: 1.5590, lng: 103.6370, type: 'admin', desc: 'University administration building' },
  { name: 'Perpustakaan Sultan Ismail', lat: 1.5588, lng: 103.6390, type: 'library', desc: 'Main campus library' },
  { name: 'Faculty of Computing (FC)', lat: 1.5593, lng: 103.6395, type: 'faculty', desc: 'School of Computing, home to CS & SE programs' },
  { name: 'Faculty of Electrical Engineering (FKE)', lat: 1.5605, lng: 103.6385, type: 'faculty', desc: 'Electrical & Electronic Engineering' },
  { name: 'Faculty of Mechanical Engineering (FKM)', lat: 1.5608, lng: 103.6398, type: 'faculty', desc: 'Mechanical Engineering faculty' },
  { name: 'Faculty of Civil Engineering (FKA)', lat: 1.5600, lng: 103.6405, type: 'faculty', desc: 'Civil Engineering faculty' },
  { name: 'Faculty of Science (FS)', lat: 1.5585, lng: 103.6410, type: 'faculty', desc: 'Physics, Chemistry, Mathematics & Bioscience' },
  { name: 'Faculty of Built Environment (FAB)', lat: 1.5578, lng: 103.6400, type: 'faculty', desc: 'Architecture & Surveying' },
  { name: 'Razak Faculty (FR)', lat: 1.5572, lng: 103.6378, type: 'faculty', desc: 'Razak Faculty of Technology and Informatics' },
  { name: 'School of Graduate Studies', lat: 1.5595, lng: 103.6380, type: 'admin', desc: 'Postgraduate administration' },
  { name: 'Student Affairs (HEP)', lat: 1.5583, lng: 103.6382, type: 'admin', desc: 'Hal Ehwal Pelajar — student services' },
  { name: 'Kolej Kediaman Tun Razak (KTR)', lat: 1.5570, lng: 103.6365, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Kolej Kediaman Tuanku Canselor (KTC)', lat: 1.5565, lng: 103.6380, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Kolej Kediaman 9th College (K9)', lat: 1.5560, lng: 103.6395, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Masjid Sultan Ismail', lat: 1.5588, lng: 103.6378, type: 'mosque', desc: 'Main campus mosque' },
  { name: 'UTM Stadium', lat: 1.5565, lng: 103.6355, type: 'sports', desc: 'Main sports stadium' },
  { name: 'Sports Complex (Kompleks Sukan)', lat: 1.5570, lng: 103.6345, type: 'sports', desc: 'Swimming pool, courts, gym' },
  { name: 'Cafeteria / Food Court', lat: 1.5590, lng: 103.6388, type: 'food', desc: 'Campus food court and dining area' },
  { name: 'UTM Bus Terminal', lat: 1.5585, lng: 103.6372, type: 'transport', desc: 'Campus bus terminal & shuttle stop' },
  { name: 'Innovation Centre', lat: 1.5598, lng: 103.6375, type: 'admin', desc: 'Research & innovation hub' },
];

const buildingTypeColors: Record<string, string> = {
  gate: '#3b82f6',
  admin: '#6366f1',
  library: '#8b5cf6',
  faculty: '#0ea5e9',
  residential: '#f59e0b',
  mosque: '#10b981',
  sports: '#ef4444',
  food: '#f97316',
  transport: '#64748b',
};

interface UTMMapProps {
  center: [number, number];
  cats: Cat[];
  emergencies: EmergencyReport[];
  selectedBuilding?: string | null;
}

function MapResizer() {
  const map = useMap();
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
  return null;
}

function FlyToBuilding({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 18, { duration: 0.8 });
  return null;
}

export function UTMMap({ center, cats, emergencies, selectedBuilding }: UTMMapProps) {
  const selected = selectedBuilding ? utmBuildings.find(b => b.name === selectedBuilding) : null;

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <MapResizer />
      {selected && <FlyToBuilding lat={selected.lat} lng={selected.lng} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* UTM Campus Building Markers */}
      {utmBuildings.map((building, idx) => {
        const color = buildingTypeColors[building.type] || '#3b82f6';
        const icon = createBuildingIcon(color);
        return (
          <Marker
            key={`building-${idx}`}
            position={[building.lat, building.lng]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm" style={{ color }}>{building.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{building.desc}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  📍 {building.lat.toFixed(4)}, {building.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Cat markers */}
      {cats.map((cat) => (
        <Marker
          key={`cat-${cat.id}`}
          position={[cat.latitude!, cat.longitude!]}
          icon={catIcon}
        >
          <Popup>
            <div className="min-w-[180px]">
              {cat.photoUrl && (
                <img
                  src={cat.photoUrl}
                  alt={cat.nickname}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-bold text-sm">{cat.nickname}</h3>
              <p className="text-xs text-gray-600">{cat.locationName}</p>
              <p className="text-xs mt-1">
                Status: <span style={{ color: healthColors[cat.healthStatus] }} className="font-medium capitalize">
                  {cat.healthStatus.replace('_', ' ')}
                </span>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Emergency markers */}
      {emergencies.map((emerg) => (
        <CircleMarker
          key={`emerg-${emerg.id}`}
          center={[emerg.latitude!, emerg.longitude!]}
          radius={12}
          fillColor="#ef4444"
          color="#991b1b"
          weight={2}
          opacity={0.9}
          fillOpacity={0.5}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h3 className="font-bold text-sm text-red-600">{emerg.title}</h3>
              <p className="text-xs text-gray-600">{emerg.locationName}</p>
              <p className="text-xs mt-1">
                Priority: <span className="font-medium capitalize">{emerg.priority}</span>
              </p>
              <p className="text-xs">{emerg.description}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
