const http = require('http');
const fs = require('fs');
const path = require('path');

const DB_FILE = 'db.json';

// Função para carregar bancos salvos
function loadDatabases() {
    if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    return {}; // Retorna um objeto vazio se não houver arquivo
}

// Função para salvar bancos no arquivo
function saveDatabases(databases) {
    fs.writeFileSync(DB_FILE, JSON.stringify(databases, null, 2));
}

let databases = loadDatabases(); // Carregar bancos ao iniciar o servidor

http.createServer((req, res) => {
    let filePath = req.url === '/' ? 'bdhtml.html' : req.url.substring(1);

    // Se for um arquivo estático (CSS, JS, etc.), servir normalmente
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        const extname = path.extname(filePath);
        const contentType = extname === '.js' ? 'text/javascript' : 'text/css';
    
        fs.readFile(path.join(__dirname, filePath), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo não encontrado</h1>');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
        return;
    }

    // Se a URL começar com "/banco/" e não for um arquivo, carregar banco.html
    if (req.url.startsWith('/banco/') && !filePath.includes('.')) {
        filePath = 'banco.html';
    }

    // Rota para obter os bancos
    if (req.url === '/get-databases' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(databases));
        return;
    }

    // Rota para criar um banco de dados
    if (req.url === '/create-database' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let { dbName } = JSON.parse(body);
            if (dbName && !databases[dbName]) {
                databases[dbName] = {}; //Agora o banco começa como um objeto para armazenar tabelas
                saveDatabases(databases); // Salva no arquivo JSON
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, databases }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Nome inválido ou banco já existe' }));
            }
        });
        return;
    }
    // Rota para criar tabelas
    if (req.url.startsWith('/create-table') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let { dbName, tableName, keys } = JSON.parse(body);
            let normalizedDBName = decodeURIComponent(dbName);
            let normalizedTableName = decodeURIComponent(tableName);
            if (databases[normalizedDBName]) {
                if (!databases[normalizedDBName][normalizedTableName]) {
                    // Criamos a tabela com as chaves definidas
                    databases[normalizedDBName][normalizedTableName] = {
                        keys: keys.map(key => ({ name: key.key, type: key.type })), // Armazena tipo também
                        data: []
                    };
                    saveDatabases(databases);
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Tabela já existe' }));
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Banco não encontrado' }));
            }
        });
        return;
    }

    // Rota para obter as tabelas de um banco
    if (req.url.startsWith('/get-tables') && req.method === 'GET') {
        let url = new URL(req.url, `http://${req.headers.host}`);
        let dbName = url.searchParams.get('dbName');

        if (databases[dbName]) {
            let tableNames = Object.keys(databases[dbName]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, tables: tableNames }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Banco não encontrado' }));
        }
        return;
    }
    
    // Rota para Inserir dados em uma tabela
    if (req.url.startsWith('/insert-data') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let { dbName, tableName, data } = JSON.parse(body);
            let normalizedDBName = decodeURIComponent(dbName);
            let normalizedTableName = decodeURIComponent(tableName);

            if (databases[normalizedDBName] && databases[normalizedDBName][normalizedTableName]) {
                let table = databases[normalizedDBName][normalizedTableName];
                console.log('Dados recebidos para inserção:', data);
                
                // Validar os tipos antes de salvar os dados
                let validatedData = {};
                Object.keys(data).forEach(key => {
                    let keyType = table.keys.find(k => k.name === key).type;
    
                    // Valida o tipo de dado de acordo com o tipo especificado na chave
                    if (keyType === 'number') {
                        validatedData[key] = Number(data[key]);  // Converte para número
                    } else if (keyType === 'boolean') {
                        validatedData[key] = (data[key] === 'true');  // Converte para booleano
                    } else if (keyType === 'text') {
                        validatedData[key] = String(data[key]);  // Converte para texto
                    }
                });

                table.data.push(validatedData);
                saveDatabases(databases);
    
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, table: table.data }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Banco ou tabela não encontrada' }));
            }
        });
        return;
    }
    // Rota para acessar uma tabela dentro de um banco
    if (req.url.startsWith('/tabela/') && req.url.split('/').length === 4) {
        let [_, __, dbName, tableName] = req.url.split('/');
        let normalizedDBName = decodeURIComponent(dbName);
        let normalizedTableName = decodeURIComponent(tableName);
        if (databases[normalizedDBName] && databases[normalizedDBName][normalizedTableName]) {
            // Se o banco e a tabela existem, serve o conteúdo da tabela
            filePath = 'tabela.html'; // Certifique-se de que 'tabela.html' existe
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Banco ou Tabela não encontrados</h1>');
            return;
        }
    }

    //Rota de obter chaves da tabela
    if (req.url.startsWith('/get-table-keys') && req.method === 'GET') {
        let urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        let dbName = decodeURIComponent(urlParams.get('dbName'));
        let tableName = decodeURIComponent(urlParams.get('tableName'));
    
        if (databases[dbName] && databases[dbName][tableName]) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ keys: databases[dbName][tableName].keys }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Tabela não encontrada' }));
        }
        return;
    }

    // Rota de obter dados da tabela
    if (req.url.startsWith('/get-table-data') && req.method === 'GET') {
        let urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        let dbName = decodeURIComponent(urlParams.get('dbName'));
        let tableName = decodeURIComponent(urlParams.get('tableName'));

        if (!dbName || !tableName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Banco ou tabela não especificados' }));
        }

        if (databases[dbName] && databases[dbName][tableName]) {
            let table = databases[dbName][tableName];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, keys: table.keys, rows: table.data }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Tabela não encontrada' }));
        }
        return;
    }

    

    // Lê e retorna o arquivo solicitado
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Arquivo não encontrado</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });

}).listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});