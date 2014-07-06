dogewand
========

You need to have node and postgres

    git clone https://github.com/jtremback/dogewand.git
    cd dogewand
    npm install

Fill in `config/config.js` using `config/config.example.js` as a guide. You're going to have to create Facebook and Reddit apps, and put their credentials in here. We should probably implement local auth at some point for testing purposes.

    gulp build
    migrations/migrate 001
    node server.js

---

AGPL
