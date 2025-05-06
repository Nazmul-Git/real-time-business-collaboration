// app/models/Room.js
import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: function() { return this.isPrivate; },
    select: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', 
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Export with consistent naming (singular)
export default mongoose.models.rooms || mongoose.model('rooms', RoomSchema);