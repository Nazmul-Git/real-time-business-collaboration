// lib/auth.js
import { cookies } from 'next/headers';
import User from '../models/User';
import dbConnect from './dbConnect';

export async function getLoggedUser() {
  try {
    await dbConnect(); 
    
    const cookieStore = cookies(); 
    const userCookie = cookieStore.get('loggedUser');
    console.log(userCookie)
    
    if (!userCookie) return null;

    const { email } = JSON.parse(userCookie.value);
    if (!email) return null;

    const user = await User.findOne({ email }).select('-password');
    return user;
  } catch (error) {
    console.error('Error getting logged user:', error);
    return null;
  }
}