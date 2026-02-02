'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, List, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/accounting', label: 'ホーム', icon: Home },
  { href: '/accounting/add', label: '入力', icon: PlusCircle },
  { href: '/accounting/list', label: '履歴', icon: List },
  { href: '/accounting/settings', label: '設定', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on auth pages or if not in accounting section
  if (!pathname || !pathname.startsWith('/accounting') || pathname.startsWith('/accounting/login') || pathname.startsWith('/accounting/auth')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive ? 'text-[#4D7C0F]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
