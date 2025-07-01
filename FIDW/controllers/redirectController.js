import { pool } from '../database/db.js';

export const redirectToWhatsApp = async (req, res) => {
  const posId = parseInt(req.query.pos_id);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!posId || isNaN(posId)) {
    // Registrar intento con parámetro inválido
    try {
      await pool.query(
        'INSERT INTO scan_logs (ip, error) VALUES ($1, $2)',
        [ip, 'ID inválido o ausente']
      );
    } catch (err) {
      console.error('❌ Error registrando intento inválido:', err);
    }

    return res.status(400).send('❌ Parámetro pos_id inválido.');
  }

  try {
    // Buscar número asociado al POS
    const result = await pool.query(`
      SELECT b.ws_number, p.name AS pos_name
      FROM pos p
      JOIN business b ON b.id = p.id_business
      WHERE p.id = $1
    `, [posId]);

    if (result.rows.length === 0) {
      // Registrar intento fallido: POS no existe
      await pool.query(
        'INSERT INTO scan_logs (ip, error) VALUES ($1, $2)',
        [ip, `POS no encontrado: ${posId}`]
      );
      return res.status(404).send('❌ POS no encontrado.');
    }

    const { ws_number, pos_name } = result.rows[0];

    // Registrar intento exitoso
    await pool.query(
      'INSERT INTO scan_logs (phone, pos_id, ip) VALUES ($1, $2, $3)',
      [ws_number, posId, ip]
    );

    const message = encodeURIComponent(`Hola, quiero unirme al club de descuentos)`);
    return res.redirect(`https://wa.me/${ws_number}?text=${message}`);
  } catch (error) {
    console.error('❌ Error en redireccionamiento:', error);

    // Registrar error interno también
    try {
      await pool.query(
        'INSERT INTO scan_logs (ip, error) VALUES ($1, $2)',
        [ip, `Error interno al procesar POS ${posId}`]
      );
    } catch (e) {
      console.error('❌ Error registrando fallo interno:', e);
    }

    return res.status(500).send('❌ Error interno.');
  }
};
