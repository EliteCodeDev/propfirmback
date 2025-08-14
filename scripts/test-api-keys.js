/**
 * Script de ejemplo para probar la autenticación con API Keys
 * 
 * Uso:
 * 1. Asegúrate de que el servidor esté corriendo
 * 2. Crea una API key usando el endpoint de administración
 * 3. Ejecuta: node scripts/test-api-keys.js
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000'; // Cambia según tu configuración
const API_KEY = 'pk_your_api_key_here'; // Reemplaza con tu API key real

// Función helper para hacer requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Usar API key en header x-api-key
async function testApiKeyHeader() {
  console.log('\n🔑 Test 1: API Key en header x-api-key');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/          ',
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 2: Usar API key en Authorization header
async function testApiKeyAuth() {
  console.log('\n🔑 Test 2: API Key en Authorization header');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smt-api/accounts',
    method: 'GET',
    headers: {
      'Authorization': `ApiKey ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 3: Probar sin autenticación (debería fallar)
async function testNoAuth() {
  console.log('\n❌ Test 3: Sin autenticación (debería fallar)');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smt-api/accounts',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 4: Probar con API key inválida
async function testInvalidApiKey() {
  console.log('\n❌ Test 4: API Key inválida (debería fallar)');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smt-api/accounts',
    method: 'GET',
    headers: {
      'x-api-key': 'pk_invalid_key_12345',
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejecutar todos los tests
async function runTests() {
  console.log('🚀 Iniciando tests de API Keys...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  
  await testApiKeyHeader();
  await testApiKeyAuth();
  await testNoAuth();
  await testInvalidApiKey();
  
  console.log('\n✅ Tests completados');
}

// Verificar que se haya configurado la API key
if (API_KEY === 'pk_your_api_key_here') {
  console.error('❌ Error: Debes configurar una API key válida en la variable API_KEY');
  console.log('\n📝 Pasos para obtener una API key:');
  console.log('1. Inicia sesión como administrador');
  console.log('2. Haz una petición POST a /api/api-keys con:');
  console.log('   {');
  console.log('     "name": "Test Key",');
  console.log('     "description": "API key para testing"');
  console.log('   }');
  console.log('3. Copia la API key de la respuesta');
  console.log('4. Reemplaza API_KEY en este script');
  process.exit(1);
}

// Ejecutar
runTests().catch(console.error);