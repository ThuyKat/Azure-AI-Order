import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1
  },
  modifications: [String]
});
const orderSchema = new mongoose.Schema({
    items: [orderItemSchema],
    subtotal: Number,
    tax: Number,
    total: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  export default mongoose.model('Order', orderSchema);
