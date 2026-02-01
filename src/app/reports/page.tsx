"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { 
    ArrowLeft, Clock, CheckCircle2, MapPin, ChevronRight, Download
} from "lucide-react";
import Link from "next/link";
import { Field } from "@/types/field";
import { motion, AnimatePresence } from "framer-motion";
import { WorkHeatmap } from "@/components/reports/WorkHeatmap";
import { generateReportPDF } from "@/lib/utils/pdfGenerator";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const calculateDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / (1000 * 60 * 60);
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hourlyWage, setHourlyWage] = useState(1000);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch fields
      const { data: fieldsData } = await supabase.from("fields").select("*");
      if (fieldsData) setFields(fieldsData);

      // Fetch user profile for hourly wage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from("profiles").select("hourly_wage").eq("id", user.id).single();
          if (profile && profile.hourly_wage) setHourlyWage(profile.hourly_wage);
      }

      // Fetch work logs
      const { data: logsData } = await supabase
        .from("work_logs")
        .select(`*, task:tasks (id, title, field_id)`)
        .order('started_at', { ascending: false });
      
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

      // Fetch completed tasks
      // Fetch ALL tasks and filter in memory (Mirroring Board logic to ensure consistency)
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, assignee:assignee_id(display_name, email, avatar_url)")
        .order('updated_at', { ascending: false });

      if (tasksData) {
          // Broad filter for completion status
          const completedTasks = tasksData.filter(t => 
             ["col-done", "done", "DONE", "completed"].includes(t.status)
          );
          console.log("Filtered completed tasks:", completedTasks);
          setTasks(completedTasks);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const totalHours = useMemo(() => Math.round(workLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10, [workLogs]);
  
  // Calculate stats per field (include fields with tasks OR work logs)
  const fieldStats = useMemo(() => {
    // 1. Map existing fields
    const mapped = fields.map(field => {
        const fieldLogs = workLogs.filter(log => log.fieldId === field.id);
        const hours = fieldLogs.reduce((sum, log) => sum + log.duration, 0);
        const completedCount = tasks.filter(t => t.field_id === field.id).length;
        
        const totalHarvest = fieldLogs.reduce((sum, log) => sum + (log.harvest_quantity || 0), 0);
        const unit = fieldLogs.find(log => log.harvest_unit)?.harvest_unit || 'kg';
        const estimatedCost = Math.round(hours * hourlyWage);

        return {
            id: field.id, 
            name: field.name,
            hours: Math.round(hours * 10) / 10,
            completedCount,
            totalHarvest: Math.round(totalHarvest * 10) / 10,
            harvestUnit: unit,
            estimatedCost,
            color: field.color
        };
    });

    // 2. Add "Unassigned" if necessary
    const unassignedLogs = workLogs.filter(log => !log.fieldId || !fields.find(f => f.id === log.fieldId));
    const unassignedTasks = tasks.filter(t => !t.field_id || !fields.find(f => f.id === t.field_id));

    if (unassignedLogs.length > 0 || unassignedTasks.length > 0) {
        const hours = unassignedLogs.reduce((sum, log) => sum + log.duration, 0);
        const totalHarvest = unassignedLogs.reduce((sum, log) => sum + (log.harvest_quantity || 0), 0);
        const unit = unassignedLogs.find(log => log.harvest_unit)?.harvest_unit || 'kg';
        const estimatedCost = Math.round(hours * hourlyWage);

        mapped.push({
            id: "unassigned",
            name: "未割当",
            hours: Math.round(hours * 10) / 10,
            completedCount: unassignedTasks.length,
            totalHarvest: Math.round(totalHarvest * 10) / 10,
            harvestUnit: unit,
            estimatedCost,
            color: "#94a3b8" // Slate-400
        });
    }

    return mapped.filter(d => d.hours > 0 || d.completedCount > 0).sort((a, b) => (b.hours + b.completedCount) - (a.hours + a.completedCount));
  }, [fields, workLogs, tasks, hourlyWage]);

  const selectedField = selectedFieldId === "unassigned" 
    ? { name: "未割当", color: "#94a3b8" } 
    : fields.find(f => f.id === selectedFieldId);

  const selectedStats = useMemo(() => {
      if (!selectedFieldId) return null;
      return fieldStats.find(s => s.id === selectedFieldId);
  }, [fieldStats, selectedFieldId]);

  const selectedWorkLogs = useMemo(() => {
    if (!selectedFieldId) return [];
    if (selectedFieldId === "unassigned") {
        return workLogs.filter(log => !log.fieldId || !fields.find(f => f.id === log.fieldId));
    }
    return workLogs.filter(log => log.fieldId === selectedFieldId);
  }, [workLogs, selectedFieldId, fields]);
  
  const selectedTasks = useMemo(() => {
      if (!selectedFieldId) return [];
      if (selectedFieldId === "unassigned") {
          return tasks.filter(t => !t.field_id || !fields.find(f => f.id === t.field_id));
      }
      return tasks.filter(task => task.field_id === selectedFieldId);
  }, [tasks, selectedFieldId, fields]);

  if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium text-lg">読み込み中...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Simple Scrollable Header - Not Fixed */}
      <div className="bg-white border-b border-slate-100 px-4 py-6 safe-p-top">
        <div className="max-w-lg mx-auto pt-4">
          <div className="flex items-center gap-3">
            {selectedFieldId ? (
              <button 
                onClick={() => setSelectedFieldId(null)} 
                className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full active:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            ) : (
              <Link 
                href="/" 
                className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full active:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {selectedField ? selectedField.name : "作業レポート"}
              </h1>
              <p className="text-sm text-slate-500">
                {selectedFieldId ? "圃場の詳細" : "全体の実績"}
              </p>
            </div>
            
            <div className="flex-1" />

            {!selectedFieldId && (
                <button 
                    onClick={() => generateReportPDF(workLogs, totalHours, tasks.length)}
                    className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    title="日誌PDF出力"
                >
                    <Download className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
        {selectedFieldId && selectedField ? (
          /* === FIELD DETAIL VIEW === */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-slate-500 font-medium">合計時間</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {selectedStats?.hours || 0}
                  <span className="text-base font-normal text-slate-400 ml-1">時間</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-500 font-medium">完了タスク</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {selectedStats?.completedCount || 0}
                  <span className="text-base font-normal text-slate-400 ml-1">件</span>
                </p>
              </div>
              {/* Additional Stats: Harvest & Cost */}
              {selectedStats && selectedStats.totalHarvest > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-[10px] text-amber-600 font-bold">¥</span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">収穫量</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {selectedStats.totalHarvest}
                    <span className="text-sm font-normal text-slate-400 ml-1">{selectedStats.harvestUnit}</span>
                  </p>
                </div>
              )}
              {selectedStats && selectedStats.estimatedCost > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center">
                        <span className="text-[10px] text-rose-600 font-bold">¥</span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">概算人件費</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    ¥{selectedStats.estimatedCost.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Work Logs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700">作業履歴</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {selectedWorkLogs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">記録がありません</p>
                ) : (
                  selectedWorkLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="px-4 py-3">
                      <p className="font-medium text-slate-800 mb-1">{log.task?.title || "不明"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {new Date(log.started_at).toLocaleDateString('ja-JP')}
                        </span>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {Math.round(log.duration * 10) / 10} 時間
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">{log.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700">完了したタスク</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {selectedTasks.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">完了タスクがありません</p>
                ) : (
                  selectedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="px-4 py-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 truncate">{task.title}</p>
                        <p className="text-xs text-slate-400">{new Date(task.updated_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* === DASHBOARD VIEW === */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Heatmap */}
            <WorkHeatmap logs={workLogs} />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                <p className="text-blue-100 text-sm font-medium mb-1">総作業時間</p>
                <p className="text-4xl font-bold">
                  {totalHours}
                  <span className="text-lg font-normal text-blue-100 ml-1">時間</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                <p className="text-emerald-100 text-sm font-medium mb-1">完了タスク</p>
                <p className="text-4xl font-bold">
                  {tasks.length}
                  <span className="text-lg font-normal text-emerald-100 ml-1">件</span>
                </p>
              </div>
            </div>

            {/* Chart */}
            {fieldStats.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">圃場別の作業時間</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fieldStats} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{fontSize: 12, fill: '#475569'}} 
                        axisLine={false} 
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800 text-white text-sm rounded-lg py-2 px-3 shadow-xl">
                                <p className="font-bold">{data.name}</p>
                                <p>{data.hours} 時間</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="hours" 
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        {fieldStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Field List */}
            <div>
              <h3 className="font-bold text-slate-700 mb-3 px-1">圃場一覧</h3>
              <div className="space-y-3">
                {fieldStats.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <p className="text-slate-400">まだ記録がありません</p>
                  </div>
                ) : (
                  fieldStats.map((field) => (
                    <button 
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:bg-slate-50 transition-colors text-left flex items-center gap-4"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: field.color + '20', color: field.color }}
                      >
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">{field.name}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {field.hours > 0 && <span>{field.hours} 時間</span>}
                          {field.totalHarvest > 0 && <span>{field.totalHarvest}{field.harvestUnit}</span>}
                          {field.estimatedCost > 0 && <span className="text-slate-400 text-xs">¥{field.estimatedCost.toLocaleString()}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
