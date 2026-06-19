import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Online', 'Offline', 'Error'],
      default: 'Offline'
    },
    drinksCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxCapacity: {
      type: Number,
      default: 100,
      min: 1
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Machine = mongoose.model('Machine', machineSchema);

export default Machine;
