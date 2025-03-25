import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  keywords: {
    type: [String],
    required: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('MenuItem', menuItemSchema);