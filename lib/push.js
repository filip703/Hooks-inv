import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BK0H1a0J5L0LaF4ozcu90kuSSvVmngVnz3Kju-K0sNjNHmvQ9L3i44_8e2EH3DCoRJDix5jVdr8_379mGPCSYtM'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export async function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getSubscriptionStatus() {
  if (!(await isPushSupported())) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'default') return 'default'
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'subscribed' : 'granted-not-subscribed'
  } catch { return 'default' }
}

export async function subscribeToPush(playerId) {
  if (!(await isPushSupported())) throw new Error('Push not supported')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission denied')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
  }

  const json = sub.toJSON()
  await supabase.from('inv_push_subscriptions').upsert({
    player_id: playerId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent
  }, { onConflict: 'player_id,endpoint' })
  return true
}

export async function unsubscribeFromPush(playerId) {
  if (!(await isPushSupported())) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('inv_push_subscriptions').delete().eq('player_id', playerId).eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
  } catch (err) { console.error('Unsubscribe error:', err) }
}

export async function sendPush({ title, body, url, type, excludePlayerId, targetPlayerId, prefKey }) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { title, body, url, type, exclude_player_id: excludePlayerId, target_player_id: targetPlayerId, pref_key: prefKey }
    })
  } catch (err) { console.error('Send push error:', err) }
}
