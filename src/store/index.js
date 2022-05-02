import Vue from 'vue'
import Vuex from 'vuex'

import axios from 'axios'

import io from 'socket.io-client'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userInfo: {
      name: '',
      user_id: null
    },
    roomInfo: {
      title: null,
      users: []
    },
    socket: null,
    gameData: {},
    phase: 'ready',
    userColors: [
      // '#FF82A9',
      '#ffaac5',
      '#B5F8FE',
      '#FBD87F',
      '#3AB795',
      '#BF69AD'
    ]
  },
  getters: {
  },
  mutations: {
    setName: (state, name) => state.userInfo.name = name,
    setUserId: (state, user_id) => state.userInfo.user_id = user_id,
    setUserPublicId: (state, user_public_id) => state.userInfo.user_public_id = user_public_id,
    setRoomInfo: (state, roomInfo) => state.roomInfo = roomInfo,
    setUsers: (state, users) => state.roomInfo.users = users,
    setSocket: (state, socket) => state.socket = socket,
    deleteSocket: state => state.socket = null,
    setGameData: (state, gameData) => state.gameData = gameData,
    setTileData: (state, tileCtx) => {
      const { bomb, state: _state, openBy, miss } = tileCtx.data

      state.gameData.tiles[tileCtx.y][tileCtx.x].bomb = bomb
      state.gameData.tiles[tileCtx.y][tileCtx.x].state = _state
      state.gameData.tiles[tileCtx.y][tileCtx.x].openBy = openBy
      state.gameData.tiles[tileCtx.y][tileCtx.x].miss = miss
    },
    // setPhase: (state, phase) => state.phase = phase
  },
  actions: {
    async setName (ctx, name) {
      if (!name) return
      const { data } = await axios.post('/setName', { name })
      ctx.commit('setName', data.name)
      ctx.commit('setUserId', data.user_id)
    },
    async getName (ctx) {
      const { data } = await axios.get('/getName')
      if (!data.name) return
      ctx.commit('setName', data.name)
      ctx.commit('setUserId', data.user_id)
      ctx.commit('setUserPublicId', data.user_public_id)
    },
    async requestCreateRoom (ctx, form) {
      const { data } = await axios.post('/createRoom', { form })
      return data.room_id
    },
    async requestRoomInfo (ctx, room_id) {
      const { data } = await axios.get('/roomInfo/' + room_id)
      if (data.status === 404) return 404
      ctx.commit('setRoomInfo', data)
    },
    async gameDataInitialize (ctx, room_id) {
      ctx.state.socket.emit('request update game data', { room_id }, gameData => {
        // console.log(gameData);
        if (gameData) ctx.commit('setGameData', gameData)
      })
    },
    async connectSocket (ctx)  {
      const socket = io()
      ctx.commit('setSocket', socket)

      const { userInfo, roomInfo } = ctx.state
      socket.emit('join room', { userInfo, roomInfo })
      // socket.on('phase', phase => {
      //
      // })
      socket.on('update game data', gameData => {
        // console.log(gameData);
        ctx.commit('setGameData', gameData)
      })
      socket.on('update tile', tileCtx => {
        ctx.commit('setTileData', tileCtx)
      })
      socket.on('update room users', users => {
        // console.log(users)
        ctx.commit('setUsers', users)
      })

      return socket
    },
    async deleteSocket (ctx) {
      if(ctx.state.socket) ctx.state.socket.emit('forceDisconnect')
      ctx.commit('deleteSocket')
    },
    async requestStartGame (ctx, level) {
      const { userInfo, roomInfo } = ctx.state

      if (!ctx.state.socket) return

      ctx.state.socket.emit('start game', { userInfo, roomInfo, level }, gameData => {
        ctx.commit('setGameData', gameData)
      })
    },
    async openTile (ctx, index) {
      const { userInfo, roomInfo } = ctx.state
      ctx.state.socket.emit('open tile', { index, userInfo, roomInfo })
    },
    async flagTile (ctx, index) {
      const { userInfo, roomInfo } = ctx.state
      ctx.state.socket.emit('flag tile', { index, userInfo, roomInfo })
    },
    async requestResetGame (ctx, level) {
      const { userInfo, roomInfo } = ctx.state
      ctx.state.socket.emit('reset game', { userInfo, roomInfo, level })
    }
  },
  modules: {
  }
})
