import express from 'express'
import axios from 'axios'

const router = express.Router()

router.get('/get-speech-token', async (req, res) => {
    try {
        const speechKey = process.env.AZURE_SPEECH_KEY
        const speechRegion = process.env.AZURE_SPEECH_REGION
        if(!speechKey || !speechRegion){
            return res.status(400).json({ message: 'Speech key and region are required' })
        }

        const response = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,{},{
            
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
                'Content-Type': 'application/json'
            }
        })
        res.json({token:response.data,region:speechRegion})
    } catch (err) {
        res.status(500).json({ error:'Could not get speech token', message: err.message })
    }
})
export default router