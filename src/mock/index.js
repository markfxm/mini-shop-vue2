import MockAdapter from 'axios-mock-adapter'
import http from '../api/http'

const products = [
  { id: 1, name: '机械键盘', price: 299, stock: 12, image: 'https://picsum.photos/seed/keyboard/640/420' },
  { id: 2, name: '无线鼠标', price: 129, stock: 20, image: 'https://picsum.photos/seed/mouse/640/420' },
  { id: 3, name: '降噪耳机', price: 499, stock: 8, image: 'https://picsum.photos/seed/headphones/640/420' },
  { id: 4, name: '显示器支架', price: 189, stock: 15, image: 'https://picsum.photos/seed/monitorstand/640/420' },
  { id: 5, name: '便携固态硬盘', price: 459, stock: 9, image: 'https://picsum.photos/seed/ssd/640/420' },
  { id: 6, name: '桌面音箱', price: 239, stock: 18, image: 'https://picsum.photos/seed/speaker/640/420' },
  { id: 7, name: '笔记本电脑支架', price: 159, stock: 25, image: 'https://picsum.photos/seed/laptopstand/640/420' },
  { id: 8, name: 'Type-C 扩展坞', price: 269, stock: 11, image: 'https://picsum.photos/seed/usbchub/640/420' },
  { id: 9, name: '电竞鼠标垫', price: 89, stock: 36, image: 'https://picsum.photos/seed/mousepad/640/420' },
  { id: 10, name: '1080P 摄像头', price: 199, stock: 14, image: 'https://picsum.photos/seed/webcam/640/420' },
  { id: 11, name: '蓝牙数字键盘', price: 139, stock: 17, image: 'https://picsum.photos/seed/numpad/640/420' },
  { id: 12, name: '智能台灯', price: 219, stock: 22, image: 'https://picsum.photos/seed/desklamp/640/420' },
  { id: 13, name: '无线充电器', price: 119, stock: 30, image: 'https://picsum.photos/seed/charger/640/420' },
  { id: 14, name: '游戏手柄', price: 329, stock: 10, image: 'https://picsum.photos/seed/controller/640/420' },
  { id: 15, name: '便携显示器', price: 899, stock: 6, image: 'https://picsum.photos/seed/portablemonitor/640/420' },
  { id: 16, name: '数据线收纳盒', price: 49, stock: 40, image: 'https://picsum.photos/seed/cablebox/640/420' },
]

let nextCartId = 102
let cartItems = [
  {
    id: 101,
    productId: 1,
    name: '机械键盘',
    price: 299,
    quantity: 1,
    selected: true,
    image: 'https://picsum.photos/seed/keyboard/320/220',
  },
]

const mock = new MockAdapter(http, { delayResponse: 350 })
const ok = (data) => [200, { data }]

mock.onGet('/products').reply((config) => {
  const { page = 1, pageSize = 8, keyword = '' } = config.params || {}
  const normalizedKeyword = String(keyword).trim().toLowerCase()
  const filtered = products.filter((product) => product.name.toLowerCase().includes(normalizedKeyword))
  const normalizedPage = Math.max(Number(page) || 1, 1)
  const normalizedPageSize = Math.max(Number(pageSize) || 8, 1)
  const start = (normalizedPage - 1) * normalizedPageSize

  return ok({
    list: filtered.slice(start, start + normalizedPageSize),
    total: filtered.length,
    page: normalizedPage,
    pageSize: normalizedPageSize,
  })
})

mock.onGet('/cart-items').reply(() => ok(cartItems))

mock.onPost('/cart-items').reply((config) => {
  const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  const item = {
    id: nextCartId++,
    selected: true,
    ...payload,
  }
  cartItems.push(item)
  return ok(item)
})

mock.onPatch(/\/cart-items\/\d+$/).reply((config) => {
  const id = Number(config.url.split('/').pop())
  const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  const item = cartItems.find((cartItem) => cartItem.id === id)

  if (!item) {
    return [404, { message: '购物车商品不存在' }]
  }

  Object.assign(item, payload)
  return ok(item)
})

mock.onDelete(/\/cart-items\/\d+$/).reply((config) => {
  const id = Number(config.url.split('/').pop())
  cartItems = cartItems.filter((item) => item.id !== id)
  return [204]
})

export default mock
