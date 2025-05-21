import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    // Optional: Add read status
    read: {
      type: Boolean,
      default: false
    },
    room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rooms',
    default: null
  }
  });
  
  // Create indexes
  messageSchema.index({ sender: 1, receiver: 1 });
  messageSchema.index({ timestamp: -1 });
  messageSchema.index({ room: 1 });
  
  // Export model
  const Message = mongoose.models.messages || mongoose.model('messages', messageSchema);
export default Message;