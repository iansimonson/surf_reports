require('dotenv').config();
const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const rate_limit = require('express-rate-limit');
const slow_down = require('express-slow-down');
const cors = require('cors');

const app = express();
app.enable('trust proxy');
app.use(cors());
const port = process.env.PORT || 4500;
const REPORTS_URL = process.env.REPORTS_URL;
const all_endpoint = '/surf-cams-surf-reports';

let update_time = 0;
const timer_interval = 1000 * 60 * 60 * 3; // 3 hours
const minimum_update_interval = 1000 * 60 * 30; // 30 minutes

let reports = [];

const get_one_report = (link, report) => {
    const $ = cheerio.load(report);
    const author = $('.surfReport > div > a').text().trim();
    const rating = $('.surfReport > ul:nth-child(2) > li:nth-child(1) > h4 > strong').text().trim();
    const stars = $('.starLarge').attr('class').split(' ')[1].replace('sprite-', '').trim();
    const description = (() => {
        let d = '';
        $('.surfReport > ul:nth-child(2) > li:nth-child(1) > p').each((i, el) => {
            d += $(el).text();
        });
        d.trim();
        return d;
    })();

    const arr = link.split('/');
    const name = arr[arr.length - 1];

    return {
        "name": name,
        "author": author,
        "rating": rating,
        "stars": stars,
        "description": description,
        "update_time": Date(update_time),
        "source": `${REPORTS_URL}${link}`
    };
};

const get_all_reports = async () => {
    const current_time = Number(Date.now());
    if (current_time - update_time > minimum_update_interval) {
        try {
            update_time = current_time;
            console.log('Checking for updates')
            const response = await axios.get(`${REPORTS_URL}${all_endpoint}`);
            const $ = cheerio.load(response.data);

            let sydney_list;
            $('.camListing > div.floatLeft').each((i, el) => {
                const h3 = $('h3', el);
                if (h3.html() !== 'Sydney') {
                    return;
                }
                sydney_list = el;
            });
            let links = [];
            $('li > a', sydney_list).each((i, link) => {
                const endpoint = $(link).attr('href');
                links.push(endpoint);
            });


            await Promise.all(links.map(async (endpoint) => {
                const arr = endpoint.split('/');
                const name = arr[arr.length - 1];
                const beach_report = await axios.get(`${REPORTS_URL}${endpoint}`);
                const report = get_one_report(endpoint, beach_report.data);
                reports = reports.filter(el => el.name !== name);
                reports.push(report);
            }));
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log('No need to update');
    }

};

const limiter = rate_limit({
    windowMs: 30 * 1000, // 30 seconds
    max: 5 // limit each ip to 5 requests per 30 seconds
});

const slower = slow_down({
    windowMs: 30 * 1000, // 30 seconds
    delayAfter: 1, // start slowing down immediately
    delayMs: 500
});

app.use(express.static('client'));


app.get('/api/v1/reports', limiter, slower, async (req, res) => {
    res.json(reports);
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
    console.log('Downloading reports');
    get_all_reports().then(console.log('Done'))
        .then((value) => {
            console.log('Setting up recurring timer');
            setInterval(get_all_reports, timer_interval);
            console.log('Done');
        });
});
