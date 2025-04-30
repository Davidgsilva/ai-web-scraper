import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

// Get all goals for the authenticated user
export async function GET(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Query goals for the current user
    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', session.user.id));
    const goalsSnapshot = await getDocs(goalsQuery);
    
    // Convert to array of goal objects
    const goals = goalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
    }));
    
    return Response.json({ 
      success: true, 
      data: goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Create a new goal
export async function POST(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title) {
      return Response.json({ 
        success: false, 
        message: "Goal title is required",
        data: null
      }, { status: 400 });
    }
    
    // Create new goal document
    const goalData = {
      userId: session.user.id,
      title: data.title,
      target: data.target || null,
      deadline: data.deadline || null,
      progress: data.progress || 0,
      completed: data.completed || false,
      createdAt: serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'goals'), goalData);
    
    // Return success with the created goal
    return Response.json({ 
      success: true, 
      data: {
        id: docRef.id,
        ...goalData,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Update a goal (PATCH method)
export async function PATCH(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Get goal ID from query params
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return Response.json({ 
        success: false, 
        message: "Goal ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Parse request body
    const updates = await request.json();
    
    // Update the document
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return Response.json({ 
      success: true, 
      data: {
        id: goalId,
        ...updates
      }
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Delete a goal (DELETE method)
export async function DELETE(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Get goal ID from query params
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return Response.json({ 
        success: false, 
        message: "Goal ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Delete the document
    const goalRef = doc(db, 'goals', goalId);
    await deleteDoc(goalRef);
    
    return Response.json({ 
      success: true, 
      data: { id: goalId }
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
