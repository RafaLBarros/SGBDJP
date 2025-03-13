// Captura o nome do banco da URL (novo formato: /banco/NomeDoBanco)
function getDatabaseName() {
    let path = window.location.pathname; // Ex: "/banco/MeuBanco"
    let dbName = decodeURIComponent(path.split("/")[2]); // Pega "MeuBanco"
    return dbName;
}

// Atualiza o título da página com o nome do banco
document.addEventListener("DOMContentLoaded", function () {
    let dbName = getDatabaseName();
    if (dbName) {
        console.log(dbName)
        document.getElementById('dbTitle').textContent = `${dbName}`;
        document.getElementById('dbTitleHeader').textContent = `Banco: ${dbName}`;
        updateTableList(dbName);  // Carregar as tabelas do banco
    } else {
        document.getElementById('dbTitle').textContent = "Banco não encontrado";
    }
});

// Função para voltar para a página principal
function voltar() {
    window.location.href = '/';
}

// Criar tabela dentro do banco
function createTable() {
    let tableName = document.getElementById('tableName').value;
    let keysInput = document.getElementById('tableKeys').value;

    if (!tableName || !keysInput) {
        alert('Nome da tabela e chaves são obrigatórios!');
        return;
    }

    let keys = keysInput.split(',').map(key => key.trim()); // Transforma em array

    fetch('/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName: getDatabaseName(), tableName, keys })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateTableList();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao criar tabela:', error));
}

// Atualizar a lista de tabelas na página
function updateTableList() {
    let dbName = getDatabaseName();
    fetch(`/get-databases`)
        .then(response => response.json())
        .then(data => {
            let dbTables = data[dbName] || {};
            let tableList = document.getElementById('tableList');

            tableList.innerHTML = ''; // Limpa a lista antes de recriar

            for (let tableName in dbTables) {
                let li = document.createElement('li');
                let link = document.createElement('a');

                link.href = `/tabela/${encodeURIComponent(dbName)}/${encodeURIComponent(tableName)}`;
                link.textContent = tableName;
                link.style.cursor = 'pointer';

                li.appendChild(link);
                tableList.appendChild(li);
            }
        })
        .catch(error => console.error('Erro ao atualizar lista de tabelas:', error));
}

// Inserir dados na tabela selecionada
function insertData() {
    let rowData = {};
    document.querySelectorAll('#insertDataForm input').forEach(input => {
        rowData[input.id] = input.value;
    });

    fetch('/insert-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName: getDatabaseName(), tableName: getTableName(), rowData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Dados inseridos com sucesso!');
            updateTableView();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao inserir dados:', error));
}

// Atualizar a exibição dos dados na tabela
function updateTableView() {
    fetch(`/get-table-data?dbName=${encodeURIComponent(getDatabaseName())}&tableName=${encodeURIComponent(getTableName())}`)
    .then(response => response.json())
    .then(data => {
        let thead = document.getElementById('tableHead');
        let tbody = document.getElementById('tableBody');
        
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Criar cabeçalho da tabela
        let trHead = document.createElement('tr');
        data.keys.forEach(key => {
            let th = document.createElement('th');
            th.textContent = key;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Criar linhas de dados
        data.rows.forEach(row => {
            let tr = document.createElement('tr');
            data.keys.forEach(key => {
                let td = document.createElement('td');
                td.textContent = row[key] || ''; // Exibe o valor ou vazio se não existir
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    })
    .catch(error => console.error('Erro ao carregar dados da tabela:', error));
}