<template lang="pug">
v-card.px-4.d-flex.align-center(
  v-if="!userInfo.name"
)
  v-text-field(label="Please enter your name" v-model="nameInput")
  v-btn(
    small
    outlined
    @click="setName(nameInput)"
  ) Confirm
</template>

<script>
import {
  mapState,
  // mapMutations,
  mapActions
} from 'vuex'

export default {
  data: () => ({
    nameInput: ''
  }),
  methods: {
    ...mapActions([
      'setName'
    ])
  },
  computed: {
    ...mapState([
      'userInfo'
    ])
  },
  beforeDestroy () {
    if (this.$route.query.room_id) this.$router.push(`/room/${this.$route.query.room_id}`)
  }
}
</script>

<style lang="sass" scoped>
</style>
