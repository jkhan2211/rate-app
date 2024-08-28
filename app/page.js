'use client';

import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import Header from './components/Header/Header';
import SearchBar from './components/Search/SearchBar';
import axios from 'axios';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the MyLunchBox.AI support assistant. What cuisine do you feel like today?`,
    },
  ]);
  const [message, setMessage] = useState('');
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const toggleSearchBar = () => {
    setSearchBarOpen(!searchBarOpen);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(`${latitude},${longitude}`);
          handleSearch('', `${latitude},${longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Provide user feedback if location access fails
          alert('Unable to retrieve location. Please try again.');
        },
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSearch = async (searchQuery, location) => {
    try {
      const response = await axios.get('/api/search', {
        params: {
          location: location || userLocation,
          radius: 10000, // 10 km radius
          keyword: searchQuery,
        },
      });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      // Provide user feedback if search fails
      alert('Failed to fetch restaurant data. Please try again later.');
    }
  };

  const handleSearchLocationChange = (newLocation) => {
    setUserLocation(newLocation);
    handleSearch('', newLocation);
  };

  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [...otherMessages, { ...lastMessage, content: lastMessage.content + text }];
        });
        return reader.read().then(processText);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Provide user feedback if message sending fails
      alert('Failed to send message. Please try again later.');
    }
  };

  const handleAddButtonClick = async (restaurant) => {
    try {
      // Send restaurant data to backend for embedding and storage
      const response = await axios.post('/api/add', {
        restaurant: restaurant,
      });

      if (response.status === 200) {
        setSnackbarOpen(true);
      } else {
        console.error('Failed to add restaurant');
        alert('Failed to add restaurant. Please try again.');
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('Failed to add restaurant. Please try again.');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100vw"
      height="100vh"
      bgcolor="#f3f4f6"
      p={2}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          getUserLocation();
          toggleSearchBar();
        }}
        sx={{ mb: 2, alignSelf: 'flex-start', ml: 2 }}
      >
        Add to LunchBox 🍱
      </Button>

      <SearchBar
        open={searchBarOpen}
        toggleSearchBar={toggleSearchBar}
        onSearch={handleSearch}
        onLocationChange={handleSearchLocationChange}
      />

      {/* Display Search Results */}
      {restaurants.length > 0 && (
        <Box
          mt={2}
          width="100%"
          maxWidth="800px" // Max width for better readability
          maxHeight="500px" // Limit height to enable scrolling
          bgcolor="white"
          borderRadius={8}
          boxShadow="0px 8px 30px rgba(0, 0, 0, 0.15)"
          p={2}
          overflow="auto" // Enable scrolling if needed
        >
          <Typography variant="h6" component="div" gutterBottom>
            Search Results:
          </Typography>
          {restaurants.map((restaurant, index) => (
            <Box
              key={index}
              mb={2}
              p={1}
              borderBottom="1px solid #ddd"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="subtitle1" component="div" fontWeight="bold">
                  {restaurant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rating: {restaurant.rating} | Cuisine: {restaurant.cuisine}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review: {restaurant.review}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleAddButtonClick(restaurant)}
              >
                Add
              </Button>
            </Box>
          ))}
          <Button
            variant="text"
            onClick={() => {
              setRestaurants([]);
              setSearchBarOpen(false);
            }}
            sx={{ mt: 2, color: theme.palette.secondary.main }}
          >
            Close Results
          </Button>
        </Box>
      )}

      {/* Snackbar for Add Button Confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Congratulations! Successfully Added to lunch box."
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Congratulations! Successfully Added to lunch box.
        </Alert>
      </Snackbar>

      <Stack
        direction="column"
        width={{ xs: '90%', sm: '400px', md: '500px' }}
        height={{ xs: '85%', sm: '650px', md: '750px' }}
        bgcolor="white"
        borderRadius={8}
        boxShadow="0px 8px 30px rgba(0, 0, 0, 0.15)"
        overflow="hidden"
      >
        <Header />

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor={theme.palette.primary.main}
          color="white"
          p={2}
        >
          <Typography variant="h6" component="div">
            MyLunchBox.AI
          </Typography>
        </Box>

        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          p={3}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? theme.palette.success.light
                    : theme.palette.warning.main
                }
                color="white"
                borderRadius={16}
                p={2}
                maxWidth="75%"
                boxShadow="0px 4px 10px rgba(0, 0, 0, 0.1)"
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          p={2}
          bgcolor={theme.palette.background.paper}
          borderTop={`1px solid ${theme.palette.divider}`}
        >
          <TextField
            label="Type your message..."
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            InputProps={{
              sx: {
                bgcolor: '#fff',
                borderRadius: 4,
              },
            }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={sendMessage}
            sx={{
              bgcolor: theme.palette.secondary.main,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
              borderRadius: 4,
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
