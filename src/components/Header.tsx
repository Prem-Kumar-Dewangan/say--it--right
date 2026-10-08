import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  History, 
  Home, 
  PlusCircle, 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  Menu,
  X,
  ChevronRight,
  Plus
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'scenarios' | 'playbook' | 'history';
  setActiveTab: (tab: 'home' | 'scenarios' | 'playbook' | 'history') => void;
  savedCount: number;
  onNewMessage: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  savedCount,
  onNewMessage,
  onGoHome
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen && 
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Navigate and close drawer
  const handleNavSelect = (tab: 'home' | 'scenarios' | 'playbook' | 'history') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleMobileNewMessage = () => {
    onNewMessage();
    setMobileMenuOpen(false);
  };

  const handleMobileGoHome = () => {
    onGoHome();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Brand - Scaled for Mobile, Tablet, and Laptop */}
          <div 
            onClick={handleMobileGoHome} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleMobileGoHome()}
            aria-label="Say It Right home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-sm sm:text-base shadow-xs group-hover:bg-amber-800 transition-colors shrink-0">
              <span className="font-editorial italic text-base sm:text-lg">S</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-stone-900 tracking-tight text-sm sm:text-base lg:text-lg whitespace-nowrap">
                  Say It Right
                </span>
                {/* Badge hidden on tiny screens to prevent collision, visible on tablet & laptop */}
                <span className="hidden sm:inline-flex text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/90 rounded">
                  Your AI Assist
                </span>
              </div>
              {/* Tagline visible on laptop/desktop only for clean layout */}
              <p className="text-[11px] text-stone-500 hidden lg:block leading-tight truncate">
                Express hard things with empathy and confidence
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation (>= 768px - md and lg) */}
          <nav 
            className="hidden md:flex items-center gap-1 lg:gap-2"
            aria-label="Desktop navigation"
          >
            {/* Home Tab */}
            <button
              onClick={() => setActiveTab('home')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-stone-900 text-stone-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {/* Dedicated New Message Button */}
            <button
              onClick={onNewMessage}
              className="px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
              title="Start a fresh new message"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Message</span>
            </button>

            {/* Scenarios Tab */}
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scenarios'
                  ? 'bg-stone-900 text-stone-50 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Scenarios</span>
            </button>

            {/* Playbook Tab */}
            <button
              onClick={() => setActiveTab('playbook')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'playbook'
                  ? 'bg-stone-900 text-stone-50 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Playbook</span>
              <span className="lg:hidden">Rules</span>
            </button>

            {/* Saved Sessions Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 relative cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-stone-900 text-stone-50 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Saved Messages</span>
              <span className="lg:hidden">Saved</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-[10px] font-bold text-white flex items-center justify-center min-w-4 h-4">
                  {savedCount}
                </span>
              )}
            </button>

            {/* User Account / Login Button */}
            <div className="pl-2 ml-1 border-l border-stone-200 flex items-center gap-1.5">
              {user ? (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-medium cursor-pointer hover:bg-stone-200 transition-colors"
                    title={`Logged in as ${user.email} (click to view saved messages)`}
                  >
                    <div className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-all flex items-center gap-1.5 cursor-pointer border border-stone-200/90"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Right Controls (< 768px - md) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Quick "+ New" Message Action on Mobile Top Bar */}
            <button
              onClick={onNewMessage}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
              title="Start a fresh new message"
              aria-label="Start fresh new message"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Mobile User Profile or Auth Trigger */}
            {user ? (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-8 h-8 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center cursor-pointer shadow-2xs hover:ring-2 hover:ring-stone-400 transition-all"
                title={`Logged in as ${user.name}`}
                aria-label="Open user menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="p-1.5 rounded-lg text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
                title="Log In"
                aria-label="Log In"
              >
                <LogIn className="w-4 h-4 text-stone-700" />
              </button>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer relative"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              {savedCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down / Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden border-t border-stone-200 bg-white/98 backdrop-blur-lg shadow-xl animate-in slide-in-from-top-2 duration-200 px-4 py-4 space-y-4"
          >
            {/* User Profile Card in Mobile Menu */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
              {user ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-stone-500" />
                  <span className="text-xs text-stone-600">Not signed in</span>
                </div>
              )}

              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 bg-stone-900 text-stone-50 text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Navigation List with Descriptions */}
            <nav className="space-y-1">
              <button
                onClick={() => handleNavSelect('home')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-stone-900 text-stone-50 font-semibold'
                    : 'text-stone-800 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <div>
                    <div className="text-xs">Home</div>
                    <div className={`text-[10px] ${activeTab === 'home' ? 'text-stone-300' : 'text-stone-500'}`}>
                      AI Message Coach & Composer
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'home' ? 'text-stone-400' : 'text-stone-400'}`} />
              </button>

              <button
                onClick={() => handleNavSelect('scenarios')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'scenarios'
                    ? 'bg-stone-900 text-stone-50 font-semibold'
                    : 'text-stone-800 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className={`w-4 h-4 ${activeTab === 'scenarios' ? 'text-amber-400' : 'text-amber-500'}`} />
                  <div>
                    <div className="text-xs">Scenario Presets</div>
                    <div className={`text-[10px] ${activeTab === 'scenarios' ? 'text-stone-300' : 'text-stone-500'}`}>
                      Quick templates for apologies, boundaries & asks
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => handleNavSelect('playbook')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'playbook'
                    ? 'bg-stone-900 text-stone-50 font-semibold'
                    : 'text-stone-800 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className={`w-4 h-4 ${activeTab === 'playbook' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <div>
                    <div className="text-xs">Communication Playbook</div>
                    <div className={`text-[10px] ${activeTab === 'playbook' ? 'text-stone-300' : 'text-stone-500'}`}>
                      Core principles for empathy and assertiveness
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => handleNavSelect('history')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-stone-900 text-stone-50 font-semibold'
                    : 'text-stone-800 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-amber-400' : 'text-stone-500'}`} />
                  <div>
                    <div className="text-xs flex items-center gap-2">
                      <span>Saved Messages</span>
                      {savedCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-[10px] font-bold text-white">
                          {savedCount}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${activeTab === 'history' ? 'text-stone-300' : 'text-stone-500'}`}>
                      Review and copy past coached messages
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            </nav>

            {/* Quick action button inside mobile drawer */}
            <div className="pt-2 border-t border-stone-200">
              <button
                onClick={handleMobileNewMessage}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Fresh New Message</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px - md)
          Provides standard touch-friendly native-app navigation for mobile phones */}
      <nav 
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden transition-all"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Mobile bottom navigation"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1 max-w-md mx-auto">
          {/* Home */}
          <button
            onClick={() => handleNavSelect('home')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
            aria-label="Home"
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Home</span>
          </button>

          {/* Scenarios */}
          <button
            onClick={() => handleNavSelect('scenarios')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
            aria-label="Scenarios"
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'scenarios' ? 'bg-amber-100/70 text-amber-900' : ''}`}>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Scenarios</span>
          </button>

          {/* Central Prominent "+ New" Action Button */}
          <div className="flex flex-col items-center justify-center h-full py-1">
            <button
              onClick={handleMobileNewMessage}
              className="w-10 h-10 rounded-full bg-amber-500 active:bg-amber-400 text-stone-950 flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer -mt-3 ring-4 ring-white"
              title="Start a new message"
              aria-label="Start fresh new message"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-[9px] font-semibold text-stone-700 tracking-tight mt-0.5">New</span>
          </div>

          {/* Rules / Playbook */}
          <button
            onClick={() => handleNavSelect('playbook')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'playbook'
                ? 'text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
            aria-label="Playbook Rules"
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'playbook' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Rules</span>
          </button>

          {/* Saved Sessions */}
          <button
            onClick={() => handleNavSelect('history')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer relative ${
              activeTab === 'history'
                ? 'text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
            aria-label="Saved Sessions"
          >
            <div className={`p-1 rounded-lg transition-colors relative ${activeTab === 'history' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <History className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-amber-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Saved</span>
          </button>
        </div>
      </nav>
    </>
  );
};

