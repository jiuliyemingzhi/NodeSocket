let socket = io('127.0.0.1:3000');
$(() => {
    const chatApp = new Chat(socket);
    socket.on('nameResult', (result) => {
        let message;
        if (result.success) {
            message = 'You are now know as ' + result.name + '.';
            chatApp.name = result.name;
        } else {
            message = result.message;
        }
        messagesScroll(message);
    });

    socket.on('joinResult', (result) => {
        $('#room').text(result.room);
        messagesScroll('Room changed');
    });

    socket.on('message', (message) => {
        messagesScroll(message.text);
    });

    socket.on('rooms', (rooms) => {
        let roomList = $('#room-list');
        roomList.empty();
        rooms.forEach(room => {
            roomList.append(divEscapedContentElement(room));
        });

        $('#room-list div').click(function () {
            chatApp.processCommand('/join ' + $(this).text());
            console.log($(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(() => {
        socket.emit('rooms');
    }, 1000);


    $('#send-form').submit(() => {
        processUserInput(chatApp);

    });
    $('#send-message').focus();


});


function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp) {
    let sendMsgForm = $('#send-message');
    let msg = sendMsgForm.val();
    let sysMsg;

    if (msg && msg.charAt(0) === '/') {
        sysMsg = chatApp.processCommand(msg);
    }

    if (sysMsg) {
        $('#messages').append(divSystemContentElement(msg));
    } else {
        chatApp.sendMessage($('#room').text(), msg);
        messagesScroll(chatApp.name + "[you]: " + msg);
    }

    sendMsgForm.val('');
}

function messagesScroll(msg) {
    const messagesDiv = $('#messages');
    messagesDiv.append(divEscapedContentElement(msg));
    messagesDiv.scrollTop(messagesDiv.prop('scrollHeight'));
}

