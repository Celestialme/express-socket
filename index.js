var express = require('express');
var app = express();
var cors = require('cors')
app.use(cors())
var server = require('http').createServer(app)
var io = require('socket.io')(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
})
let users={}
app.get('/', function(req, res) {

  res.send("hello");
});

app.get('/status', function(req, res) {
  
  res.send({count:io.of("/").sockets.size,rooms:getAllRooms()})
});

function getAllRooms(){
  //room[0] is roomname
rooms =   Array.from(io.sockets.adapter.rooms).filter(room => !room[1].has(room[0])).map((room)=>{
  let roomname = room[0]
  return [roomname , io.sockets.adapter.rooms.get(roomname).size]
  })
return rooms
}

io.sockets.on('connection',function (socket){


  socket.on('where am i from', function(data) {

    socket.roomname =data.subject
    socket.join(socket.roomname)
    socket.name=data.fb_fullname
    socket.fb_id = data.fb_id

    if (!users[socket.roomname]) {
      users[socket.roomname] = {}
    }
    users[socket.roomname][socket.id] = [data.fb_id,data.fb_fullname]
    
     console.log('Connected: ',io.of("/").sockets.size)
   io.to(socket.id).emit('userconnect',{
     data:[io.sockets.adapter.rooms.get(socket.roomname).size,users[socket.roomname],'whole']
   });

 socket.broadcast.to(socket.roomname).emit('userconnect',{
         data: [io.sockets.adapter.rooms.get(socket.roomname).size, {[socket.id] : [data.fb_id,data.fb_fullname]},'add']
    });


  })


 socket.on('send message', function(data) {
    io.sockets.in(socket.roomname).emit('broadcast', data)

  })

socket.on('disconnect', function() {
  let room = io.sockets.adapter.rooms.get(socket.roomname)
  let count =room? room.size:0
  console.log('Connected: ',io.of("/").sockets.size)
  try{
  delete users[socket.roomname][socket.id]
  }catch(e){}
    io.sockets.in(socket.roomname).emit('userdisconnect', {
      data: [count, {socketId:socket.id}]
      })
})



















})


// server.listen(4000, '0.0.0.0');
server.listen(process.env.PORT || 8080, '0.0.0.0');
