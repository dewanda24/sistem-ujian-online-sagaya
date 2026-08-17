"use client";

import { useState } from "react";
import {
  Award,
  Bell,
  CalendarDays,
  GraduationCap,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";

export type NotificationCategory = "all" | "exam" | "system" | "announcement";

export type StudentNotificationItem = {
  id: string;
  category: "exam" | "system" | "announcement";
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  actionUrl?: string;
};

interface StudentNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: StudentNotificationItem[];
  onMarkAllAsRead?: () => void;
}

export function StudentNotificationDrawer({
  isOpen,
  onClose,
  notifications: initialNotifications,
  onMarkAllAsRead,
}: StudentNotificationDrawerProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "exam") return n.category === "exam";
    if (activeTab === "system") return n.category === "system";
    if (activeTab === "announcement") return n.category === "announcement";
    return true;
  });

  const getIcon = (item: StudentNotificationItem) => {
    if (item.category === "exam") {
      if (item.title.toLowerCase().includes("dimulai")) {
        return <GraduationCap className="size-5 text-blue-600" />;
      }
      if (item.title.toLowerCase().includes("nilai")) {
        return <Award className="size-5 text-emerald-600" />;
      }
      return <CalendarDays className="size-5 text-indigo-600" />;
    }
    if (item.category === "announcement") {
      return <Megaphone className="size-5 text-amber-600" />;
    }
    return <Sparkles className="size-5 text-purple-600" />;
  };

  const getIconBg = (item: StudentNotificationItem) => {
    if (item.category === "exam") {
      if (item.title.toLowerCase().includes("dimulai")) {
        return "bg-blue-50 border-blue-100";
      }
      if (item.title.toLowerCase().includes("nilai")) {
        return "bg-emerald-50 border-emerald-100";
      }
      return "bg-indigo-50 border-indigo-100";
    }
    if (item.category === "announcement") {
      return "bg-amber-50 border-amber-100";
    }
    return "bg-purple-50 border-purple-100";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="size-5" />
            </button>
            <h2 className="text-base font-extrabold text-slate-900">
              Notifikasi
            </h2>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            Tandai semua dibaca
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 border-b border-slate-100 px-4 py-2.5 bg-slate-50/70">
          {[
            { id: "all", label: "Semua" },
            { id: "exam", label: "Ujian" },
            { id: "system", label: "Sistem" },
            { id: "announcement", label: "Pengumuman" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as NotificationCategory)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition-colors hover:bg-slate-50 ${
                  !item.isRead ? "bg-blue-50/30" : ""
                }`}
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${getIconBg(
                    item,
                  )}`}
                >
                  {getIcon(item)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Bell className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                Tidak ada notifikasi
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Kategori ini belum memiliki pengingat atau pengumuman baru.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
