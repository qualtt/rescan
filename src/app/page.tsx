'use client'

import { useState, useEffect } from 'react'
import { Upload, Plus, X, Loader2 } from 'lucide-react'
import { Board } from '@/components/Board'
import { Item, Participant } from '@/types'
import { t } from '@/config/locales'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState<string>('1')

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');
    
    if (draftId) {
      setIsUploading(true);
      fetch(`/api/receipts/${draftId}`)
        .then(res => res.json())
        .then(data => {
          if (data.receipt) {
            setItems(data.receipt.items);
            setReceiptId(data.receipt.id);
            if (data.receipt.group?.participants?.length > 0) {
              setParticipants(data.receipt.group.participants);
              setPayerId(data.receipt.payerId || data.receipt.group.participants[0].id);
            }
          }
        })
        .catch(err => console.error('Failed to load draft:', err))
        .finally(() => setIsUploading(false));
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      const base64Images = await Promise.all(
        files.map((file) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
        }))
      )

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || t.alerts.parseError)
      }

      if (data.items) {
        setItems(data.items)
        setReceiptId(data.receiptId)
        if (data.participants && data.participants.length > 0) {
          setParticipants(data.participants)
          setPayerId(data.participants[0].id)
        }
      }
    } catch (error: any) {
      console.error('Failed to parse receipt:', error)
      alert(`${t.alerts.parseError}: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnd = (newItems: Item[]) => {
    setItems(newItems)
  }

  const addParticipant = () => {
    if (participants.length >= 6) return
    setParticipants([...participants, { id: Date.now().toString(), name: `Person ${participants.length + 1}` }])
  }

  const removeParticipant = (id: string) => {
    if (participants.length <= 1) return
    setParticipants(participants.filter(p => p.id !== id))
    // Move their items to shared
    setItems(items.map(item => item.assignedTo === id ? { ...item, assignedTo: 'SHARED' } : item))
    if (payerId === id) setPayerId(participants[0].id)
  }

  const updateParticipantName = (id: string, name: string) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, name } : p))
  }

  const calculateSettlement = () => {
    const sharedTotal = items.filter(i => i.assignedTo === 'SHARED').reduce((sum, i) => sum + i.price, 0)
    const splitAmount = sharedTotal / participants.length

    return participants.map(p => {
      const personalTotal = items.filter(i => i.assignedTo === p.id).reduce((sum, i) => sum + i.price, 0)
      const owes = personalTotal + splitAmount
      const paid = p.id === payerId ? items.reduce((sum, i) => sum + i.price, 0) : 0
      return { ...p, owes, paid, net: paid - owes }
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{t.upload.title}</h2>
          <p className="text-gray-500 max-w-sm mb-8">{t.upload.subtitle}</p>
          
          <label className={`relative cursor-pointer bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold shadow-md hover:bg-primary/90 transition-all hover:shadow-lg active:scale-95 flex items-center gap-2 ${isUploading ? 'opacity-80 cursor-not-allowed' : ''}`}>
            {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isUploading ? t.upload.analyzing : t.upload.chooseFile}
            <input 
              type="file" 
              multiple
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight text-gray-900">{t.board.manageParticipants}</h2>
              <button 
                onClick={addParticipant}
                disabled={participants.length >= 6}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {t.board.addParticipant}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {participants.map(p => (
                <div key={p.id} className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParticipantName(p.id, e.target.value)}
                    className="bg-transparent px-3 py-1.5 text-sm font-medium outline-none w-24 focus:bg-white focus:ring-1 focus:ring-primary"
                  />
                  {participants.length > 1 && (
                    <button 
                      onClick={() => removeParticipant(p.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-gray-100 transition-colors"
                      title={t.board.removeParticipant}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{t.board.splitItems}</h1>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">{t.board.whoPaid}</span>
                <select 
                  className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none font-medium"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={() => { setItems([]); setReceiptId(null); }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 hover:bg-gray-100 rounded-lg"
            >
              {t.board.startOver}
            </button>
          </div>

          <Board initialItems={items} participants={participants} onItemsChange={handleDragEnd} />

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t.settlement.summary}</h3>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/save-receipt', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ receiptId, items, payerId, participants })
                    });
                    if (res.ok) {
                      alert(t.alerts.saved);
                      setItems([]);
                      setReceiptId(null);
                    } else {
                      alert(t.alerts.saveError);
                    }
                  } catch (e) {
                    alert(t.alerts.saveError);
                  }
                }}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t.settlement.saveReceipt}
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {calculateSettlement().map(p => (
                <div key={p.id} className="bg-gray-50/50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <div className="text-right">
                    {p.net > 0 ? (
                      <span className="text-primary font-semibold">{t.settlement.getsBack} {p.net.toFixed(2)}</span>
                    ) : p.net < 0 ? (
                      <span className="text-rose-500 font-semibold">{t.settlement.owes} {Math.abs(p.net).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400 font-semibold">{t.settlement.settled}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
