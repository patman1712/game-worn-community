import React from 'react';
import { CHANGELOG, APP_VERSION } from '@/config/changelog';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ArrowLeft, Clock, CheckCircle, Info, Sparkles } from "lucide-react";

export default function UpdateLog() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Link to={createPageUrl("AdminPanel")} className="text-white/50 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Zurück
            </Link>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                Aktuelle Version: {APP_VERSION}
            </Badge>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Clock className="w-8 h-8 text-cyan-500" />
            System Update Log
        </h1>

        <div className="space-y-8 relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent" />

            {CHANGELOG.map((log, index) => (
                <div key={log.version} className="relative pl-12">
                    {/* Dot */}
                    <div className={`absolute left-[11px] top-1.5 w-4 h-4 rounded-full border-2 ${index === 0 ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-slate-900 border-white/20'}`} />
                    
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    v{log.version} 
                                    {index === 0 && <Badge className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ml-2">Neu</Badge>}
                                </h2>
                                <p className="text-white/60 text-sm">{log.title}</p>
                            </div>
                            <span className="text-white/40 text-sm font-mono bg-slate-800 px-2 py-1 rounded">{log.date}</span>
                        </div>

                        <div className="space-y-3">
                            {log.changes.map((change, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                    <span className="mt-0.5 shrink-0">
                                        {change.type === 'feature' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                                        {change.type === 'bugfix' && <CheckCircle className="w-4 h-4 text-orange-400" />}
                                        {change.type === 'improvement' && <Info className="w-4 h-4 text-blue-400" />}
                                    </span>
                                    <span className="text-white/80">{change.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}