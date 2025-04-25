// Using Firebase Firestore for database storage
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

// Collection reference for templates
const templatesCollection = collection(db, 'templates');

// Helper function to convert Firestore data to our template format
const convertTemplate = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    prompt: data.prompt,
    category: data.category,
    creator: data.creator,
    premium: data.premium,
    createdAt: data.createdAt?.toDate() || new Date()
  };
};

// Function to seed initial templates if none exist
async function seedInitialTemplates() {
  try {
    // Check if templates already exist
    const snapshot = await getDocs(templatesCollection);
    if (snapshot.empty) {
      console.log('Seeding initial templates...');
      
      // Initial templates data
      const initialTemplates = [
        {
          title: 'Business Report',
          description: 'Generate professional business reports with executive summary, findings, and recommendations.',
          prompt: 'Create a professional business report with the following sections: Executive Summary, Introduction, Key Findings, Analysis, Recommendations, and Conclusion.',
          category: 'business',
          creator: 'AI Content Marketplace',
          premium: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Marketing Copy',
          description: 'Create persuasive marketing copy that converts visitors into customers.',
          prompt: 'Write persuasive marketing copy that highlights benefits, creates urgency, and includes a strong call-to-action.',
          category: 'marketing',
          creator: 'AI Content Marketplace',
          premium: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Design Concept',
          description: 'Generate detailed design concepts including color schemes, typography, and layout.',
          prompt: 'Describe a design concept in detail, including color scheme, typography, layout, and user experience considerations.',
          category: 'design',
          creator: 'AI Content Marketplace',
          premium: false,
          createdAt: serverTimestamp()
        },
        {
          title: 'SEO-Optimized Content',
          description: 'Create content optimized for search engines with relevant keywords.',
          prompt: 'Write SEO-optimized content that naturally incorporates the following keywords. Include headings, subheadings, and meta description.',
          category: 'marketing',
          creator: 'AI Content Marketplace',
          premium: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Product Description',
          description: 'Create compelling product descriptions that highlight features and benefits.',
          prompt: 'Write a compelling product description that highlights key features, benefits, and unique selling points. Include technical specifications and a call-to-action.',
          category: 'ecommerce',
          creator: 'AI Content Marketplace',
          premium: false,
          createdAt: serverTimestamp()
        }
      ];
      
      // Add each template to Firestore
      for (const template of initialTemplates) {
        await addDoc(templatesCollection, template);
      }
      
      console.log('Initial templates seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
}

export async function GET(request) {
  console.log('Templates API route GET handler called');
  
  try {
    // Make sure we have initial templates
    await seedInitialTemplates();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const premium = searchParams.get('premium');
    
    // Build the query based on parameters
    let templateQuery = templatesCollection;
    
    if (category) {
      templateQuery = query(templateQuery, where('category', '==', category));
    }
    
    if (premium !== null) {
      const isPremium = premium === 'true';
      templateQuery = query(templateQuery, where('premium', '==', isPremium));
    }
    
    // Execute the query
    const snapshot = await getDocs(templateQuery);
    
    // Convert the documents to our template format
    const templates = snapshot.docs.map(convertTemplate);
    
    return Response.json({ 
      success: true, 
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to fetch templates',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  console.log('Templates API route POST handler called');
  
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    // Parse request body
    const body = await request.json();
    const { title, description, prompt, category, premium, creator } = body;
    
    // Validate required fields
    if (!title || !description || !prompt || !category) {
      return Response.json({ 
        success: false, 
        message: "Missing required fields",
        data: null
      }, { status: 400 });
    }
    
    // Check if user is authenticated for premium templates
    if (premium && !session) {
      return Response.json({ 
        success: false, 
        message: "Authentication required to create premium templates",
        data: null
      }, { status: 401 });
    }
    
    // Create new template document
    const newTemplate = {
      title,
      description,
      prompt,
      category,
      creator: creator || (session?.user?.name || session?.user?.email || 'Anonymous User'),
      premium: premium || false,
      createdAt: serverTimestamp(),
      userId: session?.user?.id || null
    };
    
    // Add the template to Firestore
    const docRef = await addDoc(templatesCollection, newTemplate);
    
    // Return the created template with its ID
    return Response.json({ 
      success: true, 
      data: {
        id: docRef.id,
        ...newTemplate,
        createdAt: new Date() // Convert serverTimestamp to Date for the response
      }
    }, { status: 201 });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
