import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FaPaperclip, FaSun, FaMoon, FaImage } from 'react-icons/fa';
import "./App.css";

let socket;
const CONNECTION_PORT = "http://localhost:3001/";

function App() {
  // Before Login
  const [loggedIn, setLoggedIn] = useState(false);
  const [room, setRoom] = useState("");
  const [userName, setUserName] = useState("");

  // After Login
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [media, setMedia] = useState(null);
  const [nightMode, setNightMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);

  const fileInputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    socket = io(CONNECTION_PORT);

    // Setup a keep-alive mechanism
    const keepAliveInterval = setInterval(() => {
      socket.emit('ping');
    }, 25 * 60 * 1000); // Ping every 25 minutes

    // Cleanup interval on component unmount
    return () => {
      clearInterval(keepAliveInterval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((prevMessageList) => [...prevMessageList, data]);
    });
    return () => {
      socket.off("receive_message");
    };
  }, []);

  const connectToRoom = () => {
    setLoggedIn(true);
    socket.emit("join_room", room);
  };

  const sendMessage = async () => {
    // Prevent sending empty messages
    if (!message.trim() && !media) {
      return;
    }

    let messageContent = {
      room: room,
      content: {
        author: userName,
        message: message,
        media: media,
      },
    };

    await socket.emit("send_message", messageContent);
    setMessageList((prevMessageList) => [...prevMessageList, messageContent.content]);
    setMessage("");
    setMedia(null); // Clear the media after sending
  };

  const toggleNightMode = () => {
    setNightMode(!nightMode);
  };

  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`App ${nightMode ? 'nightMode' : ''}`}>
      {!loggedIn ? (
        <div className="logIn">
          <div className="inputs">
            <input
              type="text"
              placeholder="Name..."
              onChange={(e) => {
                setUserName(e.target.value);
              }}
            />
            <input
              type="text"
              placeholder="Room..."
              onChange={(e) => {
                setRoom(e.target.value);
              }}
            />
          </div>
          <button onClick={connectToRoom}>Enter Chat</button>
        </div>
      ) : (
        <div className="chatContainer" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="header">
            <div className="title">Chat Room: {room}</div>
            <div className="headerIcons">
              <FaImage className="bgUploadIcon" onClick={() => bgInputRef.current.click()} />
              <input
                type="file"
                ref={bgInputRef}
                style={{ display: 'none' }}
                onChange={handleBackgroundChange}
              />
              <div className="nightModeToggle" onClick={toggleNightMode}>
                {nightMode ? <FaSun /> : <FaMoon />}
              </div>
            </div>
          </div>
          <div className="messages">
            {messageList.map((val, key) => (
              <div className="messageContainer" id={val.author === userName ? "You" : "Other"} key={key}>
                <div className="messageIndividual">
                  <div className="messageAuthor">{val.author}</div>
                  {val.message && <div>{val.message}</div>}
                  {val.media && <img className="messageMedia" src={val.media} alt="media" />}
                </div>
              </div>
            ))}
          </div>
          <div className="messageInputs">
            <input
              type="text"
              placeholder="Message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <FaPaperclip className="fileUploadIcon" onClick={() => fileInputRef.current.click()} />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleMediaChange}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
