import React, { useState, useEffect } from 'react';

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
    } else if (command.toLowerCase().includes('call')) {
      setResponse('Please specify the contact to call.');
      speak('Who would you like me to call?');
      setCurrentTask('call');
      setIsWaitingForInput(true);
    } else {
      setResponse('Command not recognized.');
      speak('Sorry, I didn’t understand that.');
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
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true');
      const data = await response.json();
      return `The current weather is ${data.current_weather.temperature}°C with ${data.current_weather.weathercode}.`;
    } catch (error) {
      return 'I could not fetch the weather information.';
    }
  };

  const fetchNews = async (topic) => {
    try {
      const response = await fetch(`https://newsapi.org/v2/everything?q=${topic}&apiKey=0191c93b42954a7690070a10de4aa285`);
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
