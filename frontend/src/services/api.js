import db from 'utils/localstorage'

function request (path, options) {
  const token = db.get('USER_TOKEN', '')
  const headers = {'Content-Type': 'application/json'}
  if (token) headers.Authorization = 'Bearer ' + token
  return fetch('/api' + path, {
    method: (options && options.method) || 'GET',
    headers,
    body: options && options.body ? JSON.stringify(options.body) : undefined
  }).then(response => response.json().catch(() => ({})).then(payload => {
    if (!response.ok) {
      const error = new Error(payload.message || 'Request failed')
      error.status = response.status
      throw error
    }
    return payload
  }))
}

export function apiGet (path) {
  return request(path)
}

export function apiPost (path, body) {
  return request(path, {method: 'POST', body: body || {}})
}
