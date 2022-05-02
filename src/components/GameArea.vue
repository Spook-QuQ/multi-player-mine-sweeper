<template lang="pug">
v-card
  div.d-flex.justify-center.flex-column.align-center.pa-8(
    v-if="gameData.tiles && gameData.tiles.length && gameData.tiles[0].length"
  )
    span.d-flex(v-for="(tilesArr, y) in gameData.tiles")
      TileButtonComponent(
        v-for="(tile, x) in tilesArr"
        :tileIndex="[y, x]"
        :state="tile.state"
        :miss="tile.miss"
        :openBy="tile.openBy"
      )
  ul.d-flex.ma-0
    li.mr-5(
      v-for="(user, i) in roomInfo.users"
      style="list-style: none"
    )
      //- pre {{ userInfo }}
      //- pre {{ user }}
      //- pre {{ roomInfo }}
      div.d-flex.align-center
        div.mr-2(:style="`display: block; width: 10px; height: 10px; background: ${ userColors[i] }`")
        span {{ user.name }}
      p.caption.mb-0 Exploded : {{ user.scores.exploded }}
      //- p Found bombs : {{ user.scores.foundBombs }}
      p.caption.caption.mb-0 Success Flagged : {{ user.scores.flagged }}
      p.caption.caption.mb-0 Miss Flagged : {{ user.scores.missFlagged }}
      p.caption.caption.mb-0 Opened Tiles : {{ user.scores.openedTiles }}
  //- pre {{ gameData.tiles }}
  //- pre {{ r }}
</template>

<script>
import {
  mapState,
  // mapMutations,
  mapActions
} from 'vuex'

import TileButtonComponent from '../components/TileButtonComponent.vue'

export default {
  data: () => ({

  }),
  components: {
    TileButtonComponent
  },
  computed: {
    ...mapState([
      'gameData',
      'roomInfo',
      'userInfo',
      'userColors'
    ])
  },
  methods: {
  }
}
</script>

<style lang="sass" scoped>
</style>
