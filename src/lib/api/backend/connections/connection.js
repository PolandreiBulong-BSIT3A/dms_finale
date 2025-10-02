import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables (safe to call multiple times)
dotenv.config();

/* const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'ispsc_tagudin_dms_2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}); */

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'ispsc_tagudin_dms_2';
const DB_POOL = Number(process.env.DB_POOL || 10);

// Optional SSL controls
// DB_SSL=true to enable SSL
// DB_SSL_REJECT_UNAUTHORIZED=false to skip cert validation (not recommended for production)
let sslOption = undefined;
if (String(process.env.DB_SSL || '').toLowerCase() === 'true') {
  const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true';
  sslOption = { rejectUnauthorized };
}

const db = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: DB_POOL,
  queueLimit: 0,
  ssl: sslOption
});
// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('✅ Connected to the database successfully');
    connection.release();
  }
});

export default db;
