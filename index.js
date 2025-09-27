require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // <<-- A MUDANÇA ESTÁ AQUI -->>
app.use(express.json());

// Rota para exibir o roadmap
app.get('/', async (req, res) => {
    const boardId = process.env.TRELLO_BOARD_ID;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    const url = `https://api.trello.com/1/boards/${boardId}/lists?cards=open&card_fields=name,desc,labels,url,idList&checklists=all&key=${apiKey}&token=${apiToken}`;
    try {
        const response = await axios.get(url);
        res.render('roadmap', { lists: response.data });
    } catch (error) {
        console.error('Erro ao buscar dados do Trello:', error.message);
        res.status(500).send('Não foi possível carregar o roadmap.');
    }
});

// --- O RESTANTE DO SEU CÓDIGO CONTINUA IGUAL ---

// Rota para mover o cartão
app.post('/mover-cartao', async (req, res) => {
    const { cardId, newListId } = req.body;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`;
    try {
        await axios.put(url, { idList: newListId });
        res.json({ message: 'Cartão movido com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao mover o cartão.' });
    }
});

// Rota para adicionar um novo cartão completo
app.post('/adicionar-cartao', async (req, res) => {
    const { name, desc, idList, checklistItems } = req.body;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    try {
        const cardResponse = await axios.post(`https://api.trello.com/1/cards?key=${apiKey}&token=${apiToken}`, { name, desc, idList });
        const newCard = cardResponse.data;
        if (checklistItems && checklistItems.length > 0) {
            const checklistResponse = await axios.post(`https://api.trello.com/1/cards/${newCard.id}/checklists?key=${apiKey}&token=${apiToken}`, { name: 'Tarefas' });
            const newChecklist = checklistResponse.data;
            for (const itemName of checklistItems) {
                await axios.post(`https://api.trello.com/1/checklists/${newChecklist.id}/checkItems?key=${apiKey}&token=${apiToken}`, { name: itemName });
            }
        }
        res.status(201).json({ message: 'Cartão criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao criar o cartão.' });
    }
});

// Rota para atualizar o estado de um item da checklist
app.put('/atualizar-checkitem/:cardId/:itemId', async (req, res) => {
    const { cardId, itemId } = req.params;
    const { state } = req.body;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    const url = `https://api.trello.com/1/cards/${cardId}/checkItem/${itemId}?key=${apiKey}&token=${apiToken}`;
    try {
        await axios.put(url, { state });
        res.json({ message: 'Item atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao atualizar o item.' });
    }
});

// Rota para arquivar (remover) um cartão
app.delete('/arquivar-cartao/:cardId', async (req, res) => {
    const { cardId } = req.params;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`;
    try {
        await axios.put(url, { closed: true });
        res.json({ message: 'Cartão arquivado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao arquivar o cartão.' });
    }
});

// Rota para remover um item da checklist
app.delete('/checklist-item/:checklistId/:itemId', async (req, res) => {
    const { checklistId, itemId } = req.params;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    const url = `https://api.trello.com/1/checklists/${checklistId}/checkItems/${itemId}?key=${apiKey}&token=${apiToken}`;
    try {
        await axios.delete(url);
        res.json({ message: 'Item da checklist removido com sucesso!' });
    } catch(error) {
        res.status(500).json({ message: 'Falha ao remover o item da checklist.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});