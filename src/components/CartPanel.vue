<template>
  <!-- 购物车抽屉容器，控制购物车面板的打开和关闭。 -->
  <el-drawer
    title="购物车"
    :visible.sync="localVisible"
    direction="rtl"
    size="min(680px, 50vw)"
    :with-header="true"
    :wrapper-closable="true"
    custom-class="cart-drawer"
    @open="handleOpen"
  >
    <div class="cart-panel" aria-labelledby="cart-title">
      <!-- 购物车面板标题；关闭按钮使用抽屉组件自动生成的按钮。 -->
      <div class="cart-panel__header">
        <h2 id="cart-title">购物车</h2>
        <p class="cart-panel__subtitle">数量、勾选与删除操作均通过 Mock API 更新。</p>
      </div>

      <!-- 购物车内容区域，根据加载、错误和空购物车状态显示不同内容。 -->
      <div class="cart-panel__content">
        <!-- 正在加载购物车时，显示加载提示。 -->
        <div v-if="cartLoading" class="cart-state" aria-live="polite">
          <i class="el-icon-loading cart-state__icon" />
          <span>正在加载购物车...</span>
        </div>

        <!-- 加载购物车失败时，显示错误信息和重新加载按钮。 -->
        <el-alert
          v-else-if="cartError"
          class="cart-error"
          :title="cartError"
          type="error"
          show-icon
          :closable="false"
        >
          <el-button type="text" @click="loadCart">重新加载</el-button>
        </el-alert>

        <!-- 购物车为空时，显示空购物车提示。 -->
        <div v-else-if="isCartEmpty" class="cart-state">
          <i class="el-icon-shopping-cart-2 cart-state__icon" />
          <strong>购物车还是空的</strong>
          <span>把喜欢的商品加入购物车吧</span>
        </div>

        <!-- 购物车有商品时，显示选择工具栏和商品明细。 -->
        <template v-else>
          <!-- 商品选择工具栏，支持全选并显示已选商品数量。 -->
          <div class="selection-toolbar">
            <el-checkbox
              :value="allSelected"
              :indeterminate="someSelected && !allSelected"
              @change="toggleAll"
            >
              全选
            </el-checkbox>
            <span>已选 {{ selectedCount }} 件商品</span>
          </div>

          <!-- 商品明细列表，支持选择、调整数量和删除商品。 -->
          <div class="cart-items">
            <div class="cart-items__header" aria-hidden="true">
              <span />
              <span>商品</span>
              <span>单价</span>
              <span>数量</span>
              <span>小计</span>
            </div>

            <article v-for="item in cartItems" :key="item.id" class="cart-item">
              <!-- 商品选择区域：显示复选框并更新当前商品的勾选状态。 -->
              <div class="cart-item__selection">
                <el-checkbox
                  class="cart-item__checkbox"
                  :value="Boolean(item.selected)"
                  :disabled="isItemLoading(item.id)"
                  :aria-label="`选择${item.name}`"
                  @change="toggleItem(item, $event)"
                />
              </div>

              <!-- 商品信息区域：显示商品图片和商品名称。 -->
              <div class="cart-item__product">
                <img :src="item.image" :alt="item.name" class="cart-item__image" />
                <h3>{{ item.name }}</h3>
              </div>

              <!-- 商品单价区域：显示当前商品的单件价格。 -->
              <div class="cart-item__price">
                <span class="cart-item__unit-price">¥ {{ item.price }}</span>
              </div>

              <!-- 数量控制区域：支持减少、输入和增加商品数量。 -->
              <div class="quantity-control">
                <el-button
                  icon="el-icon-minus"
                  circle
                  :disabled="item.quantity <= 1 || isItemLoading(item.id)"
                  aria-label="减少数量"
                  @click="adjustQuantity(item, -1)"
                />
                <el-input-number
                  :value="item.quantity"
                  :min="1"
                  :controls="false"
                  :disabled="isItemLoading(item.id)"
                  aria-label="商品数量"
                  @change="changeQuantity(item, $event)"
                />
                <el-button
                  icon="el-icon-plus"
                  circle
                  :disabled="isItemLoading(item.id)"
                  aria-label="增加数量"
                  @click="adjustQuantity(item, 1)"
                />
              </div>

              <!-- 小计和删除区域：显示当前商品小计，并提供删除按钮。 -->
              <div class="cart-item__aside">
                <strong>¥ {{ item.price * item.quantity }}</strong>
                <button
                  type="button"
                  class="remove-button"
                  :disabled="isItemLoading(item.id)"
                  aria-label="删除商品"
                  @click="removeItem(item)"
                >
                  <i class="el-icon-delete" />
                </button>
              </div>
            </article>
          </div>
        </template>
      </div>

      <!-- 购物车有可结算商品时，显示已选金额和结算按钮。 -->
      <footer v-if="!cartLoading && !cartError && !isCartEmpty" class="cart-panel__footer">
        <div class="cart-total">
          <span>合计（已选 {{ selectedCount }} 件）</span>
          <strong>¥ {{ selectedTotal }}</strong>
        </div>
        <el-button class="checkout-button" type="primary" :disabled="selectedCount === 0" @click="checkout">
          结算
        </el-button>
      </footer>
    </div>
  </el-drawer>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'CartPanel',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localVisible: this.visible,
    }
  },
  computed: {
    ...mapState(['cartItems', 'cartLoading', 'cartError']),
    ...mapGetters(['selectedCount', 'selectedTotal', 'allSelected', 'someSelected', 'isCartEmpty', 'isCartItemLoading']),
  },
  watch: {
    visible(value) {
      this.localVisible = value
    },
    localVisible(value) {
      this.$emit('update:visible', value)
    },
  },
  created() {
    this.loadCart()
  },
  methods: {
    handleOpen() {
      this.loadCart()
    },
    loadCart() {
      return this.$store.dispatch('fetchCartItems')
    },
    isItemLoading(id) {
      return this.isCartItemLoading(id)
    },
    async toggleItem(item, selected) {
      try {
        await this.$store.dispatch('updateCartItem', { id: item.id, payload: { selected } })
      } catch (error) {
        this.$message.error('更新选中状态失败，请稍后重试')
      }
    },
    async toggleAll(selected) {
      try {
        await this.$store.dispatch('setAllSelected', selected)
      } catch (error) {
        this.$message.error('全选状态更新失败，请稍后重试')
      }
    },
    adjustQuantity(item, delta) {
      this.changeQuantity(item, Math.max(1, Number(item.quantity) + delta))
    },
    async changeQuantity(item, quantity) {
      const normalizedQuantity = Math.max(1, Number(quantity) || 1)
      if (normalizedQuantity === Number(item.quantity)) return

      try {
        await this.$store.dispatch('updateCartItem', {
          id: item.id,
          payload: { quantity: normalizedQuantity },
        })
      } catch (error) {
        this.$message.error('数量更新失败，请稍后重试')
      }
    },
    async removeItem(item) {
      try {
        await this.$store.dispatch('deleteCartItem', item.id)
        this.$message.success('商品已删除')
      } catch (error) {
        this.$message.error('删除失败，请稍后重试')
      }
    },
    checkout() {
      if (!this.selectedCount) {
        this.$message.warning('请先选择要结算的商品')
        return
      }
      this.$message.success('结算功能演示：订单已准备完成')
    },
  },
}
</script>
