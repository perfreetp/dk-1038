import React from 'react';
import { Bell, Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeads } from '../../contexts/AppContext';
import { Button } from '../common';

export function Header() {
  const { leads } = useLeads();
  const pendingCount = leads.filter(l => l.status === 'pending_verification').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索项目名称、关键词..."
            className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pendingCount > 0 && (
          <Link to="/pending">
            <Button variant="outline" size="sm">
              待核实 ({pendingCount})
            </Button>
          </Link>
        )}
        
        <Link to="/leads/new">
          <Button size="sm">
            <Plus size={18} className="mr-1" />
            新建线索
          </Button>
        </Link>

        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
