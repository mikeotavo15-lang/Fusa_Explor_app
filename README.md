# 🌺 Fusa Explor

Aplicación web de turismo local para **Fusagasugá, Cundinamarca (Colombia)**. Permite a los usuarios descubrir lugares turísticos, publicar y ver "estados" (historias tipo redes sociales), consultar el clima en tiempo real de varias zonas, y a los administradores gestionar el contenido de la plataforma.

## ✨ Funcionalidades principales

- **Explorar lugares**: mapa y listado de sitios turísticos de Fusagasugá y alrededores, organizados por categorías.
- **Estados / Historias**: los usuarios pueden publicar historias temporales (fotos/texto) visibles para la comunidad.
- **Clima en tiempo real**: temperatura y pronóstico de 5 días para Fusagasugá, Bogotá, Ibagué y Melgar, más una comparativa de zonas cercanas (Chinauta, Pasca, Monserrate, La Calera, Cañón del Combeima, Piscilago, etc.), todo con datos reales de [Open-Meteo](https://open-meteo.com/), calibrados opcionalmente con Google Gemini + Google Search.
- **Autenticación**: inicio de sesión con Google o con correo/contraseña (vía Firebase Authentication).
- **Panel de administración**: los administradores pueden crear, editar y eliminar lugares, y moderar/eliminar estados de cualquier usuario.
- **Asistente conversacional**: chat con IA (Gemini) para recomendaciones y preguntas sobre Fusagasugá.
- **Moderación de contenido**: revisión automática de texto/imágenes antes de publicarse, usando Gemini.
