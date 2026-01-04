require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log("--- DIAGNOSTIC START ---");
    console.log(`1. Reading .env file...`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Password: ${process.env.DB_PASS}`);

    try {
        console.log("2. Attempting to Connect to MySQL...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log("✅ SUCCESS! Password and Database Name are correct.");
        
        console.log("3. Checking 'users' Table...");
        const [rows] = await connection.execute("DESCRIBE users;");
        console.log("   Table found! Column sizes:");
        
        rows.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type}`);
        });

        // Check if password column is big enough
        const passCol = rows.find(r => r.Field === 'password');
        if (passCol && passCol.Type.includes('varchar(10)')) {
            console.log("\n⚠️ WARNING: Your password column is too small (varchar(10)).");
            console.log("   This is why your login is failing!");
        } else {
            console.log("\n✅ Table structure looks good.");
        }
        
        await connection.end();

    } catch (err) {
        console.error("\n❌ FATAL ERROR FOUND:");
        console.error("-----------------------");
        console.error(err.message); // <--- THIS IS THE ANSWER
        console.error("-----------------------");
        
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log("👉 FIX: Your Password in .env is wrong.");
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.log("👉 FIX: Your Database Name in .env is wrong.");
        } else if (err.code === 'ECONNREFUSED') {
            console.log("👉 FIX: MySQL is not running.");
        }
    }
}

testConnection();