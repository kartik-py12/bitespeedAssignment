import { database } from '../database';
import { Contact, IdentifyRequest, IdentifyResponse } from '../types';

export class ContactService {
  async findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (email) {
      conditions.push('email = ?');
      params.push(email);
    }

    if (phoneNumber) {
      conditions.push('phoneNumber = ?');
      params.push(phoneNumber);
    }

    if (conditions.length === 0) {
      return [];
    }

    const sql = `
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL 
      AND (${conditions.join(' OR ')})
      ORDER BY createdAt ASC
    `;

    return await database.all(sql, params);
  }

  async findAllLinkedContacts(primaryId: number): Promise<Contact[]> {
    const sql = `
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL 
      AND (id = ? OR linkedId = ? OR linkedId IN (
        SELECT id FROM Contact WHERE linkedId = ? AND deletedAt IS NULL
      ))
      ORDER BY createdAt ASC
    `;

    return await database.all(sql, [primaryId, primaryId, primaryId]);
  }

  async createContact(
    phoneNumber: string | null,
    email: string | null,
    linkedId: number | null = null,
    linkPrecedence: 'primary' | 'secondary' = 'primary'
  ): Promise<Contact> {
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await database.run(sql, [
      phoneNumber,
      email,
      linkedId,
      linkPrecedence,
      now,
      now
    ]);

    return await database.get('SELECT * FROM Contact WHERE id = ?', [result.lastID]);
  }

  async updateContactToSecondary(contactId: number, primaryId: number): Promise<void> {
    const now = new Date().toISOString();
    
    const sql = `
      UPDATE Contact 
      SET linkedId = ?, linkPrecedence = 'secondary', updatedAt = ?
      WHERE id = ?
    `;

    await database.run(sql, [primaryId, now, contactId]);

    // Also update any contacts that were linked to this contact
    const updateLinkedSql = `
      UPDATE Contact 
      SET linkedId = ?, updatedAt = ?
      WHERE linkedId = ? AND deletedAt IS NULL
    `;

    await database.run(updateLinkedSql, [primaryId, now, contactId]);
  }

  async identifyContact(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Find existing contacts with matching email or phone
    const existingContacts = await this.findContactsByEmailOrPhone(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No existing contact found, create new primary contact
      const newContact = await this.createContact(phoneNumber || null, email || null);
      
      return {
        contact: {
          primaryContatctId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: []
        }
      };
    }

    // Get all unique primary contacts from the matches
    const primaryContactIds = new Set<number>();
    
    for (const contact of existingContacts) {
      if (contact.linkPrecedence === 'primary') {
        primaryContactIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryContactIds.add(contact.linkedId);
      }
    }

    let primaryContact: Contact;
    
    if (primaryContactIds.size === 0) {
      // Shouldn't happen, but handle gracefully - treat first contact as primary
      primaryContact = existingContacts[0];
    } else if (primaryContactIds.size === 1) {
      // Single primary contact - this is the normal case
      const primaryId = Array.from(primaryContactIds)[0];
      primaryContact = await database.get('SELECT * FROM Contact WHERE id = ?', [primaryId]);
      
      // Check if we need to create a new secondary contact
      // Only create if both email and phone are provided AND this exact combination doesn't exist
      if (email && phoneNumber) {
        const exactMatch = existingContacts.find(contact => 
          contact.email === email && contact.phoneNumber === phoneNumber
        );
        
        if (!exactMatch) {
          await this.createContact(phoneNumber, email, primaryContact.id, 'secondary');
        }
      }
    } else {
      // Multiple primary contacts need to be merged
      const primaries = await database.all(
        `SELECT * FROM Contact WHERE id IN (${Array.from(primaryContactIds).join(',')}) ORDER BY createdAt ASC`
      );
      
      // Keep the oldest as primary
      primaryContact = primaries[0];
      
      // Convert others to secondary
      for (let i = 1; i < primaries.length; i++) {
        await this.updateContactToSecondary(primaries[i].id, primaryContact.id);
      }
      
      // Create new secondary contact if we have both email and phone and this combination is new
      if (email && phoneNumber) {
        const exactMatch = existingContacts.find(contact => 
          contact.email === email && contact.phoneNumber === phoneNumber
        );
        
        if (!exactMatch) {
          await this.createContact(phoneNumber, email, primaryContact.id, 'secondary');
        }
      }
    }

    // Get all linked contacts for the response
    const allLinkedContacts = await this.findAllLinkedContacts(primaryContact.id);

    // Build response
    const emails: string[] = [];
    const phoneNumbers: string[] = [];
    const secondaryContactIds: number[] = [];

    // Add primary contact data first
    if (primaryContact.email && !emails.includes(primaryContact.email)) {
      emails.push(primaryContact.email);
    }
    if (primaryContact.phoneNumber && !phoneNumbers.includes(primaryContact.phoneNumber)) {
      phoneNumbers.push(primaryContact.phoneNumber);
    }

    // Add secondary contact data
    for (const contact of allLinkedContacts) {
      if (contact.id !== primaryContact.id) {
        secondaryContactIds.push(contact.id);
        
        if (contact.email && !emails.includes(contact.email)) {
          emails.push(contact.email);
        }
        if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
          phoneNumbers.push(contact.phoneNumber);
        }
      }
    }

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }
}
