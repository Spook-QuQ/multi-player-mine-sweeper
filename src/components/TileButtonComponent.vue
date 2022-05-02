<template lang="pug">
button(
  v-if="!openBy"
  :class="[chars[state][2], miss ? 'miss' : '']"
  :style="`color: ${ chars[state][1] }; width: ${ size }px; height: ${ size }px; ${ openBy ? 'background:' + tileColor : ''}`"
  @mousedown.left="openTile(tileIndex)"
  @mousedown.right.prevent="flagTile(tileIndex)"
  @click.right.prevent
): span {{ chars[state][0] }}
button(
  v-else
  :class="[chars[state][2], miss ? 'miss' : '']"
  :style="`color: ${ chars[state][1] }; width: ${ size }px; height: ${ size }px; ${ openBy ? 'background:' + color : ''}`"
  @click.right.prevent
): span {{ chars[state][0] }}
</template>

<script>
import {
  mapState,
  // mapMutations,
  mapActions
} from 'vuex'

export default {
  props: {
    state: {
      type: Number,
      default: 10
    },
    miss: {
      type: Boolean,
      default: false
    },
    size: {
      type: Number,
      default: 32
    },
    bgColor: {
      type: String,
      default: 'gray'
    },
    tileIndex: {
      required: true
    },
    openBy: {
      type: String
    }
  },
  data: () => ({
    chars: {
      1: [ 1, 'blue', 'n'],
      2: [ 2, 'green', 'n' ],
      3: [ 3, 'red', 'n' ],
      4: [ 4, 'midnightblue', 'n' ],
      5: [ 5, 'brown', 'n' ],
      6: [ 6, 'darkcyan', 'n' ],
      7: [ 7, 'black', 'n' ],
      8: [ 8, 'darkgray', 'n' ],

      9: [ 9, null, 'n' ],

      0: [ null, null, 'b' ], // blank
      10: [ null , null, 'w' ], // wall
      11: [ '💣', null, 'bomb' ], // bomb
      12: [ '🚩', null, 'f' ], // flag
    },
    tileColor: null
  }),
  methods: {
    ...mapActions([
      'openTile',
      'flagTile'
    ])
  },
  computed: {
    ...mapState([
      'userInfo',
      'roomInfo',
      'userColors'
    ]),
    color () {
      if (!this.openBy) return
      const colorIndex = this.roomInfo.users.indexOf(this.roomInfo.users.find(user => {
        return user.user_public_id === this.openBy
      }))

      return this.userColors[colorIndex]
    }
  },
  update () {
  }
}
</script>

<style lang="sass" scoped>
  button
    position: relative
    font-weight: bolder
    font-size: 16px
    border: dashed 1px rgba(lightgray, 0.6)
    background: none
    display: flex
    justify-content: center
    align-items: center
    z-index: 1
    user-select: none
    span
      display: block
      justify-content: center
      position: absolute
      z-index: 2
    &.w, &.f
      background: darken(#EFEFEF, 2)
      border: solid 1px lightgray
      cursor: pointer
      &:hover
        background: mix(lightgray, gray)
    // &.bomb
    &.miss
      position: relative
      &:before
        position: absolute
        content: ''
        height: 10%
        width: 100%
        background: red
        display: block
        transform: rotate(45deg)
        z-index: 3
      &:after
        position: absolute
        content: ''
        height: 10%
        width: 100%
        background: red
        display: block
        transform: rotate(-45deg)
        z-index: 3

</style>
