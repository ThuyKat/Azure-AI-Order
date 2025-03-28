import express from 'express'
import multer from 'multer'
import  {DocumentAnalysisClient} from '@azure/ai-form-recognizer'
import {AzureKeyCredential} from '@azure/core-auth'
import processMenuWithRateLimits from '../utils/processMenu.js'
const router = express.Router()

//set up multer for file upload
const upload = multer({
    storage : multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // no larger than 10mb
    },
})

router.post('/scan-menu', upload.single('menuImage'), async (req, res) => {
    try{
        if(!req.file){
            return res.status(400).json({error: 'No file uploaded'})
        }
        console.log(req.file)
        // Get credentials from environment variables
        const formRecognizerKey = process.env.AZURE_FORM_RECOGNIZER_KEY
        const formRecognizerEndpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT

        if(!formRecognizerKey || !formRecognizerEndpoint){
            return res.status(400).json({error: 'Form Recognizer credentials are missing'})
        }
       
        // Create a new Form Recognizer client
        const client = new DocumentAnalysisClient(formRecognizerEndpoint, new AzureKeyCredential(formRecognizerKey))

        // Verify acceptable file types
        const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!acceptedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
            error: 'Unsupported file type. Please upload a JPEG, PNG, or PDF file.' 
        });
        }

        //Start the analysis
        const poller = await client.beginAnalyzeDocument('prebuilt-document', req.file.buffer, {
            contentType: req.file.mimetype,
        })
        // Wait for the analysis to complete
        const result = await poller.pollUntilDone()

        // Extract the OCR text from the result
        const ocrText = result.content
         //Send the OCR text to OpenAI to generate menu items
        const menuItems = await processMenuWithRateLimits(ocrText)
        //Format the data according to the MenuItem schema
        const formattedItems = menuItems.map(item => ({
            name: item.name || '',
            price: item.price ? parseFloat(item.price) : 0,
            description: item.description || '',
            category: item.category || '',
            keywords: item.keywords || [],
            available: true
        })) 
        //Return the menu items to the frontend
        res.json({items: formattedItems})


       
    } catch (err){
        console.error('Error scanning menu:', err)
        res.status(500).json({
            error: 'Failed to scan menu',
            details: err.message
        })
    }
})
export default router