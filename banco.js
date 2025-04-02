// Captura o nome do banco da URL (novo formato: /banco/NomeDoBanco)
function getDatabaseName() {
    let path = window.location.pathname; // Pega o caminho do banco Ex: "/banco/MeuBanco"
    let dbName = decodeURIComponent(path.split("/")[2]); // Pega "MeuBanco" Separando pela barra, usa o decodeURIComponent pra não travar com acentos ou ç
    return dbName;
}

// Atualiza o título da página com o nome do banco
document.addEventListener("DOMContentLoaded", function () { //Quando o DOM carregar, executa esse código
    let dbName = getDatabaseName(); // Pega o nome do banco usando a função
    if (dbName) { //Se o banco existe
        console.log(dbName) //Printa só pra debug! Não é necessário.
        document.getElementById('dbTitle').textContent = `${dbName}`; //Faz o Titulo da Pagina no HTML virar o nome do banco
        document.getElementById('dbTitleHeader').textContent = `Banco: ${dbName}`; //Faz o Titulo escrito na pagina ficar Banco: Nome do Banco
        updateTableList(dbName); // Usa a função para atualizar a lista de tabelas baseado no banco selecionado
    } else {
        document.getElementById('dbTitle').textContent = "Banco não encontrado"; //Se der errado, fala que o banco não foi encontrado.
    }
});

// Função para voltar para a página principal
function voltar() {
    window.location.href = '/'; //Faz a página voltar para a / padrão, voltando ao inicio.
}

// Criar tabela dentro do banco
function createTable() {
    let tableName = document.getElementById('tableName').value; //Pega o valor no formulario pro nome da tabela
    let keysInput = document.getElementById('tableKeys').value; //Pega o valor no formulario pras chaves da tabela
    let typesInput = document.getElementById('tableTypes').value; //Pega o valor no formulario pros tipos da tabela

    if (!tableName || !keysInput || !typesInput) {  //Se não tiver valor de nome ou de chave ou de tipo
        alert('Nome da tabela, chaves e tipos são obrigatórios!'); //Joga um alerta falando q são obrigatórios
        return;
    }

    let keys = keysInput.split(',').map(key => key.trim()); // Transforma em array separando as chaves por virgula
    let types = typesInput.split(',').map(type => type.trim());

    // Verifica se a quantidade de tipos bate com a quantidade de chaves
    if (keys.length !== types.length) {
        alert('O número de tipos não corresponde ao número de chaves!');
        return;
    }
    for (i = 0;i < types.length; i++) {
        if(types[i] != "text" && types[i] != "boolean" && types[i] != "number"){
            alert('Os tipos devem ser text, number ou boolean!');
            return;
        }
    }

    // Associa tipos às chaves
    let keyTypes = keys.map((key, index) => ({ key, type: types[index] }));

    fetch('/create-table', { //Faz um fetch de create-table, passando o nome do banco de dados, o nome da tabela e suas chaves com seus tipos.
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName: getDatabaseName(), tableName, keys: keyTypes })
    })
    .then(response => response.json()) //Pega a resposta e transforma em json
    .then(data => {
        if (data.success) {
            updateTableList(); //Se der tudo certo, da um update na tabela para ja mostrar a tabela nova.
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao criar tabela:', error));
}

// Atualizar a lista de tabelas na página
function updateTableList() {
    let dbName = getDatabaseName(); //Pega o nome do banco de dados usando a função
    fetch(`/get-databases`) //Da um fetch pra pegar os bancos do arquivo json
        .then(response => response.json()) //pega a resposta e transforma em json
        .then(data => {
            let dbTables = data[dbName] || {}; //Pega as tabelas por banco de dados.
            let tableList = document.getElementById('tableList'); //Pega a lista no html.

            tableList.innerHTML = ''; // Limpa a lista antes de recriar

            for (let tableName in dbTables) {
                let li = document.createElement('li'); //Pra cada nome de tabela na lista das tabelas, cria um li no html
                let link = document.createElement('a'); //Pra cada nome de tabela na lista das tabelas, cria um a no html

                link.href = `/tabela/${encodeURIComponent(dbName)}/${encodeURIComponent(tableName)}`; //Faz o link levar para a página da tabela
                link.textContent = tableName; //Faz o conteudo do link ser o nome da tabela
                link.style.cursor = 'pointer'; //Faz o cursor mudar quando passar por cima do link

                li.appendChild(link); //Coloca o link dentro do li
                tableList.appendChild(li); //Coloca o li dentro tableList
            }
        })
        .catch(error => console.error('Erro ao atualizar lista de tabelas:', error));
}

// Inserir dados na tabela selecionada
function insertData() {
    let rowData = {}; //Cria um dicionário de data
    document.querySelectorAll('#insertDataForm input').forEach(input => { //Seleciona todos os insertDataForm e pra cada um deles
        rowData[input.id] = input.value; //Coloca no dicionário o id como chave e o valor respectivo como o valor no dicionário.
    });

    fetch('/insert-data', { //Faz um fetch inserindo a data
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName: getDatabaseName(), tableName: getTableName(), rowData }) //Passa o nome do banco de dados, o nome da tabela e a data do dicionário criado.
    })
    .then(response => response.json()) //Pega a resposta e transforma em json
    .then(data => { //Pega a data
        if (data.success) {
            alert('Dados inseridos com sucesso!');
            updateTableView(); //Se deu certo, atualiza a visualização de tabelas
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao inserir dados:', error));
}

// Atualizar a exibição dos dados na tabela
function updateTableView() {
    fetch(`/get-table-data?dbName=${encodeURIComponent(getDatabaseName())}&tableName=${encodeURIComponent(getTableName())}`) //Da um fetch pra receber os dados da tabela
    .then(response => response.json()) //Transforma em json
    .then(data => {
        let thead = document.getElementById('tableHead'); //Pega o cabeçalho das Tabelas
        let tbody = document.getElementById('tableBody'); //Pega o corpo das Tabelas
        
        thead.innerHTML = ''; //Limpa o cabeçalho
        tbody.innerHTML = ''; //Limpa o corpo

        // Criar cabeçalho da tabela
        let trHead = document.createElement('tr'); //Cria um cabeçalho pra tabela
        data.keys.forEach(key => { //Pra cada chave da tabela
            let th = document.createElement('th'); //Cria um th pra cada chave
            th.textContent = key; //Coloca o conteudo do th como a chave em si
            trHead.appendChild(th); //Coloca o th no cabeçalho dessa tabela
        });
        thead.appendChild(trHead); //Coloca o cabeçalho da tabela completa na pagina das tabelas.

        // Criar linhas de dados
        data.rows.forEach(row => { //Pra cada linha de dados
            let tr = document.createElement('tr'); //Cria um tr
            data.keys.forEach(key => { //Pra cada chave
                let td = document.createElement('td'); //Cria um td
                td.textContent = row[key] || ''; // Coloca o conteudo dos dados baseado na chave
                tr.appendChild(td); //Coloca o conteudo na linha de dados
            });
            tbody.appendChild(tr); //Coloca a linha de dados no corpo das Tabelas
        });
    })
    .catch(error => console.error('Erro ao carregar dados da tabela:', error));
}