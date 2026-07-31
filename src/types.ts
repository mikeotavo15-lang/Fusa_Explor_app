export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: 'usuario' | 'admin';
  avatar?: string;
  createdAt?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  color: string;
  icono?: string;
}

export interface Lugar {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  lat?: number;
  lng?: number;
  categoriaId: string;
  puntuacion: number;
  numReseñas: number;
  destacado: boolean;
  destacadoDuracion?: '1d' | '5d' | '15d' | '1m';
  destacadoHasta?: string;
  propietarioId: string;
  imagen?: string;
  imagenes?: string[]; // Multiple photos support
  anuncioActivo?: boolean;
  anuncioImagen?: string;
  anuncioDuracion?: '1d' | '2d' | '5d' | '15d' | '1m';
  anuncioHasta?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface StoryComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface Historia {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioAvatar?: string;
  imagen?: string;
  texto?: string;
  background?: string;
  lugarId?: string;
  lugarNombre?: string;
  createdAt?: any;
  expiresAt: string;
  comentarios?: StoryComment[];
}

export interface Comentario {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  lugarId: string;
  puntuacion: number;
  texto: string;
  esPrivado?: boolean;
  createdAt?: any;
}

export interface Reporte {
  id: string;
  tipo: 'trafico' | 'policia' | 'derrumbe' | 'semaforo' | 'desvio' | 'accidente';
  descripcion: string;
  lat: number;
  lng: number;
  creadorId: string;
  creadorNombre: string;
  likes: number;
  createdAt?: any;
}

