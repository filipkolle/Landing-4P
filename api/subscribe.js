// Vercel Serverless Function to handle Brevo CRM integration
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, marketing } = req.body;
  const isMarketingChecked = marketing === true || marketing === 1 || marketing === '1';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;

  if (!apiKey) {
    console.error('BREVO_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          MARKETING_CONSENT: isMarketingChecked
        },
        listIds: [2],
        updateEnabled: true
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ message: 'Success' });
    } else {
      // Handle various duplicate error formats from Brevo
      const isDuplicate = 
        data.code === 'duplicate_parameter' || 
        data.code === 'contact_already_exists' ||
        (data.message && (
          data.message.toLowerCase().includes('already exists') || 
          data.message.toLowerCase().includes('duplicate')
        ));

      if (isDuplicate) {
        return res.status(409).json({ error: 'duplicate', message: data.message });
      }
      
      return res.status(response.status).json({ 
        error: data.code || 'api_error', 
        message: data.message || 'Unknown error from CRM' 
      });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
