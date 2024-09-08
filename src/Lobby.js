import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Paper, Typography, Rating, CircularProgress } from '@mui/material';

function Lobby() {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the code blocks from the backend
    fetch('https://online-coding-app-server-dugm.onrender.com/api/codeblocks')
      .then((res) => res.json())
      .then((data) => {
        // Map the data to calculate average rating
        const updatedBlocks = data.map(block => ({
          ...block,
          rating: block.numRatings > 0 ? block.totalRating / block.numRatings : 0 // Calculate the average rating
        }));
        setCodeBlocks(updatedBlocks);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error('Error fetching code blocks:', error);
        setLoading(false); // Ensure the loading spinner stops even if there's an error
      });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Typography variant="h3" align="center" gutterBottom>
        Choose a Code Block
      </Typography>
      <Box display="flex" justifyContent="center" flexWrap="wrap" gap={3}>
        {codeBlocks.map((block) => (
          <Paper
            key={block._id}
            sx={{
              padding: 3,
              width: '300px',
              textAlign: 'center',
              backgroundColor: 'background.default',
              borderRadius: '12px',
              boxShadow: 3,
            }}
          >
            <Typography variant="h5" gutterBottom>
              {block.codeBlockName}
            </Typography>

            {/* Display the average rating */}
            <Rating
              value={block.rating} // Use the calculated average rating
              readOnly
              precision={0.1}
              sx={{ marginBottom: 2, color: '#f1c40f' }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/codeblock/${block._id}`)}
            >
              Start Coding
            </Button>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}

export default Lobby;
