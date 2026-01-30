"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Field } from "@/types/field";
import { Task } from "@/types/board";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      
      // Fetch Fields
      const { data: fieldsData } = await supabase.from("fields").select("*");
      if (fieldsData) setFields(fieldsData);

      // Fetch Work Logs
      const { data: logsData } = await supabase
        .from("work_logs")
        .select(`
            *,
            task:tasks (
                id,
                title,
                field_id
            )
        `);
      
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
                  duration: calculateDuration(log.started_at, log.ended_at)
              };
          });
          setWorkLogs(logsWithField);
      }

      // Fetch Completed Tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, assignee:assignee_id(display_name, email, avatar_url)")
        .eq("status", "col-done");
      if (tasksData) setTasks(tasksData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Aggregation: Hours per Field
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
    }).filter(d => d.hours > 0);
  }, [fields, workLogs]);

  // Aggregation: Tasks per Person
  const tasksPerPerson = useMemo(() => {
      return Object.values(tasks.reduce((acc: any, task) => {
        const assigneeData = task.assignee as any;
        const name = assigneeData?.display_name || assigneeData?.email || "未割当";
        if (!acc[name]) acc[name] = { name, count: 0 };
        acc[name].count += 1;
        return acc;
    }, {}));
  }, [tasks]);

  // Filter data for selected field
  const selectedField = fields.find(f => f.id === selectedFieldId);
  
  const selectedWorkLogs = useMemo(() => {
    if (!selectedFieldId) return [];
    return workLogs
        .filter(log => log.fieldId === selectedFieldId)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }, [workLogs, selectedFieldId]);

  const selectedTasks = useMemo(() => {
      if (!selectedFieldId) return [];
      return tasks.filter(task => task.field_id === selectedFieldId);
  }, [tasks, selectedFieldId]);

  if (loading) {
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
            {selectedFieldId ? (
                <button onClick={() => setSelectedFieldId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
            ) : (
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
            )}
            <h1 className="text-lg font-bold text-gray-800">
                {selectedField ? `${selectedField.name} レポート` : "月次レポート"}
            </h1>
        </div>
        <button className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {selectedFieldId && selectedField ? (
            /* Field Detail View */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Field Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedField.color + '20', color: selectedField.color }}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedField.name}</h2>
                            <p className="text-sm text-gray-500">{selectedField.location || "場所未設定"}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">総作業時間</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Math.round(selectedWorkLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10}
                                <span className="text-sm font-normal text-gray-500 ml-1">h</span>
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">完了タスク</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {selectedTasks.length}
                                <span className="text-sm font-normal text-gray-500 ml-1">件</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Work Log Timeline */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">作業履歴</h3>
                    {selectedWorkLogs.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">作業履歴はありません</p>
                    ) : (
                        <div className="space-y-6 relative pl-4">
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-100" />
                            {selectedWorkLogs.map((log) => (
                                <div key={log.id} className="relative pl-6">
                                    <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: selectedField.color }} />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">
                                            {new Date(log.started_at).toLocaleDateString('ja-JP')} {new Date(log.started_at).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})} - {new Date(log.ended_at).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        <p className="font-medium text-gray-900">{log.description || "作業内容なし"}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {log.image_url && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={log.image_url} alt="作業写真" className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Tasks List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-800 mb-4">完了したタスク</h3>
                     {selectedTasks.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">完了したタスクはありません</p>
                     ) : (
                         <div className="space-y-3">
                             {selectedTasks.map(task => (
                                 <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                     <div>
                                         <p className="font-medium text-sm text-gray-900 line-clamp-1">{task.title}</p>
                                         <p className="text-xs text-gray-500 mt-0.5">
                                             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                             担当: {(task.assignee as any)?.display_name || "未割当"}
                                         </p>
                                     </div>
                                     <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-lg shrink-0">完了</span>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            </div>
        ) : (
            /* Dashboard View */
            <div className="animate-in fade-in duration-300 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">総作業時間</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {Math.round(workLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10}
                            <span className="text-sm font-normal text-gray-500 ml-1">h</span>
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">完了タスク</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {tasks.length}
                            <span className="text-base font-normal text-gray-500 ml-1">件</span>
                        </p>
                    </div>
                </div>

                {/* Chart: Hours per Field */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            圃場別 作業時間
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">タップで詳細</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hoursPerField} onClick={(data: any) => {
                                if (data && data.activePayload && data.activePayload.length > 0) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const fieldId = (data.activePayload[0].payload as any).id;
                                    setSelectedFieldId(fieldId);
                                }
                            }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis unit="h" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={40}>
                                    {hoursPerField.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} cursor="pointer" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart: Tasks per Person */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        担当者別 完了タスク
                    </h2>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    data={tasksPerPerson as any[]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(tasksPerPerson as any[]).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
