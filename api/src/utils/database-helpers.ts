// Helper to convert MySQL result format [rows[], fields] to { rows: [] }
export function convertMySQLResult<T = any>(result: [any[], any]): { rows: T[] } {
  return { rows: result[0] };
}

// Convert PostgreSQL placeholders ($1, $2, etc) to MySQL placeholders (?)
export function pgToMySQL(query: string, params: any[]): [string, any[]] {
  let mysqlQuery = query;
  const sortedParams = [];
  
  // Replace $n with ? in order
  for (let i = params.length; i >= 1; i--) {
    mysqlQuery = mysqlQuery.replace(new RegExp(`\\$${i}`, 'g'), '?');
  }
  
  return [mysqlQuery, params];
}
