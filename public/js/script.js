document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.roadmap-container');

    // Funções auxiliares
    const handleResponse = response => {
        if (!response.ok) {
            alert('Ocorreu um erro. A página será recarregada para evitar inconsistências.');
            window.location.reload();
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    };
    const handleError = error => {
        console.error('Erro:', error);
        // Evita recarregar a página em erros simples, a menos que seja crítico
    };

    // Delegação de eventos principal para todas as ações dentro dos cartões e listas
    mainContainer.addEventListener('click', (evt) => {
        // Ação: Marcar/Desmarcar item de checklist salvo
        if (evt.target.matches('.check-item input[type="checkbox"]')) {
            const checkbox = evt.target;
            const itemId = checkbox.id;
            const cardId = checkbox.dataset.cardId;
            const state = checkbox.checked ? 'complete' : 'incomplete';
            
            fetch(`/atualizar-checkitem/${cardId}/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state }),
            })
            .then(handleResponse)
            .then(data => {
                const label = document.querySelector(`label[for="${itemId}"]`);
                label.classList.toggle('completed', state === 'complete');
                console.log(data.message);
            })
            .catch(handleError);
        }

        // Ação: Remover item de checklist SALVO
        if (evt.target.matches('.remove-check-item-btn')) {
            const button = evt.target;
            const checklistId = button.dataset.checklistId;
            const itemId = button.dataset.itemId;
            const checkItemElement = button.closest('.check-item');

            if (confirm('Remover este item da tarefa?')) {
                fetch(`/checklist-item/${checklistId}/${itemId}`, { method: 'DELETE' })
                .then(handleResponse)
                .then(data => {
                    console.log(data.message);
                    checkItemElement.remove();
                })
                .catch(handleError);
            }
        }
        
        // Ação: Arquivar um cartão
        if (evt.target.matches('.archive-card-btn')) {
            const button = evt.target;
            const cardId = button.dataset.cardId;
            const cardElement = button.closest('.card');
            if (confirm('Tem certeza de que deseja arquivar este cartão?')) {
                fetch(`/arquivar-cartao/${cardId}`, { method: 'DELETE' })
                .then(handleResponse)
                .then(data => {
                    console.log(data.message);
                    cardElement.remove();
                })
                .catch(handleError);
            }
        }

        // Ação: Mostrar o formulário de adicionar cartão
        if (evt.target.matches('.show-form-btn')) {
            const composer = evt.target.closest('.add-card-composer');
            composer.querySelector('.add-card-form').classList.remove('hidden');
            composer.querySelector('.show-form-btn').classList.add('hidden');
            composer.querySelector('textarea[name="cardTitle"]').focus();
        }

        // Ação: Cancelar a adição de cartão
        if (evt.target.matches('.cancel-btn')) {
            const composer = evt.target.closest('.add-card-composer');
            composer.querySelector('.add-card-form').classList.add('hidden');
            composer.querySelector('.show-form-btn').classList.remove('hidden');
            composer.querySelector('.checklist-creator').innerHTML = '';
            composer.querySelector('.add-card-form').reset();
        }

        // Ação: Adicionar um novo campo de item de checklist no formulário
        if (evt.target.matches('.add-checklist-item-btn')) {
            const checklistCreator = evt.target.previousElementSibling;
            const newItem = document.createElement('div');
            newItem.classList.add('new-check-item');
            newItem.innerHTML = `<input type="text" placeholder="Adicionar um item"><button type="button" class="remove-new-item-btn">×</button>`;
            checklistCreator.appendChild(newItem);
            newItem.querySelector('input').focus();
        }
        
        // Ação: Remover um novo campo de item de checklist do formulário
        if (evt.target.matches('.remove-new-item-btn')) {
            evt.target.closest('.new-check-item').remove();
        }
    });

    // Lógica para enviar o formulário de adição de cartão
    mainContainer.addEventListener('submit', (evt) => {
        if (evt.target.matches('.add-card-form')) {
            evt.preventDefault();
            const form = evt.target;
            const name = form.querySelector('textarea[name="cardTitle"]').value;
            const desc = form.querySelector('textarea[name="cardDesc"]').value;
            const idList = form.querySelector('input[name="listId"]').value;
            if (!name) return;

            const checklistInputs = form.querySelectorAll('.checklist-creator input[type="text"]');
            const checklistItems = Array.from(checklistInputs).map(input => input.value.trim()).filter(item => item !== '');

            fetch('/adicionar-cartao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, desc, idList, checklistItems }),
            })
            .then(handleResponse)
            .then(() => window.location.reload())
            .catch(handleError);
        }
    });
    
    // Lógica para Arrastar e Soltar (SortableJS)
    document.querySelectorAll('.cards-container').forEach(container => {
        new Sortable(container, {
            group: 'shared', animation: 150, onEnd: evt => {
                const cardId = evt.item.dataset.cardId;
                const newListId = evt.to.parentElement.dataset.listId;
                fetch('/mover-cartao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId, newListId }),
                }).then(handleResponse).then(data => console.log(data.message)).catch(handleError);
            }
        });
    });
});