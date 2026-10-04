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
  Radio
} from 'lucide-react'

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

export function RealGoogleMap({
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  center = [20.5937, 78.9629], // Center of India
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
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'street' | 'terrain'>('dark')
  const [activeMarker, setActiveMarker] = useState<MapMarkerItem | null>(null)
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')

  // Sync external selectedMarkerId with internal state
  useEffect(() => {
    if (selectedMarkerId) {
      const match = markers.find((m) => m.id === selectedMarkerId)
      if (match) {
        setActiveMarker(match)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.lat, match.lng], 13, { duration: 1.2 })
        }
      }
    }
  }, [selectedMarkerId, markers])

  // Filter markers
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (sourceFilter !== 'ALL' && m.source !== sourceFilter) return false
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

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true

    // Dynamically inject Leaflet CSS and JS
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      if (!(window as any).L) {
        // Load CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.crossOrigin = ''
          document.head.appendChild(link)
        }

        // Load JS
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
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      if (!isMounted || !mapContainerRef.current) return

      const L = (window as any).L
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

      // Layer providers:
      // Dark Matter by CartoDB (Google dark styling for cybersecurity)
      // Google Satellite via Google Maps tile servers
      // Google Maps Roadmap
      const tileLayers: Record<string, string> = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        street: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
      }

      const activeTileLayer = L.tileLayer(tileLayers[mapLayer], {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map)

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

          // Add a pulsating temporary pin
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

    loadLeaflet().catch(console.error)

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Switch Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current

    if ((map as any)._activeTileLayer) {
      map.removeLayer((map as any)._activeTileLayer)
    }

    const tileLayers: Record<string, string> = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      street: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
    }

    const newLayer = L.tileLayer(tileLayers[mapLayer], {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map)

    ;(map as any)._activeTileLayer = newLayer
  }, [mapLayer])

  // Plot and update markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersGroupRef.current || !leafletRef.current) return
    const L = leafletRef.current
    const group = markersGroupRef.current
    group.clearLayers()

    // Re-add custom click pin if exists
    if (clickedCoord && customPinRef.current) {
      customPinRef.current.addTo(group)
    }

    filteredMarkers.forEach((marker) => {
      const isCritical = marker.riskLevel === 'CRITICAL' || marker.riskScore >= 75
      const isHigh = marker.riskLevel === 'HIGH' || (marker.riskScore >= 50 && marker.riskScore < 75)
      const isMedium = marker.riskLevel === 'MEDIUM' || (marker.riskScore >= 25 && marker.riskScore < 50)
      const isSafe = !isCritical && !isHigh && !isMedium

      const color = isCritical
        ? '#f43f5e' // Rose red
        : isHigh
        ? '#f59e0b' // Amber
        : isMedium
        ? '#38bdf8' // Cyan
        : '#b8f55e' // Neon Green

      const pulseColor = isCritical
        ? 'rgba(244, 63, 94, 0.45)'
        : isHigh
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(184, 245, 94, 0.35)'

      const markerIcon = L.divIcon({
        className: 'real-map-marker-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${pulseColor}; animation: pulse 2s infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #071014; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color};">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
            </div>
            ${
              marker.amount
                ? `<div style="position: absolute; top: -14px; background: rgba(7, 16, 20, 0.85); color: ${color}; font-size: 9px; font-weight: bold; font-family: monospace; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">₹${marker.amount >= 100000 ? `${(marker.amount / 100000).toFixed(1)}L` : marker.amount.toLocaleString('en-IN')}</div>`
                : ''
            }
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
  }, [filteredMarkers, mapLoaded])

  const handleCopyCoord = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFlyTo = (lat: number, lng: number, zoomLevel = 12) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1 })
    }
  }

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1 })
      setActiveMarker(null)
      setClickedCoord(null)
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#071014] text-white shadow-2xl ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a1718]/90 px-4 py-3 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/20">
            <Globe className="size-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-tight text-white">{title}</h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                REAL GOOGLE MAPS ENGINE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Live Coordinate Pointing · Click anywhere or point pin to inspect GPS telemetry
            </p>
          </div>
        </div>

        {/* Right side toggles: Search, Layers, Filters */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search city, payee, or coord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-xl border border-white/10 bg-[#071014] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none transition"
              />
            </div>
          )}

          {showLayers && (
            <div className="flex rounded-xl border border-white/10 bg-[#071014] p-1 text-[11px] font-semibold">
              <button
                onClick={() => setMapLayer('dark')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  mapLayer === 'dark' ? 'bg-[#b8f55e] text-[#071014] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark Cyber
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  mapLayer === 'satellite' ? 'bg-[#b8f55e] text-[#071014] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapLayer('street')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  mapLayer === 'street' ? 'bg-[#b8f55e] text-[#071014] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Roadmap
              </button>
            </div>
          )}

          {showControls && (
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
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

      {/* Main Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="relative z-0 bg-[#06101D] cursor-crosshair"
      />

      {/* Quick City Teleport Floating Bar */}
      <div className="absolute left-4 bottom-4 z-20 hidden md:flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#071014]/90 p-1.5 backdrop-blur-md text-[11px] shadow-xl">
        <span className="px-2 text-slate-400 font-mono text-[10px]">Jump to City:</span>
        {Object.entries(CITY_COORDINATES).slice(0, 6).map(([cityName, coords]) => (
          <button
            key={cityName}
            onClick={() => handleFlyTo(coords[0], coords[1], 12)}
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
                      {activeMarker.riskScore}/100 [{activeMarker.riskLevel}]
                    </span>
                  </div>
                </div>

                {activeMarker.amount !== undefined && (
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2">
                    <span className="text-slate-400">Transaction Volume</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ₹{activeMarker.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {activeMarker.anomalyReason && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <AlertTriangle className="size-3.5 text-rose-400" />
                      Risk Driver Flagged
                    </div>
                    {activeMarker.anomalyReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-slate-300 space-y-1">
                <p className="text-[11px] text-slate-400">
                  Target coordinate selected on real map. Distance to Bengaluru HQ:{' '}
                  <strong className="text-white font-mono">
                    {calculateHaversineDistanceKm(clickedCoord!.lat, clickedCoord!.lng, 12.9716, 77.5946)} km
                  </strong>
                </p>
              </div>
            )}

            {/* External Google Maps Link */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <a
                href={`https://www.google.com/maps?q=${
                  activeMarker ? activeMarker.lat : clickedCoord!.lat
                },${activeMarker ? activeMarker.lng : clickedCoord!.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#b8f55e]/40 hover:bg-[#b8f55e]/10 hover:text-[#b8f55e] transition"
              >
                <ExternalLink className="size-3.5" />
                Open in Google Maps
              </a>

              {activeMarker && (
                <button
                  onClick={() => alert(`Initiating quarantine sequence on entity: ${activeMarker.title}`)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-bold text-white transition shadow-lg shadow-rose-600/25"
                >
                  Quarantine Node
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RealGoogleMap

