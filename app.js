const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Guest = require('./models/Guest');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

// ── Página principal ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('invitation', {
    title: 'Revelación de Género - Daniel & Lisseth',
  });
});

// ── Confirmar asistencia ──────────────────────────────────────────────────────
app.post('/confirm', async (req, res) => {
  try {
    const { name, phone, numberOfGuests, prediction, confirmedWith } = req.body;

    const newGuest = new Guest({
      name,
      phone: phone || undefined,
      numberOfGuests: parseInt(numberOfGuests) || 1,
      prediction,
      confirmedWith,
    });

    await newGuest.save();

    const parentName = confirmedWith === 'daniel'
      ? (process.env.PARENT_DAD_NAME || 'Daniel')
      : (process.env.PARENT_MOM_NAME || 'Lisseth');

    const parentPhone = confirmedWith === 'daniel'
      ? process.env.WHATSAPP_DANIEL
      : process.env.WHATSAPP_LISSETH;

    const predictionText = prediction === 'boy' ? 'niño 💙' : 'niña 💗';
    const guestsText = parseInt(numberOfGuests) > 1
      ? `Seremos ${numberOfGuests} personas`
      : 'Voy solo/a';

    const message = encodeURIComponent(
      `¡Hola ${parentName}! 🐉 Confirmo mi asistencia a la revelación de género. Soy ${name}, creo que es ${predictionText}. ${guestsText}. ¡Hasta pronto!`
    );

    const whatsappUrl = `https://wa.me/${parentPhone}?text=${message}`;

    res.json({ success: true, whatsappUrl });
  } catch (error) {
    console.error('Error al confirmar:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este número ya fue registrado anteriormente. ¡Gracias por confirmar!',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al guardar. Por favor intenta de nuevo.',
    });
  }
});

// ── Stats JSON (para el contador en la página) ────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const guests = await Guest.find();
    res.json({
      totalGuests: guests.length,
      totalPeople: guests.reduce((sum, g) => sum + g.numberOfGuests, 0),
      teamBoy: guests.filter((g) => g.prediction === 'boy').length,
      teamGirl: guests.filter((g) => g.prediction === 'girl').length,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ── Panel de administración ───────────────────────────────────────────────────
app.get('/admin/revelacion', async (req, res) => {
  try {
    const guests = await Guest.find().sort({ confirmationDate: -1 });
    const teamBoy = guests.filter((g) => g.prediction === 'boy').length;
    const teamGirl = guests.filter((g) => g.prediction === 'girl').length;

    res.render('admin', {
      title: 'Admin — Revelación de Género',
      guests,
      stats: {
        totalGuests: guests.length,
        totalPeople: guests.reduce((sum, g) => sum + g.numberOfGuests, 0),
        teamBoy,
        teamGirl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar panel');
  }
});

// ── Eliminar invitado ─────────────────────────────────────────────────────────
app.delete('/admin/guests/:id', async (req, res) => {
  try {
    const deleted = await Guest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🐉 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
