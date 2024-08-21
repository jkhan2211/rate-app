'use client'
import { Box, Stack, TextField, Button, Typography, useTheme } from '@mui/material';
import { useState } from 'react'
import Header from './components/Header/Header';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the TasteRate.AI support assistant. What cusine do you feel like today?`,
    },
  ])
  const [message, setMessage] = useState('')
  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
  
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
  
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }
  const theme = useTheme()

  return (
    <Box
    width="100vw"
    height="100vh"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    bgcolor="#f3f4f6"
    p={2}
  >
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

    {/* Rest of your code */}

        {/* Header with Title */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor={theme.palette.primary.main}
          color="white"
          p={2}
        >
          <Typography variant="h6" component="div">
            FoodieBot
          </Typography>
        </Box>

         {/* Message Container */}
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
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
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

         {/* Input and Send Button */}
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
