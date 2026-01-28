"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/types/field";

const PRESET_COLORS = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newLocation, setNewLocation] = useState("");
  const supabase = createClient();

  const fetchFields = useCallback(async () => {
    const { data } = await supabase
      .from("fields")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) {
      setFields(
        data.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          location: f.location,
          color: f.color,
          createdAt: f.created_at,
        }))
      );
    }
  }, [supabase]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    const { error } = await supabase.from("fields").insert({
      name: newName.trim(),
      color: newColor,
      location: newLocation.trim() || null,
    });

    if (!error) {
      setNewName("");
      setNewLocation("");
      setIsAdding(false);
      fetchFields();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この圃場を削除しますか？")) return;

    const { error } = await supabase.from("fields").delete().eq("id", id);
    if (!error) {
      fetchFields();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">圃場管理</h1>
        <p className="text-sm text-gray-500 mt-1">畑やハウスを登録して、タスクを分類できます</p>
      </div>

      {/* Field List */}
      <div className="px-4 py-6 space-y-4">
        {fields.map((field) => (
          <div
            key={field.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: field.color + "20" }}
            >
              <MapPin className="w-6 h-6" style={{ color: field.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900">{field.name}</h3>
              {field.location && (
                <p className="text-sm text-gray-500 mt-1">{field.location}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(field.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {fields.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>圃場がまだ登録されていません</p>
          </div>
        )}

        {/* Add Form */}
        {isAdding ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">新しい圃場</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: Aの畑"
                  className="w-full text-lg font-medium bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-0 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  場所（任意）
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="例: 西原村〇〇地区"
                  className="w-full text-base bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-0 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  カラー
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        newColor === color
                          ? "ring-4 ring-offset-2 ring-blue-500 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="w-full py-4 text-base font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                追加する
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-4 text-blue-500 font-semibold bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            圃場を追加
          </button>
        )}
      </div>
    </div>
  );
}
