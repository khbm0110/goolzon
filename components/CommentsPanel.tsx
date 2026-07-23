'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ThumbsUp, MessageSquare, Send, Flag, CornerDownRight, LogIn } from 'lucide-react';
import type { Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/services/dateService';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  commentsData: Comment[];
  onAddComment: (text: string, parentId?: string) => void;
  onReportComment: (commentId: string) => void;
}

function ReplyForm({ parentId, onReply, onCancel }: { parentId: string; onReply: (text: string, parentId: string) => void; onCancel: () => void }) {
  const [replyText, setReplyText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(replyText, parentId);
      setReplyText('');
      onCancel();
    }
  };

  return (
    <form className="flex gap-3 mt-3 ml-14" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="اكتب ردك..."
          className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-full py-2 pl-10 pr-3 text-[var(--fg)] text-sm placeholder:text-[var(--fg-faint)] focus:border-primary outline-none transition"
        />
        <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-slate-900 rounded-full hover:bg-emerald-400 transition-colors" aria-label="إرسال الرد">
          <Send size={14} />
        </button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  allComments,
  onAddComment,
  onReportComment,
}: {
  comment: Comment;
  allComments: Comment[];
  onAddComment: (text: string, parentId?: string) => void;
  onReportComment: (commentId: string) => void;
}) {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const replies = useMemo(() => allComments.filter((c) => c.parentId === comment.id), [allComments, comment.id]);
  const timeAgo = formatTimeAgo(comment.time);

  const handleLike = () => {
    setIsLiked((prev) => !prev);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 mt-1 relative">
        <Image src={comment.avatar} alt={comment.user} fill sizes="40px" className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)] border border-[var(--border)] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-primary">{comment.user}</h4>
            <span className="text-xs text-[var(--fg-faint)]">{timeAgo}</span>
          </div>
          <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{comment.text}</p>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--fg-faint)] px-2">
          <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-primary' : 'hover:text-primary'}`}>
            <ThumbsUp size={14} />
            <span className="font-semibold">{likes}</span>
          </button>
          {currentUser && (
            <button onClick={() => setShowReplyInput(!showReplyInput)} className="flex items-center gap-1.5 hover:text-[var(--fg)]">
              <MessageSquare size={14} />
              <span>رد</span>
            </button>
          )}
          {replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1.5 hover:text-[var(--fg)]">
              <CornerDownRight size={14} />
              <span>{showReplies ? 'إخفاء' : 'عرض'} الردود ({replies.length})</span>
            </button>
          )}
          <button onClick={() => onReportComment(comment.id)} className="flex items-center gap-1.5 hover:text-red-500 mr-auto" title="إبلاغ عن تعليق">
            <Flag size={14} />
          </button>
        </div>

        {showReplyInput && <ReplyForm parentId={comment.id} onReply={onAddComment} onCancel={() => setShowReplyInput(false)} />}

        {showReplies && replies.length > 0 && (
          <div className="mt-4 space-y-4 border-r-2 border-[var(--border)] pr-4">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} allComments={allComments} onAddComment={onAddComment} onReportComment={onReportComment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsPanel({ isOpen, onClose, commentsData, onAddComment, onReportComment }: CommentsPanelProps) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => commentInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '' || !currentUser) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const topLevelComments = useMemo(() => commentsData.filter((c) => !c.parentId), [commentsData]);

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_80%,transparent)] backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-heading"
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <h2 id="comments-heading" className="text-xl font-bold text-[var(--fg)]">التعليقات ({commentsData.length})</h2>
          <button onClick={onClose} className="p-2 text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-2)] rounded-full" aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {topLevelComments.length === 0 ? (
            <div className="text-center text-[var(--fg-faint)] pt-20">كن أول من يعلق!</div>
          ) : (
            topLevelComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} allComments={commentsData} onAddComment={onAddComment} onReportComment={onReportComment} />
            ))
          )}
        </div>

        <footer className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] flex-shrink-0">
          {currentUser ? (
            <form className="flex gap-3" onSubmit={handleSubmitComment}>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 relative">
                {currentUser.avatar && <Image src={currentUser.avatar} alt={currentUser.name} fill sizes="40px" className="object-cover" />}
              </div>
              <div className="relative flex-1">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليقاً..."
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-full py-2.5 pl-12 pr-4 text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
                <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 p-2 bg-primary text-slate-900 rounded-full hover:bg-emerald-400 transition-colors" aria-label="إرسال التعليق">
                  <Send size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <Link href="/login" className="font-bold text-primary hover:underline flex items-center justify-center gap-2">
                <LogIn size={16} />
                سجل الدخول للتعليق
              </Link>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
