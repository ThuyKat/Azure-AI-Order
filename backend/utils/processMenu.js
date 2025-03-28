import axios from 'axios'

export default async function processMenuWithRateLimits(ocrText) {
    try {
      // Clean the text - just remove the :selected: markers
      const cleanedText = cleanOcrText(ocrText)
      console.log('OCR Text:', cleanedText)

      // Create the prompt
      const gptPrompt = `
      You are a menu analysis AI. Extract menu items from the following OCR text from a restaurant menu.For each meu item, identify:
      1. The name of the item, formatted with only first letter of each word be capitalised
      2. The price of the item
      3. The description of the item ( if any)
      4. The category of the item ( categorise all items into Main, Side or Drink)
      5. Extract 3-5 keywords that are in an array, for AI to match to items. Each words in each keywords can be understood as item's name. Each keyword is noun or noun phrase (coma separated)
      The OCR text is from a restaurant menu image and may contain errors.
      Respond with a JSON object with a single "items" array containing objects with name, price, description, category, and keywords fields.If price is in text format, convert to number. If a field is missing, use an empty string for text fields or appropriate default values.
      OCR Text: ${cleanedText}
      `
      
      // Process with retry logic
      const result = await callOpenAIWithRetry(gptPrompt)
      
      // Parse the results
      const menuItems = JSON.parse(result.choices[0].message.content).items || []
      return menuItems
      
    } catch (error) {
      console.error(`Error processing menu: ${error.message}`);
      throw error;
    }
  }
  
  // Implement the retry function
async function callOpenAIWithRetry(prompt, maxRetries = 5) {
    const azureOpenaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT
    const azureOpenaiKey = process.env.AZURE_OPENAI_KEY
    if(!azureOpenaiKey){
        return res.status(400).json({error: 'OpenAI API key is missing'})
    }
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`API call attempt ${retries + 1} of ${maxRetries}`);
        
        const response = await axios.post(
          `${azureOpenaiEndpoint}`,
          {
            messages: [
              {
                role: "system", 
                content: "You are a menu analysis AI that extracts structured data from OCR text."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          },
          {
            headers: {
                'Authorization': `Bearer ${azureOpenaiKey}`,
                'Content-Type': 'application/json'
            }
          }
        )
        
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Get retry time from headers if available, otherwise use exponential backoff
          const retryAfter = error.response.headers['retry-after'] 
            ? parseInt(error.response.headers['retry-after']) * 1000 
            : Math.pow(2, retries + 1) * 1000
          console.log(`Rate limited. Retrying after ${retryAfter/1000} seconds...`)
          
          // Wait for the specified time
          await new Promise(resolve => setTimeout(resolve, retryAfter))
          retries++
        } else {
          // If it's not a rate limit error, throw it
          console.error('API call failed:', error.message);
          throw error;
        }
      }
    }
    
    // If we've exhausted all retries
    throw new Error("Max retries exceeded for OpenAI API call");
}
function cleanOcrText(text) {
    // Remove the :selected: and :unselected: markers
    const cleanedText = text.replace(/:(selected|unselected):/g, "");
    
    // Remove excess whitespace and normalize line breaks
    return cleanedText.replace(/\s+/g, " ").trim();
}