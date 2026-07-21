<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-mark">Mini Shop</div>
      <button
        class="cart-trigger"
        type="button"
        :aria-expanded="cartVisible.toString()"
        aria-label="打开购物车"
        @click="openCart"
      >
        <svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h2l1.4 9.1a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20 8H7.1" />
          <circle cx="10" cy="19" r="1.3" />
          <circle cx="17" cy="19" r="1.3" />
        </svg>
        <span>购物车</span>
        <span v-if="cartCount" class="cart-count">{{ cartCount }}</span>
      </button>
    </header>

    <main class="main-content">
      <ProductList />
    </main>

    <CartPanel :visible.sync="cartVisible" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ProductList from './components/ProductList.vue'
import CartPanel from './components/CartPanel.vue'

export default {
  name: 'App',
  components: { ProductList, CartPanel },
  data() {
    return {
      cartVisible: false,
    }
  },
  computed: {
    ...mapGetters(['cartCount']),
  },
  methods: {
    openCart() {
      this.cartVisible = true
    },
  },
}
</script>
