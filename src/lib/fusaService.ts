import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  setDoc,
  onSnapshot,
  collectionGroup,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './error-handler';
import { Lugar, Categoria, Comentario, Usuario, Reporte, Historia } from '../types';

export const getUsuario = async (userId: string): Promise<Usuario | null> => {
  try {
    const docRef = doc(db, 'usuarios', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Usuario;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usuarios/${userId}`);
    return null;
  }
};

export const createUsuario = async (userId: string, data: Partial<Usuario>) => {
  try {
    const docRef = doc(db, 'usuarios', userId);
    await setDoc(docRef, {
      ...data,
      rol: data.rol || 'usuario',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usuarios/${userId}`);
  }
};

export const updateUsuario = async (userId: string, data: Partial<Usuario>) => {
  try {
    const docRef = doc(db, 'usuarios', userId);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `usuarios/${userId}`);
  }
};

export const getCategorias = async (): Promise<Categoria[]> => {
  try {
    const snapshot = await getDocs(
      collection(db, "categorias")
    );

    const categorias = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Categoria)
      .filter(
        (categoria) =>
          typeof categoria.nombre === "string" &&
          categoria.nombre.trim().length > 0
      );

    console.log(
      `Fusa Explor: ${categorias.length} categorías cargadas`
    );

    return categorias;
  } catch (error) {
    console.error(
      "Fusa Explor: error cargando categorías:",
      error
    );

    handleFirestoreError(
      error,
      OperationType.LIST,
      "categorias"
    );

    return [];
  }
};

export const subscribeToLugares = (callback: (lugares: Lugar[]) => void, filters?: { categoriaId?: string, destacado?: boolean }) => {
  let q = query(collection(db, 'lugares'), orderBy('createdAt', 'desc'));
  
  if (filters?.categoriaId) {
    q = query(q, where('categoriaId', '==', filters.categoriaId));
  }
  if (filters?.destacado) {
    q = query(q, where('destacado', '==', true));
  }

  return onSnapshot(q, (snapshot) => {
    const lugares = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lugar));
    callback(lugares);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'lugares');
  });
};

export const getLugares = async (filters?: { categoriaId?: string, destacado?: boolean }): Promise<Lugar[]> => {
  try {
    let q = query(collection(db, 'lugares'), orderBy('createdAt', 'desc'));
    
    if (filters?.categoriaId) {
      q = query(q, where('categoriaId', '==', filters.categoriaId));
    }
    if (filters?.destacado) {
      q = query(q, where('destacado', '==', true));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lugar));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'lugares');
    return [];
  }
};

export const updateLugar = async (lugarId: string, data: Partial<Lugar>) => {
  try {
    const docRef = doc(db, 'lugares', lugarId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `lugares/${lugarId}`);
  }
};

export const deleteLugar = async (lugarId: string) => {
  try {
    const docRef = doc(db, 'lugares', lugarId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `lugares/${lugarId}`);
  }
};

export const addLugar = async (lugar: Omit<Lugar, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'lugares'), {
      ...lugar,
      puntuacion: lugar.puntuacion ?? 0,
      numReseñas: lugar.numReseñas ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'lugares');
  }
};

export const getComentarios = (lugarId: string, callback: (comentarios: Comentario[]) => void) => {
  const q = query(
    collection(db, 'lugares', lugarId, 'comentarios'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const comentarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comentario));
    callback(comentarios);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `lugares/${lugarId}/comentarios`);
  });
};

export const getUserComentarios = async (usuarioId: string): Promise<Comentario[]> => {
  try {
    const q = query(
      collectionGroup(db, 'comentarios'),
      where('usuarioId', '==', usuarioId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comentario));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'comentarios (collectionGroup)');
    return [];
  }
};

export const addComentario = async (lugarId: string, comentario: Omit<Comentario, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'lugares', lugarId, 'comentarios'), {
      ...comentario,
      createdAt: serverTimestamp(),
    });
    
    // Actualizar la puntuación media del lugar (solo si se seleccionó una puntuación mayor a 0)
    if (comentario.puntuacion > 0) {
      const lugarRef = doc(db, 'lugares', lugarId);
      const lugarSnap = await getDoc(lugarRef);
      if (lugarSnap.exists()) {
        const lugarData = lugarSnap.data() as Lugar;
        const totalPuntos = (lugarData.puntuacion || 0) * (lugarData.numReseñas || 0);
        const nuevaNumReseñas = (lugarData.numReseñas || 0) + 1;
        const nuevaPuntuacion = (totalPuntos + comentario.puntuacion) / nuevaNumReseñas;

        await updateDoc(lugarRef, {
          puntuacion: Number(nuevaPuntuacion.toFixed(1)),
          numReseñas: nuevaNumReseñas,
          updatedAt: serverTimestamp()
        });
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `lugares/${lugarId}/comentarios`);
  }
};

export const subscribeToReportes = (callback: (reportes: Reporte[]) => void) => {
  const q = query(
    collection(db, 'reportes'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reportes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reporte));
    callback(reportes);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'reportes');
  });
};

export const addReporte = async (reporte: Omit<Reporte, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'reportes'), {
      ...reporte,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reportes');
  }
};

export const updateReporteLikes = async (reporteId: string, additionalLikes: number) => {
  try {
    const docRef = doc(db, 'reportes', reporteId);
    await updateDoc(docRef, {
      likes: additionalLikes
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reportes/${reporteId}`);
  }
};

export const deleteReporte = async (reporteId: string) => {
  try {
    const docRef = doc(db, 'reportes', reporteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reportes/${reporteId}`);
  }
};

export const addHistoria = async (historia: Omit<Historia, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'historias'), {
      ...historia,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'historias');
  }
};

export const subscribeToHistorias = (callback: (historias: Historia[]) => void) => {
  const q = query(
    collection(db, 'historias'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const historias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Historia));
    callback(historias);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'historias');
  });
};

export const deleteHistoria = async (historiaId: string) => {
  try {
    const docRef = doc(db, 'historias', historiaId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `historias/${historiaId}`);
  }
};

export const addComentarioAHistoria = async (
  historiaId: string, 
  comentario: { id: string; author: string; avatar?: string; text: string; createdAt: string }
) => {
  try {
    const docRef = doc(db, 'historias', historiaId);
    await updateDoc(docRef, {
      comentarios: arrayUnion(comentario)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `historias/${historiaId}`);
  }
};
