import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const seedDatabase = async (userId: string) => {
  const batch = writeBatch(db);

  const categories = [
    { id: 'cat1', nombre: 'Sitios de Interés', color: '#1d4ed8' },
    { id: 'cat2', nombre: 'Dónde comer', color: '#ef4444' },
    { id: 'cat3', nombre: 'Centros Comerciales', color: '#8b5cf6' },
    { id: 'cat4', nombre: 'Hospedaje', color: '#10b981' },
    { id: 'cat6', nombre: 'Tiendas', color: '#f59e0b' },
    { id: 'cat7', nombre: 'Droguerías', color: '#ec4899' },
    { id: 'cat8', nombre: 'Para salir', color: '#6366f1' },
    { id: 'cat9', nombre: 'Iglesias', color: '#78350f' },
    { id: 'cat10', nombre: 'Parqueaderos', color: '#475569' },
    { id: 'cat12', nombre: 'Belleza', color: '#d946ef' },
    { id: 'cat13', nombre: 'Talleres Mecánicos', color: '#0ea5e9' },
    { id: 'cat14', nombre: 'Cementerios', color: '#475569' }
  ];

  const places = [
    
    { id: 'l1', nombre: 'Parque Principal Fusagasugá', direccion: '# 7A-56 Cra. 12 Sabaneta', categoriaId: 'cat1', descripcion: 'Corazón histórico de la ciudad jardín, rodeado de arquitectura colonial y vida local.', imagen: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=800', lat: 4.3389, lng: -74.3761 },
    { id: 'l2', nombre: 'Cerro de Fusacatán', direccion: 'Vía Tibacuy', categoriaId: 'cat1', descripcion: 'Mirador natural y sitio sagrado indígena.', imagen: 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800', lat: 4.3435, lng: -74.3542 },
    

    { id: 'l3', nombre: 'Restaurante El Cebollero', direccion: 'Variante Fusa', categoriaId: 'cat2', descripcion: 'Famoso por su carne a la llanera y platos típicos.', imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', lat: 4.3325, lng: -74.3801 },
    { id: 'l4', nombre: 'Piqueteadero La 22', direccion: 'Carrera 6', categoriaId: 'cat2', descripcion: 'El mejor piquete tradicional de la región.', imagen: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800', lat: 4.3351, lng: -74.3742 },


    { id: 'l5', nombre: 'Centro Comercial Manila', direccion: 'Carrera 12', categoriaId: 'cat3', descripcion: 'Comercio, cines y plazoleta de comidas.', imagen: 'https://images.unsplash.com/photo-1567401893424-d126fc75209d?q=80&w=800', lat: 4.3412, lng: -74.3751 },
    { id: 'l6', nombre: 'Centro Comercial San Lázaro', direccion: 'Calle 8', categoriaId: 'cat3', descripcion: 'Boutiques y servicios financieros.', imagen: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800', lat: 4.3352, lng: -74.3745 },


    { id: 'l7', nombre: 'Tiendas D1 Balmoral', direccion: 'Barrio Balmoral', categoriaId: 'cat6', descripcion: 'Calidad a precios bajos.', imagen: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=800', lat: 4.3482, lng: -74.3721 },
    { id: 'l8', nombre: 'Supermercados Ara Plaza', direccion: 'Plaza de Mercado', categoriaId: 'cat6', descripcion: 'Alegría al mejor precio.', imagen: 'https://images.unsplash.com/photo-1534723452862-4c874e70d6f2?q=80&w=800', lat: 4.3315, lng: -74.3762 },
    { id: 'l9', nombre: 'Éxito Fusagasugá', direccion: 'Av. Las Palmas', categoriaId: 'cat6', descripcion: 'Todo lo que necesitas en un solo lugar.', imagen: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800', lat: 4.3302, lng: -74.3681 },


    { id: 'l10', nombre: 'Hotel Catama', direccion: 'Centro', categoriaId: 'cat4', descripcion: 'Tradición y confort en el centro de la ciudad.', imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800', lat: 4.3382, lng: -74.3755 },


    { id: 'l11', nombre: 'Club El Bosque', direccion: 'Vía Silvania', categoriaId: 'cat1', descripcion: 'Piscinas, canchas de tenis y ambiente familiar.', imagen: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800', lat: 4.3621, lng: -74.3512 },

    
    { id: 'l12', nombre: 'Discoteca La Octava', direccion: 'Zona Rosa', categoriaId: 'cat8', descripcion: 'La mejor rumba crossover de Fusa.', imagen: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=800', lat: 4.3385, lng: -74.3702 },
    { id: 'l13', nombre: 'Iglesia Nuestra Señora de Belén', direccion: 'Parque Principal', categoriaId: 'cat9', descripcion: 'Hermosa catedral frente al parque central.', imagen: 'https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=800', lat: 4.3381, lng: -74.3762 }
  ];

  try {
    for (const cat of categories) {
      batch.set(doc(db, 'categorias', cat.id), cat);
    }
    for (const place of places) {
      batch.set(doc(db, 'lugares', place.id), {
        ...place,
        propietarioId: userId,
        puntuacion: 4.8,
        numReseñas: 12,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  } catch (error) {
    console.error("Error seeding database", error);
  }
};
