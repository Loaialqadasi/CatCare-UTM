'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchCats, fetchEmergencies } from '@/lib/api-client';
import { Search, MapPin, Building2, X } from 'lucide-react';
import type { Cat, EmergencyReport, HealthStatus } from '@/lib/types';

// UTM Campus center
const UTM_CENTER: [number, number] = [1.5595, 103.6388];

const healthColors: Record<HealthStatus, string> = {
  healthy: '#10b981',
  needs_attention: '#f59e0b',
  injured: '#ef4444',
  unknown: '#6b7280',
};

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

const buildingTypeLabels: Record<string, string> = {
  gate: 'Gate',
  admin: 'Admin',
  library: 'Library',
  faculty: 'Faculty',
  residential: 'Residential',
  mosque: 'Mosque',
  sports: 'Sports',
  food: 'Food',
  transport: 'Transport',
};

const buildingTypeEmojis: Record<string, string> = {
  gate: '🚪',
  admin: '🏛️',
  library: '📚',
  faculty: '🎓',
  residential: '🏠',
  mosque: '🕌',
  sports: '⚽',
  food: '🍽️',
  transport: '🚌',
};

interface UTMBuilding {
  name: string;
  lat: number;
  lng: number;
  type: string;
  desc: string;
}

export default function MapPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{ center: [number, number]; cats: Cat[]; emergencies: EmergencyReport[]; selectedBuilding?: string | null }> | null>(null);
  const [buildings, setBuildings] = useState<UTMBuilding[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('');

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    import('./utm-map').then((mod) => {
      setMapComponent(() => mod.UTMMap);
      setBuildings(mod.utmBuildings);
    });
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, emergRes] = await Promise.allSettled([
          fetchCats({ pageSize: 100 }),
          fetchEmergencies({ pageSize: 100 }),
        ]);
        if (catsRes.status === 'fulfilled') setCats(catsRes.value.items);
        if (emergRes.status === 'fulfilled') setEmergencies(emergRes.value.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const catsWithCoords = cats.filter((c) => c.latitude != null && c.longitude != null);
  const emergWithCoords = emergencies.filter(
    (e) => e.latitude != null && e.longitude != null && (e.status === 'open' || e.status === 'in_progress')
  );

  const filteredBuildings = useMemo(() => {
    let result = buildings;
    if (activeFilter) {
      result = result.filter(b => b.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [buildings, searchQuery, activeFilter]);

  const buildingTypes = useMemo(() => {
    const types = new Set(buildings.map(b => b.type));
    return Array.from(types);
  }, [buildings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">UTM Campus Map</h1>
        <p className="text-muted-foreground">Interactive map showing cat locations, active emergencies, and campus landmarks at Universiti Teknologi Malaysia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="rounded-xl border-border/50 overflow-hidden">
            <div className="h-[550px] w-full">
              {loading || !MapComponent ? (
                <div className="flex items-center justify-center h-full bg-muted/30">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              ) : (
                <MapComponent
                  center={UTM_CENTER}
                  cats={catsWithCoords}
                  emergencies={emergWithCoords}
                  selectedBuilding={selectedBuilding}
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Search Buildings */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Building
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search buildings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Type filter pills */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={activeFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-6 text-[10px] px-2 ${activeFilter === '' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                  onClick={() => setActiveFilter('')}
                >
                  All
                </Button>
                {buildingTypes.map(type => (
                  <Button
                    key={type}
                    variant={activeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    className={`h-6 text-[10px] px-2 ${activeFilter === type ? 'text-white' : ''}`}
                    style={activeFilter === type ? { backgroundColor: buildingTypeColors[type] } : {}}
                    onClick={() => setActiveFilter(activeFilter === type ? '' : type)}
                  >
                    {buildingTypeEmojis[type]} {buildingTypeLabels[type]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Building List */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Campus Buildings
                <span className="text-xs text-muted-foreground font-normal">({filteredBuildings.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {filteredBuildings.map((building, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedBuilding(selectedBuilding === building.name ? null : building.name)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors hover:bg-muted/50 ${
                      selectedBuilding === building.name ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: buildingTypeColors[building.type] || '#3b82f6' }}
                      />
                      <span className="font-medium truncate">{building.name}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 ml-[18px] line-clamp-1">{building.desc}</p>
                  </button>
                ))}
                {filteredBuildings.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No buildings found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Map Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Cats on map
                </span>
                <span className="font-semibold">{catsWithCoords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Active emergencies
                </span>
                <span className="font-semibold">{emergWithCoords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Campus buildings
                </span>
                <span className="font-semibold">{buildings.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Health Legend */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cat Health Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              {Object.entries(healthColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
