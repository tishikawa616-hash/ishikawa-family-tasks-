'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  category: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDescription = tx.description?.toLowerCase().includes(query);
        const matchesCategory = tx.category.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesDescription && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // Date range filter
      if (dateFrom && tx.date < dateFrom) {
        return false;
      }
      if (dateTo && tx.date > dateTo) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, categoryFilter, dateFrom, dateTo]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map(tx => tx.category));
    return Array.from(categories);
  }, [transactions]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="検索（金額、メモ、カテゴリ）"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#78350F]/10 outline-none focus:border-[#4D7C0F] text-lg"
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 absolute left-4 top-3 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-[#4D7C0F] font-bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        フィルター
        {hasActiveFilters && <span className="bg-[#4D7C0F] text-white text-xs px-2 py-0.5 rounded-full">ON</span>}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm opacity-60 font-bold block mb-2">カテゴリ</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border-2 border-gray-200 outline-none"
            >
              <option value="all">すべて</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm opacity-60 font-bold block mb-2">開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border-2 border-gray-200 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm opacity-60 font-bold block mb-2">終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border-2 border-gray-200 outline-none"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-red-500 font-bold text-sm"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm opacity-60 font-bold">
        {filteredTransactions.length}件の記録
        {hasActiveFilters && ` (全${transactions.length}件中)`}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center opacity-60 font-bold shadow-sm">
            {hasActiveFilters ? '条件に一致する記録がありません' : 'まだ記録はありません'}
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <Link 
              key={tx.id} 
              href={`/accounting/transactions/${tx.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm opacity-60 font-bold">{tx.date}</span>
                  <span className="text-lg font-bold">{tx.category}</span>
                  {tx.description && (
                    <span className="text-sm opacity-50 mt-1 truncate max-w-[200px]">
                      {tx.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#78350F]">
                    ¥{tx.amount.toLocaleString()}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
