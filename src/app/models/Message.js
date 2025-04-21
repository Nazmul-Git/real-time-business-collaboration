const messageSchema = new mongoose.Schema({
    sender: {
      type: String,
      required: true,
      trim: true
    },
    receiver: {
      type: String,
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
    }
  });
  
  // Create indexes
  messageSchema.index({ sender: 1, receiver: 1 });
  messageSchema.index({ timestamp: -1 });
  
  // Export model
  const Message = mongoose.models.message || mongoose.model('message', messageSchema);
export default Message;