import express from 'express';
import socketIO from "socket.io";

const rooms = {}

const levels = [
  [ 9, 9, 10 ],
  [ 16, 16, 40 ],
  [ 16, 30, 99 ]
]

const checkTarget = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  // [0, 0],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

export default (app, http) => {
  const { v4: uuidv4 } = require('uuid')

  const session = require('express-session')
  app.use(session({
    secret: 'sashisaiowoedfhisufhbesubjcszbdc7s68786tfcs78d7tcs8',
    resave: false,
    saveUninitialized: true,
    cookie: {
      // secure: true, // https にした時につける
      httpOnly: true
    }
  }))

  app.use(express.json())
  //
  app.get('/getName', (req, res) => {
    // res.json({msg: 'foo'});
    res.send({
      name: req.session.userName,
      user_id: req.session.user_id,
      user_public_id: req.session.user_public_id
    })
  })

  app.post('/setName', (req, res) => {
    if(!req.body.name) return

    const user_id = uuidv4()
    const user_public_id = uuidv4()

    req.session.user_id = user_id
    req.session.user_public_id = user_public_id
    req.session.userName = req.body.name

    res.send({
      name: req.session.userName,
      user_id: req.session.user_id,
      user_public_id: req.session.user_public_id
    })
  })

  app.post('/createRoom', (req, res) => {
    if (!req.body.form) return
    if (!req.body.form.roomTitle) return

    const room_id = uuidv4()

    rooms[room_id] = {
      title: req.body.form.roomTitle,
      users: [],
      author: req.session.user_id,
      gameData: {}
    }

    // req.session.joiningRooms = [room_id]

    res.send({
      room_id
    })
  })

  app.get('/roomInfo/:room_id', (req, res) => {
    if (!req.params.room_id) return
    if (!rooms[req.params.room_id]) return res.send({ status: 404 })

    const {
      title,
      author
    } = rooms[req.params.room_id]

    res.send({
      title,
      author: author === req.session.user_id,
      room_id: req.params.room_id,
      users: rooms[req.params.room_id].users.map(user => {
        const { user_public_id, name, scores } = user
        return { user_public_id, name, scores }
      })
    })
  })

  let io = socketIO(http);
  io.on("connection", socket => {

    const updateUsers = (roomInfo) => {
      const { room_id } = roomInfo
      io.to(room_id).emit(
        'update room users',
        rooms[room_id].users.map(user => {
          const { user_public_id, name, scores } = user
          return { user_public_id, name, scores }
        }
      ))
    }

    const updateGameData = roomInfo => {
      // console.log(roomInfo)
      if (!roomInfo.room_id) return
      if (!rooms[roomInfo.room_id]) return

      if (!rooms[roomInfo.room_id].gameData.tiles) return

      const tileDataForClient = rooms[roomInfo.room_id].gameData.tiles.map(tileArr => {
        return tileArr.map(tile => {
          const { state, openBy, miss } = tile
          return { state, openBy, miss }
        })
      })

      io.to(roomInfo.room_id).emit('update game data', {
        phase: rooms[roomInfo.room_id].gameData.phase,
        tiles: tileDataForClient
      })

      return {
        phase: rooms[roomInfo.room_id].gameData.phase,
        tiles: tileDataForClient
      }
    }

    socket.on('join room', (ctx) => {
      const { userInfo, roomInfo } = ctx
      socket.userName = userInfo.name
      socket.user_id = userInfo.user_id
      socket.user_public_id = userInfo.user_public_id
      socket.join(roomInfo.room_id)

      if (!rooms[roomInfo.room_id]) return

      if (!rooms[roomInfo.room_id].users.find(user => user.user_id === userInfo.user_id)) {

        const user = {
          user_public_id: userInfo.user_public_id,
          user_id: userInfo.user_id,
          name: userInfo.name,
          scores: {
            exploded: 0,
            // foundBombs: 0,
            flagged: 0,
            missFlagged: 0,
            openedTiles: 0
          }
        }

        // console.log(user)
        // console.log(userInfo)

        rooms[roomInfo.room_id].users.push(user)
        updateUsers(roomInfo)
      }

    })


    socket.on('start game', ctx => {
      const { userInfo, roomInfo, level } = ctx

      if (!roomInfo.room_id) return
      if (!rooms[roomInfo.room_id]) return

      //
      if (rooms[roomInfo.room_id].author !== userInfo.user_id) return

      rooms[roomInfo.room_id].gameData = {
        phase: 'playing',
        tiles: [...Array(levels[level][0])].map(() => {
          return [...Array(levels[level][1])].map(() => {
            return {
              bomb: false,
              state: 10,
              openBy: null,
              miss: false
            }
          })
        })
      }

      for (let i = 0; i < levels[level][2];) {
        const y = Math.floor(Math.random() * levels[level][0])
        const x = Math.floor(Math.random() * levels[level][1])

        if (rooms[roomInfo.room_id].gameData.tiles[y][x].bomb) continue

        rooms[roomInfo.room_id].gameData.tiles[y][x].bomb = true

        i++
      }

      updateGameData(roomInfo)

    })

    socket.on('request update game data', (roomInfo, fn) => {
      fn(updateGameData(roomInfo))
    })

    socket.on('open tile', ctx => {
      const { index, userInfo, roomInfo } = ctx

      if (!index || !userInfo || !roomInfo) return

      const [ y, x ] = index


      // {
      //   bomb: false,
      //   state: 10,
      //   openBy: null,
      //   miss: false
      // }

      if (rooms[roomInfo.room_id].gameData.tiles[y][x].bomb) {
        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .state = 11

        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .miss = true

        const user = rooms[roomInfo.room_id].users.find(user => {
          return user.user_id === socket.user_id
        })

        rooms[roomInfo.room_id].users[rooms[roomInfo.room_id].users.indexOf(user)]
          .scores.exploded += 1


      } else {
        const numOfBombs = checkTarget.reduce((count, target) => {
          if (
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]] &&
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]] &&
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]].bomb
          ) {
            // console.log(rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]].bomb);
            count += 1
          }
          return count
        }, 0)

        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .state = numOfBombs

        const user = rooms[roomInfo.room_id].users.find(user => {
          return user.user_id === socket.user_id
        })


        // console.log(roomInfo);
        // console.log(rooms[roomInfo.room_id].users);
        // console.log(rooms[roomInfo.room_id].users.indexOf(user));
        rooms[roomInfo.room_id].users[rooms[roomInfo.room_id].users.indexOf(user)]
          .scores.openedTiles += 1

      }

      rooms[roomInfo.room_id].gameData.tiles[y][x]
        .openBy = socket.user_public_id

      // console.log(rooms[roomInfo.room_id].gameData.tiles[y][x]);

      io.to(roomInfo.room_id).emit('update tile', {
        y, x,
        data: rooms[roomInfo.room_id].gameData.tiles[y][x]
      })
      updateUsers(roomInfo)
    })


    socket.on('flag tile', ctx => {
      const { index, userInfo, roomInfo } = ctx

      if (!index || !userInfo || !roomInfo) return

      const [ y, x ] = index

      if (rooms[roomInfo.room_id].gameData.tiles[y][x].bomb) {

        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .state = 12

        const user = rooms[roomInfo.room_id].users.find(user => {
          return user.user_id === socket.user_id
        })

        rooms[roomInfo.room_id].users[rooms[roomInfo.room_id].users.indexOf(user)]
          .scores.flagged += 1

      } else {

        const numOfBombs = checkTarget.reduce((count, target) => {
          if (
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]] &&
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]] &&
            rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]].bomb
          ) {
            // console.log(rooms[roomInfo.room_id].gameData.tiles[y + target[0]][x + target[1]].bomb);
            count += 1
          }
          return count
        }, 0)

        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .state = numOfBombs

        // rooms[roomInfo.room_id].gameData.tiles[y][x]
        //   .state = 12

        rooms[roomInfo.room_id].gameData.tiles[y][x]
          .miss = true

        const user = rooms[roomInfo.room_id].users.find(user => {
          return user.user_id === socket.user_id
        })

        rooms[roomInfo.room_id].users[rooms[roomInfo.room_id].users.indexOf(user)]
          .scores.missFlagged += 1

      }

      rooms[roomInfo.room_id].gameData.tiles[y][x]
        .openBy = socket.user_public_id

      // console.log(rooms[roomInfo.room_id].gameData.tiles[y][x]);

      io.to(roomInfo.room_id).emit('update tile', {
        y, x,
        data: rooms[roomInfo.room_id].gameData.tiles[y][x]
      })
      updateUsers(roomInfo)
    })

    socket.on('reset game', ctx => {
      const { userInfo, roomInfo, level } = ctx

      // console.log(roomInfo.room_id)
      // console.log(rooms[roomInfo.room_id])
      // console.log(rooms[roomInfo.room_id].author , userInfo.user_id)

      if (!roomInfo.room_id) return
      if (!rooms[roomInfo.room_id]) return

      if (rooms[roomInfo.room_id].author !== userInfo.user_id) return

      rooms[roomInfo.room_id].gameData = {
        phase: 'playing',
        tiles: [...Array(levels[level][0])].map(() => {
          return [...Array(levels[level][1])].map(() => {
            return {
              bomb: false,
              state: 10,
              openBy: null,
              miss: false
            }
          })
        })
      }

      for (let i = 0; i < levels[level][2];) {
        const y = Math.floor(Math.random() * levels[level][0])
        const x = Math.floor(Math.random() * levels[level][1])

        if (rooms[roomInfo.room_id].gameData.tiles[y][x].bomb) continue

        rooms[roomInfo.room_id].gameData.tiles[y][x].bomb = true

        i++
      }

      updateGameData(roomInfo)

      rooms[roomInfo.room_id].users.forEach((user, i) => {
        user.scores = {
          exploded: 0,
          // foundBombs: 0,
          flagged: 0,
          missFlagged: 0,
          openedTiles: 0
        }
        rooms[roomInfo.room_id].users[i] = user
      })

      updateUsers(roomInfo)
    })

    // client.on("message", function(data) {
    //   // do something
    // });
    // client.emit("message", "Welcome");

    socket.on('forceDisconnect', () => {
      socket.disconnect()
    });
  })
}
