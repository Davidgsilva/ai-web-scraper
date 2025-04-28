import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

// Get all tasks for the authenticated user
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
    
    // Query tasks for the current user
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', session.user.id));
    const tasksSnapshot = await getDocs(tasksQuery);
    
    // Convert to array of task objects
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
    }));
    
    return Response.json({ 
      success: true, 
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Create a new task
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
    const body = await request.json();
    const { title, dueDate, priority } = body;
    
    if (!title) {
      return Response.json({ 
        success: false, 
        message: "Task title is required",
        data: null
      }, { status: 400 });
    }
    
    // Create new task document
    const newTask = {
      title,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      completed: false,
      userId: session.user.id,
      createdAt: serverTimestamp()
    };
    
    // Add the task to Firestore
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    
    // Return the created task with its ID
    return Response.json({ 
      success: true, 
      data: {
        id: docRef.id,
        ...newTask,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Update a task (PATCH method)
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
    
    // Parse request body
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return Response.json({ 
        success: false, 
        message: "Task ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Update the task in Firestore
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, updates);
    
    return Response.json({ 
      success: true, 
      data: { id, ...updates }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Delete a task (DELETE method)
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
    
    // Get task ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ 
        success: false, 
        message: "Task ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Delete the task from Firestore
    const taskRef = doc(db, 'tasks', id);
    await deleteDoc(taskRef);
    
    return Response.json({ 
      success: true, 
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
