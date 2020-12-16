import React from 'react';
import './App.css';
import io from 'socket.io-client';
import Axios from 'axios';

function App () {
const socket = io();
socket.emit("register", {
  names: localStorage.getItem('name')
});

let myTurn = true,
    symbol;

function getBoardState() {
  const obj = {};
  document.querySelectorAll('.board button').forEach((el) => {
    obj[el.id] = el.innerHTML || "";
  });
  return obj;
}

function isGameOver() {
  const state = getBoardState(),
    matches = ["XXX", "OOO"],
    rows = [
      state.a0 + state.a1 + state.a2,
      state.b0 + state.b1 + state.b2,
      state.c0 + state.c1 + state.c2,
      state.a0 + state.b1 + state.c2,
      state.a2 + state.b1 + state.c0,
      state.a0 + state.b0 + state.c0,
      state.a1 + state.b1 + state.c1,
      state.a2 + state.b2 + state.c2
    ];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] === matches[0] || rows[i] === matches[1]) {
      return true;
    }
  }
}

const moveList = [];
function renderTurnMessage() {
  if (!myTurn) {
    document.querySelector("#messages").innerHTML = "Your opponent's turn";
    document.querySelectorAll('.board button').forEach((el) => {
      el.setAttribute("disabled", true)
    });
  } else {
    document.querySelector("#messages").innerHTML = "Your turn.";
    document.querySelectorAll('.board button').forEach((el) => {
      el.removeAttribute("disabled");
    });
  }
}

function makeMove(e) {
  e.preventDefault();
  if (!myTurn) {
    return;
  }
  if (this.innerHTML.length) {
    return;
  }
  let id = this.id;
  document.querySelectorAll(".board button").forEach((el,index) => {
   moveList[index] = el.innerHTML;
  });

  socket.emit("make.move", {
    symbol: symbol,
    position: id,
    moveList: JSON.stringify(moveList)
  });
}

socket.on("move.made", function(data) {
  document.querySelector("#" + data.position).innerHTML = data.symbol;
  myTurn = data.symbol !== symbol;
  if (!isGameOver()) {
    renderTurnMessage();
  } else {
    Axios.post('/delGame', { names: localStorage.getItem('name') });
    if (myTurn) {
      alert("Game over. You lost.");
      localStorage.clear();
      window.location.assign('/');
    } else {
      alert("Game over. You won!");
      localStorage.clear();
      window.location.assign('/');
    }

    document.querySelectorAll(".board button").forEach((el) => {
      el.setAttribute("disabled", true);
    });
  }
});

socket.on("game.begin", function(data) {
  symbol = data.symbol;
  myTurn = symbol === "X";
  renderTurnMessage();
});

socket.on("opponent.left", function() {
  document.querySelector("#messages").innerHTML = "Your opponent left the game.";
  document.querySelectorAll(".board button").forEach((el) => {
    el.setAttribute("disabled", true);
  });
});

window.onload = function() {
  let listMove 
  if (localStorage.getItem('game')) listMove = JSON.parse(localStorage.getItem('game'));
  document.querySelectorAll(".board button").forEach((el,index) => {
    if(listMove) el.innerHTML = listMove[index];
    el.setAttribute("disabled", true);
  });
  document.querySelectorAll(".board> button").forEach((el) => {
    el.addEventListener("click", makeMove);
  });
};

return (
    <div className="board">
      <button id="a0"></button> <button id="a1"></button> <button id="a2"></button>
      <button id="b0"></button> <button id="b1"></button> <button id="b2"></button>
      <button id="c0"></button> <button id="c1"></button> <button id="c2"></button>
      <div id="messages">Waiting for opponent to join...</div>
    </div>
  )

}

export default App;