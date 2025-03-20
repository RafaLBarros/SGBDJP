// Carregar bancos salvos ao carregar a página
window.onload = function () { //Essa função executa logo quando a pagina é carregada
    fetch('/get-databases') //Chama a rota get-databases
        .then(response => response.json()) //pega a resposta como json
        .then(data => { //Pega a data
            databases = data; //Coloca a data como nossa lista de banco de dados
            updateDBList(); //Atualiza a lista de banco de dados
        })
        .catch(error => console.error('Erro ao carregar bancos:', error)); //Se der errado, manda o error no console
};

let databases = {}; //Onde nós armazenamos os bancos de dados

// Criar banco no servidor
function createDatabase() { //Função para criar o banco
    let dbName = document.getElementById('dbName').value; //Pega o nome do banco
    if (dbName) { //Se o nome do banco é valido
        fetch('/create-database', { //Chama o fetch de criar banco
            method: 'POST', //Chama como post para enviar dados
            headers: { 'Content-Type': 'application/json' }, //Bota o tipo como aplicação json
            body: JSON.stringify({ dbName }) //Envia os dados com o nome do banco
        })
        .then(response => response.json()) //Pega a resposta como json
        .then(data => {//Pega os dados
            if (data.success) { //Se foi sucesso
                databases = data.databases; //coloca os bancos de dados na nossa lista de bancos no codigo
                updateDBList(); //Atualiza a lista de bancos
            } else { //Se foi falha
                alert(data.message); //Joga um alerta
            }
        })
        .catch(error => console.error('Erro ao criar banco:', error)); //Se algo der errado solta um error  
    } else {
        alert('Nome do banco inválido!'); //Se nome do banco é invalido, avisa.
    }
}

// Atualizar a lista de bancos na página
function updateDBList() {
    let dbList = document.getElementById('dbList'); //Pega o elemento html dblist
    dbList.innerHTML = ''; // Limpa a lista antes de recriar os itens

    for (let dbName in databases) { //Pra cada nome de banco nos bancos de dados
        if (typeof databases[dbName] === 'object') { // Verifica se é um banco válido
            let li = document.createElement('li'); //Cria um elemento li no html
            let link = document.createElement('a'); //Cria um elemento a no html

            // Usa encodeURIComponent para evitar problemas com caracteres especiais
            link.href = `/banco/${encodeURIComponent(dbName)}`;
            link.textContent = dbName; //Bota o conteudo do link como o nome do banco
            link.style.cursor = 'pointer'; //Muda o mouse quando passa por cima

            li.appendChild(link); //Coloca o link no li
            dbList.appendChild(li); //Coloca o li na lista
        }
    }
}