<template lang="pug">
v-container
  //- pre {{ gameData }}
  //- pre {{ roomInfo }}
  //- pre {{ userInfo }}
  v-card
    v-card-title.pb-0 Room : {{ roomInfo && roomInfo.title }}
    v-card-text.caption.mt-0 {{ $route.params.room_id }}
  v-card(v-if="notFound").text-center
    //- pre {{ roomInfo }}

    v-card-title.d-flex.justify-center Room not found
    v-btn(@click="$router.push('/')") > Home

  v-card(
    v-if="userInfo.user_id && roomInfo.author && gameData.phase !== 'playing'"
  ).mt-4
    v-card-title Choose Level
    v-divider
    v-card-text.d-flex.flex-column(v-if="selectedLevel == null")
      v-btn.text-h5.font-weight-bold.my-2(
        style="text-transform: none"
        v-for="(level, i) in levels"
        @click="selectLevel(level.num)"
        :key="i"
        large
      ) {{ level.t }}
    v-card-text(v-else)
      h2.mb-4.text-center(v-if="levels[selectedLevel]") Level : {{ levels[selectedLevel].t }}
      div.d-flex.justify-center
        v-btn.mr-4(key="3" @click="selectedLevel = null") Back
        v-btn(key="4" @click="requestStartGame(selectedLevel)") Start
  GameArea(v-if="userInfo.user_id && gameData.phase === 'playing'")
  v-card(v-if="roomInfo.author && gameData.phase === 'playing'")
    v-card-text
      p Restart
      v-btn(
        v-for="level in levels"
        @click="requestResetGame(level.num)"
        small
      ) {{ level.t }}
</template>

<script>
import {
  mapState,
  // mapMutations,
  mapActions
} from 'vuex'

import GameArea from '../components/GameArea.vue'

export default {
  components: {
    GameArea
  },
  data: () => ({
    notFound: false,
    selectedLevel: null,
    levels: [
      { t: 'Beginner / 9x9 and 10 bombs', num: 0 },
      { t: 'Intermediate 16x16 and 40 bombs', num: 1},
      { t: 'Expert 30x16 and 99 bombs', num: 2}
    ]
  }),
  computed: {
    ...mapState(['roomInfo', 'userInfo', 'gameData', 'socket'])
  },
  methods: {
    ...mapActions([
      'getName',
      'requestRoomInfo',
      'requestStartGame',
      'deleteSocket',
      'connectSocket',
      'gameDataInitialize',
      'requestResetGame'
    ]),
    selectLevel (level) {
      this.selectedLevel = level
    }
  },
  async mounted () {
    if (!this.$route.params.room_id) return this.$router.push(`/`)
    const status = await this.requestRoomInfo(this.$route.params.room_id)
    // if (!this.userInfo.name) return this.$router.push(`/`)
    if (status === 404) this.notFound = true

    if (!this.userInfo.user_id && this.$route.params.room_id) {
      return this.$router.push({
        path: `/`,
        query: { room_id: this.$route.params.room_id }
      })
    }

    this.getName()
    await this.connectSocket()
    this.gameDataInitialize(this.$route.params.room_id)
  },
  beforeDestroy () {
    this.deleteSocket()
  }
}
</script>

<style lang="sass" scoped>
</style>
