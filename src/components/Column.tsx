'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Item, Participant } from '@/types';
import { SortableItem } from './SortableItem';

interface ColumnProps {
  id: string;
  title: string;
  items: Item[];
  total: number;
  participants: Participant[];
  onAssignItem: (itemId: string, participantId: string) => void;
}

export function Column({ id, title, items, total, participants, onAssignItem }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Sort items by category to match DOM rendering order for SortableContext
  const sortedItems = [...items].sort((a, b) => {
    const catA = a.category || 'Uncategorized';
    const catB = b.category || 'Uncategorized';
    return catA.localeCompare(catB);
  });

  // Group items by category for rendering
  const groupedItems = sortedItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  // Sort categories alphabetically
  const categories = Object.keys(groupedItems).sort();

  return (
    <div
      className={`flex flex-col w-80 min-w-80 h-[calc(100vh-12rem)] bg-gray-50/50 rounded-2xl border ${
        isOver ? 'border-primary/50 bg-primary/5 shadow-inner' : 'border-gray-200/50'
      } transition-colors duration-200`}
    >
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/50 rounded-t-2xl backdrop-blur-sm">
        <h3 className="font-semibold text-gray-800 tracking-tight">{title}</h3>
        <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-sm font-semibold text-gray-700">
          {total.toFixed(2)}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {categories.map((cat) => (
            <div key={cat} className="mb-4 last:mb-0">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                {cat}
              </div>
              <div className="space-y-2">
                {groupedItems[cat].map((item) => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    participants={participants} 
                    onAssignItem={onAssignItem} 
                  />
                ))}
              </div>
            </div>
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl min-h-[100px]">
            Перетащите сюда
          </div>
        )}
      </div>
    </div>
  );
}
