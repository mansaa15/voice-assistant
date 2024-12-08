import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [currentTask, setCurrentTask] = useState('');

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    recognition.start();
    setIsListening(true);
    setResponse('Listening for your command...');
  };

  const stopListening = () => {
    recognition.stop();
    setIsListening(false);
    setResponse('Stopped listening.');
  };

  useEffect(() => {
    recognition.onresult = async (event) => {
      const lastResult = event.results[event.results.length - 1];
      const spokenCommand = lastResult[0].transcript;
      setCommand(spokenCommand);
      speak(`You said: ${spokenCommand}`);

      if (isWaitingForInput) {
        handleFollowUp(spokenCommand);
      } else {
        handleCommand(spokenCommand);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [isWaitingForInput, currentTask]);

  const handleCommand = async (command) => {
    if (command.toLowerCase().includes('reminder')) {
      setResponse('Please specify the reminder.');
      speak('What would you like me to remind you about?');
      setCurrentTask('reminder');
      setIsWaitingForInput(true);
    } else if (command.toLowerCase().includes('weather')) {
      const weather = await fetchWeather();
      setResponse(weather);
      speak(weather);
    } else if (command.toLowerCase().includes('news')) {
      setResponse('What topic would you like the news on?');
      speak('Which topic should I find the news for?');
      setCurrentTask('news');
      setIsWaitingForInput(true);
    } else if (command.toLowerCase().includes('make a call')) {
      setResponse('Please specify the contact to call.');
      speak('Who would you like me to call?');
      setCurrentTask('call');
      setIsWaitingForInput(true);
    } else {
      const geminiResponse = await fetchGeminiResponse(command);
      setResponse(geminiResponse);
      speak(geminiResponse);
    }
  };

  const handleFollowUp = async (input) => {
    if (currentTask === 'reminder') {
      setResponse(`Reminder set: ${input}`);
      speak(`Reminder noted: ${input}`);
    } else if (currentTask === 'news') {
      const news = await fetchNews(input);
      setResponse(news);
      speak(news);
    } else if (currentTask === 'call') {
      setResponse(`Calling ${input}...`);
      speak(`Calling ${input} now.`);
    }
    setIsWaitingForInput(false);
    setCurrentTask('');
  };

  const fetchWeather = async () => {
    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.4065&longitude=78.4772&current_weather=true');
      const data = await response.json();
      return `The current weather is ${data.current_weather.temperature}°C with ${data.current_weather.weathercode}.`;
    } catch (error) {
      return 'I could not fetch the weather information.';
    }
  };

  const fetchNews = async (topic) => {
    try {
      const response = await fetch(`https://newsapi.org/v2/everything?q=${topic}&apiKey=YOUR_NEWSAPI_KEY`);
      const data = await response.json();
      if (data.articles.length > 0) {
        return `Here is a headline: ${data.articles[0].title}`;
      } else {
        return 'No news found for that topic.';
      }
    } catch (error) {
      return 'I could not fetch the news.';
    }
  };

  const fetchGeminiResponse = async (command) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    };

    try {
      const chatSession = model.startChat({
        generationConfig,
        history: [{ role: 'user', parts: [{ text: command }] }],
      });

      const result = await chatSession.sendMessage(command);
      return result.response.text();
    } catch (error) {
      console.error('Error fetching Gemini response:', error);
      return 'Sorry, I couldn’t get an answer from Gemini.';
    }
  };

  return (
    <div className="container">
      <h1>Voice Assistant</h1>
      <button onClick={startListening} disabled={isListening}>
        Start Listening
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Stop Listening
      </button>
      <div className="status-box">
        <p><strong>Status:</strong> {isListening ? 'Listening...' : 'Not Listening'}</p>
        <p><strong>Your Command:</strong> {command || 'No command yet.'}</p>
        <p><strong>Response:</strong> {response || 'No response yet.'}</p>
      </div>
    </div>
  );
}

export default App;
