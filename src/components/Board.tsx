'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Item, Participant } from '@/types';
import { Column } from './Column';
import { SortableItem } from './SortableItem';
import { t } from '@/config/locales';

interface BoardProps {
  initialItems: Item[];
  participants: Participant[];
  onItemsChange?: (items: Item[]) => void;
}

export function Board({ initialItems, participants, onItemsChange }: BoardProps) {
  const [items, setItems] = useState<Item[]>(initialItems);

  // Sync state if initialItems change (e.g. new receipt uploaded)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const updateItems = (newItems: Item[]) => {
    setItems(newItems);
    onItemsChange?.(newItems);
  };

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getItemsByColumn = (columnId: string) => {
    return items.filter((item) => item.assignedTo === columnId);
  };

  const getColumnTotal = (columnId: string) => {
    return getItemsByColumn(columnId).reduce((sum, item) => sum + item.price, 0);
  };

  const columns = [
    ...participants.map((p) => ({ id: p.id, title: p.name })),
    { id: 'SHARED', title: t.board.shared },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Item'; // If we added types, but we just have items
    const isOverTask = over.data.current?.type === 'Item';

    // Logic to move item to a different column
    updateItems(
      items.map((item) => {
        if (item.id === activeId) {
          const isOverColumn = columns.some((c) => c.id === overId);
          if (isOverColumn) {
            return { ...item, assignedTo: overId as string };
          }
          const overItem = items.find((i) => i.id === overId);
          if (overItem) {
            return { ...item, assignedTo: overItem.assignedTo };
          }
        }
        return item;
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  const handleAssignItem = (itemId: string, participantId: string) => {
    updateItems(items.map((i) => (i.id === itemId ? { ...i, assignedTo: participantId } : i)));
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
        {participants.map((p) => {
          const colItems = getItemsByColumn(p.id);
          const total = colItems.reduce((sum, item) => sum + item.price, 0);
          return (
            <div key={p.id} className="snap-start shrink-0">
              <Column id={p.id} title={p.name} items={colItems} total={total} participants={participants} onAssignItem={handleAssignItem} />
            </div>
          );
        })}
        
        {/* Fixed Shared Column at the far right */}
        <div className="snap-start shrink-0">
          <Column 
            id="SHARED" 
            title={t.analytics.shared} 
            items={getItemsByColumn('SHARED')} 
            total={getItemsByColumn('SHARED').reduce((sum, item) => sum + item.price, 0)} 
            participants={participants} 
            onAssignItem={handleAssignItem}
          />
        </div>
        <DragOverlay>
          {activeItem ? <SortableItem item={activeItem} participants={participants} onAssignItem={handleAssignItem} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
