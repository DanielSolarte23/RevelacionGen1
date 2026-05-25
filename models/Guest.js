const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  numberOfGuests: { type: Number, default: 1, min: 1, max: 15 },
  prediction: { type: String, enum: ['boy', 'girl'], required: true },
  confirmedWith: { type: String, enum: ['daniel', 'lisseth'], required: true },
  confirmationDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Evitar duplicados por teléfono (sparse permite nulos)
guestSchema.index({ phone: 1 }, { unique: true, sparse: true });

guestSchema.virtual('predictionDisplay').get(function () {
  return this.prediction === 'boy' ? 'Niño 💙' : 'Niña 💗';
});

guestSchema.virtual('confirmedWithDisplay').get(function () {
  return this.confirmedWith === 'daniel' ? 'Papá Daniel' : 'Mamá Lisseth';
});

guestSchema.methods.getFormattedDate = function () {
  return this.confirmationDate.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

module.exports = mongoose.model('Guest', guestSchema);
