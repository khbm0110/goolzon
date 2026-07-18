'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import CommentsPanel from './CommentsPanel';
import { data } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment } from '@/types';

export default function ArticleComments({ articleId }: { articleId: string }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    data.getCommentsForArticle(articleId).then(setComments);
  }, [articleId]);

  async function handleAddComment(text: string, parentId?: string) {
    if (!currentUser) return;
    const newComment = await data.addComment({ articleId, userId: currentUser.id, text, parentId });
    setComments((prev) => [...prev, newComment]);
  }

  async function handleReportComment(commentId: string) {
    await data.updateCommentStatus(commentId, 'reported');
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status: 'reported' } : c)));
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] hover:text-[var(--fg)] rounded-lg font-bold text-sm transition-colors"
      >
        <MessageSquare size={16} />
        التعليقات ({comments.length})
      </button>

      <CommentsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        commentsData={comments}
        onAddComment={handleAddComment}
        onReportComment={handleReportComment}
      />
    </>
  );
}
