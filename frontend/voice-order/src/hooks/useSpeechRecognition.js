import { useState, useEffect, useRef } from 'react'
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk'
import { getTokenOrRefresh } from '../utils/speechToken'

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState('')
  const recognizerRef = useRef(null)

useEffect(() => {
  // Cleanup function - runs when component unmounts
  return () => {
    if (recognizerRef.current) {
      console.log('Cleanup: stopping recognition on unmount')
      recognizerRef.current.stopContinuousRecognitionAsync()
      recognizerRef.current.close()
    }
  }
}, [])
useEffect(() => { 
   //  watches for changes to isListening and stops recognition when it's set to false
  if (isListening==false && recognizerRef.current) {
    recognizerRef.current.stopContinuousRecognitionAsync(
      () => {
        console.log('Continuous recognition stopped')
      },
      error => {
        console.error('Error stopping continuous recognition:', error)
      }
    )
  }
}, [isListening])

  const startListening = async () => {
    try {
      setIsListening(true)
      setMessage('Listening...')
      // const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || ''
      // const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || ''
      const{authToken, region} = await getTokenOrRefresh()
      if (!authToken || !region) {
        throw new Error('Speech credentials are missing')
      }
      
      // const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion)
      const speechConfig = SpeechConfig.fromAuthorizationToken(authToken, region)
      speechConfig.speechRecognitionLanguage = 'en-US'
      
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new SpeechRecognizer(speechConfig, audioConfig)
      recognizerRef.current = recognizer
      
      recognizer.recognized = (s, e) => {
        setMessage('Recognizing speech...')
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          setTranscript(prev => {
            const updatedText = prev ? prev + ' ' + e.result.text : e.result.text
            return updatedText
          })
        } else if (e.result.reason === ResultReason.NoMatch) {
          setMessage("Sorry, I couldn't understand that. Please try again.")
        }
      }
      
      recognizer.startContinuousRecognitionAsync(
        () =>  setMessage('Ready to take your order'),
        error => {
          console.error('Error starting continuous recognition:', error)
          setMessage(`Failed to start speech recognition: ${error.message || 'Unknown error'}`)
          setIsListening(false)
        }
      )
    } catch (err) {
      console.error('Error in speech recognition setup:', err)
      setMessage(`Failed to set up speech recognition: ${err.message || 'Unknown error'}`)
      setIsListening(false)
    }
  };
  
  const stopListening = async () => {
    if (!recognizerRef.current) {
      setIsListening(false)
      setMessage('Recognition stopped')
      return transcript
    }
    try {
      // Wrap the callback-based API in a Promise
      await new Promise((resolve, reject) => {
        recognizerRef.current.stopContinuousRecognitionAsync(
          () => resolve(),
          (error) => reject(error)
        )
      })
      
      setMessage('Processing your order...')
      setIsListening(false)
      return transcript
    } catch (error) {
      console.error('Error stopping continuous recognition:', error)
      setMessage(`Error stopping recognition: ${error.message || 'Unknown error'}`)
      setIsListening(false)
      throw error
    }
  }
  
  return {
    transcript,
    setTranscript,
    isListening,
    setIsListening,
    message,
    setMessage,
    startListening,
    stopListening
  }
}