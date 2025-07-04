/**
 * Obtiene las opciones activas de un menú dado.
 * @param $1 - ID del menú (menu_id)
 * @returns {Array} Lista ordenada de opciones activas (hasta 3 en caso de botón)
 */
export const getMenuOptionsById = `
  SELECT option_id, option_title, option_description
  FROM menu_options
  WHERE menu_id = $1 AND active = true
  ORDER BY display_order ASC
`;

/**
 * Consulta la conversación activa del usuario (flujo o menú) si aún no ha expirado.
 * @param $1 - Número de teléfono del usuario
 * @returns {Object|null} - Datos de la conversación activa
 */
export const GET_ACTIVE_FLOW_FOR_USER = `
  SELECT uc.*
  FROM user_conversations uc
  JOIN users u ON uc.user_id = u.id
  WHERE u.phone = $1
    AND uc.completed = false
    AND uc.expires_at > NOW()
    AND uc.conversation_type = 'flow'
  ORDER BY uc.updated_at DESC
  LIMIT 1;
`;

/**
 * Marca como completadas las conversaciones del usuario que ya han expirado.
 * @param $1 - Número de teléfono del usuario
 * @returns {void}
 */
export const EXPIRE_FLOWS_FOR_USER = `
  UPDATE user_conversations
  SET completed = true
  WHERE user_id = (
    SELECT id FROM users WHERE phone = $1
  )
  AND completed = false
  AND expires_at <= NOW()
  AND conversation_type = 'flow';
`;

/**
 * Crea una nueva conversación para el usuario con un TTL configurable.
 * @param $1 - Número de teléfono del usuario
 * @param $2 - Nombre del flujo o menú (ej: 'main', 'registro')
 * @param $3 - Tiempo de expiración en minutos
 */
export const START_USER_FLOW = `
  INSERT INTO user_conversations (
    user_id, flow_name, conversation_type, current_step_id, answers, updated_at, expires_at, completed
  )
  VALUES (
    (SELECT id FROM users WHERE phone = $1),
    $2,
    'flow',
    NULL,
    '{}'::jsonb,
    NOW(),
    NOW() + ($3 || ' minutes')::interval,
    false
  );
`;


/**
 * Consulta que retorna el nombre del flujo asociado a una palabra clave específica.
 * 
 * Uso:
 * - Se utiliza para detectar si un mensaje contiene una palabra clave registrada que
 *   dispare un flujo conversacional (por ejemplo, "registrarme" → flujo "registro").
 * 
 * Parámetros:
 * - $1: La palabra clave en minúsculas.
 * 
 * Retorna:
 * - El nombre del flujo correspondiente (`flow_name`) si existe y está activo.
 * - `null` si no hay coincidencia o si la palabra clave está desactivada.
 */
export const GET_FLOW_BY_KEYWORD = `
  SELECT flow_name
  FROM flow_keywords
  WHERE LOWER(keyword) = $1 AND active = true
  LIMIT 1;
`;

/**
 * Consulta que obtiene los datos básicos de un usuario a partir de su número de teléfono.
 * 
 * Uso:
 * - Se utiliza para verificar si un usuario está registrado en la base de datos.
 * - También permite obtener su nombre y ID si está registrado.
 * 
 * Parámetros:
 * - $1: Número de teléfono del usuario (formato string, sin "+" ni espacios).
 * 
 * Retorna:
 * - Fila con `id`, `phone`, `name` si el usuario existe.
 * - Ninguna fila si no está registrado.
 */
export const GET_USER_BY_PHONE = `
  SELECT id, phone, name,joined_club
  FROM users
  WHERE phone = $1
  LIMIT 1;
`;

/**
 * Inserta un nuevo usuario en la tabla `users` si no existe aún.
 * - El campo `phone` debe ser único.
 * - Si el número ya existe, no se realiza ninguna acción (gracias a ON CONFLICT DO NOTHING).
 *
 * Uso típico: cuando se recibe un mensaje de un número desconocido y se quiere iniciar un flujo.
 *
 * Parámetros:
 *  $1 -> número de teléfono (text)
 */
export const INSERT_USER = `
  INSERT INTO users (phone)
  VALUES ($1)
  ON CONFLICT (phone) DO NOTHING;
`;

/**
 * Obtiene el siguiente paso de un flujo dado, según el orden definido.
 * Si `current_step_key` es null o '', devuelve el primer paso del flujo.
 * 
 * Parámetros:
 * - $1: Nombre del flujo (flow_name)
 * - $2: Clave del paso actual (step_key), puede ser vacío para obtener el primer paso
 * 
 * Retorna:
 * - Una fila con los campos: step_key, question_text
 */
export const GET_NEXT_FLOW_STEP = `
  SELECT step_key, question_text
  FROM flow_steps
  WHERE flow_name = $1
    AND (
      $2 = '' OR display_order > (
        SELECT display_order FROM flow_steps WHERE flow_name = $1 AND step_key = $2
      )
    )
  ORDER BY display_order ASC
  LIMIT 1;
`;

/**
 * Actualiza la conversación del usuario, registrando el nuevo paso actual
 * y guardando las respuestas actualizadas en formato JSONB.
 *
 * Parámetros:
 * - $1: ID de la conversación (user_conversations.id)
 * - $2: Nuevo step_key (paso actual)
 * - $3: Objeto JSONB con todas las respuestas acumuladas
 */
export const UPDATE_USER_CONVERSATION_STEP = `
  UPDATE user_conversations
  SET current_step_id = $2,
      answers = $3,
      updated_at = NOW()
  WHERE id = $1;
`;

/**
 * Marca como completada una conversación específica por ID.
 * 
 * @param {number} conversationId
 */
export const COMPLETE_USER_CONVERSATION = `
  UPDATE user_conversations
  SET completed = true,
      updated_at = NOW()
  WHERE id = $1;
`;


export const FIND_OR_CREATE_USER = `
  INSERT INTO users (phone)
  VALUES ($1)
  ON CONFLICT (phone) DO NOTHING;
`;


export const GET_STEPS_BY_FLOW = `
  SELECT * FROM flow_steps
  WHERE flow_name = $1
  ORDER BY display_order ASC
`;

export const GET_LAST_USER_STEP = `
  SELECT fs.*
  FROM user_conversations uc
  JOIN flow_steps fs ON uc.current_step_id = fs.step_key
  WHERE uc.user_id = $1
    AND uc.completed = false
  ORDER BY uc.updated_at DESC
  LIMIT 1;
`;

/**
 * Obtiene la conversación activa y respuestas del usuario por ID.
 * 
 * @param $1 - ID del usuario
 * @returns {Object} - id de la conversación y campo answers
 */
export const GET_ACTIVE_CONVERSATION_BY_USER_ID = `
  SELECT id, answers
  FROM user_conversations
  WHERE user_id = $1
    AND completed = false
  ORDER BY updated_at DESC
  LIMIT 1;
`;


/**
 * Obtiene las respuestas (`answers`) de la conversación activa de un usuario por teléfono.
 * Retorna NULL si no hay conversación activa.
 */
export const GET_ACTIVE_ANSWERS_BY_PHONE = `
  SELECT uc.answers
  FROM user_conversations uc
  JOIN users u ON uc.user_id = u.id
  WHERE u.phone = $1
    AND uc.completed = false
    AND uc.expires_at > NOW()
  ORDER BY uc.updated_at DESC
  LIMIT 1;
`;



/* MENU QUERIES */

/**
 * Consulta el menú activo de un usuario (conversación tipo 'menu' no completada ni expirada).
 *
 * @param $1 - Número de teléfono
 * @returns {Object|null} Fila de user_conversations si hay un menú activo
 */
export const GET_ACTIVE_MENU_FOR_USER = `
  SELECT uc.*
  FROM user_conversations uc
  JOIN users u ON uc.user_id = u.id
  WHERE u.phone = $1
    AND uc.completed = false
    AND uc.expires_at > NOW()
    AND uc.conversation_type = 'menu'
  ORDER BY uc.updated_at DESC
  LIMIT 1;
`;

/**
 * Crea una nueva conversación tipo 'menu' para un usuario.
 *
 * @param $1 - Número de teléfono
 * @param $2 - Nombre del menú inicial (menu_name)
 * @param $3 - Tiempo de expiración (minutos)
 */
export const START_USER_MENU = `
  INSERT INTO user_conversations (
    user_id, flow_name, conversation_type, current_step_id, answers, updated_at, expires_at, completed
  )
  VALUES (
    (SELECT id FROM users WHERE phone = $1),
    $2,
    'menu',
    $2,
    '{}'::jsonb,
    NOW(),
    NOW() + ($3 || ' minutes')::interval,
    false
  );
`;

/**
 * Actualiza el menú actual en la conversación activa del usuario.
 *
 * @param $1 - ID de user_conversations
 * @param $2 - Nuevo menu_name (actualiza current_step_id)
 */
export const UPDATE_MENU_STEP = `
  UPDATE user_conversations
  SET current_step_id = $2,
      updated_at = NOW()
  WHERE id = $1
    AND conversation_type = 'menu';
`;

/**
 * Marca una conversación tipo 'menu' como completada.
 *
 * @param $1 - ID de user_conversations
 */
export const COMPLETE_USER_MENU = `
  UPDATE user_conversations
  SET completed = true,
      updated_at = NOW()
  WHERE id = $1
    AND conversation_type = 'menu';
`;

/**
 * Consulta las opciones activas de un menú dado (ordenadas por posición).
 *
 * @param $1 - Nombre del menú (menu_name)
 * @returns {Array} Lista de opciones visibles con display_text y efecto asociado
 */
export const GET_ACTIVE_MENU_OPTIONS = `
  SELECT option_id, display_text, effect, effect_target
  FROM menu_options
  WHERE menu_name = $1
    AND is_active = true
  ORDER BY position ASC;
`;

export const GET_MENU_BY_NAME = `
  SELECT *
  FROM menus
  WHERE menu_name = $1 AND is_active = true
  LIMIT 1;
`;

export const GET_MENU_OPTIONS = `
  SELECT option_id, display_text, effect, effect_target, position
  FROM menu_options
  WHERE menu_name = $1 AND is_active = true
  ORDER BY position ASC;
`;

/**
 * Consulta una opción de menú por su ID.
 * Usada para mapear la respuesta de WhatsApp con su efecto correspondiente.
 */
export const GET_OPTION_BY_ID = `
  SELECT *
  FROM menu_options
  WHERE option_id = $1
    AND is_active = TRUE
  LIMIT 1;
`;

/**
 * Marca como completadas todas las conversaciones tipo 'menu' vencidas de un usuario.
 */
export const EXPIRE_MENUS_FOR_USER = `
  UPDATE user_conversations
  SET completed = true
  WHERE user_id = (
    SELECT id FROM users WHERE phone = $1
  )
  AND completed = false
  AND expires_at <= NOW()
  AND conversation_type = 'menu';
`;


export const GET_MENU_BY_KEYWORD = `
  SELECT menu_name
  FROM menu_keywords
  WHERE LOWER(keyword) = $1 AND active = true
  LIMIT 1;
`;

export const COMPLETE_ACTIVE_MENU_FOR_USER = `
  UPDATE user_conversations
  SET completed = true
  WHERE id IN (
    SELECT uc.id
    FROM user_conversations uc
    JOIN users u ON uc.user_id = u.id
    WHERE u.phone = $1 AND uc.completed = false AND uc.conversation_type = 'menu'
  )
`;

export const GET_LAST_CONVERSATION_FOR_USER = `
  SELECT uc.flow_name, uc.conversation_type, uc.updated_at
  FROM user_conversations uc
  JOIN users u ON uc.user_id = u.id
  WHERE u.phone = $1
  ORDER BY uc.updated_at DESC
  LIMIT 1
`;