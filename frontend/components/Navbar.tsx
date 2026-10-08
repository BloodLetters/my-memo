"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Plus,
  LogOut,
  CheckSquare,
  Archive,
  Menu,
  X,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  username?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (c: string) => void;
  availableCategories: string[];
  sortBy: string;
  onSortByChange: (s: string) => void;
  archiveCount: number;
  onOpenArchive: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
}

export default function Navbar({
  username,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  availableCategories,
  sortBy,
  onSortByChange,
  archiveCount,
  onOpenArchive,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenCreateModal,
  onLogout,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const hasActiveFilters =
    priorityFilter !== "ALL" || categoryFilter !== "ALL" || searchQuery.trim() !== "";

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 transition-colors">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2 sm:gap-4">
          
          {/* Logo & Brand & Desktop AI Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm">
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex items-baseline">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm sm:text-base">
                MyMemo
              </span>
              <span className="hidden md:inline-block ml-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium border-l border-zinc-200 dark:border-zinc-700 pl-2">
                Custom Board
              </span>
            </div>

            {/* Desktop Toggle AI Sidebar */}
            <button
              onClick={onToggleAiSidebar}
              className={`hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs cursor-pointer ${
                isAiSidebarOpen
                  ? "bg-purple-600 text-white border-purple-600 dark:bg-purple-600 dark:border-purple-500"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60"
              }`}
              title="Toggle Panel AI di sisi kiri"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tugas, kategori, atau tag..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Desktop & Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Desktop Filters Dropdowns */}
            <div className="relative hidden lg:flex items-center">
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilterChange(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {availableCategories.length > 0 && (
              <div className="relative hidden lg:flex items-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilterChange(e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 cursor-pointer transition-colors max-w-[140px] truncate"
                >
                  <option value="ALL">Semua Kategori</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative hidden xl:flex items-center">
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 cursor-pointer transition-colors"
              >
                <option value="order">Urutan Board</option>
                <option value="deadline">Deadline Terdekat</option>
                <option value="priority">Prioritas Tertinggi</option>
              </select>
            </div>

            {/* Desktop Archive Button */}
            <button
              onClick={onOpenArchive}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer"
              title="Buka Arsip Tugas"
            >
              <Archive className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Arsip</span>
              {archiveCount > 0 && (
                <span className="px-1.5 py-0.2 bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-full text-[10px] font-bold">
                  {archiveCount}
                </span>
              )}
            </button>

            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer ${
                isMobileSearchOpen ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
              }`}
              title="Cari Tugas"
              aria-label="Cari Tugas"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile AI Assistant Trigger Button */}
            <button
              onClick={onToggleAiSidebar}
              className={`md:hidden p-2 rounded-lg border transition-all cursor-pointer ${
                isAiSidebarOpen
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              }`}
              title="AI Assistant"
              aria-label="Buka AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Add Task Button (Compact on mobile) */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg transition-colors shadow-2xs cursor-pointer min-h-[34px]"
              title="Tambah Tugas Manual"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            {/* Desktop Profile & Logout */}
            <div className="hidden md:flex items-center ml-1 pl-2 border-l border-zinc-200 dark:border-zinc-800 gap-2">
              <div
                className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200 uppercase"
                title={`Login sebagai: ${username || "User"}`}
              >
                {(username || "U")[0]}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Menu & Filter"
              aria-label="Buka Menu"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {(hasActiveFilters || archiveCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>

          </div>
        </div>

        {/* Collapsible Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tugas, kategori, atau tag..."
                autoFocus
                className="w-full pl-9 pr-9 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide-Over / Drawer for Filters & Actions */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200 uppercase">
                  {(username || "U")[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {username || "User"}
                  </p>
                  <p className="text-[10px] text-zinc-400">Localhost Session</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Tutup Menu"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 text-xs">
              
              {/* Archive Menu Item */}
              <div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenArchive();
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium">
                    <Archive className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>Arsip Tugas</span>
                  </div>
                  {archiveCount > 0 && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-bold">
                      {archiveCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Priority Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  Filter Prioritas
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
                    <button
                      key={p}
                      onClick={() => onPriorityFilterChange(p)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border text-center font-medium transition-all cursor-pointer ${
                        priorityFilter === p
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                          : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {p === "ALL" ? "Semua" : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Category Section */}
              {availableCategories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    Filter Kategori
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => onCategoryFilterChange("ALL")}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                        categoryFilter === "ALL"
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                          : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      Semua
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => onCategoryFilterChange(cat)}
                        className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer truncate max-w-[140px] ${
                          categoryFilter === cat
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                            : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort By Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  Urutan Board
                </label>
                <div className="space-y-1">
                  {[
                    { value: "order", label: "Urutan Asli Board" },
                    { value: "deadline", label: "Deadline Terdekat" },
                    { value: "priority", label: "Prioritas Tertinggi" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => onSortByChange(s.value)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        sortBy === s.value
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                          : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset filter if any */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onSearchChange("");
                    onPriorityFilterChange("ALL");
                    onCategoryFilterChange("ALL");
                    onSortByChange("order");
                  }}
                  className="w-full py-2 text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline text-center"
                >
                  Reset Semua Filter
                </button>
              )}

            </div>

            {/* Drawer Footer: Logout */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
