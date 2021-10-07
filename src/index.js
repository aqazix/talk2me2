const cors = require("cors");
const database = require("./database");
const express = require("express");
const http = require("http");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/user/:username", async (req, res) => {
    try {
        const { username } = req.params;

        const user = await database("user").where({ username }).first();

        if (user) return res.status(200).send(user);
        else return res.status(404).send();
    } catch (e) {
        console.log(e);

        return res.status(500).json({ error: e });
    }
});

app.post("/user", async (req, res) => {
    let transaction;

    try {
        const { username } = req.body;

        transaction = await database.transaction();

        const id = await transaction("user").insert({
            username
        });

        await transaction.commit();

        return res.status(201).json({ id: id[0], username });
    } catch (e) {
        console.log(e);

        if (transaction) await transaction.rollback();

        return res.status(500).json({ error: e });
    }
});

app.get("/message", async (req, res) => {
    try {
        const messages = await database
            .select(["m.id", "m.message", "m.id_from", "m.date", "u.username as id_from_username"])
            .from("message as m")
            .join("user as u", "m.id_from", "=", "u.id");

        return res.status(200).json({ messages });
    } catch (e) {
        console.log(e);

        return res.status(500).json({ error: e });
    }
})

const server = http.createServer(app);
server.listen(3000);

const io = require("socket.io")(server);
io.on("connection", socket => {
    socket.on("chat message", async (data, callback) => {
        let transaction;

        try {
            const { message, id_from, username } = data;

            transaction = await database.transaction();

            await transaction("message").insert({
                message,
                id_from
            });

            await transaction.commit();

            io.emit("chat message", {
                id_from,
                id_from_username: username,
                message,
                date: new Date()
            });

            callback("ok");
        } catch (e) {
            console.log(e);

            if (transaction) await transaction.rollback();

            callback({ error: e });
        }
    })
})
