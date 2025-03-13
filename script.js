// Carregar bancos salvos ao carregar a página
window.onload = function () {
    fetch('/get-databases')
        .then(response => response.json())
        .then(data => {
            databases = data;
            updateDBList();
        })
        .catch(error => console.error('Erro ao carregar bancos:', error));
};

let databases = {};

// Criar banco no servidor
function createDatabase() {
    let dbName = document.getElementById('dbName').value;
    if (dbName) {
        fetch('/create-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                databases = data.databases;
                updateDBList();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Erro ao criar banco:', error));
    } else {
        alert('Nome do banco inválido!');
    }
}

// Atualizar a lista de bancos na página
function updateDBList() {
    let dbList = document.getElementById('dbList');
    dbList.innerHTML = ''; // Limpa a lista antes de recriar os itens

    for (let dbName in databases) {
        if (typeof databases[dbName] === 'object') { // Verifica se é um banco válido
            let li = document.createElement('li');
            let link = document.createElement('a');

            // Usa encodeURIComponent para evitar problemas com caracteres especiais
            link.href = `/banco/${encodeURIComponent(dbName)}`;
            link.textContent = dbName;
            link.style.cursor = 'pointer';

            li.appendChild(link);
            dbList.appendChild(li);
        }
    }
}