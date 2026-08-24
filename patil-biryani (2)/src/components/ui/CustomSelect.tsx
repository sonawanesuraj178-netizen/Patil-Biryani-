import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption<T = any> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'cyan' | 'rose' | 'slate' | 'indigo' | 'purple' | 'blue';
  disabled?: boolean;
}

export interface CustomSelectProps<T = any> {
  value: T;
  onChange: (val: T) => void;
  options: SelectOption<T>[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  helperText?: string;
  error?: string;
  id?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

export function CustomSelect<T = any>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option...',
  disabled = false,
  searchable,
  className = '',
  buttonClassName = '',
  popoverClassName = '',
  size = 'md',
  icon,
  helperText,
  error,
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
    placement: 'bottom',
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Loose and strict match handling for strings/numbers
  const selectedOption = options.find(
    (opt) => opt.value === value || (value !== undefined && value !== null && String(opt.value) === String(value))
  );

  // If searchable is not explicitly set, automatically enable search if list has 6+ items
  const isSearchActive = searchable !== undefined ? searchable : options.length >= 6;

  // Calculate viewport coordinates so dropdown is never clipped and never covers upper text
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const spaceBelow = windowHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    // Prefer opening downward so the input button and upper label are completely unobstructed
    let placement: 'bottom' | 'top' = 'bottom';
    let maxHeight = Math.min(280, Math.max(140, spaceBelow));

    // Flip to top ONLY when space below is critically constrained (<160px) and above has adequate clearance
    if (spaceBelow < 160 && spaceAbove > spaceBelow && spaceAbove >= 180) {
      placement = 'top';
      maxHeight = Math.min(280, spaceAbove);
    }

    // Keep dropdown inside viewport horizontally with minimum readable width
    let width = Math.max(rect.width, 160);
    let left = rect.left;
    if (left + width > windowWidth - 12) {
      left = Math.max(12, windowWidth - width - 12);
    }

    setPosition({
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      left,
      width,
      maxHeight,
      placement,
    });
  }, []);

  // Update position whenever opened or on scroll/resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchActive) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, isSearchActive]);

  // Filter options if searchable
  const filteredOptions = isSearchActive && searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (typeof opt.value === 'string' && opt.value.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs rounded-xl min-h-[38px]',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-xl min-h-[44px]',
    lg: 'px-4 py-3 text-sm sm:text-base rounded-2xl min-h-[48px]',
  };

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'indigo':
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`custom-select-container relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all outline-none border ${
          isOpen
            ? 'border-emerald-500/80 bg-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/40 text-slate-100'
            : 'border-white/10 hover:border-white/20 bg-slate-900/90 hover:bg-slate-900 text-slate-200'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-950/40' : 'cursor-pointer active:scale-[0.99]'
        } ${sizeClasses[size]} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="font-semibold text-slate-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${getBadgeClass(
                    selectedOption.badgeColor
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Render Portal Popover onto document.body to prevent clipping by overflow-hidden containers */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{
                  opacity: 0,
                  y: position.placement === 'bottom' ? -4 : 4,
                  scale: 0.98,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: position.placement === 'bottom' ? -4 : 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${position.width}px`,
                  maxHeight: `${position.maxHeight}px`,
                  transform: position.placement === 'top' ? 'translateY(-100%)' : 'none',
                  backgroundColor: '#020617',
                  zIndex: 999999,
                }}
                className={`custom-select-popover custom-dropdown-popover rounded-2xl border border-slate-700/90 shadow-[0_25px_60px_rgba(0,0,0,0.98)] ring-1 ring-white/15 p-1.5 flex flex-col overflow-hidden ${popoverClassName}`}
              >
                {/* Search Input */}
                {isSearchActive && (
                  <div className="p-1 pb-2 border-b border-slate-800 mb-1 shrink-0 bg-slate-950">
                    <div className="relative flex items-center">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search options..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 text-slate-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Options List */}
                <div
                  className="overflow-y-auto space-y-1 pr-0.5 custom-scrollbar flex-1 bg-slate-950"
                  style={{ maxHeight: `${position.maxHeight - (isSearchActive ? 52 : 16)}px` }}
                >
                  {filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching options found
                    </div>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected =
                        opt.value === value ||
                        (value !== undefined && value !== null && String(opt.value) === String(value));

                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          disabled={opt.disabled}
                          onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                          }}
                          className={`custom-dropdown-option w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                              : opt.disabled
                              ? 'opacity-40 cursor-not-allowed text-slate-500'
                              : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                            {opt.icon && (
                              <span className={`shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {opt.icon}
                              </span>
                            )}
                            <div className="truncate">
                              <div className="truncate font-medium">{opt.label}</div>
                              {opt.sublabel && (
                                <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                  {opt.sublabel}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {opt.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBadgeClass(
                                  opt.badgeColor
                                )}`}
                              >
                                {opt.badge}
                              </span>
                            )}
                            {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0 stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-400 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
