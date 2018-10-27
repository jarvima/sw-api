const express = require('express');
const axios = require('axios');
const app = express();

const getNumber = str => {
    const num = parseFloat(str.replace(/,/g, ''));
    return Number.isNaN(num) ? 0 : num;
}

const numComparator = field => (a, b) => getNumber(a[field]) > getNumber(b[field]) ? 1 : -1;

const sorters = {
    name: { comparator: (a, b) => a.name.localeCompare(b.name) },
    height: { comparator: numComparator('height') },
    mass: { comparator: numComparator('mass') },
}

async function getPeople(sorter) {
    let next = 'https://swapi.co/api/people';
    const people = {
        list: [],
        map: {},
    };
    while (next) {
        const response = await axios.get(next);
        next = response.data.next;
        response.data.results.forEach(person => {
            people.list.push(person);
            people.map[person.url] = person;
        });
    }
    if (sorter) {
        people.list.sort(sorter.comparator);
    }
    return people;
}

app.get('/people', (req, res) =>  {
    const sorter = sorters[req.query.sortBy];

    getPeople(sorter).then(people => {
        res.send(people.list);
    })
});

async function getPlanets(people) {
    let next = 'https://swapi.co/api/planets';
    const planets = [];
    while (next) {
        const response = await axios.get(next);
        next = response.data.next;
        response.data.results.forEach(planet => {
            for (let j = 0; j < planet.residents.length; j++) {
                planet.residents[j] = people.map[planet.residents[j]].name;
            }
            planets.push(planet);
        });
    }
    return planets;
}

app.get('/planets', (req, res) =>  {
    getPeople()
    .then(getPlanets)
    .then(planets => {
        res.json(planets)
    })
});

const server = app.listen(3030, () => {
    const host = server.address().address,
    port = server.address().port;

    console.log('API listening at http://%s:%s', host, port);
});
