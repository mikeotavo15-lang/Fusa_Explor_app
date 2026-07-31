export const systemInstruction = `Eres "Fusa Guía", el asistente virtual oficial de la aplicación Fusa Explor, diseñado para ser un guía turístico interactivo, alegre y experto de Fusagasugá (Cundinamarca, Colombia).

Tu misión es ayudar a los turistas y locales a descubrir los mejores lugares de Fusagasugá basándote únicamente en la información de los lugares de la app proporcionada como contexto.

REGLAS ABSOLUTAS:
1. Habla con un tono amigable, entusiasta, cálido, típico de un guía turístico de Colombia. Usa expresiones alegres como "¡Hola, explorador de Fusa!", o invitaciones entusiastas.
2. Basate en los lugares cargados en la aplicación para tus recomendaciones. Si el usuario te pregunta dónde comer, pasear, o hospedarse, menciónale los lugares específicos cargados de Fusa Explor y haz que suenen atractivos.
3. NO menciones bajo ninguna circunstancia información sobre bases de datos, código fuente, Firebase, react, esquemas SQL, ID de documentos Firestore, API, o implementaciones técnicas. Si te preguntan sobre cómo funciona el código o la base de datos de la app, diles amablemente con carisma que eres un guía turístico experto en gastronomía, cultura y naturaleza de Fusagasugá, y no un ingeniero de sistemas.
4. Si el usuario pregunta por algo de Fusagasugá que NO está en la lista de lugares, puedes responder con cultura, historia general útil o el delicioso clima fresquito de la ciudad, pero invítalos a registrar esa nueva experiencia o lugar en Fusa Explor en la sección de administración si son administradores.
5. Brinda respuestas claras, bonitas, estructuradas y descriptivas usando formato Markdown (con negritas, listas cortas y emojis de flores, sol, café, etc.) para que se lean de forma espectacular.`;

export function getLocalHeuristicResponse(
  message: string,
  lugares: any[],
  categorias: any[]
): string {
  const query = message.toLowerCase();

  const matches = (lugares || []).filter((l: any) => {
    const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
    const catName = cat ? cat.nombre.toLowerCase() : "";
    return (
      l.nombre.toLowerCase().includes(query) ||
      (l.descripcion || "").toLowerCase().includes(query) ||
      (l.direccion || "").toLowerCase().includes(query) ||
      catName.includes(query)
    );
  });

  let matchedIntro = "";
  if (
    query.includes("hola") ||
    query.includes("saludo") ||
    query.includes("buenos") ||
    query.includes("buenas")
  ) {
    matchedIntro = "¡Hola, explorador de Fusa! 🌟 Qué alegría saludarte. ";
  }

  if (matches.length > 0) {
    const placesList = matches
      .map((l: any) => {
        const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
        return `📍 **${l.nombre}**\n   *Categoría:* ${cat ? cat.nombre : "General"}\n   *Dirección:* ${
          l.direccion || "Fusagasugá"
        }\n   *Calificación:* ⭐${l.puntuacion || "4.5"}/5\n   _${
          l.descripcion || "Una experiencia maravillosa te espera aquí."
        }_`;
      })
      .join("\n\n");

    return `${matchedIntro}Basándome en lo que buscas, he encontrado estas excelentes opciones cargadas en Fusa Explor para ti:\n\n${placesList}\n\n¡Espero que te gusten! Recuerda que puedes descubrir más detalles tocándolos directamente en el mapa. 🗺️🌸`;
  }

  if (
    query.includes("comer") ||
    query.includes("restaurante") ||
    query.includes("hambre") ||
    query.includes("comida") ||
    query.includes("café") ||
    query.includes("cafe")
  ) {
    const foodPlaces = (lugares || []).filter((l: any) => {
      const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
      const catNorm = cat ? cat.nombre.toLowerCase() : "";
      return (
        catNorm.includes("comida") ||
        catNorm.includes("restaurante") ||
        catNorm.includes("caf") ||
        l.nombre.toLowerCase().includes("caf") ||
        l.descripcion.toLowerCase().includes("comida")
      );
    });
    if (foodPlaces.length > 0) {
      return (
        `${matchedIntro}¡Claro que sí! Si deseas deleitar tu paladar con la espectacular gastronomía de Fusagasugá, aquí tienes opciones fabulosas cargadas en nuestra app:\n\n` +
        foodPlaces
          .map((l) => `🍴 **${l.nombre}**: ${l.descripcion} (${l.direccion || "Fusagasugá"})`)
          .join("\n\n")
      );
    }
  }

  if (
    query.includes("hosped") ||
    query.includes("hotel") ||
    query.includes("dormir") ||
    query.includes("alojar") ||
    query.includes("finca")
  ) {
    const lodgPlaces = (lugares || []).filter((l: any) => {
      const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
      const catNorm = cat ? cat.nombre.toLowerCase() : "";
      return (
        catNorm.includes("hotel") ||
        catNorm.includes("hospedaje") ||
        catNorm.includes("alojamiento") ||
        l.descripcion.toLowerCase().includes("hotel") ||
        l.descripcion.toLowerCase().includes("finca") ||
        l.descripcion.toLowerCase().includes("alojar")
      );
    });
    if (lodgPlaces.length > 0) {
      return (
        `${matchedIntro}Para descansar cómodamente y disfrutar del clima templado y el aire puro de Fusa, te recomiendo estos hospedajes disponibles en la app:\n\n` +
        lodgPlaces
          .map((l) => `🏨 **${l.nombre}**: ${l.descripcion} (${l.direccion || "Fusagasugá"})`)
          .join("\n\n")
      );
    }
  }

  const featured = (lugares || []).slice(0, 3);
  const featuredList = featured
    .map((l) => `✨ **${l.nombre}** (${l.direccion || "Fusagasugá"})`)
    .join("\n");

  return `${matchedIntro}¡Hola! Soy **Fusa Guía** 🚀. Actualmente mi módulo de inteligencia artificial de Gemini se encuentra en modo de contingencia local, ¡pero me sé de memoria toda la información de Fusagasugá!

Tenemos registrados **${lugares?.length || 0} maravillosos lugares** listos para explorar:
${featuredList}

Dime, ¿buscas algún restaurante, hotel, jardín o sitio turístico para ayudarte a ubicarlo en nuestro mapa interactivo de Fusagasugá? 🗺️🌸`;
}
