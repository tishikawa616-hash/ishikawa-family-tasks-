"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { 
    ArrowLeft, Download, Clock, CheckCircle2, TrendingUp, Calendar, MapPin, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Field } from "@/types/field";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

// Helper function
const calculateDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / (1000 * 60 * 60); // Hours
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: fieldsData } = await supabase.from("fields").select("*");
      if (fieldsData) setFields(fieldsData);

      const { data: logsData } = await supabase
        .from("work_logs")
        .select(`
            *,
            task:tasks (
                id,
                title,
                field_id
            )
        `)
        .order('started_at', { ascending: false }); // Latest first
      
      if (logsData) {
          const logsWithField = logsData.map(log => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const task = log.task as any;
              const fieldId = task?.field_id;
              const field = fieldsData?.find(f => f.id === fieldId);
              return {
                  ...log,
                  fieldId,
                  fieldName: field?.name || "未割当",
                  fieldColor: field?.color || "#cbd5e1",
                  duration: calculateDuration(log.started_at, log.ended_at)
              };
          });
          setWorkLogs(logsWithField);
      }

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, assignee:assignee_id(display_name, email, avatar_url)")
        .eq("status", "col-done")
        .order('updated_at', { ascending: false });

      if (tasksData) setTasks(tasksData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Aggregation
  const totalHours = useMemo(() => Math.round(workLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10, [workLogs]);
  
  const hoursPerField = useMemo(() => {
    return fields.map(field => {
        const hours = workLogs
          .filter(log => log.fieldId === field.id)
          .reduce((sum, log) => sum + log.duration, 0);
        return {
            id: field.id, 
            name: field.name,
            hours: Math.round(hours * 10) / 10,
            color: field.color
        };
    }).filter(d => d.hours > 0).sort((a, b) => b.hours - a.hours);
  }, [fields, workLogs]);

  // Filter for Detail View
  const selectedField = fields.find(f => f.id === selectedFieldId);
  const selectedWorkLogs = useMemo(() => {
    if (!selectedFieldId) return [];
    return workLogs.filter(log => log.fieldId === selectedFieldId);
  }, [workLogs, selectedFieldId]);
  
  const selectedTasks = useMemo(() => {
      if (!selectedFieldId) return [];
      return tasks.filter(task => task.field_id === selectedFieldId);
  }, [tasks, selectedFieldId]);

  if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">データを集計中...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-10 font-sans">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {selectedFieldId ? (
                    <button onClick={() => setSelectedFieldId(null)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                ) : (
                    <Link href="/" className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </Link>
                )}
                <div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                        {selectedField ? selectedField.name : "Farm Report"}
                    </h1>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        {selectedFieldId ? "FIELD INSIGHTS" : "DASHBOARD"}
                    </p>
                </div>
            </div>
            <button className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Download className="w-5 h-5" />
            </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pt-20 space-y-8">
        
        <AnimatePresence mode="wait">
        {selectedFieldId && selectedField ? (
            /* --- Field Detail View --- */
            <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
            >
                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" style={{backgroundColor: selectedField.color + '20'}} />
                    
                    <div className="relative p-6 md:p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: selectedField.color + '15', color: selectedField.color }}>
                                    <MapPin className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedField.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold">{selectedField.location || "場所未設定"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 mb-1">TOTAL HOURS</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {Math.round(selectedWorkLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10}
                                    <span className="text-sm font-medium text-slate-400 ml-1">h</span>
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 mb-1">COMPLETED</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {selectedTasks.length}
                                    <span className="text-sm font-medium text-slate-400 ml-1">tasks</span>
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 mb-1">LAST ACTIVITY</p>
                                <p className="text-sm font-bold text-slate-800 line-clamp-2">
                                    {selectedWorkLogs[0] ? new Date(selectedWorkLogs[0].started_at).toLocaleDateString() : "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Work Log Timeline */}
                    <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-700">Work Logs</h3>
                        </div>
                        
                        <div className="space-y-8 relative pl-2">
                            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-slate-100" />
                            
                            {selectedWorkLogs.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4 pl-6">記録はありません</p>
                            ) : (
                                selectedWorkLogs.slice(0, 10).map((log, i) => (
                                    <div key={log.id} className="relative pl-8 animate-in slide-in-from-bottom-2 duration-500" style={{animationDelay: i * 50 + 'ms'}}>
                                        <div className="absolute left-[6px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10" style={{ backgroundColor: selectedField.color }} />
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                            <p className="text-sm font-bold text-slate-800">{log.task?.title || "不明なタスク"}</p>
                                            <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md whitespace-nowrap">
                                                {new Date(log.started_at).toLocaleDateString()} {new Date(log.started_at).getHours()}:{String(new Date(log.started_at).getMinutes()).padStart(2, '0')} 
                                                <span className="mx-1">-</span>
                                                {log.ended_at ? `${new Date(log.ended_at).getHours()}:${String(new Date(log.ended_at).getMinutes()).padStart(2, '0')}` : "??:??"}
                                            </span>
                                        </div>
                                        
                                        {log.notes && (
                                            <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600 mb-3 border border-slate-100/50">
                                                {log.notes}
                                            </div>
                                        )}

                                        {log.image_url && (
                                            <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-zoom-in w-fit">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={log.image_url} alt="work" className="h-24 object-cover" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks Side List */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-fit sticky top-24">
                         <div className="flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-700">Completed</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedTasks.length === 0 ? (
                                <p className="text-sm text-slate-400">完了タスクはありません</p>
                            ) : (
                                selectedTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="group p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                        <p className="text-sm font-medium text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.title}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(task.updated_at).toLocaleDateString()}
                                            </span>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(task.assignee as any)?.avatar_url && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={(task.assignee as any).avatar_url} className="w-5 h-5 rounded-full" alt="" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        ) : (
            /* --- Dashboard View --- */
            <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
            >
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-24 h-24 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Total Hours</p>
                        <p className="text-4xl font-extrabold text-slate-800 tracking-tight">
                            {totalHours}
                            <span className="text-lg font-medium text-slate-400 ml-2">h</span>
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span>This Month</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 className="w-24 h-24 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Tasks Done</p>
                        <p className="text-4xl font-extrabold text-slate-800 tracking-tight">
                            {tasks.length}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            <span>Total</span>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Field Performance</h2>
                            <p className="text-sm text-slate-400">圃場ごとの作業時間比較</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hoursPerField} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 12, fill: '#64748b'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 12, fill: '#64748b'}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                                    <p className="font-bold mb-1">{data.name}</p>
                                                    <p>{data.hours} hours</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="hours" 
                                    radius={[8, 8, 8, 8]}
                                    barSize={32}
                                    onClick={(data: any) => {
                                        if (data?.payload?.id) {
                                            setSelectedFieldId(data.payload.id);
                                        }
                                    }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    {hoursPerField.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Field Grid */}
                <div>
                     <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Fields Overview</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hoursPerField.map((field) => (
                            <button 
                                key={field.id}
                                onClick={() => setSelectedFieldId(field.id)}
                                className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all text-left"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: field.color + '20', color: field.color }}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{field.name}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{field.hours}<span className="text-sm font-medium text-slate-400 ml-1">h</span></p>
                                    </div>
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((field.hours / (hoursPerField[0]?.hours || 1)) * 100, 100)}%`, backgroundColor: field.color }} />
                                    </div>
                                </div>
                            </button>
                        ))}
                     </div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

      </main>
    </div>
  );
}
