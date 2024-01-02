import { useEffect, useState } from 'react'

import './App.css'

let __recognition: any = null
let __events: EventTarget = null
let __started = false

function resolve() {
  if (!__recognition || !__events) {
    if (!('webkitSpeechRecognition' in window)) {
      return {
        error: 'Recognition not supported by your browser'
      }
    } else {
      const webkitSpeechRecognition = window.webkitSpeechRecognition as any
      const recognition = new webkitSpeechRecognition();
      const events = new EventTarget();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = function () {
        __started = true
        events.dispatchEvent(new CustomEvent('start', { detail: { data: true } }))
      };

      recognition.onerror = function (event) {
        events.dispatchEvent(new CustomEvent('error', { detail: { error: event.error } }))
      };

      recognition.onend = function () {
        events.dispatchEvent(new CustomEvent('end', { detail: {} }))
      };

      recognition.onresult = function (event) {
        events.dispatchEvent(new CustomEvent('result', { detail: event }))
      };

      recognition.lang = 'en-US';

      __recognition = recognition
      __events = events
    }
  }

  return {
    recognition: __recognition,
    events: __events
  }
}

function App() {
  const [recognizing, setRecognizing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [logs, setLog] = useState<string[]>([])
  const [messages, setMessages] = useState<string[]>([])
  const [currentMessage, setCurrentMessage] = useState<string>('')

  useEffect(() => {
    const {
      error,
      recognition
    } = resolve()
    if (error) {
      setError('Recognition not supported by your browser')
    } else {
      setRecognizing(true)
      if (!__started) {
        __started = true
        recognition.start()
      }
    }
  }, []);

  useEffect(() => {
    const { events } = resolve()
    if (events) {
      console.log('RESUBSCRIBE')
      const onStart = () => {
        setLog((logs) => [...logs, 'start'])
      }

      const onEnd = () => {
        setLog((logs) => [...logs, 'end'])
      }

      const onError = (event: CustomEvent) => {
        setLog((logs) => [...logs, `error: ${event.detail.error}`])
      }

      const onResult = (event: CustomEvent) => {
        const { results, resultIndex } = event.detail
        let final = ''
        let interim = ''

        for (let i = resultIndex; i < results.length; ++i) {
          if (results[i].isFinal) {
            final += results[i][0].transcript;
          } else {
            interim += results[i][0].transcript;
          }
        }

        if (final.length) {
          setMessages((messages) => [...messages, final])
          setCurrentMessage('')
        } else if (interim.length) {
          setCurrentMessage(interim)
        }
      }

      events.addEventListener('start', onStart)
      events.addEventListener('error', onError)
      events.addEventListener('end', onEnd)
      events.addEventListener('result', onResult)

      return () => {
        events.removeEventListener('start', onStart)
        events.removeEventListener('error', onError)
        events.removeEventListener('end', onEnd)
        events.removeEventListener('result', onResult)
      }
    }
  }, [setLog, setMessages]);

  return (
    <>
      <h3>Speech recognition</h3>
      {error && <div className={"error-text"}>{error}</div>}
      {recognizing && <div className={"success-text"}>Recognition supported by your browser. Listening...</div>}

      <div className="workspace">
        <div className="messages">
          <h4>Messages</h4>
          <ul>
            {messages.map((message, index) => (
              <li key={index}>
                <span className={"badge done"}>sent</span>
                {message}
              </li>
            ))}
          </ul>
          <p>
            {currentMessage}
          </p>
        </div>
        <div className="logs">
          <h4>Logs</h4>
          <ul>
            {logs.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
