const http = require('http'); //Pega os códigos de manipulação de http
const fs = require('fs'); //Pega os códigos de manipulação de file system
const path = require('path'); //Pega os códigos de manipulação de caminhos

const DB_FILE = 'db.json'; //Pega o arquivo onde tudo é salvo

// Função para carregar bancos salvos
function loadDatabases() {
    if (fs.existsSync(DB_FILE)) { //Se o arquivo existe
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); //Retorna ele, lido como utf8
    }
    return {}; // Retorna um objeto vazio se não houver arquivo
}

// Função para salvar bancos no arquivo
function saveDatabases(databases) {
    fs.writeFileSync(DB_FILE, JSON.stringify(databases, null, 2)); //Escreve no arquivo os bancos de dados passados no parametro
}

let databases = loadDatabases(); // Carregar bancos ao iniciar o servidor

http.createServer((req, res) => { //Cria o servidor no localhost:8080
    let filePath = req.url === '/' ? 'bdhtml.html' : req.url.substring(1); //Se o filepath for só uma /, serve ao bdhtml.html, se não for só / serve ao que for passado (Exemplo: / = bdhtml.html, /banco.html = banco.html)

    // Se for um arquivo estático (CSS, JS, etc.), servir normalmente
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) { //Se terminar com .js ou .css
        const extname = path.extname(filePath);
        const contentType = extname === '.js' ? 'text/javascript' : 'text/css'; //Se terminar com js, serve ao tipo javascript, se não terminar com js serve ao tipo css.
    
        fs.readFile(path.join(__dirname, filePath), (err, data) => { //Esse código lê o arquivo juntando o caminho (dirname) com o filePath pra chegar no arquivo.
            if (err) { //Se der erro
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo não encontrado</h1>'); //Arquivo não encontrado
            } else { //Se der certo
                res.writeHead(200, { 'Content-Type': contentType }); //Pega o tipo de conteudo
                res.end(data); //Passa a data como resposta
            }
        });
        return;
    }
    // Se a URL começar com "/banco/" e não for um arquivo, carregar banco.html
    if (req.url.startsWith('/banco/') && !filePath.includes('.')) {
        filePath = 'banco.html'; //carrega banco.html no filepath
    }

//----------------------------- A PARTIR DAQUI SÃO AS ROTAS, ESSAS ROTAS SÃO AS QUE EXECUTAM QUANDO OUTRAS PARTES DO CÓDIGO DÃO FETCH! -------------------------------------//

    // Rota para obter os bancos
    if (req.url === '/get-databases' && req.method === 'GET') { //Rota get-databases tem o tipo get, ou seja, pega informação quando chamada. Ela checa por isso!
        res.writeHead(200, { 'Content-Type': 'application/json' }); //Escreve o tipo como aplicação json
        res.end(JSON.stringify(databases)); //Manda como resposta os bancos de dados que a gente tem no JSON, só que em formato de string.
        return;
    }

    // Rota para criar um banco de dados
    if (req.url === '/create-database' && req.method === 'POST') { //Rota create-database tem o tipo post, ou seja, manda informação quando chamada. Ela checa isso!
        let body = ''; //Cria um body vazio
        req.on('data', chunk => { body += chunk; }); //Primeiro recebe todos os dados em chunks, e vai adicionando-os ao body
        req.on('end', () => { //Quando termina de receber todos os dados, end começa
            let { dbName } = JSON.parse(body); //Transforma a string body em arquivo JSON e pega o atributo dbname desse arquivo JSON
            if (dbName && !databases[dbName]) { //Se dbname existe e não está armazenado 
                databases[dbName] = {}; //Cria um banco para esse dbname criado
                saveDatabases(databases); // Salva no arquivo JSON
                res.writeHead(200, { 'Content-Type': 'application/json' }); //Responde o tipo como aplicação json
                res.end(JSON.stringify({ success: true, databases })); //Manda como resposta os bancos de dados e o sucesso.
            } else { //Se dbname não existe ou ja existe algo armazenado com esse nome
                res.writeHead(400, { 'Content-Type': 'application/json' }); //Responde o tipo como aplicação json
                res.end(JSON.stringify({ success: false, message: 'Nome inválido ou banco já existe' })); //Manda como resposta um aviso e a falha.
            }
        });
        return;
    }
    // Rota para criar tabelas
    if (req.url.startsWith('/create-table') && req.method === 'POST') { //Rota create-table tem o tipo post, ou seja, manda informação quando chamada. Ela checa isso!
        let body = ''; //Cria um body vazio
        req.on('data', chunk => { body += chunk; }); //Primeiro recebe todos os dados em chunks, vai adicionando-os ao body
        req.on('end', () => { //Quando termina de receber todos os dados, end começa
            let { dbName, tableName, keys } = JSON.parse(body); //Pega os valores dbName,tableName e keys do arquivo json
            let normalizedDBName = decodeURIComponent(dbName); //Normaliza os nomes (se tiver acento, ç e etc ele normaliza pra não dar erro)
            let normalizedTableName = decodeURIComponent(tableName); //Normaliza os nomes (se tiver acento, ç e etc ele normaliza pra não dar erro)
            if (databases[normalizedDBName]) { //Se o banco de dados existe
                if (!databases[normalizedDBName][normalizedTableName]) { //Se a tabela NÃO existe
                    // Criamos a tabela com as chaves definidas
                    databases[normalizedDBName][normalizedTableName] = { //A tabela é criada
                        keys: keys.map(key => ({ name: key.key, type: key.type })), //Ela é criada com chave, chave possui nome e tipo. Exemplo: ID, number
                        data: [] //E é criada com o dado dela. Exemplo: 1
                    };
                    saveDatabases(databases); //Salva os novos bancos de dados com a tabela nova
    
                    res.writeHead(200, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação Json
                    res.end(JSON.stringify({ success: true })); //Envia o sucesso
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação Json
                    res.end(JSON.stringify({ success: false, message: 'Tabela já existe' })); //Envia a falha e a mensagem
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação Json
                res.end(JSON.stringify({ success: false, message: 'Banco não encontrado' })); //Envia a falha e a mensagem
            }
        });
        return;
    }

    // Rota para obter as tabelas de um banco
    if (req.url.startsWith('/get-tables') && req.method === 'GET') { //Rota get-tables tem o tipo get, ou seja, pega informação quando chamada. Ela checa isso!
        let url = new URL(req.url, `http://${req.headers.host}`); //Pega o url baseado no url atual
        let dbName = url.searchParams.get('dbName'); //Pega o parametro da url chamado dbname

        if (databases[dbName]) { //Se no banco existe esse banco passado no URL
            let tableNames = Object.keys(databases[dbName]); //Pega o nome das tabelas desse banco
            res.writeHead(200, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação JSON
            res.end(JSON.stringify({ success: true, tables: tableNames })); //Envia o sucesso e os nomes das tabelas
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação JSON
            res.end(JSON.stringify({ success: false, message: 'Banco não encontrado' })); //Envia a falha e a mensagem
        }
        return;
    }
    
    // Rota para Inserir dados em uma tabela
    if (req.url.startsWith('/insert-data') && req.method === 'POST') { //Rota insert-data tem o tipo post, ou seja, manda informação quando chamada. Ela checa isso!
        let body = ''; //Cria um body vazio
        req.on('data', chunk => { body += chunk; }); //Lê os dados e vai adicionando-os ao body
        req.on('end', () => { //Quando termina de ler todos os dados, inicia o end
            let { dbName, tableName, data } = JSON.parse(body); //Pega os atributos dbname, tablename e data do arquivo JSON
            let normalizedDBName = decodeURIComponent(dbName); //Normaliza os nomes (para não ter problema com acentos e ç)
            let normalizedTableName = decodeURIComponent(tableName); //Normaliza os nomes (para não ter problema com acentos e ç)

            if (databases[normalizedDBName] && databases[normalizedDBName][normalizedTableName]) { //Se o banco existe e a tabela existe
                let table = databases[normalizedDBName][normalizedTableName]; //Cria a variavel tabela
                console.log('Dados recebidos para inserção:', data); //Console.log só para debug, não é necessario!
                
                // Validar os tipos antes de salvar os dados
                let validatedData = {}; //Cria a variavel que armazenará os dados validados
                Object.keys(data).forEach(key => { //Pra cada chave
                    let keyType = table.keys.find(k => k.name === key).type; //Pega o tipo de cada chave
    
                    // Valida o tipo de dado de acordo com o tipo especificado na chave
                    if (keyType === 'number') {
                        validatedData[key] = Number(data[key]);  // Converte para número
                    } else if (keyType === 'boolean') {
                        validatedData[key] = (data[key] === 'true');  // Converte para booleano
                    } else if (keyType === 'text') {
                        validatedData[key] = String(data[key]);  // Converte para texto
                    }
                });

                table.data.push(validatedData); //Coloca os dados na tabela
                saveDatabases(databases); //Salva os bancos com os dados novos
    
                res.writeHead(200, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação JSON
                res.end(JSON.stringify({ success: true, table: table.data })); //Envia o sucesso e os dados da tabela
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação JSON
                res.end(JSON.stringify({ success: false, message: 'Banco ou tabela não encontrada' })); //Envia a falha e a mensagem.
            }
        });
        return;
    }
    // Rota para acessar uma tabela dentro de um banco
    if (req.url.startsWith('/tabela/') && req.url.split('/').length === 4) { //Rota de acesso de tabela
        let [_, __, dbName, tableName] = req.url.split('/'); //Pega o nome do banco e da tabela baseado nos splits
        let normalizedDBName = decodeURIComponent(dbName); //Normaliza o dbname
        let normalizedTableName = decodeURIComponent(tableName); //Normaliza o tablename
        if (databases[normalizedDBName] && databases[normalizedDBName][normalizedTableName]) { //Se existe o banco e a tabela
            filePath = 'tabela.html'; // Se o banco e a tabela existem, serve o conteúdo da tabela
        } else { //Se não existir banco ou tabela
            res.writeHead(404, { 'Content-Type': 'text/html' }); //Fala que o tipo é html
            res.end('<h1>404 - Banco ou Tabela não encontrados</h1>'); //Escreve banco de dados não encontrado
            return;
        }
    }

    //Rota de obter chaves da tabela
    if (req.url.startsWith('/get-table-keys') && req.method === 'GET') { //Rota get-table-keys tem o tipo get, ou seja, pega informação quando chamada. Ela checa por isso!
        let urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams; //Pega cada um dos parametros da url
        let dbName = decodeURIComponent(urlParams.get('dbName')); //Pega o banco de dados
        let tableName = decodeURIComponent(urlParams.get('tableName')); //Pega a tabela
    
        if (databases[dbName] && databases[dbName][tableName]) { //Se o banco e a tabela existem
            res.writeHead(200, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação json
            res.end(JSON.stringify({ keys: databases[dbName][tableName].keys })); //Envia por fim as chaves dessa tabela
        } else { //Se banco ou tabela não existem
            res.writeHead(404, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação json
            res.end(JSON.stringify({ success: false, message: 'Tabela não encontrada' })); //Envia por fim a falha e a mensagem
        }
        return;
    }

    // Rota de obter dados da tabela
    if (req.url.startsWith('/get-table-data') && req.method === 'GET') { //Rota get-table-data tem o tipo get, ou seja, pega informação quando chamada. Ela checa por isso!
        let urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams; //Pega cada um dos parametros da url
        let dbName = decodeURIComponent(urlParams.get('dbName')); //Pega o banco de dados
        let tableName = decodeURIComponent(urlParams.get('tableName')); //Pega a tabela

        if (!dbName || !tableName) { //Se qualquer um dos dois nomes não existir
            res.writeHead(400, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação json
            return res.end(JSON.stringify({ success: false, message: 'Banco ou tabela não especificados' })); //Envia a falha e a mensagem
        }

        if (databases[dbName] && databases[dbName][tableName]) { //Se ambos existem
            let table = databases[dbName][tableName]; //Armazena a tabela
            res.writeHead(200, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação json
            res.end(JSON.stringify({ success: true, keys: table.keys, rows: table.data })); //Envia o sucesso, as chaves e os dados.
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' }); //Fala que o tipo é aplicação json
            res.end(JSON.stringify({ success: false, message: 'Tabela não encontrada' })); //Envia a falha e a mensagem
        }
        return;
    }

    //------------------------------------------------------------------------- FIM DAS ROTAS ------------------------------------------------------------------------------//

    // Lê e retorna o arquivo solicitado
    fs.readFile(filePath, (err, data) => { //Lê o arquivo passado pelo filePath
        if (err) { //Se der erro
            res.writeHead(404, { 'Content-Type': 'text/html' }); 
            res.end('<h1>404 - Arquivo não encontrado</h1>'); //Envia 404
        } else { //Se der certo
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data); //Envia dados do arquivo lido
        }
    });

}).listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080'); //Debug para checar se o servidor rodou mesmo.
});