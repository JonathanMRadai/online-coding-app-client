import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AceEditor from 'react-ace';
import ace from 'ace-builds';
import { AppBar, Toolbar, Typography, Container, Paper, Box, IconButton, Rating, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { debounce } from 'lodash';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

ace.config.setModuleUrl('ace/mode/javascript_worker', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/worker-javascript.js');

let socket;

function CodeBlockPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [codeBlock, setCodeBlock] = useState(null);
  const [role, setRole] = useState('student');
  const [studentsCount, setStudentsCount] = useState(0);
  const [code, setCode] = useState('');
  const [rating, setRating] = useState(0);  
  const [userRating, setUserRating] = useState(null); 
  const [isRated, setIsRated] = useState(false); 
  const [showSmiley, setShowSmiley] = useState(false); 
  const [isHovering, setIsHovering] = useState(false); 
  const [loadingCodeBlock, setLoadingCodeBlock] = useState(true); 

  const codeRef = useRef('');  

  useEffect(() => {
    if (!socket) {
      socket = io('https://online-coding-app-server-dugm.onrender.com');
    }

    fetch(`https://online-coding-app-server-dugm.onrender.com/api/codeblock/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCodeBlock(data);
        setCode(data.initialCode);  
        codeRef.current = data.initialCode;  
        setLoadingCodeBlock(false);  
      });

    fetch(`https://online-coding-app-server-dugm.onrender.com/api/codeblock/${id}/rating`)
      .then((res) => res.json())
      .then((data) => {
        setRating(data.averageRating); 
      });

    socket.emit('joinCodeBlock', id);

    socket.on('role', (assignedRole) => setRole(assignedRole));

    socket.on('codeUpdate', (newCode) => {
      if (newCode.includes('/* SOLUTION MATCHED */')) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }

      if (newCode !== codeRef.current && newCode !== '') {
        setCode(newCode);
        codeRef.current = newCode;  
      }
    });

    socket.on('studentsCountUpdate', (count) => setStudentsCount(count));

    socket.on('mentorLeft', () => {
      alert('Mentor has left the session. Redirecting to the lobby...');
      navigate('/');
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [id, navigate]);

  const handleCodeChange = debounce((newCode) => {
    if (newCode.trim() !== '') {
      setCode(newCode);
      codeRef.current = newCode;

      if (newCode.trim() === codeBlock.solution.trim()) {
        newCode = `${newCode} /* SOLUTION MATCHED */`;
        setShowSmiley(true);  
      }
      socket.emit('codeChange', newCode);
    }
  }, 300);

  const handleRatingChange = (newValue) => {
    if (!isRated) {  
      setUserRating(newValue);
      setIsRated(true);

      fetch(`https://online-coding-app-server-dugm.onrender.com/api/codeblock/${id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newValue })
      })
        .then((res) => res.json())
        .then((data) => {
          setRating(data.averageRating);
        });
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  if (loadingCodeBlock) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <AppBar position="static" sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Code Block: {codeBlock.codeBlockName}
          </Typography>

          <Typography variant="body1" sx={{ color: 'text.secondary', marginRight: 1 }}>
            Difficulty:
          </Typography>

          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {!isHovering && (
              <Rating
                value={rating}
                readOnly
                max={5}
                precision={0.1}
                sx={{ color: '#f1c40f', marginRight: 2 }}
              />
            )}
            {isHovering && !isRated && (
              <Rating
                value={userRating}
                onChange={(event, newValue) => handleRatingChange(newValue)}
                max={5}
                precision={1}
                sx={{ color: '#f1c40f', marginRight: 2 }}
              />
            )}
            {isHovering && isRated && (
              <Rating
                value={rating}
                readOnly
                max={5}
                precision={0.1}
                sx={{ color: '#f1c40f', marginRight: 2 }}
              />
            )}
          </div>

          <Typography variant="body1" sx={{ marginRight: 2, color: 'text.secondary' }}>
            Students: {studentsCount} | Role: {role.charAt(0).toUpperCase() + role.slice(1)}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Paper sx={{ marginTop: 3, padding: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
          {showSmiley ? (
            <Box mt={2} display="flex" justifyContent="center" alignItems="center" height="500px">
              <EmojiEmotionsIcon style={{ fontSize: '10rem', color: '#f1c40f' }} />
            </Box>
          ) : (
            <AceEditor
              mode="javascript"
              theme="monokai"
              value={code}
              onChange={handleCodeChange}
              name="codeEditor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="500px"
              readOnly={role === 'mentor'}
            />
          )}
        </Paper>
      </Container>
    </div>
  );
}

export default CodeBlockPage;
