"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMySQLResult = convertMySQLResult;
exports.pgToMySQL = pgToMySQL;
function convertMySQLResult(result) {
    return { rows: result[0] };
}
function pgToMySQL(query, params) {
    let mysqlQuery = query;
    const sortedParams = [];
    for (let i = params.length; i >= 1; i--) {
        mysqlQuery = mysqlQuery.replace(new RegExp(`\\$${i}`, 'g'), '?');
    }
    return [mysqlQuery, params];
}
//# sourceMappingURL=database-helpers.js.map