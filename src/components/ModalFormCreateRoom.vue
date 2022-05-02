<template lang="pug">
v-dialog(v-model="dialog")
  template(v-slot:activator="{ on, attrs }")
    v-btn(
      v-bind="attrs"
      v-on="on"
    ) Create Room
  v-card
    v-card-title Create Room
    v-divider
    v-card-text
      v-form(
        v-model="valid"
        ref="form"
      )
        v-text-field(
          label="Room Title"
          v-model="form.roomTitle"
          :rules="[v => !!v || 'Name is required']"
          required
        )
        v-btn(@click="requestCreate") Create
</template>

<script>
import {
  mapState,
  // mapMutations,
  mapActions
} from 'vuex'

export default {
  data: () => ({
    dialog: false,
    form: {
      roomTitle: ''
    },
    valid: false
  }),
  methods: {
    ...mapActions([
      'requestCreateRoom'
    ]),
    validate () {
      this.$refs.form.validate()
    },
    async requestCreate () {
      this.validate()
      if (!this.userInfo.name) return
      if (this.valid) {
        const room_id = await this.requestCreateRoom(this.form)
        if (room_id) this.$router.push(`/room/${room_id}`)
      }
    }
  },
  computed: {
    ...mapState([
      'userInfo'
    ])
  }
}
</script>

<style lang="sass" scoped>
</style>
