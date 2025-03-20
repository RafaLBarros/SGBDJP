// Captura o nome do banco e da tabela da URL
function getTableInfo() {
    let path = window.location.pathname; //Pega o caminho
    let parts = path.split('/'); //Separa o caminho pelas barras
    let dbName = decodeURIComponent(parts[2]); //Pega a primeira parte que é o banco de dados
    let tableName = decodeURIComponent(parts[3]); //Pega a segunda parte que é a tabela
    return { dbName, tableName }; //Retorna ambos
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM totalmente carregado!");
    let { dbName, tableName } = getTableInfo();
    console.log("Tabela: ", tableName); // Verifique se tableName está correto
    document.getElementById('tableTitle').textContent = `Tabela: ${tableName}`;

    // Carregar dados da tabela
    fetch(`/get-table-data?dbName=${dbName}&tableName=${tableName}`) //Fetch pra pegar os dados da tabela
        .then(response => response.json()) //Transforma em json
        .then(data => { 
            console.log(data); // Print pra debug, não é necessario.
            if (data.success) {
                // Atualiza os campos do formulário de inserção
                updateTableHeader(data.keys); //Da update do cabeçalho com as chaves
                updateTableBody(data.rows);  //Da update no corpo com os dados
                updateFormFields(data.keys); //Da update nos formularios com as chaves
            } else {
                alert(data.message);  // Exibe o erro de tabela não encontrada
            }
        })
        .catch(error => console.error('Erro ao carregar tabela:', error));
});

// Atualizar o cabeçalho da tabela com as chaves
function updateTableHeader(keys) {
    let header = document.getElementById('tableHeader'); //Pega o header do html
    header.innerHTML = '';  //Limpa o header
    keys.forEach(key => { //Pra cada chave
        let th = document.createElement('th'); //Cria um elemento th no html
        th.textContent = key.name; //Insere a chave como conteudo desse th
        header.appendChild(th); //Coloca o th no cabeçalho
    });
}

// Atualizar o corpo da tabela com os dados
function updateTableBody(rows) {
    let tableBody = document.getElementById('table-body'); //Pega o corpo do html
    tableBody.innerHTML = ''; // Limpa o corpo

    rows.forEach(row => { //Pra cada linha de dado
        let rowElement = document.createElement('tr'); //Cria um elemento tr no html
        Object.values(row).forEach(value => { //Pra cada valor da linha de dados
            let td = document.createElement('td'); //Cria um elemento td no html
            td.textContent = value; //Insere o valor do dado no conteudo do td
            rowElement.appendChild(td); //Coloca o td no tr
        });
        tableBody.appendChild(rowElement);//Coloca o tr no corpo da página
    });
}

// Atualizar o formulário com os campos necessários
function updateFormFields(keys) {
    let formFields = document.getElementById('formFields'); //Pega o campo de formulario do html
    formFields.innerHTML = ''; // Limpa o formulário

    keys.forEach(key => { //Pra cada chave
        let label = document.createElement('label');  //Cria uma label no html
        label.textContent = key.name; //Coloca o nome da chave nessa label
        let input = document.createElement('input'); //Cria um input
        input.type = 'text'; //Coloca o tipo desse input como texto
        input.name = key.name; //Coloca o nome desse input como o nome da chave
        input.dataset.type = key.type;  // Armazena o tipo do campo
        formFields.appendChild(label); //Coloca o label no campo de formulario
        formFields.appendChild(input); //Coloca o input no campo de formulario
    });
}

// Função para validar os tipos dos dados inseridos
function validateData(data, keys) {
    for (let key of keys) { //Pra cada chave de chaves
        let value = data[key.name]; //Pega o valor das respectivas chaves
        let type = key.type; //Pega o tipo da chave

        if (type === 'number' && isNaN(value)) { //Checa se é number
            alert(`O campo ${key.name} deve ser um número.`);
            return false;
        } else if (type === 'boolean' && value !== 'true' && value !== 'false') { //Checa se é boolean
            alert(`O campo ${key.name} deve ser um valor booleano (true ou false).`);
            return false;
        } else if (type === 'text' && typeof value !== 'string') { //Checa se é text
            alert(`O campo ${key.name} deve ser um texto.`);
            return false;
        }
    }
    return true;
}

// Inserir dados na tabela
document.getElementById('insertDataForm').addEventListener('submit', function (event) { //Executa quando o usuário aperta o botão de inserir dados
    event.preventDefault();

    let { dbName, tableName } = getTableInfo(); //Pega o banco e da tabela
    let formData = new FormData(this); //Cria um formData que recebe os dados dos formularios
    let data = {}; //Cria um dicionario data

    formData.forEach((value, key) => {
        data[key] = value; //Pra cada valor e chave de formData, coloca eles no dicionario ordenados por chave.
    });

    fetch(`/get-table-data?dbName=${dbName}&tableName=${tableName}`) //Faz o fetch pra pegar os dados da tabela
        .then(response => response.json()) //Transforma a resposta em JSON
        .then(tableData => {
            if (validateData(data, tableData.keys)) { //Valida os dados usando a função
                fetch('/insert-data', { //Faz o fetch pra inserir os dados
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dbName, tableName, data }) //Passa o banco, a tabela e os dados pro fetch
                })
                .then(response => response.json()) //Transforma a resposta em JSON
                .then(data => {
                    if (data.success) {
                        alert('Dados inseridos com sucesso!');
                        updateTableBody(data.table); // Se deu certo, atualiza a tabela com os dados inseridos
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => console.error('Erro ao inserir dados:', error));
            }
        });
});

// Voltar para a página do banco
function voltar() {
    let { dbName } = getTableInfo();
    window.location.href = `/banco/${dbName}`;
}