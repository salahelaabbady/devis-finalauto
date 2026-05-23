import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  Settings, 
  Terminal as TerminalIcon, 
  Activity, 
  Shield, 
  Mail, 
  Phone, 
  Globe, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  FileSpreadsheet,
  Shuffle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
}

interface Stats {
  total: number;
  success: number;
  errors: number;
  startTime: number | null;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [domain, setDomain] = useState("https://YOUR-DOMAIN.netlify.app/");
  const [proxies, setProxies] = useState("");
  const [intervalTime, setIntervalTime] = useState(5); // seconds
  const [useHumanTiming, setUseHumanTiming] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, errors: 0, startTime: null });
  
  // Proxy & Data State
  const [activeMode, setActiveMode] = useState<"random" | "custom">("random");
  const [customLeads, setCustomLeads] = useState<any[]>([]);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);
  const [blacklistedProxies, setBlacklistedProxies] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [useIproyalRotation, setUseIproyalRotation] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const leadIndexRef = useRef(0);
  const proxyIndexRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    leadIndexRef.current = currentLeadIndex;
  }, [currentLeadIndex]);

  useEffect(() => {
    proxyIndexRef.current = currentProxyIndex;
  }, [currentProxyIndex]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const executeTask = async () => {
    if (!isRunningRef.current) return;

    const proxyList = proxies.split("\n").filter(p => p.trim());
    const availableProxies = proxyList.filter(p => !blacklistedProxies.has(p));
    
    if (proxyList.length > 0 && availableProxies.length === 0) {
      addLog("All proxies are blacklisted! Stopping automation.", "error");
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsRunning(false);
      isRunningRef.current = false;
      return;
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;

    // Select lead data
    let userData = null;
    if (activeMode === "custom" && customLeads.length > 0) {
      const idx = leadIndexRef.current;
      userData = customLeads[idx % customLeads.length];
      setCurrentLeadIndex(prev => (prev + 1));
      
      if (idx >= customLeads.length - 1) {
        addLog("Reached end of custom lead list. Looping...", "info");
      }
    }

    while (attempt < MAX_RETRIES && !success && isRunningRef.current) {
      let selectedProxy: string | null = null;
      let originalProxy: string | null = null;
      if (useProxy && proxyList.length > 0) {
        // Sequential rotation skipping blacklisted
        let foundIdx = -1;
        for (let i = 0; i < proxyList.length; i++) {
          const checkIdx = (proxyIndexRef.current + i) % proxyList.length;
          if (!blacklistedProxies.has(proxyList[checkIdx])) {
            foundIdx = checkIdx;
            break;
          }
        }

        if (foundIdx === -1) break; // Should be covered by above check but for safety

        selectedProxy = proxyList[foundIdx];
        setCurrentProxyIndex(foundIdx + 1);
        originalProxy = selectedProxy; // capture before mutation

        // IPRoyal Dynamic Session Injection
        if (useIproyalRotation && selectedProxy.includes("@")) {
          const sessionId = Math.random().toString(36).substring(2, 10);
          const [auth, host] = selectedProxy.split("@");
          if (auth.includes(":")) {
            const [user, pass] = auth.split(":");
            // Added _country-fr for French IPs
            selectedProxy = `${user}_session-${sessionId}_country-fr:${pass}@${host}`;
          }
        }
      }

      try {
        const response = await fetch("/api/send-devis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            domain, 
            proxy: useProxy && selectedProxy ? selectedProxy : null,
            userData 
          }),
        });

        const result = await response.json();

        if (result.success) {
          setStats(prev => ({ ...prev, total: prev.total + 1, success: prev.success + 1 }));
          addLog(`[${result.type || "unknown"}] Sent to ${result.email}`, "success");
          success = true;
        } else {
          // If proxy error specifically, blacklist it
          if (selectedProxy && (result.error.includes("proxy") || result.error.includes("ECONN") || result.error.includes("ETIMEDOUT"))) {
            addLog(`Proxy failed: ${result.error}. Blacklisting...`, "error");
            if (originalProxy) {
              setBlacklistedProxies(prev => new Set([...prev, originalProxy]));
            }
          }
          throw new Error(result.error);
        }
      } catch (err: any) {
        attempt++;
        if (attempt < MAX_RETRIES && isRunningRef.current) {
          addLog(`Attempt ${attempt} failed. Retrying with next proxy...`, "info");
          // Slight delay before retry
          await new Promise(r => setTimeout(r, 1000));
        } else {
          setStats(prev => ({ ...prev, total: prev.total + 1, errors: prev.errors + 1 }));
          addLog(`Failed after ${attempt} attempts: ${err.message}`, "error");
        }
      }
    }

    // Schedule next run with variability if enabled
    if (isRunningRef.current) {
      let delay = intervalTime * 1000;
      if (useHumanTiming) {
        // Add random jitter between 0% and 50% of the base interval
        const jitter = Math.random() * (delay * 0.5);
        // Occasionally pause longer (simulating a "break")
        const breakPause = Math.random() > 0.95 ? (Math.random() * 5000 + 2000) : 0;
        delay = Math.floor(delay + jitter + breakPause);
      }
      timerRef.current = setTimeout(executeTask, delay);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ("files" in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          setCustomLeads(jsonData);
          setActiveMode("custom");
          setCurrentLeadIndex(0);
          addLog(`Imported ${jsonData.length} leads from ${file?.name}`, "info");
        } else {
          addLog("File is empty or invalid format", "error");
        }
      } catch (err) {
        addLog("Error parsing file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    setIsDragOver(false);
  };

  const toggleAutomation = () => {
    if (isRunning) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsRunning(false);
      isRunningRef.current = false;
      addLog("Automation stopped", "info");
    } else {
      setIsRunning(true);
      isRunningRef.current = true;
      setStats(prev => ({ ...prev, startTime: prev.startTime || Date.now() }));
      addLog("Starting human-emulated sequence...", "info");
      
      executeTask();
    }
  };

  const clearLogs = () => setLogs([]);

  const formatDuration = () => {
    if (!stats.startTime) return "00:00:00";
    const diff = Math.floor((Date.now() - stats.startTime) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, "0");
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
    const s = (diff % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            Devis Automator
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Lead Generation Automation & Monitoring Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Uptime</span>
            <span className="text-sm font-mono text-indigo-400">{isRunning ? formatDuration() : "INACTIVE"}</span>
          </div>
          <button
            onClick={() => { 
              if (!isRunning) {
                isRunningRef.current = true; 
                executeTask().then(() => { isRunningRef.current = false; }); 
              }
            }}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Activity className="w-4 h-4" /> Test 1
          </button>
          <button
            onClick={toggleAutomation}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              isRunning 
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Stop Process
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Process
              </>
            )}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total, icon: Globe, color: "text-blue-400" },
          { label: "Successful Leads", value: stats.success, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Execution Errors", value: stats.errors, icon: AlertCircle, color: "text-rose-400" },
          { label: "Blacklisted Proxies", value: blacklistedProxies.size, icon: Shield, color: "text-amber-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mode Selector */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setActiveMode("random")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeMode === "random" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Random Data
            </button>
            <button
              onClick={() => setActiveMode("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeMode === "custom" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Custom Data
            </button>
          </div>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-300">Configuration</h2>
              </div>
              {activeMode === "custom" && customLeads.length > 0 && (
                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  {customLeads.length} LEADS READY
                </div>
              )}
            </div>
            <div className="p-5 space-y-5">
              {/* Common Endpoint Settings */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5 ml-1">Target Endpoint URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 h-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    placeholder="https://your-domain.netlify.app/"
                  />
                </div>
              </div>

              {activeMode === "custom" ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                    isDragOver ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
                >
                  <Upload className={`w-10 h-10 mb-4 ${isDragOver ? "text-indigo-400" : "text-zinc-600"}`} />
                  <p className="text-sm font-medium text-zinc-300 mb-1">Upload CSV or Excel</p>
                  <p className="text-xs text-zinc-500 mb-4 text-center">Drag and drop or click to browse</p>
                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors border border-zinc-700 shadow-sm">
                    Select File
                    <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                  </label>
                  
                  {customLeads.length > 0 && (
                    <div className="mt-6 w-full space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">
                        <span>Lead Sequence</span>
                        <span>Next: #{currentLeadIndex + 1}</span>
                      </div>
                      <div className="max-h-[100px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                        {customLeads.slice(0, 10).map((lead, i) => (
                          <div key={i} className={`flex items-center justify-between py-1 text-[10px] ${i === currentLeadIndex ? "text-indigo-400 font-bold" : "text-zinc-500"}`}>
                            <span className="truncate w-28">{lead.email || lead.Email || "No Email"}</span>
                            <span className="text-indigo-300 opacity-70">{lead.type || lead.Type || "?"}</span>
                            <span>{lead.nom || lead.Surname || lead.Name || "No Name"}</span>
                          </div>
                        ))}
                        {customLeads.length > 10 && <div className="text-[10px] text-zinc-600 italic mt-1 pb-1">+{customLeads.length - 10} more leads...</div>}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Proxy Settings */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5 ml-1 flex justify-between">
                  Proxy Rotation
                  <span className="lowercase text-[10px] opacity-60">Sequential Rotation</span>
                </label>

                {/* Use Proxy Toggle */}
                <div className="flex items-center justify-between mb-3 p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-xs font-medium text-zinc-300">Use Proxy</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Send requests through proxy list</p>
                  </div>
                  <button
                    onClick={() => setUseProxy(prev => !prev)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${useProxy ? "bg-indigo-600" : "bg-zinc-700"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${useProxy ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className={`transition-opacity duration-200 ${useProxy ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                    <textarea
                      value={proxies}
                      onChange={(e) => setProxies(e.target.value)}
                      rows={4}
                      className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pt-2.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none"
                      placeholder="user:pass@host:port"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="iproyal" className="text-[11px] text-zinc-300 font-medium cursor-pointer flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        IPRoyal Session Guard
                      </label>
                      <input
                        type="checkbox"
                        id="iproyal"
                        checked={useIproyalRotation}
                        onChange={(e) => setUseIproyalRotation(e.target.checked)}
                        className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Automatically injects <code className="text-indigo-400 font-mono">_session-[id]</code> into your IPRoyal residential credentials for sticky session rotation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase mb-1.5 ml-1">Execution Delay (Seconds)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="number"
                    value={intervalTime}
                    onChange={(e) => setIntervalTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 h-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
                <div className="mt-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="human-timing" className="text-[11px] text-zinc-300 font-medium cursor-pointer flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      Human Behavior Emulation
                    </label>
                    <input 
                      type="checkbox" 
                      id="human-timing" 
                      checked={useHumanTiming}
                      onChange={(e) => setUseHumanTiming(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-900 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight italic">
                    Adds randomized jitter (0-50%) and occasional "human breaks" to make requests look 100% natural.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">{activeMode === "random" ? "Identity Rotation" : "Smart Data Injection"}</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {activeMode === "random" 
                  ? "Automation uses high-integrity random identity generation (French profile names) and automatic form encoding to bypass standard rate limiting."
                  : "All CSV/Excel fields are mapped automatically. Ensure your file contains headers like 'email', 'nom', 'prenom', and 'tel' for optimal results."}
              </p>
            </div>
          </div>
        </div>

        {/* Log Terminal */}
        <div className="lg:col-span-7 flex flex-col h-[500px]">
          <section className="flex-1 bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl terminal-glow">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono text-zinc-400">process_output.log</span>
              </div>
              <button 
                onClick={clearLogs}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    Waiting for process signal...
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 group"
                    >
                      <span className="text-zinc-700 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`
                        ${log.type === "success" ? "text-emerald-400" : ""}
                        ${log.type === "error" ? "text-rose-400" : ""}
                        ${log.type === "info" ? "text-zinc-400" : ""}
                        break-all
                       tracking-wide`}>
                        <span className="opacity-70">{log.type === "success" ? "✅" : log.type === "error" ? "❌" : "ℹ️"}</span> {log.message}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>

            <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                {isRunning ? "Running" : "Idle"}
              </div>
              <div>Buffer: {logs.length}/50</div>
              <div className="ml-auto">v1.2.0-stable</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
