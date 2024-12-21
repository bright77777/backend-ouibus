const  pool= require('../db/Poolconnect');
const executeQuery = async (query, params) => {
    let attempts = 0;
    maxRetries = 3, 
    retryDelay = 500
    
    while (attempts < maxRetries) {
      try {
        // Sanitize and validate params before executing
        const sanitizedParams = params.map(param => 
          param === undefined || param === null ? '' : param
        );
  
        // Execute the query with sanitized parameters
        const [results] = await pool.execute(query, sanitizedParams);
        return results;
        
      } catch (error) {
        attempts++;
        
        console.error('Detailed Query Execution Error:', {
          errorCode: error.code,
          errorMessage: error.message,
          sqlQuery: error.sql,
          sqlState: error.sqlState,
          attempt: attempts
        });
  
        // Si c'est une erreur ECONNRESET et qu'il reste des tentatives
        if (error.code === 'ECONNRESET' && attempts < maxRetries) {
          console.log(`Retrying query attempt ${attempts}/${maxRetries} after ${retryDelay}ms...`);
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
  
        // Si c'est la dernière tentative ou une autre erreur, on lance l'erreur
        throw new Error(`Database query failed after ${attempts} attempts: ${error.message}`);
      }
    }
  };

  module.exports={executeQuery}