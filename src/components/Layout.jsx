import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Smile, Calendar, MessageCircle, Settings } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-pastel-bg pb-24">
      <main className="max-w-md mx-auto p-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-pastel-blue transform scale-110' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Smile size={24} fill={window.location.pathname === '/dashboard' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-medium">Mood</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-pastel-blue transform scale-110' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Calendar size={24} />
            <span className="text-[10px] font-medium">History</span>
          </NavLink>

          <NavLink
            to="/qna"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-pastel-blue transform scale-110' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <MessageCircle size={24} />
            <span className="text-[10px] font-medium">Q&A</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
