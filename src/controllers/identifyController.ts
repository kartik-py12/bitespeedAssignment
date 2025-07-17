import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { IdentifyRequest } from '../types';

const contactService = new ContactService();

export const identifyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber }: IdentifyRequest = req.body;

    // Validate request - at least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'At least one of email or phoneNumber must be provided'
      });
      return;
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: 'Invalid email format'
      });
      return;
    }

    // Validate phone number format if provided (basic validation)
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      res.status(400).json({
        error: 'Phone number should contain only digits'
      });
      return;
    }

    const result = await contactService.identifyContact({ email, phoneNumber });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in identifyController:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};
