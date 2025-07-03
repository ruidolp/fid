/**
 * Construye un payload interactivo para WhatsApp.
 *
 * @param {Object} params
 * @param {string} params.header - Encabezado del mensaje (máx 60 caracteres).
 * @param {Array} params.options - Lista de opciones con { id, text, description }.
 * @param {string|null} params.footer - Texto opcional para el pie del mensaje.
 * @param {'auto' | 'button' | 'list'} params.strategy - Decide el tipo de mensaje.
 *
 * @returns {Object} Payload completo para enviar a la API de WhatsApp.
 *
 * @throws {Error} Si los datos no cumplen con las restricciones de WhatsApp.
 */
export function buildInteractivePayload({ header, options, footer = null, strategy = 'auto' }) {
  if (!header || typeof header !== 'string' || header.length > 60) {
    throw new Error('Header inválido o excede los 60 caracteres.');
  }

  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('Se requieren al menos una opción.');
  }

  if (footer && footer.length > 60) {
    throw new Error('Footer excede los 60 caracteres permitidos.');
  }

  let type;
  if (strategy === 'auto') {
    type = options.length <= 3 ? 'button' : 'list';
  } else if (strategy === 'button' || strategy === 'list') {
    type = strategy;
  } else {
    throw new Error(`Estrategia no válida: ${strategy}`);
  }

  if (type === 'button' && options.length > 3) {
    throw new Error('No se pueden usar más de 3 botones.');
  }

  if (type === 'list' && options.length > 10) {
    throw new Error('No se pueden usar más de 10 opciones en listas.');
  }

  // Filtra opciones inválidas
  const safeOptions = options.filter(opt => opt?.id && opt?.text);

  if (safeOptions.length === 0) {
    throw new Error('No hay opciones válidas para construir el mensaje interactivo.');
  }

  const base = {
    type: 'interactive',
    interactive: {
      type,
      header: {
        type: 'text',
        text: header
      },
      body: {
        text: 'Selecciona una opción:'
      }
    }
  };

  if (footer) {
    base.interactive.footer = { text: footer };
  }

  if (type === 'button') {
    base.interactive.action = {
      buttons: safeOptions.map(opt => ({
        type: 'reply',
        reply: {
          id: opt.id,
          title: opt.text.slice(0, 20) // WhatsApp recomienda 20–24 máx
        }
      }))
    };
  } else {
    base.interactive.action = {
      button: 'Ver opciones',
      sections: [
        {
          title: 'Opciones disponibles',
          rows: safeOptions.map(opt => ({
            id: opt.id,
            title: opt.text.slice(0, 24),
            description: opt.description?.slice(0, 72) || undefined
          }))
        }
      ]
    };
  }

  return base;
}
