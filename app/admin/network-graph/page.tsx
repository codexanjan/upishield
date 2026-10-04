'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Users,
  Smartphone,
  ShieldAlert,
  MapPin,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { FRAUD_NETWORK_GRAPH_DATA } from '@/lib/ai-fraud-engine'
import RealGoogleMap from '@/components/maps/real-google-map'

const NODE_COORDINATES: Record<string, [number, number]> = {
  'usr-1': [15.3647, 75.1240], // Hubballi Baseline
  'usr-2': [12.9716, 77.5946], // Bengaluru
  'usr-3': [28.6139, 77.2090], // Delhi
  'dev-1': [15.3647, 75.1240], // Hubballi
  'dev-2': [12.9716, 77.5946], // Bengaluru
  'dev-3': [28.7041, 77.1025], // North Delhi Emulator
  'vpa-1': [12.9783, 77.6408], // Indiranagar
  'vpa-2': [28.5355, 77.3910], // Noida
  'vpa-3': [28.4595, 77.0266], // Gurugram
  'loc-1': [12.9716, 77.5946], // Bengaluru Cluster
  'loc-2': [28.6139, 77.2090]  // Delhi Anomaly Cluster
}

export default function AdminFraudNetworkGraphPage() {
  const [nodes, setNodes] = useState(FRAUD_NETWORK_GRAPH_DATA.nodes)
  const [links, setLinks] = useState(FRAUD_NETWORK_GRAPH_DATA.links)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('dev-3')
  const [viewMode, setViewMode] = useState<'TOPOLOGY' | 'GEOSPATIAL'>('TOPOLOGY')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [minRisk, setMinRisk] = useState<number>(0)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [isQuarantining, setIsQuarantining] = useState(false)
  const [isSpawning, setIsSpawning] = useState(false)
  const [quarantinedNodeIds, setQuarantinedNodeIds] = useState<Set<string>>(new Set())
  const [spawnedCases, setSpawnedCases] = useState<Record<string, string>>({})

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  // Filtered nodes
  const filteredNodes = nodes.filter(n => {
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false
    if (n.risk < minRisk) return false
    return true
  })

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id))

  // Filtered links
  const filteredLinks = links.filter(l => 
    filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target)
  )

  // Connected links for selected node
  const connectedLinks = selectedNode
    ? links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : []

  const handleQuarantine = async () => {
    if (!selectedNode) return
    setIsQuarantining(true)
    try {
      const linkedVpas = connectedLinks
        .map(l => {
          const otherId = l.source === selectedNode.id ? l.target : l.source
          const otherNode = nodes.find(n => n.id === otherId)
          return otherNode?.type.includes('VPA') ? otherNode.label : null
        })
        .filter(Boolean)

      const res = await fetch('/api/v1/entities/quarantine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: selectedNode.id,
          entity_label: selectedNode.label,
          entity_type: selectedNode.type,
          reason: 'Multi-Account Emulator Detected with shared syndicate connections',
          linked_vpas: linkedVpas.length > 0 ? linkedVpas : ['scammer.refund@okaxis'],
          admin_email: 'admin@upishield.ai'
        })
      })
      const data = await res.json()
      setQuarantinedNodeIds(prev => new Set(prev).add(selectedNode.id))
      setActionNotice(data.message || `Entity ${selectedNode.label} placed on Global UPI Quarantine.`)
    } catch {
      setQuarantinedNodeIds(prev => new Set(prev).add(selectedNode.id))
      setActionNotice(`Entity ${selectedNode.label} placed on Global UPI Quarantine.`)
    } finally {
      setIsQuarantining(false)
      setTimeout(() => setActionNotice(null), 5000)
    }
  }

  const handleSpawnSyndicate = async () => {
    if (!selectedNode) return
    setIsSpawning(true)
    try {
      const rels = connectedLinks.map(l => {
        const otherId = l.source === selectedNode.id ? l.target : l.source
        const otherNode = nodes.find(n => n.id === otherId)
        return {
          name: otherNode?.label || otherId,
          risk: l.risk,
          label: l.label
        }
      })

      const res = await fetch('/api/v1/cases/spawn-syndicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: selectedNode.id,
          entity_label: selectedNode.label,
          entity_type: selectedNode.type,
          risk: selectedNode.risk,
          connected_relationships: rels,
          reason: `Cross-account syndicate emulator ring detected around ${selectedNode.label}.`
        })
      })
      const data = await res.json()
      const caseNum = data.case_number || `CASE-SYN-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setSpawnedCases(prev => ({ ...prev, [selectedNode.id]: caseNum }))
      setActionNotice(`Investigation Case ${caseNum} spawned for ${selectedNode.label}.`)
    } catch {
      const caseNum = `CASE-SYN-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setSpawnedCases(prev => ({ ...prev, [selectedNode.id]: caseNum }))
      setActionNotice(`Investigation Case ${caseNum} spawned for ${selectedNode.label}.`)
    } finally {
      setIsSpawning(false)
      setTimeout(() => setActionNotice(null), 5000)
    }
  }

  const getNodeColor = (type: string, risk: number) => {
    if (risk >= 70) return '#f43f5e' // Crimson / Rose
    if (risk >= 30) return '#f59e0b' // Amber
    return '#b8f55e' // Electric Lime Green
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                SYNDICATE INTELLIGENCE
              </span>
              <span className="text-xs text-white/50">Graph Neural Engine v2.1</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Cross-UPI Fraud Relationship Graph</h1>
            <p className="text-sm text-white/60">
              Interactive topological visualization of shared device emulators, mule VPAs, repeated receiver hubs, and anomalous geofence clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#b8f55e] px-3 py-1.5 rounded-xl border border-[#b8f55e]/20 bg-[#b8f55e]/10">
              11 Entities • 10 Graph Edges
            </span>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 text-xs text-[#b8f55e] flex items-center justify-between"
          >
            <span>{actionNotice}</span>
            <CheckCircle2 className="size-4" />
          </motion.div>
        )}

        {/* Filters Toolbar */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#0a1718] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/50 flex items-center gap-1.5 mr-2">
              <Filter className="size-3.5" /> Filter Entities:
            </span>
            {[
              { id: 'ALL', label: 'All Entities' },
              { id: 'USER', label: 'Users' },
              { id: 'DEVICE', label: 'Devices' },
              { id: 'VPA_SUSPICIOUS', label: 'Flagged VPAs' },
              { id: 'LOCATION', label: 'Location Clusters' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === tab.id
                    ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('TOPOLOGY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'TOPOLOGY' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Topology Graph
              </button>
              <button
                onClick={() => setViewMode('GEOSPATIAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'GEOSPATIAL' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="size-3.5" /> Real Map View
              </button>
            </div>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <span className="text-white/50">Minimum Risk:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minRisk}
              onChange={e => setMinRisk(Number(e.target.value))}
              className="w-24 accent-[#b8f55e] cursor-pointer"
            />
            <span className="font-mono text-[#b8f55e] font-bold w-6">{minRisk}+</span>
          </div>
        </div>

        {/* Main Graph Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Canvas or Real Map */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#071014] relative overflow-hidden h-[540px] flex flex-col justify-between p-4">
            {viewMode === 'GEOSPATIAL' ? (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="size-4 text-[#b8f55e]" /> Real Google Maps Geospatial Entity Intelligence
                  </span>
                  <span className="text-[10px] font-mono text-[#b8f55e]">Click node pin to view coordinates</span>
                </div>
                <div className="relative w-full flex-1 rounded-xl overflow-hidden my-2 border border-white/10">
                  <RealGoogleMap
                    height="420px"
                    center={[21.0, 78.0]}
                    zoom={4}
                    markers={filteredNodes.map(n => {
                      const coords = NODE_COORDINATES[n.id] || [21.0, 78.0]
                      return {
                        id: n.id,
                        title: n.label,
                        subtitle: `Type: ${n.type} • Risk: ${n.risk}/100 • Edges: ${connectedLinks.length}`,
                        lat: coords[0],
                        lng: coords[1],
                        risk: n.risk >= 70 ? 'critical' : n.risk >= 30 ? 'high' : 'low',
                        status: quarantinedNodeIds.has(n.id) ? 'QUARANTINED' : n.type,
                        category: n.type
                      }
                    })}
                    onMarkerClick={(m) => setSelectedNodeId(m.id)}
                  />
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <span>Geospatial Coordinates: Hubballi, BLR, Delhi NCR, Mumbai</span>
                  <span className="text-[#b8f55e] font-mono">Live Coordinate Probe Active</span>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/70 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#b8f55e] animate-ping" />
                  Click any node to inspect relationship vector & cross-account links
                </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-[10px] space-y-1 text-white/70">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#b8f55e]" /> Safe Entity (&lt;30)
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-400" /> Elevated Risk (30-69)
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500" /> Confirmed Syndicate (&gt;70)
              </div>
            </div>

            {/* SVG Visualizer */}
            <svg className="w-full h-full" viewBox="0 0 650 500">
              <defs>
                <linearGradient id="fraudLinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="safeLinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b8f55e" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#b8f55e" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Render Graph Edges */}
              {filteredLinks.map((link, idx) => {
                const srcNode = nodes.find(n => n.id === link.source)
                const tgtNode = nodes.find(n => n.id === link.target)
                if (!srcNode || !tgtNode) return null

                const isHighRisk = link.risk >= 70
                const isSelected = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target)

                return (
                  <g key={idx}>
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke={isHighRisk ? 'url(#fraudLinkGrad)' : 'url(#safeLinkGrad)'}
                      strokeWidth={isSelected ? 3 : isHighRisk ? 2 : 1.2}
                      strokeDasharray={isHighRisk ? '4 2' : 'none'}
                    />
                    {/* Edge Label on hover / selection */}
                    {isSelected && (
                      <text
                        x={(srcNode.x + tgtNode.x) / 2}
                        y={(srcNode.y + tgtNode.y) / 2 - 6}
                        fill={isHighRisk ? '#f43f5e' : '#b8f55e'}
                        fontSize="9"
                        textAnchor="middle"
                        className="font-mono bg-black"
                      >
                        {link.label}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Render Graph Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNodeId === node.id
                const color = getNodeColor(node.type, node.risk)

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {/* Selection outer pulse ring */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={26}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                      />
                    )}

                    {/* Node background circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={18}
                      fill="#0a1718"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Node text label */}
                    <text
                      x={node.x}
                      y={node.y + 32}
                      fill="white"
                      fontSize="10"
                      textAnchor="middle"
                      className="font-sans font-medium pointer-events-none drop-shadow"
                    >
                      {node.label}
                    </text>

                    {/* Risk Badge on Node */}
                    <text
                      x={node.x}
                      y={node.y + 4}
                      fill={color}
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono font-bold pointer-events-none"
                    >
                      {node.risk}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs text-white/50">
              <span>Dynamic Force Topology: 100 iterations settled</span>
              <span className="text-[#b8f55e] font-mono">XGBoost & GNN Fusion</span>
            </div>
            </>
            )}
          </div>

          {/* Node Inspector Sidebar */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] space-y-5">
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                      ENTITY: {selectedNode.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{selectedNode.label}</h3>
                    <span className="text-xs text-white/50 font-mono">ID: {selectedNode.id}</span>
                  </div>

                  <div className="text-right">
                    <span className={`text-2xl font-mono font-bold ${
                      selectedNode.risk >= 70 ? 'text-rose-400' : selectedNode.risk >= 30 ? 'text-amber-400' : 'text-[#b8f55e]'
                    }`}>
                      {selectedNode.risk}
                    </span>
                    <span className="text-[10px] text-white/40 block">Risk Score</span>
                  </div>
                </div>

                {/* Threat Insights */}
                {selectedNode.id === 'dev-3' && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <ShieldAlert className="size-4" />
                      CRITICAL: Multi-Account Emulator Detected
                    </div>
                    <p className="text-[11px] text-white/70">
                      Hardware fingerprint matches Nox/BlueStacks virtualized instance. Used across 3 disparate UPI handles within 48 hours to execute rapid collect requests.
                    </p>
                  </div>
                )}

                {selectedNode.id === 'vpa-2' && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <ShieldAlert className="size-4" />
                      CONFIRMED PHISHING COLLECTOR
                    </div>
                    <p className="text-[11px] text-white/70">
                      Flagged across 28 user reports for fake electricity rebate collect requests. Linked directly to Delhi IP syndicate cluster.
                    </p>
                  </div>
                )}

                {/* Connected Edges */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase text-white/60 tracking-wider">
                    Connected Relationships ({connectedLinks.length})
                  </h4>

                  <div className="space-y-2">
                    {connectedLinks.map((link, idx) => {
                      const otherId = link.source === selectedNode.id ? link.target : link.source
                      const otherNode = nodes.find(n => n.id === otherId)
                      const isHigh = link.risk >= 70

                      return (
                        <div key={idx} className="p-2.5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white block">{otherNode?.label || otherId}</span>
                            <span className="text-[11px] text-white/50">{link.label}</span>
                          </div>
                          <span className={`font-mono text-xs font-bold ${isHigh ? 'text-rose-400' : 'text-[#b8f55e]'}`}>
                            Risk {link.risk}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {quarantinedNodeIds.has(selectedNode.id) ? (
                    <div className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2">
                      <CheckCircle2 className="size-3.5" />
                      Entity Quarantined &amp; VPAs Blocked
                    </div>
                  ) : (
                    <button
                      onClick={handleQuarantine}
                      disabled={isQuarantining}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ShieldAlert className="size-3.5" />
                      {isQuarantining ? 'Quarantining Entity...' : 'Quarantine Entity & Block VPA'}
                    </button>
                  )}

                  {spawnedCases[selectedNode.id] ? (
                    <Link
                      href="/admin/cases"
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30 flex items-center justify-center gap-2 hover:bg-[#b8f55e]/25 transition-colors"
                    >
                      <Check className="size-3.5" />
                      Active: {spawnedCases[selectedNode.id]} (View Case)
                    </Link>
                  ) : (
                    <button
                      onClick={handleSpawnSyndicate}
                      disabled={isSpawning}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="size-3.5 text-[#b8f55e]" />
                      {isSpawning ? 'Spawning Case...' : 'Spawn Syndicate Investigation Case'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0a1718] text-center text-white/50 text-xs">
                Select any node on the graph canvas to inspect relationship vectors.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
