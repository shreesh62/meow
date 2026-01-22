import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Smile, Calendar, MessageCircle } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-pastel-bg pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-pastel-pink/30 blur-3xl" />
        <div className="absolute top-40 -left-28 h-80 w-80 rounded-full bg-pastel-blue/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-pastel-lavender/30 blur-3xl" />
      </div>

      <main className="relative max-w-md mx-auto px-4 pt-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-5 left-0 right-0 z-50 px-6">
        <div className="mx-auto max-w-md">
          <div className="mx-auto w-fit rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/60 px-6 py-3">
            <div className="flex items-center gap-8">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-700'}`}>
                  <Smile size={22} />
                </div>
                <span className="text-[10px] font-semibold">Mood</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-700'}`}>
                  <Calendar size={22} />
                </div>
                <span className="text-[10px] font-semibold">Calendar</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/qna"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-700'}`}>
                  <MessageCircle size={22} />
                </div>
                <span className="text-[10px] font-semibold">Q&A</span>
              </>
            )}
          </NavLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
