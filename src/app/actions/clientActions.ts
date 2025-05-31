import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, Timestamp, deleteField, deleteDoc } from 'firebase/firestore';
import type { Client } from '@/types'; // Assuming Client type is defined

// Define a more specific type for client data updates if possible,
// or use Partial<Client> if Client type covers all fields.
// For now, using Record<string, any> for flexibility, similar to EditClientPage.
type ClientUpdateData = Record<string, any>;

export async function updateUserProfileIcon(clientId: string, iconSvg: string): Promise<void> {
  if (!clientId) {
    console.error("Client ID is required to update profile icon.");
    return; // Or throw an error
  }

  const clientRef = doc(db, 'clients', clientId);

  try {
    await updateDoc(clientRef, {
      profileIcon: iconSvg,
    });
    console.log(`Successfully updated profile icon for client: ${clientId}`);
  } catch (error) {
    console.error(`Error updating profile icon for client ${clientId}:`, error);
    throw new Error(`Failed to update profile icon: ${error}`); // Re-throw or handle as per your app's error strategy
  }
}

export async function getClients(): Promise<Client[]> { // Changed to Promise<Client[]>
  try {
    const clientsCollectionRef = collection(db, 'clients');
    const clientSnapshot = await getDocs(clientsCollectionRef);

    const clients: Client[] = [];
    clientSnapshot.forEach((doc) => {
      // Note: This does not convert Firestore Timestamps in doc.data()
      // This conversion is handled in ClientsPage.tsx for now.
      clients.push({ id: doc.id, ...doc.data() } as Client); 
    });

    console.log(`Successfully retrieved ${clients.length} clients.`);
    return clients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error(`Failed to fetch clients: ${error}`);
  }
}

export async function addClient(clientData: Partial<Omit<Client, 'id'>>): Promise<{ success: boolean; message: string; clientId?: string }> {
  try {
    // Add server timestamps if they are not already in clientData
    const dataToSave = {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const clientsCollectionRef = collection(db, 'clients');
    const docRef = await addDoc(clientsCollectionRef, dataToSave);

    console.log("Client added with ID: ", docRef.id);
    return { success: true, message: "Client added successfully!", clientId: docRef.id };
  } catch (error: any) {
    console.error("Error adding client:", error);
    return { success: false, message: `Error adding client: ${error.message || 'Unknown error'}` };
  }
}

export async function updateClient(clientId: string, formData: ClientUpdateData): Promise<{ success: boolean; message: string }> {
  if (!clientId) {
    return { success: false, message: "Client ID is required for an update." };
  }

  try {
    const clientDocRef = doc(db, 'clients', clientId);
    
    const dataToUpdate: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const value = formData[key];
        
        if (key === 'contractStartDate' || key === 'vencimientoWeb') {
          if (value instanceof Date && !isNaN(value.getTime())) {
            dataToUpdate[key] = Timestamp.fromDate(value);
          } else if (value === null && key === 'vencimientoWeb') { 
             dataToUpdate[key] = deleteField();
          } else if (!value && key === 'vencimientoWeb'){ 
             dataToUpdate[key] = deleteField();
          } else if (key === 'contractStartDate' && !value) {
            console.warn(`Skipping ${key} as it's invalid or not a Date.`);
          }
        } else if (key === 'contractedServices' || key === 'socialMediaAccounts') {
          if (Array.isArray(value) && value.length > 0) {
             dataToUpdate[key] = value.map(({ id, ...rest }) => {
                if (key === 'socialMediaAccounts') {
                    const account : any = {...rest};
                    if (Object.prototype.hasOwnProperty.call(rest, 'password') && (rest.password === '' || rest.password === undefined || rest.password === null) ) {
                        account.password = deleteField();
                    }
                    return account;
                }
                return rest;
            });
          } else {
            dataToUpdate[key] = deleteField();
          }
        } else if (typeof value === 'string' && value.trim() === '') {
          const optionalStringFieldsForDelete: string[] = [
            'avatarUrl', 'clinica', 'telefono', 'profileSummary',
            'dominioWeb', 'tipoServicioWeb', 'credencialesRedesUsuario', 'credencialesRedesContrasena'
          ];
          if (optionalStringFieldsForDelete.includes(key)) {
            dataToUpdate[key] = deleteField();
          } else {
             dataToUpdate[key] = value; 
          }
        } else if (value === undefined) {
           dataToUpdate[key] = deleteField();
        }
        else {
          dataToUpdate[key] = value;
        }
      }
    }
    
    await updateDoc(clientDocRef, dataToUpdate);
    return { success: true, message: "Client updated successfully!" };

  } catch (error: any) {
    console.error(`Error updating client ${clientId}:`, error);
    return { success: false, message: `Error updating client: ${error.message || 'Unknown error'}` };
  }
}

export async function deleteClient(clientId: string): Promise<{ success: boolean; message: string }> {
  if (!clientId) {
    return { success: false, message: "Client ID is required to delete a client." };
  }

  try {
    const clientDocRef = doc(db, 'clients', clientId);
    await deleteDoc(clientDocRef);
    // console.log(`Client with ID: ${clientId} deleted successfully.`); // Optional: for server-side logging
    return { success: true, message: "Cliente eliminado exitosamente." };
  } catch (error: any) {
    console.error(`Error deleting client ${clientId}:`, error);
    return { success: false, message: `Error al eliminar el cliente: ${error.message || 'Error desconocido'}.` };
  }
}
