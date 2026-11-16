'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Compass,
  Layers,
  Crosshair,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Send,
  Smartphone,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  Flame,
  Globe,
  Radio,
  Wifi,
  WifiOff,
  Radar
} from 'lucide-react'
import { SecurityActionModal } from '@/components/security/security-action-modal'

export const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_4l2w_1_c04473e1984c633bf7453355'

export interface MapMarkerItem {
  id: string
  title: string
  subtitle?: string
  lat: number
  lng: number
  city: string
  country?: string
  amount?: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  source: 'UPI' | 'CARD' | 'MAJOR_PURCHASE' | 'SYNDICATE' | 'DEVICE' | 'CLUSTER'
  status?: string
  device?: string
  timestamp?: string
  anomalyReason?: string
  details?: Record<string, any>
}

export type MapMarker = MapMarkerItem

interface RealGoogleMapProps {
  markers?: MapMarkerItem[]
  selectedMarkerId?: string | null
  onSelectMarker?: (marker: MapMarkerItem | null) => void
  center?: [number, number]
  zoom?: number
  height?: string
  title?: string
  showControls?: boolean
  showSearch?: boolean
  showLayers?: boolean
  interactiveClick?: boolean
  className?: string
}

// City coordinates catalog fallback
export const CITY_COORDINATES: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946],
  Bangalore: [12.9716, 77.5946],
  Hubballi: [15.3647, 75.1240],
  Hubli: [15.3647, 75.1240],
  Delhi: [28.6139, 77.2090],
  'Delhi NCR': [28.5355, 77.3910],
  Mumbai: [19.0760, 72.8777],
  Hyderabad: [17.3850, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Chandigarh: [30.7333, 76.7794],
  Dubai: [25.2048, 55.2708],
  Singapore: [1.3521, 103.8198],
  London: [51.5074, -0.1278]
}

export function getCityCoordinates(cityName: string): [number, number] {
  if (!cityName) return [12.9716, 77.5946]
  const clean = cityName.trim()
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return coords
    }
  }
  return [12.9716, 77.5946]
}

// Haversine distance calculator in KM
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// City & Risk Resolution Helpers (Prevents any 'undefined' rendering)
export function resolveMarkerCity(m: any): string {
  if (m?.city && String(m.city).trim() && m.city !== 'undefined') return String(m.city).trim()
  if (m?.area && String(m.area).trim() && m.area !== 'undefined') return String(m.area).trim()
  if (m?.title && typeof m.title === 'string') {
    if (m.title.includes('•')) return m.title.split('•')[0].trim()
    if (m.title.includes('Threat Cluster')) return m.title.replace('Threat Cluster', '').trim()
    if (m.title.includes('(') && m.title.includes(')')) {
      const match = m.title.match(/\(([^)]+)\)/)
      if (match) return match[1].trim()
    }
    return m.title.trim()
  }
  return 'Bengaluru'
}

export function resolveMarkerScore(m: any): number {
  if (typeof m?.riskScore === 'number' && !isNaN(m.riskScore)) return m.riskScore
  const rawRisk = String(m?.riskLevel || m?.risk || '').toLowerCase()
  if (rawRisk.includes('crit')) return 96
  if (rawRisk.includes('high')) return 78
  if (rawRisk.includes('med') || rawRisk.includes('rev')) return 48
  if (typeof m?.amount === 'number' && m.amount > 50000) return 85
  return 12
}

export function resolveMarkerLevel(m: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (m?.riskLevel && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(m.riskLevel)) return m.riskLevel
  const rawRisk = String(m?.risk || '').toLowerCase()
  if (rawRisk.includes('crit')) return 'CRITICAL'
  if (rawRisk.includes('high')) return 'HIGH'
  if (rawRisk.includes('med') || rawRisk.includes('rev')) return 'MEDIUM'
  const score = resolveMarkerScore(m)
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'
  return 'LOW'
}

export function RealGoogleMap({
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  center = [20.5937, 78.9629],
  zoom = 5,
  height = '520px',
  title = 'Geospatial Location Intelligence Map',
  showControls = true,
  showSearch = true,
  showLayers = true,
  interactiveClick = true,
  className = ''
}: RealGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const markersGroupRef = useRef<any>(null)
  const customPinRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'radar'>('map')
  const [tileError, setTileError] = useState(false)
  const [mapLayer, setMapLayer] = useState<
    'dark_cyber' | 'satellite' | 'street' | 'osm' | 'carto_dark' | 'carto_voyager' | 'carto_positron'
  >('dark_cyber')
  const [quarantineModalOpen, setQuarantineModalOpen] = useState(false)
  const [activeMarker, setActiveMarker] = useState<MapMarkerItem | null>(null)
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')

  useEffect(() => {
    if (selectedMarkerId) {
      const match = markers.find((m) => m.id === selectedMarkerId)
      if (match) {
        setActiveMarker(match)
        if (mapInstanceRef.current && viewMode === 'map') {
          mapInstanceRef.current.flyTo([match.lat, match.lng], 13, { duration: 1.2 })
        }
      }
    }
  }, [selectedMarkerId, markers, viewMode])

  // Filter markers and ensure 100% defined metadata
  const filteredMarkers = useMemo(() => {
    return markers.map((m) => {
      const city = resolveMarkerCity(m)
      const riskScore = resolveMarkerScore(m)
      const riskLevel = resolveMarkerLevel(m)
      return {
        ...m,
        city,
        riskScore,
        riskLevel
      }
    }).filter((m) => {
      if (sourceFilter !== 'ALL' && m.source && m.source !== sourceFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          m.title.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          (m.subtitle && m.subtitle.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [markers, sourceFilter, searchQuery])

  // Tile layer sources (Watermark-free high-definition dark mode and satellite endpoints)
  const tileLayers: Record<string, string> = {
    dark_cyber: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    carto_dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    carto_voyager: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    carto_positron: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    street: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (viewMode !== 'map') return
    let isMounted = true

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      if (!(window as any).L) {
        // Load Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.crossOrigin = ''
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        await new Promise<void>((resolve, reject) => {
          if (document.getElementById('leaflet-js')) {
            const checkL = setInterval(() => {
              if ((window as any).L) {
                clearInterval(checkL)
                resolve()
              }
            }, 50)
            return
          }
          const script = document.createElement('script')
          script.id = 'leaflet-js'
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.crossOrigin = ''
          script.onload = () => resolve()
          script.onerror = () => {
            // If Leaflet script fails to load from CDN, fallback to Cyber Radar Grid automatically
            setViewMode('radar')
            resolve()
          }
          document.body.appendChild(script)
        })
      }

      if (!isMounted || !mapContainerRef.current) return

      const L = (window as any).L
      if (!L) {
        setViewMode('radar')
        return
      }

      leafletRef.current = L

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false
      })

      const targetUrl = tileLayers[mapLayer] || tileLayers.dark_cyber

      const activeTileLayer = L.tileLayer(targetUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map)

      // Listen for tile errors
      activeTileLayer.on('tileerror', () => {
        setTileError(true)
      })

      mapInstanceRef.current = map
      ;(map as any)._activeTileLayer = activeTileLayer

      // Layer Group for markers
      const markerGroup = L.layerGroup().addTo(map)
      markersGroupRef.current = markerGroup

      // Interactive Click listener on map canvas
      if (interactiveClick) {
        map.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6))
          const lng = parseFloat(e.latlng.lng.toFixed(6))
          setClickedCoord({ lat, lng })

          if (customPinRef.current) {
            markerGroup.removeLayer(customPinRef.current)
          }

          const pingIcon = L.divIcon({
            className: 'custom-ping-pin',
            html: `
              <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(184, 245, 94, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 14px; height: 14px; border-radius: 50%; background: #b8f55e; border: 2px solid #071014; box-shadow: 0 0 10px #b8f55e;"></div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })

          const tempMarker = L.marker([lat, lng], { icon: pingIcon }).addTo(markerGroup)
          customPinRef.current = tempMarker
        })
      }

      setMapLoaded(true)
    }

    loadLeaflet().catch(() => {
      setViewMode('radar')
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [viewMode])

  // Switch Layer in Leaflet
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current || !leafletRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current

    if ((map as any)._activeTileLayer) {
      map.removeLayer((map as any)._activeTileLayer)
    }

    const targetUrl = tileLayers[mapLayer] || tileLayers.dark_cyber
    const newLayer = L.tileLayer(targetUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map)

    newLayer.on('tileerror', () => {
      setTileError(true)
    })

    ;(map as any)._activeTileLayer = newLayer
  }, [mapLayer, viewMode])

  // Plot and update markers in Leaflet
  useEffect(() => {
    if (viewMode !== 'map' || !mapLoaded || !mapInstanceRef.current || !markersGroupRef.current || !leafletRef.current) return
    const L = leafletRef.current
    const group = markersGroupRef.current
    group.clearLayers()

    if (clickedCoord && customPinRef.current) {
      customPinRef.current.addTo(group)
    }

    filteredMarkers.forEach((marker) => {
      const isCritical = marker.riskLevel === 'CRITICAL' || marker.riskScore >= 75
      const isHigh = marker.riskLevel === 'HIGH' || (marker.riskScore >= 50 && marker.riskScore < 75)
      const isMedium = marker.riskLevel === 'MEDIUM' || (marker.riskScore >= 25 && marker.riskScore < 50)

      const color = isCritical
        ? '#f43f5e'
        : isHigh
          ? '#f59e0b'
          : isMedium
            ? '#38bdf8'
            : '#b8f55e'

      const markerIcon = L.divIcon({
        className: 'real-map-marker-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isCritical
                ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(244, 63, 94, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #071014;
              border: 2px solid ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 12px ${color};
              color: ${color};
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
            ">
              ${marker.riskScore}
            </div>
            <div style="position: absolute; top: -14px; background: rgba(7, 16, 20, 0.95); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 1px 4px; font-size: 8px; font-weight: bold; color: #fff; white-space: nowrap; pointer-events: none;">
              ${marker.city}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })

      const mapPin = L.marker([marker.lat, marker.lng], { icon: markerIcon }).addTo(group)

      mapPin.on('click', () => {
        setActiveMarker(marker)
        setClickedCoord({ lat: marker.lat, lng: marker.lng })
        if (onSelectMarker) onSelectMarker(marker)
        mapInstanceRef.current.flyTo([marker.lat, marker.lng], 12, { duration: 0.8 })
      })
    })
  }, [filteredMarkers, mapLoaded, viewMode])

  const handleCopyCoord = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFlyTo = (lat: number, lng: number, zoomLevel = 12) => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1 })
    }
  }

  const resetView = () => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1 })
    }
    setActiveMarker(null)
    setClickedCoord(null)
  }

  // Radar Node Coordinates Projection (Map India relative to Center [20.5937, 78.9629])
  const projectToRadar = (lat: number, lng: number) => {
    const centerLat = 20.5937
    const centerLng = 78.9629
    // Range scale: ~14 degrees radius mapped to 42% SVG radius
    const deltaX = (lng - centerLng) * 2.8
    const deltaY = (centerLat - lat) * 2.8
    const x = Math.max(8, Math.min(92, 50 + deltaX))
    const y = Math.max(8, Math.min(92, 50 + deltaY))
    return { x, y }
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#071014] text-white shadow-2xl ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a1718]/90 px-4 py-3 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/20">
            {viewMode === 'radar' ? (
              <Radio className="size-4 animate-pulse text-[#b8f55e]" />
            ) : (
              <Globe className="size-4 animate-spin-slow" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-tight text-white">{title}</h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                {viewMode === 'radar' ? 'CYBER RADAR ENGINE ACTIVE' : 'GEOSPATIAL TILE ENGINE ACTIVE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {viewMode === 'radar'
                ? 'Zero-Dependency Vector Telemetry · 100% Offline Resilient'
                : 'High-Definition Watermark-Free Dark Cyber Canvas + Satellite'}
            </p>
          </div>
        </div>

        {/* Controls: Search, View Mode, Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search city, payee, or coord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-56 rounded-xl border border-white/10 bg-[#071014] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none transition"
              />
            </div>
          )}

          {/* View Mode Toggle: Interactive Map vs Cyber Vector Radar */}
          <div className="flex rounded-xl border border-white/10 bg-[#071014] p-1 text-[11px] font-semibold">
            <button
              onClick={() => {
                setViewMode('map')
                setTileError(false)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-[#b8f55e] text-[#071014] font-bold shadow-md shadow-[#b8f55e]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="size-3.5" />
              <span>Map Tiles</span>
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                viewMode === 'radar'
                  ? 'bg-gradient-to-r from-emerald-400 to-[#b8f55e] text-[#071014] font-bold shadow-md shadow-[#b8f55e]/25'
                  : 'text-[#b8f55e]/80 hover:text-[#b8f55e]'
              }`}
            >
              <Radio className="size-3.5" />
              <span>Cyber Radar (Offline Grid)</span>
            </button>
          </div>

          {showLayers && viewMode === 'map' && (
            <div className="hidden sm:flex rounded-xl border border-white/10 bg-[#071014] p-1 text-[11px] font-semibold overflow-x-auto">
              <button
                onClick={() => setMapLayer('dark_cyber')}
                className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                  mapLayer === 'dark_cyber' || mapLayer === 'carto_dark'
                    ? 'bg-[#b8f55e] text-[#071014] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark Cyber (Clean)
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                  mapLayer === 'satellite'
                    ? 'bg-[#b8f55e] text-[#071014] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapLayer('street')}
                className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                  mapLayer === 'street'
                    ? 'bg-[#b8f55e] text-[#071014] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Roadmap
              </button>
              <button
                onClick={() => setMapLayer('osm')}
                className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                  mapLayer === 'osm'
                    ? 'bg-[#b8f55e] text-[#071014] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenStreetMap
              </button>
            </div>
          )}

          {showControls && (
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              {viewMode === 'map' && (
                <>
                  <button
                    onClick={() => mapInstanceRef.current?.zoomIn()}
                    className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="size-3.5" />
                  </button>
                  <button
                    onClick={() => mapInstanceRef.current?.zoomOut()}
                    className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="size-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={resetView}
                className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                title="Reset View"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Network Alert / Tile Failure Graceful Warning */}
      {tileError && viewMode === 'map' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span>Map tile service throttled or blocked by network/adblocker. Switch to OpenStreetMap or Vector Radar:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMapLayer('osm')
                setTileError(false)
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px]"
            >
              Try OpenStreetMap
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className="px-2.5 py-1 rounded-lg bg-[#b8f55e] text-[#071014] font-bold text-[11px]"
            >
              Switch to Cyber Radar
            </button>
          </div>
        </div>
      )}

      {/* Mode 1: Leaflet Interactive Map View */}
      {viewMode === 'map' && (
        <div
          ref={mapContainerRef}
          style={{ height, width: '100%' }}
          className="relative z-0 bg-[#06101D] cursor-crosshair"
        />
      )}

      {/* Mode 2: High-Tech Vector Cyber Radar Grid (100% Offline / No Tile Dependency) */}
      {viewMode === 'radar' && (
        <div
          style={{ height, width: '100%' }}
          className="relative z-0 bg-gradient-to-b from-[#050e14] via-[#071418] to-[#040a0f] overflow-hidden select-none"
        >
          {/* Cyber Radial Grid Background Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <defs>
              <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#b8f55e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#071014" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Concentric distance rings */}
            <circle cx="50%" cy="50%" r="12%" fill="none" stroke="#b8f55e" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            <circle cx="50%" cy="50%" r="24%" fill="none" stroke="#b8f55e" strokeWidth="1" opacity="0.4" />
            <circle cx="50%" cy="50%" r="36%" fill="none" stroke="#b8f55e" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <circle cx="50%" cy="50%" r="46%" fill="none" stroke="#b8f55e" strokeWidth="1.5" opacity="0.6" />

            {/* Crosshair lines */}
            <line x1="50%" y1="2%" x2="50%" y2="98%" stroke="#b8f55e" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
            <line x1="2%" y1="50%" x2="98%" y2="50%" stroke="#b8f55e" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
            <line x1="15%" y1="15%" x2="85%" y2="85%" stroke="#b8f55e" strokeWidth="0.75" strokeDasharray="2 4" opacity="0.2" />
            <line x1="15%" y1="85%" x2="85%" y2="15%" stroke="#b8f55e" strokeWidth="0.75" strokeDasharray="2 4" opacity="0.2" />
          </svg>

          {/* Animated Sweeping Radar Beam */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, rgba(184, 245, 94, 0.18) 0deg, rgba(184, 245, 94, 0.05) 45deg, transparent 70deg)',
              animation: 'spin 6s linear infinite'
            }}
          />

          {/* Compass Cardinals */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#b8f55e]/70">000° NORTH</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#b8f55e]/70">180° SOUTH</div>
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-mono font-bold text-[#b8f55e]/70">270° WEST</div>
          <div className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-mono font-bold text-[#b8f55e]/70">090° EAST</div>

          {/* Center Point - India Strategic Command Desk */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            <div className="size-3 rounded-full bg-[#b8f55e] shadow-[0_0_12px_#b8f55e]" />
            <span className="text-[9px] font-mono text-[#b8f55e] mt-1 bg-black/70 px-1 rounded border border-[#b8f55e]/30">IN-HQ (78.9°E, 20.5°N)</span>
          </div>

          {/* Major Indian Hub Anchor Nodes */}
          {Object.entries(CITY_COORDINATES).slice(0, 8).map(([city, coords]) => {
            const { x, y } = projectToRadar(coords[0], coords[1])
            const isHubballi = city.toLowerCase().includes('hubli') || city.toLowerCase().includes('hubballi')
            return (
              <div
                key={city}
                onClick={() => {
                  setClickedCoord({ lat: coords[0], lng: coords[1] })
                }}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
              >
                <div className={`size-2 rounded-full transition-transform group-hover:scale-150 ${isHubballi ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-400'}`} />
                <span className={`text-[8px] font-mono px-1 rounded opacity-75 group-hover:opacity-100 ${isHubballi ? 'text-cyan-300 font-bold bg-[#071014] border border-cyan-500/40' : 'text-slate-400 bg-black/60'}`}>
                  {city}
                </span>
              </div>
            )
          })}

          {/* Interactive Plot of Fraud & Telemetry Markers */}
          {filteredMarkers.map((marker) => {
            const { x, y } = projectToRadar(marker.lat, marker.lng)
            const isCritical = marker.riskLevel === 'CRITICAL' || marker.riskScore >= 75
            const isHigh = marker.riskLevel === 'HIGH' || (marker.riskScore >= 50 && marker.riskScore < 75)
            const isMedium = marker.riskLevel === 'MEDIUM' || (marker.riskScore >= 25 && marker.riskScore < 50)
            const color = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : isMedium ? '#38bdf8' : '#b8f55e'

            return (
              <div
                key={marker.id}
                onClick={() => {
                  setActiveMarker(marker)
                  setClickedCoord({ lat: marker.lat, lng: marker.lng })
                  if (onSelectMarker) onSelectMarker(marker)
                }}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              >
                {/* Threat Pulse Animation */}
                {isCritical && (
                  <div
                    className="absolute inset-0 -m-2 rounded-full animate-ping pointer-events-none"
                    style={{ backgroundColor: 'rgba(244, 63, 94, 0.4)' }}
                  />
                )}
                <div
                  style={{
                    borderColor: color,
                    boxShadow: `0 0 12px ${color}`,
                    color: color
                  }}
                  className="size-7 rounded-full bg-[#071014] border-2 flex items-center justify-center font-mono text-[10px] font-extrabold group-hover:scale-125 transition-transform"
                >
                  {marker.riskScore}
                </div>
                {/* Marker City & Title Badge */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-[#071014]/95 border border-white/20 rounded px-1.5 py-0.5 text-[8px] font-mono text-white whitespace-nowrap shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                  <span className="font-bold" style={{ color }}>{marker.riskLevel}:</span> {marker.title} ({marker.city})
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick City Teleport Floating Bar */}
      <div className="absolute left-4 bottom-4 z-20 hidden md:flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#071014]/90 p-1.5 backdrop-blur-md text-[11px] shadow-xl">
        <span className="px-2 text-slate-400 font-mono text-[10px]">Jump to City:</span>
        {Object.entries(CITY_COORDINATES).slice(0, 6).map(([cityName, coords]) => (
          <button
            key={cityName}
            onClick={() => {
              if (viewMode === 'map') {
                handleFlyTo(coords[0], coords[1], 12)
              } else {
                setClickedCoord({ lat: coords[0], lng: coords[1] })
              }
            }}
            className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-slate-300 hover:border-[#b8f55e]/40 hover:bg-[#b8f55e]/10 hover:text-[#b8f55e] transition font-medium"
          >
            {cityName}
          </button>
        ))}
      </div>

      {/* Floating Active Coordinate Inspector & Telemetry Overlay */}
      <AnimatePresence>
        {(clickedCoord || activeMarker) && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute right-4 top-16 z-20 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#071014]/95 p-4 shadow-2xl backdrop-blur-xl space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`grid size-8 place-items-center rounded-xl ${
                    activeMarker?.riskLevel === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : activeMarker?.riskLevel === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/40'
                  }`}
                >
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {activeMarker ? activeMarker.title : 'Clicked Point Inspection'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeMarker ? `${activeMarker.city}, ${activeMarker.country || 'India'}` : 'Interactive GPS Coordinate Probe'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveMarker(null)
                  setClickedCoord(null)
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Exact GPS Coordinates Pointing Display */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                  <Crosshair className="size-3 text-[#b8f55e]" /> Point Coordinates
                </span>
                <button
                  onClick={() =>
                    handleCopyCoord(
                      activeMarker ? activeMarker.lat : clickedCoord!.lat,
                      activeMarker ? activeMarker.lng : clickedCoord!.lng
                    )
                  }
                  className="flex items-center gap-1 text-[10px] font-mono text-[#b8f55e] hover:underline"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? 'Copied' : 'Copy Lat/Lng'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
                <div className="bg-[#071014] px-2.5 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[9px] text-slate-500 block">LATITUDE</span>
                  <span className="text-white">
                    {activeMarker ? activeMarker.lat.toFixed(6) : clickedCoord?.lat.toFixed(6)}° N
                  </span>
                </div>
                <div className="bg-[#071014] px-2.5 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[9px] text-slate-500 block">LONGITUDE</span>
                  <span className="text-white">
                    {activeMarker ? activeMarker.lng.toFixed(6) : clickedCoord?.lng.toFixed(6)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Active Marker Details */}
            {activeMarker ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                    <span className="text-[10px] text-slate-400 block">Telemetry Source</span>
                    <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
                      {activeMarker.source === 'CARD' ? (
                        <CreditCard className="size-3.5 text-cyan-400" />
                      ) : activeMarker.source === 'UPI' ? (
                        <Send className="size-3.5 text-[#b8f55e]" />
                      ) : (
                        <Smartphone className="size-3.5 text-amber-400" />
                      )}
                      {activeMarker.source}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                    <span className="text-[10px] text-slate-400 block">AI Risk Score</span>
                    <span
                      className={`font-mono font-bold text-sm block mt-0.5 ${
                        activeMarker.riskScore >= 75
                          ? 'text-rose-400'
                          : activeMarker.riskScore >= 45
                            ? 'text-amber-400'
                            : 'text-[#b8f55e]'
                      }`}
                    >
                      {activeMarker.riskScore} / 100 ({activeMarker.riskLevel})
                    </span>
                  </div>
                </div>

                {activeMarker.amount && (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Transaction Amount:</span>
                    <span className="font-mono font-bold text-white">₹{activeMarker.amount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {activeMarker.anomalyReason && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-2 text-rose-200 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="size-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{activeMarker.anomalyReason}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Click any telemetry pin or city marker to view real-time risk classification, haversine velocity, and anomaly reason.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              {activeMarker && (activeMarker.riskLevel === 'CRITICAL' || activeMarker.riskScore >= 75) && (
                <button
                  onClick={() => setQuarantineModalOpen(true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-bold text-white transition shadow-lg shadow-rose-600/25 flex items-center gap-1"
                >
                  <ShieldAlert className="size-3.5" />
                  Quarantine Node
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threat Node Quarantine Action Modal */}
      <SecurityActionModal
        isOpen={quarantineModalOpen}
        onClose={() => setQuarantineModalOpen(false)}
        type="node_quarantine"
        data={{
          entityTitle: activeMarker?.title,
          location: activeMarker?.city,
          amount: activeMarker?.amount,
          riskScore: activeMarker?.riskScore,
          reason: activeMarker?.anomalyReason || 'Geospatial syndicate cluster or anomalous transaction node'
        }}
      />
    </div>
  )
}

export default RealGoogleMap
