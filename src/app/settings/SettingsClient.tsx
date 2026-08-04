'use client';

import { useState } from 'react';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { t } from '@/config/locales';

interface AllowedEmail {
  id: string;
  email: string;
  createdAt: Date;
}

interface GroupMember {
  id: string;
  email: string | null;
  name: string | null;
}

export function SettingsClient({ 
  initialEmails, 
  initialGroupMembers 
}: { 
  initialEmails: AllowedEmail[],
  initialGroupMembers: GroupMember[]
}) {
  const [emails, setEmails] = useState<AllowedEmail[]>(initialEmails);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(initialGroupMembers);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const handleAddEmail = async (e: React.FormEvent) => {
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

  const handleDeleteEmail = async (id: string) => {
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsAddingMember(true);
    try {
      const res = await fetch('/api/admin/group-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (!groupMembers.find(m => m.id === data.user.id)) {
          setGroupMembers([...groupMembers, data.user]);
        }
        setNewMemberEmail('');
      } else {
        alert(data.error || 'Failed to add group member');
      }
    } catch (err) {
      alert('Error adding group member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    setDeletingMemberId(id);
    try {
      const res = await fetch(`/api/admin/group-members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroupMembers(groupMembers.filter(m => m.id !== id));
      } else {
        alert('Failed to remove group member');
      }
    } catch (err) {
      alert('Error removing group member');
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Allowed Emails Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{t.settings.accessControl}</h2>
        <form onSubmit={handleAddEmail} className="flex gap-3 mb-6">
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
                  onClick={() => handleDeleteEmail(email.id)}
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

      <div className="h-px bg-gray-100 w-full" />

      {/* Group Members Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Участники группы</h2>
        <p className="text-gray-500 text-sm mb-6">Пользователи в этом списке будут видеть все чеки вашей группы.</p>
        <form onSubmit={handleAddMember} className="flex gap-3 mb-6">
          <input
            type="email"
            value={newMemberEmail}
            onChange={e => setNewMemberEmail(e.target.value)}
            placeholder="Email участника группы..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
            required
          />
          <button
            type="submit"
            disabled={isAddingMember}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isAddingMember ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Добавить
          </button>
        </form>

        <div className="space-y-2">
          {groupMembers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">В вашей группе пока нет участников</p>
          ) : (
            groupMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">{member.email}</span>
                  {member.name && <span className="text-xs text-gray-400">{member.name}</span>}
                </div>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  disabled={deletingMemberId === member.id}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingMemberId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
