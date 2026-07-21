import http from './http'

export function getProducts(params = {}) {
  return http.get('/products', { params })
}

export function getCartItems() {
  return http.get('/cart-items')
}

export function addCartItem(data) {
  return http.post('/cart-items', data)
}

export function updateCartItem(id, payload) {
  return http.patch(`/cart-items/${id}`, payload)
}

export function removeCartItem(id) {
  return http.delete(`/cart-items/${id}`)
}
