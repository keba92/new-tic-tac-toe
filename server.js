const express = require('express');
const app = express();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const path = require('path');
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});
const PORT = process.env.PORT || 3000;
const mysql = require('mysql');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

if (process.env.NODE_ENV === 'production'|| process.env.NODE_ENV === 'staging') {
  app.use(express.static(path.join(__dirname,'tic-tac/build')));
  app.get('*', function(req, res){
    res.sendFile(path.join(__dirname, 'tic-tac/build', 'index.html'));
  });
};

const db = mysql.createConnection({
  host: 'sql7.freesqldatabase.com',
  user: 'sql7382436',
  password: 'n5nmnWSBuC',
  database: 'sql7382436',
  port: 3306,
});


http.listen(PORT, () => {
  console.log('listening on *:3000');
});

const cors = require('cors');
app.use(cors());
app.use(express.json());
let clients = {};

const addClient = socket => {
  clients[socket.id] = socket;
};
const removeClient = socket => {
  delete clients[socket.id];
};
db.connect(function(err, result) {
  if (err) console.log(err);
  const sql = 'CREATE TABLE Game (Name VARCHAR(100), Move VARCHAR(100), Players int)';
  db.query(sql, function (err, result) {
      if (err) console.log(err);
      console.log('Table created');
  });
});

app.post('/getDB', (req, res) => {
  db.query('SELECT * FROM Game;', (err, result) => {
    (err) ? console.log(err) : res.send(result);
  });
});

app.post('/getGame', (req, res) => {
  const { names } = req.body;
  db.query("SELECT Move FROM Game where Name=?", [names], (err, result) => {
    if (err){
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.post('/delGame', (req, res) => {
  const { names } = req.body;
  db.query("DELETE FROM Game WHERE Name=?", [names], (err, result) => {
    if (err) console.log(err);
  });
});

io.on("connection", socket => {
  let id = socket.id;
  
  addClient(socket);

  socket.on("mousemove", data => {
    data.id = id;
    socket.broadcast.emit("moving", data);
  });

  socket.on("disconnect", () => {
    removeClient(socket);
    socket.broadcast.emit("clientdisconnect", id);
  });
});


let players = {},
  unmatched;
let names;
function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,
    symbol: "X",
    socket: socket
  };

  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}
function getOpponent(socket) {

  if (!players[socket.id].opponent) {
    return;
  }

  return players[players[socket.id].opponent].socket;
}

io.on("connection", function(socket) {
    joinGame(socket);
    let i;
  socket.on('register', (data)=>{
    const sql = 'SELECT * FROM Game WHERE Name=?';
    names = data.names;
    i = 0;
    for (const key in players) {
      if(players[key]['socket']['connected'] == true) i++;
    }
    db.query(sql, [names],
      (err, result) => {
        if (err) {
          console.log(err);
        } else if(result.length > 0) {
          db.query(
             `UPDATE Game SET Players=? WHERE Name=?`,
            [i, names],
            (err, result) => {
              if (err) console.log(err) ;
            }
          );
        } else if (result.length === 0) {
          db.query(
            'INSERT INTO Game (Name, Move, Players) VALUES (?,?,?)',
            [names, '', i],
            (err, result) => {
              if (err) console.log(err);
            }
          );
        }
      }
    )
  })
  
  if (getOpponent(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol
    });

    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol
    });
  }
  let moove;
  socket.on("make.move", function(data) {
    moove = data.moveList;
    if (!getOpponent(socket)) {
      return;
    }
    db.query(
      `UPDATE Game SET Move=? WHERE Name=?`,
     [moove, names],
     (err, result) => {
       if (err) console.log(err) ;
     }
    );
    socket.emit("move.made", data);
    getOpponent(socket).emit("move.made", data);
  });
  socket.on("disconnect", function() {
      if (getOpponent(socket)) {
        let sum = 0;
        for (const key in players) {
          if(players[key]['socket']['connected'] == true){
            sum=sum+1;
          }
        }
      getOpponent(socket).emit("opponent.left");
      db.query(
        `UPDATE Game SET Players=? WHERE Name=?`,
       [sum, names],
       (err, result) => {
         if (err) console.log(err) ;
       }
     );
    }
  });
});
