'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item, Participant } from '@/types';
import { GripVertical } from 'lucide-react';
import { t } from '@/config/locales';

interface SortableItemProps {
  item: Item;
  participants: Participant[];
  onAssignItem: (itemId: string, participantId: string) => void;
}

export function SortableItem({ item, participants, onAssignItem }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: item });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start p-3 mb-2 bg-white rounded-xl shadow-sm border border-gray-100/50 group ${
        isDragging ? 'opacity-50 ring-2 ring-primary scale-105 z-50 shadow-xl' : 'hover:shadow-md'
      } transition-shadow duration-200`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 -ml-1 mt-0.5 text-gray-300 hover:text-gray-500 rounded active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 ml-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-gray-800 leading-tight break-words">
              {item.name}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              {item.category || 'Uncategorized'}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors shrink-0">
            {item.price.toFixed(2)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <button 
            onPointerDown={(e) => { e.stopPropagation(); onAssignItem(item.id, 'SHARED'); }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${item.assignedTo === 'SHARED' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
          >
            {t.analytics.shared}
          </button>
          {participants.map(p => (
            <button 
              key={p.id}
              onPointerDown={(e) => { e.stopPropagation(); onAssignItem(item.id, p.id); }}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${item.assignedTo === p.id ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
