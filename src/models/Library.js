import mongoose from 'mongoose';

const libraryItemSchema = new mongoose.Schema({
  type: { type: String, required: true },
  images: {
    type: [String], // Changed from imageSchema to [String]
    validate: [arr => arr.length <= 4, '{PATH} exceeds the limit of 4'],
    default: [],
  },
  templateGroup: {
    type: String,
    default: '',
    // required: true 
  },
  category: {
    type: String,
    default: 'model',
    // required: true 
  },
  tags: {
    type: [String],
    default: [],
    // required: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Library = mongoose.model('Library', libraryItemSchema);
export default Library;
