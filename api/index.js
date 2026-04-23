export default function handler(req, res) {
  res.status(200).json({ message: 'Hermes 1.0 API is working!', timestamp: new Date().toISOString() });
}
