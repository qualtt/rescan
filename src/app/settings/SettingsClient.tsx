'use client';

import { useState } from 'react';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { t } from '@/config/locales';

interface AllowedEmail {
  id: string;
  email: string;
  createdAt: Date;
}

export function SettingsClient({ initialEmails }: { initialEmails: AllowedEmail[] }) {
  const [emails, setEmails] = useState<AllowedEmail[]>(initialEmails);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/allowed-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      
      const data = await res.json();
      if (res.ok) {
        setEmails([data, ...emails]);
        setNewEmail('');
      } else {
        alert(data.error || 'Failed to add email');
      }
    } catch (err) {
      alert('Error adding email');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/allowed-emails/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmails(emails.filter(e => e.id !== id));
      } else {
        alert('Failed to delete email');
      }
    } catch (err) {
      alert('Error deleting email');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder={t.settings.addEmailPlaceholder}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
          required
        />
        <button
          type="submit"
          disabled={isAdding}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {t.settings.addEmailButton}
        </button>
      </form>

      <div className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">{t.settings.emptyEmails}</p>
        ) : (
          emails.map(email => (
            <div key={email.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-medium text-gray-700">{email.email}</span>
              <button
                onClick={() => handleDelete(email.id)}
                disabled={deletingId === email.id}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === email.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
