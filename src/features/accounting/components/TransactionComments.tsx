"use client";

import { useState } from "react";
import { addTransactionComment } from "@/app/accounting/actions"; // Fixed import
import { TransactionComment } from "@/features/accounting/types/database"; // Fixed import

interface TransactionCommentsProps {
  transactionId: string;
  comments: TransactionComment[];
  currentUserId: string;
}

export default function TransactionComments({ transactionId, comments: initialComments, currentUserId }: TransactionCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimistic update could be complex without full user info, so we'll just append after network success or revalidate
  // For simplicity, we can fetch or just append the local text if we don't strictly need the user avatar immediately
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const content = newComment;
    setNewComment("");

    // Optimistic append (partial)
    const tempId = Math.random().toString();
    const tempComment: TransactionComment = {
        id: tempId,
        transaction_id: transactionId,
        user_id: currentUserId,
        content: content,
        created_at: new Date().toISOString()
    };
    setComments([...comments, tempComment]);

    const result = await addTransactionComment(transactionId, content);
    if (!result.success) {
        alert("コメントの投稿に失敗しました");
        setComments(comments); // Revert
    } else {
        // Ideally we re-fetch to get the server timestamp and real ID, 
        // but since we revalidatePath in action, the parent might refresh if this was purely server-driven.
        // As a client component, we might want to router.refresh().
    }
    setIsSubmitting(false);
  };
  
  return (
    <div className="mt-8 bg-white/60 rounded-2xl p-6">
       <h3 className="font-bold text-[#78350F] mb-4 flex items-center gap-2">
         💬 家族のメモ・チャット
       </h3>
       
       <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
         {comments.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-4">まだコメントはありません</p>
         )}
         {comments.map((comment) => {
            const isMe = comment.user_id === currentUserId;
            return (
             <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                   isMe ? 'bg-[#4D7C0F] text-white rounded-br-none' : 'bg-white border rounded-bl-none'
               }`}>
                 {comment.content}
                 <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-white' : 'text-stone-400'}`}>
                    {new Date(comment.created_at).toLocaleString()}
                 </div>
               </div>
             </div>
            );
         })}
       </div>

       <form onSubmit={handleAddComment} className="flex gap-2">
         <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-[#4D7C0F]"
         />
         <button 
           type="submit"
           disabled={!newComment.trim() || isSubmitting}
           className="bg-[#78350F] text-white rounded-xl px-4 font-bold disabled:opacity-50"
         >
           送信
         </button>
       </form>
    </div>
  );
}
