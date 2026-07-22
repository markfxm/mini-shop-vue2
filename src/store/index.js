import Vue from 'vue'
import Vuex from 'vuex'
import {
  addCartItem,
  getCartItems,
  getProducts,
  removeCartItem,
  updateCartItem,
} from '../api/shop'

Vue.use(Vuex)

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback
}

export default new Vuex.Store({
  state: {
    products: [],
    totalProducts: 0,
    currentPage: 1,
    pageSize: 8,
    keyword: '',
    cartItems: [],
    productsLoading: false,
    cartLoading: false,
    productsError: '',
    cartError: '',
    addingProductId: null,
    cartItemLoadingIds: [],
  },

  getters: {
    cartCount: (state) => state.cartItems.length,
    selectedCount: (state) => state.cartItems.filter((item) => item.selected).length,
    selectedTotal: (state) => state.cartItems
      .filter((item) => item.selected)
      .reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    allSelected: (state) => state.cartItems.length > 0 && state.cartItems.every((item) => item.selected),
    someSelected: (state) => state.cartItems.some((item) => item.selected),
    isCartEmpty: (state) => state.cartItems.length === 0,
    isCartItemLoading: (state) => (id) => state.cartItemLoadingIds.includes(id),
  },

  mutations: {
    SET_PRODUCTS(state, payload) {
      state.products = payload.list
      state.totalProducts = payload.total
      state.currentPage = payload.page
      state.pageSize = payload.pageSize
    },
    SET_PRODUCT_QUERY(state, { page, keyword }) {
      state.currentPage = page
      state.keyword = keyword
    },
    SET_PRODUCTS_LOADING(state, value) {
      state.productsLoading = value
    },
    SET_PRODUCTS_ERROR(state, message) {
      state.productsError = message
    },
    SET_CART_ITEMS(state, items) {
      state.cartItems = items
    },
    SET_CART_LOADING(state, value) {
      state.cartLoading = value
    },
    SET_CART_ERROR(state, message) {
      state.cartError = message
    },
    SET_ADDING_PRODUCT_ID(state, id) {
      state.addingProductId = id
    },
    SET_CART_ITEM_LOADING(state, { id, loading }) {
      const index = state.cartItemLoadingIds.indexOf(id)
      if (loading && index === -1) {
        state.cartItemLoadingIds.push(id)
      } else if (!loading && index !== -1) {
        state.cartItemLoadingIds.splice(index, 1)
      }
    },
    UPDATE_CART_ITEM(state, item) {
      const index = state.cartItems.findIndex((cartItem) => cartItem.id === item.id)
      if (index !== -1) {
        Vue.set(state.cartItems, index, item)
      }
    },
    ADD_CART_ITEM(state, item) {
      state.cartItems.push(item)
    },
    REMOVE_CART_ITEM(state, id) {
      state.cartItems = state.cartItems.filter((item) => item.id !== id)
    },
  },

  actions: {
    async fetchProducts({ commit }, params = {}) {
      const page = params.page
      const keyword = params.keyword
      commit('SET_PRODUCT_QUERY', { page, keyword })
      commit('SET_PRODUCTS_LOADING', true)
      commit('SET_PRODUCTS_ERROR', '')

      try {
        const response = await getProducts({ page, pageSize: 8, keyword })
        commit('SET_PRODUCTS', response.data.data)
      } catch (error) {
        commit('SET_PRODUCTS_ERROR', getErrorMessage(error, '商品加载失败，请稍后重试'))
      } finally {
        commit('SET_PRODUCTS_LOADING', false)
      }
    },

    async fetchCartItems({ commit }) {
      commit('SET_CART_LOADING', true)
      commit('SET_CART_ERROR', '')

      try {
        const response = await getCartItems()
        commit('SET_CART_ITEMS', response.data.data)
      } catch (error) {
        commit('SET_CART_ERROR', getErrorMessage(error, '购物车加载失败，请稍后重试'))
      } finally {
        commit('SET_CART_LOADING', false)
      }
    },

    async addToCart({ state, commit }, product) {
      commit('SET_ADDING_PRODUCT_ID', product.id)

      try {
        const existing = state.cartItems.find((item) => item.productId === product.id)
        if (existing) {
          const response = await updateCartItem(existing.id, { quantity: existing.quantity + 1 })
          commit('UPDATE_CART_ITEM', response.data.data)
          return response.data.data
        }

        const response = await addCartItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        })
        commit('ADD_CART_ITEM', response.data.data)
        return response.data.data
      } finally {
        commit('SET_ADDING_PRODUCT_ID', null)
      }
    },

    async updateCartItem({ commit }, { id, payload }) {
      commit('SET_CART_ITEM_LOADING', { id, loading: true })

      try {
        const response = await updateCartItem(id, payload)
        commit('UPDATE_CART_ITEM', response.data.data)
        return response.data.data
      } finally {
        commit('SET_CART_ITEM_LOADING', { id, loading: false })
      }
    },

    async setAllSelected({ state, dispatch }, selected) {
      const changedItems = state.cartItems.filter((item) => item.selected !== selected)

      try {
        await Promise.all(changedItems.map((item) => dispatch('updateCartItem', {
          id: item.id,
          payload: { selected },
        })))
      } catch (error) {
        await dispatch('fetchCartItems')
        throw error
      }
    },

    async deleteCartItem({ commit }, id) {
      commit('SET_CART_ITEM_LOADING', { id, loading: true })

      try {
        await removeCartItem(id)
        commit('REMOVE_CART_ITEM', id)
      } finally {
        commit('SET_CART_ITEM_LOADING', { id, loading: false })
      }
    },
  },
})
