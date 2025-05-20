// app/models/Room.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [3, 'Room name must be at least 3 characters'],
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: function() { return this.isPrivate; },
    select: false,
    minlength: [4, 'Password must be at least 4 characters']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Creator ID is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  messages: [{  // Added messages reference
    type: mongoose.Schema.Types.ObjectId,
    ref: 'messages'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook for password hashing
RoomSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.isPrivate) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Password verification method
RoomSchema.methods.verifyPassword = async function(candidatePassword) {
  if (!this.isPrivate) return true;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Room = mongoose.models.rooms || mongoose.model('rooms', RoomSchema);
export default Room;