const API_URL = "http://surf.iansimonson.com/api/v1/reports";
const reportElement = document.querySelector('.reports');
const body = document.querySelector('body');

const colors = {
    "Good": "has-background-success",
    "Average": "has-background-info",
};

async function getReport() {
    const response = await fetch(API_URL)
    const json = await response.json();

    console.log(json);

    json.forEach(obj => {
        c = document.createElement('div');
        c.className = "card column is-one-quarter my-3 mx-3";

        cc = document.createElement('div');
        cc.className = "card-content";
        c.appendChild(cc);

        d = document.createElement('div');
        d.className = "content";
        cc.appendChild(d);

        reportElement.appendChild(c);

        h1 = document.createElement('h1');
        h1.textContent = obj["name"];
        h1.className = "title";

        d.appendChild(h1);

        h2 = document.createElement('h2');
        h2.textContent = obj["rating"];
        h2.className = `subtitle ${colors[obj["rating"]]}`;

        d.appendChild(h2);

        obj["description"].split('\n').forEach(text => {
            desc = document.createElement('p');
            desc.textContent = text;
            d.appendChild(desc);
        });

        aut = document.createElement('p');
        aut.textContent = `Report by ${obj["author"]}`;
        d.appendChild(aut);

        footer = document.createElement('footer');
        footer.className = "card-footer";
        t = document.createElement('time');
        t.textContent = `Updated as of ${obj["update_time"]}`;
        t.className = "card-footer-item";

        footer.appendChild(t);
        c.appendChild(footer);
    });

    //body.style = `background-color: ${colors[json["rating"]]}`;
}

getReport();
