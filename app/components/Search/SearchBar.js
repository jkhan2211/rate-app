import { Box, TextField, Button, Slide, useTheme } from '@mui/material';
import { useState } from 'react';

export default function SearchBar({ open, toggleSearchBar, onSearch }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      // Get user's real-time location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = `${latitude},${longitude}`;
          onSearch(searchQuery, location); // Pass search query and location
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location.');
        },
      );
    }
    toggleSearchBar(); // Close the search bar after search
  };

  return (
    <Slide direction="down" in={open} mountOnEnter unmountOnExit>
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        bgcolor={theme.palette.background.paper}
        p={2}
        borderRadius={2}
        boxShadow="0px 4px 10px rgba(0, 0, 0, 0.1)"
      >
        <Button variant="text" onClick={toggleSearchBar} sx={{ mt: 1, ml: 1 }}>
          Close
        </Button>
      </Box>
    </Slide>
  );
}
