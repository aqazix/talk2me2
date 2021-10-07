var user;
var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var modal = document.getElementById('modal-wrapper');
var user = JSON.parse(sessionStorage.getItem('user'));
var userForm = document.getElementById('user-form');
var username = document.getElementById('username');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', { message: input.value, id_from: user.id, username: user.username, date: new Date().toISOString() }, response => {
            if (typeof response === 'object') {
                createMessage('Não foi possível enviar a mensagem', 0, true);
            }
        });
        input.value = '';
    }
});

socket.on('chat message', function (msg) {
    const { id_from, id_from_username, message, date } = msg;
    createMessage({ message, id_from, id_from_username, date });
});

userForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (username.value) {
        user = await fetch(`/user/${username.value}`);

        if (user.status !== 200) {
            user = await fetch('/user', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username.value
                })
            }).then(async response => await response.json());
        } else {
            user = await user.json();
        }

        if (user.user) user = user.user;
        sessionStorage.setItem('user', JSON.stringify(user));
        modal.classList.remove('show');
        const { messages } = (await fetch('/message').then(async response => await response.json()));
        messages.forEach(message => createMessage(message));
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    if (!user) {
        modal.classList.add('show');
    } else {
        if (user.user) user = user.user;
        const { messages } = (await fetch('/message').then(async response => await response.json()));
        messages.forEach(message => createMessage(message));
    }
});

function formatDate(timeString) {
    const [hour, minute, _] = timeString.split(":");

    return `${hour}:${minute}`
}

function createMessage(message, error = false) {
    const item = document.createElement('li');
    const { message: message_text, id_from, id_from_username, date } = message;

    if (error) {
        item.classList.add('error');
        item.textContent = message;
    } else {
        if (id_from === user.id) {
            item.classList.add('own');
        }

        const time = new Date(date.replace(/(\..*)/, "") + "+00:00").toLocaleTimeString("pt-BR")

        item.innerHTML = `<div class='message-wrapper${id_from === user.id ? " own'>" : `'><p class='author'><b>${id_from_username}</b></p>`}<p>${message_text}</p><p class='time'>${formatDate(time)}</p></div>`;
    }

    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
};
