import asyncio
import json
import websockets
import logging
import sys

logging.basicConfig(level=logging.INFO)

async def connect_to_server():
    uri = "wss://hack.chat/chat-ws"
    server_options = {
        "cmd": "join",
        "nick": "",
        "channel": ""
    }

    async def setup_server_options():
        sys.stdout.write("Welcome to hack.chat\n")
        sys.stdout.write("May I have your name and trip pass? ")
        sys.stdout.flush()
        nickname = await async_input()
        if len(nickname) <= 24:
            server_options["nick"] = nickname
            sys.stdout.write("What channel do you wish to join?: ")
            sys.stdout.flush()
            channel = await async_input()
            server_options["channel"] = channel
        else:
            sys.stdout.write("Invalid username, please try again\n")
            sys.stdout.flush()
            await setup_server_options()

    await setup_server_options()

    try:
        async with websockets.connect(uri) as websocket:
            await websocket.send(json.dumps(server_options))

            async def send_message():
                while True:
                    message = await async_input()
                    await websocket.send(json.dumps({
                        "cmd": "chat",
                        "text": message
                    }))

            async def receive_messages():
                async for message in websocket:
                    await handle_message(json.loads(message))

            async def handle_message(data):
                if data["cmd"] == "chat":
                    sys.stdout.write(f"{data['nick']}: {data['text']}\n")
                    sys.stdout.flush()
                elif data["cmd"] == "warn":
                    if data["text"] == "Nickname taken":
                        sys.stdout.write(data["text"] + "\n")
                        sys.stdout.flush()
                        return
                    sys.stdout.write("Your IP is being rate-limited or blocked.\n")
                    sys.stdout.flush()
                elif data["cmd"] == "onlineSet":
                    sys.stdout.write("Active users: " + str(data["nicks"]) + "\n")
                    sys.stdout.flush()
                elif data["cmd"] == "onlineAdd":
                    sys.stdout.write(data["nick"] + " has entered the chatroom\n")
                    sys.stdout.flush()
                elif data["cmd"] == "onlineRemove":
                    sys.stdout.write(data["nick"] + " has left the chatroom\n")
                    sys.stdout.flush()

            # Start tasks concurrently
            await asyncio.gather(
                send_message(),
                receive_messages()
            )

    except websockets.exceptions.ConnectionClosedError as e:
        sys.stdout.write(f"Connection closed unexpectedly: {e}\n")
        sys.stdout.flush()

async def async_input():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, input)

asyncio.run(connect_to_server())