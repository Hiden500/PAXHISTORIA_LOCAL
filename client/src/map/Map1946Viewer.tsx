import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function Map1946Viewer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Цвета для владельцев 1946
  const ownerColors: Record<string, string> = useMemo(() => ({
    'GBR': '#e63946', // Британия - красный
    'FRA': '#2a9d8f', // Франция - бирюзовый
    'USA': '#457b9d', // США - синий
    'USSR': '#e63946', // СССР - красный
    'DEU': '#f4a261', // Германия - оранжевый
    'DEU_UK': '#457b9d', // Британская зона
    'DEU_USA': '#457b9d', // Американская зона
    'DEU_USSR': '#e63946', // Советская зона
    'DEU_FRA': '#2a9d8f', // Французская зона
    'JPN': '#f4a261', // Япония
    'CHN': '#e76f51', // Китай
    'NEUTRAL': '#6c757d', // Нейтральные
    'OCCUPIED': '#adb5bd', // Оккупированные
  }), []);

  const loadMapData = useCallback(async (m: maplibregl.Map) => {
    try {
      console.log('Loading world_map_1946.geojson...');
      const response = await fetch('/world_map_1946.geojson');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const geoJson = await response.json();
      console.log('GeoJSON loaded:', geoJson.features.length, 'features');

      // Добавляем источник данных
      m.addSource('regions-1946', {
        type: 'geojson',
        data: geoJson
      });

      // Слой для земельных регионов
      m.addLayer({
        id: 'regions-fill',
        type: 'fill',
        source: 'regions-1946',
        filter: ['==', ['get', 'type'], 'land'],
        paint: {
          'fill-color': [
            'match',
            ['get', 'ownerId'],
            ...Object.entries(ownerColors).flatMap(([key, color]) => [key, color]),
            '#6c757d'
          ] as unknown as maplibregl.ExpressionSpecification,
          'fill-opacity': 0.7
        }
      });

      // Слой границ регионов
      m.addLayer({
        id: 'regions-outline',
        type: 'line',
        source: 'regions-1946',
        filter: ['==', ['get', 'type'], 'land'],
        paint: {
          'line-color': '#334155',
          'line-width': 0.5
        }
      });

      // Слой для канальных регионов
      m.addLayer({
        id: 'canals-fill',
        type: 'fill',
        source: 'regions-1946',
        filter: ['==', ['get', 'type'], 'canal'],
        paint: {
          'fill-color': '#ffd700',
          'fill-opacity': 0.8
        }
      });

      // Слой для морских регионов
      m.addLayer({
        id: 'seas-fill',
        type: 'fill',
        source: 'regions-1946',
        filter: ['==', ['get', 'type'], 'sea'],
        paint: {
          'fill-color': '#1a3a5c',
          'fill-opacity': 0.5
        }
      });

      // Добавляем интерактивность
      m.on('mousemove', 'regions-fill', () => {
        m.getCanvas().style.cursor = 'pointer';
      });

      m.on('mouseleave', 'regions-fill', () => {
        m.getCanvas().style.cursor = '';
      });

      m.on('click', 'regions-fill', (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const props = feature.properties;
        
        new maplibregl.Popup({ closeButton: true, closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="color: #f1f5f9; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">${props.name || 'Unknown'}</h3>
              <div style="font-size: 12px;">ID: ${props.id || 'N/A'}</div>
              <div style="font-size: 12px;">Owner: ${props.ownerId || 'N/A'}</div>
              <div style="font-size: 12px;">Type: ${props.type || 'N/A'}</div>
            </div>
          `)
          .addTo(m);
      });

    } catch (err) {
      console.error('Ошибка загрузки карты:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных карты');
    }
  }, [ownerColors]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
        },
        center: [20, 30],
        zoom: 2,
        maxZoom: 10,
        minZoom: 1,
        attributionControl: false
      });

      m.on('load', () => {
        // Фон - тёмно-синий (подложка под океаны)
        m.addLayer({
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#0a1628'
          }
        });

        setLoaded(true);
        loadMapData(m);
      });

      m.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current = m;

      return () => {
        m.remove();
        map.current = null;
      };
    } catch (err) {
      setTimeout(() => setError(err instanceof Error ? err.message : 'Ошибка инициализации карты'), 0);
    }
  }, [loadMapData]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ef4444' }}>
        <h2>Ошибка загрузки карты</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#1e293b', 
        color: '#f1f5f9',
        borderBottom: '1px solid #334155'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Карта мира 1946 (Временный просмотр)</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          {loaded ? 'Загружено' : 'Загрузка...'} • {ownerColors['GBR'] && 'GBR: Красный, FRA: Бирюзовый, USA: Синий, USSR: Красный'}
        </p>
      </div>
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
}
