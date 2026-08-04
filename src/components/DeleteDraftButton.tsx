'use client'

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { t } from '@/config/locales';

export function DeleteDraftButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(t.analytics.confirmDelete)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete draft');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting draft');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute top-2 left-2 bg-rose-500/80 hover:bg-rose-600 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10"
      title={t.analytics.deleteDraft}
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
