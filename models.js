import mongoose from 'mongoose'

const landmarkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 20
    },
    icon: {
      type: String
    },
    longitude: {
      type: Number
    },
    latitude: {
      type: Number
    }
  }  
)

const mapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 24
    },
    author: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
    },
    tags: {
      type: [String],
    },
    publicStatus: {
      type: Boolean,
      default: false
    },
    numberOfLikes: {
      type: Number
    },
    landmarks: {
      type: [landmarkSchema]
    },
    markerColor: {
      type: String
    },
    subscription: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

const UserSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String,
});

export const Map = mongoose.model('Map', mapSchema);

export const User = mongoose.model('User', UserSchema);