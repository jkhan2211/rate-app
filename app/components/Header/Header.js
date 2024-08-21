import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';

export default function Header() {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      bgcolor={theme.palette.primary.main}
      color="white"
      p={2}
    >
      <Typography variant="h6" component="div">
        
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        onClick={() => alert('Logged out!')}
        sx={{
          borderColor: 'white',
          color: 'white',
          '&:hover': {
            borderColor: theme.palette.secondary.main,
            bgcolor: theme.palette.secondary.main,
          },
        }}
      >
        Logout
      </Button>
    </Box>
  );
}
