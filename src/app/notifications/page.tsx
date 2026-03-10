'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { getNotifications, markNotificationAsRead } from '@/lib/database'
import { Notification } from '@/types/database'
import Link from 'next/link'
import {
  Bell, BellOff, Check, Loader2, ArrowLeft, Siren,
  Tent, Clock, AlertCircle, Droplets, CheckCheck
} from 'lucide-react'

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }

    const load = async () => {
      try {
        const data = await getNotifications(user.id)
        setNotifications(data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, router])

  const handleMarkRead = async (id: string) => {
    setMarkingRead(id)
    try {
      await markNotificationAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch {
      // silent
    } finally {
      setMarkingRead(null)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    for (const n of unread) {
      try {
        await markNotificationAsRead(n.id)
      } catch {
        // silent
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'emergency':
        return <Siren className="w-5 h-5 text-red-600" />
      case 'camp':
        return <Tent className="w-5 h-5 text-blue-600" />
      case 'reminder':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'request':
        return <Droplets className="w-5 h-5 text-pink-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'emergency': return 'bg-red-50'
      case 'camp': return 'bg-blue-50'
      case 'reminder': return 'bg-yellow-50'
      case 'request': return 'bg-pink-50'
      default: return 'bg-gray-50'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-gray-500 font-medium">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  notification.is_read
                    ? 'border-gray-100'
                    : 'border-red-200 shadow-md shadow-red-100/50'
                }`}
              >
                <div className="flex items-start gap-4 p-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getBgColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`font-semibold text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {notification.message && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                        )}
                      </div>
                      {!notification.is_read && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={markingRead === notification.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {markingRead === notification.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <BellOff className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              You&apos;ll receive notifications about blood requests, camp updates, and donation reminders.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
