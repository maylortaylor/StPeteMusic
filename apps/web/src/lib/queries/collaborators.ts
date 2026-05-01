import { query } from '@/lib/db';
import type { Collaborator } from '@stpetemusic/types';

// No website routes yet — query layer only.
// NEVER select persons.email or persons.phone (BYTEA encrypted).
export async function getAllCollaborators(): Promise<Collaborator[]> {
  return query<Collaborator>(`
    SELECT id, first_name, last_name, skills, notes
    FROM persons
    ORDER BY last_name ASC NULLS LAST, first_name ASC
  `);
}
