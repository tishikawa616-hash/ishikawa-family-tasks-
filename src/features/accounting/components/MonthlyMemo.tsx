'use client';

import { useState } from 'react';
import { saveMonthlyNote } from '@/app/accounting/assets/actions'; // Fixed import

interface MonthlyMemoProps {
  yearMonth: string;
  initialContent: string;
}

export default function MonthlyMemo({ yearMonth, initialContent }: MonthlyMemoProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedContent, setSavedContent] = useState(initialContent);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveMonthlyNote(yearMonth, content);
    if (result.success) {
      setSavedContent(content);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setContent(savedContent);
    setIsEditing(false);
  };

  // Format year-month for display
  const [year, month] = yearMonth.split('-');
  const displayMonth = `${year}年${parseInt(month)}月`;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#78350F]">📝 {displayMonth}のメモ</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[#4D7C0F] font-bold text-sm"
          >
            編集
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="会議で話し合った内容、決定事項などをメモ..."
            className="w-full h-32 border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-[#4D7C0F] resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2 bg-[#4D7C0F] text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 rounded-xl"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[60px]">
          {savedContent ? (
            <p className="whitespace-pre-wrap text-gray-700">{savedContent}</p>
          ) : (
            <p className="text-gray-400 italic">メモはまだありません</p>
          )}
        </div>
      )}
    </div>
  );
}
