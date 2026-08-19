"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Award,
  Bell,
  CalendarDays,
  GraduationCap,
  Megaphone,
  Sparkles,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getNotificationsAction, type AppNotificationCategory, type AppNotificationItem } from "@/features/notifications/actions";
import Link from "next/link";

interface GlobalNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalNotificationDrawer({
  isOpen,
  onClose,
}: GlobalNotificationDrawerProps) {
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNotificationCategory>("all");

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "exam") return n.category === "exam";
    if (activeTab === "system") return n.category === "system";
    if (activeTab === "announcement") return n.category === "announcement";
    return true;
  });

  const getIcon = (item: AppNotificationItem) => {
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
    if (item.category === "system" && item.priority === "high") {
      return <AlertCircle className="size-5 text-red-600" />;
    }
    return <Sparkles className="size-5 text-purple-600" />;
  };

  const getIconBg = (item: AppNotificationItem) => {
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
    if (item.category === "system" && item.priority === "high") {
      return "bg-red-50 border-red-100";
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Notifikasi</h2>
              <p className="text-sm text-slate-500">Pembaruan aktivitas Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-100 px-6">
          {[
            { id: "all", label: "Semua" },
            { id: "exam", label: "Ujian" },
            { id: "announcement", label: "Pengumuman" },
            { id: "system", label: "Sistem" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppNotificationCategory)}
              className={`relative py-4 text-[14px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-3">
          <span className="text-xs font-medium text-slate-500">
            {notifications.filter((n) => !n.isRead).length} Belum dibaca
          </span>
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Tandai semua dibaca
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`relative flex gap-4 border-b border-slate-50 p-6 transition-colors hover:bg-slate-50/80 ${
                  !item.isRead ? "bg-blue-50/30" : ""
                }`}
              >
                {!item.isRead && (
                  <div className="absolute top-8 left-2 size-2 rounded-full bg-blue-500" />
                )}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${getIconBg(
                    item,
                  )}`}
                >
                  {getIcon(item)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !item.isRead
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.message}
                  </p>
                  {item.actionUrl && (
                    <Link
                      href={item.actionUrl}
                      onClick={onClose}
                      className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                    >
                      Lihat detail &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-3 p-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Bell className="size-8" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Belum ada notifikasi</p>
                <p className="mt-1 text-sm text-slate-500">
                  Notifikasi terbaru akan muncul di sini.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
