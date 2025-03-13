// Captura o nome do banco e da tabela da URL
function getTableInfo() {
    let path = window.location.pathname;
    let parts = path.split('/');
    let dbName = decodeURIComponent(parts[2]);
    let tableName = decodeURIComponent(parts[3]);
    return { dbName, tableName };
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM totalmente carregado!");
    let { dbName, tableName } = getTableInfo();
    document.getElementById('tableTitle').textContent = `Tabela: ${tableName}`;

    // Carregar dados da tabela
    fetch(`/get-table-data?dbName=${dbName}&tableName=${tableName}`)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Verifica se a resposta está correta
            if (data.success) {
                // Atualiza os campos do formulário de inserção
                updateTableHeader(data.keys);
                updateTableBody(data.rows);  // Atualizado para data.rows ao invés de data.data
                updateFormFields(data.keys);
            } else {
                alert(data.message);  // Exibe o erro de tabela não encontrada
            }
        })
        .catch(error => console.error('Erro ao carregar tabela:', error));
});

// Atualizar o cabeçalho da tabela com as chaves
function updateTableHeader(keys) {
    let header = document.getElementById('tableHeader');
    header.innerHTML = '';
    keys.forEach(key => {
        let th = document.createElement('th');
        th.textContent = key;
        header.appendChild(th);
    });
}

// Atualizar o corpo da tabela com os dados
function updateTableBody(rows) {
    let tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Limpa o conteúdo atual

    rows.forEach(row => {
        let rowElement = document.createElement('tr');
        Object.values(row).forEach(value => {
            let td = document.createElement('td');
            td.textContent = value;
            rowElement.appendChild(td);
        });
        tableBody.appendChild(rowElement);
    });
}

// Atualizar o formulário com os campos necessários
function updateFormFields(keys) {
    let formFields = document.getElementById('formFields');
    formFields.innerHTML = ''; // Limpa os campos

    keys.forEach(key => {
        let label = document.createElement('label');
        label.textContent = key;
        let input = document.createElement('input');
        input.type = 'text';
        input.name = key;
        formFields.appendChild(label);
        formFields.appendChild(input);
    });
}

// Inserir dados na tabela
document.getElementById('insertDataForm').addEventListener('submit', function (event) {
    event.preventDefault();

    let { dbName, tableName } = getTableInfo();
    let formData = new FormData(this);
    let data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    fetch('/insert-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName, tableName, data })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Dados inseridos com sucesso!');
            updateTableBody(data.table); // Atualiza a tabela com os dados inseridos
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao inserir dados:', error));
});

// Voltar para a página do banco
function voltar() {
    let { dbName } = getTableInfo();
    window.location.href = `/banco/${dbName}`;
}