
const personagensDesejados = [
    {
        nome: "Homer Simpson",
        nomesAPI: ["Homer Simpson"],
        descricao: "Pai da família Simpson, trabalha na usina nuclear e adora rosquinhas."
    },
    {
        nome: "Marge Simpson",
        nomesAPI: ["Marge Simpson"],
        descricao: "Mãe da família, conhecida pelo cabelo azul e por cuidar de todos."
    },
    {
        nome: "Bart Simpson",
        nomesAPI: ["Bart Simpson"],
        descricao: "Filho mais velho, famoso por suas travessuras e por andar de skate."
    },
    {
        nome: "Lisa Simpson",
        nomesAPI: ["Lisa Simpson"],
        descricao: "Inteligente, toca saxofone e defende suas ideias."
    },
    {
        nome: "Maggie Simpson",
        nomesAPI: ["Maggie Simpson"],
        descricao: "A caçula da família, conhecida pela chupeta e pela roupa azul."
    },
    {
        nome: "Krusty, o Palhaço",
        nomesAPI: ["Krusty the Clown", "Krusty"],
        descricao: "Apresentador de televisão conhecido pelo seu programa infantil."
    },
    {
        nome: "Ned Flanders",
        nomesAPI: ["Ned Flanders"],
        descricao: "Vizinho dos Simpsons, simpático e sempre disposto a ajudar."
    },
    {
        nome: "Milhouse Van Houten",
        nomesAPI: ["Milhouse Van Houten"],
        descricao: "Melhor amigo de Bart, conhecido pelos óculos e cabelos azuis."
    },
    {
        nome: "Chefe Wiggum",
        nomesAPI: ["Chief Wiggum", "Clancy Wiggum"],
        descricao: "Chefe da polícia de Springfield."
    },
    {
        nome: "Barney Gumble",
        nomesAPI: ["Barney Gumble"],
        descricao: "Amigo de Homer, conhecido por frequentar a Taverna do Moe."
    },
    {
        nome: "Sr. Burns",
        nomesAPI: [
            "Mr. Burns",
            "Montgomery Burns",
            "Charles Montgomery Burns"
        ],
        descricao: "Proprietário da usina nuclear de Springfield."
    },
    {
        nome: "Apu Nahasapeemapetilon",
        nomesAPI: ["Apu Nahasapeemapetilon", "Apu"],
        descricao: "Dono do mercadinho Kwik-E-Mart de Springfield."
    }
];

const grade = document.querySelector(".grade-personagens");
const campoPesquisa = document.querySelector("#campoPesquisa");
const mensagemPesquisa = document.querySelector("#mensagemPesquisa");

const enderecoAPI = "https://thesimpsonsapi.com/api/characters";
const enderecoImagens = "https://cdn.thesimpsonsapi.com/500";

function normalizar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function buscarTodosPersonagens() {
    const respostaInicial = await fetch(enderecoAPI);

    if (!respostaInicial.ok) {
        throw new Error("Não foi possível acessar a API.");
    }

    const primeiraPagina = await respostaInicial.json();
    const paginas = primeiraPagina.pages || 1;
    const todos = [...(primeiraPagina.results || [])];

    for (let inicio = 2; inicio <= paginas; inicio += 10) {
        const fim = Math.min(inicio + 9, paginas);
        const requisicoes = [];

        for (let pagina = inicio; pagina <= fim; pagina++) {
            requisicoes.push(
                fetch(`${enderecoAPI}?page=${pagina}`).then(resposta => {
                    if (!resposta.ok) {
                        throw new Error(
                            `Erro ao consultar a página ${pagina}.`
                        );
                    }

                    return resposta.json();
                })
            );
        }

        const resultados = await Promise.all(requisicoes);

        resultados.forEach(resultado => {
            todos.push(...(resultado.results || []));
        });
    }

    return todos;
}

function encontrarPersonagem(personagensAPI, nomesPossiveis) {
    return personagensAPI.find(personagem => {
        const nomeAPI = normalizar(personagem.name || "");

        return nomesPossiveis.some(nome => {
            return nomeAPI === normalizar(nome);
        });
    });
}

function criarCartao(configuracao, personagemAPI) {
    const cartao = document.createElement("article");
    cartao.className = "cartao";

    const imagem = document.createElement("img");
    imagem.src = enderecoImagens + personagemAPI.portrait_path;
    imagem.alt = configuracao.nome;
    imagem.loading = "lazy";

    imagem.onerror = function () {
        this.alt = "Imagem indisponível: " + configuracao.nome;
        console.error(
            "Falha ao carregar a imagem:",
            personagemAPI.portrait_path
        );
    };

    const titulo = document.createElement("h3");
    titulo.textContent = configuracao.nome;

    const descricao = document.createElement("p");
    descricao.textContent = configuracao.descricao;

    cartao.append(imagem, titulo, descricao);
    grade.appendChild(cartao);
}

function filtrarPersonagens() {
    const termo = normalizar(campoPesquisa.value);
    const cartoes = grade.querySelectorAll(".cartao");
    let quantidadeVisivel = 0;

    cartoes.forEach(cartao => {
        const nome = normalizar(
            cartao.querySelector("h3").textContent
        );

        const corresponde = nome.includes(termo);

        cartao.style.display = corresponde ? "" : "none";

        if (corresponde) {
            quantidadeVisivel++;
        }
    });

    if (termo !== "" && quantidadeVisivel === 0) {
        mensagemPesquisa.textContent = "Nenhum personagem encontrado.";
    } else if (termo !== "") {
        mensagemPesquisa.textContent =
            `${quantidadeVisivel} personagem(ns) encontrado(s).`;
    } else {
        mensagemPesquisa.textContent = "";
    }
}

async function carregarPersonagens() {
    grade.innerHTML = "<p>Carregando personagens...</p>";

    try {
        const personagensAPI = await buscarTodosPersonagens();
        grade.innerHTML = "";

        personagensDesejados.forEach(configuracao => {
            const personagemAPI = encontrarPersonagem(
                personagensAPI,
                configuracao.nomesAPI
            );

            if (personagemAPI && personagemAPI.portrait_path) {
                criarCartao(configuracao, personagemAPI);
            } else {
                console.warn(
                    "Personagem não encontrado na API:",
                    configuracao.nome
                );
            }
        });

        filtrarPersonagens();
    } catch (erro) {
        console.error("Erro ao carregar personagens:", erro);

        grade.innerHTML =
            "<p>Não foi possível carregar os personagens. " +
            "Verifique sua conexão e tente atualizar a página.</p>";
    }
}

campoPesquisa.addEventListener("input", filtrarPersonagens);

carregarPersonagens();
