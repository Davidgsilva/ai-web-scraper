import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Function to generate content using Claude
async function generateContent(prompt, template) {
  console.log('Generating content with prompt:', prompt);
  
  try {
    console.log('Calling Anthropic API...');
    
    // Combine template with user prompt if template exists
    const fullPrompt = template 
      ? `${template}\n\nUser input: ${prompt}`
      : prompt;
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });
    
    return {
      content: response.content[0].text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error generating content with Claude:', error);
    throw error;
  }
}

export async function POST(request) {
  console.log('Content generation API route called');
  
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, templateId } = body;
    
    if (!prompt) {
      return Response.json({ 
        success: false, 
        message: "Prompt is required",
        data: null
      }, { status: 400 });
    }
    
    // Get the template from Firestore if templateId is provided
    let template = null;
    if (templateId) {
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        template = templateDoc.data().prompt;
      } else {
        return Response.json({ 
          success: false, 
          message: "Template not found",
          data: null
        }, { status: 404 });
      }
    }
    
    // Generate content
    const result = await generateContent(prompt, template);
    
    // Return generated content
    return Response.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
