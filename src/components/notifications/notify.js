import { notification } from 'antd'
import { add as addToStore } from './store'

function open(type, opts = {}) {
  const { title, description, key, duration, placement, log = true, meta } = opts
  const api = type in notification ? notification[type] : notification.open
  api({ message: title, description, key, duration: duration ?? 3, placement: placement ?? 'topRight' })
  if (log) addToStore({ type, title, description, meta })
}

async function promise(promiseLike, { loading = 'Working...', success = 'Done', error = 'Failed', meta } = {}) {
  const key = 'p-' + Date.now()
  notification.open({ message: loading, key, duration: 0, placement: 'topRight' })
  try {
    const result = await promiseLike
    notification.success({ message: success, key, placement: 'topRight' })
    addToStore({ type: 'success', title: success, meta })
    return result
  } catch (e) {
    const desc = e?.message || String(e)
    notification.error({ message: error, description: desc, key, placement: 'topRight' })
    addToStore({ type: 'error', title: error, description: desc, meta })
    throw e
  }
}

export const notify = {
  open: (opts) => open('open', opts),
  success: (opts) => open('success', opts),
  info: (opts) => open('info', opts),
  warning: (opts) => open('warning', opts),
  error: (opts) => open('error', opts),
  promise
}