import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, Plus, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeBgClass } from '../lib/colors';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const avatarBg = normalizeBgClass(user?.avatar_color);
  const hideNav = location.pathname === '/add';

  return (
    <div className={`min-h-screen relative overflow-hidden bg-pastel-bg ${hideNav ? 'pb-8' : 'pb-28'}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-pastel-pink/30 blur-3xl" />
        <div className="absolute top-40 -left-28 h-80 w-80 rounded-full bg-pastel-blue/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-pastel-lavender/30 blur-3xl" />
      </div>

      <header className="relative max-w-md mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-2xl ${avatarBg} border border-white/60 shadow-sm`} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/qna')}
            className="h-11 w-11 rounded-2xl bg-white/70 border border-white/60 backdrop-blur-xl shadow-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all"
            aria-label="Q&A"
          >
            <HelpCircle size={20} />
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="h-11 w-11 rounded-2xl bg-white/70 border border-white/60 backdrop-blur-xl shadow-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="relative max-w-md mx-auto px-4">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="fixed bottom-5 left-0 right-0 z-50 px-6">
          <div className="mx-auto max-w-md">
            <div className="mx-auto w-fit rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/60 px-5 py-3">
              <div className="flex items-center gap-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-700'}`}>
                        <Home size={22} />
                      </div>
                      <span className="text-[10px] font-semibold">Home</span>
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/calendar"
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
                  to="/add"
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-900 text-white shadow-sm'}`}>
                        <Plus size={22} />
                      </div>
                      <span className="text-[10px] font-semibold">Add</span>
                    </>
                  )}
                </NavLink>
              </div>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
