import React, {useState, useEffect} from 'react';
import Axios from 'axios';
import './App.css';
import { Card, Button } from 'react-bootstrap';
import Tags from "@yaireo/tagify/dist/react.tagify" // React-wrapper file
import "@yaireo/tagify/dist/tagify.css"

const baseTagifySettings = {
  blacklist: [],
  maxTags: 20,
  backspace: "edit",
  editTags: 1,
  dropdown: {
    enabled: 0
  },
  callbacks: {}
};

function Home() {
  const [data, setData] = useState([]);
  const [name, setName] = useState('');

  useEffect(() =>{
    Axios.post('/getDB', { names: 'getNames', players: 'getPlayers' }).then((response) => {
        setData(response.data);
    });   
  },[]);
  const nameTagsGame = data.map((el)=>el.Name);

  const inputName = (e) => {
    if(e.target.value !== '') setName(e.target.value);
  }

  const playGame = (e) =>{
    e.preventDefault();
    localStorage.setItem('name', name);
    window.location.assign('/Game'); 
  }

  const openGame = (e) =>{
    if(e.target.name < 2){
      Axios.post('/getGame', { names: e.target.value }).then((response) => {
        if (response.data === 'There are enough players!') {
          alert(response.data);
        } else {
          localStorage.setItem('game', response.data[0].Move)
          localStorage.setItem('name', e.target.value);
          window.location.assign('/Game');
        }
      });
    } else {
      alert('There are enough players in the game!');
    }
  }

  const blockGame = data.map((el)=>{
    return (
      <Card border="secondary" id={el.Name} style={{ width: '18rem' }}>
      <Card.Header>Tic-Tac-Toe</Card.Header>
      <Card.Body>
        <Card.Title>{el.Name}</Card.Title>
        <Card.Text>
         Players: {el.Players} / 2
        </Card.Text>
        <Button type="submit" onClick={openGame} name ={el.Players}  value={el.Name}>PLAY</Button>
      </Card.Body>
    </Card>
    )
  });
  
  
  window.onload = function() {
    localStorage.clear()
  };
  const removeBlock = (e)=> {
    const value = e;
    if (e instanceof Object){
      return;
    } else {
      document.querySelector(`#${value}`).style.display = 'none';
    }
  }

  const settings = {
    ...baseTagifySettings,
    whitelist: nameTagsGame
  };

  return (
    <div className="App">
      <div className='createGame'>
        <div className = 'tags'>
          <Tags  
            value={nameTagsGame}
            onRemove ={e=>removeBlock(e.detail.data.value)}
            settings = {settings}
          />
        </div>
        <h3>Create New Game</h3>
        <div className ='showBlock'>
          Name Game: <input type="text" className ='createName' onChange ={inputName}/>
          <Button type="submit" className='play' onClick = {playGame}>PLAY MY GAME</Button>
        </div>
      </div>
      <hr/>
      <h3>Games Started</h3>
      <div className ='modal-tags'>
        {blockGame}
      </div>
    </div>
  );
}

export default Home;