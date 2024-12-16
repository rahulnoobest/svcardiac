import express, { json } from 'express';
import { connect, Schema, model } from 'mongoose';
const app = express();
const jwt = import('jsonwebtoken');
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
const serviceAccount = JSON.parse(await readFile('./svcardiac-f6e93-firebase-adminsdk-1wnip-693e0db66b.json', 'utf-8')); // Firebase Admin service account key

console.log('Service Account:', serviceAccount); // Debug log

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// Middleware
app.use(json());
// Middleware to verify JWT and check for admin role
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token
  if (!token) return res.status(401).send({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
    if (decoded.role !== 'admin') return res.status(403).send({ error: 'Access denied. Admins only.' });
    next();
  } catch (err) {
    res.status(400).send({ error: 'Invalid token.' });
  }
};
const verifyFirebaseToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
  if (!idToken) return res.status(401).send({ error: 'Unauthorized. Token missing.' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken); // Verify token with Firebase
    req.user = decodedToken; // Attach decoded user info to request
    next();
  } catch (err) {
    console.error(err);
    res.status(403).send({ error: 'Invalid or expired Firebase token.' });
  }
};


// MongoDB Connection
mongodb://localhost:27017/
connect('mongodb://localhost:27017/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const DrugSchema = new Schema({
  name: String,
  composition: String,
  brand: String,
  price: Number,
  relatedDrugs: [{ type: Schema.Types.ObjectId, ref: 'Drug' }], // Array of related drug IDs
});

const OfferSchema = new Schema({
  offer: String, // Offer text
});

const Drug = model('Drug', DrugSchema);
const Offer = model('Offer', OfferSchema);

// Routes

app.get('/drugs/search', async (req, res) => {
    const query = req.query.query; // Extract the `query` parameter from the request
    if (!query) {
      return res.status(400).send({ error: 'Search query is required' });
    }
  
    try {
      const drugs = await Drug.find({
        $or: [
          { name: { $regex: query, $options: 'i' } }, // Case-insensitive search for `name`
          { composition: { $regex: query, $options: 'i' } }, // Case-insensitive search for `composition`
        ],
      });
      res.send(drugs);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Error searching for drugs' });
    }
  });

app.post('/drugs', async (req, res) => {
  const drug = new Drug(req.body);
  await drug.save();
  res.send(drug);
});

app.get('/drugs', async (req, res) => {
  const drugs = await Drug.find();
  res.send(drugs);
});

app.get('/drugs/:id', async (req, res) => {
  const drug = await Drug.findById(req.params.id);
  if (!drug) return res.status(404).send('Drug not found');
  res.send(drug);
});

app.get('/drugs/:id/related', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the selected drug
    const drug = await Drug.findById(id);
    if (!drug) return res.status(404).send({ error: 'Drug not found' });

    // Find other drugs with the same composition, excluding the selected drug
    const relatedDrugs = await Drug.find({
      composition: drug.composition,
      _id: { $ne: id }, // Exclude the selected drug itself
    });

    res.send(relatedDrugs);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching related drugs' });
  }
});


app.put('/drugs/:id', async (req, res) => {
  const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!drug) return res.status(404).send('Drug not found');
  res.send(drug);
});

app.delete('/drugs/:id', async (req, res) => {
  const drug = await Drug.findByIdAndDelete(req.params.id);
  if (!drug) return res.status(404).send('Drug not found');
  res.send(drug);
});

// Add a new drug
app.post('/admin/drugs', verifyAdmin, async (req, res) => {
  const drug = new Drug(req.body);
  await drug.save();
  res.send(drug);
});

// Link related drugs by composition
app.post('/admin/drugs/:id/link', verifyAdmin, async (req, res) => {
  const { relatedDrugIds } = req.body; // Array of related drug IDs
  const drug = await Drug.findById(req.params.id);
  if (!drug) return res.status(404).send({ error: 'Drug not found' });

  drug.relatedDrugs = relatedDrugIds; // Store linked drugs
  await drug.save();
  res.send(drug);
});

// Delete a drug
app.delete('/admin/drugs/:id', verifyAdmin, async (req, res) => {
  const drug = await Drug.findByIdAndDelete(req.params.id);
  if (!drug) return res.status(404).send({ error: 'Drug not found' });
  res.send({ message: 'Drug deleted successfully' });
});

// Add or update offer
app.post('/admin/offer', verifyAdmin, async (req, res) => {
  const { offer } = req.body;
  const currentOffer = await Offer.findOneAndUpdate({}, { offer }, { new: true, upsert: true });
  res.send(currentOffer);
});

  
  

// Server
app.listen(3000, () => console.log('Server running on port 3000'));