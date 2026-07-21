<template>
  <section class="product-list" aria-labelledby="product-list-title">
    <div class="section-heading">
      <div>
        <h1 id="product-list-title">商品列表</h1>
        <p>所有商品数据均通过 Mock API 获取</p>
      </div>
      <el-input
        v-model="searchInput"
        class="product-search"
        clearable
        prefix-icon="el-icon-search"
        placeholder="搜索商品"
        aria-label="搜索商品"
        @input="handleSearchInput"
      />
    </div>

    <div v-if="productsLoading" class="product-grid" aria-live="polite">
      <div v-for="index in pageSize" :key="`skeleton-${index}`" class="product-card product-card--skeleton">
        <div class="skeleton-image" />
        <div class="skeleton-copy" />
        <div class="skeleton-copy skeleton-copy--short" />
      </div>
    </div>

    <el-alert
      v-else-if="productsError"
      class="state-message"
      :title="productsError"
      type="error"
      show-icon
      :closable="false"
    >
      <el-button type="text" @click="retryProducts">重新加载</el-button>
    </el-alert>

    <div v-else-if="!products.length" class="empty-state">
      <i class="el-icon-search empty-state__icon" />
      <strong>没有找到相关商品</strong>
      <span>换个关键词试试看</span>
    </div>

    <div v-else class="product-grid">
      <article v-for="product in products" :key="product.id" class="product-card">
        <div class="product-image-wrap">
          <img :src="product.image" :alt="product.name" class="product-image" />
        </div>
        <div class="product-card__body">
          <div class="product-card__title-row">
            <h2>{{ product.name }}</h2>
            <span class="stock">库存 {{ product.stock }}</span>
          </div>
          <div class="product-card__footer">
            <strong class="price">¥ {{ money(product.price) }}</strong>
            <el-button
              type="primary"
              :loading="addingProductId === product.id"
              :disabled="product.stock <= 0"
              @click="addToCart(product)"
            >
              {{ product.stock > 0 ? '加入购物车' : '暂时缺货' }}
            </el-button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="totalProducts > pageSize && !productsLoading && !productsError" class="pagination-row">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalProducts"
        @current-change="handlePageChange"
      />
      <span class="page-total">共 {{ totalProducts }} 件商品</span>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ProductList',
  data() {
    return {
      searchInput: this.$store.state.keyword,
      searchTimer: null,
    }
  },
  computed: {
    ...mapState([
      'products',
      'totalProducts',
      'currentPage',
      'pageSize',
      'productsLoading',
      'productsError',
      'addingProductId',
    ]),
  },
  created() {
    this.fetchProducts(1, this.searchInput)
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
  },
  methods: {
    fetchProducts(page, keyword) {
      return this.$store.dispatch('fetchProducts', { page, keyword })
    },
    handleSearchInput(value) {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.fetchProducts(1, value)
      }, 250)
    },
    handlePageChange(page) {
      this.fetchProducts(page, this.searchInput)
    },
    retryProducts() {
      this.fetchProducts(this.currentPage, this.searchInput)
    },
    async addToCart(product) {
      try {
        await this.$store.dispatch('addToCart', product)
        this.$message.success(`${product.name} 已加入购物车`)
      } catch (error) {
        this.$message.error(error?.response?.data?.message || '加入购物车失败，请稍后重试')
      }
    },
    money(value) {
      return Number(value).toFixed(2)
    },
  },
}
</script>
