"""
Invoicing adapters: control number generation for internal folios.
Implements Adapter pattern for future fiscal integration (SENIAT).
"""
from db import get_connection, release_connection
from logging_config import logger


class InternalControlAdapter:
    """Generates CTRL-XXXXX control numbers for internal folios."""

    @staticmethod
    def generate_control_number() -> str:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT control_number FROM folios "
                "WHERE control_number LIKE 'CTRL-%' "
                "ORDER BY control_number DESC LIMIT 1"
            )
            row = cur.fetchone()
            if row and row[0]:
                try:
                    last_num = int(row[0].split("-")[1])
                except (ValueError, IndexError):
                    last_num = 0
            else:
                last_num = 0

            new_num = last_num + 1
            control_number = f"CTRL-{new_num:05d}"
            conn.commit()
            cur.close()
            release_connection(conn)
            logger.info(f"Generated control number: {control_number}")
            return control_number
        except Exception as e:
            conn.rollback()
            cur.close()
            release_connection(conn)
            logger.error(f"Error generating control number: {e}")
            raise