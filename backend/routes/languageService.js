// api/analyzeText.js
import express from 'express'
import axios from 'axios'
const router = express.Router()

router.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body
    console.log('Analyzing text:', text)
    // Get credentials from environment variables
    const languageKey = process.env.AZURE_LANGUAGE_KEY
    const languageEndpoint = process.env.AZURE_LANGUAGE_ENDPOINT
    const projectName = process.env.AZURE_LANGUAGE_PROJECT_NAME
    const deploymentName = process.env.AZURE_LANGUAGE_DEPLOYMENT_NAME
    
    if (!languageKey || !languageEndpoint) {
      return res.status(400).json({ error: 'Language service credentials are missing' })
    }
    const cleanText = (text) => {  
        return text.endsWith('.')? text.slice(0, -1): text}
    const textToAnalyze = cleanText(text)
    console.log('Cleaned text:', textToAnalyze)
    // Call Azure Language Service API
    const response = await axios({
      method: 'post',
      url: `${languageEndpoint}/language/:analyze-conversations?api-version=2022-10-01-preview`,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': languageKey
      },
      data: {
        kind: 'Conversation',
        analysisInput: {
          conversationItem: {
            text:textToAnalyze,
            id: '1',
            modality: 'text',
            participantId: 'user'
          }
        },
        parameters: {
          projectName,
          deploymentName,
          verbose: true
        }
      }
    })
    // Send just the analysis results to the frontend
    res.json(response.data);
  } catch (err) {
    console.error('Error calling Azure Language service:', err)
    res.status(500).json({ 
      error: 'Failed to analyze text',
      details: err.message 
    })
  }
})

export default router