<template lang="pug">
v-container
  EnterNameComponent(v-if="!userInfo.name")
  v-card(v-if="userInfo.name")
    v-card-title {{ userInfo.name }}
  v-card.mt-4(v-if="userInfo.name")
    ModalFormCreateRoom
</template>

<script>
  import {
    mapState,
    // mapMutations,
    mapActions
  } from 'vuex'

  // import HelloWorld from '../components/HelloWorld'
  import ModalFormCreateRoom from '../components/ModalFormCreateRoom.vue'
  import EnterNameComponent from '../components/EnterNameComponent.vue'

  export default {
    name: 'Home',
    components: {
      // HelloWorld,
      ModalFormCreateRoom,
      EnterNameComponent
    },
    computed: {
      ...mapState([
        'userInfo'
      ])
    },
    methods: {
      ...mapActions([
        'getName'
      ])
    },
    async mounted () {
      await this.getName()
      if (this.userInfo.user_id && this.$route.query.room_id)
        this.$router.push(`/room/${this.$route.query.room_id}`)
    }
  }
</script>
