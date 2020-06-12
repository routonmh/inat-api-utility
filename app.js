const axios = require('axios');
const fs = require('fs');
const urlSearchParams = require('url-search-params');

const BASE_URL = "https://api.inaturalist.org/v1/observations";
const API_KEY = "";

const MS_DELAY_BTWN_REQS = 7500;
const PAGE_SIZE = 100;
const AVG_REQ_TIME = 3500;

let searchTerm = "Agave";
let outputFilename = "agave.csv";

(async () => {

    console.log("Requesting some data from iNaturalist . . .");

    let wstream = fs.createWriteStream(outputFilename);


    wstream.on('open', function () {
        console.log('file has been opened');
    });

    wstream.on('finish', function () {
        console.log('file has been written');
    });

    wstream.on('close', function () {
        console.log('file has been closed');
    });

    let firstPageResult = await requestPage(1, 1);

    let totalResults = firstPageResult.resultInfo.totalResults;
    let pageCount = totalResults / PAGE_SIZE;
    console.log(`Fetching ${totalResults} in ${pageCount} pages at ${PAGE_SIZE} results per page will take at least
        ${(pageCount * MS_DELAY_BTWN_REQS + AVG_REQ_TIME) / 1000} seconds.`);

    wstream.open();

    for (let pageIdx = 1; pageIdx < pageCount; pageIdx++) {

        let pageData = await requestPage(pageIdx, PAGE_SIZE);
        let csvStr = "";
        pageData.coordinatesList.map(it => {

            if (it && it.length > 0)
                csvStr += it + "\r\n";
        });

        wstream.write(csvStr);

        await sleep(MS_DELAY_BTWN_REQS);
    }

    wstream.close();

    console.log("Done making requests.");

})();

async function requestPage(page, perPage) {

    console.log(`Requesting result for page #: ${page}`);

    let coordinatesList = [];
    let resultInfo = {
        totalResults: 0
    };

    let params = new URLSearchParams({
        code: API_KEY,
        taxon_name: searchTerm,
        page: page,
        per_page: perPage
    });
    let req = axios.get(`${BASE_URL}?${params.toString()}`);
    let res = await req;

    coordinatesList = res.data.results.map(it => {
        if (it.location)
            return it.location;
        return "";
    });
    let totalResults = res.data.total_results;

    resultInfo.totalResults = totalResults;

    return ({
        resultInfo,
        coordinatesList
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
