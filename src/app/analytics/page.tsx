import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { t } from '@/config/locales';
import Link from 'next/link';
import Image from 'next/image';
import { DeleteDraftButton } from '@/components/DeleteDraftButton';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }

  const group = await prisma.group.findFirst({
    where: { users: { some: { id: (session.user as any).id } } },
    include: {
      participants: true,
      receipts: {
        include: {
          items: {
            include: { assignedTo: true }
          }
        },
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!group || group.receipts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-8">{t.analytics.title}</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
          {t.analytics.emptyState}
        </div>
      </div>
    );
  }

  const settledReceipts = group.receipts.filter(r => r.isSettled);
  const draftReceipts = group.receipts.filter(r => !r.isSettled);

  // Group items by category across all settled receipts
  const settledItems = settledReceipts.flatMap(r => r.items);
  const categories = Array.from(new Set(settledItems.map(i => i.category || 'Uncategorized')));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-12">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t.analytics.title}</h1>
      
      {draftReceipts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.draftsTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {draftReceipts.map(receipt => {
              let images: string[] = [];
              if (receipt.imageUrl) {
                try {
                  const parsed = JSON.parse(receipt.imageUrl);
                  images = Array.isArray(parsed) ? parsed : [receipt.imageUrl];
                } catch {
                  images = [receipt.imageUrl];
                }
              }
              const thumbnail = images[0];
              const extraCount = images.length - 1;

              return (
              <div key={receipt.id} className="bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                <DeleteDraftButton id={receipt.id} />
                {thumbnail && (
                  <div className="relative w-full h-40 bg-gray-100">
                    <Image src={thumbnail} alt="Receipt Preview" fill className="object-cover" />
                    {extraCount > 0 && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-md">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-3">{receipt.date.toLocaleDateString()}</p>
                  <Link href={`/?draft=${receipt.id}`} className="block w-full text-center bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg text-sm font-medium transition-colors">
                    {t.analytics.continueSplitting}
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {settledReceipts.length > 0 && (
        <>
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.historyTitle}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const catItems = settledItems.filter(i => (i.category || 'Uncategorized') === cat);
                const totalSpent = catItems.reduce((sum, i) => sum + i.price, 0);

                return (
                  <div key={cat} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-gray-800">{cat}</h3>
                      <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">
                        {totalSpent.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {group.participants.map(p => {
                        const pItems = catItems.filter(i => i.assignedToId === p.id);
                        const pSpent = pItems.reduce((sum, i) => sum + i.price, 0);
                        
                        if (pSpent === 0) return null;
                        
                        return (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{p.name}</span>
                            <span className="font-medium text-gray-900">{pSpent.toFixed(2)}</span>
                          </div>
                        );
                      })}

                      {/* Shared items */}
                      {(() => {
                        const sharedItems = catItems.filter(i => i.assignedToId === null);
                        const sharedSpent = sharedItems.reduce((sum, i) => sum + i.price, 0);
                        if (sharedSpent === 0) return null;
                        
                        return (
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-500 font-medium">{t.analytics.shared}</span>
                            <span className="font-medium text-gray-900">{sharedSpent.toFixed(2)}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.historyReceiptsTitle}</h2>
            <div className="space-y-6">
              {settledReceipts.map(receipt => {
                let images: string[] = [];
                if (receipt.imageUrl) {
                  try {
                    const parsed = JSON.parse(receipt.imageUrl);
                    images = Array.isArray(parsed) ? parsed : [receipt.imageUrl];
                  } catch {
                    images = [receipt.imageUrl];
                  }
                }
                const thumbnail = images[0];
                const extraCount = images.length - 1;

                const sharedTotal = receipt.items.filter(i => i.assignedToId === null).reduce((sum, i) => sum + i.price, 0);
                const splitAmount = sharedTotal / group.participants.length;

                const balances = group.participants.map(p => {
                  const personalTotal = receipt.items.filter(i => i.assignedToId === p.id).reduce((sum, i) => sum + i.price, 0);
                  const owes = personalTotal + splitAmount;
                  const paid = p.id === receipt.payerId ? receipt.totalAmount : 0;
                  return { name: p.name, net: paid - owes };
                });

                return (
                  <div key={receipt.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                    {thumbnail && (
                      <div className="relative w-full md:w-48 h-48 bg-gray-100 shrink-0">
                        <Image src={thumbnail} alt="Receipt Preview" fill className="object-cover" />
                        {extraCount > 0 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-md">
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">{t.analytics.receiptFrom} {receipt.date.toLocaleDateString()}</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {balances.map(b => (
                          <div key={b.name} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between text-sm border border-gray-100">
                            <span className="font-medium text-gray-800">{b.name}</span>
                            <div className="text-right">
                              {b.net > 0 ? (
                                <span className="text-primary font-semibold">{t.settlement.getsBack} {b.net.toFixed(2)}</span>
                              ) : b.net < 0 ? (
                                <span className="text-rose-500 font-semibold">{t.settlement.owes} {Math.abs(b.net).toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400 font-semibold">{t.settlement.settled}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <details className="mt-6 group/details">
                        <summary className="text-sm text-primary font-medium cursor-pointer select-none list-none inline-block hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary/20">
                          <span className="group-open/details:hidden">Показать товары ↓</span>
                          <span className="hidden group-open/details:inline">Скрыть товары ↑</span>
                        </summary>
                        <div className="mt-4 grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                          {group.participants.map(p => {
                            const pItems = receipt.items.filter(i => i.assignedToId === p.id);
                            if (pItems.length === 0) return null;
                            return (
                              <div key={p.id}>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">{p.name}</h4>
                                <ul className="space-y-1.5">
                                  {pItems.map(item => (
                                    <li key={item.id} className="text-sm flex justify-between text-gray-600 bg-gray-50/50 px-2 py-1 rounded">
                                      <span className="truncate pr-3">{item.name}</span>
                                      <span className="shrink-0 font-medium">{item.price.toFixed(2)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                          
                          {(() => {
                            const sharedItems = receipt.items.filter(i => i.assignedToId === null);
                            if (sharedItems.length === 0) return null;
                            return (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">{t.analytics.shared}</h4>
                                <ul className="space-y-1.5">
                                  {sharedItems.map(item => (
                                    <li key={item.id} className="text-sm flex justify-between text-gray-600 bg-gray-50/50 px-2 py-1 rounded">
                                      <span className="truncate pr-3">{item.name}</span>
                                      <span className="shrink-0 font-medium">{item.price.toFixed(2)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
