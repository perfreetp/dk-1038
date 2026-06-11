import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  LayoutDashboard,
  FilePlus,
  ListChecks,
  Briefcase,
  ClipboardCheck,
  User,
  Send,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '数据概览' },
  { path: '/leads', icon: FilePlus, label: '线索收集' },
  { path: '/pending', icon: ListChecks, label: '待核实' },
  { path: '/workbench', icon: Briefcase, label: '编辑工作台', roles: ['editor', 'reviewer'] },
  { path: '/reviews', icon: ClipboardCheck, label: '发布审核', roles: ['reviewer'] },
  { path: '/publish', icon: Send, label: '发布管理', roles: ['reviewer'] },
];

export function Sidebar() {
  const location = useLocation();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-primary-light">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📁</span>
          创业尸体库
        </h1>
        <p className="text-xs text-gray-400 mt-1">线索协作平台</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-primary font-medium'
                      : 'text-gray-300 hover:bg-primary-light hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-primary-light">
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-primary-light"
          />
          <div>
            <p className="font-medium text-sm">{currentUser.name}</p>
            <p className="text-xs text-gray-400 capitalize">
              {currentUser.role === 'editor' ? '编辑' : currentUser.role === 'reviewer' ? '审核人' : '成员'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
