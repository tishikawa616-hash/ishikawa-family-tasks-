"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Field } from "@/types/field";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Fields
      const { data: fieldsData } = await supabase.from("fields").select("*");
      if (fieldsData) setFields(fieldsData);

      // Fetch Work Logs
      // In a real app, we should filter by date range (e.g., this month)
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
          // Join with field name manually since work_logs doesn't have field_id directly usually, 
          // it's linked via task. But if task has field_id:
          const logsWithField = logsData.map(log => {
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
        .select("*, assignee:assignee_id(display_name, email)")
        .eq("status", "col-done");
      if (tasksData) setTasks(tasksData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const calculateDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60); // Hours
  };

  // Aggregation: Hours per Field
  const hoursPerField = fields.map(field => {
      const hours = workLogs
        .filter(log => log.fieldId === field.id)
        .reduce((sum, log) => sum + log.duration, 0);
      return {
          name: field.name,
          hours: Math.round(hours * 10) / 10
      };
  }).filter(d => d.hours > 0);

  // Aggregation: Tasks per Person
  const tasksPerPerson = Object.values(tasks.reduce((acc: any, task) => {
      const assigneeData = task.assignee as any;
      const name = assigneeData?.display_name || assigneeData?.email || "未割当";
      if (!acc[name]) acc[name] = { name, count: 0 };
      acc[name].count += 1;
      return acc;
  }, {}));

  if (loading) {
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">月次レポート</h1>
        </div>
        <button className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">総作業時間</p>
                <p className="text-3xl font-bold text-gray-900">
                    {Math.round(workLogs.reduce((sum, log) => sum + log.duration, 0) * 10) / 10}
                    <span className="text-base font-normal text-gray-500 ml-1">時間</span>
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
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                圃場別 作業時間
            </h2>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hoursPerField}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis unit="h" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
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
                            data={tasksPerPerson}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="count"
                        >
                            {tasksPerPerson.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </main>
    </div>
  );
}
