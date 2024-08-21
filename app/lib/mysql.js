//mysql.js
//import mysql from 'serverless-mysql';
//export const mysql = require('serverless-mysql')() // <-- initialize with function call
/** Инициализация mysql c
 *
 * @type {serverlessMysql.ServerlessMysql | *}
 */
export const mysql = require('serverless-mysql')({
    config: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: 'dashboard_next',
        user: 'root',
        password: '18031966'
    }
})
console.log('Connect to ' + process.env.MYSQL_DATABASE);
export default async function excuteQuery({ query, values }) {
    try {
        const results = await mysql.query(query, values);
        await mysql.end();
        //console.log('Result of query: ' + results);
        return results;
    } catch (error) {
        return { error };
    }
}