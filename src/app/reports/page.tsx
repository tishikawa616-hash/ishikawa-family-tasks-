"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { 
    PieChart, Clock, MapPin, ChevronRight, Download, ChevronLeft, ArrowLeft
} from "lucide-react";
import { Field } from "@/types/field";
import { motion } from "framer-motion";
import { WorkHeatmap } from "@/components/reports/WorkHeatmap";
import { generateReportPDF, generateFieldReportPDF } from "@/lib/utils/pdfGenerator";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";

const calculateDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / (1000 * 60 * 60);
};

export default function ReportsPage() {
  const router = useRouter(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hourlyWage, setHourlyWage] = useState(1000);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const supabase = createClient();

  const moveDate = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch fields
      const { data: fieldsData } = await supabase.from("task_fields").select("*");
      if (fieldsData) setFields(fieldsData);

      // Fetch user profile for hourly wage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from("task_profiles").select("hourly_wage").eq("id", user.id).single();
          if (profile && profile.hourly_wage) setHourlyWage(profile.hourly_wage);
      }

      // Fetch work logs
      const { data: logsData } = await supabase
        .from("task_work_logs")
        .select(`*, task:task_tasks (id, title, field_id)`)
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
      const { data: tasksData } = await supabase
        .from("task_tasks")
        .select("*")
        .order('created_at', { ascending: false });

      if (tasksData) {
          const completedTasks = tasksData.filter(t => 
             ["col-done", "done", "DONE", "completed"].includes(t.status)
          );
          setTasks(completedTasks);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const totalHours = useMemo(() => Math.round(workLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10, [workLogs]);
  
  // Calculate stats per field
  const fieldStats = useMemo(() => {
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

    // Add "Unassigned"
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
            color: "#94a3b8"
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
  
  // Calculate dynamic height for chart based on item count
  const chartHeight = Math.max(fieldStats.length * 60, 300);

  return (
    <div className="flex flex-col min-h-dvh w-full bg-[#F7F9FC] pb-32 md:pb-12 safe-p-bottom">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm safe-p-top">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <PieChart className="w-6 h-6" />
            </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">分析レポート</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">Work Analysis</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {selectedFieldId && (
              <button 
                onClick={() => setSelectedFieldId(null)}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                  <ArrowLeft className="w-5 h-5" />
              </button>
          )}
          {/* PDF Export Button */}
          <button
            onClick={() => {
                if (selectedFieldId) {
                   const element = document.getElementById("field-detail-report");
                   if (element) generateFieldReportPDF(element, selectedField?.name || "Field Report");
                } else {
                   const element = document.getElementById("summary-report");
                   if (element) generateReportPDF(element);
                }
            }}
            className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            title="PDFをダウンロード"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div id="summary-report" className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Date Selector */}
        <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
           <button 
             onClick={() => moveDate(-1)}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
           >
             <ChevronLeft className="w-5 h-5" />
           </button>
           <span className="font-bold text-gray-700 tabular-nums">
             {format(currentDate, "yyyy年 M月", { locale: ja })}
           </span>
           <button 
             onClick={() => moveDate(1)}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
           >
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center text-center">
                <p className="text-blue-100 text-sm font-medium mb-1">総作業時間</p>
                <p className="text-3xl font-bold">
                  {totalHours}
                  <span className="text-base font-normal text-blue-100 ml-1">時間</span>
                </p>
              </div>
              <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-center">
                <p className="text-emerald-100 text-sm font-medium mb-1">完了タスク</p>
                <p className="text-3xl font-bold">
                  {tasks.length}
                  <span className="text-base font-normal text-emerald-100 ml-1">件</span>
                </p>
              </div>
            </div>

            {selectedFieldId ? (
               <div id="field-detail-report" className="space-y-6">
                 {/* Field Header */}
                 <div 
                   className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden"
                 >
                   <div 
                     className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"
                     style={{ color: selectedField?.color }}
                   />
                   <div className="relative">
                     <span 
                       className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                       style={{ backgroundColor: selectedField?.color + '20', color: selectedField?.color }}
                     >
                        詳細レポート
                     </span>
                     <h2 className="text-2xl font-black text-slate-800 mb-1">{selectedField?.name}</h2>
                     <div className="flex items-center gap-4 text-slate-500 text-sm">
                        <span>計 {selectedStats?.hours} 時間</span>
                        <span>•</span>
                        <span>{selectedStats?.completedCount} タスク</span>
                        {selectedStats?.totalHarvest ? (
                            <>
                                <span>•</span>
                                <span>収穫: {selectedStats.totalHarvest}{selectedStats.harvestUnit}</span>
                            </>
                        ) : null}
                     </div>
                   </div>
                 </div>

                 {/* Cost Estimate */}
                 <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                   <div>
                     <p className="text-xs text-slate-400 font-bold uppercase">推定人件費</p>
                     <p className="text-xs text-slate-400 mt-0.5">※時給 ¥{hourlyWage.toLocaleString()} 計算</p>
                   </div>
                   <p className="text-2xl font-black text-slate-800">
                     ¥{selectedStats?.estimatedCost?.toLocaleString() || 0}
                   </p>
                 </div>

                 {/* Detailed Logs */}
                 <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700">作業履歴</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {selectedWorkLogs.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">作業記録なし</div>
                        ) : (
                            selectedWorkLogs.map(log => (
                                <div key={log.id} className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-700">{log.task?.title || "タスクなし"}</p>
                                        <p className="text-sm text-slate-500">{format(new Date(log.started_at), "M/d HH:mm")} - {log.duration.toFixed(1)}h</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
               </div>
            ) : (
                <div className="space-y-6">
                   {/* Heatmap */}
                   <WorkHeatmap logs={workLogs} />

                   {/* Field Breakdown Chart */}
                   {fieldStats.length > 0 && (
                     <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4">圃場別の作業時間</h3>
                        <div style={{ height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fieldStats} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                stroke="#64748b" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                     </div>
                   )}

                   {/* Field List */}
                   <div>
                       <h3 className="font-bold text-slate-700 mb-3 px-1">圃場一覧</h3>
                       <div className="space-y-3">
                           {fieldStats.map((field) => (
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
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                               </button>
                           ))}
                       </div>
                   </div>
                </div>
            )}
            
            <div className="h-10" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
