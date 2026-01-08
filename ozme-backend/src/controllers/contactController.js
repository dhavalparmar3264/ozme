import Contact from '../models/Contact.js';
import { sendContactEmail } from '../utils/sendEmail.js';

/**
 * Submit contact form
 * @route POST /api/contact
 */
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, category, message } = req.body;

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      phone,
      category: category || 'general',
      message,
    });

    // Send email notification (optional, won't fail if email not configured)
    await sendContactEmail({ name, email, phone, category: category || 'general', message });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: { contact },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

