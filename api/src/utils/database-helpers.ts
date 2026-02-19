export function convertMySQLResult<T = any>(result: [any[], any]): { rows: T[] } {
  return { rows: result[0] };
}


export function pgToMySQL(query: string, params: any[]): [string, any[]] {
  let mysqlQuery = query;
  const sortedParams = [];
  
  
  for (let i = params.length; i >= 1; i--) {
    mysqlQuery = mysqlQuery.replace(new RegExp(`\\$${i}`, 'g'), '?');
  }
  
  return [mysqlQuery, params];
}
