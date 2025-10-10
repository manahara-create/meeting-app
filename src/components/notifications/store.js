const LS_KEY = 'notifications.v1'
let notifications = []
const subscribers = new Set()

function load() {
  try { const raw = localStorage.getItem(LS_KEY); notifications = raw ? JSON.parse(raw) : [] }
  catch (_) { notifications = [] }
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(notifications)) } catch (_) {} }
function emit() { const list = get(); const unread = unreadCount(); subscribers.forEach(cb => cb(list, unread)) }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,8)}` }

export function get() { return [...notifications].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) }
export function unreadCount() { return notifications.filter(n => !n.read).length }
export function add({ type='info', title, description, meta }) {
  const item = { id: uid(), type, title, description: description || null, meta: meta || null, createdAt: new Date().toISOString(), read: false }
  notifications.push(item); save(); emit(); return item.id
}
export function markRead(id, read=true) { const n = notifications.find(x => x.id === id); if (n) { n.read = read; save(); emit() } }
export function markAllRead() { notifications.forEach(n => n.read = true); save(); emit() }
export function remove(id) { notifications = notifications.filter(n => n.id !== id); save(); emit() }
export function clear() { notifications = []; save(); emit() }
export function onChange(cb) { subscribers.add(cb); cb(get(), unreadCount()); return () => subscribers.delete(cb) }
load()